import { errors } from "@strapi/utils";

const { ValidationError } = errors;

/**
 * Robustly extract a single ID from Strapi V5 formats.
 */
function extractId(data: any): any {
  if (!data) return null;
  if (typeof data === "object" && (data.set || data.connect)) {
    const list = data.set || data.connect;
    if (Array.isArray(list) && list.length > 0)
      return list[0].documentId || list[0].id || list[0];
  }
  if (Array.isArray(data) && data.length > 0)
    return data[0].documentId || data[0].id || data[0];
  if (typeof data === "object") return data.documentId || data.id || data;
  return data;
}

const checkOverlap = (
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) => {
  const sA = parseInt(startA.replace(":", ""));
  const eA = parseInt(endA.replace(":", ""));
  const sB = parseInt(startB.replace(":", ""));
  const eB = parseInt(endB.replace(":", ""));
  return sA < eB && sB < eA;
};

async function dispatchNotifications(
  result: any,
  type: "created" | "confirmed" | "cancelled",
) {
  try {
    const reservation = (await strapi.entityService.findOne(
      "api::reservation.reservation",
      result.id,
      {
        populate: ["user", "space"],
      },
    )) as any;

    if (!reservation || !reservation.user || !reservation.user.email) {
      strapi.log.warn(
        `[Lifecycle] Skip: Missing user or email for res ${result.id}`,
      );
      return;
    }

    const user = reservation.user;
    const emailService = strapi.service("api::email.email-service") as any;
    const notificationService = strapi.service(
      "api::notification.notification-service",
    ) as any;

    const spaceName = reservation.space?.name || "Espace de coworking";
    const details = {
      spaceName,
      date: new Date(reservation.date).toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      startTime: reservation.time_slot?.split(" - ")[0] || "08:00",
      endTime: reservation.time_slot?.split(" - ")[1] || "18:00",
      location: "SunSpace Tunis",
      reservationId: reservation.documentId || reservation.id.toString(),
    };

    let templates;
    try {
      templates = require("../../../notification/templates/push-templates");
    } catch (e) {
      try {
        templates = require("../../../../notification/templates/push-templates");
      } catch (e2) {
        strapi.log.error(`[Lifecycle] Failed to load templates: ${e2.message}`);
        return;
      }
    }
    const { reservationTemplates } = templates;

    if (type === "created") {
      strapi.log.info(`[Lifecycle] Dispatching CREATION to ${user.email}`);
      if (emailService)
        await emailService.sendReservationConfirmation(
          user.email,
          user.fullname || user.username,
          details,
        );
      if (notificationService) {
        const template = reservationTemplates.created(spaceName);
        await notificationService.notifyReservationUpdate(
          user,
          template.title,
          template.body,
          details,
        );
      }
    } else if (type === "confirmed") {
      strapi.log.info(`[Lifecycle] Dispatching CONFIRMATION to ${user.email}`);
      if (emailService)
        await emailService.sendReservationConfirmation(
          user.email,
          user.fullname || user.username,
          details,
        );
      if (notificationService) {
        const template = reservationTemplates.confirmed(spaceName);
        await notificationService.notifyReservationUpdate(
          user,
          template.title,
          template.body,
          details,
        );
      }
    } else if (type === "cancelled") {
      strapi.log.info(`[Lifecycle] Dispatching CANCELLATION to ${user.email}`);
      if (emailService)
        await emailService.sendReservationCancellation(
          user.email,
          user.fullname || user.username,
          details,
        );
      if (notificationService) {
        const template = reservationTemplates.cancelled(spaceName);
        await notificationService.notifyReservationUpdate(
          user,
          template.title,
          template.body,
          details,
        );
      }
    }
    strapi.log.info(`[Lifecycle] Notifications SENT for ${user.email}`);
  } catch (err) {
    strapi.log.error(`[Lifecycle Notification Error] ${err.message}`);
  }
}

export default {
  async beforeCreate(event) {
    const { data } = event.params;
    const { date, time_slot } = data;
    const spaceId = extractId(data.space);
    const userId = extractId(data.user);

    if (!spaceId || !date || !time_slot || !userId) return;

    try {
      const filters: any = { date: date, status: { $ne: "cancelled" } };
      if (!isNaN(Number(spaceId))) filters.space = { id: Number(spaceId) };
      else filters.space = { documentId: spaceId };

      const existing = (await strapi.entityService.findMany(
        "api::reservation.reservation",
        { filters },
      )) as any[];

      if (existing.length > 0) {
        if (time_slot === "Full Day")
          throw new ValidationError("Cet espace est déjà réservé.");
        const hasFullDay = existing.some((r) => r.time_slot === "Full Day");
        if (hasFullDay)
          throw new ValidationError(
            "Cet espace est déjà réservé pour toute la journée.",
          );

        const [newStart, newEnd] = time_slot.split(" - ");
        for (const res of existing) {
          if (res.time_slot === "Full Day") continue;
          const [extStart, extEnd] = (res.time_slot || "").split(" - ");
          if (
            extStart &&
            extEnd &&
            checkOverlap(newStart, newEnd, extStart, extEnd)
          ) {
            throw new ValidationError(`Conflit d'horaire (${res.time_slot}).`);
          }
        }
      }
    } catch (err) {
      if (err instanceof ValidationError) throw err;
      strapi.log.error("[Lifecycle] beforeCreate Error:", err.message);
      throw err;
    }
  },

  async afterCreate(event) {
    const { result } = event;
    strapi.log.info(`[Lifecycle] afterCreate SUCCESS ID=${result.id}`);
    // Non-blocking dispatch
    dispatchNotifications(result, "created");
  },

  async afterUpdate(event) {
    const { result, params } = event;
    const data = params?.data || {};

    const newStatus = data.status || result.status;
    const isUnpublished = data.publishedAt === null;

    if (
      newStatus === "confirmed" ||
      newStatus === "cancelled" ||
      isUnpublished
    ) {
      const finalStatus = isUnpublished ? "cancelled" : newStatus;
      strapi.log.info(`[Lifecycle] afterUpdate match for ${finalStatus}`);
      dispatchNotifications(result, finalStatus as any);
    }
  },
};
