const API_URL = "http://localhost:1337/api";

async function seed() {
  try {
    console.log("--- Seeding Subscription Plans Per Role via API ---");

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
        features: ["Bureau privatif", "Événements illimités", "Support dédié"],
      },
    ];

    for (const plan of plans) {
      // Check if plan already exists
      const checkRes = await fetch(
        `${API_URL}/subscription-plans?filters[name]=${plan.name}`,
      );
      const checkData = await checkRes.json();

      if (checkData.data && checkData.data.length > 0) {
        console.log(
          `Plan already exists: ${plan.name}, skipping update for now...`,
        );
        /*
        const existingId = checkData.data[0].documentId;
        const updateRes = await fetch(`${API_URL}/subscription-plans/${existingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: plan }),
        });
        if (updateRes.ok) console.log(`Updated plan: ${plan.name}`);
        */
        continue;
      }

      // Create and publish
      const res = await fetch(`${API_URL}/subscription-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { ...plan, publishedAt: new Date().toISOString() },
        }),
      });

      if (res.ok) {
        console.log(`Successfully created plan: ${plan.name}`);
      } else {
        const error = await res.json();
        console.error(
          `Failed to create plan ${plan.name}:`,
          JSON.stringify(error),
        );
      }
    }

    console.log("--- Seeding Completed ---");
  } catch (error) {
    console.error("Seeding failed:", error.message);
  }
}

seed();
