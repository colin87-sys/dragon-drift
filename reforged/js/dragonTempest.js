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
// it, the Revenant precedent). The near-white STORM CIRCUIT (arcSeam / arcCore / heart)
// is NOT built here — it lands as flareMats + the guarded storm tick from I4.
function tempestMats(def) {
  const flank = new THREE.MeshStandardMaterial({ color: def.body ?? FLANK, emissive: 0x000000, flatShading: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
  flank.envMapIntensity = 0.18;
  // Dorsal storm-shadow — the deepest cloud value along the back.
  const dorsal = new THREE.MeshStandardMaterial({ color: STORM_SHADOW, emissive: 0x000000, flatShading: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
  dorsal.envMapIntensity = 0.18;
  // Rain-slate belly — a value-step LIGHTER than the body so banks + the keel read.
  const belly = new THREE.MeshStandardMaterial({ color: def.belly ?? BELLY, emissive: 0x000000, flatShading: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
  belly.envMapIntensity = 0.18;
  // Silver-lining rim — DIFFUSE, low metalness, low envMap ("glints, never glows"): the
  // standing-frame cool that carries the 82–94% no-strike read (§R2.2 / §D.2d). Capped
  // env so it never out-reads the eyes on a dark sky (the Vesper I1 rim failure).
  const silverRim = new THREE.MeshStandardMaterial({ color: SILVER_RIM, emissive: 0x000000, flatShading: true, roughness: 0.7, metalness: 0.06, side: THREE.DoubleSide });
  silverRim.envMapIntensity = 0.3;
  return { flank, dorsal, belly, silverRim };
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

// ── TORSO: 'cumulonimbusTorso' ────────────────────────────────────────────────
// STUB (I1 builds it for real): a lean charcoal cloud-mass, publishing the FULL
// attach contract (§B.3a) so the wings/head/tail mount correctly and the rig
// flaps/rides without a crash. spinePoints carry the ≥2 inflections the §7
// line-of-action assert wants: neck rises INTO the storm wall → chest proud → tail
// counter-drop → tip flick. coreGlow is NULL for now (the caged-dynamo storm-heart on
// the real transparent coreGlow hook lands in I1); dragonModel then builds the
// def.coreGlow sprite as a placeholder glow — the crash-safe stub value (a colour
// number would null-deref coreGlow.userData.base every frame — the Solar crash).
function buildCumulonimbusTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const M = tempestMats(def);
  const shoulderW = model.shoulderWidthScale ?? 1;

  // Lean cloud-mass: chest deepest at the wing-arm root (shoulder:waist ≈ 1.55), lean
  // waist, haunch swell 0.8× chest — the storm front's forward-high mass on a lean chassis.
  const body = [
    { z: -1.55, rx: 0.20 * shoulderW, ry: 0.24, cy: 0.20 },   // chest prow (proud into the wall)
    { z: -0.95, rx: 0.34 * shoulderW, ry: 0.40, cy: 0.15 },   // shoulder / wing-arm root (deepest)
    { z: -0.15, rx: 0.24, ry: 0.28, cy: 0.16 },
    { z: 0.55, rx: 0.19, ry: 0.22, cy: 0.15 },                // lean waist
    { z: 1.10, rx: 0.24, ry: 0.26, cy: 0.18 },                // haunch swell (0.8× chest)
    { z: 1.65, rx: 0.12, ry: 0.13, cy: 0.13 },                // tail root (counter-drop)
  ];
  group.add(tubeLoft(body, M.flank));
  // Neck rising INTO the wall (chest proud, head slightly low under the overhang).
  const neck = [
    { z: -1.50, rx: 0.18, ry: 0.20, cy: 0.20 },
    { z: -1.92, rx: 0.13, ry: 0.14, cy: 0.15 },
    { z: -2.30, rx: 0.09, ry: 0.10, cy: 0.07 },
  ];
  group.add(tubeLoft(neck, M.flank, false));
  // A rain-slate ventral keel line so the side profile carries banks (belly tier lighter).
  const keel = [];
  for (let i = 0; i < body.length - 1; i++) {
    const a = body[i], b = body[i + 1], w = 0.035;
    const ay = a.cy - a.ry, by = b.cy - b.ry;
    keel.push([[-w, ay, a.z], [w, by, b.z], [-w, by, b.z]], [[-w, ay, a.z], [w, ay, a.z], [w, by, b.z]]);
  }
  group.add(flatTriMesh(keel, M.belly));

  // Motif anchor — the STORM-HEART's dynamo centre (the real caged dynamo lands here in I1).
  // Fixed at the sternum where the wing-arm roots meet (never moves, never re-hues, §3).
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.set(0, TORSO_Y + 0.02, -0.72);
  group.add(motifAnchor);

  // Line-of-action (≥2 inflections: neck rises into the wall → chest proud → tail counter-drop → flick).
  const spinePoints = [
    new THREE.Vector3(0, 0.07, -2.30), new THREE.Vector3(0, 0.20, -1.5),
    new THREE.Vector3(0, 0.16, -0.1), new THREE.Vector3(0, 0.18, 1.1),
    new THREE.Vector3(0, 0.13, 1.65),
  ];
  const wro = model.wingRootOffset ?? {};
  const attach = {
    wingRoot: (side) => ({ x: (0.36 * shoulderW) * side, y: TORSO_Y + 0.32 + (wro.y ?? 0), z: -0.70 + (wro.z ?? 0) }),
    headBase: { x: 0, y: 0.02, z: -2.40 },
    tailAnchor: { y: 0.12, z: 1.62 },
    keelTopAt: (z) => TORSO_Y + 0.34 * Math.max(0, 1 - Math.abs(z + 0.5) / 2.4),
    halfWidthAt: (z) => 0.36 * Math.max(0.2, 1 - Math.abs(z + 0.3) / 3.0),
    bodyMidY: TORSO_Y, tailShift: 0,
    riderSocket: { x: 0, y: 0.62, z: -0.28 },
    motifAnchor,
  };
  // coreGlow MUST be null (not a colour) or the flight tick null-derefs
  // coreGlow.userData.base every frame — the documented Solar crash. The real caged
  // dynamo (transparent, on the parts.coreGlow hook) replaces this in I1.
  return { group, attach, spinePoints, spineMats: [], mats: { bodyMat: M.flank }, coreGlow: null };
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
