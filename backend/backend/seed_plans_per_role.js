const { strapi } = require("@strapi/strapi");

async function seed() {
  const app = await strapi().load();

  try {
    console.log("--- Seeding Subscription Plans Per Role ---");

    const plans = [
      // STUDENT
      {
        name: "Étudiant Basique",
        description: "Accès standard aux espaces d'étude.",
        price: 15,
        duration_days: 30,
        type: "basic",
        max_credits: 5,
        target_role: "student",
        publishedAt: new Date(),
        features: [
          "WiFi Illimité",
          "Accès zones calmes",
          "5 crédits impression",
        ],
      },
      {
        name: "Étudiant Premium",
        description: "Accès étendu et prioritaire.",
        price: 30,
        duration_days: 30,
        type: "premium",
        max_credits: 15,
        target_role: "student",
        publishedAt: new Date(),
        features: ["Accès 24/7", "Salle de réunion", "15 crédits impression"],
      },
      {
        name: "Étudiant Pro",
        description: "L'expérience étudiante ultime.",
        price: 45,
        duration_days: 30,
        type: "enterprise",
        max_credits: 9999,
        target_role: "student",
        publishedAt: new Date(),
        features: ["Accès 24/7", "Salles illimitées", "Impressions illimitées"],
      },
      // TRAINER
      {
        name: "Formateur Solo",
        description: "Accès flexible aux salles.",
        price: 60,
        duration_days: 30,
        type: "basic",
        max_credits: 10,
        target_role: "trainer",
        publishedAt: new Date(),
        features: ["Salles de cours", "Projecteur inclus"],
      },
      {
        name: "Formateur Expert",
        description: "Outils avancés et visibilité.",
        price: 150,
        duration_days: 30,
        type: "premium",
        max_credits: 50,
        target_role: "trainer",
        publishedAt: new Date(),
        features: [
          "Salles premium",
          "Vidéoconférence Pro",
          "Support prioritaire",
        ],
      },
      {
        name: "Formateur Institution",
        description: "Pour les centres de formation.",
        price: 250,
        duration_days: 30,
        type: "enterprise",
        max_credits: 9999,
        target_role: "trainer",
        publishedAt: new Date(),
        features: [
          "Salles en accès illimité",
          "Support dédié",
          "Espaces de stockage",
        ],
      },
      // PROFESSIONAL
      {
        name: "Pro Essentiel",
        description: "Pour les freelances et nomades.",
        price: 80,
        duration_days: 30,
        type: "basic",
        max_credits: 10,
        target_role: "professional",
        publishedAt: new Date(),
        features: ["Coworking open-space", "Café illimité", "10h réunion"],
      },
      {
        name: "Pro Premium",
        description: "Solution bureau dédié.",
        price: 180,
        duration_days: 30,
        type: "premium",
        max_credits: 50,
        target_role: "professional",
        publishedAt: new Date(),
        features: ["Bureau dédié", "Domiciliation entreprise", "50h réunion"],
      },
      {
        name: "Pro Entreprise",
        description: "Solution complète.",
        price: 250,
        duration_days: 30,
        type: "enterprise",
        max_credits: 9999,
        target_role: "professional",
        publishedAt: new Date(),
        features: [
          "Bureau dédié illimité",
          "Domiciliation entreprise",
          "Salles illimitées",
        ],
      },
      // ASSOCIATION
      {
        name: "Association Communauté",
        description: "Idéal pour les réunions régulières.",
        price: 100,
        duration_days: 30,
        type: "basic",
        max_credits: 20,
        target_role: "association",
        publishedAt: new Date(),
        features: ["Bureau partagé", "2 événements/mois"],
      },
      {
        name: "Association Expansion",
        description: "Pour les associations actives.",
        price: 250,
        duration_days: 30,
        type: "premium",
        max_credits: 100,
        target_role: "association",
        publishedAt: new Date(),
        features: ["Privatisation week-end", "5 événements/mois"],
      },
      {
        name: "Association Élite",
        description: "Accès total pour les grandes ONG.",
        price: 400,
        duration_days: 30,
        type: "enterprise",
        max_credits: 9999,
        target_role: "association",
        publishedAt: new Date(),
        features: ["Bureau privatif", "Événements illimités", "Support dédié"],
      },
    ];

    // Clean existing plans (optional - but maybe safe to keep or clean up 'all' plans)
    // Here we will just create them. If they exist, skip.
    for (const plan of plans) {
      const existing = await app.entityService.findMany(
        "api::subscription-plan.subscription-plan",
        {
          filters: { name: plan.name },
        },
      );

      if (existing.length === 0) {
        await app.entityService.create(
          "api::subscription-plan.subscription-plan",
          { data: plan },
        );
        console.log(`Created plan: ${plan.name}`);
      } else {
        console.log(`Plan already exists: ${plan.name}, updating...`);
        await app.entityService.update(
          "api::subscription-plan.subscription-plan",
          existing[0].id,
          { data: plan },
        );
      }
    }

    console.log("--- Seeding Completed ---");
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    process.exit(0);
  }
}

seed();
