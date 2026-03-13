import pkg from 'pg';
const { Client } = pkg;
const client = new Client({ host: '127.0.0.1', port: 5432, database: 'sunspace', user: 'postgres', password: 'postgres' });

async function run() {
  await client.connect();
  const res = await client.query('SELECT document_id, title FROM courses');
  console.log("All courses in DB:");
  console.table(res.rows);
  await client.end();
}
run().catch(console.error);
