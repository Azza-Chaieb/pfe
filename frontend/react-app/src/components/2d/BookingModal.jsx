import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/apiClient";
import { createReservation } from "../../services/bookingService";

/**
 * BookingModal Component - CLEAN & LOGICAL VERSION
 * Enforces a single submission to prevent redundant clicks.
 */
const BookingModal = ({ space, coworkingSpaceId, initialDate, onClose }) => {
  const [bookingLoading, setBookingLoading] = useState(false);
  const [existingReservations, setExistingReservations] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [equipmentQuantities, setEquipmentQuantities] = useState({});
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    participants: 1,
    date: initialDate || new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "18:00",
    allDay: false,
  });

  const navigate = useNavigate();
  const isSubmitting = useRef(false);

  // Fetch current reservations for the selected date
  useEffect(() => {
    if (!space?.id || !formData.date) return;
    const checkAvailability = async () => {
      setCheckingAvailability(true);
      try {
        const response = await api.get(
          `/reservations?filters[space][id][$eq]=${space.id}&filters[date][$eq]=${formData.date}&filters[status][$ne]=cancelled`
        );
        setExistingReservations(response.data?.data || []);
      } catch (err) {
        console.error("Availability check failed:", err);
      } finally {
        setCheckingAvailability(false);
      }
    };
    checkAvailability();
  }, [space?.id, formData.date]);

  if (!space) return null;
  const attrs = space.attributes || space;
  const equipmentsList = attrs.equipments?.data || attrs.equipments || [];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const updateEquipmentQuantity = (eqId, delta) => {
    setEquipmentQuantities((prev) => {
      const current = prev[eqId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [eqId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [eqId]: next };
    });
  };

  const handleBooking = async () => {
    // CRITICAL: Block any double-submission immediately
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setBookingLoading(true);

    try {
      const userString = localStorage.getItem("user");
      const user = userString ? JSON.parse(userString) : null;

      if (!user) {
        alert("Veuillez vous connecter pour réserver.");
        navigate("/login");
        setBookingLoading(false);
        isSubmitting.current = false;
        return;
      }

      const reservationData = {
        user: user.id,
        coworking_space: coworkingSpaceId,
        space: space.id,
        date: formData.date,
        time_slot: formData.allDay ? "Full Day" : `${formData.startTime} - ${formData.endTime}`,
        total_price: parseFloat(calculateTotalPrice()), // CRITICAL: Save price to DB
        extras: {
          equipments: equipmentQuantities,
          contact: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            participants: formData.participants,
          },
        },
      };

      console.log("[Booking] Logic: Requesting creation...");
      const response = await createReservation(reservationData);

      // LOGICAL SEQUENCE: Success -> Alert -> Redirect (Email is handled by backend)
      window.alert("Félicitations ! Votre réservation a été enregistrée avec succès. Vous allez recevoir un email de confirmation.");

      onClose();
      navigate(user.user_type === "professional" ? "/professional/bookings" : "/student/bookings");

    } catch (error) {
      console.error("Booking Error:", error.response?.data || error.message);
      const errorMsg = error.response?.data?.error?.message || "Une erreur est survenue lors de la réservation.";
      window.alert(`Oups ! ${errorMsg}`);

      // Let user retry if it was a real error
      setBookingLoading(false);
      isSubmitting.current = false;
    }
  };

  const hours = Array.from({ length: 15 }).map((_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);

  const calculateTotalPrice = () => {
    if (!attrs) return 0;

    // Ensure we have a valid date string
    const datePart = formData.date || new Date().toISOString().split("T")[0];
    const startStr = `${datePart}T${formData.startTime || "09:00"}:00`;
    const endStr = `${datePart}T${formData.endTime || "18:00"}:00`;

    const start = new Date(startStr);
    const end = new Date(endStr);

    let durationMs = 0;
    if (formData.allDay) {
      durationMs = 8 * 3600000; // 8 hours for a full day
    } else if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      durationMs = end.getTime() - start.getTime();
    }

    const durationHours = Math.max(0, durationMs / (1000 * 60 * 60));
    const durationDays = formData.allDay ? 1 : Math.ceil(durationHours / 24);

    let total = 0;

    // Base Space Price - handle potential string values from API
    const pHourly = parseFloat(attrs.pricing_hourly || 0);
    const pDaily = parseFloat(attrs.pricing_daily || 0);

    if (!formData.allDay && durationHours < 8 && pHourly > 0) {
      total += durationHours * pHourly;
    } else if (pDaily > 0) {
      total += durationDays * pDaily;
    } else if (pHourly > 0) {
      total += durationHours * pHourly;
    }

    // Equipment Price
    equipmentsList.forEach((eq) => {
      const eqAttrs = eq.attributes || eq;
      const qty = equipmentQuantities[eq.id] || 0;
      const pEq = parseFloat(eqAttrs.price || 0);
      if (qty > 0 && pEq > 0) {
        const pt = eqAttrs.price_type || "one-time";
        if (pt === "hourly") total += durationHours * pEq * qty;
        else if (pt === "daily") total += durationDays * pEq * qty;
        else total += pEq * qty;
      }
    });

    console.log(`[Booking] Calculated Price: ${total}, Hours: ${durationHours}`);
    return total.toFixed(2);
  };

  const hasConflict = !formData.allDay && existingReservations.some(res => {
    const slotStr = res.attributes?.time_slot || res.time_slot || "";
    if (slotStr === "Full Day") return true;

    const [resStart, resEnd] = slotStr.split(' - ');
    if (!resStart || !resEnd) return false;

    const sA = parseInt(formData.startTime.replace(':', ''));
    const eA = parseInt(formData.endTime.replace(':', ''));
    const sB = parseInt(resStart.replace(':', ''));
    const eB = parseInt(resEnd.replace(':', ''));
    return sA < eB && sB < eA;
  }) || (formData.allDay && existingReservations.length > 0);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 scroll-smooth">
      <div className="bg-white w-full max-w-6xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[95vh] relative animate-in zoom-in duration-300">

        <button onClick={onClose} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-all z-20 p-2 hover:bg-slate-100 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Info Column */}
        <div className="flex-1 p-12 overflow-y-auto bg-white border-r border-slate-100">
          <header className="mb-10">
            <h2 className="text-4xl font-black text-slate-900 mb-3 uppercase tracking-tighter">{attrs.name}</h2>
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-black text-slate-400 tracking-widest uppercase">
              <span className="flex items-center gap-1.5">👤 MAX {attrs.capacity || 20}</span>
              <span className="flex items-center gap-1.5 text-emerald-600">💰 {attrs.pricing_hourly}DT/H · {attrs.pricing_daily}DT/JOUR</span>
            </div>
          </header>

          <section className="mb-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Description</h4>
            <div className="bg-slate-50 p-6 rounded-[1.5rem] text-sm text-slate-600 leading-relaxed italic">
              {attrs.description || "Un espace de travail moderne parfaitement équipé."}
            </div>
          </section>

          <section className="mb-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Équipements</h4>
            <div className="grid grid-cols-1 gap-2">
              {equipmentsList.length > 0 ? equipmentsList.map((eq) => {
                const id = eq.id;
                const qty = equipmentQuantities[id] || 0;
                return (
                  <div key={id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${qty > 0 ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100"}`}>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">{eq.attributes?.name || eq.name}</span>
                      <span className="text-[10px] text-emerald-600 font-black uppercase">
                        {eq.attributes?.price || eq.price}DT
                        {eq.attributes?.price_type === 'hourly' ? '/H' : eq.attributes?.price_type === 'daily' ? '/JOUR' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => updateEquipmentQuantity(id, -1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-black">-</button>
                      <span className="text-sm font-black text-emerald-600">{qty}</span>
                      <button onClick={() => updateEquipmentQuantity(id, 1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-black">+</button>
                    </div>
                  </div>
                );
              }) : <span className="text-xs italic text-slate-400">Aucun équipement disponible.</span>}
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coordonnées</h4>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Nom Complet" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" />
              <input type="email" placeholder="Email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" />
              <input type="tel" placeholder="Téléphone" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" />
              <input type="number" placeholder="Personnes" name="participants" value={formData.participants} onChange={handleInputChange} className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm font-black text-emerald-800" />
            </div>
          </section>
        </div>

        {/* Selection Column */}
        <div className="w-full md:w-[480px] p-12 bg-slate-50/50 overflow-y-auto">
          <section className="mb-10">
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xl">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-4">Février 2026</p>
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {Array.from({ length: 28 }).map((_, i) => {
                  const day = i + 1;
                  const dStr = `2026-02-${day.toString().padStart(2, "0")}`;
                  return (
                    <button key={day} onClick={() => setFormData(p => ({ ...p, date: dStr }))} className={`h-10 rounded-xl text-[10px] font-black transition-all ${formData.date === dStr ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-slate-600 hover:bg-slate-100"}`}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="mb-10 space-y-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" name="allDay" checked={formData.allDay} onChange={handleInputChange} className="hidden" />
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.allDay ? "bg-blue-600 border-blue-600" : "border-slate-200 bg-white"}`}>
                {formData.allDay && <span className="text-white text-xs font-black">✓</span>}
              </div>
              <span className="text-[11px] font-black uppercase text-slate-600">Toute la journée</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, startTime: "09:00", endTime: "13:00", allDay: false }))}
                className="py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 transition-all"
              >
                Matinée (9h-13h)
              </button>
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, startTime: "14:00", endTime: "18:00", allDay: false }))}
                className="py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 transition-all"
              >
                Après-midi (14h-18h)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <select name="startTime" value={formData.startTime} onChange={handleInputChange} disabled={formData.allDay} className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold">
                {hours.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <select name="endTime" value={formData.endTime} onChange={handleInputChange} disabled={formData.allDay} className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold">
                {hours.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </section>

          <div className="mb-6 p-6 bg-blue-50 border border-blue-100 rounded-[2rem] flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Estimé</p>
              <h3 className="text-2xl font-black text-blue-600">{calculateTotalPrice()} DT</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TVA Incluse</p>
              <p className="text-[9px] font-bold text-slate-400 italic">Paiement sur place</p>
            </div>
          </div>

          <button onClick={handleBooking} disabled={bookingLoading || hasConflict} className={`w-full py-6 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-[1.5rem] shadow-2xl transition-all ${bookingLoading || hasConflict ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-500/30"}`}>
            {bookingLoading ? "VALIDATION..." : hasConflict ? "NON DISPONIBLE" : "CONFIRMER LA RÉSERVATION"}
          </button>

          <p className="mt-6 text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            * En cliquant sur confirmer, vous bloquez cet espace et recevez un email de confirmation instantanément.

          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
