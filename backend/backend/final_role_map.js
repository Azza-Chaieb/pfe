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

// Precise mapping based on existing roles in the DB
const ROLE_TO_TYPE = {
    'trainer': 'trainer',
    'professional': 'professional',
    'Association': 'association',
    'space_manager': 'professional',
    'Student': 'student',
    'Authenticated': 'student'
};

async function run() {
    try {
        await client.connect();
        console.log("--- FINAL ROLE MAPPING START ---");

        const res = await client.query(`
      SELECT u.id, u.email, r.name as role_name
      FROM up_users u
      JOIN up_users_role_lnk lnk ON u.id = lnk.user_id
      JOIN up_roles r ON lnk.role_id = r.id
    `);

        for (const user of res.rows) {
            const targetType = ROLE_TO_TYPE[user.role_name] || 'student';
            console.log(`User: ${user.email} | Role: ${user.role_name} -> Type: ${targetType}`);

            await client.query("UPDATE up_users SET user_type = $1 WHERE id = $2", [targetType, user.id]);
        }

        console.log("--- FINAL ROLE MAPPING COMPLETE ---");

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
