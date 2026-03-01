const { Client } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const client = new Client({
<<<<<<< HEAD
    host: process.env.DATABASE_HOST || "127.0.0.1",
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || "sunspace",
    user: process.env.DATABASE_USERNAME || "postgres",
    password: process.env.DATABASE_PASSWORD || "postgres",
});

async function run() {
    try {
        await client.connect();
        const res = await client.query("SELECT id, name FROM up_roles");
        console.table(res.rows);
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
=======
  host: process.env.DATABASE_HOST || "127.0.0.1",
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || "sunspace",
  user: process.env.DATABASE_USERNAME || "postgres",
  password: process.env.DATABASE_PASSWORD || "postgres",
});

async function run() {
  try {
    await client.connect();
    console.log("--- ROLES ---");
    const roles = await client.query("SELECT id, name, type FROM up_roles");
    console.table(roles.rows);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
>>>>>>> c718ba2006c30d4632d83873f8b4418c1379b975
}

run();
