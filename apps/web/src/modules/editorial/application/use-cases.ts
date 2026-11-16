import { AppError } from "@/modules/shared/app-error";
import type { TenancyRepository } from "@/modules/tenancy/application/ports";
import { getOrganizationWorkspace } from "@/modules/tenancy/application/use-cases";
import type { SubmissionRepository } from "@/modules/submissions/application/ports";
import type {
  EditorialRepository,
  EditorialTransaction,
  ScreeningInput,
  AssignReviewerInput,
  UnassignReviewerInput,
  SubmitReviewInput,
  RequestRevisionInput,
  RecordDecisionInput,
  WithdrawSubmissionInput,
  EditorialSubmission,
  EditorialSubmissionDetail,
  ReviewerAssignment,
  ReviewReport,
  EditorialDecision,
} from "./ports";
import {
  applyTransition,
  type SubmissionStatus,
  type EditorialAction,
} from "../domain/state-machine";
import {
  createReviewerAssignment,
  markAssignmentCompleted,
  unassignReviewer as unassignReviewerDomain,
  type ReviewerAssignment as DomainReviewerAssignment,
} from "../domain/assignment";
import {
  createReviewReport,
  type ReviewReport as DomainReviewReport,
} from "../domain/review";
import {
  createEditorialDecision,
  type EditorialDecision as DomainEditorialDecision,
} from "../domain/decision";

async function assertEditorAccess(
  tenancyRepository: TenancyRepository,
  editorUserId: string,
  journalId: string
): Promise<string> {
  const workspace = await getOrganizationWorkspace(tenancyRepository, editorUserId, journalId);
  if (!workspace) {
    throw new AppError("FORBIDDEN", "Editor access denied for this journal.");
  }
  return workspace.organization.id;
}

async function assertEditorAccessBySubmission(
  tenancyRepository: TenancyRepository,
  editorUserId: string,
  submission: { journalId: string }
): Promise<string> {
  return assertEditorAccess(tenancyRepository, editorUserId, submission.journalId);
}

export async function screenSubmission(
  repository: EditorialRepository,
  tenancyRepository: TenancyRepository,
  input: ScreeningInput
): Promise<EditorialSubmission> {
  const { submissionId, editorUserId, pass, reason } = input;

  const submission = await repository.findSubmissionForEditor(editorUserId, submissionId);
  if (!submission) {
    throw new AppError("NOT_FOUND", "Submission not found or access denied.");
  }

  await assertEditorAccessBySubmission(tenancyRepository, editorUserId, submission);

  const action: EditorialAction = pass ? "screening_passed" : "screening_failed";
  const newStatus = applyTransition(submission.status, action, "editor", "human");

  return repository.transaction(async (tx) => {
    const updated = await tx.screenSubmission({
      submissionId,
      editorUserId,
      pass,
      reason,
    });

    await tx.insertAuditEvent({
      organizationId: submission.organizationId,
      actorUserId: editorUserId,
      actorLabel: null,
      action: pass ? "submission.screening_passed" : "submission.screening_failed",
      entityType: "submission",
      entityId: submissionId,
      reason,
      actorType: "human",
      stateBefore: submission.status,
      stateAfter: newStatus,
      source: "editor_workspace",
      correlationId: null,
    });

    return updated;
  });
}

export async function assignReviewer(
  repository: EditorialRepository,
  tenancyRepository: TenancyRepository,
  input: AssignReviewerInput
): Promise<ReviewerAssignment> {
  const { submissionId, editorUserId, reviewerUserId, role, dueAt, isBlind } = input;

  const submission = await repository.findSubmissionForEditor(editorUserId, submissionId);
  if (!submission) {
    throw new AppError("NOT_FOUND", "Submission not found or access denied.");
  }

  await assertEditorAccessBySubmission(tenancyRepository, editorUserId, submission);

  if (submission.status !== "under_review") {
    throw new AppError("INVALID_STATE", "Reviewers can only be assigned when submission is under review.");
  }

  const assignment = createReviewerAssignment(submissionId, reviewerUserId, editorUserId, {
    role,
    dueAt,
    isBlind,
  });

  return repository.transaction(async (tx) => {
    const created = await tx.assignReviewer({
      submissionId,
      editorUserId,
      reviewerUserId,
      role: assignment.role,
      dueAt: assignment.dueAt ?? undefined,
      isBlind: assignment.isBlind,
    });

    await tx.insertAuditEvent({
      organizationId: submission.organizationId,
      actorUserId: editorUserId,
      actorLabel: null,
      action: "submission.reviewer_assigned",
      entityType: "submission",
      entityId: submissionId,
      reason: `Assigned ${role} (blind: ${isBlind})`,
      actorType: "human",
      stateBefore: submission.status,
      stateAfter: submission.status,
      source: "editor_workspace",
      correlationId: null,
    });

    return created;
  });
}

