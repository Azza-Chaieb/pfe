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
      // Read credentials ONLY from environment variables — never hardcode these
      const adminEmail = process.env.ADMIN_SEED_EMAIL;
      const adminPassword = process.env.ADMIN_SEED_PASSWORD;

      if (!adminEmail || !adminPassword) {
        console.error(
          "❌ [BOOTSTRAP] ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD is not defined in .env. Skipping admin user seeding.",
        );
        return;
      }

      const user = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: { email: adminEmail },
        });

      if (!user) {
        // ... creation logic ...
        await strapi.plugin("users-permissions").service("user").add({
          username: "admin",
          email: adminEmail,
          password: adminPassword,
          role: role.id,
          confirmed: true,
          provider: "local",
        });
        console.log(`✅ Seeded admin user: ${adminEmail}`);
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

      // Permissions for Authenticated users only (requires login)
      const authenticatedActions = [
        "plugin::upload.content-api.upload",
        "plugin::upload.content-api.find",
        "plugin::upload.content-api.findOne",
        "api::model.model.find",
        "api::model.model.findOne",
        "api::model.model.delete",
        "api::coworking-space.coworking-space.find",
        "api::coworking-space.coworking-space.findOne",
        "api::coworking-space.coworking-space.upload3DModel",
        "api::payment.payment.find",
        "api::payment.payment.findOne",
        "api::payment.payment.create",
        "api::payment.payment.confirm",
        "api::booking.booking.find",
        "api::booking.booking.findOne",
        "api::booking.booking.create",
        "api::booking.booking.update",
      ];

      // Permissions for Public (non-logged in) — read-only, no sensitive actions
      const publicActions = [
        "api::coworking-space.coworking-space.find",
        "api::coworking-space.coworking-space.findOne",
        "api::space.space.find",
        "api::space.space.findOne",
      ];

      const allRoles = await strapi
        .query("plugin::users-permissions.role")
        .findMany();

      console.log("👥 Found roles in DB:");
      allRoles.forEach((r) =>
        console.log(`  - Role: ${r.name} (Type: ${r.type}, ID: ${r.id})`),
      );

      const grantPermissions = async (role: any, actions: string[]) => {
        console.log(
          `🔍 [BOOTSTRAP] Syncing permissions for role: ${role.name} (Type: ${role.type}, ID: ${role.id})`,
        );
        for (const action of actions) {
          const permission = await strapi
            .query("plugin::users-permissions.permission")
            .findOne({
              where: { action, role: role.id },
            });

          if (!permission) {
            await strapi.query("plugin::users-permissions.permission").create({
              data: { action, role: role.id, enabled: true },
            });
            console.log(
              `✅ [BOOTSTRAP] GRANTED & ENABLED: "${action}" to ${role.name}`,
            );
          } else if (!permission.enabled) {
            await strapi.query("plugin::users-permissions.permission").update({
              where: { id: permission.id },
              data: { enabled: true },
            });
            console.log(
              `✅ [BOOTSTRAP] FORCED ENABLED: "${action}" for ${role.name}`,
            );
          } else {
            console.log(
              `ℹ️ [BOOTSTRAP] OK: "${action}" is already enabled for ${role.name}`,
            );
          }
        }
      };

      for (const r of allRoles) {
        if (r.type === "public") {
          await grantPermissions(r, publicActions);
        } else if (r.type === "authenticated") {
          await grantPermissions(r, authenticatedActions);
        }
      }
      console.log("🚀 [BOOTSTRAP] Permissions synchronization complete.");

      // ─── Seed Subscription Plans (TÂCHE-056) ───────────────────────────────
      try {
        const SUBSCRIPTION_PLANS = [
          {
            name: "Basique",
            description: "Idéal pour les freelances et indépendants.",
            price: 49,
            duration_days: 30,
            type: "basic",
            max_credits: 5,
            features: [
              "5 réservations/mois",
              "10 heures de salle de réunion",
              "Accès open-space en semaine",
              "WiFi haut débit",
              "Café et thé inclus",
              "Support par email",
            ],
            publishedAt: new Date().toISOString(),
          },
          {
            name: "Premium",
            description:
              "Le meilleur rapport qualité/prix pour les professionnels.",
            price: 99,
            duration_days: 30,
            type: "premium",
            max_credits: 20,
            features: [
              "20 réservations/mois",
              "50 heures de salle de réunion",
              "Accès open-space 7j/7",
              "Bureau semi-privatif",
              "Impression 100 pages/mois",
              "Casier personnel",
              "Support prioritaire",
            ],
            publishedAt: new Date().toISOString(),
          },
          {
            name: "Entreprise",
            description: "Pour les équipes et entreprises exigeantes.",
            price: 199,
            duration_days: 30,
            type: "enterprise",
            max_credits: 9999,
            features: [
              "Réservations illimitées",
              "Accès 24h/7j à tous les espaces",
              "Bureau privatif dédié",
              "Salles de réunion illimitées",
              "Impression illimitée",
              "Domiciliation commerciale",
              "Gestionnaire de compte dédié",
            ],
            publishedAt: new Date().toISOString(),
          },
        ];

        console.log("💳 [BOOTSTRAP] Seeding subscription plans...");
        for (const plan of SUBSCRIPTION_PLANS) {
          const existing = await strapi.entityService.findMany(
            "api::subscription-plan.subscription-plan" as any,
            { filters: { name: plan.name } } as any,
          );

          if (!existing || (existing as any[]).length === 0) {
            await strapi.entityService.create(
              "api::subscription-plan.subscription-plan" as any,
              { data: plan } as any,
            );
            console.log(`✅ [BOOTSTRAP] Created plan: ${plan.name}`);
          } else {
            console.log(`ℹ️ [BOOTSTRAP] Plan already exists: ${plan.name}`);
          }
        }

        // Auto-grant subscription-plan read permissions to Public + Authenticated
        const subscriptionActions = [
          "api::subscription-plan.subscription-plan.find",
          "api::subscription-plan.subscription-plan.findOne",
          "api::user-subscription.user-subscription.find",
          "api::user-subscription.user-subscription.findOne",
          "api::user-subscription.user-subscription.create",
          "api::user-subscription.user-subscription.update",
          // Custom subscription controller actions (same API = proper permission mapping)
          "api::subscription.subscription.getPlans",
          "api::subscription.subscription.getMySubscription",
          "api::subscription.subscription.subscribe",
          "api::subscription.subscription.upgrade",
          "api::subscription.subscription.cancelSubscription",
          "api::subscription.subscription.renew",
        ];

        const allRoles2 = await strapi
          .query("plugin::users-permissions.role")
          .findMany();

        for (const r of allRoles2) {
          const actionsForRole =
            r.type === "public"
              ? subscriptionActions.slice(0, 2) // Public: find + findOne only
              : subscriptionActions; // Authenticated: all

          for (const action of actionsForRole) {
            const perm = await strapi
              .query("plugin::users-permissions.permission")
              .findOne({ where: { action, role: r.id } });

            if (!perm) {
              await strapi
                .query("plugin::users-permissions.permission")
                .create({ data: { action, role: r.id, enabled: true } });
              console.log(`✅ [BOOTSTRAP] Granted "${action}" to ${r.name}`);
            } else if (!perm.enabled) {
              await strapi
                .query("plugin::users-permissions.permission")
                .update({ where: { id: perm.id }, data: { enabled: true } });
              console.log(`✅ [BOOTSTRAP] Enabled "${action}" for ${r.name}`);
            }
          }
        }
        console.log("💳 [BOOTSTRAP] Subscription plans seeding complete.");
      } catch (planErr) {
        console.warn(
          "⚠️ [BOOTSTRAP] Failed to seed subscription plans:",
          (planErr as Error).message,
        );
      }
      // ───────────────────────────────────────────────────────────────────────
    } catch (error) {
      console.error("❌ Failed during bootstrap:", error);
    }
  },
};
