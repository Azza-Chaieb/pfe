const { Client } = require("pg");
const dotenv = require("dotenv");
const crypto = require("crypto");
dotenv.config();

const client = new Client({
    host: process.env.DATABASE_HOST || "127.0.0.1",
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || "sunspace",
    user: process.env.DATABASE_USERNAME || "postgres",
    password: process.env.DATABASE_PASSWORD || "postgres",
});

function generateDocumentId() {
    return crypto.randomBytes(12).toString('hex');
}

async function run() {
    try {
        await client.connect();
        console.log("--- RESTORING COWORKING SPACES AND SPACES ---");

        // 1. Ensure Coworking Space ID 5 has a name and basic info
        const csId = 5;
        const csCheck = await client.query("SELECT id FROM coworking_spaces WHERE id = $1", [csId]);
        if (csCheck.rows.length === 0) {
            console.log(`Coworking Space ${csId} not found. Creating it...`);
            const docId = generateDocumentId();
            await client.query(
                "INSERT INTO coworking_spaces (id, name, type, description, document_id, published_at, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())",
                [csId, "SunSpace Pro", "Innovation Hub", "Espace de coworking premium.", docId]
            );
        } else {
            console.log(`Updating Coworking Space ${csId}...`);
            await client.query(
                "UPDATE coworking_spaces SET name = $1, type = $2, description = $3, published_at = NOW() WHERE id = $4",
                ["SunSpace Pro", "Innovation Hub", "Espace de coworking premium.", csId]
            );
        }

        // 2. Create sample spaces linked to ID 5
        // Typical bureau IDs found in SVG: bureau_1 to bureau_100+
        const spacesToCreate = [
            { name: "Bureau Zen 1", mesh: "bureau_1", type: "hot-desk", capacity: 1, floor: 0, price: 5 },
            { name: "Bureau Alpha 2", mesh: "bureau_2", type: "hot-desk", capacity: 1, floor: 0, price: 5 },
            { name: "Salle Atlas 3", mesh: "bureau_3", type: "meeting-room", capacity: 10, floor: 0, price: 50 },
            { name: "Open Space 4", mesh: "bureau_4", type: "fixed-desk", capacity: 1, floor: 0, price: 7 },
            { name: "Bureau Focal 5", mesh: "bureau_5", type: "hot-desk", capacity: 1, floor: 0, price: 5 },
            { name: "Bureau Focus 6", mesh: "bureau_6", type: "hot-desk", capacity: 1, floor: 0, price: 5 },
            { name: "Bureau King 7", mesh: "bureau_7", type: "fixed-desk", capacity: 1, floor: 0, price: 10 },
            { name: "Salle Vision 8", mesh: "bureau_8", type: "meeting-room", capacity: 6, floor: 0, price: 30 },
            { name: "Bureau Neo 9", mesh: "bureau_9", type: "hot-desk", capacity: 1, floor: 0, price: 5 },
            { name: "Bureau Prime 10", mesh: "bureau_10", type: "hot-desk", capacity: 1, floor: 0, price: 5 },
        ];

        for (const sp of spacesToCreate) {
            const docId = generateDocumentId();
            const res = await client.query(
                "INSERT INTO spaces (name, type, capacity, floor, pricing_hourly, mesh_name, document_id, published_at, created_at, updated_at, locale) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW(), 'fr') RETURNING id",
                [sp.name, sp.type, sp.capacity, sp.floor, sp.price, sp.mesh, docId]
            );
            const newSpaceId = res.rows[0].id;

            // Link to coworking space
            await client.query(
                "INSERT INTO spaces_coworking_space_lnk (space_id, coworking_space_id) VALUES ($1, $2)",
                [newSpaceId, csId]
            );
            console.log(`Created Space: ${sp.name} (Linked to ${sp.mesh})`);
        }

        console.log("--- Restoration Complete ---");

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
