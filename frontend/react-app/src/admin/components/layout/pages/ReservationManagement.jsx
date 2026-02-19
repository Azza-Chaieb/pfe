import React, { useState, useEffect } from "react";
import { AdminLayout } from "../AdminLayout.jsx";
import { getAllReservations, updateReservation, cancelReservation } from "../../../../api";

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

    const filteredReservations = reservations.filter((res) => {
        const attrs = res.attributes || res;
        const matchesFilter = filter === "all" || attrs.status === filter;
        const userName = attrs.user?.data?.attributes?.fullname || attrs.user?.fullname || "";
        const spaceName = attrs.space?.data?.attributes?.name || attrs.space?.name || "";
        const matchesSearch =
            userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            spaceName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <AdminLayout>
            <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            Gestion des Réservations 📅
                        </h1>
                        <p className="text-xs text-slate-500 font-medium tracking-tight mt-1">
                            Consultez, confirmez ou annulez les réservations de tous les utilisateurs.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchReservations}
                            className="p-3 bg-white text-slate-600 rounded-xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all"
                            title="Rafraîchir"
                        >
                            🔄
                        </button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher un utilisateur ou un espace..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-md border border-white/50 rounded-[22px] shadow-xl shadow-slate-200/50 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-[22px] border border-white/50 shadow-xl shadow-slate-200/50">
                        {["all", "pending", "confirmed", "cancelled"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-1 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${filter === f
                                    ? "bg-slate-900 text-white shadow-lg"
                                    : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                {f === "all" ? "Tous" : f === "pending" ? "En attente" : f === "confirmed" ? "Confirmés" : "Annulés"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reservations Table */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/50 shadow-2xl shadow-slate-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Espace</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Créneau</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-12 text-center text-slate-400 italic">Chargement...</td>
                                    </tr>
                                ) : filteredReservations.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-12 text-center text-slate-400 italic">Aucune réservation trouvée.</td>
                                    </tr>
                                ) : (
                                    filteredReservations.map((res) => {
                                        const attrs = res.attributes || res;
                                        const user = attrs.user?.data?.attributes || attrs.user || {};
                                        const space = attrs.space?.data?.attributes || attrs.space || {};
                                        const coworking = attrs.coworking_space?.data?.attributes || attrs.coworking_space || {};

                                        return (
                                            <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">
                                                            {(user.fullname || user.username || "?")[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700">{user.fullname || user.username || "Inconnu"}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">{user.email || ""}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-bold text-slate-700">{space.name || "Espace"}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{coworking.name || "SunSpace"}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-bold text-slate-700">{new Date(attrs.date).toLocaleDateString('fr-FR')}</p>
                                                    <p className="text-xs text-blue-600 font-black uppercase tracking-tighter">{attrs.time_slot}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-black text-slate-700">{attrs.total_price || 0} DT</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${attrs.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                        attrs.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                            'bg-red-50 text-red-600 border border-red-100'
                                                        }`}>
                                                        {attrs.status || 'pending'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {attrs.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(res.documentId, 'confirmed')}
                                                                disabled={actionLoading === (res.documentId || res.id)}
                                                                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                                                            >
                                                                {actionLoading === (res.documentId || res.id) ? '...' : 'Confirmer'}
                                                            </button>
                                                        )}
                                                        {attrs.status !== 'cancelled' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(res.documentId, 'cancelled')}
                                                                disabled={actionLoading === (res.documentId || res.id)}
                                                                className="px-4 py-2 bg-white text-red-500 border border-red-100 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all disabled:opacity-50"
                                                            >
                                                                {actionLoading === (res.documentId || res.id) ? '...' : 'Annuler'}
                                                            </button>
                                                        )}
                                                        {attrs.status === 'cancelled' && (
                                                            <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest italic">Archivé</span>
                                                        )}
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
