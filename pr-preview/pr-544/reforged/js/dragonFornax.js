import * as THREE from 'three';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { buildTorso, ARROW_PROFILE } from './dragonTorso.js';
import { bone } from './dragonParts.js';
import { seg } from './modelDetail.js';
import { applyFresnelRim } from './surface.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// FORNAX — "The banked furnace" (FIRE-WYVERN-BUILDSHEET.md — the sheet's numbers
// are the authority; the §12 gate judges against the sheet).
// A four-limbed western fire WYVERN: a charred anvil slung between two vast low
// crescents, twin swept horns, abducted bat-wide hind legs, a ridge-crested tail
// ending in a blunt ember firebrand. The furnace is INSIDE — glow only leaks at
// plate seams, the throat keel and the wing underside (identity law 1); wing TOPS
// never emissive (law 5); every fire pixel R ≥ G ≥ B (law 4); char albedo
// 0.02–0.045 linear, cool-neutral — the warmth is emitted, never painted (law 7).
//
// Four self-registering builders (fornax-exclusive, coexist default-off):
//   slagAnvilTorso · underlitCrescentWings · brandSkull · firebrandTail
// Reuses the dragonTempest/dragonAzure PATTERNS (mats ladder, DataTexture glow
// sprite, −anchor wrist fold, outer-wrapper mirror) with fresh forge geometry.
// Axis: head/forward −Z, tail/rear +Z, right +X, up +Y; torso baseline y≈0.2.
// ═══════════════════════════════════════════════════════════════════════════════

// deterministic index-hash jitter (never Math.random — reproducible builds)
function jit(i, amp) { const h = Math.sin((i + 1) * 12.9898 + 4.1) * 43758.5453; return (h - Math.floor(h) - 0.5) * 2 * amp; }
function lerpHex(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
}

// shared radial-alpha DataTexture glow sprite (DOM-free — Node geometry tests build this file)
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

// ── THE CHAR VALUE LADDER (law 7 + §4 values) ────────────────────────────────
// Four diffuse tiers, endpoints spread ≥0.05 luminance, cool-neutral char (the
// blackbody warmth is EMITTED at the seams, never painted into the diffuse):
//   charShadow (recess) → charBase (plate faces) → scorchMid (worked ash) →
//   ashLit (struck facet highlight). Ember accent lives ONLY at the throat-keel
//   seam + wing underside (§2: two contiguous places, ≤10% area).
const FORNAX_TIERS = {
  charShadow: 0x242327,
  charBase: 0x322f33,
  scorchMid: 0x4c4540,
  ashLit: 0x6d6156,   // struck-facet highlight — wide endpoint spread, reads on bright ground
};

// blackbody lane (law 4: R ≥ G ≥ B strictly; emitter authored 2000K)
const STOKE_EMBER = 0xff8912;   // seam emitter
const STOKE_PEAK = 0xffb46b;    // throat keel only
const STOKE_DEEP = 0xff3800;    // lowest bank

// per-facet-column hull paint: longitudinal strakes in the 4-tier ladder so the
// rear-chase hull carves instead of reading one flat char tube. Columns follow
// bladeRing order: 0 keel-top, 4 belly-bottom, 2/6 flanks.
function paintCharHull(geo, def) {
  const pos = geo.attributes.position, n = pos.count, cols = [];
  const cShadow = new THREE.Color(def.bodyShadow ?? FORNAX_TIERS.charShadow);
  const cBase = new THREE.Color(def.body ?? FORNAX_TIERS.charBase);
  const cScorch = new THREE.Color(lerpHex(def.bodyFacet ?? FORNAX_TIERS.scorchMid, 0x6b4a32, 0.30));   // hide-r4: raised char cools WARM (ember-brown bias), never gray plastic
  const cAsh = new THREE.Color(lerpHex(def.bodyDorsal ?? FORNAX_TIERS.ashLit, 0x7d5a3c, 0.22));
  const cBelly = new THREE.Color(lerpHex(def.belly ?? FORNAX_TIERS.scorchMid, FORNAX_TIERS.ashLit, 0.45));   // hide-r3: lit ventral band throat->tail (kept cool-neutral)
  //         col: 0      1        2      3        4       5        6      7
  const tierByCol = [cAsh, cScorch, cBase, cShadow, cBelly, cShadow, cBase, cScorch];
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const col = i % 8, st = Math.floor(i / 8);
    c.copy(tierByCol[col]);
    // struck-facet jitter so adjacent strakes never posterise to flat tape
    c.offsetHSL(0, 0, jit(i * 7 + st * 3, 0.014));
    cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
}

// ── THE SLAG-ANVIL PROFILE (§4) ──────────────────────────────────────────────
// The dominant mass: an anvil slung low — broad flat-topped thorax, SHALLOW keel
// (flight muscle wraps the ribcage; no protruding blade), a clear waist pinch and
// a haunch swell at the hip. Humerus root outmasses femur root 1.4× (shoulder
// fairing vs haunch). CoM 0.20 torso lengths forward of hip.
const FORNAX_PROFILE = (() => {
  const p = { ...ARROW_PROFILE };
  p.stations = ARROW_PROFILE.stations.map((s) => s.slice());
  p.keel = ARROW_PROFILE.keel.map((s) => s.slice());
  // shoulder peak: WIDER and FLATTER than the arrow (anvil, not blade) — halfWidth
  // up, keelTop down (shallow keel), belly held (the mass wraps, §4)
  p.stations[3][1] = 0.74; p.stations[3][2] = 0.46; p.stations[3][3] = 0.66;
  p.keel[1][1] = 0.46;
  // thorax carries the anvil aft — broad, low
  p.stations[4][1] = 0.62; p.stations[4][2] = 0.38; p.stations[4][3] = 0.58;
  p.keel[2][1] = 0.38;
  // waist pinch stays (70/30 split pivot), hips carry the haunch swell;
  // aft-body LENGTHENED so the torso reads as a ribcage, not a stub
  p.stations[5][0] = 0.85; p.stations[6][0] = 1.55; p.stations[7][0] = 2.15;
  p.keel[3][0] = 0.85; p.keel[4][0] = 1.55; p.keel[5][0] = 2.15;
  p.tailAnchorZ = 1.55; p.tailShiftRefZ = 2.15;
  p.stations[6][1] = 0.46; p.stations[6][2] = 0.30; p.stations[6][3] = 0.30;
  p.stations[7][1] = 0.30; p.stations[7][2] = 0.20; p.stations[7][3] = 0.18;
  p.keel[4][1] = 0.30;
  // BARREL not plate: pull width toward depth (ribcage ellipse, ventral keel line)
  p.stations[3][1] = 0.72; p.stations[4][1] = 0.64;
  // a longer, higher-reaching neck (2-segment S — the head leads the animal)
  // shoulder-thick base, ~0.85 decay per ball, ending at 60-70% of skull width
  // tucked under the occiput (head-gauntlet r1 gap 2: the head must be the
  // terminal spike of a tapering neck, never a wedge on a fatter bead chain)
  // NB: neckBlend multiplies these radii — author them SLIM (the 1.55 blend at
  // rBase 0.55 rendered a balloon that dwarfed the skull)
  // scale Y 0.66→0.54: h-r2 measured the neck 2.5x the SKULL's depth in profile —
  // slim vertically, keep width near the 60%-of-skull join (the two asks differ by axis)
  p.neck = { ...ARROW_PROFILE.neck, rBase: 0.42, rStep: 0.036, rMin: 0.14, scale: [0.8, 0.54, 1.3], yStep: 0.12, zStep: -0.22, wobbleAmp: 0.04 };
  p.headBase = (n) => ({ x: 0, y: 0.80 + (n - 4) * 0.09, z: -3.02 - (n - 4) * 0.30 });   // h-r3: skull topline continues the neck's dorsal line (head was hanging below it)
  return p;
})();

