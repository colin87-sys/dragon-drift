import * as THREE from 'three';
import {
  DEFAULT_WING, wingSpecFor, buildWingShape, buildFeatherWingShape,
  archWing, archLift, wingStrut, applyWingGradient, edgedFin,
  featherGeo, featherGradient, webGradient, archUp, bone, buildCurvedPatch,
} from './dragonParts.js';
import { registerWings } from './dragonRecipe.js';
import { seg } from './modelDetail.js';
import { skinnedTube as sweepTube } from './dragonSweep.js';
import { composeSurface, membraneSSSPatch } from './dragonSurfaceShader.js';
import { applyFresnelRim } from './surface.js';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';

// Wings modules — the second part extracted behind the recipe registry. A wings
// build owns its own materials (the runtime-animated membrane `wingMat`, the
// bone/vein/arm struts, the apex fin accents) and returns the flap rig handles
// the in-game animation + shop preview drive:
//
//   { group, parts, wingMat, spineMats }
//     group     a Group holding both wing pivots (+ any secondary pair / hip fins)
//     parts     { wingPivotL/R, wingTipL/R, tipMarkerL/R, wingPivot2L/R }
//     wingMat   the membrane material the rig animates (emissive / opacity / tint)
//     spineMats accent mats that flare on Surge (the cyan fin rim) — concatenated
//               into the model's shared spineMats by the orchestrator
//
// Wings mount via the torso's ATTACH contract (`attach.wingRoot(side)`), so the
// same membrane wing sits correctly on the arrow drake or the long serpent. The
// signature mirrors the torso module: (def, model, attach, giM).

