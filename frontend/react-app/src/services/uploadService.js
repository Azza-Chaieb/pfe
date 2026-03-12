import api from "./apiClient";

/**
 * Uploads a file to Strapi's Media Library
 * @param {File} file The file object to upload
 * @param {string} refId (optional) The ID of the entry to link the file to
 * @param {string} ref (optional) The name of the collection type (e.g. 'api::course.course')
 * @param {string} field (optional) The name of the field in the entry (e.g. 'cover')
 * @returns {Promise<Object>} The uploaded file data from Strapi
 */
export const uploadFile = async (
  file,
  refId = null,
  ref = null,
  field = null,
) => {
  try {
    const formData = new FormData();
    formData.append("files", file);

    if (refId && ref && field) {
      formData.append("refId", refId);
      formData.append("ref", ref);
      formData.append("field", field);
    }

    const response = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Strapi v5 often returns the array of uploaded files directly
    return response.data && response.data.length > 0
      ? response.data[0]
      : response.data;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

/**
 * Deletes a file from Strapi's Media Library by ID
 * @param {string|number} id The ID of the media file
 */
export const deleteFile = async (id) => {
  try {
    const response = await api.delete(`/upload/files/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting file with id ${id}:`, error);
    throw error;
  }
};
