// src/pages/ModelTestPage.jsx
// TASK-031: Test page for validating 3D model format loading (GLB/GLTF/FBX)
import { useState, Suspense, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
    OrbitControls,
    useGLTF,
    Environment,
    Grid,
    Html,
    Center,
    useProgress,
} from "@react-three/drei";
import WebGLErrorBoundary from "../components/3d/WebGLErrorBoundary";

// ──────────────────────────── Sample Models ────────────────────────────
const SAMPLE_MODELS = [
    {
        name: "Duck (GLTF Sample)",
        url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb",
        description: "Simple low-poly model — good for basic loading test",
    },
    {
        name: "Damaged Helmet",
        url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
        description: "PBR materials test — metallic, roughness, normal maps",
    },
    {
        name: "Avocado",
        url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Avocado/glTF-Binary/Avocado.glb",
        description: "Small model — texture quality test",
    },
];

// ──────────────────────────── Loader UI ────────────────────────────
function LoadingScreen() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                    color: "#fff",
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                <div
                    style={{
                        width: "200px",
                        height: "6px",
                        background: "rgba(255,255,255,0.15)",
                        borderRadius: "3px",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: `${progress}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #667eea, #764ba2)",
                            borderRadius: "3px",
                            transition: "width 0.3s ease",
                        }}
                    />
                </div>
                <span style={{ fontSize: "14px", opacity: 0.8 }}>
                    Loading… {progress.toFixed(0)}%
                </span>
            </div>
        </Html>
    );
}

// ──────────────────────────── GLTF Model ────────────────────────────
function GLTFModel({ url, onLoaded }) {
    const { scene } = useGLTF(url);
    const ref = useRef();

    useEffect(() => {
        if (scene) {
            // Gather model stats
            let triangleCount = 0;
            let meshCount = 0;
            let materialSet = new Set();

            scene.traverse((child) => {
                if (child.isMesh) {
                    meshCount++;
                    if (child.material) materialSet.add(child.material.name || "unnamed");
                    const geo = child.geometry;
                    if (geo.index) {
                        triangleCount += geo.index.count / 3;
                    } else if (geo.attributes.position) {
                        triangleCount += geo.attributes.position.count / 3;
                    }
                }
            });

            onLoaded?.({
                triangles: Math.round(triangleCount),
                meshes: meshCount,
                materials: materialSet.size,
                materialNames: [...materialSet],
            });
        }
    }, [scene, onLoaded]);

    return (
        <Center>
            <primitive ref={ref} object={scene} />
        </Center>
    );
}

// ──────────────────────────── Scene Info HUD ────────────────────────────
function SceneInfo({ renderer }) {
    const { gl } = useThree();
    const [info, setInfo] = useState(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setInfo({
                drawCalls: gl.info.render.calls,
                triangles: gl.info.render.triangles,
                geometries: gl.info.memory.geometries,
                textures: gl.info.memory.textures,
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [gl]);

    if (!info) return null;

    return (
        <Html position={[0, 0, 0]} style={{ pointerEvents: "none" }}>
            <div
                style={{
                    position: "fixed",
                    top: "80px",
                    right: "20px",
                    background: "rgba(0,0,0,0.75)",
                    color: "#0f0",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    lineHeight: "1.6",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(0,255,0,0.2)",
                }}
            >
                <div>Draw calls: {info.drawCalls}</div>
                <div>Triangles: {info.triangles.toLocaleString()}</div>
                <div>Geometries: {info.geometries}</div>
                <div>Textures: {info.textures}</div>
            </div>
        </Html>
    );
}

// ──────────────────────────── Main Page ────────────────────────────
export default function ModelTestPage() {
    const [currentUrl, setCurrentUrl] = useState(SAMPLE_MODELS[0].url);
    const [customUrl, setCustomUrl] = useState("");
    const [modelStats, setModelStats] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [loadTime, setLoadTime] = useState(null);
    const loadStart = useRef(null);

    const handleLoadModel = (url) => {
        setLoadError(null);
        setModelStats(null);
        setLoadTime(null);
        loadStart.current = performance.now();
        setCurrentUrl(url);
    };

    const handleModelLoaded = (stats) => {
        if (loadStart.current) {
            setLoadTime(((performance.now() - loadStart.current) / 1000).toFixed(2));
        }
        setModelStats(stats);
    };

    const handleCustomLoad = () => {
        if (customUrl.trim()) {
            handleLoadModel(customUrl.trim());
        }
    };

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                background: "#0a0a0f",
                fontFamily: "'Inter', system-ui, sans-serif",
                color: "#e0e0e0",
            }}
        >
            {/* ──── Sidebar ──── */}
            <div
                style={{
                    width: "340px",
                    minWidth: "340px",
                    background: "linear-gradient(180deg, #12121a 0%, #1a1a2e 100%)",
                    borderRight: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "auto",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "24px 20px",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "18px",
                            fontWeight: 700,
                            background: "linear-gradient(135deg, #667eea, #764ba2)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        🧊 3D Format Tester
                    </h2>
                    <p style={{ margin: "6px 0 0", fontSize: "12px", opacity: 0.5 }}>
                        TASK-031 — Format Compatibility Test
                    </p>
                </div>

                {/* Sample Models */}
                <div style={{ padding: "16px 20px" }}>
                    <h3
                        style={{
                            fontSize: "11px",
                            textTransform: "uppercase",
                            letterSpacing: "1.5px",
                            opacity: 0.4,
                            marginBottom: "12px",
                        }}
                    >
                        Sample Models
                    </h3>
                    {SAMPLE_MODELS.map((model) => (
                        <button
                            key={model.name}
                            onClick={() => handleLoadModel(model.url)}
                            style={{
                                width: "100%",
                                padding: "12px 14px",
                                marginBottom: "8px",
                                background:
                                    currentUrl === model.url
                                        ? "linear-gradient(135deg, rgba(102,126,234,0.2), rgba(118,75,162,0.2))"
                                        : "rgba(255,255,255,0.03)",
                                border:
                                    currentUrl === model.url
                                        ? "1px solid rgba(102,126,234,0.4)"
                                        : "1px solid rgba(255,255,255,0.06)",
                                borderRadius: "10px",
                                color: "#e0e0e0",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "all 0.2s ease",
                            }}
                        >
                            <div style={{ fontSize: "13px", fontWeight: 600 }}>
                                {model.name}
                            </div>
                            <div
                                style={{ fontSize: "11px", opacity: 0.5, marginTop: "4px" }}
                            >
                                {model.description}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Custom URL */}
                <div
                    style={{
                        padding: "16px 20px",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <h3
                        style={{
                            fontSize: "11px",
                            textTransform: "uppercase",
                            letterSpacing: "1.5px",
                            opacity: 0.4,
                            marginBottom: "12px",
                        }}
                    >
                        Custom Model URL
                    </h3>
                    <input
                        type="text"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="https://... .glb or .gltf"
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            color: "#e0e0e0",
                            fontSize: "13px",
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleCustomLoad()}
                    />
                    <button
                        onClick={handleCustomLoad}
                        style={{
                            width: "100%",
                            marginTop: "8px",
                            padding: "10px",
                            background: "linear-gradient(135deg, #667eea, #764ba2)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: "13px",
                        }}
                    >
                        Load Custom Model
                    </button>
                </div>

                {/* Model Stats */}
                {modelStats && (
                    <div
                        style={{
                            padding: "16px 20px",
                            borderTop: "1px solid rgba(255,255,255,0.06)",
                        }}
                    >
                        <h3
                            style={{
                                fontSize: "11px",
                                textTransform: "uppercase",
                                letterSpacing: "1.5px",
                                opacity: 0.4,
                                marginBottom: "12px",
                            }}
                        >
                            Model Info
                        </h3>
                        <div
                            style={{
                                background: "rgba(255,255,255,0.03)",
                                borderRadius: "10px",
                                padding: "14px",
                                fontSize: "13px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "8px",
                                }}
                            >
                                <span style={{ opacity: 0.5 }}>Triangles</span>
                                <span
                                    style={{
                                        fontWeight: 600,
                                        color:
                                            modelStats.triangles > 500000 ? "#ff6b6b" : "#51cf66",
                                    }}
                                >
                                    {modelStats.triangles.toLocaleString()}
                                    {modelStats.triangles > 500000 && " ⚠️"}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "8px",
                                }}
                            >
                                <span style={{ opacity: 0.5 }}>Meshes</span>
                                <span style={{ fontWeight: 600 }}>{modelStats.meshes}</span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "8px",
                                }}
                            >
                                <span style={{ opacity: 0.5 }}>Materials</span>
                                <span style={{ fontWeight: 600 }}>{modelStats.materials}</span>
                            </div>
                            {loadTime && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <span style={{ opacity: 0.5 }}>Load Time</span>
                                    <span
                                        style={{
                                            fontWeight: 600,
                                            color: parseFloat(loadTime) > 3 ? "#ff6b6b" : "#51cf66",
                                        }}
                                    >
                                        {loadTime}s
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Validation Checklist */}
                        <div style={{ marginTop: "16px" }}>
                            <h3
                                style={{
                                    fontSize: "11px",
                                    textTransform: "uppercase",
                                    letterSpacing: "1.5px",
                                    opacity: 0.4,
                                    marginBottom: "8px",
                                }}
                            >
                                Validation
                            </h3>
                            {[
                                {
                                    label: "Triangles < 500K",
                                    pass: modelStats.triangles < 500000,
                                },
                                {
                                    label: "Load time < 3s",
                                    pass: loadTime && parseFloat(loadTime) < 3,
                                },
                                { label: "Has materials", pass: modelStats.materials > 0 },
                                { label: "Meshes found", pass: modelStats.meshes > 0 },
                            ].map((check) => (
                                <div
                                    key={check.label}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        fontSize: "12px",
                                        padding: "4px 0",
                                    }}
                                >
                                    <span>{check.pass ? "✅" : "❌"}</span>
                                    <span style={{ opacity: 0.7 }}>{check.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Back link */}
                <div style={{ padding: "16px 20px", marginTop: "auto" }}>
                    <a
                        href="/"
                        style={{
                            display: "block",
                            textAlign: "center",
                            padding: "10px",
                            fontSize: "13px",
                            color: "#667eea",
                            textDecoration: "none",
                            borderRadius: "8px",
                            border: "1px solid rgba(102,126,234,0.3)",
                        }}
                    >
                        ← Back to Home
                    </a>
                </div>
            </div>

            {/* ──── 3D Viewport ──── */}
            <div style={{ flex: 1, position: "relative" }}>
                <WebGLErrorBoundary>
                    <Canvas
                        eventSource={document.getElementById('root')}
                        camera={{ position: [3, 2, 5], fov: 50 }}
                        shadows
                        gl={{ antialias: true }}
                        onCreated={({ gl }) => {
                            gl.setClearColor("#0a0a0f");
                        }}
                    >
                        <ambientLight intensity={0.4} />
                        <directionalLight
                            position={[5, 8, 3]}
                            intensity={1.2}
                            castShadow
                            shadow-mapSize={[1024, 1024]}
                        />
                        <pointLight position={[-5, 3, -5]} intensity={0.5} color="#667eea" />

                        <Suspense fallback={<LoadingScreen />}>
                            <GLTFModel
                                key={currentUrl}
                                url={currentUrl}
                                onLoaded={handleModelLoaded}
                            />
                            <Environment preset="city" />
                        </Suspense>

                        <Grid
                            infiniteGrid
                            fadeDistance={30}
                            fadeStrength={3}
                            cellSize={1}
                            sectionSize={5}
                            cellColor="#1a1a2e"
                            sectionColor="#2a2a4e"
                        />

                        <SceneInfo />
                        <OrbitControls
                            makeDefault
                            enableDamping
                            dampingFactor={0.1}
                            minDistance={1}
                            maxDistance={20}
                        />
                    </Canvas>
                </WebGLErrorBoundary>

                {/* Format badge */}
                <div
                    style={{
                        position: "absolute",
                        top: "20px",
                        left: "20px",
                        display: "flex",
                        gap: "8px",
                    }}
                >
                    <span
                        style={{
                            padding: "6px 14px",
                            background: "rgba(102,126,234,0.15)",
                            border: "1px solid rgba(102,126,234,0.3)",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#667eea",
                            fontFamily: "monospace",
                        }}
                    >
                        {currentUrl.split(".").pop()?.toUpperCase() || "GLB"}
                    </span>
                    {loadTime && (
                        <span
                            style={{
                                padding: "6px 14px",
                                background: "rgba(81,207,102,0.1)",
                                border: "1px solid rgba(81,207,102,0.3)",
                                borderRadius: "20px",
                                fontSize: "12px",
                                color: "#51cf66",
                                fontFamily: "monospace",
                            }}
                        >
                            {loadTime}s
                        </span>
                    )}
                </div>

                {/* Error display */}
                {loadError && (
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            background: "rgba(255, 0, 0, 0.1)",
                            border: "1px solid rgba(255,0,0,0.3)",
                            borderRadius: "12px",
                            padding: "20px 30px",
                            color: "#ff6b6b",
                            textAlign: "center",
                            maxWidth: "400px",
                        }}
                    >
                        <div style={{ fontSize: "24px", marginBottom: "8px" }}>⚠️</div>
                        <div style={{ fontSize: "14px", fontWeight: 600 }}>Load Error</div>
                        <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "4px" }}>
                            {loadError}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
