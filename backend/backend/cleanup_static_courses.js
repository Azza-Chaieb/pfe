const { Client } = require("pg");

const DB_CONFIG = {
    host: "127.0.0.1",
    port: 5432,
    database: "sunspace",
    user: "postgres",
    password: "postgres",
};

const client = new Client(DB_CONFIG);

const STATIC_TITLES = [
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
    "Maîtriser Node.js et Express",
    "Design UI/UX avec Figma",
    "Introduction à la Cybersécurité",
    "Mobile App avec React Native",
    "Blockchain et Web3",
    "Hacking Éthique",
    "Web design avec Figma"
];

async function cleanup() {
    try {
        await client.connect();
        console.log("--- CLEANING UP STATIC COURSES (STRICT MODE) ---");

        // DEBUG: List all courses
        const allRes = await client.query("SELECT id, title FROM courses");
        console.log("Total courses in DB: " + allRes.rows.length);
        allRes.rows.forEach(r => console.log(`- "${r.title}" (ID: ${r.id})`));

        // 1. Get IDs of courses to delete using case-insensitive partial matching
        console.log("Searching for courses to delete...");
        const res = await client.query(
            "SELECT id, title FROM courses WHERE title ILIKE ANY($1)",
            [STATIC_TITLES.map(t => `%${t}%`)]
        );
        const coursesToDelete = res.rows;

        if (coursesToDelete.length === 0) {
            console.log("No static courses found in the database.");
            return;
        }

        const ids = coursesToDelete.map(c => c.id);
        console.log(`Found ${coursesToDelete.length} courses to delete:`, coursesToDelete.map(c => c.title).join(", "));

        // List of possible link tables to clean in Strapi 5
        const linkTables = [
            "enrollments_course_links",
            "courses_trainer_links",
            "courses_students_links",
            "courses_category_rel_links",
            "courses_documents_links"
        ];

        for (const table of linkTables) {
            try {
                // Check if table exists
                const tableCheck = await client.query(
                    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
                    [table]
                );
                
                if (tableCheck.rows[0].exists) {
                    const delRes = await client.query(`DELETE FROM ${table} WHERE course_id = ANY($1)`, [ids]);
                    console.log(`Deleted ${delRes.rowCount} rows from ${table}`);
                }
            } catch (e) {
                console.log(`Could not clean table ${table}: ${e.message}`);
            }
        }

        // Clean media relations (files_related_morphs)
        try {
            const mediaDelRes = await client.query(
                "DELETE FROM files_related_morphs WHERE related_type = 'api::course.course' AND related_id = ANY($1)",
                [ids]
            );
            console.log(`Deleted ${mediaDelRes.rowCount} media relations from files_related_morphs.`);
        } catch (e) {
            console.log(`Could not clean media relations: ${e.message}`);
        }

        // 4. Finally delete the courses
        const deleteRes = await client.query(
            "DELETE FROM courses WHERE id = ANY($1)",
            [ids]
        );
        console.log(`Successfully deleted ${deleteRes.rowCount} courses from the 'courses' table.`);

        console.log("--- Cleanup Complete ---");

    } catch (err) {
        console.error("Error during cleanup:", err.message);
    } finally {
        await client.end();
    }
}

cleanup();
