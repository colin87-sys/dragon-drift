// Body-plan library — the HERO axis of variation (see CREATURE-CHASSIS-REDESIGN.md).
//
// A "body plan" is a SILHOUETTE SKELETON: a sagittal spine (a list of stations
// running head → tail in the y-z plane, each with an elliptical cross-section)
// plus a TOPOLOGY (how many wings/legs, what kind, where the head sits). Two
// plans differ in *shape and topology*, not in trim — that's what kills reskins.
//
// Each plan is a pure function of the GENES (proportion knobs). Wide gene ranges
// + genuinely different skeletons = genuinely different chase-cam silhouettes,
// while a small shared "dragon-cue" set (applied by buildFromBodyPlan, not here)
// keeps every plan reading as a dragon.
//
// Convention (matches the renderer + the game's chase cam): head faces -z, tail
// trails toward +z (nearest the lens), the spine lives in the x=0 plane.

// Smoothly blend control values; arr is head→tail, u in [0,1] along the spine.
function lerpArr(arr, u) {
  const f = u * (arr.length - 1), i = Math.floor(f), t = f - i;
  return arr[i] + (arr[Math.min(i + 1, arr.length - 1)] - arr[i]) * t;
}

// ── WESTERN DRAKE ─ bulky 4-leg body, big bat wings high on the shoulder,
//    a heavy tapering tail. The "classic dragon" read.
function western(g) {
  const { mass: m, neckLen: nl, neckArch: na, tailLen: tl, tailTaper: tt,
          bellyDepth: bd, posturePitch: pp } = g;
  // stations: [z, y, rx, ry]  (head→tail)
  const S = [
    [-1.5 - 1.7 * nl, 1.15 + 1.05 * na + pp, 0.15, 0.17],   // head base (front, high)
    [-1.5 - 0.9 * nl, 1.05 + 0.62 * na + pp, 0.26, 0.30],   // upper neck
    [-1.5 - 0.25 * nl, 0.98 + 0.20 * na + pp * 0.6, 0.42, 0.48], // neck → shoulder
    [-0.7, 0.94 + pp * 0.3, 0.64 * m, 0.60 * m],            // chest / shoulders (wing root)
    [0.12, 0.82, 0.72 * m, (0.54 + 0.55 * bd) * m],         // belly (deepest)
    [0.9, 0.92, 0.54 * m, 0.50 * m],                        // hips (hind-leg root)
    [0.9 + 0.8 * tl, 0.96, 0.34, 0.32],
    [0.9 + 1.7 * tl, 0.98, 0.14 + 0.34 * tt, 0.13 + 0.32 * tt],
    [0.9 + 2.6 * tl, 1.0, 0.04, 0.04],                      // tail tip
  ];
  return {
    id: 'western',
    spine: spineFrom(S),
    shoulderU: 3 / (S.length - 1), hipU: 5 / (S.length - 1),
    wings: { type: 'membrane', span: 3.0, aspect: g.wingAspect, dihedral: 0.5, sweep: 0.5, rootLift: 0.5 },
    legs: { fore: true, hind: true, bulk: g.limbBulk },
    head: { len: 1.0, width: 0.62, jaw: 1.0, brow: 1.0 },
    mane: false, whiskers: false, tailTip: g.tailTip,
  };
}

// ── WYVERN ─ 2 legs, the WINGS ARE THE ARMS. Tall, narrow body, long neck,
//    kite-like upright silhouette. Topologically distinct from the western.
function wyvern(g) {
  const { mass: m, neckLen: nl, neckArch: na, tailLen: tl, tailTaper: tt,
          bellyDepth: bd, posturePitch: pp } = g;
  const rise = pp + 0.25;                                   // wyverns sit nose-up
  const S = [
    [-1.4 - 1.9 * nl, 1.35 + 1.25 * na + rise, 0.13, 0.16], // head base (high, forward)
    [-1.4 - 1.0 * nl, 1.15 + 0.8 * na + rise, 0.22, 0.27],
    [-1.4 - 0.3 * nl, 1.0 + 0.3 * na + rise * 0.7, 0.33, 0.42], // neck → shoulder
    [-0.6, 0.95 + rise * 0.4, 0.50 * m, 0.58 * m],          // narrow deep chest (arm-wing root)
    [0.15, 0.82, 0.52 * m, (0.5 + 0.5 * bd) * m],           // belly
    [0.85, 0.9, 0.42 * m, 0.46 * m],                        // hips (only legs)
    [0.85 + 0.9 * tl, 0.95, 0.26, 0.26],
    [0.85 + 1.9 * tl, 0.98, 0.10 + 0.3 * tt, 0.10 + 0.28 * tt],
    [0.85 + 2.9 * tl, 1.0, 0.04, 0.05],                     // long whip tail tip
  ];
  return {
    id: 'wyvern',
    spine: spineFrom(S),
    shoulderU: 3 / (S.length - 1), hipU: 5 / (S.length - 1),
    wings: { type: 'arm', span: 3.4, aspect: g.wingAspect, dihedral: 0.32, sweep: 0.7, rootLift: 0.7 },
    legs: { fore: false, hind: true, bulk: g.limbBulk * 1.15 },
    head: { len: 1.05, width: 0.5, jaw: 0.9, brow: 1.1 },
    mane: false, whiskers: false, tailTip: g.tailTip,
  };
}

// ── EASTERN / LUNG ─ long serpentine tube, tiny limbs, no big wings, a flowing
//    mane + whiskers. Near-constant girth with a gentle sinuous spine.
function eastern(g) {
  const { mass: m, neckLen: nl, tailLen: tl, bellyDepth: bd } = g;
  const N = 13, S = [];
  const headZ = -3.0 - 1.6 * nl, tailZ = 3.4 + 2.6 * tl, span = tailZ - headZ;
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1), z = headZ + span * u;
    // girth: thin at the head, full through the middle, tapering to a fine tail.
    const taper = Math.sin(Math.min(1, u * 1.15) * Math.PI);     // 0→1→0 bell
    const r = (0.10 + 0.42 * m * Math.pow(taper, 0.55)) * (u > 0.82 ? (1 - u) / 0.18 : 1);
    // gentle vertical S-curve (the serpentine read) + a slight head lift.
    const y = 1.0 + Math.sin(u * Math.PI * 2.1) * 0.22 + (1 - u) * 0.5 * g.neckArch;
    S.push([z, y, r * (1 + 0.15 * bd), r]);
  }
  return {
    id: 'eastern',
    spine: spineFrom(S),
    shoulderU: 0.26, hipU: 0.66,
    wings: { type: 'none' },
    legs: { fore: true, hind: true, bulk: g.limbBulk * 0.5 },   // tiny limbs
    head: { len: 1.0, width: 0.55, jaw: 0.85, brow: 0.9 },
    mane: true, whiskers: true, tailTip: 'frond',
  };
}

// Pack a station table into the spine shape buildFromBodyPlan consumes.
function spineFrom(S) {
  return {
    points: S.map(([z, y]) => [0, y, z]),
    rx: S.map((s) => s[2]),
    ry: S.map((s) => s[3]),
  };
}

export const BODY_PLANS = { western, wyvern, eastern };
export { lerpArr };
