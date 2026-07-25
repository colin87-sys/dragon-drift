import * as THREE from 'three';
import { seg } from './modelDetail.js';
import { registerWings, registerTail } from './dragonRecipe.js';
import { flatTriMesh, frameBar, chevronLight } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PEARL SERAPH — the organic/celestial counterpoint to the Aurum Toro "bull".
//
// The DOCTRINE (see LEAPFROG.md): a PART is a multi-module articulated ASSEMBLY.
// The Seraph REUSES the bull's armature — the part registry, the attach contract,
// the 3-hinge wing rig (wingPivot→wingMid→wingTip) + cascade animator, the seg()/
// material/tri budget gates, and the mechaKit atoms. It is NOT a reskin: it swaps
// the MODULE VOCABULARY (overlapping gilded feather-SCALE cards, a crown-halo, a
// comet tail — not flat jet panels / vents / thrusters / a trident), the
// PROPORTIONS (broad, raised "spreading" wings), the SURFACE GRAMMAR (matte pearl +
// gilded rims + dawn-blue glow seams, not carbon + clearcoat + red), and the GAIT
// (slow, lofty, glide-dominant). "Radiant Paladin": a holy war-dragon of gilded light.
//
// CHASE-CAM FIRST: the gold-rimmed feather fan + the trailing tail are the rear hero.
// ═══════════════════════════════════════════════════════════════════════════════

const D2R = Math.PI / 180;
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul = (a, s) => ({ x: a.x * s, y: a.y * s, z: a.z * s });
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
const norm = (a) => { const m = Math.hypot(a.x, a.y, a.z) || 1; return { x: a.x / m, y: a.y / m, z: a.z / m }; };
const arr = (p) => [p.x, p.y, p.z];

// Per-form feather-scale row counts (maturation, not assembly): the same parts GROW
// — Dawn(0) sparse → Ascendant(3) full plumage. [pivot, mid, tip] cards per wing. The
// counts are seg()-gated at build → HIGH≈gameplay LOD, ULTRA(×1.6)≈hero/shop LOD.
const FEATHER_ROWS = [[4, 5, 4], [5, 6, 4], [6, 7, 5], [7, 8, 6]];

// ── SERAPH SURFACE LANGUAGE — matte pearl + TRUE gilding + dawn-blue seam glow + rare gem.
// The gild MUST be a real metallic gold: `def.horn` is near-white at Eternal (0xfff0b0) →
// rims read un-gilded. These are the defaults; `def.*` still overrides for per-form tint.
const SERAPH_PEARL = 0xF2F0EA;   // matte warm off-white (not plastic 0xffffff)
const SERAPH_GOLD  = 0xD6AF4A;   // true metallic gold — feather rims, leading spar, vertebra caps, comet blade
const SERAPH_DAWN  = 0x88DFFF;   // dawn-blue seam emissive
const SERAPH_HOLY  = 0xFFF3C8;   // warm holy-white (comet core; halo later)
const SERAPH_GEM   = 0x8FEAFF;   // rare crystal node (reserved for joint/brow accents)

// FEATHER-SCALE PLATE — a gilded holy scute, built as a WIDE CONVEX LEAF/SHIELD (not a
// kite that narrows to one sharp apex — that was the "sawtooth" read). 6-point silhouette:
// base point, a WIDE low pair (the leaf is broadest near the root), a shoulder pair, and a
// SHORT BLUNT tip edge (width = w·tipSharpness, never a single point). A marginally larger
// gold RIM sits just behind so every plate reads gold-edged. CUPped so the row catches
// dawn-light. Fanned + overlapped by scaleRow, these tile into scalloped shingled plumage.
function featherScale(len, w, cup, tipSharpness, plate, gild) {
  const g = new THREE.Group();
  const tw = w * 0.5 * Math.max(tipSharpness, 0.12);   // half-width of the blunt tip edge
  const leaf = (k, dy, dz) => {                          // k = scale (1 = plate, >1 = rim)
    const hw = w * 0.5 * k, mw = w * 0.42 * k, tk = tw * k, L = len * (dz ? 1.03 : 1);
    const B  = [0, dy, dz];
    const BR = [ hw, dy,            L * 0.30], BL = [-hw, dy,            L * 0.30];
    const MR = [ mw, cup * 0.5 + dy, L * 0.70], ML = [-mw, cup * 0.5 + dy, L * 0.70];
    const TR = [ tk, cup + dy,       L * 0.96], TL = [-tk, cup + dy,       L * 0.96];
    return [[B, BR, MR], [B, MR, TR], [B, TR, TL], [B, TL, ML], [B, ML, BL]];
  };
  g.add(flatTriMesh(leaf(1, 0, 0), plate));
  g.add(flatTriMesh(leaf(1.05, -0.012, -0.04), gild));   // thin gold edge, dropped just behind
  return g;
}

