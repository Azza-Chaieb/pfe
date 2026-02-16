const fs = require("fs");

const gltf = {
  asset: {
    version: "2.0",
    generator: "Handcrafted Multi-Floor Tester",
  },
  scene: 0,
  scenes: [{ nodes: [0, 1, 2, 3] }],
  nodes: [
    { name: "Floor_RDC", mesh: 0, translation: [0, 0, 0] },
    { name: "Bureau_A1", mesh: 1, translation: [2, 0.5, 2] },
    { name: "Floor_N1", mesh: 0, translation: [0, 4, 0] },
    { name: "Bureau_B1", mesh: 1, translation: [-2, 4.5, -2] },
  ],
  meshes: [
    {
      name: "FloorMesh",
      primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }],
    },
    {
      name: "RoomMesh",
      primitives: [{ attributes: { POSITION: 2 }, indices: 1, material: 1 }],
    },
  ],
  accessors: [
    {
      bufferView: 0,
      componentType: 5126,
      count: 24,
      type: "VEC3",
      max: [5, 0.1, 5],
      min: [-5, 0, -5],
    },
    {
      bufferView: 1,
      componentType: 5123,
      count: 36,
      type: "SCALAR",
    },
    {
      bufferView: 2,
      componentType: 5126,
      count: 24,
      type: "VEC3",
      max: [1, 1, 1],
      min: [-1, -1, -1],
    },
  ],
  bufferViews: [
    { buffer: 0, byteLength: 288, target: 34962 },
    { buffer: 0, byteOffset: 288, byteLength: 72, target: 34963 },
    { buffer: 0, byteOffset: 360, byteLength: 288, target: 34962 },
  ],
  buffers: [
    {
      uri: "data:application/octet-stream;base64,wAAAv8AAAL_AAAA_wAAAv8AAAD_AAAA_wAAAL8AAAD_AAAA_wAAAL8AAAL_AAAA_wAAAvwAAAL_AAAA_8AAAvwAAAL_AAAAv8AAAL8AAAL_AAAAvwAAAL8AAAD_AAAAv8AAAD_AAAA_AAAAvwAAAD_AAAAvwAAAL8AAAD_AAAAv8AAAL_AAAA_AAAAv8AAAL_AAAA_AAAAvwAAAL_AAAAv8AAAL8AAAL_AAAAv8AAAL8AAAD_AAAAv8AAAD_AAAA_AAAAvwAAAD_AAAAvwAAAL8AAAD_AAAAv8AAAL_AAAA_AAAAv8AAAL_AAAA_AAAAv8AAAL_AAAAv8AAAL8AAAL_AAAAv8AAAL8AAAD_AAAAv8AAAD_AAAA_AAAAvwAAAD_AAAAvwAAAL8AAAD_AAAAv8AAAL_AAAA_AAAAv8AAAL_AAAA_AAAAv8AAAL_AAAAv8AAAL8AAAL_AAAAv8AAAL8AAAD_AAAAv8AAAD_AAAA_AAAAvwAAAD_AAAAvwAAAL8AAAD_AAAAv8AAAL_AAAA_AAAAv8AAAL_AAAA_AAAAv8AAAL_AAAAv8AAAL8AAAL_AAAAv8AAAL8AAAD_AAAAv8AAAD_AAAA_AAAAvwAAAD_AAAAvwAAAL8AAAD_AAAAv8AAAL_AAAA_AAAAv8AAAL_AAAA_AAAAv8AAAL_AAAAv8AAAL8AAAL_AAAAv8AAAL8AAAD_AAAAv8AAAD_AAAA_AAAAvwAAAD_AAAAvwAAAL8AAAD_AAAAv8AAAL_AAAA_AAAAv8AAAL_AAAA_AAAAv8AAAL_AAAAv8AAAL8AAAL_AAAAv8AAAL8AAAD_AAAAv8AAAD_AAAA_AAAAvwAAAD_AAAAvwAAAL8AAAD_AAAAv8AAAL_AAAA_AAAAv8AAAL_AAAA_AAAAv8AAAL_AAAAv8AAAL8AAAL_AAAAv8AAAL8AAAD_AAAAv8AAAD_AAAA_AAAAvwAAAD_AAAAvwAAAL8AAAD_AAAAv8AAAL_AAAA_AAAAv8AAAL_AAAA_AAAAv8AAAL_AAAAv8AAAL8AAAL_AAAAv8AAAL8AAAD_AAAAv8AAAD_AAAA_AAAAvwAAAD_AAAAvwAAAL8AAAD_AAAAv8AAAL_AAAA_AAAAvB==",
    },
  ],
  materials: [
    {
      pbrMetallicRoughness: {
        baseColorFactor: [0.5, 0.5, 0.5, 1],
        roughnessFactor: 0.1,
      },
    },
    {
      pbrMetallicRoughness: {
        baseColorFactor: [0.1, 0.6, 0.9, 1],
        metallicFactor: 0.5,
      },
    },
  ],
};

fs.writeFileSync("test_space_floors.gltf", JSON.stringify(gltf, null, 2));
console.log("Model generated: test_space_floors.gltf");
