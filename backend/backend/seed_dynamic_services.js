const { createStrapi } = require('@strapi/strapi');

async function seedDynamicServices() {
    console.log('Starting dynamic services seed script...');

    // Initialize Strapi
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    const services = [
        {
            name: 'Impression',
            description: 'Impression de documents (Noir & Blanc ou Couleur)',
            price: 0.2, // per page logic handled in frontend
            price_type: 'one-time',
            configuration: {
                fields: [
                    { name: 'file', type: 'file', label: 'Uploader le document', required: true },
                    { name: 'pages', type: 'number', label: 'Nombre de copies', min: 1, default: 1, required: true },
                    { name: 'color', type: 'select', label: 'Couleur', options: ['Noir & Blanc', 'Couleur'], default: 'Noir & Blanc' }
                ]
            }
        },
        {
            name: 'Caféterie Premium',
            description: 'Accès illimité aux boissons chaudes et snacks',
            price: 5,
            price_type: 'daily',
            configuration: {
                fields: [
                    { name: 'preferences', type: 'text', label: 'Préférences alimentaires / allergies', placeholder: 'Ex: Sans gluten...' }
                ]
            }
        },
        {
            name: 'Vidéoprojecteur HD',
            description: 'Location d\'un vidéoprojecteur haute définition',
            price: 30,
            price_type: 'daily',
            configuration: {
                fields: [
                    { name: 'connector', type: 'select', label: 'Type de connecteur', options: ['HDMI', 'VGA', 'USB-C'], default: 'HDMI' }
                ]
            }
        },
        {
            name: 'Catering / Déjeuner',
            description: 'Repas complet servi dans l\'espace',
            price: 15,
            price_type: 'one-time',
            configuration: {
                fields: [
                    { name: 'menu', type: 'select', label: 'Choix du menu', options: ['Standard', 'Végétarien', 'Vegan'], default: 'Standard' },
                    { name: 'time', type: 'text', label: 'Heure souhaitée', placeholder: '12:30' }
                ]
            }
        }
    ];

    try {
        console.log('Cleaning up existing services with these names...');
        for (const s of services) {
            const existing = await app.db.query('api::service.service').findOne({ where: { name: s.name } });
            if (existing) {
                await app.db.query('api::service.service').delete({ where: { id: existing.id } });
                console.log(`[DELETED] Old service: ${s.name}`);
            }
        }

        console.log('Fetching all spaces to link services...');
        const allSpaces = await app.db.query('api::space.space').findMany();
        const spaceIds = allSpaces.map(s => s.id);

        console.log('Seeding new services...');
        for (const s of services) {
            const created = await app.db.query('api::service.service').create({
                data: {
                    ...s,
                    spaces: spaceIds,
                    publishedAt: new Date()
                }
            });
            console.log(`[CREATED] Service: ${created.name} linked to ${spaceIds.length} spaces`);
        }

        console.log('Successfully seeded dynamic services.');
    } catch (err) {
        console.error('Seed failed:', err.message);
    } finally {
        process.exit(0);
    }
}

seedDynamicServices().catch(err => {
    console.error(err);
    process.exit(1);
});
