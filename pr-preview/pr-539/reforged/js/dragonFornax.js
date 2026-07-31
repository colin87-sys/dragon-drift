// FORNAX — "The banked furnace" (I1: the char-plate anvil; wings/head/tail still stubbed)
//
// The roster's fire wyvern. Build sheet: reforged/FIRE-WYVERN-BUILDSHEET.md.
// Structural ranges it cites: reforged/DRAGON-ANATOMY-REFERENCE.md.
//
// BUILD STATE
//   I0 ✔ coexist + rig conventions (3-segment wing cascade with −anchor + OUTER lmirror wrapper,
//        nested isBone tail, legs as a torso-internal helper — there is no registerLegs).
//   I1 ✔ THIS INCREMENT — slagAnvilTorso becomes the real char-plate anvil: a forward-massed
//        forged hull with a four-tier value ladder, a lava-lake seam network carved as UNLIT
//        recessed channels, a shallow-S neck loft, and the abducted emberHaunch leg chains.
//        The ATTACH CONTRACT is now full-surface and FREEZES here — I3's head/tail mount through it.
//   I2   the hero wing (low taut crescent + THE NOTCH FLOOR) and the flap.
//   I3   brandSkull / firebrandTail craft.
//   I4   THE STOKE — the first light this creature ever emits.
//
// ⚠ NOTHING IN THIS FILE EMITS. The identity is WITHHELD light: the seams are shadow at I1 and
// only ignite at I4. One emissive pixel here would be the LED-strip tell shipping before the
// creature does. Every dial is nullable + DEFAULT-OFF; only the `fornax` def opts in, so the
// shipped roster builds byte-identically (proved by diffing tricount, not asserted by comment).

import * as THREE from 'three';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

const TORSO_Y = 0.2;   // house constant — the torso mesh sits at y=0.2 and spine math adds it in

// --- I2/I3 blockout helper ---------------------------------------------------
// A flat-shaded box. Named so a reader never mistakes stub geometry for authored form.
// The TORSO no longer uses this; the wing/head/tail stubs still do until I2/I3 replace them.
function blockout(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }

// --- THE SLAG PROFILE --------------------------------------------------------
// A fixed-polygon cross-section, shared by every loft station. This is what kills the
// "stacked rings" failure BY CONSTRUCTION (DRAGON-DESIGN §2.11): because every station uses the
// same column count, each facet COLUMN becomes a continuous longitudinal strake running the
// length of the hull, and the longitudinal grain dominates any faint transverse station edge.
//
// The shape is a HEAT-SHIELD, deliberately not Vesper's knapped-glass chine: a broad flat dorsal
// DECK (plates lie flat on top, where the rear-high camera sees them), a hard shoulder bevel, a
// wide lateral chine at mid-height, and a tucked belly. Smooth plates between seams — never
// struck flakes, which is Vesper's lane.
const SLAG_PROFILE = [
  [0.22, 0.98],    // k0  dorsal deck  (R of midline)
  [0.62, 0.80],    // k1  shoulder bevel R
  [0.96, 0.34],    // k2  chine apex R — the widest line, and a gen-1 seam runs it
  [0.80, -0.28],   // k3  lower flank R
  [0.38, -0.86],   // k4  belly R
  [-0.38, -0.86],  // k5  belly L
  [-0.80, -0.28],  // k6  lower flank L
  [-0.96, 0.34],   // k7  chine apex L
  [-0.62, 0.80],   // k8  shoulder bevel L
  [-0.22, 0.98],   // k9  dorsal deck L
];

// Per-COLUMN value banding. The area census (director's target 3) falls out of which columns get
// which tier: the two chine + two lower-flank columns are the largest, so they carry the darkest
// char (~55-60%); the belly and shoulder bevels carry the scorch mid (~28%); the narrow dorsal
// deck carries the ash-lit facet (~12%) where top-light actually lands.
// `i` is the station index, so a tier can vary ALONG the body as well as around it. Round 2 keyed
// only on the column, which made the dorsal deck one uninterrupted ash-lit strake nose-to-tail —
// all the creature's brightness pooled into a single continuous band that read as a polished
// sheet-metal stripe rather than as lit PLATES. Breaking the deck into discrete lit patches is
// what turns a highlight into a plate field.
//
// The break pattern is a deterministic index hash, never `Math.random` (a build must be
// reproducible frame to frame), and it is deliberately UNEVEN — an alternating on/off would be
// the picket-fence tell in value instead of in geometry.
// ⚠ THE ONE SANCTIONED INDEX PICK (§4b RL3). Every other index-keyed material selector in this
// module was camouflage and has been deleted; this one survives because it is a DUTY BREAK, not a
// scatter: it only ever steps ONE tier DARKER (deck ashLit→scorch, bevel scorch→char), never
// brighter and never two tiers. Direction is the whole law — stepping field-ward reads as shadow
// and wear, stepping bright-ward is the confetti tell.
//
// Retuned v2.2: the old `((i*7+3)%5)<3` gave the period-5 pattern F,T,T,F,T — lit runs of 2 AND 1,
// so it violated RL3's own min-lit-run≥2 bound (the audit asserted it complied; computing it showed
// otherwise). `((i*2+1)%7)<4` gives period 7, duty 12/21, lit runs uniformly 2 with 1-2 dark
// between — irregular period, no singletons, and still breaks the pooled deck strake that keying
// on column alone produced.
function slagBand(M, k, i = 0) {
  const lit = ((i * 2 + 1) % 7) < 4;
  if (k === 0 || k === 9) return lit ? M.ashLit : M.scorch;   // dorsal deck — broken lit plates
  if (k === 1 || k === 8) return lit ? M.scorch : M.char;     // shoulder bevel picks up the break
  if (k === 4 || k === 5) return M.scorch;                    // belly — lifted so it never crushes to black
  return M.char;                                              // chine + lower flank — the dark field
}

// --- The fixed-polygon loft --------------------------------------------------
// Stations are {z, rx, ry, cy}; the profile is scaled per station. Triangles are batched BY
// MATERIAL (one mesh per tier) so four value tiers cost four draw calls, not four per station.
function slagLoft(stations, profile, matFor, cap = true) {
  const N = profile.length;
  const P = (s, k) => [profile[k][0] * s.rx, s.cy + profile[k][1] * s.ry, s.z];
  const byMat = new Map();
  const push = (mat, ...tris) => { let a = byMat.get(mat); if (!a) byMat.set(mat, a = []); for (const t of tris) a.push(t); };
  for (let i = 0; i < stations.length - 1; i++) {
    const a = stations[i], b = stations[i + 1];
    for (let k = 0; k < N; k++) {
      const k1 = (k + 1) % N;
      push(matFor(k, i), [P(a, k), P(b, k1), P(b, k)], [P(a, k), P(a, k1), P(b, k1)]);
    }
  }
  if (cap) {
    const f = stations[0], l = stations[stations.length - 1];
    const fc = [0, f.cy, f.z], lc = [0, l.cy, l.z];
    for (let k = 0; k < N; k++) {
      const k1 = (k + 1) % N;
      push(matFor(k, 0), [fc, P(f, k1), P(f, k)], [lc, P(l, k), P(l, k1)]);
    }
  }
  const g = new THREE.Group();
  for (const [mat, tris] of byMat) g.add(flatTriMesh(tris, mat));
  return g;
}

// Tag every mesh in a subtree with the anatomical part it belongs to. The structural probe reads
// these to measure the HULL's projected area rather than raw vertex counts — without the tag, a
// dense little toe loft outweighs the whole chest and the forward-mass number becomes a lie
// about vertex density instead of a measurement of silhouette.
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function tagPart(obj, part) { obj.traverse((o) => { if (o.isMesh) o.userData.fornaxPart = part; }); return obj; }

// --- THE SEAM NETWORK --------------------------------------------------------
// Lava-lake topology (ref §7): FEW LONG CURVING seams bounding LARGE smooth plates. The research
// is explicit that 120° hexagonal cells read as DEAD ROCK — the living-armour read needs
// T-junctions, so the network here is built entirely from T's: two gen-1 longitudinal seams run
// the chine apex columns nose→tail, and every transverse seam TERMINATES on them (a T at each
// end) rather than crossing to make a Y.
//
// A seam is a RECESSED CHANNEL, never a proud rib and never a bright cap (the flat-tape tell,
// AAA-PIPELINE §2.1 — inverted here because at I1 the seam has no light at all). It is drawn as
// one narrow strip in a dedicated tier DARKER than the darkest plate, seated a hair proud of the
// hull only so it does not z-fight; the value does the recessing, and at I4 the same path is
// where THE STOKE runs.
function seamStrip(pts, halfW, mat) {
  const tris = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const A = pts[i], B = pts[i + 1];
    // Ribbon width is taken across the local segment direction, projected into the plane that
    // best shows it: for a longitudinal seam that is X, for a transverse seam it is Z.
    const dz = Math.abs(B[2] - A[2]), dx = Math.abs(B[0] - A[0]) + Math.abs(B[1] - A[1]);
    const wx = dz >= dx ? halfW : 0, wz = dz >= dx ? 0 : halfW;
    const AL = [A[0] - wx, A[1], A[2] - wz], AR = [A[0] + wx, A[1], A[2] + wz];
    const BL = [B[0] - wx, B[1], B[2] - wz], BR = [B[0] + wx, B[1], B[2] + wz];
    tris.push([AL, BR, BL], [AL, AR, BR]);
  }
  return flatTriMesh(tris, mat);
}

// ── THE RANK SUITE ──────────────────────────────────────────────────────────────────────────────
// Structure copied from the roster's premium bar, the Thunderhead Tempest, whose torso carries
// SEVEN named ranks (`dragonTempest.js#buildCumulonimbusTorso`: R1 dorsal scutes, R2 belly deck,
// R3 the carved storm-heart socket, R4 lapped armour, R5 flank shingle rows, R7 throat gorget,
// plus the spine circuit and sternum veins) — all funnelled through ONE per-material accumulator
// so seven ranks still cost ~12 draw calls.
//
// Rounds 1-4 of this hull had none of that. It was a lofted tube with value stripes and hairline
// seams, and no amount of albedo tuning could buy depth that isn't in the geometry. The honest
// caveat: roughly half of Tempest's read is its NEAR-WHITE storm circuit, and Fornax's equivalent
// — the seam network — stays unlit until I4 by its own withheld-light law. So these ranks must
// carry the whole richness on shadow and edge alone at I1.
//
// Each adder takes the shared `push` so a new rank never adds a draw call.

// R1 — DORSAL SCUTE RANK, withers→tail-root. Low armoured scutes, not spikes: the sheet keeps the
// sky above the spine unbroken for the tail's crest and I3's horns, so these ride the deck and
// break the outline only in profile. Dominant + decay with a deliberate irregular step.
// R1 — THE SLAG SERRATION. The §2 reversal made flesh, and the single biggest lever on this
// creature: the old rank topped out at 0.052u (~1px) and could not break its own outline, which is
// why five rounds of surface tuning produced a smooth lozenge.
//
//   HEIGHT   H = (0.30 | 0.17)·fr + 0.06, fr decaying 0.9→0.4 occiput→HIP  → tall vanes 0.18–0.33u
//   PITCH    16 intervals of ~0.156u over the 2.5u occiput→hip run (a 1–2 interval dark gap in the
//            rail is 0.14–0.32u ≈ 3–7px at 21px/u — the gap must RESOLVE or the split is fiction)
//   RHYTHM   period-3 tall-tall-short (Tempest alternates strict period 2)
//   PROFILE  asymmetric struck shard — apex 0.65 of the footprint AFT, leading face ≥3× the
//            trailing slope. TURNTABLE-SCALE ONLY: at chase distance this moves 0.3–0.5px, and the
//            sheet lists it as turntable-only rather than pretending it differentiates in play.
//   RECESS   every vane sits over its own charcoal under-gap (RL2) — a raised form with no shadow
//            step reads as a decal, which is exactly what round 5 shipped.
//
// Height is deliberately NOT the split from Tempest (ours 0.33u sits ABOVE its built 0.284u max);
// the split is the BROKEN rail, applied by the caller.
function addSlagSerration(push, at, S, M, opts) {
  const { n = 16, z0 = -1.90, z1 = 0.60, litRun } = opts || {};
  const tops = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // ±12% deterministic pitch jitter — an evenly spaced file is a picket fence however varied
    // the heights are. Never Math.random: the build must be byte-reproducible.
    const jit = 1 + 0.12 * (((i * 5 + 2) % 7) / 3 - 1);
    const z = S(z0) + (S(z1) - S(z0)) * t * jit;
    const st = at(z);
    const fr = 0.9 - 0.5 * t;                       // occiput → hip
    // Period-3 tall-tall-SHORT, but the DELTA has to read at 7px. Round 1 of the serration used
    // 0.30 vs 0.17 — a 36% drop that rendered as a uniform bristly comb, i.e. the picket-fence
    // tell the anatomy research promoted to an observed law (no natural display rank is
    // equal-pitch; the one comb-like system is asymmetric 7-vs-8). 0.30 vs 0.09 gives 0.33u vs
    // 0.14u at the occiput — 7px against 3px, a rhythm instead of a file. The short vanes sit
    // below the §4b band by design; they answer only to the 0.02u delete line.
    const tall = (i % 3) !== 2;                     // period-3: tall, tall, short
    const H = S((tall ? 0.30 : 0.09) * fr + 0.06);
    const foot = S(0.150);                          // fore-aft footprint
    const w = S(0.052) * (1 - 0.28 * t);            // half-width — a BLADE, not a cone
    const yTop = st.cy + st.ry;
    // Asymmetric shard: apex sits 0.65 aft of the leading edge, so the leading face is steep and
    // the trailing face rakes — a struck shard rather than a symmetric tent.
    const zLead = z - foot * 0.65, zTrail = z + foot * 0.35, zApex = z + foot * 0.15;
    const apex = [0, yTop + H, zApex];
    // VALUE STRUCTURE AT VANE SCALE — the critic's core finding: Tempest reads as carved because
    // every form carries core→bloom→dark at EVERY scale, while these vanes were char-on-char and
    // vanished wherever the hull (not sky) backed them. Each vane now spans three tiers by itself:
    // a pale LEADING EDGE on lit runs (bone-ash), a mid-tier body, and its dark under-gap recess.
    const lit = litRun ? litRun(i) : false;
    push(lit ? M.rim : M.ashLit,
      [apex, [-w, yTop, zLead], [w, yTop, zLead]]);           // leading face — the caught edge
    push(M.scorch,
      [apex, [w, yTop, zLead], [w * 0.72, yTop, zTrail]],     // starboard rake (mid tier)
      [apex, [-w * 0.72, yTop, zTrail], [-w, yTop, zLead]],   // port rake
      [apex, [w * 0.72, yTop, zTrail], [-w * 0.72, yTop, zTrail]]);
    // RL2 — the under-gap recess: a dark step sunk INTO the hull at the vane's base, so the vane
    // casts a visible shadow line instead of floating on the surface.
    push(M.seam,
      [[-w * 1.15, yTop - S(0.028), zLead], [w * 1.15, yTop - S(0.028), zLead], [w * 1.15, yTop - S(0.004), zTrail]],
      [[-w * 1.15, yTop - S(0.028), zLead], [w * 1.15, yTop - S(0.004), zTrail], [-w * 1.15, yTop - S(0.004), zTrail]]);
    tops.push({ z, y: yTop + H, w });
  }
  // (c) THE BROKEN RAIL — now carried by the PER-VANE pale leading edges above, not by spans
  // between vane tips. The span version connected apexes of unequal height (0.33u tall → 0.14u
  // short), so the ribbon floated in mid-air detached from any surface and rendered as white
  // threads — "spider silk", and at the shoulder it composed a scribbled glyph. Widening it only
  // made the artifact visible. The broken-vs-continuous split from Tempest survives intact: the
  // lit RUNS are what differ, and a per-vane cap is the mechanism the crops proved legible.
  return tops;
}

// R2 — BELLY DECK: raised ventral plates separated by RECESSED gutters. The gutters are the ventral
// half of the seam network and the channel THE STOKE runs along at I4, so the geometry has to exist
// now even though it reads only as shadow.
function addBellyDeck(push, at, S, M, n) {
  // Lift 0.05u (was 0.010-0.016 = sub-pixel) over a recessed base, with real gutter WALLS rather
  // than the flat coplanar quad round-5 shipped — that quad sat INSIDE the hull and drew nothing.
  // Tier by RADIAL DISTANCE FROM THE KEEL (core/mid/edge), never by index: value follows structure.
  const LIFT = S(0.05);
  for (let i = 0; i < n; i++) {
    const z = S(-1.15) + (S(0.95) - S(-1.15)) * (i / (n - 1 || 1));
    const st = at(z);
    const yB = st.cy - st.ry;
    const w = st.rx * 0.42, d = S(0.085);
    // three lanes across the belly; the tier is a function of |x| from the keel line
    for (const [x0, x1, mat] of [[-w, -w * 0.34, M.scorch], [-w * 0.34, w * 0.34, M.ashLit], [w * 0.34, w, M.scorch]]) {
      const yT = yB - LIFT;
      push(mat,
        [[x0, yT, z - d], [x1, yT, z - d], [x1, yT, z + d]],
        [[x0, yT, z - d], [x1, yT, z + d], [x0, yT, z + d]]);
      // GUTTER WALLS — full 0 -> lift height on both flanks, so each plate throws a shadow step.
      for (const xe of [x0, x1]) {
        push(M.seam,
          [[xe, yB, z - d], [xe, yT, z - d], [xe, yT, z + d]],
          [[xe, yB, z - d], [xe, yT, z + d], [xe, yB, z + d]]);
      }
    }
    // transverse gutter wall aft of each deck plate
    push(M.seam,
      [[-w, yB, z + d], [w, yB, z + d], [w, yB - LIFT, z + d]],
      [[-w, yB, z + d], [w, yB - LIFT, z + d], [-w, yB - LIFT, z + d]]);
  }
}

