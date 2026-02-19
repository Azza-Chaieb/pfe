import { emailLayout } from "./layout";

export const passwordResetEmail = (
  userName: string,
  resetToken: string,
  expiresIn: string = "1 heure",
) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${frontendUrl}/reset-password?code=${resetToken}`;

  const content = `
    <div class="header">
      <h1>🔐 Réinitialisation de mot de passe</h1>
    </div>
    <div class="content">
      <h2 style="color: #667eea; margin-top: 0;">Bonjour ${userName},</h2>
      <p style="font-size: 16px;">Vous avez demandé la réinitialisation de votre mot de passe.</p>
      
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 5px; margin: 25px 0;">
        <p style="margin: 0; font-weight: 600; color: #856404;">⚠️ Important :</p>
        <p style="margin: 10px 0 0 0; color: #856404;">Ce lien expire dans <strong>${expiresIn}</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      </div>

      <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button" style="background: #dc3545;">Réinitialiser mon mot de passe</a>
      </div>

      <p style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 13px; color: #666;">
        <strong>Le lien ne fonctionne pas ?</strong><br>
        Copiez et collez cette URL dans votre navigateur :<br>
        <span style="color: #667eea; word-break: break-all;">${resetUrl}</span>
      </p>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 13px;">
        🔒 <strong>Sécurité :</strong> Ne partagez jamais ce lien avec qui que ce soit.
      </p>
    </div>
  `;

  return emailLayout(content, "Réinitialisez votre mot de passe Sunspace");
};

export default passwordResetEmail;
