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
const DEBRIS_N = 30;                // 8 FLYBY (huge, whoosh past the camera) + 22 background conveyor
const DEBRIS_R_IN = 34, DEBRIS_R_OUT = 106;   // screen-radius spread: inner (deep, near centre) → outer (frame edge). R_IN·cos(0.6)=28 ≥ 25 by construction
const DEBRIS_Z_FAR = -560, DEBRIS_Z_NEAR = -70;   // conveyor depth travel (local to the −playerDist anchor): deep (appears central) → near (flown forward)
const DEBRIS_CY = 62;              // the detonation centre the field radiates from (between the boss ≈18 and the star 100)
// (P5) the rock albedo now lives in ROCK_ALBEDO (per-instance instanceColor); the old single indigo body is retired
// FLYBY dials — huge rocks coming CLOSE and whooshing PAST the camera on the sides, provably never in
// the flight lane. The keep-out is a CONE that WIDENS with proximity: a near rock spreads outward on
// screen, so the world-x exclusion must grow with camera-depth. `x = side·max(26, 11.7 + 1.3·s +
// 1.15·d)` where d = camera-relative depth; the 11.7 is the max camera-x (0.9·laneHalfWidth 13), 1.3·s
// the tumble bounding radius, and 1.15 the (C·tan(fov/2)·aspect) slope (with margin over the k=1.0
// constraint). z travels far→behind-camera so the recycle happens OFFSCREEN (no pop).
const FLYBY_N = 8, FLYBY_Z_FAR = -300, FLYBY_Z_NEAR = 30, CAM_LOCAL_Z = 13.2;   // per-rock speed now lives in each flyby's `spd` (distinct tracks), not one shared constant
// OVERHEAD flyby (owner ask: rocks also passing from ABOVE, close, never a collision). Of the 8 flyby,
// FLYBY_OVH_N come from overhead — they DIVE toward the camera and sweep up over the TOP of frame, on a
// VERTICAL keep-out cone (the horizontal cone rotated 90°). Vertical FOV has NO aspect term (three.js fov
// is vertical), so this reads on a PORTRAIT phone where the side passes are geometrically off-frame.
const FLYBY_OVH_N = 3;                   // 3 overhead + 5 side (owner-chosen mix)
const OVH_SET = new Set([1, 4, 6]);      // which flyby indices are overhead — phases 0.125/0.50/0.75 (maximally spread on the loop)
const FLYBY_R = 1.45;                    // honest world bounding radius per unit size (Phase-2 hero geo normalises to 1.16 × per-instance axis cap 1.25 = 1.45; ≥ the current jitter max 1.35, so the cones are conservative now too)
const CAM_Y_MAX = 27.0;                  // worst-case camera height (laneMaxY 22 + chase 4.6 + shake headroom) — the vertical analog of the 11.7 max camera-x
const OVH_Y_BASE = 6, OVH_Y_SLOPE = 0.26;    // PLACEMENT: the y-floor gap above the worst camera + the proximity-widening slope (rock bottom = CAM_Y_MAX + base + slope·dc, size-independent)
const OVH_YC_BASE = 4, OVH_YC_SLOPE = 0.22;  // CONSTRAINT: the elevation-band floor + slope the rock bottom must clear (both < placement ⇒ margin ≥ 0 at every depth); slope 0.22 pins the rock to the top sky band (elev ≥ ~12°)
const OVH_Y_ABS = 30;                    // ABSOLUTE floor: rock bottom never below laneMaxY 22 + 8 → the dragon can never touch one regardless of camera state
const OVH_Z_FAR = -820;                  // overhead birth depth (vs side's -300): a size-7 rock at ~860m subtends ~1.3° — a SPECK that condenses out of the haze and comes closer (the side-rock grammar, via DEPTH). The eased z-map keeps the near-pass whoosh speed unchanged.
const OVH_EASE = (p) => 1.61 * p - 0.61 * p * p;   // deep→near depth easing: g'(0)=1.61 (fast while a speck, tiny angular vel) → g'(1)=0.39 (near-pass dz/dt = shipped whoosh). Monotone on [0,1], NaN-free.
const OVH_ENABLED = !(typeof location !== 'undefined' && new URLSearchParams(location.search).has('noovh'));   // ?noovh — A/B: all 8 flyby revert to side passes
const OVH_OLD = typeof location !== 'undefined' && new URLSearchParams(location.search).has('oldovh');   // ?oldovh — A/B: the pre-fix overhead (on-screen materialise, fixed lanes/phases, no per-pass re-roll)
const OLD_START = typeof location !== 'undefined' && new URLSearchParams(location.search).has('oldstart');   // ?oldstart — A/B: the pre-fix engage (a mid-approach rock fades in already-giant)
const OVH_START_PHASE = [0.0, 0.045, 0.09];   // on arena engage, the 3 overhead rocks rebase to these near-zero phases → all born as far specks; incommensurate speeds stagger the first dives (~13/18/27s)
const mod1 = (x) => ((x % 1) + 1) % 1;         // positive fractional part
let debrisFlybyMargin = 0;         // horizontal side cone: min over the path of (x − k=1.0 lane-clearance) — asserted ≥ 0
let debrisFlybyMarginY = 0;        // vertical overhead cone: min over the path of (rock-bottom − elevation-band floor) — asserted ≥ 0

// Owner-locked star mode: 'detonation' (THE GODHEAD DETONATION — the locked default) |
// 'supernova' | 'spiral' (the pre-apotheosis A/B seams, kept for owner preview — D7a).
let STAR_MODE = 'detonation';

