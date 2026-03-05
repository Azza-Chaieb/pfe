const { createStrapi } = require("@strapi/strapi");

async function syncEquipment() {
  console.log("🚀 Starting Equipment Synchronization...");
  const app = await createStrapi({ distDir: "./dist" }).load();
  await app.server.mount();

  // 1. Ensure permissions
  console.log("📁 Checking permissions...");
  const publicRole = await app.db
    .query("plugin::users-permissions.role")
    .findOne({ where: { type: "public" } });
  if (publicRole) {
    const action = "api::equipment.equipment.find";
    const perm = await app.db
      .query("plugin::users-permissions.permission")
      .findOne({
        where: { role: publicRole.id, action },
      });
    if (!perm) {
      await app.db.query("plugin::users-permissions.permission").create({
        data: { action, role: publicRole.id },
      });
      console.log("✅ Added 'find' permission to Public role");
    } else {
      console.log("ℹ️ Permission already exists");
    }
  }

  // 2. Seed equipments
  console.log("📦 Checking equipment data...");
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

  const equipmentIds = [];
  for (const eq of equipments) {
    let record = await app.db
      .query("api::equipment.equipment")
      .findOne({ where: { name: eq.name } });
    if (!record) {
      record = await app.db.query("api::equipment.equipment").create({
        data: { ...eq, publishedAt: new Date() },
      });
      console.log(`✅ Created: ${eq.name}`);
    } else {
      console.log(`ℹ️ Exists: ${eq.name}`);
    }
    equipmentIds.push(record.id);
  }

  // 3. Link to all spaces
  console.log("🔗 Linking equipment to spaces...");
  const spaces = await app.db.query("api::space.space").findMany();
  for (const space of spaces) {
    await app.service("api::space.space").update(space.id, {
      data: { equipments: equipmentIds },
    });
    console.log(`✅ Linked to space: ${space.name || space.id}`);
  }

  console.log("✨ Synchronization Complete!");
  process.exit(0);
}

syncEquipment().catch((e) => {
  console.error("❌ Sync failed:", e);
  process.exit(1);
});
