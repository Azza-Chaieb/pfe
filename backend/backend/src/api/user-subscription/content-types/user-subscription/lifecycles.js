/**
 * Lifecycle hooks for user-subscription
 */

console.log("🧩 [LIFECYCLE] user-subscription lifecycles.js LOADED");

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    strapi.log.debug(`[Lifecycle] beforeCreate for user-subscription. Params keys: ${Object.keys(event.params)}`);

    // Set initial status to pending
    data.status = "pending";

    // If payment method is cash, set the 2-hour deadline
    if (data.payment_method === "cash") {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 2);
      data.payment_deadline = deadline;
    }

    // Set start date to now if not provided
    if (!data.start_date) {
      data.start_date = new Date().toISOString().split("T")[0];
    }

    // Set end date based on plan duration if not provided
    if (!data.end_date && data.plan) {
      try {
        const plan = await strapi.entityService.findOne(
          "api::subscription-plan.subscription-plan",
          data.plan,
        );
        if (plan) {
          const duration = plan.duration_days || 30;
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + duration);
          data.end_date = endDate.toISOString().split("T")[0];
          data.remaining_credits = plan.max_credits || 0;
        }
      } catch (err) {
        console.error("Error fetching plan in lifecycle:", err);
      }
    }
  },

  async afterCreate(event) {
    const { result } = event;
    const documentId = result.documentId || result.id;
    strapi.log.debug(`[Lifecycle] afterCreate triggered for subscription ID: ${documentId}`);
    try {
      // Fetch the full subscription with user and plan details using Strapi 5 Documents API
      const subscription = await strapi.documents("api::user-subscription.user-subscription").findOne({
        documentId: documentId,
        populate: ["user", "plan"],
      });

      if (subscription && subscription.user && subscription.plan) {
        strapi.log.debug(`[Lifecycle] Found user ${subscription.user.email} and plan ${subscription.plan.name}`);
        const emailService = strapi.service("api::email.email-service");
        if (!emailService) {
          strapi.log.error("[Lifecycle] EmailService NOT FOUND!");
          return;
        }
        await emailService.sendSubscriptionRequest(
          subscription.user.email,
          subscription.user.fullname || subscription.user.username,
          subscription.plan.name,
        );
      } else {
        strapi.log.warn(`[Lifecycle] Subscription ${documentId} missing user or plan.`);
      }
    } catch (err) {
      strapi.log.error("Error in afterCreate lifecycle:", err);
    }
  },

  async afterUpdate(event) {
    const { result, params } = event;
    const { data } = params;
    const documentId = result.documentId || result.id;
    strapi.log.debug(`[Lifecycle] afterUpdate triggered for ID: ${documentId}. Status: ${data.status}`);

    if (data.status) {
      try {
        const subscription = await strapi.documents("api::user-subscription.user-subscription").findOne({
          documentId: documentId,
          populate: ["user", "plan"],
        });

        if (!subscription || !subscription.user || !subscription.plan) {
          strapi.log.warn(`[Lifecycle] afterUpdate: Subscription ${documentId} missing details.`);
          return;
        }

        const { user, plan, status, rejection_reason } = subscription;
        const emailService = strapi.service("api::email.email-service");

        if (status === "active") {
          strapi.log.debug(`[Lifecycle] Sending Activation email to ${user.email}`);
          await emailService.sendSubscriptionConfirmed(
            user.email,
            user.fullname || user.username,
            plan.name,
            subscription.end_date,
          );
        }

        if (status === "cancelled") {
          strapi.log.debug(`[Lifecycle] Sending Rejection email to ${user.email}`);
          await emailService.sendSubscriptionRejected(
            user.email,
            user.fullname || user.username,
            plan.name,
            rejection_reason || "Demande annulée par l'administration.",
          );
        }
      } catch (err) {
        strapi.log.error("Error in afterUpdate lifecycle:", err);
      }
    }
  },
};
