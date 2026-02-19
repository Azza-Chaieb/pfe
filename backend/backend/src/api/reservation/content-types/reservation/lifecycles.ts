import { errors } from "@strapi/utils";
const { ValidationError } = errors;

/**
 * Robustly extract a single ID from Strapi V5 formats.
 */
function extractId(data: any): any {
    if (!data) return null;
    if (typeof data === 'object' && (data.set || data.connect)) {
        const list = data.set || data.connect;
        if (Array.isArray(list) && list.length > 0) return list[0].documentId || list[0].id || list[0];
    }
    if (Array.isArray(data) && data.length > 0) return data[0].documentId || data[0].id || data[0];
    if (typeof data === 'object') return data.documentId || data.id || data;
    return data;
}

const checkOverlap = (startA: string, endA: string, startB: string, endB: string) => {
    const sA = parseInt(startA.replace(':', ''));
    const eA = parseInt(endA.replace(':', ''));
    const sB = parseInt(startB.replace(':', ''));
    const eB = parseInt(endB.replace(':', ''));
    return sA < eB && sB < eA;
};

export default {
    async beforeCreate(event) {
        const { data } = event.params;
        const { date, time_slot } = data;
        const spaceId = extractId(data.space);
        const userId = extractId(data.user);

        if (!spaceId || !date || !time_slot || !userId) return;

        console.log(`[Lifecycle] Creating reservation for User=${userId}, Space=${spaceId} on ${date}`);

        try {
            const filters: any = { date: date, status: { $ne: 'cancelled' } };
            if (!isNaN(Number(spaceId))) filters.space = { id: Number(spaceId) };
            else filters.space = { documentId: spaceId };

            const existing = await strapi.entityService.findMany('api::reservation.reservation', { filters }) as any[];

            if (existing.length > 0) {
                // Primary Conflict Logic
                if (time_slot === 'Full Day') throw new ValidationError("Cet espace est déjà réservé.");
                const hasFullDay = existing.some(r => r.time_slot === 'Full Day');
                if (hasFullDay) throw new ValidationError("Cet espace est déjà réservé pour toute la journée.");

                const [newStart, newEnd] = time_slot.split(' - ');
                for (const res of existing) {
                    if (res.time_slot === 'Full Day') continue;
                    const [extStart, extEnd] = (res.time_slot || "").split(' - ');
                    if (extStart && extEnd && checkOverlap(newStart, newEnd, extStart, extEnd)) {
                        throw new ValidationError(`Conflit d'horaire (${res.time_slot}).`);
                    }
                }
            }
        } catch (err) {
            if (err instanceof ValidationError) throw err;
            console.error("[Lifecycle] beforeCreate CRITICAL ERROR:", err.message);
            throw err;
        }
    },
    async beforeUpdate(event) {
        const { params } = event;
        const data = params?.data;
        console.log(`[Lifecycle] Updating reservation:`, { where: params?.where, data });
    },

    async afterCreate(event) {
        const { result, params } = event;
        console.log(`[Lifecycle] SUCCESS: Reservation #${result.id} created.`);

        // ASYNC EMAIL DISPATCH
        (async () => {
            try {
                const userId = extractId(result.user || params?.data?.user);
                if (!userId) return;

                const user = await strapi.query('plugin::users-permissions.user').findOne({
                    where: { $or: [{ documentId: userId }, { id: !isNaN(Number(userId)) ? Number(userId) : -1 }] }
                });

                if (!user || !user.email) return;

                const emailService = strapi.service('api::email.email-service') as any;
                if (!emailService) return;

                let spaceName = 'Espace de coworking';
                const spaceRef = extractId(result.space || params?.data?.space);
                if (spaceRef) {
                    const space = await strapi.query('api::space.space').findOne({
                        where: { $or: [{ documentId: spaceRef }, { id: !isNaN(Number(spaceRef)) ? Number(spaceRef) : -1 }] }
                    });
                    if (space) spaceName = space.name;
                }

                await emailService.sendReservationConfirmation(
                    user.email,
                    user.fullname || user.username || 'Client',
                    {
                        spaceName,
                        date: new Date(result.date || params?.data?.date).toLocaleDateString('fr-FR', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        }),
                        startTime: result.time_slot?.split(" - ")[0] || "08:00",
                        endTime: result.time_slot?.split(" - ")[1] || "18:00",
                        location: 'SunSpace Tunis',
                        reservationId: result.documentId || result.id.toString(),
                    }
                );
                console.log(`[Lifecycle] Email sent successfully to ${user.email}`);
            } catch (err) {
                console.error("[Lifecycle Email Error]", err.message);
            }
        })();
    },

    async afterUpdate(event) {
        const { result, params } = event;
        const data = params?.data;

        // Ensure we don't throw if data or status is missing
        if (data && data.status) {
            const newStatus = data.status;
            console.log(`[Lifecycle] Status update detected for Reservation #${result?.id || '?'}: ${newStatus}`);

            // Fire and forget email logic to avoid blocking the main request
            (async () => {
                try {
                    // In V5, afterUpdate result might not include all relations unless populated
                    // We fetch it explicitly to be safe
                    const reservation = await strapi.entityService.findOne('api::reservation.reservation', result.id, {
                        populate: ['user', 'space']
                    }) as any;

                    if (!reservation) {
                        console.warn("[Lifecycle] Reservation not found after update, id:", result.id);
                        return;
                    }

                    const user = reservation.user;
                    if (!user || !user.email) {
                        console.log("[Lifecycle] No user email found for notification.");
                        return;
                    }

                    const emailService = strapi.service('api::email.email-service') as any;
                    if (!emailService) {
                        console.error("[Lifecycle] Email service not found.");
                        return;
                    }

                    const spaceName = reservation.space?.name || 'Espace de coworking';
                    const details = {
                        spaceName,
                        date: new Date(reservation.date).toLocaleDateString('fr-FR', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        }),
                        startTime: reservation.time_slot?.split(" - ")[0] || "08:00",
                        endTime: reservation.time_slot?.split(" - ")[1] || "18:00",
                        location: 'SunSpace Tunis',
                        reservationId: reservation.documentId || reservation.id.toString(),
                    };

                    if (newStatus === 'confirmed') {
                        await emailService.sendReservationConfirmation(user.email, user.fullname || user.username || 'Client', details);
                    } else if (newStatus === 'cancelled') {
                        await emailService.sendReservationCancellation(user.email, user.fullname || user.username || 'Client', details);
                    }
                } catch (err) {
                    console.error("[Lifecycle afterUpdate Email Error]", err.message);
                }
            })();
        }
    }
};
