import { emailLayout } from "./layout";

export const subscriptionRequestEmail = (
  userName: string,
  planName: string,
  paymentDeadline: string | null = null,
  frontendUrl: string = "http://localhost:3000",
) => {
  const deadlineStr = paymentDeadline
    ? new Date(paymentDeadline).toLocaleString("fr-FR", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "2 heures";

  const content = `
    <div class="header">
      <h1>⌛ Demande Reçue</h1>
    </div>
    <div class="content">
      <h2 style="color: #667eea; margin-top: 0;">Bonjour ${userName},</h2>
      <p style="font-size: 16px;">Nous avons bien reçu votre demande d'abonnement au plan <b>${planName}</b>.</p>
      
      <div style="background: #f8f9ff; border: 2px solid #667eea; padding: 25px; border-radius: 12px; margin: 30px 0;">
        <h3 style="margin-top: 0; color: #667eea;">📋 Prochaine étape</h3>
        <p>Si vous avez choisi le paiement en espèces, veuillez vous présenter à l'accueil avec votre référence de paiement <b>avant le ${deadlineStr}</b>.</p>
        <p style="color: #e53e3e; font-weight: bold;">⚠️ Passé ce délai, votre demande sera automatiquement annulée.</p>
        <p>Une fois le paiement validé, votre abonnement sera activé immédiatement.</p>
      </div>
      
      <p>Vous recevrez un email de confirmation dès que votre abonnement sera actif.</p>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${frontendUrl}/login" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Voir mon profil</a>
      </div>
    </div>
  `;

  return emailLayout(
    content,
    `Votre demande d'abonnement ${planName} est en cours de traitement`,
  );
};

export default subscriptionRequestEmail;
