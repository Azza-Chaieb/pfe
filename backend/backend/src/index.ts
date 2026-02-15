import type { Core } from "@strapi/strapi";

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    try {
      // Force override of the forgotPassword controller directly at startup
      const plugin = strapi.plugin("users-permissions");
      if (plugin) {
        console.log(
          "⚡️⚡️⚡️ OVERRIDING USERS-PERMISSIONS CONTROLLER FROM INDEX.TS ⚡️⚡️⚡️",
        );

        plugin.controller("auth").forgotPassword = async (ctx) => {
          console.log(
            "🔍 CUSTOM FORGOTPASSWORD CONTROLLER CALLED (FROM INDEX.TS)",
          );
          const { email } = ctx.request.body;
          console.log("📧 Email received:", email);

          if (!email) return ctx.badRequest("email.provide");

          const user = await strapi
            .query("plugin::users-permissions.user")
            .findOne({
              where: { email: email.toLowerCase() },
            });

          console.log(
            "👤 User found:",
            user ? `${user.email} (ID: ${user.id})` : "NO USER FOUND",
          );

          if (!user || user.blocked) return ctx.send({ ok: true });

          let resetPasswordToken;
          try {
            // Try to use the service first, but safe access
            const userPermissionsService = strapi
              .plugin("users-permissions")
              .service("user");
            if (
              userPermissionsService &&
              typeof userPermissionsService.createResetPasswordToken ===
              "function"
            ) {
              resetPasswordToken =
                userPermissionsService.createResetPasswordToken();
            } else if (
              userPermissionsService &&
              typeof userPermissionsService.createToken === "function"
            ) {
              resetPasswordToken = userPermissionsService.createToken();
            } else {
              // Fallback to crypto if service method not found
              const crypto = require("crypto");
              resetPasswordToken = crypto.randomBytes(64).toString("hex");
              console.log("⚠️ Generated token using crypto fallback");
            }
          } catch (err) {
            console.error("❌ Error generating token:", err);
            const crypto = require("crypto");
            resetPasswordToken = crypto.randomBytes(64).toString("hex");
          }

          console.log(
            `🔑 Reset token generated: ${resetPasswordToken.substring(0, 10)}...`,
          );

          await strapi.query("plugin::users-permissions.user").update({
            where: { id: user.id },
            data: { resetPasswordToken },
          });

          try {
            const emailService = strapi.service("api::email.email-service");
            if (emailService) {
              console.log("📤 Sending password reset email...");
              await emailService.sendPasswordResetEmail(
                user.email,
                user.fullname || user.username,
                resetPasswordToken,
              );
              strapi.log.info(
                `✅ Password reset email sent successfully to ${user.email}`,
              );
            } else {
              strapi.log.error("❌ Email service not found");
              console.error(
                "❌ Email service not found - check api::email.email-service",
              );
            }
          } catch (error) {
            console.error("❌ Failed to send password reset email:", error);
            strapi.log.error("❌ Failed to send password reset email:", error);
          }

          ctx.send({ ok: true });
        };
      }
    } catch (error) {
      console.error("❌ Failed to override controller in index.ts:", error);
    }
    // Force local temp directory to avoid EPERM on Windows system temp folder
    const path = require("path");
    const fs = require("fs");
    const tmpDir = path.join(process.cwd(), ".tmp");
    const uploadTmpDir = path.join(tmpDir, "uploads");

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
        environment: "",
        type: "plugin",
        name: "users-permissions",
      });

      const settings = await pluginStore.get({ key: "advanced" });

      // Find the 'Authenticated' role
      const role = await strapi
        .query("plugin::users-permissions.role")
        .findOne({ where: { type: "authenticated" } });

      if (!role) {
        console.error("Authenticated role not found. Cannot seed user.");
        return;
      }

      // Check if our admin user exists
      const user = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: { email: "admin@sunspacee.com" },
        });

      if (!user) {
        // ... creation logic ...
        await strapi.plugin("users-permissions").service("user").add({
          username: "admin",
          email: "admin@sunspacee.com",
          password: "Password123!",
          role: role.id,
          confirmed: true,
          provider: "local",
        });
        console.log("✅ Seeded admin user: admin@sunspacee.com / Password123!");
      } else {
        // Force confirm the user if it already exists, just in case
        await strapi.query("plugin::users-permissions.user").update({
          where: { id: user.id },
          data: {
            confirmed: true,
            blocked: false,
          },
        });
      }

      // Proactively grant upload permissions to Authenticated role
      try {
        const actionsToGrant = [
          "plugin::upload.content-api.upload",
          "plugin::upload.content-api.find",
          "plugin::upload.content-api.findOne",
          "api::model.model.find",
          "api::model.model.findOne",
          "api::model.model.delete",
          "api::coworking-space.coworking-space.find",
          "api::coworking-space.coworking-space.findOne",
          // Adding custom upload route permission just in case
          "api::coworking-space.coworking-space.upload3DModel",
        ];

        // Grant to both Authenticated and Public for testing
        const allRoles = await strapi
          .query("plugin::users-permissions.role")
          .findMany();

        console.log("👥 Found roles in DB:");
        allRoles.forEach(r => console.log(`  - Role: ${r.name} (Type: ${r.type}, ID: ${r.id})`));

        const rolesToSync = allRoles.filter(r => ["authenticated", "public", "admin"].includes(r.type || ""));

        for (const r of rolesToSync) {
          console.log(`🔍 [BOOTSTRAP] Syncing permissions for role: ${r.name} (Type: ${r.type}, ID: ${r.id})`);
          for (const action of actionsToGrant) {
            const permission = await strapi
              .query("plugin::users-permissions.permission")
              .findOne({
                where: { action, role: r.id },
              });

            if (!permission) {
              await strapi.query("plugin::users-permissions.permission").create({
                data: { action, role: r.id, enabled: true },
              });
              console.log(`✅ [BOOTSTRAP] GRANTED & ENABLED: "${action}" to ${r.name}`);
            } else if (!permission.enabled) {
              await strapi.query("plugin::users-permissions.permission").update({
                where: { id: permission.id },
                data: { enabled: true },
              });
              console.log(`✅ [BOOTSTRAP] FORCED ENABLED: "${action}" for ${r.name}`);
            } else {
              console.log(`ℹ️ [BOOTSTRAP] OK: "${action}" is already enabled for ${r.name}`);
            }
          }
        }
        console.log("🚀 [BOOTSTRAP] Permissions synchronization complete.");
      } catch (uploadErr) {
        console.warn(
          "⚠️ Failed to auto-grant upload permission:",
          uploadErr.message,
        );
      }
    } catch (error) {
      console.error("❌ Failed during bootstrap:", error);
    }
  },
};
