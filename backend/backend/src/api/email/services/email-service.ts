// Email service with integrated templates
import { emailLayout } from '../templates/layout';
import welcomeEmail from '../templates/welcome';
import passwordResetEmail from '../templates/password-reset';
import reservationConfirmationEmail from '../templates/reservation-confirmation';
import sessionReminderEmail from '../templates/session-reminder';
import paymentConfirmationEmail from '../templates/payment-confirmation';

export default {
    /**
     * Send welcome email to new users
     */
    async sendWelcomeEmail(userEmail: string, userName: string) {
        try {
            const htmlContent = welcomeEmail(userName, userEmail);

            await strapi.plugins['email'].services.email.send({
                to: userEmail,
                subject: '🎉 Bienvenue sur Sunspace !',
                html: htmlContent,
            });
        } catch (error) {
            strapi.log.error('Failed to send welcome email:', error);
            throw error;
        }
    },

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(userEmail: string, userName: string, resetToken: string) {
        try {
            const htmlContent = passwordResetEmail(userName, resetToken, '1 heure');

            await strapi.plugins['email'].services.email.send({
                to: userEmail,
                subject: '🔐 Réinitialisation de votre mot de passe Sunspace',
                html: htmlContent,
            });
        } catch (error) {
            strapi.log.error('Failed to send password reset email:', error);
            throw error;
        }
    },

    /**
     * Send reservation confirmation email
     */
    async sendReservationConfirmation(userEmail: string, userName: string, reservationDetails: any) {
        try {
            const htmlContent = reservationConfirmationEmail(userName, reservationDetails);

            await strapi.plugins['email'].services.email.send({
                to: userEmail,
                subject: `✅ Réservation confirmée - ${reservationDetails.spaceName}`,
                html: htmlContent,
            });
        } catch (error) {
            strapi.log.error('Failed to send reservation confirmation:', error);
            throw error;
        }
    },

    /**
     * Send session reminder email
     */
    async sendSessionReminder(userEmail: string, userName: string, sessionDetails: any) {
        try {
            const htmlContent = sessionReminderEmail(userName, sessionDetails);

            await strapi.plugins['email'].services.email.send({
                to: userEmail,
                subject: `⏰ Rappel : ${sessionDetails.courseName} - ${sessionDetails.date}`,
                html: htmlContent,
            });
        } catch (error) {
            strapi.log.error('Failed to send session reminder:', error);
            throw error;
        }
    },

    /**
     * Send payment confirmation email
     */
    async sendPaymentConfirmation(userEmail: string, userName: string, paymentDetails: any) {
        try {
            const htmlContent = paymentConfirmationEmail(userName, paymentDetails);

            await strapi.plugins['email'].services.email.send({
                to: userEmail,
                subject: `💰 Confirmation de paiement - Reçu #${paymentDetails.paymentId}`,
                html: htmlContent,
            });
        } catch (error) {
            strapi.log.error('Failed to send payment confirmation:', error);
            throw error;
        }
    },
};
