import React from "react";

const MyStudentsWidget = ({ students = [], onSeeAll, fullPage = false }) => {
  return (
    <div className={`p-4 ${fullPage ? "" : ""}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          👥 {fullPage ? "Annuaire des étudiants" : "Mes Étudiants"}
        </h3>
        {!fullPage && onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-[10px] font-black uppercase text-purple-600 tracking-widest hover:underline"
          >
            Annuaire complet →
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="px-4 py-2 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">
                Étudiant
              </th>
              <th className="px-4 py-2 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">
                Cours
              </th>
              {fullPage && (
                <th className="px-4 py-2 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  Email
                </th>
              )}
              <th className="px-4 py-2 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">
                Dernière activité
              </th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((student) => (
                <tr
                  key={student.id}
                  className="bg-white/50 hover:bg-white transition-all group"
                >
                  <td className="px-4 py-3 rounded-l-xl border-y border-l border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">
                        {student.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-700 text-sm">
                        {student.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-y border-slate-50">
                    <span className="text-xs font-medium text-slate-500">
                      {student.courseTitle}
                    </span>
                  </td>
                  {fullPage && (
                    <td className="px-4 py-3 border-y border-slate-50">
                      <span className="text-xs text-blue-500 font-medium">
                        {student.email}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 rounded-r-xl border-y border-r border-slate-50 text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {student.lastActive}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={fullPage ? 4 : 3}
                  className="text-center py-6 text-slate-400 italic"
                >
                  Aucun étudiant inscrit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {fullPage && (
        <div className="mt-8 flex justify-center">
          <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl">
            Exporter la liste (.CSV)
          </button>
        </div>
      )}
    </div>
  );
};

export default MyStudentsWidget;
