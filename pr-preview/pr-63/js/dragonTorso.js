import * as THREE from 'three';
import { registerTorso } from './dragonRecipe.js';

// Torso modules — the dragon's BODY PLAN, the first part extracted behind the
// recipe registry (dragonRecipe.js). A body plan is now DATA: a profile object
// (cross-section stations + neck + fairings + mount points) fed to one generic
// loft. The arrowhead drake and a long serpent are two profiles of the same
// builder, so a genuinely different skeleton drops in without touching the
// wing / tail / head code.
//
// THE ATTACH CONTRACT
// Every torso build returns { group, attach }. `attach` is how the rest of the
// model mounts limbs without knowing which body it's on:
//   attach.wingRoot(side) → {x,y,z}  where a wing pivot sits (mirrored by side)
//   attach.headBase       → {x,y,z}  where the head group is placed
//   attach.tailAnchor     → {y,z}    where the tail group roots
//   attach.keelTopAt(z)   → number   crest height (incl. the torso y-offset) for
//                                      running a spine / ridges down the back
//   attach.tailShift      → number   z-shift already folded into tailAnchor
// The arrow profile reports exactly the constants the legacy builder hard-coded,
// so the shipped roster is pixel-for-pixel unchanged.

const TORSO_Y = 0.2; // the torso mesh sits at y=0.2; spine math adds this in.

// Shared cross-section: keel apex on top, widest at mid-height, rounded belly.
// Ordered CCW looking toward -z so face winding points outward. (Identical to
// the loft the redesign shipped — every membrane dragon reuses this section.)
function bladeRing(w, top, bot) {
  return [
    [0, top], [-w * 0.70, top * 0.30], [-w, -bot * 0.10], [-w * 0.62, -bot * 0.64],
    [0, -bot], [w * 0.62, -bot * 0.64], [w, -bot * 0.10], [w * 0.70, top * 0.30],
  ];
}

