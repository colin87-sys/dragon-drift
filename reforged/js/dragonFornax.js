// FORNAX — "The banked furnace" (I0 STUB: coexist + rig conventions, NO spectacle)
//
// The roster's fire wyvern. Build sheet: reforged/FIRE-WYVERN-BUILDSHEET.md.
// Structural ranges it cites: reforged/DRAGON-ANATOMY-REFERENCE.md.
//
// ⚠ THIS IS I0. Every builder here is a deliberate PLACEHOLDER — an ugly dark blockout that
// flies. Beauty at I0 is scope creep (AAA-PIPELINE §5: tooling before spectacle). What I0 DOES
// buy, and the reason the stub is not just a cube, is that the whole creature is wired on the
// REAL rig conventions from commit one:
//   • the wing is a 3-segment pivot→mid→tip cascade with the −anchor wrist compensation and an
//     OUTER `lmirror` wrapper (never `pivot.scale.x = -1`), so the mirror-desync bug family
//     (DRAGON-DESIGN §5.5) is dead before any wing art exists to hide it;
//   • the tail is a nested `isBone` chain, so the rig's solver drives it rather than the geometry
//     being animated by hand;
//   • the legs are a helper INSIDE the torso, because the recipe registry has exactly four
//     registrars (dragonRecipe.js:30-44) and there is no `registerLegs`.
// Every dial is nullable + DEFAULT-OFF: only the `fornax` def opts in, so the shipped roster
// builds byte-identically (proved by hashing tricount before/after, not asserted by comment).
//
// I1 replaces slagAnvilTorso's blockout with the char-plate hull and FREEZES the attach contract
// (I3's builders build against it). I2 is the hero wing + flap. Fire arrives at I4 — nothing in
// this file emits light, by design: the identity is "withheld", and a stub that glows would be
// the LED-strip tell shipping before the creature does.

import * as THREE from 'three';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';

const TORSO_Y = 0.2;   // house constant — the torso mesh sits at y=0.2 and spine math adds it in

// --- I0 blockout helper ------------------------------------------------------
// A flat-shaded box. Named so a reader never mistakes stub geometry for authored form.
function blockout(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }

// --- TORSO: slagAnvilTorso ---------------------------------------------------
// I1 will make this the char-plate anvil (span-honest 5.5:1, shallow keel muscle wrap, humerus
// root outmassing femur root ~1.4x, lava-lake seam topology). I0 publishes only the ATTACH
// CONTRACT + a blockout, because every other builder mounts through that contract and the wing's
// numbers are all torso-relative (the notch-floor pixel probe is meaningless until the anvil
// fixes the frame — that is why the hero is I2, not I1).
function buildSlagAnvilTorso(def, model, bodyMat) {
  const group = new THREE.Group();
  const scale = model.anvilScale ?? 1;

  const body = blockout(0.72 * scale, 0.62 * scale, 2.0 * scale, bodyMat);
  body.position.set(0, TORSO_Y, 0);
  group.add(body);

  // Neck stub — ref §2 gives 8-9 cervicals, "slightly sinuous" (the joint COUNT is the tell, not
  // the length: birds run 14-15 and a deep S). I1 lofts it; I0 just gets the head to the right place.
  const neck = blockout(0.34 * scale, 0.34 * scale, 0.6 * scale, bodyMat);
  neck.position.set(0, TORSO_Y + 0.22 * scale, -1.05 * scale);
  group.add(neck);

  // emberHaunch — DEFAULT-OFF, and a HELPER, not a registered part (no `registerLegs` exists).
  // Ref §3: bat-style ABDUCTED, because tucked is invisible from behind-and-above and trailing
  // hides inside the tail outline and reads bird. Only abduction puts geometry in the wing-tail
  // wedge the chase cam actually looks through. Angles are the sheet's locked values; the ±7°
  // oscillation phase-lagged ~105° behind the wingbeat is an I3 concern (no rig loop owns it yet —
  // a named gap, not an oversight).
  if (model.emberHaunch) {
    for (const side of [1, -1]) {
      const hip = new THREE.Group();
      hip.position.set(0.30 * scale * side, TORSO_Y - 0.06 * scale, 0.52 * scale);
      hip.rotation.z = side * THREE.MathUtils.degToRad(45);   // hip abduct 45° (ref §3 band 35-55)
      const thigh = blockout(0.16 * scale, 0.42 * scale, 0.20 * scale, bodyMat);
      thigh.position.y = -0.21 * scale;
      hip.add(thigh);
      const shank = blockout(0.12 * scale, 0.34 * scale, 0.15 * scale, bodyMat);
      shank.position.y = -0.55 * scale;
      shank.rotation.x = THREE.MathUtils.degToRad(-98 + 90);  // knee 82° (ref §3 band 70-95)
      hip.add(shank);
      group.add(hip);
    }
  }

  // THE ATTACH CONTRACT (dragonTorso.js:17-26). I1 may refine these numbers; after I1 sign-off
  // they FREEZE, because brandSkull / firebrandTail / the wing root all build against them.
  const attach = {
    wingRoot: (side) => ({ x: 0.34 * scale * side, y: TORSO_Y + 0.30 * scale, z: -0.30 * scale }),
    headBase: { x: 0, y: TORSO_Y + 0.30 * scale, z: -1.42 * scale },
    tailAnchor: { y: 0.26 * scale, z: 1.02 * scale },
    keelTopAt: () => TORSO_Y + 0.31 * scale,
    halfWidthAt: () => 0.36 * scale,
    bodyMidY: TORSO_Y,
  };

  // coreGlow MUST be null, never a colour (the documented Solar crash, dragonVesper.js:319-321).
  return { group, attach, coreGlow: null };
}
registerTorso('slagAnvilTorso', buildSlagAnvilTorso);

