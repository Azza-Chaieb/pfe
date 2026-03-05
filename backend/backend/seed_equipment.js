const API_URL = "http://localhost:1337/api";

async function seedEquipment() {
  try {
    console.log("--- Seeding Equipment ---");

    const equipments = [
      {
        name: 'Écran 4K 27"',
        description: "Moniteur haute résolution pour graphisme et code.",
        price: 15,
        price_type: "daily",
        total_quantity: 5,
        available_quantity: 5,
        status: "disponible",
      },
      {
        name: "Cafetière Nespresso",
        description: "Accès illimité aux capsules de café premium.",
        price: 5,
        price_type: "one-time",
        total_quantity: 10,
        available_quantity: 10,
        status: "disponible",
      },
      {
        name: "Projecteur HD",
        description: "Projecteur pour présentations et réunions.",
        price: 30,
        price_type: "hourly",
        total_quantity: 2,
        available_quantity: 2,
        status: "disponible",
      },
      {
        name: "Whiteboard Mobile",
        description: "Tableau blanc avec marqueurs inclus.",
        price: 0,
        price_type: "one-time",
        total_quantity: 4,
        available_quantity: 4,
        status: "disponible",
      },
    ];

    const createdIds = [];

    for (const eq of equipments) {
      // Check if exists
      const checkRes = await fetch(
        `${API_URL}/equipments?filters[name]=${encodeURIComponent(eq.name)}`,
      );
      const checkData = await checkRes.json();

      if (checkData.data && checkData.data.length > 0) {
        console.log(`Equipment already exists: ${eq.name}`);
        createdIds.push(checkData.data[0].id);
        continue;
      }

      // Create
      const res = await fetch(`${API_URL}/equipments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { ...eq, publishedAt: new Date() } }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`Successfully created equipment: ${eq.name}`);
        createdIds.push(data.data.id);
      } else {
        console.error(`Failed to create equipment ${eq.name}`);
      }
    }

    console.log("--- Linking Equipment to Spaces ---");
    // Fetch all spaces
    const spacesRes = await fetch(`${API_URL}/spaces`);
    const spacesData = await spacesRes.json();

    if (spacesData.data) {
      for (const space of spacesData.data) {
        const spaceId = space.id;
        const documentId = space.documentId; // Strapi v5 uses documentId for updates often
        const targetId = documentId || spaceId;

        console.log(
          `Updating Space: ${space.attributes?.name || space.name} (ID: ${targetId})`,
        );

        await fetch(`${API_URL}/spaces/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              equipments: createdIds,
            },
          }),
        });
      }
    }

    console.log("--- Seeding Completed ---");
  } catch (error) {
    console.error("Seeding failed:", error.message);
  }
}

seedEquipment();
