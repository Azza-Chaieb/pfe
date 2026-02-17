const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = path.join(__dirname, ".tmp", "data.db");
const outPath = path.join(__dirname, "db_tables.txt");

try {
  const db = new Database(dbPath);
  console.log("--- Searching for the correct table name ---");

  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all();
  let output = "All tables:\n" + tables.map((t) => t.name).join("\n") + "\n\n";

  const spacesTable = tables.find(
    (t) => t.name.includes("space") && !t.name.includes("link"),
  )?.name;

  if (spacesTable) {
    output += `Potential Match: ${spacesTable}\n`;
    const columns = db.pragma(`table_info(${spacesTable})`);
    output += "Columns: " + columns.map((c) => c.name).join(", ") + "\n";

    const count = db
      .prepare(`SELECT count(*) as total FROM ${spacesTable}`)
      .get();
    output += `Total rows in ${spacesTable}: ${count.total}\n`;

    const rows = db.prepare(`SELECT * FROM ${spacesTable} LIMIT 3`).all();
    output += "Samples:\n" + JSON.stringify(rows, null, 2) + "\n";
  } else {
    output += 'No table containing "space" found.\n';
  }

  fs.writeFileSync(outPath, output);
  console.log("Results saved to db_tables.txt");
  db.close();
} catch (err) {
  fs.writeFileSync(outPath, "Error: " + err.message);
  console.error("Error: " + err.message);
}
