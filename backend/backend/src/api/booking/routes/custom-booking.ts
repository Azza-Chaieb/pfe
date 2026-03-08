export default {
  routes: [
    {
      method: "GET",
      path: "/bookings/:id/invoice",
      handler: "api::booking.booking.downloadInvoice",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
