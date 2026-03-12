import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import {
  getCourseById,
  enrollCourse,
  getEnrolledCourses,
  getCourseEnrollmentCount,
} from "../../services/courseService";
const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState(null);
  const [enrollSuccess, setEnrollSuccess] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        const [res, realCount] = await Promise.all([
          getCourseById(id),
          getCourseEnrollmentCount(id)
        ]);
        
        if (res && res.data) {
          const data = res.data.attributes || res.data;

          const coverRaw = data.cover?.data || data.cover;
          const trainerRaw = data.trainer?.data || data.trainer;
          const documentsRaw = data.documents?.data || data.documents || [];

          setCourse({
            id: res.data.id,
            title: data.title,
            category: data.category_rel?.name || data.category || "Non catégorisé",
            description: data.description, // Expecting RichText Blocks array
            coverUrl: coverRaw?.attributes?.url || coverRaw?.url || null,
            trainerName:
              trainerRaw?.fullname ||
              trainerRaw?.attributes?.fullname ||
              trainerRaw?.username ||
              trainerRaw?.attributes?.username ||
              "Formateur inconnu",
            studentCount: realCount,
            documents: documentsRaw.map((doc) => {
              const docData = doc.attributes || doc;
              return {
                id: doc.id,
                name: docData.name,
                url: docData.url,
                ext: docData.ext,
                size: docData.size,
                mime: docData.mime,
              };
            }),
          });

          // Check if already enrolled
          if (user) {
            const enrollmentsRes = await getEnrolledCourses();
            const enrollments = enrollmentsRes.data || [];
            const alreadyEnrolled = enrollments.some((e) => {
              const enrolledCourseId = e.course?.documentId || e.course?.id || e.course?.data?.documentId || e.course?.data?.id;
              return String(enrolledCourseId) === String(id);
            });
            setIsEnrolled(alreadyEnrolled);
          }
        } else {
          setError("Cours introuvable.");
        }
      } catch (err) {
        console.error("Error fetching course detail:", err);
        setError("Impossible de charger les détails du cours.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourseDetails();
    }
  }, [id]);

  const getFileIcon = (mimeType) => {
    if (!mimeType) return "📎";
    const mimeStr = String(mimeType).toLowerCase();

    if (mimeStr.includes("pdf")) return "📄";
    if (mimeStr.includes("video")) return "🎬";
    if (mimeStr.includes("image")) return "🖼️";
    if (mimeStr.includes("audio")) return "🎧";
    if (mimeStr.includes("word") || mimeStr.includes("document")) return "📝";
    if (mimeStr.includes("excel") || mimeStr.includes("spreadsheet"))
      return "📊";
    return "📎";
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.user_type !== "etudiant" && user.user_type !== "student") {
      setEnrollError("Seuls les étudiants peuvent s'inscrire aux cours.");
      return;
    }

    try {
      setEnrolling(true);
      setEnrollError(null);
      await enrollCourse(id);
      setIsEnrolled(true);
      setEnrollSuccess(true);
      // Auto-hide success message after 3 seconds
      setTimeout(() => setEnrollSuccess(false), 3000);
    } catch (err) {
      console.error("Enrollment error:", err);
      setEnrollError(
        err.response?.data?.error?.message ||
          err.message ||
          "Une erreur est survenue lors de l'inscription.",
      );
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">
            Chargement des détails du cours...
          </p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Oups !</h2>
          <p className="text-slate-600 mb-6 max-w-md">{error}</p>
          <button
            onClick={() => navigate("/courses")}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
          >
            Retourner au catalogue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Navbar />

      {/* Course Hero Banner */}
      <div className="relative w-full h-[400px] bg-slate-900 border-b-8 border-blue-500">
        {course.coverUrl ? (
          <img
            src={`http://localhost:1337${course.coverUrl}`}
            alt={course.title}
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-800 to-indigo-900 opacity-80"></div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>

        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-6 w-full mt-16">
            <button
              onClick={() => navigate("/courses")}
              className="text-white/70 hover:text-white font-semibold text-sm flex items-center gap-2 mb-6 group transition-colors"
            >
              <span className="group-hover:-translate-x-1 transition-transform">
                ←
              </span>{" "}
              Retour au catalogue
            </button>
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
              <div>
                <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-lg text-xs font-black uppercase tracking-widest mb-4 backdrop-blur-md">
                  {course.category}
                </span>
                <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2 drop-shadow-lg">
                  {course.title}
                </h1>
                <div className="flex items-center gap-4 text-slate-300 font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold uppercase">
                      {course.trainerName.substring(0, 2)}
                    </div>
                    <span>{course.trainerName}</span>
                  </div>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="text-blue-400">👥</span>{" "}
                    {course.studentCount} inscrits
                  </span>
                </div>
              </div>

              {isEnrolled ? (
                <div className="flex flex-col items-end gap-2">
                  <span className="px-6 py-3 bg-green-500/20 text-green-300 border border-green-500/30 rounded-xl font-black flex items-center gap-2 backdrop-blur-md">
                    <span>✅</span> Déjà inscrit
                  </span>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="text-white/60 hover:text-white text-xs font-bold underline transition-colors"
                  >
                    Voir dans mes cours
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className={`px-8 py-3 bg-white text-blue-900 hover:bg-blue-50 font-black rounded-xl shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95 whitespace-nowrap flex items-center gap-2 ${enrolling ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {enrolling && (
                    <div className="w-4 h-4 border-2 border-blue-900/20 border-t-blue-900 rounded-full animate-spin"></div>
                  )}
                  {enrolling ? "Inscription..." : "S'inscrire au cours"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Notifications */}
      {(enrollError || enrollSuccess) && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform">
          {enrollError && (
            <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-red-400">
              <span className="text-xl">⚠️</span>
              <p className="font-bold">{enrollError}</p>
              <button
                onClick={() => setEnrollError(null)}
                className="ml-4 text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}
          {enrollSuccess && (
            <div className="bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-green-400">
              <span className="text-xl">🎉</span>
              <p className="font-bold">
                Inscription réussie ! Profitez bien du cours.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow max-w-5xl mx-auto px-6 py-12 w-full grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Description & Details */}
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <span className="text-2xl">📝</span> À propos de ce cours
            </h2>
            <div className="prose prose-slate prose-blue max-w-none">
              {course.description && Array.isArray(course.description) ? (
                <div>
                  {course.description.map((block, i) => (
                    <p key={i} className="mb-4">
                      {block.children?.map((c) => c.text).join(" ")}
                    </p>
                  ))}
                </div>
              ) : course.description ? (
                <p>{String(course.description)}</p>
              ) : (
                <p className="text-slate-500 italic">
                  Aucune description détaillée n'a été fournie pour ce cours.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Files & Content List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100 sticky top-24">
            <div className="bg-slate-800 text-white p-6">
              <h3 className="font-black text-lg flex items-center gap-2">
                <span className="text-blue-400">📚</span> Contenu du cours
              </h3>
              <p className="text-slate-400 text-xs mt-1 font-medium">
                Documents et ressources téléchargeables
              </p>
            </div>

            <div className="p-2">
              {course.documents && course.documents.length > 0 ? (
                <ul className="space-y-1">
                  {course.documents.map((doc, idx) => (
                    <li key={doc.id} className="group">
                      <a
                        href={`http://localhost:1337${doc.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 text-xl group-hover:scale-110 transition-transform">
                          {getFileIcon(doc.mime)}
                        </div>
                        <div className="flex-grow min-w-0 pr-2">
                          <h4
                            className="font-bold text-sm text-slate-800 truncate group-hover:text-blue-600 transition-colors"
                            title={doc.name}
                          >
                            {idx + 1}. {doc.name}
                          </h4>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-1">
                            {doc.ext?.replace(".", "")} •{" "}
                            {formatBytes(doc.size * 1024)}
                          </p>
                        </div>
                        <div className="shrink-0 text-slate-300 group-hover:text-blue-500 transition-colors">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            ></path>
                          </svg>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center">
                  <span className="text-4xl opacity-50 block mb-3">📭</span>
                  <p className="text-slate-500 text-sm font-medium">
                    Aucun document n'a encore été ajouté par le formateur.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetail;
