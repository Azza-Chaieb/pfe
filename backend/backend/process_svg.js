const fs = require("fs");
const s = "C:\\Users\\Nwres\\Downloads\\plan\\plan.svg";
const d =
  "c:\\Users\\Nwres\\Documents\\GitHub\\pfe\\frontend\\react-app\\public\\plan_processed.svg";

try {
  const data = fs.readFileSync(s, "utf8");
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
  let processedData = data;

  elementsToId.forEach((tag) => {
    const regex = new RegExp(`<${tag}(?![^>]*\\bid=)`, "g");
    processedData = processedData.replace(regex, (match) => {
      return `${match} id="bureau_${idCounter++}"`;
    });
  });

  fs.writeFileSync(d, processedData);
  console.log(`Success! Injected ${idCounter - 1} IDs and saved to ${d}`);
} catch (e) {
  console.error(e);
}
