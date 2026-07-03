import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { mulberry32 } from './util.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// CRAGHOLD's body — REBUILD (design-review verdict, 2026-07): the shipped
// "helmed stone bust + two hands" read as Voidmaw-in-green with mitten hands —
// concept collision with boss 1 (a second stone-face-with-glowing-eyes boss)
// and a silhouette with three competing focal points. The fix takes the
// epithet literally: CRAGHOLD IS NOW TWO COLOSSAL BASALT HANDS WITH AN EYE IN
// EACH PALM — AND NO HEAD. Where a head would be, a SHATTERED STONE CROWN
// floats alone in empty sky. The missing head is the negative space, the
// hook, and the lore gap (boss 1 is a face with no body; boss 3 is a body
// with no face — zero silhouette overlap).
//
// SILHOUETTE-FIRST: one sentence — "two vast stone hands flanking a broken
// floating crown." The crown sits centred, well above and between the hands,
// so visible SKY reads through the head-void at rest.
//
// THE SCAR (one asymmetric break, §3 law 6): one crown arc is visibly
// SNAPPED — a jagged debris cluster at its broken end — the other two arcs
// and both hands stay symmetric. (The old stump/shackle lore objects are
// gone with the bust; the crown now carries the single scar.)
//
// PALETTE (registry slot 3): near-black basalt base (~75%), moss-lichen
// accent emissive on the distal finger segments/knuckles (~20%), white-hot
// palm eyes (<5%, EYE_HOT overdrive — THE two brightest points on the boss,
// nothing else competes: no palm core circles, no orb rows). The floating
// crown carries a THIRD, dimmer accent family (dark bronze + warm gold-lichen
// emissive ~0.55) — visibly cooler than the eyes, tying it to the "ancient
// fittings" story the other stone bosses use for trim.
//
// GESTURE/LIMB SYSTEM (Tier 2 contract): each hand is FOUR fingers, each a
// 2-segment pivot chain (root `fingerPivot` + one child pivot, one shared
// scalar drives both — see the per-finger curl note below) plus a 1-segment
// thumb. DRAW-BUDGET NOTE: the spec's reference build calls for a 3-segment
// finger chain and a 2-segment thumb; at 4 fingers × 2 hands that would be
// 24 finger meshes alone, which — stacked against the mandatory palm/eye/
// pupil/crown/orbiter/HP-bar draws — blows past the ≤34 visible-draw gate
// (tests/boss.mjs). Consolidated to a 2-segment finger chain (root + one
// child riding at 0.85× the root's curl, folding the spec's mid+tip into one
// distal box) and a 1-segment thumb: 34 visible draws @q1 exactly at rest,
// with the fold still reading as a real knuckle (a small knuckle cube is
// baked into the distal segment's base, at the joint).
//
// CONTRACT: boss.js stomps `group.rotation` every frame (placeGroup) and
// `kit.setDissolve` owns `group.scale` — every animated part lives on `rig`,
// the hand roots, or pivots under them, never on `group` itself.

