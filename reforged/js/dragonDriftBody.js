import * as THREE from 'three';
import { registerTorso } from './dragonRecipe.js';
import { buildTorso } from './dragonTorso.js';
import { sweepProfileSmooth } from './dragonSweep.js';
import { DRIFT_STATIONS, DRIFT_KEEL } from './driftBodyStations.js';

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
  stations: DRIFT_STATIONS,            // traced torso back/belly (driftBodyStations.js)
  keel: DRIFT_KEEL,
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
