// watershot.mjs — N10a water-swell A/B (GRAPHICS-OVERHAUL.md). The living horizon
// is a MOTION judgment, so this shoots a low camera aimed at the horizon in the
// hero reflective biome (Sunken Sanctuary): swell OFF (dead-flat horizon), swell ON
// (undulating), and swell ON 1.5s later (the horizon silhouette has moved — the
// motion proxy). Plus an Amber Wastes ON for a second read.
//   node tools/watershot.mjs  →  /tmp/water-*.png, /tmp/water-montage.png
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
const noSW = `if (navigator.serviceWorker) { navigator.serviceWorker.register = () => Promise.resolve({}); };\n`;
const save = noSW + `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['azure'], equipped: 'azure' },
  ascension: { tiers: [['azure', 2]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: true, qualityOverride: 0 },
}))`;

async function capture(dist, swell) {
  const query = `?debug&cleanshot&seed=73101${swell ? '&swell' : ''}`;
  const { page, done } = await boot({ query, viewport: VIEW, deviceScaleFactor: 2, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.distance >= 20, { timeout: 18000 }).catch(() => {});
  await page.evaluate((d) => { window.__dd.noBoss(true); window.__dd.player.dist = d; }, dist);
  await page.waitForFunction((d) => window.__dd.player.dist > d + 40, { timeout: 8000 }, dist).catch(() => {});
  await page.waitForTimeout(1600);
  await page.evaluate(() => { window.__dd.game.timeScale = 0; });
  // Drop the camera low + level so the horizon fills the mid-frame (where the swell
  // reads as an undulating silhouette vs the dead-flat OFF line).
  await page.evaluate(() => { const c = window.__dd.camera; c.position.y = 3.6; c.rotation.x += 0.12; c.updateMatrixWorld(); });
  await page.waitForTimeout(120);
  const buf = await page.screenshot();
  await done();
  return buf;
}

const SANC = 400, WASTES = 2050; // off the mega-arch midpoints (750/2250) → open vantage
const shots = {
  sancOff: await capture(SANC, false), sancOn: await capture(SANC, true),
  wasteOff: await capture(WASTES, false), wasteOn: await capture(WASTES, true),
};
for (const [k, v] of Object.entries(shots)) writeFileSync(`/tmp/water-${k}.png`, v);

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
const png = await page.evaluate(async (b64) => {
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const imgs = {};
  for (const [k, v] of Object.entries(b64)) imgs[k] = await load('data:image/png;base64,' + v);
  const w = imgs.sancOff.width, h = imgs.sancOff.height, pad = 12, lab = 34;
  const c = document.getElementById('c');
  c.width = w * 2 + pad * 3; c.height = (h + lab) * 2 + pad * 3;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, c.width, c.height);
  const cells = [
    [imgs.sancOff, 'SANCTUARY — swell OFF (flat horizon, shipped)', 0, 0],
    [imgs.sancOn, 'SANCTUARY — swell ON (living horizon)', 1, 0],
    [imgs.wasteOff, 'AMBER WASTES — swell OFF (flat, shipped)', 0, 1],
    [imgs.wasteOn, 'AMBER WASTES — swell ON (living horizon)', 1, 1],
  ];
  ctx.textBaseline = 'middle'; ctx.font = '600 15px system-ui, sans-serif';
  for (const [im, label, col, row] of cells) {
    const x = pad + col * (w + pad), y = pad + row * (h + lab + pad);
    ctx.drawImage(im, x, y, w, h);
    ctx.fillStyle = '#cfe0ff'; ctx.fillText(label, x + 4, y + h + lab / 2);
  }
  return c.toDataURL('image/png');
}, Object.fromEntries(Object.entries(shots).map(([k, v]) => [k, v.toString('base64')])));
await browser.close();
writeFileSync('/tmp/water-montage.png', Buffer.from(png.split(',')[1], 'base64'));
console.log('wrote /tmp/water-montage.png — judge the horizon: flat (off) vs undulating (on), and rolled at +1.5s');
