import * as THREE from 'three';
import { mulberry32 } from './util.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// THE UNMASKED — slot 14, the APEX / FINALE (BOSS-DESIGN.md §5b row 14, §5c APEX
// contract). "The second sun that was always in your sky, cracking open into a
// biblically-accurate angel." It fights in THREE STAGES that dissolve-swap between
// sub-rigs off the phase machine:
//   STAGE 1 — the second sun / ECLIPSE-EYE  (this file, built first)
//   STAGE 2 — the OPHANIM (wheels-within-wheels covered in eyes)   [CP: added next]
//   STAGE 3 — the unveiling (six wings mantle, a veiled core unveils) [CP: added next]
//
// STAGED BUILD (brief Part 4 — "build one stage to its gate, STOP"): this file
// currently renders STAGE 1 only. Stages 2/3 arrive as sibling sub-rigs on their
// own gates; the stage system + THE MEDLEY + STAR PIPS + the second-sun landmark
// are CP2 integration. Everything is def-gated + inert for other bosses.
//
// ── STAGE 1 SILHOUETTE SHEET (§3b, Fable-signed-off; see the build plan) ──
// Reads as: a second sun — a FLAT black DISC ringed by a white CORONA, under one
// heavy LID; the lid opens → it's an EYE (a white pupil on the black disc). The
// disc is FLAT and front-reading (the rail sees it front-on); the lids are FLAT
// crescents that tuck back to open, NOT 3D caps (a ball is the wrong read). Cues:
// (1) the flat black disc; (2) the white corona — AUTHORED ASYMMETRIC streamers,
// NEVER a perfect even-width annulus (a clean annulus = the portal archetype);
// (3) the heavy lid whose CLOSED rim occludes the upper corona streamers so
// "lidded" reads pre-open — and NEVER a crescent-of-corona remnant (= the moon).
// Focal: the big HDR white almond PUPIL (`focalEye`) that LIVE-TRACKS the player
// (14's exclusive claim). Anti-reads: NOT sun/moon (no warm fill, no crescent),
// NOT Voidmaw (clean disc until the stage-1→2 CRACK), NOT a UFO/portal (no metal
// rim, no spin, no interior depth; irregular corona).
//
// ── §4b CHARISMA MAP (stage 1: lid aperture + pupil) ──
// GAZE = pupil live-tracks the stick with a heavy ~0.35s wet lag. BLINK-analog =
// aperture contracts/dilates (the lid never blinks; the "blink" is a pupil
// constriction). CHARGE-TELL = pupil constricts + corona brightens + aperture wides
// to WRATH. EXPRESSION = heavy-lidded (dormant) / watching (open, tracking) / wrath
// (wide, pupil pinned). FLINCH = pupil skitters off-target + a lid twitch. NOTICE =
// lid PEELS open + one fast SACCADE snaps the pupil dead-centre. DEATH = stage 1
// cannot die — its rite is the CRACK (the stage-1→2 seam, wired at CP2); setDissolve
// here is the kit fade so the coexist/test path is whole.
//
// CONTRACT: boss.js `placeGroup` stomps `group.rotation` and `kit.setDissolve` owns
// `group.scale` — all animated parts live on `rig`/pivots.

