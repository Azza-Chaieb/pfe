const { createStrapi } = require("@strapi/strapi");

async function checkServices() {
  try {
    const app = await createStrapi({ distDir: "./dist" }).load();
    const services = await app.db.query("api::service.service").findMany();
    console.log("--- SERVICES IN DATABASE ---");
    services.forEach((s) => {
      console.log(
        `ID: ${s.id}, Name: ${s.name}, Has Config: ${!!s.configuration && Object.keys(s.configuration).length > 0}`,
      );
      if (s.configuration) {
        console.log("Config:", JSON.stringify(s.configuration, null, 2));
      }
    });
    console.log("---------------------------");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit(0);
  }
}

checkServices();
