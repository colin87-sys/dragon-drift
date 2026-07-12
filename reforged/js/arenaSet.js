import * as THREE from 'three';
import { mulberry32 } from './util.js';

// ARENA SET (THE UNMASKED, PR-H1/H2) — THE HOLY ARCHITECTURE of the S3 "UNVEILED HEAVEN".
// The owner's read of the shipped heaven: "plain and boring… there should be stuff in the
// background and sides." This module is the GEOMETRY answer (the H0 gilded cloudscape is the
// value-space half): a rhythmic COLONNADE of gilded light-pillars lining both lane sides (H1,
// "the repetition is the foundation, the sureness of religion") + one vast ROSE-WINDOW / great-
// halo mandala parked far behind the seraph on the horizon axis (H2, "the floating signifier of
// heaven" — the seraph's small near halo rhyming with the far one). REVERENT-SPARSE by law: the
// boss is the light source and the architecture RECEIVES it — dim additive gradients, soft
// falloff everywhere, no textures, no hard edges (a hard rim would read Voidmaw-portal), and the
// window BREATHES, never spins (§3 stillness: respiration = alive, rotation = machine).
//
// ARCHITECTURE (the stable-room law): the fight is a stable room — the boss holds a fixed rel
// ahead of the player while the world scrolls. The set therefore FOLLOWS the player (group.z =
// -playerDist each frame), exactly like the boss anchor, NOT the recycled biome prop bands: no
// recycling, no per-instance churn, two static draws that hold formation around the fight.
//
// GATING (the arenaPropsGate recipe, inverted): everything is driven off the STATELESS
// bossArenaMix() (0 ordinary · 1 void · 2 heaven) threaded through updateEnvironment — visible
// only in the HEAVEN window (rises across mix 1.45→1.85, void + ordinary get NOTHING), scaled by
// bossArenaFade() so the natural-kill exhale dissolves the architecture with the sky (the PR-B
// exhale law: never a pop). mix 0 ⇒ hidden with ZERO per-frame writes (one hide write on the
// falling edge, then early-return) ⇒ every other boss + all flight is untouched; any teardown
// self-heals within one frame because the source is stateless. Tier-degrade: the whole set hides
// at the low tier (the god-ray precedent — the palette + rays carry the heaven on weak mobile).
// A PRIVATE mulberry32 stream jitters the colonnade — the shared level/gold RNG is never touched
// (determinism law). Both meshes live on LAYER 1: excluded from the god-ray occlusion mask (a
// vast additive ring must not punch a black hole in the light field) and from the water mirror.
//
// Budget: 2 draw calls, ~1.5k tris (24 pillar cards × 16 tris + 3 soft ring bands × 384 tris).

const TAU = Math.PI * 2;
const ss = (t) => { const s = Math.max(0, Math.min(1, t)); return s * s * (3 - 2 * s); };

// The heaven window on the mix clock: 0 until the gold flood is well underway, 1 by the settle.
const RISE_LO = 1.45, RISE_HI = 1.85;

// H1 — colonnade dials. |x| 19–28: OUTSIDE the ±13 kill wall and outside anything the corridor
// probe (screen x 20–80%) can see up close; strictly even z-spacing = the rhythm (jitter lives in
// x/height only). Heights are TALL AND THIN — receding gilded verticals, not bright bars.
const N_PER_SIDE = 12;
const STEP = 22;            // metres between pillars (the meter of the colonnade)
const START_Z = 14;         // first pillar just ahead of the player
const PILLAR_GAIN = 0.30;   // material dimmer at full engage (reverent-sparse; the far pillars
                            // converge INTO the bright sky band around the sun — sky p95 is TIGHT)

