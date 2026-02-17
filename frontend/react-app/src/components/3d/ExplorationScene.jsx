import React, { Suspense, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import InteractiveSvgMap from "../2d/InteractiveSvgMap";
import BookingModal from "../2d/BookingModal";

const API_BASE_URL = "http://192.168.100.97:1337";

/**
 * Maps space status to colors for the 3D view.
 */
const getSpaceStatus = (space) => {
  if (!space) return "AVAILABLE";
  const status = space.attributes?.status || space.status;
  return status || "AVAILABLE";
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
  // ... (Model component implementation stays exactly the same as lines 36-135)
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

// ... (Legend, FloorSelector, Loader, DetailedInfoPanel stay the same)

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

// DetailedInfoPanel has been replaced by BookingModal for a centered UI.

const ExplorationScene = () => {
  const { spaceId } = useParams();
  const [modelUrl, setModelUrl] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [error, setError] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [activeFloor, setActiveFloor] = useState(null);
  const [viewMode, setViewMode] = useState("3D"); // "3D" or "2D"
  const [numericCoworkingId, setNumericCoworkingId] = useState(null);

  // Extract unique floors
  const availableFloors = Array.from(
    new Set(
      spaces
        .map((s) => s.attributes?.floor ?? s.floor)
        .filter((f) => f !== undefined && f !== null),
    ),
  );

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
          setNumericCoworkingId(coworkingSpace.id); // Store the numerical ID
          const attrs = coworkingSpace.attributes || coworkingSpace;
          setSpaces(attrs.spaces?.data || attrs.spaces || []);
          const models = attrs.models?.data || attrs.models || [];
          if (models.length > 0) {
            const modelData = models[0].attributes || models[0];
            const modelFile =
              modelData.file?.data?.attributes || modelData.file;
            if (modelFile?.url) setModelUrl(`${API_BASE_URL}${modelFile.url}`);
          }
        } else setError("Centre introuvable.");
      } catch (err) {
        setError("Erreur de chargement.");
      }
    };
    if (spaceId) fetchSpaceData();
  }, [spaceId]);

  return (
    <div className="w-full h-screen relative bg-[#050510] overflow-hidden font-inter">
      <div className="absolute top-12 left-12 z-10 pointer-events-none">
        <h1 className="text-4xl font-black text-white tracking-tighter mb-1">
          SUNSPACE <span className="text-blue-500 italic">PRO</span>
        </h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">
          Mode: <span className="text-white">{viewMode}</span>
        </p>
      </div>

      {/* View Switcher Toggle */}
      <div className="absolute top-12 right-12 z-[110] flex gap-2">
        <button
          onClick={() => setViewMode("3D")}
          className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
            viewMode === "3D"
              ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              : "bg-white/5 text-slate-400 hover:bg-white/10"
          }`}
        >
          Vue 3D
        </button>
        <button
          onClick={() => setViewMode("2D")}
          className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
            viewMode === "2D"
              ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              : "bg-white/5 text-slate-400 hover:bg-white/10"
          }`}
        >
          Plan 2D
        </button>
      </div>

      {viewMode === "3D" ? (
        <>
          <Legend />
          <FloorSelector
            floors={availableFloors}
            activeFloor={activeFloor}
            onChange={(f) => {
              setActiveFloor(f);
              setSelectedObject(null);
            }}
          />
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
        </>
      ) : (
        <div className="w-full h-full pt-32 pb-12 px-12">
          <InteractiveSvgMap
            svgUrl="/plan_v2.svg"
            spaces={spaces}
            selectedSpaceId={selectedObject?.name}
            onSelectSpace={(id) => {
              setSelectedObject({ name: id });
            }}
          />
        </div>
      )}

      <BookingModal
        space={spaces.find(
          (s) =>
            (s.attributes?.mesh_name || s.mesh_name) === selectedObject?.name,
        )}
        coworkingSpaceId={numericCoworkingId}
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
