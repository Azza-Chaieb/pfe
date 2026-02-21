import { emailLayout } from "./layout";

interface PaymentDetails {
  paymentId: string;
  amount: string;
  date: string;
  itemDescription: string;
  userName: string;
}

export const paymentConfirmationEmail = (
  userName: string,
  payment: PaymentDetails,
  frontendUrl: string = "http://localhost:5173",
) => {
  const content = `
    <div class="header">
      <h1>💰 Paiement Confirmé !</h1>
    </div>
    <div class="content">
      <h2 style="color: #667eea; margin-top: 0;">Bonjour ${userName},</h2>
      <p style="font-size: 16px;">Nous avons bien reçu votre paiement. Merci pour votre confiance ! ✨</p>
      
      <div style="background: #fdf6ff; border: 2px solid #a855f7; padding: 25px; border-radius: 12px; margin: 30px 0;">
        <h3 style="margin-top: 0; color: #a855f7;">🧾 Détails de la transaction</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">📎 Description :</td>
            <td style="padding: 10px 0; color: #333;">${payment.itemDescription}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">💵 Montant :</td>
            <td style="padding: 10px 0; color: #333; font-size: 18px; font-weight: bold;">${payment.amount}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">📅 Date :</td>
            <td style="padding: 10px 0; color: #333;">${payment.date}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">🔢 ID Transaction :</td>
            <td style="padding: 10px 0; color: #a855f7; font-family: monospace;">${payment.paymentId}</td>
          </tr>
        </table>
      </div>

      <div style="background: #f0fdf4; padding: 20px; border-left: 4px solid #22c55e; border-radius: 5px; margin: 25px 0;">
        <p style="margin: 0; font-weight: 600; color: #15803d;">✅ Paiement sécurisé</p>
        <p style="margin-top: 5px; color: #166534; font-size: 14px;">Une facture détaillée est disponible dans votre espace client.</p>
      </div>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 13px;">
        ❓ Une question sur ce paiement ? Contactez notre support technique.
      </p>
    </div>
  `;

  return emailLayout(
    content,
    `Confirmation de paiement - Reçu #${payment.paymentId}`,
  );
};

export default paymentConfirmationEmail;
