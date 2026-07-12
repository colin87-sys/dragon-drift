import * as THREE from 'three';
import { seg } from './modelDetail.js';
import { registerWings, registerTorso, registerHead } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PEARL SERAPH — REDESIGN (CP1: WING + BODY). Coexists default-off; the shipped
// `seraphWing`/`seraphHull` are untouched. This module kills the paper-dart:
//   • WING  — a raised angelic GULL arch stated as a profile FUNCTION (seraphArm),
//     DOMINANT + decaying wedge-thick plate-feathers (no picket fence), a CAMBERED
//     3-tier membrane (wingInner→mid→wingOuter, finally used), a WRIST-FOLD hand at
//     the −carpal anchor, and a root COWL + GUSSET so the wing grows from the shoulder.
//     Glow = the dawn shaft-ridge on the 2 dominant primaries + the spar groove
//     (components, withheld in cruise), never an LED strip.
//   • HULL  — a curved LINE-OF-ACTION spine (chest proud → waist dip → hip rise), one
//     continuous lofted NECK (honours neckSegments), the paladin gorget/pauldron/keel
//     re-seated, and PUBLISHED measurement handles (spinePoints / motifAnchor) so the
//     §7 harness can finally measure this dragon.
// Surface language unchanged: matte pearl + true metallic gold + dawn-blue seam + gem.
// ═══════════════════════════════════════════════════════════════════════════════

const D2R = Math.PI / 180;
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul = (a, s) => ({ x: a.x * s, y: a.y * s, z: a.z * s });
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
const arr = (p) => [p.x, p.y, p.z];

const SERAPH_PEARL = 0xF2F0EA, SERAPH_GOLD = 0xEDB63E, SERAPH_DAWN = 0x88DFFF;   // warm gold (yellower 0xD6AF4A crushed to olive/green reflecting the sky)
const SERAPH_HOLY = 0xFFF3C8, SERAPH_GEM = 0x8FEAFF;

// ── PROFILE-AS-FUNCTION (module-level; shared by geometry + FX marker, §5.6) ──────
// The leading-edge spine of one canonical (+X) wing as a function of span t∈[0,1].
// A raised angelic GULL: climb to a carpal apex ~t0.42, ease down toward the tip
// (never up-curling); an OGEE in Z bows FORWARD mid-span then rakes hard AFT to the tip.
function seraphArm(t, L) {
  const tc = Math.min(Math.max(t, 0), 1);
  const x = L * (0.05 + 0.95 * tc);
  let y;                                                  // gull arch
  const peak = 0.42;
  if (tc <= peak) { const u = tc / peak; y = 0.98 * Math.sin(u * Math.PI * 0.5); }
  else { const u = (tc - peak) / (1 - peak); y = 0.98 - 0.46 * u * u; }
  const z = -0.52 * Math.sin(Math.PI * tc) * (1 - tc) + 1.05 * tc * tc;  // forward bow → aft rake
  return { x, y, z };
}

