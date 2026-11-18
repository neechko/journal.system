import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "../src/server/db/schema";
import { createPostgresTenancyRepository } from "../src/modules/tenancy/infrastructure/postgres-repository";
import { createPostgresEditorialRepository } from "../src/modules/editorial/infrastructure/postgres-repository";
import { createPostgresProductionRepository } from "../src/modules/production/infrastructure/postgres-repository";
import { createPostgresPublicationsRepository } from "../src/modules/publications/infrastructure/postgres-repository";
import { getPublishedArticle, listPublishedArticles } from "../src/modules/publications/application/use-cases";
import {
  getJournalAccess,
  getPublicJournal,
  grantJournalRole,
  listJournalStaff,
  publishJournal,
  revokeJournalRole,
} from "../src/modules/tenancy/application/use-cases";
import { grantJournalRoleInputSchema } from "../src/modules/tenancy/application/validation";
import {
  getSubmissionDetailForEditor,
  listEditorialJournalsForUser,
  listSubmissionsForEditor,
} from "../src/modules/editorial/application/use-cases";
import {
  listAcceptedSubmissionsUseCase,
  listProductionJournalsForUser,
} from "../src/modules/production/application/use-cases";

const migrationsFolder = fileURLToPath(new URL("../drizzle/", import.meta.url));
let client: PGlite | null = null;

function getClient(): PGlite {
  if (!client) {
    throw new Error("Test database was not initialized.");
  }
  return client;
}

function database() {
  return drizzle(getClient(), { schema });
}

type Fixtures = {
  organizationAId: string;
  organizationBId: string;
  journalAId: string;
  journalBId: string;
  journalOtherTenantId: string;
  submissionAId: string;
  submissionBId: string;
};

let fixtures: Fixtures;

beforeAll(async () => {
  client = new PGlite();
  await migrate(drizzle(client, { schema }), { migrationsFolder });
});

afterAll(async () => {
  if (client) {
    await client.close();
    client = null;
  }
});

beforeEach(async () => {
  const db = database();
  await db.execute(
    sql`TRUNCATE TABLE audit_event, editorial_decision, review_report, reviewer_assignment,
      submission_author, submission_manuscript, submission, article_version, issue_article,
      issue, volume, doi_registration, journal_membership, journal,
      organization_membership, organization, platform_operator, "user" CASCADE`,
  );

  await db.insert(schema.users).values([
    { id: "org-admin", email: "org-admin@example.invalid" },
    { id: "editor-in-chief", email: "eic@example.invalid" },
    { id: "journal-editor", email: "editor@example.invalid" },
    { id: "reviewer", email: "reviewer@example.invalid" },
    { id: "production-editor", email: "production@example.invalid" },
    { id: "outsider", email: "outsider@example.invalid" },
  ]);

  const [organizationA, organizationB] = await db
    .insert(schema.organizations)
    .values([
      { name: "Organization A", slug: "organization-a" },
      { name: "Organization B", slug: "organization-b" },
    ])
    .returning();

  await db.insert(schema.organizationMemberships).values([
    {
      organizationId: organizationA.id,
      userId: "org-admin",
      role: "organization_admin",
    },
  ]);

  const [journalA, journalB, journalOtherTenant] = await db
    .insert(schema.journals)
    .values([
      {
        organizationId: organizationA.id,
        createdBy: "org-admin",
        title: "Journal A",
        slug: "journal-a",
        publishedAt: new Date(),
      },
      {
        organizationId: organizationA.id,
        createdBy: "org-admin",
        title: "Journal B",
        slug: "journal-b",
        publishedAt: new Date(),
      },
      {
        organizationId: organizationB.id,
        createdBy: "outsider",
        title: "Journal Other Tenant",
        slug: "journal-other-tenant",
        publishedAt: new Date(),
      },
    ])
    .returning();

  await db.insert(schema.journalMemberships).values([
    { journalId: journalA.id, userId: "editor-in-chief", role: "editor_in_chief" },
    { journalId: journalA.id, userId: "journal-editor", role: "editor" },
    { journalId: journalA.id, userId: "reviewer", role: "reviewer" },
    {
      journalId: journalA.id,
      userId: "production-editor",
      role: "production_editor",
    },
  ]);

  const [submissionA, submissionB] = await db
    .insert(schema.submissions)
    .values([
      {
        journalId: journalA.id,
        createdBy: "outsider",
        title: "Submission in Journal A",
        status: "submitted",
        submittedAt: new Date(),
        submittedManuscriptVersion: 1,
      },
      {
        journalId: journalB.id,
        createdBy: "outsider",
        title: "Submission in Journal B",
        status: "submitted",
        submittedAt: new Date(),
        submittedManuscriptVersion: 1,
      },
    ])
    .returning();

  fixtures = {
    organizationAId: organizationA.id,
    organizationBId: organizationB.id,
    journalAId: journalA.id,
    journalBId: journalB.id,
    journalOtherTenantId: journalOtherTenant.id,
    submissionAId: submissionA.id,
    submissionBId: submissionB.id,
  };
});

