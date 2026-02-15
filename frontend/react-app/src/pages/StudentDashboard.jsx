import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EnrolledCoursesWidget from "../components/dashboard/EnrolledCoursesWidget";
import UpcomingSessionsWidget from "../components/dashboard/UpcomingSessionsWidget";
import MyBookingsWidget from "../components/dashboard/MyBookingsWidget";
import {
  getUserReservations,
  getEnrolledCourses,
  getUpcomingSessions,
} from "../api";

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
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
          // Fetch data in parallel
          const [resReservations, resCourses, resSessions] = await Promise.all([
            getUserReservations(parsedUser.id),
            getEnrolledCourses(),
            getUpcomingSessions(),
          ]);

          // Map Strapi responses to widget formats (Safe handling for V4 attributes or V5 flat structure)
          setBookings(
            (resReservations.data || []).map((item) => {
              const data = item.attributes || item;
              const space =
                data.coworking_space?.data?.attributes ||
                data.coworking_space ||
                {};
              return {
                id: item.id,
                spaceName: space.name || "Espace inconnu",
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
                progress: data.progress || 0, // Default progress
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

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Chargement de votre espace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Bonjour,{" "}
              <span className="text-blue-600">
                {user.fullname || user.username}
              </span>{" "}
              ! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Heureux de vous revoir sur votre espace d'apprentissage.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/profile")}
              className="px-4 py-2 bg-white text-gray-700 font-semibold rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-all"
            >
              Gérer mon profil
            </button>
            <button
              onClick={() => navigate("/spaces")}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all"
            >
              Réserver un espace
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Left/Center) */}
          <div className="lg:col-span-2 space-y-8">
            <EnrolledCoursesWidget courses={courses} />
            <MyBookingsWidget bookings={bookings} />
          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-1">
            <UpcomingSessionsWidget sessions={sessions} />

            {/* Quick Tips or Stats card could go here */}
            <div className="mt-8 p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl text-white shadow-xl">
              <h4 className="text-lg font-bold mb-2">Astuce du jour 💡</h4>
              <p className="text-indigo-100 text-sm leading-relaxed">
                Saviez-vous que vous pouvez modifier vos préférences de
                notification par email directement depuis votre profil ?
              </p>
              <button
                onClick={() => navigate("/profile")}
                className="mt-4 text-sm font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                Voir mes réglages
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
