export default {
  routes: [
    {
      method: "POST",
      path: "/equipment-locks/lock",
      handler: "api::equipment-lock.equipment-lock.lock",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/equipment-locks/unlock",
      handler: "api::equipment-lock.equipment-lock.unlock",
      config: {
        auth: false,
      },
    },
  ],
};
