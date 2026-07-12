import * as THREE from 'three';
import { mulberry32 } from './util.js';

// ARENA SET (THE UNMASKED, PR-K → GODHEAD DETONATION) — the single lit element of THE FIRSTBORN SKY
// (the S3 arena). Behind the mask there was never a building — there was the universe being born, and
// now it DETONATES and never stops. The set is ONE far element on the boss axis (~420m ahead, y≈100 —
// inside the sky-band probe, clear above the parry corridor), in THREE selectable modes:
//
//   THE GODHEAD DETONATION (owner-locked DEFAULT — the apotheosis) — a full-frame PERPETUAL radial
//   blast: hot core + widened corona + 64 tapered STREAK filaments jetting outward (energy scrolling
//   core→tip on a seamless loop) + 3 vast SHOCK RINGS whose wavefront travels outward and recycles +
//   the 4 diffraction spikes. ONE merged additive ShaderMaterial draw; uTime drives the loop
//   (EXPANSION, never rotation — §3 stillness). Colour core→rim (owner D1a): molten gold → gold-rose
//   → S2 void-violet. The eclipse corollary + down-hemisphere suppression are BAKED into the vertex
//   colour so light lives in the visible annulus AROUND the dark seraph and the corridor stays dark.
//
//   THE NEWBORN SUPERNOVA HEART / THE GALAXY-CORE SPIRAL (pre-apotheosis A/B seams, setStarMode(
//   'supernova'|'spiral') — D7a) — the static core+corona+spikes / the frozen log-spiral gas smear,
//   kept for owner preview comparison. Both HELD, barely-breathing (±2% scale), NEVER spinning.
//
// THE ANCHOR LAW (the court's post-mortem, recorded in the 2026-07-12 lesson): near-field side
// elements (|x| 19–28) + the stable-room anchor = attached-to-player jank — the lancet colonnade
// visibly rode the player. Dome-painted (the nebula = the sky-cloud FBM band, free) or ≥250m
// on-axis elements (this star) are parallax-invisible. NOTHING sits at |x| 19–28 anymore.
//
// ARCHITECTURE (unchanged spine — the stable-room law): the set FOLLOWS the player (group.z =
// -playerDist, one write/frame). GATING (unchanged): everything derives from the STATELESS
// bossArenaMix() through updateEnvironment — engage k = smoothstep(1.45→1.85) × bossArenaFade();
// the set exists ONLY in the heaven window (the S2 void keeps its austere emptiness), the natural-
// kill exhale dissolves the star with the sky, mix 0 ⇒ hidden with ZERO per-frame writes (one
// hide-write on the falling edge). Tier 2 hides the set (the palette + firmament + nebula carry
// the identity on weak mobile). A PRIVATE mulberry32 stream jitters the gas — the level/gold RNG
// is never touched (determinism law). ALL meshes on LAYER 1: out of the god-ray occlusion mask
// (additive scenery must not punch holes in the light field) and out of the water mirror. The
// below-horizon arc of the corona/spikes is depth-occluded by the (dropped) sea — the star rises
// off the galactic plane by construction, and the parry corridor never sees it.
//
// Budget: ONE live draw either mode (364 tris supernova / 452 spiral; both built at boot, one
// visible). The fairness p95 tail IS the core+spikes by design (the court lesson's zeroed-
// feature A/B: the naked vault already ships the same gates green — the star spends the headroom).

const TAU = Math.PI * 2;
const ss = (t) => { const s = Math.max(0, Math.min(1, t)); return s * s * (3 - 2 * s); };

// The heaven window on the mix clock: 0 until the gold flood is well underway, 1 by the settle.
const RISE_LO = 1.45, RISE_HI = 1.85;

// ── Godhead Star dials. On the boss axis (x 0), far behind/above the seraph (rel 30). SIZED TO THE
// SILHOUETTE: the seraph's wing fan subtends ≈±27° from the rail camera, so a "small" star behind it
// is 100% eclipsed (measured on the first build — nothing protruded). The composition is therefore
// the ECLIPSED HEART (rhyming S1's eclipse): the hot core hides BEHIND the dark seraph (it peeks in
// the fight's lateral motion — 45m boss vs 430m star parallax) while the vast corona + the spike
// cross bloom AROUND the silhouette — the seraph reads as a black figure against its own newborn sun.
const STAR_DIST = 420;              // metres ahead of the player (≥250m on-axis = parallax-invisible)
const STAR_Y = 100;                 // the corona's visible crest rides the sky band; the core sits behind the seraph's crown
const CORE_R = 10;                  // the hot heart — the ONLY near-white pixels in the frame
const CORONA_R = 240;               // the VAST soft glow — wide enough to rim the whole wing fan (vertex-faded to black, no rim)
const SPIKE_LEN = 320;              // vertical ray half-length (clears the crown by ~15°); horizontal pair 0.8× (tips clear the wingtips)
const SPIKE_W = 3.2;                // ray half-width at the core (tapers to a point)
const STAR_GAIN = 1.0;              // engage dimmer at full k (the corona profile carries the value ramp)
const BREATH_HZ = 0.22;             // the held presence barely breathes (±2% scale, never a pulse)

