// ── HERO BODY PROFILES (design-system dragons, docs/DRAGON-DESIGN-SYSTEM.md) ──
// Station = [z, halfWidth, keelTop, belly, cy] (see dragonHullProfiles.js). These
// profiles are where the design laws are MADE true — designcheckCore reads the
// same stations to PROVE them (A1 taper, A2 head mode, S3/D1 mass bins, D3 spine
// law). Each hero's def.design.anchors must match the z-landmarks used here.
//
//   NIMBUS — the cute free starter (Gate-2-approved concept, rounded-apex Gate-1
//   language): BIG round head dome (head:body ≥ 0.28, A2 big-head mode), compact
//   teardrop body, deep little chest, modest hips, SHORT tail tapering ≥4:1 into
//   the cloud-puff tip. Soft 30–40° S through cy: head held up, chest settles,
//   tail sweeps down, puff-tip floats back up.

const headBase = (frontZ) => (neckSegs) => ({ x: 0, y: 0.5 + (neckSegs - 4) * 0.09, z: frontZ - (neckSegs - 4) * 0.34 });

export const NIMBUS_PROFILE = {
  zHold: 0, longSamples: 54,
  tailShiftRefZ: 1.30, tailAnchorY: 0.16, tailAnchorZ: 0.95,
  stations: [
    // HEAD — a big round dome, nearly a sphere (the circle motif at its largest
    // scale). The side-view read is HEIGHT (keelTop+belly), the top-view read is
    // halfWidth — the dome must be big in BOTH (tall + round, not just wide).
    [-2.60, 0.055, 0.070, 0.075, 0.10],  // button nose
    [-2.45, 0.190, 0.260, 0.270, 0.13],  // muzzle
    [-2.25, 0.300, 0.430, 0.440, 0.16],  // cheeks — dome swells tall
    [-2.00, 0.335, 0.520, 0.500, 0.18],  // DOME PEAK — tall round ball
    [-1.70, 0.325, 0.500, 0.470, 0.17],  // dome back
    [-1.25, 0.290, 0.380, 0.360, 0.12],  // skull base (headBackZ) — dome runs long (chibi)
    // NECK — barely there (the head sits ON the body, chibi)
    [-1.10, 0.320, 0.380, 0.400, 0.09],
    // BODY — compact teardrop: deep little chest, soft round belly, gentle hip
    [-0.95, 0.420, 0.440, 0.540, 0.06],  // chest begins — belly drops (deep)
    [-0.60, 0.480, 0.500, 0.640, 0.02],  // CHEST PEAK — the tallest, deepest mass
    [-0.20, 0.460, 0.470, 0.600, -0.02], // chest back (wing-root centre)
    [0.25, 0.380, 0.390, 0.470, -0.06],  // thorax
    [0.60, 0.300, 0.310, 0.350, -0.09],  // waist tuck
    [0.95, 0.280, 0.275, 0.295, -0.12],  // little haunch
    [1.30, 0.220, 0.220, 0.230, -0.15],  // hip back
    // TAIL — short, tapering fast into the puff-tip
    [1.50, 0.165, 0.170, 0.170, -0.17],  // tail base
    [1.85, 0.110, 0.115, 0.112, -0.19],
    [2.15, 0.068, 0.070, 0.068, -0.19],
    [2.40, 0.038, 0.039, 0.038, -0.15],  // sweeping back up
    [2.60, 0.018, 0.018, 0.018, -0.10],  // tip — the cloud puff rides here
  ],
  keel: [[-2.60, 0.06], [-2.00, 0.44], [-0.95, 0.44], [-0.60, 0.50], [-0.20, 0.47], [0.60, 0.30], [1.50, 0.16], [2.60, 0.02]],
  wingRoot: { x: 0.38, y: 0.44, z: -0.28 },
  headBase: headBase(-1.70),
};

// The §4-law z-anchors for NIMBUS_PROFILE (referenced by the def's design.anchors —
// keep in sync with the station landmarks above).
export const NIMBUS_ANCHORS = { headBackZ: -1.25, chestZ: [-0.95, 0.25], hipZ: [0.60, 1.30], tailBaseZ: 1.50 };
