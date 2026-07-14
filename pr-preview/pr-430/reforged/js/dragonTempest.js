import * as THREE from 'three';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// THUNDERHEAD TEMPEST — "The gathering storm" (TEMPEST-THUNDERHEAD-BUILDSHEET.md).
// A living-thundercloud storm drake: billowed CHARCOAL cloud-mass (L 0.20–0.26,
// never black) with diffuse silver-lining rims, a branching near-white STORM
// CIRCUIT that flickers in short live strikes on the pulseTimer clock ("Vesper
// withholds; Tempest THREATENS"), and — the HERO — THE STORMFORK (§D): a wing whose
// skeleton IS a frozen branching lightning bolt (a gull ARCH with 3 kink-knuckles +
// a Y-fork, the circuit's own f2/f3 branches riding the bolt-ridge crests).
// Growth verb: CHARGING. Motif anchor: the sternum dynamo storm-heart. NOT a Vesper
// (charcoal ≥0.20, not black), NOT a Revenant (no bone / cage / lantern / bat-membrane
// — §C.3 anti-reskin guard). Assembly family: billowed/faceted — the smooth-hull
// organism family is a FORBIDDEN import (asserted in tests/starters.mjs §B.8).
//
// Four self-registering, default-off builders (names per the build task):
//   cumulonimbusTorso · stormforkWings · stormbrowHead · virgaTail
// They reuse the dragonVesper.js / dragonRevenant.js PATTERNS (value-band loft, the
// −anchor tail chain, the outer lmirror wing wrapper, the mats factory) with FRESH
// geometry. Axis: head/forward −Z, tail/rear +Z, right +X, up +Y; torso baseline y≈0.15.
//
// BUILD STATE: I0 = STUB. All four builders are minimal charcoal-cloud PLACEHOLDERS
// that satisfy the flap/attach contract (so tricount / dragonstudio / the roster stay
// green and byte-identical) — NO real weather geometry yet. The real parts land per
// §B.7 / §D:  I1 cumulonimbusTorso + the STORM-HEART · I2 stormforkWings (the HERO,
// §D) · I3 stormbrowHead + virgaTail · I4 the STORM CIRCUIT + strikes + Surge +
// the fever firewall · I5 the CHARGING ladder + tests/starters.mjs.
// Everything here is written so I1+ flesh GEOMETRY without rewiring the contract.
// The shared strike clock (js/pulseTimer.js) and ?strikePin already exist (I0).
// ═══════════════════════════════════════════════════════════════════════════════

const TORSO_Y = 0.15;
// Palette anchors — CHARCOAL cloud-slate, hue ~222° desat, held in [0.20,0.26] (the
// charcoal-not-black law; these are apex (f3) reference values, the per-form ramp lives
// on the def). Silver-lining rims are DIFFUSE ("the sun behind the cloud"), never emissive.
const CHARCOAL = 0x293040, FLANK = 0x2e3543;   // apex body (flank tier) + one step lighter
const STORM_SHADOW = 0x2a2f3c;                  // dorsal storm-shadow (deepest cloud value)
const BELLY = 0x4a5468;                          // rain-slate belly (banks read)
const SILVER_RIM = 0x9fb0c8;                     // diffuse silver lining — glints, never glows

