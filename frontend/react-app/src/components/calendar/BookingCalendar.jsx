import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { getUserReservations, cancelReservation, updateReservation } from '../../services/bookingService';

const BookingCalendar = ({ userId }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ date: '', timeSlot: '' });
    const [actionLoading, setActionLoading] = useState(false);
    const navigate = useNavigate();

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const response = await getUserReservations(userId);
            const data = response.data || [];

            const mappedEvents = data.map(res => {
                console.log(`[Calendar] Raw Reservation Data:`, res);
                const attrs = res.attributes || res;
                const date = attrs.date;
                const timeSlot = attrs.time_slot || "";

                // Debug price specifically
                console.log(`[Calendar] Price for ${res.id}:`, {
                    total_price: attrs.total_price,
                    totalPrice: attrs.totalPrice,
                    fallback: attrs.total_price || attrs.totalPrice || 0
                });

                let start, end, allDay = false;

                if (timeSlot === "Full Day") {
                    start = date;
                    allDay = true;
                } else {
                    const times = timeSlot.split(' - ');
                    if (times.length === 2) {
                        start = `${date}T${times[0]}:00`;
                        end = `${date}T${times[1]}:00`;
                    } else {
                        start = date;
                        allDay = true;
                    }
                }

                // Status colors
                let color = '#3b82f6'; // Default Blue
                if (attrs.status === 'confirmed') color = '#10b981'; // Emerald
                if (attrs.status === 'pending') color = '#f59e0b';   // Amber
                if (attrs.status === 'cancelled') color = '#ef4444'; // Red

                return {
                    id: res.id,
                    title: attrs.space?.data?.attributes?.name || attrs.space?.name || "Réservation",
                    start,
                    end,
                    allDay,
                    extendedProps: {
                        status: attrs.status,
                        documentId: res.documentId, // CRITICAL: Ensure documentId is here
                        spaceName: attrs.space?.data?.attributes?.name || attrs.space?.name,
                        coworkingName: attrs.coworking_space?.data?.attributes?.name || attrs.coworking_space?.name,
                        timeSlot: timeSlot,
                        totalPrice: attrs.total_price || attrs.totalPrice || 0,
                        equipment: attrs.equipment || []
                    },
                    backgroundColor: color,
                    borderColor: 'transparent'
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
            navigate("/explore/5");
        }
    };

    useEffect(() => {
        if (userId) {
            fetchReservations();
        }
    }, [userId]);

    const handleCancel = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) return;
        try {
            setActionLoading(true);
            // Use documentId for update
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

    const handleUpdate = async () => {
        try {
            setActionLoading(true);
            const docId = selectedEvent.extendedProps.documentId;
            await updateReservation(docId, {
                date: editData.date,
                time_slot: editData.timeSlot
            });
            setIsEditing(false);
            setSelectedEvent(null);
            await fetchReservations();
            alert("Réservation modifiée avec succès.");
        } catch (error) {
            console.error("Error updating reservation:", error);
            alert("Erreur lors de la modification.");
        } finally {
            setActionLoading(false);
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
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={events}
                locale={frLocale}
                height="auto"
                eventClick={(info) => {
                    setSelectedEvent(info.event);
                }}
                dateClick={handleDateClick}
                eventClassNames="cursor-pointer hover:scale-[1.02] transition-transform font-bold text-[10px]"
                dayMaxEvents={true}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                nowIndicator={true}
            />

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${selectedEvent.extendedProps.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                                        selectedEvent.extendedProps.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                        }`}>
                                        {selectedEvent.extendedProps.status || 'En attente'}
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
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Créneau</p>
                                        <p className="text-sm font-bold text-slate-700 capitalize">
                                            {selectedEvent.start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </p>
                                        <p className="text-xs text-blue-600 font-black">{selectedEvent.extendedProps.timeSlot}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                    <span className="text-2xl">💰</span>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix Total</p>
                                        <p className="text-sm font-bold text-slate-700">{selectedEvent.extendedProps.totalPrice || 0} DTN</p>
                                    </div>
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="space-y-4 mb-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Nouvelle Date</label>
                                        <input
                                            type="date"
                                            value={editData.date}
                                            onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Nouveau Créneau</label>
                                        <select
                                            value={editData.timeSlot}
                                            onChange={(e) => setEditData({ ...editData, timeSlot: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="08:00 - 12:00">08:00 - 12:00</option>
                                            <option value="13:00 - 17:00">13:00 - 17:00</option>
                                            <option value="08:00 - 17:00">08:00 - 17:00 (Journée)</option>
                                            <option value="Full Day">Full Day</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleUpdate}
                                            disabled={actionLoading}
                                            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all"
                                        >
                                            {actionLoading ? '...' : 'Confirmer'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedEvent.extendedProps.status === 'pending' && (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => {
                                                    setIsEditing(true);
                                                    setEditData({
                                                        date: selectedEvent.startStr.split('T')[0],
                                                        timeSlot: selectedEvent.extendedProps.timeSlot
                                                    });
                                                }}
                                                className="flex-1 py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 transition-all"
                                            >
                                                Modifier
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                disabled={actionLoading}
                                                className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all"
                                            >
                                                {actionLoading ? '...' : 'Annuler'}
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-[9px] text-slate-400 font-medium text-center px-4 italic leading-tight">
                                        * L'annulation est immédiate. Pour une modification, nous vérifierons à nouveau la disponibilité de l'espace.
                                    </p>
                                    <button
                                        onClick={() => setSelectedEvent(null)}
                                        className="w-full py-4 mt-2 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all"
                                    >
                                        Fermer
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
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
      `}</style>
        </div>
    );
};

export default BookingCalendar;
