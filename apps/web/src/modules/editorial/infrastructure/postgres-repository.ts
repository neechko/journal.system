import { and, asc, desc, eq, inArray, isNotNull, isNull, ne, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/server/db/schema";
import { AppError } from "@/modules/shared/app-error";
import type { ReviewRecommendationSummary } from "../domain/decision";
import type { ReviewScores } from "../domain/review";
import type {
  EditorialRepository,
  EditorialTransaction,
  EditorialSubmission,
  EditorialSubmissionDetail,
  ReviewerAssignment,
  ReviewReport,
  EditorialDecision,
  EditorialAuditEvent,
  ScreeningInput,
  AssignReviewerInput,
  UnassignReviewerInput,
  SubmitReviewInput,
  RequestRevisionInput,
  RecordDecisionWriteInput,
  WithdrawSubmissionInput,
  SubmissionAuthor,
  SubmissionManuscript,
} from "../application/ports";
import type { SubmissionStatus } from "../domain/state-machine";

type SubmissionRow = {
  id: string;
  organizationId: string;
  journalId: string;
  organizationName: string;
  organizationSlug: string;
  journalTitle: string;
  journalSlug: string;
  title: string;
  abstract: string | null;
  keywords: string[];
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date | null;
  submittedManuscriptVersion: number | null;
  currentManuscriptVersion: number;
};

function mapSubmissionRow(row: SubmissionRow): EditorialSubmission {
  return {
    id: row.id,
    organizationId: row.organizationId,
    journalId: row.journalId,
    organizationName: row.organizationName,
    organizationSlug: row.organizationSlug,
    journalTitle: row.journalTitle,
    journalSlug: row.journalSlug,
    title: row.title,
    abstract: row.abstract,
    keywords: row.keywords,
    status: row.status as SubmissionStatus,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    submittedAt: row.submittedAt,
    submittedManuscriptVersion: row.submittedManuscriptVersion,
    currentManuscriptVersion: row.currentManuscriptVersion,
  };
}

/**
 * Projection shared by every read that needs a submission together with its
 * journal and organization. Keeping it in one place avoids duplicating the
 * joins across the state-transition methods.
 */
const submissionSelection = {
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
  status: schema.submissions.status,
  createdBy: schema.submissions.createdBy,
  createdAt: schema.submissions.createdAt,
  updatedAt: schema.submissions.updatedAt,
  submittedAt: schema.submissions.submittedAt,
  submittedManuscriptVersion: schema.submissions.submittedManuscriptVersion,
  currentManuscriptVersion: sql<number>`(
    SELECT COALESCE(MAX(${schema.submissionManuscripts.version}), 0)
    FROM ${schema.submissionManuscripts}
    WHERE ${schema.submissionManuscripts.submissionId} = ${schema.submissions.id}
  )`.as("currentManuscriptVersion"),
} as const;

/**
 * Editorial roles that may act on a journal's submission workflow. Kept in one
 * place so the repository and the use cases cannot drift apart.
 */
const EDITORIAL_JOURNAL_ROLES = [
  "editor_in_chief",
  "managing_editor",
  "editor",
] as const;

/**
 * Tenant scope for editorial reads and writes: either an organization admin of
 * the journal's organization, or an active journal-scoped editorial member.
 * Written as SQL so it can be reused across selects and updates.
 */
function editorialAccessCondition(userId: string) {
  return sql`(
    exists (
      select 1
      from ${schema.organizationMemberships}
      where ${schema.organizationMemberships.organizationId} = ${schema.organizations.id}
        and ${schema.organizationMemberships.userId} = ${userId}
        and ${schema.organizationMemberships.role} = 'organization_admin'
    )
    or exists (
      select 1
      from ${schema.journalMemberships}
      where ${schema.journalMemberships.journalId} = ${schema.journals.id}
        and ${schema.journalMemberships.userId} = ${userId}
        and ${schema.journalMemberships.revokedAt} is null
        and ${schema.journalMemberships.role} in (${sql.join(
          EDITORIAL_JOURNAL_ROLES.map((role) => sql`${role}`),
          sql`, `,
        )})
    )
  )`;
}

export function createPostgresEditorialRepository<
  TQueryResult extends PgQueryResultHKT,
>(
  database: PgDatabase<TQueryResult, typeof schema>,
): EditorialRepository {
  return {
    async transaction<T>(
      work: (transaction: EditorialTransaction) => Promise<T>,
    ): Promise<T> {
      return database.transaction(async (tx) => {
        /**
         * Re-reads a submission with its journal and organization after a state
         * change. `UPDATE ... FROM` cannot reference the target table again, so
         * transitions update first and then project the joined row here.
         */
        async function selectSubmissionRowById(
          submissionId: string,
        ): Promise<SubmissionRow | undefined> {
          const [row] = await tx
            .select(submissionSelection)
            .from(schema.submissions)
            .innerJoin(
              schema.journals,
              eq(schema.journals.id, schema.submissions.journalId),
            )
            .innerJoin(
              schema.organizations,
              eq(schema.organizations.id, schema.journals.organizationId),
            )
            .where(eq(schema.submissions.id, submissionId))
            .limit(1);

          return row;
        }

        const transaction: EditorialTransaction = {
          async findSubmissionForEditor(editorUserId, submissionId) {
            const rows = await tx
              .select(submissionSelection)
              .from(schema.submissions)
              .innerJoin(
                schema.journals,
                eq(schema.journals.id, schema.submissions.journalId),
              )
              .innerJoin(
                schema.organizations,
                eq(schema.organizations.id, schema.journals.organizationId),
              )
              .where(and(eq(schema.submissions.id, submissionId), ne(schema.submissions.status, "draft"), editorialAccessCondition(editorUserId)))
              .limit(1);

            return rows[0] ? mapSubmissionRow(rows[0]) : null;
          },

          async findSubmissionForAuthor(authorUserId, submissionId) {
            const rows = await tx
              .select(submissionSelection)
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
                  eq(schema.submissions.createdBy, authorUserId),
                ),
              )
              .limit(1);

            return rows[0] ? mapSubmissionRow(rows[0]) : null;
          },

          async listSubmissionsForEditor(editorUserId, journalId, statuses) {
            const conditions = [
              eq(schema.journals.id, journalId),
              ne(schema.submissions.status, "draft"),
              editorialAccessCondition(editorUserId),
            ];

            if (statuses && statuses.length > 0) {
              conditions.push(inArray(schema.submissions.status, statuses));
            }

            const rows = await tx
              .select(submissionSelection)
              .from(schema.submissions)
              .innerJoin(
                schema.journals,
                eq(schema.journals.id, schema.submissions.journalId),
              )
              .innerJoin(
                schema.organizations,
                eq(schema.organizations.id, schema.journals.organizationId),
              )
              .where(and(...conditions))
              .orderBy(desc(schema.submissions.updatedAt));

            return rows.map(mapSubmissionRow);
          },

          async getSubmissionDetailForEditor(editorUserId, submissionId) {
            const submission = await this.findSubmissionForEditor(editorUserId, submissionId);
            if (!submission) return null;

            return this.buildSubmissionDetail(submission.id, submission.organizationId);
          },

          async getSubmissionDetailForReviewer(reviewerUserId, submissionId) {
            const assignment = await tx
              .select({ id: schema.reviewerAssignments.id })
              .from(schema.reviewerAssignments)
              .where(
                and(
                  eq(schema.reviewerAssignments.reviewerUserId, reviewerUserId),
                  eq(schema.reviewerAssignments.submissionId, submissionId),
                  isNull(schema.reviewerAssignments.unassignedAt),
                ),
              )
              .limit(1);

            if (!assignment[0]) return null;

            const submission = await tx
              .select(submissionSelection)
              .from(schema.submissions)
              .innerJoin(
                schema.journals,
                eq(schema.journals.id, schema.submissions.journalId),
              )
              .innerJoin(
                schema.organizations,
                eq(schema.organizations.id, schema.journals.organizationId),
              )
              .where(eq(schema.submissions.id, submissionId))
              .limit(1);

            if (!submission[0]) return null;

            return this.buildSubmissionDetail(submission[0].id, submission[0].organizationId);
          },

          async screenSubmission(input: ScreeningInput) {
            const { submissionId, editorUserId, pass, reason } = input;

            const newStatus = pass ? "under_review" : "rejected";
            const now = new Date();

            const [updated] = await tx
              .update(schema.submissions)
              .set({
                status: newStatus,
                updatedAt: now,
                ...(pass ? {} : { rejectedAt: now, rejectionReason: reason }),
              })
              .where(eq(schema.submissions.id, submissionId))
              .returning({ id: schema.submissions.id });

            if (!updated) {
              throw new Error("Submission not found");
            }

            const row = await selectSubmissionRowById(submissionId);
            if (!row) {
              throw new Error("Submission not found");
            }

            return mapSubmissionRow(row);
          },

          async assignReviewer(input: AssignReviewerInput) {
            const { submissionId, editorUserId, reviewerUserId, role, dueAt, isBlind } = input;

            const [assignment] = await tx
              .insert(schema.reviewerAssignments)
              .values({
                submissionId,
                reviewerUserId,
                role,
                assignedBy: editorUserId,
                dueAt,
                isBlind,
              })
              .returning({
                id: schema.reviewerAssignments.id,
                submissionId: schema.reviewerAssignments.submissionId,
                reviewerUserId: schema.reviewerAssignments.reviewerUserId,
                role: schema.reviewerAssignments.role,
                assignedAt: schema.reviewerAssignments.assignedAt,
                assignedBy: schema.reviewerAssignments.assignedBy,
                dueAt: schema.reviewerAssignments.dueAt,
                completedAt: schema.reviewerAssignments.completedAt,
                unassignedAt: schema.reviewerAssignments.unassignedAt,
                unassignedBy: schema.reviewerAssignments.unassignedBy,
                unassignedReason: schema.reviewerAssignments.unassignedReason,
                isBlind: schema.reviewerAssignments.isBlind,
              });

            return mapAssignmentRow(assignment);
          },

          async unassignReviewer(input: UnassignReviewerInput) {
            const { assignmentId, editorUserId, reason } = input;

            const [updated] = await tx
              .update(schema.reviewerAssignments)
              .set({
                unassignedAt: new Date(),
                unassignedBy: editorUserId,
                unassignedReason: reason,
              })
              .where(eq(schema.reviewerAssignments.id, assignmentId))
              .returning({
                id: schema.reviewerAssignments.id,
                submissionId: schema.reviewerAssignments.submissionId,
                reviewerUserId: schema.reviewerAssignments.reviewerUserId,
                role: schema.reviewerAssignments.role,
                assignedAt: schema.reviewerAssignments.assignedAt,
                assignedBy: schema.reviewerAssignments.assignedBy,
                dueAt: schema.reviewerAssignments.dueAt,
                completedAt: schema.reviewerAssignments.completedAt,
                unassignedAt: schema.reviewerAssignments.unassignedAt,
                unassignedBy: schema.reviewerAssignments.unassignedBy,
                unassignedReason: schema.reviewerAssignments.unassignedReason,
                isBlind: schema.reviewerAssignments.isBlind,
              });

            if (!updated) {
              throw new Error("Assignment not found");
            }

            return mapAssignmentRow(updated);
          },

          async submitReview(input: SubmitReviewInput) {
            const { assignmentId, reviewerUserId, recommendation, commentsToAuthor, commentsToEditor, scores } = input;

            const [assignment] = await tx
              .select({ id: schema.reviewerAssignments.id, submissionId: schema.reviewerAssignments.submissionId })
              .from(schema.reviewerAssignments)
              .where(
                and(
                  eq(schema.reviewerAssignments.id, assignmentId),
                  eq(schema.reviewerAssignments.reviewerUserId, reviewerUserId),
                ),
              )
              .limit(1);

            if (!assignment) {
              throw new Error("Assignment not found");
            }

            const existingReviews = await tx
              .select({ version: schema.reviewReports.version })
              .from(schema.reviewReports)
              .where(eq(schema.reviewReports.assignmentId, assignmentId))
              .orderBy(desc(schema.reviewReports.version))
              .limit(1);

            const version = (existingReviews[0]?.version ?? 0) + 1;

            const [report] = await tx
              .insert(schema.reviewReports)
              .values({
                assignmentId,
                submissionId: assignment.submissionId,
                reviewerUserId,
                version,
                recommendation,
                commentsToAuthor,
                commentsToEditor,
                scores: scores ?? null,
              })
              .returning({
                id: schema.reviewReports.id,
                assignmentId: schema.reviewReports.assignmentId,
                submissionId: schema.reviewReports.submissionId,
                reviewerUserId: schema.reviewReports.reviewerUserId,
                version: schema.reviewReports.version,
                recommendation: schema.reviewReports.recommendation,
                commentsToAuthor: schema.reviewReports.commentsToAuthor,
                commentsToEditor: schema.reviewReports.commentsToEditor,
                scores: schema.reviewReports.scores,
                submittedAt: schema.reviewReports.submittedAt,
                acknowledgedAt: schema.reviewReports.acknowledgedAt,
              });

            await tx
              .update(schema.reviewerAssignments)
              .set({ completedAt: new Date() })
              .where(eq(schema.reviewerAssignments.id, assignmentId));

            return mapReviewReportRow(report);
          },

          async requestRevision(input: RequestRevisionInput) {
            const { submissionId, reason } = input;

            const now = new Date();
            const [updated] = await tx
              .update(schema.submissions)
              .set({
                status: "revision_requested",
                updatedAt: now,
                revisionRequestedAt: now,
                revisionReason: reason,
              })
              .where(and(
                eq(schema.submissions.id, submissionId),
                eq(schema.submissions.status, "under_review"),
              ))
              .returning({ id: schema.submissions.id });

            if (!updated) {
              throw new AppError("CONFLICT", "Submission state changed before revision request.");
            }

            const row = await selectSubmissionRowById(submissionId);
            if (!row) {
              throw new Error("Submission not found");
            }

            return mapSubmissionRow(row);
          },

          async recordDecision(input: RecordDecisionWriteInput) {
            const { submissionId, editorUserId, outcome, rationale, expectedStatus } = input;

            let newStatus: "accepted" | "rejected" | "revision_requested";
            if (outcome === "accept") newStatus = "accepted";
            else if (outcome === "reject") newStatus = "rejected";
            else newStatus = "revision_requested";

            const now = new Date();
            const [updated] = await tx
              .update(schema.submissions)
              .set({
                status: newStatus,
                updatedAt: now,
                ...(outcome === "accept" ? { acceptedAt: now } : {}),
                ...(outcome === "reject" ? { rejectedAt: now, rejectionReason: rationale } : {}),
                ...(outcome === "minor_revision" || outcome === "major_revision"
                  ? { revisionRequestedAt: now, revisionReason: rationale }
                  : {}),
              })
              .where(and(
                eq(schema.submissions.id, submissionId),
                eq(schema.submissions.status, expectedStatus),
              ))
              .returning({
                id: schema.submissions.id,
              });

            if (!updated) {
              throw new AppError("CONFLICT", "Submission state changed before decision.");
            }

            const reviewRows = await tx
              .select({
                assignmentId: schema.reviewReports.assignmentId,
                reviewerUserId: schema.reviewReports.reviewerUserId,
                role: schema.reviewerAssignments.role,
                recommendation: schema.reviewReports.recommendation,
                reviewVersion: schema.reviewReports.version,
              })
              .from(schema.reviewReports)
              .innerJoin(schema.reviewerAssignments, and(
                eq(schema.reviewerAssignments.id, schema.reviewReports.assignmentId),
                eq(schema.reviewerAssignments.submissionId, submissionId),
              ))
              .where(eq(schema.reviewReports.submissionId, submissionId))
              .orderBy(asc(schema.reviewReports.assignmentId), desc(schema.reviewReports.version));
            const latestReviews = new Map<string, ReviewRecommendationSummary>();
            for (const row of reviewRows) {
              if (!latestReviews.has(row.assignmentId)) latestReviews.set(row.assignmentId, row);
            }
            const reviewerRecommendations = [...latestReviews.values()];

            const [decision] = await tx
              .insert(schema.editorialDecisions)
              .values({
                submissionId,
                editorUserId,
                outcome,
                rationale,
                reviewerRecommendations,
              })
              .returning({
                id: schema.editorialDecisions.id,
                submissionId: schema.editorialDecisions.submissionId,
                editorUserId: schema.editorialDecisions.editorUserId,
                outcome: schema.editorialDecisions.outcome,
                rationale: schema.editorialDecisions.rationale,
                reviewerRecommendations: schema.editorialDecisions.reviewerRecommendations,
                createdAt: schema.editorialDecisions.createdAt,
                communicatedAt: schema.editorialDecisions.communicatedAt,
              });

            return mapDecisionRow(decision);
          },

          async withdrawSubmission(input: WithdrawSubmissionInput) {
            const { submissionId, authorUserId, reason } = input;

            const now = new Date();
            const [updated] = await tx
              .update(schema.submissions)
              .set({
                status: "withdrawn",
                updatedAt: now,
                withdrawnAt: now,
                withdrawalReason: reason,
              })
              .where(
                and(
                  eq(schema.submissions.id, submissionId),
                  eq(schema.submissions.createdBy, authorUserId),
                ),
              )
              .returning({ id: schema.submissions.id });

            if (!updated) {
              throw new Error("Submission not found or access denied");
            }

            const row = await selectSubmissionRowById(submissionId);
            if (!row) {
              throw new Error("Submission not found or access denied");
            }

            return mapSubmissionRow(row);
          },

          async insertAuditEvent(event) {
            await tx.insert(schema.auditEvents).values(event);
          },

          async buildSubmissionDetail(submissionId: string, organizationId: string): Promise<EditorialSubmissionDetail | null> {
            const submission = await tx
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
                status: schema.submissions.status,
                createdBy: schema.submissions.createdBy,
                createdAt: schema.submissions.createdAt,
                updatedAt: schema.submissions.updatedAt,
                submittedAt: schema.submissions.submittedAt,
                submittedManuscriptVersion: schema.submissions.submittedManuscriptVersion,
                currentManuscriptVersion: sql<number>`(
                  SELECT COALESCE(MAX(${schema.submissionManuscripts.version}), 0)
                  FROM ${schema.submissionManuscripts}
                  WHERE ${schema.submissionManuscripts.submissionId} = ${schema.submissions.id}
                )`.as("currentManuscriptVersion"),
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
              .where(eq(schema.submissions.id, submissionId))
              .limit(1);

            if (!submission[0]) return null;

            const [authors, manuscripts, assignments, reviews, decisions, auditEvents] = await Promise.all([
              tx
                .select({
                  id: schema.submissionAuthors.id,
                  userId: schema.submissionAuthors.userId,
                  name: schema.submissionAuthors.name,
                  email: schema.submissionAuthors.email,
                  affiliation: schema.submissionAuthors.affiliation,
                  orcid: schema.submissionAuthors.orcid,
                  isCorresponding: schema.submissionAuthors.isCorresponding,
                  order: schema.submissionAuthors.authorOrder,
                })
                .from(schema.submissionAuthors)
                .where(eq(schema.submissionAuthors.submissionId, submissionId))
                .orderBy(asc(schema.submissionAuthors.authorOrder)),
              tx
                .select({
                  id: schema.submissionManuscripts.id,
                  version: schema.submissionManuscripts.version,
                  contentType: schema.submissionManuscripts.contentType,
                  byteSize: schema.submissionManuscripts.byteSize,
                  sha256: schema.submissionManuscripts.sha256,
                  uploadedBy: schema.submissionManuscripts.uploadedBy,
                  uploadedAt: schema.submissionManuscripts.uploadedAt,
                })
                .from(schema.submissionManuscripts)
                .where(eq(schema.submissionManuscripts.submissionId, submissionId))
                .orderBy(desc(schema.submissionManuscripts.version)),
              tx
                .select({
                  id: schema.reviewerAssignments.id,
                  submissionId: schema.reviewerAssignments.submissionId,
                  reviewerUserId: schema.reviewerAssignments.reviewerUserId,
                  role: schema.reviewerAssignments.role,
                  assignedAt: schema.reviewerAssignments.assignedAt,
                  assignedBy: schema.reviewerAssignments.assignedBy,
                  dueAt: schema.reviewerAssignments.dueAt,
                  completedAt: schema.reviewerAssignments.completedAt,
                  unassignedAt: schema.reviewerAssignments.unassignedAt,
                  unassignedBy: schema.reviewerAssignments.unassignedBy,
                  unassignedReason: schema.reviewerAssignments.unassignedReason,
                  isBlind: schema.reviewerAssignments.isBlind,
                })
                .from(schema.reviewerAssignments)
                .where(eq(schema.reviewerAssignments.submissionId, submissionId))
                .orderBy(desc(schema.reviewerAssignments.assignedAt)),
              tx
                .select({
                  id: schema.reviewReports.id,
                  assignmentId: schema.reviewReports.assignmentId,
                  submissionId: schema.reviewReports.submissionId,
                  reviewerUserId: schema.reviewReports.reviewerUserId,
                  version: schema.reviewReports.version,
                  recommendation: schema.reviewReports.recommendation,
                  commentsToAuthor: schema.reviewReports.commentsToAuthor,
                  commentsToEditor: schema.reviewReports.commentsToEditor,
                  scores: schema.reviewReports.scores,
                  submittedAt: schema.reviewReports.submittedAt,
                  acknowledgedAt: schema.reviewReports.acknowledgedAt,
                })
                .from(schema.reviewReports)
                .innerJoin(
                  schema.reviewerAssignments,
                  eq(schema.reviewerAssignments.id, schema.reviewReports.assignmentId),
                )
                .where(eq(schema.reviewerAssignments.submissionId, submissionId))
                .orderBy(desc(schema.reviewReports.submittedAt)),
              tx
                .select({
                  id: schema.editorialDecisions.id,
                  submissionId: schema.editorialDecisions.submissionId,
                  editorUserId: schema.editorialDecisions.editorUserId,
                  outcome: schema.editorialDecisions.outcome,
                  rationale: schema.editorialDecisions.rationale,
                  reviewerRecommendations: schema.editorialDecisions.reviewerRecommendations,
                  createdAt: schema.editorialDecisions.createdAt,
                  communicatedAt: schema.editorialDecisions.communicatedAt,
                })
                .from(schema.editorialDecisions)
                .where(eq(schema.editorialDecisions.submissionId, submissionId))
                .orderBy(desc(schema.editorialDecisions.createdAt)),
              tx
                .select({
                  id: schema.auditEvents.id,
                  organizationId: schema.auditEvents.organizationId,
                  action: schema.auditEvents.action,
                  entityType: schema.auditEvents.entityType,
                  entityId: schema.auditEvents.entityId,
                  actorUserId: schema.auditEvents.actorUserId,
                  actorLabel: schema.auditEvents.actorLabel,
                  actorType: schema.auditEvents.actorType,
                  reason: schema.auditEvents.reason,
                  stateBefore: schema.auditEvents.stateBefore,
                  stateAfter: schema.auditEvents.stateAfter,
                  source: schema.auditEvents.source,
                  correlationId: schema.auditEvents.correlationId,
                  occurredAt: schema.auditEvents.occurredAt,
                })
                .from(schema.auditEvents)
                .where(
                  and(
                    eq(schema.auditEvents.entityType, "submission"),
                    eq(schema.auditEvents.entityId, submissionId),
                  ),
                )
                .orderBy(desc(schema.auditEvents.occurredAt)),
            ]);

            return {
              ...mapSubmissionRow(submission[0]),
              authors: authors.map((a) => ({
                id: a.id,
                userId: a.userId,
                name: a.name,
                email: a.email,
                affiliation: a.affiliation,
                orcid: a.orcid,
                isCorresponding: a.isCorresponding,
                order: a.order,
              })),
              manuscripts: manuscripts.map((m) => ({
                id: m.id,
                version: m.version,
                contentType: m.contentType,
                byteSize: m.byteSize,
                sha256: m.sha256,
                uploadedBy: m.uploadedBy,
                uploadedAt: m.uploadedAt,
              })),
              assignments: assignments.map(mapAssignmentRow),
              reviews: reviews.map(mapReviewReportRow),
              decisions: decisions.map(mapDecisionRow),
              auditEvents: auditEvents.map((a) => ({
                id: a.id,
                organizationId: a.organizationId,
                action: a.action,
                entityType: a.entityType,
                entityId: a.entityId,
                actorUserId: a.actorUserId,
                actorLabel: a.actorLabel,
                actorType: a.actorType as "human" | "system" | "ai" | null,
                reason: a.reason,
                stateBefore: a.stateBefore,
                stateAfter: a.stateAfter,
                source: a.source,
                correlationId: a.correlationId,
                occurredAt: a.occurredAt,
              })),
            };
          },
        };

        return work(transaction);
      });
    },

    async findSubmissionForEditor(editorUserId, submissionId) {
      const rows = await database
        .select(submissionSelection)
        .from(schema.submissions)
        .innerJoin(
          schema.journals,
          eq(schema.journals.id, schema.submissions.journalId),
        )
        .innerJoin(
          schema.organizations,
          eq(schema.organizations.id, schema.journals.organizationId),
        )
        .where(and(eq(schema.submissions.id, submissionId), ne(schema.submissions.status, "draft"), editorialAccessCondition(editorUserId)))
        .limit(1);

      return rows[0] ? mapSubmissionRow(rows[0]) : null;
    },

    async findSubmissionForAuthor(authorUserId, submissionId) {
      const rows = await database
        .select(submissionSelection)
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
            eq(schema.submissions.createdBy, authorUserId),
          ),
        )
        .limit(1);

      return rows[0] ? mapSubmissionRow(rows[0]) : null;
    },

    async listSubmissionsForEditor(editorUserId, journalId, statuses) {
      const conditions = [
        eq(schema.journals.id, journalId),
        ne(schema.submissions.status, "draft"),
        editorialAccessCondition(editorUserId),
      ];

      if (statuses && statuses.length > 0) {
        conditions.push(inArray(schema.submissions.status, statuses));
      }

      const rows = await database
        .select(submissionSelection)
        .from(schema.submissions)
        .innerJoin(
          schema.journals,
          eq(schema.journals.id, schema.submissions.journalId),
        )
        .innerJoin(
          schema.organizations,
          eq(schema.organizations.id, schema.journals.organizationId),
        )
        .where(and(...conditions))
        .orderBy(desc(schema.submissions.updatedAt));

      return rows.map(mapSubmissionRow);
    },

    async getSubmissionDetailForEditor(editorUserId, submissionId) {
      const submission = await this.findSubmissionForEditor(editorUserId, submissionId);
      if (!submission) return null;

      return buildSubmissionDetail(database, submissionId, submission.organizationId);
    },

    async findAssignment(assignmentId) {
      const [assignment] = await database
        .select({
          assignmentId: schema.reviewerAssignments.id,
          submissionId: schema.reviewerAssignments.submissionId,
          reviewerUserId: schema.reviewerAssignments.reviewerUserId,
        })
        .from(schema.reviewerAssignments)
        .where(eq(schema.reviewerAssignments.id, assignmentId))
        .limit(1);

      return assignment ?? null;
    },

    async getManuscriptForReviewer(reviewerUserId, submissionId, manuscriptId) {
      const [assignment] = await database
        .select({ id: schema.reviewerAssignments.id })
        .from(schema.reviewerAssignments)
        .where(
          and(
            eq(schema.reviewerAssignments.reviewerUserId, reviewerUserId),
            eq(schema.reviewerAssignments.submissionId, submissionId),
            isNull(schema.reviewerAssignments.unassignedAt),
          ),
        )
        .limit(1);

      if (!assignment) return null;

      const [manuscript] = await database
        .select({
          id: schema.submissionManuscripts.id,
          submissionId: schema.submissionManuscripts.submissionId,
          version: schema.submissionManuscripts.version,
          contentType: schema.submissionManuscripts.contentType,
          byteSize: schema.submissionManuscripts.byteSize,
          sha256: schema.submissionManuscripts.sha256,
          storageKey: schema.submissionManuscripts.storageKey,
        })
        .from(schema.submissionManuscripts)
        .where(
          and(
            eq(schema.submissionManuscripts.id, manuscriptId),
            eq(schema.submissionManuscripts.submissionId, submissionId),
          ),
        )
        .limit(1);

      if (!manuscript) return null;

      return {
        ...manuscript,
        contentType: "application/pdf" as const,
      };
    },

    async getSubmissionDetailForReviewer(reviewerUserId, submissionId) {
      const assignment = await database
        .select({ id: schema.reviewerAssignments.id })
        .from(schema.reviewerAssignments)
        .where(
          and(
            eq(schema.reviewerAssignments.reviewerUserId, reviewerUserId),
            eq(schema.reviewerAssignments.submissionId, submissionId),
            isNull(schema.reviewerAssignments.unassignedAt),
          ),
        )
        .limit(1);

      if (!assignment[0]) return null;

      const submission = await database
        .select(submissionSelection)
        .from(schema.submissions)
        .innerJoin(
          schema.journals,
          eq(schema.journals.id, schema.submissions.journalId),
        )
        .innerJoin(
          schema.organizations,
          eq(schema.organizations.id, schema.journals.organizationId),
        )
        .where(eq(schema.submissions.id, submissionId))
        .limit(1);

      if (!submission[0]) return null;

      return buildSubmissionDetail(database, submission[0].id, submission[0].organizationId);
    },
  };
}

