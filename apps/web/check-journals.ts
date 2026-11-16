import postgres from 'postgres';

async function check() {
  const sql = postgres(process.env.DIRECT_DATABASE_URL!, { max: 1 });
  try {
    const journals = await sql`SELECT slug, title, published_at FROM journal`;
    console.log('Journals:', journals);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await sql.end();
  }
}

check();