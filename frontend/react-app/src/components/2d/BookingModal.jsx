import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createReservation } from "../../services/bookingService";

/**
 * BookingModal Component
 * Matches the design requested by the Product Owner and makes all fields functional.
 */
const BookingModal = ({ space, coworkingSpaceId, onClose }) => {
  const [bookingLoading, setBookingLoading] = useState(false);
  const [equipmentQuantities, setEquipmentQuantities] = useState({});
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    participants: 1,
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "18:00",
    allDay: false,
  });

  const navigate = useNavigate();

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
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Veuillez vous connecter pour réserver.");
      navigate("/login");
      return;
    }

    if (!formData.fullName || !formData.email || !formData.phone) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setBookingLoading(true);
    try {
      const reservationData = {
        user: user.id,
        coworking_space: coworkingSpaceId,
        space: space.id,
        date: formData.date,
        time_slot: formData.allDay
          ? "Full Day"
          : `${formData.startTime} - ${formData.endTime}`,
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

      await createReservation(reservationData);
      alert("Réservation réussie !");
      onClose();
      navigate(
        user.user_type === "professional"
          ? "/professional/bookings"
          : "/student/bookings",
      );
    } catch (error) {
      console.error("Booking error:", error);
      alert("Erreur lors de la réservation.");
    } finally {
      setBookingLoading(false);
    }
  };

  // Generate time options
  const hours = Array.from({ length: 15 }).map((_, i) => {
    const h = (i + 8).toString().padStart(2, "0");
    return `${h}:00`;
  });

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] relative animate-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Left Column */}
        <div className="flex-1 p-8 overflow-y-auto border-r border-slate-100">
          <header className="mb-8">
            <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tight">
              {attrs.name}
            </h2>
            <div className="flex items-center gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                👤 Max {attrs.capacity || 20} personnes
              </span>
              <span className="flex items-center gap-1">📍 Localisation</span>
              <span className="flex items-center gap-1">
                💰 {attrs.pricing_hourly || 10}DT/h ·{" "}
                {attrs.pricing_daily || 45}DT/jour
              </span>
            </div>
          </header>

          <section className="mb-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Description
            </h4>
            <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 leading-relaxed border border-slate-100">
              {attrs.description || "Espace de travail moderne et lumineux."}
            </div>
          </section>

          <section className="mb-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Equipements disponibles
            </h4>
            <div className="flex flex-col gap-3">
              {equipmentsList.length > 0 ? (
                equipmentsList.map((eq) => {
                  const id = eq.id;
                  const qty = equipmentQuantities[id] || 0;
                  return (
                    <div
                      key={id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        qty > 0
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-700">
                        {eq.attributes?.name || eq.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateEquipmentQuantity(id, -1)}
                          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-colors shadow-sm"
                        >
                          -
                        </button>
                        <span className="text-xs font-black min-w-[20px] text-center text-emerald-600">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateEquipmentQuantity(id, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-colors shadow-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <span className="text-[10px] text-slate-400 italic font-medium">
                  Aucun équipement spécifique.
                </span>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                Informations de contact
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">
                  Nom complet *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder=""
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder=""
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder=""
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">
                  Nombre de participants *
                </label>
                <input
                  type="number"
                  name="participants"
                  value={formData.participants}
                  onChange={handleInputChange}
                  min="1"
                  max={attrs.capacity || 20}
                  className="w-full bg-slate-100 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-emerald-800"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="w-full md:w-[420px] p-8 bg-slate-50/50 overflow-y-auto">
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-400"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                Sélectionner une date
              </h4>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-sm font-black text-slate-800">
                  Février 2026
                </span>
                <div className="flex gap-2">
                  <button className="text-slate-400 hover:text-slate-600">
                    ‹
                  </button>
                  <button className="text-slate-400 hover:text-slate-600">
                    ›
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {["lun", "mar", "mer", "jeu", "ven", "sam", "dim"].map((d) => (
                  <span
                    key={d}
                    className="text-[8px] font-black text-slate-400 uppercase"
                  >
                    {d}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: 28 }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `2026-02-${day.toString().padStart(2, "0")}`;
                  const isSelected = formData.date === dateStr;
                  const isToday = day === 17;
                  return (
                    <button
                      key={day}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, date: dateStr }))
                      }
                      className={`h-8 rounded-lg text-[10px] font-bold transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-lg"
                          : isToday
                            ? "bg-emerald-100 text-emerald-700"
                            : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-[10px] font-bold text-blue-500 italic uppercase">
                  {new Date(formData.date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-[9px] font-medium text-slate-400">
                  {formData.date === "2026-02-17"
                    ? "Aujourd'hui"
                    : "Date sélectionnée"}
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-400"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                Sélectionner l'horaire
              </h4>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="allDayCheckbox"
                name="allDay"
                checked={formData.allDay}
                onChange={handleInputChange}
                className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="allDayCheckbox"
                className="text-[10px] font-bold text-slate-400 cursor-pointer"
              >
                Réserver toute la journée (08:00 - 18:00)
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase">
                  Heure de début
                </label>
                <select
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  disabled={formData.allDay}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 focus:outline-none appearance-none font-medium"
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase">
                  Heure de fin
                </label>
                <select
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  disabled={formData.allDay}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 focus:outline-none appearance-none font-medium"
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <button
            onClick={handleBooking}
            disabled={bookingLoading}
            className={`w-full py-5 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-[0.98] ${
              bookingLoading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
            }`}
          >
            {bookingLoading ? "Réservation en cours..." : "Réserver l'Espace"}
          </button>
          <p className="text-center text-[8px] text-slate-400 font-medium italic mt-4">
            * Tous les champs sont obligatoires
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
