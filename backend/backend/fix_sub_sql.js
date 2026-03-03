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
    console.log("Connected to DB. Fixing sub 1...");

    // Strapi V5 relation table for many-to-one or one-to-one is usually just a column in the main table
    // Let's check the column name. In schema it's "plan".
    // Relation columns in Strapi V5 are often Suffixed with _id or similar but let's try standard.
    // Actually, let's just update based on the most likely column name.

    // We can use a query to find columns first if unsure.
    const colRes = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'user_subscriptions'",
    );
    console.log("Columns:", colRes.rows.map((r) => r.column_name).join(", "));

    // In Strapi V5, relations might be in a separate join table even for many-to-one if configured?
    // No, manyToOne is usually a column.

    // Let's try to update 'plan_id' or 'plan'
    const hasPlanId = colRes.rows.some((r) => r.column_name === "plan_id");
    const targetCol = hasPlanId ? "plan_id" : "plan";

    await client.query(
      `UPDATE user_subscriptions SET ${targetCol} = 2 WHERE id = 1`,
    );
    console.log(`✅ Subscription 1 updated with plan 2 in column ${targetCol}`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
