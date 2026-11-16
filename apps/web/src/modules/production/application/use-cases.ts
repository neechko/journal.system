import { randomUUID } from "node:crypto";
import { AppError } from "@/modules/shared/app-error";
import type { TenancyRepository } from "@/modules/tenancy/application/ports";
import { getOrganizationWorkspace } from "@/modules/tenancy/application/use-cases";
import type {
  ProductionRepository,
  ProductionTransaction,
  CreateArticleVersionInput,
  UpdateArticleVersionInput,
  TransitionArticleStatusInput,
  AssignDoiInput,
  CreateVolumeInput,
  CreateIssueInput,
  UpdateIssueInput,
  TransitionIssueStatusInput,
  AddArticleToIssueInput,
  RegisterDoiInput,
  ProductionSubmission,
  ArticleVersion,
  Volume,
  Issue,
  ArticleAuthor,
} from "./ports";
import {
  createArticleVersion,
  updateArticleVersion,
  transitionArticleStatus,
  assignDoi,
  setManuscriptFile,
  setPdfFile,
  type ArticleVersion as DomainArticleVersion,
} from "../domain/article-version";
import {
  createVolume,
  createIssue,
  updateIssue,
  transitionIssueStatus,
  type Volume as DomainVolume,
  type Issue as DomainIssue,
} from "../domain/issue-volume";
import {
  createDoiRegistration,
  buildCrossrefXml,
  type DoiRegistration,
} from "../domain/doi";

async function assertProductionAccess(
  tenancyRepository: TenancyRepository,
  userId: string,
  journalId: string
): Promise<string> {
  const workspace = await getOrganizationWorkspace(tenancyRepository, userId, journalId);
  if (!workspace) {
    throw new AppError("FORBIDDEN", "Production access denied for this journal.");
  }
  return workspace.organization.id;
}

async function assertProductionAccessBySubmission(
  tenancyRepository: TenancyRepository,
  userId: string,
  submission: { journalId: string }
): Promise<string> {
  return assertProductionAccess(tenancyRepository, userId, submission.journalId);
}

export async function createArticleVersionUseCase(
  repository: ProductionRepository,
  tenancyRepository: TenancyRepository,
  actorUserId: string,
  input: CreateArticleVersionInput
): Promise<ArticleVersion> {
  const { submissionId, title, abstract, keywords, authors } = input;

  const submission = await repository.findSubmissionForProduction(actorUserId, submissionId);
  if (!submission) {
    throw new AppError("NOT_FOUND", "Submission not found or access denied.");
  }

  if (submission.status !== "accepted") {
    throw new AppError("INVALID_STATE", "Article version can only be created for accepted submissions.");
  }

  await assertProductionAccessBySubmission(tenancyRepository, actorUserId, submission);

  const authorsWithIds: ArticleAuthor[] = authors.map((a) => ({
    id: randomUUID(),
    userId: a.userId ?? null,
    name: a.name,
    email: a.email ?? null,
    affiliation: a.affiliation ?? null,
    orcid: a.orcid ?? null,
    isCorresponding: a.isCorresponding,
    order: a.order,
  }));

  const article = createArticleVersion(submissionId, 1, title, abstract ?? null, keywords ?? [], authorsWithIds);

  return repository.transaction(async (tx) => {
    const created = await tx.createArticleVersion(
      submissionId,
      1,
      title,
      abstract ?? null,
      keywords ?? [],
      authorsWithIds
    );

    await tx.insertAuditEvent({
      organizationId: submission.organizationId,
      actorUserId,
      action: "article_version.created",
      entityType: "article_version",
      entityId: created.id,
      reason: "Created article version from accepted submission.",
      actorType: "human",
      stateBefore: null,
      stateAfter: "draft",
      source: "production_workspace",
      correlationId: null,
    });

    return created;
  });
}

