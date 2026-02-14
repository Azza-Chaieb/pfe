import React from 'react';

const MyStudentsWidget = ({ students = [] }) => {
    return (
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                👥 Mes Étudiants
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-xs uppercase text-gray-400 font-bold border-b border-gray-100">
                            <th className="pb-3 px-2">Étudiant</th>
                            <th className="pb-3 px-2">Cours</th>
                            <th className="pb-3 px-2">Dernière activité</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {students.length > 0 ? (
                            students.slice(0, 5).map((student) => (
                                <tr key={student.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="py-3 px-2">
                                        <div className="font-semibold text-gray-700">{student.name}</div>
                                        <div className="text-xs text-gray-400">{student.email}</div>
                                    </td>
                                    <td className="py-3 px-2 text-sm text-gray-600">{student.courseTitle}</td>
                                    <td className="py-3 px-2 text-xs text-gray-500">{student.lastActive}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="py-6 text-center text-gray-400 italic">Aucun étudiant inscrit à vos cours pour le moment.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {students.length > 5 && (
                <button className="w-full mt-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors border-t border-gray-100 italic">
                    Voir tous les étudiants...
                </button>
            )}
        </div>
    );
};

export default MyStudentsWidget;
