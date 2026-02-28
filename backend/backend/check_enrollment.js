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
        console.log("--- STUDENT ENROLLMENT CHECK ---");

        const query = "SELECT c.id, c.title FROM courses c JOIN courses_students_lnk lnk ON c.id = lnk.course_id WHERE lnk.user_id = 20";
        const res = await client.query(query);
        console.log('Courses for student ID 20 (azzachaieb02@gmail.com):');
        console.table(res.rows);

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
