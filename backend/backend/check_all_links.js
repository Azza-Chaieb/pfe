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
        console.log("--- SUB-PROFILE LINK CHECK ---");

        const usersRes = await client.query("SELECT id, username, email FROM up_users");
        const users = usersRes.rows;

        const tables = [
            { name: "etudiant_profils_user_lnk", type: "student" },
            { name: "formateur_profils_user_lnk", type: "trainer" },
            { name: "association_profils_user_lnk", type: "association" },
            { name: "professionnels_user_lnk", type: "professional" }
        ];

        for (const user of users) {
            let foundType = null;
            for (const table of tables) {
                const linkRes = await client.query(`SELECT 1 FROM ${table.name} WHERE user_id = $1`, [user.id]);
                if (linkRes.rows.length > 0) {
                    foundType = table.type;
                    break;
                }
            }
            console.log(`User: ${user.email} | Linked Profile: ${foundType || 'NONE'}`);
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
