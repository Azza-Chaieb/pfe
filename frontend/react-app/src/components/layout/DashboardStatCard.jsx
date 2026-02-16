import React from "react";

const DashboardStatCard = ({
  title,
  value,
  icon,
  color,
  trend,
  trendValue,
}) => {
  const colors = {
    blue: "from-blue-500 to-indigo-600 shadow-blue-100",
    emerald: "from-emerald-400 to-teal-600 shadow-emerald-100",
    orange: "from-orange-400 to-red-500 shadow-orange-100",
    purple: "from-purple-500 to-indigo-700 shadow-purple-100",
    pink: "from-pink-500 to-rose-600 shadow-pink-100",
  };

  const selectedColor = colors[color] || colors.blue;

  return (
    <div className="bg-white p-6 rounded-[28px] shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-slate-50 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
      {/* Background Decorative Blob */}
      <div
        className={`absolute -right-4 -bottom-4 w-20 h-20 bg-gradient-to-br ${selectedColor} opacity-[0.03] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}
      />

      <div className="flex justify-between items-start mb-4">
        <div
          className={`w-12 h-12 bg-gradient-to-br ${selectedColor} rounded-xl flex items-center justify-center text-xl text-white shadow-xl shadow-opacity-30 transform group-hover:rotate-6 transition-transform duration-500`}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
          >
            {trend === "up" ? "↑" : "↓"} {trendValue}%
          </div>
        )}
      </div>

      <div className="space-y-0.5">
        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {title}
        </h3>
        <p className="text-2xl font-black text-slate-800 tracking-tighter">
          {value}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
          Mis à jour
        </span>
      </div>
    </div>
  );
};

export default DashboardStatCard;
