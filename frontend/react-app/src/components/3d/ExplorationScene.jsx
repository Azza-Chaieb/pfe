import React, { Suspense, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, useProgress, Center } from "@react-three/drei";
import * as THREE from "three";
import api from "../../services/apiClient";

const API_BASE_URL = "http://localhost:1337";

// Availability states mapping (Mock logic for demonstration)
const getStatus = (name) => {
    if (!name) return 'AVAILABLE';
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    if (hash % 3 === 0) return 'AVAILABLE';
    if (hash % 3 === 1) return 'BOOKED';
    return 'PARTIAL';
};

const COLORS = {
    AVAILABLE: '#10b981', // Emerald 500
    BOOKED: '#ef4444',    // Red 500
    PARTIAL: '#f59e0b',   // Amber 500
    SELECTED: '#3b82f6',  // Blue 500
};

// Component for individual model parts with selection/availability handling
function Model({ url, onSelect, selectedName }) {
    const { scene } = useGLTF(url);
    const [hoveredName, setHoveredName] = useState(null);

    // Setup interactive events on all meshes in the scene
    useEffect(() => {
        if (!scene) return;

        scene.traverse((child) => {
            if (child.isMesh) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                const status = getStatus(child.name || child.parent?.name || "default");
                const baseColor = new THREE.Color(COLORS[status]);

                materials.forEach(mat => {
                    if (!mat) return;

                    // Selection/Hover logic
                    const isSelected = child.name === selectedName || child.parent?.name === selectedName;
                    const isHovered = child.name === hoveredName || child.parent?.name === hoveredName;

                    if (isSelected) {
                        mat.color.set(COLORS.SELECTED);
                        if (mat.emissive) {
                            mat.emissive.setHex(0x3b82f6);
                            mat.emissiveIntensity = 0.5;
                        }
                    } else if (isHovered) {
                        mat.color.set(baseColor).lerp(new THREE.Color('#ffffff'), 0.2); // Lighten on hover
                        if (mat.emissive) mat.emissiveIntensity = 0;
                    } else {
                        mat.color.set(baseColor);
                        if (mat.emissive) mat.emissiveIntensity = 0;
                    }
                });
            }
        });
    }, [scene, selectedName, hoveredName]);

    return (
        <Center top>
            <primitive
                object={scene}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    const objectName = e.object.name || e.object.parent?.name || "Objet interactif";
                    onSelect({
                        name: objectName,
                        point: e.point
                    });
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHoveredName(e.object.name || e.object.parent?.name);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                    setHoveredName(null);
                    document.body.style.cursor = 'auto';
                }}
                onPointerMissed={() => onSelect(null)}
                castShadow
                receiveShadow
            />
        </Center>
    );
}

const Legend = () => (
    <div className="absolute bottom-10 left-10 z-10 bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-2xl">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Légende de disponibilité</h4>
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                <span className="text-white text-xs font-medium">Disponible</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                <span className="text-white text-xs font-medium">Partiel</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                <span className="text-white text-xs font-medium">Réservé</span>
            </div>
            <div className="h-[1px] bg-white/5 my-1" />
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-[0_0_8px_#3b82f6]" />
                <span className="text-blue-400 text-xs font-bold italic tracking-tight">Sélectionné</span>
            </div>
        </div>
    </div>
);

function Loader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div style={{
                color: "white",
                fontSize: "1.2rem",
                fontWeight: "bold",
                backgroundColor: "rgba(0,0,0,0.5)",
                padding: "10px 20px",
                borderRadius: "10px",
                whiteSpace: "nowrap"
            }}>
                Chargement : {progress.toFixed(0)}%
            </div>
        </Html>
    );
}

