import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/apiClient";

const RoleSelection = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const roles = [
        { id: "etudiant", title: "Étudiant", description: "Je veux apprendre et réserver des espaces.", icon: "🎓", color: "blue" },
        { id: "formateur", title: "Formateur", description: "Je propose des cours et j'encadre des étudiants.", icon: "👨‍🏫", color: "purple" },
        { id: "professional", title: "Professionnel", description: "Je cherche un espace de travail inspirant.", icon: "💼", color: "pink" },
        { id: "association", title: "Association", description: "Nous organisons des événements communautaires.", icon: "🤝", color: "green" },
    ];

    const handleRoleSelect = async (roleId) => {
        setLoading(true);
        setError(null);
        try {
            // Update user in Strapi
            const response = await api.put(`/users/${user.id}`, {
                user_type: roleId
            });

            // Update local storage user object with the fresh data from server
            const updatedUser = response.data || { ...user, user_type: roleId };
            localStorage.setItem("user", JSON.stringify(updatedUser));

            // Small delay to allow backend lifecycles (profile creation) to breath 
            // and show the success animation to the user
            setTimeout(() => {
                const dashboards = {
                    etudiant: "/dashboard" + (location.search || ""),
                    student: "/dashboard",
                    formateur: "/trainer/dashboard",
                    trainer: "/trainer/dashboard",
                    professional: "/professional/dashboard",
                    pro: "/professional/dashboard",
                    association: "/association/dashboard"
                };

                const target = dashboards[roleId.toLowerCase()] || "/dashboard";
                console.log(`✅ Role set to ${roleId}. Redirecting to ${target}`);
                navigate(target);
            }, 1500);
        } catch (err) {
            console.error("Error setting role:", err);
            setError("Échec de l'enregistrement du rôle. Veuillez réessayer.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
            <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
                <div className="p-10 text-center">
                    <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
                        Bienvenue, {(user.fullname || user.username || "").split(' ')[0]} ! ✨
                    </h1>
                    <p className="text-gray-500 text-lg mb-10">
                        Pour personnaliser votre expérience, choisissez votre profil SunSpace :
                    </p>

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center justify-center space-x-2">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {roles.map((role) => (
                            <button
                                key={role.id}
                                disabled={loading}
                                onClick={() => handleRoleSelect(role.id)}
                                className={`group p-6 text-left border-2 border-gray-100 rounded-2xl hover:border-${role.color}-500 hover:bg-${role.color}-50 transition-all duration-300 relative overflow-hidden disabled:opacity-50`}
                            >
                                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{role.icon}</div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{role.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{role.description}</p>

                                <div className={`absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                    <svg className={`w-6 h-6 text-${role.color}-500`} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </button>
                        ))}
                    </div>

                    {loading && (
                        <div className="mt-8 flex items-center justify-center space-x-4 text-blue-600 font-semibold italic animate-pulse">
                            <div className="w-5 h-5 border-t-2 border-blue-600 rounded-full animate-spin"></div>
                            <span>Configuration de votre espace...</span>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 p-6 text-center text-gray-400 text-sm italic">
                    Vous pourrez modifier votre profil à tout moment dans les réglages.
                </div>
            </div>
        </div>
    );
};

export default RoleSelection;