// ── MEMBRANE ────────────────────────────────────────────────────────────────
// The shipped dragon wing: one bowed membrane per side split at the wrist into an
// inner (flap) panel + outer (fold) panel, leading-edge arm/finger bones, optional
// glowing veins, a premium cyan trailing-edge rim + wingtip winglet, an optional
// secondary wing pair, and hip fins. (Also serves the legacy `wingShape:'feather'`
// flat-feather variant.) Geometry is transcribed verbatim from the original inline
// builder — byte-identical output, verified by triangle-count parity.
function buildMembraneWings(def, model, attach, giM, opts = {}) {
  const group = new THREE.Group();
  const spineMats = [];
  // 'curvedMembrane' recipe: build the membrane as a smooth double-curved grid
  // (buildCurvedPatch) instead of a flat clipped sheet — chordwise billow + smooth
  // normals so the wing reads as taut skin and the inner/outer panels meet at a
  // shared seam without the hard flat-panel crease.
  const curved = !!opts.curved;
  // 'skinnedMembrane' recipe: the deeper "organism" fix. One CONTINUOUS membrane
  // (root→tip) bound to a 2-bone skeleton (shoulder + wrist); the rig's existing
  // flap/fold rotations drive the bones, so the wrist BENDS as smooth skin with no
  // discrete hinge to crease or camouflage. Implies the curved surface.
  const skinned = !!opts.skinned && model.wingShape !== 'feather';
  // 'skinnedMembraneBridge' recipe: also grow a continuous body-material DELTOID
  // from the torso flank to the membrane root, skinned anchor(static)→shoulder, so
  // the wing reads as PART OF the body — no metallic ball-joint, and no frozen-body
  // seam during the beat. Needs the torso's body material (attach.bodyMatDouble) and
  // the skinned path (it shares the membrane's shoulder bone).
  const wantBridge = !!opts.bridge && skinned && !!attach.bodyMatDouble;
  const panelBillow = model.wingBillow ?? 0.12;
  // Blueprint-driven flap character (lag/amp/limits per joint) — the animator fills
  // defaults, so a creature tunes its wingbeat by declaring `model.flapProfile`.
  const flapProfile = model.flapProfile || null;

  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.55, side: THREE.DoubleSide,
    transparent: true, opacity: model.wingOpacity ?? 0.82, // translucent membrane — see rings through it
    // wingMembraneEmissive retints the PANEL glow (default = wingEmissive); the
    // stealth apex sets it to a dark navy so cyan stays on the edges, not the fill.
    emissive: def.wingMembraneEmissive ?? def.wingEmissive, emissiveIntensity: model.wingPanelGlow ?? 0.28,
  });
  // Bat-wing SUBSURFACE: the thin black membrane glows faintly at the silhouette
  // when backlit (the Night Fury "wings against the sky" read) — a cool desaturated
  // edge, no hue. Additive + nullable: only a dragon that opts in (model.wingSSS)
  // pays the patch; every other dragon's wingMat is byte-identical.
  if (model.wingSSS) {
    composeSurface(wingMat, [membraneSSSPatch({ color: def.wingMembraneSSS ?? 0x2a3a52, strength: 0.22, power: 1.5 })]);
  }

  const ws = model.wingScale;
  const featherShape = model.wingShape === 'feather';
  const wingSpec = featherShape ? DEFAULT_WING : wingSpecFor(def, model);
  const arc = wingSpec.arc;
  const maxX = Math.abs(wingSpec.tips[0][0] * 1.34 * ws);
  const boneMat = new THREE.MeshStandardMaterial({
    color: def.horn, emissive: def.wingEmissive, emissiveIntensity: 0.35,
    roughness: 0.3, metalness: 0.5,
  });
  const veinMat = model.wingVeins ? new THREE.MeshStandardMaterial({
    color: def.apexSeam || def.wingEmissive,
    emissive: def.apexSeam || def.wingEmissive, emissiveIntensity: 1.7 * giM,
    roughness: 0.3, metalness: 0.4,
  }) : null;
  // Brighter, thicker leading-edge ARM bone so the wing reads as bone + membrane
  // (an organic limb) instead of a flat triangular plane.
  const armMat = new THREE.MeshStandardMaterial({
    color: def.horn, emissive: def.apexSeam || def.wingEmissive,
    emissiveIntensity: 0.55, roughness: 0.3, metalness: 0.55,
  });

  // Premium edge accents (apex forms only): a bright cyan RIM material + a dark
  // fin membrane, shared by the wingtip winglets, the wing trailing-edge glow and
  // the hip fins. Built lazily so only the forms that ask for them pay the cost;
  // the rim flares on Surge via spineMats.
  const wantsEdge = model.wingtipFins || model.wingEdgeGlow || model.hipFins;
  const finMembraneMat = wantsEdge ? new THREE.MeshStandardMaterial({
    color: def.wingInner || def.body, emissive: def.body, emissiveIntensity: 0.16,
    roughness: 0.5, metalness: 0.25, side: THREE.DoubleSide, transparent: true, opacity: 0.94,
  }) : null;
  // Clamp the rim emissive so the cyan edge never blooms to white at high gi.
  const finEdgeInt = 0.7 + giM * 0.35;
  const finEdgeMat = wantsEdge ? new THREE.MeshStandardMaterial({
    color: def.wingEmissive, emissive: def.wingEmissive,
    emissiveIntensity: finEdgeInt, roughness: 0.3, metalness: 0.3, side: THREE.DoubleSide,
  }) : null;
  if (finEdgeMat) {
    finEdgeMat.userData.baseEmissive = def.wingEmissive;
    finEdgeMat.userData.baseIntensity = finEdgeInt;
    spineMats.push(finEdgeMat);
  }

  // Split the membrane at the WRIST into an inner panel (root→wrist, on the flap
  // pivot) and an outer panel (wrist→tip, on the wingTip group). The wingTip
  // already carries a lagged wrist-wave in the flap animation (dragon.js /
  // makePreviewTick) that previously moved nothing; handing it the outer membrane
  // makes the wing FOLD at the wrist for a fluid two-segment beat instead of a
  // rigid single hinge. Both panels reuse the SAME shape (verts outside the panel
  // collapse onto a shared seam, with a small overlap to hide the joint) and the
  // outer panel is re-origined to the seam, so at rest every vertex lands exactly
  // where the old single membrane did — the silhouette is unchanged, the motion
  // gains a wrist break.
  const wristXGeo = 3.3 * ws;
  // Curved panels share one continuous profile + meet at the seam, so they need
  // only a hair of overlap (vs the flat sheet's 0.22) — less overlap = no janky
  // doubled membrane at the wrist.
  const seamOv = (curved ? 0.06 : 0.22) * ws;
  const wristLift = archLift(wristXGeo, maxX, arc, ws);
  function membranePanel(clipMin, clipMax, originX, originY) {
    // Curved path: a smooth (span×chord) grid resampled from the same outline,
    // with chordwise billow + smooth normals. Same clip/origin → same at-rest
    // silhouette, no flat-panel facets. (Legacy 'feather'-shaped membranes keep
    // the flat path.)
    if (curved && !featherShape) {
      const worldMaxX = (wingSpec.tips[0][0] || 5.7) * 1.34 * ws;
      const spanStart = Math.max(isFinite(clipMin) ? clipMin : 0, 0);
      const spanEnd = Math.min(isFinite(clipMax) ? clipMax : worldMaxX, worldMaxX);
      const g = buildCurvedPatch(wingSpec, {
        scaleX: 1.34 * ws, scaleZ: model.wingChord ?? 1, arc, k: ws,
        billow: panelBillow, segU: seg(16), segV: seg(6),
        spanStart, spanEnd, originX, originY,
      });
      // Gradient by GLOBAL span fraction so the inner/outer panels share one
      // continuous colour ramp across the seam (no colour break at the wrist).
      applyWingGradient(g, def, spanStart / worldMaxX, spanEnd / worldMaxX);
      return g;
    }
    const g2 = new THREE.ShapeGeometry(featherShape ? buildFeatherWingShape() : buildWingShape(wingSpec), 14);
    g2.rotateX(-Math.PI / 2);
    // 3rd factor = wing CHORD (front-to-back depth); wingChord deepens the apex
    // wing without widening its span (span rides ws). Default 1 = unchanged.
    g2.scale(1.34 * ws, 1.28 * ws, model.wingChord ?? 1);
    applyWingGradient(g2, def, 0, 1);
    archWing(g2, arc, ws); // bow with the elbow profile (∝ ws)
    const pos = g2.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      if (x < clipMin) pos.setX(i, clipMin);
      else if (x > clipMax) pos.setX(i, clipMax);
    }
    pos.needsUpdate = true;
    if (originX || originY) g2.translate(-originX, -originY, 0);
    return g2;
  }

  // Skin weights along span |x|: a 4-bone chain anchor(0) → shoulder(1) → elbow(2) →
  // wrist(3), smooth-stepped across bands. The ROOT BAND (innermost span) blends from
  // a STATIC body anchor into the shoulder, so the broad wing's root stays WELDED to
  // the body while the outer wing flaps — it grows from the body instead of pivoting
  // off it (the swing-gap fix). Shared by the membrane AND the surface ribs so they
  // deform identically; the animator still drives the shoulder→elbow→wrist whip.
  const foldBand = 0.7 * ws;
  const elbowXGeo = wristXGeo * 0.52;                // mid-forearm joint
  const rootBand = elbowXGeo * 0.55;                 // inner span welded to the body anchor
  // Spanwise × chordwise resolution of the continuous skinned membrane — the
  // single biggest tessellation knob on the hero. Detail-scaled: HIGH = 24×6
  // (today), ULTRA densifies the fold curve + billow for a smooth wing on idle
  // GPUs, LOW trims it for the weakest devices. The surface ribs sample this grid.
  const SEG_U = seg(24), SEG_V = seg(6);
  const sstep = (x) => { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); };
  // Two active bones (a→b blended by t) for a span position; padded to 4 wide.
  function spanSkin(ax) {
    const e = elbowXGeo, w = wristXGeo, b = foldBand;
    let a, bb, t = 0;
    if (ax < rootBand) { a = 0; bb = 1; t = sstep(ax / rootBand); }                // body anchor → shoulder
    else if (ax <= e - b) { a = 1; bb = 1; }                                       // shoulder
    else if (ax < e + b) { a = 1; bb = 2; t = sstep((ax - (e - b)) / (2 * b)); }   // shoulder → elbow
    else if (ax <= w - b) { a = 2; bb = 2; }                                       // elbow
    else if (ax < w + b) { a = 2; bb = 3; t = sstep((ax - (w - b)) / (2 * b)); }   // elbow → wrist
    else { a = 3; bb = 3; }                                                        // wrist
    return { si: [a, bb, 0, 0], sw: [1 - t, t, 0, 0] };
  }
  function writeSpanWeights(geo) {
    const pos = geo.attributes.position;
    const si = new Uint16Array(pos.count * 4);
    const sw = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) {
      const s = spanSkin(Math.abs(pos.getX(i)));
      si[i * 4] = s.si[0]; si[i * 4 + 1] = s.si[1];
      sw[i * 4] = s.sw[0]; sw[i * 4 + 1] = s.sw[1];
    }
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  }

  // ONE continuous membrane (root→tip), mirrored per side (negate x + reverse
  // winding so normals stay out), weighted shoulder→wrist across the fold band.
  function buildContinuousWingGeo(side) {
    const worldMaxX = (wingSpec.tips[0][0] || 5.7) * 1.34 * ws;
    const g = buildCurvedPatch(wingSpec, {
      scaleX: 1.34 * ws, scaleZ: model.wingChord ?? 1, arc, k: ws,
      billow: panelBillow, segU: SEG_U, segV: SEG_V, spanStart: 0, spanEnd: worldMaxX,
    });
    applyWingGradient(g, def, 0, 1);
    const pos = g.attributes.position;
    if (side < 0) {
      for (let i = 0; i < pos.count; i++) pos.setX(i, -pos.getX(i));
      const idx = g.index;
      for (let i = 0; i < idx.count; i += 3) {
        const b = idx.getX(i + 1), c = idx.getX(i + 2);
        idx.setX(i + 1, c); idx.setX(i + 2, b);
      }
      g.computeVertexNormals();
    }
    writeSpanWeights(g);
    return g;
  }

  // A skinned tube along a centreline SAMPLED FROM the membrane surface (so it
  // lies on the skin), offset up its normal, with per-station fold weights copied
  // from the surface — so the rib bends exactly with the membrane (no "spokes").
  function skinnedTube(line, r0, r1, mat, rings = 6) {
    const N = line.length;
    const verts = [], idx = [], si = [], sw = [];
    const tangent = new THREE.Vector3(), up = new THREE.Vector3();
    const sideV = new THREE.Vector3(), up2 = new THREE.Vector3();
    for (let s = 0; s < N; s++) {
      const c = line[s].p, t = N > 1 ? s / (N - 1) : 0, r = r0 + (r1 - r0) * t;
      tangent.subVectors(line[Math.min(s + 1, N - 1)].p, line[Math.max(s - 1, 0)].p).normalize();
      up.copy(line[s].n).normalize();
      sideV.crossVectors(tangent, up).normalize();
      up2.crossVectors(sideV, tangent).normalize();
      const sk = spanSkin(Math.abs(c.x));            // same span weights as the membrane
      for (let k = 0; k < rings; k++) {
        const a = (k / rings) * Math.PI * 2;
        verts.push(
          c.x + (sideV.x * Math.cos(a) + up2.x * Math.sin(a)) * r,
          c.y + (sideV.y * Math.cos(a) + up2.y * Math.sin(a)) * r,
          c.z + (sideV.z * Math.cos(a) + up2.z * Math.sin(a)) * r,
        );
        si.push(sk.si[0], sk.si[1], 0, 0); sw.push(sk.sw[0], sk.sw[1], 0, 0);
      }
    }
    for (let s = 0; s < N - 1; s++) for (let k = 0; k < rings; k++) {
      const a = s * rings + k, b = s * rings + (k + 1) % rings;
      const c2 = (s + 1) * rings + k, d = (s + 1) * rings + (k + 1) % rings;
      idx.push(a, c2, b, b, c2, d);
    }
    const g = new THREE.BufferGeometry();
    g.setIndex(idx);
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(si), 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    g.computeVertexNormals();
    const m = new THREE.SkinnedMesh(g, mat);
    m.frustumCulled = false;
    return m;
  }

  // Build the wing's bone ribs from the membrane grid: a thick bright leading edge
  // (front row, root→tip) + a fan of slim finger veins (interior rows, wrist→tip),
  // each a skinned tube sitting just above the surface. Returns SkinnedMeshes to
  // bind to the same skeleton as the membrane.
  function buildSkinnedRibs(memGeo) {
    const pos = memGeo.attributes.position, nrm = memGeo.attributes.normal;
    const lift = 0.04 * ws;                          // sit just above the skin
    const sample = (i, j) => {
      const k = i * (SEG_V + 1) + j;
      const n = new THREE.Vector3(nrm.getX(k), nrm.getY(k), nrm.getZ(k)).normalize();
      const p = new THREE.Vector3(pos.getX(k), pos.getY(k), pos.getZ(k)).addScaledVector(n, lift);
      return { p, n };                                // skinnedTube derives weights from p.x
    };
    // Downsample the centreline (a gentle curve needs few stations — keeps the rib
    // tri-count modest so the wing stays within the per-form budget).
    const rowLine = (j, i0, i1, stations) => {
      const l = [];
      for (let s = 0; s < stations; s++) l.push(sample(Math.round(i0 + (i1 - i0) * s / (stations - 1)), j));
      return l;
    };
    const wristCol = Math.max(1, Math.round(SEG_U * (wristXGeo / ((wingSpec.tips[0][0] || 5.7) * 1.34 * ws))));
    const meshes = [];
    // leading edge / arm bone — front row, full span, thick → thin
    meshes.push(skinnedTube(rowLine(0, 0, SEG_U, seg(10)), 0.11, 0.02, armMat, seg(5)));
    // finger veins — interior rows from the wrist out, slim (they converge at tip)
    for (const j of [Math.round(SEG_V * 0.34), Math.round(SEG_V * 0.7)]) {
      meshes.push(skinnedTube(rowLine(j, wristCol, SEG_U, seg(6)), 0.028, 0.007, veinMat || boneMat, seg(4)));
    }
    // glowing cyan TRAILING rim — a skinned tube along the back row, so the lit
    // outline follows the bent membrane instead of rigid ribs poking through it.
    if (model.wingEdgeGlow && finEdgeMat) {
      meshes.push(skinnedTube(rowLine(SEG_V, 0, SEG_U, seg(12)), 0.022, 0.013, finEdgeMat, seg(5)));
    }
    return meshes;
  }

  // Shoulder BRIDGE (deltoid): a short continuous body-material tube from the torso
  // flank up to the membrane root, skinned across [anchor(static), shoulder]. It
  // replaces the bolted metallic shoulder sphere so the body and wing share ONE
  // stretching surface at the joint (the L1 "organism, not puppet" rule applied to
  // the last seam). Built in mount-local space (the membrane root is sampled from
  // memGeo; the anchor + shoulder bones sit at the mount origin), so it binds in the
  // same local frame as the membrane (L2). Tuned conservatively — preview-judged.
  function buildShoulderBridge(memGeo, side) {
    const pos = memGeo.attributes.position;
    const jMid = Math.round(SEG_V / 2);                  // membrane root centre (i=0 column)
    const root = new THREE.Vector3(pos.getX(jMid), pos.getY(jMid), pos.getZ(jMid));
    // Inboard end drops toward the torso shoulder (a touch back), buried in the
    // flank so the seam is sealed; outboard end coincides with the membrane root.
    const inboard = new THREE.Vector3(root.x + side * 0.02, root.y - 0.30, root.z - 0.02);
    const N = 5;
    const centre = [], radii = [], skin = [];
    for (let s = 0; s < N; s++) {
      const t = s / (N - 1);                             // 0 = body, 1 = membrane root
      centre.push(inboard.clone().lerp(root, t));
      radii.push(0.18 + (0.10 - 0.18) * t);             // deltoid base → root taper
      const w = sstep(t);
      skin.push({ si: [0, 1, 0, 0], sw: [1 - w, w, 0, 0] }); // anchor(0) → shoulder(1)
    }
    const tube = sweepTube(centre, radii, seg(7), (s) => skin[s], attach.bodyMatDouble);
    tube.name = 'shoulderBridge' + (side < 0 ? 'L' : 'R');
    return tube;
  }

  function buildWingSide(side) {
    // Skinned wings mount on a Group; the flap/fold handles are BONES the rig
    // rotates (drop-in for the old pivot/wingTip Groups). Non-skinned keeps Groups.
    const mount = skinned ? new THREE.Group() : null;
    const pivot = skinned ? new THREE.Bone() : new THREE.Group();
    // Root reported by the torso's attach contract, so the wings mount correctly
    // on any body plan (high on the back for the arrow drake, further forward and
    // lower on the long serpent) without this code knowing which body it's on.
    const wr = attach.wingRoot(side);
    // Skinned binds in local space then positions the MOUNT; the pivot bone sits
    // at the mount origin (=wing root). Non-skinned positions the pivot directly.
    if (!skinned) pivot.position.set(wr.x, wr.y, wr.z);

    // Shoulder joint — a mass anchoring the wing to the body. The bridge recipe
    // replaces this metallic ball with a continuous body-material deltoid
    // (buildShoulderBridge, below), so SKIP it when bridging. Otherwise wingRootScale
    // thickens it AND flares the base into a deltoid mound; rootScale 1 = byte-identical.
    if (!wantBridge) {
      const rootScale = model.wingRootScale ?? 1;
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.16 * rootScale, seg(9), seg(7)), armMat);
      shoulder.scale.set(1.1 + (rootScale - 1) * 0.9, 0.9, 1.2 + (rootScale - 1) * 0.9);
      if (rootScale !== 1) shoulder.position.set(0, -0.04, 0.02);
      pivot.add(shoulder);
    }

    // Membrane. Skinned: ONE continuous SkinnedMesh (added to the mount + bound
    // below). Non-skinned: the inner panel (root→wrist) rides the flap pivot.
    let skinnedMem = null;
    if (skinned) {
      skinnedMem = new THREE.SkinnedMesh(buildContinuousWingGeo(side), wingMat);
      skinnedMem.frustumCulled = false;     // skinning deforms outside the bind bbox
    } else {
      const innerMem = new THREE.Mesh(membranePanel(-Infinity, wristXGeo + seamOv, 0, 0), wingMat);
      innerMem.scale.x = side;
      pivot.add(innerMem);
    }

    // Forearm bone: root → wrist (the inner leading edge), stays on the pivot.
    // Skinned wings derive ALL ribs from the membrane surface instead (below).
    if (!skinned) pivot.add(wingStrut(wristXGeo * side, 0, 0.1, 0.04, armMat, wristLift));

    // wingTip pivots AT the wrist seam (x + arch-lift) so the outer wing folds —
    // a Bone when skinned (bends the skin), a Group otherwise (rotates the panel).
    // Elbow joint (skinned only): the flap travels shoulder→elbow→wrist as a
    // lagged cascade. The wrist is parented to the elbow so the rotations compound.
    const elbowLift = archLift(elbowXGeo, maxX, arc, ws);
    const elbow = skinned ? new THREE.Bone() : null;
    if (skinned) elbow.position.set(elbowXGeo * side, elbowLift, 0);
    const wingTip = skinned ? new THREE.Bone() : new THREE.Group();
    if (skinned) wingTip.position.set((wristXGeo - elbowXGeo) * side, wristLift - elbowLift, 0);
    else wingTip.position.set(wristXGeo * side, wristLift, 0);
    if (!skinned) {
      const outerMem = new THREE.Mesh(membranePanel(wristXGeo - seamOv, Infinity, wristXGeo, wristLift), wingMat);
      outerMem.scale.x = side;
      wingTip.add(outerMem);
    }

    // Finger / outer-arm bones (wrist → tips). NON-SKINNED only: rigid struts on
    // the wingTip group. Skinned wings build ribs that LIE ON the membrane and
    // bend with it (buildSkinnedRibs) so they can never poke through ("spokes").
    if (!skinned) for (let i = 0; i < wingSpec.tips.length; i++) {
      const [px, py] = wingSpec.tips[i];
      const lead = i === 0;
      // Inset the bone endpoints so the struts sit WITHIN the bowed/scalloped
      // membrane instead of poking past it like a kite frame — the leading "hand"
      // bone only a touch, the slim trailing finger struts well inside. Thinner
      // too, so they read as faint internal veins, not a skeleton.
      const ins = lead ? 0.95 : 0.8;
      const z = -py * ins;
      const tipX = px * 1.34 * ws * side * ins;
      const tipLift = archLift(tipX, maxX, arc, ws);
      const bx = tipX - wristXGeo * side; // bone origin = the wrist
      const by = tipLift - wristLift;
      wingTip.add(wingStrut(bx, z, lead ? 0.1 : 0.03, lead ? 0.02 : 0.008,
        lead ? armMat : boneMat, by));
      if (veinMat && !lead) {
        const vein = wingStrut(bx, z, 0.02, 0.005, veinMat, by);
        vein.position.y += 0.05;
        wingTip.add(vein);
      }
    }

    const marker = new THREE.Object3D();
    marker.position.set(wingSpec.tips[0][0] * 1.34 * ws * side - wristXGeo * side,
      archLift(maxX, maxX, arc, ws) - wristLift, -wingSpec.tips[0][1]);
    wingTip.add(marker);

    // Premium cyan TRAILING-EDGE rim (apex): trace tip[i]→tip[i+1] with thin
    // emissive ribs so the wing reads as a dark membrane with a glowing outline.
    // NON-SKINNED only — skinned wings build the rim as a surface tube (above) so
    // it follows the bent membrane instead of rigid ribs poking through it.
    if (!skinned && model.wingEdgeGlow && finEdgeMat) {
      for (let i = 0; i < wingSpec.tips.length - 1; i++) {
        const [ax, ay] = wingSpec.tips[i];
        const [bx, by] = wingSpec.tips[i + 1];
        const a = new THREE.Vector3(ax * 1.34 * ws * side - wristXGeo * side,
          archLift(ax * 1.34 * ws * side, maxX, arc, ws) - wristLift, -ay);
        const b = new THREE.Vector3(bx * 1.34 * ws * side - wristXGeo * side,
          archLift(bx * 1.34 * ws * side, maxX, arc, ws) - wristLift, -by);
        const dir = b.clone().sub(a);
        const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, dir.length(), seg(5)), finEdgeMat);
        rib.position.copy(a).add(b).multiplyScalar(0.5);
        rib.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        wingTip.add(rib);
      }
    }

    // Wingtip winglet (apex): a small swept fin at the very tip — dark membrane,
    // cyan rim, smooth bat-like — adding a distinctive outer-edge silhouette.
    if (model.wingtipFins && finEdgeMat) {
      const winglet = edgedFin(0.16, 0.5, finMembraneMat, finEdgeMat, 1.2);
      winglet.position.copy(marker.position);
      winglet.rotation.x = Math.PI / 2 + 0.35;     // lay back along the trailing direction
      winglet.rotation.z = side * 0.55;
      winglet.scale.setScalar(0.5 + ws * 0.45);
      wingTip.add(winglet);
    }

    if (skinned) { pivot.add(elbow); elbow.add(wingTip); } else { pivot.add(wingTip); }

    if (skinned) {
      // Ribs sampled from the membrane surface, bound to the SAME 3-bone skeleton
      // (shoulder→elbow→wrist) → the wing arm + finger veins bend exactly with the
      // skin. Bind in local space (mount at origin) so bone inverses + bind matrices
      // are offset-free, then move the whole rig onto the body. The animator rotates
      // the three bones in a lagged cascade; membrane AND ribs follow for free.
      const ribs = buildSkinnedRibs(skinnedMem.geometry);
      mount.add(pivot);
      mount.add(skinnedMem);
      for (const rib of ribs) mount.add(rib);
      // STATIC body anchor at the wing root (never rotated). The membrane + ribs bind
      // to a 4-bone skeleton [anchor, shoulder, elbow, wrist]; spanSkin welds the ROOT
      // BAND to this anchor so the broad wing grows FROM the body and its root never
      // swings off it during the flap. The shoulder BRIDGE reuses the same anchor.
      const anchorBone = new THREE.Bone();
      mount.add(anchorBone);
      let bridgeMesh = null;
      if (wantBridge) {
        bridgeMesh = buildShoulderBridge(skinnedMem.geometry, side);
        mount.add(bridgeMesh);
      }
      mount.updateMatrixWorld(true);
      const skeleton = new THREE.Skeleton([anchorBone, pivot, elbow, wingTip]);
      skinnedMem.bind(skeleton);
      for (const rib of ribs) rib.bind(skeleton);
      if (bridgeMesh) bridgeMesh.bind(new THREE.Skeleton([anchorBone, pivot]));
      mount.position.set(wr.x, wr.y, wr.z);
      group.add(mount);
    } else {
      group.add(pivot);
    }
    return { pivot, wingTip, marker, elbow, side, flapProfile };
  }

  const R = buildWingSide(1);
  const L = buildWingSide(-1);
  const wingPivotR = R.pivot, wingTipR = R.wingTip, tipMarkerR = R.marker;
  const wingPivotL = L.pivot, wingTipL = L.wingTip, tipMarkerL = L.marker;
  // Skinned wings expose a per-side flap RIG (shoulder/elbow/wrist + profile) so
  // the shared animator (dragonWingFlap) can drive the lagged cascade. Null for
  // non-skinned wings → dragon.js keeps its direct pivot/tip drive.
  const wingRigL = skinned ? { shoulder: L.pivot, elbow: L.elbow, wrist: L.wingTip, side: L.side, profile: L.flapProfile } : null;
  const wingRigR = skinned ? { shoulder: R.pivot, elbow: R.elbow, wrist: R.wingTip, side: R.side, profile: R.flapProfile } : null;

  // Secondary small wing pair (Obsidian T4/Toothless — near tail base)
  let wingPivot2L = null;
  let wingPivot2R = null;
  if (model.secondWingPair) {
    const ws2 = ws * 0.48;
    const miniGeo = new THREE.ShapeGeometry(buildWingShape(wingSpec));   // mini fins echo the main Night-Fury wing silhouette
    miniGeo.rotateX(-Math.PI / 2);
    miniGeo.scale(ws2, ws2, 1);
    applyWingGradient(miniGeo, def, 0.3, 0.9);
    const miniMat = wingMat.clone();

    for (const s of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.4, 0.3, 1.2);
      const w = new THREE.Mesh(miniGeo, miniMat);
      w.scale.x = s;
      pivot.add(w);
      group.add(pivot);
      if (s === 1) wingPivot2R = pivot;
      else wingPivot2L = pivot;
    }
  }

  // Hip / side fins (apex): a small swept fin at each hip — subtle, dark with a
  // cyan rim — filling the gap between the wings and the twin tail stabilizers so
  // the whole rear silhouette flows together.
  if (model.hipFins && finEdgeMat) {
    for (const s of [-1, 1]) {
      // Rear STABILIZER fins near the hips/tail-base (behind the main wings): dark,
      // nearly flat, swept with the flight line — control surfaces, not side flippers.
      const hip = edgedFin(0.16, 0.52, finMembraneMat, finEdgeMat, 1.1);
      hip.position.set(s * 0.32, 0.16, 1.25);
      hip.rotation.x = Math.PI / 2 + 0.1;        // lay nearly flat, swept toward the tail
      hip.rotation.z = s * 0.5;                  // gentle outward splay
      hip.rotation.y = s * 0.15;
      group.add(hip);
    }
  }

  return {
    group,
    parts: { wingPivotL, wingPivotR, wingTipL, wingTipR, tipMarkerL, tipMarkerR, wingPivot2L, wingPivot2R, wingRigL, wingRigR },
    wingMat,
    spineMats,
  };
}

