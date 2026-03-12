const { Client } = require("pg");

const client = new Client({
  user: "postgres",
  host: "127.0.0.1",
  database: "sunspace",
  password: "postgres",
  port: 5432,
});

async function inspectTable() {
  try {
    await client.connect();
    console.log("Connected to Postgres.");

    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'services'
    `);

    console.log("--- COLUMNS IN SERVICES TABLE ---");
    res.rows.forEach((row) => {
      console.log(`${row.column_name}: ${row.data_type}`);
    });

    const countRes = await client.query("SELECT COUNT(*) FROM services");
    console.log(`Total rows: ${countRes.rows[0].count}`);

    const sampleRes = await client.query("SELECT * FROM services LIMIT 1");
    console.log("Sample Row:", JSON.stringify(sampleRes.rows[0], null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

inspectTable();
