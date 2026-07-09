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
  // Lean RAPTOR but properly proportioned (Rev3): SHORT neck (head back near the
  // shoulders), DEEP belly (belly > keelTop in the chest = muscular, not a thin tube),
  // pinched waist, a real S-curve cy (head low → shoulder hump → tail sweeps DOWN → tip
  // KICKS UP), and a long thin tail whose up-kicked tip carries the flame.
  stations: [
    // HEAD — compact, low flat crown, held forward + low (short neck)
    [-2.95, 0.075, 0.055, 0.072, -0.02], // nose
    [-2.78, 0.155, 0.105, 0.150,  0.00], // snout (width via SIDE)
    [-2.58, 0.220, 0.160, 0.210,  0.03], // jaw
    [-2.38, 0.250, 0.190, 0.240,  0.05], // CRANIUM — broad cheeks, low crown
    [-2.20, 0.245, 0.195, 0.235,  0.06], // cranium back
    [-2.02, 0.258, 0.225, 0.252,  0.07], // skull base
    // NECK — short, thick
    [-1.82, 0.305, 0.270, 0.320,  0.09], // neck
    // BODY — a lean RAPTOR but with a CHUNKY deep chest (belly drop, not a thin tube), a pinched
    // cat WAIST, then a muscular HAUNCH bulge, then the long thin tail.
    [-1.52, 0.430, 0.390, 0.510,  0.11], // fore-shoulder — deep belly begins
    [-1.12, 0.530, 0.450, 0.620,  0.12], // ribcage — deep raptor chest
    [-0.68, 0.560, 0.460, 0.650,  0.11], // CHEST PEAK — deep + broad (muscular, still lean)
    [-0.30, 0.530, 0.440, 0.620,  0.08], // chest (wing-root centre)
    [ 0.10, 0.420, 0.380, 0.490,  0.03], // thorax (chunky)
    [ 0.46, 0.300, 0.305, 0.350, -0.03], // WAIST — pinched (lean cat tuck)
    [ 0.80, 0.330, 0.285, 0.350, -0.08], // HAUNCH — muscular thigh bulge (girth back UP)
    [ 1.10, 0.270, 0.258, 0.270, -0.13], // haunch back
    // TAIL — necks off the haunch into a long thin whip, sweeping DOWN then the tip KICKS UP
    [ 1.45, 0.180, 0.190, 0.180, -0.18],
    [ 1.55, 0.156, 0.168, 0.158, -0.21],
    [ 1.95, 0.124, 0.134, 0.124, -0.27],
    [ 2.35, 0.097, 0.105, 0.096, -0.32], // sweeping down
    [ 2.78, 0.071, 0.077, 0.069, -0.34], // lowest
    [ 3.20, 0.049, 0.053, 0.047, -0.30], // curling up
    [ 3.62, 0.031, 0.033, 0.029, -0.20],
    [ 4.00, 0.018, 0.019, 0.017, -0.08], // tip kicks up
    [ 4.35, 0.010, 0.010, 0.010,  0.02], // tail tip — flame sits here
  ],
  keel: [[-2.95, 0.04], [-2.38, 0.20], [-1.12, 0.46], [-0.30, 0.46], [0.48, 0.30], [1.20, 0.14], [2.78, 0.06], [4.35, 0.03]],
  wingRoot: { x: 0.42, y: 0.50, z: -0.42 },
  headBase: headBase(-2.4),
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
