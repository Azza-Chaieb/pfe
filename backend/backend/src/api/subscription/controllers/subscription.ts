/**
 * subscription controller
 * Custom actions for subscription management (plans, subscribe, etc.)
 * Delegates business logic to the user-subscription service.
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::subscription.subscription",
  ({ strapi }) => ({
    /**
     * GET /api/subscriptions/plans
     */
    async getPlans(ctx) {
      try {
        const { role } = ctx.query as any;
        const filters: any = { publishedAt: { $notNull: true } };

        if (role) {
          filters.$or = [
            { target_role: role },
            { target_role: "all" }
          ];
        }

        const plans = await strapi.entityService.findMany(
          "api::subscription-plan.subscription-plan" as any,
          {
            sort: [{ price: "asc" }],
            filters,
          } as any,
        );
        ctx.body = { data: plans };
      } catch (err) {
        strapi.log.error("getPlans error:", err);
        ctx.internalServerError("Erreur lors du chargement des plans.");
      }
    },

    /**
     * GET /api/subscriptions/me
     */
    async getMySubscription(ctx) {
      try {
        let userId = ctx.state.user?.id;

        // If auth: false, try manual extraction from Bearer token
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
              "Manual JWT verification failed in subscription controller",
            );
          }
        }

        if (!userId) return ctx.unauthorized("Authentification requise.");

        const subscriptionService = strapi.service(
          "api::user-subscription.user-subscription",
        ) as any;
        const sub = await subscriptionService.findLatestByUser(userId);
        ctx.body = { data: sub || null };
      } catch (err) {
        strapi.log.error("getMySubscription error:", err);
        ctx.internalServerError("Erreur serveur.");
      }
    },

    /**
     * POST /api/subscriptions/subscribe
     */
    async subscribe(ctx) {
      try {
        let userId = ctx.state.user?.id;

        // If auth: false, try manual extraction from Bearer token
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
              "Manual JWT verification failed in subscription.subscribe",
            );
          }
        }

        if (!userId) return ctx.unauthorized("Authentification requise.");

        const {
          planId,
          billingCycle = "monthly",
          paymentMethod = "cash",
          paymentReference = "",
        } = ctx.request.body as any;
        if (!planId) return ctx.badRequest("planId est requis.");

        const subscriptionService = strapi.service(
          "api::user-subscription.user-subscription",
        ) as any;
        const newSub = await subscriptionService.subscribe(
          userId,
          planId,
          billingCycle,
          paymentMethod,
          paymentReference,
        );

        ctx.created({ data: newSub, message: "Abonnement créé avec succès." });
      } catch (err: any) {
        strapi.log.error("subscribe error:", err);
        ctx.badRequest(err.message || "Erreur lors de la souscription.");
      }
    },

    /**
     * PUT /api/subscriptions/upgrade
     */
    async upgrade(ctx) {
      try {
        let userId = ctx.state.user?.id;

        // If auth: false, try manual extraction from Bearer token
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
              "Manual JWT verification failed in subscription.upgrade",
            );
          }
        }

        if (!userId) return ctx.unauthorized("Authentification requise.");

        const {
          subscriptionId,
          planId,
          billingCycle = "monthly",
          paymentMethod = "cash",
          paymentReference = "",
        } = ctx.request.body as any;
        if (!subscriptionId || !planId)
          return ctx.badRequest("subscriptionId et planId sont requis.");

        const existing = (await strapi.entityService.findOne(
          "api::user-subscription.user-subscription" as any,
          subscriptionId,
          { populate: ["user"] } as any,
        )) as any;
        if (!existing || existing.user?.id !== userId)
          return ctx.forbidden("Non autorisé.");

        const subscriptionService = strapi.service(
          "api::user-subscription.user-subscription",
        ) as any;
        const updated = await subscriptionService.upgrade(
          subscriptionId,
          planId,
          billingCycle,
          paymentMethod,
          paymentReference,
        );

        ctx.body = {
          data: updated,
          message: "Abonnement mis à jour avec succès.",
        };
      } catch (err: any) {
        strapi.log.error("upgrade error:", err);
        ctx.badRequest(err.message || "Erreur lors de la mise à jour.");
      }
    },

    /**
     * DELETE /api/subscriptions/cancel
     */
    async cancelSubscription(ctx) {
      try {
        strapi.log.info("CANCELLING SUB (subscription controller)...");
        let userId = ctx.state.user?.id;

        // If auth: false, try manual extraction from Bearer token
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
              "Manual JWT verification failed in subscription.cancelSubscription",
            );
          }
        }

        if (!userId) return ctx.unauthorized("Authentification requise.");

        const { subscriptionId } = ctx.request.body as any;
        strapi.log.info("Sub ID received:", subscriptionId);
        if (!subscriptionId)
          return ctx.badRequest("subscriptionId est requis.");

        const existing = (await strapi.entityService.findOne(
          "api::user-subscription.user-subscription" as any,
          subscriptionId,
          { populate: ["user"] } as any,
        )) as any;
        if (!existing || existing.user?.id !== userId)
          return ctx.forbidden("Non autorisé.");

        const subscriptionService = strapi.service(
          "api::user-subscription.user-subscription",
        ) as any;
        await subscriptionService.cancel(subscriptionId);

        ctx.body = { message: "Abonnement annulé avec succès." };
      } catch (err: any) {
        strapi.log.error("cancelSubscription error:", err);
        ctx.badRequest(err.message || "Erreur lors de l'annulation.");
      }
    },

    /**
     * POST /api/subscriptions/renew
     */
    async renew(ctx) {
      try {
        let userId = ctx.state.user?.id;

        // If auth: false, try manual extraction from Bearer token
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
              "Manual JWT verification failed in subscription.renew",
            );
          }
        }

        if (!userId) return ctx.unauthorized("Authentification requise.");

        const { subscriptionId } = ctx.request.body as any;
        if (!subscriptionId)
          return ctx.badRequest("subscriptionId est requis.");

        const existing = (await strapi.entityService.findOne(
          "api::user-subscription.user-subscription" as any,
          subscriptionId,
          { populate: ["user"] } as any,
        )) as any;
        if (!existing || existing.user?.id !== userId)
          return ctx.forbidden("Non autorisé.");

        const subscriptionService = strapi.service(
          "api::user-subscription.user-subscription",
        ) as any;
        const renewed = await subscriptionService.renew(subscriptionId);

        ctx.body = {
          data: renewed,
          message: "Abonnement renouvelé avec succès.",
        };
      } catch (err: any) {
        strapi.log.error("renew error:", err);
        ctx.badRequest(err.message || "Erreur lors du renouvellement.");
      }
    },
  }),
);
