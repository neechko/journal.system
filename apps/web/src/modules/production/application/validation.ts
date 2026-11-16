import { z } from "zod";

export const createArticleVersionInputSchema = z.object({
  submissionId: z.uuid(),
  title: z.string().min(5).max(500),
  abstract: z.string().max(10000).nullable().optional(),
  keywords: z.array(z.string().max(100)).max(20).default([]),
  authors: z.array(
    z.object({
      userId: z.string().optional().nullable(),
      name: z.string().min(1).max(200),
      email: z.string().email().optional().nullable(),
      affiliation: z.string().max(500).optional().nullable(),
      orcid: z.string().regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/).optional().nullable(),
      isCorresponding: z.boolean().default(false),
      order: z.number().int().positive(),
    })
  ).min(1),
});

export type CreateArticleVersionInput = z.infer<typeof createArticleVersionInputSchema>;

export const updateArticleVersionInputSchema = z.object({
  articleId: z.uuid(),
  title: z.string().min(5).max(500).optional(),
  abstract: z.string().max(10000).nullable().optional(),
  keywords: z.array(z.string().max(100)).max(20).optional(),
  authors: z.array(
    z.object({
      id: z.uuid(),
      userId: z.string().optional().nullable(),
      name: z.string().min(1).max(200),
      email: z.string().email().optional().nullable(),
      affiliation: z.string().max(500).optional().nullable(),
      orcid: z.string().regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/).optional().nullable(),
      isCorresponding: z.boolean().default(false),
      order: z.number().int().positive(),
    })
  ).optional(),
});

export type UpdateArticleVersionInput = z.infer<typeof updateArticleVersionInputSchema>;

export const transitionArticleStatusInputSchema = z.object({
  articleId: z.uuid(),
  newStatus: z.enum(["draft", "in_copyedit", "in_typeset", "proof_ready", "proof_approved", "published", "withdrawn"]),
  actorUserId: z.string().min(1),
});

export type TransitionArticleStatusInput = z.infer<typeof transitionArticleStatusInputSchema>;

export const assignDoiInputSchema = z.object({
  articleId: z.uuid(),
  doi: z.string().regex(/^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i),
});

export type AssignDoiInput = z.infer<typeof assignDoiInputSchema>;

export const createVolumeInputSchema = z.object({
  journalId: z.uuid(),
  number: z.number().int().positive(),
  year: z.number().int().min(1900).max(2100),
  label: z.string().max(200).nullable().optional(),
});

export type CreateVolumeInput = z.infer<typeof createVolumeInputSchema>;

export const createIssueInputSchema = z.object({
  journalId: z.uuid(),
  number: z.number().int().positive(),
  year: z.number().int().min(1900).max(2100),
  volumeId: z.uuid().nullable().optional(),
  label: z.string().max(200).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
});

export type CreateIssueInput = z.infer<typeof createIssueInputSchema>;

export const updateIssueInputSchema = z.object({
  issueId: z.uuid(),
  label: z.string().max(200).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  coverImageFileId: z.uuid().nullable().optional(),
  volumeId: z.uuid().nullable().optional(),
});

export type UpdateIssueInput = z.infer<typeof updateIssueInputSchema>;

export const transitionIssueStatusInputSchema = z.object({
  issueId: z.uuid(),
  newStatus: z.enum(["planned", "in_progress", "published", "archived"]),
  actorUserId: z.string().min(1),
});

export type TransitionIssueStatusInput = z.infer<typeof transitionIssueStatusInputSchema>;

export const addArticleToIssueInputSchema = z.object({
  articleId: z.uuid(),
  issueId: z.uuid(),
  pageStart: z.number().int().positive().nullable().optional(),
  pageEnd: z.number().int().positive().nullable().optional(),
  order: z.number().int().positive(),
  articleType: z.string().max(100).nullable().optional(),
});

export type AddArticleToIssueInput = z.infer<typeof addArticleToIssueInputSchema>;

export const registerDoiInputSchema = z.object({
  articleId: z.uuid(),
  prefix: z.string().min(1),
  title: z.string().min(1).max(500),
  authors: z.array(
    z.object({
      givenName: z.string().min(1),
      familyName: z.string().min(1),
      orcid: z.string().regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/).nullable().optional(),
      affiliation: z.string().max(500).nullable().optional(),
      sequence: z.enum(["first", "additional"]),
    })
  ).min(1),
  publicationDate: z.iso.datetime(),
  journalTitle: z.string().min(1),
  journalIssn: z.string().regex(/^\d{4}-\d{3}[\dX]$/).nullable().optional(),
  journalIssnElectronic: z.string().regex(/^\d{4}-\d{3}[\dX]$/).nullable().optional(),
  volume: z.string().nullable().optional(),
  issue: z.string().nullable().optional(),
  pageStart: z.string().nullable().optional(),
  pageEnd: z.string().nullable().optional(),
  articleType: z.string().default("journal-article"),
  url: z.string().url(),
  license: z.string().url().nullable().optional(),
});

export type RegisterDoiInput = z.infer<typeof registerDoiInputSchema>;