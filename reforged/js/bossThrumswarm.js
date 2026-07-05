import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// THRUMSWARM — "A Thousand That Remember Being One" (BOSS-DESIGN.md §5b/§5d slot 7,
// a Tier-3 CALAMITY). A stippled SWARM of dark motes around a bright bone-white
// QUEEN that CONDENSES into authored shapes — including a giant copy of the
// player's OWN dragon (the meme frame, the roster's shareable moment).
//
// SILHOUETTE-FIRST (§3.1): one sentence — "a scattered cloud of black motes
// around a lit queen, that snaps into a giant copy of your dragon." Nothing that
// reads as a single solid creature: the FIELD is the body (L140/L141 swarm case —
// scattered it must FILL the frame; condensed it must be GIANT and recognizable).
// Distinct from every prior slot: not a mask (1), a ring-eye (2), a raptor (3),
// a skeleton (4), twin darts (5), or an arch (6) — the roster's only SWARM.
//
// PRIMARY READ (registry slot 7, claimed): pure VALUE + glow-shape — void-black
// motes / star-white queen / scattered points; hue near-absent except the queen's
// ONE amber eye (the focal AND the amber-carrier organ, §5i.C). Home biome is a
// BRIGHT/pale sky so the black motes read (the value-alternation off slot 6's
// pale-on-dark HOLLOWGATE).
//
// THE QUEEN (§3.2 focal): a bone-white LANTERN rhombus (stretched octahedron + 6
// rib fins + a dark EdgesGeometry cage) with ONE amber eye — an HDR-overdriven
// pinpoint (the G1 ≥250 focal, toneMapped=false) that alone carries the palette
// attribution (G3) and is the source of every parry-amber volley. In the
// YOUR-DRAGON formation the queen MIGRATES to the copy's skull and the eye
// ignites inside it.
//
// THE SWARM (§5d): 40 dark tetra motes as SEPARATE meshes (the sheet said 28; CP1
// raised it — 28 was too few to fill the meme frame's wing membranes, L157; L126:
// separate small meshes are phone-verified fine, and 40 draws is still trivial;
// NEVER InstancedMesh — the per-frame matrix upload JANKS). They lerp between
// authored FORMATION-SLOT TABLES:
//   scatter    — the idle wide cloud (invulnerable; the turn-taking tell)
//   ring       — a condensed ring the swarm fires from
//   wall       — a lane-denial grid
//   line       — a swept spear
//   yourDragon — ~28 slots shaped as a heraldic winged dragon + rider (the queen
//                is its head): the meme frame
//   ringShield — the swarm becomes a RING (the nonstandard shield, §5h; L106: a
//                ring, never a filled volume — the surge answer still bursts it)
// CHIP DAMAGE ONLY LANDS WHILE CONDENSED (scattered = invulnerable, §5f law 5) —
// the condense/scatter cycle is the puzzle read; condensed is unmistakable
// (tight shape + the queen leaves the centre + a weak-point glow rises).
//
// CHARISMA CARRIER LAW (§4b) — seven channels behind the unchanged hooks, carried
// by the QUEEN's eye + the SWARM's shape:
//   GAZE   — the amber eye tracks the player (lag), the swarm centroid leans with it,
//   BLINK  — the eye gutters and a dark ripple crosses the swarm (the thousand blink),
//   CHARGE — the motes TIGHTEN into a forward spear + the pupil constricts (§3.5:
//            the telegraph changes the SILHOUETTE — a scattered cloud → a clenched fist),
//   EXPRESSION — swarm shape is the mood: dispersed calm / clenched wary / bristling wrath,
//   FLINCH — a struck swarm BURSTS outward then re-gathers,
//   NOTICE — the scattered motes SNAP inward toward the queen and the eye flares,
//   DEATH  — the motes drift apart and gutter dark, the eye eases shut, the lantern
//            dims — a swarm coming apart, going quiet (mournful, no explosion).
//
// CONTRACT: boss.js stomps `group.rotation` every frame (placeGroup) and
// `kit.setDissolve` owns `group.scale` — every animated part lives on `rig`
// (the motes + the queen group), never on `group` itself.

// ---- FORMATION-SLOT TABLES (§5e Calamities engine piece — model-side only). ----
// Each table is MOTE_N mote slots [x,y,z] (local, pre-scale) + a queen slot. Authored
// in the frontal x-y plane (the rail camera sees depth barely, §1) so every shape
// reads as a black-fill emblem at 30m; z gives the field a little volume.
// COUNT (§5d says "28"): CP1 raised it to 44 — the Fable design gate FAILED the meme
// frame twice (too few / too-sparse points to fill the dragon's WING MEMBRANES; it
// read as a jellyfish, L157). Fable sanctioned "raise the count for the condense
// stage." 44 BIGGER motes (see moteCore) packed into TIGHTER wing triangles fill the
// membranes so the copy reads as a dragon; still ~58 draws ≪ the tier-3 70 gate (L126).
const MOTE_N = 44;

