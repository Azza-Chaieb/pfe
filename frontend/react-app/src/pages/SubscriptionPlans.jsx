import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSubscriptionPlans,
  subscribeToPlan,
  getMySubscription,
} from "../services/subscriptionService";

// ─── Static fallback plans (used if API has no data or is not reachable) ──────
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

// ─── Component ────────────────────────────────────────────────────────────────
const SubscriptionPlans = () => {
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [mySubscription, setMySubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [showComparison, setShowComparison] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        const [plansData, subData] = await Promise.all([
          getSubscriptionPlans(),
          user ? getMySubscription(user.id) : Promise.resolve(null),
        ]);

        const apiPlans = plansData?.data || [];
        if (apiPlans.length > 0) {
          // Map Strapi V5 shape
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
        console.warn(
          "[Subscription] API not reachable, using static plans:",
          err.message,
        );
        // Keep FALLBACK_PLANS
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

  const handleSubscribe = async (plan) => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      navigate("/login");
      return;
    }

    if (
      !window.confirm(
        `Confirmer l'abonnement au plan ${plan.name} (${billingCycle === "yearly" ? "Annuel -20%" : "Mensuel"}) ?`,
      )
    )
      return;

    try {
      setSubscribing(plan.id);
      if (plan.documentId || typeof plan.id === "number") {
        await subscribeToPlan({
          user: user.id,
          plan: plan.documentId || plan.id,
          billing_cycle: billingCycle,
        });
        alert(
          `🎉 Félicitations ! Vous êtes maintenant abonné au plan ${plan.name}.`,
        );
        navigate("/professional/subscription");
      } else {
        // Fallback static mode
        alert(
          `✅ Demande enregistrée pour le plan ${plan.name}. Contactez-nous pour finaliser votre abonnement.`,
        );
      }
    } catch (err) {
      console.error("Subscription error:", err);
      alert("Erreur lors de l'abonnement. Veuillez réessayer.");
    } finally {
      setSubscribing(null);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans">
      {/* ── Hero ── */}
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
          Accédez régulièrement aux meilleurs espaces de coworking de Tunis avec
          nos formules flexibles.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex bg-white/80 backdrop-blur border border-slate-200 rounded-2xl p-1.5 shadow-lg">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${billingCycle === "monthly" ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${billingCycle === "yearly" ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}
          >
            Annuel
            <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-black">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* ── Active subscription notice ── */}
      {mySubscription && (
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

      {/* ── Plan cards ── */}
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

                {/* Header */}
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

                {/* Body */}
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
                        : handleSubscribe(plan)
                    }
                    disabled={subscribing === plan.id}
                    className={`w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-lg transition-all active:scale-95 disabled:opacity-50 ${isCurrent ? "bg-emerald-600 hover:bg-emerald-700" : colors.btn}`}
                  >
                    {subscribing === plan.id
                      ? "Traitement..."
                      : isCurrent
                        ? "Plan Actuel ✓"
                        : "Souscrire maintenant"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Comparison Table ── */}
        <div className="mt-16">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="w-full flex items-center justify-between px-8 py-5 bg-white/60 backdrop-blur rounded-2xl border border-slate-200 shadow-sm hover:bg-white transition-all"
          >
            <span className="font-black text-slate-800">
              📊 Tableau comparatif complet
            </span>
            <span className="text-slate-400 font-black">
              {showComparison ? "▲ Masquer" : "▼ Afficher"}
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
          * Tous les plans incluent l'accès au WiFi haut débit, aux espaces
          communs et au support de base.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
