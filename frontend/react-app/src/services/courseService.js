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
    // Correctly fetch only the courses the user is enrolled in
    const response = await api.get("/enrollments/my-courses");
    return response.data;
  } catch (error) {
    console.error("Error fetching enrolled courses", error);
    throw error;
  }
};

export const enrollCourse = async (courseId) => {
  try {
    const response = await api.post("/enrollments/enroll", { courseId });
    return response.data;
  } catch (error) {
    console.error("Error enrolling in course", error);
    throw error;
  }
};

export const getMyEnrollments = async () => {
  try {
    const response = await api.get("/enrollments/my-courses");
    return response.data;
  } catch (error) {
    console.error("Error fetching my enrollments", error);
    throw error;
  }
};

export const getAllCourses = async () => {
  try {
    // Fetch all courses populated with cover and trainer info
    const response = await api.get("/courses?populate=*");
    return response.data;
  } catch (error) {
    console.error("Error fetching all courses catalog", error);
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
    // Correct approach: Fetch all enrollments for courses belonging to this trainer
    const response = await api.get(
      `/enrollments?filters[course][trainer]=${trainerId}&populate[student]=*&populate[course]=*`
    );

    // Group students and count unique ones, or just return list of enrollments
    const enrollments = response.data.data || [];
    const uniqueStudentsMap = new Map();

    enrollments.forEach(item => {
      const enrollment = item.attributes || item;
      const student = enrollment.student?.data?.attributes || enrollment.student?.data || enrollment.student || {};
      const studentId = enrollment.student?.data?.id || student.id;
      
      if (studentId && !uniqueStudentsMap.has(studentId)) {
        uniqueStudentsMap.set(studentId, {
          id: studentId,
          fullname: student.fullname || student.username || "Étudiant",
          username: student.username,
          email: student.email,
          enrolledAt: enrollment.enrolled_at,
          courseTitle: enrollment.course?.data?.attributes?.title || enrollment.course?.data?.title
        });
      }
    });

    return { data: Array.from(uniqueStudentsMap.values()) };
  } catch (error) {
    console.error("Error fetching trainer students", error);
    throw error;
  }
};


export async function getCourseEnrollmentCount(courseId) {
  try {
    const response = await api.get(`/enrollments?filters[course][documentId][$eq]=${courseId}&pagination[withCount]=true&pagination[limit]=0`);
    return response.data.meta?.pagination?.total || 0;
  } catch (error) {
    console.error("Error fetching enrollment count", error);
    return 0;
  }
}



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

export const deleteCourse = async (id) => {
  try {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting course ${id}`, error);
    throw error;
  }
};

export const updateCourse = async (id, courseData) => {

  try {
    const response = await api.put(`/courses/${id}`, { data: courseData });
    return response.data;
  } catch (error) {
    console.error(`Error updating course ${id}`, error);
    throw error;
  }
};

export const getCourseById = async (id) => {
  try {
    // Populate relations needed to show cover and documents
    const response = await api.get(`/courses/${id}?populate=*`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching course ${id}`, error);
    throw error;
  }
};
