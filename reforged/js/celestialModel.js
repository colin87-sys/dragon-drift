// celestialModel.js — the ONE procedural build of the Celestial Storm dragon (geometry + materials + flap math),
// shared by the 3D previewer (tools/celestial3D.html) and the game. Returns a natural-coord (pt()) THREE.Group
// plus the wing pivots, sub-groups, materials and flap driver. NOT recentered — the caller fits/recenters.
import * as THREE from 'three';
import { CELESTIAL_DEF as D } from './celestialDef.js';
import { SPINE_DIAMOND, SPINE_DIAMONDS } from './celestialSpine.js';
import { solveWing } from './wingFlapSolver.js';

// ── canvas coords → world. Canvas 941×1672; preserve aspect (x scaled by W/H). Y flips (image y is down).
const W = D.canvas[0], H = D.canvas[1], ASPX = W / H, S = 10;
const pt = (nx, ny, nz) => new THREE.Vector3((nx - 0.5) * ASPX * S, (0.5 - ny) * S, (nz || 0) * ASPX * S);
const mir = (p) => [2 * D.mirror - p[0], p[1]];          // mirror a [x,y] across the spine axis

// ── materials ───────────────────────────────────────────────────────────────
// FRESNEL rim-glow: inject an emissive term ∝ (1 - n·v)^p into a standard material → the cosmic edge glow that
// reads in the painted reference (cheap; no post-processing, vanilla three).
function fresnelRim(mat, color, power = 2.6, strength = 0.9) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.rimColor = { value: new THREE.Color(color) }; sh.uniforms.rimPow = { value: power }; sh.uniforms.rimStr = { value: strength };
    sh.fragmentShader = 'uniform vec3 rimColor; uniform float rimPow; uniform float rimStr;\n' + sh.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n  float rim = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), rimPow);\n  totalEmissiveRadiance += rimColor * rim * rimStr;');
  };
  mat.needsUpdate = true; return mat;
}
// COSMIC body: a vertical blue→violet→magenta gradient down the spine (head bright blue, tail magenta) + a faint
// star-fleck sheen (procedural points in object space) + the fresnel rim. The painted reference's body reads as
// a galaxy gradient, not a flat colour. yHi/yLo are the head/tail object-space Y of the loft (pt(): y=(0.5-ny)*S).
function cosmicBody(mat, { cHi, cMid, cLo, yHi, yLo, rimColor, rimPow, rimStr, starStr }) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.cHi = { value: new THREE.Color(cHi) }; sh.uniforms.cMid = { value: new THREE.Color(cMid) }; sh.uniforms.cLo = { value: new THREE.Color(cLo) };
    sh.uniforms.yHi = { value: yHi }; sh.uniforms.yLo = { value: yLo };
    sh.uniforms.rimColor = { value: new THREE.Color(rimColor) }; sh.uniforms.rimPow = { value: rimPow }; sh.uniforms.rimStr = { value: rimStr }; sh.uniforms.starStr = { value: starStr };
    sh.vertexShader = 'varying vec3 vMPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vMPos = position;');
    sh.fragmentShader = 'varying vec3 vMPos;\nuniform vec3 cHi, cMid, cLo, rimColor;\nuniform float yHi, yLo, rimPow, rimStr, starStr;\nfloat h31(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }\n' + sh.fragmentShader
      .replace('#include <color_fragment>', '#include <color_fragment>\n  float gt = clamp((vMPos.y - yLo) / (yHi - yLo), 0.0, 1.0);\n  diffuseColor.rgb = gt < 0.5 ? mix(cLo, cMid, gt * 2.0) : mix(cMid, cHi, (gt - 0.5) * 2.0);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  float rim = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), rimPow);\n  totalEmissiveRadiance += rimColor * rim * rimStr;\n  vec3 cell = floor(vMPos * 15.0), ff = fract(vMPos * 15.0);\n  vec3 jit = vec3(h31(cell + 1.3), h31(cell + 2.7), h31(cell + 5.1));\n  float spark = smoothstep(0.17, 0.0, length(ff - jit)) * step(0.972, h31(cell));\n  totalEmissiveRadiance += vec3(0.8, 0.9, 1.0) * spark * starStr;');
  };
  mat.needsUpdate = true; return mat;
}
const COSMIC = { cHi: 0x3b6cff, cMid: 0x4a2a92, cLo: 0x7a1f7e, yHi: 3.8, yLo: -4.8, rimColor: 0x6ae6ff, rimPow: 3.0, rimStr: 0.7, starStr: 0.6 };   // blue→violet→magenta + cyan rim + stars
const matBody = cosmicBody(new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.55, emissive: 0x140a2e, emissiveIntensity: 0.5 }), COSMIC);
const matPlate = cosmicBody(new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0.6, emissive: 0x1c2a5e, emissiveIntensity: 0.55 }), { ...COSMIC, rimColor: 0x7fd8ff, rimStr: 0.6, starStr: 0.35 });   // armour scales share the gradient
const matSeam = new THREE.LineBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.9 });                                                  // glowing seams
const matMembrane = fresnelRim(new THREE.MeshStandardMaterial({ color: 0x2a1556, roughness: 0.6, metalness: 0.12, emissive: 0x35176a, emissiveIntensity: 0.75, side: THREE.DoubleSide, transparent: true, opacity: 0.74 }), 0x9a7bff, 2.0, 1.3);   // translucent violet, glowing edges
const matStrut = new THREE.MeshStandardMaterial({ color: 0x8fd8ff, roughness: 0.35, metalness: 0.4, emissive: 0x2a6f9e, emissiveIntensity: 1.3 });
const matSpine = fresnelRim(new THREE.MeshStandardMaterial({ color: 0x4fd6ff, roughness: 0.28, metalness: 0.45, emissive: 0x17a8da, emissiveIntensity: 1.7, side: THREE.DoubleSide }), 0xbff2ff, 2.3, 1.2);   // bright cyan dorsal follow-line
const matSpar = fresnelRim(new THREE.MeshStandardMaterial({ color: 0xd6efff, roughness: 0.3, metalness: 0.45, emissive: 0x6ab2dc, emissiveIntensity: 1.1 }), 0xffffff, 3.2, 0.7);   // pale iridescent bone
const matHorn = fresnelRim(new THREE.MeshStandardMaterial({ color: 0x2c2278, roughness: 0.38, metalness: 0.55, emissive: 0x201a58, emissiveIntensity: 0.7 }), 0x7fd8ff, 2.4, 1.15);   // dark crystalline horn, cyan edge-glow
const matSpear = fresnelRim(new THREE.MeshStandardMaterial({ color: 0x5a1fcc, roughness: 0.55, metalness: 0.1, emissive: 0x4416ac, emissiveIntensity: 0.95, side: THREE.DoubleSide }), 0x9a5cff, 2.6, 0.45);   // crystalline tail spear (saturated violet, violet rim)
const matCore = new THREE.MeshStandardMaterial({ color: 0xbff2ff, roughness: 0.3, metalness: 0.3, emissive: 0x3fc8ff, emissiveIntensity: 1.8 });   // bright cyan spear core

