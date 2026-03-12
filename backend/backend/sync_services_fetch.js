const fs = require("fs");

async function run() {
  const configurations = {
    Impression: {
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
    "Café et Boissons à volonté": {
      fields: [
        {
          name: "preferences",
          type: "text",
          label: "Préférences alimentaires / allergies",
          placeholder: "Ex: Sans gluten...",
        },
      ],
    },
    "Catering / Déjeuner": {
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
    "Support Technique IT": {
      fields: [
        {
          name: "description",
          type: "text",
          label: "Description du problème",
          placeholder: "Détaillez votre besoin...",
        },
      ],
    },
    "Caféteria Premium": {
      fields: [
        {
          name: "preferences",
          type: "text",
          label: "Préférences alimentaires / allergies",
          placeholder: "Ex: Sans gluten...",
        },
      ],
    },
  };

  console.log("Starting update...");

  try {
    // Fetch existing services
    const res = await fetch("http://localhost:1337/api/services");
    const json = await res.json();
    const existing = json.data;

    for (const service of existing) {
      const name = service.name || service.attributes?.name;
      const config = configurations[name];
      if (config) {
        console.log(`Updating ${name} (ID: ${service.id})...`);
        const updateRes = await fetch(
          `http://localhost:1337/api/services/${service.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: { configuration: config } }),
          },
        );
        const updateJson = await updateRes.json();
        console.log(`Response for ${name}:`, updateRes.status);
      }
    }
    fs.writeFileSync("sync_done.txt", "Done at " + new Date().toISOString());
  } catch (e) {
    fs.writeFileSync("sync_error.txt", e.message);
  }
}

run();
