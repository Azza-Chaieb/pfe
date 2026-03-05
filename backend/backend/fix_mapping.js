const strapi = require("@strapi/strapi");

async function fixMapping() {
  const app = await strapi({ distDir: "./dist" }).load();
  await app.server.mount();

  console.log("Searching for 'Open Space'...");

  // Find a space that should be the open space
  const openSpaces = await app.documents("api::space.space").findMany({
    filters: {
      $or: [
        { name: { $containsi: "open" } },
        { name: { $containsi: "etudiant" } },
        { name: { $containsi: "table" } },
      ],
    },
  });

  if (openSpaces.length === 0) {
    console.log("No 'Open Space' found. Please create one in Strapi first.");
    process.exit(0);
  }

  const space = openSpaces[0];
  console.log(`Found space: ${space.name} (ID: ${space.id})`);

  console.log(
    `Updating ${space.name} with mesh_name='bureau_*' and is_per_chair=true...`,
  );

  await app.documents("api::space.space").update({
    documentId: space.documentId,
    data: {
      mesh_name: "bureau_*",
      is_per_chair: true,
      capacity: 40, // Default capacity for the whole open space
    },
  });

  console.log("Done! Please refresh your React page.");
  process.exit(0);
}

fixMapping().catch((err) => {
  console.error(err);
  process.exit(1);
});
