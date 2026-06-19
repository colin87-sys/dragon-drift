// ── HULL BODY PROFILES (data, no geometry) ───────────────────────────────────
// Each profile is the BODY SHAPE recipe a hull dragon feeds to dragonHull.js
// (`def.hull.profile`). Station = [z, halfWidth, keelTop, belly, cy] where cy is
// the centreline LIFT (5th channel) that bends the spine so the side silhouette
// reads posed. The longitudinal Catmull-Rom (sweepProfileSmooth) rounds ALONG z;
// the super-ellipse section (def.hull.section) rounds AROUND. Authored on the
// same z-axis layout as the proven Night-Fury hull (nose ≈ −4, tail tip ≈ +4) so
// the weld/seam/feature defaults hold, but with DISTINCT widths/keel/cy + section
// + per-form wing outlines → three silhouettes that share no read.
//
//   FIRE  — lean predatory raptor: narrow + deep-chested, ARCHED spine (head up,
//           tail drooped), pinched waist, long thin whip tail for the flame bulb.
//   WATER — manta: FLAT + WIDE (low keel, broad flanks), short, thin whip tail.
//   EARTH — cragback: HEAVY + broad + tall-backed tank, tail tapers then SWELLS
//           into a stone club at the tip.

const headBase = (frontZ) => (neckSegs) => ({ x: 0, y: 0.5 + (neckSegs - 4) * 0.09, z: frontZ - (neckSegs - 4) * 0.34 });

export const FIRE_PROFILE = {
  zHold: 0, longSamples: 54,
  tailShiftRefZ: 1.70, tailAnchorY: 0.20, tailAnchorZ: 1.18,
  stations: [
    [-4.20, 0.052, 0.066, 0.064,  0.50], // nose (lifted → arched)
    [-4.00, 0.100, 0.150, 0.140,  0.48], // snout
    [-3.78, 0.150, 0.235, 0.205,  0.46], // upper jaw
    [-3.54, 0.180, 0.320, 0.255,  0.43], // cranium — narrow, tall (raptor)
    [-3.30, 0.180, 0.300, 0.245,  0.40], // cranium back
    [-3.08, 0.195, 0.270, 0.225,  0.33], // skull base
    [-2.82, 0.240, 0.290, 0.250,  0.20], // neck — thin
    [-2.50, 0.310, 0.360, 0.315,  0.10], // neck → shoulder
    [-2.05, 0.420, 0.500, 0.430,  0.02], // fore-shoulder — deep keel
    [-1.50, 0.470, 0.560, 0.470,  0.00], // ribcage
    [-1.00, 0.480, 0.575, 0.475,  0.00], // CHEST PEAK — narrow + deep
    [-0.48, 0.450, 0.535, 0.450,  0.00], // chest (wing-root centre)
    [ 0.05, 0.380, 0.450, 0.385, -0.02], // thorax
    [ 0.45, 0.290, 0.350, 0.300, -0.05], // WAIST pinch (lean)
    [ 0.85, 0.235, 0.290, 0.245, -0.09], // mid-body
    [ 1.20, 0.195, 0.250, 0.205, -0.14], // haunch
    [ 1.50, 0.168, 0.220, 0.180, -0.19], // tail base
    [ 1.85, 0.142, 0.190, 0.150, -0.25], // tail droops (arch)
    [ 2.25, 0.116, 0.156, 0.122, -0.32],
    [ 2.70, 0.090, 0.120, 0.092, -0.39],
    [ 3.20, 0.062, 0.084, 0.064, -0.45],
    [ 3.70, 0.034, 0.046, 0.035, -0.50],
    [ 4.15, 0.012, 0.014, 0.012, -0.52], // long thin whip tip (flame bulb sits here)
  ],
  keel: [[-4.30, 0.30], [-3.54, 0.40], [-2.05, 0.46], [-1.00, 0.50], [-0.48, 0.46], [0.45, 0.34], [1.50, 0.20], [2.70, 0.10], [4.15, 0.02]],
  wingRoot: { x: 0.42, y: 0.46, z: -0.45 },
  headBase: headBase(-3.08),
};

