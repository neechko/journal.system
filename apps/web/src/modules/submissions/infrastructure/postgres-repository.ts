import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "@/server/db/schema";
import type { PublishedJournalReference } from "@/modules/tenancy/application/ports";
import type {
  DraftSubmission,
  AuthorSubmission,
  SubmissionRepository,
  SubmissionTransaction,
  SubmitDraftResult,
} from "../application/ports";
import type {
  CreateDraftSubmissionInput,
  UpdateDraftSubmissionInput,
} from "../application/validation";

export function createPostgresSubmissionRepository<
  TQueryResult extends PgQueryResultHKT,
>(
  database: PgDatabase<TQueryResult, typeof schema>,
): SubmissionRepository {
  return {
    async transaction<T>(
      work: (transaction: SubmissionTransaction) => Promise<T>,
    ): Promise<T> {
      return database.transaction(async (tx) => {
        const transaction: SubmissionTransaction = {
          async insertDraftSubmission(
            actorUserId: string,
            journal: PublishedJournalReference,
            input: Pick<
              CreateDraftSubmissionInput,
              "title" | "abstract" | "keywords"
            >,
          ) {
            const [submission] = await tx
              .insert(schema.submissions)
              .values({
                journalId: journal.journalId,
                createdBy: actorUserId,
                title: input.title,
                abstract: input.abstract,
                keywords: input.keywords,
              })
              .returning({
                id: schema.submissions.id,
                createdAt: schema.submissions.createdAt,
                updatedAt: schema.submissions.updatedAt,
              });
            return submission;
          },
          async updateDraftSubmissionForAuthor(
            actorUserId: string,
            input: UpdateDraftSubmissionInput,
          ) {
            const [updated] = await tx
              .update(schema.submissions)
              .set({
                title: input.title,
                abstract: input.abstract,
                keywords: input.keywords,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(schema.submissions.id, input.submissionId),
                  eq(schema.submissions.createdBy, actorUserId),
                  eq(schema.submissions.status, "draft"),
                ),
              )
              .returning({
                id: schema.submissions.id,
                journalId: schema.submissions.journalId,
                title: schema.submissions.title,
                abstract: schema.submissions.abstract,
                keywords: schema.submissions.keywords,
                createdAt: schema.submissions.createdAt,
                updatedAt: schema.submissions.updatedAt,
              });

            if (!updated) {
              return null;
            }

            const [journal] = await tx
              .select({
                organizationId: schema.organizations.id,
                organizationName: schema.organizations.name,
                organizationSlug: schema.organizations.slug,
                journalTitle: schema.journals.title,
                journalSlug: schema.journals.slug,
              })
              .from(schema.journals)
              .innerJoin(
                schema.organizations,
                eq(schema.organizations.id, schema.journals.organizationId),
              )
              .where(
                eq(schema.journals.id, updated.journalId),
              )
              .limit(1);

            if (!journal) {
              return null;
            }

            return { ...updated, ...journal } satisfies DraftSubmission;
          },
          async insertManuscriptVersion(
            actorUserId: string,
            submissionId: string,
            storageKey: string,
            byteSize: number,
            sha256: string,
          ) {
            const [submission] = await tx
              .select({ id: schema.submissions.id })
              .from(schema.submissions)
              .where(
                and(
                  eq(schema.submissions.id, submissionId),
                  eq(schema.submissions.createdBy, actorUserId),
                  eq(schema.submissions.status, "draft"),
                ),
              )
              .for("update")
              .limit(1);

            if (!submission) {
              return null;
            }

            await tx
              .update(schema.submissions)
              .set({ updatedAt: new Date() })
              .where(eq(schema.submissions.id, submissionId));

            const [latest] = await tx
              .select({ version: schema.submissionManuscripts.version })
              .from(schema.submissionManuscripts)
              .where(
                eq(schema.submissionManuscripts.submissionId, submissionId),
              )
              .orderBy(desc(schema.submissionManuscripts.version))
              .limit(1);

            const [manuscript] = await tx
              .insert(schema.submissionManuscripts)
              .values({
                submissionId,
                version: (latest?.version ?? 0) + 1,
                storageKey,
                contentType: "application/pdf",
                byteSize,
                sha256,
                uploadedBy: actorUserId,
              })
              .returning({
                id: schema.submissionManuscripts.id,
                version: schema.submissionManuscripts.version,
                contentType: schema.submissionManuscripts.contentType,
                byteSize: schema.submissionManuscripts.byteSize,
                sha256: schema.submissionManuscripts.sha256,
                uploadedAt: schema.submissionManuscripts.uploadedAt,
              });

            return manuscript ?? null;
          },
          async submitDraftForAuthor(
            actorUserId: string,
            submissionId: string,
            manuscriptId: string,
          ): Promise<SubmitDraftResult> {
            const [submission] = await tx
              .select({
                id: schema.submissions.id,
                journalId: schema.submissions.journalId,
                status: schema.submissions.status,
              })
              .from(schema.submissions)
              .where(
                and(
                  eq(schema.submissions.id, submissionId),
                  eq(schema.submissions.createdBy, actorUserId),
                ),
              )
              .for("update")
              .limit(1);

            if (!submission) {
              return { kind: "not_found" };
            }
            if (submission.status === "submitted") {
              const [alreadySubmitted] = await tx
                .select({
                  id: schema.submissions.id,
                  organizationId: schema.organizations.id,
                  journalId: schema.submissions.journalId,
                  organizationName: schema.organizations.name,
                  organizationSlug: schema.organizations.slug,
                  journalTitle: schema.journals.title,
                  journalSlug: schema.journals.slug,
                  title: schema.submissions.title,
                  abstract: schema.submissions.abstract,
                  keywords: schema.submissions.keywords,
                  createdAt: schema.submissions.createdAt,
                  updatedAt: schema.submissions.updatedAt,
                  status: schema.submissions.status,
                  submittedAt: schema.submissions.submittedAt,
                  submittedManuscriptVersion:
                    schema.submissions.submittedManuscriptVersion,
                })
                .from(schema.submissions)
                .innerJoin(
                  schema.journals,
                  eq(schema.journals.id, schema.submissions.journalId),
                )
                .innerJoin(
                  schema.organizations,
                  eq(
                    schema.organizations.id,
                    schema.journals.organizationId,
                  ),
                )
                .where(
                  and(
                    eq(schema.submissions.id, submissionId),
                    eq(schema.submissions.status, "submitted"),
                  ),
                )
                .limit(1);

              return alreadySubmitted
                ? { kind: "already_submitted", submission: alreadySubmitted as AuthorSubmission }
                : { kind: "not_found" };
            }

            const [manuscript] = await tx
              .select({
                id: schema.submissionManuscripts.id,
                version: schema.submissionManuscripts.version,
              })
              .from(schema.submissionManuscripts)
              .where(
                eq(
                  schema.submissionManuscripts.submissionId,
                  submissionId,
                ),
              )
              .orderBy(desc(schema.submissionManuscripts.version))
              .limit(1);

            if (!manuscript) {
              return { kind: "missing_manuscript" };
            }
            if (manuscript.id !== manuscriptId) {
              return { kind: "manuscript_changed" };
            }

            const [journal] = await tx
              .select({
                organizationId: schema.organizations.id,
                organizationName: schema.organizations.name,
                organizationSlug: schema.organizations.slug,
                journalTitle: schema.journals.title,
                journalSlug: schema.journals.slug,
              })
              .from(schema.journals)
              .innerJoin(
                schema.organizations,
                eq(schema.organizations.id, schema.journals.organizationId),
              )
              .where(eq(schema.journals.id, submission.journalId))
              .limit(1);

            if (!journal) {
              return { kind: "not_found" };
            }

            const submittedAt = new Date();
            const [updated] = await tx
              .update(schema.submissions)
              .set({
                status: "submitted",
                submittedAt,
                submittedManuscriptVersion: manuscript.version,
                updatedAt: submittedAt,
              })
              .where(
                and(
                  eq(schema.submissions.id, submissionId),
                  eq(schema.submissions.createdBy, actorUserId),
                  eq(schema.submissions.status, "draft"),
                ),
              )
              .returning({
                id: schema.submissions.id,
                journalId: schema.submissions.journalId,
                title: schema.submissions.title,
                abstract: schema.submissions.abstract,
                keywords: schema.submissions.keywords,
                createdAt: schema.submissions.createdAt,
                updatedAt: schema.submissions.updatedAt,
                status: schema.submissions.status,
                submittedAt: schema.submissions.submittedAt,
                submittedManuscriptVersion:
                  schema.submissions.submittedManuscriptVersion,
              });

            if (!updated) {
              return { kind: "not_found" };
            }

            return {
              kind: "submitted",
              submission: { ...updated, ...journal } as AuthorSubmission,
            };
          },
          async insertAuditEvent(event) {
            await tx.insert(schema.auditEvents).values(event);
          },
        };

        return work(transaction);
      });
    },
    async findDraftSubmissionForAuthor(actorUserId, submissionId) {
      const [submission] = await database
        .select({
          id: schema.submissions.id,
          organizationId: schema.organizations.id,
          journalId: schema.submissions.journalId,
          organizationName: schema.organizations.name,
          organizationSlug: schema.organizations.slug,
          journalTitle: schema.journals.title,
          journalSlug: schema.journals.slug,
          title: schema.submissions.title,
          abstract: schema.submissions.abstract,
          keywords: schema.submissions.keywords,
          createdAt: schema.submissions.createdAt,
          updatedAt: schema.submissions.updatedAt,
        })
        .from(schema.submissions)
        .innerJoin(
          schema.journals,
          eq(schema.journals.id, schema.submissions.journalId),
        )
        .innerJoin(
          schema.organizations,
          eq(schema.organizations.id, schema.journals.organizationId),
        )
        .where(
          and(
            eq(schema.submissions.id, submissionId),
            eq(schema.submissions.createdBy, actorUserId),
            eq(schema.submissions.status, "draft"),
          ),
        )
        .limit(1);

      return submission ?? null;
    },
    async findSubmissionForAuthor(actorUserId, submissionId): Promise<AuthorSubmission | null> {
      const [submission] = await database
        .select({
          id: schema.submissions.id,
          organizationId: schema.organizations.id,
          journalId: schema.submissions.journalId,
          organizationName: schema.organizations.name,
          organizationSlug: schema.organizations.slug,
          journalTitle: schema.journals.title,
          journalSlug: schema.journals.slug,
          title: schema.submissions.title,
          abstract: schema.submissions.abstract,
          keywords: schema.submissions.keywords,
          createdAt: schema.submissions.createdAt,
          updatedAt: schema.submissions.updatedAt,
          status: schema.submissions.status,
          submittedAt: schema.submissions.submittedAt,
          submittedManuscriptVersion:
            schema.submissions.submittedManuscriptVersion,
        })
        .from(schema.submissions)
        .innerJoin(
          schema.journals,
          eq(schema.journals.id, schema.submissions.journalId),
        )
        .innerJoin(
          schema.organizations,
          eq(schema.organizations.id, schema.journals.organizationId),
        )
        .where(
          and(
            eq(schema.submissions.id, submissionId),
            eq(schema.submissions.createdBy, actorUserId),
            inArray(schema.submissions.status, ["draft", "submitted"]),
          ),
        )
        .limit(1);

      return (submission ?? null) as AuthorSubmission | null;
    },
    async listSubmissionsForAuthor(actorUserId): Promise<AuthorSubmission[]> {
      return database
        .select({
          id: schema.submissions.id,
          organizationId: schema.organizations.id,
          journalId: schema.submissions.journalId,
          organizationName: schema.organizations.name,
          organizationSlug: schema.organizations.slug,
          journalTitle: schema.journals.title,
          journalSlug: schema.journals.slug,
          title: schema.submissions.title,
          abstract: schema.submissions.abstract,
          keywords: schema.submissions.keywords,
          createdAt: schema.submissions.createdAt,
          updatedAt: schema.submissions.updatedAt,
          status: schema.submissions.status,
          submittedAt: schema.submissions.submittedAt,
          submittedManuscriptVersion:
            schema.submissions.submittedManuscriptVersion,
        })
        .from(schema.submissions)
        .innerJoin(
          schema.journals,
          eq(schema.journals.id, schema.submissions.journalId),
        )
        .innerJoin(
          schema.organizations,
          eq(schema.organizations.id, schema.journals.organizationId),
        )
        .where(
          and(
            eq(schema.submissions.createdBy, actorUserId),
            inArray(schema.submissions.status, ["draft", "submitted"]),
          ),
        )
        .orderBy(desc(schema.submissions.updatedAt), asc(schema.submissions.title)) as Promise<AuthorSubmission[]>;
    },
    async listDraftSubmissionsForAuthor(actorUserId) {
      return database
        .select({
          id: schema.submissions.id,
          organizationId: schema.organizations.id,
          journalId: schema.submissions.journalId,
          organizationName: schema.organizations.name,
          organizationSlug: schema.organizations.slug,
          journalTitle: schema.journals.title,
          journalSlug: schema.journals.slug,
          title: schema.submissions.title,
          abstract: schema.submissions.abstract,
          keywords: schema.submissions.keywords,
          createdAt: schema.submissions.createdAt,
          updatedAt: schema.submissions.updatedAt,
        })
        .from(schema.submissions)
        .innerJoin(
          schema.journals,
          eq(schema.journals.id, schema.submissions.journalId),
        )
        .innerJoin(
          schema.organizations,
          eq(schema.organizations.id, schema.journals.organizationId),
        )
        .where(
          and(
            eq(schema.submissions.createdBy, actorUserId),
            eq(schema.submissions.status, "draft"),
          ),
        )
        .orderBy(desc(schema.submissions.updatedAt), asc(schema.submissions.title));
    },
    async listManuscriptsForAuthor(actorUserId, submissionId) {
      return database
        .select({
          id: schema.submissionManuscripts.id,
          version: schema.submissionManuscripts.version,
          contentType: schema.submissionManuscripts.contentType,
          byteSize: schema.submissionManuscripts.byteSize,
          sha256: schema.submissionManuscripts.sha256,
          uploadedAt: schema.submissionManuscripts.uploadedAt,
        })
        .from(schema.submissionManuscripts)
        .innerJoin(
          schema.submissions,
          eq(
            schema.submissions.id,
            schema.submissionManuscripts.submissionId,
          ),
        )
        .where(
          and(
            eq(schema.submissionManuscripts.submissionId, submissionId),
            eq(schema.submissions.createdBy, actorUserId),
          ),
        )
        .orderBy(desc(schema.submissionManuscripts.version));
    },
    async findManuscriptForAuthor(actorUserId, submissionId, manuscriptId) {
      const [manuscript] = await database
        .select({
          id: schema.submissionManuscripts.id,
          version: schema.submissionManuscripts.version,
          contentType: schema.submissionManuscripts.contentType,
          byteSize: schema.submissionManuscripts.byteSize,
          sha256: schema.submissionManuscripts.sha256,
          uploadedAt: schema.submissionManuscripts.uploadedAt,
          storageKey: schema.submissionManuscripts.storageKey,
        })
        .from(schema.submissionManuscripts)
        .innerJoin(
          schema.submissions,
          eq(
            schema.submissions.id,
            schema.submissionManuscripts.submissionId,
          ),
        )
        .where(
          and(
            eq(schema.submissionManuscripts.id, manuscriptId),
            eq(schema.submissionManuscripts.submissionId, submissionId),
            eq(schema.submissions.createdBy, actorUserId),
          ),
        )
        .limit(1);

      return manuscript ?? null;
    },
  };
}
