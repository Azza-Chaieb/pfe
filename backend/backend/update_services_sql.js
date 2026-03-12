const { Client } = require("pg");

const client = new Client({
  user: "postgres",
  host: "127.0.0.1",
  database: "sunspace",
  password: "postgres",
  port: 5432,
});

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
  "Vidéoprojecteur HD": {
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
};

async function updateServices() {
  try {
    await client.connect();
    console.log("Connected to Postgres.");

    for (const [name, config] of Object.entries(configurations)) {
      console.log(`Updating configuration for service: ${name}`);
      const query = "UPDATE services SET configuration = $1 WHERE name = $2";
      const res = await client.query(query, [JSON.stringify(config), name]);
      console.log(`Result: ${res.rowCount} row(s) updated.`);
    }

    console.log("--- FINAL CHECK ---");
    const checkRes = await client.query(
      "SELECT name, configuration FROM services",
    );
    checkRes.rows.forEach((row) => {
      console.log(`Name: ${row.name}, Has Config: ${!!row.configuration}`);
    });
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

updateServices();
