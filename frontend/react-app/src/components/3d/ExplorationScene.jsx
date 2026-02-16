import React, { Suspense, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Html,
  useProgress,
  Center,
} from "@react-three/drei";
import * as THREE from "three";
import api from "../../services/apiClient";
import { createReservation } from "../../services/bookingService";

const API_BASE_URL = "http://192.168.100.97:1337";

/**
 * Maps space status to colors for the 3D view.
 */
const getSpaceStatus = (space) => {
  if (!space) return "AVAILABLE";
  return "AVAILABLE"; // Logic can be extended for real booking checks
};

const COLORS = {
  AVAILABLE: "#10b981",
  BOOKED: "#ef4444",
  PARTIAL: "#f59e0b",
  SELECTED: "#3b82f6",
};

/**
 * 3D Model Component with interaction handlers.
 */
function Model({ url, onSelect, onHover, selectedName }) {
  const { scene } = useGLTF(url);
  const [localHovered, setLocalHovered] = useState(null);

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child.isMesh) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        const spaceData = onSelect.spaces?.find(
          (s) => (s.attributes?.mesh_name || s.mesh_name) === child.name,
        );

        const floor = spaceData?.attributes?.floor ?? spaceData?.floor;
        const isCurrentFloor =
          onSelect.activeFloor === null || floor === onSelect.activeFloor;

        const status = spaceData ? getSpaceStatus(spaceData) : "AVAILABLE";
        const baseColor = new THREE.Color(COLORS[status]);

        materials.forEach((mat) => {
          if (!mat) return;
          const isSelected =
            child.name === selectedName || child.parent?.name === selectedName;
          const isHovered =
            child.name === localHovered || child.parent?.name === localHovered;

          // Visual Feedback for filtering
          if (isSelected) {
            mat.color.set(COLORS.SELECTED);
            mat.opacity = 1;
            if (mat.emissive) {
              mat.emissive.setHex(0x3b82f6);
              mat.emissiveIntensity = 0.5;
            }
          } else if (isHovered && isCurrentFloor) {
            mat.color.set(baseColor).lerp(new THREE.Color("#ffffff"), 0.3);
            mat.opacity = 1;
            if (mat.emissive) mat.emissiveIntensity = 0.1;
          } else {
            mat.color.set(baseColor);
            mat.opacity = isCurrentFloor ? 1 : 0.15; // Fade out other floors
            mat.transparent = true;
            if (mat.emissive) mat.emissiveIntensity = 0;
          }
        });
      }
    });
  }, [
    scene,
    selectedName,
    localHovered,
    onSelect.spaces,
    onSelect.activeFloor,
  ]);

  return (
    <Center top>
      <primitive
        object={scene}
        onPointerDown={(e) => {
          e.stopPropagation();
          const name = e.object.name || e.object.parent?.name;
          const space = onSelect.spaces?.find(
            (s) => (s.attributes?.mesh_name || s.mesh_name) === name,
          );
          const floor = space?.attributes?.floor ?? space?.floor;

          if (onSelect.activeFloor === null || floor === onSelect.activeFloor) {
            onSelect({ name: name || "Space", point: e.point });
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          const name = e.object.name || e.object.parent?.name;
          const space = onSelect.spaces?.find(
            (s) => (s.attributes?.mesh_name || s.mesh_name) === name,
          );
          const floor = space?.attributes?.floor ?? space?.floor;

          if (onSelect.activeFloor === null || floor === onSelect.activeFloor) {
            setLocalHovered(name);
            onHover({ name, point: e.point });
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => {
          setLocalHovered(null);
          onHover(null);
          document.body.style.cursor = "auto";
        }}
        onPointerMissed={() => onSelect(null)}
        castShadow
        receiveShadow
      />
    </Center>
  );
}

/**
 * Legend component for 3D availability.
 */
const Legend = () => (
  <div className="absolute bottom-10 left-10 z-10 bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-2xl">
    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
      Disponibilité
    </h4>
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[#10b981]" />
        <span className="text-white text-xs font-medium">Disponible</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
        <span className="text-blue-400 text-xs font-bold italic">
          Sélectionné
        </span>
      </div>
    </div>
  </div>
);

/**
 * Floor Selector UI Component.
 */
const FloorSelector = ({ floors, activeFloor, onChange }) => {
  // Force show for testing/alignment if there's data, or even if empty for debug
  // if (floors.length === 0) return null;

  return (
    <div className="absolute left-12 top-1/2 -translate-y-1/2 z-[20] flex flex-col gap-4">
      <div className="bg-slate-900/40 backdrop-blur-2xl p-2 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col gap-2">
        <button
          onClick={() => onChange(null)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 font-black text-[10px] uppercase tracking-tighter ${
            activeFloor === null
              ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              : "text-slate-400 hover:bg-white/5"
          }`}
        >
          ALL
        </button>
        <div className="w-8 h-[1px] bg-white/5 mx-auto my-1" />
        {floors
          .sort((a, b) => a - b)
          .map((floor) => (
            <button
              key={floor}
              onClick={() => onChange(floor)}
              className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-500 group ${
                activeFloor === floor
                  ? "bg-white text-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  : "text-slate-500 hover:bg-white/5"
              }`}
            >
              <span
                className={`text-[8px] font-black uppercase mb-[-2px] ${activeFloor === floor ? "opacity-50" : "opacity-30"}`}
              >
                {floor === 0 ? "Base" : "Niv."}
              </span>
              <span className="text-lg font-black">
                {floor === 0 ? "RDC" : floor}
              </span>
            </button>
          ))}
      </div>
      {floors.length === 0 && (
        <p className="text-[8px] font-bold text-blue-400/50 uppercase tracking-widest mt-2 text-center bg-blue-500/5 p-2 rounded-lg border border-blue-500/10 italic">
          Configuré les étages <br /> dans Strapi (Space)
        </p>
      )}
      <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] text-center rotate-180 [writing-mode:vertical-lr]">
        Navigation par étages
      </p>
    </div>
  );
};

