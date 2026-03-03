const strapi = require("@strapi/strapi");
const fs = require("fs");
const path = require("path");

async function debug() {
  console.log("Starting Strapi...");
  const app = await strapi().load();
  try {
    console.log("Querying user-subscriptions...");
    const list = await app.entityService.findMany(
      "api::user-subscription.user-subscription",
      { populate: "*" },
    );
    fs.writeFileSync(
      path.join(__dirname, "dump_v5.json"),
      JSON.stringify(list, null, 2),
    );
    console.log("Dumped", list.length, "records");

    const routes = app.server.router.stack
      .filter((r) => r.route)
      .map((r) => `${r.route.stack[0].method.toUpperCase()} ${r.route.path}`);
    fs.writeFileSync(path.join(__dirname, "routes_v5.txt"), routes.join("\n"));
    console.log("Dumped routes");
  } catch (err) {
    fs.writeFileSync(path.join(__dirname, "error_v5.txt"), err.stack);
    console.error(err);
  } finally {
    process.exit(0);
  }
}

debug();
