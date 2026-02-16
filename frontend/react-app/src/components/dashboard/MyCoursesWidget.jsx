import React from "react";

const MyCoursesWidget = ({ courses = [], onSeeAll, fullPage = false }) => {
  return (
    <div className={`p-4 ${fullPage ? "" : ""}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          ✍️ {fullPage ? "Gestion complète des cours" : "Mes Cours"}
        </h3>
        {!fullPage && onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-[10px] font-black uppercase text-blue-600 tracking-widest hover:underline"
          >
            Gérer tout →
          </button>
        )}
      </div>

      <div
        className={`grid ${fullPage ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-4`}
      >
        {courses.length > 0 ? (
          courses.map((course) => (
            <div
              key={course.id}
              className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-lg">
                  📚
                </div>
                <span className="px-2 py-1 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                  {course.studentCount} inscrits
                </span>
              </div>
              <h4 className="font-bold text-slate-800 mb-4 group-hover:text-blue-600 transition-colors">
                {course.title}
              </h4>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <button className="text-[9px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors tracking-widest">
                  Modifier
                </button>
                <button className="text-[9px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors tracking-widest">
                  Supprimer
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-400 italic text-center py-6">
            Aucun cours créé pour le moment.
          </p>
        )}
      </div>
    </div>
  );
};

export default MyCoursesWidget;
