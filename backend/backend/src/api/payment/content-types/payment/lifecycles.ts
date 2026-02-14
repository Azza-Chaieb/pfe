export default {
    async afterCreate(event) {
        const { result } = event;

        try {
            // Check if status is "confirmé" (or similar based on your app logic)
            // If status is not confirmed yet, we might want to wait for afterUpdate
            if (result.statut && result.statut.toLowerCase() !== 'confirmé' && result.statut.toLowerCase() !== 'success') {
                return;
            }

            await sendPaymentEmail(result);
        } catch (error) {
            strapi.log.error('Failed to send payment confirmation email (afterCreate):', error);
        }
    },

    async afterUpdate(event) {
        const { result, params } = event;

        try {
            // Send email only if status just changed to "confirmé"
            if (result.statut && (result.statut.toLowerCase() === 'confirmé' || result.statut.toLowerCase() === 'success')) {
                await sendPaymentEmail(result);
            }
        } catch (error) {
            strapi.log.error('Failed to send payment confirmation email (afterUpdate):', error);
        }
    },
};

async function sendPaymentEmail(result) {
    if (!result.user) return; // Need user relation

    try {
        const user = await strapi.entityService.findOne('plugin::users-permissions.user', result.user.id);
        const emailPreferences = user?.emailPreferences as any;

        if (!user || !emailPreferences?.payments) {
            return; // User has disabled payment emails
        }

        const emailService = strapi.service('api::email.email-service');

        if (emailService && user.email) {
            const paymentDetails = {
                paymentId: result.payment_id || result.id.toString(),
                amount: `${result.amount} DT`, // Assuming Tunisian Dinar based on context
                date: new Date(result.updatedAt || result.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                itemDescription: result.description || 'Service Sunspace',
                userName: user.fullname || user.username
            };

            await emailService.sendPaymentConfirmation(
                user.email,
                user.fullname || user.username,
                paymentDetails
            );

            strapi.log.info(`Payment confirmation email sent to ${user.email}`);
        }
    } catch (error) {
        strapi.log.error('Error in sendPaymentEmail helper:', error);
    }
}