// ── THE STOKE seam network — torso portion (§3, first pass) ──────────────────
// Gen-1 seams: the throat-keel seam (the ONE peak-hue accent) + dorsal spine seam
// nape→tail-root that later ignites tail-ward on Surge. Recessed tapered
// filaments (cross-section 1:0.6:0.03 ambition; first pass = thin strips riding
// the keel/spine lines), idling near-dark; userData.baseEmissive/baseIntensity
// registered so the Surge tick ignites them multiplicatively.
function buildStokeSeams(def, model, attach) {
  const meshes = [], mats = [];
  const gens = Math.max(0, Math.round(model.seamGens ?? 0));
  if (!gens) return { meshes, mats };
  const mkSeamMat = (hex, base) => {
    const m = new THREE.MeshStandardMaterial({
      color: 0x1c1a1c, emissive: hex, emissiveIntensity: base, roughness: 0.5,
      flatShading: true, side: THREE.DoubleSide,
    });
    m.userData.baseEmissive = hex; m.userData.baseIntensity = base;
    m.userData.flareIntensityWeight = 0.30;   // sgm 20 stays amber, never cream (law 4)
    mats.push(m); return m;
  };
  // strip helper: a thin two-column ribbon through 3D points
  const strip = (pts, w, mat) => {
    const verts = [], idx = [];
    for (let i = 0; i < pts.length; i++) {
      const [x, y, z] = pts[i], wi = w * (1 - 0.5 * (i / (pts.length - 1)));
      verts.push(x - wi, y, z, x + wi, y, z);
    }
    for (let i = 0; i < pts.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return new THREE.Mesh(g, mat);
  };
  // THE THROAT-KEEL SEAM (peak hue #ffb46b lives here ONLY — identity accent 1 of 2)
  const throatMat = mkSeamMat(STOKE_PEAK, 0.10);   // hide-r8: 0.035 was invisible — a hint must still read
  const throatPts = [];
  for (let i = 0; i <= seg(6); i++) {
    const t = i / seg(6), z = -1.9 + t * 1.4;
    throatPts.push([0, -0.62 - 0.05 * Math.sin(t * Math.PI), z]);   // low on the keel line, clear of the neck loft
  }
  meshes.push(strip(throatPts, 0.028, throatMat));
  // dorsal spine seam (gen-1, emitter hue) nape→tail-root — THE STOKE's rail
  const spineMat = mkSeamMat(STOKE_EMBER, 0.09);
  const spinePts = [];
  const z0 = -2.35, z1 = attach.tailAnchor.z + 0.1, N = seg(10);
  for (let i = 0; i <= N; i++) {
    const t = i / N, z = z0 + (z1 - z0) * t;
    spinePts.push([0, attach.keelTopAt(z) + 0.012, z]);
  }
  meshes.push(strip(spinePts, 0.024, spineMat));
  // gen-2 flank seams (plate partings, dimmer, deep hue) — one long curving seam
  // per flank bounding the big anvil plates (T-junction into the spine rail)
  if (gens >= 2) {
    const flankMat = mkSeamMat(STOKE_DEEP, 0.03);
    for (const side of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= seg(7); i++) {
        const t = i / seg(7), z = -1.6 + t * 2.6;
        const x = side * (0.52 - 0.22 * t) * (1 + jit(i * 5 + (side > 0 ? 9 : 0), 0.04));
        pts.push([x, 0.2 + 0.16 - 0.3 * t * t, z]);
      }
      meshes.push(strip(pts, 0.016, flankMat));
    }
  }
  return { meshes, mats };
}

// ── THE EMBER HAUNCH — abducted hind legs (§7) ───────────────────────────────
// Bat-style ABDUCTED into the wing–tail wedge the chase cam reads: hip abduct
// 45°, knee 82°, ankle 115°. Plated reptilian three-toed feet (law 3 — never
// bird-scaled). Femur root a lofted swell (< humerus root, 1.4× rule lives in
// the shoulder fairing). Legs stay DARK (accent budget lives elsewhere).
function buildEmberHaunch(def, model, legMat) {
  const group = new THREE.Group();
  if (!(model.legHint ?? 1)) return { group, parts: {} };
  const hipAb = THREE.MathUtils.degToRad(model.hipAbduct ?? 45);
  const kneeA = THREE.MathUtils.degToRad(model.kneeAngle ?? 82);
  const ankleA = THREE.MathUtils.degToRad(model.ankleAngle ?? 115);
  const L = { femur: 0.66, shin: 0.58, foot: 0.34 };
  const legs = {};
  for (const side of [1, -1]) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.22, 0.12, 1.08);
    // femur: abducted out + slightly down; haunch swell at the root
    const femurDir = new THREE.Vector3(side * Math.sin(hipAb) * 0.75, -0.36, 0.20).normalize().multiplyScalar(L.femur);   // tucked but reading past the sail edge in planform
    hip.add(bone(0, 0, 0, femurDir.x, femurDir.y, femurDir.z, 0.34, 0.16, legMat));
    // haunch swell — a lofted root mass breaking the outline (never blobby)
    const swell = new THREE.Mesh(new THREE.SphereGeometry(0.30, seg(7), seg(5)), legMat);
    swell.scale.set(2.0, 1.05, 2.0);
    swell.position.set(femurDir.x * 0.22, femurDir.y * 0.22 + 0.02, femurDir.z * 0.22);
    hip.add(swell);
    // knee raised + inboard so the fold reads FOLDED, not landing-gear
    const knee = new THREE.Group(); knee.position.copy(femurDir); hip.add(knee);
    const shinDir = new THREE.Vector3(side * Math.sin(hipAb) * 0.32, -0.34, 0.92).normalize().multiplyScalar(L.shin);   // shank aft-down, knee raised inboard
    knee.add(bone(0, 0, 0, shinDir.x, shinDir.y, shinDir.z, 0.135, 0.065, legMat));
    const ankle = new THREE.Group(); ankle.position.copy(shinDir); knee.add(ankle);
    // three-toed plated foot, toes spread; ankle at 115°
    const footDir = new THREE.Vector3(side * 0.12, -0.30, 0.55).normalize().multiplyScalar(L.foot * 1.3);   // toes trail aft-down (flight tuck)
    for (let toe = -1; toe <= 1; toe++) {
      const td = footDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), toe * 0.3);
      ankle.add(bone(0, 0, 0, td.x, td.y, td.z, 0.075, 0.028, legMat));
    }
    group.add(hip);
    legs[side === 1 ? 'legR' : 'legL'] = hip;
  }
  return { group, parts: legs };
}

