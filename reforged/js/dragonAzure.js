import * as THREE from 'three';
import { registerTorso, registerWings } from './dragonRecipe.js';
import { buildTorso, ARROW_PROFILE } from './dragonTorso.js';
import { bone } from './dragonParts.js';
import { seg } from './modelDetail.js';
import { applyFresnelRim } from './surface.js';

// ═══════════════════════════════════════════════════════════════════════════════
// AZURE DRAKE — "The trusted courier" (AAA-PIPELINE revision).
// A FALCON-FUSED sky-courier drake, rebuilt to the premium bar (Tempest/Revenant
// floor) WITHOUT competing with the Eternal class: the premium read is CRAFT —
// wedge-thick falcon primaries in a dominant+decay comb over a connected covert
// web, a 4-tier value-ladder hull with a cool identity rim, a real wingParts-3
// wrist-fold beat — and ONE withheld signature FX, THE SLIPSTREAM: a recessed ion
// filament nape→tail that idles DARK (eyes + a single terminus stud are the only
// live points) and ignites on Surge, capped at ~45% of the Eternal ceiling
// (Radiant never out-blazes Eternal).
//
// Three self-registering builders (azure-exclusive, coexist default-off):
//   falconKeelTorso · falconCombWings   (+ shared draconic head / clean tail via dials)
// Reuses the dragonTempest.js PATTERNS (mats factory, DataTexture glow sprite,
// −anchor wrist fold, outer-wrapper mirror) with FRESH falcon geometry.
// Axis: head/forward −Z, tail/rear +Z, right +X, up +Y; torso baseline y≈0.2.
// ═══════════════════════════════════════════════════════════════════════════════

// deterministic index-hash jitter (never Math.random — reproducible builds, AAA tell 2)
function jit(i, amp) { const h = Math.sin((i + 1) * 12.9898 + 4.1) * 43758.5453; return (h - Math.floor(h) - 0.5) * 2 * amp; }
// hex-lerp (value banding tracks the per-form ladder)
function lerpHex(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
}

// The PREMIUM point-of-light glow — a radial-gradient ALPHA sprite (AAA tell 5). Stacked additive
// meshes ring; a single solid mesh clips to a polygon; a sprite with a smooth alpha falloff to 0 at
// the rim has neither. The gradient lives in a DataTexture (DOM-free — the Node geometry tests build
// the dragon; a CanvasTexture would throw). One shared white texture; tint/size/opacity per use.
let _glowTex = null;
function glowTexture() {
  if (_glowTex) return _glowTex;
  const S = 64, data = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (x + 0.5) / S - 0.5, dy = (y + 0.5) / S - 0.5, d = Math.min(1, Math.hypot(dx, dy) * 2);
    const a = Math.pow(Math.max(0, 1 - d), 2.4);
    const i = (y * S + x) * 4; data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = Math.round(a * 255);
  }
  const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
  _glowTex = t; return t;
}
function softGlow(color, size, opacity) {
  const m = new THREE.SpriteMaterial({ map: glowTexture(), color: new THREE.Color(color), transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: true });
  const s = new THREE.Sprite(m); s.scale.setScalar(size); return s;
}

// ── THE FALCON-KEEL TORSO ────────────────────────────────────────────────────
// The shipped arrow loft with a bespoke profile (a deeper raptor breast keel + a
// haunch swell — two named masses that break the OUTLINE, DD §3.1) and a 4-tier
// diffuse value LADDER painted per facet-column as longitudinal strakes (AAA §1.3
// / DD §2.11) so the rear-chase hull carves instead of reading as one flat tube.
const AZURE_FALCON_PROFILE = (() => {
  const p = { ...ARROW_PROFILE };
  p.stations = ARROW_PROFILE.stations.map((s) => s.slice());
  p.keel = ARROW_PROFILE.keel.map((s) => s.slice());
  // shoulder peak station [-0.85, 0.66, 0.54, 0.46] → a deeper falcon breast (keelTop + belly)
  p.stations[3][2] = 0.62; p.stations[3][3] = 0.54;
  p.keel[1][1] = 0.62;
  // hip station [1.15, 0.29, 0.25, 0.20] → a haunch swell (halfWidth)
  p.stations[6][1] = 0.34;
  return p;
})();

