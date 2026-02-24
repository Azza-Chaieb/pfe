import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const TeacherDashboard = () => {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setLoading(true);

      try {
        const fetchCourses = async () => {
          try {
            const res = await getTrainerCourses(parsedUser.id);
            setCourses(
              (res.data || []).map((item) => {
                const data = item.attributes || item;
                return {
                  id: item.id,
                  title: data.title,
                  studentCount: data.students?.data
                    ? data.students.data.length
                    : data.students?.length || 0,
                };
              }),
            );
          } catch (err) {
            console.error("Error fetching courses:", err);
          }
        };

        const fetchSessions = async () => {
          try {
            const res = await getUpcomingSessions();
            setSessions(
              (res.data || []).map((item) => {
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
          } catch (err) {
            console.error("Error fetching sessions:", err);
          }
        };

        const fetchStudents = async () => {
          try {
            const res = await getTrainerStudents(parsedUser.id);
            setStudents(
              (res || []).map((student) => ({
                id: student.id,
                name: student.fullname || student.username,
                email: student.email,
                courseTitle: student.courseTitle || "Aucun cours spécifié",
                lastActive: student.updatedAt
                  ? new Date(student.updatedAt).toLocaleDateString("fr-FR")
                  : "Inconnu",
              })),
            );
          } catch (err) {
            console.error("Error fetching students:", err);
          }
        };

        await Promise.allSettled([
          fetchCourses(),
          fetchSessions(),
          fetchStudents(),
        ]);
      } catch (error) {
        console.error("General error loading trainer dashboard:", error);
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

  const handleCreateCourse = async (courseData) => {
    try {
      await createCourse(courseData);
      await fetchData();
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Erreur lors de la création du cours. Veuillez réessayer.");
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Chargement de votre espace enseignant...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Bonjour,{" "}
              <span className="text-indigo-600">
                {user.fullname || user.username}
              </span>{" "}
              ! 🎓
            </h1>
            <p className="text-gray-600 mt-1">
              Bienvenue sur votre tableau de bord de gestion des cours.
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
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all"
              onClick={() => setIsModalOpen(true)}
            >
              + Créer un cours
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <MyCoursesWidget courses={courses} />
            <MyStudentsWidget students={students} />
          </div>
          <div className="lg:col-span-1">
            <UpcomingSessionsWidget sessions={sessions} />
            <div className="mt-8 p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl text-white shadow-xl">
              <h4 className="text-lg font-bold mb-2">Astuce Enseignant 💡</h4>
              <p className="text-indigo-100 text-sm leading-relaxed">
                Un bon feedback motive les élèves à se surpasser !
              </p>
            </div>
          </div>
        </div>
      </div>
      <CreateCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateCourse}
        trainerId={user.id}
      />
    </div>
  );
};

export default TeacherDashboard;
