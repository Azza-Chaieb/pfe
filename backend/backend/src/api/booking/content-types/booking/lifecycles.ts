import { errors } from "@strapi/utils";
const { ApplicationError } = errors;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safely extracts a usable ID (number or documentId string) from any relation shape */
const extractId = (relation: any): string | number | null => {
  if (!relation) return null;
  if (typeof relation === "number" || typeof relation === "string") return relation;
  if (typeof relation === "object") {
    if (relation.id) return relation.id;
    if (Array.isArray(relation.connect) && relation.connect.length > 0) {
      const first = relation.connect[0];
      return typeof first === "object" ? (first.id ?? first.documentId) : first;
    }
    if (Array.isArray(relation.set) && relation.set.length > 0) {
      const first = relation.set[0];
      return typeof first === "object" ? (first.id ?? first.documentId) : first;
    }
    if (relation.documentId) return relation.documentId;
  }
  return null;
};

/** Find a Strapi entity by either numeric id or string documentId */
const findEntity = async (uid: string, id: string | number, opts: any = {}): Promise<any> => {
  const es = (strapi as any).entityService;
  const isNumeric = !isNaN(Number(id)) && String(id).trim() !== "";
  if (isNumeric) {
    return es.findOne(uid, Number(id), opts);
  }
  // Fall back to querying by documentId
  const results = await es.findMany(uid, {
    ...opts,
    filters: { documentId: { $eq: id } },
    pagination: { limit: 1 },
  });
  return Array.isArray(results) && results.length > 0 ? results[0] : null;
};

// ---------------------------------------------------------------------------
// Lifecycle export
// ---------------------------------------------------------------------------

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
    // ONLY send confirmation email if status is confirmed
    if (result.status === 'confirmed') {
      await sendConfirmationEmail(result);
    }
    await (strapi as any).service("api::equipment.equipment").synchronizeAvailability();
  },

  async afterUpdate(event) {
    const { result, params } = event;
    if (params.data?.status === "cancelled" && result.status === "cancelled") {
      await sendCancellationEmail(result);
    }
    if (params.data?.status === "confirmed" && result.status === "confirmed") {
      await sendConfirmationEmail(result);
    }
    await (strapi as any).service("api::equipment.equipment").synchronizeAvailability();
  },

  async afterDelete(event) {
    await (strapi as any).service("api::equipment.equipment").synchronizeAvailability();
  },
};

// ---------------------------------------------------------------------------
// Core booking logic
// ---------------------------------------------------------------------------

