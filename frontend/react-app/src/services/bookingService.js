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
    // Nested object population is more robust for deep relations in Strapi v5
    const response = await api.get(
      `/bookings?filters[user][id][$eq]=${userId}&populate[space][populate]=*&populate[payment]=true&populate[equipments][populate]=*&populate[services][populate]=*&sort=start_time:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
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
      `/bookings?filters[user][id][$eq]=${userId}&populate[space][populate]=*&populate[payment]=true&populate[equipments][populate]=*&populate[services][populate]=*&sort=start_time:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
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
      `/bookings?populate[user]=true&populate[space][populate]=*&populate[payment][populate][proof_url]=true&populate[equipments][populate]=*&populate[services][populate]=*&sort[0]=start_time:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
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
export const getBookingById = async (id) => {
  const populateParams =
    "populate[space][populate]=*&populate[payment]=true&populate[equipments][populate]=*&populate[services][populate]=*";

  try {
    // Strapi v5: numeric IDs use /bookings/:id, documentId strings use filters
    const isNumeric = !isNaN(Number(id)) && String(id).trim() !== "";

    if (isNumeric) {
      const response = await api.get(`/bookings/${id}?${populateParams}`);
      return response.data;
    } else {
      // documentId is a string — use filters endpoint
      const response = await api.get(
        `/bookings?filters[documentId][$eq]=${id}&${populateParams}`,
      );
      const items = response.data?.data;
      if (!items || items.length === 0) {
        throw new Error(`Booking with documentId "${id}" not found`);
      }
      // Return in same shape as single-item response
      return { data: items[0], meta: response.data?.meta };
    }
  } catch (error) {
    console.error(`Error fetching booking ${id}:`, error);
    throw error;
  }
};

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

/**
 * Downloads the PDF invoice for a specific booking
 */
export const downloadInvoice = async (bookingId, filename = "facture.pdf") => {
  try {
    const response = await api.get(`/bookings/${bookingId}/invoice`, {
      responseType: "blob", // Very important for files
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (error.response && error.response.data instanceof Blob) {
      const text = await error.response.data.text();
      console.error("Détails de l'erreur backend (Blob JSON):", text);
    }
    console.error("Error downloading invoice:", error);
    throw error;
  }
};
