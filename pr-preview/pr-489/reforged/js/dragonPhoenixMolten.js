import * as THREE from 'three';
import { seg } from './modelDetail.js';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// MOLTEN PHOENIX — "a phoenix of living magma whose crust cracks with light,
// gliding on wings of layered flame" (PHOENIX-MOLTEN-BUILDSHEET.md). A FRESH
// premium apex — no retired coal-empress form reused (that builder was deleted;
// nothing is reconstructed from it). Four self-registering parts:
//   moltenPhoenixTorso · pyreFanWings · calderaCrestHead · emberWakeTail
// Axis: head/forward −Z, tail/rear +Z, right +X, up +Y; torso baseline y≈0.2.
//
// THE CALDERA SYSTEM ("crust holds the line, fire holds the night"): value
// hierarchy is INVERTED from the coal doctrine — interior masses GLOW, dark
// cooled CRUST sits only on the plate rims / seams / silhouette edges. Fire IS
// the body; dark is on the edges. Every emissive is baked into an OPAQUE
// flat-shaded facet in a SATURATED bloom-safe hue so it blooms IN ITS OWN HUE
// under ACES + UnrealBloom (never an additive washout shell). We shade by HUE,
// not value, so heat survives the tone-map: core→extremity cools T0→T4, but the
// facets never just "go grey" — they slide down the fire ramp.
// ═══════════════════════════════════════════════════════════════════════════════

const TORSO_Y = 0.2;

// The CALDERA HEAT-TIER LADDER (build sheet §1). Every material is exactly one
// tier. Diffuse = the cooled-rock read when a facet faces away from light; the
// EMISSIVE (baked, saturated) is what the chase cam catches — light in the seams,
// dark on the ridges. The `igniteStage` 0→3 dial gates HOW LIT each tier is, so
// the growth ladder ADDS light rung by rung (f0 a dormant crusted volcano →
// f3 living magma). BRIGHT-FIRST: intensities are pitched hot; ration DOWN only
// where a real capture washes out (never inherit a coal-era ceiling).
function calderaMats(def, glow, stage) {
  const st = Math.max(0, Math.min(3, Math.round(stage ?? 3)));

  // Per-stage emissive-intensity ladders (surge tick multiplies baseIntensity).
  // The MAGMA body field is deliberately pitched LOWER than the sungold fissure /
  // heart pool — the body glows a mid orange (T2) while the fissure + heart burn
  // yellow-hot (T1): that value gap is what keeps the 3 fire hues SEPARABLE under
  // ACES+bloom (a body pushed to full intensity blooms to one flat gold smear).
  const seamI = [0.22, 0.6, 1.05, 1.5][st];   // T2 magma body field / crack network
  const goldI = [0.5, 1.2, 2.0, 2.6][st];     // T1 sungold spine fissure / vane hearts
  const lavaI = [0.28, 0.6, 1.0, 1.4][st];    // T3 lava-deep belly / hems / cooling zones
  const poolI = [0, 1.3, 2.3, 3.0][st];       // T1 molten-heart glow-pool
  const heartI = [0, 0, 2.4, 3.8][st];        // T0 whiteheart core (Molten Dancer+ only)
  // f0 DORMANT tell: at igniteStage 0 the fissure/pool HUE demotes one tier to T3
  // red (faint red cracks under unbroken crust — a banked volcano, not a spent
  // cinder). From f1 up it promotes to sungold. The ignition ramp is itself a tier
  // promotion, rhyming with Surge.
  const goldEmis = st === 0 ? 0xe0480e : (def.sungold != null ? 0xffb32a : 0xffb32a);
  const magmaEmis = st === 0 ? 0xc23a0e : 0xff6a14;

  const crustCol = def.body ?? 0x261210;
  // T4 CRUST — the dark cooled FIELD + every silhouette edge/rim. A whisper of
  // deep-ember emissive keeps it warm charcoal, never dead-black, on a dark sky.
  const crust = new THREE.MeshStandardMaterial({ color: crustCol, emissive: 0x521808, emissiveIntensity: 0.14, flatShading: true, roughness: 0.82, metalness: 0.04, side: THREE.DoubleSide });
  // T4 CRUST-DARK — the shadowed plate BEVEL / underside (the second value on every
  // plate: a lit top facet + this dark rim → real relief, not a flat sticker).
  const crustDark = new THREE.MeshStandardMaterial({ color: 0x140a08, emissive: 0x2a0c04, emissiveIntensity: 0.1, flatShading: true, roughness: 0.9, metalness: 0.04, side: THREE.DoubleSide });
  const crustRim = new THREE.MeshStandardMaterial({ color: 0x1c0d0b, emissive: 0x3a1004, emissiveIntensity: 0.12, flatShading: true, roughness: 0.86, metalness: 0.06 });

  // T2 MAGMA — the glowing body field showing between the crust plates. Dark rock
  // diffuse (0x8f3410) so an unlit facet reads igneous; the orange emissive is the
  // molten light. Joins spineMats → flares up a tier on Surge.
  const magmaCol = def.magma ?? 0x8f3410;
  const magma = new THREE.MeshStandardMaterial({ color: magmaCol, emissive: magmaEmis, emissiveIntensity: seamI, flatShading: true, roughness: 0.6, metalness: 0.05 });
  magma.userData.baseEmissive = magmaEmis; magma.userData.baseIntensity = seamI;

  // T1 SUNGOLD — the spine FISSURE + vane hearts + eyes. The hottest structural
  // crack short of the whiteheart core. NOT jewelry-gold — molten rock at heat.
  const goldCol = def.sungold ?? 0xffb84a;
  const sungold = new THREE.MeshStandardMaterial({ color: goldCol, emissive: goldEmis, emissiveIntensity: goldI, flatShading: true, roughness: 0.42, metalness: 0.06 });
  sungold.userData.baseEmissive = goldEmis; sungold.userData.baseIntensity = goldI;

  // T3 LAVA-DEEP — cooling zones, belly, wing hems, wake. A deeper red-orange so
  // the belly reads as a SEPARATE structure from the T2 body, not one smear.
  const lavaCol = def.lavaDeep ?? 0x5e1c0c, lavaEmis = 0xe0480e;
  const lava = new THREE.MeshStandardMaterial({ color: lavaCol, emissive: lavaEmis, emissiveIntensity: lavaI, flatShading: true, roughness: 0.66, metalness: 0.04 });
  lava.userData.baseEmissive = lavaEmis; lava.userData.baseIntensity = lavaI;

  // T1 molten-heart GLOW-POOL — the breast caldera's pooled fire (brighter than
  // the spine fissure so the heart is the brightest sungold zone short of T0).
  const poolEmis = st === 0 ? 0xe0480e : 0xffa424;
  const pool = new THREE.MeshStandardMaterial({ color: 0xffc65a, emissive: poolEmis, emissiveIntensity: poolI, flatShading: true, roughness: 0.36, metalness: 0.05 });
  pool.userData.baseEmissive = poolEmis; pool.userData.baseIntensity = poolI;

  // T0 WHITEHEART — the burning apex core, rare + hierarchical. Near-white but
  // SATURATED-warm so it blooms warm, not paper. OUT of spineMats (Surge bloom of
  // the whiteheart is PERMITTED — it already IS the hottest hue).
  const whiteheart = new THREE.MeshStandardMaterial({ color: 0xffe8c0, emissive: 0xffd9a0, emissiveIntensity: heartI, flatShading: true, roughness: 0.3, metalness: 0.05 });

  return { crust, crustDark, crustRim, magma, sungold, lava, pool, whiteheart, stage: st };
}

