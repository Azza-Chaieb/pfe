import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../AdminLayout.jsx';
import { getUsers, deleteUser, updateUser } from '../../../../api';
import SearchBar from '../../common/SearchBar';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Get current user from localStorage to exclude from list
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

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
      if (error.response && error.response.status === 403) {
        alert("Accès refusé (403) : Vous n'avez pas la permission de voir les utilisateurs. Vérifiez les permissions Strapi (Authenticated > Users > find).");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await deleteUser(id);
        // Refresh list
        fetchUsers();
      } catch (e) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleUpdate = async (user) => {
    // Simple prompt for testing CRUD as requested
    const newUsername = window.prompt("Nouveau nom d'utilisateur :", user.username || user.name);
    if (newUsername && newUsername !== user.username) {
      try {
        await updateUser(user.id, { username: newUsername });
        fetchUsers();
      } catch (e) {
        console.error("Update error detailed:", e);
        let errorMessage = "Erreur lors de la modification.";
        if (e.response) {
          errorMessage += ` Status: ${e.response.status}.`;
          if (e.response.status === 403) {
            errorMessage += " Vous n'avez pas la permission (Utilisateur Authentifié vs Admin). Vérifiez les paramètres Strapi.";
          } else if (e.response.data && e.response.data.error) {
            errorMessage += ` Message: ${e.response.data.error.message}`;
          }
        }
        alert(errorMessage);
      }
    }
  };

  // Filter users: Exclude current user AND match search query
  const filteredUsers = users.filter(user => {
    const isNotCurrentUser = user.id !== currentUser.id;
    const matchesSearch = (user.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return isNotCurrentUser && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-8 tracking-tight">
          Gestion des utilisateurs
        </h1>

        <div className="mb-8 flex justify-end">
          <SearchBar onSearch={setSearchQuery} placeholder="Rechercher un utilisateur..." />
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Nom</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Rôle</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-400 italic">Chargement...</td></tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors duration-200 group">
                    <td className="p-5">
                      <div className="font-semibold text-slate-700">{user.username || user.name || 'N/A'}</div>
                    </td>
                    <td className="p-5 text-slate-500">{user.email}</td>
                    <td className="p-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                        ${user.role?.name === 'Admin'
                          ? 'bg-orange-50 text-orange-600 border-orange-100'
                          : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {user.role?.name || 'User'}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                        ${user.blocked
                          ? 'bg-red-50 text-red-600 border-red-100'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {user.blocked ? 'Bloqué' : 'Actif'}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex gap-2 transition-opacity duration-200">
                        <button
                          onClick={() => handleUpdate(user)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="p-10 text-center text-slate-400 italic">Aucun utilisateur trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Users;