// R3 — THE FURNACE SOCKET at the sternum. Fornax's answer to the storm-heart: a carved void with a
// raised rim, a sunk floor and cowl vanes shading it. The whole point of the identity is that the
// fire is INSIDE and leaks out of openings, so the opening must be real geometry — a rim casting a
// shadow over a recessed floor. Unlit at I1; at I4 the floor is where the core sits.
function addFurnaceSocket(push, S, M, cx, cy, cz, r) {
  const N = 9;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
    const p = (a, rr, y) => [cx + Math.cos(a) * rr, cy + y, cz + Math.sin(a) * rr * 0.72];
    // raised rim ring
    push(M.rim, [p(a0, r, S(0.012)), p(a1, r, S(0.012)), p(a1, r * 0.80, S(0.004))],
                [p(a0, r, S(0.012)), p(a1, r * 0.80, S(0.004)), p(a0, r * 0.80, S(0.004))]);
    // sunk floor — the void the rim shades
    push(M.seam, [p(a0, r * 0.80, S(0.004)), p(a1, r * 0.80, S(0.004)), [cx, cy - S(0.150), cz]]);   // sunk 0.15u INBOARD (was 0.030) — a carved void, not a dimple
  }
  // cowl vanes — two shading blades over the socket's upper lip, so it reads as sheltered
  for (const sd of [1, -1]) {
    push(M.char, [[cx + sd * r * 0.55, cy + S(0.020), cz - r * 0.35],
                  [cx + sd * r * 1.05, cy + S(0.008), cz + r * 0.15],
                  [cx + sd * r * 0.45, cy - S(0.012), cz - r * 0.10]]);
  }
}

// R4 — LAPPED ARMOUR over the two muscle masses (shoulder girdle + haunch). Overlapping cards, per
// the sheet's "overlap > weld on every plate joint".
function addLappedArmor(push, at, S, M) {
  for (const side of [1, -1]) {
    const runs = [[S(-1.20), 3, S(0.115)], [S(-0.95), 3, S(0.125)], [S(0.52), 2, S(0.100)], [S(0.80), 2, S(0.090)]];
    for (const [z0, cnt, sz] of runs) {
      for (let i = 0; i < cnt; i++) {
        const z = z0 + i * sz * 1.35;
        const st = at(z);
        const th = 0.55 + 0.28 * i;
        const nx = side * Math.sin(th), ny = Math.cos(th);
        const OFF = S(0.055), CUP = S(0.035);   // was 0.014 flat — a decal, not armour
        const x = side * Math.sin(th) * st.rx + nx * OFF;
        const y = st.cy + Math.cos(th) * st.ry + ny * OFF;
        const tx = side * Math.cos(th), ty = -Math.sin(th);
        const s = sz * (1 - 0.16 * i);
        const P = (u, v, out = 0) => [x + tx * u + nx * out, y + ty * u + ny * out, z + v];
        // VALUE BY ROLE, not by index: the shoulder run is flank-tier, the haunch run ventral-tier.
        // (The old `i === 0 ? ashLit : scorch` was a non-modulo index pick that evaded the firewall.)
        const roleMat = z0 < 0 ? M.scorch : M.char;
        push(roleMat,
          [P(-s, -s * 0.8, CUP), P(s, -s * 0.6, CUP), P(s * 0.8, s, 0)],
          [P(-s, -s * 0.8, CUP), P(s * 0.8, s, 0), P(-s * 0.85, s * 0.9, 0)]);
        // PERIMETER RECESS WALLS (0 -> standoff) so the plate visibly laps the next one.
        const B = (u, v) => [x + tx * u - nx * OFF, y + ty * u - ny * OFF, z + v];
        push(M.seam,
          [P(-s, -s * 0.8, CUP), B(-s, -s * 0.8), B(s, -s * 0.6)],
          [P(-s, -s * 0.8, CUP), B(s, -s * 0.6), P(s, -s * 0.6, CUP)],
          [P(s * 0.8, s, 0), B(s * 0.8, s), B(-s * 0.85, s * 0.9)],
          [P(s * 0.8, s, 0), B(-s * 0.85, s * 0.9), P(-s * 0.85, s * 0.9, 0)]);
      }
    }
  }
}

// R5 — FLANK SHINGLE ROWS: two lines of small cupped cards per side over the smooth flank wall,
// the rank that keeps the mid-body from being a bare panel between the two muscle masses.
function addFlankShingles(push, at, S, M, perRow) {
  // Proud 0.05u (was 0.008 = sub-pixel) with a DARK RECESS GAP under every fore edge, and cards
  // >=0.10u — RL4: fewer, bigger, organised. Round 5 scattered many tiny cards, which is the
  // confetti half of the camouflage read.
  const PROUD = S(0.05);
  for (const side of [1, -1]) {
    for (const [th, cnt] of [[0.95, perRow], [1.28, perRow - 1]]) {
      for (let i = 0; i < cnt; i++) {
        // Rows start AFT of the wing root (-0.72, was -1.05): the foremost cards used to sit on
        // the shoulder where, with the rail wires gone, they read as isolated pale debris.
        const z = S(-0.72) + (S(1.25) - S(-0.72)) * (i / (cnt - 1 || 1));
        const st = at(z);
        const nx = side * Math.sin(th), ny = Math.cos(th);
        const xh = side * Math.sin(th) * st.rx, yh = st.cy + Math.cos(th) * st.ry;
        const x = xh + nx * PROUD, y = yh + ny * PROUD;
        const s2 = S(0.055), d = S(0.075);          // card >= 0.10u across
        // VALUE BY ROLE: the flank rank is flank-tier, full stop. No index pick.
        push(M.scorch,
          [[x, y + s2, z - d], [x, y - s2, z - d * 0.7], [x + nx * S(0.010), y, z + d]],
          [[x, y + s2, z - d], [x + nx * S(0.010), y, z + d], [x - nx * S(0.004), y + s2 * 0.4, z + d * 0.6]]);
        // RECESS under the FORE edge — the shadow that makes a card read as lapped, not painted.
        push(M.seam,
          [[xh, yh + s2, z - d], [xh, yh - s2, z - d * 0.7], [x, y - s2, z - d * 0.7]],
          [[xh, yh + s2, z - d], [x, y - s2, z - d * 0.7], [x, y + s2, z - d]]);
      }
    }
  }
}

// R6 — THROAT GORGET: banded collar plates under the jaw line, the rank that stops the neck reading
// as a smooth pipe. Pale-ish diffuse so the throat separates from the hull in shadow.
function addGorget(push, at, S, M, n) {
  // Each band is a raised STEP >=0.04u with a recessed dark seam aft — stand-off geometry, not
  // paint. Round 5 used an `i % 2` tier flip (an index pick) and no step at all.
  const STEP = S(0.045);
  for (let i = 0; i < n; i++) {
    const z = S(-2.62) + i * S(0.17);
    const st = at(z);
    const yB = st.cy - st.ry, w = st.rx * 0.68;
    const yT = yB - STEP;
    // VALUE BY ROLE: throat is ventral -> ash tier throughout.
    push(M.ashLit,
      [[-w, yT, z], [w, yT, z], [w * 0.82, yT, z + S(0.085)]],
      [[-w, yT, z], [w * 0.82, yT, z + S(0.085)], [-w * 0.82, yT, z + S(0.085)]]);
    // the step wall + the recessed seam aft of it
    push(M.seam,
      [[-w, yB, z], [w, yB, z], [w, yT, z]],
      [[-w, yB, z], [w, yT, z], [-w, yT, z]],
      [[-w * 0.82, yT, z + S(0.085)], [w * 0.82, yT, z + S(0.085)], [w * 0.7, yB, z + S(0.115)]],
      [[-w * 0.82, yT, z + S(0.085)], [w * 0.7, yB, z + S(0.115)], [-w * 0.7, yB, z + S(0.115)]]);
  }
}

// --- The four-tier char value ladder ----------------------------------------
// The AAA value-structure law: a deliberately dark hero is CARVED OUT OF VALUES, never a flat
// silhouette. Four diffuse tiers, and — the finding that reversed the sheet's own first draft —
// char albedo is COOL and never pure black (ref §7: charcoal albedo ≈0.04, linear 0.02-0.045,
// R−B within a couple of steps). ALL the warmth on this creature is EMITTED at I4; none of it is
// painted into the diffuse. That is the whole difference between a banked furnace and a dragon
// somebody tinted orange, and it is why the Ember starter's surface-warm lane stays uncollided.
function fornaxMats(def) {
  const mk = (hex, rough, metal = 0.02) => {
    const m = new THREE.MeshStandardMaterial({
      color: hex, emissive: 0x000000, flatShading: true, roughness: rough, metalness: metal,
    });
    m.envMapIntensity = 0.25;
    return m;
  };
  // ⚠ THE ENDPOINTS ARE AIMED AT THE RENDER, NOT AT THE MATERIAL (DRAGON-DESIGN §3.2 — the
  // recorded Vesper failure: four tiers spanning 0.02 luminance were invisible, and re-aiming the
  // lerp at a lit steel-slate spread them 0.05→0.14 so all four read). Round 1 of this build
  // repeated that mistake exactly: the sourced charcoal albedo (0.02-0.045 linear) is right for
  // the DARK FIELD, but applying it near-uniformly rendered the whole creature between 5 and 30
  // out of 255 against a 213 sky — measured, not guessed. Charcoal is a material fact; a value
  // LADDER is a rendering decision, and only the darkest tier owes the band.
  return {
    // linear ≈ 0.023 — the dark field, and the only tier bound by the sourced charcoal band.
    // Cool-neutral. This one stays put: "darkest object" is an identity law.
    char: mk(def.body ?? 0x2a2a2c, 0.86),
    // The lit tiers climb well clear of the field so the ladder survives being lit. Greying the
    // BODY is banned; lifting the LIT FACETS is the prescribed fix — the dark field is untouched.
    //
    // ⚠ THEY ARE WARM-NEUTRAL, AND THE ROUGHNESS DROPS AS THEY CLIMB. Round 2's lit tiers were
    // cool-neutral like the field, and under this rig (hemisphere 0xbfdcff, rim 0x7fb8ff) every
    // lit facet rendered STEEL-BLUE — the creature read as gunmetal, drifting toward the Azure
    // lane rather than ash over char. The cool law binds the DARK FIELD only; ash from a fire is
    // warm grey, so the lit end of the ladder is where the identity's temperature lives before
    // I4's embers arrive. Lower roughness on the lit tiers lets them actually CATCH the key —
    // albedo alone had run out of headroom (round 2 lifted the hexes and the render barely moved).
    scorch: mk(0x54504c, 0.72),
    ashLit: mk(0x8f8a84, 0.60),   // RL7 warm-GREY: R-B 11, HSV sat 0.077 (<=0.10). 0x94897c read khaki-brown
    // The plate-rim tier — ≤2% of area, rims only, never faces (coal-not-torch: the bright part
    // is the RIM over a dark face). It is the creature's light-catch, so it carries the top of
    // the ladder; a dark creature with no catch is unphotographable (DRAGON-DESIGN §6.7).
    rim: mk(0xbdb6ac, 0.44, 0.14),   // RL7: R-B 17, HSV sat 0.090 (<=0.10)
    // The seam channel: DARKER than the darkest plate, so a seam pixel can never read brighter
    // than the plate it divides (director's target 6 — recessed, never proud).
    seam: mk(0x1e1e20, 0.92),
  };
}

