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
const matStrut = new THREE.MeshStandardMaterial({ color: 0x322f6c, roughness: 0.45, metalness: 0.4, emissive: 0x141233, emissiveIntensity: 0.25 });   // dark blue-violet structural strut (was bright cyan) — bones read as structure, not glow
const matSpine = fresnelRim(new THREE.MeshStandardMaterial({ color: 0x4fd6ff, roughness: 0.28, metalness: 0.45, emissive: 0x17a8da, emissiveIntensity: 1.7, side: THREE.DoubleSide }), 0xbff2ff, 2.3, 1.2);   // bright cyan dorsal follow-line
const matSpar = fresnelRim(new THREE.MeshStandardMaterial({ color: 0x32306f, roughness: 0.42, metalness: 0.4, emissive: 0x141233, emissiveIntensity: 0.25 }), 0x6a78d8, 3.0, 0.4);   // dark blue-violet structural bone (hue ~242°, near membrane) — was pale-white glowing; matches the reference where bones are dark and only lightning glows
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
  Dr: (ny) => 0.050 + 0.070 * gauss(ny, 0.33, 0.16) + 0.050 * gauss(ny, 0.60, 0.13),   // dorsal depth — slimmed (was 0.110/0.065): the back was too deep dorso-centrally vs the side reference
  Be: (ny) => 0.030 + 0.120 * gauss(ny, 0.32, 0.085) + 0.060 * gauss(ny, 0.62, 0.10),  // deep CHEST -> tucked ABDOMEN (the gap) -> rounded HIPS
  Mu: (ny) => 0.070 * gauss(ny, 0.26, 0.095) + 0.032 * gauss(ny, 0.60, 0.11),          // back-muscle humps (trimmed with the slimmer ridge so they flank, not trough, the spine)
  Cr: (ny) => 0.034 * gauss(ny, 0.25, 0.10) + 0.012 * gauss(ny, 0.60, 0.11),            // central spine CREST — keeps the centerline the apex over the (now smaller) muscle bands so no groove down the spine
  wBoost: (ny) => 1 + 0.35 * gauss(ny, 0.25, 0.09),                                     // deltoid breadth (rear width stays our trace; fullness is depth)
  cz: (ny) => 0,   // centerline straight for now — the old neck-forward lift dipped the upper back into a concavity; a real neck bend comes with the head
  neckTaper: (ny, ss) => 1,   // no depth taper: the back stays full (dorsal edge ~0.75–0.82) right to the clip so the dorsal TOPLINE runs continuous into the neck; the neck's deep elliptical base fills the whole socket instead (tapering the dorsal here would curl the back inward → a slope kink at the junction)
};
// keeled muscled dorsal profile at lateral u∈[−1,1] (z toward camera): central spine ridge + paired muscle humps + a
// narrow crest at u=0 (Cr) so the centerline stays the apex — without it the humps trough the spine at the withers.
const dorsalZ = (u, Dr, Mu, Cr = 0) => Dr * Math.pow(Math.cos(u * Math.PI / 2), 1.4) + Mu * Math.exp(-(((Math.abs(u) - 0.5) / 0.22) ** 2)) + Cr * Math.exp(-((u / 0.18) ** 2));

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
    const W = 8, avg = (key, i) => { let a = 0, c = 0; for (let k = -W; k <= W; k++) { const j = i + k; if (j >= 0 && j < main.length) { a += main[j][key]; c++; } } return a / c; };
    const smHw = main.map((_, i) => avg('hw', i)), smCx = main.map((_, i) => avg('cx', i));   // smooth WIDTH and CENTERLINE: row-to-row width AND center wander in the trace both loft into horizontal bands
    main.forEach((s, i) => { s.hw = smHw[i]; s.cx = smCx[i]; });
  }
  const pos = [], idx = [];
  // CROSS-SECTION. Default: egg (dorsal depth ∝ width). With `sculpt`: a keeled MUSCLED creature section —
  // authored dorsal/belly depth, a central spine ridge + paired back-muscle humps, shoulder breadth, and a
  // centerline lift (cz) so the back arches and the head juts toward the camera. The reference's back, not a tube.
  const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const ring = (sp) => {
    const base = pos.length / 3;
    if (sculpt) {
      // taper the DORSO-VENTRAL DEPTH toward the top clip (the neck socket) so the flat-top opening shrinks to ~neck
      // size — the neck then seats into it continuously instead of a thin tube on a wide flat shelf. Width (hw) is
      // left alone so the shoulders stay broad on the rear cam; only the fore-aft depth narrows into the socket.
      const dt = sculpt.neckTaper ? sculpt.neckTaper(sp.y, ss) : 1;
      const ny = sp.y, hw = sp.hw * sculpt.wBoost(ny), cz = sculpt.cz(ny), Dr = sculpt.Dr(ny) * dt, Be = sculpt.Be(ny) * dt, Mu = sculpt.Mu(ny) * dt, Cr = (sculpt.Cr ? sculpt.Cr(ny) : 0) * dt;
      for (let s = 0; s < seg; s++) {
        const t = s / seg; let u, zl;
        if (t < 0.5) { u = -1 + 4 * t; zl = dorsalZ(u, Dr, Mu, Cr); }        // dorsal arc (the camera-facing back)
        else { u = 1 - 4 * (t - 0.5); zl = -Be * Math.pow(Math.cos(u * Math.PI / 2), 1.2); }   // belly arc — cos^1.2 (NOT sqrt): tangent →0 at the sides like the dorsal, so the two arcs meet SMOOTHLY at the lateral seam instead of the semicircle's vertical-tangent crease (the "straight edge" down the body)
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
  const bodyGrp = new THREE.Group(), plateGrp = new THREE.Group(), seamGrp = new THREE.Group(), wingGrp = new THREE.Group(), strutGrp = new THREE.Group(), spineGrp = new THREE.Group(), hornGrp = new THREE.Group(), spearGrp = new THREE.Group(), neckGrp = new THREE.Group(), headGrp = new THREE.Group();
  root.add(bodyGrp, plateGrp, seamGrp, wingGrp, strutGrp, spineGrp, hornGrp, spearGrp, neckGrp, headGrp);

  // BODY — the lofted (voluminous) hull stops above the tail flare; the spearhead below is built as a FLAT
  // crystalline blade so it reads sleek (the painted spear is a flat blade, not a bell). clipPoly cuts the
  // traced silhouette at a horizontal line; keepBelow picks which side.
  const TAIL_BODY_CLIP = 0.73, TAIL_SPEAR_TOP = 0.725;   // body keeps y≤0.73 (round tapering tail); spear keeps y≥0.725 — meet at the thin shaft tip with a tiny seal overlap, so the flat spearhead grows OUT of the tail end instead of a flat blade overlapping up inside the round body (the old "upper floating piece")
  const NECK_BASE = 0.235;                              // body keeps y≥0.235 at the TOP — the head/neck region (the old flat neck-cap tab) is replaced by a real arched neck + sculpted head built below
  const clipPoly = (loop, clipY, keepBelow) => {
    const inside = (p) => keepBelow ? p[1] >= clipY : p[1] <= clipY, out = [];
    for (let i = 0; i < loop.length; i++) { const A = loop[i], B = loop[(i + 1) % loop.length], Ain = inside(A), Bin = inside(B); if (Ain) out.push(A); if (Ain !== Bin) { const t = (clipY - A[1]) / (B[1] - A[1]); out.push([A[0] + (B[0] - A[0]) * t, clipY]); } }
    return out;
  };
  // body = silhouette clipped at BOTH ends: head/neck off the top (NECK_BASE), tail-flare off the bottom (TAIL_BODY_CLIP)
  const bodyLoop = clipPoly(clipPoly(D.body.silhouette, TAIL_BODY_CLIP, false), NECK_BASE, true);
  const { mesh: bodyMesh, stations } = loftBody(bodyLoop, { seg: 30, sculpt: BODY_SCULPT });
  bodyGrp.add(bodyMesh);
  // surface z at a normalized (x,y) — seat plates/spine on the ACTUAL sculpted dorsal hull (dorsalZ with the
  // body's Dr/Mu/Cr), not the old egg approximation, so the armour sits ON the back instead of floating/sinking.
  const surfZ = (p) => {
    const ny = p[1]; let best = stations[0], bd = 1e9; for (const st of stations) { const d = Math.abs(st.y - ny); if (d < bd) { bd = d; best = st; } }
    const u = best.hw ? (p[0] - best.cx) / best.hw : 0; if (Math.abs(u) >= 1) return 0;
    return dorsalZ(u, BODY_SCULPT.Dr(ny), BODY_SCULPT.Mu(ny), BODY_SCULPT.Cr ? BODY_SCULPT.Cr(ny) : 0);
  };
  // TAIL SPEAR — a continuous 3D tapering spike off the body's tail end. ROUND cross-section so it tapers to a
  // true POINT from EVERY angle (the old flat-lens blade read as a thin slab edge-on from the side, and dangled
  // off the body as a separate floating piece). matBody continues the cosmic gradient — the low-y tip goes magenta
  // on its own, so the spear stays one continuous form with the body, not a tacked-on violet blade.
  {
    const tip = 0.975, mid = (TAIL_BODY_CLIP + tip) / 2;
    const spine = [[D.mirror, TAIL_BODY_CLIP - 0.015], [D.mirror, mid], [D.mirror, tip]];   // start just inside the body end → tip
    const tail = taperedTube(spine, [0.072, 0.030, 0.004], () => 0, matBody, 12);           // base ≈ body half-width at the clip → sharp point
    if (tail) spearGrp.add(tail);
  }

  // ── NECK + HEAD ────────────────────────────────────────────────────────────
  // The body now clips at NECK_BASE; a real arched neck carries a sculpted head forward of the shoulders.
  // Reference: the side-view concept — a long graceful neck bowing up & slightly toward the dorsal (+z),
  // a sleek elongated skull (tall cranium → tapering snout, brow ridges over glowing eyes, back-swept horns,
  // a faint spiny topline continuing the spine). Built in world space (the neck leaves the canvas plane).

  // world-space tapered tube along a SAGITTAL-PLANE centerline (all pts have x=0). Cross-sections are ELLIPSES with
  // independent half-WIDTH (lateral, ±x) and half-DEPTH (in-plane, ⟂ tangent within the y–z plane) per ring, so the
  // base can be wide+shallow to seat flush into the torso's socket then round off up the nape. Analytic framing
  // (lateral always = ±x) avoids Frenet twist. `sections` = [[halfW, halfD], …] interpolated base→tip.
  function worldTube(pts, sections, material, seg = 18) {
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), steps = 48, pos = [], idx = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, p = curve.getPoint(t), T = curve.getTangent(t);
      const N = new THREE.Vector3(0, -T.z, T.y).normalize();         // in-plane normal (depth axis) ⟂ tangent in y–z
      const B = new THREE.Vector3(1, 0, 0);                          // lateral (width axis) = sagittal-plane normal
      const fi = t * (sections.length - 1), lo = Math.floor(fi), hi = Math.min(sections.length - 1, lo + 1), f = fi - lo;
      const hw = sections[lo][0] + (sections[hi][0] - sections[lo][0]) * f, hd = sections[lo][1] + (sections[hi][1] - sections[lo][1]) * f;
      for (let s = 0; s < seg; s++) { const a = s / seg * Math.PI * 2, v = p.clone().addScaledVector(B, Math.cos(a) * hw).addScaledVector(N, Math.sin(a) * hd); pos.push(v.x, v.y, v.z); }
    }
    for (let i = 0; i < steps; i++) for (let s = 0; s < seg; s++) { const a = i * seg + s, b = i * seg + (s + 1) % seg, c = (i + 1) * seg + s, d = (i + 1) * seg + (s + 1) % seg; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return new THREE.Mesh(g, material);
  }

  // NECK centerline (world): the dorsal TOPLINE must run continuous from the torso's back into the neck (the
  // reference is one back→neck→head curve). The torso's dorsal edge is ~z0.75 and ventral ~z−0.42 at the clip, so
  // the neck BASE is a DEEP ellipse filling the whole socket (dorsal edge meets 0.75, ventral meets −0.42 → no
  // shelf, no slope kink). It rises briefly continuous with the back, then sweeps FORWARD to carry the head ahead
  // of the shoulders (the position the human preferred), narrowing to a slender nape.
  const N0 = new THREE.Vector3(0, 2.55, 0.17), N1 = new THREE.Vector3(0, 3.00, 0.30), N2 = new THREE.Vector3(0, 3.40, 0.82), N3 = new THREE.Vector3(0, 3.74, 1.45);
  // [halfWidth, halfDepth] base→tip: deep ellipse (0.40×0.58) flush to the socket → round slender nape (0.25).
  neckGrp.add(worldTube([N0, N1, N2, N3], [[0.40, 0.58], [0.33, 0.42], [0.27, 0.30], [0.25, 0.25]], matBody, 20));

  // HEAD — built in a LOCAL frame (snout = +Z, dorsal = +Y, right = +X), then oriented and seated at N3 (nape).
  // FLEX: the head does NOT just follow the neck's end tangent (which still bows toward the dorsal +z); it flexes
  // DOWN at the atlas so the skull's long axis is ~level with the body's forward axis (+y) — matching the side
  // reference, where the neck arches up but the head is held forward/horizontal, not kicked skyward.
  const headDir = new THREE.Vector3(0, 1, -0.06).normalize();           // forward (+y) + a touch ventral → level, slight nose-down
  const HL = 1.40;                                                      // head length (world units)
  const cyDroop = (s) => -0.22 * s * s;                                 // muzzle centerline droops toward the tip (local −Y)
  const hwOf = (s) => 0.09 + 0.44 * Math.pow(1 - s, 0.62) + 0.13 * gauss(s, 0.26, 0.14);  // cheeks widest just ahead of the cranium, taper to a defined (not needle) snout
  const htOf = (s) => 0.09 + 0.46 * Math.pow(1 - s, 0.58);              // tall cranium → shallow snout (top half-height)
  const hbOf = (s) => 0.06 + 0.33 * Math.pow(1 - s, 0.70);             // jaw underside (bottom half-height) — egg section, flatter below
  const headLocal = [];                                                 // collect local ring centers for seating eyes/brows/horns
  {
    const RINGS = 40, SEG = 22, pos = [], idx = [];
    for (let i = 0; i <= RINGS; i++) {
      const s = i / RINGS, z = s * HL, cy = cyDroop(s), hw = hwOf(s), ht = htOf(s), hb = hbOf(s);
      headLocal.push({ s, z, cy, hw, ht, hb });
      for (let k = 0; k < SEG; k++) {
        const a = k / SEG * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        pos.push(hw * ca, cy + (sa >= 0 ? ht : hb) * sa, z);
      }
    }
    for (let i = 0; i < RINGS; i++) for (let k = 0; k < SEG; k++) { const a = i * SEG + k, b = i * SEG + (k + 1) % SEG, c = (i + 1) * SEG + k, d = (i + 1) * SEG + (k + 1) % SEG; idx.push(a, c, b, b, c, d); }
    // cap the snout tip + the cranium back (the neck tube covers the back seam)
    const tipC = pos.length / 3; pos.push(0, cyDroop(1), HL); for (let k = 0; k < SEG; k++) idx.push(tipC, RINGS * SEG + (k + 1) % SEG, RINGS * SEG + k);
    const backC = pos.length / 3; pos.push(0, 0, 0); for (let k = 0; k < SEG; k++) idx.push(backC, k, (k + 1) % SEG);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    headGrp.add(new THREE.Mesh(g, matBody));
  }
  // local→world helper for seating features on the head
  const ringAt = (s) => headLocal.reduce((a, r) => Math.abs(r.s - s) < Math.abs(a.s - s) ? r : a, headLocal[0]);
  // BROW ridges + glowing EYES at s≈0.30 (just ahead of the cranium), one per side
  for (const side of [-1, 1]) {
    const rb = ringAt(0.30);
    const brow = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), matBody);
    brow.scale.set(0.9, 0.7, 1.7); brow.position.set(side * rb.hw * 0.72, rb.cy + rb.ht * 0.34, rb.z); headGrp.add(brow);
    const re = ringAt(0.33);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), matCore);
    eye.scale.set(1.0, 1.25, 1.5); eye.position.set(side * re.hw * 0.92, re.cy + re.ht * 0.05, re.z + 0.02); headGrp.add(eye);
  }
  // back-swept HORNS off the cranium crown (local frame: up=+Y, back=−Z), tapered crystalline cones
  function localHorn(side) {
    const rc = ringAt(0.05), N = 16, R = 9, len = 1.75, r0 = 0.21, pos = [], idx = [];
    const base = new THREE.Vector3(side * rc.hw * 0.62, rc.cy + rc.ht * 0.80, rc.z);
    const up = new THREE.Vector3(side * 0.48, 0.92, -0.20).normalize();   // rise up & well outward → a broad crown V
    const curl = new THREE.Vector3(side * 0.42, -0.30, -1.55);            // sweep strongly BACK (and out) → long rear-swept horns
    // round cross-section in the plane ⟂ the horn axis, tapering to a point
    for (let i = 0; i <= N; i++) {
      const t = i / N, rad = r0 * Math.pow(1 - t, 1.6);
      const c = base.clone().addScaledVector(up, len * t).addScaledVector(curl, len * t * t * 0.7);
      const tang = up.clone().addScaledVector(curl, 2 * t * 0.7).normalize();
      const nrm = new THREE.Vector3(1, 0, 0).cross(tang).normalize(), bin = tang.clone().cross(nrm).normalize();
      for (let s = 0; s < R; s++) { const a = s / R * Math.PI * 2, v = c.clone().addScaledVector(nrm, Math.cos(a) * rad).addScaledVector(bin, Math.sin(a) * rad); pos.push(v.x, v.y, v.z); }
    }
    for (let i = 0; i < N; i++) for (let s = 0; s < R; s++) { const a = i * R + s, a2 = i * R + (s + 1) % R, b = (i + 1) * R + s, b2 = (i + 1) * R + (s + 1) % R; idx.push(a, b, a2, a2, b, b2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return new THREE.Mesh(g, matHorn);
  }
  headGrp.add(localHorn(-1), localHorn(1));
  // a few small dorsal SPIKES along the snout midline → the spiny topline the side-ref shows, continuing the spine
  for (const s of [0.12, 0.26, 0.42, 0.60]) {
    const r = ringAt(s), sp = new THREE.Mesh(new THREE.ConeGeometry(0.06 * (1 - s) + 0.02, 0.20 * (1 - s) + 0.06, 7), matHorn);
    sp.position.set(0, r.cy + r.ht + 0.04, r.z); headGrp.add(sp);   // cone points +Y (dorsal) by default
  }
  // orient + seat the head: local +Z → headDir, local +Y → dorsal (+z world), via a right-handed basis
  {
    const z = headDir.clone(), x = new THREE.Vector3(0, 0, 1).cross(z).normalize(), y = z.clone().cross(x).normalize();
    const m = new THREE.Matrix4().makeBasis(x, y, z); headGrp.quaternion.setFromRotationMatrix(m); headGrp.position.copy(N3);
    headGrp.scale.setScalar(0.66);   // the head read ~1.6× too large vs the reference (head-bulk 22% of body length vs the ref's ~14%); scale the whole head (skull+horns+eyes) down about its nape attachment to match
  }

  // PLATES — raised armour SCALES (centroid-fan domes seated on the hull) + glowing seams between them
  const plPos = [], plIdx = [];
  for (const pl of D.body.plates) {
    let cx = 0, cy = 0; for (const p of pl) { cx += p[0]; cy += p[1]; } cx /= pl.length; cy /= pl.length;
    if (cy > TAIL_BODY_CLIP) continue;                                 // tail-flare plates are replaced by the spear blade
    const base = plPos.length / 3;
    const cv = pt(cx, cy, surfZ([cx, cy]) + 0.030);                    // raised plate centre (the scale's crown) — proud enough to read as overlapping armour on the rear cam
    plPos.push(cv.x, cv.y, cv.z);
    for (const p of pl) { const v = pt(p[0], p[1], surfZ(p) + 0.004); plPos.push(v.x, v.y, v.z); }
    for (let i = 0; i < pl.length; i++) plIdx.push(base, base + 1 + i, base + 1 + (i + 1) % pl.length);
    const seam = pl.map(p => pt(p[0], p[1], surfZ(p) + 0.006)); seam.push(seam[0]);
    seamGrp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(seam), matSeam));
  }
  const plG = new THREE.BufferGeometry(); plG.setAttribute('position', new THREE.Float32BufferAttribute(plPos, 3)); plG.setIndex(plIdx); plG.computeVertexNormals();
  plateGrp.add(new THREE.Mesh(plG, matPlate));
  plateGrp.visible = true; seamGrp.visible = true;   // armour scales + glowing seams ON — re-seated on the sculpted hull (surfZ now uses the real dorsalZ), so the body reads as an armoured dragon, not a bare tube

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
    spineGrp.visible = true;   // glowing dorsal spine ridge ON — the rear-cam follow-line down the back into the spear
    console.log(`spine: ${rows.length} dorsal diamonds (rows ${Y[0].toFixed(2)}→${Y[Y.length - 1].toFixed(2)}) — hidden by default`);
  }

  // WINGS — membrane + struts, both sides. Each wing is its own pivot group at the shoulder for flapping.
  const wingPivots = [];
  const sweep = 0.16;                                   // wings angle backward (−z) with outward distance
  const WING_DORSAL = 0.10;                             // raise the wing ROOT onto the dorsolateral upper back (≈+0.56 world). The shoulder girdle rides high on the ribcage — the root belongs near the spine, not at the body's mid-depth (z=0) where it used to sit.
  const BONE_THICK = 0.012;                             // bone z-thickness (normalized); arm ×1.5 — thin, delicate struts (matches ref)
  function buildWing(mirrored) {
    const f = (c) => mirrored ? c.map(mir) : c;
    const sil = f(D.wing.silhouette);
    // shoulder = innermost point of this wing (root)
    let root0 = sil[0]; for (const p of sil) if (Math.abs(p[0] - 0.5) < Math.abs(root0[0] - 0.5)) root0 = p;
    let maxAbs = 1e-4; for (const p of sil) maxAbs = Math.max(maxAbs, Math.abs(p[0] - 0.5));
    // membrane: back-sweep with distance from spine + a billow that cups backward, peaking mid-span (0 at root/tip)
    const zWing = (p) => { const d = Math.abs(p[0] - 0.5); return -sweep * d + 0.06 * Math.sin(Math.PI * Math.min(1, d / maxAbs)) + WING_DORSAL; };   // billow cups toward the camera (+z); +WING_DORSAL lifts the whole wing onto the dorsal back
    const pivot = new THREE.Group();
    const rv = pt(root0[0], root0[1], zWing(root0)); pivot.position.copy(rv);
    const off = (mesh) => { if (mesh) { mesh.position.sub(rv); pivot.add(mesh); } };
    off(panel(sil, zWing, matMembrane));
    // BONE SHAPES (human-tagged, EXACT 2D outline + location): extruded with thickness, ends tapered to points.
    // EMBED the bones IN the membrane plane (track zWing, no forward offset) so they straddle the sheet as ribs —
    // not separate plates floating in front of it. boneSolid straddles ±thick about zBone, so the membrane cuts
    // through each bone → it reads as a rib embedded in the wing, like a real dragon/bat finger-bone.
    const zBone = (p) => zWing(p);
    (D.wing.boneShapes || []).forEach((bs, i) => off(boneSolid(f(bs), zBone, i === D.wing.boneShapes.length - 1 ? BONE_THICK * 1.5 : BONE_THICK, matSpar)));
    // thin line-struts (auto fallback only): tubes
    D.wing.struts.forEach((s, i) => off(tube(f(s), (p) => zWing(p) + 0.04, i === D.wing.sparIndex ? 0.05 : 0.028, i === D.wing.sparIndex ? matSpar : matStrut)));
    wingGrp.add(pivot); wingPivots.push({ pivot, side: mirrored ? -1 : 1, restX: pivot.rotation.x });
  }
  buildWing(false); buildWing(true);

  return {
    group: root,
    wingPivots,
    groups: { bodyGrp, plateGrp, seamGrp, wingGrp, strutGrp, spineGrp, hornGrp, spearGrp, neckGrp, headGrp },
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
