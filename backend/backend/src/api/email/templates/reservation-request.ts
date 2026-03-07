import { emailLayout } from "./layout";

interface ReservationDetails {
    spaceName: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    reservationId: string;
    totalPrice: string;
    equipments?: Array<{ name: string; quantity: number }>;
    services?: Array<{ name: string; quantity: number }>;
}

export const reservationRequestEmail = (
    userName: string,
    reservation: ReservationDetails,
    paymentDeadline: string | null = null,
    frontendUrl: string = "http://localhost:5173",
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
      <p style="font-size: 16px;">Nous avons bien reçu votre demande de réservation pour l'espace <b>${reservation.spaceName}</b>.</p>
      
      <div style="background: #f8f9ff; border: 2px solid #667eea; padding: 25px; border-radius: 12px; margin: 30px 0;">
        <h3 style="margin-top: 0; color: #667eea;">📋 Détails de la réservation</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #555;">📅 Date :</td>
            <td style="padding: 8px 0; color: #333;">${reservation.date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #555;">⏰ Horaire :</td>
            <td style="padding: 8px 0; color: #333;">${reservation.startTime} - ${reservation.endTime}</td>
          </tr>
          ${reservation.equipments && reservation.equipments.length > 0 ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #555; vertical-align: top;">🛠️ Équipements :</td>
            <td style="padding: 8px 0; color: #333;">
              ${reservation.equipments.map(e => `${e.name} (x${e.quantity})`).join(", ")}
            </td>
          </tr>
          ` : ""}
          ${reservation.services && reservation.services.length > 0 ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #555; vertical-align: top;">✨ Services :</td>
            <td style="padding: 8px 0; color: #333;">
              ${reservation.services.map(s => `${s.name} (x${s.quantity})`).join(", ")}
            </td>
          </tr>
          ` : ""}
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #555;">💰 Total :</td>
            <td style="padding: 8px 0; color: #667eea; font-weight: bold; font-size: 18px;">${reservation.totalPrice} DT</td>
          </tr>
        </table>

        <div style="border-top: 1px dashed #667eea; padding-top: 15px; margin-top: 15px;">
          <h3 style="margin-top: 0; color: #667eea; font-size: 16px;">📍 Prochaine étape</h3>
          <p>Si vous avez choisi le paiement en espèces, veuillez vous présenter à l'accueil avec votre référence de paiement <b>avant le ${deadlineStr}</b>.</p>
          <p style="color: #e53e3e; font-weight: bold; font-size: 14px;">⚠️ Passé ce délai, votre demande sera automatiquement annulée.</p>
        </div>
      </div>
      
      <p>Vous recevrez un email de confirmation dès que votre paiement sera validé.</p>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${frontendUrl}/login" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Voir mes réservations</a>
      </div>
    </div>
  `;

    return emailLayout(
        content,
        `Votre demande de réservation pour ${reservation.spaceName} est en cours de traitement`,
    );
};

export default reservationRequestEmail;