// hex-lerp — blend two colours by t (value banding tracks the CHARGING ramp).
function lerpHex(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

// The CLOUD material factory — mirrors the vesperMats/sovereignMats STRUCTURE (a
// factory returning flat-shaded mats), never its look. Body law (§B.3): metalness 0,
// roughness 0.85, envIntensity 0.18, emissive 0x000000 (the rig ticks
// bodyMat.emissiveIntensity 0.12→0.35 — black emissive keeps the cloud matte through
// it, the Revenant precedent). The near-white STORM CIRCUIT (arcSeam / arcCore) is NOT
// built here — it lands as flareMats + the guarded storm tick from I4; at I1 the caged
// dynamo's core rides `coreGlow` (opacity) + flareMats (a withheld hue lerp), idling
// DARK (the intermittent identity — "Vesper withholds; Tempest threatens", §C.3.3).
// A faint cool self-scatter FLOOR — the gate-authorized within-law lever (I1 r1): flat
// matte charcoal renders coal-black in shadow because Lambert gives away-facets fill only;
// a tiny uniform hue-matched emissive simulates a cloud's ambient self-scatter so crevices
// don't crush to black. Kept ≤~0.02 contribution + hue-matched so it never reads as GLOW
// (the LED-strip failure mode). NOTE: this revises the future §B.8 "body emissive = 0x000000"
// inventory assert to "≤ a tiny hue-matched floor" — the Fable design gate approved the lever.
const CLOUD_FLOOR = 0x070a12;

// OWNER-REFERENCE-DRIVEN (reference/tempest-owner-reference.png; the owner-reference-wins
// law, DRAGON-DESIGN §3): the Tempest is NOT a cloud-mass — it is a sleek dark-scaled storm
// DRAKE with a TWO-VALUE body: a near-black charcoal dorsal shell (camouflaged into the storm
// sky) over a BLAZING white-blue EMISSIVE underbelly, a chevron lightning seam where the two
// meet, dark bolt-glyphs knocked out of the glow, a white crest, four legs, and a glowing tail
// tuft. The billowed cloud clover-loft was WRONG at the primitive level and is deleted.
function tempestMats(def) {
  const base = def.body ?? FLANK;                         // per-form charcoal (darkens up the ladder)
  const std = (color, opts = {}) => { const m = new THREE.MeshStandardMaterial({ color, emissive: opts.emissive ?? CLOUD_FLOOR, emissiveIntensity: opts.ei ?? 1.0, flatShading: true, roughness: opts.rough ?? 0.82, metalness: opts.metal ?? 0.03, side: THREE.DoubleSide, transparent: !!opts.transparent, opacity: opts.opacity ?? 1, depthWrite: opts.depthWrite ?? true }); m.envMapIntensity = 0.2; return m; };
  // The DORSAL SHELL — near-black charcoal scale skin (three facet steps for the flat-shaded
  // scale read; the darkest spine, a mid flank, a lit-facet step). The dorsal is SUPPOSED to
  // read dark (it camouflages into the storm sky) — the LIGHT is the emissive belly, not a
  // lifted charcoal (the I1 value tension dissolves: dark dorsal is correct).
  const spine = std(lerpHex(base, 0x05070c, 0.28));       // darkest dorsal ridge
  const dorsal = std(base);                               // the bodyMat the rig ticks
  const flank = std(lerpHex(base, 0x5a6472, 0.34));       // lit flank facet step (cool grey)
  // THE STORM-LIT UNDERBELLY — the identity, as a blue-lavender GRADIENT (gate r3 fix #2: the flat
  // 0xe4ecff@2.6 clipped to pure white, B−R 4 = house-paint; the reference belly is blue-lavender
  // B−R 35–70 with a bright-core→dim-edge falloff). Three tiers, intensities kept BELOW the ACES
  // channel-clip so the blue survives: core (chest), mid, dim edge. Diffuse a mid blue so unlit
  // parts aren't white. ALWAYS ON in cruise (the reference glows continuously — the owner reference
  // overrides the "withheld/intermittent" sheet prose). In flareMats (Surge-flared, warm-rim-exempt).
  const mkBelly = (col, ei) => { const m = std(0x556aa8, { emissive: col, ei, rough: 0.55, metal: 0 }); m.userData.baseEmissive = col; m.userData.baseIntensity = ei; m.userData.flareIntensityWeight = 0.45; return m; };
  // Intensities kept LOW so ACES doesn't desaturate the emissive to white (the channel-clip law,
  // §C.11): a bright blue emissive tonemaps toward white, so the PANEL stays dim-enough to hold its
  // blue and the small storm-heart core (emissive 3.0) is the only near-white hot-spot. In-game
  // bloom re-brightens the panel without re-whitening the hue.
  const bellyCore = mkBelly(0x9ab0f4, 1.2);   // chest centre (B−R 90)
  const bellyMid = mkBelly(0x6f8cf0, 0.95);   // saturated storm-blue body (B−R 129 — pushed hard so it survives the ACES highlight desaturation)
  const bellyEdge = mkBelly(0x5570cc, 0.78);  // deep blue flank/aft edge (B−R 119) — the falloff
  // THE BOLT GLYPHS — dark facets knocked OUT of the glow (a diagonal lightning slash in the panel).
  const bolt = std(lerpHex(base, 0x3a4250, 0.5), { emissive: 0x05070c });
  // THE NECK CREST — back-swept white-blue emissive blades (one step under the belly core).
  const crest = std(0x9aa6d0, { emissive: 0xc7d3fb, ei: 1.5, rough: 0.5, metal: 0 });
  crest.userData.baseEmissive = 0xc7d3fb; crest.userData.baseIntensity = 1.5; crest.userData.flareIntensityWeight = 0.4;
  // THE STORM-HEART core — the brightest ventral point at the sternum, on the coreGlow hook
  // (transparent → the rig breathes its opacity on boost/Surge). Bright in cruise (the reference
  // chest is the hottest spot), blazes on Surge.
  const heartCore = std(0xd9deff, { emissive: 0xf2f4ff, ei: 3.0, rough: 0.4, metal: 0, transparent: true, opacity: 0.85, depthWrite: false });
  heartCore.userData.baseEmissive = 0xf2f4ff; heartCore.userData.baseIntensity = 3.0;
  return { spine, dorsal, flank, bellyCore, bellyMid, bellyEdge, bolt, crest, heartCore };
}

// Deterministic hash jitter (index-seeded — never Math.random, so builds are reproducible).
function jit(i, amp) { const h = Math.sin((i + 1) * 12.9898 + 4.1) * 43758.5453; return (h - Math.floor(h) - 0.5) * 2 * amp; }

// THE DRAKE TRUNK — a lofted anatomical body (deep keeled chest → hard waist tuck → haunch
// swell), flat-shaded irregular faceted skin, split into the DARK dorsal shell + the EMISSIVE
// ventral panel by a CHEVRON seam, with dark BOLT-GLYPH facets knocked out of the belly.
// Stations: {z, rx, ryU (half-height up), ryD (half-height down), cy, keel}. N=10 ring points,
// a keel vertex at the bottom (the sternum V). Replaces the cloud clover-loft entirely.
const TRUNK_N = 10;
function buildDrakeTrunk(stations, M) {
  const N = TRUNK_N;
  // ring point k of a station, with a deterministic vertex jitter (the irregular skin read)
  const P = (s, i, k) => {
    const th = Math.PI / 2 - (k * 2 * Math.PI / N);        // k0 top, k5 bottom (the keel)
    const c = Math.cos(th), sn = Math.sin(th);
    const rY = sn >= 0 ? s.ryU : s.ryD;
    const jx = jit(i * 97 + k * 7, s.rx * 0.10), jy = jit(i * 131 + k * 13, rY * 0.10);
    let x = c * s.rx + jx, y = s.cy + sn * rY + jy;
    if (k === 5) y -= s.keel || 0;                          // sternum keel tip
    return [x, y, s.z];
  };
  // The dark/glow seam CHEVRONS diagonally (gate r3 fix #1: the ±1-per-station toggle made an
  // axis-aligned "orca" checkerboard). A triangle wave over a 4-station period marches the flank
  // boundary in and out, so the seam runs at a diagonal with long torn runs, not vertical teeth.
  const tri = (i) => 2 - Math.abs((i % 4) - 2);            // 0,1,2,1 triangle wave
  const ventCols = (i) => { const lo = 2 + tri(i), hi = 8 - tri(i), s = new Set(); for (let k = lo; k <= hi; k++) s.add(k); return s; };
  // The bolt glyph — a diagonal ZIGZAG of dark facets (col 6→5→4→5→6 down the belly = a chevron
  // lightning slash), knocked out of the glow. NOT a block of squares.
  const boltSet = new Set(['2:6', '3:5', '4:4', '5:5', '6:6']);
  // Belly GRADIENT tier: brightest at the chest centre (station ~4, column 5), dim at flanks + aft.
  const bellyMat = (i, k) => { const lvl = Math.min(Math.abs(k - 5), 3) + Math.abs(i - 4) * 0.6; return lvl < 0.7 ? M.bellyCore : lvl < 2.2 ? M.bellyMid : M.bellyEdge; };
  const byMat = new Map();
  const push = (mat, ...tris) => { let a = byMat.get(mat); if (!a) byMat.set(mat, a = []); for (const t of tris) a.push(t); };
  for (let i = 0; i < stations.length - 1; i++) {
    const vc = ventCols(i);
    for (let k = 0; k < N; k++) {
      const k1 = (k + 1) % N;
      const A0 = P(stations[i], i, k), A1 = P(stations[i], i, k1), B0 = P(stations[i + 1], i + 1, k), B1 = P(stations[i + 1], i + 1, k1);
      let mat;
      if (vc.has(k)) mat = boltSet.has(i + ':' + k) ? M.bolt : bellyMat(i, k);   // ventral glow gradient, or a dark bolt facet
      else if (k === 0 || k === 9 || k === 1) mat = M.spine;              // dorsal ridge (darkest)
      else if (k === 2 || k === 8) mat = M.flank;                        // lit flank facet
      else mat = M.dorsal;                                               // shell
      push(mat, [A0, B1, B0], [A0, A1, B1]);
    }
  }
  // nose + tail caps (dorsal)
  for (const [s, i, dir] of [[stations[0], 0, 1], [stations[stations.length - 1], stations.length - 1, -1]]) {
    const c = [0, s.cy, s.z];
    for (let k = 0; k < N; k++) { const k1 = (k + 1) % N; const a = P(s, i, k), b = P(s, i, k1); push(M.spine, dir > 0 ? [c, b, a] : [c, a, b]); }
  }
  const g = new THREE.Group();
  for (const [mat, tris] of byMat) g.add(flatTriMesh(tris, mat));
  return g;
}

// A hanging drake LEG — upper limb → shank → clawed foot, tapered tri-lofts, dark shell.
// The reference is a QUADRUPED; a trunk with no legs reads as a slug (Fable). Static (a
// flight game — the legs hang), a slight forward/back set for fore/hind.
function buildLeg(M, rootX, rootY, rootZ, side, len, fwd) {
  const g = new THREE.Group();
  const seg = (x0, y0, z0, r0, x1, y1, z1, r1, mat) => {
    const tris = [], M6 = 6;
    for (let k = 0; k < M6; k++) {
      const a = (k / M6) * Math.PI * 2, a1 = ((k + 1) / M6) * Math.PI * 2;
      const p = (x, y, z, r, ang) => [x + Math.cos(ang) * r, y, z + Math.sin(ang) * r];
      const A0 = p(x0, y0, z0, r0, a), A1 = p(x0, y0, z0, r0, a1), B0 = p(x1, y1, z1, r1, a), B1 = p(x1, y1, z1, r1, a1);
      tris.push([A0, B1, B0], [A0, A1, B1]);
    }
    g.add(flatTriMesh(tris, mat));
  };
  const kneeX = rootX + side * 0.03, kneeY = rootY - len * 0.5, kneeZ = rootZ + fwd * 0.06;
  const footY = kneeY - len * 0.45, footZ = kneeZ + fwd * 0.10;
  // gate r3 fix #4: real limb MASS (was single spider-threads that vanished in top/rear views).
  seg(rootX, rootY, rootZ, len * 0.30, kneeX, kneeY, kneeZ, len * 0.18, M.dorsal);      // thigh/upper (muscled)
  seg(kneeX, kneeY, kneeZ, len * 0.18, footX(kneeX, side), footY, footZ, len * 0.09, M.spine);   // shank
  // three little claw toes
  for (let t = -1; t <= 1; t++) {
    const tx = footX(kneeX, side) + t * len * 0.06, tz = footZ + len * 0.13;
    g.add(flatTriMesh([[[footX(kneeX, side), footY, footZ], [tx - 0.02, footY - len * 0.05, tz], [tx + 0.02, footY - len * 0.05, tz]]], M.spine));
  }
  return g;
}
function footX(x, side) { return x + side * 0.01; }

// ── A minimal faceted tube loft (shared placeholder body element) ────────────
// Stations [{z, rx, ry, cy}] → one flat-shaded octagon tube. The STUB's stand-in
// for the real billowed clover-loft; I1 replaces it with cloverLoft (the knapLoft
// PATTERN + a per-station profile rotation ±10–14° — the diagonal turbulence weave
// that kills both rings AND straight strakes). Kept deliberately simple + solid here.
const OCTA = (() => { const p = []; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; p.push([Math.cos(a), Math.sin(a)]); } return p; })();
function tubeLoft(stations, mat, cap = true) {
  const N = OCTA.length;
  const P = (s, k) => [OCTA[k][0] * s.rx, s.cy + OCTA[k][1] * s.ry, s.z];
  const tris = [];
  for (let i = 0; i < stations.length - 1; i++) {
    const a = stations[i], b = stations[i + 1];
    for (let k = 0; k < N; k++) { const k1 = (k + 1) % N; tris.push([P(a, k), P(b, k1), P(b, k)], [P(a, k), P(a, k1), P(b, k1)]); }
  }
  if (cap) {
    const f = stations[0], l = stations[stations.length - 1];
    const fc = [0, f.cy, f.z], lc = [0, l.cy, l.z];
    for (let k = 0; k < N; k++) { const k1 = (k + 1) % N; tris.push([fc, P(f, k1), P(f, k)], [lc, P(l, k), P(l, k1)]); }
  }
  return flatTriMesh(tris, mat);
}

