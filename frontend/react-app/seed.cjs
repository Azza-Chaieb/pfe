const axios = require("axios");

const API_URL = "http://localhost:1337/api";

async function seed() {
    try {
        console.log("--- Starting Seeding ---");

        // 1. Create Coworking Space if none exists
        let coworkingSpaceId;
        try {
            const csRes = await axios.get(`${API_URL}/coworking-spaces`);
            if (csRes.data.data.length > 0) {
                coworkingSpaceId = csRes.data.data[0].id;
                console.log("Using existing Coworking Space:", csRes.data.data[0].attributes?.name || csRes.data.data[0].name);
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
        } catch (error) {
            console.log("Error checking/creating coworking space (Auth?):", error.message);
            // If 403, we stop.
            if (error.response && error.response.status === 403) {
                console.error("CRITICAL: Permission Denied (403). You must enable Public 'create' permissions in Strapi Settings -> Users & Permissions -> Roles -> Public.");
                return;
            }
        }

        if (!coworkingSpaceId) {
            console.error("Could not get Coworking Space ID. Aborting.");
            return;
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
                console.log("Equipment might already exist:", eq.name);
                // Try to find it
                try {
                    const existing = await axios.get(`${API_URL}/equipments?filters[name][$eq]=${encodeURIComponent(eq.name)}`);
                    if (existing.data.data.length > 0) eqIds.push(existing.data.data[0].id);
                } catch (err) { }
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
                console.log("Service might already exist:", sv.name);
                // Try to find it
                try {
                    const existing = await axios.get(`${API_URL}/services?filters[name][$eq]=${encodeURIComponent(sv.name)}`);
                    if (existing.data.data.length > 0) svIds.push(existing.data.data[0].id);
                } catch (err) { }
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
                mesh_name: "bureau_1", // Matched with SVG ID
                coworking_space: coworkingSpaceId,
                equipments: [eqIds[0]].filter(Boolean),
                services: [svIds[0]].filter(Boolean),
            },
            {
                name: "Salle de Réunion Atlas",
                type: "meeting-room",
                capacity: 8,
                floor: 1,
                pricing_hourly: 40,
                pricing_daily: 200,
                mesh_name: "bureau_2", // Matched with SVG ID
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
                mesh_name: "bureau_3", // Matched with SVG ID
                coworking_space: coworkingSpaceId,
                equipments: [eqIds[1]].filter(Boolean),
            },
        ];

        for (const sp of spaces) {
            try {
                // Check if exists
                const existing = await axios.get(`${API_URL}/spaces?filters[name][$eq]=${encodeURIComponent(sp.name)}`);
                if (existing.data.data.length > 0) {
                    console.log("Deleting existing space to ensure clean state:", sp.name);
                    const id = existing.data.data[0].documentId || existing.data.data[0].id; // Use documentId if v5
                    await axios.delete(`${API_URL}/spaces/${id}`);
                }

                const payload = { ...sp };
                // Try to adding coworking_space (it was kept before)
                // Remove others for now to test linkage
                delete payload.equipments;
                delete payload.services;

                await axios.post(`${API_URL}/spaces`, { data: payload });
                console.log("Added Space (linked to CS):", sp.name);

            } catch (e) {
                console.error("Error creating space:", sp.name);
                if (e.response) {
                    console.error("Status:", e.response.status);
                    console.error("Data:", JSON.stringify(e.response.data, null, 2));
                } else {
                    console.error("Message:", e.message);
                }
            }
        }

        console.log("--- Seeding Completed Successfully ---");
    } catch (error) {
        console.error(
            "Seeding failed (Global):",
            error.response ? JSON.stringify(error.response.data, null, 2) : error.message,
        );
    }
}

seed();
