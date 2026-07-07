import * as THREE from 'three';
import { registerHead } from './dragonRecipe.js';
import { seg } from './modelDetail.js';

// DRACONIC HEAD — Dragon Drift's "house style" dragon head: a sleek, intelligent,
// catlike wedge skull (Night-Fury *inspired*, never a copy) assembled from a
// reusable MODULE BANK. The base for the game's TRUE dragons (Azure / Ember /
// Jade / Obsidian / Sovereign / Pearl) — NOT for Phoenix (beaked), the Astral
// Wyrm (celestialMask), or future manta / insect / avian / exotic-serpent species.
//
// HOW IT WORKS
//   parts: { head: 'draconic' } + a `headArchetype` (or explicit per-slot types)
//   on the dragon's `model`. The builder expands the archetype into a config, then
//   composes one module per slot (skull / snout / eyeZone / brow / jaw / horn /
//   rearCrest) + optional signature add-ons (whiskerFins, tuskJaw).
//
// SLEEK + CONTINUOUS. The skull → muzzle → blunt nose is ONE smooth wedge built
// from heavily-overlapping ellipsoids (length > width > height, like a real
// dragon head — not a long snake, not a ball). The jaw blends underneath; brow
// bulges sit over large forward eyes for the "intelligent" read.
//
// REAR-VIEW FIRST (the hard rule). The game is played from BEHIND, and tall mass
// over the head/aim point fails tools/readability.mjs. So every horn / ear-fin /
// crest sweeps BACK (+z) and stays low, or fans WIDE — identity lives in the rear
// SILHOUETTE (horn/ear/crest shape, head width, neck transition, rear glow).
//
// Contract: (def, model, { bodyMat, hornMat, bellyMat, scalesMat, eyeMat }) →
// { group, spineMats }. Eyes use the shared eyeMat (rig swaps its colour on
// Surge); glow accents set userData.baseEmissive/baseIntensity + ride spineMats so
// they flare on Surge. The aim marker is added by dragonModel — not here.

// ── shared helpers ──────────────────────────────────────────────────────────
function ellipsoid(mat, r, sx, sy, sz, x, y, z, segs = 10) {
  const s = seg(segs);   // detail-scaled (HIGH = the passed count, ULTRA rounder)
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, s, Math.round(s * 0.7)), mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  return m;
}
function accentMat(color, intensity) {
  const m = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: intensity,
    roughness: 0.34, metalness: 0.45, side: THREE.DoubleSide,
  });
  m.userData.baseEmissive = color;
  m.userData.baseIntensity = intensity;
  return m;
}
// A back-raked horn/blade: a cone (points +y) raked toward +z (BACK) and splayed
// out, so it lengthens the rear silhouette without towering over the aim point.
function rakedHorn(mat, { baseR, len, x, y, z, rake, splay, segments = 6, flatZ = 1 }) {
  const horn = new THREE.Mesh(new THREE.ConeGeometry(baseR, len, seg(segments)), mat);
  horn.userData.isHorn = true;   // so the studio head/face framing can exclude the towering horns (they centre the fit high and shrink the face)
  if (flatZ !== 1) horn.scale.z = flatZ;
  horn.position.set(x, y, z);
  horn.rotation.x = rake;     // +rake → tip sweeps BACK (+z), low
  horn.rotation.z = splay;    // fan out to the side
  return horn;
}