// --- TORSO: slagAnvilTorso ---------------------------------------------------
// THE ANVIL. One dominant forged mass, forward-loaded, with root swells that BREAK the outline.
// Station geometry carries the numbers the director set: chest depth 1.65× waist (target 1.6-1.9),
// shoulder width 1.28× hip (target ≥1.25), and NO ventral keel blade — the flight muscle is a
// shallow wrap around the ribcage, because real soarers have shallow keels and flight muscle is
// 20-25% of body mass, not the 40% the sheet's first draft implied.
function buildSlagAnvilTorso(def, model, bodyMat) {
  const group = new THREE.Group();
  const scale = model.anvilScale ?? 1;
  const M = fornaxMats(def);
  const S = (v) => v * scale;

  // Body stations. Three silhouette EVENTS down the dorsal line — shoulder yoke (the high point,
  // the anvil's face), a real waist tuck, a haunch re-swell — because a flat roofline is what
  // makes a body read as a box wearing panels.
  const body = [
    { z: S(-1.45), rx: S(0.26), ry: S(0.30), cy: S(0.20) },   // chest prow
    { z: S(-0.95), rx: S(0.60), ry: S(0.56), cy: S(0.16) },   // SHOULDER YOKE — widest + deepest
    { z: S(-0.35), rx: S(0.50), ry: S(0.46), cy: S(0.19) },
    { z: S(0.20), rx: S(0.35), ry: S(0.34), cy: S(0.20) },    // WAIST tuck (leanest)
    { z: S(0.60), rx: S(0.47), ry: S(0.44), cy: S(0.19) },    // HAUNCH swell — the hip outline event
    // The aft body carries real mass rather than pinching straight to the tail: the probe measured
    // 81.8% of side-view area forward of the hip against a 65-75% target, i.e. a tadpole. Real
    // archosaurs put the fattest caudal segments AFT of the hip, and a heavy aft body is what
    // earns the upright stance. Lengthening here fixed the number honestly; widening the band to
    // let 81.8% "pass" would have been moving the goalpost.
    { z: S(0.90), rx: S(0.42), ry: S(0.40), cy: S(0.180) },
    { z: S(1.20), rx: S(0.31), ry: S(0.30), cy: S(0.165) },
    { z: S(1.50), rx: S(0.19), ry: S(0.17), cy: S(0.155) },
    { z: S(1.70), rx: S(0.11), ry: S(0.10), cy: S(0.150) },   // tail root
  ];
  group.add(tagPart(slagLoft(body, SLAG_PROFILE, (k, i) => slagBand(M, k, i)), 'hull'));

  // NECK — 8 stations, a SHALLOW S. Ref §2: 8-9 cervicals, "slightly sinuous"; the joint COUNT is
  // the tell, not the length (birds run 14-15 and a deep S, and a deep S here would read bird).
  // ⚠ The first station sits INBOARD of the hull's chest-prow cap (z −1.45), not outboard of it.
  // At −1.50 with the neck loft uncapped there was a 0.05u slit straight through the chest — a
  // full-height crack of background visible in the side render and a matching pair of pinholes at
  // the neck base from above. "ONE dominant forged mass" cannot survive a silhouette that is
  // literally severed at the throat, and no probe in the harness can see a hole.
  //
  // The S is expressed in the TOPLINE (cy + ry), not just the centreline: the outline sags through
  // the mid-neck and lifts again toward the skull. A dip that exists only in cy while cy+ry falls
  // monotonically is an S nobody can see — which is what round 1 shipped.
  const neck = [
    { z: S(-1.38), rx: S(0.265), ry: S(0.300), cy: S(0.200) },   // top 0.500 — buried in the prow
    { z: S(-1.62), rx: S(0.245), ry: S(0.268), cy: S(0.205) },   // top 0.473
    { z: S(-1.86), rx: S(0.225), ry: S(0.238), cy: S(0.200) },   // top 0.438
    { z: S(-2.06), rx: S(0.208), ry: S(0.214), cy: S(0.196) },   // top 0.410  ← sag
    { z: S(-2.26), rx: S(0.192), ry: S(0.200), cy: S(0.205) },   // top 0.405  ← trough
    { z: S(-2.44), rx: S(0.176), ry: S(0.188), cy: S(0.220) },   // top 0.408  ← lift
    { z: S(-2.60), rx: S(0.158), ry: S(0.174), cy: S(0.236) },   // top 0.410
    { z: S(-2.76), rx: S(0.140), ry: S(0.158), cy: S(0.245) },   // top 0.403 — head carried high
  ];
  group.add(tagPart(slagLoft(neck, SLAG_PROFILE, (k, i) => slagBand(M, k, i + 3), false), 'neck'));

  // Surface point on the hull, pushed a hair proud so a seam never z-fights the plate it divides.
  const all = body.concat(neck).sort((a, b) => a.z - b.z);
  const at = (z) => {
    for (let i = 0; i < all.length - 1; i++) {
      const a = all[i], b = all[i + 1];
      if (z >= a.z && z <= b.z) {
        const t = (z - a.z) / (b.z - a.z || 1);
        return { rx: a.rx + (b.rx - a.rx) * t, ry: a.ry + (b.ry - a.ry) * t, cy: a.cy + (b.cy - a.cy) * t };
      }
    }
    const e = z < all[0].z ? all[0] : all[all.length - 1];
    return { rx: e.rx, ry: e.ry, cy: e.cy };
  };
  const OUT = S(0.006);
  const surf = (z, k) => {
    const s = at(z), p = SLAG_PROFILE[k];
    return [p[0] * (s.rx + OUT), s.cy + p[1] * (s.ry + OUT), z];
  };

  // THE SEAM NETWORK — gen-1 first (widest, longest), then gen-2 subdividing, because crack
  // hierarchy is mandatory: in real cooling crust the older cracks WIDEN while newer ones
  // subdivide the plates between them. A single-generation net of equal-width cracks is the
  // mud-crack tell.
  const w = S(0.006);                                    // hairline unit; gen-1 = 8w, gen-2 = 2.5w
  const seamOn = (model.slagSeams ?? 0) > 0;
  if (seamOn) {
    const nose = S(-2.70), tailEnd = S(1.20);
    // GEN-1 LONGITUDINAL ×2 — the chine apex columns (k2/k7), the strongest lines on the hull.
    // Every transverse seam terminates on these, which is what makes the junctions T's.
    for (const k of [2, 7]) {
      const pts = [];
      for (let z = nose; z <= tailEnd; z += S(0.15)) pts.push(surf(z, k));
      group.add(tagPart(seamStrip(pts, w * 4, M.seam), 'seam'));
    }
    // GEN-1 TRANSVERSE ×3 — shoulder, mid-back, hip. Each is an ARC over the dorsal deck from
    // chine to chine, so it crosses the dorsal midline (the STOKE must be routable tail-ward)
    // and T's into a longitudinal seam at BOTH ends. 3 arcs × 2 ends = 6 T-junctions, 0 Y.
    // ⚠ The column walk goes k2 → k1 → k0 → k9 → k8 → k7: chine, up over the shoulder bevel,
    // ACROSS THE DORSAL DECK, and down the far side. The ascending walk k2..k7 looks equivalent
    // and is not — it runs chine → lower flank → BELLY → lower flank → chine, i.e. the ventral
    // route, which puts the entire seam identity on the one surface the rear-high camera never
    // sees and leaves the deck blank. (Critic round 1 caught exactly this: the code contradicted
    // this comment.) Same T-junctions at the chines either way; only the visible route changes.
    const DORSAL_ARC = [2, 1, 0, 9, 8, 7];
    for (const z of [S(-0.95), S(-0.10), S(0.62)]) {
      group.add(tagPart(seamStrip(DORSAL_ARC.map((k) => surf(z, k)), w * 4, M.seam), 'seam'));
    }
    // GEN-2 ×4 — shorter flank seams branching off a gen-1 longitudinal and running down toward
    // the belly, subdividing the big chine plates. Deterministic offsets (never Math.random) so
    // the build is reproducible frame to frame and machine to machine.
    const g2 = [[-0.62, 2], [0.30, 2], [-0.62, 7], [0.30, 7]];
    for (const [z0, k0] of g2) {
      const z = S(z0), k1 = k0 === 2 ? 3 : 6, k2 = k0 === 2 ? 4 : 5;
      group.add(tagPart(seamStrip([surf(z, k0), surf(z, k1), surf(z, k2)], w * 1.25, M.seam), 'seam'));
    }
    // GEN-3 hairlines — ULTRA ONLY, and honestly device-scoped rather than context-scoped: there
    // is no shop-vs-game LOD split in this engine (modelDetail.js is a device multiplier), so a
    // low/high device never sees these even in the shop. Stated plainly rather than implied.
    if ((model.slagSeamGen3 ?? 0) > 0) {
      for (const [z0, k0] of [[-1.20, 1], [-0.50, 1], [0.05, 8], [0.85, 8]]) {
        group.add(tagPart(seamStrip([surf(S(z0), k0), surf(S(z0 + 0.18), k0 + 1)], w * 0.5, M.seam), 'seam'));
      }
    }
  }

  // ── THE CHAR-PLATE FIELD ────────────────────────────────────────────────────────────────────
  // The armour is LITERAL STRUCK GEOMETRY, not a value band painted on a smooth tube. Vesper hit
  // this exact failure and its own source records the fix: "the 'knapping' identity is literal
  // STRUCK GEOMETRY (it was told by value bands alone — the holistic-gate density gap)". Rounds
  // 1-3 here repeated it — a lofted hull with striped columns and hairline seams has no depth to
  // catch light, so it renders as a cutout no matter how the tiers are tuned. Richness is ORGANISED
  // RANKS of geometry; ours are plates + their rims + the deck edge + the seam net.
  //
  // These are heat-shield plates, so they are FEW and LARGE (ref §7: few long seams bounding large
  // plates — many small cells is the mud-crack/dead-rock read), overlapping rather than welded
  // (sheet §4: "overlap > weld on every plate joint"), each lifted proud of the hull so it casts
  // its own edge shadow, and each carrying a thin RIM strip along its aft edge — which is finally
  // the honest home for the rim tier: a caught edge over a dark face, never a painted stripe.
  //
  // The scatter is a deterministic golden-ratio walk (never Math.random — the build must be
  // byte-reproducible), biased to the dorsal deck and upper flank because that is what the
  // rear-high camera actually sees.
  // ── ONE PER-MATERIAL ACCUMULATOR FOR EVERY DETAIL RANK ──────────────────────────────────────
  // The Tempest pattern, applied properly: plates, rims, cowl, haunch scutes and the R1-R6 rank
  // suite all funnel through one `push`, so the whole detail budget materialises as ~6 meshes
  // instead of ~6 per rank. Adding a rank must never cost a draw call — that is what makes
  // richness affordable on a 60fps mobile target.
  const dByMat = new Map();
  const push = (mat, ...tris) => { let a = dByMat.get(mat); if (!a) dByMat.set(mat, a = []); for (const t of tris) a.push(t); };

  const plateN = Math.round(model.slagPlates ?? 0);
  if (plateN > 0) {
    const byTier = [[], [], []];        // char / scorch / ashLit — the field itself carries the ladder
    const rims = [];
    for (let i = 0; i < plateN; i++) {
      const z = S(-1.30) + (S(1.45) - S(-1.30)) * ((i * 0.6180339887) % 1);
      const st = at(z);
      const sd = (i % 2) ? 1 : -1;
      // 0 = dorsal midline → ~1.25rad = upper flank. Biased toward the deck.
      const th = 0.12 + 1.15 * ((i * 0.3547) % 1);
      const lift = S(0.05);   // RL1: >=0.05u or it casts no shadow step at all
      const nx = sd * Math.sin(th), ny = Math.cos(th);
      const cx = sd * Math.sin(th) * st.rx + nx * lift;
      const cy = st.cy + Math.cos(th) * st.ry + ny * lift;
      // Surface tangents: around the hull, and along it.
      const tx = sd * Math.cos(th), ty = -Math.sin(th);
      const a = S(0.10 + 0.055 * ((i * 0.71) % 1));   // half-width across the flank
      const b = S(0.15 + 0.075 * ((i * 0.37) % 1));   // half-length along the body
      const P = (u, v, out = 0) => [cx + tx * u + nx * out, cy + ty * u + ny * out, z + v];
      // A cupped quad: the leading corners sit tighter to the hull than the trailing ones, so the
      // plate reads as laid ON the body rather than floating parallel to it.
      const c1 = P(-a * 0.82, -b, -lift * 0.5), c2 = P(a * 0.82, -b, -lift * 0.5);
      const c3 = P(a, b, 0), c4 = P(-a, b, 0);
      // VALUE BY ROLE (RL3): the tier follows WHERE the plate sits, not its loop index. th is the
      // angle up from the dorsal midline, so it is literally the structural role.
      const role = th < 0.55 ? 0 : th < 1.0 ? 1 : 2;    // dorsal / flank / lower flank
      byTier[role].push([c1, c2, c3], [c1, c3, c4]);
      // RIM — the caught edge along the trailing lip, lifted a hair further proud so it takes the
      // key light while the plate face stays dark. This is the coal-not-torch law in geometry.
      const r1 = P(a, b, 0), r2 = P(-a, b, 0);
      const r3 = P(-a * 0.94, b - S(0.022), lift * 0.6), r4 = P(a * 0.94, b - S(0.022), lift * 0.6);
      rims.push([r1, r2, r3], [r1, r3, r4]);
    }
    const tierMats = [M.char, M.scorch, M.ashLit];   // dorsal field / flank / ventral
    byTier.forEach((tris, t) => { if (tris.length) push(tierMats[t], ...tris); });
    if (rims.length) push(M.rim, ...rims);
  }

  // DECK-EDGE RIM — the fourth tier, and until round 2 it was a material defined with a law in its
  // comment and applied to nothing, which made the "four-tier ladder" claim false in the file that
  // asserted it. It lives where the coal-not-torch law says brightness belongs: the RIM over a
  // dark face, never the face itself. Two thin strips trace the dorsal deck's outer edge (the
  // k0/k1 and k9/k8 boundary) down the hull — the exact line rear-high light grazes — held to a
  // sliver of surface area so it reads as a caught edge rather than a painted stripe.
  if ((model.slagDeckRim ?? 0) > 0) {
    for (const [ka, kb] of [[0, 1], [9, 8]]) {
      const rail = [];
      for (let z = S(-2.60); z <= S(1.45); z += S(0.17)) {
        const a = surf(z, ka), b = surf(z, kb);
        rail.push([a[0] * 0.5 + b[0] * 0.5, a[1] * 0.5 + b[1] * 0.5, z]);
      }
      const tris = [];
      const hw = S(0.030);   // widened: at round-1 width the catch was sub-pixel at chase distance
      for (let i = 0; i < rail.length - 1; i++) {
        const A = rail[i], B = rail[i + 1];
        const AL = [A[0] - hw, A[1], A[2]], AR = [A[0] + hw, A[1], A[2]];
        const BL = [B[0] - hw, B[1], B[2]], BR = [B[0] + hw, B[1], B[2]];
        tris.push([AL, BR, BL], [AL, AR, BR]);
      }
      group.add(tagPart(flatTriMesh(tris, M.rim), 'rim'));
    }
  }

  // ── SHOULDER COWL + HAUNCH SCALES ───────────────────────────────────────────────────────────
  // Two more ranks, because a hull with one rank of detail reads as a decal and a hull with five
  // reads as a creature. Both are dominant + decay (never equal-pitch — ref §6: no natural display
  // rank is evenly spaced, and the one comb-like system in the literature is asymmetric 7-vs-8).
  if ((model.slagCowl ?? 0) > 0) {
    for (const side of [1, -1]) {
      // The cowl: 3 overlapping lames sweeping back off the shoulder yoke, each ~0.66 of the last
      // — the armour that would have to exist for a wing to hinge under it.
      const tris = [], rimTris = [];
      let w = S(0.30), zc = S(-1.10);
      for (let n = 0; n < 3; n++) {
        const st = at(zc);
        const yTop = st.cy + st.ry * 0.86, yLow = st.cy + st.ry * 0.10;
        const x = side * (st.rx * 0.92 + S(0.012));
        tris.push(
          [[x, yTop, zc - w * 0.5], [x, yLow, zc - w * 0.35], [x * 1.04, yLow, zc + w * 0.5]],
          [[x, yTop, zc - w * 0.5], [x * 1.04, yLow, zc + w * 0.5], [x * 1.04, yTop, zc + w * 0.3]],
        );
        rimTris.push([[x * 1.05, yTop, zc + w * 0.3], [x * 1.05, yLow, zc + w * 0.5], [x * 1.02, (yTop + yLow) * 0.5, zc + w * 0.58]]);
        w *= 0.66; zc += S(0.26);
      }
      push(M.scorch, ...tris); push(M.rim, ...rimTris);
    }
  }
  // ── THE RANK SUITE, through ONE per-material accumulator (the Tempest pattern) ───────────────
  // Seven ranks, ~5 extra meshes. Tagged 'rank' as a group so the structural probe can still
  // isolate the 'hull' loft for its proportion measurements.
  let serrTops = [];
  if ((model.slagRanks ?? 0) > 0) {
    // R1 — THE SLAG SERRATION, occiput -> hip. The broken rail (~60% duty, lit runs of 2-4
    // intervals, 1-2 dark between) is the load-bearing split from Tempest's continuous crest
    // ribbon; at the committed 0.156u pitch a 1-2 interval gap is 3-7px, so it resolves.
    const litRun = (i) => ((i * 2 + 1) % 7) < 4;
    const nVane = Math.max(4, Math.round(16 * model.slagRanks));
    serrTops = addSlagSerration(push, at, S, M, { n: nVane, z0: -1.90, z1: 0.60, litRun });
    // AFT-BODY VANES (hip -> tail root) — the torso module owns this stretch under §8's tip-floor
    // schedule: pitch ~0.32u, height decaying 0.18u -> 0.04u at x0.9103 per interval (the ratio is
    // DERIVED from the endpoints over 16 intervals, not chosen). The old x0.66-per-vane law was a
    // 2-3 element follower rule and put vane 6 under the 0.02u delete line - a dead crest.
    {
      const H0 = S(0.18), RATIO = 0.9103, PITCH = S(0.32);
      let z = S(0.60) + PITCH;
      for (let i = 1; z <= S(1.70); i++, z += PITCH) {
        const st = at(z), H = H0 * Math.pow(RATIO, i), w = S(0.040);
        const yTop = st.cy + st.ry, foot = S(0.130);
        push(M.char,
          [[0, yTop + H, z + foot * 0.15], [-w, yTop, z - foot * 0.65], [w, yTop, z - foot * 0.65]],
          [[0, yTop + H, z + foot * 0.15], [w, yTop, z - foot * 0.65], [w * 0.72, yTop, z + foot * 0.35]],
          [[0, yTop + H, z + foot * 0.15], [-w * 0.72, yTop, z + foot * 0.35], [-w, yTop, z - foot * 0.65]]);
        serrTops.push({ z, y: yTop + H, w });
      }
    }
    addBellyDeck(push, at, S, M, 7);                                     // R2 — ventral plates + gutters
    addFurnaceSocket(push, S, M, 0, TORSO_Y - S(0.30), S(-0.78), S(0.13));  // R3 — the hero void
    addLappedArmor(push, at, S, M);                                      // R4 — the two muscle masses
    addFlankShingles(push, at, S, M, 9);                                 // R5 — the mid-body wall
    addGorget(push, at, S, M, 4);                                        // R6 — the throat collar
  }

  if ((model.slagHaunchScales ?? 0) > 0) {
    for (const side of [1, -1]) {
      // A short decaying file of thick scutes over the haunch — the hip's own rank, deliberately
      // ±1 asymmetric between sides so the pair never reads stamped.
      const tris = [];
      const n = side === 1 ? 4 : 3;
      for (let i = 0; i < n; i++) {
        const zc = S(0.42) + S(0.17) * i;
        const st = at(zc);
        const s = S(0.075) * Math.pow(0.78, i);
        const x = side * (st.rx * 0.80 + S(0.010));
        const y = st.cy + st.ry * (0.42 - 0.12 * i);
        tris.push([[x, y + s, zc - s], [x, y - s, zc - s * 0.6], [x * 1.06, y, zc + s]]);
      }
      push(M.char, ...tris);
    }
  }

  // Materialise the whole detail budget: one mesh per material, regardless of rank count.
  if (dByMat.size) {
    const detail = new THREE.Group();
    for (const [mat, tris] of dByMat) detail.add(flatTriMesh(tris, mat));
    group.add(tagPart(detail, 'rank'));
  }

  // ROOT SWELLS — the humerus root must visibly OUTMASS the femur root (~1.4×). That ordering is
  // inverted vs birds and it is the wyvern's structural tell: the wings ARE the arms, so the
  // shoulder carries the flight load. It is also the fix for the #1 published machine-made-3D
  // giveaway — melted, blobby limb roots that are "impossible to pose". A capped lofted socket
  // reads as a joint awaiting an arm; a smooth fillet reads as an amputation.
  const swell = (x, y, z, r, mat) => {
    const st = [
      { z: z - r * 0.9, rx: r * 0.55, ry: r * 0.55, cy: 0 },
      { z, rx: r, ry: r * 0.92, cy: 0 },
      { z: z + r * 0.9, rx: r * 0.62, ry: r * 0.62, cy: 0 },
    ];
    const g = slagLoft(st, SLAG_PROFILE, () => mat);
    g.position.set(x, y, 0);
    return g;
  };
  const shoulderR = S(0.27), hipR = shoulderR / 1.4;   // the 1.4× law, expressed as the ratio itself
  for (const side of [1, -1]) {
    group.add(tagPart(swell(side * S(0.44), TORSO_Y + S(0.10), S(-0.95), shoulderR, M.scorch), 'shoulderRoot'));
    group.add(tagPart(swell(side * S(0.36), TORSO_Y - S(0.02), S(0.60), hipR, M.char), 'hipRoot'));
  }

  // emberHaunch — a HELPER inside the torso (there is no registerLegs), and a real hip→knee→
  // ankle→toe chain rather than I0's two boxes. Ref §3 overturned the brief here: raptors do NOT
  // tuck in cruise, and for a behind-and-above camera the abducted pose is the only one that puts
  // geometry in the wing–tail WEDGE — tucked is invisible and trailing hides inside the tail
  // outline and reads bird.
  if (model.emberHaunch) {
    for (const side of [1, -1]) {
      const hip = new THREE.Group();
      hip.position.set(side * S(0.34), TORSO_Y - S(0.06), S(0.62));
      // Abduct 45° stays (ref §3 — it is what puts geometry in the wing–tail wedge), but the limb
      // now FOLDS up along the belly in glide instead of hanging. Straight-down limbs are the
      // landing-gear tell (DRAGON-DESIGN failure #7), and the critic flagged them as the second
      // thing the owner would mock after the rail artifact.
      hip.rotation.z = side * THREE.MathUtils.degToRad(45);      // hip abduct 45° (band 35-55)
      hip.rotation.x = THREE.MathUtils.degToRad(-38);            // thigh swept UP toward the belly
      hip.userData.legRole = 'hip';

      const thighLen = S(0.40);
      const thigh = slagLoft([
        { z: 0, rx: S(0.115), ry: S(0.115), cy: 0 },
        { z: thighLen * 0.55, rx: S(0.095), ry: S(0.095), cy: 0 },
        { z: thighLen, rx: S(0.070), ry: S(0.070), cy: 0 },
      ], SLAG_PROFILE, () => M.char);
      thigh.rotation.x = Math.PI / 2;   // loft runs +z; stand it up so the limb runs down −y
      hip.add(thigh);

      // KNEE — hinged at the end of the thigh, not rotated about its own centre (the I0 bug the
      // director caught). Interior angle 82° (band 70-95): the shank swings forward under the body.
      const knee = new THREE.Group();
      knee.position.y = -thighLen;
      knee.rotation.x = THREE.MathUtils.degToRad(-(180 - 82)) * 0.86;   // deep fold — shank tucks forward, not down
      knee.userData.legRole = 'knee';
      hip.add(knee);

      const shankLen = S(0.34);
      const shank = slagLoft([
        { z: 0, rx: S(0.072), ry: S(0.072), cy: 0 },
        { z: shankLen, rx: S(0.052), ry: S(0.052), cy: 0 },
      ], SLAG_PROFILE, () => M.char);
      shank.rotation.x = Math.PI / 2;
      knee.add(shank);
      // A greave plate rides the shank in the hull's plate language — one rank, not a picket file.
      const greave = slagLoft([
        { z: shankLen * 0.15, rx: S(0.085), ry: S(0.06), cy: 0 },
        { z: shankLen * 0.62, rx: S(0.065), ry: S(0.045), cy: 0 },
      ], SLAG_PROFILE, () => M.scorch);
      greave.rotation.x = Math.PI / 2;
      knee.add(greave);

      // ANKLE 115° (band 100-130), then a three-toed plated foot. Three toes, not four: a bird
      // foot is the single easiest accidental COCKATRICE misread, which the sheet deliberately
      // overrules period heraldry to avoid.
      const ankle = new THREE.Group();
      ankle.position.y = -shankLen;
      ankle.rotation.x = THREE.MathUtils.degToRad(115 - 90);
      ankle.userData.legRole = 'ankle';
      knee.add(ankle);
      // Toes shortened + splayed less now the limb folds: at the tucked angle the old length read
      // as broken twigs stuck to the sternum, sitting right on the clean lower silhouette.
      for (let t = -1; t <= 1; t++) {
        const toe = slagLoft([
          { z: 0, rx: S(0.030), ry: S(0.026), cy: 0 },
          { z: S(0.072), rx: S(0.019), ry: S(0.017), cy: 0 },
        ], SLAG_PROFILE, () => M.char);
        toe.rotation.x = Math.PI / 2;
        toe.rotation.z = t * 0.30;
        toe.position.set(t * S(0.035), -S(0.02), -S(0.02));
        ankle.add(toe);
      }
      group.add(tagPart(hip, 'leg'));
    }
  }

  // Spine polyline (world-space) for line-of-action asserts — additive + nullable.
  const spinePoints = [];
  for (const s of all) spinePoints.push(new THREE.Vector3(0, s.cy + s.ry, s.z));

  // Motif anchor — the socket a later increment hangs the identity feature from. Crash-guard:
  // parts read attach.motifAnchor, so it must exist even when nothing uses it yet.
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.set(0, TORSO_Y + S(0.34), S(-0.95));
  group.add(motifAnchor);

  // ⚠ THE ATTACH CONTRACT — FROZEN AT I1 SIGN-OFF. I3's brandSkull and firebrandTail mount
  // through this, so moving a number after sign-off silently moves their geometry. keelTopAt and
  // halfWidthAt are now real functions OF Z (I0 returned constants, which would have put a spine
  // ridge at a fixed height over a body that changes height).
  //
  // SPAN RECONCILIATION (director's target 14): torso = shoulder(z −0.95) → hip(z +0.60) = 1.55u.
  // The sanctioned rideability band is span:torso 5.0-6.5 (the HONEST figure is 13-15:1, which
  // gives a 70cm torso nobody can sit on). At the 5.5 target that implies a FULL span of ~8.5u,
  // i.e. `wingSpan` (half-span) ≈ 4.26 at I2 — recorded here so I2 lands the band without moving
  // this contract. Engine sanity span:total-body stays ≤2.5 (total body ≈ 4.0u).
  const attach = {
    wingRoot: (side) => ({ x: side * S(0.44), y: TORSO_Y + S(0.14), z: S(-0.95) }),
    headBase: { x: 0, y: TORSO_Y + S(0.16), z: S(-2.86) },
    tailAnchor: { y: S(0.15), z: S(1.70) },
    keelTopAt: (z) => { const s = at(z); return TORSO_Y + s.cy + s.ry; },
    halfWidthAt: (z) => at(z).rx * 0.96,
    bodyMidY: TORSO_Y,
    motifAnchor,
    // ADDITIVE key (audit C4): crest top = hull top + local vane height. §8's tail crest seeds its
    // first vane from serrationTopAt(anchor.z) so "height-matched" is built FROM the contract
    // instead of duplicated constants. Nullable — a creature without a serration simply omits it.
    serrationTopAt: (z) => {
      let best = null;
      for (const t of serrTops) if (best === null || Math.abs(t.z - z) < Math.abs(best.z - z)) best = t;
      return best ? best.y : (TORSO_Y + at(z).cy + at(z).ry);
    },
  };

  // coreGlow MUST be null, never a colour (the documented Solar crash, dragonVesper.js:319-321).
  return { group, attach, spinePoints, spineMats: [], mats: { bodyMat: M.char }, coreGlow: null };
}
registerTorso('slagAnvilTorso', buildSlagAnvilTorso);