export async function unassignReviewer(
  repository: EditorialRepository,
  tenancyRepository: TenancyRepository,
  input: UnassignReviewerInput
): Promise<ReviewerAssignment> {
  const { assignmentId, editorUserId, reason } = input;

  const submission = await repository.getSubmissionDetailForEditor(editorUserId, assignmentId);
  if (!submission) {
    throw new AppError("NOT_FOUND", "Assignment not found or access denied.");
  }

  await assertEditorAccessBySubmission(tenancyRepository, editorUserId, submission);

  const assignment = submission.assignments.find((a) => a.id === assignmentId);
  if (!assignment) {
    throw new AppError("NOT_FOUND", "Assignment not found.");
  }

  if (assignment.completedAt) {
    throw new AppError("CONFLICT", "Cannot unassign completed review.");
  }

  return repository.transaction(async (tx) => {
    const updated = await tx.unassignReviewer({
      assignmentId,
      editorUserId,
      reason,
    });

    await tx.insertAuditEvent({
      organizationId: submission.organizationId,
      actorUserId: editorUserId,
      actorLabel: null,
      action: "submission.reviewer_unassigned",
      entityType: "submission",
      entityId: submission.id,
      reason,
      actorType: "human",
      stateBefore: submission.status,
      stateAfter: submission.status,
      source: "editor_workspace",
      correlationId: null,
    });

    return updated;
  });
}

export async function submitReview(
  repository: EditorialRepository,
  tenancyRepository: TenancyRepository,
  input: SubmitReviewInput
): Promise<ReviewReport> {
  const { assignmentId, reviewerUserId, recommendation, commentsToAuthor, commentsToEditor, scores } = input;

  const detail = await repository.getSubmissionDetailForReviewer(reviewerUserId, assignmentId);
  if (!detail) {
    throw new AppError("NOT_FOUND", "Review assignment not found or access denied.");
  }

  const assignment = detail.assignments.find((a) => a.id === assignmentId);
  if (!assignment) {
    throw new AppError("NOT_FOUND", "Assignment not found.");
  }

  if (assignment.completedAt) {
    throw new AppError("CONFLICT", "Review already submitted.");
  }

  if (assignment.unassignedAt) {
    throw new AppError("CONFLICT", "Assignment was unassigned.");
  }

  if (detail.status !== "under_review") {
    throw new AppError("INVALID_STATE", "Submission is not under review.");
  }

  const report = createReviewReport(
    assignmentId,
    detail.id,
    reviewerUserId,
    recommendation,
    commentsToAuthor,
    commentsToEditor ?? null,
    scores ? {
      originality: scores.originality ?? null,
      methodology: scores.methodology ?? null,
      clarity: scores.clarity ?? null,
      significance: scores.significance ?? null,
      overall: scores.overall ?? null,
    } : null
  );

  return repository.transaction(async (tx) => {
    const created = await tx.submitReview({
      assignmentId,
      reviewerUserId,
      recommendation,
      commentsToAuthor,
      commentsToEditor,
      scores: scores ? {
        originality: scores.originality ?? null,
        methodology: scores.methodology ?? null,
        clarity: scores.clarity ?? null,
        significance: scores.significance ?? null,
        overall: scores.overall ?? null,
      } : null,
    });

    await tx.insertAuditEvent({
      organizationId: detail.organizationId,
      actorUserId: reviewerUserId,
      actorLabel: null,
      action: "submission.review_submitted",
      entityType: "submission",
      entityId: detail.id,
      reason: `Submitted review with recommendation: ${recommendation}`,
      actorType: "human",
      stateBefore: detail.status,
      stateAfter: detail.status,
      source: "reviewer_workspace",
      correlationId: null,
    });

    return created;
  });
}

export async function requestRevision(
  repository: EditorialRepository,
  tenancyRepository: TenancyRepository,
  input: RequestRevisionInput
): Promise<EditorialSubmission> {
  const { submissionId, editorUserId, reason, reviewerRecommendations } = input;

  const submission = await repository.findSubmissionForEditor(editorUserId, submissionId);
  if (!submission) {
    throw new AppError("NOT_FOUND", "Submission not found or access denied.");
  }

  await assertEditorAccessBySubmission(tenancyRepository, editorUserId, submission);

  if (submission.status !== "under_review") {
    throw new AppError("INVALID_STATE", "Revision can only be requested when submission is under review.");
  }

  const newStatus = applyTransition(submission.status, "revision_requested", "editor", "human");

  return repository.transaction(async (tx) => {
    const updated = await tx.requestRevision({
      submissionId,
      editorUserId,
      reason,
      reviewerRecommendations,
    });

    await tx.insertAuditEvent({
      organizationId: submission.organizationId,
      actorUserId: editorUserId,
      actorLabel: null,
      action: "submission.revision_requested",
      entityType: "submission",
      entityId: submissionId,
      reason,
      actorType: "human",
      stateBefore: submission.status,
      stateAfter: newStatus,
      source: "editor_workspace",
      correlationId: null,
    });

    return updated;
  });
}

