import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardStatCard from "../components/layout/DashboardStatCard";
import {
  getProfessionalBookings,
  getSubscriptionDetails,
  cancelSubscription,
} from "../api";

const ProfessionalDashboard = ({ activeTab = "dashboard" }) => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
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

        const [bookingsData, subData] = await Promise.all([
          getProfessionalBookings(storedUser.id),
          getSubscriptionDetails(storedUser.id),
        ]);

        setBookings(bookingsData.data || []);
        setSubscription(subData);
      } catch (error) {
        console.error("Error loading professional dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleCancelSubscription = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler votre abonnement ?")) {
      try {
        await cancelSubscription(user.id);
        setSubscription(null);
        alert("Abonnement annulé.");
      } catch (error) {
        console.error("Erreur", error);
      }
    }
  };

  const renderDashboard = () => (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
          Espace <span className="text-blue-600">Professionnel</span> 👋
        </h1>
        <p className="text-xs text-slate-500 font-medium tracking-tight">
          Gérez vos ressources et votre abonnement premium.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <DashboardStatCard
          title="Réservations"
          value={bookings.length}
          icon="🏢"
          color="blue"
        />
        <DashboardStatCard
          title="Abonnement Actif"
          value={subscription ? "Oui" : "Non"}
          icon="💎"
          color={subscription ? "emerald" : "orange"}
        />
        <DashboardStatCard
          title="Prochaine Date"
          value={
            bookings.length > 0
              ? new Date(bookings[0].attributes?.date).toLocaleDateString(
                  "fr-FR",
                )
              : "-"
          }
          icon="📅"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white/40 backdrop-blur-md p-6 rounded-[28px] border border-white/60 shadow-xl shadow-slate-200/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                Mes Réservations
              </h3>
              <button
                onClick={() => navigate("/professional/bookings")}
                className="text-[10px] font-black uppercase text-blue-600 tracking-widest hover:underline"
              >
                Gérer tout →
              </button>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 font-black text-slate-400 uppercase tracking-widest">
                      Lieu
                    </th>
                    <th className="pb-3 font-black text-slate-400 uppercase tracking-widest text-center">
                      Date
                    </th>
                    <th className="pb-3 font-black text-slate-400 uppercase tracking-widest text-right">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bookings.slice(0, 3).map((booking) => {
                    const data = booking.attributes || booking;
                    const space =
                      data.space?.data?.attributes || data.space || {};
                    const coworking =
                      data.coworking_space?.data?.attributes ||
                      data.coworking_space ||
                      {};
                    return (
                      <tr key={booking.id}>
                        <td className="py-4 font-bold text-slate-700">
                          {space.name
                            ? `${coworking.name || "Espace"} - ${space.name}`
                            : coworking.name || "Espace"}
                        </td>
                        <td className="py-4 text-center text-slate-500">
                          {new Date(data.date).toLocaleDateString()}
                        </td>
                        <td className="py-4 text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${data.status === "confirmed" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}
                          >
                            {data.status || "En attente"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {bookings.length === 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        className="py-8 text-center text-slate-400 italic"
                      >
                        Aucune réservation.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white/40 backdrop-blur-md p-6 rounded-[28px] border border-white/60 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4">
              Abonnement
            </h3>
            <div className="p-5 bg-gradient-to-br from-indigo-500 to-blue-700 rounded-2xl text-white shadow-xl mb-4">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">
                Status
              </p>
              <h4 className="text-lg font-black">
                {subscription ? "Premium Pro" : "Free Tier"}
              </h4>
            </div>
            <button
              onClick={() => navigate("/professional/subscription")}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all"
            >
              Détails de l'offre
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Gestion des Réservations 🏢
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Historique complet et gestion de vos espaces réservés.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/spaces")}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
          >
            + Nouvelle Réservation
          </button>
          <button
            onClick={() => navigate("/professional/dashboard")}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
          >
            ← Retour
          </button>
        </div>
      </div>
      <div className="bg-white/40 backdrop-blur-md p-8 rounded-[32px] border border-white/60 shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Espace
                </th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Date
                </th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Services
                </th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.map((booking) => {
                const data = booking.attributes || booking;
                const space = data.space?.data?.attributes || data.space || {};
                const coworking =
                  data.coworking_space?.data?.attributes ||
                  data.coworking_space ||
                  {};
                const extras = data.extras || {};
                const extrasCount = Object.keys(extras).length;

                return (
                  <tr
                    key={booking.id}
                    className="hover:bg-white/50 transition-all"
                  >
                    <td className="py-5 font-bold text-slate-700">
                      {space.name
                        ? `${coworking.name || "Espace"} - ${space.name}`
                        : coworking.name || "Espace"}
                    </td>
                    <td className="py-5 text-slate-500">
                      {new Date(data.date).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </td>
                    <td className="py-5">
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded">
                        {extrasCount > 0
                          ? `${extrasCount} option(s)`
                          : "Aucun extra"}
                      </span>
                    </td>
                    <td className="py-5 text-right">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${data.status === "confirmed" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}
                      >
                        {data.status || "En attente"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSubscription = () => (
    <div className="max-w-4xl mx-auto py-10">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter">
            Mon Abonnement 💎
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">
            Gérez votre plan et vos factures.
          </p>
        </div>
        <button
          onClick={() => navigate("/professional/dashboard")}
          className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
        >
          ← Retour
        </button>
      </div>

      <div className="bg-white/40 backdrop-blur-md p-10 rounded-[40px] border border-white/60 shadow-2xl relative overflow-hidden">
        {/* "À bientôt" Label Layer */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-12 text-center animate-fade-in">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner animate-bounce">
            ✨
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">
            À bientôt !
          </h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-sm">
            Le portail de gestion des abonnements premium est en cours de
            finalisation.
          </p>
          <div className="mt-8 flex gap-4">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:200ms]" />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:400ms]" />
          </div>
        </div>

        <div className="opacity-10 grayscale blur-[2px] pointer-events-none">
          {/* Mock content below the overlay */}
          <div className="p-8 bg-blue-600 rounded-3xl text-white mb-8">
            <h3 className="text-2xl font-black mb-1">Premium Plan</h3>
            <p className="opacity-80">99 DTN / Mois</p>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-2xl w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout role="professional" user={user} loading={loading}>
      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "bookings" && renderBookings()}
      {activeTab === "subscription" && renderSubscription()}
    </DashboardLayout>
  );
};

export default ProfessionalDashboard;
