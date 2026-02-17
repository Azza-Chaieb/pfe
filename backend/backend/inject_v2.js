const fs = require("fs");

const sourcePath = "C:\\Users\\Nwres\\Downloads\\plan\\plan.svg";
const destPath =
  "c:\\Users\\Nwres\\Documents\\GitHub\\pfe\\frontend\\react-app\\public\\plan_v2.svg";

console.log("Reading from:", sourcePath);
try {
  let svgContent = fs.readFileSync(sourcePath, "utf8");
  console.log("Read success, length:", svgContent.length);

  let idCounter = 1;
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
    const regex = new RegExp(`<${tag}(?![^>]*\\bid=)`, "g");
    svgContent = svgContent.replace(regex, (match) => {
      return `${match} id="bureau_${idCounter++}"`;
    });
  });

  console.log("Successfully injected", idCounter - 1, "IDs.");

  fs.writeFileSync(destPath, svgContent);
  console.log("File saved to:", destPath);
} catch (err) {
  console.error("Error:", err.message);
}
