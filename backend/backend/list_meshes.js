const { createStrapi } = require('@strapi/strapi');

async function listMeshNames() {
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    console.log("Fetching all unique mesh names...");
    const spaces = await app.db.query('api::space.space').findMany({
        select: ['mesh_name']
    });

    const uniqueMeshes = [...new Set(spaces.map(s => s.mesh_name))].sort();
    console.log(`Found ${uniqueMeshes.length} unique mesh names.`);

    // Filter for things like bureau_4, bureau_5, etc.
    const interesting = uniqueMeshes.filter(m => m && (m.includes('bureau') || m.includes('salle')));
    console.log(JSON.stringify(interesting, null, 2));

    process.exit(0);
}

listMeshNames().catch(e => { console.error(e); process.exit(1); });