// ── TORSO: 'cumulonimbusTorso' (rebuilt to the OWNER REFERENCE — a storm DRAKE) ──
// A sleek dark-scaled drake trunk (deep keeled chest → hard waist tuck → haunch swell) with
// the near-black charcoal dorsal shell over the BLAZING white-blue emissive underbelly (the
// chevron lightning seam + dark bolt glyphs), a white neck crest, and four hanging legs.
// Publishes the FULL attach contract. The STORMFORK wing (I2), stormbrow head + virga fringe
// (I3), and the Storm Circuit + Surge (I4) still land per the increment plan.
function buildCumulonimbusTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const M = tempestMats(def);
  const heartScale = model.heartScale ?? 1;

  // The drake trunk stations (neck-base → tail-base, + two forward neck rings so the THROAT
  // glow reads). {z, rx, ryU (up), ryD (down), cy, keel}. chest depth ≥ 1.5× waist (Fable).
  // gate r3 fix #3: a DEEP-keeled compact drake (was a shallow horizontal torpedo/eel). The chest
  // rings are big-radius with a real sternum keel slung well below the shoulders; the waist tucks
  // HARD against them (chest depth ≈ 2.9× waist), so the level-glide side profile reads deep-chested.
  const trunk = [
    { z: -2.28, rx: 0.09, ryU: 0.09, ryD: 0.09, cy: 0.05 },   // neck (toward the head)
    { z: -1.92, rx: 0.13, ryU: 0.12, ryD: 0.15, cy: 0.12 },   // lower neck (rising)
    { z: -1.50, rx: 0.19, ryU: 0.16, ryD: 0.22, cy: 0.18 },   // neck-base / withers
    { z: -1.14, rx: 0.32, ryU: 0.22, ryD: 0.34, cy: 0.16 },   // shoulder girdle (widest, deep)
    { z: -0.74, rx: 0.31, ryU: 0.22, ryD: 0.48, cy: 0.13, keel: 0.12 },  // CHEST KEEL (deepest, slung below)
    { z: -0.26, rx: 0.24, ryU: 0.19, ryD: 0.32, cy: 0.16 },   // ribcage end
    { z: 0.28, rx: 0.15, ryU: 0.13, ryD: 0.15, cy: 0.21 },    // WAIST tuck (shallow — the pinch)
    { z: 0.74, rx: 0.25, ryU: 0.18, ryD: 0.24, cy: 0.16 },    // haunch swell
    { z: 1.16, rx: 0.16, ryU: 0.13, ryD: 0.15, cy: 0.15 },    // pelvis
    { z: 1.60, rx: 0.10, ryU: 0.09, ryD: 0.09, cy: 0.11 },    // tail-base
  ];
  group.add(buildDrakeTrunk(trunk, M));

  // THE NECK CREST — 4 back-swept white-blue emissive blades along the dorsal centerline over
  // the neck→shoulders, breaking the silhouette (the head pass continues them forward).
  for (let i = 0; i < 4; i++) {
    const t = i / 3, z = -1.62 + t * 0.66;                    // neck-base → shoulder
    const topY = 0.20 + t * 0.04, len = 0.22 - t * 0.06;      // taller toward the head
    const cant = (i % 2 ? 1 : -1) * 0.04;                     // slight ±off-sagittal so they read from behind
    const root0 = [cant - 0.03, topY, z], root1 = [cant + 0.03, topY, z];
    const kink = [cant, topY + len * 0.5, z + 0.10];          // mid-kink, swept back
    const tip = [cant, topY + len * 0.35, z + len * 0.9];     // swept aft
    group.add(flatTriMesh([[root0, kink, root1], [root1, kink, tip], [root0, tip, kink]], M.crest));
  }

  // FOUR HANGING LEGS — fore from the deep chest keel bottom, hind from the haunch (Fable).
  group.add(buildLeg(M, 0.19, -0.34, -0.76, 1, 0.54, 1));
  group.add(buildLeg(M, -0.19, -0.34, -0.76, -1, 0.54, 1));
  group.add(buildLeg(M, 0.20, -0.10, 0.76, 1, 0.50, -1));
  group.add(buildLeg(M, -0.20, -0.10, 0.76, -1, 0.50, -1));

  // THE STORM-HEART core — the brightest ventral point at the sternum, on the coreGlow hook.
  const coreGeo = new THREE.OctahedronGeometry(0.10 * (0.7 + 0.5 * heartScale), 0);
  { const pa = coreGeo.attributes.position; for (let vi = 0; vi < pa.count; vi++) { const j = jit(vi * 3, 0.02); pa.setXYZ(vi, pa.getX(vi) + j, pa.getY(vi) + j, pa.getZ(vi) + j); } pa.needsUpdate = true; coreGeo.computeVertexNormals(); }
  const core = new THREE.Mesh(coreGeo, M.heartCore);
  core.position.set(0, -0.22, -0.74); core.renderOrder = 1;   // in the deep chest keel, the hot spot of the belly glow
  core.userData.base = 0.7 + 0.15 * heartScale;              // bright in cruise (the reference chest is the hot spot); blazes on Surge
  group.add(core);

  // Motif anchor — the STORM-HEART (fixed at the sternum, never re-hues, §3).
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.set(0, -0.22, -0.74);
  group.add(motifAnchor);

  // Line-of-action (≥2 inflections: neck rises → chest proud → waist tuck → haunch → tail).
  const spinePoints = [
    new THREE.Vector3(0, 0.05, -2.28), new THREE.Vector3(0, 0.19, -1.5),
    new THREE.Vector3(0, 0.17, -0.28), new THREE.Vector3(0, 0.20, 0.26),
    new THREE.Vector3(0, 0.12, 1.60),
  ];
  const wro = model.wingRootOffset ?? {};
  const attach = {
    wingRoot: (side) => ({ x: 0.30 * side, y: TORSO_Y + 0.30 + (wro.y ?? 0), z: -1.00 + (wro.z ?? 0) }),   // shoulder girdle
    headBase: { x: 0, y: 0.00, z: -2.40 },
    tailAnchor: { y: 0.12, z: 1.56 },
    keelTopAt: (z) => TORSO_Y + 0.30 * Math.max(0, 1 - Math.abs(z + 1.0) / 2.4),
    halfWidthAt: (z) => 0.30 * Math.max(0.2, 1 - Math.abs(z + 0.6) / 3.0),
    bodyMidY: TORSO_Y, tailShift: 0,
    riderSocket: { x: 0, y: 0.52, z: -0.5 },
    motifAnchor,
  };
  // coreGlow = the storm-heart core (the real transparent hook — opacity ticked). flareMats =
  // the belly + crest + heart (Surge-flared, exempt from the warm cruise rim). spineMats [] .
  return { group, attach, spinePoints, spineMats: [], flareMats: [M.bellyCore, M.bellyMid, M.bellyEdge, M.crest, M.heartCore], mats: { bodyMat: M.dorsal }, coreGlow: core };
}
registerTorso('cumulonimbusTorso', buildCumulonimbusTorso);

