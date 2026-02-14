import emailService from '../services/email-service';

export default {
  async sendTest(ctx) {
    try {
      const { to } = ctx.request.body;
      if (!to) {
        return ctx.badRequest('Email address is required');
      }

      await strapi.plugins['email'].services.email.send({
        to,
        subject: '🎉 Test Email from Sunspace',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✅ Email Configuration Works!</h1>
            </div>
            <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #333;">Congratulations! Your email service is correctly configured.</p>
            </div>
          </div>
        `,
      });

      ctx.send({ success: true, message: `Test email sent successfully to ${to}` });
    } catch (error) {
      strapi.log.error('Email send error:', error);
      ctx.badRequest('Failed to send email: ' + error.message);
    }
  },

  async sendWelcome(ctx) {
    try {
      const { to, name } = ctx.request.body;
      if (!to || !name) return ctx.badRequest('Email and name required');

      await emailService.sendWelcomeEmail(to, name);
      ctx.send({ success: true, message: 'Welcome email sent' });
    } catch (error) {
      strapi.log.error('Email send error:', error);
      ctx.badRequest('Failed: ' + error.message);
    }
  },

  async sendPasswordReset(ctx) {
    try {
      const { to, name, token } = ctx.request.body;
      if (!to || !name || !token) return ctx.badRequest('Email, name, and token required');

      await emailService.sendPasswordResetEmail(to, name, token);
      ctx.send({ success: true, message: 'Password reset email sent' });
    } catch (error) {
      strapi.log.error('Email send error:', error);
      ctx.badRequest('Failed: ' + error.message);
    }
  },

  async sendReservation(ctx) {
    try {
      const { to, name, reservation } = ctx.request.body;
      if (!to || !name || !reservation) return ctx.badRequest('Email, name, and reservation details required');

      await emailService.sendReservationConfirmation(to, name, reservation);
      ctx.send({ success: true, message: 'Reservation confirmation sent' });
    } catch (error) {
      strapi.log.error('Email send error:', error);
      ctx.badRequest('Failed: ' + error.message);
    }
  },

  async sendSessionReminder(ctx) {
    try {
      const { to, name, session } = ctx.request.body;
      if (!to || !name || !session) return ctx.badRequest('Email, name, and session details required');

      await emailService.sendSessionReminder(to, name, session);
      ctx.send({ success: true, message: 'Session reminder sent' });
    } catch (error) {
      strapi.log.error('Email send error:', error);
      ctx.badRequest('Failed: ' + error.message);
    }
  },
};
