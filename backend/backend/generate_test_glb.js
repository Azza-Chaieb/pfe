const fs = require("fs");

function createGLB() {
  // Basic multi-floor structure: 2 floors (planes) and 2 cubes (bureau)
  // We'll use a very simple binary layout.

  const json = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [
      { name: "Building", children: [1, 2, 3, 4] },
      { name: "RDC_Floor", mesh: 0, translation: [0, 0, 0] },
      { name: "Bureau_101", mesh: 1, translation: [2, 0.5, 2] },
      { name: "N1_Floor", mesh: 0, translation: [0, 4, 0] },
      { name: "Bureau_201", mesh: 1, translation: [-2, 4.5, -2] },
    ],
    meshes: [
      {
        name: "Floor",
        primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }],
      },
      {
        name: "Room",
        primitives: [{ attributes: { POSITION: 2 }, indices: 3, material: 1 }],
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 4,
        type: "VEC3",
        max: [5, 0, 5],
        min: [-5, 0, -5],
      },
      { bufferView: 1, componentType: 5123, count: 6, type: "SCALAR" },
      {
        bufferView: 2,
        componentType: 5126,
        count: 24,
        type: "VEC3",
        max: [1, 1, 1],
        min: [-1, -1, -1],
      },
      { bufferView: 3, componentType: 5123, count: 36, type: "SCALAR" },
    ],
    bufferViews: [
      { buffer: 0, byteLength: 48, target: 34962 }, // Floor pos
      { buffer: 0, byteOffset: 48, byteLength: 12, target: 34963 }, // Floor indices
      { buffer: 0, byteOffset: 64, byteLength: 288, target: 34962 }, // Room pos (24 * 12)
      { buffer: 0, byteOffset: 352, byteLength: 72, target: 34963 }, // Room indices (36 * 2)
    ],
    buffers: [{ byteLength: 424 }],
    materials: [
      {
        name: "FloorColor",
        pbrMetallicRoughness: { baseColorFactor: [0.2, 0.2, 0.2, 1] },
      },
      {
        name: "RoomColor",
        pbrMetallicRoughness: { baseColorFactor: [0.1, 0.5, 0.8, 1] },
      },
    ],
  };

  const jsonStr = JSON.stringify(json);
  const jsonPadding = (4 - (jsonStr.length % 4)) % 4;
  const jsonLength = jsonStr.length + jsonPadding;

  const binBuffer = Buffer.alloc(424);
  // Fill with zero or dummy data (POSITION accessors need floats)
  // This is a minimal valid GLB generation

  const header = Buffer.alloc(12);
  header.write("glTF", 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonLength + 8 + 424, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonLength, 0);
  jsonChunkHeader.write("JSON", 4);

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(424, 0);
  binChunkHeader.write("BIN\0", 4);

  const fileBuffer = Buffer.concat([
    header,
    jsonChunkHeader,
    Buffer.from(jsonStr.padEnd(jsonLength, " ")),
    binChunkHeader,
    binBuffer,
  ]);

  fs.writeFileSync("test_space_floors.glb", fileBuffer);
  console.log("SUCCESS: test_space_floors.glb generated.");
}

createGLB();
