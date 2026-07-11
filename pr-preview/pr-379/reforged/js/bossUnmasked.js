import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { mulberry32 } from './util.js';
import { createBossCommon, stripForMerge } from './bossKit.js';
import { buildAngelWing } from './angelWing.js';   // the owner's merged, signed-off angel wing (do NOT rebuild)

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

  // ── THE CRACK SEAMS (S1→S2 transition): jagged hot fractures that spider across the black
  // disc as the mask breaks open — the "it made the masks" rite (the Voidmaw rhyme). Additive
  // gold-white polylines from near the pupil to the rim, HOT at the core → dark at the tip so
  // they read as splitting light bleeding through, not drawn lines. Hidden (opacity 0) until
  // setStageMorph drives them; they ride `stage1`, so they collapse away with the mask. ──
  // Built as TAPERED QUADS (not LineSegments — WebGL draws lines at a fixed 1px, too thin to
  // glow at fight distance): each bolt segment is a ribbon that is WIDE + hot at the core and
  // narrows + darkens to the rim, so additive blending reads it as splitting light.
  const crackMat = track(new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  crackMat.toneMapped = false;
  const crackHot = new THREE.Color(accent).lerp(new THREE.Color(0xffffff), 0.5);
  // SEPARATE RNG stream (determinism): the crack jitter must NOT consume the main `rnd`
  // stream, or every seeded draw built after it (the stage-2 pupil biases, the scar) shifts —
  // adding this geometry would silently move the shipped seraph. A private seed keeps `rnd`
  // (and therefore stage 2) byte-for-byte unchanged.
  const crnd = mulberry32(0x1ceb00d);
  const crackPos = [], crackCol = [], crackIdx = [];
  const NCRACKS = lowQ ? 6 : 9;
  let cv = 0;   // running vertex count
  for (let c = 0; c < NCRACKS; c++) {
    let ang = (c / NCRACKS) * TAU + (crnd() - 0.5) * 0.5;
    let r = 0.3, px = Math.cos(ang) * r, py = Math.sin(ang) * r, pb = 1;
    const segs = 3 + (crnd() * 3 | 0);
    for (let s = 0; s < segs; s++) {
      ang += (crnd() - 0.5) * 0.9;                                  // jitter the heading → a forked bolt
      r = Math.min(DISC_R * 0.98, r + (DISC_R - 0.3) / segs * (0.7 + crnd() * 0.6));
      const nx = Math.cos(ang) * r, ny = Math.sin(ang) * r, nb = Math.max(0, 1 - r / DISC_R);
      const dx = nx - px, dy = ny - py, dl = Math.hypot(dx, dy) || 1;
      const ox = -dy / dl, oy = dx / dl;                            // unit perpendicular to the segment
      const wp = 0.03 + 0.14 * pb, wn = 0.03 + 0.14 * nb;           // half-width tapers with brightness
      crackPos.push(px + ox * wp, py + oy * wp, DISC_Z + 0.06, px - ox * wp, py - oy * wp, DISC_Z + 0.06,
        nx + ox * wn, ny + oy * wn, DISC_Z + 0.06, nx - ox * wn, ny - oy * wn, DISC_Z + 0.06);
      for (const b of [pb, pb, nb, nb]) crackCol.push(crackHot.r * b, crackHot.g * b, crackHot.b * b);
      crackIdx.push(cv, cv + 1, cv + 2, cv + 1, cv + 3, cv + 2);
      cv += 4;
      px = nx; py = ny; pb = nb;
    }
  }
  const crackGeo = new THREE.BufferGeometry();
  crackGeo.setAttribute('position', new THREE.Float32BufferAttribute(crackPos, 3));
  crackGeo.setAttribute('color', new THREE.Float32BufferAttribute(crackCol, 3));
  crackGeo.setIndex(crackIdx);
  const cracks = new THREE.Mesh(crackGeo, crackMat);
  cracks.name = 'crackSeams';
  stage1.add(cracks);

  // ── LANCE ORGANS (rung 14): the two paintable WOUND anchors on the crack seams (§lance CP1).
  // Empty Object3Ds seated at INNER crack-fork points (r≈1.9, well inside the DISC_R·0.98≈4.6 rim)
  // so at scale 2.4 they stay comfort-legal — world |x|≤~9.4, y≈14 across the station sway (the
  // rim tips at r 4.3 would fly the reticle to |x|>10.4). They ride `stage1`, so they collapse away
  // with the mask at the S1→S2 crack (phase-gated to [0] in the def; painted only in stage 1). The
  // brand pop + shimmer render on them; the cracks read as the wound the lance splits wider. ──
  const crackSeamL = new THREE.Object3D();
  crackSeamL.name = 'crackSeamL'; crackSeamL.position.set(-1.85, 0.55, DISC_Z + 0.06); stage1.add(crackSeamL);
  const crackSeamR = new THREE.Object3D();
  crackSeamR.name = 'crackSeamR'; crackSeamR.position.set(1.85, 0.55, DISC_Z + 0.06); stage1.add(crackSeamR);

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

  // ── FEATHER MATERIALS — a near-black VALUE LADDER + a painted moon-rim (Fable polish pass). ──
  // The eight wings share one flat near-black material read as ONE blob on the night sky (the
  // z-stagger was invisible). Fix: a per-wing base VALUE LADDER — the nearest/upper wing a step
  // lighter, the deepest a step darker (atmospheric depth faked in value) — so the shingled fan
  // reads. And a PAINTED MOON-RIM: the flight feathers (outer fan / leading edge) get a lighter
  // cool-steel value so the near-black silhouette + feather separation read on a dark sky, WITHOUT
  // a real back-light (which can't rim a flat card facing the camera). Interiors stay near-black →
  // no ominousness lost; the eyes are still the only emissive family. All tracked for dissolve.
  const LADDER = { upper: 0x484852, uppermid: 0x424250, upmid: 0x424250, middle: 0x3a3a44, lowermid: 0x343440, lower: 0x30303a };
  const baseMats = {};
  for (const k of Object.keys(LADDER)) baseMats[k] = track(new THREE.MeshStandardMaterial({ color: LADDER[k], roughness: 1.0, metalness: 0.0, side: THREE.DoubleSide }));
  const rimMat = track(new THREE.MeshStandardMaterial({ color: 0x5b6472, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide }));   // cool moonlit steel — the leading-edge rim
  const rimMatB = track(new THREE.MeshStandardMaterial({ color: 0x474e5a, roughness: 0.98, metalness: 0.0, side: THREE.DoubleSide }));  // a step DARKER — the alternate primary + secondary rank, so the outer fan reads as separate fingers (Fable P5, interior feather-rank shading)

  // ── THE CENTRAL STARBURST is RESERVED FOR STAGE 3 (owner: "use this type of eye for the third
  // form"). Stage 2 goes back to the ORIGINAL focal almond eye (below) — no radiant star here.
  // The small-almond + gold-starburst "star-eye" belongs to the unveiling (S3), not this form. ──

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
  const irisMat = track(new THREE.MeshBasicMaterial({ color: 0x7a5c26 }));      // GOLD iris (lifted so it survives fight distance + rhymes with the focal eye → sets up S3)
  const s2pupilMat = track(new THREE.MeshBasicMaterial({ color: 0x040302 }));   // DARK pupil (smaller — the eyeball shows around it)
  s2pupilMat.toneMapped = false;
  const catchMat = track(new THREE.MeshBasicMaterial({ color: 0xfff6e6 }));     // a small proud glint (NOT a headlight — a hair over white so it reads wet without blooming)
  catchMat.toneMapped = false;
  catchMat.color.multiplyScalar(2.4);
  const sockets = [], sclerae = [], irises = [], catchlights = [], pupils = [];
  const eyePlace = (local, size, lid = 0) => {
    // HALF-LID = a SQUINT, not a cap. A dark lid-cap on a dark feather just read as a floating
    // blob (no "skin" behind it to be the lid). Instead a lidded eye is a FLATTER eyeball — the
    // whole eye (sclera/iris/pupil) squashes vertically by `openF` — which reads as heavy-lidded
    // without any added geometry. lid 0 → openF 1 → the full round eye, unchanged.
    const openF = 1 - lid * 0.85;
    // socket (thin recessed rim, pushed back — just enough to seat the eye). Lean segment
    // counts: the eyes are small at fight distance + there are ~20 of them (tri budget).
    const sk = new THREE.SphereGeometry(size * 1.1, lowQ ? 6 : 9, lowQ ? 4 : 6);
    sk.scale(1.2, 0.96 * openF, 0.34); sk.translate(local.x, local.y, local.z - size * 0.22);
    sockets.push(stripForMerge(sk));
    // sclera (flattened PALE eyeball)
    const sc = new THREE.SphereGeometry(size, lowQ ? 7 : 10, lowQ ? 5 : 7);
    sc.scale(1.4, 0.72 * openF, 0.42); sc.translate(local.x, local.y, local.z);   // wider + flatter → an ALMOND/lens; openF squints a lidded eye
    sclerae.push(stripForMerge(sc));
    // iris (a gold ring showing around the pupil, on the pale sclera) — widened so the gold
    // survives fight distance (Fable: the wing eyes read as bone-almonds with a black dot).
    const ir = new THREE.CircleGeometry(size * 0.66, lowQ ? 9 : 13);
    ir.scale(1, openF, 1); ir.translate(local.x, local.y, local.z + size * 0.3);
    irises.push(stripForMerge(ir));
    // catchlight (small proud glint, up-left) — sits where the pupil rests at the snap
    const cl = new THREE.SphereGeometry(size * 0.1, 5, 4);
    cl.translate(local.x - size * 0.28, local.y + size * 0.32 * openF, local.z + size * 0.6);
    catchlights.push(stripForMerge(cl));
    // pupil (tracks; smaller so the eyeball reads around it — not a hole)
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(size * 0.5, lowQ ? 6 : 8, lowQ ? 5 : 6), s2pupilMat);
    pupil.scale.set(1, openF, 0.55);
    const bx = (rnd() - 0.5) * 0.55, by = (rnd() - 0.5) * 0.45;
    pupil.userData = { base: local.clone(), size, biasX: bx, biasY: by, lag: 0.2 + rnd() * 0.6, gx: bx, gy: by, openF };
    pupil.position.set(local.x + bx * size * 0.4, local.y + by * size * 0.4 * openF, local.z + size * 0.62);
    stage2.add(pupil);
    pupils.push(pupil);
  };
  // ── THE SIX WINGS — three MIRROR PAIRS of the owner's merged angel wing (buildAngelWing),
  // rooted near the central eye: UPPER pair swept UP, MIDDLE pair swept OUT (largest), LOWER
  // pair swept DOWN — the canonical seraph six (§5b/§5d). BILATERAL mirror via scale.x=-1,
  // NEVER radial (a radial ring read as a wheel — the original failure). The wing is built in
  // its own XY plane sweeping up-and-out; each pair's shoulder pivot rotates it to its sweep
  // and roots it beside the eye. ──
  // EMBLEM ARRANGEMENT (A/B variant, owner ref IMG_7411): all six wings EMANATE FROM ONE small
  // central HUB (0,0) — three mirror pairs fanning out: UPPER up (tallest), MIDDLE out (widest),
  // LOWER down-and-out. Big + overlapping → a dense heart/mandorla filling the frame. Bilateral
  // mirror (scale.x flip). The old spider read is avoided by a TINY central jewel-eye (not a
  // body) + dense overlap, not by banning the hub. Each pair carries its root-eye ring position.
  // FIVE pairs (10 wings) for a DENSE mandorla — the first palm-tree read came from FOUR
  // sickles fanned as spokes with a wide (~0.9 rad) angular gap between the middle and the
  // drooping lower pair. TWO fill pairs (uppermid + lowermid) close those gaps so the wings
  // OVERLAP into ONE cohesive heart, not a radial star. Angular spacing tightened to ~0.5 rad
  // and the lower pair un-drooped (−0.95, not −1.55) so the bottom of the mandorla is FULL,
  // not a thin droop. Scale bumped so adjacent wings overlap; z compressed for a flat shingled
  // emblem. Root eyes only on the three canonical pairs (upper/middle/lower) → 6 root + 1
  // central = 7 eyes clustered tight at the core (the two fill pairs carry no eye).
  // ── BILATERAL 4-WINGS-PER-SIDE (8 total), a MIRRORED CARD-FAN — NOT a radial rosette (owner
  // r-spec). Each side is a hand of four wings graduated from near-vertical to drooping-down,
  // ALL rooted inside ONE tight central knot (radius ≈1 vs a ≈10-unit wingspan). Feather
  // outbound direction φ (from horizontal, +=up) ≈ 60° + rotZ·57°:
  //   wing 1 (upper)  φ≈78°  — longest, curling outboard at the tip
  //   wing 2 (upmid)  φ≈45°  — slightly shorter
  //   wing 3 (middle) φ≈12°  — shorter still
  //   wing 4 (lower)  φ≈−20° — droops down-and-out, shortest
  // ROOTS march up a short vertical shoulder-stack inside the knot (`off`: wing 4 lowest → wing 1
  // highest, all within radius ~1), so they don't pin to one pixel but stay a tight knot — the
  // knot is the body. Z-STAGGER ~0.15/wing (`z`): the upper wing is NEAREST, each overlaps and
  // occludes the one below → reads LAYERED, not flat-splayed. Mirror the whole side via scale.x
  // flip (left tips up-left, right tips up-right). ONE root eye per wing (`rootEye`), placed just
  // OUTBOARD of the knot on the wing membrane (marching up the fan, NOT pooled at the bottom).
  // FAN ROTATED ~18° OUTWARD about the hub (owner r-spec): the right side clockwise, the left
  // mirrors it — so a clear VERTICAL CHANNEL of empty space runs up the top-centre AND down the
  // bottom-centre, with the star-hub sitting ALONE in that channel. Acceptance rule enforced by
  // the outbound directions φ (≈ 60° + rotZ·57°): topmost φ≈60° (leans AWAY from vertical, ≥15°
  // clear of straight-up), lowest φ≈−38° (out-and-down, ≥40° clear of straight-down — never
  // straight down across the centreline). Every wing stays in its own side's hemisphere (shoulder
  // x>0), biased up-and-out; the shoulder-stack is pushed outboard (x≈0.45) to widen the channel.
  const WING_PAIRS = [
    { key: 'upper',  rotZ: -0.12, scale: 1.72, z: -0.20, phase: 0.0, amp: 0.026, off: { x: 0.45, y: 0.35 } },  // slid DOWN a touch — the top pair sat a bit high vs the others (owner)
    { key: 'upmid',  rotZ: -0.57, scale: 1.52, z: -0.35, phase: 0.7, amp: 0.030, off: { x: 0.45, y: 0.26 } },  // φ≈27°
    { key: 'middle', rotZ: -0.88, scale: 1.32, z: -0.50, phase: 1.4, amp: 0.036, off: { x: 0.45, y: 0.02 } }, // out, ~horizontal — lifted so it stays DISTINCT from the lowest wing
    { key: 'lower',  rotZ: -1.20, scale: 1.12, z: -0.65, phase: 2.1, amp: 0.030, off: { x: 0.48, y: -0.42 } },// out-and-slightly-down (~−25°) — the distinct lowest wing
  ];
  // CHARGE MANTLE-FLARE sign per wing (right-side convention; ×side in the tick mirrors it): on
  // charge the fan OPENS — the upper pair lifts toward vertical (+), the lower pair sweeps
  // down-and-out (−), the middle holds — so the mandorla WIDENS as the wrath gathers, then
  // settles back at rest (charge 0 → zero flare → the signed-off idle is byte-identical).
  const FLARE_SIGN = { upper: 1.0, upmid: 0.45, middle: -0.3, lower: -1.0 };
  const shoulders = [];
  // DE-CLUMP: no two eye SCLERAS may overlap at front-on (a figure-8 / double-pupil blob reads
  // as a rendering bug). Nudge each new eye out of any earlier eye it overlaps IN THE SAME
  // Z-BAND (eyes at clearly different depths may overlap — they read as stacked, not fused).
  const placedEyes = [];
  const declump = (pos, r) => {
    for (let it = 0; it < 8; it++) {
      let moved = false;
      for (const p of placedEyes) {
        if (Math.abs(pos.z - p.z) > 0.55) continue;
        const dx = pos.x - p.x, dy = pos.y - p.y;
        const d = Math.hypot(dx, dy), min = (r + p.r) * 1.08;
        if (d < min) {
          const push = (min - d) + 0.04;
          const nx = d > 1e-3 ? dx / d : 1, ny = d > 1e-3 ? dy / d : 0.3;
          pos.x += nx * push; pos.y += ny * push; moved = true;
        }
      }
      if (!moved) break;
    }
    placedEyes.push({ x: pos.x, y: pos.y, z: pos.z, r });
    return pos;
  };
  for (const P of WING_PAIRS) {
    for (const side of [1, -1]) {
      const pivot = new THREE.Object3D();
      pivot.name = `wing_${P.key}_${side > 0 ? 'R' : 'L'}`;
      // THE ONE SCAR WING (§3.6): the lower-LEFT hangs a touch off its mirror.
      const scar = (P.key === 'lower' && side < 0) ? 0.09 : 0;
      const baseRotZ = (side > 0 ? P.rotZ : -P.rotZ) + (side < 0 ? scar : 0);
      pivot.rotation.z = baseRotZ;
      pivot.scale.set(side > 0 ? P.scale : -P.scale, P.scale, P.scale);   // bilateral mirror (scale.x flip)
      pivot.position.set(side > 0 ? P.off.x : -P.off.x, P.off.y, P.z);   // shoulder on a small central RING → open core
      // Wings at REDUCED quality (×6 full-detail wings blow the tri budget). ×0.45 scales the
      // feather curve segments down (and with boss quality → q0.5 halves again).
      pivot.add(buildAngelWing({ quality: quality * 0.40, material: baseMats[P.key] || baseMats.middle, rimMaterial: rimMat, rimMaterialB: rimMatB, blade: 0.78 }).group);   // per-wing value ladder + painted moon-rim (two tiers → the fan fingers separate)
      stage2.add(pivot);
      pivot.updateMatrix();
      shoulders.push({ obj: pivot, baseRotZ, phase: P.phase + (side < 0 ? 0.6 : 0), amp: P.amp, flareZ: side * (FLARE_SIGN[P.key] || 0) });
      // ONE small almond eye per wing — 4 per side, 8 total (+ central = 9). Seated OUT at the
      // wing's ELBOW / where the primary fan starts (on the leading edge) — NOT pooled at the
      // central root cord (owner r-fix). The wing-local elbow point is pushed through THIS wing's
      // own transform (scale → rotate → offset) so each eye rides its own wing out to the elbow.
      // A couple are half-lidded (the upmid pair + the lower-left) so the field varies.
      {
        const ELx = 0.7, ELy = 3.5;                                   // wing-local: the wrist/elbow, base of the primary fan
        const sx = (side > 0 ? P.scale : -P.scale) * ELx, sy = P.scale * ELy;
        const c = Math.cos(baseRotZ), s = Math.sin(baseRotZ);
        const p = new THREE.Vector3(
          (side > 0 ? P.off.x : -P.off.x) + c * sx - s * sy,
          P.off.y + s * sx + c * sy,
          0.7,
        );
        declump(p, 0.40);
        const lid = (P.key === 'upmid') ? 0.42 : (P.key === 'lower' && side < 0) ? 0.32 : 0;
        eyePlace(p, 0.28, lid);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 2 LANCE ORGANS (rung 14) — SIX CURATED WATCHER EYES + FIVE RELICS + wingRoots.
  // §lance CP1: the eight VISIBLE wing eyes sit at the wing ELBOWS (wing-local (0.7,3.5)),
  // which at scale 2.4 land OUT of the comfort lane (upper pair world-Y ~28; lower/middle
  // |x|>10.4 even at zero sway) — the ONEWING out-of-lane trap across a whole organ family.
  // The fix is AUTHORING, not curation: six NEW inner-covert eyes at comfort-legal stage2-local
  // seeds (three mirror pairs), parented to `stage2` DIRECTLY (not the wing pivots — a pivot child
  // would drift off its eye under the breath/mantle-flare). Verified world worst-case (station
  // sway ±5.2, roll-wobble y→x coupling): |x|≤~9.5, y 11.4..19.3 — all inside 10.4 / 22. They ride
  // the all-snap for free (eyePlace registers each pupil in `pupils[]`). ──
  const wingEyeSeeds = [
    { x: 1.57, y: 2.27, lid: 0.0 },   // upper pair
    { x: 1.72, y: 0.56, lid: 0.0 },   // middle pair
    { x: 1.65, y: -0.33, lid: 0.30 }, // lower pair (a squint — the field varies)
  ];
  const wingEyeAnchors = [];
  let weN = 0;
  for (const seed of wingEyeSeeds) {
    for (const side of [1, -1]) {
      const p = new THREE.Vector3(side * seed.x, seed.y, 0.72);   // just proud of the wing membrane (z≈0.7 like the elbow eyes)
      eyePlace(p, 0.30, seed.lid);   // a curated watcher eye — a hair larger than the elbow eyes so the six read
      const a = new THREE.Object3D();
      a.name = `wingEye${weN}`;
      a.position.copy(p);
      stage2.add(a);
      wingEyeAnchors.push(a);
      weN++;
    }
  }

  // ── THE FIVE RELICS — every earlier scar worn as a trophy, wired at the reliquary knot below
  // the great eye (the KARNVOW trophy lesson; §5b row 14 "every prior scar worn as a relic").
  // Small dark trophies with the SOURCE boss's palette in emissive only (§3 law 8 — satellites
  // stay dark; the palette is the attribution, not a bulb). They are comfort-trivial (clustered at
  // stage2-local |x|≤1.8, y∈[−1.9,−0.2] → world well inside the lane). Paintable lockParts (phase
  // [1]); branding one flashes its palette (setBrandedRelics / the RECKONING). Their names ARE the
  // partWorldPos anchors — no separate empty. NON-destructible (they are anchors, not cracking
  // organs) so THE RECKONING can never be locked out by a relic dying unbranded (§CP1 finding 2).
  const relicSpecs = [
    { name: 'relicHorn',  boss: 'VOIDMAW',    palette: 0x9a6cff, pos: [-1.45, -1.15, 0.5] },  // the broken horn (violet)
    { name: 'relicBlade', boss: 'ASHTALON',   palette: 0xff6a30, pos: [1.45, -1.15, 0.5] },   // the snapped scythe-blade (ember)
    { name: 'relicLink',  boss: 'BRINEHOLM',  palette: 0x6fd0c0, pos: [-1.75, -0.15, 0.45] }, // the chain link (abalone)
    { name: 'relicSpool', boss: 'WEFTWITCH',  palette: 0xe6d79a, pos: [1.75, -0.15, 0.45] },  // the thread spool (pale gold)
    { name: 'relicShard', boss: 'KNELLGRAVE', palette: 0xd8862e, pos: [0.0, -1.85, 0.55] },   // the bell shard (patina copper)
  ];
  const relicBodyMat = () => track(new THREE.MeshStandardMaterial({ color: 0x0d0c10, roughness: 1.0, metalness: 0.0, flatShading: true }));
  const relicGlowMat = (palette) => {
    const m = track(new THREE.MeshBasicMaterial({ color: new THREE.Color(palette) }));
    m.toneMapped = false;
    return m;
  };
  // Per-relic minimal trophy silhouette (recognizable at the reliquary, detail-tier near centre).
  // §3-LAW-8 SANCTIONED EXCEPTION (§CP2 finding 3): satellites normally stay dark (emissive ≤0.25),
  // but the five relics are the RECKONING's COLLECTIBLES — they must self-present as findable trophies
  // precisely because they are shimmerExclude'd from the organ pick-menu (else stage 2's 12 paintables
  // starve the 8-slot pool). Kept SMALL, NON-additive (no overdraw), and dim enough that the great eye
  // stays the one focal; the owner judges the bulb-field risk on the preview. Their palettes are the
  // source bosses' (attribution), all clear of the reserved role colours (danger magenta, parry amber).
  const buildRelic = (spec, idx) => {
    const g = new THREE.Group();
    g.name = spec.name;
    g.position.set(...spec.pos);
    const body = relicBodyMat();
    const glow = relicGlowMat(spec.palette);
    let shape, accent;
    if (spec.name === 'relicHorn') {           // a curved broken horn
      shape = new THREE.Mesh(stripForMerge(new THREE.ConeGeometry(0.16, 0.7, lowQ ? 5 : 7)), body);
      shape.rotation.z = 0.5; shape.scale.set(1, 1, 0.7);
      accent = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), glow); accent.position.set(0.08, 0.34, 0.06);   // the ember at the break
    } else if (spec.name === 'relicBlade') {   // a thin snapped scythe-blade
      shape = new THREE.Mesh(stripForMerge(new THREE.ConeGeometry(0.13, 0.72, 3)), body);
      shape.rotation.z = -0.9; shape.scale.set(0.5, 1, 0.32);
      accent = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.02), glow); accent.rotation.z = -0.9; accent.position.set(0, 0.02, 0.08);  // the molten edge-slit
    } else if (spec.name === 'relicLink') {    // a chain link
      shape = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, lowQ ? 5 : 7, lowQ ? 10 : 14), body);
      shape.scale.set(0.8, 1, 0.5);
      accent = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, lowQ ? 10 : 14), glow); accent.scale.set(0.8, 1, 0.5);
    } else if (spec.name === 'relicSpool') {   // a thread spool
      shape = new THREE.Mesh(stripForMerge(new THREE.CylinderGeometry(0.14, 0.14, 0.34, lowQ ? 7 : 10)), body);
      shape.scale.set(1, 1, 0.7);
      accent = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.06, lowQ ? 7 : 10), glow); accent.scale.set(1, 1, 0.7);  // the wound thread band
    } else {                                    // relicShard — a jagged bell shard
      shape = new THREE.Mesh(stripForMerge(new THREE.TetrahedronGeometry(0.32, 0)), body);
      shape.scale.set(0.8, 1.1, 0.4); shape.rotation.set(0.4, 0.6, 0.3);
      accent = new THREE.Mesh(new THREE.TetrahedronGeometry(0.13, 0), glow); accent.position.set(0.04, 0.08, 0.1);   // the candle-glint through the crack
    }
    g.add(shape); g.add(accent);
    stage2.add(g);
    // baseHot 0.45 (a dim trophy glow, not a headlight); phase = the relic index so the five pulses
    // stagger cleanly (§CP2 finding 6 — a frozen weN made two pairs nearly sync).
    return { name: spec.name, group: g, glow, palette: new THREE.Color(spec.palette), baseHot: 0.45, flash: 0, branded: false, phase: idx * 1.3 };
  };
  const relics = relicSpecs.map((spec, i) => buildRelic(spec, i));

  // ── wingRootL/R — the STAGE 3 relic-root paint anchors (§5b "wired to the wing-roots"). Empties
  // on `stage2` (which stays visible in stage 3 — the mantled seraph) just off the central knot,
  // comfort-trivial. They are the stage-3 dwell organs (phase-gated [2]); the star-eye / halo stay
  // PURE PRESENTATION (they sit at the centre, coincident with the virtual focalEye aim anchor —
  // painting them would double a target on one pixel; §CP1 finding 7). ──
  const wingRootL = new THREE.Object3D();
  wingRootL.name = 'wingRootL'; wingRootL.position.set(-1.25, -0.55, 0.2); stage2.add(wingRootL);
  const wingRootR = new THREE.Object3D();
  wingRootR.name = 'wingRootR'; wingRootR.position.set(1.25, -0.55, 0.2); stage2.add(wingRootR);

  // ── THE KNOT (the body) — a small, dark, flattened core at the convergence, HALF-BURIED behind
  // the eight wing roots (owner r-spec): it fills the tight central knot so no sky shows between
  // the roots and gives the wings a body to spring from. Small (radius ~0.9), dark — NOT a big orb.
  const knotMat = track(new THREE.MeshStandardMaterial({ color: 0x1b1b24, roughness: 1.0, metalness: 0.0 }));
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.92, lowQ ? 8 : 12, lowQ ? 6 : 9), knotMat);
  knot.scale.set(1.05, 1.18, 0.5); knot.position.set(0, 0, -0.28);   // flattened, seated among the wing roots
  knot.name = 'knotBody'; stage2.add(knot);

  // ── THE FOCAL EYE — the ORIGINAL great almond (owner: "go back to the original eye for this
  // form"): the L142 real-eye rig at focal scale — pale sclera, gold iris, dark pupil, proud
  // catchlight. Sized to COVER the wing-root convergence so the central pinch is hidden behind
  // it (owner: all wings sit behind the eye). It renders in front (z≥0); every wing is at z<0. ──
  const GW = 0.9, GH = 0.62, GD = 0.36;   // focal almond — big enough to cap the convergence, not a tiny jewel
  const GF = GD;                          // sclera front-face z (center at 0)
  const GEY = 0.0;                        // ON the centreline AT the knot — the single focal, wrapped in the starburst
  const greatSocket = new THREE.Mesh(new THREE.SphereGeometry(1, lowQ ? 10 : 14, lowQ ? 7 : 9), socketMat);
  greatSocket.scale.set(GW * 1.24, GH * 1.3, 0.5); greatSocket.position.set(0, GEY, -0.18);
  greatSocket.name = 'greatSocket'; stage2.add(greatSocket);
  const greatScleraMat = track(new THREE.MeshBasicMaterial({ color: 0x8f8365 }));   // PALE eyeball value (matches the root eyes) so the almond reads as an EYE, not a black bead
  const greatEye = new THREE.Mesh(new THREE.SphereGeometry(1, lowQ ? 12 : 16, lowQ ? 8 : 10), greatScleraMat);
  greatEye.scale.set(GW, GH, GD); greatEye.position.set(0, GEY, 0);
  greatEye.name = 'greatEye'; stage2.add(greatEye);
  const greatIris = new THREE.Mesh(new THREE.CircleGeometry(1, lowQ ? 12 : 16), irisMat);
  greatIris.scale.set(GW * 0.44, GH * 0.54, 1); greatIris.position.set(0, GEY, GF + 0.03);   // gold iris ring — shaved so more PALE sclera shows (Fable: was leaning grommet)
  greatIris.name = 'greatIris'; stage2.add(greatIris);
  const greatPupil = new THREE.Mesh(new THREE.SphereGeometry(1, lowQ ? 10 : 14, lowQ ? 7 : 9), s2pupilMat);
  greatPupil.scale.set(GW * 0.38, GH * 0.44, 0.5); greatPupil.position.set(0, GEY, GF + 0.08);   // dark pupil — smaller so the PALE sclera rings it (an almond eye, not a black hole)
  greatPupil.name = 'greatPupil'; stage2.add(greatPupil);
  const greatCatch = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), catchMat);
  greatCatch.position.set(-GW * 0.2, GEY + GH * 0.28, GF + 0.35);
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

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 3 — THE UNVEILING (the third form). The seraph's wings MANTLE FULLY OPEN and the
  // veiled core UNVEILS: the plain focal almond gives way to the reserved STAR-EYE (a small
  // almond wrapped in a radiant GOLD STARBURST) with a saint's HALO behind. Tri-lean: it REUSES
  // stage 2's wings + eye-field (they don't duplicate — stage 3 shows the SAME seraph, mantled)
  // and only adds these cheap central motifs, swapping the focal eye for the star-eye. Hidden
  // until setStage3 drives it; the whole group rides `stage3`. ──
  const stage3 = new THREE.Group();
  stage3.name = 'stage3Rig';
  stage3.visible = false;
  rig.add(stage3);

  // THE HALO — a saint's gold nimbus RING behind the core (the reserved corona glow-shape,
  // now a halo). Additive so it reads as light, not a solid band; breathes in the tick.
  const halo3Mat = track(new THREE.MeshBasicMaterial({
    color: accent, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  halo3Mat.toneMapped = false;
  const halo3Geo = new THREE.RingGeometry(2.5, 3.3, lowQ ? 36 : 64);
  halo3Geo.translate(0, 0, -0.9);
  const halo3 = new THREE.Mesh(halo3Geo, halo3Mat);
  halo3.name = 'halo'; stage3.add(halo3);

  // THE STARBURST — a radiant GOLD sunburst of alternating long/short spikes around the star-
  // eye (the reserved emblem). Additive tapered triangles, HOT at the core → dark at the tip so
  // they bloom into rays, not solid blades. `starPivot` spins slowly + pulses in the tick.
  const starPivot = new THREE.Object3D();
  starPivot.name = 'starburst';
  stage3.add(starPivot);
  const burstMat = track(new THREE.MeshBasicMaterial({
    color: accent, vertexColors: true, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  burstMat.toneMapped = false;
  const NSPIKE = lowQ ? 10 : 14;
  const burstPos = [], burstCol = [], burstIdx = [];
  const burstHot = new THREE.Color(accent).lerp(new THREE.Color(0xffffff), 0.35);
  let bv = 0;
  for (let i = 0; i < NSPIKE; i++) {
    const a = (i / NSPIKE) * TAU;
    // Long rays BURST OUTWARD past the halo (r~3.3) so it reads as RADIANCE, not spokes inside a
    // rim (the wheel read the design forbids); alternating short rays keep the star silhouette.
    const len = (i % 2 === 0 ? 5.6 : 2.7);
    const w = 0.11;                                     // slim rays (a sunburst, not fat blades)
    const r0 = 0.5;                                     // spikes start just outside the star-eye
    const tx = Math.cos(a) * (r0 + len), ty = Math.sin(a) * (r0 + len);
    const bax = Math.cos(a - w) * r0, bay = Math.sin(a - w) * r0;
    const bbx = Math.cos(a + w) * r0, bby = Math.sin(a + w) * r0;
    burstPos.push(bax, bay, -0.35, bbx, bby, -0.35, tx, ty, -0.35);
    burstCol.push(burstHot.r, burstHot.g, burstHot.b, burstHot.r, burstHot.g, burstHot.b, 0, 0, 0);   // hot base → black tip
    burstIdx.push(bv, bv + 1, bv + 2); bv += 3;
  }
  const burstGeo = new THREE.BufferGeometry();
  burstGeo.setAttribute('position', new THREE.Float32BufferAttribute(burstPos, 3));
  burstGeo.setAttribute('color', new THREE.Float32BufferAttribute(burstCol, 3));
  burstGeo.setIndex(burstIdx);
  starPivot.add(new THREE.Mesh(burstGeo, burstMat));

  // THE STAR-EYE — a SMALL almond at the very centre (the L142 real-eye rig, reusing the eye-
  // field materials so it adds no draws): pale sclera, gold iris, dark pupil (tracks), catchlight.
  const SW = 0.5, SH = 0.34, SD = 0.22;
  const starSocket = new THREE.Mesh(new THREE.SphereGeometry(1, lowQ ? 8 : 12, lowQ ? 6 : 8), socketMat);
  starSocket.scale.set(SW * 1.3, SH * 1.35, 0.4); starSocket.position.set(0, 0, -0.12);
  stage3.add(starSocket);
  const starEye = new THREE.Mesh(new THREE.SphereGeometry(1, lowQ ? 10 : 14, lowQ ? 7 : 9), greatScleraMat);
  starEye.scale.set(SW, SH, SD); starEye.position.set(0, 0, 0.05);
  starEye.name = 'starEye'; stage3.add(starEye);
  const starIris = new THREE.Mesh(new THREE.CircleGeometry(1, lowQ ? 12 : 16), irisMat);
  starIris.scale.set(SW * 0.5, SH * 0.6, 1); starIris.position.set(0, 0, SD + 0.06);
  stage3.add(starIris);
  const starPupil = new THREE.Mesh(new THREE.SphereGeometry(1, lowQ ? 8 : 12, lowQ ? 6 : 8), s2pupilMat);
  starPupil.scale.set(SW * 0.42, SH * 0.5, 0.4); starPupil.position.set(0, 0, SD + 0.1);
  stage3.add(starPupil);
  const starCatch = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), catchMat);
  starCatch.position.set(-SW * 0.22, SH * 0.3, SD + 0.24);
  stage3.add(starCatch);
  // The stage-2 focal-eye parts that the star-eye REPLACES at the unveiling (hidden by setStage3).
  const focalParts = [greatSocket, greatEye, greatIris, greatPupil, greatCatch];

  // ── RELICS (§8) are RESERVED FOR CP2 — the placeholder gold quill-glints read as stray
  // hairline slivers near the centre (Fable polish). CP2 builds the real 5-trophies-+-1-empty
  // destructible relics with their per-relic palette + destroy→sag behaviour; no seed here. ──

  kit.flashBind(lidMat, 0.0);
  kit.finalize();

  // ── THE S1→S2 CRACK TRANSITION ── the eclipse mask CRACKS open and the seraph BLOOMS out
  // of the collapsing sun. One eased driver `setStageMorph(k)`: k 0 = full stage 1 (the second
  // sun) → k 1 = full stage 2 (the seraph). Both sub-rigs live during the morph; the read is
  // coherent because each rig scales as a WHOLE (no per-part detachment — the eyes ride their
  // stage-2 group as it blooms, the cracks/corona ride stage-1 as it collapses). At k 0 and
  // k 1 every driven value returns to the shipped pose byte-for-byte (verified). CP2 drives k
  // over the phase seam; the studio 'morph' dial + the stage selector drive it for playtest. ──
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let coronaFlare = 0;   // corona destabilises (flares) as the sun cracks, read in tickBody
  let stageMorph = 0;
  function setStageMorph(k) {
    stageMorph = Math.max(0, Math.min(1, k));
    const m = stageMorph;
    stage1.visible = m < 0.995;
    stage2.visible = m > 0.005;
    // The eclipse mask (disc + corona + hood + cracks) COLLAPSES toward the centre as it opens.
    stage1.scale.setScalar(Math.max(1e-4, 1 - smooth(0.35, 0.72, m)));
    // The CRACKS spider across the disc — peak mid-crack, gone once the mask is consumed.
    crackMat.opacity = Math.sin(Math.PI * Math.min(1, m / 0.72)) * 0.9;
    // The corona FLARES as the sun destabilises, then dies with the collapse (added in tickBody).
    coronaFlare = smooth(0.05, 0.4, m) * (1 - smooth(0.4, 0.72, m));
    // The seraph BLOOMS out of the collapsing sun — scales up from behind the disc so it is
    // REVEALED (occlusion, not a fade) as the mask shrinks off it. Full at k 1 (= shipped).
    stage2.scale.setScalar(0.2 + 0.8 * smooth(0.4, 1.0, m));
  }

  // ── THE S2→S3 UNVEILING ── the seraph's core opens: the plain focal eye gives way to the
  // STAR-EYE + STARBURST, the HALO kindles behind, and the wings MANTLE FULLY OPEN. One eased
  // driver `setStage3(k3)`: k3 0 = the plain seraph (stage 2) → k3 1 = the unveiled third form.
  // stage 2's wings + eye-field stay (the SAME seraph, mantled — read in tickBody); only the
  // centre swaps. k3 0 hides stage 3 + shows the focal eye → stage 2 is byte-identical. ──
  let stage3K = 0;
  function setStage3(k) {
    stage3K = Math.max(0, Math.min(1, k));
    const k3 = stage3K;
    stage3.visible = k3 > 0.005;
    stage3.scale.setScalar(0.55 + 0.45 * smooth(0, 1, k3));   // the star-eye + burst + halo bloom open
    burstMat.opacity = smooth(0.15, 1.0, k3) * 0.95;
    halo3Mat.opacity = smooth(0.25, 1.0, k3) * 0.7;
    // The focal almond RECEDES as the star-eye takes the centre (crossfade by visibility at the
    // half — the star-eye is fully bloomed by then so there is no empty-centre frame).
    for (const e of focalParts) e.visible = k3 < 0.5;
  }

  // Stage select (CP2 wires this to the phase machine; for now a debug/gate hook). A discrete
  // stage pick maps to the driver endpoints — 1 → the eclipse (morph 0), 2 → the seraph
  // (morph 1, unveiling 0), 3 → the unveiled third form (morph 1, unveiling 1). The stage
  // selector uses this; the transitions themselves are setStageMorph / setStage3.
  // ── THE LIVE STAGE MACHINE (boss.js calls model.setPhase on every phase advance): the fight
  // ANIMATES the transition INTO the new phase's stage — phase 1 plays the S1→S2 CRACK, phase 2
  // plays the S2→S3 UNVEILING. `transKind` names the running transition, `transT` eases 0→1 over
  // TRANS_DUR (advanced in tickBody). ──
  const TRANS_DUR = 2.0;
  let transKind = null, transT = 0;
  let stageN = 1;
  function setDebugStage(n) {
    transKind = null;   // a hard stage-set is a CUT — cancel any running transition (also the SKIP path)
    stageN = n;
    setStageMorph(n == null || n <= 1 ? 0 : 1);
    setStage3(n >= 3 ? 1 : 0);
  }

  function setPhase(n) {
    if (n === 1) { transKind = 'crack'; transT = 0; }        // S1 → S2: the mask cracks, the seraph blooms
    else if (n === 2) { transKind = 'unveil'; transT = 0; }  // S2 → S3: the core unveils, the wings mantle full
  }

  // WING-DESIGN ISOLATION: strip EVERYTHING but a single wing so the wing SILHOUETTE can be
  // designed on its own (the owner's directive — get the wing right first, then re-add eyes).
  const nonWing = [socketMesh, scleraMesh, irisMesh, catchMesh, greatSocket, greatEye, greatIris, greatPupil, greatCatch, knot];
  function setDebugWing(on) {
    stage1.visible = on ? false : (stageN == null || stageN === 1);
    stage2.visible = on ? true : (stageN === 2);
    for (const m of nonWing) if (m) m.visible = !on;
    for (const p of pupils) p.visible = !on;
    for (const s of shoulders) {
      const keep = s.obj.name === 'wing_middle_R';
      s.obj.visible = on ? keep : true;
      if (on && keep) { s.obj.position.set(0, -3.5, 0); s.obj.rotation.set(0, 0, 0); }   // centre the lone wing for design
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ANIMATION / STATE
  // ──────────────────────────────────────────────────────────────────────────
  const DANGER = new THREE.Color(0xff2b6a);
  const _c = new THREE.Color();
  // Base eye-field values captured so the wrath tell + snap flare lerp FROM the signed-off
  // resting colours and return to them exactly (irisMat paints BOTH the ~9 peripheral irises
  // and the great iris; catchMat paints every catchlight + the great catch — one lerp does the
  // whole field, which is the point: the eyes go wrathful as ONE being).
  const IRIS_BASE = irisMat.color.clone();
  const CATCH_BASE = catchMat.color.clone();

  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }

  // ── THE ALL-SNAP (§4b DEATH-of-doubt reveal / the screenshot of the game): every eye across
  // the wings + the great eye abandons its own idle wander and LOCKS dead-on the player at once,
  // the catchlights flare hot, and the wings freeze mid-breath — a held, total stare. Triggered
  // by the fight machine (CP2) at the phase turn; `snapT` is the hold, `snapK` the eased weight.
  let snapT = 0, snapK = 0;
  function allSnap(hold = 0.8) { snapT = Math.max(snapT, hold); saccadeT = 0; }

  // ── THE RECKONING relic presentation (rung 14): an UNBRANDED relic breathes a dim palette pulse
  // (the "brand me" read — they are the reliquary's collectibles); branding one FLASHES its source
  // boss's palette hot (the attribution beat) then settles to a steady claimed glow. Driven by
  // setBrandedRelics(list) from boss.js's lockPaint listener (the setBrandedFeatures precedent).
  // Pure presentation — the gameplay is the paint/RECKONING flag in boss.js. ──
  function setBrandedRelics(branded) {
    if (!branded) return;
    for (const r of relics) {
      const on = branded.includes(r.name);
      if (on && !r.branded) r.flash = 1;   // just took the brand → flare its palette
      r.branded = on;
    }
  }

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

    // ── Advance any running STAGE TRANSITION (the live phase machine): ease transT 0→1 and
    // drive the matching morph. The all-snap punctuates each arrival (every eye locks as the
    // new form settles — the reveal). Cleared when the transition completes. ──
    if (transKind) {
      transT = Math.min(1, transT + dt / TRANS_DUR);
      if (transKind === 'crack') setStageMorph(transT);
      else if (transKind === 'unveil') setStage3(transT);
      if (transT >= 1) { const done = transKind; transKind = null; if (done) allSnap(); }
    }

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
    const cK = Math.max(0, breatheC) * (1 - dyingK) + coronaFlare * 0.9;   // + the S1→S2 crack flare (the sun destabilising)
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
      // ── THE ALL-SNAP hold: eased weight snapK crossfades the whole field from independent
      // idle-wander to ONE locked gaze, and back. Snaps fast (dt·22), releases soft (dt·7). ──
      if (snapT > 0) snapT -= dt;
      const snapping = snapT > 0;
      snapK += ((snapping ? 1 : 0) - snapK) * Math.min(1, dt * (snapping ? 22 : 7));

      // ── The wings BREATHE (charge deepens it), MANTLE-FLARE open on charge (the mandorla
      // widens as wrath gathers), and FREEZE mid-breath on the snap (stillness makes the stare
      // total). charge 0 + snapK 0 → breath 1, zero flare → the signed-off idle unchanged. ──
      const breath = (1 + charge * 0.8) * (1 - snapK * 0.9);
      for (const s of shoulders) {
        s.obj.rotation.z = s.baseRotZ
          + Math.sin(time * 0.2 * TAU + s.phase) * s.amp * breath
          + s.flareZ * charge * 0.16
          + s.flareZ * stage3K * 0.24;   // STAGE 3: the wings MANTLE FULLY OPEN (a bigger, held flare than the charge tell)
      }

      // ── WRATH TELL: the whole eye field bleeds from gold toward danger-red as the charge
      // gathers (irisMat paints every peripheral + the great iris — they redden as ONE being);
      // the SNAP flares every catchlight hot. Both lerp from the captured base and return to it. ──
      irisMat.color.copy(IRIS_BASE).lerp(DANGER, charge * 0.5);
      catchMat.color.copy(CATCH_BASE).multiplyScalar(1 + snapK * 1.8);

      // The great central eye's pupil tracks the player (the focal); constricts on charge.
      const gk = 1 - charge * 0.3;
      greatPupil.position.set(gazeX * GW * 0.24, GEY + gazeY * GH * 0.2, GF + 0.08);
      greatPupil.scale.set(GW * 0.38 * gk, GH * 0.44 * gk, 0.5);
      // Each peripheral pupil tracks the player within its own sclera, sitting proud of the
      // front. Independent per-eye LAG + a small resting BIAS make the field read as living eyes
      // that look every which way; the shared gazeX/gazeY drags them toward the player. On the
      // ALL-SNAP, snapK fades each eye's bias→0 and its lag→near-instant, so the ~9 scattered
      // gazes CONVERGE to a single dead-on lock — the reveal hold (the screenshot of the game).
      for (const p of pupils) {
        const u = p.userData;
        const tgx = gazeX + u.biasX * (1 - snapK);
        const tgy = gazeY + u.biasY * (1 - snapK);
        const k = Math.min(1, dt * ((2 + u.lag * 7) * (1 - snapK) + 30 * snapK));
        u.gx += (tgx - u.gx) * k;
        u.gy += (tgy - u.gy) * k;
        p.position.set(u.base.x + u.gx * u.size * 0.4, u.base.y + u.gy * u.size * 0.4 * (u.openF || 1), u.base.z + u.size * 0.62);
      }

      // ── THE RELICS: an unbranded relic breathes a dim palette pulse (collectible); a fresh brand
      // FLASHES its palette hot then decays to a steady claimed glow (the attribution beat). ──
      for (const r of relics) {
        if (r.flash > 0) r.flash = Math.max(0, r.flash - dt * 1.6);
        const pulse = r.branded ? 1.1 : (0.75 + Math.sin(time * 1.4 * TAU + r.phase) * 0.35);   // branded = steady; unbranded = a "brand me" breath
        const hot = r.baseHot * pulse + r.flash * 2.2;   // the flash rides on top
        r.glow.color.copy(r.palette).multiplyScalar(hot);
      }
    }

    // ── STAGE 3 — THE UNVEILING: the STARBURST slowly turns + pulses (radiance, never a spin-
    // machine — a gentle drift), the HALO breathes, and the STAR-EYE's pupil tracks the player.
    // Gated on stage3.visible so it costs nothing until the third form is up. ──
    if (stage3.visible) {
      starPivot.rotation.z = time * 0.06;                                  // a slow, holy drift (not a wheel)
      const pulse = 0.85 + Math.sin(time * 0.8 * TAU) * 0.15 + charge * 0.3;
      burstMat.color.copy(_c.set(def.accent)).multiplyScalar(pulse);       // the rays breathe hotter on charge (wrath)
      halo3Mat.color.copy(_c.set(def.accent)).multiplyScalar(0.8 + Math.sin(time * 0.5 * TAU) * 0.12);
      starPupil.position.set(gazeX * SW * 0.3, gazeY * SH * 0.28, SD + 0.1);
      const sk = 1 - charge * 0.3;                                          // constrict on charge (the star-eye shares the wrath tell)
      starPupil.scale.set(SW * 0.42 * sk, SH * 0.5 * sk, 0.4);
    }
  }

  const muzzle = new THREE.Object3D();
  muzzle.name = 'unmaskedMuzzle';
  muzzle.position.set(0, 0, EYE_Z + 0.9);
  group.add(muzzle);

  return {
    group, muzzle, orbiters,
    stageTransitionDur: TRANS_DUR,   // boss.js reads this to HOLD FIRE through the crack/unveiling + land the reveal beat on the eye-snap
    setDissolve: setDissolveEmotive,
    setCharge,
    setGaze,
    notice,
    allSnap,
    setBrandedRelics,
    setDebugStage,
    setStageMorph,
    setStage3,
    setPhase,
    setDebugWing,
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