// ── SMOOTH WEDGE SKULL (AZURE bespoke) ───────────────────────────────────────
// ONE continuous lofted shell — nape → braincase → brow → snout → nose tip — so the
// head reads as a single tapered falcon wedge, NOT a stack of overlapping ellipsoids
// that seam into "plates" at a small head scale (gate r3). It builds the WHOLE head
// shell (cranium+snout+jaw as one skin), so the snout/jaw modules are skipped. Sets
// the same c.faceZ/faceR/hx/hy/hz/snoutTipZ contract the eye/brow/crest align to.
function buildSmoothWedgeSkull(c) {
  const m = c.mats.bodyMat;
  const sc = c.cfg.snoutScale ?? 1;
  // [z, halfWidth, halfHeight, yCentre] — length ≫ width ≥ height (a lean raptor skull);
  // a sleek braincase (not a ball) tapering smoothly to the nose. The front stretches
  // with snoutScale. Sampled with a smooth Catmull-Rom so no ring seam reads as a plate.
  // A KEEN raptor wedge (gate r6): WIDER-than-tall braincase + a low crown + a brow SHELF
  // (a ring wider than the eye zone right behind it) so the head is not a smooth egg-blob —
  // the brow overhangs the eyes and the skull tapers hard to the snout. Head LENGTH (nape→
  // nose z-run) is unchanged, so head:body / eye:head bands hold.
  const st = [
    [ 0.50, 0.10, 0.11, 0.02],                 // nape cap
    [ 0.30, 0.31, 0.29, 0.03],
    [ 0.04, 0.39, 0.33, 0.04],                 // braincase — wider than tall (skull, not ball)
    [-0.24, 0.41, 0.29, 0.01],                 // BROW SHELF — widest ring, low crown → a brow line over the eyes
    [-0.58, 0.32, 0.23, -0.05],                // eye zone — narrower + lower (the socket cheek)
    [-0.95 * sc, 0.24, 0.185, -0.07],          // snout base
    [-1.35 * sc, 0.16, 0.135, -0.10],          // mid muzzle
    [-1.70 * sc, 0.11, 0.093, -0.115],         // nose
    [-1.86 * sc, 0.072, 0.062, -0.12],         // BLUNT nose (built INTO the shell — one connected component)
    [-1.94 * sc, 0.012, 0.012, -0.122],        // CAP the tip near-closed (gate r9 dir 5: an open last ring read as a drilled tube from the front) — keeps a keen wedge, no aperture
  ];
  // Smooth 1-D Catmull-Rom sampler over the (z, w, h, yc) control profile.
  const catmull = (p0, p1, p2, p3, t) => {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  };
  const SUB = 3;                                        // rings interpolated between each pair → smooth loft (Catmull-Rom stays smooth; SUB 3 keeps the apex under the 6000-tri ceiling)
  const rings = [];
  for (let s = 0; s < st.length - 1; s++) {
    const a = st[Math.max(0, s - 1)], b = st[s], cc = st[s + 1], d = st[Math.min(st.length - 1, s + 2)];
    for (let u = 0; u < SUB; u++) {
      const t = u / SUB;
      rings.push([catmull(a[0], b[0], cc[0], d[0], t), catmull(a[1], b[1], cc[1], d[1], t), catmull(a[2], b[2], cc[2], d[2], t), catmull(a[3], b[3], cc[3], d[3], t)]);
    }
  }
  rings.push(st[st.length - 1]);
  const M = seg(16);
  const verts = [], idx = [];
  for (const [z, w, h, yc] of rings) {
    for (let k = 0; k < M; k++) {
      const a = (k / M) * Math.PI * 2;
      const cs = Math.cos(a), sn = Math.sin(a);
      // Smooth C1 cross-section: a clean ellipse gently keeled up top and eased flat
      // on the belly by a SMOOTH weight (no piecewise seam — the seam is what banded
      // the belly). w2 = 1 at the crown, → 0.9 at the keel line, blended by sn.
      const keel = 1 + 0.06 * sn;                        // >1 above equator, <1 below — C1 continuous
      const yy = yc + h * sn * keel;
      verts.push(w * cs, yy, z);
    }
  }
  for (let s = 0; s < rings.length - 1; s++) for (let k = 0; k < M; k++) {
    const a = s * M + k, b = s * M + (k + 1) % M, cc = (s + 1) * M + k, d = (s + 1) * M + (k + 1) % M;
    idx.push(a, cc, b, b, cc, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const shellMat = m.clone(); shellMat.side = THREE.DoubleSide;   // robust to loft winding
  const shell = new THREE.Mesh(g, shellMat);
  c.head.add(shell);
  // The blunt loft tip IS the nose (gate r6 dir 2: the separate nose meshes — the pad ellipsoid
  // AND the low-poly nostril spheres — read as a detached diamond in the silhouette; ALL removed,
  // so the head is exactly ONE connected component).
  // publish the align contract (eye/brow/crest read these)
  c.hx = 0.5; c.hy = 0.5; c.hz = 0.62;
  c.faceZ = -0.42; c.faceR = 0.42;               // the eye/brow anchor sits at the brow front
  c.snoutTipZ = -1.9 * sc;
}

// ── SMOOTH FORGE SKULL (EMBER bespoke) ───────────────────────────────────────
// The ember analogue of the azure smooth wedge: ONE lofted shell (nape→braincase→brow→
// blunt muzzle) so the small apex head reads as a single forge-broad mass, NOT the
// ellipsoid PLATE-STACK that shingled into pancakes at headScale 0.56 (gate cp2 r2 dir 4).
// Broader + blunter than the falcon wedge, with a heavy brow. Value TIERS are vertex-
// painted onto the one shell (crown = body, muzzle = a darker step, jaw underside = cream)
// so the head carries law-11 relief with zero seams. Builds the whole head skin → the
// snout/jaw modules are skipped (oneShell). Sets the same c.faceZ/faceR/hx-hy-hz contract.
function buildSmoothForgeSkull(c) {
  const sc = c.cfg.snoutScale ?? 1;
  const st = [
    [ 0.55, 0.12, 0.13,  0.02],                  // nape cap
    [ 0.32, 0.36, 0.33,  0.03],
    [ 0.05, 0.46, 0.40,  0.04],                  // BROAD braincase (forge head, wider than the falcon)
    [-0.22, 0.48, 0.36,  0.02],                  // HEAVY brow shelf — widest ring, overhangs the eyes
    [-0.52, 0.40, 0.28, -0.06],                  // eye / cheek zone
    [-0.85 * sc, 0.30, 0.22, -0.09],             // blunt snout base
    [-1.12 * sc, 0.22, 0.17, -0.12],             // muzzle
    [-1.34 * sc, 0.15, 0.12, -0.14],             // BLUNT nose
    [-1.46 * sc, 0.06, 0.05, -0.145],            // nose tip built into the shell
    [-1.52 * sc, 0.012, 0.012, -0.147],          // cap near-closed
  ];
  const catmull = (p0, p1, p2, p3, t) => {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  };
  const SUB = 3, rings = [];
  for (let s = 0; s < st.length - 1; s++) {
    const a = st[Math.max(0, s - 1)], b = st[s], cc = st[s + 1], d = st[Math.min(st.length - 1, s + 2)];
    for (let u = 0; u < SUB; u++) { const t = u / SUB;
      rings.push([catmull(a[0], b[0], cc[0], d[0], t), catmull(a[1], b[1], cc[1], d[1], t), catmull(a[2], b[2], cc[2], d[2], t), catmull(a[3], b[3], cc[3], d[3], t)]); }
  }
  rings.push(st[st.length - 1]);
  // value-tier vertex paint: body crown, a darker muzzle step, a cream jaw underside.
  const bodyC = c.mats.bodyMat.color.clone();
  const snoutC = bodyC.clone().multiplyScalar(0.86);            // one WARM value step darker over the muzzle (0.78 read muddy-gray, dir 3)
  const jawC = c.mats.bellyMat.color.clone();                  // cream jaw underside (dir 3: the underjaw must read cream, not a gray smudge)
  const M = seg(16), verts = [], cols = [], idx = [];
  for (const [z, w, h, yc] of rings) {
    for (let k = 0; k < M; k++) {
      const a = (k / M) * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a);
      const keel = 1 + 0.06 * sn, yy = yc + h * sn * keel;
      verts.push(w * cs, yy, z);
      let col = bodyC;
      if (z < -0.7 * sc) col = snoutC;                          // muzzle darker tier
      if (z < -0.42 * sc && sn < -0.1) col = jawC;              // lower muzzle / jaw underside = cream (wider band so the mouth reads cream, dir 3)
      cols.push(col.r, col.g, col.b);
    }
  }
  for (let s = 0; s < rings.length - 1; s++) for (let k = 0; k < M; k++) {
    const a = s * M + k, b = s * M + (k + 1) % M, cc = (s + 1) * M + k, d = (s + 1) * M + (k + 1) % M;
    idx.push(a, cc, b, b, cc, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const shellMat = c.mats.bodyMat.clone();
  shellMat.side = THREE.DoubleSide; shellMat.vertexColors = true; shellMat.color.set(0xffffff);
  c.head.add(new THREE.Mesh(g, shellMat));
  c.hx = 0.48; c.hy = 0.40; c.hz = 0.55;
  c.faceZ = -0.42; c.faceR = 0.42;
  c.snoutTipZ = -1.55 * sc;
}

// KOI / eastern-serpent head — ONE lofted Catmull shell (the smoothForgeSkull pattern,
// L165), shaped SLIM + ELONGATED for jade: a rounded braincase → a defined BROW ridge
// over the eyes → a soft stop → a full but tapering snout to a rounded nose. No ellipsoid
// stack, no bead-chain — a sleek river-dragon head instead of a caterpillar blob.
function buildKoiSkull(c) {
  const sc = c.cfg.snoutScale ?? 1;
  const st = [
    [ 0.60, 0.09, 0.10,  0.00],   // nape cap → flows into the neck
    [ 0.36, 0.28, 0.30,  0.02],   // nape blend
    [ 0.10, 0.37, 0.41,  0.05],   // rounded braincase (taller than wide — slim)
    [-0.12, 0.40, 0.45,  0.08],   // BROW shelf — widest+tallest, overhangs the eyes (eastern brow)
    [-0.34, 0.36, 0.35, -0.01],   // eye zone — dips after the brow (the "stop")
    [-0.58, 0.34, 0.30, -0.05],   // cheek
    [-0.84 * sc, 0.32, 0.28, -0.08],   // snout base (full/broad — koi)
    [-1.12 * sc, 0.28, 0.25, -0.11],   // muzzle
    [-1.38 * sc, 0.24, 0.22, -0.13],   // pre-nose (broad rounded)
    [-1.56 * sc, 0.17, 0.16, -0.15],   // rounded nose
    [-1.66 * sc, 0.08, 0.08, -0.155],  // nose pad
    [-1.72 * sc, 0.02, 0.02, -0.156],  // cap near-closed
  ];
  const catmull = (p0, p1, p2, p3, t) => {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  };
  const SUB = 2, rings = [];
  for (let s = 0; s < st.length - 1; s++) {
    const a = st[Math.max(0, s - 1)], b = st[s], cc = st[s + 1], d = st[Math.min(st.length - 1, s + 2)];
    for (let u = 0; u < SUB; u++) { const t = u / SUB;
      rings.push([catmull(a[0], b[0], cc[0], d[0], t), catmull(a[1], b[1], cc[1], d[1], t), catmull(a[2], b[2], cc[2], d[2], t), catmull(a[3], b[3], cc[3], d[3], t)]); }
  }
  rings.push(st[st.length - 1]);
  const crownC = c.mats.bodyMat.color.clone().multiplyScalar(1.6);   // LIFT the head dorsal out of near-black into the mid-jade family (gate rework dir 8)
  const bodyC = c.mats.bodyMat.color.clone();
  const snoutC = bodyC.clone().multiplyScalar(0.7);            // a darker value step over the muzzle (law 11 tier)
  const jawC = c.mats.bellyMat.color.clone();                  // pale mint jaw underside
  const M = seg(14), verts = [], cols = [], idx = [], col = new THREE.Color();
  for (const [z, w, h, yc] of rings) {
    for (let k = 0; k < M; k++) {
      const a = (k / M) * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a);
      const keel = 1 + 0.05 * sn, yy = yc + h * sn * keel;
      verts.push(w * cs, yy, z);
      col.copy(bodyC);
      if (sn > 0) col.lerp(crownC, sn * 0.75);                 // dorsal crown lift (the sunlit top reads mid-jade, not black)
      if (z < -0.72 * sc) col.copy(snoutC);                    // muzzle darker tier
      if (z < -0.42 * sc && sn < -0.12) col.copy(jawC);        // jaw underside = pale mint
      cols.push(col.r, col.g, col.b);
    }
  }
  for (let s = 0; s < rings.length - 1; s++) for (let k = 0; k < M; k++) {
    const a = s * M + k, b = s * M + (k + 1) % M, cc = (s + 1) * M + k, d = (s + 1) * M + (k + 1) % M;
    idx.push(a, cc, b, b, cc, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const shellMat = c.mats.bodyMat.clone();
  shellMat.side = THREE.DoubleSide; shellMat.vertexColors = true; shellMat.color.set(0xffffff);
  c.head.add(new THREE.Mesh(g, shellMat));
  c.hx = 0.38; c.hy = 0.36; c.hz = 0.52;
  c.faceZ = -0.30; c.faceR = 0.38;
  c.snoutTipZ = -1.75 * sc;
}

// ── SKULL ─────────────────────────────────────────────────────────────────── // one clean rounded cranium (length > width > height); the cone muzzle continues it
const R = 0.62;               // base cranium radius (before headScale)
// Per-skull proportions [width, height, length scale] + brow bulge + cheek bevel.
const SKULL_DIMS = {
  roundWedgeSkull:    { csx: 0.98, csy: 0.86, csz: 1.04, brow: 1.0,  cheek: 0.0 },  // rounded, friendly, catlike
  nobleWedgeSkull:    { csx: 0.96, csy: 0.92, csz: 1.1,  brow: 1.3,  cheek: 0.18 }, // taller, armored cheeks, regal
  predatorWedgeSkull: { csx: 0.94, csy: 0.8,  csz: 1.14, brow: 0.85, cheek: 0.0 },  // flatter + longer, aggressive; cheek balls OFF (gate cp2 dir 4 — they tangented the jaw into a shingle stack). ember-only archetype
  falconWedgeSkull:    { csx: 0.82, csy: 0.78, csz: 1.26, brow: 0.6,  cheek: 0.0 },  // lean keen wedge, NO cheek balls (azure)
};
function buildSkull(c) {
  const d = c.dim, m = c.mats.bodyMat;
  // headStretch / headNarrow (additive, default 1 → byte-identical): elongate + narrow
  // the cranium into a slim wedge instead of a round ball — the eastern-serpent read
  // (jade, gate r3 dir 5: "blob-pile" → a sleek tapered head).
  const csz = d.csz * (c.model.headStretch ?? 1);
  const csx = d.csx * (c.model.headNarrow ?? 1);
  // ONE smooth rounded cranium — slightly elongated. Keeping the core to a few,
  // well-matched forms (cranium + cone muzzle + jaw) is what reads as a sleek
  // wedge instead of a lumpy ball-chain.
  c.head.add(ellipsoid(m, R, csx, d.csy, csz, 0, 0, R * 0.14, 14));
  c.faceZ = R * 0.14 - R * csz;              // front of the cranium (muzzle anchor)
  c.faceR = R * csx;                          // half-width there
  c.hx = R * csx; c.hy = R * d.csy; c.hz = R * csz;
  // Subtle brow ridge bulges over the eyes — the intelligent read (low + small).
  if (d.brow > 0) for (const s of [-1, 1]) {
    c.head.add(ellipsoid(m, R * 0.24 * d.brow, 1.0, 0.62, 1.15, s * c.faceR * 0.5, c.hy * 0.34, c.faceZ + c.faceR * 0.34, 8));
  }
  // Armored cheeks (noble/predator) — a touch of structure low on the jawline.
  if (d.cheek > 0) for (const s of [-1, 1]) {
    c.head.add(ellipsoid(m, R * 0.42, 0.7 + d.cheek, 0.78, 1.0, s * c.faceR * 0.78, -c.hy * 0.2, c.faceZ + c.faceR * 0.4, 8));
  }
}

// ── SNOUT ─────────────────────────────────────────────────────────────────── // a clean tapered CONE muzzle with a blunt rounded nose — the sleek read
function snoutBase(c, { len, baseW, noseW, drop }) {
  // snoutTone (opt-in, EMBER apex — gate cp2 dir 2): a muzzle one value-step darker than the
  // body so the head carries 2–3 tiers (law 11) instead of reading as ONE flat orange sticker.
  const m = c.cfg.snoutTone
    ? (() => { const mm = c.mats.bodyMat.clone(); mm.vertexColors = false; mm.color.set(c.cfg.snoutTone); return mm; })()
    : c.mats.bodyMat;
  // A FRUSTUM muzzle (truncated cone): wide base blends into the cranium, tapering
  // to a BLUNT (non-zero) nose — the clean way to read a short blunt snout. Capped
  // with a small rounded nose pad. After rotation.x = -PI/2 the cone's wide end
  // (radiusBottom) faces +z (cranium) and the narrow end (radiusTop) faces -z.
  const baseR = c.faceR * baseW, noseR = c.faceR * noseW;
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(noseR, baseR, len, seg(16), 1), m);
  muzzle.rotation.x = -Math.PI / 2;
  muzzle.scale.set(1.0, 1.0, 0.82);            // flatten the vertical a touch (wider than tall)
  const baseZ = c.hz * 0.1;                     // base seats inside the cranium
  muzzle.position.set(0, -drop, baseZ - len * 0.5);
  c.head.add(muzzle);
  const noseZ = baseZ - len;
  c.head.add(ellipsoid(m, noseR, 1.04, 0.84, 0.86, 0, -drop, noseZ + noseR * 0.2, 8));
  for (const s of [-1, 1]) {
    const n = new THREE.Mesh(new THREE.SphereGeometry(noseR * 0.32, seg(6), seg(5)), c.mats.hornMat);
    n.position.set(s * noseR * 0.42, -drop, noseZ);
    c.head.add(n);
  }
  c.snoutTipZ = noseZ - noseR * 0.5;
}
function shortBluntSnout(c)      { snoutBase(c, { len: 1.0 * c.cfg.snoutScale,  baseW: 0.82, noseW: 0.4,  drop: c.hy * 0.16 }); }
function mediumBluntSnout(c)     { snoutBase(c, { len: 1.28 * c.cfg.snoutScale, baseW: 0.76, noseW: 0.34, drop: c.hy * 0.18 }); }
function taperedPredatorSnout(c) { snoutBase(c, { len: 1.5 * c.cfg.snoutScale,  baseW: 0.68, noseW: 0.24, drop: c.hy * 0.2 }); }

// ── JAW ───────────────────────────────────────────────────────────────────── // a smooth lower jaw blended under the muzzle (never a box)
function jaw(c, { len, wid, drop, sharp }) {
  // keenEye (azure): a SLIM, DARK jaw blended into the wedge (body-toned, smaller,
  // tucked higher) — not a big bright belly ball that reads as a separate lump.
  const keen = c.cfg.keenEye;
  const m = keen ? c.mats.bodyMat : c.mats.bellyMat;
  const jr = c.faceR * (keen ? 0.62 : 0.8), jw = wid * (keen ? 0.82 : 1), jd = drop * (keen ? 0.62 : 1);
  const z = c.snoutTipZ * 0.46;
  c.head.add(ellipsoid(m, jr, jw, 0.4, len, 0, -c.hy * jd, z, 10));
  if (sharp) c.head.add(ellipsoid(m, c.faceR * 0.28, 0.8, 0.55, 1.2, 0, -c.hy * drop - 0.02, z - c.faceR * 0.8 * len * 0.7, 7));
}
function compactSmoothJaw(c)   { jaw(c, { len: 1.0,  wid: 0.82, drop: 0.36, sharp: false }); }
function angularPredatorJaw(c) { jaw(c, { len: 1.1,  wid: 0.6,  drop: 0.3,  sharp: false }); }   // ember-only; sharp chin plate OFF + tucked (gate cp2 dir 4 — the extra chin ellipsoid stacked as a shingle)
function refinedNobleJaw(c)    { jaw(c, { len: 1.06, wid: 0.78, drop: 0.38, sharp: false }); }

// ── EYE ZONE ──────────────────────────────────────────────────────────────── // large forward eyes set under the brow — the intelligent/expressive read
function eyeZone(c, { r, x, y, z, glow }) {
  // Eye-SHAPE dial (§6): eyeShape 1 = almond/feline (the draconic default, taller +
  // tilted), 0 = round + low-set (the cute hatchling read). Interpolated so a line
  // can move round→keen across its forms without a second eye builder.
  const es = c.cfg.eyeShape;
  const rb = 1 + (1 - es) * 0.55;         // round hatchling eyes are BIGGER (cute), keen apex eyes smaller
  const rr = r * rb;
  const sx = 0.92 + (1 - es) * 0.12;      // rounder = a touch wider
  const sy = 0.86 + es * 0.32;            // almond = taller
  const tiltY = 0.30 * es, tiltZ = 0.34 * es;
  const yset = y - (1 - es) * rr * 0.35;   // round eyes sit LOWER; es=1 keeps the shipped position (byte-identical)

  // KEEN-EYE treatment (opt-in via model.keenEye — AZURE). A BRIGHT almond iris lens
  // (def.eye, the brightest facial point §4) with a thin dark sclera rim + small dark
  // pupil, seated PROUD on the wide cheek (clear of the long muzzle) so it reads on the
  // small head. Default OFF → obsidian/pearl/solar keep the original eye byte-identical.
  if (c.cfg.keenEye) {
    // KEEN FALCON EYE (gate r4 dir 8): a SMALL, HIGH-SET, forward almond — NOT a big
    // lateral black orb. A thin dark rim reads the socket; a BRIGHT iris fills most of it
    // (the brightest facial point, §4) and a hard white catchlight gives it life. Narrow +
    // tall + tilted = almond; seated close to the crown (not bulged out the cheek).
    // KEEN ALMOND EYE (gate r10 dir 1/2): ONE clean convex almond lens — pale-ice iris (the
    // brightest facial point) with a near-black vertical SLIT pupil (~35% area) + a single
    // catchlight, seated in a dark brow socket. No stacked spheres that pinch into an hourglass.
    // TRUE ALMOND built from a flat SHAPE (gate r11 dir 1/2/3): scaled spheres only ever made a
    // round teardrop. An almond outline has sharp front+rear CANTHUS points; a pale-ice iris in a
    // dark socket surround with a real vertical SLIT pupil and a HIGH catchlight = a falcon gaze.
    const irisMat = new THREE.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x5fb0dd, emissiveIntensity: 1.15, roughness: 0.22, side: THREE.DoubleSide });
    const irisShadeMat = new THREE.MeshStandardMaterial({ color: 0x6fb4dc, emissive: 0x2f7aa8, emissiveIntensity: 0.5, roughness: 0.3, side: THREE.DoubleSide });   // darker upper tier (same hue)
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0a1420, roughness: 0.4, side: THREE.DoubleSide });
    const socketMat = new THREE.MeshStandardMaterial({ color: 0x0e1c2c, roughness: 0.62, side: THREE.DoubleSide });
    const catchMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3.2 });
    const browMat = new THREE.MeshStandardMaterial({ color: 0x16283c, roughness: 0.66, metalness: 0.04 });
    // almond outline: sharp canthus at ±L, taut upper lid (+H), shallower lower lid (−0.8H)
    const almond = (L, H) => { const sh = new THREE.Shape();
      sh.moveTo(-L, 0); sh.quadraticCurveTo(-L * 0.1, H, L, 0); sh.quadraticCurveTo(-L * 0.1, -H * 0.8, -L, 0); return sh; };
    const R2 = rr * 2.55;                                    // ~16% head length (higher-set, keen)
    const L = R2 * 1.08, H = R2 * 0.52;                      // length 2.16 : height ~1.0 → a proper almond
    const ex = c.hx * 0.64, ey = c.hy * 0.14, ez = c.faceZ - c.faceR * 0.2;   // higher-set on the skull
    for (const s of [-1, 1]) {
      const g = new THREE.Group();
      const yaw = Math.PI - s * 0.62;
      // seat the flat almond PROUD of the curved head shell along its own facing normal (a flat
      // shape at the eye centre would be swallowed by the shell) — push out ~0.16 along the normal.
      const nx = Math.sin(yaw), nz = Math.cos(yaw), out = 0.17;
      g.position.set(s * ex + nx * out, ey + 0.02, ez + nz * out);
      g.rotation.set(0.05, yaw, s * 0.2);                    // face outward-FORWARD; rake the long axis ~12°
      const socket = new THREE.Mesh(new THREE.ShapeGeometry(almond(L * 1.3, H * 1.55), seg(6)), socketMat);
      g.add(socket);                                          // dark surround → the pale iris sits INSIDE dark
      const iris = new THREE.Mesh(new THREE.ShapeGeometry(almond(L, H), seg(6)), irisMat);
      iris.position.z = 0.014; g.add(iris);
      // ONE internal value step (gate r12 dir 4): a darker tier shading the upper third under the
      // brow overhang, same hue family — so the eye reads as a lit sphere in a socket, not a cutout.
      const irisShade = new THREE.Mesh(new THREE.ShapeGeometry(almond(L * 0.94, H * 0.9), seg(6)), irisShadeMat);
      irisShade.position.set(0, H * 0.42, 0.02); g.add(irisShade);
      // readable dark vertical SLIT pupil (gate r12 dir 2): ~50% eye height, ~15% width, seated
      // toward the forward canthus so the gaze reads ahead; proud so it survives at distance.
      const pupil = new THREE.Mesh(new THREE.PlaneGeometry(L * 0.26, H * 1.0), pupilMat);
      pupil.position.set(-L * 0.22, 0, 0.05); g.add(pupil);
      // small hard catchlight DOT inside the iris, upper-forward beside the slit (both eyes)
      const spec = new THREE.Mesh(new THREE.SphereGeometry(R2 * 0.1, seg(4), seg(3)), catchMat);
      spec.position.set(-L * 0.02, H * 0.42, 0.07); g.add(spec);
      c.head.add(g);
      // BROW ridge that OVERHANGS the eye (gate r11 dir 3): its lower edge intersects the upper lid.
      const browR = new THREE.Mesh(new THREE.BoxGeometry(R2 * 1.7, R2 * 0.32, R2 * 0.66), browMat);
      browR.position.set(s * (ex * 0.98), ey + H * 0.92, ez + R2 * 0.18);
      browR.rotation.set(0.2, s * 0.16, s * 0.4);
      c.head.add(browR);
    }
    return;
  }

  // HOT-EYE treatment (opt-in via model.hotEye — EMBER). A small, deep-set, PROUD
  // emissive eye that clears the long feralPredator muzzle so it still reads as the
  // brightest facial point (§4) despite being small. Coal sclera + a hot emissive
  // iris (def.eye, intensity ≤1.2 so the forge-collar bloom stays the ONE bloom, law
  // 12), seated in a dark socket recess and pushed proud along its outward normal.
  if (c.cfg.hotEye) {
    // REBUILT (gate cp2 dir 1): the old dark-socket + coal-sclera SPHERES read as two black
    // orbital shells (>60% head) on the young forms and a dead socket at apex. GONE. The eye
    // is now a clean, luminous LENS: a socket rim tinted 15% darker than the LOCAL body hue
    // (never black), a hot iris bead (convex so it lives in profile), a forward pupil disc and
    // a catchlight. Size + set + hue + emissive all track eyeShape (es): f0 big/round/low-set →
    // f2 small/almond/high-set (§4 growth + the §5d hot-eye read as the brightest facial point).
    // REBUILT AGAIN (gate cp2 round-2 dir 1/2/3): round 1's full body-dark sphere behind a
    // PALE high-emissive bead read as fly-goggles — a brown DONUT + a butter ping-pong ball
    // (high emissive on a light hue BLOWS to cream under ACES). Fixes: (a) the rim is only a
    // THIN UPPER-ARC brow ring (≤120°), not a full ring; (b) the iris is the whole eye, at a
    // SATURATED lava hue with MODERATE emissive so it stays orange/hot, not white; (c) the
    // eyeball is SUNK into the skull (barely proud) so no hammerhead balls; (d) a DARK FORWARD
    // pupil + white catchlight give the gaze life. The iris is the brightest facial point.
    const es = c.cfg.eyeShape;
    const headLen = c.hz * 2;                                 // front-to-back head length
    const diaFrac = 0.33 - es * 0.16;                         // f0 .33, f1 .25, f2 .17 of head length (eye:head bands; proxy in tests/starters.mjs must match)
    const irisR = Math.max(0.045, diaFrac * headLen * 0.5);
    // iris hue LIGHTENS + brightens toward apex so a small apex eye still CONTRASTS the deep
    // orange body (round 2: a same-hue 0xff8b2a apex iris vanished into the head — dead eye).
    // iris LIGHTENS hard toward apex (warm gold 0xffb040 young → near-white gold 0xffe89a apex)
    // so the SMALL keen apex eye pops as a bright spot on the deep-orange head WITHOUT a dark
    // socket patch (round-2 dark sclera read as goggle-commas); the dark forward pupil reads it.
    // hue ladder: warm gold (f0) → HOT saturated amber (f1) → bright near-white gold (f2). f1
    // must NOT wash to pale cream (round-3 dir 2) — it is the most SATURATED of the three.
    const irisCol = es < 0.5
      ? new THREE.Color(0xffa838).lerp(new THREE.Color(0xffb347), es * 2)   // f1 target 0xffb347 hot amber (gate cp2 r4 note 2 — was reading lemon-yellow)
      : new THREE.Color(0xffb347).lerp(new THREE.Color(0xffe0a0), (es - 0.5) * 2);
    const emisI = 0.5 + es * 0.3;                             // lower so the amber stays HOT amber, not blown to lemon/cream by ACES; the dark pupil + socket carry the read
    const rimCol = new THREE.Color(0x3a1508);                 // DARK brow arc (dir 4) — a legible ridge, not a body-tinted sliver
    const irisMat = new THREE.MeshStandardMaterial({ color: irisCol, emissive: irisCol, emissiveIntensity: emisI, roughness: 0.3 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x1c0a04, roughness: 0.42 });   // dark forward pupil (dir 2) — the contrast that reads the eye even when iris ≈ body hue
    const rimMat = new THREE.MeshStandardMaterial({ color: rimCol, roughness: 0.72, metalness: 0.02 });
    const catchMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.8 });
    const yEye = c.hy * (0.16 + es * 0.06);                   // low-set young → a touch higher apex, still below the brow
    const ex = c.hx * 0.66, ez = c.faceZ - c.faceR * 0.14;   // out on the cheek + forward toward the eye zone (mirrors azure's proven smooth-shell seat)
    const sYamnd = 1.0 + es * 0.45;                           // round young → taller almond apex
    for (const s of [-1, 1]) {
      const yaw = Math.PI - s * 0.5;
      const kN = new THREE.Vector3(Math.sin(yaw), 0.08, Math.cos(yaw)).normalize();
      // eyeball seated PROUD of the lofted shell — pushed a FIXED distance along the outward
      // normal (not a tiny iris-relative nudge, which buried the small apex eye INSIDE the wide
      // forge cheek → invisible). Shallow-Z lens so it never bulges into a hammerhead ball.
      const eyeC = new THREE.Vector3(s * ex, yEye, ez).addScaledVector(kN, c.faceR * 0.5 + irisR * 0.2);   // clear the WIDE forge cheek (~0.4) so the small apex eye sits proud, not buried
      // es-SCALED dark eye SOCKET (a shallow dark almond on the cheek behind the iris) — the
      // value contrast a SMALL SAME-HUE apex eye needs to read as the facial hot point. Scaled
      // by es so it's a thin lash at f0 (which already contrasts the light baby body → stays
      // cute, no goggles) and a clear dark socket at the apex (deep-orange body swallows the eye).
      // dark eye SOCKET — only on the older forms (es≥0.35). The apex/adolescent deep-orange body
      // swallows a same-hue eye, so a dark almond gives the hot iris its value contrast. f0's light
      // baby body already contrasts the hot iris, so it stays socket-FREE (the gate's best face —
      // no goggles). Co-centred with the iris so it reads as the socket the bright iris sits inside.
      if (es >= 0.35) {
        const socket = new THREE.Mesh(new THREE.SphereGeometry(irisR * (1.0 + es * 0.32), seg(9), seg(7)),
          new THREE.MeshStandardMaterial({ color: 0x2a1206, roughness: 0.6 }));
        socket.position.copy(eyeC).addScaledVector(kN, -irisR * 0.08);
        socket.scale.set(1.14, sYamnd * 1.1, 0.5);
        socket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), kN);
        c.head.add(socket);
      }
      const iris = new THREE.Mesh(new THREE.SphereGeometry(irisR, seg(13), seg(9)), irisMat);   // a touch smoother disc (gate cp2 r4 note 1 — the low-poly rim read as ragged notches)
      iris.position.copy(eyeC); iris.scale.set(1.0, sYamnd, 0.62);
      iris.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), kN);
      c.head.add(iris);
      // THIN UPPER-ARC brow ring over the top-rear of the eye (≤120°) — the socket read
      // without a full donut. A torus arc, tube ≤0.18× eye diameter, hugging the iris rim.
      const rim = new THREE.Mesh(new THREE.TorusGeometry(irisR * 0.98, irisR * 0.17, seg(5), seg(9), Math.PI * 0.7), rimMat);
      // SUNK back toward the shell (−kN) and lifted a touch so it reads as a brow RIDGE of the
      // skull overlapping the iris top, not a clip-on crescent floating in daylight (dir 4).
      rim.position.copy(eyeC).addScaledVector(kN, -irisR * 0.3).add(new THREE.Vector3(0, irisR * 0.12, 0));
      rim.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), kN);
      rim.rotateZ(Math.PI * 0.15 - s * 0.1);                 // seat the open gap at the lower-front, arc riding the top-rear
      rim.scale.y = sYamnd;
      c.head.add(rim);
      // DARK pupil — seated on the iris front, nudged slightly forward for a gaze (NOT at the
      // forward edge — round-2i's big offset slid it half off the iris into a cross-eyed read).
      const gaze = new THREE.Vector3(kN.x * 0.5, kN.y, kN.z * 0.5 - 0.5).normalize();
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(irisR * 0.34, seg(12)), pupilMat);
      pupil.position.copy(eyeC).addScaledVector(kN, irisR * 0.6).addScaledVector(gaze, irisR * 0.15);
      pupil.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), kN);
      c.head.add(pupil);
      // white catchlight — a tiny bright dot upper-forward of the pupil, so the hot eye lives.
      const spec = new THREE.Mesh(new THREE.CircleGeometry(irisR * 0.13, seg(8)), catchMat);
      spec.position.copy(eyeC).addScaledVector(kN, irisR * 0.66).add(new THREE.Vector3(-s * irisR * 0.16, irisR * 0.22, 0));
      spec.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), kN);
      c.head.add(spec);
    }
    return;
  }

  // Default eye — a single sphere in the shared eyeMat (rig swaps its colour on Surge).
  // CUTE treatment (opt-in via model.cuteEye — AZURE hatchling): a big DARK forward-facing
  // pupil + a hard catchlight turns the blank pale sclera orb into a LIVING eye (the
  // Squirtle/Charmander read: a huge eye is only cute once a dark pupil + glint give it a
  // gaze). Default OFF → obsidian/pearl/solar keep the byte-identical bare sphere.
  // cuteEye materials: the eyeball is ONE vertex-painted mesh (sclera+iris+pupil in a single
  // sphere — a mesh cannot z-fight itself), plus a tiny proud glint disc. Every layered-shell
  // approach eventually shattered: flat discs died in profile, and cap shells interpenetrate
  // through POLYHEDRAL SAG (a seg-9 cap's mid-face dips ~6% below its nominal radius, eating
  // any thin gap). Only the LIDS stay as caps — their 10–12% gaps exceed the sag.
  const cuteBallMat = c.cfg.cuteEye
    ? new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.32, metalness: 0.02,
        emissive: c.def.eyeBallEmissive ?? 0x1a3652, emissiveIntensity: 0.5 }) : null;   // soft self-light (def-overridable: azure blue default; jade greens it so the eye never reads off-palette blue)
  const cutePupilMat = c.cfg.cuteEye
    ? new THREE.MeshStandardMaterial({ color: 0x0a1622, roughness: 0.4, metalness: 0.02, side: THREE.DoubleSide }) : null;
  const cuteGlintMat = c.cfg.cuteEye
    ? new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.6, side: THREE.DoubleSide }) : null;
  for (const s of [-1, 1]) {
    // EYE ANCHOR: the ONE-SHELL smooth wedge (apex skull) SWALLOWS a flush-seated ball —
    // the r13 keen decal existed precisely because of this, seated proud on the wedge cheek.
    // The socketed ball inherits that proven proud anchor (up + forward onto the visible
    // front planes — eyes parked at the dome's silhouette edge read as specks); every other
    // skull keeps the zone anchor (the default eye keeps its shipped position byte-identical).
    const oneShellEye = c.cfg.cuteEye && (c.cfg.skullType === 'smoothWedgeSkull' || c.cfg.skullType === 'koiSkull');
    const kYaw = Math.PI - s * 0.62, kN = new THREE.Vector3(Math.sin(kYaw), 0, Math.cos(kYaw));
    const ecA = oneShellEye
      ? new THREE.Vector3(s * c.hx * 0.6, c.hy * 0.32, c.faceZ - c.faceR * 0.34)   // PROUD on the wedge cheek — the one-shell smoothWedge SWALLOWS a flush/inboard eye (L147); the head-on read is carried by the forward-converged pupil, not by moving the ball inboard
          .addScaledVector(kN, 0.15 + rr * 0.35)
      : new THREE.Vector3(s * x, yset, z);
    if (c.cfg.cuteEye) {
      // THE CUTE EYE, final architecture: ONE VERTEX-PAINTED BALL + a glint + cap lids.
      // History of the three failed layered builds (do not repeat): flat forward discs →
      // dead blank ball in profile; near-tangent full spheres → shattered star; wrapping
      // cap shells → POLYHEDRAL SAG interpenetration (a seg-9 cap's mid-face dips ~6%
      // below nominal radius, eating any thin gap). Painting sclera/iris/pupil as vertex
      // colours on the sclera sphere ITSELF is immune by construction — one mesh cannot
      // z-fight itself — and the iris paint wraps the dome, so the profile stays alive.
      const nrm = oneShellEye
        ? new THREE.Vector3(kN.x, 0.06, kN.z).normalize()          // apex: gaze along the wedge-cheek normal (the keen decal's facing)
        : new THREE.Vector3(s * 0.55, 0.06, -1).normalize();       // young forms: forward + ~29° outward so the iris wrap truly reaches the profile view (gate: 23° left the side blank)
      const geo = new THREE.SphereGeometry(rr, seg(14), seg(10));
      const pos = geo.attributes.position;
      // TWO AXES (gate fable-r4 dir 2, the change that fixes gaze everywhere). The IRIS is
      // PAINTED on the eyeball centred on the OUTWARD normal so it wraps to the PROFILE
      // (side-of-head eyes stay alive from the side). The PUPIL is a separate dark DISC on a
      // FORWARD-CONVERGED axis so both eyes hold a gaze HEAD-ON — the old single-axis pupil
      // followed the outward normal and read divergent/derpy at front (and left the apex
      // blind). Different axes → front-gaze and profile-life stop fighting.
      const irisAxis = nrm;
      // Young forms (es→0): forward + slight INWARD convergence so the pair meet the camera
      // head-on. Keen forms (es→1, blended by es² so f0/f1 barely move): the pupil swings
      // forward-OUTWARD to sit on the wedge cheek's VISIBLE face — hard inward convergence
      // hid the apex pupil behind the nose-side rim from ¾/profile (gate fable-r6: "bright
      // blank doll orb"). Forward-outward shows a dark pupil crescent at ¾ AND profile.
      const gazeAxis = new THREE.Vector3(s * (-0.06 + es * es * 0.32), 0.05, -1).normalize();
      // iris/sclera hues are def-overridable (default = azure's blue, byte-identical): a
      // green dragon (jade) sets a jade iris so the eye reads GREEN, not off-palette blue.
      const cS = new THREE.Color(c.def.eyeSclera ?? 0xbfd8ec);
      const cI = new THREE.Color(c.def.eyeIris ?? 0x4198e2).lerp(new THREE.Color(c.def.eyeIrisKeen ?? 0xbfe8ff), es * 0.9);   // keen forms brighten the iris toward the keen hue so the lateral apex eyes POP head-on
      const V = new THREE.Vector3(); const cols = []; const CT = new THREE.Color();
      const band = (ang, a, b) => Math.min(1, Math.max(0, (ang - a) / (b - a)));
      for (let i = 0; i < pos.count; i++) {
        const ang = V.fromBufferAttribute(pos, i).normalize().angleTo(irisAxis);
        CT.copy(cI).lerp(cS, band(ang, 1.15, 1.42));   // iris core → sclera rim; wide wrap keeps the profile alive
        cols.push(CT.r, CT.g, CT.b);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      const ball = new THREE.Mesh(geo, cuteBallMat);
      ball.scale.set(1.0, 0.96, 0.92);
      ball.position.copy(ecA);
      c.head.add(ball);
      // PUPIL: a crisp dark disc converged FORWARD, seated proud on the eyeball's front face
      // (edge-on and hidden in pure profile — where the iris paint carries the read instead).
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(rr * (0.44 + es * 0.1), seg(12)), cutePupilMat);   // keen forms get a BIGGER pupil so it clears the hood + reads at the apex's small eye size
      pupil.position.copy(ecA).addScaledVector(gazeAxis, rr * 0.955);
      pupil.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), gazeAxis);
      c.head.add(pupil);
      // CATCHLIGHT: a tiny disc, upper-inner of the gaze, proud of the pupil (kept SEPARATE
      // from the pupil so the pupil reads as a pupil, not a hole with a chip in it).
      const gDir = new THREE.Vector3(gazeAxis.x - s * 0.16, gazeAxis.y + 0.26, gazeAxis.z).normalize();
      const glint = new THREE.Mesh(new THREE.CircleGeometry(rr * 0.12, seg(10)), cuteGlintMat);
      glint.position.copy(ecA).addScaledVector(gDir, rr * 1.0);
      glint.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), gDir);
      c.head.add(glint);

      // SOCKET LIDS (research: an eye sits IN an orbit under an upper lid — never a naked
      // exposed ball; the lid gives the aperture its shape and the gaze its seat). Cap
      // shells are SAFE here: their 10–12% radius gaps exceed the polyhedral sag (the one
      // shell recipe that never shattered across five rounds). eyeShape drives the lid:
      // es=0 → a light high hood (round wide baby aperture); es=1 → a deep nose-ward-
      // slanted hood (the keen almond apex, hooded but READABLE). One dial-driven socket
      // for every form — the separate keen-almond decal is retired.
      const SC = new THREE.Vector3(1.0, 0.96, 0.92);
      const hood = 0.62 + es * 0.14;   // keen hood kept SHALLOW (gate fable-r5 dir 1: at es*0.34 the enlarged hood occluded the apex pupil → blind head-on). A brow LINE, not a visor.
      const upperLid = new THREE.Mesh(new THREE.SphereGeometry(rr * 1.12, seg(9), seg(3), 0, Math.PI * 2, 0, hood), c.flapMat);
      upperLid.position.copy(ecA); upperLid.scale.copy(SC);
      upperLid.rotation.set(-0.5 - es * 0.2, 0, s * es * 0.16);   // tip the hood further UP off the pupil on keen forms + a MINIMAL nose-ward roll (gate fable-r6: an asymmetric hood swallowed the left apex eye into socket-shadow while the right read bare)
      c.head.add(upperLid);
      const lowerLid = new THREE.Mesh(new THREE.SphereGeometry(rr * 1.1, seg(8), seg(2), 0, Math.PI * 2, Math.PI - (0.34 + es * 0.18), 0.34 + es * 0.18), c.flapMat);
      lowerLid.position.copy(ecA); lowerLid.scale.copy(SC);
      lowerLid.rotation.set(-0.3, 0, 0);                           // a soft lower-lid crescent closes the socket from below
      c.head.add(lowerLid);
    } else {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(rr, seg(12), seg(9)), c.mats.eyeMat);
      eye.scale.set(sx, sy, 0.82);
      eye.rotation.set(0.1, -s * tiltY, -s * tiltZ);   // almond/feline tilt (0 when round)
      eye.position.copy(ecA);
      c.head.add(eye);
    }
    if (glow) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 1.12, r * 0.14, seg(5), seg(10), Math.PI * 1.1), c.glowMat);
      rim.position.set(s * x, y + r * 0.16, z + 0.02);
      rim.rotation.set(0.1, 0, -s * 0.34 + Math.PI * 0.85);
      c.head.add(rim);
    }
  }
}
function largeSoftEyeZone(c)   { eyeZone(c, { r: 0.16 * c.cfg.eyeScale,  x: c.hx * 0.6,  y: c.hy * 0.3,  z: c.faceZ + c.faceR * 0.16, glow: c.cfg.rearGlowIntensity > 0.4 }); }
function mediumAlertEyeZone(c) { eyeZone(c, { r: 0.125 * c.cfg.eyeScale, x: c.hx * 0.64, y: c.hy * 0.34, z: c.faceZ + c.faceR * 0.12, glow: false }); }
function narrowRegalEyeZone(c) { eyeZone(c, { r: 0.105 * c.cfg.eyeScale, x: c.hx * 0.62, y: c.hy * 0.36, z: c.faceZ + c.faceR * 0.12, glow: c.cfg.rearGlowIntensity > 0.4 }); }