// ── WINGS: 'stormforkWings' (the HERO) ────────────────────────────────────────
// STUB (I2 builds it for real, §D): the STORMFORK — a wing whose skeleton IS a frozen
// branching lightning bolt (a gull ARCH with exactly 3 kink-knuckles + a dominant
// Y-fork, cupped opaque membrane bays, silver rim-caps, ONE connected knife-edge). For
// now a bare charcoal ARM + a small decaying ray fan carrying one thin opaque membrane,
// wired into the SAME 3-segment hinge (pivot/mid/tip) + outer-lmirror rig the real wing
// will use — so I2 swaps GEOMETRY without touching the flap contract. NO bolt kinks /
// Y-fork / bays yet; the module-level boltArm waypoint profile lands in I2.
function buildOneStormforkWing(M, dials, wingMat) {
  const arm = new THREE.Group();
  const hand = new THREE.Group();
  const hs = dials.halfSpan, wristT = dials.wristT ?? 0.24;
  const rays = Math.max(2, Math.round(dials.rays));
  // Placeholder leading edge: a shallow gull arch to the carpal, then ease to the tip
  // (I2 replaces this with the piecewise-LINEAR boltArm waypoint function — the 3 kinks).
  const armY = (t) => hs * (0.05 * t + 0.22 * (t <= wristT ? Math.sin((t / wristT) * Math.PI / 2) : 1 - (t - wristT) * 0.12));
  const armZ = (t) => -0.06 + 0.34 * hs * Math.pow(t, 1.05) - 0.10 * hs * Math.sin(Math.PI * t);
  const LE = (t) => [t * hs, armY(t), armZ(t)];
  const K = LE(wristT), F0 = LE(1);
  // Arm bone (root→carpal) as a low tent ridge with a diffuse silver rim-cap crest.
  const ridge = (tgt, a, b, w, lift, mat) => {
    const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz) || 1, px = -dz / len, pz = dx / len;
    const aL = [a[0] + px * w, a[1], a[2] + pz * w], aR = [a[0] - px * w, a[1], a[2] - pz * w];
    const aT = [a[0], a[1] + lift, a[2]], bT = [b[0], b[1] + lift * 0.35, b[2]];
    tgt.add(flatTriMesh([[aL, b, bT], [aL, bT, aT], [aR, aT, bT], [aR, bT, b]], mat));
  };
  ridge(arm, LE(0), K, 0.08 * hs, 0.06 * hs, M.silverRim);   // arm crest (silver-lining rim-cap)
  // Rays fan aft from the carpal (dominant + decay ≤0.86×), each a low charcoal tent.
  const lenFrac = [1, 0.80, 0.62, 0.46];
  const phi0 = Math.atan2(F0[2] - K[2], F0[0] - K[0]), r0 = Math.hypot(F0[0] - K[0], F0[2] - K[2]);
  const tips = [F0];
  for (let i = 1; i < rays; i++) {
    const phi = phi0 + 1.0 * (i / (rays - 1)), r = r0 * lenFrac[Math.min(i, lenFrac.length - 1)];
    tips.push([K[0] + Math.cos(phi) * r, K[1] - 0.08 * r, K[2] + Math.sin(phi) * r]);
  }
  for (const tp of tips) ridge(hand, K, tp, 0.05 * hs, 0.05 * hs, M.dorsal);
  // ONE opaque charcoal membrane spanning arm-root → carpal → last ray tip (placeholder
  // sheet; I2 cuts the inward-cupped bays + the Y-fork V-notch). The membrane is OPAQUE
  // matte cloud (the settled opacity law — never translucent bat-skin, §C.3/§D.2c); the
  // rig's wingMat.opacity writes are visually inert by construction (noted, not a bug —
  // the transparent flag is kept so the rig's material drive never throws).
  const root = LE(0), last = tips[tips.length - 1];
  hand.add(flatTriMesh([[root, K, last], [root, last, [last[0] * 0.5 + root[0] * 0.5, root[1] - 0.05 * hs, last[2] * 0.5 + root[2] * 0.5]]], wingMat));
  return { arm, hand, K, tip: F0 };
}

function buildStormforkWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const M = tempestMats(def);
  const rays = Math.max(2, Math.round(model.rays ?? model.fingers ?? 4));
  const halfSpan = (model.spanScale ?? 1) * 2.3;
  const wristT = model.wristT ?? 0.24;
  const dials = { rays, halfSpan, wristT };

  // The rig's single-material wing contract (dragonModel/dragon.js drive ONE wingMat's
  // opacity/emissive). The Stormfork membrane is OPAQUE matte cloud; emissive black in
  // cruise (the near-white circuit owns the light, on the FRAME, never painted on the
  // sheet). transparent:true is kept so the rig's opacity drive is a no-op, not a throw.
  const wo = def.wingOuter ?? FLANK;
  const wingMat = new THREE.MeshStandardMaterial({ color: lerpHex(wo, STORM_SHADOW, 0.3), emissive: 0x000000, flatShading: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 1.0 });
  wingMat.envMapIntensity = 0.18;

  const pivots = {}, wingElements = [];
  for (const side of [1, -1]) {
    const root = attach.wingRoot(side);
    const rootC = attach.wingRoot(1);   // build CANONICAL right; left is an outer lmirror wrapper
    const pivot = new THREE.Group(); pivot.position.set(rootC.x, rootC.y, rootC.z); pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);
    const { arm, hand, K } = buildOneStormforkWing(M, dials, wingMat);
    mid.add(arm);
    tip.position.set(K[0], K[1], K[2]);      // fold joint = the carpal knuckle (the dominant kink in I2)
    hand.position.set(-K[0], -K[1], -K[2]);  // −anchor → assembled REST pose byte-identical
    tip.add(hand);
    if (side === -1) { const lmirror = new THREE.Group(); lmirror.scale.x = -1; lmirror.add(pivot); group.add(lmirror); }
    else group.add(pivot);
    const s = side === 1 ? 'R' : 'L';
    // Tip marker — the wingtip (dominant-ray tip F0), tracked through the wrist fold (FX emit point).
    const tipY = halfSpan * (0.05 + 0.22 * (1 - (1 - wristT) * 0.12));
    const marker = new THREE.Object3D();
    marker.position.set(halfSpan, tipY, -0.06 + 0.34 * halfSpan);
    hand.add(marker);
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip; pivots['tipMarker' + s] = marker;
    wingElements.push({ root: [root.x, root.y, root.z], tip: [root.x + side * halfSpan, root.y + tipY, root.z + 0.28], length: halfSpan, tipObj: marker });
  }
  return { group, spineMats: [], wingMat, parts: { ...pivots, wingElements } };
}
registerWings('stormforkWings', buildStormforkWings);

