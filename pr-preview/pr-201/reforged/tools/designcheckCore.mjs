// designcheckCore — the measurable design-law checks behind tools/designcheck.mjs and
// tests/designgate.mjs (same split as silhouetteCore/silhouette: the CLI and the test
// suite import the SAME check functions, so what CI gates is what the tool prints).
//
// The laws, thresholds and renderer levers are documented in
// docs/DRAGON-DESIGN-SYSTEM.md §4 — THRESHOLDS below must mirror that table, and the
// doc is the only place thresholds may be changed (Gate-0 human approval).
//
// Honesty protocol (doc §1): every check returns { id, ok, value, threshold, detail }
// so a claim is always a measured number next to its bound — never a bare verdict.
// Checks ENFORCE only on dragons whose def declares a `design:` block; the shipped
// roster is grandfathered (reported informationally, never failed).
//
// Two kinds of function live here:
//   • pure measurements (profile/wing/palette data in → numbers out) — fixture-testable
//   • key-based checks (build/raster through the shared headless pipeline)

import { renderSilhouette, DRAGONS, ascendedDef, maxTierFor, THREE } from './silhouetteCore.mjs';
const { buildDragonModel } = await import('../js/dragonModel.js');
export { DRAGONS };

// ── thresholds (mirror of DRAGON-DESIGN-SYSTEM.md §4 — change THERE first) ──────
export const THRESHOLDS = {
  S1: { xorMin: 0.15 },                       // rear-apex silhouette pairwise XOR/union
  S2: { fillMax: 0.80 },                      // silhouette fill of own convex hull
  S3: { adjRatio: 1.3 },                      // adjacent mass ratio head/chest/hip
  A1: { tailTaper: 4.0 },                     // tail base:tip halfWidth
  A2: { bigHead: 0.25, smallHead: 0.125 },    // head:body — bimodal, the middle fails
  D1: { chestHip: 1.5 },                      // chest:hip section-area mass
  D2: { spanMin: 1.8, spanMax: 2.2, chordMin: 0.20, fingersMin: 3 },
  D3: { maxKinkDeg: 20, minInflections: 1, bendMin: 30, bendMax: 60 },  // spine cy law
  C1: { dominant: [48, 72], secondary: [20, 40], accent: [4, 16] },     // % area
  C2: { dLmin: 15 },                          // Lab ΔL* between adjacent palette tiers
  P1: { headYawMinDeg: 10, headYawMaxDeg: 20 },
};

export const designKeys = () => Object.keys(DRAGONS).filter((k) => DRAGONS[k].design);
export const hullKeys = () => Object.keys(DRAGONS).filter((k) => DRAGONS[k].hull && DRAGONS[k].hull.profile);

const res = (id, ok, value, threshold, detail = '') => ({ id, ok, value, threshold, detail });
const skip = (id, why) => ({ id, ok: null, value: null, threshold: null, detail: why, skipped: true });
const round = (v, d = 3) => (v == null || !Number.isFinite(v) ? v : Number(v.toFixed(d)));

// ── pure measurements (fixture-testable: data in → numbers out) ─────────────────

// Station = [z, halfWidth, keelTop, belly, cy] (dragonHullProfiles.js).
const sectionArea = (s) => s[1] * (s[2] + s[3]);

// Integrated section-area "mass" of the stations inside [z0, z1] (trapezoid rule).
export function massIn(profile, z0, z1) {
  const st = profile.stations;
  let m = 0;
  for (let i = 0; i < st.length - 1; i++) {
    const a = st[i], b = st[i + 1];
    const lo = Math.max(z0, a[0]), hi = Math.min(z1, b[0]);
    if (hi <= lo) continue;
    const t0 = (lo - a[0]) / (b[0] - a[0]), t1 = (hi - a[0]) / (b[0] - a[0]);
    const A0 = sectionArea(a) * (1 - t0) + sectionArea(b) * t0;
    const A1 = sectionArea(a) * (1 - t1) + sectionArea(b) * t1;
    m += (A0 + A1) * 0.5 * (hi - lo);
  }
  return m;
}

