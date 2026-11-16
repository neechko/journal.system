import postgres from 'postgres';

async function test() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    const result = await sql`select "organization"."name", "organization"."slug", "journal"."title", "journal"."slug", "journal"."description", "journal"."published_at" from "journal" inner join "organization" on "organization"."id" = "journal"."organization_id" where "journal"."published_at" is not null order by "journal"."published_at" desc, "organization"."slug" asc, "journal"."title" asc, "journal"."slug" asc limit 13`;
    console.log('Result:', result);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await sql.end();
  }
}

test();