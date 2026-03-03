import { emailLayout } from "./layout";

interface SubscriptionDetails {
  planName: string;
}

export const subscriptionCancellationEmail = (
  userName: string,
  subscription: SubscriptionDetails,
  reason: string = "Non spécifié",
) => {
  const content = `
    <div class="header" style="background: #fee2e2;">
      <h1 style="color: #991b1b;">❌ Abonnement Annulé</h1>
    </div>
    <div class="content">
      <h2 style="color: #991b1b; margin-top: 0;">Bonjour ${userName},</h2>
      <p style="font-size: 16px;">Votre demande d'abonnement pour le plan <b>${subscription.planName}</b> a été annulée ou refusée.</p>
      
      <div style="background: #fef2f2; border: 2px solid #ef4444; padding: 25px; border-radius: 12px; margin: 30px 0;">
        <h3 style="margin-top: 0; color: #991b1b;">📋 Détails</h3>
        <p><b>Raison :</b> ${reason}</p>
        <p>Si vous avez effectué un paiement en espèces, veuillez contacter notre équipe si vous n'avez pas encore été remboursé ou pour plus d'informations.</p>
      </div>

      <p style="color: #666; font-size: 14px;">
        Vous pouvez toujours souscrire à un autre plan à tout moment dans votre espace personnel.
      </p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="mailto:contact@sunspace.com" style="background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Contacter le support</a>
      </div>
    </div>
  `;

  return emailLayout(content, `Information sur votre abonnement SunSpace`);
};

export default subscriptionCancellationEmail;