// Faceted loft: rings [{z, rx, ry, cy, cx?}] → one flat-shaded tube. Winds
// OUTWARD so flat-shaded facets light from outside (no hollow read). Copied
// plumbing from the Sovereign reference (loftRings) — a look-neutral container.
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

// Tapered facet cone, base at origin growing +Y (talons, crest quills, beak).
function spike(len, rBase, rTip, mat, facets = 5) {
  const g = new THREE.Mesh(new THREE.CylinderGeometry(rTip, rBase, len, seg(facets)), mat);
  g.geometry.translate(0, len / 2, 0);
  return g;
}

// A CRUST SHARD — an IRREGULAR polygonal plate (5–6 sides, seeded jitter) raised
// proud of the glowing underbody, so the magma shows only in the thin seams
// between shards → a cracked-lava crust, never a brick grid. Two values by
// construction: a flat lit TOP (crust) + a dark shadowed BEVEL skirt (crustDark)
// down to the surface. `seat`=surface point, `up`=outward normal, `tan`=flow
// tangent (seams run along the body). Returns a small Group of two meshes.
function crustShard(seat, up, tan, r, seed, topMat, sideMat, lift) {
  const U = up.clone().normalize();
  const T = tan.clone().normalize();
  const S = new THREE.Vector3().crossVectors(U, T).normalize();
  const C = new THREE.Vector3(seat[0], seat[1], seat[2]);
  const rnd = (i) => { const x = Math.sin(seed * 91.7 + i * 47.3) * 43758.5; return x - Math.floor(x); };
  const n = 5 + (rnd(0) > 0.5 ? 1 : 0);   // 5–6 sides
  const A = (v) => [v.x, v.y, v.z];
  const top = [], base = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rnd(i + 1) - 0.5) * 0.7;
    const rr = r * (0.62 + 0.7 * rnd(i + 10));                       // irregular radius (≥2× variance)
    const dir = S.clone().multiplyScalar(Math.cos(a) * rr).addScaledVector(T, Math.sin(a) * rr * 1.35);
    base.push(C.clone().add(dir).addScaledVector(U, -0.015));         // rim tucked to the surface
    top.push(C.clone().add(dir.clone().multiplyScalar(0.8)).addScaledVector(U, lift));
  }
  const ctr = C.clone().addScaledVector(U, lift * 1.08);
  const topT = [], skirtT = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    topT.push([A(ctr), A(top[i]), A(top[j])]);
    skirtT.push([A(top[i]), A(base[i]), A(base[j])], [A(top[i]), A(base[j]), A(top[j])]);
  }
  const g = new THREE.Group();
  g.add(flatTriMesh(topT, topMat));
  g.add(flatTriMesh(skirtT, sideMat));
  return g;
}

