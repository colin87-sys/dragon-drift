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
  // STAGE 2 — THE OPHANIM (the hero stage). Built as a sibling sub-rig, hidden by
  // default; the CP2 stage system dissolve-swaps to it. FOUNDATION (this pass): the
  // three gimbal-tilted wheels + the dark veiled centre. The ~20 eyes, six wings, and
  // relics land next. Sheet (Fable-signed-off): wheels-within-wheels COVERED IN EYES —
  // NOT Stormrend (the wheels are gimbal-tilted on NON-coplanar axes ≥25-30° apart AND
  // off the view plane, thick carved tori not flat vanes, and the CENTRE HOLDS NO EYE).
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
  // A3 DARKEN: all non-eye material is near-black now (the eyes are the ONLY emissive
  // family). These rails are transitional scaffolding for the eye-fix render; the six-wing
  // fan replaces them next. Value, not light — matte and low.
  const railMat = track(new THREE.MeshStandardMaterial({
    color: 0x0b0a06, emissive: accent, emissiveIntensity: 0.03, roughness: 1.0, metalness: 0.0, flatShading: true,
  }));

  // Three NON-COPLANAR gimbal tilts (Euler) — authored so no two wheel planes (nor any
  // vs the view axis +Z) sit within ~25-30° (the anti-Stormrend numeric assert, tests).
  const WHEEL_TILTS = [
    { rx: 0.55, ry: 0.32, rz: 0.0 },
    { rx: -0.42, ry: -0.66, rz: 0.30 },
    { rx: 0.30, ry: 0.70, rz: -0.20 },
  ];
  const WHEEL_R = [2.7, 3.7, 4.7];
  const wheels = [];
  for (let w = 0; w < 3; w++) {
    const gimbal = new THREE.Object3D();
    gimbal.rotation.set(WHEEL_TILTS[w].rx, WHEEL_TILTS[w].ry, WHEEL_TILTS[w].rz);
    gimbal.name = `wheelGimbal${w}`;
    const spin = new THREE.Object3D();     // the wheel COUNTER-ROTATES here (its own pivot, not the group)
    gimbal.add(spin);
    const rr = WHEEL_R[w];
    const parts = [];
    // Thick carved RAIL (a torus) + an inner relief torus (carved, not a flat vane).
    parts.push(stripForMerge(new THREE.TorusGeometry(rr, 0.26 + w * 0.02, 8, lowQ ? 28 : 46)));
    parts.push(stripForMerge(new THREE.TorusGeometry(rr, 0.13, 6, lowQ ? 20 : 34)));   // relief ridge on the rail
    // Hub ring + spokes (rigid with the rail — they rotate together).
    parts.push(stripForMerge(new THREE.TorusGeometry(rr * 0.3, 0.16, 6, lowQ ? 16 : 26)));
    const spokeN = lowQ ? 6 : 8;
    for (let s = 0; s < spokeN; s++) {
      const a = (s / spokeN) * TAU;
      let box = new THREE.BoxGeometry(0.18, rr * 0.7, 0.18);
      box.translate(0, rr * 0.65, 0);
      box.rotateZ(a);
      parts.push(stripForMerge(box));
    }
    const wheelMesh = new THREE.Mesh(mergeParts(parts, `wheel${w}`), railMat);
    wheelMesh.name = `wheel${w}`;
    spin.add(wheelMesh);
    stage2.add(gimbal);
    wheels.push({ gimbal, spin, dir: w % 2 === 0 ? 1 : -1, speed: 0.16 - w * 0.03 });
  }

  // THE DARK VEILED CENTRE — no eye (the anti-Stormrend inversion); the stage-3 core's
  // hiding place. A darkness-in-brightness focal: an inner CORONA-quote rims it (reuse
  // slot-14's reserved corona glow-shape — the stage-1 rhyme), so the dark centre reads
  // as darkness WITHIN a bright ring.
  const centerMat = track(new THREE.MeshBasicMaterial({ color: 0x050403 }));
  centerMat.toneMapped = false;
  const veiledCenter = new THREE.Mesh(new THREE.SphereGeometry(1.25, lowQ ? 14 : 20, 12), centerMat);
  veiledCenter.name = 'veiledCenter';
  stage2.add(veiledCenter);
  const innerCoronaMat = track(new THREE.MeshBasicMaterial({
    color: glow, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  innerCoronaMat.toneMapped = false;
  const innerCoronaGeo = new THREE.RingGeometry(1.28, 1.7, lowQ ? 28 : 44);
  const innerCorona = new THREE.Mesh(innerCoronaGeo, innerCoronaMat);
  innerCorona.name = 'innerCorona';
  innerCorona.position.z = -0.1;
  stage2.add(innerCorona);

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
  const socketMat = track(new THREE.MeshBasicMaterial({ color: 0x030302 }));   // recessed dark rim
  const s2scleraMat = track(new THREE.MeshBasicMaterial({ color: 0x4a4436 }));  // DIM, tone-mapped: never blooms
  const irisMat = track(new THREE.MeshBasicMaterial({ color: 0x241d10 }));      // thin dim dark-gold iris bed
  const s2pupilMat = track(new THREE.MeshBasicMaterial({ color: 0x040302 }));   // big DARK pupil
  s2pupilMat.toneMapped = false;
  const catchMat = track(new THREE.MeshBasicMaterial({ color: 0xfff6e6 }));     // the ONLY hot pixel
  catchMat.toneMapped = false;
  catchMat.color.multiplyScalar(7.0);
  const sockets = [], sclerae = [], irises = [], catchlights = [], pupils = [];
  const eyePlace = (local, size) => {
    // socket (recessed dark rim, pushed back)
    const sk = new THREE.SphereGeometry(size * 1.26, lowQ ? 8 : 12, lowQ ? 6 : 8);
    sk.scale(1.2, 0.96, 0.34); sk.translate(local.x, local.y, local.z - size * 0.28);
    sockets.push(stripForMerge(sk));
    // sclera (flattened, dim, tone-mapped)
    const sc = new THREE.SphereGeometry(size, lowQ ? 8 : 12, lowQ ? 6 : 9);
    sc.scale(1.2, 0.92, 0.5); sc.translate(local.x, local.y, local.z);
    sclerae.push(stripForMerge(sc));
    // iris bed (thin dim disc behind the pupil)
    const ir = new THREE.CircleGeometry(size * 0.82, lowQ ? 12 : 18);
    ir.translate(local.x, local.y, local.z + size * 0.34);
    irises.push(stripForMerge(ir));
    // catchlight (static, up-left, proudest) — the only hot pixel; sits where the pupil
    // rests at the snap (a real specular glint stays put as the pupil roams beneath it)
    const cl = new THREE.SphereGeometry(size * 0.13, 6, 6);
    cl.translate(local.x - size * 0.26, local.y + size * 0.30, local.z + size * 0.66);
    catchlights.push(stripForMerge(cl));
    // pupil (tracks, big + dark)
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(size * 0.7, lowQ ? 8 : 10, 8), s2pupilMat);
    pupil.scale.set(1, 1, 0.55);
    const bx = (rnd() - 0.5) * 0.55, by = (rnd() - 0.5) * 0.45;
    pupil.userData = { base: local.clone(), size, biasX: bx, biasY: by, lag: 0.2 + rnd() * 0.6, gx: bx, gy: by };
    pupil.position.set(local.x + bx * size * 0.4, local.y + by * size * 0.4, local.z + size * 0.62);
    stage2.add(pupil);
    pupils.push(pupil);
  };
  // Distribution: outer rim densest, mid + inner rims, a few inboard. Uneven angular
  // spacing (jittered ≥10° off even) + 3 size tiers (§3b anti-machine). Eyes face the
  // camera (built in the XY plane, translated — not rotated into the wheel tilt).
  const eyePlan = [
    { w: 2, n: lowQ ? 6 : 9, rMul: 1.0, protrude: true,  sizes: [0.5, 0.62, 0.42] },
    { w: 1, n: lowQ ? 4 : 6, rMul: 1.0, protrude: true,  sizes: [0.44, 0.56] },
    { w: 0, n: lowQ ? 3 : 5, rMul: 1.0, protrude: false, sizes: [0.4, 0.5] },
    { w: 1, n: lowQ ? 2 : 3, rMul: 0.62, protrude: false, sizes: [0.34] },
  ];
  for (const grp of eyePlan) {
    const tilt = WHEEL_TILTS[grp.w];
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt.rx, tilt.ry, tilt.rz));
    for (let i = 0; i < grp.n; i++) {
      const a = (i / grp.n) * TAU + (rnd() - 0.5) * 0.5;         // uneven spacing
      const size = grp.sizes[i % grp.sizes.length] * (0.9 + rnd() * 0.25);
      const rr = WHEEL_R[grp.w] * grp.rMul + (grp.protrude ? WHEEL_R[grp.w] * 0.05 : 0);
      const local = new THREE.Vector3(Math.cos(a) * rr, Math.sin(a) * rr, 0.05).applyQuaternion(q);
      local.z = Math.max(local.z, 0.05);   // keep the eye on the camera-facing side
      eyePlace(local, size);
    }
  }
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

    // ── STAGE 2 — the wheels COUNTER-ROTATE on their own pivots (never the group),
    // slow + stately (charge spins them up). Phase offsets keep the tilted planes from
    // ever drifting into near-coplanar alignment. ──
    if (stage2.visible) {
      for (const wl of wheels) wl.spin.rotation.z += dt * wl.speed * wl.dir * (1 + charge * 1.6);
      innerCoronaMat.opacity = 0.12 + Math.sin(time * 0.7 * TAU) * 0.05;
      // Each pupil tracks the player within its own sclera, sitting proud of the front.
      // Independent per-eye LAG + a small resting BIAS make the field read as living eyes
      // that look every which way; the shared gazeX/gazeY drags them toward the player.
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
