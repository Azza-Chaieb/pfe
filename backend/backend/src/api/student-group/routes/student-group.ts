import { factories } from '@strapi/strapi';

const defaultRouter = factories.createCoreRouter('api::student-group.student-group');

const customRouter = (innerRouter, extraRoutes = []) => {
  return {
    get routes() {
      const coreRoutes = innerRouter.routes;
      return [...extraRoutes, ...coreRoutes];
    },
  };
};

const myExtraRoutes = [
  {
    method: 'POST',
    path: '/groups/:id/members',
    handler: 'api::student-group.student-group.addMembers',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'DELETE',
    path: '/groups/:id/members/:userId',
    handler: 'api::student-group.student-group.removeMember',
    config: {
      policies: [],
      middlewares: [],
    },
  },
];

export default customRouter(defaultRouter, myExtraRoutes);
