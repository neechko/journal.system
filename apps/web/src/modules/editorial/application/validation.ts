import { z } from "zod";

export const screeningInputSchema = z.object({
  submissionId: z.uuid(),
  editorUserId: z.string().min(1),
  pass: z.boolean(),
  reason: z.string().min(1).max(5000),
});

export type ScreeningInput = z.infer<typeof screeningInputSchema>;

export const assignReviewerInputSchema = z.object({
  submissionId: z.uuid(),
  editorUserId: z.string().min(1),
  reviewerUserId: z.string().min(1),
  role: z.enum(["reviewer", "statistical_reviewer", "ethics_reviewer"]).default("reviewer"),
  dueAt: z.iso.datetime().optional().nullable(),
  isBlind: z.boolean().default(true),
});

export type AssignReviewerInput = z.infer<typeof assignReviewerInputSchema>;

export const unassignReviewerInputSchema = z.object({
  assignmentId: z.uuid(),
  editorUserId: z.string().min(1),
  reason: z.string().min(1).max(5000),
});

export type UnassignReviewerInput = z.infer<typeof unassignReviewerInputSchema>;

export const submitReviewInputSchema = z.object({
  assignmentId: z.uuid(),
  reviewerUserId: z.string().min(1),
  recommendation: z.enum(["accept", "minor_revision", "major_revision", "reject"]),
  commentsToAuthor: z.string().min(1).max(10000),
  commentsToEditor: z.string().max(10000).nullable().optional(),
  scores: z
    .object({
      originality: z.number().int().min(1).max(5).nullable().optional(),
      methodology: z.number().int().min(1).max(5).nullable().optional(),
      clarity: z.number().int().min(1).max(5).nullable().optional(),
      significance: z.number().int().min(1).max(5).nullable().optional(),
      overall: z.number().int().min(1).max(5).nullable().optional(),
    })
    .nullable()
    .optional(),
});

export type SubmitReviewInput = z.infer<typeof submitReviewInputSchema>;

export const requestRevisionInputSchema = z.object({
  submissionId: z.uuid(),
  editorUserId: z.string().min(1),
  reason: z.string().min(1).max(5000),
});

export type RequestRevisionInput = z.infer<typeof requestRevisionInputSchema>;

export const recordDecisionInputSchema = z.object({
  submissionId: z.uuid(),
  editorUserId: z.string().min(1),
  outcome: z.enum(["accept", "minor_revision", "major_revision", "reject"]),
  rationale: z.string().min(1).max(10000),
});

export type RecordDecisionInput = z.infer<typeof recordDecisionInputSchema>;

export const withdrawSubmissionInputSchema = z.object({
  submissionId: z.uuid(),
  authorUserId: z.string().min(1),
  reason: z.string().min(1).max(5000),
});

export type WithdrawSubmissionInput = z.infer<typeof withdrawSubmissionInputSchema>;

export const editorialListQuerySchema = z.object({
  editorUserId: z.string().min(1),
  journalId: z.uuid(),
  statuses: z.array(
    z.enum(["draft", "submitted", "under_review", "revision_requested", "accepted", "rejected", "withdrawn"])
  ).optional(),
});

export type EditorialListQuery = z.infer<typeof editorialListQuerySchema>;