// ── BROW ridge (expression) ──────────────────────────────────────────────────
function brow(c, { lift, length, angle }) {
  const i = c.cfg.browIntensity;
  // browTone (opt-in, EMBER apex — gate cp2 dir 2): a matte darker brow material + a low
  // ridge SHELF spanning the eyes, so the browIntensity casts a visible value break (a lit
  // shelf shading the sockets) instead of a thin cyan-scale sliver lost on the flat skull.
  const bm = c.cfg.browTone
    ? new THREE.MeshStandardMaterial({ color: c.cfg.browTone, roughness: 0.82, metalness: 0.0 })
    : c.mats.scalesMat;
  for (const s of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.055 * (0.8 + i * 0.6), length, seg(5)), bm);
    b.scale.z = 0.4;
    b.position.set(s * c.hx * 0.5, c.hy * (0.36 + lift * 0.12), c.faceZ + c.faceR * 0.55);
    b.rotation.x = 1.45;            // lie flat over the brow
    b.rotation.z = s * angle;       // angle = expression
    c.head.add(b);
  }
  if (c.cfg.browTone) {
    // a shallow brow-ridge shelf bridging the two brows — the overhang that shades the sockets
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(c.hx * 1.15, c.hy * 0.14 * (0.8 + i * 0.5), c.faceR * 0.5), bm);
    shelf.position.set(0, c.hy * (0.34 + lift * 0.12), c.faceZ + c.faceR * 0.42);
    shelf.rotation.x = 0.32;        // tip forward so the sun catches the top plane, shadow drops onto the eyes
    c.head.add(shelf);
  }
}
function softBrow(c)       { brow(c, { lift: 0.0,  length: 0.3,  angle: -0.28 }); }  // raised-outer = friendly
function alertBrow(c)      { brow(c, { lift: 0.2,  length: 0.36, angle: 0.4 }); }    // drawn-in = predatory
function commandingBrow(c) { brow(c, { lift: 0.34, length: 0.42, angle: 0.16 }); }   // heavy, level = authority

