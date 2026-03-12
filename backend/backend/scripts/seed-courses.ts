export default async ({ strapi }) => {
  console.log("--- DÉBUT DU SEEDING DES COURS ---");

  const coursesToSeed = [
    {
      course_id: "react-101",
      title: "Introduction à React.js",
      category: "Développement Web",
      description: "Apprenez les bases de React, les hooks et le virtual DOM.",
    },
    {
      course_id: "node-mastery",
      title: "Maîtriser Node.js et Express",
      category: "Backend",
      description: "Développez des APIs robustes et scalables avec Node.js.",
    },
    {
      course_id: "figma-ux",
      title: "Design UI/UX avec Figma",
      category: "Design",
      description:
        "Créez des interfaces magnifiques et centrées sur l'utilisateur.",
    },
    {
      course_id: "ai-python",
      title: "Intelligence Artificielle et Python",
      category: "Data Science",
      description: "Plongez dans le monde du Machine Learning avec Python.",
    },
    {
      course_id: "agile-mgmt",
      title: "Gestion de Projet Agile",
      category: "Agile",
      description:
        "Apprenez Scrum, Kanban et comment gérer une équipe efficacement.",
    },
    {
      course_id: "cyber-intro",
      title: "Introduction à la Cybersécurité",
      category: "Sécurité",
      description:
        "Protégez vos applications et réseaux contre les cyber-attaques modernes.",
    },
    {
      course_id: "rn-mobile",
      title: "Mobile App avec React Native",
      category: "Développement Mobile",
      description:
        "Créez des applications iOS et Android performantes avec React Native.",
    },
    {
      course_id: "web3-blockchain",
      title: "Blockchain et Web3",
      category: "Nouvelles Technologies",
      description:
        "Découvrez les contrats intelligents et l'écosystème décentralisé.",
    },
  ];

  const trainerId = 33; // nawresbfraj@gmail.com

  for (const course of coursesToSeed) {
    const existing = await strapi.db.query("api::course.course").findOne({
      where: { title: course.title },
    });

    if (!existing) {
      console.log(`🔨 Création du cours: ${course.title}`);
      await strapi.db.query("api::course.course").create({
        data: {
          ...course,
          trainer: trainerId,
          publishedAt: new Date(),
        },
      });
      console.log(`✅ Succès: ${course.title}`);
    } else {
      console.log(`⏩ Déjà présent: ${course.title}`);
      // Mettre à jour le formateur au cas où
      await strapi.db.query("api::course.course").update({
        where: { id: existing.id },
        data: { trainer: trainerId },
      });
      console.log(`⬆️ Formateur mis à jour pour: ${course.title}`);
    }
  }

  console.log("--- SEEDING TERMINÉ ---");
};
