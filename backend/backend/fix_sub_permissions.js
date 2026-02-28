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

    // 1. Find authenticated role ID
    const roleRes = await client.query(
      "SELECT id FROM up_roles WHERE type = 'authenticated' LIMIT 1",
    );
    if (roleRes.rows.length === 0) {
      console.error("Authenticated role not found.");
      return;
    }
    const roleId = roleRes.rows[0].id;
    console.log(`Found Authenticated role ID: ${roleId}`);

    const actions = [
      "api::user-subscription.user-subscription.getPlans",
      "api::user-subscription.user-subscription.getMySubscription",
      "api::user-subscription.user-subscription.subscribe",
      "api::user-subscription.user-subscription.upgrade",
      "api::user-subscription.user-subscription.cancelSubscription",
      "api::user-subscription.user-subscription.renew",
    ];

    for (const action of actions) {
      // Check if permission already exists
      const checkRes = await client.query(
        "SELECT id FROM up_permissions WHERE action = $1 AND role_id = $2",
        [action, roleId],
      );

      if (checkRes.rows.length === 0) {
        console.log(`Granting permission: ${action}`);
        await client.query(
          "INSERT INTO up_permissions (action, role_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())",
          [action, roleId],
        );
      } else {
        console.log(`Permission already exists: ${action}`);
      }
    }

    console.log("✅ Subscription permissions granted successfully.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
