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
  const bodyI = [0.22, 0.46, 0.64, 0.8][st] * g;    // body-field FIRE glow (whole creature burns)

  // T1 GOLDFIRE — the big glowing BODY FIELD (the whole creature BURNS). The diffuse is
  // DARKENED so the saturated goldfire EMISSIVE dominates → the body reads as a glowing EMBER,
  // not a flat mustard-gold plane (the critic's "body doesn't catch fire"). `ivory` key so the
  // torso/head/collar all glow fire. Form-laddered: dark cinder chick → white-hot goldfire.
  const fieldCol = new THREE.Color(def.body ?? 0x8a5514).multiplyScalar(0.4);   // DARK ember → the emissive fire dominates the form
  const fieldEmis = st === 0 ? 0x8a2606 : 0xe07818;   // hot ORANGE-gold ember glow (reads as fire, not a gold plane)
  const bodyGlow = [0.4, 0.85, 1.2, 1.5][st] * g;     // the body itself BURNS (emissive-dominant); raised so the warm emissive keeps G>B at grazing rim angles → no rose on the back/flank in a zoom
  // roughness up + no metalness → the cool rim light can add NO specular blue sheen; the raised warm
  // emissive keeps the field on the fire ramp even where the rim grazes it (the wing-zoom rose fix).
  const ivory = new THREE.MeshStandardMaterial({ color: fieldCol, emissive: fieldEmis, emissiveIntensity: bodyGlow, flatShading: true, roughness: 0.85, metalness: 0.0, side: THREE.DoubleSide });
  ivory.userData.baseEmissive = fieldEmis; ivory.userData.baseIntensity = bodyGlow;
  // GOLDFIRE (the HOT gold-white core, for the inner wing membrane + flame-feather hot roots).
  // Pushed genuinely bright + hot-hued so the roots read WHITE/GOLD-HOT (the refs' incandescent
  // hearts), the cool crimson tips reading against it → real combustion, not matte tan.
  const gfEmis = def.goldfire ?? 0xffbe4a;
  const goldfire = new THREE.MeshStandardMaterial({ color: 0xc07818, emissive: gfEmis, emissiveIntensity: Math.max(bodyI, 0.5 + 0.22 * st) * g, flatShading: true, roughness: 0.42, metalness: 0.05, side: THREE.DoubleSide });
  goldfire.userData.baseEmissive = gfEmis; goldfire.userData.baseIntensity = goldfire.emissiveIntensity;

  // T2 FLAME — mid heat (mid-wing flame-feathers, dorsal licks, warm underwing).
  const flameCol = def.flame ?? 0xd9541a;
  const flame = new THREE.MeshStandardMaterial({ color: 0x6e2a0e, emissive: flameCol, emissiveIntensity: [0.28, 0.5, 0.78, 0.98][st] * g, flatShading: true, roughness: 0.52, metalness: 0.04, side: THREE.DoubleSide });
  flame.userData.baseEmissive = flameCol; flame.userData.baseIntensity = flame.emissiveIntensity;

  // T3 CRIMSON — the cool SHEATH (outer flame-feather tips, aft ribbon tips). A pure RED-ORANGE
  // with the BLUE channel driven to ~zero, so the cool rim light can't pull it toward rose/pink on
  // a thin edge-on facet (the recurring "pink wire" veto). The cool END of the fire ramp is still
  // a deep hot red, never a magenta. Separable third hue, anchors a pale sky.
  const crimCol = def.crimson ?? 0xd8500e;
  const crimson = new THREE.MeshStandardMaterial({ color: 0x5c1a04, emissive: crimCol, emissiveIntensity: [0.3, 0.5, 0.74, 0.9][st] * g, flatShading: true, roughness: 0.6, metalness: 0.0, side: THREE.DoubleSide });
  crimson.userData.baseEmissive = crimCol; crimson.userData.baseIntensity = crimson.emissiveIntensity;

  // T4 GARNET / EMBER-SHADOW — the dark RIM on every facet edge (the "dark on the rims" that
  // crisps a bright fire body) + belly/seam relief. A whisper of ember so it never dead-blacks.
  const garnet = new THREE.MeshStandardMaterial({ color: def.belly ?? 0x3a1208, emissive: 0x1a0804, emissiveIntensity: 0.1, flatShading: true, roughness: 0.84, metalness: 0.05, side: THREE.DoubleSide });
  const emberShadow = garnet;

  // WARM-EMBER BELLY — the cool END of the body's vertical fire gradient (dark ventral field), but
  // built pink-PROOF: a dark warm-red diffuse with an orange emissive FLOOR and roughness 1 (no
  // specular) so the cool rim can register nothing → it reads deep ember, never the rose a lit
  // saturated crimson belly pulled under the rim.
  const emberBelly = new THREE.MeshStandardMaterial({ color: 0x3a1206, emissive: 0x8a2c08, emissiveIntensity: 0.45 * g, flatShading: true, roughness: 1.0, metalness: 0.0, side: THREE.DoubleSide });
  emberBelly.userData.baseEmissive = 0x8a2c08; emberBelly.userData.baseIntensity = emberBelly.emissiveIntensity;

  // DARK WARM UNDERWING (`bronze` key) — the wing belly backing + feather roots. Kept a
  // RECESSIVE dark warm ember (not a glowing red plank) so it never competes with the fire-
  // feathers on top; warm + a small emissive floor so a shadowed facet reads warm, not black.
  const bronze = new THREE.MeshStandardMaterial({ color: 0x6e3616, emissive: 0x8a4410, emissiveIntensity: 0.4, flatShading: true, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });
  bronze.userData.baseEmissive = 0x8a4410; bronze.userData.baseIntensity = bronze.emissiveIntensity;

  // T2 GOLD — the forged REGALIA (beak, crown + collar shafts, vertebral ridge). Low metalness +
  // a WARM AMBER emissive FLOOR so a flat-shaded unlit facet glows amber, never the dead OLIVE/
  // KHAKI a metalness-heavy gold collapses to edge-on (the critic's "mud is the anti-fire colour").
  const goldCol = def.horn ?? 0xf2b64c;
  const gold = new THREE.MeshStandardMaterial({ color: goldCol, emissive: 0xa05e12, emissiveIntensity: 0.34 + 0.16 * st, flatShading: true, roughness: 0.4, metalness: 0.12, side: THREE.DoubleSide });
  gold.userData.baseEmissive = 0x7a4a10; gold.userData.baseIntensity = gold.emissiveIntensity;

  // T3 WARM-AMBER rim (feather edges, hems). EMISSIVE-DOMINANT amber over a DARK diffuse with
  // roughness up (no cool specular): the old salmon DIFFUSE (0xff8a34) was exactly what the cool
  // rim pulled to rose in the wing-root/collar zoom — a bright warm EDGE, now on a pink-proof
  // dark-diffuse + amber-emissive basis so no rim can register blue on it.
  const roseGold = new THREE.MeshStandardMaterial({ color: 0x4a1c06, emissive: 0xffa334, emissiveIntensity: 0.5 + 0.16 * st, flatShading: true, roughness: 0.9, metalness: 0.0, side: THREE.DoubleSide });
  roseGold.userData.baseEmissive = 0xffa334; roseGold.userData.baseIntensity = roseGold.emissiveIntensity;

  // SATURATED ORANGE emissive — the hottest flame-tip hue (flame-feather points, hems).
  const orangeCol = def.wingEmissive ?? 0xff7a1a;
  const orange = new THREE.MeshStandardMaterial({ color: 0x4a1c06, emissive: orangeCol, emissiveIntensity: (0.6 + 0.5 * st) * g, flatShading: true, roughness: 0.5, metalness: 0.04, side: THREE.DoubleSide });
  orange.userData.baseEmissive = orangeCol; orange.userData.baseIntensity = orange.emissiveIntensity;

  // T0 HOT-CORE — the heart (the hottest register). Kept an incandescent AMBER, NOT pure white, and its
  // intensity trimmed at apex, so on Surge the chest reads as the white-HOT heart of a FIRE, not a
  // celestial-white flashbang that blooms over the whole bird (the tacky-prototype look we're leaving).
  const heartEmis = [orangeCol, 0xffb060, 0xffd89a, 0xffd59a][st];
  const heartI = [0.6, 1.6, 2.4, 2.7][st] * g;
  const heart = new THREE.MeshStandardMaterial({ color: 0xffe8c0, emissive: heartEmis, emissiveIntensity: heartI, flatShading: true, roughness: 0.3, metalness: 0.05 });

  // HOT-RIBBON ramp — dedicated near-pure-EMISSIVE fire materials for the free-STREAMING ribbons
  // (the tail comet + the wing trailing streamers). A near-black diffuse + roughness 1 (no specular)
  // means the studio's COOL RIM light can register NOTHING on them → they read as self-lit fire on
  // the warm gold→orange ramp, never the salmon/pink the rim was pulling off a lit red diffuse (the
  // recurring pink veto — decisively killed by removing the lit surface, not just re-hueing it).
  const ribI = 1.15 + 0.28 * st;
  const ribMat = (emis, k) => { const m = new THREE.MeshStandardMaterial({ color: 0x2e0f04, emissive: emis, emissiveIntensity: ribI * k * g, flatShading: true, roughness: 1.0, metalness: 0.0, side: THREE.DoubleSide }); m.userData.baseEmissive = emis; m.userData.baseIntensity = m.emissiveIntensity; return m; };
  const hotRibbon = [ribMat(0xffbe4a, 1.0), ribMat(0xff8a20, 1.05), ribMat(0xf25410, 1.0)];

  // Eyes — white-hot gold, the brightest facial points.
  const eyeCol = def.eye ?? 0xffd07a;
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xfff2c8, emissive: eyeCol, emissiveIntensity: (1.1 + 0.3 * st) * g, flatShading: true, roughness: 0.28 });
  eyeMat.userData.baseEmissive = eyeCol; eyeMat.userData.baseIntensity = eyeMat.emissiveIntensity;

  // ── SURGE FLARE WEIGHTS ("Rebirth Ignition" composition) — scale each mat's Surge-delta so the
  // WINGS read as the hero (majority lights up, tip-hot → pours into the ember trail) while the BODY
  // reads as bright ACCENT strokes over a warm field, not a detonating slab. A weight only bites on the
  // mats a part actually PUBLISHES into spineMats (torso publishes its palette; wings publish hotRibbon +
  // membrane below), so these role-weights ride the right instances without a per-part switch. The heart
  // core is OUT of spineMats → it stays the single hottest apex point untouched.
  const flareW = (m, c, i) => { m.userData.flareColorWeight = c; m.userData.flareIntensityWeight = i; };
  //          material          COLOUR→surgeHi   INTENSITY gain
  flareW(ivory,    0.4,  0.05);   // body FIELD: shifts hot-orange as an accent, near-flat intensity (no slab bloom)
  flareW(goldfire, 0.6,  0.1);    // hot feather-roots shift hotter but hold intensity (already bright)
  flareW(flame,    0.5,  0.15);
  flareW(crimson,  0.45, 0.15);
  flareW(gold,     0.75, 0.35); flareW(roseGold, 0.75, 0.35); flareW(orange, 0.7, 0.3);   // ridge/collar/hems = hot strokes, modest intensity
  // Wing feather/streamer fire (hotRibbon) is ALREADY at the bloom ceiling (base ~2.0) → hot-shift the
  // COLOUR toward gold (tip-hottest) but keep the intensity gain SMALL so it hot-tips instead of white-out.
  // The wing feathers sit at the bloom ceiling at rest, so the elevated Surge-frame exposure (wash + core
  // bloom) clips them to white. Shift them to the saturated hot-ORANGE surgeHi AND actively DIM them
  // (negative intensity) so the broad wings stay READABLE fire instead of white sheets.
  // hotRibbon[0] is a bright GOLD (high green) that clips to white first → shift it HARD to the saturated
  // orange surgeHi + dim most; [2] is already deep orange (bloom-safe) → keep it vivid. Net: the wings
  // read as INTENSE saturated fire on Surge, not white sheets.
  flareW(hotRibbon[0], 0.85, -0.65); flareW(hotRibbon[1], 0.78, -0.5); flareW(hotRibbon[2], 0.7, -0.25);
  return { ivory, goldfire, flame, crimson, garnet, emberShadow, emberBelly, bronze, gold, roseGold, orange, heart, eyeMat, hotRibbon, stage: st, glow: g };
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
function flameFeather(base, dir, side, len, wid, curve, matRamp, curl = 0, opts = {}) {
  const B = new THREE.Vector3(base[0], base[1], base[2]);
  const D = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
  const S = new THREE.Vector3(side[0], side[1], side[2]).normalize();
  const Nn = new THREE.Vector3().crossVectors(D, S).normalize();
  const A = (v) => [v.x, v.y, v.z];
  const SEG = opts.seg ?? 4;       // ≥5 renders the sin belly as a real CURVE (not a piecewise spear)
  const tipW = opts.tipW ?? 0;     // >0 → a rounded flame-TONGUE lobe of width ~tipW·wid (kills the needle pike)
  const flick = opts.flick ?? 0;   // signed lateral S-jog of the last 30% → tips diverge, not parallel spears
  const wave = opts.wave ?? null;  // {amp,cycles,phase} → a lateral SINE undulation (root-anchored) → not arrow-straight
  const flare = opts.flare ?? 0;   // >0 → the tip breathes OUTWARD (along Nn) past 70% instead of pinching to a point
  const g = new THREE.Group();
  // width. tipW==0 → the classic needle taper (byte-identical default: mane/flank untouched). tipW>0 →
  // a leaf/tongue: lobe-width tipW·wid at root AND tip, belly to wid at ~40% → a flame tongue, not a spike.
  const wAt = (u) => tipW > 0
    ? wid * (tipW + (1 - tipW) * Math.sin(Math.PI * Math.min(u * 1.08, 1)))
    : wid * (0.30 + 0.70 * Math.sin(Math.PI * Math.min(u * 1.15, 1))) * Math.pow(1 - u, 0.5);
  // centreline: straight run + a gentle S bow along the normal + a terminal curl (aft-up) + an
  // optional terminal lateral FLICK so a rank's tips splay organically instead of aiming in parallel.
  const ctr = (u) => {
    const bow = Math.sin(Math.PI * u) * curve;
    const cu = u > 0.65 ? curl * Math.pow((u - 0.65) / 0.35, 1.4) : 0;
    const fr = flare && u > 0.70 ? flare * len * Math.pow((u - 0.70) / 0.30, 2) : 0;
    const fl = flick && u > 0.70 ? flick * len * Math.pow((u - 0.70) / 0.30, 1.5) : 0;
    const wv = wave ? wave.amp * len * Math.sin(2 * Math.PI * wave.cycles * u + (wave.phase || 0)) * Math.pow(u, 1.5) : 0;
    return B.clone().addScaledVector(D, len * u).addScaledVector(Nn, bow + cu + fr).addScaledVector(S, fl + wv);
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
  // rounded flame-tongue LOBE cap (only when tipW>0): a SHORT wide nub closes the tip → a licked lobe.
  if (tipW > 0) {
    const cc = ctr(1), w1 = wAt(1);
    const cl = cc.clone().addScaledVector(S, -w1 / 2), cr = cc.clone().addScaledVector(S, w1 / 2);
    const apex = cc.clone().addScaledVector(D, 0.5 * w1).addScaledVector(Nn, 0.04 * wid);
    g.add(flatTriMesh([[A(cl), A(apex), A(cr)]], mat(0.99)));
  }
  return { group: g, tip: A(ctr(1)) };
}

// ── A FLAME RANK — a SHINGLED row of flame-tongues along a root curve u∈[0,1]. The overlap is
// guaranteed BY CONSTRUCTION: each tongue's width = local root spacing / (1−ovl), so adjacent lobes
// interleave into a CONTINUOUS fiery vane (no sky between them, no separated pikes) — the ≥55%-overlap
// shingle contract banked for kite-feathers, now in ONE place. Deterministic: flick alternates by index
// (no RNG → wing symmetry stays Δ0). rootAt(u)/dirAt(u)→[x,y,z]; lenAt(u)→n; rampAt(u)→[mats].
function flameRank(n, rootAt, dirAt, side, lenAt, rampAt, opts = {}) {
  const { ovl = 0.55, curve = 0.12, curl = 0.05, flickAmp = 0.05, lift = 0, seg = 5, tipW = 0.26 } = opts;
  const group = new THREE.Group();
  const tips = [];
  const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
  const step = n > 1 ? 1 / (n - 1) : 1;
  for (let i = 0; i < n; i++) {
    const u = n > 1 ? i / (n - 1) : 0.5;
    const base = rootAt(u);
    const uNb = u + step <= 1 ? u + step : u - step;               // nearest neighbour root
    const spacing = n > 1 ? V(rootAt(u)).distanceTo(V(rootAt(uNb))) : 0.3;
    const w = Math.max(0.04, spacing / (1 - ovl));                 // width → ovl overlap with the neighbour
    const bp = [base[0], base[1] + lift, base[2]];
    const flick = flickAmp * (i % 2 ? 1 : -1);
    const f = flameFeather(bp, dirAt(u), side, lenAt(u), w, curve, rampAt(u), curl, { seg, tipW, flick });
    group.add(f.group);
    tips.push(f.tip);
  }
  return { group, tips };
}

// ── A FLAME PLUME — a RADIAL sheaf of flame-tongues arranged around an AXIS on an upward-biased egg
// ring, all converging on a GATHER point with a consistent-handed helical twist → a hollow CONE of
// fire that has real 3-D volume from every camera (a teardrop that swells, waists, then tapers), not a
// flat fan. Corridor-SAFE BY CONSTRUCTION: the outward bow is clamped toward zero in the belly sector
// (cosφ<0) so no ribbon can bow DOWN through the floor, the arc leaves a gap at pure-bottom, and the
// axis climbs. Callbacks receive cosφ (1=crown/top → −1=belly/bottom). Deterministic (index math).
function flamePlume(n, base, axis, opts = {}) {
  const { rx = 0.26, ryUp = 0.30, ryDn = 0.14, arcDeg = 310, gatherK = 0.75, baseLen = 1,
    twist = 0.08, curve = 0.16, curl = 0.10, tipW = 0.26, seg = 6, flickAmp = 0.05,
    clumpAmp = 0, waveAmp = 0, waveCycles = 1.2, flare = 0,
    lenAt = () => 1, widAt = () => 0.4, rampAt = () => [] } = opts;
  const B = new THREE.Vector3(base[0], base[1], base[2]);
  const Ax = new THREE.Vector3(axis[0], axis[1], axis[2]).normalize();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), Ax).normalize();  // ≈ +x
  const up = new THREE.Vector3().crossVectors(Ax, right).normalize();                           // ≈ +y ⟂ axis (points UP → belly clamp works)
  const gather = B.clone().addScaledVector(Ax, gatherK * baseLen);
  const group = new THREE.Group();
  const tips = [];
  const A = (v) => [v.x, v.y, v.z];
  const arc = arcDeg * Math.PI / 180;
  for (let i = 0; i < n; i++) {
    const frac = n > 1 ? i / (n - 1) : 0.5;
    let phi = (frac - 0.5) * arc;                   // −arc/2 … +arc/2, 0 = crown (top)
    if (clumpAmp) phi += clumpAmp * Math.sin(2.6 * phi);   // clump/part the even spacing — ODD in φ → stays mirror-symmetric
    const c = Math.cos(phi), s = Math.sin(phi);
    const bc = 0.35 + 0.65 * Math.max(0, c);        // belly clamp: 1 at crown → 0.35 at belly (the corridor guard)
    const ry = c >= 0 ? ryUp : ryDn;
    const ringPt = B.clone().addScaledVector(right, rx * s).addScaledVector(up, ry * c);
    const radial = new THREE.Vector3().addScaledVector(right, rx * s).addScaledVector(up, ry * c).normalize();
    const tangent = new THREE.Vector3().crossVectors(Ax, radial).normalize();
    const dir = gather.clone().sub(ringPt).normalize().addScaledVector(tangent, twist).normalize();
    const side = tangent.clone().negate();          // Nn = cross(dir,side) points ~radially OUTWARD
    const cv = curve * bc;                           // outward bow clamped in the belly → corridor guard
    const flick = flickAmp * (s >= 0 ? 1 : -1);          // MIRROR-symmetric (by side, not index) → the plume reads balanced in rear-chase
    const wave = waveAmp ? { amp: waveAmp * bc, cycles: waveCycles, phase: s >= 0 ? 0 : Math.PI } : null;   // lateral undulation, belly-clamped, L/R mirrored
    const f = flameFeather(A(ringPt), A(dir), A(side), lenAt(c), widAt(c), cv, rampAt(c), curl,
      { seg, tipW, flick, wave, flare: flare * bc });
    group.add(f.group);
    tips.push(f.tip);
  }
  return { group, tips };
}

