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
        console.log("--- USER ROLE ANALYSIS ---");

        const res = await client.query(`
      SELECT u.id, u.username, u.email, u.user_type, r.name as role_name, r.type as role_type
      FROM up_users u
      JOIN up_users_role_lnk lnk ON u.id = lnk.user_id
      JOIN up_roles r ON lnk.role_id = r.id
      ORDER BY u.id ASC
    `);

        console.table(res.rows);

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
