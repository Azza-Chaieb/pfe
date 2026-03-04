import { emailLayout } from "./layout";

export const subscriptionConfirmedEmail = (
  userName: string,
  planName: string,
  expiryDate: string,
  frontendUrl: string = "http://localhost:3000",
) => {
  const content = `
    <div class="header">
      <h1>💎 Abonnement Activé !</h1>
    </div>
    <div class="content">
      <h2 style="color: #667eea; margin-top: 0;">Bonjour ${userName},</h2>
      <p style="font-size: 16px;">Félicitations ! Votre abonnement <b>${planName}</b> a été activé avec succès.</p>
      
      <div style="background: #e7f3ff; border: 2px solid #667eea; padding: 25px; border-radius: 12px; margin: 30px 0;">
        <h3 style="margin-top: 0; color: #667eea;">📋 Détails</h3>
        <p><b>Plan :</b> ${planName}</p>
        <p><b>Date d'expiration :</b> ${expiryDate}</p>
      </div>
      
      <p>Vous pouvez maintenant profiter de tous les avantages de votre plan sur Sunspace.</p>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${frontendUrl}/login" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Accéder à mon espace</a>
      </div>
    </div>
  `;

  return emailLayout(content, `Bienvenue au plan ${planName} !`);
};

export default subscriptionConfirmedEmail;
