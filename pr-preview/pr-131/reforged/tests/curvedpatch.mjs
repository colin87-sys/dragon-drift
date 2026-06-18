// Headless test of buildCurvedPatch — the curved-membrane surface primitive.
// Asserts a well-formed grid, that it preserves the wing OUTLINE (silhouette
// bbox parity vs the flat ShapeGeometry it replaces), that chordwise billow
// produces a real cup, that the inner/outer split distributes columns across
// each panel's real span range — and, as a regression guard for the reported
// "spoke" artifact, that a panel has NO degenerate (zero-area) triangles and NO
// non-finite normals (the old clamped-column path produced both).
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

// --- inner/outer split distributes columns across each real span range -------
const seam = 3.0;
const inner = buildCurvedPatch(spec, { scaleX, scaleZ, segU, segV, spanStart: 0, spanEnd: seam });
inner.computeBoundingBox();
near(inner.boundingBox.max.x, seam, 0.05, 'inner panel ends at the wrist seam (spanEnd)');
const outer = buildCurvedPatch(spec, { scaleX, scaleZ, segU, segV, spanStart: seam, originX: seam });
outer.computeBoundingBox();
near(outer.boundingBox.min.x, 0, 0.05, 'outer panel re-origined to the seam (min x → 0)');
ok('inner/outer split distributes columns across each real span range');

// --- regression guard: no degenerate triangles / NaN normals -----------------
// The clamped-column path piled grid columns onto one x → zero-area triangles
// whose normals went haywire (the "spokes" sticking toward the body) and a
// doubled strip at the wrist (the janky overlap). A span-bounded grid must not.
function triStats(geo) {
  const pos = geo.attributes.position, idx = geo.index;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const ab = new THREE.Vector3(), ac = new THREE.Vector3();
  let degenerate = 0;
  for (let i = 0; i < idx.count; i += 3) {
    a.fromBufferAttribute(pos, idx.getX(i));
    b.fromBufferAttribute(pos, idx.getX(i + 1));
    c.fromBufferAttribute(pos, idx.getX(i + 2));
    const area = 0.5 * ab.subVectors(b, a).cross(ac.subVectors(c, a)).length();
    if (area < 1e-6) degenerate++;
  }
  const nrm = geo.attributes.normal; let badN = 0;
  for (let i = 0; i < nrm.count; i++) {
    if (!Number.isFinite(nrm.getX(i)) || !Number.isFinite(nrm.getY(i)) || !Number.isFinite(nrm.getZ(i))) badN++;
  }
  return { degenerate, badN };
}
// A non-tip panel (chord never collapses) must be entirely non-degenerate.
const sInner = triStats(inner);
assert(sInner.degenerate === 0, `inner panel: no degenerate triangles (found ${sInner.degenerate})`);
assert(sInner.badN === 0, `inner panel: all normals finite (found ${sInner.badN} bad)`);
// The outer panel runs to the natural tip taper, but normals must still be finite.
assert(triStats(outer).badN === 0, 'outer panel: all normals finite');
ok('no degenerate triangles or NaN normals (the spoke/overlap artifact is gone)');

console.log(`\n${n} curvedpatch checks passed.`);
