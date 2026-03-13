export default {
  routes: [
    {
      method: 'GET',
      path: '/course/cleanup',
      handler: 'cleanup.cleanup',
      config: {
        auth: false, // make it accessible without login
      },
    },
  ],
};
