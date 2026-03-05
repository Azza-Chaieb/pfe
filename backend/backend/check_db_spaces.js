const { Client } = require("pg");

async function checkSpaces() {
  const client = new Client({
    user: "postgres",
    password: "postgres",
    host: "127.0.0.1",
    port: 5432,
    database: "sunspace",
  });

  try {
    await client.connect();
    const res = await client.query(
      "SELECT id, name, mesh_name, is_per_chair, capacity FROM spaces",
    );
    console.log("--- SPACES DATA ---");
    console.log(JSON.stringify(res.rows, null, 2));
    console.log("--- END SPACES DATA ---");
  } catch (err) {
    console.error("Database query failed:", err.message);
  } finally {
    await client.end();
  }
}

checkSpaces();
