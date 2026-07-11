import * as THREE from 'three';
import { seg } from './modelDetail.js';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PHOENIX ASCENDANT — REFORGED ("The Ascending Sunhawk") — a MASSIVE glow-up of the
// shipped `phoenix` (PHOENIX-ASCENDANT-REFORGED-BUILDSHEET.md). Coexists as roster key
// `phoenixReforged`; the shipped `phoenix` def stays byte-identical. Fresh premium
// parts on the WHITE-GOLD SOLAR-IVORY system:
//   sunhawkKeelTorso · sunfeatherWings · sunpennantTail · sunhawkCrownHead
// Axis: head/forward −Z, tail/rear +Z, right +X, up +Y.
//
// THE FIX (owner critique): the old body was literally a SphereGeometry ball-chain in
// flat venetian-blind wings with a down-hanging fishbone tail. Here the body is a
// LOFTED KEELED firebird (a proud forward breast-prow, an arched S-neck, a sculpted
// haunch, a tapering tail-root) — an organic sculpt, not an ovoid. Richness comes from
// ORGANIZED RANKS + TWO-VALUE RELIEF (a bright ivory/gold VANE over an ember-shadow
// ROOT on every feather), not tri-count. This is a LIGHT body: the value-gap + a warm
// rose-gold rim carry the silhouette on a pale sky (never one ivory smear).
// ═══════════════════════════════════════════════════════════════════════════════

const TORSO_Y = 0.2;

// THE FIRE-LADDER (owner call: a phoenix OF FIRE — the whole creature burns). Hot-core /
// cool-rim, saturated bloom-safe hues (sat≥0.85, val≤0.9 → bloom IN-hue). `igniteStage` 0→3
// ("Reborn in fire") slides the body FIELD up the ramp (dark ember chick → glowing goldfire).
// The keys are kept stable so the SCULPT geometry (torso/head/collar) repaints to fire without
// touching those builders: `ivory` is now the glowing GOLDFIRE body field; `emberShadow`/
// `garnet` the dark facet rims (the everflame inversion: light field, dark on the rims).
function sunhawkMats(def, glow, stage) {
  const st = Math.max(0, Math.min(3, Math.round(stage ?? 3)));
  const g = glow ?? 1;
  const bodyI = [0.18, 0.36, 0.5, 0.62][st] * g;    // body-field glow, capped (Surge headroom)

  // T1 GOLDFIRE — the big glowing BODY FIELD (the whole creature burns). Form-laddered hue:
  // dark ember chick → warm goldfire. This is the `ivory` key so torso/head/collar glow fire.
  const fieldCol = def.body ?? 0x8a5514;
  const fieldEmis = st === 0 ? 0x6e1c06 : (def.goldfire ?? 0xe69b1f);
  const ivory = new THREE.MeshStandardMaterial({ color: fieldCol, emissive: fieldEmis, emissiveIntensity: bodyI, flatShading: true, roughness: 0.5, metalness: 0.04, side: THREE.DoubleSide });
  ivory.userData.baseEmissive = fieldEmis; ivory.userData.baseIntensity = bodyI;
  // GOLDFIRE (explicit hot-gold, for flame-feather HOT roots / shafts) — a touch hotter.
  const goldfire = new THREE.MeshStandardMaterial({ color: 0x9a5e12, emissive: def.goldfire ?? 0xe69b1f, emissiveIntensity: Math.max(bodyI, 0.28 + 0.12 * st) * g, flatShading: true, roughness: 0.46, metalness: 0.05, side: THREE.DoubleSide });
  goldfire.userData.baseEmissive = def.goldfire ?? 0xe69b1f; goldfire.userData.baseIntensity = goldfire.emissiveIntensity;

  // T2 FLAME — mid heat (mid-wing flame-feathers, dorsal licks, warm underwing).
  const flameCol = def.flame ?? 0xd9541a;
  const flame = new THREE.MeshStandardMaterial({ color: 0x6e2a0e, emissive: flameCol, emissiveIntensity: [0.28, 0.5, 0.78, 0.98][st] * g, flatShading: true, roughness: 0.52, metalness: 0.04, side: THREE.DoubleSide });
  flame.userData.baseEmissive = flameCol; flame.userData.baseIntensity = flame.emissiveIntensity;

  // T3 CRIMSON — the cool SHEATH (outer flame-feather tips, aft ribbon tips). The separable
  // third hue that keeps the fire from blooming to one orange smear + anchors a pale sky.
  const crimCol = def.crimson ?? 0xb32613;
  const crimson = new THREE.MeshStandardMaterial({ color: 0x571712, emissive: crimCol, emissiveIntensity: [0.3, 0.55, 0.86, 1.08][st] * g, flatShading: true, roughness: 0.55, metalness: 0.04, side: THREE.DoubleSide });
  crimson.userData.baseEmissive = crimCol; crimson.userData.baseIntensity = crimson.emissiveIntensity;

  // T4 GARNET / EMBER-SHADOW — the dark RIM on every facet edge (the "dark on the rims" that
  // crisps a bright fire body) + belly/seam relief. A whisper of ember so it never dead-blacks.
  const garnet = new THREE.MeshStandardMaterial({ color: def.belly ?? 0x3a1208, emissive: 0x1a0804, emissiveIntensity: 0.1, flatShading: true, roughness: 0.84, metalness: 0.05, side: THREE.DoubleSide });
  const emberShadow = garnet;

  // DARK WARM UNDERWING (`bronze` key) — the wing belly backing + feather roots. Kept a
  // RECESSIVE dark warm ember (not a glowing red plank) so it never competes with the fire-
  // feathers on top; warm + a small emissive floor so a shadowed facet reads warm, not black.
  const bronze = new THREE.MeshStandardMaterial({ color: 0x4a2110, emissive: 0x3a1606, emissiveIntensity: 0.14, flatShading: true, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });
  bronze.userData.baseEmissive = 0x3a1606; bronze.userData.baseIntensity = bronze.emissiveIntensity;

  // T2 GOLD — the forged REGALIA metal (beak, wing spar-arm, crown + collar shafts, vertebral
  // ridge). The one non-fire register: gilt metal reading against the flame.
  const goldCol = def.horn ?? 0xf4c860;
  const gold = new THREE.MeshStandardMaterial({ color: goldCol, emissive: 0x7a4a10, emissiveIntensity: 0.2 + 0.14 * st, flatShading: true, roughness: 0.34, metalness: 0.55, side: THREE.DoubleSide });
  gold.userData.baseEmissive = 0x7a4a10; gold.userData.baseIntensity = gold.emissiveIntensity;

  // T3 ROSE-GOLD / AMBER rim (feather edges, hems). Warm, soft — the graceful edge light.
  const roseCol = def.featherEdge ?? 0xff9a5a;
  const roseGold = new THREE.MeshStandardMaterial({ color: roseCol, emissive: 0xff9a4a, emissiveIntensity: 0.14 + 0.12 * st, flatShading: true, roughness: 0.44, metalness: 0.12, side: THREE.DoubleSide });
  roseGold.userData.baseEmissive = 0xff9a4a; roseGold.userData.baseIntensity = roseGold.emissiveIntensity;

  // SATURATED ORANGE emissive — the hottest flame-tip hue (flame-feather points, hems).
  const orangeCol = def.wingEmissive ?? 0xff7a1a;
  const orange = new THREE.MeshStandardMaterial({ color: 0x4a1c06, emissive: orangeCol, emissiveIntensity: (0.6 + 0.5 * st) * g, flatShading: true, roughness: 0.5, metalness: 0.04, side: THREE.DoubleSide });
  orange.userData.baseEmissive = orangeCol; orange.userData.baseIntensity = orange.emissiveIntensity;

  // T0 WHITE-HOT — the heart core (the ≤1 near-white register). OUT of spineMats.
  const heartEmis = [orangeCol, 0xffb060, 0xffd89a, 0xffffff][st];
  const heartI = [0.6, 1.6, 2.6, 3.6][st] * g;
  const heart = new THREE.MeshStandardMaterial({ color: 0xffe8c0, emissive: heartEmis, emissiveIntensity: heartI, flatShading: true, roughness: 0.3, metalness: 0.05 });

  // Eyes — white-hot gold, the brightest facial points.
  const eyeCol = def.eye ?? 0xffd07a;
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xfff2c8, emissive: eyeCol, emissiveIntensity: (1.1 + 0.3 * st) * g, flatShading: true, roughness: 0.28 });
  eyeMat.userData.baseEmissive = eyeCol; eyeMat.userData.baseIntensity = eyeMat.emissiveIntensity;

  return { ivory, goldfire, flame, crimson, garnet, emberShadow, bronze, gold, roseGold, orange, heart, eyeMat, stage: st, glow: g };
}