async function buildSubmissionDetail(
  database: PgDatabase<PgQueryResultHKT, typeof schema>,
  submissionId: string,
  organizationId: string
): Promise<EditorialSubmissionDetail | null> {
  const submission = await database
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
      status: schema.submissions.status,
      createdBy: schema.submissions.createdBy,
      createdAt: schema.submissions.createdAt,
      updatedAt: schema.submissions.updatedAt,
      submittedAt: schema.submissions.submittedAt,
      submittedManuscriptVersion: schema.submissions.submittedManuscriptVersion,
      currentManuscriptVersion: sql<number>`(
        SELECT COALESCE(MAX(${schema.submissionManuscripts.version}), 0)
        FROM ${schema.submissionManuscripts}
        WHERE ${schema.submissionManuscripts.submissionId} = ${schema.submissions.id}
      )`.as("currentManuscriptVersion"),
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
    .where(eq(schema.submissions.id, submissionId))
    .limit(1);

  if (!submission[0]) return null;

  const [authors, manuscripts, assignments, reviews, decisions, auditEvents] = await Promise.all([
    database
      .select({
        id: schema.submissionAuthors.id,
        userId: schema.submissionAuthors.userId,
        name: schema.submissionAuthors.name,
        email: schema.submissionAuthors.email,
        affiliation: schema.submissionAuthors.affiliation,
        orcid: schema.submissionAuthors.orcid,
        isCorresponding: schema.submissionAuthors.isCorresponding,
        order: schema.submissionAuthors.authorOrder,
      })
      .from(schema.submissionAuthors)
      .where(eq(schema.submissionAuthors.submissionId, submissionId))
      .orderBy(asc(schema.submissionAuthors.authorOrder)),
    database
      .select({
        id: schema.submissionManuscripts.id,
        version: schema.submissionManuscripts.version,
        contentType: schema.submissionManuscripts.contentType,
        byteSize: schema.submissionManuscripts.byteSize,
        sha256: schema.submissionManuscripts.sha256,
        uploadedBy: schema.submissionManuscripts.uploadedBy,
        uploadedAt: schema.submissionManuscripts.uploadedAt,
      })
      .from(schema.submissionManuscripts)
      .where(eq(schema.submissionManuscripts.submissionId, submissionId))
      .orderBy(desc(schema.submissionManuscripts.version)),
    database
      .select({
        id: schema.reviewerAssignments.id,
        submissionId: schema.reviewerAssignments.submissionId,
        reviewerUserId: schema.reviewerAssignments.reviewerUserId,
        role: schema.reviewerAssignments.role,
        assignedAt: schema.reviewerAssignments.assignedAt,
        assignedBy: schema.reviewerAssignments.assignedBy,
        dueAt: schema.reviewerAssignments.dueAt,
        completedAt: schema.reviewerAssignments.completedAt,
        unassignedAt: schema.reviewerAssignments.unassignedAt,
        unassignedBy: schema.reviewerAssignments.unassignedBy,
        unassignedReason: schema.reviewerAssignments.unassignedReason,
        isBlind: schema.reviewerAssignments.isBlind,
      })
      .from(schema.reviewerAssignments)
      .where(eq(schema.reviewerAssignments.submissionId, submissionId))
      .orderBy(desc(schema.reviewerAssignments.assignedAt)),
    database
      .select({
        id: schema.reviewReports.id,
        assignmentId: schema.reviewReports.assignmentId,
        submissionId: schema.reviewReports.submissionId,
        reviewerUserId: schema.reviewReports.reviewerUserId,
        version: schema.reviewReports.version,
        recommendation: schema.reviewReports.recommendation,
        commentsToAuthor: schema.reviewReports.commentsToAuthor,
        commentsToEditor: schema.reviewReports.commentsToEditor,
        scores: schema.reviewReports.scores,
        submittedAt: schema.reviewReports.submittedAt,
        acknowledgedAt: schema.reviewReports.acknowledgedAt,
      })
      .from(schema.reviewReports)
      .innerJoin(
        schema.reviewerAssignments,
        eq(schema.reviewerAssignments.id, schema.reviewReports.assignmentId),
      )
      .where(eq(schema.reviewerAssignments.submissionId, submissionId))
      .orderBy(desc(schema.reviewReports.submittedAt)),
    database
      .select({
        id: schema.editorialDecisions.id,
        submissionId: schema.editorialDecisions.submissionId,
        editorUserId: schema.editorialDecisions.editorUserId,
        outcome: schema.editorialDecisions.outcome,
        rationale: schema.editorialDecisions.rationale,
        reviewerRecommendations: schema.editorialDecisions.reviewerRecommendations,
        createdAt: schema.editorialDecisions.createdAt,
        communicatedAt: schema.editorialDecisions.communicatedAt,
      })
      .from(schema.editorialDecisions)
      .where(eq(schema.editorialDecisions.submissionId, submissionId))
      .orderBy(desc(schema.editorialDecisions.createdAt)),
    database
      .select({
        id: schema.auditEvents.id,
        organizationId: schema.auditEvents.organizationId,
        action: schema.auditEvents.action,
        entityType: schema.auditEvents.entityType,
        entityId: schema.auditEvents.entityId,
        actorUserId: schema.auditEvents.actorUserId,
        actorLabel: schema.auditEvents.actorLabel,
        actorType: schema.auditEvents.actorType,
        reason: schema.auditEvents.reason,
        stateBefore: schema.auditEvents.stateBefore,
        stateAfter: schema.auditEvents.stateAfter,
        source: schema.auditEvents.source,
        correlationId: schema.auditEvents.correlationId,
        occurredAt: schema.auditEvents.occurredAt,
      })
      .from(schema.auditEvents)
      .where(
        and(
          eq(schema.auditEvents.entityType, "submission"),
          eq(schema.auditEvents.entityId, submissionId),
        ),
      )
      .orderBy(desc(schema.auditEvents.occurredAt)),
  ]);

  return {
    ...mapSubmissionRow(submission[0]),
    authors: authors.map((a) => ({
      id: a.id,
      userId: a.userId,
      name: a.name,
      email: a.email,
      affiliation: a.affiliation,
      orcid: a.orcid,
      isCorresponding: a.isCorresponding,
      order: a.order,
    })),
    manuscripts: manuscripts.map((m) => ({
      id: m.id,
      version: m.version,
      contentType: m.contentType,
      byteSize: m.byteSize,
      sha256: m.sha256,
      uploadedBy: m.uploadedBy,
      uploadedAt: m.uploadedAt,
    })),
    assignments: assignments.map(mapAssignmentRow),
    reviews: reviews.map(mapReviewReportRow),
    decisions: decisions.map(mapDecisionRow),
    auditEvents: auditEvents.map((a) => ({
      id: a.id,
      organizationId: a.organizationId,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      actorUserId: a.actorUserId,
      actorLabel: a.actorLabel,
      actorType: a.actorType as "human" | "system" | "ai" | null,
      reason: a.reason,
      stateBefore: a.stateBefore,
      stateAfter: a.stateAfter,
      source: a.source,
      correlationId: a.correlationId,
      occurredAt: a.occurredAt,
    })),
  };
}

