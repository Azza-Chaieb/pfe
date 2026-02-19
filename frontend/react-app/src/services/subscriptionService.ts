import api from './apiClient';

// ===== SUBSCRIPTION PLANS =====

/**
 * GET /api/subscriptions/plans — all published plans (custom endpoint)
 */
export const getSubscriptionPlans = async () => {
    try {
        const response = await api.get('/subscriptions/plans');
        return response.data;
    } catch {
        // Fallback to standard Strapi endpoint
        const response = await api.get('/subscription-plans?sort=price:asc&populate=*');
        return response.data;
    }
};

/**
 * Get a single plan by documentId
 */
export const getSubscriptionPlan = async (id: string) => {
    const response = await api.get(`/subscription-plans/${id}?populate=*`);
    return response.data;
};

// ===== USER SUBSCRIPTIONS =====

/**
 * GET /api/subscriptions/me — authenticated user's active subscription
 */
export const getMySubscription = async (_userId?: number | string) => {
    try {
        const response = await api.get('/subscriptions/me');
        return response.data?.data || null;
    } catch {
        // Fallback: query by user ID if custom endpoint fails
        if (!_userId) return null;
        const response = await api.get(
            `/user-subscriptions?filters[user][id][$eq]=${_userId}&filters[status][$eq]=active&populate=plan&sort=end_date:desc&pagination[limit]=1`
        );
        return response.data?.data?.[0] || null;
    }
};

/**
 * POST /api/subscriptions/subscribe
 * Body: { planId, billingCycle }
 */
export const subscribeToPlan = async (payload: {
    user?: number;
    plan: string | number;
    billing_cycle: 'monthly' | 'yearly';
    payment_reference?: string;
}) => {
    const response = await api.post('/subscriptions/subscribe', {
        planId: payload.plan,
        billingCycle: payload.billing_cycle,
        paymentReference: payload.payment_reference || '',
    });
    return response.data;
};

/**
 * PUT /api/subscriptions/upgrade
 * Body: { subscriptionId, planId, billingCycle }
 */
export const upgradeSubscription = async (payload: {
    subscriptionId: number;
    planId: string;
    billingCycle: 'monthly' | 'yearly';
}) => {
    const response = await api.put('/subscriptions/upgrade', payload);
    return response.data;
};

/**
 * DELETE /api/subscriptions/cancel
 * Body: { subscriptionId }
 */
export const cancelSubscription = async (subscriptionId: string | number) => {
    const response = await api.delete('/subscriptions/cancel', {
        data: { subscriptionId },
    });
    return response.data;
};

/**
 * POST /api/subscriptions/renew
 * Body: { subscriptionId }
 */
export const renewSubscription = async (subscriptionId: number) => {
    const response = await api.post('/subscriptions/renew', { subscriptionId });
    return response.data;
};

/**
 * Get all user subscriptions for admin
 */
export const getAllUserSubscriptions = async () => {
    const response = await api.get(
        '/user-subscriptions?populate[user][fields][0]=username&populate[user][fields][1]=email&populate[user][fields][2]=fullname&populate[plan][fields][0]=name&populate[plan][fields][1]=price&populate[plan][fields][2]=type&sort=createdAt:desc'
    );
    return response.data;
};
