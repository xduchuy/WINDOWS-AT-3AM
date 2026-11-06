#!/usr/bin/env node
/**
 * Procedural Binary glTF 2.0 (.glb) Asset Pipeline for WINDOWS AT 3AM
 * Generates modular architectural parts, interior furniture kits, and articulated character meshes
 * with PBR metallic-roughness materials, vertex normals, and UV coordinates.
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve(process.cwd(), 'public/assets/models');
fs.mkdirSync(OUT_DIR, { recursive: true });

/**
 * Helper to create a box primitive with normals and UVs
 */
function createBoxGeometry(w, h, d, offsetX = 0, offsetY = 0, offsetZ = 0) {
  const hx = w / 2;
  const hy = h / 2;
  const hz = d / 2;

  // 24 vertices (4 per face)
  const positions = [
    // Front (+Z)
    -hx, -hy,  hz,   hx, -hy,  hz,   hx,  hy,  hz,  -hx,  hy,  hz,
    // Back (-Z)
     hx, -hy, -hz,  -hx, -hy, -hz,  -hx,  hy, -hz,   hx,  hy, -hz,
    // Top (+Y)
    -hx,  hy,  hz,   hx,  hy,  hz,   hx,  hy, -hz,  -hx,  hy, -hz,
    // Bottom (-Y)
    -hx, -hy, -hz,   hx, -hy, -hz,   hx, -hy,  hz,  -hx, -hy,  hz,
    // Right (+X)
     hx, -hy,  hz,   hx, -hy, -hz,   hx,  hy, -hz,   hx,  hy,  hz,
    // Left (-X)
    -hx, -hy, -hz,  -hx, -hy,  hz,  -hx,  hy,  hz,  -hx,  hy, -hz,
  ];

  for (let i = 0; i < positions.length; i += 3) {
    positions[i] += offsetX;
    positions[i + 1] += offsetY;
    positions[i + 2] += offsetZ;
  }

  const normals = [
    0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
    0, 0,-1,  0, 0,-1,  0, 0,-1,  0, 0,-1,
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
    0,-1, 0,  0,-1, 0,  0,-1, 0,  0,-1, 0,
    1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
   -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
  ];

  const uvs = [];
  for (let f = 0; f < 6; f++) {
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
  }

  const indices = [];
  for (let f = 0; f < 6; f++) {
    const base = f * 4;
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  return { positions, normals, uvs, indices };
}

/**
 * Merges multiple box sub-geometries into a single mesh primitive
 */
function mergeGeometries(parts) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  let vertexOffset = 0;

  for (const part of parts) {
    positions.push(...part.positions);
    normals.push(...part.normals);
    uvs.push(...part.uvs);
    for (const idx of part.indices) {
      indices.push(idx + vertexOffset);
    }
    vertexOffset += part.positions.length / 3;
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(indices),
  };
}

/**
 * Exports a multi-node scene to binary glTF 2.0 (.glb)
 */
function writeGlbFile(filename, nodesSpec, materialsSpec) {
  const bufferChunks = [];
  const bufferViews = [];
  const accessors = [];
  const meshes = [];
  const nodes = [];
  let byteOffset = 0;

  function appendAlignedBuffer(typedArray, target) {
    const rawBuf = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    const pad = (4 - (rawBuf.length % 4)) % 4;
    const padded = pad > 0 ? Buffer.concat([rawBuf, Buffer.alloc(pad)]) : rawBuf;
    const viewIndex = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: rawBuf.length,
      target,
    });
    bufferChunks.push(padded);
    byteOffset += padded.length;
    return viewIndex;
  }

  for (let i = 0; i < nodesSpec.length; i++) {
    const spec = nodesSpec[i];
    const geom = spec.geometry;

    // Compute min/max for positions
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let j = 0; j < geom.positions.length; j += 3) {
      for (let k = 0; k < 3; k++) {
        const v = geom.positions[j + k];
        if (v < min[k]) min[k] = v;
        if (v > max[k]) max[k] = v;
      }
    }

    const posView = appendAlignedBuffer(geom.positions, 34962);
    const normView = appendAlignedBuffer(geom.normals, 34962);
    const uvView = appendAlignedBuffer(geom.uvs, 34962);
    const idxView = appendAlignedBuffer(geom.indices, 34963);

    const posAcc = accessors.length;
    accessors.push({
      bufferView: posView,
      componentType: 5126,
      count: geom.positions.length / 3,
      type: 'VEC3',
      min,
      max,
    });

    const normAcc = accessors.length;
    accessors.push({
      bufferView: normView,
      componentType: 5126,
      count: geom.normals.length / 3,
      type: 'VEC3',
    });

    const uvAcc = accessors.length;
    accessors.push({
      bufferView: uvView,
      componentType: 5126,
      count: geom.uvs.length / 2,
      type: 'VEC2',
    });

    const idxAcc = accessors.length;
    accessors.push({
      bufferView: idxView,
      componentType: 5123,
      count: geom.indices.length,
      type: 'SCALAR',
    });

    const meshIndex = meshes.length;
    meshes.push({
      name: spec.name,
      primitives: [
        {
          attributes: {
            POSITION: posAcc,
            NORMAL: normAcc,
            TEXCOORD_0: uvAcc,
          },
          indices: idxAcc,
          material: spec.materialIndex ?? 0,
        },
      ],
    });

    nodes.push({
      name: spec.name,
      mesh: meshIndex,
      translation: spec.translation || [0, 0, 0],
    });
  }

  const binBuffer = Buffer.concat(bufferChunks);

  const gltf = {
    asset: {
      version: '2.0',
      generator: 'WindowsAt3AM-ProceduralAssetPipeline',
    },
    scene: 0,
    scenes: [
      {
        name: 'Scene',
        nodes: nodes.map((_, idx) => idx),
      },
    ],
    nodes,
    meshes,
    materials: materialsSpec,
    accessors,
    bufferViews,
    buffers: [
      {
        byteLength: binBuffer.length,
      },
    ],
  };

  const jsonStr = JSON.stringify(gltf);
  const jsonPad = (4 - (Buffer.byteLength(jsonStr) % 4)) % 4;
  const jsonChunkData = Buffer.concat([
    Buffer.from(jsonStr, 'utf8'),
    Buffer.alloc(jsonPad, 0x20),
  ]);

  const totalLength = 12 + 8 + jsonChunkData.length + 8 + binBuffer.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // 'glTF'
  header.writeUInt32LE(2, 4);          // version 2
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunkData.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4); // 'JSON'

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binBuffer.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4); // 'BIN\0'

  const glb = Buffer.concat([header, jsonHeader, jsonChunkData, binHeader, binBuffer]);
  const fullPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(fullPath, glb);
  console.log(`[AssetPipeline] Generated ${filename} (${glb.length} bytes)`);
}

