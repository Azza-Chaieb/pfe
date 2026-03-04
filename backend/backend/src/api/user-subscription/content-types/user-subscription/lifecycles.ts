/**
 * Lifecycle hooks for user-subscription
 */

export default {
  async beforeCreate(event) {
    const { data } = event.params;
    strapi.log.debug(
      `[Lifecycle] beforeCreate for user-subscription. Params keys: ${Object.keys(event.params)}`,
    );

    // Set initial status to pending
    data.status = "pending";

    // Deadline calculation is now handled below in the plan-fetching block for dynamic values
    // or if no plan is provided, we set a default 2 hours later.
    if (data.payment_method === "cash" && !data.payment_deadline) {
      const deadline = new Date();
      deadline.setMinutes(deadline.getMinutes() + 2);
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

          // NEW: Adjust deadline based on plan's setting if it's cash payment
          if (data.payment_method === "cash") {
            const deadline = new Date();
            const mins = plan.deadline_hours || 2;
            deadline.setMinutes(deadline.getMinutes() + mins);
            data.payment_deadline = deadline;
          }
        }
      } catch (err) {
        console.error("Error fetching plan in lifecycle:", err);
      }
    }
  },

  async afterCreate(event) {
    const { result } = event;
    const documentId = result.documentId || result.id;
    strapi.log.debug(
      `[Lifecycle] afterCreate triggered for subscription ID: ${documentId}`,
    );
    try {
      // Fetch the full subscription with user and plan details using Strapi 5 Documents API
      const subscription = await strapi
        .documents("api::user-subscription.user-subscription")
        .findOne({
          documentId: documentId,
          populate: ["user", "plan"],
        });

      if (subscription && subscription.user && subscription.plan) {
        strapi.log.debug(
          `[Lifecycle] Found user ${subscription.user.email} and plan ${subscription.plan.name}`,
        );
        const emailService = strapi.service("api::email.email-service");
        if (!emailService) {
          strapi.log.error("[Lifecycle] EmailService NOT FOUND!");
          return;
        }
        await emailService.sendSubscriptionRequest(
          subscription.user.email,
          subscription.user.fullname || subscription.user.username,
          subscription.plan.name,
          subscription.payment_deadline,
        );
      } else {
        strapi.log.warn(
          `[Lifecycle] Subscription ${documentId} missing user or plan.`,
        );
      }
    } catch (err) {
      strapi.log.error("Error in afterCreate lifecycle:", err);
    }
  },

  async afterUpdate(event) {
    const { result, params } = event;
    const { data } = params;
    const documentId = result.documentId || result.id;

    strapi.log.info(
      `[Lifecycle] afterUpdate triggered for ID: ${documentId}. Data Status: ${data.status}. Result keys: ${Object.keys(result || {})}`,
    );

    if (data.status) {
      try {
        // Use Entity Service - cast to any to handle populated relation types
        const subscription = (await strapi.entityService.findOne(
          "api::user-subscription.user-subscription",
          result.id,
          {
            populate: ["user", "plan"],
          },
        )) as any;

        if (!subscription || !subscription.user || !subscription.plan) {
          strapi.log.warn(
            `[Lifecycle] afterUpdate: Subscription ${documentId} missing details. Populated user: ${!!subscription?.user}, plan: ${!!subscription?.plan}`,
          );
          return;
        }

        const { user, plan, status, rejection_reason } = subscription;
        const emailService = strapi.service("api::email.email-service");

        strapi.log.debug(
          `[Lifecycle] emailService found: ${!!emailService}. Status is: ${status}`,
        );

        if (status === "active") {
          strapi.log.info(
            `[Lifecycle] Attempting to send activation email to ${user.email} (User ID: ${user.id})`,
          );
          try {
            await emailService.sendSubscriptionConfirmed(
              user.email,
              user.fullname || user.username,
              plan.name,
              subscription.end_date,
            );
            strapi.log.info(
              `[Lifecycle] Email service call completed for ${user.email}`,
            );

            // Cleanup: Clear deadline once active
            if (subscription.payment_deadline) {
              await strapi.entityService.update(
                "api::user-subscription.user-subscription",
                result.id,
                { data: { payment_deadline: null } },
              );
              strapi.log.debug(
                `[Lifecycle] Cleared payment_deadline for active sub ${documentId}`,
              );
            }
          } catch (emailErr) {
            strapi.log.error(
              `[Lifecycle] Failed to send email via service: ${emailErr.message}`,
              emailErr,
            );
          }
        }

        if (status === "cancelled") {
          strapi.log.debug(
            `[Lifecycle] Sending Rejection/Expiration email to ${user.email}`,
          );
          try {
            await emailService.sendSubscriptionRejected(
              user.email,
              user.fullname || user.username,
              plan.name,
              rejection_reason ||
                "Demande annulée automatiquement ou par l'administration.",
            );
          } catch (emailErr: any) {
            strapi.log.error(
              `[Lifecycle] Failed to send rejection email: ${emailErr.message}`,
            );
          }
        }

        // NEW: If status is still pending but deadline was updated by admin
        if (status === "pending" && data.payment_deadline) {
          strapi.log.info(
            `[Lifecycle] Admin updated deadline for pending sub ${documentId}. Resending notification.`,
          );
          try {
            await emailService.sendSubscriptionRequest(
              user.email,
              user.fullname || user.username,
              plan.name,
              subscription.payment_deadline,
            );
          } catch (emailErr: any) {
            strapi.log.error(
              `[Lifecycle] Failed to resend request email: ${emailErr.message}`,
            );
          }
        }
      } catch (err) {
        strapi.log.error("Error in afterUpdate lifecycle:", err);
      }
    }
  },
};
