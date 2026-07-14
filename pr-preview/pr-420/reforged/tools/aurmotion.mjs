// aurmotion.mjs — GATE-9 smoothness proof (issue 2: "the lines occasionally disappear or are erratic
// as I fly — make transitions smooth and gradual"). A FILMSTRIP of the tier1 curtain over LIVE motion
// (no freeze between frames): the flow run weaves the camera + the drapery crawls, so if the fract-seam
// pop / warp-drift / ray-strobe were still present a band would WINK between frames. Feathered seam +
// halved drift + turn-calm should make every ribbon fade smoothly. Also forces a hard yaw mid-strip.
//   node tools/aurmotion.mjs  →  /tmp/aurmotion-*.png, /tmp/aurmotion-strip.png
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

const VIEW = { width: 760, height: 480 };
const noSW = `if (navigator.serviceWorker) navigator.serviceWorker.register = () => Promise.resolve({});\n`;
const save = noSW + `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`;

const { page, done } = await boot({ query: '?debug&canyon=flow&biome=6&seed=8', viewport: VIEW, deviceScaleFactor: 1, initScript: save });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
console.log('booted, clicking start…');
await page.click('#btn-start').catch(() => {});
await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 8000 });
await page.evaluate(() => { window.__dd.noBoss(true); window.__dd.player.dist = 200; window.__dd.setQuality(1); window.__dd.setAuroraAct(0.55); });
await page.waitForFunction(() => { if (window.__dd.game.canyonRun === 'flow') return true; window.__dd.player.dist += 40; return false; }, { timeout: 25000, polling: 200 });
await page.waitForTimeout(400);

const clip = { x: 0, y: 0, width: VIEW.width, height: Math.round(VIEW.height * 0.6) };
const shots = [];
const N = 6;
for (let i = 0; i < N; i++) {
  // Force a hard camera yaw partway (frames 2..4) to exercise the turn-calm ray-soften path, then release.
  await page.evaluate((k) => {
    const dd = window.__dd;
    if (dd.camera) { dd.camera.rotation.y = (k >= 2 && k <= 4) ? (k - 3) * 0.6 : 0; dd.camera.updateMatrixWorld(); }
  }, i);
  await page.waitForTimeout(340);   // live frames advance between captures (crawl + damped re-centre)
  shots.push(await page.screenshot({ clip, timeout: 60000 }));
}
shots.forEach((v, i) => writeFileSync(`/tmp/aurmotion-${i}.png`, v));
await done();

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const cvpage = await browser.newPage();
await cvpage.setContent('<canvas id="c"></canvas>');
const png = await cvpage.evaluate(async ({ b64 }) => {
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const imgs = [];
  for (const v of b64) imgs.push(await load('data:image/png;base64,' + v));
  const w = imgs[0].width, h = imgs[0].height, pad = 6, cols = 2, rows = Math.ceil(imgs.length / 2);
  const c = document.getElementById('c');
  c.width = w * cols + pad * (cols + 1);
  c.height = h * rows + pad * (rows + 1);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#05070f'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.textBaseline = 'top'; ctx.font = '600 13px system-ui, sans-serif';
  imgs.forEach((im, i) => {
    const cx = i % cols, cy = (i / cols) | 0;
    const x = pad + cx * (w + pad), y = pad + cy * (h + pad);
    ctx.drawImage(im, x, y, w, h);
    ctx.fillStyle = '#ffe08a'; ctx.fillText('t' + i + (i >= 2 && i <= 4 ? ' (yaw)' : ''), x + 6, y + 6);
  });
  return c.toDataURL('image/png').split(',')[1];
}, { b64: shots.map((v) => v.toString('base64')) });
await browser.close();
writeFileSync('/tmp/aurmotion-strip.png', Buffer.from(png, 'base64'));
console.log('wrote /tmp/aurmotion-strip.png (tier1 live-motion filmstrip, frames 2-4 yawed)');