registerTorso('slagAnvilTorso', (def, model, bodyMat) => {
  const r = buildTorso(FORNAX_PROFILE, def, model, bodyMat);
  // SCAPULAR SADDLE (body frame — sheet §5: static, in the torso's seam language):
  // a faceted shoulder block at each wing root so the sail grows out of MUSCLE in
  // every pose, plus a flank weld strip running shoulder→hip that owns the
  // membrane's body edge (kills the daylight under the raised wing).
  {
    const saddleMat = new THREE.MeshStandardMaterial({ color: def.bodyFacet ?? FORNAX_TIERS.scorchMid, roughness: 0.82, metalness: 0.0, flatShading: true });   // hide-r6: no chrome streaks on plates
    const wr = r.attach.wingRoot(1);
    for (const side of [1, -1]) {
      const block = new THREE.Mesh(new THREE.SphereGeometry(0.40, seg(8), seg(6)), saddleMat);
      block.scale.set(1.9, 0.85, 1.7);   // ONE smooth deltoid mass the spar grows out of
      block.position.set(side * wr.x * 1.28, wr.y - 0.05, wr.z + 0.04);
      r.group.add(block);
      // hide-r3: dorsal spine shingles aft of the wing roots (one row, value-stepped lips)
      if (side === 1) for (let k = 0; k < 4; k++) {
        const spMat = new THREE.MeshStandardMaterial({
          color: lerpHex(FORNAX_TIERS.charBase, FORNAX_TIERS.ashLit, 0.22 + 0.16 * k),
          roughness: 0.8, metalness: 0.0, flatShading: true });
        const sp = new THREE.Mesh(new THREE.SphereGeometry(0.24, seg(6), seg(4), 0, Math.PI * 2, 0, Math.PI / 2), spMat);
        sp.scale.set(1.15 - 0.10 * k, 0.42, 0.85);
        sp.position.set(0, wr.y + 0.10 - 0.05 * k, wr.z + 0.55 + 0.42 * k);
        sp.rotation.x = 0.10 + 0.05 * k;
        r.group.add(sp);
      }
      // hide-r1 fix 3: the chest's proven shingle treatment extends onto the
      // shoulder — 3 overlapping plates, each forward edge a value step up
      for (let k = 0; k < 3; k++) {
        const plateMat = new THREE.MeshStandardMaterial({
          color: lerpHex(FORNAX_TIERS.scorchMid, FORNAX_TIERS.ashLit, 0.18 + 0.24 * k),
          roughness: 0.8, metalness: 0.0, flatShading: true });
        const plate = new THREE.Mesh(new THREE.SphereGeometry(0.30, seg(6), seg(4), 0, Math.PI * 2, 0, Math.PI / 2), plateMat);
        plate.scale.set(1.35 - 0.22 * k, 0.5, 0.95 - 0.12 * k);
        plate.position.set(side * wr.x * (1.10 + 0.14 * k), wr.y + 0.06 - 0.02 * k, wr.z - 0.10 + 0.16 * k);
        plate.rotation.z = side * -0.28;
        plate.rotation.x = 0.12 * k;
        r.group.add(plate);
      }
      // flank weld strip: shoulder→hip along the torso side, just under the sail's body edge
      const fv = [], fi = [];
      const NW = seg(6);
      for (let i = 0; i <= NW; i++) {
        const t = i / NW, z = wr.z + 0.1 + (1.35 - (wr.z + 0.1)) * t;
        const x = side * (wr.x * (1.25 - 0.45 * t));
        const yTop = wr.y - 0.02 - 0.16 * t, yBot = yTop - 0.20 - 0.06 * Math.sin(t * Math.PI);
        fv.push(x, yTop, z, x * 0.94, yBot, z);
      }
      for (let i = 0; i < NW; i++) { const a = i * 2; fi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const fg = new THREE.BufferGeometry();
      fg.setAttribute('position', new THREE.Float32BufferAttribute(fv, 3));
      fg.setIndex(fi); fg.computeVertexNormals();
      const fm = new THREE.Mesh(fg, saddleMat);
      fm.material = saddleMat;
      r.group.add(fm);
      // hide-r6: neck shingle rows — overlapping char plates riding the chain's
      // dorsal line (the bare sphere chain read as leather lobes for six rounds)
      if (side === 1) {
        const nk = FORNAX_PROFILE.neck;
        for (let i = 0; i < 6; i++) {
          const t = i / 5;
          const nz = nk.z0 + t * 4 * nk.zStep;
          const ny = nk.y0 + t * 4 * nk.yStep + 0.16;
          const nr = (nk.rBase - t * 4 * nk.rStep) * 1.35;
          for (const row of [-1, 1]) {
            const shMat = new THREE.MeshStandardMaterial({
              color: lerpHex(FORNAX_TIERS.charBase, FORNAX_TIERS.ashLit, (0.26 - 0.20 * t) + 0.04 * ((i + (row > 0 ? 0 : 1)) % 3)),   // h-r11: black carries down from the skull — no hue seam
              roughness: 0.8, metalness: 0.0, flatShading: true });
            const sh = new THREE.Mesh(new THREE.SphereGeometry(nr * 0.52, seg(5), seg(3), 0, Math.PI * 2, 0, Math.PI / 2), shMat);
            sh.scale.set(1.0, 0.38, 0.9);
            sh.position.set(row * nr * 0.34, ny - Math.abs(row) * 0.02, nz + (row > 0 ? 0.05 : -0.04));
            sh.rotation.z = row * -0.35;
            sh.rotation.x = -0.55;      // lie along the rising neck line
            r.group.add(sh);
          }
        }
      }
      // membrane ROOT WALL: pivot→flank wedge, static in the body frame — the
      // raised sail's inner edge lands on this, killing the mast/pylon read
      const wallMat = new THREE.MeshStandardMaterial({ color: def.bodyShadow ?? FORNAX_TIERS.charShadow, roughness: 0.68, metalness: 0.0, flatShading: true, side: THREE.DoubleSide });
      const wv = [], wi = [];
      const NWL = seg(5);
      for (let i = 0; i <= NWL; i++) {
        const t = i / NWL;
        const z = wr.z - 0.05 + (1.30 - (wr.z - 0.05)) * t;
        const xF = side * (wr.x * (1.3 - 0.5 * t));
        const yF = wr.y - 0.14 - 0.16 * t;
        const xT = side * (wr.x * (1.45 - 0.55 * t));
        const yT = wr.y + 0.10 - 0.30 * t;   // skirt top tracks the pivot line, tapering aft
        wv.push(xF, yF, z, xT, Math.max(yF + 0.04, yT), z);
      }
      for (let i = 0; i < NWL; i++) { const a = i * 2; wi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const wg2 = new THREE.BufferGeometry();
      wg2.setAttribute('position', new THREE.Float32BufferAttribute(wv, 3));
      wg2.setIndex(wi); wg2.computeVertexNormals();
      r.group.add(new THREE.Mesh(wg2, wallMat));
    }
  }
  // paint the 4-tier char strake ladder onto the big loft mesh
  const torso = r.group.children.find((c) => c.isMesh && c.geometry && c.geometry.attributes.position && c.geometry.attributes.position.count >= 40);
  if (torso && (model.hullLadder ?? 1)) {
    paintCharHull(torso.geometry, def);
    torso.material = torso.material.clone();   // never mutate the shared bodyMat (fairings/neck ride it)
    torso.material.vertexColors = true;
    torso.material.color.set(0xffffff);
  }
  const { meshes, mats } = buildStokeSeams(def, model, r.attach);
  for (const m of meshes) r.group.add(m);
  // abducted legs live in the torso build (body frame, oscillation is a rig call)
  const legMat = new THREE.MeshStandardMaterial({ color: def.bodyShadow ?? FORNAX_TIERS.charShadow, roughness: 0.7, metalness: 0.0, flatShading: true });
  const haunch = buildEmberHaunch(def, model, legMat);
  r.group.add(haunch.group);
  return { ...r, spineMats: [...(r.spineMats || []), ...mats] };
});

// ── THE UNDERLIT CRESCENT — wings (§5, the hero) ─────────────────────────────
// A LOW WIDE four-digit bat crescent, wing-as-arm (law 2): archRise 0.12 (vs
// Vesper 0.4), wristT 0.30, TAUT bays (sag ≤0.10 bay chord vs Vesper's 0.35
// cups) — but the NOTCH FLOOR rules: each digit tip projects ≥0.15 bay chord
// beyond the membrane line so the trailing edge stays a scalloped 3-bay
// silhouette, never a plane-wing delta. D1 dominant 1.6×, D2–D4 ×0.66 decay.
// Tops carry the char ladder and are NEVER emissive (law 5); the underside glow
// is a SEPARATE dropped sub-mesh in a bespoke mat (the Vesper memGlow pattern),
// dark in cruise, ignited only by THE STOKE.
function buildUnderlitCrescentWings(def, model, attach, giM) {
  const group = new THREE.Group();
  const ws = (model.wingScale || 1) * (model.spanScale ?? 1);
  const nDigits = Math.max(2, Math.round(model.wingDigits ?? 4));
  const hs = (model.wingSpanReach ?? 6.2) * 0.5 * ws;   // half-span scale unit
  const archRise = model.archRise ?? 0.12;              // LOW crescent (identity number)
  const wristT = model.wristT ?? 0.30;                  // top of the house band
  const baySag = Math.min(model.baySag ?? 0.10, 0.10);  // TAUT (≤0.10 bay chord — use the full floor)
  const notch = Math.max(model.notchDepth ?? 0.17, 0.15); // NOTCH FLOOR ≥0.15 (bone projection)
  const hasProp = !!(model.propatagium ?? 0);

  // ─ char material ladder (tops NEVER emissive — law 5) ─
  const mkMat = (hex, rough = 0.62) => new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0.0, flatShading: true, side: THREE.DoubleSide, emissive: 0x000000 });
  const M = {
    bone: mkMat(0x7d7264, 0.60),   // hide-r2: desaturated bone-tan — the flat-black tape bone is a registered cheap tell
    boneDim: mkMat(0x554d42, 0.62),   // hide-r3: alternating spar segments (uniform value = paper strip)
    boneCap: mkMat(FORNAX_TIERS.ashLit, 0.5),
    memTiers: [
      mkMat(lerpHex(def.wingOuter ?? FORNAX_TIERS.charBase, FORNAX_TIERS.ashLit, 0.55)),
      mkMat(def.wingOuter ?? FORNAX_TIERS.charBase),
      mkMat(lerpHex(def.wingOuter ?? FORNAX_TIERS.charBase, FORNAX_TIERS.charShadow, 0.45)),
      mkMat(FORNAX_TIERS.charShadow),
    ],
    edge: mkMat(FORNAX_TIERS.scorchMid, 0.5),
  };
  // the shared-rig wingMat contract: register a top-membrane mat with BLACK
  // emissive so every unconditional boost/backlit drive multiplies black
  const wingMat = M.memTiers[1];
  wingMat.vertexColors = true;   // hide-r2: the sail's painted bands were silently IGNORED without this — two critics called the membrane "one flat fill"
  wingMat.color.setHex(0xffffff);   // vertex colors carry the absolute tier values
  applyFresnelRim(wingMat, def.apexSeam ?? STOKE_EMBER);
  // THE UNDERLIT material — bespoke, outside wingMat; ignited only by THE STOKE
  const underMat = new THREE.MeshStandardMaterial({
    color: 0x141214, emissive: STOKE_EMBER, emissiveIntensity: 0.03, roughness: 0.6,
    flatShading: true, side: THREE.FrontSide,   // lit face points DOWN (law 5: tops never emissive)
  });
  underMat.userData.baseEmissive = STOKE_EMBER; underMat.userData.baseIntensity = 0.03;
  underMat.userData.flareIntensityWeight = 0.5;   // amber stays amber through ACES — the leak reads as glow, not cream edges

  // ─ leading-edge profile (shared function — the anti-plank curve): a LOW gull
  // arch peaking at the carpal (archRise 0.12 — wide, not tall) + a shallow ogee
  // in Z that bows forward mid-arm then sweeps aft to the tip.
  const armY = (t) => {
    const arch = t <= wristT ? Math.sin((t / wristT) * Math.PI / 2) : 1 - (t - wristT) * 0.42;
    return hs * (0.05 * t + archRise * 0.62 * arch);
  };
  const armZ = (t) => -0.08 + 0.30 * hs * Math.pow(t, 1.2) - 0.10 * hs * Math.sin(Math.PI * t);
  const LE = (t) => [t * hs * 2, armY(t), armZ(t)];
  const K = LE(wristT);                    // carpal knuckle
  const F0 = LE(1);                        // D1 tip — the dominant digit IS the wingtip
  const quad = (a, c, b, s) => { const m = 1 - s; return [m * m * a[0] + 2 * m * s * c[0] + s * s * b[0], m * m * a[1] + 2 * m * s * c[1] + s * s * b[1], m * m * a[2] + 2 * m * s * c[2] + s * s * b[2]]; };
  const tri = (tris, mat) => flatTriMesh(tris, mat);

  // digit tips fan aft from K: D1 pins the envelope; D2–D4 at ×0.66 rank decay
  // off the D1=1.6× dominance (sheet §5), contracting spacing, drooping aft-down
  const phi0 = Math.atan2(F0[2] - K[2], F0[0] - K[0]), r0 = Math.hypot(F0[0] - K[0], F0[2] - K[2]);
  const lenFrac = [1, 0.82, 0.68, 0.55];   // ref §4 decay band — high end, so the three bays stay comparable
  const spanAft = 1.02;
  const tips = [F0];
  for (let i = 1; i < nDigits; i++) {
    const gap = (1 - Math.pow(0.72, i)) / (1 - Math.pow(0.72, nDigits - 1));   // contracting spacing
    const phi = phi0 + spanAft * gap;
    const r = r0 * lenFrac[Math.min(i, lenFrac.length - 1)];
    tips.push([K[0] + Math.cos(phi) * r, K[1] - (0.03 + 0.07 * (i / (nDigits - 1))) * r, K[2] + Math.sin(phi) * r]);
  }

  function buildOneWing() {
    const arm = new THREE.Group(), hand = new THREE.Group();

    // ═ ONE CONTINUOUS SAIL ═ The whole planform is a single triangulated sheet
    // with a single boundary: shoulder → (leading edge) → wrist → D1 tip →
    // (scalloped trailing edge through the digit tip-notches) → hip → (flank) →
    // shoulder. No stacked quads: propatagium, bays and body-fillet are REGIONS
    // of one surface, value-banded by vertex color. Digit ridges ride ON it.
    const S0 = [0.04, -0.02, -0.06];                     // shoulder root (pivot space)
    const HIP = [-0.26, -0.14 * hs, 2.30];               // inboard + AFT along the tail base — the planform's rear half is membrane, not rod
    const boundary = [];                                  // [x,y,z,tier] rim walk
    // leading edge S0→K→F0 (rigid, the arm line)
    const NLE = seg(6);
    for (let i = 0; i <= NLE; i++) {
      const t = i / NLE;
      const p = LE(t);
      boundary.push([p[0], p[1], p[2], t < wristT ? 0 : 0]);
    }
    // trailing edge: scallop arcs D1→D2→D3→D4 through pulled-back notch points
    const pullBack = (tip, frac) => [tip[0] + (K[0] - tip[0]) * frac, tip[1] + (K[1] - tip[1]) * frac, tip[2] + (K[2] - tip[2]) * frac];
    const NSEG = seg(4);
    const quadB = (a, c, b, s) => { const m = 1 - s; return [m * m * a[0] + 2 * m * s * c[0] + s * s * b[0], m * m * a[1] + 2 * m * s * c[1] + s * s * b[1], m * m * a[2] + 2 * m * s * c[2] + s * s * b[2]]; };
    for (let i = 0; i < tips.length - 1; i++) {
      const Fa = tips[i], Fb = tips[i + 1];
      const bayChord = Math.hypot(Fa[0] - Fb[0], Fa[1] - Fb[1], Fa[2] - Fb[2]);
      const La = Math.hypot(Fa[0] - K[0], Fa[1] - K[1], Fa[2] - K[2]);
      const Lb = Math.hypot(Fb[0] - K[0], Fb[1] - K[1], Fb[2] - K[2]);
      const Ea = i === 0 ? Fa : pullBack(Fa, Math.min(0.5, notch * bayChord / La));
      const Eb = pullBack(Fb, Math.min(0.5, notch * bayChord / Lb));
      const base = [Ea[0] + (Eb[0] - Ea[0]) * 0.40, Ea[1] + (Eb[1] - Ea[1]) * 0.40, Ea[2] + (Eb[2] - Ea[2]) * 0.40];
      const ctrl = [base[0] + (K[0] - base[0]) * baySag * 2, base[1] + (K[1] - base[1]) * baySag * 2 - 0.015, base[2] + (K[2] - base[2]) * baySag * 2];
      for (let s2 = i === 0 ? 0 : 1; s2 <= NSEG; s2++) {
        const t2 = s2 / NSEG;
        const p = quadB(Ea, ctrl, Eb, t2);
        p[1] -= 0.07 * bayChord * Math.sin(t2 * Math.PI);   // chordwise camber droop (§5 camber band)
        boundary.push([p[0], p[1], p[2], 1 + i, Math.sin(t2 * Math.PI)]);   // [4] = stretch (0 at fingers, 1 mid-bay)
      }
      // the digit TIP projects past the membrane between bays (the notch floor):
      if (i < tips.length - 2) boundary.push([Fb[0], Fb[1], Fb[2], 1 + i]);
    }
    // body bay: last digit notch → hip (one long taut edge with gentle sag)
    {
      const Fl = tips[tips.length - 1];
      const NB = seg(4);
      for (let s2 = 1; s2 <= NB; s2++) {
        const t = s2 / NB;
        boundary.push([Fl[0] + (HIP[0] - Fl[0]) * t, Fl[1] + (HIP[1] - Fl[1]) * t - 0.06 * hs * Math.sin(t * Math.PI), Fl[2] + (HIP[2] - Fl[2]) * t, 4, Math.sin(t * Math.PI)]);   // its OWN tier — was fused with the last finger bay
      }
    }
    // flank edge hip→shoulder (hugs the body)
    boundary.push([-0.18, S0[1] - 0.06, S0[2] + 0.62, 4]);   // flank edge tucked under the torso

    // triangulate: radial fan from K through an INTERIOR RING (hide-r1 fix 2:
    // each bay gets a root->edge value gradient, alternating bay bases, a
    // "backlit" mid stripe on every second bay, darkened trailing edge — a
    // single-fan membrane painted flat reads as one dead polygon)
    const verts = [], cols = [], idx = [];
    const tierCols = [
      new THREE.Color(lerpHex(def.wingOuter ?? FORNAX_TIERS.charBase, FORNAX_TIERS.ashLit, 0.30)),
      new THREE.Color(def.wingOuter ?? FORNAX_TIERS.charBase),
      new THREE.Color(lerpHex(def.wingOuter ?? FORNAX_TIERS.charBase, FORNAX_TIERS.charShadow, 0.45)),
      new THREE.Color(FORNAX_TIERS.charShadow),
      new THREE.Color(lerpHex(FORNAX_TIERS.charShadow, 0x1a1518, 0.5)),   // body bay + flank — its own darkest tier
    ];
    verts.push(K[0], K[1], K[2]);
    { const c = tierCols[1].clone(); c.offsetHSL(0.004, 0.10, 0.14); cols.push(c.r, c.g, c.b); }   // root bloom at the wrist
    const nB = boundary.length;
    const bandCol = (b, i, ringT) => {       // finger-referenced band, same across the chord
      const st = b[4] ?? 0;
      const c = tierCols[Math.min(4, b[3])].clone();
      c.offsetHSL(0.006 * st, 0.22 * st, 0.15 * st + (b[3] % 2 ? 0.03 : -0.015) + jit(i * 7 + ringT * 31, 0.02));
      if (ringT >= 1) c.offsetHSL(0, -0.02, -0.075 + 0.02 * st);   // trailing edge dark
      if (ringT < 0.4) c.lerp(new THREE.Color(0x5e1c0c), (1 - st) * 0.35);   // hide-r6: banked heat in the finger crotches at the membrane root
      return c;
    };
    for (const ringT of [0.27, 0.55, 1.0]) {
      for (let i = 0; i < nB; i++) {
        const b = boundary[i];
        verts.push(K[0] + (b[0] - K[0]) * ringT, K[1] + (b[1] - K[1]) * ringT, K[2] + (b[2] - K[2]) * ringT);
        const c = bandCol(b, i, ringT);
        cols.push(c.r, c.g, c.b);
      }
    }
    for (let i = 0; i < nB - 1; i++) {
      const a0 = 1 + i, a1 = 2 + i, b0 = 1 + nB + i, b1 = 2 + nB + i, c0 = 1 + 2 * nB + i, c1 = 2 + 2 * nB + i;
      idx.push(0, a0, a1);                   // hub fan to ring A
      idx.push(a0, b0, b1, a0, b1, a1);      // ring A -> ring B
      idx.push(b0, c0, c1, b0, c1, b1);      // ring B -> edge
    }
    const sailGeo = new THREE.BufferGeometry();
    sailGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    sailGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    sailGeo.setIndex(idx); sailGeo.computeVertexNormals();
    hand.add(new THREE.Mesh(sailGeo, wingMat));

    // THE UNDERLIT copy — the whole sail dropped ~0.05, lit face DOWN (law 5)
    {
      const ug = sailGeo.clone();
      const p = ug.attributes.position;
      for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) - 0.05);
      p.needsUpdate = true;
      const ia = ug.getIndex().array;
      for (let i = 0; i < ia.length; i += 3) { const t = ia[i + 1]; ia[i + 1] = ia[i + 2]; ia[i + 2] = t; }
      ug.getIndex().needsUpdate = true;
      ug.computeVertexNormals();
      const um = new THREE.Mesh(ug, underMat);
      hand.add(um);
    }

    // fat bowed digit ridges ON the sail (the skeletal rays — anatomy, not decoration)
    const ridgeLift = 0.03 * hs;
    const ridge = (tgt, a, b, wB, wT, mat, capMat, lift) => {
      const lf = lift ?? ridgeLift;
      const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz) || 1, px = -dz / len, pz = dx / len;
      const aL = [a[0] + px * wB, a[1], a[2] + pz * wB], aR = [a[0] - px * wB, a[1], a[2] - pz * wB];
      const bL = [b[0] + px * wT, b[1], b[2] + pz * wT], bR = [b[0] - px * wT, b[1], b[2] - pz * wT];
      const aT = [a[0], a[1] + lf, a[2]], bT = [b[0], b[1] + lf * 0.35, b[2]];
      tgt.add(tri([[aL, bL, bT], [aL, bT, aT], [aR, aT, bT], [aR, bT, bR]], mat));
      if (capMat) { const aT2 = [a[0] + px * wB * 0.28, a[1] + lf, a[2] + pz * wB * 0.28]; tgt.add(tri([[aT, bT, aT2]], capMat)); }
    };
    for (let i = 0; i < tips.length; i++) {
      const tp = tips[i], wB = 0.085 * hs * (1 - 0.10 * i), wM = wB * 0.55;
      const L = Math.hypot(tp[0] - K[0], tp[1] - K[1], tp[2] - K[2]);
      const sag = 0.09 * L * (0.6 + 0.5 * (i / Math.max(1, tips.length - 1)));
      const Bm = [(K[0] + tp[0]) / 2, (K[1] + tp[1]) / 2 - sag, (K[2] + tp[2]) / 2 + sag * 0.4];
      ridge(hand, K, Bm, wB, wM, M.bone, M.boneCap);   // hide-r1 fix 3: every bone two-toned (tape -> horn)
      ridge(hand, Bm, tp, wM, 0.006, M.boneDim, null);   // hide-r3: segment value break at the joint
    }
    // thumb-claw at the carpal knuckle
    hand.add(tri([[K, [K[0] + 0.02 * hs, K[1] + 0.02 * hs, K[2] - 0.02 * hs], [K[0] + 0.04 * hs, K[1] + 0.11 * hs, K[2] - 0.16 * hs]], [K, [K[0] + 0.04 * hs, K[1] + 0.11 * hs, K[2] - 0.16 * hs], [K[0] - 0.03 * hs, K[1] + 0.03 * hs, K[2] + 0.02 * hs]]], M.bone));

    // THE ARM — a thigh-thick humerus + forearm riding the leading edge (wing IS
    // the arm), with the scapular slag-cowl swallowing the root into the torso
    const armLift = 0.06 * hs;
    const E = LE(wristT * 0.45);
    ridge(arm, LE(0), E, 0.26 * hs, 0.15 * hs, M.bone, M.boneCap, armLift);   // hide-r5: top facet lifts off the membrane
    ridge(arm, E, K, 0.13 * hs, 0.07 * hs, M.boneDim, M.boneCap, armLift);
    // forward fillet: closes the daylight notch between neck-side and the arm LE
    arm.add(tri([[[-0.15, S0[1] + 0.02, S0[2] - 0.15], LE(0.30), S0]], mkMat(def.wingOuter ?? FORNAX_TIERS.charBase)));   // NOT wingMat — no color attr
    // arm-frame fillet: a slim triangle welded at K + shoulder + flank so the
    // sail meets the body in EVERY pose (zero displacement at the shared pivot)
    arm.add(tri([[S0, [S0[0] + 0.06, S0[1] - 0.03, S0[2] + 0.55], K]], M.memTiers[3]));

    const marker = new THREE.Object3D();
    marker.position.set(F0[0], F0[1], F0[2]);
    hand.add(marker);
    return { arm, hand, marker };
  }

  const pivots = {};
  for (const side of [1, -1]) {
    const root = attach.wingRoot(1);
    const pivot = new THREE.Group(); pivot.position.set(root.x * 1.5, root.y * 0.7, root.z); pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);
    const { arm, hand, marker } = buildOneWing();
    mid.add(arm);
    tip.position.set(K[0], K[1], K[2]);
    hand.position.set(-K[0], -K[1], -K[2]);       // −anchor: rest pose byte-identical
    tip.add(hand);
    if (side === -1) { const lm = new THREE.Group(); lm.scale.x = -1; lm.add(pivot); group.add(lm); }
    else group.add(pivot);
    const s = side === 1 ? 'R' : 'L';
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip; pivots['tipMarker' + s] = marker;
  }

  return {
    group,
    parts: {
      ...pivots,
      wingPivot2L: null, wingPivot2R: null, wingRigL: null, wingRigR: null,
    },
    wingMat,
    spineMats: [underMat],   // the underside leak ignites with THE STOKE on Surge
  };
}
registerWings('underlitCrescentWings', buildUnderlitCrescentWings);

