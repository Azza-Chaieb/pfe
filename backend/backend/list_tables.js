const { Client } = require("pg");

const DB_CONFIG = {
    host: "127.0.0.1",
    port: 5432,
    database: "sunspace",
    user: "postgres",
    password: "postgres",
};

const client = new Client(DB_CONFIG);

async function listTables() {
    try {
        await client.connect();
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
        console.log("TABLES_LIST:" + JSON.stringify(res.rows.map(r => r.table_name)));
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

listTables();
