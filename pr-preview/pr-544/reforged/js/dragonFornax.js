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
  charShadow: 0x232226,
  charBase: 0x2e2c2f,
  scorchMid: 0x443e3b,
  ashLit: 0x5c534b,
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
  const cScorch = new THREE.Color(def.bodyFacet ?? FORNAX_TIERS.scorchMid);
  const cAsh = new THREE.Color(def.bodyDorsal ?? FORNAX_TIERS.ashLit);
  const cBelly = new THREE.Color(def.belly ?? FORNAX_TIERS.scorchMid);
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
  p.neck = { ...ARROW_PROFILE.neck, rBase: 0.55, rStep: 0.075, yStep: 0.10, zStep: -0.31, wobbleAmp: 0.06 };   // shoulder-thick base tapering hard to ~0.4x at the skull
  p.headBase = (n) => ({ x: 0, y: 0.70 + (n - 4) * 0.09, z: -3.02 - (n - 4) * 0.30 });
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
  const throatMat = mkSeamMat(STOKE_PEAK, 0.035);
  const throatPts = [];
  for (let i = 0; i <= seg(6); i++) {
    const t = i / seg(6), z = -1.9 + t * 1.4;
    throatPts.push([0, -0.62 - 0.05 * Math.sin(t * Math.PI), z]);   // low on the keel line, clear of the neck loft
  }
  meshes.push(strip(throatPts, 0.028, throatMat));
  // dorsal spine seam (gen-1, emitter hue) nape→tail-root — THE STOKE's rail
  const spineMat = mkSeamMat(STOKE_EMBER, 0.04);
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
    const saddleMat = new THREE.MeshStandardMaterial({ color: def.bodyFacet ?? FORNAX_TIERS.scorchMid, roughness: 0.6, metalness: 0.0, flatShading: true });
    const wr = r.attach.wingRoot(1);
    for (const side of [1, -1]) {
      const block = new THREE.Mesh(new THREE.SphereGeometry(0.40, seg(8), seg(6)), saddleMat);
      block.scale.set(1.9, 0.85, 1.7);   // ONE smooth deltoid mass the spar grows out of
      block.position.set(side * wr.x * 1.28, wr.y - 0.05, wr.z + 0.04);
      r.group.add(block);
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
    bone: mkMat(FORNAX_TIERS.charShadow, 0.66),
    boneCap: mkMat(FORNAX_TIERS.ashLit, 0.5),
    memTiers: [
      mkMat(lerpHex(def.wingOuter ?? FORNAX_TIERS.charBase, FORNAX_TIERS.ashLit, 0.30)),
      mkMat(def.wingOuter ?? FORNAX_TIERS.charBase),
      mkMat(lerpHex(def.wingOuter ?? FORNAX_TIERS.charBase, FORNAX_TIERS.charShadow, 0.45)),
      mkMat(FORNAX_TIERS.charShadow),
    ],
    edge: mkMat(FORNAX_TIERS.scorchMid, 0.5),
  };
  // the shared-rig wingMat contract: register a top-membrane mat with BLACK
  // emissive so every unconditional boost/backlit drive multiplies black
  const wingMat = M.memTiers[1];
  applyFresnelRim(wingMat, def.apexSeam ?? STOKE_EMBER);
  // THE UNDERLIT material — bespoke, outside wingMat; ignited only by THE STOKE
  const underMat = new THREE.MeshStandardMaterial({
    color: 0x141214, emissive: STOKE_EMBER, emissiveIntensity: 0.03, roughness: 0.6,
    flatShading: true, side: THREE.FrontSide,   // lit face points DOWN (law 5: tops never emissive)
  });
  underMat.userData.baseEmissive = STOKE_EMBER; underMat.userData.baseIntensity = 0.03;
  underMat.userData.flareIntensityWeight = 0.65;

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
        boundary.push([p[0], p[1], p[2], 1 + i]);
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
        boundary.push([Fl[0] + (HIP[0] - Fl[0]) * t, Fl[1] + (HIP[1] - Fl[1]) * t - 0.06 * hs * Math.sin(t * Math.PI), Fl[2] + (HIP[2] - Fl[2]) * t, 3]);
      }
    }
    // flank edge hip→shoulder (hugs the body)
    boundary.push([-0.18, S0[1] - 0.06, S0[2] + 0.62, 3]);   // flank edge tucked under the torso

    // triangulate: radial fan from K (the planform is star-shaped around the wrist)
    const verts = [], cols = [], idx = [];
    const tierCols = [
      new THREE.Color(lerpHex(def.wingOuter ?? FORNAX_TIERS.charBase, FORNAX_TIERS.ashLit, 0.30)),
      new THREE.Color(def.wingOuter ?? FORNAX_TIERS.charBase),
      new THREE.Color(lerpHex(def.wingOuter ?? FORNAX_TIERS.charBase, FORNAX_TIERS.charShadow, 0.45)),
      new THREE.Color(FORNAX_TIERS.charShadow),
    ];
    verts.push(K[0], K[1], K[2]);
    { const c = tierCols[1]; cols.push(c.r, c.g, c.b); }
    for (let i = 0; i < boundary.length; i++) {
      const b = boundary[i];
      verts.push(b[0], b[1], b[2]);
      const c = tierCols[Math.min(3, b[3])].clone();
      c.offsetHSL(0, 0, jit(i * 11, 0.015));
      cols.push(c.r, c.g, c.b);
    }
    for (let i = 0; i < boundary.length - 1; i++) idx.push(0, i + 1, i + 2);
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
      ridge(hand, K, Bm, wB, wM, M.bone, i < 2 ? M.boneCap : null);
      ridge(hand, Bm, tp, wM, 0.006, M.bone, null);
    }
    // thumb-claw at the carpal knuckle
    hand.add(tri([[K, [K[0] + 0.02 * hs, K[1] + 0.02 * hs, K[2] - 0.02 * hs], [K[0] + 0.04 * hs, K[1] + 0.11 * hs, K[2] - 0.16 * hs]], [K, [K[0] + 0.04 * hs, K[1] + 0.11 * hs, K[2] - 0.16 * hs], [K[0] - 0.03 * hs, K[1] + 0.03 * hs, K[2] + 0.02 * hs]]], M.bone));

    // THE ARM — a thigh-thick humerus + forearm riding the leading edge (wing IS
    // the arm), with the scapular slag-cowl swallowing the root into the torso
    const armLift = 0.06 * hs;
    const E = LE(wristT * 0.45);
    ridge(arm, LE(0), E, 0.26 * hs, 0.15 * hs, M.bone, null, armLift);
    ridge(arm, E, K, 0.13 * hs, 0.07 * hs, M.bone, null, armLift);
    // forward fillet: closes the daylight notch between neck-side and the arm LE
    arm.add(tri([[[-0.15, S0[1] + 0.02, S0[2] - 0.15], LE(0.30), S0]], M.memTiers[1]));
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
  const skullMat = new THREE.MeshStandardMaterial({ color: def.body ?? FORNAX_TIERS.charBase, roughness: 0.62, metalness: 0.0, flatShading: true, vertexColors: false });
  const hornMat = new THREE.MeshStandardMaterial({ color: FORNAX_TIERS.charShadow, roughness: 0.5, metalness: 0.08, flatShading: true, vertexColors: true });

  // skull wedge (w:h 1.1) with the dorsal S: nasal keel, brow dip, rising occiput
  const L = 0.95 * hs;                  // skull length
  const W = 0.40 * hs, H = W / 1.1;
  const sv = [], si = [];
  // stations along the skull −Z (muzzle) → +Z (occiput): [z, halfW, top, bot]
  const stations = [
    [-L * 0.52, W * 0.16, H * 0.24, H * 0.30],   // muzzle tip (blunt, armoured)
    [-L * 0.30, W * 0.42, H * 0.52, H * 0.46],   // nasal keel (convex rise)
    [-L * 0.06, W * 0.62, H * 0.46, H * 0.52],   // brow dip
    [L * 0.20, W * 0.50, H * 0.72, H * 0.48],    // rising occiput
    [L * 0.42, W * 0.28, H * 0.62, H * 0.32],    // occipital shelf
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
  const skull = new THREE.Mesh(sg, skullMat);   // stations already author the muzzle at −Z (forward)
  group.add(skull);

  // brow-prong wedges over each orbit (the menace carrier)
  for (const side of [-1, 1]) {
    const prong = bone(side * W * 0.5, H * 0.34, -L * 0.02, side * W * 0.72, H * 0.52, -L * 0.24, 0.055 * hs, 0.012, skullMat);
    group.add(prong);
  }
  // small ember eyes at (x 0.67, y 0.78) of skull — always-on accent (identity law 6)
  const eyeMat = mats.eyeMat;
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045 * hs, seg(6), seg(4)), eyeMat);
    eye.position.set(side * W * 0.56, H * 0.30, -L * 0.14);
    group.add(eye);
  }

  // occipital horn rank: dominant backswept PAIR at 135° sweep + midline followers
  const followers = Math.max(0, Math.round(model.hornFollowers ?? 0));
  const sweepA = THREE.MathUtils.degToRad(135);
  const hornLen = 0.76 * hs;
  const oxide = !!(model.oxideBand ?? 0);
  const mkHorn = (len, r0) => {
    // tapered curved horn: 3 bone segments along the 135° sweep, ×3 taper
    const g = new THREE.Group();
    const dir = new THREE.Vector3(0, Math.sin(sweepA - Math.PI / 2), Math.cos(sweepA - Math.PI / 2));
    let p0 = new THREE.Vector3(0, 0, 0);
    const cOx = [new THREE.Color(0xc9a86a), new THREE.Color(0x7a4a78), new THREE.Color(0x3c5a8a)]; // straw→purple→blue
    for (let k = 0; k < 3; k++) {
      const t0 = k / 3, t1 = (k + 1) / 3;
      const bend = 0.16 * k;
      const p1 = p0.clone().add(dir.clone().multiplyScalar(len / 3).applyAxisAngle(new THREE.Vector3(1, 0, 0), -bend));
      const b = bone(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, r0 * (1 - t0 * 0.66), r0 * (1 - t1 * 0.66), hornMat);
      // temper-oxide vertex paint on the outer third (law 8 — the ONE blue, diffuse only)
      const geo = b.geometry ?? (b.children[0] && b.children[0].geometry);
      if (geo && geo.attributes && geo.attributes.position) {
        const n = geo.attributes.position.count, cols = [];
        const base = new THREE.Color(FORNAX_TIERS.charShadow);
        for (let i = 0; i < n; i++) {
          const c = (oxide && k === 2) ? cOx[Math.min(2, Math.floor((i / n) * 3))].clone().lerp(base, 0.45) : base;
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
    const h = mkHorn(hornLen * (side === 1 && (model.chippedBrow ?? 0) ? 0.85 : 1.0), 0.10 * hs);
    h.position.set(side * W * 0.42, H * 0.50, L * 0.30);
    h.rotation.z = side * -0.42;          // cant OUTWARD (a paired rank, not a picket)
    h.rotation.x = 0.5;                   // lean hard AFT along the neck line
    group.add(h);
  }
  // midline followers ×0.66 decay, contracting spacing down the nape
  let fz = L * 0.46, fl = hornLen * 0.48;
  for (let i = 0; i < followers; i++) {
    const f = mkHorn(fl, 0.065 * hs);
    f.position.set(0, H * 0.5 - i * 0.03, fz);
    f.rotation.x = 0.55 + i * 0.06;       // followers lie flatter down the nape
    group.add(f);
    fz += 0.16 * Math.pow(0.8, i);
    fl *= 0.66;
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
