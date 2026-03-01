const { createStrapi } = require('@strapi/strapi');

async function verify() {
    console.log('Verifying spaces in database...');
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    // Get 1 of each type
    const filters = [
        { accessible_by: { $contains: 'etudiant' }, $not: { accessible_by: { $contains: 'formateur' } } }, // Garden
        { accessible_by: { $contains: 'formateur' } }, // Classroom or Hotdesk
        { type: 'meeting-room' }
    ];

    for (const f of filters) {
        const s = await app.db.query('api::space.space').findOne({ where: f });
        console.log(s ? `Found space: ${s.name} - mesh: ${s.mesh_name} - access: ${JSON.stringify(s.accessible_by)} - type: ${s.type}` : `No space found for filter ${JSON.stringify(f)}`);
    }

    const total = await app.db.query('api::space.space').count();
    console.log(`Total spaces: ${total}`);

    process.exit(0);
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
