import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::session.session', ({ strapi }) => ({
  async sendReminders() {
    // Cette fonction pourrait être appelée par un CRON job (ex: toutes les heures)
    // Elle chercherait les sessions commençant dans 24h et enverrait des emails aux `students`.
    console.log("[CRON] Checking for upcoming sessions to send reminders...");
    
    // Squelette factice
    const upcomingSessions = await strapi.documents('api::session.session').findMany({
      filters: {
        // Logique de date spécifique ici
      },
      populate: ['students']
    });

    if (upcomingSessions && upcomingSessions.length > 0) {
      console.log(`[Email Service] Reminders sent for ${upcomingSessions.length} session(s)`);
    }
  }
}));
