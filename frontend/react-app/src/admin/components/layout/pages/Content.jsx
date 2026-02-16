import React, { useState, useEffect } from "react";
import { AdminLayout } from "../AdminLayout.jsx";
import api, { getContent } from "../../../../api";

const Content = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState("Loading...");

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // 1. Fetch User Role
        try {
          const userRes = await api.get("/users/me?populate=role");
          setUserRole(userRes.data?.role?.name || "Unknown");
        } catch (roleErr) {
          console.error("Failed to fetch role", roleErr);
          setUserRole("Error fetching role");
        }

        // 2. Fetch Content
        const data = await getContent();
        if (Array.isArray(data)) {
          setContent(data);
        } else if (data && data.data) {
          setContent(data.data);
        }
      } catch (error) {
        console.error("Failed to load content", error);
        if (error.response && error.response.status === 403) {
          setError({
            type: "permission",
            message:
              "Accès refusé (403). Vous n'avez pas la permission de voir ce contenu.",
            detail:
              "Connectez-vous au panneau d'administration Strapi (http://192.168.100.97:1337/admin) > Settings > Users & Permissions > Roles > Authenticated > Select 'Course' > Check 'find'.",
          });
        } else {
          setError({
            type: "general",
            message: "Erreur lors du chargement du contenu.",
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-8 tracking-tight">
          Gestion du contenu (Cours)
        </h1>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-400 italic">
              Chargement du contenu...
            </div>
          ) : error ? (
            <div className="p-6 m-6 bg-red-50 border border-red-100 rounded-xl text-red-600">
              <div className="mt-4 p-4 bg-white/50 rounded-lg border border-red-200 text-sm">
                <strong>Debug Info:</strong>
                <div className="mt-2 p-2 bg-red-100 rounded text-xs font-mono overflow-auto max-h-40">
                  {JSON.stringify(
                    error.response?.data || error.message,
                    null,
                    2,
                  )}
                </div>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>
                    Role: <strong>{userRole}</strong>
                  </li>
                  <li>
                    User ID:{" "}
                    {JSON.parse(localStorage.getItem("user") || "{}").id ||
                      "N/A"}
                  </li>
                  <li>
                    Email:{" "}
                    {JSON.parse(localStorage.getItem("user") || "{}").email ||
                      "N/A"}
                  </li>
                  <li>
                    Has Token: {localStorage.getItem("jwt") ? "Yes" : "No"}
                  </li>
                  <li>Endpoint: /api/courses</li>
                </ul>
                <button
                  onClick={() => {
                    localStorage.removeItem("jwt");
                    localStorage.removeItem("user");
                    window.location.href = "/admin/login";
                  }}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Déconnexion & Réessayer
                </button>
              </div>
            </div>
          ) : content.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider w-16">
                    ID
                  </th>
                  <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Titre
                  </th>
                  <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {content.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors duration-200"
                  >
                    <td className="p-5 text-slate-400 font-mono text-sm">
                      #{item.id}
                    </td>
                    <td className="p-5">
                      <div className="font-semibold text-slate-700">
                        {item.title || item.attributes?.title || "Sans titre"}
                      </div>
                    </td>
                    <td className="p-5 text-slate-500 max-w-md truncate">
                      {item.description ||
                        item.attributes?.description ||
                        "Pas de description"}
                    </td>
                    <td className="p-5">
                      <button
                        className="p-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed opacity-50"
                        disabled
                      >
                        ✏️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-10 text-center text-slate-400 italic">
              <h3 className="text-xl font-bold text-slate-600 mb-2">
                Aucun cours trouvé (0 éléments)
              </h3>
              <p className="mb-6">
                La requête a réussi mais n'a retourné aucun résultat.
              </p>

              <div className="mx-auto max-w-md p-4 bg-slate-50 rounded-lg border border-slate-200 text-left text-sm">
                <strong>Debug Info (Success):</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>
                    Role: <strong>{userRole}</strong>
                  </li>
                  <li>
                    User ID:{" "}
                    {JSON.parse(localStorage.getItem("user") || "{}").id ||
                      "N/A"}
                  </li>
                  <li>
                    Has Token: {localStorage.getItem("jwt") ? "Yes" : "No"}
                  </li>
                  <li>
                    Data received:{" "}
                    {Array.isArray(content)
                      ? `Array(${content.length})`
                      : typeof content}
                  </li>
                </ul>
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      localStorage.removeItem("jwt");
                      localStorage.removeItem("user");
                      window.location.href = "/admin/login";
                    }}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Content;
