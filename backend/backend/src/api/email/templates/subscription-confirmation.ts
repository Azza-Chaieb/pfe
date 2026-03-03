import { emailLayout } from "./layout";

interface SubscriptionDetails {
  planName: string;
  startDate: string;
  endDate: string;
  price: string;
}

export const subscriptionConfirmationEmail = (
  userName: string,
  subscription: SubscriptionDetails,
  frontendUrl: string = "http://localhost:5173",
) => {
  const content = `
    <div class="header">
      <h1>💎 Abonnement Activé !</h1>
    </div>
    <div class="content">
      <h2 style="color: #667eea; margin-top: 0;">Bonjour ${userName},</h2>
      <p style="font-size: 16px;">Votre abonnement <b>${subscription.planName}</b> a été activé avec succès ! 🎉</p>
      
      <div style="background: #e7f3ff; border: 2px solid #667eea; padding: 25px; border-radius: 12px; margin: 30px 0;">
        <h3 style="margin-top: 0; color: #667eea;">📋 Détails de l'abonnement</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">💎 Plan :</td>
            <td style="padding: 10px 0; color: #333;">${subscription.planName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">📅 Début :</td>
            <td style="padding: 10px 0; color: #333;">${subscription.startDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">⏰ Fin :</td>
            <td style="padding: 10px 0; color: #333;">${subscription.endDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">💰 Prix :</td>
            <td style="padding: 10px 0; color: #333;">${subscription.price}</td>
          </tr>
        </table>
      </div>
      
      <p style="margin-top: 30px;">Vous pouvez maintenant profiter de tous les avantages de votre plan sur SunSpace.</p>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${frontendUrl}/profile" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Accéder à mon tableau de bord</a>
      </div>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 13px;">
        📧 Des questions ? Répondez à cet email pour contacter notre équipe.
      </p>
    </div>
  `;

  return emailLayout(
    content,
    `Félicitations ! Votre abonnement SunSpace est actif`,
  );
};

export default subscriptionConfirmationEmail;
