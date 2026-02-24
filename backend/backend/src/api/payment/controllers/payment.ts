/**
 * payment controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::payment.payment",
  ({ strapi }) => ({
    async confirm(ctx) {
      const { id } = ctx.params;

      // 1. Fetch the payment with its booking
      const payment: any = await strapi.entityService.findOne(
        "api::payment.payment",
        id as any,
        {
          populate: { booking: true },
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

      // 3. Update the associated booking status to confirmed
      if (payment.booking) {
        await strapi.entityService.update(
          "api::booking.booking",
          payment.booking.id,
          {
            data: {
              status: "confirmed",
            },
          },
        );
        strapi.log.info(
          `✅ Booking ${payment.booking.id} confirmed via payment ${id}`,
        );
      }

      return updatedPayment;
    },
  }),
);
