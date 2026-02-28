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

const PROFILE_TABLES = [
    { type: 'association', linkTable: 'association_profils_user_lnk' },
    { type: 'professional', linkTable: 'professionnels_user_lnk' },
    { type: 'trainer', linkTable: 'formateur_profils_user_lnk' },
    { type: 'student', linkTable: 'etudiant_profils_user_lnk' }
];

async function run() {
    try {
        await client.connect();
        console.log("--- REFINED USER SYNC START ---");

        const usersRes = await client.query("SELECT id, email, username, user_type FROM up_users");

        for (const user of usersRes.rows) {
            if (user.username === 'admin') continue;

            let detectedType = null;

            // 1. Check all profile link tables to see if they already have a specific profile
            for (const pTable of PROFILE_TABLES) {
                const check = await client.query(`SELECT 1 FROM ${pTable.linkTable} WHERE user_id = $1`, [user.id]);
                if (check.rows.length > 0) {
                    detectedType = pTable.type;
                    break;
                }
            }

            if (detectedType) {
                console.log(`User ${user.email}: Detected profile type '${detectedType}'. Updating user_type.`);
                await client.query("UPDATE up_users SET user_type = $1 WHERE id = $2", [detectedType, user.id]);
            } else {
                // Fallback or leave as student if no profile found
                console.log(`User ${user.email}: No specific profile found. Current type: ${user.user_type}`);
            }
        }

        console.log("--- REFINED USER SYNC COMPLETE ---");

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