type AssignmentRow = InferSelectModel<typeof schema.reviewerAssignments>;

function mapAssignmentRow(row: AssignmentRow): ReviewerAssignment {
  return {
    id: row.id,
    submissionId: row.submissionId,
    reviewerUserId: row.reviewerUserId,
    role: row.role,
    assignedAt: row.assignedAt,
    assignedBy: row.assignedBy,
    dueAt: row.dueAt,
    completedAt: row.completedAt,
    unassignedAt: row.unassignedAt,
    unassignedBy: row.unassignedBy,
    unassignedReason: row.unassignedReason,
    isBlind: row.isBlind,
  };
}

type ReviewReportRow = InferSelectModel<typeof schema.reviewReports>;

const reviewScoresSchema = z.object({
  originality: z.number().int().min(1).max(5).nullable(),
  methodology: z.number().int().min(1).max(5).nullable(),
  clarity: z.number().int().min(1).max(5).nullable(),
  significance: z.number().int().min(1).max(5).nullable(),
  overall: z.number().int().min(1).max(5).nullable(),
});

function readReviewScores(value: unknown): ReviewScores | null {
  if (value === null) return null;
  const parsed: unknown = typeof value === "string" ? JSON.parse(value) : value;
  return reviewScoresSchema.parse(parsed);
}

