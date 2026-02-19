import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardStatCard from "../components/layout/DashboardStatCard";
import EnrolledCoursesWidget from "../components/dashboard/EnrolledCoursesWidget";
import UpcomingSessionsWidget from "../components/dashboard/UpcomingSessionsWidget";
import MyBookingsWidget from "../components/dashboard/MyBookingsWidget";
import {
  getUserReservations,
  getEnrolledCourses,
  getUpcomingSessions,
} from "../api";
import BookingCalendar from "../components/calendar/BookingCalendar";

const StudentDashboard = ({ activeTab = "dashboard" }) => {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingView, setBookingView] = useState("list"); // 'list' or 'calendar'
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setLoading(true);

        try {
          const [resReservations, resCourses, resSessions] = await Promise.all([
            getUserReservations(parsedUser.id),
            getEnrolledCourses(),
            getUpcomingSessions(),
          ]);

          setBookings(
            (resReservations.data || []).map((item) => {
              const data = item.attributes || item;
              const space = data.space?.data?.attributes || data.space || {};
              const coworking =
                data.coworking_space?.data?.attributes ||
                data.coworking_space ||
                {};

              return {
                id: item.id,
                spaceName: space.name
                  ? `${coworking.name || "Espace"} - ${space.name}`
                  : coworking.name || "Espace inconnu",
                date: new Date(data.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                }),
                time: data.time_slot || "Non spécifié",
              };
            }),
          );

          setCourses(
            (resCourses.data || []).map((item) => {
              const data = item.attributes || item;
              return {
                id: item.id,
                title: data.title,
                progress: data.progress || 0,
              };
            }),
          );

          setSessions(
            (resSessions.data || []).map((item) => {
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
        } catch (error) {
          console.error("Error loading dashboard data:", error);
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
          Content de vous revoir,{" "}
          <span className="text-blue-600">
            {user?.fullname?.split(" ")[0] || user?.username}
          </span>{" "}
          !
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Voici un aperçu de vos activités d'apprentissage et de vos
          réservations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <DashboardStatCard
          title="Cours suivis"
          value={courses.length}
          icon="📚"
          color="blue"
        />
        <DashboardStatCard
          title="Réservations"
          value={bookings.length}
          icon="📅"
          color="emerald"
        />
        <DashboardStatCard
          title="Sessions à venir"
          value={sessions.length}
          icon="⏰"
          color="purple"
        />
        <DashboardStatCard
          title="Progression moyenne"
          value={`${Math.round(courses.reduce((acc, c) => acc + (c.progress || 0), 0) / (courses.length || 1))}%`}
          icon="⚡"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white/40 backdrop-blur-md p-2 rounded-[32px] border border-white/60 shadow-xl shadow-slate-200/50">
            <EnrolledCoursesWidget
              courses={courses}
              onSeeAll={() => navigate("/student/courses")}
            />
          </div>
          <div className="bg-white/40 backdrop-blur-md p-2 rounded-[32px] border border-white/60 shadow-xl shadow-slate-200/50">
            <MyBookingsWidget
              bookings={bookings}
              onSeeAll={() => navigate("/student/bookings")}
            />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-10">
          <div className="bg-white/40 backdrop-blur-md p-2 rounded-[32px] border border-white/60 shadow-xl shadow-slate-200/50">
            <UpcomingSessionsWidget sessions={sessions} />
          </div>

          <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[32px] text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <h4 className="text-xl font-black mb-4 tracking-tight">
              Besoin d'aide ? 💡
            </h4>
            <p className="text-blue-100 text-sm leading-relaxed mb-6 font-medium">
              Explorez nos nouveaux espaces de coworking en 3D pour trouver
              l'endroit idéal pour vos révisions !
            </p>
            <button
              onClick={() => navigate("/explore/5")}
              className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Explorer les espaces
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const renderCourses = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Mes Cours 📚
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Suivez votre progression et accédez à vos ressources.
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
        >
          ← Retour
        </button>
      </div>
      <div className="bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/60 shadow-xl shadow-slate-200/50">
        <EnrolledCoursesWidget courses={courses} fullPage />
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
            Consultez et gérez vos réservations d'espaces.
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
            onClick={() => navigate("/dashboard")}
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
    <DashboardLayout role="student" user={user} loading={loading}>
      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "courses" && renderCourses()}
      {activeTab === "bookings" && renderBookings()}
    </DashboardLayout>
  );
};

export default StudentDashboard;
