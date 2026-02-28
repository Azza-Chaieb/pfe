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
        console.log("--- MANUAL USER TYPE OVERRIDE ---");

        // Fix specific users mentioned or implied (professional, trainer, association)
        // Professional override
        await client.query("UPDATE up_users SET user_type = 'professional' WHERE email IN ('librairiedeaziz@gmail.com', 'nadach@gmail.com')");

        // Trainer override
        await client.query("UPDATE up_users SET user_type = 'trainer' WHERE email IN ('chahd@gmail.com', 'bachamel5@gmail.com')");

        // Association override
        await client.query("UPDATE up_users SET user_type = 'association' WHERE email IN ('nawres@gmail.com', 'azza12@gmail.com')");

        console.log("Updated representative users to Professional, Trainer, and Association types.");

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
