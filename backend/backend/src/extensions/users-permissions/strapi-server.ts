export default (plugin) => {
  // 1. Configuration des permissions et de la population du profil
  const originalBootstrap = plugin.bootstrap;

  plugin.bootstrap = async ({ strapi }) => {
    if (originalBootstrap) {
      await originalBootstrap({ strapi });
    }

    const profileTypes = [
      "etudiant-profil",
      "formateur-profil",
      "association-profil",
      "professionnel",
      "trainer-profile",
      "course",
      "session",
      "reservation"
    ];

    // 2. Configuration automatique : Permissions et Paramètres Avancés
    try {
      const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
      const advancedSettings = await pluginStore.get({ key: 'advanced' });

      // Activer l'inscription si elle ne l'est pas
      if (!advancedSettings.allow_register) {
        await pluginStore.set({ key: 'advanced', value: { ...advancedSettings, allow_register: true } });
        console.log("Registration enabled in advanced settings.");
      }

      const publicRole = await strapi.query("plugin::users-permissions.role").findOne({ where: { type: "public" } });
      const authenticatedRole = await strapi.query("plugin::users-permissions.role").findOne({ where: { type: "authenticated" } });

      // Action Register pour le Public (Check & Update or Create)
      if (publicRole) {
        const registerPermission = await strapi.query("plugin::users-permissions.permission").findOne({
          where: {
            action: "plugin::users-permissions.auth.register",
            role: publicRole.id,
          },
        });

        if (registerPermission) {
          await strapi.query("plugin::users-permissions.permission").update({
            where: { id: registerPermission.id },
            data: { enabled: true },
          });
        } else {
          await strapi.query("plugin::users-permissions.permission").create({
            data: {
              action: "plugin::users-permissions.auth.register",
              role: publicRole.id,
              enabled: true,
            },
          });
        }
        console.log("Register permission explicitly set to enabled for Public role.");
      }

      // Permissions Profils pour Authenticated
      if (authenticatedRole) {
        for (const type of profileTypes) {
          const apiName = `api::${type}.${type}`;
          const actions = ["find", "update", "create"];

          for (const action of actions) {
            const perm = await strapi.query("plugin::users-permissions.permission").findOne({
              where: { action: `${apiName}.${action}`, role: authenticatedRole.id }
            });
            if (perm) {
              await strapi.query("plugin::users-permissions.permission").update({ where: { id: perm.id }, data: { enabled: true } });
            } else {
              await strapi.query("plugin::users-permissions.permission").create({
                data: { action: `${apiName}.${action}`, role: authenticatedRole.id, enabled: true }
              });
            }
          }
        }

        // 3. Permission d'upload pour l'avatar (Compatible Strapi 4 & 5)
        const uploadActions = ["plugin::upload.upload", "plugin::upload.content-api.upload", "plugin::upload.assets.upload"];
        for (const action of uploadActions) {
          const perm = await strapi.query("plugin::users-permissions.permission").findOne({
            where: { action, role: authenticatedRole.id }
          });
          if (perm) {
            await strapi.query("plugin::users-permissions.permission").update({ where: { id: perm.id }, data: { enabled: true } });
          } else {
            await strapi.query("plugin::users-permissions.permission").create({
              data: { action, role: authenticatedRole.id, enabled: true },
            }).catch(() => { });
          }
        }

        // 4. Permission pour que l'utilisateur puisse modifier ses propres infos
        const userUpdatePerm = await strapi.query("plugin::users-permissions.permission").findOne({
          where: { action: "plugin::users-permissions.user.update", role: authenticatedRole.id }
        });
        if (userUpdatePerm) {
          await strapi.query("plugin::users-permissions.permission").update({ where: { id: userUpdatePerm.id }, data: { enabled: true } });
        } else {
          await strapi.query("plugin::users-permissions.permission").create({
            data: { action: "plugin::users-permissions.user.update", role: authenticatedRole.id, enabled: true },
          });
        }

        console.log("Profile, Upload and User update permissions synchronized for Authenticated role.");
      }
    } catch (e: any) {
      console.log("Bootstrap configuration error or already exists:", e.message);
    }
  };

  // Lifecycle hooks for email notifications
  plugin.contentTypes['user'].lifecycles = {
    async afterCreate(event) {
      const { result } = event;

      // Send welcome email to new users
      try {
        const emailService = strapi.service('api::email.email-service');
        if (emailService && result.email) {
          await emailService.sendWelcomeEmail(result.email, result.fullname || result.username);
          strapi.log.info(`Welcome email sent to ${result.email}`);
        }
      } catch (error) {
        strapi.log.error('Failed to send welcome email:', error);
      }
    },

    async afterUpdate(event) {
      const { result, params } = event;
      if (!result || !params.data) return;

      // Detect password reset token generation
      if (result.resetPasswordToken && params.data.resetPasswordToken) {
        try {
          const emailService = strapi.service('api::email.email-service');
          if (emailService && result.email) {
            await emailService.sendPasswordResetEmail(
              result.email,
              result.fullname || result.username,
              result.resetPasswordToken
            );
            strapi.log.info(`Custom password reset email sent to ${result.email}`);
          }
        } catch (error) {
          strapi.log.error('Failed to send custom password reset email:', error);
        }
      }
    },
  };

  console.log("Strapi User-Permissions extension loaded.");
  return plugin;
};
