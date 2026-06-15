import * as THREE from 'three';
import {
  DEFAULT_WING, wingSpecFor, buildWingShape, buildFeatherWingShape,
  archWing, archLift, wingStrut, applyWingGradient, edgedFin,
  featherGeo, featherGradient, webGradient, archUp, bone,
} from './dragonParts.js';
import { registerWings } from './dragonRecipe.js';

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
function buildMembraneWings(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];

  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.55, side: THREE.DoubleSide,
    transparent: true, opacity: model.wingOpacity ?? 0.82, // translucent membrane — see rings through it
    // wingMembraneEmissive retints the PANEL glow (default = wingEmissive); the
    // stealth apex sets it to a dark navy so cyan stays on the edges, not the fill.
    emissive: def.wingMembraneEmissive ?? def.wingEmissive, emissiveIntensity: model.wingPanelGlow ?? 0.28,
  });

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
  const seamOv = 0.22 * ws;
  const wristLift = archLift(wristXGeo, maxX, arc, ws);
  function membranePanel(clipMin, clipMax, originX, originY) {
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

  function buildWingSide(side) {
    const pivot = new THREE.Group();
    // Root reported by the torso's attach contract, so the wings mount correctly
    // on any body plan (high on the back for the arrow drake, further forward and
    // lower on the long serpent) without this code knowing which body it's on.
    const wr = attach.wingRoot(side);
    pivot.position.set(wr.x, wr.y, wr.z);

    // Shoulder joint — a small mass anchoring the wing to the body.
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.16, 9, 7), armMat);
    shoulder.scale.set(1.1, 0.9, 1.2);
    pivot.add(shoulder);

    // Inner membrane panel (root→wrist) rides the flap pivot.
    const innerMem = new THREE.Mesh(membranePanel(-Infinity, wristXGeo + seamOv, 0, 0), wingMat);
    innerMem.scale.x = side;
    pivot.add(innerMem);

    // Forearm bone: root → wrist (the inner leading edge), stays on the pivot.
    pivot.add(wingStrut(wristXGeo * side, 0, 0.1, 0.04, armMat, wristLift));

    // wingTip pivots AT the wrist seam (x + arch-lift) so the outer panel folds
    // cleanly; its membrane is re-origined to the seam to sit exactly where the
    // old single membrane did at rest.
    const wingTip = new THREE.Group();
    wingTip.position.set(wristXGeo * side, wristLift, 0);
    const outerMem = new THREE.Mesh(membranePanel(wristXGeo - seamOv, Infinity, wristXGeo, wristLift), wingMat);
    outerMem.scale.x = side;
    wingTip.add(outerMem);

    // Finger / outer-arm bones (wrist → tips) ride wingTip so they FOLD WITH the
    // outer membrane — the bright leading edge breaks at the wrist instead of
    // staying rigid while the membrane folds away from it. (i=0 is the bright
    // "hand" continuing the forearm; the rest are slimmer finger struts.)
    for (let i = 0; i < wingSpec.tips.length; i++) {
      const [px, py] = wingSpec.tips[i];
      const z = -py * 1.0;
      const tipLift = archLift(px * 1.34 * ws * side, maxX, arc, ws);
      const lead = i === 0;
      const bx = px * 1.34 * ws * side - wristXGeo * side; // bone origin = the wrist
      const by = tipLift - wristLift;
      wingTip.add(wingStrut(bx, z, lead ? 0.1 : 0.04, lead ? 0.02 : 0.012,
        lead ? armMat : boneMat, by));
      if (veinMat && !lead) {
        const vein = wingStrut(bx, z, 0.028, 0.006, veinMat, by);
        vein.position.y += 0.05;
        wingTip.add(vein);
      }
    }

    const marker = new THREE.Object3D();
    marker.position.set(wingSpec.tips[0][0] * 1.34 * ws * side - wristXGeo * side,
      archLift(maxX, maxX, arc, ws) - wristLift, -wingSpec.tips[0][1]);
    wingTip.add(marker);

    // Premium cyan TRAILING-EDGE rim (apex): trace tip[i]→tip[i+1] with thin
    // emissive ribs so the wing reads as a dark membrane with a glowing outline
    // (never a solid glowing panel). Rides wingTip so it folds at the wrist too.
    if (model.wingEdgeGlow && finEdgeMat) {
      for (let i = 0; i < wingSpec.tips.length - 1; i++) {
        const [ax, ay] = wingSpec.tips[i];
        const [bx, by] = wingSpec.tips[i + 1];
        const a = new THREE.Vector3(ax * 1.34 * ws * side - wristXGeo * side,
          archLift(ax * 1.34 * ws * side, maxX, arc, ws) - wristLift, -ay);
        const b = new THREE.Vector3(bx * 1.34 * ws * side - wristXGeo * side,
          archLift(bx * 1.34 * ws * side, maxX, arc, ws) - wristLift, -by);
        const dir = b.clone().sub(a);
        const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, dir.length(), 5), finEdgeMat);
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

    pivot.add(wingTip);
    group.add(pivot);
    return { pivot, wingTip, marker };
  }

  const R = buildWingSide(1);
  const L = buildWingSide(-1);
  const wingPivotR = R.pivot, wingTipR = R.wingTip, tipMarkerR = R.marker;
  const wingPivotL = L.pivot, wingTipL = L.wingTip, tipMarkerL = L.marker;

  // Secondary small wing pair (Obsidian T4/Toothless — near tail base)
  let wingPivot2L = null;
  let wingPivot2R = null;
  if (model.secondWingPair) {
    const ws2 = ws * 0.48;
    const miniGeo = new THREE.ShapeGeometry(buildWingShape(DEFAULT_WING));
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
    parts: { wingPivotL, wingPivotR, wingTipL, wingTipR, tipMarkerL, tipMarkerR, wingPivot2L, wingPivot2R },
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
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.17, 9, 7), armMat);
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
