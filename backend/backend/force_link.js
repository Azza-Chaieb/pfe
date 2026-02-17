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
    console.log("--- FORCE LINK bureau_602 ---");

    // We saw ID 9 is "test" in your logs. Let's link it to bureau_602.
    const res = await client.query(`
      UPDATE spaces 
      SET mesh_name = 'bureau_602', 
          published_at = NOW() 
      WHERE name = 'test' OR id = 9
    `);

    console.log(`Update status: ${res.rowCount} row(s) updated.`);

    const check = await client.query(
      "SELECT id, name, mesh_name FROM spaces WHERE mesh_name = 'bureau_602'",
    );
    check.rows.forEach((r) => {
      console.log(
        `CONFIRMED: Space "${r.name}" (ID ${r.id}) is now mesh_name: "${r.mesh_name}"`,
      );
    });

    console.log("--- Done. REFRESH React. ---");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
