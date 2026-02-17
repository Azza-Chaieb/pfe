const fs = require("fs");
const path = require("path");

const sourcePath = "C:\\Users\\Nwres\\Downloads\\plan\\plan.svg";
const destPath =
  "c:\\Users\\Nwres\\Documents\\GitHub\\pfe\\frontend\\react-app\\public\\plan.svg";

console.log(`Reading from ${sourcePath}...`);

try {
  let svgContent = fs.readFileSync(sourcePath, "utf8");
  let idCounter = 1;

  // A more sophisticated approach:
  // We want to add id="bureau_XXXX" to tags that don't have one.
  // We look for <path ... /> or <rect ... /> or <circle ... />

  const elementsToId = [
    "path",
    "rect",
    "circle",
    "ellipse",
    "polygon",
    "polyline",
    "use",
  ];

  elementsToId.forEach((tag) => {
    // Regex to find start of tag that doesn't already have an id
    // This is a bit simplified but usually works for typical SVG output
    const regex = new RegExp(`<${tag}(?![^>]*\\bid=)`, "g");
    svgContent = svgContent.replace(regex, (match) => {
      const newId = `bureau_${idCounter++}`;
      return `${match} id="${newId}"`;
    });
  });

  console.log(`Successfully injected ${idCounter - 1} IDs.`);

  fs.writeFileSync(destPath, svgContent);
  console.log(`Successfully saved to ${destPath}`);
} catch (err) {
  console.error("Error processing SVG:", err);
  process.exit(1);
}
