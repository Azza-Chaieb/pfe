import React, { useEffect, useRef, useState } from "react";

/**
 * InteractiveSvgMap Component
 * Loads an SVG and makes its elements interactive with premium styling.
 */
const InteractiveSvgMap = ({
  svgUrl,
  spaces,
  selectedSpaceId,
  onSelectSpace,
}) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredSpace, setHoveredSpace] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!svgUrl) return;

    setLoading(true);
    fetch(svgUrl)
      .then((res) => res.text())
      .then((svgText) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svgText;
          const svgElement = containerRef.current.querySelector("svg");

          if (svgElement) {
            svgElement.setAttribute("width", "100%");
            svgElement.setAttribute("height", "100%");
            svgElement.style.display = "block";
            svgElement.style.backgroundColor = "#f8fafc";

            // PREMIUM: Inject Global SVG Filter for Shadows
            let defs = svgElement.querySelector("defs");
            if (!defs) {
              defs = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "defs",
              );
              svgElement.insertBefore(defs, svgElement.firstChild);
            }
            defs.innerHTML += `
              <filter id="furnitureShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="2" dy="2" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.2"/>
                </feComponentTransfer>
                <feMerge> 
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/> 
                </feMerge>
              </filter>
            `;

            const statusColors = {
              AVAILABLE: "#10b981", // Emerald Green (Matched to screenshot)
              BOOKED: "#ef4444", // Red
              PARTIAL: "#f59e0b",
              SELECTED: "#3b82f6", // Blue
            };

            // PREMIUM: Style Layers
            const allPaths = svgElement.querySelectorAll("path, rect, use");
            allPaths.forEach((path) => {
              const id = path.getAttribute("id") || "";
              const parentId = path.parentElement?.getAttribute("id") || "";

              // Style furniture/decor
              if (
                !id.startsWith("bureau_") &&
                !parentId.startsWith("bureau_")
              ) {
                path.style.fill = "#ffffff";
                path.style.stroke = "#e2e8f0";
                path.style.strokeWidth = "0.5px";
                path.setAttribute("filter", "url(#furnitureShadow)");
              } else if (path.getAttribute("d")?.length > 500) {
                // Background layers
                path.style.fill = "#f1f5f9";
                path.style.stroke = "#cbd5e1";
              }
            });

            const interactiveElements = svgElement.querySelectorAll(
              "path[id], rect[id], circle[id], use[id]",
            );

            const normalize = (v) => (v || "").toString().toLowerCase();
            const extractDigits = (v) => {
              const m = (v || "").match(/\d+/);
              return m ? m[0] : null;
            };

            const findSpaceByElementId = (elementId) => {
              if (!elementId) return null;
              const elNorm = normalize(elementId);
              const elDigits = extractDigits(elementId);

              return spaces?.find((s) => {
                const mesh = normalize(
                  s.attributes?.mesh_name || s.mesh_name || "",
                );
                const sid = s.id ? s.id.toString() : "";
                const docId = s.attributes?.documentId
                  ? s.attributes.documentId.toString()
                  : "";

                if (mesh && mesh === elNorm) return true;
                if (mesh && mesh.includes(elNorm)) return true;
                if (elDigits && (sid === elDigits || docId === elDigits))
                  return true;
                const name = normalize(s.attributes?.name || s.name || "");
                if (name && name === elNorm) return true;
                return false;
              });
            };

            interactiveElements.forEach((el) => {
              const elementId = el.getAttribute("id");
              if (!elementId || elementId.length < 3) return;

              const spaceData = findSpaceByElementId(elementId);

              el.style.pointerEvents = "all";
              el.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

              const isSelected = selectedSpaceId === elementId;
              const status =
                spaceData?.attributes?.status ||
                spaceData?.status ||
                "AVAILABLE";

              if (isSelected) {
                el.style.fill = statusColors.SELECTED;
                el.style.fillOpacity = "0.8";
                el.style.stroke = "#2563eb";
                el.style.strokeWidth = "4px";
                el.setAttribute("filter", "none");
              } else if (spaceData) {
                el.style.fill = statusColors[status];
                el.style.fillOpacity = "0.5";
                el.style.stroke = statusColors[status];
                el.style.strokeWidth = "2px";
                el.setAttribute("filter", "none");
              } else {
                el.style.fill = "#ffffff";
                el.style.fillOpacity = "0.3";
                el.style.stroke = "rgba(0,0,0,0.1)";
                el.style.strokeWidth = "1px";
                el.setAttribute("filter", "url(#furnitureShadow)");
              }

              el.style.cursor = "pointer";

              el.onclick = (e) => {
                e.stopPropagation();
                onSelectSpace(elementId);
              };

              el.onmouseenter = (e) => {
                setHoveredSpace({
                  id: elementId,
                  name:
                    spaceData?.attributes?.name || spaceData?.name || elementId,
                  status: spaceData ? status : "UNKNOWN",
                });
                setMousePos({ x: e.clientX, y: e.clientY });
                el.style.filter =
                  "brightness(1.1) drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))";
              };

              el.onmousemove = (e) => {
                setMousePos({ x: e.clientX, y: e.clientY });
              };

              el.onmouseleave = () => {
                setHoveredSpace(null);
                el.style.filter = "none";
              };
            });
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        setError("Erreur chargement plan.");
        setLoading(false);
      });
  }, [svgUrl, spaces, selectedSpaceId]);

  return (
    <div className="relative w-full h-full bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-inner">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Hover Tooltip - PREMIUM VERSION matching Screenshot */}
      {hoveredSpace && (
        <div
          className="fixed z-[9999] pointer-events-none px-4 py-3 bg-slate-900/95 text-white rounded-2xl shadow-2xl backdrop-blur-md transform -translate-x-1/2 -translate-y-[125%] transition-all duration-200 border border-white/10"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  hoveredSpace.status === "BOOKED"
                    ? "bg-red-500"
                    : hoveredSpace.status === "AVAILABLE"
                      ? "bg-emerald-500"
                      : "bg-slate-500"
                }`}
              />
              <span className="text-[9px] uppercase tracking-widest font-black text-slate-400">
                {hoveredSpace.status === "UNKNOWN"
                  ? "ID SVG (NON LIÉ)"
                  : hoveredSpace.status === "BOOKED"
                    ? "Occupé"
                    : "Disponible"}
              </span>
            </div>
            <span className="text-sm font-bold tracking-tight">
              {hoveredSpace.name}
            </span>
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-3 h-3 bg-slate-900/95 rotate-45" />
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full h-full p-8 flex items-center justify-center"
      />

      {/* Legend - PREMIUM matched to Screenshot */}
      <div className="absolute bottom-10 left-10 p-6 bg-white/90 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-2xl pointer-events-none">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
          LÉGENDE PLAN 2D
        </h4>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-500/30"></div>
            <span className="text-xs font-bold text-slate-700">
              Sélectionné
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30"></div>
            <span className="text-xs font-bold text-slate-700">Disponible</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-red-500 shadow-lg shadow-red-500/30"></div>
            <span className="text-xs font-bold text-slate-700">Occupé</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveSvgMap;
