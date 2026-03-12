const { Client } = require("pg");

const client = new Client({
  user: "postgres",
  host: "127.0.0.1",
  database: "sunspace",
  password: "postgres",
  port: 5432,
});

async function checkDb() {
  try {
    await client.connect();
    const res = await client.query(
      "SELECT id, name, configuration FROM services",
    );
    console.log("--- SERVICES IN POSTGRES ---");
    res.rows.forEach((row) => {
      console.log(
        `ID: ${row.id}, Name: ${row.name}, Has Config: ${!!row.configuration}`,
      );
      if (row.configuration) {
        console.log("Config:", JSON.stringify(row.configuration, null, 2));
      }
    });
    console.log("---------------------------");
  } catch (err) {
    console.error("Error connecting to Postgres:", err.message);
  } finally {
    await client.end();
  }
}

checkDb();