let set = null;                     // the root group (built once at boot, hidden)
let starGroup = null;               // breath pivot at (0, STAR_Y, -STAR_DIST)
let nova = null, spiral = null, deton = null;   // the three mode meshes (one visible)
let novaMat = null, spiralMat = null, detMat = null;
let debris = null, debrisField = null, debrisMat = null, debrisP = null, debrisMinX = 0;   // hero (8 flyby, high-poly) + field (22 conveyor, low-poly) sculpted rocks, ONE shared material
let debrisTris = 0, debrisLedger = { dx0: 0, dxd: 0, dspd: 0 };   // baked: total tri count + the overhead path-distinctness floors (no two rocks share a track)
let embers = null, emberMat = null;    // the fine-particulate spark layer (shader-driven, recycled)
const EMBER_N = 192;                   // §P1a headless FILAMENTS: sparse fine mid-peak spindles (1152→192) — the outer whisper; the corona grain (§P1b) carries the inner mass. ~7% of the old ember fill (fill-negative on a fill-bound frame)
const DET_GRAIN = (typeof location !== 'undefined' && new URLSearchParams(location.search).has('nograin')) ? 0 : 1;   // §P1b ?nograin master (corona dust grain off for A/B); tier-scaled below
let tierLevel = 0;                  // 0/1/2 — tier 2 GRACEFULLY degrades (cheap core+corona) instead of hiding the set (never a hard black)
let detCoreCoronaVerts = 0;         // the [0,n) draw-range that keeps only core+corona at tier 2
// The SHARED coherent swirl field (a few harmonics over the launch angle). The curved streak spines
// AND the ember trails both sample THIS field so they braid as ONE substance (the cohesion law:
// emergence = a shared field, not two that happen to overlap). Built once from a private stream.
let swirlField = null;
const buildSwirlField = (prnd) => {
  const H = []; for (let h = 0; h < 4; h++) H.push({ k: 2 + h, amp: prnd(), ph: prnd() * TAU });
  return (d) => { let s = 0; for (const h of H) s += h.amp * Math.sin(h.k * d + h.ph); return s / H.length; };
};
let lastK = 0;                      // debug seam: the engage level actually applied this frame
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _sc = new THREE.Vector3(), _col = new THREE.Color();   // debris scratch (alloc-free)

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
//   • CORE + widened CORONA (R 280) — the newborn heart (aType 0) + molten glow (aType 3). The
//     CROSS is no longer geometry: it EMERGES from the corona via a shared 4-fold field (see below).
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
const DET_CORONA_R = 340;              // the billowing fire mass (widened 280→340; paid for by the thinned streak fan)
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
  // ── CORONA (aType 3): the vast soft blast glow — (1-t)^1.4 to black at the rim. uv = [radial t,
  // angle fraction]; the shader domain-warps an FBM over it → a MOLTEN ROILING substrate (the richest
  // zone in the reference, previously the flattest here). More angular segments now that it carries detail.
  const RSEG = 8, ASEG = 48;
  const cProf = (t) => Math.pow(Math.max(0, 1 - t), 1.4) * 0.5;
  const cCol = (t) => { const b = cProf(t), c = lerp3(GOLD_IN, ROSE_MID, ss(t * 1.3)); return [c[0] * b, c[1] * b, c[2] * b]; };
  for (let j = 0; j < RSEG; j++) {
    const t0 = j / RSEG, t1 = (j + 1) / RSEG;
    const r0 = CORE_R + t0 * (DET_CORONA_R - CORE_R), r1 = CORE_R + t1 * (DET_CORONA_R - CORE_R);
    const c0 = cCol(t0), c1 = cCol(t1);
    for (let i = 0; i < ASEG; i++) {
      const a0 = (i / ASEG) * TAU, a1 = ((i + 1) / ASEG) * TAU, u0 = i / ASEG, u1 = (i + 1) / ASEG;
      push(P(r0, a0), c0, [t0, u0], 3, 0); push(P(r1, a0), c1, [t1, u0], 3, 0); push(P(r1, a1), c1, [t1, u1], 3, 0);
      push(P(r0, a0), c0, [t0, u0], 3, 0); push(P(r1, a1), c1, [t1, u1], 3, 0); push(P(r0, a1), c0, [t0, u1], 3, 0);
    }
  }
  detCoreCoronaVerts = pos.length / 3;   // tier-2 graceful degrade draws only [0, here) = core + corona (never a hard black)
  // ── RADIAL STREAK FAN (aType 1): the frame-filler + the primary perpetual loop. The spines now
  // CURVE — each streak bends along the SHARED swirl field so it arcs outward like the embers braiding
  // through it (the owner's "straight lines fight the flame" fix). The CROSS AXES are exempted (the
  // bend is scaled to ~0 on 0/90/180/270), so the ONLY straight lines left in the frame are the four
  // sacred axes — straightness becomes the glyph, not noise. Fairness (eclipse + down-suppression) is
  // re-baked PER VERTEX from the ACTUAL curved position, so an arc that dips downward dims continuously.
  const NST = 48, SEG = 11, W_IN = 4.2, W_TIP = 0.8;           // fewer, THINNER, now with a curved spine (SEG 5→11 for a smooth arc)
  for (let s = 0; s < NST; s++) {
    const a0 = (s / NST) * TAU + (prnd() - 0.5) * 0.07;
    const down = Math.sin(a0) < -0.15;                          // launched below horizontal → shorter reach
    const lenBase = 280 + prnd() * 280;                         // 280..560u
    const len = down ? lenBase * 0.5 : lenBase;
    const cAlign = 0.78 + 0.55 * Math.pow(Math.abs(Math.cos(2 * a0)), 6);   // cross-aligned streaks BRIGHTEN (the fire-rivers of the arms), off-axis dim
    const baseGain = 0.85 * cAlign;                             // −15% baked gain — the particulate carries the reach (down-suppression now per-vertex, below)
    const crossExempt = 1 - 0.85 * Math.pow(Math.abs(Math.cos(2 * a0)), 6);   // ≈0.15 on the axes → cross-arm streaks stay STRAIGHT; ≈1 off-axis → they curve
    const bendAmp = 0.42 * swirlField(a0) * crossExempt;        // ≤0.42 rad drift (capped < 0.5 so no upper streak reaches the corridor band); braids with the embers via the shared field
    const bendFreq = 1.2 + 0.6 * prnd(), bendPh = prnd() * TAU;
    const aAt = (t) => a0 + bendAmp * (Math.sin(bendFreq * t + bendPh) - Math.sin(bendPh));   // spine angle vs t; anchored to a0 at the core (t=0), arcs outward
    const ph = prnd() * TAU;                                    // per-streak scroll phase (breaks lockstep)
    for (let j = 0; j < SEG; j++) {
      const t0 = j / SEG, t1 = (j + 1) / SEG;
      const r0 = CORE_R + t0 * (len - CORE_R), r1 = CORE_R + t1 * (len - CORE_R);
      const av0 = aAt(t0), av1 = aAt(t1);                       // CURVED spine angles
      const w0 = W_IN + (W_TIP - W_IN) * t0, w1 = W_IN + (W_TIP - W_IN) * t1;
      const d0 = 0.4 + 0.6 * ss((Math.sin(av0) + 0.4) / 0.6), d1 = 0.4 + 0.6 * ss((Math.sin(av1) + 0.4) / 0.6);   // per-vertex down-suppression from the ACTUAL curved angle
      const e0 = smoothstep(ECL_R0, ECL_R1, r0) * baseGain * d0, e1 = smoothstep(ECL_R0, ECL_R1, r1) * baseGain * d1;
      const g0 = detGrad(t0), g1 = detGrad(t1);
      const c0 = [g0[0] * e0, g0[1] * e0, g0[2] * e0], c1 = [g1[0] * e1, g1[1] * e1, g1[2] * e1];
      const ex0 = Math.cos(av0), ey0 = Math.sin(av0), nx0 = Math.cos(av0 + Math.PI / 2), ny0 = Math.sin(av0 + Math.PI / 2);
      const ex1 = Math.cos(av1), ey1 = Math.sin(av1), nx1 = Math.cos(av1 + Math.PI / 2), ny1 = Math.sin(av1 + Math.PI / 2);
      const L0 = [ex0 * r0 + nx0 * w0, ey0 * r0 + ny0 * w0, 0.05], R0 = [ex0 * r0 - nx0 * w0, ey0 * r0 - ny0 * w0, 0.05];
      const L1 = [ex1 * r1 + nx1 * w1, ey1 * r1 + ny1 * w1, 0.05], R1 = [ex1 * r1 - nx1 * w1, ey1 * r1 - ny1 * w1, 0.05];
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
      const a0 = (i / RRSEG) * TAU, a1 = ((i + 1) / RRSEG) * TAU, ua0 = i / RRSEG, ua1 = (i + 1) / RRSEG;
      const d0 = 0.4 + 0.6 * smoothstep(-0.4, 0.2, Math.sin(a0)), d1 = 0.4 + 0.6 * smoothstep(-0.4, 0.2, Math.sin(a1));   // down-suppress lower half
      const c0 = [base[0] * amp * d0, base[1] * amp * d0, base[2] * amp * d0], c1 = [base[0] * amp * d1, base[1] * amp * d1, base[2] * amp * d1];
      const IN0 = P(inner, a0), OUT0 = P(outer, a0), OUT1 = P(outer, a1), IN1 = P(inner, a1);
      // uv = [radial t across the band (0 inner → 1 outer), angle fraction]; the shader bands it to
      // black at both edges and FILAMENTS the wavefront with an angular FBM (not a clean compass ring).
      push(IN0, c0, [0, ua0], 2, ph); push(OUT0, c0, [1, ua0], 2, ph); push(OUT1, c1, [1, ua1], 2, ph);
      push(IN0, c0, [0, ua0], 2, ph); push(OUT1, c1, [1, ua1], 2, ph); push(IN1, c1, [0, ua1], 2, ph);
    }
  }
  // ── THE CROSS is no longer geometry. The old 4 explicit diffraction-spike quads read as a static
  // bright DECAL over a living fire (the owner's "3 distinct elements" complaint). It now EMERGES from
  // the fire itself: a shared 4-fold angular field (`cross4` in DET_FRAG) makes the corona brighten
  // INTO the axes (gated by the SAME molten noise, so it breathes/dissolves with the flames), darkens
  // slightly OFF-axis (the negative edge), the ember trails migrate onto the axes as they age, and the
  // cross-aligned streaks are the bright fire-rivers. No constant-value pixels remain → no overlay.
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
// NOTE: no `precision mediump float;` here — inherit three's injected `precision highp float;` so
// (a) the highp(VS)/mediump(FS) varying pair can't trip strict drivers and (b) uTime stays fp32 (on
// Apple GPUs mediump = fp16, which quantizes the scroll after long uptime). EVERY pow() base is
// clamped ≥ 0: `pow(negative, fractional)` is UNDEFINED in GLSL — real GPUs return NaN, the bloom
// pass smears it across the whole framebuffer → a BLACK SCREEN (software renderers swallow it, which
// is why headless never caught it). sin()/1−abs() both interpolate epsilon-negative at primitive edges.
// P1 TURBULENCE: a texture-free FBM (sin-free Dave-Hoskins hash → value noise → ≤3 octaves, uOct = the
// tier dial) transforms the flat vector-art blast into FIRE — braided streak fibers, a domain-warped
// molten corona, filamented shock wavefronts. Mean-preserving (multiplies the baked vCol), so the
// eclipse/down-suppression/fairness structure is untouched. All bases clamped ≥ 0 (the NaN law); the
// hash uses only fract/dot (no pow/sin/sqrt/log) so it can't emit a NaN.
const DET_FRAG = `
  uniform float uTime; uniform float uGain; uniform float uFlow; uniform float uRing; uniform float uOct; uniform float uRoil; uniform float uCross; uniform float uGrain;
  varying vec3 vCol; varying vec2 vUv; varying float vType; varying float vPhase;
  float cross4(float a){ return pow(abs(cos(a * 2.0)), 10.0); }   // 4-fold angular field: peaks on 0/90/180/270; abs base ≥ 0 (NaN-safe)
  float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i), b = hash21(i + vec2(1.0, 0.0)), c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p){
    float s = 0.0, amp = 0.5, tot = 0.0;
    for (int i = 0; i < 3; i++){ if (float(i) >= uOct) break; s += amp * vnoise(p); tot += amp; p = p * 2.02 + 7.1; amp *= 0.5; }
    return tot > 0.0 ? s / tot : 0.5;
  }
  // THE SHARED EXPANSION FRONT: a gaussian luminance crest travelling outward (period 4.6s), fading to
  // zero at max radius and re-born at the core → seamless growth pulse. Multiplied into every layer so
  // the WHOLE blast visibly grows outward (§3: expansion allowed, rotation forbidden). exp is NaN-safe.
  float frontAt(float rr){ float fph = fract(uTime / 4.6); float dR = rr - 560.0 * fph; return 1.0 + 0.4 * exp(-(dR * dR) / 3025.0) * sin(3.14159265 * fph); }
  void main(){
    float b = 1.0;
    if (vType > 2.5) {                                   // CORONA — the BILLOWING FIRE MASS
      float t = vUv.x;                                   // radial 0(core edge)→1(rim)
      float ang = vUv.y * 6.2831853;
      vec2 ring = vec2(cos(ang), sin(ang)) * (2.0 + t * 3.6);   // seam-free annulus → noise space
      vec2 warp = vec2(fbm(ring + vec2(-uTime * 0.16, 0.0)), fbm(ring + 4.7)) - 0.5;
      float n = fbm(ring * 2.3 + warp * 3.0 + vec2(-uTime * 0.22, 0.0));   // billow curls (warp 2.1→3.0)
      float cells = 0.32 + 1.5 * n * n;                  // n² → bright cells + dark cracks (reads through bloom)
      float cx = cross4(ang);
      float crossGlow = cx * smoothstep(0.2, 0.75, n);   // the fire brightens INTO the cross, driven by the SAME molten noise (breathes with the flames)
      b = mix(1.0, cells, uRoil) * frontAt(t * 340.0)
        * (1.0 - 0.14 * uCross * (1.0 - cx))             // OFF-axis darkening = the negative edge
        * (1.0 + 1.6 * uCross * crossGlow);              // ON-axis fire-flare (mean ≈ preserved by the darkening)
      // §P1b FINE DUST GRAIN folded INTO the corona: a high-frequency octave, circle-embedded (seam-free)
      // and radially advected OUTWARD (streaks with the blast, not static speckle). The particulate is now
      // literally the SAME pixels as the blast → it cannot read as a separate object. mean ≈ preserved (the
      // cells idiom); rises with t so the inner core stays clean. ALU-only, zero new fill/draws.
      vec2 gr = vec2(cos(ang), sin(ang)) * 26.0 + vec2(0.0, t * 44.0 - uTime * 2.6);
      float dust = vnoise(gr);
      b *= mix(1.0, 0.62 + 1.35 * dust * dust, uGrain * smoothstep(0.10, 0.45, t));
    } else if (vType > 1.5) {                            // SHOCK RING — soft band × filamented wavefront
      float t = vUv.x, ang = vUv.y * 6.2831853;
      float band = pow(max(0.0, sin(t * 3.14159265)), 1.4);   // black on both edges (clamp: no NaN)
      float wave = 0.55 + 0.45 * sin(t * 6.2831853 - uTime * uRing + vPhase);
      float fn = fbm(vec2(cos(ang), sin(ang)) * 4.6 + vec2(t * 2.0 - uTime * uRing * 0.3, 0.0));
      float fil = 0.45 + 0.9 * fn * fn;                  // sharpened angular filaments (not a clean compass ring)
      b = band * wave * fil;
    } else if (vType > 0.5) {                            // STREAK — SNAKING DUST RIVULET (not a straight ray)
      float t = vUv.x;
      float decay = pow(max(0.0, 1.0 - t), 0.8);         // dies to black at the tip
      float edge = pow(max(0.0, 1.0 - abs(2.0 * vUv.y - 1.0)), 1.3); // soft sides (clamp: no NaN)
      float lat = (fbm(vec2(t * 2.5 - uTime * 0.25, vPhase * 7.0)) - 0.5) * 2.5;   // LATERAL drift → the vein snakes across the quad (not a straight line)
      float n = fbm(vec2(t * 10.0 - uTime * uFlow * 0.4 + vPhase * 3.0, vUv.y * 6.0 + lat));  // advected roil
      float veins = pow(max(0.0, 1.0 - abs(2.0 * n - 1.0)), 2.2);   // RIDGED → thin bright veins, dark between (clamp)
      float pulse = 0.4 + 0.6 * (0.5 + 0.5 * sin(t * 12.0 - uTime * uFlow + vPhase));  // core→tip energy pulse
      float flow = (0.22 + 1.7 * veins) * pulse;         // crisp fibers that survive the bloom
      b = decay * edge * flow * frontAt(t * 500.0);      // grows outward with the shared front
    }
    gl_FragColor = vec4(vCol * b * uGain, 1.0);          // additive: black adds nothing (soft everywhere)
  }`;