// SCALE ROW — n overlapping featherScales shingled from span t0→t1, each rooted at the
// leading edge of its station and reaching back past the trailing edge (length ≈ the local
// chord), fanning GENTLY outward + narrowing toward the tip. Heavy ~40-45% overlap hides
// the seam → a continuous scalloped fan (the organic answer to the bull's celebrated hinges).
function scaleRow(parent, t0, t1, n, lenScale, tipSharp, plate, gild, xsec, side) {
  for (let i = 0; i < n; i++) {
    const f = n > 1 ? i / (n - 1) : 0;
    const t = t0 + (t1 - t0) * f;
    const s = xsec(t);
    const chord = Math.hypot(s.trailing.z - s.leading.z, s.trailing.x - s.leading.x);
    const len = chord * lenScale * (1 - 0.10 * f);      // reach past trailing edge; gentle taper
    // WIDE cards (shield-like) → heavy overlap → shingled rows, not separable teeth; narrower tipward
    const w = (t1 - t0) * 5.6 / Math.max(n, 1) * 3.0 * (1 - 0.22 * f);
    const fs = featherScale(len, w, 0.06 + 0.05 * f, tipSharp, plate, gild);
    // shingled like roof tiles: each lifted slightly above the previous, laid mostly FLAT
    fs.position.set(s.leading.x, s.leading.y + 0.035 + 0.022 * i, s.leading.z - 0.04);
    fs.rotation.y = side * (0.06 + 0.20 * f);            // GENTLE fan toward the tip (was a hard splay)
    fs.rotation.x = -0.16 - 0.05 * f;                    // small upward cant (plumage, not a comb)
    parent.add(fs);
  }
}

