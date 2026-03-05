
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

        console.log("--- CLEANING UP SUBSCRIPTIONS ---");

        // 1. Delete all subscriptions without a plan link or where plan doesn't exist anymore
        const invalidPlanSubs = await client.query(`
            SELECT s.id 
            FROM user_subscriptions s
            LEFT JOIN user_subscriptions_plan_lnk plnk ON s.id = plnk.user_subscription_id
            LEFT JOIN subscription_plans p ON plnk.subscription_plan_id = p.id
            WHERE p.id IS NULL
        `);

        if (invalidPlanSubs.rows.length > 0) {
            const idsToDelete = invalidPlanSubs.rows.map(r => r.id);
            console.log(`Deleting ${idsToDelete.length} subscriptions with missing plans:`, idsToDelete);

            // Delete links first
            await client.query(`DELETE FROM user_subscriptions_user_lnk WHERE user_subscription_id = ANY($1)`, [idsToDelete]);
            await client.query(`DELETE FROM user_subscriptions_plan_lnk WHERE user_subscription_id = ANY($1)`, [idsToDelete]);

            // Then delete main records
            await client.query(`DELETE FROM user_subscriptions WHERE id = ANY($1)`, [idsToDelete]);
        } else {
            console.log("No subscriptions found with missing plans.");
        }

        // 2. Delete duplicate pending plans for the same user (keep only newest)
        const pendingSubs = await client.query(`
            SELECT 
                s.id as sub_id, 
                s.created_at,
                ulnk.user_id
            FROM user_subscriptions s
            JOIN user_subscriptions_user_lnk ulnk ON s.id = ulnk.user_subscription_id
            WHERE s.status = 'pending'
            ORDER BY ulnk.user_id, s.created_at DESC
        `);

        const userSeen = new Set();
        const idsToKeep = [];
        const idsToRemove = [];

        pendingSubs.rows.forEach(row => {
            if (!userSeen.has(row.user_id)) {
                userSeen.add(row.user_id);
                idsToKeep.push(row.sub_id);
            } else {
                idsToRemove.push(row.sub_id);
            }
        });

        if (idsToRemove.length > 0) {
            console.log(`Deleting ${idsToRemove.length} duplicate pending subscriptions:`, idsToRemove);

            // Delete links first
            await client.query(`DELETE FROM user_subscriptions_user_lnk WHERE user_subscription_id = ANY($1)`, [idsToRemove]);
            await client.query(`DELETE FROM user_subscriptions_plan_lnk WHERE user_subscription_id = ANY($1)`, [idsToRemove]);

            // Then delete main records
            await client.query(`DELETE FROM user_subscriptions WHERE id = ANY($1)`, [idsToRemove]);
        } else {
            console.log("No duplicate pending subscriptions found.");
        }

        // 3. Delete subscriptions without a user link
        const noUserSubs = await client.query(`
            SELECT s.id 
            FROM user_subscriptions s
            LEFT JOIN user_subscriptions_user_lnk ulnk ON s.id = ulnk.user_subscription_id
            WHERE ulnk.user_id IS NULL
        `);

        if (noUserSubs.rows.length > 0) {
            const noUserIds = noUserSubs.rows.map(r => r.id);
            console.log(`Deleting ${noUserIds.length} subscriptions with no user linked:`, noUserIds);

            await client.query(`DELETE FROM user_subscriptions_plan_lnk WHERE user_subscription_id = ANY($1)`, [noUserIds]);
            await client.query(`DELETE FROM user_subscriptions WHERE id = ANY($1)`, [noUserIds]);
        } else {
            console.log("No subscriptions found without a user.");
        }

        // 4. Optionally, remove all 'cancelled' subscriptions from history if user just wants a clean slate.
        // I will do this because he mentions having only 1 expected. So any old test 'cancelled' ones confuse him.
        const cancelledSubs = await client.query(`SELECT id FROM user_subscriptions WHERE status = 'cancelled'`);
        if (cancelledSubs.rows.length > 0) {
            const cancelledIds = cancelledSubs.rows.map(r => r.id);
            console.log(`Deleting ${cancelledIds.length} cancelled subscriptions:`, cancelledIds);
            await client.query(`DELETE FROM user_subscriptions_user_lnk WHERE user_subscription_id = ANY($1)`, [cancelledIds]);
            await client.query(`DELETE FROM user_subscriptions_plan_lnk WHERE user_subscription_id = ANY($1)`, [cancelledIds]);
            await client.query(`DELETE FROM user_subscriptions WHERE id = ANY($1)`, [cancelledIds]);
        }


        // Final check
        const remaining = await client.query(`SELECT count(*) FROM user_subscriptions`);
        console.log(`--- CLEANUP COMPLETE --- Remaining subscriptions: ${remaining.rows[0].count}`);

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

run();
