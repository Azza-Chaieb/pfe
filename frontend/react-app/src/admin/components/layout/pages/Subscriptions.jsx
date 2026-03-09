import React, { useState, useEffect } from "react";
import { AdminLayout } from "../AdminLayout.jsx";
import {
    getAdminSubscriptionPlans,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
} from "../../../../services/subscriptionService";
import api from "../../../../services/apiClient";

const Subscriptions = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState("all");
    const [billingCycle, setBillingCycle] = useState("monthly");

    // Plan Edit Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [modalCycle, setModalCycle] = useState("monthly");
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        duration_days: 30,
        type: "basic",
        target_role: "all",
        max_credits: 10,
        deadline_hours: 2,
        features: "",
    });

    // Assign Subscription Modal state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [assignForm, setAssignForm] = useState({
        userId: "",
        planId: "",
        billingCycle: "monthly",
        paymentMethod: "cash",
        startDate: new Date().toISOString().split("T")[0],
    });
    const [assigning, setAssigning] = useState(false);

    // Confirmation Modal State
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        type: "danger",
    });

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const response = await getAdminSubscriptionPlans();
            setPlans(response.data || []);
        } catch (error) {
            console.error("Failed to load subscription plans", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get("/users?pagination[pageSize]=200");
            setUsers(response.data || []);
        } catch (err) {
            console.error("Failed to load users", err);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    // Role filter tabs
    const roleLabels = [
        { value: "all", label: "Tous" },
        { value: "student", label: "Étudiants" },
        { value: "trainer", label: "Formateurs" },
        { value: "association", label: "Associations" },
        { value: "professional", label: "Professionnels" },
    ];

    const filteredPlans = plans.filter((p) => {
        const attrs = p.attributes || p;
        if (roleFilter === "all") return true;
        return (attrs.target_role || "").toLowerCase() === roleFilter;
    });

    const getPrice = (basePrice) => {
        if (billingCycle === "quarterly") return Math.round(basePrice * 3 * 0.85); // 15% discount
        return Math.round(basePrice);
    };

    const getDuration = (baseDuration) => {
        if (billingCycle === "quarterly") return baseDuration * 3;
        return baseDuration;
    };

    // ── Plan Edit Modal ──────────────────────────────────────────────
    const handleOpenModal = (plan = null) => {
        if (plan) {
            const attrs = plan.attributes || plan;
            setEditingPlan(plan);
            setFormData({
                name: attrs.name || "",
                description: attrs.description || "",
                price: attrs.price || "",
                duration_days: attrs.duration_days || 30,
                type: attrs.type || "basic",
                target_role: attrs.target_role || "all",
                max_credits: attrs.max_credits || 10,
                deadline_hours: attrs.deadline_hours || 2,
                features: Array.isArray(attrs.features)
                    ? attrs.features.join("\n")
                    : attrs.features || "",
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: "",
                description: "",
                price: "",
                duration_days: 30,
                type: "basic",
                target_role: "all",
                max_credits: 10,
                deadline_hours: 2,
                features: "",
            });
        }
        setIsModalOpen(true);
        setModalCycle("monthly");
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPlan(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                duration_days: parseInt(formData.duration_days, 10),
                max_credits: parseInt(formData.max_credits, 10),
                deadline_hours: parseInt(formData.deadline_hours, 10),
                features: formData.features
                    ? formData.features.split("\n").filter((f) => f.trim() !== "")
                    : [],
            };

            if (editingPlan) {
                const targetId = editingPlan.documentId || editingPlan.id;
                await updateSubscriptionPlan(targetId, payload);
            } else {
                await createSubscriptionPlan(payload);
            }
            handleCloseModal();
            fetchPlans();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'enregistrement du plan");
        }
    };

    const handleDelete = (plan) => {
        const targetId = plan.documentId || plan.id;
        setConfirmConfig({
            isOpen: true,
            title: "Supprimer le plan",
            message:
                "Êtes-vous sûr de vouloir supprimer ce plan d'abonnement ? Cette action est irréversible.",
            type: "danger",
            onConfirm: async () => {
                try {
                    await deleteSubscriptionPlan(targetId);
                    fetchPlans();
                } catch (e) {
                    alert("Erreur lors de la suppression");
                }
            },
        });
    };

    // ── Assign Subscription Modal ────────────────────────────────────
    const handleOpenAssignModal = () => {
        fetchUsers();
        setAssignForm({
            userId: "",
            planId: "",
            billingCycle: "monthly",
            paymentMethod: "cash",
            startDate: new Date().toISOString().split("T")[0],
        });
        setIsAssignModalOpen(true);
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        if (!assignForm.userId || !assignForm.planId) {
            alert("Veuillez sélectionner un utilisateur et un plan.");
            return;
        }
        setAssigning(true);
        try {
            const plan = plans.find(
                (p) => String(p.documentId || p.id) === String(assignForm.planId),
            );
            const attrs = plan ? plan.attributes || plan : {};
            const daysMap = {
                monthly: attrs.duration_days || 30,
                quarterly: (attrs.duration_days || 30) * 3,
                semiannually: (attrs.duration_days || 30) * 6,
                yearly: (attrs.duration_days || 30) * 12,
            };
            const start = new Date(assignForm.startDate);
            const end = new Date(start);
            end.setDate(end.getDate() + (daysMap[assignForm.billingCycle] || 30));

            await api.post("/user-subscriptions", {
                data: {
                    user: parseInt(assignForm.userId),
                    plan: assignForm.planId,
                    start_date: start.toISOString().split("T")[0],
                    end_date: end.toISOString().split("T")[0],
                    status: "active",
                    billing_cycle: assignForm.billingCycle,
                    payment_method: assignForm.paymentMethod,
                    remaining_credits: attrs.max_credits || 0,
                    original_price: attrs.price || 0,
                    final_price: attrs.price || 0,
                },
            });

            alert("Abonnement créé avec succès !");
            setIsAssignModalOpen(false);
        } catch (err) {
            console.error("Assign error:", err);
            alert("Erreur lors de la création de l'abonnement.");
        } finally {
            setAssigning(false);
        }
    };

    // ── Confirmation Modal ───────────────────────────────────────────
    const ConfirmationModal = () => {
        if (!confirmConfig.isOpen) return null;
        return (
            <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
                <div
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
                    onClick={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                ></div>
                <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center animate-scale-up">
                    <div
                        className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-3xl mb-6 ${confirmConfig.type === "danger" ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
                    >
                        {confirmConfig.type === "danger" ? "⚠️" : "ℹ️"}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-4">
                        {confirmConfig.title}
                    </h3>
                    <p className="text-slate-500 font-bold text-sm mb-10">
                        {confirmConfig.message}
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={() =>
                                setConfirmConfig({ ...confirmConfig, isOpen: false })
                            }
                            className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 font-black text-[11px] uppercase rounded-2xl hover:bg-slate-200 transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={() => {
                                confirmConfig.onConfirm();
                                setConfirmConfig({ ...confirmConfig, isOpen: false });
                            }}
                            className={`flex-1 px-8 py-4 text-white font-black text-[11px] uppercase rounded-2xl transition-all shadow-lg ${confirmConfig.type === "danger" ? "bg-rose-600 shadow-rose-200 hover:bg-rose-700" : "bg-blue-600 shadow-blue-200 hover:bg-blue-700"}`}
                        >
                            Confirmer
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AdminLayout>
            <div className="animate-fade-in pb-20 max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-violet-100 text-violet-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                Administration
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            Plans d'Abonnement
                        </h1>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="group flex items-center gap-3 px-8 py-4 bg-violet-600 text-white font-black text-xs uppercase rounded-2xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 active:scale-95"
                    >
                        <span className="text-lg">➕</span> Créer Abonnement
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-8">
                    {/* Role filter tabs */}
                    <div className="flex bg-white/50 p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
                        {roleLabels.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setRoleFilter(f.value)}
                                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${roleFilter === f.value
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Cycle/Duration view toggle */}
                    <div className="flex bg-white/50 p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
                        {[
                            { value: "monthly", label: "Mensuel" },
                            { value: "quarterly", label: "Trimestriel (-15%)" },
                        ].map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setBillingCycle(f.value)}
                                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${billingCycle === f.value
                                    ? "bg-amber-500 text-white shadow-md"
                                    : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Plans Table */}
                <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        Plan
                                    </th>
                                    <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        Prix & Durée
                                    </th>
                                    <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        Cible
                                    </th>
                                    <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="p-32 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin"></div>
                                                <span className="font-black text-slate-300 uppercase italic tracking-widest text-[11px]">
                                                    Chargement des plans...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredPlans.length > 0 ? (
                                    filteredPlans.map((plan) => {
                                        const attrs = plan.attributes || plan;
                                        return (
                                            <tr
                                                key={plan.id}
                                                className="group hover:bg-slate-50/80 transition-all duration-300"
                                            >
                                                <td className="p-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white flex items-center justify-center font-black text-xl shadow-xl shadow-violet-500/20 group-hover:scale-105 transition-transform">
                                                            {attrs.type?.charAt(0).toUpperCase() || "?"}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-900 text-lg leading-none mb-1 group-hover:text-violet-600 transition-colors uppercase tracking-tight">
                                                                {attrs.name}
                                                            </div>
                                                            <div className="text-slate-400 text-xs font-bold w-48 truncate">
                                                                {attrs.description || "Aucune description"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="inline-flex flex-col">
                                                        <div className="text-lg font-black text-slate-900">
                                                            {getPrice(attrs.price)} DT
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-400">
                                                            Pour {getDuration(attrs.duration_days)} jours
                                                        </span>
                                                        {billingCycle === "quarterly" && (
                                                            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-tight mt-1">
                                                                (Base : {attrs.price} DT / {attrs.duration_days}j)
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                        {attrs.target_role}
                                                    </span>
                                                </td>
                                                <td className="p-8 text-right">
                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            onClick={() => handleOpenModal(plan)}
                                                            className="px-6 py-4 bg-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all shadow-sm"
                                                        >
                                                            ✏️ Éditer
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(plan)}
                                                            className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase hover:bg-rose-100 transition-all"
                                                        >
                                                            🗑️ Supprimer
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="p-32 text-center text-slate-400 italic">
                                            Aucun plan trouvé
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit Plan Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in"
                            onClick={handleCloseModal}
                        ></div>
                        <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-up border border-white/20 max-h-[90vh] flex flex-col">
                            <div className="p-10 bg-gradient-to-br from-violet-600 to-fuchsia-800 text-white shrink-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tight">
                                            {editingPlan ? "Éditer le Plan" : "Nouveau Plan"}
                                        </h2>
                                        <p className="text-violet-100/70 font-bold text-sm mt-1">
                                            Configurez les caractéristiques du plan d'abonnement.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCloseModal}
                                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <div className="p-10 overflow-y-auto">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1 h-1 bg-violet-500 rounded-full"></span>{" "}
                                                Informations Générales
                                            </h4>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">Nom du Plan</label>
                                                <input name="name" value={formData.name} onChange={handleChange} required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-400 transition-all font-bold" placeholder="ex: Pack Étudiant Premium" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">Description</label>
                                                <textarea name="description" value={formData.description} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-400 transition-all font-bold min-h-[100px]" placeholder="Description du plan..." />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">Type</label>
                                                    <select name="type" value={formData.type} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-400 transition-all font-bold">
                                                        <option value="basic">Basic</option>
                                                        <option value="premium">Premium</option>
                                                        <option value="enterprise">Enterprise</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">Cible (Rôle)</label>
                                                    <select name="target_role" value={formData.target_role} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-400 transition-all font-bold">
                                                        <option value="student">Student</option>
                                                        <option value="trainer">Trainer</option>
                                                        <option value="professional">Professional</option>
                                                        <option value="association">Association</option>
                                                        <option value="all">Tous (All)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1 h-1 bg-amber-500 rounded-full"></span>{" "}
                                                Tarification & Limites
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">Prix base mensuel (DT)</label>
                                                    <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-400 font-bold" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">Durée de base (Jours)</label>
                                                    <input type="number" name="duration_days" value={formData.duration_days} onChange={handleChange} required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-400 font-bold" />
                                                </div>
                                            </div>

                                            {/* Preview block for cycles */}
                                            <div className="mt-4 p-5 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-center justify-between">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-black text-amber-600 uppercase">Voir prix appliqué :</label>
                                                    <select
                                                        value={modalCycle}
                                                        onChange={(e) => setModalCycle(e.target.value)}
                                                        className="px-4 py-2 bg-white border border-amber-200 rounded-xl outline-none text-xs font-bold text-amber-700 focus:ring-2 focus:ring-amber-400/20"
                                                    >
                                                        <option value="monthly">Mensuel (30 Jours)</option>
                                                        <option value="quarterly">Trimestriel (-15%, 90 Jours)</option>
                                                    </select>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Prix {modalCycle === 'monthly' ? 'Mensuel' : 'Trimestriel'} calculé</div>
                                                    <div className="text-2xl font-black text-slate-800">
                                                        {modalCycle === 'monthly'
                                                            ? (formData.price || 0)
                                                            : Math.round((parseFloat(formData.price) || 0) * 3 * 0.85)} DT
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">Crédits max</label>
                                                    <input type="number" name="max_credits" value={formData.max_credits} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-400 font-bold" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">Délai annulation (H)</label>
                                                    <input type="number" name="deadline_hours" value={formData.deadline_hours} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-400 font-bold" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">Options / Fonctionnalités</label>
                                                <textarea name="features" value={formData.features} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-400 transition-all font-bold min-h-[120px]" placeholder="Une option par ligne..." />
                                                <p className="text-[9px] text-slate-400 mt-2 ml-2 italic">Saisissez une option par ligne.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
                                        <button type="button" onClick={handleCloseModal} className="px-8 py-4 bg-slate-100 text-slate-600 font-black text-[11px] uppercase rounded-2xl hover:bg-slate-200 transition-all">
                                            Annuler
                                        </button>
                                        <button type="submit" className="px-12 py-4 bg-violet-600 text-white font-black text-[11px] uppercase rounded-2xl hover:bg-violet-700 transition-all shadow-lg active:scale-95">
                                            {editingPlan ? "Mettre à jour" : "Créer le Plan"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Assign Subscription Modal */}
                {isAssignModalOpen && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                            onClick={() => setIsAssignModalOpen(false)}
                        ></div>
                        <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 max-h-[90vh] flex flex-col">
                            <div className="p-8 bg-gradient-to-br from-violet-600 to-fuchsia-800 text-white shrink-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">Créer un Abonnement</h2>
                                        <p className="text-violet-100/70 font-bold text-sm mt-1">Assignez un plan à un utilisateur.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsAssignModalOpen(false)}
                                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 overflow-y-auto">
                                <form onSubmit={handleAssignSubmit} className="space-y-5">
                                    {/* User selector */}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-2 block">Utilisateur (Rôle)</label>
                                        <select
                                            value={assignForm.userId}
                                            onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                                            required
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-400 font-bold"
                                        >
                                            <option value="">-- Sélectionner un utilisateur --</option>
                                            {users.map((u) => {
                                                const roleName = u.user_type === "student" ? "étudiant" :
                                                    u.user_type === "trainer" ? "formateur" :
                                                        u.user_type === "association" ? "association" :
                                                            u.user_type === "professional" ? "professionnel" : u.user_type || '?';

                                                return (
                                                    <option key={u.id} value={u.id}>
                                                        {u.username || u.fullname || u.email} — {roleName}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    {/* Plan selector */}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-2 block">Plan d'Abonnement (Variantes)</label>
                                        <select
                                            value={assignForm.planId + "|" + assignForm.billingCycle}
                                            onChange={(e) => {
                                                const [pId, cycle] = e.target.value.split("|");
                                                setAssignForm({ ...assignForm, planId: pId, billingCycle: cycle });
                                            }}
                                            required
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-400 font-bold"
                                        >
                                            <option value="|monthly">-- Sélectionner un plan --</option>
                                            {plans.flatMap((p) => {
                                                const a = p.attributes || p;
                                                const pid = p.documentId || p.id;
                                                const basePrice = parseFloat(a.price);
                                                const qPrice = Math.round(basePrice * 3 * 0.85); // 15% discount
                                                const roleName = a.target_role || "all";
                                                return [
                                                    <option key={`${pid}-monthly`} value={`${pid}|monthly`}>
                                                        {a.name} (Mensuel) — {basePrice} DT ({roleName})
                                                    </option>,
                                                    <option key={`${pid}-quarterly`} value={`${pid}|quarterly`}>
                                                        {a.name} (Trimestriel) — {qPrice} DT ({roleName})
                                                    </option>
                                                ];
                                            })}
                                        </select>
                                    </div>

                                    {/* Billing cycle (Hidden since it's now bound to Plan) */}
                                    {/* Cycle is implicitly selected through the plan variants above */}

                                    {/* Payment method */}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-2 block">Méthode de paiement</label>
                                        <select
                                            value={assignForm.paymentMethod}
                                            onChange={(e) => setAssignForm({ ...assignForm, paymentMethod: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-400 font-bold"
                                        >
                                            <option value="cash">💵 Espèces</option>
                                            <option value="card">💳 Carte</option>
                                            <option value="transfer">🏦 Virement</option>
                                        </select>
                                    </div>

                                    {/* Start date */}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-2 block">Date de début</label>
                                        <input
                                            type="date"
                                            value={assignForm.startDate}
                                            onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-400 font-bold"
                                        />
                                    </div>

                                    <div className="pt-4 flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsAssignModalOpen(false)}
                                            className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 font-black text-[11px] uppercase rounded-2xl hover:bg-slate-200 transition-all"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={assigning}
                                            className="flex-1 px-6 py-4 bg-violet-600 text-white font-black text-[11px] uppercase rounded-2xl hover:bg-violet-700 transition-all shadow-lg active:scale-95 disabled:opacity-60"
                                        >
                                            {assigning ? "Création..." : "Créer Abonnement"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                <ConfirmationModal />
            </div>
        </AdminLayout>
    );
};

export default Subscriptions;
