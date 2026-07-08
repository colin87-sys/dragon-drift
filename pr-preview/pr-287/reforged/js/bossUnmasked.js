import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { mulberry32 } from './util.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// THE UNMASKED — slot 14, the APEX / FINALE (BOSS-DESIGN.md §5b row 14, §5c APEX).
// "The second sun that cracks open into a biblically-accurate angel." Three STAGES
// dissolve-swap between sub-rigs: STAGE 1 the ECLIPSE-EYE (this file) → STAGE 2 the
// OPHANIM → STAGE 3 the unveiling. STAGED BUILD: renders STAGE 1 only; stages 2/3,
// THE MEDLEY, STAR PIPS, the relics, the surge-chase, the second-sun landmark +
// handoff() are CP2. Def-gated + inert for other bosses.
//
// ── STAGE 1 SHEET (§3b, Fable-signed-off; revised post owner-review 2026-07) ──
// Reads as: a second sun — a FLAT black DISC ringed by a soft luminous white CORONA
// RING, under ONE HEAVY HOODED LID that peels back to reveal a giant white almond
// EYE. Owner-review revision: (1) the corona is a SOFT GLOWING RING (low-frequency
// asymmetric lobes + breathe, NEVER hard radial spikes = cartoon sun, NEVER a
// perfect even annulus = portal); (2) ONE HEAVY HOODED lid (a thick dome with mass +
// a gold lash-line, hinged near the almond top, always keeps a hood) — NOT thin flat
// crescents, NOT a closed loop around the eye (= a framed icon); (3) the almond EYE
// DOMINATES the disc (~0.77× disc diameter, wider than the lane) — the black disc is
// its rim, and the dark pupil-seed tracks WITHIN it so the player's stick drags the
// gaze (the §5j "Don't Move" beat). Anti-reads: NOT sun/moon, NOT Voidmaw (clean disc
// until the S1→S2 CRACK), NOT UFO/portal, NOT a spiky cartoon sun, NOT Eye-of-Sauron
// (cold white, horizontal lid, no fire, no vertical slit).
//
// NOTE (owner review): the rounded-square "frame" the owner saw around the eye is the
// GAME's LANCE lock-on reticle (reticle.js — two nested squares) snapping to the
// `focalEye` weak-point, NOT boss geometry. CP2 task: suppress it during the frozen-cam
// *Don't Move* reveal (lockLayer.js has entrance-suppression precedent). The heavy hood
// below makes the eye read as a giant eye regardless.
//
// ── §4b CHARISMA (stage 1: lid aperture + pupil-seed) ── GAZE = the pupil-seed live-
// tracks the stick within the almond, ~0.35s wet lag. BLINK = aperture contract/dilate.
// CHARGE-TELL = seed constricts + corona swells + hood lifts to WRATH. EXPRESSION =
// heavy-lidded / watching / wrath (hood position). FLINCH = seed skitters + hood twitch.
// NOTICE = hood PEELS + a saccade snaps the seed dead-centre. DEATH = kit fade (the
// CRACK rite lands at the CP2 seam).
//
// CONTRACT: boss.js `placeGroup` stomps `group.rotation`; `kit.setDissolve` owns
// `group.scale` — all animated parts live on `rig`/pivots.

