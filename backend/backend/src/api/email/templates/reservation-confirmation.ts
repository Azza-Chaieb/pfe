import { emailLayout } from "./layout";

interface ReservationDetails {
  spaceName: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  reservationId: string;
}

export const reservationConfirmationEmail = (
  userName: string,
  reservation: ReservationDetails,
  frontendUrl: string = "http://localhost:5173",
) => {
  const content = `
    <div class="header">
      <h1>✅ Réservation Confirmée !</h1>
    </div>
    <div class="content">
      <h2 style="color: #667eea; margin-top: 0;">Bonjour ${userName},</h2>
      <p style="font-size: 16px;">Votre réservation a été confirmée avec succès ! 🎉</p>
      
      <div style="background: #e7f3ff; border: 2px solid #667eea; padding: 25px; border-radius: 12px; margin: 30px 0;">
        <h3 style="margin-top: 0; color: #667eea;">📋 Détails de votre réservation</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">🏢 Espace :</td>
            <td style="padding: 10px 0; color: #333;">${reservation.spaceName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">📅 Date :</td>
            <td style="padding: 10px 0; color: #333;">${reservation.date}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">⏰ Horaire :</td>
            <td style="padding: 10px 0; color: #333;">${reservation.startTime} - ${reservation.endTime}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">📍 Lieu :</td>
            <td style="padding: 10px 0; color: #333;">${reservation.location}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">🔢 Numéro :</td>
            <td style="padding: 10px 0; color: #667eea; font-family: monospace;">#${reservation.reservationId}</td>
          </tr>
        </table>
      </div>
      
      <div style="background: #f0f9ff; padding: 20px; border-left: 4px solid #0ea5e9; border-radius: 5px; margin: 25px 0;">
        <p style="margin: 0; font-weight: 600; color: #0369a1;">💡 Informations utiles :</p>
        <ul style="margin-top: 10px; color: #075985;">
          <li>Arrivez 5 minutes avant l'heure prévue</li>
          <li>Apportez une pièce d'identité</li>
          <li>Le WiFi est gratuit et illimité</li>
        </ul>
      </div>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 13px;">
        📧 Besoin de modifier ou annuler ? Connectez-vous à votre compte.
      </p>
    </div>
  `;

  return emailLayout(
    content,
    `Réservation confirmée - ${reservation.spaceName} le ${reservation.date}`,
  );
};

export default reservationConfirmationEmail;
