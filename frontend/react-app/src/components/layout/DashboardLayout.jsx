import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/apiClient";

/**
 * Modern Sidebar Navigation Component
 */
const Sidebar = ({ role, activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getMenuItems = (role) => {
    const common = [
      {
        id: "dashboard",
        label: "Tableau de Bord",
        icon: "🏠",
        path: role === "student" ? "/dashboard" : `/${role}/dashboard`,
      },
      { id: "profile", label: "Mon Profil", icon: "👤", path: "/profile" },
    ];

    const roleSpecific = {
      student: [
        {
          id: "courses",
          label: "Mes Cours",
          icon: "📚",
          path: "/student/courses",
        },
        {
          id: "bookings",
          label: "Mes Réservations",
          icon: "📅",
          path: "/student/bookings",
        },
      ],
      trainer: [
        {
          id: "my-courses",
          label: "Gestion Cours",
          icon: "✍️",
          path: "/trainer/manage",
        },
        {
          id: "students",
          label: "Mes Étudiants",
          icon: "👥",
          path: "/trainer/students",
        },
        {
          id: "bookings",
          label: "Mes Réservations",
          icon: "📅",
          path: "/trainer/bookings",
        },
      ],
      professional: [
        {
          id: "bookings",
          label: "Espaces Réservés",
          icon: "🏢",
          path: "/professional/bookings",
        },
        {
          id: "subscription",
          label: "Abonnement",
          icon: "💎",
          path: "/professional/subscription",
        },
      ],
      association: [
        {
          id: "events",
          label: "Événements",
          icon: "🌟",
          path: "/association/events",
        },
        {
          id: "members",
          label: "Membres",
          icon: "🤝",
          path: "/association/members",
        },
      ],
    };

    return [...common.slice(0, 1), ...(roleSpecific[role] || []), common[1]];
  };

  const menuItems = getMenuItems(role);

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");

    // Explicitly clean up API client headers
    delete api.defaults.headers.common["Authorization"];

    navigate("/login");
  };

  return (
    <aside className="w-64 bg-white/70 backdrop-blur-2xl border-r border-white/40 h-screen sticky top-0 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.02)] z-50">
      <div className="p-8">
        <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic">
          SunSpace <span className="text-blue-600">Pro</span>
        </h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">
          Espace {role}
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold text-sm group ${location.pathname === item.path
                ? "bg-blue-600 text-white shadow-xl shadow-blue-200 scale-[1.02]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
          >
            <span
              className={`text-xl transition-transform group-hover:scale-110 ${location.pathname === item.path ? "" : "grayscale"}`}
            >
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 font-bold text-sm hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
        >
          <span className="text-xl text-red-400 opacity-70">🚪</span>
          Déconnexion
        </button>
      </div>
    </aside>
  );
};

/**
 * Unified Header for all Dashboards
 */
const Header = ({ user }) => {
  const navigate = useNavigate();

  const getAvatarUrl = (user) => {
    if (!user?.avatar) return null;
    const url = user.avatar.url || user.avatar.attributes?.url;
    if (!url) return null;
    return url.startsWith("http")
      ? url
      : `${import.meta.env.VITE_API_URL || "http://localhost:1337"}${url}`;
  };

  return (
    <header className="flex justify-between items-center py-6 px-10 bg-transparent relative z-10 w-full">
      <div className="animate-fade-in">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] mb-1 pl-1">
          Dashboard Overview
        </h2>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest italic">
            Connecté en tant que{" "}
            <span className="text-slate-800">{user?.username}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div
          onClick={() => navigate("/profile")}
          className="w-12 h-12 bg-white rounded-2xl shadow-lg border-2 border-white overflow-hidden cursor-pointer hover:scale-110 transition-transform ring-4 ring-blue-50"
        >
          {getAvatarUrl(user) ? (
            <img
              src={getAvatarUrl(user)}
              alt="User"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-blue-100 flex items-center justify-center text-xl">
              👤
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

/**
 * Base Dashboard Layout wrapper
 */
const DashboardLayout = ({ children, role, user, loading }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin shadow-2xl shadow-blue-100" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">
            Chargement SunSpace Pro
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans selection:bg-blue-100 selection:text-blue-900">
      <Sidebar role={role} />

      <div className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/20 rounded-full blur-[100px] -ml-24 -mb-24 pointer-events-none" />

        <Header user={user} />

        <main className="flex-1 px-10 pb-12 animate-fade-in relative z-10">
          {children}
        </main>

        <footer className="px-10 py-6 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">
          <div>© 2024 SunSpace Pro — Projet de Fin d'Études</div>
          <div className="flex gap-6">
            <span className="hover:text-blue-500 cursor-pointer transition-colors">
              Aide
            </span>
            <span className="hover:text-blue-500 cursor-pointer transition-colors">
              Support technique
            </span>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