// --- WINGS: underlitCrescentWings -------------------------------------------
// THE HERO, and therefore the thing I0 must NOT fake: the rig wiring is real here even though the
// membrane is a blockout. I2 builds the low taut crescent (archRise 0.12, wristT 0.30, bay sag
// ≤0.10 chord) and — critically — THE NOTCH FLOOR: digit tips project ≥0.15 bay chord beyond the
// between-tip membrane line, so the taut bays cannot collapse into the plane wing at chase
// distance (audit round 2). None of that exists yet.
function buildUnderlitCrescentWings(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const halfSpan = (model.wingSpan ?? 1.55) * (model.spanScale ?? 1);

  // I0 membrane material: DARK and NON-EMISSIVE. The top membrane stays black through the whole
  // build — `wingMembraneEmissive: 0x000000` on the def is what stops the shared rig's
  // unconditional boost term (dragon.js:1970-1990) lighting the wing TOPS on every boost, which
  // would break the dark-top law outside Surge entirely (audit B3).
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x1a1512, emissive: 0x000000, flatShading: true, roughness: 0.82, metalness: 0.02,
    side: THREE.DoubleSide, transparent: true, opacity: 0.94,
  });

  const pivots = {}, wingElements = [];
  for (const side of [1, -1]) {
    const root = attach.wingRoot(side);
    // Build CANONICAL (+X) for BOTH sides and reflect the LEFT with an OUTER wrapper. The
    // wingParts poser writes IDENTICAL L/R rotations and relies on an outer reflection to make
    // them symmetric; `pivot.scale.x = -1` is flip-then-rotate and desyncs .y/.z (wingsymprobe
    // Δ0.000 → ~3.0). This is the single most-recorded motion bug in the house ledger.
    const rootC = attach.wingRoot(1);
    const pivot = new THREE.Group();
    pivot.position.set(rootC.x, rootC.y, rootC.z);
    pivot.userData.wingRole = 'pivot';

    // 3-segment cascade: pivot = shoulder, mid = forearm (lagged curl), tip = the HAND folding at
    // the wrist. The hand carries the WHOLE connected membrane so the fold never tears it — any
    // geometry spanning the joint must keep all its vertices on one side of it.
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);

    // Carpal knuckle. wristT 0.30 is the sheet's differentiator against Vesper's 0.21 — but it
    // sits at the TOP of the house 0.2-0.3 band, and pulling the wrist INBOARD is what makes the
    // fold read (ref §4.4). I2's flapstrip must confirm the fold survives at 0.30 before the dial
    // locks; if it doesn't, the wrist moves inboard and archRise carries the planform split alone.
    const wristT = model.wristT ?? 0.30;
    const K = [halfSpan * wristT, 0.04, 0.02];

    const arm = new THREE.Group();
    const armBone = blockout(halfSpan * wristT, 0.07, 0.10, wingMat);
    armBone.position.set(halfSpan * wristT * 0.5, 0.02, 0.01);
    arm.add(armBone);
    mid.add(arm);                       // arm rides the forearm

    const hand = new THREE.Group();
    const handSheet = blockout(halfSpan * (1 - wristT), 0.03, 0.62, wingMat);
    handSheet.position.set(halfSpan * wristT + halfSpan * (1 - wristT) * 0.5, 0.04, 0.14);
    hand.add(handSheet);
    tip.position.set(K[0], K[1], K[2]);       // fold axis = the carpal knuckle
    hand.position.set(-K[0], -K[1], -K[2]);   // −anchor → assembled REST pose byte-identical
    tip.add(hand);

    if (side === -1) { const lmirror = new THREE.Group(); lmirror.scale.x = -1; lmirror.add(pivot); group.add(lmirror); }
    else group.add(pivot);

    const s = side === 1 ? 'R' : 'L';
    // The FX marker rides the FOLDING group (hand), not the body — otherwise trails emit from
    // where the wingtip used to be. It must also duplicate the geometry's own profile.
    const marker = new THREE.Object3D();
    marker.position.set(halfSpan, 0.04, 0.02);
    hand.add(marker);
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip;
    pivots['tipMarker' + s] = marker;
    wingElements.push({ root: [root.x, root.y, root.z], tip: [root.x + side * halfSpan, root.y + 0.04, root.z + 0.02], length: halfSpan, tipObj: marker });
  }
  return { group, spineMats, wingMat, parts: { ...pivots, wingElements } };
}
registerWings('underlitCrescentWings', buildUnderlitCrescentWings);

