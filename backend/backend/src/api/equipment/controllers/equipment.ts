/**
 * equipment controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::equipment.equipment",
  ({ strapi }) => ({
    async availability(ctx) {
      const { id } = ctx.params;
      const { start, end } = ctx.query;

      if (!start || !end) {
        return ctx.badRequest(
          "Les paramètres 'start' et 'end' sont obligatoires.",
        );
      }

      const availableQty = await strapi
        .service("api::equipment.equipment")
        .getAvailableQtyForPeriod(id, start as string, end as string);

      return ctx.send({ data: { availableQty } });
    },
  }),
);