const addDetMat = () => {
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uGain: { value: 0 }, uFlow: { value: 3.8 }, uRing: { value: 1.5 }, uOct: { value: 3 }, uRoil: { value: 1.0 }, uCross: { value: 1.0 },
      uGrain: { value: DET_GRAIN } },   // §P1b corona dust grain — ?nograin A/B; tier-dialled in setArenaSetQuality
    vertexShader: DET_VERT, fragmentShader: DET_FRAG,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false,
  });
  m.toneMapped = false;
  return m;
};

// ── THE PARTICULATE MASS: ~1536 fine COMET-TRAILS streaming outward on CURVED, coherently-braiding
// paths — the roiling "substance" of the explosion (what turns "radiating lines" into a volumetric
// blast). FULLY shader-driven (each trail's radius/angle computed from uTime → zero CPU/frame). Each
// trail is a 3-SEGMENT RIBBON whose vertices sample the SAME analytic path at successively earlier life
// (head/outer → tail/inner) so the ribbon FOLLOWS the curve (the old single velocity-stretched chord
// read straight — the owner's fix). A shared EXPANSION FRONT (a traveling luminance crest, period T,
// seamless) makes the whole field visibly GROW outward every ~4.6s (§3 stillness allows expansion,
// forbids rotation). Per-sample fairness (eclipse gate + down-suppression), radius-keyed gold→rose→violet
// (ONE substance with the corona/streaks). Additive, +1 draw, ~9k tris, fine sprites (NOT a large additive
// volume). Coherence: swirlAmp sampled from the SHARED harmonic field (see `swirlField`) so the trails
// braid WITH the curved streaks (a curl READ) instead of wiggling independently.
function buildEmbers(prnd) {
  // HEADLESS FILAMENTS (§P1a): the comet-ribbon (bright round HEAD + tail) reads as a discrete firefly no
  // matter how it's curved/dimmed — the bright end-cap is the tell, and bloom inflates it into a ball. The
  // architecture changes: NO vertex is a maximum at an end (brightness + width both peak MID-ribbon), width
  // is sub-bloom-kernel so bloom can't make a ball, no hot-white boost, far dimmer + fewer + longer → a
  // whisper of fine streaks laced through the outer blast, not a swarm. The path stays coherent (signed
  // shared field, single anchored arc) — that part was right. The corona grain (§P1b) carries the inner mass.
  const P = [];
  for (let e = 0; e < EMBER_N; e++) {
    const dir = prnd() * TAU, sf = swirlField(dir);            // SHARED field → filaments braid WITH the curved streaks
    const crossExempt = 1 - 0.85 * Math.pow(Math.abs(Math.cos(2 * dir)), 6);   // SAME exemption as the streak fan → filaments fly straight along the sacred cross arms
    P.push({ dir, speed: 0.06 + prnd() * 0.14, phase: prnd(), swPh: prnd() * TAU,
      size: 0.30 + prnd() * 0.55,                              // sub-bloom width (max 0.85u) → bloom can't inflate a ball
      swAmp: 0.42 * sf * crossExempt * (0.85 + 0.3 * prnd()),  // SIGNED + streak-matched 0.42 (braids in the same flow)
      swFreq: 1.2 + prnd() * 0.6,                              // sub-cycle → ONE arc, not a multi-inflection S
      trailDt: 0.030 + prnd() * 0.018 });                      // longer, finer streamers
  }
  P.sort((a, b) => b.size - a.size);   // biggest first → tier-1 drawRange keeps the largest trails
  const pos = [], aq = [], aseed = [], aseed2 = [];
  // 3-SEGMENT COMET RIBBON (18 verts): each vertex samples the SAME analytic path at an earlier life
  // (seg 0 = head/outer, seg 3 = tail/inner). A curved path drawn as a multi-segment ribbon reads
  // CURVED; the old single velocity-stretched chord read straight. aQuad = (side ∈ {−1,+1}, seg ∈ 0..3).
  const RIB = [];
  for (let k = 0; k < 3; k++) RIB.push([-1, k], [1, k], [1, k + 1], [-1, k], [1, k + 1], [-1, k + 1]);
  for (const p of P) {
    for (const v of RIB) {
      pos.push(0, 0, 0.06); aq.push(v[0], v[1]);
      aseed.push(p.dir, p.speed, p.phase, p.size); aseed2.push(p.swAmp, p.swFreq, p.swPh, p.trailDt);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aQuad', new THREE.Float32BufferAttribute(aq, 2));
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(aseed, 4));
  geo.setAttribute('aSeed2', new THREE.Float32BufferAttribute(aseed2, 4));
  emberMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uGain: { value: 0 }, uCross: { value: 1.0 } },
    vertexShader: `
      attribute vec2 aQuad; attribute vec4 aSeed; attribute vec4 aSeed2;   // aQuad=(side,seg) · aSeed=dir,speed,phase,size · aSeed2=swirlAmp,swirlFreq,swirlPhase,trailDt
      uniform float uTime; uniform float uCross;
      varying vec2 vQ; varying float vGlow; varying vec3 vCol;
      void main(){
        float side = aQuad.x, seg = aQuad.y, segT = seg / 3.0;         // seg 0 = head/outer, 3 = tail/inner
        float life0 = fract(uTime * aSeed.y + aSeed.z);                // the HEAD's life
        float life = max(1e-4, life0 - seg * aSeed2.w);                // this vertex samples the path EARLIER in life (the trail) — NaN-safe floor
        float sw = aSeed2.x, swf = aSeed2.y, swp = aSeed2.z;
        float theta = aSeed.x + sw * (sin(swf * life + swp) - sin(swp));   // braids in the streak fan's flow (signed shared field, anchored single arc)
        theta -= uCross * 0.12 * sin(4.0 * theta) * smoothstep(0.15, 0.7, life);   // trails MIGRATE onto the cross axes as they age (sin4θ attractors on 0/90/180/270)
        float decel = pow(max(0.0, 1.0 - life), 1.3);                  // slower blowout (1.7→1.3): the trail dwells at mid-radii where the CURVE is visible
        float rr = 520.0 * (1.0 - decel);
        vec2 rad = vec2(cos(theta), sin(theta));
        vec2 c = rad * rr;
        // analytic velocity tangent AT THIS sample → the ribbon's local width direction (the length now
        // comes from the per-segment path samples, not a straight stretch, so the ribbon FOLLOWS the curve)
        float drdl = 520.0 * 1.3 * pow(max(0.0, 1.0 - life), 0.3);
        float dthdl = sw * swf * cos(swf * life + swp);   // tangent of the single-arc path
        vec2 tang = drdl * rad + rr * dthdl * vec2(-rad.y, rad.x);
        tang *= inversesqrt(max(1e-6, dot(tang, tang)));               // NaN-safe normalize
        vec2 nrm = vec2(-tang.y, tang.x);
        // shared EXPANSION FRONT: a gaussian luminance crest travelling outward, seamless loop
        float fph = fract(uTime / 4.6), rFront = 560.0 * fph, dR = rr - rFront;
        float front = 1.0 + 0.4 * exp(-(dR * dR) / 3025.0) * sin(3.14159265 * fph);
        float ecl = smoothstep(150.0, 260.0, rr);                     // ignite only outside the seraph (per-sample); soft fade-up so filaments don't snap on at the annulus edge
        float down = 0.3 + 0.7 * smoothstep(-0.3, 0.2, sin(theta));    // suppress the corridor column (per-sample)
        float crossW = 0.85 + 0.55 * uCross * pow(abs(cos(2.0 * theta)), 6.0);   // brighter DENSITY along the arms
        float birth = smoothstep(0.0, 0.05, life0);                    // spawn fade keyed to the HEAD life
        float trailFade = 4.0 * segT * (1.0 - segT);                   // MID-PEAK spindle: 0 at BOTH ends → nothing terminates bright (no round head cap, the whole 'firefly' read)
        vGlow = ecl * down * (1.0 - life0) * birth * front * crossW * trailFade * 0.35;   // far dimmer → a whisper of grain, not bright filaments on top
        vQ = vec2(side, 0.0);                                          // round tube across width (length shaped by the segments)
        // ONE substance: the filament colour is the SAME gold→rose→violet ramp over RADIUS as the corona/streaks (no hot-white boost — that made the ball)
        float rg = clamp(rr / 520.0, 0.0, 1.0);
        vec3 ramp = rg < 0.5 ? mix(vec3(1.0, 0.85, 0.54), vec3(0.85, 0.54, 0.39), rg / 0.5)
                             : mix(vec3(0.85, 0.54, 0.39), vec3(0.5, 0.4, 0.7), (rg - 0.5) / 0.5);
        vCol = ramp;
        float wid = aSeed.w * (0.35 + 0.65 * sin(3.14159265 * segT));  // width tapers to sub-bloom at BOTH ends (bloom can't inflate a ball where there's no wide bright cap)
        float zoff = (fract(aSeed.z * 91.7) - 0.5) * 80.0;            // per-ember depth: parallax near/far layering (tight → the shell doesn't slide as a separate plane)
        vec4 mv = modelViewMatrix * vec4(c, 0.06 + zoff, 1.0);
        mv.xy += side * wid * nrm;                                     // width ACROSS the local motion; ribbon length is the segment spread
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uGain;
      varying vec2 vQ; varying float vGlow; varying vec3 vCol;
      void main(){
        float s = max(0.0, (1.0 - vQ.x * vQ.x) * (1.0 - vQ.y * vQ.y));   // soft rounded streak (clamp)
        gl_FragColor = vec4(vCol * s * vGlow * uGain, 1.0);
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false,
  });
  emberMat.toneMapped = false;
  embers = new THREE.Mesh(geo, emberMat);
  embers.name = 'godheadEmbers';
  embers.frustumCulled = false;
  embers.layers.set(1);
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

// ── ASTEROID SCULPT (P5): a believable rock from a subdivided icosahedron — build-once, deterministic,
// off a PRIVATE stream. The 20-face jitter blob read as flat cardboard up close; the fix is the DRAGON-
// DESIGN frequency hierarchy: BIG shape (anisotropy + agglomerate lobes that break the OUTLINE), MEDIUM
// (craters — the one concavity a convex blob can never have, the asteroid signature), FINE (multi-octave
// grain). A per-vertex `aCavity` (0 rims/crowns → 1 crater floors/crevices) is baked to drive the surface
// value structure (dark IN the cracks, molten glow embedded in them — not decals floating on flats).
const _randUnit = (prnd) => { const z = prnd() * 2 - 1, a = prnd() * TAU, r = Math.sqrt(Math.max(0, 1 - z * z)); return { x: r * Math.cos(a), y: r * Math.sin(a), z }; };
const _fr = (v) => v - Math.floor(v);
const _jh = (x, y, z) => { let px = _fr(x * 0.3183099 + 0.1), py = _fr(y * 0.3183099 + 0.1), pz = _fr(z * 0.3183099 + 0.1); px *= 17; py *= 17; pz *= 17; return _fr(px * py * pz * (px + py + pz)); };
const _jn3 = (x, y, z) => {   // JS value-noise matching the shader's n3 (build-time grain)
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z); let fx = x - ix, fy = y - iy, fz = z - iz;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const L = (a, b, t) => a + (b - a) * t;
  return L(L(L(_jh(ix, iy, iz), _jh(ix + 1, iy, iz), fx), L(_jh(ix, iy + 1, iz), _jh(ix + 1, iy + 1, iz), fx), fy),
           L(L(_jh(ix, iy, iz + 1), _jh(ix + 1, iy, iz + 1), fx), L(_jh(ix, iy + 1, iz + 1), _jh(ix + 1, iy + 1, iz + 1), fx), fy), fz);
};
function sculptRock(detail, prnd, nCraters) {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  geo.deleteAttribute('uv');                                   // rock needs no uvs — smaller buffer
  const pos = geo.attributes.position, N = pos.count;
  const sy = 0.70 + prnd() * 0.20, sz = 0.82 + prnd() * 0.18;  // anisotropy (x = 1) → elongated, never a sphere
  const lobes = []; for (let k = 0; k < 4; k++) lobes.push({ d: _randUnit(prnd), a: 0.16 + prnd() * 0.18, s: 0.38 + prnd() * 0.24 });   // agglomerate masses — break the outline
  const craters = []; for (let k = 0; k < nCraters; k++) craters.push({ d: _randUnit(prnd), r: 0.24 + prnd() * 0.20, dep: 0.08 + prnd() * 0.08 });
  const cav = new Float32Array(N), P = new Float32Array(N * 3); let maxLen = 1e-6;
  for (let i = 0; i < N; i++) {
    const nx = pos.getX(i), ny = pos.getY(i), nz = pos.getZ(i);   // ico verts sit on the unit sphere → direction = position
    let r = 1.0, pushIn = 0;
    for (const L of lobes) { const c = Math.max(-1, Math.min(1, nx * L.d.x + ny * L.d.y + nz * L.d.z)), ang = Math.acos(c); r += L.a * Math.exp(-(ang * ang) / (L.s * L.s)); }
    for (const C of craters) { const c = Math.max(-1, Math.min(1, nx * C.d.x + ny * C.d.y + nz * C.d.z)), ang = Math.acos(c), t = ang / C.r;
      const cup = Math.exp(-(t * t) * 1.4), rim = Math.exp(-((t - 1) * (t - 1)) * 6.0) * 0.35, d = -C.dep * cup + C.dep * rim;
      r += d; if (d < 0) pushIn += -d;                          // cup (concave) + a raised rim that catches the backlight
    }
    const g = (_jn3(nx * 2 + 11, ny * 2 + 11, nz * 2 + 11) - 0.5) * 0.05
            + (_jn3(nx * 4 + 23, ny * 4 + 23, nz * 4 + 23) - 0.5) * 0.025
            + (_jn3(nx * 8 + 37, ny * 8 + 37, nz * 8 + 37) - 0.5) * 0.012;   // 3-octave grain — kills mirror-smooth patches
    r += g; if (g < 0) pushIn += -g;
    cav[i] = Math.max(0, Math.min(1, pushIn / 0.14));           // crevice AO: crater floors + grain pits → 1
    const px = nx * r, py = ny * r * sy, pz = nz * r * sz;
    P[i * 3] = px; P[i * 3 + 1] = py; P[i * 3 + 2] = pz;
    maxLen = Math.max(maxLen, Math.sqrt(px * px + py * py + pz * pz));
  }
  const norm = 1.16 / maxLen;                                   // normalise bounding radius → 1.16 (world radius ≤ 1.45·size with the per-instance ≤1.18 axis cap)
  for (let i = 0; i < N; i++) pos.setXYZ(i, P[i * 3] * norm, P[i * 3 + 1] * norm, P[i * 3 + 2] * norm);
  pos.needsUpdate = true;
  geo.setAttribute('aCavity', new THREE.BufferAttribute(cav, 1));
  geo.computeVertexNormals();
  return geo;
}

// ── PREMIUM ROCK MATERIAL (P5): charcoal rock (per-instance albedo trio) with the value structure that
// kills the "khaki-camo" read — crevice AO darkens IN the cracks (not black blotches ON flats), the molten
// glow is GATED to the deep crevices (coal, not torch, embedded in real relief), and a DIRECTIONAL hot rim
// on the blast side + cool violet on the shadow side so the form reads round. Opaque → fairness-positive.
function makeDebrisMat() {
  // fog:false — the heaven's scene fog is a LOCKED dark violet (bullet-contrast); it painted the rocks as
  // flat cut-out stickers against the warm blast. We EXIT it and paint our own warm haze (below) so the
  // rocks melt into the detonation gas, not the violet. (They live only in the heaven window — safe to opt out.)
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1.0, metalness: 0.0, flatShading: true, fog: false });   // white base; per-instance instanceColor carries the rock albedo
  const SEAT_K = (typeof location !== 'undefined' && new URLSearchParams(location.search).has('noseat')) ? 0 : 1;   // ?noseat — A/B: scene-integration (fill+haze+wrap) off, spots-kill still on
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uRimCol = { value: new THREE.Color(0xffe2b0) };    // hot gold rim (the palette lightSun)
    sh.uniforms.uFillCol = { value: new THREE.Color(0xffd9a0) };   // warm blast FILL on the body — a step cooler than the rim so the rim stays the hottest tier
    sh.uniforms.uCoolCol = { value: new THREE.Color(0x6a5ca8) };   // violet cool rim, shadow side (the arc callback)
    sh.uniforms.uHazeCol = { value: new THREE.Color(0x8a6046) };   // detonation-gas umber-rose — distant rocks melt INTO it (aerial perspective, the scene's own palette)
    sh.uniforms.uStarDir = { value: new THREE.Vector3(0.0, 0.35, -0.94).normalize() };   // view-space blast direction (ahead + a touch up)
    sh.uniforms.uSeatK = { value: SEAT_K };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\n attribute float aHeat; attribute float aCavity; varying float vHeat; varying float vCav; varying vec3 vObjP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vHeat = aHeat; vCav = aCavity; vObjP = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uRimCol; uniform vec3 uFillCol; uniform vec3 uCoolCol; uniform vec3 uHazeCol; uniform vec3 uStarDir; uniform float uSeatK;
        varying float vHeat; varying float vCav; varying vec3 vObjP;
        float h13(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(h13(i), h13(i + vec3(1.,0.,0.)), f.x), mix(h13(i + vec3(0.,1.,0.)), h13(i + vec3(1.,1.,0.)), f.x), f.y),
                     mix(mix(h13(i + vec3(0.,0.,1.)), h13(i + vec3(1.,0.,1.)), f.x), mix(h13(i + vec3(0.,1.,1.)), h13(i + vec3(1.,1.,1.)), f.x), f.y), f.z); }`)
      // crevice AO + a subtle warm/cool albedo mottle — the value tiers the flat blotches lacked. AO floor
      // 0.28→0.45: on a ~0.03-luminance body 0.28 was indistinguishable from black; 0.45 keeps a legible
      // crevice tier that reads as shadowed STONE, not a hole.
      .replace('#include <color_fragment>', `#include <color_fragment>
        float ao = mix(1.05, 0.45, clamp(vCav, 0.0, 1.0));                          // dark IN the crevices, bright on rims/crowns
        float mott = n3(vObjP * 1.7);                                               // large-scale stone mottle
        diffuseColor.rgb *= ao * mix(vec3(0.92, 0.94, 1.02), vec3(1.10, 1.00, 0.86), clamp(mott, 0.0, 1.0));`)
      .replace('#include <opaque_fragment>', `
        float ndotS = clamp(dot(normal, uStarDir) * 0.5 + 0.5, 0.0, 1.0);          // 1 = blast-facing, 0 = shadow side
        float warm = smoothstep(0.12, 0.72, ndotS);
        float rimBase = max(0.0, 1.0 - abs(dot(normal, normalize(vViewPosition))));   // fresnel base (clamp: no NaN)
        float rim = pow(rimBase, 2.6);                                             // thin hot silhouette rim
        float wrap = pow(rimBase, 1.1);                                            // broad warm shoulder — the bloomed backdrop wrapping the edge (no razor cut-out)
        // WARM BLAST FILL: the body catches the detonation's light on the blast hemisphere (albedo-modulated
        // → crevices auto-receive less, stone stays stone-coloured); the rim stays the hottest tier.
        outgoingLight += diffuseColor.rgb * uFillCol * ((0.5 + 2.3 * ndotS * ndotS) * uSeatK)
                       + uRimCol * rim * warm * (0.7 + 0.5 * vHeat)                // hot gold rim, blast side
                       + uCoolCol * rim * (1.0 - warm) * 0.35                      // cool violet rim, shadow side
                       + uRimCol * wrap * warm * (0.16 * uSeatK);                  // soft lit-edge halo
        // ATMOSPHERIC PERSPECTIVE toward the BLAST gas (we exited the violet scene fog): distant conveyor
        // rocks melt into the detonation's own warm value instead of punching violet-black holes in it.
        float hz = smoothstep(110.0, 470.0, length(vViewPosition));
        outgoingLight = mix(outgoingLight, uHazeCol, hz * 0.72 * uSeatK);
        #include <opaque_fragment>`);
  };
  return m;
}

