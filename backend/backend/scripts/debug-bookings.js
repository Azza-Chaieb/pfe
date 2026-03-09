
const fs = require('fs');
const path = require('path');

async function debugBookings(strapi) {
    const now = new Date();
    console.log(`[DEBUG] Current Time: ${now.toISOString()}`);

    try {
        const allBookings = await strapi.documents("api::booking.booking").findMany({
            filters: {},
            populate: ["user", "space"],
            limit: 10
        });

        console.log(`[DEBUG] Total Bookings found (first 10): ${allBookings.length}`);

        for (const b of allBookings) {
            console.log(`[DEBUG] Booking ${b.documentId}: status=${b.status}, end_time=${b.end_time}, user=${b.user?.email}`);

            if (b.status === "confirmed" && b.end_time && new Date(b.end_time) < now) {
                console.log(`[DEBUG] -> SHOULD BE COMPLETED`);
            }
        }

        // Check if email service is available
        const emailService = strapi.service("api::email.email-service");
        console.log(`[DEBUG] Email Service loaded: ${!!emailService}`);
        if (emailService) {
            console.log(`[DEBUG] sendReservationCompleted exists: ${!!emailService.sendReservationCompleted}`);
        }

    } catch (err) {
        console.error("[DEBUG] Error during diagnostic:", err);
    }
}

module.exports = debugBookings;
