import * as THREE from 'three';
import { registerWings } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// BASALT FORGEWING — the WING-LAB test article (wing-lab/90-SYNTHESIS.md, increment I1).
//
// "A bellows, not a lantern: a coal-dark, hand-built storm sail on a basalt-pipe arm."
//
// This module owns ONE part: `basaltForgeWings`. The roster key `forgewing` reuses the
// Thunderhead Tempest's shipped torso/head/tail recipe UNCHANGED, so the only thing that
// differs from the roster's premium bar is the wing — the lab judges a wing, not a dragon.
//
// I1 SCOPE (this file): skeleton · landmarks · planform · flat-tiered bays · hem · claw
// cluster · propatagium · cowl. NO membrane shading, NO fire, NO new flap tuning — those
// are I2 (thickness/cords/transmission), I3 (window/arteries/ash) and I4 (flap/fold).
// The seams those increments need are already cut here and marked `I2:` / `I3:` / `I4:`.
//
// THE THREE MOVES that separate this from every shipped wing (§1):
//  1. THE ARM IS REAL. Wrist at HALF the span (t=0.50), a visible elbow at t=0.28 bent to
//     ~150° included, a genuine propatagium sail filling the shoulder→wrist front, and a
//     clawed carpal hand-cluster as the silhouette's punctuation mark. Every shipped hero
//     is a stub arm with a giant fan (wristT 0.21–0.24); this is an arm with a hand.
//  2. THE FAN OPENS AT THE KNUCKLES, not in the palm. Four near-equal metacarpals leave the
//     carpal block as a narrow bundle; each digit turns out to its full fan azimuth at its
//     MCP. A splayed fan-palm is §12 kill #4.
//  3. THE SPAR IS A PIPE, not a tent. Every bone is a swept 4/5-gon TUBE with two taper
//     regimes (near-parallel inboard, whip outboard, break at the wrist) and knuckle
//     thickenings that read as BUMPS IN THE OUTLINE at elbow/wrist/every MCP + PIP. Edge-on
//     — 40% of the beat — the wing is a knuckled polyline, not a flat blade.
//
// Code idiom is `dragonTempest.js`'s: explicit triangle lists, per-(group,material)
// accumulators flushed into a handful of `flatTriMesh` draws, deterministic index jitter
// (never Math.random), and the −anchor + outer-mirror rigging boilerplate copied verbatim.
// ═══════════════════════════════════════════════════════════════════════════════

// ── tiny vector kit (arrays, not Vector3 — the triangle lists are plain arrays) ──
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const norm3 = (a) => { const l = len3(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// deterministic per-index hash jitter (§3 wants ±3° azimuth jitter on digits IV–VI; the
// value-tier field wants an index hash). NEVER Math.random — capture must be reproducible.
const wjit = (i, amp) => { const h = Math.sin((i + 1) * 78.233 + 2.7) * 43758.5453; return (h - Math.floor(h) - 0.5) * 2 * amp; };
const D2R = Math.PI / 180;

// Sample a polyline by normalised ARC LENGTH. Every membrane bay welds to SPAR SAMPLES
// (never to fingertips) — a tip-referenced membrane detaches the moment the spars curve.
function pathSample(nodes, s) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < nodes.length - 1; i++) { const L = len3(sub3(nodes[i + 1], nodes[i])) || 1e-6; segs.push(L); total += L; }
  let want = Math.max(0, Math.min(1, s)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (want <= segs[i] || i === segs.length - 1) return lerp3(nodes[i], nodes[i + 1], Math.max(0, Math.min(1, want / segs[i])));
    want -= segs[i];
  }
  return nodes[nodes.length - 1].slice();
}

