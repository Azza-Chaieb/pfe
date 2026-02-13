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
      "trainer-profile"
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


  console.log("Strapi User-Permissions extension loaded.");
  return plugin;
};
