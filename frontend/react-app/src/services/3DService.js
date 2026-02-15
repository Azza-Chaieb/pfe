import api from "./apiClient";

export const getModels = async () => {
    try {
        const response = await api.get("/models?populate=*");
        return response.data;
    } catch (error) {
        console.error("Error fetching models", error);
        throw error;
    }
};

export const getCoworkingSpacesList = async () => {
    try {
        const response = await api.get("/coworking-spaces?fields[0]=name&fields[1]=id");
        return response.data;
    } catch (error) {
        console.error("Error fetching spaces list", error);
        throw error;
    }
};

export const upload3DModelToSpace = async (spaceId, file) => {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post(`/coworking-spaces/${spaceId}/3d-model`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    } catch (error) {
        console.error("3D Upload error:", error.response?.data || error);
        throw error;
    }
};

export const deleteModel = async (modelId) => {
    try {
        const response = await api.delete(`/models/${modelId}`);
        return response.data;
    } catch (error) {
        console.error("Delete model error:", error);
        throw error;
    }
};
