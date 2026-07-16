// bounce — render a Dragon Radio station to a mastered, dithered PCM16 WAV
// "single": the literal export-it-to-a-streaming-service artifact, and the
// listenable A/B file attached to audio PRs (per-phase hero WAVs vs the
// pre-overhaul reference bounces).
//
//   node tools/bounce.mjs skyborne            → /tmp/bounce-skyborne.wav (8 loops)
//   node tools/bounce.mjs skyborne 16         → 16 loops (~longer single)
//   node tools/bounce.mjs --all               → every station, 4 loops each
//
// Normalized to −14 LUFS integrated / ≤ −1 dBTP (0.6 dB sample-peak margin),
// TPDF-dithered 16-bit 44.1 kHz stereo.
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
}

const args = process.argv.slice(2);
const all = args.includes('--all');
const wanted = args.filter((a) => !a.startsWith('--') && !/^\d+$/.test(a));
const loops = Number(args.find((a) => /^\d+$/.test(a))) || (all ? 4 : 8);

const { chromium } = loadPlaywright();
const srv = await serve();
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => { console.error('PAGEERROR', String(e)); process.exitCode = 1; });
await page.goto(srv.url + '/tools/loudshots.html');
await page.waitForFunction(() => window.__ready, { timeout: 15000 });

const stations = await page.evaluate(() => window.__stations);
const targets = all ? stations : stations.filter((s) => wanted.includes(s.id));
if (!targets.length) {
  console.error('usage: node tools/bounce.mjs <station-id> [loops] | --all');
  process.exit(1);
}

for (const s of targets) {
  const { b64, metrics } = await page.evaluate(
    ([i, l]) => window.__bounce(i, { loops: l }), [s.i, loops]);
  const path = `/tmp/bounce-${s.id}.wav`;
  writeFileSync(path, Buffer.from(b64, 'base64'));
  console.log(`${path}  (${metrics.lufs} LUFS source, gain ${metrics.appliedGainDb} dB → -14 LUFS target)`);
}
await browser.close();
srv.close();