// ── HEAD: 'stormbrowHead' ─────────────────────────────────────────────────────
// STUB (I3 builds it for real): a blunt RAM-PROW wedge (the storm leads with its
// forehead — heavy brow shelf, short muzzle, no horns) + two pale arc-white pinpoint
// eyes. I3 adds the true facets, the 2 blunt horn-BOSSES, the swept-back NIMBUS MANE
// (0→2→4→6 up the ladder), the eye:head ladder + the f3 charge-hair. Uses the shared
// eyeMat (def.eye drives its colour) — eyes are the brightest facial point.
function buildStormbrowHead(def, model, mats) {
  const group = new THREE.Group();
  const M = tempestMats(def);
  const hs = model.headScale ?? 1;
  const eyeMat = mats.eyeMat;

  // Blunt ram-prow wedge pointing −Z (heavy brow → short muzzle).
  const skull = [
    { z: 0.28, rx: 0.19 * hs, ry: 0.20 * hs, cy: 0.02 },   // occiput
    { z: -0.02, rx: 0.23 * hs, ry: 0.24 * hs, cy: 0.05 },  // brow shelf (widest, heavy)
    { z: -0.36, rx: 0.16 * hs, ry: 0.15 * hs, cy: -0.01 }, // cheek
    { z: -0.66, rx: 0.09 * hs, ry: 0.09 * hs, cy: -0.05 }, // short muzzle
    { z: -0.84, rx: 0.05 * hs, ry: 0.05 * hs, cy: -0.06 }, // blunt tip
  ];
  group.add(tubeLoft(skull, M.flank));
  const headLength = 1.12 * hs;

  // Pale arc-white pinpoint eyes (def.eye). Seated high on the brow, converged forward.
  // Intensity rises with glowLevel (whelp→apex, the grind reward); eyes are rig-driven
  // separately (kept OUT of every surge/storm array — the fever firewall).
  eyeMat.emissiveIntensity = 0.7 + 1.6 * (model.glowLevel ?? 1);
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.05 * hs, 0), eyeMat);
    eye.position.set(side * 0.15 * hs, 0.09 * hs, -0.10 * hs);   // high on the brow (the brightest facial point)
    group.add(eye);
  }
  const motifAnchor = new THREE.Object3D(); motifAnchor.position.set(0, 0.14 * hs, 0.10 * hs); group.add(motifAnchor);
  return { group, spineMats: [], motifAnchor, headLength };
}
registerHead('stormbrowHead', buildStormbrowHead);

