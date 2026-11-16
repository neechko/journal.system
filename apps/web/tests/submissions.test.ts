import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { and, eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createJournal,
  provisionOrganization,
  publishJournal,
} from "../src/modules/tenancy/application/use-cases";
import { createPostgresTenancyRepository } from "../src/modules/tenancy/infrastructure/postgres-repository";
import {
  createDraftSubmission,
  getManuscriptForAuthor,
  getDraftSubmission,
  getSubmissionForAuthor,
  listManuscriptsForAuthor,
  listDraftSubmissions,
  listSubmissionsForAuthor,
  submitDraftSubmission,
  uploadDraftManuscript,
  updateDraftSubmission,
} from "../src/modules/submissions/application/use-cases";
import {
  createDraftSubmissionInputSchema,
  submitDraftSubmissionInputSchema,
  updateDraftSubmissionInputSchema,
} from "../src/modules/submissions/application/validation";
import { createPostgresSubmissionRepository } from "../src/modules/submissions/infrastructure/postgres-repository";
import {
  createPrivateSubmissionStorage,
  LocalPrivateSubmissionStorage,
} from "../src/modules/submissions/infrastructure/local-private-storage";
import * as schema from "../src/server/db/schema";
import { sql } from "drizzle-orm";

vi.mock("server-only", () => ({}));

const migrationsFolder = fileURLToPath(new URL("../drizzle/", import.meta.url));
let client: PGlite | null = null;

function getClient(): PGlite {
  if (!client) {
    throw new Error("Test database was not initialized.");
  }
  return client;
}

