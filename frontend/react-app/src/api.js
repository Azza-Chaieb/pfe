import api from "./services/apiClient";
import * as authService from "./services/authService";
import * as userService from "./services/userService";
import * as courseService from "./services/courseService";
import * as bookingService from "./services/bookingService";
import * as fileService from "./services/fileService";

// Re-export individually for backward compatibility
export const { register, login, forgotPassword, resetPassword } = authService;
export const {
  getUsers,
  deleteUser,
  updateUser,
  updateSubProfile,
  getSubscriptionDetails,
} = userService;
export const {
  getContent,
  getEnrolledCourses,
  getUpcomingSessions,
  getTrainerStudents,
  getTrainerCourses,
  createCourse,
} = courseService;
export const {
  getDashboardStats,
  getRecentActivity,
  getUserReservations,
  getProfessionalBookings,
} = bookingService;
export const { uploadFile } = fileService;

// Default export if needed (though named exports are preferred now)
export default api;
