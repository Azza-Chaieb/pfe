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
        const response = await api.get(
          `/reservations?filters[coworking_space][id][$eq]=${numericCoworkingId}&filters[date][$eq]=${selectedDate}&filters[status][$ne]=cancelled`,
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
      setNoSpaceFound(false);
      try {
        const query = isNaN(spaceId)
          ? `filters[documentId][$eq]=${spaceId}`
          : `filters[id][$eq]=${spaceId}`;

        const endpoint = `/coworking-spaces?${query}&populate[spaces][populate]=*`;
        console.log("[DEBUG] Fetching coworking space from:", endpoint);

        const response = await api.get(endpoint);
        console.log(
          "[DEBUG] API Response Data:",
          JSON.stringify(response.data, null, 2),
        );

        const results = response.data?.data || [];
        console.log("[DEBUG] Results length:", results.length);

        if (results.length > 0) {
          const coworkingSpace = results[0];
          setNumericCoworkingId(coworkingSpace.id);
          // In Strapi 5, directly access attributes or use the root object
          const attrs = coworkingSpace.attributes || coworkingSpace;
          const spacesData = attrs.spaces?.data || attrs.spaces || [];

          console.log(
            "[DEBUG] Found Coworking space:",
            coworkingSpace.id,
            attrs.name,
          );
          setSpaces(spacesData);
        } else {
          console.warn(
            "[DEBUG] No coworking space found for spaceId:",
            spaceId,
          );
          // Try fallbacks: direct GET by id, or search spaces collection by id/documentId
          try {
            // If numeric, try direct fetch by resource id
            if (!isNaN(spaceId)) {
              console.log(
                "[DEBUG] Trying fallback: GET /coworking-spaces/{id}",
              );
              const direct = await api.get(
                `/coworking-spaces/${spaceId}?populate[spaces][populate]=*`,
              );
              if (direct.data) {
                const cs = direct.data;
                // Strapi single-entity response may be in data or root
                const coworkingSpace = cs.data || cs;
                if (coworkingSpace) {
                  const attrs = coworkingSpace.attributes || coworkingSpace;
                  const spacesData = attrs.spaces?.data || attrs.spaces || [];
                  if (spacesData && spacesData.length > 0) {
                    setNumericCoworkingId(coworkingSpace.id || coworkingSpace);
                    setSpaces(spacesData);
                    setLoading(false);
                    return;
                  }
                }
              }
            }

            // Try to find a space directly in the spaces collection
            console.log(
              "[DEBUG] Trying fallback: search /spaces by id or documentId",
            );
            const spaceQuery = isNaN(spaceId)
              ? `/spaces?filters[documentId][$eq]=${spaceId}&populate=*`
              : `/spaces?filters[id][$eq]=${spaceId}&populate=*`;
            const spaceRes = await api.get(spaceQuery);
            const spaceResults = spaceRes.data?.data || [];
            if (spaceResults.length > 0) {
              // If we found a space directly, set it as the only space in the view
              setSpaces(spaceResults);
              // Try to extract parent coworking space id if available
              const parentCoworking =
                spaceResults[0].attributes?.coworking_space?.data?.id ||
                spaceResults[0].attributes?.coworking_space?.id ||
                null;
              if (parentCoworking) setNumericCoworkingId(parentCoworking);
              setLoading(false);
              return;
            }
            // If still nothing, try direct GET /spaces/{id} (useful when URL contains a space id)
            if (!isNaN(spaceId)) {
              try {
                console.log(
                  "[DEBUG] Trying fallback: GET /spaces/{id}",
                  spaceId,
                );
                const directSpace = await api.get(
                  `/spaces/${spaceId}?populate=*`,
                );
                const sp = directSpace.data?.data || directSpace.data || null;
                if (sp) {
                  // Wrap into array to reuse rendering
                  setSpaces([sp]);
                  const parentCoworking =
                    sp.attributes?.coworking_space?.data?.id ||
                    sp.attributes?.coworking_space?.id ||
                    null;
                  if (parentCoworking) setNumericCoworkingId(parentCoworking);
                  setLoading(false);
                  return;
                }
              } catch (dErr) {
                console.warn(
                  "[DEBUG] Direct space GET failed:",
                  dErr?.message || dErr,
                );
              }
            }
          } catch (fallbackErr) {
            console.warn(
              "[DEBUG] Fallback fetch error:",
              fallbackErr?.message || fallbackErr,
            );
          }

          // If we reach here, nothing matched
          setNoSpaceFound(true);
        }
      } catch (err) {
        console.warn("[DEBUG] API Error:", err.message);
        if (err.response) {
          console.warn("[DEBUG] Error status:", err.response.status);
          console.warn(
            "[DEBUG] Error data:",
            JSON.stringify(err.response.data, null, 2),
          );
        }
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
      const resSpaceId = r.attributes?.space?.data?.id || r.space?.id;
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

  // If noSpaceFound we still render the map but show a small non-blocking notice.

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

      {/* Booking Modal */}
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

          let matched = spacesWithStatus.find((s) => {
            const mesh = normalize(
              s.attributes?.mesh_name || s.mesh_name || "",
            );
            const sid = s.id ? s.id.toString() : "";
            const docId = s.attributes?.documentId
              ? s.attributes.documentId.toString()
              : "";
            const name = normalize(s.attributes?.name || s.name || "");

            if (mesh && mesh === elNorm) return true;
            if (mesh && mesh.includes(elNorm)) return true;
            if (elDigits && (sid === elDigits || docId === elDigits))
              return true;
            if (name && name === elNorm) return true;
            return false;
          });

          // If still no match, fallback to first space
          if (!matched && spacesWithStatus.length > 0)
            matched = spacesWithStatus[0];

          return matched ? (
            <BookingModal
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
