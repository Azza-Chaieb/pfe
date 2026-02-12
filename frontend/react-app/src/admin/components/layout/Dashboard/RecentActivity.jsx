import React from 'react';

const RecentActivity = ({ activities }) => {
  return (
    <div className="flex flex-col gap-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:shadow-md transition-all duration-300"
        >
          <div className="p-3 bg-white rounded-xl text-xl shadow-sm border border-slate-100">
            {activity.icon || '📝'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-700 truncate">
              {activity.user}
            </div>
            <div className="text-sm text-slate-500 truncate">
              {activity.action}
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-400 whitespace-nowrap bg-slate-100 px-2 py-1 rounded-lg">
            {activity.time}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;