// ── NONE ──────────────────────────────────────────────────────────────────
// A wingless body plan (a true river-serpent / sea-drake). Returns empty rig
// handles so the shared animation loop (dragon.js) drives them harmlessly — no
// geometry, no cost, no rig changes. The pivots sit at the wing-root so the
// contrail/wisp markers report a sensible body position. wingMat is a real
// material the rig can write emissive/opacity to (nothing renders it).
function buildNoneWings(def, model, attach) {
  const group = new THREE.Group();
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, transparent: true, opacity: 0,
    emissive: def.wingMembraneEmissive ?? def.wingEmissive, emissiveIntensity: 0,
  });
  const mk = (side) => {
    const pivot = new THREE.Group();
    const wr = attach.wingRoot(side);
    pivot.position.set(wr.x, wr.y, wr.z);
    const wingTip = new THREE.Group();
    const marker = new THREE.Object3D();
    wingTip.add(marker);
    pivot.add(wingTip);
    group.add(pivot);
    return { pivot, wingTip, marker };
  };
  const R = mk(1), L = mk(-1);
  return {
    group,
    parts: {
      wingPivotL: L.pivot, wingPivotR: R.pivot,
      wingTipL: L.wingTip, wingTipR: R.wingTip,
      tipMarkerL: L.marker, tipMarkerR: R.marker,
      wingPivot2L: null, wingPivot2R: null,
    },
    wingMat,
    spineMats: [],
  };
}

