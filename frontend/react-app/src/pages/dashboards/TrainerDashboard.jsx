import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DashboardStatCard from "../../components/layout/DashboardStatCard";
import MyCoursesWidget from "../../components/dashboard/MyCoursesWidget";
import MyStudentsWidget from "../../components/dashboard/MyStudentsWidget";
import UpcomingSessionsWidget from "../../components/dashboard/UpcomingSessionsWidget";
import CreateCourseModal from "../../components/dashboard/CreateCourseModal";
import {
  getTrainerCourses,
  getUpcomingSessions,
  getTrainerStudents,
  createCourse,
} from "../../services/courseService";
import { getUserReservations } from "../../services/bookingService";
import {
  getMySubscription,
  cancelSubscription as cancelSub,
} from "../../services/subscriptionService";
import BookingCalendar from "../../components/calendar/BookingCalendar";
import SubscriptionSection from "../../components/dashboard/SubscriptionSection";
import SubscriptionStatCard from "../../components/dashboard/SubscriptionStatCard";

const TrainerDashboard = ({ activeTab = "dashboard" }) => {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingView, setBookingView] = useState("list");
  const navigate = useNavigate();

  const fetchData = async () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setLoading(true);

      try {
        const [resCourses, resSessions, resStudents, subData] =
          await Promise.allSettled([
            getTrainerCourses(parsedUser.id),
            getUpcomingSessions(),
            getTrainerStudents(parsedUser.id),
            getMySubscription(parsedUser.id),
          ]);

        if (resCourses.status === "fulfilled") {
          setCourses(
            (resCourses.value.data || []).map((item) => ({
              id: item.id,
              title: item.attributes?.title || item.title,
              studentCount: item.attributes?.students?.data?.length || 0,
            })),
          );
        }

        if (resSessions.status === "fulfilled") {
          setSessions(
            (resSessions.value.data || []).map((item) => {
              const data = item.attributes || item;
              const date = new Date(data.date);
              return {
                id: item.id,
                day: date.getDate(),
                month: date
                  .toLocaleDateString("fr-FR", { month: "short" })
                  .toUpperCase(),
                title: data.title,
                time: data.time || "10:00",
                location: data.location || "Local",
              };
            }),
          );
        }

        if (resStudents.status === "fulfilled") {
          setStudents(
            (resStudents.value || []).map((s) => ({
              id: s.id,
              name: s.fullname || s.username,
              email: s.email,
              courseTitle: s.courseTitle || "Aucun",
              lastActive: s.updatedAt
                ? new Date(s.updatedAt).toLocaleDateString()
                : "-",
            })),
          );
        }

        if (subData.status === "fulfilled") {
          setSubscription(subData.value);
        }

        const resBookings = await getUserReservations(parsedUser.id);
        setBookings(resBookings.data || []);
      } catch (error) {
        console.error("Trainer Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    } else {
      navigate("/login");
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const renderDashboard = () => (
    <>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
            Bonjour,{" "}
            <span className="text-blue-600">
              {user?.fullname?.split(" ")[0] || user?.username}
            </span>{" "}
            ! 🎓
          </h1>
          <p className="text-xs text-slate-500 font-medium tracking-tight">
            Prêt à inspirer vos étudiants ?
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/explore/5")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
          >
            🏢 Réserver un Espace
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl"
          >
            + Créer un cours
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <DashboardStatCard
          title="Cours Créés"
          value={courses.length}
          icon="✍️"
          color="blue"
        />
        <DashboardStatCard
          title="Total Étudiants"
          value={students.length}
          icon="👥"
          color="purple"
        />
        <DashboardStatCard
          title="Sessions"
          value={sessions.length}
          icon="📅"
          color="orange"
        />
        <SubscriptionStatCard subscription={subscription} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white/40 backdrop-blur-md p-6 rounded-[28px] border border-white/60">
            <MyCoursesWidget
              courses={courses}
              onSeeAll={() => navigate("/trainer/manage")}
            />
          </div>
          <div className="bg-white/40 backdrop-blur-md p-6 rounded-[28px] border border-white/60">
            <MyStudentsWidget
              students={students}
              onSeeAll={() => navigate("/trainer/students")}
            />
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white/40 backdrop-blur-md p-6 rounded-[28px] border border-white/60">
            <UpcomingSessionsWidget sessions={sessions} />
          </div>
        </div>
      </div>
    </>
  );

  const renderManage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Gestion des Cours ✍️
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Éditez vos contenus et suivez les performances de vos cours.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
          >
            + Nouveau Cours
          </button>
          <button
            onClick={() => navigate("/trainer/dashboard")}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
          >
            ← Retour
          </button>
        </div>
      </div>
      <div className="bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/60 shadow-xl shadow-slate-200/50">
        <MyCoursesWidget courses={courses} fullPage />
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Liste des Étudiants 👥
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Gérez vos inscrits et suivez leur progression individuelle.
          </p>
        </div>
        <button
          onClick={() => navigate("/trainer/dashboard")}
          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
        >
          ← Retour
        </button>
      </div>
      <div className="bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/60 shadow-xl shadow-slate-200/50">
        <MyStudentsWidget students={students} fullPage />
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
            Gérez votre calendrier et vos réservations d'espaces.
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
            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
          >
            + Nouveau
          </button>
          <button
            onClick={() => navigate("/trainer/dashboard")}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
          >
            ← Retour
          </button>
        </div>
      </div>
      {bookingView === "calendar" ? (
        <BookingCalendar userId={user?.id} />
      ) : (
        <div className="bg-white/40 backdrop-blur-md p-8 rounded-[32px] border border-white/60 shadow-xl shadow-slate-200/50">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 font-black text-slate-400 uppercase tracking-widest">
                    Lieu
                  </th>
                  <th className="pb-4 font-black text-slate-400 uppercase tracking-widest text-center">
                    Date
                  </th>
                  <th className="pb-4 font-black text-slate-400 uppercase tracking-widest text-center">
                    Prix
                  </th>
                  <th className="pb-4 font-black text-slate-400 uppercase tracking-widest text-right">
                    Statut
                  </th>
                  <th className="pb-4 font-black text-slate-400 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map((item) => {
                  const data = item.attributes || item;
                  // Defensive mapping for nested/flat Strapi data
                  const spaceRaw = data.space?.data || data.space || {};
                  const space = spaceRaw?.attributes || spaceRaw || {};

                  // Coworking can come from space or directly from booking
                  const cwRaw = space.coworking_space?.data || space.coworking_space ||
                    data.coworking_space?.data || data.coworking_space || {};
                  const coworking = cwRaw?.attributes || cwRaw || {};

                  const startDate = new Date(data.start_time || data.date);
                  const endDate = new Date(data.end_time);

                  const getSpaceDisplayName = () => {
                    // Prioritize the actual space name or formatted mesh name
                    if (space.name) return space.name;

                    if (space.mesh_name) {
                      return space.mesh_name.replace(/bureau_/i, 'Bureau ').replace(/_/g, ' ');
                    }

                    if (space.type) {
                      const types = {
                        'meeting-room': 'Salle de Réunion',
                        'event-space': 'Espace Événementiel',
                        'hot-desk': 'Hot Desk',
                        'fixed-desk': 'Bureau Fixe'
                      };
                      return types[space.type] || space.type;
                    }

                    // 2. Redundancy Fallback: Use data stored in extras (if we started saving it)
                    if (data.extras?.spaceName) return data.extras.spaceName;

                    // 3. Last resort: Coworking name or SunSpace
                    return coworking.name || data.extras?.coworkingName || "SunSpace";
                  };

                  const totalPrice = (() => {
                    const storedPrice = Number(data.total_price || data.totalPrice || data.payment?.data?.attributes?.amount || data.payment?.amount);
                    if (storedPrice > 0) return storedPrice.toFixed(2);

                    const hours = Math.ceil((endDate - startDate) / (1000 * 60 * 60));
                    if (hours > 0) {
                      let calcPrice = 0;
                      let pHourly = space.pricing_hourly || 0;

                      if (pHourly === 0 && space.type) {
                        if (space.type === "meeting-room") pHourly = 15;
                        else if (space.type === "event-space") pHourly = 20;
                        else if (space.type === "hot-desk" || space.type === "fixed-desk") pHourly = 5;
                      }

                      if (pHourly > 0) calcPrice += hours * pHourly * (data.participants || 1);

                      (data.equipments?.data || data.equipments || []).forEach(eq => {
                        const p = eq.attributes || eq;
                        if (p.price) calcPrice += (p.price_type === 'hourly' ? p.price * hours : p.price);
                      });

                      (data.services?.data || data.services || []).forEach(sv => {
                        const p = sv.attributes || sv;
                        if (p.price) calcPrice += (p.price_type === 'hourly' ? p.price * hours : p.price);
                      });
                      return calcPrice.toFixed(2);
                    }
                    return "0.00";
                  })();

                  const spaceNameLabel = getSpaceDisplayName();

                  return (
                    <tr key={item.id}>
                      <td className="py-4 font-bold text-slate-700">
                        {spaceNameLabel}
                      </td>
                      <td className="py-4 text-center text-slate-500">
                        {startDate.toLocaleDateString()}
                      </td>
                      <td className="py-4 text-center font-black text-slate-900">
                        {totalPrice} DT
                      </td>
                      <td className="py-4 text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${data.status === "confirmed" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}
                        >
                          {data.status === 'confirmed' ? 'Confirmé' : data.status === 'cancelled' ? 'Annulé' : 'Attente'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => {
                            const eqNames = (data.equipments?.data || data.equipments || []).map(eq => (eq.attributes || eq).name).join(", ");
                            const svNames = (data.services?.data || data.services || []).map(sv => (sv.attributes || sv).name).join(", ");
                            const participants = data.participants || data.extras?.contact?.participants || 1;
                            alert(
                              `Détails : ${spaceNameLabel}\n` +
                              `Date : ${startDate.toLocaleDateString()}\n` +
                              `Heure : ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
                              `Participants : ${participants}\n` +
                              (eqNames ? `Équipements : ${eqNames}\n` : "") +
                              (svNames ? `Services : ${svNames}` : "")
                            );
                          }}
                          className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-800 underline transition-all"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {bookings.length === 0 && (
                  <tr>
                    <td
                      colSpan="3"
                      className="py-8 text-center text-slate-400 italic"
                    >
                      Aucune réservation.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
  const handleCancelSubscription = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler votre abonnement ?")) {
      try {
        const subId = subscription?.id || subscription?.documentId || subscription?.data?.id;
        if (subId) await cancelSub(subId);
        setSubscription(null);
        alert("Abonnement annulé avec succès.");
      } catch (error) {
        console.error("Erreur annulation abonnement", error);
        alert("Erreur lors de l'annulation.");
      }
    }
  };

  const renderSubscription = () => (
    <SubscriptionSection
      subscription={subscription}
      onCancel={handleCancelSubscription}
      onNavigateToPlans={() => navigate("/subscription-plans")}
    />
  );

  return (
    <DashboardLayout role="trainer" user={user} loading={loading}>
      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "manage" && renderManage()}
      {activeTab === "students" && renderStudents()}
      {activeTab === "bookings" && renderBookings()}
      {activeTab === "subscription" && renderSubscription()}
      <CreateCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={fetchData}
        trainerId={user?.id}
      />
    </DashboardLayout>
  );
};

export default TrainerDashboard;
