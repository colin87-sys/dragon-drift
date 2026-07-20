// Perf-HUD gate: the frame-timing math (perfStats.js) is pure + CI-safe (no WebGL,
// no shim — the module is dependency-free), and source guards confirm the HUD is
// gated + wired. The live DOM/toggle path is covered in tests/graphicssettings.mjs.
//   node tests/perfhud.mjs
import { readFileSync } from 'node:fs';
const { makePerfStats, resetPerfStats, perfFrame, perfSummary } = await import('../js/perfStats.js');

let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };
const near = (a, b, e = 0.1) => Math.abs(a - b) < e;
const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

// --- 1. a synthetic run: 100 good frames + one bad (40ms) + one sub-ms spike -----
const s = makePerfStats(600);
for (let i = 0; i < 100; i++) perfFrame(s, 1000 / 60, 100, 200000); // 16.667ms → 60fps
perfFrame(s, 40, 132, 230000, 30, 6);  // the janky frame: 25fps, heavier draws; 30ms sim (a JS/GC stall) + 6ms render
perfFrame(s, 2, 999, 999000);   // an rAF double-fire: 500fps — must NOT become "max"
const sum = perfSummary(s);

check(`min fps = the worst frame (${sum.minFps.toFixed(2)} ≈ 25)`, near(sum.minFps, 25));
check('min snapshots the draws/tris AT the worst frame', sum.worstCalls === 132 && sum.worstTris === 230000);
check('min snapshots the sim/render split AT the worst frame (hitch attribution)', sum.worstSimMs === 30 && sum.worstRenderMs === 6);
check(`max fps caps honestly — sub-4ms spike excluded (${sum.maxFps.toFixed(2)} ≈ 60)`, near(sum.maxFps, 60.0, 0.5));
check(`avg fps = true run mean (${sum.avgFps.toFixed(2)} ≈ 59.9)`, near(sum.avgFps, 1000 * 102 / (100 * 1000 / 60 + 40 + 2), 0.2));
check(`p95 lands in the tail (${sum.p95Ms.toFixed(1)}ms — the good-frame band, one 40ms outlier at p>95)`, sum.p95Ms > 16 && sum.p95Ms < 41);

// --- 2. ms<=0 (paused) is ignored (no poisoning of avg/min) --------------------
const before = perfSummary(s).avgFps;
perfFrame(s, 0, 1, 1); perfFrame(s, -5, 1, 1);
check('paused frames (ms<=0) ignored', near(perfSummary(s).avgFps, before, 1e-9));

// --- 3. ring buffer wraps at ringSize (bounded memory on endless runs) ---------
const r = makePerfStats(600);
for (let i = 0; i < 700; i++) perfFrame(r, 16, 100, 100);
check('ring buffer caps at ringSize (600)', r.frames.length === 600);

// --- 4. reset restores the virgin state ---------------------------------------
resetPerfStats(s);
const z = perfSummary(s);
check('resetPerfStats → min ∞ / max 0 / avg 0 / frames empty', z.minFps === Infinity && z.maxFps === 0 && z.avgFps === 0 && s.frames.length === 0);

// --- 5. source guards: identity-off gate + wiring present ----------------------
const main = src('../js/main.js');
check('main: per-frame work gated behind `if (perfEl)` (off = skipped)', /if \(perfEl\) \{/.test(main));
check('main: OFF path restores renderer.info.autoReset = true', /renderer\.info\.autoReset = true/.test(main));
check('main: HUD boots from ?debug=perf OR the perfHud setting', /gfxPref\.perfHud === true\) setPerfHud\(true\)/.test(main));
check('main: onGraphicsChange routes perfHud → setPerfHud', /kind === 'perfHud'\) setPerfHud\(value\)/.test(main));
check('save: perfHud default false (shipped identity)', /perfHud: false/.test(src('../js/save.js')));
// U5 redesigned on/off settings rows as switches: the row renders via swRow('gfx', …)
// (the old gfxToggle helper is gone) — grep the current helper, same intent.
check('ui: PERFORMANCE HUD settings toggle present', /swRow\('gfx',\s*'perfHud'/.test(src('../js/ui.js')));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
