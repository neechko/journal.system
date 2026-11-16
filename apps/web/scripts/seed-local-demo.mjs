import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const demoSeedOptIn = process.env.DEMO_SEED_LOCAL;
if (demoSeedOptIn !== "true") {
  throw new Error("Set DEMO_SEED_LOCAL=true to seed local demo data.");
}
if (process.env.NODE_ENV === "production") {
  throw new Error("Demo data cannot be seeded in production.");
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

let databaseUrl;
try {
  databaseUrl = new URL(connectionString);
} catch {
  throw new Error("DATABASE_URL must be a valid PostgreSQL URL.");
}

const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
if (
  !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
  !localHosts.has(databaseUrl.hostname) ||
  decodeURIComponent(databaseUrl.pathname) !== "/journal_system"
) {
  throw new Error(
    "Demo data is restricted to the local journal_system database.",
  );
}

const demoActor = {
  id: "local-demo-seed-actor",
  name: "Local demo seed actor",
  email: "local-demo-seed@example.invalid",
};
const demoOrganization = {
  name: "Local Demo Publisher",
  slug: "local-demo-publisher",
};
const demoJournal = {
  title: "Development Sample Journal",
  slug: "development-sample-journal",
  description:
    "Local demo data for previewing the interface. This is not a real journal or publisher.",
  aimsScope:
    "Example aims and scope text. Replace this with accurate journal information after the organization and its policies are ready.",
  authorGuidelines:
    "Example author guidelines for a local preview. This is not an active submission policy.",
};
const previousDemoOrganization = {
  name: "Organisasi Contoh Lokal (Data Dummy)",
  slug: "organisasi-contoh-lokal",
};
const previousDemoJournal = {
  title: "Jurnal Contoh untuk Pengembangan",
  slug: "jurnal-contoh-pengembangan",
  description:
    "Data contoh lokal untuk memeriksa tampilan. Ini bukan jurnal atau penerbit nyata.",
  aimsScope:
    "Contoh teks tujuan dan cakupan. Ganti dengan informasi jurnal yang benar setelah organisasi dan kebijakannya siap.",
  authorGuidelines:
    "Contoh panduan penulis untuk pratinjau lokal. Ini bukan kebijakan submission yang berlaku.",
};
const demoReason = "Local demo data for development preview.";

const database = postgres(connectionString, {
  max: 1,
  connect_timeout: 5,
});

try {
  await database.begin(async (transaction) => {
    await transaction`
      INSERT INTO "user" (id, name, email)
      VALUES (${demoActor.id}, ${demoActor.name}, ${demoActor.email})
      ON CONFLICT (id) DO NOTHING
    `;

    const [storedActor] = await transaction`
      SELECT id, name, email
      FROM "user"
      WHERE id = ${demoActor.id}
    `;
    if (
      !storedActor ||
      storedActor.name !== demoActor.name ||
      storedActor.email !== demoActor.email
    ) {
      throw new Error("The reserved local demo actor ID is already in use.");
    }

    const [legacyOrganization] = await transaction`
      SELECT id, name, slug
      FROM "organization"
      WHERE slug = ${previousDemoOrganization.slug}
    `;
    if (legacyOrganization) {
      if (
        legacyOrganization.name !== previousDemoOrganization.name &&
        legacyOrganization.name !== demoOrganization.name
      ) {
        throw new Error("The reserved local demo organization slug is in use.");
      }

      const [slugConflict] = await transaction`
        SELECT id
        FROM "organization"
        WHERE slug = ${demoOrganization.slug}
      `;
      if (slugConflict && slugConflict.id !== legacyOrganization.id) {
        throw new Error("The local demo organization URL slug is already in use.");
      }

      const [updatedOrganization] = await transaction`
        UPDATE "organization"
        SET name = ${demoOrganization.name},
            slug = ${demoOrganization.slug}
        WHERE id = ${legacyOrganization.id}
          AND slug = ${previousDemoOrganization.slug}
        RETURNING id
      `;
      if (!updatedOrganization) {
        throw new Error("The local demo organization changed unexpectedly.");
      }

      if (
        legacyOrganization.name !== demoOrganization.name ||
        legacyOrganization.slug !== demoOrganization.slug
      ) {
        await transaction`
          INSERT INTO "audit_event"
            (organization_id, actor_user_id, action, entity_type, entity_id, reason)
          VALUES
            (${updatedOrganization.id}, ${demoActor.id},
             'organization.profile_updated', 'organization',
             ${updatedOrganization.id}, ${demoReason})
        `;
      }
    }

    const [insertedOrganization] = await transaction`
      INSERT INTO "organization" (name, slug)
      VALUES (${demoOrganization.name}, ${demoOrganization.slug})
      ON CONFLICT (slug) DO NOTHING
      RETURNING id
    `;

    let organizationId = insertedOrganization?.id;
    if (!organizationId) {
      const [storedOrganization] = await transaction`
        SELECT id, name
        FROM "organization"
        WHERE slug = ${demoOrganization.slug}
      `;
      if (!storedOrganization || storedOrganization.name !== demoOrganization.name) {
        throw new Error("The reserved local demo organization slug is in use.");
      }
      organizationId = storedOrganization.id;
    } else {
      await transaction`
        INSERT INTO "audit_event"
          (organization_id, actor_user_id, action, entity_type, entity_id, reason)
        VALUES
          (${organizationId}, ${demoActor.id}, 'organization.created',
           'organization', ${organizationId}, ${demoReason})
      `;
    }

    const [legacyJournal] = await transaction`
      SELECT id, title, description, aims_scope, author_guidelines, published_at
      FROM "journal"
      WHERE organization_id = ${organizationId}
        AND slug = ${previousDemoJournal.slug}
    `;
    if (legacyJournal) {
      const hasCurrentDemoContent =
        legacyJournal.title === demoJournal.title &&
        legacyJournal.description === demoJournal.description &&
        legacyJournal.aims_scope === demoJournal.aimsScope &&
        legacyJournal.author_guidelines === demoJournal.authorGuidelines &&
        Boolean(legacyJournal.published_at);
      const hasPreviousDemoContent =
        legacyJournal.title === previousDemoJournal.title &&
        legacyJournal.description === previousDemoJournal.description &&
        legacyJournal.aims_scope === previousDemoJournal.aimsScope &&
        legacyJournal.author_guidelines === previousDemoJournal.authorGuidelines &&
        Boolean(legacyJournal.published_at);

      if (!hasCurrentDemoContent && !hasPreviousDemoContent) {
        throw new Error(
          "The reserved local demo journal slug is in use with different data.",
        );
      }

      const [slugConflict] = await transaction`
        SELECT id
        FROM "journal"
        WHERE organization_id = ${organizationId}
          AND slug = ${demoJournal.slug}
      `;
      if (slugConflict && slugConflict.id !== legacyJournal.id) {
        throw new Error("The local demo journal URL slug is already in use.");
      }

      const [updatedJournal] = await transaction`
        UPDATE "journal"
        SET title = ${demoJournal.title},
            slug = ${demoJournal.slug},
            description = ${demoJournal.description},
            aims_scope = ${demoJournal.aimsScope},
            author_guidelines = ${demoJournal.authorGuidelines}
        WHERE id = ${legacyJournal.id}
          AND organization_id = ${organizationId}
          AND slug = ${previousDemoJournal.slug}
          AND published_at IS NOT NULL
        RETURNING id
      `;
      if (!updatedJournal) {
        throw new Error("The local demo journal changed unexpectedly.");
      }

      if (
        legacyJournal.title !== demoJournal.title ||
        legacyJournal.slug !== demoJournal.slug ||
        legacyJournal.description !== demoJournal.description ||
        legacyJournal.aims_scope !== demoJournal.aimsScope ||
        legacyJournal.author_guidelines !== demoJournal.authorGuidelines
      ) {
        await transaction`
          INSERT INTO "audit_event"
            (organization_id, actor_user_id, action, entity_type, entity_id, reason)
          VALUES
            (${organizationId}, ${demoActor.id}, 'journal.profile_updated',
             'journal', ${updatedJournal.id}, ${demoReason})
        `;
      }
    }

    const [insertedJournal] = await transaction`
      INSERT INTO "journal"
        (organization_id, created_by, title, slug, description, aims_scope,
         author_guidelines, published_at)
      VALUES
        (${organizationId}, ${demoActor.id}, ${demoJournal.title},
         ${demoJournal.slug}, ${demoJournal.description}, ${demoJournal.aimsScope},
         ${demoJournal.authorGuidelines}, now())
      ON CONFLICT (organization_id, slug) DO NOTHING
      RETURNING id
    `;

    if (insertedJournal) {
      await transaction`
        INSERT INTO "audit_event"
          (organization_id, actor_user_id, action, entity_type, entity_id, reason)
        VALUES
          (${organizationId}, ${demoActor.id}, 'journal.created',
           'journal', ${insertedJournal.id}, ${demoReason}),
          (${organizationId}, ${demoActor.id}, 'journal.published',
           'journal', ${insertedJournal.id}, ${demoReason})
      `;
    } else {
      const [storedJournal] = await transaction`
        SELECT title, description, aims_scope, author_guidelines, published_at
        FROM "journal"
        WHERE organization_id = ${organizationId}
          AND slug = ${demoJournal.slug}
      `;
      if (
        !storedJournal ||
        storedJournal.title !== demoJournal.title ||
        storedJournal.description !== demoJournal.description ||
        storedJournal.aims_scope !== demoJournal.aimsScope ||
        storedJournal.author_guidelines !== demoJournal.authorGuidelines ||
        !storedJournal.published_at
      ) {
        throw new Error(
          "The reserved local demo journal slug is in use with different data.",
        );
      }
    }
  });

  console.log(
    "Local demo organization and published journal are ready. No login account or credentials were created.",
  );
} finally {
  await database.end({ timeout: 5 });
}