// ── BRAND SKULL — head + horns (§6) ──────────────────────────────────────────
// Dorsal profile is the read: convex nasal keel → brow dip → rising occiput.
// Small ember eyes (the glare is the BONE — brow-prong wedges carry the menace).
// ONE dominant backswept occipital pair at 135°, then midline followers ×0.66.
// Chipped brow: starboard tip 0.85× with a char-fresh facet (turntable read).
function buildBrandSkull(def, model, mats) {
  const group = new THREE.Group();
  const hs = model.headScale ?? 1;
  // h-r3 was a VALUE round: the jaw/dome/cheek masses measured as met but read
  // black-on-black. Skull a half-step above charBase, jaw a full step lighter
  // (the mouth split must read), horns carry their value in VERTEX color (the
  // material is white — vertex colors multiply it).
  const skullMat = new THREE.MeshStandardMaterial({ color: lerpHex(def.body ?? FORNAX_TIERS.charBase, FORNAX_TIERS.scorchMid, 0.45), roughness: 0.62, metalness: 0.0, flatShading: true, vertexColors: false });
  const jawMat = new THREE.MeshStandardMaterial({ color: 0x5e5044, roughness: 0.58, metalness: 0.0, flatShading: true });   // h-r7: the mandible was value-buried against the cheek — 'cooling coal' lift
  const hornMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.08, flatShading: true, vertexColors: true });

  // skull wedge (w:h 1.1) with the dorsal S: nasal keel, brow dip, rising occiput
  const L = 0.95 * hs;                  // skull length
  const W = 0.40 * hs, H = W / 1.1;
  const sv = [], si = [];
  // stations along the skull −Z (muzzle) → +Z (occiput): [z, halfW, top, bot]
  // UPPER skull only forward of the brow dip — the muzzle bottoms are shallow
  // because a separate LOWER JAW loft owns the depth there (predator read: the
  // head must visibly split). The −0.58L hook station droops the beak tip past
  // the jaw line (overbite).
  // h-r2: skull depth at the eye ≈ 0.43 of length (was 33% — "one shallow
  // wedge"), cranial dome + jugal cheek flare behind the tooth row, brow STEP
  // breaking the top line; brow width trimmed so the muzzle projects in front view
  const stations = [
    [-L * 0.58, W * 0.10, H * 0.10, H * 0.16],   // overbite hook — drops past the jaw tip
    [-L * 0.52, W * 0.13, H * 0.26, H * 0.10],   // muzzle tip (upper wedge — jaw owns the depth)
    [-L * 0.30, W * 0.36, H * 0.62, H * 0.18],   // nasal keel — h-r11: taller, so the brow STEP reads
    [-L * 0.06, W * 0.62, H * 0.40, H * 0.34],   // brow/hinge — h-r11: ~15% step below the nasal roof
    [L * 0.16, W * 0.56, H * 0.72, H * 0.46],    // cranial dome — h-r10: no ball-cranium; tapers off the hinge width
    [L * 0.42, W * 0.24, H * 0.40, H * 0.32],    // occipital bevel — h-r5: the rear cranium TAPERS into the crest (no flat box)
  ];
  for (const [z, w, top, bot] of stations) {
    sv.push(0, top, z, -w * 0.72, top * 0.4, z, -w, -bot * 0.2, z, -w * 0.5, -bot * 0.8, z,
      0, -bot, z, w * 0.5, -bot * 0.8, z, w, -bot * 0.2, z, w * 0.72, top * 0.4, z);
  }
  const M = 8;
  for (let s = 0; s < stations.length - 1; s++) {
    const a0 = s * M, b0 = (s + 1) * M;
    for (let m = 0; m < M; m++) { const n = (m + 1) % M; si.push(a0 + m, b0 + m, a0 + n, a0 + n, b0 + m, b0 + n); }
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3));
  sg.setIndex(si); sg.computeVertexNormals();
  // hide-r1 fix 1: 3-tier value band on the skull by ring position — crest/ridge
  // light, side plates mid, sockets + under-jaw recess dark, ±8% facet jitter
  // (the head was a "value black hole" next to the banded chest)
  {
    const tRidge = new THREE.Color(lerpHex(FORNAX_TIERS.ashLit, 0x8a7c66, 0.55));   // pale keratin — snout bridge + crest edges
    const tPlate = new THREE.Color(0x554639);   // hide-r4: warm cooling-coal bias on plate tops
    const tBase = new THREE.Color(0x413830);
    const tLow = new THREE.Color(lerpHex(FORNAX_TIERS.charShadow, FORNAX_TIERS.charBase, 0.40));
    const tRecess = new THREE.Color(FORNAX_TIERS.charShadow);
    const byRing = [tRidge, tPlate, tBase, tLow, tRecess, tLow, tBase, tPlate];
    const scols = [];
    const nV = sv.length / 3;
    const cc = new THREE.Color();
    for (let i = 0; i < nV; i++) {
      cc.copy(byRing[i % 8]);
      cc.offsetHSL(0, 0, jit(i * 13 + 5, 0.03));
      scols.push(cc.r, cc.g, cc.b);
    }
    sg.setAttribute('color', new THREE.Float32BufferAttribute(scols, 3));
  }
  const skullLoftMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0.0, flatShading: true, vertexColors: true });
  const skull = new THREE.Mesh(sg, skullLoftMat);   // stations already author the muzzle at −Z (forward)
  group.add(skull);

  // LOWER JAW — its own loft hinged under the brow dip, dropped ~12° at rest so
  // the mouth split + tooth line read from every angle (head-gauntlet r1 gap 1).
  // ~70% the depth of the upper muzzle; the upper hook passes its tip.
  const jstations = [
    [0, W * 0.52, H * 0.06, H * 0.62],           // hinge root — h-r10: 0.35-0.4 of skull height
    [-L * 0.26, W * 0.42, H * 0.05, H * 0.40],
    [-L * 0.46, W * 0.26, H * 0.04, H * 0.22],
    [-L * 0.60, W * 0.12, H * 0.07, H * 0.14],   // jaw tip — chin keel answers the crest
  ];
  const jv = [], ji = [];
  for (const [z, w, top, bot] of jstations) {
    jv.push(0, top, z, -w * 0.72, top * 0.4, z, -w, -bot * 0.2, z, -w * 0.5, -bot * 0.8, z,
      0, -bot, z, w * 0.5, -bot * 0.8, z, w, -bot * 0.2, z, w * 0.72, top * 0.4, z);
  }
  for (let s = 0; s < jstations.length - 1; s++) {
    const a0 = s * 8, b0 = (s + 1) * 8;
    for (let m = 0; m < 8; m++) { const n = (m + 1) % 8; ji.push(a0 + m, b0 + m, a0 + n, a0 + n, b0 + m, b0 + n); }
  }
  const jg = new THREE.BufferGeometry();
  jg.setAttribute('position', new THREE.Float32BufferAttribute(jv, 3));
  jg.setIndex(ji); jg.computeVertexNormals();
  const jawGrp = new THREE.Group();
  jawGrp.position.set(0, -H * 0.10, L * 0.12);
  {
    const coalMat = new THREE.MeshStandardMaterial({ color: 0x1a0c06, emissive: STOKE_DEEP, emissiveIntensity: 0.22, roughness: 0.9, flatShading: true });
    coalMat.userData.baseEmissive = STOKE_DEEP; coalMat.userData.baseIntensity = 0.22;
    coalMat.userData.flareIntensityWeight = 0.3;
    const coals = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.34, L * 0.18, 2, 1), coalMat);
    coals.rotation.x = -Math.PI / 2 + 0.10;
    coals.position.set(0, H * 0.028, -L * 0.20);   // banked INSIDE the maw floor — a glimpse, not a decal
    jawGrp.add(coals);
  }
  jawGrp.rotation.x = -0.48;                     // ~28° resting gape — the corner must read AFT (h-r10)
  jawGrp.add(new THREE.Mesh(jg, jawMat));
  group.add(jawGrp);
  // masseter mass — a jaw-muscle wedge over the hinge on each side (h-r5: the
  // jaw must look DRIVEN; a hinge without muscle reads as a plank on a pin)
  for (const side of [-1, 1]) {
    const mass = new THREE.Mesh(new THREE.SphereGeometry(0.17 * hs, seg(5), seg(4)), jawMat);
    mass.scale.set(0.72, 1.02, 1.90);
    mass.position.set(side * W * 0.56, -H * 0.12, L * 0.30);   // h-r9: jowl — flows back over the first neck lobe
    mass.rotation.x = -0.25;
    group.add(mass);
  }

  // tooth strip — lighter zig-zag along the seam (upper gum line) + tip fangs.
  // Bone-pale, NOT emissive (the menace is value contrast, not glow — law 6).
  const toothMat = new THREE.MeshStandardMaterial({ color: 0xc9b48e, roughness: 0.6, metalness: 0.0, flatShading: true, emissive: 0x2a1a0e, emissiveIntensity: 0.35 });   // worn ivory; the warm floor stops shadow-side teeth reading slate
  // h-r8: a weapon SET, not a picket fence — hero canines + two raked teeth per
  // side, all forward of mid-gape; the aft gape stays EMPTY (the dark furnace maw)
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const t = i / 2;
    const tz = -L * (0.50 - t * 0.18);           // strip lives in the front 40% of the mouth
    const tw = W * (0.15 + t * 0.22);
    const fang = i === 0 ? 2.0 : 1.0;            // hero canines near the snout tip
    const len = (0.085 - i * 0.014) * hs * fang;
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.024 * hs * (fang > 1 ? 1.35 : 1), len, seg(4)), toothMat);
    tooth.rotation.x = Math.PI + 0.22;           // raked BACKWARD 12° (predator, not zipper)
    tooth.position.set(side * tw * 0.90, -H * (0.10 + t * t * 0.20) + len * 0.02, tz);   // h-r11: welded into the gum — no floating roots
    group.add(tooth);
  }
  for (const side of [-1, 1]) {                  // lower fangs rise just inside the hook
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.036 * hs, 0.17 * hs, seg(4)), toothMat);
    fang.position.set(side * W * 0.10, H * 0.08, -L * 0.56);
    jawGrp.add(fang);
    {                                            // h-r8: ONE lower tooth per side, 0.6x, forward — the aft gape stays dark
      const lt = new THREE.Mesh(new THREE.ConeGeometry(0.020 * hs, 0.08 * hs, seg(4)), toothMat);
      lt.rotation.x = 0.18;
      lt.position.set(side * W * 0.20, H * 0.06, -L * 0.44);
      jawGrp.add(lt);
    }
  }

  // NAPE PLATE — trapezoid capping the neck join, overlapping the skull's rear
  // edge so the crown ridge continues down the neck (r1 gap 2 fix): the head
  // reads as the terminal spike of the neck, not a wedge pinned to a bead chain.
  // roofed (center ridge) — a flat quad read as floating cardboard from the rear
  const npF = W * 0.86, npR = W * 0.52, npL = 0.52 * hs, npY = H * 0.66, npZ = L * 0.34;
  const npMidF = [0, npY + 0.10 * hs, npZ], npMidR = [0, npY - 0.06 * hs, npZ + npL];
  const napeTris = [
    [[-npF, npY - 0.06 * hs, npZ], npMidF, npMidR],
    [[-npF, npY - 0.06 * hs, npZ], npMidR, [-npR, npY - 0.22 * hs, npZ + npL]],
    [npMidF, [npF, npY - 0.06 * hs, npZ], npMidR],
    [[npF, npY - 0.06 * hs, npZ], [npR, npY - 0.22 * hs, npZ + npL], npMidR],
  ];
  const nape = flatTriMesh(napeTris, new THREE.MeshStandardMaterial({ color: FORNAX_TIERS.charBase, roughness: 0.62, flatShading: true, side: THREE.DoubleSide }));
  group.add(nape);

  // brow-prong wedges over each orbit (the menace carrier)
  for (const side of [-1, 1]) {
    const prong = bone(side * W * 0.5, H * 0.34, -L * 0.02, side * W * 0.72, H * 0.52, -L * 0.24, 0.055 * hs, 0.012, skullMat);
    group.add(prong);
  }
  // brow-ridge PLATE over each orbit: angled DOWN-AND-FORWARD (h-r2 — a
  // horizontal shelf reads as a mustache bar; menace is an overhanging brow)
  for (const side of [-1, 1]) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.15 * hs, 0.03 * hs, 0.20 * hs), skullMat);
    plate.position.set(side * W * 0.46, H * 0.40, -L * 0.16);
    plate.rotation.z = side * -0.30;             // outer edge dips over the orbit
    plate.rotation.x = -0.35;                    // nose-down toward the muzzle
    group.add(plate);
  }
  // small ember eyes — inboard + forward-set under the angled brow (law 6 accent)
  const eyeMat = mats.eyeMat;
  eyeMat.userData.flareIntensityWeight = 0.5;    // hide-r5: the eye is a FURNACE-orange ember, never ACES-cream
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045 * hs, seg(6), seg(4)), eyeMat);
    eye.position.set(side * W * 0.44, H * 0.30, -L * 0.17);
    group.add(eye);
  }

  // occipital horn rank: dominant backswept PAIR at 135° sweep + midline followers
  const followers = Math.max(0, Math.round(model.hornFollowers ?? 0));
  const sweepA = THREE.MathUtils.degToRad(135);
  const hornLen = 1.10 * hs;   // h-r5: dominant ~1.2x skull length — the crown must own the profile
  const oxide = !!(model.oxideBand ?? 0);
  const mkHorn = (len, r0, oxideOk = false) => {
    // tapered curved horn: 3 bone segments along the 135° sweep, ×3 taper
    const g = new THREE.Group();
    const dir = new THREE.Vector3(0, Math.sin(sweepA - Math.PI / 2), Math.cos(sweepA - Math.PI / 2));
    let p0 = new THREE.Vector3(0, 0, 0);
    const cOx = [new THREE.Color(0xc9a86a), new THREE.Color(0x7a4a78), new THREE.Color(0x3c5a8a)]; // straw→purple→blue
    for (let k = 0; k < 3; k++) {
      const t0 = k / 3, t1 = (k + 1) / 3;
      const bend = 0.16 * k;
      const p1 = p0.clone().add(dir.clone().multiplyScalar(len / 3).applyAxisAngle(new THREE.Vector3(1, 0, 0), -bend));
      const b = bone(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, r0 * (1 - t0 * 0.92), r0 * (1 - t1 * 0.92), hornMat);
      // temper-oxide vertex paint on the outer third (law 8 — the ONE blue, diffuse only)
      const geo = b.geometry ?? (b.children[0] && b.children[0].geometry);
      if (geo && geo.attributes && geo.attributes.position) {
        const n = geo.attributes.position.count, cols = [];
        const base = new THREE.Color(lerpHex(FORNAX_TIERS.scorchMid, FORNAX_TIERS.ashLit, 0.15 + k * 0.32));   // hide-r3: hard keratin bands, root dark -> tip bone-light
        for (let i = 0; i < n; i++) {
          const c = (oxide && oxideOk && k === 2) ? cOx[Math.min(2, Math.floor((i / n) * 3))].clone().lerp(base, 0.72) : base;   // oxide on the DOMINANT pair only, muted (h-r3 regression: light base made every tip garish)
          cols.push(c.r, c.g, c.b);
        }
        geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      }
      g.add(b);
      p0 = p1;
    }
    return g;
  };
  for (const side of [-1, 1]) {
    const h = mkHorn(hornLen * (side === 1 && (model.chippedBrow ?? 0) ? 0.85 : 1.0), 0.12 * hs, true);   // h-r10: 2x the gauge of every supporter
    h.position.set(side * W * 0.40, H * 0.48, L * 0.20);   // base SUNK into the dome — grown, not inserted
    h.rotation.z = side * -0.42;          // cant OUTWARD (a paired rank, not a picket)
    h.rotation.x = 0.30;                  // h-r10: graded fan tier 1 (~17°)
    group.add(h);
  }
  // RANKED horn pairs behind the dominant crescent — 60% and 35% of its length
  // on the same back-sweep arc (r1 gap 3: a composed rank + decay, not "one horn")
  const rankPairs = Math.min(2, followers);
  // h-r2: clear hierarchy — ranks shrink AND fan apart in pitch (a shared angle
  // reads as a parallel slab stack, not a composed rank)
  const rankLen = [0.55, 0.33], rankZ = [0.18, 0.36], rankX = [0.34, 0.26];   // h-r9: clear 1.0/0.55/0.33 steps
  for (let r = 0; r < rankPairs; r++) {
    for (const side of [-1, 1]) {
      const h = mkHorn(hornLen * rankLen[r], 0.10 * hs * (0.66 - r * 0.22));
      h.position.set(side * W * rankX[r], H * 0.44 - r * 0.05 * hs, L * 0.28 + rankZ[r] * hs);
      h.rotation.z = side * -(0.48 + r * 0.14);   // h-r11: ranks fan OUTWARD in yaw (27/35 deg) — separate reads in 3/4
      h.rotation.x = 0.55 + r * 0.25;             // h-r10: graded fan 31°/46°
      group.add(h);
    }
  }
  // brow-spike tier (h-r8: 0.25x — the smallest rank of the crown fan)
  for (const side of [-1, 1]) {
    const bs = mkHorn(hornLen * 0.14, 0.036 * hs);   // h-r11: short, and never crossing the primary pair
    bs.position.set(side * W * 0.50, H * 0.42, -L * 0.10);
    bs.rotation.z = side * -0.50;
    bs.rotation.x = -0.05;   // tips forward, clear of the crown fan
    group.add(bs);
  }
  // crest spikes welding skull to neck — two small pairs continuing down the nape line
  for (let k = 0; k < 1; k++) for (const side of [-1, 1]) {   // h-r10: one weld pair — the second read as clutter
    const ns = mkHorn(hornLen * (0.22 - 0.06 * k), 0.032 * hs);
    ns.position.set(side * W * (0.20 - 0.05 * k), H * (0.30 - 0.14 * k), L * (0.50 + 0.16 * k));
    ns.rotation.z = side * -0.30;
    ns.rotation.x = 0.85 + k * 0.12;
    group.add(ns);
  }
  // continuous occipital crest ridge — the horns GROW from this, brow to nape
  {
    const cr = [];
    const ridgeY = [[-L * 0.08, H * 0.50], [L * 0.02, H * 0.72], [L * 0.16, H * 0.96], [L * 0.30, H * 0.74], [L * 0.44, H * 0.46]];
    for (let i = 0; i < ridgeY.length - 1; i++) {
      const [z0, y0] = ridgeY[i], [z1, y1] = ridgeY[i + 1];
      cr.push([[0, y0 + 0.06 * hs, z0], [0, y1 + 0.06 * hs, z1], [0.03 * hs, y0 - 0.02, z0]]);
      cr.push([[0, y1 + 0.06 * hs, z1], [0.03 * hs, y1 - 0.02, z1], [0.03 * hs, y0 - 0.02, z0]]);
      cr.push([[0, y1 + 0.06 * hs, z1], [0, y0 + 0.06 * hs, z0], [-0.03 * hs, y0 - 0.02, z0]]);
      cr.push([[-0.03 * hs, y1 - 0.02, z1], [0, y1 + 0.06 * hs, z1], [-0.03 * hs, y0 - 0.02, z0]]);
    }
    group.add(flatTriMesh(cr, skullMat));
  }
  // midline crest SCUTES continuing the decay down the nape (small, one sweep direction)
  let fz = L * 0.46, fl = hornLen * 0.16;   // scutes are a RIDGE, not more horns (comb-crest tell)
  for (let i = 0; i < Math.min(2, followers); i++) {   // h-r9: cap the clutter
    const f = mkHorn(fl, 0.030 * hs);
    f.position.set(0, H * 0.52 - i * 0.03, fz);
    f.rotation.x = 0.72 + i * 0.08;       // scutes lie flatter down the nape
    group.add(f);
    fz += 0.15 * Math.pow(0.8, i);
    fl *= 0.68;
  }

  return { group, spineMats: [], headLength: L };
}
registerHead('brandSkull', buildBrandSkull);

