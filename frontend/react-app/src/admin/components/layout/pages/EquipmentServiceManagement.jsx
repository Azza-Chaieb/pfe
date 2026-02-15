import React, { useState, useEffect } from "react";
import { AdminLayout } from "../AdminLayout.jsx";
import {
  getEquipments,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getServicesList,
  createService,
  updateService,
  deleteService,
} from "../../../../api";
import SearchBar from "../../common/SearchBar";

/**
 * @component EquipmentServiceManagement
 * @description Administrative interface for managing equipment and services.
 * Features: CRUD operations, tabbed navigation, real-time search, and premium UI.
 * @academic_standard Clean code, JSDoc documentation, and modular state management.
 */
const EquipmentServiceManagement = () => {
  // --- States ---
  const [activeTab, setActiveTab] = useState("equipments");
  const [equipments, setEquipments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    price_type: "one-time",
  });

  // Confirmation Dialogue State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // --- Core Logic ---

  /**
   * Fetches all equipment and services from the backend.
   * Synchronizes internal lists with API data.
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [eqData, svData] = await Promise.all([
        getEquipments(),
        getServicesList(),
      ]);
      setEquipments(eqData.data || []);
      setServices(svData.data || []);
    } catch (error) {
      console.error("[EquipmentServiceManagement] Data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Opens the creation/edition modal.
   * @param {Object|null} item - The item to edit, or null for creation.
   */
  const handleOpenModal = (item = null) => {
    if (item) {
      const attrs = item.attributes || item;
      setEditingItem(item);
      setFormData({
        name: attrs.name || "",
        description: attrs.description || "",
        price: attrs.price || "",
        price_type: attrs.price_type || "one-time",
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        price_type: "one-time",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Handles form submission for both Create and Update operations.
   * Dispatches to the correct API based on active tab and editing state.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const isEquipment = activeTab === "equipments";
      const id = editingItem?.documentId || editingItem?.id;

      if (isEquipment) {
        if (editingItem) await updateEquipment(id, formData);
        else await createEquipment(formData);
      } else {
        if (editingItem) await updateService(id, formData);
        else await createService(formData);
      }

      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error("[EquipmentServiceManagement] Persistence error:", error);
      alert("Erreur lors de l'enregistrement. Vérifiez vos permissions.");
    }
  };

  /**
   * Triggers the confirmation dialogue for deletion.
   * @param {Object} item - The item to be deleted.
   */
  const handleDelete = (item) => {
    const id = item.documentId || item.id;
    const label = activeTab === "equipments" ? "l'équipement" : "le service";

    setConfirmConfig({
      isOpen: true,
      title: `Supprimer ${label}?`,
      message: `Cette action est irréversible. Voulez-vous supprimer "${item.attributes?.name || item.name}" du catalogue?`,
      onConfirm: async () => {
        try {
          if (activeTab === "equipments") await deleteEquipment(id);
          else await deleteService(id);
          fetchData();
        } catch (e) {
          alert("Erreur lors de la suppression.");
        }
      },
    });
  };

  // --- Filtering Logic ---
  const currentList = activeTab === "equipments" ? equipments : services;
  const filteredItems = currentList.filter((item) => {
    const attrs = item.attributes || item;
    return attrs.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // --- Sub-components (Internal) ---

  const ConfirmationModal = () => {
    if (!confirmConfig.isOpen) return null;
    return (
      <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl transition-opacity animate-fade-in"
          onClick={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        ></div>
        <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center animate-scale-up border border-slate-100">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">
            {confirmConfig.title}
          </h3>
          <p className="text-slate-500 font-medium text-sm mb-10 leading-relaxed px-4">
            {confirmConfig.message}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() =>
                setConfirmConfig({ ...confirmConfig, isOpen: false })
              }
              className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 font-black text-[11px] uppercase rounded-2xl hover:bg-slate-200 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                confirmConfig.onConfirm();
                setConfirmConfig({ ...confirmConfig, isOpen: false });
              }}
              className="flex-1 px-8 py-4 bg-rose-600 text-white font-black text-[11px] uppercase rounded-2xl shadow-xl shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="animate-fade-in pb-20 max-w-[1400px] mx-auto px-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16 pt-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-4 py-1.5 bg-blue-600/10 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-600/20 shadow-sm">
                Gestion de Catalogue
              </span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-3">
              Équipements <span className="text-blue-600">&</span> Services
            </h1>
            <p className="text-slate-500 font-bold text-sm">
              Gérez les options de location et services annexes pour vos espaces
              de coworking.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="group flex items-center gap-4 px-10 py-5 bg-slate-900 text-white font-black text-[11px] uppercase rounded-[1.5rem] hover:bg-blue-600 transition-all shadow-2xl hover:shadow-blue-500/30 active:scale-95 border border-white/10"
          >
            <span className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center text-[10px] group-hover:rotate-90 transition-transform">
              ➕
            </span>
            Nouvel {activeTab === "equipments" ? "Équipement" : "Service"}
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-4 mb-10 bg-white/40 backdrop-blur-sm p-2 rounded-3xl border border-white/20 w-fit">
          <button
            onClick={() => setActiveTab("equipments")}
            className={`px-10 py-4 rounded-2xl font-black text-[11px] uppercase transition-all duration-300 ${activeTab === "equipments" ? "bg-white text-blue-600 shadow-xl shadow-blue-500/10" : "text-slate-400 hover:text-slate-600"}`}
          >
            📦 Équipements
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`px-10 py-4 rounded-2xl font-black text-[11px] uppercase transition-all duration-300 ${activeTab === "services" ? "bg-white text-blue-600 shadow-xl shadow-blue-500/10" : "text-slate-400 hover:text-slate-600"}`}
          >
            ⚡ Services
          </button>
        </div>

        {/* Search Bar Container */}
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] mb-12 border border-white/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <SearchBar
            onSearch={(q) => setSearchQuery(q)}
            placeholder={`Rechercher un ${activeTab === "equipments" ? "équipement" : "service"} par son nom...`}
          />
        </div>

        {/* Main List Table */}
        <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">
                    Détails du produit
                  </th>
                  <th className="p-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">
                    Tarification
                  </th>
                  <th className="p-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">
                    Fréquence
                  </th>
                  <th className="p-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] text-right">
                    Contrôles
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/50">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="p-40 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">
                          Synchronisation...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const attrs = item.attributes || item;
                    return (
                      <tr
                        key={item.id}
                        className="group hover:bg-blue-50/30 transition-all duration-300"
                      >
                        <td className="p-10">
                          <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-slate-100 group-hover:scale-110 transition-transform">
                              {activeTab === "equipments" ? "📦" : "⚡"}
                            </div>
                            <div>
                              <div className="font-black text-slate-900 text-xl uppercase tracking-tighter mb-1">
                                {attrs.name}
                              </div>
                              <div className="text-slate-400 text-xs font-bold line-clamp-1 max-w-[300px]">
                                {attrs.description ||
                                  "Aucune description fournie."}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-10">
                          <div className="flex items-center gap-3">
                            <div
                              className={`px-4 py-2 rounded-xl text-xs font-black tracking-tight ${attrs.price ? "bg-blue-50 text-blue-600 shadow-sm" : "bg-emerald-50 text-emerald-600"}`}
                            >
                              {attrs.price ? `${attrs.price} TDN` : "GRATUIT"}
                            </div>
                          </div>
                        </td>
                        <td className="p-10">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${attrs.price_type === "hourly" ? "bg-amber-400" : attrs.price_type === "daily" ? "bg-blue-400" : "bg-emerald-400"}`}
                            ></span>
                            {attrs.price_type === "hourly"
                              ? "Horaire"
                              : attrs.price_type === "daily"
                                ? "Journalier"
                                : "Unique"}
                          </span>
                        </td>
                        <td className="p-10 text-right">
                          <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                            <button
                              onClick={() => handleOpenModal(item)}
                              className="w-12 h-12 bg-white text-slate-900 rounded-xl flex items-center justify-center shadow-lg hover:bg-slate-900 hover:text-white transition-all active:scale-90 border border-slate-100"
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="w-12 h-12 bg-white text-rose-600 rounded-xl flex items-center justify-center shadow-lg hover:bg-rose-600 hover:text-white transition-all active:scale-90 border border-slate-100"
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="p-40 text-center">
                      <div className="flex flex-col items-center gap-6">
                        <div className="text-6xl grayscale opacity-40">📂</div>
                        <div>
                          <p className="text-slate-900 font-black text-xl uppercase tracking-tighter">
                            Aucun élément trouvé
                          </p>
                          <p className="text-slate-400 font-bold text-sm mt-2">
                            Affinez votre recherche ou créez un nouvel objet.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Creation & Edition */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in"
              onClick={handleCloseModal}
            ></div>
            <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-scale-up border border-white/20">
              <div className="p-12 bg-gradient-to-br from-slate-900 to-blue-950 text-white shrink-0 relative overflow-hidden">
                <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h2 className="text-4xl font-black tracking-tighter mb-2">
                      {editingItem ? "Édition" : "Création"}
                    </h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
                      {activeTab === "equipments" ? "Équipement" : "Service"}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all font-black"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-12">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-3 block tracking-[0.25em]">
                        Désignation du produit
                      </label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Ex: Écran 4K, Café à volonté..."
                        className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none font-black text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-3 block tracking-[0.25em]">
                        Description détaillée
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Quels sont les détails importants ?"
                        className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none font-bold text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all h-32 resize-none shadow-inner"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-3 block tracking-[0.25em]">
                          Prix unitaire (TDN)
                        </label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none font-black text-slate-900 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all shadow-inner text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-3 block tracking-[0.25em]">
                          Cycle de facturation
                        </label>
                        <select
                          name="price_type"
                          value={formData.price_type}
                          onChange={handleChange}
                          className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none font-black text-slate-900 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all shadow-inner appearance-none cursor-pointer"
                        >
                          <option value="one-time">✅ Unique / Une fois</option>
                          <option value="hourly">⏱️ Par Heure</option>
                          <option value="daily">📅 Par Jour</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 flex justify-end gap-5">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-10 py-5 bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-all"
                    >
                      Fermer
                    </button>
                    <button
                      type="submit"
                      className="px-14 py-5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-2xl hover:bg-blue-600 transition-all shadow-slate-900/20 active:scale-95"
                    >
                      Confirmer l'opération
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        <ConfirmationModal />
      </div>
    </AdminLayout>
  );
};

export default EquipmentServiceManagement;
