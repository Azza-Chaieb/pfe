const { createStrapi } = require("@strapi/strapi");

async function checkSpaces() {
  const app = await createStrapi({ distDir: "./dist" }).load();
  await app.server.mount();

  try {
    const spaces = await app.documents("api::space.space").findMany({
      filters: {
        coworking_space: { id: 7 },
      },
    });

    console.log("--- STRAPI SPACES DATA (COWORKING 7) ---");
    console.log(
      JSON.stringify(
        spaces.map((s) => ({
          id: s.id,
          documentId: s.documentId,
          name: s.name,
          mesh_name: s.mesh_name,
          is_per_chair: s.is_per_chair,
        })),
        null,
        2,
      ),
    );
    console.log("--- END ---");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit(0);
  }
}

checkSpaces();