const ROCK_ALBEDO = [0x2e2a26, 0x38322c, 0x453b32];   // charcoal → grey-brown → umber — dark occluders that grade to STONE (not khaki) under the gold key
// ── THE DEBRIS FIELD (P4/P5): TWO InstancedMeshes sharing ONE material — hero (8 flyby, subdiv-3, the
// close hero rocks) + field (22 conveyor, subdiv-1, distant + cheap). Geometry sculpted ONCE off PRIVATE
// streams (distinct seeds so retuning placement never reshuffles the sculpt). Per-instance conveyor params
// + non-uniform scale (silhouette variety off ONE shared shape). Matrices recomputed each visible frame
// (30 = a tiny upload). Scale 0 at build so a pre-update frame shows nothing.
function buildDebris(prnd) {
  const geoHero = sculptRock(6, mulberry32(0x0d3b72a), 6);      // detail-6 (980 tris, 20·(d+1)²): facets tiny at the near pass → granular chisel + a smooth silhouette, not shards
  const geoField = sculptRock(1, mulberry32(0x0d3b73b), 2);     // detail-1 (80 tris): distant, invisible-cheap, still beats the old 20-face blob
  debrisTris = (geoHero.attributes.position.count / 3) * FLYBY_N + (geoField.attributes.position.count / 3) * (DEBRIS_N - FLYBY_N) | 0;
  debrisMat = makeDebrisMat();
  debris = new THREE.InstancedMesh(geoHero, debrisMat, FLYBY_N);
  debris.name = 'godheadDebris';                                // hero rocks (the 8 flyby)
  debrisField = new THREE.InstancedMesh(geoField, debrisMat, DEBRIS_N - FLYBY_N);
  debrisField.name = 'godheadDebrisField';                      // background conveyor (22)
  for (const dm of [debris, debrisField]) { dm.frustumCulled = false; dm.layers.set(1); }   // out of the god-ray mask + water mirror (opaque; RenderPass shares depth so occlusion is correct)
  debrisP = [];
  const heatHero = new Float32Array(FLYBY_N), heatField = new Float32Array(DEBRIS_N - FLYBY_N);
  let minX = Infinity, flyMargin = Infinity, flyMarginY = Infinity, sideCount = 0, ovhCount = 0;
  // Overhead per-rock CENTRES (the per-pass hash re-roll jitters around these — §P2b). Disjoint by
  // construction so the distinctness ledger holds at EVERY cycle: lanes gap 12 (−2·2.5 jitter = 7 ≥ 6),
  // drifts min-gap 0.12 (−2·0.03 = 0.06 ≥ 0.05), speeds gap 0.017 ≥ 0.010 and INCOMMENSURATE (periods
  // 27/18.5/14.1s) so arrivals never lock into a repeating beat.
  const OVH_LANE = [-12, 0, 12], OVH_XD = [-0.12, 0.02, 0.14], OVH_SPD = [0.037, 0.054, 0.071], OVH_SZBASE = [5.0, 6.2, 7.4];
  const iscale = () => 0.88 + prnd() * 0.30;                    // per-instance axis scale 0.88..1.18 (silhouette variety; ≤1.18 keeps world radius < 1.45·size)
  for (let i = 0; i < DEBRIS_N; i++) {
    if (i < FLYBY_N) {                                          // FLYBY: big rocks whooshing close past the camera
      heatHero[i] = 1.2 + prnd() * 0.5;
      const base = { flyby: true, isx: iscale(), isy: iscale(), isz: iscale(), ts: (prnd() - 0.5) * 0.4, e0: prnd() * TAU, e1: prnd() * TAU, e2: prnd() * TAU };
      if (OVH_ENABLED && OVH_SET.has(i)) {                      // OVERHEAD: born a SPECK deep in the haze, condenses + comes closer — per-pass RE-ROLLED tracks (never the same 3 rocks)
        const k = ovhCount++;
        debrisP.push({ ...base, overhead: true, k, laneC: OVH_LANE[k], xdBase: OVH_XD[k], szBand: OVH_SZBASE[k], spd: OVH_SPD[k],
          phase: (k + 0.5 * prnd()) / 3,                       // staggered thirds + jitter → rarely bunched at any instant (incommensurate speeds keep it so)
          cyc: -999, xJ: 0, xdJ: 0, szC: OVH_SZBASE[k], ax: base.isx, ay: base.isy, az: base.isz, te0: base.e0, te1: base.e1, tts: base.ts });   // per-pass fields (defaults = OLD static look for ?oldovh)
        for (let ps = 0; ps <= 24; ps++) {                     // verify the VERTICAL clearance margin over the EASED DEEP path (size-independent y → unaffected by the size re-roll)
          const p = ps / 24, zl = OVH_Z_FAR + (FLYBY_Z_NEAR - OVH_Z_FAR) * OVH_EASE(p), dc = Math.max(0, CAM_LOCAL_Z - zl);
          const yBottom = CAM_Y_MAX + OVH_Y_BASE + OVH_Y_SLOPE * dc;             // placement bottom (the FLYBY_R·size lift cancels → size-independent)
          flyMarginY = Math.min(flyMarginY, yBottom - Math.max(OVH_Y_ABS, CAM_Y_MAX + OVH_YC_BASE + OVH_YC_SLOPE * dc));
        }
      } else {                                                 // SIDE: whoosh past on the left/right cone (3R/2L), each its own speed
        const side = (sideCount % 2 === 0) ? 1 : -1, size = 5.0 + prnd() * 3.5;
        debrisP.push({ ...base, side, size, phase: i / FLYBY_N, spd: 0.046 + sideCount * 0.004, flyY: (prnd() - 0.5) * 90 });
        sideCount++;
        for (let ps = 0; ps <= 24; ps++) {                     // verify the HORIZONTAL lane-clearance margin over the whole path
          const p = ps / 24, zl = FLYBY_Z_FAR + (FLYBY_Z_NEAR - FLYBY_Z_FAR) * p, dc = Math.max(0, CAM_LOCAL_Z - zl);
          const x = Math.max(26, 11.7 + FLYBY_R * size + 1.15 * dc);
          flyMargin = Math.min(flyMargin, x - (11.7 + FLYBY_R * size + 1.0 * dc));
        }
      }
      debris.setMatrixAt(i, _m.makeScale(0, 0, 0));
      debris.setColorAt(i, _col.setHex(ROCK_ALBEDO[i % 3]));
      continue;
    }
    const fi = i - FLYBY_N;                                     // field-mesh index
    const side = prnd() < 0.5 ? -1 : 1;
    const ang = (prnd() - 0.5) * 1.2;                          // ±0.6 rad from horizontal — the vertical column stays clear
    const size = 2.0 + prnd() * 2.2;
    heatField[fi] = 0.6 + prnd() * 0.5;                        // the background field varies
    const yBias = (fi < 4) ? -(48 + prnd() * 30) : 0;         // 4 chunks below-deck, half-sunk in the haze
    const speed = 0.085 + prnd() * 0.06;                       // conveyor traverse ≈ 7–11s (majestic, D6a)
    debrisP.push({ side, cos: Math.cos(ang), sin: Math.sin(ang), size, yBias, speed, phase: prnd(),
      isx: iscale(), isy: iscale(), isz: iscale(), ts: (prnd() - 0.5) * 0.6, e0: prnd() * TAU, e1: prnd() * TAU, e2: prnd() * TAU });
    minX = Math.min(minX, Math.abs(Math.cos(ang)) * DEBRIS_R_IN);
    debrisField.setMatrixAt(fi, _m.makeScale(0, 0, 0));        // hidden until the first drive frame
    debrisField.setColorAt(fi, _col.setHex(ROCK_ALBEDO[i % 3]));
  }
  // the overhead path-distinctness ledger — ANALYTIC worst-case floors (params re-roll per pass, so the
  // ledger is the centre-gap MINUS the max jitter, which holds at EVERY cycle by construction — not a
  // one-time measurement). min pairwise centre gap over the trio, minus 2× the per-pass jitter half-width.
  const minGap = (arr) => { let m = Infinity; for (let a = 0; a < arr.length; a++) for (let b = a + 1; b < arr.length; b++) m = Math.min(m, Math.abs(arr[a] - arr[b])); return m; };
  debrisLedger = ovhCount > 1
    ? { dx0: +(minGap(OVH_LANE) - 5.0).toFixed(2), dxd: +(minGap(OVH_XD) - 0.06).toFixed(3), dspd: +minGap(OVH_SPD).toFixed(3) }   // −2·2.5 lane · −2·0.03 drift · speeds fixed per rock
    : { dx0: 99, dxd: 99, dspd: 99 };
  debrisFlybyMargin = +flyMargin.toFixed(2);
  debrisFlybyMarginY = Number.isFinite(flyMarginY) ? +flyMarginY.toFixed(2) : Infinity;   // Infinity ⇒ no overhead this run (?noovh)
  geoHero.setAttribute('aHeat', new THREE.InstancedBufferAttribute(heatHero, 1));    // per-instance molten heat (heroes hotter)
  geoField.setAttribute('aHeat', new THREE.InstancedBufferAttribute(heatField, 1));
  debris.instanceMatrix.needsUpdate = true; debrisField.instanceMatrix.needsUpdate = true;
  if (debris.instanceColor) debris.instanceColor.needsUpdate = true;
  if (debrisField.instanceColor) debrisField.instanceColor.needsUpdate = true;
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

  swirlField = buildSwirlField(mulberry32(0x53177e1));   // the ONE braid field, shared by curved streaks + ember trails (built before both)
  detMat = addDetMat();
  deton = new THREE.Mesh(buildDetonationGeo(prnd), detMat);
  deton.name = 'godheadDetonation';
  deton.frustumCulled = false;
  deton.layers.set(1);                  // out of the god-ray mask + water mirror
  deton.visible = true;                 // THE GODHEAD DETONATION is the owner-locked default
  starGroup.add(deton);

  buildEmbers(mulberry32(0x1c6ad39));   // PRIVATE stream (distinct from star/debris)
  embers.visible = true;                // ships with the detonation (both modes-off A/B seams don't need it)
  starGroup.add(embers);

  buildDebris(mulberry32(0x0d3b71f));   // PRIVATE stream (placement/instance params), distinct from the sculpt streams + the star's — the level/gold RNG is never touched
  set.add(debris); set.add(debrisField);   // under `set` (the stable room), NOT starGroup (debris must not inherit the breath)

  set.add(starGroup);
  scene.add(set);
  // ?nodet — perf A/B: hide the detonation + embers (the big full-frame additive overdraw) to isolate
  // their fill cost. No-op without the param; updateArenaSet only writes uniforms, never visibility.
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('nodet')) { deton.visible = false; embers.visible = false; }
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('noembers')) embers.visible = false;   // ?noembers — A/B: blast with the filaments off (identification + before/after)
}