function buildSeraphWing(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale ?? 1;
  const gi = Math.min(giM ?? 1, 1.3);

  const pearlMat = new THREE.MeshStandardMaterial({
    color: def.wingInner ?? SERAPH_PEARL, flatShading: true, side: THREE.DoubleSide,
    roughness: 0.52, metalness: 0.08,
  });
  // TRUE metallic gild (def.wingGild), NOT the near-white def.horn — this is the key fix
  // for "pearl plates rimmed in gold" instead of undifferentiated white.
  const goldMat = new THREE.MeshStandardMaterial({
    color: def.wingGild ?? SERAPH_GOLD, flatShading: true, side: THREE.DoubleSide,
    roughness: 0.30, metalness: 0.72,
  });
  const seamCol = def.wingEmissive ?? SERAPH_DAWN;
  const seamGlowMat = new THREE.MeshStandardMaterial({ color: seamCol, emissive: seamCol, emissiveIntensity: 1.5 * gi, roughness: 0.3, side: THREE.DoubleSide });
  seamGlowMat.userData.baseEmissive = seamCol; seamGlowMat.userData.baseIntensity = 1.5 * gi;
  spineMats.push(seamGlowMat);

  const L = 4.6 * ws;
  const sweep = 16 * D2R;
  const dih = (model.wingDihedralDeg ?? 14) * D2R;   // chase-cam knob (range 10–18)
  const rows = FEATHER_ROWS[Math.min(model.formLevel ?? 3, 3)];

  function buildSide(side) {
    // Chain: torso → YOKE (shoulder carrier — the new root stage that leads the chain into the
    // V) → pivot (inner-wing geometry) → mid → tip. The yoke sits at the wing-root socket; the
    // pivot is its child at local origin so the yoke's elevation lifts the whole wing from the root.
    const yoke = new THREE.Group();
    const wr = attach.wingRoot(side);
    yoke.position.set(wr.x, wr.y, wr.z);
    const pivot = new THREE.Group();
    yoke.add(pivot);

    const spanDir = norm({ x: side * Math.cos(sweep) * Math.cos(dih), y: Math.sin(dih), z: Math.sin(sweep) * Math.cos(dih) });
    const fwd = { x: 0, y: 0, z: -1 }, rear = { x: 0, y: 0, z: 1 };
    const stationPoint = (t) => mul(spanDir, L * t);
    // chord tapers root→tip — BROAD angel wing (wide root fanning to a tip), with the inner
    // 35% made ~+12% fuller so the wing reads layered near the body, not linear. `wingChordScale`
    // deepens the fan front-to-back (and the feathers, which reach past the trailing edge) WITHOUT
    // touching span (that's `wingScale`/L) or tri count — the "lush feathered fan" knob, default 1.
    const chordScale = model.wingChordScale ?? 1;
    const chordAt = (t) => {
      const base = 1.9 + (0.42 - 1.9) * Math.min(t, 1);            // fuller root (was 1.7)
      const inner = t < 0.35 ? 1 + 0.12 * (1 - t / 0.35) : 1;      // +12% fullness across inner 35%
      return base * inner * chordScale;
    };
    const xsec = (t) => { const c = stationPoint(t); const ch = chordAt(t); return { c, leading: add(c, mul(fwd, ch * 0.40)), trailing: add(c, mul(rear, ch * 0.60)) }; };

    const J0 = 0.34, J1 = 0.66;
    const midO = stationPoint(J0), tipO = stationPoint(J1);
    const wingMid = new THREE.Group(); wingMid.position.set(midO.x, midO.y + 0.02, midO.z);
    const wingTip = new THREE.Group(); wingTip.position.set(tipO.x - midO.x, (tipO.y - midO.y) + 0.015, tipO.z - midO.z);
    wingMid.add(wingTip); pivot.add(wingMid);

    // local-space xsec relative to a segment origin `o`
    const O = (p, o) => ({ x: p.x - o.x, y: p.y - o.y, z: p.z - o.z });
    const xsecL = (t, o) => { const s = xsec(t); return { leading: O(s.leading, o), trailing: O(s.trailing, o), c: O(s.c, o) }; };
    const ZERO = { x: 0, y: 0, z: 0 };

    // pearl WEB membrane + gilded leading spar + glow seam + a shingled scaleRow per segment
    const webQuad = (grp, ta, tb, o) => {
      const a = xsecL(ta, o), b = xsecL(tb, o);
      grp.add(flatTriMesh([
        [arr(a.leading), arr(b.leading), arr(b.trailing)],
        [arr(a.leading), arr(b.trailing), arr(a.trailing)],
      ], pearlMat));
    };
    const spar = (grp, ta, tb, o) => {
      const th = 0.078 - 0.046 * Math.min(ta, 1);   // gilded leading rail: thicker root → thinner tip
      grp.add(frameBar(arr(xsecL(ta, o).leading), arr(xsecL(tb, o).leading), [th, th * 0.82], goldMat));
    };
    const seam = (grp, t, o) => {
      const s = xsecL(t, o); const m = lerp(s.leading, s.trailing, 0.5);
      const bar = chevronLight({ len: 0.32, w: 0.03, mat: seamGlowMat });
      bar.position.set(m.x, m.y + 0.03, m.z); bar.rotation.y = side * 0.5; grp.add(bar);
    };
    const rowFor = (grp, ta, tb, n, o, lenScale, tipSharp) => scaleRow(grp, ta, tb, seg(n), lenScale, tipSharp, pearlMat, goldMat, (t) => xsecL(t, o), side);

    // PART A — root/pivot (0–0.34): broad coverts (low tipSharp = rounded plumes) + a short
    // extra inner covert row so the wing reads FULL near the body.
    webQuad(pivot, 0.0, J0, ZERO); spar(pivot, 0.0, J0, ZERO); seam(pivot, 0.20, ZERO);
    rowFor(pivot, 0.18, J0, Math.max(2, rows[0] - 2), ZERO, 0.80, 0.28);   // short inner covert row (fullness)
    rowFor(pivot, 0.04, J0, rows[0], ZERO, 1.06, 0.35);
    // PART B — mid (0.34–0.66): primary plumage
    webQuad(wingMid, J0, J1, midO); spar(wingMid, J0, J1, midO); seam(wingMid, 0.50, midO);
    rowFor(wingMid, J0, J1, rows[1], midO, 1.20, 0.42);
    // PART C — tip (0.66–1.0): LONG narrow primary blade-scutes (high tipSharp) + gilded endplate
    webQuad(wingTip, J1, 1.0, tipO); spar(wingTip, J1, 1.0, tipO); seam(wingTip, 0.84, tipO);
    rowFor(wingTip, J1, 0.99, rows[2], tipO, 1.42, 0.62);
    const tc = xsecL(1.0, tipO).c;
    // gilded endplate fin (a small blade finishing the silhouette)
    wingTip.add(flatTriMesh([
      [[tc.x, tc.y - 0.04, tc.z - 0.10], [tc.x + side * 0.20, tc.y + 0.20, tc.z + 0.04], [tc.x + side * 0.06, tc.y + 0.04, tc.z + 0.14]],
    ], goldMat));
    const marker = new THREE.Object3D(); marker.position.set(tc.x, tc.y, tc.z); wingTip.add(marker);

    group.add(yoke);
    return { yoke, pivot, wingMid, wingTip, marker };
  }

  // RIGHT master + scale.x = -1 MIRROR CLONE for the left (L75): identical geometry,
  // animator drives each rig with the same logical pose + its own banking bias.
  const R = buildSide(1);
  R.yoke.userData.wingRole = 'yoke'; R.pivot.userData.wingRole = 'pivot';
  R.wingMid.userData.wingRole = 'mid'; R.wingTip.userData.wingRole = 'tip'; R.marker.userData.wingRole = 'marker';
  const lyoke = R.yoke.clone(true);
  const lmirror = new THREE.Group(); lmirror.scale.x = -1; lmirror.add(lyoke); group.add(lmirror);
  const byRole = (root, role) => { let f = null; root.traverse((o) => { if (!f && o.userData && o.userData.wingRole === role) f = o; }); return f; };
  const Lf = { yoke: lyoke, pivot: byRole(lyoke, 'pivot'), wingMid: byRole(lyoke, 'mid'), wingTip: byRole(lyoke, 'tip'), marker: byRole(lyoke, 'marker') };

  return {
    group,
    parts: {
      wingYokeL: Lf.yoke, wingYokeR: R.yoke,
      wingPivotL: Lf.pivot, wingPivotR: R.pivot,
      wingMidL: Lf.wingMid, wingMidR: R.wingMid,
      wingTipL: Lf.wingTip, wingTipR: R.wingTip,
      tipMarkerL: Lf.marker, tipMarkerR: R.marker,
      wingPivot2L: null, wingPivot2R: null, wingRigL: null, wingRigR: null,
    },
    wingMat: pearlMat, spineMats,
  };
}
registerWings('seraphWing', buildSeraphWing);

