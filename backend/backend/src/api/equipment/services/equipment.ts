/**
 * equipment service
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreService(
  "api::equipment.equipment",
  ({ strapi }) => ({
    async synchronizeAvailability() {
      console.log("🔄 [Service] Synchronizing all equipment availability...");
      const now = new Date();
      const allEquipments = await strapi
        .documents("api::equipment.equipment")
        .findMany();

      for (const eq of allEquipments) {
        // Find bookings overlapping NOW (including soft locks)
        const available = await this.getAvailableQtyForPeriod(
          eq.documentId,
          now.toISOString(),
          now.toISOString(),
        );

        const newStatus =
          available > 0
            ? eq.status === "en_maintenance"
              ? "en_maintenance"
              : "disponible"
            : "en_rupture";

        if (eq.available_quantity !== available || eq.status !== newStatus) {
          await strapi.documents("api::equipment.equipment").update({
            documentId: eq.documentId,
            data: {
              available_quantity: available,
              status: newStatus,
            },
          });
        }
      }
      console.log("✅ [Service] Equipment synchronization complete.");
    },

    async getAvailableQtyForPeriod(
      equipmentIdOrDocId: number | string,
      start_time: string,
      end_time: string,
    ) {
      // Find equipment by either ID or documentId
      const filters: any = {};
      if (
        typeof equipmentIdOrDocId === "number" ||
        !isNaN(Number(equipmentIdOrDocId))
      ) {
        filters.id = Number(equipmentIdOrDocId);
      } else {
        filters.documentId = equipmentIdOrDocId;
      }

      const equipment = await strapi
        .documents("api::equipment.equipment")
        .findMany({
          filters,
          limit: 1,
        })
        .then((res) => res[0]);

      if (!equipment) return 0;
      const totalQty = equipment.total_quantity || 1;
      const docId = equipment.documentId;

      // 1. Confirmed Bookings - we need to sum up the quantities stored in 'extras.equipmentQuantities'
      const activeBookings = await strapi
        .documents("api::booking.booking")
        .findMany({
          filters: {
            status: { $in: ["pending", "confirmed"] },
            equipments: { documentId: docId },
            $or: [
              { start_time: { $lt: end_time }, end_time: { $gt: start_time } },
            ],
          },
        });

      let bookedQty = 0;
      for (const b of activeBookings) {
        const extras = b.extras as any;
        const qMap = extras?.equipmentQuantities || {};
        // Match by numerical ID in the extras map
        const qty = qMap[equipment.id] || 1;
        bookedQty += qty;
      }

      // 2. Soft Locks (unexpired) - use db.query for reliable numerical-ID filtering
      const activeLocks = await strapi.db
        .query("api::equipment-lock.equipment-lock")
        .findMany({
          where: {
            equipment: { id: equipment.id },
            expires_at: { $gt: new Date().toISOString() },
            $or: [
              { start_time: { $lt: end_time }, end_time: { $gt: start_time } },
            ],
          },
        });

      const lockedQty = activeLocks.length;

      return Math.max(0, totalQty - bookedQty - lockedQty);
    },
  }),
);
