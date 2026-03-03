/**
 * subscription router
 * Custom routes for subscription management.
 * All handlers now point to the subscription API's own controller.
 */

export default {
  routes: [
    // ── Public ────────────────────────────────────────────────
    {
      method: "GET",
      path: "/subscriptions/plans",
      handler: "api::subscription.subscription.getPlans",
      config: { auth: false, policies: [], middlewares: [] },
    },

    // ── Authenticated ─────────────────────────────────────────
    {
      method: "GET",
      path: "/subscriptions/me",
      handler: "api::subscription.subscription.getMySubscription",
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: "POST",
      path: "/subscriptions/subscribe",
      handler: "api::subscription.subscription.subscribe",
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: "PUT",
      path: "/subscriptions/upgrade",
      handler: "api::subscription.subscription.upgrade",
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: "DELETE",
      path: "/subscriptions/cancel",
      handler: "api::subscription.subscription.cancelSubscription",
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: "POST",
      path: "/subscriptions/renew",
      handler: "api::subscription.subscription.renew",
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
