import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../AdminLayout.jsx';
import { getUsers, deleteUser, updateUser } from '../../../../api';
import SearchBar from '../../common/SearchBar';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Date Range Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination & Modal state
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 8;

  // Bulk Selection State
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Custom Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

  // Get current user from localStorage to exclude from list
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const idsOnPage = paginatedUsers.map(u => u.id);
      setSelectedUserIds(prev => Array.from(new Set([...prev, ...idsOnPage])));
    } else {
      const idsOnPage = paginatedUsers.map(u => u.id);
      setSelectedUserIds(prev => prev.filter(id => !idsOnPage.includes(id)));
    }
  };

  const handleSelectUser = (id) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data && data.data) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: "Suppression définitive",
      message: "Êtes-vous absolument sûr ? Cette action supprimera définitivement le compte et toutes ses données.",
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteUser(id);
          fetchUsers();
          if (isModalOpen) setIsModalOpen(false);
          setSelectedUserIds(prev => prev.filter(i => i !== id));
        } catch (e) {
          alert("Erreur lors de la suppression");
        }
      }
    });
  };

  const handleToggleBlock = (user) => {
    const action = user.blocked ? "débloquer" : "suspendre";
    setConfirmConfig({
      isOpen: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} le compte`,
      message: `Voulez-vous vraiment ${action} l'accès de ${user.username || user.fullname} à la plateforme ?`,
      type: user.blocked ? 'success' : 'danger',
      onConfirm: async () => {
        try {
          await updateUser(user.id, { blocked: !user.blocked });
          fetchUsers();
          if (selectedUser && selectedUser.id === user.id) {
            setSelectedUser({ ...selectedUser, blocked: !user.blocked });
          }
        } catch (e) {
          alert(`Erreur lors du ${action}.`);
        }
      }
    });
  };

  const handleBulkAction = (actionType) => {
    if (selectedUserIds.length === 0) return;

    const actionLabel = actionType === 'delete' ? 'supprimer' : (actionType === 'block' ? 'suspendre' : 'débloquer');

    setConfirmConfig({
      isOpen: true,
      title: `Action Groupée : ${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)}`,
      message: `Voulez-vous vraiment ${actionLabel} les ${selectedUserIds.length} utilisateurs sélectionnés ?`,
      type: actionType === 'delete' || actionType === 'block' ? 'danger' : 'success',
      onConfirm: async () => {
        setLoading(true);
        try {
          for (const id of selectedUserIds) {
            if (actionType === 'delete') {
              await deleteUser(id);
            } else {
              await updateUser(id, { blocked: actionType === 'block' });
            }
          }
          setSelectedUserIds([]);
          fetchUsers();
        } catch (e) {
          alert("Une erreur est survenue lors du traitement groupé.");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleOpenDetails = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleUpdateName = async () => {
    const newUsername = window.prompt("Nouveau nom d'utilisateur :", selectedUser.username || selectedUser.fullname);
    if (newUsername && newUsername !== (selectedUser.username || selectedUser.fullname)) {
      try {
        await updateUser(selectedUser.id, { username: newUsername });
        const updatedUser = { ...selectedUser, username: newUsername };
        setSelectedUser(updatedUser);
        fetchUsers();
      } catch (e) {
        alert("Erreur lors de la modification.");
      }
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Username", "Email", "Role", "Status", "Date Inscription"];
    const rows = filteredUsers.map(u => [
      u.id,
      `"${u.username || u.fullname || 'N/A'}"`,
      u.email,
      u.role?.name || 'User',
      u.blocked ? 'Bloqué' : 'Active',
      new Date(u.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sunspace_users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Combined filtering logic
  const filteredUsers = users.filter(user => {
    const isNotCurrentUser = user.id !== currentUser.id;

    const matchesSearch = (user.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Switch to filtering by the custom 'user_type' attribute found in Strapi schema
    const type = (user.user_type || user.role?.name || 'Public').toLowerCase();

    let matchesRole = roleFilter === 'all';
    if (!matchesRole) {
      const rf = roleFilter.toLowerCase();

      // Match if the type starts with the filter or is a direct match
      // Also handle fallback for 'student' -> 'authenticated'
      matchesRole = type === rf || type.includes(rf) || (rf === 'student' && type === 'authenticated');

      // Handle the 'professional' mapping mismatch (UI chooses 'Professionnel', backend uses 'professional')
      if (!matchesRole && rf === 'professionnel' && type === 'professional') {
        matchesRole = true;
      }
    }

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'blocked' ? user.blocked : !user.blocked);

    const userDate = new Date(user.createdAt);
    const matchesStartDate = !startDate || userDate >= new Date(startDate);
    const matchesEndDate = !endDate || userDate <= new Date(endDate + 'T23:59:59');

    return isNotCurrentUser && matchesSearch && matchesRole && matchesStatus && matchesStartDate && matchesEndDate;
  });

  // Stats
  const statsData = [
    { label: 'Total Membres', value: users.length, icon: '👥', color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-200' },
    { label: 'Comptes Actifs', value: users.filter(u => !u.blocked).length, icon: '✅', color: 'from-emerald-400 to-teal-600', shadow: 'shadow-emerald-200' },
    { label: 'Suspendus', value: users.filter(u => u.blocked).length, icon: '🚫', color: 'from-rose-400 to-red-600', shadow: 'shadow-rose-200' },
    { label: 'Staff Admin', value: users.filter(u => u.user_type === 'admin' || u.role?.name === 'Admin').length, icon: '👑', color: 'from-amber-400 to-orange-600', shadow: 'shadow-amber-200' }
  ];

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Custom Confirmation Modal component
  const ConfirmationModal = () => {
    if (!confirmConfig.isOpen) return null;
    return (
      <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}></div>
        <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-up border border-white/20 p-10 text-center">
          <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-3xl mb-6 shadow-xl ${confirmConfig.type === 'danger' ? 'bg-rose-50 text-rose-500 shadow-rose-100' : 'bg-blue-50 text-blue-500 shadow-blue-100'}`}>
            {confirmConfig.type === 'danger' ? '⚠️' : 'ℹ️'}
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{confirmConfig.title}</h3>
          <p className="text-slate-500 font-bold text-sm mb-10 leading-relaxed">{confirmConfig.message}</p>
          <div className="flex gap-4">
            <button onClick={() => setConfirmConfig({ ...confirmConfig, isOpen: false })} className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 font-black text-[11px] uppercase rounded-2xl hover:bg-slate-200 transition-all">Annuler</button>
            <button onClick={() => { confirmConfig.onConfirm(); setConfirmConfig({ ...confirmConfig, isOpen: false }); }}
              className={`flex-1 px-8 py-4 text-white font-black text-[11px] uppercase rounded-2xl transition-all shadow-lg active:scale-95 ${confirmConfig.type === 'danger' ? 'bg-rose-600 shadow-rose-200 hover:bg-rose-700' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'}`}>
              Confirmer
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal Component
  const UserModal = () => {
    if (!selectedUser) return null;

    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={() => setIsModalOpen(false)}></div>
        <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-up border border-white/20">
          <div className={`p-10 text-white shadow-inner ${selectedUser.blocked ? 'bg-gradient-to-br from-slate-700 to-slate-900' : 'bg-gradient-to-br from-blue-600 to-indigo-800'}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-black shadow-lg border border-white/10">
                  {selectedUser.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">{selectedUser.username || selectedUser.fullname}</h2>
                  <p className="text-blue-100/70 font-bold text-sm">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-3">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {selectedUser.user_type ? selectedUser.user_type.charAt(0).toUpperCase() + selectedUser.user_type.slice(1) : (selectedUser.role?.name || 'User')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${selectedUser.blocked ? 'bg-red-500/30' : 'bg-emerald-500/30'}`}>
                      {selectedUser.blocked ? 'Bloqué' : 'Actif'}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all font-bold">✕</button>
            </div>
          </div>

          <div className="p-10 bg-white">
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span> Informations Compte
                </h4>
                <div className="space-y-3">
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-black uppercase mb-1">ID Utilisateur</p>
                    <p className="font-black text-slate-700">#{selectedUser.id}</p>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Date d'inscription</p>
                    <p className="font-black text-slate-700">{new Date(selectedUser.createdAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1 h-1 bg-indigo-500 rounded-full"></span> Détails Système
                </h4>
                <div className="space-y-3">
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Dernière Mise à Jour</p>
                    <p className="font-black text-slate-700">{new Date(selectedUser.updatedAt).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Statut Vérification</p>
                    <p className={`font-black flex items-center gap-2 ${selectedUser.confirmed ? 'text-emerald-600' : 'text-orange-500'}`}>
                      {selectedUser.confirmed ? 'Confirmé ✅' : 'En attente ⏳'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-slate-100">
              <button onClick={() => handleDelete(selectedUser.id)} className="px-5 py-3 text-red-400 hover:text-red-600 font-black text-[10px] uppercase hover:bg-red-50 rounded-xl transition-all">🗑️ Supprimer</button>
              <div className="flex gap-3">
                <button onClick={handleUpdateName} className="px-6 py-3 bg-slate-100 text-slate-600 font-black text-[10px] uppercase rounded-xl hover:bg-slate-200 transition-all">✏️ Renommer</button>
                <button onClick={() => handleToggleBlock(selectedUser)} className={`px-8 py-3 font-black text-[10px] uppercase rounded-xl transition-all shadow-lg active:scale-95 ${selectedUser.blocked ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-rose-600 text-white shadow-rose-200'}`}>
                  {selectedUser.blocked ? '🔓 Débloquer' : '🚫 Suspendre'}
                </button>
              </div>
            </div>
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
              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider">Administration</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Utilisateurs</h1>
          </div>
          <button onClick={handleExportCSV} className="group flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 text-slate-700 font-black text-xs uppercase rounded-2xl hover:bg-slate-50 transition-all shadow-sm hover:shadow-md active:scale-95">
            <span className="text-lg group-hover:rotate-12 transition-transform">📤</span> Exporter la liste
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statsData.map((s, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center justify-between group hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${s.color} opacity-[0.03] rounded-full -mr-16 -mt-16`}></div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{s.label}</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter">{s.value}</p>
              </div>
              <div className={`relative z-10 w-14 h-14 bg-gradient-to-br ${s.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg ${s.shadow} text-white transition-transform group-hover:scale-110 duration-500`}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] mb-12 border border-slate-100 shadow-2xl shadow-slate-200/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-4">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">Recherche Rapide</label>
              <SearchBar onSearch={(q) => { setSearchQuery(q); setCurrentPage(1); }} placeholder="Nom, email, ID..." />
            </div>

            <div className="lg:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">Rôle</label>
              <div className="relative group">
                <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full appearance-none px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black text-slate-600 outline-none hover:bg-white transition-all focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400">
                  <option value="all">Tous les rôles</option>
                  <option value="Admin">Administrateurs</option>
                  <option value="Trainer">Coachs / Trainers</option>
                  <option value="Student">Étudiants</option>
                  <option value="Association">Associations</option>
                  <option value="Professionnel">Professionnels</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-[8px]">▼</div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">Statut</label>
              <div className="relative group">
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full appearance-none px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black text-slate-600 outline-none hover:bg-white transition-all focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400">
                  <option value="all">Tous statuts</option>
                  <option value="active">Actifs</option>
                  <option value="blocked">Suspendus</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-[8px]">▼</div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">Période d'inscription</label>
              <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl p-1 gap-2">
                <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                  className="flex-1 bg-transparent px-3 py-3 text-[10px] font-black text-slate-600 outline-none hover:bg-white rounded-xl transition-all" />
                <span className="text-slate-300 font-bold">→</span>
                <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="flex-1 bg-transparent px-3 py-3 text-[10px] font-black text-slate-600 outline-none hover:bg-white rounded-xl transition-all" />
              </div>
            </div>

            <div className="lg:col-span-1">
              <button onClick={handleResetFilters} title="Réinitialiser"
                className="w-full h-[52px] bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg active:scale-95 flex items-center justify-center group">
                <span className="group-hover:rotate-180 transition-transform duration-500 text-lg">🔄</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="p-8 w-10">
                    <input type="checkbox"
                      onChange={handleSelectAll}
                      checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUserIds.includes(u.id))}
                      className="w-5 h-5 rounded-lg border-2 border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer" />
                  </th>
                  <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Membre</th>
                  <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Détails</th>
                  <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Statut</th>
                  <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="5" className="p-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="font-black text-slate-300 uppercase italic tracking-widest text-[11px]">Synchronisation</span>
                    </div>
                  </td></tr>
                ) : paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user, idx) => (
                    <tr key={user.id} className={`group hover:bg-slate-50/80 transition-all duration-300 ${selectedUserIds.includes(user.id) ? 'bg-blue-50/30' : ''}`}>
                      <td className="p-8">
                        <input type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="w-5 h-5 rounded-lg border-2 border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer" />
                      </td>
                      <td className="p-8">
                        <div className="flex items-center gap-5">
                          <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-transform group-hover:scale-105 duration-300 ${user.blocked ? 'bg-slate-100 text-slate-300' : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20'}`}>
                            {user.username?.charAt(0).toUpperCase() || '?'}
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.blocked ? 'bg-slate-300' : 'bg-emerald-500'}`}></div>
                          </div>
                          <div>
                            <div className="font-black text-slate-900 text-lg leading-none mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{user.username || user.fullname}</div>
                            <div className="text-slate-400 text-xs font-bold font-mono">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-8">
                        <div className="inline-flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Inscrit le</span>
                          <div className="text-sm font-black text-slate-700">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</div>
                          <span className={`mt-2 text-[9px] font-black uppercase tracking-wider ${user.user_type === 'admin' || user.role?.name === 'Admin' ? 'text-amber-500' : 'text-indigo-400'}`}>
                            {user.user_type ? user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1) : (user.role?.name || 'User')}
                          </span>
                        </div>
                      </td>
                      <td className="p-8">
                        <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-2xl border transition-all duration-300 ${user.blocked ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                          <span className={`w-2 h-2 rounded-full ${user.blocked ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${user.blocked ? 'text-rose-500' : 'text-emerald-600'}`}>
                            {user.blocked ? 'Suspendu' : 'Compte Actif'}
                          </span>
                        </div>
                      </td>
                      <td className="p-8 text-right">
                        <button onClick={() => handleOpenDetails(user)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-200 hover:shadow-blue-500/20">
                          🎯 Gérer
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="p-32 text-center">
                    <div className="opacity-30 flex flex-col items-center gap-4">
                      <div className="text-4xl">🔎</div>
                      <p className="font-black text-slate-400 uppercase italic tracking-[0.3em] text-[11px]">Aucun utilisateur trouvé</p>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-10 flex items-center justify-between bg-slate-50/50 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Page {currentPage} / {totalPages}</span>
              </div>
              <div className="flex gap-4">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)}
                  className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-30 disabled:hover:bg-white shadow-sm">
                  Précédent
                </button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-30 shadow-lg shadow-slate-200">
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Action Bar - Sticky */}
      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[5000] animate-scale-up">
          <div className="bg-slate-900 text-white px-10 py-6 rounded-[2.5rem] shadow-2xl flex items-center gap-10 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center font-black text-xs">{selectedUserIds.length}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sélectionnés</span>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="flex gap-4">
              <button onClick={() => handleBulkAction('block')} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">🚫 Suspendre</button>
              <button onClick={() => handleBulkAction('unblock')} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">🔓 Activer</button>
              <button onClick={() => handleBulkAction('delete')} className="px-6 py-3 bg-rose-500 hover:bg-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20">🗑️ Supprimer</button>
            </div>
            <button onClick={() => setSelectedUserIds([])} className="text-[10px] font-black uppercase text-slate-400 hover:text-white transition-colors ml-4">Annuler</button>
          </div>
        </div>
      )}

      {isModalOpen && <UserModal />}
      <ConfirmationModal />
    </AdminLayout>
  );
};

export default Users;