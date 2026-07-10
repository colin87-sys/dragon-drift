import * as THREE from 'three';
import { seg } from './modelDetail.js';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PHOENIX EVERFLAME — "she is not a thing that burns, she IS a flame that flies"
// (PHOENIX-EVERFLAME-BUILDSHEET.md). A BRIGHT fire-body phoenix — the exact
// INVERSION of the Molten Phoenix (dark crust, fire in the seams). Here FIRE IS
// THE BODY and dark lives only on the thin rims. Four self-registering parts:
//   everflameTorso · flareCascadeWings · blazeCrestHead · sparkRibbonTail
// Axis: head/forward −Z, tail/rear +Z, right +X, up +Y; torso baseline y≈0.2.
//
// THE FLARE SYSTEM ("light field, dark on the rims"): the value hierarchy is the
// OPPOSITE polarity to the caldera — the interior FIELD glows (F1 goldfire) and a
// thin GARNET rim (F4) crisps every silhouette edge. Fire reads by SHAPE + heat
// gradient (S-tapered tongues that COOL and FRAY, gaps between them), never by
// translucency. Every emissive is baked into an OPAQUE flat-shaded facet in a
// SATURATED bloom-safe hue so it blooms IN ITS OWN HUE under ACES + UnrealBloom
// (NEVER an additive washout shell). Heat = HUE STEPS across facets (F1 body →
// F2 mid → F3 tips), not a value ramp: core→extremity slides down the fire ramp.
// ═══════════════════════════════════════════════════════════════════════════════

const TORSO_Y = 0.2;

// THE FLARE HEAT-TIER LADDER (build sheet §1). Every material is exactly one tier.
// INVERTED from the caldera: the body FIELD is lit, the rim is dark. The
// `igniteStage` 0→3 dial ("the fire CATCHES") gates how lit each tier is AND slides
// the body FIELD hue up the ramp (f0 garnet fledgling → f1 F2 flame → f2/f3 F1
// goldfire). BRIGHT-FIRST: intensities pitched hot, rationed DOWN only where a real
// capture washes out (never inherited from the dark molten numbers).
//
//   VALUE-GAP LAW: the body-field ceiling (F1 ~0.6) sits a tier BELOW the accent
//   ceiling (keel-star / outer tips) so ACES + bloom keeps the 3 fire hues
//   SEPARABLE instead of flattening them into one orange smear.
function everflameMats(def, glow, stage) {
  const st = Math.max(0, Math.min(3, Math.round(stage ?? 3)));

  // Per-stage emissive-intensity ladders (the surge tick multiplies baseIntensity).
  const bodyI = [0.16, 0.34, 0.5, 0.6][st];      // F1 body FIELD — capped ~0.6 (Surge headroom)
  const keelI = [0.42, 0.64, 0.82, 0.98][st];    // the furnace-keel line (hotter than the field)
  const flameI = [0.24, 0.46, 0.72, 0.92][st];   // F2 mid-wing tongues / dorsal licks
  const crimI = [0.26, 0.5, 0.82, 1.05][st];     // F3 outer tongue tips / aft sparks (cool sheath, popped)
  const eyeI = [0.5, 0.95, 1.4, 2.0][st];        // F0 eyes
  const starI = [0, 0, 0, 1.7][st];              // F0 keel-star — Eternal-only

  // BODY FIELD hue slides up the ignition ramp: f0 dark garnet w/ a warm smolder
  // (a garnet fledgling, NOT a spent cinder), f1 F2 flame-orange, f2/f3 F1 goldfire.
  const fieldCol = [0x3a1a12, 0x6e2a0e, 0x7f4f14, def.body ?? 0x8a5c12][st];
  const fieldEmis = st === 0 ? 0x5e1c08 : (st === 1 ? 0xd9541a : (def.goldfire ?? 0xe69b1f));
  const bodyField = new THREE.MeshStandardMaterial({ color: fieldCol, emissive: fieldEmis, emissiveIntensity: bodyI, flatShading: true, roughness: 0.5, metalness: 0.05, side: THREE.DoubleSide });
  bodyField.userData.baseEmissive = fieldEmis; bodyField.userData.baseIntensity = bodyI;

  // THE FURNACE KEEL line — the hottest structural fire short of the keel-star.
  // f0 it is the ONE lit thing (F2 flame); f1+ it promotes to F1 goldfire.
  const keelEmis = st === 0 ? 0xd9541a : 0xffb347;
  const keel = new THREE.MeshStandardMaterial({ color: 0xffc36a, emissive: keelEmis, emissiveIntensity: keelI, flatShading: true, roughness: 0.4, metalness: 0.06 });
  keel.userData.baseEmissive = keelEmis; keel.userData.baseIntensity = keelI;

  // F1 GOLDFIRE — the body glow (wing flame-blanket, wing roots, crest roots). The
  // large hue FIELD. Distinct material from bodyField so the wing tracks a stable
  // goldfire even while the torso field ladders through garnet→flame→goldfire.
  const goldCol = def.goldfire ?? 0xe69b1f;
  const goldfire = new THREE.MeshStandardMaterial({ color: 0x8a5c12, emissive: goldCol, emissiveIntensity: Math.max(bodyI, 0.2 + st * 0.13), flatShading: true, roughness: 0.5, metalness: 0.05, side: THREE.DoubleSide });
  goldfire.userData.baseEmissive = goldCol; goldfire.userData.baseIntensity = goldfire.emissiveIntensity;

  // F2 FLAME — mid heat: mid-wing tongues, dorsal licks, fore ribbon-sparks.
  const flameCol = def.flame ?? 0xd9541a;
  const flame = new THREE.MeshStandardMaterial({ color: 0x6e2a0e, emissive: flameCol, emissiveIntensity: flameI, flatShading: true, roughness: 0.52, metalness: 0.05, side: THREE.DoubleSide });
  flame.userData.baseEmissive = flameCol; flame.userData.baseIntensity = flameI;

  // F3 CRIMSON — the cool sheath: outer tongues + tips, aft ribbon-sparks, the
  // shadow-side belly. A separable third hue that anchors the pale/gold-sky sil.
  const crimCol = def.crimson ?? 0xb32613;
  const crimson = new THREE.MeshStandardMaterial({ color: 0x571712, emissive: crimCol, emissiveIntensity: crimI, flatShading: true, roughness: 0.55, metalness: 0.04, side: THREE.DoubleSide });
  crimson.userData.baseEmissive = crimCol; crimson.userData.baseIntensity = crimI;

  // F4 GARNET — the dark RIM everywhere (facet boundaries, beak tip, talons, fray
  // tips). Matte, a whisper of deep-ember so it never reads dead-black on a dark
  // sky. NOT in spineMats — the dark rim must not flare on Surge.
  const garnet = new THREE.MeshStandardMaterial({ color: def.garnet ?? 0x421210, emissive: 0x1c0a06, emissiveIntensity: 0.12, flatShading: true, roughness: 0.86, metalness: 0.04, side: THREE.DoubleSide });

  // F0 WHITEGOLD — the ONE near-white register: the chest keel-star + the eyes ONLY.
  // Saturated-warm so it blooms warm, not paper. OUT of spineMats (surge-clip rule).
  const whitegold = new THREE.MeshStandardMaterial({ color: 0xffe9c4, emissive: 0xffe4b0, emissiveIntensity: starI, flatShading: true, roughness: 0.3, metalness: 0.05 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffe9c4, emissive: 0xffd98a, emissiveIntensity: eyeI, flatShading: true, roughness: 0.28 });
  eyeMat.userData.baseEmissive = 0xffd98a; eyeMat.userData.baseIntensity = eyeI;

  return { bodyField, keel, goldfire, flame, crimson, garnet, whitegold, eyeMat, stage: st };
}

