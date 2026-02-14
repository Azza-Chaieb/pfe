import axios from 'axios';

const API_URL = 'http://localhost:1337/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("API Request with Token:", config.url);
    } else {
      console.warn("API Request WITHOUT Token:", config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/local/register', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const login = async (identifier, password) => {
  try {
    const response = await api.post('/auth/local', {
      identifier,
      password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDashboardStats = async () => {
  // Fetches counts for various collections to display as stats
  try {
    const [users, reservations, payments, courses] = await Promise.all([
      api.get('/users/count').catch(() => ({ data: 0 })), // Strapi might not expose count by default for all, we might need to fetch list and count length if count endpoint missing
      api.get('/reservations?pagination[pageSize]=1').catch(() => ({ data: { meta: { pagination: { total: 0 } } } })),
      api.get('/payments?pagination[pageSize]=1').catch(() => ({ data: { meta: { pagination: { total: 0 } } } })),
      api.get('/courses?pagination[pageSize]=1').catch(() => ({ data: { meta: { pagination: { total: 0 } } } }))
    ]);

    // Strapi v4/v5 usually returns { data: [], meta: { pagination: { total: X } } } for lists
    // Users (users-permissions) might be different. Let's assume standard response or fallback.

    return {
      users: users.data?.length || users.data || 0, // /users often returns array
      reservations: reservations.data?.meta?.pagination?.total || 0,
      payments: payments.data?.meta?.pagination?.total || 0,
      courses: courses.data?.meta?.pagination?.total || 0,
    };
  } catch (error) {
    console.error("Error fetching stats", error);
    return { users: 0, reservations: 0, payments: 0, courses: 0 };
  }
};

export const getRecentActivity = async () => {
  try {
    const response = await api.get('/reservations?sort=createdAt:desc&pagination[limit]=5&populate=*');
    return response.data;
  } catch (error) {
    console.error("Error fetching recent activity", error);
    return null;
  }
};

export const getUsers = async () => {
  try {
    const response = await api.get('/users?populate=*');
    return response.data;
  } catch (error) {
    console.error("Error fetching users", error);
    throw error;
  }
};

export const getContent = async () => {
  // Example: fetch courses as content
  try {
    const response = await api.get('/courses');
    return response.data;
  } catch (error) {
    console.error("Error fetching content", error);
    throw error;
  }
};



export const deleteUser = async (id) => {
  try {
    await api.delete(`/users/${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting user", error);
    throw error;
  }
};

export const updateUser = async (id, data) => {
  try {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating user", error);
    throw error;
  }
};

export const uploadFile = async (formData) => {
  try {
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error("Upload error full details:", error.response?.data || error);
    throw error;
  }
};

export const updateSubProfile = async (endpoint, id, data) => {
  try {
    const response = await api.put(`${endpoint}/${id}`, { data });
    return response.data;
  } catch (error) {
    console.error(`Error updating profile at ${endpoint}`, error);
    throw error;
  }
};

export const getUserReservations = async (userId) => {
  try {
    const response = await api.get(`/reservations?filters[user][id][$eq]=${userId}&populate=*`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user reservations", error);
    throw error;
  }
};

export const getEnrolledCourses = async () => {
  try {
    const response = await api.get('/courses?populate=*');
    return response.data;
  } catch (error) {
    console.error("Error fetching courses", error);
    throw error;
  }
};

export const getUpcomingSessions = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await api.get(`/sessions?filters[date][$gte]=${today}&sort=date:asc&populate=*`);
    return response.data;
  } catch (error) {
    console.error("Error fetching upcoming sessions", error);
    throw error;
  }
};

export const getTrainerStudents = async (trainerId) => {
  try {
    // Better approach: Get courses for this trainer and populate students
    const response = await api.get(`/courses?filters[trainer][id][$eq]=${trainerId}&populate=*`);

    // Flatten all students from all courses into a single array
    const students = response.data.data.reduce((acc, item) => {
      const courseData = item.attributes || item;
      const courseStudents = courseData.students?.data || courseData.students || [];

      const mappedStudents = courseStudents.map(s => {
        const studentData = s.attributes || s;
        return {
          ...studentData,
          id: s.id,
          courseTitle: courseData.title
        };
      });
      return [...acc, ...mappedStudents];
    }, []);

    // Remove duplicates based on ID
    return Array.from(new Map(students.map(s => [s.id, s])).values());
  } catch (error) {
    console.error("Error fetching trainer students", error);
    throw error;
  }
};

export const getTrainerCourses = async (trainerId) => {
  try {
    // Robust filter for relation mapping (works in V4 and V5)
    const response = await api.get(`/courses?filters[trainer][id][$eq]=${trainerId}&populate=*`);
    return response.data;
  } catch (error) {
    console.error("Error fetching trainer courses", error);
    throw error;
  }
};

export const createCourse = async (courseData) => {
  try {
    const response = await api.post('/courses', { data: courseData });
    return response.data;
  } catch (error) {
    console.error("Error creating course", error);
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error("Forgot password error", error);
    throw error;
  }
};

export default api;
