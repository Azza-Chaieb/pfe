
export default {
  routes: [
    {
      method: 'GET',
      path: '/admin-profil/dashboard-stats',
      handler: 'admin-profil.dashboardStats',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
