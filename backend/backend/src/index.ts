import type { Core } from "@strapi/strapi";
import path from "path";
import crypto from "crypto";

console.log("🚀 [GLOBAL] src/index.ts LOADED");

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    console.log("🔌 [REGISTER] index.ts running");
    console.log("📂 [REGISTER] CWD:", process.cwd());
    console.log("📂 [REGISTER] DirName:", __dirname);

    if (typeof process !== "undefined" && process.env) {
      const tmp = `${process.cwd()}/.tmp/uploads`;
      process.env.TMP = tmp;
      process.env.TEMP = tmp;
    }

    try {
      const authController = strapi
        .plugin("users-permissions")
        .controller("auth");
      const originalForgotPassword = authController.forgotPassword;
      const originalRegister = authController.register;
      const axios = require("axios");

      // Override forgotPassword
      authController.forgotPassword = async (ctx: any, next: any) => {
        console.log(
          "📨 [OVERRIDE] forgotPassword called for:",
          ctx.request.body.email,
        );
        const { email } = ctx.request.body;
        if (!email) return ctx.badRequest("email.provide");

        try {
          const user = await strapi
            .query("plugin::users-permissions.user")
            .findOne({
              where: { email: email.toLowerCase() },
            });

          if (!user || user.blocked) {
            console.log("ℹ️ [OVERRIDE] User not found or blocked.");
            return ctx.send({ ok: true });
          }

          const resetPasswordToken = crypto.randomBytes(64).toString("hex");
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
            const templatePath = path.resolve(
              process.cwd(),
              "dist/src/api/email/templates/password-reset.js",
            );
            console.log("📁 [OVERRIDE] Loading template from:", templatePath);
            const templateModule = require(templatePath);
            passwordResetEmail = templateModule.passwordResetEmail;
          } catch (pathErr) {
            console.warn(
              "⚠️ [OVERRIDE] Absolute path failed, trying relative...",
            );
            const templateModule = require("./api/email/templates/password-reset");
            passwordResetEmail = templateModule.passwordResetEmail;
          }

          if (!passwordResetEmail) {
            throw new Error(
              "passwordResetEmail function not found in template module",
            );
          }

          const htmlContent = passwordResetEmail(
            user.fullname || user.username,
            resetPasswordToken,
          );

          // 2. Resolve From Address
          let fromAddress;
          try {
            const emailSettings: any = await strapi
              .store({
                type: "plugin",
                name: "users-permissions",
                key: "email",
              })
              .get();
            fromAddress =
              emailSettings?.reset_password?.options?.from?.email ||
              process.env.SMTP_FROM ||
              "support@sunspace.com";
          } catch (e) {
            fromAddress = process.env.SMTP_FROM || "support@sunspace.com";
          }

          console.log(
            `📡 [OVERRIDE] Sending custom email to ${user.email} from ${fromAddress}`,
          );

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
        console.log("📝 [OTP OVERRIDE] Register called");
        const captchaToken =
          ctx.get("x-captcha-token") || ctx.request.body.captchaToken;
        if (!captchaToken)
          return ctx.badRequest("Le reCAPTCHA est obligatoire.");

        try {
          // 1. Verify reCAPTCHA
          const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captchaToken}`,
          );
          if (!response.data.success)
            return ctx.badRequest("Validation reCAPTCHA échouée.");

          // 2. Check if phone already exists
          const existingPhone = await strapi
            .query("plugin::users-permissions.user")
            .findOne({
              where: { phone: ctx.request.body.phone },
            });

          if (existingPhone) {
            return ctx.badRequest(
              "Ce numéro de téléphone est déjà associé à un compte.",
            );
          }

          // 3. Generate 6-digit OTP
          const otpCode = Math.floor(
            100000 + Math.random() * 900000,
          ).toString();

          // 3. Call original register
          // We don't add confirmed/otp_code to body to avoid "Invalid parameters" error
          await originalRegister(ctx, next);

          // If originalRegister succeeded, it sets ctx.body
          if (ctx.status === 200 || ctx.status === 201) {
            const user = ctx.body.user;
            const registrationData = ctx.request.body;

            const userType = registrationData.user_type;

            // 4. Update user with OTP, Unconfirm and user_type (since we couldn't do it in body)
            await strapi.query("plugin::users-permissions.user").update({
              where: { id: user.id },
              data: { confirmed: false, otp_code: otpCode, user_type: userType },
            });

            console.log(
              `✅ [OTP OVERRIDE] User created and marked unconfirmed: ${user.email}. Sending OTP: ${otpCode}`,
            );

            // 5. Link/Create Profile (since confirmation is pending, we do it here)
            try {
              let profileUid = "";
              let profileData: any = {
                user: user.id,
                publishedAt: new Date(), // Strapi 5 usually requires this for drafted content if we want it visible
              };

              if (userType === "student") {
                profileUid = "api::etudiant-profil.etudiant-profil";
                profileData = {
                  ...profileData,
                  registration_date: registrationData.registration_date,
                  level: registrationData.level,
                  address: registrationData.address,
                  birth_date: registrationData.birth_date,
                };
              } else if (userType === "trainer") {
                profileUid = "api::formateur-profil.formateur-profil";
                profileData = {
                  ...profileData,
                  specialty: registrationData.specialty,
                  phone: registrationData.phone,
                };
              } else if (userType === "association") {
                profileUid = "api::association-profil.association-profil";
                profileData = {
                  ...profileData,
                  name: registrationData.org_name,
                  phone: registrationData.phone,
                };
              } else if (userType === "professional") {
                profileUid = "api::professionnel.professionnel";
                profileData = {
                  ...profileData,
                  company: registrationData.company,
                };
              }

              if (profileUid) {
                console.log(
                  `🏗️ [OTP OVERRIDE] Creating profile for ${userType}...`,
                );
                // @ts-ignore
                await strapi
                  .documents(profileUid as any)
                  .create({ data: profileData });
                console.log("✅ [OTP OVERRIDE] Profile created!");
              }
            } catch (profileErr: any) {
              console.error(
                "❌ [OTP OVERRIDE] Profile creation failed:",
                profileErr.message,
              );
            }

            // 6. Send OTP Email
            try {
              const emailService = strapi.service("api::email.email-service");
              // We'll create this method or use a generic one
              // @ts-ignore
              if (emailService && emailService.sendOTPEmail) {
                // @ts-ignore
                await emailService.sendOTPEmail(
                  user.email,
                  user.fullname || user.username,
                  otpCode,
                );
              } else {
                // Fallback direct send if service method doesn't exist yet
                await strapi
                  .plugin("email")
                  .service("email")
                  .send({
                    to: user.email,
                    from: process.env.SMTP_FROM || "noreply@sunspace.com",
                    subject: "🗝️ Votre code de vérification Sunspace",
                    html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                      <h2 style="color: #4F46E5; text-align: center;">Bienvenue chez Sunspace !</h2>
                      <p>Bonjour <strong>${user.fullname || user.username}</strong>,</p>
                      <p>Pour finaliser votre inscription, veuillez utiliser le code de validation suivant :</p>
                      <div style="background: #F3F4F6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827; border-radius: 8px; margin: 20px 0;">
                        ${otpCode}
                      </div>
                      <p>Ce code est valable pendant 10 minutes.</p>
                      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                      <p style="font-size: 12px; color: #6B7280; text-align: center;">Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
                    </div>
                  `,
                  });
              }
              console.log("📨 [OTP OVERRIDE] OTP email sent successfully");
            } catch (emailErr) {
              console.error(
                "❌ [OTP OVERRIDE] Email failed:",
                emailErr.message,
              );
            }

            // 6. Modify response to hide JWT and signal email verification requirement
            // We want the user to verify BEFORE they get a session
            ctx.body = {
              success: true,
              message: "Registration successful. Please verify your email.",
              email: user.email,
              requiresVerification: true,
            };
          }
        } catch (err: any) {
          console.error("🔥 [OTP OVERRIDE] Error:", err.message);

          // If the original register or another part already set an error status (like 400 or 409),
          // we should let that response go through instead of a generic 500.
          if (ctx.status >= 400 && ctx.status < 500) {
            return;
          }

          return ctx.internalServerError(
            `Erreur lors de l'inscription: ${err.message}`,
          );
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
        const user = await strapi
          .query("plugin::users-permissions.user")
          .findOne({ where: { email: adminEmail } });
        if (!user) {
          const role = await strapi
            .query("plugin::users-permissions.role")
            .findOne({ where: { type: "authenticated" } });
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

      // -- Spaces Seeding --
      const existingSpaces = await strapi.query("api::space.space").count();
      if (existingSpaces === 0) {
        console.log("🌱 No spaces found. Seeding functional zones...");
        const allSpaces = [
          { name: "Classroom 1", type: "event-space", capacity: 16, accessible_by: ["formateur", "professionnel", "association"] },
          { name: "Classroom 2", type: "event-space", capacity: 16, accessible_by: ["formateur", "professionnel", "association"] },
          { name: "Classroom 3", type: "event-space", capacity: 16, accessible_by: ["formateur", "professionnel", "association"] },
          { name: "Classroom 4", type: "event-space", capacity: 16, accessible_by: ["formateur", "professionnel", "association"] },
          { name: "Meeting Room 1", type: "meeting-room", capacity: 6, accessible_by: ["professionnel", "association"] },
          { name: "Meeting Room 2", type: "meeting-room", capacity: 6, accessible_by: ["professionnel", "association"] },
          { name: "Garden Revision Chair 1", type: "hot-desk", capacity: 1, accessible_by: ["etudiant"] },
          { name: "Garden Revision Chair 2", type: "hot-desk", capacity: 1, accessible_by: ["etudiant"] },
          { name: "Garden Revision Chair 3", type: "hot-desk", capacity: 1, accessible_by: ["etudiant"] },
          { name: "Garden Revision Chair 4", type: "hot-desk", capacity: 1, accessible_by: ["etudiant"] },
          { name: "Entrance Stairs Area", type: "hot-desk", capacity: 0, accessible_by: [] },
          { name: "Restrooms", type: "hot-desk", capacity: 0, accessible_by: [] },
          { name: "Kitchen", type: "hot-desk", capacity: 0, accessible_by: [] },
          { name: "Corridor", type: "hot-desk", capacity: 0, accessible_by: [] },
          { name: "Guard Room", type: "hot-desk", capacity: 0, accessible_by: [] },
          { name: "Individual Workspace 1", type: "hot-desk", capacity: 1, accessible_by: ["etudiant", "formateur", "professionnel", "association"] },
          { name: "Individual Workspace 2", type: "hot-desk", capacity: 1, accessible_by: ["etudiant", "formateur", "professionnel", "association"] },
          { name: "Individual Workspace 3", type: "hot-desk", capacity: 1, accessible_by: ["etudiant", "formateur", "professionnel", "association"] },
          { name: "Individual Workspace 4", type: "hot-desk", capacity: 1, accessible_by: ["etudiant", "formateur", "professionnel", "association"] },
          { name: "Individual Workspace 5", type: "hot-desk", capacity: 1, accessible_by: ["etudiant", "formateur", "professionnel", "association"] },
          { name: "Individual Workspace 6", type: "hot-desk", capacity: 1, accessible_by: ["etudiant", "formateur", "professionnel", "association"] },
          { name: "Individual Workspace 7", type: "hot-desk", capacity: 1, accessible_by: ["etudiant", "formateur", "professionnel", "association"] },
          { name: "Individual Workspace 8", type: "hot-desk", capacity: 1, accessible_by: ["etudiant", "formateur", "professionnel", "association"] },
        ];

        for (const space of allSpaces) {
          try {
            await strapi.query("api::space.space").create({
              data: {
                ...space,
                publishedAt: new Date()
              }
            });
            console.log(`✅ Seeded space: ${space.name}`);
          } catch (err: any) {
            console.error(`❌ Failed to seed space ${space.name}:`, err.message);
          }
        }
        console.log("🌱 Finished seeding functional zones.");
      } else {
        console.log(`ℹ️ [BOOTSTRAP] ${existingSpaces} spaces already exist. Skipping seed.`);
      }

    } catch (error) {
      console.error("❌ Bootstrap error:", error);
    }
  },
};
