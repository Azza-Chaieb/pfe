import api from "./apiClient";

/**
 * Fetches all equipments with their relations.
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
 */
export const updateEquipment = async (id, data) => {
  try {
    const response = await api.put(`/equipments/${id}`, { data });
    return response.data;
  } catch (error) {
    console.error(
      `[equipmentService] Error refreshing equipment ${id}:`,
      error,
    );
    throw error;
  }
};

/**
 * Removes an equipment from the database.
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

// --- Selection & Availability Logic ---

export const getEquipmentAvailability = async (id, start, end) => {
  try {
    const response = await api.get(`/equipments/${id}/availability`, {
      params: { start, end },
    });
    return response.data.data.availableQty;
  } catch (error) {
    console.error("Error fetching equipment availability", error);
    return 0;
  }
};

export const lockEquipment = async (equipmentId, start_time, end_time) => {
  try {
    const response = await api.post("/equipment-locks/lock", {
      data: { equipmentId, start_time, end_time },
    });
    return response.data;
  } catch (error) {
    console.error("Error locking equipment", error);
    throw error;
  }
};

export const unlockEquipment = async (equipmentId) => {
  try {
    const response = await api.post("/equipment-locks/unlock", {
      data: { equipmentId },
    });
    return response.data;
  } catch (error) {
    console.error("Error unlocking equipment", error);
    throw error;
  }
};
