// Parametric body-profile generator — "shape from DATA, not bespoke code".
//
// The shipped arrowhead drake body lives in dragonTorso.js as the hand-typed
// `ARROW_PROFILE` (an 8-row [z, halfWidth, keelTop, belly] station table + a
// hand-copied keel line + frozen mount-point constants). Every membrane dragon
// reuses it, so they all read as the SAME body from the chase cam — the one part
// that is bespoke CODE, not dial-able. The lessons ledger proved the body was
// always sculptable (it's a loft through cross-section stations) and banked the
// unlock: "promote chest/waist/hip etc. to reusable knobs so every dragon dials
// its silhouette from dragons.js without editing a builder." This module IS that.
//
// It is pure DATA (no THREE import): it emits the same plain `profile` object
// `buildTorso` already consumes (stations / keel / zHold / mount points / neck /
// fairing / headBase), so it is a drop-in for the literal ARROW_PROFILE — nothing
// in the loft/attach code changes.
//
// TWO authoring modes (both default to byte-identical ARROW_PROFILE):
//   A. DELTA KNOBS   — nudge the shipped table (shoulderWidth, waistPinch, …).
//   B. OWN STATIONS  — supply your own `stations` ring list (the "Phoenix move" as
//                      data: own geometry, shared rig — no new builder file).
// Plus per-dragon section roundness (sectionPoints / sectionExponent) and DERIVED,
// nudge-able mount points so connection points track the shape instead of being
// frozen constants.

// The shipped arrowhead drake stations — IDENTICAL to ARROW_PROFILE.stations in
// dragonTorso.js. This module is the parametric SOURCE; the literal there stays as
// the canonical fixture the byte-parity test asserts against.
const DEFAULT_STATIONS = [
  [-3.05, 0.15, 0.10, 0.13], // neck cap (meets the neck chain)
  [-2.45, 0.30, 0.22, 0.24], // neck base
  [-1.65, 0.52, 0.42, 0.38], // fore-shoulder
  [-0.85, 0.66, 0.54, 0.46], // shoulder peak — broadest, tallest keel
  [-0.10, 0.55, 0.45, 0.40], // thorax
  [ 0.60, 0.39, 0.33, 0.29], // waist (clear pinch)
  [ 1.15, 0.29, 0.25, 0.20], // narrow hips
  [ 1.70, 0.17, 0.17, 0.11], // slim tail root
];
// Which station rows seed the keel line (the legacy keel skips the neck-cap [0] and
// fore-shoulder [2] rows). Deriving keel from the station keelTop column removes the
// hand-copied dual-source-of-truth; this row set reproduces the legacy keel exactly.
const KEEL_ROWS = [1, 3, 4, 5, 6, 7];

const DEFAULT_NECK = {
  rBase: 0.46, rStep: 0.045, rMin: 0.2, scale: [0.8, 0.66, 1.3],
  y0: 0.3, yStep: 0.085, z0: -2.0, zStep: -0.36, wobbleAmp: 0.1, wobbleFreq: 0.8,
};
const DEFAULT_FAIRING_R = 0.3;
const DEFAULT_FAIRING_SCALE = [0.86, 0.78, 1.2];

// The legacy mount-point constants we must reproduce at default knobs.
const LEGACY_WING_ROOT = { x: 0.5, y: 0.55, z: -0.25 };
const LEGACY_FAIRING_POS = [0.46, 0.54, -0.4];
const LEGACY_HEAD_Y0 = 0.5;   // headBase y at neckSegments==4
const LEGACY_HEAD_Z0 = -3.08; // headBase z at neckSegments==4
const LEGACY_TAIL_ANCHOR_Y = 0.28;
const LEGACY_TAIL_ANCHOR_Z = 1.15;

// All knobs default to identity (1, or 0 for offsets) so an empty knob set emits
// the literal ARROW_PROFILE. Frozen so callers can read the defaults.
export const ARROW_KNOBS = Object.freeze({
  bodyLength: 1,      // scale the after-body z-spacing (stations behind zHold)
  shoulderZ: 0,       // slide the shoulder rows fore/aft
  shoulderWidth: 1,   // breadth of the fore-shoulder + shoulder-peak rows
  chestScale: 1,      // breadth of the shoulder-peak + thorax rows
  waistPinch: 1,      // breadth+belly of the waist + hip rows (<1 deepens the pinch)
  hipFlare: 1,        // breadth of the hip row
  bellyFullness: 1,   // belly depth of the mid rows
  neckTaper: 1,       // breadth of the neck rows
  tailTaper: 1,       // breadth+belly of the slim tail row
  keelHeightCurve: 1, // keel-top height of the shoulder/thorax/waist rows
  sectionPoints: 8,   // section control-point count (per-dragon roundness)
  sectionExponent: 2.5, // super-ellipse fullness (only used when a custom ring is emitted)
});

