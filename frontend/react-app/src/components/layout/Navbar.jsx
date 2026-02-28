import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getUserDashboardRoute = (user) => {
    const userType = (user?.user_type || "").toLowerCase();
    if (userType === "admin" || user?.username?.toLowerCase() === "admin")
      return "/admin";
    if (userType === "etudiant" || userType === "student") return "/dashboard";
    if (userType === "formateur" || userType === "trainer")
      return "/trainer/dashboard";
    if (userType === "professional") return "/professional/dashboard";
    if (userType === "association") return "/association/dashboard";
    return "/profile";
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 px-6 ${isScrolled ? "nav-glass py-3" : "bg-transparent py-6"}`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <div className="relative w-10 h-10 logo-s rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-all duration-500">
            <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse" />
            <span className="relative text-xl font-black italic tracking-tighter">
              S
            </span>
          </div>
          <span className="text-lg font-black tracking-tighter uppercase italic text-white hidden sm:block">
            SunSpace <span className="text-orange-500">Pro</span>
          </span>
        </div>

        {/* Simplified Actions */}
        <div className="flex items-center gap-6">
          {!user ? (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors"
              >
                Connexion
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(getUserDashboardRoute(user))}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
              >
                Dashboard
              </button>
              <div
                onClick={() => navigate("/profile")}
                className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl border border-white/10 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all"
              >
                <span className="text-xs font-black text-white">
                  {user.username?.substring(0, 2).toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