// Owner A/B seam: swap the star's form ('supernova' | 'spiral'). One visibility flip — both
// meshes exist from boot, exactly one draws. Any other value is ignored (belt-and-braces).
export function setStarMode(mode) {
  if (mode !== 'detonation' && mode !== 'supernova' && mode !== 'spiral') return;
  STAR_MODE = mode;
  if (deton) deton.visible = mode === 'detonation';
  if (embers) embers.visible = mode === 'detonation';   // the ember layer belongs to the detonation
  if (nova) nova.visible = mode === 'supernova';
  if (spiral) spiral.visible = mode === 'spiral';
}

// Per-frame drive — called from updateEnvironment with the SAME stateless mix/fade the arena skin
// reads. Hidden ⇒ one write on the falling edge, then zero writes (the arenaPropsGate recipe).
export function updateArenaSet(time, playerDist, mix, fade) {
  if (!set) return;
  const k = ss((mix - RISE_LO) / (RISE_HI - RISE_LO)) * Math.max(0, Math.min(1, fade));   // tier no longer hides the set — tier 2 degrades it gracefully (setArenaSetQuality)
  if (k <= 0) {
    if (set.visible) {
      set.visible = false;
      novaMat.color.setScalar(0); spiralMat.color.setScalar(0); detMat.uniforms.uGain.value = 0; emberMat.uniforms.uGain.value = 0;
    }
    lastK = 0;
    return;
  }
  const rising = lastK === 0;           // the engage rising edge (k>0 now, was 0) — fires once per encounter, self-healing on teardown/restart
  lastK = k;
  set.visible = true;
  set.position.z = -playerDist;         // the stable room: hold formation around the fight
  // Fix A — GIANT-ROCK-AT-START: rebase every flyby's phase on engage so each rock BEGINS its approach
  // from the far/small end (no boulder fading in already-giant mid-path). p starts at P0 because
  // arg = time·spd + mod1(P0 − time·spd) ≡ P0. The phase jump re-fires the per-pass re-roll (fresh track).
  if (rising && !OLD_START && !OVH_OLD && debris) {
    let sIdx = 0;
    for (let i = 0; i < FLYBY_N; i++) {
      const d = debrisP[i];
      const P0 = d.overhead ? OVH_START_PHASE[d.k] : (0.10 + 0.55 * (sIdx++ / 5));   // overhead: all far specks · side: far→mid band (first whoosh ~5–6s, none born near-camera)
      d.phase = mod1(P0 - time * d.spd);
    }
  }
  // THE HELD PRESENCE: ±2% scale breath, near-steady light — a newborn heart, never a strobe,
  // never a spin (§3 stillness; the spiral is a FROZEN form — rotating it is forbidden). The
  // DETONATION's roil is EXPANSION (uTime-scrolled streaks/rings), not rotation — the loop runs
  // continuously (owner §1): a dead loop is a build failure.
  starGroup.scale.setScalar(1 + 0.02 * Math.sin(time * BREATH_HZ));
  const glow = k * STAR_GAIN * (0.98 + 0.02 * Math.sin(time * 0.31));
  if (STAR_MODE === 'detonation') {
    detMat.uniforms.uGain.value = glow; detMat.uniforms.uTime.value = time;
    emberMat.uniforms.uGain.value = glow; emberMat.uniforms.uTime.value = time;   // the spark layer rides the same engage + clock
  } else (STAR_MODE === 'supernova' ? novaMat : spiralMat).color.setScalar(glow);

  // THE DEBRIS CONVEYOR (P4): each chunk rides a ray from deep-centre outward+forward and recycles,
  // forever (TIME-driven — never freezes). Scale-in at birth, fade at recycle → seamless loop. The
  // tumble is LOCAL spin; the translation is radial-outward, never an orbit (§3 stillness).
  if (debris) {
    for (let i = 0; i < DEBRIS_N; i++) {
      const d = debrisP[i];
      if (d.overhead) {                                         // OVERHEAD: eased DEEP birth (a speck condensing from the haze) + per-pass RE-ROLL (never the same 3 rocks)
        const arg = time * d.spd + d.phase, cyc = Math.floor(arg), p = arg - cyc;
        if (!OVH_OLD && d.cyc !== cyc) {                        // re-roll ONCE per pass (3 rocks → negligible CPU); stream-free _jh hash → deterministic, never repeats
          d.cyc = cyc;
          const h = (n) => _jh(cyc * 13 + 1, d.k * 7 + n, 5);   // decorrelated per (cycle, rock, field)
          d.xJ = (h(1) - 0.5) * 5.0; d.xdJ = (h(2) - 0.5) * 0.06; d.szC = d.szBand + h(3) * 1.1;   // lane ±2.5 · drift ±0.03 · size resampled in-band
          d.ax = 0.90 + h(4) * 0.28; d.ay = 0.90 + h(5) * 0.28; d.az = 0.90 + h(6) * 0.28;         // fresh silhouette (≤1.18 cap)
          d.te0 = h(7) * TAU; d.te1 = h(8) * TAU; d.tts = (h(9) - 0.5) * 0.4;                       // fresh tumble (the boundary jump is masked — the rock is faded out at p→0/1)
        }
        const ease = OVH_OLD ? p : OVH_EASE(p), zFar = OVH_OLD ? FLYBY_Z_FAR : OVH_Z_FAR;
        const zl = zFar + (FLYBY_Z_NEAR - zFar) * ease, dc = Math.max(0, CAM_LOCAL_Z - zl);
        const env = (OVH_OLD ? ss(p / 0.05) : ss(p / 0.12)) * ss((1 - p) / 0.05);                  // longer, deeper birth ramp → grows from a distant speck, no on-screen materialise
        _v.set(d.laneC + d.xJ + (d.xdBase + d.xdJ) * dc, CAM_Y_MAX + OVH_Y_BASE + FLYBY_R * d.szC + OVH_Y_SLOPE * dc, zl);   // size-independent bottom (marginY exact regardless of the size re-roll)
        _e.set(d.te0 + time * d.tts, d.te1 + time * d.tts * 0.7, d.e2);
        _q.setFromEuler(_e);
        const b = Math.max(1e-4, d.szC * k * env);
        _sc.set(b * d.ax, b * d.ay, b * d.az);
        debris.setMatrixAt(i, _m.compose(_v, _q, _sc));
        continue;
      }
      let env;
      if (d.flyby) {                                            // SIDE: whoosh past on the left/right cone
        const p = (time * d.spd + d.phase) % 1;                 // per-rock speed (distinct tracks — no lockstep)
        const zl = FLYBY_Z_FAR + (FLYBY_Z_NEAR - FLYBY_Z_FAR) * p, dc = Math.max(0, CAM_LOCAL_Z - zl);
        env = ss(p / 0.05) * ss((1 - p) / 0.05);               // fade at the far birth + the offscreen recycle
        _v.set(d.side * Math.max(26, 11.7 + FLYBY_R * d.size + 1.15 * dc), DEBRIS_CY + d.flyY, zl);   // perspective grows the size as it nears
      } else {
        const p = (time * d.speed + d.phase) % 1;
        const r = DEBRIS_R_IN + (DEBRIS_R_OUT - DEBRIS_R_IN) * p;
        env = ss(p / 0.06) * ss((1 - p) / 0.14);               // birth scale-in · recycle fade-out
        _v.set(d.side * d.cos * r, DEBRIS_CY + d.sin * r + d.yBias, DEBRIS_Z_FAR + (DEBRIS_Z_NEAR - DEBRIS_Z_FAR) * p);
      }
      _e.set(d.e0 + time * d.ts, d.e1 + time * d.ts * 0.7, d.e2);
      _q.setFromEuler(_e);
      const b = Math.max(1e-4, d.size * k * env);
      _sc.set(b * d.isx, b * d.isy, b * d.isz);                 // per-instance non-uniform scale → silhouette variety off one shared shape
      if (i < FLYBY_N) debris.setMatrixAt(i, _m.compose(_v, _q, _sc));
      else debrisField.setMatrixAt(i - FLYBY_N, _m.compose(_v, _q, _sc));
    }
    debris.instanceMatrix.needsUpdate = true;
    debrisField.instanceMatrix.needsUpdate = true;
  }
}

