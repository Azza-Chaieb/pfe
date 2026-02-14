// Base email layout with responsive design
export const emailLayout = (content: string, preheader: string = '') => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Sunspace Platform</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7fa; }
    .email-container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; color: #333; line-height: 1.6; }
    .footer { background: #f7f7f7; padding: 30px; text-align: center; color: #999; font-size: 12px; }
    .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 700; margin: 20px 0; }
    .button:hover { background: #5568d3; }
    @media only screen and (max-width: 600px) {
      .content { padding: 30px 20px !important; }
      .header h1 { font-size: 24px !important; }
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#fefefe;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>
  <div class="email-container">
    ${content}
    <div class="footer">
      <p><strong>Sunspace Platform</strong> - Votre espace de coworking intelligent</p>
      <p>Cet email a été envoyé depuis Sunspace. Si vous avez des questions, contactez-nous à support@sunspace.com</p>
      <p style="margin-top: 20px;">© ${new Date().getFullYear()} Sunspace. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
`;

export default emailLayout;
