const strapi = require('@strapi/strapi');

strapi().start().then(async instance => {
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

    // Using Document Service to find all (including drafts if any)
    const courses = await instance.documents('api::course.course').findMany({
      filters: { title: { $in: titles } },
      status: 'draft', // we should query both, but usually findMany without status gets published
    });

    const coursesPub = await instance.documents('api::course.course').findMany({
      filters: { title: { $in: titles } },
      status: 'published',
    });

    const allCourses = [...courses, ...coursesPub];
    // Deduplicate by documentId
    const uniqueCourses = [];
    const ids = new Set();
    for(const c of allCourses) {
        if(!ids.has(c.documentId)) {
            uniqueCourses.push(c);
            ids.add(c.documentId);
        }
    }

    console.log('Found static courses to delete:', uniqueCourses.length);

    for (const course of uniqueCourses) {
      await instance.documents('api::course.course').delete({
        documentId: course.documentId,
      });
      console.log('Deleted course:', course.title, 'Document ID:', course.documentId);
    }
    
    // Also delete any enrollments related to them just in case
    console.log('Done deleting static courses.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await instance.destroy();
    process.exit(0);
  }
}).catch(err => {
  console.error(err);
  process.exit(1);
});
