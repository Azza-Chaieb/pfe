import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Scene from "../../components/Scene";
import Navbar from "../../components/layout/Navbar";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white selection:bg-orange-500/30 selection:text-orange-200 overflow-x-hidden">
      <Navbar />

      {/* Background Mesh Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="mesh-gradient-1"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        />
        <div
          className="mesh-gradient-2"
          style={{ transform: `translateY(${scrollY * -0.05}px)` }}
        />
        <div className="mesh-gradient-3" />
      </div>

      {/* Hero Section */}
      <section className="relative h-screen min-h-[700px] w-full flex items-center justify-center">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-transparent to-[#0F172A] z-10" />
          <div className="w-full h-full opacity-40 scale-110">
            <Scene />
          </div>
        </div>

        <div className="relative z-20 container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-10 animate-fade">
            <span className="flex h-3 w-3 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-400">
              Co-working & E-learning
            </span>
          </div>

          <h1 className="hero-title text-6xl md:text-8xl lg:text-9xl mb-10 animate-up leading-[0.8] tracking-tighter">
            PROSPACE <br />
            <span className="text-vibrant-sun block mt-4">EVOLVE.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed mb-14 max-w-2xl mx-auto animate-up [animation-delay:200ms]">
            L'espace hybride pour apprendre, travailler et réussir. <br />
            Une expérience immersive unique pour les professionnels et
            étudiants.
          </p>

          <button
            onClick={() => navigate("/register")}
            className="group relative px-12 py-6 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] overflow-hidden transition-all hover:scale-105 shadow-2xl shadow-orange-500/20 active:scale-95 animate-up [animation-delay:400ms]"
          >
            <span className="relative z-10">Rejoindre l'Aventure</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
        </div>
      </section>

      {/* Simplified Pillars Section */}
      <section className="py-24 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Academy Pill */}
            <div
              onClick={() => navigate("/subscription-plans")}
              className="premium-card p-12 card-learning group cursor-pointer text-center"
            >
              <div className="w-20 h-20 bg-orange-500/10 rounded-[32px] flex items-center justify-center text-4xl mb-8 mx-auto group-hover:scale-110 transition-transform duration-500">
                ☀️
              </div>
              <h3 className="text-3xl font-black mb-4">Sun Academy</h3>
              <p className="text-slate-400 font-medium mb-8">
                Formations et certifications interactives.
              </p>
              <span className="text-orange-500 text-[10px] font-black uppercase tracking-widest border-b border-orange-500/30 pb-1 group-hover:border-orange-500 transition-all">
                Voir les formations →
              </span>
            </div>

            {/* Hub Pill */}
            <div
              onClick={() => navigate("/spaces")}
              className="premium-card p-12 card-coworking group cursor-pointer text-center"
            >
              <div className="w-20 h-20 bg-blue-500/10 rounded-[32px] flex items-center justify-center text-4xl mb-8 mx-auto group-hover:scale-110 transition-transform duration-500">
                🌌
              </div>
              <h3 className="text-3xl font-black mb-4">Space Hub</h3>
              <p className="text-slate-400 font-medium mb-8">
                Co-working immersif et espaces 3D.
              </p>
              <span className="text-blue-500 text-[10px] font-black uppercase tracking-widest border-b border-blue-500/30 pb-1 group-hover:border-blue-500 transition-all">
                Réserver un espace →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Simplified Footer */}
      <footer className="py-16 px-6 bg-[#0B1222] relative z-10 border-t border-white/5">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-orange-500 rounded-2xl flex items-center justify-center text-white font-black italic shadow-lg">
              S
            </div>
            <span className="text-xl font-black uppercase tracking-tighter italic text-white leading-none">
              SunSpace <span className="text-orange-500">Pro</span>
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.5em]">
            © 2024 SunSpace Pro
          </p>
          <div className="flex gap-10">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
              className="text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              Connexion
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/register");
              }}
              className="text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              S'inscrire
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