// Faceted loft: rings [{z, rx, ry, cy, cx?}] → one flat-shaded tube. Winds OUTWARD
// so flat-shaded facets light from outside. Look-neutral container (shared plumbing).
function loftRings(rings, mat, N = 8, cap = true) {
  const P = (r, t) => [(r.cx ?? 0) + Math.cos(t) * r.rx, r.cy + Math.sin(t) * r.ry, r.z];
  const tris = [];
  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i], b = rings[i + 1];
    for (let j = 0; j < N; j++) {
      const t0 = (j / N) * Math.PI * 2, t1 = ((j + 1) / N) * Math.PI * 2;
      tris.push([P(a, t0), P(b, t1), P(b, t0)], [P(a, t0), P(a, t1), P(b, t1)]);
    }
  }
  if (cap) {
    const f = rings[0], l = rings[rings.length - 1];
    for (let j = 0; j < N; j++) {
      const t0 = (j / N) * Math.PI * 2, t1 = ((j + 1) / N) * Math.PI * 2;
      tris.push([[(f.cx ?? 0), f.cy, f.z], P(f, t1), P(f, t0)], [[(l.cx ?? 0), l.cy, l.z], P(l, t0), P(l, t1)]);
    }
  }
  return flatTriMesh(tris, mat);
}

// Tapered facet cone, base at origin growing +Y (talons, beak).
function spike(len, rBase, rTip, mat, facets = 5) {
  const g = new THREE.Mesh(new THREE.CylinderGeometry(rTip, rBase, len, seg(facets)), mat);
  g.geometry.translate(0, len / 2, 0);
  return g;
}

