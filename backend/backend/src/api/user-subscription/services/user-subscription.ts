import { factories } from "@strapi/strapi";
import PDFDocument from "pdfkit";

export default factories.createCoreService(
  "api::user-subscription.user-subscription",
  ({ strapi }) => ({
    /**
     * Find active subscription for a given user
     */
    async findActiveByUser(userId: number) {
      const results = await strapi.entityService.findMany(
        "api::user-subscription.user-subscription" as any,
        {
          filters: { user: userId, status: "active" },
          populate: ["plan", "user"],
          sort: { createdAt: "desc" },
          limit: 1,
        } as any,
      );
      return (results as any[])[0] || null;
    },

    /**
     * Find all subscriptions for a given user (history)
     */
    async findAllByUser(userId: number) {
      return await strapi.entityService.findMany(
        "api::user-subscription.user-subscription" as any,
        {
          filters: { user: userId },
          populate: ["plan", "user"],
          sort: { createdAt: "desc" },
        } as any,
      );
    },

    /**
     * Generate an invoice PDF for a subscription
     */
    async generateInvoice(subscriptionId: number, userId: number): Promise<PDFKit.PDFDocument> {
      // Fetch the subscription with related user and plan
      const subscriptionInfo = await strapi.entityService.findOne(
        "api::user-subscription.user-subscription" as any,
        subscriptionId as any,
        {
          populate: ["plan", "user"],
        } as any
      );

      if (!subscriptionInfo) {
        throw new Error("Subscription not found");
      }

      // Verify ownership (or admin rights ideally, but keeping it simple for user)
      if (subscriptionInfo.user?.id !== userId) {
        throw new Error("Unauthorized to access this invoice");
      }

      // Create a document
      const doc = new PDFDocument({ margin: 50 });

      // Build the PDF content
      // Header
      doc
        .fillColor("#2563EB") // Blue color for brand
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("SunSpace", 50, 57)
        .fillColor("#444444")
        .fontSize(10)
        .font("Helvetica")
        .text("123 Coworking Street", 200, 50, { align: "right" })
        .text("Tunis, Tunisie, 1000", 200, 65, { align: "right" })
        .text("contact@sunspace.com", 200, 80, { align: "right" })
        .text("+216 12 345 678", 200, 95, { align: "right" })
        .moveDown();

      doc.strokeColor("#E5E7EB").lineWidth(2).moveTo(50, 115).lineTo(550, 115).stroke();

      // Invoice Details
      const invoiceNum = `INV-${subscriptionInfo.id.toString().padStart(5, "0")}`;
      const date = new Date(subscriptionInfo.createdAt).toLocaleDateString("fr-FR");

      doc
        .fillColor("#1F2937")
        .font("Helvetica-Bold")
        .fontSize(20)
        .text(`Facture ${invoiceNum}`, 50, 135);

      const statusTranslations: Record<string, string> = {
        active: "Payée & Active",
        pending: "En attente de paiement",
        cancelled: "Annulée / Refusée",
      };
      const statusText = statusTranslations[subscriptionInfo.status] || subscriptionInfo.status;

      // Status Coloring
      let statusColor = "#444444";
      if (subscriptionInfo.status === "active") statusColor = "#10B981"; // Green
      if (subscriptionInfo.status === "cancelled") statusColor = "#EF4444"; // Red
      if (subscriptionInfo.status === "pending") statusColor = "#F59E0B"; // Orange

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#6B7280")
        .text(`Date de facturation: `, 50, 165)
        .fillColor("#1F2937")
        .text(date, 150, 165)
        .fillColor("#6B7280")
        .text(`Statut: `, 50, 180)
        .fillColor(statusColor)
        .font("Helvetica-Bold")
        .text(statusText, 150, 180);

      // Customer Details
      const customerName = subscriptionInfo.user?.fullname || subscriptionInfo.user?.username || "Client";
      const customerEmail = subscriptionInfo.user?.email || "";

      doc
        .fillColor("#6B7280")
        .font("Helvetica")
        .text("Facturé à:", 300, 165)
        .fillColor("#1F2937")
        .font("Helvetica-Bold")
        .text(customerName.toUpperCase(), 300, 180)
        .font("Helvetica")
        .fillColor("#4B5563")
        .text(customerEmail, 300, 195);

      const startDate = new Date(subscriptionInfo.createdAt).toLocaleDateString("fr-FR");
      let periodText = `Du ${startDate}`;
      if (subscriptionInfo.end_date) {
        const endDate = new Date(subscriptionInfo.end_date).toLocaleDateString("fr-FR");
        periodText += ` au ${endDate}`;
      } else {
        periodText += " (Durée indéterminée)";
      }

      doc
        .fillColor("#6B7280")
        .text(`Période: `, 50, 195)
        .fillColor("#1F2937")
        .text(periodText, 150, 195);

      doc.strokeColor("#E5E7EB").lineWidth(2).moveTo(50, 230).lineTo(550, 230).stroke();

      // Watermark for cancelled
      if (subscriptionInfo.status === "cancelled") {
        doc
          .save()
          .fillColor("#EF4444")
          .fillOpacity(0.1)
          .font("Helvetica-Bold")
          .fontSize(60)
          .rotate(-30, { origin: [300, 400] })
          .text("ANNULÉ", 150, 350, { width: 400, align: "center" })
          .restore();
      }

      // Table Header
      const tableTop = 260;
      doc.fillColor("#4B5563").font("Helvetica-Bold").fontSize(10);
      doc.text("Description", 50, tableTop);
      doc.text("Cycle", 250, tableTop);
      doc.text("Prix unitaire (HT)", 350, tableTop);
      doc.text("Total (TTC)", 450, tableTop);

      doc.strokeColor("#E5E7EB").lineWidth(2).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Table Row
      const planName = subscriptionInfo.plan?.name || "Abonnement standard";

      const originalPrice = subscriptionInfo.original_price ?? (subscriptionInfo.plan?.price || 0);
      const discount = subscriptionInfo.discount_amount || 0;
      const finalPrice = subscriptionInfo.final_price !== undefined ? subscriptionInfo.final_price : Math.max(0, originalPrice - discount);

      const tvaRate = 0.19; // 19% TVA
      const priceHT = finalPrice / (1 + tvaRate);

      const cycleTranslations: Record<string, string> = {
        monthly: "Mensuel",
        quarterly: "Trimestriel",
        semiannually: "Semestriel",
        yearly: "Annuel"
      };
      const cycleText = subscriptionInfo.billing_cycle ? (cycleTranslations[subscriptionInfo.billing_cycle] || subscriptionInfo.billing_cycle) : "N/A";

      const rowTop = tableTop + 30;
      doc.fillColor("#1F2937").font("Helvetica");
      doc.text(`Abonnement: ${planName}`, 50, rowTop, { width: 190 });
      doc.text(cycleText, 250, rowTop);
      doc.text(`${(originalPrice / (1 + tvaRate)).toFixed(2)} DT`, 350, rowTop);
      doc.text(`${originalPrice.toFixed(2)} DT`, 450, rowTop);

      let currentTop = rowTop + 30;

      if (discount > 0) {
        doc.fillColor("#D97706").font("Helvetica-Oblique");
        doc.text(`Remise Prorata (Jours restants)`, 50, currentTop, { width: 190 });
        doc.text(`- ${(discount / (1 + tvaRate)).toFixed(2)} DT`, 350, currentTop);
        doc.text(`- ${discount.toFixed(2)} DT`, 450, currentTop);
        currentTop += 25;
      }

      doc.strokeColor("#E5E7EB").lineWidth(2).moveTo(50, currentTop).lineTo(550, currentTop).stroke();

      // Totals
      const totalTop = currentTop + 20;
      doc.fillColor("#4B5563").font("Helvetica-Bold");
      doc.text("Sous-total HT:", 350, totalTop);
      doc.fillColor("#1F2937").font("Helvetica").text(`${priceHT.toFixed(2)} DT`, 450, totalTop);

      doc.fillColor("#4B5563").font("Helvetica-Bold").text("TVA (19%):", 350, totalTop + 20);
      doc.fillColor("#1F2937").font("Helvetica").text(`${(finalPrice - priceHT).toFixed(2)} DT`, 450, totalTop + 20);

      const totalsBoxTop = totalTop + 35;
      doc.rect(340, totalsBoxTop, 200, 30).fill("#F3F4F6"); // Light gray box for total

      doc.fillColor("#1F2937").font("Helvetica-Bold").fontSize(12).text("Total TTC:", 350, totalsBoxTop + 10);
      doc.fillColor("#2563EB").text(`${finalPrice.toFixed(2)} DT`, 450, totalsBoxTop + 10); // Brand blue for final price

      // Footer
      doc
        .fontSize(10)
        .fillColor("#9CA3AF")
        .text(
          "Merci pour votre confiance. Pour toute question, contactez-nous.",
          50,
          700,
          { align: "center", width: 500 }
        );

      // End document
      doc.end();

      return doc;
    },

    /**
     * Find latest subscription (active or pending) for a given user
     */
    async findLatestByUser(userId: number) {
      const results = await strapi.entityService.findMany(
        "api::user-subscription.user-subscription" as any,
        {
          filters: {
            user: userId,
          },
          populate: ["plan", "user"],
          sort: { createdAt: "desc" },
          limit: 1,
        } as any,
      );
      return (results as any[])[0] || null;
    },

    /**
     * Subscribe a user to a plan
     */
    async subscribe(
      userId: number,
      planDocumentId: string,
      billingCycle: "monthly" | "quarterly" | "semiannually" | "yearly",
      paymentMethod: "cash" | "card" = "cash",
      paymentReference: string = "",
    ) {
      // 1. Fetch plan
      console.log("[Subscription] Plan lookup for:", planDocumentId);
      let plan;

      // Try by numeric ID first if it looks like one
      const numericId = Number(planDocumentId);
      if (!isNaN(numericId)) {
        plan = await strapi.entityService.findOne(
          "api::subscription-plan.subscription-plan" as any,
          numericId as any,
        );
      }

      // If not found by ID (or not numeric), try by documentId
      if (!plan) {
        const plans = await strapi.entityService.findMany(
          "api::subscription-plan.subscription-plan" as any,
          { filters: { documentId: planDocumentId } } as any,
        );
        plan = (plans as any[])[0];
      }

      // Final fallback 1: Map professional fallback IDs to names
      if (!plan && typeof planDocumentId === "string") {
        const fallbackMapping: Record<string, string> = {
          "student-basic": "Étudiant Basique",
          "student-pro": "Étudiant Pro",
          "pro-essential": "Pro Essentiel",
          "pro-premium": "Pro Premium",
          "assoc-comm": "Association Communauté",
          "assoc-exp": "Association Expansion",
          "trainer-solo": "Formateur Solo",
          "trainer-expert": "Formateur Expert",
        };
        const mappedName = fallbackMapping[planDocumentId];
        if (mappedName) {
          const plans = await strapi.entityService.findMany(
            "api::subscription-plan.subscription-plan" as any,
            { filters: { name: mappedName } } as any,
          );
          plan = (plans as any[])[0];
        }
      }

      // Final fallback 2: try search by name if it's a string (case-insensitive)
      if (!plan && typeof planDocumentId === "string") {
        const plans = await strapi.entityService.findMany(
          "api::subscription-plan.subscription-plan" as any,
          {
            filters: {
              $or: [
                { name: planDocumentId },
                { name: planDocumentId.toLowerCase() },
                {
                  name:
                    planDocumentId.charAt(0).toUpperCase() +
                    planDocumentId.slice(1).toLowerCase(),
                },
              ],
            },
          } as any,
        );
        plan = (plans as any[])[0];
      }

      // Final fallback 3: try search by "type" (handles the frontend FALLBACK_PLANS IDs like 'basic', 'premium')
      if (!plan && typeof planDocumentId === "string") {
        const plans = await strapi.entityService.findMany(
          "api::subscription-plan.subscription-plan" as any,
          { filters: { type: planDocumentId.toLowerCase() } } as any,
        );
        plan = (plans as any[])[0];
      }

      // Final fallback 3: Auto-create plan if it's a standard type and missing
      if (
        !plan &&
        ["basic", "premium", "enterprise"].includes(
          planDocumentId.toLowerCase(),
        )
      ) {
        console.log(
          "[Subscription] Auto-creating missing plan:",
          planDocumentId,
        );
        const defaultPlans: any = {
          basic: {
            name: "Basique",
            price: 49,
            max_credits: 5,
            description: "Idéal pour les freelances.",
          },
          premium: {
            name: "Premium",
            price: 99,
            max_credits: 20,
            description: "Meilleur rapport qualité/prix.",
          },
          enterprise: {
            name: "Entreprise",
            price: 199,
            max_credits: 9999,
            description: "Pour les équipes exigeantes.",
          },
        };
        const planData = defaultPlans[planDocumentId.toLowerCase()];
        plan = await strapi.entityService.create(
          "api::subscription-plan.subscription-plan" as any,
          {
            data: {
              ...planData,
              type: planDocumentId.toLowerCase(),
              duration_days: 30,
              target_role: "all",
              publishedAt: new Date(),
            },
          } as any,
        );
      }

      console.log(
        "[Subscription] Plan found result:",
        plan ? "YES (ID: " + plan.id + ")" : "NO",
      );
      if (!plan)
        throw new Error(`Plan non trouvé pour la référence: ${planDocumentId}`);

      let discountAmount = 0;
      let originalPrice = plan.price || 0;
      if (billingCycle === "quarterly") originalPrice = Math.round(originalPrice * 3 * 0.85);
      if (billingCycle === "semiannually") originalPrice = Math.round(originalPrice * 6 * 0.80);
      if (billingCycle === "yearly") originalPrice = Math.round(originalPrice * 12 * 0.75);

      // 2. Cancel any existing active or pending subscription (Upgrading plan)
      const lastSub: any = await this.findLatestByUser(userId);
      if (
        lastSub &&
        (lastSub.status === "active" || lastSub.status === "pending")
      ) {
        console.log(`[Subscription] Cancelling previous sub ID: ${lastSub.id} for Upgrade`);

        // Calculate Proration discount if old plan was active
        if (lastSub.status === "active" && lastSub.end_date) {
          const oldEndDate = new Date(lastSub.end_date as string);
          const now = new Date();
          const daysLeft = Math.ceil((oldEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysLeft > 0) {
            const oldPlanPrice = lastSub.final_price ?? lastSub.original_price ?? lastSub.plan?.price ?? 0;
            const oldDuration = lastSub.plan?.duration_days ?? 30; // fallback approx
            const dailyRate = oldPlanPrice / Math.max(1, oldDuration);
            discountAmount = parseFloat((dailyRate * daysLeft).toFixed(2));
            console.log(`[Subscription] Calculated Proration: ${daysLeft} days left * ${dailyRate.toFixed(2)}/day = ${discountAmount} DT`);
          }
        }

        await strapi.entityService.update(
          "api::user-subscription.user-subscription" as any,
          lastSub.id,
          { data: { status: "cancelled", rejection_reason: "Remplacé par un nouveau forfait (Upgrade)" } } as any,
        );
      }

      const finalPrice = Math.max(0, originalPrice - discountAmount);
      // 3. Calculate dates
      const startDate = new Date();
      const endDate = new Date(startDate);
      const days =
        billingCycle === "yearly"
          ? (plan.duration_days || 30) * 12
          : billingCycle === "semiannually"
            ? (plan.duration_days || 30) * 6
            : billingCycle === "quarterly"
              ? (plan.duration_days || 30) * 3
              : plan.duration_days || 30;
      endDate.setDate(endDate.getDate() + days);

      console.log(
        "[Subscription] Creating sub for user:",
        userId,
        "with plan ID:",
        plan.id,
      );

      // 4. Create new subscription
      // Strapi 5: When creating/updating relations via Entity Service or Documents,
      // it's safest to use the documentId for the linkage.
      const newSub = await strapi.entityService.create(
        "api::user-subscription.user-subscription" as any,
        {
          data: {
            user: userId, // User is still numeric ID mostly
            plan: plan.documentId || plan.id, // CRITICAL: Use documentId for linkage in Strapi 5
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            status: "pending",
            billing_cycle: billingCycle,
            remaining_credits: plan.max_credits || 0,
            original_price: originalPrice,
            discount_amount: discountAmount,
            final_price: finalPrice,
            payment_method: paymentMethod,
            payment_reference: paymentReference,
            payment_deadline:
              paymentMethod === "cash"
                ? new Date(
                  Date.now() + (plan.deadline_hours || 2) * 60 * 60 * 1000,
                ).toISOString()
                : null,
          },
          populate: ["plan", "user"],
        } as any,
      );

      console.log(
        "[Subscription] Created Sub ID:",
        newSub?.id,
        "Plan linked:",
        newSub?.plan ? "YES" : "NO",
      );

      return newSub;
    },

    /**
     * Upgrade/downgrade subscription (change plan)
     */
    async upgrade(
      subscriptionId: number,
      newPlanDocumentId: string,
      billingCycle: "monthly" | "quarterly" | "semiannually" | "yearly",
      paymentMethod: "cash" | "card" = "cash",
      paymentReference: string = "",
    ) {
      let plan;
      if (isNaN(Number(newPlanDocumentId))) {
        const plans = await strapi.entityService.findMany(
          "api::subscription-plan.subscription-plan" as any,
          { filters: { documentId: newPlanDocumentId } } as any,
        );
        plan = (plans as any[])[0];
      } else {
        plan = await strapi.entityService.findOne(
          "api::subscription-plan.subscription-plan" as any,
          Number(newPlanDocumentId) as any,
        );
      }
      if (!plan) throw new Error("Plan non trouvé.");

      const startDate = new Date();
      const endDate = new Date(startDate);
      const days =
        billingCycle === "yearly"
          ? (plan.duration_days || 30) * 12
          : billingCycle === "semiannually"
            ? (plan.duration_days || 30) * 6
            : billingCycle === "quarterly"
              ? (plan.duration_days || 30) * 3
              : plan.duration_days || 30;
      endDate.setDate(endDate.getDate() + days);

      const updated = await strapi.entityService.update(
        "api::user-subscription.user-subscription" as any,
        subscriptionId,
        {
          data: {
            plan: plan.id,
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            status: "active",
            billing_cycle: billingCycle,
            remaining_credits: plan.max_credits || 0,
            payment_method: paymentMethod,
            payment_reference: paymentReference,
          },
          populate: ["plan"],
        } as any,
      );

      return updated;
    },

    /**
     * Cancel a subscription
     */
    async cancel(subscriptionId: number) {
      return strapi.entityService.update(
        "api::user-subscription.user-subscription" as any,
        subscriptionId,
        { data: { status: "cancelled" } } as any,
      );
    },

    /**
     * Renew an expired subscription with same plan
     */
    async renew(subscriptionId: number) {
      const sub = (await strapi.entityService.findOne(
        "api::user-subscription.user-subscription" as any,
        subscriptionId,
        { populate: ["plan"] } as any,
      )) as any;

      if (!sub) throw new Error("Abonnement non trouvé.");
      const plan = sub.plan;
      if (!plan) throw new Error("Plan associé non trouvé.");

      const startDate = new Date();
      const endDate = new Date(startDate);
      const days =
        sub.billing_cycle === "yearly"
          ? (plan.duration_days || 30) * 12
          : sub.billing_cycle === "semiannually"
            ? (plan.duration_days || 30) * 6
            : sub.billing_cycle === "quarterly"
              ? (plan.duration_days || 30) * 3
              : plan.duration_days || 30;
      endDate.setDate(endDate.getDate() + days);

      return strapi.entityService.update(
        "api::user-subscription.user-subscription" as any,
        subscriptionId,
        {
          data: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: "active",
            remaining_credits: plan.max_credits || 0,
          },
          populate: ["plan"],
        } as any,
      );
    },

    /**
     * Deduct credits when a reservation is made
     */
    async deductCredit(userId: number) {
      const sub = await this.findActiveByUser(userId);
      if (!sub) return null;
      if (sub.remaining_credits <= 0) throw new Error("Crédits insuffisants.");

      return strapi.entityService.update(
        "api::user-subscription.user-subscription" as any,
        sub.id,
        { data: { remaining_credits: sub.remaining_credits - 1 } } as any,
      );
    },
  }),
);
