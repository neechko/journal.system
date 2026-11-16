import postgres from 'postgres';

async function verify() {
  const sql = postgres(process.env.DIRECT_DATABASE_URL!, { max: 1 });
  try {
    const journals = await sql`SELECT id, slug, title FROM journal`;
    console.log('Journals:', journals);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await sql.end();
  }
}

verify();