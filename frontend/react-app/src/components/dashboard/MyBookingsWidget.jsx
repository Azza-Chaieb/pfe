import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { downloadInvoice, getBookingById } from "../../services/bookingService";
import { getSpaceById } from "../../services/spaceService";
import BookingModal from "../2d/BookingModal";

const MyBookingsWidget = ({ bookings = [], onSeeAll, fullPage = false }) => {
  const navigate = useNavigate();
  const [firstSpaceDocId, setFirstSpaceDocId] = useState(null);
  const [activeTab, setActiveTab] = useState("current"); // "current" | "history"
  const [downloading, setDownloading] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [spaceForBooking, setSpaceForBooking] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  useEffect(() => {
    if (fullPage) {
      // Pre-fetch the first coworking space so we can navigate directly to 3D
      api
        .get("/coworking-spaces?pagination[pageSize]=1")
        .then((res) => {
          const first = res.data?.data?.[0];
          if (first) setFirstSpaceDocId(first.documentId || first.id);
        })
        .catch(() => { });
    }
  }, [fullPage]);

  const handleExplore = () => {
    if (firstSpaceDocId) {
      navigate(`/explore/${firstSpaceDocId}`);
    } else {
      navigate("/spaces");
    }
  };

  // Filtrage basé sur la date et le statut
  const now = new Date();

  const currentBookings = bookings.filter((b) => {
    if (b.status === "cancelled" || b.status === "history" || b.status === "completed") return false;

    // Pour les réservations en attente, on regarde le délai de paiement
    const isConfirmed = b.status === "confirmed" || b.status === "past" || b.status === "history" || b.status === "completed";
    if (!isConfirmed) {
      if (b.payment_deadline) {
        if (new Date(b.payment_deadline) > now) return true;
        return false; // Délai expiré
      }
    }

    // Sinon, on regarde l'heure de fin de la réservation
    if (b.rawEndDate) {
      if (new Date(b.rawEndDate) < now) return false;
    }
    return true;
  });

  const historyBookings = bookings.filter((b) => {
    if (b.status === "cancelled" || b.status === "history" || b.status === "completed") return true;

    const isConfirmed = b.status === "confirmed" || b.status === "past" || b.status === "history" || b.status === "completed";
    if (!isConfirmed) {
      if (b.payment_deadline) {
        if (new Date(b.payment_deadline) < now) return true;
        return false; // Pas encore expiré
      }
    }

    if (b.rawEndDate) {
      if (new Date(b.rawEndDate) < now) return true;
    }
    return false;
  });

  const displayBookings =
    activeTab === "current" ? currentBookings : historyBookings;

  const handleDownloadInvoice = async (bookingId, dateStr) => {
    try {
      setDownloading(bookingId);
      const safeDate = dateStr.replace(/[^a-zA-Z0-9]/g, "-");
      await downloadInvoice(
        bookingId,
        `facture-reservation-${bookingId}-${safeDate}.pdf`,
      );
    } catch (err) {
      console.error("Erreur lors du téléchargement:", err);
      alert("Impossible de télécharger la facture.");
    } finally {
      setDownloading(null);
    }
  };

  const handleModify = async (booking) => {
    try {
      setLoadingEdit(true);
      // Fetch full booking details to ensure we have all extras/equipments/services
      // CRITICAL: Strapi v5 requires documentId for lookups
      const lookupId = booking.documentId || booking.id;
      const fullBooking = await getBookingById(lookupId);
      const bData = fullBooking.data || fullBooking;

      // Extract space ID from the booking
      const attrs = bData.attributes || bData;
      const spaceObj = attrs.space?.data || attrs.space || booking.space?.data || booking.space;
      const sId = spaceObj?.documentId || spaceObj?.id || attrs.extras?.spaceId || booking.extras?.spaceId || booking.spaceId;

      console.log("[MyBookingsWidget] handleModify - bData:", bData, "sId found:", sId);

      // Defensive Fix: If getBookingById Stage 4/5 worked, we might ALREADY have the hydrated space
      const fullSpaceFromBooking = attrs.space?.data || attrs.space;
      const hasDeepData = fullSpaceFromBooking?.attributes?.pricing_hourly || fullSpaceFromBooking?.pricing_hourly;

      if (!sId && !hasDeepData) {
        console.error("No space ID found for booking details:", bData, "Original booking:", booking);
        // Fallback: try to find space name in extras if documentId is missing
        if (attrs.extras?.spaceName || booking.spaceName) {
          setSpaceForBooking({ attributes: { name: attrs.extras?.spaceName || booking.spaceName } });
        } else {
          alert("Impossible de charger les détails de l'espace (ID manquant).");
          setLoadingEdit(false);
          return;
        }
      } else {
        try {
          // Attempt to fetch fresh/full space details
          let fullSpace;
          if (sId) {
            try {
              const spaceRes = await getSpaceById(sId);
              fullSpace = spaceRes?.data || spaceRes;
            } catch (innerErr) {
              console.warn("[MyBookingsWidget] Space API fetch failed, will attempt fallback.", innerErr);
            }
          }

          // FINAL RESILIENT FALLBACK: 
          // 1. If API gave us good data, use it.
          // 2. If API failed or gave shallow data, and we have deep data in booking, use booking data.
          // 3. If everything is shallow, use the booking data anyway (better than nothing).

          const apiHasPricing = fullSpace?.attributes?.pricing_hourly || fullSpace?.pricing_hourly;

          if (apiHasPricing) {
            console.log("[MyBookingsWidget] Using fresh space data from API.");
            setSpaceForBooking(fullSpace);
          } else if (hasDeepData) {
            console.log("[MyBookingsWidget] Using deep space data from booking record.");
            setSpaceForBooking(fullSpaceFromBooking);
          } else if (fullSpace || fullSpaceFromBooking) {
            console.warn("[MyBookingsWidget] Using shallow space data (last resort).");
            setSpaceForBooking(fullSpace || fullSpaceFromBooking);
          } else {
            // Fallback to name only if we have it
            setSpaceForBooking({ attributes: { name: attrs.extras?.spaceName || booking.spaceName || "Espace inconnu" } });
          }
        } catch (spaceErr) {
          console.error("Critical error in handleModify logic:", spaceErr);
          // Last last resort
          setSpaceForBooking(fullSpaceFromBooking || { attributes: { name: "Espace" } });
        }
      }

      setEditingBooking(bData);
    } catch (err) {
      console.error("Error preparing edit mode:", err);
      alert("Erreur lors de la préparation de la modification.");
    } finally {
      setLoadingEdit(false);
    }
  };



  return (
    <div
      className={`bg-white/80 backdrop-blur-md p-6 rounded-2xl ${fullPage ? "" : "shadow-xl border border-white/20"}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          📍 {fullPage ? "Gestion de mes réservations" : "Mes Réservations"}
        </h3>
        {!fullPage && onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-[10px] font-black uppercase text-emerald-600 tracking-widest hover:underline"
          >
            Historique complet →
          </button>
        )}
      </div>

      {fullPage && (
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl w-max mb-6">
          <button
            onClick={() => setActiveTab("current")}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === "current"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
              }`}
          >
            En cours ({currentBookings.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === "history"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
              }`}
          >
            Archives ({historyBookings.length})
          </button>
        </div>
      )}

      <div
        className={`grid grid-cols-1 ${fullPage ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-1 lg:grid-cols-2"} gap-4`}
      >
        {displayBookings.length > 0 ? (
          displayBookings.map((booking) => (
            <div
              key={booking.id}
              className={`p-4 rounded-xl border transition-all ${booking.status === "cancelled"
                ? "bg-slate-50 border-slate-200 grayscale-[0.5] opacity-80"
                : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-sm hover:shadow-md"
                }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="font-bold text-blue-800 flex-1">
                  {booking.spaceName}
                </div>
                <div className="text-[10px] font-black text-slate-900 bg-white/60 px-2 py-0.5 rounded-md border border-white/40">
                  {Number(booking.totalPrice || 0).toFixed(2)} DT
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="opacity-60">📅</span> {booking.date}
                </div>
                <span
                  className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${(() => {
                    if (booking.status === "cancelled") return "bg-slate-200 text-slate-600";

                    const isConfirmed = booking.status === "confirmed" || booking.status === "completed" || booking.status === "past" || booking.status === "history";
                    const isPending = !isConfirmed;

                    if (isPending) {
                      const deadlinePassed = booking.payment_deadline && new Date(booking.payment_deadline) < now;
                      if (deadlinePassed) return "bg-slate-200 text-slate-600";
                      return "bg-orange-100 text-orange-600";
                    } else {
                      const timePassed = booking.rawEndDate && new Date(booking.rawEndDate) < now;
                      if (timePassed) return "bg-slate-200 text-slate-600";
                      return "bg-emerald-100 text-emerald-600";
                    }
                  })()}`}
                >
                  {(() => {
                    if (booking.status === "cancelled") return "Annulé";

                    const isConfirmed = booking.status === "confirmed" || booking.status === "completed" || booking.status === "past" || booking.status === "history";
                    const isPending = !isConfirmed;

                    if (isPending) {
                      const deadlinePassed = booking.payment_deadline && new Date(booking.payment_deadline) < now;
                      return deadlinePassed ? "Date expirée" : "Attente";
                    } else {
                      const timePassed = booking.rawEndDate && new Date(booking.rawEndDate) < now;
                      return timePassed ? "Terminé" : "Confirmé";
                    }
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-[10px] px-2.5 py-1 bg-white text-blue-700 rounded-full font-black uppercase border border-blue-50 shadow-sm">
                  {booking.time || `${booking.startTime} - ${booking.endTime}`}
                </span>

                <div className="flex items-center gap-2">
                  {(booking.status === "confirmed" || booking.status === "completed") && (
                    <button
                      onClick={() =>
                        handleDownloadInvoice(booking.id, booking.date)
                      }
                      disabled={downloading === booking.id}
                      className="text-[10px] font-black uppercase text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-sm"
                    >
                      {downloading === booking.id ? "⏳..." : "📄 Facture"}
                    </button>
                  )}
                  {(() => {
                    const isConfirmed =
                      booking.status === "confirmed" ||
                      booking.status === "completed" ||
                      booking.status === "past" ||
                      booking.status === "history";
                    const isPending = !isConfirmed && booking.status !== "cancelled";
                    const deadlinePassed =
                      booking.payment_deadline &&
                      new Date(booking.payment_deadline) < now;

                    if (isPending && !deadlinePassed) {
                      return (
                        <button
                          onClick={() => handleModify(booking)}
                          disabled={loadingEdit}
                          className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 hover:bg-emerald-100 transition-colors shadow-sm"
                        >
                          {loadingEdit ? "..." : "Modifier"}
                        </button>
                      );
                    }
                    return null;
                  })()}
                  <button
                    onClick={() =>
                      alert(
                        `Détails de la réservation pour : ${booking.spaceName}\n` +
                        `Date : ${booking.date}\n` +
                        `Heure : ${booking.time}\n` +
                        (booking.equipmentNames
                          ? `Équipements : ${booking.equipmentNames}\n`
                          : "") +
                        (booking.serviceNames
                          ? `Services : ${booking.serviceNames}`
                          : ""),
                      )
                    }
                    className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-800 tracking-widest underline decoration-2 underline-offset-4 decoration-blue-200 ml-1"
                  >
                    Détails
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic col-span-full py-4 text-center">
            Aucun espace réservé actuellement.
          </p>
        )}
      </div>

      {fullPage && (
        <div className="mt-10 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 text-center">
          <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mb-4">
            Besoin d'un nouvel espace ?
          </p>
          <button
            onClick={handleExplore}
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:scale-[1.02] transition-all"
          >
            🧊 Explorer le catalogue 3D
          </button>
        </div>
      )}


      {editingBooking && spaceForBooking && (
        <BookingModal
          space={spaceForBooking}
          editingBooking={editingBooking}
          onClose={() => {
            setEditingBooking(null);
            setSpaceForBooking(null);
          }}
        />
      )}
    </div>
  );
};

export default MyBookingsWidget;
