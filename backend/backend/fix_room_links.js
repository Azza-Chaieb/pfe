const { createStrapi } = require('@strapi/strapi');

async function fixLinks() {
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    console.log("Linking classrooms to Coworking Space 5...");

    // Find Coworking Space 5
    const sunspace = await app.db.query('api::coworking-space.coworking-space').findOne({
        where: { id: 5 }
    });

    if (!sunspace) {
        console.error("Coworking Space 5 not found!");
        process.exit(1);
    }

    const rooms = ['bureau_salle_1', 'bureau_salle_2', 'bureau_salle_3', 'bureau_salle_4'];

    for (const mesh of rooms) {
        const space = await app.db.query('api::space.space').findOne({
            where: { mesh_name: mesh }
        });

        if (space) {
            console.log(`Linking ${mesh} (ID: ${space.id}) to Coworking Space 5`);
            await app.db.query('api::space.space').update({
                where: { id: space.id },
                data: {
                    coworking_space: sunspace.id
                }
            });
        } else {
            console.error(`Space with mesh ${mesh} not found!`);
        }
    }

    console.log("Done!");
    process.exit(0);
}

fixLinks().catch(e => { console.error(e); process.exit(1); });
