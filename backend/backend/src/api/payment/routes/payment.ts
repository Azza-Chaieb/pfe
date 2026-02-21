/**
 * payment router
 */

import { factories } from "@strapi/strapi";

const defaultRouter = factories.createCoreRouter("api::payment.payment");

export default {
  get routes() {
    return [
      ...(defaultRouter as any).routes,
      {
        method: "POST",
        path: "/payments/:id/confirm",
        handler: "api::payment.payment.confirm",
        config: {
          auth: false,
        },
      },
    ];
  },
};