// ── HORN / EAR (all swept back + low) ─────────────────────────────────────────
// A broad flat EAR-FIN (the Night-drake signature): a flattened triangular blade
// that sweeps back-and-OUT off the back of the skull, low, with a glowing trailing
// edge. Sweeps BACK (not up) so it never towers over the aim point (§0.5).
function earFin(c, { baseR, len, x, y, z, rake, splay, glow }) {
  const fin = new THREE.Mesh(new THREE.ConeGeometry(baseR, len, seg(5)), c.flapMat);
  fin.scale.set(1.25, 1, 0.16);            // broad + FLAT → an ear flap, not a spike
  fin.position.set(x, y, z);
  fin.rotation.x = rake;                   // rake BACK (tip → +z), low
  fin.rotation.z = splay;                  // splay OUT to the side
  c.head.add(fin);
  if (glow) {
    const edge = new THREE.Mesh(new THREE.ConeGeometry(baseR * 0.9, len * 1.06, seg(5)), c.glowMat);
    edge.scale.set(1.25, 1, 0.1);
    edge.position.set(x * 1.04, y + 0.01, z + 0.02);
    edge.rotation.x = rake; edge.rotation.z = splay;
    c.head.add(edge);
  }
}
function smallSweptBackEarFins(c) {
  const hs = c.cfg.hornScale;
  for (const s of [-1, 1]) {
    earFin(c, { baseR: 0.2 * hs, len: 0.66 * hs, x: s * c.hx * 0.52, y: c.hy * 0.5, z: c.hz * 0.5, rake: 1.16, splay: s * 0.95, glow: true });
  }
}
function longSweptBackEarFins(c) {
  const hs = c.cfg.hornScale;
  for (const s of [-1, 1]) {
    earFin(c, { baseR: 0.22 * hs, len: 0.84 * hs, x: s * c.hx * 0.5, y: c.hy * 0.48, z: c.hz * 0.48, rake: 1.1, splay: s * 0.95, glow: true });
    earFin(c, { baseR: 0.12 * hs, len: 0.5 * hs, x: s * c.hx * 0.4, y: c.hy * 0.62, z: c.hz * 0.66, rake: 1.0, splay: s * 0.7, glow: false });
  }
}
function smoothDualHorns(c) {
  const hs = c.cfg.hornScale;
  for (const s of [-1, 1]) {
    c.head.add(rakedHorn(c.mats.hornMat, {
      baseR: 0.12 * hs, len: 0.76 * hs, x: s * c.hx * 0.46, y: c.hy * 0.54, z: c.hz * 0.42,
      rake: 0.95, splay: s * -0.26, flatZ: 0.72,
    }));
    const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.06 * hs, 0), c.glowMat);
    tip.position.set(s * c.hx * 0.34, c.hy * 0.62, c.hz * 0.92);
    c.head.add(tip);
  }
}
function noHorn() {}   // a bare crown — for a line whose ONLY head accent is its motif (azure)
function bladeRearHorns(c) {
  const hs = c.cfg.hornScale;
  for (const s of [-1, 1]) c.head.add(rakedHorn(c.mats.hornMat, {
    baseR: 0.15 * hs, len: 0.88 * hs, x: s * c.hx * 0.5, y: c.hy * 0.46, z: c.hz * 0.46,
    rake: 1.04, splay: s * -0.4, segments: 4, flatZ: 0.26,
  }));
}
function regalCrownHorns(c) {
  // A crown that spreads WIDE to the sides (regal) rather than towering — the
  // readable way to crown a head from the rear camera.
  const hs = c.cfg.hornScale, n = 3;
  for (const s of [-1, 1]) {
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      c.head.add(rakedHorn(c.mats.hornMat, {
        baseR: 0.1 * hs, len: (0.84 - t * 0.16) * hs,
        x: s * c.hx * (0.32 + t * 0.5), y: c.hy * (0.5 - t * 0.1), z: c.hz * 0.42,
        rake: 0.95 + t * 0.1, splay: s * -(0.18 + t * 0.6), flatZ: 0.62,
      }));
    }
    const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.055 * hs, 0), c.glowMat);
    tip.position.set(s * c.hx * 0.36, c.hy * 0.66, c.hz * 0.86);
    c.head.add(tip);
  }
}

