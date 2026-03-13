const strapi = require('@strapi/strapi');

async function run() {
  const instance = await strapi().start();
  try {
    const titles = [
      "Introduction à React.js",
      "Maîtriser Node.js et Express",
      "Design UI/UX avec Figma",
      "Intelligence Artificielle et Python",
      "Gestion de Projet Agile",
      "Introduction à la Cybersécurité",
      "Mobile App avec React Native",
      "Blockchain et Web3",
      "Introduction au Design UI/UX",
      "Maîtriser Node.js"
    ];

    const courses = await instance.documents('api::course.course').findMany({
      filters: { title: { $in: titles } }
    });
    
    console.log('Found courses to delete:', courses.length);

    for (const course of courses) {
      await instance.documents('api::course.course').delete({
        documentId: course.documentId,
      });
      console.log('Deleted course:', course.title);
    }
    
    console.log('Done.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await instance.destroy();
  }
}

run().catch(console.error);
