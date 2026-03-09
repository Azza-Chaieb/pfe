import api from "./apiClient";

// ===== SUBSCRIPTION PLANS =====

/**
 * GET /api/subscriptions/plans — all published plans (custom endpoint)
 */
export const getSubscriptionPlans = async (role?: string) => {
  try {
    const query = role ? `?role=${role}` : "";
    const response = await api.get(`/subscriptions/plans${query}`);
    return response.data;
  } catch {
    // Fallback to standard Strapi endpoint
    let url = "/subscription-plans?sort=price:asc&populate=*";
    if (role) {
      url += `&filters[target_role][$in][0]=${role}&filters[target_role][$in][1]=all`;
    }
    const response = await api.get(url);
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
    const response = await api.get("/subscriptions/me");
    const sub = response.data?.data;

    // Safety check: if backend returned a non-active/pending sub (e.g. cancelled),
    // but the user might have an active one, let's force a direct check.
    if (sub && !["active", "pending"].includes(sub.status) && _userId) {
      const fallbackResponse = await api.get(
        `/user-subscriptions?filters[user][id][$eq]=${_userId}&filters[status][$in][0]=active&filters[status][$in][1]=pending&populate=plan&sort=createdAt:desc&pagination[limit]=1`,
      );
      if (fallbackResponse.data?.data?.length > 0) {
        return fallbackResponse.data.data[0];
      }
    }

    return sub || null;
  } catch {
    // Fallback: query by user ID if custom endpoint fails
    if (!_userId) return null;
    const response = await api.get(
      `/user-subscriptions?filters[user][id][$eq]=${_userId}&filters[status][$in][0]=active&filters[status][$in][1]=pending&populate=plan&sort=createdAt:desc&pagination[limit]=1`,
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
  billing_cycle: "monthly" | "yearly";
  payment_method: "cash" | "card";
  payment_reference?: string;
}) => {
  const response = await api.post("/subscriptions/subscribe", {
    planId: payload.plan,
    billingCycle: payload.billing_cycle,
    paymentMethod: payload.payment_method,
    paymentReference: payload.payment_reference || "",
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
  billingCycle: "monthly" | "yearly";
}) => {
  const response = await api.put("/subscriptions/upgrade", payload);
  return response.data;
};

/**
 * DELETE /api/subscriptions/cancel
 * Body: { subscriptionId }
 */
export const cancelSubscription = async (subscriptionId: string | number) => {
  const response = await api.post("/subscriptions/cancel", {
    subscriptionId,
  });
  return response.data;
};

/**
 * POST /api/subscriptions/renew
 * Body: { subscriptionId }
 */
export const renewSubscription = async (subscriptionId: number) => {
  const response = await api.post("/subscriptions/renew", { subscriptionId });
  return response.data;
};

/**
 * Get all user subscriptions for admin
 */
export const getAllUserSubscriptions = async () => {
  const response = await api.get(
    "/user-subscriptions?populate[user][fields][0]=username&populate[user][fields][1]=email&populate[user][fields][2]=fullname&populate[plan][fields][0]=name&populate[plan][fields][1]=price&populate[plan][fields][2]=type&sort=createdAt:desc",
  );
  return response.data;
};
/**
 * Get subscription history for the current user
 */
export const getSubscriptionHistory = async () => {
  const response = await api.get("/subscriptions/history");
  return response.data;
};

/**
 * Download invoice PDF for a specific subscription
 * Handles the binary blob response and triggers a browser download.
 */
export const downloadInvoice = async (
  subscriptionId: number,
  filename = "facture.pdf",
) => {
  const response = await api.get(`/subscriptions/${subscriptionId}/invoice`, {
    responseType: "blob",
  });

  // Create a URL for the blob and trigger download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();

  // Clean up
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
  return true;
};

// ===== ADMIN FULL CRUD FOR SUBSCRIPTION PLANS =====

/**
 * Get all subscription plans for admin, including drafts/unpublished
 */
export const getAdminSubscriptionPlans = async () => {
  const response = await api.get("/subscription-plans?populate=*");
  return response.data;
};

/**
 * Create a new subscription plan
 */
export const createSubscriptionPlan = async (data: any) => {
  const response = await api.post("/subscription-plans", { data });
  return response.data;
};

/**
 * Update an existing subscription plan
 */
export const updateSubscriptionPlan = async (documentId: string, data: any) => {
  const response = await api.put(`/subscription-plans/${documentId}`, { data });
  return response.data;
};

/**
 * Delete a subscription plan
 */
export const deleteSubscriptionPlan = async (documentId: string) => {
  const response = await api.delete(`/subscription-plans/${documentId}`);
  return response.data;
};

// ===== ADMIN FULL CRUD FOR USER SUBSCRIPTIONS =====

/**
 * Get all user-subscriptions for admin
 */
export const getAllUserSubscriptionsAdmin = async () => {
  const response = await api.get("/subscriptions/admin-all");
  return response.data;
};

/**
 * Create a new user-subscription manually
 */
export const createUserSubscriptionAdmin = async (data: any) => {
  const response = await api.post("/user-subscriptions", { data });
  return response.data;
};

/**
 * Update a user-subscription manually
 */
export const updateUserSubscriptionAdmin = async (
  documentId: string,
  data: any,
) => {
  const response = await api.put(`/user-subscriptions/${documentId}`, { data });
  return response.data;
};

/**
 * Delete a user-subscription manually
 */
export const deleteUserSubscriptionAdmin = async (documentId: string) => {
  const response = await api.delete(`/user-subscriptions/${documentId}`);
  return response.data;
};