// A wide organic idle CLOUD — deterministic (index trig, no PRNG) so the studio
// replays pixel-identical. Golden-angle spiral splayed WIDE (x ±13, y ±9) so the
// scattered field FILLS the portrait (L140/L141), never a tight knot.
function scatterTable() {
  const motes = [];
  const GA = 2.399963;   // golden angle
  for (let i = 0; i < MOTE_N; i++) {
    const t = i / (MOTE_N - 1);
    const a = i * GA;
    const r = 4.2 + t * 8.6;                        // spiral outward to the rim
    const wob = Math.sin(i * 1.7) * 1.1;
    motes.push([
      Math.cos(a) * r * 1.28 + Math.sin(i * 0.9) * 0.9,   // x — splayed wider than tall
      Math.sin(a) * r * 0.82 + wob,                        // y
      Math.cos(i * 2.3) * 3.4,                             // z — a shallow volume
    ]);
  }
  return { motes, queen: [0, 0.6, 1.0] };
}

// A condensed RING the swarm orbits + fires radial volleys from.
function ringTable() {
  const motes = [];
  for (let i = 0; i < MOTE_N; i++) {
    const a = (i / MOTE_N) * Math.PI * 2;
    motes.push([Math.cos(a) * 8.4, Math.sin(a) * 6.6 + 0.6, Math.sin(a * 2) * 0.8]);
  }
  return { motes, queen: [0, 0.6, 1.4] };
}

// A lane-denial WALL grid (7 wide × 4 tall), the queen riding the top centre.
function wallTable() {
  const motes = [];
  const COLS = 7, ROWS = 4;
  for (let i = 0; i < MOTE_N; i++) {
    const c = i % COLS, row = Math.floor(i / COLS);
    motes.push([
      (c - (COLS - 1) / 2) * 3.7,
      (row - (ROWS - 1) / 2) * 2.5 + 0.6,
      Math.sin(i * 1.3) * 0.6,
    ]);
  }
  return { motes, queen: [0, 6.2, 1.4] };
}

// A swept LINE/spear across the full portrait width (the queen at its head).
function lineTable() {
  const motes = [];
  for (let i = 0; i < MOTE_N; i++) {
    const t = i / (MOTE_N - 1);
    motes.push([
      (t - 0.5) * 25,
      Math.sin(t * Math.PI) * 1.6 + 0.6 - Math.abs(t - 0.5) * 1.2,
      Math.cos(t * Math.PI * 2) * 0.8,
    ]);
  }
  return { motes, queen: [13, 1.2, 1.4] };
}

// THE RING-AROUND-YOU (§5h nonstandard shield): a tight ring (L106 — a ring, never
// a filled volume). In-game boss.js parks it around the player; in the studio it
// shows as the shield read. The queen pulls to the ring's near rim (leashed).
function ringShieldTable() {
  const motes = [];
  for (let i = 0; i < MOTE_N; i++) {
    const a = (i / MOTE_N) * Math.PI * 2;
    motes.push([Math.cos(a) * 7.2, Math.sin(a) * 7.2 + 0.6, Math.cos(a * 3) * 0.5]);
  }
  return { motes, queen: [0, 0.6, 6.0] };
}