// ── TAIL: 'virgaTail' ─────────────────────────────────────────────────────────
// STUB (I3 builds it for real): a tapering storm-stem on the Vesper isBone 4-joint
// NESTED chain (−anchor rest-pose compensation, rotation-only drive) closing in a small
// nub — the SAME nested-chain pattern as splitFanTail so the rig's travelling-wave
// tailWhip has real joints to walk. I3 adds the VIRGA FRINGE (2→3→4→5 rain-streamer
// wisps) + ONE connected translucent hem band + the f3 arc terminus stud. NO wisps yet.
function buildVirgaTail(def, model, mats, anchor) {
  const group = new THREE.Group();
  const M = tempestMats(def);
  const a = anchor ?? { y: 0.12, z: 1.62 };
  const T = (model.tailLength ?? 1) * 2.5 * (model.tailStretch ?? 1);
  const nSeg = Math.round(model.tailSegments ?? 8);
  const rAt = (t) => 0.11 * Math.pow(1 - t * 0.92, 0.7) + 0.008;   // tapers to ≤0.20× base
  const curveY = (t) => -0.05 * T * Math.sin(Math.PI * t * 0.9);   // low counter-drop then flick
  const stem = [];
  for (let i = 0; i <= nSeg; i++) { const t = i / nSeg; stem.push({ z: a.z + t * T, rx: rAt(t), ry: rAt(t), cy: a.y + curveY(t) }); }

  // 4-joint NESTED isBone chain (verbatim splitFan pattern): every piece is
  // position-compensated by −anchor so the assembled REST pose is byte-identical.
  const nChain = 4;
  const jIdx = (j) => Math.min(nSeg, Math.round(j * nSeg / nChain));
  const jAnchor = (j) => { const s = stem[jIdx(j)]; return { x: 0, y: s.cy, z: s.z }; };
  const joints = [];
  { let parent = group, prev = { x: 0, y: 0, z: 0 };
    for (let j = 0; j < nChain; j++) { const an = jAnchor(j); const sg = new THREE.Group(); sg.name = 'tempestTailPivot' + j; sg.position.set(an.x - prev.x, an.y - prev.y, an.z - prev.z); parent.add(sg); joints.push(sg); parent = sg; prev = an; } }
  joints[0].isBone = true;   // drive by ROTATION only (position writes tear a connected loft)
  const jointOf = (z) => { for (let j = nChain - 1; j >= 0; j--) if (z >= jAnchor(j).z - 1e-6) return j; return 0; };
  const chainAdd = (z, mesh) => { const j = jointOf(z), an = jAnchor(j); mesh.position.set(-an.x, -an.y, -an.z); joints[j].add(mesh); return mesh; };
  for (let j = 0; j < nChain; j++) { const i0 = jIdx(j), i1 = jIdx(j + 1); if (i1 > i0) chainAdd(stem[i0].z, tubeLoft(stem.slice(i0, i1 + 1), M.flank, false)); }

  // Small rain-nub closing the stem (the virga fringe + hem land here in I3).
  const tip = stem[nSeg], tx = 0, ty = tip.cy, tz = tip.z;
  chainAdd(tz, flatTriMesh([
    [[tx, ty + 0.04, tz], [tx - 0.07, ty, tz + 0.10], [tx + 0.07, ty, tz + 0.10]],
    [[tx - 0.07, ty, tz + 0.10], [tx, ty - 0.02, tz + 0.24], [tx + 0.07, ty, tz + 0.10]],
  ], M.belly));

  return { group, segs: joints, accentMats: [] };
}
registerTail('virgaTail', buildVirgaTail);
