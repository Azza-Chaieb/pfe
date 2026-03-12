
const strapi = require('@strapi/strapi');

async function listCourses() {
  const app = await strapi().load();
  const courses = await app.documents('api::course.course').findMany({
    fields: ['id', 'documentId', 'title']
  });
  console.log(JSON.stringify(courses, null, 2));
  await app.destroy();
}

listCourses();
