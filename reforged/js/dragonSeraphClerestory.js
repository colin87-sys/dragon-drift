import * as THREE from 'three';
import { seg } from './modelDetail.js';
import { registerWings } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PEARL SERAPH — THE CLERESTORY WING ('clerestoryWing').
// The wing is not grown, it is CONSECRATED: a section of cathedral rose-window
// tracery in flight. A gull-arched gilded ARCHITRAVE carries a fan of pointed
// PEARL-STONE arches PIERCED CLEAN THROUGH (sky shows through the wing when
// backlit — the rear-chase's best case), with recessed dawn "stained-glass" panes
// that sit dark as dusk in cruise and BLAZE like sunrise through a church window on
// Surge, and a carpal ROSE OCULUS with a gem hub. Architecture, not anatomy — no
// vanes, no rachis, no membrane. Locked language: matte pearl + true gold TRACERY +
// withheld dawn glow + gem. Rides the shared yoke→pivot→mid→tip rig + wrist fold.
// ═══════════════════════════════════════════════════════════════════════════════

const D2R = Math.PI / 180;
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const mul = (a, s) => ({ x: a.x * s, y: a.y * s, z: a.z * s });
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const norm = (a) => { const m = Math.hypot(a.x, a.y, a.z) || 1; return { x: a.x / m, y: a.y / m, z: a.z / m }; };
const arr = (p) => [p.x, p.y, p.z];
const UP = { x: 0, y: 1, z: 0 };

const SERAPH_PEARL = 0xF2F0EA, SERAPH_GOLD = 0xEDB63E, SERAPH_DAWN = 0x88DFFF, SERAPH_GEM = 0x8FEAFF;

// leading-edge (architrave) gull profile as a function of span t — shared by geometry + marker.
function seraphArm(t, L) {
  const tc = Math.min(Math.max(t, 0), 1);
  const x = L * (0.05 + 0.95 * tc);
  let y; const peak = 0.42;
  if (tc <= peak) { const u = tc / peak; y = 0.98 * Math.sin(u * Math.PI * 0.5); }
  else { const u = (tc - peak) / (1 - peak); y = 0.98 - 0.46 * u * u; }
  const z = -0.52 * Math.sin(Math.PI * tc) * (1 - tc) + 1.05 * tc * tc;
  return { x, y, z };
}

// A thin GOLD tracery bar (mullion/rib) between a and b — a shallow tent (raised
// centre ridge) so the edge has real thickness and catches rim light, not a decal.
function goldBar(a, b, w, mat) {
  const dir = norm(sub(b, a));
  const sideV = norm(cross(UP, dir));
  const al = add(a, mul(sideV, -w)), ar = add(a, mul(sideV, w));
  const bl = add(b, mul(sideV, -w)), br = add(b, mul(sideV, w));
  const ac = add(a, mul(UP, w * 0.9)), bc = add(b, mul(UP, w * 0.9));
  return flatTriMesh([
    [arr(al), arr(ac), arr(bl)], [arr(ac), arr(bc), arr(bl)],
    [arr(ac), arr(ar), arr(bc)], [arr(ar), arr(br), arr(bc)],
  ], mat);
}

