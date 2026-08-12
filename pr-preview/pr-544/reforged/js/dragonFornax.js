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
  p.stations[3][1] = 0.74; p.stations[3][2] = 0.46; p.stations[3][3] = 0.56;
  p.keel[1][1] = 0.46;
  // thorax carries the anvil aft — broad, low
  p.stations[4][1] = 0.62; p.stations[4][2] = 0.38; p.stations[4][3] = 0.50;
  p.keel[2][1] = 0.38;
  // waist pinch stays (70/30 split pivot), hips carry the haunch swell
  p.stations[6][1] = 0.33; p.stations[6][2] = 0.24;
  p.keel[4][1] = 0.24;
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
  const throatMat = mkSeamMat(STOKE_PEAK, 0.05);
  const throatPts = [];
  for (let i = 0; i <= seg(6); i++) {
    const t = i / seg(6), z = -2.3 + t * 1.9;
    throatPts.push([0, -((attach.keelTopAt ? 0.34 : 0.34)) - 0.06 * Math.sin(t * Math.PI) + 0.2 - 0.38, z]);
  }
  meshes.push(strip(throatPts, 0.035, throatMat));
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
    hip.position.set(side * 0.26, 0.16, 1.05);
    // femur: abducted out + slightly down; haunch swell at the root
    const femurDir = new THREE.Vector3(side * Math.sin(hipAb), -0.38, 0.42).normalize().multiplyScalar(L.femur);
    hip.add(bone(0, 0, 0, femurDir.x, femurDir.y, femurDir.z, 0.24, 0.13, legMat));
    // haunch swell — a lofted root mass breaking the outline (never blobby)
    const swell = new THREE.Mesh(new THREE.SphereGeometry(0.24, seg(7), seg(5)), legMat);
    swell.scale.set(1.15, 0.85, 1.3);
    swell.position.set(femurDir.x * 0.22, femurDir.y * 0.22 + 0.02, femurDir.z * 0.22);
    hip.add(swell);
    // knee raised + inboard so the fold reads FOLDED, not landing-gear
    const knee = new THREE.Group(); knee.position.copy(femurDir); hip.add(knee);
    const shinDir = new THREE.Vector3(side * Math.sin(hipAb) * 0.35, -Math.sin(kneeA) * 0.55, Math.cos(kneeA)).normalize().multiplyScalar(L.shin);
    knee.add(bone(0, 0, 0, shinDir.x, shinDir.y, shinDir.z, 0.13, 0.07, legMat));
    const ankle = new THREE.Group(); ankle.position.copy(shinDir); knee.add(ankle);
    // three-toed plated foot, toes spread; ankle at 115°
    const footDir = new THREE.Vector3(side * 0.15, -Math.sin(ankleA - Math.PI / 2) * 0.4, Math.cos(ankleA - Math.PI / 2)).normalize().multiplyScalar(L.foot);
    for (let toe = -1; toe <= 1; toe++) {
      const td = footDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), toe * 0.3);
      ankle.add(bone(0, 0, 0, td.x, td.y, td.z, 0.06, 0.022, legMat));
    }
    group.add(hip);
    legs[side === 1 ? 'legR' : 'legL'] = hip;
  }
  return { group, parts: legs };
}