// Generic lofted torso from a profile's [z, halfWidth, keelTop, belly] stations.
// `stretch` lengthens ONLY the after-body (stations behind zHold move toward +z)
// so the head/shoulder/wing-root attach zone stays pinned — a longer, sleeker
// drake without fattening it.
function buildTorsoGeometry(profile, stretch = 1) {
  const { stations, zHold, ring = bladeRing } = profile;
  const M = 8;
  const zAt = (z) => (z > zHold ? zHold + (z - zHold) * stretch : z);
  const verts = [];
  for (const [z, w, top, bot] of stations)
    for (const [x, y] of ring(w, top, bot)) verts.push(x, y, zAt(z));
  const idx = [];
  for (let s = 0; s < stations.length - 1; s++) {
    const a0 = s * M, b0 = (s + 1) * M;
    for (let m = 0; m < M; m++) {
      const n = (m + 1) % M;
      idx.push(a0 + m, b0 + m, a0 + n, a0 + n, b0 + m, b0 + n);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Top-of-keel height at a body z, interpolated over the profile's keel line.
function keelTopFor(profile, z) {
  const pts = profile.keel;
  if (z <= pts[0][0]) return pts[0][1];
  if (z >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    if (z <= pts[i + 1][0]) {
      const t = (z - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
      return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t;
    }
  }
  return pts[pts.length - 1][1];
}

// Assemble torso mesh + wing-root fairings + neck chain into one group, and
// publish the attach contract. bodyMat is the dragon's shared body material;
// the torso clones it DoubleSide so the closed loft is robust to face winding.
function buildTorso(profile, def, model, bodyMat) {
  const group = new THREE.Group();
  const stretch = model.bodyStretch ?? 1;

  const torsoMat = bodyMat.clone();
  torsoMat.side = THREE.DoubleSide;
  const torso = new THREE.Mesh(buildTorsoGeometry(profile, stretch), torsoMat);
  torso.position.y = TORSO_Y;
  group.add(torso);

  // Smooth fairings where the wings attach, so they never look bolted on.
  const fr = profile.fairing;
  for (const s of [-1, 1]) {
    const root = new THREE.Mesh(new THREE.SphereGeometry(fr.r, 9, 7), bodyMat);
    root.scale.set(fr.scale[0], fr.scale[1], fr.scale[2]);
    root.position.set(s * fr.pos[0], fr.pos[1], fr.pos[2]);
    group.add(root);
  }

  // Neck chain — slim spheres bridging the torso's neck cap to the head.
  const n = profile.neck;
  const neckSegs = model.neckSegments;
  for (let i = 0; i < neckSegs; i++) {
    const neck = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(n.rBase - i * n.rStep, n.rMin), 9, 7), bodyMat);
    neck.scale.set(n.scale[0], n.scale[1], n.scale[2]);
    neck.position.set(
      Math.sin(i * n.wobbleFreq) * n.wobbleAmp,
      n.y0 + i * n.yStep,
      n.z0 + i * n.zStep);
    group.add(neck);
  }

  const wr = profile.wingRoot;
  const hb = profile.headBase(neckSegs);
  const tailShift = (profile.tailShiftRefZ - profile.zHold) * (stretch - 1);

  const attach = {
    wingRoot: (side) => ({ x: wr.x * side, y: wr.y, z: wr.z }),
    headBase: hb,
    tailAnchor: { y: profile.tailAnchorY, z: profile.tailAnchorZ + tailShift },
    keelTopAt: (z) => TORSO_Y + keelTopFor(profile, z),
    tailShift,
  };
  return { group, attach };
}

// ===========================================================================
// PROFILES
// ===========================================================================
// ARROW — the shipped arrowhead drake. Every constant matches the legacy builder
// exactly (stations, ring, keel line, fairing, neck, head anchor, tail shift) so
// azure/ember/jade/obsidian/pearl/solar render pixel-for-pixel unchanged.
const ARROW_PROFILE = {
  zHold: 0,
  tailShiftRefZ: 1.70,
  tailAnchorY: 0.28,
  tailAnchorZ: 1.15,
  stations: [
    [-3.05, 0.15, 0.10, 0.13], // neck cap (meets the neck chain)
    [-2.45, 0.30, 0.22, 0.24], // neck base
    [-1.65, 0.52, 0.42, 0.38], // fore-shoulder
    [-0.85, 0.66, 0.54, 0.46], // shoulder peak — broadest, tallest keel
    [-0.10, 0.55, 0.45, 0.40], // thorax
    [ 0.60, 0.39, 0.33, 0.29], // waist (clear pinch)
    [ 1.15, 0.29, 0.25, 0.20], // narrow hips
    [ 1.70, 0.17, 0.17, 0.11], // slim tail root
  ],
  keel: [[-2.45, 0.22], [-0.85, 0.54], [-0.10, 0.45], [0.60, 0.33], [1.15, 0.25], [1.70, 0.17]],
  wingRoot: { x: 0.5, y: 0.55, z: -0.25 }, // high on the back — the legacy constant
  fairing: { r: 0.3, scale: [0.86, 0.78, 1.2], pos: [0.46, 0.54, -0.4] },
  neck: {
    rBase: 0.46, rStep: 0.045, rMin: 0.2, scale: [0.8, 0.66, 1.3],
    y0: 0.3, yStep: 0.085, z0: -2.0, zStep: -0.36, wobbleAmp: 0.1, wobbleFreq: 0.8,
  },
  headBase: (neckSegs) => ({ x: 0, y: 0.5 + (neckSegs - 4) * 0.09, z: -3.08 - (neckSegs - 4) * 0.34 }),
};

// SERPENT — a long, slim EASTERN river-dragon body. The first NEW body plan: the
// after-body is stretched ~45% and slimmed ~22%, the keel is lower and flatter,
// and the wing roots / head sit further forward on a longer neck. Wings, tail and
// head mount correctly via the attach contract alone — none of that code knows
// it's now riding a serpent.
const SERPENT_PROFILE = {
  zHold: -0.6,            // hold further forward so the long tail-boom does the stretching
  tailShiftRefZ: 2.40,
  tailAnchorY: 0.24,
  tailAnchorZ: 1.55,
  stations: [
    [-3.30, 0.12, 0.07, 0.10],
    [-2.60, 0.22, 0.15, 0.17],
    [-1.80, 0.34, 0.26, 0.27], // slimmer, longer fore-body (no broad shoulder peak)
    [-0.95, 0.42, 0.32, 0.34],
    [-0.10, 0.40, 0.30, 0.33], // gentle, even girth — a tube, not a blade
    [ 0.80, 0.34, 0.25, 0.28],
    [ 1.70, 0.24, 0.19, 0.18],
    [ 2.55, 0.13, 0.13, 0.09], // very slim, very long tail root
  ],
  keel: [[-2.60, 0.15], [-0.95, 0.32], [-0.10, 0.30], [0.80, 0.25], [1.70, 0.19], [2.55, 0.13]],
  wingRoot: { x: 0.36, y: 0.40, z: -0.45 }, // small wings, forward + low on the slim body
  fairing: { r: 0.24, scale: [0.8, 0.74, 1.25], pos: [0.34, 0.42, -0.5] },
  neck: {
    rBase: 0.36, rStep: 0.026, rMin: 0.16, scale: [0.82, 0.72, 1.45],
    y0: 0.26, yStep: 0.06, z0: -2.2, zStep: -0.42, wobbleAmp: 0.16, wobbleFreq: 0.7,
  },
  headBase: (neckSegs) => ({ x: 0, y: 0.42 + (neckSegs - 4) * 0.07, z: -3.45 - (neckSegs - 4) * 0.40 }),
};

registerTorso('arrow', (def, model, bodyMat) => buildTorso(ARROW_PROFILE, def, model, bodyMat));
registerTorso('serpent', (def, model, bodyMat) => buildTorso(SERPENT_PROFILE, def, model, bodyMat));

export { ARROW_PROFILE, SERPENT_PROFILE, buildTorso };
