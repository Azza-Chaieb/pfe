export default {
    async afterCreate(event) {
        const { result } = event;

        try {
            // Check if user has email preferences enabled for reservations
            const user = await strapi.entityService.findOne('plugin::users-permissions.user', result.user.id);
            const emailPreferences = user?.emailPreferences as any;

            if (!user || !emailPreferences?.reservations) {
                return; // User has disabled reservation emails
            }

            const emailService = strapi.service('api::email.email-service');

            if (emailService && user.email) {
                const reservationDetails = {
                    spaceName: result.space?.name || 'Espace de coworking',
                    date: new Date(result.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    startTime: result.startTime || 'N/A',
                    endTime: result.endTime || 'N/A',
                    location: result.space?.location || 'Sunspace Tunis',
                    reservationId: result.id.toString(),
                };

                await emailService.sendReservationConfirmation(
                    user.email,
                    user.fullname || user.username,
                    reservationDetails
                );

                strapi.log.info(`Reservation confirmation email sent to ${user.email}`);
            }
        } catch (error) {
            strapi.log.error('Failed to send reservation confirmation email:', error);
        }
    },
};
