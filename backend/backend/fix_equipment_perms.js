const { createStrapi } = require('@strapi/strapi');

async function fix() {
    const app = await createStrapi({ distDir: './dist' }).load();
    await app.server.mount();

    console.log("Updating Public role to allow fetching equipments...");

    const publicRole = await app.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
    if (publicRole) {
        // Find permission
        const perm = await app.db.query('plugin::users-permissions.permission').findOne({
            where: { role: publicRole.id, action: 'api::equipment.equipment.find' }
        });
        if (!perm) {
            await app.db.query('plugin::users-permissions.permission').create({
                data: {
                    action: 'api::equipment.equipment.find',
                    role: publicRole.id
                }
            });
            console.log("Added find permission to Public role for Equipment");
        } else {
            console.log("Public role already has find permission for Equipment");
        }
    }

    process.exit(0);
}
fix().catch(e => { console.error(e); process.exit(1); });
