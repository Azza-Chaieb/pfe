const axios = require("axios");
const fs = require("fs");

const API_URL = "http://localhost:1337/api";

const services = [
  {
    name: "Impression",
    description: "Impression de documents (Noir & Blanc ou Couleur)",
    price: 0.2,
    price_type: "one-time",
    configuration: {
      fields: [
        {
          name: "file",
          type: "file",
          label: "Uploader le document",
          required: true,
        },
        {
          name: "pages",
          type: "number",
          label: "Nombre de copies",
          min: 1,
          default: 1,
          required: true,
        },
        {
          name: "color",
          type: "select",
          label: "Couleur",
          options: ["Noir & Blanc", "Couleur"],
          default: "Noir & Blanc",
        },
      ],
    },
  },
  {
    name: "Caféterie Premium",
    description: "Accès illimité aux boissons chaudes et snacks",
    price: 5,
    price_type: "daily",
    configuration: {
      fields: [
        {
          name: "preferences",
          type: "text",
          label: "Préférences alimentaires / allergies",
          placeholder: "Ex: Sans gluten...",
        },
      ],
    },
  },
  {
    name: "Vidéoprojecteur HD",
    description: "Location d'un vidéoprojecteur haute définition",
    price: 30,
    price_type: "daily",
    configuration: {
      fields: [
        {
          name: "connector",
          type: "select",
          label: "Type de connecteur",
          options: ["HDMI", "VGA", "USB-C"],
          default: "HDMI",
        },
      ],
    },
  },
  {
    name: "Catering / Déjeuner",
    description: "Repas complet servi dans l'espace",
    price: 15,
    price_type: "one-time",
    configuration: {
      fields: [
        {
          name: "menu",
          type: "select",
          label: "Choix du menu",
          options: ["Standard", "Végétarien", "Vegan"],
          default: "Standard",
        },
        {
          name: "time",
          type: "text",
          label: "Heure souhaitée",
          placeholder: "12:30",
        },
      ],
    },
  },
];

async function seedViaAPI() {
  console.log("--- Seeding Services via API ---");

  try {
    // 1. Get existing services to delete
    const res = await axios.get(`${API_URL}/services`);
    const existingServices = res.data.data;

    for (const s of services) {
      const found = existingServices.find(
        (es) => (es.attributes?.name || es.name) === s.name,
      );
      if (found) {
        console.log(
          `[CLEANUP] Deleting existing service: ${s.name} (ID: ${found.id})`,
        );
        await axios.delete(`${API_URL}/services/${found.id}`);
      }
    }

    // 2. Get space IDs to link
    const spacesRes = await axios.get(`${API_URL}/spaces`);
    const spaceIds = spacesRes.data.data.map((sp) => sp.id);

    // 3. Create new services
    for (const s of services) {
      console.log(`[SEEDING] Creating service: ${s.name}`);
      await axios.post(`${API_URL}/services`, {
        data: {
          ...s,
          spaces: spaceIds,
          publishedAt: new Date(),
        },
      });
    }

    fs.writeFileSync(
      "seed_success.txt",
      "Seeding completed at " + new Date().toISOString(),
    );
    console.log("--- Seeding Completed Successfully ---");
  } catch (error) {
    const errorMsg = error.response
      ? JSON.stringify(error.response.data)
      : error.message;
    fs.writeFileSync("seed_error.txt", errorMsg);
    console.error("Seeding failed:", errorMsg);
  }
}

seedViaAPI();