// ── FEATHER — a real cambered VANE with a raised rachis RIDGE (thickness by geometry,
// not a decal) tapering to a ROUNDED tip. Cross-section is a shallow tent (ridge up,
// two vanes dropped by `camber`) so light breaks across every feather in the close read;
// the whole shaft bows gently down-aft (no up-curl). The rachis ridge is GEOMETRY — a
// thin raised gold (or dawn, on dominants) tent along the spine — so seams are formed,
// never inked. `outb` = local outboard unit (spread axis), `up` = +Y.
function seraphFeather(root, dirAft, outb, len, wid, camber, plate, gild, dawn) {
  const g = new THREE.Group();
  const up = { x: 0, y: 1, z: 0 };
  const N = 4;
  // width profile: broad near the base, holding WIDTH toward a ROUNDED paddle tip (a fanned
  // feather, not a hanging blade) — low taper so the tip reads full, never a needle.
  const wof = (u) => wid * (Math.pow(Math.sin(Math.PI * Math.min(u * 0.86 + 0.14, 1)), 0.42) * (1 - 0.10 * u)) + 0.03;
  const rach = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const along = add(root, mul(dirAft, len * u));
    const ridgeH = (0.075 + 0.075 * (1 - u));                // raised rachis, easing to tip
    rach.push(add(along, mul(up, ridgeH)));
  }
  const vane = [];
  for (let i = 0; i < N; i++) {
    const u0 = i / N, u1 = (i + 1) / N;
    const r0 = rach[i], r1 = rach[i + 1];
    const e0 = wof(u0), e1 = wof(u1);
    const drop = (u) => mul(up, -camber * (0.4 + 0.6 * u));   // vanes sag below the ridge → tent + bow
    const L0 = add(add(r0, mul(outb, -e0)), drop(u0)), R0 = add(add(r0, mul(outb, e0)), drop(u0));
    const L1 = add(add(r1, mul(outb, -e1)), drop(u1)), R1 = add(add(r1, mul(outb, e1)), drop(u1));
    vane.push([arr(r0), arr(L0), arr(L1)], [arr(r0), arr(L1), arr(r1)],   // left vane
              [arr(r0), arr(R1), arr(R0)], [arr(r0), arr(r1), arr(R1)]);  // right vane
  }
  g.add(flatTriMesh(vane, plate));
  // rachis RIDGE as a thin raised tent of GEOMETRY (gold, or dawn on the dominants)
  const rmat = dawn || gild;
  const ridge = [];
  for (let i = 0; i < N; i++) {
    const r0 = rach[i], r1 = rach[i + 1];
    const a0 = add(r0, mul(up, 0.022)), a1 = add(r1, mul(up, 0.022));
    const b0 = add(r0, mul(outb, 0.02)), b1 = add(r1, mul(outb, 0.02));
    const c0 = add(r0, mul(outb, -0.02)), c1 = add(r1, mul(outb, -0.02));
    ridge.push([arr(a0), arr(b0), arr(a1)], [arr(a1), arr(b0), arr(b1)],
               [arr(a0), arr(a1), arr(c0)], [arr(a1), arr(c1), arr(c0)]);
  }
  g.add(flatTriMesh(ridge, rmat));
  return g;
}

