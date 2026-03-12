import api from "./api";

export const getCategories = async () => {
  try {
    const response = await api.get("/course-categories?sort=name:asc");
    return response.data;
  } catch (error) {
    console.error("Error fetching categories", error);
    throw error;
  }
};

export const createCategory = async (name) => {
  try {
    const response = await api.post("/course-categories", { data: { name } });
    return response.data;
  } catch (error) {
    console.error("Error creating category", error);
    throw error;
  }
};
