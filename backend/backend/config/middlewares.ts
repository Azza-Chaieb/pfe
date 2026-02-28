export default [
  "global::debug-errors",
  "global::google-redirect",
  "strapi::logger",
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": [
            "'self'",
            "https:",
            "*.google.com",
            "*.gstatic.com",
            "https://www.recaptcha.net",
          ],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "*.google.com",
            "*.gstatic.com",
            "https://www.recaptcha.net",
            "http:",
            "https:",
          ],
          "media-src": ["'self'", "data:", "blob:", "http:", "https:"],
          "script-src": [
            "'self'",
            "blob:",
            "https://www.google.com",
            "https://www.gstatic.com",
            "https://www.recaptcha.net",
          ],
          "frame-src": [
            "'self'",
            "https://www.google.com",
            "https://recaptcha.google.com",
            "*.gstatic.com",
            "https://www.recaptcha.net",
          ],
          "style-src": [
            "'self'",
            "'unsafe-inline'",
            "*.google.com",
            "*.gstatic.com",
            "https://www.recaptcha.net",
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: "strapi::session",
    config: {
      key: "strapi.sid",
      maxAge: 86400000,
      httpOnly: true,
      secure: false, // development
      sameSite: "lax",
    },
  },
  {
    name: "strapi::cors",
    config: {
      origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:1337",
        "http://127.0.0.1:1337",
        "http://192.168.100.97:3000", // IP réseau local
        "http://172.23.245.102:3000", // IP 4G
        ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
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
        keepExtensions: true,
      },
    },
  },
  "strapi::favicon",
  "strapi::public",
];
