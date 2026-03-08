/**
 * booking controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::booking.booking",
  ({ strapi }) => ({
    /**
     * GET /api/bookings/:id/invoice
     * Download PDF invoice for a specific booking
     */
    async downloadInvoice(ctx) {
      try {
        let userId = ctx.state.user?.id;

        // Extraction manuelle du token si auth: false sur la route
        if (!userId && ctx.request.header.authorization) {
          try {
            const token = ctx.request.header.authorization.replace(
              "Bearer ",
              "",
            );
            const decoded = await strapi
              .plugin("users-permissions")
              .service("jwt")
              .verify(token);
            userId = decoded.id;
          } catch (err) {
            strapi.log.debug(
              "Manual JWT verification failed in booking invoice",
            );
          }
        }

        if (!userId) return ctx.unauthorized("Authentification requise.");

        const { id } = ctx.params as any;
        if (!id) return ctx.badRequest("L'ID de la réservation est requis.");

        const bookingService = strapi.service("api::booking.booking") as any;

        const doc = await bookingService.generateInvoice(id, userId);

        ctx.set("Content-Type", "application/pdf");
        ctx.set(
          "Content-Disposition",
          `attachment; filename="facture-reservation-${id}.pdf"`,
        );

        ctx.body = doc;
      } catch (err: any) {
        strapi.log.error("downloadInvoice error (Booking):", err);
        ctx.badRequest(
          err.message || "Erreur lors de la génération de la facture.",
          {
            stack: err.stack,
            name: err.name,
            details: err.details || "No details",
          },
        );
      }
    },
  }),
);
