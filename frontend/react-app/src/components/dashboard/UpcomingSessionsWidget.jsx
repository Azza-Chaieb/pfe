import React from "react";

const UpcomingSessionsWidget = ({ sessions = [] }) => {
  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        ⏰ Sessions à venir
      </h3>
      <div className="space-y-4">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <div
              key={session.id}
              onClick={() =>
                alert(
                  `Session : ${session.title}\nLieu : ${session.location}\nHeure : ${session.time}`,
                )
              }
              className="flex gap-4 p-4 items-start border-l-4 border-orange-400 bg-orange-50/50 rounded-r-xl transition-all hover:bg-orange-100/60 cursor-pointer hover:shadow-sm"
            >
              <div className="text-center min-w-[50px]">
                <div className="text-lg font-bold text-orange-600">
                  {session.day}
                </div>
                <div className="text-xs uppercase text-gray-500">
                  {session.month}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">{session.title}</h4>
                <p className="text-sm text-gray-600">
                  {session.time} • {session.location}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">Aucune session prévue.</p>
        )}
      </div>
    </div>
  );
};

export default UpcomingSessionsWidget;
