// creatureGenome.js — the GENOME: a continuous, topology-free description of a
// creature (skeleton + per-station volume + an appendage LIST of any count).
//
// This is the authoring surface proposed in CREATURE-SYSTEM-REDESIGN.md. Unlike
// the shipped recipe path (pick prefab modules + turn ~40 scalar dials), a genome
// describes a creature as DATA an optimizer can fully adjust:
//   • spine    — cross-sections in body space, each with inline volume (w,h,sq).
//                Editing this list IS sculpting the silhouette (the thing the old
//                grammar never exposed).
//   • limbs    — arbitrary 3D bone chains attached to a spine joint (mirror-aware).
//   • appendages — a LIST of any count/kind (membrane, leg, horns, ridge…), each
//                referencing a limb or the spine. THIS is topology-as-data: "two
//                wings" vs "six legs + a frill + no wings" is just a different list,
//                not a different code path.
//
// Pure data + small math — NO three import — so it is trivially unit-testable and
// the same genome builds at any tessellation (detail is a separate axis).
//
// NOTE: the illustrative JSON in CREATURE-SYSTEM-REDESIGN.md §4 keeps `volume` in a
// separate block for authoring clarity; this POC inlines w/h/sq into each spine
// joint, which is the same information in a leaner shape.

// ── cross-section: a super-ellipse ring ──────────────────────────────────────
// squareness 0 → circle (round belly), 1 → boxy (mecha/armoured). Returns CCW
// control points [x,y] (top = +y first), the format sweepProfileSmooth's `ring`
// callback expects. Width scales x; top/bot scale y above/below the centreline.
const RING_N = 16;
export function superEllipseRing(w, top, bot) {
  // caller bakes squareness into `ex` via ringFactory; default fuller-than-circle.
  return superEllipseRingEx(w, top, bot, 2.3);
}
export function ringFactory(squareness = 0.2) {
  const ex = 2 + Math.max(0, Math.min(1, squareness)) * 6; // 2=round … 8=boxy
  return (w, top, bot) => superEllipseRingEx(w, top, bot, ex);
}
function superEllipseRingEx(w, top, bot, ex) {
  const pts = [];
  const shape = (c) => Math.sign(c) * Math.pow(Math.abs(c), 2 / ex);
  for (let i = 0; i < RING_N; i++) {
    const a = (i / RING_N) * Math.PI * 2 + Math.PI / 2; // i=0 → +y (keel top), CCW
    const sx = shape(Math.cos(a)), sy = shape(Math.sin(a));
    pts.push([sx * w, sy * (sy >= 0 ? top : bot)]);
  }
  return pts;
}

// ── mirror helpers ───────────────────────────────────────────────────────────
const negX = (p) => [-p[0], p[1], p[2]];
const swapLR = (id) => id.replace(/L$/, 'R'); // 'wingL' → 'wingR'

// Resolve a raw genome into a fully-expanded one: mirrored limbs/appendages
// materialised, every appendage carrying its resolved attach point + limb chain.
// Idempotent-ish: safe to call once before building.
export function normalizeGenome(raw) {
  const g = JSON.parse(JSON.stringify(raw));
  const jointById = new Map((g.spine || []).map((j) => [j.id, j.p]));

  // 1) expand mirrored limbs (mirror: 'wingL' → x-negated copy named 'wingR').
  const limbs = [];
  const limbById = new Map();
  for (const l of g.limbs || []) {
    let limb = l;
    if (l.mirror) {
      const src = (g.limbs || []).find((x) => x.id === l.mirror);
      if (!src) throw new Error(`genome: limb mirror '${l.mirror}' not found`);
      limb = { id: l.id || swapLR(src.id), from: src.from, chain: src.chain.map(negX), r: src.r };
    }
    limbs.push(limb);
    limbById.set(limb.id, limb);
  }
  g.limbs = limbs;

  // 2) expand mirrored appendages and resolve each to its attach context.
  const appendages = [];
  for (const a of g.appendages || []) {
    let ap = a;
    if (a.mirror) {
      const src = (g.appendages || []).find((x) => x.id === a.mirror);
      if (!src) throw new Error(`genome: appendage mirror '${a.mirror}' not found`);
      ap = { ...src, id: a.id || (src.id ? swapLR(src.id) : undefined), on: swapLR(src.on) };
    }
    // resolve attach context: a limb chain, or the spine / a spine joint.
    if (ap.on === 'spine' || jointById.has(ap.on)) {
      ap._spine = g.spine;            // dorsal/cranial decoration rides the spine
    } else {
      const limb = limbById.get(ap.on);
      if (!limb) throw new Error(`genome: appendage on '${ap.on}' — no such limb`);
      ap._from = jointById.get(limb.from) || [0, 0, 0];
      ap._chain = limb.chain;
      ap._radii = limb.r;
    }
    appendages.push(ap);
  }
  g.appendages = appendages;
  return g;
}

