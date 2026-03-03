import React, { useState, useEffect } from "react";
import SubscriptionPlans from "../../pages/public/SubscriptionPlans";

const SubscriptionSection = ({ subscription, onCancel, onNavigateToPlans }) => {
  const subAttrs = subscription
    ? subscription.attributes || subscription
    : null;
  const planAttrs = subAttrs?.plan?.data?.attributes || subAttrs?.plan || null;
  const planName = planAttrs?.name || "Aucun plan";
  const planType = planAttrs?.type || "basic";
  const endDate = subAttrs?.end_date
    ? new Date(subAttrs.end_date).toLocaleDateString("fr-FR")
    : null;
  const credits = subAttrs?.remaining_credits ?? 0;
  const isActive = subAttrs?.status === "active";
  const isPending = subAttrs?.status === "pending";
  const isCash = subAttrs?.payment_method === "cash";

  const [timeLeft, setTimeLeft] = useState("");
  const [showPlans, setShowPlans] = useState(false);

  // If no subscription at all, we should probably show plans by default or a prompt
  const hasAnySub = !!subscription;

  useEffect(() => {
    if (isPending && isCash && subAttrs?.payment_deadline) {
      const timer = setInterval(() => {
        const deadline = new Date(subAttrs.payment_deadline).getTime();
        const now = new Date().getTime();
        const diff = deadline - now;

        if (diff <= 0) {
          setTimeLeft("Expiré");
          clearInterval(timer);
        } else {
          const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          );
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isPending, isCash, subAttrs?.payment_deadline]);

  const planColors = {
    basic: "from-slate-600 to-slate-800",
    premium: "from-blue-600 to-indigo-800",
    enterprise: "from-amber-500 to-orange-700",
  };
  const gradient = planColors[planType] || planColors.basic;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
            Mon Abonnement 💎
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Gérez votre plan et vos avantages SunSpace.
          </p>
        </div>
      </div>

      {(isActive || isPending) && planAttrs && !showPlans ? (
        <>
          {isPending && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 mb-8 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-4">
                <span className="text-3xl">⏳</span>
                <div>
                  <h4 className="font-black text-amber-800 text-sm uppercase tracking-tight">
                    Paiement en attente
                  </h4>
                  <p className="text-xs text-amber-600 font-medium">
                    Votre abonnement au plan{" "}
                    <b className="text-amber-700">{planName}</b> sera activé dès
                    réception du paiement.
                  </p>
                </div>
              </div>
              {isCash && (
                <div className="text-right">
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">
                    Temps restant
                  </p>
                  <p className="text-xl font-black text-amber-700 tabular-nums">
                    {timeLeft}
                  </p>
                </div>
              )}
            </div>
          )}
          <div
            className={`rounded-[2.5rem] bg-gradient-to-br ${gradient} p-8 text-white shadow-2xl relative overflow-hidden`}
          >
            {isPending && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                <div className="bg-white/10 border border-white/20 px-6 py-2 rounded-full backdrop-blur-md">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    En attente de validation
                  </span>
                </div>
              </div>
            )}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-70">
                  Plan Actuel
                </span>
                <h2 className="text-3xl font-black mt-1">{planName}</h2>
                <p className="text-white/70 text-sm mt-1">
                  {isPending
                    ? "En attente d'activation"
                    : `Expire le ${endDate}`}
                </p>
              </div>
              {!isPending && (
                <div className="bg-white/20 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black">{credits}</p>
                  <p className="text-[9px] font-black uppercase opacity-70">
                    crédits restants
                  </p>
                </div>
              )}
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowPlans(true)}
                className="flex-1 py-3 bg-white/20 border border-white/30 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/30 transition-all"
              >
                Changer de plan
              </button>
              <button
                onClick={onCancel}
                className="px-5 py-3 bg-red-500/20 border border-red-300/30 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500/30 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>

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
                value: isPending
                  ? "Paiement en attente"
                  : subAttrs?.status || "Inactif",
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
        </>
      ) : showPlans || !hasAnySub ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800">Nos Offres 💎</h3>
            {hasAnySub && (
              <button
                onClick={() => setShowPlans(false)}
                className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600"
              >
                ← Retour
              </button>
            )}
          </div>
          <div className="bg-white/30 backdrop-blur-xl border border-white/60 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <SubscriptionPlans isInline={true} />
          </div>
        </div>
      ) : (
        <div className="bg-white/40 backdrop-blur border border-white/60 rounded-[2.5rem] p-10 text-center shadow-xl">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">
            Aucun abonnement actif
          </h3>
          <p className="text-slate-400 text-sm mb-8">
            Choisissez un plan adapté à vos besoins pour profiter de tous nos
            services.
          </p>
          <button
            onClick={() => setShowPlans(true)}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
          >
            Voir les plans 💳
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionSection;
