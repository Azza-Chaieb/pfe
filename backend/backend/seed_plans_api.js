const API_URL = "http://localhost:1337/api";

async function seed() {
  try {
    console.log("--- Seeding Subscription Plans via API ---");

    const plans = [
      {
        name: "Basique",
        description: "Idéal pour les freelances et indépendants.",
        price: 49,
        duration_days: 30,
        type: "basic",
        max_credits: 5,
        target_role: "all",
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
      },
      {
        name: "Entreprise",
        description: "Pour les équipes et entreprises exigeantes.",
        price: 199,
        duration_days: 30,
        type: "enterprise",
        max_credits: 9999,
        target_role: "all",
      },
    ];

    for (const plan of plans) {
      // Check if plan already exists
      const checkRes = await fetch(
        `${API_URL}/subscription-plans?filters[name]=${plan.name}`,
      );
      const checkData = await checkRes.json();

      if (checkData.data && checkData.data.length > 0) {
        console.log(`Plan already exists: ${plan.name}`);
        continue;
      }

      // Create and publish
      const res = await fetch(`${API_URL}/subscription-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { ...plan, publishedAt: new Date() } }),
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
