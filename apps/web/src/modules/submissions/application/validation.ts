import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(63)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const submissionTitleSchema = z.string().trim().min(5).max(300);
const submissionAbstractSchema = z
  .string()
  .trim()
  .max(10_000)
  .transform((value) => value || null);
const submissionKeywordsSchema = z
  .string()
  .max(2048)
  .default("")
  .transform((value) =>
    value
      .split(/\r?\n/)
      .map((keyword) => keyword.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().min(1).max(100)).max(20));

export const createDraftSubmissionInputSchema = z.object({
  organizationSlug: slugSchema,
  journalSlug: slugSchema,
  title: submissionTitleSchema,
  abstract: submissionAbstractSchema,
  keywords: submissionKeywordsSchema,
});

export const updateDraftSubmissionInputSchema = z.object({
  submissionId: z.uuid(),
  title: submissionTitleSchema,
  abstract: submissionAbstractSchema,
  keywords: submissionKeywordsSchema,
});

export const submitDraftSubmissionInputSchema = z.object({
  submissionId: z.uuid(),
  confirmation: z.literal("confirm"),
});

export type CreateDraftSubmissionInput = z.infer<
  typeof createDraftSubmissionInputSchema
>;
export type UpdateDraftSubmissionInput = z.infer<
  typeof updateDraftSubmissionInputSchema
>;
export type SubmitDraftSubmissionInput = z.infer<
  typeof submitDraftSubmissionInputSchema
>;
