// Email service with integrated templates
import { emailLayout } from "../templates/layout";
import welcomeEmail from "../templates/welcome";
import passwordResetEmail from "../templates/password-reset";
import reservationConfirmationEmail from "../templates/reservation-confirmation";
import reservationCancellationEmail from "../templates/reservation-cancellation";
import sessionReminderEmail from "../templates/session-reminder";
import paymentConfirmationEmail from "../templates/payment-confirmation";
import subscriptionRequestEmail from "../templates/subscription-request";
import subscriptionConfirmedEmail from "../templates/subscription-confirmed";
import subscriptionRejectedEmail from "../templates/subscription-rejected";
import reservationRequestEmail from "../templates/reservation-request";
import reservationCompletedEmail from "../templates/reservation-completed";

export default ({ strapi }) => {
  const getEmailService = () => {
    const service = strapi.plugin("email").service("email");
    if (!service) throw new Error("Strapi Email Plugin Service not found");
    return service;
  };

  // Gmail and other providers often require the 'from' to match the authenticated user
  const DEFAULT_FROM =
    process.env.SMTP_USER || process.env.SMTP_FROM || "noreply@sunspace.com";
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

  strapi.log.debug(
    `[EmailService] Initialized with DEFAULT_FROM: ${DEFAULT_FROM}`,
  );
  if (!process.env.SMTP_HOST) {
    strapi.log.warn(
      "[EmailService] SMTP_HOST is not defined in environment variables!",
    );
  }

  return {
    /**
     * Send welcome email to new users
     */
    async sendWelcomeEmail(userEmail: string, userName: string) {
      try {
        const htmlContent = welcomeEmail(userName, userEmail, FRONTEND_URL);
        strapi.log.debug(
          `[EmailService] Sending Welcome Email to: ${userEmail}`,
        );
        await getEmailService().send({
          to: userEmail,
          from: DEFAULT_FROM,
          subject: "🎉 Bienvenue sur Sunspace !",
          html: htmlContent,
        });
        strapi.log.info(`[EmailService] Welcome email sent to ${userEmail}`);
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
        strapi.log.info(`[EmailService] Password reset sent to ${userEmail}`);
      } catch (error) {
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
        strapi.log.info(`[EmailService] Confirmation SUCCESS for ${userEmail}`);
      } catch (error) {
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
        strapi.log.info(`[EmailService] Cancellation SUCCESS for ${userEmail}`);
      } catch (error) {
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
        strapi.log.info(`[EmailService] Reminder sent to ${userEmail}`);
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
        strapi.log.info(
          `[EmailService] Payment confirmation sent to ${userEmail}`,
        );
      } catch (error) {
        strapi.log.error("Failed to send payment confirmation:", error);
        throw error;
      }
    },

    /**
     * Send subscription request pending email
     */
    async sendSubscriptionRequest(
      userEmail: string,
      userName: string,
      planName: string,
      paymentDeadline: string | null = null,
    ) {
      try {
        strapi.log.debug(
          `[EmailService] Attempting to send Subscription Request email to ${userEmail} for plan ${planName}`,
        );
        const htmlContent = subscriptionRequestEmail(
          userName,
          planName,
          paymentDeadline,
          FRONTEND_URL,
        );
        await getEmailService().send({
          to: userEmail,
          from: DEFAULT_FROM,
          subject: `⌛ Demande d'abonnement ${planName} reçue`,
          html: htmlContent,
        });
        strapi.log.info(
          `[EmailService] Subscription request email sent to ${userEmail}`,
        );
      } catch (error) {
        strapi.log.error("Failed to send subscription request email:", error);
      }
    },

    /**
     * Send subscription confirmed email
     */
    async sendSubscriptionConfirmed(
      userEmail: string,
      userName: string,
      planName: string,
      expiryDate: string,
    ) {
      try {
        strapi.log.debug(
          `[EmailService] Attempting to send Subscription Confirmation email to ${userEmail} for plan ${planName}`,
        );
        const htmlContent = subscriptionConfirmedEmail(
          userName,
          planName,
          expiryDate,
          FRONTEND_URL,
        );
        await getEmailService().send({
          to: userEmail,
          from: DEFAULT_FROM,
          subject: `🎉 Votre abonnement ${planName} est activé !`,
          html: htmlContent,
        });
        strapi.log.info(
          `[EmailService] Subscription confirmed email sent to ${userEmail}`,
        );
      } catch (error) {
        strapi.log.error("Failed to send subscription confirmed email:", error);
      }
    },

    /**
     * Send subscription rejected email
     */
    async sendSubscriptionRejected(
      userEmail: string,
      userName: string,
      planName: string,
      reason: string,
    ) {
      try {
        strapi.log.debug(
          `[EmailService] Attempting to send Subscription Rejection email to ${userEmail} for plan ${planName}. Reason: ${reason}`,
        );
        const htmlContent = subscriptionRejectedEmail(
          userName,
          planName,
          reason,
          FRONTEND_URL,
        );
        await getEmailService().send({
          to: userEmail,
          from: DEFAULT_FROM,
          subject: "Notification concernant votre demande d'abonnement",
          html: htmlContent,
        });
        strapi.log.info(
          `[EmailService] Subscription rejected email sent to ${userEmail}`,
        );
      } catch (error) {
        strapi.log.error("Failed to send subscription rejected email:", error);
      }
    },

    /**
     * Send reservation request pending email (Cash payment)
     */
    async sendReservationRequest(
      userEmail: string,
      userName: string,
      reservationDetails: any,
      paymentDeadline: string | null = null,
    ) {
      try {
        strapi.log.debug(
          `[EmailService] Attempting to send Reservation Request email to ${userEmail} for space ${reservationDetails.spaceName}`,
        );
        const htmlContent = reservationRequestEmail(
          userName,
          reservationDetails,
          paymentDeadline,
          FRONTEND_URL,
        );
        await getEmailService().send({
          to: userEmail,
          from: DEFAULT_FROM,
          subject: `⌛ Demande de réservation ${reservationDetails.spaceName} reçue`,
          html: htmlContent,
        });
        strapi.log.info(
          `[EmailService] Reservation request email sent to ${userEmail}`,
        );
      } catch (error) {
        strapi.log.error("Failed to send reservation request email:", error);
      }
    },

    /**
     * Send reservation completed "Thank You" email
     */
    async sendReservationCompleted(
      userEmail: string,
      userName: string,
      reservationDetails: any,
    ) {
      try {
        strapi.log.debug(
          `[EmailService] Attempting to send Reservation Completed email to ${userEmail} for space ${reservationDetails.spaceName}`,
        );
        const htmlContent = reservationCompletedEmail(
          userName,
          reservationDetails,
          FRONTEND_URL,
        );
        await getEmailService().send({
          to: userEmail,
          from: DEFAULT_FROM,
          subject: `✨ Merci de votre visite - ${reservationDetails.spaceName}`,
          html: htmlContent,
        });
        strapi.log.info(
          `[EmailService] Reservation completed email sent to ${userEmail}`,
        );
      } catch (error) {
        strapi.log.error("Failed to send reservation completed email:", error);
      }
    },
  };
};
