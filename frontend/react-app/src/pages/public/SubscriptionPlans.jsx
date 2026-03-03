import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSubscriptionPlans,
  subscribeToPlan,
  getMySubscription,
} from "../../services/subscriptionService";

// ─── Static fallback plans ───────────────────────────────────────────────────
const FALLBACK_PLANS = [
  {
    id: "basic",
    name: "Basique",
    price: 49,
    type: "basic",
    description: "Idéal pour les freelances et indépendants.",
    max_credits: 5,
    features: [
      "5 réservations/mois",
      "10h de salle de réunion",
      "Accès open-space en semaine",
      "WiFi haut débit",
      "Café et thé inclus",
      "Support par email",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 99,
    type: "premium",
    description: "Le meilleur rapport qualité/prix pour les professionnels.",
    max_credits: 20,
    features: [
      "20 réservations/mois",
      "50h de salle de réunion",
      "Accès open-space 7j/7",
      "Bureau semi-privatif",
      "Impression 100 pages/mois",
      "Casier personnel",
      "Support prioritaire",
    ],
  },
  {
    id: "enterprise",
    name: "Entreprise",
    price: 199,
    type: "enterprise",
    description: "Pour les équipes et entreprises exigeantes.",
    max_credits: 9999,
    features: [
      "Réservations illimitées",
      "Accès 24h/7j à tous les espaces",
      "Bureau privatif dédié",
      "Salles de réunion illimitées",
      "Impression illimitée",
      "Domiciliation commerciale",
      "Gestionnaire de compte dédié",
    ],
  },
];

// ─── Comparison table rows ────────────────────────────────────────────────────
const COMPARISON_FEATURES = [
  { label: "Prix/mois", values: ["49 DT", "99 DT", "199 DT"] },
  { label: "Réservations/mois", values: ["5", "20", "Illimitées"] },
  { label: "Heures salle de réunion", values: ["10h", "50h", "Illimitées"] },
  { label: "Accès open-space", values: ["Semaine", "7j/7", "24h/7j"] },
  { label: "Bureau privatif", values: [false, "Semi-privatif", "Dédié"] },
  { label: "Impression", values: [false, "100 pages/mois", "Illimitée"] },
  { label: "Casier personnel", values: [false, true, true] },
  { label: "Domiciliation commerciale", values: [false, false, true] },
  { label: "Gestionnaire de compte", values: [false, false, true] },
  { label: "Support", values: ["Email", "Prioritaire", "Dédié"] },
];

const PLAN_COLORS = {
  basic: {
    gradient: "from-slate-700 to-slate-900",
    badge: "bg-slate-100 text-slate-700",
    btn: "bg-slate-800 hover:bg-slate-950",
    ring: "ring-slate-300",
  },
  premium: {
    gradient: "from-blue-600 to-indigo-800",
    badge: "bg-blue-100 text-blue-700",
    btn: "bg-blue-600 hover:bg-blue-700",
    ring: "ring-blue-400",
  },
  enterprise: {
    gradient: "from-amber-500 to-orange-700",
    badge: "bg-amber-100 text-amber-700",
    btn: "bg-amber-600 hover:bg-amber-700",
    ring: "ring-amber-400",
  },
};

const SubscriptionPlans = ({ isInline = false }) => {
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [mySubscription, setMySubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [showComparison, setShowComparison] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        const userRole = user?.user_type || "student";
        const [plansData, subData] = await Promise.all([
          getSubscriptionPlans(userRole),
          user ? getMySubscription(user.id) : Promise.resolve(null),
        ]);

        const apiPlans = plansData?.data || [];
        if (apiPlans.length > 0) {
          const mapped = apiPlans.map((p) => {
            const a = p.attributes || p;
            return {
              id: p.id,
              documentId: p.documentId,
              name: a.name,
              price: parseFloat(a.price || 0),
              type: a.type || "basic",
              description: a.description,
              max_credits: a.max_credits || 0,
              features: Array.isArray(a.features)
                ? a.features
                : a.features
                  ? Object.values(a.features)
                  : [],
            };
          });
          setPlans(mapped);
        }
        setMySubscription(subData);
      } catch (err) {
        console.warn("[Subscription] API not reachable, using static plans");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getPrice = (plan) => {
    const base = parseFloat(plan.price || 0);
    return billingCycle === "yearly"
      ? Math.round(base * 12 * 0.8)
      : Math.round(base);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setSubscribing(selectedPlan.id);
      await subscribeToPlan({
        user: user.id,
        plan: selectedPlan.documentId || selectedPlan.id,
        billing_cycle: billingCycle,
        payment_method: paymentMethod,
      });

      if (paymentMethod === "cash") {
        alert(
          `✅ Demande enregistrée ! Votre abonnement au plan ${selectedPlan.name} est en attente de confirmation par l'administrateur. Un email vous sera envoyé dès l'activation.`,
        );
      } else {
        alert(
          `🎉 Félicitations ! Votre abonnement au plan ${selectedPlan.name} a été créé et est en attente d'activation.`,
        );
      }

      if (isInline) {
        // If inline, we don't necessarily want to navigate away,
        // just refresh the parent or show success state.
        // For now, let's just refresh the page to show the new status.
        window.location.reload();
      } else {
        const role = user.user_type || "student";
        const dashboardPaths = {
          student: "/dashboard",
          trainer: "/trainer/dashboard",
          professional: "/professional/dashboard",
          association: "/association/dashboard",
        };
        navigate(dashboardPaths[role] || "/profile");
      }
    } catch (err) {
      console.error("Subscription error:", err);
      const backendError = err.response?.data?.error?.message || err.message;
      alert(`Erreur lors de l'abonnement: ${backendError}`);
    } finally {
      setSubscribing(null);
      setSelectedPlan(null);
    }
  };

  const isCurrentPlan = (plan) => {
    if (!mySubscription) return false;
    const sub = mySubscription.attributes || mySubscription;
    const planId = sub.plan?.data?.id || sub.plan?.id;
    return planId === plan.id;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={
        isInline
          ? ""
          : "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans"
      }
    >
      {!isInline && (
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-8 text-center relative">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-16 left-4 px-4 py-2 bg-white/50 hover:bg-white text-slate-600 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 backdrop-blur-sm"
          >
            ← Retour
          </button>

          <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
            💳 Plans d'abonnement
          </span>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto mb-8">
            Accédez régulièrement aux meilleurs espaces de coworking de Tunis
            avec nos formules flexibles.
          </p>

          <div className="inline-flex bg-white/80 backdrop-blur border border-slate-200 rounded-2xl p-1.5 shadow-lg text-slate-400">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${billingCycle === "monthly" ? "bg-slate-900 text-white shadow-md" : "hover:text-slate-600"}`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${billingCycle === "yearly" ? "bg-slate-900 text-white shadow-md text-white" : "hover:text-slate-600"}`}
            >
              Annuel{" "}
              <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-black">
                {" "}
                -20%{" "}
              </span>
            </button>
          </div>
        </div>
      )}

      {mySubscription && !isInline && (
        <div className="max-w-xl mx-auto px-4 mb-8">
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-4">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-black text-emerald-800">
                Abonnement actif
              </p>
              <p className="text-xs text-emerald-600">
                Plan{" "}
                {(mySubscription.attributes || mySubscription).plan?.data
                  ?.attributes?.name ||
                  (mySubscription.attributes || mySubscription)?.plan
                    ?.name}{" "}
                · Expire le{" "}
                {new Date(
                  (mySubscription.attributes || mySubscription).end_date,
                ).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <button
              onClick={() => navigate("/professional/subscription")}
              className="ml-auto text-[10px] font-black text-emerald-700 uppercase hover:underline tracking-widest"
            >
              Gérer →
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const colors = PLAN_COLORS[plan.type] || PLAN_COLORS.basic;
            const isPremium = plan.type === "premium";
            const isCurrent = isCurrentPlan(plan);

            return (
              <div
                key={plan.id}
                className={`relative rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-2 ${isPremium ? "scale-105 ring-2 " + colors.ring : ""}`}
              >
                {isPremium && (
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-center text-[9px] font-black uppercase tracking-widest py-2">
                    ⭐ Plus Populaire
                  </div>
                )}
                <div className={`bg-gradient-to-br ${colors.gradient} p-8`}>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 ${colors.badge}`}
                  >
                    {plan.type}
                  </span>
                  <h3 className="text-2xl font-black text-white mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-white/70 text-xs mb-6">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-white">
                      {getPrice(plan)}
                    </span>
                    <span className="text-white/70 text-sm font-bold">
                      DT/{billingCycle === "yearly" ? "an" : "mois"}
                    </span>
                  </div>
                  {billingCycle === "yearly" && (
                    <p className="text-white/50 text-[10px] mt-1">
                      soit {Math.round(getPrice(plan) / 12)} DT/mois
                    </p>
                  )}
                </div>
                <div className="bg-white p-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                    {plan.max_credits >= 9999
                      ? "∞ crédits illimités"
                      : `${plan.max_credits} crédits/mois`}
                  </p>
                  <ul className="space-y-3 mb-8 min-h-[200px]">
                    {plan.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-sm text-slate-600"
                      >
                        <span className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 text-xs flex-shrink-0">
                          ✓
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() =>
                      isCurrent
                        ? navigate("/professional/subscription")
                        : setSelectedPlan(plan)
                    }
                    disabled={subscribing === plan.id}
                    className={`w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-lg transition-all active:scale-95 disabled:opacity-50 ${isCurrent ? "bg-emerald-600 hover:bg-emerald-700" : colors.btn}`}
                  >
                    {subscribing === plan.id
                      ? "Traitement..."
                      : isCurrent
                        ? "Plan Actuel ✓"
                        : "Choisir ce plan"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="w-full flex items-center justify-between px-8 py-5 bg-white/60 backdrop-blur rounded-2xl border border-slate-200 shadow-sm hover:bg-white transition-all text-slate-400"
          >
            <span className="font-black text-slate-800">
              📊 Tableau comparatif complet
            </span>
            <span className="font-black">
              {" "}
              {showComparison ? "▲ Masquer" : "▼ Afficher"}{" "}
            </span>
          </button>
          {showComparison && (
            <div className="mt-4 bg-white/80 backdrop-blur rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">
                      Fonctionnalité
                    </th>
                    {plans.map((p) => (
                      <th key={p.id} className="px-6 py-5 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${(PLAN_COLORS[p.type] || PLAN_COLORS.basic).badge}`}
                        >
                          {p.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {COMPARISON_FEATURES.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-slate-50/40" : ""}>
                      <td className="px-8 py-4 text-slate-600 font-semibold">
                        {row.label}
                      </td>
                      {row.values.map((val, vi) => (
                        <td key={vi} className="px-6 py-4 text-center">
                          {val === true ? (
                            <span className="text-emerald-500 font-black text-base">
                              ✓
                            </span>
                          ) : val === false ? (
                            <span className="text-slate-200 font-black text-base">
                              —
                            </span>
                          ) : (
                            <span className="font-bold text-slate-700">
                              {val}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-slate-400 mt-10 font-medium">
          * Tous les plans incluent l'accès au WiFi haut débit et aux espaces
          communs.
        </p>
      </div>

      {/* Payment Method Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full p-8 relative overflow-hidden text-left">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
            <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
              Choisir le paiement
            </h3>
            <p className="text-slate-500 text-sm mb-8 font-medium">
              Sélectionnez votre méthode de paiement préférée pour le plan{" "}
              <b className="text-slate-800">{selectedPlan.name}</b>.
            </p>

            <div className="space-y-4 mb-8">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${paymentMethod === "cash" ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-slate-200"}`}
              >
                <div className="flex items-center gap-4 text-left">
                  <span className="text-2xl">💵</span>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">
                      Espèces
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Délai de 2 heures
                    </p>
                  </div>
                </div>
                {paymentMethod === "cash" && (
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px]">
                    ✓
                  </div>
                )}
              </button>

              <button
                className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 border-slate-100 opacity-60 cursor-not-allowed`}
                disabled
              >
                <div className="flex items-center gap-4 text-left">
                  <span className="text-2xl opacity-40">💳</span>
                  <div>
                    <h4 className="font-black text-slate-400 text-sm uppercase tracking-tight">
                      Carte Bancaire
                    </h4>
                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">
                      Bientôt disponible
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedPlan(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all disabled:opacity-50"
              >
                {subscribing ? "Traitement..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isInline && (
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}</style>
      )}
    </div>
  );
};

export default SubscriptionPlans;