// --- WINGS: underlitCrescentWings -------------------------------------------
// THE HERO, and therefore the thing I0 must NOT fake: the rig wiring is real here even though the
// membrane is a blockout. I2 builds the low taut crescent (archRise 0.12, wristT 0.30, bay sag
// ≤0.10 chord) and — critically — THE NOTCH FLOOR: digit tips project ≥0.15 bay chord beyond the
// between-tip membrane line, so the taut bays cannot collapse into the plane wing at chase
// distance (audit round 2). None of that exists yet.
// --- WINGS: THE UNDERLIT CRESCENT (buildsheet §5 v2.4) -----------------------
// ⚠ REBUILT after the owner rejected the I2 wing. The old build fanned the membrane from a single
// wrist hub with NO humerus and NO forearm — geometrically a pterosaur with the arm deleted, which
// is why it read as a spoke. The root cause was a GAP IN THE SHEET (it specified differentiators vs
// Vesper and mechanisms, never a wing), now closed by ref §4.9 PLANFORM + buildsheet §5.1-5.4.
//
// THE LAW THAT ORDERS THIS FILE: the membrane is an OUTPUT of the arm-and-hand skeleton, never an
// input. Skeleton first (LE polyline), then chord, then membrane. Any code that authors a membrane
// outline and hangs bones on it is running the method backwards.
//
// Topology: PTEROSAUR SPAR (overturns the former SETTLED "bat fan" — its premise, "a single spar
// degenerates to the paper-dart read", misattributed to spar count a failure caused by the missing
// arm). Wrist at 0.242 L, ONE 155° chevron vertex, concave-everywhere trailing edge, zero bays.

// Solved leading-edge skeleton, wing-local units at wingSpan 4.26 (origin = shoulder, +x outboard,
// +z aft). Straight-line shoulder→tip L = 4.26; the tip's LATERAL reach is x = 3.810 — the two are
// NOT interchangeable, and conflating them puts chord stations past the wingtip.
// ⚠ Outer sweep is 25°, NOT the 31° first solved. The spec's forward-offset band is stated for
// the VISIBLE leading edge, but a bone chain is authored as a centreline — and the spar's own
// forward cheek sits ~0.012 L ahead of it. Solving the skeleton to the top of the band put the
// visible edge over the ceiling. Author the centreline WELL inside the band you want to measure:
// spar cheek + propatagium bulge together add ~0.026 L, so a 0.099 centreline measured 0.125 —
// passing by 0.0002, which is not a pass, it is a coincidence. 25° also opens the wrist corner
// to 161°, mid-band instead of sitting on the floor.
// ⚠ THE FOURTH COLUMN IS Y, AND IT IS NOT OPTIONAL. Authored without it (x/z only) this wing
// rendered as a razor line from the rear — 31% wide, 9% tall — because a flat horizontal membrane
// is edge-on to a behind-and-above camera. Ref §4.9.10: "dihedral and sweep read strongly from
// behind, span barely at all." The planform is the view the player NEVER gets on its own; the
// gull curve is what converts it into a shape. Glide rise, as a fraction of L above the shoulder:
// elbow +0.035, wrist +0.085 (the apex), tip +0.065 — a shallow M, not a straight V.
// Inboard dihedral works out at 17.9° (sourced gull cap is 20°), outboard -1.7° (band 0 to -5°).
// ── THE LEADING EDGE IS A CONTINUOUS FUNCTION, NOT A CHAIN OF STRAIGHT BONES ────────────────
// ⚠ This replaces a 9-vertex polyline whose leading finger left the wrist as a STRAIGHT bone at a
// fixed 26° azimuth. That is the shape error the owner named: the edge has to be
// **convex from the body out to the wrist, then concave from the wrist to the tip**, and the
// leading finger must be the CONTINUATION of that curve — not a separate spar bolted to its end.
//
// `DRAGON-DESIGN.md` §4.1: "Knuckled leading edge, never a straight bar. Two curves compose it:
// a gull ARCH in Y (rise to a carpal apex ~t 0.35–0.45, ease to the tip) and an OGEE in Z (bow
// forward mid-span, sweep hard aft to the tip)." The shipped reference is `vesperArmZ`:
//   armZ(t) = -0.10 + 0.44*hs*t^1.12 - 0.15*hs*sin(PI*t)
// The `- sin(PI*t)` term IS the ogee — it pulls the edge forward around mid-span, so the run out
// to the wrist reads convex and everything past it reads concave. The wrist sits ON this curve
// (K = LE(wristT)) and the wingtip is LE(1), which is what makes the leading finger read as one
// continuous swept limb instead of a spoke.
const FX_SPAN = 3.95;          // lateral reach of the tip, authored units
const FX_WRIST_T = 0.30;       // carpal apex — MEDIAL (house band 0.2–0.3): short arm, long hand
const FX_ARCH = 0.22;          // gull rise at the apex, x hs — flattened so the top surface angles toward the chase cam
// Z ogee: forward bow inboard, hard aft sweep outboard.
// ⚠ The forward bow must peak AT THE WRIST, not at mid-span. A plain sin(PI*t) peaks at t=0.5,
// which put the apex at 0.42 while the wrist sat at 0.265 — so the edge was still convex well
// past the carpal joint and the concave phase started too late. Both shipped house wings put
// their forward apex within ~0.02 of the wrist (Tempest 0.296 vs 0.277; Vesper 0.132 vs 0.163).
// Warping the bow by t^BOWP with BOWP = ln(0.5)/ln(wristT) moves the peak onto the wrist exactly.
const FX_BOWP = Math.log(0.5) / Math.log(0.40);   // 0.40 not 0.30: FX_WRIST_T is a fraction of LATERAL span, the probe reads along-chord, and the peak landed 0.06 inboard of the joint
const fxArmZ = (t, hs) => -0.10 + 0.44 * hs * Math.pow(t, 1.12) - 0.20 * hs * Math.sin(Math.PI * Math.pow(t, FX_BOWP));
// Y gull: rise to the carpal apex, then ease down to the tip (never a straight V).
const fxArmY = (t, hs, w) => {
  const arch = t <= w ? Math.sin((t / w) * Math.PI / 2) * 0.30 : 0.30 - (t - w) * 0.30;
  return hs * (0.02 * t + FX_ARCH * arch) - hs * 0.014;
};
// Leading-edge radius taper along the same parameter (a constant-radius spar reads as a bar).
const fxArmR = (t) => 1.00 - 0.90 * Math.pow(t, 0.75);

// Chord (leading edge -> trailing edge) as a function of span, used by the camber term and the
// shoulder fill. Widest inboard-of-mid, then carried OUT through the hand before resolving — the
// art-director note that Fornax's hand looked "starved and vestigial" versus Tempest's.
const FX_CHORD = [
  ['root',    0.000, 2.164],
  ['elbow',   0.355, 1.947],
  ['wrist',   0.940, 1.780],
  ['knuckle', 1.650, 1.480],
  ['wp1end',  2.527, 1.020],
  ['neartip', 3.321, 0.430],
  ['tip',     3.950, 0.000],
];
const FX_WRIST_I = Math.round(0.30 * 12);   // sample index of the carpal apex on the sampled curve

