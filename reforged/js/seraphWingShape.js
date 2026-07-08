import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';

// buildSeraphWing(opts) — ONE dark low-poly angel wing on a shoulder pivot.
//
// APPROACH (why this differs from the drifting attempts): the silhouette is
// AUTHORED, not emergent. A bent two-segment spine (arm rises STEEP, hand
// sweeps OUT at an obtuse elbow) is fixed as explicit control points, and
// feathers of GRADUATED length are rooted along it — short coverts down the
// arm, then a SPLAYED FAN of long primaries off the wrist. Proportion + bend
// are global and locked here so 10 rounds of feather-tweaking can't lose them.
//
// Mirror for the other side: set pivot.scale.x = -1.
// Returns { pivot, dispose }.
export function buildSeraphWing(opts = {}) {
  // ---- TUNE THESE (this is the whole design surface) --------------------
  const T = Object.assign({
    color:        0x0a0a0f,   // near-black feather (dark body)
    // THE BENT SPINE — the elbow lives here. Keep arm STEEP, hand SHALLOW.
    shoulder:     [0.0, 0.0], // wing root (at the pivot)
    wrist:        [0.45, 2.4], // ~40% up, near-vertical rise  <-- the ELBOW
    tip:          [2.95, 3.35], // hand sweeps OUT but angled up → opens the front elbow to ~125°
    // COMPACTNESS: bigger armSpan/length => longer/thinner wing. Keep it stout.
    armFeathers:  9,          // coverts+secondaries down the arm
    armLenBase:   0.55,       // covert length at the shoulder
    armLenGrow:   0.9,        // extra length by the wrist
    armAngLow:   -0.55,       // feather angle at shoulder (rad; 0=out, +up)
    armAngHigh:   0.15,       // feather angle at the wrist
    // PRIMARY FAN: the hero. Splayed, graduated, rounded, NOT equal teeth.
    primaries:    6,
    fanAngLow:    0.02,       // outermost/lowest primary (sweeps OUT, ~1deg)
    fanAngHigh:   0.88,       // innermost primary (~50deg — below the near-vertical arm; wider top splay)
    primLenMin:   1.45,       // shortest primary
    primLenMax:   3.05,       // longest primary (at the peak) — strong length contrast
    peak:         0.30,       // 0..1 where the longest primary sits (2nd–3rd feather)
    jitter:       0.16,       // per-feather length variation (organic, not comb)
  }, opts);
  // ----------------------------------------------------------------------

  const mat = opts.material || new THREE.MeshStandardMaterial({
    color: T.color, roughness: 0.85, metalness: 0.05,
    flatShading: true, side: THREE.DoubleSide,
  });
  const pivot = new THREE.Group();
  const wing = new THREE.Group();
  pivot.add(wing);

  const V = (a) => new THREE.Vector3(a[0], a[1], 0);
  const spine = new THREE.CatmullRomCurve3(
    [V(T.shoulder), V(T.wrist), V(T.tip)], false, 'catmullrom', 0.0);

  // ONE feather shape: tapered blade with a ROUNDED tip + rounded base.
  function featherGeo(len, w) {
    const s = new THREE.Shape();
    s.moveTo(-w, 0);
    s.quadraticCurveTo(-w * 0.9, len * 0.45, -w * 0.45, len * 0.8);
    s.quadraticCurveTo(0, len * 1.06, w * 0.45, len * 0.8);   // rounded TIP
    s.quadraticCurveTo(w * 0.9, len * 0.45, w, 0);
    s.quadraticCurveTo(0, -w * 0.5, -w, 0);                    // rounded base
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.06, bevelEnabled: true, bevelThickness: 0.03,
      bevelSize: 0.03, bevelSegments: 1, steps: 1, curveSegments: 4,
    });
    g.translate(0, 0, -0.03);
    if (g.getAttribute('uv')) g.deleteAttribute('uv');        // merge-safe
    return g;
  }

  const parts = [];
  // place a feather: local +Y is length; rotate so +Y points along `ang`
  // (0 = +x/out, PI/2 = up), root at p, small z for layered depth.
  function place(len, w, p, ang, z) {
    const g = featherGeo(len, w);
    g.rotateZ(ang - Math.PI / 2);
    g.translate(p.x, p.y, z || 0);
    parts.push(g);
  }

  // ARM: coverts+secondaries down the first half of the spine, short->medium,
  // hanging down-out then rotating toward out; z-stagger => cupped profile.
  for (let i = 0; i < T.armFeathers; i++) {
    const t = i / (T.armFeathers - 1);
    const p = spine.getPoint(t * 0.5);
    const len = T.armLenBase + t * T.armLenGrow;
    const w = 0.22 - t * 0.05;
    const ang = T.armAngLow + (T.armAngHigh - T.armAngLow) * t;
    place(len, w, p, ang, -0.02 * i);
  }

  // PRIMARY FAN off the wrist: graduated lengths with a PEAK (not a comb),
  // splayed across the fan, rounded tips, deterministic jitter for life.
  for (let i = 0; i < T.primaries; i++) {
    const t = i / (T.primaries - 1);
    const ang = T.fanAngLow + (T.fanAngHigh - T.fanAngLow) * t;
    const d = 1 - Math.abs(t - T.peak) / Math.max(T.peak, 1 - T.peak); // 0..1
    const jig = 1 + T.jitter * Math.sin(i * 2.399);                    // no RNG
    const len = (T.primLenMin + d * (T.primLenMax - T.primLenMin)) * jig;
    const root = spine.getPoint(0.5 + 0.12 * t);   // march slightly toward tip
    place(len, 0.20, root, ang, 0.02 + 0.02 * i);
  }

  const geo = mergeGeometries(parts, false);
  const mesh = new THREE.Mesh(geo, mat);
  wing.add(mesh);

  return {
    pivot,
    dispose() { geo.dispose(); if (!opts.material) mat.dispose(); },
  };
}
