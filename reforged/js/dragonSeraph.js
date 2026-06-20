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
// — Dawn(0) sparse → Ascendant(3) full plumage. [pivot, mid, tip] cards per wing.
const FEATHER_ROWS = [[3, 4, 3], [4, 5, 4], [5, 6, 5], [6, 7, 5]];

// FEATHER-SCALE PLATE — a gilded holy scute: a tapered pearl leaf (a 2-tri kite) with
// a marginally larger gold RIM behind, so every feather reads gold-edged. CUPped (the
// tip lifts) so the row catches dawn-light. The atomic module the whole wing tiles.
function featherScale(len, w, cup, plate, gild) {
  const g = new THREE.Group();
  const B = { x: 0, y: 0, z: 0 }, T = { x: 0, y: cup, z: len };
  const BL = { x: -w * 0.5, y: 0, z: len * 0.42 }, BR = { x: w * 0.5, y: 0, z: len * 0.42 };
  g.add(flatTriMesh([[arr(B), arr(BR), arr(T)], [arr(B), arr(T), arr(BL)]], plate));
  // gold rim: same kite, just 1.06× wide / 1.03× long, dropped just behind → a thin gold EDGE.
  const rk = 1.06, rl = 1.03, dy = -0.012, dz = -0.04;
  const rB = { x: 0, y: dy, z: dz }, rT = { x: 0, y: cup + dy, z: len * rl };
  const rBL = { x: -w * 0.5 * rk, y: dy, z: len * 0.42 }, rBR = { x: w * 0.5 * rk, y: dy, z: len * 0.42 };
  g.add(flatTriMesh([[arr(rB), arr(rBR), arr(rT)], [arr(rB), arr(rT), arr(rBL)]], gild));
  return g;
}

// SCALE ROW — n overlapping featherScales shingled from span t0→t1, each rooted at the
// leading edge of its station and reaching back toward the trailing edge (length ≈ the
// local chord), fanning slightly outward toward the tip. The "feathered" read; the seam
// is HIDDEN by the ~40% overlap (the organic answer to the bull's celebrated hinges).
function scaleRow(parent, t0, t1, n, lenScale, plate, gild, xsec, side) {
  for (let i = 0; i < n; i++) {
    const f = n > 1 ? i / (n - 1) : 0;
    const t = t0 + (t1 - t0) * f;
    const s = xsec(t);
    const chord = Math.hypot(s.trailing.z - s.leading.z, s.trailing.x - s.leading.x);
    const len = chord * lenScale * (1 - 0.12 * f);      // reach past the trailing edge; taper
    const w = (t1 - t0) * 4.6 / Math.max(n, 1) * 3.0;   // wide → heavy overlap (a continuous shingled fan)
    const fs = featherScale(len, w, 0.07 + 0.04 * f, plate, gild);
    // shingled like roof tiles: each lifted slightly above the previous, laid mostly FLAT
    fs.position.set(s.leading.x, s.leading.y + 0.04 + 0.03 * i, s.leading.z - 0.04);
    fs.rotation.y = side * (0.08 + 0.26 * f);            // fan out toward the tip
    fs.rotation.x = -0.20 - 0.06 * f;                    // small upward cant (plumage, not a comb)
    parent.add(fs);
  }
}

