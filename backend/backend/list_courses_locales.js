const { Client } = require("pg");

const DB_CONFIG = {
    host: "127.0.0.1",
    port: 5432,
    database: "sunspace",
    user: "postgres",
    password: "postgres",
};

const client = new Client(DB_CONFIG);

async function list() {
    try {
        await client.connect();
        console.log("--- LISTING ALL COURSES WITH LOCALES ---");
        const res = await client.query("SELECT id, title, locale, published_at FROM courses");
        console.log(`Total courses: ${res.rows.length}`);
        res.rows.forEach(r => {
            console.log(`- [${r.locale}] "${r.title}" (ID: ${r.id}, Published: ${r.published_at})`);
        });
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

list();