registerWings('membrane', buildMembraneWings);
// Smooth double-curved membrane (buildCurvedPatch) — coexists with 'membrane' so
// it can be proven on a hero before the roster migrates. Same rig handles.
registerWings('curvedMembrane', (def, model, attach, giM) => buildMembraneWings(def, model, attach, giM, { curved: true }));
// Continuous skinned membrane — the discrete wrist hinge becomes a smooth bend.
registerWings('skinnedMembrane', (def, model, attach, giM) => buildMembraneWings(def, model, attach, giM, { curved: true, skinned: true }));
// Skinned membrane + a continuous body-material shoulder bridge (deltoid), so the
// wing grows out of the body instead of bolting on at a pivot. Same rig handles.
registerWings('skinnedMembraneBridge', (def, model, attach, giM) => buildMembraneWings(def, model, attach, giM, { curved: true, skinned: true, bridge: true }));
registerWings('none', buildNoneWings);

// ── FEATHER ─────────────────────────────────────────────────────────────────
// The firebird wing (the Phoenix, folded out of its bespoke builder): a bird
// wing, not a membrane — a continuous translucent inner WEB (the secondaries)
// carries the broad surface, with broad overlapping feathers and an outer
// scalloped WEB whose deep notches read as primary feather tips. Strongly UPSWEPT
// so it arcs up like a spreading firebird. Mounts via attach.wingRoot (the avian
// torso reports the firebird's shoulder), F drives reach/rise/feather counts.
function buildFeatherWings(def, model, attach, _giM) {
  const F = model.formLevel ?? (model.spineGlow >= 1 ? 3 : model.spineGlow >= 0.6 ? 2 : model.spineGlow >= 0.25 ? 1 : 0);
  const group = new THREE.Group();
  const spineMats = [];

  const cBody = def.body;
  const cIn = def.featherIn ?? def.wingInner;
  const cOut = def.featherOut ?? def.wingOuter;
  const cEdge = def.featherEdge ?? def.apexSeam ?? def.wingEmissive;
  const cHi = def.featherHi ?? def.scales;
  const cEmis = def.wingEmissive;
  const cSeam = def.apexSeam ?? def.wingEmissive;
  const cCrest = def.horn ?? def.scales;

  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.5, side: THREE.DoubleSide,
    transparent: true, opacity: 0.82, emissive: cEmis, emissiveIntensity: 0.3,
  });
  const armMat = new THREE.MeshStandardMaterial({
    color: cCrest, emissive: cSeam, emissiveIntensity: 0.5, roughness: 0.32, metalness: 0.45,
  });
  const edgeMat = new THREE.MeshStandardMaterial({
    color: cEdge, emissive: cEdge, emissiveIntensity: 0.85 + F * 0.5, roughness: 0.3, metalness: 0.3,
  });
  edgeMat.userData.baseEmissive = cEdge;
  edgeMat.userData.baseIntensity = 0.85 + F * 0.5;
  spineMats.push(edgeMat);

  const ws = model.wingScale;
  const reach = (2.6 + F * 0.5) * ws;   // outward span of one wing
  const rise = (1.0 + F * 0.28) * ws;   // tip upsweep (Y at the wing tip)
  const back = 0.5 + F * 0.14;          // trailing-edge sweep
  const wristX = reach * 0.5, wristY = rise * 0.4, wristZ = 0.06;

  function feather(parent, side, rx, ry, rz, len, wid, sweep, dihedral, baseHex, tipHex, mat = wingMat) {
    const g = featherGeo(len, wid);
    featherGradient(g, baseHex, tipHex);
    const f = new THREE.Mesh(g, mat);
    f.position.set(rx * side, ry, rz);
    f.rotation.y = side * sweep;   // sweep outward + back
    f.rotation.x = dihedral;       // tilt the plane (dihedral / billow)
    f.rotation.z = side * 0.04;
    parent.add(f);
    return f;
  }

  function buildWing(side) {
    const pivot = new THREE.Group();
    const wr = attach.wingRoot(side);
    pivot.position.set(wr.x, wr.y, wr.z); // root high on the shoulders
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.17, seg(9), seg(7)), armMat);
    shoulder.scale.set(1.1, 0.85, 1.2);
    pivot.add(shoulder);
    pivot.add(bone(0, 0, 0, wristX * side, wristY, wristZ, 0.09, 0.05, armMat));

    // Inner web — a solid, arced, scalloped wing surface (shoulder → wrist).
    const innerSpan = wristX * 1.08;
    const chordRoot = 0.72 * ws, chordTip = 1.06 * ws;
    const sh = new THREE.Shape();
    sh.moveTo(0, 0);
    sh.lineTo(innerSpan, 0.05 * ws);             // leading edge → wrist
    const nSc = 5;
    for (let k = nSc; k >= 0; k--) {             // scalloped trailing edge → root
      const tx = k / nSc;
      const chord = chordRoot + (chordTip - chordRoot) * tx;
      const scallop = 0.07 * ws * (k % 2 === 0 ? 1 : 0.45);
      sh.lineTo(innerSpan * tx, chord - scallop);
    }
    const webGeo = new THREE.ShapeGeometry(sh, 12);
    webGeo.rotateX(Math.PI / 2);
    archUp(webGeo, innerSpan, rise * 0.5);
    webGradient(webGeo, cIn, cOut);
    const web = new THREE.Mesh(webGeo, wingMat);
    web.scale.x = side;
    pivot.add(web);

    // Secondary feathers — broad, overlapping, laid over the web.
    const nIn = 3 + F;
    for (let k = 0; k < nIn; k++) {
      const t = nIn > 1 ? k / (nIn - 1) : 0;
      const rx = innerSpan * (0.12 + t * 0.82);
      const ry = rise * 0.5 * (rx / innerSpan) * (rx / innerSpan) + 0.05;
      const len = (0.78 + Math.sin(t * Math.PI) * 0.38) * ws;
      feather(pivot, side, rx, ry, 0, len, 0.5 * ws, 0.24 + t * back * 0.34, -(0.04 + t * 0.07), cIn, cOut);
    }
    // Glowing leading-edge accent — elite forms only.
    if (F >= 2) pivot.add(bone(0.1 * side, 0.05, 0, wristX * side, wristY + 0.04, wristZ, 0.02, 0.014, edgeMat));

    // Outer primaries — a LAYERED feather group at the wrist.
    const wingTip = new THREE.Group();
    wingTip.position.set(wristX * side, wristY, wristZ);
    wingTip.add(bone(0, 0, 0, (reach - wristX) * side, rise - wristY, 0.02, 0.055, 0.02, armMat));
    if (F >= 2) wingTip.add(bone(0, 0.03, 0, (reach - wristX) * side, rise - wristY + 0.03, 0.02, 0.018, 0.01, edgeMat));
    const outerSpan = reach - wristX, oRise = rise - wristY;
    const oRoot = 1.0 * ws, oTip = 0.42 * ws;
    const so = new THREE.Shape();
    so.moveTo(0, 0);
    so.lineTo(outerSpan, 0.02 * ws);                  // leading edge → tip
    const nF = 4 + F;
    for (let k = nF; k >= 0; k--) {                   // notched trailing edge → wrist
      const tx = k / nF;
      const chord = oTip + (oRoot - oTip) * (1 - tx); // chord shrinks toward the tip
      const notch = (k % 2 === 0 ? 0.02 : 0.2) * ws;  // deep notches = feather separation
      so.lineTo(outerSpan * tx, chord - notch);
    }
    const oGeo = new THREE.ShapeGeometry(so, 14);
    oGeo.rotateX(Math.PI / 2);
    archUp(oGeo, outerSpan, oRise);
    webGradient(oGeo, cOut, cHi);
    const oWeb = new THREE.Mesh(oGeo, wingMat);
    oWeb.scale.x = side;
    wingTip.add(oWeb);
    for (let k = 0; k < 2; k++) {
      feather(wingTip, side, outerSpan * (0.1 + k * 0.22), oRise * (0.1 + k * 0.22) + 0.04, -0.03,
        (0.7 + k * 0.2) * ws, 0.5 * ws, 0.22 + k * 0.2, -0.05, cBody, cOut);
    }
    const marker = new THREE.Object3D();
    marker.position.set((reach - wristX) * side, rise - wristY, 1.1 * ws);
    wingTip.add(marker);
    pivot.add(wingTip);
    group.add(pivot);
    return { pivot, wingTip, marker };
  }

  const R = buildWing(1), L = buildWing(-1);
  return {
    group,
    parts: {
      wingPivotL: L.pivot, wingPivotR: R.pivot,
      wingTipL: L.wingTip, wingTipR: R.wingTip,
      tipMarkerL: L.marker, tipMarkerR: R.marker,
      wingPivot2L: null, wingPivot2R: null,
    },
    wingMat,
    spineMats,
  };
}

registerWings('feather', buildFeatherWings);

