import * as THREE from 'three';
import { mulberry32 } from './util.js';

// ARENA SET (THE UNMASKED, PR-K) — THE GODHEAD STAR: the single lit element of THE FIRSTBORN SKY
// (the S3 arena, REDONE from the judgment-court cathedral the owner pivoted away from). Behind the
// mask there was never a building — there was the universe being born. The set is ONE far element
// on the boss axis (~420m ahead, y≈62 — inside the sky-band probe, clear above the parry corridor):
//
//   THE NEWBORN SUPERNOVA HEART (owner-locked default) — a small HOT core disc (the frame's only
//   near-white pixels) + a vast soft additive corona annulus (vertex-faded to black — no hard rim,
//   the Voidmaw-portal law) + 4 long thin diffraction SPIKES (the universal "this is a STAR" glyph
//   — it reads as optics, not architecture). A HELD, barely-breathing presence: ±2% scale breath,
//   near-steady brightness, NEVER spins (§3 stillness).
//
//   THE GALAXY-CORE SPIRAL (owner A/B alternative, setStarMode('spiral')) — a STATIC frozen spiral
//   smear: 3 log-spiral arms of additive gold-rose gas fading to black around a bright core, at the
//   same position/breath. Do NOT rotate it — the spiral is a frozen form (§3 stillness); only the
//   same ±2% breath. One-line swap for the owner preview A/B (STAR_MODE below / the debug seam).
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

// Owner-locked star mode: 'supernova' (the locked default) | 'spiral' (the A/B alternative).
let STAR_MODE = 'supernova';

let set = null;                     // the root group (built once at boot, hidden)
let starGroup = null;               // breath pivot at (0, STAR_Y, -STAR_DIST)
let nova = null, spiral = null;     // the two mode meshes (one visible)
let novaMat = null, spiralMat = null;
let tierHidden = false;             // low-tier kill switch (setArenaSetQuality)
let lastK = 0;                      // debug seam: the engage level actually applied this frame

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

const addMat = () => {
  const m = new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, fog: false,
  });
  m.toneMapped = false;         // .color scalar is the engage dimmer (the corona idiom)
  m.color.setScalar(0);
  return m;
};

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
  starGroup.add(nova);

  spiralMat = addMat();
  spiral = new THREE.Mesh(buildSpiralGeo(prnd), spiralMat);
  spiral.name = 'galaxyCoreSpiral';
  spiral.frustumCulled = false;
  spiral.layers.set(1);
  spiral.visible = false;               // the supernova is the owner-locked default
  starGroup.add(spiral);

  set.add(starGroup);
  scene.add(set);
}

// Owner A/B seam: swap the star's form ('supernova' | 'spiral'). One visibility flip — both
// meshes exist from boot, exactly one draws. Any other value is ignored (belt-and-braces).
export function setStarMode(mode) {
  if (mode !== 'supernova' && mode !== 'spiral') return;
  STAR_MODE = mode;
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
      novaMat.color.setScalar(0); spiralMat.color.setScalar(0);
    }
    lastK = 0;
    return;
  }
  lastK = k;
  set.visible = true;
  set.position.z = -playerDist;         // the stable room: hold formation around the fight
  // THE HELD PRESENCE: ±2% scale breath, near-steady light — a newborn heart, never a strobe,
  // never a spin (§3 stillness; the spiral is a FROZEN form — rotating it is forbidden).
  starGroup.scale.setScalar(1 + 0.02 * Math.sin(time * BREATH_HZ));
  const glow = k * STAR_GAIN * (0.98 + 0.02 * Math.sin(time * 0.31));
  (STAR_MODE === 'supernova' ? novaMat : spiralMat).color.setScalar(glow);
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
  return { built: !!set, visible: !!set && set.visible, k: +lastK.toFixed(3), mode: STAR_MODE, star: !!nova, tierHidden };
}

// Belt-and-braces for the restart path (resetEnvironment) — the stateless mix would self-heal
// next frame anyway; this guarantees no single stale frame of the star on a new run.
export function resetArenaSet() {
  if (set && set.visible) {
    set.visible = false;
    novaMat.color.setScalar(0); spiralMat.color.setScalar(0);
    lastK = 0;
  }
}
