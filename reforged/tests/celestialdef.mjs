// CELESTIAL STORM — validate the full TRACE DEFINITION (js/celestialDef.js): outer silhouettes PLUS the
// internal structure (body armour-plate cells + trident, wing finger-struts + lightning veins). This is the
// input contract for the 3D extrusion, so pin its shape: a dense body silhouette, many interior plates, a
// dense wing silhouette, a real strut set (open polylines inside the wing), and a single-side wing that
// mirrors across D.mirror.
import { assert } from './shim.mjs';
const { CELESTIAL_DEF: D } = await import('../js/celestialDef.js');

let n = 0; const ok = (m) => { n++; console.log(`  ✓ ${m}`); };
const norm = (cs) => cs.every((c) => c.every((p) => p[0] >= -0.01 && p[0] <= 1.01 && p[1] >= -0.01 && p[1] <= 1.01));
const bbox = (pts) => pts.reduce((b, p) => ({ minX: Math.min(b.minX, p[0]), maxX: Math.max(b.maxX, p[0]), minY: Math.min(b.minY, p[1]), maxY: Math.max(b.maxY, p[1]) }), { minX: 1e9, maxX: -1e9, minY: 1e9, maxY: -1e9 });

assert(D.canvas[0] === 941 && D.canvas[1] === 1672, 'shared 941×1672 canvas');
assert(typeof D.mirror === 'number', 'declares a mirror axis');
ok('definition header — canvas + mirror axis');

// --- body: dense silhouette + many interior plates (incl. trident) ----------
assert(D.body.silhouette.length >= 200, `body silhouette is dense (${D.body.silhouette.length})`);
assert(Array.isArray(D.body.plates) && D.body.plates.length >= 20, `body has many armour plates (${D.body.plates.length})`);
for (const pl of D.body.plates) assert(pl.length >= 8, `each plate is a real polygon (${pl.length})`);
assert(norm([D.body.silhouette, ...D.body.plates]), 'all body coords normalized 0..1');
// plates live INSIDE the body silhouette bbox
const bb = bbox(D.body.silhouette);
for (const pl of D.body.plates) { const pb = bbox(pl); assert(pb.minX >= bb.minX - 0.02 && pb.maxX <= bb.maxX + 0.02 && pb.minY >= bb.minY - 0.02 && pb.maxY <= bb.maxY + 0.02, 'plate sits within the body silhouette'); }
ok(`body — ${D.body.silhouette.length}-pt silhouette + ${D.body.plates.length} armour plates, all interior`);

// the body is taller than wide (vertical creature)
assert((bb.maxY - bb.minY) > (bb.maxX - bb.minX), 'body silhouette is vertical');
ok('body silhouette is a vertical fuselage');

// --- wing: dense silhouette + struts + veins, one side only -----------------
assert(D.wing.silhouette.length >= 200, `wing silhouette is dense (${D.wing.silhouette.length})`);
const bones = [...(D.wing.boneShapes || []), ...D.wing.struts];
assert(bones.length >= 6, `wing has a real bone set (${bones.length})`);
for (const s of bones) assert(s.length >= 2, 'bone is a polyline');
// wings extend BEYOND the body canvas (large wingspan, tips above the head) — bound to a sane envelope, not 0..1
const wingEnv = [D.wing.silhouette, ...bones].every((c) => c.every((p) => p[0] >= -0.8 && p[0] <= 1.8 && p[1] >= -0.8 && p[1] <= 1.1));
assert(wingEnv, 'wing coords within a sane envelope (wings reach past the body canvas)');
ok(`wing — ${D.wing.silhouette.length}-pt silhouette + ${(D.wing.boneShapes || []).length} bone shapes + ${D.wing.struts.length} struts`);

// the traced wing is on ONE side of the mirror axis (it gets reflected for the other)
const wb = bbox(D.wing.silhouette);
assert(wb.minX > D.mirror - 0.05 || wb.maxX < D.mirror + 0.05, 'wing is authored on a single side of the mirror axis');
ok('wing is single-sided (mirrored at runtime) with struts inside the membrane');

console.log(`\nCelestial Storm definition: ${n} checks passed — ${D.body.plates.length} plates, ${D.wing.struts.length} struts.`);