// A1 — tail taper: halfWidth at the tail-base anchor vs the last station.
export function tailTaper(profile, tailBaseZ) {
  const st = profile.stations;
  let base = null;
  for (let i = 0; i < st.length - 1; i++) {
    const a = st[i], b = st[i + 1];
    if (tailBaseZ >= a[0] && tailBaseZ <= b[0]) {
      const t = (tailBaseZ - a[0]) / (b[0] - a[0]);
      base = a[1] * (1 - t) + b[1] * t;
    }
  }
  const tip = st[st.length - 1][1];
  return base == null || tip <= 0 ? null : base / tip;
}

// A2 — head:body length ratio (bimodal law).
export function headRatio(profile, headBackZ) {
  const st = profile.stations;
  const z0 = st[0][0], z1 = st[st.length - 1][0];
  return (headBackZ - z0) / (z1 - z0);
}

// S3/D1 — the three masses from the declared anchor bins.
export function massBins(profile, anchors) {
  const st = profile.stations;
  const z0 = st[0][0];
  return {
    head: massIn(profile, z0, anchors.headBackZ),
    chest: massIn(profile, anchors.chestZ[0], anchors.chestZ[1]),
    hip: massIn(profile, anchors.hipZ[0], anchors.hipZ[1]),
  };
}

// D3 — spine line-of-action from the cy channel: no kinks (max segment-to-segment
// direction change), ≥1 inflection, total bend in range. Kink is measured as an
// ANGLE, not a raw Δcy — stations are unevenly spaced and a wide gap legitimately
// accumulates more lift.
export function spineLaw(profile) {
  const st = profile.stations;
  const theta = [];
  for (let i = 0; i < st.length - 1; i++) {
    theta.push(Math.atan2(st[i + 1][4] - st[i][4], st[i + 1][0] - st[i][0]));
  }
  let bendDeg = 0, inflections = 0, lastSign = 0, maxKinkDeg = 0;
  const eps = (0.5 * Math.PI) / 180;
  for (let i = 0; i < theta.length - 1; i++) {
    const d = theta[i + 1] - theta[i];
    bendDeg += Math.abs(d) * (180 / Math.PI);
    maxKinkDeg = Math.max(maxKinkDeg, Math.abs(d) * (180 / Math.PI));
    if (Math.abs(d) > eps) {
      const s = Math.sign(d);
      if (lastSign !== 0 && s !== lastSign) inflections++;
      lastSign = s;
    }
  }
  return { maxKinkDeg, inflections, bendDeg };
}

// D2 (data half) — finger count, chord depth, trailing-edge concavity of one wingForm.
export function wingLaw(wingForm) {
  const tips = wingForm.tips || [];
  const fingers = tips.length;
  const pts = [wingForm.lead, ...tips].filter(Boolean);
  const halfSpan = Math.max(...pts.map((p) => p[0]));
  const chord = Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1]));
  const chordRatio = halfSpan > 0 ? chord / halfSpan : 0;
  // Concave trailing edge: every interior tip sits BELOW the straight line between the
  // outermost and innermost tips (the edge scoops toward the body, never bulges out).
  let concave = tips.length >= 3;
  const a = tips[0], b = tips[tips.length - 1];
  for (let i = 1; i < tips.length - 1 && concave; i++) {
    const t = (tips[i][0] - a[0]) / (b[0] - a[0] || 1e-9);
    const lineY = a[1] + t * (b[1] - a[1]);
    if (tips[i][1] > lineY - 1e-3) concave = false;
  }
  return { fingers, chordRatio, concave };
}

// C2 — Lab L* of a colour (hex string '#rrggbb' or 0xrrggbb number).
export function labL(hex) {
  const n = typeof hex === 'string' ? parseInt(hex.replace('#', ''), 16) : hex;
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const r = lin(((n >> 16) & 255) / 255), g = lin(((n >> 8) & 255) / 255), b = lin((n & 255) / 255);
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const f = y > 0.008856 ? Math.cbrt(y) : (903.3 * y + 16) / 116;
  return 116 * f - 16;
}
export function paletteDeltas(paletteTiers) {
  const L = { dominant: labL(paletteTiers.dominant), secondary: labL(paletteTiers.secondary), accent: labL(paletteTiers.accent) };
  return { L, dDomSec: Math.abs(L.dominant - L.secondary), dSecAcc: Math.abs(L.secondary - L.accent) };
}

