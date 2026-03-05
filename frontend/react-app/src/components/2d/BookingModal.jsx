import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/apiClient";
import {
  createReservation,
  createPayment,
  submitPaymentProof,
} from "../../services/bookingService";
import { getMySubscription } from "../../services/subscriptionService";
import {
  getEquipmentAvailability,
  lockEquipment,
  unlockEquipment,
} from "../../services/equipmentService";
import PaymentSelector from "../payment/PaymentSelector";

/**
 * BookingModal Component - CLEAN & LOGICAL VERSION
 * Enforces a single submission to prevent redundant clicks.
 */
const BookingModal = ({
  space,
  coworkingSpaceId,
  initialDate,
  initialChairId,
  onClose,
}) => {
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [createdReservation, setCreatedReservation] = useState(null);
  const [existingReservations, setExistingReservations] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

  const [selectedChair, setSelectedChair] = useState(
    initialChairId ? parseInt(initialChairId) : null,
  );
  const [occupiedChairs, setOccupiedChairs] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [equipmentQuantities, setEquipmentQuantities] = useState({});
  const [serviceQuantities, setServiceQuantities] = useState({});
  const [formData, setFormData] = useState({
    participants: 1,
    date: initialDate || new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "18:00",
    allDay: false,
  });
  const [dynamicAvailability, setDynamicAvailability] = useState({});
  const [isSyncingEquipments, setIsSyncingEquipments] = useState(false);

  const navigate = useNavigate();
  const isSubmitting = useRef(false);

  if (!space) return null;
  const attrs = space.attributes || space;
  const equipmentsList = attrs.equipments?.data || attrs.equipments || [];
  const servicesList = attrs.services?.data || attrs.services || [];

  // Sync Equipment Availability helper function
  const syncEquipmentAvailability = async () => {
    if (!space?.id || !formData.date) return;
    setIsSyncingEquipments(true);
    try {
      const startISO = `${formData.date}T${formData.startTime}:00.000Z`;
      const endISO = formData.allDay
        ? `${formData.date}T23:59:59.999Z`
        : `${formData.date}T${formData.endTime}:00.000Z`;

      const availabilityMap = {};
      for (const eq of equipmentsList) {
        const id = eq.id;
        const available = await getEquipmentAvailability(id, startISO, endISO);
        availabilityMap[id] = available;
      }
      setDynamicAvailability(availabilityMap);
    } catch (err) {
      console.error("Failed to sync equipment availability:", err);
    } finally {
      setIsSyncingEquipments(false);
    }
  };

  // Effects
  useEffect(() => {
    // Initial sync and then set up interval
    syncEquipmentAvailability();

    const interval = setInterval(syncEquipmentAvailability, 10000);
    return () => clearInterval(interval);
  }, [
    formData.date,
    formData.startTime,
    formData.endTime,
    formData.allDay,
    equipmentsList.length,
  ]);

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const userString = localStorage.getItem("user");
        if (userString) {
          const user = JSON.parse(userString);
          setIsCheckingSubscription(true);
          const sub = await getMySubscription(user.id);
          setActiveSubscription(sub);
        }
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
      } finally {
        setIsCheckingSubscription(false);
      }
    };
    fetchSub();
  }, []);

  // Fetch current reservations for the selected date
  useEffect(() => {
    if (!space?.id || !formData.date) return;

    const checkAvailability = async () => {
      setCheckingAvailability(true);
      try {
        const startOfDay = `${formData.date}T00:00:00.000Z`;
        const endOfDay = `${formData.date}T23:59:59.999Z`;

        let idFilter = `filters[space][id][$eq]=${space.id}`;
        if (attrs._is_virtual && attrs._originalIds) {
          idFilter = attrs._originalIds
            .map((id, idx) => `filters[space][id][$in][${idx}]=${id}`)
            .join("&");
        }

        const response = await api.get(
          `/bookings?${idFilter}&filters[start_time][$lt]=${endOfDay}&filters[end_time][$gt]=${startOfDay}&filters[status][$ne]=cancelled`,
        );
        const resList = response.data?.data || [];
        setExistingReservations(resList);

        // If per-chair, calculate HOW MANY chairs are taken during the selected time
        if (attrs.is_per_chair) {
          const startTimeMs = new Date(
            `${formData.date}T${formData.startTime}:00.000Z`,
          ).getTime();
          const endTimeMs = formData.allDay
            ? new Date(`${formData.date}T23:59:59.999Z`).getTime()
            : new Date(
                `${formData.date}T${formData.endTime}:00.000Z`,
              ).getTime();

          const takenCount = resList
            .filter((r) => {
              const rStart = new Date(
                r.attributes?.start_time || r.start_time,
              ).getTime();
              const rEnd = new Date(
                r.attributes?.end_time || r.end_time,
              ).getTime();
              return startTimeMs < rEnd && rStart < endTimeMs;
            })
            .reduce(
              (sum, r) => sum + ((r.attributes || r).participants || 1),
              0,
            );

          setOccupiedChairs(takenCount); // Now an integer, not an array
        }
      } catch (err) {
        console.error("Availability check failed:", err);
      } finally {
        setCheckingAvailability(false);
      }
    };
    checkAvailability();
  }, [
    space?.id,
    formData.date,
    formData.startTime,
    formData.endTime,
    formData.allDay,
    attrs.is_per_chair,
  ]);

  // Keep a ref to always have latest quantities for the cleanup on unmount
  const equipmentQuantitiesRef = useRef(equipmentQuantities);
  useEffect(() => {
    equipmentQuantitiesRef.current = equipmentQuantities;
  }, [equipmentQuantities]);

  // Only unlock on actual unmount (modal close), NOT on every state change
  useEffect(() => {
    return () => {
      const qtys = equipmentQuantitiesRef.current;
      if (Object.keys(qtys).length > 0) {
        Object.keys(qtys).forEach((id) => {
          unlockEquipment(id).catch((err) =>
            console.error("Unlock failed during cleanup:", err),
          );
        });
      }
    };
  }, []); // empty deps → runs cleanup ONLY on unmount

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Use a REF (not state) for in-progress flag so it blocks synchronously before re-render
  const updatingEqRef = useRef({});

  const updateEquipmentQuantity = async (eqId, delta, maxQuantity) => {
    // Block synchronously using ref (useState is async and can miss rapid clicks)
    if (updatingEqRef.current[eqId]) return;

    const current = equipmentQuantities[eqId] || 0;
    const next = current + delta;

    // Validate BEFORE locking the ref, so failed checks don't block future clicks
    if (next < 0) return;
    if (delta > 0 && maxQuantity <= 0) {
      alert("Cet équipement n'est plus disponible.");
      return;
    }

    // Only lock the ref AFTER all validation passes
    updatingEqRef.current = { ...updatingEqRef.current, [eqId]: true };

    try {
      if (delta > 0) {
        const startISO = `${formData.date}T${formData.startTime}:00.000Z`;
        const endISO = formData.allDay
          ? `${formData.date}T23:59:59.999Z`
          : `${formData.date}T${formData.endTime}:00.000Z`;

        await lockEquipment(eqId, startISO, endISO);
      } else if (delta < 0) {
        await unlockEquipment(eqId);
      }

      setEquipmentQuantities((prev) => {
        const nextVal = Math.max(0, (prev[eqId] || 0) + delta);
        if (nextVal === 0) {
          const { [eqId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [eqId]: nextVal };
      });

      await syncEquipmentAvailability();
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        "Erreur lors du verrouillage de l'équipement.";
      alert(msg);
    } finally {
      updatingEqRef.current = { ...updatingEqRef.current, [eqId]: false };
    }
  };

  const updateServiceQuantity = (srvId, delta) => {
    setServiceQuantities((prev) => {
      const current = prev[srvId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [srvId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [srvId]: next };
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

      // When booking is_per_chair, ensure they selected participants (chairs)
      if (attrs.is_per_chair) {
        const requestedChairs = parseInt(formData.participants) || 0;
        const availableChairs = Math.max(
          0,
          (attrs.capacity || 1) -
            (typeof occupiedChairs === "number" ? occupiedChairs : 0),
        );

        if (requestedChairs <= 0) {
          alert("Veuillez indiquer le nombre de chaises à réserver.");
          setBookingLoading(false);
          isSubmitting.current = false;
          return;
        }

        if (requestedChairs > availableChairs) {
          alert(`Il ne reste que ${availableChairs} chaise(s) disponible(s).`);
          setBookingLoading(false);
          isSubmitting.current = false;
          return;
        }
      }

      if (!user) {
        alert("Veuillez vous connecter pour réserver.");
        navigate("/login");
        setBookingLoading(false);
        isSubmitting.current = false;
        return;
      }

      // Format ISO strings for start_time and end_time
      const datePart = formData.date;
      const startISO = `${datePart}T${formData.startTime}:00.000Z`;
      const endISO = formData.allDay
        ? `${datePart}T23:59:59.999Z`
        : `${datePart}T${formData.endTime}:00.000Z`;

      const bookingData = {
        user: user.id,
        space:
          attrs._is_virtual && attrs._originalIds
            ? attrs._originalIds[0]
            : space.id,
        start_time: startISO,
        end_time: endISO,
        status: "pending",
        total_price: parseFloat(calculateTotalPrice()),
        equipments: Object.keys(equipmentQuantities).map((id) => parseInt(id)),
        services: Object.keys(serviceQuantities).map((id) => parseInt(id)),
        extras: {
          equipmentQuantities: equipmentQuantities,
          serviceQuantities: serviceQuantities,
          chairId: selectedChair,
          contact: {
            participants: formData.participants,
          },
        },
      };

      console.log("[Booking] Logic: Creating booking...", bookingData);
      const res = await createReservation(bookingData);
      setCreatedReservation(res.data);

      if (activeSubscription) {
        window.alert("Réservation confirmée ! (Inclus dans votre abonnement)");
        onClose();
        const userObj = JSON.parse(localStorage.getItem("user") || "{}");
        navigate(
          userObj.user_type === "professional"
            ? "/professional/bookings"
            : "/student/bookings",
        );
      } else {
        setShowPaymentSelector(true);
      }
      setBookingLoading(false);
    } catch (error) {
      console.error("Booking Error Full Output:", error);
      if (error.response) {
        console.error("Server Error Details:", error.response.data);
      }

      const serverMsg = error.response?.data?.error?.message;
      const errorDetails = error.response?.data?.error?.details
        ? JSON.stringify(error.response.data.error.details)
        : "";

      const errorMsg = serverMsg || error.message || "Une erreur est survenue.";
      window.alert(`Oups ! ${errorMsg}\n${errorDetails}`);

      setBookingLoading(false);
      isSubmitting.current = false;
    }
  };

  const handlePaymentConfirm = async ({ method, file }) => {
    setBookingLoading(true);
    try {
      const bookingId = createdReservation.id;
      const paymentData = {
        amount:
          createdReservation.attributes?.total_price ||
          createdReservation.total_price,
        method: method,
        booking: bookingId,
        status: "pending",
      };

      console.log("[Payment] Creating payment record:", paymentData);
      const paymentRes = await createPayment(paymentData);
      const paymentId = paymentRes.data.id;

      if (method === "bank_transfer" && file) {
        console.log("[Payment] Submitting proof for:", paymentId);
        await submitPaymentProof(paymentId, file);
      }

      window.alert(
        "Paiement enregistré ! Votre réservation est en attente de validation par l'administrateur.",
      );

      onClose();
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      navigate(
        user.user_type === "professional"
          ? "/professional/bookings"
          : "/student/bookings",
      );
    } catch (error) {
      console.error("Payment Error:", error);
      alert(
        "Erreur lors de l'enregistrement du paiement. Veuillez contacter le support.",
      );
      setBookingLoading(false);
    }
  };

  const hours = Array.from({ length: 15 }).map(
    (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`,
  );

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

    console.log("[DEBUG] Pricing Data:", {
      spaceName: attrs.name,
      pHourly,
      pDaily,
      durationHours,
      durationDays,
      allDay: formData.allDay,
      rawAttrs: attrs,
    });

    const participants = parseInt(formData.participants) || 1;

    if (!formData.allDay && durationHours < 8 && pHourly > 0) {
      total += durationHours * pHourly * participants;
    } else if (pDaily > 0) {
      total += durationDays * pDaily * participants;
    } else if (pHourly > 0) {
      total += durationHours * pHourly * participants;
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

    // Service Price
    servicesList.forEach((srv) => {
      const srvAttrs = srv.attributes || srv;
      const qty = serviceQuantities[srv.id] || 0;
      const pSrv = parseFloat(srvAttrs.price || 0);
      if (qty > 0 && pSrv > 0) {
        const pt = srvAttrs.price_type || "one-time";
        if (pt === "hourly") total += durationHours * pSrv * qty;
        else if (pt === "daily") total += durationDays * pSrv * qty;
        else total += pSrv * qty;
      }
    });

    console.log(
      `[Booking] Calculated Price: ${total}, Hours: ${durationHours}`,
    );
    return total.toFixed(2);
  };

  const hasConflict = attrs.is_per_chair
    ? (parseInt(formData.participants) || 0) >
      Math.max(
        0,
        (attrs.capacity || 1) -
          (typeof occupiedChairs === "number" ? occupiedChairs : 0),
      )
    : (!formData.allDay &&
        existingReservations.some((res) => {
          const resStart = new Date(
            res.attributes?.start_time || res.start_time,
          ).getTime();
          const resEnd = new Date(
            res.attributes?.end_time || res.end_time,
          ).getTime();

          const datePart = formData.date;
          const reqStart = new Date(
            `${datePart}T${formData.startTime}:00.000Z`,
          ).getTime();
          const reqEnd = new Date(
            `${datePart}T${formData.endTime}:00.000Z`,
          ).getTime();

          return reqStart < resEnd && resStart < reqEnd;
        })) ||
      (formData.allDay && existingReservations.length > 0);

  // Calendar Logic
  const [viewDate, setViewDate] = useState(new Date(formData.date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust for Monday start (0=Sunday in JS, let's make it 0=Monday or just keep it simple)
  const paddingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const handleMonthChange = (offset) => {
    setViewDate(new Date(currentYear, currentMonth + offset, 1));
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 scroll-smooth">
      <div className="bg-white w-full max-w-6xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[95vh] relative animate-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-all z-20 p-2 hover:bg-slate-100 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Info Column */}
        <div className="flex-1 p-12 overflow-y-auto bg-white border-r border-slate-100">
          <header className="mb-10">
            <h2 className="text-4xl font-black text-slate-900 mb-3 uppercase tracking-tighter">
              {attrs.name}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-black text-slate-400 tracking-widest uppercase">
              <span className="flex items-center gap-1.5">
                👤 Capacité: {attrs.capacity || 20}
              </span>
              {attrs.is_per_chair && (
                <span className="flex items-center gap-1.5 text-blue-600">
                  🪑 Disponibles:{" "}
                  {Math.max(
                    0,
                    (attrs.capacity || 0) -
                      (typeof occupiedChairs === "number" ? occupiedChairs : 0),
                  )}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-emerald-600">
                💰 {attrs.pricing_hourly || 0}DT/H · {attrs.pricing_daily || 0}
                DT/JOUR
              </span>
            </div>
          </header>

          <section className="mb-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Description
            </h4>
            <div className="bg-slate-50 p-6 rounded-[1.5rem] text-sm text-slate-600 leading-relaxed italic mb-4">
              {attrs.description ||
                "Un espace de travail moderne parfaitement équipé."}
            </div>

            {attrs.is_per_chair && (
              <div className="flex gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                <div className="flex-1 bg-white p-4 rounded-xl text-center shadow-sm">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">
                    Total des chaises
                  </p>
                  <p className="text-2xl font-black text-slate-700">
                    {attrs.capacity || 1}
                  </p>
                </div>
                <div className="flex-1 bg-white p-4 rounded-xl text-center shadow-sm border border-emerald-100">
                  <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600 mb-1">
                    Disponibles
                  </p>
                  <p className="text-2xl font-black text-emerald-600">
                    {Math.max(
                      0,
                      (attrs.capacity || 1) -
                        (typeof occupiedChairs === "number"
                          ? occupiedChairs
                          : 0),
                    )}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="mb-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Équipements
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {equipmentsList.length > 0 ? (
                equipmentsList.map((eq) => {
                  const id = eq.id;
                  const attrs = eq.attributes || eq;
                  const qty = equipmentQuantities[id] || 0;
                  const eqName = attrs.name || eq.name;
                  const eqPrice = attrs.price || eq.price;
                  const eqPriceType = attrs.price_type;
                  // Server-reported availability already accounts for all locks (including user's own)
                  const availableNow =
                    dynamicAvailability[id] ??
                    attrs.available_quantity ??
                    attrs.total_quantity ??
                    0;
                  // No need to subtract qty — server already deducts user's locks
                  const remainingAvailable = Math.max(0, availableNow);
                  const isMaintenance = attrs.status === "en_maintenance";
                  const isRupture =
                    attrs.status === "en_rupture" || availableNow <= 0;

                  return (
                    <div
                      key={id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${qty > 0 ? "bg-emerald-50 border-emerald-200" : isMaintenance || availableNow <= 0 ? "bg-slate-50 border-slate-100 opacity-60 grayscale" : "bg-white border-slate-100"}`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                          {eqName}
                          {isMaintenance && (
                            <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 rounded-sm">
                              En maintenance
                            </span>
                          )}
                          {availableNow <= 0 && !isMaintenance && (
                            <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 rounded-sm">
                              Rupture de stock
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-emerald-600 font-black uppercase">
                            {eqPrice}DT
                            {eqPriceType === "hourly"
                              ? "/H"
                              : eqPriceType === "daily"
                                ? "/JOUR"
                                : ""}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 rounded-sm ${remainingAvailable > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                          >
                            DISPONIBLE: {remainingAvailable}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() =>
                            updateEquipmentQuantity(id, -1, availableNow)
                          }
                          disabled={isMaintenance || qty <= 0}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-black disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="text-sm font-black text-emerald-600">
                          {qty}
                        </span>
                        <button
                          onClick={() =>
                            updateEquipmentQuantity(id, 1, availableNow)
                          }
                          disabled={isMaintenance || isRupture}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-black disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <span className="text-xs italic text-slate-400">
                  Aucun équipement disponible.
                </span>
              )}
            </div>
          </section>

          <section className="mb-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Services
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {servicesList.length > 0 ? (
                servicesList.map((srv) => {
                  const id = srv.id;
                  const qty = serviceQuantities[id] || 0;
                  return (
                    <div
                      key={id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${qty > 0 ? "bg-blue-50 border-blue-200" : "bg-white border-slate-100"}`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">
                          {srv.attributes?.name || srv.name}
                        </span>
                        <span className="text-[10px] text-blue-600 font-black uppercase">
                          {srv.attributes?.price || srv.price}DT
                          {srv.attributes?.price_type === "hourly"
                            ? "/H"
                            : srv.attributes?.price_type === "daily"
                              ? "/JOUR"
                              : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => updateServiceQuantity(id, -1)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-black"
                        >
                          -
                        </button>
                        <span className="text-sm font-black text-blue-600">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateServiceQuantity(id, 1)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-black"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <span className="text-xs italic text-slate-400">
                  Aucun service disponible.
                </span>
              )}
            </div>
          </section>

          {attrs.is_per_chair && (
            <section className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1 h-1 bg-amber-500 rounded-full"></span>{" "}
                Statut des places
              </h4>
              <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                <div className="flex justify-around text-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                      Capacité de la table
                    </p>
                    <p className="text-2xl font-black text-slate-900">
                      {attrs.capacity || 0}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-slate-200 self-center"></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                      Réservées
                    </p>
                    <p className="text-2xl font-black text-amber-600">
                      {typeof occupiedChairs === "number" ? occupiedChairs : 0}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-slate-200 self-center"></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                      Disponibles
                    </p>
                    <p className="text-2xl font-black text-emerald-600">
                      {Math.max(
                        0,
                        (attrs.capacity || 0) -
                          (typeof occupiedChairs === "number"
                            ? occupiedChairs
                            : 0),
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Nombre de chaises à réserver
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <input
                type="number"
                placeholder="Nombre de personnes"
                name="participants"
                value={formData.participants}
                onChange={handleInputChange}
                className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm font-black text-emerald-800"
              />
            </div>
          </section>
        </div>

        {/* Selection Column */}
        <div className="w-full md:w-[480px] p-12 bg-slate-50/50 overflow-y-auto">
          <section className="mb-10">
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => handleMonthChange(-1)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  ❮
                </button>
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.1em]">
                  {monthNames[currentMonth]} {currentYear}
                </p>
                <button
                  onClick={() => handleMonthChange(1)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  ❯
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {["L", "M", "M", "J", "V", "S", "D"].map((d, idx) => (
                  <div
                    key={`${d}-${idx}`}
                    className="text-[9px] font-black text-slate-300 text-center uppercase"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center">
                {Array.from({ length: paddingDays }).map((_, i) => (
                  <div key={`pad-${i}`} className="h-10" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateObj = new Date(currentYear, currentMonth, day);
                  const dStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                  const isPast = dateObj < today;
                  const isSelected = formData.date === dStr;

                  return (
                    <button
                      key={day}
                      disabled={isPast}
                      onClick={() => setFormData((p) => ({ ...p, date: dStr }))}
                      className={`h-10 rounded-xl text-[10px] font-black transition-all flex items-center justify-center
                        ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                            : isPast
                              ? "text-slate-200 cursor-not-allowed opacity-40"
                              : "text-slate-600 hover:bg-slate-100"
                        }
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="mb-10 space-y-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="allDay"
                checked={formData.allDay}
                onChange={handleInputChange}
                className="hidden"
              />
              <div
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.allDay ? "bg-blue-600 border-blue-600" : "border-slate-200 bg-white"}`}
              >
                {formData.allDay && (
                  <span className="text-white text-xs font-black">✓</span>
                )}
              </div>
              <span className="text-[11px] font-black uppercase text-slate-600">
                Toute la journée
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    startTime: "09:00",
                    endTime: "13:00",
                    allDay: false,
                  }))
                }
                className="py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 transition-all"
              >
                Matinée (9h-13h)
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    startTime: "14:00",
                    endTime: "18:00",
                    allDay: false,
                  }))
                }
                className="py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 transition-all"
              >
                Après-midi (14h-18h)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <select
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                disabled={formData.allDay}
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold"
              >
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <select
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                disabled={formData.allDay}
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold"
              >
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <div className="mb-6 p-6 bg-blue-50 border border-blue-100 rounded-[2rem] flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                Total Estimé
              </p>
              <h3 className="text-2xl font-black text-blue-600">
                {calculateTotalPrice()} DT
              </h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                TVA Incluse
              </p>
              <p className="text-[9px] font-bold text-slate-400 italic">
                Paiement sur place
              </p>
            </div>
          </div>

          <button
            onClick={handleBooking}
            disabled={bookingLoading || hasConflict || isCheckingSubscription}
            className={`w-full py-6 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-[1.5rem] shadow-2xl transition-all ${bookingLoading || hasConflict || isCheckingSubscription ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-500/30"}`}
          >
            {isCheckingSubscription
              ? "VÉRIFICATION..."
              : bookingLoading
                ? "VALIDATION..."
                : hasConflict
                  ? "NON DISPONIBLE"
                  : "CONFIRMER LA RÉSERVATION"}
          </button>

          <p className="mt-6 text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            * En cliquant sur confirmer, vous bloquez cet espace et recevez un
            email de confirmation instantanément.
          </p>
        </div>
      </div>
      {showPaymentSelector && (
        <PaymentSelector
          amount={parseFloat(calculateTotalPrice())}
          onSelect={handlePaymentConfirm}
          onCancel={() => setShowPaymentSelector(false)}
        />
      )}
    </div>
  );
};

export default BookingModal;
