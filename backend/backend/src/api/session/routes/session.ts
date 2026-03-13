export default {
  type: 'content-api',
  routes: [
    {
      method: "POST",
      path: "/sessions/create-live",
      handler: "session.createLive",
      config: { policies: [] },
    },
    {
      method: "GET",
      path: "/sessions/mine",
      handler: "session.mySessions",
      config: { policies: [] },
    },
    {
      method: "POST",
      path: "/sessions/:id/register",
      handler: "session.register",
      config: { policies: [] },
    },
    {
      method: "POST",
      path: "/sessions/:id/attendance",
      handler: "session.attendance",
      config: { policies: [] },
    },
    // CORE ROUTES (Must stay to avoid 404 on standard actions)
    { method: 'GET', path: '/sessions', handler: 'session.find' },
    { method: 'POST', path: '/sessions', handler: 'session.create' },
    { method: 'GET', path: '/sessions/:id', handler: 'session.findOne' },
    { method: 'PUT', path: '/sessions/:id', handler: 'session.update' },
    { method: 'DELETE', path: '/sessions/:id', handler: 'session.delete' },
  ],
};
