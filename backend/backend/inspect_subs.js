
const strapiWrapper = require('@strapi/strapi');

async function inspect() {
    const app = await strapiWrapper.compile();
    const strapi = await app.bootstrap();

    try {
        const subs = await strapi.documents('api::user-subscription.user-subscription').findMany({
            populate: ['user', 'plan']
        });

        console.log(`Found ${subs.length} subscriptions:`);
        subs.forEach(s => {
            console.log(`- ID: ${s.id} | DocID: ${s.documentId}`);
            console.log(`  User: ${s.user?.username} (${s.user?.email}) [ID: ${s.user?.id}]`);
            console.log(`  Plan: ${s.plan?.name || "MISSING PLAN"} [Plan ID: ${s.plan?.id}]`);
            console.log(`  Status: ${s.status}`);
            console.log(`  Created: ${s.createdAt}`);
            console.log('---');
        });

    } catch (err) {
        console.error("Error inspecting subscriptions:", err);
    } finally {
        process.exit(0);
    }
}

inspect();
