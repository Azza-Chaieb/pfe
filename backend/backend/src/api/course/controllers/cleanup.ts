export default {
  async cleanup(ctx) {
    console.log("--- STARTING CLEANUP VIA CONTROLLER ---");
    try {
      const titles = [
        "Introduction à React.js",
        "Node.js Avancé & Microservices",
        "Design UI/UX Moderne",
        "Développement Mobile Flutter",
        "Intelligence Artificielle & Python",
        "Cybersécurité : Les Fondamentaux",
        "Cloud Computing avec AWS",
        "Marketing Digital & SEO",
        "Data Science avec R",
        "Management de Projet Agile",
        "DevOps & Docker/Kubernetes",
        "Blockchain & Smart Contracts",
        "Maîtriser Node.js et Express",
        "Design UI/UX avec Figma",
        "Introduction à la Cybersécurité",
        "Mobile App avec React Native",
        "Blockchain et Web3",
        "Hacking Éthique",
        "Web design avec Figma",
        "Introduction au Design UI/UX",
        "Maîtriser Node.js"
      ];

      // Use the Document Service to fetch all courses matching the titles (including drafts)
      const courses = await strapi.documents("api::course.course").findMany({
        filters: { title: { $in: titles } },
        status: 'draft' // Check drafts first
      });

      const publishedCourses = await strapi.documents("api::course.course").findMany({
        filters: { title: { $in: titles } },
        status: 'published' // Check published
      });

      const allCourses = [...courses, ...publishedCourses];
      const uniqueCoursesMap = new Map();
      allCourses.forEach(c => uniqueCoursesMap.set(c.documentId, c));
      const uniqueCourses = Array.from(uniqueCoursesMap.values());

      const results = [];

      for (const course of uniqueCourses) {
        await strapi.documents("api::course.course").delete({
          documentId: course.documentId
        });
        results.push(`🗑️ Supprimé: ${course.title} (Doc ID: ${course.documentId})`);
      }

      ctx.body = {
        success: true,
        message: `Cleanup completed: ${uniqueCourses.length} courses deleted.`,
        results,
      };
    } catch (error) {
      console.error("❌ Error during cleanup:", error);
      ctx.body = {
        success: false,
        error: error.message,
      };
    }
  },
};
