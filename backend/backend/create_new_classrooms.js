const { createStrapi } = require('@strapi/strapi');

async function createNewClassrooms() {
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    const newSpaces = [
        {
            name: "Classe 5",
            mesh_name: "bureau_salle_5",
            type: "meeting-room",
            capacity: 2,
            accessible_by: ["trainer", "professional", "association"],
            coworking_space: 5
        },
        {
            name: "Classe 6",
            mesh_name: "bureau_salle_6",
            type: "meeting-room",
            capacity: 16,
            accessible_by: ["trainer", "professional", "association"],
            coworking_space: 5
        }
    ];

    console.log("Creating new classrooms in database...");

    for (const spaceData of newSpaces) {
        // Check if exists first
        const existing = await app.db.query('api::space.space').findOne({
            where: { mesh_name: spaceData.mesh_name }
        });

        if (existing) {
            console.log(`Space ${spaceData.mesh_name} already exists (ID: ${existing.id}). Updating...`);
            await app.db.query('api::space.space').update({
                where: { id: existing.id },
                data: spaceData
            });
        } else {
            console.log(`Creating ${spaceData.name} (${spaceData.mesh_name})...`);
            // Strapi 5: use documents service for better visibility in admin
            await app.documents('api::space.space').create({
                data: {
                    ...spaceData,
                    publishedAt: new Date()
                }
            });
        }
    }

    console.log("Done!");
    process.exit(0);
}

createNewClassrooms().catch(e => { console.error(e); process.exit(1); });
