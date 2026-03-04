import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::user-subscription.user-subscription",
  ({ strapi }) => ({
    /**
     * GET /api/subscriptions/plans
     * Returns all published subscription plans
     */
    async getPlans(ctx) {
      try {
        const plans = await strapi.entityService.findMany(
          "api::subscription-plan.subscription-plan" as any,
          {
            sort: { price: "asc" },
            filters: { publishedAt: { $notNull: true } },
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
     * Returns the authenticated user's active subscription
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
            strapi.log.debug("Manual JWT verification failed");
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
     * Body: { planId: string, billingCycle: 'monthly' | 'yearly' }
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
            strapi.log.debug("Manual JWT verification failed in subscribe");
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
        if (err.details) {
          strapi.log.error(
            "Error details:",
            JSON.stringify(err.details, null, 2),
          );
        }
        ctx.badRequest(err.message || "Erreur lors de la souscription.", {
          details: err.details,
        });
      }
    },

    /**
     * PUT /api/subscriptions/upgrade
     * Body: { subscriptionId: number, planId: string, billingCycle: 'monthly' | 'yearly' }
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
            strapi.log.debug("Manual JWT verification failed in upgrade");
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

        // Verify the subscription belongs to this user
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
     * Body: { subscriptionId: number }
     */
    async cancelSubscription(ctx) {
      try {
        strapi.log.info("CANCELLING SUB (user-subscription controller)...");
        const userId = ctx.state.user?.id;
        strapi.log.info("User ID:", userId);
        if (!userId) return ctx.unauthorized("Authentification requise.");

        const { subscriptionId } = ctx.request.body as any;
        strapi.log.info("Sub ID received:", subscriptionId);
        if (!subscriptionId)
          return ctx.badRequest("subscriptionId est requis.");

        // Verify ownership
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
     * Body: { subscriptionId: number }
     * Renews an expired subscription for the same plan & billing cycle
     */
    async renew(ctx) {
      try {
        const userId = ctx.state.user?.id;
        if (!userId) return ctx.unauthorized("Authentification requise.");

        const { subscriptionId } = ctx.request.body as any;
        if (!subscriptionId)
          return ctx.badRequest("subscriptionId est requis.");

        // Verify ownership
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

    /**
     * POST /api/subscriptions/run-cron
     * Manually trigger the auto-rejection logic for testing
     */
    async runCron(ctx) {
      try {
        const now = new Date();
        const results = [];

        console.log("[MANUAL CRON] Running auto-rejection check...");

        // 1. Find expired cash subscriptions
        const expired = await strapi
          .documents("api::user-subscription.user-subscription")
          .findMany({
            filters: {
              status: "pending",
              payment_method: "cash",
              payment_deadline: { $lt: now.toISOString() },
            },
            populate: ["user", "plan"],
          });

        for (const sub of expired) {
          await strapi
            .documents("api::user-subscription.user-subscription")
            .update({
              documentId: sub.documentId,
              data: {
                status: "cancelled",
                rejection_reason:
                  "Délai expiré (Déclenché manuellement via /run-cron).",
              },
            });
          results.push({
            id: sub.documentId,
            status: "cancelled",
            user: (sub as any).user?.email,
          });
        }

        ctx.body = {
          message: `Cron manual run complete. Processed ${results.length} items.`,
          processed: results,
          time: now.toISOString(),
        };
      } catch (err: any) {
        strapi.log.error("Manual cron error:", err);
        ctx.internalServerError(err.message);
      }
    },
  }),
);
