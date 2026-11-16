import {
  and,
  asc,
  desc,
  eq,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { AppError } from "@/modules/shared/app-error";
import * as schema from "@/server/db/schema";
import type {
  AuditEventInput,
  JournalSummary,
  OrganizationSummary,
  OrganizationWorkspace,
  PublishedJournalCatalogItem,
  PublishedJournal,
  PublishedJournalReference,
  TenancyRepository,
  TenancyTransaction,
} from "../application/ports";
import type {
  JournalInput,
  OrganizationInput,
  UpdateJournalProfileInput,
} from "../application/validation";

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export function createPostgresTenancyRepository<
  TQueryResult extends PgQueryResultHKT,
>(
  database: PgDatabase<TQueryResult, typeof schema>,
): TenancyRepository {
  return {
    async transaction<T>(
      work: (transaction: TenancyTransaction) => Promise<T>,
    ): Promise<T> {
      try {
        return await database.transaction(async (tx) => {
          const transaction: TenancyTransaction = {
            async isPlatformOperator(userId) {
              const rows = await tx
                .select({ userId: schema.platformOperators.userId })
                .from(schema.platformOperators)
                .where(eq(schema.platformOperators.userId, userId))
                .limit(1);
              return rows.length > 0;
            },
            async isOrganizationAdmin(userId, organizationId) {
              const rows = await tx
                .select({ userId: schema.organizationMemberships.userId })
                .from(schema.organizationMemberships)
                .where(
                  and(
                    eq(schema.organizationMemberships.userId, userId),
                    eq(
                      schema.organizationMemberships.organizationId,
                      organizationId,
                    ),
                    eq(schema.organizationMemberships.role, "organization_admin"),
                  ),
                )
                .limit(1);
              return rows.length > 0;
            },
            async insertOrganization(input: OrganizationInput) {
              const [organization] = await tx
                .insert(schema.organizations)
                .values({ name: input.name, slug: input.slug })
                .returning({
                  id: schema.organizations.id,
                  name: schema.organizations.name,
                  slug: schema.organizations.slug,
                });
              return organization;
            },
            async insertOrganizationMembership(
              organizationId,
              userId,
            ) {
              await tx.insert(schema.organizationMemberships).values({
                organizationId,
                userId,
                role: "organization_admin",
              });
            },
            async insertJournal(userId, input: JournalInput) {
              const [journal] = await tx
                .insert(schema.journals)
                .values({
                  organizationId: input.organizationId,
                  createdBy: userId,
                  title: input.title,
                  slug: input.slug,
                  description: input.description || null,
                })
                .returning({
                  id: schema.journals.id,
                  title: schema.journals.title,
                  slug: schema.journals.slug,
                  description: schema.journals.description,
                  aimsScope: schema.journals.aimsScope,
                  authorGuidelines: schema.journals.authorGuidelines,
                  publishedAt: schema.journals.publishedAt,
                });
              return journal;
            },
            async findJournal(organizationId, journalId) {
              const [journal] = await tx
                .select({
                  id: schema.journals.id,
                  title: schema.journals.title,
                  slug: schema.journals.slug,
                  description: schema.journals.description,
                  aimsScope: schema.journals.aimsScope,
                  authorGuidelines: schema.journals.authorGuidelines,
                  publishedAt: schema.journals.publishedAt,
                })
                .from(schema.journals)
                .where(
                  and(
                    eq(schema.journals.organizationId, organizationId),
                    eq(schema.journals.id, journalId),
                  ),
                )
                .limit(1);
              return journal ?? null;
            },
            async publishJournal(organizationId, journalId, publishedAt) {
              const [journal] = await tx
                .update(schema.journals)
                .set({ publishedAt })
                .where(
                  and(
                    eq(schema.journals.organizationId, organizationId),
                    eq(schema.journals.id, journalId),
                    isNull(schema.journals.publishedAt),
                  ),
                )
                .returning({
                  id: schema.journals.id,
                  title: schema.journals.title,
                  slug: schema.journals.slug,
                  description: schema.journals.description,
                  aimsScope: schema.journals.aimsScope,
                  authorGuidelines: schema.journals.authorGuidelines,
                  publishedAt: schema.journals.publishedAt,
                });
              return journal ?? null;
            },
            async updateJournalProfile(
              organizationId,
              journalId,
              input: Pick<
                UpdateJournalProfileInput,
                "description" | "aimsScope" | "authorGuidelines"
              >,
            ) {
              const [journal] = await tx
                .update(schema.journals)
                .set({
                  description: input.description,
                  aimsScope: input.aimsScope,
                  authorGuidelines: input.authorGuidelines,
                })
                .where(
                  and(
                    eq(schema.journals.organizationId, organizationId),
                    eq(schema.journals.id, journalId),
                  ),
                )
                .returning({
                  id: schema.journals.id,
                  title: schema.journals.title,
                  slug: schema.journals.slug,
                  description: schema.journals.description,
                  aimsScope: schema.journals.aimsScope,
                  authorGuidelines: schema.journals.authorGuidelines,
                  publishedAt: schema.journals.publishedAt,
                });
              return journal ?? null;
            },
            async insertAuditEvent(event: AuditEventInput) {
              await tx.insert(schema.auditEvents).values(event);
            },
          };

          return work(transaction);
        });
      } catch (error) {
        if (isUniqueConstraintViolation(error)) {
          throw new AppError(
            "CONFLICT",
            "This slug is already in use. Choose a different slug.",
          );
        }
        throw error;
      }
    },
    async isPlatformOperator(userId) {
      const rows = await database
        .select({ userId: schema.platformOperators.userId })
        .from(schema.platformOperators)
        .where(eq(schema.platformOperators.userId, userId))
        .limit(1);
      return rows.length > 0;
    },
    async listOrganizationsForUser(userId) {
      return database
        .select({
          id: schema.organizations.id,
          name: schema.organizations.name,
          slug: schema.organizations.slug,
        })
        .from(schema.organizations)
        .innerJoin(
          schema.organizationMemberships,
          and(
            eq(
              schema.organizationMemberships.organizationId,
              schema.organizations.id,
            ),
            eq(schema.organizationMemberships.userId, userId),
            eq(schema.organizationMemberships.role, "organization_admin"),
          ),
        )
        .orderBy(schema.organizations.name);
    },
    async getOrganizationWorkspace(userId, organizationId) {
      const rows = await database
        .select({
          organizationId: schema.organizations.id,
          organizationName: schema.organizations.name,
          organizationSlug: schema.organizations.slug,
          journalId: schema.journals.id,
          journalTitle: schema.journals.title,
          journalSlug: schema.journals.slug,
          journalDescription: schema.journals.description,
          journalAimsScope: schema.journals.aimsScope,
          journalAuthorGuidelines: schema.journals.authorGuidelines,
          journalPublishedAt: schema.journals.publishedAt,
        })
        .from(schema.organizations)
        .innerJoin(
          schema.organizationMemberships,
          and(
            eq(
              schema.organizationMemberships.organizationId,
              schema.organizations.id,
            ),
            eq(schema.organizationMemberships.userId, userId),
            eq(schema.organizationMemberships.role, "organization_admin"),
          ),
        )
        .leftJoin(
          schema.journals,
          eq(schema.journals.organizationId, schema.organizations.id),
        )
        .where(eq(schema.organizations.id, organizationId))
        .orderBy(schema.journals.createdAt);

      if (rows.length === 0) {
        return null;
      }

      const organization: OrganizationSummary = {
        id: rows[0].organizationId,
        name: rows[0].organizationName,
        slug: rows[0].organizationSlug,
      };
      const journals: JournalSummary[] = rows.flatMap((row) => {
        if (
          row.journalId === null ||
          row.journalTitle === null ||
          row.journalSlug === null
        ) {
          return [];
        }
        return [
          {
            id: row.journalId,
            title: row.journalTitle,
            slug: row.journalSlug,
            description: row.journalDescription,
            aimsScope: row.journalAimsScope,
            authorGuidelines: row.journalAuthorGuidelines,
            publishedAt: row.journalPublishedAt,
          },
        ];
      });

      return { organization, journals } satisfies OrganizationWorkspace;
    },
    async getPublishedJournal(organizationSlug, journalSlug) {
      const [result] = await database
        .select({
          organizationName: schema.organizations.name,
          organizationSlug: schema.organizations.slug,
          title: schema.journals.title,
          slug: schema.journals.slug,
          description: schema.journals.description,
          aimsScope: schema.journals.aimsScope,
          authorGuidelines: schema.journals.authorGuidelines,
          publishedAt: schema.journals.publishedAt,
        })
        .from(schema.journals)
        .innerJoin(
          schema.organizations,
          eq(schema.organizations.id, schema.journals.organizationId),
        )
        .where(
          and(
            eq(schema.organizations.slug, organizationSlug),
            eq(schema.journals.slug, journalSlug),
            isNotNull(schema.journals.publishedAt),
          ),
        )
        .limit(1);

      if (!result || !result.publishedAt) {
        return null;
      }

      return {
        ...result,
        publishedAt: result.publishedAt,
      } satisfies PublishedJournal;
    },
    async getPublishedJournalReference(
      organizationSlug,
      journalSlug,
    ): Promise<PublishedJournalReference | null> {
      const [result] = await database
        .select({
          organizationId: schema.organizations.id,
          journalId: schema.journals.id,
        })
        .from(schema.journals)
        .innerJoin(
          schema.organizations,
          eq(schema.organizations.id, schema.journals.organizationId),
        )
        .where(
          and(
            eq(schema.organizations.slug, organizationSlug),
            eq(schema.journals.slug, journalSlug),
            isNotNull(schema.journals.publishedAt),
          ),
        )
        .limit(1);

      return result ?? null;
    },
    async listPublishedJournals(
      offset,
      limit,
      searchTerm,
    ): Promise<PublishedJournalCatalogItem[]> {
      const searchCondition = searchTerm
        ? sql`(
            strpos(lower(${schema.journals.title}), lower(${searchTerm})) > 0
            OR strpos(lower(${schema.organizations.name}), lower(${searchTerm})) > 0
            OR strpos(
              lower(coalesce(${schema.journals.description}, '')),
              lower(${searchTerm})
            ) > 0
          )`
        : undefined;
      const results = await database
        .select({
          organizationName: schema.organizations.name,
          organizationSlug: schema.organizations.slug,
          title: schema.journals.title,
          slug: schema.journals.slug,
          description: schema.journals.description,
          publishedAt: schema.journals.publishedAt,
        })
        .from(schema.journals)
        .innerJoin(
          schema.organizations,
          eq(schema.organizations.id, schema.journals.organizationId),
        )
        .where(
          searchCondition
            ? and(isNotNull(schema.journals.publishedAt), searchCondition)
            : isNotNull(schema.journals.publishedAt),
        )
        .orderBy(
          desc(schema.journals.publishedAt),
          asc(schema.organizations.slug),
          asc(schema.journals.title),
          asc(schema.journals.slug),
        )
        .limit(limit)
        .offset(offset);

      return results.flatMap((result) =>
        result.publishedAt
          ? [
              {
                ...result,
                publishedAt: result.publishedAt,
              } satisfies PublishedJournalCatalogItem,
            ]
          : [],
      );
    },
  };
}
