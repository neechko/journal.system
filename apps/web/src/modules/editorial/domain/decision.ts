import { randomUUID } from "node:crypto";

export type DecisionOutcome =
  | "accept"
  | "minor_revision"
  | "major_revision"
  | "reject";

export interface EditorialDecision {
  id: string;
  submissionId: string;
  editorUserId: string;
  outcome: DecisionOutcome;
  rationale: string;
  reviewerRecommendations: ReviewRecommendationSummary[];
  createdAt: Date;
  communicatedAt: Date | null;
}

export interface ReviewRecommendationSummary {
  assignmentId: string;
  reviewerUserId: string;
  role: string;
  recommendation: string;
  reviewVersion: number;
}

export function createEditorialDecision(
  submissionId: string,
  editorUserId: string,
  outcome: DecisionOutcome,
  rationale: string,
  reviewerRecommendations: ReviewRecommendationSummary[]
): EditorialDecision {
  const now = new Date();
  return {
    id: randomUUID(),
    submissionId,
    editorUserId,
    outcome,
    rationale,
    reviewerRecommendations,
    createdAt: now,
    communicatedAt: null,
  };
}

export function communicateDecision(decision: EditorialDecision): EditorialDecision {
  if (decision.communicatedAt) {
    throw new Error("Decision already communicated");
  }
  return { ...decision, communicatedAt: new Date() };
}

export const DECISION_HIERARCHY: Record<DecisionOutcome, number> = {
  accept: 4,
  minor_revision: 3,
  major_revision: 2,
  reject: 1,
};

export function isDecisionPositive(outcome: DecisionOutcome): boolean {
  return outcome === "accept" || outcome === "minor_revision";
}

export function isDecisionRevision(outcome: DecisionOutcome): boolean {
  return outcome === "minor_revision" || outcome === "major_revision";
}

export function isDecisionTerminal(outcome: DecisionOutcome): boolean {
  return outcome === "accept" || outcome === "reject";
}

export function mapRecommendationToDecision(
  recommendations: ReviewRecommendationSummary[]
): DecisionOutcome | null {
  if (recommendations.length === 0) return null;

  const scores = recommendations.map((r) => DECISION_HIERARCHY[r.recommendation as DecisionOutcome] ?? 0);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  if (avgScore >= 3.5) return "accept";
  if (avgScore >= 2.5) return "minor_revision";
  if (avgScore >= 1.5) return "major_revision";
  return "reject";
}