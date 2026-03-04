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
    ? new Date(subAttrs.end_date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const credits = subAttrs?.remaining_credits ?? 0;
  const isActive = subAttrs?.status === "active";
  const isPending = subAttrs?.status === "pending";
  const isCancelled = subAttrs?.status === "cancelled";
  const isCash = subAttrs?.payment_method === "cash";

  const [timeLeft, setTimeLeft] = useState("");
  const [showPlans, setShowPlans] = useState(false);

  // If no subscription at all, we should probably show plans by default or a prompt
  const hasAnySub = !!subscription;

  useEffect(() => {
    const updateCountdown = () => {
      let target;
      if (isPending && isCash && subAttrs?.payment_deadline) {
        target = new Date(subAttrs.payment_deadline).getTime();
      } else if (isActive && subAttrs?.end_date) {
        target = new Date(subAttrs.end_date).getTime();
      }

      if (!target) return;

      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("Expiré");
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}j ${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [
    isActive,
    isPending,
    isCash,
    subAttrs?.payment_deadline,
    subAttrs?.end_date,
  ]);

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
            {planAttrs?.name
              ? `Mon Abonnement ${planAttrs.name}`
              : "Mon Abonnement"}{" "}
            💎
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {isActive
              ? "Profitez pleinement de vos avantages SunSpace."
              : isPending
                ? "Nous validons votre accès très prochainement."
                : isCancelled
                  ? "Votre dernière demande a été refusée."
                  : "Choisissez un forfait pour commencer."}
          </p>
        </div>
      </div>

      {showPlans ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800">Nos Offres 💎</h3>
            <button
              onClick={() => setShowPlans(false)}
              className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← Retour
            </button>
          </div>
          <div className="bg-white/30 backdrop-blur-xl border border-white/60 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <SubscriptionPlans isInline={true} />
          </div>
        </div>
      ) : (isActive || isPending) && planAttrs ? (
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
              <div className="flex flex-col gap-2">
                {isActive && (
                  <div className="bg-white/20 rounded-2xl px-4 py-2 text-center border border-white/10 backdrop-blur-sm min-w-[100px]">
                    <p className="text-[8px] font-black text-white/70 uppercase tracking-widest mb-1">
                      Expire dans
                    </p>
                    <p className="text-sm font-black text-white tabular-nums">
                      {timeLeft}
                    </p>
                  </div>
                )}
                {!isPending && (
                  <div className="bg-white/20 rounded-2xl p-4 text-center border border-white/10 backdrop-blur-sm">
                    <p className="text-2xl font-black">{credits}</p>
                    <p className="text-[9px] font-black uppercase opacity-70">
                      crédits restants
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-8 flex gap-3 relative z-20">
              <button
                onClick={() => setShowPlans(true)}
                className="flex-1 py-3 bg-white/20 border border-white/30 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/30 transition-all shadow-sm"
              >
                {isPending ? "Voir les autres plans" : "Changer de forfait"}
              </button>
              {isPending && (
                <button
                  onClick={onCancel}
                  className="px-5 py-3 bg-red-500/20 border border-red-300/30 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500/30 transition-all shadow-sm"
                >
                  Annuler demande
                </button>
              )}
            </div>
            {!isPending && (
              <div className="mt-6 pt-6 border-t border-white/10 text-center relative z-20">
                <button
                  onClick={() => setShowPlans(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                >
                  Découvrir toutes nos offres →
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "Cycle de facturation",
                value:
                  subAttrs?.billing_cycle === "yearly"
                    ? "Annuel"
                    : subAttrs?.billing_cycle === "quarterly"
                      ? "Trimestriel"
                      : "Mensuel",
                icon: "🗓️",
              },
              {
                label: "Crédits consommés",
                value: `${(planAttrs?.max_credits || 0) - credits} / ${planAttrs?.max_credits || 0}`,
                icon: "🎯",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/40 backdrop-blur border border-white/60 rounded-2xl p-5 text-center transition-all hover:bg-white/60"
              >
                <p className="text-2xl mb-2">{item.icon}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {item.label}
                </p>
                <p className="text-sm font-black text-slate-700 mt-1 uppercase">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : isCancelled ? (
        <div className="bg-red-50 border border-red-200 rounded-[2.5rem] p-10 text-center shadow-xl animate-fade-in">
          <div className="text-5xl mb-4">🚫</div>
          <h3 className="text-2xl font-black text-red-800 mb-2">
            Abonnement refusé ou supprimé
          </h3>
          <p className="text-red-600/70 text-sm mb-8 font-medium">
            Votre demande d'abonnement au plan{" "}
            <b className="text-red-800">{planName}</b> a été refusée par
            l'administrateur ou a expiré.
          </p>
          <button
            onClick={() => setShowPlans(true)}
            className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-red-700 transition-all"
          >
            Voir nos abonnements 💳
          </button>
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
            Visualiser nos abonnements 💳
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionSection;
