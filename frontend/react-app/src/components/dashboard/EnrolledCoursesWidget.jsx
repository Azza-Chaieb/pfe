import React from 'react';

const EnrolledCoursesWidget = ({ courses = [] }) => {
    return (
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📚 Mes Cours
            </h3>
            <div className="space-y-4">
                {courses.length > 0 ? (
                    courses.map((course) => (
                        <div key={course.id} className="p-4 bg-white/50 rounded-xl border border-gray-100 transition-all hover:scale-[1.02]">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-gray-700">{course.title}</h4>
                                <span className="text-sm font-medium text-blue-600">{course.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${course.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 italic">Aucun cours en cours.</p>
                )}
            </div>
        </div>
    );
};

export default EnrolledCoursesWidget;
