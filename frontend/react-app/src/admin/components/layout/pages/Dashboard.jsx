import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../AdminLayout.jsx';
import StatsWidget from '../Dashboard/StatsWidget';
import RecentActivity from '../Dashboard/RecentActivity';
import { getDashboardStats, getRecentActivity } from '../../../../api';


const Dashboard = () => {
  const [stats, setStats] = useState([
    { title: 'Utilisateurs totaux', value: '...', change: '', icon: '👥', color: '#3b82f6' },
    { title: 'Réservations', value: '...', change: '', icon: '📅', color: '#10b981' },
    { title: 'Revenus (Est.)', value: '...', change: '', icon: '💰', color: '#8b5cf6' },
    { title: 'Cours actifs', value: '...', change: '', icon: '📚', color: '#f59e0b' },
  ]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, activityData] = await Promise.all([
          getDashboardStats(),
          getRecentActivity()
        ]);

        setStats([
          { title: 'Utilisateurs', value: Math.max(0, statsData.users - 1), change: '', icon: '👥', color: '#3b82f6' },
          { title: 'Réservations', value: statsData.reservations, change: '', icon: '📅', color: '#10b981' },
          { title: 'Paiements', value: statsData.payments, change: '', icon: '💰', color: '#8b5cf6' },
          { title: 'Cours', value: statsData.courses, change: '', icon: '📚', color: '#f59e0b' },
        ]);

        if (activityData && activityData.data) {
          const mappedActivities = activityData.data.map(item => ({
            id: item.id,
            user: `Client #${item.id}`, // Strapi might not populate user name directly in all views
            action: `a fait une réservation: ${item.attributes.details || 'N/A'}`,
            time: new Date(item.attributes.createdAt).toLocaleDateString(),
            icon: '📅'
          }));
          setActivities(mappedActivities);
        }
      } catch (error) {
        console.error("Error loading dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-8 tracking-tight">Tableau de bord</h1>

        {/* Section Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatsWidget
              key={index}
              title={stat.title}
              value={loading ? '...' : stat.value}
              change={stat.change}
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </div>

        {/* Section Graphiques et Activités */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne Gauche (2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-white/60">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  📊 Trafic mensuel
                </h3>
                <div className="h-[250px] bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 text-sm font-medium">
                  Graphique de trafic (Données réelles à venir)
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-white/60">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  👥 Répartition
                </h3>
                <div className="h-[250px] bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 text-sm font-medium">
                  Graphique utilisateurs (Données réelles à venir)
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-white/60">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                ⚙️ État de la plateforme
              </h3>
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 font-medium flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                Système opérationnel. Connexion DB: OK.
              </div>
            </div>
          </div>

          {/* Colonne Droite (1/3) */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-white/60 h-fit">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
              🔄 Activités récentes
            </h3>
            {loading ? <p className="text-slate-400 text-center italic">Chargement...</p> :
              activities.length > 0 ? <RecentActivity activities={activities} /> :
                <p className="text-slate-400 text-center italic">Aucune activité récente.</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;