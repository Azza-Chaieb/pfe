const { createStrapi } = require('@strapi/strapi');

async function checkMeetingRooms() {
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    console.log("Checking bureau_4 and bureau_602 spaces...");
    const spaces = await app.db.query('api::space.space').findMany({
        where: { mesh_name: { $in: ['bureau_4', 'bureau_602'] } }
    });

    console.log(JSON.stringify(spaces.map(s => ({
        id: s.id,
        name: s.name,
        mesh: s.mesh_name,
        access: s.accessible_by,
        type: s.type
    })), null, 2));

    process.exit(0);
}

checkMeetingRooms().catch(e => { console.error(e); process.exit(1); });