/**
 * Loading component for 3D assets.
 */
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="bg-slate-900/90 text-white px-6 py-3 rounded-2xl font-black text-sm tracking-widest backdrop-blur-xl border border-white/10 animate-pulse">
        CHARGEMENT {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

/**
 * Detailed Information Panel for selected spaces.
 */
const DetailedInfoPanel = ({ space, coworkingSpaceId, onClose }) => {
  const [quantities, setQuantities] = useState({});
  const [bookingLoading, setBookingLoading] = useState(false);
  const navigate = useNavigate();

  if (!space) return null;
  const attrs = space.attributes || space;
  const status = getSpaceStatus(space);
  const equipmentsList = attrs.equipments?.data || attrs.equipments || [];
  const servicesList = attrs.services?.data || attrs.services || [];

  const updateQuantity = (id, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const handleBooking = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Veuillez vous connecter pour réserver.");
      navigate("/login");
      return;
    }

    setBookingLoading(true);
    try {
      const selectedExtras = Object.entries(quantities)
        .filter(([_, q]) => q > 0)
        .reduce((acc, [id, q]) => ({ ...acc, [id]: q }), {});

      const reservationData = {
        user: user.id,
        coworking_space: coworkingSpaceId,
        space: space.id,
        date: new Date().toISOString().split("T")[0], // Default to today
        time_slot: "Full Day",
        extras: selectedExtras,
      };

      await createReservation(reservationData);
      alert("Réservation réussie !");

      const targetDashboard =
        user.user_type === "professional"
          ? "/professional/bookings"
          : "/student/bookings";
      navigate(targetDashboard);
    } catch (error) {
      console.error("Booking error:", error);
      alert("Erreur lors de la réservation.");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="absolute top-0 right-0 h-full w-[400px] z-[100] bg-slate-900/40 backdrop-blur-3xl border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] animate-slide-left overflow-y-auto">
      <div className="p-10">
        <button
          onClick={onClose}
          className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all text-white mb-10"
        >
          ✕
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{
              background: COLORS[status],
              boxShadow: `0 0 10px ${COLORS[status]}`,
            }}
          />
          <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">
            Disponible immédiatement
          </span>
        </div>
        <h2 className="text-4xl font-black text-white tracking-tighter leading-tight mb-2 uppercase italic">
          {attrs.name}
        </h2>
        <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">
          {attrs.description || "Espace premium conçu pour la productivité."}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
              Prix Journalier
            </span>
            <span className="text-xl font-black text-blue-400">
              {attrs.pricing_daily || "25"}{" "}
              <span className="text-xs uppercase">DTN</span>
            </span>
          </div>
          <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
              Capacité
            </span>
            <span className="text-xl font-black text-white">
              {attrs.capacity || 1}{" "}
              <span className="text-xs uppercase">Pers.</span>
            </span>
          </div>
        </div>
        <div className="space-y-8 mb-12">
          {equipmentsList.length > 0 && (
            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4">
                📦 Équipements & Quantité
              </h4>
              <div className="flex flex-col gap-3">
                {equipmentsList.map((eq, i) => {
                  const id = eq.id || `eq-${i}`;
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/10 transition-all"
                    >
                      <span className="text-xs font-bold text-slate-300">
                        {eq.attributes?.name || eq.name}
                      </span>
                      <div className="flex items-center gap-3 bg-black/20 rounded-xl p-1 border border-white/5">
                        <button
                          onClick={() => updateQuantity(id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-white hover:text-blue-400 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-[10px] font-black text-blue-400 min-w-[20px] text-center">
                          {quantities[id] || 0}
                        </span>
                        <button
                          onClick={() => updateQuantity(id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-white hover:text-blue-400 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {servicesList.length > 0 && (
            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4">
                ⚡ Services & Options
              </h4>
              <div className="flex flex-col gap-3">
                {servicesList.map((sv, i) => {
                  const id = sv.id || `sv-${i}`;
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl group hover:bg-blue-500/10 transition-all"
                    >
                      <span className="text-xs font-bold text-blue-200">
                        {sv.attributes?.name || sv.name}
                      </span>
                      <div className="flex items-center gap-3 bg-black/20 rounded-xl p-1 border border-blue-500/10">
                        <button
                          onClick={() => updateQuantity(id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-white hover:text-blue-400 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-[10px] font-black text-blue-400 min-w-[20px] text-center">
                          {quantities[id] || 0}
                        </span>
                        <button
                          onClick={() => updateQuantity(id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-white hover:text-blue-400 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleBooking}
          disabled={bookingLoading}
          className={`w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[2rem] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${bookingLoading ? "opacity-50 cursor-wait" : ""}`}
        >
          {bookingLoading ? "Traitement..." : "Confirmer la sélection"}{" "}
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Main 3D Exploration Scene component.
 */
const ExplorationScene = () => {
  const { spaceId } = useParams();
  const [modelUrl, setModelUrl] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [error, setError] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [hoveredObject, setHoveredObject] = useState(null);
  const [activeFloor, setActiveFloor] = useState(null);

  // Extract unique floors
  const availableFloors = Array.from(
    new Set(
      spaces
        .map((s) => s.attributes?.floor ?? s.floor)
        .filter((f) => f !== undefined && f !== null),
    ),
  );

  console.log("DEBUG: Spaces fetched:", spaces);
  console.log("DEBUG: Available floors calculated:", availableFloors);

  useEffect(() => {
    const fetchSpaceData = async () => {
      try {
        const query = isNaN(spaceId)
          ? `filters[documentId][$eq]=${spaceId}`
          : `filters[id][$eq]=${spaceId}`;
        const response = await api.get(
          `/coworking-spaces?${query}&populate[models][populate]=file&populate[spaces][populate]=*`,
        );
        const results = response.data.data || [];
        if (results.length > 0) {
          const coworkingSpace = results[0];
          const attrs = coworkingSpace.attributes || coworkingSpace;
          setSpaces(attrs.spaces?.data || attrs.spaces || []);
          const models = attrs.models?.data || attrs.models || [];
          if (models.length > 0) {
            const modelData = models[0].attributes || models[0];
            const modelFile =
              modelData.file?.data?.attributes || modelData.file;
            if (modelFile?.url) setModelUrl(`${API_BASE_URL}${modelFile.url}`);
            else setError("Modèle 3D manquant.");
          } else setError("Aucun modèle 3D configuré.");
        } else setError("Centre introuvable.");
      } catch (err) {
        setError("Erreur de chargement.");
      }
    };
    if (spaceId) fetchSpaceData();
  }, [spaceId]);

  return (
    <div className="w-full h-screen relative bg-[#050510] overflow-hidden font-inter">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-12 left-12 z-10 pointer-events-none">
        <h1 className="text-4xl font-black text-white tracking-tighter mb-1">
          SUNSPACE <span className="text-blue-500 italic">PRO</span>
        </h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">
          Vue Interactive 3D
        </p>
      </div>
      <Legend />
      <FloorSelector
        floors={availableFloors}
        activeFloor={activeFloor}
        onChange={(f) => {
          setActiveFloor(f);
          setSelectedObject(null); // Clear selection when floor changes
        }}
      />
      <DetailedInfoPanel
        space={spaces.find(
          (s) =>
            (s.attributes?.mesh_name || s.mesh_name) === selectedObject?.name,
        )}
        coworkingSpaceId={spaceId}
        onClose={() => setSelectedObject(null)}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-slate-950/80 backdrop-blur-xl">
          <div className="text-center p-12 bg-white/5 border border-white/10 rounded-[3rem] max-w-md shadow-2xl">
            <span className="text-6xl mb-6 block">⚠️</span>
            <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">
              {error}
            </h3>
            <button
              onClick={() => (window.location.href = "/spaces")}
              className="px-8 py-4 bg-blue-600 text-white font-black text-[10px] uppercase rounded-2xl"
            >
              Retour
            </button>
          </div>
        </div>
      )}
      <Canvas
        shadows
        camera={{ position: [10, 8, 10], fov: 40 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#030308"]} />
        <fog attach="fog" args={["#030308", 15, 30]} />
        <Suspense fallback={<Loader />}>
          <ambientLight intensity={0.5} />
          <spotLight
            position={[15, 20, 10]}
            intensity={2}
            angle={0.3}
            penumbra={1}
            castShadow
          />
          {modelUrl && (
            <Model
              url={modelUrl}
              onSelect={Object.assign((obj) => setSelectedObject(obj), {
                spaces,
                activeFloor,
              })}
              onHover={setHoveredObject}
              selectedName={selectedObject?.name}
            />
          )}
          {hoveredObject && !selectedObject && (
            <Html position={hoveredObject.point}>
              <div className="pointer-events-none -translate-x-1/2 -translate-y-[120%] bg-slate-900 shadow-2xl border border-white/20 p-4 rounded-2xl backdrop-blur-md animate-fade-in">
                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
                  Espace
                </div>
                <div className="text-white font-black uppercase text-sm tracking-tight truncate">
                  {(() => {
                    const space = spaces.find(
                      (s) =>
                        (s.attributes?.mesh_name || s.mesh_name) ===
                        hoveredObject.name,
                    );
                    if (space) return space.attributes?.name || space.name;
                    return hoveredObject.name === "pDuck" ||
                      hoveredObject.name.includes("Shape")
                      ? "Espace de test"
                      : hoveredObject.name;
                  })()}
                </div>
              </div>
            </Html>
          )}
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2.1}
            autoRotate={!selectedObject}
            autoRotateSpeed={0.5}
          />
        </Suspense>
      </Canvas>
      <style>{`
        @keyframes slide-left { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; transform: translate(-50%, -100%); } to { opacity: 1; transform: translate(-50%, -120%); } }
        .animate-slide-left { animation: slide-left 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ExplorationScene;