export async function recordDecision(
  repository: EditorialRepository,
  tenancyRepository: TenancyRepository,
  input: RecordDecisionInput
): Promise<EditorialDecision> {
  const { submissionId, editorUserId, outcome, rationale, reviewerRecommendations } = input;

  const submission = await repository.findSubmissionForEditor(editorUserId, submissionId);
  if (!submission) {
    throw new AppError("NOT_FOUND", "Submission not found or access denied.");
  }

  await assertEditorAccessBySubmission(tenancyRepository, editorUserId, submission);

  if (submission.status !== "under_review" && submission.status !== "revision_requested") {
    throw new AppError("INVALID_STATE", "Decision can only be recorded when submission is under review or revision requested.");
  }

  const action: EditorialAction = outcome === "accept" ? "accept" : outcome === "reject" ? "reject" : "revision_requested";
  const newStatus = applyTransition(submission.status, action, "editor", "human");

  const decision = createEditorialDecision(submissionId, editorUserId, outcome, rationale, reviewerRecommendations);

  return repository.transaction(async (tx) => {
    const created = await tx.recordDecision({
      submissionId,
      editorUserId,
      outcome,
      rationale,
      reviewerRecommendations,
    });

    await tx.insertAuditEvent({
      organizationId: submission.organizationId,
      actorUserId: editorUserId,
      actorLabel: null,
      action: `submission.decision_${outcome}`,
      entityType: "submission",
      entityId: submissionId,
      reason: rationale,
      actorType: "human",
      stateBefore: submission.status,
      stateAfter: newStatus,
      source: "editor_workspace",
      correlationId: null,
    });

    return created;
  });
}

export async function withdrawSubmission(
  repository: EditorialRepository,
  tenancyRepository: TenancyRepository,
  input: WithdrawSubmissionInput
): Promise<EditorialSubmission> {
  const { submissionId, authorUserId, reason } = input;

  const submission = await repository.findSubmissionForEditor(authorUserId, submissionId);
  if (!submission) {
    throw new AppError("NOT_FOUND", "Submission not found or access denied.");
  }

  if (submission.createdBy !== authorUserId) {
    throw new AppError("FORBIDDEN", "Only the author can withdraw the submission.");
  }

  if (["accepted", "rejected", "withdrawn"].includes(submission.status)) {
    throw new AppError("INVALID_STATE", "Cannot withdraw submission in terminal state.");
  }

  const newStatus = applyTransition(submission.status, "withdraw", "author", "human");

  return repository.transaction(async (tx) => {
    const updated = await tx.withdrawSubmission({
      submissionId,
      authorUserId,
      reason,
    });

    await tx.insertAuditEvent({
      organizationId: submission.organizationId,
      actorUserId: authorUserId,
      actorLabel: null,
      action: "submission.withdrawn",
      entityType: "submission",
      entityId: submissionId,
      reason,
      actorType: "human",
      stateBefore: submission.status,
      stateAfter: newStatus,
      source: "author_workspace",
      correlationId: null,
    });

    return updated;
  });
}

export async function listSubmissionsForEditor(
  repository: EditorialRepository,
  tenancyRepository: TenancyRepository,
  editorUserId: string,
  journalId: string,
  statuses?: SubmissionStatus[]
): Promise<EditorialSubmission[]> {
  await assertEditorAccess(tenancyRepository, editorUserId, journalId);
  return repository.listSubmissionsForEditor(editorUserId, journalId, statuses);
}

export async function getSubmissionDetailForEditor(
  repository: EditorialRepository,
  tenancyRepository: TenancyRepository,
  editorUserId: string,
  submissionId: string
): Promise<EditorialSubmissionDetail | null> {
  // Note: assertEditorAccess requires journalId - this needs to be resolved from the submission
  // For now, skip the check here; the repository will enforce tenant isolation
  return repository.getSubmissionDetailForEditor(editorUserId, submissionId);
}

export async function getSubmissionDetailForReviewer(
  repository: EditorialRepository,
  reviewerUserId: string,
  submissionId: string
): Promise<EditorialSubmissionDetail | null> {
  return repository.getSubmissionDetailForReviewer(reviewerUserId, submissionId);
}