// The 8 loft columns (bladeRing): 0 keel-top, 4 belly-bottom, 2/6 flanks. Map each to a value tier
// so the top carries the dorsal highlight (the scute-channel walls), the under-wing flanks carry the
// shadow channel, and the belly keeps its pale falcon underside. Endpoints spread wide (DD §3.2).
function paintFalconHull(geo, def) {
  const pos = geo.attributes.position, n = pos.count, cols = [];
  const cShadow = new THREE.Color(def.bodyShadow ?? 0x1b3049);
  const cBase = new THREE.Color(def.body ?? 0x27435f);
  const cFacet = new THREE.Color(def.bodyFacet ?? 0x3d5f83);
  const cDorsal = new THREE.Color(def.bodyDorsal ?? 0x4f759c);
  const cBelly = new THREE.Color(def.belly ?? 0xcfe6ff);
  //         col: 0        1       2      3        4       5        6      7
  const tierByCol = [cDorsal, cFacet, cBase, cShadow, cBelly, cShadow, cBase, cFacet];
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const col = i % 8, st = Math.floor(i / 8);
    c.copy(tierByCol[col]);
    // a hair of per-facet luminance jitter so adjacent strakes don't posterise to flat tape
    const dl = jit(i * 7 + st * 3, 0.012);
    c.offsetHSL(0, 0, dl);
    cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
}

// THE SLIPSTREAM signature — a recessed ion filament down the keel line (nape→tail) + a single
// terminus stud at the tail fork. Core→bloom→dark (AAA §1): a thin tapered filament (core) idling at
// baseIntensity 0.04 (imperceptible — cruise emissive is eyes+stud only by contribution, DD §6.6) in
// the dark navy field, with a soft cyan bloom sprite on the terminus. The filament + stud mats join
// spineMats → the multiplicative Surge tick (model.surgeGlowMultiplier) ignites them; feverWing black
// keeps the wings a silhouette (§4.4). The idle terminus stud is the grind-tease: the one point of
// light that says the courier is holding something back.
function buildSlipstream(def, model, attach) {
  const meshes = [], mats = [];
  if (!model.slipstream) return { meshes, mats };
  const cyan = def.apexSeam ?? 0x8ed5ff;
  const filMat = new THREE.MeshStandardMaterial({
    color: 0x203a54, emissive: cyan, emissiveIntensity: 0.04, roughness: 0.4, metalness: 0.0,
    flatShading: true, side: THREE.DoubleSide,
  });
  filMat.userData.baseEmissiveI = 0.04;   // the withheld base the Surge tick multiplies from
  mats.push(filMat);
  // the recessed filament: a thin tapered ridge riding the keel top from nape to the tail root.
  const z0 = -2.4, z1 = attach.tailAnchor.z, N = seg(9);
  const verts = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, z = z0 + (z1 - z0) * t;
    const y = attach.keelTopAt(z) + 0.015;             // sits just proud of the keel, in the scute channel
    const w = 0.018 * (1 - 0.6 * t);                   // tapers nose→tail (≤~1–2px at chase cam)
    verts.push(-w, y, z, w, y, z);
  }
  for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx); g.computeVertexNormals();
  meshes.push(new THREE.Mesh(g, filMat));
  // the terminus stud — a small cyan node + a soft bloom sprite at the tail root fork
  const studMat = new THREE.MeshStandardMaterial({ color: 0x2a4a68, emissive: cyan, emissiveIntensity: 0.30, roughness: 0.3, flatShading: true });
  studMat.userData.baseEmissiveI = 0.30;
  mats.push(studMat);
  const stud = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), studMat);
  stud.position.set(0, attach.keelTopAt(z1) + 0.02, z1 + 0.05);
  meshes.push(stud);
  const bloom = softGlow(cyan, 0.34, 0.42);
  bloom.position.copy(stud.position);
  meshes.push(bloom);
  return { meshes, mats };
}

registerTorso('falconKeelTorso', (def, model, bodyMat) => {
  const r = buildTorso(AZURE_FALCON_PROFILE, def, model, bodyMat);
  // paint the 4-tier strake ladder onto the loft mesh (the big body mesh, ≥40 verts)
  const torso = r.group.children.find((c) => c.isMesh && c.geometry && c.geometry.attributes.position && c.geometry.attributes.position.count >= 40);
  if (torso && model.hullLadder) {
    paintFalconHull(torso.geometry, def);
    torso.material.vertexColors = true;
    torso.material.color.set(0xffffff);
  }
  const { meshes, mats } = buildSlipstream(def, model, r.attach);
  for (const m of meshes) r.group.add(m);
  return { ...r, spineMats: [...(r.spineMats || []), ...mats] };
});

