import React, { useState, useEffect } from "react";
import { AdminLayout } from "../AdminLayout";
import api from "../../../../services/apiClient";

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/subscriptions/me");
      // NOTE: We need a real admin endpoint or use findMany with filters if permitted
      // For now, let's try to get all or use a specific admin endpoint if we created one.
      // Since we modified the controller to allow getMySubscription, maybe we can fetch all if admin?
      // Actually, let's use the standard Strapi plural endpoint if available.

      const response = await api.get(
        "/user-subscriptions?populate[0]=user&populate[1]=plan&sort=createdAt:desc",
      );

      // Strapi V5 response handling
      const data = response.data?.data || [];
      setSubscriptions(data);
    } catch (err) {
      console.error("Failed to fetch subscriptions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    const action = newStatus === "active" ? "approuver" : "refuser";
    let rejection_reason = "";

    if (newStatus === "cancelled") {
      rejection_reason = window.prompt(
        "Veuillez saisir la raison du refus (optionnel) :",
        "",
      );
      if (rejection_reason === null) return; // Cancelled prompt
    }

    if (
      window.confirm(
        `Êtes-vous sûr ?\nVoulez-vous vraiment ${action} cette demande d'abonnement ?`,
      )
    ) {
      try {
        await api.put(`/user-subscriptions/${id}`, {
          data: {
            status: newStatus,
            rejection_reason: rejection_reason || undefined,
          },
        });

        alert(
          `Succès ! L'abonnement a été ${newStatus === "active" ? "activé" : "refusé"}.`,
        );
        fetchSubscriptions();
      } catch (err) {
        console.error("Update error:", err);
        alert("Erreur : Impossible de mettre à jour le statut.");
      }
    }
  };

  const filtered = subscriptions.filter((s) => {
    const status = (s.attributes || s).status;
    if (filter === "all") return true;
    return status === filter;
  });

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Gestion des Abonnements
            </h1>
            <p className="text-slate-500 font-medium">
              Approuvez ou refusez les demandes de paiement en espèces.
            </p>
          </div>
          <div className="flex bg-white/50 p-1 rounded-xl border border-slate-200 shadow-sm">
            {["all", "pending", "active", "cancelled"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${
                  filter === f
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {f === "all"
                  ? "Tous"
                  : f === "pending"
                    ? "En attente"
                    : f === "active"
                      ? "Actifs"
                      : "Annulés"}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Utilisateur
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Plan
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Méthode
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Date Demande
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Statut
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-slate-400 italic"
                  >
                    Chargement...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-slate-400 italic"
                  >
                    Aucun abonnement trouvé.
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => {
                  const data = sub; // In Strapi 5 findMany, attributes are flattened
                  const user = data.user || {};
                  const plan = data.plan || {};
                  const statusColors = {
                    pending: "bg-amber-100 text-amber-700 border-amber-200",
                    active:
                      "bg-emerald-100 text-emerald-700 border-emerald-200",
                    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
                    expired: "bg-slate-100 text-slate-700 border-slate-200",
                  };

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">
                            {user.username || user.fullname || "Inconnu"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {user.email || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-100">
                          {plan.name ||
                            (plan.id ? `Plan #${plan.id}` : "Plan inconnu")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                          {data.payment_method === "cash"
                            ? "💵 Espèces"
                            : "💳 Carte"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(data.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[data.status] || statusColors.pending}`}
                        >
                          {data.status === "pending"
                            ? "En attente"
                            : data.status === "active"
                              ? "Actif"
                              : data.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {data.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  sub.documentId || sub.id,
                                  "active",
                                )
                              }
                              className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                              title="Approuver"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  sub.documentId || sub.id,
                                  "cancelled",
                                )
                              }
                              className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                              title="Refuser"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        {data.status === "active" && (
                          <button
                            onClick={() =>
                              handleStatusChange(
                                sub.documentId || sub.id,
                                "cancelled",
                              )
                            }
                            className="text-[10px] font-black text-rose-500 hover:underline uppercase tracking-widest"
                          >
                            Résilier
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SubscriptionManagement;
