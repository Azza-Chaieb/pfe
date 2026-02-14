import path from 'path';

export default [
  'global::debug-errors',
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      formidable: {
        uploadDir: path.join(process.cwd(), '.tmp', 'uploads'),
        keepExtensions: true,
      },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