// ── A FLAME TONGUE — the atom of the cascade + the dorsal licks + the crest. An
// elongated S-tapered lick: narrow root (buried in the fill), swells to ~mid, tapers
// to a frayed point. A raised centre CREASE gives TWO VALUES by flat shading (a lit
// face + a shadowed crease flank). Hue-STEPS root→tip: F2 flame root → F3 crimson
// tip (cools outboard — the fire-not-plumage tell). Tip ends in `fray` tiny garnet
// shards. `base`/`dir`/`side` are PLAIN ARRAYS; internal math is Vector3, output is
// arrays (the plain-array NaN crash-class guard — never hand a Vector3 to flatTriMesh).
function flameTongue(base, dir, side, len, wid, lift, matRoot, matTip, rimMat, fray = 0) {
  const B = new THREE.Vector3(base[0], base[1], base[2]);
  const D = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
  const S0 = new THREE.Vector3(side[0], side[1], side[2]).normalize();
  const N = new THREE.Vector3().crossVectors(D, S0).normalize();
  const A = (v) => [v.x, v.y, v.z];
  const g = new THREE.Group();
  const ST = 3;                                  // 3 segments → ~12 tris + fray
  // S-taper width profile: ~0.6 at root, swell ~mid, taper to a point.
  const wAt = (u) => wid * Math.sin(Math.PI * (0.2 + 0.65 * u)) * (1 - 0.5 * u);
  const pt = (u, s) => B.clone().addScaledVector(D, len * u).addScaledVector(S0, s);
  const crest = (u) => B.clone().addScaledVector(D, len * u).addScaledVector(N, lift * Math.sin(Math.PI * u));
  const rootT = [], tipT = [], rimT = [];
  for (let i = 0; i < ST; i++) {
    const u0 = i / ST, u1 = (i + 1) / ST;
    const w0 = wAt(u0), w1 = wAt(u1);
    const l0 = pt(u0, -w0), r0 = pt(u0, w0), c0 = crest(u0);
    const l1 = pt(u1, -w1), r1 = pt(u1, w1), c1 = crest(u1);
    const bucket = (u0 + u1) / 2 < 0.5 ? rootT : tipT;
    bucket.push([A(l0), A(l1), A(c1)], [A(l0), A(c1), A(c0)]);   // left face
    bucket.push([A(c0), A(c1), A(r1)], [A(c0), A(r1), A(r0)]);   // right face
    // thin garnet RIM along the two outer edges (dark-on-the-rim relief).
    rimT.push([A(l0), A(pt(u0, -w0 * 1.14)), A(pt(u1, -w1 * 1.14))], [A(l0), A(pt(u1, -w1 * 1.14)), A(l1)]);
    rimT.push([A(r0), A(pt(u1, w1 * 1.14)), A(pt(u0, w0 * 1.14))], [A(r0), A(r1), A(pt(u1, w1 * 1.14))]);
  }
  g.add(flatTriMesh(rootT, matRoot));
  g.add(flatTriMesh(tipT, matTip));
  g.add(flatTriMesh(rimT, rimMat));
  // FRAY — 2–3 tiny garnet/crimson shards splitting off the cooling tip.
  for (let k = 0; k < fray; k++) {
    const u = 0.9, a = (k - (fray - 1) / 2) * 0.5;
    const tip = pt(1.0, 0).addScaledVector(S0, a * wid * 0.6);
    const shR = pt(u, a * wid * 0.4);
    const shC = crest(u).addScaledVector(S0, a * wid * 0.2);
    g.add(flatTriMesh([[A(shR), A(tip), A(shC)]], rimMat));
  }
  return g;
}

