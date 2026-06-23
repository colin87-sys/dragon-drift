// CELESTIAL STORM / PRISM WYVERN — the rear-chase-cam ANCHOR SPEC.
//
// A clean-sheet creature approach: instead of bolting parts from other dragons
// (the limitation that caged every wing in an archetype), this creature is
// DEFINED by named anchor points in a normalized rear-camera coordinate system,
// and every piece of geometry (body hull, wing bones, membrane panels, scallop
// trailing edge, dorsal spine, tail spear, horns, lightning veins) is GENERATED
// from those points. The rear chase-cam silhouette is the single source of truth:
// solve the 2D "logo" first (celestialStormSilhouette.js + tools/celestialSilhouette.mjs),
// THEN extrude to 3D — never the other way around.
//
//   Coordinate system (normalized, rear view):
//     X = horizontal screen direction (left = -, right = +)
//     Y = vertical screen direction   (up = +, down = -)
//     Z = depth, kept SUBTLE for rear readability (mostly 0 in the silhouette)
//     Origin ~ upper torso / wing root. The creature is symmetric across X = 0:
//     the right wing is the left wing MIRRORED, never authored twice.
//
// This module is pure data + tiny pure helpers — no DOM, no Three.js — so it is
// usable headlessly (renderer + tests) and, later, as the rig source for the 3D
// build. Tune the NUMBERS here; never special-case the builders.

// --- the spec ---------------------------------------------------------------
// Starting values from the art-direction brief. They are meant to be tuned
// VISUALLY on the rear-cam overlay (tools/celestialTracer.html) — adjust the
// coordinates, never redesign the creature mid-tune.
export const CELESTIAL_STORM_DRAGON_REAR_SPEC = {
  meta: {
    key: 'celestialStorm',
    name: 'Celestial Storm',
    title: 'Prism Wyvern',
    // visual hierarchy — preserve this order at all times (read it back in QA)
    hierarchy: ['wingspan', 'centralSpine', 'tailSpear', 'headHorns', 'wingVeins'],
  },

  // CENTRAL BODY — a thin armored "jet fuselage", not a fat lizard. Lofted along
  // a centerline through these stations (top → bottom), each with a rear-view
  // half-extent. Widths are FULL widths (the loft is symmetric across X = 0).
  body: {
    head:    [0.00,  0.42, 0.00],
    neck:    [0.00,  0.30, 0.00],
    chest:   [0.00,  0.14, 0.00],
    hips:    [0.00, -0.12, 0.00],
    tailMid: [0.00, -0.36, 0.00],
    tailTip: [0.00, -0.62, 0.00],

    headWidth:     0.10,
    shoulderWidth: 0.22,   // widest point, ~ the wing-root station
    torsoWidth:    0.15,
    hipWidth:      0.18,
    tailBaseWidth: 0.08,
    tailTipWidth:  0.025,
  },

  // LEFT WING — authored once; the right wing is `mirrorWing(wingLeft)`.
  //   leadingEdge bones: root → elbow → wrist → tip   (the strong swept arm)
  //   trailing edge:     tip → outerScallop → midScallop → innerScallop → rootScallop → root
  // The four leading points are HIGH and SHARP at the tip; the scallops dip LOW
  // and angular to make the bat-wing trailing edge.
  wingLeft: {
    root:  [-0.12,  0.14, 0.00],
    elbow: [-0.38,  0.23, 0.02],
    wrist: [-0.70,  0.36, 0.03],
    tip:   [-1.22,  0.47, 0.00],

    outerScallop: [-1.08,  0.18, 0.00],
    midScallop:   [-0.82,  0.06, 0.01],
    innerScallop: [-0.52, -0.04, 0.01],
    rootScallop:  [-0.24, -0.08, 0.00],
  },

  // DORSAL SPINE — glowing diamond/rhombus plates down the centerline. Largest on
  // the upper back, tapering down the tail → the rear-cam "follow line". Generated
  // between yTop and yBottom; the renderer interpolates count + size ramp.
  spine: {
    yTop: 0.32, yBottom: -0.40,
    count: 9,
    sizeTop: 0.060, sizeBottom: 0.022,   // half-height of the diamond at each end
    widthRatio: 0.62,                     // diamond half-width / half-height
  },

  // TAIL SPEAR — the iconic finish. A long taper that ends in a crystal blade,
  // with a glowing center strip and two small side fins near the end.
  tail: {
    bladeTop: -0.50,        // where the spear blade starts (along the centerline)
    bladeTip: [0.00, -0.72, 0.00],
    bladeHalfWidth: 0.045,
    finY: -0.52,            // side fins station
    finSpan: 0.11,          // how far the fins reach out from the centerline
    finDrop: 0.06,          // how far the fin trails downward
  },

  // HEAD — small, rear-visible, two horns forming a subtle V. Do not make it big.
  head: {
    crown: [0.00, 0.46, 0.00],
    hornSpan: 0.07,         // horn tip horizontal offset from center
    hornRise: 0.10,         // horn tip height above the crown
  },

  // LIGHTNING VEINS — procedural cyan/magenta curves following the wing bones
  // (NOT traced from the concept). Each entry names two anchors on the wing and a
  // jaggedness; the builder walks the segment with seeded perpendicular jitter.
  veins: {
    jitter: 0.018, segments: 7,
    runs: [
      { from: 'root',  to: 'wrist', color: 'primary',  amp: 1.0 },   // main vein
      { from: 'wrist', to: 'tip',   color: 'primary',  amp: 1.0 },   // outer vein
      { from: 'elbow', to: 'innerScallop', color: 'secondary', amp: 0.7 },
      { from: 'wrist', to: 'midScallop',   color: 'secondary', amp: 0.7 },
    ],
  },

  // STYLE — cel-shaded arcade finish (used by the renderer + later the materials).
  style: {
    bodyColor:      [0x2a, 0x28, 0x52],   // semi-gloss midnight blue-violet
    membraneColor:  [0x3a, 0x1e, 0x5e],   // transparent dark violet
    membraneAlpha:  0.82,
    glowPrimary:    [0x6a, 0xe6, 0xff],   // cyan
    glowSecondary:  [0xff, 0x7a, 0xe6],   // soft magenta
    spineColor:     [0x8a, 0xf2, 0xff],   // bright cyan emissive
    outlineColor:   [0x0a, 0x0c, 0x10],   // dark toon outline
    outlineThickness: 0.012,
    toonBands: 3,
  },

  // SILHOUETTE RULES — invariants the rear-cam read MUST keep. Enforced by
  // tests/celestial.mjs so a future tune can't silently break the read.
  silhouetteRules: {
    bodyMustStayNarrow: true,        // max body half-width < wing reach by a wide margin
    wingsMustDominate: true,         // wingspan is the largest dimension
    outerWingTipsMustBeSharp: true,  // tip is the highest, outermost point
    trailingEdgeMustBeScalloped: true,
    centralSpineMustGlow: true,
    tailMustEndInSpear: true,        // tail tip is the lowest point, on the centerline
    mustBeSymmetric: true,
  },
};