// ── THE MATERIALS ──────────────────────────────────────────────────────────────
// §5.5 / §12 kill #21: the membrane is THE DARKEST ELEMENT on the dragon (albedo 3–7%,
// warm near-black `#241a16`-class); the bones + ash read LIGHTER. The bone↔membrane
// boundary carries the wing's whole contrast budget. Authored with albedo + roughness 0.38
// + envMapIntensity ≤0.06 TOGETHER (the Revenant 52%-pale lesson: rendered value =
// albedo × lighting, so all three numbers are one decision).
// §7.3: char runs linear 0.0035–0.041, ash 0.049–0.354 — the bone's value structure is a
// 10–100× char→ash ramp with ZERO emissive pixels. That ash is what keeps the wing
// readable in flat daylight and is the direct answer to flat-black poverty.
function forgeMats(def) {
  const mem = (hex) => {
    const m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.38, metalness: 0.0, flatShading: true, side: THREE.DoubleSide });
    m.envMapIntensity = 0.06;   // measured together with albedo — never tuned apart
    return m;
  };
  const solid = (hex, rough, env) => {
    const m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0.0, flatShading: true, side: THREE.DoubleSide });
    m.envMapIntensity = env;
    return m;
  };
  return {
    // 4 value tiers banded by BILLOW DEPTH (§5.5): taut-near-spar lightest → deep cup
    // darkest, spanning ~3.4× sRGB luminance so the band survives the game light.
    // I2: these become one `aMemThick`-driven surface; the tiers are the placeholder read.
    memTiers: [mem(0x3c2b1f), mem(0x2b1f15), mem(0x1c140d), mem(0x0f0a06)],
    hem: solid(0x110c08, 0.52, 0.03),      // §6.5: the trailing hem is a DARK cord — the darkest line on the wing
    bone: solid(0x413b34, 0.72, 0.22),     // charcoal-basalt pipe (top of the char band)
    ash: solid(0x7c766c, 0.86, 0.16),      // §7.3 ash dusting — up-facing faces + windward sides ONLY, never a wash
    claw: solid(0x231f1c, 0.34, 0.30),     // near-black horn: thumb claw + the ONE digit-III tip hook
    band: solid(0x3a1c12, 0.90, 0.04),     // §9 graded vermilion scale→membrane transition (hairless, sheenless)
    flank: solid(def.body ?? 0x2e2a26, 0.80, 0.18),   // cowl + root fairing + flank ridge = BODY frame, not wing
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ONE CANONICAL (+X) WING. Returns { arm, hand, root, frame, K, tip, dump } where
//   arm   → rides `mid`  (humerus + forearm + propatagium + plagiopatagium + coverts)
//   hand  → rides `tip`  (carpal cluster + 4 digits + the 3 handwing bays)
//   root  → rides `pivot` (the muscular root fairing — the one root element that deforms)
//   frame → rides the BODY (scapular cowl + the raised flank line — static through the flap)
// `dump` carries the pure-math landmark table the verify chain checks against §3.
// ═══════════════════════════════════════════════════════════════════════════════
function buildOneForgewing(M, d) {
  const hs = d.halfSpan;          // semi-span from the BODY MIDLINE (§3: hs = spanScale · 4.2)
  const X0 = d.rootX;             // the torso's published wing root, in model space
  const NDIG = Math.max(2, Math.min(4, d.digits));

  const arm = new THREE.Group(), hand = new THREE.Group(), root = new THREE.Group(), frame = new THREE.Group();

  // per-(group) per-material accumulators → a handful of draws (the Tempest batching discipline)
  const accs = new Map();
  const push = (g, mat, ...tris) => {
    let m = accs.get(g); if (!m) accs.set(g, m = new Map());
    let a = m.get(mat); if (!a) m.set(mat, a = []);
    for (const t of tris) a.push(t);
  };
  const flush = (g) => { const m = accs.get(g); if (!m) return; for (const [mat, tris] of m) if (tris.length) g.add(flatTriMesh(tris, mat)); };
  const quad = (g, mat, a, b, c, e) => push(g, mat, [a, b, c], [a, c, e]);

  // ── §3 LANDMARKS ─────────────────────────────────────────────────────────────
  // `t` is the fraction of the semi-span measured from the BODY MIDLINE, so a landmark's
  // WORLD x is exactly t·hs; wing-local x is t·hs − X0 (the pivot sits at X0, just inboard
  // of the glenoid, buried in the root fairing — §9 "the glenoid inside the fairing").
  // Gap rhythm root→tip 0.09 · 0.19 · 0.22 · 0.18 · 0.15 · 0.17 — the forearm is the
  // LONGEST gap, two joints live outboard of ⅔ span, nothing is evenly spaced (§12 kill #2).
  const P = (t, y, z) => [t * hs - X0, y * hs, z * hs];
  const S = P(0.090, 0.030, 0.020);    // shoulder / glenoid
  const E = P(0.280, 0.125, 0.005);    // elbow — gull-arch crest; included angle ≈150° (§12 kill #10)
  const K = P(0.500, 0.158, -0.110);   // WRIST / carpal apex — forward-most point of the "‹"
  const MCP3 = P(0.680, 0.150, -0.040);
  const PIP3 = P(0.830, 0.120, 0.050);   // ph2 (0.83→1.00) OUT-RUNS ph1 (0.68→0.83) — §12 kill #3
  const TIP3 = P(1.000, 0.075, 0.170);   // span is PINNED here
  // heraldic back-curved tip hook (≤0.06·hs) — the ONLY claw outboard of the carpal cluster
  const HOOK3 = add3(TIP3, [0.026 * hs, -0.017 * hs, 0.036 * hs]);

  // Leading-edge shape: gull ARCH in Y crest between elbow and wrist, swan-neck OGEE in Z
  // (root → elbow → wrist apex forward-most at −0.11·hs → digit III sweeps back to the tip).
  // In plan it is a "‹", never a monotone backsweep (§12 kill #12).
  const armPath = [S, lerp3(S, E, 0.5), E, lerp3(E, K, 0.5), K];
  const dig3 = [K, MCP3, PIP3, TIP3];

  // ── THE CARPAL BLOCK ─────────────────────────────────────────────────────────
  // The four metacarpal bases sit SIDE BY SIDE across the palm, not on one point: the fan
  // ORIGINS are clustered at the wrist but spread aft/down over a real carpus. This is what
  // gives the armwing a real chord where it meets the hand (a TE that collapses onto the LE
  // at the wrist is a pinch) and is the anatomical answer to §12 kill #17 (no human palm).
  const carpal = (f) => add3(K, [0.020 * hs * f, -0.050 * hs * f, 0.200 * hs * f]);
  const CARP_F = [0, 0.30, 0.65, 1.00];

  // ── THE FAN (§3 table) ───────────────────────────────────────────────────────
  // Length × digit-III spar run · fan azimuth off the LE direction · droop (rad).
  // Dominant + decay, never a picket fence. ±3° DETERMINISTIC azimuth jitter on IV–VI.
  const FAN_LEN = [1.00, 0.84, 0.68, 0.50];
  const FAN_AZ = [0, 24, 43, 61];
  const FAN_DROOP = [0.05, 0.13, 0.22, 0.32];
  const runIII = len3(sub3(TIP3, K));
  const phiIII = Math.atan2(TIP3[2] - K[2], TIP3[0] - K[0]);          // chord azimuth of the dominant digit
  const mcVec = sub3(MCP3, K), mcLen = len3(mcVec);
  const phiPalm = Math.atan2(mcVec[2], mcVec[0]);                      // the palm bundle's azimuth
  const gullDecay = 0.054 * hs;                                        // shared arch decay outboard of the crest

  // Build each digit as a 4-node chain: carpal origin → MCP → PIP → tip.
  const digits = [dig3];
  for (let i = 1; i < NDIG; i++) {
    const az = phiIII + (FAN_AZ[i] + wjit(i * 3 + 1, 3)) * D2R;        // ±3° per §3
    const L = runIII * FAN_LEN[i];
    const R = L * Math.cos(FAN_DROOP[i]);
    const drop = L * Math.sin(FAN_DROOP[i]) + gullDecay * FAN_LEN[i];
    const O = carpal(CARP_F[i]);
    const tip = [K[0] + R * Math.cos(az), K[1] - drop, K[2] + R * Math.sin(az)];
    // metacarpals are NEAR-EQUAL and leave the carpus as a narrow bundle — the fan opens at
    // the KNUCKLES (§12 kill #4). The palm only takes 30% of the digit's fan angle.
    const azP = phiPalm + (FAN_AZ[i] * 0.30) * D2R;
    const mcL = mcLen * (1 - 0.04 * i);                                 // 1.00 / 0.96 / 0.92 — near-equal
    const mcp = [O[0] + mcL * Math.cos(azP), O[1] - 0.020 * hs - 0.012 * hs * i, O[2] + mcL * Math.sin(azP)];
    // ph1 : ph2 = 0.469 : 0.531 — ph2 out-runs ph1 on every digit (the long–short–long rhythm)
    const pip = lerp3(mcp, tip, 0.469);
    const bow = mul3(norm3(cross3(sub3(tip, mcp), [0, 1, 0])), -0.045 * len3(sub3(tip, mcp)));
    digits.push([O, mcp, add3(pip, bow), tip]);
  }
  const tips = digits.map((c) => c[c.length - 1]);
  const W6 = carpal(CARP_F[NDIG - 1]);   // the armwing's outboard trailing corner = the last digit's base

  // ── SPAR TAPER (§4) ──────────────────────────────────────────────────────────
  // TWO regimes, break at the wrist: the inner half BARELY tapers, the outer half is a whip.
  // A straight cone root→tip is ruled out (§12 kill #6). Root diameter 0.137 × root chord
  // → humerus slenderness ≈ 4.3 : 1 (a MAST, not a bone; slenderer than 6:1 is kill #5).
  const TAPER = [[0.09, 1.00], [0.28, 0.86], [0.50, 0.62], [0.77, 0.33], [0.92, 0.15], [1.00, 0.10]];
  const sparF = (t) => {
    if (t <= TAPER[0][0]) return TAPER[0][1];
    for (let i = 0; i < TAPER.length - 1; i++) {
      if (t <= TAPER[i + 1][0]) { const f = (t - TAPER[i][0]) / (TAPER[i + 1][0] - TAPER[i][0]); return TAPER[i][1] + (TAPER[i + 1][1] - TAPER[i][1]) * f; }
    }
    return TAPER[TAPER.length - 1][1];
  };
  const r0 = 0.025 * hs;   // ROOT RADIUS (diameter 0.050·hs ≈ 13.7% of root chord)

  // ── THE PIPE ─────────────────────────────────────────────────────────────────
  // A swept N-gon tube. Not a tent: edge-on (40% of the beat) it has real depth, and where
  // I2/I3 crack or backlight it, the section reads as a TUBE — bright rim, dark core — never
  // a solid rod (§4 / §12 kill #7). Up-facing faces take the ASH material; the rest is char.
  // Knuckles are extra stations with a fattened radius, so the joint is a BUMP IN THE
  // OUTLINE for free (§12 kill #8: the hosepipe arm).
  function tube(g, stations, sides, capMat, seedPhase = 0) {
    const rings = [];
    for (let i = 0; i < stations.length; i++) {
      const p = stations[i].p, r = stations[i].r;
      const dir = norm3(sub3(stations[Math.min(i + 1, stations.length - 1)].p, stations[Math.max(i - 1, 0)].p));
      let up = Math.abs(dir[1]) > 0.92 ? [0, 0, 1] : [0, 1, 0];
      const u = norm3(cross3(dir, up)), v = norm3(cross3(u, dir));
      const ring = [], nrm = [], nrmZ = [];
      const phase = Math.PI / 2 - Math.PI / sides;   // put a FLAT FACE straight up (for the ash)
      for (let k = 0; k < sides; k++) {
        const th = phase + (k / sides) * Math.PI * 2;
        ring.push([p[0] + r * (Math.cos(th) * u[0] + Math.sin(th) * v[0]),
                   p[1] + r * (Math.cos(th) * u[1] + Math.sin(th) * v[1]),
                   p[2] + r * (Math.cos(th) * u[2] + Math.sin(th) * v[2])]);
        const thm = phase + ((k + 0.5) / sides) * Math.PI * 2;
        nrm.push(Math.cos(thm) * u[1] + Math.sin(thm) * v[1]);    // this face's world-Y
        nrmZ.push(Math.cos(thm) * u[2] + Math.sin(thm) * v[2]);   // …and its world-Z (windward = −Z)
      }
      rings.push({ ring, nrm, nrmZ });
    }
    // §7.3: ash settles on UP-FACING dorsal faces and WINDWARD sides — never a uniform wash.
    // The face→material map is decided ONCE, off the mid-station, and then held constant
    // down the whole tube. Deciding it per ring instead lets faces that sit near the
    // threshold flip on and off as the chain curves, which paints a regular tan SAWTOOTH
    // along the bone — a saw blade, not a basalt pipe (it is exactly the "flat-tape bones"
    // cheap tell wearing a different hat, and the first render had it).
    const mid = rings[Math.floor(rings.length / 2)];
    const ashFace = [];
    for (let k = 0; k < sides; k++) ashFace.push(mid.nrm[k] > 0.55 || (mid.nrm[k] > -0.15 && mid.nrmZ[k] < -0.55));
    for (let i = 0; i < rings.length - 1; i++) {
      const A = rings[i], B = rings[i + 1];
      for (let k = 0; k < sides; k++) {
        const k2 = (k + 1) % sides;
        // …and it BREAKS along the length. An unbroken pale strip running the whole bone is
        // FLAT-TAPE BONES — a constant-width near-white quad standing proud on a dark
        // membrane, the tell this repo has already rejected twice. Ash is dust: it sits in
        // runs and the slipstream scours it off the rest, so the dusting is gated by a
        // deterministic low-frequency function (runs of 2–4 quads, ~60% duty) and the bone
        // reads as a mottled basalt pipe instead of white tape on black cardstock.
        const dusted = ashFace[k] && Math.sin(i * 0.9 + k * 2.1 + seedPhase) > -0.15;
        quad(g, dusted ? M.ash : M.bone, A.ring[k], A.ring[k2], B.ring[k2], B.ring[k]);
      }
    }
    if (capMat) {   // close the outboard tip so a fingertip is never a hollow straw
      const last = rings[rings.length - 1].ring, c = stations[stations.length - 1].p;
      for (let k = 0; k < sides; k++) push(g, capMat, [last[k], last[(k + 1) % sides], c]);
    }
  }
  // Expand a bone chain into tube stations, fattening a KNUCKLE at each interior node.
  function boned(chain, rAt, knuckle) {
    const st = [];
    for (let i = 0; i < chain.length; i++) {
      const s = i / (chain.length - 1);
      if (i > 0 && i < chain.length - 1) {
        // pre-knuckle / knuckle / post-knuckle: the thickening reads as an outline bump
        st.push({ p: lerp3(chain[i - 1], chain[i], 0.80), r: rAt(s - 0.06) });
        st.push({ p: chain[i], r: rAt(s) * knuckle });
        st.push({ p: lerp3(chain[i], chain[i + 1], 0.20), r: rAt(s + 0.06) });
      } else st.push({ p: chain[i], r: rAt(s) });
    }
    return st;
  }

  // ── THE ARM (humerus + forearm) ──────────────────────────────────────────────
  // Rides `mid`. Shoulder→elbow→wrist, with the elbow held at ~150° included so the arm
  // NEVER reads straight while the propatagium exists.
  {
    const tOf = (s) => 0.090 + s * 0.410;   // arc-fraction → §3 span fraction over the arm
    const st = boned([S, E, K], (s) => r0 * sparF(tOf(Math.max(0, Math.min(1, s)))), 1.42);
    tube(arm, st, 5, null, 0.4);
    // §4: short raised RIDGES at the high-moment stations (shoulder / elbow / wrist) — the
    // visible answer to thin-wall bracing, and three more bumps on the edge-on polyline.
    for (const [node, s, w] of [[S, 0.02, 1.0], [E, 0.46, 0.86], [K, 0.98, 0.62]]) {
      const r = r0 * sparF(tOf(s)) * w;
      const dir = norm3(sub3(K, S));
      const side = norm3(cross3(dir, [0, 1, 0]));
      const a = add3(node, mul3(dir, -r * 1.5)), b = add3(node, mul3(dir, r * 1.5));
      const top = add3(node, [0, r * 1.75, 0]);
      push(arm, M.ash, [a, add3(node, mul3(side, r * 0.9)), top], [add3(node, mul3(side, r * 0.9)), b, top]);
      push(arm, M.bone, [a, top, add3(node, mul3(side, -r * 0.9))], [add3(node, mul3(side, -r * 0.9)), top, b]);
    }
  }

  // ── THE DIGITS ───────────────────────────────────────────────────────────────
  // Digit III continues the leading edge and carries the tip hook; IV–VI are thinner.
  const sparSamples = [];      // per-digit spar samples the membrane WELDS to
  const NS = 4;                // spanwise rows per bay
  for (let i = 0; i < NDIG; i++) {
    const chain = digits[i];
    const wScale = i === 0 ? 1 : Math.pow(FAN_LEN[i], 0.5);
    const tOf = (s) => 0.500 + Math.max(0, Math.min(1, s)) * 0.500 * FAN_LEN[i];
    const st = boned(chain, (s) => r0 * sparF(tOf(s)) * wScale, 1.34);
    tube(hand, st, i === 0 ? 5 : 4, M.bone, i * 1.7);
    const samples = [];
    for (let k = 0; k <= NS; k++) samples.push(pathSample(chain, k / NS));
    sparSamples.push({ samples, chain, rAt: (s) => r0 * sparF(tOf(s)) * wScale });
  }
  // THE ONE TIP HOOK — heraldic, back-curved, ≤0.06·hs. Zero claws on trailing fingers,
  // zero bare bone past the hem anywhere else (§3 / §12 kill #16).
  {
    const rT = r0 * sparF(1.0);
    tube(hand, [{ p: TIP3, r: rT }, { p: lerp3(TIP3, HOOK3, 0.55), r: rT * 0.62 }, { p: HOOK3, r: rT * 0.10 }], 4, M.claw);
  }

  // ── THE CARPAL CLAW CLUSTER (§3) ─────────────────────────────────────────────
  // Thumb + 2 stubs, 0.18–0.22 × the digit-III spar run, projecting FORWARD-AND-DOWN —
  // opposed to the swept fingers. This is the silhouette's punctuation mark at mid-span and
  // the only claw on the wing besides the tip hook. It also carries ground contact (§8.3).
  {
    const CLUS = [[-52, 0.22, 0.35, 1], [-22, 0.15, 0.28, 0], [-86, 0.13, 0.40, 0]];
    for (let i = 0; i < Math.min(CLUS.length, 1 + d.clusterStubs); i++) {
      const [azDeg, lf, droop, clawed] = CLUS[i];
      const az = phiIII + azDeg * D2R, L = runIII * lf;
      const R = L * Math.cos(droop), drop = L * Math.sin(droop);
      const base = add3(K, [0.01 * hs, -0.02 * hs, 0.01 * hs]);
      const tip = [base[0] + R * Math.cos(az), base[1] - drop, base[2] + R * Math.sin(az)];
      const mid = add3(lerp3(base, tip, 0.55), [0, 0.02 * hs, 0]);   // a knuckled, not straight, digit
      const rB = r0 * sparF(0.50) * 0.52;
      tube(hand, [{ p: base, r: rB }, { p: mid, r: rB * 0.92 }, { p: tip, r: rB * 0.34 }], 4, clawed ? null : M.bone);
      if (clawed) {   // the ONE carpal claw: a short recurved horn
        const cl = add3(tip, [-0.020 * hs, -0.042 * hs, -0.030 * hs]);
        tube(hand, [{ p: tip, r: rB * 0.34 }, { p: lerp3(tip, cl, 0.5), r: rB * 0.22 }, { p: cl, r: rB * 0.04 }], 4, M.claw);
      }
    }
  }

  // ── THE MEMBRANE ─────────────────────────────────────────────────────────────
  // Bays are PER-FINGER LOBES welded to their own finger's spar samples, overlapping the
  // neighbouring bay by ~9% under the spar's dark side (§5.4). Three mandatory mitigations
  // against the Tempest shard-plate read, all live here:
  //   (1) the overlap hides in the spar shadow line, its seam running ALONG the finger,
  //   (2) value tiers are a function of BILLOW DEPTH, which is continuous across the seam,
  //       so no value step ever marks it,
  //   (3) in flight poses the furl array is identically zero (I4 publishes it; I1 has none),
  //       so the spread wing is one continuous skin to the eye.
  // Camber (§5.3): ventral cup-down, sag NADIR AT 40% CHORD (never mid-chord, never the TE),
  // inboard SOFT (0.08c) and outboard TIGHT (0.045c) — the drum-tight-inner/floppy-outer
  // wing is exactly inverted (§12 kill #27). Every trailing arc is sampled at 8 segments.
  const NC = 8;                       // chordwise columns across a bay (the free trailing arc's segment count)
  const OVER = 0.09;                  // the hidden inter-bay overlap (§5.4: 8–10%)
  let dumpPro = null;                 // measured propatagium numbers, for the verify dump
  // §5.5: 4 tiers banded by BILLOW DEPTH — taut-near-spar lightest, deep cup darkest, with
  // index-hash jitter. The ramp is deliberately STEEP (pow 0.45): billow falls to zero at
  // BOTH spars, so a linear ramp paints a two-column pale ribbon straddling every finger —
  // measured on the planform sheet, that reads as a row of light shard plates, not as a
  // sheet catching light beside a bone. The steep ramp keeps the light tier down to the
  // strip immediately against the spar, where the membrane really is taut.
  const tierOf = (billow, maxB, idx) => {
    const q = Math.pow(Math.max(0, Math.min(1, billow / (maxB || 1))), 0.45) * 3 + wjit(idx, 0.42);
    return M.memTiers[Math.max(0, Math.min(3, Math.round(q)))];
  };
  // sag profile across the chord: peaks at c≈0.4 (w = c^0.72 → 4w(1−w) peaks at c = 0.383)
  const sagShape = (c) => { const w = Math.pow(Math.max(0, Math.min(1, c)), 0.72); return 4 * w * (1 - w); };
  // The trailing polyline is collected as TWO RUNS, because between them the free edge is
  // the last digit's BONE (the spar itself is the edge out to tipVI) and the hem must not
  // band across it: run A = the armwing arc B→W6, run B = the bay scallops tipVI→…→tipIII.
  // Each entry carries an inward reference point so the hem can be a constant-width cord.
  const hemArm = [], hemBays = [];

  // -- the ARMWING / plagiopatagium -------------------------------------------
  // The largest single surface (§5.1). Bounded by the arm's leading edge, the carpal block,
  // the concave trailing arc, and the raised flank line at the root.
  // §9 / the anti-shard law: the membrane's inboard edge lives on the WING group with a
  // SHORT lever to the pivot — a vertex that must stay put on the body cannot live in a
  // group that rotates with the limb. The "raised flank line running to the hip" is
  // delivered by the STATIC flank ridge below, which the membrane laps over; the membrane
  // itself stops at mid-flank. That split is what lets the anchor read as a hip line
  // without peeling into a floating shard mid-flight.
  const B_ANCHOR = d.flankAt(d.anchorZ);
  const armLead = (u) => add3(pathSample(armPath, u), [0, -r0 * sparF(0.09 + u * 0.41) * 0.55, 0]);
  // the trailing arc B → W6, pulled forward toward the wrist so the inboard TE scallops and
  // the whole trailing line — wingtip to body — is ONE continuous cupped curve
  const armTrail = (u) => lerp3(lerp3(B_ANCHOR, W6, u), K, 0.13 * Math.sin(Math.PI * u));
  {
    const NU = 8;
    const grid = [], chords = [];
    for (let k = 0; k <= NU; k++) {
      const u = k / NU;
      const leL = armLead(u), te = armTrail(u);
      const chord = len3(sub3(te, leL)) || 1e-6;
      chords.push(chord);
      const row = [];
      for (let j = 0; j <= NC; j++) {
        const c = j / NC;
        const p = lerp3(leL, te, c);
        p[1] -= 0.080 * chord * sagShape(c) * (0.35 + 0.65 * u);   // the SOFT inboard sheet (0.08c)
        row.push(p);
      }
      grid.push(row);
    }
    const maxB = 0.080 * Math.max(...chords);
    for (let k = 0; k < NU; k++) for (let j = 0; j < NC; j++) {
      const c = (j + 0.5) / NC;
      const billow = (chords[k] + chords[k + 1]) * 0.5 * 0.080 * sagShape(c);
      // §9: the scale→membrane transition is a GRADED VERMILION BAND (~0.06·hs), never a
      // hard straight line where scales stop and membrane starts (§12 kill #31). It costs
      // zero extra triangles — the root strip is simply its own material.
      const tier = tierOf(billow, maxB, 613 + k * 13 + j);
      if (k === 0) {
        // GRADED, not a painted line: the body-side triangle of the root strip takes the
        // warm vermilion blush and the outboard triangle already takes its membrane tier, so
        // the band ramps across ~0.06·hs instead of ending on a hard edge (§12 kill #31).
        // Authored DARK — measured at shop distance a saturated band reads as a red stripe
        // painted on the root, which is the same crime one value up.
        push(arm, M.band, [grid[k][j], grid[k][j + 1], grid[k + 1][j + 1]]);
        push(arm, tier, [grid[k][j], grid[k + 1][j + 1], grid[k + 1][j]]);
      } else quad(arm, tier, grid[k][j], grid[k][j + 1], grid[k + 1][j + 1], grid[k + 1][j]);
    }
    for (let k = 0; k <= NU; k++) hemArm.push({ p: grid[k][NC], ref: grid[k][NC - 1] });
  }

  // -- the HANDWING bays -------------------------------------------------------
  const bayArcs = [];
  for (let i = 0; i < NDIG - 1; i++) {
    const A = sparSamples[i], B = sparSamples[i + 1];
    const sagFrac = 0.052 - 0.004 * i;                     // outboard bays are the tightest
    // §5.4: TE scallop depth is 0.22–0.30 OF BAY WIDTH — an absolute distance, not a
    // fraction of the run back to the wrist. Lerping the free edge toward K (the shipped
    // Tempest move) cuts ~67% of the bay out on a fan this long and strands the fingertips
    // as bare spikes past the hem — §12 kill #16, and the reason the first render failed.
    const bayW = len3(sub3(B.samples[NS], A.samples[NS])) || 1e-6;
    const scallop = (0.22 + 0.03 * i) * bayW;
    const grid = [];
    for (let k = 0; k <= NS; k++) {
      const s = k / NS;
      // the sheet welds to the LOWER flank of each pipe so the bones stand proud above it
      const a = add3(A.samples[k], [0, -A.rAt(s) * 0.55, 0]);
      const b = add3(B.samples[k], [0, -B.rAt(s) * 0.55, 0]);
      const chord = len3(sub3(b, a)) || 1e-6;
      const row = [];
      // columns 0..NC land exactly on the two spars (c = 0 and c = 1) so every membrane
      // edge IS a bone node; column NC+1 is the OVERLAP tongue, tapered to zero at the free
      // edge (so no tongue pokes past the tip) and dropped into the spar's shadow line.
      for (let j = 0; j <= NC + 1; j++) {
        const over = OVER * (1 - Math.pow(s, 1.5));
        const c = j <= NC ? j / NC : 1 + over;
        const p = lerp3(a, b, c);
        p[1] -= sagFrac * chord * sagShape(c) * Math.pow(s, 0.6);   // ventral cup, nadir at 40% chord
        if (j > NC) p[1] -= 0.006 * hs;                             // tuck under the neighbouring lobe
        // the free TE scallop cuts INWARD toward the knuckle (a cupped concave arc, never a
        // convex bump on a plane), deepest mid-bay, fading to zero at both spars and inboard
        const sc = scallop * Math.sin(Math.PI * Math.min(1, c)) * Math.pow(s, 2.6);
        row.push(add3(p, mul3(norm3(sub3(K, p)), sc)));
      }
      grid.push({ row, chord });
    }
    const maxB = sagFrac * grid[NS].chord;
    for (let k = 0; k < NS; k++) for (let j = 0; j <= NC; j++) {
      const c = (j + 0.5) / NC;
      // value tiers are a function of BILLOW DEPTH, which is continuous across the lobe
      // seam — so no value step ever marks the overlap (§5.4 mitigation 2)
      const billow = (grid[k].chord + grid[k + 1].chord) * 0.5 * sagFrac * sagShape(c) * Math.pow((k + 0.5) / NS, 0.6);
      quad(hand, tierOf(billow, maxB, i * 97 + k * 11 + j), grid[k].row[j], grid[k].row[j + 1], grid[k + 1].row[j + 1], grid[k + 1].row[j]);
    }
    const arc = [];
    for (let j = 0; j <= NC; j++) arc.push({ p: grid[NS].row[j], ref: grid[NS - 1].row[j] });
    bayArcs.push(arc);
  }
  // assemble the free edge outboard-in: tipVI → tipV → tipIV → tipIII (each bay reversed)
  for (let i = bayArcs.length - 1; i >= 0; i--) {
    const rev = bayArcs[i].slice().reverse();
    for (let j = (i === bayArcs.length - 1 ? 0 : 1); j < rev.length; j++) hemBays.push(rev[j]);
  }

  // ── THE TRAILING HEM (§6.5) ──────────────────────────────────────────────────
  // ONE edge loop just inboard of the whole scalloped free edge — a DARK cord of constant
  // width per station, ramping ×2.5 tipward. Backlit (I2) it is the darkest line on the
  // wing. It is IN-PLANE: the membrane shows ZERO slab thickness at its edge (§12 kill #28),
  // and there is no continuous BRIGHT outline anywhere — chrome is an automatic loss (#33).
  // …and each run rides the group its membrane rides: the armwing hem on `arm`, the bay hem
  // on `hand`. Putting both on `hand` is invisible at rest (the −anchor makes the assembled
  // rest pose byte-identical) and then rips a black streak across the frame the moment the
  // wrist rotates — geometry that spans a joint must keep every vertex on ONE side of it.
  for (const [run, g] of [[hemArm, arm], [hemBays, hand]]) {
    const et = [];
    const inner = run.map(({ p, ref }) => {
      const t = (p[0] + X0) / hs;                          // span fraction → the ×2.5 ramp
      const w = (0.012 + 0.018 * Math.max(0, Math.min(1, t))) * hs;
      const dir = norm3(sub3(ref, p));
      return add3(add3(p, mul3(dir, w)), [0, 0.004 * hs, 0]);
    });
    for (let s = 0; s < run.length - 1; s++) et.push([run[s].p, run[s + 1].p, inner[s + 1]], [run[s].p, inner[s + 1], inner[s]]);
    if (et.length) push(g, M.hem, ...et);
  }

  // ── THE PROPATAGIUM (§5.2) — the sail nobody ships ───────────────────────────
  // Shoulder → wrist, FORWARD of the arm, depth 0.20 × the local chord AT THE ELBOW
  // (measured off this planform, not assumed). A real cambered triangular sail — not 2-px
  // piping (§12 kill #15) and not the amateur signature of a bare bone with nothing forward
  // of it (§12 kill #14). It is what makes the inboard leading edge bow FORWARD, so the
  // visible LE polyline is a "‹" even though the humerus itself runs nearly straight
  // outboard. Terminates at the carpal cluster.
  {
    const NP = 6;
    // u of the elbow along the arm path, by arc length
    const uE = len3(sub3(E, S)) / (len3(sub3(E, S)) + len3(sub3(K, E)));
    const chordAtElbow = len3(sub3(armTrail(uE), armLead(uE)));
    const depth = 0.20 * chordAtElbow;
    const rows = [[], [], []];
    for (let i = 0; i <= NP; i++) {
      const u = i / NP;
      const le = pathSample(armPath, u);
      const dep = depth * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.90)), 0.85);
      rows[0].push(le);
      rows[1].push([le[0] + 0.015 * dep, le[1] - 0.24 * dep, le[2] - dep * 0.5]);   // cambered (ventral) mid
      rows[2].push([le[0] + 0.030 * dep, le[1] - 0.20 * dep, le[2] - dep]);         // the taut forward edge
    }
    for (let r = 0; r < 2; r++) for (let i = 0; i < NP; i++)
      quad(arm, M.memTiers[r === 0 ? 1 : 0], rows[r][i], rows[r][i + 1], rows[r + 1][i + 1], rows[r + 1][i]);
    dumpPro = { depth, chordAtElbow };
  }

  // ── THE COVERT ROW (§9) ──────────────────────────────────────────────────────
  // ONE organized rank of 8–10 flakes with decaying sizes along the dorsal arm, TERMINATING
  // at the wrist cluster. A rank with a terminus — never the even scatter of white flecks
  // that reads as confetti (§12 kill #30, the Tempest's measured defect).
  for (let i = 0; i < d.coverts; i++) {
    const u = 0.10 + 0.86 * (i / Math.max(1, d.coverts - 1));
    const p = pathSample(armPath, u);
    const sz = 0.052 * hs * (1 - 0.55 * u);
    const dir = norm3(sub3(K, S)), side = norm3(cross3(dir, [0, 1, 0]));
    const a = add3(add3(p, mul3(dir, -sz * 0.7)), [0, r0 * 0.7, 0]);
    const b = add3(add3(p, mul3(dir, sz * 0.9)), [0, r0 * 0.5, 0]);
    const c = add3(add3(p, mul3(side, sz * 1.25)), [0, -r0 * 0.1, 0]);
    // Value order matters: the flake body is CHARCOAL and only its lapped edge catches ash.
    // A rank of bright flakes on a dark wing is the Tempest's measured confetti defect.
    push(arm, M.bone, [a, b, c]);
    push(arm, M.ash, [lerp3(a, c, 0.72), lerp3(b, c, 0.72), c]);
  }

  // ── THE ROOT (§9): OVERLAP, NEVER WELD ───────────────────────────────────────
  // A muscular root fairing continuous with the flank (the one root element that may deform
  // with the stroke — it is muscle, so it rides the PIVOT), under a scapular COWL plate that
  // rides the BODY frame over the humeral head (static through the flap), plus the raised
  // FLANK LINE running aft to the hip. A wing welded flush into the flank with a hard socket
  // seam and no fairing is §12 kill #18; flight muscle reads in the TORSO, never as biceps
  // on the wing arm (§12 kill #9), so this mass sits inboard of the glenoid, not on the arm.
  //
  // EVERYTHING HERE IS SIZED IN BODY UNITS off the published attach contract — never in hs.
  // These three parts belong to the TORSO's frame, so growing the wing must not grow them
  // (an hs-scaled cowl walks straight off the flank the moment the span dial moves).
  {
    const bw = d.flankHalfWidth;        // torso half-width at the wing root
    const flankAt = d.flankAt;          // wing-local flank point at a wing-local z
    const c0 = [-bw * 0.55, 0.02 * bw, 0], c1 = S;
    const ringAt = (p, rx, ry, rz) => [
      [p[0], p[1] + ry, p[2]], [p[0] + rx * 0.5, p[1] + ry * 0.4, p[2] - rz],
      [p[0] + rx * 0.7, p[1] - ry * 0.5, p[2] - rz * 0.5], [p[0], p[1] - ry, p[2]],
      [p[0] + rx * 0.7, p[1] - ry * 0.5, p[2] + rz * 0.5], [p[0] + rx * 0.5, p[1] + ry * 0.4, p[2] + rz],
    ];
    const R0 = ringAt(c0, bw * 0.45, bw * 0.86, bw * 1.30);
    const R1 = ringAt(lerp3(c0, c1, 0.55), bw * 0.42, bw * 0.70, bw * 0.95);
    const R2 = ringAt(c1, bw * 0.24, bw * 0.40, bw * 0.52);
    for (const [A, Bq] of [[R0, R1], [R1, R2]]) for (let k = 0; k < 6; k++) {
      const k2 = (k + 1) % 6;
      quad(root, k === 0 || k === 1 || k === 5 ? M.ash : M.flank, A[k], A[k2], Bq[k2], Bq[k]);
    }
    // scapular cowl — overlapping knapped flake plates, STATIC in the body frame, lapping
    // OVER the humeral head so the join is an overlap, not a seam that can fail.
    for (let i = 0; i < 3; i++) {
      const b = [-bw * 0.75 + bw * 0.22 * i, bw * 0.62 - bw * 0.10 * i, -bw * 0.95 + bw * 0.88 * i];
      const w = bw * 0.80 * (1 - 0.16 * i), l = bw * 1.05 * (1 - 0.13 * i);
      const p0 = add3(b, [-w * 0.5, 0, -l * 0.5]), p1 = add3(b, [w * 0.9, bw * 0.14, -l * 0.3]);
      const p2 = add3(b, [w * 0.6, bw * 0.05, l * 0.6]), p3 = add3(b, [-w * 0.4, -bw * 0.10, l * 0.4]);
      const apex = add3(b, [w * 0.15, bw * 0.34, 0]);
      push(frame, M.ash, [p0, p1, apex], [p1, p2, apex]);
      push(frame, M.flank, [p2, p3, apex], [p3, p0, apex]);
    }
    // the RAISED FLANK LINE — a low tapered ridge that follows the torso's OWN half-width
    // curve aft from the root to the hip/upper thigh (the praised Night-Fury trait). NOT the
    // ankle (rideable legs stay free) and NOT the spine (the rider sits there). The
    // membrane's inboard edge laps over its forward half, so the anchor READS as a hip line
    // while every membrane vertex keeps a short lever to the pivot (the anti-shard law).
    const RID = [0.30, 0.85, 1.45, 2.00, 2.45].map(flankAt);
    for (let i = 0; i < RID.length - 1; i++) {
      const w0 = bw * 0.30 * (1 - 0.18 * i), w1 = bw * 0.30 * (1 - 0.18 * (i + 1));
      const a = RID[i], b = RID[i + 1];
      quad(frame, M.ash, add3(a, [0, w0, 0]), add3(b, [0, w1, 0]), add3(b, [w1 * 1.4, -w1, 0]), add3(a, [w0 * 1.4, -w0, 0]));
      quad(frame, M.flank, add3(a, [0, w0, 0]), add3(a, [-w0 * 1.4, -w0, 0]), add3(b, [-w1 * 1.4, -w1, 0]), add3(b, [0, w1, 0]));
    }
  }

  flush(arm); flush(hand); flush(root); flush(frame);

  // pure-math landmark table — geometry numbers beat rendered pixels (§11 verify chain)
  const dump = {
    hs, rootX: X0,
    landmarks: { shoulder: S, elbow: E, wrist: K, mcp3: MCP3, pip3: PIP3, tip3: TIP3, hook3: HOOK3, carpalVI: W6, bodyAnchor: B_ANCHOR },
    digits, tips, armPath, r0, sparF, propatagium: dumpPro,
    fan: { len: FAN_LEN, az: FAN_AZ, droop: FAN_DROOP, runIII, phiIII, mcLen },
    armLead, armTrail,
  };
  return { arm, hand, root, frame, K, tip: TIP3, dump };
}

