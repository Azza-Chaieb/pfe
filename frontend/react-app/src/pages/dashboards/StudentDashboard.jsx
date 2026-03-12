import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DashboardStatCard from "../../components/layout/DashboardStatCard";
import EnrolledCoursesWidget from "../../components/dashboard/EnrolledCoursesWidget";
import UpcomingSessionsWidget from "../../components/dashboard/UpcomingSessionsWidget";
import MyBookingsWidget from "../../components/dashboard/MyBookingsWidget";
import { getUserReservations } from "../../services/bookingService";
import {
  getEnrolledCourses,
  getUpcomingSessions,
} from "../../services/courseService";
import {
  getMySubscription,
  cancelSubscription as cancelSub,
} from "../../services/subscriptionService";
import BookingCalendar from "../../components/calendar/BookingCalendar";
import SubscriptionSection from "../../components/dashboard/SubscriptionSection";
import SubscriptionStatCard from "../../components/dashboard/SubscriptionStatCard";
import PendingPaymentBanner from "../../components/dashboard/PendingPaymentBanner";

const StudentDashboard = ({ activeTab = "dashboard" }) => {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingView, setBookingView] = useState("list");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setLoading(true);

        try {
          const [resReservations, resCourses, resSessions, subData] =
            await Promise.all([
              getUserReservations(parsedUser.id),
              getEnrolledCourses(),
              getUpcomingSessions(),
              getMySubscription(parsedUser.id),
            ]);

          setSubscription(subData);

          setBookings(
            (resReservations.data || []).map((item) => {
              const data = item.attributes || item;
              // Defensive mapping for nested/flat Strapi data
              const spaceRaw = data.space?.data || data.space || {};
              const space = spaceRaw?.attributes || spaceRaw || {};

              // Coworking can come from space or directly from booking
              const cwRaw =
                space.coworking_space?.data ||
                space.coworking_space ||
                data.coworking_space?.data ||
                data.coworking_space ||
                {};
              const coworking = cwRaw?.attributes || cwRaw || {};

              const startDate = new Date(data.start_time);
              const endDate = new Date(data.end_time);

              // Equipment/Service fallbacks
              const equipmentData =
                data.equipments?.data || data.equipments || [];
              const firstEquipment =
                equipmentData[0]?.attributes || equipmentData[0] || null;
              const serviceData = data.services?.data || data.services || [];
              const firstService =
                serviceData[0]?.attributes || serviceData[0] || null;

              // Price calculation logic
              const totalPrice = (() => {
                const storedPrice = Number(
                  data.total_price ||
                    data.totalPrice ||
                    data.payment?.data?.attributes?.amount ||
                    data.payment?.amount,
                );
                if (storedPrice > 0) return storedPrice;

                const hours = Math.ceil(
                  (endDate - startDate) / (1000 * 60 * 60),
                );
                if (hours > 0) {
                  let calcPrice = 0;
                  let pHourly = space.pricing_hourly || 0;

                  // Emergency fallback if price is missing in DB
                  if (pHourly === 0 && space.type) {
                    if (space.type === "meeting-room") pHourly = 15;
                    else if (space.type === "event-space") pHourly = 20;
                    else if (
                      space.type === "hot-desk" ||
                      space.type === "fixed-desk"
                    )
                      pHourly = 5;
                  }

                  if (pHourly > 0)
                    calcPrice += hours * pHourly * (data.participants || 1);

                  equipmentData.forEach((eq) => {
                    const p = eq.attributes || eq;
                    if (p.price)
                      calcPrice +=
                        p.price_type === "hourly" ? p.price * hours : p.price;
                  });

                  serviceData.forEach((sv) => {
                    const p = sv.attributes || sv;
                    if (p.price)
                      calcPrice +=
                        p.price_type === "hourly" ? p.price * hours : p.price;
                  });
                  return calcPrice;
                }
                return 0;
              })();

              const getSpaceDisplayName = () => {
                // Prioritize the actual space name or formatted mesh name
                if (space.name) return space.name;

                if (space.mesh_name) {
                  return space.mesh_name
                    .replace(/bureau_/i, "Bureau ")
                    .replace(/_/g, " ");
                }

                if (space.type) {
                  const types = {
                    "meeting-room": "Salle de Réunion",
                    "event-space": "Espace Événementiel",
                    "hot-desk": "Hot Desk",
                    "fixed-desk": "Bureau Fixe",
                  };
                  return types[space.type] || space.type;
                }

                // 2. Redundancy Fallback: Use data stored in extras (if we started saving it)
                if (data.extras?.spaceName) return data.extras.spaceName;

                // 3. Last resort: Coworking name or SunSpace
                return (
                  coworking.name || data.extras?.coworkingName || "SunSpace"
                );
              };

              return {
                id: item.id,
                documentId: item.documentId,
                spaceName: getSpaceDisplayName(),
                rawEndDate: endDate.toISOString(),
                date: startDate.toLocaleDateString("fr-FR", {
                  weekday: "long",

                  day: "numeric",
                  month: "short",
                }),
                status: data.status,
                totalPrice: totalPrice,
                time: `${startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
                equipmentNames: (data.equipments?.data || data.equipments || [])
                  .map((eq) => eq.attributes?.name || eq.name || "")
                  .filter(Boolean)
                  .join(", "),
                serviceNames: (() => {
                  const dbServices = (
                    data.services?.data ||
                    data.services ||
                    []
                  )
                    .map((sv) => sv.attributes?.name || sv.name || "")
                    .filter(Boolean);
                  const fallbackMap = {
                    "fallback-print": "Impression",
                    "fallback-catering": "Catering / Déjeuner",
                    "fallback-it-support": "Support Technique IT",
                    "fallback-coffee": "Cafétérie Premium",
                  };
                  const fallbackServices = Object.keys(
                    data.extras?.serviceQuantities || {},
                  )
                    .filter((id) => id.startsWith("fallback-"))
                    .map((id) => fallbackMap[id] || id);
                  return [...dbServices, ...fallbackServices].join(", ");
                })(),
                participants:
                  data.participants || data.extras?.contact?.participants || 1,
                payment_method: data.payment_method,
                payment_deadline: data.payment_deadline,
              };
            }),
          );

          setCourses(
            (resCourses.data || []).map((item) => {
              const enrollment = item.attributes || item;
              const courseData =
                enrollment.course?.data || enrollment.course || {};
              const courseAttr = courseData.attributes || courseData;

              return {
                id: courseData.id,
                documentId: courseData.documentId,
                title: courseAttr.title || "Cours sans titre",
                progress: enrollment.progress || 0,
                enrollmentId: item.id,
                status: enrollment.status,
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
        <p className="text-xs text-slate-500 font-medium whitespace-nowrap">
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
        <SubscriptionStatCard subscription={subscription} />
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
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/courses")}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
          >
            🔍 Parcourir le catalogue
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
          >
            ← Retour
          </button>
        </div>
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

  const handleCancelSubscription = async () => {
    console.log("Cancelling sub (student), current state:", subscription);
    if (window.confirm("Êtes-vous sûr de vouloir annuler votre abonnement ?")) {
      try {
        const subId =
          subscription?.id ||
          subscription?.documentId ||
          subscription?.data?.id;
        console.log("Extracted subId (numeric preferred):", subId);
        if (!subId) throw new Error("ID de l'abonnement introuvable.");

        await cancelSub(subId);
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
    <DashboardLayout role="student" user={user} loading={loading}>
      <PendingPaymentBanner bookings={bookings} />
      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "courses" && renderCourses()}
      {activeTab === "bookings" && renderBookings()}
      {activeTab === "subscription" && renderSubscription()}
    </DashboardLayout>
  );
};

export default StudentDashboard;