// ── FIREBRAND TAIL (§8) ──────────────────────────────────────────────────────
// No spade: the terminus is THE FIREBRAND — a blunt char-capped coal tip where
// THE STOKE vents. Silhouette duty rides the dorsal ridge crest (dominant +
// ×0.66 decay, hip→tip). 2.6× torso length, fattest just aft of the hip, ×3
// taper. House 4-joint isBone chain (rotation-only rig drive).
function buildFirebrandTail(def, model, mats, anchor) {
  const group = new THREE.Group();
  const a = anchor ?? { y: 0.13, z: 2.08 };
  const T = (model.tailLength ?? 1) * 3.1;         // 2.6× torso read at frame scale
  const nJoints = 4;
  const segsPer = seg(3);
  const tailMat = new THREE.MeshStandardMaterial({ color: def.body ?? FORNAX_TIERS.charBase, roughness: 0.66, flatShading: true });
  const ridgeMat = new THREE.MeshStandardMaterial({ color: FORNAX_TIERS.charShadow, roughness: 0.55, flatShading: true });
  // hip→tail fillet: a tapered collar so the tail continues the spine, not a socket
  {
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.46, 0.72, seg(8)), tailMat);
    collar.rotation.x = Math.PI / 2 - 0.06;
    collar.position.set(0, a.y + 0.02, a.z + 0.18);
    group.add(collar);
  }
  const joints = [];
  let parent = group, zc = 0;
  const rAt = (t) => 0.44 * Math.pow(1 - t * 0.80, 1.45) + 0.05;   // muscular base, exponential-feel taper, floor feeds the club  // fat aft of hip, ×3 taper
  const ridgeOn = Math.max(0, Math.round(model.tailRidge ?? 0));
  for (let j = 0; j < nJoints; j++) {
    const joint = new THREE.Group();
    joint.position.set(0, j === 0 ? a.y : 0, j === 0 ? a.z : T / nJoints);
    if (j === 0) joint.isBone = true;
    joints.push(joint);
    parent.add(joint);
    parent = joint;
    // lofted segment: a few tapered bones per joint
    for (let k = 0; k < segsPer; k++) {
      const t0 = (j + k / segsPer) / nJoints, t1 = (j + (k + 1) / segsPer) / nJoints;
      const z0 = (k / segsPer) * (T / nJoints), z1 = ((k + 1) / segsPer) * (T / nJoints);
      joint.add(bone(0, 0, z0, 0, -0.015, z1, rAt(t0), rAt(t1), tailMat));
      // dorsal ridge crest: dominant near the hip, ×0.66 decay to the tip
      if (ridgeOn && (j * segsPer + k) % 1 === 0) {
        const i = j * segsPer + k;
        const crest = 0.16 * Math.pow(0.66, i * 0.45) * (ridgeOn >= 2 ? 1 : 0.6);
        if (crest > 0.02) {
          const cv = [0, rAt(t0) * 0.8, z0, 0, rAt(t0) * 0.8 + crest, (z0 + z1) / 2 + jit(i * 3, 0.02), 0, rAt(t1) * 0.8, z1];
          const cg = new THREE.BufferGeometry();
          cg.setAttribute('position', new THREE.Float32BufferAttribute(cv, 3));
          cg.setIndex([0, 1, 2]); cg.computeVertexNormals();
          const cm = new THREE.Mesh(cg, ridgeMat);
          cm.material.side = THREE.DoubleSide;
          joint.add(cm);
        }
      }
    }
  }
  // THE FIREBRAND terminus: blunt char cap + a banked-coal core that vents on Surge
  const tipZ = T / nJoints;
  const capMat = new THREE.MeshStandardMaterial({ color: FORNAX_TIERS.charShadow, roughness: 0.5, flatShading: true });
  parent.add(bone(0, -0.01, tipZ - 0.34, 0, -0.015, tipZ - 0.12, 0.15, 0.115, capMat));
  parent.add(bone(0, -0.015, tipZ - 0.12, 0, -0.02, tipZ + 0.02, 0.115, 0.09, capMat));
  const cap = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26), capMat);
  cap.scale.set(1.15, 0.8, 1.5);   // faceted, slightly flattened, merged with the shaft
  for (const sd of [-1, 1]) {      // flanking char spikes blend the club into the shaft (still blunt — never a spade)
    parent.add(bone(sd * 0.06, 0.02, tipZ - 0.28, sd * 0.20, 0.05, tipZ + 0.05, 0.055, 0.012, capMat));
  }
  cap.position.set(0, -0.02, tipZ);
  parent.add(cap);
  const accentMats = [];
  if (model.firebrandTip ?? 0) {
    const coalMat = new THREE.MeshStandardMaterial({ color: 0x1c1a1c, emissive: STOKE_EMBER, emissiveIntensity: 0.10, roughness: 0.4, flatShading: true });
    coalMat.userData.baseEmissive = STOKE_EMBER; coalMat.userData.baseIntensity = 0.10;
    coalMat.userData.flareIntensityWeight = 0.35;
    const coal = new THREE.Mesh(new THREE.OctahedronGeometry(0.085), coalMat);
    coal.position.set(0, -0.01, tipZ + 0.10);
    parent.add(coal);
    const bloom = softGlow(STOKE_EMBER, 0.26, 0.30);
    bloom.position.copy(coal.position);
    parent.add(bloom);
    accentMats.push(coalMat);
  }
  return { group, segs: joints, tailFins: [], accentMats, spineMats: accentMats };
}
registerTail('firebrandTail', buildFirebrandTail);

export { FORNAX_PROFILE, FORNAX_TIERS };
