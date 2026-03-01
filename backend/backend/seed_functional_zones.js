const { createStrapi } = require('@strapi/strapi');
const fs = require('fs');

async function seedSpaces() {
    const { createStrapi } = require('@strapi/strapi');
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    console.log('Loading extracted SVG spaces...');
    const elements = JSON.parse(fs.readFileSync('spaces_mapped.json', 'utf8'));

    // We only want to seed furniture, not large floor backgrounds.
    // Backgrounds are bureau_1 to bureau_10 usually. We filter out elements that don't have coords 
    // or if we know they are large areas.
    // Actually, everything starting with "bureau_" will be processed.
    // If it lacks coords, we can give it default.

    console.log(`Processing ${elements.length} elements...`);

    // Helper to categorize based on X/Y
    const categorize = (x, y) => {
        if (!x && !y) return { access: ['etudiant', 'formateur', 'professionnel', 'association'], type: 'hot-desk' }; // default

        // Boundaries are approx (ViewBox: 2780x1974)
        // Right side (x > 2100) -> Classrooms
        if (x > 2000) {
            return { access: ['formateur', 'professionnel', 'association'], type: 'event-space' };
        }

        // Center Meeting Rooms (offices) -> approx x: 1200-1900, y: 500-1200
        if (x > 1200 && x < 2000 && y > 400 && y < 1300) {
            return { access: ['professionnel', 'association'], type: 'meeting-room' };
        }

        // Left Garden -> x < 600
        if (x < 600) {
            // Guard room is also on left. Let's say top left is guard (y < 400).
            if (y < 500) {
                return { access: [], type: 'fixed-desk', ignored: true }; // Guard room
            }
            return { access: ['etudiant'], type: 'hot-desk' }; // Garden seats
        }

        // Top stairs -> x: 800-1200, y < 400
        if (x > 800 && x < 1300 && y < 400) {
            return { access: [], type: 'fixed-desk', ignored: true }; // Stairs
        }

        // Kitchen/Restroom/Corridor on the left/center-right -> assume x: 1400-1800, y < 400
        if (x > 1400 && x < 2000 && y < 400) {
            return { access: [], type: 'fixed-desk', ignored: true };
        }

        // All remaining (corridors?) -> default individual workspaces
        return { access: ['etudiant', 'formateur', 'professionnel', 'association'], type: 'hot-desk' };
    };

    // First, clear existing spaces
    console.log('Clearing existing spaces...');
    await app.db.query('api::space.space').deleteMany({});

    console.log('Seeding new spaces...');
    let createdCount = 0;
    let ignoredCount = 0;

    for (const el of elements) {
        // Skip background floor polygons (usually bureau_1 to bureau_10)
        const idNum = parseInt(el.id.replace('bureau_', ''));
        if (idNum >= 1 && idNum <= 10) {
            ignoredCount++;
            continue;
        }

        const category = categorize(el.x, el.y);

        if (category.ignored) {
            ignoredCount++;
            continue;
        }

        try {
            await app.db.query('api::space.space').create({
                data: {
                    name: `Espace ${el.id}`,
                    mesh_name: el.id,
                    type: category.type,
                    capacity: 1,
                    accessible_by: category.access,
                    publishedAt: new Date()
                }
            });
            createdCount++;
        } catch (err) {
            console.error(`Failed to create ${el.id}: ${err.message}`);
        }
    }

    console.log(`Finished seeding! Created: ${createdCount}, Ignored: ${ignoredCount}`);
    process.exit(0);
}

seedSpaces().catch(err => {
    console.error(err);
    process.exit(1);
});
