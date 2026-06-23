// Pure geometry core for the silhouette TRACER (tools/tracer.html). No DOM, no canvas — every function
// here takes plain arrays/typed-arrays so it can run headless (tests/tracer.mjs) AND in the browser tool.
// The tool itself (tracer.html) owns the image decode, ImageData, pointer UI and JSON download; this file
// owns the MATH: build a binary mask → trace its outline → simplify → (optionally) derive a cross-section
// ring list that maps straight onto the engine's loft format ({z, rx, ry}; see MODEL-CREATION.md §6a).

// ── 1. MASK BUILDERS ─────────────────────────────────────────────────────────
// All masks are Uint8Array(w*h), 1 = subject, 0 = background. `data` is RGBA (4 bytes/px), as from
// CanvasRenderingContext2D.getImageData().data.

// Flood-fill from a seed: every pixel reachable from (sx,sy) whose colour is within `tol` (0..255,
// max-channel distance) of the SEED colour. Use when the SUBJECT (or background) is a connected region of
// similar colour — click the thing you want (subject mode) or click empty space (then invert).
export function floodMask(data, w, h, sx, sy, tol = 32) {
  const mask = new Uint8Array(w * h);
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) return mask;
  const si = (sy * w + sx) * 4, sr = data[si], sg = data[si + 1], sb = data[si + 2];
  const close = (i) => Math.max(Math.abs(data[i] - sr), Math.abs(data[i + 1] - sg), Math.abs(data[i + 2] - sb)) <= tol;
  const stack = [sy * w + sx];
  mask[sy * w + sx] = 1;
  while (stack.length) {
    const p = stack.pop(), x = p % w, y = (p / w) | 0;
    const tryPush = (nx, ny) => {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
      const q = ny * w + nx;
      if (mask[q]) return;
      if (close(q * 4)) { mask[q] = 1; stack.push(q); }
    };
    tryPush(x - 1, y); tryPush(x + 1, y); tryPush(x, y - 1); tryPush(x, y + 1);
  }
  return mask;
}

// Subject = anything NOT connected to the image border at the seed-less background colour. We flood the
// background inward from all four corners (within `tol` of each corner's colour), then invert. Best when
// the background is a fairly uniform field and the subject doesn't touch the edge.
export function backgroundMask(data, w, h, tol = 32) {
  const bg = new Uint8Array(w * h);
  const seeds = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
  for (const [sx, sy] of seeds) {
    const si = (sy * w + sx) * 4, sr = data[si], sg = data[si + 1], sb = data[si + 2];
    const close = (i) => Math.max(Math.abs(data[i] - sr), Math.abs(data[i + 1] - sg), Math.abs(data[i + 2] - sb)) <= tol;
    const start = sy * w + sx;
    if (bg[start]) continue;
    const stack = [start]; bg[start] = 1;
    while (stack.length) {
      const p = stack.pop(), x = p % w, y = (p / w) | 0;
      const tryPush = (nx, ny) => {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
        const q = ny * w + nx;
        if (bg[q]) return;
        if (close(q * 4)) { bg[q] = 1; stack.push(q); }
      };
      tryPush(x - 1, y); tryPush(x + 1, y); tryPush(x, y - 1); tryPush(x, y + 1);
    }
  }
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) mask[i] = bg[i] ? 0 : 1;
  return mask;
}

// Subject = pixels with alpha above `thr`. The cleanest source when the upload is a cut-out PNG.
export function alphaMask(data, w, h, thr = 16) {
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = data[i * 4 + 3] > thr ? 1 : 0;
  return mask;
}

