# TASK-031: 3D File Format Compatibility Research

> **User Story**: US-014 — As an admin I want to upload 3D architectural plans so that spaces can be visualized  
> **Date**: 2026-02-14  
> **Stack**: Three.js `v0.182.0` · React Three Fiber `v9.5.0` · Drei `v10.7.7`

---

## 1. Three.js Supported 3D Formats

### 1.1 Core Loaders (built into `three`)

| Loader | Format | Notes |
|---|---|---|
| `ObjectLoader` | `.json` | Three.js native JSON scene format |
| `BufferGeometryLoader` | `.json` | Geometry-only JSON |
| `MaterialLoader` | `.json` | Material definitions |
| `AnimationLoader` | `.json` | Animation clip data |
| `AudioLoader` | various | Audio files for positional audio |
| `TextureLoader` | `.png/.jpg/.webp` | Standard image textures |
| `CubeTextureLoader` | images | Skybox / environment maps |
| `CompressedTextureLoader` | various | Basis for compressed GPU textures |

### 1.2 Extended Loaders (via `three-stdlib`, bundled with `@react-three/drei`)

Our project already ships all of these through `@react-three/drei`:

| Loader | Extension(s) | Relevance for Architecture |
|---|---|---|
| **GLTFLoader** | `.gltf`, `.glb` | ⭐ **Primary target** — industry standard |
| **FBXLoader** | `.fbx` | ⭐ Common export from Revit / 3ds Max |
| **OBJLoader** + MTLLoader | `.obj`, `.mtl` | Legacy but widely used |
| **ColladaLoader** | `.dae` | Older interchange format |
| **STLLoader** | `.stl` | 3D printing / CAD, no materials |
| **PLYLoader** | `.ply` | Point cloud / scan data |
| **DRACOLoader** | `.drc` | Compressed geometry (used inside GLTF) |
| **3DMLoader** | `.3dm` | Rhino files |
| **3MFLoader** | `.3mf` | 3D manufacturing format |
| **KMZLoader** | `.kmz` | Google Earth / SketchUp |
| **LDrawLoader** | `.ldr` | LEGO CAD (not relevant) |
| **PCDLoader** | `.pcd` | Point cloud data |
| **VRMLLoader** | `.wrl` | Legacy VR format |
| **IFCLoader** | — | Not available natively (needs `web-ifc`) |

> **48 loaders** are available in total through `three-stdlib`.

---

## 2. GLB/GLTF Import — Recommended Approach

### 2.1 Why GLTF/GLB is the Primary Format

| Criteria | GLTF/GLB |
|---|---|
| **Web optimization** | Designed for efficient web delivery |
| **PBR materials** | Full metallic-roughness workflow |
| **Animations** | Skeletal, morph targets, keyframe |
| **Compression** | Draco (geometry), Meshopt, KTX2 (textures) |
| **Ecosystem** | Supported by Blender, Revit, 3ds Max, SketchUp |
| **Binary variant** | `.glb` = single file (textures embedded) |
| **File size** | 30-50% smaller than equivalent FBX |

### 2.2 Import with `@react-three/drei` (already installed)

```jsx
import { useGLTF, Gltf } from '@react-three/drei'

// Hook-based (full control over scene graph)
function ArchitecturalModel({ url }) {
  const { scene, nodes, materials } = useGLTF(url)
  return <primitive object={scene} />
}

// Component-based (simple drop-in)
function SimpleModel({ url }) {
  return <Gltf src={url} />
}
```

### 2.3 With Draco Compression (reduces file size by ~70%)

```jsx
// Draco decoder is loaded from a CDN by default
const { scene } = useGLTF('/model.glb', true) // true = enable Draco

// Or specify custom decoder path
useGLTF.setDecoderPath('/draco/')
```

### 2.4 With Meshopt Compression

```jsx
const { scene } = useGLTF('/model.glb', false, true) // meshopt = true
```

### 2.5 FBX Direct Import (fallback)

```jsx
import { useFBX } from '@react-three/drei'

function FBXModel({ url }) {
  const fbx = useFBX(url)
  return <primitive object={fbx} />
}
```

> [!WARNING]
> FBX direct loading works but has limitations: larger file sizes, inconsistent material mapping, and no built-in compression. **Always prefer GLTF/GLB.**

---

## 3. FBX to GLTF Conversion Tools

### 3.1 Recommended Tools (ranked by suitability)

| Tool | Type | Cost | Best For |
|---|---|---|---|
| **Blender** | Desktop (open-source) | Free | Manual quality control, material fixing |
| **FBX2glTF** | CLI (open-source) | Free | Server-side batch conversion |
| **gltf-pipeline** | CLI / npm | Free | Post-processing GLTF (Draco, optimize) |
| **RapidPipeline** | Cloud / Desktop | Paid | Enterprise-scale automated conversion |
| **Aspose 3D** | Online / API | Freemium | Quick one-off conversions |

### 3.2 Blender Workflow (Recommended for Quality)

```
1. File → Import → FBX (.fbx)
2. Review & fix materials (switch to Principled BSDF if needed)
3. File → Export → glTF 2.0 (.glb/.gltf)
   - Format: GLB (binary, single file)
   - Include: Selected Objects / All
   - Transform: +Y Up
   - Geometry: Apply Modifiers ✓, UVs ✓, Normals ✓
   - Compression: Draco ✓ (reduces size ~70%)
```

### 3.3 FBX2glTF (CLI — for automated pipelines)

```bash
# Install
npm install -g fbx2gltf

# Convert
fbx2gltf --input model.fbx --output model.glb --binary --draco

# With options
fbx2gltf --input model.fbx --output model.glb \
  --binary \
  --draco \
  --keep-attribute position normal texcoord_0
```