// ── TORSO: 'moltenPhoenixTorso' ────────────────────────────────────────────────
// A COMPACT firebird of living magma. Re-derived from scratch for magma (the coal
// mantle/train forms are NOT carried): the BODY itself is the light source, so
// there is no appended sky-glory — the glory is the glowing molten body + the
// pyre-fan wings (hero mass in the LATERAL spread, a region no shipped dragon
// uses: Solar top-heavy, Phoenix bottom-heavy). Construction:
//   • glowing T2 MAGMA underbody loft (the fire that shows in the seams)
//   • dark T4 CRUST plates shingled over it in organized ranks (the field; the
//     gaps between plates are the molten cracks — light in valleys, dark ridges)
//   • a T1 SUNGOLD fissure down the spine, flanked by dark crust rails (a crack,
//     not a gold tube)
//   • the MOLTEN HEART on the breast: a crust caldera over a T1 glow-pool + (apex)
//     a T0 whiteheart core — the burning heart of the creature.
function buildMoltenPhoenixTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = calderaMats(def, glow, model.igniteStage);
  const spineMats = [M.magma, M.sungold, M.lava, M.pool];   // flare a tier up on Surge
  const bodyScale = model.torsoScale ?? 1;

  // GLOWING UNDERBODY — a compact egg loft in T2 magma (chest-forward, level
  // axis, tail root tapering). This is the fire the crust cracks reveal.
  const body = [
    { z: -1.30, rx: 0.28 * bodyScale, ry: 0.34, cy: 0.30 },   // chest prow
    { z: -0.92, rx: 0.50 * bodyScale, ry: 0.58, cy: 0.16 },   // breast (molten-heart seat, deepest)
    { z: -0.44, rx: 0.56 * bodyScale, ry: 0.54, cy: 0.24 },   // shoulder yoke (widest — wing roots)
    { z: 0.12, rx: 0.46, ry: 0.45, cy: 0.26 },
    { z: 0.60, rx: 0.38, ry: 0.37, cy: 0.22 },                // haunch
    { z: 1.02, rx: 0.22, ry: 0.22, cy: 0.18 },                // rump
    { z: 1.34, rx: 0.10, ry: 0.10, cy: 0.16 },                // tail root
  ];
  group.add(loftRings(body, M.magma, seg(9)));

  // Proud up-forward neck (arcs UP to the head — a firebird's proud carriage).
  const neck = [
    { z: -1.24, rx: 0.28, ry: 0.32, cy: 0.34 },
    { z: -1.58, rx: 0.23, ry: 0.26, cy: 0.48 },
    { z: -1.90, rx: 0.17, ry: 0.19, cy: 0.60 },
  ];
  group.add(loftRings(neck, M.magma, seg(8), false));

  // Half-width of the body at a given z (for wing-fairing placement + asserts).
  const halfWidthAt = (z) => 0.58 * bodyScale * Math.max(0.18, 1 - Math.abs(z + 0.4) / 2.6);
  const topAt = (z) => TORSO_Y + 0.5 * Math.max(0.12, 1 - Math.abs(z + 0.4) / 2.8);

  // Interpolate the loft rings → the true surface point + outward normal at
  // (z, θ) (θ=+π/2 dorsal top, 0/π the sides, −π/2 ventral). So crust shards seat
  // ON the glowing body and their seams follow its flow, not a floating grid.
  const bodySurface = (z, th) => {
    let a = body[0], b = body[body.length - 1];
    for (let i = 0; i < body.length - 1; i++) if (z >= body[i].z && z <= body[i + 1].z) { a = body[i]; b = body[i + 1]; break; }
    const u = b.z === a.z ? 0 : (z - a.z) / (b.z - a.z);
    const rx = a.rx + (b.rx - a.rx) * u, ry = a.ry + (b.ry - a.ry) * u, cy = a.cy + (b.cy - a.cy) * u;
    const p = [Math.cos(th) * rx, cy + Math.sin(th) * ry, z];
    const nrm = new THREE.Vector3(Math.cos(th) / rx, Math.sin(th) / ry, 0).normalize();
    return { p, n: nrm };
  };

  // ── CRUST-SHARD FIELD — dark T4 shards seated over the glowing magma body so the
  // magma reads only in the THIN SEAMS between them → cracked lava crust (light in
  // the valleys, dark on the ridges), NOT a brick grid. Each shard is an irregular
  // 5–6-gon with a lit top + a dark bevel (two values). Coverage is a HEAT MAP:
  // dense toward the cooler extremities (neck root / haunch / tail), OPEN at the
  // hot breast + dorsal fissure — so the crust density itself draws the heat
  // gradient (hottest heart, cooling outboard). crustCoverage ladders it (f0 seals
  // the crust = dormant; the apex opens the most molten seams).
  const coverage = model.crustCoverage ?? 1;
  const shardZ = seg(9);
  for (const s of [1, -1]) {
    for (let iz = 0; iz < shardZ; iz++) {
      const z = -1.02 + (iz + 0.5) / shardZ * 2.25;
      // heat map: 0 at the hot breast (z≈−0.9) rising to 1 at the extremities.
      const heat = Math.min(1, Math.abs(z + 0.9) / 1.5);
      const nCol = 2 + Math.round(heat * 2);                 // 2 shards (open, hot) → 4 (crusted, cool)
      for (let c = 0; c < nCol; c++) {
        const th = 0.35 + (c + 0.5) / nCol * 1.9 + Math.sin(iz * 5.1 + c * 2.3) * 0.18;   // upper-flank band, jittered
        const seed = iz * 7.3 + c * 3.1 + (s > 0 ? 0 : 100);
        // stochastic thinning at the hot breast (open seams) via coverage + heat
        if (Math.sin(seed * 12.9) * 0.5 + 0.5 > coverage * (0.45 + 0.55 * heat)) continue;
        const surf = bodySurface(z, s > 0 ? th : Math.PI - th);
        const r = (0.16 + 0.06 * (Math.sin(seed) * 0.5 + 0.5)) * (0.9 + 0.3 * heat);
        group.add(crustShard(surf.p, surf.n, new THREE.Vector3(0, 0, 1), r, seed, M.crust, M.crustDark, 0.05));
      }
    }
    // a ventral crust course on the belly EDGE (anchors the pale/gold-sky silhouette
    // so the underside never dissolves into a bright sky — the gold-sky fix).
    for (let iz = 0; iz < seg(6); iz++) {
      const z = -0.8 + (iz + 0.5) / seg(6) * 1.9;
      const surf = bodySurface(z, s > 0 ? -0.5 : Math.PI + 0.5);
      const seed = iz * 4.7 + (s > 0 ? 50 : 150);
      group.add(crustShard(surf.p, surf.n, new THREE.Vector3(0, 0, 1), 0.14, seed, M.crustDark, M.crustDark, 0.04));
    }
  }

  // ── SPINE SUNGOLD FISSURE — the T1 crack down the dorsal ridge, held between
  // two dark crust RAILS (so it reads as a fissure IN the crust, not a gold tube
  // bolted on). The rails are dark; the fissure between them glows sungold. A
  // handful of short cross-cracks branch off it (the cooling-crack read).
  const fissureN = Math.round(seg(9));
  const railL = [], railR = [], crackT = [];
  for (let i = 0; i < fissureN; i++) {
    const t = i / (fissureN - 1);
    const z = -0.95 + t * 2.1;
    const y = topAt(z) + 0.02;
    const w = 0.055 * (1 - 0.5 * t);   // the crack narrows toward the tail
    // bright fissure quad (sungold) between the rails
    crackT.push(
      [[-w, y, z - 0.11], [w, y, z - 0.11], [w, y, z + 0.11]],
      [[-w, y, z - 0.11], [w, y, z + 0.11], [-w, y, z + 0.11]]);
    // dark crust rails flanking it (thin proud ridges)
    railL.push([[-w, y, z - 0.11], [-w - 0.05, y + 0.05, z - 0.11], [-w - 0.05, y + 0.05, z + 0.11]],
      [[-w, y, z - 0.11], [-w - 0.05, y + 0.05, z + 0.11], [-w, y, z + 0.11]]);
    railR.push([[w, y, z - 0.11], [w + 0.05, y + 0.05, z + 0.11], [w + 0.05, y + 0.05, z - 0.11]],
      [[w, y, z - 0.11], [w, y, z + 0.11], [w + 0.05, y + 0.05, z + 0.11]]);
  }
  group.add(flatTriMesh(crackT, M.sungold));
  group.add(flatTriMesh(railL, M.crust));
  group.add(flatTriMesh(railR, M.crust));

  // ── HOT BELLY — a T3 lava-deep underplate along the ventral line (the body runs
  // cooler-but-still-molten underneath; a separate structure from the T2 flanks).
  const bellyT = [];
  for (let i = 0; i < fissureN - 1; i++) {
    const t0 = i / (fissureN - 1), t1 = (i + 1) / (fissureN - 1);
    const z0 = -0.9 + t0 * 1.9, z1 = -0.9 + t1 * 1.9;
    const w0 = halfWidthAt(z0) * 0.5, w1 = halfWidthAt(z1) * 0.5;
    const y0 = TORSO_Y - 0.28 * Math.max(0.2, 1 - Math.abs(z0 + 0.4) / 2.4);
    const y1 = TORSO_Y - 0.28 * Math.max(0.2, 1 - Math.abs(z1 + 0.4) / 2.4);
    bellyT.push([[-w0, y0, z0], [w0, y0, z0], [w1, y1, z1]], [[-w0, y0, z0], [w1, y1, z1], [-w1, y1, z1]]);
  }
  group.add(flatTriMesh(bellyT, M.lava));

  // ── THE MOLTEN HEART (breast) — a crust CALDERA (a dark ring of raised plates)
  // over a T1 glow-pool disk, with (Molten Dancer+) a T0 WHITEHEART core at the
  // apex: the burning heart of the creature. WITHHELD at the whelp (heartScale 0)
  // so the coronation ladder confers it. This is the motif anchor (§6.3).
  const heartScale = model.heartScale ?? 1;
  // Seated LOW on the front keel + tilted to face forward-DOWN, so its fire spills
  // onto the belly and reads as an under-glow from the behind-and-above chase cam
  // (a pure breast disk would face away from it). This is the motif anchor (§6.3).
  const hx = 0, hy = TORSO_Y - 0.04, hz = -1.0;
  const heartG = new THREE.Group();
  heartG.position.set(hx, hy, hz);
  heartG.rotation.x = 0.55;   // face down-and-forward
  group.add(heartG);
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.set(hx, hy, hz);
  group.add(motifAnchor);
  if (heartScale > 0) {
    const R = 0.30 * heartScale, N = seg(10);
    const dp = (r, a, z = 0) => [Math.cos(a) * r, Math.sin(a) * r * 1.05, z];
    // glow-pool disk (recessed slightly so the crust rim shadows its edge = a real caldera)
    const poolT = [];
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
      poolT.push([dp(0, 0, 0.03), dp(R, a0, -0.02), dp(R, a1, -0.02)]);
    }
    heartG.add(flatTriMesh(poolT, M.pool));
    // JAGGED crust caldera rim (a ring of raised dark shard-wedges around the pool,
    // varied depth so it reads as a broken lava-vent collar, not a smooth donut).
    const rimT = [], rimD = [];
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
      const j0 = 1.18 + 0.16 * (Math.sin(i * 3.3) * 0.5 + 0.5), j1 = 1.18 + 0.16 * (Math.sin((i + 1) * 3.3) * 0.5 + 0.5);
      const oy0 = dp(R * j0, a0, 0.06), oy1 = dp(R * j1, a1, 0.06);
      rimT.push([dp(R * 0.94, a0, -0.02), oy0, oy1], [dp(R * 0.94, a0, -0.02), oy1, dp(R * 0.94, a1, -0.02)]);
      rimD.push([oy0, dp(R * j0 * 1.0, a0, -0.04), dp(R * j1 * 1.0, a1, -0.04)], [oy0, dp(R * j1 * 1.0, a1, -0.04), oy1]);   // dark outer bevel
    }
    heartG.add(flatTriMesh(rimT, M.crust));
    heartG.add(flatTriMesh(rimD, M.crustDark));
    // T0 whiteheart core (apex burning point) — Molten Dancer+ via the stage ladder.
    if (M.stage >= 2) {
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.11 * heartScale, 0), M.whiteheart);
      core.position.set(0, 0, 0.06);
      core.scale.set(1, 1.1, 0.8);
      heartG.add(core);
    }
    // SPILL CRACKS — 3 short sungold fissures leaking down from the caldera onto the
    // belly, tying the heart's fire into the body (it's the source, not a decal).
    for (const sa of [-0.6, 0, 0.6]) {
      const spill = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.34 * heartScale), M.sungold);
      spill.position.set(Math.sin(sa) * R * 0.7, -R * 0.7, -0.02);
      spill.rotation.set(-0.5, 0, sa);
      heartG.add(spill);
    }
  }

  // Shoulder fairings — magma fillets from each wing root inboard to the neck base
  // so no background survives between neck and wing roots in the rear-chase read.
  for (const s of [1, -1]) {
    const fair = flatTriMesh([[[s * 0.5, TORSO_Y + 0.34, -0.5], [s * 0.1, TORSO_Y + 0.36, -1.15], [s * 0.46, TORSO_Y + 0.18, -0.3]]], M.magma);
    group.add(fair);
  }

  // Heart-fire core sprite (the powered glow the rig pulses on boost / Surge).
  let coreGlow = null;
  if (heartScale > 0) {
    const lvl = 0.4 + M.stage * 0.2;
    const rgb = '255,150,40';
    coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlow(rgb), transparent: true, opacity: 0.14 + lvl * 0.2,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    coreGlow.scale.setScalar(0.7 + lvl * 0.6);
    coreGlow.position.set(hx, hy, hz - 0.05);
    coreGlow.layers.set(1);
    coreGlow.userData.base = coreGlow.material.opacity;
    group.add(coreGlow);
  }

  // Line-of-action: head high → neck down → level body → tail dips → tip settles.
  const spinePoints = [
    new THREE.Vector3(0, 0.60, -1.90), new THREE.Vector3(0, 0.42, -1.20),
    new THREE.Vector3(0, 0.26, -0.4), new THREE.Vector3(0, 0.24, 0.4),
    new THREE.Vector3(0, 0.16, 1.1), new THREE.Vector3(0, 0.24, 1.9),
  ];
  const attach = {
    wingRoot: (side) => ({ x: (0.5 * bodyScale) * side, y: TORSO_Y + 0.34, z: -0.46 }),
    headBase: { x: 0, y: 0.62, z: -1.98 },
    tailAnchor: { y: 0.16, z: 1.30 },
    keelTopAt: (z) => topAt(z),
    halfWidthAt,
    bodyMidY: TORSO_Y, tailShift: 0,
    riderSocket: { x: 0, y: 0.72, z: -0.2 },
    motifAnchor,
  };
  return { group, attach, spinePoints, spineMats, mats: { bodyMat: M.crust }, coreGlow };
}
registerTorso('moltenPhoenixTorso', buildMoltenPhoenixTorso);

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

