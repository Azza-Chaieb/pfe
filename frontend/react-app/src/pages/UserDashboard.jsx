import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api, { updateUser, uploadFile, updateSubProfile } from "../api";
import DashboardLayout from "../components/layout/DashboardLayout";

const UserDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("identity"); // identity, professional, settings
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const fetchUserData = async () => {
    try {
      const userRes = await api.get("/users/me?populate=avatar");
      const userBase = userRes.data;

      const endpoints = {
        student: "/etudiant-profils",
        trainer: "/formateur-profils",
        association: "/association-profils",
        professional: "/professionnels",
      };

      const endpoint = endpoints[userBase.user_type];
      let profileData = {};

      if (endpoint) {
        try {
          const profRes = await api.get(
            `${endpoint}?filters[user][id]=${userBase.id}&populate=*`,
          );
          const results = profRes.data?.data || profRes.data;
          profileData = Array.isArray(results) ? results[0] : results;
        } catch (profErr) {
          console.warn("Profile fetch error:", profErr);
        }
      }

      const fullUserData = { ...userBase, profile: profileData };
      setUserData(fullUserData);
      setEditData({
        fullname: fullUserData.fullname || "",
        phone: fullUserData.phone || "",
        bio: fullUserData.bio || "",
        city: fullUserData.city || "",
        social_links: fullUserData.social_links || {
          linkedin: "",
          twitter: "",
          instagram: "",
        },
        emailPreferences: fullUserData.emailPreferences || {
          reservations: true,
          payments: true,
          courses: true,
          newsletter: false,
        },
        profileFields: profileData.attributes || profileData || {},
      });
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Impossible de charger vos informations.");
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setEditData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setEditData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleProfileFieldChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      profileFields: { ...prev.profileFields, [name]: value },
    }));
  };

  const handlePreferenceToggle = (pref) => {
    setEditData((prev) => ({
      ...prev,
      emailPreferences: {
        ...prev.emailPreferences,
        [pref]: !prev.emailPreferences[pref],
      },
    }));
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
    setSuccessMsg("");

    try {
      let avatarId = userData.avatar?.id;
      if (avatarFile) {
        const formData = new FormData();
        formData.append("files", avatarFile);
        const uploadRes = await uploadFile(formData);
        avatarId = Array.isArray(uploadRes) ? uploadRes[0].id : uploadRes.id;
      }

      // 1. Update User Base
      await updateUser(userData.id, {
        fullname: editData.fullname,
        phone: editData.phone,
        bio: editData.bio,
        city: editData.city,
        social_links: editData.social_links,
        avatar: avatarId,
        emailPreferences: editData.emailPreferences,
      });

      // 2. Update Role Specific Profile
      const endpoints = {
        student: "/etudiant-profils",
        trainer: "/formateur-profils",
        association: "/association-profils",
        professional: "/professionnels",
      };
      const endpoint = endpoints[userData.user_type];
      const profileId = userData.profile?.documentId || userData.profile?.id;

      if (endpoint && profileId) {
        const cleanedFields = { ...editData.profileFields };
        const excludes = [
          "id",
          "documentId",
          "createdAt",
          "updatedAt",
          "publishedAt",
          "user",
        ];
        excludes.forEach((k) => delete cleanedFields[k]);
        await updateSubProfile(endpoint, profileId, cleanedFields);
      }

      setSuccessMsg("Profil mis à jour avec succès ! ✨");
      await fetchUserData();
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      console.error("Save error:", err);
      setError("Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  const getAvatarUrl = (user) => {
    if (!user?.avatar) return null;
    const url = user.avatar.url || user.avatar.attributes?.url;
    return url
      ? url.startsWith("http")
        ? url
        : `http://192.168.100.97:1337${url}`
      : null;
  };

  if (loading) return <DashboardLayout loading={true} />;

  return (
    <DashboardLayout
      role={userData?.user_type}
      user={userData}
      loading={loading}
    >
      <div className="max-w-5xl mx-auto py-4">
        {/* Profile Hero Card */}
        <div className="bg-white/40 backdrop-blur-2xl rounded-[40px] border border-white/60 shadow-2xl shadow-slate-200/50 overflow-hidden mb-10 relative group">
          <div
            className={`h-32 w-full bg-gradient-to-r ${
              userData.user_type === "student"
                ? "from-purple-500/20 to-indigo-500/20"
                : userData.user_type === "trainer"
                  ? "from-orange-500/20 to-red-500/20"
                  : "from-blue-500/20 to-cyan-500/20"
            }`}
          />

          <div className="px-10 pb-10 -mt-12 flex flex-col md:flex-row items-end gap-8">
            <div
              className="w-40 h-40 bg-white rounded-[32px] shadow-2xl shadow-slate-300 relative group cursor-pointer border-8 border-white overflow-hidden"
              onClick={() => isEditing && fileInputRef.current.click()}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : getAvatarUrl(userData) ? (
                <img
                  src={getAvatarUrl(userData)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-5xl">
                  👤
                </div>
              )}
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-black text-xs uppercase tracking-widest">
                    Modifier
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                  {userData.fullname || userData.username}
                </h1>
                <span
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    userData.user_type === "admin"
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {userData.user_type}
                </span>
              </div>
              <p className="text-slate-500 font-medium flex items-center gap-2">
                <span>📍</span> {userData.city || "Emplacement non défini"} •
                <span>📧</span> {userData.email}
              </p>
            </div>

            <div className="pb-4">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
                >
                  Éditer le Profil
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                  >
                    {saving ? "..." : "Sauvegarder"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-8 py-4 bg-white text-slate-500 border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept="images/*"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 bg-white/40 backdrop-blur-md p-2 rounded-3xl border border-white/60 w-fit">
          {[
            { id: "identity", label: "Identité", icon: "👤" },
            { id: "professional", label: "Profil Pro", icon: "💼" },
            { id: "settings", label: "Paramètres", icon: "⚙️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all ${
                activeTab === tab.id
                  ? "bg-white text-blue-600 shadow-xl shadow-blue-100"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span
                className={activeTab === tab.id ? "" : "grayscale opacity-50"}
              >
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        {error && (
          <div className="p-6 bg-red-50 text-red-600 rounded-[28px] font-bold text-sm mb-8 border border-red-100 animate-fade-in">
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div className="p-6 bg-emerald-50 text-emerald-600 rounded-[28px] font-bold text-sm mb-8 border border-emerald-100 animate-fade-in">
            ✅ {successMsg}
          </div>
        )}

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {activeTab === "identity" && (
              <div className="bg-white/40 backdrop-blur-md p-10 rounded-[40px] border border-white/60 shadow-xl shadow-slate-200/50 space-y-8 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    Informations de base
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      Nom Complet
                    </label>
                    <input
                      disabled={!isEditing}
                      name="fullname"
                      value={editData.fullname}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-white/60 border border-transparent rounded-[20px] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-slate-700 disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      Ville
                    </label>
                    <input
                      disabled={!isEditing}
                      name="city"
                      value={editData.city}
                      onChange={handleInputChange}
                      placeholder="Ex: Tunis, Paris..."
                      className="w-full px-6 py-4 bg-white/60 border border-transparent rounded-[20px] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-slate-700 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Biographie
                  </label>
                  <textarea
                    disabled={!isEditing}
                    name="bio"
                    value={editData.bio}
                    onChange={handleInputChange}
                    placeholder="Parlez-nous de vous..."
                    rows="4"
                    className="w-full px-6 py-4 bg-white/60 border border-transparent rounded-[20px] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-slate-700 disabled:opacity-50 resize-none"
                  />
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Réseaux Sociaux
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {["linkedin", "twitter", "instagram"].map((platform) => (
                      <div key={platform} className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 capitalize">
                          {platform}
                        </label>
                        <input
                          disabled={!isEditing}
                          name={`social_links.${platform}`}
                          value={editData.social_links[platform]}
                          onChange={handleInputChange}
                          placeholder="@handle"
                          className="w-full px-5 py-3 bg-white/60 border border-transparent rounded-xl focus:bg-white outline-none transition-all text-xs font-medium"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "professional" && (
              <div className="bg-white/40 backdrop-blur-md p-10 rounded-[40px] border border-white/60 shadow-xl shadow-slate-200/50 space-y-8 animate-fade-in">
                <h3 className="text-xl font-black text-slate-800 tracking-tight mb-6 capitalize">
                  Spécificités {userData.user_type}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {userData.user_type === "student" && (
                    <>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                          Niveau d'études
                        </label>
                        <input
                          disabled={!isEditing}
                          name="level"
                          value={editData.profileFields.level || ""}
                          onChange={handleProfileFieldChange}
                          className="w-full px-6 py-4 bg-white/60 border border-transparent rounded-[20px] focus:bg-white outline-none transition-all font-medium"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                          Date de naissance
                        </label>
                        <input
                          disabled={!isEditing}
                          type="date"
                          name="birth_date"
                          value={editData.profileFields.birth_date || ""}
                          onChange={handleProfileFieldChange}
                          className="w-full px-6 py-4 bg-white/60 border border-transparent rounded-[20px] focus:bg-white outline-none transition-all font-medium"
                        />
                      </div>
                    </>
                  )}
                  {userData.user_type === "trainer" && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        Spécialité
                      </label>
                      <input
                        disabled={!isEditing}
                        name="specialty"
                        value={editData.profileFields.specialty || ""}
                        onChange={handleProfileFieldChange}
                        className="w-full px-6 py-4 bg-white/60 border border-transparent rounded-[20px] focus:bg-white outline-none transition-all font-medium"
                      />
                    </div>
                  )}
                  {userData.user_type === "professional" && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        Entreprise
                      </label>
                      <input
                        disabled={!isEditing}
                        name="company"
                        value={editData.profileFields.company || ""}
                        onChange={handleProfileFieldChange}
                        className="w-full px-6 py-4 bg-white/60 border border-transparent rounded-[20px] focus:bg-white outline-none transition-all font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white/40 backdrop-blur-md p-10 rounded-[40px] border border-white/60 shadow-xl shadow-slate-200/50 space-y-8 animate-fade-in">
                <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">
                  Notifications & Messagerie
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { id: "reservations", label: "Réservations", icon: "📅" },
                    { id: "payments", label: "Paiements", icon: "💰" },
                    { id: "courses", label: "Cours", icon: "📚" },
                    { id: "newsletter", label: "Actualités", icon: "✨" },
                  ].map((pref) => (
                    <div
                      key={pref.id}
                      className="p-6 bg-white/60 rounded-[32px] border border-slate-50 flex items-center justify-between group hover:bg-white transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl group-hover:scale-110 transition-transform">
                          {pref.icon}
                        </span>
                        <div>
                          <h4 className="font-black text-slate-700 text-xs uppercase tracking-widest">
                            {pref.label}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold italic">
                            Via Email
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          isEditing && handlePreferenceToggle(pref.id)
                        }
                        className={`w-12 h-6 rounded-full transition-all duration-500 relative ${editData.emailPreferences?.[pref.id] ? "bg-emerald-500" : "bg-slate-300"}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 ${editData.emailPreferences?.[pref.id] ? "left-7" : "left-1"}`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-8">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-800 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <h3 className="text-2xl font-black mb-4 tracking-tight">
                Support VIP 👑
              </h3>
              <p className="text-indigo-100 text-sm leading-relaxed mb-8 font-medium italic">
                "Parce que votre réussite est notre priorité absolue."
              </p>
              <button className="w-full py-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-white/30">
                Contact Direct
              </button>
            </div>

            <div className="bg-white/40 backdrop-blur-md p-8 rounded-[40px] border border-white/60 shadow-xl shadow-slate-200/50">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 px-2">
                Activité de session
              </h4>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      Dernière mise à jour
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                      {userData.updatedAt
                        ? new Date(userData.updatedAt).toLocaleString("fr-FR")
                        : "À l'instant"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      Réseau actuel
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                      SunSpace Secure Gateway
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </DashboardLayout>
  );
};

export default UserDashboard;
