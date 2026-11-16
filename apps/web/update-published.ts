import postgres from 'postgres';

async function update() {
  const sql = postgres(process.env.DIRECT_DATABASE_URL!, { max: 1 });
  try {
    const result = await sql`UPDATE journal SET published_at = now() WHERE published_at IS NULL RETURNING slug, published_at`;
    console.log('Updated journals:', result);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await sql.end();
  }
}

update();