function buildSeraphWing2(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale ?? 1;
  const gi = Math.min(giM ?? 1, 1.3);
  const formLevel = Math.min(model.formLevel ?? 3, 3);

  // ── MATERIALS — 3 membrane value tiers + gold gild + dawn seam + cool belly ──
  const mkPearl = (col, rough) => new THREE.MeshStandardMaterial({ color: col, flatShading: true, side: THREE.DoubleSide, roughness: rough ?? 0.55, metalness: 0.07 });
  const memInner = mkPearl(def.wingInner ?? 0xF4F1EA, 0.58);   // lit inboard
  const memMid   = mkPearl(0xD9E2F0, 0.55);                     // steel-pearl mid
  const memOuter = mkPearl(def.wingOuter ?? 0x6AA0F0, 0.50);   // designed dawn-blue outboard (finally used)
  const bellyMat = mkPearl(0x9FB4CE, 0.60);                     // cooler ventral tone (two-tone law)
  const goldMat  = new THREE.MeshStandardMaterial({ color: SERAPH_GOLD, flatShading: true, side: THREE.DoubleSide, roughness: 0.42, metalness: 0.28, emissive: 0x3a2606, emissiveIntensity: 0.13 });   // low metalness so broad faces don't reflect the sky green
  const seamCol  = def.wingEmissive ?? SERAPH_DAWN;
  const dawnMat  = new THREE.MeshStandardMaterial({ color: seamCol, emissive: seamCol, emissiveIntensity: 0.05 * gi, roughness: 0.35, side: THREE.DoubleSide });
  dawnMat.userData.baseEmissive = seamCol; dawnMat.userData.baseIntensity = 0.05 * gi;   // WITHHELD in cruise → blazes on Surge
  spineMats.push(dawnMat);
  const memFor = (t) => (t < 0.34 ? memInner : t < 0.68 ? memMid : memOuter);

  const L = 4.8 * ws;
  const dih = (model.wingDihedralDeg ?? 14) * D2R;             // chase-cam knob
  const J0 = 0.34, J1 = 0.66;                                  // pivot→mid→tip (=carpal) splits
  // primary count grows up the ladder (5→8); dominant+decay
  const nPrim = [3, 4, 5, 6][formLevel];   // FEWER, larger, fanned dominant primaries (a feather group, not a fringe)
  const nSec  = [4, 4, 5, 5][formLevel];   // secondary bridge (closes the covert→primary gap)
  const nCov  = [3, 3, 4, 4][formLevel];

  function buildSide(side) {
    const yoke = new THREE.Group();
    const wr = attach.wingRoot(side);
    yoke.position.set(wr.x, wr.y, wr.z);
    yoke.rotation.z = side * dih;                             // raise the whole wing (angelic spread)
    const pivot = new THREE.Group(); yoke.add(pivot);

    // spine + chord in the wing-root LOCAL frame (mirror handles L via outer wrapper)
    const S = (t) => { const p = seraphArm(t, L); return { x: side * p.x, y: p.y, z: p.z }; };
    const chordAt = (t) => (1.95 + (0.55 - 1.95) * Math.min(t, 1)) * (t < 0.34 ? 1 + 0.12 * (1 - t / 0.34) : 1);
    const outbAt = (t) => ({ x: side, y: 0, z: 0 });         // local outboard unit
    const front = (t) => S(t);
    const rear  = (t) => { const f = S(t); const c = chordAt(t); return { x: f.x * 0.99, y: f.y - 0.05 - 0.12 * t, z: f.z + c }; };

    const midO = S(J0), tipO = S(J1);
    const wingMid = new THREE.Group(); wingMid.position.set(midO.x, midO.y, midO.z);
    const wingTip = new THREE.Group(); wingTip.position.set(tipO.x - midO.x, tipO.y - midO.y, tipO.z - midO.z);
    wingMid.add(wingTip); pivot.add(wingMid);

    const O = (p, o) => ({ x: p.x - o.x, y: p.y - o.y, z: p.z - o.z });
    const ZERO = { x: 0, y: 0, z: 0 };

    // CAMBERED membrane patch over [ta,tb] × chord, subdivided, in local origin o.
    // Downward billow (−y) peaking mid-chord → a curved surface, never a flat quad.
    const membrane = (grp, ta, tb, o, nSpan, ventral) => {
      const nCh = 3, camber = 0.16;
      const P = (t, u) => {
        const f = front(t), r = rear(t);
        const p = lerp(f, r, u);
        p.y -= camber * Math.sin(Math.PI * u) * (0.5 + 0.5 * t);      // billow, deeper outboard
        if (ventral) p.y -= 0.05;                                      // belly skin drop
        return O(p, o);
      };
      for (let i = 0; i < nSpan; i++) {
        const t0 = ta + (tb - ta) * (i / nSpan), t1 = ta + (tb - ta) * ((i + 1) / nSpan);
        const mat = ventral ? bellyMat : memFor((t0 + t1) / 2);
        const tris = [];
        for (let j = 0; j < nCh; j++) {
          const u0 = j / nCh, u1 = (j + 1) / nCh;
          const a = P(t0, u0), b = P(t1, u0), c = P(t1, u1), d = P(t0, u1);
          tris.push([arr(a), arr(b), arr(c)], [arr(a), arr(c), arr(d)]);
        }
        grp.add(flatTriMesh(tris, mat));
      }
    };

    // gilded leading SPAR as a wedge tent (thick root → thin tip) along the front edge
    const spar = (grp, ta, tb, o, nSp) => {
      const tris = [];
      for (let i = 0; i < nSp; i++) {
        const t0 = ta + (tb - ta) * (i / nSp), t1 = ta + (tb - ta) * ((i + 1) / nSp);
        const f0 = O(front(t0), o), f1 = O(front(t1), o);
        const th0 = 0.10 - 0.07 * t0, th1 = 0.10 - 0.07 * t1;
        const a0 = { x: f0.x, y: f0.y + th0, z: f0.z }, a1 = { x: f1.x, y: f1.y + th1, z: f1.z };
        const b0 = { x: f0.x, y: f0.y, z: f0.z - th0 }, b1 = { x: f1.x, y: f1.y, z: f1.z - th1 };
        tris.push([arr(f0), arr(a0), arr(a1)], [arr(f0), arr(a1), arr(f1)],
                  [arr(f0), arr(b0), arr(a0)], [arr(a0), arr(b0), arr(b1)]);
      }
      grp.add(flatTriMesh(tris, goldMat));
    };

    // FEATHER RANK — a DOMINANT carpal feather decaying aft (longest ~2.2× shortest),
    // laid so each vane OVERLAPS its neighbour ~45% (shingled plumage, not a picket comb),
    // raked AFT-in-plane with only a slight droop. Camber bows every feather so light
    // breaks across it. `dawnN` dominant feathers carry the withheld dawn rachis-seam.
    const rank = (grp, ta, tb, n, o, lenScale, camber, fan, dawnN, plateMat) => {
      for (let i = 0; i < n; i++) {
        const f = n > 1 ? i / (n - 1) : 0;
        const t = ta + (tb - ta) * f;
        const decay = Math.pow(0.80, i);                     // DOMINANT + strong decay (2.2×+ spread)
        const root = O(rear(t), o);
        root.y += 0.026 * i;                                 // shingle lift → overlap reads as a soft seam
        const c = chordAt(t);
        // rake AFT with an outboard FAN (tips spread like a hand-fan, `fan` scales it) + slight droop
        const dirAft = (() => { const v = { x: side * (0.12 + 0.30 * fan * f), y: -0.04 - 0.03 * f, z: 1 }; const m = Math.hypot(v.x, v.y, v.z); return { x: v.x / m, y: v.y / m, z: v.z / m }; })();
        const len = c * lenScale * (0.48 + 0.95 * decay);    // dominant markedly longer than the tail
        // BROAD relative to the inter-feather step → adjacent vanes overlap heavily (no sky-gap)
        const step = (tb - ta) * L / Math.max(n - 1, 1);
        const wid = Math.max(step * 2.7, 0.56);
        const dawn = i < dawnN ? dawnMat : null;
        grp.add(seraphFeather(root, dirAft, outbAt(t), len, wid, camber, plateMat, goldMat, dawn));
      }
    };

    const nS = seg(4);
    // PART A — pivot (0→J0): membrane + spar + a shingled covert field (rounded plumes).
    // Coverts reach PAST J0 (lenScale high) so the surface is closed into the mid — no scoop-gap.
    membrane(pivot, 0.0, J0, ZERO, nS); membrane(pivot, 0.0, J0, ZERO, nS, true);
    spar(pivot, 0.0, J0, ZERO, nS);
    rank(pivot, 0.05, J0, seg(nCov), ZERO, 1.05, 0.11, 0.8, 0, memInner);
    // PART B — mid (J0→J1): the SECONDARY bridge rank — overlaps into the tip, closing the
    // covert→primary gap into one continuous feathered surface.
    membrane(wingMid, J0, J1, midO, nS); membrane(wingMid, J0, J1, midO, nS, true);
    spar(wingMid, J0, J1, midO, nS);
    rank(wingMid, J0 - 0.02, J1, seg(nSec), midO, 1.30, 0.14, 1.0, 0, memMid);
    // PART C — tip/HAND (J1→1): the wrist-fold sheet — outer membrane + the DOMINANT primaries
    // (the carpal feather is the longest, decaying aft). 3 carry the withheld dawn rachis-seam.
    membrane(wingTip, J1, 1.0, tipO, nS); membrane(wingTip, J1, 1.0, tipO, nS, true);
    spar(wingTip, J1, 1.0, tipO, nS);
    rank(wingTip, J1, 0.99, seg(nPrim), tipO, 1.45, 0.17, 1.5, 3, memOuter);
    const marker = new THREE.Object3D(); const tc = O(S(1.0), tipO); marker.position.set(tc.x, tc.y, tc.z); wingTip.add(marker);

    // ── ROOT INTEGRATION (the wing GROWS from the shoulder) ──
    // COWL — 2–3 pearl covert plates lapping over the wing root (overlap > weld). Parented
    // to the YOKE (yoke-local coords) so the mirror clone reproduces it on BOTH sides.
    for (let i = 0; i < 3; i++) {
      const t = 0.02 + i * 0.05, f = front(t), r = rear(t);
      const bx = { x: f.x, y: f.y + 0.05 + i * 0.02, z: f.z };
      const rr = { x: r.x * 0.7, y: r.y + 0.02, z: r.z * 0.55 };
      const ow = { x: side * (0.26 - i * 0.03), y: 0, z: 0 };
      yoke.add(flatTriMesh([
        [arr(add(bx, mul(ow, -1))), arr(add(bx, ow)), arr(rr)],
        [arr(add(bx, mul(ow, -1))), arr(rr), arr(add(rr, mul(ow, -0.4)))],
      ], memInner));
      const gr = { x: side * (0.24 - i * 0.03), y: 0.012, z: 0 };
      yoke.add(flatTriMesh([[arr(add(bx, mul(gr, -1))), arr(add(bx, gr)), arr(add(rr, { x: 0, y: 0.012, z: 0 }))]], goldMat));
    }
    // GUSSET — a propatagium sweeping from the root aft-inboard to the hip line (arm-side).
    const g0 = O(front(0.02), ZERO), g1 = O(rear(0.30), ZERO), g2 = { x: side * 0.02, y: -0.10, z: 1.15 };
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
    // measurement handle (§7): the outer wingtip in the wing-group frame, both sides
    wingElements: { tipR: R.marker, tipL: Lf.marker },
  };
}
registerWings('seraphWing2', buildSeraphWing2);

