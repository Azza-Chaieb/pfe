import React, { useEffect, useRef, useState } from "react";

/**
 * InteractiveSvgMap Component
 * Loads an SVG and makes its elements interactive.
 *
 * @param {string} svgUrl - The URL of the SVG file to load
 * @param {Array} spaces - List of spaces from Strapi to match with SVG IDs
 * @param {string} selectedSpaceId - The ID of the currently selected space
 * @param {Function} onSelectSpace - Callback when an element is clicked
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

  useEffect(() => {
    if (!svgUrl) return;

    setLoading(true);
    fetch(svgUrl)
      .then((res) => res.text())
      .then((svgText) => {
        if (containerRef.current) {
          // Inject SVG into the container
          containerRef.current.innerHTML = svgText;
          const svgElement = containerRef.current.querySelector("svg");

          if (svgElement) {
            svgElement.setAttribute("width", "100%");
            svgElement.setAttribute("height", "100%");
            svgElement.style.display = "block";
            svgElement.style.backgroundColor = "#f8fafc"; // Soft background

            // Inject Global SVG Filter for Shadows
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

            // Preset Colors (Premium Minimalist Palette)
            const statusColors = {
              AVAILABLE: "#10b981", // Emerald Green
              BOOKED: "#f43f5e", // Rose Red
              PARTIAL: "#f59e0b",
              SELECTED: "#3b82f6", // Bright Blue
            };

            // Identify different layers
            const allPaths = svgElement.querySelectorAll("path, rect, use");
            allPaths.forEach((path) => {
              const id = path.getAttribute("id") || "";
              const parentId = path.parentElement?.getAttribute("id") || "";

              // If it's NOT an interactive space, treat it as furniture/decor
              if (
                !id.startsWith("bureau_") &&
                !parentId.startsWith("bureau_")
              ) {
                path.style.fill = "#ffffff";
                path.style.stroke = "#e2e8f0";
                path.style.strokeWidth = "0.5px";
                path.setAttribute("filter", "url(#furnitureShadow)");
              } else {
                // Background of rooms should be neutral
                if (path.getAttribute("d")?.length > 500) {
                  path.style.fill = "#f1f5f9";
                  path.style.stroke = "#cbd5e1";
                }
              }
            });

            // Add interaction only to shape tags with an ID
            const interactiveElements = svgElement.querySelectorAll(
              "path[id], rect[id], circle[id], ellipse[id], polygon[id], polyline[id], use[id]",
            );

            if (interactiveElements.length === 0) {
              console.warn(
                "⚠️ Attention: Aucun élément de forme avec un 'id' n'a été trouvé dans le SVG.",
              );
              console.log(
                "Suggestions: Assurez-vous d'avoir exécuté 'node inject_v2.js' dans le dossier backend/backend.",
              );
            }

            console.log("📍 SVG Chargé. Recherche des éléments à lier...");
            console.log("📦 Liste des espaces Strapi reçus:", spaces);

            // Create a layer for labels if it doesn't exist
            let labelLayer = svgElement.querySelector("#label-layer");
            if (!labelLayer) {
              labelLayer = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "g",
              );
              labelLayer.setAttribute("id", "label-layer");
              svgElement.appendChild(labelLayer);
            } else {
              labelLayer.innerHTML = ""; // Clear old labels
            }

            interactiveElements.forEach((el) => {
              const elementId = el.getAttribute("id");

              // Skip IDs that are obviously not spaces
              if (!elementId || elementId.length < 3) return;

              // Find if this ID corresponds to a space in Strapi
              const spaceData = spaces?.find(
                (s) =>
                  (s.attributes?.mesh_name || s.mesh_name) === elementId ||
                  (s.attributes?.name || s.name) === elementId,
              );

              // Basic interaction
              el.style.pointerEvents = "all";
              el.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

              const isSelected = selectedSpaceId === elementId;
              const status = spaceData?.status || "AVAILABLE";

              // Visual styles: Always highlight if selected
              if (isSelected) {
                el.style.fill = statusColors.SELECTED;
                el.style.fillOpacity = "0.8";
                el.style.stroke = "#2563eb";
                el.style.strokeWidth = "4px";
                el.style.cursor = "pointer";
                el.setAttribute("filter", "none");
              } else if (spaceData) {
                // Known space from Strapi
                el.style.fill = statusColors[status];
                el.style.fillOpacity = "0.5";
                el.style.stroke = statusColors[status];
                el.style.strokeWidth = "2px";
                el.style.cursor = "pointer";
                el.setAttribute("filter", "none");

                // ADD LABEL (Strapi Name)
                try {
                  const bbox = el.getBBox();
                  if (bbox.width > 15) {
                    const text = document.createElementNS(
                      "http://www.w3.org/2000/svg",
                      "text",
                    );
                    text.setAttribute("x", bbox.x + bbox.width / 2);
                    text.setAttribute("y", bbox.y + bbox.height / 2);
                    text.setAttribute("fill", "#0f172a");
                    text.setAttribute("font-size", "70px");
                    text.setAttribute("font-weight", "900");
                    text.setAttribute("text-anchor", "middle");
                    text.setAttribute("dominant-baseline", "middle");
                    text.setAttribute(
                      "style",
                      "pointer-events: none; user-select: none; paint-order: stroke; stroke: #ffffff; stroke-width: 12px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));",
                    );

                    text.textContent =
                      spaceData.attributes?.name || spaceData.name || "";
                    labelLayer.appendChild(text);
                  }
                } catch (e) {
                  // getBBox might fail
                }
              } else {
                // ID found but no Strapi data yet
                el.style.fill = "#ffffff";
                el.style.fillOpacity = "0.3";
                el.style.stroke = "rgba(0,0,0,0.1)";
                el.style.strokeWidth = "1px";
                el.style.cursor = "help";
                el.setAttribute("filter", "url(#furnitureShadow)");

                // NO LABEL HERE (Numbering removed)
              }

              el.onclick = (e) => {
                e.stopPropagation();
                console.log("🖱️ Élément cliqué ! ID:", elementId);
                if (spaceData) {
                  console.log("✅ Match Strapi:", spaceData);
                } else {
                  console.warn(
                    "❌ Aucun match dans Strapi. Utilisez cet ID dans le champ 'mesh_name'.",
                  );
                }
                onSelectSpace(elementId);
              };

              // Hover effect
              el.onmouseenter = () => {
                el.style.filter =
                  "brightness(1.1) drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))";
                if (!isSelected && !spaceData) {
                  el.style.fill = "rgba(59, 130, 246, 0.1)";
                }
              };
              el.onmouseleave = () => {
                el.style.filter = "none";
                if (!isSelected && !spaceData) {
                  el.style.fill = "transparent";
                }
              };
            });
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading SVG:", err);
        setError("Erreur lors du chargement du plan.");
        setLoading(false);
      });
  }, [svgUrl, spaces, selectedSpaceId]);

  return (
    <div className="relative w-full h-full bg-slate-50 rounded-3xl overflow-hidden border border-slate-200">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <span className="ml-3 font-bold text-slate-600">
            Chargement du plan...
          </span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-red-500 font-bold">
          ⚠️ {error}
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full h-full p-4 flex items-center justify-center"
      />

      {/* Legend */}
      <div className="absolute bottom-6 left-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl pointer-events-none">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
          Légende Plan 2D
        </h4>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-[10px] font-bold text-slate-700">
              Sélectionné
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 opacity-60"></div>
            <span className="text-[10px] font-bold text-slate-700">
              Disponible
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 opacity-60"></div>
            <span className="text-[10px] font-bold text-slate-700">Occupé</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveSvgMap;
