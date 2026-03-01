const { createStrapi } = require('@strapi/strapi');

async function restrictMeetingRooms() {
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    const meetingRooms = ['bureau_602', 'bureau_594'];
    const roles = ['professional', 'association'];

    console.log(`Restricting ${meetingRooms.join(', ')} to ${roles.join(', ')}...`);

    for (const mesh of meetingRooms) {
        // We find all entries (Strapi v5 might have duplicates for draft/published)
        const entries = await app.db.query('api::space.space').findMany({
            where: { mesh_name: mesh }
        });

        if (entries.length === 0) {
            console.warn(`No entries found for mesh: ${mesh}`);
            continue;
        }

        for (const entry of entries) {
            console.log(`Updating Space ID ${entry.id} (${mesh})...`);
            await app.db.query('api::space.space').update({
                where: { id: entry.id },
                data: {
                    accessible_by: roles,
                    type: 'meeting-room',
                    name: mesh === 'bureau_602' ? 'Salle de Réunion 1' : 'Salle de Réunion 2'
                }
            });
        }
    }

    console.log("Update completed!");
    process.exit(0);
}

restrictMeetingRooms().catch(e => { console.error(e); process.exit(1); });