// ── genome → loft profile ────────────────────────────────────────────────────
// Convert the spine (joints + inline volume) into the { stations, zHold, ring,
// longSamples } profile that dragonSweep.sweepProfileSmooth consumes. Each station
// is [z, halfWidth, keelTop, belly, cy, cx]: width/height from the joint's volume,
// and (cx,cy) = the joint's (x,y) so the centreline BENDS (lifted head, curved
// tail) instead of a straight z-axis loft. This is the move that makes the
// silhouette authorable data instead of hard-coded builder geometry.
export function genomeToProfile(g) {
  const spine = [...g.spine].sort((a, b) => a.p[2] - b.p[2]); // head −Z → tail +Z
  const sq = spine.reduce((s, j) => s + (j.sq ?? 0.2), 0) / spine.length;
  const stations = spine.map((j) => {
    const top = j.h * (j.keel ?? 1.0);
    const bot = j.h * (j.belly ?? 0.95);
    return [j.p[2], j.w, top, bot, j.p[1], j.p[0]]; // z, w, keelTop, belly, cy, cx
  });
  return {
    stations,
    zHold: stations[stations.length - 1][0], // no after-body stretch in the POC
    ring: ringFactory(sq),
    longSamples: spine.length * 3,
  };
}

// tiny hex → {r,g,b} (0..1) for materials, no three dependency.
export function hexToRGB(hex) {
  const h = parseInt(String(hex).replace('#', ''), 16);
  return { r: ((h >> 16) & 255) / 255, g: ((h >> 8) & 255) / 255, b: (h & 255) / 255 };
}

// ── a sample genome: a reference-style wyvern ────────────────────────────────
// Two membrane wings + two trailing legs + a horn pair + a dorsal ridge — authored
// purely as data. No builder was written for it; buildFromGenome renders it from
// the four primitives.
export const SAMPLE_WYVERN = Object.freeze({
  name: 'Ref-Wyvern',
  spine: [
    { id: 'snout', p: [0, 0.30, -1.6], w: 0.06, h: 0.07, sq: 0.2 },
    { id: 'head',  p: [0, 0.48, -1.2], w: 0.26, h: 0.28, sq: 0.3 },
    { id: 'chest', p: [0, 0.32, -0.4], w: 0.60, h: 0.56, sq: 0.25 }, // barrel chest
    { id: 'waist', p: [0, 0.28,  0.3], w: 0.36, h: 0.40, sq: 0.3 },  // pinch
    { id: 'hip',   p: [0, 0.26,  0.7], w: 0.42, h: 0.42, sq: 0.3 },  // haunch flare
    { id: 'tail',  p: [0, 0.14,  1.8], w: 0.04, h: 0.05, sq: 0.2 },
  ],
  limbs: [
    { id: 'wingL', from: 'chest', chain: [[0.35, 0.5, -0.3], [1.5, 1.0, 0.1], [2.5, 0.85, 0.5]], r: [0.07, 0.045, 0.02] },
    { id: 'wingR', mirror: 'wingL' },
    { id: 'legL',  from: 'hip',   chain: [[0.3, 0.0, 0.7], [0.42, -0.55, 0.8], [0.5, -0.95, 0.7]], r: [0.12, 0.08, 0.05] },
    { id: 'legR',  mirror: 'legL' },
  ],
  appendages: [
    { id: 'wL', on: 'wingL', kind: 'membrane', chord: 0.9 },
    { id: 'wR', mirror: 'wL' },
    { on: 'legL', kind: 'leg' },
    { on: 'legR', kind: 'leg' },
    { on: 'head', kind: 'horns', pairs: 2, len: 0.5, splay: 0.5 },
    { on: 'spine', kind: 'ridge', from: 'chest', to: 'hip', count: 12, height: 0.16 },
  ],
  surface: { material: { metalness: 0.0, roughness: 0.85 } },
  palette: { body: '#2A2D33', belly: '#3A3F47', membrane: '#20242B', eye: '#8FEAFF', accent: '#5BC8FF' },
});
