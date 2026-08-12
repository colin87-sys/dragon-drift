import * as THREE from 'three';
import { registerHead } from './dragonRecipe.js';

// DRACONIC HEAD — Dragon Drift's "house style" dragon head: a sleek, intelligent,
// catlike wedge skull (Night-Fury *inspired*, never a copy) assembled from a
// reusable MODULE BANK. The base for the game's TRUE dragons (Azure / Ember /
// Jade / Obsidian / Sovereign / Pearl) — NOT for Phoenix (beaked), the Astral
// Wyrm (celestialMask), or future manta / insect / avian / exotic-serpent species.
//
// HOW IT WORKS
//   parts: { head: 'draconic' } + a `headArchetype` (or explicit per-slot types)
//   on the dragon's `model`. The builder expands the archetype into a config, then
//   composes one module per slot (skull / snout / eyeZone / brow / jaw / horn /
//   rearCrest) + optional signature add-ons (whiskerFins, tuskJaw).
//
// SLEEK + CONTINUOUS. The skull → muzzle → blunt nose is ONE smooth wedge built
// from heavily-overlapping ellipsoids (length > width > height, like a real
// dragon head — not a long snake, not a ball). The jaw blends underneath; brow
// bulges sit over large forward eyes for the "intelligent" read.
//
// REAR-VIEW FIRST (the hard rule). The game is played from BEHIND, and tall mass
// over the head/aim point fails tools/readability.mjs. So every horn / ear-fin /
// crest sweeps BACK (+z) and stays low, or fans WIDE — identity lives in the rear
// SILHOUETTE (horn/ear/crest shape, head width, neck transition, rear glow).
//
// Contract: (def, model, { bodyMat, hornMat, bellyMat, scalesMat, eyeMat }) →
// { group, spineMats }. Eyes use the shared eyeMat (rig swaps its colour on
// Surge); glow accents set userData.baseEmissive/baseIntensity + ride spineMats so
// they flare on Surge. The aim marker is added by dragonModel — not here.

// ── shared helpers ──────────────────────────────────────────────────────────
function ellipsoid(mat, r, sx, sy, sz, x, y, z, seg = 10) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)), mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  return m;
}
function accentMat(color, intensity) {
  const m = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: intensity,
    roughness: 0.34, metalness: 0.45, side: THREE.DoubleSide,
  });
  m.userData.baseEmissive = color;
  m.userData.baseIntensity = intensity;
  return m;
}
// A back-raked horn/blade: a cone (points +y) raked toward +z (BACK) and splayed
// out, so it lengthens the rear silhouette without towering over the aim point.
function rakedHorn(mat, { baseR, len, x, y, z, rake, splay, segments = 6, flatZ = 1 }) {
  const horn = new THREE.Mesh(new THREE.ConeGeometry(baseR, len, segments), mat);
  if (flatZ !== 1) horn.scale.z = flatZ;
  horn.position.set(x, y, z);
  horn.rotation.x = rake;     // +rake → tip sweeps BACK (+z), low
  horn.rotation.z = splay;    // fan out to the side
  return horn;
}

