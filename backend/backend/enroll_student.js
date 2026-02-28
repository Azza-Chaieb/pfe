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
        console.log("--- ENROLLING STUDENT IN ALL COURSES ---");

        const userId = 20; // Student azzachaieb02@gmail.com
        console.log(`Target User ID: ${userId}`);

        const courseRes = await client.query("SELECT id, title FROM courses");
        const courses = courseRes.rows;
        console.log(`Found ${courses.length} courses.`);

        for (let i = 0; i < courses.length; i++) {
            const course = courses[i];

            // Check if already enrolled
            const checkRes = await client.query(
                "SELECT * FROM courses_students_lnk WHERE course_id = $1 AND user_id = $2",
                [course.id, userId]
            );

            if (checkRes.rows.length === 0) {
                await client.query(
                    "INSERT INTO courses_students_lnk (course_id, user_id, user_ord) VALUES ($1, $2, $3)",
                    [course.id, userId, i + 1]
                );
                console.log(`- Enrolled in: "${course.title}" (ID: ${course.id})`);
            } else {
                console.log(`- Already enrolled in: "${course.title}"`);
            }
        }

        console.log("--- Enrollment Fix Complete ---");

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
