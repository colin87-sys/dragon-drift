import * as THREE from 'three';
import { seg } from './modelDetail.js';
import { registerWings } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PEARL SERAPH — THE AUREOLE PLATE-FAN WING ('aureoleWing').
//
// The plumage IS the armor. Every feather is a CHASED PEARL PLATE — a two-value
// beveled face with real wedge thickness, a raised TRUE-GOLD HEM along its edges
// (geometry, not a stripe), and a carved DAWN CHANNEL down its centre (a sword's
// fuller — near-black in cruise, blazes on Surge). Laid in dominant+decay ranks.
//
// Silhouette signature (profile-as-function, the only one on the roster): a ROUND
// convex crown-DOME peaking early + a long RULER-STRAIGHT descending leading edge to
// a low tip — a drawn sword laid along the wing. The two wings' gold hems radiate
// from the brow-gem so the PAIR reads as a broken AUREOLE framing the rider; the
// channels ignite together on Surge = the aureole lights ("first light breaks").
//
// Rides the shared yoke→pivot→mid→tip rig + wrist-fold hand + outer-wrapper mirror.
// ═══════════════════════════════════════════════════════════════════════════════

const D2R = Math.PI / 180;
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const mul = (a, s) => ({ x: a.x * s, y: a.y * s, z: a.z * s });
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
const norm = (a) => { const m = Math.hypot(a.x, a.y, a.z) || 1; return { x: a.x / m, y: a.y / m, z: a.z / m }; };
const arr = (p) => [p.x, p.y, p.z];

const SERAPH_PEARL = 0xF2F0EA, SERAPH_GOLD = 0xEDB63E, SERAPH_DAWN = 0x88DFFF, SERAPH_GEM = 0x8FEAFF;

// ── PROFILE-AS-FUNCTION — the Aureole silhouette (shared by geometry + tip marker). ──
// Round convex crown-dome peaking early (t≈0.28), then a straight descending edge.
export function seraphCrownY(t) {
  const tc = Math.min(Math.max(t, 0), 1), tp = 0.28;
  if (tc <= tp) { const u = tc / tp; return 1.04 * Math.pow(Math.sin(u * Math.PI * 0.5), 0.72); }   // rounded convex rise to the dome
  const u = (tc - tp) / (1 - tp); return 1.04 * (1 - 0.88 * u);                                     // ruler-straight descent to a low tip
}
export function seraphCrownZ(t) {
  const tc = Math.min(Math.max(t, 0), 1);
  return 0.98 * Math.pow(tc, 1.06) - 0.16 * Math.sin(Math.PI * tc) * (1 - tc);                       // slight fore-bow at root → straight aft blade
}

