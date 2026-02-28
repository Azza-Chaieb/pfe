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
        console.log("--- BOOKINGS CHECK (JOIN TABLES) ---");

        const query = `
      SELECT b.id, b.status, b.start_time, b.end_time, u.username as client, s.name as space 
      FROM bookings b 
      LEFT JOIN bookings_user_lnk bulk ON b.id = bulk.booking_id
      LEFT JOIN up_users u ON bulk.user_id = u.id 
      LEFT JOIN bookings_space_lnk bslk ON b.id = bslk.booking_id
      LEFT JOIN spaces s ON bslk.space_id = s.id 
      ORDER BY b.created_at DESC
      LIMIT 10
    `;

        const res = await client.query(query);
        console.table(res.rows);

        const totalRes = await client.query("SELECT COUNT(*) FROM bookings");
        console.log(`Total Bookings: ${totalRes.rows[0].count}`);

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