// Tier off-switch (main.js applyQuality): the low tier drops the set entirely — the cosmos
// palette + firmament + nebula carry the identity there (the god-ray/kick tier precedent).
export function setArenaSetQuality(tier) {
  tierLevel = tier;
  if (detMat) detMat.uniforms.uOct.value = tier >= 2 ? 1 : (tier >= 1 ? 2 : 3);   // fewer FBM octaves on weaker GPUs (the turbulence stays, cheaper)
  if (detMat) detMat.uniforms.uGrain.value = DET_GRAIN * (tier >= 2 ? 0 : tier >= 1 ? 0.6 : 1.0);   // §P1b dust grain: full / lighter / off (tier2 keeps only the cheap core+corona)
  if (embers) embers.geometry.setDrawRange(0, (tier >= 2 ? 64 : tier >= 1 ? 128 : EMBER_N) * 18);   // 18 verts/filament (3-seg spindle); size-sorted buffer → the biggest survive
  if (deton) deton.geometry.setDrawRange(0, tier >= 2 ? detCoreCoronaVerts : Infinity);   // GRACEFUL DEGRADE: tier 2 keeps core+corona (a lit blast heart) instead of hiding the whole set → never a hard black
  if (debris) debris.visible = tier < 2;               // hero rocks off at tier 2 (opaque cost)
  if (debrisField) debrisField.visible = tier < 2;     // field rocks off at tier 2
}

