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
  // The wing MEMBRANE — a dim tattered web behind the blades so the vast wing reads as
  // solid WRAITH-wing mass, not thin pinions (§5g grandeur; the blades still read lit
  // ON it). Kept dark + low-emissive so it's mass, never a second glow.
  const membraneMat = track(new THREE.MeshStandardMaterial({
    color: 0x0c0910, emissive: RIM_ASHEN, emissiveIntensity: 0.14, roughness: 0.78, metalness: 0.1, flatShading: true,
  }));
  membraneMat.side = THREE.DoubleSide;

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
  const bladeExtrude = { depth: 0.18, bevelEnabled: !lowQ, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: lowQ ? 1 : 2, steps: 1 };
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
    const parts = [g, rib];
    if (!lowQ) {
      // a secondary INNER vane (a split feather — each blade reads ARTICULATED, not a
      // flat sticker) + a hooked TIP barb catching the light (§5g identity richness).
      const vane = strip(new THREE.ExtrudeGeometry(bladeShape(len * 0.62, w * 0.52), { ...bladeExtrude, depth: 0.1 }));
      vane.translate(-w * 0.14, len * 0.12, -0.17);
      const barb = strip(new THREE.ConeGeometry(w * 0.16, len * 0.2, 3));
      barb.rotateZ(0.55); barb.translate(w * 0.05, len * 0.92, 0.02);
      parts.push(vane, barb);
    }
    return mergeO(parts, 'blade');
  };

  // ---- THE VAST LIVING WING (right shoulder, sx=+1): EIGHT scythe-blades marching
  // along an ARM arc (roots MARCH, never one sunburst point — feathers, not a fan
  // hub), oversized so the wing ALONE spans ≥26 on-screen units at station. On a
  // named `wingPivot` (mantle/thump/fold). Covert lag-blades at the base for
  // articulation. Ashen rims on the outer (leading) half. ----
  const WING_N = lowQ ? 6 : 12;
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

    // WING ARMATURE — the wraith SKELETON showing through the tattered membrane: a main
    // arm-spar (shoulder→wrist) + a wrist knuckle + a finger-bone fanning to each blade
    // root (real wing anatomy: the fingers carry the primaries). Merged, 1 draw. §5g mass.
    if (!lowQ) {
      const bones = [];
      const spar = strip(new THREE.CylinderGeometry(0.22, 0.34, 4.3, 5));
      spar.rotateZ(-Math.atan2(2.3, 3.6)); spar.translate(1.9, 1.15, 0.02);
      bones.push(spar);
      const wrist = strip(new THREE.OctahedronGeometry(0.52, 1)); wrist.translate(3.6, 2.3, 0.02); bones.push(wrist);
      for (let i = 0; i < WING_N; i++) {
        const t = i / (WING_N - 1);
        const rx = 1.6 + t * 5.4, ry = 0.2 + t * 3.1;
        const dx = rx - 3.6, dy = ry - 2.3, L = Math.max(0.3, Math.hypot(dx, dy));
        const fb = strip(new THREE.CylinderGeometry(0.08, 0.14, L, 4));
        fb.rotateZ(Math.atan2(dy, dx) - Math.PI / 2);
        fb.translate((rx + 3.6) / 2, (ry + 2.3) / 2, -0.04);
        bones.push(fb);
      }
      shoulder.add(new THREE.Mesh(mergeO(bones, 'wingArmature'), rimDimMat));
    }

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

    // THE WEBBED MEMBRANE — a tattered wraith-wing sheet filling behind the blade fan
    // (root spine → out toward the tips), a scalloped/torn trailing edge so it reads as
    // a broken membrane, never a clean angel sail. On the shoulder (moves with the wing);
    // seated BEHIND the blades so the lit blades read on top of the dark web. §5g mass.
    const memShape = new THREE.Shape();
    memShape.moveTo(0.4, -1.0);
    memShape.quadraticCurveTo(4.5, 1.0, 8.2, 4.1);      // leading/lower edge sweeps out
    memShape.quadraticCurveTo(11.2, 6.6, 13.6, 9.5);    // to the vast tip
    memShape.lineTo(11.8, 8.7); memShape.lineTo(12.4, 7.9);   // tear 1 (tattered top edge)
    memShape.quadraticCurveTo(10.4, 6.8, 8.6, 5.0);
    memShape.lineTo(9.2, 4.4); memShape.lineTo(7.6, 3.6);     // tear 2
    memShape.quadraticCurveTo(5.4, 2.6, 3.6, 1.2);
    memShape.lineTo(4.1, 0.7); memShape.lineTo(2.4, 0.1);     // tear 3
    memShape.quadraticCurveTo(1.2, -0.4, 0.4, -1.0);
    const membrane = new THREE.Mesh(
      strip(new THREE.ExtrudeGeometry(memShape, { depth: 0.12, bevelEnabled: !lowQ, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1, steps: 1 })),
      membraneMat);
    membrane.position.z = -0.35;
    membrane.name = 'wingMembrane';
    shoulder.add(membrane);

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
    // A snapped ARMATURE (3 short finger-bones) + a torn membrane SCRAP still clinging —
    // the stub reads as a wing that was BROKEN OFF, mirroring the vast wing's skeleton.
    if (!lowQ) {
      const bones = [];
      for (let i = 0; i < 3; i++) {
        const ang = -0.55 - i * 0.5, L = 1.7 - i * 0.35;
        const fb = strip(new THREE.CylinderGeometry(0.07, 0.12, L, 4));
        fb.rotateZ(ang); fb.translate(0.6 - Math.sin(ang) * L * 0.5, 0.35 + Math.cos(ang) * L * 0.5, -0.03);
        bones.push(fb);
      }
      shoulder.add(new THREE.Mesh(mergeO(bones, 'stubArmature'), rimDimMat));
      const scrap = new THREE.Shape();
      scrap.moveTo(0.3, 0); scrap.lineTo(1.7, 1.1); scrap.lineTo(1.3, 1.6); scrap.lineTo(1.0, 1.15); scrap.lineTo(0.7, 1.4); scrap.lineTo(0.4, 0.6); scrap.lineTo(0.3, 0);
      const sm = new THREE.Mesh(strip(new THREE.ExtrudeGeometry(scrap, { depth: 0.08, bevelEnabled: false, steps: 1 })), membraneMat);
      sm.position.set(0.2, 0.1, -0.22); shoulder.add(sm);
    }
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
    if (!lowQ) {
      // Broken RIBCAGE relief — transverse rib-ridges riding the two side ribs (pure
      // surface relief at the outer edge; never crosses the open chest / the hole).
      for (let s = -1; s <= 1; s += 2) for (let j = 0; j < 5; j++) {
        const y = 5.0 - j * 1.7;
        if (y > -0.7 && y < 4.9) continue;   // skip the hole's y-band — keep the chest open
        const rr = strip(new THREE.BoxGeometry(0.8, 0.24, 0.38)); rr.rotateZ(s * 0.22); rr.translate(s * 1.75, y, 0.14); parts.push(rr);
      }
      // Hanging TATTERS — ragged shroud strips off the pelvis + shoulders (a grief-wraith's
      // rags), hanging DOWN below/beside the open chest so they never fill the hole.
      const tatter = (x, y0, len, wid, lean) => {
        const t = new THREE.Shape();
        t.moveTo(-wid, 0); t.lineTo(wid, 0);
        t.lineTo(wid * 0.7, -len * 0.5); t.lineTo(wid * 0.3, -len * 0.42);
        t.lineTo(0, -len); t.lineTo(-wid * 0.4, -len * 0.55); t.lineTo(-wid * 0.8, -len * 0.4); t.lineTo(-wid, 0);
        const g = strip(new THREE.ExtrudeGeometry(t, { depth: 0.1, bevelEnabled: false, steps: 1 }));
        g.rotateZ(lean); g.translate(x, y0, -0.22);
        return g;
      };
      parts.push(tatter(-1.5, -2.2, 3.4, 0.55, 0.12), tatter(0.1, -2.8, 4.2, 0.75, -0.05), tatter(1.5, -2.0, 3.0, 0.55, -0.14));
      parts.push(tatter(-2.1, 5.6, 2.4, 0.45, 0.32), tatter(2.1, 5.6, 2.4, 0.45, -0.32));
    }
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
    const skull = strip(new THREE.OctahedronGeometry(1.0, lowQ ? 1 : 3));   // detail 3 = a carved skull
    skull.scale(0.92, 0.98, 0.86); skull.translate(0, 8.2, -0.35);
    parts.push(skull);
    // A hood/cowl swept back over the skull.
    const hood = strip(new THREE.ConeGeometry(1.1, 1.9, lowQ ? 6 : 10)); hood.rotateX(-0.35); hood.translate(0, 8.75, -0.62);
    parts.push(hood);
    // A heavy brow ledge over the eye (seats the eye recessed → reads as a face,
    // not a lamp) + a hooked jaw below.
    const brow = strip(new THREE.BoxGeometry(1.3, 0.36, 0.62)); brow.rotateX(0.3); brow.translate(0, 8.55, 0.5); parts.push(brow);
    const jaw = strip(new THREE.ConeGeometry(0.46, 1.3, 3)); jaw.rotateX(2.2); jaw.rotateZ(0.3); jaw.translate(0, 7.5, 0.55); parts.push(jaw);
    if (!lowQ) {
      // Gaunt cheek + temple ridges framing the socket (a grief FACE, not a ball).
      for (const sx of [-1, 1]) {
        const cheek = strip(new THREE.BoxGeometry(0.22, 0.95, 0.42)); cheek.rotateZ(sx * 0.35); cheek.translate(sx * 0.62, 8.0, 0.35); parts.push(cheek);
        const temple = strip(new THREE.ConeGeometry(0.16, 0.85, 3)); temple.rotateX(-0.6); temple.rotateZ(sx * 0.2); temple.translate(sx * 0.72, 8.9, -0.1); parts.push(temple);
      }
      // A GRIEF CROWN — a ring of thin mourning thorns off the crown (the World-Ender's
      // ruined halo), swept back so they BREAK the head's top outline.
      const nThorn = 7;
      for (let i = 0; i < nThorn; i++) {
        const a = -0.9 + (i / (nThorn - 1)) * 1.8;
        const th = strip(new THREE.ConeGeometry(0.11, 1.1 + Math.cos(a) * 0.6, 3));
        th.rotateX(-0.5); th.rotateZ(a * 0.85); th.translate(Math.sin(a) * 0.95, 9.15 + Math.cos(a) * 0.2, -0.5);
        parts.push(th);
      }
    }
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

  // THE DEAD TWIN'S DETAIL — it reads as a real fused CORPSE-frame, not a wire diamond:
  // an empty, SEALED eye-socket high in the kite (the dead twin's blind face, echoing
  // EITHERWING's socket), corner gussets, and beading down the perimeter bars. All kept
  // at the TOP + edges so the wide lower interior stays the open HOLE (Fable-approved
  // negative space). §5g the emotional hook.
  if (!lowQ) {
    const det = [];
    const sock = strip(new THREE.TorusGeometry(0.44, 0.11, 8, 16)); sock.translate(0, KTOP - 0.95, 0.05); det.push(sock);
    const seal1 = strip(new THREE.BoxGeometry(0.82, 0.12, 0.16)); seal1.rotateZ(0.7); seal1.translate(0, KTOP - 0.95, 0.11); det.push(seal1);
    const seal2 = strip(new THREE.BoxGeometry(0.82, 0.12, 0.16)); seal2.rotateZ(-0.7); seal2.translate(0, KTOP - 0.95, 0.11); det.push(seal2);   // the eye X'd shut (dead)
    for (const p of kitePts2D) { const g = strip(new THREE.OctahedronGeometry(0.28, 1)); g.scale(1, 1, 0.7); g.translate(p[0] * 1.05, p[1] * 1.05, 0.05); det.push(g); }
    // beading down each perimeter bar (the dead twin's old bead-thread, fossilised into the frame)
    for (let i = 0; i < 4; i++) {
      const a = kitePts2D[i], b = kitePts2D[(i + 1) % 4];
      for (let k = 1; k <= 4; k++) {
        const f = k / 5, bx = (a[0] + (b[0] - a[0]) * f) * 1.09, by = (a[1] + (b[1] - a[1]) * f) * 1.09;
        const bead = strip(new THREE.OctahedronGeometry(0.13, 0)); bead.translate(bx, by, 0.08); det.push(bead);
      }
    }
    const frameDetail = new THREE.Mesh(mergeO(det, 'frameDetail'), frameRimMat);
    frameDetail.name = 'frameDetail';
    frameGroup.add(frameDetail);
  }

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
  let shieldedK = 0, shieldedTarget = 0;   // 1 while the ward is up — the eye LEASHES to an ember (§5f G6)
  let felledK = 0;         // 0..1 — the FAKE-DEATH collapse (recoverable): wing folds, eye guts out, body sags
  let reviveT = 0;         // >0 the RESURRECTION pulse: the fused frame IGNITES its dead twin's light into the body
  let noticeT = 0;         // notice() pulse
  let flinchT = 0;         // flinch kick (from flash/hurt)
  let gazeTX = 0, gazeTY = 0, gazeX = 0, gazeY = 0;   // eye gaze target + eased
  let blinkT = 0, nextBlink = 2.4;                    // grief-dim gutter (blink-analog)
  let mournT = 0;          // eased "eye drops to the frame" (mourning) weight
  let nextMourn = 4.5;
  const _aimDir = new THREE.Vector3(), _zAxis = new THREE.Vector3(0, 0, 1);
  let entAimSet = false; const _entAim = new THREE.Vector3();

  // === LOCOMOTION + follow-through state (L194: locomotion is the fluidity primitive —
  // a PARKED body reads stop-motion no matter how much secondary motion it wears; L193:
  // velocity-coupled bank + trailing parts + tell FAMILIES). ===
  let locoT = 0;
  let lastLX = 0, lastLY = 0;          // rig loco pos last frame → wander velocity
  let bankZ = 0;                        // eased velocity-coupled bank (on top of the LIST)
  let wingEase = -0.1, wingEaseX = 0;  // the vast wing TRAILS the body (overlap/follow-through)
  let thAng = 0, thVel = 0;            // the snapped thread as a damped-spring pendulum
  let tellId = null, tellK = 0;        // attack-tell pose weight
  // Tell FAMILIES (L193 — "any boss whose tick ignores `tell` leaves its cheapest
  // expressiveness unbuilt"): each attack wears a DISTINCT wing/frame pose. dz = shoulder
  // lift, dx = forward thrust, dy = lateral sweep-yaw, spread = extra blade fan.
  const TELLS = {
    aimed:      { dz: 0.14, dx: -0.55, dy: 0.05, spread: 0.10 },  // a forward THRUST jab
    crossfire:  { dz: 0.30, dx: -0.15, dy: 0.55, spread: 0.24 },  // a wide SWEEP across
    fan:        { dz: 0.22, dx: -0.10, dy: -0.25, spread: 0.55 }, // the blades FAN open
    secondWave: { dz: 0.72, dx: -0.28, dy: 0.10, spread: 0.32 }, // MANTLE high — the dead-half volley
    movingGap:  { dz: 0.10, dx: -0.30, dy: -0.45, spread: 0.15 }, // a rolling GAP
  };
  const NO_TELL = { dz: 0, dx: 0, dy: 0, spread: 0 };

  function setCharge(k) { charge = clamp(k, 0, 1); }
  function setGaze(nx, ny) { gazeTX = clamp(nx, -1, 1); gazeTY = clamp(ny, -1, 1); }
  function notice() { noticeT = 1.0; blinkT = 0; nextBlink = 3; }
  function setAttackTell(id) { tellId = id; }
  function setEntranceAim(x, y, z) { if (x == null) { entAimSet = false; } else { _entAim.set(x, y, z); entAimSet = true; } }

  function tickBody(dt, time) {
    // `col` = the COLLAPSE pose weight (real death OR the recoverable fake-death fold);
    // `alive` damps the wander so the fake death visibly STILLS the body, then the drift
    // resumes on revive — the honest "it was dying, now it isn't" tell.
    const col = Math.max(dyingK, felledK);
    const alive = 1 - Math.max(dyingK, felledK * 0.85);
    locoT += dt;

    // === LOCOMOTION (L194 — THE fluidity primitive): a listing, grief-stricken WANDER
    // through the lane, biased toward the heavy-wing side (it can't fly straight — the
    // lopsidedness drags it). Rig-space, so player-damage paths (partWorldPos walks the
    // chain) follow the visual body. Amplitude at KARNVOW's ceiling (±~3.5 local), tuned
    // LOUD for the FIGHT FRAME — the studio close-up lies. ===
    const sag = Math.sin(time * 0.9) * 0.5 + 0.5;              // the rubato breath (grief arrhythmia)
    const driftX = (Math.sin(locoT * 0.41) * 2.2 + Math.sin(locoT * 0.17 + 1.3) * 1.5 + 0.6) * alive;
    const driftY = (Math.sin(locoT * 0.53 + 0.7) * 1.0 + Math.sin(locoT * 0.29) * 0.7 - sag * 0.5) * alive;
    rig.position.x = driftX;
    rig.position.y = driftY - dyingK * 4.0 - felledK * 1.6;    // sinks as it dies (fake death sags partway)
    const vX = (rig.position.x - lastLX) / Math.max(dt, 1e-4);
    const vY = (rig.position.y - lastLY) / Math.max(dt, 1e-4);
    lastLX = rig.position.x; lastLY = rig.position.y;

    // === VELOCITY-COUPLED BANK (L193): the body leans INTO its drift on top of the
    // permanent ~12° LIST; a small yaw/pitch as it slews. Death collapses the list. ===
    bankZ += ((-vX * 0.05) - bankZ) * Math.min(1, dt * 5);
    const listExtra = sag * 0.06 + flinchT * 0.16 + felledK * 0.28;   // fake death lists HARD (a dying cant)
    rig.rotation.z = LIST * (1 - dyingK * 1.15) - listExtra + bankZ * alive;
    rig.rotation.x = (dyingK * 0.5 + felledK * 0.3) + clamp(vY * 0.012, -0.2, 0.2) * alive;
    rig.rotation.y = clamp(vX * 0.010, -0.15, 0.15) * alive;

    // === TELL POSE eases in on charge (the attack's own pose — tell FAMILIES). ===
    const tp = TELLS[tellId] || NO_TELL;
    const tellTarget = (charge > 0.05 || noticeT > 0.4) ? 1 : 0;
    tellK += (tellTarget - tellK) * Math.min(1, dt * 6);

    // === THE VAST WING — it TRAILS the body (overlap/follow-through), never snaps: the
    // shoulder EASES toward its target and the lateral drift velocity drags it a beat
    // behind (the overlap that kills stop-motion). Mantles on charge, wears the tell
    // pose, FOLDS down over the frame in death. ===
    const mantle = charge * 0.5 + (noticeT > 0.4 ? 0.3 : 0) + reviveT * 0.9;   // the wing THROWS open on revive
    const foldK = Math.min(1, col * 1.9);                      // real death OR the fake-death fold
    const fold = (foldK * foldK * (3 - 2 * foldK)) * 2.35;     // smoothstep → a decisive fold arc
    const wingTargetZ = -0.1 + Math.sin(time * 0.9) * 0.10 + mantle + tp.dz * tellK - fold;
    const wingTargetX = -flinchT * 0.5 + fold * 0.55 + tp.dx * tellK;
    wingEase += (wingTargetZ - wingEase) * Math.min(1, dt * 5) - vX * 0.02 * alive;   // trails the drift
    wingEaseX += (wingTargetX - wingEaseX) * Math.min(1, dt * 6);
    vastWing.shoulder.rotation.z = wingEase;
    vastWing.shoulder.rotation.x = wingEaseX;
    vastWing.shoulder.rotation.y = tp.dy * tellK * 0.5 + clamp(vX * 0.015, -0.2, 0.2) * alive;
    for (const b of wingBlades) {
      const spread = (mantle * 0.5 + tp.spread * tellK) * (0.2 + b.idx * 0.05);
      // graded lag down the blades — the mantle/fold/drift WHIP travels outboard a beat behind
      const lag = Math.sin(time * 1.3 - b.idx * 0.5) * (0.05 + Math.abs(vX) * 0.004) * alive;
      b.pivot.rotation.z = b.base - spread + lag - fold * (0.12 + b.idx * 0.03);
    }
    for (const c of vastWing.coverts) c.pivot.rotation.z = c.base + Math.sin(time * 1.0 + c.pivot.position.x) * 0.14 * alive - flinchT * 0.4 - vX * 0.01;

    // === THE STUB — a withered TWITCH (involuntary), harder on flinch, folds too. ===
    stub.shoulder.rotation.z = 0.1 + Math.sin(time * 2.7) * 0.07 * alive - flinchT * 0.35 - dyingK * 0.6 + vX * 0.02 * alive;
    for (const b of stubBlades) {
      b.pivot.rotation.z = b.base + Math.sin(time * 3.3 + b.idx * 1.5) * 0.16 * alive - flinchT * 0.5;
    }

    // === THE SNAPPED THREAD — a DAMPED-SPRING pendulum (L193) driven by the body's
    // lateral velocity + flinch/charge impulses: one drift whips the broken cord and it
    // settles with real overshoot (never a fixed sine). The whip travels DOWN the cord. ===
    const thDrive = -vX * 0.05 + flinchT * (Math.sin(time * 30) * 0.4) + charge * 0.08;
    thVel += (-thAng * 14 - thVel * 3.0 + thDrive * 60) * dt;
    thAng += thVel * dt;
    for (let i = 0; i < threadSegs.length; i++) {
      const ts = threadSegs[i];
      const grade = (i + 1) / threadSegs.length;
      ts.seg.rotation.z = ts.base + thAng * grade * (1 - dyingK * 0.6);
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
    if (col > 0) {
      gutter = 1 - clamp(col * 1.4, 0, 1);   // eases shut (dying — real OR the fake death)
    } else {
      const rate = 1 + charge * 1.2 + flinchT * 2;
      if (blinkT > 0) { blinkT -= dt * rate; gutter = 0.6 + 0.4 * Math.abs(Math.sin(blinkT * 6)); }
      else { nextBlink -= dt; if (nextBlink <= 0) { blinkT = 0.5; nextBlink = 2.2 + (time % 2.5); } }
    }
    const eyeK = gutter * (0.75 + (noticeT > 0 ? 0.6 : 0) + charge * 0.3) * (1 - shieldedK * 0.6) + reviveT * 1.6;
    orbMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT * eyeK);   // the eye SNAPS back BRIGHT on revive
    // The catchlight is a STEADY wet pinpoint — the SCLERA carries the grief-gutter,
    // not the glint — so the G1 focal peak never dips below ≥250 in any captured idle
    // frame (the glint only brightens on notice + fades in death).
    glintMat.color.setScalar(GLINT_HOT * (noticeT > 0 ? 1.12 : 1) * (1 - dyingK) * (1 - shieldedK * 0.6) * (1 + reviveT * 1.3));
    orb.scale.setScalar(Math.max(0.12, 1 - (1 - gutter) * 0.5));
    irisMat.emissiveIntensity = 0.7 * (0.6 + 0.4 * gutter);

    // Mourning tints the frame rim a touch brighter (the eye's light falling on the
    // dead frame it looks at). On the RESURRECTION the frame BLAZES — the dead twin's
    // light igniting and pouring up into the body (the readable "it consumed its dead
    // half to come back" beat) — and the black ghost-edges briefly light with it.
    frameRimMat.emissiveIntensity = 0.5 + (mournT > 0 ? 0.35 : 0) + dyingK * 0.6 + reviveT * 4.5;
    frameEdgeMat.emissiveIntensity = reviveT * 2.2;
    if (reviveT > 0) frameEdgeMat.emissive.copy(EYE_BASE);

    // Muzzle follows the wing's outer reach AND the wander (living volley origin) so the
    // volley visibly comes from the wing wherever the body has drifted to; the ghost
    // muzzle rides the frame in the chest.
    muzzle.position.set(rig.position.x + 1.8 + charge * 0.6, rig.position.y + 4.0 + charge * 0.8, 2.4);
    ghostMuzzle.position.set(rig.position.x, rig.position.y + 2.6, 2.0);

    // decay pulses
    shieldedK += (shieldedTarget - shieldedK) * Math.min(1, dt * 5);
    if (reviveT > 0) reviveT = Math.max(0, reviveT - dt * 1.15);   // ~0.9s resurrection flare
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

  // The ward: raising the shield LEASHES the eye to an ember (§5f/G6 — the focal can't
  // be the brightest point while it's invulnerable). Eased in the tick.
  function setShieldVisibleEmotive(v) { shieldedTarget = v ? 1 : 0; kit.setShieldVisible(v); }

  // §5f THE LYING FELLED CARD — the readable resurrection (owner ask). The lie plays in
  // two OBVIOUS beats so the player never reads it as a glitch:
  //   setFelledLie(k)  — the FAKE DEATH: k 0→1 folds the wing DOWN over the frame, guts
  //                      the eye out, sags the body. It looks like it is DYING.
  //   felledRevive()   — the RESURRECTION: the fused frame IGNITES and pours its dead
  //                      twin's light UP INTO the body — the eye SNAPS back brighter, the
  //                      wing THROWS open. It came back by consuming its dead half.
  function setFelledLie(k) { felledK = clamp(k, 0, 1); }
  function felledRevive() { reviveT = 1; felledK = 0; noticeT = 1.0; flinchT = 0.4; }

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
    setAttackTell,
    setGaze,
    notice,
    setEntranceAim,
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: setShieldVisibleEmotive,
    shatterShield: kit.shatterShield,
    setFelledLie, felledRevive,   // §5f the readable fake-death → resurrection
    flash, hurt,
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    // diagnostics + pins (not part of the controller contract)
    wingMantleAngle, eyeLocalPos,
    dispose() {
      group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    },
  };
}