// Faceted loft: rings [{z, rx, ry, cy, cx?}] → one flat-shaded tube. Winds OUTWARD so
// flat-shaded facets light from outside (shared look-neutral plumbing).
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

// Tapered facet cone, base at origin growing +Y (beak, talons, crest quills).
function spike(len, rBase, rTip, mat, facets = 5) {
  const g = new THREE.Mesh(new THREE.CylinderGeometry(rTip, rBase, len, seg(facets)), mat);
  g.geometry.translate(0, len / 2, 0);
  return g;
}

// ── A KITE FEATHER — the atom of the covert/secondary ranks + the breast shingle + the
// crown fan. A creased kite: base → tip along `dir`, `wid` across `side`, a raised centre
// CREASE giving TWO VALUES (a lit vane facet + a shadowed crease flank). Base half is the
// bright VANE mat; the short root wedge is the T4 ember-shadow (rank relief by shadow, not
// light). Plain-array in, Vector3 math, array out (the NaN crash-class guard).
function kiteFeather(base, dir, side, len, wid, lift, vaneMat, rootMat, rimMat = null) {
  const B = new THREE.Vector3(base[0], base[1], base[2]);
  const D = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
  const S = new THREE.Vector3(side[0], side[1], side[2]).normalize();
  const Nn = new THREE.Vector3().crossVectors(D, S).normalize();
  const A = (v) => [v.x, v.y, v.z];
  const tip = B.clone().addScaledVector(D, len);
  const shL = B.clone().addScaledVector(D, len * 0.30).addScaledVector(S, -wid / 2);
  const shR = B.clone().addScaledVector(D, len * 0.30).addScaledVector(S, wid / 2);
  const crease = B.clone().addScaledVector(D, len * 0.55).addScaledVector(Nn, lift);
  const g = new THREE.Group();
  // root wedge = ember-shadow (the dark rank seam the next feather overlaps onto)
  g.add(flatTriMesh([[A(B), A(shL), A(shR)]], rootMat));
  // bright vane (two facets split by the crease ridge)
  g.add(flatTriMesh([[A(shL), A(tip), A(crease)], [A(crease), A(tip), A(shR)]], vaneMat));
  if (rimMat) {   // thin rose-gold rim along the two leading edges (silhouette crisp)
    g.add(flatTriMesh([[A(shL), A(tip), A(B.clone().addScaledVector(D, len * 0.30).addScaledVector(S, -wid * 0.62))]], rimMat));
    g.add(flatTriMesh([[A(shR), A(B.clone().addScaledVector(D, len * 0.30).addScaledVector(S, wid * 0.62)), A(tip)]], rimMat));
  }
  return g;
}