// ── THE DEBRIS FIELD dials (GODHEAD DETONATION P4, owner D3b) — rock chunks riding the blast: born
// deep on the axis (small screen radius = near frame centre), flying OUTWARD + FORWARD along the rays,
// recycling forever (owner §1.2 perpetual conveyor). DARK flat-shaded silhouettes (NOT additive — they
// SUBTRACT brightness from the probes = fairness-positive). Stable-room anchored (under `set`) + TIME-
// driven so the conveyor never freezes even when the player hovers. Hard |x| ≥ 25 keeps the focal +
// corridor column clean (layout-asserted). ONE InstancedMesh, +1 draw, tier-2 hidden with the set.
const DEBRIS_N = 30;                // 28 + 2 hero chunks (D3b medium)
const DEBRIS_R_IN = 34, DEBRIS_R_OUT = 106;   // screen-radius spread: inner (deep, near centre) → outer (frame edge). R_IN·cos(0.6)=28 ≥ 25 by construction
const DEBRIS_Z_FAR = -560, DEBRIS_Z_NEAR = -70;   // conveyor depth travel (local to the −playerDist anchor): deep (appears central) → near (flown forward)
const DEBRIS_CY = 62;              // the detonation centre the field radiates from (between the boss ≈18 and the star 100)
const DEBRIS_BODY = 0x14102a;      // near-black indigo — dark tumbling silhouettes; lit warm on the star side by lightSun

// Owner-locked star mode: 'detonation' (THE GODHEAD DETONATION — the locked default) |
// 'supernova' | 'spiral' (the pre-apotheosis A/B seams, kept for owner preview — D7a).
let STAR_MODE = 'detonation';

let set = null;                     // the root group (built once at boot, hidden)
let starGroup = null;               // breath pivot at (0, STAR_Y, -STAR_DIST)
let nova = null, spiral = null, deton = null;   // the three mode meshes (one visible)
let novaMat = null, spiralMat = null, detMat = null;
let debris = null, debrisMat = null, debrisP = null, debrisMinX = 0;   // the recycled radial-outward rock conveyor
let tierHidden = false;             // low-tier kill switch (setArenaSetQuality)
let lastK = 0;                      // debug seam: the engage level actually applied this frame
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _sc = new THREE.Vector3();   // debris scratch (alloc-free)

