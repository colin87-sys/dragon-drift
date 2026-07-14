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

function tempestMats(def) {
  const base = def.body ?? FLANK;
  // Lever 1 — SPATIAL albedo spread WITHIN the charcoal band (0.20↔0.26): lit lobe CRESTS
  // ride lighter, shadow CREASES ride darker, so the body carries the MID-TONE cloud
  // gradient the gate found missing (was bimodal: black body + white stripe). All derived
  // from the per-form def.body so the CHARGING ramp still darkens the whole set up the ladder.
  const mk = (mat) => { mat.envMapIntensity = 0.18; mat.emissive = new THREE.Color(CLOUD_FLOOR); mat.emissiveIntensity = 1.0; return mat; };
  const std = (color) => mk(new THREE.MeshStandardMaterial({ color, emissive: CLOUD_FLOOR, flatShading: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide }));
  const crest = std(lerpHex(base, 0xdfe6f2, 0.16));   // lit lobe crest — the lightest charcoal (~top of the band)
  const flank = std(base);                            // mid tier (the bodyMat the rig ticks)
  const crease = std(lerpHex(base, 0x05070c, 0.22));  // shadow crease between lobes — the deepest cloud value
  const belly = std(def.belly ?? BELLY);              // rain-slate ventral — banks read
  // Silver-lining rim — DIFFUSE, low metalness ("glints, never glows"): the standing-frame
  // cool. A small self-lit floor keeps the lining readable on the dark sky (the ≥10%
  // body-px-≥L0.10 floor) but capped so it stays UNDER the eyes (gate M1: rim value L≤0.75).
  const silverRim = new THREE.MeshStandardMaterial({ color: SILVER_RIM, emissive: SILVER_RIM, emissiveIntensity: 0.05, flatShading: true, roughness: 0.7, metalness: 0.06, side: THREE.DoubleSide });
  silverRim.envMapIntensity = 0.3;
  // `dorsal` alias kept for the cowl plate call sites (points at the crease/shadow tier).
  const dorsal = crease;
  // Dynamo stator VANE — charcoal, a hair darker than dorsal (the cage that rings the core).
  const vane = new THREE.MeshStandardMaterial({ color: lerpHex(STORM_SHADOW, 0x000000, 0.28), emissive: 0x000000, flatShading: true, roughness: 0.8, metalness: 0.04, side: THREE.DoubleSide });
  vane.envMapIntensity = 0.16;
  // Dynamo HUB — the opaque faceted turbine hub (reads as a generator, dark, always visible).
  const hub = new THREE.MeshStandardMaterial({ color: lerpHex(STORM_SHADOW, 0x000000, 0.42), emissive: 0x000000, flatShading: true, roughness: 0.75, metalness: 0.05, side: THREE.DoubleSide });
  hub.envMapIntensity = 0.16;
  // Dynamo CORE — the withheld storm-white emissive seat, TRANSPARENT for the coreGlow
  // opacity tick (dragon.js:1159). Idles near-invisible (base 0.06 opacity + dim emissive):
  // carved-dark cruise, NO lit lantern (§C.3.3). The strike/Surge ignition lands at I4.
  const heartCore = new THREE.MeshStandardMaterial({ color: 0x0a0e1a, emissive: 0xd9deff, emissiveIntensity: 0.06, flatShading: true, roughness: 0.5, metalness: 0, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide });
  heartCore.userData.baseEmissive = 0xd9deff; heartCore.userData.baseIntensity = 0.06;   // flareMats lerps emissive → surgeHi on Surge (hue only; the storm tick owns cruise strikes at I4)
  return { crest, flank, crease, dorsal, belly, silverRim, vane, hub, heartCore };
}