// ═══════════════════════════════════════════════════════════════════════════════
export function buildBasaltForgeWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const M = forgeMats(def);
  const glow = model.glowLevel ?? 1;
  // §3 sets `hs = spanScale · 4.2` and justifies it as "shipped-premium size (span/body ≥ 1.1)".
  // MEASURED, those two clauses conflict on this torso: 4.2 delivers span/body 0.79 at glide,
  // because the shipped heroes' `halfSpan` dial is NOT their true semi-span — the Tempest's
  // struts fan OUTBOARD of its halfSpan 4.1 and its tip actually lands at 5.33 from the
  // midline (R1 T4 vs T7). Our tip is PINNED at t = 1.0 · hs, so hs is the real semi-span.
  // §12 kill #63 (and the 56%-size lesson it comes from) is an automatic loss, so the LAW
  // wins over the number. hs = 5.5 is the MEASURED landing spot (wingdump.mjs): span/body
  // 1.02 at glide, §5.1 area shares 6 / 49 / 45 and AR 9.0 — all four of §5.1's numbers on
  // spec at once, which 4.2 does not reach. Every §3 landmark is a FRACTION of hs, so the
  // whole landmark table survives the change untouched (the dump still reads Δ0.0000).
  const halfSpan = (model.spanScale ?? 1) * (model.wingHalfSpan ?? 5.5);
  const rootC = attach.wingRoot(1);
  // BODY-FRAME geometry (root fairing, scapular cowl, the raised flank line, and the
  // membrane's inboard anchor) is derived from the torso's PUBLISHED attach contract, never
  // from hs — so moving the span dial can never walk the cowl off the flank, and dropping
  // this wing onto another torso re-seats the root instead of floating it.
  const bw = Math.max(0.12, attach.halfWidthAt ? attach.halfWidthAt(rootC.z) : 0.26);
  const midY = attach.bodyMidY ?? rootC.y;
  const flankAt = (zLocal) => {
    const zm = zLocal + rootC.z;
    const hw = Math.max(0.06, attach.halfWidthAt ? attach.halfWidthAt(zm) : bw);
    const keel = attach.keelTopAt ? attach.keelTopAt(zm) : rootC.y;
    return [hw * 0.92 - rootC.x, midY + (keel - midY) * 0.30 - rootC.y, zLocal];   // a RAISED flank line, above the midline
  };
  const tailZ = (attach.tailAnchor && attach.tailAnchor.z != null) ? attach.tailAnchor.z : rootC.z + 2.4;
  const dials = {
    halfSpan, rootX: rootC.x, flankHalfWidth: bw, flankAt,
    // the plagiopatagium's body anchor, as a fraction of the root→hip run (§9)
    anchorZ: (model.wingAnchorFrac ?? 0.92) * (tailZ - rootC.z),
    digits: Math.max(2, Math.min(4, Math.round(model.wingDigits ?? 4))),
    coverts: Math.max(0, Math.round(model.wingCoverts ?? 9)),
    clusterStubs: Math.max(0, Math.min(2, Math.round(model.wingClusterStubs ?? 2))),
    glow,
  };

  // The rig's single-material wing contract = the lightest membrane tier. The membrane is
  // the DARKEST element on the dragon and carries no emissive in I1 (the def pins
  // wingEmissive / wingMembraneEmissive black). I3 puts the ventral forge window + the
  // artery doublets in `flareMats` (Surge flare, no warm cruise rim) — not here.
  M.wingMat = M.memTiers[0];

  const pivots = {}, wingElements = [];
  let dump = null;
  for (const side of [1, -1]) {
    const rt = attach.wingRoot(side);
    const pivot = new THREE.Group(); pivot.position.set(rootC.x, rootC.y, rootC.z); pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);
    const built = buildOneForgewing(M, dials);
    dump = built.dump;
    const { arm, hand, root, frame, K, tip: F0 } = built;
    mid.add(arm);
    pivot.add(root);                          // the muscular fairing rides the SHOULDER
    tip.position.set(K[0], K[1], K[2]);       // wrist fold axis = the carpal apex K …
    hand.position.set(-K[0], -K[1], -K[2]);   // … −anchor ⇒ the assembled REST pose is byte-identical
    tip.add(hand);
    // The scapular cowl + the raised flank line ride the BODY frame (static through the
    // flap, §9) — so they are siblings of the pivot, INSIDE the mirror wrapper, never
    // children of it. Build BOTH wings canonical (+X) and mirror the LEFT with an OUTER
    // scale.x = −1 wrapper that PARENTS the pivot: `pivot.scale.x = −1` desyncs
    // rotation.y/.z, and a mirror AND a per-side sign both flip. Use exactly one.
    const still = new THREE.Group(); still.position.set(rootC.x, rootC.y, rootC.z); still.add(frame);
    if (side === -1) { const lmirror = new THREE.Group(); lmirror.scale.x = -1; lmirror.add(pivot); lmirror.add(still); group.add(lmirror); }
    else { group.add(pivot); group.add(still); }
    const s = side === 1 ? 'R' : 'L';
    const marker = new THREE.Object3D(); marker.position.set(F0[0], F0[1], F0[2]); hand.add(marker);   // FX emit point rides the FOLDING hand
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip; pivots['tipMarker' + s] = marker;
    wingElements.push({ root: [rt.x, rt.y, rt.z], tip: [rt.x + side * F0[0], rt.y + F0[1], rt.z + F0[2]], length: halfSpan, tipObj: marker });
  }
  group.userData.forgewingDump = dump;   // pure-math landmark table for the verify harness
  return { group, spineMats: [], wingMat: M.wingMat, parts: { ...pivots, wingElements } };
}
registerWings('basaltForgeWings', buildBasaltForgeWings);
