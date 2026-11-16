import type { PublishedJournalReference } from "@/modules/tenancy/application/ports";
import type {
  CreateDraftSubmissionInput,
  UpdateDraftSubmissionInput,
} from "./validation";

export interface DraftSubmission {
  id: string;
  organizationId: string;
  journalId: string;
  organizationName: string;
  organizationSlug: string;
  journalTitle: string;
  journalSlug: string;
  title: string;
  abstract: string | null;
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthorSubmission extends DraftSubmission {
  status: "draft" | "submitted";
  submittedAt: Date | null;
  submittedManuscriptVersion: number | null;
}

export type SubmitDraftResult =
  | { kind: "not_found" }
  | { kind: "missing_manuscript" }
  | { kind: "manuscript_changed" }
  | { kind: "already_submitted"; submission: AuthorSubmission }
  | { kind: "submitted"; submission: AuthorSubmission };

export interface SubmissionAuditEventInput {
  organizationId: string;
  actorUserId: string;
  action:
    | "submission.draft_created"
    | "submission.draft_updated"
    | "submission.manuscript_uploaded"
    | "submission.submitted";
  entityType: "submission";
  entityId: string;
  reason: string;
  actorType?: "human" | "system" | "ai";
  stateBefore?: string;
  stateAfter?: string;
  source?: string;
  correlationId?: string;
}

export interface ManuscriptFile {
  id: string;
  version: number;
  contentType: "application/pdf";
  byteSize: number;
  sha256: string;
  uploadedAt: Date;
}

export interface StoredManuscriptFile extends ManuscriptFile {
  storageKey: string;
}

export interface StoredPrivateObject {
  content: Uint8Array;
  sha256: string;
}

export interface PrivateSubmissionStorage {
  store(content: Uint8Array): Promise<{ storageKey: string; sha256: string }>;
  read(storageKey: string): Promise<StoredPrivateObject>;
  remove(storageKey: string): Promise<void>;
}

export interface SubmissionTransaction {
  insertDraftSubmission(
    actorUserId: string,
    journal: PublishedJournalReference,
    input: Pick<CreateDraftSubmissionInput, "title" | "abstract" | "keywords">,
  ): Promise<Pick<DraftSubmission, "id" | "createdAt" | "updatedAt">>;
  updateDraftSubmissionForAuthor(
    actorUserId: string,
    input: UpdateDraftSubmissionInput,
  ): Promise<DraftSubmission | null>;
  insertManuscriptVersion(
    actorUserId: string,
    submissionId: string,
    storageKey: string,
    byteSize: number,
    sha256: string,
  ): Promise<ManuscriptFile | null>;
  submitDraftForAuthor(
    actorUserId: string,
    submissionId: string,
    manuscriptId: string | null,
  ): Promise<SubmitDraftResult>;
  insertAuditEvent(event: SubmissionAuditEventInput): Promise<void>;
}

export interface SubmissionRepository {
  transaction<T>(
    work: (transaction: SubmissionTransaction) => Promise<T>,
  ): Promise<T>;
  findDraftSubmissionForAuthor(
    actorUserId: string,
    submissionId: string,
  ): Promise<DraftSubmission | null>;
  listDraftSubmissionsForAuthor(
    actorUserId: string,
  ): Promise<DraftSubmission[]>;
  findSubmissionForAuthor(
    actorUserId: string,
    submissionId: string,
  ): Promise<AuthorSubmission | null>;
  listSubmissionsForAuthor(actorUserId: string): Promise<AuthorSubmission[]>;
  listManuscriptsForAuthor(
    actorUserId: string,
    submissionId: string,
  ): Promise<ManuscriptFile[]>;
  findManuscriptForAuthor(
    actorUserId: string,
    submissionId: string,
    manuscriptId: string,
  ): Promise<StoredManuscriptFile | null>;
}
