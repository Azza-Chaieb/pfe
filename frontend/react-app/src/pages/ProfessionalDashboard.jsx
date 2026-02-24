import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardStatCard from "../components/layout/DashboardStatCard";
import { getProfessionalBookings } from "../api";
import {
  getMySubscription,
  cancelSubscription as cancelSub,
} from "../services/subscriptionService";
import BookingCalendar from "../components/calendar/BookingCalendar";

const ProfessionalDashboard = ({ activeTab = "dashboard" }) => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingView, setBookingView] = useState("list"); // 'list' or 'calendar'
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
          getMySubscription(storedUser.id),
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
        const subId = subscription?.documentId || subscription?.id;
        if (subId) await cancelSub(subId);
        setSubscription(null);
        alert("Abonnement annulé avec succès.");
      } catch (error) {
        console.error("Erreur annulation abonnement", error);
        alert("Erreur lors de l'annulation.");
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
              ? new Date(
                  bookings[0].attributes?.start_time || bookings[0].start_time,
                ).toLocaleDateString("fr-FR")
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
                          {new Date(data.start_time).toLocaleDateString()}
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

          {/* 3D Exploration CTA Card */}
          <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[32px] text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <h4 className="text-xl font-black mb-4 tracking-tight">
              Explorer en 3D ? 🏢
            </h4>
            <p className="text-blue-100 text-sm leading-relaxed mb-6 font-medium">
              Visitez nos espaces de coworking en immersion totale pour choisir
              le bureau idéal pour vos réunions !
            </p>
            <button
              onClick={() => navigate("/explore/5")}
              className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Explorer les espaces
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
        <div className="flex gap-4 items-center">
          <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
            <button
              onClick={() => setBookingView("list")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${bookingView === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              Liste
            </button>
            <button
              onClick={() => setBookingView("calendar")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${bookingView === "calendar" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              Calendrier
            </button>
          </div>
          <button
            onClick={() => navigate("/explore/5")}
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

      {bookingView === "calendar" ? (
        <BookingCalendar userId={user?.id} />
      ) : (
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
                  const space =
                    data.space?.data?.attributes || data.space || {};
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
                        {new Date(data.start_time).toLocaleDateString("fr-FR", {
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
      )}
    </div>
  );

  const renderSubscription = () => {
    const subAttrs = subscription
      ? subscription.attributes || subscription
      : null;
    const planAttrs =
      subAttrs?.plan?.data?.attributes || subAttrs?.plan || null;
    const planName = planAttrs?.name || "Aucun plan";
    const planType = planAttrs?.type || "basic";
    const endDate = subAttrs?.end_date
      ? new Date(subAttrs.end_date).toLocaleDateString("fr-FR")
      : null;
    const credits = subAttrs?.remaining_credits ?? 0;
    const isActive = subAttrs?.status === "active";
    const planColors = {
      basic: "from-slate-600 to-slate-800",
      premium: "from-blue-600 to-indigo-800",
      enterprise: "from-amber-500 to-orange-700",
    };
    const gradient = planColors[planType] || planColors.basic;

    return (
      <div className="max-w-3xl mx-auto py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
              Mon Abonnement 💎
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Gérez votre plan SunSpace Pro.
            </p>
          </div>
          <button
            onClick={() => navigate("/professional/dashboard")}
            className="px-5 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
          >
            ← Retour
          </button>
        </div>

        {/* Current Plan Card */}
        {isActive && planAttrs ? (
          <div
            className={`rounded-[2.5rem] bg-gradient-to-br ${gradient} p-8 text-white shadow-2xl`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-70">
                  Plan Actuel
                </span>
                <h2 className="text-3xl font-black mt-1">{planName}</h2>
                <p className="text-white/70 text-sm mt-1">
                  Expire le {endDate}
                </p>
              </div>
              <div className="bg-white/20 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black">{credits}</p>
                <p className="text-[9px] font-black uppercase opacity-70">
                  crédits restants
                </p>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => navigate("/subscription-plans")}
                className="flex-1 py-3 bg-white/20 border border-white/30 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/30 transition-all"
              >
                Changer de plan
              </button>
              <button
                onClick={handleCancelSubscription}
                className="px-5 py-3 bg-red-500/20 border border-red-300/30 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500/30 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/40 backdrop-blur border border-white/60 rounded-[2.5rem] p-10 text-center shadow-xl">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">
              Aucun abonnement actif
            </h3>
            <p className="text-slate-400 text-sm mb-8">
              Choisissez un plan adapté à vos besoins professionnels.
            </p>
            <button
              onClick={() => navigate("/subscription-plans")}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
            >
              Voir les plans 💳
            </button>
          </div>
        )}

        {/* Quick Info */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Cycle",
              value:
                subAttrs?.billing_cycle === "yearly" ? "Annuel" : "Mensuel",
              icon: "🔄",
            },
            {
              label: "Statut",
              value: subAttrs?.status || "Inactif",
              icon: "📊",
            },
            {
              label: "Crédits utilisés",
              value: `${(planAttrs?.max_credits || 0) - credits} / ${planAttrs?.max_credits || 0}`,
              icon: "🎯",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white/40 backdrop-blur border border-white/60 rounded-2xl p-5 text-center"
            >
              <p className="text-2xl mb-2">{item.icon}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {item.label}
              </p>
              <p className="text-sm font-black text-slate-700 mt-1 capitalize">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout role="professional" user={user} loading={loading}>
      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "bookings" && renderBookings()}
      {activeTab === "subscription" && renderSubscription()}
    </DashboardLayout>
  );
};

export default ProfessionalDashboard;