// ── helpers ───────────────────────────────────────────────────────────────
// polygon scanline crossings at height ny → sorted list of x
function crossings(loop, ny) {
  const xs = [];
  for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
    const a = loop[i], b = loop[j];
    if ((a[1] > ny) !== (b[1] > ny)) xs.push(a[0] + (ny - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
  }
  return xs.sort((m, n) => m - n);
}
// ── BODY SCULPT — custom anatomy authored to OUR design (smooth gaussians → no banding; width still from the
// traced silhouette). Dr/Be = dorsal/belly DEPTH (normalized z), Mu = paired back-muscle amplitude, wBoost =
// shoulder breadth, cz = centerline lift (head juts toward camera). Body ny spans ~0.12 (head) .. 0.73 (clip).
const gauss = (x, c, s) => Math.exp(-(((x - c) / s) ** 2));
const BODY_SCULPT = {
  // broader, overlapping gaussians → the torso stays SUBSTANTIAL from shoulders through the lower body (no razor
  // waist), tapering only near the tail clip. Deep chest, full haunch.
  Dr: (ny) => 0.050 + 0.110 * gauss(ny, 0.33, 0.16) + 0.065 * gauss(ny, 0.60, 0.13),   // dorsal depth
  Be: (ny) => 0.030 + 0.120 * gauss(ny, 0.32, 0.085) + 0.060 * gauss(ny, 0.62, 0.10),  // deep CHEST -> tucked ABDOMEN (the gap) -> rounded HIPS
  Mu: (ny) => 0.095 * gauss(ny, 0.26, 0.095) + 0.040 * gauss(ny, 0.60, 0.11),          // back-muscle humps (stronger)
  wBoost: (ny) => 1 + 0.35 * gauss(ny, 0.25, 0.09),                                     // deltoid breadth (rear width stays our trace; fullness is depth)
  cz: (ny) => 0,   // centerline straight for now — the old neck-forward lift dipped the upper back into a concavity; a real neck bend comes with the head
};
// keeled muscled dorsal profile at lateral u∈[−1,1] (z toward camera): central spine ridge + paired muscle humps
const dorsalZ = (u, Dr, Mu) => Dr * Math.pow(Math.cos(u * Math.PI / 2), 1.4) + Mu * Math.exp(-(((Math.abs(u) - 0.5) / 0.22) ** 2));

// LOFT a closed silhouette into a 3D fuselage. Handles MULTIPLE spans per row (scanline can return several
// segments) so the body can BRANCH — the trident tail splits into 3 prongs instead of being bridged into a
// paddle. Rings are matched between rows by centroid; an unmatched ring is a prong tip and gets capped.
function loftBody(loop, { rings = 200, seg = 16, dDorsal = 0.95, dVentral = 0.82, material = matBody, sculpt = null } = {}) {
  let minY = 1, maxY = 0; for (const p of loop) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
  let rows = []; const stations = [];
  for (let i = 0; i <= rings; i++) {
    const yy = Math.min(maxY - 1e-5, Math.max(minY + 1e-5, minY + (maxY - minY) * (i / rings)));
    const xs = crossings(loop, yy);
    const spans = [];
    for (let k = 0; k + 1 < xs.length; k += 2) { const xL = xs[k], xR = xs[k + 1]; if (xR - xL > 1e-4) spans.push({ cx: (xL + xR) / 2, hw: (xR - xL) / 2, y: yy }); }
    if (!spans.length) continue;
    rows.push(spans);
    const st = spans.reduce((a, s) => s.hw > a.hw ? s : a, spans[0]);       // widest span = main body (for surface projection)
    if (sculpt) { st.dorsalC = sculpt.Dr(st.y) + sculpt.Mu(st.y) * 0.006; st.czC = sculpt.cz(st.y); st.hwB = st.hw * sculpt.wBoost(st.y); }
    stations.push(st);
  }
  // SCULPTED body = a single tube: keep only the MOST-CENTRAL span per row (nearest the spine axis). Spurious
  // off-centre spans from notches in the traced outline would otherwise loft into capped flat SLABS poking out
  // the torso (the "square cross-sections"). Central (not widest) avoids picking a spurious wide spur at the neck.
  if (sculpt) rows = rows.map(r => [r.reduce((a, s) => Math.abs(s.cx - D.mirror) < Math.abs(a.cx - D.mirror) ? s : a, r[0])]);
  // SMOOTH the per-row main-span half-width across rows — the traced silhouette has row-to-row width noise that
  // otherwise lofts into faint horizontal bands. Moving average (in place) on the widest span of each row.
  if (sculpt) {
    const main = rows.map(r => r.reduce((a, s) => s.hw > a.hw ? s : a, r[0]));
    const sm = main.map((_, i) => { let a = 0, c = 0; for (let k = -5; k <= 5; k++) { const j = i + k; if (j >= 0 && j < main.length) { a += main[j].hw; c++; } } return a / c; });
    main.forEach((s, i) => { s.hw = sm[i]; });
  }
  const pos = [], idx = [];
  // CROSS-SECTION. Default: egg (dorsal depth ∝ width). With `sculpt`: a keeled MUSCLED creature section —
  // authored dorsal/belly depth, a central spine ridge + paired back-muscle humps, shoulder breadth, and a
  // centerline lift (cz) so the back arches and the head juts toward the camera. The reference's back, not a tube.
  const ring = (sp) => {
    const base = pos.length / 3;
    if (sculpt) {
      const ny = sp.y, hw = sp.hw * sculpt.wBoost(ny), cz = sculpt.cz(ny), Dr = sculpt.Dr(ny), Be = sculpt.Be(ny), Mu = sculpt.Mu(ny);
      for (let s = 0; s < seg; s++) {
        const t = s / seg; let u, zl;
        if (t < 0.5) { u = -1 + 4 * t; zl = dorsalZ(u, Dr, Mu); }            // dorsal arc (the camera-facing back)
        else { u = 1 - 4 * (t - 0.5); zl = -Be * Math.sqrt(Math.max(0, 1 - u * u)); }   // belly arc
        const v = pt(sp.cx + u * hw, ny, zl + cz); pos.push(v.x, v.y, v.z);
      }
    } else {
      for (let s = 0; s < seg; s++) { const a = (s / seg) * Math.PI * 2, sn = Math.sin(a); const v = pt(sp.cx + sp.hw * Math.cos(a), sp.y, (sn >= 0 ? dDorsal : dVentral) * sp.hw * sn); pos.push(v.x, v.y, v.z); }
    }
    return base;
  };
  const band = (aB, bB) => { for (let s = 0; s < seg; s++) { const a = aB + s, a2 = aB + (s + 1) % seg, b = bB + s, b2 = bB + (s + 1) % seg; idx.push(a, b, a2, a2, b, b2); } };
  const cap = (base, sp, up) => { const cz = sculpt ? sculpt.cz(sp.y) : 0; const c = pos.length / 3; const v = pt(sp.cx, sp.y, cz); pos.push(v.x, v.y, v.z); for (let s = 0; s < seg; s++) { const s2 = (s + 1) % seg; up ? idx.push(c, base + s2, base + s) : idx.push(c, base + s, base + s2); } };
  const rowRings = rows.map(spans => spans.map(sp => ({ sp, base: ring(sp) })));
  for (let r = 0; r < rowRings.length - 1; r++) {
    const A = rowRings[r], B = rowRings[r + 1], used = new Set();
    for (const b of B) { let best = A[0], bi = 0, bd = 1e9; A.forEach((a, ai) => { const d = Math.abs(a.sp.cx - b.sp.cx); if (d < bd) { bd = d; best = a; bi = ai; } }); band(best.base, b.base); used.add(bi); }
    A.forEach((a, ai) => { if (!used.has(ai)) cap(a.base, a.sp, false); });   // prong tip ends here
  }
  rowRings[0].forEach(a => cap(a.base, a.sp, true));
  rowRings[rowRings.length - 1].forEach(a => cap(a.base, a.sp, false));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return { mesh: new THREE.Mesh(g, material), stations };
}
// front-surface z of the lofted body at a normalized (x,y) — so plates/stars sit ON the hull
function bodySurfaceZ(stations, x, y) {
  let best = stations[0], bd = 1e9; for (const st of stations) { const d = Math.abs(st.y - y); if (d < bd) { bd = d; best = st; } }
  const t = (x - best.cx) / best.hw; if (Math.abs(t) >= 1) return 0;
  return 0.92 * best.hw * Math.sqrt(1 - t * t) + 0.004;   // dorsal depth matches loft (dDorsal) so plates sit on the back
}
// triangulated flat-ish panel (wing membrane) with a z-function
function panel(loop, zFn, material) {
  const v2 = loop.map(p => new THREE.Vector2(p[0], p[1]));
  const tris = THREE.ShapeUtils.triangulateShape(v2, []);
  const pos = []; for (const p of loop) { const v = pt(p[0], p[1], zFn(p)); pos.push(v.x, v.y, v.z); }
  const idx = []; for (const t of tris) idx.push(t[0], t[1], t[2]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, material);
}
// BONE SOLID: keep the EXACT 2D bone shape (its outline + location), give it thickness, and taper the thickness
// to 0 at the two ENDS (along the shape's long/PCA axis) so the tips come to points. No centerline — the
// silhouette stays exactly what we identified.
function boneSolid(loop, zFn, thick, material) {
  let cx = 0, cy = 0; for (const p of loop) { cx += p[0]; cy += p[1]; } cx /= loop.length; cy /= loop.length;
  let sxx = 0, sxy = 0, syy = 0; for (const p of loop) { const dx = p[0] - cx, dy = p[1] - cy; sxx += dx * dx; sxy += dx * dy; syy += dy * dy; }
  const th = 0.5 * Math.atan2(2 * sxy, sxx - syy), ax = Math.cos(th), ay = Math.sin(th);   // principal (long) axis
  let tmin = 1e9, tmax = -1e9; const proj = loop.map(p => { const t = (p[0] - cx) * ax + (p[1] - cy) * ay; if (t < tmin) tmin = t; if (t > tmax) tmax = t; return t; });
  const e = 0.16, taper = (t) => { const u = (t - tmin) / ((tmax - tmin) || 1); return Math.max(0, Math.min(1, Math.min(u, 1 - u) / e)); };   // 0 at ends, 1 in the middle
  const v2 = loop.map(p => new THREE.Vector2(p[0], p[1]));
  const tris = THREE.ShapeUtils.triangulateShape(v2, []);
  const n = loop.length, pos = [], idx = [];
  for (let i = 0; i < n; i++) { const p = loop[i], h = thick * taper(proj[i]); const v = pt(p[0], p[1], zFn(p) + h); pos.push(v.x, v.y, v.z); }          // top (raised)
  for (let i = 0; i < n; i++) { const p = loop[i], h = thick * taper(proj[i]) * 0.5; const v = pt(p[0], p[1], zFn(p) - h); pos.push(v.x, v.y, v.z); }    // bottom (sits toward membrane)
  for (const t of tris) idx.push(t[0], t[1], t[2]);
  for (const t of tris) idx.push(t[0] + n, t[2] + n, t[1] + n);
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(i, j, i + n, j, j + n, i + n); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, material);
}
// SLAB: extrude a closed contour into a solid raised bone (top + bottom faces + side walls)
function slab(loop, zFn, thick, material) {
  const v2 = loop.map(p => new THREE.Vector2(p[0], p[1]));
  const tris = THREE.ShapeUtils.triangulateShape(v2, []);
  const n = loop.length, pos = [], idx = [];
  for (const p of loop) { const v = pt(p[0], p[1], zFn(p) + thick); pos.push(v.x, v.y, v.z); }   // top ring
  for (const p of loop) { const v = pt(p[0], p[1], zFn(p)); pos.push(v.x, v.y, v.z); }            // bottom ring
  for (const t of tris) idx.push(t[0], t[1], t[2]);                                                // top faces
  for (const t of tris) idx.push(t[0] + n, t[2] + n, t[1] + n);                                    // bottom faces
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(i, j, i + n, j, j + n, i + n); }    // side walls
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, material);
}
// TAPERED round tube along a spine (centerline pts + per-point radius) → smooth cylindrical bone, pointed ends
function taperedTube(pts2, radii, zFn, material, seg = 8, rScale = 1) {
  if (pts2.length < 2) return null;
  const P = pts2.map(p => pt(p[0], p[1], zFn(p) + 0.045));
  const curve = new THREE.CatmullRomCurve3(P, false, 'centripetal');
  const steps = Math.max(12, pts2.length * 5);
  const fr = curve.computeFrenetFrames(steps, false);
  const R = radii.map(r => Math.max(0.003, r * S * rScale));
  const pos = [], idx = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, p = curve.getPoint(t), fi = t * (R.length - 1), lo = Math.floor(fi), hi = Math.min(R.length - 1, lo + 1);
    const r = R[lo] + (R[hi] - R[lo]) * (fi - lo), N = fr.normals[i], B = fr.binormals[i];
    for (let s = 0; s < seg; s++) { const a = s / seg * Math.PI * 2, v = p.clone().addScaledVector(N, Math.cos(a) * r).addScaledVector(B, Math.sin(a) * r); pos.push(v.x, v.y, v.z); }
  }
  for (let i = 0; i < steps; i++) for (let s = 0; s < seg; s++) { const a = i * seg + s, b = i * seg + (s + 1) % seg, c = (i + 1) * seg + s, d = (i + 1) * seg + (s + 1) % seg; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, material);
}
// tube along a polyline (struts / spar)
function tube(poly, zFn, radius, material) {
  if (poly.length < 2) return null;
  const pts = poly.map(p => pt(p[0], p[1], zFn(p)));
  const curve = new THREE.CatmullRomCurve3(pts);
  const g = new THREE.TubeGeometry(curve, Math.max(8, poly.length * 2), radius, 6, false);
  return new THREE.Mesh(g, material);
}

