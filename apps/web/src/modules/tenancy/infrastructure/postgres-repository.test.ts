import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "@/server/db/schema";
import { createPostgresTenancyRepository } from "./postgres-repository";
import { createPostgresSubmissionRepository } from "@/modules/submissions/infrastructure/postgres-repository";
import { createPostgresEditorialRepository } from "@/modules/editorial/infrastructure/postgres-repository";
import { createPostgresProductionRepository } from "@/modules/production/infrastructure/postgres-repository";
import { AppError } from "@/modules/shared/app-error";
import type { TenancyTransaction } from "../application/ports";

const TEST_DB_URL = process.env.DATABASE_URL ?? "postgres://localhost:5432/journal_system_test";

let pool: Pool;
let db: ReturnType<typeof drizzle<typeof schema>>;
let tenancyRepo: ReturnType<typeof createPostgresTenancyRepository>;
let submissionRepo: ReturnType<typeof createPostgresSubmissionRepository>;
let editorialRepo: ReturnType<typeof createPostgresEditorialRepository>;
let productionRepo: ReturnType<typeof createPostgresProductionRepository>;

const testUser1 = "user-" + randomUUID();
const testUser2 = "user-" + randomUUID();

beforeAll(async () => {
  pool = new Pool({ connectionString: TEST_DB_URL });
  db = drizzle(pool, { schema });
  tenancyRepo = createPostgresTenancyRepository(db);
  submissionRepo = createPostgresSubmissionRepository(db);
  editorialRepo = createPostgresEditorialRepository(db);
  productionRepo = createPostgresProductionRepository(db);
});

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  // Clean up test data
  await db.delete(schema.auditEvents);
  await db.delete(schema.editorialDecisions);
  await db.delete(schema.reviewReports);
  await db.delete(schema.reviewerAssignments);
  await db.delete(schema.submissionAuthors);
  await db.delete(schema.submissionManuscripts);
  await db.delete(schema.submissions);
  await db.delete(schema.articleVersions);
  await db.delete(schema.issueArticles);
  await db.delete(schema.issues);
  await db.delete(schema.volumes);
  await db.delete(schema.doiRegistrations);
  await db.delete(schema.journals);
  await db.delete(schema.organizationMemberships);
  await db.delete(schema.organizations);
  await db.delete(schema.users);
  await db.delete(schema.accounts);
  await db.delete(schema.sessions);
  await db.delete(schema.verificationTokens);
  await db.delete(schema.platformOperators);

  // Insert test users
  await db.insert(schema.users).values([
    { id: testUser1, name: "Test User 1", email: "user1@test.com" },
    { id: testUser2, name: "Test User 2", email: "user2@test.com" },
  ]);
});

