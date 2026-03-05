console.log("⏰ [CRON] cron.ts file loaded and exporting jobs");
export default {
  /**
   * Cron job to delete unconfirmed users older than 24 hours.
   * Runs every day at 00:00.
   */
  "0 0 * * *": async ({ strapi }) => {
    console.log("🧹 [CRON] Starting unconfirmed users cleanup...");

    // Calculate timestamp for 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      // Find unconfirmed users created before twentyFourHoursAgo
      const unconfirmedUsers = await strapi
        .query("plugin::users-permissions.user")
        .findMany({
          where: {
            confirmed: false,
            createdAt: {
              $lt: twentyFourHoursAgo.toISOString(),
            },
          },
        });

      if (unconfirmedUsers.length > 0) {
        console.log(
          `🗑️ [CRON] Found ${unconfirmedUsers.length} unconfirmed accounts to delete.`,
        );

        for (const user of unconfirmedUsers) {
          // Note: In Strapi 5, you might also want to delete related profiles
          // but if profiles are linked via cascade or "oneToOne", cleaning the user is usually enough
          // or we can manually delete them to be sure.

          await strapi.query("plugin::users-permissions.user").delete({
            where: { id: user.id },
          });

          console.log(`✅ [CRON] Deleted user: ${user.email} (ID: ${user.id})`);
        }
      } else {
        console.log("✨ [CRON] No unconfirmed accounts to clean up today.");
      }
    } catch (err) {
      console.error("🔥 [CRON ERROR] Cleanup failed:", err.message);
    }
  },

  /**
   * Cron job to auto-reject pending subscriptions after their payment_deadline.
   * Runs every minute for testing.
   */
  "* * * * *": async ({ strapi }) => {
    const now = new Date();
    // Use a small buffer to avoid race conditions with very recent creations
    const logPrefix = `[CRON][${now.toISOString()}]`;
    console.log(`${logPrefix} Checking for expired pending subscriptions...`);

    try {
      const expiredSubscriptions = await strapi
        .documents("api::user-subscription.user-subscription")
        .findMany({
          filters: {
            status: "pending",
            payment_method: "cash",
            payment_deadline: {
              $lt: now.toISOString(),
            },
          },
          populate: ["user"],
        });

      if (expiredSubscriptions && expiredSubscriptions.length > 0) {
        console.log(
          `${logPrefix} Found ${expiredSubscriptions.length} expired requests to reject.`,
        );

        for (const sub of expiredSubscriptions) {
          const docId = sub.documentId;
          const userEmail = (sub as any).user?.email || "unknown email";
          console.log(
            `${logPrefix} [PROCESS] Rejecting ${docId} for user ${userEmail} (Deadline: ${sub.payment_deadline})`,
          );

          try {
            await strapi
              .documents("api::user-subscription.user-subscription")
              .update({
                documentId: docId as string,
                data: {
                  status: "cancelled",
                  rejection_reason:
                    "Délai de paiement expiré (Annulation automatique).",
                },
              });
            console.log(`${logPrefix} [SUCCESS] Rejected ${docId}.`);
          } catch (updateErr: any) {
            console.error(
              `${logPrefix} [ERROR] Failed to update ${docId}:`,
              updateErr.message,
            );
          }
        }
      } else {
        // DIAGNOSTIC CORE: Log ALL pending cash subs to see why they don't match
        const allPendingCash = await strapi
          .documents("api::user-subscription.user-subscription")
          .findMany({
            filters: { status: "pending", payment_method: "cash" },
            populate: ["user"],
          });

        if (allPendingCash.length > 0) {
          console.log(
            `${logPrefix} No expired found, but ${allPendingCash.length} pending cash subs exist:`,
          );
          allPendingCash.forEach((s) => {
            const deadline = s.payment_deadline
              ? new Date(s.payment_deadline as string).getTime()
              : 0;
            const diff = s.payment_deadline ? deadline - now.getTime() : "N/A";
            console.log(
              `  - Sub ${s.documentId}: deadline=${s.payment_deadline}, now=${now.toISOString()}, diff=${diff}ms`,
            );
          });
        }
      }

      // Legacy Cleanup (Keep this as a safety net)
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const legacyExpired = await strapi
        .documents("api::user-subscription.user-subscription")
        .findMany({
          filters: {
            status: "pending",
            createdAt: { $lt: yesterday.toISOString() },
            payment_deadline: { $null: true },
          },
        });

      if (legacyExpired.length > 0) {
        console.log(
          `${logPrefix} Cleaning up ${legacyExpired.length} legacy pending subs.`,
        );
        for (const sub of legacyExpired) {
          await strapi
            .documents("api::user-subscription.user-subscription")
            .update({
              documentId: sub.documentId,
              data: {
                status: "cancelled",
                rejection_reason: "Demande expirée (plus de 24h).",
              },
            });
        }
      }

      // --- NEW: Real-time Equipment Availability Tracking ---
      await strapi
        .service("api::equipment.equipment")
        .synchronizeAvailability();
    } catch (globalErr: any) {
      console.error(`[CRON][ERROR] Global failure:`, globalErr.message);
    }
  },

  /**
   * Cron job to send email alerts for expiring subscriptions & low credits.
   * Runs every day at 08:00 AM.
   */
  "*/1 * * * *": async ({ strapi }) => {
    const logPrefix = `[CRON-EMAIL][${new Date().toISOString()}]`;
    console.log(`${logPrefix} Checking for email alerts...`);

    try {
      const activeSubscriptions = await strapi
        .documents("api::user-subscription.user-subscription")
        .findMany({
          filters: { status: "active" },
          populate: ["user", "plan"],
        });

      for (const sub of activeSubscriptions) {
        let updateRequired = false;
        const updates: any = {};
        const userEmail = (sub as any).user?.email;
        const userName =
          (sub as any).user?.fullname ||
          (sub as any).user?.username ||
          "Client";

        if (!userEmail) continue;

        // 1. Expiration Alert
        if (!sub.expiration_alert_sent && sub.end_date) {
          const endDate = new Date(sub.end_date as string);
          const daysLeft = Math.ceil(
            (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );

          if (daysLeft > 0 && daysLeft <= 3) {
            console.log(
              `${logPrefix} Sending expiration alert to ${userEmail} (Sub: ${sub.documentId})`,
            );
            try {
              await strapi
                .plugin("email")
                .service("email")
                .send({
                  to: userEmail,
                  from: "contact@sunspace.com", // should ideally be configured en env vars
                  subject:
                    "🚨 Urgence : Votre abonnement expire très bientôt !",
                  text: `Bonjour ${userName},\n\nVotre abonnement " ${(sub as any).plan?.name || ""} " expire dans ${daysLeft} jours.\nConnectez-vous dès maintenant pour le renouveler et conserver vos avantages.\n\nL'équipe SunSpace`,
                  html: `<h3>Bonjour ${userName},</h3>
                       <p>Votre abonnement <strong>${(sub as any).plan?.name || ""}</strong> expire dans <strong>${daysLeft} jours</strong>.</p>
                       <p>Connectez-vous à votre espace pour le renouveler et conserver tous vos avantages professionnels.</p>
                       <p>À bientôt,<br/>L'équipe SunSpace</p>`,
                });
              updates.expiration_alert_sent = true;
              updateRequired = true;
            } catch (err: any) {
              console.error(
                `${logPrefix} Failed to send expiration email to ${userEmail}`,
                err.message,
              );
            }
          }
        }

        // 2. Low Credits Alert
        if (!sub.low_credits_alert_sent) {
          const maxCredits = (sub as any).plan?.max_credits || 0;
          const remainingCredits = (sub.remaining_credits as number) || 0;

          if (
            maxCredits > 0 &&
            remainingCredits <= Math.ceil(maxCredits * 0.1)
          ) {
            console.log(
              `${logPrefix} Sending low credits alert to ${userEmail} (Sub: ${sub.documentId})`,
            );
            try {
              await strapi
                .plugin("email")
                .service("email")
                .send({
                  to: userEmail,
                  from: "contact@sunspace.com",
                  subject: "⚠️ Crédits faibles sur votre abonnement SunSpace",
                  text: `Bonjour ${userName},\n\nIl ne vous reste plus que ${remainingCredits} crédit(s) sur votre forfait ${(sub as any).plan?.name || ""}.\nPensez à passer à un forfait supérieur ou à recharger depuis votre tableau de bord.\n\nL'équipe SunSpace`,
                  html: `<h3>Bonjour ${userName},</h3>
                       <p>Il ne vous reste plus que <strong>${remainingCredits} crédit(s)</strong> sur votre abonnement <strong>${(sub as any).plan?.name || ""}</strong>.</p>
                       <p>Ce niveau représente moins de 10% de votre maximum. Vous pouvez passer à un forfait plus important directement depuis l'application pour ne manquer de rien.</p>
                       <p>L'équipe SunSpace</p>`,
                });
              updates.low_credits_alert_sent = true;
              updateRequired = true;
            } catch (err: any) {
              console.error(
                `${logPrefix} Failed to send low credits email to ${userEmail}`,
                err.message,
              );
            }
          }
        }

        if (updateRequired) {
          await strapi
            .documents("api::user-subscription.user-subscription")
            .update({
              documentId: sub.documentId,
              data: updates,
            });
        }
      }
    } catch (err: any) {
      console.error(
        `${logPrefix} Error running email alerts cron:`,
        err.message,
      );
    }
  },
};
