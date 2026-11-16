import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

// 4 Journals with Crossref prefixes
const journals = [
  {
    slug: "jcs",
    title: "Journal of Computer Science",
    shortTitle: "J. Comput. Sci.",
    issnPrint: "2621-1234",
    issnOnline: "2621-1242",
    doiPrefix: "10.50000",
    description: "A peer-reviewed journal publishing original research in all areas of computer science.",
    aimsScope: "JCS publishes high-quality research in algorithms, AI, systems, security, and more.",
    authorGuidelines: "Submit original manuscripts via the online system. Follow COPE guidelines.",
  },
  {
    slug: "ije",
    title: "International Journal of Engineering",
    shortTitle: "Int. J. Eng.",
    issnPrint: "2621-2345",
    issnOnline: "2621-2353",
    doiPrefix: "10.50001",
    description: "Multidisciplinary engineering research journal covering civil, mechanical, electrical, and chemical engineering.",
    aimsScope: "IJE welcomes theoretical and applied research across all engineering disciplines.",
    authorGuidelines: "Manuscripts must be original. Use SI units. Follow IEEE citation style.",
  },
  {
    slug: "mrr",
    title: "Medical Research Review",
    shortTitle: "Med. Res. Rev.",
    issnPrint: "2621-3456",
    issnOnline: "2621-3464",
    doiPrefix: "10.50002",
    description: "A medical journal publishing reviews, clinical studies, and translational research.",
    aimsScope: "MRR focuses on evidence-based medicine, clinical trials, and systematic reviews.",
    authorGuidelines: "Follow ICMJE recommendations. Register clinical trials. Disclose conflicts of interest.",
  },
  {
    slug: "ssq",
    title: "Social Science Quarterly",
    shortTitle: "Soc. Sci. Q.",
    issnPrint: "2621-4567",
    issnOnline: "2621-4575",
    doiPrefix: "10.50003",
    description: "Interdisciplinary social science journal covering sociology, economics, political science, and anthropology.",
    aimsScope: "SSQ publishes quantitative and qualitative research on social phenomena.",
    authorGuidelines: "APA citation style. Data availability statement required. Ethics approval for human subjects.",
  },
];

const organization = {
  name: "Academic Publishing Consortium",
  slug: "academic-publishing-consortium",
};

const demoActor = {
  id: "seed-actor-" + crypto.randomUUID(),
  name: "System Seed Actor",
  email: "seed@academic-publishing.example",
};

async function main() {
  const connectionString = process.env.DIRECT_DATABASE_URL;
  if (!connectionString) {
    throw new Error("DIRECT_DATABASE_URL is required.");
  }

  const sql = postgres(connectionString, { max: 1 });

  try {
    await sql.begin(async (tx) => {
      // Create/find organization
      let [org] = await tx`
        SELECT id FROM organization WHERE slug = ${organization.slug}
      `;

      if (!org) {
        [org] = await tx`
          INSERT INTO organization (name, slug, created_at)
          VALUES (${organization.name}, ${organization.slug}, now())
          RETURNING id
        `;
        console.log("Created organization:", org.id);
      } else {
        console.log("Organization exists:", org.id);
      }

      const orgId = org.id;

      // Create demo actor user
      await tx`
        INSERT INTO "user" (id, name, email)
        VALUES (${demoActor.id}, ${demoActor.name}, ${demoActor.email})
        ON CONFLICT (id) DO NOTHING
      `;

      // Seed journals
      for (const j of journals) {
        let [existing] = await tx`
          SELECT id FROM journal WHERE organization_id = ${orgId} AND slug = ${j.slug}
        `;

        if (!existing) {
          [existing] = await tx`
            INSERT INTO journal (
              organization_id, created_by, title, slug, 
              description, aims_scope, author_guidelines,
              published_at, created_at
            )
            VALUES (
              ${orgId}, ${demoActor.id}, ${j.title}, ${j.slug},
              ${j.description}, ${j.aimsScope}, ${j.authorGuidelines},
              now(), now()
            )
            RETURNING id
          `;
          console.log(`Created journal ${j.slug}:`, existing.id);

          // Create audit event
          await tx`
            INSERT INTO audit_event (organization_id, actor_user_id, actor_type, action, entity_type, entity_id, reason, occurred_at)
            VALUES (${orgId}, ${demoActor.id}, 'system', 'journal.created', 'journal', ${existing.id}, 'Initial journal seed', now())
          `;
          await tx`
            INSERT INTO audit_event (organization_id, actor_user_id, actor_type, action, entity_type, entity_id, reason, occurred_at)
            VALUES (${orgId}, ${demoActor.id}, 'system', 'journal.published', 'journal', ${existing.id}, 'Journal published on creation', now())
          `;
        } else {
          console.log(`Journal ${j.slug} exists:`, existing.id);
        }
      }

      console.log("\n✅ All journals seeded successfully!");
    });
  } catch (error) {
    console.error("Error:", error);
    throw error;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch(() => process.exit(1));