// ── TORSO: 'everflameTorso' ─────────────────────────────────────────────────────
// A COMPACT luminous keeled teardrop, LEVEL long axis, lofted from FEWER LARGER
// facets — an F1 goldfire FIELD (stage-laddered), a thin GARNET rim course crisping
// the belly seam, an F3 crimson shadow-side belly, THE FURNACE KEEL (throat→chest→
// belly-keel strip grading to an F0 keel-star cluster at the chest), and a row of
// dorsal flame LICKS (the "no dark back" rear-chase guarantee + the ignition-ramp
// hardware). Fire IS the body; the fuel and the flame are ONE surface.
function buildEverflameTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const M = everflameMats(def, model.glowLevel ?? 1, model.igniteStage);
  const spineMats = [M.bodyField, M.keel, M.flame, M.crimson, M.goldfire];   // flare on Surge
  const bodyScale = model.torsoScale ?? 1;

  // LUMINOUS BODY — a compact keeled teardrop in the stage-laddered goldfire field.
  const body = [
    { z: -1.24, rx: 0.26 * bodyScale, ry: 0.30, cy: 0.26 },   // chest prow
    { z: -0.88, rx: 0.46 * bodyScale, ry: 0.50, cy: 0.18 },   // breast (keel-star seat)
    { z: -0.42, rx: 0.52 * bodyScale, ry: 0.48, cy: 0.22 },   // shoulder yoke (wing roots, widest)
    { z: 0.10, rx: 0.42, ry: 0.40, cy: 0.24 },
    { z: 0.58, rx: 0.32, ry: 0.32, cy: 0.20 },                // haunch
    { z: 1.00, rx: 0.18, ry: 0.18, cy: 0.18 },                // rump
    { z: 1.30, rx: 0.08, ry: 0.08, cy: 0.18 },                // tail root
  ];
  group.add(loftRings(body, M.bodyField, seg(9)));

  // Proud up-forward neck (arcs UP to the head — a firebird's carriage).
  const neck = [
    { z: -1.18, rx: 0.24, ry: 0.28, cy: 0.30 },
    { z: -1.48, rx: 0.19, ry: 0.22, cy: 0.42 },
    { z: -1.78, rx: 0.14, ry: 0.16, cy: 0.52 },
  ];
  group.add(loftRings(neck, M.bodyField, seg(8), false));

  const halfWidthAt = (z) => 0.54 * bodyScale * Math.max(0.16, 1 - Math.abs(z + 0.35) / 2.5);
  const topAt = (z) => TORSO_Y + 0.46 * Math.max(0.12, 1 - Math.abs(z + 0.35) / 2.7);

  // Interpolate the loft rings → surface point + outward normal at (z, θ).
  const bodySurface = (z, th) => {
    let a = body[0], b = body[body.length - 1];
    for (let i = 0; i < body.length - 1; i++) if (z >= body[i].z && z <= body[i + 1].z) { a = body[i]; b = body[i + 1]; break; }
    const u = b.z === a.z ? 0 : (z - a.z) / (b.z - a.z);
    const rx = a.rx + (b.rx - a.rx) * u, ry = a.ry + (b.ry - a.ry) * u, cy = a.cy + (b.cy - a.cy) * u;
    return { p: [Math.cos(th) * rx, cy + Math.sin(th) * ry, z] };
  };

  // ── F3 CRIMSON shadow-side belly underplate (the ventral runs a tier cooler — a
  // separate structure that anchors the belly on a pale/gold sky, never dissolving).
  const bellyT = [];
  const bn = seg(8);
  for (let i = 0; i < bn - 1; i++) {
    const t0 = i / (bn - 1), t1 = (i + 1) / (bn - 1);
    const z0 = -0.85 + t0 * 1.95, z1 = -0.85 + t1 * 1.95;
    const w0 = halfWidthAt(z0) * 0.52, w1 = halfWidthAt(z1) * 0.52;
    const y0 = TORSO_Y - 0.24 * Math.max(0.2, 1 - Math.abs(z0 + 0.35) / 2.3);
    const y1 = TORSO_Y - 0.24 * Math.max(0.2, 1 - Math.abs(z1 + 0.35) / 2.3);
    bellyT.push([[-w0, y0, z0], [w0, y0, z0], [w1, y1, z1]], [[-w0, y0, z0], [w1, y1, z1], [-w1, y1, z1]]);
  }
  group.add(flatTriMesh(bellyT, M.crimson));

  // ── GARNET RIM course along the belly/flank seam (both sides) — the "dark on the
  // rims" that crisps the silhouette + gives the body its second value. Thin proud
  // strips tucked to the flank crease, dimming to nothing at the extremities.
  for (const s of [1, -1]) {
    const rimT = [];
    const rn = seg(7);
    for (let i = 0; i < rn - 1; i++) {
      const t0 = i / (rn - 1), t1 = (i + 1) / (rn - 1);
      const z0 = -0.9 + t0 * 2.0, z1 = -0.9 + t1 * 2.0;
      const a0 = bodySurface(z0, s > 0 ? -0.35 : Math.PI + 0.35).p;
      const a1 = bodySurface(z1, s > 0 ? -0.35 : Math.PI + 0.35).p;
      const b0 = [a0[0] * 1.04, a0[1] - 0.05, a0[2]], b1 = [a1[0] * 1.04, a1[1] - 0.05, a1[2]];
      rimT.push([a0, a1, b1], [a0, b1, b0]);
    }
    group.add(flatTriMesh(rimT, M.garnet));
  }

  // ── THE FURNACE KEEL — one continuous throat→chest→belly-keel STRIP of the keel
  // material (a LINE of heat inside the flame), grading to an F0 keel-star cluster at
  // the chest. Explicitly NOT a caldera pool behind crust — it reads as the white
  // TERMINUS of the keel strip. keelHeat ladders it (f0 a single thread of fire).
  const keelHeat = model.keelHeat ?? 1;
  const keelT = [];
  const kn = seg(8);
  const keelZ0 = -1.16, keelZ1 = 0.55;
  for (let i = 0; i < kn - 1; i++) {
    const t0 = i / (kn - 1), t1 = (i + 1) / (kn - 1);
    const z0 = keelZ0 + t0 * (keelZ1 - keelZ0), z1 = keelZ0 + t1 * (keelZ1 - keelZ0);
    // the keel rides the ventral centre-line, dipping deepest at the breast.
    const ky = (z) => TORSO_Y - 0.10 - 0.16 * Math.max(0, 1 - Math.abs(z + 0.9) / 0.9);
    const w0 = 0.09 * (1 - 0.4 * t0) * (0.5 + 0.5 * keelHeat), w1 = 0.09 * (1 - 0.4 * t1) * (0.5 + 0.5 * keelHeat);
    keelT.push([[-w0, ky(z0), z0], [w0, ky(z0), z0], [w1, ky(z1), z1]], [[-w0, ky(z0), z0], [w1, ky(z1), z1], [-w1, ky(z1), z1]]);
  }
  group.add(flatTriMesh(keelT, M.keel));

  // THE KEEL-STAR — an elongated F0 whitegold facet-cluster at the chest, the white
  // terminus of the keel line. Eternal-only (M.stage>=3) so no form wears it early.
  const kx = 0, ky0 = TORSO_Y - 0.16, kz0 = -0.9;
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.set(kx, ky0, kz0);
  group.add(motifAnchor);
  if (M.stage >= 3) {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), M.whitegold);
    star.position.set(kx, ky0, kz0);
    star.scale.set(0.7, 1.0, 1.7);   // ELONGATED along the keel line, never a round disk
    group.add(star);
  }

  // ── DORSAL LICKS — a row of small flame licks nape→hip, alternately canted L/R
  // toward the camera (the rear-chase "no dark back" guarantee + the visible
  // ignition-ramp hardware). Gated by lickCount so the ladder confers them.
  const lickCount = Math.round(model.lickCount ?? 5);
  for (let i = 0; i < lickCount; i++) {
    const t = i / Math.max(1, lickCount);
    const z = -0.85 + t * 1.85;
    const y = topAt(z);
    const cant = (i % 2 ? 1 : -1) * 0.5;
    const len = 0.30 * (1 - 0.3 * t) * (model.crestLen ?? 1);
    const matRoot = M.stage === 0 ? M.keel : M.flame;
    group.add(flameTongue([Math.sin(cant) * 0.06, y, z], [Math.sin(cant) * 0.5, 0.7, 0.5], [1, 0, 0], len, 0.09, 0.05, matRoot, M.crimson, M.garnet, 0));
  }

  // Shoulder fairings — goldfire fillets from each wing root inboard to the neck base
  // (no background survives between neck and wing roots in the rear-chase read).
  for (const s of [1, -1]) {
    group.add(flatTriMesh([[[s * 0.46, TORSO_Y + 0.30, -0.46], [s * 0.08, TORSO_Y + 0.32, -1.06], [s * 0.42, TORSO_Y + 0.14, -0.28]]], M.bodyField));
  }

  // Keel-fire core sprite (the powered glow the rig pulses on boost / Surge).
  let coreGlow = null;
  const lvl = 0.4 + M.stage * 0.2;
  coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlow('255,190,90'), transparent: true, opacity: 0.12 + lvl * 0.18,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  coreGlow.scale.setScalar(0.6 + lvl * 0.6);
  coreGlow.position.set(kx, ky0, kz0 - 0.05);
  coreGlow.layers.set(1);
  coreGlow.userData.base = coreGlow.material.opacity;
  group.add(coreGlow);

  // Line-of-action: head high → neck down → level body → tail settles.
  const spinePoints = [
    new THREE.Vector3(0, 0.54, -1.78), new THREE.Vector3(0, 0.38, -1.14),
    new THREE.Vector3(0, 0.24, -0.4), new THREE.Vector3(0, 0.24, 0.4),
    new THREE.Vector3(0, 0.16, 1.05), new THREE.Vector3(0, 0.22, 1.6),
  ];
  const attach = {
    wingRoot: (side) => ({ x: (0.48 * bodyScale) * side, y: TORSO_Y + 0.30, z: -0.42 }),
    headBase: { x: 0, y: 0.54, z: -1.86 },
    tailAnchor: { y: 0.20, z: 1.24 },
    keelTopAt: (z) => topAt(z),
    halfWidthAt,
    bodyMidY: TORSO_Y, tailShift: 0,
    riderSocket: { x: 0, y: 0.66, z: -0.2 },
    motifAnchor,
  };
  return { group, attach, spinePoints, spineMats, mats: { bodyMat: M.bodyField, eyeMat: M.eyeMat }, coreGlow };
}
registerTorso('everflameTorso', buildEverflameTorso);