// ── A FLAME FEATHER — the streaming FIRE atom (the wing fire-fringe + the fire-trail tail).
// A CURVED, S-tapered ribbon (not a hard kite): narrow root → a modest belly at ~30% → a fine
// point, one centre CREASE for two-facet relief, the centreline BOWS by `curve` (a wind-blown
// lick) with an optional graceful terminal `curl` (aft-up only). `matRamp` = [root,mid,tip]
// materials assigned per segment → the ribbon HUE-RAMPS root-hot → tip-cool (goldfire→flame→
// crimson) — THIS is what makes it read as fire. Returns { group, tip } (tip for an FX marker).
function flameFeather(base, dir, side, len, wid, curve, matRamp, curl = 0) {
  const B = new THREE.Vector3(base[0], base[1], base[2]);
  const D = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
  const S = new THREE.Vector3(side[0], side[1], side[2]).normalize();
  const Nn = new THREE.Vector3().crossVectors(D, S).normalize();
  const A = (v) => [v.x, v.y, v.z];
  const SEG = 4;
  const g = new THREE.Group();
  // width: narrow (not zero) root → belly ~30% → fine point (a graceful flame line)
  const wAt = (u) => wid * (0.30 + 0.70 * Math.sin(Math.PI * Math.min(u * 1.15, 1))) * Math.pow(1 - u, 0.5);
  // centreline: straight run + a gentle S bow along the normal + a terminal curl (aft-up)
  const ctr = (u) => {
    const bow = Math.sin(Math.PI * u) * curve;
    const cu = u > 0.65 ? curl * Math.pow((u - 0.65) / 0.35, 1.4) : 0;
    return B.clone().addScaledVector(D, len * u).addScaledVector(Nn, bow + cu);
  };
  const mat = (u) => matRamp[Math.min(matRamp.length - 1, Math.floor(u * matRamp.length))];
  for (let i = 0; i < SEG; i++) {
    const u0 = i / SEG, u1 = (i + 1) / SEG, um = (u0 + u1) / 2;
    const c0 = ctr(u0), c1 = ctr(u1);
    const w0 = wAt(u0), w1 = wAt(u1);
    const l0 = c0.clone().addScaledVector(S, -w0 / 2), r0 = c0.clone().addScaledVector(S, w0 / 2);
    const l1 = c1.clone().addScaledVector(S, -w1 / 2), r1 = c1.clone().addScaledVector(S, w1 / 2);
    const cr0 = c0.clone().addScaledVector(Nn, 0.03 * wid), cr1 = c1.clone().addScaledVector(Nn, 0.03 * wid);
    g.add(flatTriMesh([[A(l0), A(l1), A(cr1)], [A(l0), A(cr1), A(cr0)], [A(cr0), A(cr1), A(r1)], [A(cr0), A(r1), A(r0)]], mat(um)));
  }
  return { group: g, tip: A(ctr(1)) };
}