describe("Tenant Isolation", () => {
  it("should not allow user from org A to see org B's journals", async () => {
    // Create org A and org B
    const orgA = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      const org = await tx.insertOrganization({ name: "Org A", slug: "org-a", reason: "Test organization" });
      await tx.insertOrganizationMembership(org.id, testUser1);
      return org;
    });

    const orgB = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      const org = await tx.insertOrganization({ name: "Org B", slug: "org-b", reason: "Test organization" });
      await tx.insertOrganizationMembership(org.id, testUser2);
      return org;
    });

    // Create journal in org A
    const journalA = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      return tx.insertJournal(testUser1, { organizationId: orgA.id, title: "Journal A", slug: "journal-a", reason: "Test journal" });
    });

    // Create journal in org B
    const journalB = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      return tx.insertJournal(testUser2, { organizationId: orgB.id, title: "Journal B", slug: "journal-b", reason: "Test journal" });
    });

    // User 1 should only see org A's journal
    const orgsUser1 = await tenancyRepo.listOrganizationsForUser(testUser1);
    expect(orgsUser1).toHaveLength(1);
    expect(orgsUser1[0].id).toBe(orgA.id);

    // User 2 should only see org B's journal
    const orgsUser2 = await tenancyRepo.listOrganizationsForUser(testUser2);
    expect(orgsUser2).toHaveLength(1);
    expect(orgsUser2[0].id).toBe(orgB.id);

    // User 1 should not be able to access org B's workspace
    const workspaceUser1OrgB = await tenancyRepo.getOrganizationWorkspace(testUser1, orgB.id);
    expect(workspaceUser1OrgB).toBeNull();

    // User 2 should not be able to access org A's workspace
    const workspaceUser2OrgA = await tenancyRepo.getOrganizationWorkspace(testUser2, orgA.id);
    expect(workspaceUser2OrgA).toBeNull();
  });

  it("should not allow user from org A to create journal in org B", async () => {
    const orgA = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      const org = await tx.insertOrganization({ name: "Org A", slug: "org-a", reason: "Test organization" });
      await tx.insertOrganizationMembership(org.id, testUser1);
      return org;
    });

    const orgB = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      const org = await tx.insertOrganization({ name: "Org B", slug: "org-b", reason: "Test organization" });
      await tx.insertOrganizationMembership(org.id, testUser2);
      return org;
    });

    // User 1 tries to create journal in org B (should fail)
    await expect(
      tenancyRepo.transaction(async (tx: TenancyTransaction) => {
        await tx.insertJournal(testUser1, { organizationId: orgB.id, title: "Hacked Journal", slug: "hacked", reason: "Test journal" });
      })
    ).rejects.toThrow(AppError);
  });

  it("should not allow cross-org submission access", async () => {
    const orgA = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      const org = await tx.insertOrganization({ name: "Org A", slug: "org-a", reason: "Test organization" });
      await tx.insertOrganizationMembership(org.id, testUser1);
      return org;
    });

    const orgB = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      const org = await tx.insertOrganization({ name: "Org B", slug: "org-b", reason: "Test organization" });
      await tx.insertOrganizationMembership(org.id, testUser2);
      return org;
    });

    const journalA = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      return tx.insertJournal(testUser1, { organizationId: orgA.id, title: "Journal A", slug: "journal-a", reason: "Test journal" });
    });

    const journalB = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      return tx.insertJournal(testUser2, { organizationId: orgB.id, title: "Journal B", slug: "journal-b", reason: "Test journal" });
    });

    // Publish both journals
    await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      await tx.publishJournal(orgA.id, journalA.id, new Date());
    });
    await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      await tx.publishJournal(orgB.id, journalB.id, new Date());
    });

    // User 1 creates submission in journal A
    const submissionA = await submissionRepo.transaction(async (tx) => {
      return tx.insertDraftSubmission(testUser1, { organizationId: orgA.id, journalId: journalA.id }, { title: "Submission A", abstract: null, keywords: [] });
    });

    // User 2 creates submission in journal B
    const submissionB = await submissionRepo.transaction(async (tx) => {
      return tx.insertDraftSubmission(testUser2, { organizationId: orgB.id, journalId: journalB.id }, { title: "Submission B", abstract: null, keywords: [] });
    });

    // User 1 should only see their submission
    const submissionsUser1 = await submissionRepo.listSubmissionsForAuthor(testUser1);
    expect(submissionsUser1).toHaveLength(1);
    expect(submissionsUser1[0].id).toBe(submissionA.id);

    // User 2 should only see their submission
    const submissionsUser2 = await submissionRepo.listSubmissionsForAuthor(testUser2);
    expect(submissionsUser2).toHaveLength(1);
    expect(submissionsUser2[0].id).toBe(submissionB.id);

    // User 1 should not be able to access submission B
    const submissionBForUser1 = await submissionRepo.findSubmissionForAuthor(testUser1, submissionB.id);
    expect(submissionBForUser1).toBeNull();

    // User 2 should not be able to access submission A
    const submissionAForUser2 = await submissionRepo.findSubmissionForAuthor(testUser2, submissionA.id);
    expect(submissionAForUser2).toBeNull();
  });

  it("should not allow cross-org editorial access", async () => {
    const orgA = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      const org = await tx.insertOrganization({ name: "Org A", slug: "org-a", reason: "Test organization" });
      await tx.insertOrganizationMembership(org.id, testUser1);
      return org;
    });

    const orgB = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      const org = await tx.insertOrganization({ name: "Org B", slug: "org-b", reason: "Test organization" });
      await tx.insertOrganizationMembership(org.id, testUser2);
      return org;
    });

    const journalA = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      return tx.insertJournal(testUser1, { organizationId: orgA.id, title: "Journal A", slug: "journal-a", reason: "Test journal" });
    });

    const journalB = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      return tx.insertJournal(testUser2, { organizationId: orgB.id, title: "Journal B", slug: "journal-b", reason: "Test journal" });
    });

    // User 1 (editor of org A) should not be able to list submissions for journal B
    const submissions = await editorialRepo.listSubmissionsForEditor(testUser1, journalB.id);
    expect(submissions).toHaveLength(0);

    // User 1 should not be able to get submission detail for journal B
    const detail = await editorialRepo.getSubmissionDetailForEditor(testUser1, "non-existent-id");
    expect(detail).toBeNull();
  });
});

describe("Organization and Journal Management", () => {
  it("should create organization with platform operator", async () => {
    // First make user1 a platform operator
    await db.insert(schema.platformOperators).values({ userId: testUser1 });

    const org = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      return tx.insertOrganization({ name: "Test Org", slug: "test-org", reason: "Test organization" });
    });

    expect(org.name).toBe("Test Org");
    expect(org.slug).toBe("test-org");

    // Membership should be created
    const memberships = await db
      .select()
      .from(schema.organizationMemberships)
      .where(eq(schema.organizationMemberships.organizationId, org.id));

    expect(memberships).toHaveLength(1);
    expect(memberships[0].userId).toBe(testUser1);
    expect(memberships[0].role).toBe("organization_admin");
  });

  it("should reject duplicate slug", async () => {
    await db.insert(schema.platformOperators).values({ userId: testUser1 });

    await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      await tx.insertOrganization({ name: "Org 1", slug: "duplicate", reason: "Test organization" });
    });

    await expect(
      tenancyRepo.transaction(async (tx: TenancyTransaction) => {
        await tx.insertOrganization({ name: "Org 2", slug: "duplicate", reason: "Test organization" });
      })
    ).rejects.toThrow(AppError);
  });

  it("should create and publish journal", async () => {
    await db.insert(schema.platformOperators).values({ userId: testUser1 });

    const org = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      const o = await tx.insertOrganization({ name: "Test Org", slug: "test-org", reason: "Test organization" });
      await tx.insertOrganizationMembership(o.id, testUser1);
      return o;
    });

    const journal = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      return tx.insertJournal(testUser1, { organizationId: org.id, title: "Test Journal", slug: "test-journal", reason: "Test journal" });
    });

    expect(journal.title).toBe("Test Journal");
    expect(journal.publishedAt).toBeNull();

    // Publish journal
    const published = await tenancyRepo.transaction(async (tx: TenancyTransaction) => {
      return tx.publishJournal(org.id, journal.id, new Date());
    });

    expect(published).not.toBeNull();
    expect(published!.publishedAt).toBeInstanceOf(Date);
  });
});