// Tiny procedural radial-glow texture for the keel-core sprite (no asset files).
let _glowTex = {};
function makeGlow(rgb) {
  if (_glowTex[rgb]) return _glowTex[rgb];
  const c = (typeof document !== 'undefined' && document.createElement) ? document.createElement('canvas') : null;
  if (!c) { const t = new THREE.Texture(); _glowTex[rgb] = t; return t; }
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, `rgba(${rgb},1)`); grd.addColorStop(0.5, `rgba(${rgb},0.4)`); grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  _glowTex[rgb] = t; return t;
}

// ── WINGS: 'flareCascadeWings' (THE HERO) ────────────────────────────────────────
// A cascade of discrete flame TONGUES raked aft-and-up — the streaming fire of the
// references realized as the wing itself. Two regions:
//   • inboard 0→0.55 — the FLAME-BLANKET: a single lofted sheet of large fused
//     goldfire facet bands with a garnet rim (the confident MASS; the fuel and the
//     fire are ONE body; fills ≥55% of span). NOT a membrane with shingled ranks.
//   • outboard 0.55→1.0 — the CASCADE: 6–7 discrete flame tongues raked aft-up with
//     air gaps that widen outboard, hue-stepped F2→F3, tips frayed. Lengths grade
//     ~2.2:1 with the DOMINANT tongue at the INBOARD-TRAILING position (inverting
//     molten's terminal-pinion dominant — a structural differentiator).
// CONCAVE-CUPPED vertical profile: leading arm low + level to mid-span, then a late
// steep rise flattening as the tips stream back. Canonical +X, left = scale.x=-1.
// The vertical-profile formula is EXPORTED ONCE and shared by the geometry AND the
// FX marker / wingElements tip (the molten crash-class: change it in one place).