// H2 — rose-window dials. Parked far behind the seraph (rel 30) on the horizon axis, sized VAST:
// the seraph's wing cards span ~±22u at rel~30 (~30° of screen), so the great ring must subtend
// MORE than the wingspan or it drowns behind the silhouette — outer arc crests above the wings,
// side arcs clear the wingtips, lower arc sinks into the sea (half-risen behind the horizon).
// The seraph's own small nimbus completes the rhyme as the innermost circle.
const ROSE_DIST = 260;      // metres ahead of the player (well behind the boss, inside the dome)
const ROSE_Y = 26;          // centre height — the great halo hangs over the fight
const ROSE_R = 120;         // outer-ring radius (world units) — the arc crests ABOVE the wings, inside frame
const ROSE_GAIN = 0.5;      // material dimmer at full engage (the crest rides above the p95 probe band;
                            // the side arcs that DO cross it are thin — the probe is the authority)

let set = null;             // the root group (built once at boot, hidden)
let pillars = null, rose = null;
let pillarMat = null, roseMat = null;
let tierHidden = false;     // low-tier kill switch (setArenaSetQuality)
let lastK = 0;              // debug seam: the engage level actually applied this frame

// A gilded light-pillar card: 3 columns × 5 rows, vertex-colour falloff — hot gilded BASE fading
// to nothing at the top AND at both side edges (additive-to-black = soft everywhere, the corona
// recipe flattened onto a card). Base sits at y=0 so instance scale-y is the pillar height.
function buildPillarGeo() {
  const geo = new THREE.PlaneGeometry(1, 1, 2, 4);
  geo.translate(0, 0.5, 0);
  const pos = geo.getAttribute('position');
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);                 // x ∈ [-.5,.5], y ∈ [0,1]
    const edge = 1 - Math.abs(x) * 2;                       // 1 centre column → 0 side edges
    const vert = Math.pow(Math.max(0, 1 - y), 1.7);         // hot base → transparent top
    const b = edge * vert;
    col[i * 3] = b; col[i * 3 + 1] = b * 0.82; col[i * 3 + 2] = b * 0.52;  // gilded
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

// One soft additive ring band: three concentric loops (black → bright → black) so BOTH edges
// dissolve — never a hard portal rim. Brightness carries low-frequency SPOKE LOBES (period 45°,
// authored, gentle) so the ring reads rose-window, not disc. Same vertex-colour additive
// vocabulary as the seraph's corona / shatterBacklight (bossUnmasked.js).
function ringBand(rMid, halfW, gain, segs, lobePhase) {
  const posA = [], colA = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * TAU;
    const lobe = 0.72 + 0.28 * Math.sin(a * 8 + lobePhase);   // 8 broad petals, never spikes
    const cx = Math.cos(a), cy = Math.sin(a);
    for (const r of [rMid - halfW, rMid, rMid + halfW]) posA.push(cx * r, cy * r, 0);
    // Vertical fade: the CREST carries the read (a rose window is its upper arc); the lower
    // half dims hard — it hangs over the sun-glow band where the fairness probe lives, and
    // additive-on-bright there is exactly the p95 tail the gate exists to stop.
    const vfade = 0.18 + 0.82 * ss((cy + 0.15) / 0.85);
    const b = gain * lobe * vfade;
    colA.push(0, 0, 0, b, b * 0.86, b * 0.58, 0, 0, 0);       // black → gilded-white → black
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 3, b = a + 3;
    idx.push(a, a + 1, b + 1, a, b + 1, b, a + 1, a + 2, b + 2, a + 1, b + 2, b + 1);
  }
  return { posA, colA, idx };
}

function buildRoseGeo() {
  const segs = 96;
  const pos = [], col = [], idx = [];
  // Concentric mandala: a great outer ring, a mid ring, a small inner ring — the seraph's own
  // near halo completes the rhyme as the innermost circle.
  const bands = [
    ringBand(ROSE_R, ROSE_R * 0.11, 1.0, segs, 0.6),
    ringBand(ROSE_R * 0.72, ROSE_R * 0.075, 0.62, segs, 2.3),
    ringBand(ROSE_R * 0.46, ROSE_R * 0.055, 0.42, segs, 4.1),
  ];
  for (const b of bands) {
    const base = pos.length / 3;
    pos.push(...b.posA); col.push(...b.colA);
    for (const i of b.idx) idx.push(base + i);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  return geo;
}

const addMat = () => {
  const m = new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, fog: false,
  });
  m.toneMapped = false;       // .color scalar is the engage dimmer (the corona idiom)
  m.color.setScalar(0);
  return m;
};

