const https = require("https");
const fs = require("fs");
const path = require("path");

const url =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Box/glTF-Binary/Box.glb";
const filePath = path.join(__dirname, "test_spaces_v3.glb");
const file = fs.createWriteStream(filePath);

console.log("Starting download...");

https
  .get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error(`Status code: ${res.statusCode}`);
      return;
    }
    res.pipe(file);
    file.on("finish", () => {
      file.close();
      console.log(`Download Finished: ${filePath}`);
      console.log(`File size: ${fs.statSync(filePath).size} bytes`);
    });
  })
  .on("error", (err) => {
    console.error(`Error: ${err.message}`);
  });
