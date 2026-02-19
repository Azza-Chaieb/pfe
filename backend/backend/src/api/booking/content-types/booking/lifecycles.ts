import { errors } from '@strapi/utils';
const { ApplicationError } = errors;

export default {
    async beforeCreate(event) {
        await handleBookingLogic(event);
    },

    async beforeUpdate(event) {
        await handleBookingLogic(event);
    },

    async afterCreate(event) {
        const { result } = event;
        await sendConfirmationEmail(result);
    },
};

async function handleBookingLogic(event) {
    const { data, where } = event.params;
    const bookingId = where?.id;

    // 1. Validate Time Frame
    if (data.start_time && data.end_time) {
        const start = new Date(data.start_time);
        const end = new Date(data.end_time);

        if (start >= end) {
            throw new ApplicationError('La date de début doit être antérieure à la date de fin.');
        }

        // 2. Conflict Checking
        const spaceId = data.space;
        if (spaceId) {
            const filters: any = {
                space: spaceId,
                status: { $in: ['pending', 'confirmed'] },
                $or: [
                    {
                        $and: [
                            { start_time: { $lte: data.start_time } },
                            { end_time: { $gt: data.start_time } },
                        ],
                    },
                    {
                        $and: [
                            { start_time: { $lt: data.end_time } },
                            { end_time: { $gte: data.end_time } },
                        ],
                    },
                    {
                        $and: [
                            { start_time: { $gte: data.start_time } },
                            { end_time: { $lte: data.end_time } },
                        ],
                    },
                ],
            };

            if (bookingId) {
                filters.id = { $ne: bookingId };
            }

            const existingBookings = await strapi.entityService.findMany('api::booking.booking', {
                filters,
            });

            if (existingBookings && existingBookings.length > 0) {
                throw new ApplicationError('Cet espace est déjà réservé pour la période sélectionnée.');
            }
        }

        // 3. Price Calculation
        if (data.space) {
            let totalPrice = 0;
            const space = await strapi.entityService.findOne('api::space.space', data.space, {
                populate: ['equipments']
            });

            if (space) {
                const durationMs = end.getTime() - start.getTime();
                const durationHours = durationMs / (1000 * 60 * 60);
                const durationDays = Math.ceil(durationHours / 24);

                // Base Space Price
                if (durationHours < 8 && space.pricing_hourly) {
                    totalPrice += durationHours * space.pricing_hourly;
                } else if (space.pricing_daily) {
                    totalPrice += durationDays * space.pricing_daily;
                } else if (space.pricing_hourly) {
                    totalPrice += durationHours * space.pricing_hourly;
                }

                // Equipment Price
                if (data.equipments && data.equipments.connect) {
                    const equipmentIds = data.equipments.connect.map(e => e.id);
                    const requestedEquipments = await strapi.entityService.findMany('api::equipment.equipment', {
                        filters: { id: { $in: equipmentIds } }
                    });

                    for (const eq of requestedEquipments) {
                        if (eq.price) {
                            if (eq.price_type === 'hourly') {
                                totalPrice += durationHours * eq.price;
                            } else if (eq.price_type === 'daily') {
                                totalPrice += durationDays * eq.price;
                            } else {
                                totalPrice += eq.price; // one-time
                            }
                        }
                    }
                }

                data.total_price = parseFloat(totalPrice.toFixed(2));
            }
        }
    }
}

async function sendConfirmationEmail(result) {
    try {
        const fullBooking: any = await strapi.entityService.findOne('api::booking.booking', result.id, {
            populate: ['user', 'space']
        });

        if (!fullBooking || !fullBooking.user || !fullBooking.user.email) return;

        const emailService = strapi.service('api::email.email-service');
        if (emailService) {
            const reservationDetails = {
                spaceName: fullBooking.space?.name || 'Espace de coworking',
                date: new Date(fullBooking.start_time).toLocaleDateString('fr-FR'),
                startTime: new Date(fullBooking.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                endTime: new Date(fullBooking.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                location: 'Sunspace Tunis',
                reservationId: fullBooking.id.toString(),
            };

            await emailService.sendReservationConfirmation(
                fullBooking.user.email,
                fullBooking.user.fullname || fullBooking.user.username,
                reservationDetails
            );
        }
    } catch (error) {
        strapi.log.error('Failed to send booking confirmation email:', error);
    }
}
