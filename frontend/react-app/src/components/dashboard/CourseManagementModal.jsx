import React, { useState, useRef, useEffect } from "react";
import { uploadFile, deleteFile } from "../../services/uploadService";
import { updateCourse, deleteCourse } from "../../services/courseService";

const CourseManagementModal = ({ isOpen, onClose, course, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("documents"); // "documents" or "details"
  
  // Detail editing state
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (course) {
      setEditTitle(course.title || "");
      setEditCategory(course.category || "");
      setEditDescription(course.description || "");
    }
  }, [course]);

  if (!isOpen || !course) return null;

  // Provide default array if undefined
  const documents = course.documents?.data || course.documents || [];

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateCourse(course.documentId || course.id, {
        title: editTitle,
        category: editCategory,
        description: editDescription
      });
      alert("Détails du cours mis à jour !");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to update course details:", error);
      alert("Erreur lors de la mise à jour des détails.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm("Êtes-vous ABSOLUMENT sûr de vouloir supprimer ce cours définitièrement ? Cette action est irréversible.")) return;
    
    setLoading(true);
    try {
      await deleteCourse(course.documentId || course.id);
      alert("Cours supprimé avec succès.");
      onClose();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to delete course:", error);
      alert("Erreur lors de la suppression du cours.");
    } finally {
      setLoading(false);
    }
  };


  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(10);
    try {
      const newDocIds = [];
      for (let i = 0; i < files.length; i++) {
        const uploadedFile = await uploadFile(files[i]);
        if (uploadedFile && uploadedFile.id) {
          newDocIds.push(uploadedFile.id);
        }
        setUploadProgress(10 + Math.floor((90 * (i + 1)) / files.length));
      }

      const existingDocIds = documents.map((doc) => doc.id || doc);
      const allDocIds = [...existingDocIds, ...newDocIds];

      await updateCourse(course.documentId || course.id, {
        documents: allDocIds,
      });

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to upload content:", error);
      alert("Erreur lors de l'upload des fichiers.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce document ?")) return;

    setLoading(true);
    try {
      const newDocIds = documents.map((d) => d.id).filter((id) => id !== docId);
      await updateCourse(course.documentId || course.id, { documents: newDocIds });
      await deleteFile(docId);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Erreur lors de la suppression.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Gérer: {course.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Actions rapides et gestion du contenu
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-white">
          <button
            onClick={() => setActiveTab("documents")}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "documents" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30" : "text-gray-400 hover:text-gray-600"}`}
          >
            📂 Documents
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "details" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30" : "text-gray-400 hover:text-gray-600"}`}
          >
            📝 Détails & Editer
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activeTab === "documents" ? (
            <>
              {/* Upload Section */}
              <div className="mb-8">
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${uploading ? "bg-slate-100 border-slate-300" : "bg-white border-indigo-200 hover:border-indigo-400 cursor-pointer shadow-sm"}`}
                >
                  {uploading ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center mb-2 gap-3">
                        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <span className="text-sm font-bold text-indigo-900">
                          Upload en cours...
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          ></path>
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 mb-1">
                        Cliquer pour uploader
                      </h4>
                      <p className="text-xs text-gray-500">
                        PDFs, Vidéos, Slides, Exercices
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </div>
              </div>

              {/* Documents List */}
              <div>
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                  📚 Contenu du cours ({documents.length})
                </h4>

                {documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map((doc, index) => {
                      const d = doc.attributes || doc;
                      return (
                        <div
                          key={doc.id || index}
                          className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm group hover:border-indigo-200 transition-colors"
                        >
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: d.mime?.includes("video")
                                  ? "#fef2f2"
                                  : d.mime?.includes("pdf")
                                    ? "#fee2e2"
                                    : "#f0fdf4",
                                color: d.mime?.includes("video")
                                  ? "#ef4444"
                                  : d.mime?.includes("pdf")
                                    ? "#b91c1c"
                                    : "#15803d",
                              }}
                            >
                              {d.mime?.includes("video") ? (
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  ></path>
                                </svg>
                              ) : d.mime?.includes("pdf") ? (
                                <span className="font-bold text-[10px] uppercase">
                                  PDF
                                </span>
                              ) : (
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  ></path>
                                </svg>
                              )}
                            </div>
                            <div className="truncate">
                              <p
                                className="font-bold text-sm text-slate-800 truncate"
                                title={d.name}
                              >
                                {d.name || `Document ${index + 1}`}
                              </p>
                              <p className="text-[10px] font-medium text-slate-400">
                                {d.ext?.replace(".", "").toUpperCase() || "FILE"} •{" "}
                                {formatBytes(d.size * 1024)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              disabled={loading}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                ></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-white rounded-xl border border-slate-200 border-dashed">
                    <p className="text-slate-400 italic text-sm">
                      Aucun document.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleUpdateDetails} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Titre du cours</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Catégorie</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold min-h-[120px]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? "Mise à jour..." : "💾 Enregistrer les modifications"}
                </button>
              </form>

              <div className="pt-6 border-t border-slate-200">
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <h4 className="text-rose-900 font-black text-xs uppercase tracking-wider mb-2">Zone de danger ⚠️</h4>
                  <p className="text-rose-600 text-[10px] mb-4 font-medium">
                    La suppression d'un cours est définitive. Tous les documents associés et les inscriptions seront perdus.
                  </p>
                  <button
                    onClick={handleDeleteCourse}
                    disabled={loading}
                    className="w-full py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg"
                  >
                    🗑️ Supprimer définitivement ce cours
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default CourseManagementModal;
