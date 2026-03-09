import { emailLayout } from "./layout";

interface ReservationDetails {
    spaceName: string;
    date: string;
    startTime: string;
    endTime: string;
    reservationId: string;
}

export const reservationCompletedEmail = (
    userName: string,
    reservation: ReservationDetails,
    frontendUrl: string = "http://localhost:3000",
) => {
    const content = `
    <div class="header" style="background-color: #f8fafc; padding: 30px; text-align: center; border-bottom: 1px solid #e2e8f0;">
      <h1 style="color: #1e293b; margin: 0; font-size: 24px;">✨ Merci de votre visite chez SunSpace !</h1>
    </div>
    <div class="content" style="padding: 40px 30px; color: #334155; line-height: 1.6;">
      <h2 style="color: #4f46e5; margin-top: 0;">Bonjour ${userName},</h2>
      <p style="font-size: 16px;">Nous espérons que votre séance dans l'espace <strong>${reservation.spaceName}</strong> s'est bien déroulée !</p>
      
      <div style="background: #f1f5f9; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="margin-top: 0; color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Récapitulatif de votre session</h3>
        <p style="margin: 10px 0;"><strong>📅 Date :</strong> ${reservation.date}</p>
        <p style="margin: 10px 0;"><strong>⏰ Horaire :</strong> ${reservation.startTime} - ${reservation.endTime}</p>
        <p style="margin: 10px 0;"><strong>🔢 Réservation :</strong> #${reservation.reservationId}</p>
      </div>

      <p>Votre avis nous est précieux pour continuer à améliorer nos services. N'hésitez pas à nous faire part de vos suggestions lors de votre prochaine visite.</p>
      
      <div style="text-align: center; margin-top: 35px;">
        <a href="${frontendUrl}/bookings" style="background-color: #4f46e5; color: white; padding: 12px 30px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block;">Réserver à nouveau</a>
      </div>

      <p style="margin-top: 40px; font-size: 14px; color: #64748b;">
        À très bientôt dans nos espaces,<br/>
        <strong>L'équipe SunSpace</strong>
      </p>
    </div>
  `;

    return emailLayout(
        content,
        `Merci de votre visite - ${reservation.spaceName}`,
    );
};

export default reservationCompletedEmail;
