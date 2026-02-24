import React, { useState, useEffect } from "react";
import { AdminLayout } from "../AdminLayout.jsx";
import {
  getAllReservations,
  updateReservation,
  cancelReservation,
  confirmPayment,
} from "../../../../api";

const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, confirmed, cancelled
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await getAllReservations();
      setReservations(data.data || []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      setActionLoading(id);
      await updateReservation(id, { status: newStatus });
      await fetchReservations();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Erreur lors de la mise à jour du statut.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmPayment = async (paymentId) => {
    try {
      setActionLoading(paymentId);
      await confirmPayment(paymentId);
      await fetchReservations();
      alert("Paiement et réservation confirmés !");
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert(
        "Erreur lors de la confirmation du paiement. Assurez-vous d'avoir les permissions.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate Analytics Stats
  const stats = {
    total: reservations.length,
    pending: reservations.filter(
      (r) => (r.attributes?.status || r.status) === "pending",
    ).length,
    confirmed: reservations.filter(
      (r) => (r.attributes?.status || r.status) === "confirmed",
    ).length,
    revenue: reservations
      .filter((r) => (r.attributes?.status || r.status) === "confirmed")
      .reduce(
        (sum, r) =>
          sum + (Number(r.attributes?.total_price || r.total_price) || 0),
        0,
      ),
    today: reservations.filter((r) => {
      const attrs = r.attributes || r;
      const date = new Date(attrs.start_time || attrs.start_time);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    }).length,
  };

  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const filteredReservations = reservations.filter((res) => {
    const attrs = res.attributes || res;

    // Status Filter
    const matchesFilter = filter === "all" || attrs.status === filter;

    // Search Filter
    const user = attrs.user?.data?.attributes || attrs.user || {};
    const userName = user.fullname || user.username || "";
    const space = attrs.space?.data?.attributes || attrs.space || {};
    const spaceName = space.name || "";
    const matchesSearch =
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spaceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.id.toString().includes(searchTerm);

    // Date Range Filter
    let matchesDate = true;
    if (dateRange.start || dateRange.end) {
      const resDate = new Date(attrs.start_time);
      if (dateRange.start && resDate < new Date(dateRange.start))
        matchesDate = false;
      if (dateRange.end && resDate > new Date(dateRange.end))
        matchesDate = false;
    }

    return matchesFilter && matchesSearch && matchesDate;
  });

  return (
    <AdminLayout>
      <div className="animate-fade-in pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Gestion des Réservations 📅
            </h1>
            <p className="text-sm text-slate-500 font-medium tracking-tight mt-1">
              Pilotez l'activité et analysez l'occupation de vos espaces.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchReservations}
              className="px-6 py-3 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <span className={loading ? "animate-spin" : ""}>🔄</span>{" "}
              Actualiser
            </button>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <span className="text-5xl">📊</span>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
              Total Réservations
            </p>
            <h2 className="text-4xl font-black text-slate-800">
              {stats.total}
            </h2>
            <div className="mt-3 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black">
                {stats.pending} en attente
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <span className="text-5xl">💰</span>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
              Revenu Confirmé
            </p>
            <h2 className="text-4xl font-black text-slate-800">
              {stats.revenue.toLocaleString()}{" "}
              <span className="text-lg font-bold">DT</span>
            </h2>
            <p className="text-[10px] text-emerald-500 font-bold mt-3">
              Basé sur {stats.confirmed} réservations
            </p>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <span className="text-5xl">🕒</span>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
              Aujourd'hui
            </p>
            <h2 className="text-4xl font-black text-slate-800">
              {stats.today}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium mt-3">
              Flux de réservation actuel
            </p>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <span className="text-5xl">⚡</span>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
              Taux Succès
            </p>
            <h2 className="text-4xl font-black text-slate-800">
              {stats.total > 0
                ? Math.round((stats.confirmed / stats.total) * 100)
                : 0}
              %
            </h2>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-800 transition-all duration-1000"
                  style={{
                    width: `${stats.total > 0 ? (stats.confirmed / stats.total) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Rechercher un utilisateur, un espace ou un ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2.2rem] shadow-xl shadow-slate-200/20 text-sm font-medium focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <div className="flex-1 flex gap-3 bg-white p-2 rounded-[2.2rem] border border-slate-100 shadow-xl shadow-slate-200/20">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="flex-1 px-4 py-3 rounded-2xl text-[10px] font-bold text-slate-600 outline-none bg-slate-50 focus:bg-white border border-transparent focus:border-slate-100 transition-all"
              title="Date début"
            />
            <span className="self-center text-slate-300 font-bold">→</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="flex-1 px-4 py-3 rounded-2xl text-[10px] font-bold text-slate-600 outline-none bg-slate-50 focus:bg-white border border-transparent focus:border-slate-100 transition-all"
              title="Date fin"
            />
          </div>

          <div className="flex bg-white p-2 rounded-[2.2rem] border border-slate-100 shadow-xl shadow-slate-200/20">
            {["all", "pending", "confirmed", "cancelled"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-3 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all ${
                  filter === f
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/30"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f === "all"
                  ? "Tous"
                  : f === "pending"
                    ? "Pend"
                    : f === "confirmed"
                      ? "Conf"
                      : "Annul"}
              </button>
            ))}
          </div>
        </div>

        {/* Reservations Table */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[3rem] border border-white shadow-2xl shadow-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/70">
                  <th className="pl-10 pr-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Client
                  </th>
                  <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Lieu
                  </th>
                  <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Planification
                  </th>
                  <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Détails Prix
                  </th>
                  <th className="px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Statut
                  </th>
                  <th className="pl-6 pr-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-slate-400">
                          Analyse des données en cours...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-40">
                        <span className="text-6xl">🌫️</span>
                        <p className="text-lg font-black text-slate-600 italic">
                          Aucune donnée ne correspond à cette recherche.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((res) => {
                    const attrs = res.attributes || res;
                    const user =
                      attrs.user?.data?.attributes || attrs.user || {};
                    const space =
                      attrs.space?.data?.attributes || attrs.space || {};
                    const coworking =
                      attrs.coworking_space?.data?.attributes ||
                      attrs.coworking_space ||
                      {};
                    const payment =
                      attrs.payment?.data?.attributes || attrs.payment || null;

                    return (
                      <tr
                        key={res.id}
                        className="hover:bg-slate-50/80 transition-all duration-300 group"
                      >
                        <td className="pl-10 pr-6 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                              {(user.fullname ||
                                user.username ||
                                "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800 leading-tight">
                                {user.fullname || user.username || "Inconnu"}
                              </p>
                              <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                                {user.email || "Pas d'email"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-8">
                          <p className="text-sm font-black text-slate-800 leading-tight">
                            {space.name || "Espace"}
                          </p>
                          <p className="text-[11px] text-blue-500 font-extrabold uppercase tracking-tight mt-0.5">
                            {coworking.name || "SunSpace"}
                          </p>
                        </td>
                        <td className="px-6 py-8">
                          <div className="flex flex-col">
                            <p className="text-sm font-black text-slate-800">
                              {new Date(attrs.start_time).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                            <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md self-start mt-1">
                              {new Date(attrs.start_time).toLocaleTimeString(
                                "fr-FR",
                                { hour: "2-digit", minute: "2-digit" },
                              )}{" "}
                              -{" "}
                              {new Date(attrs.end_time).toLocaleTimeString(
                                "fr-FR",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-8">
                          <div className="flex flex-col">
                            <p className="text-base font-black text-slate-900">
                              {attrs.total_price || 0}{" "}
                              <span className="text-xs font-bold text-slate-400">
                                DT
                              </span>
                            </p>
                            {payment && (
                              <span className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400 mt-1">
                                {payment.method === "bank_transfer"
                                  ? "🏦 Transfert"
                                  : "🚩 Comptoir"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-8">
                          <div className="flex flex-col gap-2">
                            <div
                              className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-sm ${
                                attrs.status === "confirmed"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  : attrs.status === "pending"
                                    ? "bg-amber-50 text-amber-600 border border-amber-100"
                                    : "bg-rose-50 text-rose-600 border border-rose-100"
                              }`}
                            >
                              {attrs.status === "pending"
                                ? "Attente"
                                : attrs.status === "confirmed"
                                  ? "Validé"
                                  : "Annulé"}
                            </div>
                            {payment && payment.status === "submitted" && (
                              <span className="text-[8px] text-center font-black uppercase text-blue-600 bg-blue-50 rounded-lg py-1 border border-blue-100">
                                Reçu (Preuve jointe)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="pl-6 pr-10 py-8 text-right">
                          <div className="flex justify-end gap-3 items-center">
                            {payment?.proof_url?.data?.attributes?.url && (
                              <a
                                href={
                                  (import.meta.env.VITE_API_URL ||
                                    "http://localhost:1337") +
                                  payment.proof_url.data.attributes.url
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-xl hover:bg-blue-100 hover:text-blue-600 transition-all text-sm"
                                title="Voir la preuve de paiement"
                              >
                                🖼️
                              </a>
                            )}

                            <div className="flex flex-col gap-2 min-w-[120px]">
                              {attrs.status === "pending" && (
                                <button
                                  onClick={() =>
                                    payment
                                      ? handleConfirmPayment(payment.id)
                                      : handleStatusUpdate(
                                          res.documentId || res.id,
                                          "confirmed",
                                        )
                                  }
                                  disabled={actionLoading}
                                  className="py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                                >
                                  {actionLoading ? "..." : "Confirmer"}
                                </button>
                              )}
                              {attrs.status !== "cancelled" && (
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(
                                      res.documentId || res.id,
                                      "cancelled",
                                    )
                                  }
                                  disabled={actionLoading}
                                  className="py-2.5 bg-white text-rose-500 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all disabled:opacity-50"
                                >
                                  {actionLoading ? "..." : "Annuler"}
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ReservationManagement;