export const WATER_PROFILE = {
  zHold: 0, longSamples: 54,
  tailShiftRefZ: 1.70, tailAnchorY: 0.16, tailAnchorZ: 1.18,
  stations: [
    [-4.05, 0.090, 0.046, 0.052,  0.18], // blunt soft nose (low, flat)
    [-3.84, 0.190, 0.092, 0.108,  0.17], // snout
    [-3.58, 0.300, 0.140, 0.165,  0.16], // wide cheeks (flat head)
    [-3.30, 0.360, 0.165, 0.190,  0.14], // head — WIDE + LOW
    [-3.02, 0.380, 0.168, 0.192,  0.10], // head back
    [-2.70, 0.430, 0.185, 0.205,  0.05], // neck → shoulder (broad, flat)
    [-2.20, 0.620, 0.235, 0.255,  0.01], // fore-shoulder — broad flat shelf
    [-1.55, 0.800, 0.290, 0.300,  0.00], // shoulder — WIDEST (manta wing mount)
    [-0.95, 0.880, 0.310, 0.318,  0.00], // body PEAK width, low height
    [-0.40, 0.840, 0.300, 0.308,  0.00], // wing-root centre (broad)
    [ 0.18, 0.700, 0.270, 0.278,  0.00], // mid-body (still wide)
    [ 0.62, 0.520, 0.230, 0.238, -0.01], // narrowing
    [ 1.05, 0.370, 0.190, 0.196, -0.03], // hip
    [ 1.45, 0.260, 0.158, 0.162, -0.06], // tail base
    [ 1.85, 0.190, 0.130, 0.132, -0.09], // tail
    [ 2.30, 0.140, 0.104, 0.105, -0.12],
    [ 2.80, 0.098, 0.080, 0.080, -0.15],
    [ 3.30, 0.062, 0.054, 0.054, -0.17], // thin whip
    [ 3.80, 0.030, 0.028, 0.028, -0.18],
    [ 4.20, 0.010, 0.010, 0.010, -0.18], // whip tip (fluke sits here)
  ],
  keel: [[-4.05, 0.05], [-3.30, 0.17], [-1.55, 0.29], [-0.95, 0.31], [-0.40, 0.30], [0.62, 0.23], [1.45, 0.16], [2.80, 0.08], [4.20, 0.01]],
  wingRoot: { x: 0.55, y: 0.28, z: -0.40 },   // low + lateral (flat wide back)
  headBase: headBase(-3.02),
};

export const EARTH_PROFILE = {
  zHold: 0, longSamples: 54,
  tailShiftRefZ: 1.70, tailAnchorY: 0.30, tailAnchorZ: 1.18,
  stations: [
    [-4.00, 0.090, 0.090, 0.090,  0.26], // blunt heavy nose
    [-3.80, 0.190, 0.205, 0.195,  0.25], // snout (thick)
    [-3.56, 0.270, 0.320, 0.285,  0.24], // jaw
    [-3.30, 0.320, 0.400, 0.335,  0.22], // cranium — broad blunt
    [-3.05, 0.330, 0.385, 0.330,  0.19], // cranium back
    [-2.80, 0.360, 0.370, 0.330,  0.12], // skull base — thick
    [-2.50, 0.460, 0.420, 0.385,  0.05], // neck — SHORT + thick
    [-2.10, 0.620, 0.520, 0.480,  0.01], // fore-shoulder — massive
    [-1.55, 0.720, 0.600, 0.545,  0.00], // ribcage — broad, TALL back
    [-1.00, 0.745, 0.625, 0.560,  0.00], // BACK PEAK (broad + tall, plate shelf)
    [-0.45, 0.715, 0.600, 0.540,  0.00], // wing-root centre (broad)
    [ 0.10, 0.640, 0.540, 0.495,  0.00], // thorax (heavy)
    [ 0.55, 0.560, 0.470, 0.435, -0.01], // barely a waist (tank)
    [ 1.00, 0.480, 0.405, 0.375, -0.02], // haunch — powerful
    [ 1.40, 0.400, 0.350, 0.320, -0.03], // tail base — THICK
    [ 1.80, 0.320, 0.290, 0.262, -0.04],
    [ 2.25, 0.245, 0.228, 0.205, -0.05],
    [ 2.70, 0.180, 0.172, 0.152, -0.06], // tapering toward the club neck
    [ 3.10, 0.130, 0.126, 0.110, -0.06], // club NECK (pinch before the head)
    [ 3.42, 0.175, 0.170, 0.150, -0.06], // club swell begins
    [ 3.72, 0.240, 0.235, 0.210, -0.06], // CLUB head (broad stone mass)
    [ 3.98, 0.230, 0.225, 0.200, -0.06], // club
    [ 4.18, 0.120, 0.118, 0.105, -0.06], // club back taper
    [ 4.34, 0.020, 0.020, 0.020, -0.06], // club tip
  ],
  keel: [[-4.00, 0.12], [-3.30, 0.22], [-2.10, 0.42], [-1.00, 0.50], [-0.45, 0.48], [0.55, 0.39], [1.40, 0.30], [2.70, 0.18], [3.72, 0.22], [4.34, 0.03]],
  wingRoot: { x: 0.50, y: 0.50, z: -0.45 },
  headBase: headBase(-3.05),
};
