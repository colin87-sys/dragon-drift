import * as THREE from 'three';
import { mulberry32 } from './util.js';

// ARENA SET (THE UNMASKED, PR-J) — THE JUDGMENT COURT: the holy architecture of the S3 arena,
// REDONE for the chiaroscuro midnight-cathedral (the owner rejected the bright-gold sky + the
// H1 side light-pillars as "over-bright and underwhelming, the side lights are lame"). The court
// is lit only by the god's own light, three instruments (owner-locked FULL COURT):
//
//   J1 — THE DIVINE COLUMN: one blinding gold light-shaft from the zenith through the seraph
//        onto the black-glass sea (2 crossed vertex-faded cards on the boss axis + an impact-pool
//        glow where it meets the water, so the water sun-road continues it to the player). Narrow
//        by design — a thin column in the sky-p95 TAIL, not a wash (the H2 lesson: A/B the gate
//        with the feature zeroed before dimming authored art).
//   J2 — THE STAINED-GLASS LANCETS: ~14 tall pointed-arch panes at the old colonnade's exact
//        placement law (|x| 19–28, strictly even z-meter, bases y≥8 clear of the corridor probe).
//        Each pane is a HARD-edged cell-grid (3×5 jewel cells + a pointed-arch light, separated
//        by black margins — on the DARK vault the unlit margins read as tracery and the jewel
//        cells burn; this is exactly why glass works now and light-pillars didn't on a bright
//        sky). Per-instance jewel colour via instanceColor — the owner's VIOLET-LED mix
//        (violet 0x7a4ccc leading · sapphire 0x3a5ccc · ruby 0xc23a4a · emerald 0x2e9a6a).
//        ONE InstancedMesh; gentle candle-flicker brightness breathing (respiration, no motion).
//   J3 — THE INVERTED ROSE-WINDOW: the H2 great-halo grammar (R≈120 @ 260m behind the seraph)
//        rebuilt INVERTED for the dark vault — DARK OPAQUE TRACERY (outer annulus + hub + 8 spoke
//        ribs, silhouetted against the molten-gold horizon band) holding additive JEWEL
//        petal-cells between the ribs (bright against the dark vault above the horizon). It
//        BREATHES (scale ±2% + brightness swell), never spins (§3 stillness).
//
// ARCHITECTURE (unchanged spine — the stable-room law): the fight is a stable room, the set
// FOLLOWS the player (group.z = -playerDist, one write/frame), like the boss anchor, never the
// recycled biome bands. GATING (unchanged): everything derives from the STATELESS bossArenaMix()
// through updateEnvironment — engage k = smoothstep(1.45→1.85) × bossArenaFade(); the set exists
// ONLY in the heaven window (the S2 void keeps its austere emptiness — the inhale), the natural-
// kill exhale dissolves the court with the sky, mix 0 ⇒ hidden with ZERO per-frame writes (one
// hide-write on the falling edge). Tier 2 hides the whole set (the palette + god-ray swell carry
// the court on weak mobile). A PRIVATE mulberry32 stream jitters the lancets — the level/gold RNG
// is never touched (determinism law). ALL meshes live on LAYER 1: out of the god-ray occlusion
// mask (additive scenery must not punch holes in the light field; the rose's dark ribs COULD
// legally carve rays on layer 0, but that buys a subtle ray shadow for a full extra mask draw —
// not taken) and out of the water mirror.
//
// Budget: 4 draw calls, ~1.0k tris (14 lancet panes ×33 + column 2×24+48 pool + tracery ~208 +
// petals ~192).

const TAU = Math.PI * 2;
const ss = (t) => { const s = Math.max(0, Math.min(1, t)); return s * s * (3 - 2 * s); };

// The heaven window on the mix clock: 0 until the gold flood is well underway, 1 by the settle.
const RISE_LO = 1.45, RISE_HI = 1.85;

// Owner-locked jewel palette, VIOLET-LED (violet appears twice — it leads the mix).
const JEWELS = [0x7a4ccc, 0x3a5ccc, 0xc23a4a, 0x7a4ccc, 0x2e9a6a, 0x7a4ccc, 0x3a5ccc];

