import path from "path";

export default [
  "global::debug-errors",
  "strapi::logger",
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'", "http:", "https:"],
          "img-src": ["'self'", "data:", "blob:", "http:", "https:"],
          "media-src": ["'self'", "data:", "blob:", "http:", "https:"],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: "strapi::cors",
    config: {
      origin: [
        "http://192.168.0.5:3000",
        "http://192.168.0.5:1337",
        "http://localhost:3000",
        "http://localhost:1337",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:1337",
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
      headers: [
        "Content-Type",
        "Authorization",
        "Origin",
        "Accept",
        "x-captcha-token",
      ],
      credentials: true,
      keepHeaderOnError: true,
    },
  },
  "strapi::poweredBy",
  "strapi::query",
  {
    name: "strapi::body",
    config: {
      formidable: {
        uploadDir: path.join(process.cwd(), ".tmp", "uploads"),
        keepExtensions: true,
      },
    },
  },
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