// Keep only the largest 4-connected blob (drops speckle / detached glints so the outline is one clean loop).
export function largestComponent(mask, w, h) {
  const lab = new Int32Array(w * h);   // 0 = unvisited
  let best = 0, bestSize = 0, cur = 0;
  for (let s = 0; s < mask.length; s++) {
    if (!mask[s] || lab[s]) continue;
    cur++; let size = 0;
    const stack = [s]; lab[s] = cur;
    while (stack.length) {
      const p = stack.pop(); size++;
      const x = p % w, y = (p / w) | 0;
      const tryPush = (nx, ny) => {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
        const q = ny * w + nx;
        if (mask[q] && !lab[q]) { lab[q] = cur; stack.push(q); }
      };
      tryPush(x - 1, y); tryPush(x + 1, y); tryPush(x, y - 1); tryPush(x, y + 1);
    }
    if (size > bestSize) { bestSize = size; best = cur; }
  }
  const out = new Uint8Array(w * h);
  if (best) for (let i = 0; i < out.length; i++) out[i] = lab[i] === best ? 1 : 0;
  return out;
}

// ── 2. CONTOUR ───────────────────────────────────────────────────────────────
// Moore-neighbour boundary tracing (Jacob's stopping criterion): walk the outer edge of the mask clockwise
// and return the ordered ring of pixel coords [{x,y}, …]. Assumes a single blob (run largestComponent first).
export function traceContour(mask, w, h) {
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : mask[y * w + x];
  let sx = -1, sy = -1;
  outer: for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) { sx = x; sy = y; break outer; }
  if (sx < 0) return [];
  const nb = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]];  // 8-nb, clockwise from West
  const contour = [];
  let cx = sx, cy = sy, bx = sx - 1, by = sy;   // backtrack starts West of the start pixel (known background)
  const maxIter = w * h * 8 + 64;
  let iter = 0;
  do {
    contour.push({ x: cx, y: cy });
    let start = 0;
    for (let i = 0; i < 8; i++) if (nb[i][0] === bx - cx && nb[i][1] === by - cy) { start = i; break; }
    let found = false;
    for (let k = 1; k <= 8; k++) {
      const i = (start + k) % 8, nx = cx + nb[i][0], ny = cy + nb[i][1];
      if (at(nx, ny)) {
        const pi = (start + k - 1) % 8;
        bx = cx + nb[pi][0]; by = cy + nb[pi][1];
        cx = nx; cy = ny; found = true; break;
      }
    }
    if (!found) break;   // isolated pixel
  } while ((cx !== sx || cy !== sy) && ++iter < maxIter);
  return contour;
}

// ── 3. SIMPLIFY ──────────────────────────────────────────────────────────────
// Ramer–Douglas–Peucker: thin a dense polyline to the fewest points that stay within `eps` of the original.
export function simplify(points, eps) {
  if (points.length < 3) return points.slice();
  const keep = new Uint8Array(points.length); keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  const segDist = (p, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2; t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  };
  while (stack.length) {
    const [lo, hi] = stack.pop();
    let maxD = -1, idx = -1;
    for (let i = lo + 1; i < hi; i++) { const d = segDist(points[i], points[lo], points[hi]); if (d > maxD) { maxD = d; idx = i; } }
    if (maxD > eps && idx > 0) { keep[idx] = 1; stack.push([lo, idx], [idx, hi]); }
  }
  const out = [];
  for (let i = 0; i < points.length; i++) if (keep[i]) out.push(points[i]);
  return out;
}

// Convenience: simplify, then if still over `maxPoints`, grow eps until it fits (keeps the count bounded).
export function simplifyToBudget(points, eps, maxPoints) {
  let e = eps, out = simplify(points, e), guard = 0;
  while (out.length > maxPoints && guard++ < 40) { e *= 1.4; out = simplify(points, e); }
  return out;
}

