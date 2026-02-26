export default {
    routes: [
        {
            method: 'GET',
            path: '/subscriptions/plans',
            handler: 'user-subscription.getPlans',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/subscriptions/me',
            handler: 'user-subscription.getMySubscription',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/subscriptions/subscribe',
            handler: 'user-subscription.subscribe',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/subscriptions/upgrade',
            handler: 'user-subscription.upgrade',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'DELETE',
            path: '/subscriptions/cancel',
            handler: 'user-subscription.cancelSubscription',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/subscriptions/renew',
            handler: 'user-subscription.renew',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};

