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

// THE WHITE-GOLD SOLAR-IVORY TIER LADDER (build sheet §1). Every material is exactly one
// tier. LIGHT-body doctrine: a pale MATTE ivory FIELD (T1) with a DARK ember-shadow
// RELIEF (T4) and a saturated rose-gold RIM (T3) that both survive ACES + bloom, so the
// silhouette stays crisp instead of blooming to one smear. `igniteStage` 0→3 ("Reborn in
// fire") gates HOW LIT the emissive support is + slides the body field up the value ramp.
//   VALUE-GAP LAW: the broad ivory field never touches the near-white T0 (the ≤1 heart);
//   every feather = a bright vane over an ember-shadow root (≥2 tiers apart).
function sunhawkMats(def, glow, stage) {
  const st = Math.max(0, Math.min(3, Math.round(stage ?? 3)));
  const g = glow ?? 1;

  // T1 SOLAR-IVORY — the big MATTE opaque body field (form-laddered hue: warm charcoal
  // chick → solar ivory). Emissive kept ≤0.12 so it reads MATTE, never a bloom-bomb.
  const ivoryCol = def.body ?? 0xf2e8cf;
  // A WARM emissive floor (amber, not neutral) + a touch of metalness so the pale body
  // reads warm ivory-GOLD under the cool fresnel rim, not cool grey (the CP1 critic note).
  const ivory = new THREE.MeshStandardMaterial({ color: ivoryCol, emissive: 0x4a2e12, emissiveIntensity: 0.13 + 0.06 * st, flatShading: true, roughness: 0.5, metalness: 0.12, side: THREE.DoubleSide });

  // T4 EMBER-SHADOW — the DARK RELIEF value (feather roots, under-wing, belly, seams,
  // haunch). The load-bearing second value; a whisper of warm emissive keeps it from
  // dead-black on a dark sky. NOT in spineMats (the dark relief must not flare on Surge).
  const emberShadow = new THREE.MeshStandardMaterial({ color: def.belly ?? 0x5a3018, emissive: 0x1c0c04, emissiveIntensity: 0.1, flatShading: true, roughness: 0.82, metalness: 0.05, side: THREE.DoubleSide });

  // T2 GOLD — the REGALIA register (beak, vertebral ridge, wing spar, crown fan, collar
  // gorget, feather shafts). Forged metal: give gold forms a bevel to catch an edge hi.
  const goldCol = def.horn ?? 0xf4d580;
  const gold = new THREE.MeshStandardMaterial({ color: goldCol, emissive: 0x6a4410, emissiveIntensity: 0.18 + 0.12 * st, flatShading: true, roughness: 0.36, metalness: 0.5, side: THREE.DoubleSide });
  gold.userData.baseEmissive = 0x6a4410; gold.userData.baseIntensity = gold.emissiveIntensity;

  // T3 ROSE-GOLD / AMBER EDGE — the crisp SILHOUETTE-DEFINING rim on the pale body (feather
  // edges, wing/tail hems, collar tips). Reads BOTH against ivory AND against a pale sky.
  const roseCol = def.featherEdge ?? 0xff9a7a;
  const roseGold = new THREE.MeshStandardMaterial({ color: roseCol, emissive: 0xff8a2a, emissiveIntensity: 0.14 + 0.14 * st, flatShading: true, roughness: 0.44, metalness: 0.18, side: THREE.DoubleSide });
  roseGold.userData.baseEmissive = 0xff8a2a; roseGold.userData.baseIntensity = roseGold.emissiveIntensity;

  // EMISSIVE — ORANGE FLAME SUPPORT (the only broad emissive accent, on ~10%: seams,
  // heart glow-pool, wing-vein, collar-heart, pennant hem). Saturated → blooms in-hue.
  const orangeCol = def.wingEmissive ?? 0xff7a1a;
  const orange = new THREE.MeshStandardMaterial({ color: 0x3a1808, emissive: orangeCol, emissiveIntensity: (0.5 + 0.5 * st) * g, flatShading: true, roughness: 0.5, metalness: 0.04 });
  orange.userData.baseEmissive = orangeCol; orange.userData.baseIntensity = orange.emissiveIntensity;

  // T0 WHITE-HOT — the heart core (the ≤1 near-white register). Orange-hot at low forms,
  // igniting to white-hot at Rebirth. OUT of spineMats (it already IS the hottest hue).
  const heartEmis = [orangeCol, orangeCol, 0xffc878, 0xffffff][st];
  const heartI = [0.4, 1.0, 1.7, 2.4][st] * g;
  const heart = new THREE.MeshStandardMaterial({ color: 0xffe8c0, emissive: heartEmis, emissiveIntensity: heartI, flatShading: true, roughness: 0.3, metalness: 0.05 });

  // Eyes — warm gold, the brightest facial points bar the collar.
  const eyeCol = def.eye ?? 0xffe6a0;
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xfff2c8, emissive: eyeCol, emissiveIntensity: (1.0 + 0.2 * st) * g, flatShading: true, roughness: 0.28 });
  eyeMat.userData.baseEmissive = eyeCol; eyeMat.userData.baseIntensity = eyeMat.emissiveIntensity;

  return { ivory, emberShadow, gold, roseGold, orange, heart, eyeMat, stage: st, glow: g };
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
    map: makeGlow('255,180,90'), transparent: true, opacity: 0.1 + lvl * 0.18,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  coreGlow.scale.setScalar(0.6 + lvl * 0.6);
  coreGlow.position.set(hx, hy, hz - 0.05);
  coreGlow.layers.set(1);
  coreGlow.userData.base = coreGlow.material.opacity;
  group.add(coreGlow);

  // Shoulder fairings — ivory fillets from each wing root inboard to the neck base.
  for (const s of [1, -1]) {
    group.add(flatTriMesh([[[s * 0.44, 0.56, -0.18], [s * 0.10, 0.60, -1.05], [s * 0.40, 0.40, -0.02]]], M.ivory));
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
  const camberY = (f) => -0.05 - 0.14 * Math.sin(f * Math.PI);
  const MP = (t, f) => { const l = L(t), c = chord(t); return [l[0], l[1] + camberY(f) * c, l[2] + f * c]; };

  // ── THE ARM — a lofted tapered GOLD spar-limb along the inner lead (t 0→0.42), curved
  // (rides the lead), giving the wing REAL chord thickness at the shoulder (anti flat-edge).
  const armTs = [0, 0.14, 0.28, 0.42], armR = [0.14, 0.11, 0.085, 0.06];
  const armRings = armTs.map((t, i) => { const l = L(t); return { z: l[2], rx: armR[i] * ws, ry: armR[i] * 1.1 * ws, cy: l[1], cx: l[0] }; });
  wg.add(loftRings(armRings, M.gold, seg(6), false));

  // ── THE FILLED WEB — a cambered ivory vane surface root→t=0.70 (the anti flat-sheet
  // MASS: a stack of surfaces, not ruled wires). Ember-shadow along the trailing underside
  // + a rose-gold trailing rim (the two-value + the silhouette-crisp rim on a pale sky).
  const memTs = [0, 0.12, 0.24, 0.36, 0.48, 0.60, 0.70];
  for (let i = 0; i < memTs.length - 1; i++) {
    const t0 = memTs[i], t1 = memTs[i + 1];
    // ivory vane (lead→0.75 chord)
    wg.add(flatTriMesh([[MP(t0, 0.0), MP(t1, 0.0), MP(t1, 0.75)], [MP(t0, 0.0), MP(t1, 0.75), MP(t0, 0.75)]], M.ivory));
    // ember-shadow trailing band (0.75→1.0) — the dark underside value
    wg.add(flatTriMesh([[MP(t0, 0.75), MP(t1, 0.75), MP(t1, 1.0)], [MP(t0, 0.75), MP(t1, 1.0), MP(t0, 1.0)]], M.emberShadow));
    // rose-gold trailing rim
    if (rose > 0) wg.add(flatTriMesh([[MP(t0, 1.0), MP(t1, 1.0), MP(t1, 1.06)], [MP(t0, 1.0), MP(t1, 1.06), MP(t0, 1.06)]], M.roseGold));
  }

  // ── (1) COVERTS — a shingled row of small ivory kite-feathers over the inner third
  // (extend INBOARD so the inner wing is not a blank rod). Bright vane / ember-shadow root.
  for (let i = 0; i < covertN; i++) {
    const t = 0.04 + (i / Math.max(1, covertN - 1)) * 0.42, l = L(t), c = chord(t);
    const len = (0.42 - 0.10 * (i / covertN)) * ws, wid = 0.22 * ws;
    const base = [l[0], l[1] - 0.02 * c, l[2] + 0.16 * c];
    wg.add(kiteFeather(base, [0.22, -0.06, 1], [1, 0, 0], len, wid, 0.05, M.ivory, M.emberShadow));
  }

  // ── (2) SECONDARIES — a broad OVERLAPPING mid-chord row (~55% overlap) that carries the
  // deep filled chord; ivory→gold vanes over ember-shadow roots, a rose-gold rim outboard.
  for (let i = 0; i < secN; i++) {
    const t = 0.12 + (i / Math.max(1, secN - 1)) * 0.56, l = L(t), c = chord(t);
    const len = 0.62 * c, wid = 0.30 * c;
    const base = [l[0], l[1] - 0.03 * c, l[2] + 0.40 * c];
    const vane = i > secN * 0.55 ? M.gold : M.ivory;
    wg.add(kiteFeather(base, [0.24, -0.09, 1], [1, 0, 0], len, wid, 0.06, vane, M.emberShadow, rose > 0.4 ? M.roseGold : null));
  }

  // ── (3) PRIMARY FINGERS — emarginated GREAT-EAGLE fingers fanning from the carpal (~t0.68),
  // rooted IN the web. Lengths grade with a central DOMINANT ×1.5. The fan spread widens
  // with fingerSplit (blunt+bunched at the whelp → fanned fingers at apex). Each finger
  // rakes AFT and droops slightly DOWN at the tip — NEVER up/in/hooked (the veto).
  const carpal = MP(0.68, 0.5);
  const tips = [];
  for (let i = 0; i < fingerN; i++) {
    const u = fingerN > 1 ? i / (fingerN - 1) : 0.5;
    // fan angle from +X (spanward) toward +Z (aft); outer fingers rake more aft. The spread
    // opens with `split` (emargination); at split 0 the fingers bunch near-spanward (blunt).
    const ang = 0.22 + (0.20 + 0.55 * u) * (0.35 + 0.65 * split);
    const droop = 0.06 + 0.06 * u;             // slight DOWN at the tip — the anti-curl tell
    const dir = [Math.cos(ang), -droop, Math.sin(ang)];
    const peak = Math.sin(Math.PI * u);
    const len = (0.9 + 0.7 * peak) * ws;       // central dominant ~×1.5 over the edge fingers
    const wid = (0.20 - 0.03 * Math.abs(u - 0.5) * 2) * ws;
    const vane = u < 0.35 ? M.gold : M.ivory;  // inner primaries gold, outer ivory→white
    wg.add(kiteFeather([carpal[0], carpal[1], carpal[2]], dir, [0, 1, 0], len, wid, 0.06, vane, M.emberShadow, rose > 0 ? M.roseGold : null));
    tips.push([carpal[0] + dir[0] * len, carpal[1] + dir[1] * len, carpal[2] + dir[2] * len]);
  }
  // the outer-finger tip (fold/FX handle) — the widest span point.
  wg.userData.outerTip = tips[fingerN - 1];
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

// Export the material factory so the tail module (CP3) shares the exact ladder.
export { sunhawkMats, loftRings, kiteFeather, makeGlow };
