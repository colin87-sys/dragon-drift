// GPU budget stress sweep (boss-upgrade plan, Phase 0). Boots tools/stress.html in headless
// chromium across one-axis-at-a-time param sweeps and prints a compact results table.
//
//   node tools/stress.mjs
//
// Modeled directly on tools/tiershots.mjs / tools/bossshot.mjs: same server (tests/serve.mjs,
// ROOT = reforged/) + same global-playwright resolution, one browser/page reused across every
// row (navigation is cheap; relaunching chromium per row is not).
//
// *** HEADLESS numbers are RELATIVE (rAF throttled ~8x under headless Chromium — see LEAPFROG
// *** L105). Read curve SHAPES and INFLECTION POINTS here, not absolute fps. Absolute on-device
// *** numbers come from a human opening stress.html on a real phone via the PR preview — see the
// *** worst-case URL list this script prints at the end.
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
}

// Headless-fast sampling — the on-phone default (warmup=5&sample=10) stays the stress.html
// default; the sweep overrides it via URL params to keep total runtime under the ~5min target.
const WARMUP = 1.5;
const SAMPLE = 4;

const BASELINE = { meshes: 50, tris: 500, mat: 'standard', instanced: 0, shells: 0, tier: 0 };

function buildRows() {
  const rows = [];
  // draw-call axis
  for (const meshes of [10, 25, 50, 100, 200, 400]) {
    rows.push({ axis: 'drawcalls', params: { ...BASELINE, meshes } });
  }
  // tri axis (meshes=50, baseline)
  for (const tris of [50, 500, 2000, 8000]) {
    rows.push({ axis: 'tris', params: { ...BASELINE, tris } });
  }
  // material axis (meshes=100)
  for (const mat of ['standard', 'basic-additive', 'energyShell']) {
    rows.push({ axis: 'material', params: { ...BASELINE, meshes: 100, mat } });
  }
  // instancing axis (meshes=400)
  for (const instanced of [0, 1]) {
    rows.push({ axis: 'instancing', params: { ...BASELINE, meshes: 400, instanced } });
  }
  // overdraw axis (meshes=50)
  for (const shells of [0, 2, 4, 8, 16]) {
    rows.push({ axis: 'overdraw', params: { ...BASELINE, shells } });
  }
  return rows;
}

function toQuery(params) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) p.set(k, String(v));
  p.set('warmup', String(WARMUP));
  p.set('sample', String(SAMPLE));
  return p.toString();
}

function label(params) {
  return `meshes=${params.meshes} tris=${params.tris} mat=${params.mat} `
    + `instanced=${params.instanced} shells=${params.shells} tier=${params.tier}`;
}

const COLW = { axis: 11, label: 62, fps: 8, p50: 9, p95: 10, calls: 8, tris: 11 };
function pad(s, w) { s = String(s); return s.length >= w ? s.slice(0, w - 1) + ' ' : s + ' '.repeat(w - s.length); }
function padNum(s, w) { s = String(s); return s.length >= w ? s.slice(0, w) : ' '.repeat(w - s.length) + s; }

function printHeader() {
  console.log(pad('axis', COLW.axis) + pad('params', COLW.label)
    + padNum('fps', COLW.fps) + padNum('p50ms', COLW.p50) + padNum('p95ms', COLW.p95)
    + padNum('calls', COLW.calls) + padNum('tris/mesh', COLW.tris));
  console.log('-'.repeat(COLW.axis + COLW.label + COLW.fps + COLW.p50 + COLW.p95 + COLW.calls + COLW.tris));
}

function printRow(axis, params, r) {
  console.log(
    pad(axis, COLW.axis) + pad(label(params), COLW.label)
    + padNum(r.fps.toFixed(1), COLW.fps) + padNum(r.p50.toFixed(2), COLW.p50)
    + padNum(r.p95.toFixed(2), COLW.p95) + padNum(r.calls, COLW.calls)
    + padNum(r.actualTrisPerMesh, COLW.tris)
  );
}

async function runRow(page, srvUrl, params) {
  const url = `${srvUrl}/tools/stress.html?${toQuery(params)}`;
  const errors = [];
  const onErr = (e) => errors.push(String(e));
  page.on('pageerror', onErr);
  await page.goto(url);
  try {
    await page.waitForFunction(() => document.title.startsWith('DONE'), { timeout: (WARMUP + SAMPLE + 20) * 1000 });
  } finally {
    page.off('pageerror', onErr);
  }
  if (errors.length) console.error('  ! page errors:', errors.join(' | '));
  return page.evaluate(() => window.__stressResult);
}

const { chromium } = loadPlaywright();
const srv = await serve();
const browser = await chromium.launch();
// Small viewport ON PURPOSE: headless CI has no GPU (swiftshader), where the composer's
// fill cost at 720p is a ~1000ms/frame floor that buries every axis in noise (~4 sampled
// frames/row). At 640x360 the composer floor drops ~4x, per-draw CPU cost becomes visible,
// and each row samples ~4x more frames — the RELATIVE curves are the whole point here;
// absolute fill-rate behaviour is judged on a real phone at full resolution.
const page = await browser.newPage({ viewport: { width: 640, height: 360 }, deviceScaleFactor: 1 });

console.log('=== Dragon Drift GPU stress sweep (Phase 0) ===');
console.log('HEADLESS numbers are RELATIVE (rAF throttled ~8x) — read curve shapes and inflection');
console.log('points, not absolute fps. Absolute on-device numbers: open stress.html on a real phone');
console.log(`via the PR preview. warmup=${WARMUP}s sample=${SAMPLE}s per row (headless-fast; on-phone default is 5/10).`);
console.log('');
printHeader();

const rows = buildRows();
const allResults = []; // { axis, params, result }

for (const row of rows) {
  const result = await runRow(page, srv.url, row.params);
  if (!result) { console.error(`  ! ${row.axis} ${label(row.params)}: no result (timeout or page error)`); continue; }
  printRow(row.axis, row.params, result);
  allResults.push({ axis: row.axis, params: row.params, result });
}

// Tier axis: re-run the worst case found so far (max p95 frame time across axes 1-5) at
// tier=0,1,2 — a full cross-product is far too slow, but the worst config is exactly where
// tier's pixel-ratio + postfx cost matters most.
let worst = allResults[0];
for (const r of allResults) if (r.result.p95 > worst.result.p95) worst = r;
console.log('');
console.log(`worst case so far: axis=${worst.axis} ${label(worst.params)}  (p95 ${worst.result.p95.toFixed(2)}ms) — sweeping tier 0/1/2 on it`);
for (const tier of [0, 1, 2]) {
  const params = { ...worst.params, tier };
  const result = await runRow(page, srv.url, params);
  if (!result) { console.error(`  ! tier ${label(params)}: no result`); continue; }
  printRow('tier', params, result);
  allResults.push({ axis: 'tier', params, result });
}

await browser.close();
srv.close();

console.log('');
console.log('sweep done.');