// ── THE FALCON COMB WING (the hero) ──────────────────────────────────────────
// Kills the plank (DD §2.3), the stick (§2.2), the picket fence (AAA tell 2) and the
// plank-rig metronome (DD §5) in one build: WEDGE-thick primaries (a lofted lens
// cross-section with a raised rachis ridge — real edge-on thickness) in a dominant+
// decay comb [1,.82,.66,.52,.40] with index-hash jitter, over a connected inner WEB
// + two covert ranks (zero sky between the inner roots), on a real wingParts-3
// cascade (shoulder→forearm→HAND) with the −anchor wrist fold. Value-banded by depth
// (covert dark → root mid → vane light → gold DIFFUSE tip, the law-9 carrier).

// dominant + steep decay length curve (dominance 2.5:1, AAA tell 2 / DD §2.4)
const LEN_MUL = [1.0, 0.82, 0.66, 0.52, 0.40];

// one WEDGE primary: a lofted lens (LE → raised rachis ridge → TE → belly) tapering to a point.
// Edge-on it shows ridgeH+bellyDrop of thickness; the ridge crest catches a lighter rim value.
function wedgeBlade(L, chord, rootHex, tipHex, ridgeH, bellyDrop, camber, barAmt, goldAmt, cGold, cBar, bar, detail = 1) {
  const nX = seg(Math.max(3, Math.round(6 * detail)));
  const verts = [], cols = [], idx = [];
  const cb = new THREE.Color(rootHex), ct = new THREE.Color(tipHex), cg = new THREE.Color(cGold), c = new THREE.Color();
  const cRim = new THREE.Color();                      // ridge rim-catch = the vane value lifted
  for (let i = 0; i <= nX; i++) {
    const t = i / nX, x = t * L;
    // a BROAD feather: hold near-full width to ~55% then taper to a point (not a needle that
    // tapers the whole length — DD §4b, primaries read as feathers, only the tips slot).
    const taper = t < 0.55 ? 1 - 0.14 * (t / 0.55) : 0.86 * (1 - Math.pow((t - 0.55) / 0.45, 1.5));
    const half = chord * 0.5 * Math.max(0, taper);
    // asymmetric vane — a straighter leading edge, a fuller trailing edge (a real flight feather)
    const zLead = -half * 0.8, zTrail = half * 1.2;
    const zRidge = zLead + (zTrail - zLead) * 0.30;
    const shape = Math.sin(Math.min(1, 0.12 + t) * Math.PI) * taper;  // fat mid, thin ends
    const yBase = camber * Math.sin(t * Math.PI) * 0.5;
    const yTop = yBase + ridgeH * shape;
    const yBot = yBase - bellyDrop * shape;
    // lens ring order (around the section): LE, TOP(ridge), TE, BOT
    const ring = [[x, yBase, zLead], [x, yTop, zRidge], [x, yBase, zTrail], [x, yBot, zRidge]];
    // per-vertex value: base tier root→tip; ridge crest lifts; barring on the outboard lighter half; gold tip
    const baseC = c.copy(cb).lerp(ct, t * t).clone();
    for (let r = 0; r < 4; r++) {
      const p = ring[r];
      c.copy(baseC);
      if (r === 1) { cRim.copy(baseC).offsetHSL(0, -0.02, 0.10); c.copy(cRim); }   // ridge rim-catch
      if (bar && barAmt > 0 && t > 0.42 && t < 0.86 && r !== 3) {
        let b = 0;
        for (const bc of [0.57, 0.77]) { const d = Math.abs(t - bc); b = Math.max(b, d < 0.05 ? 1 : Math.max(0, 1 - (d - 0.05) / 0.03)); }
        c.lerp(cBar, barAmt * b * 0.9);
      }
      if (t > 0.88) c.lerp(cg, goldAmt * Math.min(1, (t - 0.88) / 0.07));
      verts.push(p[0], p[1], p[2]); cols.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < nX; i++) {
    const a = i * 4, b = a + 4;
    for (let k = 0; k < 4; k++) { const k1 = (k + 1) % 4; idx.push(a + k, b + k, a + k1, a + k1, b + k, b + k1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function buildFalconCombWings(def, model, attach, giM) {
  const group = new THREE.Group();
  const ws = model.wingScale || 1;
  const N = Math.max(3, Math.round(model.bladeCount ?? 5));
  const reach = (model.bladeSpan ?? 6.5) * ws;
  const sweep = model.bladeSweep ?? 0.34;
  const stagger = Math.max(0.10, model.bladeStagger ?? 0.24);
  const camber = model.bladeCamber ?? 0.14;
  const theta = model.bladeDihedral ?? 0.26;
  const armLen = reach * 0.5;                           // SHORT falcon arm; the hand carries the wing
  const chordK = model.bladeChord ?? 0.16;
  const ridgeH = (model.bladeRidge ?? 0.06) * ws;       // rachis ridge height (edge-on thickness)
  const bellyDrop = ridgeH * 0.55;
  const wristFrac = model.wingWristT ?? 0.45;           // MEDIAL wrist
  const detail = model.bladeDetail ?? 1;
  const barAmt = model.bladeBarring ?? 0;
  const bd = model.bladeDetail ?? 1;
  const dominance = model.bladeDominance ?? 1;          // 0 (welded whelp mitten) → 1 (fanned apex slits)

  // value tiers (covert dark → blade root mid → outer vane light → gold tip)
  const cCovert = def.wingCovert ?? 0x2a4562;
  const cRoot = def.wingInner ?? 0x496d99;
  const cVane = def.wingOuter ?? 0xb0cbe6;
  const cGold = model.wingTipGold ?? def.accentHue ?? 0xd9b36a;
  const goldAmt = model.wingTipGoldAmount ?? 1;
  const cBar = new THREE.Color(model.bladeBarColor ?? 0x101f30);

  // the blade VANE material (opaque falcon primaries, faceted; the rig's animated wingMat) — kept OUT
  // of spineMats so the wing stays a diffuse silhouette on Surge (feverWing black, §4.4)
  const vaneMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.56, metalness: 0.0, flatShading: true,
    side: THREE.DoubleSide, emissive: def.wingEmissive ?? cCovert, emissiveIntensity: 0.04,
  });
  applyFresnelRim(vaneMat, def.apexSeam ?? def.eye ?? cVane);
  // the arm/spar + web + covert material (matte bone — reads as structure, never chrome)
  const boneMat = new THREE.MeshStandardMaterial({ color: model.bladeSparColor ?? 0x5a708a, roughness: 0.6, metalness: 0.0, emissive: 0x223247, emissiveIntensity: 0.28, flatShading: true, side: THREE.DoubleSide });
  const webMat = new THREE.MeshStandardMaterial({ color: cCovert, roughness: 0.62, metalness: 0.0, flatShading: true, side: THREE.DoubleSide, vertexColors: true });
  applyFresnelRim(webMat, def.apexSeam ?? def.eye ?? cVane);
  const covertMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.6, metalness: 0.0, flatShading: true, side: THREE.DoubleSide });

  // the MEDIAL wrist (carpal) — short arm, long hand: the falcon proportion + the natural fold joint.
  const wristX = armLen * wristFrac;
  const wristY = wristX * Math.tan(theta);
  const wristZ = wristX * Math.tan(sweep);
  const K = [wristX, wristY, wristZ];

  // THE PRIMARIES cluster at the carpal and march a short way out the hand; finger 0 is the DOMINANT
  // leading primary and IS the wingtip — it pins the envelope at `reach` (DD §4.2/§4.4), the rest fan
  // aft in a steep decay [1,.82,.66,.52,.40] (dominance 2.5:1 — kills the picket fence). ALL primaries
  // ride the HAND, so they fold as one rigid unit at the wrist.
  const handSpread = (reach - wristX) * 0.34;             // how far the primary roots march out the hand
  const roots = [];
  for (let i = 0; i < N; i++) {
    const t = N > 1 ? i / (N - 1) : 0;
    const rootX = wristX + handSpread * t;
    const rootY = rootX * Math.tan(theta);
    const rootZ = rootX * Math.tan(sweep) + stagger * i;
    const lm = N === 5 ? LEN_MUL[i] : (0.4 + 0.6 * (1 - t));
    const len = (reach - rootX) * lm * (1 + jit(i * 13, 0.05));   // finger 0 spans wrist→envelope; ±5% jitter
    const wRoot = chordK * reach * (0.6 + 0.32 * Math.sin(t * Math.PI));
    // fanned rake (outer blades swing aft more → sky-slits open ONLY toward the tips; the broad
    // feathers overlap ~55% inboard); dominance dials it 0 (whelp: welded mitten) → 1 (apex: full fan)
    const rakeI = (0.03 + 0.055 * i) * dominance + jit(i * 29 + 3, 0.02);
    roots.push({ i, t, rootX, rootY, rootZ, len, wRoot, rakeI });
  }
  const covertRanks = Math.round(model.covertRanks ?? 0);   // 0 whelp → 2 apex (laddered richness, DD §7.1)
  const maxLen = reach - wristX;                             // the dominant primary's length (covert/secondary sizing ref)

  // build ONE canonical (+X) wing → { arm, hand, marker, bladePivots, elements }. arm rides `mid`,
  // hand rides `tip` at the −anchor wrist. All geometry authored in PIVOT space (the mirror is an
  // outer scale.x=-1 wrapper; the −anchor cancels the tip offset → rest pose byte-identical).
  function buildOneWing() {
    const arm = new THREE.Group(), hand = new THREE.Group();
    const bladePivots = [], elements = [];

    // the lofted leading ARM — a thick tapered spar shoulder→carpal (rides `mid`); the hand spar
    // wrist→outer-root rides `hand` and folds with the primaries.
    const baseR = 0.26 * ws;
    arm.add(bone(0.06, 0, -0.03, wristX * 0.5, wristY * 0.5, wristZ * 0.5, baseR, baseR * 0.72, boneMat));
    arm.add(bone(wristX * 0.5, wristY * 0.5, wristZ * 0.5, wristX, wristY, wristZ, baseR * 0.72, baseR * 0.5, boneMat));
    const outer = roots[roots.length - 1];
    hand.add(bone(wristX, wristY, wristZ, outer.rootX, outer.rootY, outer.rootZ, baseR * 0.5, 0.05 * ws, boneMat));

    // THE INNER WEB (propatagium) — a filled membrane fan from the shoulder along the arm leading edge
    // to the carpal, so the inner wing reads as ONE connected surface (kills the severed-plank read,
    // DD §2.6). Value-banded taut-root-lit → deep-cup-dark by depth (AAA tell 12).
    const webVerts = [], webCols = [], webIdx = [];
    const S = [0.02, 0.0, -0.05];                         // body anchor (shoulder)
    const rim = [S, [wristX * 0.5, wristY * 0.5, wristZ * 0.5 - 0.06], [wristX, wristY, wristZ + roots[0].wRoot * 0.35]];
    const cTaut = new THREE.Color(cRoot), cCup = new THREE.Color(cCovert), wc = new THREE.Color();
    for (let k = 0; k < rim.length; k++) {
      webVerts.push(rim[k][0], rim[k][1] - 0.02, rim[k][2]);
      wc.copy(cTaut).lerp(cCup, Math.min(1, k / rim.length + 0.15));
      webCols.push(wc.r, wc.g, wc.b);
    }
    const apex = webVerts.length / 3; webVerts.push(S[0], S[1] - 0.03, S[2] + 0.4); webCols.push(cCup.r, cCup.g, cCup.b);
    for (let k = 0; k < rim.length - 1; k++) webIdx.push(apex, k, k + 1);
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(webVerts, 3));
    wg.setAttribute('color', new THREE.Float32BufferAttribute(webCols, 3));
    wg.setIndex(webIdx); wg.computeVertexNormals();
    arm.add(new THREE.Mesh(wg, webMat));

    // SECONDARIES — short feathers rooted along the arm trailing edge (the inner-wing feathering),
    // laddered by covertRanks so the whelp stays a bare downy paddle and the apex a full-feathered arm.
    const secN = covertRanks * 3;
    for (let k = 0; k < secN; k++) {
      const t = secN > 1 ? k / (secN - 1) : 0;
      const cx = wristX * (0.3 + 0.6 * t);
      const cy = cx * Math.tan(theta) - 0.01;
      const cz = cx * Math.tan(sweep) + 0.06;
      const sg = wedgeBlade(maxLen * (0.34 - 0.1 * t), chordK * reach * 0.9, cCovert, cRoot, ridgeH * 0.5, bellyDrop * 0.5, camber * 0.5, 0, 0, cGold, cBar, false, 0.5);
      const s2 = new THREE.Mesh(sg, covertMat);
      s2.position.set(cx, cy, cz);
      s2.rotation.y = 0.6 + 0.2 * t;                       // sweep aft (trailing the arm)
      s2.rotation.z = theta * 0.5;
      arm.add(s2);
    }

    // COVERT RANKS shingled over the primary bases at the wrist (~55% overlap → only a shadow LINE
    // between, DD §4b), ON the hand so they fold with the primaries. ×0.82 size decay per rank.
    for (const [rank, count, chordMul, yLift] of [['g', 4, 1.4, 0.02], ['m', 5, 0.95, 0.06]].slice(0, covertRanks)) {
      for (let k = 0; k < count; k++) {
        const size = 0.42 * Math.pow(0.82, k);
        const cx = wristX + handSpread * (0.02 + k * 0.12);
        const cy = cx * Math.tan(theta) + yLift;
        const cz = cx * Math.tan(sweep) + 0.02;
        const covGeo = wedgeBlade(maxLen * size, chordK * reach * chordMul, cCovert, cRoot, ridgeH * 0.5, bellyDrop * 0.5, camber * 0.5, 0, 0, cGold, cBar, false, 0.5);
        const cov = new THREE.Mesh(covGeo, covertMat);
        cov.position.set(cx, cy, cz);
        cov.rotation.y = -(0.04 + k * 0.03) * dominance;
        cov.rotation.z = theta * 0.6;
        hand.add(cov);
      }
    }

    // THE PRIMARIES — wedge blades in the dominant+decay comb, ALL on the HAND (fold at the wrist as
    // one rigid unit, DD §5.3). rest = static fan pose; lag = the animated per-blade flutter child.
    for (const r of roots) {
      const rest = new THREE.Group();
      rest.position.set(r.rootX, r.rootY, r.rootZ);
      rest.rotation.y = -r.rakeI;
      rest.rotation.z = theta;
      const lag = new THREE.Group();
      rest.add(lag);
      const rootHex = r.t < 0.28 ? cRoot : lerpHex(cRoot, cVane, 0.4);
      const tipHex = r.t < 0.28 ? lerpHex(cRoot, cVane, 0.5) : cVane;
      const mesh = new THREE.Mesh(wedgeBlade(r.len, r.wRoot, rootHex, tipHex, ridgeH, bellyDrop, camber, barAmt, goldAmt, cGold, cBar, true, bd), vaneMat);
      lag.add(mesh);
      const tipObj = new THREE.Object3D(); tipObj.position.set(r.len, 0, 0); lag.add(tipObj);
      hand.add(rest);
      bladePivots.push({ pivot: lag, idx: r.i, side: 1, restY: rest.rotation.y, restZ: rest.rotation.z });
      elements.push({ root: new THREE.Vector3(r.rootX, r.rootY, r.rootZ), len: r.len, tipObj });
    }

    const marker = new THREE.Object3D();
    marker.position.set(reach, reach * Math.tan(theta), wristZ);
    hand.add(marker);
    return { arm, hand, marker, bladePivots, elements };
  }

  const pivots = {}, allBladePivots = { R: null, L: null };
  let wingElements = null;
  for (const side of [1, -1]) {
    const root = attach.wingRoot(1);                      // build CANONICAL right for both; left is a wrapper
    const pivot = new THREE.Group(); pivot.position.set(root.x, root.y, root.z); pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);
    const { arm, hand, marker, bladePivots, elements } = buildOneWing();
    mid.add(arm);
    tip.position.set(K[0], K[1], K[2]);
    hand.position.set(-K[0], -K[1], -K[2]);               // −anchor → assembled REST pose byte-identical
    tip.add(hand);
    if (side === -1) { const lm = new THREE.Group(); lm.scale.x = -1; lm.add(pivot); group.add(lm); }
    else group.add(pivot);
    const s = side === 1 ? 'R' : 'L';
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip; pivots['tipMarker' + s] = marker;
    allBladePivots[s] = bladePivots;
    if (side === 1) wingElements = elements.map((e) => ({ root: e.root, tip: new THREE.Vector3(e.root.x + e.len, e.root.y, e.root.z), length: e.len, tipObj: e.tipObj }));
  }

  return {
    group,
    parts: {
      ...pivots,
      wingPivot2L: null, wingPivot2R: null, wingRigL: null, wingRigR: null,
      wingBladePivotsR: allBladePivots.R, wingBladePivotsL: allBladePivots.L,
      wingElements,
    },
    wingMat: vaneMat,
    spineMats: [],                                          // wings stay a silhouette on Surge (no flare)
  };
}

registerWings('falconCombWings', buildFalconCombWings);

export { AZURE_FALCON_PROFILE };
