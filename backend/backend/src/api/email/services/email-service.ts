// Email service with integrated templates
import { emailLayout } from "../templates/layout";
import welcomeEmail from "../templates/welcome";
import passwordResetEmail from "../templates/password-reset";
import reservationConfirmationEmail from "../templates/reservation-confirmation";
import reservationCancellationEmail from "../templates/reservation-cancellation";
import sessionReminderEmail from "../templates/session-reminder";
import paymentConfirmationEmail from "../templates/payment-confirmation";

const getEmailService = () => {
  const service = strapi.plugin("email").service("email");
  if (!service) throw new Error("Strapi Email Plugin Service not found");
  return service;
};

// Gmail and other providers often require the 'from' to match the authenticated user
const DEFAULT_FROM =
  process.env.SMTP_USER || process.env.SMTP_FROM || "noreply@sunspace.com";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export default {
  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(userEmail: string, userName: string) {
    try {
      const htmlContent = welcomeEmail(userName, userEmail, FRONTEND_URL);
      await getEmailService().send({
        to: userEmail,
        from: DEFAULT_FROM,
        subject: "🎉 Bienvenue sur Sunspace !",
        html: htmlContent,
      });
      console.log(`[EmailService] Welcome email sent to ${userEmail}`);
    } catch (error) {
      strapi.log.error("Failed to send welcome email:", error);
      throw error;
    }
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetToken: string,
  ) {
    try {
      const htmlContent = passwordResetEmail(userName, resetToken, "1 heure");
      await getEmailService().send({
        to: userEmail,
        from: DEFAULT_FROM,
        subject: "🔐 Réinitialisation de votre mot de passe Sunspace",
        html: htmlContent,
      });
      console.log(`[EmailService] Password reset sent to ${userEmail}`);
    } catch (error) {
      console.error(
        "[EmailService] Error sending password reset:",
        error.message,
      );
      strapi.log.error("Failed to send password reset email:", error);
      throw error;
    }
  },

  /**
   * Send reservation confirmation email
   */
  async sendReservationConfirmation(
    userEmail: string,
    userName: string,
    reservationDetails: any,
  ) {
    try {
      console.log(`[EmailService] Preparing confirmation for ${userEmail}`);
      const htmlContent = reservationConfirmationEmail(
        userName,
        reservationDetails,
        FRONTEND_URL,
      );

      await getEmailService().send({
        to: userEmail,
        from: DEFAULT_FROM,
        subject: `✅ Réservation confirmée - ${reservationDetails.spaceName}`,
        html: htmlContent,
      });
      console.log(`[EmailService] Confirmation SUCCESS for ${userEmail}`);
    } catch (error) {
      console.error("[EmailService] Confirmation FAILURE:", error.message);
      strapi.log.error("Failed to send reservation confirmation:", error);
      throw error;
    }
  },

  /**
   * Send reservation cancellation email
   */
  async sendReservationCancellation(
    userEmail: string,
    userName: string,
    reservationDetails: any,
  ) {
    try {
      console.log(`[EmailService] Preparing cancellation for ${userEmail}`);
      const htmlContent = reservationCancellationEmail(
        userName,
        reservationDetails,
        FRONTEND_URL,
      );

      await getEmailService().send({
        to: userEmail,
        from: DEFAULT_FROM,
        subject: `❌ Réservation annulée - ${reservationDetails.spaceName}`,
        html: htmlContent,
      });
      console.log(`[EmailService] Cancellation SUCCESS for ${userEmail}`);
    } catch (error) {
      console.error("[EmailService] Cancellation FAILURE:", error.message);
      strapi.log.error("Failed to send reservation cancellation:", error);
      throw error;
    }
  },

  /**
   * Send session reminder email
   */
  async sendSessionReminder(
    userEmail: string,
    userName: string,
    sessionDetails: any,
  ) {
    try {
      const htmlContent = sessionReminderEmail(userName, sessionDetails);
      await getEmailService().send({
        to: userEmail,
        from: DEFAULT_FROM,
        subject: `⏰ Rappel : ${sessionDetails.courseName} - ${sessionDetails.date}`,
        html: htmlContent,
      });
      console.log(`[EmailService] Reminder sent to ${userEmail}`);
    } catch (error) {
      strapi.log.error("Failed to send session reminder:", error);
      throw error;
    }
  },

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(
    userEmail: string,
    userName: string,
    paymentDetails: any,
  ) {
    try {
      const htmlContent = paymentConfirmationEmail(
        userName,
        paymentDetails,
        FRONTEND_URL,
      );
      await getEmailService().send({
        to: userEmail,
        from: DEFAULT_FROM,
        subject: `💰 Confirmation de paiement - Reçu #${paymentDetails.paymentId}`,
        html: htmlContent,
      });
      console.log(`[EmailService] Payment confirmation sent to ${userEmail}`);
    } catch (error) {
      strapi.log.error("Failed to send payment confirmation:", error);
      throw error;
    }
  },
};
