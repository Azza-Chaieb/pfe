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
        console.log("--- BOOKING PERMISSIONS ---");

        const res = await client.query(`
      SELECT id, action 
      FROM up_permissions 
      WHERE action LIKE '%booking%'
      ORDER BY action
    `);

        res.rows.forEach(r => console.log(`ID: ${r.id}, Action: ${r.action}`));

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
