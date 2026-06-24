// LINE-TRACE algorithms — the two capabilities the silhouette tracer lacked, for extracting INTERNAL
// structure from line-art / colour layers:
//   • thin()                — Zhang-Suen thinning → a 1px skeleton of any line mask
//   • skeletonToPolylines() — walk the skeleton graph (endpoints + junctions) → a set of OPEN polylines
//                             (wing finger-struts, lightning veins — strokes, not closed outlines)
//   • smoothOpen/resampleOpen — de-staircase + even arc-length resample for an open stroke
//   • smoothRing/resampleClosed — same for a closed contour (armour-plate cells)
// All pure, pixel-space in/out; callers normalize. No DOM, no three.

export const lum = (r, g, b) => r * 0.3 + g * 0.59 + b * 0.11;

// ── morphology + tracing robustness (see LEAPFROG L110) ──────────────────────
// Hand-drawn line-art is ~¼ anti-aliased grey straddling any hard threshold, so a raw mask has micro-gaps that
// SHATTER the skeleton. CLOSE the mask (dilate→erode by r) BEFORE thinning to bridge those gaps. Pair with
// skeletonStats() to flag pathological fragmentation with a NUMBER, not just an eyeball overlay.
function morph(mask, w, h, iters, grow) {
  let cur = mask;
  for (let it = 0; it < iters; it++) {
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let v = grow ? 0 : 1; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy, s = (nx >= 0 && ny >= 0 && nx < w && ny < h) ? cur[ny * w + nx] : 0; if (grow) { if (s) v = 1; } else if (!s) v = 0; } out[y * w + x] = v; }
    cur = out;
  }
  return cur;
}
export const dilate = (m, w, h, r = 1) => morph(m, w, h, r, true);
export const erode = (m, w, h, r = 1) => morph(m, w, h, r, false);
export const morphClose = (m, w, h, r = 1) => erode(dilate(m, w, h, r), w, h, r);   // bridge threshold micro-gaps
// fragmentation report for a skeleton mask: { fragments, junctions, endpoints } — a numeric QA signal
export function skeletonStats(skel, w, h) {
  let junctions = 0, endpoints = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { if (!skel[y * w + x]) continue; let d = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!(dx === 0 && dy === 0) && skel[(y + dy) * w + (x + dx)]) d++; if (d >= 3) junctions++; else if (d === 1) endpoints++; }
  return { fragments: skeletonToPolylines(skel, w, h, 6).length, junctions, endpoints };
}
// WELD fragmented chains into continuous strokes: greedily join the pair of chain-ends that are close AND
// collinear (straightest continuation), until none qualify. Pixel-space {x,y}. (See LEAPFROG L101/L110.)
export function weldChains(polys, D = 9, cosMin = 0.45) {
  const chains = polys.map(p => p.slice());
  const uv = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by, m = Math.hypot(dx, dy) || 1; return { x: dx / m, y: dy / m }; };
  const dirOut = (c, e) => { const n = c.length; return e === 's' ? uv(c[0].x, c[0].y, c[Math.min(1, n - 1)].x, c[Math.min(1, n - 1)].y) : uv(c[n - 1].x, c[n - 1].y, c[Math.max(0, n - 2)].x, c[Math.max(0, n - 2)].y); };
  for (; ;) {
    let best = null;
    for (let i = 0; i < chains.length; i++) for (let j = i + 1; j < chains.length; j++) for (const [ei, ej] of [['s', 's'], ['s', 'e'], ['e', 's'], ['e', 'e']]) {
      const pi = ei === 's' ? chains[i][0] : chains[i][chains[i].length - 1], pj = ej === 's' ? chains[j][0] : chains[j][chains[j].length - 1];
      const g = Math.hypot(pi.x - pj.x, pi.y - pj.y); if (g > D) continue;
      const di = dirOut(chains[i], ei), dj = dirOut(chains[j], ej), dot = -(di.x * dj.x + di.y * dj.y); if (dot < cosMin) continue;
      const sc = dot - g * 0.04; if (!best || sc > best.sc) best = { i, j, ei, ej, sc };
    }
    if (!best) break;
    let ci = chains[best.i], cj = chains[best.j]; if (best.ei === 's') ci = ci.slice().reverse(); if (best.ej === 'e') cj = cj.slice().reverse();
    chains.splice(Math.max(best.i, best.j), 1); chains.splice(Math.min(best.i, best.j), 1); chains.push(ci.concat(cj));
  }
  return chains;
}

// Zhang-Suen thinning. mask: Uint8Array(w*h) 1=line. Returns a 1px skeleton mask.
export function thin(src, w, h) {
  const m = Uint8Array.from(src);
  const I = (x, y) => y * w + x;
  const P = (x, y) => [m[I(x, y - 1)], m[I(x + 1, y - 1)], m[I(x + 1, y)], m[I(x + 1, y + 1)], m[I(x, y + 1)], m[I(x - 1, y + 1)], m[I(x - 1, y)], m[I(x - 1, y - 1)]];
  const A = (p) => { let c = 0; for (let i = 0; i < 8; i++) if (p[i] === 0 && p[(i + 1) % 8] === 1) c++; return c; };
  let changed = true;
  while (changed) {
    changed = false;
    for (const step of [0, 1]) {
      const del = [];
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        if (!m[I(x, y)]) continue;
        const p = P(x, y), B = p[0] + p[1] + p[2] + p[3] + p[4] + p[5] + p[6] + p[7];
        if (B < 2 || B > 6 || A(p) !== 1) continue;
        const [N, , E, , S, , Wt] = p;
        if (step === 0) { if (N * E * S !== 0 || E * S * Wt !== 0) continue; }
        else { if (N * E * Wt !== 0 || N * S * Wt !== 0) continue; }
        del.push(I(x, y));
      }
      if (del.length) { changed = true; for (const d of del) m[d] = 0; }
    }
  }
  return m;
}

