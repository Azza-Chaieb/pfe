import React, { useState, useEffect } from "react";
import { AdminLayout } from "../AdminLayout.jsx";
import {
  getSpaces,
  deleteSpace,
  createSpace,
  updateSpace,
  getEquipments,
  getServicesList,
  getCoworkingSpacesList,
} from "../../../../api";
import SearchBar from "../../common/SearchBar";

const SpaceManagement = () => {
  const [spaces, setSpaces] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [services, setServices] = useState([]);
  const [coworkingSpaces, setCoworkingSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modal & Edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editiingSpace, setEditingSpace] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "hot-desk",
    capacity: 1,
    floor: 0,
    pricing_hourly: "",
    pricing_daily: "",
    pricing_weekly: "",
    pricing_monthly: "",
    coworking_space: "",
    mesh_name: "",
    equipments: [],
    services: [],
  });

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "danger",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [spacesData, equipmentsData, servicesData, coworkingData] =
        await Promise.all([
          getSpaces(),
          getEquipments(),
          getServicesList(),
          getCoworkingSpacesList(),
        ]);

      setSpaces(spacesData.data || []);
      setEquipments(equipmentsData.data || []);
      setServices(servicesData.data || []);
      setCoworkingSpaces(coworkingData.data || []);
    } catch (error) {
      console.error("Failed to load management data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (space = null) => {
    if (space) {
      const attrs = space.attributes || space;
      setEditingSpace(space);
      setFormData({
        name: attrs.name || "",
        type: attrs.type || "hot-desk",
        capacity: attrs.capacity || 1,
        floor: attrs.floor || 0,
        mesh_name: attrs.mesh_name || "",
        pricing_hourly: attrs.pricing_hourly || "",
        pricing_daily: attrs.pricing_daily || "",
        pricing_weekly: attrs.pricing_weekly || "",
        pricing_monthly: attrs.pricing_monthly || "",
        coworking_space:
          attrs.coworking_space?.data?.id || attrs.coworking_space?.id || "",
        equipments:
          attrs.equipments?.data?.map((e) => e.id) ||
          attrs.equipments?.map((e) => e.id) ||
          [],
        services:
          attrs.services?.data?.map((s) => s.id) ||
          attrs.services?.map((s) => s.id) ||
          [],
      });
    } else {
      setEditingSpace(null);
      setFormData({
        name: "",
        type: "hot-desk",
        capacity: 1,
        floor: 0,
        pricing_hourly: "",
        pricing_daily: "",
        pricing_weekly: "",
        pricing_monthly: "",
        coworking_space: "",
        mesh_name: "",
        equipments: [],
        services: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSpace(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleEquipment = (id) => {
    setFormData((prev) => ({
      ...prev,
      equipments: prev.equipments.includes(id)
        ? prev.equipments.filter((eId) => eId !== id)
        : [...prev.equipments, id],
    }));
  };

  const handleToggleService = (id) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(id)
        ? prev.services.filter((sId) => sId !== id)
        : [...prev.services, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editiingSpace) {
        const targetId = editiingSpace.documentId || editiingSpace.id;
        await updateSpace(targetId, formData);
      } else {
        await createSpace(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      alert("Erreur lors de l'enregistrement de l'espace");
    }
  };

  const handleDelete = (space) => {
    const id = space.documentId || space.id;
    setConfirmConfig({
      isOpen: true,
      title: "Supprimer l'espace",
      message:
        "Êtes-vous sûr de vouloir supprimer cet espace ? Cette action est irréversible.",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteSpace(id);
          fetchData();
        } catch (e) {
          alert("Erreur lors de la suppression");
        }
      },
    });
  };

  const filteredSpaces = spaces.filter((space) => {
    const attrs = space.attributes || space;
    if (!attrs || !attrs.name) return false;
    const matchesSearch = attrs.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || attrs.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const ConfirmationModal = () => {
    if (!confirmConfig.isOpen) return null;
    return (
      <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
          onClick={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        ></div>
        <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center animate-scale-up">
          <div
            className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-3xl mb-6 ${confirmConfig.type === "danger" ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
          >
            {confirmConfig.type === "danger" ? "⚠️" : "ℹ️"}
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4">
            {confirmConfig.title}
          </h3>
          <p className="text-slate-500 font-bold text-sm mb-10">
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
              className={`flex-1 px-8 py-4 text-white font-black text-[11px] uppercase rounded-2xl transition-all shadow-lg ${confirmConfig.type === "danger" ? "bg-rose-600 shadow-rose-200 hover:bg-rose-700" : "bg-blue-600 shadow-blue-200 hover:bg-blue-700"}`}
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="animate-fade-in pb-20 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                Administration
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Gestion des Espaces
            </h1>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="group flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-black text-xs uppercase rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            <span className="text-lg">➕</span> Nouvel Espace
          </button>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] mb-12 border border-slate-100 shadow-2xl shadow-slate-200/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">
                Recherche Rapide
              </label>
              <SearchBar
                onSearch={(q) => setSearchQuery(q)}
                placeholder="Rechercher par nom d'espace..."
              />
            </div>

            <div className="lg:col-span-4">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">
                Type d'espace
              </label>
              <div className="relative group">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full appearance-none px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black text-slate-600 outline-none hover:bg-white transition-all focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400"
                >
                  <option value="all">Tous les types</option>
                  <option value="hot-desk">Hot Desk</option>
                  <option value="fixed-desk">Fixed Desk</option>
                  <option value="meeting-room">Meeting Room</option>
                  <option value="event-space">Event Space</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-[8px]">
                  ▼
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Espace
                  </th>
                  <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Type / Capacité
                  </th>
                  <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Pricing (H / D)
                  </th>
                  <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="p-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="font-black text-slate-300 uppercase italic tracking-widest text-[11px]">
                          Chargement des espaces...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSpaces.length > 0 ? (
                  filteredSpaces.map((space) => {
                    const attrs = space.attributes || space;
                    const coworkingName =
                      attrs.coworking_space?.data?.attributes?.name ||
                      attrs.coworking_space?.name ||
                      "Sans coworking space";
                    return (
                      <tr
                        key={space.id}
                        className="group hover:bg-slate-50/80 transition-all duration-300"
                      >
                        <td className="p-8">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-xl shadow-blue-500/20 group-hover:scale-105 transition-transform">
                              {attrs.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div>
                              <div className="font-black text-slate-900 text-lg leading-none mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                {attrs.name}
                              </div>
                              <div className="text-slate-400 text-xs font-bold font-mono">
                                {coworkingName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-8">
                          <div className="inline-flex flex-col">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-wider w-fit mb-2">
                              {attrs.type}
                            </span>
                            <span className="text-sm font-black text-slate-700">
                              👥 {attrs.capacity} Personnes
                            </span>
                          </div>
                        </td>
                        <td className="p-8">
                          <div className="text-sm font-black text-slate-700">
                            {attrs.pricing_hourly
                              ? `${attrs.pricing_hourly} DT/h`
                              : "N/A"}
                          </div>
                          <div className="text-slate-400 text-xs font-bold">
                            {attrs.pricing_daily
                              ? `${attrs.pricing_daily} DT/jour`
                              : "N/A"}
                          </div>
                        </td>
                        <td className="p-8 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => handleOpenModal(space)}
                              className="px-6 py-4 bg-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all shadow-sm"
                            >
                              ✏️ Éditer
                            </button>
                            <button
                              onClick={() => handleDelete(space)}
                              className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase hover:bg-rose-100 transition-all"
                            >
                              🗑️ Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="p-32 text-center text-slate-400 italic"
                    >
                      Aucun espace trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in"
              onClick={handleCloseModal}
            ></div>
            <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-up border border-white/20 max-h-[90vh] flex flex-col">
              <div className="p-10 bg-gradient-to-br from-blue-600 to-indigo-800 text-white shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">
                      {editiingSpace ? "Éditer l'Espace" : "Nouvel Espace"}
                    </h2>
                    <p className="text-blue-100/70 font-bold text-sm mt-1">
                      Configurez les caractéristiques et les options de l'espace
                      de coworking.
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-10 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* General Info */}
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1 h-1 bg-blue-500 rounded-full"></span>{" "}
                        Informations Générales
                      </h4>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">
                          Nom de l'espace
                        </label>
                        <input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">
                          ID du Mesh 3D
                        </label>
                        <input
                          name="mesh_name"
                          value={formData.mesh_name}
                          onChange={handleChange}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all font-bold"
                          placeholder="Ex: desk_01, room_A"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">
                            Type
                          </label>
                          <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all font-bold"
                          >
                            <option value="hot-desk">Hot Desk</option>
                            <option value="fixed-desk">Fixed Desk</option>
                            <option value="meeting-room">Meeting Room</option>
                            <option value="event-space">Event Space</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">
                            Capacité
                          </label>
                          <input
                            type="number"
                            name="capacity"
                            value={formData.capacity}
                            onChange={handleChange}
                            min="1"
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all font-bold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">
                            Étage
                          </label>
                          <input
                            type="number"
                            name="floor"
                            value={formData.floor}
                            onChange={handleChange}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">
                            Coworking Space
                          </label>
                          <select
                            name="coworking_space"
                            value={formData.coworking_space}
                            onChange={handleChange}
                            required
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all font-bold"
                          >
                            <option value="">Sélectionner...</option>
                            {coworkingSpaces.map((cs) => {
                              const csAttrs = cs.attributes || cs;
                              return (
                                <option key={cs.id} value={cs.id}>
                                  {csAttrs.name}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>{" "}
                        Tarification (DT)
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">
                            Horaire
                          </label>
                          <input
                            type="number"
                            name="pricing_hourly"
                            value={formData.pricing_hourly}
                            onChange={handleChange}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">
                            Journalier
                          </label>
                          <input
                            type="number"
                            name="pricing_daily"
                            value={formData.pricing_daily}
                            onChange={handleChange}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">
                            Hebdomadaire
                          </label>
                          <input
                            type="number"
                            name="pricing_weekly"
                            value={formData.pricing_weekly}
                            onChange={handleChange}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">
                            Mensuel
                          </label>
                          <input
                            type="number"
                            name="pricing_monthly"
                            value={formData.pricing_monthly}
                            onChange={handleChange}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Equipments */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>{" "}
                      Équipements Associés
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {equipments.map((eq) => {
                        const eqAttrs = eq.attributes || eq;
                        return (
                          <button
                            key={eq.id}
                            type="button"
                            onClick={() => handleToggleEquipment(eq.id)}
                            className={`px-4 py-3 rounded-xl border text-[11px] font-bold transition-all text-left flex items-center gap-2
                                                        ${formData.equipments.includes(eq.id) ? "bg-blue-600 border-blue-600 text-white shadow-md" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"}`}
                          >
                            <span className="text-base">
                              {formData.equipments.includes(eq.id)
                                ? "✅"
                                : "➕"}
                            </span>
                            {eqAttrs.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Services */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1 h-1 bg-violet-500 rounded-full"></span>{" "}
                      Services Additionnels
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {services.map((sv) => {
                        const svAttrs = sv.attributes || sv;
                        return (
                          <button
                            key={sv.id}
                            type="button"
                            onClick={() => handleToggleService(sv.id)}
                            className={`px-4 py-3 rounded-xl border text-[11px] font-bold transition-all text-left flex items-center gap-2
                                                        ${formData.services?.includes(sv.id) ? "bg-violet-600 border-violet-600 text-white shadow-md" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"}`}
                          >
                            <span className="text-base">
                              {formData.services?.includes(sv.id) ? "✅" : "➕"}
                            </span>
                            {svAttrs.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-8 py-4 bg-slate-100 text-slate-600 font-black text-[11px] uppercase rounded-2xl hover:bg-slate-200 transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-12 py-4 bg-blue-600 text-white font-black text-[11px] uppercase rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                    >
                      {editiingSpace ? "Mettre à jour" : "Créer l'espace"}
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

export default SpaceManagement;
