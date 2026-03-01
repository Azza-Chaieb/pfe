const { createStrapi } = require('@strapi/strapi');

async function updateConsolidatedDB() {
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    // 1. bureau_1: All common areas (HALLWAY, TOILET, KITCHEN, SECURITY)
    const b1 = await app.db.query('api::space.space').findOne({ where: { mesh_name: 'bureau_1' } });
    if (b1) {
        console.log(`Setting bureau_1 (ID: ${b1.id}) as Inaccessible common area...`);
        await app.db.query('api::space.space').update({
            where: { id: b1.id },
            data: {
                name: "Espaces Communs",
                accessible_by: [], // No roles can book
                type: 'meeting-room'
            }
        });
    }

    // 2. Classes 1-6 (All bookable by trainer, professional, association)
    const roles = ['trainer', 'professional', 'association'];
    const salles = [
        { mesh: 'bureau_salle_1', name: 'Classe 1' },
        { mesh: 'bureau_salle_2', name: 'Classe 2' },
        { mesh: 'bureau_salle_3', name: 'Classe 3' },
        { mesh: 'bureau_salle_4', name: 'Classe 4' },
        { mesh: 'bureau_salle_5', name: 'Classe 5' },
        { mesh: 'bureau_salle_6', name: 'Classe 6' }
    ];

    for (const s of salles) {
        let space = await app.db.query('api::space.space').findOne({ where: { mesh_name: s.mesh } });
        if (space) {
            console.log(`Updating ${s.name} (ID: ${space.id})...`);
            await app.db.query('api::space.space').update({
                where: { id: space.id },
                data: {
                    name: s.name,
                    accessible_by: roles,
                    type: 'meeting-room',
                    coworking_space: 5
                }
            });
        } else {
            console.log(`Creating missing ${s.name}...`);
            await app.documents('api::space.space').create({
                data: {
                    ...s,
                    mesh_name: s.mesh,
                    accessible_by: roles,
                    type: 'meeting-room',
                    coworking_space: 5,
                    publishedAt: new Date()
                }
            });
        }
    }

    console.log("Database update complete.");
    process.exit(0);
}

updateConsolidatedDB().catch(e => { console.error(e); process.exit(1); });