// neighbours offsets (8-connected)
const NB = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

// Walk a 1px skeleton into OPEN polylines. Splits at endpoints (deg 1) and junctions (deg ≥ 3); each
// degree-2 chain between two nodes is one polyline. Pure loops (all deg 2) are emitted as closed-ish chains.
// minLen drops thinning spurs. Returns array of polylines [[{x,y}…]…] in pixel space.
export function skeletonToPolylines(skel, w, h, minLen = 12) {
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : skel[y * w + x];
  const nbrs = (x, y) => { const o = []; for (const [dx, dy] of NB) if (at(x + dx, y + dy)) o.push([x + dx, y + dy]); return o; };
  const deg = (x, y) => nbrs(x, y).length;
  const ekey = (ax, ay, bx, by) => { const a = ay * w + ax, b = by * w + bx; return a < b ? a * w * h + b : b * w * h + a; };
  const seen = new Set();
  const polys = [];

  const walk = (sx, sy, nx, ny) => {
    const path = [{ x: sx, y: sy }];
    let px = sx, py = sy, cx = nx, cy = ny;
    seen.add(ekey(px, py, cx, cy));
    while (true) {
      path.push({ x: cx, y: cy });
      if (deg(cx, cy) !== 2) break;                       // hit a node
      const ns = nbrs(cx, cy).filter(([ax, ay]) => !(ax === px && ay === py));
      let nxt = null;
      for (const [ax, ay] of ns) if (!seen.has(ekey(cx, cy, ax, ay))) { nxt = [ax, ay]; break; }
      if (!nxt) break;
      seen.add(ekey(cx, cy, nxt[0], nxt[1]));
      px = cx; py = cy; cx = nxt[0]; cy = nxt[1];
    }
    return path;
  };

  // 1) start every chain from a node (endpoint or junction)
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    if (!skel[y * w + x]) continue;
    const d = deg(x, y);
    if (d === 2) continue;
    for (const [ax, ay] of nbrs(x, y)) if (!seen.has(ekey(x, y, ax, ay))) polys.push(walk(x, y, ax, ay));
  }
  // 2) leftover pure loops (no nodes)
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    if (!skel[y * w + x] || deg(x, y) !== 2) continue;
    const ns = nbrs(x, y).filter(([ax, ay]) => !seen.has(ekey(x, y, ax, ay)));
    if (ns.length) polys.push(walk(x, y, ns[0][0], ns[0][1]));
  }

  const plen = (p) => { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y); return s; };
  return polys.filter((p) => p.length > 1 && plen(p) >= minLen);
}

// ── smoothing + resampling ──────────────────────────────────────────────────
export function smoothOpen(pts, win = 2) {
  if (pts.length < 3) return pts.slice();
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    if (i === 0 || i === n - 1) { out.push(pts[i]); continue; }
    let sx = 0, sy = 0, c = 0;
    for (let k = -win; k <= win; k++) { const j = Math.max(0, Math.min(n - 1, i + k)); sx += pts[j].x; sy += pts[j].y; c++; }
    out.push({ x: sx / c, y: sy / c });
  }
  return out;
}
export function resampleOpen(pts, n) {
  if (pts.length < 2) return pts.slice();
  const seg = [], m = pts.length; let per = 0;
  for (let i = 1; i < m; i++) { const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); seg.push(d); per += d; }
  const step = per / (n - 1), out = [pts[0]]; let i = 0, acc = 0;
  for (let o = 1; o < n - 1; o++) {
    const target = o * step;
    while (i < seg.length - 1 && acc + seg[i] < target) { acc += seg[i]; i++; }
    const t = seg[i] > 1e-9 ? (target - acc) / seg[i] : 0;
    out.push({ x: pts[i].x + (pts[i + 1].x - pts[i].x) * t, y: pts[i].y + (pts[i + 1].y - pts[i].y) * t });
  }
  out.push(pts[m - 1]);
  return out;
}
export function smoothRing(pts, win = 3) {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) { let sx = 0, sy = 0, c = 0; for (let k = -win; k <= win; k++) { const p = pts[(i + k + n) % n]; sx += p.x; sy += p.y; c++; } out.push({ x: sx / c, y: sy / c }); }
  return out;
}
export function resampleClosed(pts, n) {
  const m = pts.length, seg = []; let per = 0;
  for (let i = 0; i < m; i++) { const a = pts[i], b = pts[(i + 1) % m]; const d = Math.hypot(b.x - a.x, b.y - a.y); seg.push(d); per += d; }
  const step = per / n, out = []; let i = 0, acc = 0, target = 0;
  for (let o = 0; o < n; o++) { while (acc + seg[i] < target && i < m - 1) { acc += seg[i]; i++; } const a = pts[i], b = pts[(i + 1) % m], t = seg[i] > 1e-9 ? (target - acc) / seg[i] : 0; out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }); target += step; }
  return out;
}
