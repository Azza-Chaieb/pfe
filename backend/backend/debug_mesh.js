const { createStrapi } = require('@strapi/strapi');

async function c() {
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    const allSpaces = await app.db.query('api::space.space').findMany({ limit: 5000 });

    // Find spaces that contain "Classe" in the name
    let c = 0;
    for (const space of allSpaces) {
        if (space.name && space.name.includes('Classe')) {
            console.log(`ID: ${space.id}, Name: ${space.name}, Mesh: ${space.mesh_name}`);
            c++;
        }
        if (c > 20) break;
    }

    console.log(`Total spaces containing Classe: ${allSpaces.filter(s => s.name && s.name.includes('Classe')).length}`);
    process.exit(0);
}
c();
