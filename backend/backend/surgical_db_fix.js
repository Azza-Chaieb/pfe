const { Client } = require("pg");

async function updateDb() {
  const client = new Client({
    user: "postgres",
    password: "postgres",
    host: "127.0.0.1",
    port: 5432,
    database: "sunspace",
  });

  try {
    await client.connect();
    console.log("Connected to DB");

    // Update mesh_name to wildcard for students/open space
    const res = await client.query(`
      UPDATE spaces 
      SET mesh_name = 'bureau_*', is_per_chair = true, capacity = 40 
      WHERE name ILIKE '%etudiant%' OR name ILIKE '%open%'
    `);

    console.log("Update Complete. Rows affected:", res.rowCount);

    const verify = await client.query(`
      SELECT id, name, mesh_name FROM spaces WHERE mesh_name = 'bureau_*'
    `);
    console.log("Verified Rows:", verify.rows);
  } catch (err) {
    console.error("Error updating DB:", err.message);
  } finally {
    await client.end();
  }
}

updateDb();