// ── WINGS: 'pyreFanWings' ───────────────────────────────────────────────────────
// A broad ARCHED, layer-SHINGLED fan of fire — designed from first principles of a
// powerful raptor/phoenix wing (NOT the retired scythe wing, which read as a
// Wright-brothers biplane of thin struts; NOT Seraph's smooth notchless white
// vault). The four strut-read fixes (build sheet §2), each mapped to a diagnosed
// failure of the scythe wing:
//   1. FILLED surface, real chord: rootChord ~1.55 / halfSpan ~3.3 (0.47 ratio);
//      membrane filled root→t≈0.72, slots only outboard.
//   2. CURVATURE everywhere: the shared exported pyreLeadY/Z profile (used by the
//      geometry AND the FX marker) — no straight line survives more than a station.
//   3. A LIMB, not a spar: the inboard lead is a lofted tapered CRUST arm (one T1
//      top fissure), never a naked full-span metal line.
//   4. LAYERED feather depth: 3 ranks shingled OVER a 3-band membrane — coverts
//      (crust) · secondaries (lava→magma) · primaries (7 fire-blades, terminal
//      dominant pinion ×1.7, one T0 stroke at f3).
// Rear-chase target: a SOLID burning fan with a scalloped dark upper rim — SURFACE,
// not lines. Any full-span 1px line at 250px = FAIL; mistakable for a plane or
// Seraph = FAIL.