// SHARED EXPORTED PROFILE — the ONE source of truth for the cascade's vertical rise.
// t∈[0,1] along span; hs = half-span; rise = the cascadeRise ladder dial.
export function flareCascadeY(t, hs, rise = 1) {
  const c = Math.min(Math.max((t - 0.45) / 0.55, 0), 1);
  return hs * 0.30 * Math.pow(1 - Math.cos(Math.PI * c), 0.7) * rise;   // 0 (level arm) → ~hs·0.49 (streamed-back tips)
}
export function flareCascadeZ(t, hs) {
  return -0.08 + 0.48 * hs * Math.pow(t, 1.5);   // aft sweep accelerates outboard
}

function buildOneFlareWing(M, model) {
  const wg = new THREE.Group();
  const hs = 3.0 * (model.spanScale ?? 1);
  const rootChord = 1.4 * (model.chordScale ?? 1);
  const rise = model.cascadeRise ?? 1;
  const tongueCount = Math.round(model.tongueCount ?? 7);
  const gapWidth = model.gapWidth ?? 1;
  const fray = Math.round(model.frayEmbers ?? 1) > 0 ? 3 : 0;

  const L = (t) => [t * hs, flareCascadeY(t, hs, rise), flareCascadeZ(t, hs)];
  const chord = (t) => rootChord * (1 - 0.62 * Math.pow(t, 1.1));
  const camberY = (f) => -0.04 - 0.10 * Math.sin(f * Math.PI);   // shallow camber
  const BP = (t, f) => { const l = L(t), c = chord(t); return [l[0], l[1] + camberY(f) * c, l[2] + f * c]; };

  // ── THE FLAME-BLANKET — a FILLED cambered sheet root→t=0.55 in the stage-tracked
  // body FIELD (so the fuel and the fire are literally ONE body: dark garnet at the
  // fledgling, goldfire at the blaze). TWO large fused-tongue bands split by a garnet
  // seam, with a SCALLOPED trailing hem (3 fused-tongue lobes) + garnet rims on both
  // edges — so it reads as fused FLAME, never a smooth membrane kite.
  const bTs = [0, 0.14, 0.28, 0.42, 0.55];
  const fHem = (t) => 1.0 + 0.11 * Math.sin(t * Math.PI * 3);   // scalloped fused-tongue hem
  const BPh = (t, f) => BP(t, f * fHem(t));
  for (let i = 0; i < bTs.length - 1; i++) {
    const t0 = bTs[i], t1 = bTs[i + 1];
    // inner band 0→0.5 + outer band 0.5→scalloped-hem, both the body field.
    wg.add(flatTriMesh([[BP(t0, 0.0), BP(t1, 0.0), BP(t1, 0.5)], [BP(t0, 0.0), BP(t1, 0.5), BP(t0, 0.5)]], M.bodyField));
    wg.add(flatTriMesh([[BP(t0, 0.5), BP(t1, 0.5), BPh(t1, 1.0)], [BP(t0, 0.5), BPh(t1, 1.0), BPh(t0, 1.0)]], M.bodyField));
    // garnet SEAM between the two fused tongues (the second value dividing the mass).
    wg.add(flatTriMesh([[BP(t0, 0.47), BP(t1, 0.47), BP(t1, 0.53)], [BP(t0, 0.47), BP(t1, 0.53), BP(t0, 0.53)]], M.garnet));
    // garnet rim along the leading edge.
    wg.add(flatTriMesh([[BP(t0, -0.06), BP(t1, -0.06), BP(t1, 0.0)], [BP(t0, -0.06), BP(t1, 0.0), BP(t0, 0.0)]], M.garnet));
    // garnet rim tracing the SCALLOPED trailing hem.
    wg.add(flatTriMesh([[BPh(t0, 1.0), BPh(t1, 1.0), BPh(t1, 1.07)], [BPh(t0, 1.0), BPh(t1, 1.07), BPh(t0, 1.07)]], M.garnet));
  }

  // ── THE CASCADE — discrete flame tongues raked aft-and-up, gaps widening outboard.
  // Each tongue ROOTS INSIDE the blanket (root span clamped to the fill boundary) and
  // streams out, so none floats as a detached island in the black-fill silhouette.
  // Lengths grade ~2.2:1; the DOMINANT tongue sits at the INBOARD-TRAILING position.
  const nT = Math.min(tongueCount, 7);
  for (let i = 0; i < nT; i++) {
    const u = nT > 1 ? i / (nT - 1) : 0;                 // 0 inboard → 1 outboard
    const tRoot = 0.50 + u * 0.20;                        // roots buried in the fill (0.50–0.70)
    const rl = L(tRoot), rc = chord(tRoot);
    // scale hierarchy ~2.2:1, DOMINANT at inboard-trailing (i=0).
    const dom = i === 0 ? 1.0 : 0.55 + 0.30 * (1 - u);
    const len = (1.5 * dom) * (model.chordScale ?? 1);
    const wid = (i === 0 ? 0.40 : 0.30 - 0.02 * i) * (model.chordScale ?? 1);
    // rake: more aft + more up outboard; the tongues stream toward the empty upper corner.
    const dir = [0.22 + 0.30 * u, 0.35 + 0.45 * u, 1.0];
    // inboard-trailing streamer (i=0) pours off the TRAILING edge (seated deep in chord).
    const fSeat = i === 0 ? 0.85 : 0.45 + 0.2 * u;
    const base = [rl[0], rl[1] + camberY(fSeat) * rc, rl[2] + fSeat * rc + gapWidth * 0.06 * i];
    wg.add(flameTongue(base, dir, [1, 0, 0], len, wid, 0.06, M.flame, M.crimson, M.garnet, fray));
  }
  return wg;
}

function buildFlareCascadeWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const M = everflameMats(def, model.glowLevel ?? 1, model.igniteStage);
  const hs = 3.0 * (model.spanScale ?? 1);
  const rise = model.cascadeRise ?? 1;
  const pivots = {}, wingElements = [];
  for (const side of [1, -1]) {
    const root = attach.wingRoot(side);
    const pivot = new THREE.Group();
    pivot.position.set(root.x, root.y, root.z);
    pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);
    mid.add(buildOneFlareWing(M, model));   // canonical +X geometry
    if (side === -1) pivot.scale.x = -1;    // left = mirror → symmetric flap poses
    group.add(pivot);
    const s = side === 1 ? 'R' : 'L';
    // FX marker at the TRUE outer tip — via the SAME exported profile the geometry
    // uses (else the wingtip trails + aero-shear detach from the raked tip).
    const marker = new THREE.Object3D();
    const tipY = flareCascadeY(1, hs, rise), tipZ = flareCascadeZ(1, hs);
    marker.position.set(hs, tipY, tipZ);
    mid.add(marker);
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip;
    pivots['tipMarker' + s] = marker;
    wingElements.push({ root: [root.x, root.y, root.z], tip: [root.x + side * hs, root.y + tipY, root.z + tipZ], length: hs, tipObj: marker });
  }
  return { group, spineMats: [M.bodyField, M.goldfire, M.flame, M.crimson], wingMat: M.goldfire, parts: { ...pivots, wingElements } };
}
registerWings('flareCascadeWings', buildFlareCascadeWings);