### 3.4 gltf-pipeline (post-processing)

```bash
# Install
npm install -g gltf-pipeline

# Add Draco compression to existing GLTF
gltf-pipeline -i model.gltf -o model-compressed.glb -d

# Separate textures (useful for caching)
gltf-pipeline -i model.glb -o model.gltf -s
```

### 3.5 Conversion Comparison

| Factor | Blender | FBX2glTF | Online Tools |
|---|---|---|---|
| Material fidelity | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Automation | ⭐⭐ (scripting) | ⭐⭐⭐⭐⭐ | ⭐ |
| Draco support | ✅ | ✅ | ❌ (usually) |
| Texture handling | Full control | Automatic | Automatic |
| Large files (100MB+) | ✅ | ✅ | ❌ (upload limits) |
| Privacy | ✅ Local | ✅ Local | ❌ Cloud upload |

---

## 4. Format Requirements for Sunspace

### 4.1 Supported Upload Formats

| Priority | Format | Extension | Handling |
|---|---|---|---|
| **Primary** | GLTF Binary | `.glb` | Direct import via `useGLTF` |
| **Primary** | GLTF | `.gltf` + assets | Direct import via `useGLTF` |
| **Secondary** | FBX | `.fbx` | Direct load via `useFBX` or server-side conversion |
| **Secondary** | OBJ + MTL | `.obj` + `.mtl` | Legacy support via `useLoader(OBJLoader)` |
| **Future** | IFC | `.ifc` | Requires `web-ifc-three` (BIM native format) |

### 4.2 Size Limits & Constraints

| Constraint | Recommended Value | Rationale |
|---|---|---|
| Max file size (upload) | **50 MB** | Browser memory / download time |
| Max file size (after Draco) | **15 MB** | Smooth real-time rendering |
| Max polygon count | **500K triangles** | WebGL performance on mid-range devices |
| Texture resolution | **2048×2048 max** | GPU memory budget |
| Texture format | `.jpg`, `.png`, `.webp` | Browser-native decoding |
| Coordinate system | Y-up, meters | Three.js default |

### 4.3 Material Requirements

- Must use **PBR metallic-roughness** workflow (GLTF native)
- Supported maps: `baseColor`, `normal`, `metallicRoughness`, `occlusion`, `emissive`
- Avoid custom shader materials in source files

---

## 5. Format Validation Checklist

Use this checklist when validating 3D model files before upload or after conversion.

### ✅ File-Level Checks

- [ ] File extension is `.glb`, `.gltf`, `.fbx`, or `.obj`
- [ ] File size is under **50 MB**
- [ ] For `.gltf`: all referenced assets (textures, `.bin`) are present
- [ ] For `.obj`: companion `.mtl` file is included (if materials exist)
- [ ] File is not corrupted (valid magic bytes: GLB starts with `0x46546C67`)

### ✅ Geometry Checks

- [ ] Triangle count is under **500,000**
- [ ] No degenerate triangles (zero-area faces)
- [ ] Normals are present and correctly oriented
- [ ] UV coordinates are present (required for textures)
- [ ] Model is centered near origin (no extreme coordinate values)
- [ ] Scale is reasonable (1 unit ≈ 1 meter)

### ✅ Material & Texture Checks

- [ ] Materials use PBR metallic-roughness workflow
- [ ] Textures are power-of-two dimensions (256, 512, 1024, 2048)
- [ ] Texture resolution ≤ **2048×2048**
- [ ] Texture format is `.jpg`, `.png`, or `.webp`
- [ ] No missing texture references

### ✅ Scene Structure Checks

- [ ] Scene hierarchy is clean (no deeply nested empty groups)
- [ ] Object names are meaningful (not `Object001`, `Box087`)
- [ ] No hidden objects that inflate file size
- [ ] Coordinate system is Y-up

### ✅ Performance Checks

- [ ] Model loads in under **3 seconds** on a mid-range device
- [ ] No visible z-fighting (overlapping coplanar faces)
- [ ] Draw calls are under **100** (check with `renderer.info`)
- [ ] Frame rate stays above **30 FPS** when model is displayed

### ✅ Compression Checks (for production)

- [ ] Draco compression is applied for geometry (if GLB)
- [ ] Textures are compressed (`.jpg` for diffuse, `.png` only for alpha)
- [ ] Unused vertices/materials are stripped
- [ ] GLB binary is used instead of GLTF + separate files

---

## 6. Validation Tools

| Tool | Purpose | Usage |
|---|---|---|
| [gltf-validator](https://github.khronos.org/glTF-Validator/) | Official Khronos GLTF validator | Online or npm: `npx gltf-validator model.glb` |
| [model-viewer](https://modelviewer.dev/editor/) | Google's 3D model preview | Drag & drop to test web rendering |
| [three.js editor](https://threejs.org/editor/) | Three.js built-in scene viewer | Import & inspect in browser |
| [gltf.report](https://gltf.report) | Detailed GLTF analysis | File size breakdown, stats |
| [Blender](https://blender.org) | Full 3D inspection | Industry standard for fixing issues |

---

## 7. Implementation Recommendations for US-014

1. **Accept GLB as primary format** — simplest to handle (single binary file, no loose assets)
2. **Add client-side validation** — check file extension, size, and magic bytes before upload
3. **Use `useGLTF` with Draco** — already available in our stack via `@react-three/drei`
4. **Store in Strapi Media Library** — upload GLB files as media assets
5. **Provide conversion guide** — document Blender export settings for admins
6. **Consider server-side validation** — use `gltf-validator` npm package on the backend
7. **Future: FBX auto-conversion** — integrate `fbx2gltf` CLI on server for automatic conversion
