import * as THREE from 'three';
import { registerWings } from './dragonRecipe.js';

// SIDE FINS — lateral astral energy vanes, NOT flapping wings. `sideFinPairs`
// (per form) pairs of swept, glow-edged sails mounted along the front body
// plates (via attach.sideFinRoots), widest at the lead and shrinking rearward,
// so they widen the rear-camera silhouette without ever flapping like a bat.
//
// All left fins ride wingPivotL, all right fins wingPivotR — the rig's normal
// flap handles, but the wyrm's tiny flapAmp/flapBias turn that beat into a slow
// bank/flex. The fin fill is returned as wingMat so the rig brightens it on
// boost / Surge; the glow rim is in spineMats so its edges flare on Surge.

// A premium swept vane: a curved blade membrane with a glowing rim behind, a
// raised inner glow panel (a visible second surface), a bright leading-edge RIB
// bone, and a tip gem — a structured astral sail, not a flat card.
function buildSail(len, wid, fillMat, edgeMat) {
  const shape = (l, w) => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(l * 0.5, w * 0.9, l * 0.96, w * 0.5);   // leading edge bows out
    s.quadraticCurveTo(l * 1.02, w * 0.16, l * 0.86, -w * 0.04); // to a fine swept tip
    s.quadraticCurveTo(l * 0.5, -w * 0.18, 0, -w * 0.12);        // trailing edge back to root
    return s;
  };
  const g = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.ShapeGeometry(shape(len * 1.08, wid * 1.16), 14), edgeMat);
  rim.position.z = -0.02;
  g.add(rim);
  g.add(new THREE.Mesh(new THREE.ShapeGeometry(shape(len, wid), 14), fillMat));
  // Raised inner glow panel — a smaller sail sat proud, so the membrane reads as
  // two layered surfaces with a luminous inlay.
  const inner = new THREE.Mesh(new THREE.ShapeGeometry(shape(len * 0.6, wid * 0.5), 8), edgeMat);
  inner.position.set(len * 0.06, 0, 0.02);
  g.add(inner);
  // Leading-edge rib bone (root → swept tip).
  const a = new THREE.Vector3(0, 0, 0), b = new THREE.Vector3(len * 0.92, wid * 0.32, 0);
  const dir = b.clone().sub(a);
  const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.05, dir.length(), 5), edgeMat);
  rib.position.copy(a).add(b).multiplyScalar(0.5);
  rib.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  g.add(rib);
  // Tip gem.
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(wid * 0.12, 0), edgeMat);
  gem.position.copy(b);
  g.add(gem);
  return g;
}

function buildSideFins(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const cSeam = def.apexSeam ?? def.wingEmissive;
  const cInner = def.wingInner ?? def.body;

  // Translucent astral fin membrane (the rig brightens this on boost/Surge).
  const wingMat = new THREE.MeshStandardMaterial({
    color: cInner, emissive: def.wingEmissive, emissiveIntensity: model.wingPanelGlow ?? 0.34,
    roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide,
    transparent: true, opacity: model.wingOpacity ?? 0.62,
  });
  // Glow-edged rim that flares on Surge.
  const edgeInt = (0.8 + giM * 0.4);
  const edgeMat = new THREE.MeshStandardMaterial({
    color: cSeam, emissive: cSeam, emissiveIntensity: edgeInt,
    roughness: 0.3, metalness: 0.3, side: THREE.DoubleSide,
  });
  edgeMat.userData.baseEmissive = cSeam;
  edgeMat.userData.baseIntensity = edgeInt;
  spineMats.push(edgeMat);

  const pairs = Math.max(1, model.sideFinPairs ?? 1);
  const span = (model.wingSpan ?? 1) * (model.wingScale ?? 1);
  const sweep = model.sideFinSweep ?? 0.7;

  const wingPivotL = new THREE.Group();
  const wingPivotR = new THREE.Group();
  // Pivot at the body centreline so the rig's gentle flap banks the whole fin
  // bank up/down (a flex, not a flap).
  for (const p of [wingPivotL, wingPivotR]) p.position.set(0, 0.5, 0);

  const mkSide = (side, pivot) => {
    for (let i = 0; i < pairs; i++) {
      const root = attach.sideFinRoots
        ? attach.sideFinRoots(side, i)
        : { x: 0.4 * side, y: 0.6, z: -0.2 + i * 0.7 };
      // Front pairs largest; taper rearward.
      const k = 1 - i / (pairs + 1) * 0.55;
      const len = 2.4 * span * k;
      const wid = 0.95 * span * k;
      const fin = buildSail(len, wid, wingMat, edgeMat);
      fin.scale.x = side;                       // mirror so the sail sweeps outward
      const holder = new THREE.Group();
      holder.add(fin);
      // Lay the sail near-horizontal, swept back and spread FLAT out to the sides
      // (a wide glider spread) so it widens the silhouette without rising above the
      // head/aim line (§0.5: fins push out to the sides, not up).
      holder.rotation.y = side * (0.5 + sweep * 0.4);  // sweep back
      holder.rotation.z = side * -1.28;                // roll flat-and-out (low spread)
      holder.rotation.x = 0.04;
      holder.position.set(root.x, root.y - 0.5, root.z); // local to the pivot (pivot.y=0.5)
      pivot.add(holder);
    }
  };
  mkSide(1, wingPivotR);
  mkSide(-1, wingPivotL);
  group.add(wingPivotL, wingPivotR);

  // Empty fold/marker handles so the shared rig drives them harmlessly (the side
  // fins have no wrist fold); markers ride the lead fin tip for contrails.
  const wingTipL = new THREE.Group(), wingTipR = new THREE.Group();
  const tipMarkerL = new THREE.Object3D(), tipMarkerR = new THREE.Object3D();
  const lead = attach.sideFinRoots ? attach.sideFinRoots(1, 0) : { x: 0.5, y: 0.6, z: -0.2 };
  tipMarkerR.position.set(lead.x + 2 * span, lead.y - 0.5, lead.z);
  tipMarkerL.position.set(-lead.x - 2 * span, lead.y - 0.5, lead.z);
  wingPivotR.add(wingTipR); wingTipR.add(tipMarkerR);
  wingPivotL.add(wingTipL); wingTipL.add(tipMarkerL);

  return {
    group,
    parts: {
      wingPivotL, wingPivotR, wingTipL, wingTipR,
      tipMarkerL, tipMarkerR, wingPivot2L: null, wingPivot2R: null,
    },
    wingMat,
    spineMats,
  };
}

registerWings('sideFins', buildSideFins);