// ── SKULL ─────────────────────────────────────────────────────────────────── // one clean rounded cranium (length > width > height); the cone muzzle continues it
const R = 0.62;               // base cranium radius (before headScale)
// Per-skull proportions [width, height, length scale] + brow bulge + cheek bevel.
const SKULL_DIMS = {
  roundWedgeSkull:    { csx: 0.98, csy: 0.86, csz: 1.04, brow: 1.0,  cheek: 0.0 },  // rounded, friendly, catlike
  nobleWedgeSkull:    { csx: 0.96, csy: 0.92, csz: 1.1,  brow: 1.3,  cheek: 0.18 }, // taller, armored cheeks, regal
  predatorWedgeSkull: { csx: 0.94, csy: 0.8,  csz: 1.14, brow: 0.85, cheek: 0.12 }, // flatter + longer, aggressive
};
function buildSkull(c) {
  const d = c.dim, m = c.mats.bodyMat;
  // ONE smooth rounded cranium — slightly elongated. Keeping the core to a few,
  // well-matched forms (cranium + cone muzzle + jaw) is what reads as a sleek
  // wedge instead of a lumpy ball-chain.
  c.head.add(ellipsoid(m, R, d.csx, d.csy, d.csz, 0, 0, R * 0.14, 14));
  c.faceZ = R * 0.14 - R * d.csz;            // front of the cranium (muzzle anchor)
  c.faceR = R * d.csx;                        // half-width there
  c.hx = R * d.csx; c.hy = R * d.csy; c.hz = R * d.csz;
  // Subtle brow ridge bulges over the eyes — the intelligent read (low + small).
  if (d.brow > 0) for (const s of [-1, 1]) {
    c.head.add(ellipsoid(m, R * 0.24 * d.brow, 1.0, 0.62, 1.15, s * c.faceR * 0.5, c.hy * 0.34, c.faceZ + c.faceR * 0.34, 8));
  }
  // Armored cheeks (noble/predator) — a touch of structure low on the jawline.
  if (d.cheek > 0) for (const s of [-1, 1]) {
    c.head.add(ellipsoid(m, R * 0.42, 0.7 + d.cheek, 0.78, 1.0, s * c.faceR * 0.78, -c.hy * 0.2, c.faceZ + c.faceR * 0.4, 8));
  }
}

// ── SNOUT ─────────────────────────────────────────────────────────────────── // a clean tapered CONE muzzle with a blunt rounded nose — the sleek read
function snoutBase(c, { len, baseW, noseW, drop }) {
  const m = c.mats.bodyMat;
  // A FRUSTUM muzzle (truncated cone): wide base blends into the cranium, tapering
  // to a BLUNT (non-zero) nose — the clean way to read a short blunt snout. Capped
  // with a small rounded nose pad. After rotation.x = -PI/2 the cone's wide end
  // (radiusBottom) faces +z (cranium) and the narrow end (radiusTop) faces -z.
  const baseR = c.faceR * baseW, noseR = c.faceR * noseW;
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(noseR, baseR, len, 16, 1), m);
  muzzle.rotation.x = -Math.PI / 2;
  muzzle.scale.set(1.0, 1.0, 0.82);            // flatten the vertical a touch (wider than tall)
  const baseZ = c.hz * 0.1;                     // base seats inside the cranium
  muzzle.position.set(0, -drop, baseZ - len * 0.5);
  c.head.add(muzzle);
  const noseZ = baseZ - len;
  c.head.add(ellipsoid(m, noseR, 1.04, 0.84, 0.86, 0, -drop, noseZ + noseR * 0.2, 8));
  for (const s of [-1, 1]) {
    const n = new THREE.Mesh(new THREE.SphereGeometry(noseR * 0.32, 6, 5), c.mats.hornMat);
    n.position.set(s * noseR * 0.42, -drop, noseZ);
    c.head.add(n);
  }
  c.snoutTipZ = noseZ - noseR * 0.5;
}
function shortBluntSnout(c)      { snoutBase(c, { len: 1.0 * c.cfg.snoutScale,  baseW: 0.82, noseW: 0.4,  drop: c.hy * 0.16 }); }
function mediumBluntSnout(c)     { snoutBase(c, { len: 1.28 * c.cfg.snoutScale, baseW: 0.76, noseW: 0.34, drop: c.hy * 0.18 }); }
function taperedPredatorSnout(c) { snoutBase(c, { len: 1.5 * c.cfg.snoutScale,  baseW: 0.68, noseW: 0.24, drop: c.hy * 0.2 }); }