async function handleBookingLogic(event: any) {
  try {
    const { data, where } = event.params;
    const bookingId = where?.id;

    console.log("[Booking Lifecycle] RAW DATA received:", JSON.stringify(data));

    if (!data.start_time || !data.end_time) return;

    const start = new Date(data.start_time);
    const end = new Date(data.end_time);

    // 1. Validate Time Frame
    if (start >= end) {
      throw new ApplicationError("La date de début doit être antérieure à la date de fin.");
    }

    const spaceId = extractId(data.space);

    // 2. Conflict Checking
    if (spaceId) {
      const currentId = where?.id;
      const currentDocId = (data as any)?.documentId;

      const filters: any = {
        space: spaceId,
        status: { $in: ["pending", "confirmed"] },
        $or: [
          { $and: [{ start_time: { $lte: data.start_time } }, { end_time: { $gt: data.start_time } }] },
          { $and: [{ start_time: { $lt: data.end_time } }, { end_time: { $gte: data.end_time } }] },
          { $and: [{ start_time: { $gte: data.start_time } }, { end_time: { $lte: data.end_time } }] },
        ],
      };

      if (currentId || currentDocId) {
        const exclusion: any = { $and: [] };
        if (currentId) exclusion.$and.push({ id: { $ne: currentId } });
        if (currentDocId) exclusion.$and.push({ documentId: { $ne: currentDocId } });
        filters.$and = filters.$and || [];
        filters.$and.push(exclusion);
      }

      try {
        const existingBookings = await (strapi as any).entityService.findMany(
          "api::booking.booking",
          { filters },
        );
        if (existingBookings && existingBookings.length > 0) {
          throw new ApplicationError("Cet espace est déjà réservé pour la période sélectionnée (conflit de créneau).");
        }
      } catch (err: any) {
        if (err instanceof ApplicationError) throw err;
        console.error("[Booking Lifecycle] Conflict check error (ignored):", err.message);
      }
    }

    // 3. Equipment Availability
    const equipmentIds: (string | number)[] = [];
    if (data.equipments) {
      if (data.equipments.connect) {
        data.equipments.connect.forEach((e: any) =>
          equipmentIds.push(typeof e === "object" ? (e.id ?? e.documentId) : e)
        );
      } else if (Array.isArray(data.equipments)) {
        data.equipments.forEach((e: any) =>
          equipmentIds.push(typeof e === "object" ? (e.id ?? e.documentId) : e)
        );
      }
    }

    const userId = extractId(data.user);
    if (equipmentIds.length > 0) {
      for (const eqId of equipmentIds) {
        const equipment = await findEntity("api::equipment.equipment", eqId);
        if (!equipment) continue;

        const qty = (data.extras?.equipmentQuantities?.[String(eqId)]) ?? 1;
        if (qty <= 0) continue;

        // 1. Confirmed Bookings
        const conflictingBookings = await (strapi as any).entityService.findMany(
          "api::booking.booking",
          {
            filters: {
              equipments: { id: { $in: [eqId] } },
              status: { $in: ["pending", "confirmed"] },
              $or: [
                { $and: [{ start_time: { $lte: data.start_time } }, { end_time: { $gt: data.start_time } }] },
                { $and: [{ start_time: { $lt: data.end_time } }, { end_time: { $gte: data.end_time } }] },
              ],
              ...(bookingId ? { id: { $ne: bookingId } } : {}),
            },
          },
        );

        const bookedQty = conflictingBookings.reduce((sum: number, b: any) => {
          const qMap = b.extras?.equipmentQuantities || {};
          const bQty = qMap[String(equipment.id)] ?? qMap[String(equipment.documentId)] ?? 1;
          return sum + bQty;
        }, 0);

        // 2. Soft Locks (excluding current user)
        const activeLocks = await (strapi as any).db.query("api::equipment-lock.equipment-lock").findMany({
          where: {
            equipment: { id: equipment.id },
            expires_at: { $gt: new Date().toISOString() },
            $or: [
              { start_time: { $lt: data.end_time }, end_time: { $gt: data.start_time } },
            ],
            ...(userId ? { user: { id: { $ne: userId } } } : {}),
          },
        });
        const lockedQty = activeLocks.length;

        if (bookedQty + qty + lockedQty > (equipment.total_quantity || 1)) {
          throw new ApplicationError(
            `L'équipement "${equipment.name}" n'est pas disponible pour les dates et heures sélectionnées.`,
          );
        }
      }
    }

    // 4. RBAC
    if (spaceId && userId) {
      try {
        const space = await findEntity("api::space.space", spaceId);
        const user = await findEntity("plugin::users-permissions.user", userId);

        if (space && user) {
          const allowedRoles: string[] = Array.isArray(space.accessible_by) ? space.accessible_by : [];
          const userType: string = (user as any).user_type;

          if (allowedRoles.length > 0 && !allowedRoles.includes(userType)) {
            throw new ApplicationError(
              `Votre profil (${userType}) ne vous permet pas de réserver cet espace. Cet espace est réservé aux : ${allowedRoles.join(", ")}.`,
            );
          }
          console.log(`[Booking Lifecycle] RBAC PASSED for ${userType}`);
        }
      } catch (err: any) {
        if (err instanceof ApplicationError) throw err;
        console.error("[Booking Lifecycle] RBAC check error (ignored):", err.message);
      }
    }

    // 5. Price Calculation
    if (spaceId) {
      try {
        const space = await findEntity("api::space.space", spaceId);
        if (!space) {
          console.warn(`[Booking Lifecycle] Space "${spaceId}" not found for price calculation.`);
          return;
        }

        const durationMs = end.getTime() - start.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        const durationDays = Math.ceil(durationHours / 24);

        let totalPrice = 0;

        // --- Base Space Price ---
        let pHourly = parseFloat(String(space.pricing_hourly || 0));
        let pDaily = parseFloat(String(space.pricing_daily || 0));

        // Emergency fallback
        if (pHourly === 0 && pDaily === 0) {
          const type: string = space.type || "";
          if (type === "event-space") { pHourly = 20; pDaily = 150; }
          else if (type === "meeting-room") { pHourly = 15; pDaily = 100; }
          else if (type === "hot-desk" || type === "fixed-desk") { pHourly = 5; pDaily = 40; }
        }

        const participants = parseInt(String(data.participants || data.extras?.contact?.participants || 1), 10) || 1;

        if (durationHours < 8 && pHourly > 0) {
          totalPrice += durationHours * pHourly * participants;
        } else if (pDaily > 0) {
          totalPrice += durationDays * pDaily * participants;
        } else if (pHourly > 0) {
          totalPrice += durationHours * pHourly * participants;
        }

        console.log(`[Booking Lifecycle] Space Base: ${totalPrice.toFixed(2)} (${durationHours.toFixed(1)}h, ${participants}p)`);

        // --- Extras from data.extras (Source of Truth) ---
        const extras = data.extras || {};
        const eqQtys = extras.equipmentQuantities || {};
        const srvQtys = extras.serviceQuantities || {};
        const srvParams = extras.serviceParams || {};

        // 1. Equipments
        for (const [eqId, qtyVal] of Object.entries(eqQtys)) {
          if (String(eqId).startsWith("fallback-")) continue;
          const qty = parseInt(String(qtyVal), 10);
          if (qty <= 0) continue;

          const eq = await findEntity("api::equipment.equipment", eqId);
          if (!eq) continue;

          const eqPrice = parseFloat(String(eq.price || 0));
          if (eqPrice > 0) {
            let subtotal = 0;
            if (eq.price_type === "hourly") subtotal = durationHours * eqPrice * qty;
            else if (eq.price_type === "daily") subtotal = durationDays * eqPrice * qty;
            else subtotal = eqPrice * qty;

            console.log(`[Booking Lifecycle] Added Equipment: ${eq.name}, subtotal=${subtotal}`);
            totalPrice += subtotal;
          }
        }

        // 2. Services (Database)
        for (const [srvId, qtyVal] of Object.entries(srvQtys)) {
          if (String(srvId).startsWith("fallback-")) continue;
          const qty = parseInt(String(qtyVal), 10);
          if (qty <= 0) continue;

          const srv = await findEntity("api::service.service", srvId);
          if (!srv) continue;

          const srvPrice = parseFloat(String(srv.price || 0));
          if (srvPrice <= 0) continue;

          const entries = srvParams[String(srvId)] || [{ quantite: qty }];
          const pt: string = srv.price_type || "one-time";

          entries.forEach((entry: any) => {
            const entryQty = parseFloat(String(entry.pages || entry.copies || entry.quantite || 1));
            let subtotal = 0;
            if (pt === "hourly") subtotal = durationHours * srvPrice * entryQty;
            else if (pt === "daily") subtotal = durationDays * srvPrice * entryQty;
            else subtotal = srvPrice * entryQty;

            console.log(`[Booking Lifecycle] Added Service (DB): ${srv.name}, subtotal=${subtotal}`);
            totalPrice += subtotal;
          });
        }

        // 3. Fallback Services
        const fallbacks: Record<string, { price: number; name: string }> = {
          "fallback-print": { price: 0.2, name: "Impression" },
          "fallback-catering": { price: 15, name: "Catering / Déjeuner" },
          "fallback-it-support": { price: 25, name: "Support Technique IT" },
          "fallback-coffee": { price: 5, name: "Cafétérie Premium" },
        };

        for (const [fId, fInfo] of Object.entries(fallbacks)) {
          const qty = parseInt(String(srvQtys[fId] || 0), 10);
          if (qty > 0) {
            const entries = srvParams[fId] || [{ quantite: qty }];
            entries.forEach((entry: any) => {
              const entryQty = parseFloat(String(entry.pages || entry.copies || entry.quantite || 1));
              const subtotal = fInfo.price * entryQty;
              console.log(`[Booking Lifecycle] Added Fallback Service: ${fInfo.name}, subtotal=${subtotal}`);
              totalPrice += subtotal;
            });
          }
        }

        if (isNaN(totalPrice)) totalPrice = 0;

        console.log(`[Booking Lifecycle] Final Calculated Total: ${totalPrice.toFixed(2)} (Frontend sent: ${data.total_price})`);
        data.total_price = parseFloat(totalPrice.toFixed(2));

      } catch (err: any) {
        if (err instanceof ApplicationError) throw err;
        console.error("[Booking Lifecycle] Price calculation error:", err.message);
      }
    }

  } catch (err) {
    console.error("[Booking Lifecycle] Logic failure:", err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Email helpers
// ---------------------------------------------------------------------------

async function sendConfirmationEmail(result: any) {
  try {
    const fullBooking: any = await (strapi as any).entityService.findOne(
      "api::booking.booking",
      result.id,
      { populate: ["user", "space"] },
    );
    if (!fullBooking?.user?.email) return;

    const prefs = fullBooking.user.emailPreferences as any;
    if (prefs?.reservations === false) return;

    const emailService = (strapi as any).service("api::email.email-service");
    if (!emailService) return;

    await emailService.sendReservationConfirmation(
      fullBooking.user.email,
      fullBooking.user.fullname || fullBooking.user.username,
      {
        spaceName: fullBooking.space?.name || "Espace de coworking",
        date: new Date(fullBooking.start_time).toLocaleDateString("fr-FR"),
        startTime: new Date(fullBooking.start_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        endTime: new Date(fullBooking.end_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        location: "Sunspace Tunis",
        reservationId: fullBooking.id.toString(),
      },
    );
  } catch (error) {
    strapi.log.error("Failed to send booking confirmation email:", error);
  }
}

async function sendCancellationEmail(result: any) {
  try {
    const fullBooking: any = await (strapi as any).entityService.findOne(
      "api::booking.booking",
      result.id,
      { populate: ["user", "space"] },
    );
    if (!fullBooking?.user?.email) return;

    const prefs = fullBooking.user.emailPreferences as any;
    if (prefs?.reservations === false) return;

    const emailService = (strapi as any).service("api::email.email-service");
    if (!emailService) return;

    await emailService.sendReservationCancellation(
      fullBooking.user.email,
      fullBooking.user.fullname || fullBooking.user.username,
      {
        spaceName: fullBooking.space?.name || "Espace de coworking",
        date: new Date(fullBooking.start_time).toLocaleDateString("fr-FR"),
        startTime: new Date(fullBooking.start_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        endTime: new Date(fullBooking.end_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        location: "Sunspace Tunis",
        reservationId: fullBooking.id.toString(),
      },
    );
    strapi.log.info(`[Booking Lifecycle] Cancellation email sent to ${fullBooking.user.email}`);
  } catch (error) {
    strapi.log.error("Failed to send booking cancellation email:", error);
  }
}