// J2 — lancet dials. |x| 19–28: OUTSIDE the ±13 kill wall and the corridor probe's near field;
// strictly even z-spacing = the meter of the nave (jitter lives in x/height only). Bases y ≥ 8:
// the panes hang clear of the corridor probe band by construction.
const N_PER_SIDE = 7;               // 14 panes — a nave, not a picket fence
const STEP = 30;                    // metres between panes (the meter)
const START_Z = 26;                 // first pane held back — a near pane subtends huge and reads 'building'
const LANCET_GAIN = 0.60;           // material dimmer at full engage — jewel cells that BURN, not glow-towers

// J1 — divine column dials. On the boss axis (x 0), between the seraph (rel 30) and the rose.
const COL_DIST = 225;               // metres ahead of the player
const COL_W = 18;                   // card width (still thin against a ~340m-wide frame — the p95 tail)
const COL_H = 240;                  // zenith→sea (top fades out well above the frame crest)
const COL_GAIN = 1.6;               // blinding by CONTRAST — the one bright vertical in a dark frame
const POOL_R = 22;                  // impact-pool radius where the column meets the water

// J3 — rose-window dials. Same grammar the H2 lesson proved: R 120 @ 260m, centre y 26 — the
// crest inside the frame top, side arcs beyond the wingtips, lower arc sunk behind the horizon.
const ROSE_DIST = 260;
const ROSE_Y = 26;
const ROSE_R = 120;
const ROSE_GAIN = 0.95;             // petal dimmer at full engage (the god-ray swell washes anything dimmer)
const TRACERY_OPACITY = 0.88;       // dark-rib opacity at full engage (silhouette vs the gold band)

let set = null;                     // the root group (built once at boot, hidden)
let lancets = null, column = null, roseDark = null, rosePetals = null;
let lancetMat = null, colMat = null, roseDarkMat = null, rosePetalMat = null;
let tierHidden = false;             // low-tier kill switch (setArenaSetQuality)
let lastK = 0;                      // debug seam: the engage level actually applied this frame

// ── J2 geometry: ONE pointed-arch pane in local space (x ∈ [-.5,.5], y ∈ [0,1]; instance scale
// carries width/height). A 3×5 grid of jewel cells + one pentagonal arch-light at the crown,
// every cell inset by a BLACK margin (with additive blending an emitted-nothing margin IS black
// tracery on the dark vault). HARD edges: each cell is a flat-colour quad — no falloff. Vertex
// colour carries the per-cell VALUE mosaic (a hair of warm/cool tint noise); instanceColor
// carries the pane's jewel hue, so hue × value never muddies (two saturated hues multiplied
// would go near-black). Non-indexed. 33 tris.
function buildLancetGeo(prnd) {
  const pos = [], col = [];
  const COLS = 2, ROWS = 4;                      // BIG gothic cells (a 3×5 grid read as an office block)
  const MX = 0.14, MY = 0.075;                  // bold margins (fractions of the pane) — the tracery
  const GRID_TOP = 0.78;                         // rows fill [0, .78]; the arch-light fills the crown
  // The pane OUTLINE is a pointed arch: full width to the springing line (y .55), then the
  // sides sweep in to a true apex at y 1 — every cell's x tapers with it (gothic tracery
  // follows the arch), so the silhouette is a lancet, never a lit block/house.
  const arch = (y) => 1 - ss((y - 0.55) / 0.45);
  const cellQuad = (x0, x1, y0, y1, b, tint) => {
    const v = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    for (const i of [0, 1, 2, 0, 2, 3]) pos.push((v[i][0] - 0.5) * arch(v[i][1]), v[i][1], 0);
    for (let i = 0; i < 6; i++) col.push(b * tint[0], b * tint[1], b * tint[2]);
  };
  const tintOf = (r) => (r < 0.4 ? [1, 0.88, 0.72] : r < 0.7 ? [0.95, 0.95, 0.95] : [0.78, 0.85, 1]);   // warm / plain / cool glass lots (no pure-white — glass, not lamps)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x0 = c / COLS + MX / 2, x1 = (c + 1) / COLS - MX / 2;
      const y0 = (r / ROWS) * GRID_TOP + MY / 2, y1 = ((r + 1) / ROWS) * GRID_TOP - MY / 2;
      const b = 0.30 + prnd() * 0.70;            // the value mosaic — deep lots beside burning ones
      cellQuad(x0, x1, y0, y1, b, tintOf(prnd()));
    }
  }
  // The arch-light: a pentagon rising to the apex (the lancet's pointed crown) — the brightest
  // cell, the "great light" every lancet carries.
  {
    const x0 = MX / 2, x1 = 1 - MX / 2, y0 = GRID_TOP + MY / 2, y1 = 0.955, ax = 0.5, ay = 0.985;
    const arch2 = (y) => 1 - ss((y - 0.55) / 0.45);
    const v = [[x0, y0], [x1, y0], [x1, y1], [ax, ay], [x0, y1]];
    for (const i of [0, 1, 2, 0, 2, 3, 0, 3, 4]) pos.push((v[i][0] - 0.5) * arch2(v[i][1]), v[i][1], 0);
    for (let i = 0; i < 9; i++) col.push(1.0, 0.97, 0.9);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}

