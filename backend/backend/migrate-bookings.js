
const migrateBookings = async () => {
    try {
        const bookings = await strapi.entityService.findMany("api::booking.booking", {
            populate: ["space"],
        });

        for (const b of bookings) {
            const updateData = {};

            // If booking_status is empty but old status existed as a field (it was named 'status')
            // Note: in Strapi 5, if 'status' was an enum, it might still have its value in the DB table
            // even if hidden in the UI by the system status.
            // But more likely we just want to set them to 'pending' if empty.
            if (!b.booking_status) {
                updateData.booking_status = "pending";
            }

            // Backfill space_name if missing
            if (!b.space_name && b.space) {
                updateData.space_name = b.space.name;
            }

            if (Object.keys(updateData).length > 0) {
                await strapi.entityService.update("api::booking.booking", b.id, {
                    data: updateData,
                });
                console.log(`Updated booking ${b.id}:`, updateData);
            }
        }
        console.log("Migration finished!");
    } catch (err) {
        console.error("Migration failed:", err.message);
    }
};

migrateBookings();
