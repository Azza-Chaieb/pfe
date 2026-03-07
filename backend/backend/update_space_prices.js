const { createStrapi } = require('@strapi/strapi');

async function updateSpacePrices() {
    console.log('Starting space price update script...');

    // Initialize Strapi
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    const priceConfig = {
        'event-space': { hourly: 20, daily: 150 },
        'meeting-room': { hourly: 15, daily: 100 },
        'hot-desk': { hourly: 5, daily: 40 }
    };

    try {
        console.log('Fetching all spaces...');
        const spaces = await app.db.query('api::space.space').findMany();
        console.log(`Found ${spaces.length} spaces.`);

        let updatedCount = 0;
        for (const space of spaces) {
            const config = priceConfig[space.type];
            if (config) {
                await app.db.query('api::space.space').update({
                    where: { id: space.id },
                    data: {
                        pricing_hourly: config.hourly,
                        pricing_daily: config.daily
                    }
                });
                updatedCount++;
                console.log(`[UPDATED] ${space.name} (${space.type}): ${config.hourly}DT/H, ${config.daily}DT/J`);
            }
        }

        console.log(`Successfully updated ${updatedCount} spaces.`);
    } catch (err) {
        console.error('Update failed:', err.message);
    } finally {
        process.exit(0);
    }
}

updateSpacePrices().catch(err => {
    console.error(err);
    process.exit(1);
});
