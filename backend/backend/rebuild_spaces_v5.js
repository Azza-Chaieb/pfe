const { createStrapi } = require('@strapi/strapi');
const fs = require('fs');

async function rebuildV5() {
    const strapi = await createStrapi({ distDir: './dist' }).load();
    await strapi.server.mount();

    console.log('Clearing old ghost database entries...');
    await strapi.db.query('api::space.space').deleteMany({});

    console.log('Loading extracted SVG spaces...');
    const elements = JSON.parse(fs.readFileSync('spaces_mapped.json', 'utf8'));

    const categorize = (x, y) => {
        if (!x && !y) return { access: ['student', 'trainer', 'professional', 'association'], type: 'hot-desk' };
        if (x > 2000) return { access: ['trainer', 'professional', 'association'], type: 'event-space', isRoomChild: true };
        if (x > 1200 && x < 2000 && y > 400 && y < 1300) return { access: ['professional', 'association'], type: 'meeting-room' };
        if (x < 600) {
            if (y < 500) return { access: [], type: 'fixed-desk', ignored: true };
            return { access: ['student'], type: 'hot-desk' };
        }
        if (x > 800 && x < 1300 && y < 400) return { access: [], type: 'fixed-desk', ignored: true };
        if (x > 1400 && x < 2000 && y < 400) return { access: [], type: 'fixed-desk', ignored: true };
        return { access: ['student', 'trainer', 'professional', 'association'], type: 'hot-desk' };
    };

    let createdCount = 0;
    for (const el of elements) {
        const idNum = parseInt(el.id.replace('bureau_', ''));
        if (idNum >= 1 && idNum <= 10) continue;

        const cat = categorize(el.x, el.y);
        if (cat.ignored || cat.isRoomChild) continue;

        try {
            await strapi.documents('api::space.space').create({
                data: {
                    name: `Espace ${el.id}`,
                    mesh_name: el.id,
                    type: cat.type,
                    capacity: 1,
                    accessible_by: cat.access
                },
                status: 'published'
            });
            createdCount++;
        } catch (err) {
            console.error(`Failed ${el.id}: ${err.message}`);
        }
    }

    console.log(`Created ${createdCount} valid spaces via v5 Document Service.`);

    console.log('Creating the 4 main classrooms...');
    const rooms = ['bureau_salle_1', 'bureau_salle_2', 'bureau_salle_3', 'bureau_salle_4'];
    for (let i = 0; i < rooms.length; i++) {
        try {
            await strapi.documents('api::space.space').create({
                data: {
                    name: `Classe ${i + 1}`,
                    mesh_name: rooms[i],
                    type: 'event-space',
                    capacity: 16,
                    accessible_by: ['trainer', 'professional', 'association']
                },
                status: 'published'
            });
            console.log(`Created ${rooms[i]}`);
        } catch (e) {
            console.log(`Failed room ${rooms[i]} : ${e.message}`);
        }
    }

    process.exit(0);
}

rebuildV5().catch(e => { console.error(e); process.exit(1); });