// ── REAR CREST (a back-of-head/nape glow into the neck — rear identity) ────────
function noRearCrest() {}
function rearCrest(c, { count, glow, height }) {
  // A LOW nape ridge — small, flat, back-raked finlets hugging the neck (never a
  // tall ladder), plus a soft glow band the rear camera catches.
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    const h = height * (1 - t * 0.4);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.05, h, seg(4)), c.mats.scalesMat);
    fin.scale.set(1.4, 1, 0.4);                // a wide low blade, not a spike
    fin.position.set(0, c.hy * 0.38 - t * 0.04, c.hz * (0.78 + t * 0.42));
    fin.rotation.x = 1.46;                     // nearly flat along the nape
    c.head.add(fin);
  }
  if (glow) {
    const nape = new THREE.Mesh(new THREE.SphereGeometry(R * 0.3, seg(9), seg(6)), c.glowMat);
    nape.scale.set(1.5, 0.34, 1.1);
    nape.position.set(0, c.hy * 0.3, c.hz * 0.96);
    c.head.add(nape);
  }
}
function smallRearCrest(c) { rearCrest(c, { count: 2, glow: c.cfg.rearGlowIntensity > 0.35, height: 0.2 }); }
function glowSpineCrest(c) { rearCrest(c, { count: 3, glow: true, height: 0.24 }); }
function crownRearCrest(c) { rearCrest(c, { count: 3, glow: c.cfg.rearGlowIntensity > 0.3, height: 0.28 }); }

