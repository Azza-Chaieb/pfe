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
        console.log("--- BULK PERMISSION GRANT START ---");

        // 1. Get all roles we care about
        const rolesRes = await client.query("SELECT id, name FROM up_roles WHERE name IN ('Authenticated', 'Student', 'trainer', 'professional', 'Association')");
        const roleIds = rolesRes.rows.map(r => r.id);
        console.log(`Targeting Roles: ${rolesRes.rows.map(r => r.name).join(', ')}`);

        // 2. Identify all relevant permissions
        const permsRes = await client.query(`
      SELECT id, action FROM up_permissions 
      WHERE action LIKE 'api::booking%' 
         OR action LIKE 'api::course%' 
         OR action LIKE 'api::session%' 
         OR action LIKE 'api::space%' 
         OR action LIKE 'api::coworking-space%'
         OR action LIKE 'api::equipment%'
         OR action LIKE 'api::service%'
         OR action LIKE 'api::payment%'
    `);
        const perms = permsRes.rows;
        console.log(`Found ${perms.length} matching permission actions.`);

        // 3. Link them to all roles (ignoring duplicates)
        for (const roleId of roleIds) {
            console.log(`  Granting permissions to role ID ${roleId}...`);
            for (const perm of perms) {
                try {
                    await client.query(
                        "INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                        [perm.id, roleId]
                    );
                } catch (e) {
                    // Some might fail if they don't have unique constraint, but typically Strapi 5 has link tables
                }
            }
        }

        console.log("--- BULK PERMISSION GRANT COMPLETE ---");

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