// Build once at boot (createEnvironment), hidden. Idempotent.
export function createArenaSet(scene) {
  if (set) return;
  set = new THREE.Group();
  set.name = 'arenaSet';
  set.visible = false;

  // H1 — THE COLONNADE: one InstancedMesh, both sides, even meter.
  const prnd = mulberry32(0x5e7a9c1);   // PRIVATE stream — the level/gold RNG is never touched
  pillarMat = addMat();
  pillars = new THREE.InstancedMesh(buildPillarGeo(), pillarMat, N_PER_SIDE * 2);
  pillars.frustumCulled = false;
  pillars.layers.set(1);                // out of the god-ray mask + water mirror
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  let i = 0;
  for (let side = -1; side <= 1; side += 2) {
    for (let n = 0; n < N_PER_SIDE; n++) {
      const x = side * (19 + prnd() * 9);           // |x| 19–28: outside wall + corridor probe
      const h = 17 + prnd() * 13;                   // tall…
      const w = 1.3 + prnd() * 0.9;                 // …and thin
      m4.compose(p.set(x, -0.5, -(START_Z + n * STEP)), q, s.set(w, h, 1));
      pillars.setMatrixAt(i++, m4);
    }
  }
  pillars.instanceMatrix.needsUpdate = true;
  set.add(pillars);

  // H2 — THE ROSE-WINDOW / GREAT HALO.
  roseMat = addMat();
  rose = new THREE.Mesh(buildRoseGeo(), roseMat);
  rose.name = 'roseWindow';
  rose.frustumCulled = false;
  rose.layers.set(1);
  rose.position.set(0, ROSE_Y, -ROSE_DIST);
  set.add(rose);

  scene.add(set);
}

// Per-frame drive — called from updateEnvironment with the SAME stateless mix/fade the arena skin
// reads. Hidden ⇒ one write on the falling edge, then zero writes (the arenaPropsGate recipe).
export function updateArenaSet(time, playerDist, mix, fade) {
  if (!set) return;
  const k = tierHidden ? 0 : ss((mix - RISE_LO) / (RISE_HI - RISE_LO)) * Math.max(0, Math.min(1, fade));
  if (k <= 0) {
    if (set.visible) { set.visible = false; pillarMat.color.setScalar(0); roseMat.color.setScalar(0); }
    lastK = 0;
    return;
  }
  lastK = k;
  set.visible = true;
  set.position.z = -playerDist;         // the stable room: hold formation around the fight
  pillarMat.color.setScalar(k * PILLAR_GAIN);
  // The great halo BREATHES (slow scale + brightness swell), never spins (§3 stillness law).
  const breathe = 0.9 + 0.1 * Math.sin(time * 0.45);
  rose.scale.setScalar(1 + 0.02 * Math.sin(time * 0.3));
  roseMat.color.setScalar(k * ROSE_GAIN * breathe);
}

// Tier off-switch (main.js applyQuality): the low tier drops the set entirely — the heaven
// palette + the god-ray swell carry the identity there (the god-ray/kick tier precedent).
export function setArenaSetQuality(tier) {
  tierHidden = tier >= 2;
}

// Debug seam (tests/unmaskedarena.mjs): the coexist proof reads this through bossArenaState().
export function debugArenaSet() {
  return { built: !!set, visible: !!set && set.visible, k: +lastK.toFixed(3), pillars: N_PER_SIDE * 2, tierHidden };
}

// Belt-and-braces for the restart path (resetEnvironment) — the stateless mix would self-heal
// next frame anyway; this guarantees no single stale frame of heaven furniture on a new run.
export function resetArenaSet() {
  if (set && set.visible) { set.visible = false; pillarMat.color.setScalar(0); roseMat.color.setScalar(0); lastK = 0; }
}
