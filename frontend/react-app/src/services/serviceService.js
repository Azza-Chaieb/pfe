/**
 * @module serviceService
 * @description API service for managing additional services.
 */

import api from "./apiClient";

/**
 * Fetches all services with their relations.
 * @returns {Promise<Object>} The response containing the services list.
 */
export const getServicesList = async () => {
  try {
    const response = await api.get("/services?populate=*");
    return response.data;
  } catch (error) {
    console.error("[serviceService] Error fetching services:", error);
    throw error;
  }
};

/**
 * Creates a new service.
 * @param {Object} data - The service data.
 * @returns {Promise<Object>} The created service.
 */
export const createService = async (data) => {
  try {
    const response = await api.post("/services", { data });
    return response.data;
  } catch (error) {
    console.error("[serviceService] Error creating service:", error);
    throw error;
  }
};

/**
 * Updates an existing service.
 * @param {string|number} id - Resource ID.
 * @param {Object} data - Updated data.
 * @returns {Promise<Object>} The updated service.
 */
export const updateService = async (id, data) => {
  try {
    const response = await api.put(`/services/${id}`, { data });
    return response.data;
  } catch (error) {
    console.error(`[serviceService] Error updating service ${id}:`, error);
    throw error;
  }
};

/**
 * Removes a service from the database.
 * @param {string|number} id - Resource ID.
 * @returns {Promise<boolean>}
 */
export const deleteService = async (id) => {
  try {
    await api.delete(`/services/${id}`);
    return true;
  } catch (error) {
    console.error(`[serviceService] Error deleting service ${id}:`, error);
    throw error;
  }
};
