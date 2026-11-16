import postgres from 'postgres';

async function test() {
  const sql = postgres(process.env.DIRECT_DATABASE_URL!, { max: 1 });
  try {
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('Tables:', tables.map(r => r.table_name));
    
    const journals = await sql`SELECT * FROM journal`;
    console.log('Journals:', journals);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await sql.end();
  }
}

test();