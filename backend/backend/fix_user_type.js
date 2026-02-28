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
        console.log("--- UPDATING USER DATA ---");

        // 1. Update user_type to student
        const updateRes = await client.query(
            "UPDATE up_users SET user_type = 'student' WHERE email = 'azachaieb@gmail.com' RETURNING id"
        );
        const userId = updateRes.rows[0].id;
        console.log(`Updated user ID ${userId} to user_type 'student'`);

        // 2. Check for student profile
        const profileRes = await client.query(
            "SELECT id FROM etudiant_profils WHERE id IN (SELECT etudiant_profil_id FROM etudiant_profils_user_lnk WHERE user_id = $1)",
            [userId]
        );

        if (profileRes.rows.length === 0) {
            console.log("No etudiant_profil found. Creating one...");
            // Create profile and link it (Strapi 5 style linking)
            const newProfile = await client.query(
                "INSERT INTO etudiant_profils (created_at, updated_at, published_at) VALUES (NOW(), NOW(), NOW()) RETURNING id"
            );
            const profileId = newProfile.rows[0].id;
            await client.query(
                "INSERT INTO etudiant_profils_user_lnk (etudiant_profil_id, user_id) VALUES ($1, $2)",
                [profileId, userId]
            );
            console.log(`Created and linked etudiant_profil ID ${profileId}`);
        } else {
            console.log(`Found existing etudiant_profil ID ${profileRes.rows[0].id}`);
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
