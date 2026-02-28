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
        console.log("--- GRANULAR PERMISSION AUDIT ---");

        const query = `
      SELECT r.name as role, p.action 
      FROM up_permissions p 
      JOIN up_permissions_role_lnk lnk ON p.id = lnk.permission_id 
      JOIN up_roles r ON lnk.role_id = r.id 
      WHERE (p.action LIKE 'api::%')
      ORDER BY r.name, p.action
    `;

        const res = await client.query(query);

        const audit = {};
        res.rows.forEach(row => {
            if (!audit[row.role]) audit[row.role] = {};
            const parts = row.action.split('.');
            const contentType = parts[1];
            const action = parts[2] || parts[parts.length - 1];
            if (!audit[row.role][contentType]) audit[row.role][contentType] = [];
            audit[row.role][contentType].push(action);
        });

        for (const [role, types] of Object.entries(audit)) {
            console.log(`\n[Role: ${role}]`);
            for (const [type, actions] of Object.entries(types)) {
                console.log(`  - ${type}: ${actions.join(", ")}`);
            }
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
