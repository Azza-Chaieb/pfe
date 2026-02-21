// src/App.jsx
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Scene from "./components/Scene";

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

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("jwt");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  let userType = (user.user_type || "").toLowerCase();

  // Fallback for primary admin
  if (user.username?.toLowerCase() === "admin") userType = "admin";

  console.log("App: AdminRoute check", { username: user.username, userType });

  if (!token) return <Navigate to="/login" />;

  if (userType !== "admin") {
    console.warn("App: AdminRoute access denied. Redirecting to /profile");
    return <Navigate to="/profile" />;
  }

  return children;
};

AdminRoute.propTypes = {
  children: PropTypes.node,
};

const UserRoute = ({ children }) => {
  const token = localStorage.getItem("jwt");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  let userType = (user.user_type || "").toLowerCase();

  // Fallback for primary admin
  if (user.username?.toLowerCase() === "admin") userType = "admin";

  console.log("App: UserRoute check", { username: user.username, userType });

  if (!token) return <Navigate to="/login" />;

  if (userType === "admin") {
    console.log("App: Admin detected on UserRoute. Redirecting to /admin");
    return <Navigate to="/admin" />;
  }
  return children;
};

UserRoute.propTypes = {
  children: PropTypes.node,
};

function App() {
  const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);
  const [firebaseData, setFirebaseData] = useState([]);
  const [firebaseStatus, setFirebaseStatus] = useState("Déconnecté");
  const [firebaseLoading, setFirebaseLoading] = useState(false);
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
        setFirebaseStatus("Connecté");

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
      setFirebaseToken("");
      setFirebaseStatus("Déconnecté");
    }
  }, [location.pathname]);

  const fetchFirebaseData = async () => {
    setFirebaseLoading(true);

    if (!userSession.isLoggedIn) {
      setFirebaseStatus("Non connecté");
      setFirebaseLoading(false);
      return;
    }

    try {
      const activity = await getRecentActivity();
      if (activity && activity.data) {
        const mappedData = activity.data.map((item) => ({
          id: item.id,
          name: `Réservation #${item.id}`,
          status: item.attributes?.status || "Info",
          time: new Date(item.attributes?.createdAt).toLocaleTimeString(),
          type: "reservation",
          details: item.attributes?.details || "Détails non disponibles",
        }));
        setFirebaseData(mappedData);
        setFirebaseStatus(`Connecté (${mappedData.length} notifications)`);
      } else {
        setFirebaseData([]);
      }
    } catch (error) {
      console.error("Failed to fetch activity", error);
      setFirebaseStatus("Erreur");
    } finally {
      setFirebaseLoading(false);
    }
  };

  const handleFirebaseClick = () => {
    setIsFirebaseOpen(!isFirebaseOpen);
    if (!isFirebaseOpen) {
      fetchFirebaseData();
    }
  };

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

  const copyTokenToClipboard = () => {
    if (firebaseToken) {
      navigator.clipboard
        .writeText(firebaseToken)
        .then(() => alert("Token copié !"))
        .catch((err) => console.error("Erreur copie", err));
    }
  };

  // decodeToken removed (unused) to satisfy lint rules

  // Reusable Firebase Widget Component Logic
  const FirebaseWidget = () => (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        zIndex: 10000,
      }}
    >
      <button
        onClick={handleFirebaseClick}
        style={{
          padding: "12px 24px",
          background: "linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)",
          color: "white",
          border: "none",
          borderRadius: "50px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0 4px 15px rgba(255, 140, 0, 0.3)",
          transition: "all 0.3s ease",
        }}
      >
        🔥 Firebase
        <span
          style={{
            fontSize: "12px",
            background: "rgba(255, 255, 255, 0.2)",
            padding: "2px 8px",
            borderRadius: "10px",
          }}
        >
          {firebaseStatus}
        </span>
      </button>

      {isFirebaseOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "70px",
            left: "0",
            width: "400px",
            background: "white",
            borderRadius: "15px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
            overflow: "hidden",
            zIndex: 10001,
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)",
              padding: "20px",
              color: "white",
            }}
          >
            <h3 style={{ margin: 0 }}>🔥 Firebase Session</h3>
            {userSession.isLoggedIn && userSession.user && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>
                  {userSession.user.username}
                </p>
                <p style={{ margin: 0, fontSize: "11px", opacity: 0.9 }}>
                  {userSession.user.email}
                </p>
              </div>
            )}
          </div>

          <div
            style={{
              padding: "15px 20px",
              background: "#f8f9fa",
              borderBottom: "1px solid #eee",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <strong>🔑 Token JWT</strong>
              <div style={{ display: "flex", gap: "5px" }}>
                <button
                  onClick={() => setShowToken(!showToken)}
                  style={{ padding: "3px 8px", fontSize: "11px" }}
                >
                  {showToken ? "Hide" : "Show"}
                </button>
                <button
                  onClick={copyTokenToClipboard}
                  style={{ padding: "3px 8px", fontSize: "11px" }}
                >
                  Copy
                </button>
              </div>
            </div>
            <div
              style={{
                fontSize: "11px",
                wordBreak: "break-all",
                maxHeight: showToken ? "100px" : "20px",
                overflow: "hidden",
              }}
            >
              {firebaseToken || "No token found"}
            </div>
          </div>

          <div
            style={{ padding: "20px", maxHeight: "200px", overflowY: "auto" }}
          >
            <h4 style={{ margin: "0 0 10px 0" }}>📢 Notifications</h4>
            {firebaseData.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: "8px",
                  borderBottom: "1px solid #eee",
                  fontSize: "12px",
                }}
              >
                <strong>{item.name}</strong> - {item.time}
              </div>
            ))}
          </div>

          <div style={{ padding: "15px", display: "flex", gap: "5px" }}>
            <button
              onClick={fetchFirebaseData}
              style={{ flex: 1, padding: "8px", fontSize: "12px" }}
              disabled={firebaseLoading}
            >
              {firebaseLoading ? "Chargement..." : "Rafraîchir"}
            </button>
            <button
              onClick={handleLogout}
              style={{
                flex: 1,
                padding: "8px",
                fontSize: "12px",
                background: "#dc3545",
                color: "white",
                border: "none",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Scene />

              <div
                style={{
                  position: "absolute",
                  bottom: "20px",
                  right: "20px",
                  zIndex: 1000,
                  display: "flex",
                  gap: "10px",
                }}
              >
                {!userSession.isLoggedIn ? (
                  <button
                    onClick={() => navigate("/login")}
                    style={{
                      padding: "15px 25px",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
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
                    style={{
                      padding: "15px 25px",
                      background:
                        "linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
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

      <FirebaseWidget />
    </div>
  );
}

export default App;
