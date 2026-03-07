import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DashboardStatCard from "../../components/layout/DashboardStatCard";
import { getProfessionalBookings } from "../../services/bookingService";
import {
  getMySubscription,
  cancelSubscription as cancelSub,
} from "../../services/subscriptionService";
import BookingCalendar from "../../components/calendar/BookingCalendar";
import SubscriptionSection from "../../components/dashboard/SubscriptionSection";
import SubscriptionStatCard from "../../components/dashboard/SubscriptionStatCard";

const ProfessionalDashboard = ({ activeTab = "dashboard" }) => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingView, setBookingView] = useState("list");
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

        const rawBookings = bookingsData.data || [];
        setBookings(rawBookings);
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
        const subId = subscription?.id || subscription?.documentId || subscription?.data?.id;
        if (!subId) throw new Error("ID de l'abonnement introuvable.");

        await cancelSub(subId);
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
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
          Espace <span className="text-blue-600">Professionnel</span> 👋
        </h1>
        <p className="text-xs text-slate-500 font-medium tracking-tight">
          Gérez vos ressources et votre abonnement en temps réel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <DashboardStatCard
          title="Réservations"
          value={bookings.length}
          icon="🏢"
          color="blue"
        />
        <SubscriptionStatCard subscription={subscription} />
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
                    <th className="pb-4 font-black text-slate-400 uppercase tracking-widest text-left">
                      Espace
                    </th>
                    <th className="pb-4 font-black text-slate-400 uppercase tracking-widest text-center">
                      Date
                    </th>
                    <th className="pb-4 font-black text-slate-400 uppercase tracking-widest text-center">
                      Prix
                    </th>
                    <th className="pb-4 font-black text-slate-400 uppercase tracking-widest text-right">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bookings.slice(0, 3).map((item) => {
                    const data = item.attributes || item;
                    const spaceRaw = data.space?.data || data.space || {};
                    const space = spaceRaw?.attributes || spaceRaw || {};
                    const cwRaw = space.coworking_space?.data || space.coworking_space ||
                      data.coworking_space?.data || data.coworking_space || {};
                    const coworking = cwRaw?.attributes || cwRaw || {};

                    const startDate = new Date(data.start_time);
                    const endDate = new Date(data.end_time);

                    const getSpaceDisplayName = () => {
                      if (space.name) return space.name;
                      if (space.mesh_name) {
                        return space.mesh_name.replace(/bureau_/i, 'Bureau ').replace(/_/g, ' ');
                      }
                      if (space.type) {
                        const types = {
                          'meeting-room': 'Salle de Réunion',
                          'event-space': 'Espace Événementiel',
                          'hot-desk': 'Hot Desk',
                          'fixed-desk': 'Bureau Fixe'
                        };
                        return types[space.type] || space.type;
                      }
                      // Redundancy Fallback
                      if (data.extras?.spaceName) return data.extras.spaceName;
                      return coworking.name || data.extras?.coworkingName || "SunSpace";
                    };

                    const totalPrice = (() => {
                      const storedPrice = Number(data.total_price || data.totalPrice || data.payment?.data?.attributes?.amount || data.payment?.amount);
                      if (storedPrice > 0) return storedPrice.toFixed(2);

                      const hours = Math.ceil((endDate - startDate) / (1000 * 60 * 60));
                      if (hours > 0) {
                        let calcPrice = 0;
                        let pHourly = space.pricing_hourly || 0;
                        if (pHourly === 0 && space.type) {
                          if (space.type === "meeting-room") pHourly = 15;
                          else if (space.type === "event-space") pHourly = 20;
                          else if (space.type === "hot-desk" || space.type === "fixed-desk") pHourly = 5;
                        }
                        if (pHourly > 0) calcPrice += hours * pHourly * (data.participants || 1);
                        (data.equipments?.data || data.equipments || []).forEach(eq => {
                          const p = eq.attributes || eq;
                          if (p.price) calcPrice += (p.price_type === 'hourly' ? p.price * hours : p.price);
                        });
                        (data.services?.data || data.services || []).forEach(sv => {
                          const p = sv.attributes || sv;
                          if (p.price) calcPrice += (p.price_type === 'hourly' ? p.price * hours : p.price);
                        });
                        return calcPrice.toFixed(2);
                      }
                      return "0.00";
                    })();

                    return (
                      <tr key={item.id}>
                        <td className="py-4 font-bold text-slate-700">
                          {getSpaceDisplayName()}
                        </td>
                        <td className="py-4 text-center text-slate-500">
                          {startDate.toLocaleDateString()}
                        </td>
                        <td className="py-4 text-center font-black text-slate-900">
                          {totalPrice} DT
                        </td>
                        <td className="py-4 text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${data.status === "confirmed" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}
                          >
                            {data.status === 'confirmed' ? 'Confirmé' : data.status === 'cancelled' ? 'Annulé' : 'Attente'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400 italic">
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
                Forfait Actuel
              </p>
              <h4 className="text-lg font-black">
                {subscription ? (subscription.attributes?.plan?.data?.attributes?.name || subscription.plan?.name || "Premium") : "Aucun forfait"}
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
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Espace</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Prix</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Services</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Statut</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map((item) => {
                  const data = item.attributes || item;
                  const spaceRaw = data.space?.data || data.space || {};
                  const space = spaceRaw?.attributes || spaceRaw || {};
                  const cwRaw = space.coworking_space?.data || space.coworking_space ||
                    data.coworking_space?.data || data.coworking_space || {};
                  const coworking = cwRaw?.attributes || cwRaw || {};

                  const startDate = new Date(data.start_time);
                  const endDate = new Date(data.end_time);

                  const getSpaceDisplayName = () => {
                    // 1. Primary: Use the actual relation if populated
                    if (space.name) return space.name;
                    if (space.mesh_name) {
                      return space.mesh_name.replace(/bureau_/i, 'Bureau ').replace(/_/g, ' ');
                    }
                    if (space.type) {
                      const types = {
                        'meeting-room': 'Salle de Réunion',
                        'event-space': 'Espace Événementiel',
                        'hot-desk': 'Hot Desk',
                        'fixed-desk': 'Bureau Fixe'
                      };
                      return types[space.type] || space.type;
                    }

                    // 2. Redundancy Fallback: Use data stored in extras (if we started saving it)
                    if (data.extras?.spaceName) return data.extras.spaceName;

                    // 3. Last resort: Coworking name or SunSpace
                    return coworking.name || data.extras?.coworkingName || "SunSpace";
                  };

                  const totalPrice = (() => {
                    const storedPrice = Number(data.total_price || data.totalPrice || data.payment?.data?.attributes?.amount || data.payment?.amount);
                    if (storedPrice > 0) return storedPrice.toFixed(2);
                    const hours = Math.ceil((endDate - startDate) / (1000 * 60 * 60));
                    if (hours > 0) {
                      let calcPrice = 0;
                      let pHourly = space.pricing_hourly || 0;
                      if (pHourly === 0 && space.type) {
                        if (space.type === "meeting-room") pHourly = 15;
                        else if (space.type === "event-space") pHourly = 20;
                        else if (space.type === "hot-desk" || space.type === "fixed-desk") pHourly = 5;
                      }
                      if (pHourly > 0) calcPrice += hours * pHourly * (data.participants || 1);
                      (data.equipments?.data || data.equipments || []).forEach(eq => {
                        const p = eq.attributes || eq;
                        if (p.price) calcPrice += (p.price_type === 'hourly' ? p.price * hours : p.price);
                      });
                      (data.services?.data || data.services || []).forEach(sv => {
                        const p = sv.attributes || sv;
                        if (p.price) calcPrice += (p.price_type === 'hourly' ? p.price * hours : p.price);
                      });
                      return calcPrice.toFixed(2);
                    }
                    return "0.00";
                  })();

                  const extrasCount = (data.equipments?.data || data.equipments || []).length +
                    (data.services?.data || data.services || []).length;

                  return (
                    <tr key={item.id} className="hover:bg-white/50 transition-all">
                      <td className="py-5 font-bold text-slate-700">{getSpaceDisplayName()}</td>
                      <td className="py-5 text-slate-500">{startDate.toLocaleDateString()}</td>
                      <td className="py-5 text-center font-black text-slate-900">{totalPrice} DT</td>
                      <td className="py-5 text-center">
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded">
                          {extrasCount > 0 ? `${extrasCount} option(s)` : "Aucun extra"}
                        </span>
                      </td>
                      <td className="py-5 text-right">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${data.status === "confirmed" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
                          {data.status === 'confirmed' ? 'Confirmé' : data.status === 'cancelled' ? 'Annulé' : 'Attente'}
                        </span>
                      </td>
                      <td className="py-5 text-right">
                        <button
                          onClick={() => {
                            const eqNames = (data.equipments?.data || data.equipments || []).map(eq => (eq.attributes || eq).name).join(", ");
                            const svNames = (data.services?.data || data.services || []).map(sv => (sv.attributes || sv).name).join(", ");
                            const participants = data.participants || 1;
                            const spaceName = getSpaceDisplayName();
                            alert(
                              `Détails : ${spaceName}\n` +
                              `Date : ${startDate.toLocaleDateString()}\n` +
                              `Heure : ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
                              `Participants : ${participants}\n` +
                              (eqNames ? `Équipements : ${eqNames}\n` : "") +
                              (svNames ? `Services : ${svNames}` : "")
                            );
                          }}
                          className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-800 underline transition-all"
                        >
                          Détails
                        </button>
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

  const renderSubscription = () => (
    <SubscriptionSection
      subscription={subscription}
      onCancel={handleCancelSubscription}
      onNavigateToPlans={() => navigate("/subscription-plans")}
    />
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
