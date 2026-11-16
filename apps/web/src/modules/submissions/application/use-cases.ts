import { AppError } from "@/modules/shared/app-error";
import type { TenancyRepository } from "@/modules/tenancy/application/ports";
import { getPublishedJournalReference } from "@/modules/tenancy/application/use-cases";
import type {
  AuthorSubmission,
  DraftSubmission,
  ManuscriptFile,
  PrivateSubmissionStorage,
  SubmissionRepository,
} from "./ports";
import { isPdfPayload, MAX_MANUSCRIPT_BYTES } from "./file-validation";
import type {
  CreateDraftSubmissionInput,
  UpdateDraftSubmissionInput,
} from "./validation";

export async function createDraftSubmission(
  repository: SubmissionRepository,
  tenancyRepository: TenancyRepository,
  actorUserId: string,
  input: CreateDraftSubmissionInput,
): Promise<string> {
  const journal = await getPublishedJournalReference(
    tenancyRepository,
    input.organizationSlug,
    input.journalSlug,
  );
  if (!journal) {
    throw new AppError("NOT_FOUND", "Published journal not found.");
  }

  return repository.transaction(async (transaction) => {
    const submission = await transaction.insertDraftSubmission(
      actorUserId,
      journal,
      input,
    );
    await transaction.insertAuditEvent({
      organizationId: journal.organizationId,
      actorUserId,
      action: "submission.draft_created",
      entityType: "submission",
      entityId: submission.id,
      reason: "Author saved a draft submission.",
    });
    return submission.id;
  });
}

export async function getDraftSubmission(
  repository: SubmissionRepository,
  actorUserId: string,
  submissionId: string,
) {
  return repository.findDraftSubmissionForAuthor(actorUserId, submissionId);
}

export async function listDraftSubmissions(
  repository: SubmissionRepository,
  actorUserId: string,
) {
  return repository.listDraftSubmissionsForAuthor(actorUserId);
}

export async function getSubmissionForAuthor(
  repository: SubmissionRepository,
  actorUserId: string,
  submissionId: string,
): Promise<AuthorSubmission | null> {
  return repository.findSubmissionForAuthor(actorUserId, submissionId);
}

export async function listSubmissionsForAuthor(
  repository: SubmissionRepository,
  actorUserId: string,
): Promise<AuthorSubmission[]> {
  return repository.listSubmissionsForAuthor(actorUserId);
}

export async function updateDraftSubmission(
  repository: SubmissionRepository,
  actorUserId: string,
  input: UpdateDraftSubmissionInput,
): Promise<DraftSubmission> {
  return repository.transaction(async (transaction) => {
    const submission = await transaction.updateDraftSubmissionForAuthor(
      actorUserId,
      input,
    );
    if (!submission) {
      throw new AppError("NOT_FOUND", "Draft submission not found.");
    }

    await transaction.insertAuditEvent({
      organizationId: submission.organizationId,
      actorUserId,
      action: "submission.draft_updated",
      entityType: "submission",
      entityId: submission.id,
      reason: "Author updated draft submission metadata.",
    });
    return submission;
  });
}

