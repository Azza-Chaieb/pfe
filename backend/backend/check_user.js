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
        console.log("--- USER DATA CHECK ---");

        const res = await client.query("SELECT id, username, email, user_type FROM up_users WHERE email = 'azachaieb@gmail.com'");
        console.log(JSON.stringify(res.rows[0], null, 2));

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