export function buildUnmasked(def, quality = 1) {
  const accent = def.accent ?? 0xf0e0a0;   // gold (lash-line + motes; identity accent, emissive only)
  const glow = def.glow ?? 0xffffff;       // white corona (the reserved glow-shape, from slot 1)
  const lowQ = quality < 0.75;
  const TAU = Math.PI * 2;

  const kit = createBossCommon(def, quality, { shieldRadius: 5.6, hpBarY: 7.8 });
  const { group, track } = kit;
  group.userData.archetype = 'unmasked';

  const rig = new THREE.Group();
  group.add(rig);
  const stage1 = new THREE.Group();
  stage1.name = 'stage1Rig';
  rig.add(stage1);

  const rnd = mulberry32(0x14a9e1105);

  const DISC_R = 4.7;
  const DISC_Z = 0.0;
  const EYE_Z = 0.4;
  const LID_Z = 0.95;

  // ── THE FLAT BLACK DISC — pure void-black, opaque, matte, FLAT; clean until the
  // scripted S1→S2 CRACK (CP2). MeshBasic → true black on the front-lit rail. ──
  const discSeg = lowQ ? 44 : 80;
  const discMat = track(new THREE.MeshBasicMaterial({ color: 0x000000 }));
  const discGeo = new THREE.CircleGeometry(DISC_R, discSeg);
  discGeo.translate(0, 0, DISC_Z);
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.name = 'eclipseDisc';
  stage1.add(disc);

  // ── THE CORONA — a SOFT LUMINOUS RING (the reserved glow-shape). Built as an
  // additive annulus with RADIAL FALLOFF via vertex colour (bright white inner edge →
  // BLACK outer, so additive blending dissolves it to nothing — no hard outer edge =
  // no portal rim). ASYMMETRIC via LOW-FREQUENCY lobes only (period > 90°): the outer
  // extent + inner brightness vary in 2–3 broad lobes with one dominant bright quadrant
  // (authored §3.6, not noise) — a glowing ring that, on a look, has no two matching
  // arcs. NO hard radial lines (= cartoon sun), NO spin (breathe only, §3.7). ──
  const CN = lowQ ? 60 : 108;
  const BRIGHT_DIR = 1.15;                 // the dominant bright quadrant (radians)
  const coronaPos = [], coronaCol = [], coronaIdx = [];
  const HOT = 1.5;
  // THREE radial loops (inner bright → mid → black) for a SMOOTH, wide falloff — so the
  // outer edge stays soft even on a PALE biome sky (additive white on pale washes a
  // 2-loop gradient into a hard rim; the mid loop keeps it gradual). Owner-review polish #1.
  for (let i = 0; i <= CN; i++) {
    const a = (i / CN) * TAU;
    // Low-frequency, broad lobes — outer falloff extent varies ±~35% (soft plumes, not spikes).
    const lobe = 1 + 0.34 * Math.sin(a * 2 + 0.7) + 0.17 * Math.sin(a * 3 - 1.2);
    // One dominant bright quadrant + a gentle floor so the ring never fully dies.
    const bq = 0.5 + 0.5 * Math.max(0, Math.cos(a - BRIGHT_DIR));
    const cx = Math.cos(a), cy = Math.sin(a);
    const rIn = DISC_R * 0.985;
    const rMid = DISC_R + DISC_R * 0.07 * lobe;
    const rOut = DISC_R + DISC_R * 0.22 * lobe;       // wider band → a gentler outer edge
    coronaPos.push(cx * rIn, cy * rIn, DISC_Z - 0.02, cx * rMid, cy * rMid, DISC_Z - 0.02, cx * rOut, cy * rOut, DISC_Z - 0.02);
    const hot = HOT * bq;
    coronaCol.push(hot, hot, hot, hot * 0.42, hot * 0.42, hot * 0.42, 0, 0, 0);   // bright → mid → BLACK
  }
  for (let i = 0; i < CN; i++) {
    const a = i * 3, b = a + 3;
    coronaIdx.push(a, a + 1, b + 1, a, b + 1, b);           // inner → mid strip
    coronaIdx.push(a + 1, a + 2, b + 2, a + 1, b + 2, b + 1); // mid → outer strip
  }
  const coronaGeo = new THREE.BufferGeometry();
  coronaGeo.setAttribute('position', new THREE.Float32BufferAttribute(coronaPos, 3));
  coronaGeo.setAttribute('color', new THREE.Float32BufferAttribute(coronaCol, 3));
  coronaGeo.setIndex(coronaIdx);
  const coronaMat = track(new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  coronaMat.toneMapped = false;   // .color multiplies the vertex colours → the breathe/charge dimmer
  const corona = new THREE.Mesh(coronaGeo, coronaMat);
  corona.name = 'corona';
  stage1.add(corona);

  // A thin DARK separation halo just outside the rim (behind the corona) so the ring +
  // disc read as shape on a PALE biome sky (persistence). Invisible on the dark sky.
  const haloMat = track(new THREE.MeshBasicMaterial({
    color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide,
  }));
  const haloGeo = new THREE.RingGeometry(DISC_R * 0.99, DISC_R * 1.14, lowQ ? 40 : 72);
  haloGeo.translate(0, 0, DISC_Z - 0.05);
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.name = 'coronaHalo';
  stage1.add(halo);

  // ── THE EYE — a BIG HDR white almond that DOMINATES the disc (~0.77× disc diameter,
  // wider than the 26u lane, §5j). Named `focalEye`. The black disc is its rim. White-
  // hot, toneMapped=false ×HOT so it blooms. ──
  const EYE_HOT = 1.7;   // bright + blooms, but NOT fully blown — so the dark iris reads against it
  const EYE_BASE = new THREE.Color(0xfff4e6);
  const A_HALF_W = DISC_R * 0.77;                 // almond half-width target sets the read
  const ALMOND = [A_HALF_W / 2.4, (DISC_R * 0.45) / 2.4, 0.9 / 2.4];   // scale on a base r=2.4 sphere
  const almondSeg = lowQ ? [16, 12] : [26, 16];
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: 0xfff4e6 }));
  eyeMat.toneMapped = false;
  eyeMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(2.4, almondSeg[0], almondSeg[1]), eyeMat);
  eye.name = 'focalEye';
  eye.scale.set(...ALMOND);
  eye.position.set(0, 0, EYE_Z);
  stage1.add(eye);
  const A_W = 2.4 * ALMOND[0];                    // almond half-width in world units (~3.6)
  const A_H = 2.4 * ALMOND[1];                    // almond half-height (~2.1)

  // The dark IRIS/pupil — a prominent dark disc on the white sclera that TRACKS within
  // the almond, so the player's stick visibly drags the gaze (the §5j "Don't Move" beat).
  // The dark-in-brightness focal: the eye reads as a real eye (white sclera, dark pupil).
  const seedMat = track(new THREE.MeshBasicMaterial({ color: 0x040302 }));   // near-black: reads unambiguously on the bright sclera (owner-review polish #3)
  seedMat.toneMapped = false;
  const SEED_R = 0.95;
  const seed = new THREE.Mesh(new THREE.SphereGeometry(SEED_R, lowQ ? 14 : 20, 14), seedMat);
  seed.name = 'pupilSeed';
  seed.scale.set(1, 1, 0.4);
  seed.position.set(0, 0, EYE_Z + 0.5);
  stage1.add(seed);

  // ── THE HEAVY HOODED LID — ONE thick brow-dome with MASS (extruded + bevelled), a
  // dim gold LASH-LINE along its curved lower margin (organic curve, never a level
  // chord). Hinged near the almond TOP (`lidPivot`); peels back on aperture but ALWAYS
  // keeps a hood over the eye (the ancient heavy-lidded read). It OVERLAPS/occludes the
  // almond, never outlines it (a closed loop = the framed-icon read, forbidden). ──
  const lidMat = track(new THREE.MeshStandardMaterial({
    color: 0x0b0a0c, emissive: 0x000000, roughness: 1.0, metalness: 0.0, flatShading: true,
  }));
  // ONE heavy upper hood (a thick brow-dome), authored almond-centred. Its lower margin
  // (lash) is a gentle ⌒ (bow UP at centre) so the visible eye-opening below it is an
  // ALMOND, not a smile. It SLIDES vertically on `lidPivot` (a real upper eyelid): DOWN
  // covers the eye (heavy-lidded), UP peels it open — far more predictable than a hinge,
  // and it never sweeps like a frame edge. Corners sit at the almond canthi (eye corners).
  const HOOD_HW = A_W * 1.0;
  const HOOD_LASH_CTRL = A_H * 0.35;         // lash ⌒ (deeper curve — a clear almond, never a level line). Owner-review polish #2.
  const hoodShape = () => {
    const s = new THREE.Shape();
    s.moveTo(-HOOD_HW, 0);
    s.quadraticCurveTo(0, A_H * 2.0, HOOD_HW, 0);          // brow: a heavy dome up to ~the almond top
    s.quadraticCurveTo(0, HOOD_LASH_CTRL, -HOOD_HW, 0);    // lash: gentle ⌒ (curved, never a level chord)
    s.closePath();
    return s;
  };
  const hoodGeo = stripForMerge(new THREE.ExtrudeGeometry(hoodShape(), {
    depth: 0.6, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 1, steps: 1, curveSegments: lowQ ? 8 : 14,
  }));
  hoodGeo.translate(0, 0, -0.3);
  const lidPivot = new THREE.Object3D();
  lidPivot.position.set(0, 0, LID_Z);
  lidPivot.name = 'lidPivot';
  const hood = new THREE.Mesh(hoodGeo, lidMat);
  lidPivot.add(hood);
  stage1.add(lidPivot);
  const SLIDE_MAX = 2.0;                      // full-open slide (brow stays inside the disc rim)

  // The gold LASH-LINE: a dim additive curve tracing the hood's lower margin (rides the
  // hood so it reads as the lid's lit edge, the one organic line). Sampled off the lash.
  const lashPts = [];
  {
    const N = lowQ ? 14 : 22;
    const p0x = HOOD_HW, p0y = 0, cpx = 0, cpy = HOOD_LASH_CTRL, p1x = -HOOD_HW, p1y = 0;
    for (let i = 0; i <= N; i++) {
      const t = i / N, it = 1 - t;
      const x = it * it * p0x + 2 * it * t * cpx + t * t * p1x;
      const y = it * it * p0y + 2 * it * t * cpy + t * t * p1y;
      lashPts.push(x, y, 0.4);
    }
  }
  const lashGeo = new THREE.BufferGeometry();
  lashGeo.setAttribute('position', new THREE.Float32BufferAttribute(lashPts, 3));
  const lashMat = track(new THREE.LineBasicMaterial({
    color: accent, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  lashMat.toneMapped = false;
  const lash = new THREE.Line(lashGeo, lashMat);
  lash.name = 'lashLine';
  lidPivot.add(lash);

  // aperture 0 = hood fully down (near-shut), 1 = peeled back (a hood always remains).
  // aperture → the hood's vertical SLIDE: low = slid down (heavy-lidded), high = slid up (open).
  const lidSlide = (aperture) => Math.max(-0.4, Math.min(SLIDE_MAX, aperture * 2.3 - 0.3));

  // ── ATTENDANT MOTES — dim dark satellites (§3 law 8) + the orbiter contract (≥2). ──
  const orbiters = [];
  const moteN = lowQ ? 2 : 3;
  const moteMat = track(new THREE.MeshStandardMaterial({
    color: 0x080705, emissive: accent, emissiveIntensity: 0.05, roughness: 1.0, metalness: 0.0, flatShading: true,
  }));
  const moteGeo = stripForMerge(new THREE.IcosahedronGeometry(0.12, 0));
  for (let i = 0; i < moteN; i++) {
    const m = new THREE.Mesh(moteGeo, moteMat);
    m.userData = { ang: (i / moteN) * TAU, radius: DISC_R * (1.08 + rnd() * 0.16), speed: 0.13 + rnd() * 0.1, baseY: (rnd() - 0.5) * 2.2, tilt: rnd() * TAU };
    stage1.add(m);
    orbiters.push(m);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 2 — THE SERAPH (the hero stage). SIX dark feathered wings in a VERTICAL
  // BILATERAL FAN (a pointed mandorla), COVERED IN EYES, roots converging on ONE great
  // central eye. NOT the retired Ophanim wheels (no rings/spokes/rotation): feathers,
  // bilateral pairs, breathing not spinning. Built as a sibling sub-rig, hidden by
  // default; the CP2 stage system dissolve-swaps to it. Anti-reads: NOT gear/chandelier
  // (no closed ring but the faint gold HALO behind), NOT bird (open top+bottom notch, no
  // beak/tail), NOT Ashtalon×3 (NO ember — gold only; feathers not scythes; 6 still wings
  // vs 2 hunting). The eyes are the ONLY emissive family; feathers paint VALUE, not light.
  // ══════════════════════════════════════════════════════════════════════════
  const stage2 = new THREE.Group();
  stage2.name = 'stage2Rig';
  stage2.visible = false;
  rig.add(stage2);

  const mergeParts = (parts, label) => {
    const g = mergeGeometries(parts, false);
    if (!g) throw new Error(`buildUnmasked: ${label} mergeGeometries returned null (attribute mismatch)`);
    return g;
  };

  // ── FEATHER MATERIALS — near-black, matte; ±value steps by TIER (depth via value, not
  // light — the sun is ahead so front faces get no directional shading). A3 darken. ──
  // DoubleSide: left wings mirror via scale.x=-1 (which inverts normals) — DoubleSide
  // avoids the inverted-normal blackout (the Ashtalon precedent).
  // Separated dark VALUES per tier (depth by value, since the sun is ahead → no directional
  // shading): primaries darkest at the back, coverts lightest at the front — layered feathers
  // read even at fight distance instead of one flat black slab.
  const primFeatherMat = track(new THREE.MeshStandardMaterial({ color: 0x070707, roughness: 1.0, metalness: 0.0, flatShading: true, side: THREE.DoubleSide }));
  const secFeatherMat = track(new THREE.MeshStandardMaterial({ color: 0x16130d, roughness: 1.0, metalness: 0.0, flatShading: true, side: THREE.DoubleSide }));
  const covFeatherMat = track(new THREE.MeshStandardMaterial({ color: 0x272013, roughness: 1.0, metalness: 0.0, flatShading: true, side: THREE.DoubleSide }));
  const wingRootMat = track(new THREE.MeshStandardMaterial({ color: 0x0c0a06, roughness: 1.0, metalness: 0.0, flatShading: true, side: THREE.DoubleSide }));

  // ── FEATHER KERNEL — the Ashtalon blade-extrude TECHNIQUE only, softened from a scythe
  // hook toward a straighter S taper (a quill, not a sickle). Blade + a raised central rib
  // (the rachis) merged on one material. ──
  // No bevel: the feathers are near-black + front-lit (the sun is ahead) so a bevel would
  // add tris for zero visible shading. The raised rib (rachis) carries the relief instead.
  const bladeExtrude = { depth: 0.09, bevelEnabled: false, steps: 1, curveSegments: lowQ ? 3 : 4 };
  // A CURVED feather (a scythe-soft plume) with a ROUNDED barb tip (not a sharp serrated
  // spike — the reference has soft feather ends). The tip curls to +X so, laid in a comb,
  // the wing reads as curved plumage, not straight rays.
  const featherShape = (len, w, curl = 0.28) => {
    const cx = len * curl;   // tip drift (the curl)
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(w * 0.66, len * 0.44, w * 0.30 + cx * 0.7, len * 0.82);   // leading edge, broad belly, curling
    s.quadraticCurveTo(w * 0.12 + cx, len * 0.995, cx - w * 0.05, len);          // ROUNDED crown (a soft arc, not a point)
    s.quadraticCurveTo(-w * 0.30 + cx * 0.5, len * 0.80, -w * 0.5, len * 0.4);    // trailing edge, broad
    s.quadraticCurveTo(-w * 0.5, len * 0.16, 0, 0);                              // trailing to the root
    return s;
  };
  const addFeather = (parts, len, w, rot, px, py, pz) => {
    const blade = stripForMerge(new THREE.ExtrudeGeometry(featherShape(len, w), bladeExtrude));
    const rib = stripForMerge(new THREE.BoxGeometry(Math.max(0.05, w * 0.13), len * 0.6, 0.09));
    rib.translate(0, len * 0.34, 0.055);
    const m = new THREE.Matrix4().makeRotationZ(rot);
    m.setPosition(px, py, pz);
    blade.applyMatrix4(m); rib.applyMatrix4(m);
    parts.push(blade, rib);
  };
  // A WING TIER: feather roots MARCH along a curved leading-edge arm (climb +Y, drift +X),
  // each feather swept to a common up-and-out direction and curling progressively toward the
  // tip — a coherent CURVED wing-comb (the reference silhouette), NOT a radial spray. Lengths
  // swell toward the outer third then taper at the very tip; a half-pitch phase staggers tiers.
  const CURL = 0.6;
  const addWingTier = (parts, n, baseLen, w0, z, lenScale, phaseFrac) => {
    const base = (phaseFrac || 0) / Math.max(1, n);
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0.5;
      const s = Math.min(1, t + base);
      // roots march along the arm — the leading edge curls outward (+X) as it climbs (+Y)
      const rx = CURL * Math.pow(s, 1.4) * 2.0 * lenScale;
      const ry = (0.25 + s * 2.7) * lenScale;
      // feathers sweep up-and-out, curling progressively toward the tip (the "fingers"); roots trail
      const rot = -0.12 + s * CURL * 1.15;
      const swell = 0.5 + Math.sin((0.24 + t * 0.72) * Math.PI) * 0.78;   // swell to the outer third, taper at the tip
      const len = baseLen * lenScale * swell * (0.94 + rnd() * 0.12);
      const w = w0 * (0.78 + t * 0.42);
      addFeather(parts, len, w, rot, rx, ry, z + i * 0.05);
    }
  };

  // ── ~20 TRACKING EYES — THE IDENTITY ("a thing covered in eyes") + the screenshot.
  // THE L142 REAL-EYE RECIPE (the bulb killer): CONTRAST, not brightness. Every prior
  // pass made these emissive white orbs that bloomed into fairy-lights with no pupil.
  // The fix, seated strictly PROUD front-to-back per eye:
  //   recessed dark SOCKET (0x030302) → flattened DIM SCLERA (0x4a4436, ×1.0 TONE-MAPPED,
  //   never blooms) → thin dim dark-gold IRIS → BIG DARK PUPIL (0x040302, ~0.7×size radius,
  //   ~60% of sclera width) → a TINY white CATCHLIGHT (×7, toneMapped=false — the ONLY hot
  //   pixel in the whole eye), offset up-left, proudest.
  // Statics merge per material (4 draws total); pupils stay separate (they track, with
  // independent per-eye lag + a small resting bias so the field reads as living eyes that
  // look every which way — until the all-snap zeroes them to the player, CP2). ──
  // The eyes read as EYES, not grommets, via CONTRAST: a PALE bone sclera (the lightest
  // value on the body besides catchlights — tone-mapped, matte, never a bloom) around a
  // GOLD iris ring around a distinct DARK pupil, thin dark socket for depth, a proud white
  // catchlight. The stranger test read the old dark-rim + dark-pupil as a metal ring with a
  // hole; a pale eyeball with a gold iris and a smaller pupil reads unmistakably as an eye.
  const socketMat = track(new THREE.MeshBasicMaterial({ color: 0x050403 }));   // thin recessed rim (eyelid shadow)
  const s2scleraMat = track(new THREE.MeshBasicMaterial({ color: 0x8f8365 })); // eyeball value: light enough to frame the pupil, dim enough NOT to bloom (tone-mapped)
  const irisMat = track(new THREE.MeshBasicMaterial({ color: 0x463619 }));      // dim gold iris (toned down — less beady at distance)
  const s2pupilMat = track(new THREE.MeshBasicMaterial({ color: 0x040302 }));   // DARK pupil (smaller — the eyeball shows around it)
  s2pupilMat.toneMapped = false;
  const catchMat = track(new THREE.MeshBasicMaterial({ color: 0xfff6e6 }));     // a small proud glint (NOT a headlight — a hair over white so it reads wet without blooming)
  catchMat.toneMapped = false;
  catchMat.color.multiplyScalar(2.4);
  const sockets = [], sclerae = [], irises = [], catchlights = [], pupils = [];
  const eyePlace = (local, size) => {
    // socket (thin recessed rim, pushed back — just enough to seat the eye)
    const sk = new THREE.SphereGeometry(size * 1.1, lowQ ? 8 : 12, lowQ ? 6 : 8);
    sk.scale(1.2, 0.96, 0.34); sk.translate(local.x, local.y, local.z - size * 0.22);
    sockets.push(stripForMerge(sk));
    // sclera (flattened PALE eyeball)
    const sc = new THREE.SphereGeometry(size, lowQ ? 8 : 12, lowQ ? 6 : 9);
    sc.scale(1.22, 0.9, 0.45); sc.translate(local.x, local.y, local.z);
    sclerae.push(stripForMerge(sc));
    // iris (a dim gold ring showing around the pupil, on the pale sclera)
    const ir = new THREE.CircleGeometry(size * 0.58, lowQ ? 12 : 18);
    ir.translate(local.x, local.y, local.z + size * 0.3);
    irises.push(stripForMerge(ir));
    // catchlight (small proud glint, up-left) — sits where the pupil rests at the snap
    const cl = new THREE.SphereGeometry(size * 0.1, 6, 6);
    cl.translate(local.x - size * 0.28, local.y + size * 0.32, local.z + size * 0.6);
    catchlights.push(stripForMerge(cl));
    // pupil (tracks; smaller so the eyeball reads around it — not a hole)
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(size * 0.5, lowQ ? 8 : 10, 8), s2pupilMat);
    pupil.scale.set(1, 1, 0.55);
    const bx = (rnd() - 0.5) * 0.55, by = (rnd() - 0.5) * 0.45;
    pupil.userData = { base: local.clone(), size, biasX: bx, biasY: by, lag: 0.2 + rnd() * 0.6, gx: bx, gy: by };
    pupil.position.set(local.x + bx * size * 0.4, local.y + by * size * 0.4, local.z + size * 0.62);
    stage2.add(pupil);
    pupils.push(pupil);
  };
  // ── THE SIX WINGS — 3 mirrored pairs on shoulder pivots converging at the heart. Angle
  // measured from +Y (up), rotating the wing outward; uneven pair gaps (68°/55°) = anti-
  // gear. Open notch at TOP (upper pair) + BOTTOM (lower pair) → a mandorla, never a wreath
  // or a bird. Length hierarchy: middle longest, upper 0.8×, lower 0.62×. ──
  // A BILATERAL UPWARD CREST (the reference silhouette): mirror-symmetric left/right pairs
  // about the vertical centerline, EVERY wing rising up-and-out ABOVE the great eye at the
  // base — nothing points down or splays low (that radial splay read as star/wheel/spider).
  // Angles from +Y (up) all in the UPPER hemisphere (max 74° = still 16° above horizontal):
  // inner near-vertical, outer to the raised "arms". Gaps 24°/36° (≠60°, differ ≥10° = anti-
  // gear). Per-pair z + depth tilt (tiltX) give front-to-back layering (not a paper cutout).
  // All three pairs rise into the UPPER hemisphere (outer at 66° = 24° above horizontal —
  // NOTHING droops to the moth-spread), roots seated ABOVE + BEHIND the great eye so no
  // wing ever crosses it. z layers the pairs front-to-back (inner furthest back) + tiltX
  // fans them in depth so the profile has body (not a paper cutout).
  const WING_ROOT_Y = 0.9;    // shoulders sit above the great-eye centre → wings rise from behind its crown
  const PAIRS = [
    { key: 'inner', deg: 12, lenScale: 1.00, z: -1.7, tiltX: 0.24 },   // near-vertical crest, tilted back
    { key: 'mid',   deg: 36, lenScale: 1.00, z: -1.1, tiltX: 0.02 },   // up-and-out
    { key: 'outer', deg: 66, lenScale: 0.90, z: -0.5, tiltX: -0.24 },  // raised arms (still well above horizontal)
  ];
  const PRIM_LEN = 6.8;
  const TIERS = [
    { name: 'prim', n: lowQ ? 6 : 8, w: 1.9, z: -0.55, lenMul: 1.00, phase: 0.0, mat: primFeatherMat },
    { name: 'sec',  n: lowQ ? 5 : 7, w: 1.5, z: -0.05, lenMul: 0.72, phase: 0.5, mat: secFeatherMat },
    { name: 'cov',  n: lowQ ? 4 : 5, w: 1.15, z: 0.40, lenMul: 0.48, phase: 0.5, mat: covFeatherMat },
  ];
  const shoulders = [];
  for (let pi = 0; pi < PAIRS.length; pi++) {
    const pair = PAIRS[pi];
    for (const side of [1, -1]) {
      const shoulder = new THREE.Object3D();
      // Canonical RIGHT wing points to -deg; the LEFT mirrors via scale.x=-1 (clean bilateral
      // mirror incl. the feather curl) at +deg. (rotation.y splay is gone — that was what
      // broke handedness before; per-pair z-offset gives depth instead.) THE ONE SCAR WING
      // (§3.6): the lower-LEFT hangs ~7° further off its mirror.
      const scar = (pair.key === 'outer' && side < 0) ? 0.12 : 0;
      const baseRotZ = side > 0 ? -(pair.deg * Math.PI / 180) : (pair.deg * Math.PI / 180) + scar;
      shoulder.rotation.z = baseRotZ;
      shoulder.rotation.x = pair.tiltX;   // depth tilt (Y-Z plane — unaffected by the scale.x mirror) → 3D layering in profile
      if (side < 0) shoulder.scale.x = -1;
      shoulder.position.set(0, WING_ROOT_Y, pair.z);   // above + behind the great eye
      shoulder.name = `wing_${pair.key}_${side > 0 ? 'R' : 'L'}`;
      // ROOT PLATE — the solid inner wing (the "arm"), a small dark crescent bridging the gap.
      const rootGeo = stripForMerge(new THREE.ExtrudeGeometry(featherShape(1.9 * pair.lenScale, 1.1), { ...bladeExtrude, depth: 0.16 }));
      shoulder.add(new THREE.Mesh(rootGeo, wingRootMat));
      for (const tier of TIERS) {
        const parts = [];
        addWingTier(parts, tier.n, PRIM_LEN * tier.lenMul, tier.w, tier.z, pair.lenScale, tier.phase);
        const mesh = new THREE.Mesh(mergeParts(parts, `${shoulder.name}_${tier.name}`), tier.mat);
        mesh.name = `${shoulder.name}_${tier.name}`;
        shoulder.add(mesh);
      }
      stage2.add(shoulder);
      shoulder.updateMatrix();
      shoulders.push({ obj: shoulder, baseRotZ, phase: pi * 1.3 + (side < 0 ? 0.7 : 0), amp: 0.045 + pi * 0.012 });
      // 3 EYES per wing spread WIDELY along the plumage (covered in eyes), pushed out so no
      // two scleras touch (the old clump-at-the-root read as frogspawn). local→world, face cam.
      const eyeSizes = [0.56, 0.44, 0.34];
      for (let e = 0; e < 3; e++) {
        const ea = (e / 3 - 0.33) * 0.9 + (rnd() - 0.5) * 0.25;
        const er = 3.4 + e * 1.7 + rnd() * 0.5;
        const elocal = new THREE.Vector3(Math.sin(ea) * er * 0.55, Math.cos(ea) * er, 0.55);
        const eworld = elocal.applyMatrix4(shoulder.matrix);
        eworld.z = Math.max(eworld.z, 0.4);
        eyePlace(eworld, eyeSizes[e] * (0.9 + rnd() * 0.2));
      }
    }
  }

  // ── THE ONE GREAT CENTRAL EYE — at the six-root convergence, the survivor (S1 focalEye
  // continuity in CP2). A big dim almond, ≥4× the largest peripheral eye. Same L142 recipe
  // (contrast, not brightness) — bigger pupil, prouder catchlight; it is the focal, so it
  // gets its own named meshes (not merged). ──
  // Explicit half-dimensions (base sphere r=1 → scale IS the half-extent). A 4.8u almond
  // (half-width 2.4) ≥ 4× the largest peripheral (half-width ~0.6). Stacked strictly PROUD:
  // socket (back) → sclera → iris → pupil → catchlight (front-most).
  const GW = 3.4, GH = 2.0, GD = 1.1;     // sclera half-width / -height / -depth — grown ~30%: the ANCHOR
  const GF = GD;                          // sclera front-face z (center at 0)
  const GEY = -0.6;                       // seated LOW (bottom-centre), below the wing roots → never crossed
  const greatSocket = new THREE.Mesh(new THREE.SphereGeometry(1, lowQ ? 16 : 24, lowQ ? 10 : 14), socketMat);
  greatSocket.scale.set(GW * 1.1, GH * 1.14, 0.55); greatSocket.position.set(0, GEY, -0.35);
  greatSocket.name = 'greatSocket'; stage2.add(greatSocket);
  const greatScleraMat = track(new THREE.MeshBasicMaterial({ color: 0x82785e }));   // eyeball value (tone-mapped, won't bloom) — the great staring eye
  const greatEye = new THREE.Mesh(new THREE.SphereGeometry(1, lowQ ? 18 : 30, lowQ ? 12 : 18), greatScleraMat);
  greatEye.scale.set(GW, GH, GD); greatEye.position.set(0, GEY, 0);
  greatEye.name = 'greatEye'; stage2.add(greatEye);
  const greatIris = new THREE.Mesh(new THREE.CircleGeometry(1, lowQ ? 20 : 32), irisMat);
  greatIris.scale.set(GW * 0.5, GH * 0.62, 1); greatIris.position.set(0, GEY, GF + 0.05);   // gold iris ring
  greatIris.name = 'greatIris'; stage2.add(greatIris);
  const greatPupil = new THREE.Mesh(new THREE.SphereGeometry(1, lowQ ? 16 : 24, lowQ ? 10 : 14), s2pupilMat);
  greatPupil.scale.set(GW * 0.42, GH * 0.5, 0.45); greatPupil.position.set(0, GEY, GF + 0.15);   // ~45% — the pale eyeball reads clearly around it
  greatPupil.name = 'greatPupil'; stage2.add(greatPupil);
  const greatCatch = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), catchMat);
  greatCatch.position.set(-GW * 0.24, GEY + GH * 0.34, GF + 0.6);
  greatCatch.name = 'greatCatch'; stage2.add(greatCatch);

  const socketMesh = new THREE.Mesh(mergeParts(sockets, 'eyeSockets'), socketMat);
  socketMesh.name = 'eyeSockets';
  stage2.add(socketMesh);
  const scleraMesh = new THREE.Mesh(mergeParts(sclerae, 'eyeScleras'), s2scleraMat);
  scleraMesh.name = 'eyeScleras';
  stage2.add(scleraMesh);
  const irisMesh = new THREE.Mesh(mergeParts(irises, 'eyeIrises'), irisMat);
  irisMesh.name = 'eyeIrises';
  stage2.add(irisMesh);
  const catchMesh = new THREE.Mesh(mergeParts(catchlights, 'eyeCatchlights'), catchMat);
  catchMesh.name = 'eyeCatchlights';
  stage2.add(catchMesh);

  // ── THE HALO — ONE thin gold annulus BEHIND the fan (the sole corona nod), NON-additive,
  // faint, partially occluded by the middle wings crossing it. NO cogs/spokes/second ring. ──
  // Faint + smaller so the upward wings OVERSHOOT and cross it (a broken, occluded arc — a
  // saint's halo behind the crest), never a clean gold rim (which read as a ship's wheel).
  const haloS2Mat = track(new THREE.MeshBasicMaterial({
    color: 0xc9a45a, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide,
  }));
  const HALO_R = 4.2;
  const haloS2 = new THREE.Mesh(new THREE.RingGeometry(HALO_R * 0.94, HALO_R, lowQ ? 40 : 72), haloS2Mat);
  haloS2.position.set(0, HALO_R * 0.45, -1.4);   // ride UP behind the crest (a halo over the head, not a rim around the body)
  haloS2.name = 'halo';
  stage2.add(haloS2);

  // ── RELICS (§8) — short gold wire glints at the wing roots (5 trophies + 1 EMPTY wire =
  // the post-game gap worn on the body). LineSegments = overdraw-exempt. CP2 wires the
  // per-relic palette + the destroy→sag behaviour; this seeds the roots. ──
  const relicPts = [];
  for (let r = 0; r < 6; r++) {
    const a = -Math.PI / 2 + (r / 6) * TAU;
    const rr = 1.4;
    const cx = Math.cos(a) * rr, cy = Math.sin(a) * rr;
    relicPts.push(cx, cy, 0.6, cx + Math.cos(a) * 0.5, cy + Math.sin(a) * 0.5, 0.6);
  }
  const relicGeo = new THREE.BufferGeometry();
  relicGeo.setAttribute('position', new THREE.Float32BufferAttribute(relicPts, 3));
  const relicMat = track(new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
  relicMat.toneMapped = false;
  const relics = new THREE.LineSegments(relicGeo, relicMat);
  relics.name = 'relicRoots';
  stage2.add(relics);

  kit.flashBind(lidMat, 0.0);
  kit.finalize();

  // Stage select (CP2 wires this to the phase machine; for now a debug/gate hook).
  let stageN = 1;
  function setDebugStage(n) {
    stageN = n;
    stage1.visible = (n == null || n === 1);
    stage2.visible = (n === 2);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ANIMATION / STATE
  // ──────────────────────────────────────────────────────────────────────────
  const DANGER = new THREE.Color(0xff2b6a);
  const _c = new THREE.Color();

  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }

  let gazeTX = 0, gazeTY = 0, gazeX = 0, gazeY = 0;
  function setGaze(nx, ny) { gazeTX = Math.max(-1, Math.min(1, nx)); gazeTY = Math.max(-1, Math.min(1, ny)); }
  let noticeT = 0, saccadeT = 0;
  function notice() { noticeT = 1.1; saccadeT = 0.18; }
  let painT = 0, skitterX = 0, skitterY = 0;
  function flinchFlash(amt) {
    if (amt > 0.3) { painT = Math.max(painT, 0.3); skitterX = (rnd() - 0.5) * 1.6; skitterY = (rnd() - 0.5) * 1.2; }
    kit.flash(amt);
  }
  let dyingK = 0;
  function setDissolveEmotive(k) { dyingK = Math.max(0, Math.min(1, k)); kit.setDissolve(k); }

  let aperture = 0.35;   // eased hood aperture (0.35 = a clearly-open hooded eye at rest)

  function tickBody(dt, time) {
    if (noticeT > 0) noticeT -= dt;
    if (saccadeT > 0) saccadeT -= dt;
    if (painT > 0) painT -= dt;

    // ── Aperture (EXPRESSION): heavy-lidded rest → watching → wrath (charge lifts the
    // hood). Death lowers it (the light going out). ──
    const watching = noticeT > 0 || Math.abs(gazeTX) + Math.abs(gazeTY) > 0.05;
    let apTarget = 0.42;                 // dormant: a heavy-lidded but clearly-open eye
    if (watching) apTarget = 0.72;       // watching: a wide open eye (the fight look)
    if (gazeTY > 0) apTarget += gazeTY * 0.22;   // looking UP lifts the hood (a real eye widens) so the pupil stays visible
    apTarget = Math.max(apTarget, charge * 0.95);
    apTarget = Math.min(1, apTarget + (painT > 0 ? 0.1 : 0));
    apTarget *= 1 - dyingK * 0.85;
    aperture += (apTarget - aperture) * Math.min(1, dt * 6);
    lidPivot.position.y = lidSlide(aperture);      // slide up to peel open, down to cover (heavy-lidded)

    // ── Gaze: the pupil-SEED tracks within the almond (the player's stick drags the
    // gaze); heavy wet lag; the saccade snaps dead-centre; a flinch skitters it. ──
    const gLag = saccadeT > 0 ? 22 : (noticeT > 0 || charge > 0.4 ? 8 : 3);
    const tx = saccadeT > 0 ? 0 : gazeTX + (painT > 0 ? skitterX : 0);
    const ty = saccadeT > 0 ? 0 : gazeTY + (painT > 0 ? skitterY : 0);
    gazeX += (tx - gazeX) * Math.min(1, dt * gLag);
    gazeY += (ty - gazeY) * Math.min(1, dt * gLag);
    seed.position.set(gazeX * A_W * 0.5, gazeY * A_H * 0.32, EYE_Z + 0.55);   // reduced vertical travel — the pupil stays in the sclera at both extremes

    // ── Seed size (BLINK-analog + CHARGE-TELL): breathes; CONSTRICTS on charge; pinned
    // on the notice saccade; blows WIDE in death. ──
    const breathe = 1 + Math.sin(time * 0.9 * TAU) * 0.04;
    const constrict = dyingK > 0 ? 1.5 : (saccadeT > 0 ? 0.55 : (1 - charge * 0.42));
    const ss = breathe * constrict;
    seed.scale.set(ss, ss, 0.5 * (dyingK > 0 ? 1.6 : 1));

    // Eye heat: idle pulse; hotter on notice; reddens toward danger on charge (wrath);
    // light going out in death.
    let eyeK = 1 + Math.sin(time * 2.6 * TAU) * 0.04;
    if (noticeT > 0) eyeK *= 1.22;
    eyeK *= 1 - dyingK * 0.6;
    _c.copy(EYE_BASE).lerp(DANGER, charge * 0.6);
    eyeMat.color.copy(_c).multiplyScalar(eyeK * EYE_HOT);

    // ── Corona: BREATHE (never spin); brighter as the eye opens + on charge; dimmer
    // when heavy-lidded (the lidded sun is dimmer). .color scales the vertex colours. ──
    const breatheC = 0.62 + Math.sin(time * 0.6 * TAU) * 0.08 + aperture * 0.3 + charge * 0.35;
    const cK = Math.max(0, breatheC) * (1 - dyingK);
    coronaMat.color.setScalar(cK);
    lashMat.opacity = (0.35 + aperture * 0.35 + charge * 0.2) * (1 - dyingK);

    // Attendant motes: slow drift (a 2nd idle frequency).
    for (const o of orbiters) {
      const u = o.userData;
      u.ang += dt * u.speed;
      o.position.set(Math.cos(u.ang) * u.radius, u.baseY + Math.sin(time * 0.9 + u.tilt) * 0.6, Math.sin(u.ang) * u.radius * 0.35 + DISC_Z);
      o.rotation.x += dt * 1.3;
      o.rotation.y += dt * 1.0;
    }

    // ── STAGE 2 — the wings BREATHE, never spin (respiration = alive, rotation = machine;
    // the §3 stillness thesis: nothing translates, ever). A slow mantle oscillation of a few
    // degrees about each shoulder's base angle, tiers lagging via per-wing phase; charge
    // deepens the breath. ──
    if (stage2.visible) {
      const breath = 1 + charge * 0.8;
      for (const s of shoulders) {
        s.obj.rotation.z = s.baseRotZ + Math.sin(time * 0.2 * TAU + s.phase) * s.amp * breath;
      }
      // The great central eye's pupil tracks the player (the focal); constricts on charge.
      const gk = 1 - charge * 0.3;
      greatPupil.position.set(gazeX * GW * 0.32, GEY + gazeY * GH * 0.28, GF + 0.15);
      greatPupil.scale.set(GW * 0.42 * gk, GH * 0.5 * gk, 0.45);
      // Each peripheral pupil tracks the player within its own sclera, sitting proud of the
      // front. Independent per-eye LAG + a small resting BIAS make the field read as living
      // eyes that look every which way; the shared gazeX/gazeY drags them toward the player.
      // (CP2 adds the ALL-SNAP: bias→0 + lag→0 for one frame + a catchlight flare.)
      for (const p of pupils) {
        const u = p.userData;
        const tgx = gazeX + u.biasX, tgy = gazeY + u.biasY;
        const k = Math.min(1, dt * (2 + u.lag * 7));
        u.gx += (tgx - u.gx) * k;
        u.gy += (tgy - u.gy) * k;
        p.position.set(u.base.x + u.gx * u.size * 0.4, u.base.y + u.gy * u.size * 0.4, u.base.z + u.size * 0.62);
      }
    }
  }

  const muzzle = new THREE.Object3D();
  muzzle.name = 'unmaskedMuzzle';
  muzzle.position.set(0, 0, EYE_Z + 0.9);
  group.add(muzzle);

  return {
    group, muzzle, orbiters,
    setDissolve: setDissolveEmotive,
    setCharge,
    setGaze,
    notice,
    setDebugStage,
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible,
    shatterShield: kit.shatterShield,
    flash: flinchFlash,
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    },
  };
}