export async function updateArticleVersionUseCase(
  repository: ProductionRepository,
  tenancyRepository: TenancyRepository,
  actorUserId: string,
  input: UpdateArticleVersionInput
): Promise<ArticleVersion> {
  const { articleId, ...updates } = input;

  const article = await repository.findArticleVersion(articleId);
  if (!article) {
    throw new AppError("NOT_FOUND", "Article version not found.");
  }

  const submission = await repository.findSubmissionForProduction(actorUserId, article.submissionId);
  if (!submission) {
    throw new AppError("FORBIDDEN", "Access denied to this article.");
  }

  await assertProductionAccessBySubmission(tenancyRepository, actorUserId, submission);

  if (!canEditArticle(article)) {
    throw new AppError("INVALID_STATE", "Cannot edit article in current state.");
  }

  // Convert authors from validation schema to domain type if present
  const domainUpdates = { ...updates };
  if (updates.authors) {
    domainUpdates.authors = updates.authors.map((a) => ({
      id: a.id,
      userId: (a.userId ?? null) as string | null,
      name: a.name,
      email: (a.email ?? null) as string | null,
      affiliation: (a.affiliation ?? null) as string | null,
      orcid: (a.orcid ?? null) as string | null,
      isCorresponding: a.isCorresponding,
      order: a.order,
    })) as ArticleAuthor[];
  }

  return repository.transaction(async (tx) => {
    const updated = await tx.updateArticleVersion(articleId, domainUpdates as Parameters<typeof tx.updateArticleVersion>[1]);

    await tx.insertAuditEvent({
      organizationId: submission.organizationId,
      actorUserId,
      action: "article_version.updated",
      entityType: "article_version",
      entityId: articleId,
      reason: "Updated article metadata.",
      actorType: "human",
      stateBefore: article.status,
      stateAfter: article.status,
      source: "production_workspace",
      correlationId: null,
    });

    return updated;
  });
}

export async function transitionArticleStatusUseCase(
  repository: ProductionRepository,
  tenancyRepository: TenancyRepository,
  input: TransitionArticleStatusInput
): Promise<ArticleVersion> {
  const { articleId, newStatus, actorUserId } = input;

  const article = await repository.findArticleVersion(articleId);
  if (!article) {
    throw new AppError("NOT_FOUND", "Article version not found.");
  }

  const submission = await repository.findSubmissionForProduction(actorUserId, article.submissionId);
  if (!submission) {
    throw new AppError("FORBIDDEN", "Access denied to this article.");
  }

  await assertProductionAccessBySubmission(tenancyRepository, actorUserId, submission);

  if (newStatus === "published" && !isArticleReadyForPublication(article)) {
    throw new AppError("INVALID_STATE", "Article is not ready for publication. Requires DOI and PDF.");
  }

  const oldStatus = article.status;
  const updatedArticle = transitionArticleStatus(article, newStatus, actorUserId);

  return repository.transaction(async (tx) => {
    const updated = await tx.transitionArticleStatus(articleId, newStatus, actorUserId);

    await tx.insertAuditEvent({
      organizationId: submission.organizationId,
      actorUserId,
      action: `article_version.status_${newStatus}`,
      entityType: "article_version",
      entityId: articleId,
      reason: `Changed article status from ${oldStatus} to ${newStatus}.`,
      actorType: "human",
      stateBefore: oldStatus,
      stateAfter: newStatus,
      source: "production_workspace",
      correlationId: null,
    });

    return updated;
  });
}

export async function assignDoiUseCase(
  repository: ProductionRepository,
  tenancyRepository: TenancyRepository,
  actorUserId: string,
  input: AssignDoiInput
): Promise<ArticleVersion> {
  const { articleId, doi } = input;

  const article = await repository.findArticleVersion(articleId);
  if (!article) {
    throw new AppError("NOT_FOUND", "Article version not found.");
  }

  const submission = await repository.findSubmissionForProduction(actorUserId, article.submissionId);
  if (!submission) {
    throw new AppError("FORBIDDEN", "Access denied to this article.");
  }

  await assertProductionAccessBySubmission(tenancyRepository, actorUserId, submission);

  if (article.doi) {
    throw new AppError("CONFLICT", "Article already has a DOI assigned.");
  }

  const updatedArticle = assignDoi(article, doi);

  return repository.transaction(async (tx) => {
    const updated = await tx.assignDoi(articleId, doi);

    await tx.insertAuditEvent({
      organizationId: submission.organizationId,
      actorUserId,
      action: "article_version.doi_assigned",
      entityType: "article_version",
      entityId: articleId,
      reason: `Assigned DOI: ${doi}`,
      actorType: "human",
      stateBefore: article.status,
      stateAfter: article.status,
      source: "production_workspace",
      correlationId: null,
    });

    return updated;
  });
}

export async function createVolumeUseCase(
  repository: ProductionRepository,
  tenancyRepository: TenancyRepository,
  actorUserId: string,
  input: CreateVolumeInput
): Promise<Volume> {
  const { journalId, number, year, label } = input;

  await assertProductionAccess(tenancyRepository, actorUserId, journalId);

  const existing = await repository.listVolumesForJournal(journalId);
  if (existing.some((v) => v.number === number)) {
    throw new AppError("CONFLICT", `Volume ${number} already exists for this journal.`);
  }

  const volume = createVolume(journalId, number, year, label ?? null);

  return repository.transaction(async (tx) => {
    const created = await tx.createVolume(journalId, number, year, label ?? null);

    await tx.insertAuditEvent({
      organizationId: (await tx.findSubmissionForProduction(actorUserId, ""))?.organizationId ?? "",
      actorUserId,
      action: "volume.created",
      entityType: "volume",
      entityId: created.id,
      reason: `Created volume ${number} (${year}).`,
      actorType: "human",
      stateBefore: null,
      stateAfter: "created",
      source: "production_workspace",
      correlationId: null,
    });

    return created;
  });
}

