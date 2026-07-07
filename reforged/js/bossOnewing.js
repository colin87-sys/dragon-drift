import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// ONEWING — "the Half That Would Not Die" (BOSS-DESIGN.md §5b/§5d slot 12, a
// Tier-4 WORLD-ENDER). EITHERWING's grief-stricken survivor, returned COLOSSAL and
// LOPSIDED, carrying its dead twin's kite-frame fused into a hole in its chest.
//
// SILHOUETTE-FIRST (§3b, Fable-signed sheet — PASS r3): the stranger read is "a
// broken one-winged thing with a hole torn in its chest"; the returning-player read
// is "EITHERWING's survivor carrying its dead twin's frame." Three carrying cues,
// each reaching the OUTLINE:
//   1. EXTREME ASYMMETRY — one vast 8-blade wing vs one atrophied 2-blade STUB.
//   2. a permanent ~12° LIST (a RIG tilt, never group.rotation).
//   3. the fused kite-frame reading as a HOLE torn in the chest (a real through-gap
//      in the torso; you see sky through the kite interior; the lower vertex pokes
//      below the belly outline). The frame is pure-black (a ghost), so a MANDATORY
//      thin ashen RIM (≥0.30u world) around the kite carries the read regardless of
//      backdrop or self-occlusion — the only thing that keeps a black-on-black
//      wireframe from vanishing (the sheet's #1 risk).
//
// ANTI-READS the sheet forbids: NOT EITHERWING (two symmetric darts), NOT ASHTALON
// (a symmetric two-fan raptor), NOT a generic angel/bird, and NOT a symmetric bird
// MID-BANK — the atrophied stub stays VISIBLE and clipped-looking so the asymmetry
// reads as DAMAGE, not a bank angle.
//
// PALETTE (Decision C): ashen GREY-ROSE, the most desaturated of the 11/12/13 rose
// triple — identity in the EMISSIVE rims (diffuse near-black, §3 law 3). The fused
// ghost-frame stays PURE BLACK (no glow); only its ashen rim is lit. The one eye is
// grief-DIMMED but still clears the bloom threshold (it stays the single focal).
//
// THE SCAR (§3.6, one asymmetric break): the SNAPPED BEAD-THREAD hanging off the
// fused frame — the severed link to its dead twin (glow-shape = a broken line).
//
// §4b SEVEN-CHANNEL CARRIER MAP — the single eye + the wing + the list carry it:
//   GAZE   — the eye tracks the dragon+rider (the mutual gaze is ITS claim),
//   BLINK  — the eye grief-DIMS and re-lights (a guttering mournful pulse),
//   CHARGE — the vast wing MANTLES before a volley (the silhouette tell) + the
//            snapped thread twitches,
//   EXPRESSION — sag (grief) / mantle (aggression) / eye-drops-to-frame (mourning),
//   FLINCH — the wing JERKS + the body lists HARDER + the eye flares,
//   NOTICE — the eye finds you, dips to the frame, returns,
//   DEATH  — the eye eases shut, the vast wing folds DOWN over the fused frame
//            (covering its dead twin), the list collapses, it drifts down.
//
// CONTRACT: boss.js stomps group.rotation (placeGroup) + kit.setDissolve owns
// group.scale — every animated part lives on `rig` (which also carries the LIST) or
// a named sub-pivot (wingPivot / stubPivot / frameGroup / onewingEye), never on
// `group` itself.

