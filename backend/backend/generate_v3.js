const fs = require("fs");

function createGLB() {
  const json = {
    asset: { version: "2.0", generator: "ANTIGRAVITY_GLB_FIX" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [
      { name: "Root", children: [1, 2, 3, 4] },
      { name: "RDC_Floor", mesh: 0, translation: [0, 0, 0] },
      { name: "Bureau_101", mesh: 1, translation: [1.5, 0.5, 1.5] },
      { name: "N1_Floor", mesh: 0, translation: [0, 3, 0] },
      { name: "Bureau_201", mesh: 1, translation: [-1.5, 3.5, -1.5] },
    ],
    meshes: [
      {
        name: "Floor",
        primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }],
      },
      {
        name: "Cube",
        primitives: [{ attributes: { POSITION: 2 }, indices: 3, material: 1 }],
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 4,
        type: "VEC3",
        max: [2, 0, 2],
        min: [-2, 0, -2],
      },
      { bufferView: 1, componentType: 5123, count: 6, type: "SCALAR" },
      {
        bufferView: 2,
        componentType: 5126,
        count: 24,
        type: "VEC3",
        max: [0.5, 0.5, 0.5],
        min: [-0.5, -0.5, -0.5],
      },
      { bufferView: 3, componentType: 5123, count: 36, type: "SCALAR" },
    ],
    bufferViews: [
      { buffer: 0, byteLength: 48, target: 34962 },
      { buffer: 0, byteOffset: 48, byteLength: 12, target: 34963 },
      { buffer: 0, byteOffset: 64, byteLength: 288, target: 34962 },
      { buffer: 0, byteOffset: 352, byteLength: 72, target: 34963 },
    ],
    buffers: [{ byteLength: 424 }],
    materials: [
      {
        name: "Mat_Floor",
        pbrMetallicRoughness: { baseColorFactor: [0.2, 0.2, 0.2, 1] },
      },
      {
        name: "Mat_Room",
        pbrMetallicRoughness: { baseColorFactor: [0, 0.5, 0.8, 1] },
      },
    ],
  };

  const bin = Buffer.alloc(424);

  // Helper to write float at offset
  const wF = (idx, x, y, z) => {
    bin.writeFloatLE(x, idx * 12);
    bin.writeFloatLE(y, idx * 12 + 4);
    bin.writeFloatLE(z, idx * 12 + 8);
  };

  // Floor vertices (0-3)
  wF(0, -2, 0, -2);
  wF(1, 2, 0, -2);
  wF(2, 2, 0, 2);
  wF(3, -2, 0, 2);
  // Floor indices (offset 48)
  bin.writeUInt16LE(0, 48);
  bin.writeUInt16LE(1, 50);
  bin.writeUInt16LE(2, 52);
  bin.writeUInt16LE(0, 54);
  bin.writeUInt16LE(2, 56);
  bin.writeUInt16LE(3, 58);

  // Cube vertices (24 * 12 bytes = 288, starting at offset 64)
  // We just fill it with some data to make it valid
  for (let i = 0; i < 24; i++) {
    bin.writeFloatLE(i % 2 ? 0.5 : -0.5, 64 + i * 12);
    bin.writeFloatLE(Math.floor(i / 4) % 2 ? 0.5 : -0.5, 64 + i * 12 + 4);
    bin.writeFloatLE(Math.floor(i / 8) % 2 ? 0.5 : -0.5, 64 + i * 12 + 8);
  }
  // Cube indices (36 * 2 bytes = 72, starting at offset 352)
  for (let i = 0; i < 36; i++) {
    bin.writeUInt16LE(i % 24, 352 + i * 2);
  }

  const jsonStr = JSON.stringify(json);
  const jsonPadding = (4 - (jsonStr.length % 4)) % 4;
  const jsonLength = jsonStr.length + jsonPadding;
  const totalSize = 12 + 8 + jsonLength + 8 + 424;

  const glb = Buffer.alloc(totalSize);
  glb.write("glTF", 0);
  glb.writeUInt32LE(2, 4);
  glb.writeUInt32LE(totalSize, 8);

  glb.writeUInt32LE(jsonLength, 12);
  glb.write("JSON", 16);
  glb.write(jsonStr.padEnd(jsonLength, " "), 20);

  const binOffset = 20 + jsonLength;
  glb.writeUInt32LE(424, binOffset);
  glb.write("BIN\0", binOffset + 4);
  bin.copy(glb, binOffset + 8);

  fs.writeFileSync("test_spaces_v3.glb", glb);
  console.log("SUCCESS: test_spaces_v3.glb generated.");
}

createGLB();
