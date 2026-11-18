import { AppError } from "@/modules/shared/app-error";

export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "revision_requested"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type EditorialAction =
  | "screening_passed"
  | "screening_failed"
  | "reviewer_assigned"
  | "reviewer_unassigned"
  | "review_submitted"
  | "revision_requested"
  | "revision_received"
  | "accept"
  | "reject"
  | "withdraw";

export interface StateTransition {
  from: SubmissionStatus;
  action: EditorialAction;
  to: SubmissionStatus;
  requiredRole: "editor" | "reviewer" | "author" | "system";
  allowedActorTypes: ("human" | "system")[];
}

const TRANSITIONS: StateTransition[] = [
  { from: "draft", action: "withdraw", to: "withdrawn", requiredRole: "author", allowedActorTypes: ["human"] },
  { from: "submitted", action: "screening_passed", to: "under_review", requiredRole: "editor", allowedActorTypes: ["human"] },
  { from: "submitted", action: "screening_failed", to: "rejected", requiredRole: "editor", allowedActorTypes: ["human"] },
  { from: "submitted", action: "withdraw", to: "withdrawn", requiredRole: "author", allowedActorTypes: ["human"] },
  { from: "under_review", action: "reviewer_assigned", to: "under_review", requiredRole: "editor", allowedActorTypes: ["human", "system"] },
  { from: "under_review", action: "reviewer_unassigned", to: "under_review", requiredRole: "editor", allowedActorTypes: ["human", "system"] },
  { from: "under_review", action: "review_submitted", to: "under_review", requiredRole: "reviewer", allowedActorTypes: ["human"] },
  { from: "under_review", action: "revision_requested", to: "revision_requested", requiredRole: "editor", allowedActorTypes: ["human"] },
  { from: "under_review", action: "accept", to: "accepted", requiredRole: "editor", allowedActorTypes: ["human"] },
  { from: "under_review", action: "reject", to: "rejected", requiredRole: "editor", allowedActorTypes: ["human"] },
  { from: "under_review", action: "withdraw", to: "withdrawn", requiredRole: "author", allowedActorTypes: ["human"] },
  { from: "revision_requested", action: "revision_received", to: "under_review", requiredRole: "author", allowedActorTypes: ["human"] },
  { from: "revision_requested", action: "reject", to: "rejected", requiredRole: "editor", allowedActorTypes: ["human"] },
  { from: "revision_requested", action: "withdraw", to: "withdrawn", requiredRole: "author", allowedActorTypes: ["human"] },
  { from: "accepted", action: "withdraw", to: "withdrawn", requiredRole: "author", allowedActorTypes: ["human"] },
];

export function getValidTransitions(from: SubmissionStatus): StateTransition[] {
  return TRANSITIONS.filter((t) => t.from === from);
}

export function canTransition(
  from: SubmissionStatus,
  action: EditorialAction,
  actorRole: "editor" | "reviewer" | "author" | "system",
  actorType: "human" | "system"
): { allowed: boolean; to?: SubmissionStatus; reason?: string } {
  const transition = TRANSITIONS.find(
    (t) => t.from === from && t.action === action
  );

  if (!transition) {
    return { allowed: false, reason: `Invalid transition from ${from} with action ${action}` };
  }

  if (transition.requiredRole !== actorRole && transition.requiredRole !== "system") {
    return { allowed: false, reason: `Action requires role ${transition.requiredRole}, actor has ${actorRole}` };
  }

  if (!transition.allowedActorTypes.includes(actorType)) {
    return { allowed: false, reason: `Action not allowed for actor type ${actorType}` };
  }

  return { allowed: true, to: transition.to };
}

export function applyTransition(
  currentStatus: SubmissionStatus,
  action: EditorialAction,
  actorRole: "editor" | "reviewer" | "author" | "system",
  actorType: "human" | "system"
): SubmissionStatus {
  const result = canTransition(currentStatus, action, actorRole, actorType);
  if (!result.allowed || !result.to) {
    throw new AppError("INVALID_STATE_TRANSITION", result.reason ?? "Invalid state transition");
  }
  return result.to;
}

export const INITIAL_STATUS: SubmissionStatus = "draft";
export const TERMINAL_STATUSES: SubmissionStatus[] = ["accepted", "rejected", "withdrawn"];

export function isTerminal(status: SubmissionStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function canAuthorAct(status: SubmissionStatus): boolean {
  return status === "draft" || status === "submitted" || status === "revision_requested";
}

export function canEditorAct(status: SubmissionStatus): boolean {
  return status !== "draft" && !isTerminal(status);
}

export function canReviewerAct(status: SubmissionStatus): boolean {
  return status === "under_review";
}
