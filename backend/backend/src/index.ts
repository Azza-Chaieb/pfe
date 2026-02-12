import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Seed an admin user for the frontend app (Authenticated User)
    try {
      const pluginStore = strapi.store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
      });

      const settings = await pluginStore.get({ key: 'advanced' });

      // Find the 'Authenticated' role
      const role = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'authenticated' } });

      if (!role) {
        console.error('Authenticated role not found. Cannot seed user.');
        return;
      }

      // Check if our admin user exists
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: 'admin@sunspacee.com' },
      });

      if (!user) {
        // ... creation logic ...
        await strapi.plugin('users-permissions').service('user').add({
            username: 'admin',
            email: 'admin@sunspacee.com',
            password: 'Password123!',
            role: role.id,
            confirmed: true,
            provider: 'local',
        });
        console.log('✅ Seeded admin user: admin@sunspacee.com / Password123!');
      } else {
        // Force confirm the user if it already exists, just in case
        await strapi.query('plugin::users-permissions.user').update({
            where: { id: user.id },
            data: { 
                confirmed: true,
                blocked: false
            }
        });
        console.log('ℹ️ Admin user already exists. Ensured it is confirmed and unblocked.');
      }
    } catch (error) {
      console.error('❌ Failed to seed admin user:', error);
    }
  },
};
