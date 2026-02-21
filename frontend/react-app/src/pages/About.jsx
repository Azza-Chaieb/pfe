import React from "react";
import { useNavigate } from "react-router-dom";

function About() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-8 px-4 py-2 bg-white text-slate-600 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-100 transition-all flex items-center gap-2"
      >
        ← Retour
      </button>
      <h1 className="text-4xl font-black text-slate-900 mb-4">
        À propos de SunSpace
      </h1>
      <p className="text-slate-600 max-w-2xl">
        SunSpace est une plateforme innovante de réservation d'espaces de
        coworking, offrant une expérience immersive grâce à la visualisation 3D.
      </p>
    </div>
  );
}

export default About;
