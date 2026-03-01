const { createStrapi } = require('@strapi/strapi');

async function checkSpecificSpaces() {
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    const ids = ['bureau_4', 'bureau_5', 'bureau_602', 'bureau_594'];
    console.log(`Checking database for: ${ids.join(', ')}`);

    const spaces = await app.db.query('api::space.space').findMany({
        where: { mesh_name: { $in: ids } }
    });

    console.log(JSON.stringify(spaces.map(s => ({
        id: s.id,
        name: s.name,
        mesh: s.mesh_name,
        access: s.accessible_by,
        type: s.type,
        coworking: s.coworking_space?.id || s.coworking_space
    })), null, 2));

    process.exit(0);
}

checkSpecificSpaces().catch(e => { console.error(e); process.exit(1); });
