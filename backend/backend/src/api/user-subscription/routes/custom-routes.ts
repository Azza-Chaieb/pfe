export default {
  routes: [
    {
      method: "POST",
      path: "/subscriptions/run-cron",
      handler: "user-subscription.runCron",
      config: {
        auth: false, // For easier debugging
      },
    },
    {
      method: "GET",
      path: "/subscriptions/plans",
      handler: "user-subscription.getPlans",
      config: { auth: false },
    },
    {
      method: "GET",
      path: "/subscriptions/me",
      handler: "user-subscription.getMySubscription",
    },
    {
      method: "POST",
      path: "/subscriptions/subscribe",
      handler: "user-subscription.subscribe",
    },
    {
      method: "PUT",
      path: "/subscriptions/upgrade",
      handler: "user-subscription.upgrade",
    },
    {
      method: "POST",
      path: "/subscriptions/renew",
      handler: "user-subscription.renew",
    },
    {
      method: "POST",
      path: "/subscriptions/cancel",
      handler: "user-subscription.cancelSubscription",
    },
  ],
};
