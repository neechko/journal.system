import type { PublishedJournalReference } from "@/modules/tenancy/application/ports";
import type { SubmissionStatus } from "../domain/state-machine";
import type { ReviewerAssignment as DomainReviewerAssignment, ReviewerRole } from "../domain/assignment";
import type { ReviewReport as DomainReviewReport, ReviewRecommendation, ReviewScores } from "../domain/review";
import type { EditorialDecision as DomainEditorialDecision, DecisionOutcome, ReviewRecommendationSummary } from "../domain/decision";

export type ReviewerAssignment = DomainReviewerAssignment;
export type ReviewReport = DomainReviewReport;
export type EditorialDecision = DomainEditorialDecision;

export interface EditorialSubmission {
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
  status: SubmissionStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date | null;
  submittedManuscriptVersion: number | null;
  currentManuscriptVersion: number | null;
}

export interface EditorialSubmissionDetail extends EditorialSubmission {
  authors: SubmissionAuthor[];
  manuscripts: SubmissionManuscript[];
  assignments: ReviewerAssignment[];
  reviews: ReviewReport[];
  decisions: EditorialDecision[];
  auditEvents: EditorialAuditEvent[];
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

export interface SubmissionManuscript {
  id: string;
  version: number;
  contentType: "application/pdf";
  byteSize: number;
  sha256: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface EditorialAuditEvent {
  id: string;
  organizationId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  actorUserId: string | null;
  actorLabel: string | null;
  actorType: "human" | "system" | "ai" | null;
  reason: string;
  stateBefore: string | null;
  stateAfter: string | null;
  source: string | null;
  correlationId: string | null;
  occurredAt: Date;
}

export interface ScreeningInput {
  submissionId: string;
  editorUserId: string;
  pass: boolean;
  reason: string;
}

export interface AssignReviewerInput {
  submissionId: string;
  editorUserId: string;
  reviewerUserId: string;
  role?: "reviewer" | "statistical_reviewer" | "ethics_reviewer";
  dueAt?: Date;
  isBlind?: boolean;
}

export interface UnassignReviewerInput {
  assignmentId: string;
  editorUserId: string;
  reason: string;
}

export interface SubmitReviewInput {
  assignmentId: string;
  reviewerUserId: string;
  recommendation: "accept" | "minor_revision" | "major_revision" | "reject";
  commentsToAuthor: string;
  commentsToEditor?: string | null;
  scores?: {
    originality?: number | null;
    methodology?: number | null;
    clarity?: number | null;
    significance?: number | null;
    overall?: number | null;
  } | null;
}

export interface RequestRevisionInput {
  submissionId: string;
  editorUserId: string;
  reason: string;
  reviewerRecommendations: {
    assignmentId: string;
    reviewerUserId: string;
    role: string;
    recommendation: string;
    reviewVersion: number;
  }[];
}

export interface RecordDecisionInput {
  submissionId: string;
  editorUserId: string;
  outcome: "accept" | "minor_revision" | "major_revision" | "reject";
  rationale: string;
  reviewerRecommendations: {
    assignmentId: string;
    reviewerUserId: string;
    role: string;
    recommendation: string;
    reviewVersion: number;
  }[];
}

export interface WithdrawSubmissionInput {
  submissionId: string;
  authorUserId: string;
  reason: string;
}

export interface EditorialTransaction {
  findSubmissionForEditor(
    editorUserId: string,
    submissionId: string
  ): Promise<EditorialSubmission | null>;

  listSubmissionsForEditor(
    editorUserId: string,
    journalId: string,
    statuses?: SubmissionStatus[]
  ): Promise<EditorialSubmission[]>;

  getSubmissionDetailForEditor(
    editorUserId: string,
    submissionId: string
  ): Promise<EditorialSubmissionDetail | null>;

  buildSubmissionDetail(
    submissionId: string,
    organizationId: string
  ): Promise<EditorialSubmissionDetail | null>;

  getSubmissionDetailForReviewer(
    reviewerUserId: string,
    submissionId: string
  ): Promise<EditorialSubmissionDetail | null>;

  screenSubmission(input: ScreeningInput): Promise<EditorialSubmission>;
  assignReviewer(input: AssignReviewerInput): Promise<ReviewerAssignment>;
  unassignReviewer(input: UnassignReviewerInput): Promise<ReviewerAssignment>;
  submitReview(input: SubmitReviewInput): Promise<ReviewReport>;
  requestRevision(input: RequestRevisionInput): Promise<EditorialSubmission>;
  recordDecision(input: RecordDecisionInput): Promise<EditorialDecision>;
  withdrawSubmission(input: WithdrawSubmissionInput): Promise<EditorialSubmission>;

  insertAuditEvent(event: Omit<EditorialAuditEvent, "id" | "occurredAt">): Promise<void>;
}

export interface EditorialRepository {
  transaction<T>(work: (tx: EditorialTransaction) => Promise<T>): Promise<T>;

  findSubmissionForEditor(
    editorUserId: string,
    submissionId: string
  ): Promise<EditorialSubmission | null>;

  listSubmissionsForEditor(
    editorUserId: string,
    journalId: string,
    statuses?: SubmissionStatus[]
  ): Promise<EditorialSubmission[]>;

  getSubmissionDetailForEditor(
    editorUserId: string,
    submissionId: string
  ): Promise<EditorialSubmissionDetail | null>;

  getSubmissionDetailForReviewer(
    reviewerUserId: string,
    submissionId: string
  ): Promise<EditorialSubmissionDetail | null>;
}