// SHARED EXPORTED PROFILE — the ONE source of truth for the leading-edge curve, so
// the vane geometry AND the wingtip FX marker / wingElements tip all agree (else
// the trails detach from the moved tip). t∈[0,1] along the span; hs = half-span.
function pyreLeadY(t, hs, upturn = 1) {
  const base = hs * (0.08 + 0.34 * Math.sin(Math.min(t / 0.82, 1) * Math.PI / 2));
  const up = t > 0.88 ? 0.05 * hs * ((t - 0.88) / 0.12) * upturn : 0;   // last 12% upturn
  return base + up;
}
function pyreLeadZ(t, hs) { return -0.15 + 0.46 * hs * Math.pow(t, 1.6); }   // sweep accelerates outboard

// A CREASED KITE feather/blade — base at `base`, running along `dir` for `len`,
// `wid` wide across `side`, with a raised centre CREASE (two values by flat
// shading: lit face + shadowed crease flank) + an optional flame-lick barb on the
// trailing side. The atom of the shingled ranks + the fire-blade primaries.
function creasedKite(base, dir, side, len, wid, lift, mat, barb = 0, barbMat = null) {
  const B = new THREE.Vector3(base[0], base[1], base[2]);
  const D = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
  const S = new THREE.Vector3(side[0], side[1], side[2]).normalize();
  const N = new THREE.Vector3().crossVectors(D, S).normalize();
  const A = (v) => [v.x, v.y, v.z];
  const tip = B.clone().addScaledVector(D, len);
  const shL = B.clone().addScaledVector(D, len * 0.32).addScaledVector(S, -wid / 2);
  const shR = B.clone().addScaledVector(D, len * 0.32).addScaledVector(S, wid / 2);
  const crease = B.clone().addScaledVector(D, len * 0.5).addScaledVector(N, lift);
  const g = new THREE.Group();
  g.add(flatTriMesh([[A(B), A(shL), A(crease)], [A(B), A(crease), A(shR)], [A(shL), A(tip), A(crease)], [A(crease), A(tip), A(shR)]], mat));
  if (barb > 0 && barbMat) {   // flame-lick barb — a small tongue off the trailing shoulder
    const bt = shR.clone().addScaledVector(D, len * 0.2).addScaledVector(S, barb);
    g.add(flatTriMesh([[A(shR), A(bt), A(tip)]], barbMat));
  }
  return g;
}

