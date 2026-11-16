import { randomUUID } from "node:crypto";

export type ReviewRecommendation =
  | "accept"
  | "minor_revision"
  | "major_revision"
  | "reject";

export interface ReviewReport {
  id: string;
  assignmentId: string;
  submissionId: string;
  reviewerUserId: string;
  version: number;
  recommendation: ReviewRecommendation;
  commentsToEditor: string | null;
  commentsToAuthor: string | null;
  scores: ReviewScores | null;
  submittedAt: Date;
  acknowledgedAt: Date | null;
}

export interface ReviewScores {
  originality: number | null;
  methodology: number | null;
  clarity: number | null;
  significance: number | null;
  overall: number | null;
}

export function createReviewReport(
  assignmentId: string,
  submissionId: string,
  reviewerUserId: string,
  recommendation: ReviewRecommendation,
  commentsToAuthor: string,
  commentsToEditor: string | null = null,
  scores: ReviewScores | null = null
): ReviewReport {
  const now = new Date();
  return {
    id: randomUUID(),
    assignmentId,
    submissionId,
    reviewerUserId,
    version: 1,
    recommendation,
    commentsToEditor,
    commentsToAuthor,
    scores,
    submittedAt: now,
    acknowledgedAt: null,
  };
}

export function reviseReviewReport(
  existing: ReviewReport,
  recommendation: ReviewRecommendation,
  commentsToAuthor: string,
  commentsToEditor: string | null = null,
  scores: ReviewScores | null = null
): ReviewReport {
  return {
    ...existing,
    version: existing.version + 1,
    recommendation,
    commentsToEditor,
    commentsToAuthor,
    scores,
    submittedAt: new Date(),
    acknowledgedAt: null,
  };
}

export function acknowledgeReview(report: ReviewReport): ReviewReport {
  if (report.acknowledgedAt) {
    throw new Error("Review already acknowledged");
  }
  return { ...report, acknowledgedAt: new Date() };
}

export const RECOMMENDATION_ORDER: Record<ReviewRecommendation, number> = {
  accept: 4,
  minor_revision: 3,
  major_revision: 2,
  reject: 1,
};

export function isRecommendationPositive(rec: ReviewRecommendation): boolean {
  return rec === "accept" || rec === "minor_revision";
}

export function isRecommendationNegative(rec: ReviewRecommendation): boolean {
  return rec === "reject" || rec === "major_revision";
}