import React, { useState, useRef, useEffect } from "react";
import { uploadFile } from "../../services/uploadService";
import { getCategories, createCategory } from "../../services/categoryService";

const CreateCourseModal = ({ isOpen, onClose, onCreate, trainerId }) => {
  const [formData, setFormData] = useState({
    title: "",
    category: "", // Old field, we'll map this or use category_rel
    category_rel: "", // New relation field
    description: "",
    trainer: trainerId,
  });
  const [categories, setCategories] = useState([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setLoading(true);
      const res = await createCategory(newCategoryName);
      const newCat = res.data;
      setCategories(prev => [...prev, newCat]);
      setFormData(prev => ({ 
        ...prev, 
        category_rel: newCat.documentId || newCat.id,
        category: newCat.name // Keep sync for now
      }));
      setNewCategoryName("");
      setShowNewCategoryInput(false);
    } catch (error) {
      alert("Erreur lors de la création de la catégorie");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleDocChange = (e) => {
    const files = Array.from(e.target.files);
    setDocumentFiles(prev => [...prev, ...files]);
  };

  const removeDoc = (index) => {
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Generate course_id (slug) from title
      const course_id = formData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Prepare course data
      let newCourseData = {
        ...formData,
        course_id: course_id,
      };

      // 1. Upload the cover image if one is selected
      if (coverFile) {
        const uploadedFile = await uploadFile(coverFile);
        if (uploadedFile && uploadedFile.id) {
          newCourseData.cover = uploadedFile.id;
        }
      }

      // 2. Upload documents if selected
      if (documentFiles.length > 0) {
        const uploadedDocIds = [];
        for (const file of documentFiles) {
          const uploadedFile = await uploadFile(file);
          if (uploadedFile && uploadedFile.id) {
            uploadedDocIds.push(uploadedFile.id);
          }
        }
        newCourseData.documents = uploadedDocIds;
      }

      await onCreate(newCourseData);
      onClose();
      // Reset state for next use
      setDocumentFiles([]);
      setCoverFile(null);
      setCoverPreview(null);
    } catch (error) {
      console.error("Failed to create course:", error);
      const errMsg =
        error.response?.data?.error?.message ||
        error.message ||
        "Erreur inconnue";
      alert(`Erreur lors de la création du cours: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="sticky top-0 p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 z-10">
          <h3 className="text-xl font-bold text-gray-800">
            🚀 Créer un nouveau cours
          </h3>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Cover Upload Area */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors relative group overflow-hidden">
            {coverPreview ? (
              <div className="relative w-full h-40 rounded-lg overflow-hidden">
                <img
                  src={coverPreview}
                  alt="Cover Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/40 text-white text-xs font-bold uppercase rounded-lg"
                  >
                    Changer l'image
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="text-center py-6 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    ></path>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  Ajouter une image de couverture
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPEG, PNG, WEBP (Recommandé: 1200x600)
                </p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Titre du cours *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-white"
              placeholder="Ex: Initiation au Design UI/UX"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Catégorie *
            </label>
            <div className="flex gap-2">
              <select
                required
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-white font-medium text-sm"
                value={formData.category_rel}
                onChange={(e) => {
                  const selectedCat = categories.find(c => (c.documentId || c.id) === e.target.value);
                  setFormData({ 
                    ...formData, 
                    category_rel: e.target.value,
                    category: selectedCat?.name || "" 
                  });
                }}
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.documentId || cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                title="Ajouter une nouvelle catégorie"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {showNewCategoryInput && (
              <div className="mt-2 flex gap-2 animate-in slide-in-from-top-2 duration-200">
                <input
                  type="text"
                  placeholder="Nom de la catégorie"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
                >
                  Ajouter
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows="4"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-white resize-none"
              placeholder="Décrivez brefement le contenu et les objectifs de ce cours..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Documents Section */}
          <div className="pt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Documents du cours (PDF, Vidéos, Slides)
            </label>
            <div 
              onClick={() => docInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <p className="text-xs text-slate-500 font-medium">
                Cliquez pour ajouter des fichiers
              </p>
              <input 
                type="file" 
                multiple 
                ref={docInputRef} 
                className="hidden" 
                onChange={handleDocChange}
              />
            </div>
            
            {documentFiles.length > 0 && (
              <div className="mt-3 space-y-2 max-h-32 overflow-y-auto pr-2">
                {documentFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-lg">📄</span>
                      <span className="text-[10px] font-bold text-slate-700 truncate">{file.name}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeDoc(idx)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3 sticky bottom-0 bg-white pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center ${loading ? "opacity-70 cursor-not-allowed" : "shadow-lg shadow-indigo-200"}`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Création...
                </>
              ) : (
                "Créer le cours"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourseModal;
