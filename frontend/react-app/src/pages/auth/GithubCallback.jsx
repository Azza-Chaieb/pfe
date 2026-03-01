import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/apiClient";

const GithubCallback = () => {
    const [error, setError] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const params = new URLSearchParams(location.search);
                let user = null;
                const userParam = params.get("user");
                const errorParam = params.get("error");

                if (errorParam) {
                    console.error("❌ Error from URL:", errorParam);
                    if (errorParam.includes("timeout")) {
                        setError("Le serveur a mis trop de temps à répondre. Veuillez vous reconnecter ou vérifier votre connexion internet.");
                    } else {
                        setError(`Erreur GitHub : ${decodeURIComponent(errorParam)}`);
                    }
                    setTimeout(() => navigate("/login"), 5000);
                    return;
                }

                console.log("🔗 Callback URL discovered:", location.search + location.hash);

                // Also check fragment for tokens (implicit flow)
                const fragmentParams = new URLSearchParams(location.hash.substring(1));
                let jwt = params.get("access_token") || params.get("id_token") || fragmentParams.get("access_token") || fragmentParams.get("id_token");

                if (jwt && userParam) {
                    console.log("✈️ Flow A: Using user data from URL parameters");
                    try {
                        user = JSON.parse(decodeURIComponent(userParam));
                        console.log("👤 Decoded User:", user.email);
                    } catch (e) {
                        console.error("❌ Failed to parse user param", e);
                    }
                }

                // If we have JWT but NO USER (or Flow A failed to parse/fetch)
                if (jwt && !user) {
                    console.log("🔍 Flow B: Token found, fetching user profile via direct Axios...");
                    try {
                        // Bypass intercepted api client to avoid header conflicts
                        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:1337";
                        const { default: axios } = await import("axios");

                        console.log("📡 CALLING:", `${baseUrl}/api/users/me`);
                        console.log("🎟️ JWT (first 15 chars):", jwt.substring(0, 15) + "...");

                        const userResponse = await axios.get(`${baseUrl}/api/users/me`, {
                            headers: { Authorization: `Bearer ${jwt}` }
                        });
                        user = userResponse.data;
                        console.log("✅ Flow B Success:", user.email);
                    } catch (e) {
                        console.error("❌ Flow B failed", e);
                        if (e.response?.status === 401) {
                            setError("Votre session a expiré. Veuillez vous reconnecter.");
                            setTimeout(() => navigate("/login"), 3000);
                            return;
                        }
                        setError("Erreur technique lors de la connexion. Veuillez réessayer.");
                    }
                }

                // Final check
                if (!jwt || !user) {
                    console.log("⚠️ Final check failed. JWT:", !!jwt, "User:", !!user);
                    // C'est ici qu'on tombe si le backend n'a pas pu échanger le code à temps
                    if (location.search.includes("code=")) {
                        console.log("🔄 Original Strapi Flow (exchanging code)...");
                        try {
                            const response = await api.get(`/auth/github/callback${location.search}`);
                            jwt = response.data.jwt;
                            user = response.data.user;
                            console.log("✅ Original Flow Success:", user?.email);
                        } catch (e) {
                            console.error("❌ Exchange code failed", e);
                            throw new Error("Impossible de synchroniser avec GitHub.");
                        }
                    } else {
                        throw new Error(`Authentification incomplète. JWT: ${!!jwt}, User: ${!!user}`);
                    }
                }

                console.log("✅ Auth success! User type:", user.user_type);
                localStorage.setItem("jwt", jwt);
                localStorage.setItem("user", JSON.stringify(user));

                // User and token saved to localStorage, interceptor will handle headers

                // --- REDIRECTION LOGIC ---
                const role = user.user_type || "";

                if (!role || role === "pending") {
                    console.log("👋 New user or pending role! Redirecting to role selection...");
                    navigate("/select-role");
                } else {
                    const dashboards = {
                        admin: "/admin",
                        etudiant: "/dashboard",
                        student: "/dashboard",
                        formateur: "/trainer/dashboard",
                        trainer: "/trainer/dashboard",
                        professional: "/professional/dashboard",
                        pro: "/professional/dashboard",
                        association: "/association/dashboard"
                    };

                    const target = dashboards[role.toLowerCase()] || "/profile";
                    console.log(`🚀 Redirecting to dashboard: ${target}`);
                    navigate(target);
                }
            } catch (err) {
                console.error("❌ GitHub Auth Error:", err);
                setError(err.message || "Erreur d'authentification");
                setTimeout(() => navigate("/login"), 3000);
            }
        };

        handleCallback();
    }, [location, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            {error ? (
                <div className="p-8 bg-white rounded-2xl shadow-xl text-red-500 font-medium animate-fade-in">
                    {error}
                </div>
            ) : (
                <div className="flex flex-col items-center space-y-6">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-100 border-t-gray-800"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-gray-500 font-semibold tracking-wide animate-pulse">
                        AUTHENTIFICATION GITHUB...
                    </p>
                </div>
            )}
        </div>
    );
};

export default GithubCallback;