export function buildUnmasked(def, quality = 1) {
  const accent = def.accent ?? 0xf0e0a0;   // gold rails/relics/motes (identity accent, emissive only)
  const glow = def.glow ?? 0xffffff;       // white corona (the reserved glow-shape, from slot 1)
  const lowQ = quality < 0.75;
  const TAU = Math.PI * 2;

  const kit = createBossCommon(def, quality, { shieldRadius: 5.4, hpBarY: 7.6 });
  const { group, track } = kit;
  group.userData.archetype = 'unmasked';   // guards the legacy-fallback coexist path (tests/boss.mjs)

  const rig = new THREE.Group();
  group.add(rig);

  // Stage sub-rig: stage-1 parts live under `stage1` so stages 2/3 can be added as
  // siblings and the CP2 stage system can dissolve-swap between them cleanly.
  const stage1 = new THREE.Group();
  stage1.name = 'stage1Rig';
  rig.add(stage1);

  const rnd = mulberry32(0x14a9e1105);

  // Depth layout (all +Z toward the camera; the rail sees the boss front-on). Every
  // part is a FLAT layer stacked in Z so the whole thing reads as a flat eclipse
  // disc, never a sphere: disc (z0) → pupil (front) → lids (frontmost, so a closed
  // lid genuinely occludes the pupil). Corona streamers ring the rim OUTSIDE it.
  const DISC_R = 4.7;
  const DISC_Z = 0.0;
  const PUPIL_Z = 0.35;
  const LID_Z = 0.7;

  // ── THE FLAT BLACK DISC — pure void-black, opaque, matte, FLAT. Clean until the
  // scripted stage-1→2 CRACK (CP2). MeshBasicMaterial so it reads true-black on the
  // front-lit rail. ──
  const discSeg = lowQ ? 44 : 80;
  const discMat = track(new THREE.MeshBasicMaterial({ color: 0x000000 }));
  const discGeo = new THREE.CircleGeometry(DISC_R, discSeg);
  discGeo.translate(0, 0, DISC_Z);
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.name = 'eclipseDisc';
  stage1.add(disc);

  // ── THE CORONA — the reserved glow-shape (white corona), AUTHORED ASYMMETRIC
  // radial streamers riding the disc rim (LineSegments — overdraw-exempt). Irregular
  // lengths with a few long flares → a solar corona, never a perfect annulus (=
  // portal). Per-streamer flicker; the UPPER streamers dim under the closed lid. ──
  const CORONA_N = lowQ ? 36 : 62;
  const streamers = [];
  const coronaPts = [];
  for (let i = 0; i < CORONA_N; i++) {
    const a = (i / CORONA_N) * TAU + (rnd() - 0.5) * 0.05;
    const flare = rnd() < 0.16 ? 1.6 + rnd() * 1.6 : 0.0;
    const len = 0.55 + rnd() * 0.8 + flare;
    const cx = Math.cos(a), cy = Math.sin(a);
    const r0 = DISC_R * 0.99, r1 = DISC_R + len;
    coronaPts.push(cx * r0, cy * r0, DISC_Z, cx * r1, cy * r1, DISC_Z);
    streamers.push({ up: cy, f: 1.4 + rnd() * 2.6, ph: rnd() * TAU });
  }
  const coronaGeo = new THREE.BufferGeometry();
  coronaGeo.setAttribute('position', new THREE.Float32BufferAttribute(coronaPts, 3));
  const coronaMat = track(new THREE.LineBasicMaterial({
    color: glow, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  coronaMat.toneMapped = false;
  const corona = new THREE.LineSegments(coronaGeo, coronaMat);
  corona.name = 'corona';
  stage1.add(corona);

  // A faint IRREGULAR rim base under the streamers — NOT a solid even-width annulus
  // (that reads as a portal, the §3b anti-read). Built from a ring geometry whose
  // outer edge is per-segment jittered (a broken, uneven glow), kept DIM so the
  // irregular streamers carry the corona identity. Flat additive (no fresnel → no
  // blue-rim artifact).
  const ringSeg = lowQ ? 56 : 96;
  const ringMat = track(new THREE.MeshBasicMaterial({
    color: glow, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  ringMat.toneMapped = false;
  // Custom broken ring: inner edge on the rim, outer edge jittered in/out per segment.
  const ringPts = [], ringIdx = [];
  for (let i = 0; i <= ringSeg; i++) {
    const a = (i / ringSeg) * TAU;
    const cx = Math.cos(a), cy = Math.sin(a);
    const rInner = DISC_R * 0.99;
    const rOuter = DISC_R * (1.02 + rnd() * 0.06);   // uneven outer edge (broken annulus)
    ringPts.push(cx * rInner, cy * rInner, DISC_Z - 0.02, cx * rOuter, cy * rOuter, DISC_Z - 0.02);
  }
  for (let i = 0; i < ringSeg; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    ringIdx.push(a, b, d, a, d, c);
  }
  const ringGeo = new THREE.BufferGeometry();
  ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(ringPts, 3));
  ringGeo.setIndex(ringIdx);
  const coronaRing = new THREE.Mesh(ringGeo, ringMat);
  coronaRing.name = 'coronaRing';
  stage1.add(coronaRing);

  // A thin DARK separation halo just outside the rim, BEHIND the streamers — so the
  // white corona reads as shape on a PALE biome sky (the persistence worst case),
  // not just as additive glow that washes out. Invisible on the dark fight sky.
  const haloMat = track(new THREE.MeshBasicMaterial({
    color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide,
  }));
  const haloGeo = new THREE.RingGeometry(DISC_R * 0.995, DISC_R * 1.16, lowQ ? 40 : 72);
  haloGeo.translate(0, 0, DISC_Z - 0.03);
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.name = 'coronaHalo';
  stage1.add(halo);

  // ── THE PUPIL — the ONE focal: a BIG HDR white almond that LIVE-TRACKS the player
  // (14's exclusive claim). Named `focalEye`. Sized to read at sky-scale against the
  // black disc. White-hot, toneMapped=false + ×HOT so it genuinely blooms. ──
  const EYE_HOT = 2.5;
  const EYE_BASE = new THREE.Color(0xfff4e6);
  const PUPIL_BASE = [1.55, 1.02, 0.55];   // almond scale (wide, shallow-lidded, flat in depth)
  const pupilSeg = lowQ ? [14, 10] : [22, 14];
  const pupilMat = track(new THREE.MeshBasicMaterial({ color: 0xfff4e6 }));
  pupilMat.toneMapped = false;
  pupilMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT);
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(1.3, pupilSeg[0], pupilSeg[1]), pupilMat);
  pupil.name = 'focalEye';
  pupil.scale.set(...PUPIL_BASE);
  pupil.position.set(0, 0, PUPIL_Z);
  stage1.add(pupil);

  // A dark aperture-seed at the pupil's heart — reads as the true pupil within the
  // hot almond (an eye, not a lamp) and gives the charge-constriction a target.
  const seedMat = track(new THREE.MeshBasicMaterial({ color: 0x080604 }));
  seedMat.toneMapped = false;
  const seed = new THREE.Mesh(new THREE.SphereGeometry(0.4, lowQ ? 10 : 14, 10), seedMat);
  seed.name = 'pupilSeed';
  seed.scale.set(1.0, 1.0, 0.5);
  seed.position.set(0, 0, PUPIL_Z + 0.55);
  stage1.add(seed);

  // ── THE HEAVY LID — upper (`lidPivot`, the telegraph seam) + lower. FLAT crescents
  // (half-discs) hinged at the disc's horizontal diameter; opening TUCKS each back
  // out of the front view (rotation about the hinge), NOT a 3D cap (keeps the flat
  // eclipse read). Their curved edge is an EYELID ARC (never a level chord, §3b.3).
  // Closed = a heavy-lidded slit (dormant); NOTICE peels wide; CHARGE = WRATH. A hair
  // warmer-black than the disc so the lid reads as its own tier. ──
  const lidMat = track(new THREE.MeshStandardMaterial({
    color: 0x040306, emissive: 0x000000, roughness: 1.0, metalness: 0.0, flatShading: true,
  }));
  // Each lid is a CRESCENT (a disc-rim arc closed by a CURVED lash) — the lash is a
  // quadratic bow, NEVER a level chord (§3b.3), and the crescent stays inside the
  // disc rim so the silhouette holds a clean circle (no cusps). At rest the crescent
  // covers down over the pupil = a heavy dark lid mass; opening tucks it back (a
  // rotation about the disc centre) so the lash rises and the pupil is revealed.
  const lidSeg = lowQ ? 32 : 56;
  // The crescent stops INBOARD of the disc rim (LR < DISC_R) so its side corners
  // (canthi) never reach the rim — the disc edge + corona stay an UNBROKEN circle at
  // 3 and 9 o'clock (no mechanical seam/notch, the CP1 fix). The outer rim ring the
  // lid leaves uncovered is just more black disc, so the lidded read is seamless.
  const crescentGeo = () => {
    const LR = DISC_R * 0.88;
    const a = 0.14;
    const yEnd = LR * Math.sin(a), xEnd = LR * Math.cos(a);
    const s = new THREE.Shape();
    s.absarc(0, 0, LR, a, Math.PI - a, false);                     // inboard arc (ends L/R short of the rim)
    s.quadraticCurveTo(0, yEnd - LR * 0.95, xEnd, yEnd);           // CURVED lash bowing down over the pupil
    s.closePath();
    return stripForMerge(new THREE.ShapeGeometry(s, lidSeg));
  };
  const lidGeo = crescentGeo();
  const lids = [];
  for (const side of [1, -1]) {
    const lidPivot = new THREE.Object3D();
    lidPivot.position.set(0, 0, LID_Z);
    const lid = new THREE.Mesh(lidGeo, lidMat);
    if (side < 0) lid.rotation.z = Math.PI;   // lower lid: the same crescent flipped to cover the bottom
    lidPivot.add(lid);
    lidPivot.userData.side = side;
    lidPivot.name = side > 0 ? 'lidPivot' : 'lidPivotLower';
    stage1.add(lidPivot);
    lids.push(lidPivot);
  }
  // aperture 0 = shut (crescents cover the disc → a black lidded circle), 1 = peeled
  // fully back. The upper lid tucks to −mag, the lower to +mag.
  const lidMag = (aperture) => 0.04 + aperture * 1.5;

  // ── ATTENDANT MOTES — small DARK satellites (§3 law 8: dim accent emissive ≤0.25,
  // never bright debris) drifting around the disc: the cinders of the thing that
  // always watched. Also the roster orbiter contract (≥2, floor at q0.5). ──
  const orbiters = [];
  const moteN = lowQ ? 2 : 3;
  const moteMat = track(new THREE.MeshStandardMaterial({
    color: 0x080705, emissive: accent, emissiveIntensity: 0.05, roughness: 1.0, metalness: 0.0, flatShading: true,
  }));
  const moteGeo = stripForMerge(new THREE.IcosahedronGeometry(0.12, 0));
  for (let i = 0; i < moteN; i++) {
    const m = new THREE.Mesh(moteGeo, moteMat);
    m.userData = { ang: (i / moteN) * TAU, radius: DISC_R * (1.1 + rnd() * 0.18), speed: 0.14 + rnd() * 0.1, baseY: (rnd() - 0.5) * 2.4, tilt: rnd() * TAU };
    stage1.add(m);
    orbiters.push(m);
  }

  kit.flashBind(lidMat, 0.0);
  kit.finalize();

  // ──────────────────────────────────────────────────────────────────────────
  // ANIMATION / STATE
  // ──────────────────────────────────────────────────────────────────────────
  const DANGER = new THREE.Color(0xff2b6a);
  const _c = new THREE.Color();

  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }

  // Gaze: continuous live stick-tracking with a heavy WET lag (~0.35s) — the sky
  // steers after you. gLag ~3 gives the wet read; notice/charge tighten it.
  let gazeTX = 0, gazeTY = 0, gazeX = 0, gazeY = 0;
  function setGaze(nx, ny) {
    gazeTX = Math.max(-1, Math.min(1, nx));
    gazeTY = Math.max(-1, Math.min(1, ny));
  }
  let noticeT = 0, saccadeT = 0;
  function notice() { noticeT = 1.1; saccadeT = 0.18; }
  let painT = 0, skitterX = 0, skitterY = 0;
  function flinchFlash(amt) {
    if (amt > 0.3) { painT = Math.max(painT, 0.3); skitterX = (rnd() - 0.5) * 1.6; skitterY = (rnd() - 0.5) * 1.2; }
    kit.flash(amt);
  }
  let dyingK = 0;
  function setDissolveEmotive(k) { dyingK = Math.max(0, Math.min(1, k)); kit.setDissolve(k); }

  let aperture = 0.25;   // eased lid aperture (0.25 = dormant heavy-lidded rest)

  function tickBody(dt, time) {
    if (noticeT > 0) noticeT -= dt;
    if (saccadeT > 0) saccadeT -= dt;
    if (painT > 0) painT -= dt;

    // ── Aperture (EXPRESSION): heavy-lidded rest → watching (gaze active/noticed) →
    // wrath (charge wides it). Death lowers the lids (the light going out). ──
    const watching = noticeT > 0 || Math.abs(gazeTX) + Math.abs(gazeTY) > 0.05;
    let apTarget = 0.14;                                 // dormant HEAVY-lidded (a watching slit)
    if (watching) apTarget = 0.55;                       // watching, open, tracking
    apTarget = Math.max(apTarget, charge * 0.92);        // WRATH: charge wides toward fully-peeled
    apTarget = Math.min(1, apTarget + (painT > 0 ? 0.1 : 0));
    apTarget *= 1 - dyingK * 0.85;                       // the light dims behind lowering lids in death
    aperture += (apTarget - aperture) * Math.min(1, dt * 6);
    const mag = lidMag(aperture);
    lids[0].rotation.x = -mag;   // upper tucks back/up
    lids[1].rotation.x = mag;    // lower tucks back/down

    // ── Gaze: heavy wet lag; the saccade briefly snaps dead-centre; a flinch
    // skitters the pupil off-target (it loses you for ~0.3s). ──
    const gLag = saccadeT > 0 ? 22 : (noticeT > 0 || charge > 0.4 ? 8 : 3);
    const tx = saccadeT > 0 ? 0 : gazeTX + (painT > 0 ? skitterX : 0);
    const ty = saccadeT > 0 ? 0 : gazeTY + (painT > 0 ? skitterY : 0);
    gazeX += (tx - gazeX) * Math.min(1, dt * gLag);
    gazeY += (ty - gazeY) * Math.min(1, dt * gLag);
    const maxX = DISC_R * 0.46, maxY = DISC_R * 0.36;
    pupil.position.set(gazeX * maxX, gazeY * maxY, PUPIL_Z);
    seed.position.set(gazeX * maxX, gazeY * maxY, PUPIL_Z + 0.55);

    // ── Pupil size (BLINK-analog + CHARGE-TELL): breathes; CONSTRICTS on charge;
    // pinned tiny on the notice saccade; blows WIDE in death. ──
    const breathe = 1 + Math.sin(time * 0.9 * TAU) * 0.03;
    const constrict = dyingK > 0 ? 1.4 : (saccadeT > 0 ? 0.55 : (1 - charge * 0.4));
    const ps = breathe * constrict;
    pupil.scale.set(PUPIL_BASE[0] * ps, PUPIL_BASE[1] * ps, PUPIL_BASE[2] * ps);
    seed.scale.set(constrict * 0.9, constrict * 0.9, 0.5 * (dyingK > 0 ? 1.6 : 1));

    // Pupil heat: idle pulse; hotter on notice ("it SEES you"); reddens toward danger
    // as charge peaks (wrath); light going out in death.
    let eyeK = 1 + Math.sin(time * 2.6 * TAU) * 0.04;
    if (noticeT > 0) eyeK *= 1.25;
    eyeK *= 1 - dyingK * 0.6;
    _c.copy(EYE_BASE).lerp(DANGER, charge * 0.7);
    pupilMat.color.copy(_c).multiplyScalar(eyeK * EYE_HOT);

    // ── Corona: aggregate flicker; a charge swell; the UPPER streamers dim as the
    // lid closes over them (so "lidded" reads pre-open, no crescent remnant). ──
    const upperCover = Math.max(0, 1 - aperture) * 0.85;
    let flick = 0;
    for (const s of streamers) flick += Math.pow(Math.max(0, Math.sin(time * s.f + s.ph)), 4);
    flick = 0.55 + (flick / streamers.length) * 0.9;
    coronaMat.opacity = flick * (0.72 + charge * 0.5) * (1 - dyingK) * (1 - upperCover * 0.5);
    ringMat.opacity = (0.14 + Math.sin(time * 1.3 * TAU) * 0.05 + charge * 0.16) * (1 - dyingK);

    // Attendant motes: slow drift around the disc (idle motion at a 2nd frequency).
    for (const o of orbiters) {
      const u = o.userData;
      u.ang += dt * u.speed;
      o.position.set(Math.cos(u.ang) * u.radius, u.baseY + Math.sin(time * 0.9 + u.tilt) * 0.6, Math.sin(u.ang) * u.radius * 0.35 + DISC_Z);
      o.rotation.x += dt * 1.3;
      o.rotation.y += dt * 1.0;
    }
  }

  // Muzzle: stage-1 bullets originate at the pupil (the eye that watches, fires).
  const muzzle = new THREE.Object3D();
  muzzle.name = 'unmaskedMuzzle';
  muzzle.position.set(0, 0, PUPIL_Z + 0.8);
  group.add(muzzle);

  return {
    group, muzzle, orbiters,
    setDissolve: setDissolveEmotive,
    setCharge,
    setGaze,
    notice,
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
