const { createStrapi } = require('@strapi/strapi');

async function verify() {
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    const meshes = ['bureau_salle_5', 'bureau_salle_6'];
    const spaces = await app.db.query('api::space.space').findMany({
        where: { mesh_name: { $in: meshes } }
    });

    console.log(JSON.stringify(spaces.map(s => ({
        name: s.name,
        mesh: s.mesh_name,
        access: s.accessible_by
    })), null, 2));

    process.exit(0);
}

verify().catch(e => { console.error(e); process.exit(1); });
