import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const SpaceCatalog = () => {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const response = await api.get("/coworking-spaces?populate=*");
        setSpaces(response.data?.data || []);
      } catch (err) {
        console.error("Error fetching spaces:", err);
        setError("Impossible de charger les espaces.");
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
            Explorez nos <span className="text-blue-600">SunSpaces</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
            Découvrez nos environnements de travail inspirants et explorez-les
            virtuellement en 3D avant de réserver.
          </p>
        </header>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-8 text-center italic">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {spaces.map((space) => {
            const attrs = space.attributes || space;
            return (
              <div
                key={space.id}
                className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 group"
              >
                <div className="h-56 bg-slate-200 relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-violet-500/10 group-hover:scale-110 transition-transform duration-700"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-4xl grayscale group-hover:grayscale-0 transition-all duration-500">
                    🏢
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm">
                      {attrs.type || "Coworking"}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {attrs.name}
                  </h3>
                  <p className="text-slate-500 text-sm mb-6 line-clamp-2 font-medium leading-relaxed">
                    {attrs.description ||
                      "Un espace de travail moderne et flexible pour booster votre productivité."}
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => navigate(`/explore/${space.id}`)}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-900/10"
                    >
                      <span className="text-lg">🧊</span> Explorer en 3D
                    </button>
                    <button
                      onClick={() => alert("Réservation bientôt disponible")}
                      className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-bold text-sm transition-all hover:bg-blue-100 active:scale-95"
                    >
                      Réserver Maintenant
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {spaces.length === 0 && !loading && !error && (
          <div className="text-center py-24">
            <div className="text-6xl mb-6">🏜️</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Aucun espace trouvé
            </h3>
            <p className="text-slate-500">
              Revenez plus tard, nous ajoutons de nouveaux espaces
              régulièrement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceCatalog;
