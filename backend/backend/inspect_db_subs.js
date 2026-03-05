
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

        console.log("--- TABLE LIST ---");
        const tablesRes = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND (table_name LIKE 'user_subscription%' OR table_name LIKE 'plans%' OR table_name LIKE 'subscription_plans%')
        `);
        console.log("Tables found:", tablesRes.rows.map(r => r.table_name).join(", "));

        console.log("\n--- USER SUBSCRIPTIONS ---");
        // Assuming table name is user_subscriptions or similar
        // Let's try to query the most likely one based on the first query
        const mainTable = tablesRes.rows.find(r => r.table_name === 'user_subscriptions') || tablesRes.rows[0];

        if (mainTable) {
            const subsRes = await client.query(`SELECT * FROM ${mainTable.table_name}`);
            console.log(`Found ${subsRes.rows.length} rows in ${mainTable.table_name}`);
            console.log(JSON.stringify(subsRes.rows, null, 2));
        } else {
            console.log("No subscription table found matching the patterns.");
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