// 1. Generate Courtyard Architectural Kit (Sash Window Frame, Wrought-Iron Balcony, AC Compressor, Cornice)
const archMaterials = [
  {
    name: 'WeatheredTimberSash',
    pbrMetallicRoughness: { baseColorFactor: [0.16, 0.18, 0.22, 1.0], metallicFactor: 0.1, roughnessFactor: 0.65 },
  },
  {
    name: 'WetConcreteSill',
    pbrMetallicRoughness: { baseColorFactor: [0.22, 0.25, 0.29, 1.0], metallicFactor: 0.08, roughnessFactor: 0.28 },
  },
  {
    name: 'WroughtIronBalcony',
    pbrMetallicRoughness: { baseColorFactor: [0.09, 0.11, 0.14, 1.0], metallicFactor: 0.85, roughnessFactor: 0.38 },
  },
  {
    name: 'WeatheredACSteel',
    pbrMetallicRoughness: { baseColorFactor: [0.28, 0.31, 0.34, 1.0], metallicFactor: 0.62, roughnessFactor: 0.52 },
  },
];

const windowFrameGeom = mergeGeometries([
  createBoxGeometry(2.3, 0.14, 0.28, 0, -1.35, 0),  // Concrete sill
  createBoxGeometry(2.26, 0.16, 0.24, 0, 1.35, 0),  // Upper lintel
  createBoxGeometry(0.14, 2.7, 0.22, -1.05, 0, 0),  // Left jamb
  createBoxGeometry(0.14, 2.7, 0.22, 1.05, 0, 0),   // Right jamb
  createBoxGeometry(2.0, 0.07, 0.16, 0, 0.05, 0.02), // Meeting rail (sash bar)
  createBoxGeometry(0.05, 2.6, 0.12, 0, 0, 0.02),    // Central muntin
]);

const balconyParts = [
  createBoxGeometry(2.6, 0.12, 0.95, 0, -1.42, 0.45), // Balcony deck slab
  createBoxGeometry(2.6, 0.06, 0.06, 0, -0.48, 0.9),  // Top handrail
  createBoxGeometry(0.06, 0.95, 0.06, -1.26, -0.95, 0.9), // Left post
  createBoxGeometry(0.06, 0.95, 0.06, 1.26, -0.95, 0.9),  // Right post
  createBoxGeometry(0.06, 0.06, 0.9, -1.26, -0.48, 0.45), // Left side rail
  createBoxGeometry(0.06, 0.06, 0.9, 1.26, -0.48, 0.45),  // Right side rail
];
for (let b = -1.05; b <= 1.05; b += 0.21) {
  balconyParts.push(createBoxGeometry(0.03, 0.9, 0.03, b, -0.95, 0.9));
}
const balconyGeom = mergeGeometries(balconyParts);

