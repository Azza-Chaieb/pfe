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
        console.log("--- STRAPI ROLE/PERMISSION CHECK ---");

        const roles = await client.query("SELECT id, name, type FROM up_roles");
        console.log(`\nFound ${roles.rows.length} roles:`);
        roles.rows.forEach(r => console.log(`- ID: ${r.id}, Name: ${r.name}, Type: ${r.type}`));

        const perms = await client.query("SELECT count(*) FROM up_permissions");
        console.log(`\nTotal permissions count: ${perms.rows[0].count}`);

        const bookingPerms = await client.query(`
      SELECT p.id, p.action, r.name as role_name 
      FROM up_permissions p
      JOIN up_permissions_role_links rl ON p.id = rl.permission_id
      JOIN up_roles r ON rl.role_id = r.id
      WHERE p.action LIKE '%booking%'
    `);
        console.log(`\nBooking-related permissions: ${bookingPerms.rows.length}`);
        bookingPerms.rows.forEach(p => console.log(`- Role: ${p.role_name}, Action: ${p.action}`));

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
