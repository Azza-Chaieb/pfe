import React, { useState, useEffect } from "react";

const PendingPaymentBanner = ({ bookings = [] }) => {
    // Filter for bookings that are "pending" and "on_site"
    const pendingOnSiteBookings = bookings
        .filter(
            (b) => {
                const status = b.status || b.attributes?.status;
                const method = b.payment_method || b.attributes?.payment_method;
                return status === "pending" && method === "on_site";
            }
        )
        .sort((a, b) => {
            const deadlineA = new Date(a.payment_deadline || a.attributes?.payment_deadline || 0).getTime();
            const deadlineB = new Date(b.payment_deadline || b.attributes?.payment_deadline || 0).getTime();
            return deadlineA - deadlineB;
        });

    console.log("[Banner] Pending On-Site Bookings found:", pendingOnSiteBookings.length);
    if (pendingOnSiteBookings.length > 0) {
        console.log("[Banner] Next deadline:", pendingOnSiteBookings[0].payment_deadline);
    }

    const nextBooking = pendingOnSiteBookings[0];
    const [timeLeft, setTimeLeft] = useState("Calcul...");

    useEffect(() => {
        if (!nextBooking) return;

        const deadlineStr = nextBooking.payment_deadline || nextBooking.attributes?.payment_deadline;
        if (!deadlineStr) {
            setTimeLeft("En attente...");
            return;
        }

        const target = new Date(deadlineStr).getTime();

        const updateCountdown = () => {
            const now = new Date().getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft("Expiré");
            } else {
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            }
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    }, [nextBooking]);

    if (!nextBooking) return null;

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 mb-8 flex items-center justify-between animate-fade-in shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
            <div className="flex items-center gap-5">
                <div className="text-4xl animate-pulse-subtle">⏳</div>
                <div>
                    <h4 className="font-black text-amber-900 text-sm uppercase tracking-tight">
                        Paiement en attente
                    </h4>
                    <p className="text-[11px] text-amber-700 font-medium">
                        Votre réservation pour <span className="font-bold text-amber-900">{nextBooking.spaceName || "l'espace"}</span> sera confirmée dès réception du paiement sur place.
                    </p>
                </div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm px-5 py-2 rounded-2xl border border-amber-100 shadow-inner">
                <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1 text-center">
                    Temps restant
                </p>
                <p className="text-2xl font-black text-amber-700 tabular-nums min-w-[120px] text-center">
                    {timeLeft}
                </p>
            </div>
        </div>
    );
};

export default PendingPaymentBanner;
