// src/App.jsx
import React, { useState, useEffect } from "react";
import Scene from "./components/Scene";
import FirebaseWidget from "./components/FirebaseWidget";

import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Dashboard from "./admin/components/layout/pages/Dashboard";

import Users from "./admin/components/layout/pages/Users";
import Content from "./admin/components/layout/pages/Content";
import Settings from "./admin/components/layout/pages/Settings";
import Login from "./admin/components/layout/pages/Login";
import ReservationManagement from "./admin/components/layout/pages/ReservationManagement";
import EquipmentServiceManagement from "./admin/components/layout/pages/EquipmentServiceManagement";
import UserDashboard from "./pages/UserDashboard";
import RegisterPage from "./pages/RegisterPage";
import StudentDashboard from "./pages/StudentDashboard";
import TrainerDashboard from "./pages/TrainerDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProfessionalDashboard from "./pages/ProfessionalDashboard";
import ModelTestPage from "./pages/ModelTestPage";
import ModelManagement from "./admin/components/layout/pages/ModelManagement";
import ExplorationScene from "./components/3d/ExplorationScene";

import SpaceManagement from "./admin/components/layout/pages/SpaceManagement";
import SpaceCatalog from "./pages/SpaceCatalog";
import AssociationDashboard from "./pages/AssociationDashboard";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import { getRecentActivity } from "./api";

import { requestNotificationPermission } from "./services/notificationService";

import { AdminRoute, UserRoute } from "./components/ProtectedRoute";

function App() {
  const [firebaseToken, setFirebaseToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [userSession, setUserSession] = useState({
    isLoggedIn: false,
    user: null,
    token: null,
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const syncNotificationToken = async (userId) => {
      try {
        const token = await requestNotificationPermission();
        if (token && userId) {
          console.log("[App] Syncing FCM token for user:", userId);
          const { updateFcmToken } = await import("./services/userService");
          await updateFcmToken(userId, token);
        }
      } catch (err) {
        console.error("[App] Failed to sync FCM token:", err);
      }
    };

    const token = localStorage.getItem("jwt");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserSession({
          isLoggedIn: true,
          user: user,
          token: token,
        });
        setFirebaseToken(token);

        // Sync token if user is logged in
        syncNotificationToken(user.id);
      } catch (e) {
        console.error("Error parsing user data", e);
        localStorage.removeItem("jwt");
        localStorage.removeItem("user");
      }
    } else {
      setUserSession({
        isLoggedIn: false,
        user: null,
        token: null,
      });
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    setUserSession({
      isLoggedIn: false,
      user: null,
      token: null,
    });
    setFirebaseToken("");
    navigate("/login");
  };

  // decodeToken removed (unused) to satisfy lint rules

  return (
    <div className="w-screen h-screen relative">
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Scene />

              <div className="absolute bottom-5 right-5 z-50 flex gap-2.5">
                {!userSession.isLoggedIn ? (
                  <button
                    onClick={() => navigate("/login")}
                    className="px-6 py-3.5 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-none rounded-xl cursor-pointer text-lg font-bold shadow-lg hover:opacity-90 transition-all"
                  >
                    Connexion
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const user = JSON.parse(
                        localStorage.getItem("user") || "{}",
                      );
                      const userType = (user.user_type || "").toLowerCase();
                      if (
                        userType === "admin" ||
                        user.username?.toLowerCase() === "admin"
                      ) {
                        navigate("/admin");
                      } else if (
                        userType === "etudiant" ||
                        userType === "student"
                      ) {
                        navigate("/dashboard");
                      } else if (
                        userType === "formateur" ||
                        userType === "trainer"
                      ) {
                        navigate("/trainer/dashboard");
                      } else if (userType === "professional") {
                        navigate("/professional/dashboard");
                      } else if (userType === "association") {
                        navigate("/association/dashboard");
                      } else {
                        navigate("/profile");
                      }
                    }}
                    className="px-6 py-3.5 bg-gradient-to-br from-[#00C9FF] to-[#92FE9D] text-white border-none rounded-xl cursor-pointer text-lg font-bold shadow-lg hover:opacity-90 transition-all"
                  >
                    {(() => {
                      const user = JSON.parse(
                        localStorage.getItem("user") || "{}",
                      );
                      const userType = (user.user_type || "").toLowerCase();
                      return userType === "admin" ||
                        user.username?.toLowerCase() === "admin"
                        ? "Dashboard Admin"
                        : "Mon Profil";
                    })()}
                  </button>
                )}
              </div>
            </>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/spaces" element={<SpaceCatalog />} />
        <Route path="/explore/:spaceId" element={<ExplorationScene />} />

        <Route path="/test-3d" element={<ModelTestPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset_password" element={<ResetPassword />} />
        <Route path="/subscription-plans" element={<SubscriptionPlans />} />
        <Route
          path="/professional/dashboard"
          element={
            <UserRoute>
              <ProfessionalDashboard />
            </UserRoute>
          }
        />
        <Route
          path="/professional/bookings"
          element={
            <UserRoute>
              <ProfessionalDashboard activeTab="bookings" />
            </UserRoute>
          }
        />
        <Route
          path="/professional/subscription"
          element={
            <UserRoute>
              <ProfessionalDashboard activeTab="subscription" />
            </UserRoute>
          }
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/profile"
          element={
            <UserRoute>
              <UserDashboard />
            </UserRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <UserRoute>
              <StudentDashboard />
            </UserRoute>
          }
        />
        <Route
          path="/student/courses"
          element={
            <UserRoute>
              <StudentDashboard activeTab="courses" />
            </UserRoute>
          }
        />
        <Route
          path="/student/bookings"
          element={
            <UserRoute>
              <StudentDashboard activeTab="bookings" />
            </UserRoute>
          }
        />
        <Route
          path="/trainer/dashboard"
          element={
            <UserRoute>
              <TrainerDashboard />
            </UserRoute>
          }
        />
        <Route
          path="/trainer/manage"
          element={
            <UserRoute>
              <TrainerDashboard activeTab="manage" />
            </UserRoute>
          }
        />
        <Route
          path="/trainer/students"
          element={
            <UserRoute>
              <TrainerDashboard activeTab="students" />
            </UserRoute>
          }
        />
        <Route
          path="/trainer/bookings"
          element={
            <UserRoute>
              <TrainerDashboard activeTab="bookings" />
            </UserRoute>
          }
        />
        <Route
          path="/association/dashboard"
          element={
            <UserRoute>
              <AssociationDashboard />
            </UserRoute>
          }
        />
        <Route
          path="/association/events"
          element={
            <UserRoute>
              <AssociationDashboard activeTab="events" />
            </UserRoute>
          }
        />
        <Route
          path="/association/members"
          element={
            <UserRoute>
              <AssociationDashboard activeTab="members" />
            </UserRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="users" element={<Users />} />
                <Route
                  path="reservations"
                  element={<ReservationManagement />}
                />
                <Route path="models" element={<ModelManagement />} />
                <Route path="content" element={<Content />} />
                <Route path="spaces" element={<SpaceManagement />} />
                <Route
                  path="equipments-services"
                  element={<EquipmentServiceManagement />}
                />
                <Route path="settings" element={<Settings />} />
              </Routes>
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <FirebaseWidget userSession={userSession} firebaseToken={firebaseToken} />
    </div>
  );
}

export default App;
