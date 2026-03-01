const strapi = require('@strapi/strapi');

async function run() {
    const app = await strapi({ distDir: './dist' }).load();
    await app.server.mount();

    const spaces = await app.db.query('api::space.space').findMany({
        limit: 100,
    });

    console.log('--- Existing spaces ---');
    for (const s of spaces) {
        console.log(`Space #${s.id} - ${s.name} - mesh: ${s.mesh_name} - type: ${s.type} - cap: ${s.capacity}`);
    }

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
