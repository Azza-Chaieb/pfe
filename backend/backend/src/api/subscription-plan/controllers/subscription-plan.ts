import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::subscription-plan.subscription-plan",
  ({ strapi }) => ({
    async create(ctx) {
      const user = ctx.state.user;
      if (user && user.user_type === "admin") {
        const { data } = ctx.request.body;
        const response = await strapi
          .documents("api::subscription-plan.subscription-plan")
          .create({
            data: { ...data, publishedAt: new Date() },
          });
        return ctx.send(response);
      }
      return super.create(ctx);
    },

    async update(ctx) {
      const user = ctx.state.user;
      const { id } = ctx.params;

      if (user && user.user_type === "admin") {
        const { data } = ctx.request.body;
        const response = await strapi
          .documents("api::subscription-plan.subscription-plan")
          .update({
            documentId: id,
            data,
          });
        return ctx.send(response);
      }
      return super.update(ctx);
    },

    async delete(ctx) {
      const user = ctx.state.user;
      const { id } = ctx.params;
      if (user && user.user_type === "admin") {
        const response = await strapi
          .documents("api::subscription-plan.subscription-plan")
          .delete({
            documentId: id,
          });
        return ctx.send(response);
      }
      return super.delete(ctx);
    },
  }),
);
