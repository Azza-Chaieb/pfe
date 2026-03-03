const { strapi } = require("@strapi/strapi");

async function seed() {
  const app = await strapi().load();

  try {
    console.log("--- Seeding Subscription Plans (V5) ---");

    const plans = [
      {
        name: "Basique",
        description: "Idéal pour les freelances et indépendants.",
        price: 49,
        duration_days: 30,
        type: "basic",
        max_credits: 5,
        target_role: "all",
        publishedAt: new Date(),
        features: [
          "5 réservations/mois",
          "10h de salle de réunion",
          "Accès open-space en semaine",
        ],
      },
      {
        name: "Premium",
        description:
          "Le meilleur rapport qualité/prix pour les professionnels.",
        price: 99,
        duration_days: 30,
        type: "premium",
        max_credits: 20,
        target_role: "all",
        publishedAt: new Date(),
        features: [
          "20 réservations/mois",
          "50h de salle de réunion",
          "Accès open-space 7j/7",
        ],
      },
      {
        name: "Entreprise",
        description: "Pour les équipes et entreprises exigeantes.",
        price: 199,
        duration_days: 30,
        type: "enterprise",
        max_credits: 9999,
        target_role: "all",
        publishedAt: new Date(),
        features: [
          "Réservations illimitées",
          "Accès 24h/7j à tous les espaces",
          "Bureau privatif dédié",
        ],
      },
    ];

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
        console.log(`Plan already exists: ${plan.name}`);
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
