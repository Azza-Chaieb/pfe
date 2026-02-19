import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/apiClient";
import InteractiveSvgMap from "../2d/InteractiveSvgMap";
import BookingModal from "../2d/BookingModal";

const ExplorationScene = () => {
  const { spaceId } = useParams();
  const [spaces, setSpaces] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [numericCoworkingId, setNumericCoworkingId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch reservations based on selected date
  useEffect(() => {
    const fetchReservations = async () => {
      if (!numericCoworkingId || !selectedDate) return;
      try {
        const response = await api.get(
          `/reservations?filters[coworking_space][id][$eq]=${numericCoworkingId}&filters[date][$eq]=${selectedDate}&filters[status][$ne]=cancelled`
        );
        setReservations(response.data?.data || []);
      } catch (err) {
        console.error("Error fetching reservations:", err);
      }
    };
    fetchReservations();
  }, [numericCoworkingId, selectedDate]);

  // Fetch space data (coworking space and its sub-spaces)
  useEffect(() => {
    const fetchSpaceData = async () => {
      setLoading(true);
      try {
        const query = isNaN(spaceId)
          ? `filters[documentId][$eq]=${spaceId}`
          : `filters[id][$eq]=${spaceId}`;
        const response = await api.get(
          `/coworking-spaces?${query}&populate[spaces][populate]=*`,
        );
        const results = response.data.data || [];

        if (results.length > 0) {
          const coworkingSpace = results[0];
          setNumericCoworkingId(coworkingSpace.id);
          const attrs = coworkingSpace.attributes || coworkingSpace;
          const spacesData = attrs.spaces?.data || attrs.spaces || [];
          setSpaces(spacesData);
        }
      } catch (err) {
        console.warn("API Error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (spaceId) fetchSpaceData();
  }, [spaceId]);

  // Map occupancy status to spaces
  const spacesWithStatus = spaces.map(s => {
    const spaceIdNumeric = s.id;
    const isBooked = reservations.some(r => {
      const resSpaceId = r.attributes?.space?.data?.id || r.space?.id;
      return resSpaceId === spaceIdNumeric;
    });

    return {
      ...s,
      status: isBooked ? "BOOKED" : "AVAILABLE"
    };
  });

  if (loading) {
    return (
      <div className="w-full h-screen bg-[#050510] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">Chargement du Plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative bg-[#050510] overflow-hidden font-inter">
      {/* Header Info */}
      <div className="absolute top-12 left-12 z-10 pointer-events-none">
        <h1 className="text-4xl font-black text-white tracking-tighter mb-1">
          SUNSPACE <span className="text-blue-500 italic">PRO</span>
        </h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mb-4">
          Plan Interactif <span className="text-white">2D</span>
        </p>

        {/* Date Selector */}
        <div className="pointer-events-auto flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 group hover:border-blue-500/30 transition-all">
          <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Voir dispo :</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-white text-[11px] font-bold focus:outline-none cursor-pointer invert brightness-200"
          />
        </div>
      </div>

      {/* 2D Map Container */}
      <div className="w-full h-full pt-32 pb-12 px-12 transition-all duration-700">
        <InteractiveSvgMap
          svgUrl="/plan_v2.svg"
          spaces={spacesWithStatus}
          selectedSpaceId={selectedObject?.name}
          onSelectSpace={(id) => setSelectedObject({ name: id })}
        />
      </div>

      {/* Booking Modal */}
      <BookingModal
        space={spacesWithStatus.find(
          (s) => (s.attributes?.mesh_name || s.mesh_name) === selectedObject?.name,
        )}
        coworkingSpaceId={numericCoworkingId}
        initialDate={selectedDate}
        onClose={() => setSelectedObject(null)}
      />

    </div>
  );
};

export default ExplorationScene;