// ── BLADE-FEATHER COMB (AZURE, §3 col 1) ─────────────────────────────────────
// A falcon PRIMARY comb: a beveled leading ARM spar sweeping back, with N stiff
// feather-BLADES marching along it — separated by true planform GAPS + a z-stagger
// (never a filled mitten web), each a cambered plane with a raised central rib and
// a STRAIGHT taut leading edge (falcon, not phoenix-soft). Value tiers are PAINTED
// via per-vertex colour (root coverts darkest → leading blades lightest sky) with a
// GOLD diffuse tip-paint ONLY at the very tips (law 9 carrier — zero accent emissive
// on the wing). Motion: direct wingPivotL/R drive (dragon.js) + per-blade LAG pivots
// (the ASHTALON covert pattern) driven by the shared tick, and the outer blades ride
// the wrist group so a fold visibly CONTRACTS the span (§3 fold clause / §7 assert).
//
// Publishes the assert-metadata contract: parts.wingElements = [{root,tip,length}]
// per blade (local space) + the tip Object3Ds so a fold measurement re-reads span,
// and parts.wingBladePivotsL/R for the lag driver.
function buildBladeFeatherWings(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale || 1;

  const N = Math.max(3, Math.round(model.bladeCount ?? 5));
  const reach = (model.bladeSpan ?? 4.6) * ws;             // half-span (outer tip x)
  const sweep = model.bladeSweep ?? 0.44;                  // leading-arm back-sweep
  const stagger = Math.max(0.12, model.bladeStagger ?? 0.14); // z-stagger per blade (≥0.12)
  const camber = model.bladeCamber ?? 0.2;                // cambered plane billow
  const theta = model.bladeDihedral ?? 0.32;              // CONTINUOUS dihedral (~18°, §3 12–20°) — arm + blades share it (no gull kink)
  const armLen = reach * 0.82;                            // the leading arm; blades over-reach it to the tip envelope
  const chordK = model.bladeChord ?? 0.16;               // chord = chordK×reach (narrower → true planform gaps)

  // 3 PAINTED value tiers (gate r1 dir 4): leading blades lightest → root coverts
  // darkest. Gold is DIFFUSE tip-paint only (law-9 carrier), on the outer third.
  const cLight = def.wingInner ?? 0xa8c6e2;               // leading blade
  const cMid = 0x7fa3c8;                                  // mid blades
  const cDark = def.wingOuter ?? 0x3d5a78;                // root coverts / blade roots
  const cGold = model.wingTipGold ?? def.accentHue ?? 0xd9b36a;
  const goldAmt = model.wingTipGoldAmount ?? 1;   // per-form gold restraint (young forms earn it): 0 = no gold, 1 = full apex banner (default = byte-identical)

  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.58, metalness: 0.0,
    side: THREE.DoubleSide, opacity: 1.0,          // OPAQUE falcon primaries (dir 4), not glass
    emissive: def.wingEmissive ?? cDark, emissiveIntensity: model.wingPanelGlow ?? 0.05,
  });
  applyFresnelRim(wingMat, def.apexSeam ?? def.eye ?? cLight);
  // Leading-arm SPAR + covert material — MATTE horn (dir 1): dark, metalness 0, so it
  // reads as bone structure, never chrome scaffolding.
  const armMat = new THREE.MeshStandardMaterial({
    color: model.bladeSparColor ?? 0x6a7f96, roughness: 0.6, metalness: 0.0,
    emissive: 0x2a3a4c, emissiveIntensity: 0.3,           // lifted horn value so the spar reads as light structure, never near-black (r3 dir 5)
  });
  const ribMat = new THREE.MeshStandardMaterial({ color: cMid, roughness: 0.5, metalness: 0.0 });
  // Root coverts: a mid-dark tier (NOT near-black) so the wing root stays within ~2.5× of the
  // body flank and doesn't read as scattered black shards over the mid-body (gate r9 dir 7).
  const cCovert = model.bladeCovertColor ?? 0x2a4562;
  const covertMat = new THREE.MeshStandardMaterial({ color: cCovert, roughness: 0.6, metalness: 0.0, side: THREE.DoubleSide });

  // A cambered feather-blade in the wing plane: length +X, chord in Z (STRAIGHT taut
  // leading edge −Z, convex trailing +Z), tapering to a point. Painted baseHex→tipHex
  // with gold on the outer third. Camber lifts +Y.
  const bd = model.bladeDetail ?? 1;
  function bladeGeo(L, wRoot, baseHex, tipHex) {
    const nX = seg(Math.max(3, Math.round(7 * bd))), nZ = seg(Math.max(2, Math.round(4 * bd)));
    const verts = [], cols = [], idx = [];
    const cb = new THREE.Color(baseHex), ct = new THREE.Color(tipHex), cg = new THREE.Color(cGold), c = new THREE.Color();
    // Two-tone chord split (gate r5 dir 6): leading half rides brighter sky, trailing half
    // steps down a value — so each blade shows in-surface structure (with the rib), never a
    // blank gradient. Blended in on top of the along-length tier so the tiers still read.
    const cTrail = new THREE.Color(0x6f8cb0);
    for (let i = 0; i <= nX; i++) {
      const t = i / nX;
      const x = t * L;
      const zLead = -wRoot * 0.5 * (1 - t);
      const zTrail = wRoot * 0.5 * (1 - Math.pow(t, 1.4));
      for (let j = 0; j <= nZ; j++) {
        const cf = j / nZ;
        const z = zLead + (zTrail - zLead) * cf;
        const y = camber * Math.sin(cf * Math.PI) * (0.4 + 0.6 * Math.sin(t * Math.PI));
        verts.push(x, y, z);
        c.copy(cb).lerp(ct, t * t);
        c.lerp(cTrail, Math.max(0, cf - 0.5) * 0.7);   // trailing half deepens → visible chord structure (dir 6)
        // Gold DIFFUSE tip-paint confined to the outer ~12% with a CRISP boundary (gate r4
        // dir 7: law-9 tips only — no gradient wash down a third of the blade).
        if (t > 0.88) c.lerp(cg, goldAmt * Math.min(1, (t - 0.88) / 0.07));
        cols.push(c.r, c.g, c.b);
      }
    }
    const W = nZ + 1;
    for (let i = 0; i < nX; i++) for (let j = 0; j < nZ; j++) {
      const a = i * W + j, b = a + 1, d = a + W, e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  // swell-then-taper blade length curve — longest at position 2 of 5 (dir 5),
  // neighbours ×0.85 then ×0.72; a smooth curve for other counts.
  function lenMulFor(i) {
    if (N === 5) return [0.85, 1.0, 0.85, 0.72, 0.6][i];
    const t = i / (N - 1);
    return 0.6 + 0.4 * Math.sin(Math.min(1, (0.18 + t * 0.72)) * Math.PI);
  }
  const maxLen = reach * 0.55;

  // Roots MARCH 0.10→0.85 of the arm (dir 2). Roots rise linearly (continuous dihedral,
  // no kink). rakeI fans successive blades further back → true planform gaps (dir 3).
  const roots = [];
  for (let i = 0; i < N; i++) {
    const t = N > 1 ? i / (N - 1) : 0;
    const rootX = armLen * (0.10 + 0.75 * t);
    const rootY = rootX * Math.tan(theta);                 // continuous dihedral
    const rootZ = rootX * Math.tan(sweep) + stagger * i;   // sweep back + z-stagger
    const len = maxLen * lenMulFor(i);
    const wRoot = chordK * reach * (0.7 + 0.3 * Math.sin(t * Math.PI));
    // MODERATE progressive fan (gate r6 dir 5): r5's near-parallel rake (0.02+0.02i) welded
    // the comb into a solid deltoid in the PLANFORM (z-stagger separates in depth but not in
    // the top projection — MITTEN). This mid setting fans the OUTER 55–70% of adjacent blades
    // apart into TRUE through-slits while the wide-chord roots still overlap into one surface
    // near the arm; the taper makes the slits open toward the tips, not the roots.
    // bladeRake < 0 is a SENTINEL for "use the per-blade formula" — lets a young form set a
    // constant low rake (welds the comb into a solid MITTEN paddle, no sawtooth) while the
    // apex re-pins the formula through the cumulative merge with bladeRake:-1.
    const rakeI = (model.bladeRake != null && model.bladeRake >= 0)
      ? model.bladeRake
      : (0.04 + 0.045 * i);   // fan the OUTER blades a touch more so sky-slits open between blades 2–4 (gate r8 dir 3), roots still overlap
    // discrete tier: inner→dark, mid→cMid, outer→light
    const baseHex = t < 0.28 ? cDark : (t < 0.62 ? cMid : cLight);
    const tipHex = t < 0.28 ? cMid : cLight;
    roots.push({ t, rootX, rootY, rootZ, len, wRoot, rakeI, baseHex, tipHex });
  }

  const wristFrac = 0.30;
  const wristX = armLen * wristFrac;
  const wristY = wristX * Math.tan(theta);
  const wristZ = wristX * Math.tan(sweep);

  function buildSide(side) {
    const pivot = new THREE.Group();
    const wr = attach.wingRoot(side);
    pivot.position.set(wr.x, wr.y, wr.z);

    const wingTip = new THREE.Group();
    wingTip.position.set(wristX * side, wristY, wristZ);

    // Leading-arm SPAR — a MATTE tapered bone along the rising root line, thick at the
    // shoulder → 0.15× at the last root (dir 1), ENDING at the outermost blade root
    // (the blade over-reaches it, so nothing pokes past). Split at the wrist to fold.
    const spine = [{ x: 0.06, y: 0, z: -0.03 }, ...roots.map((r) => ({ x: r.rootX, y: r.rootY, z: r.rootZ }))];
    const baseR = 0.19 * ws;                                // thicker base so the root→0.15× taper is legible (dir 4)
    for (let s = 0; s < spine.length - 1; s++) {
      const a = spine[s], b = spine[s + 1];
      const inner = b.x < wristX;
      const par = inner ? pivot : wingTip;
      const ox = inner ? 0 : wristX, oy = inner ? 0 : wristY, oz = inner ? 0 : wristZ;
      const r0 = baseR * (1 - 0.85 * s / (spine.length - 1)) + 0.02;
      const r1 = baseR * (1 - 0.85 * (s + 1) / (spine.length - 1)) + 0.018;
      par.add(bone((a.x - ox) * side, a.y - oy, a.z - oz, (b.x - ox) * side, b.y - oy, b.z - oz, r0, r1, armMat));
    }

    // Root COVERTS / inner SECONDARIES — 4 overlapping shingles fairing the shoulder into
    // the comb AND deepening the inner-arm chord so the mid-arm is not a bare spar tube from
    // behind (gate r5 dir 4: mid-arm chord ≥0.35× longest blade). They lie FLAT on the wing
    // plane (dir 7: shingles, not upright cone-spikes — stand ≤0.05× blade length above the
    // spar) marching out along the arm with a clean ×0.8 size step (law 5).
    const covN = 3, covChord = chordK * reach * 1.4;         // broad chord → real inner surface; 3 keeps the apex under the tri ceiling
    for (let k = 0; k < covN; k++) {
      const size = 0.52 * Math.pow(0.8, k);                  // ×0.8 step; lower stack so the wing root stops dwarfing the body in side view (gate r10 dir 3)
      const cx = armLen * (0.06 + k * 0.18);                 // march OUT along the arm (inner 40%)
      const cy = cx * Math.tan(theta) + 0.01;
      const cz = cx * Math.tan(sweep) + 0.03;                // seat ON the spar, no float
      const cRest = new THREE.Group();
      cRest.position.set(cx * side, cy, cz);
      cRest.rotation.y = side * -(0.03 + k * 0.03);          // near-parallel, barely fanned
      cRest.rotation.z = side * (theta * 0.5);               // LIE FLAT toward the wing plane (dir 7 — no upright spikes)
      const cov = new THREE.Mesh(bladeGeo(maxLen * size, covChord, cDark, cMid), covertMat);
      cov.scale.x = side;
      cRest.add(cov);
      pivot.add(cRest);
    }

    const bladePivots = [];
    const elements = [];
    for (let i = 0; i < N; i++) {
      const { rootX, rootY, rootZ, len, wRoot, rakeI, baseHex, tipHex } = roots[i];
      const inner = rootX < wristX;
      const parent = inner ? pivot : wingTip;
      const px = inner ? rootX * side : (rootX - wristX) * side;
      const py = inner ? rootY : rootY - wristY;
      const pz = inner ? rootZ : rootZ - wristZ;

      // rest = static fan pose; lag = the animated covert-lag child. Dihedral is
      // CONSTANT (theta) across blades so the wing is a continuous plane (dir 14),
      // and rake fans the blades to open planform gaps (dir 3).
      const rest = new THREE.Group();
      rest.position.set(px, py, pz);
      rest.rotation.y = side * -rakeI;
      rest.rotation.z = side * theta;
      const lag = new THREE.Group();
      rest.add(lag);
      const mesh = new THREE.Mesh(bladeGeo(len, wRoot, baseHex, tipHex), wingMat);
      mesh.scale.x = side;
      lag.add(mesh);
      // Raised central RIB geometry (dir 4) — a slim tapered spar down the blade centre.
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.012 * ws, 0.03 * ws, len * 0.86, seg(4)), ribMat);
      rib.rotation.z = Math.PI / 2;                         // lie along +X
      rib.position.set(len * 0.43 * side, camber * 0.5, 0);
      lag.add(rib);
      const tipObj = new THREE.Object3D();
      tipObj.position.set(len * side, 0, 0);
      lag.add(tipObj);
      parent.add(rest);
      bladePivots.push({ pivot: lag, idx: i, side, restY: rest.rotation.y, restZ: rest.rotation.z });
      elements.push({ root: new THREE.Vector3(rootX, rootY, rootZ), len, tipObj });
    }

    const marker = new THREE.Object3D();
    marker.position.set((reach - wristX) * side, reach * Math.tan(theta) - wristY, wristZ);
    wingTip.add(marker);
    pivot.add(wingTip);
    group.add(pivot);
    return { pivot, wingTip, marker, bladePivots, elements };
  }

  const R = buildSide(1), L = buildSide(-1);
  // wingElements metadata (canonical right-side geometry) for the §7 asserts.
  const wingElements = R.elements.map((e) => ({
    root: e.root, tip: new THREE.Vector3(e.root.x + e.len, e.root.y, e.root.z), length: e.len, tipObj: e.tipObj,
  }));

  return {
    group,
    parts: {
      wingPivotL: L.pivot, wingPivotR: R.pivot,
      wingTipL: L.wingTip, wingTipR: R.wingTip,
      tipMarkerL: L.marker, tipMarkerR: R.marker,
      wingPivot2L: null, wingPivot2R: null,
      wingRigL: null, wingRigR: null,
      wingBladePivotsL: L.bladePivots, wingBladePivotsR: R.bladePivots,
      wingElements,
    },
    wingMat,
    spineMats,
  };
}

