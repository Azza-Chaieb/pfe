import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DashboardStatCard from "../../components/layout/DashboardStatCard";
import api from "../../services/apiClient";
import { getUpcomingSessions } from "../../services/courseService";
import { getUsers } from "../../services/userService";
import MyBookingsWidget from "../../components/dashboard/MyBookingsWidget";
import { getUserReservations } from "../../services/bookingService";
import BookingCalendar from "../../components/calendar/BookingCalendar";

const AssociationDashboard = ({ activeTab = "dashboard" }) => {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [bookingView, setBookingView] = useState("list");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setLoading(true);

        try {
          const [resEvents, resUsers, resReservations] = await Promise.all([
            getUpcomingSessions(),
            api.get("/users?filters[user_type]=student"),
            getUserReservations(parsedUser.id),
          ]);

          setEvents(
            (resEvents.data || []).map((item) => {
              const data = item.attributes || item;
              return {
                id: item.id,
                title: data.title,
                provider:
                  data.trainer_profile?.data?.attributes?.user?.data?.attributes
                    ?.fullname || "SunSpace",
                date: new Date(data.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
                status: "Prévu",
              };
            }),
          );

          setMemberCount(resUsers.data?.length || 0);

          setBookings(
            (resReservations.data || []).map((item) => {
              const data = item.attributes || item;
              const space = data.space?.data?.attributes || data.space || {};
              const coworking =
                data.coworking_space?.data?.attributes ||
                data.coworking_space ||
                {};
              const startDate = new Date(data.start_time);
              const endDate = new Date(data.end_time);

              return {
                id: item.id,
                spaceName: space.name
                  ? `${coworking.name || "Espace"} - ${space.name}`
                  : coworking.name || "Espace inconnu",
                date: startDate.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                }),
                time: `${startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
              };
            }),
          );
        } catch (error) {
          console.error("Error loading association dashboard:", error);
        } finally {
          setLoading(false);
        }
      } else {
        navigate("/login");
      }
    };
    fetchData();
  }, [navigate]);

  const renderDashboard = () => (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
          Espace <span className="text-blue-600">Association</span> 🤝
        </h1>
        <p className="text-xs text-slate-500 font-medium tracking-tight">
          Gérez votre communauté, vos événements et vos ressources associatives.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <DashboardStatCard
          title="Membres Actifs"
          value={memberCount}
          icon="👥"
          color="blue"
        />
        <DashboardStatCard
          title="Événements"
          value={events.length}
          icon="🌟"
          color="purple"
        />
        <DashboardStatCard
          title="Fonds Collectés"
          value="À bientôt !"
          icon="💰"
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-[28px] border border-white/60 shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">
              Événements à venir
            </h3>
            <button
              onClick={() => navigate("/association/events")}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 transition-all"
            >
              Voir tout
            </button>
          </div>
          <div className="space-y-3">
            {events.length > 0 ? (
              events.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="p-4 bg-white/60 rounded-xl border border-slate-50 flex items-center justify-between group hover:bg-white transition-all"
                >
                  <div>
                    <h4 className="font-bold text-slate-700 text-sm">
                      {event.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {event.date}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase">
                    {event.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-6">
                Aucun événement prévu.
              </p>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-blue-800 rounded-[28px] p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          <h3 className="text-xl font-black mb-3 tracking-tight">
            Membres du Bureau 🏢
          </h3>
          <p className="text-blue-100 text-xs leading-relaxed mb-6 font-medium italic">
            Gérez les rôles et permissions de votre association.
          </p>
          <button
            onClick={() => navigate("/association/members")}
            className="w-full py-4 bg-white text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] transition-all"
          >
            Gérer les membres
          </button>
        </div>
      </div>
    </>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Calendrier des Événements 🌟
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Liste complète des événements organisés et à venir.
          </p>
        </div>
        <button
          onClick={() => navigate("/association/dashboard")}
          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
        >
          ← Retour
        </button>
      </div>
      <div className="bg-white/40 backdrop-blur-md p-8 rounded-[32px] border border-white/60 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-500">
                🏙️
              </div>
              <h3 className="font-black text-slate-800 mb-2 truncate">
                {event.title}
              </h3>
              <p className="text-xs text-slate-400 mb-4 font-medium tracking-tight">
                Par {event.provider}
              </p>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  {event.date}
                </span>
                <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-black uppercase">
                  Détails
                </button>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <p className="col-span-full text-center py-20 text-slate-400 italic">
              Aucun événement à afficher.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Annuaire des Membres 👥
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Membres inscrits à l'association et rôles administratifs.
          </p>
        </div>
        <button
          onClick={() => navigate("/association/dashboard")}
          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
        >
          ← Retour
        </button>
      </div>
      <div className="bg-white/40 backdrop-blur-md p-8 rounded-[32px] border border-white/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Membre
                </th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Rôle
                </th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="bg-blue-50/20">
                <td className="py-5 font-bold text-slate-700">
                  {user?.fullname || user?.username}
                </td>
                <td className="py-5">
                  <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-[8px] font-black uppercase">
                    Président
                  </span>
                </td>
                <td className="py-5 text-right">
                  <span className="text-[9px] text-slate-400 italic">
                    Modifier
                  </span>
                </td>
              </tr>
              {[1, 2, 3].map((i) => (
                <tr key={i}>
                  <td className="py-5 text-slate-600 font-medium italic">
                    Étudiant membre #{i}
                  </td>
                  <td className="py-5">
                    <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[8px] font-black uppercase">
                      Membre
                    </span>
                  </td>
                  <td className="py-5 text-right">
                    <button className="text-[9px] text-blue-400 font-black uppercase hover:underline">
                      Profil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Mes Réservations 📅
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Consultez et gérez les réservations d'espaces pour votre association.
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
            <button
              onClick={() => setBookingView("list")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${bookingView === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              Liste
            </button>
            <button
              onClick={() => setBookingView("calendar")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${bookingView === "calendar" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              Calendrier
            </button>
          </div>
          <button
            onClick={() => navigate("/explore/5")}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
          >
            + Nouveau
          </button>
          <button
            onClick={() => navigate("/association/dashboard")}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
          >
            ← Retour
          </button>
        </div>
      </div>
      {bookingView === "calendar" ? (
        <BookingCalendar userId={user?.id} />
      ) : (
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/60 shadow-xl shadow-slate-200/50">
          <MyBookingsWidget bookings={bookings} fullPage />
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout role="association" user={user} loading={loading}>
      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "events" && renderEvents()}
      {activeTab === "members" && renderMembers()}
      {activeTab === "bookings" && renderBookings()}
    </DashboardLayout>
  );
};

export default AssociationDashboard;
