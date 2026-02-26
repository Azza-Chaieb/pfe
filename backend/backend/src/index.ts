import type { Core } from "@strapi/strapi";
import path from "path";

console.log("🚀 [GLOBAL] src/index.ts LOADED");

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    console.log("🔌 [REGISTER] index.ts running");
    console.log("📂 [REGISTER] CWD:", process.cwd());
    console.log("📂 [REGISTER] DirName:", __dirname);

    if (typeof process !== 'undefined' && process.env) {
      const tmp = `${process.cwd()}/.tmp/uploads`;
      process.env.TMP = tmp;
      process.env.TEMP = tmp;
    }

    try {
      const authController = strapi.plugin("users-permissions").controller("auth");
      const originalForgotPassword = authController.forgotPassword;
      const originalRegister = authController.register;
      const axios = require("axios");

      // Override forgotPassword
      authController.forgotPassword = async (ctx: any, next: any) => {
        console.log("📨 [OVERRIDE] forgotPassword called for:", ctx.request.body.email);
        const { email } = ctx.request.body;
        if (!email) return ctx.badRequest("email.provide");

        try {
          const user = await strapi.query("plugin::users-permissions.user").findOne({
            where: { email: email.toLowerCase() }
          });

          if (!user || user.blocked) {
            console.log("ℹ️ [OVERRIDE] User not found or blocked.");
            return ctx.send({ ok: true });
          }

          const resetPasswordToken = strapi.service("plugin::users-permissions.user").createToken();
          await strapi.query("plugin::users-permissions.user").update({
            where: { id: user.id },
            data: { resetPasswordToken },
          });

          console.log("🛠️ [OVERRIDE] Token generated. Loading template...");

          // 1. Robust Template Loading
          let passwordResetEmail;
          try {
            // Strapi 5 compiles to dist/src/index.js
            // Template is at dist/src/api/email/templates/password-reset.js
            const templatePath = path.resolve(process.cwd(), "dist/src/api/email/templates/password-reset.js");
            console.log("📁 [OVERRIDE] Loading template from:", templatePath);
            const templateModule = require(templatePath);
            passwordResetEmail = templateModule.passwordResetEmail;
          } catch (pathErr) {
            console.warn("⚠️ [OVERRIDE] Absolute path failed, trying relative...");
            const templateModule = require("./api/email/templates/password-reset");
            passwordResetEmail = templateModule.passwordResetEmail;
          }

          if (!passwordResetEmail) {
            throw new Error("passwordResetEmail function not found in template module");
          }

          const htmlContent = passwordResetEmail(user.fullname || user.username, resetPasswordToken);

          // 2. Resolve From Address
          let fromAddress;
          try {
            const emailSettings: any = await strapi.store({ type: "plugin", name: "users-permissions", key: "email" }).get();
            fromAddress = emailSettings?.reset_password?.options?.from?.email || process.env.SMTP_FROM || "support@sunspace.com";
          } catch (e) {
            fromAddress = process.env.SMTP_FROM || "support@sunspace.com";
          }

          console.log(`📡 [OVERRIDE] Sending custom email to ${user.email} from ${fromAddress}`);

          await strapi.plugin("email").service("email").send({
            to: user.email,
            from: fromAddress,
            subject: "🔐 Réinitialisation de votre mot de passe Sunspace",
            html: htmlContent,
          });

          console.log("✅ [OVERRIDE] Custom email sent!");
          return ctx.send({ ok: true });

        } catch (error) {
          console.error("🔥 [OVERRIDE] FAILED:", error.message);
          // Return the error to the frontend for debugging
          return ctx.internalServerError(`Override error: ${error.message}`);
        }
      };

      // Override register
      authController.register = async (ctx: any, next: any) => {
        console.log("📝 [OVERRIDE] Register called");
        const captchaToken = ctx.get("x-captcha-token") || ctx.request.body.captchaToken;
        if (!captchaToken) return ctx.badRequest("Le reCAPTCHA est obligatoire.");

        try {
          const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captchaToken}`);
          if (!response.data.success) return ctx.badRequest("Validation reCAPTCHA échouée.");
          return originalRegister(ctx, next);
        } catch (err) {
          return ctx.internalServerError("Erreur reCAPTCHA");
        }
      };

      console.log("✅ [REGISTER] Overrides registered");
    } catch (err) {
      console.error("❌ [REGISTER] Setup failed:", (err as Error).message);
    }
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    console.log("🚀 [BOOTSTRAP] index.ts running");

    try {
      const adminEmail = process.env.ADMIN_SEED_EMAIL;
      const adminPassword = process.env.ADMIN_SEED_PASSWORD;

      if (adminEmail && adminPassword) {
        const user = await strapi.query("plugin::users-permissions.user").findOne({ where: { email: adminEmail } });
        if (!user) {
          const role = await strapi.query("plugin::users-permissions.role").findOne({ where: { type: "authenticated" } });
          if (role) {
            await strapi.plugin("users-permissions").service("user").add({
              username: "admin",
              email: adminEmail,
              password: adminPassword,
              role: role.id,
              confirmed: true,
              provider: "local",
            });
            console.log(`✅ Seeded admin: ${adminEmail}`);
          }
        }
      }
    } catch (error) {
      console.error("❌ Bootstrap error:", error);
    }
  },
};