function buildClerestoryWing(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale ?? 1;
  const gi = Math.min(giM ?? 1, 1.3);
  const formLevel = Math.min(model.formLevel ?? 3, 3);

  const mkPearl = (col, rough) => new THREE.MeshStandardMaterial({ color: col, flatShading: true, side: THREE.DoubleSide, roughness: rough ?? 0.56, metalness: 0.06, emissive: 0x0c1626, emissiveIntensity: 0.09 });
  const stoneInner = mkPearl(def.wingInner ?? 0xF4F1EA, 0.58);
  const stoneMid   = mkPearl(0xD9E2F0, 0.55);
  const stoneOuter = mkPearl(def.wingOuter ?? 0x8FB0DA, 0.52);
  for (const m of [stoneMid, stoneOuter]) { m.userData.baseEmissive = 0x0c1626; m.userData.baseIntensity = 0.09; }
  const goldMat = new THREE.MeshStandardMaterial({ color: SERAPH_GOLD, flatShading: true, side: THREE.DoubleSide, roughness: 0.42, metalness: 0.28, emissive: 0x3a2606, emissiveIntensity: 0.13 });
  const dawnCol = def.wingEmissive ?? SERAPH_DAWN;
  const paneMat = new THREE.MeshStandardMaterial({ color: dawnCol, emissive: dawnCol, emissiveIntensity: 0.05 * gi, roughness: 0.35, metalness: 0.0, side: THREE.DoubleSide });   // dark slate glass in cruise
  paneMat.userData.baseEmissive = dawnCol; paneMat.userData.baseIntensity = 0.05 * gi;
  const gemMat = new THREE.MeshStandardMaterial({ color: SERAPH_GEM, emissive: SERAPH_GEM, emissiveIntensity: 1.9 * gi, roughness: 0.1, metalness: 0.0 });
  gemMat.userData.baseEmissive = SERAPH_GEM; gemMat.userData.baseIntensity = 1.9 * gi;
  spineMats.push(paneMat, gemMat);
  const stoneFor = (t) => (t < 0.34 ? stoneInner : t < 0.68 ? stoneMid : stoneOuter);

  const L = 4.8 * ws;
  const dih = (model.wingDihedralDeg ?? 14) * D2R;
  const J0 = 0.34, J1 = 0.66;
  const chordScale = model.wingChordScale ?? 1;
  const pierceStage = model.pierceStage ?? [1, 2, 3, 3][formLevel];   // arch cells per bay grow with form
  const roseStage = model.roseStage ?? [0, 0, 1, 2][formLevel];

  function buildSide(side) {
    const yoke = new THREE.Group();
    const wr = attach.wingRoot(side);
    yoke.position.set(wr.x, wr.y, wr.z);
    yoke.rotation.z = side * dih;
    const pivot = new THREE.Group(); yoke.add(pivot);

    const S = (t) => { const p = seraphArm(t, L); return { x: side * p.x, y: p.y, z: p.z }; };
    const chordAt = (t) => (1.95 + (0.55 - 1.95) * Math.min(t, 1)) * (t < 0.34 ? 1 + 0.12 * (1 - t / 0.34) : 1) * chordScale;
    const front = (t) => S(t);
    const rear = (t) => { const f = S(t); const c = chordAt(t); return { x: f.x * 0.99, y: f.y - 0.05 - 0.12 * t, z: f.z + c }; };

    const midO = S(J0), tipO = S(J1);
    const wingMid = new THREE.Group(); wingMid.position.set(midO.x, midO.y, midO.z);
    const wingTip = new THREE.Group(); wingTip.position.set(tipO.x - midO.x, tipO.y - midO.y, tipO.z - midO.z);
    wingMid.add(wingTip); pivot.add(wingMid);
    const O = (p, o) => ({ x: p.x - o.x, y: p.y - o.y, z: p.z - o.z });
    const ZERO = { x: 0, y: 0, z: 0 };

    // panel point at span t, chord fraction u (0 = leading/architrave, 1 = trailing), with a
    // shallow chordwise VAULT (barrel camber) — the panel is a vaulted stone surface, not flat.
    const P = (t, u, o) => {
      const f = front(t), r = rear(t);
      const p = lerp(f, r, u);
      p.y -= 0.16 * Math.sin(Math.PI * u) * (0.5 + 0.5 * t);
      return O(p, o);
    };

    // ARCHITRAVE — a gilded gull rail along the leading edge (the springing line of the arches).
    const architrave = (grp, ta, tb, o, nSp) => {
      for (let i = 0; i < nSp; i++) {
        const t0 = ta + (tb - ta) * (i / nSp), t1 = ta + (tb - ta) * ((i + 1) / nSp);
        grp.add(goldBar(P(t0, 0.0, o), P(t1, 0.0, o), 0.09 - 0.05 * t0, goldMat));
      }
    };

    // BAY — a run of pointed-arch tracery cells across [ta,tb]. Solid pearl "wall" at the
    // springing (u 0→0.30), then per cell: a gold pointed-arch FRAME with the opening PIERCED
    // (sky through the wing) and a recessed dawn glass PANE (dark in cruise, blazes on Surge).
    const bay = (grp, ta, tb, o, nCells, pierce, paneN) => {
      const uSill = 0.30, uShoulder = 0.66, uApex = 0.94;
      // the solid springing wall (leading strip)
      const wtris = [];
      const nsp = seg(4);
      for (let i = 0; i < nsp; i++) {
        const t0 = ta + (tb - ta) * (i / nsp), t1 = ta + (tb - ta) * ((i + 1) / nsp);
        wtris.push([arr(P(t0, 0.0, o)), arr(P(t1, 0.0, o)), arr(P(t1, uSill, o))],
                   [arr(P(t0, 0.0, o)), arr(P(t1, uSill, o)), arr(P(t0, uSill, o))]);
      }
      grp.add(flatTriMesh(wtris, stoneFor((ta + tb) / 2)));
      // cells
      for (let c = 0; c < nCells; c++) {
        const s0 = ta + (tb - ta) * (c / nCells), s1 = ta + (tb - ta) * ((c + 1) / nCells);
        const sm = (s0 + s1) / 2;
        const bw = 0.035;
        // gold frame: bottom rail + 2 mullions + 2 arch legs → a pointed arch
        grp.add(goldBar(P(s0, uSill, o), P(s1, uSill, o), bw, goldMat));
        grp.add(goldBar(P(s0, uSill, o), P(s0, uShoulder, o), bw, goldMat));
        grp.add(goldBar(P(s1, uSill, o), P(s1, uShoulder, o), bw, goldMat));
        grp.add(goldBar(P(s0, uShoulder, o), P(sm, uApex, o), bw, goldMat));
        grp.add(goldBar(P(s1, uShoulder, o), P(sm, uApex, o), bw, goldMat));
        if (c >= nCells - pierce) {
          // PIERCED cell — opening left as sky; a recessed dawn glass pane behind (if paned)
          if (c >= nCells - paneN) {
            const rec = mul(UP, -0.05);
            const pl = add(P(s0 + (s1 - s0) * 0.16, 0.36, o), rec);
            const pr = add(P(s1 - (s1 - s0) * 0.16, 0.36, o), rec);
            const pa = add(P(sm, uApex - 0.04, o), rec);
            const pm = add(P(sm, 0.36, o), rec);
            grp.add(flatTriMesh([[arr(pl), arr(pm), arr(pa)], [arr(pm), arr(pr), arr(pa)]], paneMat));
          }
        } else {
          // BLIND arcading — solid recessed pearl panel filling the opening (inboard mass)
          const bl = P(s0 + (s1 - s0) * 0.12, uSill + 0.02, o), br = P(s1 - (s1 - s0) * 0.12, uSill + 0.02, o);
          const ap = P(sm, uApex - 0.02, o);
          grp.add(flatTriMesh([[arr(bl), arr(br), arr(ap)]], stoneFor(sm)));
        }
        // a small gold FINIAL on every other arch point (repetition with variation)
        if (c % 2 === 1) {
          const tip = P(sm, uApex, o), up = add(tip, mul(UP, 0.10));
          grp.add(flatTriMesh([[arr(add(tip, { x: 0.02, y: 0, z: 0 })), arr(up), arr(add(tip, { x: -0.02, y: 0, z: 0 }))]], goldMat));
        }
      }
    };

    // ROSE OCULUS — a pierced circular gold ring with spokes + a gem hub, at the carpal.
    const rose = (grp, tc, o, stage) => {
      if (stage <= 0) return;
      const C = P(tc, 0.52, o);
      const r = chordAt(tc) * 0.20;
      const n = seg(12);
      const ringPt = (k) => add(C, { x: side * Math.cos(k / n * Math.PI * 2) * r, y: 0.02, z: Math.sin(k / n * Math.PI * 2) * r });
      for (let k = 0; k < n; k++) grp.add(goldBar(ringPt(k), ringPt(k + 1), 0.03, goldMat));
      const spokes = stage >= 2 ? 6 : 4;
      for (let k = 0; k < spokes; k++) grp.add(goldBar(C, ringPt(k * n / spokes), 0.022, goldMat));
      const hub = new THREE.Mesh(new THREE.OctahedronGeometry(stage >= 2 ? 0.09 : 0.06, 0), gemMat);
      hub.position.set(C.x, C.y + 0.03, C.z); grp.add(hub);
    };

    // BAY 1 (pivot), BAY 2 (mid), BAY 3 = the "hand" (tip) with the rose — wrist fold anchored at -carpal
    architrave(pivot, 0.0, J0, ZERO, seg(4));
    bay(pivot, 0.02, J0, ZERO, 3, Math.max(pierceStage - 2, 0), 0);
    architrave(wingMid, J0, J1, midO, seg(4));
    bay(wingMid, J0, J1, midO, 3, Math.max(pierceStage - 1, 1), Math.max((model.paneCount ?? [0, 0, 1, 2][formLevel]) - 1, 0));
    architrave(wingTip, J1, 1.0, tipO, seg(4));
    bay(wingTip, J1, 0.99, tipO, 3, pierceStage, model.paneCount ?? [0, 0, 1, 2][formLevel]);
    rose(wingTip, J1 + 0.06, tipO, roseStage);

    const marker = new THREE.Object3D(); const tc = O(S(1.0), tipO); marker.position.set(tc.x, tc.y, tc.z); wingTip.add(marker);

    // ROOT — pearl cowl lapping the yoke (overlap > weld) so the wing grows from the shoulder.
    for (let i = 0; i < 3; i++) {
      const t = 0.02 + i * 0.05, f = front(t), r = rear(t);
      const bx = { x: f.x, y: f.y + 0.05 + i * 0.02, z: f.z };
      const rr = { x: r.x * 0.7, y: r.y + 0.02, z: r.z * 0.55 };
      const ow = { x: side * (0.26 - i * 0.03), y: 0, z: 0 };
      yoke.add(flatTriMesh([[arr(add(bx, mul(ow, -1))), arr(add(bx, ow)), arr(rr)]], stoneInner));
    }

    group.add(yoke);
    return { yoke, pivot, wingMid, wingTip, marker };
  }

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
    wingMat: stoneInner, spineMats,
    flareMats: [stoneMid, stoneOuter],
    wingElements: { tipR: R.marker, tipL: Lf.marker },
  };
}
registerWings('clerestoryWing', buildClerestoryWing);