export async function createIssueUseCase(
  repository: ProductionRepository,
  tenancyRepository: TenancyRepository,
  actorUserId: string,
  input: CreateIssueInput
): Promise<Issue> {
  const { journalId, number, year, volumeId, label, description } = input;

  await assertProductionAccess(tenancyRepository, actorUserId, journalId);

  if (volumeId) {
    const volume = await repository.findVolume(volumeId);
    if (!volume || volume.journalId !== journalId) {
      throw new AppError("NOT_FOUND", "Volume not found or does not belong to this journal.");
    }
  }

  const existing = await repository.listIssuesForJournal(journalId);
  if (existing.some((i) => i.number === number && i.volumeId === volumeId && i.year === year)) {
    throw new AppError("CONFLICT", `Issue ${number} already exists for this volume/year.`);
  }

  const issue = createIssue(journalId, number, year, { volumeId, label, description });

  return repository.transaction(async (tx) => {
    const created = await tx.createIssue(journalId, number, year, { volumeId, label, description });

    await tx.insertAuditEvent({
      organizationId: (await tx.findSubmissionForProduction(actorUserId, ""))?.organizationId ?? "",
      actorUserId,
      action: "issue.created",
      entityType: "issue",
      entityId: created.id,
      reason: `Created issue ${number} (${year})${volumeId ? ` in volume ${volumeId}` : ""}.`,
      actorType: "human",
      stateBefore: null,
      stateAfter: "planned",
      source: "production_workspace",
      correlationId: null,
    });

    return created;
  });
}

export async function updateIssueUseCase(
  repository: ProductionRepository,
  tenancyRepository: TenancyRepository,
  actorUserId: string,
  input: UpdateIssueInput
): Promise<Issue> {
  const { issueId, ...updates } = input;

  const issue = await repository.findIssue(issueId);
  if (!issue) {
    throw new AppError("NOT_FOUND", "Issue not found.");
  }

  await assertProductionAccess(tenancyRepository, actorUserId, issue.journalId);

  if (!canModifyIssue(issue)) {
    throw new AppError("INVALID_STATE", "Cannot modify issue in current state.");
  }

  return repository.transaction(async (tx) => {
    const updated = await tx.updateIssue(issueId, updates);

    await tx.insertAuditEvent({
      organizationId: (await tx.findSubmissionForProduction(actorUserId, ""))?.organizationId ?? "",
      actorUserId,
      action: "issue.updated",
      entityType: "issue",
      entityId: issueId,
      reason: "Updated issue metadata.",
      actorType: "human",
      stateBefore: issue.status,
      stateAfter: issue.status,
      source: "production_workspace",
      correlationId: null,
    });

    return updated;
  });
}

export async function transitionIssueStatusUseCase(
  repository: ProductionRepository,
  tenancyRepository: TenancyRepository,
  input: TransitionIssueStatusInput
): Promise<Issue> {
  const { issueId, newStatus, actorUserId } = input;

  const issue = await repository.findIssue(issueId);
  if (!issue) {
    throw new AppError("NOT_FOUND", "Issue not found.");
  }

  await assertProductionAccess(tenancyRepository, actorUserId, issue.journalId);

  const oldStatus = issue.status;
  const updatedIssue = transitionIssueStatus(issue, newStatus, actorUserId);

  return repository.transaction(async (tx) => {
    const updated = await tx.transitionIssueStatus(issueId, newStatus, actorUserId);

    await tx.insertAuditEvent({
      organizationId: (await tx.findSubmissionForProduction(actorUserId, ""))?.organizationId ?? "",
      actorUserId,
      action: `issue.status_${newStatus}`,
      entityType: "issue",
      entityId: issueId,
      reason: `Changed issue status from ${oldStatus} to ${newStatus}.`,
      actorType: "human",
      stateBefore: oldStatus,
      stateAfter: newStatus,
      source: "production_workspace",
      correlationId: null,
    });

    return updated;
  });
}