// ── The 9-point CLOVER-OF-3-LOBES cross-section (unit; a dorsal lobe on top + two
// ventral lobes) — a billowed cloud section, NOT a smooth ring. `r(θ)=1+0.30·cos(3θ+90°)`
// puts a soft lobe peak at the top (dorsal) and two below (ventral): the convex lobes
// break the OUTLINE into ≥3 bumps (amp 0.30 ≈ 30% of local radius, so the 3-clover survives
// to the REAR-CHASE silhouette — gate M3) AND catch the key/sky far better than a flat tube
// (the I0 black-crush fix is GEOMETRY, not albedo).
const CLOVER = (() => {
  const p = [];
  for (let k = 0; k < 9; k++) { const th = (90 + k * 40) * Math.PI / 180; const r = 1 + 0.30 * Math.cos(3 * th + Math.PI / 2); p.push([Math.cos(th) * r, Math.sin(th) * r]); }
  return p;
})();
const CLOVER_R = CLOVER.map((p) => Math.hypot(p[0], p[1]));
// Per-column value band — lever 1 SPATIAL SPREAD: a column on a lit lobe CREST (high radius)
// rides the lightest tier, a column in a shadow CREASE (low radius) the darkest, ventral
// columns the rain-slate belly — the mid-tone cloud gradient (crest-lit / crease-shadowed),
// not a flat body + a stripe.
function cloverBand(M, k) {
  const k1 = (k + 1) % CLOVER.length;
  const rC = (CLOVER_R[k] + CLOVER_R[k1]) * 0.5;         // crest vs crease
  const yC = (CLOVER[k][1] + CLOVER[k1][1]) * 0.5;        // dorsal vs ventral
  if (yC < -0.45) return M.belly;                         // ventral lobes → rain-slate
  if (rC > 1.04) return M.crest;                          // lobe crest (lit) → lightest charcoal
  if (rC < 0.92) return M.crease;                         // shadow crease → deepest
  return M.flank;                                         // shoulders → mid
}

// A fixed-polygon loft over the CLOVER profile with a per-station ROTATION (`rot`,
// radians) — the knapLoft PATTERN (shared indices weld longitudinal facets) but the
// small alternating ±10–14° rotation station-to-station skews those facets into a
// DIAGONAL TURBULENCE WEAVE: it kills lateral rings (adjacent stations are out of phase)
// AND straight strakes (columns wobble) — the "churning cloud, never a smooth hull"
// read (§4/§B.3a). `bandFn(k)` paints the value bands; tris group per material → one
// draw per band. knapLoft deliberately cannot rotate — that is what makes IT strakes.
function cloverLoft(stations, bandFn, cap = true) {
  const N = CLOVER.length;
  const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  const P = (s, k) => { const pr = rot(CLOVER[k], s.rot || 0); return [(s.cx ?? 0) + pr[0] * s.rx, s.cy + pr[1] * s.ry, s.z]; };
  const colMat = typeof bandFn === 'function' ? bandFn : () => bandFn;
  const byMat = new Map();
  const push = (mat, ...tris) => { let a = byMat.get(mat); if (!a) byMat.set(mat, a = []); for (const t of tris) a.push(t); };
  for (let i = 0; i < stations.length - 1; i++) {
    const a = stations[i], b = stations[i + 1];
    for (let k = 0; k < N; k++) { const k1 = (k + 1) % N; const A0 = P(a, k), A1 = P(a, k1), B0 = P(b, k), B1 = P(b, k1); push(colMat(k), [A0, B1, B0], [A0, A1, B1]); }
  }
  if (cap) {
    const f = stations[0], l = stations[stations.length - 1];
    const fc = [(f.cx ?? 0), f.cy, f.z], lc = [(l.cx ?? 0), l.cy, l.z];
    for (let k = 0; k < N; k++) { const k1 = (k + 1) % N; push(colMat(k), [fc, P(f, k1), P(f, k)], [lc, P(l, k), P(l, k1)]); }
  }
  const g = new THREE.Group();
  for (const [mat, tris] of byMat) g.add(flatTriMesh(tris, mat));
  return g;
}

