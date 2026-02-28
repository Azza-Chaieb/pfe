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

const TYPE_MAP = {
    'admin': 'admin',
    'authenticated': 'student',
    'etudiant': 'student',
    'formateur': 'trainer',
    'association': 'association',
    'proffessionnel': 'professional',
    'superuser': 'admin'
};

const PROFILE_TABLES = {
    'student': { profileTable: 'etudiant_profils', linkTable: 'etudiant_profils_user_lnk', linkCol: 'etudiant_profil_id' },
    'trainer': { profileTable: 'formateur_profils', linkTable: 'formateur_profils_user_lnk', linkCol: 'formateur_profil_id' },
    'association': { profileTable: 'association_profils', linkTable: 'association_profils_user_lnk', linkCol: 'association_profil_id' },
    'professional': { profileTable: 'professionnels', linkTable: 'professionnels_user_lnk', linkCol: 'professionnel_id' }
};

async function run() {
    try {
        await client.connect();
        console.log("--- BULK USER SYNC START ---");

        const res = await client.query(`
      SELECT u.id, u.email, u.user_type, r.type as role_type
      FROM up_users u
      JOIN up_users_role_lnk lnk ON u.id = lnk.user_id
      JOIN up_roles r ON lnk.role_id = r.id
    `);

        for (const user of res.rows) {
            const targetType = TYPE_MAP[user.role_type] || 'student';

            console.log(`Processing ${user.email} (Current Type: ${user.user_type}, Role: ${user.role_type}) -> Target: ${targetType}`);

            // 1. Update user_type
            await client.query("UPDATE up_users SET user_type = $1 WHERE id = $2", [targetType, user.id]);

            // 2. Handle sub-profile if applicable
            const config = PROFILE_TABLES[targetType];
            if (config) {
                const linkCheck = await client.query(`SELECT 1 FROM ${config.linkTable} WHERE user_id = $1`, [user.id]);
                if (linkCheck.rows.length === 0) {
                    console.log(`  Linking missing ${targetType} profile...`);
                    const newProfile = await client.query(
                        `INSERT INTO ${config.profileTable} (created_at, updated_at, published_at) VALUES (NOW(), NOW(), NOW()) RETURNING id`
                    );
                    const profileId = newProfile.rows[0].id;
                    await client.query(
                        `INSERT INTO ${config.linkTable} (${config.linkCol}, user_id) VALUES ($1, $2)`,
                        [profileId, user.id]
                    );
                }
            }
        }

        console.log("--- BULK USER SYNC COMPLETE ---");

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