export async function addArticleToIssueUseCase(
  repository: ProductionRepository,
  tenancyRepository: TenancyRepository,
  actorUserId: string,
  input: AddArticleToIssueInput
): Promise<void> {
  const { articleId, issueId, pageStart, pageEnd, order, articleType } = input;

  const article = await repository.findArticleVersion(articleId);
  if (!article) {
    throw new AppError("NOT_FOUND", "Article version not found.");
  }

  const issue = await repository.findIssue(issueId);
  if (!issue) {
    throw new AppError("NOT_FOUND", "Issue not found.");
  }

  await assertProductionAccess(tenancyRepository, actorUserId, issue.journalId);

  if (article.status !== "proof_approved" && article.status !== "published") {
    throw new AppError("INVALID_STATE", "Only proof-approved or published articles can be added to an issue.");
  }

  if (issue.status !== "planned" && issue.status !== "in_progress") {
    throw new AppError("INVALID_STATE", "Cannot add articles to issue in current state.");
  }

  return repository.transaction(async (tx) => {
    await tx.addArticleToIssue(articleId, issueId, { pageStart, pageEnd, order, articleType });

    await tx.insertAuditEvent({
      organizationId: (await tx.findSubmissionForProduction(actorUserId, ""))?.organizationId ?? "",
      actorUserId,
      action: "issue.article_added",
      entityType: "issue",
      entityId: issueId,
      reason: `Added article ${articleId} to issue.`,
      actorType: "human",
      stateBefore: issue.status,
      stateAfter: issue.status,
      source: "production_workspace",
      correlationId: null,
    });
  });
}

export async function registerDoiUseCase(
  repository: ProductionRepository,
  tenancyRepository: TenancyRepository,
  actorUserId: string,
  input: RegisterDoiInput
): Promise<string> {
  const { articleId, prefix, title, authors, publicationDate, journalTitle, journalIssn, journalIssnElectronic, volume, issue, pageStart, pageEnd, articleType, url, license } = input;

  const article = await repository.findArticleVersion(articleId);
  if (!article) {
    throw new AppError("NOT_FOUND", "Article version not found.");
  }

  const submission = await repository.findSubmissionForProduction(actorUserId, article.submissionId);
  if (!submission) {
    throw new AppError("FORBIDDEN", "Access denied to this article.");
  }

  await assertProductionAccessBySubmission(tenancyRepository, actorUserId, submission);

  if (article.doi) {
    throw new AppError("CONFLICT", "Article already has a DOI.");
  }

  const doiSuffix = generateDoiSuffix(articleId);
  const doi = `10.${prefix}/${doiSuffix}`;

  const registration = createDoiRegistration(
    {
      id: articleId,
      title,
      authors: authors.map((a) => ({
        name: `${a.givenName} ${a.familyName}`,
        orcid: (a.orcid ?? null) as string | null,
        affiliation: (a.affiliation ?? null) as string | null,
        isCorresponding: a.sequence === "first",
        order: a.sequence === "first" ? 1 : 2,
      })),
      publishedAt: new Date(publicationDate),
      journal: { title: journalTitle, issnPrint: (journalIssn ?? null) as string | null, issnElectronic: (journalIssnElectronic ?? null) as string | null },
      volume: volume ? { number: parseInt(volume), year: new Date(publicationDate).getFullYear() } : null,
      issue: issue ? { number: parseInt(issue), year: new Date(publicationDate).getFullYear() } : null,
      pageStart: pageStart ? parseInt(pageStart) : null,
      pageEnd: pageEnd ? parseInt(pageEnd) : null,
      articleType,
      url,
      license: (license ?? null) as string | null,
    },
    prefix
  );

  const xml = buildCrossrefXml(registration);

  return repository.transaction(async (tx) => {
    await tx.registerDoi(articleId, registration);

    await tx.insertAuditEvent({
      organizationId: submission.organizationId,
      actorUserId,
      action: "article_version.doi_registered",
      entityType: "doi",
      entityId: doi,
      reason: `Registered DOI with Crossref: ${doi}`,
      actorType: "human",
      stateBefore: null,
      stateAfter: "registered",
      source: "production_workspace",
      correlationId: null,
    });

    return doi;
  });
}

export async function listAcceptedSubmissionsUseCase(
  repository: ProductionRepository,
  tenancyRepository: TenancyRepository,
  userId: string,
  journalId: string
): Promise<ProductionSubmission[]> {
  await assertProductionAccess(tenancyRepository, userId, journalId);
  return repository.listAcceptedSubmissions(userId, journalId);
}

export async function getArticleWithIssueUseCase(
  repository: ProductionRepository,
  articleId: string
): Promise<{ article: ArticleVersion; issue: Issue | null; volume: Volume | null } | null> {
  return repository.getArticleWithIssue(articleId);
}

// Re-export domain helpers
import { canEditArticle, isArticleReadyForPublication } from "../domain/article-version";
import { canModifyIssue } from "../domain/issue-volume";
import { generateDoiSuffix } from "../domain/doi";