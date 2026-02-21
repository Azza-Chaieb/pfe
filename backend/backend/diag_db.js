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

    const centers = await client.query(
      "SELECT id, name, published_at FROM coworking_spaces",
    );
    console.log("--- COWORKING SPACES ---");
    centers.rows.forEach((r) => {
      console.log(
        `ID: ${r.id} | Name: "${r.name}" | Published: ${r.published_at ? "YES" : "NO"}`,
      );
    });

    const spaces = await client.query(
      "SELECT id, name, coworking_space_id FROM spaces",
    );
    console.log("\n--- SPACES (Sub-units) ---");
    spaces.rows.forEach((r) => {
      console.log(
        `ID: ${r.id} | Name: "${r.name}" | Parent Coworking ID: ${r.coworking_space_id}`,
      );
    });
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
