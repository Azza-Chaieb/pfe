const API_URL = "http://localhost:1337/api";

async function seed() {
  try {
    console.log("--- Seeding Subscription Plans Per Role (Clean State) ---");

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
        name: "Étudiant Entreprise",
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

    // 1. Fetch all current plans
    const allRes = await fetch(
      `${API_URL}/subscription-plans?pagination[limit]=100`,
    );
    const allData = await allRes.json();

    // 2. Clean up (Optional but safer for this specific request to avoid duplicates or old versions)
    // We only delete plans that have a target_role in our target list or "all"
    const targetRoles = [
      "student",
      "trainer",
      "professional",
      "association",
      "all",
    ];
    for (const p of allData.data || []) {
      if (targetRoles.includes(p.target_role)) {
        console.log(`Deleting old plan: ${p.name} (${p.documentId})`);
        await fetch(`${API_URL}/subscription-plans/${p.documentId}`, {
          method: "DELETE",
        });
      }
    }

    // 3. Create new plans
    for (const plan of plans) {
      const res = await fetch(`${API_URL}/subscription-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { ...plan, publishedAt: new Date().toISOString() },
        }),
      });

      if (res.ok) {
        console.log(
          `Successfully created: ${plan.name} for ${plan.target_role}`,
        );
      } else {
        console.error(`Failed to create: ${plan.name}`, await res.text());
      }
    }

    console.log("--- Seeding Completed Successfully ---");
  } catch (error) {
    console.error("Seeding failed:", error.message);
  }
}

seed();
