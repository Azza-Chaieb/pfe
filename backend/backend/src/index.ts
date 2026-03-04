import type { Core } from "@strapi/strapi";
import path from "path";
import crypto from "crypto";

console.log("🚀 [GLOBAL] src/index.ts LOADED");

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    console.log("🔌 [REGISTER] index.ts running");

    if (typeof process !== "undefined" && process.env) {
      const tmp = `${process.cwd()}/.tmp/uploads`;
      process.env.TMP = tmp;
      process.env.TEMP = tmp;
    }

    try {
      const authController = strapi
        .plugin("users-permissions")
        .controller("auth");
      const originalRegister = authController.register;
      const axios = require("axios");

      // Override forgotPassword
      authController.forgotPassword = async (ctx: any) => {
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

          if (!user || user.blocked) return ctx.send({ ok: true });

          const resetPasswordToken = crypto.randomBytes(64).toString("hex");
          await strapi.query("plugin::users-permissions.user").update({
            where: { id: user.id },
            data: { resetPasswordToken },
          });

          let passwordResetEmail;
          try {
            const templatePath = path.resolve(
              process.cwd(),
              "dist/src/api/email/templates/password-reset.js",
            );
            passwordResetEmail = require(templatePath).passwordResetEmail;
          } catch (e) {
            try {
              passwordResetEmail =
                require("./api/email/templates/password-reset").passwordResetEmail;
            } catch (e2) { }
          }

          if (passwordResetEmail) {
            const htmlContent = passwordResetEmail(
              user.fullname || user.username,
              resetPasswordToken,
            );
            const fromAddress = process.env.SMTP_FROM || "support@sunspace.com";
            await strapi.plugin("email").service("email").send({
              to: user.email,
              from: fromAddress,
              subject: "🔐 Réinitialisation de votre mot de passe Sunspace",
              html: htmlContent,
            });
          }

          return ctx.send({ ok: true });
        } catch (error) {
          return ctx.internalServerError(`Override error: ${error.message}`);
        }
      };

      // Override register
      authController.register = async (ctx: any, next: any) => {
        const captchaToken =
          ctx.get("x-captcha-token") || ctx.request.body.captchaToken;
        if (!captchaToken)
          return ctx.badRequest("Le reCAPTCHA est obligatoire.");

        try {
          const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captchaToken}`,
          );
          if (!response.data.success)
            return ctx.badRequest("Validation reCAPTCHA échouée.");

          const existingPhone = await strapi
            .query("plugin::users-permissions.user")
            .findOne({
              where: { phone: ctx.request.body.phone },
            });
          if (existingPhone)
            return ctx.badRequest(
              "Ce numéro de téléphone est déjà associé à un compte.",
            );

          const otpCode = Math.floor(
            100000 + Math.random() * 900000,
          ).toString();
          await originalRegister(ctx, next);

          if (ctx.status === 200 || ctx.status === 201) {
            const user = ctx.body.user;
            const registrationData = ctx.request.body;
            const userType = registrationData.user_type;

            await strapi.query("plugin::users-permissions.user").update({
              where: { id: user.id },
              data: {
                confirmed: false,
                otp_code: otpCode,
                user_type: userType,
              },
            });

            try {
              let profileUid = "";
              let profileData: any = { user: user.id, publishedAt: new Date() };
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

              if (profileUid)
                await (strapi as any)
                  .documents(profileUid)
                  .create({ data: profileData });
            } catch (pErr) { }

            try {
              const emailService = strapi.service("api::email.email-service");
              if ((emailService as any)?.sendOTPEmail) {
                await (emailService as any).sendOTPEmail(
                  user.email,
                  user.fullname || user.username,
                  otpCode,
                );
              } else {
                await strapi
                  .plugin("email")
                  .service("email")
                  .send({
                    to: user.email,
                    from: process.env.SMTP_FROM || "noreply@sunspace.com",
                    subject: "🗝️ Votre code de vérification Sunspace",
                    html: `<h3>Code: ${otpCode}</h3>`,
                  });
              }
            } catch (eErr) { }

            ctx.body = {
              success: true,
              message: "Registration successful. Please verify your email.",
              email: user.email,
              requiresVerification: true,
            };
          }
        } catch (err: any) {
          if (ctx.status >= 400 && ctx.status < 500) return;
          return ctx.internalServerError(`Erreur: ${err.message}`);
        }
      };
      console.log("✅ [REGISTER] Overrides registered");
    } catch (err) {
      console.error("❌ [REGISTER] Setup failed:", err.message);
    }
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    console.log("🚀 [BOOTSTRAP] index.ts running");

    try {
      // 1. Admin Seed
      const adminEmail = process.env.ADMIN_SEED_EMAIL;
      if (adminEmail) {
        const user = await strapi
          .query("plugin::users-permissions.user")
          .findOne({ where: { email: adminEmail } });
        if (!user) {
          const role = await strapi
            .query("plugin::users-permissions.role")
            .findOne({ where: { type: "authenticated" } });
          if (role) {
            await strapi
              .plugin("users-permissions")
              .service("user")
              .add({
                username: "admin",
                email: adminEmail,
                password: process.env.ADMIN_SEED_PASSWORD || "Admin123!",
                role: role.id,
                confirmed: true,
                provider: "local",
              });
            console.log(`✅ Seeded admin: ${adminEmail}`);
          }
        }
      }

      // 2. Definitive Spaces Config
      const everyoneRoles = [
        "student",
        "trainer",
        "professional",
        "association",
      ];
      const specializedRoles = ["trainer", "professional", "association"]; // Classrooms
      const restrictedRoles = ["professional", "association"]; // Meeting rooms
      const studentOnly = ["student"]; // Garden + outer left row

      const roomDefs: Array<{
        id: string;
        role: string[];
        type: string;
        name: string;
        capacity?: number;
      }> = [
          // BLUE: Everyone (13 spots)
          ...(["260", "262", "264", "266", "268", "270"] as const).map((id) => ({
            id,
            role: everyoneRoles,
            type: "hot-desk",
            name: `Blue Desk Chair ${id}`,
          })),
          ...(["706", "712", "720"] as const).map((id) => ({
            id,
            role: everyoneRoles,
            type: "hot-desk",
            name: `Blue Inner Row Chair ${id}`,
          })),
          ...(["10", "716"] as const).map((id) => ({
            id,
            role: everyoneRoles,
            type: "hot-desk",
            name: `Blue Round Table Chair ${id}`,
          })),
          ...(["738", "739"] as const).map((id) => ({
            id,
            role: everyoneRoles,
            type: "hot-desk",
            name: `Blue Center Chair ${id}`,
          })),

          // YELLOW: Students Only
          // Each chair group has 2-3 SVG layers (fill, overlay, outline).
          // Seeding ALL of them ensures exact match works on any click layer.
          // HB: 700(fill),701(overlay) | HC: 702(fill),703(overlay)
          // HE: 707(fill),708(overlay),709(outline) | HG: 713(fill),714(overlay),715(outline)
          ...(
            [
              "700",
              "701",
              "702",
              "703",
              "707",
              "708",
              "709",
              "713",
              "714",
              "715",
            ] as const
          ).map((id) => ({
            id,
            role: studentOnly,
            type: "hot-desk" as const,
            name: `Yellow Chair ${id}`,
          })),
          ...(
            [
              "745",
              "746",
              "747",
              "748",
              "773",
              "774",
              "775",
              "776",
              "801",
              "802",
              "803",
              "804",
              "829",
              "830",
              "831",
              "832",
            ] as const
          ).map((id) => ({
            id,
            role: studentOnly,
            type: "hot-desk",
            name: `Garden Chair ${id}`,
          })),

          // PINK: 4 Classrooms — Trainer, Professional, Association
          ...(["1", "2", "3", "4"] as const).map((id) => ({
            id: `salle_${id}`,
            role: specializedRoles,
            type: "event-space",
            name: `Classroom ${id}`,
            capacity: 20,
          })),

          // VIOLET: 2 Meeting Rooms — Professional and Association only
          {
            id: "4_remainder",
            role: restrictedRoles,
            type: "meeting-room",
            name: "Meeting Room 1",
            capacity: 10,
          },
          {
            id: "5",
            role: restrictedRoles,
            type: "meeting-room",
            name: "Meeting Room 2",
            capacity: 10,
          },

          // RESTRICTED CENTER DESKS
          ...(["721", "722", "723", "735", "736", "737"] as const).map((id) => ({
            id,
            role: restrictedRoles,
            type: "hot-desk",
            name: `Restricted Desk ${id}`,
          })),

          // ORANGE: Blocked (inaccessible service areas)
          ...(
            [
              "salle_5",
              "salle_6",
              "salle_7",
              "15",
              "16",
              "18",
              "160",
              "1217",
            ] as const
          ).map((id) => ({
            id,
            role: [] as string[],
            type: "hot-desk",
            name: `Reserved Area ${id}`,
          })),
        ];

      // Cleanup all existing spaces
      const existingSpaces = await (strapi as any)
        .documents("api::space.space")
        .findMany({ limit: -1 });
      console.log(`🧹 Cleaning ${existingSpaces.length} existing spaces...`);
      for (const s of existingSpaces) {
        await (strapi as any)
          .documents("api::space.space")
          .delete({ documentId: s.documentId });
      }

      // Find Coworking Space 7
      const allCs = await (strapi as any)
        .documents("api::coworking-space.coworking-space")
        .findMany({ limit: -1 });
      console.log(
        `🔍 All Coworking Spaces:`,
        allCs.map(
          (c: any) => `ID=${c.id} docID=${c.documentId} name=${c.name}`,
        ),
      );
      const coworker = allCs.find((c: any) => c.id === 7) || allCs[0]; // fallback to first if no ID 7

      if (!coworker) {
        console.error("❌ No Coworking Space found at all! Cannot seed.");
      } else {
        console.log(
          `✅ Using Coworking Space: ID=${coworker.id}, docID=${coworker.documentId}, name=${coworker.name}`,
        );
      }

      const csDocId = coworker?.documentId;
      let seeded = 0,
        failed = 0;

      for (const def of roomDefs) {
        try {
          await (strapi as any).documents("api::space.space").create({
            data: {
              name: def.name,
              mesh_name: `bureau_${def.id}`,
              type: def.type,
              capacity: def.capacity ?? 1,
              accessible_by: def.role,
              // Strapi 5 relation: use { connect: [{ documentId }] }
              coworking_space: csDocId
                ? { connect: [{ documentId: csDocId }] }
                : undefined,
            },
            status: "published",
          });
          seeded++;
        } catch (e: any) {
          console.error(`❌ Failed to seed "${def.name}":`, e?.message || e);
          failed++;
        }
      }

      console.log(`✅ Seeding done. Seeded: ${seeded}, Failed: ${failed}`);

      // Verify linkage
      const verifySpaces = await (strapi as any)
        .documents("api::space.space")
        .findMany({ limit: -1, populate: ["coworking_space"] });
      const linked = verifySpaces.filter((s: any) => s.coworking_space).length;
      // 3. Seed Professional Subscription Plans
      console.log("💎 Seeding Professional Subscription Plans...");
      const plansToSeed = [
        { name: "Étudiant Basique", description: "Accès standard aux espaces d'étude.", price: 15, type: "basic", target_role: "student", features: ["WiFi Illimité", "Accès zones calmes", "5 crédits impression"], max_credits: 5 },
        { name: "Étudiant Pro", description: "Accès étendu et prioritaire.", price: 30, type: "premium", target_role: "student", features: ["Accès 24/7", "Salle de réunion", "15 crédits impression"], max_credits: 15 },
        { name: "Pro Essentiel", description: "Pour les freelances et nomades.", price: 80, type: "basic", target_role: "professional", features: ["Coworking open-space", "Café illimité", "10h réunion"], max_credits: 10 },
        { name: "Pro Premium", description: "Solution bureau dédié complète.", price: 180, type: "premium", target_role: "professional", features: ["Bureau dédié", "Domiciliation entreprise", "Salles illimitées"], max_credits: 9999 },
        { name: "Association Communauté", description: "Idéal pour les réunions régulières.", price: 100, type: "basic", target_role: "association", features: ["Bureau partagé", "2 événements/mois"], max_credits: 20 },
        { name: "Association Expansion", description: "Pour les associations actives.", price: 250, type: "premium", target_role: "association", features: ["Privatisation week-end", "Événements illimités"], max_credits: 9999 },
        { name: "Formateur Solo", description: "Accès flexible aux salles.", price: 60, type: "basic", target_role: "trainer", features: ["Salles de cours", "Projecteur inclus"], max_credits: 10 },
        { name: "Formateur Expert", description: "Outils avancés et visibilité.", price: 150, type: "premium", target_role: "trainer", features: ["Salles premium", "Vidéoconférence Pro", "Étudiants illimités"], max_credits: 9999 }
      ];

      const newPlanNames = plansToSeed.map(p => p.name);

      // Cleanup: delete old plans not in new list
      const allExistingPlans = await strapi.entityService.findMany("api::subscription-plan.subscription-plan" as any, {} as any);
      for (const ep of (allExistingPlans as any[])) {
        if (!newPlanNames.includes(ep.name)) {
          console.log(`🗑️ Deleting old plan: ${ep.name}`);
          await strapi.entityService.delete("api::subscription-plan.subscription-plan" as any, ep.id);
        }
      }

      for (const pData of plansToSeed) {
        const existing = await strapi.entityService.findMany("api::subscription-plan.subscription-plan" as any, {
          filters: { name: pData.name }
        } as any);

        if ((existing as any[]).length > 0) {
          await strapi.entityService.update("api::subscription-plan.subscription-plan" as any, (existing as any[])[0].id, {
            data: pData
          } as any);
        } else {
          await strapi.entityService.create("api::subscription-plan.subscription-plan" as any, {
            data: { ...pData, duration_days: 30, publishedAt: new Date() }
          } as any);
        }
      }
      console.log("✅ [BOOTSTRAP] Subscription plans seeded and cleaned");

    } catch (error) {
      console.error("❌ Bootstrap error:", error);
    }
  },
};
