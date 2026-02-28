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

const TYPE_TO_ROLE = {
    'trainer': 'trainer',
    'professional': 'professional',
    'association': 'Association'
};

async function run() {
    try {
        await client.connect();
        console.log("--- CORRECTING ROLE LINKS ---");

        // Get all roles
        const rolesRes = await client.query("SELECT id, name FROM up_roles");
        const roles = rolesRes.rows;
        console.log("Available roles:", roles.map(r => `${r.name}(${r.id})`).join(', '));

        const usersRes = await client.query("SELECT id, email, user_type FROM up_users WHERE user_type IN ('trainer', 'professional', 'association')");

        for (const user of usersRes.rows) {
            const targetRoleName = TYPE_TO_ROLE[user.user_type];
            const role = roles.find(r => r.name === targetRoleName);

            if (role) {
                console.log(`Updating ${user.email} to role ${role.name} (ID ${role.id})`);
                // Update the link
                await client.query(
                    "UPDATE up_users_role_lnk SET role_id = $1 WHERE user_id = $2",
                    [role.id, user.id]
                );
            }
        }

        console.log("--- ROLE LINKS CORRECTED ---");

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