// ── JAW ───────────────────────────────────────────────────────────────────── // a smooth lower jaw blended under the muzzle (never a box)
function jaw(c, { len, wid, drop, sharp }) {
  const m = c.mats.bellyMat;
  // Flattened lower jaw centred under the muzzle, ending just shy of the nose.
  const z = c.snoutTipZ * 0.46;
  c.head.add(ellipsoid(m, c.faceR * 0.8, wid, 0.44, len, 0, -c.hy * drop, z, 10));
  if (sharp) c.head.add(ellipsoid(m, c.faceR * 0.28, 0.8, 0.55, 1.2, 0, -c.hy * drop - 0.02, z - c.faceR * 0.8 * len * 0.7, 7));
}
function compactSmoothJaw(c)   { jaw(c, { len: 1.0,  wid: 0.82, drop: 0.36, sharp: false }); }
function angularPredatorJaw(c) { jaw(c, { len: 1.2,  wid: 0.64, drop: 0.34, sharp: true }); }
function refinedNobleJaw(c)    { jaw(c, { len: 1.06, wid: 0.78, drop: 0.38, sharp: false }); }

// ── EYE ZONE ──────────────────────────────────────────────────────────────── // large forward eyes set under the brow — the intelligent/expressive read
function eyeZone(c, { r, x, y, z, glow }) {
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), c.mats.eyeMat);
    eye.scale.set(0.92, 1.18, 0.82);
    eye.rotation.set(0.1, -s * 0.3, -s * 0.34);   // almond/feline tilt
    eye.position.set(s * x, y, z);
    c.head.add(eye);
    if (glow) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 1.12, r * 0.14, 5, 10, Math.PI * 1.1), c.glowMat);
      rim.position.set(s * x, y + r * 0.16, z + 0.02);
      rim.rotation.set(0.1, 0, -s * 0.34 + Math.PI * 0.85);
      c.head.add(rim);
    }
  }
}
function largeSoftEyeZone(c)   { eyeZone(c, { r: 0.16 * c.cfg.eyeScale,  x: c.hx * 0.6,  y: c.hy * 0.3,  z: c.faceZ + c.faceR * 0.16, glow: c.cfg.rearGlowIntensity > 0.4 }); }
function mediumAlertEyeZone(c) { eyeZone(c, { r: 0.125 * c.cfg.eyeScale, x: c.hx * 0.64, y: c.hy * 0.34, z: c.faceZ + c.faceR * 0.12, glow: false }); }
function narrowRegalEyeZone(c) { eyeZone(c, { r: 0.105 * c.cfg.eyeScale, x: c.hx * 0.62, y: c.hy * 0.36, z: c.faceZ + c.faceR * 0.12, glow: c.cfg.rearGlowIntensity > 0.4 }); }

// ── BROW ridge (expression) ──────────────────────────────────────────────────
function brow(c, { lift, length, angle }) {
  const i = c.cfg.browIntensity;
  for (const s of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.055 * (0.8 + i * 0.6), length, 5), c.mats.scalesMat);
    b.scale.z = 0.4;
    b.position.set(s * c.hx * 0.5, c.hy * (0.36 + lift * 0.12), c.faceZ + c.faceR * 0.55);
    b.rotation.x = 1.45;            // lie flat over the brow
    b.rotation.z = s * angle;       // angle = expression
    c.head.add(b);
  }
}
function softBrow(c)       { brow(c, { lift: 0.0,  length: 0.3,  angle: -0.28 }); }  // raised-outer = friendly
function alertBrow(c)      { brow(c, { lift: 0.2,  length: 0.36, angle: 0.4 }); }    // drawn-in = predatory
function commandingBrow(c) { brow(c, { lift: 0.34, length: 0.42, angle: 0.16 }); }   // heavy, level = authority