function buildOnePyreWing(M, model) {
  const wg = new THREE.Group();
  const hs = 3.3 * (model.spanScale ?? 1);
  const chordScale = model.chordScale ?? 1;
  const upturn = model.upturn ?? 1;
  const hemFire = model.hemFire ?? 1;
  const primaries = Math.round(model.primaries ?? 7);
  const pinionSlots = Math.round(model.pinionSlots ?? 3);
  const pinionDom = (model.pinionDom ?? 1) > 0;
  const secN = Math.round(model.secondaries ?? 10);
  const alulaN = Math.round(model.alula ?? 1) > 0 ? 3 : 0;

  const L = (t) => [t * hs, pyreLeadY(t, hs, upturn), pyreLeadZ(t, hs)];
  const chord = (t) => chordScale * 1.55 * (1 - 0.70 * Math.pow(t, 1.15));
  // membrane point at span t, chord-fraction f (0=lead → 1=trailing), cambered.
  const camberY = (f) => -0.05 - 0.16 * Math.sin(f * Math.PI);
  const MP = (t, f) => { const l = L(t), c = chord(t); return [l[0], l[1] + camberY(f) * c, l[2] + f * c]; };

  // ── (3) THE ARM — a lofted tapered CRUST limb along the inboard lead (t 0→0.45),
  // curved (it rides the lead curve), with one T1 sungold fissure along its top.
  const armTs = [0, 0.15, 0.30, 0.45], armR = [0.15, 0.12, 0.095, 0.07];
  const armRings = armTs.map((t, i) => { const l = L(t); return { z: l[2], rx: armR[i], ry: armR[i] * 1.1, cy: l[1], cx: l[0] }; });
  wg.add(loftRings(armRings, M.crust, seg(6), false));
  // arm fissure (segmented sungold strip on the arm's upper ridge — a crack, not a spar)
  const fisT = [];
  for (let i = 0; i < armTs.length - 1; i++) {
    const a = L(armTs[i]), b = L(armTs[i + 1]), w = 0.02;   // a crack, not a two-tone tube
    fisT.push([[a[0] - w, a[1] + armR[i], a[2]], [a[0] + w, a[1] + armR[i], a[2]], [b[0] + w, b[1] + armR[i + 1], b[2]]],
      [[a[0] - w, a[1] + armR[i], a[2]], [b[0] + w, b[1] + armR[i + 1], b[2]], [b[0] - w, b[1] + armR[i + 1], b[2]]]);
  }
  wg.add(flatTriMesh(fisT, M.sungold));

  // ── (1) THE MEMBRANE — a FILLED cambered surface root→t=0.72, in 3 chord BANDS
  // (lead 0–30% CRUST = the scalloped dark upper rim · mid 30–70% MAGMA = the big
  // glowing surface · hem 70–100% LAVA-DEEP). This is the "solid burning fan", the
  // anti-plane core: a stack of surfaces, not ruled wires.
  const memTs = [0, 0.12, 0.24, 0.36, 0.48, 0.60, 0.72];
  const bands = [[0, 0.30, M.crust], [0.30, 0.70, M.magma], [0.70, 1.0, M.lava]];
  for (let i = 0; i < memTs.length - 1; i++) {
    const t0 = memTs[i], t1 = memTs[i + 1];
    for (const [f0, f1, mat] of bands) {
      const a = MP(t0, f0), b = MP(t1, f0), c = MP(t1, f1), d = MP(t0, f1);
      wg.add(flatTriMesh([[a, b, c], [a, c, d]], mat));
    }
  }
  // continuous T1 hem FIRE STROKE — a thin curved strip tracing the scalloped
  // trailing edge (a DESIGNED accent following the hem, never a straight 1px line).
  if (hemFire > 0) {
    const hemT = [];
    for (let i = 0; i < memTs.length - 1; i++) {
      const t0 = memTs[i], t1 = memTs[i + 1];
      const a = MP(t0, 0.98), b = MP(t1, 0.98), c = MP(t1, 1.06), d = MP(t0, 1.06);
      hemT.push([a, b, c], [a, c, d]);
    }
    const hemMat = M.sungold;
    wg.add(flatTriMesh(hemT, hemMat));
  }

  // ── (4a) COVERTS rank — 8 CRUST shingles along the arm (t 0.05→0.45), overlapping
  // 60%, the scalloped dark shoulder that reads as the wing's upper rim.
  for (let i = 0; i < 8; i++) {
    const t = 0.05 + (i / 7) * 0.40, l = L(t), c = chord(t);
    const len = 0.42 - 0.12 * (i / 7), wid = 0.22 - 0.05 * (i / 7);
    const base = [l[0], l[1] + 0.02, l[2] + 0.12 * c];
    wg.add(creasedKite(base, [0.25, -0.05, 1], [1, 0, 0], len, wid, 0.05, M.crust));
  }

  // ── (4b) SECONDARIES rank — 10 shingles (t 0.10→0.70), 55% overlap, all LAVA-DEEP
  // (a tier DARKER than the T2 magma membrane band, so the rank SEPARATES from the
  // surface it sits on — orange-on-orange was invisible). The mid-chord surface
  // rank so the wing steps root→tip (never a blank inner third).
  for (let i = 0; i < secN; i++) {
    const t = 0.10 + (i / Math.max(1, secN - 1)) * 0.60, l = L(t), c = chord(t);
    const len = 0.55 * c, wid = 0.26 * c;
    const base = [l[0], l[1] - 0.02 * c, l[2] + 0.34 * c];
    wg.add(creasedKite(base, [0.2, -0.1, 1], [1, 0, 0], len, wid, 0.06, M.lava));
  }

  // ── (4c) PRIMARIES — 7 FIRE-BLADES, heat T3→T2→T1, terminal DOMINANT PINION ×1.7
  // (the scale-hierarchy anchor) with one T0 whiteheart stroke at f3. CRITICAL: every
  // blade ROOTS INSIDE the filled membrane (root span clamped ≤0.70) and fans OUT —
  // so no blade floats as a detached island in the rear silhouette (the "loose slat"
  // biplane echo the gate flagged). The outboard SLOTS are the sky-gaps BETWEEN the
  // fanned tips, not gaps at the roots.
  const primLen = [1.00, 1.05, 1.12, 1.20, 1.28, 1.35, 2.30];
  const primMat = [M.lava, M.lava, M.magma, M.magma, M.magma, M.sungold, M.sungold];
  const nP = Math.min(primaries, 7);
  for (let i = 0; i < nP; i++) {
    const isPin = i === 6;
    if (isPin && !pinionDom && nP < 7) continue;
    // root buried in the membrane (span 0.52→0.70), planted at ~60% chord; the blade
    // rakes progressively more outboard for the outer feathers so the TIPS fan/spread.
    const tRoot = 0.52 + (i / 6) * 0.18;
    const rl = L(tRoot), rc = chord(tRoot);
    const len = (isPin && pinionDom ? primLen[6] : primLen[i]) * chordScale;
    const wid = (0.34 - 0.014 * i) * chordScale;
    const dir = [0.30 + 0.22 * (i / 6), -0.1 - 0.05 * (i / 6), 1];   // fan wider outboard, slight droop
    const base = [rl[0], rl[1] - 0.03 * rc, rl[2] + 0.55 * rc];      // seated on the membrane, not the raised lead
    const barb = i >= 2 ? 0.06 * rc : 0;
    wg.add(creasedKite(base, dir, [1, 0, 0], len, wid, 0.07, primMat[i], barb, M.lava));
    // the dominant pinion's T0 whiteheart stroke — INSET from the blade edge + short,
    // so it never escapes the pinion fill (it read as a floating dash at the edge).
    if (isPin && M.stage >= 3) {
      const D = new THREE.Vector3(...dir).normalize();
      const b0 = new THREE.Vector3(...base);
      const p1 = b0.clone().addScaledVector(D, len * 0.28), p2 = b0.clone().addScaledVector(D, len * 0.72);
      const S = new THREE.Vector3(1, 0, 0), N = new THREE.Vector3().crossVectors(D, S).normalize();
      const w = 0.018 * chordScale;
      const q = (p, s) => { const v = p.clone().addScaledVector(S, s).addScaledVector(N, 0.05); return [v.x, v.y, v.z]; };
      wg.add(flatTriMesh([[q(p1, -w), q(p1, w), q(p2, w)], [q(p1, -w), q(p2, w), q(p2, -w)]], M.whiteheart));
    }
  }

  // ── ALULA — 3 small CRUST kite-feathers at the carpal (t≈0.45), raked forward-up
  // (the raptor thumb-tuft that says "real wing").
  for (let i = 0; i < alulaN; i++) {
    const t = 0.43, l = L(t);
    const len = 0.22 - 0.04 * i, wid = 0.1;
    const base = [l[0] - 0.05 * i, l[1] + 0.04, l[2] - 0.02];
    wg.add(creasedKite(base, [-0.15, 0.3, 0.4], [1, 0, 0], len, wid, 0.03, M.crust));
  }
  return wg;
}

function buildPyreFanWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const M = calderaMats(def, model.glowLevel ?? 1, model.igniteStage);
  const hs = 3.3 * (model.spanScale ?? 1);
  const upturn = model.upturn ?? 1;
  const pivots = {}, wingElements = [];
  for (const side of [1, -1]) {
    const root = attach.wingRoot(side);
    const pivot = new THREE.Group();
    pivot.position.set(root.x, root.y, root.z);
    pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);
    mid.add(buildOnePyreWing(M, model));   // canonical +X geometry
    if (side === -1) pivot.scale.x = -1;   // left = mirror → the animator's mirrored poses read SYMMETRIC
    group.add(pivot);
    const s = side === 1 ? 'R' : 'L';
    // FX marker at the TRUE outer tip — via the SAME exported profile the geometry
    // uses (else the wingtip trails + aero-shear detach from the raised tip).
    const marker = new THREE.Object3D();
    const tipY = pyreLeadY(1, hs, upturn), tipZ = pyreLeadZ(1, hs);
    marker.position.set(hs, tipY, tipZ);
    mid.add(marker);
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip;
    pivots['tipMarker' + s] = marker;
    wingElements.push({ root: [root.x, root.y, root.z], tip: [root.x + side * hs, root.y + tipY, root.z + tipZ], length: hs, tipObj: marker });
  }
  return { group, spineMats: [M.magma, M.sungold, M.lava], wingMat: M.magma, parts: { ...pivots, wingElements } };
}
registerWings('pyreFanWings', buildPyreFanWings);

// ── HEAD: 'calderaCrestHead' ────────────────────────────────────────────────────
// The COOLED OBSIDIAN MASK — the coolest station on the creature (heat falls off
// core→extremity, and her fire lives in her chest, so the face is dark cooled
// crust). This anchors the pale-sky silhouette at the leading point (the mask
// never dissolves) and makes the burning heart unambiguously the hottest thing
// (§7 "heat hottest at the heart"). Exactly three lights: two T1 ember EYES, a
// T1 GAPE line, and (from f1) hairline brow cracks. A low swept CASQUE ridge +
// (ladder) a fan of short crust crest-quills each with a sungold fissure heart —
// a crown of cooling cracks, NOT the retired comet crest.
function buildCalderaCrestHead(def, model, mats) {
  const group = new THREE.Group();
  const M = calderaMats(def, glowOf(model), model.igniteStage);
  const spineMats = [M.sungold];
  const hs = model.headScale ?? 1;

  // Faceted obsidian skull in dark T4 CRUST (points −Z). A short raptor wedge —
  // strong brow breaking to a hooked beak, not a pterosaur straw.
  const skull = [
    { z: 0.30, rx: 0.24 * hs, ry: 0.26 * hs, cy: 0.02 },   // occiput
    { z: -0.02, rx: 0.28 * hs, ry: 0.27 * hs, cy: 0.03 },  // brow (widest)
    { z: -0.34, rx: 0.20 * hs, ry: 0.19 * hs, cy: -0.03 }, // cheek
    { z: -0.60, rx: 0.13 * hs, ry: 0.12 * hs, cy: -0.07 }, // muzzle base
  ];
  group.add(loftRings(skull, M.crust, seg(7)));
  const headLength = 1.1 * hs;

  // Hooked CRUST beak (short, raptor), with a T1 sungold GAPE-line where the
  // mandibles part — the mouth of a magma creature glows.
  const upper = spike(0.32 * hs, 0.12 * hs, 0.01, M.crustRim, 6);
  upper.rotation.x = Math.PI / 2 + 0.3;   // points −Z, hooks down
  upper.position.set(0, -0.01 * hs, -0.58 * hs);
  group.add(upper);
  const gape = new THREE.Mesh(new THREE.BoxGeometry(0.13 * hs, 0.02, 0.2 * hs), M.sungold);
  gape.position.set(0, -0.06 * hs, -0.5 * hs);
  gape.rotation.x = 0.2;
  group.add(gape);

  // Ember EYES — T1 sungold almond octahedra, the brightest facial points, deep-
  // set under the brow so they read as a hot gaze in the cool mask.
  const es = model.eyeScale ?? 1;
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xffb42a, emissiveIntensity: 2.4, flatShading: true, roughness: 0.28 });
  eyeMat.userData.baseEmissive = 0xffb42a; eyeMat.userData.baseIntensity = 2.4; spineMats.push(eyeMat);
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.1 * hs * es, 0), eyeMat);
    eye.position.set(side * 0.2 * hs, 0.04 * hs, -0.26 * hs);
    eye.scale.set(1.5, 0.75, 1);
    group.add(eye);
    // hairline BROW CRACK over each eye (arrives f1 with the fissures)
    if (M.stage >= 1) {
      const bc = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.14 * hs), M.sungold);
      bc.position.set(side * 0.18 * hs, 0.15 * hs, -0.14 * hs);
      bc.rotation.y = -side * 0.4;
      group.add(bc);
    }
  }

  // Low swept CASQUE ridge on the crown centerline (present from f1) with one
  // sungold hairline fissure — a cooled crest distinct from the nape glory.
  const motifAnchor = new THREE.Object3D(); motifAnchor.position.set(0, 0.2 * hs, -0.02); group.add(motifAnchor);
  if (M.stage >= 1) {
    const casque = flatTriMesh([
      [[-0.05 * hs, 0.24 * hs, 0.24], [0.05 * hs, 0.24 * hs, 0.24], [0, 0.3 * hs, -0.02]],
      [[-0.05 * hs, 0.24 * hs, 0.24], [0, 0.3 * hs, -0.02], [0, 0.24 * hs, -0.14]],
      [[0.05 * hs, 0.24 * hs, 0.24], [0, 0.24 * hs, -0.14], [0, 0.3 * hs, -0.02]],
    ], M.crust);
    group.add(casque);
    const cf = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.34 * hs), M.sungold);
    cf.position.set(0, 0.285 * hs, 0.06); cf.rotation.x = 0.32;
    group.add(cf);
  }

  // RE-DERIVED CREST — a swept fan of short CRUST quills over the nape, each with
  // a thin sungold fissure down its face (a crown of cooling cracks). Gated by
  // crestFan so the whelp is bare-headed and the crown arrives up the ladder.
  // Held in the SKY ZONE (rakes up-and-back), compact — never crosses the view.
  const crest = Math.round(model.crestFan ?? 0);
  for (let i = 0; i < crest; i++) {
    const a = (i / Math.max(1, crest - 1) - 0.5) * 1.5;   // fan across the crown (sector ~86°)
    const qh = 0.34 * hs * (1 - 0.32 * Math.abs(a) / 0.75) * (model.crestLen ?? 1);
    const q = spike(qh, 0.05 * hs, 0.004, M.crust, 4);
    q.position.set(Math.sin(a) * 0.15 * hs, 0.22 * hs, 0.16 * hs);
    q.rotation.x = 1.05; q.rotation.z = -Math.sin(a) * 0.7;
    group.add(q);
    const fis = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.018, qh * 0.72, seg(3)), M.sungold);
    fis.position.copy(q.position); fis.rotation.copy(q.rotation);
    fis.translateY(qh * 0.36);
    group.add(fis);
  }

  return { group, spineMats, motifAnchor, headLength };
}
registerHead('calderaCrestHead', buildCalderaCrestHead);

