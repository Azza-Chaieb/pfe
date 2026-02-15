const fs = require("fs");
const path = require("path");

async function download(url, filename) {
  const dir = path.join(__dirname, "test_models");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  console.log(`Starting: ${filename}`);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(path.join(dir, filename), buffer);
    console.log(`SUCCESS: ${filename} saved in ${path.join(dir, filename)}`);
  } catch (e) {
    console.error(`FAILED ${filename}: ${e.message}`);
  }
}

async function start() {
  await download(
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb",
    "Box.glb",
  );
  await download(
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb",
    "Chair.glb",
  );
  console.log("--- ALL DOWNLOADS FINISHED ---");
}

start();
