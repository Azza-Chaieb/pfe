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
    console.log("--- Matching Specific Spaces for Coworking Space #4 ---");

    // 1. Get spaces belonging to Coworking Space ID 4
    const res = await client.query(`
      SELECT s.id, s.name 
      FROM spaces s
      JOIN spaces_coworking_space_lnk lnk ON s.id = lnk.space_id
      WHERE lnk.coworking_space_id = 4
      ORDER BY s.id ASC
    `);

    console.log(`Found ${res.rows.length} spaces for Coworking Space #4`);

    if (res.rows.length >= 2) {
      // Link the first two spaces to bureau_602 and bureau_635
      const mapping = [
        { id: res.rows[0].id, mesh: "bureau_602" },
        { id: res.rows[1].id, mesh: "bureau_635" },
      ];

      for (const item of mapping) {
        await client.query(
          "UPDATE spaces SET mesh_name = $1, published_at = NOW() WHERE id = $2",
          [item.mesh, item.id],
        );
        console.log(`✅ Linked ID ${item.id} to SVG ID: ${item.mesh}`);
      }
    } else {
      console.log(
        "⚠️ Not enough spaces found for Coworking Space #4 to perform matching.",
      );
    }

    console.log("--- Done. Please refresh your React page. ---");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
