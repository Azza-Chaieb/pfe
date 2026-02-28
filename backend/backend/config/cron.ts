export default {
  /**
   * Cron job to delete unconfirmed users older than 24 hours.
   * Runs every day at 00:00.
   */
  "0 0 * * *": async ({ strapi }) => {
    console.log("🧹 [CRON] Starting unconfirmed users cleanup...");

    // Calculate timestamp for 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      // Find unconfirmed users created before twentyFourHoursAgo
      const unconfirmedUsers = await strapi
        .query("plugin::users-permissions.user")
        .findMany({
          where: {
            confirmed: false,
            createdAt: {
              $lt: twentyFourHoursAgo.toISOString(),
            },
          },
        });

      if (unconfirmedUsers.length > 0) {
        console.log(
          `🗑️ [CRON] Found ${unconfirmedUsers.length} unconfirmed accounts to delete.`,
        );

        for (const user of unconfirmedUsers) {
          // Note: In Strapi 5, you might also want to delete related profiles
          // but if profiles are linked via cascade or "oneToOne", cleaning the user is usually enough
          // or we can manually delete them to be sure.

          await strapi.query("plugin::users-permissions.user").delete({
            where: { id: user.id },
          });

          console.log(`✅ [CRON] Deleted user: ${user.email} (ID: ${user.id})`);
        }
      } else {
        console.log("✨ [CRON] No unconfirmed accounts to clean up today.");
      }
    } catch (err) {
      console.error("🔥 [CRON ERROR] Cleanup failed:", err.message);
    }
  },
};