function mapReviewReportRow(row: ReviewReportRow): ReviewReport {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    submissionId: row.submissionId,
    reviewerUserId: row.reviewerUserId,
    version: row.version,
    recommendation: row.recommendation,
    commentsToAuthor: row.commentsToAuthor,
    commentsToEditor: row.commentsToEditor,
    scores: readReviewScores(row.scores),
    submittedAt: row.submittedAt,
    acknowledgedAt: row.acknowledgedAt,
  };
}

type DecisionRow = InferSelectModel<typeof schema.editorialDecisions>;

const recommendationSnapshotSchema = z.array(z.object({
  assignmentId: z.string(),
  reviewerUserId: z.string(),
  role: z.string(),
  recommendation: z.string(),
  reviewVersion: z.number().int(),
}));

function readRecommendationSnapshot(value: unknown): ReviewRecommendationSummary[] {
  const parsed: unknown = typeof value === "string" ? JSON.parse(value) : value;
  return recommendationSnapshotSchema.parse(parsed);
}

function mapDecisionRow(row: DecisionRow): EditorialDecision {
  return {
    id: row.id,
    submissionId: row.submissionId,
    editorUserId: row.editorUserId,
    outcome: row.outcome,
    rationale: row.rationale,
    reviewerRecommendations: readRecommendationSnapshot(row.reviewerRecommendations),
    createdAt: row.createdAt,
    communicatedAt: row.communicatedAt,
  };
}