const acUnitGeom = mergeGeometries([
  createBoxGeometry(0.86, 0.58, 0.46, 0, 0, 0),        // Main chassis
  createBoxGeometry(0.48, 0.44, 0.05, -0.12, 0, 0.24), // Fan shroud
  createBoxGeometry(0.22, 0.44, 0.04, 0.26, 0, 0.24),  // Exhaust louvers
  createBoxGeometry(0.06, 0.35, 0.48, -0.38, -0.35, 0),// Left wall bracket
  createBoxGeometry(0.06, 0.35, 0.48, 0.38, -0.35, 0), // Right wall bracket
]);

writeGlbFile(
  'courtyard_facade_kit.glb',
  [
    { name: 'SashWindowFrame', geometry: windowFrameGeom, materialIndex: 0 },
    { name: 'WroughtIronBalcony', geometry: balconyGeom, materialIndex: 2 },
    { name: 'ACCompressorUnit', geometry: acUnitGeom, materialIndex: 3 },
  ],
  archMaterials
);

// 2. Generate Detailed Interior Furniture Kit (.glb)
const furnitureMaterials = [
  {
    name: 'DarkMahoganyWood',
    pbrMetallicRoughness: { baseColorFactor: [0.26, 0.14, 0.08, 1.0], metallicFactor: 0.05, roughnessFactor: 0.45 },
  },
  {
    name: 'BrushedBrass',
    pbrMetallicRoughness: { baseColorFactor: [0.78, 0.61, 0.28, 1.0], metallicFactor: 0.85, roughnessFactor: 0.25 },
  },
  {
    name: 'UpholsteryVelvet',
    pbrMetallicRoughness: { baseColorFactor: [0.18, 0.26, 0.32, 1.0], metallicFactor: 0.02, roughnessFactor: 0.82 },
  },
  {
    name: 'CrimsonViolinCase',
    pbrMetallicRoughness: { baseColorFactor: [0.52, 0.09, 0.09, 1.0], metallicFactor: 0.15, roughnessFactor: 0.42 },
  },
];

const workbenchGeom = mergeGeometries([
  createBoxGeometry(1.75, 0.08, 0.82, 0, 0.78, 0),      // Tabletop
  createBoxGeometry(1.7, 0.35, 0.22, 0, 1.0, -0.28),    // Tool hutch back
  createBoxGeometry(0.09, 0.76, 0.09, -0.78, 0.38, -0.34),
  createBoxGeometry(0.09, 0.76, 0.09, 0.78, 0.38, -0.34),
  createBoxGeometry(0.09, 0.76, 0.09, -0.78, 0.38, 0.34),
  createBoxGeometry(0.09, 0.76, 0.09, 0.78, 0.38, 0.34),
  createBoxGeometry(0.52, 0.18, 0.72, 0.52, 0.64, 0),   // Drawer unit
]);

const bookshelfGeom = mergeGeometries([
  createBoxGeometry(1.4, 2.2, 0.38, 0, 1.1, 0),
  createBoxGeometry(1.32, 0.05, 0.36, 0, 0.45, 0.02),
  createBoxGeometry(1.32, 0.05, 0.36, 0, 0.95, 0.02),
  createBoxGeometry(1.32, 0.05, 0.36, 0, 1.45, 0.02),
  createBoxGeometry(1.32, 0.05, 0.36, 0, 1.95, 0.02),
]);

const violinCaseGeom = mergeGeometries([
  createBoxGeometry(0.78, 0.14, 0.28, 0, 0.07, 0),
  createBoxGeometry(0.24, 0.12, 0.18, -0.42, 0.06, 0), // Neck end
]);

writeGlbFile(
  'furniture_kit.glb',
  [
    { name: 'LuthierWorkbench', geometry: workbenchGeom, materialIndex: 0 },
    { name: 'ArchivalBookshelf', geometry: bookshelfGeom, materialIndex: 0 },
    { name: 'StradivariusCase', geometry: violinCaseGeom, materialIndex: 3 },
  ],
  furnitureMaterials
);

// 3. Generate Articulated Resident Rig Template (.glb)
const charMaterials = [
  {
    name: 'NoirCoatFabric',
    pbrMetallicRoughness: { baseColorFactor: [0.18, 0.21, 0.26, 1.0], metallicFactor: 0.05, roughnessFactor: 0.75 },
  },
];

const residentTorsoGeom = mergeGeometries([
  createBoxGeometry(0.42, 0.62, 0.24, 0, 1.12, 0), // Torso
  createBoxGeometry(0.24, 0.28, 0.24, 0, 1.62, 0), // Head
  createBoxGeometry(0.14, 0.55, 0.14, -0.3, 1.08, 0), // Left Arm
  createBoxGeometry(0.14, 0.55, 0.14, 0.3, 1.08, 0),  // Right Arm
  createBoxGeometry(0.16, 0.78, 0.16, -0.12, 0.39, 0), // Left Leg
  createBoxGeometry(0.16, 0.78, 0.16, 0.12, 0.39, 0),  // Right Leg
]);

writeGlbFile(
  'resident_rig.glb',
  [{ name: 'ResidentHumanoid', geometry: residentTorsoGeom, materialIndex: 0 }],
  charMaterials
);
