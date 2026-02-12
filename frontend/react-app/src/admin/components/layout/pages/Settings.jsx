import React, { useState } from 'react';
import { AdminLayout } from '../AdminLayout.jsx';

const Settings = () => {
  const [generalConfig, setGeneralConfig] = useState({
    siteName: 'SunSpace Admin',
    supportEmail: 'contact@sunspace.com',
    maintenanceMode: false,
    allowRegistrations: true,
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    newOrderAlert: true,
    newUserAlert: false,
  });

  const handleGeneralChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGeneralConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNotificationChange = (name) => {
    setNotifications(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Paramètres sauvegardés (Simulation)");
  };

  return (
    <AdminLayout>
      <div className="animate-fade-in max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">
          Paramètres
        </h1>
        <p className="text-slate-500 mb-8">Configuration générale de la plateforme.</p>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Section: Général */}
          <section className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 p-8">
            <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
              <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">⚙️</span>
              Configuration Générale
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-600">Nom de la plateforme</label>
                <input
                  type="text"
                  name="siteName"
                  value={generalConfig.siteName}
                  onChange={handleGeneralChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-600">Email de support</label>
                <input
                  type="email"
                  name="supportEmail"
                  value={generalConfig.supportEmail}
                  onChange={handleGeneralChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col md:flex-row gap-8">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="maintenanceMode"
                    checked={generalConfig.maintenanceMode}
                    onChange={handleGeneralChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">Mode Maintenance</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="allowRegistrations"
                    checked={generalConfig.allowRegistrations}
                    onChange={handleGeneralChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">Autoriser les inscriptions</span>
              </label>
            </div>
          </section>

          {/* Section: Notifications */}
          <section className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 p-8">
            <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
              <span className="p-2 bg-purple-100 text-purple-600 rounded-lg">🔔</span>
              Notifications
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="font-semibold text-slate-700">Alertes Email</h3>
                  <p className="text-xs text-slate-500">Recevoir des résumés par email</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotificationChange('emailAlerts')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.emailAlerts ? 'bg-purple-600' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.emailAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="font-semibold text-slate-700">Nouvelles Commandes</h3>
                  <p className="text-xs text-slate-500">Notification à chaque paiement</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotificationChange('newOrderAlert')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.newOrderAlert ? 'bg-purple-600' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.newOrderAlert ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </section>

          {/* Section: Sécurité */}
          <section className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 p-8">
            <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
              <span className="p-2 bg-red-100 text-red-600 rounded-lg">🔒</span>
              Sécurité
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-600">Nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-600">Confirmer</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-700"
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-yellow-700 text-sm flex gap-3">
              <span className="text-xl">⚠️</span>
              <p>Changer votre mot de passe vous déconnectera de tous les autres appareils.</p>
            </div>
          </section>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Sauvegarder les modifications
            </button>
          </div>

        </form>
      </div>
    </AdminLayout>
  );
};

export default Settings;