// THE MEME FRAME — YOUR-DRAGON: 28 slots authored as a DOODLE of a front-on heraldic
// dragon + rider, the QUEEN as its glowing SKULL (the amber eye). The motes are spent
// on the dragon's SILHOUETTE LANDMARKS, NOT an even interior scatter (the CP1-r1
// failure: even-scatter + up-swept wings + a long dangling tail read as a jellyfish/
// sparkler, L157/CP1 Fable FAIL). Each WING is a dense arc — a LEADING EDGE (shoulder→
// elbow→wrist→tip, spread WIDE and near-HORIZONTAL) plus MEMBRANE dots hanging below
// it, so the pair read as filled triangular wings. A connected HEAD→NECK→BODY→TAIL
// spine, a SHORT tapering tail (never a dangling column), a HEAD CLUSTER (crest +
// horns + jaw framing the glowing queen), and a RIDER hump. Must pass the blind
// doodle test — a fresh viewer says "dragon" in under a second. Wingtips ±13.5 ×
// scale 1.2 → ~32 world units → a GIANT copy that fills the frame (§3.1/§5d, L141).
function yourDragonTable() {
  // A SIDE-PROFILE flying dragon (the CP1-r3 pivot): three front-on symmetric passes
  // read as a moth/thunderbird (a lamp with symmetric wings), never a dragon — a front
  // elevation of a winged creature is inherently ambiguous. The SIDE PROFILE is the
  // unmistakable dragon doodle: a long neck → HORNED SKULL, one big NEAR-WING spread
  // UP, and a long tapering TAIL sweeping the other way. The dragon flies to the RIGHT.
  // The queen's amber eye is set INSIDE a dark skull cluster (upper-right); the queen's
  // bone-white LANTERN DIMS in dragon-mode so it reads as an EYE, not a lamp (the Fable
  // root-cause fix — the naked bloom was reading as the head). One big wing + a faint
  // FAR-WING hint = asymmetry that KILLS the moth read.
  const motes = [
    // HEAD SKULL (0–5) — dark motes wrapping the queen-eye into a horned dragon skull
    [8.4, 4.8, 0.3],   // snout tip (points forward-right)
    [7.5, 5.3, 0.3],   // upper snout / brow
    [6.9, 4.1, 0.4],   // lower jaw
    [5.8, 6.0, 0.2],   // horn base (swept back)
    [4.9, 6.5, 0.1],   // horn tip (back)
    [5.9, 4.5, 0.4],   // cheek / throat
    // NECK arc (6–8) — head down to the body
    [5.0, 3.9, 0.2], [4.1, 3.2, 0.1], [3.2, 2.7, 0.0],
    // BODY mass (9–13)
    [2.4, 2.3, 0.0], [1.4, 2.0, 0.0], [2.1, 1.4, 0.0], [1.1, 1.1, 0.0], [0.4, 1.7, 0.0],
    // NEAR WING (14–29) — a big DENSELY-FILLED membrane triangle spread UP and BACK
    // (shoulder → tip up-left), packed so it reads SOLID at fight distance (Fable fix).
    // leading edge (shoulder → tip)
    [2.1, 3.2, -0.2], [1.2, 4.4, -0.4], [0.1, 5.6, -0.7], [-1.1, 6.8, -1.0], [-2.5, 7.8, -1.3],
    // 2nd row
    [1.6, 3.0, -0.2], [0.6, 4.0, -0.4], [-0.4, 5.2, -0.6], [-1.6, 6.4, -0.9], [-0.1, 6.0, -0.8],
    // 3rd row
    [0.9, 3.2, -0.2], [-0.1, 4.2, -0.4], [-1.1, 5.2, -0.6], [0.9, 4.8, -0.5],
    // trailing near the shoulder (closes onto the torso)
    [0.4, 3.4, -0.2], [-0.6, 4.0, -0.3],
    // FAR WING (30–32) — a faint hint behind the body (one big wing + one small = NOT a moth)
    [3.4, 4.2, -0.6], [3.0, 5.2, -0.8], [2.6, 6.0, -1.0],
    // TAIL (33–39) — LONG, tapering, curling down to the lower-LEFT (the opposite flank
    // from the head — a clear serpentine dragon tail, §3.6 the memory hook)
    [0.1, 0.6, -0.1], [-1.1, 0.1, -0.2], [-2.5, -0.5, -0.3], [-3.9, -1.3, -0.5],
    [-5.2, -2.3, -0.6], [-6.3, -3.4, -0.7], [-7.0, -4.3, -0.8],
    // LEGS tucked under the body (40–41)
    [1.7, 0.5, 0.3], [2.7, 0.7, 0.3],
    // RIDER (42–43) — a hump on the shoulders/base of the neck, proud toward camera
    [3.1, 3.3, 1.1], [2.9, 3.9, 1.3],
  ];
  return { motes, queen: [6.6, 5.0, 0.5] };   // the amber EYE set inside the dark skull (upper-right)
}

const FORMATIONS = {
  scatter: scatterTable(),
  ring: ringTable(),
  wall: wallTable(),
  line: lineTable(),
  ringShield: ringShieldTable(),
  yourDragon: yourDragonTable(),
};

