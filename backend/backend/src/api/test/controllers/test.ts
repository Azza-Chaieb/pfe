/**
 * test controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::test.test",
  ({ strapi }) => ({
    async create(ctx) {
      const { data } = ctx.request.body;

      // Validation personnalisée
      if (!data.name || !data.password) {
        return ctx.badRequest("Les champs name et password sont requis");
      }

      if (data.password.length < 8) {
        return ctx.badRequest("Le password doit avoir au moins 8 caractères");
      }

      try {
        const response = await super.create(ctx);
        return response;
      } catch (error) {
        return ctx.badRequest(error.message);
      }
    },

    async update(ctx) {
      const { data } = ctx.request.body;

      if (data.password && data.password.length < 8) {
        return ctx.badRequest("Le password doit avoir au moins 8 caractères");
      }

      try {
        const response = await super.update(ctx);
        return response;
      } catch (error) {
        return ctx.badRequest(error.message);
      }
    },
  }),
);