// ── J1 geometry: two crossed vertex-faded cards (the pillar-card recipe, zenith-scaled) + the
// impact pool, merged into ONE non-indexed buffer (one draw). Horizontal falloff to black at the
// card edges (no hard rim); vertically FULL down the shaft, a hot flare at the sea, a fade-out
// tail at the very top (the zenith source sits beyond the frame, never a capped end).
function buildColumnGeo() {
  const pos = [], col = [];
  const GOLD = [1.0, 0.86, 0.58];
  const XSEG = 4, YSEG = 8;
  const vProfile = (v) => (1 - ss((v - 0.78) / 0.22)) * (1 + 1.1 * Math.pow(1 - v, 3));   // hot at the sea, dead by the zenith tail
  for (const rot of [0, Math.PI / 3, -Math.PI / 3]) {   // 3 crossed cards — the shaft holds body as the camera sways (a 90° card would sit edge-on to the rail view)
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const P = (u, v) => { const x = (u - 0.5) * COL_W; return [x * cr, v * COL_H - 2, x * sr]; };
    const C = (u, v) => { const e = 1 - Math.abs(u - 0.5) * 2, b = Math.pow(e, 1.15) * vProfile(v); return [b * GOLD[0], b * GOLD[1], b * GOLD[2]]; };   // flatter falloff — a shaft with BODY, edges still dissolve
    for (let j = 0; j < YSEG; j++) {
      for (let i = 0; i < XSEG; i++) {
        const u0 = i / XSEG, u1 = (i + 1) / XSEG, v0 = j / YSEG, v1 = (j + 1) / YSEG;
        const q = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
        for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(...P(q[k][0], q[k][1])); col.push(...C(q[k][0], q[k][1])); }
      }
    }
  }
  // Impact pool: a radial fan lying on the sea (hot core → black rim), the column's landing.
  const PSEG = 24;
  for (let i = 0; i < PSEG; i++) {
    const a0 = (i / PSEG) * TAU, a1 = ((i + 1) / PSEG) * TAU;
    pos.push(0, 0.4, 0, Math.cos(a0) * POOL_R, 0.4, Math.sin(a0) * POOL_R, Math.cos(a1) * POOL_R, 0.4, Math.sin(a1) * POOL_R);
    col.push(GOLD[0] * 1.3, GOLD[1] * 1.3, GOLD[2] * 1.3, 0, 0, 0, 0, 0, 0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}

// ── J3 geometry (two buffers): the DARK TRACERY (outer annulus + hub ring + 8 radial ribs —
// flat dark quads, one opaque-dark draw) and the JEWEL PETALS (8 annular sectors between the
// ribs, hard-edged per-petal jewel colour with a soft radial value profile + a vertical fade
// that sinks the lower arc — additive-on-the-gold-horizon is exactly the p95 tail to avoid).
function buildTraceryGeo() {
  const pos = [];
  const ring = (rIn, rOut, segs) => {
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * TAU, a1 = ((i + 1) / segs) * TAU;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      pos.push(c0 * rIn, s0 * rIn, 0, c0 * rOut, s0 * rOut, 0, c1 * rOut, s1 * rOut, 0,
        c0 * rIn, s0 * rIn, 0, c1 * rOut, s1 * rOut, 0, c1 * rIn, s1 * rIn, 0);
    }
  };
  ring(ROSE_R * 0.90, ROSE_R, 48);                       // the great outer annulus
  ring(ROSE_R * 0.22, ROSE_R * 0.30, 24);                // the hub (the seraph's halo rhymes inside it)
  for (let i = 0; i < 8; i++) {                          // the spoke ribs
    const a = (i / 8) * TAU + TAU / 16;                  // ribs BETWEEN the petal centres
    const c = Math.cos(a), s = Math.sin(a), w = ROSE_R * 0.020;
    const ox = -s * w, oy = c * w, r0 = ROSE_R * 0.28, r1 = ROSE_R * 0.92;
    pos.push(c * r0 + ox, s * r0 + oy, 0, c * r0 - ox, s * r0 - oy, 0, c * r1 - ox, s * r1 - oy, 0,
      c * r0 + ox, s * r0 + oy, 0, c * r1 - ox, s * r1 - oy, 0, c * r1 + ox, s * r1 + oy, 0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return geo;
}
function buildPetalGeo() {
  const pos = [], col = [];
  const R0 = ROSE_R * 0.34, R1 = ROSE_R * 0.86;          // between hub and outer annulus
  const RSEG = 2, ASEG = 5;
  for (let p = 0; p < 8; p++) {
    const jewel = new THREE.Color(JEWELS[p % JEWELS.length]);
    const aC = (p / 8) * TAU;                            // petal centred between ribs
    const half = TAU / 16 - 0.035;                       // angular margin to the ribs (black tracery gap)
    for (let j = 0; j < RSEG; j++) {
      for (let i = 0; i < ASEG; i++) {
        const a0 = aC - half + (i / ASEG) * half * 2, a1 = aC - half + ((i + 1) / ASEG) * half * 2;
        const r0 = R0 + (j / RSEG) * (R1 - R0), r1 = R0 + ((j + 1) / RSEG) * (R1 - R0);
        const q = [[a0, r0], [a1, r0], [a1, r1], [a0, r1]];
        for (const k of [0, 1, 2, 0, 2, 3]) {
          const [a, r] = q[k];
          const x = Math.cos(a) * r, y = Math.sin(a) * r;
          pos.push(x, y, 0);
          // Radial profile (brighter mid-petal — a lit pane, not a flat sticker) × the vertical
          // fade (the lower arc hangs over the molten horizon band; additive there stacks on the
          // frame's brightest pixels, so it sinks — the crest carries the read, the H2 law).
          const rad = 0.55 + 0.45 * Math.sin(((r - R0) / (R1 - R0)) * Math.PI);
          const vf = 0.15 + 0.85 * ss((y / ROSE_R + 0.25) / 0.9);
          const b = rad * vf;
          col.push(jewel.r * b, jewel.g * b, jewel.b * b);
        }
      }
    }
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

  // J2 — THE LANCETS: one InstancedMesh, both sides, even meter, per-instance jewel hue.
  lancetMat = addMat();
  lancets = new THREE.InstancedMesh(buildLancetGeo(prnd), lancetMat, N_PER_SIDE * 2);
  lancets.name = 'lancets';
  lancets.frustumCulled = false;
  lancets.layers.set(1);                // out of the god-ray mask + water mirror
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const jc = new THREE.Color();
  let i = 0, jj = 0;
  for (let side = -1; side <= 1; side += 2) {
    for (let n = 0; n < N_PER_SIDE; n++) {
      const x = side * (19 + prnd() * 9);            // |x| 19–28: outside wall + corridor probe
      const base = 8.5 + prnd() * 2.5;               // bases y ≥ 8 — clear of the corridor band
      const h = 12 + prnd() * 5;                     // tall…
      const w = 3.4 + prnd() * 1.0;                  // …THIN pointed-arch panes (~1:3.8 — a lancet, never a block)
      m4.compose(p.set(x, base, -(START_Z + n * STEP)), q, s.set(w, h, 1));
      lancets.setMatrixAt(i, m4);
      lancets.setColorAt(i, jc.set(JEWELS[jj++ % JEWELS.length]));
      i++;
    }
  }
  lancets.instanceMatrix.needsUpdate = true;
  if (lancets.instanceColor) lancets.instanceColor.needsUpdate = true;
  set.add(lancets);

  // J1 — THE DIVINE COLUMN (+ its impact pool, one merged draw) on the boss axis.
  colMat = addMat();
  column = new THREE.Mesh(buildColumnGeo(), colMat);
  column.name = 'divineColumn';
  column.frustumCulled = false;
  column.layers.set(1);
  column.position.set(0, 0, -COL_DIST);
  set.add(column);

  // J3 — THE INVERTED ROSE-WINDOW: dark tracery (opaque-dark, engage-faded via opacity) +
  // additive jewel petals, both on the horizon axis behind the seraph.
  roseDarkMat = new THREE.MeshBasicMaterial({
    color: 0x0c0e1e, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false,
  });
  roseDarkMat.toneMapped = false;
  roseDark = new THREE.Mesh(buildTraceryGeo(), roseDarkMat);
  roseDark.name = 'roseTracery';
  roseDark.frustumCulled = false;
  roseDark.layers.set(1);               // layer 0 would carve god-rays but costs a mask draw off tier 0 — not taken
  rosePetalMat = addMat();
  rosePetals = new THREE.Mesh(buildPetalGeo(), rosePetalMat);
  rosePetals.name = 'rosePetals';
  rosePetals.frustumCulled = false;
  rosePetals.layers.set(1);
  const rose = new THREE.Group();
  rose.name = 'roseWindow';
  rose.add(roseDark); rose.add(rosePetals);
  rose.position.set(0, ROSE_Y, -ROSE_DIST);
  set.add(rose);
  set.userData.rose = rose;

  scene.add(set);
}

// Per-frame drive — called from updateEnvironment with the SAME stateless mix/fade the arena skin
// reads. Hidden ⇒ one write on the falling edge, then zero writes (the arenaPropsGate recipe).
export function updateArenaSet(time, playerDist, mix, fade) {
  if (!set) return;
  const k = tierHidden ? 0 : ss((mix - RISE_LO) / (RISE_HI - RISE_LO)) * Math.max(0, Math.min(1, fade));
  if (k <= 0) {
    if (set.visible) {
      set.visible = false;
      lancetMat.color.setScalar(0); colMat.color.setScalar(0); rosePetalMat.color.setScalar(0);
      roseDarkMat.opacity = 0;
    }
    lastK = 0;
    return;
  }
  lastK = k;
  set.visible = true;
  set.position.z = -playerDist;         // the stable room: hold formation around the fight
  // J2 — candle-flicker respiration: two slow incommensurate sines, never a strobe, never motion.
  const candle = 0.9 + 0.07 * Math.sin(time * 1.7) + 0.05 * Math.sin(time * 4.3 + 1.2);
  lancetMat.color.setScalar(k * LANCET_GAIN * candle);
  // J1 — the column holds near-steady (the god does not flicker); a barely-there breath.
  colMat.color.setScalar(k * COL_GAIN * (0.96 + 0.04 * Math.sin(time * 0.4)));
  // J3 — the rose BREATHES (slow scale + petal swell), never spins (§3 stillness law).
  const rose = set.userData.rose;
  rose.scale.setScalar(1 + 0.02 * Math.sin(time * 0.3));
  rosePetalMat.color.setScalar(k * ROSE_GAIN * (0.88 + 0.12 * Math.sin(time * 0.45)));
  roseDarkMat.opacity = k * TRACERY_OPACITY;
}

// Tier off-switch (main.js applyQuality): the low tier drops the set entirely — the court
// palette + the god-ray swell carry the identity there (the god-ray/kick tier precedent).
export function setArenaSetQuality(tier) {
  tierHidden = tier >= 2;
}

// Debug seam (tests/unmaskedarena.mjs): the coexist proof reads this through bossArenaState().
// `panes` replaces the old `pillars` count (the colonnade is retired — the coexist asserts moved
// with it).
export function debugArenaSet() {
  return { built: !!set, visible: !!set && set.visible, k: +lastK.toFixed(3), panes: N_PER_SIDE * 2, tierHidden };
}

// Belt-and-braces for the restart path (resetEnvironment) — the stateless mix would self-heal
// next frame anyway; this guarantees no single stale frame of court furniture on a new run.
export function resetArenaSet() {
  if (set && set.visible) {
    set.visible = false;
    lancetMat.color.setScalar(0); colMat.color.setScalar(0); rosePetalMat.color.setScalar(0);
    roseDarkMat.opacity = 0;
    lastK = 0;
  }
}