// ── THE ATOM — a chased armor PLATE with a TWO-VALUE bevel. Returns triangles bucketed
// by role: L = lit facet (rank tier mat), S = shadow facet + underside (steel-pearl, a
// clear value step down → chased-armor read + breaks slat monotony), H = raised gold hem,
// C = the carved DAWN CHANNEL fuller down the centre ridge (near-black cruise, blazes Surge).
// A whole rank merges each bucket to one mesh (few draws). up = surface normal (~+Y).
function seraphPlate(root, dirAft, outb, up, len, wid, ridgeH, channel) {
  const L = [], S = [], H = [], C = [];
  const tip = add(root, mul(dirAft, len));
  const hw = wid * 0.5, tw = wid * 0.22;                              // blunt straight tip (armor, not a needle)
  const bl = add(root, mul(outb, -hw)), br = add(root, mul(outb, hw));
  const tl = add(tip, mul(outb, -tw)), tr = add(tip, mul(outb, tw));
  const cR = add(root, mul(up, ridgeH)), cT = add(tip, mul(up, ridgeH * 0.42));   // raised centre ridge
  // TWO-VALUE BEVEL: lit facet (left of ridge) vs shadow facet (right) — a real value event per plate
  L.push([arr(bl), arr(cR), arr(cT)], [arr(bl), arr(cT), arr(tl)]);
  S.push([arr(cR), arr(br), arr(tr)], [arr(cR), arr(tr), arr(cT)]);
  // underside skin (thickness), in the shadow tier so edge-on isn't a bright plank
  const dl = add(bl, mul(up, -0.02)), dr = add(br, mul(up, -0.02));
  const dtl = add(tl, mul(up, -0.014)), dtr = add(tr, mul(up, -0.014));
  S.push([arr(bl), arr(dl), arr(tl)], [arr(dl), arr(dtl), arr(tl)],
         [arr(br), arr(tr), arr(dr)], [arr(dr), arr(tr), arr(dtr)]);
  // GOLD HEM — thin raised strips riding both long edges root→tip (chased plate armor)
  const hemW = 0.022;
  const gl0 = add(bl, mul(up, 0.016)), gl1 = add(tl, mul(up, 0.011));
  H.push([arr(gl0), arr(add(bl, mul(outb, -hemW))), arr(gl1)], [arr(gl1), arr(add(bl, mul(outb, -hemW))), arr(add(tl, mul(outb, -hemW * 0.6)))]);
  const gr0 = add(br, mul(up, 0.016)), gr1 = add(tr, mul(up, 0.011));
  H.push([arr(gr0), arr(gr1), arr(add(br, mul(outb, hemW)))], [arr(gr1), arr(add(tr, mul(outb, hemW * 0.6))), arr(add(br, mul(outb, hemW)))]);
  // DAWN CHANNEL — a recessed fuller down the centre ridge, dropped just below it (the groove
  // between the two facets). Near-black in cruise, the whole circuit blazes on Surge.
  if (channel) {
    const cw = wid * 0.055, drop = mul(up, ridgeH - 0.012);
    const a0 = add(add(root, drop), mul(outb, -cw)), b0 = add(add(root, drop), mul(outb, cw));
    const a1 = add(add(tip, mul(up, ridgeH * 0.42 - 0.010)), mul(outb, -cw * 0.5)), b1 = add(add(tip, mul(up, ridgeH * 0.42 - 0.010)), mul(outb, cw * 0.5));
    C.push([arr(a0), arr(b0), arr(b1)], [arr(a0), arr(b1), arr(a1)]);
  }
  return { L, S, H, C };
}

