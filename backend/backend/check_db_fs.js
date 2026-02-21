const { Client } = require("pg");
const fs = require("fs");

async function check() {
  const client = new Client({
    host: "127.0.0.1",
    port: 5432,
    database: "sunspace",
    user: "postgres",
    password: "postgres",
  });
  let output = "";
  try {
    await client.connect();
    const res = await client.query(
      "SELECT id, name, published_at FROM coworking_spaces",
    );
    output += "COWORKING SPACES:\n" + JSON.stringify(res.rows, null, 2) + "\n";

    const res2 = await client.query(
      "SELECT id, name, coworking_space_id FROM spaces",
    );
    output += "\nSPACES:\n" + JSON.stringify(res2.rows, null, 2) + "\n";
  } catch (e) {
    output += "Error: " + e.message + "\n";
  } finally {
    await client.end();
    fs.writeFileSync("db_results.txt", output);
  }
}
check();
