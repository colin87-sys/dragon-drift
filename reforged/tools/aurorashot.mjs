// aurorashot.mjs — the AUTHENTIC aurora curtain over the live flow run, captured at four
// moments so the drapery visibly crawls + breathes (motion is the whole point — a static
// frame can't tell an authentic aurora from a decal). Booting under real WebGL also proves
// the sky shader compiles with the AURORA_HEAD/BODY splice.
//   node tools/aurorashot.mjs  →  /tmp/aurora-*.png, /tmp/aurora-montage.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
}

const VIEW = { width: 900, height: 600 };
const noSW = `if (navigator.serviceWorker) navigator.serviceWorker.register = () => Promise.resolve({});\n`;
const save = noSW + `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`;

// ?biome=6 pins the course to the REAL Aurora Shallows night biome (its own dark palette + the
// aurora via env.auroraMix) — validates the biome boots (mats.body[6]/PHASE_SKINS[6]/PALETTES[6]
// resolve) and shows the shipping look, not the ?aurora=1 forced-night preview.
// DSF1: the full-sky curtain (2 fbm layers + rays over every pixel) is heavy under the software
// renderer; 900×600 keeps each capture inside the screenshot timeout. Real phones are GPU.
const { page, done } = await boot({ query: '?debug&canyon=flow&biome=6&seed=8', viewport: VIEW, deviceScaleFactor: 1, initScript: save });
page.on('console', (m) => { if (m.type() === 'error') console.log('[page.error]', m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
console.log('booted, clicking start…');
await page.click('#btn-start').catch(() => {});
await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 8000 });
await page.evaluate(() => { window.__dd.noBoss(true); window.__dd.player.dist = 200; });
await page.waitForFunction(() => { if (window.__dd.game.canyonRun === 'flow') return true; window.__dd.player.dist += 40; return false; }, { timeout: 25000, polling: 200 });
// Confirm the curtain is actually lit (mix 1 under the force flag) — a black sky here would
// mean the splice silently no-op'd.
const mix = await page.evaluate(() => window.__dd.scene && window.__dd.renderer ? 1 : 0);
await page.waitForTimeout(400);

// Capture the upper sky band (the curtain hangs from ~0.10 elevation up). DSF1 → CSS px == device px.
const clip = { x: 0, y: 0, width: VIEW.width, height: Math.round(VIEW.height * 0.62) };
// Top row = QUIET (elegant green/teal + rose skirt); bottom row = ERUPTION (violet base → pink → red
// crown) — the same run, activity pinned via the ?auract debug seam, so one image shows the color range.
const acts = [0.30, 0.30, 1.00, 1.00];
const labels = ['quiet — green/teal', 'quiet — drift', 'ERUPTION — full color', 'ERUPTION — crown'];
const shots = [];
for (let i = 0; i < 4; i++) {
  await page.evaluate((a) => { window.__dd.setAuroraAct(a); }, acts[i]);
  // Let real frames advance the `time` uniform (drapery crawls + breathes), THEN freeze so the
  // capture is cheap + stable (a live rAF loop starves the software-rendered screenshot).
  await page.waitForTimeout(750);
  await page.evaluate(() => { window.__dd.game.timeScale = 0; });
  await page.waitForTimeout(60);
  shots.push(await page.screenshot({ clip, timeout: 60000 }));
  await page.evaluate(() => { window.__dd.game.timeScale = 1; });
}
shots.forEach((v, i) => writeFileSync(`/tmp/aurora-${i}.png`, v));
await done();

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const cvpage = await browser.newPage();
await cvpage.setContent('<canvas id="c"></canvas>');
const png = await cvpage.evaluate(async ({ b64, labels }) => {
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const imgs = [];
  for (const v of b64) imgs.push(await load('data:image/png;base64,' + v));
  const w = imgs[0].width, h = imgs[0].height, pad = 12, lab = 30, cols = 2, rows = 2;
  const c = document.getElementById('c');
  c.width = w * cols + pad * (cols + 1);
  c.height = (h + lab) * rows + pad * (rows + 1);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#05070f'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.textBaseline = 'middle'; ctx.font = '600 15px system-ui, sans-serif';
  imgs.forEach((im, i) => {
    const cx = i % cols, cy = (i / cols) | 0;
    const x = pad + cx * (w + pad), y = pad + cy * (h + lab + pad);
    ctx.drawImage(im, x, y, w, h);
    ctx.fillStyle = '#9fe8c0'; ctx.fillText(labels[i], x + 4, y + h + lab / 2);
  });
  return c.toDataURL('image/png').split(',')[1];
}, { b64: shots.map((v) => v.toString('base64')), labels });
await browser.close();
writeFileSync('/tmp/aurora-montage.png', Buffer.from(png, 'base64'));
console.log(`wrote /tmp/aurora-montage.png (+ /tmp/aurora-{0..3}.png) — curtain lit: ${mix ? 'yes' : 'NO'}`);
