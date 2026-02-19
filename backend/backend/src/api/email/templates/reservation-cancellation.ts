import { emailLayout } from './layout';

interface ReservationDetails {
    spaceName: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    reservationId: string;
    reason?: string;
}

export const reservationCancellationEmail = (userName: string, reservation: ReservationDetails) => {
    const content = `
    <div class="header" style="background: #fee2e2;">
      <h1 style="color: #991b1b;">❌ Réservation Annulée</h1>
    </div>
    <div class="content">
      <h2 style="color: #991b1b; margin-top: 0;">Bonjour ${userName},</h2>
      <p style="font-size: 16px;">Nous vous informons que votre réservation a été annulée. 😔</p>
      
      <div style="background: #fef2f2; border: 2px solid #ef4444; padding: 25px; border-radius: 12px; margin: 30px 0;">
        <h3 style="margin-top: 0; color: #991b1b;">📋 Détails de la réservation annulée</h3>
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
            <td style="padding: 10px 0; font-weight: 600; color: #555;">🔢 Numéro :</td>
            <td style="padding: 10px 0; color: #991b1b; font-family: monospace;">#${reservation.reservationId}</td>
          </tr>
        </table>
      </div>

      <p style="color: #666; font-size: 14px;">
        Si vous n'êtes pas à l'origine de cette annulation, cela peut être dû à un conflit d'horaire ou à une maintenance de l'espace. Nous vous invitons à choisir un autre créneau.
      </p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="http://localhost:3000/explore/5" class="button" style="background: #991b1b;">Réserver un autre créneau</a>
      </div>
    </div>
  `;

    return emailLayout(content, `Réservation annulée - ${reservation.spaceName}`);
};

export default reservationCancellationEmail;