function buildAureoleWing(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale ?? 1;
  const gi = Math.min(giM ?? 1, 1.3);
  const formLevel = Math.min(model.formLevel ?? 3, 3);

  const mkPearl = (col, rough) => new THREE.MeshStandardMaterial({ color: col, flatShading: true, side: THREE.DoubleSide, roughness: rough ?? 0.55, metalness: 0.06, emissive: 0x0c1626, emissiveIntensity: 0.08 });
  const memInner = mkPearl(def.wingInner ?? 0xF4F1EA, 0.58);
  const memMid   = mkPearl(0xD9E2F0, 0.55);
  const memOuter = mkPearl(def.wingOuter ?? 0x9CC0E8, 0.52);
  const bellyMat = mkPearl(0x9FB4CE, 0.60);
  for (const m of [memMid, memOuter, bellyMat]) { m.userData.baseEmissive = 0x0c1626; m.userData.baseIntensity = 0.08; }
  // plate tiers — each rank steps one value off the membrane beneath it so the rank READS
  const plateCovert = mkPearl(0xFBFAF6, 0.50);   // brightest lit-facet tier
  const plateSecond = mkPearl(0xEAEEF6, 0.52);
  const platePrimary = mkPearl(0xDCE6F2, 0.50);
  const shadowMat = mkPearl(0x93A6C0, 0.58);     // the SHADOW facet — a clear value step down (chased-armor read)
  const goldMat = new THREE.MeshStandardMaterial({ color: SERAPH_GOLD, flatShading: true, side: THREE.DoubleSide, roughness: 0.40, metalness: 0.30, emissive: 0x3a2606, emissiveIntensity: 0.14 });
  const goldHiMat = new THREE.MeshStandardMaterial({ color: 0xFFDE7A, flatShading: true, side: THREE.DoubleSide, roughness: 0.34, metalness: 0.34, emissive: 0x4a3208, emissiveIntensity: 0.16 });   // lit hem crest (metallic read)
  const dawnCol = def.wingEmissive ?? SERAPH_DAWN;
  const dawnMat = new THREE.MeshStandardMaterial({ color: 0x10233a, emissive: dawnCol, emissiveIntensity: 0.02 * gi, roughness: 0.35, side: THREE.DoubleSide });
  dawnMat.userData.baseEmissive = dawnCol; dawnMat.userData.baseIntensity = 0.02 * gi;   // NEAR-BLACK cruise → the whole channel circuit blazes on Surge
  spineMats.push(dawnMat);

  const L = 4.9 * ws;
  const YS = 1.9, ZS = 1.0;                       // profile scale (dome height / blade length in world units)
  const dih = (model.wingDihedralDeg ?? 13) * D2R;
  const J0 = 0.34, J1 = 0.64;
  const chordScale = model.wingChordScale ?? 1;
  // ladder: plate counts + channels grow up the forms
  const nCov = [3, 4, 5, 6][formLevel];
  const nSec = [4, 5, 6, 7][formLevel];
  const nPrim = [4, 4, 5, 6][formLevel];
  const nChan = [1, 2, 2, 3][formLevel];

  function buildSide(side) {
    const yoke = new THREE.Group();
    const wr = attach.wingRoot(side);
    yoke.position.set(wr.x, wr.y, wr.z);
    yoke.rotation.z = side * dih;
    const pivot = new THREE.Group(); yoke.add(pivot);

    const front = (t) => ({ x: side * L * (0.05 + 0.95 * t), y: seraphCrownY(t) * YS, z: seraphCrownZ(t) * ZS });
    const chordAt = (t) => (1.72 + (0.44 - 1.72) * Math.min(t, 1)) * (t < 0.34 ? 1 + 0.14 * (1 - t / 0.34) : 1) * chordScale;   // shallower chord (less drooping trailing region)
    const rear = (t) => { const f = front(t); const c = chordAt(t); return { x: f.x * 0.99, y: f.y - 0.03 - 0.05 * t, z: f.z + c }; };   // shallower trailing droop (no staircase)
    const up = { x: 0, y: 1, z: 0 };

    const midO = front(J0), tipO = front(J1);
    const wingMid = new THREE.Group(); wingMid.position.set(midO.x, midO.y, midO.z);
    const wingTip = new THREE.Group(); wingTip.position.set(tipO.x - midO.x, tipO.y - midO.y, tipO.z - midO.z);
    wingMid.add(wingTip); pivot.add(wingMid);
    const O = (p, o) => ({ x: p.x - o.x, y: p.y - o.y, z: p.z - o.z });
    const ZERO = { x: 0, y: 0, z: 0 };

    // dorsal surface point (shallow vault); plates sit just proud of it
    const Psurf = (t, u, o) => { const f = front(t), r = rear(t); const p = lerp(f, r, u); p.y += 0.03 - 0.09 * Math.sin(Math.PI * u) * (0.5 + 0.5 * t); return O(p, o); };   // flatter vault

    // CAMBERED membrane fill (base surface under the plates)
    const membrane = (grp, ta, tb, o, mat) => {
      const nS = seg(4), nCh = 3, tris = [];
      for (let i = 0; i < nS; i++) {
        const t0 = ta + (tb - ta) * (i / nS), t1 = ta + (tb - ta) * ((i + 1) / nS);
        for (let j = 0; j < nCh; j++) {
          const u0 = j / nCh, u1 = (j + 1) / nCh;
          const a = Psurf(t0, u0, o), b = Psurf(t1, u0, o), c = Psurf(t1, u1, o), d = Psurf(t0, u1, o);
          // subtract the little +0.03 proud lift so the membrane sits BELOW the plates
          for (const p of [a, b, c, d]) p.y -= 0.05;
          tris.push([arr(a), arr(b), arr(c)], [arr(a), arr(c), arr(d)]);
        }
      }
      grp.add(flatTriMesh(tris, mat));
    };
    // gilded leading SPAR wedge along the crown edge (a gold sword-back)
    const spar = (grp, ta, tb, o) => {
      const nS = seg(4), tris = [];
      for (let i = 0; i < nS; i++) {
        const t0 = ta + (tb - ta) * (i / nS), t1 = ta + (tb - ta) * ((i + 1) / nS);
        const f0 = O(front(t0), o), f1 = O(front(t1), o);
        const th0 = 0.10 - 0.06 * t0, th1 = 0.10 - 0.06 * t1;
        const a0 = { x: f0.x, y: f0.y + th0, z: f0.z }, a1 = { x: f1.x, y: f1.y + th1, z: f1.z };
        const b0 = { x: f0.x, y: f0.y, z: f0.z - th0 }, b1 = { x: f1.x, y: f1.y, z: f1.z - th1 };
        tris.push([arr(f0), arr(a0), arr(a1)], [arr(f0), arr(a1), arr(f1)], [arr(f0), arr(b0), arr(a0)], [arr(a0), arr(b0), arr(b1)]);
      }
      grp.add(flatTriMesh(tris, goldMat));
    };

    const emit = (grp, L2, S2, H2, C2, litMat) => {
      if (L2.length) grp.add(flatTriMesh(L2, litMat));
      if (S2.length) grp.add(flatTriMesh(S2, shadowMat));
      if (H2.length) { grp.add(flatTriMesh(H2, goldMat)); }
      if (C2.length) grp.add(flatTriMesh(C2, dawnMat));
    };

    // SHINGLED plate rank (coverts/secondaries) — small/mid plates laid nearly FLAT on the
    // surface (follow the tangent, minimal aft droop → no staircase), overlap by construction,
    // value-stepped, each carrying the two-value bevel + a dawn channel.
    const shingleRank = (grp, ta, tb, o, plateMat, rows) => {
      const L2 = [], S2 = [], H2 = [], C2 = [];
      for (const row of rows) {
        const spanLen = (tb - ta) * L, cnt = Math.max(4, seg(Math.round(spanLen * 2.4)));
        for (let i = 0; i < cnt; i++) {
          const ts = cnt > 1 ? i / (cnt - 1) : 0;
          const t = ta + (tb - ta) * ts;
          const rootP = Psurf(t, row.u, o), aheadP = Psurf(t, Math.min(row.u + 0.16, 1), o);
          const dirAft = norm(sub(aheadP, rootP));                    // FOLLOW the surface (flat scale-mail, no droop)
          const len = row.len * chordAt(t);
          const wid = Math.max(spanLen / cnt / (1 - 0.62), 0.30);     // ~62% overlap → tips buried, no gaps
          const pl = seraphPlate(rootP, dirAft, { x: side, y: 0, z: 0 }, up, len, wid, 0.03, true);   // LOW ridge → lies flat
          L2.push(...pl.L); S2.push(...pl.S); H2.push(...pl.H); C2.push(...pl.C);
        }
      }
      emit(grp, L2, S2, H2, C2, plateMat);
    };

    // PRIMARY BLADE rank — few LARGE straight plates fanning from the carpal, ONE dominant
    // decaying ~0.84, cant/width/rake variance (breaks slat monotony), tips raked aft-and-slightly-
    // DOWN (no up-curl), ROOT-TUCKED under the coverts (root at u≈0.20, no daylight), channels on all,
    // TRUE SLOTS between them (separate blades → pinion slots the silhouette owns).
    const primaryRank = (grp, ta, tb, o, n) => {
      const L2 = [], S2 = [], H2 = [], C2 = [];
      for (let i = 0; i < n; i++) {
        const f = n > 1 ? i / (n - 1) : 0;
        const t = ta + (tb - ta) * (0.04 + 0.92 * f);
        const decay = Math.pow(0.84, i);
        const rootP = Psurf(t, 0.20, o);                              // tuck the root UNDER the covert rank
        const jit = (i % 2 ? 1 : -1);
        const dirAft = norm({ x: side * (0.12 + 0.26 * f), y: -0.015 - 0.025 * f, z: 1 });   // fan out, mostly aft-in-plane
        const len = chordAt(t) * (0.66 + 0.80 * decay);
        const wid = (0.52 + 0.16 * (1 - f)) * (1 + 0.16 * (i % 2));   // WIDE (overlap into a fan, not spaced steps) + variance
        const ridge = (0.06 + 0.04 * decay) * (1 + 0.12 * jit);       // ridge (rake) variance
        const pl = seraphPlate(rootP, dirAft, { x: side, y: 0, z: 0 }, up, len, wid, ridge, true);
        L2.push(...pl.L); S2.push(...pl.S); H2.push(...pl.H); C2.push(...pl.C);
      }
      emit(grp, L2, S2, H2, C2, platePrimary);
    };

    // BAY A (pivot) — membrane + spar + dense SHORT scale-mail rows (flat, tips buried → no staircase)
    membrane(pivot, 0.0, J0, ZERO, memInner);
    spar(pivot, 0.0, J0, ZERO);
    shingleRank(pivot, 0.03, J0, ZERO, plateCovert, [{ u: 0.08, len: 0.20 }, { u: 0.22, len: 0.22 }, { u: 0.38, len: 0.24 }, { u: 0.56, len: 0.28 }]);
    // BAY B (mid) — secondary scale-mail (hems form the continuous gilded greater-covert arc)
    membrane(wingMid, J0, J1, midO, memMid);
    spar(wingMid, J0, J1, midO);
    shingleRank(wingMid, J0, J1, midO, plateSecond, [{ u: 0.08, len: 0.22 }, { u: 0.22, len: 0.24 }, { u: 0.38, len: 0.28 }, { u: 0.56, len: 0.32 }]);
    // BAY C (tip / HAND) — outer scale-mail + the primary BLADE fan (wrist-fold group)
    membrane(wingTip, J1, 1.0, tipO, memOuter);
    spar(wingTip, J1, 0.86, tipO);
    shingleRank(wingTip, J1, 1.0, tipO, plateSecond, [{ u: 0.08, len: 0.22 }, { u: 0.24, len: 0.26 }, { u: 0.42, len: 0.30 }]);
    primaryRank(wingTip, J1, 0.99, tipO, nPrim);

    const marker = new THREE.Object3D(); const tc = O(front(1.0), tipO); marker.position.set(tc.x, tc.y, tc.z); wingTip.add(marker);

    // ROOT — pearl covert cowl lapping the yoke (overlap > weld) + inboard gusset (arm-side verts)
    for (let i = 0; i < 3; i++) {
      const t = 0.02 + i * 0.05, f = front(t), r = rear(t);
      const bx = { x: f.x, y: f.y + 0.05 + i * 0.02, z: f.z }, rr = { x: r.x * 0.7, y: r.y + 0.02, z: r.z * 0.55 };
      const ow = { x: side * (0.26 - i * 0.03), y: 0, z: 0 };
      yoke.add(flatTriMesh([[arr(add(bx, mul(ow, -1))), arr(add(bx, ow)), arr(rr)]], plateCovert));
    }
    const g0 = O(front(0.02), ZERO), g1 = O(rear(0.28), ZERO), g2 = { x: side * 0.02, y: -0.10, z: 1.05 };
    pivot.add(flatTriMesh([[arr(g0), arr(g1), arr(g2)]], memInner));

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
    wingMat: memInner, spineMats,
    flareMats: [memMid, memOuter, bellyMat],
    wingElements: { tipR: R.marker, tipL: Lf.marker },
  };
}
registerWings('aureoleWing', buildAureoleWing);
