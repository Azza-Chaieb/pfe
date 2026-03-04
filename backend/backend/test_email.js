const strapi = require("@strapi/strapi");
require("dotenv").config();

async function testEmail() {
  const app = await strapi().load();
  try {
    const emailService = app.service("api::email.email-service");
    if (!emailService) {
      console.log("Email Service not found");
      return;
    }
    console.log("Sending test email to azachaieb@gmail.com...");
    await emailService.sendSubscriptionConfirmed(
      "azachaieb@gmail.com",
      "Test User",
      "Basique",
      "2026-04-04",
    );
    console.log("Email sent successfully!");
  } catch (err) {
    console.error("Failed to send email:", err);
  } finally {
    process.exit(0);
  }
}

testEmail();
