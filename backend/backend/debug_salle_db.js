const { createStrapi } = require('@strapi/strapi');

async function check() {
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    console.log("Checking spaces that contain 'salle' in their mesh name...");
    const spaces = await app.db.query('api::space.space').findMany({
        where: { mesh_name: { $contains: 'salle' } }
    });

    console.log(JSON.stringify(spaces.map(s => ({
        id: s.id,
        documentId: s.documentId,
        name: s.name,
        mesh: s.mesh_name,
        access: s.accessible_by,
        published: !!s.publishedAt
    })), null, 2));

    process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
