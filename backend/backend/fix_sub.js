const strapi = require("@strapi/strapi");

async function fix() {
  const app = await strapi().load();
  try {
    console.log("Fetching sub 1...");
    const sub = await app.entityService.findOne(
      "api::user-subscription.user-subscription",
      1,
      { populate: ["plan"] },
    );
    console.log("Current plan:", sub.plan ? sub.plan.id : "null");

    if (!sub.plan) {
      console.log("Updating sub 1 with plan 2...");
      const updated = await app.entityService.update(
        "api::user-subscription.user-subscription",
        1,
        { data: { plan: 2 } },
      );
      console.log(
        "Update done. New plan ID:",
        updated.plan ? updated.plan.id : "still null",
      );
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

fix();
