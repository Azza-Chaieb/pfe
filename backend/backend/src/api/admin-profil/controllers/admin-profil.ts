/**
 * admin-profil controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::admin-profil.admin-profil', ({ strapi }) => ({
  async dashboardStats(ctx) {
    try {
      // 1. Users Count
      const usersCount = await strapi.db.query('plugin::users-permissions.user').count();

      // 2. Tests Count (assuming api::test.test exists)
      let testsCount = 0;
      try {
        testsCount = await strapi.db.query('api::test.test').count();
      } catch (e) {
        // Model might not exist yet, treat as 0
      }

      // 3. Courses Count (Placeholder for real future model)
      // For now, we only return what we have in DB. 
      // If we don't have a model, we return 0. NO MOCK DATA.
      
      ctx.body = {
        users: {
            value: usersCount,
            label: 'Total Students',
            icon: 'users',
            trend: null, // No historical data implemented yet
            isUp: null
        },
        tests: {
             value: testsCount,
             label: 'Total Tests',
             icon: 'file-text',
             trend: null,
             isUp: null
        },
        // Removed Revenue and Active Sessions as they are not backed by DB yet.
        // Returning them as null or 0 to be honest about system state.
        revenue: {
            value: 0, 
            label: 'Total Revenue',
            icon: 'dollar-sign',
            trend: null,
            isUp: null,
            format: 'currency'
        },
        active_sessions: {
            value: 0,
            label: 'Active Sessions',
            icon: 'activity',
            trend: null,
            isUp: null
        }
      };
    } catch (err) {
      ctx.body = err;
    }
  },
}));
