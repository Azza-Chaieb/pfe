const API_URL = "http://localhost:1337/api";

async function seed() {
  try {
    console.log("--- Starting Seeding (Native Fetch) ---");

    const post = async (slug, data) => {
      const res = await fetch(`${API_URL}/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(JSON.stringify(err));
      }
      return res.json();
    };

    const get = async (slug) => {
      const res = await fetch(`${API_URL}/${slug}`);
      if (!res.ok) return { data: [] };
      return res.json();
    };

    // 1. Coworking Space
    let coworkingSpaceId;
    const csRes = await get("coworking-spaces");
    if (csRes.data && csRes.data.length > 0) {
      coworkingSpaceId = csRes.data[0].id;
      console.log("Using existing Coworking Space:", csRes.data[0].name);
    } else {
      const csNew = await post("coworking-spaces", {
        name: "SunSpace El Ghazela",
        type: "Innovation Hub",
        description: "Le premier espace de coworking premium à El Ghazela.",
      });
      coworkingSpaceId = csNew.data.id;
      console.log("Created Coworking Space: SunSpace El Ghazela");
    }

    // 2. Equipments
    const equipments = [
      {
        name: 'Écran 4K 27"',
        description: "Moniteur Dell UltraSharp pour graphistes.",
        price: 5,
        price_type: "daily",
      },
      {
        name: "Clavier/Souris Logi",
        description: "Kit sans fil ergonomique.",
        price: 2,
        price_type: "daily",
      },
      {
        name: "Casque Réduction Bruit",
        description: "Bose QC35 pour une concentration totale.",
        price: 10,
        price_type: "daily",
      },
    ];
    const eqIds = [];
    for (const eq of equipments) {
      try {
        const res = await post("equipments", eq);
        eqIds.push(res.data.id);
        console.log("Added Equipment:", eq.name);
      } catch (e) {
        console.log("Equipment might already exist:", eq.name);
      }
    }

    // 3. Services
    const services = [
      {
        name: "Café Illimité",
        description: "Café grain premium et thé à volonté.",
        price: 15,
        price_type: "daily",
      },
      {
        name: "Impression Laser",
        description: "Accès à l'imprimante haut volume.",
        price: 0.2,
        price_type: "one-time",
      },
      {
        name: "Secrétariat",
        description: "Gestion de vos appels et courriers.",
        price: 50,
        price_type: "daily",
      },
    ];
    const svIds = [];
    for (const sv of services) {
      try {
        const res = await post("services", sv);
        svIds.push(res.data.id);
        console.log("Added Service:", sv.name);
      } catch (e) {
        console.log("Service might already exist:", sv.name);
      }
    }

    // 4. Spaces
    const spaces = [
      {
        name: "Desk Zen 01",
        type: "hot-desk",
        capacity: 1,
        floor: 1,
        pricing_hourly: 5,
        pricing_daily: 25,
        mesh_name: "Cube_01",
        coworking_space: coworkingSpaceId,
        equipments: eqIds.length > 0 ? [eqIds[0]] : [],
        services: svIds.length > 0 ? [svIds[0]] : [],
      },
      {
        name: "Salle de Réunion Atlas",
        type: "meeting-room",
        capacity: 8,
        floor: 1,
        pricing_hourly: 40,
        pricing_daily: 200,
        mesh_name: "Room_A",
        coworking_space: coworkingSpaceId,
        equipments: eqIds,
        services: svIds,
      },
      {
        name: "OpenSpace Nord",
        type: "fixed-desk",
        capacity: 1,
        floor: 2,
        pricing_hourly: 7,
        pricing_daily: 35,
        mesh_name: "Desk_N1",
        coworking_space: coworkingSpaceId,
        equipments: eqIds.length > 1 ? [eqIds[1]] : [],
      },
    ];

    for (const sp of spaces) {
      await post("spaces", sp);
      console.log("Added Space:", sp.name);
    }

    console.log("--- Seeding Completed Successfully ---");
  } catch (error) {
    console.error("Seeding failed:", error.message);
  }
}

seed();