// ── HORN / EAR (all swept back + low) ─────────────────────────────────────────
// A broad flat EAR-FIN (the Night-drake signature): a flattened triangular blade
// that sweeps back-and-OUT off the back of the skull, low, with a glowing trailing
// edge. Sweeps BACK (not up) so it never towers over the aim point (§0.5).
function earFin(c, { baseR, len, x, y, z, rake, splay, glow }) {
  const fin = new THREE.Mesh(new THREE.ConeGeometry(baseR, len, 5), c.flapMat);
  fin.scale.set(1.25, 1, 0.16);            // broad + FLAT → an ear flap, not a spike
  fin.position.set(x, y, z);
  fin.rotation.x = rake;                   // rake BACK (tip → +z), low
  fin.rotation.z = splay;                  // splay OUT to the side
  c.head.add(fin);
  if (glow) {
    const edge = new THREE.Mesh(new THREE.ConeGeometry(baseR * 0.9, len * 1.06, 5), c.glowMat);
    edge.scale.set(1.25, 1, 0.1);
    edge.position.set(x * 1.04, y + 0.01, z + 0.02);
    edge.rotation.x = rake; edge.rotation.z = splay;
    c.head.add(edge);
  }
}
function smallSweptBackEarFins(c) {
  const hs = c.cfg.hornScale;
  for (const s of [-1, 1]) {
    earFin(c, { baseR: 0.2 * hs, len: 0.66 * hs, x: s * c.hx * 0.52, y: c.hy * 0.5, z: c.hz * 0.5, rake: 1.16, splay: s * 0.95, glow: true });
  }
}
function longSweptBackEarFins(c) {
  const hs = c.cfg.hornScale;
  for (const s of [-1, 1]) {
    earFin(c, { baseR: 0.22 * hs, len: 0.84 * hs, x: s * c.hx * 0.5, y: c.hy * 0.48, z: c.hz * 0.48, rake: 1.1, splay: s * 0.95, glow: true });
    earFin(c, { baseR: 0.12 * hs, len: 0.5 * hs, x: s * c.hx * 0.4, y: c.hy * 0.62, z: c.hz * 0.66, rake: 1.0, splay: s * 0.7, glow: false });
  }
}
function smoothDualHorns(c) {
  const hs = c.cfg.hornScale;
  for (const s of [-1, 1]) {
    c.head.add(rakedHorn(c.mats.hornMat, {
      baseR: 0.12 * hs, len: 0.76 * hs, x: s * c.hx * 0.46, y: c.hy * 0.54, z: c.hz * 0.42,
      rake: 0.95, splay: s * -0.26, flatZ: 0.72,
    }));
    const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.06 * hs, 0), c.glowMat);
    tip.position.set(s * c.hx * 0.34, c.hy * 0.62, c.hz * 0.92);
    c.head.add(tip);
  }
}
function bladeRearHorns(c) {
  const hs = c.cfg.hornScale;
  for (const s of [-1, 1]) c.head.add(rakedHorn(c.mats.hornMat, {
    baseR: 0.15 * hs, len: 0.88 * hs, x: s * c.hx * 0.5, y: c.hy * 0.46, z: c.hz * 0.46,
    rake: 1.04, splay: s * -0.4, segments: 4, flatZ: 0.26,
  }));
}
function regalCrownHorns(c) {
  // A crown that spreads WIDE to the sides (regal) rather than towering — the
  // readable way to crown a head from the rear camera.
  const hs = c.cfg.hornScale, n = 3;
  for (const s of [-1, 1]) {
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      c.head.add(rakedHorn(c.mats.hornMat, {
        baseR: 0.1 * hs, len: (0.84 - t * 0.16) * hs,
        x: s * c.hx * (0.32 + t * 0.5), y: c.hy * (0.5 - t * 0.1), z: c.hz * 0.42,
        rake: 0.95 + t * 0.1, splay: s * -(0.18 + t * 0.6), flatZ: 0.62,
      }));
    }
    const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.055 * hs, 0), c.glowMat);
    tip.position.set(s * c.hx * 0.36, c.hy * 0.66, c.hz * 0.86);
    c.head.add(tip);
  }
}