// ── TORSO: 'sunhawk' → 'sunhawkKeelTorso' ────────────────────────────────────────
// THE #1 FIX. A lofted, keeled, characterful firebird — NOT a sphere-chain. Forward-
// anchored: the proud breast is the visual prow. ~8 sculpted stations (§2 table),
// dialled by keelDepth + neckArch so the ladder grows the sculpt (not scale).
function buildSunhawkKeelTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const M = sunhawkMats(def, model.glowLevel ?? 1, model.igniteStage);
  const spineMats = [M.gold, M.roseGold, M.orange];
  const bodyScale = model.torsoScale ?? 1;
  const keelDepth = model.keelDepth ?? 1;   // breast-prow projection (0.7→1.0)
  const neckArch = model.neckArch ?? 1;     // proud hawk neck rise (0.3→1.0)

  // §2 station table (CP1-rework). The KEEL is now DEEPEST at the FRONT third (S1–S2)
  // and rises monotonically aft → a proud forward breast-prow that projects DOWN + AHEAD
  // of the wing root, breaking the flat fuselage underline the critic flagged. The prow
  // depth scales with keelDepth `p` (the ladder grows the sculpt, not scale).
  const p = keelDepth;   // 0.7 → 1.0
  const body = [
    { z: -1.55, rx: 0.20 * bodyScale, ry: 0.22, cy: 0.62 },                                // S0 throat            (bot 0.40)
    { z: -1.10, rx: 0.36 * bodyScale, ry: 0.38 + 0.12 * p, cy: 0.48 - 0.16 * p },           // S1 fore-breast       (prow begins, down+fwd)
    { z: -0.62, rx: 0.46 * bodyScale, ry: 0.42 + 0.14 * p, cy: 0.42 - 0.14 * p },           // S2 proud keel        (deepest+widest prow)
    { z: -0.15, rx: 0.46 * bodyScale, ry: 0.46, cy: 0.44 },                                 // S3 shoulder yoke     (wing roots)
    { z: 0.35, rx: 0.40 * bodyScale, ry: 0.38, cy: 0.48 },                                  // S4 mid-back
    { z: 0.85, rx: 0.36 * bodyScale, ry: 0.36, cy: 0.46 },                                  // S5 haunch swell
    { z: 1.30, rx: 0.23 * bodyScale, ry: 0.25, cy: 0.46 },                                  // S6 croup
    { z: 1.70, rx: 0.12 * bodyScale, ry: 0.14, cy: 0.46 },                                  // S7 tail-root
  ];
  group.add(loftRings(body, M.ivory, seg(9)));

  // Arched S-NECK — lofted ring segments (NOT spheres) in a proud hawk arc, FRONT-LOADED
  // (most of the rise near the shoulders) so the head sits well ABOVE the dorsal line, not
  // a straight diagonal. neckArch dials the rise: a stub at the whelp, a proud arc at apex.
  const nr = neckArch;   // 0.3 → 1.0
  const neck = [
    { z: -1.55, rx: 0.20 * bodyScale, ry: 0.22, cy: 0.62 },
    { z: -1.82, rx: 0.17 * bodyScale, ry: 0.19, cy: 0.62 + 0.30 * nr },
    { z: -2.05, rx: 0.14 * bodyScale, ry: 0.16, cy: 0.62 + 0.50 * nr },
    { z: -2.20, rx: 0.11 * bodyScale, ry: 0.13, cy: 0.62 + 0.62 * nr },
  ];
  group.add(loftRings(neck, M.ivory, seg(8), false));
  // slim gold vertebral ridge along the neck crown (T2 regalia line)
  const vridge = [];
  for (let i = 0; i < neck.length - 1; i++) {
    const a = neck[i], b = neck[i + 1];
    vridge.push([[-0.02, a.cy + a.ry, a.z], [0.02, a.cy + a.ry, a.z], [0.02, b.cy + b.ry, b.z]],
      [[-0.02, a.cy + a.ry, a.z], [0.02, b.cy + b.ry, b.z], [-0.02, b.cy + b.ry, b.z]]);
  }
  group.add(flatTriMesh(vridge, M.gold));

  // Half-width / keel-top helpers (wing fairing, shingle placement, asserts).
  const halfWidthAt = (z) => {
    let a = body[0], b = body[body.length - 1];
    for (let i = 0; i < body.length - 1; i++) if (z >= body[i].z && z <= body[i + 1].z) { a = body[i]; b = body[i + 1]; break; }
    const u = b.z === a.z ? 0 : (z - a.z) / (b.z - a.z);
    return (a.rx + (b.rx - a.rx) * u);
  };
  const topAt = (z) => {
    let a = body[0], b = body[body.length - 1];
    for (let i = 0; i < body.length - 1; i++) if (z >= body[i].z && z <= body[i + 1].z) { a = body[i]; b = body[i + 1]; break; }
    const u = b.z === a.z ? 0 : (z - a.z) / (b.z - a.z);
    return (a.cy + (b.cy - a.cy) * u) + (a.ry + (b.ry - a.ry) * u);
  };
  const botAt = (z) => {
    let a = body[0], b = body[body.length - 1];
    for (let i = 0; i < body.length - 1; i++) if (z >= body[i].z && z <= body[i + 1].z) { a = body[i]; b = body[i + 1]; break; }
    const u = b.z === a.z ? 0 : (z - a.z) / (b.z - a.z);
    return (a.cy + (b.cy - a.cy) * u) - (a.ry + (b.ry - a.ry) * u);
  };

  // ── THE BREAST-SHIELD — one bold sculpted ventral facet-run along the keel underline
  // (S1→S3), a T1 ivory vane with a T4 ember-shadow seam down its centre → the prow reads
  // as a defined breast, not a smooth ovoid. (The confident MASS, not fussy detail.)
  const shieldT = [], seamT = [];
  const sZ = [-1.15, -0.85, -0.55, -0.25, 0.05];
  for (let i = 0; i < sZ.length - 1; i++) {
    const z0 = sZ[i], z1 = sZ[i + 1];
    const w0 = halfWidthAt(z0) * 0.62, w1 = halfWidthAt(z1) * 0.62;
    const y0 = botAt(z0) + 0.02, y1 = botAt(z1) + 0.02;
    shieldT.push([[-w0, y0, z0], [w0, y0, z0], [w1, y1, z1]], [[-w0, y0, z0], [w1, y1, z1], [-w1, y1, z1]]);
    seamT.push([[-0.03, y0 + 0.01, z0], [0.03, y0 + 0.01, z0], [0.03, y1 + 0.01, z1]], [[-0.03, y0 + 0.01, z0], [0.03, y1 + 0.01, z1], [-0.03, y1 + 0.01, z1]]);
  }
  group.add(flatTriMesh(shieldT, M.ivory));
  group.add(flatTriMesh(seamT, M.emberShadow));

  // ── EMBER-SHADOW BELLY UNDERPLATE — a T4 dark ventral field the whole length of the
  // underbody, so the mass reads with the two-value law (a bright ivory back over a dark
  // ember belly) instead of one flat mid-tone, and the pale-sky silhouette is anchored.
  const bellyT = [];
  const bn = seg(8);
  for (let i = 0; i < bn - 1; i++) {
    const t0 = i / (bn - 1), t1 = (i + 1) / (bn - 1);
    const z0 = -0.55 + t0 * 1.85, z1 = -0.55 + t1 * 1.85;
    const w0 = halfWidthAt(z0) * 0.66, w1 = halfWidthAt(z1) * 0.66;
    const y0 = botAt(z0) + 0.03, y1 = botAt(z1) + 0.03;
    bellyT.push([[-w0, y0, z0], [w0, y0, z0], [w1, y1, z1]], [[-w0, y0, z0], [w1, y1, z1], [-w1, y1, z1]]);
  }
  group.add(flatTriMesh(bellyT, M.emberShadow));

  // ── BREAST + FLANK SHINGLE RANKS — organized rows of ivory kite-feathers (bright vane /
  // ember-shadow root) over the throat, keel AND the upper flanks, so the mass reads
  // CRAFTED from the side + rear-¾ (the richness the critic found blank), each feather
  // laid head→tail so it overlaps the next like real plumage.
  for (const s of [1, -1]) {
    // breast rows (3 rows down the keel front)
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 4; i++) {
        const z = -1.28 + i * 0.30 + row * 0.10;
        const w = halfWidthAt(z) * (0.42 + row * 0.26);
        const y = botAt(z) + 0.09 + row * 0.13;
        group.add(kiteFeather([s * w, y, z], [s * 0.28, -0.12, -1], [s * 1, 0, 0.2], 0.28, 0.16, 0.04, M.ivory, M.emberShadow));
      }
    }
    // upper-flank rank (a row along the side so the flank is not a blank slab)
    for (let i = 0; i < 4; i++) {
      const z = -0.85 + i * 0.42;
      const w = halfWidthAt(z) * 0.94;
      const y = (botAt(z) + topAt(z)) * 0.5 - 0.02;
      group.add(kiteFeather([s * w, y, z], [s * 0.2, -0.05, 1], [s * 0.2, 0.4, 0], 0.30, 0.17, 0.05, M.ivory, M.emberShadow, M.roseGold));
    }
  }

  // ── THE HEART-FIRE core (signature, kept) — a bright emissive facet-cluster in the keel,
  // read through a small ivory caldera rim on the breast. coreScale ladders it.
  const coreScale = model.coreScale ?? 1;
  const hx = 0, hy = 0.40, hz = -0.62;
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.set(hx, hy, hz);
  group.add(motifAnchor);
  if (coreScale > 0) {
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.14 * coreScale, 0), M.heart);
    core.position.set(hx, hy, hz);
    core.scale.set(1, 1.15, 0.85);
    group.add(core);
    // ivory caldera rim around the core (a clean facet ring, no crust)
    const rimT = [], N = seg(9), R = 0.20 * coreScale;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
      const p = (a, r) => [hx + Math.cos(a) * r, hy + Math.sin(a) * r * 1.05, hz + 0.02];
      rimT.push([p(a0, R * 0.7), p(a0, R), p(a1, R)], [p(a0, R * 0.7), p(a1, R), p(a1, R * 0.7)]);
    }
    group.add(flatTriMesh(rimT, M.ivory));
  }

  // Keel-fire back-glow sprite (the powered glow the rig pulses on boost / Rebirth Surge).
  let coreGlow = null;
  const lvl = 0.4 + M.stage * 0.2;
  coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlow('255,190,110'), transparent: true, opacity: 0.16 + lvl * 0.26,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  coreGlow.scale.setScalar(0.8 + lvl * 0.8);
  coreGlow.position.set(hx, hy, hz - 0.05);
  coreGlow.layers.set(1);
  coreGlow.userData.base = coreGlow.material.opacity;
  group.add(coreGlow);

  // Shoulder fairings — ivory fillets from each wing root inboard to the neck base.
  for (const s of [1, -1]) {
    group.add(flatTriMesh([[[s * 0.44, 0.56, -0.18], [s * 0.10, 0.60, -1.05], [s * 0.40, 0.40, -0.02]]], M.ivory));
  }

  // ── THE SUN-GORGET COLLAR (the withheld coronation REGALIA, §6) — a radial fanned ruff of
  // stiff flame-feathers around the nape, raking up-out-and-back → a SUNBURST behind the head
  // that reads as the bright ORIGIN of the spine glow in the rear-chase. Gold vane / ember-
  // shadow root / rose-gold rim. `collarFan` BLOOMS it rung by rung (0 = bare nape at the
  // whelp → a full blazing gorget at Rebirth) — this is the "Reborn in fire" coronation beat.
  const collarFan = model.collarFan ?? 1;
  if (collarFan > 0) {
    const nC = Math.round(4 + 6 * collarFan);       // 4 → 10 broad feathers as it blooms
    const cz = -1.28, cyN = 0.58;                    // seated at the nape / neck base
    for (let k = 0; k < nC; k++) {
      const th = (nC > 1 ? (k / (nC - 1)) - 0.5 : 0) * 2.7;   // fan across the upper hemisphere (~±77°)
      const sx = Math.sin(th), cyv = Math.cos(th);
      // BROAD overlapping feathers raked strongly BACK (a laid-back ruff surface, not radial
      // porcupine spikes): more +z than radial, wide vanes that shingle into a fan.
      const dir = [sx * 0.66, cyv * 0.62 + 0.14, 0.66];
      const side = [cyv, -sx, 0];                             // tangential (feathers shingle around the arc)
      const len = (0.40 + 0.26 * collarFan) * (0.78 + 0.22 * cyv);
      const base = [sx * 0.13, cyN + cyv * 0.05, cz];
      const vane = k % 3 === 0 ? M.ivory : M.gold;            // gilt ruff with ivory highlights
      group.add(kiteFeather(base, dir, side, len, 0.24, 0.04, vane, M.emberShadow, M.roseGold));
    }
  }

  // Line-of-action: head high (proud arch) → neck down → level body → tail-root settles.
  const spinePoints = [
    new THREE.Vector3(0, 0.62 + 0.62 * nr, -2.20), new THREE.Vector3(0, 0.74, -1.35),
    new THREE.Vector3(0, 0.42, -0.62), new THREE.Vector3(0, 0.50, 0.2),
    new THREE.Vector3(0, 0.46, 0.9), new THREE.Vector3(0, 0.46, 1.6),
  ];
  const attach = {
    wingRoot: (side) => ({ x: (0.44 * bodyScale) * side, y: 0.58, z: -0.15 }),
    headBase: { x: 0, y: 0.62 + 0.62 * nr, z: -2.24 },
    tailAnchor: { y: 0.50, z: 1.60 },     // LIFTED (the pennant rakes up-aft, §4)
    keelTopAt: (z) => topAt(z),
    halfWidthAt,
    bodyMidY: 0.45, tailShift: 0,
    riderSocket: { x: 0, y: 0.74, z: -0.35 },
    motifAnchor,
  };
  return { group, attach, spinePoints, spineMats, mats: { bodyMat: M.ivory, eyeMat: M.eyeMat }, coreGlow };
}
registerTorso('sunhawk', buildSunhawkKeelTorso);

