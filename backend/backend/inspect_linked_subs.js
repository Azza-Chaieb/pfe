
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

        console.log("--- LINKED SUBSCRIPTIONS ---");
        const res = await client.query(`
          SELECT 
            s.id as sub_id, 
            s.status, 
            s.created_at,
            u.username, 
            u.email,
            p.name as plan_name,
            p.id as plan_id
          FROM user_subscriptions s
          LEFT JOIN user_subscriptions_user_lnk ulnk ON s.id = ulnk.user_subscription_id
          LEFT JOIN up_users u ON ulnk.user_id = u.id
          LEFT JOIN user_subscriptions_plan_lnk plnk ON s.id = plnk.user_subscription_id
          LEFT JOIN plans p ON plnk.plan_id = p.id
          ORDER BY s.created_at DESC
        `);

        console.log(`Found ${res.rows.length} linked subscriptions:`);
        res.rows.forEach(row => {
            console.log(`[${row.sub_id}] Status: ${row.status} | User: ${row.email} | Plan: ${row.plan_name || "MISSING"} (ID: ${row.plan_id}) | Created: ${row.created_at}`);
        });

    } catch (err) {
        console.error("Error:", err.message);
        // If tables are named differently, try to find them
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("All tables:", tables.rows.map(r => r.table_name).join(", "));
    } finally {
        await client.end();
    }
}

run();