// ── TORSO: 'sunhawk' → 'sunhawkKeelTorso' ────────────────────────────────────────
// THE #1 FIX. A lofted, keeled, characterful firebird — NOT a sphere-chain. Forward-
// anchored: the proud breast is the visual prow. ~8 sculpted stations (§2 table),
// dialled by keelDepth + neckArch so the ladder grows the sculpt (not scale).
function buildSunhawkKeelTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const M = sunhawkMats(def, model.glowLevel ?? 1, model.igniteStage);
  const spineMats = [M.ivory, M.goldfire, M.flame, M.crimson, M.gold, M.roseGold, M.orange];   // the whole body flares on Surge
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
  group.add(flatTriMesh(bellyT, M.emberBelly));   // deep warm-ember belly → the cool end of the vertical fire gradient, pink-proof (see emberBelly)

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
    // FLANK FIRE-COAT — TWO rows of flame-licks wrapping the flank (upper + lower) from neck to
    // haunch, so the whole BODY is wreathed in fire (owner: whole creature catches fire), not a
    // gold slab with a mane. Hue cools head→tail; the licks stream aft along the body.
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 6; i++) {
        const z = -1.05 + i * 0.36, u = i / 5;
        const w = halfWidthAt(z) * (0.88 - 0.22 * row);
        const y = (botAt(z) + topAt(z)) * 0.5 + (row === 0 ? 0.10 : -0.12);
        const ramp = u < 0.5 ? [M.hotRibbon[0], M.hotRibbon[1], M.hotRibbon[1]] : [M.hotRibbon[1], M.hotRibbon[2], M.hotRibbon[2]];   // pure-emissive fire → no pink under the cool rim, and it GLOWS in the dark chase view
        group.add(flameFeather([s * w, y, z], [s * 0.30, 0.04, 1], [s * 0.2, 0.5, 0], 0.40 - 0.1 * u, 0.13, 0.05, ramp, 0.03).group);
      }
    }
  }

  // ── THE DORSAL FLAME-MANE — a row of flame-licks running down the SPINE (nape → tail-root),
  // so the BODY ITSELF is alight (a fire crest), the fire reading across the whole mass, not
  // just the wing edges (the critic's "body doesn't catch fire"). Hue cools head→tail
  // (goldfire → flame → crimson); each lick rakes up-and-back with a slight alternating cant.
  const nMane = seg(9);
  for (let i = 0; i < nMane; i++) {
    const t = nMane > 1 ? i / (nMane - 1) : 0;
    const z = -1.05 + t * 2.35, y = topAt(z);
    const len = (0.40 - 0.14 * t) * (0.7 + 0.3 * Math.sin(Math.PI * Math.min(t * 1.2, 1)));
    const ramp = t < 0.38 ? [M.hotRibbon[0], M.hotRibbon[0], M.hotRibbon[1]] : t < 0.72 ? [M.hotRibbon[0], M.hotRibbon[1], M.hotRibbon[2]] : [M.hotRibbon[1], M.hotRibbon[2], M.hotRibbon[2]];   // pure-emissive fire (pink-proof + glows in dark)
    // Rake the licks strongly AFT (more +z than +y) so the mane reads as fire STREAMING back down
    // the spine, not a row of vertical spikes / a dorsal shark-fin from behind (the critic's note).
    group.add(flameFeather([Math.sin(i * 1.4) * 0.05, y, z], [Math.sin(i * 1.4) * 0.20, 0.46, 0.90], [1, 0, 0], len, 0.11, 0.06, ramp, 0.05).group);
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
    map: makeGlow('255,150,60'), transparent: true, opacity: 0.07 + lvl * 0.08,   // warmer ORANGE + dimmer → a fire-core glow, not a white chest-explosion the Surge blooms out
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  coreGlow.scale.setScalar(0.38 + lvl * 0.3);   // smaller footprint so the Surge spike stays a hot core, not a bloom bomb over the wings
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
  // The rig unconditionally drives `mats.bodyMat.emissiveIntensity` toward a GENERIC body-glow target
  // (0.12 cruise / 0.35 fever, 0 on reset) every frame — and that write lands AFTER the spineMats
  // restore loop. If bodyMat were `M.ivory` (the body FIRE field, base up to 1.5, also in spineMats),
  // that generic write would clamp the "whole creature burns" glow down to 0.12 in gameplay even though
  // the static preview looks correct. So hand the rig an INERT control material (attached to no
  // geometry): the drive/reset writes there harmlessly, and `ivory` keeps its per-form fire intensity
  // via spineMats. bodyControl exists only to absorb the rig's body-glow write.
  const bodyControl = new THREE.MeshStandardMaterial();
  return { group, attach, spinePoints, spineMats, mats: { bodyMat: bodyControl, eyeMat: M.eyeMat }, coreGlow };
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

  // Lofted ivory wedge skull (points −Z) — flat brow → a raptor muzzle that TAPERS to a fine snout
  // (not the blunt boxy muzzle-block that flirted with an ungulate read): the cheek/muzzle rings are
  // narrowed and a fine snout-tip ring carries the face to a point, seating the hooked beak.
  const skull = [
    { z: 0.24, rx: 0.19 * hs, ry: 0.20 * hs, cy: 0.02 },   // occiput
    { z: -0.02, rx: 0.22 * hs, ry: 0.22 * hs, cy: 0.03 },  // brow (widest)
    { z: -0.28, rx: 0.13 * hs, ry: 0.125 * hs, cy: -0.02 },// cheek (narrowed)
    { z: -0.46, rx: 0.075 * hs, ry: 0.065 * hs, cy: -0.05 },// muzzle (tapering)
    { z: -0.60, rx: 0.032 * hs, ry: 0.030 * hs, cy: -0.075 },// fine snout tip → raptor point
  ];
  group.add(loftRings(skull, M.ivory, seg(7)));
  const headLength = 1.0 * hs;

  // Short HOOKED gold beak — upper hooks over lower (two beveled facets), regal raptor. Seated at the
  // new fine snout tip so the gold beak reads as the continuation of a tapering raptor face.
  const upper = spike(0.28 * hs, 0.075 * hs, 0.005, M.gold, 6);
  upper.rotation.x = Math.PI / 2 + 0.34;   // points −Z, hooks down
  upper.position.set(0, -0.02 * hs, -0.60 * hs);
  group.add(upper);
  const lower = spike(0.15 * hs, 0.05 * hs, 0.008, M.gold, 5);
  lower.rotation.x = Math.PI / 2 + 0.12;
  lower.position.set(0, -0.09 * hs, -0.56 * hs);
  group.add(lower);

  // Warm gold EYES — the brightest facial points bar the collar, deep-set under the brow. A small
  // dark ember PUPIL sits in front of each (the critic's "flat white lozenge, no pupil, no life"),
  // giving the SSSR head a focused predatory read instead of a blank diamond.
  const es = model.eyeScale ?? 1;
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.072 * hs * es, 0), M.eyeMat);
    eye.position.set(side * 0.16 * hs, 0.04 * hs, -0.21 * hs);
    eye.scale.set(1.3, 0.9, 1);
    group.add(eye);
    // pupil sits slightly PROUD of the eye centre (same z-plane, nudged out) so it reads as a pupil
    // WITHIN the white, not a second diamond beside it (the r24 "two-diamond" read).
    const pupil = new THREE.Mesh(new THREE.OctahedronGeometry(0.05 * hs * es, 0), M.emberShadow);
    pupil.position.set(side * 0.175 * hs, 0.042 * hs, -0.235 * hs);
    pupil.scale.set(0.9, 1.25, 0.7);
    group.add(pupil);
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
// A RAPTOR ogee: bows FORWARD (−z) at mid-span then sweeps aft to the tip — a curved leading edge,
// not the two-segment straight bar the critic flagged. The forward bow term (−sin) peaks mid, dies
// at root+tip; the base term still sweeps the tip aft. FX marker rides the same curve.
export function sunLeadZ(t, hs) { return -0.05 + 0.42 * hs * Math.pow(t, 1.15) - 0.16 * hs * Math.sin(Math.PI * t); }

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

  // ── THE LEADING RIDGE — a SLIM hot ridge along the inner lead (replaces the old fat gold spar
  // "plank" the critic flagged): a thin near-white→amber emissive line that reads as the incandescent
  // leading EDGE of a burning wing, not a dark box-bar. Tapers to nothing by mid-span.
  const ridgeTs = [0, 0.16, 0.34, 0.52], ridgeR = [0.055, 0.045, 0.032, 0.016];
  const ridgeRings = ridgeTs.map((t, i) => { const l = L(t); return { z: l[2], rx: ridgeR[i] * ws, ry: ridgeR[i] * 1.4 * ws, cy: l[1], cx: l[0] }; });
  wg.add(loftRings(ridgeRings, M.hotRibbon[0], seg(5), false));   // pure-emissive hot gold (pink-proof, like the rest of the fire)

  // ── INNER FIRE MEMBRANE — the glowing web backing the inner+mid wing (span 0→0.62), with a REAL
  // 2-D heat GRADIENT (hot goldfire at the leading root → flame → crimson at the outboard trailing
  // corner) so the inner wing is not the "single flat matte-yellow value" the critic saw. Top vane +
  // bottom skin (thickness = the anti-plank). It runs OUT to 0.62 so it overlaps the feather roots →
  // no bald panel/streamer SEAM (the critic's "two disconnected objects").
  const HEM = 0.78;                                  // membrane trailing hem pulled IN (was 0.90) → the covert lobes become the scalloped edge
  const memTs = [0, 0.12, 0.24, 0.37, 0.50, 0.62];   // 6 span stations (was 5) — finer heat sweep
  const memFs = [0, 0.28, 0.52, HEM];                // 4 chord stations (was 3)
  // The WHOLE membrane is pure-emissive (pink-proof: no lit diffuse for the cool rim to pull rose).
  // At a MODERATE intensity, NOT the hot thin-feather ribbon level (a broad face at ribbon intensity
  // blooms to pale cream), so these read as solid ORANGE fire.
  const memI = (0.7 + 0.16 * (M.stage ?? 3)) * (M.glow ?? 1);
  const mMat = (e) => { const m = new THREE.MeshStandardMaterial({ color: 0x2e0f04, emissive: e, emissiveIntensity: memI, flatShading: true, roughness: 1.0, metalness: 0.0, side: THREE.DoubleSide }); m.userData.baseEmissive = e; m.userData.baseIntensity = memI; return m; };
  const memHot = mMat(0xffb63a), memGold = mMat(0xf59020), memOrange = mMat(0xe86614), memDeep = mMat(0xd6460c);
  // Surge flare weights for the broad membrane panels: kept BELOW full so a big face doesn't cream-out to
  // a pale slab — the white-gold COLOUR convergence (the lerp clamps near 1) carries the "majority of the
  // wing glows" read, while raw intensity gain stays on the thin feather/streamer layer. Tip-hotter
  // (memDeep at the outboard-trailing corner runs hottest) so the panel pours into the ember trail.
  // The broad membrane carries the "majority of the wing glows" read via strong COLOUR convergence to the
  // gold surgeHi (tip-hotter outboard) while INTENSITY stays low so a big face never blooms to a white slab.
  const memFlareW = (m, c, i) => { m.userData.flareColorWeight = c; m.userData.flareIntensityWeight = i; };
  // INTENSITY held UNIFORMLY LOW so no panel crosses the tone-map/bloom knee (which whites-out the
  // outboard tips exactly where the gold should peak); the COLOUR ramp (0.5→0.95 outboard) alone carries
  // the tip-hot gold gradient. This is the discipline the split-channel bought.
  memFlareW(memHot, 0.7, -0.2); memFlareW(memGold, 0.8, -0.15); memFlareW(memOrange, 0.9, -0.08); memFlareW(memDeep, 1.0, 0.0);   // membrane shifts strongly to saturated orange fire, near-flat intensity → vivid glow, no white slab
  wg.userData.flareMats = [memHot, memGold, memOrange, memDeep];   // published into the wing's spineMats so Surge ignites the membrane (they're locals otherwise)
  // DIAGONAL heat coordinate (not axis-aligned rectangles — the "basic panel/plates" read): a hot
  // inner-leading corner cooling toward the outboard-trailing corner, with a slight wave so the bands
  // aren't ruler-straight. Banded into the same 4 stops.
  // MONOTONIC + chord-weighted → the bands run STREAMWISE (roughly parallel to the leading edge,
  // along the feather flow), reading as heat streaks, not the scattered rectangular chips ("confetti")
  // a wavy span-heavy coordinate produced.
  const memMat = (t, f) => {
    const h = 0.72 * (f / HEM) + 0.34 * t;
    return h < 0.24 ? memHot : h < 0.48 ? memGold : h < 0.74 ? memOrange : memDeep;
  };
  for (let si = 0; si < memTs.length - 1; si++) {
    const t0 = memTs[si], t1 = memTs[si + 1];
    for (let fi = 0; fi < memFs.length - 1; fi++) {
      const f0 = memFs[fi], f1 = memFs[fi + 1];
      const mm = memMat((t0 + t1) / 2, (f0 + f1) / 2);
      wg.add(flatTriMesh([[TOP(t0, f0), TOP(t1, f0), TOP(t1, f1)], [TOP(t0, f0), TOP(t1, f1), TOP(t0, f1)]], mm));
      wg.add(flatTriMesh([[BOT(t0, f0), BOT(t1, f1), BOT(t1, f0)], [BOT(t0, f0), BOT(t0, f1), BOT(t1, f1)]], mm));
    }
  }
  // OUTBOARD DISSOLVE — a thin deep-orange wedge carrying the panel from t=0.62 out to 0.80 with the
  // chord shrinking to ~0.3×, so the membrane TAPERS into the feather zone instead of ending on a cut.
  for (const [t0, t1, c0, c1] of [[0.62, 0.71, HEM, 0.55], [0.71, 0.80, 0.55, 0.30]]) {
    wg.add(flatTriMesh([[TOP(t0, 0), TOP(t1, 0), TOP(t1, c1)], [TOP(t0, 0), TOP(t1, c1), TOP(t0, c0)]], memDeep));
    wg.add(flatTriMesh([[BOT(t0, 0), BOT(t1, c1), BOT(t1, 0)], [BOT(t0, 0), BOT(t0, c0), BOT(t1, c1)]], memDeep));
  }

  // ── COVERT RANK — a SHINGLED row of short broad flame-tongues rooted just inside the hem (f≈0.62)
  // and overhanging it, so the membrane's trailing edge becomes a SCALLOPED FLAME hem (no straight
  // cut line anywhere) and the panel dissolves into the feather layer. Segment-0 material = the
  // membrane it roots on → the roots vanish into the substrate, only the free lobes read as flame.
  {
    const cov = flameRank(covertN,
      (u) => { const t = 0.05 + u * 0.66; return TOP(t, 0.62); },
      (u) => [0.14 + 0.30 * u, -0.03, 1],
      [1, 0, 0],
      (u) => (0.5 + 0.12 * Math.sin(Math.PI * u)) * chord(0.05 + u * 0.66),
      (u) => { const t = 0.05 + u * 0.66; return [memMat(t, 0.62), M.hotRibbon[0], M.hotRibbon[1]]; },
      { ovl: 0.55, lift: 0.04, tipW: 0.28, seg: 5, curve: 0.10, curl: 0.05, flickAmp: 0.05 });
    wg.add(cov.group);
  }

  // ── MAIN FIRE-FEATHERS — the wing surface BUILT AS FIRE. The critic's picket-fence cure: THREE
  // length families (±40%), VARIED pitch + width per feather, and — the key — EVERY feather ramps
  // from a WHITE/GOLD-HOT root to a DEEP-RED tip (not the identical tricolour band on every spear),
  // so the bands land at different places along different-length feathers → combustion, not a fence.
  // Roots sit OVER the membrane (f≈0.34) so covert-over-streamer overlap blends feather into panel.
  // per-span hot→cool ramp, 4-stop, pure-emissive hotRibbon (pink-proof + glows in the dark). Innermost
  // hottest, outermost cools to deep-orange. Used by BOTH main layers.
  const mainRamp = (u) => u < 0.30 ? [M.hotRibbon[0], M.hotRibbon[0], M.hotRibbon[1], M.hotRibbon[1]]
    : u < 0.62 ? [M.hotRibbon[0], M.hotRibbon[1], M.hotRibbon[1], M.hotRibbon[2]]
      : [M.hotRibbon[1], M.hotRibbon[1], M.hotRibbon[2], M.hotRibbon[2]];
  const lenFam = [1.28, 0.82, 1.06];   // 3 interleaved length classes → broken rhythm
  const nMain = Math.max(5, Math.min(8, Math.round(secN + 1)));
  // ── PER-BLADE FLUTTER PIVOTS (wing fluidity) — each long primary is wrapped in a Group hinged at
  // its ROOT so the rig's blade-lag comb (nullable wingBladePivotsR/L) can ripple them a beat behind
  // the flap, deepening outboard. The feather group is offset by −base so the WORLD rest pose is
  // byte-identical (pivot@base + group@−base + verts@base+off = base+off); only rotation.z animates.
  const bladePivots = [];
  const bladeWrap = (grp, base) => {
    const p = new THREE.Group();
    p.name = 'sunBladePivot';
    p.position.set(base[0], base[1], base[2]);
    grp.position.set(-base[0], -base[1], -base[2]);
    p.add(grp);
    wg.add(p);
    bladePivots.push(p);
  };
  // LAYER 1 — the long primary flame-tongues (rooted f≈0.30). Lobe tips (tipW) + curved segs + an
  // alternating terminal flick → licking flame, not parallel spears. Wid floor raised so bellies OVERLAP.
  for (let i = 0; i < nMain; i++) {
    const u = nMain > 1 ? i / (nMain - 1) : 0.5;
    const t = 0.08 + u * 0.84 + 0.02 * Math.sin(i * 1.7), l = L(t), cc = chord(t);
    const fam = lenFam[i % 3];
    const len = (0.9 + 0.9 * Math.sin(Math.PI * Math.min(u * 1.05, 1))) * cc * fam;
    const wid = (0.42 + 0.22 * Math.sin(Math.PI * u)) * cc * (0.9 + 0.25 * ((i % 2) ? 1 : 0));
    const dir = [0.16 + 0.40 * u + 0.08 * ((i % 2) ? 1 : -0.4), -0.02 - 0.05 * u, 1];   // inner near-parallel, splay grows outboard
    const curve = 0.11 + 0.09 * u + 0.03 * (i % 2);
    const base = [l[0], l[1] + camber(0.34) * cc + 0.02, l[2] + 0.34 * cc];
    bladeWrap(flameFeather(base, dir, [1, 0, 0], len, wid, curve, mainRamp(u), 0.05 * ws,
      { seg: 5, tipW: 0.25, flick: 0.06 * ((i % 2) ? 1 : -1) }).group, base);
  }
  // LAYER 2 — a shorter overlapping rank at HALF-PHASE span offsets (rooted f≈0.45, lifted above
  // layer 1), so every gap between two long feathers is roofed by a shorter lobe → the trailing edge
  // reads as ONE continuous long/short flickering flame vane, never sky-between-teeth.
  const nMain2 = Math.max(4, nMain - 1);
  for (let i = 0; i < nMain2; i++) {
    const u = (i + 0.5) / nMain2;                 // half-phase vs layer 1
    const t = 0.10 + u * 0.78, l = L(t), cc = chord(t);
    const len = (0.55 + 0.45 * Math.sin(Math.PI * Math.min(u * 1.05, 1))) * cc * 0.82;
    const wid = (0.40 + 0.18 * Math.sin(Math.PI * u)) * cc;
    const dir = [0.18 + 0.40 * u, -0.02 - 0.04 * u, 1];
    const base = [l[0], l[1] + camber(0.45) * cc + 0.05, l[2] + 0.45 * cc];
    wg.add(flameFeather(base, dir, [1, 0, 0], len, wid, 0.10 + 0.08 * u, mainRamp(u), 0.04 * ws,
      { seg: 5, tipW: 0.28, flick: 0.05 * ((i % 2) ? -1 : 1) }).group);
  }

  // ── TRAILING STREAMERS — 3 BROAD flowing ribbons rooted INBOARD of the trailing edge (f≈0.66, so
  // they emerge from WITHIN the wing, not off a seam) and streaming aft. Broad + few = flame strokes,
  // not spaghetti-wire; tips cool to the pink-safe red-orange crimson.
  const rampTrail = M.hotRibbon;   // same near-pure-emissive fire → the streamers never pink under the cool rim
  const nStream = Math.max(2, Math.min(3, Math.round(secN * 0.5)));
  const emberTips = [];            // trailing-edge FX emit anchors (fire sheds off these in the rig)
  for (let i = 0; i < nStream; i++) {
    const u = nStream > 1 ? i / (nStream - 1) : 0.5;
    const t = 0.44 + u * 0.44, l = L(t), cc = chord(t);
    const len = (1.6 + 0.7 * Math.sin(Math.PI * (0.4 + 0.4 * u))) * ws;
    const wid = (0.38 - 0.06 * u) * ws;                                  // BROAD (all of them)
    const dir = [0.22 + 0.40 * u, 0.06, 1];
    const base = [l[0], l[1] + camber(0.66) * cc, l[2] + 0.66 * cc];     // rooted INSIDE the chord
    const f = flameFeather(base, dir, [1, 0, 0], len, wid, 0.28, rampTrail, 0.20 * ws,
      { seg: 6, tipW: 0.30, flick: 0.05 * ((i % 2) ? 1 : -1) });
    wg.add(f.group);
    emberTips.push(f.tip);
  }
  wg.userData.emberTips = emberTips;

  // ── LEADING LICKS — 3 short hot licks lifting off the CURVED leading edge (flame variation on the
  // lead, owner's ask), so the leading edge reads as living fire rather than a hard line.
  for (let i = 0; i < 3; i++) {
    const t = 0.12 + i * 0.17, l = L(t);
    wg.add(flameFeather([l[0], l[1] + 0.02, l[2] - 0.01], [0.40, 0.34 - 0.05 * i, -0.10], [1, 0, 0.3], (0.34 - 0.04 * i) * ws, 0.11 * ws, 0.09, [M.hotRibbon[0], M.hotRibbon[0], M.hotRibbon[1]]).group);
  }

  // ── STRUCTURAL PRIMARY FINGERS — 3 emarginated eagle fingers UNDER the fire, for the wing
  // SILHOUETTE + the no-curl contract (terminal aft-and-DOWN, never up/in). Gilt→amber.
  const carpal = TOP(0.70, 0.5);
  const nFing = Math.max(2, Math.min(fingerN, 3));
  const tips = [];
  for (let i = 0; i < nFing; i++) {
    const u = nFing > 1 ? i / (nFing - 1) : 0.5;
    const ang = 0.24 + (0.16 + 0.50 * u) * (0.4 + 0.6 * split);
    const droop = 0.08 + 0.06 * u;                                 // DOWN at the tip (anti-curl)
    const dir = [Math.cos(ang), -droop, Math.sin(ang)];
    const side = [-Math.sin(ang), 0, Math.cos(ang)];
    const len = (1.0 + 0.5 * Math.sin(Math.PI * u)) * ws;
    const wid = (0.24 - 0.07 * Math.abs(u - 0.5) * 2) * ws;
    wg.add(kiteFeather([carpal[0], carpal[1], carpal[2]], dir, side, len, wid, 0.06, M.gold, M.bronze, M.roseGold));
    // FLAME SHEATH over the gold finger — LONGER than the finger and tapering to a fine tongue past
    // its tip (small tipW), so the gold spine reads as bone INSIDE a flame that licks beyond it, not a
    // blunt pale sausage cap (the critic's most un-fire-like element).
    wg.add(flameFeather([carpal[0], carpal[1], carpal[2]], dir, side, len * 1.12, wid * 1.05, 0.06,
      [M.hotRibbon[0], M.hotRibbon[1], M.hotRibbon[2]], 0.04, { seg: 6, tipW: 0.12, flick: 0.05 * ((i % 2) ? 1 : -1) }).group);
    tips.push([carpal[0] + dir[0] * len, carpal[1] + dir[1] * len, carpal[2] + dir[2] * len]);
  }
  wg.userData.outerTip = tips[nFing - 1];
  wg.userData.bladePivots = bladePivots;   // per-blade flutter hinges (rig ripples them)
  return wg;
}

function buildSunfeatherWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const M = sunhawkMats(def, model.glowLevel ?? 1, model.igniteStage);
  const hs = 3.3 * (model.wingScale ?? 1);
  const pivots = {}, wingElements = [], emberEmitters = [];
  let wingBladePivotsR = null, wingBladePivotsL = null;
  const memFlareMats = [];   // per-side membrane mats (locals in buildOneSunWing) → published so Surge ignites the wing panels
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
    // TRAILING-EDGE FX EMITTERS — markers at the trailing-streamer tips (in the mid group, so they
    // ride the flap pose). The rig sheds ember-fire off these → "burning trailing fire" off the wings.
    for (const et of (oneWing.userData.emberTips || [])) {
      const em = new THREE.Object3D(); em.position.set(et[0], et[1], et[2]); mid.add(em);
      emberEmitters.push(em);
    }
    // Per-blade flutter hinges → rig's nullable wingBladePivotsR/L comb (blade-lag deepening outboard).
    // side:1 for BOTH wings — the L wing is already scale.x=−1 mirrored, so identical rotation.z on both
    // reads symmetric (passing the −1 loop side would double-flip → the apex asymmetry the probe caught).
    const bp = (oneWing.userData.bladePivots || []).map((pivot, idx) => ({ pivot, idx, side: 1 }));
    if (s === 'R') wingBladePivotsR = bp; else wingBladePivotsL = bp;
    for (const fm of (oneWing.userData.flareMats || [])) memFlareMats.push(fm);
  }
  // Publish the wing's DOMINANT fire surfaces into spineMats so Surge ignites the WINGS (the hero of the
  // Rebirth composition), not just the body. hotRibbon (M is shared across both wings → tag once, covers
  // both) drives the feathers/streamers/ridge/licks/sheaths; memFlareMats are the per-side membrane
  // panels. Their per-mat flareWeights (set in sunhawkMats / buildOneSunWing) keep it tip-hot + bloom-safe.
  const spineMats = [M.gold, M.roseGold, M.orange, ...M.hotRibbon, ...memFlareMats];
  return { group, spineMats, wingMat: M.ivory, parts: { ...pivots, wingElements, emberEmitters, wingBladePivotsR, wingBladePivotsL } };
}
registerWings('sunfeather', buildSunfeatherWings);

