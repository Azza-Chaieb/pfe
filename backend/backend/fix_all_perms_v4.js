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

const ROLES_TO_FIX = [
    { id: 1, name: "Authenticated" },
    { id: 7, name: "trainer" },
    { id: 8, name: "professional" },
    { id: 9, name: "Association" },
    { id: 6, name: "Student" },
    { id: 10, name: "space_manager" },
    { id: 4, name: "SuperUser" },
    { id: 5, name: "Admin" } // ADDED ADMIN ROLE
];

const CONTENT_TYPES = [
    "booking",
    "payment",
    "equipment",
    "service",
    "course",
    "session",
    "space",
    "coworking-space",
    "review",
    "model",
    "subscription-plan",
    "user-subscription"
];

const ACTIONS = ["find", "findOne", "create", "update", "delete"];

async function run() {
    try {
        await client.connect();
        console.log("--- CLEANING AND FIXING PERMISSIONS (FINAL V4 - INCLUDING ADMIN) ---");

        for (const role of ROLES_TO_FIX) {
            console.log(`\nProcessing Role: ${role.name} (ID: ${role.id})`);

            // 1. Purge all api:: permissions for this role
            await client.query(`
        DELETE FROM up_permissions 
        WHERE id IN (
          SELECT p.id FROM up_permissions p
          JOIN up_permissions_role_lnk lnk ON p.id = lnk.permission_id
          WHERE lnk.role_id = $1 AND p.action LIKE 'api::%'
        )
      `, [role.id]);

            console.log(`  Purged existing API permissions.`);

            // 2. Inject clean permissions
            for (const type of CONTENT_TYPES) {
                for (const action of ACTIONS) {
                    const fullAction = `api::${type}.${type}.${action}`;

                    // Create permission
                    const res = await client.query(
                        "INSERT INTO up_permissions (action, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id",
                        [fullAction]
                    );
                    const permId = res.rows[0].id;

                    // Link to role
                    await client.query(
                        "INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES ($1, $2)",
                        [permId, role.id]
                    );
                }
            }

            // Add confirm payment specifically
            const extraActions = [
                "api::payment.payment.confirm",
                "api::coworking-space.coworking-space.upload3DModel"
            ];

            for (const action of extraActions) {
                const cpRes = await client.query(
                    "INSERT INTO up_permissions (action, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id",
                    [action]
                );
                await client.query(
                    "INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES ($1, $2)",
                    [cpRes.rows[0].id, role.id]
                );
            }

            console.log(`  Re-applied clean CRUD permissions for all types.`);
        }

        console.log("\n--- PERMISSION FIX COMPLETE ---");

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
