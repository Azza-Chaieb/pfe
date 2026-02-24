import api from "./apiClient";

export const getDashboardStats = async () => {
  // Fetches counts for various collections to display as stats
  try {
    const [users, bookings, payments, courses] = await Promise.all([
      api.get("/users/count").catch(() => ({ data: 0 })),
      api
        .get("/bookings?pagination[pageSize]=1")
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
      reservations: bookings.data?.meta?.pagination?.total || 0,
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
      "/bookings?sort=createdAt:desc&pagination[limit]=5&populate=*",
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching recent activity", error);
    return null;
  }
};

export const getUserReservations = async (userId, page = 1, pageSize = 25) => {
  try {
    const response = await api.get(
      `/bookings?filters[user][id][$eq]=${userId}&populate[0]=space&populate[1]=payment&sort=start_time:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user reservations", error);
    throw error;
  }
};

export const getProfessionalBookings = async (
  userId,
  page = 1,
  pageSize = 25,
) => {
  try {
    const response = await api.get(
      `/bookings?filters[user][id][$eq]=${userId}&populate[0]=space&populate[1]=payment&sort=start_time:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching professional bookings", error);
    throw error;
  }
};

export const getAllReservations = async (page = 1, pageSize = 50) => {
  try {
    const response = await api.get(
      `/bookings?populate[0]=user&populate[1]=space&populate[2]=space.coworking_space&populate[3]=payment&populate[4]=payment.proof_url&sort[0]=start_time:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching all reservations:", error);
    throw error;
  }
};

export const createReservation = async (data) => {
  try {
    const response = await api.post("/bookings", {
      data: {
        ...data,
        status: "pending", // Default status
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating reservation", error);
    if (error.response) {
      console.error(
        "Server response:",
        error.response.status,
        error.response.data,
      );
    }
    throw error;
  }
};

export const updateReservation = async (id, data) => {
  try {
    const response = await api.put(`/bookings/${id}`, {
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

// Payment Services
export const createPayment = async (data) => {
  try {
    const response = await api.post("/payments", {
      data: {
        ...data,
        status: "pending",
        transaction_ref: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating payment", error);
    throw error;
  }
};

export const submitPaymentProof = async (paymentId, file) => {
  try {
    const formData = new FormData();
    formData.append("files", file);
    formData.append("ref", "api::payment.payment");
    formData.append("refId", paymentId);
    formData.append("field", "proof_url");

    const uploadResponse = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const updateResponse = await api.put(`/payments/${paymentId}`, {
      data: { status: "submitted" },
    });

    return { upload: uploadResponse.data, payment: updateResponse.data };
  } catch (error) {
    console.error("Error submitting proof", error);
    throw error;
  }
};

export const confirmPayment = async (paymentId) => {
  try {
    const response = await api.post(`/payments/${paymentId}/confirm`);
    return response.data;
  } catch (error) {
    console.error("Error confirming payment", error);
    throw error;
  }
};