// A thin raised SILVER-LINING dash following one CLOVER lobe-crest (profile index
// `idx`) — a narrow ribbon lifted radially off the surface, catching a cool rim glint
// on its outward face ("the sun behind the cloud"). Gate M1: the width TAPERS to 0 at
// both ends (a hann window) so it reads as an INTERRUPTED lining, never a full-length
// racing stripe. Diffuse, held under the eyes. Kept SHORT + on the dorsal crest only.
function crestRim(stations, idx, mat, lift = 0.02, halfW = 0.05) {
  const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  const n = stations.length;
  const at = (s) => {
    const pr = rot(CLOVER[idx], s.rot || 0); const nl = Math.hypot(pr[0], pr[1]) || 1;
    const x = (s.cx ?? 0) + pr[0] * s.rx + (pr[0] / nl) * lift, y = s.cy + pr[1] * s.ry + (pr[1] / nl) * lift;
    return { x, y, z: s.z, tx: -(pr[1] / nl), ty: pr[0] / nl };   // tangent in the cross-plane → the ribbon's width axis
  };
  const win = (i) => halfW * Math.sin(Math.PI * i / (n - 1));   // hann taper → 0 at both ends
  const tris = [];
  for (let i = 0; i < n - 1; i++) {
    const A = at(stations[i]), B = at(stations[i + 1]); const wA = win(i), wB = win(i + 1);
    const AL = [A.x + A.tx * wA, A.y + A.ty * wA, A.z], AR = [A.x - A.tx * wA, A.y - A.ty * wA, A.z];
    const BL = [B.x + B.tx * wB, B.y + B.ty * wB, B.z], BR = [B.x - B.tx * wB, B.y - B.ty * wB, B.z];
    tris.push([AL, BR, BL], [AL, AR, BR]);
  }
  return flatTriMesh(tris, mat);
}

// THE CAGED DYNAMO (the Zekrom-Overdrive storm-heart, §B.3a): 5 charcoal stator VANES
// swept like turbine blades around an opaque faceted HUB, with a withheld transparent
// storm-white CORE seated inside on the `coreGlow` hook. Reads as a GENERATOR (opaque
// structure) in cruise, idles DARK (the core near-invisible), and "turns over" on the
// pre-strike telegraph + Surge (I4). Recessed at the sternum so the belly mass occludes
// it ≥60% from the side — never an enclosed framed hole (anti-reskin), never a lamp.
function buildDynamo(M, cx, cy, cz, heartScale) {
  const g = new THREE.Group();
  const R = 0.16 * (0.7 + 0.5 * heartScale);   // cage radius
  // Opaque faceted HUB — an icosa lump, hash-jittered (deterministic, index-hashed — never
  // Math.random) so it reads as a struck turbine hub, not a smooth ball. Seated at the core.
  const hubGeo = new THREE.IcosahedronGeometry(R * 0.55, 0);
  { const pa = hubGeo.attributes.position; for (let vi = 0; vi < pa.count; vi++) {
      const h = Math.sin((vi + 1) * 12.9898) * 43758.5453, j = (h - Math.floor(h) - 0.5) * 0.22 * R;
      pa.setXYZ(vi, pa.getX(vi) + j, pa.getY(vi) + j * 0.8, pa.getZ(vi) + j * 0.6); }
    pa.needsUpdate = true; hubGeo.computeVertexNormals(); }
  const hub = new THREE.Mesh(hubGeo, M.hub); hub.position.set(cx, cy, cz); g.add(hub);
  // 5 stator VANES ringing the hub in the frontal (x-y) plane, swept — 2-face tents each,
  // ≥0.06 clearance off the hub so the core is seen BETWEEN them (no coplanar z-fight).
  const nV = 5;
  for (let i = 0; i < nV; i++) {
    const a0 = (i / nV) * Math.PI * 2, sweep = 0.5;   // swept like turbine stators
    const inner = R * 0.62, outer = R * 1.12;
    const ix = cx + Math.cos(a0) * inner, iy = cy + Math.sin(a0) * inner;
    const ox = cx + Math.cos(a0 + sweep) * outer, oy = cy + Math.sin(a0 + sweep) * outer;
    const zf = cz + 0.05, zb = cz - 0.03;   // a tent: front lip proud, back lip recessed
    g.add(flatTriMesh([
      [[ix, iy, zb], [ox, oy, zb], [ (ix + ox) / 2, (iy + oy) / 2, zf ]],
      [[ix, iy, zb], [(ix + ox) / 2, (iy + oy) / 2, zf], [ox, oy, zb]],
    ], M.vane));
  }
  // The withheld CORE on the coreGlow hook (transparent, idle-dark, ignites I4/Surge).
  const coreGeo = new THREE.OctahedronGeometry(R * 0.42, 0);
  { const pa = coreGeo.attributes.position; for (let vi = 0; vi < pa.count; vi++) {
      const h = Math.sin((vi + 1) * 78.233) * 12543.187, j = (h - Math.floor(h) - 0.5) * 0.2 * R;
      pa.setXYZ(vi, pa.getX(vi) + j, pa.getY(vi) + j, pa.getZ(vi) + j); }
    pa.needsUpdate = true; coreGeo.computeVertexNormals(); }
  const core = new THREE.Mesh(coreGeo, M.heartCore);
  core.position.set(cx, cy, cz + 0.02); core.renderOrder = 1;
  core.userData.base = 0.06 + 0.10 * heartScale;   // the coreGlow tick scales THIS opacity (low = withheld)
  g.add(core);
  return { group: g, core };
}

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