// ── raster helpers ───────────────────────────────────────────────────────────────

const RW = 320, RH = 240;
const rasterCache = new Map();
export function rearApexRaster(key) {
  if (!rasterCache.has(key)) rasterCache.set(key, renderSilhouette({ key, view: 'rear', W: RW, H: RH }));
  return rasterCache.get(key);
}

// Crop to bounds and resample to an N×N grid (bbox-normalized — scale/position drop out).
function normalized(sil, N = 128) {
  const { buf, W, bounds } = sil;
  const out = new Uint8Array(N * N);
  if (!bounds) return out;
  const bw = bounds.maxX - bounds.minX + 1, bh = bounds.maxY - bounds.minY + 1;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const sx = bounds.minX + Math.min(bw - 1, Math.floor((x / N) * bw));
    const sy = bounds.minY + Math.min(bh - 1, Math.floor((y / N) * bh));
    out[y * N + x] = buf[sy * W + sx] ? 1 : 0;
  }
  return out;
}

// S1 pair distance: XOR / union of the two bbox-normalized rear-apex silhouettes.
export function silhouetteDistance(keyA, keyB) {
  const a = normalized(rearApexRaster(keyA)), b = normalized(rearApexRaster(keyB));
  let xor = 0, union = 0;
  for (let i = 0; i < a.length; i++) { if (a[i] || b[i]) union++; if (a[i] !== b[i]) xor++; }
  return union ? xor / union : 0;
}

// S2 — silhouette fill of its own convex hull (Andrew monotone chain + shoelace).
export function negativeSpace(key) {
  const { buf, W, H } = rearApexRaster(key);
  const pts = [];
  let filled = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (buf[y * W + x]) { filled++; pts.push([x, y]); }
  if (pts.length < 3) return null;
  pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  let area = 0;
  for (let i = 0; i < hull.length; i++) { const [x0, y0] = hull[i], [x1, y1] = hull[(i + 1) % hull.length]; area += x0 * y1 - x1 * y0; }
  area = Math.abs(area) / 2;
  return area > 0 ? filled / area : null;
}

// ── key-based checks ─────────────────────────────────────────────────────────────

const profileOf = (key) => (DRAGONS[key].hull && DRAGONS[key].hull.profile) || null;
const anchorsOf = (key) => (DRAGONS[key].design && DRAGONS[key].design.anchors) || null;

export function checkS1(key) {
  const others = Object.keys(DRAGONS).filter((k) => k !== key && !DRAGONS[k].meshUrl);
  let worst = Infinity, worstKey = null;
  for (const o of others) {
    const d = silhouetteDistance(key, o);
    if (d < worst) { worst = d; worstKey = o; }
  }
  return res('S1', worst >= THRESHOLDS.S1.xorMin, round(worst), `≥ ${THRESHOLDS.S1.xorMin}`, `closest silhouette: ${worstKey}`);
}

export function checkS2(key) {
  const v = negativeSpace(key);
  if (v == null) return skip('S2', 'empty silhouette');
  return res('S2', v <= THRESHOLDS.S2.fillMax, round(v), `≤ ${THRESHOLDS.S2.fillMax}`, 'rear-apex fill of convex hull');
}

export function checkS3(key) {
  const p = profileOf(key), a = anchorsOf(key);
  if (!p) return skip('S3', 'not a hull dragon');
  if (!a) return skip('S3', 'no design.anchors declared');
  const m = massBins(p, a);
  const sorted = Object.entries(m).sort((x, y) => y[1] - x[1]);
  const r1 = sorted[0][1] / sorted[1][1], r2 = sorted[1][1] / sorted[2][1];
  const v = Math.min(r1, r2);
  return res('S3', v >= THRESHOLDS.S3.adjRatio, round(v, 2), `≥ ${THRESHOLDS.S3.adjRatio}`,
    `masses ${sorted.map(([k, x]) => `${k} ${round(x, 2)}`).join(' > ')}`);
}

