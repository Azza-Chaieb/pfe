import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import api from "../services/apiClient";

/**
 * Validates the JWT token against the backend and returns the verified user.
 * Returns null if the token is absent, expired, or invalid.
 */
const useAuthVerification = () => {
  const [status, setStatus] = useState("loading"); // "loading" | "valid" | "invalid"
  const [verifiedUser, setVerifiedUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      setStatus("invalid");
      return;
    }

    // Verify token against the backend — prevents localStorage tampering
    api
      .get("/users/me?populate=role")
      .then((res) => {
        setVerifiedUser(res.data);
        setStatus("valid");
      })
      .catch(() => {
        // Token is expired or invalid — clear stale data
        localStorage.removeItem("jwt");
        localStorage.removeItem("user");
        setStatus("invalid");
      });
  }, []);

  return { status, verifiedUser };
};

export const AdminRoute = ({ children }) => {
  const { status, verifiedUser } = useAuthVerification();

  if (status === "loading") {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-sm font-bold animate-pulse">
          Vérification en cours...
        </div>
      </div>
    );
  }

  if (status === "invalid") return <Navigate to="/login" replace />;

  // Check admin status from verified server data
  const userType = (verifiedUser?.user_type || "").toLowerCase();
  const isAdmin =
    userType === "admin" || verifiedUser?.username?.toLowerCase() === "admin";

  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export const UserRoute = ({ children }) => {
  const { status, verifiedUser } = useAuthVerification();

  if (status === "loading") {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-sm font-bold animate-pulse">
          Vérification en cours...
        </div>
      </div>
    );
  }

  if (status === "invalid") return <Navigate to="/login" replace />;

  const userType = (verifiedUser?.user_type || "").toLowerCase();
  const isAdmin =
    userType === "admin" || verifiedUser?.username?.toLowerCase() === "admin";

  if (isAdmin) return <Navigate to="/admin" replace />;

  return children;
};