registerWings('bladeFeatherWings', buildBladeFeatherWings);

// ── EMBER GAPPED-FINGER MEMBRANE (EMBER, §3 col 2) ───────────────────────────
// A forge-born wyrm's broad-chord membrane: a THICK beveled leading ARM spar +
// propatagium fillet, then 4 finger RAYS as REAL tapering tube geometry (~0.82
// per-digit length scale, tip radius ~15% of base, raised ribs), with dark
// OPAQUE membrane panels webbed between them — deep scallops (0.22–0.30) on the
// free trailing edges and TRUE V-GAPS at the outer two rays (never a filled
// mitten web). Warm EMISSIVE lives ONLY on the ray tubes (a root-dark → tip-hot
// gradient, ≤1.2 — fire.tailBulb level, law-9 carrier); the membrane panels stay
// coal-dark with painted value tiers (leading lightest → root darkest).
//
// Motion path: the nightFury cascade — a shoulder→elbow→wrist rig published as
// wingRigL/R and driven by the shared flapWing animator (the fingered outer hand
// rides the WRIST group, so a fold furls the whole hand and CONTRACTS the span,
// §3 fold clause / §7 assert; the ember-specific hard furl lives in
// wingDebugPose's skinned branch, keyed on rig.furl, byte-identical for others).
//
// Publishes the §6.4 assert-metadata: parts.wingElements = [{root,tip,length,tipObj}]
// per ray (tipObj rides the wrist so a fold re-measures span), and the forge-collar
// MOTIF SOCKET's parts.motifAnchor (the model adopts it when the head has none).
function buildEmberMembraneWings(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale || 1;

  const N = Math.max(3, Math.round(model.rayCount ?? 4));
  const reach = (model.raySpan ?? 4.8) * ws;            // half-span (outer ray tip x)
  const sweep = model.raySweep ?? 0.62;                 // fan back-rake across the hand (rad, outer ray)
  const theta = model.rayDihedral ?? 0.26;             // wing dihedral (~15°, §3 10–18°)
  const camber = model.membraneCamber ?? 0.34;         // panel billow (+Y)
  const scallop = Math.min(0.30, Math.max(0.22, model.scallop ?? 0.26)); // festoon depth (§3 0.22–0.30)
  const chordK = model.wingChordScale ?? 1;            // panel chord multiplier
  const rayScale = model.rayScale ?? 0.82;             // per-digit length step
  const detail = model.rayDetail ?? 1;                 // per-form richness

  // A real jointed arm: the wrist sits at ~35% of half-span along a shoulder→elbow→
  // wrist march (gate r3: no single-point sunburst hub), and the fanned hand + webs
  // hang past it so a wrist furl sweeps the whole outer wing.
  const leadSweep = Math.tan(model.raySweepBack ?? 0.32);   // leading-edge back-sweep ~18° (§3 15–25°, gate r5 dir 3)
  const wristX = reach * 0.35;
  const elbowX = wristX * 0.52;
  const wristY = wristX * Math.tan(theta), wristZ = wristX * leadSweep;
  const elbowY = elbowX * Math.tan(theta), elbowZ = elbowX * leadSweep;
  // The METACARPAL hand: the 4 finger roots march a short knuckle arc from the wrist
  // (inner, leading) outward+aft, so no two rays share a root (≥0.04× half-span apart).
  const handSpanX = reach * 0.16, handSpanZ = reach * 0.09;

  // ── palette ─────────────────────────────────────────────────────────────────
  // Membrane: OPAQUE coal — dorsal 0x2a1208, root/ventral darker. Painted value
  // tiers via vertex colour (leading panel lightest → root darkest). NO warm
  // diffuse (law-9 carrier: ember's accent is emissive-only).
  // Membrane DIFFUSE is a single dark coal base; the value TIERS ride as grayscale
  // per-vertex multipliers (hue held, law 9) — so the broad mass carries ZERO warm
  // ACCENT diffuse (the §7 carrier assert reads memMat.color as this coal).
  const cMemBase = model.membraneBase ?? 0x2a160b;     // representative coal/ember diffuse (tiers ride as grayscale multipliers)
  const cAccent  = model.rayEmissive ?? def.accentHue ?? 0xff8b2a;   // lava emissive (ray tubes only)
  const rayEmisI = Math.min(1.2, model.rayEmissiveIntensity ?? 1.1);  // ≤1.2 (law 12 / fire.tailBulb)
  const cSpar    = model.sparColor ?? 0x5a4038;        // warm ash-scute leading spar (top diffuse tier)

  const memMat = new THREE.MeshStandardMaterial({
    color: cMemBase, vertexColors: true, roughness: 0.94, metalness: 0.0, envMapIntensity: 0.2,
    side: THREE.DoubleSide, emissive: 0x000000, emissiveIntensity: 0,   // ZERO emissive + very rough + low env → the coal holds WARM black, never drifts navy under cool studio light (gate r4 dir 7); accent lives on the RAY TUBES only (law-9 carrier)
  });
  const sparMat = new THREE.MeshStandardMaterial({ color: cSpar, roughness: 0.6, metalness: 0.04, emissive: 0x1a0d06, emissiveIntensity: 0.2 });
  // Ray-tube material: the tubes are the FIRE — a per-vertex emissive gradient
  // (deep-red root → bright-amber tip) baked as vertex colour, emissive base WHITE so
  // the colour IS the vertex ramp, cranked bright so the leading ray BLOOMS on the
  // near-dark backdrop (gate flame-r1: the rays must read as glowing fire, not
  // hairline pinstripes).
  const rayMat = new THREE.MeshStandardMaterial({
    color: 0x140a06, vertexColors: true, roughness: 0.5, metalness: 0.05,
    emissive: 0xffffff, emissiveIntensity: 2.0 * (rayEmisI / 1.2),   // blooms on the near-dark backdrop (gate flame-r2 dir 1)
  });
  rayMat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor;');   // vColor = the baked fire gradient
  };
  const rayRoot = new THREE.Color(0x9c2d08), rayTip = new THREE.Color(0xffb347);

  // A straight tapering RAY tube from `a` to `b`, base radius r0 → tip r1. `bright` is
  // the per-ray brightness (leading ray 1.0 → trailing dim); the hue ramps deep-red
  // root → amber tip along the length so each ray reads as a lit fire vein.
  function rayTube(a, b, r0, r1, brightBase, brightTip, ringsOverride, radialOverride) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length() || 1e-4;
    const rings = ringsOverride ?? seg(Math.max(3, Math.round(6 * detail)));
    const radial = radialOverride ?? seg(6);
    const verts = [], cols = [], idx = [];
    const up = Math.abs(dir.y) > 0.9 * len ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const t3 = dir.clone().normalize();
    const s3 = new THREE.Vector3().crossVectors(t3, up).normalize();
    const u3 = new THREE.Vector3().crossVectors(s3, t3).normalize();
    const cc = new THREE.Color();
    for (let s = 0; s <= rings; s++) {
      const t = s / rings;
      const c = new THREE.Vector3().lerpVectors(a, b, t);
      const r = r0 + (r1 - r0) * t;
      const bright = brightBase + (brightTip - brightBase) * (t * t);   // brighter toward the tip
      cc.copy(rayRoot).lerp(rayTip, Math.pow(t, 0.7)).multiplyScalar(bright);   // deep-red → amber, scaled by per-ray brightness
      for (let k = 0; k < radial; k++) {
        const ang = (k / radial) * Math.PI * 2;
        verts.push(c.x + (s3.x * Math.cos(ang) + u3.x * Math.sin(ang)) * r,
          c.y + (s3.y * Math.cos(ang) + u3.y * Math.sin(ang)) * r,
          c.z + (s3.z * Math.cos(ang) + u3.z * Math.sin(ang)) * r);
        cols.push(cc.r, cc.g, cc.b);
      }
    }
    for (let s = 0; s < rings; s++) for (let k = 0; k < radial; k++) {
      const p = s * radial + k, q = s * radial + (k + 1) % radial;
      const p2 = (s + 1) * radial + k, q2 = (s + 1) * radial + (k + 1) % radial;
      idx.push(p, p2, q, q, p2, q2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return new THREE.Mesh(g, rayMat);
  }

  // A cambered, scalloped MEMBRANE panel webbed between two ray centrelines A,B
  // (each {root,tip}). The panel fills the FULL quad (root→tip) so it reads as a
  // broad chord, not bare spokes; only the free TRAILING edge (u→1) scoops inward by
  // a shallow festoon (scallop × the panel's own CHORD, §3 0.22–0.30 — NOT × span).
  // notch>0 cuts a deeper V into the outer trailing edge (a true V-gap at the tip).
  // gPanel is the panel's value tier (leading panel brightest → root panel darkest).
  // notchDepth>0 cuts a TRUE V-GAP between the two rays: the membrane follows each ray
  // (v=0, v=1) to its tip but RECEDES in the middle (v≈0.5), so an open slit opens
  // between the rays while their tips stay membrane-backed (≤8% bare, no spokes).
  // trailCusps>0 cuts N scallop cusps into the free TRAILING edge (v→1) along the span
  // — the festoon read for the inboard brachial panel whose trailing edge is the v=1
  // boundary, not the outboard cap (gate r5 dir 2: inner scallops).
  function membranePanel(A, B, gPanel, notchDepth = 0, festoon = true, trailCusps = 0) {
    const nu = seg(Math.max(4, Math.round(6 * detail))), nv = seg(4);
    const verts = [], cols = [], idx = [];
    const pa = new THREE.Vector3(), pb = new THREE.Vector3(), p = new THREE.Vector3();
    const chord = A.tip.distanceTo(B.tip) || 1;      // the panel's free-edge width (scallop reference)
    const spanDir = new THREE.Vector3().subVectors(A.tip, A.root)
      .add(new THREE.Vector3().subVectors(B.tip, B.root)).normalize();
    for (let i = 0; i <= nu; i++) {
      const uu = i / nu;
      for (let j = 0; j <= nv; j++) {
        const v = j / nv;
        // per-v outboard cap: the V-notch recedes the MIDDLE of the trailing edge so a
        // real slit opens between the rays. sin^0.7 → a WIDE mouth (gate r5 dir 5), not a slit.
        const uMax = 1 - notchDepth * Math.pow(Math.sin(v * Math.PI), 0.7);
        const u = uu * uMax;
        pa.lerpVectors(A.root, A.tip, u);
        pb.lerpVectors(B.root, B.tip, u);
        p.lerpVectors(pa, pb, v);
        const bill = camber * Math.sin(v * Math.PI) * Math.sin(u * Math.PI) * chordK;
        p.y += bill;
        // festoon: the outer 45% of the free OUTBOARD trailing edge scoops in ≤ scallop×chord.
        if (festoon) {
          const edge = uu > 0.55 ? (uu - 0.55) / 0.45 : 0;
          const scoop = edge * scallop * chord * Math.sin(v * Math.PI);
          p.addScaledVector(spanDir, -scoop);
        }
        // trailing-edge scallop cusps (brachial): pull the v→1 edge toward leading in a
        // cusp wave along the span, so the inner trailing edge festoons (§3 0.24–0.30).
        if (trailCusps && v > 0.6) {
          const vE = (v - 0.6) / 0.4;
          const cusp = Math.abs(Math.sin(uu * trailCusps * Math.PI)) * 0.28 * chord * vE;
          p.addScaledVector(pb.clone().sub(pa).normalize(), -cusp);
        }
        verts.push(p.x, p.y, p.z);
        const g = gPanel * (0.85 + 0.15 * u);          // value tier with a HIGHER floor so the membrane reads warm-dark-red, not crushed black (gate flame-r2 dir 3)
        cols.push(g, g, g);
      }
    }
    const W = nv + 1;
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const a = i * W + j, b = a + 1, d = a + W, e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return new THREE.Mesh(g, memMat);
  }

  // swell-then-taper ray-length curve — longest at ray 1 (of 4), then ×rayScale.
  function lenMulFor(i) {
    if (N === 4) return [0.9, 1.0, 0.82, 0.6][i];
    const t = i / (N - 1);
    return 0.6 + 0.4 * Math.sin(Math.min(1, 0.2 + t * 0.7) * Math.PI);
  }
  const maxLen = reach - wristX;                       // outer hand length (wrist → tip envelope)

  // Ray roots MARCH the metacarpal hand arc (staggered in X and Z, never one point);
  // tips fan to the outer envelope with progressive back-rake → true planform gaps.
  // All wrist-local (added under the wrist group at wristX).
  function rayFor(i) {
    const t = N > 1 ? i / (N - 1) : 0;
    const rootX = t * handSpanX;                       // knuckles march outboard along the hand
    const rootZ = -0.06 + t * handSpanZ * 3.2;         // and spread aft (leading −Z → trailing +Z)
    const root = new THREE.Vector3(rootX, rootX * Math.tan(theta), rootZ);
    const len = (maxLen - rootX) * lenMulFor(i);       // measured from the knuckle to the tip envelope
    const rake = sweep * t;                            // outer rays rake back
    const tipX = rootX + len * Math.cos(rake);
    const tip = new THREE.Vector3(
      tipX,
      tipX * Math.tan(theta) + len * 0.06,             // arc UP with dihedral (gate r3 #11: not flat)
      rootZ + len * Math.sin(rake) + 0.10 * t + tipX * leadSweep);   // fan back-rake + the 18° leading-edge sweep (gate r5 dir 3)
    return { root, tip, len };
  }

  function buildSide(side) {
    const shoulder = new THREE.Group();                // rig.shoulder — carries the WHOLE wing
    const wr = attach.wingRoot(side);
    shoulder.position.set(wr.x, wr.y, wr.z);
    // elbow/wrist are the rig-contract bones (flapWing + the ember furl drive them); the
    // MEMBRANE lives entirely on the shoulder (via `hand`), never split across a joint —
    // so no group seam can open a mid-wing through-slit under dihedral (gate r4 dir 1).
    // The fold contraction comes from the shoulder YAW (the ember furl), which sweeps the
    // whole wing + its tip markers inboard. elbow/wrist stay empty.
    const elbow = new THREE.Group();
    elbow.position.set(elbowX * side, elbowY, elbowZ);
    const wrist = new THREE.Group();
    wrist.position.set((wristX - elbowX) * side, wristY - elbowY, wristZ - elbowZ);
    const hand = new THREE.Group();                     // static hand, at the wrist, under the shoulder
    hand.position.set(wristX * side, wristY, wristZ);
    shoulder.add(hand);

    // Leading ARM spar — a THICK beveled bone root→wrist (spar:membrane ≥10:1), ash toned.
    const baseR = 0.14 * ws;
    shoulder.add(bone(0.02 * side, 0, -0.04, wristX * side, wristY, wristZ - 0.02, baseR, baseR * 0.4, sparMat));

    // The fanned HAND: 4 ray tubes + webbed scalloped panels (positions are hand-local,
    // i.e. relative to the wrist — same coordinates the rays were authored in).
    const rays = [];
    for (let i = 0; i < N; i++) {
      const r = rayFor(i);
      const rr = { root: r.root.clone(), tip: r.tip.clone() };
      rr.root.x *= side; rr.tip.x *= side;
      rays.push({ ...r, root: rr.root, tip: rr.tip });
    }

    // Finger roots in SHOULDER space (the wrist group sits at wristX): the brachial's
    // outboard edge = this hand arc, so the inboard membrane and the finger fan share
    // one boundary and read as ONE continuous sheet (gate r3: no mid-wing slit).
    const rootShoulder = (i) => new THREE.Vector3(
      wristX * side + rays[i].root.x, wristY + rays[i].root.y, wristZ + rays[i].root.z);
    const hIn = rootShoulder(0), hOut = rootShoulder(N - 1);

    // BRACHIAL PATAGIUM — the deep inboard membrane, leading = the arm (root→wrist=hIn),
    // trailing = the body flank → the OUTER finger root (hOut). Fills the whole inner
    // wing with broad chord and butts the hand arc (no slit). On the shoulder group.
    {
      const innerChord = reach * 0.34;                 // deep root chord (carries the area)
      const A = { root: new THREE.Vector3(0.02 * side, 0.02, -0.05), tip: hIn.clone() };
      const B = { root: new THREE.Vector3(-0.06 * side, -0.05, innerChord), tip: hOut.clone() };
      shoulder.add(membranePanel(A, B, 0.82, 0, false, 2));   // no outboard festoon; 2 trailing-edge scallop cusps (gate r5 dir 2)
    }
    // PROPATAGIUM fillet — the small leading membrane FORE of the arm.
    {
      const A = { root: new THREE.Vector3(0.02 * side, 0.03, -0.05 - reach * 0.05), tip: hIn.clone().add(new THREE.Vector3(0, 0.01, -0.02)) };
      const B = { root: new THREE.Vector3(0.02 * side, 0.02, -0.04), tip: hIn.clone() };
      shoulder.add(membranePanel(A, B, 1.05, 0, false));   // brightest leading tier
    }
    // Inter-finger panels. The INNER panel [0-1] webs FULL (continuous with the
    // brachial); the OUTER TWO intervals [1-2],[2-3] get a deep V-NOTCH → true through
    // gaps between the rays, tips still membrane-backed (§3 col 2, gate r4 dir 2/4).
    for (let i = 0; i < N - 1; i++) {
      const notchDepth = i >= 1 ? 0.62 : 0;          // intervals 1-2, 2-3 = the outer two V-gaps (WIDE mouths)
      const gPanel = [1.12, 0.88, 0.64][i] ?? 0.64;  // strong value tiers: leading panel lightest → outer darkest
      hand.add(membranePanel(rays[i], rays[i + 1], gPanel, notchDepth));
    }
    // ray tubes ON TOP of the panels (drawn after, sit just above the skin), warm-emissive.
    // Rim gradient (gate r2 dir 9): the LEADING ray is brightest, trailing rays fade to
    // ≤40% — so the wing reads BACKLIT, not neon-wireframed. Each ray also ramps its own
    // length dark(root)→hot(tip).
    const elements = [];
    for (let i = 0; i < N; i++) {
      const r = rays[i];
      const r0 = 0.15 * ws * (0.85 + 0.3 * (1 - i / N));   // thick glow BAND (gate flame-r2 dir 1: ~4–6px at chase distance)
      const rimHot = 1.0 - 0.5 * (i / (N - 1));       // ray0 leading = 1.0 → trailing ray ~0.5
      // clamp the visible tube to 94% of the ray so its tip ends AT the membrane, no
      // bare-spoke overshoot (gate flame-r2 dir 2); the tipObj metadata keeps full length.
      const vTip = r.root.clone().lerp(r.tip, 0.94);
      const tube = rayTube(r.root, vTip, r0, r0 * 0.18, 0.55 * rimHot, rimHot);   // root visible red → amber tip; brighter floor
      hand.add(tube);
      const tipObj = new THREE.Object3D();
      tipObj.position.copy(r.tip);
      hand.add(tipObj);
      elements.push({ root: r.root.clone(), len: r.len, tipObj });
    }
    // LAVA-CRACK seams on the membrane (gate flame-r1 dir 2): ONE short thin glowing
    // crack per inner panel near the ray roots, fading outward (law 8). Cheap (3 rings).
    for (let i = 0; i < N - 2; i++) {
      const mid = rays[i].root.clone().lerp(rays[i + 1].root, 0.5);
      const out = rays[i].tip.clone().lerp(rays[i + 1].tip, 0.5).sub(mid).normalize();
      const end = mid.clone().addScaledVector(out, rays[i].len * 0.32);
      end.z += 0.12; end.x += 0.06 * side;
      hand.add(rayTube(mid, end, 0.05 * ws, 0.01 * ws, 1.1, 0.4, 3, 4));   // WIDER + brighter lava crack, hot root → fading tip; low-poly
      // a short forked branch for a jagged crack read
      const br = mid.clone().addScaledVector(out, rays[i].len * 0.14); br.z -= 0.16; br.x += 0.03 * side;
      hand.add(rayTube(mid, br, 0.04 * ws, 0.008 * ws, 1.0, 0.35, 3, 4));
    }

    elbow.add(wrist);
    shoulder.add(elbow);
    group.add(shoulder);
    return { shoulder, elbow, wrist, side, elements,
      profile: { foldAmp: 0.5, spreadFold: 0.34 } };
  }

  const R = buildSide(1), L = buildSide(-1);
  // wingElements metadata (canonical right side) for the §7 asserts.
  const wingElements = R.elements.map((e) => ({
    root: e.root, tip: e.root.clone().add(new THREE.Vector3(e.len, 0, 0)), length: e.len, tipObj: e.tipObj,
  }));

  // Forge-collar MOTIF SOCKET (§6.3) — built once at the midline between the wing
  // roots, static on the wing group (rear-visible every frame), bloom per form.
  const collar = buildForgeCollar(def, model, attach, spineMats);
  if (collar) group.add(collar.group);

  const wingRigL = { shoulder: L.shoulder, elbow: L.elbow, wrist: L.wrist, side: L.side, profile: L.profile, furl: true };
  const wingRigR = { shoulder: R.shoulder, elbow: R.elbow, wrist: R.wrist, side: R.side, profile: R.profile, furl: true };

  return {
    group,
    parts: {
      wingPivotL: L.shoulder, wingPivotR: R.shoulder,
      wingTipL: L.wrist, wingTipR: R.wrist,
      tipMarkerL: null, tipMarkerR: null,
      wingPivot2L: null, wingPivot2R: null,
      wingRigL, wingRigR,
      wingElements,
      motifAnchor: collar ? collar.motifAnchor : null,
    },
    wingMat: memMat,
    spineMats,
  };
}

