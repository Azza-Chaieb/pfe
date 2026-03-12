const axios = require("axios");

const API_URL = "http://localhost:1337/api";
// We need a valid JWT or API Token.
// Since I don't have a fresh login token here, I will try to use the public permission
// if the user has enabled it, or I'll ask them to run it if I can't.
// However, I'll try to create them without token first,
// or I can try to find a trainer user id to associate them with.

async function seed() {
  const courses = [
    {
      title: "Introduction à React.js",
      category: "Développement Web",
      description: [
        {
          type: "paragraph",
          children: [
            {
              text: "Apprenez les bases de React, les hooks et le virtual DOM.",
            },
          ],
        },
      ],
    },
    {
      title: "Maîtriser Node.js et Express",
      category: "Backend",
      description: [
        {
          type: "paragraph",
          children: [
            { text: "Développez des APIs robustes et scalables avec Node.js." },
          ],
        },
      ],
    },
    {
      title: "Design UI/UX avec Figma",
      category: "Design",
      description: [
        {
          type: "paragraph",
          children: [
            {
              text: "Créez des interfaces magnifiques et centrées sur l'utilisateur.",
            },
          ],
        },
      ],
    },
    {
      title: "Intelligence Artificielle et Python",
      category: "Data Science",
      description: [
        {
          type: "paragraph",
          children: [
            { text: "Plongez dans le monde du Machine Learning avec Python." },
          ],
        },
      ],
    },
    {
      title: "Gestion de Projet Agile",
      category: "Management",
      description: [
        {
          type: "paragraph",
          children: [
            {
              text: "Apprenez Scrum, Kanban et comment gérer une équipe efficacement.",
            },
          ],
        },
      ],
    },
  ];

  console.log("Starting seeding...");

  for (const course of courses) {
    try {
      // Trying to post. If it fails due to 403, I will notify the user.
      const res = await axios.post(`${API_URL}/courses`, { data: course });
      console.log(`✅ Created: ${course.title}`);
    } catch (err) {
      console.error(
        `❌ Failed to create ${course.title}:`,
        err.response?.data?.error?.message || err.message,
      );
    }
  }
}

seed();
