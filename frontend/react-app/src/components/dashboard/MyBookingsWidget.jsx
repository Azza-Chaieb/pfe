import React from "react";

const MyBookingsWidget = ({ bookings = [], onSeeAll, fullPage = false }) => {
  return (
    <div
      className={`bg-white/80 backdrop-blur-md p-6 rounded-2xl ${fullPage ? "" : "shadow-xl border border-white/20"}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          📍 {fullPage ? "Gestion de mes réservations" : "Mes Réservations"}
        </h3>
        {!fullPage && onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-[10px] font-black uppercase text-emerald-600 tracking-widest hover:underline"
          >
            Historique complet →
          </button>
        )}
      </div>

      <div
        className={`grid grid-cols-1 ${fullPage ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-1 lg:grid-cols-2"} gap-4`}
      >
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="font-bold text-blue-800 mb-1">
                {booking.spaceName}
              </div>
              <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <span className="opacity-60">📅</span> {booking.date}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] px-2.5 py-1 bg-white text-blue-700 rounded-full font-black uppercase border border-blue-50 shadow-sm">
                  {booking.time}
                </span>
                <button
                  onClick={() =>
                    alert(
                      `Détails de la réservation pour : ${booking.spaceName}\nDate : ${booking.date}\nHeure : ${booking.time}`,
                    )
                  }
                  className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-800 tracking-widest underline decoration-2 underline-offset-4 decoration-blue-200"
                >
                  Détails
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic col-span-full py-4 text-center">
            Aucun espace réservé actuellement.
          </p>
        )}
      </div>

      {fullPage && (
        <div className="mt-10 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 text-center">
          <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mb-4">
            Besoin d'un nouvel espace ?
          </p>
          <a
            href="/spaces"
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:scale-[1.02] transition-all"
          >
            Explorer le catalogue 3D
          </a>
        </div>
      )}
    </div>
  );
};

export default MyBookingsWidget;
