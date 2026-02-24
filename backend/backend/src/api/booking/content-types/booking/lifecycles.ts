import { errors } from "@strapi/utils";
const { ApplicationError } = errors;

export default {
  async beforeCreate(event) {
    try {
      await handleBookingLogic(event);
    } catch (err) {
      console.error("[Booking Lifecycle] Error in beforeCreate:", err.message);
      throw err;
    }
  },

  async beforeUpdate(event) {
    try {
      await handleBookingLogic(event);
    } catch (err) {
      console.error("[Booking Lifecycle] Error in beforeUpdate:", err.message);
      throw err;
    }
  },

  async afterCreate(event) {
    const { result } = event;
    await sendConfirmationEmail(result);
  },
};

async function handleBookingLogic(event) {
  try {
    const { data, where } = event.params;
    const bookingId = where?.id;

    console.log("[Booking Lifecycle] RAW DATA received:", JSON.stringify(data));

    const extractId = (relation: any) => {
      if (!relation) return null;
      if (typeof relation === "number" || typeof relation === "string")
        return relation;
      if (typeof relation === "object") {
        if (relation.id) return relation.id;
        if (Array.isArray(relation.connect) && relation.connect.length > 0) {
          const first = relation.connect[0];
          return typeof first === "object" ? first.id : first;
        }
        if (Array.isArray(relation.set) && relation.set.length > 0) {
          const first = relation.set[0];
          return typeof first === "object" ? first.id : first;
        }
      }
      return null;
    };

    // 1. Validate Time Frame
    if (data.start_time && data.end_time) {
      const start = new Date(data.start_time);
      const end = new Date(data.end_time);

      if (start >= end) {
        throw new ApplicationError(
          "La date de début doit être antérieure à la date de fin.",
        );
      }

      // 2. Conflict Checking
      const spaceId = extractId(data.space);
      const currentId = where?.id || data?.id;
      const currentDocId = (data as any)?.documentId;

      if (spaceId) {
        const filters: any = {
          space: spaceId,
          status: { $in: ["pending", "confirmed"] },
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

        // EXCLUDE CURRENT RECORD
        if (currentId || currentDocId) {
          const exclusion: any = { $and: [] };
          if (currentId) exclusion.$and.push({ id: { $ne: currentId } });
          if (currentDocId)
            exclusion.$and.push({ documentId: { $ne: currentDocId } });

          filters.$and = filters.$and || [];
          filters.$and.push(exclusion);
        }

        console.log(
          `[Booking Lifecycle] Checking conflicts for space ${spaceId} between ${data.start_time} and ${data.end_time} (Excluding: ID ${currentId || "none"}, DocID ${currentDocId || "none"})`,
        );
        try {
          const existingBookings = await strapi.entityService.findMany(
            "api::booking.booking",
            {
              filters,
            },
          );

          if (existingBookings && existingBookings.length > 0) {
            console.log(
              `[Booking Lifecycle] CONFLICT DETECTED! Found ${existingBookings.length} bookings.`,
            );
            existingBookings.forEach((b: any) => {
              console.log(`  -> Conflicting Booking ID: ${b.id}`);
              console.log(`     Status: ${b.status}`);
              console.log(`     Start: ${b.start_time}`);
              console.log(`     End: ${b.end_time}`);
            });
            throw new ApplicationError(
              "Cet espace est déjà réservé pour la période sélectionnée (conflit de créneau).",
            );
          } else {
            console.log(
              `[Booking Lifecycle] No real conflicts found for space ${spaceId}.`,
            );
          }
        } catch (err) {
          console.error(`[Booking Lifecycle] Conflict check error:`, err);
          throw err;
        }
      }

      // 3. Price Calculation
      const currentSpaceId = extractId(data.space);
      if (currentSpaceId) {
        console.log(
          `[Booking Lifecycle] Calculating price for space: ${currentSpaceId}`,
        );
        let totalPrice = 0;
        const space = await strapi.entityService.findOne(
          "api::space.space",
          currentSpaceId,
          {
            populate: ["equipments"],
          },
        );

        if (space) {
          const durationMs = end.getTime() - start.getTime();
          const durationHours = durationMs / (1000 * 60 * 60);
          const durationDays = Math.ceil(durationHours / 24);

          console.log(
            `[Booking Lifecycle] Duration: ${durationHours}h (${durationDays}d)`,
          );

          // Base Space Price
          const pHourly = parseFloat(String(space.pricing_hourly || 0));
          const pDaily = parseFloat(String(space.pricing_daily || 0));

          if (durationHours < 8 && pHourly > 0) {
            totalPrice += durationHours * pHourly;
          } else if (pDaily > 0) {
            totalPrice += durationDays * pDaily;
          } else if (pHourly > 0) {
            totalPrice += durationHours * pHourly;
          }

          console.log(`[Booking Lifecycle] Base Price: ${totalPrice}`);

          // Equipment Price
          let equipmentIds = [];
          if (data.equipments) {
            if (data.equipments.connect) {
              equipmentIds = data.equipments.connect.map((e) =>
                typeof e === "object" ? e.id : e,
              );
            } else if (Array.isArray(data.equipments)) {
              equipmentIds = data.equipments.map((e) =>
                typeof e === "object" ? e.id : e,
              );
            }
          }

          if (equipmentIds && equipmentIds.length > 0) {
            console.log(
              `[Booking Lifecycle] Fetching equipment details for ids: ${equipmentIds.join(", ")}`,
            );
            const requestedEquipments = await strapi.entityService.findMany(
              "api::equipment.equipment",
              {
                filters: { id: { $in: equipmentIds } },
              },
            );

            for (const eq of requestedEquipments) {
              const eqPrice = parseFloat(String(eq.price || 0));
              if (eqPrice > 0) {
                if (eq.price_type === "hourly") {
                  totalPrice += durationHours * eqPrice;
                } else if (eq.price_type === "daily") {
                  totalPrice += durationDays * eqPrice;
                } else {
                  totalPrice += eqPrice; // one-time
                }
              }
            }
          }

          if (isNaN(totalPrice)) {
            console.warn(
              "[Booking Lifecycle] Total price calculated as NaN, defaulting to 0",
            );
            totalPrice = 0;
          }

          console.log(`[Booking Lifecycle] Final Total Price: ${totalPrice}`);
          data.total_price = parseFloat(totalPrice.toFixed(2));
        } else {
          console.warn(
            `[Booking Lifecycle] Space with ID ${data.space} not found for price calculation!`,
          );
        }
      }
    }
  } catch (err) {
    console.error("[Booking Lifecycle] Logic failure:", err);
    throw err;
  }
}

async function sendConfirmationEmail(result) {
  try {
    const fullBooking: any = await strapi.entityService.findOne(
      "api::booking.booking",
      result.id,
      {
        populate: ["user", "space"],
      },
    );

    if (!fullBooking || !fullBooking.user || !fullBooking.user.email) return;

    const emailService = strapi.service("api::email.email-service");
    if (emailService) {
      const reservationDetails = {
        spaceName: fullBooking.space?.name || "Espace de coworking",
        date: new Date(fullBooking.start_time).toLocaleDateString("fr-FR"),
        startTime: new Date(fullBooking.start_time).toLocaleTimeString(
          "fr-FR",
          { hour: "2-digit", minute: "2-digit" },
        ),
        endTime: new Date(fullBooking.end_time).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        location: "Sunspace Tunis",
        reservationId: fullBooking.id.toString(),
      };

      await emailService.sendReservationConfirmation(
        fullBooking.user.email,
        fullBooking.user.fullname || fullBooking.user.username,
        reservationDetails,
      );
    }
  } catch (error) {
    strapi.log.error("Failed to send booking confirmation email:", error);
  }
}