registerTorso('slagAnvilTorso', (def, model, bodyMat) => {
  const r = buildTorso(FORNAX_PROFILE, def, model, bodyMat);
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
  const lenFrac = [1, 0.78, 0.61, 0.48];   // ref §4 decay band (0.62–0.82/rank) — D1 = 1.6× the mean of the others
  const spanAft = 1.35;
  const tips = [F0];
  for (let i = 1; i < nDigits; i++) {
    const gap = (1 - Math.pow(0.72, i)) / (1 - Math.pow(0.72, nDigits - 1));   // contracting spacing
    const phi = phi0 + spanAft * gap;
    const r = r0 * lenFrac[Math.min(i, lenFrac.length - 1)];
    tips.push([K[0] + Math.cos(phi) * r, K[1] - (0.03 + 0.07 * (i / (nDigits - 1))) * r, K[2] + Math.sin(phi) * r]);
  }

  function buildOneWing() {
    const arm = new THREE.Group(), hand = new THREE.Group();

    // fat bowed ridge helper (in-plane wedges, never needles — taper ×3)
    const ridgeLift = 0.10 * hs;
    const ridge = (tgt, a, b, wB, wT, mat, capMat, lift) => {
      const lf = lift ?? ridgeLift;
      const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz) || 1, px = -dz / len, pz = dx / len;
      const aL = [a[0] + px * wB, a[1], a[2] + pz * wB], aR = [a[0] - px * wB, a[1], a[2] - pz * wB];
      const bL = [b[0] + px * wT, b[1], b[2] + pz * wT], bR = [b[0] - px * wT, b[1], b[2] - pz * wT];
      const aT = [a[0], a[1] + lf, a[2]], bT = [b[0], b[1] + lf * 0.35, b[2]];
      tgt.add(tri([[aL, bL, bT], [aL, bT, aT], [aR, aT, bT], [aR, bT, bR]], mat));
      if (capMat) { const aT2 = [a[0] + px * wB * 0.28, a[1] + lf, a[2] + pz * wB * 0.28]; tgt.add(tri([[aT, bT, aT2]], capMat)); }
    };

    // ARM — humerus + forearm (wing IS the arm, law 2): thick at the shoulder
    // (the 1.4× humerus-root rule), low-lifted so it reads as muscled limb
    const armLift = 0.035 * hs;
    const E = LE(wristT * 0.45);
    ridge(arm, LE(0), E, 0.22 * hs, 0.13 * hs, M.bone, null, armLift);
    ridge(arm, E, K, 0.13 * hs, 0.07 * hs, M.bone, null, armLift);
    { // scapular slag-cowl plates over the pivot (the shoulder MASS the sail grows from)
      const s0c = LE(0);
      const cw = 0.30 * hs;
      arm.add(tri([
        [[s0c[0] - cw * 0.5, s0c[1] + 0.16 * hs, s0c[2] - 0.24], [s0c[0] + cw, s0c[1] + 0.06 * hs, s0c[2] - 0.30], [s0c[0] + cw * 0.7, s0c[1] + 0.13 * hs, s0c[2] + 0.16]],
        [[s0c[0] - cw * 0.5, s0c[1] + 0.16 * hs, s0c[2] - 0.24], [s0c[0] + cw * 0.7, s0c[1] + 0.13 * hs, s0c[2] + 0.16], [s0c[0] - cw * 0.3, s0c[1] + 0.05 * hs, s0c[2] + 0.34]],
        [[s0c[0] + cw, s0c[1] + 0.06 * hs, s0c[2] - 0.30], [s0c[0] + cw * 1.3, s0c[1] - 0.05 * hs, s0c[2] + 0.05], [s0c[0] + cw * 0.7, s0c[1] + 0.13 * hs, s0c[2] + 0.16]],
      ], M.memTiers[0]));
    }
    { // deltoid slag-cowl mass swallowing the root
      const s0 = LE(0);
      const sBk = [s0[0] - 0.08 * hs, s0[1] - 0.02 * hs, s0[2] - 0.30], sUp = [s0[0] + 0.03 * hs, s0[1] + 0.10 * hs, s0[2] - 0.02];
      const eLo = [E[0], E[1] - 0.02 * hs, E[2] + 0.05];
      arm.add(tri([[sBk, sUp, E], [sBk, E, eLo], [sUp, s0, E], [s0, eLo, E]], M.memTiers[2]));
    }
    // PROPATAGIUM — the stiffened forward sheet ahead of the arm (~9% area, §5;
    // apex-gated). Rigid leading edge: the sheet’s LE is a straight tensioned line.
    if (hasProp) {
      const s0 = LE(0);
      const fwd = [K[0] * 0.55 + s0[0] * 0.45, (K[1] + s0[1]) * 0.5 + 0.02, Math.min(K[2], s0[2]) - 0.34 * hs * 0.5];
      arm.add(tri([[s0, fwd, K], [s0, K, E]], M.memTiers[1]));
    } else {
      arm.add(tri([[LE(0), E, K]], M.memTiers[2]));   // inboard LE web (always — no severed arm)
    }

    // DIGITS — bowed 2-segment fat wedges K→tip; rim-catch cap on D1/D2
    for (let i = 0; i < tips.length; i++) {
      const tp = tips[i], wB = 0.085 * hs * (1 - 0.10 * i), wM = wB * 0.55;
      const L = Math.hypot(tp[0] - K[0], tp[1] - K[1], tp[2] - K[2]);
      const sag = 0.09 * L * (0.6 + 0.5 * (i / Math.max(1, tips.length - 1)));
      const Bm = [(K[0] + tp[0]) / 2, (K[1] + tp[1]) / 2 - sag, (K[2] + tp[2]) / 2 + sag * 0.4];
      ridge(hand, K, Bm, wB, wM, M.bone, i < 2 ? M.boneCap : null);
      ridge(hand, Bm, tp, wM, 0.006, M.bone, null);
    }
    // thumb-claw at the carpal (the wyvern HAND read)
    hand.add(tri([[K, [K[0] + 0.02 * hs, K[1] + 0.02 * hs, K[2] - 0.02 * hs], [K[0] + 0.04 * hs, K[1] + 0.11 * hs, K[2] - 0.16 * hs]], [K, [K[0] + 0.04 * hs, K[1] + 0.11 * hs, K[2] - 0.16 * hs], [K[0] - 0.03 * hs, K[1] + 0.03 * hs, K[2] + 0.02 * hs]]], M.bone));

    // MEMBRANE BAYS — TAUT: the trailing arc between adjacent digits is nearly
    // straight (sag ≤0.10 bay chord, deepest ~40% along), and its ENDPOINTS sit
    // NOTCH×bayChord short of each tip along the digit line — the scallop comes
    // from BONE PROJECTION past the membrane (the notch floor), never from drape.
    const NSEG = seg(4), trailing = [], underGlowT = [];
    const pullBack = (tip, frac) => [tip[0] + (K[0] - tip[0]) * frac, tip[1] + (K[1] - tip[1]) * frac, tip[2] + (K[2] - tip[2]) * frac];
    for (let i = 0; i < tips.length - 1; i++) {
      const Fa = tips[i], Fb = tips[i + 1];
      const bayChord = Math.hypot(Fa[0] - Fb[0], Fa[1] - Fb[1], Fa[2] - Fb[2]);
      const La = Math.hypot(Fa[0] - K[0], Fa[1] - K[1], Fa[2] - K[2]);
      const Lb = Math.hypot(Fb[0] - K[0], Fb[1] - K[1], Fb[2] - K[2]);
      const Ea = pullBack(Fa, Math.min(0.5, notch * bayChord / La));
      const Eb = pullBack(Fb, Math.min(0.5, notch * bayChord / Lb));
      // taut concave arc between the pulled-back edge points, sag ≤ baySag×chord
      const base = [Ea[0] + (Eb[0] - Ea[0]) * 0.40, Ea[1] + (Eb[1] - Ea[1]) * 0.40, Ea[2] + (Eb[2] - Ea[2]) * 0.40];
      const ctrl = [base[0] + (K[0] - base[0]) * baySag * 2, base[1] + (K[1] - base[1]) * baySag * 2 - 0.015, base[2] + (K[2] - base[2]) * baySag * 2];
      const arc = [];
      for (let s = 0; s <= NSEG; s++) arc.push(quad(Ea, ctrl, Eb, s / NSEG));
      // fill the bay: fan from K through the arc + weld strips to both digit lines
      const fan = [];
      for (let s = 0; s < NSEG; s++) fan.push([K, arc[s], arc[s + 1]]);
      fan.push([K, Fa, arc[0]]);            // weld to digit i (tip projects past Ea)
      fan.push([K, arc[NSEG], Fb]);         // weld to digit i+1
      hand.add(tri(fan, M.memTiers[Math.min(i, M.memTiers.length - 1)]));
      // THE UNDERLIT copy — the same bay dropped ~0.05 below in the STOKE mat
      const dn = (p) => [p[0], p[1] - 0.05, p[2]];
      for (const t3 of fan) underGlowT.push([dn(t3[0]), dn(t3[2]), dn(t3[1])]);
      for (let s = 0; s <= NSEG; s++) if (!(i > 0 && s === 0)) trailing.push(arc[s]);
    }
    // BODY BAY (plagiopatagium) — the sail closes onto the flank: innermost
    // digit edge → hip anchor line, the panel every bat/wyvern reads by. Rides
    // the HAND so the whole sail folds as one sheet at the wrist.
    {
      const Fi = tips[tips.length - 1];
      const Li = Math.hypot(Fi[0] - K[0], Fi[1] - K[1], Fi[2] - K[2]);
      const Ei = pullBack(Fi, Math.min(0.5, notch * 0.9));
      const hip = [0.10 + (K[0] - 0.10) * 0.35, -0.05 * hs, 1.10];   // shortened reach — the arm-frame gusset owns the last stretch to the hip
      const NB2 = seg(4);
      const fan2 = [];
      for (let sx = 0; sx < NB2; sx++) {
        const t0 = sx / NB2, t1 = (sx + 1) / NB2;
        const a = [Ei[0] + (hip[0] - Ei[0]) * t0, Ei[1] + (hip[1] - Ei[1]) * t0 - 0.04 * Math.sin(t0 * Math.PI), Ei[2] + (hip[2] - Ei[2]) * t0];
        const b = [Ei[0] + (hip[0] - Ei[0]) * t1, Ei[1] + (hip[1] - Ei[1]) * t1 - 0.04 * Math.sin(t1 * Math.PI), Ei[2] + (hip[2] - Ei[2]) * t1];
        fan2.push([K, a, b]);
      }
      fan2.push([K, Fi, Ei]);
      hand.add(tri(fan2, M.memTiers[3]));
      const dn2 = (p) => [p[0], p[1] - 0.05, p[2]];
      for (const t3 of fan2) underGlowT.push([dn2(t3[0]), dn2(t3[2]), dn2(t3[1])]);
      for (let sx = 0; sx <= NB2; sx++) {
        const t0 = sx / NB2;
        trailing.push([Ei[0] + (hip[0] - Ei[0]) * t0, Ei[1] + (hip[1] - Ei[1]) * t0 - 0.04 * Math.sin(t0 * Math.PI), Ei[2] + (hip[2] - Ei[2]) * t0]);
      }
    }
    if (underGlowT.length) hand.add(tri(underGlowT, underMat));

    // trailing knife-edge — one connected band inboard of the scallop polyline
    if (trailing.length > 1) {
      const eT = [], inb = (p) => [p[0] + (K[0] - p[0]) * 0.06, p[1] + (K[1] - p[1]) * 0.06 + 0.001, p[2] + (K[2] - p[2]) * 0.06];
      for (let s = 0; s < trailing.length - 1; s++) {
        const a = trailing[s], b = trailing[s + 1], ai = inb(a), bi = inb(b);
        eT.push([a, b, bi], [a, bi, ai]);
      }
      hand.add(tri(eT, M.edge));
    }

    // ROOT GUSSET — inboard membrane sweeping aft toward the hip, hem clamped at
    // 0.65 of the shoulder→hip run (§7 — the abducted thighs own the aft wedge)
    {
      const r0p = LE(0);
      const G = [r0p[0] + 0.09 * hs, r0p[1] - 0.05 * hs, r0p[2] + 1.30];   // hem ≤ 0.65 run
      const Aaft = [K[0] * 0.82 + r0p[0] * 0.18, K[1] - 0.10 * hs, K[2] + 0.72];
      const gm = [(r0p[0] + Aaft[0] + G[0]) / 3, (r0p[1] + Aaft[1] + G[1]) / 3 - 0.05, (r0p[2] + Aaft[2] + G[2]) / 3];
      arm.add(tri([[r0p, K, Aaft], [r0p, Aaft, gm], [Aaft, G, gm], [G, r0p, gm]], M.memTiers[3]));
      // underlit copy of the gusset (the crescent’s inboard leak)
      const dn = (p) => [p[0], p[1] - 0.045, p[2]];
      arm.add(tri([[dn(r0p), dn(Aaft), dn(K)], [dn(r0p), dn(gm), dn(Aaft)], [dn(Aaft), dn(gm), dn(G)], [dn(G), dn(gm), dn(r0p)]], underMat));
    }

    const marker = new THREE.Object3D();
    marker.position.set(F0[0], F0[1], F0[2]);
    hand.add(marker);
    return { arm, hand, marker };
  }

  const pivots = {};
  for (const side of [1, -1]) {
    const root = attach.wingRoot(1);
    const pivot = new THREE.Group(); pivot.position.set(root.x * 1.35, root.y * 0.78, root.z); pivot.userData.wingRole = 'pivot';
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
  const hornLen = 0.88 * hs;
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
    h.position.set(side * W * 0.42, H * 0.55, L * 0.28);
    h.rotation.z = side * -0.18;
    group.add(h);
  }
  // midline followers ×0.66 decay, contracting spacing down the nape
  let fz = L * 0.46, fl = hornLen * 0.66;
  for (let i = 0; i < followers; i++) {
    const f = mkHorn(fl, 0.065 * hs);
    f.position.set(0, H * 0.5 - i * 0.03, fz);
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
  const joints = [];
  let parent = group, zc = 0;
  const rAt = (t) => 0.27 * Math.pow(1 - t * 0.90, 1.1) + 0.035;  // fat aft of hip, ×3 taper
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
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.13, seg(6), seg(5)), capMat);
  cap.scale.set(1, 0.9, 1.35);
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
