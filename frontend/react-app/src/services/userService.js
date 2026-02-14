import api from "./apiClient";

export const getUsers = async () => {
  try {
    const response = await api.get("/users?populate=*");
    return response.data;
  } catch (error) {
    console.error("Error fetching users", error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    await api.delete(`/users/${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting user", error);
    throw error;
  }
};

export const updateUser = async (id, data) => {
  try {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating user", error);
    throw error;
  }
};

export const updateSubProfile = async (endpoint, id, data) => {
  try {
    const response = await api.put(`${endpoint}/${id}`, { data });
    return response.data;
  } catch (error) {
    console.error(`Error updating profile at ${endpoint}`, error);
    throw error;
  }
};

export const getSubscriptionDetails = async (userId) => {
  try {
    // Fetch subscription linked to the user
    const response = await api.get(`/users/${userId}?populate=subscription`);
    return response.data.subscription; // user.subscription should be an array or object
  } catch (error) {
    console.error("Error fetching subscription details", error);
    throw error;
  }
};
