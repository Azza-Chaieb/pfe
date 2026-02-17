const { Client } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const client = new Client({
  host: process.env.DATABASE_HOST || "127.0.0.1",
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || "sunspace",
  user: process.env.DATABASE_USERNAME || "postgres",
  password: process.env.DATABASE_PASSWORD || "postgres",
});

async function run() {
  try {
    await client.connect();
    console.log("--- DATABASE DIAGNOSTIC (Spaces #4) ---");

    const res = await client.query(`
      SELECT s.id, s.name, s.mesh_name, s.published_at 
      FROM spaces s
      JOIN spaces_coworking_space_lnk lnk ON s.id = lnk.space_id
      WHERE lnk.coworking_space_id = 4
    `);

    if (res.rows.length === 0) {
      console.log("❌ No spaces found for center #4.");
    } else {
      res.rows.forEach((r) => {
        console.log(
          `ID: ${r.id} | Name: "${r.name}" | MeshName: "${r.mesh_name}" | Published: ${r.published_at ? "YES" : "NO"}`,
        );
      });
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
