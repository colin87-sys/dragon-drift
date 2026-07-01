// silmetrics — measurable silhouette metrics, computed from a flat-black coverage mask.
//
// The point (per DRAGON-AESTHETICS.md): the AI must NOT be the aesthetic judge. But it CAN
// measure geometry with numbers, and reject candidates that are provably wrong before a human
// ever sees them. These metrics are the HARD FILTER in the gallery loop — they don't rank
// beauty, they cull the un-dragonlike (spherical blobs, ribbon wings, facet kinks, no scallops).
// The human selects from the survivors.
//
// Everything here operates on the 0/255 coverage buffer from silhouetteCore.renderSilhouette*.
// No THREE, no browser. CLI:  node tools/silmetrics.mjs <key> [tier]
import { renderSilhouette } from './silhouetteCore.mjs';

// --- contour extraction from a coverage mask -------------------------------------------------
// Per-column vertical extent (top = smallest screen-y filled, bot = largest). NaN where empty.
export function colExtent(buf, W, H, bounds) {
  const b = bounds || { minX: 0, maxX: W - 1, minY: 0, maxY: H - 1 };
  const top = [], bot = [];
  for (let x = b.minX; x <= b.maxX; x++) {
    let t = NaN, bo = NaN;
    for (let y = b.minY; y <= b.maxY; y++) if (buf[y * W + x]) { if (Number.isNaN(t)) t = y; bo = y; }
    top.push(t); bot.push(bo);
  }
  return { top, bot, x0: b.minX };
}
// Per-row horizontal extent (left/right filled column). NaN where empty.
export function rowExtent(buf, W, H, bounds) {
  const b = bounds || { minX: 0, maxX: W - 1, minY: 0, maxY: H - 1 };
  const left = [], right = [];
  for (let y = b.minY; y <= b.maxY; y++) {
    let l = NaN, r = NaN;
    for (let x = b.minX; x <= b.maxX; x++) if (buf[y * W + x]) { if (Number.isNaN(l)) l = x; r = x; }
    left.push(l); right.push(r);
  }
  return { left, right, y0: b.minY };
}

// Smooth a 1D series (ignoring NaN gaps) with a small box kernel.
function smooth(a, k = 3) {
  const out = a.slice();
  for (let i = 0; i < a.length; i++) {
    if (Number.isNaN(a[i])) continue;
    let s = 0, n = 0;
    for (let j = -k; j <= k; j++) { const v = a[i + j]; if (v != null && !Number.isNaN(v)) { s += v; n++; } }
    out[i] = n ? s / n : a[i];
  }
  return out;
}
// Count sign changes of the first derivative of a series = inflections (the S-curve counter).
function inflections(a) {
  const d = [];
  for (let i = 1; i < a.length; i++) if (!Number.isNaN(a[i]) && !Number.isNaN(a[i - 1])) d.push(a[i] - a[i - 1]);
  let sign = 0, flips = 0;
  for (const v of d) { const s = v > 0.4 ? 1 : v < -0.4 ? -1 : 0; if (s && sign && s !== sign) flips++; if (s) sign = s; }
  return flips;
}
// Max absolute discrete 2nd difference (a KINK / facet-band detector) normalized by span.
function maxKink(a, span) {
  let m = 0;
  for (let i = 1; i < a.length - 1; i++) {
    const p = a[i - 1], c = a[i], n = a[i + 1];
    if ([p, c, n].some(Number.isNaN)) continue;
    m = Math.max(m, Math.abs(p - 2 * c + n));
  }
  return m / Math.max(1, span) * 100; // px of 2nd-diff per 100px of span
}
// Count concave "dips" in a trailing edge (festoon scallops). A scallop spans TENS of px (the gap
// between two finger tips), so it must be detected at that SCALE with a prominence test — not by
// comparing 2 adjacent samples. For the aft edge (larger screen-y = further aft), a scallop pulls
// INWARD (smaller y): find local minima whose depth below the flanking finger-tip peaks exceeds a
// fraction of span. Returns { count, meanDepthFrac }.
function scallops(edge, span) {
  const s = smooth(edge, 2);
  const w = Math.max(4, Math.round(span / 20));  // half-window ≈ a fifth of a wing = one gap
  const th = span * 0.025;                        // min prominence to count as a real festoon
  const dips = []; let last = -1e9;
  for (let i = w; i < s.length - w; i++) {
    if (Number.isNaN(s[i])) continue;
    let isMin = true, lp = -Infinity, rp = -Infinity, bad = false;
    for (let j = i - w; j <= i + w; j++) { if (Number.isNaN(s[j])) { bad = true; break; } if (s[j] < s[i] - 0.5) isMin = false; }
    if (bad || !isMin) continue;
    for (let j = i - w; j < i; j++) lp = Math.max(lp, s[j]);
    for (let j = i + 1; j <= i + w; j++) rp = Math.max(rp, s[j]);
    const depth = Math.min(lp, rp) - s[i];
    if (depth > th && i - last >= w) { dips.push(depth); last = i; }
  }
  const mean = dips.length ? dips.reduce((a, b) => a + b, 0) / dips.length : 0;
  return { count: dips.length, meanDepthFrac: mean / Math.max(1, span) };
}

