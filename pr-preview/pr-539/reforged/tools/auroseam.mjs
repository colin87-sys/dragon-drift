// auroseam.mjs — PR-4 THE FLIP seam proof: the curtain must DAWN into the world and DIE out of it,
// not switch on. Drives the REAL cycle (no ?biome force) and steps the player distance across the two
// aurora seams, so the aurora pre-ramp (450m in / 300m out) and the continuous god-ray gate are
// visible as a crossfade. Block layout at L=1500 (CYCLE=[0,1,2,3,4,6,5]): Mire=block4 [6000,7500),
// AURORA=block5 [7500,9000), Astral=block6 [9000,10500).
//   node tools/auroseam.mjs  →  /tmp/auroseam-in.png (Mire→Aurora), /tmp/auroseam-out.png (Aurora→Astral)
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

const VIEW = { width: 760, height: 500 };
const noSW = `if (navigator.serviceWorker) navigator.serviceWorker.register = () => Promise.resolve({});\n`;
const save = noSW + `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`;

// NO biome force — the live cycle decides the biome from player.dist, which is the whole point.
const { page, done } = await boot({ query: '?debug&seed=8', viewport: VIEW, deviceScaleFactor: 1, initScript: save });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
console.log('booted, clicking start…');
await page.click('#btn-start').catch(() => {});
await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 8000 });
await page.evaluate(() => { window.__dd.noBoss(true); window.__dd.setQuality(0); });
await page.waitForTimeout(300);

const clip = { x: 0, y: 0, width: VIEW.width, height: Math.round(VIEW.height * 0.62) };
async function strip(dists, outPath, tint) {
  const shots = [];
  for (const d of dists) {
    // Park the player at the sample distance and let a few frames drive env(dist) (sky/water/aurora
    // recompute per frame from computeEnv), then read the live auroraMix so the label is honest.
    await page.evaluate((dd) => { window.__dd.player.dist = dd; }, d);
    await page.waitForTimeout(260);
    const mix = await page.evaluate(() => (window.__dd.auroraMix ? window.__dd.auroraMix() : -1));
    await page.evaluate(() => { window.__dd.game.timeScale = 0; });
    await page.waitForTimeout(50);
    shots.push({ png: await page.screenshot({ clip, timeout: 60000 }), label: `${d}m` + (mix >= 0 ? `  mix ${mix.toFixed(2)}` : '') });
    await page.evaluate(() => { window.__dd.game.timeScale = 1; });
  }
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const cvpage = await browser.newPage();
  await cvpage.setContent('<canvas id="c"></canvas>');
  const png = await cvpage.evaluate(async ({ b64, labels, tint }) => {
    const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const imgs = [];
    for (const v of b64) imgs.push(await load('data:image/png;base64,' + v));
    const w = imgs[0].width, h = imgs[0].height, pad = 6, lab = 22, cols = 3, rows = Math.ceil(imgs.length / 3);
    const c = document.getElementById('c');
    c.width = w * cols + pad * (cols + 1);
    c.height = (h + lab) * rows + pad * (rows + 1);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#05070f'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.textBaseline = 'middle'; ctx.font = '600 13px system-ui, sans-serif';
    imgs.forEach((im, i) => {
      const cx = i % cols, cy = (i / cols) | 0;
      const x = pad + cx * (w + pad), y = pad + cy * (h + lab + pad);
      ctx.drawImage(im, x, y, w, h);
      ctx.fillStyle = tint; ctx.fillText(labels[i], x + 4, y + h + lab / 2);
    });
    return c.toDataURL('image/png').split(',')[1];
  }, { b64: shots.map((s) => s.png.toString('base64')), labels: shots.map((s) => s.label), tint });
  await browser.close();
  writeFileSync(outPath, Buffer.from(png, 'base64'));
}

// Entry: Mire's last 600m (ramp-in fires at 7050) through the aurora's first 300m.
await strip([6900, 7050, 7200, 7350, 7500, 7800], '/tmp/auroseam-in.png', '#9fe8c0');
// Exit: the aurora's last 450m (ramp-out fires at 8700) through Astral's first 450m.
await strip([8550, 8700, 8850, 9000, 9200, 9450], '/tmp/auroseam-out.png', '#c9b0ff');
await done();
console.log('wrote /tmp/auroseam-in.png (Mire→Aurora) + /tmp/auroseam-out.png (Aurora→Astral)');
