const { createStrapi } = require('@strapi/strapi');

async function updateDatabase() {
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    // 1. Update bureau_1 to be "Common Areas" and NOT accessible by anyone
    const b1 = await app.db.query('api::space.space').findOne({
        where: { mesh_name: 'bureau_1' }
    });

    if (b1) {
        console.log(`Updating bureau_1 (ID: ${b1.id}) as Inaccessible...`);
        await app.db.query('api::space.space').update({
            where: { id: b1.id },
            data: {
                name: "Espaces Communs (Inaccessible)",
                accessible_by: [], // Empty means no role can book it
                type: 'meeting-room' // Use valid enum
            }
        });
    }

    // 2. Ensure Classe 5 and Classe 6 are correctly set up
    const classes = [
        { mesh: 'bureau_salle_5', name: 'Classe 5', cap: 12 },
        { mesh: 'bureau_salle_6', name: 'Classe 6', cap: 12 }
    ];

    for (const c of classes) {
        const existing = await app.db.query('api::space.space').findOne({
            where: { mesh_name: c.mesh }
        });

        if (existing) {
            console.log(`Updating ${c.name} (Mesh: ${c.mesh})...`);
            await app.db.query('api::space.space').update({
                where: { id: existing.id },
                data: {
                    name: c.name,
                    capacity: c.cap,
                    accessible_by: ['trainer', 'professional', 'association'],
                    type: 'meeting-room',
                    coworking_space: 5
                }
            });
        }
    }

    console.log("Database update complete.");
    process.exit(0);
}

updateDatabase().catch(e => { console.error(e); process.exit(1); });
