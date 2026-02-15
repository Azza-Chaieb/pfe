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
  cancelSubscription,
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

import * as service3D from "./services/3DService";
export const {
  getModels,
  getCoworkingSpacesList,
  upload3DModelToSpace,
  deleteModel,
} = service3D;

import * as spaceService from "./services/spaceService";
export const {
  getSpaces,
  getSpaceById,
  createSpace,
  updateSpace,
  deleteSpace,
} = spaceService;

import * as equipmentService from "./services/equipmentService";
export const {
  getEquipments,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} = equipmentService;

import * as serviceService from "./services/serviceService";
export const { getServicesList, createService, updateService, deleteService } =
  serviceService;

// Default export if needed (though named exports are preferred now)
export default api;
