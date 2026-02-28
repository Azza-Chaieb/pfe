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
        console.log("--- PERMISSION LINKS CHECK ---");

        const res = await client.query(`
      SELECT r.name as role_name, COUNT(p.id) as perm_count
      FROM up_roles r
      LEFT JOIN up_permissions_role_lnk l ON r.id = l.role_id
      LEFT JOIN up_permissions p ON l.permission_id = p.id
      GROUP BY r.name
    `);

        res.rows.forEach(r => console.log(`Role: ${r.role_name} | Permissions: ${r.perm_count}`));

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