// ═══════════════════════════════════════════════════════════════════════════════
// HULL — curved line-of-action spine + continuous neck + re-seated paladin armor +
// PUBLISHED measurement handles. Same attach-contract shape as seraphHull so the
// existing crown head + comet tail still mount (CP1 = body+wings; head/tail = CP2).
// ═══════════════════════════════════════════════════════════════════════════════
const TORSO_Y = 0.2;

function loftEllipse(rings, mat, nSeg) {
  const N = nSeg ?? seg(12);
  const verts = [];
  for (const r of rings) for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    verts.push(Math.cos(a) * r.rx, Math.sin(a) * r.ry + (r.cy ?? 0), r.z);
  }
  const idx = [];
  for (let s = 0; s < rings.length - 1; s++) {
    const a0 = s * N, b0 = (s + 1) * N;
    for (let m = 0; m < N; m++) { const n = (m + 1) % N; idx.push(a0 + m, b0 + m, a0 + n, a0 + n, b0 + m, b0 + n); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}
const gemNode = (r, mat) => new THREE.Mesh(new THREE.OctahedronGeometry(r, 0), mat);

function seraphMats2(def, gi) {
  const g = Math.min(gi ?? 1, 1.3);
  const pearl = new THREE.MeshStandardMaterial({ color: def.body ?? SERAPH_PEARL, flatShading: true, side: THREE.DoubleSide, roughness: 0.58, metalness: 0.06 });
  const belly = new THREE.MeshStandardMaterial({ color: def.belly ?? 0xFFF4D8, flatShading: true, side: THREE.DoubleSide, roughness: 0.62, metalness: 0.05 });
  const gold  = new THREE.MeshStandardMaterial({ color: SERAPH_GOLD, flatShading: true, side: THREE.DoubleSide, roughness: 0.42, metalness: 0.28, emissive: 0x3a2606, emissiveIntensity: 0.13 });   // low metalness so broad faces hold gold (high metalness crushed to olive/green)
  const dawnCol = def.wingEmissive ?? SERAPH_DAWN;
  const dawn = new THREE.MeshStandardMaterial({ color: dawnCol, emissive: dawnCol, emissiveIntensity: 0.05 * g, roughness: 0.4, side: THREE.DoubleSide });
  dawn.userData.baseEmissive = dawnCol; dawn.userData.baseIntensity = 0.05 * g;
  const gem = new THREE.MeshStandardMaterial({ color: SERAPH_GEM, emissive: SERAPH_GEM, emissiveIntensity: 1.9 * g, roughness: 0.10, metalness: 0.0 });
  gem.userData.baseEmissive = SERAPH_GEM; gem.userData.baseIntensity = 1.9 * g;
  const holy = new THREE.MeshStandardMaterial({ color: SERAPH_HOLY, emissive: SERAPH_HOLY, emissiveIntensity: 2.0 * g, roughness: 0.25, side: THREE.DoubleSide });
  holy.userData.baseEmissive = SERAPH_HOLY; holy.userData.baseIntensity = 2.0 * g;
  return { pearl, belly, gold, dawn, gem, holy };
}

function buildSeraphHull2(def, model, bodyMat) {
  const group = new THREE.Group();
  const mats = seraphMats2(def, model.glowIntensity);
  const spineMats = [mats.dawn, mats.gem, mats.holy];
  const formLevel = model.formLevel ?? 3;
  const gorgetLayers = model.gorgetLayers ?? 4;

  // LINE OF ACTION: a curved spine cy(z) — chest lifts, waist dips, hip rises — so the
  // body reads as posture, not a level tube. Every ring rides this curve.
  const cyAt = (z) => TORSO_Y + 0.29 * Math.exp(-((z + 0.55) ** 2) / 0.28) - 0.20 * Math.exp(-((z - 0.42) ** 2) / 0.15) + 0.16 * Math.exp(-((z - 0.86) ** 2) / 0.09);
  const ring = (z, rx, ry) => ({ z, rx, ry, cy: cyAt(z) });
  const hull = loftEllipse([
    ring(-1.00, 0.06, 0.07), ring(-0.82, 0.40, 0.50), ring(-0.43, 0.56, 0.66),
    ring(-0.06, 0.60, 0.66), ring(0.24, 0.33, 0.46), ring(0.50, 0.24, 0.38),
    ring(0.74, 0.37, 0.37), ring(0.94, 0.22, 0.28), ring(1.08, 0.05, 0.06),
  ], mats.pearl, seg(14));
  group.add(hull);

  // published spine handle (measurement / motif drift / future FX)
  const spinePoints = [];
  for (let i = 0; i <= 8; i++) { const z = -1.0 + i * (2.08 / 8); spinePoints.push(new THREE.Vector3(0, cyAt(z) + 0.30, z)); }

  // GORGET STACK (paladin armor, re-seated on the curved chest) — laddered 2→4
  for (let i = 0; i < gorgetLayers; i++) {
    const widthScale = 1 - 0.16 * (i / 3);
    const z = -0.60 + i * 0.15, y = cyAt(z) + 0.24 - i * 0.06, rad = 0.53 * widthScale, arc = Math.PI * (118 / 180);
    const goldArc = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.046, seg(5), seg(12), arc), mats.gold);
    goldArc.rotation.y = Math.PI / 2; goldArc.position.set(0, y, z); goldArc.rotation.z = Math.PI - arc / 2;
    const pearlArc = new THREE.Mesh(new THREE.TorusGeometry(rad * 0.88, 0.024, seg(5), seg(12), arc * 0.92), mats.pearl);
    pearlArc.rotation.copy(goldArc.rotation); pearlArc.position.set(0, y + 0.010, z);
    group.add(goldArc, pearlArc);
  }

  // SHOULDER PAULDRONS (enlarged so the wing yoke plugs UNDER holy armor)
  const wrBase = { x: 0.74, y: cyAt(-0.30) + 0.05, z: -0.30 };
  for (const s of [-1, 1]) {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.34, seg(8), seg(6), 0, Math.PI * 2, 0, Math.PI * 0.6), mats.pearl);
    dome.scale.set(0.92, 0.62, 1.08); dome.position.set(s * wrBase.x, wrBase.y, wrBase.z);
    dome.rotation.z = s * -5 * D2R; dome.rotation.y = s * 8 * D2R; group.add(dome);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.032, seg(5), seg(14), Math.PI), mats.gold);
    rim.position.copy(dome.position); rim.rotation.x = Math.PI / 2; rim.rotation.z = s * -5 * D2R; group.add(rim);
    const gem = gemNode(0.055, mats.gem); gem.position.set(s * (wrBase.x + 0.02), wrBase.y + 0.11, wrBase.z - 0.04); group.add(gem);
  }

  // gilded STERNUM KEEL along the curved centreline
  const keelStations = [{ z: -0.62, w: 0.030, h: 0.030 }, { z: -0.30, w: 0.042, h: 0.050 }, { z: 0.05, w: 0.038, h: 0.046 }, { z: 0.30, w: 0.026, h: 0.032 }, { z: 0.46, w: 0.014, h: 0.016 }];
  const keelTris = [];
  for (let i = 0; i < keelStations.length - 1; i++) {
    const a = keelStations[i], b = keelStations[i + 1];
    const kyA = cyAt(a.z) - 0.34, kyB = cyAt(b.z) - 0.34;
    const aT = [0, kyA + a.h, a.z], aL = [-a.w, kyA, a.z], aR = [a.w, kyA, a.z];
    const bT = [0, kyB + b.h, b.z], bL = [-b.w, kyB, b.z], bR = [b.w, kyB, b.z];
    keelTris.push([aT, bT, aR], [aR, bT, bR], [aT, aL, bT], [aL, bL, bT], [aL, aR, bL], [aR, bR, bL]);
  }
  group.add(flatTriMesh(keelTris, mats.gold));

  // HAUNCH FAIRINGS at the tail root (long low domes, swept back)
  for (const s of [-1, 1]) {
    const fair = new THREE.Mesh(new THREE.SphereGeometry(0.20, seg(8), seg(6), 0, Math.PI * 2, 0, Math.PI * 0.62), mats.pearl);
    fair.scale.set(0.66, 0.55, 1.40); fair.position.set(s * 0.30, cyAt(0.60) - 0.05, 0.60); fair.rotation.y = s * 10 * D2R; group.add(fair);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.015, seg(4), seg(12), Math.PI), mats.gold);
    rim.position.set(s * 0.30, cyAt(0.60) - 0.05, 0.60); rim.rotation.x = Math.PI / 2; rim.rotation.z = s * 10 * D2R; group.add(rim);
  }

  // dawn FLANK SEAMS — withheld glow COMPONENTS along the flank muscle lines (in spineMats
  // → near-dark in cruise, blaze on Surge). Carved-groove read, not an LED strip.
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const z = -0.28 + i * 0.28;
    const seamG = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.05, 0.40), mats.dawn);
    seamG.position.set(s * (0.42 - 0.06 * i), cyAt(z) + 0.03, z); seamG.rotation.y = s * 0.30;
    group.add(seamG);
  }

  // NECK — ONE continuous lofted tube through 5 stations in a gentle S up to the head
  // (honours neckSegments); 2 partial gorget-language collars instead of full rings.
  const nStations = Math.max(4, Math.min(model.neckSegments ?? 5, 7));
  const neckRings = [];
  for (let i = 0; i <= nStations; i++) {
    const f = i / nStations;
    const z = -0.92 - f * 0.86;
    const y = cyAt(-0.92) + 0.10 + f * 0.30 + 0.05 * Math.sin(f * Math.PI);   // S-curve rise
    const r = 0.30 - 0.11 * f;
    neckRings.push({ z, rx: r, ry: r * 1.08, cy: y });
  }
  group.add(loftEllipse(neckRings, mats.pearl, seg(10)));
  for (const cf of [0.25, 0.62]) {
    const i = Math.round(cf * nStations), rr = neckRings[i];
    const collar = new THREE.Mesh(new THREE.TorusGeometry(rr.rx * 0.92, 0.02, seg(4), seg(12), Math.PI * 1.2), mats.gold);
    collar.rotation.y = Math.PI / 2; collar.rotation.z = Math.PI - 0.6; collar.position.set(0, rr.cy, rr.z);
    group.add(collar);
  }

  // ── ATTACH CONTRACT (same shape as seraphHull; head/tail mount unchanged) ──
  const wr = { x: 0.82, y: cyAt(-0.34) - 0.04, z: -0.34 };
  const cy = TORSO_Y;
  const attach = {
    wingRoot: (side) => ({ x: side * wr.x, y: wr.y, z: wr.z }),
    headBase: { x: 0, y: cyAt(-1.78) + 0.40, z: -1.78 },
    tailAnchor: { y: cyAt(0.96) - 0.18, z: 0.96 },
    keelTopAt: (z) => cyAt(z) + 0.40 * Math.max(0, 1 - Math.abs(z + 0.06) / 1.2),
    halfWidthAt: (z) => 0.60 * Math.max(0.15, 1 - Math.abs(z + 0.06) / 1.4),
    bodyMidY: cy, tailShift: 0, bodyMatDouble: mats.pearl, shoulderSkin: null,
    // the ONE motif carrier (D5): the brow-gem line, rear-read via the halo
    motifAnchor: new THREE.Vector3(0, cyAt(-1.78) + 0.5, -1.9),
    spinePoints,
  };
  return { group, attach, spineMats };
}
registerTorso('seraphHull2', buildSeraphHull2);

