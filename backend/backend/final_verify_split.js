const { createStrapi } = require('@strapi/strapi');

async function finalVerify() {
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    const rooms = await app.db.query('api::space.space').findMany({
        where: { mesh_name: { $in: ['bureau_salle_5', 'bureau_salle_6'] } }
    });

    console.log(JSON.stringify(rooms.map(r => ({
        id: r.id,
        name: r.name,
        mesh: r.mesh_name,
        access: r.accessible_by
    })), null, 2));

    process.exit(0);
}

finalVerify().catch(e => { console.error(e); process.exit(1); });
