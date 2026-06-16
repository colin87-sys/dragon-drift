// Headless test of buildCurvedPatch — the curved-membrane surface primitive.
// Asserts a well-formed grid (verts/index/normals), that it preserves the wing
// OUTLINE (silhouette bbox parity vs the flat ShapeGeometry it replaces), and
// that the wrist CLIP collapses out-of-panel columns onto the seam.
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert } from './shim.mjs';
const THREE = await import('three');
const { buildCurvedPatch, buildWingShape, WING_FORMS } = await import('../js/dragonParts.js');

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };
const near = (a, b, eps, msg) => assert(Math.abs(a - b) <= eps, `${msg} (${a.toFixed(3)} ~ ${b.toFixed(3)} ±${eps})`);

const spec = WING_FORMS[2];                 // a mid form with a real elbow + scallops
const segU = 16, segV = 6, scaleX = 1.34, scaleZ = 1;

const g = buildCurvedPatch(spec, { scaleX, scaleZ, k: 1, billow: 0.12, segU, segV });

// --- grid shape -------------------------------------------------------------
assert(g.attributes.position.count === (segU + 1) * (segV + 1), 'vertex count = (segU+1)*(segV+1)');
assert(g.index.count === segU * segV * 6, 'index count = segU*segV*6 (two tris per cell)');
assert(!!g.attributes.normal, 'smooth normals computed');
ok('curved patch is a well-formed (segU×segV) indexed grid with normals');

// --- silhouette parity vs the flat ShapeGeometry it replaces -----------------
const flat = new THREE.ShapeGeometry(buildWingShape(spec), 14);
flat.rotateX(-Math.PI / 2);
flat.scale(scaleX, 1, scaleZ);
flat.computeBoundingBox();
g.computeBoundingBox();
const fb = flat.boundingBox, cb = g.boundingBox;
near(cb.max.x, fb.max.x, 0.06, 'span (max x) matches the flat membrane');
near(cb.min.z, fb.min.z, 0.12, 'chord depth (min z) matches the flat membrane');
near(cb.max.z, fb.max.z, 0.12, 'chord front (max z) matches the flat membrane');
ok('curved patch preserves the wing silhouette (bbox parity with the flat sheet)');

// billow lifts the surface in Y above the pure span arc (a real chord cup exists)
let maxY = -1e9; const p = g.attributes.position;
for (let i = 0; i < p.count; i++) maxY = Math.max(maxY, p.getY(i));
assert(maxY > 0.05, 'chordwise billow produces positive height (a cup, not a flat sheet)');
ok('chordwise billow present (surface is double-curved, not a bent flat sheet)');

// --- wrist clip collapses outboard columns onto the seam --------------------
const seam = 3.0;
const inner = buildCurvedPatch(spec, { scaleX, scaleZ, segU, segV, clipMax: seam });
inner.computeBoundingBox();
near(inner.boundingBox.max.x, seam, 0.001, 'clipMax collapses the inner panel at the wrist seam');
const outer = buildCurvedPatch(spec, { scaleX, scaleZ, segU, segV, clipMin: seam, originX: seam });
outer.computeBoundingBox();
near(outer.boundingBox.min.x, 0, 0.001, 'outer panel re-origined to the seam (min x → 0)');
ok('inner/outer wrist split shares the seam (clip + re-origin)');

console.log(`\n${n} curvedpatch checks passed.`);
