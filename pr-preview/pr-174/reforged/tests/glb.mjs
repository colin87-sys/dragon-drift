// Headless GLB integrity + triangle-budget check for committed dragon assets.
//
// The roster is otherwise 100% procedural; the asset-backed experiment (the
// `aether` dragon) ships a real .glb under assets/models/. There is NO WebGL in
// CI, so this validates the file the only way we can without a renderer: parse
// the glTF 2.0 binary container by hand, walk the JSON chunk, and sum the
// triangle count across every mesh primitive. It asserts each file is a valid
// GLB and stays under a (generous) experiment ceiling, and LOGS the real tris +
// byte size so the cost of going asset-based is always on the record.
//
//   node tests/glb.mjs            validate every assets/models/*.glb
//
// Exit non-zero on a malformed container or an over-ceiling mesh.

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const modelsDir = join(here, '..', 'assets', 'models');

// Generous ceiling — this is an EXPERIMENT branch; AI meshes run large and the
// point is to measure, not to gate hard. Bump knowingly if a real asset needs it.
const TRI_CEILING = 300000;

function fail(msg) { console.error(`glb: FAIL — ${msg}`); process.exit(1); }

if (!existsSync(modelsDir)) {
  console.log('glb: no assets/models/ dir — nothing to validate (OK).');
  process.exit(0);
}

const files = readdirSync(modelsDir).filter((f) => f.endsWith('.glb')).sort();
if (!files.length) {
  console.log('glb: no .glb files in assets/models/ — nothing to validate (OK).');
  process.exit(0);
}

// Triangles for one primitive: indexed → indices/3, else POSITION count/3.
// mode (default 4 = TRIANGLES) is respected for the common strip/fan cases.
function primTris(prim, accessors) {
  const mode = prim.mode ?? 4;
  const idxAcc = prim.indices != null ? accessors[prim.indices] : null;
  const posAcc = prim.attributes && prim.attributes.POSITION != null ? accessors[prim.attributes.POSITION] : null;
  const n = idxAcc ? idxAcc.count : (posAcc ? posAcc.count : 0);
  if (mode === 4) return n / 3;             // TRIANGLES
  if (mode === 5 || mode === 6) return Math.max(0, n - 2); // STRIP / FAN
  return 0;                                 // points/lines contribute no tris
}

let totalOver = 0;
for (const file of files) {
  const path = join(modelsDir, file);
  const buf = readFileSync(path);
  const bytes = statSync(path).size;

  // --- GLB header: magic 'glTF', version 2, total length ---
  if (buf.length < 12) fail(`${file}: too small to be a GLB`);
  if (buf.readUInt32LE(0) !== 0x46546c67) fail(`${file}: bad magic (not 'glTF')`);
  if (buf.readUInt32LE(4) !== 2) fail(`${file}: unsupported glTF version (need 2)`);
  const total = buf.readUInt32LE(8);
  if (total !== buf.length) fail(`${file}: header length ${total} != file size ${buf.length}`);

  // --- first chunk must be JSON (type 0x4E4F534A) ---
  const c0len = buf.readUInt32LE(12);
  const c0type = buf.readUInt32LE(16);
  if (c0type !== 0x4e4f534a) fail(`${file}: first chunk is not JSON`);
  let gltf;
  try {
    gltf = JSON.parse(buf.slice(20, 20 + c0len).toString('utf8'));
  } catch (e) {
    fail(`${file}: JSON chunk did not parse — ${e.message}`);
  }
  if (!gltf.asset || gltf.asset.version !== '2.0') fail(`${file}: asset.version must be '2.0'`);

  const accessors = gltf.accessors || [];
  let tris = 0;
  for (const mesh of gltf.meshes || []) {
    for (const prim of mesh.primitives || []) tris += primTris(prim, accessors);
  }
  tris = Math.round(tris);
  const meshN = (gltf.meshes || []).length;
  const skinned = (gltf.skins || []).length > 0;
  const animN = (gltf.animations || []).length;

  const ok = tris <= TRI_CEILING;
  if (!ok) totalOver++;
  console.log(
    `glb: ${file.padEnd(24)} ${String(tris).padStart(8)} tris  ` +
    `${(bytes / 1024).toFixed(0).padStart(6)} KB  meshes=${meshN}  ` +
    `skinned=${skinned ? 'yes' : 'no'}  anims=${animN}  ${ok ? 'OK' : `OVER ${TRI_CEILING}`}`
  );
}

if (totalOver > 0) fail(`${totalOver} asset(s) over the ${TRI_CEILING}-tri ceiling`);
console.log(`glb: ${files.length} asset(s) valid.`);