// --- HEAD: brandSkull --------------------------------------------------------
// I3 builds the dorsal-S profile (keel → brow dip → rising occiput) with the single dominant
// backswept occipital pair at 135° and ×0.66 decaying followers. Ref §6's load-bearing finding:
// orbit Ø ≈ 0.20 × skull length and NEGATIVELY allometric — the house instinct to enlarge eyes is
// backwards, and the glare belongs in brow BONE, not eyeball. Marked SETTLED in the sheet so a
// later pass doesn't "fix" the eyes bigger.
function buildBrandSkull(def, model, mats) {
  const group = new THREE.Group();
  const spineMats = [];
  const len = (model.skullLen ?? 0.42) * (model.headScale ?? 1);
  const skull = blockout(len * 0.62, len * 0.58, len, mats.bodyMat);   // W:H ~1.07 (ref §6 target 1.0-1.2)
  group.add(skull);
  // Eyes are NOT in the surge arrays — they are driven separately, and putting them in spineMats
  // is what makes "only the eyes glow in cruise" quietly false.
  const eye = blockout(len * 0.10, len * 0.10, len * 0.08, mats.eyeMat);
  eye.position.set(len * 0.22, len * 0.16, -len * 0.12);
  group.add(eye);
  const eyeL = eye.clone(); eyeL.position.x *= -1; group.add(eyeL);
  return { group, spineMats, headLength: len };
}
registerHead('brandSkull', buildBrandSkull);

// --- TAIL: firebrandTail -----------------------------------------------------
// No spade — the research killed it (Fox-Davies 1909: the barb is "a comparatively recent
// addition"; Tudor dragons "invariably" ended in a smooth blunt point). Silhouette duty moves to
// a dominant+decay dorsal ridge and the terminus is a blunt char-capped FIREBRAND that vents THE
// STOKE at I4. Ref §2: tail length has NO consistent natural relationship to torso — 2.6× is a
// declared composition choice, not a derived number, and the sheet says so.
function buildFirebrandTail(def, model, mats, anchor) {
  const group = new THREE.Group();
  group.position.set(0, anchor.y, anchor.z);
  const nJoints = model.tailJoints ?? 4;
  const segLen = ((model.tailLength ?? 1) * 2.6) / nJoints;

  // NESTED isBone chain — each child offset by the inter-joint vector. joints[0].isBone = true
  // makes it ROTATION-ONLY: position writes tear a connected loft.
  const segs = [];
  let parent = group;
  for (let i = 0; i < nJoints; i++) {
    const j = new THREE.Group();
    j.position.set(0, 0, i === 0 ? 0 : segLen);
    j.isBone = true;
    const taper = 1 - (i / nJoints) * 0.62;   // fattest segments sit AFT of the hip (ref §2)
    const stem = blockout(0.20 * taper, 0.20 * taper, segLen, mats.bodyMat);
    stem.position.z = segLen * 0.5;
    j.add(stem);
    parent.add(j);
    parent = j;
    segs.push(j);
  }
  return { group, segs };
}
registerTail('firebrandTail', buildFirebrandTail);
