export default {
  async verifyOtp(ctx) {
    const { email, otp } = ctx.request.body;

    if (!email || !otp) {
      return ctx.badRequest("L'email et le code sont obligatoires.");
    }

    try {
      // 1. Find the user
      const user = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: { email: email.toLowerCase() },
        });

      if (!user) {
        return ctx.notFound("Utilisateur non trouvé.");
      }

      if (user.confirmed) {
        return ctx.badRequest("Ce compte est déjà confirmé.");
      }

      // 2. Check the OTP
      if (user.otp_code !== otp) {
        return ctx.badRequest("Code de validation invalide.");
      }

      // 3. Confirm the user
      await strapi.query("plugin::users-permissions.user").update({
        where: { id: user.id },
        data: {
          confirmed: true,
          otp_code: null, // Clear the code after success
        },
      });

      // 4. Generate JWT for automatic login after verification
      const jwt = strapi.plugin("users-permissions").service("jwt").issue({
        id: user.id,
      });

      console.log(`✅ [OTP] User ${email} verified successfully`);

      return ctx.send({
        jwt,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          confirmed: true,
        },
      });
    } catch (err) {
      console.error("🔥 [OTP VERIFY] Error:", err.message);
      return ctx.internalServerError("Erreur lors de la vérification");
    }
  },

  async resendOtp(ctx) {
    const { email } = ctx.request.body;
    if (!email) return ctx.badRequest("L'email est obligatoire.");

    try {
      const user = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: { email: email.toLowerCase() },
        });

      if (!user) return ctx.notFound("Utilisateur non trouvé.");
      if (user.confirmed) return ctx.badRequest("Compte déjà confirmé.");

      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

      await strapi.query("plugin::users-permissions.user").update({
        where: { id: user.id },
        data: { otp_code: newOtp },
      });

      // Send Email
      await strapi
        .plugin("email")
        .service("email")
        .send({
          to: user.email,
          from: process.env.SMTP_FROM || "noreply@sunspace.com",
          subject: "🗝️ Nouveau code de vérification Sunspace",
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Nouveau code de validation</h2>
            <p>Votre nouveau code est :</p>
            <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold;">
              ${newOtp}
            </div>
          </div>
        `,
        });

      return ctx.send({ success: true, message: "Code renvoyé." });
    } catch (err) {
      return ctx.internalServerError("Erreur lors de l'envoi du code");
    }
  },

  async checkPhone(ctx) {
    const { phone } = ctx.request.body;
    if (!phone) return ctx.badRequest("Le numéro est obligatoire.");

    try {
      const existing = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: { phone },
        });

      return ctx.send({ exists: !!existing });
    } catch (err) {
      return ctx.internalServerError(
        "Erreur lors de la vérification du numéro",
      );
    }
  },
};