export function buildOnewing(def, quality = 1) {
  const accent = def.accent ?? 0x6c4c78;   // dim ashen mauve-rose (~305°, clears danger-magenta) — identity in the emissive rims
  const glow = def.glow ?? 0x8a6b7e;        // a touch paler — shield rim / shards / backlight
  const lowQ = quality < 0.75;
  const strip = stripForMerge;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // Shield wraps the CORE (the torso weak point), not the vast wing — the machinery
  // sweeps well outside the ward. hpBar rides high above the head; scaled back to
  // roster width against the big def.scale.
  const kit = createBossCommon(def, quality, {
    shieldRadius: 5.4, shieldY: 3.4, hpBarY: 12.4, hpBarZ: 1.2, hpBarScale: 0.62,
    shieldRimStrength: 0.16, shieldCageOpacity: 0.5,
  });
  const { group, track } = kit;
  group.userData.archetype = 'onewing';   // guards the legacy-fallback coexist path (tests/boss.mjs)

  // THE LIST — a permanent ~12° cant toward the heavy wing (compensating flight).
  // A RIG tilt, NEVER group.rotation (placeGroup owns that). Death collapses it.
  const LIST = -12 * Math.PI / 180;
  const rig = new THREE.Group();
  rig.name = 'onewingRig';
  rig.rotation.z = LIST;
  group.add(rig);

  const mergeO = (parts, label) => {
    const geo = mergeGeometries(parts, false);
    if (!geo) throw new Error(`buildOnewing: ${label} mergeGeometries returned null (attribute mismatch)`);
    return geo;
  };

  // ---- Painted value tiers (§3.4 — the sun can't shade the front face). Diffuse
  // runs near-black grey-rose; the ashen identity lives ONLY in the emissive rims +
  // the eye. Grey-rose is DESATURATED so its bloom halo never lands in the danger-
  // magenta band — it reads as a dim ASHEN edge, not a second focal (ONE-GLOW). ----
  const bodyMat = track(new THREE.MeshStandardMaterial({
    color: 0x0f0e12, emissive: accent, emissiveIntensity: 0.09, roughness: 0.85, metalness: 0.08, flatShading: true,
  }));
  // LIT-SILHOUETTE rims (§5d L140): the identity is the EDGE. Ashen grey-rose at ei
  // 0.7 (the lit tier — deliberately below the eye focal, grief-dim, but a hard floor
  // that reads). Two tiers: the living wing burns a step brighter than the body.
  const RIM_ASHEN = accent;
  const rimMat = track(new THREE.MeshStandardMaterial({
    color: 0x18171c, emissive: RIM_ASHEN, emissiveIntensity: 0.7, roughness: 0.55, metalness: 0.18, flatShading: true,
  }));
  const rimDimMat = track(new THREE.MeshStandardMaterial({
    color: 0x121116, emissive: RIM_ASHEN, emissiveIntensity: 0.4, roughness: 0.6, metalness: 0.15, flatShading: true,
  }));
  // INVERTED-HULL OUTLINE (BackSide): a scaled backface copy draws a CONTINUOUS ashen
  // silhouette line around the torso from every angle (the line-drawing read, §5d).
  const outlineMat = track(new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: RIM_ASHEN, emissiveIntensity: 0.85, roughness: 0.6, metalness: 0.0, side: THREE.BackSide,
  }));
  // Wing-blade tiers: near-black plates with ashen rims (the lit edges carry the fan).
  const bladeLeadMat = track(new THREE.MeshStandardMaterial({
    color: 0x151419, emissive: RIM_ASHEN, emissiveIntensity: 0.62, roughness: 0.5, metalness: 0.2, flatShading: true,
  }));
  bladeLeadMat.side = THREE.DoubleSide;
  const bladeTrailMat = track(new THREE.MeshStandardMaterial({
    color: 0x0d0c10, emissive: RIM_ASHEN, emissiveIntensity: 0.34, roughness: 0.6, metalness: 0.15, flatShading: true,
  }));
  bladeTrailMat.side = THREE.DoubleSide;
  const rootMat = track(new THREE.MeshStandardMaterial({
    color: 0x0b0a0d, emissive: RIM_ASHEN, emissiveIntensity: 0.16, roughness: 0.7, metalness: 0.12, flatShading: true,
  }));
  rootMat.side = THREE.DoubleSide;

  // THE FUSED FRAME — pure BLACK (a ghost; the diffuse is black, no emissive). It
  // reads as the void/hole, NOT by its own light. The MANDATORY ashen rim (a separate
  // material) is what guarantees it never vanishes black-on-black.
  const frameEdgeMat = track(new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: 0x000000, emissiveIntensity: 0.0, roughness: 0.95, metalness: 0.0, flatShading: true,
  }));
  frameEdgeMat.side = THREE.DoubleSide;
  // The rim is a dead, DIM ashen (below the wing rims — it's a corpse, not lit like the
  // living half) but a hard floor: ei 0.5, ≥0.30u world thick, full kite perimeter.
  const frameRimMat = track(new THREE.MeshStandardMaterial({
    color: 0x141318, emissive: RIM_ASHEN, emissiveIntensity: 0.5, roughness: 0.65, metalness: 0.1, flatShading: true,
  }));
  frameRimMat.side = THREE.DoubleSide;

  // ==================================================================
  // BLADE MACHINERY (the vast wing + the stub) — the ASHTALON scythe kernel,
  // OVERSIZED. A curved tapered scythe extruded with bevel facets + a raised rib.
  // ==================================================================
  const bladeExtrude = { depth: 0.16, bevelEnabled: !lowQ, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: lowQ ? 1 : 2, steps: 1 };
  const bladeShape = (len, w) => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(w * 0.62, len * 0.34, w * 0.18, len * 0.82);   // leading convex edge
    s.lineTo(0, len);                                                 // the point
    s.quadraticCurveTo(-w * 0.5, len * 0.5, -w * 0.5, len * 0.16);    // trailing concave scythe hollow
    s.lineTo(0, 0);
    return s;
  };
  const makeBladeGeo = (len, w) => {
    const g = strip(new THREE.ExtrudeGeometry(bladeShape(len, w), bladeExtrude));
    g.translate(0, 0, -0.08);
    const rib = strip(new THREE.BoxGeometry(Math.max(0.08, w * 0.16), len * 0.6, 0.15));
    rib.translate(0, len * 0.33, 0.095);   // raised spine relief
    return mergeO([g, rib], 'blade');
  };

  // ---- THE VAST LIVING WING (right shoulder, sx=+1): EIGHT scythe-blades marching
  // along an ARM arc (roots MARCH, never one sunburst point — feathers, not a fan
  // hub), oversized so the wing ALONE spans ≥26 on-screen units at station. On a
  // named `wingPivot` (mantle/thump/fold). Covert lag-blades at the base for
  // articulation. Ashen rims on the outer (leading) half. ----
  const WING_N = lowQ ? 6 : 8;
  const wingBlades = [];
  function buildVastWing() {
    const shoulder = new THREE.Object3D();
    shoulder.name = 'wingPivot';        // telegraph gate finds this by name (setCharge hinges it)
    shoulder.position.set(1.4, 6.1, -0.2);
    rig.add(shoulder);

    // Root plate — the solid inner "arm" the blades sprout from.
    const rootShape = new THREE.Shape();
    rootShape.moveTo(0.1, -0.7);
    rootShape.quadraticCurveTo(2.2, -0.6, 3.6, 1.2);
    rootShape.quadraticCurveTo(2.5, 1.3, 1.4, 1.0);
    rootShape.quadraticCurveTo(0.5, 0.3, 0.1, -0.7);
    const rootPlate = strip(new THREE.ExtrudeGeometry(rootShape, { ...bladeExtrude, depth: 0.26 }));
    rootPlate.translate(0, 0, -0.12);
    shoulder.add(new THREE.Mesh(rootPlate, rootMat));

    // Blade comb: roots march out along the arm; the fan opens up-and-out; lengths
    // SWELL toward the outer scythe tips (the outer, longest reach = the vast span).
    for (let i = 0; i < WING_N; i++) {
      const t = i / (WING_N - 1);
      const pivot = new THREE.Object3D();
      pivot.name = 'bladePivot';
      pivot.position.set(1.6 + t * 5.4, 0.2 + t * 3.1, 0.1 + i * 0.14);   // z-stagger so gaps don't self-occlude
      pivot.rotation.z = -0.55 + (t - 0.5) * 1.15;                        // fan ±0.57 rad, mean tilted up-out
      shoulder.add(pivot);
      const len = 4.4 + Math.sin((0.28 + t * 0.72) * Math.PI) * 3.4;      // 4.4 → ~7.8 outer scythe (the vast reach)
      const isLead = t >= 0.5;
      const mesh = new THREE.Mesh(makeBladeGeo(len, 0.72), isLead ? bladeLeadMat : bladeTrailMat);
      mesh.rotation.x = 0.1;
      pivot.add(mesh);
      wingBlades.push({ pivot, base: pivot.rotation.z, idx: i, len, isLead });
    }

    // Covert lag-blades — short feathers at the wing base on their OWN lag pivots
    // (they trail the wing motion a beat behind — articulation, §5g richness).
    const coverts = [];
    for (let i = 0; i < (lowQ ? 2 : 3); i++) {
      const cp = new THREE.Object3D();
      cp.name = 'covertPivot';
      cp.position.set(0.6 + i * 0.5, -0.7 - i * 0.2, -0.06 - i * 0.06);
      cp.rotation.z = -1.9 - i * 0.16;
      shoulder.add(cp);
      const cm = new THREE.Mesh(makeBladeGeo(1.7 + i * 0.24, 0.5), bladeTrailMat);
      cm.rotation.x = 0.1;
      cp.add(cm);
      coverts.push({ pivot: cp, base: cp.rotation.z });
    }
    return { shoulder, coverts };
  }
  const vastWing = buildVastWing();

  // ---- THE ATROPHIED STUB (left shoulder, sx=-1): TWO short, CLIPPED blades on a
  // named `stubPivot` — visibly present + damaged-looking so the asymmetry reads as
  // DAMAGE, never a symmetric bird banking (the sheet's banking-bird guard). It
  // TWITCHES (a withered, involuntary flutter). ----
  const stubBlades = [];
  function buildStub() {
    const shoulder = new THREE.Object3D();
    shoulder.name = 'stubPivot';
    shoulder.position.set(-1.4, 6.0, -0.2);
    shoulder.scale.x = -1;   // mirror the canonical +X-out build
    rig.add(shoulder);
    // A tiny withered root nub.
    const nub = strip(new THREE.OctahedronGeometry(0.6, 1));
    nub.scale(0.9, 0.7, 0.6); nub.translate(0.4, 0.1, 0);
    shoulder.add(new THREE.Mesh(nub, rootMat));
    // TWO clipped blade REMNANTS — short scythe-blades snapped off at a jagged angle
    // (a chopped WING, not a mechanical arm — the Fable CP1 gate note): each is a real
    // blade, truncated short, with a small angled shear-flake at the break, no wide
    // crossbar. They read as two stunted feathers = a withered 2-blade wing.
    const clip = [2.1, 1.5];
    for (let i = 0; i < 2; i++) {
      const pivot = new THREE.Object3D();
      pivot.name = 'stubBladePivot';
      pivot.position.set(0.7 + i * 0.5, 0.3 + i * 0.5, 0.05 + i * 0.12);
      pivot.rotation.z = -0.6 - i * 0.55;
      shoulder.add(pivot);
      // A short blade sheared at a slant — a small angled flake at the break sells the
      // SNAP without reading as a T-cap/hand.
      const bl = makeBladeGeo(clip[i], 0.56);
      const shear = strip(new THREE.BoxGeometry(0.36, 0.16, 0.2)); shear.rotateZ(0.5); shear.translate(0.12, clip[i] - 0.12, 0.02);
      const mesh = new THREE.Mesh(mergeO([bl, shear], 'stubblade'), rimDimMat);
      mesh.rotation.x = 0.1;
      pivot.add(mesh);
      stubBlades.push({ pivot, base: pivot.rotation.z, idx: i });
    }
    return { shoulder };
  }
  const stub = buildStub();

  // ==================================================================
  // THE WRAITH TORSO — an OPEN chest: a hooded head, a shoulder yoke, two thin side
  // ribs down to a belly bar, with the CHEST HOLLOW between them (the fused frame
  // fills it; you see sky through the kite interior). Merged relief on one material.
  // ==================================================================
  function torsoGeo() {
    const parts = [];
    // Shoulder yoke — the broad bar the wing + stub root into (bridges them so the
    // flood-filled silhouette is ONE connected wraith, not floating parts).
    const yoke = strip(new THREE.BoxGeometry(3.6, 1.2, 1.1)); yoke.translate(0, 6.0, 0);
    parts.push(yoke);
    // Two shoulder pads angled down-out toward each wing root.
    const padL = strip(new THREE.BoxGeometry(1.3, 0.9, 0.9)); padL.rotateZ(0.4); padL.translate(-1.5, 6.2, 0.05); parts.push(padL);
    const padR = strip(new THREE.BoxGeometry(1.3, 0.9, 0.9)); padR.rotateZ(-0.4); padR.translate(1.5, 6.2, 0.05); parts.push(padR);
    // Two THIN side ribs framing the OPEN chest — they run yoke → pelvis at the OUTER
    // edge (x±1.75, just outside the kite's ±1.55 side vertices) so the whole chest
    // cavity between them is EMPTY (sky through it). They converge slightly toward the
    // pelvis (a ribcage that lost its sternum). NOTHING crosses the centre — the fused
    // kite is a genuine HOLE, not a filled cage (the Fable CP1 gate fix).
    const ribL = strip(new THREE.BoxGeometry(0.44, 8.4, 0.5)); ribL.rotateZ(0.11); ribL.translate(-1.75, 2.0, -0.15); parts.push(ribL);
    const ribR = strip(new THREE.BoxGeometry(0.44, 8.4, 0.5)); ribR.rotateZ(-0.11); ribR.translate(1.75, 2.0, -0.15); parts.push(ribR);
    // Pelvis / hip mass — the lower close, seated BELOW the kite's bottom vertex
    // (y≈−0.7) so the vertex hangs into open sky before it and the interior stays
    // hollow; a keeled taper down. Kept clear of the kite interior.
    const belly = strip(new THREE.BoxGeometry(2.0, 0.95, 0.85)); belly.translate(0, -1.95, 0); parts.push(belly);
    const keel = strip(new THREE.ConeGeometry(0.58, 1.7, 4)); keel.rotateX(Math.PI); keel.rotateY(0.78); keel.translate(0, -3.0, 0.15); parts.push(keel);
    // Neck — connects the yoke up to the head.
    const neck = strip(new THREE.CylinderGeometry(0.5, 0.66, 1.5, 6)); neck.translate(0, 7.1, 0.05); parts.push(neck);
    return mergeO(parts, 'torso');
  }
  const torso = new THREE.Mesh(torsoGeo(), bodyMat);
  torso.name = 'onewingTorso';
  rig.add(torso);
  // Inverted-hull outline around the torso — the continuous ashen line-drawing.
  const torsoOutline = new THREE.Mesh(torsoGeo(), outlineMat);
  torsoOutline.scale.setScalar(1.05);
  rig.add(torsoOutline);

  // ---- THE HOODED HEAD — a small cowl behind the eye (the eye seats proud of it);
  // a hooded brow that frames the one survivor's eye as the focal. ----
  function headGeo() {
    const parts = [];
    const skull = strip(new THREE.OctahedronGeometry(1.0, lowQ ? 1 : 2));
    skull.scale(0.9, 0.95, 0.85); skull.translate(0, 8.2, -0.35);
    parts.push(skull);
    // A hood/cowl swept back over the skull.
    const hood = strip(new THREE.ConeGeometry(1.05, 1.7, 6)); hood.rotateX(-0.35); hood.translate(0, 8.7, -0.6);
    parts.push(hood);
    // A heavy brow ledge over the eye (seats the eye recessed → reads as a face,
    // not a lamp) + a hooked jaw below.
    const brow = strip(new THREE.BoxGeometry(1.25, 0.34, 0.6)); brow.rotateX(0.3); brow.translate(0, 8.55, 0.5); parts.push(brow);
    const jaw = strip(new THREE.ConeGeometry(0.44, 1.2, 3)); jaw.rotateX(2.2); jaw.rotateZ(0.3); jaw.translate(0, 7.5, 0.55); parts.push(jaw);
    return mergeO(parts, 'head');
  }
  const head = new THREE.Mesh(headGeo(), bodyMat);
  head.name = 'onewingHead';
  rig.add(head);
  const headOutline = new THREE.Mesh(headGeo(), outlineMat);
  headOutline.scale.setScalar(1.05);
  rig.add(headOutline);

  // ==================================================================
  // THE FUSED KITE-FRAME (the dead twin, fused into the open chest) — a named
  // `frameGroup` (destructible-ready for CP2). EITHERWING's kite OUTLINE, eyeless,
  // pure black. It CROSSES the belly outline (its lower vertex pokes below the torso)
  // and its interior is genuine NEGATIVE SPACE (sky through it). A MANDATORY thin
  // ashen RIM (≥0.30u world, full perimeter) is the only thing that guarantees the
  // black-on-black ghost never vanishes.
  // ==================================================================
  const frameGroup = new THREE.Group();
  frameGroup.name = 'frameGroup';
  frameGroup.position.set(0, 2.6, 0.55);   // in the chest opening, proud of the ribs
  rig.add(frameGroup);

  // The kite silhouette (a stretched diamond — EITHERWING's dart, stood upright).
  // Half-extents: tall + narrow, the lower vertex reaching DOWN past the belly.
  const KW = 1.55, KTOP = 2.3, KBOT = 3.3;   // top vertex +2.3, bottom vertex −3.3 (pokes below the belly bar at y≈0)
  const kitePts2D = [
    [0, KTOP], [KW, 0], [0, -KBOT], [-KW, 0],
  ];
  // The pure-black ghost EDGE bars — thin box bars along each kite edge ONLY. The
  // interior is left EMPTY (no cross-spar, no rungs) so you see sky THROUGH the kite:
  // a hole torn in the chest, not a filled cage (the Fable CP1 gate fix). The dead
  // twin's "spine" is told by a SHORT SNAPPED spar-stub hanging off the top vertex
  // (broken, ~28% down, then nothing) — the break, without crossing the interior.
  function frameEdgesGeo() {
    const parts = [];
    const barW = 0.16;   // thin ghost wire
    for (let i = 0; i < 4; i++) {
      const a = kitePts2D[i], b = kitePts2D[(i + 1) % 4];
      const ax = a[0], ay = a[1], bx = b[0], by = b[1];
      const dx = bx - ax, dy = by - ay;
      const len = Math.hypot(dx, dy);
      const bar = strip(new THREE.BoxGeometry(barW, len, barW));
      bar.rotateZ(Math.atan2(dy, dx) - Math.PI / 2);
      bar.translate((ax + bx) / 2, (ay + by) / 2, 0);
      parts.push(bar);
    }
    // The SNAPPED spar-stub — a short broken spine dropping from the top vertex, then
    // sheared off (it does NOT reach the interior/centre — the hole stays open).
    const stubLen = KTOP * 0.55;
    const spar = strip(new THREE.BoxGeometry(barW, stubLen, barW)); spar.translate(0, KTOP - stubLen / 2, -0.02);
    parts.push(spar);
    return mergeO(parts, 'frameEdges');
  }
  const frameEdges = new THREE.Mesh(frameEdgesGeo(), frameEdgeMat);
  frameEdges.name = 'frameEdges';
  frameGroup.add(frameEdges);

  // THE MANDATORY ASHEN RIM — a slightly larger kite outline in thin ashen bars
  // (≥0.30u world), sitting a hair proud/around the black edges so the frame ALWAYS
  // reads as a ghost-outline, never a modeling void. This is load-bearing (the sheet
  // gate made it mandatory): it carries the read on any backdrop, and even when the
  // living wing sweeps behind and fills the hole with wing-black.
  function frameRimGeo() {
    const parts = [];
    const rimW = 0.34;   // ≥0.30u world floor
    const scl = 1.12;    // just outside the black edge
    for (let i = 0; i < 4; i++) {
      const a = kitePts2D[i], b = kitePts2D[(i + 1) % 4];
      const ax = a[0] * scl, ay = a[1] * scl, bx = b[0] * scl, by = b[1] * scl;
      const dx = bx - ax, dy = by - ay;
      const len = Math.hypot(dx, dy);
      const bar = strip(new THREE.BoxGeometry(rimW, len + rimW, 0.22));
      bar.rotateZ(Math.atan2(dy, dx) - Math.PI / 2);
      bar.translate((ax + bx) / 2, (ay + by) / 2, 0.06);
      parts.push(bar);
    }
    return mergeO(parts, 'frameRim');
  }
  const frameRim = new THREE.Mesh(frameRimGeo(), frameRimMat);
  frameRim.name = 'frameRim';
  frameGroup.add(frameRim);

  // ==================================================================
  // THE ONE EYE — EITHERWING's eye rig, GRIEF-DIMMED. A bright RING (sclera) around a
  // wide dark PUPIL + an ultra-hot catchlight GLINT that alone carries the focal peak,
  // so the sclera can stay dim (grief) while the eye still reads as the single focal.
  // Named `onewingEye`. Tracks the dragon; guts/re-lights (the blink-analog).
  // ==================================================================
  const EYE_HOT = 2.2;      // grief-dim sclera (< EITHERWING's 2.1) — still clears the pupil bloom
  const GLINT_HOT = 17.0;   // the catchlight (the G1 focal peak) — a sharp WET pinpoint that clears ≥250 even
                            // through LUMEN MIRE's fog (which dilutes the peak — the EITHERWING/Amber-Wastes lesson)
                            // while the SCLERA stays grief-dim; a mournful eye can still hold a bright catchlight
  const EYE_BASE = new THREE.Color(0xf3e6ea);   // a cold, ashen white (grief), not warm
  const eyeRig = new THREE.Group();
  eyeRig.name = 'onewingEye';
  eyeRig.position.set(0, 8.35, 0.85);
  eyeRig.scale.setScalar(1.2);
  const orbMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
  orbMat.toneMapped = false;
  orbMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.26, lowQ ? 12 : 18, lowQ ? 8 : 14), orbMat);
  eyeRig.add(orb);
  // Iris ring (the eye reads as an EYE). A NEUTRAL cool grey emissive (NOT the
  // saturated accent) — it sits directly under the white-hot glint, and a saturated
  // rose iris + the hot bloom mix into a hot-pink fringe that lands in the danger-
  // magenta band (the G3 intrusion). Neutral grey keeps the eye's bloom achromatic.
  const irisMat = track(new THREE.MeshStandardMaterial({
    color: 0x201e24, emissive: 0x2c2630, emissiveIntensity: 0.7, roughness: 0.5, metalness: 0.25, flatShading: true,
  }));
  const irisParts = [strip(new THREE.TorusGeometry(0.34, 0.08, 8, lowQ ? 16 : 24))];
  const nPetal = lowQ ? 6 : 10;
  for (let i = 0; i < nPetal; i++) {
    const a = (i / nPetal) * Math.PI * 2;
    const p = strip(new THREE.ConeGeometry(0.045, 0.16, 3));
    p.rotateX(Math.PI / 2); p.translate(0, 0, -0.08);
    p.rotateZ(a); p.translate(Math.cos(a) * 0.34, Math.sin(a) * 0.34, 0);
    irisParts.push(p);
  }
  const iris = new THREE.Mesh(mergeO(irisParts, 'iris'), irisMat);
  iris.name = 'eyeIris';
  eyeRig.add(iris);
  // The dark PUPIL, seated PROUD so the orb reads as a bright ring around a dark
  // centre. Kept modest so the bright sclera ring stays THICK (a thin ring goes
  // sub-pixel at fight distance and drops out of the geometry-mask the G1 gate reads).
  const pupilMat = track(new THREE.MeshBasicMaterial({ color: 0x0e0810 }));
  pupilMat.toneMapped = false;
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), pupilMat);
  pupil.name = 'eyePupil';
  pupil.position.z = 0.17;
  pupil.renderOrder = 6;
  eyeRig.add(pupil);
  // The catchlight GLINT — the wet focal CORE, proud of the pupil and CENTRED so it is
  // never eaten by the pupil. Sized a solid multi-pixel disc (0.3) so its opaque
  // geometry — not just its bloom halo — reliably covers mask pixels even at the far
  // reveal-hold framing (the G1 gate reads maxLum only INSIDE the per-triangle
  // geometry mask, so a sub-pixel catchlight's 255 bloom falls OUTSIDE it and the
  // focal drops; a solid disc keeps the peak inside the mask every frame).
  const glintMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
  glintMat.toneMapped = false;
  glintMat.color.setScalar(GLINT_HOT);
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), glintMat);
  glint.name = 'eyeGlint';
  glint.position.set(-0.05, 0.06, 0.44);
  glint.renderOrder = 8;
  eyeRig.add(glint);
  rig.add(eyeRig);

  // ==================================================================
  // THE SNAPPED BEAD-THREAD (the SCAR, §3.6) — hangs SNAPPED off the fused frame's
  // top vertex, the severed link to its dead twin. Built as thin TUBE/strip geometry
  // (NOT LineSegments — those go sub-pixel): segment width ≥0.12u, beads ≥0.18u. It
  // sways slack (a broken cord), never taut. Ashen emissive (the broken-line glow).
  // ==================================================================
  const threadMat = track(new THREE.MeshStandardMaterial({
    color: 0x161519, emissive: RIM_ASHEN, emissiveIntensity: 0.55, roughness: 0.7, metalness: 0.1, flatShading: true,
  }));
  const beadMat = track(new THREE.MeshBasicMaterial({ color: new THREE.Color(glow).multiplyScalar(0.5) }));
  const threadGroup = new THREE.Group();
  threadGroup.name = 'snappedThread';
  // anchored at the frame's top vertex, hanging down-and-out (broken, slack)
  threadGroup.position.set(0, KTOP - 0.1, 0.06);
  frameGroup.add(threadGroup);
  const THREAD_SEG = lowQ ? 4 : 6;
  const threadSegs = [];
  {
    let parent = threadGroup;
    for (let i = 0; i < THREAD_SEG; i++) {
      const seg = new THREE.Object3D();
      seg.name = 'threadSeg';
      seg.position.set(0, i === 0 ? 0 : -0.5, 0);
      seg.rotation.z = 0.12 * (i + 1);   // slack droop, curling
      parent.add(seg);
      const link = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 5), threadMat);   // width ≥0.12u (radius 0.07 → 0.14 dia)
      link.position.y = -0.25;
      seg.add(link);
      if (i % 2 === 0) {
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 5), beadMat);   // dia 0.22u ≥ 0.18u floor
        bead.position.y = -0.5;
        seg.add(bead);
      }
      threadSegs.push({ seg, base: seg.rotation.z });
      parent = seg;
    }
    // the SNAPPED end — a frayed bead dangling loose off the last link (the break)
    const frayed = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), beadMat);
    frayed.position.y = -0.5;
    parent.add(frayed);
  }

  // ==================================================================
  // ORBITERS — grief ASH-MOTES drifting off the fused frame (satellites stay DARK/
  // dim, §3 law 8). Additive so they never read as black holes on a bright sky. ≥2,
  // tick-animated (the boss-test contract).
  // ==================================================================
  const moteMat = track(new THREE.MeshBasicMaterial({
    color: 0x1c1a22, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  moteMat.toneMapped = false;
  const moteGeo = strip(new THREE.OctahedronGeometry(0.13, 0));
  const orbiters = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(moteGeo, moteMat);
    m.userData = { ang: (i / 3) * Math.PI * 2, radius: 1.4 + i * 0.5, speed: 0.5 + i * 0.15, tilt: i * 0.7, cy: 2.6 + i * 0.6 };
    rig.add(m);
    orbiters.push(m);
  }

  // Muzzle nodes: the LIVING volley fires from the wing (updated to the wing's world
  // reach each tick); the GHOST volley fires from the fused frame (CP2 reads it). On
  // `group` (stable controller ref), not `rig`.
  const muzzle = new THREE.Object3D();
  muzzle.name = 'muzzle';
  muzzle.position.set(1.6, 4.0, 2.4);
  group.add(muzzle);
  const ghostMuzzle = new THREE.Object3D();
  ghostMuzzle.name = 'ghostMuzzle';
  ghostMuzzle.position.set(0, 2.6, 2.0);
  group.add(ghostMuzzle);

  kit.finalize();

  // Bind the hit-flash to the wing rim (a struck ONEWING flares its living edge).
  kit.flashBind(bladeLeadMat, 0.62);

  // ==================================================================
  // STATE + ANIMATION
  // ==================================================================
  let charge = 0;          // 0..1 — the wing MANTLES (the silhouette tell)
  let dyingK = 0;          // 0..1 — the grief death (set by setDissolveEmotive)
  let noticeT = 0;         // notice() pulse
  let flinchT = 0;         // flinch kick (from flash/hurt)
  let gazeTX = 0, gazeTY = 0, gazeX = 0, gazeY = 0;   // eye gaze target + eased
  let blinkT = 0, nextBlink = 2.4;                    // grief-dim gutter (blink-analog)
  let mournT = 0;          // eased "eye drops to the frame" (mourning) weight
  let nextMourn = 4.5;
  const _aimDir = new THREE.Vector3(), _zAxis = new THREE.Vector3(0, 0, 1);
  let entAimSet = false; const _entAim = new THREE.Vector3();

  function setCharge(k) { charge = clamp(k, 0, 1); }
  function setGaze(nx, ny) { gazeTX = clamp(nx, -1, 1); gazeTY = clamp(ny, -1, 1); }
  function notice() { noticeT = 1.0; blinkT = 0; nextBlink = 3; }
  function setEntranceAim(x, y, z) { if (x == null) { entAimSet = false; } else { _entAim.set(x, y, z); entAimSet = true; } }

  function tickBody(dt, time) {
    // --- RUBATO SAG: the grief REST look — it visibly SAGS and re-lifts between
    // beats (grief as arrhythmia, not a still pause). A slow vertical breath + a
    // subtle list-deepening on the sag. Suppressed under charge (it draws up to
    // mantle) and death.
    const sag = (Math.sin(time * 0.9) * 0.5 + 0.5) * (1 - charge) * (1 - dyingK);
    rig.position.y = -sag * 0.22;
    // The LIST: base cant, deepened on the sag + hard on flinch, collapsing in death.
    const listExtra = sag * 0.05 + flinchT * 0.14;
    rig.rotation.z = LIST * (1 - dyingK * 1.15) - listExtra;   // death: list collapses through 0 and past
    rig.rotation.x = dyingK * 0.5;                              // drifts forward/down as it dies

    // --- THE VAST WING: idle sway + MANTLE on charge (draws up + fans open — the
    // silhouette tell), JERK on flinch, and FOLD DOWN over the frame in death (the
    // grief beat — the wing covering its dead twin).
    const sway = Math.sin(time * 1.1) * 0.06;
    const mantle = charge * 0.55 + (noticeT > 0.4 ? 0.35 : 0);
    // GRIEF DEATH FOLD — ramps in HARD and EARLY (ease-in on dyingK) so the vast wing
    // visibly SWINGS DOWN and FORWARD over the fused frame, covering its dead twin —
    // a POSE change, not a whiteout (the Fable CP1 gate note). By dyingK≈0.5 the wing
    // is already most of the way folded across the chest.
    const foldK = Math.min(1, dyingK * 1.9);
    const fold = (foldK * foldK * (3 - 2 * foldK)) * 2.35;   // smoothstep → a big, decisive fold arc
    vastWing.shoulder.rotation.z = -0.1 + sway + mantle - fold;
    vastWing.shoulder.rotation.x = -flinchT * 0.5 + fold * 0.55;   // swings FORWARD over the chest
    for (const b of wingBlades) {
      const spread = mantle * (0.12 + b.idx * 0.03);         // blades fan wider on mantle
      const flutter = Math.sin(time * 1.4 + b.idx * 0.6) * 0.04 * (1 - dyingK);
      b.pivot.rotation.z = b.base - spread + flutter - fold * (0.12 + b.idx * 0.03);   // blades curl in as it folds (a closing hand)
    }
    for (const c of vastWing.coverts) c.pivot.rotation.z = c.base + Math.sin(time * 1.0 + c.pivot.position.x) * 0.12 - flinchT * 0.4;

    // --- THE STUB: a withered TWITCH (involuntary), harder on flinch; folds too.
    stub.shoulder.rotation.z = 0.1 + Math.sin(time * 2.7) * 0.05 * (1 - dyingK) - flinchT * 0.3 - dyingK * 0.6;
    for (const b of stubBlades) {
      b.pivot.rotation.z = b.base + Math.sin(time * 3.3 + b.idx * 1.5) * 0.14 * (1 - dyingK) - flinchT * 0.5;
    }

    // --- THE SNAPPED THREAD: sways slack (a broken cord), TWITCHES before a volley
    // (the ghost-half tell — charge), and hangs limp in death.
    const threadTwitch = charge * 0.3 + flinchT * 0.4;
    for (let i = 0; i < threadSegs.length; i++) {
      const ts = threadSegs[i];
      ts.seg.rotation.z = ts.base + Math.sin(time * 1.6 + i * 0.8) * (0.16 + threadTwitch) * (1 - dyingK * 0.7)
        + threadTwitch * 0.2;
    }

    // --- ORBITERS: grief ash drifting around the fused frame.
    for (const m of orbiters) {
      const u = m.userData;
      u.ang += dt * u.speed;
      const r = u.radius * (1 + Math.sin(time * 0.7 + u.tilt) * 0.15);
      m.position.set(Math.cos(u.ang) * r, u.cy + Math.sin(u.ang * 1.3 + u.tilt) * 0.5, 0.6 + Math.sin(u.ang) * r * 0.4);
      const s = 0.7 + Math.sin(time * 2 + u.tilt) * 0.3;
      m.scale.setScalar(s * (1 - dyingK));
    }

    // --- THE EYE: GAZE (tracks the dragon) with lag; the BLINK-analog grief GUTTER
    // (dims + re-lights, rate rising with pressure); and MOURNING (periodically
    // dropping to the fused frame). NOTICE snaps it bright + finds you.
    // Gaze ease.
    let tX = gazeTX, tY = gazeTY;
    if (entAimSet) {
      // entrance/aim: point the eye rig at the fed rig-space position
      _aimDir.copy(_entAim).sub(eyeRig.position);
      if (_aimDir.lengthSq() > 1e-4) { _aimDir.normalize(); eyeRig.quaternion.setFromUnitVectors(_zAxis, _aimDir); }
    } else {
      eyeRig.rotation.set(0, 0, 0);
    }
    // Mourning: the eye periodically drops to the frame (gaze pulled down to y of the
    // frame) — the §4b "eye drops to the dead twin" expression.
    if (mournT > 0) { mournT -= dt; tY = -0.9; tX = 0; }
    else { nextMourn -= dt; if (nextMourn <= 0 && charge < 0.3 && noticeT <= 0 && dyingK <= 0) { mournT = 1.3; nextMourn = 5 + (time % 3); } }
    const gLag = (noticeT > 0 || charge > 0.5) ? 9 : 4;
    gazeX += (tX - gazeX) * Math.min(1, dt * gLag);
    gazeY += (tY - gazeY) * Math.min(1, dt * gLag);
    pupil.position.x = gazeX * 0.12;
    pupil.position.y = gazeY * 0.12;
    glint.position.x = -0.08 + gazeX * 0.06;
    glint.position.y = 0.1 + gazeY * 0.06;

    // Grief GUTTER (blink-analog): the sclera dims toward near-out then re-lights,
    // never a clean shut. Faster under pressure (charge/flinch). In death it eases
    // fully shut.
    let gutter = 1;
    if (dyingK > 0) {
      gutter = 1 - clamp(dyingK * 1.4, 0, 1);   // eases shut
    } else {
      const rate = 1 + charge * 1.2 + flinchT * 2;
      if (blinkT > 0) { blinkT -= dt * rate; gutter = 0.6 + 0.4 * Math.abs(Math.sin(blinkT * 6)); }
      else { nextBlink -= dt; if (nextBlink <= 0) { blinkT = 0.5; nextBlink = 2.2 + (time % 2.5); } }
    }
    const eyeK = gutter * (0.75 + (noticeT > 0 ? 0.6 : 0) + charge * 0.3);
    orbMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT * eyeK);
    // The catchlight is a STEADY wet pinpoint — the SCLERA carries the grief-gutter,
    // not the glint — so the G1 focal peak never dips below ≥250 in any captured idle
    // frame (the glint only brightens on notice + fades in death).
    glintMat.color.setScalar(GLINT_HOT * (noticeT > 0 ? 1.12 : 1) * (1 - dyingK));
    orb.scale.setScalar(Math.max(0.12, 1 - (1 - gutter) * 0.5));
    irisMat.emissiveIntensity = 0.7 * (0.6 + 0.4 * gutter);

    // Mourning tints the frame rim a touch brighter (the eye's light falling on the
    // dead frame it looks at) — reads as the mutual attention.
    frameRimMat.emissiveIntensity = 0.5 + (mournT > 0 ? 0.35 : 0) + dyingK * 0.6;

    // Muzzle follows the wing's outer reach (living volley origin).
    muzzle.position.set(1.8 + charge * 0.6, 4.0 + charge * 0.8, 2.4);

    // decay pulses
    if (noticeT > 0) noticeT -= dt;
    if (flinchT > 0) flinchT = Math.max(0, flinchT - dt * 2.4);
  }

  // Wrap kit.setDissolve to layer the GRIEF DEATH: the wing folds over the frame, the
  // list collapses, the eye eases shut, it drifts down — all driven off dyingK in the
  // body tick (setDissolve is called with a rising k at death).
  function setDissolveEmotive(k) {
    dyingK = clamp(k, 0, 1);
    kit.setDissolve(k);
  }

  // FLINCH: the wing jerks + the body lists harder + the eye flares (the §4b flinch).
  function flash(amt) { kit.flash(amt); }
  function hurt(amt) { flinchT = Math.min(1, flinchT + (amt ?? 0.5)); noticeT = Math.max(noticeT, 0.2); }

  // §7b diagnostics / test + studio pins.
  function wingMantleAngle() { return vastWing.shoulder.rotation.z; }
  function eyeLocalPos() { return eyeRig.position.clone(); }

  return {
    group, muzzle, ghostMuzzle, orbiters,
    setDissolve: setDissolveEmotive,
    setCharge,
    setGaze,
    notice,
    setEntranceAim,
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible,
    shatterShield: kit.shatterShield,
    flash, hurt,
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    // diagnostics + pins (not part of the controller contract)
    wingMantleAngle, eyeLocalPos,
    dispose() {
      group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    },
  };
}