function buildUnderlitCrescentWings(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const M = fornaxMats(def);
  const S = (v) => v * (model.anvilScale ?? 1);
  const S2 = S((model.wingSpan ?? 4.26) * (model.spanScale ?? 1)) / 4.26;  // spec is authored at 4.26
  // ⚠ The membrane's deepest value tier CANNOT be M.seam: the part tagger infers role from
  // material (seam => recess) and the planform probe excludes recesses, so seam-as-a-membrane-tier
  // deletes the trailing half of every bay from the measurement.
  const memDeep = new THREE.MeshStandardMaterial({
    color: 0x28282b, emissive: 0x000000, flatShading: true, roughness: 0.86, metalness: 0.02,
    side: THREE.DoubleSide,
  });
  // Top membrane stays BLACK: the rig's unconditional boost term multiplies wingMembraneEmissive,
  // so without a registered black the wing tops light on every boost — outside Surge entirely.
  const wingMat = new THREE.MeshStandardMaterial({
    color: def.wingOuter ?? 0x2a2a2c, emissive: 0x000000, flatShading: true, roughness: 0.84,
    metalness: 0.02, side: THREE.DoubleSide,
  });
  const HS = S2 * FX_SPAN;
  const LEt = (t) => [t * HS, fxArmY(t, HS, FX_WRIST_T), fxArmZ(t, HS)];
  const XT = HS;
  // Sample the curve densely; the arm bones, the crust and the propatagium all ride these samples
  // so every part of the wing is on ONE leading edge rather than on its own approximation of it.
  const NLE = 12;   // ⚠ the crust rank emits 3 plates PER SAMPLE — 32 samples blew the tri budget
  const LE = [];
  for (let i = 0; i <= NLE; i++) { const t = i / NLE; const P = LEt(t); LE.push([`t${i}`, P[0], P[2], Math.max(0.10, fxArmR(t)), P[1]]); }
  const atX = (qx, col) => {
    const t = Math.max(0, Math.min(1, qx / HS));
    const P = LEt(t);
    return col === 2 ? P[2] : P[1];
  };
  const leZ = (qx) => atX(qx, 2);
  const leY = (qx) => atX(qx, 4);

  const CH = FX_CHORD.map(([n, x, c]) => [n, S2 * x, S2 * c]);
  const chordAt = (qx) => {
    if (qx <= CH[0][1]) return CH[0][2];          // ⚠ clamp: the root skirt runs to NEGATIVE x
    for (let i = 0; i < CH.length - 1; i++) {
      const a = CH[i][1], b = CH[i + 1][1];
      if (qx >= a - 1e-6 && qx <= b + 1e-6) { const t = (qx - a) / (b - a || 1); return CH[i][2] + t * (CH[i + 1][2] - CH[i][2]); }
    }
    return 0;
  };
  // CAMBER — dynamic in life, one static cruise value here: 0.10 chord, deepest at 40% chord.
  // From behind-and-above this is not decoration: a top-viewed FLAT plane shades uniformly and
  // dies. Curvature IS the value gradient across the wing top.
  const camber = (qx, t) => chordAt(qx) * 0.10 * Math.sin(Math.PI * Math.pow(Math.max(0, Math.min(1, t)), 0.8));
  // ⚠ THE TRAILING EDGE IS A FUNCTION OF STATION, not a row of decals. The first attempt drew the
  // cracked-slab bites as additive dark triangles sitting ON the membrane — so the membrane still
  // ran smoothly to full chord and the SILHOUETTE never changed at all. The critic measured the
  // amplitude as "a percent or two" and the top ortho still read as a manta crescent, correctly.
  // Nothing you draw on a surface can alter its outline; the outline is where the surface ENDS.
  // Irregular by construction: one deep bite flanked by small nicks, at uneven intervals.
  // (The chord-function trailing edge, its finger-point bite table and `memPt` are retired: the
  // membrane is now lofted per BAY between adjacent finger bones, so the trailing edge is the
  // scalloped free edge between fingertips rather than a curve sampled off a chord table.)

  const pivots = {}, wingElements = [];
  const sadAcc = { s: [], r: [], w: [] };

  for (const side of [1, -1]) {
    const root = attach.wingRoot(side);
    const rootC = attach.wingRoot(1);
    const pivot = new THREE.Group();
    pivot.position.set(rootC.x, rootC.y, rootC.z);
    pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);

    // Two accumulators so the ARM (shoulder→wrist) rides `mid` and the HAND (wrist→tip) rides
    // `tip`. That split is what makes the fold ONE dramatic hinge at the wrist — the pterosaur
    // fold grammar, and the roster split from Vesper's soft multi-joint curl.
    const accA = new Map(), accH = new Map();
    const pushA = (mat, ...tris) => { let a = accA.get(mat); if (!a) accA.set(mat, a = []); for (const t of tris) a.push(t); };
    const pushH = (mat, ...tris) => { let a = accH.get(mat); if (!a) accH.set(mat, a = []); for (const t of tris) a.push(t); };
    const WX = LE[FX_WRIST_I][1];
    // ⚠ 0.115 gave a top ridge standing 0.029u proud — 0.6px, under the sheet's own 0.02u relief
    // floor, and exactly why the critic read the wing top as "an almost featureless black field".
    // Geometric relief has to exist BEFORE light arrives; "light is withheld" excuses colour and
    // glow, never zero relief.
    const R0 = S(0.20);             // spar base radius — shared by the spar and the propatagium blend

    // ══ THE FINGERED HAND (DRAGON-DESIGN.md §4 — the house WING kit) ════════════════════════════
    // ⚠ THIS REPLACES A SINGLE-SPAR PTEROSAUR HAND, WHICH WAS THE WRONG CALL.
    // DRAGON-DESIGN.md §2 lists "the plane / delta-kite wing" as failure #1, KILL ON SIGHT, and is
    // explicit that "convex scallop lobes whose valleys never cut inward are STILL this failure".
    // A single spar with a chord-function trailing edge is exactly that. The prescribed fix is §4:
    // radiating finger-BONES off the carpal knuckle, membrane CUPPING INWARD between fingertips.
    // The anatomy research that argued for the spar was real, but a shipped house playbook proven
    // on Vesper and Tempest outranks it — and the adjudication that overturned the fan never had
    // the playbook in its brief. Reference implementation: `buildOneStormforkWing` (dragonTempest).
    const K = [LE[FX_WRIST_I][1], leY(LE[FX_WRIST_I][1]) + camber(LE[FX_WRIST_I][1], 0), LE[FX_WRIST_I][2]];

    // A raised tent-ridge bone: shadowed sides + a proud crest cap. §4.2 — "raised tent-ridge
    // wedges, not creases (a 0.014u crease is invisible)"; a lighter rim-catch along each spine is
    // what makes it read as a skeletal ray rather than a painted line.
    const boneRidge = (push, a, b, wB, wT, lift, litCrest) => {
      const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz) || 1;
      const px = -dz / len, pz = dx / len;
      const aL = [a[0] + px * wB, a[1], a[2] + pz * wB], aR = [a[0] - px * wB, a[1], a[2] - pz * wB];
      const bL = [b[0] + px * wT, b[1], b[2] + pz * wT], bR = [b[0] - px * wT, b[1], b[2] - pz * wT];
      const aT = [a[0], a[1] + lift, a[2]], bT = [b[0], b[1] + lift * 0.45, b[2]];
      push(M.scorch, [aL, bL, bT], [aL, bT, aT], [aR, aT, bT], [aR, bT, bR]);       // shadowed sides
      const f = 0.20, u = S(0.010);   // narrow crest: a wide flat cap IS the flat-tape-bone tell
      const cL = [a[0] + px * wB * f, a[1] + lift * 0.62 + u, a[2] + pz * wB * f];
      const cR = [a[0] - px * wB * f, a[1] + lift * 0.62 + u, a[2] - pz * wB * f];
      const dT = [b[0], b[1] + lift * 0.30 + u, b[2]];
      push(litCrest ? M.ashLit : M.scorch, [cL, dT, aT], [cR, aT, dT]);             // struck crest
      push(M.seam, [aL, aR, [a[0], a[1] - lift * 0.30, a[2]]]);                     // dark undercut
    };

    // ── THE FINGER RANK — dominant + decay, never a picket fence (§2.4) ──────────────────────────
    // Finger 0 is the longest and IS the wingtip (§4.2); the rest fan aft, shorter, drooping
    // aft-and-DOWN (never up-curl). Azimuth and length carry deterministic jitter so the rank reads
    // as an organic hand, not a comb of equal strips.
    // Length decay follows the house reference rather than a steep 0.66-per-rank: too steep and the
    // fingertips bunch inboard, the bay cusps overrun the next tip, and the scalloped free edge
    // collapses into ONE broad hump — which is the plane wing again.
    // ⚠ THE FAN IS RELATIVE TO THE LEADING EDGE, NOT TO THE BODY AXIS. Absolute azimuths were the
    // bug: once the leading edge sweeps aft as an ogee, fingers authored at fixed angles from +x
    // end up pointing FORWARD of it and the hand stops agreeing with the arm. Vesper derives
    // phi0 = atan2(F0 - K) and rakes each finger aft from THERE, so the whole hand inherits the
    // curve's direction — which is what makes every line in the wing agree on one flow.
    const LENF = [1.00, 0.76, 0.58, 0.40];      // dominant + decay, shallower than before: the hand read "starved and vestigial" against Tempest, which keeps chord out through mid-hand
    // ⚠ CAP THE RAKE SO NO FINGER ENTERS THE BODY CORRIDOR. At 1.05 rad the aft finger sat at 96.6°
    // ABSOLUTE — pointing backward-inboard — so its bone swept into the torso on every downstroke and
    // read in-game as a spoke colliding with the body. Inboard of the hand there should be no bone at
    // all: that region is the plagiopatagium SHEET (§4.7's root gusset). 0.73 rad puts the aft finger
    // at ~78°, clear of the corridor, and hands the inboard area back to the membrane where it belongs.
    const SPANAFT = 0.73;                        // total aft rake of the fan, radians
    const DROOP = [0.05, 0.17, 0.28, 0.39];
    const NF = LENF.length, NS = 4;
    const jit = (i, amp) => { const h = Math.sin((i + 1) * 78.233 + 2.7) * 43758.5453; return (h - Math.floor(h) - 0.5) * 2 * amp; };
    const spars = [];
    {
      const s0 = [];
      for (let k = 0; k <= NS; k++) {
        const t = FX_WRIST_T + (0.86 - FX_WRIST_T * 0.86) * (k / NS) + (1 - 0.86) * 0 ;
        // ⚠ NO free spike on finger 0. The tip must resolve at ONE point: the leading edge and the
        // outermost membrane converge there. Running the bone past the membrane here gave the
        // "multi-prong cluster" tip the art director flagged — the eye exits the wing in three
        // places instead of one, which restates the spoke-fan thesis in miniature.
        const tt = FX_WRIST_T + (1 - FX_WRIST_T) * (k / NS);
        const P = LEt(tt);
        s0.push([P[0], P[1] + camber(P[0], 0), P[2]]);
      }
      // draw the leading bone along the curve so the ridge follows it, tapering outboard
      for (let k = 0; k < NS; k++) {
        const f = k / NS;
        boneRidge(pushH, s0[k], s0[k + 1], R0 * (0.46 - 0.20 * f), R0 * (0.40 - 0.22 * f), R0 * (1.05 - 0.45 * f), true);
      }
      spars.push(s0);
    }
    const F0c = spars[0][NS];
    const phi0 = Math.atan2(F0c[2] - K[2], F0c[0] - K[0]);
    const r0 = Math.hypot(F0c[0] - K[0], F0c[2] - K[2]);
    for (let i = 1; i < NF; i++) {
      const az = phi0 + SPANAFT * (i / (NF - 1)) + jit(i * 3 + 1, 0.05);
      const Ln = r0 * LENF[i] * (1 + jit(i * 3 + 5, 0.06));
      const tipP = [K[0] + Math.cos(az) * Ln, K[1] - DROOP[i] * Ln, K[2] + Math.sin(az) * Ln];
      // the KNUCKLE at ~58% — a forward-outboard bow plus a small Y jog, so the bone is STEPPED
      // rather than a smooth arc (an arc reads feather; a knuckled bone reads hand)
      const cdx = tipP[0] - K[0], cdz = tipP[2] - K[2], clen = Math.hypot(cdx, cdz) || 1;
      const kn = 0.58, bow = (i === 0 ? 0.055 : 0.17) * clen;   // finger 0 bows LEAST: it is the leading edge, and P2 has a ceiling
      const pfx = cdz / clen, pfz = -cdx / clen, yj = (i === 0 ? -0.015 : (i % 2 ? 1 : -1) * 0.045) * Ln;
      const Bm = [K[0] + cdx * kn + pfx * bow, K[1] + (tipP[1] - K[1]) * kn + yj, K[2] + cdz * kn + pfz * bow];
      const wB = R0 * (0.46 - 0.06 * i), wM = wB * 0.48, lift = R0 * (1.05 - 0.11 * i);   // fatter root, harder taper, taller ridge
      boneRidge(pushH, K, Bm, wB, wM, lift, i === 0);
      boneRidge(pushH, Bm, tipP, wM, S(0.010), lift * 0.65, i === 0);
      // knuckle housing — a proud welded boss at the kink (skip finger 0: keeps the leading edge clean)
      if (i > 0) {
        const r = R0 * 0.16 * (1 - 0.10 * i);
        pushH(M.ashLit, [[Bm[0] - r, Bm[1] + r * 0.5, Bm[2] - r], [Bm[0] + r, Bm[1] + r * 0.5, Bm[2] - r], [Bm[0], Bm[1] + r * 1.7, Bm[2] + r]]);
        pushH(M.seam, [[Bm[0] - r, Bm[1] + r * 0.5, Bm[2] - r], [Bm[0] + r, Bm[1] + r * 0.5, Bm[2] - r], [Bm[0], Bm[1] - r * 0.4, Bm[2] + r * 0.3]]);
      }
      // ⚠ The membrane stops SHORT of the bone tip (0.86), so every finger projects a free spike
      // past the sheet — Tempest does this on all four and it is what makes digits read as
      // separate digits at silhouette scale instead of smearing into a serration.
      const MEMEND = 0.86;
      const s = [];
      for (let k = 0; k <= NS; k++) {
        const t = (k / NS) * MEMEND;
        s.push(t <= 0.58 ? lerp3(K, Bm, t / 0.58) : lerp3(Bm, tipP, (t - 0.58) / 0.42));
      }
      spars.push(s);
    }
    const F0 = spars[0][NS];                                          // the wingtip = finger 0's tip

    // ── THE BAY MEMBRANES — CUPPING INWARD (§4.3, the single highest-value fix in the house rework)
    // Concave arcs with the control pulled toward the knuckle (cup ~0.34), sampled at NS≥4 segments
    // (2 segments polylines into scissor-cut V teeth — failure #12). Every membrane edge IS a bone
    // node, so the sheet cannot float off the skeleton. Aft bays sag harder so the SIDE profile
    // scallops between fingers instead of collapsing into one flat sail.
    // ⚠ Deep, and NOT tapering inboard. The house table decays the cut outboard→inboard because it
    // has 5 fingers and the inboard bays are small anyway; with 4 fingers that decay left the
    // mid-span trailing edge as one plain convex lobe — the exact residue the playbook names
    // ("convex scallop lobes whose valleys never cut inward are STILL this failure"). Every bay
    // has to cut, or the failure survives at mid-span even once it is dead at the tips.
    // ⚠ ONE constant, not a per-bay array. §4.3 specifies a single `cup` dial precisely so each bay's
    // scallop stays PROPORTIONAL to its own width — the finger lengths already decay, so a constant
    // cup yields scallops that scale down cleanly outboard. A per-bay array breaks that progression
    // and the trailing edge stops reading as one rhythm. Still capped well under a third of chord:
    // deep enough to READ, never deep enough to HOLLOW.
    const CUPK = 0.42;
    const trailing = [];
    for (let i = 0; i < NF - 1; i++) {
      const fa = spars[i], fb = spars[i + 1];
      const chord = Math.hypot(fb[NS][0] - fa[NS][0], fb[NS][1] - fa[NS][1], fb[NS][2] - fa[NS][2]) || 1;
      const billow = 0.20 * chord * (0.55 + 0.90 * (i / Math.max(1, NF - 2)));
      const scal = CUPK * (0.94 + 0.12 * ((i * 0.618) % 1));   // one constant + a hair of jitter, never a per-bay table
      const mid = [];
      for (let k = 0; k <= NS; k++) {
        const saf = k / NS;
        const m = [(fa[k][0] + fb[k][0]) / 2, (fa[k][1] + fb[k][1]) / 2, (fa[k][2] + fb[k][2]) / 2];
        m[1] -= billow * (0.30 + 0.70 * saf);                          // ventral cup — the dome that holds air
        // FULL pull toward the knuckle in both X and Z — this is the house cut (Tempest does the
        // same). Weakening the X component to keep cusps "between" tips produced shallow bumps
        // instead of notches: the deep V that reads as fingers comes from the cusp travelling a
        // long way back toward the wrist, not from a gentle arc.
        if (k > 0) { m[0] += (K[0] - m[0]) * scal * saf; m[1] += (K[1] - m[1]) * scal * saf * 0.4; m[2] += (K[2] - m[2]) * scal * saf; }
        mid.push(m);
      }
      for (let k = 0; k < NS; k++) {
        // value bands (§4.5): the taut leading half catches, the deep cup falls away
        pushH(k < 2 ? M.scorch : wingMat, [fa[k], fa[k + 1], mid[k + 1]], [fa[k], mid[k + 1], mid[k]]);
        pushH(k < 1 ? wingMat : memDeep,  [mid[k], mid[k + 1], fb[k + 1]], [mid[k], fb[k + 1], fb[k]]);
      }
      if (i === 0) trailing.push(fa[NS]);
      trailing.push(mid[NS], fb[NS]);
    }

    // ── SAIL RELIEF — ribs + plate islands on the MEMBRANE FIELD ─────────────────────────────────
    // ⚠ All the relief budget had gone to the leading edge, leaving the sail as large blank facets —
    // and the sail is exactly what a behind-and-above camera looks DOWN ONTO. Ribs give the field
    // value breaks even unlit (a tented ridge shades on both flanks); the plate islands are the
    // torso's slag language carried onto the membrane so the wing belongs to the same creature.
    for (let i = 0; i < NF - 1; i++) {
      const fa = spars[i], fb = spars[i + 1];
      // one rib per bay, riding the sheet from near the knuckle out toward the free edge
      const RN = 6;
      for (let k = 1; k < RN - 1; k++) {   // stop short of the free edge: a rib tip past the scallop is a bare needle
        const u0 = k / RN, u1 = (k + 1) / RN;
        const on = (u) => {
          const q = Math.min(NS - 1e-3, u * NS), k0 = Math.floor(q), f = q - k0;
          const A2 = lerp3(fa[k0], fa[Math.min(NS, k0 + 1)], f), B2 = lerp3(fb[k0], fb[Math.min(NS, k0 + 1)], f);
          return lerp3(A2, B2, 0.42);
        };
        const p0 = on(u0), p1 = on(u1);
        if (u1 > 1) break;
        const h = R0 * 0.30 * (1 - u0 * 0.55), w = R0 * 0.24 * (1 - u0 * 0.4);
        const dx = p1[0] - p0[0], dz = p1[2] - p0[2], dn = Math.hypot(dx, dz) || 1;
        const nx = -dz / dn, nz = dx / dn;
        const a0 = [p0[0] + nx * w, p0[1], p0[2] + nz * w], b0 = [p0[0] - nx * w, p0[1], p0[2] - nz * w];
        const a1 = [p1[0] + nx * w, p1[1], p1[2] + nz * w], b1 = [p1[0] - nx * w, p1[1], p1[2] - nz * w];
        const c0 = [p0[0], p0[1] + h, p0[2]], c1 = [p1[0], p1[1] + h * 0.92, p1[2]];
        pushH(M.scorch, [a0, a1, c1], [a0, c1, c0]);          // lit flank
        pushH(memDeep,  [b0, c0, c1], [b0, c1, b1]);          // shadow flank
      }
      // two cooled-slag plate islands per bay, on a broken duty so they never read as a row
      for (let k = 0; k < 2; k++) {
        const u = 0.34 + 0.30 * k, v = 0.30 + 0.22 * ((i + k) % 2);
        const q = Math.min(NS - 1e-3, u * NS), k0 = Math.floor(q), f = q - k0;
        const A2 = lerp3(fa[k0], fa[Math.min(NS, k0 + 1)], f), B2 = lerp3(fb[k0], fb[Math.min(NS, k0 + 1)], f);
        const c = lerp3(A2, B2, v);
        const r = R0 * (0.40 - 0.08 * k), lift = R0 * 0.16;
        pushH(M.ashLit, [[c[0] - r, c[1] + lift, c[2] - r * 0.7], [c[0] + r * 0.9, c[1] + lift, c[2] - r * 0.4],
                         [c[0] + r * 0.2, c[1] + lift, c[2] + r]]);
        pushH(M.seam,   [[c[0] - r, c[1] + lift, c[2] - r * 0.7], [c[0] + r * 0.2, c[1] + lift, c[2] + r],
                         [c[0] - r * 0.5, c[1], c[2] + r * 0.2]]);
      }
    }

    // ── THE PLAGIOPATAGIUM — arm sheet to the BODY ANCHOR, trailing edge continuing the scallop.
    // §4.7's root gusset: the whole trailing line tapers/cups from the last fingertip down to the
    // hip in ONE continuous concave curve — a straight inboard bar is the plane whisper at the root.
    // ⚠ THE ROOT ANCHOR MUST SIT WELL INSIDE THE HULL. At -0.10 it landed barely inboard of the
    // shoulder, so along the seam a thin wedge of SKY survived between the inner membrane and the
    // flank — daylight through the wing inside its own perimeter, the classic stuck-on tell, and
    // the single item blocking the quality gate. Drive it deep and let the torso occlude the excess.
    // ⚠ ANCHORED AFT, past the hip and onto the tail root (z 1.55 -> 2.15). Owner: the trailing edge
    // should meet the body "toward the back of the torso, more towards the tail". That is also the
    // anatomically stronger read — the membrane research is unambiguous that bats and pterosaurs
    // carry the plagiopatagium to the ANKLE, never stopping at the hip, and a longer root seam is
    // what makes the wing continuous with the body instead of parked beside it.
    // ⚠ AND IT RIDES A ROTATING BONE, WHICH BOUNDS WHAT THIS ANCHOR CAN EVER DO. The flap is very
    // nearly PURE ROLL: across the five cycle phases the pivot's z rotation swings 0.40 → −0.63 rad
    // while x moves 0.009 and y not at all. So a vertex welded here travels an arc whose radius is
    // its distance from the roll axis — hypot(x, y) in this frame; z does not enter it. The torso
    // surface is only ~0.27u from that axis outboard, so ANY anchor with hypot(x, y) > ~0.27 must
    // cross the hull surface somewhere in the cycle, and each crossing drags a moving intersection
    // line across the flank — the "tattered, see-through" join reported from play.
    // This anchor sits at r ≈ 0.62. It CANNOT be made compliant by moving it: a 48-point sweep of
    // (x, y, sink) with `flapclearance` as the oracle found no position that clears both crossing
    // asserts, and no dragon in the shipped roster anchors membrane this far aft — that is why.
    // The sink below is a real mitigation (it clears the sweep-in assert outright, which is the
    // half the owner actually saw), not a cure; the cure is a STATIC body-side aft web so the
    // crossing happens under body geometry. Specified in the buildsheet, not yet built.
    // z is free either way, so the owner's ask — carry the trailing edge aft toward the tail —
    // costs nothing here and is kept at 2.15.
    // ⚠ THE ANCHOR COMES FORWARD — to the FATTEST hull station, which is the variable the 48-point
    // sweep never moved. That sweep varied (x, y, sink) and concluded the crossing was structural:
    // a vertex at r≈0.62 from the roll axis against a hull surface ~0.27 away must cross. The radius
    // maths was right and the conclusion was wrong, because it held z FIXED. z does not enter the
    // arc radius — but it decides WHICH HULL STATION the arc is measured against. At z 2.15 the hull
    // is rx≈0.31; at the shoulder girdle it is rx≈0.60, nearly double. Tempest is exempt from the
    // surfacing assert for that reason and no other: its anchor (B = [-0.34,-0.42,0.10], ABSOLUTE,
    // not ×hs — 0.024 of half-span aft) is buried in the deepest station in its body.
    // The owner's aft reach is not abandoned, it CHANGES OWNER: a static body-frame fairing carries
    // the line to the tail root, where it cannot cross a hull it does not rotate against.
    const B = [-S(0.30), K[1] - S(0.48), S(0.45)];                     // shoulder-girdle anchor, wing-local
    // ⚠ THE SEPARATION NOTCH. The plagiopatagium must NOT start at the last fingertip, or the last
    // bay and the body sheet blend into one continuous curve and the digit stops reading as a
    // digit — Tempest's notch here is unmistakable and ours was absent. Anchoring it partway back
    // along the last finger cuts a deep V between the hand and the arm sheet, which is also the
    // bay the planform probe measured as the shallowest (6% against a 10% floor).
    // ⚠ THE ARMPIT WEDGE. Pulling this far back opened a cut deeper than half the local chord between
    // the arm sheet and the hand fan — the one cut deep enough to threaten silhouette integrity in
    // motion. The separation notch has to READ without hollowing the wing.
    // ⚠ 0.66 → 0.80 to close the APEX WINDOW. At apex the torso swings behind the gap between the hand
    // fan and the arm sheet and caps its open end, turning the separation notch into an ENCLOSED
    // window — 9.44% of the planform in enclosed daylight against a 9.0% bar (holecensus H2).
    // The instinct is to shrink the notch; that is backwards and the sweep proved it — a SHALLOWER
    // notch encloses MORE (0.60→9.69%, 0.54→9.98%, 0.48→10.33%) because the membrane reaches further
    // round the gap and seals its escape to open sky. Cutting DEEPER keeps the notch open at the
    // outboard end so the daylight drains to the outside instead of being trapped: 0.74→9.08,
    // 0.82→8.76, 0.90→8.37. 0.80 clears the bar with margin without pushing the cut toward the
    // armpit-wedge depth this section already warns about. Planform stays 12/12 at every value tried.
    const Tlast = lerp3(K, spars[NF - 1][NS], 0.80);
    const bz = (a, c, b, t) => { const m = 1 - t; return [m * m * a[0] + 2 * m * t * c[0] + t * t * b[0], m * m * a[1] + 2 * m * t * c[1] + t * t * b[1], m * m * a[2] + 2 * m * t * c[2] + t * t * b[2]]; };
    const teMid = lerp3(Tlast, B, 0.5);
    const teCtrl = [teMid[0] + (K[0] - teMid[0]) * 0.42, teMid[1] + (K[1] - teMid[1]) * 0.42 - S(0.16), teMid[2] + (K[2] - teMid[2]) * 0.42];
    // ⚠ THE ROOT SINK — the fix for the "tattered, see-through wing-body join" reported from play,
    // and the reason `flapclearance` exists. The inboard run of this sheet was authored GRAZING the
    // flank (world x ≈ 0.55 against a ±0.54 hull), which is the one place a rigid surface must never
    // sit: the sheet is welded to a rotating bone, so every pose in the cycle carries it across the
    // hull surface, and each crossing drags a moving intersection line over the torso. Depth of
    // burial is invisible — the torso occludes it at any depth — but a CROSSING is visible at 1px.
    // So the inboard run is sunk past the swing amplitude (~0.5u at this radius) and stays buried
    // through all five phases; the membrane now emerges from the flank at a fixed line, which is
    // exactly the sealed root the house kit asks for (DRAGON-DESIGN §4.7).
    // The ramp is superlinear so the OUTBOARD half of the trailing edge — the scalloped part the
    // eye actually reads — is untouched; only the last third moves.
    const teN = 5, tePts = [], mPts = [];
    for (let k = 0; k <= teN; k++) {
      const t = k / teN;
      const p = bz(Tlast, teCtrl, B, t);
      tePts.push(p);
      // ⚠ B3. The mid-band drop USED to deepen toward the body (0.4 + 0.6t), which put the sharpest
      // crease exactly where the sheet meets the flank — so the inner band, the outer band and the
      // lifted edge read as three stacked strands at grazing angles instead of one surface. Taper it
      // to nothing at the anchor: the fold is a form cue out on the sheet and a defect at the weld.
      const m = lerp3(K, p, 0.55); m[1] -= S(0.13) * (0.95 - 0.85 * t); mPts.push(m);
    }
    // ⚠ A GRADUATED RAMP, not one step. `k < 2 ? scorch : wingMat` put a single hard boundary —
    // L 0.09 → 0.026, a 3.5× value cliff — along the WHOLE length of the sheet, coincident with the
    // mPts fold. A fold and a 3.5× cliff on the same line is a strand by construction, whatever the
    // silhouette does. Tempest indexes a 4-tier ramp by station (dragonTempest.js:776-777) so the
    // inner and outer bands step at DIFFERENT stations: no single boundary is both long and
    // high-contrast, and the steps migrate along the sheet instead of drawing a seam down it.
    const TIER = [M.scorch, wingMat, memDeep];
    const tier = (v) => TIER[Math.max(0, Math.min(2, Math.round(v)))];
    for (let k = 0; k < teN; k++) {
      const fw = k / teN;                                              // 0 at the wrist, 1 at the anchor
      pushA(tier(0.15 + 1.0 * fw), [K, mPts[k + 1], mPts[k]]);         // taut inner band
      pushA(tier(0.95 + 1.1 * fw), [mPts[k], mPts[k + 1], tePts[k + 1]], [mPts[k], tePts[k + 1], tePts[k]]);
    }
    // ⚠ THE SHOULDER FILL — REBUILT TO TEMPEST'S TOPOLOGY, and this is where the owner's "spokes"
    // actually came from. It used to be a 5-triangle fan around a dropped `sag` point, in TWO
    // materials, with `mid2 = lerp3(SH0, B, 0.5)` and `sag` both DERIVED FROM THE AFT ANCHOR. When
    // the anchor was pushed to z 2.15 to carry the trailing edge toward the tail, those two
    // armpit-sized triangles silently stretched into 3-unit straps running the whole flank at a
    // depth the membrane does not share — slicing through the torso and emerging on the dorsal
    // surface and under the belly. A per-surface pixel census put this fill at 24-29% of every
    // junction pixel at every phase. The spokes were added by a change made somewhere else.
    // Tempest fills the same corner with ONE fan, ONE material, sharing its edges with the
    // plagiopatagium rather than stacking a second plane behind it (dragonTempest.js:779).
    {
      const SH0 = [-S(0.26), LE[0][4] + camber(0, 0), LE[0][2]];   // inboard of the joint: the fill starts INSIDE the flank
      pushA(M.scorch, [SH0, [0, leY(0) + camber(0, 0), leZ(0)], K], [SH0, K, B]);
    }
    // ⚠ B3. Record where the INBOARD run starts. The knife-edge below must not be built along it:
    // over the scalloped hand the band IS the edge, but along the root run it is a second surface
    // lifted off the sheet, and at the grazing angles the flank view gives it that lift opens a
    // daylight seam — the carried I4 item's exact words, and half of what the owner has twice called
    // "spokes". The band stops at the notch; the root run gets the fillet instead.
    const teRootStart = trailing.length;
    for (let k = 1; k <= teN; k++) trailing.push(tePts[k]);

    // ── THE CONNECTED KNIFE-EDGE (§4.6) — ONE strip tracing the WHOLE scalloped trailing polyline.
    // Per-bay shards read as floating debris, which this file has already been burned by four times.
    if (trailing.length > 1) {
      // ⚠ 0.07 is a HAIRLINE over the plagiopatagium's long trailing run — from the chase camera it
      // reads as a rigging wire strung across open sky, not as an edge. Widen the inset so the band
      // always has real width, and lift it enough to sit on the sheet rather than beside it.
      const et = [], inb = (p) => [p[0] + (K[0] - p[0]) * 0.16, p[1] + (K[1] - p[1]) * 0.16 + S(0.010), p[2] + (K[2] - p[2]) * 0.16];
      // ⚠ Do not span a large gap. The trailing polyline jumps across the separation notch, and a
      // quad stretched over that jump is a long thin blade floating clear of the wing — read as
      // "orphan geometry off the trailing edge". Break the strip instead of bridging.
      const GAPMAX = S(0.95);
      for (let s2 = 0; s2 < trailing.length - 1; s2++) {
        if (s2 >= teRootStart - 1) break;          // B3: no lifted band along the root run
        const a = trailing[s2], b = trailing[s2 + 1];
        if (Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) > GAPMAX) continue;
        const ai = inb(a), bi2 = inb(b);
        et.push([a, b, bi2], [a, bi2, ai]);
      }
      pushH(memDeep, ...et);   // the knife-edge is membrane, not a recess
    }
    // (The old W1b root skirt is gone: the plagiopatagium now anchors at NEGATIVE x on the hip
    // (B), so the sheet buries in the hull along its whole length and the torso occludes the
    // join — the house §4.7 root gusset, which does the weld properly instead of patching it.)

    // ── W2 THE SPAR ─────────────────────────────────────────────────────────────────────────────
    // A 4-sided prism walked along the LE polyline with a TAPERING radius (1.00/0.62/0.38/0.22/0.10
    // at shoulder/elbow/wrist/mid-hand/tip). A CONSTANT-radius spar reads as a BAR however elegantly
    // it is curved — that is the failure most likely to survive a correct planform. The top ridge is
    // the dorsal structure our behind-and-above camera actually looks at.
    for (let i = 0; i < LE.length - 1; i++) {
      const A = LE[i], B = LE[i + 1];
      const push = (A[1] < WX - 1e-6) ? pushA : pushH;
      const ra = R0 * A[3], rb = R0 * B[3];
      const dx = B[1] - A[1], dz = B[2] - A[2], dn = Math.hypot(dx, dz) || 1;
      const nx = -dz / dn, nz = dx / dn;                       // in-plane normal
      // ⚠ INBOARD, THE BONE SITS BEHIND THE MEMBRANE. Ref §4.9.8: "the arm must sit INSIDE a
      // membrane curve, not BE the edge" — a wing whose humerus is the leading edge looks like
      // scaffolding. The humerus is the FATTEST element, so without this bias its forward face
      // (0.5r ≈ 0.058u at the shoulder) out-runs the propatagium bow, which is ~0 at the shoulder
      // by construction. The spar then owns the inboard silhouette and flattens the propatagium
      // arc into a straight line — measurably: inboard forward camber collapsed to 1.5% of L
      // against a 2% floor. Bias the centreline aft by its own forward radius, tapering to 0 at
      // the wrist (outboard, the bone IS legitimately the leading edge).
      // Cubic, not linear: a linear taper gives back half the compensation by mid-arm, and with a
      // thicker spar that is enough for the bone to out-run the propatagium again (inboard camber
      // fell back to 1.4% of L). Hold the bias across the arm and release it only near the wrist,
      // where the bone legitimately becomes the leading edge.
      const bias = (P) => (P[1] < WX ? R0 * P[3] * 0.5 * (1 - Math.pow(P[1] / WX, 3)) : 0);
      const ring = (P, r) => { const q = bias(P); return [
        [P[1] + nx * r, leY(P[1]) + camber(P[1], 0) + r * 0.85, P[2] + nz * r + q],       // top ridge
        [P[1] + nx * r * 1.15, leY(P[1]) + camber(P[1], 0), P[2] + nz * r * 1.15 + q],    // aft cheek
        [P[1] + nx * r, leY(P[1]) + camber(P[1], 0) - r * 0.7, P[2] + nz * r + q],        // underside
        [P[1] - nx * r * 0.5, leY(P[1]) + camber(P[1], 0), P[2] - nz * r * 0.5 + q],      // forward face
      ]; };
      const RA = ring(A, ra), RB = ring(B, rb);
      for (let k = 0; k < 4; k++) {
        const k1 = (k + 1) % 4;
        // NO pale rail running along the spar: a bright dashed line down a bone is cheap-tell #1
        // (flat bright tape). The pale tier is spent on the JOINTS instead — the wrist boss and
        // the phalanx knuckles — so value marks STRUCTURE rather than tracing an outline.
        push(k === 2 ? M.seam : M.scorch, [RA[k], RB[k1], RB[k]], [RA[k], RA[k1], RB[k1]]);
      }
      // ── THE SLAG CRUST — the wing top's relief rank ────────────────────────────────────────
      // Crust plates standing proud of the spar ridge, each with a pale struck crest and a dark
      // under-gap. This is the torso's rank language carried onto the wing: value marks STRUCTURE
      // (core -> bloom -> dark on every plate), and it is what the behind-and-above camera is
      // actually pointed at. Broken period-7 duty so the crests never read as a metronome.
      {
        const NP = 3;
        for (let j = 0; j < NP; j++) {
          const t0 = j / NP, t1 = (j + 1) / NP;
          const Pt = (t) => [A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t, R0 * (A[3] + (B[3] - A[3]) * t)];
          const p0 = Pt(t0), p1 = Pt(t1 - 0.12);
          const y0 = leY(p0[0]) + camber(p0[0], 0), y1 = leY(p1[0]) + camber(p1[0], 0);
          const H0 = p0[2] * 1.55, H1 = p1[2] * 1.55;               // crest stands 1.55r above centre
          const w0 = p0[2] * 0.55, w1 = p1[2] * 0.55;
          // ⚠ the plate's own half-width has to clear the bone line too, or the CRUST becomes the
          // inboard leading edge and re-flattens the propatagium arc — the same trap as the spar
          // itself, one layer out. Inboard, seat the whole plate aft of the centreline.
          const q0 = bias([null, p0[0], 0, 0]) + (p0[0] < WX ? w0 : 0);
          const q1 = bias([null, p1[0], 0, 0]) + (p1[0] < WX ? w1 : 0);
          // Broken duty expressed as CREST HEIGHT, not as a second pale material. Two pale tiers
          // on the wing would cost a mesh per accumulator per side AND let the wing compete with
          // the dorsal serration, which the sheet requires to stay dominant. So the wing tops out
          // at ashLit; rim stays a torso tier. Duty is period-7 and irregular either way.
          const lit = ((i * 3 + j * 2 + 1) % 7) < 3;
          const crest = lit ? 1.0 : 0.62;
          const o0 = [p0[0] + nx * w0, p0[1] + nz * w0 + q0], o1 = [p1[0] + nx * w1, p1[1] + nz * w1 + q1];
          const iA = [p0[0] - nx * w0, p0[1] - nz * w0 + q0], iB = [p1[0] - nx * w1, p1[1] - nz * w1 + q1];
          // ⚠ SEAT AND CAP EVERY PLATE. These were open 3-sided ribbons hovering over the spar
          // with no end caps and no skirt down to the surface — so from most angles they read as
          // a cloud of detached pale chips around the shoulder, which the critic called the worst
          // thing in the set and "z-fighting shrapnel". A raised element that does not visibly
          // MEET the surface it sits on is debris, however correct its top face is.
          const B0 = y0 + H0 * 0.35, B1 = y1 + H1 * 0.35;        // where the plate meets the spar
          const T0 = y0 + H0 * crest, T1 = y1 + H1 * crest;
          push(M.scorch, [[o0[0], B0, o0[1]], [o1[0], B1, o1[1]], [o1[0], T1, o1[1]]],
                         [[o0[0], B0, o0[1]], [o1[0], T1, o1[1]], [o0[0], T0, o0[1]]]);
          push(M.seam,   [[iA[0], B0, iA[1]], [iB[0], T1, iB[1]], [iB[0], B1, iB[1]]],
                         [[iA[0], B0, iA[1]], [iA[0], T0, iA[1]], [iB[0], T1, iB[1]]]);
          // the struck crest — pale, on EDGES only, never a patch (AAA tell #1)
          push(M.ashLit,
            [[o0[0], T0, o0[1]], [o1[0], T1, o1[1]], [iB[0], T1, iB[1]]],
            [[o0[0], T0, o0[1]], [iB[0], T1, iB[1]], [iA[0], T0, iA[1]]]);
          // END CAPS — both ends closed, so the plate is a solid, not a ribbon
          push(M.scorch, [[o0[0], B0, o0[1]], [o0[0], T0, o0[1]], [iA[0], T0, iA[1]]],
                         [[o0[0], B0, o0[1]], [iA[0], T0, iA[1]], [iA[0], B0, iA[1]]]);
          push(M.seam,   [[o1[0], B1, o1[1]], [iB[0], T1, iB[1]], [o1[0], T1, o1[1]]],
                         [[o1[0], B1, o1[1]], [iB[0], B1, iB[1]], [iB[0], T1, iB[1]]]);
          // SKIRT down to the spar centre-line, so the plate visibly grows out of the bone
          const sy0 = y0 - p0[2] * 0.10, sy1 = y1 - p1[2] * 0.10;
          push(M.seam, [[o0[0], B0, o0[1]], [o1[0], B1, o1[1]], [p1[0], sy1, p1[1] + q1]],
                       [[o0[0], B0, o0[1]], [p1[0], sy1, p1[1] + q1], [p0[0], sy0, p0[1] + q0]],
                       [[iA[0], B0, iA[1]], [p0[0], sy0, p0[1] + q0], [p1[0], sy1, p1[1] + q1]],
                       [[iA[0], B0, iA[1]], [p1[0], sy1, p1[1] + q1], [iB[0], B1, iB[1]]]);
        }
      }
      // knuckle boss at each phalanx joint outboard of the wrist — a CLOSED wedge seated on the
      // spar, not a lone floating triangle (the critic read those as placeholder shards)
      if (i >= FX_WRIST_I && i < LE.length - 2) {
        const r = R0 * B[3], by = leY(B[1]) + camber(B[1], 0), q = bias(B);
        const c = [B[1], B[2] + q];
        const ring2 = [[c[0] + nx * r * 1.5, c[1] + nz * r * 1.5], [c[0] - nx * r * 1.1, c[1] - nz * r * 1.1],
                       [c[0] + nx * r * 0.2 - nz * r * 1.2, c[1] + nz * r * 0.2 + nx * r * 1.2],
                       [c[0] + nx * r * 0.2 + nz * r * 1.2, c[1] + nz * r * 0.2 - nx * r * 1.2]];
        const apex = [c[0], by + r * 2.0, c[1]];
        for (let k = 0; k < 4; k++) {
          const k1 = (k + 1) % 4;
          push(k === 0 ? M.ashLit : M.scorch,
            [[ring2[k][0], by + r * 0.5, ring2[k][1]], [ring2[k1][0], by + r * 0.5, ring2[k1][1]], apex]);
        }
        push(M.seam, [[ring2[1][0], by + r * 0.5, ring2[1][1]], [ring2[2][0], by + r * 0.5, ring2[2][1]],
                      [c[0], by - r * 0.35, c[1]]]);
      }
    }

    // ── W2a THE ARM MASS — deltoid swell + elbow node ───────────────────────────────────────────
    // ⚠ Plates on a bar do not make a limb. The critic's standing note: "the plates dressed the
    // bar; they did not change its mass" — the arm still read as a uniform beam into a wrist step,
    // with no upper-arm swell out of the shoulder and no elbow node. Muscle mass is what says the
    // wing can PULL rather than merely hold shape, and the thickness ladder (humerus 1.00 ->
    // forearm 0.80) only describes BONE. This is the flesh over it.
    // Everything here builds UP and AFT of the leading edge — a forward breach would re-take the
    // silhouette from the propatagium, which is the trap that has already caught the spar, the
    // crust plates, the wrist boss and the claws in this file.
    {
      const SH0 = LE[0], EL = LE[1], FA = LE[2];
      const seg = [[SH0, EL, 1.00, 0.72], [EL, FA, 0.72, 0.42]];   // [from, to, r0, r1] of R0
      for (const [P, Q, f0, f1] of seg) {
        const dx = Q[1] - P[1], dz = Q[2] - P[2], dn = Math.hypot(dx, dz) || 1;
        const nx = -dz / dn, nz = dx / dn;
        const bA = R0 * P[3] * 0.5 * (1 - Math.pow(P[1] / WX, 3));
        const bB = R0 * Q[3] * 0.5 * (1 - Math.pow(Q[1] / WX, 3));
        const rA = R0 * f0 * 1.75, rB = R0 * f1 * 1.75;            // flesh is FATTER than the bone
        const yA = leY(P[1]) + camber(P[1], 0), yB = leY(Q[1]) + camber(Q[1], 0);
        // a swollen lozenge seated on the spar: crown, aft flank, and a dark undercut
        const crownA = [P[1], yA + rA * 1.05, P[2] + nz * rA * 0.45 + bA];
        const crownB = [Q[1], yB + rB * 1.05, Q[2] + nz * rB * 0.45 + bB];
        const aftA = [P[1] + nx * rA * 1.5, yA + rA * 0.15, P[2] + nz * rA * 1.5 + bA];
        const aftB = [Q[1] + nx * rB * 1.5, yB + rB * 0.15, Q[2] + nz * rB * 1.5 + bB];
        const fwdA = [P[1] - nx * rA * 0.25, yA + rA * 0.30, P[2] - nz * rA * 0.25 + bA];
        const fwdB = [Q[1] - nx * rB * 0.25, yB + rB * 0.30, Q[2] - nz * rB * 0.25 + bB];
        pushA(M.scorch, [fwdA, crownA, crownB], [fwdA, crownB, fwdB]);        // lit shoulder of the mass
        pushA(M.ashLit, [crownA, aftA, aftB], [crownA, aftB, crownB]);        // the crest catches
        pushA(M.seam,   [aftA, [P[1] + nx * rA * 0.9, yA - rA * 0.45, P[2] + nz * rA * 0.9 + bA],
                         [Q[1] + nx * rB * 0.9, yB - rB * 0.45, Q[2] + nz * rB * 0.9 + bB]],
                        [aftA, [Q[1] + nx * rB * 0.9, yB - rB * 0.45, Q[2] + nz * rB * 0.9 + bB], aftB]);
      }
      // THE ELBOW NODE — a closed wedge, the joint the eye needs to see the arm bend about
      {
        const E = LE[1], r = R0 * 0.94, by = leY(E[1]) + camber(E[1], 0);   // +30%: the kink has to read at ~180px
        const b = R0 * E[3] * 0.5 * (1 - Math.pow(E[1] / WX, 3));
        const c = [E[1], E[2] + b];
        const ring = [[c[0] + r * 1.25, c[1] + r * 0.30], [c[0] - r * 0.55, c[1] + r * 1.30],
                      [c[0] - r * 1.10, c[1] + r * 0.10], [c[0] - r * 0.35, c[1] - r * 0.95]];
        const apex = [c[0] - r * 0.10, by + r * 1.85, c[1] + r * 0.25];
        for (let k = 0; k < 4; k++) {
          const k1 = (k + 1) % 4;
          pushA(k === 1 ? M.ashLit : M.scorch,
            [[ring[k][0], by + r * 0.40, ring[k][1]], [ring[k1][0], by + r * 0.40, ring[k1][1]], apex]);
        }
        pushA(M.seam, [[ring[2][0], by + r * 0.40, ring[2][1]], [ring[3][0], by + r * 0.40, ring[3][1]],
                       [c[0], by - r * 0.50, c[1]]]);
      }
    }

    // ── W3 THE PROPATAGIUM ──────────────────────────────────────────────────────────────────────
    // The cheapest single fix available to a wing that reads as scaffolding, and non-negotiable:
    // a free membrane sheet filling the shoulder–elbow–wrist triangle, bowed FORWARD of the bones.
    // The arm must sit INSIDE a membrane curve, not BE the edge. Its bulge is modest (8–10.5% of
    // hand-wing chord) — a subtle scallop of skin, NOT a big triangular sail. It also hides the
    // elbow kink under skin, exactly as in life.
    {
      // ⚠ 8–10.5% of the HAND-WING chord, NOT of the chord at the wrist. Scaling it off the wrist
      // chord (the bigger number) inflates the bulge ~2× and pushes the VISIBLE leading edge past
      // the 0.125 L deviation ceiling — the probe caught exactly that. Hand-wing chord = the mean
      // chord outboard of the wrist.
      // 13% is a DECLARED stylization above the sourced 8–10.5% standard band (which tops out at
      // 18% in some species). The standard band leaves the inboard arc too shallow to read at our
      // ~21px/u scale — it measured 1.8% inboard camber against the 2% floor — and this is the
      // one element carrying "there is an arm here" from the chase camera.
      const BULGE = chordAt((WX + XT) / 2) * 0.13;
      // ⚠ The bow must LAND ON the hand-wing leading edge, not return to the bone line. The spar's
      // forward cheek sits ~0.05u ahead of the centreline, so a propatagium that tapers to zero at
      // the wrist steps the silhouette inward and then back out — which reads as a sharp corner
      // (the probe measured 148° against a 155° floor) and costs the inboard forward camber that
      // is the whole tell of "there is an arm here". Anatomically the propatagium merges into the
      // hand-wing edge; geometrically that means blending to the cheek offset, not to zero.
      const CHEEK = R0 * LE[FX_WRIST_I][3] * 1.15;
      const NP = 12, prev = [];
      for (let i = 0; i <= NP; i++) {
        const t = i / NP, x = WX * t;
        const bow = BULGE * Math.sin(Math.PI * Math.pow(t, 0.75)) + CHEEK * t * t;
        prev.push([[x, leY(x) + camber(x, 0) + S(0.01), leZ(x) - bow], [x, leY(x) + camber(x, 0), leZ(x)]]);
      }
      for (let i = 0; i < NP; i++) {
        pushA(M.scorch, [prev[i][0], prev[i + 1][0], prev[i + 1][1]], [prev[i][0], prev[i + 1][1], prev[i][1]]);
      }
      // (The W3 ARMPIT GUSSET is gone. It measured 2-339 px of the junction — 0.003-0.5% — i.e.
      // visually nonexistent, which is why five successive edits aimed at this region moved the
      // armpit census by exactly zero pixels. It was never the thing anyone was looking at.)
    }

    // ── W4 THE WRIST BOSS (the Smaug move) ──────────────────────────────────────────────────────
    // 3 short free clawed fingers clustered at the chevron apex, carrying NO membrane. Decoration
    // on the spar, not a topology compromise — membrane-bearing half-fingers with mini-bays would
    // rebuild the fan's rig cost for detail below the pixel floor. Readable mass on the apex is
    // what makes a forward wrist read HEAVY rather than graceful, and it lands exactly where a
    // behind-and-above camera looks.
    {
      const W = LE[FX_WRIST_I], BX = W[1], BZ = W[2], BY = leY(BX) + camber(BX, 0);
      const KN = S(0.19);
      // the armoured knuckle block itself, over a dark socket
      // ⚠ The boss builds UP and AFT, never forward. Aimed forward it breaches the leading edge and
      // becomes the silhouette — the probe read that as a 152° wrist against a 155° floor. Up is
      // also where the mass actually pays: a behind-and-above camera sees the wing's TOP.
      pushH(M.ashLit,
        [[BX - KN * 0.55, BY + KN * 0.20, BZ - KN * 0.05], [BX + KN * 0.75, BY + KN * 0.10, BZ + KN * 0.10], [BX + KN * 0.10, BY + KN * 1.05, BZ + KN * 0.40]]);
      pushH(M.ashLit,
        [[BX - KN * 0.18, BY + KN * 0.86, BZ + KN * 0.20], [BX + KN * 0.34, BY + KN * 0.80, BZ + KN * 0.26], [BX + KN * 0.10, BY + KN * 1.10, BZ + KN * 0.42]]);
      pushH(M.seam,
        [[BX - KN * 0.7, BY - S(0.02), BZ + KN * 0.5], [BX + KN * 0.8, BY - S(0.02), BZ + KN * 0.4], [BX + KN * 0.1, BY + KN * 0.25, BZ + KN * 0.8]]);
      // ⚠ Claws point OUTBOARD, never forward past the propatagium edge. Aimed forward (the
      // obvious choice) they become the leading edge themselves and give the wing a lumpy front —
      // the probe reads that as a 31° "wrist" spike and the eye reads it as damage. Max forward
      // component here is ~0.04u against a ~0.08u propatagium bulge, so they stay tucked behind it.
      const CLAW = [[0.85, 0.25], [0.95, 0.02], [0.80, -0.18]];
      CLAW.forEach((c, ci) => {
        const len = KN * (1.0 - ci * 0.15), w = KN * (0.20 - ci * 0.035);
        const dx = c[0], dz = c[1], dn = Math.hypot(dx, dz) || 1;
        const ex = BX + (dx / dn) * len, ez = BZ + (dz / dn) * len;
        // ⚠ CLOSED pyramids, not open triangle pairs. Two unjoined triangles read as a detached
        // sliver from any angle that sees their edge — the last of the "floating shard" family
        // this file kept producing (crust ribbons, collar triangles, now these).
        const b0 = [BX - w, BY + KN * 0.16, BZ], b1 = [BX + w, BY + KN * 0.16, BZ];
        const bt = [BX, BY + KN * 0.46, BZ], tp = [ex, BY + KN * 0.20, ez];
        pushH(ci === 0 ? M.ashLit : M.scorch, [b0, b1, tp], [b0, tp, bt], [b1, bt, tp]);
        pushH(M.seam, [b0, bt, b1]);
      });
    }

    // ── W6 THE UNDERGLOW DROP ───────────────────────────────────────────────────────────────────
    // Bespoke material OUTSIDE wingMat so the shared rig cannot light it (three.js emissive is not
    // per-face-side, so a DoubleSide emissive membrane would light BOTH faces and break law 5).
    // DARK at I2; I4 lights the underside only, and the wing tops stay silhouette.
    const memGlow = new THREE.MeshStandardMaterial({
      color: def.wingInner ?? 0x262629, emissive: 0x000000, flatShading: true, roughness: 0.7, metalness: 0,
      side: THREE.DoubleSide, transparent: true, opacity: 0.9,
    });
    memGlow.userData.baseEmissive = def.accentHue ?? 0xff8912; memGlow.userData.baseIntensity = 0;
    // ⚠ The drop must stay INSIDE the membrane's silhouette. At 0.05u below and running to the
    // trailing edge it showed from the rear chase as a second parallel slat with sky between it
    // and the membrane — the critic read that as split geometry, and it is: two edges where the
    // creature has one. Halve the drop and inset it at both ends so it can never breach the
    // outline. It stays a separate surface (I4 lights the underside only) without being one.
    // Dropped from the BAY membranes (not the retired chord function), inset off every edge so it
    // can never breach the silhouette — the doubled-slat lesson from the earlier rounds.
    const dropA = [], dropH = [];
    for (let i = 0; i < NF - 1; i++) {
      const fa = spars[i], fb = spars[i + 1];
      for (let k = 1; k < NS; k++) {
        const q = (P, Q, t) => { const p = lerp3(P, Q, t); return [p[0], p[1] - S(0.025), p[2]]; };
        const a0 = q(fa[k], fb[k], 0.18), b0 = q(fa[k], fb[k], 0.82);
        const a1 = q(fa[k + 1], fb[k + 1], 0.18), b1 = q(fa[k + 1], fb[k + 1], 0.82);
        dropH.push([a0, b0, b1], [a0, b1, a1]);
      }
    }

    const arm = new THREE.Group(), hand = new THREE.Group();
    // Tag by ROLE so the structural probe can tell a recess channel from a plate — an untagged
    // seam material counts as the darkest "plate" and fails the albedo-band law spuriously.
    for (const [mat, tris] of accA) {
      const m = flatTriMesh(tris, mat); m.userData.fornaxPart = (mat === M.seam) ? 'seam' : 'wing'; arm.add(m);
    }
    for (const [mat, tris] of accH) {
      // the hand rides `tip`, which is offset to the wrist — so hand geometry is authored in wing
      // space and pulled back by the −anchor below. Authoring it pre-shifted is the classic bug.
      const m = flatTriMesh(tris, mat); m.userData.fornaxPart = (mat === M.seam) ? 'seam' : 'wing'; hand.add(m);
    }
    if (dropA.length) { const g = flatTriMesh(dropA, memGlow); g.userData.fornaxPart = 'wing'; arm.add(g); }
    if (dropH.length) { const g = flatTriMesh(dropH, memGlow); g.userData.fornaxPart = 'wing'; hand.add(g); }

    mid.add(arm);
    tip.position.set(K[0], K[1], K[2]);
    hand.position.set(-K[0], -K[1], -K[2]);      // −anchor: the house wrist compensation
    tip.add(hand);

    if (side === -1) { const lmirror = new THREE.Group(); lmirror.scale.x = -1; lmirror.add(pivot); group.add(lmirror); }
    else group.add(pivot);

    // ── W7 THE SHOULDER SADDLE — ONE scapular mass, not a greeble cloud ─────────────────────────
    // ⚠ Three small lapped lames read at 1x as "a shrapnel of plates around the shoulder" rather
    // than a mass the wing grows FROM. Replaced with one dominant scapular slab plus a single
    // subordinate lame — the dominant+decay law applied to the shoulder, same as to the fingers.
    // STATIC in the body frame (never on the flapping pivot) so it covers the root through the
    // whole flap, per DRAGON-DESIGN.md §4.8.
    {
      const sad = [];
      // ⚠ ONE mass, full stop. The "subordinate lame" was still reading as a stray shard beside the
      // slab rather than as a rank — with two elements there is no dominant, just clutter.
      // ⚠ SIZED TO COVER THE ROOT THROUGH THE WHOLE FLAP (§4.8), not merely to sit on the shoulder.
      // The in-game report was a tattered, see-through wing/body junction — and the studio stills
      // never showed it because they are STATIC. The cowl is static in the body frame while the
      // membrane root swings under it, so it has to be big enough to stay over that root at every
      // point of the arc. One slab at 0.52 wide covered the rest pose and nothing else.
      let w = S(0.92), zc = S(-1.00);
      for (let n = 0; n < 1; n++) {
        const OFF = S(0.055), CUP = S(0.035);
        const x = side * (S(0.40) + OFF), y = TORSO_Y + S(0.30);   // proud of the membrane root: the gusset is BURIED under it (§4.7)
        sad.push({ x, y, zc, w, OFF, CUP });
        w *= 0.52; zc += S(0.40);
      }
      const stris = [], rtris = [], wtris = [];
      for (const Lm of sad) {
        const { x, y, zc: z, w: ww } = Lm;
        stris.push([[x, y + S(0.13), z - ww * 0.5], [x, y - S(0.12), z - ww * 0.35], [x * 1.07, y - S(0.02), z + ww * 0.5]],
                   [[x, y + S(0.13), z - ww * 0.5], [x * 1.07, y - S(0.02), z + ww * 0.5], [x * 1.07, y + S(0.08), z + ww * 0.3]]);
        rtris.push([[x * 1.08, y + S(0.08), z + ww * 0.3], [x * 1.08, y - S(0.02), z + ww * 0.5], [x * 1.03, y + S(0.03), z + ww * 0.6]]);
        wtris.push([[x, y + S(0.13), z - ww * 0.5], [side * S(0.40), y + S(0.13), z - ww * 0.5], [side * S(0.40), y - S(0.12), z - ww * 0.35]],
                   [[x, y + S(0.13), z - ww * 0.5], [side * S(0.40), y - S(0.12), z - ww * 0.35], [x, y - S(0.12), z - ww * 0.35]]);
      }
      sadAcc.s.push(...stris); sadAcc.r.push(...rtris); sadAcc.w.push(...wtris);
    }

    const sfx = side === 1 ? 'R' : 'L';
    const marker = new THREE.Object3D();
    const T = LE[LE.length - 1];
    marker.position.set(T[1], leY(T[1]) + camber(T[1], 0), T[2]);
    hand.add(marker);
    pivots['wingPivot' + sfx] = pivot; pivots['wingMid' + sfx] = mid; pivots['wingTip' + sfx] = tip;
    pivots['tipMarker' + sfx] = marker;
    wingElements.push({
      root: [root.x, root.y, root.z],
      tip: [root.x + side * T[1], root.y + leY(T[1]) + camber(T[1], 0), root.z + T[2]],
      length: Math.hypot(T[1], T[2]), tipObj: marker,
    });
  }
  if (sadAcc.s.length) {
    group.add(tagPart(flatTriMesh(sadAcc.s, M.scorch), 'saddle'));
    group.add(tagPart(flatTriMesh(sadAcc.r, M.rim), 'saddle'));
    group.add(tagPart(flatTriMesh(sadAcc.w, M.seam), 'seam'));
  }
  return { group, spineMats, wingMat, parts: { ...pivots, wingElements } };
}
registerWings('underlitCrescentWings', buildUnderlitCrescentWings);

