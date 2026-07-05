// tools/dragonstudio.mjs — the §8 STUDIO CONTACT-SHEET driver for starter dragons.
//
//   node tools/dragonstudio.mjs <key> [round] [cp]
//     cp = cp1 (apex form: the CP1 set) | cp2 (all forms + ladder) | all
//     → reforged-captures/dragon-<key>-f<form>-<state>-<angle>[-<bg>]-rK.png
//     → reforged-captures/dragon-<key>-ladder-<bg>-rK.png   (cp2)
//
// Drives tools/dragonstudio.html through window.shot / window.ladder / window.maxTier.
// Every shot is DETERMINISTIC (no animation phase — a pure function of
// form/state/angle/bg via setFlapDebugPose), per reachable form (clamped to
// maxTierFor — no phantom T3), fill-the-frame crops (subject ≥60%, plus a 4× wing
// close-up for edge/gap/value judgment — §6.5a), and the three §8.2 backdrops with
// the PALE backdrop as the primary silhouette frame (§6.5b). Black-fill silhouettes
// come from tools/silhouette.mjs; face crops are rendered here at a front-¾ angle
// (headshot's rear tile clips — §6.5d).
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { mkdirSync } from 'fs';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
}

const key = process.argv[2] || 'azure';
const round = process.argv[3] || 'r1';
const cp = process.argv[4] || 'cp1';

// Rear chase + side + pinned rear-¾ bank + wing planform (top) + fold + wing close-up
// crop + face. Each carries the backdrops it should be judged on (pale primary).
const PALE_DARK = ['pale', 'dark'];
const SHOTS = [
  { state: 'glide', angle: 'rearchase', bgs: ['pale', 'dark', 'sunset'] }, // + warm-sky accent check
  { state: 'glide', angle: 'side',      bgs: PALE_DARK },
  { state: 'bank',  angle: 'rear34',    bgs: PALE_DARK },                   // pinned rear-¾ BANK
  { state: 'glide', angle: 'topplan',   bgs: PALE_DARK },                   // wing planform crop
  { state: 'glide', angle: 'wingcrop',  bgs: ['pale', 'dark', 'sunset'] },  // 4× wing close-up (edge/gap/value)
  { state: 'fold',  angle: 'rear34',    bgs: ['dark'] },                    // the fold contracts the span
  // Face crops come from tools/headshot.mjs (§8.2) — its 4-tile montage frames the
  // head correctly; the studio's own face view fights the crest-inflated head bbox.
];

mkdirSync('reforged-captures', { recursive: true });

const { chromium } = loadPlaywright();
const srv = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 960 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/dragonstudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
if (!(await page.evaluate((k) => !!window.hasDragon(k), key))) { console.log(`unknown dragon: ${key}`); await browser.close(); srv.close?.(); process.exit(1); }

const maxT = await page.evaluate((k) => window.maxTier(k), key);
const forms = cp === 'cp1' ? [maxT] : Array.from({ length: maxT + 1 }, (_, i) => i);

const glEl = await page.$('#gl');
const monEl = await page.$('#montage');
const written = [];
for (const form of forms) {
  for (const sh of SHOTS) {
    for (const bg of sh.bgs) {
      await page.evaluate(([k, f, st, an, b]) => window.shot(k, f, st, an, b), [key, form, sh.state, sh.angle, bg]);
      const suffix = bg === 'pale' ? '' : `-${bg}`;   // pale = the primary/unmarked frame
      const path = `reforged-captures/dragon-${key}-f${form}-${sh.state}-${sh.angle}${suffix}-${round}.png`;
      await glEl.screenshot({ path });
      written.push(path);
    }
  }
}

// CP2: the true-scale form-ladder montage (framed once by the apex), all backdrops.
if (cp !== 'cp1') {
  for (const bg of ['pale', 'dark', 'sunset']) {
    await page.evaluate(([k, b]) => window.ladder(k, b), [key, bg]);
    const path = `reforged-captures/dragon-${key}-ladder-${bg}-${round}.png`;
    await monEl.screenshot({ path });
    written.push(path);
  }
}

await browser.close();
srv.close?.();
console.log(`\n${written.length} studio captures written:`);
for (const p of written) console.log('  ' + p);
process.exit(0);
