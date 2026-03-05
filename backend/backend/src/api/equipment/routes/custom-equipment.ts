export default {
  routes: [
    {
      method: "GET",
      path: "/equipments/:id/availability",
      handler: "api::equipment.equipment.availability",
      config: {
        auth: false,
      },
    },
  ],
};