// ── REAR CREST (a back-of-head/nape glow into the neck — rear identity) ────────
function noRearCrest() {}
function rearCrest(c, { count, glow, height }) {
  // A LOW nape ridge — small, flat, back-raked finlets hugging the neck (never a
  // tall ladder), plus a soft glow band the rear camera catches.
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    const h = height * (1 - t * 0.4);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.05, h, 4), c.mats.scalesMat);
    fin.scale.set(1.4, 1, 0.4);                // a wide low blade, not a spike
    fin.position.set(0, c.hy * 0.38 - t * 0.04, c.hz * (0.78 + t * 0.42));
    fin.rotation.x = 1.46;                     // nearly flat along the nape
    c.head.add(fin);
  }
  if (glow) {
    const nape = new THREE.Mesh(new THREE.SphereGeometry(R * 0.3, 9, 6), c.glowMat);
    nape.scale.set(1.5, 0.34, 1.1);
    nape.position.set(0, c.hy * 0.3, c.hz * 0.96);
    c.head.add(nape);
  }
}
function smallRearCrest(c) { rearCrest(c, { count: 2, glow: c.cfg.rearGlowIntensity > 0.35, height: 0.2 }); }
function glowSpineCrest(c) { rearCrest(c, { count: 3, glow: true, height: 0.24 }); }
function crownRearCrest(c) { rearCrest(c, { count: 3, glow: c.cfg.rearGlowIntensity > 0.3, height: 0.28 }); }

// ── SIGNATURE ADD-ONS (preserve per-species identity) ────────────────────────
function whiskerFins(c) {                          // Jade — calm mystical
  for (const [sx, ang] of [[-0.5, 0.26], [0.5, -0.26], [-0.4, 0.48], [0.4, -0.48]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.004, 0.66, 4), c.mats.scalesMat);
    w.rotation.set(Math.PI / 2 + 0.12, 0, ang);
    w.position.set(sx * c.hx, -c.hy * 0.18, c.snoutTipZ + 0.1);
    c.head.add(w);
  }
}
function tuskJaw(c) {                               // Solar / Sovereign
  for (const s of [-1, 1]) {
    const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.36, 5), c.mats.hornMat);
    tusk.position.set(s * c.hx * 0.42, -c.hy * 0.42, c.faceZ - 0.1);
    tusk.rotation.x = -0.5; tusk.rotation.z = s * 0.18;
    c.head.add(tusk);
  }
}

// ── module registry + archetypes ─────────────────────────────────────────────
const SKULLS = { roundWedgeSkull: buildSkull, nobleWedgeSkull: buildSkull, predatorWedgeSkull: buildSkull };
const SNOUTS = { shortBluntSnout, mediumBluntSnout, taperedPredatorSnout };
const EYES   = { largeSoftEyeZone, mediumAlertEyeZone, narrowRegalEyeZone };
const BROWS  = { softBrow, alertBrow, commandingBrow };
const HORNS  = { smallSweptBackEarFins, longSweptBackEarFins, smoothDualHorns, bladeRearHorns, regalCrownHorns };
const JAWS   = { compactSmoothJaw, angularPredatorJaw, refinedNobleJaw };
const CRESTS = { noRearCrest, smallRearCrest, glowSpineCrest, crownRearCrest };