// ── TORSO: 'cumulonimbusTorso' (I1 — the billowed cloud-mass + the caged dynamo) ─
// A lean charcoal cloud-mass built as a CLOVER-LOFT (billowed 3-lobe sections, per-
// station rotation = the diagonal turbulence weave), with diffuse silver-lining rims
// tracing the lobe crests, scapular STORM COWLS lapping the wing roots, and the CAGED
// DYNAMO storm-heart at the sternum on the real transparent `coreGlow` hook. Publishes
// the FULL attach contract (§B.3a). spinePoints carry the ≥2 inflections the §7
// line-of-action assert wants: neck rises INTO the storm wall → chest proud → tail
// counter-drop → tip flick. The STORMFORK wing (I2), stormbrow head + virga fringe (I3),
// and the Storm Circuit + Surge (I4) still land per the increment plan.
function buildCumulonimbusTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const M = tempestMats(def);
  const shoulderW = model.shoulderWidthScale ?? 1;
  const heartScale = model.heartScale ?? 1;

  // Billowed cloud-mass: chest deepest at the wing-arm root (shoulder:waist ≈ 1.55),
  // lean waist, haunch swell — the storm front's forward-high mass on a lean chassis.
  // `rot` alternates ±10–14° station-to-station (the turbulence weave; small enough the
  // dorsal/ventral value bands still read regionally).
  const D = Math.PI / 180;
  // Billowed cloud-mass, WIDENED (gate M3: the storm-front must be the widest, most-massed
  // thing in the rear-chase frame — the torso was reading slim). rx/ry pushed up through the
  // chest→haunch so the 3-clover reads as a broad cumulonimbus, not a slim serpent-jet.
  const body = [
    { z: -1.55, rx: 0.24 * shoulderW, ry: 0.27, cy: 0.19, rot: 12 * D },   // chest prow (proud into the wall)
    { z: -0.92, rx: 0.44 * shoulderW, ry: 0.50, cy: 0.12, rot: -10 * D },  // shoulder / wing-arm root (deepest, widest)
    { z: -0.15, rx: 0.34, ry: 0.38, cy: 0.14, rot: 14 * D },               // mid barrel (kept massed)
    { z: 0.52, rx: 0.26, ry: 0.29, cy: 0.13, rot: -11 * D },               // waist (a tuck, not a pinch)
    { z: 1.08, rx: 0.30, ry: 0.32, cy: 0.16, rot: 13 * D },                // haunch swell
    { z: 1.62, rx: 0.14, ry: 0.15, cy: 0.11, rot: -10 * D },               // tail root (counter-drop)
  ];
  group.add(cloverLoft(body, (k) => cloverBand(M, k)));
  // Neck rising INTO the wall (chest proud, head slightly low under the overhang).
  const neck = [
    { z: -1.50, rx: 0.21, ry: 0.23, cy: 0.19, rot: 12 * D },
    { z: -1.92, rx: 0.15, ry: 0.16, cy: 0.14, rot: -8 * D },
    { z: -2.30, rx: 0.10, ry: 0.11, cy: 0.06, rot: 10 * D },
  ];
  group.add(cloverLoft(neck, (k) => cloverBand(M, k), false));

  // Silver-lining accent — gate M1: ONE short, hann-TAPERED dorsal-crest dash over the
  // shoulder→waist (the middle ~40% of the body, where a lobe crest meets the silhouette),
  // NOT the three full-length zigzag stripes that read as racing livery. Interrupted +
  // tapered = "the sun catching one cloud crest", ≤~5% of body pixels, held under the eyes.
  group.add(crestRim(body.slice(1, 4), 0, M.silverRim, 0.02, 0.055));

  // Scapular STORM COWLS — a LOFTED billowed lobe-plate per side lapping each wing root,
  // STATIC in the body frame (never parented to the flapping pivot). Gate M2: a real loft
  // (a small clover cap, ≥8 faces, no right-angle silhouette corners), blended into the
  // shoulder lobe — the overlap-over-weld cowl trick (§B.3a / §D.2f).
  const cowlAt = (side) => {
    const rx0 = 0.30 * shoulderW;
    const cowl = [
      { z: -1.02, rx: 0.10, ry: 0.12, cx: side * (rx0 + 0.02), cy: TORSO_Y + 0.30, rot: side * 20 * D },
      { z: -0.80, rx: 0.15, ry: 0.17, cx: side * (rx0 + 0.06), cy: TORSO_Y + 0.30, rot: side * 24 * D },
      { z: -0.52, rx: 0.11, ry: 0.13, cx: side * (rx0 + 0.02), cy: TORSO_Y + 0.26, rot: side * 20 * D },
    ];
    group.add(cloverLoft(cowl, (k) => (CLOVER_R[k] > 1.04 ? M.crest : M.crease), false));
  };
  cowlAt(1); cowlAt(-1);

  // THE CAGED DYNAMO — recessed at the sternum, below the rider eye-line, seen between
  // the belly lobes from the rear (the storm-heart). coreGlow rides its withheld core.
  const dz = -0.72, dyn = buildDynamo(M, 0, TORSO_Y - 0.06, dz, heartScale);
  group.add(dyn.group);

  // Motif anchor — the STORM-HEART's dynamo centre (fixed, never re-hues, §3).
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.set(0, TORSO_Y - 0.06, dz);
  group.add(motifAnchor);

  // Line-of-action (≥2 inflections: neck rises into the wall → chest proud → tail counter-drop → flick).
  const spinePoints = [
    new THREE.Vector3(0, 0.06, -2.30), new THREE.Vector3(0, 0.19, -1.5),
    new THREE.Vector3(0, 0.15, -0.1), new THREE.Vector3(0, 0.17, 1.08),
    new THREE.Vector3(0, 0.12, 1.62),
  ];
  const wro = model.wingRootOffset ?? {};
  const attach = {
    wingRoot: (side) => ({ x: (0.36 * shoulderW) * side, y: TORSO_Y + 0.32 + (wro.y ?? 0), z: -0.72 + (wro.z ?? 0) }),
    headBase: { x: 0, y: 0.02, z: -2.40 },
    tailAnchor: { y: 0.12, z: 1.58 },
    keelTopAt: (z) => TORSO_Y + 0.34 * Math.max(0, 1 - Math.abs(z + 0.5) / 2.4),
    halfWidthAt: (z) => 0.36 * Math.max(0.2, 1 - Math.abs(z + 0.3) / 3.0),
    bodyMidY: TORSO_Y, tailShift: 0,
    riderSocket: { x: 0, y: 0.62, z: -0.28 },
    motifAnchor,
  };
  // coreGlow = the withheld dynamo CORE mesh (the real transparent hook — NOT null now).
  // flareMats = the core mat (Surge hue-lerp toward surgeHi; the storm tick owns cruise
  // strikes at I4). spineMats stays [] (the warm cruise rim must never touch the storm family).
  return { group, attach, spinePoints, spineMats: [], flareMats: [M.heartCore], mats: { bodyMat: M.flank }, coreGlow: dyn.core };
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
