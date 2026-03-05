import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::equipment-lock.equipment-lock",
  ({ strapi }) => ({
    async lock(ctx) {
      try {
        const { equipmentId, start_time, end_time } = ctx.request.body.data;
        let user = ctx.state.user;

        // Manual JWT verification if auth is bypassed (auth: false in routes)
        if (!user) {
          const authHeader = ctx.request.header.authorization;
          if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
              const verified = await strapi
                .plugin("users-permissions")
                .service("jwt")
                .verify(token);
              if (verified && verified.id) {
                user = await strapi
                  .query("plugin::users-permissions.user")
                  .findOne({ where: { id: verified.id } });
              }
            } catch (err) {}
          }
        }

        if (!user) return ctx.unauthorized("Vous devez être connecté.");
        if (!equipmentId || !start_time || !end_time)
          return ctx.badRequest("Données manquantes.");

        // 1. Resolve equipment using numerical ID (most reliable)
        const numericId = Number(equipmentId);
        let equipment: any;

        if (!isNaN(numericId)) {
          equipment = await strapi.db
            .query("api::equipment.equipment")
            .findOne({ where: { id: numericId } });
        } else {
          equipment = await strapi.db
            .query("api::equipment.equipment")
            .findOne({ where: { documentId: equipmentId } });
        }

        if (!equipment) return ctx.badRequest("Équipement non trouvé.");

        // 2. Check availability using the service
        const equipmentSvc = strapi.service("api::equipment.equipment");
        const available = await equipmentSvc.getAvailableQtyForPeriod(
          equipment.id, // pass numerical ID – service handles both
          start_time,
          end_time,
        );

        if (available <= 0) {
          return ctx.badRequest(
            "Cet équipement n'est plus disponible pour cette période.",
          );
        }

        // 3. Create the lock using the low-level db query (most reliable for relations)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        const lock = await strapi.db
          .query("api::equipment-lock.equipment-lock")
          .create({
            data: {
              start_time,
              end_time,
              expires_at: expiresAt.toISOString(),
            },
            // populate relations after creation
          });

        // Link the equipment relation explicitly
        await strapi.db.query("api::equipment-lock.equipment-lock").update({
          where: { id: lock.id },
          data: {
            equipment: equipment.id,
            user: user.id,
          },
        });

        console.log(
          `[Lock] ✅ Created lock #${lock.id} for Equipment #${equipment.id} (${equipment.name}), User #${user.id}`,
        );

        return ctx.send({ data: { id: lock.id } });
      } catch (error) {
        console.error("Lock error:", error);
        return ctx.internalServerError(`Erreur serveur: ${error.message}`);
      }
    },

    async unlock(ctx) {
      try {
        const { equipmentId } = ctx.request.body.data;
        let user = ctx.state.user;

        if (!user) {
          const authHeader = ctx.request.header.authorization;
          if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
              const verified = await strapi
                .plugin("users-permissions")
                .service("jwt")
                .verify(token);
              if (verified && verified.id) {
                user = await strapi
                  .query("plugin::users-permissions.user")
                  .findOne({ where: { id: verified.id } });
              }
            } catch (err) {}
          }
        }

        if (!user) return ctx.unauthorized("Vous devez être connecté.");

        // Resolve equipment
        const numericId = Number(equipmentId);
        let equipment: any;

        if (!isNaN(numericId)) {
          equipment = await strapi.db
            .query("api::equipment.equipment")
            .findOne({ where: { id: numericId } });
        } else {
          equipment = await strapi.db
            .query("api::equipment.equipment")
            .findOne({ where: { documentId: equipmentId } });
        }

        if (!equipment) return ctx.send({ success: true });

        // Delete the most recent lock for this user/equipment pair
        const lock = await strapi.db
          .query("api::equipment-lock.equipment-lock")
          .findOne({
            where: {
              equipment: { id: equipment.id },
              user: { id: user.id },
              expires_at: { $gt: new Date().toISOString() },
            },
            orderBy: { createdAt: "desc" },
          });

        if (lock) {
          await strapi.db
            .query("api::equipment-lock.equipment-lock")
            .delete({ where: { id: lock.id } });
          console.log(
            `[Unlock] ✅ Deleted lock #${lock.id} for Equipment #${equipment.id}`,
          );
        }

        return ctx.send({ success: true });
      } catch (error) {
        console.error("Unlock error:", error);
        return ctx.internalServerError(`Erreur serveur: ${error.message}`);
      }
    },
  }),
);
