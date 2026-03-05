const { Client } = require("pg");

async function dumpSpaces() {
  const client = new Client({
    user: "postgres",
    password: "postgres",
    host: "127.0.0.1",
    port: 5432,
    database: "sunspace",
  });

  try {
    await client.connect();
    // Fetch all spaces for coworking_space 7
    const res = await client.query(`
      SELECT s.id, s.name, s.mesh_name, s.is_per_chair, s.capacity
      FROM spaces s
      JOIN spaces_coworking_space_links l ON s.id = l.space_id
      WHERE l.coworking_space_id = 7
    `);

    console.log("--- SPACES FOR COWORKING 7 ---");
    console.log(JSON.stringify(res.rows, null, 2));
    console.log("--- END ---");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

dumpSpaces();
