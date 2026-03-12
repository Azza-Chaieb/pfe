export default {
  routes: [
    {
      method: "GET",
      path: "/courses/seed",
      handler: "seed.seed",
      config: {
        auth: false, // Allow public access just for this seed
      },
    },
  ],
};