export function buildThrumswarm(def, quality = 1) {
  const accent = def.accent ?? 0xffa838;    // AMBER — the queen's eye (the focal + amber-carrier organ, §5i.C)
  const glow = def.glow ?? 0xdfe4ff;        // STAR-WHITE cool (shield rim / shards / lantern backlight)
  const lowQ = quality < 0.75;
  const strip = stripForMerge;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const clamp01 = (v) => clamp(v, 0, 1);

  // lowQ drops the trailing motes (legs + tail + rider) — the essential dragon (head +
  // body + BOTH full wings = the first 32 YOUR-DRAGON slots) survives; tris(q0.5) <
  // tris(q1) stays a gate.
  const nMotes = lowQ ? 37 : MOTE_N;

  // The kit shield bubble wraps the central mass (the surge answer for the ring
  // shield still bursts THIS bubble — the ring is the visual, the bubble is the
  // mechanic; §5h "must still expose a surge answer"). shieldRimStrength low so
  // the star-white rim never out-glows the amber focal (§3.2).
  const kit = createBossCommon(def, quality, {
    shieldRadius: 5.4, shieldY: 0.6, hpBarY: 11.0, hpBarZ: 1.6, hpBarScale: 0.82,
    // Low rim + high cage (the EITHERWING idiom): the FACETED WIREFRAME carries the
    // "this is a shield" read on both skies while the rim stays dim so the bloom
    // never adds a bright cluster that defeats the G6 focal-leash (the eye hides
    // when invulnerable, §5f). L106: the ring-around-you is the VISUAL; this bubble
    // is the surge-break MECHANIC (the §5h surge answer for the nonstandard shield).
    shieldRimStrength: 0.26, shieldCageOpacity: 0.44,
  });
  const { group, track } = kit;
  group.userData.archetype = 'thrumswarm';   // guards the legacy-fallback coexist path

  // The swarm count (§5d "28" → 40; the meme frame needs the density, L157).
  const rig = new THREE.Group();
  group.add(rig);

  const mergeIv = (parts, label) => {
    const geo = mergeGeometries(parts, false);
    if (!geo) throw new Error(`buildThrumswarm: ${label} mergeGeometries returned null (attribute mismatch)`);
    return geo;
  };

  // ---- MOTE MATERIAL — void-black, emissive-low (ei ≤0.1, §5d) so the motes read
  // as DARK stipple on the bright home sky and never wash into pale glitchy debris
  // (§3.8). Opaque (overdraw discipline, L124/L126 — the additive budget is spent
  // on the queen glow + the shed surge-pink, never the body). ONE shared material
  // across all 28 (draws are cheap; the dissolve fades them as one).
  // NEAR-BLACK, FLAT-SHADED — the value identity (§3.3 ~75% near-black base). The
  // albedo is a lifted blue-grey near-black (NOT pure void): the sun sits in front
  // of the boss (§1) so the mote's camera-facing FACETS catch enough light to read
  // as a faint dark stipple on a DARK sky, while still reading as a black silhouette
  // against the BRIGHT home sky (much darker than the pale backdrop) — the two-way
  // read on all three §7c backdrops with ZERO extra draws (the swarm's 28 motes stay
  // well inside the tier-3 draw gate). Emissive floor stays ≤0.1 (§5d void-black).
  const moteMat = track(new THREE.MeshStandardMaterial({
    color: 0x1b1b25, emissive: 0x101018, emissiveIntensity: 0.08,
    roughness: 0.62, metalness: 0.2, flatShading: true,
  }));

  // A mote is a small hard-pointed CRYSTAL (§3.1 few hard points — reads as a clean
  // stipple dot at 30m, never a fuzzy ball). An octahedron core (8 faces) + at q1 a
  // spiking tetra facet (the richer stipple + the quality-ladder tri delta); lowQ =
  // the bare octahedron. Motes are lit-low so shape barely matters — value is all.
  function moteCore() {
    // BIG motes (0.82, up from 0.56): scaling mote size is FREE (L140) and the extra
    // area shrinks the inter-mote gaps so the condensed dragon's wing membranes read
    // SOLID at fight distance (Fable CP1 fix) — a bolder stipple, still discrete dots.
    const a = strip(new THREE.OctahedronGeometry(0.82, 0));
    a.scale(1, 1.3, 1);   // a slightly elongated crystal shard (a mote with a heading)
    if (lowQ) return a;
    const b = strip(new THREE.TetrahedronGeometry(0.44, 0));
    b.rotateY(Math.PI); b.rotateX(0.6); b.translate(0, 0.5, 0);
    return mergeIv([a, b], 'mote');
  }
  const moteGeoShared = moteCore();

  // The 28 (or 22) motes — SEPARATE meshes (L126). Each stores its slot index +
  // per-mote idle-drift phases (the murmuration shimmer, §3.7 ≥2 frequencies).
  const motes = [];
  for (let i = 0; i < nMotes; i++) {
    const m = new THREE.Mesh(moteGeoShared, moteMat);
    m.name = 'swarmMote';
    m.userData = {
      idx: i,
      // idle drift + swirl phases (scaled DOWN as the swarm condenses so the shape stays crisp)
      dphx: i * 1.7, dphy: i * 2.3 + 1.1, dfx: 0.5 + (i % 5) * 0.11, dfy: 0.7 + (i % 4) * 0.13,
      swirl: (i % 7) * 0.9,
      spin: 0.25 + (i % 4) * 0.14,
      // live eased position (starts at the scatter slot so t=0 is a settled cloud)
      px: FORMATIONS.scatter.motes[i][0], py: FORMATIONS.scatter.motes[i][1], pz: FORMATIONS.scatter.motes[i][2],
    };
    m.position.set(m.userData.px, m.userData.py, m.userData.pz);
    rig.add(m);
    motes.push(m);
  }

  // ================================================================
  // THE QUEEN — the bone-white lantern rhombus + its ONE amber eye (the focal).
  // Built into its own group so it MIGRATES between formations as one unit and
  // doubles as the muzzle (emitter = organ, §5f law 7; def.muzzle='queenGroup').
  // ================================================================
  const queenGroup = new THREE.Group();
  queenGroup.name = 'queenGroup';
  rig.add(queenGroup);

  // Bone-white lantern body — a stretched octahedron (the rhombus). Star-white,
  // a LANTERN glow (moderate emissive, below the eye — the eye is THE focal).
  const lanternMat = track(new THREE.MeshStandardMaterial({
    color: 0xeef0f6, emissive: 0xd6dcf2, emissiveIntensity: 0.55,
    roughness: 0.55, metalness: 0.05, flatShading: true,
  }));
  const lanternGeo = strip(new THREE.OctahedronGeometry(1.15, lowQ ? 0 : 1));   // detail-1 = a faceted lantern (§5g: spend on the queen)
  lanternGeo.scale(0.66, 1.4, 0.66);   // the vertical rhombus lantern
  const lantern = new THREE.Mesh(lanternGeo, lanternMat);
  lantern.name = 'queenLantern';
  queenGroup.add(lantern);
  // A bright INNER core seen through the lantern facets — the "contained light"
  // read (the star-white pulse). ONE small additive volume (well inside the
  // overdraw budget, L124: it never exceeds ~15% screen coverage).
  const innerMat = track(new THREE.MeshBasicMaterial({
    color: 0xf4f6ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const innerCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 0), innerMat);
  innerCore.name = 'queenInner';
  queenGroup.add(innerCore);

  // 6 rib FINS radiating around the lantern (a paper-lantern read; §3.6 authored
  // symmetry). Thin tapered flat blades — spend the tri surplus on the queen (§5g).
  const finMat = track(new THREE.MeshStandardMaterial({
    color: 0xdfe3ee, emissive: 0xc4ccdf, emissiveIntensity: 0.4,
    roughness: 0.6, metalness: 0.05, flatShading: true, side: THREE.DoubleSide,
  }));
  const finParts = [];
  const N_FIN = lowQ ? 4 : 8;
  for (let i = 0; i < N_FIN; i++) {
    const a = (i / N_FIN) * Math.PI * 2;
    // a slim vertical blade bowed outward, hugging the lantern's rhombus profile
    const blade = strip(new THREE.ConeGeometry(0.34, 2.5, 3));
    blade.translate(0, 0, 0.9);          // push out from the axis
    blade.rotateX(Math.PI / 2);
    blade.rotateY(a);
    finParts.push(blade);
  }
  const fins = new THREE.Mesh(mergeIv(finParts, 'queenFins'), finMat);
  fins.name = 'queenFins';
  queenGroup.add(fins);

  // Top + bottom lantern caps (the finial + socle — anchors the rhombus read).
  const capMat = track(new THREE.MeshStandardMaterial({
    color: 0xcdd2e0, emissive: 0xaab2c8, emissiveIntensity: 0.28,
    roughness: 0.7, metalness: 0.08, flatShading: true,
  }));
  const capTop = strip(new THREE.ConeGeometry(0.3, 0.7, 4)); capTop.translate(0, 1.9, 0);
  const capBot = strip(new THREE.ConeGeometry(0.34, 0.6, 4)); capBot.rotateX(Math.PI); capBot.translate(0, -1.85, 0);
  const caps = new THREE.Mesh(mergeIv([capTop, capBot], 'queenCaps'), capMat);
  queenGroup.add(caps);

  // The dark EDGE CAGE (§5d) — the lantern's leading, keeps the star-white from
  // reading as a flat sticker on a pale sky (and gives the pale-body sample a
  // dark edge). LineSegments are overdraw-exempt (L124).
  const cageMat = track(new THREE.LineBasicMaterial({
    color: 0x1a1622, transparent: true, opacity: 0.95, depthWrite: false,
  }));
  const cage = new THREE.LineSegments(new THREE.EdgesGeometry(lanternGeo, 12), cageMat);
  queenGroup.add(cage);

  // THE AMBER EYE — the ONE focal (§3.2) + the amber-carrier organ (§5i.C). The
  // eye idiom split (the HOLLOWGATE hub recipe): a moderate-HDR amber DISC (its
  // bloom is a halo) + a tiny ULTRA-HOT white core that alone carries the G1 ≥250
  // pinpoint (bright + SMALL = an eye, not a wash). toneMapped=false so the read
  // survives the no-postfx fallback.
  const EYE_HOT = 2.5, CORE_HOT = 9.2;
  const EYE_BASE = new THREE.Color(accent);
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: accent }));
  eyeMat.toneMapped = false;
  eyeMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT);
  const eyeDisc = new THREE.Mesh(new THREE.CircleGeometry(0.34, lowQ ? 12 : 20), eyeMat);
  eyeDisc.name = 'queenEye';
  eyeDisc.position.set(0, 0.15, 0.72);
  queenGroup.add(eyeDisc);
  // A dark SOCKET pool behind the eye (§3.2/L130 — a bright eye in a dark socket
  // reads as a focal, not a googly bulb).
  const socketMat = track(new THREE.MeshStandardMaterial({
    color: 0x070609, emissive: 0x000000, roughness: 0.9, metalness: 0.0, flatShading: true,
  }));
  const socket = new THREE.Mesh(new THREE.CircleGeometry(0.5, lowQ ? 10 : 16), socketMat);
  socket.position.set(0, 0.15, 0.68);
  queenGroup.add(socket);
  const coreMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
  coreMat.toneMapped = false;
  coreMat.color.setScalar(CORE_HOT);
  const eyeCore = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), coreMat);
  eyeCore.name = 'queenEyeCore';
  eyeCore.position.set(0, 0.15, 0.8);
  eyeCore.renderOrder = 6;
  queenGroup.add(eyeCore);
  // A slim PUPIL slit over the eye (constricts on charge — the charge tell rides
  // the eye too, not just the swarm; §4b CHARGE channel).
  const pupilMat = track(new THREE.MeshBasicMaterial({ color: 0x120a04, transparent: true, opacity: 0.9 }));
  pupilMat.toneMapped = false;
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), pupilMat);
  pupil.name = 'queenPupil';
  pupil.position.set(0, 0.15, 0.83);
  queenGroup.add(pupil);

  // The queen is the ONE focal — give her presence (§3.2): scale the whole lantern
  // assembly up so the star-white read + amber eye anchor the frame on every sky.
  queenGroup.scale.setScalar(1.3);

  // Hit flash rings the lantern (a struck queen flares star-white at her stone).
  kit.flashBind(lanternMat, 0.55);
  kit.finalize();

  // ================================================================
  // ANIMATION — the formation lerp, the condense cycle, the charisma channels.
  // ================================================================
  let charge = 0;
  function setCharge(k) { charge = clamp01(k); }
  let tell = null;
  function setAttackTell(id) { tell = id || null; }

  // Formation blend: mote target = lerp(scatter slot, toForm slot, condenseK).
  // condenseK 0 = scattered (invulnerable tell); 1 = the named shape is tight.
  let toForm = 'scatter';
  let condenseK = 0;
  // Optional runtime override of the YOUR-DRAGON slots with the player's ACTUAL
  // dragon vertices (the §5e engine seam / the roster ring-buffer's sibling — the
  // literal "your own dragon"). Default = the authored heraldic copy (studio +
  // coexist). CP2 wires the game to sample the equipped model here.
  let yourDragonMotes = FORMATIONS.yourDragon.motes;
  let yourDragonQueen = FORMATIONS.yourDragon.queen;
  function setCondense(k) { condenseK = clamp01(k); }
  function setFormation(name) { if (FORMATIONS[name] || name === 'yourDragon') toForm = name; }
  function setYourDragonSlots(pts, queenPt) {
    if (Array.isArray(pts) && pts.length >= nMotes) yourDragonMotes = pts;
    if (Array.isArray(queenPt)) yourDragonQueen = queenPt;
  }
  function formMotes(name) { return name === 'yourDragon' ? yourDragonMotes : (FORMATIONS[name] || FORMATIONS.scatter).motes; }
  function formQueen(name) { return name === 'yourDragon' ? yourDragonQueen : (FORMATIONS[name] || FORMATIONS.scatter).queen; }

  // GAZE (the amber eye tracks with lag; the swarm centroid leans with it).
  let gazeTX = 0, gazeTY = 0, gazeX = 0, gazeY = 0;
  function setGaze(nx, ny) { gazeTX = clamp(nx, -1, 1); gazeTY = clamp(ny, -1, 1); }

  // BLINK-analog: the eye gutters + a dark ripple crosses the swarm.
  const BLINK_DUR = 0.22;
  let blinkT = 0, nextBlink = 3 + (def.hpMax % 3);
  // NOTICE: the scattered motes snap inward + the eye flares.
  let noticeT = 0;
  function notice() { noticeT = 1.0; blinkT = 0; }
  // FLINCH: a struck swarm bursts outward then re-gathers.
  let painT = 0, painEase = 0;
  function flash(amt) { kit.flash(amt); }
  function hurt(amt) { if (amt > 0.3) painT = Math.max(painT, 0.35); }

  // §5j ENTRANCE (The Shape It Remembers): the 28 unlit motes converge from ahead
  // and CLICK slot-by-slot into the YOUR-DRAGON formation. entranceU null = fight.
  let entranceU = null;
  function setEntrance(u) {
    const was = entranceU != null;
    entranceU = u == null ? null : clamp01(u);
    if (entranceU != null && !was) { toForm = 'yourDragon'; }
  }
  function setEntranceSteer() { /* the swarm holds a neutral glide in the entrance (do NOT live-mirror input — §5d) */ }

  // Shield: the swarm becomes the RING-AROUND-YOU; the queen leashes (the eye
  // damps — G6), the motes hold the ring. boss.js's kit bubble is the surge
  // answer (the ring is the read, the bubble is the mechanic).
  let shieldClamp = false;
  kit.onShieldChange((v) => {
    shieldClamp = v;
    if (v) { toForm = 'ringShield'; condenseK = Math.max(condenseK, 1); }
  });

  // Moving setpieces (the swarm re-forms as it crosses the lane). dread = the
  // YOUR-DRAGON card ("A THOUSAND — Your Own Wings"): force the dragon formation.
  let dreadK = 0;
  function setSetpiece(k, sdef) {
    const s = clamp01(k);
    if (sdef && sdef.dread) { dreadK = s; toForm = 'yourDragon'; condenseK = Math.max(condenseK, s); }
    else dreadK = 0;
  }

  // EMOTIONAL DEATH (§4b): the motes drift apart + gutter, the eye eases shut, the
  // lantern dims — a swarm coming apart, going quiet. At k=1 every material is
  // transparent (the dissolve test). Owns the mournful opacity fade at the end.
  let dyingK = 0;
  function setDissolveEmotive(k) {
    dyingK = clamp01(k);
    const a = dyingK < 0.75 ? 1 : Math.max(0, 1 - (dyingK - 0.75) / 0.25);
    for (const m of kit.mats) {
      m.transparent = true;
      const base = m.userData.baseOpacity ?? 1;
      m.opacity = base * a;
      if (m.uniforms && m.uniforms.uOpacity) m.uniforms.uOpacity.value = base * a;
    }
  }

  // ---- per-frame ----
  const _tmp = new THREE.Vector3();
  function tickBody(dt, time) {
    // Flinch spring.
    if (painT > 0) painT -= dt;
    painEase += (Math.max(0, painT) - painEase) * Math.min(1, dt * 9);

    // Blink clock.
    if (noticeT > 0) noticeT -= dt;
    if (blinkT > 0) blinkT -= dt;
    else if (entranceU == null && dyingK <= 0) {
      nextBlink -= dt;
      if (nextBlink <= 0 && charge < 0.4 && noticeT <= 0) { blinkT = BLINK_DUR; nextBlink = 3 + Math.sin(time) * 1.5 + 2.5; }
    }
    const blink = blinkT > 0 ? 1 - Math.abs((blinkT / BLINK_DUR) * 2 - 1) : 0;

    // Eye gaze eases toward target (lag reads as a mind, §4.1).
    gazeX += (gazeTX - gazeX) * Math.min(1, dt * 4);
    gazeY += (gazeTY - gazeY) * Math.min(1, dt * 4);

    // --- Effective condense for this frame. The entrance clicks in over u; the
    // notice beat snaps the cloud in for a moment; charge/dread/shield/death
    // modulate it too. Scattered (low condenseK) = invulnerable tell. ---
    let condIn = condenseK;
    if (entranceU != null) {
      // click slot-by-slot into the dragon across u 0.10–0.86, holding at the end
      condIn = clamp01((entranceU - 0.10) / 0.68);
    } else if (dyingK > 0) {
      condIn = condenseK * (1 - clamp01(dyingK * 1.5));   // death un-forms the shape
    } else if (noticeT > 0.35) {
      condIn = Math.max(condIn, 0.55);                    // NOTICE: the swarm snaps toward the queen
    }
    // CHARGE contracts the field into a forward spear (§3.5 silhouette telegraph):
    // pull toward the queen + toward the muzzle (+z). Held on top of the formation.
    const spear = charge * 0.55;
    // DRAGON-MODE: while condensed into YOUR-DRAGON, SUBORDINATE the queen's bone-white
    // lantern so it reads as an EYE inside the dark skull cluster, not a naked lamp (the
    // Fable root-cause fix). The bloom dims + the lantern shrinks; the amber eye stays.
    const dragonMode = (toForm === 'yourDragon') ? condIn : 0;
    queenGroup.scale.setScalar(1.3 * (1 - dragonMode * 0.42));

    // Queen migrates to the target formation's queen slot.
    const qT = formQueen(toForm);
    const qS = FORMATIONS.scatter.queen;
    const qx = qS[0] + (qT[0] - qS[0]) * condIn;
    const qy = qS[1] + (qT[1] - qS[1]) * condIn;
    const qz = qS[2] + (qT[2] - qS[2]) * condIn;
    // ease the queen (spring) so migrations glide
    queenGroup.position.x += (qx - queenGroup.position.x) * Math.min(1, dt * 6);
    queenGroup.position.y += (qy + Math.sin(time * 0.7) * 0.12 * (1 - condIn) - queenGroup.position.y) * Math.min(1, dt * 6);
    queenGroup.position.z += (qz - queenGroup.position.z) * Math.min(1, dt * 6);
    // the eye faces the player a touch (gaze) — offset the disc/core/pupil
    eyeDisc.position.x = gazeX * 0.14; eyeDisc.position.y = 0.15 + gazeY * 0.12;
    eyeCore.position.x = gazeX * 0.16; eyeCore.position.y = 0.15 + gazeY * 0.14;
    pupil.position.x = gazeX * 0.16; pupil.position.y = 0.15 + gazeY * 0.14;
    queenGroup.rotation.z = Math.sin(time * 0.5) * 0.04 * (1 - condIn) + painEase * Math.sin(time * 30) * 0.06;
    fins.rotation.y += dt * (0.2 + charge * 0.6);          // the lantern ribs turn (idle motion)
    lantern.scale.setScalar(1 + Math.sin(time * 2.2) * 0.03 + charge * 0.12);
    innerCore.rotation.y -= dt * 0.5; innerCore.rotation.x += dt * 0.3;
    innerCore.scale.setScalar(1 + Math.sin(time * 4) * 0.12 + charge * 0.3);
    innerMat.opacity = (0.4 + Math.sin(time * 3.5) * 0.12) * (dyingK > 0 ? Math.max(0, 1 - dyingK * 1.3) : shieldClamp ? 0.12 : 1) * (1 - dragonMode * 0.85);

    // --- MOTES: ease each toward lerp(scatter, target, condIn) + spear pull +
    // idle drift/swirl (scaled by 1-condIn so the condensed shape stays crisp) +
    // the flinch burst. ---
    const sMotes = FORMATIONS.scatter.motes;
    const tMotes = formMotes(toForm);
    const drift = Math.pow(1 - condIn, 1.4);               // 1 scattered (full murmuration) → 0 condensed (CRISP shape)
    const burst = 1 + painEase * 0.6;                       // flinch scatters outward
    for (const m of motes) {
      const u = m.userData, i = u.idx;
      const s = sMotes[i], t = tMotes[i] || sMotes[i];
      let tx = s[0] + (t[0] - s[0]) * condIn;
      let ty = s[1] + (t[1] - s[1]) * condIn;
      let tz = s[2] + (t[2] - s[2]) * condIn;
      // spear: pull toward queen (contraction) + forward toward the muzzle
      if (spear > 0.001) {
        tx += (queenGroup.position.x - tx) * spear;
        ty += (queenGroup.position.y - ty) * spear;
        tz += (queenGroup.position.z + 3.0 - tz) * spear;
      }
      // idle drift (2 freqs) + a slow swirl around the queen (the murmuration),
      // scaled by `drift` (near-0 when condensed) PLUS a faint always-on shimmer so
      // even the crisp dragon copy still BREATHES (§3.7 — a static boss is scenery).
      const sw = time * 0.35 + u.swirl;
      tx += (Math.sin(time * u.dfx + u.dphx) * 1.3 + Math.cos(sw) * 1.0) * drift + Math.sin(time * 1.3 + u.dphx) * 0.06;
      ty += (Math.sin(time * u.dfy + u.dphy) * 1.0 + Math.sin(sw * 1.1) * 0.8) * drift + Math.cos(time * 1.1 + u.dphy) * 0.06;
      tz += Math.sin(time * (u.dfx + 0.2) + u.dphy) * 0.9 * drift;
      // flinch burst pushes motes out along their radial from the queen
      if (painEase > 0.001) {
        tx = queenGroup.position.x + (tx - queenGroup.position.x) * burst;
        ty = queenGroup.position.y + (ty - queenGroup.position.y) * burst;
      }
      // death: motes drift apart + sink (the swarm comes undone)
      if (dyingK > 0) { const d = dyingK; tx *= 1 + d * 0.8; ty += -d * (5 + i * 0.15); tz *= 1 + d * 0.6; }
      // ease (a swarm glides, never snaps — except the entrance CLICK is crisper)
      const rate = entranceU != null ? 10 : 6.5;
      u.px += (tx - u.px) * Math.min(1, dt * rate);
      u.py += (ty - u.py) * Math.min(1, dt * rate);
      u.pz += (tz - u.pz) * Math.min(1, dt * rate);
      m.position.set(u.px, u.py, u.pz);
      m.rotation.x += dt * u.spin;
      m.rotation.y += dt * u.spin * 1.3;
      // a mote guttering on the blink ripple (dark wave crossing the field)
      const ripple = blink * (0.5 + 0.5 * Math.sin(i * 0.9 - time * 6));
      m.scale.setScalar(Math.max(0.15, 1 - ripple * 0.7 - dyingK * 0.5));
    }

    // --- The QUEEN's eye state: the focal + the amber carrier + the charge tell. ---
    let eyeK = 1;
    if (dyingK > 0) eyeK = Math.max(0, 1 - dyingK * 1.5);   // eases shut in death
    else if (shieldClamp) eyeK = 0.22;                      // HARD leash while invulnerable — the eye hides (G6)
    else if (noticeT > 0.35) eyeK = 2.2;                    // NOTICE flare
    else if (dreadK > 0.05) eyeK = 1.5 + dreadK * 0.6;      // the dread card blazes
    else eyeK = 1 + charge * 0.5 + Math.sin(time * 3) * 0.06;
    eyeK *= (1 - blink * 0.85);
    eyeMat.color.copy(EYE_BASE).multiplyScalar(Math.max(0.04, eyeK) * EYE_HOT);
    coreMat.color.setScalar(CORE_HOT * Math.max(0.03, eyeK * (shieldClamp ? 0.18 : 1)));
    // The ultra-hot pinpoint (the G1 ≥250 cluster) HIDES entirely under the shield —
    // the focal visibly leashes when the swarm can't be hit (§5f, the G6 read).
    eyeCore.visible = dyingK < 0.7 && blink < 0.9 && !shieldClamp;
    // pupil constricts on charge (small = charge/dread), dilates a touch at rest
    const pupilR = (charge > 0.02 || dreadK > 0.05) ? 0.05 : 0.12;
    pupil.scale.setScalar((pupilR / 0.12) * (1 + (dyingK > 0 ? dyingK * 1.5 : 0)));   // dilates in death
    pupil.visible = eyeCore.visible;
    // the lantern dims in death / leashes under shield / SUBORDINATES in dragon-mode
    // (so the bone-white body recedes and the amber eye reads as the dragon's eye).
    lanternMat.emissiveIntensity = 0.55 * (dyingK > 0 ? Math.max(0, 1 - dyingK * 1.3) : shieldClamp ? 0.6 : 1) * (1 - blink * 0.4) * (1 - dragonMode * 0.82);

    // A weak-point GLOW rises when CONDENSED (the vulnerability tell — the player
    // must always know whether chip lands, §5d hard callout): the fins brighten as
    // the swarm tightens; scattered = dim (invulnerable). In dragon-mode the fins
    // recede too (the bone lantern becomes a dark skull around the eye).
    finMat.emissiveIntensity = 0.4 * (0.35 + condIn * 0.9) * (1 - blink * 0.4) * (dyingK > 0 ? Math.max(0, 1 - dyingK) : 1) * (1 - dragonMode * 0.8);
  }

  // Muzzle = the queen (emitter = organ; def.muzzle='queenGroup'). Bullets +
  // amber volleys originate at the amber eye.
  const muzzle = queenGroup;

  // ---- §7b per-sheet diagnostics (tests/boss.mjs asserts on them). ----
  function condenseLevel() { return condenseK; }
  function currentFormation() { return toForm; }
  function moteCount() { return motes.length; }
  // world span of the live swarm (presence check — L140/L141).
  function swarmSpanX() {
    let lo = Infinity, hi = -Infinity;
    for (const m of motes) { lo = Math.min(lo, m.userData.px); hi = Math.max(hi, m.userData.px); }
    return (hi - lo) * (def.scale ?? 1.5);
  }

  return {
    group, muzzle, orbiters: motes,
    setDissolve: setDissolveEmotive,
    setCharge,
    setAttackTell,
    setSetpiece,
    setGaze,
    notice,
    setCondense, setFormation, setYourDragonSlots,
    setEntrance, setEntranceSteer,
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible,
    shatterShield: kit.shatterShield,
    flash, hurt,
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    // §7b diagnostics + studio pins (not part of the controller contract).
    condenseLevel, currentFormation, moteCount, swarmSpanX,
    dispose() {
      group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    },
  };
}
