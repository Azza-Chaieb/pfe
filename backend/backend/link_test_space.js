const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, ".tmp", "data.db");

try {
  const db = new Database(dbPath);
  console.log("--- Linking bureau_602 for testing ---");

  // Find the first space and update it
  const firstSpace = db.prepare("SELECT id, name FROM spaces LIMIT 1").get();

  if (firstSpace) {
    console.log(
      `Linking Space "${firstSpace.name}" (ID: ${firstSpace.id}) to bureau_602...`,
    );
    db.prepare(
      "UPDATE spaces SET mesh_name = ?, published_at = ? WHERE id = ?",
    ).run("bureau_602", new Date().toISOString(), firstSpace.id);
    console.log("Success! Link created.");
  } else {
    console.log(
      "No spaces found in database. Please create one in Strapi first.",
    );
  }

  db.close();
} catch (err) {
  console.error("Error: " + err.message);
  if (err.message.includes("busy")) {
    console.log(
      "TIP: Shutdown Strapi server temporarily before running this script.",
    );
  }
}
