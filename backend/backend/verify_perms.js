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
        console.log("--- VERIFYING ASSOCIATION PERMS ---");

        const res = await client.query(`
      SELECT p.action 
      FROM up_permissions p 
      JOIN up_permissions_role_lnk l ON p.id = l.permission_id 
      WHERE l.role_id = 9 
      AND (p.action LIKE 'api::course%' OR p.action LIKE 'api::booking%')
    `);

        console.log("Perms for Association (ID 9):");
        res.rows.forEach(r => console.log(`- ${r.action}`));

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