// --- the metric bundle for one view ----------------------------------------------------------
export function computeMetrics(res, view) {
  const { buf, W, H, bounds, tris } = res;
  if (!bounds) return { empty: true };
  const bw = bounds.maxX - bounds.minX + 1, bh = bounds.maxY - bounds.minY + 1;
  // solidity = filled fraction of the bbox. Sphere/blob → high (~.78); spindly/ribbon → low.
  let filled = 0;
  for (let y = bounds.minY; y <= bounds.maxY; y++) for (let x = bounds.minX; x <= bounds.maxX; x++) if (buf[y * W + x]) filled++;
  const solidity = filled / (bw * bh);
  const m = { view, tris, bboxW: bw, bboxH: bh, aspect: bw / bh, solidity, widthFrac: bw / W, heightFrac: bh / H };

  if (view === 'side') {
    // dorsal (top) + ventral (bottom) lines along the body length → spine flow + taper + facets.
    const { top, bot } = colExtent(buf, W, H, bounds);
    const dtop = smooth(top, 3), dbot = smooth(bot, 3);
    const girth = dtop.map((t, i) => (Number.isNaN(t) || Number.isNaN(dbot[i])) ? NaN : dbot[i] - t);
    const thirds = (arr) => {
      const n = arr.length, seg = (a, b) => { let mx = 0; for (let i = a; i < b; i++) if (!Number.isNaN(arr[i])) mx = Math.max(mx, arr[i]); return mx; };
      return [seg(0, n / 3 | 0), seg(n / 3 | 0, 2 * n / 3 | 0), seg(2 * n / 3 | 0, n)];
    };
    const g = thirds(girth); // note: 'side' view has -z=head, so index 0 = HEAD end
    m.spineInflections = inflections(dtop);        // line-of-beauty: want ≥1 (an S/gentle bend)
    m.dorsalKink = maxKink(dtop, bw);              // facet/band detector: want LOW
    m.girthHead = g[0]; m.girthMid = g[1]; m.girthTail = g[2];
    m.taper = g[1] > 0 ? (g[1] - Math.min(g[0], g[2])) / g[1] : 0; // wedge (mid-heavy) vs tube (flat)
  } else if (view === 'top' || view === 'threeq' || view === 'rear') {
    // wing planform: span across screen-x, chord along screen-y. Trailing edge scallops + aspect.
    const { top, bot } = colExtent(buf, W, H, bounds);
    const chord = top.map((t, i) => (Number.isNaN(t) || Number.isNaN(bot[i])) ? NaN : bot[i] - t);
    let maxChord = 0; for (const c of chord) if (!Number.isNaN(c)) maxChord = Math.max(maxChord, c);
    m.wingSpan = bw; m.wingChord = maxChord; m.wingAspect = maxChord > 0 ? bw / maxChord : 99;
    const aft = scallops(bot, bw), fore = scallops(top.map(v => -v), bw);
    m.festoonCount = aft.count; m.festoonDepth = aft.meanDepthFrac;
    m.leadKink = maxKink(smooth(top, 2), bw);
  }
  return m;
}

// --- HARD gates: cull only the PROVABLY degenerate, never rank beauty --------------------------
// Calibration across the roster (toothless/azure/phoenix/ember/fire…) showed silhouette scalars do
// NOT cleanly separate good from bad — festoon reads ~0 for every dragon, `taper` rewards a sphere's
// mid-bulge, `dorsalKink` flags intentional back-spikes. So those stay ADVISORY (reported beside each
// variant for context), and only the unambiguous degenerates below fail. The HUMAN judges the sheet.
export const THRESH = {
  side: [
    ['noodle (too long/thin)', m => m.aspect <= 5.2, m => `aspect ${m.aspect.toFixed(2)}`],
    ['ball (too stubby)', m => m.aspect >= 0.75, m => `aspect ${m.aspect.toFixed(2)}`],
    ['solid blob', m => m.solidity <= 0.80, m => `solidity ${m.solidity.toFixed(2)}`],
    ['wisp (no body)', m => m.solidity >= 0.08, m => `solidity ${m.solidity.toFixed(2)}`],
  ],
  top: [
    ['extreme ribbon wing', m => m.wingAspect <= 4.5, m => `wingAspect ${m.wingAspect.toFixed(2)}`],
  ],
};

export function scoreView(m) {
  if (!m || m.empty) return ['empty render (degenerate geometry)'];
  const key = (m.view === 'threeq' || m.view === 'rear') ? 'top' : m.view;
  const rules = THRESH[key] || [];
  const fails = [];
  for (const [label, ok, fmt] of rules) if (!ok(m)) fails.push(`${label} (${fmt(m)})`);
  return fails;
}

// Advisory numbers worth surfacing beside each variant (context, NOT gates).
export function advisory(m) {
  if (!m || m.empty) return {};
  if (m.view === 'side') return { aspect: m.aspect, solidity: m.solidity, inflect: m.spineInflections, kink: m.dorsalKink, taper: m.taper };
  return { wAspect: m.wingAspect, festoon: m.festoonCount, solidity: m.solidity };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const key = process.argv[2] || 'toothless';
  const tier = process.argv[3] != null ? Number(process.argv[3]) : undefined;
  const W = 480, H = 480;
  for (const view of ['side', 'top']) {
    const res = renderSilhouette({ key, view, tier, W, H });
    const m = computeMetrics(res, view);
    const fails = scoreView(m);
    console.log(`\n[${view}] ${res.name} · ${res.formName}`);
    for (const [k, v] of Object.entries(m)) if (typeof v === 'number') console.log(`   ${k.padEnd(16)} ${v.toFixed ? v.toFixed(3) : v}`);
    console.log(fails.length ? `   FAIL: ${fails.join('; ')}` : '   PASS');
  }
}
