import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import * as schema from "@/server/db/schema";
import type {
  ProductionRepository,
  ProductionTransaction,
  ProductionSubmission,
  ArticleVersion,
  Volume,
  Issue,
  ArticleInIssue,
  SubmissionAuthor,
  ProductionAuditEventInput,
} from "../application/ports";
import { buildCrossrefXml, type DoiRegistration } from "../domain/doi";

export function createPostgresProductionRepository<
  TQueryResult extends PgQueryResultHKT,
>(
  database: PgDatabase<TQueryResult, typeof schema>,
): ProductionRepository {
  return {
    async transaction<T>(
      work: (transaction: ProductionTransaction) => Promise<T>,
    ): Promise<T> {
      return database.transaction(async (tx) => {
        const transaction: ProductionTransaction = {
          async findSubmissionForProduction(productionUserId, submissionId) {
            const rows = await tx
              .select({
                id: schema.submissions.id,
                organizationId: schema.organizations.id,
                journalId: schema.submissions.journalId,
                title: schema.submissions.title,
                abstract: schema.submissions.abstract,
                keywords: schema.submissions.keywords,
                status: schema.submissions.status,
                createdBy: schema.submissions.createdBy,
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
              .innerJoin(
                schema.organizationMemberships,
                and(
                  eq(schema.organizationMemberships.organizationId, schema.organizations.id),
                  eq(schema.organizationMemberships.userId, productionUserId),
                  eq(schema.organizationMemberships.role, "organization_admin"),
                ),
              )
              .where(
                and(
                  eq(schema.submissions.id, submissionId),
                  eq(schema.submissions.status, "accepted"),
                ),
              )
              .limit(1);

            if (!rows[0]) return null;

            const authors = await tx
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
              .orderBy(asc(schema.submissionAuthors.authorOrder));

            return {
              ...rows[0],
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
            };
          },

          async listAcceptedSubmissions(productionUserId, journalId) {
            const rows = await tx
              .select({
                id: schema.submissions.id,
                organizationId: schema.organizations.id,
                journalId: schema.submissions.journalId,
                title: schema.submissions.title,
                abstract: schema.submissions.abstract,
                keywords: schema.submissions.keywords,
                status: schema.submissions.status,
                createdBy: schema.submissions.createdBy,
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
              .innerJoin(
                schema.organizationMemberships,
                and(
                  eq(schema.organizationMemberships.organizationId, schema.organizations.id),
                  eq(schema.organizationMemberships.userId, productionUserId),
                  eq(schema.organizationMemberships.role, "organization_admin"),
                ),
              )
              .where(
                and(
                  eq(schema.journals.id, journalId),
                  eq(schema.submissions.status, "accepted"),
                ),
              )
              .orderBy(desc(schema.submissions.acceptedAt));

            const submissionsWithAuthors = await Promise.all(
              rows.map(async (row) => {
                const authors = await tx
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
                  .where(eq(schema.submissionAuthors.submissionId, row.id))
                  .orderBy(asc(schema.submissionAuthors.authorOrder));

                return {
                  ...row,
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
                };
              })
            );

            return submissionsWithAuthors;
          },

          async createArticleVersion(submissionId, version, title, abstract, keywords, authors) {
            const [article] = await tx
              .insert(schema.articleVersions)
              .values({
                submissionId,
                version,
                status: "draft",
                title,
                abstract,
                keywords,
                authors: JSON.stringify(authors),
              })
              .returning({
                id: schema.articleVersions.id,
                submissionId: schema.articleVersions.submissionId,
                version: schema.articleVersions.version,
                status: schema.articleVersions.status,
                title: schema.articleVersions.title,
                abstract: schema.articleVersions.abstract,
                keywords: schema.articleVersions.keywords,
                authors: schema.articleVersions.authors,
                doi: schema.articleVersions.doi,
                manuscriptFileId: schema.articleVersions.manuscriptFileId,
                xmlContent: schema.articleVersions.xmlContent,
                pdfFileId: schema.articleVersions.pdfFileId,
                htmlContent: schema.articleVersions.htmlContent,
                createdAt: schema.articleVersions.createdAt,
                updatedAt: schema.articleVersions.updatedAt,
                publishedAt: schema.articleVersions.publishedAt,
                publishedBy: schema.articleVersions.publishedBy,
              });

            return mapArticleVersionRow(article);
          },

          async updateArticleVersion(articleId, updates) {
            const [updated] = await tx
              .update(schema.articleVersions)
              .set({
                ...updates,
                authors: updates.authors ? JSON.stringify(updates.authors) : undefined,
                updatedAt: new Date(),
              })
              .where(eq(schema.articleVersions.id, articleId))
              .returning({
                id: schema.articleVersions.id,
                submissionId: schema.articleVersions.submissionId,
                version: schema.articleVersions.version,
                status: schema.articleVersions.status,
                title: schema.articleVersions.title,
                abstract: schema.articleVersions.abstract,
                keywords: schema.articleVersions.keywords,
                authors: schema.articleVersions.authors,
                doi: schema.articleVersions.doi,
                manuscriptFileId: schema.articleVersions.manuscriptFileId,
                xmlContent: schema.articleVersions.xmlContent,
                pdfFileId: schema.articleVersions.pdfFileId,
                htmlContent: schema.articleVersions.htmlContent,
                createdAt: schema.articleVersions.createdAt,
                updatedAt: schema.articleVersions.updatedAt,
                publishedAt: schema.articleVersions.publishedAt,
                publishedBy: schema.articleVersions.publishedBy,
              });

            if (!updated) {
              throw new Error("Article version not found");
            }

            return mapArticleVersionRow(updated);
          },

          async transitionArticleStatus(articleId, newStatus, actorUserId) {
            const [updated] = await tx
              .update(schema.articleVersions)
              .set({
                status: newStatus,
                updatedAt: new Date(),
                ...(newStatus === "published" ? { publishedAt: new Date(), publishedBy: actorUserId } : {}),
              })
              .where(eq(schema.articleVersions.id, articleId))
              .returning({
                id: schema.articleVersions.id,
                submissionId: schema.articleVersions.submissionId,
                version: schema.articleVersions.version,
                status: schema.articleVersions.status,
                title: schema.articleVersions.title,
                abstract: schema.articleVersions.abstract,
                keywords: schema.articleVersions.keywords,
                authors: schema.articleVersions.authors,
                doi: schema.articleVersions.doi,
                manuscriptFileId: schema.articleVersions.manuscriptFileId,
                xmlContent: schema.articleVersions.xmlContent,
                pdfFileId: schema.articleVersions.pdfFileId,
                htmlContent: schema.articleVersions.htmlContent,
                createdAt: schema.articleVersions.createdAt,
                updatedAt: schema.articleVersions.updatedAt,
                publishedAt: schema.articleVersions.publishedAt,
                publishedBy: schema.articleVersions.publishedBy,
              });

            if (!updated) {
              throw new Error("Article version not found");
            }

            return mapArticleVersionRow(updated);
          },

          async assignDoi(articleId, doi) {
            const [updated] = await tx
              .update(schema.articleVersions)
              .set({ doi, updatedAt: new Date() })
              .where(eq(schema.articleVersions.id, articleId))
              .returning({
                id: schema.articleVersions.id,
                submissionId: schema.articleVersions.submissionId,
                version: schema.articleVersions.version,
                status: schema.articleVersions.status,
                title: schema.articleVersions.title,
                abstract: schema.articleVersions.abstract,
                keywords: schema.articleVersions.keywords,
                authors: schema.articleVersions.authors,
                doi: schema.articleVersions.doi,
                manuscriptFileId: schema.articleVersions.manuscriptFileId,
                xmlContent: schema.articleVersions.xmlContent,
                pdfFileId: schema.articleVersions.pdfFileId,
                htmlContent: schema.articleVersions.htmlContent,
                createdAt: schema.articleVersions.createdAt,
                updatedAt: schema.articleVersions.updatedAt,
                publishedAt: schema.articleVersions.publishedAt,
                publishedBy: schema.articleVersions.publishedBy,
              });

            if (!updated) {
              throw new Error("Article version not found");
            }

            return mapArticleVersionRow(updated);
          },

          async setManuscriptFile(articleId, fileId) {
            const [updated] = await tx
              .update(schema.articleVersions)
              .set({ manuscriptFileId: fileId, updatedAt: new Date() })
              .where(eq(schema.articleVersions.id, articleId))
              .returning();

            if (!updated) {
              throw new Error("Article version not found");
            }

            return mapArticleVersionRow(updated);
          },

          async setPdfFile(articleId, fileId) {
            const [updated] = await tx
              .update(schema.articleVersions)
              .set({ pdfFileId: fileId, updatedAt: new Date() })
              .where(eq(schema.articleVersions.id, articleId))
              .returning();

            if (!updated) {
              throw new Error("Article version not found");
            }

            return mapArticleVersionRow(updated);
          },

          async createVolume(journalId, number, year, label) {
            const [volume] = await tx
              .insert(schema.volumes)
              .values({ journalId, number, year, label })
              .returning({
                id: schema.volumes.id,
                journalId: schema.volumes.journalId,
                number: schema.volumes.number,
                year: schema.volumes.year,
                label: schema.volumes.label,
                createdAt: schema.volumes.createdAt,
                updatedAt: schema.volumes.updatedAt,
              });

            return mapVolumeRow(volume);
          },

          async createIssue(journalId, number, year, options) {
            const [issue] = await tx
              .insert(schema.issues)
              .values({
                journalId,
                volumeId: options.volumeId ?? null,
                number,
                year,
                label: options.label ?? null,
                status: "planned",
                description: options.description ?? null,
              })
              .returning({
                id: schema.issues.id,
                journalId: schema.issues.journalId,
                volumeId: schema.issues.volumeId,
                number: schema.issues.number,
                year: schema.issues.year,
                label: schema.issues.label,
                status: schema.issues.status,
                coverImageFileId: schema.issues.coverImageFileId,
                description: schema.issues.description,
                publishedAt: schema.issues.publishedAt,
                publishedBy: schema.issues.publishedBy,
                createdAt: schema.issues.createdAt,
                updatedAt: schema.issues.updatedAt,
              });

            return mapIssueRow(issue);
          },

          async updateIssue(issueId, updates) {
            const [updated] = await tx
              .update(schema.issues)
              .set({
                ...updates,
                updatedAt: new Date(),
              })
              .where(eq(schema.issues.id, issueId))
              .returning({
                id: schema.issues.id,
                journalId: schema.issues.journalId,
                volumeId: schema.issues.volumeId,
                number: schema.issues.number,
                year: schema.issues.year,
                label: schema.issues.label,
                status: schema.issues.status,
                coverImageFileId: schema.issues.coverImageFileId,
                description: schema.issues.description,
                publishedAt: schema.issues.publishedAt,
                publishedBy: schema.issues.publishedBy,
                createdAt: schema.issues.createdAt,
                updatedAt: schema.issues.updatedAt,
              });

            if (!updated) {
              throw new Error("Issue not found");
            }

            return mapIssueRow(updated);
          },

          async transitionIssueStatus(issueId, newStatus, actorUserId) {
            const [updated] = await tx
              .update(schema.issues)
              .set({
                status: newStatus,
                updatedAt: new Date(),
                ...(newStatus === "published" ? { publishedAt: new Date(), publishedBy: actorUserId } : {}),
              })
              .where(eq(schema.issues.id, issueId))
              .returning({
                id: schema.issues.id,
                journalId: schema.issues.journalId,
                volumeId: schema.issues.volumeId,
                number: schema.issues.number,
                year: schema.issues.year,
                label: schema.issues.label,
                status: schema.issues.status,
                coverImageFileId: schema.issues.coverImageFileId,
                description: schema.issues.description,
                publishedAt: schema.issues.publishedAt,
                publishedBy: schema.issues.publishedBy,
                createdAt: schema.issues.createdAt,
                updatedAt: schema.issues.updatedAt,
              });

            if (!updated) {
              throw new Error("Issue not found");
            }

            return mapIssueRow(updated);
          },

          async addArticleToIssue(articleId, issueId, options) {
            const [inserted] = await tx
              .insert(schema.issueArticles)
              .values({
                articleId,
                issueId,
                pageStart: options.pageStart ?? null,
                pageEnd: options.pageEnd ?? null,
                order: options.order,
                articleType: options.articleType ?? null,
              })
              .returning();

            if (!inserted) {
              throw new Error("Failed to add article to issue");
            }

            return {
              id: inserted.id,
              articleId: inserted.articleId,
              issueId: inserted.issueId,
              pageStart: inserted.pageStart,
              pageEnd: inserted.pageEnd,
              order: inserted.order,
              articleType: inserted.articleType,
            };
          },

          async removeArticleFromIssue(articleId, issueId) {
            await tx
              .delete(schema.issueArticles)
              .where(
                and(
                  eq(schema.issueArticles.articleId, articleId),
                  eq(schema.issueArticles.issueId, issueId),
                ),
              );
          },

          async getArticleWithIssue(articleId) {
            const article = await tx
              .select({
                id: schema.articleVersions.id,
                submissionId: schema.articleVersions.submissionId,
                version: schema.articleVersions.version,
                status: schema.articleVersions.status,
                title: schema.articleVersions.title,
                abstract: schema.articleVersions.abstract,
                keywords: schema.articleVersions.keywords,
                authors: schema.articleVersions.authors,
                doi: schema.articleVersions.doi,
                manuscriptFileId: schema.articleVersions.manuscriptFileId,
                xmlContent: schema.articleVersions.xmlContent,
                pdfFileId: schema.articleVersions.pdfFileId,
                htmlContent: schema.articleVersions.htmlContent,
                createdAt: schema.articleVersions.createdAt,
                updatedAt: schema.articleVersions.updatedAt,
                publishedAt: schema.articleVersions.publishedAt,
                publishedBy: schema.articleVersions.publishedBy,
              })
              .from(schema.articleVersions)
              .where(eq(schema.articleVersions.id, articleId))
              .limit(1);

            if (!article[0]) return null;

            const issueArticle = await tx
              .select({
                issueId: schema.issueArticles.issueId,
                pageStart: schema.issueArticles.pageStart,
                pageEnd: schema.issueArticles.pageEnd,
                order: schema.issueArticles.order,
                articleType: schema.issueArticles.articleType,
              })
              .from(schema.issueArticles)
              .where(eq(schema.issueArticles.articleId, articleId))
              .limit(1);

            let issue = null;
            let volume = null;

            if (issueArticle[0]) {
              const issueRow = await tx
                .select({
                  id: schema.issues.id,
                  journalId: schema.issues.journalId,
                  volumeId: schema.issues.volumeId,
                  number: schema.issues.number,
                  year: schema.issues.year,
                  label: schema.issues.label,
                  status: schema.issues.status,
                  coverImageFileId: schema.issues.coverImageFileId,
                  description: schema.issues.description,
                  publishedAt: schema.issues.publishedAt,
                  publishedBy: schema.issues.publishedBy,
                  createdAt: schema.issues.createdAt,
                  updatedAt: schema.issues.updatedAt,
                })
                .from(schema.issues)
                .where(eq(schema.issues.id, issueArticle[0].issueId))
                .limit(1);

              if (issueRow[0]) {
                issue = mapIssueRow(issueRow[0]);

                if (issueRow[0].volumeId) {
                  const volumeRow = await tx
                    .select({
                      id: schema.volumes.id,
                      journalId: schema.volumes.journalId,
                      number: schema.volumes.number,
                      year: schema.volumes.year,
                      label: schema.volumes.label,
                      createdAt: schema.volumes.createdAt,
                      updatedAt: schema.volumes.updatedAt,
                    })
                    .from(schema.volumes)
                    .where(eq(schema.volumes.id, issueRow[0].volumeId))
                    .limit(1);

                  if (volumeRow[0]) {
                    volume = mapVolumeRow(volumeRow[0]);
                  }
                }
              }
            }

            return {
              article: mapArticleVersionRow(article[0]),
              issue,
              volume,
            };
          },

          async listIssuesForJournal(journalId) {
            const rows = await tx
              .select({
                id: schema.issues.id,
                journalId: schema.issues.journalId,
                volumeId: schema.issues.volumeId,
                number: schema.issues.number,
                year: schema.issues.year,
                label: schema.issues.label,
                status: schema.issues.status,
                coverImageFileId: schema.issues.coverImageFileId,
                description: schema.issues.description,
                publishedAt: schema.issues.publishedAt,
                publishedBy: schema.issues.publishedBy,
                createdAt: schema.issues.createdAt,
                updatedAt: schema.issues.updatedAt,
              })
              .from(schema.issues)
              .where(eq(schema.issues.journalId, journalId))
              .orderBy(desc(schema.issues.year), desc(schema.issues.number));

            return rows.map(mapIssueRow);
          },

          async listVolumesForJournal(journalId) {
            const rows = await tx
              .select({
                id: schema.volumes.id,
                journalId: schema.volumes.journalId,
                number: schema.volumes.number,
                year: schema.volumes.year,
                label: schema.volumes.label,
                createdAt: schema.volumes.createdAt,
                updatedAt: schema.volumes.updatedAt,
              })
              .from(schema.volumes)
              .where(eq(schema.volumes.journalId, journalId))
              .orderBy(desc(schema.volumes.number));

            return rows.map(mapVolumeRow);
          },

          async registerDoi(articleId, registration) {
            const xml = buildCrossrefXml(registration as DoiRegistration);
            await tx.insert(schema.doiRegistrations).values({
              articleId,
              doi: registration.doi,
              prefix: registration.prefix,
              suffix: registration.suffix,
              xml,
              registeredAt: new Date(),
            });
          },

          async insertAuditEvent(event) {
            await tx.insert(schema.auditEvents).values(event);
          },
        };

        return work(transaction);
      });
    },

    async findSubmissionForProduction(productionUserId, submissionId) {
      return database.transaction(async (tx) => {
        const rows = await tx
          .select({
            id: schema.submissions.id,
            organizationId: schema.organizations.id,
            journalId: schema.submissions.journalId,
            title: schema.submissions.title,
            abstract: schema.submissions.abstract,
            keywords: schema.submissions.keywords,
            status: schema.submissions.status,
            createdBy: schema.submissions.createdBy,
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
          .innerJoin(
            schema.organizationMemberships,
            and(
              eq(schema.organizationMemberships.organizationId, schema.organizations.id),
              eq(schema.organizationMemberships.userId, productionUserId),
              eq(schema.organizationMemberships.role, "organization_admin"),
            ),
          )
          .where(
            and(
              eq(schema.submissions.id, submissionId),
              eq(schema.submissions.status, "accepted"),
            ),
          )
          .limit(1);

        if (!rows[0]) return null;

        const authors = await tx
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
          .orderBy(asc(schema.submissionAuthors.authorOrder));

        return {
          ...rows[0],
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
        };
      });
    },

    async listAcceptedSubmissions(productionUserId, journalId) {
      return database.transaction(async (tx) => {
        const rows = await tx
          .select({
            id: schema.submissions.id,
            organizationId: schema.organizations.id,
            journalId: schema.submissions.journalId,
            title: schema.submissions.title,
            abstract: schema.submissions.abstract,
            keywords: schema.submissions.keywords,
            status: schema.submissions.status,
            createdBy: schema.submissions.createdBy,
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
          .innerJoin(
            schema.organizationMemberships,
            and(
              eq(schema.organizationMemberships.organizationId, schema.organizations.id),
              eq(schema.organizationMemberships.userId, productionUserId),
              eq(schema.organizationMemberships.role, "organization_admin"),
            ),
          )
          .where(
            and(
              eq(schema.journals.id, journalId),
              eq(schema.submissions.status, "accepted"),
            ),
          )
          .orderBy(desc(schema.submissions.acceptedAt));

        const submissionsWithAuthors = await Promise.all(
          rows.map(async (row) => {
            const authors = await tx
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
              .where(eq(schema.submissionAuthors.submissionId, row.id))
              .orderBy(asc(schema.submissionAuthors.authorOrder));

            return {
              ...row,
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
            };
          })
        );

        return submissionsWithAuthors;
      });
    },

    async findArticleVersion(articleId) {
      const rows = await database
        .select({
          id: schema.articleVersions.id,
          submissionId: schema.articleVersions.submissionId,
          version: schema.articleVersions.version,
          status: schema.articleVersions.status,
          title: schema.articleVersions.title,
          abstract: schema.articleVersions.abstract,
          keywords: schema.articleVersions.keywords,
          authors: schema.articleVersions.authors,
          doi: schema.articleVersions.doi,
          manuscriptFileId: schema.articleVersions.manuscriptFileId,
          xmlContent: schema.articleVersions.xmlContent,
          pdfFileId: schema.articleVersions.pdfFileId,
          htmlContent: schema.articleVersions.htmlContent,
          createdAt: schema.articleVersions.createdAt,
          updatedAt: schema.articleVersions.updatedAt,
          publishedAt: schema.articleVersions.publishedAt,
          publishedBy: schema.articleVersions.publishedBy,
        })
        .from(schema.articleVersions)
        .where(eq(schema.articleVersions.id, articleId))
        .limit(1);

      return rows[0] ? mapArticleVersionRow(rows[0]) : null;
    },

    async findArticleVersionBySubmission(submissionId) {
      const rows = await database
        .select({
          id: schema.articleVersions.id,
          submissionId: schema.articleVersions.submissionId,
          version: schema.articleVersions.version,
          status: schema.articleVersions.status,
          title: schema.articleVersions.title,
          abstract: schema.articleVersions.abstract,
          keywords: schema.articleVersions.keywords,
          authors: schema.articleVersions.authors,
          doi: schema.articleVersions.doi,
          manuscriptFileId: schema.articleVersions.manuscriptFileId,
          xmlContent: schema.articleVersions.xmlContent,
          pdfFileId: schema.articleVersions.pdfFileId,
          htmlContent: schema.articleVersions.htmlContent,
          createdAt: schema.articleVersions.createdAt,
          updatedAt: schema.articleVersions.updatedAt,
          publishedAt: schema.articleVersions.publishedAt,
          publishedBy: schema.articleVersions.publishedBy,
        })
        .from(schema.articleVersions)
        .where(eq(schema.articleVersions.submissionId, submissionId))
        .orderBy(desc(schema.articleVersions.version))
        .limit(1);

      return rows[0] ? mapArticleVersionRow(rows[0]) : null;
    },

    async findIssue(issueId) {
      const rows = await database
        .select({
          id: schema.issues.id,
          journalId: schema.issues.journalId,
          volumeId: schema.issues.volumeId,
          number: schema.issues.number,
          year: schema.issues.year,
          label: schema.issues.label,
          status: schema.issues.status,
          coverImageFileId: schema.issues.coverImageFileId,
          description: schema.issues.description,
          publishedAt: schema.issues.publishedAt,
          publishedBy: schema.issues.publishedBy,
          createdAt: schema.issues.createdAt,
          updatedAt: schema.issues.updatedAt,
        })
        .from(schema.issues)
        .where(eq(schema.issues.id, issueId))
        .limit(1);

      return rows[0] ? mapIssueRow(rows[0]) : null;
    },

    async findVolume(volumeId) {
      const rows = await database
        .select({
          id: schema.volumes.id,
          journalId: schema.volumes.journalId,
          number: schema.volumes.number,
          year: schema.volumes.year,
          label: schema.volumes.label,
          createdAt: schema.volumes.createdAt,
          updatedAt: schema.volumes.updatedAt,
        })
        .from(schema.volumes)
        .where(eq(schema.volumes.id, volumeId))
        .limit(1);

      return rows[0] ? mapVolumeRow(rows[0]) : null;
    },

    async listIssuesForJournal(journalId) {
      const rows = await database
        .select({
          id: schema.issues.id,
          journalId: schema.issues.journalId,
          volumeId: schema.issues.volumeId,
          number: schema.issues.number,
          year: schema.issues.year,
          label: schema.issues.label,
          status: schema.issues.status,
          coverImageFileId: schema.issues.coverImageFileId,
          description: schema.issues.description,
          publishedAt: schema.issues.publishedAt,
          publishedBy: schema.issues.publishedBy,
          createdAt: schema.issues.createdAt,
          updatedAt: schema.issues.updatedAt,
        })
        .from(schema.issues)
        .where(eq(schema.issues.journalId, journalId))
        .orderBy(desc(schema.issues.year), desc(schema.issues.number));

      return rows.map(mapIssueRow);
    },

    async listVolumesForJournal(journalId) {
      const rows = await database
        .select({
          id: schema.volumes.id,
          journalId: schema.volumes.journalId,
          number: schema.volumes.number,
          year: schema.volumes.year,
          label: schema.volumes.label,
          createdAt: schema.volumes.createdAt,
          updatedAt: schema.volumes.updatedAt,
        })
        .from(schema.volumes)
        .where(eq(schema.volumes.journalId, journalId))
        .orderBy(desc(schema.volumes.number));

      return rows.map(mapVolumeRow);
    },

    async getArticleWithIssue(articleId) {
      return database.transaction(async (tx) => {
        const article = await tx
          .select({
            id: schema.articleVersions.id,
            submissionId: schema.articleVersions.submissionId,
            version: schema.articleVersions.version,
            status: schema.articleVersions.status,
            title: schema.articleVersions.title,
            abstract: schema.articleVersions.abstract,
            keywords: schema.articleVersions.keywords,
            authors: schema.articleVersions.authors,
            doi: schema.articleVersions.doi,
            manuscriptFileId: schema.articleVersions.manuscriptFileId,
            xmlContent: schema.articleVersions.xmlContent,
            pdfFileId: schema.articleVersions.pdfFileId,
            htmlContent: schema.articleVersions.htmlContent,
            createdAt: schema.articleVersions.createdAt,
            updatedAt: schema.articleVersions.updatedAt,
            publishedAt: schema.articleVersions.publishedAt,
            publishedBy: schema.articleVersions.publishedBy,
          })
          .from(schema.articleVersions)
          .where(eq(schema.articleVersions.id, articleId))
          .limit(1);

        if (!article[0]) return null;

        const issueArticle = await tx
          .select({
            issueId: schema.issueArticles.issueId,
            pageStart: schema.issueArticles.pageStart,
            pageEnd: schema.issueArticles.pageEnd,
            order: schema.issueArticles.order,
            articleType: schema.issueArticles.articleType,
          })
          .from(schema.issueArticles)
          .where(eq(schema.issueArticles.articleId, articleId))
          .limit(1);

        let issue = null;
        let volume = null;

        if (issueArticle[0]) {
          const issueRow = await tx
            .select({
              id: schema.issues.id,
              journalId: schema.issues.journalId,
              volumeId: schema.issues.volumeId,
              number: schema.issues.number,
              year: schema.issues.year,
              label: schema.issues.label,
              status: schema.issues.status,
              coverImageFileId: schema.issues.coverImageFileId,
              description: schema.issues.description,
              publishedAt: schema.issues.publishedAt,
              publishedBy: schema.issues.publishedBy,
              createdAt: schema.issues.createdAt,
              updatedAt: schema.issues.updatedAt,
            })
            .from(schema.issues)
            .where(eq(schema.issues.id, issueArticle[0].issueId))
            .limit(1);

          if (issueRow[0]) {
            issue = mapIssueRow(issueRow[0]);

            if (issueRow[0].volumeId) {
              const volumeRow = await tx
                .select({
                  id: schema.volumes.id,
                  journalId: schema.volumes.journalId,
                  number: schema.volumes.number,
                  year: schema.volumes.year,
                  label: schema.volumes.label,
                  createdAt: schema.volumes.createdAt,
                  updatedAt: schema.volumes.updatedAt,
                })
                .from(schema.volumes)
                .where(eq(schema.volumes.id, issueRow[0].volumeId))
                .limit(1);

              if (volumeRow[0]) {
                volume = mapVolumeRow(volumeRow[0]);
              }
            }
          }
        }

        return {
          article: mapArticleVersionRow(article[0]),
          issue,
          volume,
        };
      });
    },
  };
}

type ArticleVersionRow = InferSelectModel<typeof schema.articleVersions>;

function mapArticleVersionRow(row: ArticleVersionRow): ArticleVersion {
  return {
    id: row.id,
    submissionId: row.submissionId,
    version: row.version,
    status: row.status,
    title: row.title,
    abstract: row.abstract,
    keywords: row.keywords,
    authors: row.authors ? JSON.parse(row.authors as string) : [],
    doi: row.doi,
    manuscriptFileId: row.manuscriptFileId,
    xmlContent: row.xmlContent,
    pdfFileId: row.pdfFileId,
    htmlContent: row.htmlContent,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    publishedBy: row.publishedBy,
  };
}

type VolumeRow = InferSelectModel<typeof schema.volumes>;

function mapVolumeRow(row: VolumeRow): Volume {
  return {
    id: row.id,
    journalId: row.journalId,
    number: row.number,
    year: row.year,
    label: row.label,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type IssueRow = InferSelectModel<typeof schema.issues>;

function mapIssueRow(row: IssueRow): Issue {
  return {
    id: row.id,
    journalId: row.journalId,
    volumeId: row.volumeId,
    number: row.number,
    year: row.year,
    label: row.label,
    status: row.status,
    coverImageFileId: row.coverImageFileId,
    description: row.description,
    publishedAt: row.publishedAt,
    publishedBy: row.publishedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}