// --- helpers ----------------------------------------------------------------

// Mirror a left-wing anchor set across X = 0 → the right wing. Authoring the wing
// once and mirroring guarantees the rear silhouette is symmetric by construction.
export function mirrorWing(wing) {
  const out = {};
  for (const k in wing) {
    const [x, y, z] = wing[k];
    out[k] = [-x, y, z];
  }
  return out;
}

// Resolve the spec into the full bilateral anchor set the builders consume.
// Adds wingRight (mirrored) and a flat, labeled `anchors` list for QA markers.
export function resolveSpec(spec = CELESTIAL_STORM_DRAGON_REAR_SPEC) {
  const wingRight = mirrorWing(spec.wingLeft);
  const anchors = [];
  const push = (group, name, p) => anchors.push({ group, name, x: p[0], y: p[1], z: p[2] ?? 0 });

  const leadKeys = ['root', 'elbow', 'wrist', 'tip'];
  const scallopKeys = ['outerScallop', 'midScallop', 'innerScallop', 'rootScallop'];
  for (const k of leadKeys) { push('wingBone', `L.${k}`, spec.wingLeft[k]); push('wingBone', `R.${k}`, wingRight[k]); }
  for (const k of scallopKeys) { push('scallop', `L.${k}`, spec.wingLeft[k]); push('scallop', `R.${k}`, wingRight[k]); }
  for (const k of ['head', 'neck', 'chest', 'hips', 'tailMid', 'tailTip']) push('body', k, spec.body[k]);
  push('tail', 'spearTip', spec.tail.bladeTip);

  return { ...spec, wingRight, anchors };
}

// Linear interpolation + a tiny deterministic PRNG (mulberry32) so vein jitter and
// any sampling are byte-stable across runs (headless renders + tests must match).
export const lerp = (a, b, t) => a + (b - a) * t;
export function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
