const { createStrapi } = require('@strapi/strapi');

async function seedSpaces() {
    const app = await createStrapi().load();

    // Functional Zones
    const allSpaces = [
        // 4 sections on the right: Classrooms
        // Reserved for trainers, professionals, and association
        { name: 'Classroom 1', type: 'event-space', capacity: 16, accessible_by: ['formateur', 'professionnel', 'association'] },
        { name: 'Classroom 2', type: 'event-space', capacity: 16, accessible_by: ['formateur', 'professionnel', 'association'] },
        { name: 'Classroom 3', type: 'event-space', capacity: 16, accessible_by: ['formateur', 'professionnel', 'association'] },
        { name: 'Classroom 4', type: 'event-space', capacity: 16, accessible_by: ['formateur', 'professionnel', 'association'] },

        // 2 offices in the center: Meeting Rooms
        // Reserved for professional and association
        { name: 'Meeting Room 1', type: 'meeting-room', capacity: 6, accessible_by: ['professionnel', 'association'] },
        { name: 'Meeting Room 2', type: 'meeting-room', capacity: 6, accessible_by: ['professionnel', 'association'] },

        // Left garden: Revision chairs
        // Reserved for students
        { name: 'Garden Revision Chair 1', type: 'hot-desk', capacity: 1, accessible_by: ['etudiant'] },
        { name: 'Garden Revision Chair 2', type: 'hot-desk', capacity: 1, accessible_by: ['etudiant'] },
        { name: 'Garden Revision Chair 3', type: 'hot-desk', capacity: 1, accessible_by: ['etudiant'] },
        { name: 'Garden Revision Chair 4', type: 'hot-desk', capacity: 1, accessible_by: ['etudiant'] },

        // Top entrance after stairs: Inaccessible
        { name: 'Entrance Stairs Area', type: 'hot-desk', capacity: 0, accessible_by: [] },

        // Restrooms, kitchen, corridor, guard's room: Inaccessible
        { name: 'Restrooms', type: 'hot-desk', capacity: 0, accessible_by: [] },
        { name: 'Kitchen', type: 'hot-desk', capacity: 0, accessible_by: [] },
        { name: 'Corridor', type: 'hot-desk', capacity: 0, accessible_by: [] },
        { name: 'Guard Room', type: 'hot-desk', capacity: 0, accessible_by: [] },

        // Remaining areas: Individual workspaces (accessible by all)
        // "each consisting of one chair and one desk"
        { name: 'Individual Workspace 1', type: 'hot-desk', capacity: 1, accessible_by: ['etudiant', 'formateur', 'professionnel', 'association'] },
        { name: 'Individual Workspace 2', type: 'hot-desk', capacity: 1, accessible_by: ['etudiant', 'formateur', 'professionnel', 'association'] },
        { name: 'Individual Workspace 3', type: 'hot-desk', capacity: 1, accessible_by: ['etudiant', 'formateur', 'professionnel', 'association'] },
        { name: 'Individual Workspace 4', type: 'hot-desk', capacity: 1, accessible_by: ['etudiant', 'formateur', 'professionnel', 'association'] },
        { name: 'Individual Workspace 5', type: 'hot-desk', capacity: 1, accessible_by: ['etudiant', 'formateur', 'professionnel', 'association'] },
        { name: 'Individual Workspace 6', type: 'hot-desk', capacity: 1, accessible_by: ['etudiant', 'formateur', 'professionnel', 'association'] },
        { name: 'Individual Workspace 7', type: 'hot-desk', capacity: 1, accessible_by: ['etudiant', 'formateur', 'professionnel', 'association'] },
        { name: 'Individual Workspace 8', type: 'hot-desk', capacity: 1, accessible_by: ['etudiant', 'formateur', 'professionnel', 'association'] },
    ];

    console.log('Seeding functional zones into the Space table...');

    for (const space of allSpaces) {
        try {
            // Create space entry in database
            const created = await app.db.query('api::space.space').create({
                data: {
                    name: space.name,
                    type: space.type,
                    capacity: space.capacity,
                    accessible_by: space.accessible_by,
                    publishedAt: new Date() // Publish immediately
                }
            });
            console.log(`[SUCCESS] Created space: ${created.name}`);
        } catch (err) {
            console.error(`[ERROR] Failed to create space ${space.name}:`, err.message);
        }
    }

    console.log('Finished seeding functional zones.');
    process.exit(0);
}

seedSpaces().catch(err => {
    console.error(err);
    process.exit(1);
});
