import api from "./apiClient";

export const getDashboardStats = async () => {
  // Fetches counts for various collections to display as stats
  try {
    const [users, reservations, payments, courses] = await Promise.all([
      api.get("/users/count").catch(() => ({ data: 0 })),
      api
        .get("/reservations?pagination[pageSize]=1")
        .catch(() => ({ data: { meta: { pagination: { total: 0 } } } })),
      api
        .get("/payments?pagination[pageSize]=1")
        .catch(() => ({ data: { meta: { pagination: { total: 0 } } } })),
      api
        .get("/courses?pagination[pageSize]=1")
        .catch(() => ({ data: { meta: { pagination: { total: 0 } } } })),
    ]);

    return {
      users: users.data?.length || users.data || 0,
      reservations: reservations.data?.meta?.pagination?.total || 0,
      payments: payments.data?.meta?.pagination?.total || 0,
      courses: courses.data?.meta?.pagination?.total || 0,
    };
  } catch (error) {
    console.error("Error fetching stats", error);
    return { users: 0, reservations: 0, payments: 0, courses: 0 };
  }
};

export const getRecentActivity = async () => {
  try {
    const response = await api.get(
      "/reservations?sort=createdAt:desc&pagination[limit]=5&populate=*",
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching recent activity", error);
    return null;
  }
};

export const getUserReservations = async (userId) => {
  try {
    const response = await api.get(
      `/reservations?filters[user][id][$eq]=${userId}&populate=*`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user reservations", error);
    throw error;
  }
};

export const getProfessionalBookings = async (userId) => {
  try {
    // Assuming bookings are reservations linked to the user
    // We populate coworking_space to show details
    const response = await api.get(
      `/reservations?filters[user][id][$eq]=${userId}&populate=coworking_space&sort=date:desc`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching professional bookings", error);
    throw error;
  }
};

export const getAllReservations = async () => {
  try {
    const response = await api.get("/reservations?populate=*&sort=date:desc");
    return response.data;
  } catch (error) {
    console.error("Error fetching all reservations:", error);
    throw error;
  }
};

export const createReservation = async (data) => {
  try {
    const response = await api.post("/reservations", {
      data: {
        ...data,
        status: "pending", // Default status
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating reservation", error);
    throw error;
  }
};

export const updateReservation = async (id, data) => {
  try {
    const response = await api.put(`/reservations/${id}`, {
      data: data,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating reservation", error);
    throw error;
  }
};

export const cancelReservation = async (id) => {
  return updateReservation(id, { status: "cancelled" });
};