// Linear-interp a column over a station table at a body z (THREE-free twins of
// dragonTorso's keelTopFor/halfWidthFor — used here to DERIVE mount points).
function colAt(stations, z, col) {
  const s = stations;
  if (z <= s[0][0]) return s[0][col];
  if (z >= s[s.length - 1][0]) return s[s.length - 1][col];
  for (let i = 0; i < s.length - 1; i++) {
    if (z <= s[i + 1][0]) {
      const t = (z - s[i][0]) / (s[i + 1][0] - s[i][0]);
      return s[i][col] + (s[i + 1][col] - s[i][col]) * t;
    }
  }
  return s[s.length - 1][col];
}
const halfWidthAt = (stations, z) => colAt(stations, z, 1);
const keelTopAt = (stations, z) => colAt(stations, z, 2);

// Calibrate the derived-mount formulas against the DEFAULT table so default knobs
// reproduce the legacy constants EXACTLY (byte-identical), while a reshaped body
// re-derives mounts that track it. Computed once at module load.
const WR_Z_OFF = LEGACY_WING_ROOT.z - DEFAULT_STATIONS[3][0];                 // peak.z → wingRoot.z
const WR_X_RATIO = LEGACY_WING_ROOT.x / halfWidthAt(DEFAULT_STATIONS, LEGACY_WING_ROOT.z);
const WR_Y_OFF = LEGACY_WING_ROOT.y - keelTopAt(DEFAULT_STATIONS, LEGACY_WING_ROOT.z);
const FAIR_OFF = [
  LEGACY_FAIRING_POS[0] - LEGACY_WING_ROOT.x,
  LEGACY_FAIRING_POS[1] - LEGACY_WING_ROOT.y,
  LEGACY_FAIRING_POS[2] - LEGACY_WING_ROOT.z,
];

// A smooth super-ellipse cross-section, emitted ONLY when sectionPoints/exponent are
// non-default (so the default path falls back to dragonTorso's shared 8-pt bladeRing
// → byte-identical). Ordered CCW from the keel apex toward -x. The torso clones the
// body material DoubleSide, so winding is robust either way.
export function makeBladeRing(knobs = {}) {
  const n = Math.max(6, Math.round(knobs.sectionPoints ?? ARROW_KNOBS.sectionPoints));
  const e = knobs.sectionExponent ?? ARROW_KNOBS.sectionExponent;
  const p = 2 / e;
  return (w, top, bot) => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const th = Math.PI / 2 + (i / n) * Math.PI * 2; // start at +y (keel apex), go CCW
      const c = Math.cos(th), s = Math.sin(th);
      const x = -Math.sign(c) * Math.pow(Math.abs(c), p) * w; // -x first (CCW toward -z view)
      const y = Math.sign(s) * Math.pow(Math.abs(s), p) * (s >= 0 ? top : bot);
      pts.push([x, y]);
    }
    return pts;
  };
}

// Normalise a user station (object or array) to the native [z, halfWidth, keelTop,
// belly] tuple, so AI/hand authors can write readable objects.
function normStation(st) {
  if (Array.isArray(st)) return st.slice(0, 4);
  const z = st.z;
  const w = st.halfWidth ?? st.rx ?? st.w ?? 0;
  const top = st.keelTop ?? st.top ?? st.ry ?? 0;
  const bot = st.belly ?? st.bot ?? st.ry ?? 0;
  return [z, w, top, bot];
}

// Apply the DELTA knobs to a base station table (default = identity → unchanged).
function applyKnobs(base, k, zHold) {
  const m = (v) => (v == null ? 1 : v);
  const bodyLength = m(k.bodyLength), shoulderWidth = m(k.shoulderWidth),
    chestScale = m(k.chestScale), waistPinch = m(k.waistPinch), hipFlare = m(k.hipFlare),
    bellyFullness = m(k.bellyFullness), neckTaper = m(k.neckTaper), tailTaper = m(k.tailTaper),
    keelHeightCurve = m(k.keelHeightCurve), shoulderZ = k.shoulderZ ?? 0;
  return base.map((row, i) => {
    let [z, w, top, bot] = row;
    // longitudinal: stretch the after-body (behind zHold), slide the shoulder rows
    if (z > zHold) z = zHold + (z - zHold) * bodyLength;
    if (i === 2 || i === 3 || i === 4) z += shoulderZ;
    // widths
    if (i === 0 || i === 1) w *= neckTaper;            // neck rows
    if (i === 2 || i === 3) w *= shoulderWidth;        // shoulder rows
    if (i === 3 || i === 4) w *= chestScale;           // chest rows
    if (i === 5 || i === 6) w *= waistPinch;           // waist + hips
    if (i === 6) w *= hipFlare;                        // hips
    if (i === 7) w *= tailTaper;                       // tail root
    // keel (top) + belly (bot)
    if (i === 3 || i === 4 || i === 5) top *= keelHeightCurve;
    if (i === 3 || i === 4 || i === 5) bot *= bellyFullness;
    if (i === 5 || i === 6) bot *= waistPinch;
    if (i === 7) bot *= tailTaper;
    return [z, w, top, bot];
  });
}

