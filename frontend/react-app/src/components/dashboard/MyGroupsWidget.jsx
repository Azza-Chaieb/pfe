import React from "react";

const MyGroupsWidget = ({
  groups = [],
  onSeeAll,
  onManage,
  onDelete,
  fullPage = false,
}) => {
  if (groups.length === 0 && !fullPage) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <div className="text-3xl mb-3">📁</div>
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
          Aucun groupe
        </h3>
        <p className="text-[10px] text-slate-500 font-medium max-w-[150px] mt-1">
          Créez des groupes pour organiser vos étudiants.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2
          className={`${fullPage ? "text-xl" : "text-sm"} font-black text-slate-800 uppercase tracking-tight`}
        >
          {fullPage ? "Tous vos Groupes" : "Mes Groupes"} 📁
        </h2>
        {!fullPage && (
          <button
            onClick={onSeeAll}
            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
          >
            Voir tout →
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {groups.map((group) => {
          const stats = group.attributes || group;
          const memberCount = stats.students?.data?.length || stats.students?.length || 0;
          const capacity = stats.capacity || 0;
          const percent = capacity > 0 ? (memberCount / capacity) * 100 : 0;

          return (
            <div
              key={group.documentId || group.id}
              className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-black text-slate-800 tracking-tight text-sm group-hover:text-blue-600 transition-colors">
                    {stats.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                    {stats.description || "Aucune description"}
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onManage(group)}
                    className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
                    title="Gérer"
                  >
                    ⚙️
                  </button>
                  <button
                    onClick={() => onDelete(group.documentId || group.id)}
                    className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Remplissage</span>
                  <span className={percent >= 90 ? "text-red-500" : "text-blue-600"}>
                    {memberCount} / {capacity || "∞"}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${percent >= 90 ? "bg-red-500" : "bg-blue-600"}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyGroupsWidget;