// ── TAIL: 'emberWhipTail' ───────────────────────────────────────────────────────
// A thin, near-LEVEL cooling whip — an EXTREMITY, so it is dark cooled crust with
// sungold cracks that DIM toward the tip and a terminal magma SPADE (T2/T1, never
// T0): kept a tier cooler than the breast so the molten heart stays the single
// hottest point from the chase cam (the CP1-critic carry-forward). Near-level +
// thin so it adds ~zero mass to the lower-centre corridor (the visibility law).
// A 4-segment nested chain (rotation-only bone) gives the idle coil without
// tearing the loft; the warm ember WAKE is the engine's sparse motes (archetype).
function buildEmberWhipTail(def, model, _mats, anchor) {
  const group = new THREE.Group();
  const M = calderaMats(def, model.glowLevel ?? 1, model.igniteStage);
  const a = anchor ?? { y: 0.16, z: 1.30 };
  const nSeg = Math.round(model.tailSegments ?? 7);
  const T = (model.tailLength ?? 1) * 2.4;
  const rootR = 0.13;
  const curveY = (t) => -0.06 * T * Math.sin(Math.PI * t * 0.8) + 0.10 * T * t;
  const rAt = (t) => rootR * Math.pow(1 - t * 0.92, 0.8) + 0.012;
  const P = (t) => ({ y: a.y + curveY(t), z: a.z + t * T, r: rAt(t) });

  const nChain = 4;
  const segs = [];
  let parent = group, prev = { y: 0, z: 0 };
  const jointT = (s) => Math.round(s * nSeg / nChain) / nSeg;
  for (let s = 0; s < nChain; s++) {
    const i0 = Math.round(s * nSeg / nChain), i1 = Math.round((s + 1) * nSeg / nChain);
    const j = P(jointT(s));
    const sg = new THREE.Group();
    sg.position.set(0, j.y - prev.y, j.z - prev.z);
    parent.add(sg);
    const local = [];
    for (let i = i0; i <= i1; i++) { const p = P(i / nSeg); local.push({ z: p.z - j.z, rx: p.r, ry: p.r, cy: p.y - j.y }); }
    sg.add(loftRings(local, M.crust, seg(6), false));
    segs.push(sg); parent = sg; prev = j;
  }
  segs[0].isBone = true;   // ROTATION-driven idle coil (never tears the loft)

  // Dorsal sungold CRACKS down the tail ridge — dimming toward the tip (cooling).
  for (let i = 0; i < Math.round(seg(6)); i++) {
    const t = 0.08 + (i / Math.round(seg(6))) * 0.82, p = P(t);
    const si = Math.min(nChain - 1, Math.floor(t * nChain)), sj = P(jointT(si));
    const w = 0.03 * (1 - 0.6 * t);
    const cr = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, 0.16 * (1 - 0.4 * t)), M.sungold);
    cr.position.set(0, p.y - sj.y + p.r, p.z - sj.z);
    segs[si].add(cr);
  }

  // Dorsal EMBER-FINS (T3 lava) — a crescent sail per station, canted ±13° about
  // vertical so the bright hem catches the rear-chase cam (a pure-dorsal fin sits
  // edge-on to it). Alternating cant keeps the row balanced. Held to t≤0.7.
  const fins = Math.round(model.tailFins ?? 4);
  for (let k = 0; k < fins; k++) {
    const t = 0.12 + 0.55 * (k / Math.max(1, fins - 1)), p = P(t), rr = p.r;
    const si = Math.min(nChain - 1, Math.floor(t * nChain)), sj = P(jointT(si));
    const fh = (2 * rr + 0.05) * 2.0 * Math.pow(0.9, k);
    const yaw = (k % 2 ? -1 : 1) * 0.23;
    const bx = 0, by = p.y - sj.y + rr, bz = p.z - sj.z;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const rot = (px, pz) => [bx + (px - bx) * cy + (pz - bz) * sy, bz - (px - bx) * sy + (pz - bz) * cy];
    const [lx, lz] = rot(bx, bz - rr * 0.7), [tx, tz] = rot(bx, bz + rr * 1.3);
    const [mx, mz] = rot(bx, bz + rr * 0.4 + fh * 0.15), [ax, az] = rot(bx, bz + fh * 0.3);
    segs[si].add(flatTriMesh([[[lx, by, lz], [tx, by, tz], [mx, by + fh * 0.55, mz]]], M.lava));
    segs[si].add(flatTriMesh([[[lx, by, lz], [mx, by + fh * 0.55, mz], [ax, by + fh, az]]], M.sungold));
  }

  // Terminal MAGMA SPADE — the tail's hottest point (T2 kite + a T1 crack), still a
  // tier below the T0 heart. A leaf-blade that reads from the side/rear-¾.
  const tip = P(1), tj = P(jointT(nChain - 1)), tg = segs[nChain - 1];
  const ty = tip.y - tj.y, tz = tip.z - tj.z;
  const spadeMat = M.magma;
  tg.add(creasedKite([0, ty, tz], [0, 0.05, 1], [1, 0, 0], 0.55 * (model.tailLength ?? 1), 0.28, 0.06, spadeMat, 0, null));
  const spadeCrack = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.03, 0.42, seg(3)), M.sungold);
  spadeCrack.position.set(0, ty + 0.02, tz + 0.24); spadeCrack.rotation.x = Math.PI / 2 + 0.05;
  tg.add(spadeCrack);

  return { group, segs, accentMats: [M.sungold, M.lava, M.magma] };
}
registerTail('emberWhipTail', buildEmberWhipTail);

function glowOf(model) { return model.glowLevel ?? 1; }
