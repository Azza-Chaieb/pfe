import { factories } from "@strapi/strapi";

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
          "trainer-expert": "Formateur Expert"
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
                { name: planDocumentId.charAt(0).toUpperCase() + planDocumentId.slice(1).toLowerCase() }
              ]
            }
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
      if (!plan && ["basic", "premium", "enterprise"].includes(planDocumentId.toLowerCase())) {
        console.log("[Subscription] Auto-creating missing plan:", planDocumentId);
        const defaultPlans: any = {
          basic: { name: "Basique", price: 49, max_credits: 5, description: "Idéal pour les freelances." },
          premium: { name: "Premium", price: 99, max_credits: 20, description: "Meilleur rapport qualité/prix." },
          enterprise: { name: "Entreprise", price: 199, max_credits: 9999, description: "Pour les équipes exigeantes." }
        };
        const planData = defaultPlans[planDocumentId.toLowerCase()];
        plan = await strapi.entityService.create("api::subscription-plan.subscription-plan" as any, {
          data: {
            ...planData,
            type: planDocumentId.toLowerCase(),
            duration_days: 30,
            target_role: "all",
            publishedAt: new Date(),
          }
        } as any);
      }

      console.log(
        "[Subscription] Plan found result:",
        plan ? "YES (ID: " + plan.id + ")" : "NO",
      );
      if (!plan)
        throw new Error(`Plan non trouvé pour la référence: ${planDocumentId}`);

      // 2. Cancel any existing active subscription
      const existing = await this.findActiveByUser(userId);
      if (existing) {
        await strapi.entityService.update(
          "api::user-subscription.user-subscription" as any,
          existing.id,
          { data: { status: "cancelled" } } as any,
        );
      }

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
      // Use documentId if available for relations in Strapi 5 if needed, 
      // but Entity Service usually wants IDs. Let's stick to IDs but ensure they are numbers.
      const newSub = await strapi.entityService.create(
        "api::user-subscription.user-subscription" as any,
        {
          data: {
            user: Number(userId),
            plan: Number(plan.id),
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            status: "pending",
            billing_cycle: billingCycle,
            remaining_credits: plan.max_credits || 0,
            payment_method: paymentMethod,
            payment_reference: paymentReference,
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