// ── SUPERNOVA geometry: corona rings + core disc + 4 diffraction spikes, merged into ONE
// non-indexed additive buffer (one draw). Vertex colour carries the whole value structure:
// corona (1-r)^2.4 falloff to EXACT black at the rim, near-white core, spikes fading to points.
function buildNovaGeo(prnd) {
  const pos = [], col = [];
  const GOLD = [1.0, 0.84, 0.55];         // the star's own gas — warm gold
  const ROSE = [1.0, 0.62, 0.50];         // gold-rose at the corona's breath (keeps the nebula key)
  const tri = (a, b, c, ca, cb, cc) => { pos.push(...a, ...b, ...c); col.push(...ca, ...cb, ...cc); };
  const P = (r, a) => [Math.cos(a) * r, Math.sin(a) * r, 0];
  // Corona: 5 concentric rings, radial profile (1-r)^1.4 → black by the rim (no hard edge). The
  // SLOW falloff is deliberate: the visible zone is the corona's OUTER half (the inner half is
  // eclipsed by the seraph), so the profile must still carry light where it clears the silhouette.
  const RSEG = 5, ASEG = 32;
  const prof = (t) => Math.pow(Math.max(0, 1 - t), 1.4) * 0.5;   // peak .5 at the core edge — a blaze that decays to a rim-glow, never a wash
  const cCol = (t) => {
    const b = prof(t), mixR = ss(t * 1.4);                        // gold heart → rose breath outward
    return [b * (GOLD[0] + (ROSE[0] - GOLD[0]) * mixR), b * (GOLD[1] + (ROSE[1] - GOLD[1]) * mixR), b * (GOLD[2] + (ROSE[2] - GOLD[2]) * mixR)];
  };
  for (let j = 0; j < RSEG; j++) {
    const t0 = j / RSEG, t1 = (j + 1) / RSEG;
    const r0 = CORE_R + t0 * (CORONA_R - CORE_R), r1 = CORE_R + t1 * (CORONA_R - CORE_R);
    const c0 = cCol(t0), c1 = cCol(t1);
    for (let i = 0; i < ASEG; i++) {
      const a0 = (i / ASEG) * TAU, a1 = ((i + 1) / ASEG) * TAU;
      tri(P(r0, a0), P(r1, a0), P(r1, a1), c0, c1, c1);
      tri(P(r0, a0), P(r1, a1), P(r0, a1), c0, c1, c0);
    }
  }
  // Core: a hot fan — the newborn heart. Near-white centre easing to the corona's edge value.
  const CSEG = 20, CORE_C = [1.0, 0.97, 0.88], EDGE_C = cCol(0);
  for (let i = 0; i < CSEG; i++) {
    const a0 = (i / CSEG) * TAU, a1 = ((i + 1) / CSEG) * TAU;
    tri([0, 0, 0], P(CORE_R, a0), P(CORE_R, a1), CORE_C, EDGE_C, EDGE_C);
  }
  // 4 diffraction spikes: thin tapered quads on the axes (the vertical pair a touch longer —
  // camera-lens convention), brightness fading to nothing at the tips. z +0.1 so they never
  // z-fight the corona (additive: order irrelevant, depth-equal fragments aren't).
  const SPIKE_C = [0.95, 0.86, 0.62];
  for (let s = 0; s < 4; s++) {
    const ang = (s * Math.PI) / 2;      // axes at 0/90/180/270 — the camera-lens cross
    const len = SPIKE_LEN * (s % 2 === 1 ? 1.0 : 0.8) * (0.96 + prnd() * 0.08);   // VERTICAL pair (s 1/3, ang 90/270) full-length — the up-ray must clear the crown; a hair of private jitter
    const dx = Math.cos(ang + Math.PI / 2), dy = Math.sin(ang + Math.PI / 2);      // width dir
    const ex = Math.cos(ang), ey = Math.sin(ang);                                  // length dir
    const SEG = 3;
    for (let j = 0; j < SEG; j++) {
      const t0 = j / SEG, t1 = (j + 1) / SEG;
      const w0 = SPIKE_W * (1 - t0), w1 = SPIKE_W * (1 - t1);
      const b0 = Math.pow(1 - t0, 1.5) * 0.85, b1 = Math.pow(1 - t1, 1.5) * 0.85;
      const c0 = [SPIKE_C[0] * b0, SPIKE_C[1] * b0, SPIKE_C[2] * b0];
      const c1 = [SPIKE_C[0] * b1, SPIKE_C[1] * b1, SPIKE_C[2] * b1];
      const p00 = [ex * len * t0 + dx * w0, ey * len * t0 + dy * w0, 0.1];
      const p01 = [ex * len * t0 - dx * w0, ey * len * t0 - dy * w0, 0.1];
      const p10 = [ex * len * t1 + dx * w1, ey * len * t1 + dy * w1, 0.1];
      const p11 = [ex * len * t1 - dx * w1, ey * len * t1 - dy * w1, 0.1];
      tri(p00, p01, p11, c0, c0, c1);
      tri(p00, p11, p10, c0, c1, c1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}

// ── GALAXY-CORE SPIRAL geometry (the A/B alternative): a bright core + 3 STATIC log-spiral arm
// ribbons of gold-rose gas, widening and fading to black outward. A frozen form — it is built
// wound and NEVER rotates (§3 stillness); only the shared breath pivot scales it ±2%.
function buildSpiralGeo(prnd) {
  const pos = [], col = [];
  const tri = (a, b, c, ca, cb, cc) => { pos.push(...a, ...b, ...c); col.push(...ca, ...cb, ...cc); };
  const GOLD = [1.0, 0.82, 0.52], ROSE = [0.95, 0.52, 0.46];
  const ARMS = 3, SEG = 36;
  const R0 = 16, R1 = 250;               // core edge → arm tip (sized like the corona: the arms must CLEAR the seraph's ±27° fan)
  const SWEEP = TAU * 0.62;              // each arm sweeps ~223° — a clear spiral, not a ring
  const B = Math.log(R1 / R0) / SWEEP;   // log-spiral pitch: r = R0 · e^(B·θ)
  for (let arm = 0; arm < ARMS; arm++) {
    const a0 = (arm / ARMS) * TAU + prnd() * 0.12;                 // private-stream phase jitter
    const gain = 0.62 * (0.92 + prnd() * 0.16);                    // per-arm value variation
    for (let j = 0; j < SEG; j++) {
      const t0 = j / SEG, t1 = (j + 1) / SEG;
      const mk = (t) => {
        const th = a0 + t * SWEEP;
        const r = R0 * Math.exp(B * t * SWEEP);
        const w = 10 + 42 * t;                                     // gas smear widens outward
        // Mid-weighted profile: the inner arms are eclipsed by the seraph (like the corona's core),
        // so the light must live in the MID-OUTER sweep that clears the fan — rising from the bulge,
        // peaking ~t .45, dying to black at the tip.
        const b = Math.pow(t, 0.6) * Math.pow(1 - t, 0.9) * 2.1 * gain;
        const kR = ss(t * 1.3);
        const c = [b * (GOLD[0] + (ROSE[0] - GOLD[0]) * kR), b * (GOLD[1] + (ROSE[1] - GOLD[1]) * kR), b * (GOLD[2] + (ROSE[2] - GOLD[2]) * kR)];
        // ribbon spans [inner, outer] across the width dir (radial)
        const cx = Math.cos(th), sy = Math.sin(th);
        return { in: [cx * (r - w / 2), sy * (r - w / 2), 0], out: [cx * (r + w / 2), sy * (r + w / 2), 0], c };
      };
      const q0 = mk(t0), q1 = mk(t1);
      const BLACK = [0, 0, 0];
      // Edge vertices are BLACK (soft gas, no hard ribbon rim); the centreline carries the colour.
      const mid0 = [(q0.in[0] + q0.out[0]) / 2, (q0.in[1] + q0.out[1]) / 2, 0];
      const mid1 = [(q1.in[0] + q1.out[0]) / 2, (q1.in[1] + q1.out[1]) / 2, 0];
      tri(q0.in, mid0, mid1, BLACK, q0.c, q1.c);
      tri(q0.in, mid1, q1.in, BLACK, q1.c, BLACK);
      tri(mid0, q0.out, q1.out, q0.c, BLACK, BLACK);
      tri(mid0, q1.out, mid1, q0.c, BLACK, q1.c);
    }
  }
  // The core: same hot fan as the supernova (a galactic bulge, not a blast).
  const CSEG = 20, CORE_C = [1.0, 0.94, 0.82], EDGE_C = [0.34, 0.25, 0.15];
  for (let i = 0; i < CSEG; i++) {
    const a0 = (i / CSEG) * TAU, a1 = ((i + 1) / CSEG) * TAU;
    tri([0, 0, 0.1], [Math.cos(a0) * R0, Math.sin(a0) * R0, 0.1], [Math.cos(a1) * R0, Math.sin(a1) * R0, 0.1], CORE_C, EDGE_C, EDGE_C);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}

// ══════════════════ THE GODHEAD DETONATION (owner-locked default mode) ══════════════════
// The newborn supernova heart goes off and KEEPS erupting — a PERPETUAL radial detonation (FF7
// Safer-Sephiroth's STYLE, our indigo+gold colour). ONE merged additive ShaderMaterial draw:
//   • CORE + widened CORONA (R 280) + 4 diffraction SPIKES — the static star glyph (aType 0).
//   • RADIAL STREAK FAN — 64 tapered filaments jetting from the core to the frame edges, energy
//     SCROLLING outward core→tip on a seamless loop (aType 1). The ECLIPSE corollary is BAKED into
//     the vertex colour by ACTUAL radius (black until a streak clears the seraph's ±27° fan at
//     r≈210 @ 420m, then ignites, then decays to black at the tip) — light lives in the visible
//     annulus AROUND the dark figure. DOWN-hemisphere streaks are 0.5× length + 0.4× gain (baked).
//   • SHOCK RINGS — 3 vast soft annuli (R 180/300/430) with a wavefront that travels outward and
//     recycles seamlessly (aType 2), black on both edges, lower-half suppressed (baked).
// Colour gradient (owner D1a) core→rim: molten gold → gold-rose (the nebula key) → S2 void-violet.
// The LOOP is the point: uTime scrolls the streaks + rings every frame — two captures ≥1s apart
// MUST differ in the streak band (a dead loop is a build failure). Expansion, never rotation (§3).
const GOLD_IN = [1.00, 0.85, 0.54];    // molten-gold inner blast (0xffd98a)
const ROSE_MID = [0.85, 0.54, 0.39];   // gold-rose mid filaments (0xd98a64 — the shipped nebula key)
const VIO_OUT = [0.50, 0.40, 0.70];    // rose-violet → S2 void-violet shock rim (0x6a5ca8, additive-boosted)
const DET_CORONA_R = 280;              // the blast corona, widened from the nova's 240
const ECL_R0 = 150, ECL_R1 = 210;      // the seraph's ±27° eclipse @ 420m: streaks are black inside, ignite outside
const smoothstep = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// core→rim gradient: gold → rose (t<.5) → violet (t≥.5)
const detGrad = (t) => t < 0.5 ? lerp3(GOLD_IN, ROSE_MID, t / 0.5) : lerp3(ROSE_MID, VIO_OUT, (t - 0.5) / 0.5);

function buildDetonationGeo(prnd) {
  const pos = [], acol = [], auv = [], atype = [], aphase = [];
  const push = (p, c, u, ty, ph) => { pos.push(p[0], p[1], p[2]); acol.push(c[0], c[1], c[2]); auv.push(u[0], u[1]); atype.push(ty); aphase.push(ph); };
  const quad = (p0, p1, p2, p3, c0, c1, u0, u1, ty, ph) => {   // p0,p1 @ u0 ; p2,p3 @ u1 (p0/p3 same side)
    push(p0, c0, [u0, 0], ty, ph); push(p1, c0, [u0, 1], ty, ph); push(p2, c1, [u1, 1], ty, ph);
    push(p0, c0, [u0, 0], ty, ph); push(p2, c1, [u1, 1], ty, ph); push(p3, c1, [u1, 0], ty, ph);
  };
  const P = (r, a) => [Math.cos(a) * r, Math.sin(a) * r, 0];

  // ── CORE (aType 0): the hot newborn heart — near-white, the frame's only near-white pixels.
  const CSEG = 20, CORE_C = [1.0, 0.97, 0.88], EDGE_C = [GOLD_IN[0] * 0.5, GOLD_IN[1] * 0.5, GOLD_IN[2] * 0.5];
  for (let i = 0; i < CSEG; i++) {
    const a0 = (i / CSEG) * TAU, a1 = ((i + 1) / CSEG) * TAU;
    push([0, 0, 0], CORE_C, [0, 0], 0, 0); push(P(CORE_R, a0), EDGE_C, [0, 0], 0, 0); push(P(CORE_R, a1), EDGE_C, [0, 0], 0, 0);
  }
  // ── CORONA (aType 0): the vast soft blast glow — (1-t)^1.4 to black at the rim (no hard edge).
  const RSEG = 5, ASEG = 32;
  const cProf = (t) => Math.pow(Math.max(0, 1 - t), 1.4) * 0.5;
  const cCol = (t) => { const b = cProf(t), c = lerp3(GOLD_IN, ROSE_MID, ss(t * 1.3)); return [c[0] * b, c[1] * b, c[2] * b]; };
  for (let j = 0; j < RSEG; j++) {
    const t0 = j / RSEG, t1 = (j + 1) / RSEG;
    const r0 = CORE_R + t0 * (DET_CORONA_R - CORE_R), r1 = CORE_R + t1 * (DET_CORONA_R - CORE_R);
    const c0 = cCol(t0), c1 = cCol(t1);
    for (let i = 0; i < ASEG; i++) {
      const a0 = (i / ASEG) * TAU, a1 = ((i + 1) / ASEG) * TAU;
      push(P(r0, a0), c0, [0, 0], 0, 0); push(P(r1, a0), c1, [0, 0], 0, 0); push(P(r1, a1), c1, [0, 0], 0, 0);
      push(P(r0, a0), c0, [0, 0], 0, 0); push(P(r1, a1), c1, [0, 0], 0, 0); push(P(r0, a1), c0, [0, 0], 0, 0);
    }
  }
  // ── RADIAL STREAK FAN (aType 1): the frame-filler + the primary perpetual loop. Eclipse + down-
  // suppression BAKED into vertex colour; the shader adds the outward scroll + tip decay + edge fade.
  const NST = 64, SEG = 5, W_IN = 6.5, W_TIP = 1.1;
  for (let s = 0; s < NST; s++) {
    const a = (s / NST) * TAU + (prnd() - 0.5) * 0.05;
    const sinA = Math.sin(a), down = sinA < -0.15;              // pointing below horizontal
    const lenBase = 300 + prnd() * 320;                         // 300..620u — long ones reach the frame edges
    const len = down ? lenBase * 0.5 : lenBase, gain = down ? 0.4 : 1.0;
    const ex = Math.cos(a), ey = sinA, nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
    const ph = prnd() * TAU;                                    // per-streak scroll phase (breaks lockstep)
    for (let j = 0; j < SEG; j++) {
      const t0 = j / SEG, t1 = (j + 1) / SEG;
      const r0 = CORE_R + t0 * (len - CORE_R), r1 = CORE_R + t1 * (len - CORE_R);
      const w0 = W_IN + (W_TIP - W_IN) * t0, w1 = W_IN + (W_TIP - W_IN) * t1;
      const e0 = smoothstep(ECL_R0, ECL_R1, r0) * gain, e1 = smoothstep(ECL_R0, ECL_R1, r1) * gain;
      const g0 = detGrad(t0), g1 = detGrad(t1);
      const c0 = [g0[0] * e0, g0[1] * e0, g0[2] * e0], c1 = [g1[0] * e1, g1[1] * e1, g1[2] * e1];
      const L0 = [ex * r0 + nx * w0, ey * r0 + ny * w0, 0.05], R0 = [ex * r0 - nx * w0, ey * r0 - ny * w0, 0.05];
      const L1 = [ex * r1 + nx * w1, ey * r1 + ny * w1, 0.05], R1 = [ex * r1 - nx * w1, ey * r1 - ny * w1, 0.05];
      quad(L0, R0, R1, L1, c0, c1, t0, t1, 1, ph);
    }
  }
  // ── SHOCK RINGS (aType 2): 3 vast soft annuli, wavefront travels outward + recycles (shader).
  // Colour + amplitude + lower-half suppression BAKED; the shader's band envelope keeps both edges black.
  const RINGS = [[180, 70, 0.30, GOLD_IN], [300, 85, 0.24, [0.62, 0.46, 0.62]], [430, 95, 0.18, VIO_OUT]];
  const RRSEG = 64;
  for (let ri = 0; ri < RINGS.length; ri++) {
    const [R, bw, amp, base] = RINGS[ri], inner = R - bw, outer = R + bw, ph = ri * 2.1;
    for (let i = 0; i < RRSEG; i++) {
      const a0 = (i / RRSEG) * TAU, a1 = ((i + 1) / RRSEG) * TAU;
      const d0 = 0.4 + 0.6 * smoothstep(-0.4, 0.2, Math.sin(a0)), d1 = 0.4 + 0.6 * smoothstep(-0.4, 0.2, Math.sin(a1));   // down-suppress lower half
      const c0 = [base[0] * amp * d0, base[1] * amp * d0, base[2] * amp * d0], c1 = [base[0] * amp * d1, base[1] * amp * d1, base[2] * amp * d1];
      const IN0 = P(inner, a0), OUT0 = P(outer, a0), OUT1 = P(outer, a1), IN1 = P(inner, a1);
      // uv.x = radial t across the band (0 inner → 1 outer); the shader bands it to black at both.
      push(IN0, c0, [0, 0], 2, ph); push(OUT0, c0, [1, 0], 2, ph); push(OUT1, c1, [1, 0], 2, ph);
      push(IN0, c0, [0, 0], 2, ph); push(OUT1, c1, [1, 0], 2, ph); push(IN1, c1, [0, 0], 2, ph);
    }
  }
  // ── 4 DIFFRACTION SPIKES (aType 0): the star-optics glyph survives inside the blast.
  const SPIKE_C = [0.95, 0.86, 0.62];
  for (let s = 0; s < 4; s++) {
    const ang = (s * Math.PI) / 2, len = SPIKE_LEN * (s % 2 === 1 ? 1.0 : 0.8) * (0.96 + prnd() * 0.08);
    const dx = Math.cos(ang + Math.PI / 2), dy = Math.sin(ang + Math.PI / 2), ex = Math.cos(ang), ey = Math.sin(ang);
    const SSEG = 3;
    for (let j = 0; j < SSEG; j++) {
      const t0 = j / SSEG, t1 = (j + 1) / SSEG, w0 = SPIKE_W * (1 - t0), w1 = SPIKE_W * (1 - t1);
      const b0 = Math.pow(1 - t0, 1.5) * 0.85, b1 = Math.pow(1 - t1, 1.5) * 0.85;
      const c0 = [SPIKE_C[0] * b0, SPIKE_C[1] * b0, SPIKE_C[2] * b0], c1 = [SPIKE_C[0] * b1, SPIKE_C[1] * b1, SPIKE_C[2] * b1];
      const p00 = [ex * len * t0 + dx * w0, ey * len * t0 + dy * w0, 0.1], p01 = [ex * len * t0 - dx * w0, ey * len * t0 - dy * w0, 0.1];
      const p10 = [ex * len * t1 + dx * w1, ey * len * t1 + dy * w1, 0.1], p11 = [ex * len * t1 - dx * w1, ey * len * t1 - dy * w1, 0.1];
      push(p00, c0, [0, 0], 0, 0); push(p01, c0, [0, 0], 0, 0); push(p11, c1, [0, 0], 0, 0);
      push(p00, c0, [0, 0], 0, 0); push(p11, c1, [0, 0], 0, 0); push(p10, c1, [0, 0], 0, 0);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aCol', new THREE.Float32BufferAttribute(acol, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(auv, 2));
  geo.setAttribute('aType', new THREE.Float32BufferAttribute(atype, 1));
  geo.setAttribute('aPhase', new THREE.Float32BufferAttribute(aphase, 1));
  return geo;
}

// The detonation's additive ShaderMaterial — uTime scrolls the perpetual loop, uGain is the engage
// dimmer (the corona idiom, moved to a uniform). Same additive/depth/tone flags as the static mats.
const DET_VERT = `
  attribute vec3 aCol; attribute float aType; attribute float aPhase;
  varying vec3 vCol; varying vec2 vUv; varying float vType; varying float vPhase;
  void main(){ vCol = aCol; vUv = uv; vType = aType; vPhase = aPhase;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const DET_FRAG = `
  precision mediump float;
  uniform float uTime; uniform float uGain; uniform float uFlow; uniform float uRing;
  varying vec3 vCol; varying vec2 vUv; varying float vType; varying float vPhase;
  void main(){
    float b = 1.0;
    if (vType > 1.5) {                                   // SHOCK RING — soft band + outward wavefront
      float t = vUv.x;
      float band = pow(sin(t * 3.14159265), 1.4);        // black on both edges
      float wave = 0.55 + 0.45 * sin(t * 6.2831853 - uTime * uRing + vPhase);
      b = band * wave;
    } else if (vType > 0.5) {                            // STREAK — tip decay × edge fade × outward scroll
      float t = vUv.x;
      float decay = pow(max(0.0, 1.0 - t), 0.85);        // dies to black at the tip
      float edge = pow(1.0 - abs(2.0 * vUv.y - 1.0), 1.2); // soft sides, no hard rim
      float flow = 0.5 + 0.5 * sin(t * 18.8495559 - uTime * uFlow + vPhase); // energy jets core→tip, forever
      b = decay * edge * flow;
    }
    gl_FragColor = vec4(vCol * b * uGain, 1.0);          // additive: black adds nothing (soft everywhere)
  }`;
const addDetMat = () => {
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uGain: { value: 0 }, uFlow: { value: 3.8 }, uRing: { value: 1.5 } },
    vertexShader: DET_VERT, fragmentShader: DET_FRAG,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false,
  });
  m.toneMapped = false;
  return m;
};

const addMat = () => {
  const m = new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, fog: false,
  });
  m.toneMapped = false;         // .color scalar is the engage dimmer (the corona idiom)
  m.color.setScalar(0);
  return m;
};

// ── THE DEBRIS FIELD (P4): one InstancedMesh of lumpy dark rocks. Geometry jittered ONCE off the
// PRIVATE debris stream (a distinct seed from the star's — determinism law); per-instance conveyor
// params baked. Matrices are recomputed each visible frame (30 instances = a tiny upload). Scale 0 at
// build so a pre-update frame shows nothing. Returns the theoretical min |x| for the layout assert.
function buildDebris(prnd) {
  const geo = new THREE.IcosahedronGeometry(1, 0);   // 20 faces — a low-poly rock (30×20 = 600 tris)
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i, pos.getX(i) * (0.65 + prnd() * 0.7), pos.getY(i) * (0.65 + prnd() * 0.7), pos.getZ(i) * (0.65 + prnd() * 0.7));   // irregular chunk
  }
  geo.computeVertexNormals();
  debrisMat = new THREE.MeshStandardMaterial({ color: DEBRIS_BODY, roughness: 1.0, metalness: 0.0, flatShading: true });   // dark, faceted, opaque (NOT additive) — a brightness SUBTRACTOR
  debris = new THREE.InstancedMesh(geo, debrisMat, DEBRIS_N);
  debris.name = 'godheadDebris';
  debris.frustumCulled = false;
  debris.layers.set(1);   // out of the god-ray mask + water mirror (opaque, but the RenderPass shares depth so it still occludes correctly)
  debrisP = [];
  let minX = Infinity;
  for (let i = 0; i < DEBRIS_N; i++) {
    const side = prnd() < 0.5 ? -1 : 1;
    const ang = (prnd() - 0.5) * 1.2;                          // ±0.6 rad from horizontal — the vertical column stays clear
    let size = 2.0 + prnd() * 2.2;
    if (i < 2) size *= 2.4;                                     // 2 hero chunks (D3b)
    const yBias = (i >= 2 && i < 6) ? -(48 + prnd() * 30) : 0; // 4 chunks below-deck, half-sunk in the haze
    const speed = 0.085 + prnd() * 0.06;                       // conveyor traverse ≈ 7–11s (majestic, D6a)
    debrisP.push({ side, cos: Math.cos(ang), sin: Math.sin(ang), size, yBias, speed, phase: prnd(),
      ts: (prnd() - 0.5) * 0.6, e0: prnd() * TAU, e1: prnd() * TAU, e2: prnd() * TAU });   // tumble seeds (local spin; translation stays radial — nothing orbits)
    minX = Math.min(minX, Math.abs(Math.cos(ang)) * DEBRIS_R_IN);
    debris.setMatrixAt(i, _m.makeScale(0, 0, 0));              // hidden until the first drive frame
  }
  debris.instanceMatrix.needsUpdate = true;
  debrisMinX = +minX.toFixed(2);
}

// Build once at boot (createEnvironment), hidden. Idempotent.
export function createArenaSet(scene) {
  if (set) return;
  set = new THREE.Group();
  set.name = 'arenaSet';
  set.visible = false;

  const prnd = mulberry32(0x5e7a9c1);   // PRIVATE stream — the level/gold RNG is never touched

  starGroup = new THREE.Group();
  starGroup.name = 'godheadStar';
  starGroup.position.set(0, STAR_Y, -STAR_DIST);

  novaMat = addMat();
  nova = new THREE.Mesh(buildNovaGeo(prnd), novaMat);
  nova.name = 'supernovaHeart';
  nova.frustumCulled = false;
  nova.layers.set(1);                   // out of the god-ray mask + water mirror
  nova.visible = false;                 // an A/B seam only (detonation is the default)
  starGroup.add(nova);

  spiralMat = addMat();
  spiral = new THREE.Mesh(buildSpiralGeo(prnd), spiralMat);
  spiral.name = 'galaxyCoreSpiral';
  spiral.frustumCulled = false;
  spiral.layers.set(1);
  spiral.visible = false;               // an A/B seam only
  starGroup.add(spiral);

  detMat = addDetMat();
  deton = new THREE.Mesh(buildDetonationGeo(prnd), detMat);
  deton.name = 'godheadDetonation';
  deton.frustumCulled = false;
  deton.layers.set(1);                  // out of the god-ray mask + water mirror
  deton.visible = true;                 // THE GODHEAD DETONATION is the owner-locked default
  starGroup.add(deton);

  buildDebris(mulberry32(0x0d3b71f));   // PRIVATE stream, distinct from the star's — the level/gold RNG is never touched
  set.add(debris);                      // under `set` (the stable room), NOT starGroup (debris must not inherit the breath)

  set.add(starGroup);
  scene.add(set);
}

// Owner A/B seam: swap the star's form ('supernova' | 'spiral'). One visibility flip — both
// meshes exist from boot, exactly one draws. Any other value is ignored (belt-and-braces).
export function setStarMode(mode) {
  if (mode !== 'detonation' && mode !== 'supernova' && mode !== 'spiral') return;
  STAR_MODE = mode;
  if (deton) deton.visible = mode === 'detonation';
  if (nova) nova.visible = mode === 'supernova';
  if (spiral) spiral.visible = mode === 'spiral';
}

// Per-frame drive — called from updateEnvironment with the SAME stateless mix/fade the arena skin
// reads. Hidden ⇒ one write on the falling edge, then zero writes (the arenaPropsGate recipe).
export function updateArenaSet(time, playerDist, mix, fade) {
  if (!set) return;
  const k = tierHidden ? 0 : ss((mix - RISE_LO) / (RISE_HI - RISE_LO)) * Math.max(0, Math.min(1, fade));
  if (k <= 0) {
    if (set.visible) {
      set.visible = false;
      novaMat.color.setScalar(0); spiralMat.color.setScalar(0); detMat.uniforms.uGain.value = 0;
    }
    lastK = 0;
    return;
  }
  lastK = k;
  set.visible = true;
  set.position.z = -playerDist;         // the stable room: hold formation around the fight
  // THE HELD PRESENCE: ±2% scale breath, near-steady light — a newborn heart, never a strobe,
  // never a spin (§3 stillness; the spiral is a FROZEN form — rotating it is forbidden). The
  // DETONATION's roil is EXPANSION (uTime-scrolled streaks/rings), not rotation — the loop runs
  // continuously (owner §1): a dead loop is a build failure.
  starGroup.scale.setScalar(1 + 0.02 * Math.sin(time * BREATH_HZ));
  const glow = k * STAR_GAIN * (0.98 + 0.02 * Math.sin(time * 0.31));
  if (STAR_MODE === 'detonation') { detMat.uniforms.uGain.value = glow; detMat.uniforms.uTime.value = time; }
  else (STAR_MODE === 'supernova' ? novaMat : spiralMat).color.setScalar(glow);

  // THE DEBRIS CONVEYOR (P4): each chunk rides a ray from deep-centre outward+forward and recycles,
  // forever (TIME-driven — never freezes). Scale-in at birth, fade at recycle → seamless loop. The
  // tumble is LOCAL spin; the translation is radial-outward, never an orbit (§3 stillness).
  if (debris) {
    for (let i = 0; i < DEBRIS_N; i++) {
      const d = debrisP[i];
      const p = (time * d.speed + d.phase) % 1;
      const r = DEBRIS_R_IN + (DEBRIS_R_OUT - DEBRIS_R_IN) * p;
      const env = ss(p / 0.06) * ss((1 - p) / 0.14);            // birth scale-in · recycle fade-out
      _v.set(d.side * d.cos * r, DEBRIS_CY + d.sin * r + d.yBias, DEBRIS_Z_FAR + (DEBRIS_Z_NEAR - DEBRIS_Z_FAR) * p);
      _e.set(d.e0 + time * d.ts, d.e1 + time * d.ts * 0.7, d.e2);
      _q.setFromEuler(_e);
      _sc.setScalar(Math.max(1e-4, d.size * k * env));
      debris.setMatrixAt(i, _m.compose(_v, _q, _sc));
    }
    debris.instanceMatrix.needsUpdate = true;
  }
}

// Tier off-switch (main.js applyQuality): the low tier drops the set entirely — the cosmos
// palette + firmament + nebula carry the identity there (the god-ray/kick tier precedent).
export function setArenaSetQuality(tier) {
  tierHidden = tier >= 2;
}

// Debug seam (tests/unmaskedarena.mjs): the coexist proof reads this through bossArenaState().
// `mode`/`star` replace the old `panes` count (the court is retired — the coexist asserts moved
// with it).
export function debugArenaSet() {
  return { built: !!set, visible: !!set && set.visible, k: +lastK.toFixed(3), mode: STAR_MODE, star: !!nova,
    detUTime: detMat ? +detMat.uniforms.uTime.value.toFixed(2) : 0,   // detUTime advances ⇒ the perpetual loop is driven
    debrisN: DEBRIS_N, debrisVis: !!set && set.visible && !!debris, debrisMinX,   // debrisMinX ≥ 25 ⇒ no chunk enters the focal/corridor column
    tierHidden };
}

// Belt-and-braces for the restart path (resetEnvironment) — the stateless mix would self-heal
// next frame anyway; this guarantees no single stale frame of the star on a new run.
export function resetArenaSet() {
  if (set && set.visible) {
    set.visible = false;
    novaMat.color.setScalar(0); spiralMat.color.setScalar(0); detMat.uniforms.uGain.value = 0;
    lastK = 0;
  }
}
