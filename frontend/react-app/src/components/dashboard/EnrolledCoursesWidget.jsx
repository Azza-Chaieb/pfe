import React from "react";

const EnrolledCoursesWidget = ({
  courses = [],
  onSeeAll,
  fullPage = false,
}) => {
  return (
    <div
      className={`bg-white/80 backdrop-blur-md p-6 rounded-2xl ${fullPage ? "" : "shadow-xl border border-white/20"}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          📚 {fullPage ? "Catalogue de mes cours" : "Mes Cours"}
        </h3>
        {!fullPage && onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-[10px] font-black uppercase text-blue-600 tracking-widest hover:underline"
          >
            Voir tout →
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
              onClick={() =>
                alert(
                  `Accès au cours : ${course.title}\nProgression : ${course.progress}%`,
                )
              }
              className="p-4 bg-white/50 rounded-xl border border-gray-100 transition-all hover:scale-[1.02] cursor-pointer hover:bg-white hover:shadow-md group"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                  {course.title}
                </h4>
                <span className="text-sm font-medium text-blue-600">
                  {course.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
              {fullPage && (
                <div className="mt-4 flex justify-end">
                  <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                    Continuer →
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic py-4">Aucun cours en cours.</p>
        )}
      </div>
    </div>
  );
};

export default EnrolledCoursesWidget;