// ── SIGNATURE ADD-ONS (preserve per-species identity) ────────────────────────
function whiskerFins(c) {                          // Jade — calm mystical: 2 CURVED tapering barbels per side
  // an S-flow barbel: roots at the snout, sweeps BACK (+z) + out (x) with a gentle
  // dip-then-flick (−y→+y), tapering to a point (tip ≤0.2× base — law 4). Two per side,
  // distinct lengths (×0.8 step), no straight parallel needles (gate r3 dir 6).
  const mkWhisker = (sx, L, baseR, spread) => {
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      pts.push(new THREE.Vector3(
        sx * spread * (0.28 + 0.72 * t),          // sweep smoothly OUT (no sin bow → no fish-hook loop)
        -0.12 * L - 0.42 * L * Math.pow(t, 1.15), // start BELOW the jaw + droop DOWN hard so it hangs under the head, never skewers through the hull (gate rework r3 dir 6)
        t * L * 0.82));                           // trail back past the jaw
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const RINGS = seg(10), RAD = seg(4), verts = [], idx = [];
    const sd = new THREE.Vector3(), ud = new THREE.Vector3();
    for (let s = 0; s <= RINGS; s++) {
      const u = s / RINGS, p = curve.getPoint(u), tan = curve.getTangent(u);
      const up = Math.abs(tan.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      sd.crossVectors(tan, up).normalize(); ud.crossVectors(sd, tan).normalize();
      const r = baseR * (1 - Math.pow(u, 0.8));
      for (let k = 0; k < RAD; k++) {
        const a = (k / RAD) * Math.PI * 2, cx = Math.cos(a), cy = Math.sin(a);
        verts.push(p.x + (sd.x * cx + ud.x * cy) * r, p.y + (sd.y * cx + ud.y * cy) * r, p.z + (sd.z * cx + ud.z * cy) * r);
      }
    }
    for (let s = 0; s < RINGS; s++) for (let k = 0; k < RAD; k++) {
      const p0 = s * RAD + k, q0 = s * RAD + (k + 1) % RAD, p1 = (s + 1) * RAD + k, q1 = (s + 1) * RAD + (k + 1) % RAD;
      idx.push(p0, p1, q0, q0, p1, q1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx); g.computeVertexNormals();
    const w = new THREE.Mesh(g, c.mats.scalesMat);
    w.position.set(sx * c.hx * 0.55, -c.hy * 0.3, c.snoutTipZ + 0.12);   // root LOW on the jaw so the barbel hangs under the head
    c.head.add(w);
  };
  for (const sx of [-1, 1]) { mkWhisker(sx, 1.0, 0.022, 0.55); mkWhisker(sx, 0.8, 0.017, 0.34); }
}
// BROW-CREST MOTIF (AZURE §5d) — a swept feather-crest fanning back off the brow,
// gold-tipped (DIFFUSE tip-paint, law-9 carrier — no emissive on the accent). The
// motif SOCKET: its anchor (above the eyes) + base hue never move across forms;
// only the blade COUNT + scale bloom (single nub → 3-blade fan). Returns the fixed
// head-local anchor + the grown bounding radius so §7 can assert invariance + bloom.
function browCrest(c) {
  const n = Math.max(1, Math.round(c.cfg.crestBlades));
  const sc = c.cfg.crestScale;
  // FIXED anchor on the crown — referenced to the CONSTANT base radius R (not the
  // per-skull dims), so it never drifts when the skull preset changes across forms
  // (§7 motif-invariance assert). Head-inner-local, independent of headScale.
  const isNub = n === 1;   // the hatchling's SINGLE-blade crest is a soft rounded nub, not a thin feeler (gate CP2 f0 dir 2)
  const seat = c.cfg.crestSeat ?? 0;   // young forms seat the blades DEEPER into the crown so thin sprouts never float (gate CP2 r2 dir 3)
  const ay = (isNub ? R * 0.5 : R * 0.62) - seat;   // seat the nub/fan rooted INTO the crown so it never floats as a wire antenna
  const ax = 0, az = R * 0.06;   // seated high on the crown so the fan clears the head outline
  const crestGoldAmt = c.cfg.crestGoldAmount ?? 1;   // young forms mute the gold tip so thin blades don't read as floating bright slivers from behind (gate CP2 r2 dir 3)
  const cGoldFull = c.def.accentHue ?? 0xd9b36a;
  // Crest blade base (gate r5 dir 10): a MID sky-blue that reads clearly LIGHTER than the
  // navy head — the round-4 crest went near-black because material.color==cBase multiplied
  // the SAME cBase vertex colour (value squared). Fix: material.color WHITE (vertex colours
  // carry the true hue, no double-darken) + a small emissive lift so it separates on a navy
  // crown. cBase kept for the featherGeo gradient's base end.
  const cBase = c.cfg.crestBase ?? c.def.crestBase ?? 0x4f74a8;   // the gate's exact ask (gate r6/r7 dir 4) — reads clearly lighter than the navy head without going toy-saturated
  const cGold = new THREE.Color(cBase).lerp(new THREE.Color(cGoldFull), crestGoldAmt).getHex();   // crestGoldAmt 1 = full gold (apex, byte-identical); <1 fades the tip toward the crest base hue
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0x1a2c40, emissiveIntensity: 0.14,   // faint lift only, so the base stays a calm 0x4f74a8, not a saturated toy-blue
    roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide, vertexColors: true,
  });
  let maxLen = 0;
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0.5;
    // Distinct per-blade LENGTH (×0.8 steps) + RAKE (gate r7 dir 4c): kill the dead parallel
    // pair. Centre-out ordering so the middle blade is longest and the outers step down ×0.8.
    const rank = Math.abs(i - (n - 1) / 2);                 // 0 = centre, grows outward
    // NUB (hatchling, n=1): short + FAT (aspect ~1.2) so it reads as a soft thumb-bump, not a
    // wire antenna. SPROUTS (adolescent, n=2): shorter + 1.5× wider so the pair reads as
    // rooted feathers, not two detached slits hovering over the crown from the nape (the
    // fable gate flagged them as "floating brow chips" twice). FAN (n≥3, the apex): the
    // approved slim swept feathers stepping down ×0.8 outward — byte-identical.
    const isSprout = n === 2;
    const len = isNub ? 0.34 * sc : (isSprout ? 0.62 : 0.78) * Math.pow(0.8, rank) * sc;
    const wid = isNub ? 0.3 * sc  : (isSprout ? 0.3 : 0.2) * Math.pow(0.86, rank) * sc;
    maxLen = Math.max(maxLen, len);
    // A slim feather blade, gold-tipped via a base→tip vertex gradient.
    const g = featherGeoLocal(len, wid);
    gradTip(g, cBase, cGold);
    const b = new THREE.Mesh(g, bladeMat);
    const spread = n > 1 ? (t - 0.5) * 0.66 : 0;            // fan (swept, not radial star), a touch wider so 3 blades read
    b.position.set(ax, ay, az);
    b.rotation.x = 0.31 + rank * 0.26;                      // distinct rakes ~18°/31°/44° (dir 4c) — the outer blades lean back further
    b.rotation.z = spread;                                   // fan spread in the X-Y plane
    b.rotation.y = spread * 0.3;
    c.head.add(b);
  }
  c.motifAnchor = { local: new THREE.Vector3(ax, ay, az), radius: maxLen };
}
// A slim crest feather that STANDS UP (length +Y, width +X, thin +Z) so a swept fan of them
// reads from the REAR (fan spread in X) AND breaks the SIDE silhouette by its height (gate r6
// dir 9 — the old flat-lying feather was edge-on from the side and aliased to 1px specks).
// Given a little Z thickness (front+back skin) so it never vanishes to a hairline.
function featherGeoLocal(len, wid) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(wid * 0.5, len * 0.34, wid * 0.14, len * 0.9);
  s.quadraticCurveTo(0, len, -wid * 0.14, len * 0.9);
  s.quadraticCurveTo(-wid * 0.5, len * 0.34, 0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: wid * 0.16, bevelEnabled: false, steps: 1 });  // thin slab (≤0.35× width) so tips read pointed, not chopstick-flat (gate r7 dir 4b)
  g.translate(0, 0, -wid * 0.08);      // centre the slab on z so it thickens both faces
  return g;                            // stands in X-Y (length +Y); real thickness in Z
}
function gradTip(geo, baseHex, tipHex) {
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const y0 = min.y, span = (max.y - min.y) || 1;   // gradient along the blade LENGTH (+Y now)
  const pos = geo.attributes.position;
  const base = new THREE.Color(baseHex), tip = new THREE.Color(tipHex), c = new THREE.Color();
  const col = [];
  for (let i = 0; i < pos.count; i++) {
    const tt = (pos.getY(i) - y0) / span;
    c.copy(base).lerp(tip, tt > 0.9 ? (tt - 0.9) / 0.1 : 0);   // gold ONLY the outer 10% so it never floods a blade face from the nape (gate r10 dir 4)
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
}

function tuskJaw(c) {                               // Solar / Sovereign
  for (const s of [-1, 1]) {
    const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.36, seg(5)), c.mats.hornMat);
    tusk.position.set(s * c.hx * 0.42, -c.hy * 0.42, c.faceZ - 0.1);
    tusk.rotation.x = -0.5; tusk.rotation.z = s * 0.18;
    c.head.add(tusk);
  }
}