export function checkD1(key) {
  const p = profileOf(key), a = anchorsOf(key);
  if (!p) return skip('D1', 'not a hull dragon');
  if (!a) return skip('D1', 'no design.anchors declared');
  const m = massBins(p, a);
  const chestLargest = m.chest >= m.head && m.chest >= m.hip;
  const v = m.hip > 0 ? m.chest / m.hip : null;
  return res('D1', chestLargest && v >= THRESHOLDS.D1.chestHip, round(v, 2), `≥ ${THRESHOLDS.D1.chestHip}`,
    chestLargest ? 'chest is the largest mass' : 'FAIL: chest is not the largest mass');
}

export function checkA1(key) {
  const p = profileOf(key), a = anchorsOf(key);
  if (!p) return skip('A1', 'not a hull dragon');
  const tailBaseZ = a ? a.tailBaseZ : 1.45;
  const v = tailTaper(p, tailBaseZ);
  if (v == null) return skip('A1', 'tailBaseZ outside station range');
  return res('A1', v >= THRESHOLDS.A1.tailTaper, round(v, 2), `≥ ${THRESHOLDS.A1.tailTaper}`, `tail base:tip halfWidth @z=${tailBaseZ}`);
}

export function checkA2(key) {
  const p = profileOf(key), a = anchorsOf(key);
  if (!p) return skip('A2', 'not a hull dragon');
  if (!a) return skip('A2', 'no design.anchors declared');
  const v = headRatio(p, a.headBackZ);
  const ok = v >= THRESHOLDS.A2.bigHead || v <= THRESHOLDS.A2.smallHead;
  return res('A2', ok, round(v), `≥ ${THRESHOLDS.A2.bigHead} or ≤ ${THRESHOLDS.A2.smallHead}`,
    ok ? (v >= THRESHOLDS.A2.bigHead ? 'big-head (cute) mode' : 'small-head (majestic) mode') : 'FAIL: the mushy middle band');
}

export function checkA3() {
  const keys = designKeys();
  const feats = keys.map((k) => [k, DRAGONS[k].design.heroFeature]);
  const missing = feats.filter(([, f]) => !f || typeof f !== 'string');
  const seen = new Map();
  const dupes = [];
  for (const [k, f] of feats) {
    if (!f) continue;
    if (seen.has(f)) dupes.push(`${k} duplicates ${seen.get(f)} ('${f}')`);
    seen.set(f, k);
  }
  const ok = missing.length === 0 && dupes.length === 0;
  return res('A3', ok, `${feats.length - missing.length}/${feats.length} declared`, 'unique heroFeature each',
    [...missing.map(([k]) => `${k}: missing`), ...dupes].join('; ') || 'all unique');
}

export function checkD2(key) {
  const def = DRAGONS[key];
  if (!def.wingForms || !def.wingForms.length) return skip('D2', 'no wingForms');
  const wf = def.wingForms[def.wingForms.length - 1];
  const w = wingLaw(wf);
  // Span:body from the built apex model bbox (the same builder the game runs).
  const built = buildDragonModel(ascendedDef(def, maxTierFor(key), 0), {});
  built.group.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(built.group).getSize(new THREE.Vector3());
  const spanRatio = size.z > 0 ? size.x / size.z : 0;
  const T = THRESHOLDS.D2;
  const ok = spanRatio >= T.spanMin && spanRatio <= T.spanMax && w.chordRatio >= T.chordMin && w.fingers >= T.fingersMin && w.concave;
  return res('D2', ok,
    `span ${round(spanRatio, 2)}× · chord ${round(w.chordRatio, 2)} · fingers ${w.fingers} · concave ${w.concave}`,
    `span ${T.spanMin}–${T.spanMax} · chord ≥ ${T.chordMin} · fingers ≥ ${T.fingersMin} · concave`, 'apex form');
}

export function checkD3(key) {
  const p = profileOf(key);
  if (!p) return skip('D3', 'not a hull dragon');
  const s = spineLaw(p);
  const T = THRESHOLDS.D3;
  const ok = s.maxKinkDeg <= T.maxKinkDeg && s.inflections >= T.minInflections && s.bendDeg >= T.bendMin && s.bendDeg <= T.bendMax;
  return res('D3', ok,
    `kink ${round(s.maxKinkDeg, 1)}° · inflections ${s.inflections} · bend ${round(s.bendDeg, 1)}°`,
    `kink ≤ ${T.maxKinkDeg}° · inflections ≥ ${T.minInflections} · bend ${T.bendMin}–${T.bendMax}°`, 'spine cy channel');
}

