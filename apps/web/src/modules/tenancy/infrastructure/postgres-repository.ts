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
  JournalAccess,
  JournalWorkspaceAccess,
  JournalStaffMember,
  JournalRole,
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
  GrantJournalRoleInput,
  OrganizationInput,
  UpdateJournalProfileInput,
} from "../application/validation";

function isUniqueConstraintViolation(error: unknown): boolean {
  let current = error;
  for (let depth = 0; depth < 3; depth += 1) {
    if (typeof current !== "object" || current === null) return false;
    if ("code" in current && current.code === "23505") return true;
    current = "cause" in current ? current.cause : null;
  }
  return false;
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
            async findUserByEmail(email) {
              const users = await tx
                .select({ id: schema.users.id })
                .from(schema.users)
                .where(sql`lower(${schema.users.email}) = ${email.toLowerCase()}`)
                .limit(2);
              if (users.length > 1) {
                throw new AppError("CONFLICT", "More than one account matches this email.");
              }
              return users[0] ?? null;
            },
            async insertJournalRole(actorUserId, targetUserId, input: GrantJournalRoleInput) {
              try {
                const [membership] = await tx
                  .insert(schema.journalMemberships)
                  .values({
                    journalId: input.journalId,
                    userId: targetUserId,
                    role: input.role,
                    grantedBy: actorUserId,
                  })
                  .returning({ id: schema.journalMemberships.id });
                return membership.id;
              } catch (error) {
                if (isUniqueConstraintViolation(error)) {
                  throw new AppError("CONFLICT", "This account already has that role.");
                }
                throw error;
              }
            },
            async revokeJournalRole(journalId, membershipId) {
              const [membership] = await tx
                .update(schema.journalMemberships)
                .set({ revokedAt: new Date() })
                .where(and(
                  eq(schema.journalMemberships.id, membershipId),
                  eq(schema.journalMemberships.journalId, journalId),
                  isNull(schema.journalMemberships.revokedAt),
                ))
                .returning({ id: schema.journalMemberships.id });
              return Boolean(membership);
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
    async getJournalAccess(userId, journalId): Promise<JournalAccess | null> {
      const [journal] = await database
        .select({ organizationId: schema.journals.organizationId })
        .from(schema.journals)
        .where(eq(schema.journals.id, journalId))
        .limit(1);

      if (!journal) {
        return null;
      }

      const roles = new Set<JournalRole>();

      const adminMemberships = await database
        .select({ organizationId: schema.organizationMemberships.organizationId })
        .from(schema.organizationMemberships)
        .where(
          and(
            eq(
              schema.organizationMemberships.organizationId,
              journal.organizationId,
            ),
            eq(schema.organizationMemberships.userId, userId),
            eq(schema.organizationMemberships.role, "organization_admin"),
          ),
        )
        .limit(1);

      if (adminMemberships.length > 0) {
        roles.add("organization_admin");
      }

      const journalRoles = await database
        .select({ role: schema.journalMemberships.role })
        .from(schema.journalMemberships)
        .where(
          and(
            eq(schema.journalMemberships.journalId, journalId),
            eq(schema.journalMemberships.userId, userId),
            isNull(schema.journalMemberships.revokedAt),
          ),
        );

      for (const membership of journalRoles) {
        roles.add(membership.role as JournalRole);
      }

      if (roles.size === 0) {
        return null;
      }

      return {
        organizationId: journal.organizationId,
        journalId,
        roles: [...roles],
      };
    },

    async listJournalWorkspacesForUser(userId): Promise<JournalWorkspaceAccess[]> {
      const journalRoles = await database
        .select({
          journalId: schema.journals.id,
          journalTitle: schema.journals.title,
          journalSlug: schema.journals.slug,
          organizationId: schema.organizations.id,
          organizationName: schema.organizations.name,
          organizationSlug: schema.organizations.slug,
          role: schema.journalMemberships.role,
        })
        .from(schema.journalMemberships)
        .innerJoin(schema.journals, eq(schema.journals.id, schema.journalMemberships.journalId))
        .innerJoin(schema.organizations, eq(schema.organizations.id, schema.journals.organizationId))
        .where(and(eq(schema.journalMemberships.userId, userId), isNull(schema.journalMemberships.revokedAt)));

      const adminRoles = await database
        .select({
          journalId: schema.journals.id,
          journalTitle: schema.journals.title,
          journalSlug: schema.journals.slug,
          organizationId: schema.organizations.id,
          organizationName: schema.organizations.name,
          organizationSlug: schema.organizations.slug,
        })
        .from(schema.organizationMemberships)
        .innerJoin(schema.organizations, eq(schema.organizations.id, schema.organizationMemberships.organizationId))
        .innerJoin(schema.journals, eq(schema.journals.organizationId, schema.organizations.id))
        .where(and(eq(schema.organizationMemberships.userId, userId), eq(schema.organizationMemberships.role, "organization_admin")));

      const workspaces = new Map<string, JournalWorkspaceAccess>();
      for (const row of journalRoles) {
        const { role: membershipRole, ...workspace } = row;
        const role = membershipRole as JournalRole;
        const existing = workspaces.get(row.journalId);
        if (existing) {
          if (!existing.roles.includes(role)) existing.roles.push(role);
        } else {
          workspaces.set(row.journalId, { ...workspace, roles: [role] });
        }
      }
      for (const row of adminRoles) {
        const existing = workspaces.get(row.journalId);
        if (existing) {
          if (!existing.roles.includes("organization_admin")) existing.roles.push("organization_admin");
        } else {
          workspaces.set(row.journalId, { ...row, roles: ["organization_admin"] });
        }
      }
      return [...workspaces.values()].sort((a, b) =>
        a.organizationName.localeCompare(b.organizationName) || a.journalTitle.localeCompare(b.journalTitle),
      );
    },

    async listJournalStaff(actorUserId, organizationId, journalId): Promise<JournalStaffMember[]> {
      const rows = await database
        .select({
          id: schema.journalMemberships.id,
          userId: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          role: schema.journalMemberships.role,
          createdAt: schema.journalMemberships.createdAt,
        })
        .from(schema.journalMemberships)
        .innerJoin(schema.journals, and(
          eq(schema.journals.id, schema.journalMemberships.journalId),
          eq(schema.journals.organizationId, organizationId),
        ))
        .innerJoin(schema.organizationMemberships, and(
          eq(schema.organizationMemberships.organizationId, schema.journals.organizationId),
          eq(schema.organizationMemberships.userId, actorUserId),
          eq(schema.organizationMemberships.role, "organization_admin"),
        ))
        .innerJoin(schema.users, eq(schema.users.id, schema.journalMemberships.userId))
        .where(and(
          eq(schema.journalMemberships.journalId, journalId),
          isNull(schema.journalMemberships.revokedAt),
        ))
        .orderBy(schema.users.email, schema.journalMemberships.role);
      return rows.map((row) => ({
        ...row,
        role: row.role as JournalStaffMember["role"],
      }));
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
