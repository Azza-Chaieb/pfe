import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    // Force local temp directory to avoid EPERM on Windows system temp folder
    const path = require('path');
    const fs = require('fs');
    const tmpDir = path.join(process.cwd(), '.tmp');
    const uploadTmpDir = path.join(tmpDir, 'uploads');

    if (!fs.existsSync(uploadTmpDir)) {
      fs.mkdirSync(uploadTmpDir, { recursive: true });
    }

    process.env.TMP = uploadTmpDir;
    process.env.TEMP = uploadTmpDir;
    console.log(`🔧 Temp directory forced to: ${uploadTmpDir}`);
  },

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
      }

      // Proactively grant upload permissions to Authenticated role
      try {
        const uploadActions = [
          'plugin::upload.content-api.upload',
          'plugin::upload.content-api.find',
          'plugin::upload.content-api.findOne'
        ];

        for (const action of uploadActions) {
          const permission = await strapi.query('plugin::users-permissions.permission').findOne({
            where: { action, role: role.id }
          });

          if (!permission) {
            await strapi.query('plugin::users-permissions.permission').create({
              data: { action, role: role.id }
            });
            console.log(`✅ Granted "${action}" permission to Authenticated role.`);
          }
        }
      } catch (uploadErr) {
        console.warn('⚠️ Failed to auto-grant upload permission:', uploadErr.message);
      }
    } catch (error) {
      console.error('❌ Failed during bootstrap:', error);
    }
  },
};