describe("journal-scoped access", () => {
  it("grants and revokes a role with tenant scope and audit events", async () => {
    const tenancy = createPostgresTenancyRepository(database());
    const input = {
      organizationId: fixtures.organizationAId,
      journalId: fixtures.journalBId,
      email: "outsider@example.invalid",
      role: "editor" as const,
      reason: "Assign editor to this journal for test coverage",
    };
    const membershipId = await grantJournalRole(tenancy, "org-admin", input);

    expect(await listJournalStaff(tenancy, "org-admin", fixtures.organizationAId, fixtures.journalBId))
      .toMatchObject([{ id: membershipId, userId: "outsider", role: "editor" }]);
    expect(await listEditorialJournalsForUser(tenancy, "outsider"))
      .toMatchObject([{ journalId: fixtures.journalBId }]);
    expect(await listJournalStaff(tenancy, "outsider", fixtures.organizationAId, fixtures.journalBId))
      .toEqual([]);

    await revokeJournalRole(tenancy, "org-admin", {
      organizationId: fixtures.organizationAId,
      journalId: fixtures.journalBId,
      membershipId,
      reason: "Remove the temporary editor role after test coverage",
      confirm: "confirm",
    });
    expect(await listEditorialJournalsForUser(tenancy, "outsider")).toEqual([]);
    const audit = await database().select().from(schema.auditEvents);
    expect(audit.map((event) => event.action)).toEqual([
      "journal.role_granted",
      "journal.role_revoked",
    ]);
    expect(audit.every((event) => event.actorUserId === "org-admin" &&
      event.entityId === membershipId && event.organizationId === fixtures.organizationAId))
      .toBe(true);
  });

  it("denies cross-tenant and unauthorized role changes", async () => {
    const tenancy = createPostgresTenancyRepository(database());
    const input = {
      organizationId: fixtures.organizationAId,
      journalId: fixtures.journalBId,
      email: "outsider@example.invalid",
      role: "editor" as const,
      reason: "Assign editor after authorization review",
    };
    await expect(grantJournalRole(tenancy, "outsider", input))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(grantJournalRole(tenancy, "org-admin", {
      ...input,
      journalId: fixtures.journalOtherTenantId,
    })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(grantJournalRole(tenancy, "org-admin", {
      ...input,
      email: "unknown@example.invalid",
    })).rejects.toMatchObject({ code: "NOT_FOUND" });

    const membershipId = await grantJournalRole(tenancy, "org-admin", input);
    await expect(grantJournalRole(tenancy, "org-admin", input))
      .rejects.toMatchObject({ code: "CONFLICT" });
    await expect(revokeJournalRole(tenancy, "outsider", {
      organizationId: fixtures.organizationAId,
      journalId: fixtures.journalBId,
      membershipId,
      reason: "Attempt to remove another journal role",
      confirm: "confirm",
    })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(revokeJournalRole(tenancy, "org-admin", {
      organizationId: fixtures.organizationAId,
      journalId: fixtures.journalAId,
      membershipId,
      reason: "Attempt to remove role from wrong journal",
      confirm: "confirm",
    })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await listJournalStaff(tenancy, "org-admin", fixtures.organizationAId, fixtures.journalBId))
      .toHaveLength(1);
  });

  it("rejects organization admin as a journal role at the boundary", () => {
    expect(grantJournalRoleInputSchema.safeParse({
      organizationId: fixtures.organizationAId,
      journalId: fixtures.journalAId,
      email: "outsider@example.invalid",
      role: "organization_admin",
      reason: "Try to assign an out-of-scope role",
    }).success).toBe(false);
  });

  it("lists only role-eligible journal workspaces", async () => {
    const tenancy = createPostgresTenancyRepository(database());

    const adminJournals = await listEditorialJournalsForUser(tenancy, "org-admin");
    expect(adminJournals.map((journal) => journal.journalId)).toEqual([
      fixtures.journalAId,
      fixtures.journalBId,
    ]);

    const editorJournals = await listEditorialJournalsForUser(tenancy, "journal-editor");
    expect(editorJournals.map((journal) => journal.journalId)).toEqual([fixtures.journalAId]);
    expect(await listEditorialJournalsForUser(tenancy, "reviewer")).toEqual([]);
    expect(await listEditorialJournalsForUser(tenancy, "outsider")).toEqual([]);

    const productionJournals = await listProductionJournalsForUser(tenancy, "production-editor");
    expect(productionJournals.map((journal) => journal.journalId)).toEqual([fixtures.journalAId]);
    expect(await listProductionJournalsForUser(tenancy, "journal-editor")).toEqual([]);

    await database()
      .update(schema.journalMemberships)
      .set({ revokedAt: new Date() })
      .where(sql`${schema.journalMemberships.userId} = 'journal-editor'`);
    expect(await listEditorialJournalsForUser(tenancy, "journal-editor")).toEqual([]);
  });

  it("keeps author drafts out of editorial lists and details", async () => {
    const [draft] = await database()
      .insert(schema.submissions)
      .values({
        journalId: fixtures.journalAId,
        createdBy: "outsider",
        title: "Private author draft",
        status: "draft",
      })
      .returning();
    const tenancy = createPostgresTenancyRepository(database());
    const editorial = createPostgresEditorialRepository(database());

    const queue = await listSubmissionsForEditor(
      editorial,
      tenancy,
      "journal-editor",
      fixtures.journalAId,
    );
    expect(queue.map((submission) => submission.id)).toEqual([fixtures.submissionAId]);
    expect(await listSubmissionsForEditor(
      editorial,
      tenancy,
      "journal-editor",
      fixtures.journalAId,
      ["draft"],
    )).toEqual([]);
    expect(await getSubmissionDetailForEditor(
      editorial,
      tenancy,
      "journal-editor",
      draft.id,
    )).toBeNull();
  });

  it("resolves organization admins and journal roles to explicit scopes", async () => {
    const tenancy = createPostgresTenancyRepository(database());

    const adminAccess = await getJournalAccess(
      tenancy,
      "org-admin",
      fixtures.journalAId,
    );
    expect(adminAccess?.organizationId).toBe(fixtures.organizationAId);
    expect(adminAccess?.roles).toContain("organization_admin");

    const editorAccess = await getJournalAccess(
      tenancy,
      "journal-editor",
      fixtures.journalAId,
    );
    expect(editorAccess?.roles).toEqual(["editor"]);

    const outsiderAccess = await getJournalAccess(
      tenancy,
      "outsider",
      fixtures.journalAId,
    );
    expect(outsiderAccess).toBeNull();
  });

  it("lets a journal editor list only their own journal's submissions", async () => {
    const tenancy = createPostgresTenancyRepository(database());
    const editorial = createPostgresEditorialRepository(database());

    const ownJournal = await listSubmissionsForEditor(
      editorial,
      tenancy,
      "journal-editor",
      fixtures.journalAId,
    );
    expect(ownJournal.map((submission) => submission.id)).toEqual([
      fixtures.submissionAId,
    ]);

    await expect(
      listSubmissionsForEditor(
        editorial,
        tenancy,
        "journal-editor",
        fixtures.journalBId,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    await expect(
      listSubmissionsForEditor(
        editorial,
        tenancy,
        "journal-editor",
        fixtures.journalOtherTenantId,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("denies editorial reads to journal reviewers and outsiders", async () => {
    const tenancy = createPostgresTenancyRepository(database());
    const editorial = createPostgresEditorialRepository(database());

    await expect(
      listSubmissionsForEditor(
        editorial,
        tenancy,
        "reviewer",
        fixtures.journalAId,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    await expect(
      listSubmissionsForEditor(
        editorial,
        tenancy,
        "outsider",
        fixtures.journalAId,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps production access separate from plain editorial access", async () => {
    const tenancy = createPostgresTenancyRepository(database());
    const production = createPostgresProductionRepository(database());
    const db = database();

    await db.insert(schema.submissions).values({
      journalId: fixtures.journalAId,
      createdBy: "outsider",
      title: "Accepted submission",
      status: "accepted",
      submittedAt: new Date(),
      submittedManuscriptVersion: 1,
      acceptedAt: new Date(),
    });

    await expect(
      listAcceptedSubmissionsUseCase(
        production,
        tenancy,
        "production-editor",
        fixtures.journalAId,
      ),
    ).resolves.toHaveLength(1);

    await expect(
      listAcceptedSubmissionsUseCase(
        production,
        tenancy,
        "editor-in-chief",
        fixtures.journalAId,
      ),
    ).resolves.toHaveLength(1);

    // A plain journal editor does not implicitly gain production rights.
    await expect(
      listAcceptedSubmissionsUseCase(
        production,
        tenancy,
        "journal-editor",
        fixtures.journalAId,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("does not leak unpublished journals through the public reader", async () => {
    const tenancy = createPostgresTenancyRepository(database());
    const db = database();

    await db
      .update(schema.journals)
      .set({ publishedAt: null })
      .where(sql`${schema.journals.id} = ${fixtures.journalBId}`);

    await expect(
      getPublicJournal(tenancy, "organization-a", "journal-b"),
    ).resolves.toBeNull();

    await publishJournal(tenancy, "org-admin", {
      organizationId: fixtures.organizationAId,
      journalId: fixtures.journalBId,
      reason: "Approved public journal page for regression test",
      confirm: "confirm",
    });

    await expect(
      getPublicJournal(tenancy, "organization-b", "journal-b"),
    ).resolves.toBeNull();

    await expect(
      getPublicJournal(tenancy, "organization-a", "journal-b"),
    ).resolves.toMatchObject({ slug: "journal-b" });
  });

  it("does not expose an assigned DOI without verified registration", async () => {
    const [article] = await database()
      .insert(schema.articleVersions)
      .values({
        submissionId: fixtures.submissionAId,
        version: 1,
        status: "published",
        title: "Published article",
        authors: [],
        doi: "10.1234/unverified",
        publishedAt: new Date(),
      })
      .returning();
    const publications = createPostgresPublicationsRepository(database());
    const lookup = {
      organizationSlug: "organization-a",
      journalSlug: "journal-a",
    };

    const page = await getPublishedArticle(publications, {
      ...lookup,
      articleId: article.id,
    });
    expect(page?.doi).toBeNull();
    const index = await listPublishedArticles(publications, lookup);
    expect(index[0]?.doi).toBeNull();
  });
});
