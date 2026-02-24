import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/apiClient";
import InteractiveSvgMap from "../2d/InteractiveSvgMap";
import BookingModal from "../2d/BookingModal";

const ExplorationScene = () => {
  const navigate = useNavigate();
  const { spaceId } = useParams();
  const [spaces, setSpaces] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [numericCoworkingId, setNumericCoworkingId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noSpaceFound, setNoSpaceFound] = useState(false);

  // Fetch reservations based on selected date
  useEffect(() => {
    const fetchReservations = async () => {
      if (!numericCoworkingId || !selectedDate) return;
      try {
        // Use range filters for date to avoid 500 errors with $contains on datetime fields
        const startOfDay = `${selectedDate}T00:00:00.000Z`;
        const endOfDay = `${selectedDate}T23:59:59.999Z`;

        const response = await api.get(
          `/bookings?filters[space][coworking_space][id][$eq]=${numericCoworkingId}&filters[start_time][$gte]=${startOfDay}&filters[start_time][$lt]=${endOfDay}&filters[status][$ne]=cancelled&populate=*`,
        );
        setReservations(response.data?.data || []);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      }
    };
    fetchReservations();
  }, [numericCoworkingId, selectedDate]);

  // Fetch space data (coworking space and its sub-spaces)
  useEffect(() => {
    const fetchSpaceData = async () => {
      setLoading(true);
      setNoSpaceFound(false);
      try {
        const query = isNaN(spaceId)
          ? `filters[documentId][$eq]=${spaceId}`
          : `filters[id][$eq]=${spaceId}`;

        // Deep Strapi 5 populate: Get spaces AND their equipments/services
        const endpoint = `/coworking-spaces?${query}&populate[spaces][populate][0]=equipments&populate[spaces][populate][1]=services`;
        console.log(
          "[DEBUG] Fetching coworking space with deep populate from:",
          endpoint,
        );

        const response = await api.get(endpoint);
        const results = response.data?.data || [];

        console.log("[DEBUG] API Raw Results Length:", results.length);

        if (results.length > 0) {
          const coworkingSpace = results[0];
          setNumericCoworkingId(coworkingSpace.id);

          // Strapi 5 often flattens attributes.
          // Let's check everywhere for 'spaces'
          const item = coworkingSpace;
          const attrs = item.attributes || item;

          let spacesData = [];
          if (attrs.spaces) {
            spacesData =
              attrs.spaces.data ||
              (Array.isArray(attrs.spaces) ? attrs.spaces : []);
          } else if (item.spaces) {
            spacesData =
              item.spaces.data ||
              (Array.isArray(item.spaces) ? item.spaces : []);
          }

          console.log(
            `[DEBUG] Coworking Space: ${attrs.name} (ID: ${item.id}). Spaces found: ${spacesData.length}`,
          );

          if (spacesData.length === 0) {
            console.warn(
              "[DEBUG] No spaces found in coworking-space object. Trying direct /spaces query...",
            );
            try {
              const filterKey = isNaN(spaceId) ? "documentId" : "id";
              const spaceRes = await api.get(
                `/spaces?filters[coworking_space][${filterKey}][$eq]=${spaceId}&populate[0]=equipments&populate[1]=services`,
              );
              spacesData = spaceRes.data?.data || spaceRes.data || [];
              console.log(
                `[DEBUG] Direct /spaces fallback found ${spacesData.length} spaces`,
              );
            } catch (fErr) {
              console.error("[DEBUG] Direct space fallback failed:", fErr);
            }
          }

          setSpaces(spacesData);
        } else {
          console.warn(
            "[DEBUG] No coworking space found for spaceId:",
            spaceId,
          );
          // Try fallbacks for finding the coworking space itself
          try {
            if (!isNaN(spaceId)) {
              const direct = await api.get(
                `/coworking-spaces/${spaceId}?populate=*`,
              );
              const cs = direct.data?.data || direct.data;
              if (cs) {
                const attrs = cs.attributes || cs;
                const spacesData =
                  attrs.spaces?.data ||
                  (Array.isArray(attrs.spaces) ? attrs.spaces : []);
                setNumericCoworkingId(cs.id);
                setSpaces(spacesData);
                setLoading(false);
                return;
              }
            }
          } catch (fallbackErr) {
            console.warn("[DEBUG] Fallback fetch error:", fallbackErr.message);
          }
          setNoSpaceFound(true);
        }
      } catch (err) {
        console.warn("[DEBUG] API Error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    if (spaceId) fetchSpaceData();
  }, [spaceId]);

  // Map occupancy status to spaces
  const spacesWithStatus = spaces.map((s) => {
    const spaceIdNumeric = s.id;
    const isBooked = reservations.some((r) => {
      const rAttrs = r.attributes || r;
      const resSpaceId =
        rAttrs.space?.data?.id || rAttrs.space?.id || rAttrs.space;
      return resSpaceId === spaceIdNumeric;
    });

    return {
      ...s,
      status: isBooked ? "BOOKED" : "AVAILABLE",
    };
  });

  if (loading) {
    return (
      <div className="w-full h-screen bg-[#050510] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">
            Chargement du Plan...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative bg-[#050510] overflow-hidden font-inter">
      {/* Header Info */}
      <div className="absolute top-12 left-12 z-10 pointer-events-none">
        <div className="pointer-events-auto mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              ←
            </span>{" "}
            Retour
          </button>
        </div>

        <h1 className="text-4xl font-black text-white tracking-tighter mb-1">
          SUNSPACE <span className="text-blue-500 italic">PRO</span>
        </h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mb-4">
          Plan Interactif <span className="text-white">2D</span>
        </p>

        {/* Date Selector */}
        <div className="pointer-events-auto flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 group hover:border-blue-500/30 transition-all">
          <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest">
            Voir dispo :
          </span>
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

      {noSpaceFound && (
        <div className="absolute inset-0 flex items-start justify-center pointer-events-none">
          <div className="mt-32 bg-white/6 text-white pointer-events-auto p-6 rounded-2xl border border-white/10">
            <h3 className="font-bold">Espace non trouvé</h3>
            <p className="text-sm">
              Aucun coworking space lié pour l'identifiant fourni ({spaceId}).
            </p>
          </div>
        </div>
      )}

      {/* Booking Modal Logic */}
      {selectedObject &&
        (() => {
          const normalize = (v) => (v || "").toString().toLowerCase();
          const extractDigits = (v) => {
            const m = (v || "").match(/\d+/);
            return m ? m[0] : null;
          };

          const elName = selectedObject.name || "";
          const elNorm = normalize(elName);
          const elDigits = extractDigits(elName);

          // Find the space object that matches the clicked SVG element ID
          let matched = spacesWithStatus.find((s) => {
            const sAttrs = s.attributes || s;
            const mesh = normalize(sAttrs.mesh_name || "");
            const sid = s.id ? s.id.toString() : "";
            const docId = sAttrs.documentId ? sAttrs.documentId.toString() : "";
            const name = normalize(sAttrs.name || "");

            // 1. Precise mesh_name match (highest priority)
            if (mesh && mesh === elNorm) return true;

            // 2. Element ID contains the numeric ID or documentId
            if (elDigits && (sid === elDigits || docId === elDigits))
              return true;

            // 3. Name match
            if (name && name === elNorm) return true;

            // 4. Fallback: ID exists in the element name string
            if (sid && elNorm.includes(sid.toLowerCase())) return true;

            return false;
          });

          // Final fallback to make it usable even if IDs aren't perfectly mapped yet
          if (!matched && spacesWithStatus.length > 0) {
            console.warn(
              "[ExplorationScene] No precise match for element:",
              elName,
              ". Using fallback.",
            );
            matched = spacesWithStatus[0];
          }

          return matched ? (
            <BookingModal
              key={`modal-${matched.id}`}
              space={matched}
              coworkingSpaceId={numericCoworkingId}
              initialDate={selectedDate}
              onClose={() => setSelectedObject(null)}
            />
          ) : null;
        })()}
    </div>
  );
};

export default ExplorationScene;
