import api from "./apiClient";

export const getContent = async () => {
  // Example: fetch courses as content
  try {
    const response = await api.get("/courses");
    return response.data;
  } catch (error) {
    console.error("Error fetching content", error);
    throw error;
  }
};

export const getEnrolledCourses = async () => {
  try {
    const response = await api.get("/courses?populate=*");
    return response.data;
  } catch (error) {
    console.error("Error fetching courses", error);
    throw error;
  }
};

export const getUpcomingSessions = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const response = await api.get(
      `/sessions?filters[date][$gte]=${today}&sort=date:asc&populate=*`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching upcoming sessions", error);
    throw error;
  }
};

export const getTrainerStudents = async (trainerId) => {
  try {
    // Better approach: Get courses for this trainer and populate students
    const response = await api.get(
      `/courses?filters[trainer][id][$eq]=${trainerId}&populate=*`,
    );

    // Flatten all students from all courses into a single array
    const students = response.data.data.reduce((acc, item) => {
      const courseData = item.attributes || item;
      const courseStudents =
        courseData.students?.data || courseData.students || [];

      const mappedStudents = courseStudents.map((s) => {
        const studentData = s.attributes || s;
        return {
          ...studentData,
          id: s.id,
          courseTitle: courseData.title,
        };
      });
      return [...acc, ...mappedStudents];
    }, []);

    // Remove duplicates based on ID
    return Array.from(new Map(students.map((s) => [s.id, s])).values());
  } catch (error) {
    console.error("Error fetching trainer students", error);
    throw error;
  }
};

export const getTrainerCourses = async (trainerId) => {
  try {
    // Robust filter for relation mapping (works in V4 and V5)
    const response = await api.get(
      `/courses?filters[trainer][id][$eq]=${trainerId}&populate=*`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching trainer courses", error);
    throw error;
  }
};

export const createCourse = async (courseData) => {
  try {
    const response = await api.post("/courses", { data: courseData });
    return response.data;
  } catch (error) {
    console.error("Error creating course", error);
    throw error;
  }
};
