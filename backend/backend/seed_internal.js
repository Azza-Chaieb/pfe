/**
 * Seed equipment using Strapi's internal API to avoid needing a running server.
 * Run with: npx strapi console --run seed_internal.js
 */

module.exports = async ({ strapi }) => {
  console.log("--- Seeding Equipment (Internal) ---");

  const equipmentsData = [
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

  for (const data of equipmentsData) {
    const existing = await strapi.db.query("api::equipment.equipment").findOne({
      where: { name: data.name },
    });

    if (existing) {
      console.log(`Equipment already exists: ${data.name}`);
      createdIds.push(existing.id);
    } else {
      const created = await strapi.service("api::equipment.equipment").create({
        data: { ...data, publishedAt: new Date() },
      });
      console.log(`Successfully created equipment: ${data.name}`);
      createdIds.push(created.id);
    }
  }

  console.log("--- Linking to Spaces ---");
  const spaces = await strapi.db.query("api::space.space").findMany();

  for (const space of spaces) {
    console.log(`Updating Space: ${space.name}`);
    await strapi.service("api::space.space").update(space.id, {
      data: {
        equipments: createdIds,
      },
    });
  }

  console.log("--- Seeding Completed ---");
};
