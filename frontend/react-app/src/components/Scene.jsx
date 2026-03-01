import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import WebGLErrorBoundary from "./3d/WebGLErrorBoundary";

function Cube() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

export default function Scene() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:1337"}/api/equipments?populate=*`,
    )
      .then((res) => {
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list = data?.data || [];
        setItems(list);
        console.log("Test entries from Strapi:", list);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError(err.message);
      });
  }, []);

  if (error)
    return <div style={{ color: "red", padding: 20 }}>Error: {error}</div>;

  return (
    <>
      <div
        style={{
          position: "absolute",
          zIndex: 1,
          color: "#fff",
          padding: 8,
          width: "300px",
        }}
      >
        <h3
          style={{
            fontSize: "14px",
            fontWeight: "900",
            marginBottom: "15px",
            color: "#6366f1",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          Données de Test
        </h3>
        <div
          style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "10px" }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                marginTop: 10,
                padding: "12px",
                backgroundColor: "rgba(15, 15, 25, 0.7)",
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                gap: 15,
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
              }}
            >
              {item.photo && (
                <img
                  src={`${import.meta.env.VITE_API_URL || "http://localhost:1337"}${item.photo.url}`}
                  alt={item.name}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    objectFit: "cover",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontWeight: "800",
                    color: "#fff",
                    fontSize: "13px",
                  }}
                >
                  {item.name}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "9px",
                      opacity: 0.4,
                      fontWeight: "bold",
                    }}
                  >
                    ID: {item.id}
                  </span>
                  <span
                    style={{
                      fontSize: "9px",
                      color: "#10b981",
                      fontWeight: "900",
                    }}
                  >
                    ONLINE
                  </span>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p style={{ fontSize: "11px", opacity: 0.5, fontStyle: "italic" }}>
              Aucune donnée trouvée...
            </p>
          )}
        </div>
      </div>
      <WebGLErrorBoundary>
        <Canvas
          eventSource={document.getElementById('root')}
          camera={{ position: [3, 3, 3], fov: 60 }}
          shadows
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 5, 2]} intensity={1} />
          <Cube />
          <OrbitControls />
        </Canvas>
      </WebGLErrorBoundary>
    </>
  );
}
