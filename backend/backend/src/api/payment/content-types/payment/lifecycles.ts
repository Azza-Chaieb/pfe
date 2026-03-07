export default {
    async afterCreate(event) {
        const { result } = event;

        try {
            // NEW: Send Request Email for On-Site (Cash) payment method
            if (result.method === 'on_site') {
                await sendReservationRequestEmail(result);
            }

            const status = result.status || result.statut;
            if (status && (status.toLowerCase() === 'confirmé' || status.toLowerCase() === 'confirmed' || status.toLowerCase() === 'success')) {
                await sendPaymentEmail(result);
            }
        } catch (error) {
            strapi.log.error('Failed to send payment email (afterCreate):', error);
        }
    },

    async afterUpdate(event) {
        const { result, params } = event;

        try {
            const status = result.status || result.statut;
            if (status && (status.toLowerCase() === 'confirmé' || status.toLowerCase() === 'confirmed' || status.toLowerCase() === 'success')) {
                await sendPaymentEmail(result);
            }
        } catch (error) {
            strapi.log.error('Failed to send payment confirmation email (afterUpdate):', error);
        }
    },
};

async function sendPaymentEmail(result) {
    try {
        let user: any = result.user;
        if (!user && result.booking) {
            const booking = await strapi.entityService.findOne('api::booking.booking', typeof result.booking === 'object' ? result.booking.id : result.booking, {
                populate: { user: true }
            }) as any;
            user = booking?.user;
        }

        if (!user) return;

        const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);
        const emailPreferences = fullUser?.emailPreferences as any;

        if (!fullUser || !emailPreferences?.payments) {
            return; // User has disabled payment emails
        }

        const emailService = strapi.service('api::email.email-service');

        if (emailService && fullUser.email) {
            const paymentDetails = {
                paymentId: result.payment_id || result.id.toString(),
                amount: `${result.amount} DT`,
                date: new Date(result.updatedAt || result.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                itemDescription: result.description || 'Service Sunspace',
                userName: fullUser.fullname || fullUser.username
            };

            await emailService.sendPaymentConfirmation(
                fullUser.email,
                fullUser.fullname || fullUser.username,
                paymentDetails
            );

            strapi.log.info(`Payment confirmation email sent to ${fullUser.email}`);
        }
    } catch (error) {
        strapi.log.error('Error in sendPaymentEmail helper:', error);
    }
}

async function sendReservationRequestEmail(result: any) {
    try {
        // Fetch payment with booking relation
        const payment = await strapi.entityService.findOne('api::payment.payment', result.id, {
            populate: { booking: true }
        }) as any;

        if (!payment?.booking) return;

        // Fetch full booking details (including user, space, and choices)
        const fullBooking = await strapi.entityService.findOne('api::booking.booking', payment.booking.id, {
            populate: {
                user: true,
                space: true,
                equipments: true,
                services: true
            }
        }) as any;

        const user = fullBooking?.user;
        if (!user?.email) return;

        const emailService = strapi.service('api::email.email-service');
        if (emailService && user.email) {

            // Calculate deadline (2 hours from now)
            const deadline = new Date();
            deadline.setHours(deadline.getHours() + 2);

            const reservationDetails = {
                spaceName: fullBooking.space?.name || fullBooking.extras?.spaceName || "Espace SunSpace",
                date: new Date(fullBooking.start_time).toLocaleDateString("fr-FR"),
                startTime: new Date(fullBooking.start_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                endTime: new Date(fullBooking.end_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                location: "Sunspace Tunis",
                reservationId: fullBooking.id.toString(),
                totalPrice: fullBooking.total_price?.toString() || "0",
                equipments: fullBooking.equipments?.map((e: any) => ({
                    name: e.attributes?.name || e.name,
                    quantity: fullBooking.extras?.equipmentQuantities?.[e.documentId || e.id] || 1
                })),
                services: fullBooking.services?.map((s: any) => ({
                    name: s.attributes?.name || s.name,
                    quantity: fullBooking.extras?.serviceQuantities?.[s.documentId || s.id] || 1
                }))
            };

            await emailService.sendReservationRequest(
                user.email,
                user.fullname || user.username,
                reservationDetails,
                deadline.toISOString()
            );

            strapi.log.info(`[Payment Lifecycle] Reservation Request email sent to ${user.email}`);
        }
    } catch (error) {
        strapi.log.error('Error in sendReservationRequestEmail helper:', error);
    }
}
