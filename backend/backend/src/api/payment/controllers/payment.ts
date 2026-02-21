/**
 * payment controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::payment.payment",
  ({ strapi }) => ({
    async confirm(ctx) {
      const { id } = ctx.params;

      // 1. Fetch the payment with its reservation
      const payment: any = await strapi.entityService.findOne(
        "api::payment.payment",
        id as any,
        {
          populate: { reservation: true },
        },
      );

      if (!payment) {
        return ctx.notFound("Payment not found");
      }

      if (payment.status === "confirmed") {
        return ctx.badRequest("Payment is already confirmed");
      }

      // 2. Update the payment status to confirmed
      const updatedPayment = await strapi.entityService.update(
        "api::payment.payment",
        id,
        {
          data: {
            status: "confirmed",
            publishedAt: new Date(),
          },
        },
      );

      // 3. Update the associated reservation status to confirmed
      if (payment.reservation) {
        await strapi.entityService.update(
          "api::reservation.reservation",
          payment.reservation.id,
          {
            data: {
              status: "confirmed",
            },
          },
        );
        strapi.log.info(
          `✅ Reservation ${payment.reservation.id} confirmed via payment ${id}`,
        );
      }

      return updatedPayment;
    },
  }),
);
