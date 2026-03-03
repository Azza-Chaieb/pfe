"use strict";

/**
 * Lifecycle hooks for user-subscription
 */

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;

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

  async afterUpdate(event) {
    const { result, params } = event;
    const { data } = params;

    // Check if status has changed
    if (data.status) {
      try {
        // Fetch the full subscription with user and plan details
        const subscription = await strapi.entityService.findOne(
          "api::user-subscription.user-subscription",
          result.id,
          {
            populate: ["user", "plan"],
          },
        );

        if (!subscription || !subscription.user) return;

        const { user, plan, status } = subscription;

        // 1. Send Confirmation Email (Pending -> Active)
        if (status === "active") {
          const {
            subscriptionConfirmationEmail,
          } = require("../../../../email/templates/subscription-confirmation");
          const html = subscriptionConfirmationEmail(
            user.fullname || user.username,
            {
              planName: plan.name,
              startDate: subscription.start_date,
              endDate: subscription.end_date,
              price: `${plan.price} DT`,
            },
          );

          await strapi
            .plugin("email")
            .service("email")
            .send({
              to: user.email,
              from: process.env.SMTP_FROM || "support@sunspace.com",
              subject: "💎 Votre abonnement SunSpace est activé !",
              html: html,
            });

          strapi.log.info(
            `Email de confirmation envoyé à ${user.email} pour le plan ${plan.name}`,
          );
        }

        // 2. Send Cancellation/Refusal Email
        if (status === "cancelled") {
          const {
            subscriptionCancellationEmail,
          } = require("../../../../email/templates/subscription-cancellation");
          const html = subscriptionCancellationEmail(
            user.fullname || user.username,
            {
              planName: plan.name,
            },
          );

          await strapi
            .plugin("email")
            .service("email")
            .send({
              to: user.email,
              from: process.env.SMTP_FROM || "support@sunspace.com",
              subject: "❌ Information sur votre abonnement SunSpace",
              html: html,
            });

          strapi.log.info(`Email d'annulation envoyé à ${user.email}`);
        }
      } catch (err) {
        strapi.log.error(
          "Erreur dans le cycle de vie afterUpdate (logique status):",
          err,
        );
      }
    }
  },
};
