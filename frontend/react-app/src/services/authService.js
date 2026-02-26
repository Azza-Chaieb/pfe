import api from "./apiClient";

export const register = async (userData) => {
  try {
    // Extract captchaToken if present to avoid Strapi validation errors in body
    const { captchaToken, ...data } = userData;
    const headers = captchaToken ? { "x-captcha-token": captchaToken } : {};

    console.log("🚀 [FRONTEND] Sending registration request");
    console.log("📦 [FRONTEND] Body (data):", data);
    console.log("📝 [FRONTEND] Headers:", headers);

    const response = await api.post("/auth/local/register", data, { headers });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const login = async (identifier, password) => {
  try {
    const response = await api.post("/auth/local", {
      identifier,
      password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      console.error("🛠️ [FRONTEND] Server error payload:", error.response.data);
    }
    throw error;
  }
};

export const resetPassword = async (code, password, passwordConfirmation) => {
  try {
    const response = await api.post("/auth/reset-password", {
      code,
      password,
      passwordConfirmation,
    });
    return response.data;
  } catch (error) {
    console.error("Reset password error", error);
    throw error;
  }
};