function buildSeraphWing(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale ?? 1;
  const gi = Math.min(giM ?? 1, 1.3);

  const pearlMat = new THREE.MeshStandardMaterial({
    color: def.wingInner ?? def.body ?? 0xffffff, flatShading: true, side: THREE.DoubleSide,
    roughness: 0.5, metalness: 0.1,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: def.horn ?? 0xffd86a, flatShading: true, side: THREE.DoubleSide,
    roughness: 0.3, metalness: 0.7,
  });
  const shadowMat = new THREE.MeshStandardMaterial({
    color: def.wingOuter ?? 0x6aa0f0, flatShading: true, side: THREE.DoubleSide,
    roughness: 0.55, metalness: 0.2,
  });
  const seamCol = def.wingEmissive ?? def.apexSeam ?? 0xc0e0ff;
  const seamGlowMat = new THREE.MeshStandardMaterial({ color: seamCol, emissive: seamCol, emissiveIntensity: 1.5 * gi, roughness: 0.3, side: THREE.DoubleSide });
  seamGlowMat.userData.baseEmissive = seamCol; seamGlowMat.userData.baseIntensity = 1.5 * gi;
  spineMats.push(seamGlowMat);

  const L = 4.6 * ws;
  const sweep = 16 * D2R;
  const dih = (model.wingDihedralDeg ?? 14) * D2R;   // chase-cam knob (range 10–18)
  const rows = FEATHER_ROWS[Math.min(model.formLevel ?? 3, 3)];

  function buildSide(side) {
    const pivot = new THREE.Group();
    const wr = attach.wingRoot(side);
    pivot.position.set(wr.x, wr.y, wr.z);

    const spanDir = norm({ x: side * Math.cos(sweep) * Math.cos(dih), y: Math.sin(dih), z: Math.sin(sweep) * Math.cos(dih) });
    const fwd = { x: 0, y: 0, z: -1 }, rear = { x: 0, y: 0, z: 1 };
    const stationPoint = (t) => mul(spanDir, L * t);
    // chord tapers root→tip — BROAD angel wing (wide root fanning to a tip): 1.7 → 0.42
    const chordAt = (t) => 1.7 + (0.42 - 1.7) * Math.min(t, 1);
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
    const spar = (grp, ta, tb, o) => grp.add(frameBar(arr(xsecL(ta, o).leading), arr(xsecL(tb, o).leading), [0.06, 0.05], goldMat));
    const seam = (grp, t, o) => {
      const s = xsecL(t, o); const m = lerp(s.leading, s.trailing, 0.5);
      const bar = chevronLight({ len: 0.32, w: 0.03, mat: seamGlowMat });
      bar.position.set(m.x, m.y + 0.03, m.z); bar.rotation.y = side * 0.5; grp.add(bar);
    };
    const rowFor = (grp, ta, tb, n, o, lenScale) => scaleRow(grp, ta, tb, n, lenScale, pearlMat, goldMat, (t) => xsecL(t, o), side);

    // PART A — root/pivot (0–0.34): broad coverts
    webQuad(pivot, 0.0, J0, ZERO); spar(pivot, 0.0, J0, ZERO); seam(pivot, 0.20, ZERO);
    rowFor(pivot, 0.04, J0, rows[0], ZERO, 1.05);
    // PART B — mid (0.34–0.66): primary plumage
    webQuad(wingMid, J0, J1, midO); spar(wingMid, J0, J1, midO); seam(wingMid, 0.50, midO);
    rowFor(wingMid, J0, J1, rows[1], midO, 1.18);
    // PART C — tip (0.66–1.0): long primary blade-scutes + gilded endplate + marker
    webQuad(wingTip, J1, 1.0, tipO); spar(wingTip, J1, 1.0, tipO); seam(wingTip, 0.84, tipO);
    rowFor(wingTip, J1, 0.99, rows[2], tipO, 1.28);
    const tc = xsecL(1.0, tipO).c;
    // gilded endplate fin (a small blade finishing the silhouette)
    wingTip.add(flatTriMesh([
      [[tc.x, tc.y - 0.04, tc.z - 0.10], [tc.x + side * 0.20, tc.y + 0.20, tc.z + 0.04], [tc.x + side * 0.06, tc.y + 0.04, tc.z + 0.14]],
    ], goldMat));
    const marker = new THREE.Object3D(); marker.position.set(tc.x, tc.y, tc.z); wingTip.add(marker);

    group.add(pivot);
    return { pivot, wingMid, wingTip, marker };
  }

  // RIGHT master + scale.x = -1 MIRROR CLONE for the left (L75): identical geometry,
  // animator drives each rig with the same logical pose + its own banking bias.
  const R = buildSide(1);
  R.pivot.userData.wingRole = 'pivot';
  R.wingMid.userData.wingRole = 'mid'; R.wingTip.userData.wingRole = 'tip'; R.marker.userData.wingRole = 'marker';
  const lpivot = R.pivot.clone(true);
  const lmirror = new THREE.Group(); lmirror.scale.x = -1; lmirror.add(lpivot); group.add(lmirror);
  const byRole = (root, role) => { let f = null; root.traverse((o) => { if (!f && o.userData && o.userData.wingRole === role) f = o; }); return f; };
  const Lf = { pivot: lpivot, wingMid: byRole(lpivot, 'mid'), wingTip: byRole(lpivot, 'tip'), marker: byRole(lpivot, 'marker') };

  return {
    group,
    parts: {
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

  const pearlMat = new THREE.MeshStandardMaterial({
    color: def.body ?? 0xffffff, flatShading: true, roughness: 0.5, metalness: 0.1,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: def.horn ?? 0xffd86a, flatShading: true, side: THREE.DoubleSide, roughness: 0.3, metalness: 0.7,
  });
  const glowCol = def.wingEmissive ?? def.apexSeam ?? 0xc0e0ff;
  const glowMat = new THREE.MeshStandardMaterial({ color: glowCol, emissive: glowCol, emissiveIntensity: 1.5, roughness: 0.3, side: THREE.DoubleSide });
  glowMat.userData.baseEmissive = glowCol; glowMat.userData.baseIntensity = 1.5;
  const accentMats = [glowMat];
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
    // gilded dorsal ridge blade (grows toward the root, tapers to the tip)
    const ridgeH = 0.24 * (1 - 0.55 * f) + 0.05;
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

  // COMET BLOOM at the tip — a glowing core + a gilded blade-fan streaming back (+z).
  const tip = segs[segs.length - 1];
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.15, seg(8), seg(6)), glowMat);
  core.position.set(0, 0, segLen * 0.5 + 0.10); tip.add(core);
  for (const a of [-0.55, -0.2, 0.2, 0.55]) {
    const bl = 0.62, bw = 0.13;
    const blade = flatTriMesh([[[0, 0, 0], [bw, 0, bl * 0.4], [0, 0, bl]], [[0, 0, 0], [0, 0, bl], [-bw, 0, bl * 0.4]]], goldMat);
    blade.position.set(0, 0, segLen * 0.5 + 0.10);
    blade.rotation.z = a;                                // fan the streak radially
    tip.add(blade);
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