export async function submitDraftSubmission(
  repository: SubmissionRepository,
  storage: PrivateSubmissionStorage,
  actorUserId: string,
  submissionId: string,
  correlationId: string,
): Promise<AuthorSubmission> {
  const existing = await repository.findSubmissionForAuthor(
    actorUserId,
    submissionId,
  );
  if (!existing) {
    throw new AppError("NOT_FOUND", "Draft submission not found.");
  }
  if (existing.status === "submitted") {
    return existing;
  }

  const manuscripts = await repository.listManuscriptsForAuthor(
    actorUserId,
    submissionId,
  );
  const latestManuscript = manuscripts[0];
  if (latestManuscript) {
    await getManuscriptForAuthor(
      repository,
      storage,
      actorUserId,
      submissionId,
      latestManuscript.id,
    );
  }

  return repository.transaction(async (transaction) => {
    const result = await transaction.submitDraftForAuthor(
      actorUserId,
      submissionId,
      latestManuscript?.id ?? null,
    );
    if (result.kind === "not_found") {
      throw new AppError("NOT_FOUND", "Draft submission not found.");
    }
    if (result.kind === "missing_manuscript") {
      throw new AppError(
        "INVALID_INPUT",
        "Upload a manuscript PDF before submitting this draft.",
      );
    }
    if (result.kind === "manuscript_changed") {
      throw new AppError(
        "CONFLICT",
        "The manuscript changed while submitting. Review the latest version and try again.",
      );
    }
    if (result.kind === "already_submitted") {
      return result.submission;
    }

    await transaction.insertAuditEvent({
      organizationId: result.submission.organizationId,
      actorUserId,
      action: "submission.submitted",
      entityType: "submission",
      entityId: result.submission.id,
      reason: "Author submitted the manuscript for editorial consideration.",
      actorType: "human",
      stateBefore: "draft",
      stateAfter: "submitted",
      source: "author_workspace",
      correlationId,
    });
    return result.submission;
  });
}

export async function uploadDraftManuscript(
  repository: SubmissionRepository,
  storage: PrivateSubmissionStorage,
  actorUserId: string,
  submissionId: string,
  content: Uint8Array,
): Promise<ManuscriptFile> {
  if (
    content.byteLength === 0 ||
    content.byteLength > MAX_MANUSCRIPT_BYTES ||
    !isPdfPayload(content)
  ) {
    throw new AppError(
      "INVALID_INPUT",
      "Choose a valid PDF no larger than 10 MB.",
    );
  }

  const draft = await repository.findDraftSubmissionForAuthor(
    actorUserId,
    submissionId,
  );
  if (!draft) {
    throw new AppError("NOT_FOUND", "Draft submission not found.");
  }

  const stored = await storage.store(content);
  try {
    return await repository.transaction(async (transaction) => {
      const manuscript = await transaction.insertManuscriptVersion(
        actorUserId,
        submissionId,
        stored.storageKey,
        content.byteLength,
        stored.sha256,
      );
      if (!manuscript) {
        throw new AppError("NOT_FOUND", "Draft submission not found.");
      }

      await transaction.insertAuditEvent({
        organizationId: draft.organizationId,
        actorUserId,
        action: "submission.manuscript_uploaded",
        entityType: "submission",
        entityId: submissionId,
        reason: "Author uploaded a private manuscript PDF to a draft.",
      });
      return manuscript;
    });
  } catch (error) {
    try {
      await storage.remove(stored.storageKey);
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "Manuscript upload failed and its private object could not be removed.",
      );
    }
    throw error;
  }
}

export async function listManuscriptsForAuthor(
  repository: SubmissionRepository,
  actorUserId: string,
  submissionId: string,
): Promise<ManuscriptFile[]> {
  return repository.listManuscriptsForAuthor(actorUserId, submissionId);
}

export async function getManuscriptForAuthor(
  repository: SubmissionRepository,
  storage: PrivateSubmissionStorage,
  actorUserId: string,
  submissionId: string,
  manuscriptId: string,
): Promise<{ file: ManuscriptFile; content: Uint8Array }> {
  const file = await repository.findManuscriptForAuthor(
    actorUserId,
    submissionId,
    manuscriptId,
  );
  if (!file) {
    throw new AppError("NOT_FOUND", "Manuscript not found.");
  }

  const stored = await storage.read(file.storageKey);
  if (
    stored.content.byteLength !== file.byteSize ||
    stored.sha256 !== file.sha256 ||
    !isPdfPayload(stored.content)
  ) {
    throw new AppError(
      "STORAGE_INTEGRITY_FAILURE",
      "The stored manuscript failed its integrity check.",
    );
  }

  return { file, content: stored.content };
}