// Tiny procedural radial-glow texture for the heart-core sprite (no asset files).
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

// ── HEAD: 'sunhawkCrown' → 'sunhawkCrownHead' ────────────────────────────────────
// A regal beaked phoenix head + a back-raked feather crown that reads as the bright
// ORIGIN of the spine glow in the rear-chase. Short HOOKED gold eagle beak (regal
// predator, not a soft dowel), lofted ivory wedge skull, warm gold eyes, a back-swept
// gold crown fan (crownFan gates it; tips STRAIGHT-swept-back — the no-curl veto).
function buildSunhawkCrownHead(def, model, _mats) {
  const group = new THREE.Group();
  const M = sunhawkMats(def, model.glowLevel ?? 1, model.igniteStage);
  const spineMats = [M.gold, M.roseGold];
  const hs = model.headScale ?? 1;

  // Lofted ivory wedge skull (points −Z) — flat brow → tapered crown, NOT a bare sphere.
  const skull = [
    { z: 0.24, rx: 0.19 * hs, ry: 0.20 * hs, cy: 0.02 },   // occiput
    { z: -0.02, rx: 0.22 * hs, ry: 0.22 * hs, cy: 0.03 },  // brow (widest)
    { z: -0.28, rx: 0.15 * hs, ry: 0.14 * hs, cy: -0.02 }, // cheek
    { z: -0.48, rx: 0.09 * hs, ry: 0.085 * hs, cy: -0.05 },// muzzle base
  ];
  group.add(loftRings(skull, M.ivory, seg(7)));
  const headLength = 0.9 * hs;

  // Short HOOKED gold beak — upper hooks over lower (two beveled facets), regal raptor.
  const upper = spike(0.26 * hs, 0.10 * hs, 0.006, M.gold, 6);
  upper.rotation.x = Math.PI / 2 + 0.32;   // points −Z, hooks down
  upper.position.set(0, -0.01 * hs, -0.52 * hs);
  group.add(upper);
  const lower = spike(0.16 * hs, 0.07 * hs, 0.01, M.gold, 5);
  lower.rotation.x = Math.PI / 2 + 0.12;
  lower.position.set(0, -0.08 * hs, -0.48 * hs);
  group.add(lower);

  // Warm gold EYES — the brightest facial points bar the collar, deep-set under the brow.
  const es = model.eyeScale ?? 1;
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.085 * hs * es, 0), M.eyeMat);
    eye.position.set(side * 0.16 * hs, 0.04 * hs, -0.20 * hs);
    eye.scale.set(1.35, 0.85, 1);
    group.add(eye);
  }

  // BACK-RAKED CROWN FAN — stiff gold crest-feathers raking BACK off the crown (the bright
  // dorsal read from behind). Tips STRAIGHT-swept-back (no curl). crownFan gates count.
  const motifAnchor = new THREE.Object3D(); motifAnchor.position.set(0, 0.20 * hs, 0.05); group.add(motifAnchor);
  const crown = Math.round(model.crownFan ?? 5);
  for (let i = 0; i < crown; i++) {
    const a = crown > 1 ? (i / (crown - 1) - 0.5) * 1.05 : 0;
    const len = 0.54 * hs * (1 - 0.20 * Math.abs(a)) * (model.crownLen ?? 1);   // longer so it reads from behind
    group.add(kiteFeather([Math.sin(a) * 0.15 * hs, 0.18 * hs, 0.14], [Math.sin(a) * 0.5, 0.46, 0.82], [1, 0, 0], len, 0.14 * hs, 0.05, M.gold, M.emberShadow, M.roseGold));
  }

  return { group, spineMats, motifAnchor, headLength };
}
registerHead('sunhawkCrown', buildSunhawkCrownHead);