describe("author draft submissions", () => {
  beforeAll(async () => {
    client = new PGlite();
    const database = drizzle(client, { schema });
    await migrate(database, { migrationsFolder });
  });

  beforeEach(async () => {
    const database = drizzle(getClient(), { schema });
    await database.execute(
      sql`TRUNCATE TABLE submission, audit_event, journal, organization_membership, organization, platform_operator, account, session, verification_token, "user" CASCADE`,
    );
    await database.insert(schema.users).values([
      { id: "operator-1", email: "operator@example.invalid" },
      { id: "author-a", email: "author-a@example.invalid" },
      { id: "author-b", email: "author-b@example.invalid" },
    ]);
  });

  afterAll(async () => {
    if (client) {
      await client.close();
      client = null;
    }
  });

  it("creates an audited private draft for a published journal", async () => {
    const database = drizzle(getClient(), { schema });
    const tenancyRepository = createPostgresTenancyRepository(database);
    const submissionRepository = createPostgresSubmissionRepository(database);
    await database
      .insert(schema.platformOperators)
      .values({ userId: "operator-1" });

    const organization = await provisionOrganization(
      tenancyRepository,
      "operator-1",
      {
        name: "Institution A",
        slug: "institution-a",
        reason: "Approved local development tenant",
      },
    );
    await createAndPublishJournal(tenancyRepository, organization.id);

    const submissionId = await createDraftSubmission(
      submissionRepository,
      tenancyRepository,
      "author-a",
      createDraftSubmissionInputSchema.parse({
        organizationSlug: organization.slug,
        journalSlug: "journal-a",
        title: "A Study of Scholarly Publishing",
        abstract: "This abstract remains private to its author.",
        keywords: "scholarly publishing\nresearch integrity",
      }),
    );

    await expect(
      getDraftSubmission(submissionRepository, "author-a", submissionId),
    ).resolves.toMatchObject({
      id: submissionId,
      organizationId: organization.id,
      organizationSlug: organization.slug,
      journalSlug: "journal-a",
      title: "A Study of Scholarly Publishing",
      abstract: "This abstract remains private to its author.",
      keywords: ["scholarly publishing", "research integrity"],
    });
    await expect(
      database
        .select({
          action: schema.auditEvents.action,
          entityId: schema.auditEvents.entityId,
          actorUserId: schema.auditEvents.actorUserId,
        })
        .from(schema.auditEvents)
        .where(eq(schema.auditEvents.entityId, submissionId)),
    ).resolves.toEqual([
      {
        action: "submission.draft_created",
        entityId: submissionId,
        actorUserId: "author-a",
      },
    ]);
    await expect(
      database
        .update(schema.submissions)
        .set({
          keywords: Array.from({ length: 21 }, (_, index) => `keyword-${index}`),
        })
        .where(eq(schema.submissions.id, submissionId)),
    ).rejects.toThrow();
    await expect(
      database
        .update(schema.submissions)
        .set({ status: "submitted" })
        .where(eq(schema.submissions.id, submissionId)),
    ).rejects.toThrow();
  });

  it("rejects malformed or oversized draft metadata", () => {
    const validInput = {
      organizationSlug: "institution-a",
      journalSlug: "journal-a",
      title: "A Study of Scholarly Publishing",
      abstract: "",
    };

    expect(
      createDraftSubmissionInputSchema.safeParse({
        ...validInput,
        title: "  ",
      }).success,
    ).toBe(false);
    expect(
      createDraftSubmissionInputSchema.safeParse({
        ...validInput,
        abstract: "a".repeat(10_001),
      }).success,
    ).toBe(false);
    expect(
      createDraftSubmissionInputSchema.safeParse({
        ...validInput,
        organizationSlug: "Institution A",
      }).success,
    ).toBe(false);
    expect(
      createDraftSubmissionInputSchema.parse({
        ...validInput,
        keywords: "  scholarly publishing  \n\n research integrity ",
      }).keywords,
    ).toEqual(["scholarly publishing", "research integrity"]);
    expect(
      createDraftSubmissionInputSchema.parse(validInput).keywords,
    ).toEqual([]);
    expect(
      createDraftSubmissionInputSchema.safeParse({
        ...validInput,
        keywords: Array.from({ length: 21 }, (_, index) => `keyword-${index}`)
          .join("\n"),
      }).success,
    ).toBe(false);
    expect(
      createDraftSubmissionInputSchema.safeParse({
        ...validInput,
        keywords: "x".repeat(101),
      }).success,
    ).toBe(false);
    expect(
      updateDraftSubmissionInputSchema.parse({
        submissionId: randomUUID(),
        title: "A Study of Scholarly Publishing",
        abstract: "",
        keywords: "metadata",
      }).keywords,
    ).toEqual(["metadata"]);
    expect(
      submitDraftSubmissionInputSchema.safeParse({
        submissionId: randomUUID(),
        confirmation: "confirm",
      }).success,
    ).toBe(true);
    expect(
      submitDraftSubmissionInputSchema.safeParse({
        submissionId: randomUUID(),
        confirmation: "yes",
      }).success,
    ).toBe(false);
  });

  it("does not create a draft for an unpublished or unknown journal", async () => {
    const database = drizzle(getClient(), { schema });
    const tenancyRepository = createPostgresTenancyRepository(database);
    const submissionRepository = createPostgresSubmissionRepository(database);
    await database
      .insert(schema.platformOperators)
      .values({ userId: "operator-1" });

    const organization = await provisionOrganization(
      tenancyRepository,
      "operator-1",
      {
        name: "Institution A",
        slug: "institution-a",
        reason: "Approved local development tenant",
      },
    );
    await createJournal(tenancyRepository, "operator-1", {
      organizationId: organization.id,
      title: "Journal A",
      slug: "journal-a",
      description: "",
      reason: "Approved initial journal setup",
    });

    const input = createDraftSubmissionInputSchema.parse({
      organizationSlug: organization.slug,
      journalSlug: "journal-a",
      title: "A Study of Scholarly Publishing",
      abstract: "",
    });
    await expect(
      createDraftSubmission(
        submissionRepository,
        tenancyRepository,
        "author-a",
        input,
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      createDraftSubmission(
        submissionRepository,
        tenancyRepository,
        "author-a",
        { ...input, journalSlug: "unknown-journal" },
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      database.select({ id: schema.submissions.id }).from(schema.submissions),
    ).resolves.toEqual([]);
  });

  it("limits draft reads and edits to their author and audits updates", async () => {
    const database = drizzle(getClient(), { schema });
    const tenancyRepository = createPostgresTenancyRepository(database);
    const submissionRepository = createPostgresSubmissionRepository(database);
    await database
      .insert(schema.platformOperators)
      .values({ userId: "operator-1" });

    const organization = await provisionOrganization(
      tenancyRepository,
      "operator-1",
      {
        name: "Institution A",
        slug: "institution-a",
        reason: "Approved local development tenant",
      },
    );
    await createAndPublishJournal(tenancyRepository, organization.id);
    const submissionId = await createDraftSubmission(
      submissionRepository,
      tenancyRepository,
      "author-a",
      createDraftSubmissionInputSchema.parse({
        organizationSlug: organization.slug,
        journalSlug: "journal-a",
        title: "A Study of Scholarly Publishing",
        abstract: "",
      }),
    );

    await expect(
      getDraftSubmission(submissionRepository, "author-b", submissionId),
    ).resolves.toBeNull();
    await expect(
      listDraftSubmissions(submissionRepository, "author-b"),
    ).resolves.toEqual([]);
    await expect(
      updateDraftSubmission(submissionRepository, "author-b", {
        submissionId,
        title: "A Different Study",
        abstract: null,
        keywords: [],
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(
      updateDraftSubmission(submissionRepository, "author-a", {
        submissionId,
        title: "A Revised Study of Scholarly Publishing",
        abstract: null,
        keywords: ["scholarly publishing", "metadata"],
      }),
    ).resolves.toMatchObject({
      id: submissionId,
      title: "A Revised Study of Scholarly Publishing",
      keywords: ["scholarly publishing", "metadata"],
    });
    await expect(
      listDraftSubmissions(submissionRepository, "author-a"),
    ).resolves.toMatchObject([
      {
        id: submissionId,
        title: "A Revised Study of Scholarly Publishing",
        keywords: ["scholarly publishing", "metadata"],
      },
    ]);

    const auditEvents = await database
      .select({
        action: schema.auditEvents.action,
        actorUserId: schema.auditEvents.actorUserId,
      })
      .from(schema.auditEvents)
      .where(
        and(
          eq(schema.auditEvents.entityId, submissionId),
          eq(schema.auditEvents.organizationId, organization.id),
        ),
      );
    expect(auditEvents).toEqual([
      { action: "submission.draft_created", actorUserId: "author-a" },
      { action: "submission.draft_updated", actorUserId: "author-a" },
    ]);
  });

  it("stores versioned private PDFs and limits file reads to the author", async () => {
    const database = drizzle(getClient(), { schema });
    const tenancyRepository = createPostgresTenancyRepository(database);
    const submissionRepository = createPostgresSubmissionRepository(database);
    await database
      .insert(schema.platformOperators)
      .values({ userId: "operator-1" });

    const organization = await provisionOrganization(
      tenancyRepository,
      "operator-1",
      {
        name: "Institution A",
        slug: "institution-a",
        reason: "Approved local development tenant",
      },
    );
    await createAndPublishJournal(tenancyRepository, organization.id);
    const submissionId = await createDraftSubmission(
      submissionRepository,
      tenancyRepository,
      "author-a",
      createDraftSubmissionInputSchema.parse({
        organizationSlug: organization.slug,
        journalSlug: "journal-a",
        title: "A Study of Scholarly Publishing",
        abstract: "",
      }),
    );

    const storageRoot = await mkdtemp(join(tmpdir(), "journal-private-test-"));
    const storage = new LocalPrivateSubmissionStorage(storageRoot);
    try {
      const firstPdf = new TextEncoder().encode("%PDF-1.7\nsynthetic v1");
      const secondPdf = new TextEncoder().encode("%PDF-1.7\nsynthetic v2");
      const first = await uploadDraftManuscript(
        submissionRepository,
        storage,
        "author-a",
        submissionId,
        firstPdf,
      );
      const second = await uploadDraftManuscript(
        submissionRepository,
        storage,
        "author-a",
        submissionId,
        secondPdf,
      );
      await expect(
        uploadDraftManuscript(
          submissionRepository,
          storage,
          "author-b",
          submissionId,
          new TextEncoder().encode("%PDF-1.7\nunauthorized"),
        ),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      expect([first.version, second.version]).toEqual([1, 2]);
      expect(await listManuscriptsForAuthor(submissionRepository, "author-a", submissionId))
        .toMatchObject([
          { id: second.id, version: 2, contentType: "application/pdf" },
          { id: first.id, version: 1, contentType: "application/pdf" },
        ]);
      await expect(
        listManuscriptsForAuthor(submissionRepository, "author-b", submissionId),
      ).resolves.toEqual([]);
      await expect(
        getManuscriptForAuthor(
          submissionRepository,
          storage,
          "author-b",
          submissionId,
          first.id,
        ),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(
        getManuscriptForAuthor(
          submissionRepository,
          storage,
          "author-a",
          submissionId,
          first.id,
        ),
      ).resolves.toMatchObject({ file: { id: first.id }, content: firstPdf });

      const manuscriptEvents = await database
        .select({ action: schema.auditEvents.action })
        .from(schema.auditEvents)
        .where(eq(schema.auditEvents.entityId, submissionId));
      expect(
        manuscriptEvents.filter(
          ({ action }) => action === "submission.manuscript_uploaded",
        ),
      ).toHaveLength(2);
    } finally {
      await rm(storageRoot, { recursive: true, force: true });
    }
  });

  it("rejects invalid and oversized manuscripts before writing private files", async () => {
    const database = drizzle(getClient(), { schema });
    const tenancyRepository = createPostgresTenancyRepository(database);
    const submissionRepository = createPostgresSubmissionRepository(database);
    await database
      .insert(schema.platformOperators)
      .values({ userId: "operator-1" });

    const organization = await provisionOrganization(
      tenancyRepository,
      "operator-1",
      {
        name: "Institution A",
        slug: "institution-a",
        reason: "Approved local development tenant",
      },
    );
    await createAndPublishJournal(tenancyRepository, organization.id);
    const submissionId = await createDraftSubmission(
      submissionRepository,
      tenancyRepository,
      "author-a",
      createDraftSubmissionInputSchema.parse({
        organizationSlug: organization.slug,
        journalSlug: "journal-a",
        title: "A Study of Scholarly Publishing",
        abstract: "",
      }),
    );
    const storage = {
      store: async () => {
        throw new Error("Invalid files must not reach storage.");
      },
      read: async () => {
        throw new Error("No file should be read.");
      },
      remove: async () => undefined,
    };

    await expect(
      uploadDraftManuscript(
        submissionRepository,
        storage,
        "author-a",
        submissionId,
        new TextEncoder().encode("not a PDF"),
      ),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(
      uploadDraftManuscript(
        submissionRepository,
        storage,
        "author-a",
        submissionId,
        new Uint8Array(10 * 1024 * 1024 + 1),
      ),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(
      listManuscriptsForAuthor(submissionRepository, "author-a", submissionId),
    ).resolves.toEqual([]);
  });

  it("requires explicit opt-in and never enables local storage in production", () => {
    try {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("LOCAL_PRIVATE_STORAGE_ENABLED", "false");
      expect(() => createPrivateSubmissionStorage()).toThrow(
        "Local storage is development-only.",
      );

      vi.stubEnv("LOCAL_PRIVATE_STORAGE_ENABLED", "true");
      expect(() => createPrivateSubmissionStorage()).not.toThrow();

      vi.stubEnv("NODE_ENV", "production");
      expect(() => createPrivateSubmissionStorage()).toThrow(
        "Local storage is development-only.",
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("requires a verified manuscript before submission and leaves the draft unchanged", async () => {
    const database = drizzle(getClient(), { schema });
    const tenancyRepository = createPostgresTenancyRepository(database);
    const submissionRepository = createPostgresSubmissionRepository(database);
    await database
      .insert(schema.platformOperators)
      .values({ userId: "operator-1" });

    const organization = await provisionOrganization(
      tenancyRepository,
      "operator-1",
      {
        name: "Institution A",
        slug: "institution-a",
        reason: "Approved local development tenant",
      },
    );
    await createAndPublishJournal(tenancyRepository, organization.id);
    const submissionId = await createDraftSubmission(
      submissionRepository,
      tenancyRepository,
      "author-a",
      createDraftSubmissionInputSchema.parse({
        organizationSlug: organization.slug,
        journalSlug: "journal-a",
        title: "A Study of Scholarly Publishing",
        abstract: "",
      }),
    );

    const storageRoot = await mkdtemp(join(tmpdir(), "journal-private-test-"));
    try {
      await expect(
        submitDraftSubmission(
          submissionRepository,
          new LocalPrivateSubmissionStorage(storageRoot),
          "author-a",
          submissionId,
          randomUUID(),
        ),
      ).rejects.toMatchObject({ code: "INVALID_INPUT" });

      const [submission] = await database
        .select({
          status: schema.submissions.status,
          submittedAt: schema.submissions.submittedAt,
        })
        .from(schema.submissions)
        .where(eq(schema.submissions.id, submissionId));
      expect(submission).toEqual({ status: "draft", submittedAt: null });
      await expect(
        database
          .select({ action: schema.auditEvents.action })
          .from(schema.auditEvents)
          .where(eq(schema.auditEvents.entityId, submissionId)),
      ).resolves.toEqual([{ action: "submission.draft_created" }]);
    } finally {
      await rm(storageRoot, { recursive: true, force: true });
    }
  });

  it("submits a verified manuscript once and keeps submitted records read-only", async () => {
    const database = drizzle(getClient(), { schema });
    const tenancyRepository = createPostgresTenancyRepository(database);
    const submissionRepository = createPostgresSubmissionRepository(database);
    await database
      .insert(schema.platformOperators)
      .values({ userId: "operator-1" });

    const organization = await provisionOrganization(
      tenancyRepository,
      "operator-1",
      {
        name: "Institution A",
        slug: "institution-a",
        reason: "Approved local development tenant",
      },
    );
    await createAndPublishJournal(tenancyRepository, organization.id);
    const submissionId = await createDraftSubmission(
      submissionRepository,
      tenancyRepository,
      "author-a",
      createDraftSubmissionInputSchema.parse({
        organizationSlug: organization.slug,
        journalSlug: "journal-a",
        title: "A Study of Scholarly Publishing",
        abstract: "A synthetic abstract.",
        keywords: "research methods\nmetadata provenance",
      }),
    );

    const storageRoot = await mkdtemp(join(tmpdir(), "journal-private-test-"));
    const storage = new LocalPrivateSubmissionStorage(storageRoot);
    const correlationId = randomUUID();
    const firstPdf = new TextEncoder().encode("%PDF-1.7\nfirst synthetic version");
    const pdf = new TextEncoder().encode("%PDF-1.7\nsynthetic submission");
    try {
      await uploadDraftManuscript(
        submissionRepository,
        storage,
        "author-a",
        submissionId,
        firstPdf,
      );
      const manuscript = await uploadDraftManuscript(
        submissionRepository,
        storage,
        "author-a",
        submissionId,
        pdf,
      );
      const submitted = await submitDraftSubmission(
        submissionRepository,
        storage,
        "author-a",
        submissionId,
        correlationId,
      );

      expect(submitted).toMatchObject({
        id: submissionId,
        status: "submitted",
        submittedAt: expect.any(Date),
        submittedManuscriptVersion: 2,
        keywords: ["research methods", "metadata provenance"],
      });
      await expect(
        getSubmissionForAuthor(
          submissionRepository,
          "author-a",
          submissionId,
        ),
      ).resolves.toMatchObject({
        status: "submitted",
        keywords: ["research methods", "metadata provenance"],
      });
      await expect(
        getSubmissionForAuthor(
          submissionRepository,
          "author-b",
          submissionId,
        ),
      ).resolves.toBeNull();
      await expect(
        listSubmissionsForAuthor(submissionRepository, "author-a"),
      ).resolves.toMatchObject([
        {
          id: submissionId,
          status: "submitted",
          keywords: ["research methods", "metadata provenance"],
        },
      ]);
      await expect(
        listSubmissionsForAuthor(submissionRepository, "author-b"),
      ).resolves.toEqual([]);
      await expect(
        getDraftSubmission(submissionRepository, "author-a", submissionId),
      ).resolves.toBeNull();
      await expect(
        updateDraftSubmission(submissionRepository, "author-a", {
          submissionId,
          title: "Changed after submission",
          abstract: null,
          keywords: [],
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(
        uploadDraftManuscript(
          submissionRepository,
          storage,
          "author-a",
          submissionId,
          new TextEncoder().encode("%PDF-1.7\nlate version"),
        ),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(
        getManuscriptForAuthor(
          submissionRepository,
          storage,
          "author-a",
          submissionId,
          manuscript.id,
        ),
      ).resolves.toMatchObject({ content: pdf });
      await expect(
        getManuscriptForAuthor(
          submissionRepository,
          storage,
          "author-b",
          submissionId,
          manuscript.id,
        ),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(
        submitDraftSubmission(
          submissionRepository,
          storage,
          "author-a",
          submissionId,
          randomUUID(),
        ),
      ).resolves.toMatchObject({
        id: submissionId,
        status: "submitted",
        submittedManuscriptVersion: 2,
      });
      await expect(
        submissionRepository.transaction((transaction) =>
          transaction.submitDraftForAuthor(
            "author-a",
            submissionId,
            manuscript.id,
          ),
        ),
      ).resolves.toMatchObject({
        kind: "already_submitted",
        submission: {
          id: submissionId,
          status: "submitted",
          submittedManuscriptVersion: 2,
        },
      });

      const transitionEvents = await database
        .select({
          organizationId: schema.auditEvents.organizationId,
          actorUserId: schema.auditEvents.actorUserId,
          actorType: schema.auditEvents.actorType,
          action: schema.auditEvents.action,
          stateBefore: schema.auditEvents.stateBefore,
          stateAfter: schema.auditEvents.stateAfter,
          source: schema.auditEvents.source,
          correlationId: schema.auditEvents.correlationId,
        })
        .from(schema.auditEvents)
        .where(
          and(
            eq(schema.auditEvents.entityId, submissionId),
            eq(schema.auditEvents.action, "submission.submitted"),
          ),
        );
      expect(transitionEvents).toHaveLength(1);
      const [transitionEvent] = transitionEvents;
      expect(transitionEvent).toEqual({
        organizationId: organization.id,
        actorUserId: "author-a",
        actorType: "human",
        action: "submission.submitted",
        stateBefore: "draft",
        stateAfter: "submitted",
        source: "author_workspace",
        correlationId,
      });
    } finally {
      await rm(storageRoot, { recursive: true, force: true });
    }
  });
});

async function createAndPublishJournal(
  repository: ReturnType<typeof createPostgresTenancyRepository>,
  organizationId: string,
) {
  const journal = await createJournal(repository, "operator-1", {
    organizationId,
    title: "Journal A",
    slug: "journal-a",
    description: "A synthetic journal description.",
    reason: "Approved initial journal setup",
  });
  await publishJournal(repository, "operator-1", {
    organizationId,
    journalId: journal.id,
    reason: "Approved public journal page",
    confirm: "confirm",
  });
}