// --- HEAD: brandSkull --------------------------------------------------------
// I3 builds the dorsal-S profile (keel → brow dip → rising occiput) with the single dominant
// backswept occipital pair at 135° and ×0.66 decaying followers. Ref §6's load-bearing finding:
// orbit Ø ≈ 0.20 × skull length and NEGATIVELY allometric — the house instinct to enlarge eyes is
// backwards, and the glare belongs in brow BONE, not eyeball. Marked SETTLED in the sheet so a
// later pass doesn't "fix" the eyes bigger.
function buildBrandSkull(def, model, mats) {
  const group = new THREE.Group();
  const spineMats = [];
  const len = (model.skullLen ?? 0.42) * (model.headScale ?? 1);
  const skull = blockout(len * 0.62, len * 0.58, len, mats.bodyMat);   // W:H ~1.07 (ref §6 target 1.0-1.2)
  group.add(skull);
  // Eyes are NOT in the surge arrays — they are driven separately, and putting them in spineMats
  // is what makes "only the eyes glow in cruise" quietly false.
  const eye = blockout(len * 0.10, len * 0.10, len * 0.08, mats.eyeMat);
  eye.position.set(len * 0.22, len * 0.16, -len * 0.12);
  group.add(eye);
  const eyeL = eye.clone(); eyeL.position.x *= -1; group.add(eyeL);
  return { group, spineMats, headLength: len };
}
registerHead('brandSkull', buildBrandSkull);