// ── WINGS: 'sunfeather' → 'sunfeatherWings' — THE HERO ───────────────────────────
// Broad, deep-chord, RICH great-eagle feather wings on a FILLED surface (replaces the
// old flat venetian-blind sheets entirely). Three ORGANIZED RANKS with two-value relief
// (bright ivory/gold VANE over an ember-shadow ROOT): coverts (inner third) · secondaries
// (mid-chord, overlapping) · emarginated PRIMARY FINGERS (outer third, fanning from the
// carpal). Tips rake AFT and droop slightly DOWN — the HARD no-curl veto (terminal
// Y-slope ≤0, Z-slope >0). Leading edge is a lofted gold spar-LIMB (real chord), not a
// flat edge. Canonical +X, left = scale.x=-1 mirror (wingsymprobe Δ0.000).

// SHARED EXPORTED PROFILE — the ONE source of truth for the leading edge, so the vane
// geometry AND the FX tip marker / wingElements agree (change it in one place or the
// wingtip trail detaches). t∈[0,1] span; hs = half-span. A gentle, near-LINEAR dihedral
// rise — NEVER an up-curl at the tip (the primary FINGERS carry the aft-down droop).
export function sunLeadY(t, hs) { return hs * (0.06 + 0.20 * t); }
export function sunLeadZ(t, hs) { return -0.05 + 0.42 * hs * Math.pow(t, 1.15); }   // sweep-back ~26°, accelerating outboard