const ARCHETYPES = {
  softStealth:     { skullType: 'roundWedgeSkull',    snoutType: 'shortBluntSnout',      eyeZoneType: 'largeSoftEyeZone',   browType: 'softBrow',       hornType: 'smallSweptBackEarFins', jawType: 'compactSmoothJaw',   rearCrestType: 'smallRearCrest' },
  nobleCrowned:    { skullType: 'nobleWedgeSkull',    snoutType: 'mediumBluntSnout',     eyeZoneType: 'narrowRegalEyeZone', browType: 'commandingBrow', hornType: 'regalCrownHorns',       jawType: 'refinedNobleJaw',    rearCrestType: 'crownRearCrest' },
  elegantLuminous: { skullType: 'nobleWedgeSkull',    snoutType: 'mediumBluntSnout',     eyeZoneType: 'largeSoftEyeZone',   browType: 'softBrow',       hornType: 'smoothDualHorns',       jawType: 'refinedNobleJaw',    rearCrestType: 'glowSpineCrest' },
  feralPredator:   { skullType: 'predatorWedgeSkull', snoutType: 'taperedPredatorSnout', eyeZoneType: 'mediumAlertEyeZone', browType: 'alertBrow',      hornType: 'bladeRearHorns',        jawType: 'angularPredatorJaw', rearCrestType: 'smallRearCrest' },
  ancientArcane:   { skullType: 'nobleWedgeSkull',    snoutType: 'mediumBluntSnout',     eyeZoneType: 'narrowRegalEyeZone', browType: 'commandingBrow', hornType: 'smoothDualHorns',       jawType: 'refinedNobleJaw',    rearCrestType: 'glowSpineCrest' },
};

const DEFAULTS = {
  headScale: 1.0, snoutScale: 1, hornScale: 1, eyeScale: 1, browIntensity: 1,
  rearGlowIntensity: 0.5, whiskerFins: false, tuskJaw: false,
};
const OVERRIDE_KEYS = ['skullType', 'snoutType', 'eyeZoneType', 'browType', 'hornType', 'jawType', 'rearCrestType',
  'headScale', 'snoutScale', 'hornScale', 'eyeScale', 'browIntensity', 'rearGlowIntensity', 'whiskerFins', 'tuskJaw'];

function resolveConfig(model) {
  const arch = ARCHETYPES[model.headArchetype] || ARCHETYPES.softStealth;
  const cfg = { ...DEFAULTS, ...arch };
  for (const k of OVERRIDE_KEYS) if (model[k] !== undefined) cfg[k] = model[k];
  return cfg;
}

function buildDraconicHead(def, model, mats) {
  const cfg = resolveConfig(model);
  const outer = new THREE.Group();           // the rig rotates this
  const head = new THREE.Group();            // inner content, scaled per-species
  head.scale.setScalar(cfg.headScale);
  outer.add(head);
  const spineMats = [];

  const F = model.formLevel ?? 0;
  const giM = Math.min(model.glowIntensity ?? 1, 1.3);
  const cAccent = def.apexSeam ?? def.eye ?? def.wingEmissive;
  const glowMat = accentMat(cAccent, (0.5 + cfg.rearGlowIntensity * 1.6 + F * 0.25) * giM);
  spineMats.push(glowMat);

  // Double-sided clone of the body material for flat flaps (ear-fins) so they read
  // from both the showcase front and the rear gameplay camera.
  const flapMat = mats.bodyMat.clone();
  flapMat.side = THREE.DoubleSide;

  const dim = SKULL_DIMS[cfg.skullType] || SKULL_DIMS.roundWedgeSkull;
  const ctx = { head, def, model, cfg, mats, F, giM, glowMat, flapMat, dim };

  // Skull first — it publishes c.faceZ / c.faceR / c.hx-hy-hz that the rest align to.
  (SKULLS[cfg.skullType] || buildSkull)(ctx);
  (SNOUTS[cfg.snoutType] || shortBluntSnout)(ctx);
  (JAWS[cfg.jawType] || compactSmoothJaw)(ctx);
  (EYES[cfg.eyeZoneType] || largeSoftEyeZone)(ctx);
  (BROWS[cfg.browType] || softBrow)(ctx);
  (HORNS[cfg.hornType] || smallSweptBackEarFins)(ctx);
  (CRESTS[cfg.rearCrestType] || smallRearCrest)(ctx);
  if (cfg.whiskerFins) whiskerFins(ctx);
  if (cfg.tuskJaw) tuskJaw(ctx);

  return { group: outer, spineMats };
}

registerHead('draconic', buildDraconicHead);