// --- TAIL: `firebrandTail` (buildsheet §8 + §8a–d) ---------------------------
// ⚠ REPLACES THE I0 BLOCKOUT — four tapered BoxGeometry segments that were never built on. The
// art-director verdict: "not an under-detailed tail — it is NO TAIL AT ALL … a tail boom off a
// model aircraft," and on the side profile, "you can see the exact moment the creature stops being
// designed … at the hip everything HALTS ON A HARD LINE."
//
// THE ONE THING (§8): kill the seam at the hip. The tail is the CONTINUATION of the torso's
// systems — its mass, its cross-section, its crest rank, its blade language — never an attachment.
// So the trunk lofts on SLAG_PROFILE, the torso's own 10-column polygon: the chine, deck and belly
// columns run unbroken from the chest to the tip, and `slagBand` paints them with the same rule.
function buildFirebrandTail(def, model, mats, anchor) {
  const group = new THREE.Group();
  group.position.set(0, anchor.y, anchor.z);
  const S = (v) => v * (model.anvilScale ?? 1);
  const M = fornaxMats(def);

  // §8a — 8 segments, not 4: the taper curve and the glide arc cannot exist at 4.
  const nJoints = Math.max(8, model.tailJoints ?? 8);
  const total = S((model.tailLength ?? 1.55) * 2.6);
  const segLen = total / nJoints;

  // §8b — convex then accelerating. Muscle at the root, whip at the tip. A linear ramp reads
  // extruded; that is what the box steps were. The root is FATTER than the stub's 0.20 so it is at
  // least as thick as the torso it leaves, instead of attaching like a bolt-on.
  // 0.46 read as a CLUB — "muscle at the root" is not "cone off the hip". The root should be
  // comparable to the hull it leaves, not larger than it, and the taper convex-then-accelerating
  // rather than a fast power curve that empties the last two thirds.
  const R0 = S(0.26);
  const radAt = (t) => R0 * (1 - 0.55 * Math.pow(t, 1.35) - 0.42 * Math.pow(t, 4.5)) + S(0.010);

  // §8c — a glide ARC. A dead-straight tail with a perfect crest is a decorated pole; the motion
  // kit's sway rides on top of this rest curve.
  // ⚠ FRONT-LOADED, NOT UNIFORM. A constant per-joint arc accumulates into a plumb-bob: from the
  // chase camera the tail hung straight down and read static. Curving hard off the hip and then
  // STRAIGHTENING makes the last third trail aft, which is what reads as a spine continuing.
  const arcAt = (i) => 0.085 * Math.pow(0.62, i);

  // ⚠ ONE ACCUMULATOR PER BONE. Each bone must own its geometry (it rotates), but within a bone
  // everything batches: trunk section, crest vanes and recesses all land in the same three
  // material buckets. Built naively — slagLoft's own per-tier meshes plus a mesh per vane rank —
  // an 8-bone tail cost 37 draws on its own and blew the batching assert.
  const segs = [];
  let parent = group;
  for (let i = 0; i < nJoints; i++) {
    const j = new THREE.Group();
    j.position.set(0, 0, i === 0 ? 0 : segLen);
    j.rotation.x = i === 0 ? 0 : arcAt(i);  // front-loaded rest arc: curve off the hip, trail aft
    j.isBone = true;                        // ROTATION-ONLY: position writes tear a connected loft
    parent.add(j);
    parent = j;
    segs.push(j);

    const acc = new Map();
    const push = (mat, ...tris) => { let A = acc.get(mat); if (!A) acc.set(mat, A = []); for (const t of tris) A.push(t); };

    // the trunk section — SLAG_PROFILE, so the torso's columns continue into the tail
    const t0 = i / nJoints, t1 = (i + 1) / nJoints;
    const r0 = radAt(t0), r1 = radAt(t1);
    const ST = [
      { z: 0, rx: r0, ry: r0 * 0.86, cy: 0 },
      { z: segLen * 0.5, rx: (r0 + r1) * 0.5, ry: (r0 + r1) * 0.43, cy: 0 },
      { z: segLen, rx: r1, ry: r1 * 0.86, cy: 0 },
    ];
    const P = (st, k) => [SLAG_PROFILE[k][0] * st.rx, st.cy + SLAG_PROFILE[k][1] * st.ry, st.z];
    for (let si = 0; si < ST.length - 1; si++) {
      const A = ST[si], B = ST[si + 1];
      for (let k = 0; k < SLAG_PROFILE.length; k++) {
        const k1 = (k + 1) % SLAG_PROFILE.length;
        // §8d VALUE DUTY ON THE TRUNK — the deck and chine columns carry the pale tiers on the same
        // broken duty the torso uses. Under withheld light, edge-value is the only thing separating
        // the tail from the sky. `slagBand` is the ONE sanctioned index pick; reusing it is what
        // makes this the same creature rather than a matching-coloured accessory.
        push(slagBand(M, k, i * 2 + si), [P(A, k), P(B, k1), P(B, k)], [P(A, k), P(A, k1), P(B, k1)]);
      }
    }

    // §8 crest — ONE schedule owns hip→tip: height decays x0.91 per vane to a 0.04u floor, pitch
    // near-constant, seeded to CONTINUE the torso serration rather than restart it at the hip.
    // ⚠ FLOOR RAISED 0.04 -> 0.09 AND THE DECAY SLOWED. The spec's ×0.91-to-0.04u schedule is
    // arithmetically fine and killed the rank before the tail ended: the outer half read smooth in
    // every view, i.e. ~35% of the build was invisible from the camera the player lives in. A decay
    // schedule has to be judged at GAME DISTANCE, not on paper.
    const H = Math.max(S(0.09), S(0.20) * Math.pow(0.945, 3.4 + i * 2));
    for (let v = 0; v < 2; v++) {
      const zc = segLen * (0.25 + 0.5 * v);
      const top = radAt(t0 + (t1 - t0) * (0.25 + 0.5 * v)) * 0.86;
      const w = Math.max(S(0.02), H * 0.42);
      const lean = (((i * 2 + v) % 3) === 0) ? 1 : -1;         // period-3 rhythm, struck shards
      // ⚠ ALTERNATING LATERAL CANT. A vane standing in the sagittal plane is EDGE-ON to a
      // behind-and-above camera and contributes nothing to the outline there — which is why the
      // crest scored well in side profile and zero from the shipped view. Canting alternate vanes
      // out to the flanks makes the rank break the silhouette from behind while keeping the
      // struck-shard read in profile.
      const cant = lean * w * 1.15;
      push(((i * 2 + v + 1) % 7) < 4 ? M.ashLit : M.scorch,
        [[0, top, zc - w], [0, top, zc + w], [cant, top + H, zc + w * 0.15]]);
      push(M.scorch, [[0, top, zc + w], [cant, top + H, zc + w * 0.15], [cant * 0.4, top + H * 0.5, zc + w * 1.5]]);
      push(M.seam, [[0, top, zc - w], [0, top, zc + w], [0, top - S(0.03), zc]]);   // under-gap recess (RL2)
    }
    for (const [mat, tris] of acc) j.add(tagPart(flatTriMesh(tris, mat), mat === M.seam ? 'seam' : 'tail'));
  }

  // §8 THE FIREBRAND — a blunt char-capped coal tip, the anatomical end of the seam network. NOT a
  // spade (the #1 de-kitsch target). §8d: it needs an explicit pale rim or it vanishes into the
  // dark tip, so the cap carries a rim tier while the socket behind it stays seam-dark.
  {
    // ⚠ 2.7x, WITH A NECK-IN. At 1.9x the coal was a pin-head on a needle — "a bead on a stick",
    // and invisible from the chase camera. The spec word is BLUNT, and a blunt terminus has to read
    // as a blunt OUTLINE with the light off, not as a speck that will be rescued by glow at I4.
    const tip = segs[segs.length - 1], r = radAt(1) * 2.7, z = segLen;
    const cap = [], rim = [];
    const N = 6;
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2, b = ((k + 1) / N) * Math.PI * 2;
      const p0 = [Math.cos(a) * r, Math.sin(a) * r * 0.8, z], p1 = [Math.cos(b) * r, Math.sin(b) * r * 0.8, z];
      // neck-in before the coal: the outline pinches, then swells — that step is what makes the
      // terminus an EVENT rather than the end of a taper
      const n0 = [Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.34, z - r * 0.55];
      const n1 = [Math.cos(b) * r * 0.42, Math.sin(b) * r * 0.34, z - r * 0.55];
      cap.push([n0, n1, p1], [n0, p1, p0], [p0, p1, [0, 0, z + r * 0.95]]);
      rim.push([p0, p1, [Math.cos((a + b) / 2) * r * 0.55, Math.sin((a + b) / 2) * r * 0.44, z + r * 0.5]]);
    }
    tip.add(tagPart(flatTriMesh(cap, M.seam), 'tail'));
    tip.add(tagPart(flatTriMesh(rim, M.rim), 'tail'));
  }

  return { group, segs };
}

registerTail('firebrandTail', buildFirebrandTail);
