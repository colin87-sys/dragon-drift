// PROPS-IN-LANE rock run (strait2) — the headless CI gate from
// ROCKRUN-STRAIT-HANDOFF.md: on REAL generated Frozen split sections with the
// strait2 flag on, assert
//   (a) every prop mass's world bounding-box top ≤ the deck-skim sightline cap
//       (RUN_KIT.frozen.heightCapY) — THE HARD RULE that kills the tall-pillar
//       failure on every slice, decoupled from ring altitude;
//   (b) each collider box under-fits its prop's visual world AABB (what looks
//       passable is passable) and never intrudes on the audited li/ri channel
//       (center gold lead clear by construction);
//   (c) prop tri total per section stays inside the mobile budget;
//   (d) determinism: rebuilding the same segment yields identical colliders
//       (the canyonRnd stream is untouched — same seed, same run).
import { register } from 'node:module';
register(new URL('../tools/three-resolver.mjs', import.meta.url).href, import.meta.url);

const ctx2d = {
  createRadialGradient: () => ({ addColorStop() {} }),
  createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, strokeRect() {},
  beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {},
  fill() {}, stroke() {},
  set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {},
  set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {},
};
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
if (!globalThis.removeEventListener) globalThis.removeEventListener = () => {};
globalThis.document = {
  hidden: false, addEventListener() {}, removeEventListener() {},
  createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }),
};
if (!globalThis.localStorage) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}
// The strait2 flag is read from location.search at build time — set it BEFORE import.
globalThis.location = { search: '?strait2=1', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const THREE = await import('three');
const { CONFIG } = await import('../js/config.js');
// Rock is DISABLED in shipping play (config rock:0); force the pre-disable mixed
// weight so this gate can still sample real Frozen split runs to build props in.
CONFIG.canyonTypeWeights = { rock: 35, spine: 35, flow: 30 };
const { initObstacles, addCanyonSegment, RUN_KIT } = await import('../js/obstacles.js');
const { rockSlicePlan } = await import('../js/canyonMath.js');
const { biomeIndexAt } = await import('../js/biomes.js');
const { createLevelGen } = await import('../js/level.js');

let passed = 0, failed = 0;
const ok = (m) => { passed++; console.log('  \x1b[32m ok \x1b[0m ' + m); };
const bad = (m) => { failed++; console.log('  \x1b[31mFAIL\x1b[0m ' + m); };
const check = (cond, m) => (cond ? ok(m) : bad(m));

// Collect real Frozen split segments over a chunked walk (canyonflow pattern).
const segs = [];
for (const seed of [1337, 424242, 271828, 8, 9]) {
  const gen = createLevelGen(seed);
  for (let d = 800; d <= 24000; d += 800) {
    for (const s of gen.ensure(d).canyonSegments) {
      if (s.kind === 'split' && biomeIndexAt(s.dist) === 2) segs.push(s);
    }
  }
}
// Frozen split sections are rare (biome cycle × run-kind scheduling) — 3 real
// sections ≈ 30+ prop instances, plenty for the geometric invariants below.
check(segs.length >= 3, `collected ${segs.length} Frozen split sections across seeds`);

const KIT = RUN_KIT.frozen;
const build = (seg) => {
  const captured = [];
  initObstacles({ add: (o) => captured.push(o), remove() {} });
  const e = addCanyonSegment(seg);
  const props = [];
  e.object.traverse((m) => { if (m.isMesh && m.geometry && m.geometry.getAttribute('aoBake')) props.push(m); });
  return { e, props };
};

let worstTop = -Infinity, worstIntrude = -Infinity, worstCover = Infinity;
let totalProps = 0, worstTris = 0, picketBad = 0;
for (const seg of segs.slice(0, 12)) {
  const { e, props } = build(seg);
  const plan = rockSlicePlan(seg);
  totalProps += props.length;
  let tris = 0;
  // buildPropRun emits mesh+box pairs in lockstep; split sections add no other boxes.
  check(e.boxes.length === props.length, `section@${seg.dist}: ${props.length} props, 1 collider each`);
  for (let i = 0; i < props.length; i++) {
    const m = props[i], b = e.boxes[i];
    m.geometry.computeBoundingBox();
    const bb = m.geometry.boundingBox;
    // (a) world top: rotY never changes Y; world y = pos.y + bbmax.y * scale.y
    worstTop = Math.max(worstTop, m.position.y + bb.max.y * m.scale.y);
    // (b) collider ⊆ visual: vertical containment exact; horizontal worst-case uses
    // the rotY-invariant radial reach (visual world XZ AABB ≥ ±hExt is NOT guaranteed
    // under rotation for the *tight* axis, so require box diag ≤ radial reach).
    const rad = Math.hypot(Math.max(Math.abs(bb.min.x), bb.max.x), Math.max(Math.abs(bb.min.z), bb.max.z)) * m.scale.x;
    worstCover = Math.min(worstCover,
      Math.min(rad - Math.hypot(b.hw, b.hz),
               (m.position.y + bb.max.y * m.scale.y) - (b.cy + b.hh)));
    // (b) channel: the collider's inner face stays outside the audited li/ri at its z.
    let s0 = plan.slices[0];
    for (const s of plan.slices) if (Math.abs(-s.z - b.oz) < Math.abs(-s0.z - b.oz)) s0 = s;
    const intrude = b.cx > (s0.li + s0.ri) / 2 ? s0.ri - (b.cx - b.hw) : (b.cx + b.hw) - s0.li;
    worstIntrude = Math.max(worstIntrude, intrude);
    const p = m.geometry.getAttribute('position');
    tris += Math.round((m.geometry.index ? m.geometry.index.count : p.count) / 3);
  }
  worstTris = Math.max(worstTris, tris);
  // anti-picket: adjacent same-side props never share a geometry (weak family proxy
  // is exact here because families map 1:1 to geometries within a section cache).
  const bySide = { L: [], R: [] };
  for (const m of props) bySide[m.position.x < seg.gapX ? 'L' : 'R'].push(m);
  for (const side of ['L', 'R']) {
    const arr = bySide[side].sort((a, c) => a.position.z - c.position.z);
    for (let i = 1; i < arr.length; i++) if (arr[i].geometry === arr[i - 1].geometry) picketBad++;
  }
}
check(totalProps > 0, `props actually emitted (${totalProps} across ${Math.min(segs.length, 12)} sections)`);
check(worstTop <= KIT.heightCapY + 1e-6, `HARD RULE: every mass top ≤ sightline cap y${KIT.heightCapY} (worst ${worstTop.toFixed(2)})`);
check(worstCover >= 0, `collider under-fits visual on every prop (worst margin ${worstCover.toFixed(2)}u)`);
check(worstIntrude <= 1e-6, `no collider intrudes on the audited li/ri channel (worst ${worstIntrude.toFixed(2)}u)`);
check(worstTris <= 8000, `prop tris per section ≤ 8000 (worst ${worstTris})`);
check(picketBad === 0, `anti-picket: no two adjacent same-side props share a silhouette (${picketBad} violations)`);

// (d) determinism — same segment, byte-identical colliders.
const A = build(segs[0]).e.boxes, B = build(segs[0]).e.boxes;
check(JSON.stringify(A) === JSON.stringify(B), 'deterministic: identical colliders on rebuild');

// Tightness rhythm: crowding between rings vs the ring plane (open trough).
{
  let near = 0, far = 0;
  for (const seg of segs.slice(0, 12)) {
    const { e } = build(seg);
    for (const b of e.boxes) (Math.abs(b.oz) < 18 ? near++ : far++);
  }
  check(far > near, `breath is phase-locked: more props between rings than at the ring plane (${far} vs ${near})`);
}

console.log(`\nproprun: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