// ── FORGE COLLAR — ember's MOTIF SOCKET (§6.3, §5d) ──────────────────────────
// The dragon's ONE bloom (law 12), at the nape / wing-root yoke, rear-visible every
// frame. Per-form geometry+emissive SWAP in this ONE place, driven by model.collarStage:
//   0 = two dull coals between the wing roots (emissive ~0.35)
//   1 = a glowing collar arc across the yoke
//   2 = a blazing yoke with a 6-spike corona (the single brightest point)
// Publishes { group, motifAnchor:{local,radius} } — anchor position invariant across
// forms (§7 drift ≤0.15), bloom radius monotonic. Coals→arc→corona, base hue held.
function buildForgeCollar(def, model, attach, spineMats) {
  const stage = Math.max(0, Math.round(model.collarStage ?? 0));
  const cHot = model.collarColor ?? def.accentHue ?? 0xff8b2a;
  const cCoal = 0x3a1206;
  const group = new THREE.Group();
  // Anchor at the yoke midline, just above/behind the shoulders (INVARIANT across forms).
  const wr = attach.wingRoot(1);
  const ax = 0, ay = wr.y + 0.14, az = wr.z + 0.12;
  group.position.set(ax, ay, az);

  const coalMat = (i) => new THREE.MeshStandardMaterial({
    color: cCoal, emissive: cHot, emissiveIntensity: i, roughness: 0.7, metalness: 0.1 });

  let radius = 0.18;
  if (stage <= 0) {
    // two WAKING coals flanking the spine — the hatchling's first embers. On the light
    // baby body a dark-diffuse coal reads as a black lump (the "charcoal lump" §5d warns
    // against), so the diffuse is a warm ember-brown and the emissive glows enough to
    // read as HOT-but-young: alive, not blazing (the arc/corona are still stages away).
    // gate cp2 dir 3: the coals were near-invisible DOTS at rear-chase capture distance —
    // the fix is SIZE (~0.06× body length so they resolve as two distinct embers) with a
    // dull warm glow (they are STILL just waking; the arc/corona are the later blooms).
    const babyCoalMat = new THREE.MeshStandardMaterial({
      color: 0x8a3410, emissive: cHot, emissiveIntensity: 0.95, roughness: 0.6, metalness: 0.08 });   // brighter (gate cp2 dir 5) so the coals break into the rear-chase dark frame
    for (const s of [-1, 1]) {
      const coal = new THREE.Mesh(new THREE.SphereGeometry(0.18, seg(7), seg(6)), babyCoalMat);
      coal.scale.set(1.15, 0.85, 1.05);
      coal.position.set(s * 0.2, 0.05, 0.02);           // lifted proud of the yoke so they clear the wing roots in the rear tile
      group.add(coal);
    }
    spineMats.push(babyCoalMat);
    radius = 0.28;
  } else if (stage === 1) {
    // a glowing collar arc across the yoke (gate cp2 dir 3: arc emissive +50%, 0.7→1.05)
    const arcMat = coalMat(1.05);
    const segs = seg(9);
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, a = (t - 0.5) * Math.PI * 0.9;
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.055 + 0.03 * Math.cos(a), seg(6), seg(5)), arcMat);
      bead.position.set(Math.sin(a) * 0.34, Math.cos(a) * 0.12, -Math.abs(Math.sin(a)) * 0.06);
      group.add(bead);
    }
    spineMats.push(arcMat);
    radius = 0.33;
  } else {
    // stage 2 — blazing forge yoke: 3 distinct COAL spheres (the bloom core, the single
    // brightest point on the dragon — law 12) ringed by 6 THICK tapered spikes that
    // RADIATE in 3D. The spikes carry a HALF emissive + warm diffuse so real lighting
    // shades each face per angle (gate r4: a fully-emissive corona read as a flat
    // sticker). Total corona ≤0.8× head length.
    // gate cp2 dir 3: bloom UP — the corona must be UNAMBIGUOUSLY the brightest point in the
    // rear-chase glide. Coal core emissive 2.6→3.6 and the whole yoke grown so it out-reads a
    // thumbnail. (Law 12: the ONE bloom — it MAY blow to white under ACES.)
    const coalMat2 = new THREE.MeshStandardMaterial({ color: 0x1c0d08, emissive: 0xffe08a, emissiveIntensity: 7.5, roughness: 0.5, metalness: 0.05 });   // near-white-gold core, peak luminance beats every other pixel incl. the wing leading edges (gate cp2 r3 dir 5)
    for (const [cx, cy, cz, cr] of [[0, 0.06, 0.02, 0.24], [-0.2, -0.01, 0.0, 0.18], [0.2, -0.01, 0.0, 0.18]]) {
      const coal = new THREE.Mesh(new THREE.SphereGeometry(cr, seg(10), seg(8)), coalMat2);
      coal.position.set(cx, cy, cz);
      group.add(coal);
    }
    // spikes: warm diffuse + MODERATE emissive so directional light shades the cone faces
    // (dimensional), and they stay dimmer than the coal bloom core. Clearly separated +
    // thick so the 6-spike construction reads at a 4× close-up (gate r5 dir 1).
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0x6a2810, emissive: cHot, emissiveIntensity: 1.0, roughness: 0.5, metalness: 0.06 });
    const M = 6;
    const CS = 2.4;                                       // gate cp2 dir 5: corona ≥1.5× the round-1 footprint so the yoke dominates the rear-chase
    const lens = [0.28, 0.40, 0.5, 0.42, 0.33, 0.24].map((l) => l * CS);   // swell-then-taper, no two equal (law 5)
    const yUp = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3();
    for (let i = 0; i < M; i++) {
      const t = i / (M - 1);
      const az = (t - 0.5) * Math.PI * 1.2;              // fan wide across the top (clear separation)
      const len = lens[i];
      const spike = new THREE.Mesh(new THREE.ConeGeometry(len * 0.36, len, seg(7)), spikeMat);   // base ≥0.3× length → THICK pyramidal, not a needle
      dir.set(Math.sin(az), Math.cos(az) * 0.92 + 0.2, -0.26).normalize();   // up-and-out, leaning back over the yoke
      spike.quaternion.setFromUnitVectors(yUp, dir);
      spike.position.copy(dir).multiplyScalar(0.13 + len * 0.5).add(new THREE.Vector3(0, 0.06, -0.02));
      group.add(spike);
    }
    spineMats.push(coalMat2, spikeMat);
    radius = 0.7;
  }
  return { group, motifAnchor: { local: new THREE.Vector3(ax, ay, az), radius } };
}

registerWings('emberMembraneWings', buildEmberMembraneWings);
