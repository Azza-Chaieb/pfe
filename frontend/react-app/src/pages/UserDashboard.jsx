import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { updateUser, uploadFile, updateSubProfile } from '../api';

const UserDashboard = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [debugError, setDebugError] = useState(null);

    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const getProfileEndpoint = (type) => {
        const endpoints = {
            student: '/etudiant-profils',
            trainer: '/formateur-profils',
            association: '/association-profils',
            professional: '/professionnels',
        };
        return endpoints[type] || '';
    };

    const getProfileId = () => {
        const prof = userData.etudiant_profil ||
            userData.formateur_profil ||
            userData.association_profil ||
            userData.professionnel ||
            userData.trainer_profile;
        return prof?.documentId || prof?.id;
    };

    const fetchUserData = async () => {
        try {
            // Step 1: Get basic user info (Standard endpoint, no populate needed yet)
            const userRes = await api.get('/users/me?populate=avatar');
            const userBase = userRes.data;

            // Step 2: Get specific profile info using filters (More robust in Strapi 5)
            const endpoint = getProfileEndpoint(userBase.user_type);
            let profileData = {};

            if (endpoint) {
                try {
                    const profRes = await api.get(`${endpoint}?filters[user][id]=${userBase.id}&populate=*`);
                    // Strapi API returns { data: [...] } for find queries
                    const results = profRes.data?.data || profRes.data;
                    profileData = Array.isArray(results) ? results[0] : results;
                } catch (profErr) {
                    console.warn("Profile fetch error (Dual-Fetch):", profErr);
                }
            }

            // Merge everything
            const fullUserData = {
                ...userBase,
                // Add the profile data under the expected key for backward compatibility
                ...(userBase.user_type === 'student' && { etudiant_profil: profileData }),
                ...(userBase.user_type === 'trainer' && { formateur_profil: profileData }),
                ...(userBase.user_type === 'association' && { association_profil: profileData }),
                ...(userBase.user_type === 'professional' && { professionnel: profileData }),
            };

            setUserData(fullUserData);
            setEditData({
                fullname: fullUserData.fullname,
                phone: fullUserData.phone,
                ...profileData
            });
            setError(null);
        } catch (err) {
            console.error("Dashboard dual-fetch error:", err.response?.data || err);
            const errorObj = err.response?.data?.error;
            setDebugError(errorObj);
            setError(errorObj?.message || "Impossible de charger vos informations.");
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [navigate]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 animate-fade-in">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (error || !userData) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                <p className="text-red-500 mb-4">{error || "Une erreur est survenue."}</p>
                <button onClick={() => navigate('/login')} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Retour au login</button>
            </div>
        </div>
    );


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccessMsg('');

        try {
            // 1. Upload Avatar if changed
            let avatarId = userData.avatar?.id;
            if (avatarFile) {
                const formData = new FormData();
                formData.append('files', avatarFile);
                const uploadRes = await uploadFile(formData);
                avatarId = Array.isArray(uploadRes) ? uploadRes[0].id : uploadRes.id;
            }

            // 2. Update User (fullname, phone, avatar)
            await updateUser(userData.id, {
                fullname: editData.fullname,
                phone: editData.phone,
                avatar: avatarId
            });

            // 3. Update Specific Profile
            const endpoint = getProfileEndpoint(userData.user_type);
            const profileId = getProfileId();
            if (endpoint && profileId) {
                const profilePayload = { ...editData };
                // Clean up meta/system fields that Strapi 5 rejects in data object
                const keysToExclude = [
                    'id', 'documentId', 'createdAt', 'updatedAt', 'publishedAt',
                    'published_at', 'created_at', 'updated_at',
                    'fullname', 'phone', 'user', 'localizations', 'locale'
                ];
                keysToExclude.forEach(key => delete profilePayload[key]);

                await updateSubProfile(endpoint, profileId, profilePayload);
            }

            setSuccessMsg('Profil mis à jour avec succès !');
            setTimeout(() => setSuccessMsg(''), 5000); // Auto-hide success message
            await fetchUserData(); // Refresh data
            setIsEditing(false);
            setAvatarFile(null);
            setAvatarPreview(null);
        } catch (err) {
            console.error("Save error full details:", err.response?.data || err);
            const errorObj = err.response?.data?.error;
            setDebugError(errorObj);
            const msg = errorObj?.message || "Erreur lors de la sauvegarde.";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    // Get the specific profile data for view mode
    const profile = userData.etudiant_profil ||
        userData.formateur_profil ||
        userData.association_profil ||
        userData.professionnel ||
        userData.trainer_profile || {};

    const getRoleLabel = (role) => {
        const roles = {
            student: 'Étudiant',
            trainer: 'Formateur',
            association: 'Association',
            professional: 'Professionnel',
            admin: 'Administrateur'
        };
        return roles[role] || role;
    };

    const getThemeColor = (role) => {
        const themes = {
            student: 'from-purple-500 to-indigo-600',
            trainer: 'from-orange-400 to-red-500',
            association: 'from-teal-400 to-blue-500',
            professional: 'from-blue-600 to-indigo-800',
            admin: 'from-gray-700 to-gray-900'
        };
        return themes[role] || 'from-blue-500 to-indigo-600';
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12 animate-fade-in overflow-x-hidden">
            {/* Header / Hero */}
            <div className={`h-48 bg-gradient-to-r ${getThemeColor(userData.user_type)} w-full relative`}>
                <div
                    className="absolute -bottom-16 left-1/2 -translate-x-1/2 md:left-24 md:translate-x-0 w-32 h-32 bg-white rounded-3xl shadow-xl flex items-center justify-center text-4xl border-4 border-white overflow-hidden cursor-pointer group"
                    onClick={() => isEditing && fileInputRef.current.click()}
                >
                    {avatarPreview || (userData.avatar ? `http://localhost:1337${userData.avatar.url}` : null) ? (
                        <img
                            src={avatarPreview || `http://localhost:1337${userData.avatar.url}`}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span>{userData.user_type === 'student' ? '🎓' : userData.user_type === 'trainer' ? '👨‍🏫' : userData.user_type === 'association' ? '🤝' : '💼'}</span>
                    )}

                    {isEditing && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-sm font-bold">Changer</span>
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
            </div>

            <div className="max-w-6xl mx-auto px-4 mt-20">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Main Content */}
                    <div className="flex-1 space-y-6">
                        {/* Feedback Messages */}
                        {error && (
                            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl animate-fade-in space-y-2">
                                <p className="font-bold">{error}</p>
                                {debugError && (
                                    <div className="text-[10px] bg-red-100/50 p-2 rounded border border-red-200 overflow-auto max-h-24 font-mono">
                                        <p>🔍 Détails techniques :</p>
                                        <pre>{JSON.stringify(debugError, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-xl animate-fade-in">
                                {successMsg}
                            </div>
                        )}

                        {/* Profile Mode Toggle Title */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                {isEditing ? 'Modifier votre profil' : 'Votre Tableau de bord'}
                            </h2>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                >
                                    Éditer le profil
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            /* EDIT MODE */
                            <div className="space-y-6 animate-fade-in">
                                {/* Avatar Edit Section */}
                                <div className="bg-white p-8 rounded-3xl shadow-xl border border-white/60 backdrop-blur-md">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Photo de profil</h3>
                                    <div className="flex items-center gap-6">
                                        <div
                                            className="w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
                                            onClick={() => fileInputRef.current.click()}
                                        >
                                            {avatarPreview || (userData.avatar ? `http://localhost:1337${userData.avatar.url}` : null) ? (
                                                <img
                                                    src={avatarPreview || `http://localhost:1337${userData.avatar.url}`}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-2xl text-slate-300">+</span>
                                            )}
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => fileInputRef.current.click()}
                                                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-all"
                                            >
                                                Changer la photo
                                            </button>
                                            <p className="text-xs text-slate-400 mt-2 italic">Format JPG, PNG. Taille max 2Mo.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-3xl shadow-xl border border-white/60 backdrop-blur-md">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Informations Générales</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nom Complet</label>
                                            <input
                                                type="text" name="fullname" value={editData.fullname || ''} onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Téléphone</label>
                                            <input
                                                type="text" name="phone" value={editData.phone || ''} onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-3xl shadow-xl border border-white/60 backdrop-blur-md">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Détails Spécifiques ({getRoleLabel(userData.user_type)})</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {userData.user_type === 'student' && (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Niveau d'études</label>
                                                    <input type="text" name="level" value={editData.level || ''} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Date de naissance</label>
                                                    <input type="date" name="birth_date" value={editData.birth_date || ''} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all" />
                                                </div>
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Adresse</label>
                                                    <textarea name="address" value={editData.address || ''} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all" rows="2" />
                                                </div>
                                            </>
                                        )}
                                        {userData.user_type === 'trainer' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Spécialité</label>
                                                <input type="text" name="specialty" value={editData.specialty || ''} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all" />
                                            </div>
                                        )}
                                        {userData.user_type === 'association' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nom de l'Organisation</label>
                                                <input type="text" name="name" value={editData.name || ''} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all" />
                                            </div>
                                        )}
                                        {userData.user_type === 'professional' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Entreprise</label>
                                                <input type="text" name="company" value={editData.company || ''} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={handleSave} disabled={saving}
                                        className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl disabled:opacity-50"
                                    >
                                        {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)} disabled={saving}
                                        className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all font-sans"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* VIEW MODE */
                            <div className="space-y-6 animate-fade-in">
                                {/* Welcome Card */}
                                <div className="bg-white p-8 rounded-3xl shadow-xl border border-white/60 backdrop-blur-md hover:scale-[1.01] transition-all duration-300">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Bonjour, {userData.fullname || userData.username} !</h1>
                                            <p className="text-slate-500">Bienvenue dans votre espace <span className="font-semibold text-blue-600">{getRoleLabel(userData.user_type)}</span></p>
                                        </div>
                                        <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${userData.user_type === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {getRoleLabel(userData.user_type)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Email</p>
                                            <p className="text-slate-700 font-medium">{userData.email}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Téléphone</p>
                                            <p className="text-slate-700 font-medium">{userData.phone || 'Non renseigné'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Specific Info Card */}
                                <div className="bg-white/80 p-8 rounded-3xl shadow-xl border border-white/60 backdrop-blur-md hover:scale-[1.01] transition-all duration-300">
                                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <span className="p-2 bg-gray-50 rounded-lg">📋</span>
                                        Détails de votre profil
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {userData.user_type === 'student' && (
                                            <>
                                                <div className="p-4 bg-gray-50 rounded-2xl">
                                                    <p className="text-xs text-gray-400 font-bold mb-1">Niveau d'études</p>
                                                    <p className="text-lg font-medium text-gray-800">{profile.level || 'Non spécifié'}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-2xl">
                                                    <p className="text-xs text-gray-400 font-bold mb-1">Date de naissance</p>
                                                    <p className="text-lg font-medium text-gray-800">{profile.birth_date || 'Non spécifiée'}</p>
                                                </div>
                                                <div className="md:col-span-2 p-4 bg-gray-50 rounded-2xl">
                                                    <p className="text-xs text-gray-400 font-bold mb-1">Adresse</p>
                                                    <p className="text-gray-800 italic">{profile.address || 'Aucune adresse enregistrée'}</p>
                                                </div>
                                            </>
                                        )}

                                        {userData.user_type === 'trainer' && (
                                            <>
                                                <div className="p-4 bg-gray-50 rounded-2xl">
                                                    <p className="text-xs text-gray-400 font-bold mb-1">Spécialité</p>
                                                    <p className="text-lg font-medium text-gray-800">{profile.specialty || 'Non spécifiée'}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-2xl">
                                                    <p className="text-xs text-gray-400 font-bold mb-1">Téléphone de contact</p>
                                                    <p className="text-lg font-medium text-gray-800">{profile.phone || userData.phone}</p>
                                                </div>
                                            </>
                                        )}

                                        {userData.user_type === 'association' && (
                                            <>
                                                <div className="p-4 bg-gray-50 rounded-2xl">
                                                    <p className="text-xs text-gray-400 font-bold mb-1">Organisation</p>
                                                    <p className="text-lg font-medium text-gray-800">{profile.name || 'Non spécifiée'}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-2xl">
                                                    <p className="text-xs text-gray-400 font-bold mb-1">Téléphone Office</p>
                                                    <p className="text-lg font-medium text-gray-800">{profile.phone || userData.phone}</p>
                                                </div>
                                            </>
                                        )}

                                        {userData.user_type === 'professional' && (
                                            <div className="md:col-span-2 p-4 bg-gray-50 rounded-2xl">
                                                <p className="text-xs text-gray-400 font-bold mb-1">Entreprise</p>
                                                <p className="text-xl font-bold text-gray-800">{profile.company || 'Non spécifiée'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Actions */}
                    <div className="md:w-72 space-y-4">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-center gap-3"
                        >
                            <span className="p-2 bg-blue-50 text-blue-500 rounded-lg">🏠</span>
                            <span className="font-medium text-gray-700">Retour à l'accueil</span>
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem('jwt');
                                localStorage.removeItem('user');
                                navigate('/login');
                            }}
                            className="w-full p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all text-left flex items-center gap-3"
                        >
                            <span className="p-2 bg-white rounded-lg">🚪</span>
                            <span className="font-medium">Se déconnecter</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