// Debug seam (tests/unmaskedarena.mjs): the coexist proof reads this through bossArenaState().
// `mode`/`star` replace the old `panes` count (the court is retired — the coexist asserts moved
// with it).
export function debugArenaSet() {
  return { built: !!set, visible: !!set && set.visible, k: +lastK.toFixed(3), mode: STAR_MODE, star: !!nova,
    detUTime: detMat ? +detMat.uniforms.uTime.value.toFixed(2) : 0,   // detUTime advances ⇒ the perpetual loop is driven
    debrisN: DEBRIS_N, debrisVis: !!set && set.visible && !!debris && !!debrisField, debrisMinX,   // debrisMinX ≥ 25 ⇒ no background chunk enters the focal/corridor column
    debrisDraws: (debris ? 1 : 0) + (debrisField ? 1 : 0), debrisTris,   // 2 InstancedMeshes (hero+field), one shared material; tris asserted ≤ budget
    debrisFlybyMargin,   // ≥ 0 ⇒ no SIDE flyby rock ever crosses the flight lane at any camera depth
    debrisFlybyMarginY,  // ≥ 0 ⇒ no OVERHEAD flyby rock ever dips into the lane/gameplay band at any camera depth
    debrisLedger,        // overhead path-distinctness floors (min pairwise Δlane/Δdrift/Δspeed) — no two rocks share a track
    flybyOvh: OVH_ENABLED ? FLYBY_OVH_N : 0, flybySide: FLYBY_N - (OVH_ENABLED ? FLYBY_OVH_N : 0),   // the split (owner-tunable)
    emberN: EMBER_N, emberVis: !!set && set.visible && !!embers && embers.visible,
    tier: tierLevel, tierHidden: tierLevel >= 2 };   // tierHidden now means "tier-2 graceful degrade" (core+corona kept), not a full hide
}

// Belt-and-braces for the restart path (resetEnvironment) — the stateless mix would self-heal
// next frame anyway; this guarantees no single stale frame of the star on a new run.
export function resetArenaSet() {
  if (set && set.visible) {
    set.visible = false;
    novaMat.color.setScalar(0); spiralMat.color.setScalar(0); detMat.uniforms.uGain.value = 0; emberMat.uniforms.uGain.value = 0;
    lastK = 0;
  }
}
