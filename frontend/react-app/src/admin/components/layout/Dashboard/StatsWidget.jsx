import React from 'react';

const StatsWidget = ({ title, value, change, icon, color = '#3b82f6' }) => {
  const isPositive = change.startsWith('+');

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-white/60 hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-start justify-between mb-4">
        <div
          className="flex items-center justify-center w-14 h-14 rounded-2xl text-2xl shadow-lg"
          style={{
            backgroundColor: color,
            boxShadow: `0 8px 20px -6px ${color}80`
          }}
        >
          {icon}
        </div>
        {change && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {change}
          </span>
        )}
      </div>
      <div>
        <h4 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">{title}</h4>
        <div className="text-2xl font-black text-slate-800 tracking-tight">
          {value}
        </div>
      </div>
      <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: isPositive ? '70%' : '30%',
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};

export default StatsWidget;