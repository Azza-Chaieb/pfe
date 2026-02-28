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

const COURSE_NAMES = [
    "Introduction à React.js",
    "Node.js Avancé & Microservices",
    "Design UI/UX Moderne",
    "Développement Mobile Flutter",
    "Intelligence Artificielle & Python",
    "Cybersécurité : Les Fondamentaux",
    "Cloud Computing avec AWS",
    "Marketing Digital & SEO",
    "Data Science avec R",
    "Management de Projet Agile",
    "DevOps & Docker/Kubernetes",
    "Blockchain & Smart Contracts",
    "Hacking Éthique",
    "Web design avec Figma"
];

async function run() {
    try {
        await client.connect();
        console.log("--- FIXING COURSE NAMES AND METADATA ---");

        const res = await client.query("SELECT id, title, document_id FROM courses ORDER BY id ASC");
        const courses = res.rows;

        for (let i = 0; i < courses.length; i++) {
            const course = courses[i];
            const newTitle = COURSE_NAMES[i % COURSE_NAMES.length];
            const docId = course.document_id || generateDocumentId();

            await client.query(
                "UPDATE courses SET title = $1, document_id = $2, locale = 'fr', published_at = NOW(), updated_at = NOW() WHERE id = $3",
                [newTitle, docId, course.id]
            );
            console.log(`Updated Course ID ${course.id}: "${newTitle}"`);
        }

        console.log("--- Course Fix Complete ---");

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
