import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import {
  getUserReservations,
  cancelReservation,
  updateReservation,
} from "../../services/bookingService";
import {
  getEquipments,
  getEquipmentAvailability,
  lockEquipment,
  unlockEquipment
} from "../../services/equipmentService";
import { getServicesList } from "../../services/serviceService";
import { getBookingById } from "../../services/bookingService";
import { getSpaceById } from "../../services/spaceService";
import BookingModal from "../2d/BookingModal";

const BookingCalendar = ({ userId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [allEquipments, setAllEquipments] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [equipmentQuantities, setEquipmentQuantities] = useState({});
  const [serviceQuantities, setServiceQuantities] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [spaceForBooking, setSpaceForBooking] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const navigate = useNavigate();

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await getUserReservations(userId);
      const data = response.data || [];

      const mappedEvents = data.map((res) => {
        const attrs = res.attributes || res;
        const startTime = attrs.start_time;
        const endTime = attrs.end_time;
        const timeSlot = attrs.time_slot || "";

        // Defensive mapping for nested/flat Strapi data
        const spaceRaw = attrs.space?.data || attrs.space || {};
        const spaceAttrs = spaceRaw?.attributes || (typeof spaceRaw === 'object' ? spaceRaw : {});
        const coworkingRaw = spaceAttrs.coworking_space?.data || spaceAttrs.coworking_space || {};
        const coworking = coworkingRaw?.attributes || coworkingRaw || {};

        const getSpaceDisplayName = () => {
          if (spaceAttrs.name) return spaceAttrs.name;
          if (spaceAttrs.mesh_name) {
            return spaceAttrs.mesh_name.replace(/bureau_/i, 'Bureau ').replace(/_/g, ' ');
          }
          if (spaceAttrs.type) {
            const types = {
              'meeting-room': 'Salle de Réunion',
              'event-space': 'Espace Événementiel',
              'hot-desk': 'Hot Desk',
              'fixed-desk': 'Bureau Fixe'
            };
            return types[spaceAttrs.type] || spaceAttrs.type;
          }
          // 2. Redundancy Fallback: Use data stored in extras (if we started saving it)
          if (attrs.extras?.spaceName) return attrs.extras.spaceName;

          // 3. Last resort: Coworking name or SunSpace
          return coworking.name || attrs.extras?.coworkingName || "SunSpace";
        };

        const spaceNameLabel = getSpaceDisplayName();

        const totalPrice = (() => {
          const storedPrice = Number(attrs.total_price || attrs.totalPrice || attrs.payment?.data?.attributes?.amount || attrs.payment?.amount);
          if (storedPrice > 0) return storedPrice.toFixed(2);

          const start = new Date(startTime);
          const end = new Date(endTime);
          const hours = Math.ceil((end - start) / (1000 * 60 * 60));
          if (hours > 0) {
            let calcPrice = 0;
            let pHourly = parseFloat(spaceAttrs.pricing_hourly || 0);

            if (pHourly === 0 && spaceAttrs.type) {
              if (spaceAttrs.type === "meeting-room") pHourly = 15;
              else if (spaceAttrs.type === "event-space") pHourly = 20;
              else if (spaceAttrs.type === "hot-desk" || spaceAttrs.type === "fixed-desk") pHourly = 5;
            }

            if (pHourly > 0) calcPrice += hours * pHourly * (attrs.participants || 1);

            (attrs.equipments?.data || attrs.equipments || []).forEach(eq => {
              const p = eq.attributes || eq;
              if (p.price) calcPrice += (p.price_type === 'hourly' ? p.price * hours : p.price);
            });

            (attrs.services?.data || attrs.services || []).forEach(sv => {
              const p = sv.attributes || sv;
              if (p.price) calcPrice += (p.price_type === 'hourly' ? p.price * hours : p.price);
            });
            return calcPrice.toFixed(2);
          }
          return "0.00";
        })();

        let start, end, allDay = false;
        if (startTime && endTime) {
          start = startTime;
          end = endTime;
        } else {
          start = attrs.date || attrs.start_time;
          allDay = true;
        }

        let color = "#3b82f6";
        if (attrs.status === "confirmed") color = "#10b981";
        if (attrs.status === "pending") color = "#f59e0b";
        if (attrs.status === "cancelled") color = "#ef4444";

        return {
          id: res.id,
          title: spaceNameLabel,
          start,
          end,
          allDay,
          extendedProps: {
            status: attrs.status,
            documentId: res.documentId || res.id,
            spaceName: spaceNameLabel,
            coworkingName: coworking.name || "SunSpace",
            timeSlot: timeSlot,
            totalPrice: totalPrice,
            equipment: (Array.isArray(attrs.equipments?.data) ? attrs.equipments.data : (Array.isArray(attrs.equipments) ? attrs.equipments : [])),
            services: (Array.isArray(attrs.services?.data) ? attrs.services.data : (Array.isArray(attrs.services) ? attrs.services : [])),
            extras: attrs.extras || {},
            space: spaceAttrs, // Keep normalized space attributes for price calculation
          },
          backgroundColor: color,
          borderColor: "transparent",
        };
      });

      setEvents(mappedEvents);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (arg) => {
    if (window.confirm(`Voulez-vous créer une réservation pour le ${arg.dateStr} ?`)) {
      navigate("/spaces");
    }
  };

  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [eqRes, srvRes] = await Promise.all([getEquipments(), getServicesList()]);
        setAllEquipments(eqRes.data || []);
        setAllServices(srvRes.data || []);
      } catch (err) {
        console.error("Error loading equipment/services for calendar:", err);
      }
    };
    loadStaticData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchReservations();
    }
  }, [userId]);
  const handleCancel = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) return;
    try {
      setActionLoading(true);
      const docId = selectedEvent.extendedProps.documentId;
      await cancelReservation(docId);
      setSelectedEvent(null);
      await fetchReservations();
      alert("Réservation annulée avec succès.");
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      alert("Erreur lors de l'annulation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleModify = async () => {
    if (!selectedEvent) return;
    try {
      setLoadingEdit(true);
      const bId = selectedEvent.extendedProps.documentId;

      // Fetch full booking details (resilient way)
      // CRITICAL: Strapi v5 requires documentId for lookups
      const lookupId = selectedEvent.extendedProps.documentId || selectedEvent.id;
      const fullBooking = await getBookingById(lookupId);
      const bData = fullBooking.data || fullBooking;

      // Extract space ID (consistent with MyBookingsWidget)
      const attrs = bData.attributes || bData;
      const spaceObj = attrs.space?.data || attrs.space || selectedEvent.extendedProps.space;
      const sId = spaceObj?.documentId || spaceObj?.id || attrs.extras?.spaceId || selectedEvent.extendedProps.spaceId;

      console.log("[BookingCalendar] handleModify - bData:", bData, "sId found:", sId);

      // Defensive Fix: Use hydrated space from booking if available
      const fullSpaceFromBooking = attrs.space?.data || attrs.space;
      const hasDeepData = fullSpaceFromBooking?.attributes?.pricing_hourly || fullSpaceFromBooking?.pricing_hourly;

      if (!sId && !hasDeepData) {
        console.error("No space ID found for booking details:", bData, "Event space:", selectedEvent.extendedProps.space);
        if (attrs.extras?.spaceName || selectedEvent.extendedProps.spaceName) {
          setSpaceForBooking({ attributes: { name: attrs.extras?.spaceName || selectedEvent.extendedProps.spaceName } });
        } else {
          alert("Impossible de charger les détails de l'espace (ID manquant).");
          setLoadingEdit(false);
          return;
        }
      } else {
        try {
          // Attempt fresh fetch
          let fullSpace;
          if (sId) {
            try {
              const spaceRes = await getSpaceById(sId);
              fullSpace = spaceRes?.data || spaceRes;
            } catch (innerErr) {
              console.warn("[BookingCalendar] Space API fetch failed, will attempt fallback.", innerErr);
            }
          }

          // Resilient Fallback
          const apiHasPricing = fullSpace?.attributes?.pricing_hourly || fullSpace?.pricing_hourly;

          if (apiHasPricing) {
            setSpaceForBooking(fullSpace);
          } else if (hasDeepData) {
            console.log("[BookingCalendar] Using deep space data from booking record.");
            setSpaceForBooking(fullSpaceFromBooking);
          } else if (fullSpace || fullSpaceFromBooking) {
            setSpaceForBooking(fullSpace || fullSpaceFromBooking);
          } else {
            setSpaceForBooking({ attributes: { name: attrs.extras?.spaceName || selectedEvent.extendedProps.spaceName || "Espace" } });
          }
        } catch (spaceErr) {
          console.error("Critical error in BookingCalendar handleModify logic:", spaceErr);
          setSpaceForBooking(fullSpaceFromBooking || { attributes: { name: "Espace" } });
        }
      }

      setEditingBooking(bData);
      setSelectedEvent(null); // Close the detail popup
    } catch (err) {
      console.error("Error preparing edit mode:", err);
      alert("Erreur lors de la préparation de la modification.");
    } finally {
      setLoadingEdit(false);
    }
  };




  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400 italic">
        Chargement de votre calendrier...
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 animate-fade-in relative">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        locale={frLocale}
        height="auto"
        eventClick={(info) => {
          const event = info.event;
          const extras = event.extendedProps.extras || {};
          setSelectedEvent(event);
          setEquipmentQuantities(extras.equipmentQuantities || {});
          setServiceQuantities(extras.serviceQuantities || {});
        }}
        dateClick={handleDateClick}
        eventClassNames="cursor-pointer hover:scale-[1.02] transition-transform font-bold text-[10px]"
        dayMaxEvents={true}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        nowIndicator={true}
      />



      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedEvent(null)}
        >
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${selectedEvent.extendedProps.status === "confirmed"
                      ? "bg-emerald-50 text-emerald-600"
                      : selectedEvent.extendedProps.status === "pending"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-red-50 text-red-600"
                      }`}
                  >
                    {selectedEvent.extendedProps.status || "En attente"}
                  </span>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-2">
                    {selectedEvent.title}
                  </h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                    {selectedEvent.extendedProps.coworkingName || "SunSpace"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <span className="text-2xl">📅</span>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Date & Créneau
                    </p>
                    <p className="text-sm font-bold text-slate-700 capitalize">
                      {selectedEvent.start.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                    <p className="text-xs text-blue-600 font-black">
                      {selectedEvent.extendedProps.timeSlot}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Prix Total
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {(selectedEvent.extendedProps.totalPrice || 0)} DTN
                    </p>
                  </div>
                </div>

                {/* Chosen Equipments/Services section */}
                {(() => {
                  const eqList = selectedEvent.extendedProps.equipment || [];
                  const srvList = selectedEvent.extendedProps.services || [];
                  const extrasSrv = selectedEvent.extendedProps.extras?.serviceQuantities || {};
                  const fallbackSrvIds = Object.keys(extrasSrv).filter(id => String(id).startsWith("fallback-"));

                  if (eqList.length === 0 && srvList.length === 0 && fallbackSrvIds.length === 0) return null;

                  const fallbackNames = {
                    "fallback-print": "Impression",
                    "fallback-catering": "Catering / Déjeuner",
                    "fallback-it-support": "Support Technique IT",
                    "fallback-coffee": "Cafétérie Premium"
                  };

                  return (
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Options choisies
                      </p>
                      {(selectedEvent.extendedProps.equipment || []).map((eq, idx) => {
                        const eAttrs = eq.attributes || eq;
                        const name = eAttrs.name || "Équipement";
                        const id = eq.documentId || eq.id || `eq-${idx}`;
                        const qtyLookup = selectedEvent.extendedProps.extras?.equipmentQuantities || {};
                        const qty = qtyLookup[id] || qtyLookup[eq.id] || 1;
                        return (
                          <div key={id} className="flex justify-between items-center text-xs font-bold text-slate-600">
                            <span className="flex items-center gap-2">🛠️ Équipement: {name}</span>
                            <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-100 font-black text-[10px]">x{qty}</span>
                          </div>
                        );
                      })}
                      {(selectedEvent.extendedProps.services || []).map((srv, idx) => {
                        const sAttrs = srv.attributes || srv;
                        const name = sAttrs.name || "Service";
                        const id = srv.documentId || srv.id || `srv-${idx}`;
                        const qtyLookup = selectedEvent.extendedProps.extras?.serviceQuantities || {};
                        const qty = qtyLookup[id] || qtyLookup[srv.id] || 1;
                        return (
                          <div key={id} className="flex justify-between items-center text-xs font-bold text-slate-600">
                            <span className="flex items-center gap-2">✨ Service: {name}</span>
                            <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-100 font-black text-[10px]">x{qty}</span>
                          </div>
                        );
                      })}
                      {fallbackSrvIds.map((id) => {
                        const name = fallbackNames[id] || "Service supplémentaire";
                        const qty = extrasSrv[id];
                        return (
                          <div key={id} className="flex justify-between items-center text-xs font-bold text-slate-600">
                            <span className="flex items-center gap-2">✨ Service: {name}</span>
                            <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-100 font-black text-[10px]">x{qty}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-3">
                  {selectedEvent.extendedProps.status === "pending" && (
                    <button
                      onClick={handleModify}
                      disabled={loadingEdit || actionLoading}
                      className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                      {loadingEdit ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Modifier la réservation"
                      )}
                    </button>
                  )}
                  {selectedEvent.extendedProps.status === "pending" && (
                    <button
                      onClick={handleCancel}
                      disabled={actionLoading || loadingEdit}
                      className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-50"
                    >
                      {actionLoading ? "..." : "Annuler la réservation"}
                    </button>
                  )}
                </div>
                {selectedEvent.extendedProps.status === "pending" && (
                  <p className="text-[9px] text-slate-400 font-medium text-center px-4 italic leading-tight">
                    * L'annulation est immédiate. Une fois annulée, la disponibilité de l'espace sera libérée.
                  </p>
                )}
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="w-full py-4 mt-2 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingBooking && spaceForBooking && (
        <BookingModal
          space={spaceForBooking}
          editingBooking={editingBooking}
          onClose={() => {
            setEditingBooking(null);
            setSpaceForBooking(null);
            fetchReservations();
          }}
        />
      )}

      <style>{`
        .fc {
          --fc-button-bg-color: #3b82f6;
          --fc-button-border-color: #3b82f6;
          --fc-button-hover-bg-color: #2563eb;
          --fc-button-active-bg-color: #1d4ed8;
          --fc-event-bg-color: #3b82f6;
          --fc-event-border-color: transparent;
          font-family: inherit;
        }
        .fc .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: -0.025em;
        }
        .fc .fc-button {
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          border-radius: 0.75rem;
          padding: 0.5rem 1rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .fc .fc-col-header-cell-cushion {
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          font-size: 0.7rem;
          padding: 10px 0;
        }
        .fc .fc-daygrid-day-number {
            font-weight: 800;
            color: #94a3b8;
            padding: 8px;
        }
        .fc .fc-day-today {
            background: #eff6ff !important;
        }
        .fc-event {
            padding: 2px 4px;
            border-radius: 6px !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f8fafc;
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
      `}</style>
    </div >
  );
};

export default BookingCalendar;
