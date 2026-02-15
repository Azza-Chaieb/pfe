/**
 * @module equipmentService
 * @description API service for managing equipment resources.
 */

import api from "./apiClient";

/**
 * Fetches all equipments with their relations.
 * @returns {Promise<Object>} The response containing the equipment list.
 */
export const getEquipments = async () => {
  try {
    const response = await api.get("/equipments?populate=*");
    return response.data;
  } catch (error) {
    console.error("[equipmentService] Error fetching equipments:", error);
    throw error;
  }
};

/**
 * Creates a new equipment.
 * @param {Object} data - The equipment data.
 * @returns {Promise<Object>} The created equipment.
 */
export const createEquipment = async (data) => {
  try {
    const response = await api.post("/equipments", { data });
    return response.data;
  } catch (error) {
    console.error("[equipmentService] Error creating equipment:", error);
    throw error;
  }
};

/**
 * Updates an existing equipment.
 * @param {string|number} id - Resource ID.
 * @param {Object} data - Updated data.
 * @returns {Promise<Object>} The updated equipment.
 */
export const updateEquipment = async (id, data) => {
  try {
    const response = await api.put(`/equipments/${id}`, { data });
    return response.data;
  } catch (error) {
    console.error(`[equipmentService] Error updating equipment ${id}:`, error);
    throw error;
  }
};

/**
 * Removes an equipment from the database.
 * @param {string|number} id - Resource ID.
 * @returns {Promise<boolean>}
 */
export const deleteEquipment = async (id) => {
  try {
    await api.delete(`/equipments/${id}`);
    return true;
  } catch (error) {
    console.error(`[equipmentService] Error deleting equipment ${id}:`, error);
    throw error;
  }
};
