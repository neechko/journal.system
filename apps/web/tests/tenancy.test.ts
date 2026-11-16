import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { sql } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import * as schema from "../src/server/db/schema";
import { createPostgresTenancyRepository } from "../src/modules/tenancy/infrastructure/postgres-repository";
import {
  createJournal,
  getOrganizationWorkspace,
  getPublicJournal,
  listPublicJournals,
  provisionOrganization,
  publishJournal,
  updateJournalProfile,
} from "../src/modules/tenancy/application/use-cases";
import {
  journalInputSchema,
  organizationInputSchema,
  publicJournalPageSchema,
  updateJournalProfileInputSchema,
} from "../src/modules/tenancy/application/validation";

const migrationsFolder = fileURLToPath(new URL("../drizzle/", import.meta.url));
let client: PGlite | null = null;

function getClient(): PGlite {
  if (!client) {
    throw new Error("Test database was not initialized.");
  }
  return client;
}

describe("organization and journal tenant boundaries", () => {
  beforeAll(async () => {
    client = new PGlite();
    const database = drizzle(client, { schema });
    await migrate(database, { migrationsFolder });
  });

  beforeEach(async () => {
    const database = drizzle(getClient(), { schema });
    await database.execute(
      sql`TRUNCATE TABLE audit_event, journal, organization_membership, organization, platform_operator, account, session, verification_token, "user" CASCADE`,
    );
    await database.insert(schema.users).values([
      { id: "operator-1", email: "operator@example.invalid" },
      { id: "admin-a", email: "admin-a@example.invalid" },
      { id: "admin-b", email: "admin-b@example.invalid" },
    ]);
  });

  afterAll(async () => {
    if (client) {
      await client.close();
      client = null;
    }
  });

  it("denies organization provisioning without a platform operator role", async () => {
    const repository = createPostgresTenancyRepository(
      drizzle(getClient(), { schema }),
    );

    await expect(
      provisionOrganization(repository, "admin-a", {
        name: "Institution A",
        slug: "institution-a",
        reason: "Approved local development tenant",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps journal creation and workspace reads inside the authorized organization", async () => {
    const database = drizzle(getClient(), { schema });
    const repository = createPostgresTenancyRepository(database);
    await database
      .insert(schema.platformOperators)
      .values({ userId: "operator-1" });

    const organizationA = await provisionOrganization(repository, "operator-1", {
      name: "Institution A",
      slug: "institution-a",
      reason: "Approved local development tenant A",
    });
    const organizationB = await provisionOrganization(repository, "operator-1", {
      name: "Institution B",
      slug: "institution-b",
      reason: "Approved local development tenant B",
    });

    await database.insert(schema.organizationMemberships).values([
      {
        organizationId: organizationA.id,
        userId: "admin-a",
        role: "organization_admin",
      },
      {
        organizationId: organizationB.id,
        userId: "admin-b",
        role: "organization_admin",
      },
    ]);

    await expect(
      createJournal(repository, "admin-a", {
        organizationId: organizationB.id,
        title: "Journal B",
        slug: "journal-b",
        description: "",
        reason: "Approved initial journal setup",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(
      getOrganizationWorkspace(repository, "admin-a", organizationB.id),
    ).resolves.toBeNull();
  });

  it("keeps journals private until an authorized, audited publish action", async () => {
    const database = drizzle(getClient(), { schema });
    const repository = createPostgresTenancyRepository(database);
    await database
      .insert(schema.platformOperators)
      .values({ userId: "operator-1" });

    const organization = await provisionOrganization(repository, "operator-1", {
      name: "Institution A",
      slug: "institution-a",
      reason: "Approved local development tenant",
    });
    const journal = await createJournal(repository, "operator-1", {
      organizationId: organization.id,
      title: "Journal A",
      slug: "journal-a",
      description: "A synthetic journal description.",
      reason: "Approved initial journal setup",
    });

    await expect(
      getPublicJournal(repository, organization.slug, journal.slug),
    ).resolves.toBeNull();

    await expect(
      publishJournal(repository, "admin-b", {
        organizationId: organization.id,
        journalId: journal.id,
        reason: "Unauthorized attempt must not publish",
        confirm: "confirm",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await publishJournal(repository, "operator-1", {
      organizationId: organization.id,
      journalId: journal.id,
      reason: "Approved public journal page",
      confirm: "confirm",
    });

    await expect(
      getPublicJournal(repository, organization.slug, journal.slug),
    ).resolves.toMatchObject({
      organizationName: "Institution A",
      title: "Journal A",
      slug: "journal-a",
    });
    await expect(
      database
        .select({ action: schema.auditEvents.action })
        .from(schema.auditEvents),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "organization.created" }),
        expect.objectContaining({ action: "journal.created" }),
        expect.objectContaining({ action: "journal.published" }),
      ]),
    );
    await expect(
      publishJournal(repository, "operator-1", {
        organizationId: organization.id,
        journalId: journal.id,
        reason: "Repeated publication must not be accepted",
        confirm: "confirm",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("lists only published journals with stable bounded pagination", async () => {
    const database = drizzle(getClient(), { schema });
    const repository = createPostgresTenancyRepository(database);
    await database
      .insert(schema.platformOperators)
      .values({ userId: "operator-1" });

    const organization = await provisionOrganization(repository, "operator-1", {
      name: "Institution A",
      slug: "institution-a",
      reason: "Approved local development tenant",
    });

    await database.insert(schema.journals).values([
      ...Array.from({ length: 13 }, (_, index) => {
        const number = index + 1;
        return {
          organizationId: organization.id,
          createdBy: "operator-1",
          title: `Published Journal ${String(number).padStart(2, "0")}`,
          slug: `published-journal-${number}`,
          description: number === 13 ? "Marine publishing studies" : null,
          publishedAt: new Date(Date.UTC(2026, 0, number)),
        };
      }),
      {
        organizationId: organization.id,
        createdBy: "operator-1",
        title: "Draft Journal",
        slug: "draft-journal",
        publishedAt: null,
      },
    ]);

    const firstPage = await listPublicJournals(repository, 1);
    expect(firstPage.journals).toHaveLength(12);
    expect(firstPage.journals.map((journal) => journal.title)).toEqual(
      Array.from({ length: 12 }, (_, index) =>
        `Published Journal ${String(13 - index).padStart(2, "0")}`,
      ),
    );
    expect(firstPage.hasNextPage).toBe(true);

    const secondPage = await listPublicJournals(repository, 2);
    expect(secondPage.journals.map((journal) => journal.title)).toEqual([
      "Published Journal 01",
    ]);
    expect(secondPage.hasNextPage).toBe(false);
    expect(
      [...firstPage.journals, ...secondPage.journals].some(
        (journal) => journal.title === "Draft Journal",
      ),
    ).toBe(false);

    const searchByTitle = await listPublicJournals(
      repository,
      1,
      "published journal 13",
    );
    expect(searchByTitle.journals.map((journal) => journal.title)).toEqual([
      "Published Journal 13",
    ]);

    const searchByDescription = await listPublicJournals(
      repository,
      1,
      "marine",
    );
    expect(searchByDescription.journals.map((journal) => journal.title)).toEqual(
      ["Published Journal 13"],
    );

    const searchByOrganization = await listPublicJournals(
      repository,
      1,
      "institution a",
    );
    expect(searchByOrganization.journals).toHaveLength(12);
    expect(searchByOrganization.hasNextPage).toBe(true);
    expect(
      await listPublicJournals(repository, 2, "institution a"),
    ).toMatchObject({
      journals: [{ title: "Published Journal 01" }],
      hasNextPage: false,
    });

    expect(
      await listPublicJournals(repository, 1, "%%"),
    ).toMatchObject({ journals: [], hasNextPage: false });
  });

  it("audits profile updates and denies updates outside the actor's organization", async () => {
    const database = drizzle(getClient(), { schema });
    const repository = createPostgresTenancyRepository(database);
    await database
      .insert(schema.platformOperators)
      .values({ userId: "operator-1" });

    const organizationA = await provisionOrganization(repository, "operator-1", {
      name: "Institution A",
      slug: "institution-a",
      reason: "Approved local development tenant A",
    });
    const organizationB = await provisionOrganization(repository, "operator-1", {
      name: "Institution B",
      slug: "institution-b",
      reason: "Approved local development tenant B",
    });
    const journalA = await createJournal(repository, "operator-1", {
      organizationId: organizationA.id,
      title: "Journal A",
      slug: "journal-a",
      description: "",
      reason: "Approved journal setup A",
    });
    const journalB = await createJournal(repository, "operator-1", {
      organizationId: organizationB.id,
      title: "Journal B",
      slug: "journal-b",
      description: "",
      reason: "Approved journal setup B",
    });

    await publishJournal(repository, "operator-1", {
      organizationId: organizationA.id,
      journalId: journalA.id,
      reason: "Approved public journal page",
      confirm: "confirm",
    });
    await updateJournalProfile(repository, "operator-1", {
      organizationId: organizationA.id,
      journalId: journalA.id,
      description: "Research on scholarly communication and publishing.",
      aimsScope: "Research on scholarly publishing.",
      authorGuidelines: "Submit structured manuscript files.",
      reason: "Updated journal profile content",
      confirm: "confirm",
    });

    await expect(
      getPublicJournal(repository, organizationA.slug, journalA.slug),
    ).resolves.toMatchObject({
      description: "Research on scholarly communication and publishing.",
      aimsScope: "Research on scholarly publishing.",
      authorGuidelines: "Submit structured manuscript files.",
    });

    await expect(
      updateJournalProfile(repository, "admin-a", {
        organizationId: organizationB.id,
        journalId: journalB.id,
        description: "Unauthorized description.",
        aimsScope: "Unauthorized scope.",
        authorGuidelines: "Unauthorized guidelines.",
        reason: "Attempt cross-organization profile update",
        confirm: "confirm",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const profileAuditEvents = await database
      .select({
        action: schema.auditEvents.action,
        entityId: schema.auditEvents.entityId,
      })
      .from(schema.auditEvents);
    expect(
      profileAuditEvents.filter(
        (event) => event.action === "journal.profile_updated",
      ),
    ).toEqual([
      { action: "journal.profile_updated", entityId: journalA.id },
    ]);
  });

  it("validates normalized URL slugs at the application boundary", () => {
    expect(
      organizationInputSchema.safeParse({
        name: "Institution A",
        slug: "Institution A",
        reason: "Approved local development tenant",
      }).success,
    ).toBe(false);
    expect(
      journalInputSchema.safeParse({
        organizationId: "not-a-uuid",
        title: "Journal A",
        slug: "journal-a",
        description: "",
        reason: "Approved initial journal setup",
      }).success,
    ).toBe(false);
      expect(publicJournalPageSchema.safeParse("0").success).toBe(false);
      expect(publicJournalPageSchema.safeParse("1.5").success).toBe(false);
      expect(publicJournalPageSchema.safeParse("2")).toMatchObject({
        success: true,
        data: 2,
      });
      expect(
        updateJournalProfileInputSchema.safeParse({
          organizationId: "00000000-0000-4000-8000-000000000001",
          journalId: "00000000-0000-4000-8000-000000000002",
          description: "   ",
          aimsScope: "   ",
          authorGuidelines: "Guidelines",
          reason: "Profile update reason",
          confirm: "confirm",
        }),
      ).toMatchObject({
        success: true,
        data: { description: null, aimsScope: null },
      });
    expect(
      updateJournalProfileInputSchema.safeParse({
        organizationId: "00000000-0000-4000-8000-000000000001",
        journalId: "00000000-0000-4000-8000-000000000002",
        description: "x".repeat(2001),
        aimsScope: "",
        authorGuidelines: "",
        reason: "Profile update reason",
        confirm: "confirm",
      }).success,
    ).toBe(false);
  });

  it("rejects audit events that do not identify an actor", async () => {
    const database = drizzle(getClient(), { schema });

    await expect(
      database.insert(schema.auditEvents).values({
        organizationId: null,
        actorUserId: null,
        action: "test.unattributed",
        entityType: "test",
        entityId: "test-1",
        reason: "Synthetic event used to validate the audit invariant",
      }),
    ).rejects.toThrow();
  });
});