export function checkC1(key) {
  const def = DRAGONS[key];
  const built = buildDragonModel(ascendedDef(def, maxTierFor(key), 0), {});
  built.group.updateMatrixWorld(true);
  const areas = { dominant: 0, secondary: 0, accent: 0 };
  let tagged = 0, total = 0;
  const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  built.group.traverse((o) => {
    if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
    const tier = o.material && o.material.userData && o.material.userData.paletteTier;
    const pos = o.geometry.attributes.position, idx = o.geometry.index, mw = o.matrixWorld;
    let area = 0;
    const tri = (i0, i1, i2) => {
      v0.fromBufferAttribute(pos, i0).applyMatrix4(mw);
      v1.fromBufferAttribute(pos, i1).applyMatrix4(mw);
      v2.fromBufferAttribute(pos, i2).applyMatrix4(mw);
      area += e1.subVectors(v1, v0).cross(e2.subVectors(v2, v0)).length() / 2;
    };
    if (idx) for (let i = 0; i < idx.count; i += 3) tri(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2));
    else for (let i = 0; i < pos.count; i += 3) tri(i, i + 1, i + 2);
    total += area;
    if (tier && areas[tier] != null) { areas[tier] += area; tagged += area; }
  });
  if (tagged === 0) return res('C1', false, 'no tagged materials', '60/30/10 by area', 'builders must tag material.userData.paletteTier');
  const pct = Object.fromEntries(Object.entries(areas).map(([k, a]) => [k, (a / tagged) * 100]));
  const T = THRESHOLDS.C1;
  const ok = pct.dominant >= T.dominant[0] && pct.dominant <= T.dominant[1]
    && pct.secondary >= T.secondary[0] && pct.secondary <= T.secondary[1]
    && pct.accent >= T.accent[0] && pct.accent <= T.accent[1];
  return res('C1', ok,
    `${round(pct.dominant, 0)}/${round(pct.secondary, 0)}/${round(pct.accent, 0)}`,
    `${T.dominant.join('–')}/${T.secondary.join('–')}/${T.accent.join('–')}`,
    `tagged ${round((tagged / total) * 100, 0)}% of surface`);
}

export function checkC2(key) {
  const d = DRAGONS[key].design;
  if (!d || !d.paletteTiers) return skip('C2', 'no design.paletteTiers declared');
  const { L, dDomSec, dSecAcc } = paletteDeltas(d.paletteTiers);
  const T = THRESHOLDS.C2;
  const ok = dDomSec >= T.dLmin && dSecAcc >= T.dLmin;
  return res('C2', ok, `ΔL dom↔sec ${round(dDomSec, 1)} · sec↔acc ${round(dSecAcc, 1)}`, `both ≥ ${T.dLmin}`,
    `L* ${round(L.dominant, 0)}/${round(L.secondary, 0)}/${round(L.accent, 0)}`);
}

export function checkP1(key) {
  const pose = DRAGONS[key].model && DRAGONS[key].model.previewPose;
  if (!pose) return res('P1', false, 'no previewPose', 'model.previewPose required', 'declare { headYaw, wingFoldDelta, tailSway }');
  const deg = Math.abs((pose.headYaw || 0) * 180 / Math.PI);
  const T = THRESHOLDS.P1;
  const ok = deg >= T.headYawMinDeg && deg <= T.headYawMaxDeg;
  return res('P1', ok, `headYaw ${round(deg, 1)}°`, `${T.headYawMinDeg}–${T.headYawMaxDeg}°`,
    'declared ranges only — the mirrored-silhouette raster check lands with the headMount pose plumbing');
}

// Every check for one dragon, in law order. A3 is roster-wide, included once per key
// for table completeness (same result each time).
export function checkAll(key) {
  return [checkS1(key), checkS2(key), checkS3(key), checkA1(key), checkA2(key), checkA3(),
    checkD1(key), checkD2(key), checkD3(key), checkC1(key), checkC2(key), checkP1(key)];
}