// ── 4. PROFILE DERIVATION (the engine payoff) ────────────────────────────────
// Given a CLOSED outline (normalised 0..1 image coords), sample it into `stations` cross-sections along the
// body's long axis. For each station we scanline-intersect the polygon and record the perpendicular
// half-extent + centre — i.e. the half-width/half-height the loft needs. `axis` is the long-axis label
// ('x' = body runs left↔right, 'y' = top↔bottom); `headEnd` says which end is the head ('min' or 'max' of
// that axis) so t=0 is always the nose. Returns { length, stations:[{t, half, center}] }, all in units of
// the body LENGTH (so the numbers are directly comparable to MODEL-CREATION.md's loft examples).
// `aspect` = imageWidth/imageHeight: points normalised per-axis (x/W, y/H) are anisotropic, so we restore
// real proportions by pre-scaling x by aspect (→ everything measured in image-height units). Pass aspect=1
// when the points are already isotropic.
export function deriveProfile(points, { axis = 'x', headEnd = 'min', stations = 12, aspect = 1 } = {}) {
  if (points.length < 3) return { length: 0, stations: [] };
  points = points.map((p) => ({ x: p.x * aspect, y: p.y }));   // make the working space isotropic
  const U = axis === 'x' ? 'x' : 'y', V = axis === 'x' ? 'y' : 'x';
  let uMin = Infinity, uMax = -Infinity;
  for (const p of points) { if (p[U] < uMin) uMin = p[U]; if (p[U] > uMax) uMax = p[U]; }
  const length = uMax - uMin || 1e-6;
  const n = points.length, out = [];
  for (let s = 0; s < stations; s++) {
    const t = stations === 1 ? 0.5 : s / (stations - 1);
    // pull samples slightly inside the ends so the caps (where the outline pinches to a point) don't read 0.
    const u = uMin + length * (0.001 + 0.998 * t);
    let vMin = Infinity, vMax = -Infinity;
    for (let i = 0; i < n; i++) {
      const a = points[i], b = points[(i + 1) % n];
      const ua = a[U], ub = b[U];
      if ((ua <= u && ub > u) || (ub <= u && ua > u)) {
        const f = (u - ua) / (ub - ua), v = a[V] + f * (b[V] - a[V]);
        if (v < vMin) vMin = v; if (v > vMax) vMax = v;
      }
    }
    const half = vMax >= vMin ? (vMax - vMin) / 2 / length : 0;
    const center = vMax >= vMin ? (vMax + vMin) / 2 / length : 0;
    const tt = headEnd === 'min' ? t : 1 - t;
    out.push({ t: tt, half, center });
  }
  out.sort((p, q) => p.t - q.t);
  return { length, stations: out };
}

// Merge a SIDE profile (gives ry = half-height) and a TOP profile (gives rx = half-width) into the engine's
// loftEllipse ring list. z spans [-1, 1] (head −Z → tail +Z, per the coordinate cheat-sheet) and the radii
// are scaled ×2 into those same body-length units, so the output drops into loftEllipse([...]) as a
// best-effort starting point you then tune on the silhouette overlay.
export function toLoftRings(sideProfile, topProfile, stations = 12) {
  const sampleAt = (prof, t) => {
    const a = prof.stations; if (!a.length) return null;
    if (t <= a[0].t) return a[0]; if (t >= a[a.length - 1].t) return a[a.length - 1];
    for (let i = 1; i < a.length; i++) if (a[i].t >= t) {
      const p = a[i - 1], q = a[i], f = (t - p.t) / (q.t - p.t || 1e-6);
      return { half: p.half + f * (q.half - p.half), center: p.center + f * (q.center - p.center) };
    }
    return a[a.length - 1];
  };
  const rings = [];
  for (let s = 0; s < stations; s++) {
    const t = stations === 1 ? 0.5 : s / (stations - 1);
    const sd = sideProfile && sideProfile.stations.length ? sampleAt(sideProfile, t) : null;
    const tp = topProfile && topProfile.stations.length ? sampleAt(topProfile, t) : null;
    const ry = sd ? +(sd.half * 2).toFixed(3) : null;
    const rx = tp ? +(tp.half * 2).toFixed(3) : (ry != null ? ry : null);   // fall back to ry if no top view
    rings.push({ z: +(t * 2 - 1).toFixed(3), rx, ry: ry != null ? ry : rx });
  }
  return rings;
}

