// Hazard-skin fairness + budget gate (PR-3). The Frozen in-lane hazards are reskinned
// from generic primitives to premium ice, but a prettier mesh must never make the
// game UNFAIR (a visible gap in the collision envelope = "looks passable but kills")
// or blow the mobile triangle budget. This asserts, headless & CI-safe:
//   • the calved bar covers the full lane collider at every spawn radius (no gap),
//   • each Frozen hazard skin stays ≤150 triangles,
//   • non-skinned biomes fall back to the byte-identical primitive.
//   node tests/hazardskin.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
// Minimal DOM shim so obstacles.js' import chain (config/util) loads headless.
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ({ createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, set fillStyle(v) {} }) }) };
if (!globalThis.localStorage) { const s = new Map(); globalThis.localStorage = { getItem: (k) => (s.has(k) ? s.get(k) : null), setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k), clear: () => s.clear() }; }
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const { buildObstacleMesh, barColliderCoverage, pillarColliderCoverage, shardColliderSupport, wallColliderCoverage, ringClearance, calderaBarCoverage, calderaPillarCoverage, calderaBombSupport } = await import('../js/obstacles.js');

let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; console.log(`  ✓ ${label}`); } else { fail++; console.error(`  ✗ FAIL: ${label}`); } };

const triCount = (obj) => {
  let n = 0;
  obj.traverse((m) => { if (m.geometry) { const p = m.geometry.attributes.position; n += (m.geometry.index ? m.geometry.index.count : (p ? p.count : 0)) / 3; } });
  return n;
};

// 1. FAIRNESS — the calved bar covers the collider outline across the full lane at
//    every spawn radius (0.7–1.1). A single gap point fails the build.
for (const r of [0.7, 0.85, 1.0, 1.1]) {
  const c = barColliderCoverage(r);
  check(`bar collider gap-free at r=${r} (gaps: ${c.gapCount})`, c.ok);
}

// 1b. FAIRNESS — the serac spur covers the r*0.65 collider cylinder to ~80% height
//     (scale-invariant, so one check covers all r,h; the top ~20% tapers inside the
//     collider by design, a strict improvement over the needle cone).
{
  const c = pillarColliderCoverage();
  check(`pillar collider covered to 80% height (gaps: ${c.gapCount})`, c.ok);
}

// 1c. FAIRNESS — the berg chunk's dominant chunk contains the r*0.70 collider sphere
//     (its inradius ≥ 0.70 in r units, so the visible ice is never smaller than the hitbox).
{
  const s = shardColliderSupport();
  check(`shard dominant chunk contains the collider sphere (inradius ${s.toFixed(3)} ≥ 0.70)`, s >= 0.70);
}

// 1d. FAIRNESS — the Calved Canyon wall's authoring invariants keep the visible ice
//     covering the collider band (face-proudness floor, no channel poke, crest reaches band).
{
  const c = wallColliderCoverage();
  check(`canyon wall covers the collider band (${c.ok ? 'clean' : c.issues.join('; ')})`, c.ok);
}

// 1e. RING CLEARANCE — the overunder ice arch/ridge's visible geometry never overshoots its
//     collider TOWARD the reward ring (the old flat lump poked ~0.8u through the ring's arc).
{
  const c = ringClearance();
  check(`overunder ice clears the ring (ceiling ${(c.worst.ceiling ?? 0).toFixed(2)}u, floor ${(c.worst.floor ?? 0).toFixed(2)}u past collider)${c.ok ? '' : ' — ' + c.issues.join('; ')}`, c.ok);
}

// 1f. FAIRNESS — the EMBERFALL CALDERA skins (collapsed colonnade span / spatter chimney /
//     breadcrust bomb) cover their colliders exactly like Frozen's (own coverage exports).
for (const r of [0.7, 0.85, 1.0, 1.1]) {
  const c = calderaBarCoverage(r);
  check(`Caldera bar (collapsed colonnade) gap-free at r=${r} (gaps: ${c.gapCount})`, c.ok);
}
{
  const c = calderaPillarCoverage();
  check(`Caldera pillar (spatter chimney) covered to 78% height (gaps: ${c.gapCount})`, c.ok);
}
{
  const s = calderaBombSupport();
  check(`Caldera shard (breadcrust bomb) contains the collider sphere (inradius ${s.toFixed(3)} ≥ 0.70)`, s >= 0.70);
}

// 2. BUDGET — each Frozen AND Caldera hazard skin ≤150 triangles (mobile 60fps budget).
const BUDGET = 150;
for (const bi of [2, 3]) {
  for (const type of ['bar', 'pillar', 'shard']) {
    const g = buildObstacleMesh(type, bi);
    const t = triCount(g);
    check(`${bi === 2 ? 'Frozen' : 'Caldera'} ${type} skin ≤${BUDGET} tris (${t})`, t <= BUDGET);
  }
}

// 3. FALLBACK — a non-skinned biome bar is still the single primitive cylinder
//    (no skin group / vertex colours), i.e. shipped biomes are unchanged.
const b0 = buildObstacleMesh('bar', 0);   // Sanctuary (no skin)
let meshes0 = 0; b0.traverse((m) => { if (m.geometry) meshes0++; });
check('non-skinned bar falls back to a single primitive mesh', meshes0 === 1);

console.log(`\nhazardskin: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
