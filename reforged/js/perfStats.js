// perfStats.js — pure frame-timing accounting for the performance HUD (promoted out
// of main.js so the math is unit-testable without WebGL). No imports, no globals: a
// caller holds one stats object, feeds it a frame's wall-time (ms) + draw counts, and
// reads a summary. All per-RUN (the worst/best frame that made a fight feel janky or
// smooth), plus a rolling ring for p95 frame time.

const RING = 600; // ~10s of frames @60 — the p95 window

export function makePerfStats(ringSize = RING) {
  return {
    ringSize,
    frames: [],            // recent frame times (ms), ring buffer
    cursor: 0,
    minFps: Infinity, maxFps: 0,
    worstCalls: 0, worstTris: 0,   // draws/tris AT the worst (min-fps) frame
    worstSimMs: 0, worstRenderMs: 0, // CPU sim (JS/GC) vs render-submit ms AT the worst frame
    runMs: 0, runFrames: 0,        // for the true run-average fps
  };
}

export function resetPerfStats(s) {
  s.frames.length = 0; s.cursor = 0;
  s.minFps = Infinity; s.maxFps = 0;
  s.worstCalls = 0; s.worstTris = 0;
  s.worstSimMs = 0; s.worstRenderMs = 0;
  s.runMs = 0; s.runFrames = 0;
}

// Record one presented frame. `ms` = wall time, `calls`/`tris` = renderer.info counts.
// `simMs`/`renderMs` (optional) = CPU wall time of the world-update phase vs the render-
// submit phase — snapshotted at the worst frame so a HITCH can be attributed: a high
// `worstSimMs` is a JS/GC stall (a quality drop can't fix it — remove the alloc/warm the
// compile); a high `worstRenderMs` is render-submit cost (an extra pass — the mirror/mask);
// and `ms - simMs - renderMs` is the GPU-bound remainder (fill — where dynRes helps).
export function perfFrame(s, ms, calls, tris, simMs = 0, renderMs = 0) {
  if (!(ms > 0)) return;
  s.runMs += ms; s.runFrames++;
  if (s.frames.length < s.ringSize) s.frames.push(ms);
  else { s.frames[s.cursor] = ms; s.cursor = (s.cursor + 1) % s.ringSize; }
  const fps = 1000 / ms;
  if (fps < s.minFps) { s.minFps = fps; s.worstCalls = calls; s.worstTris = tris; s.worstSimMs = simMs; s.worstRenderMs = renderMs; }
  // 4ms floor on max: an rAF double-fire can report a sub-ms frame → a fake 500fps
  // spike. Cap the honest max at 250fps so the readout means something.
  if (ms >= 4 && fps > s.maxFps) s.maxFps = fps;
}

// p95 frame time over the ring (95th-percentile ms — the dips that make it feel janky).
function p95(frames) {
  if (!frames.length) return 0;
  const sorted = frames.slice().sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
}

export function perfSummary(s) {
  return {
    avgFps: s.runFrames ? (1000 * s.runFrames) / s.runMs : 0, // true per-run mean
    minFps: s.minFps,
    maxFps: s.maxFps,
    worstCalls: s.worstCalls,
    worstTris: s.worstTris,
    worstSimMs: s.worstSimMs,
    worstRenderMs: s.worstRenderMs,
    p95Ms: p95(s.frames),
  };
}