function buildOneSunWing(M, model) {
  const wg = new THREE.Group();
  const ws = model.wingScale ?? 1;
  const hs = 3.3 * ws;
  const rootChord = 1.5 * ws;
  const covertN = Math.round(model.covertRank ?? 7);
  const secN = Math.round(model.secondaryRank ?? 6);
  const fingerN = Math.max(2, Math.round(model.primaryFingers ?? 5));
  const split = model.fingerSplit ?? 1;   // emargination: 0 blunt/bunched → 1 fanned fingers
  const rose = model.roseGoldEdge ?? 1;

  const L = (t) => [t * hs, sunLeadY(t, hs), sunLeadZ(t, hs)];
  const chord = (t) => rootChord * (1 - 0.52 * Math.pow(t, 1.05));
  // A MODEST chordwise camber + a real THICKNESS between a top vane and a bottom skin, so
  // the wing is a shallow curved SOLID that never presents as a flat cold plank edge-on (the
  // CP2 fix) — the THICKNESS does the anti-plank job; a deep camber only digs a dark pocket.
  const camber = (f) => -0.04 - 0.09 * Math.sin(f * Math.PI);
  const THICK = 0.10;   // underside drop as a fraction of chord (the airfoil depth)
  const TOP = (t, f) => { const l = L(t), c = chord(t); return [l[0], l[1] + camber(f) * c, l[2] + f * c]; };
  const BOT = (t, f) => { const l = L(t), c = chord(t); return [l[0], l[1] + (camber(f) - THICK) * c, l[2] + f * c]; };

  // ── THE ARM — a lofted tapered GOLD spar-limb along the inner lead (the one gilt line the
  // fire streams off). Real chord thickness at the shoulder.
  const armTs = [0, 0.14, 0.28, 0.42], armR = [0.13, 0.11, 0.085, 0.06];
  const armRings = armTs.map((t, i) => { const l = L(t); return { z: l[2], rx: armR[i] * ws, ry: armR[i] * 1.1 * ws, cy: l[1], cx: l[0] }; });
  wg.add(loftRings(armRings, M.gold, seg(6), false));

  // ── THE UNDERWING — a warm FLAME belly (inboard to ~0.85 chord) that BACKS the fire-feathers
  // so the gaps read as warm shadow, not see-through sky. NO hard trailing rim: the streaming
  // flame-feathers (below) ARE the trailing edge (the owner's "trailing flame feathers").
  const memTs = [0, 0.14, 0.28, 0.42, 0.56, 0.70];
  for (let i = 0; i < memTs.length - 1; i++) {
    const t0 = memTs[i], t1 = memTs[i + 1];
    wg.add(flatTriMesh([[BOT(t0, 0), BOT(t1, 0.85), BOT(t1, 0)], [BOT(t0, 0), BOT(t0, 0.85), BOT(t1, 0.85)]], M.bronze));
  }

  // span → FIRE hue ramp (root-hot goldfire inner → crimson outer). Grace = flow, not a grid.
  const rampAt = (t) => t < 0.40 ? [M.goldfire, M.goldfire, M.flame]
    : t < 0.70 ? [M.goldfire, M.flame, M.flame]
      : [M.flame, M.flame, M.crimson];
  const rampHot = [M.goldfire, M.goldfire, M.flame];
  const rampTrail = [M.flame, M.crimson, M.crimson];

  // ── LEADING FLAME-LICKS — a sparse row of short hot licks that lift UP-and-out off the
  // leading edge, so the leading edge reads CURVED + ALIGHT, not a straight spar (owner note).
  const nLead = Math.max(2, Math.round(covertN * 0.5));
  for (let i = 0; i < nLead; i++) {
    const u = nLead > 1 ? i / (nLead - 1) : 0.5, t = 0.08 + u * 0.5, l = L(t);
    wg.add(flameFeather([l[0], l[1] + 0.02, l[2] - 0.01], [0.40, 0.34, -0.08], [1, 0, 0.3], (0.34 + 0.14 * Math.sin(Math.PI * u)) * ws, 0.13 * ws, 0.06, rampHot).group);
  }

  // ── THE FIRE-FEATHER RANKS — TWO COMBED sweeps of FEWER, LARGER, size-graded flame-feathers
  // (the anti-quilt: varied length + curved flow + a per-feather hue gradient, NOT a clone
  // grid). They comb to a common aft-outboard streamline and BUILD the wing surface AS fire —
  // hot gold inner, ramping to flame/crimson outboard; each feather's own root→tip ramp = the
  // combustion. Restraint = grace: few + large.
  const sweeps = [
    { n: Math.max(3, Math.round(covertN * 0.7)), tA: 0.06, tB: 0.50, seat: 0.32, lenK: 0.95, rake: 0.22, curve: 0.05 },
    { n: Math.max(4, Math.round(secN * 0.95)), tA: 0.12, tB: 0.84, seat: 0.52, lenK: 1.25, rake: 0.42, curve: 0.09 },
  ];
  for (const sw of sweeps) {
    for (let i = 0; i < sw.n; i++) {
      const u = sw.n > 1 ? i / (sw.n - 1) : 0.5;
      const t = sw.tA + u * (sw.tB - sw.tA), l = L(t), cc = chord(t);
      const jit = Math.sin(i * 5.7) * 0.05;                                  // seeded pitch jitter → organic scallop
      const len = (sw.lenK * (0.6 + 0.6 * Math.sin(Math.PI * u))) * cc;      // longest MID-span, no two alike
      const wid = (0.36 - 0.08 * Math.abs(u - 0.5) * 2) * cc;
      const dir = [sw.rake * (0.4 + u) + jit, -0.03, 1];                     // comb aft-outboard (flow, not lattice)
      const base = [l[0], l[1] + camber(sw.seat) * cc + 0.05, l[2] + sw.seat * cc];
      wg.add(flameFeather(base, dir, [1, 0, 0], len, wid, sw.curve, rampAt(t)).group);
    }
  }

  // ── TRAILING FIRE STREAMERS — long S-tapered flame-feathers OFFSET off the trailing/outer
  // edge, raked AFT-and-up with GAPS (sky shows through) + a graceful terminal CURL → streaming
  // fire, the owner's "trailing flame feathers". Graded lengths (centre-outer longest), crimson
  // tips. These ARE the wing's trailing silhouette (no hard rig line shows).
  const nStream = Math.max(3, Math.round(secN * 0.9));
  for (let i = 0; i < nStream; i++) {
    const u = nStream > 1 ? i / (nStream - 1) : 0.5;
    const t = 0.18 + u * 0.72, l = L(t), cc = chord(t);
    const len = (1.3 + 0.9 * Math.sin(Math.PI * (0.25 + 0.6 * u))) * ws;     // long, centre-outer longest
    const wid = (0.22 - 0.05 * Math.abs(u - 0.5) * 2) * ws;
    const dir = [0.14 + 0.34 * u, 0.10 + 0.06 * u, 1];                        // aft + gently up (into the empty sky)
    const base = [l[0], l[1] + camber(0.85) * cc, l[2] + 0.85 * cc];         // rooted at the trailing edge, offset past it
    wg.add(flameFeather(base, dir, [1, 0, 0], len, wid, 0.12, rampTrail, 0.14 * ws).group);
  }

  // ── STRUCTURAL PRIMARY FINGERS — a few emarginated eagle fingers UNDER the fire fringe, for
  // the wing SILHOUETTE + the no-curl contract (terminal aft-and-DOWN, never up/in). Gilt→amber,
  // read as the fingered eagle-hand inside the flame.
  const carpal = TOP(0.70, 0.5);
  const nFing = Math.max(2, Math.min(fingerN, 4));
  const tips = [];
  for (let i = 0; i < nFing; i++) {
    const u = nFing > 1 ? i / (nFing - 1) : 0.5;
    const ang = 0.22 + (0.16 + 0.50 * u) * (0.4 + 0.6 * split);
    const droop = 0.08 + 0.06 * u;                                 // DOWN at the tip (anti-curl)
    const dir = [Math.cos(ang), -droop, Math.sin(ang)];
    const side = [-Math.sin(ang), 0, Math.cos(ang)];
    const len = (1.0 + 0.6 * Math.sin(Math.PI * u)) * ws;
    const wid = (0.26 - 0.08 * Math.abs(u - 0.5) * 2) * ws;
    wg.add(kiteFeather([carpal[0], carpal[1], carpal[2]], dir, side, len, wid, 0.06, M.gold, M.bronze, M.roseGold));
    tips.push([carpal[0] + dir[0] * len, carpal[1] + dir[1] * len, carpal[2] + dir[2] * len]);
  }
  wg.userData.outerTip = tips[nFing - 1];
  return wg;
}

function buildSunfeatherWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const M = sunhawkMats(def, model.glowLevel ?? 1, model.igniteStage);
  const hs = 3.3 * (model.wingScale ?? 1);
  const pivots = {}, wingElements = [];
  for (const side of [1, -1]) {
    const root = attach.wingRoot(side);
    const pivot = new THREE.Group();
    pivot.position.set(root.x, root.y, root.z);
    pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);
    const oneWing = buildOneSunWing(M, model);
    mid.add(oneWing);   // canonical +X geometry
    if (side === -1) pivot.scale.x = -1;   // left = mirror → symmetric flap poses
    group.add(pivot);
    const s = side === 1 ? 'R' : 'L';
    // FX marker at the TRUE outer primary-finger tip — via the SAME geometry the wing used
    // (the outerTip it published), so the wingtip trail rides the moved tip.
    const ot = oneWing.userData.outerTip || [hs, sunLeadY(1, hs), sunLeadZ(1, hs)];
    const marker = new THREE.Object3D();
    marker.position.set(ot[0], ot[1], ot[2]);
    mid.add(marker);
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip;
    pivots['tipMarker' + s] = marker;
    wingElements.push({ root: [root.x, root.y, root.z], tip: [root.x + side * ot[0], root.y + ot[1], root.z + ot[2]], length: hs, tipObj: marker });
  }
  return { group, spineMats: [M.gold, M.roseGold, M.orange], wingMat: M.ivory, parts: { ...pivots, wingElements } };
}
registerWings('sunfeather', buildSunfeatherWings);

// ── TAIL: 'sunfireTrail' → a LONG, GRACEFUL trail of FIRE (owner: "longer, graceful,
// elegant, like trailing fire" — the IMG_6527 curling fire-tail). Long S-curved `flameFeather`
// ribbons rooted at the (lifted) tail anchor, each bowing then streaming AFT-and-UP with a
// graceful terminal CURL into the empty sky (never a lower-centre droop). Centre ribbon longest
// (the comet point), sides finer, all tapering to a fine point with a goldfire→flame→crimson
// heat gradient. LONG via rake + streaming, so the projected footprint stays corridor-clear.
function buildSunfireTrail(def, model, _mats, anchor) {
  const group = new THREE.Group();
  const M = sunhawkMats(def, model.glowLevel ?? 1, model.igniteStage);
  const a = anchor ?? { y: 0.50, z: 1.60 };
  const nRib = Math.round(model.pennantRibbons ?? 5);
  const lift = model.pennantLift ?? 1;
  const segs = [group];
  if (nRib <= 0) return { group, segs, tailFins: null, accentMats: [M.flame, M.crimson] };

  const baseLen = 2.8 + 2.0 * lift;                       // apex ~4.8 — LONG, streaming (not a stub fan)
  const ramp = [M.goldfire, M.flame, M.crimson];         // root-hot → crimson tip (the combustion)
  for (let i = 0; i < nRib; i++) {
    const u = nRib > 1 ? (i / (nRib - 1)) - 0.5 : 0;      // −0.5 … 0.5 across the drape
    const rlen = baseLen * (0.5 + 0.5 * (1 - Math.abs(u) * 2));   // CENTRE ribbon longest (the comet point)
    // an elegant S: rake AFT + a real UP lift, gentle splay, a graceful terminal CURL (aft-up).
    const dir = [u * 0.38, 0.16 + 0.30 * lift, 1.0];
    const side = [1, 0, 0];
    const wid = (0.26 - 0.06 * Math.abs(u) * 2) * (0.7 + 0.3 * lift);
    const curve = 0.16 + 0.10 * Math.abs(u);             // gentle S bow (up)
    const curl = 0.22 + 0.16 * Math.abs(u);              // graceful terminal curl (rakes aft-up)
    const base = [u * 0.08, a.y, a.z];                   // gathered roots at the anchor
    group.add(flameFeather(base, dir, side, rlen, wid, curve, ramp, curl).group);
  }
  return { group, segs, tailFins: null, accentMats: [M.goldfire, M.flame, M.crimson, M.orange] };
}
registerTail('sunfireTrail', buildSunfireTrail);

// Export the material factory so downstream modules share the exact ladder.
export { sunhawkMats, loftRings, kiteFeather, makeGlow };
