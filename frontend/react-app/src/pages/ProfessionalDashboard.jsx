import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProfessionalBookings,
  getSubscriptionDetails,
  cancelSubscription,
} from "../api";

const ProfessionalDashboard = () => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard', 'bookings', 'subscription'
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser) {
          navigate("/login");
          return;
        }
        setUser(storedUser);

        // Fetch bookings
        const bookingsData = await getProfessionalBookings(storedUser.id);
        setBookings(bookingsData.data || []);

        // Fetch subscription
        const subData = await getSubscriptionDetails(storedUser.id);
        setSubscription(subData);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    fetchDashboardData();
  }, [navigate]);

  const handleCancelSubscription = async () => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir annuler votre abonnement ? Cette action est irréversible.",
      )
    ) {
      try {
        await cancelSubscription(user.id);
        setSubscription(null);
        alert("Votre abonnement a été annulé avec succès.");
      } catch (error) {
        console.error("Erreur lors de l'annulation", error);
        alert("Une erreur est survenue lors de la tentative d'annulation.");
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">Chargement du tableau de bord...</div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "bookings":
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                Mes Réservations
              </h3>
              <button
                onClick={() =>
                  alert("Fonctionnalité de réservation à venir prochainement.")
                }
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
              >
                + Nouvelle Réservation
              </button>
            </div>
            <div className="p-6">
              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <h4 className="font-bold text-gray-800">
                          {booking.attributes?.coworking_space?.data?.attributes
                            ?.name || "Espace de Coworking"}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {new Date(
                            booking.attributes?.date,
                          ).toLocaleDateString()}{" "}
                          • {booking.attributes?.time_slot || "All Day"}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          booking.attributes?.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : booking.attributes?.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {booking.attributes?.status || "En attente"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-block p-4 rounded-full bg-blue-50 text-blue-500 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Aucune réservation
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Vous n'avez pas encore réservé d'espace.
                  </p>
                  <button
                    onClick={() =>
                      alert(
                        "Fonctionnalité de réservation à venir prochainement.",
                      )
                    }
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Réserver un espace
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      case "subscription":
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-fit max-w-2xl mx-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                Détails de l'abonnement
              </h3>
            </div>
            <div className="p-8">
              {subscription ? (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <span className="text-gray-500 text-sm uppercase tracking-wide">
                        Plan Actuel
                      </span>
                      <h2 className="text-3xl font-extrabold text-indigo-600 mt-1">
                        Premium Pro
                      </h2>
                    </div>
                    <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                      Actif
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 text-sm block mb-1">
                        Date de début
                      </span>
                      <span className="font-bold text-gray-800">
                        {new Date(subscription.start_time).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 text-sm block mb-1">
                        Date de fin
                      </span>
                      <span className="font-bold text-gray-800">
                        {new Date(subscription.end_time).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-bold text-gray-800 mb-4">
                      Avantages inclus
                    </h4>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span> Accès
                        illimité aux espaces de coworking
                      </li>
                      <li className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span> Connexion
                        Internet Haut Débit
                      </li>
                      <li className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span> Café et
                        boissons gratuits
                      </li>
                    </ul>

                    <button
                      onClick={handleCancelSubscription}
                      className="w-full py-3 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition"
                    >
                      Annuler l'abonnement
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-block p-4 rounded-full bg-indigo-50 text-indigo-500 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Aucun abonnement actif
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                    Profitez de nos espaces de travail premium en souscrivant à
                    un abonnement adapté à vos besoins.
                  </p>

                  <button
                    onClick={() =>
                      alert(
                        "Les offres d'abonnement seront bientôt disponibles.",
                      )
                    }
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 font-bold transition transform hover:-translate-y-1"
                  >
                    Voir les offres d'abonnement
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null; // Will render default content below
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md hidden md:block">
        <div className="p-6">
          <h1
            className="text-2xl font-bold text-blue-600 cursor-pointer"
            onClick={() => setActiveTab("dashboard")}
          >
            SunSpace Pro
          </h1>
        </div>
        <nav className="mt-6 space-y-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full text-left py-3 px-6 font-medium transition-colors border-r-4 ${
              activeTab === "dashboard"
                ? "bg-blue-50 text-blue-600 border-blue-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-blue-600 border-transparent"
            }`}
          >
            Tableau de bord
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`w-full text-left py-3 px-6 font-medium transition-colors border-r-4 ${
              activeTab === "bookings"
                ? "bg-blue-50 text-blue-600 border-blue-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-blue-600 border-transparent"
            }`}
          >
            Mes Réservations
          </button>
          <button
            onClick={() => setActiveTab("subscription")}
            className={`w-full text-left py-3 px-6 font-medium transition-colors border-r-4 ${
              activeTab === "subscription"
                ? "bg-blue-50 text-blue-600 border-blue-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-blue-600 border-transparent"
            }`}
          >
            Mon Abonnement
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="w-full text-left py-3 px-6 text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors border-r-4 border-transparent font-medium"
          >
            Mon Profil
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("jwt");
              localStorage.removeItem("user");
              navigate("/login");
            }}
            className="w-full text-left py-3 px-6 text-red-600 hover:bg-red-50 transition-colors mt-auto border-r-4 border-transparent"
          >
            Déconnexion
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              {activeTab === "dashboard"
                ? `Bonjour, ${user?.username} 👋`
                : activeTab === "bookings"
                  ? "Mes Réservations"
                  : "Mon Abonnement"}
            </h2>
            <p className="text-gray-500">
              {activeTab === "dashboard"
                ? "Voici un aperçu de votre activité professionnelle."
                : activeTab === "bookings"
                  ? "Gérez vos réservations d'espace passées et futures."
                  : "Gérez votre plan et vos factures."}
            </p>
          </div>
          <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        </header>

        {activeTab === "dashboard" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-2">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-gray-500 text-sm font-medium uppercase">
                  Réservations Totales
                </h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {bookings.length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-gray-500 text-sm font-medium uppercase">
                  Abonnement Actif
                </h3>
                <p
                  className={`text-3xl font-bold mt-2 ${subscription ? "text-green-600" : "text-gray-400"}`}
                >
                  {subscription ? "Oui" : "Non"}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-gray-500 text-sm font-medium uppercase">
                  Prochaine Réservation
                </h3>
                <p className="text-lg font-bold text-blue-600 mt-2">
                  {bookings.length > 0
                    ? new Date(
                        bookings[0].attributes?.date,
                      ).toLocaleDateString()
                    : "-"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Bookings List (Mini) */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-800">
                    Dernières Réservations
                  </h3>
                  <button
                    onClick={() => setActiveTab("bookings")}
                    className="text-blue-600 text-sm font-medium hover:underline"
                  >
                    Voir tout
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
                      <tr>
                        <th className="px-6 py-4">Lieu</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Horaire</th>
                        <th className="px-6 py-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bookings.length > 0 ? (
                        bookings.slice(0, 5).map((booking) => (
                          <tr
                            key={booking.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-gray-800">
                              {booking.attributes?.coworking_space?.data
                                ?.attributes?.name || "Grand Espace"}
                            </td>
                            <td className="px-6 py-4">
                              {new Date(
                                booking.attributes?.date,
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              {booking.attributes?.time_slot || "09:00 - 18:00"}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  booking.attributes?.status === "confirmed"
                                    ? "bg-green-100 text-green-700"
                                    : booking.attributes?.status === "cancelled"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {booking.attributes?.status || "En attente"}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-6 py-8 text-center text-gray-400"
                          >
                            Aucune réservation récente.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Subscription Details (Mini) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-fit">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800">
                    Mon Abonnement
                  </h3>
                </div>
                <div className="p-6">
                  {subscription ? (
                    <div>
                      <div className="mb-4">
                        <span className="text-gray-500 text-sm">
                          Plan actuel
                        </span>
                        <p className="text-xl font-bold text-indigo-600">
                          Premium Pro
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full"
                          style={{ width: "45%" }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 text-right">
                        Renouvellement dans 15 jours
                      </p>

                      <button
                        onClick={() => setActiveTab("subscription")}
                        className="w-full mt-6 py-2 px-4 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium text-sm"
                      >
                        Gérer l'abonnement
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">
                        Aucun abonnement actif.
                      </p>
                      <button
                        onClick={() => setActiveTab("subscription")}
                        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                      >
                        Découvrir les offres
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {renderContent()}
      </main>
    </div>
  );
};

export default ProfessionalDashboard;
