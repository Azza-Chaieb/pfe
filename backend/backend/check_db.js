module.exports = async ({ strapi }) => {
  try {
    const equipments = await strapi.db
      .query("api::equipment.equipment")
      .findMany();
    console.log(`--- EQUIPMENT CHECK ---`);
    console.log(`Found ${equipments.length} equipments.`);
    equipments.forEach((e) =>
      console.log(`- ${e.name} (ID: ${e.id})` || `- Unknown (ID: ${e.id})`),
    );

    const spaces = await strapi.db.query("api::space.space").findMany({
      populate: ["equipments"],
    });
    console.log(`\n--- SPACE CHECK ---`);
    const spaceWithEq = spaces.filter(
      (s) => s.equipments && s.equipments.length > 0,
    );
    console.log(
      `Found ${spaces.length} spaces total, ${spaceWithEq.length} have equipments linked.`,
    );

    if (spaceWithEq.length > 0) {
      console.log(
        `Example: ${spaceWithEq[0].name} has ${spaceWithEq[0].equipments.length} equipments.`,
      );
    }
  } catch (err) {
    console.error("Check failed:", err.message);
  }
};
