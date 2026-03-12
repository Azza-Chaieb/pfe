import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import { getAllCourses } from "../../services/courseService";

const CourseCatalog = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [selectedTrainer, setSelectedTrainer] = useState("Tous");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await getAllCourses();
        if (res && res.data) {
          const mappedCourses = res.data.map((item) => {
            const data = item.attributes || item;
            const coverRaw = data.cover?.data || data.cover;
            const trainerRaw = data.trainer?.data || data.trainer;

            return {
              id: item.id,
              documentId: item.documentId,
              title: data.title || "Cours sans titre",
              category: data.category || "Général",
              description: data.description || "",
              coverUrl: coverRaw?.attributes?.url || coverRaw?.url || null,
              trainerName:
                trainerRaw?.fullname ||
                trainerRaw?.attributes?.fullname ||
                trainerRaw?.username ||
                trainerRaw?.attributes?.username ||
                "Formateur inconnu",
              studentCount: data.students?.data?.length || 0,
            };
          });
          // Only show courses with a title
          setCourses(mappedCourses.filter((c) => c.title));
        }
      } catch (error) {
        console.error("Error fetching course catalog:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Extract unique categories and trainers for filters
  const categories = [
    "Toutes",
    ...new Set(courses.map((c) => c.category).filter(Boolean)),
  ];
  const trainers = [
    "Tous",
    ...new Set(courses.map((c) => c.trainerName).filter(Boolean)),
  ];

  // Filtering Logic
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "Toutes" || course.category === selectedCategory;
    const matchesTrainer =
      selectedTrainer === "Tous" || course.trainerName === selectedTrainer;

    return matchesSearch && matchesCategory && matchesTrainer;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-900 to-blue-800 text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
            Développez vos <span className="text-blue-300">Compétences</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto font-medium">
            Explorez notre catalogue de cours créés par des experts. Trouvez la
            formation idéale pour booster votre carrière.
          </p>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 w-full mb-12">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-4 md:p-6 border border-slate-100 flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-slate-400">🔍</span>
            </div>
            <input
              type="text"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium placeholder-slate-400"
              placeholder="Que souhaitez-vous apprendre ?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700 cursor-pointer appearance-none min-w-[200px]"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundPosition: "right 1rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.5em 1.5em",
              }}
            >
              <option disabled className="text-slate-400">
                🔍 Catégorie
              </option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700 cursor-pointer appearance-none min-w-[200px]"
              value={selectedTrainer}
              onChange={(e) => setSelectedTrainer(e.target.value)}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundPosition: "right 1rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.5em 1.5em",
              }}
            >
              <option disabled className="text-slate-400">
                👨‍🏫 Formateur
              </option>
              {trainers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">
              Chargement des cours...
            </p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              Aucun cours trouvé
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Essayez de modifier vos filtres ou vos mots-clés de recherche pour
              trouver ce que vous cherchez.
            </p>
            {(searchTerm ||
              selectedCategory !== "Toutes" ||
              selectedTrainer !== "Tous") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("Toutes");
                  setSelectedTrainer("Tous");
                }}
                className="mt-6 px-6 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => navigate(`/courses/${course.documentId}`)}
                className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col"
              >
                {/* Cover Image */}
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  {course.coverUrl ? (
                    <img
                      src={`http://localhost:1337${course.coverUrl}`}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-gradient-to-br from-slate-50 to-slate-200">
                      <span className="text-5xl mb-2">📚</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Aucune image
                      </span>
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="backdrop-blur-md bg-white/90 text-slate-800 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg tracking-wider shadow-sm">
                      {course.category}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </h3>

                  <div className="flex items-center gap-2 mb-4 mt-auto pt-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs uppercase shrink-0">
                      {course.trainerName.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Formateur
                      </p>
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {course.trainerName}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <span>👥</span> {course.studentCount} inscrits
                    </span>
                    <button className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1 transition-colors">
                      Voir <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseCatalog;
