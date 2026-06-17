import * as THREE from 'three';
import {
  DEFAULT_WING, wingSpecFor, buildWingShape, buildFeatherWingShape,
  archWing, archLift, wingStrut, applyWingGradient, edgedFin,
  featherGeo, featherGradient, webGradient, archUp, bone, buildCurvedPatch,
} from './dragonParts.js';
import { registerWings } from './dragonRecipe.js';
import { seg } from './modelDetail.js';
import { composeSurface, membraneSSSPatch } from './dragonSurfaceShader.js';

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

  // Skin weights along span |x|: shoulder(0) → elbow(1) → wrist(2), smooth-stepped
  // across bands at the elbow and the wrist. Shared by the membrane AND the surface
  // ribs so they deform identically. The animator rotates the three bones in a
  // LAGGED CASCADE (shoulder leads, elbow + wrist follow) for a whip-like organic
  // flap — the membrane bends through the whole arm, not just one hinge.
  const foldBand = 0.7 * ws;
  const elbowXGeo = wristXGeo * 0.52;                // mid-forearm joint
  // Spanwise × chordwise resolution of the continuous skinned membrane — the
  // single biggest tessellation knob on the hero. Detail-scaled: HIGH = 24×6
  // (today), ULTRA densifies the fold curve + billow for a smooth wing on idle
  // GPUs, LOW trims it for the weakest devices. The surface ribs sample this grid.
  const SEG_U = seg(24), SEG_V = seg(6);
  const sstep = (x) => { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); };
  // Two active bones (a→b blended by t) for a span position; padded to 4 wide.
  function spanSkin(ax) {
    const e = elbowXGeo, w = wristXGeo, b = foldBand;
    let a = 2, bb = 2, t = 0;
    if (ax <= e - b) { a = 0; bb = 0; }
    else if (ax < e + b) { a = 0; bb = 1; t = sstep((ax - (e - b)) / (2 * b)); }
    else if (ax <= w - b) { a = 1; bb = 1; }
    else if (ax < w + b) { a = 1; bb = 2; t = sstep((ax - (w - b)) / (2 * b)); }
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

    // Shoulder joint — a mass anchoring the wing to the body. wingRootScale thickens
    // it so the wing swells into the thorax (Night Fury); additive, default unchanged.
    const rootScale = model.wingRootScale ?? 1;
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.16 * rootScale, seg(9), seg(7)), armMat);
    shoulder.scale.set(1.1, 0.9, 1.2);
    pivot.add(shoulder);

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
      mount.updateMatrixWorld(true);
      const skeleton = new THREE.Skeleton([pivot, elbow, wingTip]);
      skinnedMem.bind(skeleton);
      for (const rib of ribs) rib.bind(skeleton);
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
      const hip = edgedFin(0.13, 0.42, finMembraneMat, finEdgeMat, 1.2);
      hip.position.set(s * 0.34, 0.24, 0.95);
      hip.rotation.x = Math.PI / 2 + 0.2;        // lay back, sweeping toward the tail
      hip.rotation.z = s * 0.7;                  // splay outward and down
      hip.rotation.y = s * 0.2;
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