// ── TAIL: 'sunfireTrail' → a LONG, GRACEFUL trail of FIRE (owner: "longer, graceful,
// elegant, like trailing fire" — the IMG_6527 curling fire-tail). Long S-curved `flameFeather`
// ribbons rooted at the (lifted) tail anchor, each bowing then streaming AFT-and-UP with a
// graceful terminal CURL into the empty sky (never a lower-centre droop). Centre ribbon longest
// (the comet point), sides finer, all tapering to a fine point with a goldfire→flame→crimson
// heat gradient. LONG via rake + streaming, so the projected footprint stays corridor-clear.
function buildSunfireTrail(def, model, _mats, anchor) {
  const group = new THREE.Group();                 // CARRIER — holds the anchor offset (stays put)
  const M = sunhawkMats(def, model.glowLevel ?? 1, model.igniteStage);
  const anc = anchor ?? { y: 0.50, z: 1.60 };
  group.position.set(0, anc.y, anc.z);
  // PIVOT — all tail geometry hangs here, at the carrier's LOCAL origin (= the tail-root in world), so
  // the rig can YAW/PITCH the whole tail about the root (model.tailWhip → coil sway + bank rudder → the
  // tail SWINGS INTO VIEW on turns, the rear-chase presence fix). Geometry is built ANCHOR-RELATIVE.
  const pivot = new THREE.Group(); pivot.name = 'sunfireTailPivot';
  group.add(pivot);
  const a = { y: 0, z: 0 };                          // anchor-relative frame (carrier already holds anc)
  const nRib = Math.round(model.pennantRibbons ?? 5);
  const lift = model.pennantLift ?? 1;
  const segs = [pivot];
  if (nRib <= 0) return { group, segs, tailFins: null, accentMats: [M.flame, M.crimson] };

  // The tail must read as its OWN element, not merge into the wing streamers (the critic's #1 tail
  // note). Two separations do that: (1) it roots at the tail-root and streams AFT-and-slightly-DOWN,
  // settling into a LOWER height band than the wing streamers (which lift up-aft off the shoulders) —
  // vertical separation in the rear-chase; (2) it reaches far past them (apex ~7) → a long comet-drape
  // trailing behind the body. Corridor-safe: the drape settles to y≈0.34, never into {y<0.30, z>0.85}.
  const baseLen = 3.6 + 2.0 * lift;                     // apex ~5.6 — LONG + dominant, but not so long the tip goes subpixel-thin
  // DEDICATED EMBER ramp for the tail: pure-emissive (pink-proof) but ORANGE-dominant at a MODERATE
  // intensity so the broad tail facets read as TRAILING FIRE (ember grading warm-gold→orange→deep-
  // orange), not the pale cream silk they became when they bloomed the hot-gold wing ribbon white.
  const tI = (0.85 + 0.2 * (M.stage ?? 3)) * (M.glow ?? 1);
  const tMat = (emis) => { const m = new THREE.MeshStandardMaterial({ color: 0x2e0f04, emissive: emis, emissiveIntensity: tI, flatShading: true, roughness: 1.0, metalness: 0.0, side: THREE.DoubleSide }); m.userData.baseEmissive = emis; m.userData.baseIntensity = m.emissiveIntensity; return m; };
  const bodyEmber = tMat(0xd9741a);   // ≈ the body-field hue — for the covert-fan roots so the train grows OUT of the body
  const ramp4 = [bodyEmber, tMat(0xffa838), tMat(0xf26a16), tMat(0xdc470c)];   // 4-stop: body → gold-orange → ember → deep-orange
  const covRamp = [bodyEmber, tMat(0xffa838), tMat(0xf58a20)];
  const wf = (0.8 + 0.2 * lift);      // global width scale by lift

  // ══ THE COMET VOLUTE — a hollow, upward-biased CONE of fire around the tail axis (not a flat fan
  // lying in the y≈0.5 plane): a glowing nozzle you look INTO from the chase camera, blooming then
  // gathering to a comet point. Every downward degree of freedom is clamped by construction, so the
  // {y<0.30, z>0.85} corridor law holds no matter how the dials move. ══
  const coreRamp = [tMat(0xffbe4a), tMat(0xffa838), tMat(0xf26a16), tMat(0xdc470c)];   // hotter axial core
  const rk = 0.8 + 0.2 * lift;              // radius/size scale by the ladder (whelp puff → apex volute)
  const mouthY = a.y + 0.05, mouthZ = a.z + 0.26;
  const axisDir = [0, 0.30, 1];             // the axis CLIMBS ~17° → halves the down-screen sink so the tail rises out of the sun-glare column in rear-chase (corridor-safe: up is free)

  // ── FLUIDITY CHAIN — the tail hangs off a 4-JOINT nested chain instead of one rigid pivot, so the
  // rig's per-segment coil (sin(t·rate − i·0.6)·lock) makes a travelling S-WAVE ripple down its length
  // (owner: "needs more joints for fluidity"). Geometry is DISTRIBUTED across the joints by axial reach
  // (quad-binning): near-body volute on the root, the long streamers/core/tips on the outer joints so
  // they WHIP. At rest all joints are unrotated and every quad sits at its exact old world position →
  // the approved static look is byte-identical.
  const axHat = new THREE.Vector3(axisDir[0], axisDir[1], axisDir[2]).normalize();
  const mouthV = new THREE.Vector3(0, mouthY, mouthZ);
  const jFrac = [0, 0.30, 0.55, 0.78];                                  // axial reach of each joint (fraction of baseLen from the mouth)
  const jPos = jFrac.map((f) => mouthV.clone().addScaledVector(axHat, f * baseLen));   // cumulative joint positions (pivot-local); jPos[0]≈mouth
  const seg1 = new THREE.Group(), seg2 = new THREE.Group(), seg3 = new THREE.Group();
  seg1.position.copy(jPos[1]).sub(jPos[0]); seg2.position.copy(jPos[2]).sub(jPos[1]); seg3.position.copy(jPos[3]).sub(jPos[2]);
  pivot.add(seg1); seg1.add(seg2); seg2.add(seg3);
  const chain = [pivot, seg1, seg2, seg3];
  const cumOff = [new THREE.Vector3(0, 0, 0), jPos[1].clone().sub(jPos[0]), jPos[2].clone().sub(jPos[0]), jPos[3].clone().sub(jPos[0])];
  for (const s of chain) s.isBone = true;   // preview-tick tear guard: the shop tick position-writes non-bone tail segs → mark bone so BOTH ticks drive by ROTATION only
  segs.length = 0; segs.push(...chain);
  // bin one point (pivot-local) to its joint index by axial reach
  const jIdxOf = (p) => { const u = p.clone().sub(mouthV).dot(axHat); return u < jFrac[1] * baseLen ? 0 : u < jFrac[2] * baseLen ? 1 : u < jFrac[3] * baseLen ? 2 : 3; };
  // re-parent every quad-mesh of a built fire group onto the joint whose axial span it falls in
  // (rest-pose position compensated so world stays put). Whole non-binned elements stay on the root.
  const addBinned = (g) => {
    const meshes = []; g.traverse((o) => { if (o.isMesh) meshes.push(o); });
    for (const mesh of meshes) {
      mesh.geometry.computeBoundingBox();
      const c = mesh.geometry.boundingBox.getCenter(new THREE.Vector3());
      const k = jIdxOf(c);
      chain[k].add(mesh);                       // re-parents (geometry verts unchanged)
      mesh.position.copy(cumOff[k]).multiplyScalar(-1);
    }
  };

  // ── A: ROOT CONE — a real lofted SOLID at the tail-root, so the rear-chase camera (looking straight
  // into the tail) sees a ROUND glowing NOZZLE, not a flat shelf. Mouth bottom y≈0.36 (corridor margin).
  const coneRings = [
    { z: a.z - 0.16, rx: 0.12, ry: 0.13, cy: a.y - 0.02 },
    { z: a.z + 0.06, rx: 0.22 * rk, ry: 0.185 * rk, cy: a.y + 0.02 },
    { z: mouthZ, rx: 0.30 * rk, ry: 0.20 * rk, cy: mouthY },
  ];
  pivot.add(loftRings(coneRings, bodyEmber, seg(9), false));
  const throat = new THREE.Mesh(new THREE.OctahedronGeometry(0.14 * rk, 0), tMat(0xffe0a0));
  throat.position.set(0, mouthY, mouthZ - 0.02); throat.scale.set(1.3, 1.3, 0.8);   // white-hot throat DISC the rear camera looks INTO (wider + flatter → reads round, not a sliver)
  pivot.add(throat);

  // ── B: RADIAL RUFF — short flame-tongues around the cone MOUTH (a shuttlecock collar) → the
  // near-body cross-section reads as a scalloped ROSETTE with internal V-notches, not a flat lump.
  {
    const nR = Math.max(6, Math.min(nRib + 3, 8));
    const ruff = flamePlume(nR, [0, mouthY, mouthZ], axisDir,
      { rx: 0.30 * rk, ryUp: 0.26 * rk, ryDn: 0.16 * rk, arcDeg: 286, gatherK: 0.5, baseLen,
        twist: 0.02, curve: 0.10, curl: 0.06, tipW: 0.30, seg: 5, flickAmp: 0.05,
        lenAt: () => 0.8 * wf, widAt: () => 0.30 * wf, rampAt: () => covRamp });
    pivot.add(ruff.group);
  }

  // ── C: PLUME SHEAF — the hollow cone: ribbons on an UPWARD-biased egg ring converging on a gather
  // point with a helical twist → a teardrop that swells (~30%), waists (~75%), tapers to a point.
  // Crown longest+widest, belly shortest with its outward bow clamped ≈0 (corridor guard). Broad
  // faces on the moderate ember ramp (won't bloom cream).
  // C1: BLOOM tier — short broad tongues carrying the near-body VOLUME on the ring, with CLUMPED
  // (uneven) spacing so it's not a picket fence wrapped in a circle, and a gentle wave. Gathers early
  // (0.55) so it stays the near-body swell; the long reach is left to the streamer tier.
  const nBloom = Math.max(4, Math.min(nRib + 3, 6));
  addBinned(flamePlume(nBloom, [0, mouthY, mouthZ - 0.02], axisDir,
    { rx: 0.29 * rk, ryUp: 0.33 * rk, ryDn: 0.14 * rk, arcDeg: 300, gatherK: 0.55, baseLen,
      twist: 0.06, curve: 0.16, curl: 0.10, tipW: 0.30, seg: 5, flickAmp: 0.05,
      clumpAmp: 0.18, waveAmp: 0.03, waveCycles: 1.0,
      lenAt: (c) => baseLen * (0.30 + 0.16 * Math.max(0, c)) * (Math.cos(6 * c) > 0 ? 1.12 : 0.9),  // two alternating length families
      widAt: (c) => (0.34 + 0.20 * Math.max(0, c)) * wf,
      rampAt: () => ramp4 }).group);

  // C2: STREAMER tier — past the waist the comet condenses into a FEW long licks: a crown ribbon + a
  // mirrored pair, each WAVED (a visible S in planform), FLARING open at the tip (not pinched), each
  // sprouting an offshoot tendril → a flowing comet, NOT a radial duster of equal bristles. Built on
  // the same axis frame; all in the crown sector so wave+flare stay above the corridor floor.
  const streamTips = [];           // long-streamer tips → trailing-fire FX emit anchors
  {
    const Ax = new THREE.Vector3(axisDir[0], axisDir[1], axisDir[2]).normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), Ax).normalize();
    const up = new THREE.Vector3().crossVectors(Ax, right).normalize();
    const Bpt = new THREE.Vector3(0, mouthY, mouthZ - 0.02);
    const gather = Bpt.clone().addScaledVector(Ax, 0.80 * baseLen);
    const rx = 0.29 * rk, ryU = 0.33 * rk;
    const A = (v) => [v.x, v.y, v.z];
    const phis = nRib >= 3 ? [0, 0.45, -0.45] : [0];
    phis.forEach((phi, k) => {
      const c = Math.cos(phi), s = Math.sin(phi), sgn = s >= 0 ? 1 : -1;
      const ringPt = Bpt.clone().addScaledVector(right, rx * s).addScaledVector(up, ryU * c);
      const radial = new THREE.Vector3().addScaledVector(right, rx * s).addScaledVector(up, ryU * c).normalize();
      const tangent = new THREE.Vector3().crossVectors(Ax, radial).normalize();
      const dir = gather.clone().sub(ringPt).normalize().addScaledVector(tangent, 0.08).normalize();
      const side = tangent.clone().negate();
      const Nn = new THREE.Vector3().crossVectors(dir, side).normalize();
      const len = baseLen * (k === 0 ? 1.05 : 0.85), wid = 0.40 * wf;
      const sf = flameFeather(A(ringPt), A(dir), A(side), len, wid, 0.16, ramp4, 0.10,
        { seg: 6, tipW: 0.24, flick: 0.05 * sgn, flare: 0.10, wave: { amp: 0.045, cycles: 1.25, phase: sgn > 0 ? 0 : Math.PI } });
      addBinned(sf.group);
      streamTips.push(sf.tip);
      // offshoot tendril(s) branching off the streamer at u≈0.52 (crown gets a mirrored pair). Gated.
      if (lift > 0.6) {
        const bp = ringPt.clone().addScaledVector(dir, len * 0.52).addScaledVector(Nn, 0.14);
        (k === 0 ? [1, -1] : [sgn]).forEach((td) => {
          const tdir = dir.clone().addScaledVector(tangent, 0.55 * td).normalize();
          addBinned(flameFeather(A(bp), A(tdir), A(side), len * 0.24, wid * 0.5, 0.16,
            [ramp4[1], ramp4[2], ramp4[3]], 0.14, { seg: 5, tipW: 0.22, wave: { amp: 0.05, cycles: 0.75, phase: td > 0 ? 0 : Math.PI } }).group);
        });
      }
    });
  }
  // AXIAL CORE — the dominant hot comet head down the centre of the hollow cone (a whisper of wave).
  const coreF = flameFeather([0, mouthY, mouthZ - 0.06], axisDir, [1, 0, 0.05], baseLen, 0.36 * wf,
    0.05, coreRamp, 0.14, { seg: 7, tipW: 0.12, wave: { amp: 0.06, cycles: 1.15, phase: 0 } });
  addBinned(coreF.group);
  streamTips.push(coreF.tip);

  // ── D: CREST FAN — three thin ribbons rising STEEPLY off the dorsal tail-root, so the tail projects
  // real HEIGHT into the dark tower/sky band ABOVE the body in rear-chase (the steep slope clears the
  // ~0.36 threshold where geometry rises up-screen instead of sinking into the water glare). Thin +
  // hot (M.hotRibbon) so they register over the bright water; centreline |x|≤0.3 and z≥1.4 → far from
  // the wing streamers (x≥1.9, z<0.9), no merge. Base y 0.10-rel (0.60 world) → corridor-irrelevant.
  if (lift > 0.35) {
    const cl = 0.7 + 0.3 * lift;
    // A FAN of thin flame LICKS (a fiery crown), NOT one broad ribbon — a single swept ribbon turns
    // its broad face to the rear camera and reads as a slab/smokestack. Five thin licks spread in x,
    // tallest at the centre, each TAPERING to a point + SWEEPING aft → from behind it reads as spread
    // FIRE with gaps between the licks, not a plank. Pale-hot root → deep-ember tip = the body gradient.
    const crestRamp = [tMat(0xffe6b0), tMat(0xffce6a), tMat(0xffa030), tMat(0xf26414)];
    const crestN = 5;
    for (let i = 0; i < crestN; i++) {
      const u = i / (crestN - 1) - 0.5;               // −0.5 … 0.5
      const cen = 1 - Math.abs(u) * 2;                // 1 centre → 0 edge
      const cx = u * 0.92;                            // spread WIDE (±0.46) → clear dark GAPS between licks (a fiery crown, not a packed slab). Still centreline; wings at x≥1.9.
      const ln = (1.0 + 0.7 * cen) * cl;              // MODEST height (was a dominant mass) + jagged (centre tallest)
      const wd = (0.10 + 0.05 * cen) * wf;            // thin, fore-aft width → edge-on from the rear camera
      pivot.add(flameFeather([cx, a.y + 0.10, a.z - 0.05], [u * 0.5, 0.86, 0.82], [0, 0, 1], ln, wd,
        0.10, crestRamp, -0.20, { seg: 6, tipW: 0.05, wave: { amp: 0.05, cycles: 0.8, phase: u >= 0 ? 0 : Math.PI } }).group);
    }
  }

  // ── HELICAL WISPS — 4 fine sparks shearing off the rotating cone at 90° increments up the axis (the
  // motion cue that reads the volute as a VOLUME). Thin → pure hotRibbon, never bloom.
  for (let i = 0; i < 4; i++) {
    const u = 0.25 + i * 0.2, phi = (i - 1.5) * 0.6;   // −0.9…0.9 rad → UPPER hemisphere + symmetric (no low-left detached spark)
    const az = mouthZ + u * baseLen * 0.99, ay = mouthY + u * baseLen * 0.10;
    const cx = Math.sin(phi) * 0.26 * rk * 1.1;
    const cyw = ay + Math.cos(phi) * 0.26 * rk * 0.9;
    addBinned(flameFeather([cx, cyw, az], [Math.sin(phi) * 0.4, 0.15 + Math.cos(phi) * 0.2, 1], [1, 0, 0.2],
      (0.6 + 0.3 * (i % 2)), 0.08, 0.14, M.hotRibbon, 0.12, { seg: 5, tipW: 0.20 }).group);   // shorter + a lobe tip → sparks that don't read as a floating pale needle
  }
  // TRAILING-FIRE FX EMITTERS — markers at the streamer + core tips (and the throat) so the rig
  // sheds ember-fire off the length of the tail (not just its root). Live in the tail group → carried
  // by any tail sway.
  const emberEmitters = [];
  for (const tp of streamTips) {
    const p = new THREE.Vector3(tp[0], tp[1], tp[2]); const k = jIdxOf(p);   // ride the whipping joint the tip belongs to
    const em = new THREE.Object3D(); em.position.copy(p).sub(cumOff[k]); chain[k].add(em); emberEmitters.push(em);
  }
  { const em = new THREE.Object3D(); em.position.set(0, mouthY, mouthZ); pivot.add(em); emberEmitters.push(em); }
  // accentMats = the tail's OWN fire materials → they join spineMats so Rebirth Surge flares the tail
  // with the rest of the body (they were previously left out, so the tail didn't blaze on Surge).
  return { group, segs, tailFins: null, emberEmitters, accentMats: [bodyEmber, ...ramp4, ...coreRamp] };
}
registerTail('sunfireTrail', buildSunfireTrail);

// Export the material factory so downstream modules share the exact ladder.
export { sunhawkMats, loftRings, kiteFeather, makeGlow };
