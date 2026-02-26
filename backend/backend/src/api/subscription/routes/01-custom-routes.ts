/**
 * Custom routes for subscription management (TÂCHE-057)
 * NOTE: Strapi V5 requires full controller UID in handler field.
 */
export default {
    routes: [
        {
            method: 'GET',
            path: '/subscriptions/plans',
            handler: 'api::user-subscription.user-subscription.getPlans',
            config: { auth: false, policies: [], middlewares: [] },
        },
        {
            method: 'GET',
            path: '/subscriptions/me',
            handler: 'api::user-subscription.user-subscription.getMySubscription',
            config: { policies: [], middlewares: [] },
        },
        {
            method: 'POST',
            path: '/subscriptions/subscribe',
            handler: 'api::user-subscription.user-subscription.subscribe',
            config: { policies: [], middlewares: [] },
        },
        {
            method: 'PUT',
            path: '/subscriptions/upgrade',
            handler: 'api::user-subscription.user-subscription.upgrade',
            config: { policies: [], middlewares: [] },
        },
        {
            method: 'DELETE',
            path: '/subscriptions/cancel',
            handler: 'api::user-subscription.user-subscription.cancelSubscription',
            config: { policies: [], middlewares: [] },
        },
        {
            method: 'POST',
            path: '/subscriptions/renew',
            handler: 'api::user-subscription.user-subscription.renew',
            config: { policies: [], middlewares: [] },
        },
    ],
};