// ── module registry + archetypes ─────────────────────────────────────────────
const SKULLS = { roundWedgeSkull: buildSkull, nobleWedgeSkull: buildSkull, predatorWedgeSkull: buildSkull, falconWedgeSkull: buildSkull, smoothWedgeSkull: buildSmoothWedgeSkull, smoothForgeSkull: buildSmoothForgeSkull, koiSkull: buildKoiSkull };
const ONE_SHELL_SKULLS = new Set(['smoothWedgeSkull', 'smoothForgeSkull', 'koiSkull']);   // whole-head lofts → skip the separate snout/jaw modules
const SNOUTS = { shortBluntSnout, mediumBluntSnout, taperedPredatorSnout };
const EYES   = { largeSoftEyeZone, mediumAlertEyeZone, narrowRegalEyeZone };
const BROWS  = { softBrow, alertBrow, commandingBrow };
const HORNS  = { smallSweptBackEarFins, longSweptBackEarFins, smoothDualHorns, bladeRearHorns, regalCrownHorns, noHorn };
const JAWS   = { compactSmoothJaw, angularPredatorJaw, refinedNobleJaw };
const CRESTS = { noRearCrest, smallRearCrest, glowSpineCrest, crownRearCrest };

const ARCHETYPES = {
  softStealth:     { skullType: 'roundWedgeSkull',    snoutType: 'shortBluntSnout',      eyeZoneType: 'largeSoftEyeZone',   browType: 'softBrow',       hornType: 'smallSweptBackEarFins', jawType: 'compactSmoothJaw',   rearCrestType: 'smallRearCrest' },
  nobleCrowned:    { skullType: 'nobleWedgeSkull',    snoutType: 'mediumBluntSnout',     eyeZoneType: 'narrowRegalEyeZone', browType: 'commandingBrow', hornType: 'regalCrownHorns',       jawType: 'refinedNobleJaw',    rearCrestType: 'crownRearCrest' },
  elegantLuminous: { skullType: 'nobleWedgeSkull',    snoutType: 'mediumBluntSnout',     eyeZoneType: 'largeSoftEyeZone',   browType: 'softBrow',       hornType: 'smoothDualHorns',       jawType: 'refinedNobleJaw',    rearCrestType: 'glowSpineCrest' },
  feralPredator:   { skullType: 'smoothForgeSkull',   snoutType: 'taperedPredatorSnout', eyeZoneType: 'mediumAlertEyeZone', browType: 'alertBrow',      hornType: 'bladeRearHorns',        jawType: 'angularPredatorJaw', rearCrestType: 'smallRearCrest' },   // ember: ONE lofted forge shell (no ellipsoid plate-stack) — snout/jaw skipped
  ancientArcane:   { skullType: 'nobleWedgeSkull',    snoutType: 'mediumBluntSnout',     eyeZoneType: 'narrowRegalEyeZone', browType: 'commandingBrow', hornType: 'smoothDualHorns',       jawType: 'refinedNobleJaw',    rearCrestType: 'glowSpineCrest' },
};

