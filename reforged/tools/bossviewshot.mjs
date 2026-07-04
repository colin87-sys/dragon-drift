// tools/bossviewshot.mjs — canonical DETERMINISTIC design-review captures.
//
//   node tools/bossviewshot.mjs <bossId> [round]
//     → reforged-captures/<bossId>-bv-<name>-<round>.png (one per canonical frame)
//
// Drives tools/bossview.html (the isolated, seeded, fixed-timestep boss stage)
// through its window.renderState hook. Every frame is a pure function of
// (seed, t, dials, camera): re-running this script reproduces byte-identical
// pixels, so review rounds — human or gate agent — always judge the SAME look
// instead of racing a live fight's sweep/blink/gaze phases (the in-game
// capture-consistency problem that burned CP1 rounds 1–10).
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
const pw = (() => {
  const c = [];
  try { c.push(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
})();

const bossId = process.argv[2] || 'marrowcoil';
const round = process.argv[3] || 'r1';
const SEED = 1;

// The canonical frame set. t values are chosen against the coil period (~5.5s)
// so 'idle' vs 'coilsweep' are provably different poses of the same loop.
const FRAMES = [
  { name: 'idle',            o: { t: 1.0, yaw: 0, pitch: -0.12 } },
  { name: 'coilsweep',       o: { t: 3.7, yaw: 0, pitch: -0.12 } },
  { name: 'charge',          o: { t: 1.0, charge: 1, yaw: 0, pitch: -0.12 } },
  { name: 'profile',         o: { t: 1.0, yaw: 80, pitch: 0.02 } },
  { name: 'ribcage',         o: { t: 1.0, yaw: 0, pitch: -0.05, focus: 'ribPivot', distMul: 0.62 } },
  { name: 'tunnel',          o: { t: 1.0, yaw: 0, pitch: 0.0, focus: 'ribPivot', distMul: 0.4 } },
  { name: 'skullidle',       o: { t: 1.0, yaw: 0, pitch: 0.0, focus: 'skullGroup', distMul: 0.3 } },
  { name: 'skullidle-prof',  o: { t: 1.0, yaw: 65, pitch: 0.02, focus: 'skullGroup', distMul: 0.3 } },
  { name: 'skullcharge',     o: { t: 1.0, charge: 1, yaw: 0, pitch: 0.0, focus: 'skullGroup', distMul: 0.3 } },
  { name: 'skullcharge-prof',o: { t: 1.0, charge: 1, yaw: 50, pitch: 0.02, focus: 'skullGroup', distMul: 0.3 } },
  { name: 'scar',            o: { t: 1.0, yaw: 0, pitch: -0.05, focus: 'marrowScar', distMul: 0.2 } },
  { name: 'ribroot',         o: { t: 1.0, yaw: 0, pitch: 0.1, focus: 'ribPivot', distMul: 0.26 } },
  { name: 'ribroot-offaxis', o: { t: 1.0, yaw: 30, pitch: 0.1, focus: 'ribPivot', distMul: 0.26 } },
  { name: 'dread',           o: { t: 2.0, sp: 0.75, spmode: 'closingRibs', yaw: 0, pitch: -0.05, focus: 'ribPivot', distMul: 0.55 } },
  { name: 'shielded',        o: { t: 1.0, shield: true, yaw: 0, pitch: -0.12 } },
  { name: 'death',           o: { t: 1.0, death: 0.55, yaw: 0, pitch: -0.12 } },
];

const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 860, height: 860 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/bossview.html?boss=${bossId}&seed=${SEED}`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });

// Hide the DOM chrome — captures are the canvas only.
await page.evaluate(() => { for (const id of ['hud', 'panel', 'time', 'bosses']) document.getElementById(id).style.display = 'none'; });

for (const f of FRAMES) {
  await page.evaluate((o) => window.renderState(o), { boss: bossId, seed: SEED, ...f.o });
  const path = `reforged-captures/${bossId}-bv-${f.name}-${round}.png`;
  await page.screenshot({ path, clip: { x: 30, y: 30, width: 800, height: 800 } });
  console.log('wrote', path);
}
await browser.close();
srv.close?.();
process.exit(0);
