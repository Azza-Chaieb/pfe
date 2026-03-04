import { emailLayout } from "./layout";

export const subscriptionRejectedEmail = (
  userName: string,
  planName: string,
  reason: string,
  frontendUrl: string = "http://localhost:3000",
) => {
  const content = `
    <div class="header" style="background: #fee2e2;">
      <h1 style="color: #991b1b;">❌ Demande Refusée</h1>
    </div>
    <div class="content">
      <h2 style="color: #991b1b; margin-top: 0;">Bonjour ${userName},</h2>
      <p style="font-size: 16px;">Nous avons examiné votre demande d'abonnement au plan <b>${planName}</b>.</p>
      
      <div style="background: #fef2f2; border: 2px solid #ef4444; padding: 25px; border-radius: 12px; margin: 30px 0;">
        <h3 style="margin-top: 0; color: #991b1b;">📋 Motif du refus</h3>
        <p>${reason}</p>
      </div>
      
      <p>Si vous pensez qu'il s'agit d'une erreur, vous pouvez soumettre une nouvelle demande ou contacter notre support.</p>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${frontendUrl}/contact" style="background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Contacter le support</a>
      </div>
    </div>
  `;

  return emailLayout(
    content,
    `Concernant votre demande d'abonnement ${planName}`,
  );
};

export default subscriptionRejectedEmail;
