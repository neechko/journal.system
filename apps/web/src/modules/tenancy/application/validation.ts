import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(63)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const organizationInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  reason: z.string().trim().min(10).max(500),
});

export const journalInputSchema = z.object({
  organizationId: z.uuid(),
  title: z.string().trim().min(2).max(160),
  slug: slugSchema,
  description: z.string().trim().max(2000).optional(),
  reason: z.string().trim().min(10).max(500),
});

export const publishJournalInputSchema = z.object({
  organizationId: z.uuid(),
  journalId: z.uuid(),
  reason: z.string().trim().min(10).max(500),
  confirm: z.literal("confirm"),
});

const journalProfileTextSchema = z
  .string()
  .trim()
  .max(5000)
  .transform((value) => value || null);

const journalProfileDescriptionSchema = z
  .string()
  .trim()
  .max(2000)
  .transform((value) => value || null);

export const updateJournalProfileInputSchema = z.object({
  organizationId: z.uuid(),
  journalId: z.uuid(),
  description: journalProfileDescriptionSchema,
  aimsScope: journalProfileTextSchema,
  authorGuidelines: journalProfileTextSchema,
  reason: z.string().trim().min(10).max(500),
  confirm: z.literal("confirm"),
});

export const publicJournalPageSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(z.number().int().max(10_000));

export const publicJournalSearchSchema = z.string().trim().max(100);

export type OrganizationInput = z.infer<typeof organizationInputSchema>;
export type JournalInput = z.infer<typeof journalInputSchema>;
export type PublishJournalInput = z.infer<typeof publishJournalInputSchema>;
export type UpdateJournalProfileInput = z.infer<
  typeof updateJournalProfileInputSchema
>;
