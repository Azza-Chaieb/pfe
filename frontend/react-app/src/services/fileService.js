import api from "./apiClient";

export const uploadFile = async (formData) => {
  try {
    const response = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Upload error full details:", error.response?.data || error);
    throw error;
  }
};
