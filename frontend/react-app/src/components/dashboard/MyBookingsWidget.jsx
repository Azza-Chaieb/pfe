import React from 'react';

const MyBookingsWidget = ({ bookings = [] }) => {
    return (
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📍 Mes Réservations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.length > 0 ? (
                    bookings.map((booking) => (
                        <div key={booking.id} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm">
                            <div className="font-bold text-blue-800 mb-1">{booking.spaceName}</div>
                            <div className="text-sm text-gray-600 mb-2">📅 {booking.date}</div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">{booking.time}</span>
                                <button className="text-xs text-blue-600 hover:underline">Détails</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 italic col-span-full">Aucun espace réservé.</p>
                )}
            </div>
        </div>
    );
};

export default MyBookingsWidget;
