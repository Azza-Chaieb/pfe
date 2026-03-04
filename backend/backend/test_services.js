const strapi = require("@strapi/strapi");
const fs = require("fs");

async function test() {
  const app = await strapi().load();
  try {
    const services = Object.keys(app.services);
    const emailService = app.service("api::email.email-service");
    const result = {
      services,
      hasEmailService: !!emailService,
      methods: emailService ? Object.keys(emailService) : [],
    };
    fs.writeFileSync("test_services.json", JSON.stringify(result, null, 2));
    console.log("Done");
  } catch (err) {
    fs.writeFileSync("test_error.txt", err.stack);
  } finally {
    process.exit(0);
  }
}

test();
