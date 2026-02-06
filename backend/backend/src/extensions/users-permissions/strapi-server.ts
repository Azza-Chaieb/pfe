export default (plugin) => {
  // Configuration des permissions public pour l'API test
  const originalBootstrap = plugin.bootstrap;

  plugin.bootstrap = async ({ strapi }) => {
    if (originalBootstrap) {
      await originalBootstrap({ strapi });
    }

    // Permettre l'accès public aux endpoints de test
    // Cette configuration autorise les utilisateurs anonymes à accéder à l'API
    await strapi
      .query("plugin::users-permissions.permission")
      .updateMany({
        where: { route: { $contains: "test" } },
        data: { enabled: true },
      })
      .catch(() => {
        // Les permissions seront configurées via l'interface admin
        console.log("Permissions will be configured through admin panel");
      });
  };

  return plugin;
};
