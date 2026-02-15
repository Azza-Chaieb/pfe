const axios = require("axios");

const API_URL = "http://localhost:1337/api";

async function seed() {
  try {
    console.log("--- Starting Seeding ---");

    // 1. Create Coworking Space if none exists
    let coworkingSpaceId;
    const csRes = await axios.get(`${API_URL}/coworking-spaces`);
    if (csRes.data.data.length > 0) {
      coworkingSpaceId = csRes.data.data[0].id;
      console.log("Using existing Coworking Space:", csRes.data.data[0].name);
    } else {
      const csNew = await axios.post(`${API_URL}/coworking-spaces`, {
        data: {
          name: "SunSpace El Ghazela",
          type: "Innovation Hub",
          description: "Le premier espace de coworking premium à El Ghazela.",
        },
      });
      coworkingSpaceId = csNew.data.data.id;
      console.log("Created Coworking Space: SunSpace El Ghazela");
    }

    // 2. Create Equipments
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
        const res = await axios.post(`${API_URL}/equipments`, { data: eq });
        eqIds.push(res.data.data.id);
        console.log("Added Equipment:", eq.name);
      } catch (e) {
        console.log("Equipment already exists or error:", eq.name);
      }
    }

    // 3. Create Services
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
        const res = await axios.post(`${API_URL}/services`, { data: sv });
        svIds.push(res.data.data.id);
        console.log("Added Service:", sv.name);
      } catch (e) {
        console.log("Service already exists or error:", sv.name);
      }
    }

    // 4. Create Spaces
    const spaces = [
      {
        name: "Desk Zen 01",
        type: "hot-desk",
        capacity: 1,
        floor: 1,
        pricing_hourly: 5,
        pricing_daily: 25,
        mesh_name: "Cube_01", // Example mesh name for 3D
        coworking_space: coworkingSpaceId,
        equipments: [eqIds[0]],
        services: [svIds[0]],
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
        equipments: [eqIds[1]],
      },
    ];

    for (const sp of spaces) {
      await axios.post(`${API_URL}/spaces`, { data: sp });
      console.log("Added Space:", sp.name);
    }

    console.log("--- Seeding Completed Successfully ---");
  } catch (error) {
    console.error(
      "Seeding failed:",
      error.response ? error.response.data : error.message,
    );
  }
}

seed();