// Build a full profile object (drop-in for ARROW_PROFILE) from knobs.
//   opts: { ...ARROW_KNOBS, stations?, keel?, attach? }
// `stations` (Mode B) replaces the default base table verbatim (then delta knobs, if
// any, still apply); `attach` is additive mount nudges. With NO opts, the output is
// deep-equal to ARROW_PROFILE (numerics) and produces byte-identical geometry.
export function makeArrowProfile(opts = {}) {
  const k = opts || {};
  const zHold = k.zHold ?? 0;
  const base = (k.stations && k.stations.length) ? k.stations.map(normStation) : DEFAULT_STATIONS;
  const hasDeltas = k.bodyLength != null || k.shoulderWidth != null || k.chestScale != null ||
    k.waistPinch != null || k.hipFlare != null || k.bellyFullness != null || k.neckTaper != null ||
    k.tailTaper != null || k.keelHeightCurve != null || k.shoulderZ != null;
  const stations = hasDeltas ? applyKnobs(base, k, zHold) : base.map((r) => r.slice());

  // keel — DERIVED from the station keelTop column (custom tables may set their own).
  const keel = k.keel ? k.keel.map((p) => p.slice()) : KEEL_ROWS
    .filter((i) => i < stations.length)
    .map((i) => [stations[i][0], stations[i][2]]);

  // DERIVED mount points (track the shape; default → legacy constants by calibration).
  // The wing root sits off the SHOULDER PEAK — the broadest station (row 3 in the
  // default table); argmax(halfWidth) keeps that robust for custom station lists.
  let peakI = 0;
  for (let i = 1; i < stations.length; i++) if (stations[i][1] > stations[peakI][1]) peakI = i;
  const a = k.attach || {};
  const aw = a.wingRoot || {}, ah = a.headBase || {}, at = a.tailAnchor || {};
  const wrZ = stations[peakI][0] + WR_Z_OFF + (aw.z ?? 0);
  const wingRoot = {
    x: halfWidthAt(stations, wrZ) * WR_X_RATIO + (aw.x ?? 0),
    y: keelTopAt(stations, wrZ) + WR_Y_OFF + (aw.y ?? 0),
    z: wrZ,
  };
  const fairing = {
    r: k.fairingR ?? DEFAULT_FAIRING_R,
    scale: (k.fairingScale || DEFAULT_FAIRING_SCALE).slice(),
    pos: [wingRoot.x + FAIR_OFF[0], wingRoot.y + FAIR_OFF[1], wingRoot.z + FAIR_OFF[2]],
  };
  const headY0 = LEGACY_HEAD_Y0 + (ah.y ?? 0);
  // Track the front (neck-cap) station so the head re-places when the fore-body moves;
  // calibrated against the default station → exactly the legacy -3.08 at default knobs.
  const headZ0 = LEGACY_HEAD_Z0 + (stations[0][0] - DEFAULT_STATIONS[0][0]) + (ah.z ?? 0);
  const headBase = (neckSegs) => ({
    x: 0,
    y: headY0 + (neckSegs - 4) * 0.09,
    z: headZ0 - (neckSegs - 4) * 0.34,
  });

  const profile = {
    zHold,
    tailShiftRefZ: k.tailShiftRefZ ?? stations[stations.length - 1][0], // last station z (=1.70)
    tailAnchorY: (k.tailAnchorY ?? LEGACY_TAIL_ANCHOR_Y) + (at.y ?? 0),
    tailAnchorZ: (k.tailAnchorZ ?? LEGACY_TAIL_ANCHOR_Z) + (at.z ?? 0),
    stations,
    keel,
    wingRoot,
    fairing,
    neck: k.neck ? { ...DEFAULT_NECK, ...k.neck } : { ...DEFAULT_NECK },
    headBase,
  };

  // Per-dragon roundness: only attach a custom `ring` when the section knobs differ
  // from the shipped 8-pt airfoil, so the default path stays byte-identical (buildTorso
  // falls back to the shared bladeRing import).
  const sp = k.sectionPoints, se = k.sectionExponent;
  if ((sp != null && sp !== ARROW_KNOBS.sectionPoints) ||
      (se != null && se !== ARROW_KNOBS.sectionExponent)) {
    profile.ring = makeBladeRing({ sectionPoints: sp, sectionExponent: se });
  }
  return profile;
}

export { DEFAULT_STATIONS, KEEL_ROWS };
