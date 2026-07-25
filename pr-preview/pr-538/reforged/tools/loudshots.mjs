// loudshots — the audio sibling of tiershots: renders every Dragon Radio
// station offline (through the REAL engine graph) in headless Chromium,
// measures BS.1770 loudness + peak + mono-fold safety + render cost, and
// writes the results as JSON.
//
//   node tools/loudshots.mjs                → all stations → /tmp/loudshots.json
//   node tools/loudshots.mjs skyborne rush  → just those stations
//   node tools/loudshots.mjs --check        → also gate against the committed
//                                             baseline (tools/loudshots-baseline.json)
//                                             with metric tolerances (never hashes:
//                                             browser DSP drifts across versions).
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
}

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE = join(HERE, 'loudshots-baseline.json');
// Gate tolerances: METRICS with slack, never PCM hashes — native-node DSP
// (compressor, biquads) legitimately drifts across browser versions.
const TOL = { lufs: 1.0, peakDb: 1.0, monoDropLU: 0.75, crestDb: 1.5 };

const args = process.argv.slice(2);
const checkMode = args.includes('--check');
const v1Mode = args.includes('--v1'); // measure the pre-overhaul (shipped) chain
const wanted = args.filter((a) => !a.startsWith('--'));

const { chromium } = loadPlaywright();
const srv = await serve();
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => { console.error('PAGEERROR', String(e)); process.exitCode = 1; });
await page.goto(srv.url + '/tools/loudshots.html');
await page.waitForFunction(() => window.__ready, { timeout: 15000 });

const stations = await page.evaluate(() => window.__stations);
const targets = wanted.length ? stations.filter((s) => wanted.includes(s.id)) : stations;
if (wanted.length && targets.length !== wanted.length) {
  console.error(`unknown station id among: ${wanted.join(' ')}`);
  process.exit(1);
}

const results = [];
for (const s of targets) {
  const m = await page.evaluate(([i, v2]) => window.__measure(i, { audioV2: v2 }), [s.i, !v1Mode]);
  results.push(m);
  console.log(
    `${m.id.padEnd(12)} ${String(m.bpm).padStart(3)}bpm  ${String(m.lufs).padStart(7)} LUFS  ` +
    `peak ${String(m.peakDb).padStart(6)} dB  monoDrop ${String(m.monoDropLU).padStart(5)} LU  ` +
    `crest ${String(m.crestDb).padStart(5)} dB  render ${m.renderMs}ms`);
}
await browser.close();
srv.close();

const outPath = '/tmp/loudshots.json';
writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`\nwrote ${outPath} (${results.length} stations)`);

// Summary: the "36 stations at 36 loudnesses" number this work exists to kill.
const lufs = results.map((r) => r.lufs).filter(Number.isFinite);
const spread = Math.max(...lufs) - Math.min(...lufs);
console.log(`LUFS spread: ${spread.toFixed(1)} LU  (min ${Math.min(...lufs)}, max ${Math.max(...lufs)})`);

if (checkMode) {
  if (!existsSync(BASELINE)) {
    console.error(`--check: no baseline at ${BASELINE}; run without --check and commit /tmp/loudshots.json there first.`);
    process.exit(1);
  }
  const base = JSON.parse(readFileSync(BASELINE, 'utf8'));
  const byId = new Map(base.map((b) => [b.id, b]));
  let bad = 0;
  for (const r of results) {
    const b = byId.get(r.id);
    if (!b) { console.error(`GATE: ${r.id} missing from baseline`); bad++; continue; }
    for (const [k, tol] of Object.entries(TOL)) {
      if (Math.abs(r[k] - b[k]) > tol) {
        console.error(`GATE: ${r.id} ${k} ${b[k]} → ${r[k]} (tol ±${tol})`);
        bad++;
      }
    }
  }
  if (bad) { console.error(`\n${bad} gate failure(s) vs baseline`); process.exit(1); }
  console.log('baseline gates: all pass');
}
