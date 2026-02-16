import React, { useState, useEffect, useCallback, Suspense } from "react";
import { AdminLayout } from "../AdminLayout.jsx";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Grid,
  Center,
  useProgress,
  Html,
  useGLTF,
} from "@react-three/drei";
import {
  getModels,
  getCoworkingSpacesList,
  upload3DModelToSpace,
  deleteModel,
} from "../../../../api";

// ──────────────────────────── Reusable components from Tester ────────────────────────────
function LoadingScreen() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 text-white font-medium">
        <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs opacity-70">
          Chargement... {progress.toFixed(0)}%
        </span>
      </div>
    </Html>
  );
}

function GLTFModel({ url }) {
  const { scene } = useGLTF(url);
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

// ──────────────────────────── Main Component ────────────────────────────
const ModelManagement = () => {
  const [models, setModels] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState("");
  const [previewModel, setPreviewModel] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [modelsData, spacesData] = await Promise.all([
        getModels(),
        getCoworkingSpacesList(),
      ]);
      setModels(modelsData?.data || []);
      setSpaces(spacesData?.data || []);
      if (spacesData?.data?.length > 0) {
        setSelectedSpace(spacesData.data[0].id);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: `Erreur : ${error.response?.data?.error?.message || "Chargement impossible"}`,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ──────────────────────────── Handlers ────────────────────────────
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file) => {
    if (!selectedSpace) {
      setMessage({ type: "error", text: "Veuillez sélectionner un espace" });
      return;
    }

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["glb", "gltf", "fbx"].includes(ext)) {
      setMessage({
        type: "error",
        text: "Format non supporté (.glb, .gltf, .fbx uniquement)",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setMessage({ type: "error", text: "Fichier trop lourd (max 50 Mo)" });
      return;
    }

    setUploading(true);
    setMessage({ type: "info", text: "Téléchargement en cours..." });

    try {
      await upload3DModelToSpace(selectedSpace, file);
      setMessage({ type: "success", text: "Modèle ajouté avec succès !" });
      fetchData();
    } catch (error) {
      console.error("Upload error", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error?.message || "Échec de l'upload",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce modèle ?")) return;
    try {
      await deleteModel(id);
      setMessage({ type: "success", text: "Modèle supprimé" });
      setModels(models.filter((m) => m.id !== id));
    } catch (error) {
      setMessage({ type: "error", text: "Erreur lors de la suppression" });
    }
  };

  const getFileUrl = (model) => {
    // Support both Strapi 4 (attributes) and Strapi 5 (flat)
    const file = model.attributes?.file?.data?.attributes || model.file;
    if (!file?.url) return "";
    return `http://192.168.100.97:1337${file.url}`;
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto animate-fade-in pb-20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Gestion des Modèles 3D
            </h1>
            <p className="text-slate-500 mt-1">
              Gérez les plans architecturaux de vos espaces de coworking.
            </p>
          </div>
          {message.text && (
            <div
              className={`px-4 py-2 rounded-lg text-sm font-medium animate-bounce 
              ${
                message.type === "error"
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : message.type === "success"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : "bg-blue-50 text-blue-600 border border-blue-100"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ────── Upload Section ────── */}
          <div className="lg:col-span-1 border-r border-slate-200 pr-0 lg:pr-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-white/60 sticky top-4">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                📤 Ajouter un modèle
              </h3>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Espace associé
                </label>
                <select
                  value={selectedSpace}
                  onChange={(e) => setSelectedSpace(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                >
                  {spaces.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.attributes.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center group
                  ${dragActive ? "border-blue-500 bg-blue-50/50 scale-[0.98]" : "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-white"}
                  ${uploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".glb,.gltf,.fbx"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer w-full h-full absolute inset-0 z-0"
                />

                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300
                  ${dragActive ? "bg-blue-500 text-white scale-110" : "bg-white text-slate-400 shadow-sm group-hover:scale-110 group-hover:bg-blue-50 group-hover:text-blue-500"}`}
                >
                  <span className="text-3xl">{uploading ? "⌛" : "📦"}</span>
                </div>

                <h4 className="font-bold text-slate-700 mb-1">
                  Cliquer ou glisser ici
                </h4>
                <p className="text-xs text-slate-400 px-4">
                  Fichiers GLB, GLTF ou FBX supportés (Max 50 Mo)
                </p>
              </div>
            </div>
          </div>

          {/* ────── Models List Section ────── */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-white/60">
              <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                📂 Modèles existants
              </h3>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 italic">
                  <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  Chargement...
                </div>
              ) : models.length === 0 ? (
                <div className="text-center py-20 text-slate-400 italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  Aucun modèle n'a été uploadé pour le moment.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <th className="px-6 py-2">Nom / Espace</th>
                        <th className="px-6 py-2">Taille</th>
                        <th className="px-6 py-2">Date</th>
                        <th className="px-6 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {models.map((model) => {
                        const m = model.attributes || model; // Support both structures
                        return (
                          <tr
                            key={model.id}
                            className="bg-white group hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300"
                          >
                            <td className="px-6 py-4 rounded-l-2xl border-y border-l border-slate-50">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-xl shadow-sm">
                                  🧊
                                </div>
                                <div>
                                  <div className="font-bold text-slate-700">
                                    {m.title}
                                  </div>
                                  <div className="text-xs text-slate-400 flex items-center gap-1">
                                    🏢{" "}
                                    {m.coworking_space?.data?.attributes
                                      ?.name ||
                                      m.coworking_space?.name ||
                                      "Non assigné"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 border-y border-slate-50 text-sm font-medium text-slate-500">
                              {(
                                (m.metadata?.size || 0) /
                                (1024 * 1024)
                              ).toFixed(2)}{" "}
                              Mo
                            </td>
                            <td className="px-6 py-4 border-y border-slate-50 text-sm font-medium text-slate-400">
                              {new Date(m.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 rounded-r-2xl border-y border-r border-slate-50 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <button
                                  onClick={() => setPreviewModel(model)}
                                  className="p-2 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-all shadow-sm"
                                  title="Aperçu 3D"
                                >
                                  👁️
                                </button>
                                <button
                                  onClick={() => handleDelete(model.id)}
                                  className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all shadow-sm"
                                  title="Supprimer"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ────── Preview Modal ────── */}
      {previewModel && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={() => setPreviewModel(null)}
          ></div>
          <div className="relative bg-white w-full max-w-5xl h-[80vh] rounded-[40px] shadow-2xl overflow-hidden animate-zoom-in flex flex-col border border-white/20">
            {/* Modal Header */}
            <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-sm z-10">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  {previewModel.attributes?.title || previewModel.title}
                </h3>
                <p className="text-sm text-slate-400 font-medium">
                  Aperçu 3D interactif
                </p>
              </div>
              <button
                onClick={() => setPreviewModel(null)}
                className="w-12 h-12 flex items-center justify-center text-slate-400 hover:bg-slate-50 rounded-2xl transition-all text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Body (Viewport) */}
            <div className="flex-1 bg-[#0a0a0f] relative group">
              <Canvas camera={{ position: [5, 5, 5], fov: 45 }} shadows>
                <ambientLight intensity={0.5} />
                <directionalLight
                  position={[10, 10, 5]}
                  intensity={1}
                  castShadow
                />
                <Suspense fallback={<LoadingScreen />}>
                  <GLTFModel url={getFileUrl(previewModel)} />
                  <Environment preset="city" />
                </Suspense>
                <Grid
                  infiniteGrid
                  fadeDistance={20}
                  cellColor="#1a1a2e"
                  sectionColor="#2a2a4e"
                />
                <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
              </Canvas>

              <div className="absolute bottom-6 left-6 text-[10px] text-white/30 font-mono tracking-widest uppercase pointer-events-none">
                Renderer: WebGL2 • Drei Controls Enabled
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ModelManagement;
