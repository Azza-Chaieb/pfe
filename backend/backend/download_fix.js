const https = require("https");
const fs = require("fs");

const url =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Box/glTF-Binary/Box.glb";
// Switching to a GUARANTEED working Khronos model for now to fix the crash.
const file = fs.createWriteStream("test_space_floors.glb");

https.get(url, function (response) {
  response.pipe(file);
  file.on("finish", () => {
    file.close();
    console.log("Download Completed: test_space_floors.glb");
  });
});