const DEFAULTS = {
  headScale: 1.0, snoutScale: 1, hornScale: 1, eyeScale: 1, browIntensity: 1,
  rearGlowIntensity: 0.5, whiskerFins: false, tuskJaw: false,
  eyeShape: 1,          // 1 = almond (draconic default) · 0 = round (cute hatchling)
  crestBlades: 0,       // brow-crest motif blade count (0 = none) — the AZURE motif socket
  crestScale: 1,        // brow-crest bloom scale
  crestGoldAmount: 1,   // brow-crest gold tip-paint amount (young forms earn it): 0 = body-hued tips, 1 = full apex gold (default byte-identical)
  crestSeat: 0,         // additive DOWNWARD offset of the crest anchor into the crown (young forms seat it deeper so thin blades never float); default 0 = apex byte-identical
  keenEye: false,       // opt-in bright-almond proud eye (AZURE); default keeps the shared eye
  cuteEye: false,       // opt-in dark forward pupil + catchlight on the ROUND eye (AZURE hatchling); default keeps the bare sphere byte-identical
  hotEye: false,        // opt-in small PROUD emissive eye in a dark socket (EMBER feralPredator) — clears the long muzzle so the deep-set eye still reads as the brightest facial point; default keeps the bare sphere byte-identical
  snoutTone: null,      // opt-in muzzle hex one step darker than body (EMBER apex head value tier, law 11); null = muzzle stays body-toned (byte-identical)
  browTone: null,       // opt-in matte darker brow material + ridge shelf (EMBER apex value break); null = the shared thin scale brow (byte-identical)
};
const OVERRIDE_KEYS = ['skullType', 'snoutType', 'eyeZoneType', 'browType', 'hornType', 'jawType', 'rearCrestType',
  'headScale', 'snoutScale', 'hornScale', 'eyeScale', 'browIntensity', 'rearGlowIntensity', 'whiskerFins', 'tuskJaw',
  'eyeShape', 'crestBlades', 'crestScale', 'crestGoldAmount', 'crestSeat', 'keenEye', 'cuteEye', 'hotEye', 'snoutTone', 'browTone'];

function resolveConfig(model) {
  const arch = ARCHETYPES[model.headArchetype] || ARCHETYPES.softStealth;
  const cfg = { ...DEFAULTS, ...arch };
  for (const k of OVERRIDE_KEYS) if (model[k] !== undefined) cfg[k] = model[k];
  return cfg;
}

function buildDraconicHead(def, model, mats) {
  const cfg = resolveConfig(model);
  const outer = new THREE.Group();           // the rig rotates this
  const head = new THREE.Group();            // inner content, scaled per-species
  head.scale.setScalar(cfg.headScale);
  outer.add(head);
  const spineMats = [];

  const F = model.formLevel ?? 0;
  const giM = Math.min(model.glowIntensity ?? 1, 1.3);
  const cAccent = def.apexSeam ?? def.eye ?? def.wingEmissive;
  const glowMat = accentMat(cAccent, (0.5 + cfg.rearGlowIntensity * 1.6 + F * 0.25) * giM);
  spineMats.push(glowMat);

  // Double-sided clone of the body material for flat flaps (ear-fins) so they read
  // from both the showcase front and the rear gameplay camera.
  const flapMat = mats.bodyMat.clone();
  flapMat.side = THREE.DoubleSide;

  const dim = SKULL_DIMS[cfg.skullType] || SKULL_DIMS.roundWedgeSkull;
  const ctx = { head, def, model, cfg, mats, F, giM, glowMat, flapMat, dim };

  // Skull first — it publishes c.faceZ / c.faceR / c.hx-hy-hz that the rest align to.
  (SKULLS[cfg.skullType] || buildSkull)(ctx);
  // The smooth-wedge shell IS the whole head skin (cranium+snout+jaw as one loft), so
  // the separate snout/jaw modules are skipped for it.
  const oneShell = ONE_SHELL_SKULLS.has(cfg.skullType);
  if (!oneShell) {
    (SNOUTS[cfg.snoutType] || shortBluntSnout)(ctx);
    (JAWS[cfg.jawType] || compactSmoothJaw)(ctx);
  }
  (EYES[cfg.eyeZoneType] || largeSoftEyeZone)(ctx);
  // cuteEye's socket LIDS are the brow (gate: the old brow cones floated as detached chips
  // over the skull from the nape) — the separate brow module only runs for the default eye.
  if (!cfg.cuteEye) (BROWS[cfg.browType] || softBrow)(ctx);
  (HORNS[cfg.hornType] || smallSweptBackEarFins)(ctx);
  (CRESTS[cfg.rearCrestType] || smallRearCrest)(ctx);
  if (cfg.whiskerFins) whiskerFins(ctx);
  if (cfg.tuskJaw) tuskJaw(ctx);
  if (cfg.crestBlades > 0) browCrest(ctx);

  // Publish the SKULL length (snout tip → rear of cranium, EXCLUDING the crest/fins)
  // × headScale, so the §7 head:body / eye:head asserts read the true head length,
  // not a crest-inflated bbox (§6.4: asserts read published handles, not spelunking).
  const craniumBack = R * 0.14 + (ctx.hz ?? R);
  const headLength = (craniumBack - (ctx.snoutTipZ ?? -R)) * cfg.headScale;

  return { group: outer, spineMats, motifAnchor: ctx.motifAnchor ?? null, headLength };
}

registerHead('draconic', buildDraconicHead);
