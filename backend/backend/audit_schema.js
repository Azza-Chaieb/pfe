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
        console.log("--- SCHEMA AUDIT ---");
        const tables = ['etudiant_profils', 'association_profils', 'formateur_profils', 'professionnels', 'bookings', 'courses'];

        for (const t of tables) {
            const res = await client.query(
                "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public'",
                [t]
            );
            console.log(`\nTable: ${t}`);
            console.table(res.rows);
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
