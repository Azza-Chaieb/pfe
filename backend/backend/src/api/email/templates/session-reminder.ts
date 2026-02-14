import { emailLayout } from './layout';

interface SessionDetails {
    courseName: string;
    instructorName: string;
    date: string;
    time: string;
    location: string;
    durationMinutes: number;
}

export const sessionReminderEmail = (userName: string, session: SessionDetails) => {
    const content = `
    <div class="header" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
      <h1>⏰ Rappel de Séance</h1>
    </div>
    <div class="content">
      <h2 style="color: #f5576c; margin-top: 0;">Bonjour ${userName},</h2>
      <p style="font-size: 18px; font-weight: 600; color: #333;">Votre séance commence bientôt ! ⏰</p>
      
      <div style="background: linear-gradient(135deg, #fff5f5 0%, #ffe5e9 100%); border: 2px solid #f5576c; padding: 25px; border-radius: 12px; margin: 30px 0;">
        <h3 style="margin-top: 0; color: #f5576c; display: flex; align-items: center;">
          <span style="font-size: 24px; margin-right: 10px;">📚</span> ${session.courseName}
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">👨‍🏫 Formateur :</td>
            <td style="padding: 10px 0; color: #333;">${session.instructorName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">📅 Date :</td>
            <td style="padding: 10px 0; color: #333; font-weight: 600;">${session.date}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">⏰ Heure :</td>
            <td style="padding: 10px 0; color: #333; font-weight: 600; font-size: 18px;">${session.time}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">⌛ Durée :</td>
            <td style="padding: 10px 0; color: #333;">${session.durationMinutes} minutes</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #555;">📍 Lieu :</td>
            <td style="padding: 10px 0; color: #333;">${session.location}</td>
          </tr>
        </table>
      </div>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 5px; margin: 25px 0;">
        <p style="margin: 0; font-weight: 600; color: #92400e;">📝 Checklist avant la séance :</p>
        <ul style="margin-top: 10px; color: #78350f;">
          <li>✅ Vérifiez votre matériel (ordinateur, stylos, etc.)</li>
          <li>✅ Préparez vos questions pour le formateur</li>
          <li>✅ Arrivez 10 minutes à l'avance</li>
          <li>✅ Apportez de l'eau et des snacks si nécessaire</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="http://localhost:5173/courses" class="button" style="background: #f5576c;">Voir mes cours</a>
      </div>

      <p style="margin-top: 30px; padding: 15px; background: #ecfdf5; border-radius: 8px; font-size: 14px; color: #065f46; text-align: center;">
        <strong>🎯 On vous attend !</strong> N'hésitez pas à contacter le formateur si vous avez des questions.
      </p>
    </div>
  `;

    return emailLayout(content, `Rappel : ${session.courseName} - ${session.date} à ${session.time}`);
};

export default sessionReminderEmail;
