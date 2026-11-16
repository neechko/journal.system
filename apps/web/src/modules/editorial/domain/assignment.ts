import { randomUUID } from "node:crypto";

export type ReviewerRole = "reviewer" | "statistical_reviewer" | "ethics_reviewer";

export interface ReviewerAssignment {
  id: string;
  submissionId: string;
  reviewerUserId: string;
  role: ReviewerRole;
  assignedAt: Date;
  assignedBy: string;
  dueAt: Date | null;
  completedAt: Date | null;
  unassignedAt: Date | null;
  unassignedBy: string | null;
  unassignedReason: string | null;
  isBlind: boolean;
}

export function createReviewerAssignment(
  submissionId: string,
  reviewerUserId: string,
  assignedBy: string,
  options: {
    role?: ReviewerRole;
    dueAt?: Date;
    isBlind?: boolean;
  } = {}
): ReviewerAssignment {
  const now = new Date();
  return {
    id: randomUUID(),
    submissionId,
    reviewerUserId,
    role: options.role ?? "reviewer",
    assignedAt: now,
    assignedBy,
    dueAt: options.dueAt ?? null,
    completedAt: null,
    unassignedAt: null,
    unassignedBy: null,
    unassignedReason: null,
    isBlind: options.isBlind ?? true,
  };
}

export function markAssignmentCompleted(
  assignment: ReviewerAssignment,
  completedAt: Date = new Date()
): ReviewerAssignment {
  if (assignment.completedAt) {
    throw new Error("Assignment already completed");
  }
  return { ...assignment, completedAt };
}

export function unassignReviewer(
  assignment: ReviewerAssignment,
  unassignedBy: string,
  reason: string
): ReviewerAssignment {
  if (assignment.unassignedAt) {
    throw new Error("Assignment already unassigned");
  }
  if (assignment.completedAt) {
    throw new Error("Cannot unassign completed review");
  }
  const now = new Date();
  return {
    ...assignment,
    unassignedAt: now,
    unassignedBy,
    unassignedReason: reason,
  };
}

export function isAssignmentActive(assignment: ReviewerAssignment): boolean {
  return !assignment.completedAt && !assignment.unassignedAt;
}

export function isAssignmentOverdue(assignment: ReviewerAssignment): boolean {
  if (!assignment.dueAt) return false;
  if (assignment.completedAt) return false;
  if (assignment.unassignedAt) return false;
  return new Date() > assignment.dueAt;
}