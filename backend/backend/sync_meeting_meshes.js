const { createStrapi } = require('@strapi/strapi');

async function syncMeshNames() {
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    // Map the actual clickable mesh names to the meeting room roles
    const mappings = [
        { oldMesh: 'bureau_602', newMesh: 'bureau_5', name: 'Salle de Réunion 1' },
        { oldMesh: 'bureau_594', newMesh: 'bureau_4_remainder', name: 'Salle de Réunion 2' }
    ];

    const roles = ['professional', 'association'];

    for (const m of mappings) {
        console.log(`Syncing ${m.newMesh}...`);

        // Find if we have an entry with the new mesh already
        let space = await app.db.query('api::space.space').findOne({
            where: { mesh_name: m.newMesh }
        });

        if (!space) {
            // Find the entry I created with the old mesh and update it
            space = await app.db.query('api::space.space').findOne({
                where: { mesh_name: m.oldMesh }
            });
        }

        if (space) {
            console.log(`Updating Space ID ${space.id} to mesh ${m.newMesh}...`);
            await app.db.query('api::space.space').update({
                where: { id: space.id },
                data: {
                    mesh_name: m.newMesh,
                    name: m.name,
                    accessible_by: roles,
                    type: 'meeting-room',
                    coworking_space: 5 // Ensure it's linked
                }
            });
        } else {
            console.warn(`Could not find space for ${m.oldMesh} or ${m.newMesh}`);
        }
    }

    console.log("Sync completed!");
    process.exit(0);
}

syncMeshNames().catch(e => { console.error(e); process.exit(1); });
