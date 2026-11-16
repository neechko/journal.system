import type {
  ArticleVersion,
  ArticleAuthor,
} from "../domain/article-version";
import type { Volume, Issue, ArticleInIssue } from "../domain/issue-volume";
import type { DoiRegistration } from "../domain/doi";
import type { JatsArticle } from "../domain/jats";

export type { ArticleVersion, ArticleAuthor } from "../domain/article-version";
export type { Volume, Issue, ArticleInIssue } from "../domain/issue-volume";

export type { CreateArticleVersionInput } from "./validation";
export type { UpdateArticleVersionInput } from "./validation";
export type { TransitionArticleStatusInput } from "./validation";
export type { AssignDoiInput } from "./validation";
export type { CreateVolumeInput } from "./validation";
export type { CreateIssueInput } from "./validation";
export type { UpdateIssueInput } from "./validation";
export type { TransitionIssueStatusInput } from "./validation";
export type { AddArticleToIssueInput } from "./validation";
export type { RegisterDoiInput } from "./validation";

export interface ProductionSubmission {
  id: string;
  organizationId: string;
  journalId: string;
  title: string;
  abstract: string | null;
  keywords: string[];
  status: string;
  createdBy: string;
  submittedAt: Date | null;
  submittedManuscriptVersion: number | null;
  currentManuscriptVersion: number;
  authors: SubmissionAuthor[];
}

export interface SubmissionAuthor {
  id: string;
  userId: string;
  name: string;
  email: string;
  affiliation: string | null;
  orcid: string | null;
  isCorresponding: boolean;
  order: number;
}

export interface ProductionTransaction {
  findSubmissionForProduction(
    productionUserId: string,
    submissionId: string
  ): Promise<ProductionSubmission | null>;

  listAcceptedSubmissions(
    productionUserId: string,
    journalId: string
  ): Promise<ProductionSubmission[]>;

  createArticleVersion(
    submissionId: string,
    version: number,
    title: string,
    abstract: string | null,
    keywords: string[],
    authors: ArticleAuthor[]
  ): Promise<ArticleVersion>;

  updateArticleVersion(
    articleId: string,
    updates: Partial<Pick<ArticleVersion, "title" | "abstract" | "keywords" | "authors" | "xmlContent" | "htmlContent">>
  ): Promise<ArticleVersion>;

  transitionArticleStatus(
    articleId: string,
    newStatus: ArticleVersion["status"],
    actorUserId: string
  ): Promise<ArticleVersion>;

  assignDoi(articleId: string, doi: string): Promise<ArticleVersion>;
  setManuscriptFile(articleId: string, fileId: string): Promise<ArticleVersion>;
  setPdfFile(articleId: string, fileId: string): Promise<ArticleVersion>;

  createVolume(
    journalId: string,
    number: number,
    year: number,
    label: string | null
  ): Promise<Volume>;

  createIssue(
    journalId: string,
    number: number,
    year: number,
    options: { volumeId?: string | null; label?: string | null; description?: string | null }
  ): Promise<Issue>;

  updateIssue(
    issueId: string,
    updates: Partial<Pick<Issue, "label" | "description" | "coverImageFileId" | "volumeId">>
  ): Promise<Issue>;

  transitionIssueStatus(
    issueId: string,
    newStatus: Issue["status"],
    actorUserId: string
  ): Promise<Issue>;

  addArticleToIssue(
    articleId: string,
    issueId: string,
    options: { pageStart?: number | null; pageEnd?: number | null; order: number; articleType?: string | null }
  ): Promise<ArticleInIssue>;

  removeArticleFromIssue(articleId: string, issueId: string): Promise<void>;

  getArticleWithIssue(articleId: string): Promise<{ article: ArticleVersion; issue: Issue | null; volume: Volume | null } | null>;

  listIssuesForJournal(journalId: string): Promise<Issue[]>;

  listVolumesForJournal(journalId: string): Promise<Volume[]>;

  registerDoi(
    articleId: string,
    registration: DoiRegistration
  ): Promise<void>;

  insertAuditEvent(event: ProductionAuditEventInput): Promise<void>;
}

export interface ProductionAuditEventInput {
  organizationId: string;
  actorUserId: string;
  action: string;
  entityType: "article_version" | "issue" | "volume" | "doi";
  entityId: string;
  reason: string;
  actorType?: "human" | "system" | "ai";
  stateBefore?: string | null;
  stateAfter?: string | null;
  source?: string;
  correlationId?: string | null;
}

export interface ProductionRepository {
  transaction<T>(work: (tx: ProductionTransaction) => Promise<T>): Promise<T>;

  findSubmissionForProduction(
    productionUserId: string,
    submissionId: string
  ): Promise<ProductionSubmission | null>;

  listAcceptedSubmissions(
    productionUserId: string,
    journalId: string
  ): Promise<ProductionSubmission[]>;

  findArticleVersion(articleId: string): Promise<ArticleVersion | null>;
  findArticleVersionBySubmission(submissionId: string): Promise<ArticleVersion | null>;

  findIssue(issueId: string): Promise<Issue | null>;
  findVolume(volumeId: string): Promise<Volume | null>;

  listIssuesForJournal(journalId: string): Promise<Issue[]>;
  listVolumesForJournal(journalId: string): Promise<Volume[]>;

  getArticleWithIssue(articleId: string): Promise<{ article: ArticleVersion; issue: Issue | null; volume: Volume | null } | null>;
}