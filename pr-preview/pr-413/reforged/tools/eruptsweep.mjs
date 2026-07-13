// eruptsweep.mjs — the aurora ERUPTION at escalating strengths, so the owner can pick a target
// (they'd only ever seen the dragon-SURGE magenta, never the aurora's own eruption). Pins uAurErupt
// directly via the __dd.setAuroraErupt debug seam (bypasses the 0.45 peak cap). NO surge here — pure
// aurora eruption over the real biome-6 night sky.
//   node tools/eruptsweep.mjs  →  /tmp/aurora-montage.png (+ /tmp/aurora-{0..3}.png)
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

const { page, done } = await boot({ query: '?debug&canyon=flow&biome=6&seed=8', viewport: VIEW, deviceScaleFactor: 1, initScript: save });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
console.log('booted, clicking start…');
await page.click('#btn-start').catch(() => {});
await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 8000 });
await page.evaluate(() => { window.__dd.noBoss(true); window.__dd.player.dist = 200; window.__dd.game.feverActive = false; window.__dd.game.feverTimer = 0; });
await page.waitForFunction(() => { if (window.__dd.game.canyonRun === 'flow') return true; window.__dd.player.dist += 40; return false; }, { timeout: 25000, polling: 200 });
await page.waitForTimeout(400);

const clip = { x: 0, y: 0, width: VIEW.width, height: Math.round(VIEW.height * 0.62) };
// uAurErupt levels: 0.45 = the current SHIPPED cap; ×2 ≈ the pre-dial-down gains (I cut the color
// gains ~half), so 0.9 ≈ "before"; 1.4 / 2.0 = pushed past it so the full range is visible.
const cells = [
  { erupt: 0.45, label: 'CURRENT (shipped, restrained)' },
  { erupt: 0.90, label: '≈ before the dial-down' },
  { erupt: 1.40, label: 'strong' },
  { erupt: 2.00, label: 'MAX (full explosion)' },
];
const labels = cells.map((c) => c.label);
const shots = [];
for (const c of cells) {
  await page.evaluate((cc) => { window.__dd.setAuroraErupt(cc.erupt); }, c);
  await page.waitForTimeout(700);
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
    ctx.fillStyle = '#e0b0ff'; ctx.fillText(labels[i], x + 4, y + h + lab / 2);
  });
  return c.toDataURL('image/png').split(',')[1];
}, { b64: shots.map((v) => v.toString('base64')), labels });
await browser.close();
writeFileSync('/tmp/aurora-montage.png', Buffer.from(png, 'base64'));
console.log('wrote /tmp/aurora-montage.png (eruption strength sweep)');