// ── HEAD: 'blazeCrestHead' ───────────────────────────────────────────────────────
// A small compact wedge skull, LUMINOUS F1 goldfire (a direct inversion of molten's
// cool obsidian mask), one short GARNET matte beak tip as the single dark anchor,
// F0 whitegold eyes. Crest = backswept flame LICKS off the crown (F1→F2/F3) that
// continue the dorsal light line so the rear-chase view reads the head as the bright
// ORIGIN of the spine glow. The face is ~0% of the play view — the crest licks ARE
// the head's rear-chase job. Gated by crestLicks so the crown arrives up the ladder.
function buildBlazeCrestHead(def, model, _mats) {
  const group = new THREE.Group();
  const M = everflameMats(def, model.glowLevel ?? 1, model.igniteStage);
  const spineMats = [M.bodyField, M.flame, M.crimson];
  const hs = model.headScale ?? 1;

  // Luminous faceted wedge skull (points −Z) in the goldfire body field.
  const skull = [
    { z: 0.26, rx: 0.20 * hs, ry: 0.22 * hs, cy: 0.02 },   // occiput
    { z: -0.04, rx: 0.23 * hs, ry: 0.23 * hs, cy: 0.02 },  // brow (widest)
    { z: -0.30, rx: 0.16 * hs, ry: 0.15 * hs, cy: -0.03 }, // cheek
    { z: -0.52, rx: 0.10 * hs, ry: 0.09 * hs, cy: -0.06 }, // muzzle base
  ];
  group.add(loftRings(skull, M.bodyField, seg(7)));
  const headLength = 0.95 * hs;

  // Short GARNET beak tip — the single dark anchor (points −Z, hooks down).
  const beak = spike(0.24 * hs, 0.09 * hs, 0.008, M.garnet, 6);
  beak.rotation.x = Math.PI / 2 + 0.25;
  beak.position.set(0, -0.02 * hs, -0.52 * hs);
  group.add(beak);

  // F0 whitegold EYES — the brightest facial points, deep-set under the brow.
  const es = model.eyeScale ?? 1;
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.09 * hs * es, 0), M.eyeMat);
    eye.position.set(side * 0.17 * hs, 0.03 * hs, -0.22 * hs);
    eye.scale.set(1.4, 0.8, 1);
    group.add(eye);
  }

  // BACKSWEPT CREST LICKS off the crown (continue the dorsal light line). Held in
  // the SKY ZONE (rake up-and-back), compact — never crosses the view. crestLicks
  // gates them so the whelp is bare-crowned and the crown arrives up the ladder.
  const motifAnchor = new THREE.Object3D(); motifAnchor.position.set(0, 0.18 * hs, -0.02); group.add(motifAnchor);
  const crest = Math.round(model.crestLicks ?? 3);
  for (let i = 0; i < crest; i++) {
    const a = crest > 1 ? (i / (crest - 1) - 0.5) * 0.9 : 0;   // small fan across the crown
    const len = 0.34 * hs * (1 - 0.22 * Math.abs(a)) * (model.crestLen ?? 1);
    group.add(flameTongue([Math.sin(a) * 0.12 * hs, 0.16 * hs, 0.10], [Math.sin(a) * 0.6, 0.55, 0.75], [1, 0, 0], len, 0.07 * hs, 0.04, M.flame, M.crimson, M.garnet, 0));
  }

  return { group, spineMats, motifAnchor, headLength };
}
registerHead('blazeCrestHead', buildBlazeCrestHead);

// ── TAIL: 'sparkRibbonTail' ──────────────────────────────────────────────────────
// TWIN ribbons, splayed left/right to |x|≈0.7–0.9 and LIFTED to ride at/above spine
// height (the upper-outer frame — NEVER the lower-centre). Each ribbon = 8–12
// discrete OPAQUE emissive spark facets (diamonds, ≤0.08 body-lengths), spacing
// ≥1.5× spark length, hue fading F2→F3→garnet aft, slight alternating cant so faces
// catch the chase cam. SPARSE luminous points, never a sheet — at chase distance a
// trail of embers peeling off her. ribbonLen ladders it (withheld until f2).
function buildSparkRibbonTail(def, model, _mats, anchor) {
  const group = new THREE.Group();
  const M = everflameMats(def, model.glowLevel ?? 1, model.igniteStage);
  const a = anchor ?? { y: 0.20, z: 1.24 };
  const ribbonLen = model.ribbonLen ?? 1;
  const segs = [group];

  if (ribbonLen <= 0) return { group, segs, accentMats: [M.flame, M.crimson] };

  const nSpark = Math.round(6 + 6 * ribbonLen);   // 8–12 sparks per ribbon along the ladder
  const sparkR = 0.07;                            // ≤0.08 body-lengths
  const span = (2.0 * ribbonLen);                 // aft reach

  for (const side of [1, -1]) {
    for (let i = 0; i < nSpark; i++) {
      const t = i / (nSpark - 1);
      // LIFT immediately to spine height then ride at/above it; splay to |x|≈0.7–0.9.
      const x = side * (0.7 + 0.2 * t);
      const y = a.y + 0.02 + 0.34 * Math.sin(Math.min(t * 1.3, 1) * Math.PI * 0.5) + 0.10 * t;
      const z = a.z + t * span;
      // spacing ≥1.5× spark length is guaranteed by span/nSpark ≈ 0.2 ≫ 1.5·0.07.
      const mat = t < 0.35 ? M.flame : (t < 0.72 ? M.crimson : M.garnet);
      const sc = sparkR * (1 - 0.4 * t);
      const cant = (i % 2 ? 1 : -1) * 0.4;
      const d = new THREE.Mesh(new THREE.OctahedronGeometry(sc, 0), mat);
      d.position.set(x, y, z);
      d.scale.set(1.3, 0.7, 1.6);
      d.rotation.set(0, cant, cant * 0.5);
      group.add(d);
    }
  }
  return { group, segs, accentMats: [M.flame, M.crimson] };
}
registerTail('sparkRibbonTail', buildSparkRibbonTail);
