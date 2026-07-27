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
function buildUnderlitCrescentWings(def, model, attach, giM) {
  // ── I2: THE UNDERLIT CRESCENT ────────────────────────────────────────────────────────────────
  // The hero. Built to the I2 pre-assess, every number carrying its pixel size at ~21px/u (the
  // dragon spans ~180px from the chase cam, each wing ~75-85px). Anything under 2px is NOT billed
  // as a play read — that false billing is exactly what the torso's rail shipped with.
  //
  // LOW WIDE crescent, four digits, taut bays: the split from Vesper (tall arch, deep 0.35 cups,
  // five fingers) and from Tempest (continuous pale ribbon, glowing fork prongs). Notch depth comes
  // from BONE PROJECTION, never membrane drape — a taut bay with no bone projection collapses to
  // the plane wing, which is the one silhouette this game bans on sight.
  const group = new THREE.Group();
  const spineMats = [];
  const M = fornaxMats(def);
  const S = (v) => v * (model.anvilScale ?? 1);
  const halfSpan = (model.wingSpan ?? 4.26) * (model.spanScale ?? 1);
  const H = S(halfSpan);

  // Top membrane stays BLACK: the rig's unconditional boost term multiplies wingMembraneEmissive,
  // so without a registered black the wing tops light on every boost — outside Surge entirely.
  const wingMat = new THREE.MeshStandardMaterial({
    color: def.wingOuter ?? 0x2a2a2c, emissive: 0x000000, flatShading: true, roughness: 0.84,
    metalness: 0.02, side: THREE.DoubleSide,
  });

  const pivots = {}, wingElements = [];
  // Saddle triangles accumulate across BOTH sides (they are static body-frame geometry), so the
  // massif rework costs 3 meshes total rather than 3 per wing.
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

    // wristT 0.30 — top of the house band. The hand carries 70% of the wing, so the fold has real
    // mass to move; flapstrip must confirm the dogleg still reads before this locks (the fold
    // outranks the differentiator).
    const wristT = model.wristT ?? 0.30;
    const KX = H * wristT;
    const ARCH = S(0.15);                       // 3px — the LOW read; Vesper renders ~0.5u
    const leadY = (x) => ARCH * Math.sin(Math.PI * Math.min(1, x / H));
    const K = [KX, leadY(KX), S(0.02)];

    const acc = new Map();
    const push = (mat, ...tris) => { let arr = acc.get(mat); if (!arr) acc.set(mat, arr = []); for (const t of tris) arr.push(t); };

    // ── W1 THE DIGIT RANK — 4 blade-spars, D1 dominant, x0.66 decay ────────────────────────────
    // 2.98 / 1.86 / 1.23 / 0.81u = 63/39/26/17px. Lengths are load-bearing; COUNTABILITY is not —
    // at 180px the digits are not countable and the sheet lists that as turntable-only.
    const DIG = [
      { len: H - KX, dir: [1.00, 0.00], w: S(0.070) },
      { len: (H - KX) * 0.625, dir: [0.80, 0.60], w: S(0.052) },
      { len: (H - KX) * 0.413, dir: [0.55, 0.84], w: S(0.040) },
      { len: (H - KX) * 0.272, dir: [0.30, 0.95], w: S(0.030) },
    ];
    const tips = DIG.map((d) => {
      const n = Math.hypot(d.dir[0], d.dir[1]);
      const x = KX + (d.dir[0] / n) * d.len, z = K[2] + (d.dir[1] / n) * d.len;
      return [x, leadY(x), z];
    });

    // ── W6 THE SCALLOP HEM + THE NOTCH FLOOR ───────────────────────────────────────────────────
    // Bay cusps are pulled toward the wrist by max(0.15 x bay chord, 0.12u) — 2.5-5px. This is the
    // geometry guard: the membrane stays TAUT (our identity vs Vesper's cups) while the SILHOUETTE
    // stays scalloped (the read). Depth comes from where the bone tips project, not from drape.
    const hem = [];
    for (let i = 0; i < tips.length - 1; i++) {
      const A = tips[i], B = tips[i + 1];
      const chord = Math.hypot(B[0] - A[0], B[2] - A[2]);
      const depth = Math.max(0.15 * chord, S(0.12));
      const mx = (A[0] + B[0]) / 2, mz = (A[2] + B[2]) / 2;
      const dx = KX - mx, dz = K[2] - mz, dn = Math.hypot(dx, dz) || 1;
      hem.push(A, [mx + (dx / dn) * depth, leadY(mx) * 0.92, mz + (dz / dn) * depth]);
    }
    hem.push(tips[tips.length - 1]);

    // handwing membrane (39% of area) — fan from the wrist to the scalloped hem
    for (let i = 0; i < hem.length - 1; i++) push(wingMat, [[KX, leadY(KX), K[2]], hem[i], hem[i + 1]]);
    // armwing (52%) — root to wrist, and the rigid forward sheet (propatagium, ~9%)
    const RB = [S(-0.10), S(0.02), S(0.30)];
    push(wingMat,
      [RB, [KX, leadY(KX), K[2]], hem[0]],
      [RB, hem[hem.length - 1], [KX, leadY(KX), K[2]]]);
    // W2 — the propatagium forward sheet. Both real lineages actively stiffen the leading edge; a
    // wing whose leading edge is just the membrane edge is wrong in both.
    push(M.scorch, [RB, [KX, leadY(KX), K[2] - S(0.16)], [KX, leadY(KX), K[2]]]);

    // spar bodies + their CHANNELS (W1 recess): a darkest-tier gutter each side of every spar, so
    // bones read as filaments in channels rather than flat bright tape on a sheet.
    DIG.forEach((d, i) => {
      const T = tips[i], PROUD = S(0.10);        // 2.1px stand-proud
      const ax = (T[0] - KX), az = (T[2] - K[2]), an = Math.hypot(ax, az) || 1;
      const px = -az / an * d.w, pz = ax / an * d.w;
      const A = [KX, leadY(KX), K[2]];
      push(i === 0 ? M.scorch : M.scorch,
        [[A[0] + px, A[1] + PROUD, A[2] + pz], [A[0] - px, A[1] + PROUD, A[2] - pz], T],
        [[A[0] + px, A[1] + PROUD, A[2] + pz], T, [T[0] + px * 0.3, T[1] + PROUD * 0.4, T[2] + pz * 0.3]]);
      for (const sgn of [1, -1]) {
        push(M.seam,
          [[A[0] + px * sgn * 1.9, A[1] + PROUD * 0.25, A[2] + pz * sgn * 1.9],
           [A[0] + px * sgn * 1.1, A[1], A[2] + pz * sgn * 1.1], T]);
      }
      // D1 alone carries a pale spar cap (value on EDGES, never patches)
      if (i === 0) push(M.rim, [[A[0] + px * 0.5, A[1] + PROUD * 1.15, A[2] + pz * 0.5],
                                [A[0] - px * 0.5, A[1] + PROUD * 1.15, A[2] - pz * 0.5], T]);
    });

    // ── W2 THE LEADING-EDGE PALE RAIL — BROKEN ~60% duty ───────────────────────────────────────
    // Cap 0.10u (2.1px), lit runs of 2-4 segments with 0.15-0.35u gaps (3-7px, resolvable). NEVER
    // continuous root->tip: that is Tempest's crest ribbon, and a borrowed mechanism without its
    // own split axis imports the donor's identity.
    const NSEG = 14, CAP = S(0.10);
    for (let i = 0; i < NSEG; i++) {
      if (((i * 2 + 1) % 7) >= 4) continue;      // the sanctioned duty family: irregular, min run 2
      const x0 = (H * i) / NSEG, x1 = (H * (i + 1)) / NSEG;
      push(M.rim,
        [[x0, leadY(x0) + S(0.012), K[2] - CAP * 0.5], [x1, leadY(x1) + S(0.012), K[2] - CAP * 0.5],
         [x1, leadY(x1) + S(0.012), K[2] + CAP * 0.5]],
        [[x0, leadY(x0) + S(0.012), K[2] - CAP * 0.5], [x1, leadY(x1) + S(0.012), K[2] + CAP * 0.5],
         [x0, leadY(x0) + S(0.012), K[2] + CAP * 0.5]]);
    }

    // ── W3 THE KNUCKLE ROW — carpal wedge + per-digit base wedges, each over a dark socket ──────
    const KN = S(0.16);
    push(M.ashLit,
      [[KX - KN * 0.6, leadY(KX), K[2] - KN * 0.5], [KX + KN * 0.6, leadY(KX), K[2] - KN * 0.5],
       [KX, leadY(KX) + KN * 0.8, K[2] + KN * 0.2]]);
    push(M.rim, [[KX - KN * 0.28, leadY(KX) + KN * 0.62, K[2]], [KX + KN * 0.28, leadY(KX) + KN * 0.62, K[2]],
                 [KX, leadY(KX) + KN * 0.86, K[2] + KN * 0.18]]);
    push(M.seam, [[KX - KN * 0.7, leadY(KX) - S(0.02), K[2] + KN * 0.6], [KX + KN * 0.7, leadY(KX) - S(0.02), K[2] + KN * 0.6],
                  [KX, leadY(KX) + KN * 0.2, K[2] + KN * 0.9]]);

    // W6 — the connected trailing hem band, one darkest-tier stroke tracing the whole scallop
    const HEMW = S(0.15);
    for (let i = 0; i < hem.length - 1; i++) {
      const A = hem[i], B = hem[i + 1];
      const ax = B[0] - A[0], az = B[2] - A[2], an = Math.hypot(ax, az) || 1;
      const nx = -az / an * HEMW, nz = ax / an * HEMW;
      push(M.seam, [A, B, [B[0] + nx, B[1], B[2] + nz]], [A, [B[0] + nx, B[1], B[2] + nz], [A[0] + nx, A[1], A[2] + nz]]);
    }

    // W-glow — the dropped underglow copy, DARK at I2. Bespoke material outside wingMat so the
    // shared rig cannot light it, and so I4 lights only the underside (wing tops stay silhouette).
    const memGlow = new THREE.MeshStandardMaterial({
      color: def.wingInner ?? 0x262629, emissive: 0x000000, flatShading: true, roughness: 0.7, metalness: 0,
      side: THREE.DoubleSide, transparent: true, opacity: 0.9,
    });
    memGlow.userData.baseEmissive = def.accentHue ?? 0xff8912; memGlow.userData.baseIntensity = 0;
    const dropTris = [];
    for (let i = 0; i < hem.length - 1; i++) {
      dropTris.push([[KX, leadY(KX) - S(0.05), K[2]], [hem[i][0], hem[i][1] - S(0.05), hem[i][2]],
                     [hem[i + 1][0], hem[i + 1][1] - S(0.05), hem[i + 1][2]]]);
    }
    const arm = new THREE.Group();
    const hand = new THREE.Group();
    // Tag by ROLE so the structural probe can tell a recess channel from a plate — an untagged
    // seam material counts as the darkest "plate" and fails the albedo-band law spuriously.
    for (const [mat, tris] of acc) {
      const m = flatTriMesh(tris, mat);
      m.userData.fornaxPart = (mat === M.seam) ? 'seam' : 'wing';
      hand.add(m);
    }
    const gm = flatTriMesh(dropTris, memGlow); gm.userData.fornaxPart = 'wing'; hand.add(gm);
    mid.add(arm);
    tip.position.set(K[0], K[1], K[2]);
    hand.position.set(-K[0], -K[1], -K[2]);
    tip.add(hand);

    if (side === -1) { const lmirror = new THREE.Group(); lmirror.scale.x = -1; lmirror.add(pivot); group.add(lmirror); }
    else group.add(pivot);

    // ── W5 THE SHOULDER SADDLE — the massif killer. STATIC (body frame), not on the flapping pivot.
    // Binding I2 acceptance criterion: if the mid-back still reads as a featureless black box after
    // this, I2 fails its gate. Three lapped scapular lames at 0.055u standoff + 0.035u cup with
    // full perimeter recess walls, carving the dead deck into structure the arm grows out of.
    {
      const sad = [];
      let w = S(0.30), zc = S(-1.16);
      for (let n = 0; n < 3; n++) {
        const OFF = S(0.055), CUP = S(0.035);
        const x = side * (S(0.40) + OFF), y = TORSO_Y + S(0.26);
        sad.push({ x, y, zc, w, OFF, CUP });
        w *= 0.66; zc += S(0.24);
      }
      const stris = [], rtris = [], wtris = [];
      for (const L of sad) {
        const { x, y, zc: z, w: ww, CUP } = L;
        stris.push([[x, y + S(0.10), z - ww * 0.5], [x, y - S(0.10), z - ww * 0.35], [x * 1.06, y - S(0.02), z + ww * 0.5]],
                   [[x, y + S(0.10), z - ww * 0.5], [x * 1.06, y - S(0.02), z + ww * 0.5], [x * 1.06, y + S(0.06), z + ww * 0.3]]);
        rtris.push([[x * 1.07, y + S(0.06), z + ww * 0.3], [x * 1.07, y - S(0.02), z + ww * 0.5], [x * 1.03, y + S(0.02), z + ww * 0.58]]);
        // perimeter recess walls (0 -> standoff) so each lame throws a shadow step and laps the next
        wtris.push([[x, y + S(0.10), z - ww * 0.5], [side * S(0.40), y + S(0.10), z - ww * 0.5], [side * S(0.40), y - S(0.10), z - ww * 0.35]],
                   [[x, y + S(0.10), z - ww * 0.5], [side * S(0.40), y - S(0.10), z - ww * 0.35], [x, y - S(0.10), z - ww * 0.35]]);
      }
      sadAcc.s.push(...stris); sadAcc.r.push(...rtris); sadAcc.w.push(...wtris);
    }

    const sfx = side === 1 ? 'R' : 'L';
    const marker = new THREE.Object3D();
    marker.position.set(H, leadY(H), K[2]);
    hand.add(marker);
    pivots['wingPivot' + sfx] = pivot; pivots['wingMid' + sfx] = mid; pivots['wingTip' + sfx] = tip;
    pivots['tipMarker' + sfx] = marker;
    wingElements.push({ root: [root.x, root.y, root.z], tip: [root.x + side * H, root.y + leadY(H), root.z + K[2]], length: H, tipObj: marker });
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

// --- TAIL: firebrandTail -----------------------------------------------------
// No spade — the research killed it (Fox-Davies 1909: the barb is "a comparatively recent
// addition"; Tudor dragons "invariably" ended in a smooth blunt point). Silhouette duty moves to
// a dominant+decay dorsal ridge and the terminus is a blunt char-capped FIREBRAND that vents THE
// STOKE at I4. Ref §2: tail length has NO consistent natural relationship to torso — 2.6× is a
// declared composition choice, not a derived number, and the sheet says so.
function buildFirebrandTail(def, model, mats, anchor) {
  const group = new THREE.Group();
  group.position.set(0, anchor.y, anchor.z);
  const nJoints = model.tailJoints ?? 4;
  const segLen = ((model.tailLength ?? 1) * 2.6) / nJoints;

  // NESTED isBone chain — each child offset by the inter-joint vector. joints[0].isBone = true
  // makes it ROTATION-ONLY: position writes tear a connected loft.
  const segs = [];
  let parent = group;
  for (let i = 0; i < nJoints; i++) {
    const j = new THREE.Group();
    j.position.set(0, 0, i === 0 ? 0 : segLen);
    j.isBone = true;
    const taper = 1 - (i / nJoints) * 0.62;   // fattest segments sit AFT of the hip (ref §2)
    const stem = blockout(0.20 * taper, 0.20 * taper, segLen, mats.bodyMat);
    stem.position.z = segLen * 0.5;
    j.add(stem);
    parent.add(j);
    parent = j;
    segs.push(j);
  }
  return { group, segs };
}
registerTail('firebrandTail', buildFirebrandTail);
