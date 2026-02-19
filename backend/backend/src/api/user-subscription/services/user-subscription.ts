import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::user-subscription.user-subscription', ({ strapi }) => ({

    /**
     * Find active subscription for a given user
     */
    async findActiveByUser(userId: number) {
        const results = await strapi.entityService.findMany(
            'api::user-subscription.user-subscription' as any,
            {
                filters: { user: userId, status: 'active' },
                populate: ['plan', 'user'],
                sort: { createdAt: 'desc' },
                limit: 1,
            } as any,
        );
        return (results as any[])[0] || null;
    },

    /**
     * Subscribe a user to a plan
     */
    async subscribe(userId: number, planDocumentId: string, billingCycle: 'monthly' | 'yearly') {
        // 1. Fetch plan
        const plans = await strapi.entityService.findMany(
            'api::subscription-plan.subscription-plan' as any,
            { filters: { documentId: planDocumentId } } as any,
        );
        const plan = (plans as any[])[0];
        if (!plan) throw new Error('Plan non trouvé.');

        // 2. Cancel any existing active subscription
        const existing = await this.findActiveByUser(userId);
        if (existing) {
            await strapi.entityService.update(
                'api::user-subscription.user-subscription' as any,
                existing.id,
                { data: { status: 'cancelled' } } as any,
            );
        }

        // 3. Calculate dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        const days = billingCycle === 'yearly' ? (plan.duration_days || 30) * 12 : (plan.duration_days || 30);
        endDate.setDate(endDate.getDate() + days);

        // 4. Create new subscription
        const newSub = await strapi.entityService.create(
            'api::user-subscription.user-subscription' as any,
            {
                data: {
                    user: userId,
                    plan: plan.id,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    status: 'active',
                    billing_cycle: billingCycle,
                    remaining_credits: plan.max_credits || 0,
                    publishedAt: new Date().toISOString(),
                },
                populate: ['plan'],
            } as any,
        );

        return newSub;
    },

    /**
     * Upgrade/downgrade subscription (change plan)
     */
    async upgrade(subscriptionId: number, newPlanDocumentId: string, billingCycle: 'monthly' | 'yearly') {
        const plans = await strapi.entityService.findMany(
            'api::subscription-plan.subscription-plan' as any,
            { filters: { documentId: newPlanDocumentId } } as any,
        );
        const plan = (plans as any[])[0];
        if (!plan) throw new Error('Plan non trouvé.');

        const startDate = new Date();
        const endDate = new Date(startDate);
        const days = billingCycle === 'yearly' ? (plan.duration_days || 30) * 12 : (plan.duration_days || 30);
        endDate.setDate(endDate.getDate() + days);

        const updated = await strapi.entityService.update(
            'api::user-subscription.user-subscription' as any,
            subscriptionId,
            {
                data: {
                    plan: plan.id,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    status: 'active',
                    billing_cycle: billingCycle,
                    remaining_credits: plan.max_credits || 0,
                },
                populate: ['plan'],
            } as any,
        );

        return updated;
    },

    /**
     * Cancel a subscription
     */
    async cancel(subscriptionId: number) {
        return strapi.entityService.update(
            'api::user-subscription.user-subscription' as any,
            subscriptionId,
            { data: { status: 'cancelled' } } as any,
        );
    },

    /**
     * Renew an expired subscription with same plan
     */
    async renew(subscriptionId: number) {
        const sub = await strapi.entityService.findOne(
            'api::user-subscription.user-subscription' as any,
            subscriptionId,
            { populate: ['plan'] } as any,
        ) as any;

        if (!sub) throw new Error('Abonnement non trouvé.');
        const plan = sub.plan;
        if (!plan) throw new Error('Plan associé non trouvé.');

        const startDate = new Date();
        const endDate = new Date(startDate);
        const days = sub.billing_cycle === 'yearly' ? (plan.duration_days || 30) * 12 : (plan.duration_days || 30);
        endDate.setDate(endDate.getDate() + days);

        return strapi.entityService.update(
            'api::user-subscription.user-subscription' as any,
            subscriptionId,
            {
                data: {
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    status: 'active',
                    remaining_credits: plan.max_credits || 0,
                },
                populate: ['plan'],
            } as any,
        );
    },

    /**
     * Deduct credits when a reservation is made
     */
    async deductCredit(userId: number) {
        const sub = await this.findActiveByUser(userId);
        if (!sub) return null;
        if (sub.remaining_credits <= 0) throw new Error('Crédits insuffisants.');

        return strapi.entityService.update(
            'api::user-subscription.user-subscription' as any,
            sub.id,
            { data: { remaining_credits: sub.remaining_credits - 1 } } as any,
        );
    },
}));