// ── HEAD + CROWN-HALO (redesign variant) — same architecture as the shipped
// seraphCrownHead but on the corrected (non-olive) gold + curved horns instead of
// straight stick cones + a lofted jaw instead of a box. Pre-stages CP2; used now so
// the CP1 gate isn't dinged by the shared head's metal-crushed gold band.
function buildSeraphCrownHead2(def, model, mats0) {
  const headGroup = new THREE.Group();
  const mats = seraphMats2(def, model.glowIntensity);
  const spineMats = [mats.dawn, mats.holy, mats.gem];
  const formLevel = model.formLevel ?? 3;

  const skull = loftEllipse([
    { z: -0.42, rx: 0.06, ry: 0.06 }, { z: -0.24, rx: 0.14, ry: 0.11 },
    { z: -0.02, rx: 0.22, ry: 0.16 }, { z: 0.22, rx: 0.21, ry: 0.16 }, { z: 0.34, rx: 0.10, ry: 0.10 },
  ], mats.pearl, seg(8));
  skull.rotation.x = -4 * D2R; headGroup.add(skull);

  // lofted lower jaw (not a box)
  const jaw = loftEllipse([
    { z: -0.34, rx: 0.05, ry: 0.03, cy: -0.10 }, { z: -0.18, rx: 0.10, ry: 0.05, cy: -0.11 }, { z: -0.02, rx: 0.12, ry: 0.055, cy: -0.10 },
  ], mats.pearl, seg(6));
  headGroup.add(jaw);

  // gilded brow band + 5 crown points (corrected gold)
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.16), mats.gold);
  brow.position.set(0, 0.14, -0.04); brow.rotation.x = -6 * D2R; headGroup.add(brow);
  const ptH = [0.10, 0.13, 0.18, 0.13, 0.10];
  for (let i = 0; i < 5; i++) {
    const pt = new THREE.Mesh(new THREE.ConeGeometry(0.022, ptH[i], seg(4)), mats.gold);
    pt.position.set((i - 2) * 0.075, 0.20 + ptH[i] * 0.4, -0.02); pt.rotation.x = -10 * D2R; headGroup.add(pt);
  }
  const browGem = gemNode(0.040, mats.gem); browGem.position.set(0, 0.17, -0.10); headGroup.add(browGem);   // the MOTIF carrier (D5)

  // CURVED swept horns (2-segment, tapering) — curve vs the straight crown points
  for (const s of [-1, 1]) {
    const h = new THREE.Group();
    const seg1 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.20, seg(4)), mats.gold);
    seg1.position.set(0, 0.10, 0); h.add(seg1);
    const seg2 = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.16, seg(4)), mats.gold);
    seg2.position.set(0, 0.25, 0.06); seg2.rotation.x = 40 * D2R; h.add(seg2);
    h.position.set(s * 0.15, 0.16, 0.10); h.rotation.set(40 * D2R, 0, s * -12 * D2R); headGroup.add(h);
  }

  for (const s of [-1, 1]) { const eye = gemNode(0.05, mats.gem); eye.position.set(s * 0.15, 0.04, -0.16); headGroup.add(eye); }

  let halo = null;
  if (model.halo) {
    halo = new THREE.Group(); halo.position.set(0, 0.62, 0.02);
    halo.rotation.x = 0.30;                                 // slight tilt → reads as a ring (not an edge-on bar) from side + chase
    const R = 0.34;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.038, seg(6), seg(20)), mats.holy);
    ring.rotation.x = Math.PI / 2; halo.add(ring);
    const shards = formLevel >= 3 ? 6 : 5;
    for (let i = 0; i < shards; i++) {
      const a = (i / shards) * Math.PI * 2;
      const shard = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.10, seg(4)), mats.gold);
      shard.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); shard.rotation.z = -Math.PI / 2; shard.rotation.y = -a; halo.add(shard);
    }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; const gem = gemNode(0.024, mats.gem); gem.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); halo.add(gem); }
    halo.userData.haloBob = true; headGroup.add(halo);
  }
  return { group: headGroup, spineMats, halo };
}
registerHead('seraphCrownHead2', buildSeraphCrownHead2);
