const strapi = require('@strapi/strapi');

async function test() {
  const app = await strapi().load();
  console.log("Strapi loaded.");

  const trainerId = 1; // Adjust if you know a real one, but we are testing syntax

  const queries = [
    { name: "Simple filter", url: `/courses?filters[trainer]=${trainerId}` },
    { name: "ID EQ filter", url: `/courses?filters[trainer][id][$eq]=${trainerId}` },
    { name: "Populate wildcard", url: `/courses?populate=*` },
    { name: "Populate nested", url: `/courses?populate[category_rel]=*` },
    { name: "Multiple populate", url: `/courses?populate[category_rel]=*&populate[cover]=*` },
    { name: "Enrollment filter", url: `/enrollments?filters[course][trainer]=${trainerId}` },
    { name: "Enrollment nested filter", url: `/enrollments?filters[course][trainer][id][$eq]=${trainerId}` }
  ];

  for (const q of queries) {
    try {
      console.log(`Testing query: ${q.name} (${q.url})`);
      // We simulate a GET request using the document service or router if possible, 
      // but simpler to just test the Document Service directly for common pitfalls.
      
      const [apiName, queryPart] = q.url.split('?');
      const contentType = `api::${apiName.slice(1, -1)}.${apiName.slice(1, -1)}`;
      
      console.log(`Success (syntax check only via internal fetch simulation)`);
    } catch (err) {
      console.error(`Failed ${q.name}:`, err.message);
    }
  }
  process.exit(0);
}

// test();
// Actually let's just use Strapi's internal fetch or just test document service directly which is more likely to give we the error if syntax is wrong in V5.

strapi().start().then(async (instance) => {
    const courses = await instance.documents('api::course.course').findMany({
        filters: { trainer: 1 },
        populate: ['category_rel', 'cover', 'documents']
    });
    console.log("Found courses count:", courses.length);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
