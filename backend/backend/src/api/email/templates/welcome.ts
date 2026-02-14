import { emailLayout } from './layout';

export const welcomeEmail = (userName: string, userEmail: string) => {
    const content = `
    <div class="header">
      <h1>🎉 Bienvenue sur Sunspace !</h1>
    </div>
    <div class="content">
      <h2 style="color: #667eea; margin-top: 0;">Bonjour ${userName} 👋</h2>
      <p style="font-size: 16px;">Nous sommes ravis de vous accueillir dans notre communauté Sunspace !</p>
      
      <p>Votre compte a été créé avec succès. Vous pouvez maintenant profiter de tous nos services :</p>
      
      <div style="background: #f8f9ff; padding: 20px; border-left: 4px solid #667eea; border-radius: 5px; margin: 25px 0;">
        <p style="margin: 0; font-weight: 600; color: #667eea;">✨ Fonctionnalités disponibles :</p>
        <ul style="margin-top: 10px; color: #666;">
          <li>Réservation d'espaces de coworking</li>
          <li>Inscription aux cours et formations</li>
          <li>Accès aux événements communautaires</li>
          <li>Gestion de votre profil personnel</li>
        </ul>
      </div>

      <p>Pour commencer votre aventure, connectez-vous dès maintenant :</p>
      
      <div style="text-align: center;">
        <a href="http://localhost:5173/login" class="button">Se Connecter</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        <strong>Votre email :</strong> ${userEmail}
      </p>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 13px;">
        💡 <strong>Conseil :</strong> Complétez votre profil pour une meilleure expérience !
      </p>
    </div>
  `;

    return emailLayout(content, 'Bienvenue sur Sunspace - Commencez votre aventure maintenant !');
};

export default welcomeEmail;