const ExplorationScene = () => {
    const { spaceId } = useParams();
    const [modelUrl, setModelUrl] = useState(null);
    const [error, setError] = useState(null);
    const [selectedObject, setSelectedObject] = useState(null);

    useEffect(() => {
        const fetchSpaceData = async () => {
            try {
                const query = isNaN(spaceId)
                    ? `filters[documentId][$eq]=${spaceId}`
                    : `filters[id][$eq]=${spaceId}`;

                const response = await api.get(`/coworking-spaces?${query}&populate=models.file`);
                const spaces = response.data.data || [];

                if (spaces.length > 0) {
                    const space = spaces[0];
                    const models = space.models || space.attributes?.models || [];

                    if (models.length > 0) {
                        const modelFile = models[0].file?.data?.attributes || models[0].file;
                        if (modelFile?.url) {
                            setModelUrl(`${API_BASE_URL}${modelFile.url}`);
                        } else {
                            setError("Aucun fichier 3D valide trouvé.");
                        }
                    } else {
                        setError("Cet espace n'a pas de modèle 3D associé.");
                    }
                } else {
                    setError(`Espace de coworking introuvable (ID: ${spaceId}).`);
                }
            } catch (err) {
                console.error("Fetch error:", err);
                setError("Erreur technique lors du chargement.");
            }
        };

        if (spaceId) fetchSpaceData();
    }, [spaceId]);

    const handleBooking = (name) => {
        alert(`Demande de réservation pour : ${name}`);
    };

    return (
        <div className="w-full h-screen relative bg-[#050510] overflow-hidden">
            {/* Header */}
            <div className="absolute top-10 left-10 z-10 pointer-events-none">
                <h1 className="text-3xl font-black text-white tracking-tighter">SUNSPACE <span className="text-blue-500">3D</span></h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1 origin-left">
                    Espace de Coworking Virtuel
                </p>
            </div>

            <Legend />

            {/* Error Overlay */}
            {error && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-white font-medium bg-red-600/90 px-8 py-4 rounded-xl shadow-2xl backdrop-blur-md text-center">
                    <p className="text-lg">⚠ {error}</p>
                </div>
            )}

            <Canvas
                shadows
                camera={{ position: [8, 5, 8], fov: 45 }}
                gl={{ antialias: true }}
            >
                <color attach="background" args={["#050510"]} />
                <fog attach="fog" args={["#050510", 15, 25]} />

                <Suspense fallback={<Loader />}>
                    <ambientLight intensity={0.4} />
                    <directionalLight
                        position={[10, 15, 5]}
                        intensity={1.5}
                        castShadow
                    />

                    {modelUrl && (
                        <Model
                            url={modelUrl}
                            onSelect={setSelectedObject}
                            selectedName={selectedObject?.name}
                        />
                    )}

                    {/* Info Tooltip on selection */}
                    {selectedObject && (
                        <Html position={selectedObject.point}>
                            <div style={{
                                transform: 'translate3d(-50%, -120%, 0)',
                                background: 'rgba(15, 23, 42, 0.95)',
                                backdropFilter: 'blur(12px)',
                                color: 'white',
                                padding: '18px',
                                borderRadius: '24px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7)',
                                minWidth: '200px',
                                pointerEvents: 'auto'
                            }}>
                                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '900', letterSpacing: '-0.02em' }}>
                                    {selectedObject.name}
                                </h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        background: COLORS[getStatus(selectedObject.name)],
                                        borderRadius: '50%',
                                        boxShadow: `0 0 8px ${COLORS[getStatus(selectedObject.name)]}`
                                    }} />
                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {getStatus(selectedObject.name) === 'AVAILABLE' ? 'Disponible' :
                                            getStatus(selectedObject.name) === 'BOOKED' ? 'Réservé' : 'Partiel'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleBooking(selectedObject.name)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                        transition: 'transform 0.2s'
                                    }}
                                >
                                    RÉSERVER MAINTENANT
                                </button>
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-8px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    borderLeft: '8px solid transparent',
                                    borderRight: '8px solid transparent',
                                    borderTop: '8px solid rgba(15, 23, 42, 0.95)'
                                }} />
                            </div>
                        </Html>
                    )}

                    <OrbitControls
                        makeDefault
                        enableDamping={true}
                        dampingFactor={0.05}
                        minDistance={2}
                        maxDistance={15}
                        maxPolarAngle={Math.PI / 2.2}
                        enablePan={true}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default ExplorationScene;