export function buildStoneColossus(def, quality = 1) {
  const accent = def.accent ?? 0x69c94f;   // moss/lichen green — identity lives in emissive
  const glow = def.glow ?? 0xd8f09a;       // pale lichen-gold — shield rim, shards
  const lowQ = quality < 0.75;

  // Shared plumbing. shieldRadius wraps the space between the hands (where the
  // crown floats); the hands themselves sit mostly OUTSIDE the bubble at
  // x=±5.4 — same "machinery outside the ward" precedent the old bust used.
  // hpBarY sits above the crown's own top (crown centre 3.6 + arc radius ≤2.6).
  const kit = createBossCommon(def, quality, { shieldRadius: 4.6, hpBarY: 6.8, hpBarZ: 1.6, hpBarScale: 0.75 });
  const { group, track } = kit;
  group.userData.archetype = 'stoneColossus';   // guards the legacy-fallback coexist path (tests/boss.mjs)

  const rig = new THREE.Group();
  group.add(rig);

  // Deterministic jitter — same seed every build (no per-load shape popping).
  const rnd = mulberry32(0xc0105505);
  const strip = stripForMerge;
  const mergeStone = (parts, label) => {
    const geo = mergeGeometries(parts, false);
    if (!geo) throw new Error(`buildStoneColossus: ${label} mergeGeometries returned null (attribute mismatch)`);
    return geo;
  };

  // ---- Painted value tiers (the sun can't shade the front face — §3 law 4).
  // Basalt runs near-black; the moss identity lives entirely in the emissive
  // accent tier (the distal finger/knuckle segments); the crown owns its own
  // dim bronze/gold family, cooler than the palm-eyes.
  const basaltMat = track(new THREE.MeshStandardMaterial({
    color: 0x0c0f0a, emissive: accent, emissiveIntensity: 0.02, roughness: 0.7, metalness: 0.15, flatShading: true,
  }));
  // Knuckle-mid tier (round 3: was 0x232c17/ei 0.20 on EVERY distal segment —
  // that over-allocated the identity tier and the fingertips read as a light-
  // green cap; the spec's bright 0.20 accent survives as the lichen seams).
  const midMat = track(new THREE.MeshStandardMaterial({
    color: 0x141a0f, emissive: accent, emissiveIntensity: 0.06, roughness: 0.5, metalness: 0.3, flatShading: true,
  }));
  const bronzeMat = track(new THREE.MeshStandardMaterial({
    color: 0x2a1d10, emissive: new THREE.Color(0xc98a3f).lerp(new THREE.Color(accent), 0.3),
    emissiveIntensity: 0.7, roughness: 0.45, metalness: 0.55, flatShading: true,   // round 2: 0.55 vanished at 30m — the crown IS the hook, it must read
  }));

  // ---------------------------------------------------------------------
  // SHARED GEOMETRY (built once, instanced across both hands via separate
  // Mesh objects — geometry sharing costs nothing extra in tris/memory, and
  // every finger/thumb needs its OWN pivot transform regardless).
  // ---------------------------------------------------------------------
  // PALM — a slab + a wrist cuff block baked below it + the eye-socket ring,
  // all static relative to the wrist pivot → ONE merged basalt draw per hand.
  const palmBox = strip(new THREE.BoxGeometry(1.85, 1.9, 0.55));
  // Brow overhang: a basalt ledge jutting over the socket top — the shadow
  // that keeps the palm-eye DREADFUL instead of googly (the idol's socket
  // lesson, transplanted). Merged into the palm draw: zero extra cost.
  const browLedge = strip(new THREE.BoxGeometry(1.05, 0.26, 0.55));
  browLedge.translate(0, 0.74, 0.18);
  const cuffBox = strip(new THREE.BoxGeometry(1.3, 0.7, 0.6));
  cuffBox.translate(0, -1.30, 0);
  const socketSeg = lowQ ? 10 : 16;
  const socketPool = strip(new THREE.CylinderGeometry(0.78, 0.78, 0.12, socketSeg));
  socketPool.rotateX(Math.PI / 2);        // a near-black disc the eye floats in — the idol's
  socketPool.translate(0, 0.05, 0.26);    // "bright core framed in black" law, transplanted
  const socketRing = strip(new THREE.TorusGeometry(0.62, 0.09, 5, socketSeg));
  socketRing.translate(0, 0.05, 0.30);   // torus already lies flat facing +Z — the palm's front plane
  const palmGeo = mergeStone([palmBox, cuffBox, socketPool, socketRing, browLedge], 'palm');

  // FINGERS — 2-segment chain per finger: root (`fingerPivot`, the curl
  // scalar) + one child riding at 0.85× the root's rotation (the spec's
  // mid+tip taper folded into one distal box, see the header note). A small
  // knuckle cube is baked into the distal segment's base — the joint bump.
  // Round 3: fingers thickened + lengthened — at 30m front-on the first cut's
  // 0.34-wide digits read as a serration, not FINGERS; a finger run needs to
  // rival the palm's own height to read as a hand.
  const seg1Geo = strip(new THREE.BoxGeometry(0.30, 0.85, 0.30));
  seg1Geo.translate(0, 0.425, 0);         // root pivot at y=0 → tip at y=0.85
  const seg2Base = strip(new THREE.BoxGeometry(0.25, 1.05, 0.24));
  seg2Base.translate(0, 0.525, 0);
  const knuckleGeo = strip(new THREE.BoxGeometry(0.32, 0.30, 0.34));
  knuckleGeo.translate(0, 0.15, 0);       // straddles the joint at the distal segment's base
  const seg2Geo = mergeStone([seg2Base, knuckleGeo], 'finger-distal');

  // THUMB — a single rigid segment (design-spec calls for 2; consolidated to
  // 1 for the same draw-budget reason as the fingers — see header note).
  const thumbGeo = strip(new THREE.BoxGeometry(0.30, 0.85, 0.34));
  thumbGeo.translate(0, 0.425, 0);

  // PALM EYE — the focal law: THE brightest thing on the boss. HDR overdrive
  // + toneMapped=false, the exact idiom bossIdol.js's eyes use. Squashed in z
  // (round-2 capture fix): a full sphere protruded 0.5 past the palm face, so
  // the shield-clamp fists curled THROUGH it and the eye stayed visible while
  // "hidden"; flattened, the curled fingers actually cover it.
  const eyeGeo = strip(new THREE.SphereGeometry(0.5, lowQ ? 10 : 14, lowQ ? 8 : 10));
  eyeGeo.scale(1, 0.82, 0.68);   // almond, not googly
  const EYE_BASE = new THREE.Color(0xeafff0);
  const EYE_HOT = 2.4;
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: 0xeafff0 }));
  eyeMat.toneMapped = false;
  eyeMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT);
  const pupilGeo = new THREE.SphereGeometry(0.10, lowQ ? 6 : 8, lowQ ? 4 : 6);
  const pupilMat = track(new THREE.MeshBasicMaterial({ color: 0x0c140c }));

  // LICHEN SEAMS — authored dim-green additive LineSegments across each palm
  // face (LineSegments are overdraw-exempt, §2): the moss identity as GLINTS
  // on near-black stone, never as diffuse. One shared geometry, mirrored by
  // the wrist transform; small deterministic jitter keeps it hand-grown.
  const seamGeo = (() => {
    const seamRnd = mulberry32(0x5ca25ca2);
    const Z = 0.30;
    const runs = [
      // three seams wrapping around the socket, upper-left → lower-right
      [[-0.72, 0.85], [-0.45, 0.55], [-0.55, 0.10], [-0.35, -0.35], [-0.60, -0.75]],
      [[0.68, 0.90], [0.52, 0.48], [0.66, 0.05], [0.45, -0.42]],
      [[-0.25, -0.62], [0.10, -0.72], [0.48, -0.60], [0.70, -0.80]],
    ];
    const pts = [];
    for (const run of runs) {
      for (let i = 0; i < run.length - 1; i++) {
        pts.push(
          run[i][0] + (seamRnd() - 0.5) * 0.06, run[i][1] + (seamRnd() - 0.5) * 0.06, Z,
          run[i + 1][0] + (seamRnd() - 0.5) * 0.06, run[i + 1][1] + (seamRnd() - 0.5) * 0.06, Z
        );
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  })();
  const seamMat = track(new THREE.LineBasicMaterial({
    color: new THREE.Color(accent).multiplyScalar(0.55), transparent: true, opacity: 0.45,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));

  // ---------------------------------------------------------------------
  // HAND builder — root (position/orientation channel) → wrist pivot
  // (named handPivotL/handPivotR, exactly one each — test contract) → palm,
  // eye, 4 fingers, 1 thumb.
  // ---------------------------------------------------------------------
  const HAND_X = 4.2, HAND_Y = 0.1, HAND_Z = 0.65;
  const BASE_TILT = 0.12;   // "tilted toward center" resting lean
  const fingerX = [-0.69, -0.23, 0.23, 0.69];   // 0.46 pitch on 0.30-wide digits = real sky gaps
  const fanBase = fingerX.map((_, i) => (i - 1.5) * 0.11);   // ±0.165 rad fan — digits break the outline

  function buildHand(sx) {
    const root = new THREE.Group();
    root.name = sx < 0 ? 'handL' : 'handR';
    root.position.set(sx * HAND_X, HAND_Y, HAND_Z);
    rig.add(root);
    const wrist = new THREE.Object3D();
    wrist.name = sx < 0 ? 'handPivotL' : 'handPivotR';
    wrist.rotation.z = -sx * BASE_TILT;
    root.add(wrist);

    wrist.add(new THREE.Mesh(palmGeo, basaltMat));
    wrist.add(new THREE.LineSegments(seamGeo, seamMat));   // lichen glints ride every gesture

    const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    eyeMesh.position.set(0, 0.05, 0.36);
    wrist.add(eyeMesh);
    const pupilMesh = new THREE.Mesh(pupilGeo, pupilMat);
    pupilMesh.position.set(0, 0.05, 0.70);   // riding the squashed eye's front
    wrist.add(pupilMesh);

    const fingers = [];
    for (let i = 0; i < 4; i++) {
      const rootPivot = new THREE.Object3D();
      rootPivot.name = 'fingerPivot';   // telegraph-silhouette test gate finds these by name
      rootPivot.position.set(fingerX[i], 0.95, 0.05);
      rootPivot.rotation.z = fanBase[i];
      wrist.add(rootPivot);
      rootPivot.add(new THREE.Mesh(seg1Geo, basaltMat));
      const childPivot = new THREE.Object3D();
      childPivot.position.set(0, 0.85, 0);   // at the root segment's tip
      rootPivot.add(childPivot);
      childPivot.add(new THREE.Mesh(seg2Geo, midMat));
      fingers.push({ root: rootPivot, child: childPivot, fanBase: fanBase[i], idx: i });
    }

    const thumb = new THREE.Object3D();
    thumb.name = 'thumbPivot';   // deliberately NOT fingerPivot — see design spec
    thumb.position.set(sx < 0 ? 0.72 : -0.72, -0.15, 0.28);   // proud of the palm face, not buried in it
    thumb.rotation.z = sx * -0.55;   // angled inward along the palm edge, clear of the eye
    wrist.add(thumb);
    thumb.add(new THREE.Mesh(thumbGeo, basaltMat));

    return {
      root, wrist, fingers, thumb, pupil: pupilMesh, sx,
      baseX: sx * HAND_X, baseY: HAND_Y, baseZ: HAND_Z,
      phase: sx < 0 ? 0 : Math.PI,
      indexIdx: sx < 0 ? 3 : 0,   // the finger nearest the (inward-angled) thumb
    };
  }
  const hands = [buildHand(-1), buildHand(1)];

  // ---------------------------------------------------------------------
  // THE SHATTERED CROWN — the head-void. Centred above and between the
  // hands; sky reads through the gap at rest. Two independently-rotating
  // draws (the "counter-rotation, two rates" idle read) — group A carries
  // two intact arcs, group B carries the one SNAPPED arc + a debris cluster
  // concentrated at its broken end (the scar, law 6).
  // ---------------------------------------------------------------------
  const CROWN_Y = 2.9, CROWN_Z = -1.1;
  const crownDebris = (angles, radius, seedRnd) => angles.map((ang) => {
    const d = strip(new THREE.OctahedronGeometry(0.16 + seedRnd() * 0.09, 0));
    d.rotateZ(seedRnd() * Math.PI);
    d.rotateX(seedRnd() * Math.PI);
    d.translate(Math.cos(ang) * radius, Math.sin(ang) * radius, 0);
    return d;
  });
  const crownRnd = mulberry32(0x5eed7a55);
  // Round-2 capture fix: 0.14 tubes at emissive 0.55 read as faint drifting
  // debris, not "a broken crown" — thickened + brightened (still far dimmer
  // than the palm-eyes' 2.4 HDR white).
  const crownTubular = lowQ ? 10 : 16;
  const arc1 = strip(new THREE.TorusGeometry(2.25, 0.30, 5, crownTubular, Math.PI * 0.42));
  arc1.rotateZ(0.35);
  const arc2 = strip(new THREE.TorusGeometry(2.55, 0.30, 5, crownTubular, Math.PI * 0.36));
  arc2.rotateZ(Math.PI + 0.55);
  const crownAGeo = mergeStone(
    [arc1, arc2, ...crownDebris([1.65, 5.4], 2.3, crownRnd)], 'crown-A'
  );
  const crownA = new THREE.Mesh(crownAGeo, bronzeMat);
  crownA.position.set(0, CROWN_Y, CROWN_Z);
  rig.add(crownA);

  // The snapped arc: shorter span, and its trailing end (the +thetaStart edge)
  // carries a tight debris cluster instead of a clean cut — the one
  // deliberate asymmetric scar.
  const arc3 = strip(new THREE.TorusGeometry(2.0, 0.30, 5, crownTubular, Math.PI * 0.48));
  arc3.rotateZ(Math.PI * 1.55);
  const crownBGeo = mergeStone(
    [arc3, ...crownDebris([4.87, 4.98, 5.10, 3.2], 2.0, crownRnd)], 'crown-B'
  );
  const crownB = new THREE.Mesh(crownBGeo, bronzeMat);
  crownB.position.set(0, CROWN_Y, CROWN_Z);
  rig.add(crownB);

  // ---------------------------------------------------------------------
  // ORBITERS — dark masonry chunks (contract ≥2; law 8: satellites stay
  // dark). Held at exactly 2 (not 3) — see the header draw-budget note.
  // ---------------------------------------------------------------------
  const masonryMat = track(new THREE.MeshStandardMaterial({
    color: 0x101408, emissive: accent, emissiveIntensity: 0.22, roughness: 0.4, metalness: 0.3, flatShading: true,
  }));
  const masonryGeo = strip(new THREE.BoxGeometry(0.55, 0.38, 0.46));
  const orbiters = [];
  for (let i = 0; i < 2; i++) {
    const m = new THREE.Mesh(masonryGeo, masonryMat);
    m.userData = { ang: (i / 2) * Math.PI * 2, radius: 3.6 + i * 0.6, speed: 0.9 + i * 0.2, baseY: 1.6, tilt: i * 0.6 };
    rig.add(m);
    orbiters.push(m);
  }

  // Hit flash rings the BRONZE crown, never the basalt (round-2 capture fix,
  // re-learning the shipped build's ledger lesson the hard way): rider fire
  // lands every ~0.5s, so a flash bound to the basalt kept BOTH HANDS
  // permanently semi-lit in bright green — the exact "saturated toy-green"
  // failure this rebuild exists to kill. The crown flashing hot reads as
  // struck metal; the pain-splay flinch still sells the hit on the hands.
  kit.flashBind(bronzeMat, 0.7);
  kit.finalize();

  // ---------------------------------------------------------------------
  // ANIMATION — curl scale (0 open → 1 fully closed fist, hiding the eye).
  // ---------------------------------------------------------------------
  // Round-2 capture fix: 0.35 leaned the fingertips ~60° toward the camera —
  // front-on (the only view that matters, §1) the foreshortening erased them
  // and the hands read as MITTENS again. 0.18 keeps the fingers standing in
  // the XY plane where the silhouette can see them; it still reads as the
  // spec's "rest half-curl" because the child joint adds its 0.85× on top.
  const REST_CURL = 0.18;
  const BLINK_CURL = 0.58;
  const CLENCH_CURL = 0.95;      // the big tell: fist wind-up, eye fully hidden
  const POINT_EXTEND = 0.04;
  const POINT_CURL = 0.85;
  const SPLAY_CURL = 0.08;
  const CONVERGE_CURL = 0.55;
  const NOTICE_OPEN = 0.02;
  const SHIELD_CURL = 1.0;
  const ROOT_ANGLE = 1.6;        // rad at curl=1 on the root pivot
  const CHILD_RATIO = 0.85;      // consolidated stand-in for the spec's 0.8×/0.6× chain

  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }

  let tell = null;
  const TELL_FAMILY = {
    aimed: 'point', stream: 'point',
    fan: 'splay', spiral: 'splay', spiralStream: 'splay',
    tunnel: 'clench', iris: 'clench', curtain: 'clench', movingGap: 'clench', secondWave: 'clench',
    crossfire: 'converge',
  };
  function setAttackTell(id) { tell = id ? (TELL_FAMILY[id] ?? 'clench') : null; }

  let setpieceK = 0;
  function setSetpiece(k) { setpieceK = Math.max(0, Math.min(1, k)); }

  let shieldClamp = false;
  let shieldOpenT = 0;   // brief overshoot window after a shield lowers
  kit.onShieldChange((v) => {
    if (v) { shieldClamp = true; return; }
    if (shieldClamp) { shieldClamp = false; shieldOpenT = 0.25; }
  });

  // --- Charisma layer ---
  let gazeTX = 0, gazeTY = 0, gazeX = 0, gazeY = 0;
  let lookAwayT = 0, lookAwayX = 0, lookAwayY = 0;
  let nextLookAway = 5 + Math.random() * 6;
  function setGaze(nx, ny) {
    gazeTX = Math.max(-1, Math.min(1, nx));
    gazeTY = Math.max(-1, Math.min(1, ny));
  }
  const BLINK_DUR = 0.3;
  let blinkT = 0, nextBlink = 4 + Math.random() * 3, blinkHand = 0;
  let noticeT = 0;
  function notice() { noticeT = 0.9; blinkT = 0; nextBlink = 3; }
  let painT = 0;
  function flinchFlash(amt) { if (amt > 0.3) painT = Math.max(painT, 0.35); kit.flash(amt); }
  let dyingK = 0;
  function setDissolveEmotive(k) { dyingK = Math.max(0, Math.min(1, k)); kit.setDissolve(k); }

  function tickBody(dt, time) {
    // Idle: a slow tectonic breath (root never animates — placeGroup owns it).
    rig.rotation.z = Math.sin(time * 0.22) * 0.01;
    rig.rotation.x += ((dyingK * 0.15) - rig.rotation.x) * Math.min(1, dt * 3);

    // --- Gaze: high-lag pursuit, deliberate look-aways (copied idiom) ---
    nextLookAway -= dt;
    if (lookAwayT > 0) lookAwayT -= dt;
    else if (nextLookAway <= 0 && charge < 0.2 && noticeT <= 0 && dyingK <= 0) {
      lookAwayT = 0.9 + Math.random() * 0.7;
      lookAwayX = (Math.random() - 0.5) * 1.4;
      lookAwayY = Math.random() * 0.6 - 0.2;
      nextLookAway = 5 + Math.random() * 6;
    }
    const gx = lookAwayT > 0 ? lookAwayX : gazeTX;
    const gy = lookAwayT > 0 ? lookAwayY : gazeTY;
    const gLag = (noticeT > 0 || charge > 0.5) ? 8 : 2.2;
    gazeX += (gx - gazeX) * Math.min(1, dt * gLag);
    gazeY += (gy - gazeY) * Math.min(1, dt * gLag);

    // --- Blink: alternating hands, fingers curl to ~0.58 and back ---
    if (blinkT > 0) blinkT -= dt;
    else {
      nextBlink -= dt;
      if (nextBlink <= 0 && charge < 0.5 && noticeT <= 0 && dyingK <= 0) {
        blinkT = BLINK_DUR; nextBlink = 4 + Math.random() * 3; blinkHand = 1 - blinkHand;
      }
    }
    const blinkProg = blinkT > 0 ? 1 - Math.abs((blinkT / BLINK_DUR) * 2 - 1) : 0;

    if (painT > 0) painT -= dt;
    if (noticeT > 0) noticeT -= dt;
    if (shieldOpenT > 0) shieldOpenT -= dt;

    // --- Pupils: pinpoint at notice/charge, dilated wide in death ---
    const pupilTarget = dyingK > 0 ? 1.6 : (noticeT > 0.5 ? 0.35 : 1 - charge * 0.6);

    // --- Eye heat: two flicker frequencies + charge flare; shield leashes it
    // dim; death gutters it out (fingers physically cover it too). ---
    const flicker = 0.85 + Math.sin(time * 3.8) * 0.1 + Math.sin(time * 11) * 0.04;
    let eyeK = shieldClamp ? 0.22 : flicker * (1 + charge * 0.3);   // guttering under the closed fist
    if (noticeT > 0) eyeK *= 1.25;
    eyeK *= 1 - dyingK * 0.85;
    eyeMat.color.copy(EYE_BASE).multiplyScalar(Math.max(0.05, eyeK) * EYE_HOT);

    const gesture = tell ?? 'clench';
    const recoil = (painT > 0 ? painT / 0.35 : 0) * 0.35 + (noticeT > 0.6 ? (noticeT - 0.6) / 0.3 : 0) * 0.25;
    rig.position.z = -recoil;

    for (let hi = 0; hi < hands.length; hi++) {
      const h = hands[hi];
      const sx = h.sx;

      // Position channel: idle drift, antiphase bob at 2 frequencies.
      let tx = h.baseX + Math.sin(time * 0.5 + h.phase) * 0.25 + Math.sin(time * 0.9 + h.phase * 1.7) * 0.12 + gazeX * 0.3;
      let ty = h.baseY + Math.sin(time * 0.8 + h.phase) * 0.28;
      let tz = h.baseZ + Math.sin(time * 0.42 + h.phase * 2) * 0.15;
      let rz = -sx * BASE_TILT + gazeX * 0.08;
      let ry = 0;
      let rx = gazeY * 0.05;

      // Per-finger curl targets: rest + micro-flex (±0.04 rad at the root).
      const curls = [0, 1, 2, 3].map((i) => REST_CURL + Math.sin(time * 2 + i * 1.3 + h.phase) * 0.025);
      let thumbCurl = REST_CURL * 0.85;
      let fanMul = 1;

      // Blink: this hand's fingers curl toward BLINK_CURL (the eyelid read).
      if (hi === blinkHand && blinkProg > 0) {
        for (let i = 0; i < 4; i++) curls[i] += (BLINK_CURL - curls[i]) * blinkProg;
      }

      // Attack-tell wind-up: tension rises toward the gesture's pose as
      // charge climbs (0..1 IS the blend factor — the controller already
      // eases charge in over the telegraph duration).
      if (charge > 0.001 && !shieldClamp && dyingK <= 0) {
        ty += charge * 0.5;
        if (gesture === 'clench') {
          for (let i = 0; i < 4; i++) curls[i] += (CLENCH_CURL - curls[i]) * charge;
          thumbCurl += (CLENCH_CURL - thumbCurl) * charge;
        } else if (gesture === 'point') {
          for (let i = 0; i < 4; i++) {
            const target = i === h.indexIdx ? POINT_EXTEND : POINT_CURL;
            curls[i] += (target - curls[i]) * charge;
          }
          thumbCurl += (POINT_CURL - thumbCurl) * charge;
          fanMul = 1 - 0.4 * charge;
          rx += -0.25 * charge;
        } else if (gesture === 'splay') {
          for (let i = 0; i < 4; i++) curls[i] += (SPLAY_CURL - curls[i]) * charge;
          thumbCurl += (SPLAY_CURL - thumbCurl) * charge;
          fanMul = 1 + 2.6 * charge;
        } else if (gesture === 'converge') {
          for (let i = 0; i < 4; i++) curls[i] += (CONVERGE_CURL - curls[i]) * charge;
          thumbCurl += (CONVERGE_CURL - thumbCurl) * charge;
          tx -= sx * 1.1 * charge;
          ry = -sx * 0.35 * charge;
          fanMul = 1 - 0.3 * charge;
        }
      }

      // Pain flinch: recoil back + fingers splay open, quick.
      if (painT > 0 && !shieldClamp && dyingK <= 0) {
        const painK = painT / 0.35;
        for (let i = 0; i < 4; i++) curls[i] += (SPLAY_CURL - curls[i]) * painK * 0.8;
        thumbCurl += (SPLAY_CURL - thumbCurl) * painK * 0.8;
        fanMul = Math.max(fanMul, 1 + 2 * painK);
        tz -= 0.5 * painK;
      }

      // Shield raised: BOTH hands close into fists over their own eyes — the
      // invulnerability read (it can't be hurt while its eyes are hidden).
      if (shieldClamp) {
        tx = sx * 1.5; ty = 0.3; tz = 1.2; rz = sx * 0.15; ry = 0;
        for (let i = 0; i < 4; i++) curls[i] = SHIELD_CURL;
        thumbCurl = SHIELD_CURL;
        fanMul = 0.3;
      } else if (shieldOpenT > 0) {
        // Snap-open overshoot the instant the shield drops.
        const k = shieldOpenT / 0.25;
        for (let i = 0; i < 4; i++) curls[i] -= 0.18 * k;
        thumbCurl -= 0.18 * k;
      }

      // Setpiece (the crossing pass): hands spread WIDE — the fly-under
      // scale-contrast frame. Base gap at rest (2×5.4=10.8) already clears
      // the ≥7-unit contract; this adds extra spread + open fingers for read.
      if (setpieceK > 0 && !shieldClamp && dyingK <= 0) {
        tx += sx * 1.4 * setpieceK;
        ty += 0.7 * setpieceK;
        for (let i = 0; i < 4; i++) curls[i] += (SPLAY_CURL * 0.6 - curls[i]) * setpieceK;
        fanMul = Math.max(fanMul, 1 + 1.5 * setpieceK);
      }

      // Notice beat: fingers SNAP fully open (the eyes revealed wide) —
      // overrides everything else (only fires once, nothing else active then).
      if (noticeT > 0.5) {
        for (let i = 0; i < 4; i++) curls[i] = NOTICE_OPEN;
        thumbCurl = NOTICE_OPEN;
        fanMul = 1.3;
      }

      // Death: the hands drift TOGETHER toward centre and FOLD closed over
      // their own eyes — a mournful clasp, never an explosion.
      if (dyingK > 0) {
        tx = h.baseX + (sx * 1.0 - h.baseX) * dyingK;
        ty = h.baseY + (1.1 - h.baseY) * dyingK;
        tz = h.baseZ + (1.6 - h.baseZ) * dyingK;
        for (let i = 0; i < 4; i++) curls[i] = curls[i] + (1.0 - curls[i]) * dyingK;
        thumbCurl = thumbCurl + (1.0 - thumbCurl) * dyingK;
        fanMul = 1 - dyingK * 0.75;
        rz = rz * (1 - dyingK);
      }

      const posEase = Math.min(1, dt * 4);
      h.root.position.x += (tx - h.root.position.x) * posEase;
      h.root.position.y += (ty - h.root.position.y) * posEase;
      h.root.position.z += (tz - h.root.position.z) * posEase;
      const rotEase = Math.min(1, dt * 5);
      h.wrist.rotation.x += (rx - h.wrist.rotation.x) * rotEase;
      h.wrist.rotation.y += (ry - h.wrist.rotation.y) * rotEase;
      h.wrist.rotation.z += (rz - h.wrist.rotation.z) * rotEase;

      const poseEase = Math.min(1, dt * 8);   // "pose lerps at ~8/s"
      for (const f of h.fingers) {
        f.root.rotation.x += (curls[f.idx] * ROOT_ANGLE - f.root.rotation.x) * poseEase;
        f.child.rotation.x += (curls[f.idx] * ROOT_ANGLE * CHILD_RATIO - f.child.rotation.x) * poseEase;
        f.root.rotation.z += (f.fanBase * fanMul - f.root.rotation.z) * Math.min(1, dt * 6);
      }
      h.thumb.rotation.x += (thumbCurl * ROOT_ANGLE * 0.9 - h.thumb.rotation.x) * poseEase;

      // Pupils ride the gaze, per hand.
      h.pupil.position.set(gazeX * 0.10, 0.05 + gazeY * 0.06, 0.70);
      const pScale = h.pupil.scale.x + (pupilTarget - h.pupil.scale.x) * Math.min(1, dt * 7);
      h.pupil.scale.setScalar(Math.max(0.01, pScale));
    }

    // Crown: slow counter-rotation at two rates; sinks + dims in death.
    crownA.rotation.z += dt * 0.15 * (1 - dyingK);
    crownB.rotation.z -= dt * 0.22 * (1 - dyingK);
    const crownYTarget = CROWN_Y - dyingK * 0.5;
    crownA.position.y += (crownYTarget - crownA.position.y) * Math.min(1, dt * 2);
    crownB.position.y += (crownYTarget - crownB.position.y) * Math.min(1, dt * 2);
    bronzeMat.emissiveIntensity = 0.7 * (1 - dyingK * 0.6);   // tickFlash (LAST) overrides while a hit flash decays

    // Lichen seams shimmer on their own slow clock; they die with the body.
    seamMat.opacity = (0.35 + Math.sin(time * 1.3) * 0.12) * (1 - dyingK);

    // Orbiters — dark masonry drift.
    for (const o of orbiters) {
      const u = o.userData;
      u.ang += dt * u.speed;
      o.position.set(
        Math.cos(u.ang) * u.radius,
        u.baseY + Math.sin(time * 1.4 + u.tilt) * 0.5,
        Math.sin(u.ang) * u.radius
      );
      o.rotation.x += dt * 1.6;
      o.rotation.y += dt * 1.1;
    }
  }

  // Muzzle: bullets/FX originate between the hands, at chest height. On
  // `group` (not `rig`) so it ignores idle motion — a stable controller ref.
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0.2, 2.2);
  group.add(muzzle);

  return {
    group, muzzle, orbiters,
    setDissolve: setDissolveEmotive,
    setCharge,
    setAttackTell,
    setSetpiece,
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
