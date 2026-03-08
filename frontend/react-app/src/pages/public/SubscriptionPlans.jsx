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
    id: "student-basic",
    name: "Étudiant Basique",
    price: 15,
    type: "basic",
    target_role: "student",
    description: "Accès standard aux espaces d'étude.",
    max_credits: 5,
    features: ["WiFi Illimité", "Accès zones calmes", "5 crédits impression"],
  },
  {
    id: "student-pro",
    name: "Étudiant Pro",
    price: 30,
    type: "premium",
    target_role: "student",
    description: "Accès étendu et prioritaire.",
    max_credits: 15,
    features: ["Accès 24/7", "Salle de réunion", "15 crédits impression"],
  },
  {
    id: "pro-essential",
    name: "Pro Essentiel",
    price: 80,
    type: "basic",
    target_role: "professional",
    description: "Pour les freelances et nomades.",
    max_credits: 10,
    features: ["Coworking open-space", "Café illimité", "10h réunion"],
  },
  {
    id: "pro-premium",
    name: "Pro Premium",
    price: 180,
    type: "premium",
    target_role: "professional",
    description: "Solution bureau dédié complète.",
    max_credits: 9999,
    features: ["Bureau dédié", "Domiciliation entreprise", "Salles illimitées"],
  },
  {
    id: "assoc-comm",
    name: "Association Communauté",
    price: 100,
    type: "basic",
    target_role: "association",
    description: "Idéal pour les réunions régulières.",
    max_credits: 20,
    features: ["Bureau partagé", "2 événements/mois"],
  },
  {
    id: "assoc-exp",
    name: "Association Expansion",
    price: 250,
    type: "premium",
    target_role: "association",
    description: "Pour les associations actives.",
    max_credits: 9999,
    features: ["Privatisation week-end", "Événements illimités"],
  },
  {
    id: "trainer-solo",
    name: "Formateur Solo",
    price: 60,
    type: "basic",
    target_role: "trainer",
    description: "Accès flexible aux salles.",
    max_credits: 10,
    features: ["Salles de cours", "Projecteur inclus"],
  },
  {
    id: "trainer-expert",
    name: "Formateur Expert",
    price: 150,
    type: "premium",
    target_role: "trainer",
    description: "Outils avancés et visibilité.",
    max_credits: 9999,
    features: ["Salles premium", "Vidéoconférence Pro"],
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
  console.log(`[SubscriptionPlans] Rendering. isInline:`, isInline);
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [mySubscription, setMySubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [showComparison, setShowComparison] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const navigate = useNavigate();

  const normalizeRole = (role) => {
    if (!role) return "student";
    const r = role.toLowerCase();
    if (r === "etudiant" || r === "student") return "student";
    if (r === "formateur" || r === "trainer") return "trainer";
    if (r === "professionnel" || r === "professional" || r === "pro")
      return "professional";
    if (r === "association") return "association";
    return r;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        const rawRole = user?.user_type || user?.role?.name || "student";
        const userRole = normalizeRole(rawRole);

        console.log(
          `[Subscription] Loading plans for role: ${userRole} (raw: ${rawRole})`,
        );

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
              target_role: a.target_role || "all",
              description: a.description,
              max_credits: a.max_credits || 0,
              features: Array.isArray(a.features)
                ? a.features
                : a.features
                  ? Object.values(a.features)
                  : [],
            };
          });

          if (userRole) {
            // Priority 1: Plans specifically for the user's role
            // Priority 2: 'all' plans
            const rolePlans = mapped.filter((p) => p.target_role === userRole);
            const allPlans = mapped.filter((p) => p.target_role === "all");

            // If we have role-specific plans, use them. Otherwise fallback to 'all'.
            // In our case, we just created 3 plans specifically for EACH role.
            setPlans(rolePlans.length > 0 ? rolePlans : allPlans);
          } else {
            setPlans(mapped);
          }
        } else {
          // Filter fallback plans by role
          const filteredFallbacks = FALLBACK_PLANS.filter(
            (p) => p.target_role === userRole || p.target_role === "all",
          );
          console.log(
            `[Subscription] Using ${filteredFallbacks.length} fallback plans for ${userRole}`,
          );
          setPlans(filteredFallbacks);
        }
        setMySubscription(subData);
      } catch (err) {
        console.warn("[Subscription] API not reachable, using static plans");
        const user = JSON.parse(localStorage.getItem("user") || "null");
        const role = normalizeRole(user?.user_type || "student");
        setPlans(
          FALLBACK_PLANS.filter(
            (p) => p.target_role === role || p.target_role === "all",
          ),
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getPrice = (plan) => {
    const base = parseFloat(plan.price || 0);
    if (billingCycle === "quarterly") return Math.round(base * 3 * 0.85); // 15% discount
    return Math.round(base);
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

      // Guard: allow if it's a numeric ID (Strapi), documentId (Strapi 5),
      // or a string ID (our professional fallback plans)
      const isValidPlan =
        selectedPlan.documentId ||
        typeof selectedPlan.id === "number" ||
        (typeof selectedPlan.id === "string" && selectedPlan.id.length > 0);

      if (isValidPlan) {
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
      } else {
        // Fallback for truly unknown plans
        alert(
          `ℹ️ Configuration requise : Le plan ${selectedPlan.name} n'est pas encore prêt. Veuillez contacter l'administrateur.`,
        );
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
          ? "w-full overflow-x-hidden"
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
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 text-center mt-4 mb-10">
        <div className="flex flex-wrap justify-center gap-2 bg-white/80 backdrop-blur border border-slate-200 rounded-[2rem] p-2 shadow-lg w-fit mx-auto">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all ${billingCycle === "monthly" ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBillingCycle("quarterly")}
            className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${billingCycle === "quarterly" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}
          >
            Trimestriel
            <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-black">
              -15%
            </span>
          </button>
        </div>
      </div>

      {isInline === false && mySubscription && (
        <div className="max-w-xl mx-auto px-4 mb-8">
          <div
            className={`p-5 rounded-2xl flex items-center gap-4 border ${
              (mySubscription.attributes || mySubscription).status === "active"
                ? "bg-emerald-50 border-emerald-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <span className="text-2xl">
              {(mySubscription.attributes || mySubscription).status === "active"
                ? "✅"
                : "⏳"}
            </span>
            <div>
              <p
                className={`text-sm font-black ${
                  (mySubscription.attributes || mySubscription).status ===
                  "active"
                    ? "text-emerald-800"
                    : "text-amber-800"
                }`}
              >
                {(mySubscription.attributes || mySubscription).status ===
                "active"
                  ? "Abonnement actif"
                  : "Abonnement en attente de confirmation"}
              </p>
              <p
                className={`text-xs ${
                  (mySubscription.attributes || mySubscription).status ===
                  "active"
                    ? "text-emerald-600"
                    : "text-amber-600"
                }`}
              >
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
              onClick={() => {
                const userObj = JSON.parse(
                  localStorage.getItem("user") || "{}",
                );
                const role = userObj.user_type || "student";
                navigate(
                  role === "professional"
                    ? "/professional/subscription"
                    : `/${role}/dashboard`,
                );
              }}
              className={`ml-auto text-[10px] font-black uppercase hover:underline tracking-widest ${
                (mySubscription.attributes || mySubscription).status ===
                "active"
                  ? "text-emerald-700"
                  : "text-amber-700"
              }`}
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
            const sub = mySubscription?.attributes || mySubscription;
            const isCurrent =
              (sub?.plan?.data?.id || sub?.plan?.id) === plan.id;
            const hasActiveOrPending =
              sub?.status === "active" || sub?.status === "pending";

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
                      DT / {billingCycle === "monthly" ? "mois" : "trimestre"}
                    </span>
                  </div>
                  {billingCycle !== "monthly" && (
                    <p className="text-white/60 text-[10px] mt-2 font-bold tracking-tight">
                      soit environ {Math.round(getPrice(plan) / 3)} DT / mois
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
                      isCurrent ? navigate("/dashboard") : setSelectedPlan(plan)
                    }
                    disabled={
                      subscribing === plan.id ||
                      (hasActiveOrPending && !isCurrent)
                    }
                    className={`w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:grayscale-[0.5] ${isCurrent ? "bg-emerald-600 hover:bg-emerald-700" : colors.btn}`}
                  >
                    {subscribing === plan.id
                      ? "Traitement..."
                      : isCurrent
                        ? "Plan Actuel ✓"
                        : hasActiveOrPending
                          ? "Indisponible"
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
