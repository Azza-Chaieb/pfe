import React from "react";
import { Navigate } from "react-router-dom";

export const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("jwt");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  let userType = (user.user_type || "").toLowerCase();

  // Fallback for primary admin
  if (user.username?.toLowerCase() === "admin") userType = "admin";

  console.log("AdminRoute check", { username: user.username, userType });

  if (!token) return <Navigate to="/login" />;

  if (userType !== "admin") {
    console.warn("AdminRoute access denied. Redirecting to /profile");
    return <Navigate to="/profile" />;
  }

  return children;
};

export const UserRoute = ({ children }) => {
  const token = localStorage.getItem("jwt");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  let userType = (user.user_type || "").toLowerCase();

  // Fallback for primary admin
  if (user.username?.toLowerCase() === "admin") userType = "admin";

  console.log("UserRoute check", { username: user.username, userType });

  if (!token) return <Navigate to="/login" />;

  if (userType === "admin") {
    console.log("Admin detected on UserRoute. Redirecting to /admin");
    return <Navigate to="/admin" />;
  }
  return children;
};
