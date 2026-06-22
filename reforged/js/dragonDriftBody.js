import * as THREE from 'three';
import { registerTorso } from './dragonRecipe.js';
import { buildTorso } from './dragonTorso.js';
import { sweepProfileSmooth } from './dragonSweep.js';

// ── DRIFT BODY ───────────────────────────────────────────────────────────────
// A self-bodied, sleek Night-Fury torso authored to the green-screen reference
// (refs/dragon-body-green.png → refs/body-anatomy.json). It builds its OWN body
// mesh (unlike nightFuryTorso, which is body-less and grows the body from the
// wings), so the clean-sheet tracedWing can attach to a real shoulder. Smooth
// longitudinal loft (sweepProfileSmooth) for a no-facet skin.
//
// Stations: [z, halfWidth, keelTop, belly, cy]  (head at −z, tail at +z)
//   cy = centreline lift (head rides up the neck, tail droops then tips up), so the
//   SIDE profile reads as the posed reference, not a flat plank.

const SECTION_N = 20;
function driftSection(w, top, bot) {
  const pts = [];
  const ex = 2.5;                                   // >2 = fuller rounded flanks (chunky, not oval)
  const shape = (c) => Math.sign(c) * Math.pow(Math.abs(c), 2 / ex);
  for (let i = 0; i < SECTION_N; i++) {
    const a = (i / SECTION_N) * Math.PI * 2 + Math.PI / 2;   // i=0 → top (+y), CCW
    const sx = shape(Math.cos(a)), sy = shape(Math.sin(a));
    pts.push([sx * w, sy * (sy >= 0 ? top : bot)]);
  }
  return pts;
}

const DRIFT_PROFILE = {
  zHold: 0,
  longSamples: 56,
  tailShiftRefZ: 1.70,
  tailAnchorY: 0.26,
  tailAnchorZ: 1.18,
  ring: driftSection,
  stations: [
    // HEAD — blunt snout → wide rounded cranium, held low + forward.
    [-3.00, 0.085, 0.060, 0.080, -0.02],
    [-2.78, 0.190, 0.130, 0.175, 0.00],
    [-2.55, 0.285, 0.190, 0.265, 0.03],  // cranium — wide cheeks
    [-2.32, 0.300, 0.210, 0.280, 0.05],
    [-2.08, 0.300, 0.245, 0.290, 0.06],  // skull base
    // NECK — short + thick (head sits at the shoulders).
    [-1.82, 0.365, 0.295, 0.355, 0.08],
    // BODY — deep chest barrel (wing root), pinched waist, muscular haunch.
    [-1.50, 0.540, 0.405, 0.560, 0.10],  // fore-shoulder
    [-1.10, 0.700, 0.485, 0.715, 0.11],  // shoulder/ribcage (broad + deep)
    [-0.70, 0.745, 0.495, 0.760, 0.10],  // CHEST PEAK (widest, wing root)
    [-0.30, 0.700, 0.470, 0.730, 0.07],  // chest back
    [ 0.10, 0.575, 0.410, 0.610, 0.02],  // thorax
    [ 0.48, 0.405, 0.350, 0.420, -0.03], // belly → waist
    [ 0.78, 0.300, 0.290, 0.300, -0.07], // WAIST pinch
    [ 1.05, 0.400, 0.320, 0.395, -0.10], // HAUNCH bulge
    [ 1.32, 0.355, 0.300, 0.345, -0.14], // haunch back
    // TAIL — long thin, sweeps DOWN then the tip kicks UP (line-of-beauty).
    [ 1.60, 0.245, 0.225, 0.215, -0.18],
    [ 2.00, 0.184, 0.176, 0.165, -0.23],
    [ 2.40, 0.142, 0.138, 0.128, -0.27],
    [ 2.80, 0.108, 0.105, 0.096, -0.28],
    [ 3.20, 0.078, 0.075, 0.068, -0.25],
    [ 3.60, 0.050, 0.049, 0.044, -0.17],
    [ 3.95, 0.027, 0.027, 0.024, -0.07],
    [ 4.25, 0.013, 0.013, 0.013, 0.01],  // tail tip
  ],
  keel: [[-3.00, 0.06], [-2.32, 0.21], [-1.10, 0.49], [-0.30, 0.47], [0.48, 0.35], [1.20, 0.22], [2.80, 0.10], [4.25, 0.02]],
  wingRoot: { x: 0.45, y: 0.56, z: -0.55 },          // high on the back over the chest (the broad shoulder)
  fairing: { r: 0.28, scale: [0.86, 0.78, 1.2], pos: [0.44, 0.55, -0.5] },
  neck: {
    rBase: 0.40, rStep: 0.045, rMin: 0.18, scale: [0.8, 0.66, 1.3],
    y0: 0.30, yStep: 0.085, z0: -2.0, zStep: -0.36, wobbleAmp: 0.08, wobbleFreq: 0.8,
  },
  headBase: (neckSegs) => ({ x: 0, y: 0.5, z: -2.4 }),
};

registerTorso('driftBody', (def, model, bodyMat) =>
  buildTorso(DRIFT_PROFILE, def, model, bodyMat,
    (profile, stretch) => sweepProfileSmooth({ ...profile, ring: profile.ring || driftSection }, stretch)));

export { DRIFT_PROFILE, driftSection };