// ── flap math (module-level so the export's flapDrive/updateFlap can use it) ──
// FLAP — a slow, majestic soaring beat driven by the SHARED solver (research-grounded: asymmetric power/
// recovery stroke, fore-aft rowing → figure-eight tip path, feather twist). One master phase, sign-mirrored.
const TAU = Math.PI * 2;
const FLAP = { freq: 0.55, downFrac: 0.62, downDepth: 0.9, yokeElevDeg: 40, rowDeg: 14, twistDeg: 16, tipTrailDeg: 0, loadBowDeg: 0 };
// returns the whole-wing channel for one side (Phase 1 uses the yoke only — single pivot per wing)
function flapDrive(t, side) {
  const s = solveWing(t * FLAP.freq * TAU, FLAP);
  // Sagittal mirror = conjugate the rotation by reflection diag(-1,1,1): for XYZ Euler that leaves rotation.X
  // UNCHANGED and negates Y & Z. So sweep (rotation.x) is SHARED by both wings; plunge (y) + twist (z) flip by side.
  return { plunge: side * s.yoke.elev, sweep: s.yoke.sweep, twist: side * s.yoke.twist, env: s.yoke.env };
}

// ── build ─────────────────────────────────────────────────────────────────────
export function buildCelestialStorm() {
  // ── assemble ──────────────────────────────────────────────────────────────
  const root = new THREE.Group();
  const bodyGrp = new THREE.Group(), plateGrp = new THREE.Group(), seamGrp = new THREE.Group(), wingGrp = new THREE.Group(), strutGrp = new THREE.Group(), spineGrp = new THREE.Group(), hornGrp = new THREE.Group(), spearGrp = new THREE.Group();
  root.add(bodyGrp, plateGrp, seamGrp, wingGrp, strutGrp, spineGrp, hornGrp, spearGrp);

  // BODY — the lofted (voluminous) hull stops above the tail flare; the spearhead below is built as a FLAT
  // crystalline blade so it reads sleek (the painted spear is a flat blade, not a bell). clipPoly cuts the
  // traced silhouette at a horizontal line; keepBelow picks which side.
  const TAIL_BODY_CLIP = 0.73, TAIL_SPEAR_TOP = 0.70;   // body keeps y≤0.73; spear keeps y≥0.70 (small overlap seals the join)
  const clipPoly = (loop, clipY, keepBelow) => {
    const inside = (p) => keepBelow ? p[1] >= clipY : p[1] <= clipY, out = [];
    for (let i = 0; i < loop.length; i++) { const A = loop[i], B = loop[(i + 1) % loop.length], Ain = inside(A), Bin = inside(B); if (Ain) out.push(A); if (Ain !== Bin) { const t = (clipY - A[1]) / (B[1] - A[1]); out.push([A[0] + (B[0] - A[0]) * t, clipY]); } }
    return out;
  };
  const { mesh: bodyMesh, stations } = loftBody(clipPoly(D.body.silhouette, TAIL_BODY_CLIP, false), { seg: 30, sculpt: BODY_SCULPT });
  bodyGrp.add(bodyMesh);
  const surfZ = (p) => bodySurfaceZ(stations, p[0], p[1]);
  // SPEAR — LOFT the traced spearhead with a THIN lens cross-section (not a flat slab). The elliptical ring gives
  // a raised central ridge that thins to SHARP z=0 edges, and depth ∝ half-width → every prong + the tip taper to
  // a true 3D POINT (depth→0 as width→0). loftBody's branching handles the trident barbs. ~⅕ the slab thickness.
  {
    const spear = clipPoly(D.body.silhouette, TAIL_SPEAR_TOP, true);
    const { mesh: spearMesh } = loftBody(spear, { rings: 90, seg: 14, dDorsal: 0.20, dVentral: 0.20, material: matSpear });
    spearGrp.add(spearMesh);
    // glowing cyan core line riding the blade's front ridge → the bright spine the painted spear has
    let tipY = 0; for (const p of spear) if (p[1] > tipY) tipY = p[1];
    const core = [[D.mirror, TAIL_SPEAR_TOP + 0.01], [D.mirror, (TAIL_SPEAR_TOP + tipY) / 2], [D.mirror, tipY - 0.005]];
    const t = taperedTube(core, [0.004, 0.010, 0.002], () => 0.035, matCore, 7); if (t) spearGrp.add(t);
  }

  // HEAD horns — curved tapered horns sweeping up & back from each horn tip
  function curvedHorn(h, side) {
    const seat = [h[0], h[1] + 0.025];                                  // seat the base into the head crown (no float)
    const base = pt(seat[0], seat[1], surfZ(seat) + 0.05);
    const N = 12, R = 8, len = 0.9, r0 = 0.22, pos = [], idx = [];      // shorter + thicker base than before
    const up = new THREE.Vector3(side * 0.1, 1, 0.28).normalize();      // mostly up, slight forward — tighter V
    const curl = new THREE.Vector3(side * 0.34, -0.12, -1.15);          // sweep outward a touch and strongly BACK (rear-swept crown)
    for (let i = 0; i <= N; i++) {
      const t = i / N, rad = r0 * Math.pow(1 - t, 1.7);
      const c = base.clone().addScaledVector(up, len * t).addScaledVector(curl, len * t * t * 0.7);
      for (let s = 0; s < R; s++) { const a = s / R * Math.PI * 2; pos.push(c.x + Math.cos(a) * rad, c.y, c.z + Math.sin(a) * rad); }
    }
    for (let i = 0; i < N; i++) for (let s = 0; s < R; s++) { const a = i * R + s, a2 = i * R + (s + 1) % R, b = (i + 1) * R + s, b2 = (i + 1) * R + (s + 1) % R; idx.push(a, b, a2, a2, b, b2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return new THREE.Mesh(g, matHorn);
  }
  D.body.head.horns.forEach((h, i) => hornGrp.add(curvedHorn(h, h[0] < 0.5 ? -1 : 1)));

  // PLATES — raised armour SCALES (centroid-fan domes seated on the hull) + glowing seams between them
  const plPos = [], plIdx = [];
  for (const pl of D.body.plates) {
    let cx = 0, cy = 0; for (const p of pl) { cx += p[0]; cy += p[1]; } cx /= pl.length; cy /= pl.length;
    if (cy > TAIL_BODY_CLIP) continue;                                 // tail-flare plates are replaced by the spear blade
    const base = plPos.length / 3;
    const cv = pt(cx, cy, surfZ([cx, cy]) + 0.011);                    // raised plate centre (the scale's crown)
    plPos.push(cv.x, cv.y, cv.z);
    for (const p of pl) { const v = pt(p[0], p[1], surfZ(p) + 0.002); plPos.push(v.x, v.y, v.z); }
    for (let i = 0; i < pl.length; i++) plIdx.push(base, base + 1 + i, base + 1 + (i + 1) % pl.length);
    const seam = pl.map(p => pt(p[0], p[1], surfZ(p) + 0.006)); seam.push(seam[0]);
    seamGrp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(seam), matSeam));
  }
  const plG = new THREE.BufferGeometry(); plG.setAttribute('position', new THREE.Float32BufferAttribute(plPos, 3)); plG.setIndex(plIdx); plG.computeVertexNormals();
  plateGrp.add(new THREE.Mesh(plG, matPlate));
  plateGrp.visible = false; seamGrp.visible = false;   // Step 1 WIP: old flat plates off; scales re-seated on the sculpted hull in Step 2

  // DORSAL SPINE — a glowing cyan diamond stamped on each central armour ROW, sized to that row's cell so it
  // lines up cleanly on the blue armour and stands proud as the rear-cam follow-line (head crest → tail).
  // Each row of plates near the spine axis → one raised faceted rhombus (4 rim verts on the hull + a raised crown).
  {
    const cen = D.body.plates.map(pl => { let cx = 0, cy = 0, mnx = 1, mxx = 0; for (const p of pl) { cx += p[0]; cy += p[1]; if (p[0] < mnx) mnx = p[0]; if (p[0] > mxx) mxx = p[0]; } return { cx: cx / pl.length, cy: cy / pl.length, w: mxx - mnx, d: Math.abs(cx / pl.length - D.mirror) }; })
      .filter(p => p.d < 0.05).sort((a, b) => a.cy - b.cy);
    const rows = [];                                            // group plates that share a cy band into one row
    for (const p of cen) { const r = rows[rows.length - 1]; if (r && Math.abs(p.cy - r.cy0) < 0.02) { r.cys.push(p.cy); r.w = Math.max(r.w, p.w); } else rows.push({ cy0: p.cy, cys: [p.cy], w: p.w }); }
    const Y = rows.map(r => r.cys.reduce((a, b) => a + b, 0) / r.cys.length);
    const sPos = [], sIdx = [];
    for (let i = 0; i < rows.length; i++) {
      const cy = Y[i], gap = Math.min(i ? cy - Y[i - 1] : 1, i < rows.length - 1 ? Y[i + 1] - cy : 1);
      const ry = Math.min(0.62 * gap, 0.055), rx = Math.max(0.016, Math.min(0.5 * rows[i].w, 0.04));   // size from the row's cell; taper falls out of w
      const cxAxis = D.mirror, crown = 0.02 + rx * 0.5;          // stand proud of the hull (plates raise 0.011) → reads as a ridge
      // rim = the TRACED stencil diamond for this row (mapped proportionally along the artist's head→tail column),
      // unit half-extents scaled to this row's cell, centred on the spine axis
      const COL = (SPINE_DIAMONDS && SPINE_DIAMONDS.length) ? SPINE_DIAMONDS : [SPINE_DIAMOND];
      const dia = COL[Math.round(i / Math.max(1, rows.length - 1) * (COL.length - 1))] || SPINE_DIAMOND;
      const rim = dia.map(([nx, ny]) => [cxAxis + nx * rx, cy + ny * ry]);
      const base = sPos.length / 3;
      const cv = pt(cxAxis, cy, surfZ([cxAxis, cy]) + crown); sPos.push(cv.x, cv.y, cv.z);    // crown
      for (const p of rim) { const v = pt(p[0], p[1], surfZ(p) + 0.006); sPos.push(v.x, v.y, v.z); }
      for (let k = 0; k < rim.length; k++) sIdx.push(base, base + 1 + (k + 1) % rim.length, base + 1 + k);   // CCW from +z (rear cam) → faces the camera
    }
    const sG = new THREE.BufferGeometry(); sG.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3)); sG.setIndex(sIdx); sG.computeVertexNormals();
    spineGrp.add(new THREE.Mesh(sG, matSpine));
    spineGrp.visible = false;   // diamonds parked for now (toggle "spine" to bring them back)
    console.log(`spine: ${rows.length} dorsal diamonds (rows ${Y[0].toFixed(2)}→${Y[Y.length - 1].toFixed(2)}) — hidden by default`);
  }

  // WINGS — membrane + struts, both sides. Each wing is its own pivot group at the shoulder for flapping.
  const wingPivots = [];
  const sweep = 0.16;                                   // wings angle backward (−z) with outward distance
  const BONE_THICK = 0.012;                             // bone z-thickness (normalized); arm ×1.5 — thin, delicate struts (matches ref)
  function buildWing(mirrored) {
    const f = (c) => mirrored ? c.map(mir) : c;
    const sil = f(D.wing.silhouette);
    // shoulder = innermost point of this wing (root)
    let root0 = sil[0]; for (const p of sil) if (Math.abs(p[0] - 0.5) < Math.abs(root0[0] - 0.5)) root0 = p;
    let maxAbs = 1e-4; for (const p of sil) maxAbs = Math.max(maxAbs, Math.abs(p[0] - 0.5));
    // membrane: back-sweep with distance from spine + a billow that cups backward, peaking mid-span (0 at root/tip)
    const zWing = (p) => { const d = Math.abs(p[0] - 0.5); return -sweep * d + 0.06 * Math.sin(Math.PI * Math.min(1, d / maxAbs)); };   // billow cups toward the camera (+z), peaking mid-span
    const pivot = new THREE.Group();
    const rv = pt(root0[0], root0[1], zWing(root0)); pivot.position.copy(rv);
    const off = (mesh) => { if (mesh) { mesh.position.sub(rv); pivot.add(mesh); } };
    off(panel(sil, zWing, matMembrane));
    // BONE SHAPES (human-tagged, EXACT 2D outline + location): extruded with thickness, ends tapered to points.
    // Seat the bones in FRONT of the membrane's forward billow (amplitude 0.06) so the translucent violet sheet
    // never passes over a strut and tints it — every strut reads as the same pale bone colour from any angle.
    const zBone = (p) => zWing(p) + 0.08;
    (D.wing.boneShapes || []).forEach((bs, i) => off(boneSolid(f(bs), zBone, i === D.wing.boneShapes.length - 1 ? BONE_THICK * 1.5 : BONE_THICK, matSpar)));
    // thin line-struts (auto fallback only): tubes
    D.wing.struts.forEach((s, i) => off(tube(f(s), (p) => zWing(p) + 0.04, i === D.wing.sparIndex ? 0.05 : 0.028, i === D.wing.sparIndex ? matSpar : matStrut)));
    wingGrp.add(pivot); wingPivots.push({ pivot, side: mirrored ? -1 : 1, restX: pivot.rotation.x });
  }
  buildWing(false); buildWing(true);

  return {
    group: root,
    wingPivots,
    groups: { bodyGrp, plateGrp, seamGrp, wingGrp, strutGrp, spineGrp, hornGrp, spearGrp },
    materials: { matBody, matPlate, matSeam, matMembrane, matStrut, matSpine, matSpar, matHorn, matSpear, matCore },
    FLAP,
    flapDrive,
    updateFlap(t, amp = 1) {
      const d1 = this.flapDrive(t, 1);
      for (const w of this.wingPivots) {
        const d = w.side === 1 ? d1 : this.flapDrive(t, w.side);
        w.pivot.rotation.x = w.restX + d.sweep * amp; w.pivot.rotation.y = d.plunge * amp; w.pivot.rotation.z = d.twist * amp;
      }
      return d1.env;
    },
  };
}
