const fs = require("fs");
const path = require("path");

const targetPath = path.resolve(__dirname, "test_space_floors.gltf");

const vertices = new Float32Array([
  -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1,
  -1, -1, -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1,
  1, -1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, -1, -1, -1, -1, -1, 1,
  -1, 1, 1, -1, 1, -1,
]);

const indices = new Uint16Array([
  0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
  15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
]);

const buffer = Buffer.alloc(vertices.byteLength + indices.byteLength);
let offset = 0;
buffer.fill(Buffer.from(vertices.buffer), offset);
offset += vertices.byteLength;
buffer.fill(Buffer.from(indices.buffer), offset);

const base64 = buffer.toString("base64");

const gltf = {
  asset: { version: "2.0", generator: "FIXED_GENERATOR" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ name: "Building", children: [1, 2] }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
  accessors: [
    {
      bufferView: 0,
      componentType: 5126,
      count: 24,
      type: "VEC3",
      max: [1, 1, 1],
      min: [-1, -1, -1],
    },
    { bufferView: 1, componentType: 5123, count: 36, type: "SCALAR" },
  ],
  bufferViews: [
    { buffer: 0, byteLength: vertices.byteLength, target: 34962 },
    {
      buffer: 0,
      byteOffset: vertices.byteLength,
      byteLength: indices.byteLength,
      target: 34963,
    },
  ],
  buffers: [
    {
      byteLength: buffer.byteLength,
      uri: `data:application/octet-stream;base64,${base64}`,
    },
  ],
};

// Also define the sub-meshes (floors) for the test
gltf.nodes.push({ name: "Bureau_101", mesh: 0, translation: [0, 0, 0] });
gltf.nodes.push({ name: "Bureau_201", mesh: 0, translation: [0, 4, 0] });

fs.writeFileSync(targetPath, JSON.stringify(gltf, null, 2));
console.log("SUCCESS: Written to " + targetPath);
