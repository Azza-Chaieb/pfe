import React from 'react';

const MyCoursesWidget = ({ courses = [] }) => {
    return (
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    📖 Mes Cours
                </h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                    {courses.length} Cours
                </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.length > 0 ? (
                    courses.map((course) => (
                        <div key={course.id} className="group p-4 bg-white/50 rounded-xl border border-gray-100 hover:border-blue-300 transition-all hover:shadow-md cursor-pointer">
                            <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{course.title}</h4>
                            <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                                <span className="flex items-center gap-1">👥 {course.studentCount} Étudiants</span>
                                <span className="flex items-center gap-1">⭐ {course.rating || 'N/A'}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 italic col-span-2 py-4">Vous n'avez pas encore créé de cours.</p>
                )}
            </div>
        </div>
    );
};

export default MyCoursesWidget;
