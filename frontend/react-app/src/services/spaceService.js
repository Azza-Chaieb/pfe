import api from "./apiClient";

export const getSpaces = async () => {
    try {
        const response = await api.get("/spaces?populate=*");
        return response.data;
    } catch (error) {
        console.error("Error fetching spaces", error);
        throw error;
    }
};

export const getSpaceById = async (idOrDocumentId) => {
    try {
        const response = await api.get(`/spaces/${idOrDocumentId}?populate=*`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching space with identifier ${idOrDocumentId}`, error);
        throw error;
    }
};

export const createSpace = async (data) => {
    try {
        const response = await api.post("/spaces", { data });
        return response.data;
    } catch (error) {
        console.error("Error creating space", error);
        throw error;
    }
};

export const updateSpace = async (idOrDocumentId, data) => {
    try {
        const response = await api.put(`/spaces/${idOrDocumentId}`, { data });
        return response.data;
    } catch (error) {
        console.error(`Error updating space with identifier ${idOrDocumentId}`, error);
        throw error;
    }
};

export const deleteSpace = async (idOrDocumentId) => {
    try {
        await api.delete(`/spaces/${idOrDocumentId}`);
        return true;
    } catch (error) {
        console.error(`Error deleting space with identifier ${idOrDocumentId}`, error);
        throw error;
    }
};

export const getEquipments = async () => {
    try {
        const response = await api.get("/equipments?populate=*");
        return response.data;
    } catch (error) {
        console.error("Error fetching equipments", error);
        throw error;
    }
};