// ═══════════════════════════════════════════════════════════════════════════════
// SERAPH TAIL — 'seraphTail' — the CHASE-CAM REAR HERO: a luminous comet/banner tail,
// NOT a mecha spine. Smooth tapering pearl vertebrae + a gilded dorsal ridge running
// the length + dawn-blue glow seams, finishing in a COMET BLOOM (a glowing core + a
// gilded blade-fan streaming back) with two gilded BANNER fins that bank into turns.
// Contract (dragonModel L266): (def, model, { bodyMat, scalesMat }, anchor) →
//   { group, segs, tailFins, accentMats }. `segs` ride the coil/rudder/bob animator;
//   `tailFins` get deployed/fluttered/banked; `accentMats` flare on Surge.
// ═══════════════════════════════════════════════════════════════════════════════
function buildSeraphTail(def, model, mats, anchor) {
  const root = new THREE.Group();
  root.position.set(0, anchor.y, anchor.z);

  // matte pearl vertebrae with a self-glow floor to lift the center OUT of navy/blue-black
  const pearlMat = new THREE.MeshStandardMaterial({
    color: def.body ?? SERAPH_PEARL, flatShading: true, roughness: 0.52, metalness: 0.08,
    emissive: SERAPH_PEARL, emissiveIntensity: 0.14,   // ~35% less dark center
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: def.wingGild ?? SERAPH_GOLD, flatShading: true, side: THREE.DoubleSide, roughness: 0.30, metalness: 0.72,
  });
  const glowCol = def.wingEmissive ?? SERAPH_DAWN;
  const glowMat = new THREE.MeshStandardMaterial({ color: glowCol, emissive: glowCol, emissiveIntensity: 1.5, roughness: 0.3, side: THREE.DoubleSide });
  glowMat.userData.baseEmissive = glowCol; glowMat.userData.baseIntensity = 1.5;
  const holyMat = new THREE.MeshStandardMaterial({ color: SERAPH_HOLY, emissive: SERAPH_HOLY, emissiveIntensity: 2.1, roughness: 0.25, side: THREE.DoubleSide });
  holyMat.userData.baseEmissive = SERAPH_HOLY; holyMat.userData.baseIntensity = 2.1;
  // translucent FADING plume cards for the comet light-trail (not opaque fins)
  const plumeMat = new THREE.MeshStandardMaterial({ color: glowCol, emissive: glowCol, emissiveIntensity: 1.3, roughness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 0.28, depthWrite: false });
  plumeMat.userData.baseEmissive = glowCol; plumeMat.userData.baseIntensity = 1.3;
  const accentMats = [glowMat, holyMat, plumeMat];
  const segs = [], tailFins = [];

  // CHAIN of smooth pearl vertebrae along +z (flat siblings of root, like the aero tail,
  // so the established per-segment rudder/coil animator drives them identically).
  const n = Math.min(model.tailSegments ?? 9, 12);
  let z = 0.10, r = 0.34;
  const taper = 0.86, segLen = 0.46;
  let rearSeg = null;
  for (let i = 0; i < n; i++) {
    const f = n > 1 ? i / (n - 1) : 0;
    const rTop = Math.max(r * taper, 0.05);              // rear (thinner) radius
    const g = new THREE.Group(); g.position.set(0, 0, z);
    // smooth tapered vertebra: rTop = rear, r = front (toward body) → CylinderGeometry +z
    const body = new THREE.Mesh(new THREE.CylinderGeometry(rTop, r, segLen, seg(6)), pearlMat);
    body.rotation.x = Math.PI / 2;
    g.add(body);
    // small gilded dorsal vertebra cap (cleaner than a tall ridge; tapers to the tip)
    const ridgeH = 0.14 * (1 - 0.5 * f) + 0.035;
    g.add(flatTriMesh([[[0, r, -segLen * 0.4], [0, r + ridgeH, 0], [0, rTop, segLen * 0.4]]], goldMat));
    // dawn-blue glow seam on the interior segments (rear-facing read for the chase cam)
    if (i >= 1 && i < n - 1) {
      const slit = chevronLight({ len: r * 1.4, w: 0.04, mat: glowMat });
      slit.position.set(0, r * 0.55, -segLen * 0.3); g.add(slit);
    }
    root.add(g); segs.push(g);
    if (i === n - 2) rearSeg = g;
    z += segLen * 0.82; r = rTop;
  }

  // COMET-BLADE TIP — ONE small radiant central blade (gold edge + holy-white core) + a glow
  // core node + 4 translucent fading plume cards: a minimal HOLY BLADE streaming light, NOT a
  // chunky dark kite or a trident.
  const tip = segs[segs.length - 1];
  const cometG = new THREE.Group(); cometG.position.set(0, 0, segLen * 0.5 + 0.06); tip.add(cometG);
  const bladeLen = 0.52, bladeH = 0.22, baseW = 0.055;
  // central vertical blade — gold outer shell (two faces to the dorsal ridge) + holy core
  cometG.add(flatTriMesh([
    [[ baseW, 0, 0], [0, bladeH, bladeLen * 0.42], [0, 0.02, bladeLen]],
    [[-baseW, 0, 0], [0, bladeH, bladeLen * 0.42], [0, 0.02, bladeLen]],
  ], goldMat));
  cometG.add(flatTriMesh([
    [[0, 0.05, 0.05], [0, bladeH * 0.80, bladeLen * 0.40], [0, 0.06, bladeLen * 0.86]],
  ], holyMat));
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.12, seg(8), seg(6)), holyMat);
  core.position.set(0, bladeH * 0.18, 0.02); cometG.add(core);
  // 4 trailing translucent plume cards fanning lightly behind (the fading light trail)
  const plumeLen = 0.34, plumeW = 0.055;
  for (const a of [-0.42, -0.15, 0.15, 0.42]) {
    const plume = flatTriMesh([
      [[0, 0, 0], [plumeW, 0, plumeLen * 0.4], [0, 0, plumeLen]],
      [[0, 0, 0], [0, 0, plumeLen], [-plumeW, 0, plumeLen * 0.4]],
    ], plumeMat);
    plume.rotation.y = a; plume.position.set(0, 0.02, bladeLen * 0.20);
    cometG.add(plume);
  }

  // BANNER FINS (tailFins) near the tip — gilded tapered banners that the rig banks into
  // turns (bankGain) + flutters; a glow trailing edge keeps them on the chase-cam read.
  const host = rearSeg ?? root;
  for (const s of [-1, 1]) {
    const flap = new THREE.Group(); flap.position.set(s * 0.10, 0.10, 0);
    flap.add(flatTriMesh([
      [[0, 0, -0.18], [s * 0.78, 0.02, 0.06], [s * 0.30, 0, 0.40]],
      [[0, 0, -0.18], [s * 0.30, 0, 0.40], [0, 0, 0.30]],
    ], goldMat));
    flap.add(flatTriMesh([[[s * 0.30, 0, 0.40], [s * 0.78, 0.02, 0.06], [s * 0.62, 0.01, 0.30]]], glowMat));
    flap.userData.restRotX = -0.12; flap.userData.restRotY = 0; flap.userData.restRotZ = s * 0.18;
    flap.userData.restScale = 1; flap.userData.bankGain = s * 0.5; flap.userData.flapFlutter = 0.18; flap.userData.phase = s * 1.6;
    host.add(flap); tailFins.push(flap);
  }

  return { group: root, segs, tailFins, accentMats };
}
registerTail('seraphTail', buildSeraphTail);
