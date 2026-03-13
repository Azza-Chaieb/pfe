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

export const updateCourseProgress = async (courseId, progress, lessonProgress) => {
  try {
    const response = await api.post("/enrollments/update-progress", {
      courseId,
      progress,
      lesson_progress: lessonProgress,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating course progress", error);
    throw error;
  }
};

export const createLiveSession = async (sessionData) => {
  try {
    const response = await api.post("/sessions/create-live", sessionData);
    return response.data;
  } catch (error) {
    const errorData = error.response?.data || error;
    console.error("FULL STRAPI ERROR (createLive):", errorData);
    throw error;
  }
};

export const getMySessions = async () => {
  try {
    const response = await api.get("/sessions/mine");
    return response.data;
  } catch (error) {
    console.error("Error fetching my sessions", error);
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
  // Use server-side filtering for better performance and reliability in Strapi 5
  const url = `/enrollments?filters[course][trainer][id][$eq]=${trainerId}&populate[student][fields]=username,email,fullname&populate[course][fields]=title&pagination[limit]=100`;
  try {
    const response = await api.get(url);
    const data = response.data.data || [];
    
    const uniqueStudentsMap = new Map();

    data.forEach(item => {
      // Strapi 5 response can have attributes or be direct
      const enrollment = item.attributes || item;
      const student = enrollment.student?.data?.attributes || enrollment.student?.attributes || enrollment.student || {};
      const studentId = enrollment.student?.data?.id || student.id || student.documentId || (item.student?.documentId);
      const course = enrollment.course?.data?.attributes || enrollment.course?.attributes || enrollment.course || {};

      if (studentId && !uniqueStudentsMap.has(studentId)) {
        uniqueStudentsMap.set(studentId, {
          id: studentId,
          fullname: student.fullname || student.username || "Étudiant",
          username: student.username,
          email: student.email,
          courseTitle: course.title || "Cours inconnu"
        });
      }
    });

    return { data: Array.from(uniqueStudentsMap.values()) };
  } catch (error) {
    console.error("Error fetching trainer students:", error);
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
  // DIAGNOSTIC approach: Fetch more than needed and filter on frontend
  // This helps identify if the 400 comes from the filter syntax
  const url = `/courses?populate=*&pagination[limit]=100`;
  console.log("DIAGNOSTIC - Fetching courses from:", url);
  try {
    const response = await api.get(url);
    const allCourses = response.data.data || [];
    
    // Filter by trainer ID on frontend
    const filtered = allCourses.filter(item => {
      const trainer = item.attributes?.trainer?.data || item.trainer?.data || item.trainer;
      const tId = trainer?.id || trainer?.documentId;
      return String(tId) === String(trainerId);
    });

    return { ...response.data, data: filtered };
  } catch (error) {
    console.error("DIAGNOSTIC Error fetching courses", error.response?.data || error);
    // Fallback to simpler query if the above fails
    const fallbackUrl = `/courses?populate=*&pagination[limit]=100`;
    const fallbackRes = await api.get(fallbackUrl);
    return fallbackRes.data;
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
    // Populate relations needed to show cover and documents using Strapi 5 syntax
    const response = await api.get(`/courses/${id}?populate=*`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching course ${id}`, error);
    throw error;
  }
};

/* --- Group Management Services (TASK-082/083) --- */
export const getGroups = async () => {
  try {
    const response = await api.get("/groups?populate=*");
    return response.data;
  } catch (error) {
    console.error("Error fetching groups", error);
    throw error;
  }
};

export const createGroup = async (groupData) => {
  try {
    const response = await api.post("/groups", { data: groupData });
    return response.data;
  } catch (error) {
    console.error("Error creating group", error);
    throw error;
  }
};

export const updateGroup = async (documentId, groupData) => {
  try {
    const response = await api.put(`/groups/${documentId}`, { data: groupData });
    return response.data;
  } catch (error) {
    console.error(`Error updating group ${documentId}`, error);
    throw error;
  }
};

export const deleteGroup = async (documentId) => {
  try {
    const response = await api.delete(`/groups/${documentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting group ${documentId}`, error);
    throw error;
  }
};

export const addGroupMembers = async (groupId, userIds) => {
  try {
    const response = await api.post(`/groups/${groupId}/members`, { userIds });
    return response.data;
  } catch (error) {
    console.error(`Error adding members to group ${groupId}`, error);
    throw error;
  }
};

export const removeGroupMember = async (groupId, userId) => {
  try {
    const response = await api.delete(`/groups/${groupId}/members/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing member ${userId} from group ${groupId}`, error);
    throw error;
  }
};