// ── 4b. CUT SAMPLING (partition the silhouette into parts along the body axis) ─
// A "cut" is an ordered polyline (normalised coords) drawn roughly PERPENDICULAR to the body axis to split
// the silhouette into parts (head | body | tail …). For axis 'x' (body runs left↔right) the cut is a
// near-vertical line, so we treat it as value x = f(y) and sample the threshold x at a given y (and vice
// versa for axis 'y'). Pixels on the wrong side of a part's bounding cuts get erased before tracing, so each
// part traces in isolation; the cut itself is the SHARED SEAM where the two parts join (zero gap by
// construction — it becomes a cross-section station / attach locus for the continuous hull). Clamps past the
// endpoints so a short cut still partitions the whole height.
export function cutAt(cutPts, q, axis = 'x') {
  if (!cutPts || cutPts.length === 0) return null;
  const P = axis === 'x' ? 1 : 0;     // param coord (y for an x-axis cut)
  const V = axis === 'x' ? 0 : 1;     // value coord (the x threshold)
  const pts = [...cutPts].sort((a, b) => a[P] - b[P]);
  if (q <= pts[0][P]) return pts[0][V];
  if (q >= pts[pts.length - 1][P]) return pts[pts.length - 1][V];
  for (let i = 1; i < pts.length; i++) if (pts[i][P] >= q) {
    const a = pts[i - 1], b = pts[i], f = (q - a[P]) / ((b[P] - a[P]) || 1e-9);
    return a[V] + f * (b[V] - a[V]);
  }
  return pts[pts.length - 1][V];
}

// ── 5. WING-RIG DERIVATION (planform → engine wingForms) ─────────────────────
// A traced wing RIG is a small set of handles in normalised image coords:
//   root  — where the wing meets the body (the attach/joint locus)
//   tips  — the finger-strut endpoints, ORDERED OUTER→INNER (tips[0] = the wingtip)
//   lead  — (optional) a leading-edge control point (the spar bulge)
//   wrist — (optional) the elbow/wrist along the leading spar
// We build a wing-LOCAL frame at the root: x = span (root→outer tip), y = chord
// (perpendicular, +y toward the leading edge), then scale so the outer tip sits at
// x = targetSpan. That yields the exact shape `wingForms[]` consumes: tips x
// descending outer→inner, lead +y (dragonParts.js buildWingShape). `aspect`=W/H
// restores real proportions from per-axis-normalised points. scallop/arc are 3-D
// finish dials a flat trace can't measure — emitted as sensible defaults to tune
// on the preview.
export function deriveWingForm(rig, { aspect = 1, targetSpan = 5.5 } = {}) {
  if (!rig || !rig.root || !Array.isArray(rig.tips) || rig.tips.length < 1) return null;
  const A = (p) => ({ x: p[0] * aspect, y: p[1] });        // → isotropic space
  const r = A(rig.root), outer = A(rig.tips[0]);
  let sx = outer.x - r.x, sy = outer.y - r.y;
  const span = Math.hypot(sx, sy) || 1e-6;
  sx /= span; sy /= span;                                   // span axis (unit)
  let cx = -sy, cy = sx;                                    // chord axis (perp)
  const ref = rig.lead ? A(rig.lead) : (rig.wrist ? A(rig.wrist) : null);
  if (ref && ((ref.x - r.x) * cx + (ref.y - r.y) * cy) < 0) { cx = -cx; cy = -cy; }  // +y = leading-edge side
  const k = targetSpan / span;
  const local = (p) => { const q = A(p), dx = q.x - r.x, dy = q.y - r.y;
    return [+((dx * sx + dy * sy) * k).toFixed(3), +((dx * cx + dy * cy) * k).toFixed(3)]; };
  const tips = rig.tips.map(local);
  const lead = rig.lead ? local(rig.lead)
    : [+(targetSpan * 0.6).toFixed(3), +(tips[0][1] + 0.45).toFixed(3)];
  return {
    tips, lead, scallop: 0.4, arc: { bow: 0.6, hump: 0.6, humpAt: 0.58, hook: 0.4 },
    note: 'planform (tips+lead) derived from the trace; scallop + arc{bow,hump,hook} are 3-D finish defaults — tune on the preview.',
  };
}
