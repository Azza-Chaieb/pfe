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
    // Strapi 5 document ids are usually 24 chars lowercase alphanumeric
    return crypto.randomBytes(12).toString('hex');
}

async function run() {
    try {
        await client.connect();
        console.log("--- FIXING STUDENT DOCUMENT IDS ---");

        // 1. Fix Student Profiles
        const res = await client.query("SELECT id FROM etudiant_profils WHERE document_id IS NULL OR locale IS NULL OR registration_date IS NULL");
        console.log(`Found ${res.rows.length} records in etudiant_profils to update.`);
        for (const row of res.rows) {
            const docId = generateDocumentId();
            const defaultDate = new Date().toISOString().split('T')[0];
            await client.query("UPDATE etudiant_profils SET document_id = COALESCE(document_id, $1), locale = COALESCE(locale, 'fr'), registration_date = COALESCE(registration_date, $2) WHERE id = $3", [docId, defaultDate, row.id]);
        }

        // 2. Fix Other Profiles
        const otherTables = [
            { name: 'association_profils', dateField: null },
            { name: 'formateur_profils', dateField: null },
            { name: 'professionnels', dateField: null }
        ];

        for (const table of otherTables) {
            const pRes = await client.query(`SELECT id FROM ${table.name} WHERE document_id IS NULL OR locale IS NULL`);
            console.log(`Fixing ${pRes.rows.length} records in ${table.name}...`);
            for (const row of pRes.rows) {
                const docId = generateDocumentId();
                await client.query(`UPDATE ${table.name} SET document_id = COALESCE(document_id, $1), locale = COALESCE(locale, 'fr') WHERE id = $2`, [docId, row.id]);
            }
        }

        console.log("--- DOCUMENT ID UPDATE COMPLETE ---");

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
