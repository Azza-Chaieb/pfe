const fs = require('fs');
const { createStrapi } = require('@strapi/strapi');

async function fixClassrooms() {
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    const allSpaces = await app.db.query('api::space.space').findMany({ limit: 5000 });
    const elementsFile = JSON.parse(fs.readFileSync('spaces_mapped.json', 'utf8'));

    // Find all IDs of elements that are on the right side (x > 2000)
    const rightSideIds = new Set();
    for (const el of elementsFile) {
        if (el.x > 2000) {
            rightSideIds.add(el.id);
        }
    }

    console.log(`There are ${rightSideIds.size} desks/elements in the right side classrooms.`);

    let deletedCount = 0;
    for (const space of allSpaces) {
        if (rightSideIds.has(space.mesh_name)) {
            await app.db.query('api::space.space').delete({ where: { id: space.id } });
            deletedCount++;
        }
    }
    console.log(`Deleted ${deletedCount} individual desk entries from the Classrooms.`);

    // Check if the 4 rooms are already added
    const rooms = ['bureau_salle_1', 'bureau_salle_2', 'bureau_salle_3', 'bureau_salle_4'];
    let addedCount = 0;

    for (let i = 0; i < rooms.length; i++) {
        const meshName = rooms[i];
        // The display names the user wants
        const displayName = `Classe ${i + 1}`;

        const existing = await app.db.query('api::space.space').findOne({ where: { mesh_name: meshName } });
        if (!existing) {
            await app.db.query('api::space.space').create({
                data: {
                    name: displayName,
                    mesh_name: meshName,
                    type: 'event-space',
                    capacity: 16, // Assuming 16 seats per class
                    accessible_by: ['formateur', 'professionnel', 'association'],
                    publishedAt: new Date()
                }
            });
            addedCount++;
        }
    }

    console.log(`Added ${addedCount} full-room spaces.`);
    process.exit(0);
}

fixClassrooms().catch(err => {
    console.error(err);
    process.exit(1);
});
