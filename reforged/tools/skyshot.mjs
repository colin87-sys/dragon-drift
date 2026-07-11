// skyshot.mjs — N9 sky-clouds A/B (GRAPHICS-OVERHAUL.md). The two hero cloud
// biomes (Sunken Sanctuary ~dist 750, Amber Wastes ~dist 2250) shot with clouds
// OFF and ON (?clouds), so the owner can judge the cloud band + silver lining +
// drift. Camera pitched up a touch so the sky fills more of the frame.
//   node tools/skyshot.mjs  →  /tmp/sky-*.png, /tmp/sky-montage.png
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
// Block the service worker so every boot serves the CURRENT on-disk build (the SW
// otherwise caches an older stamp → the A/B compares different builds).
const noSW = `if (navigator.serviceWorker) { navigator.serviceWorker.register = () => Promise.resolve({}); };\n`;
const save = noSW + `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['azure'], equipped: 'azure' },
  ascension: { tiers: [['azure', 2]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: true, qualityOverride: 0 },
}))`;

async function capture(dist, clouds) {
  const query = `?debug&cleanshot&seed=73101${clouds ? '&clouds' : ''}`;
  const { page, done } = await boot({ query, viewport: VIEW, deviceScaleFactor: 2, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.distance >= 20, { timeout: 18000 }).catch(() => {});
  await page.evaluate((d) => { window.__dd.noBoss(true); window.__dd.player.dist = d; }, dist);
  await page.waitForFunction((d) => window.__dd.player.dist > d + 40, { timeout: 8000 }, dist).catch(() => {});
  await page.waitForTimeout(1600);
  await page.evaluate(() => { window.__dd.game.timeScale = 0; });
  // Pitch the frozen camera up hard so the cloud band (h~0.03..0.72) fills the frame.
  await page.evaluate(() => { const c = window.__dd.camera; c.rotation.x += 0.55; c.updateMatrixWorld(); });
  await page.waitForTimeout(120);
  const buf = await page.screenshot();
  await done();
  return buf;
}

// Off the biome midpoints (750 / 2250 sit right on a mega-arch → occluded vantage).
const SANCTUARY = 400, WASTES = 2600;
const shots = {
  sancOff: await capture(SANCTUARY, false), sancOn: await capture(SANCTUARY, true),
  wasteOff: await capture(WASTES, false), wasteOn: await capture(WASTES, true),
};
for (const [k, v] of Object.entries(shots)) writeFileSync(`/tmp/sky-${k}.png`, v);

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
    [imgs.sancOff, 'SUNKEN SANCTUARY — clouds OFF (shipped)', 0, 0],
    [imgs.sancOn, 'SUNKEN SANCTUARY — clouds ON', 1, 0],
    [imgs.wasteOff, 'AMBER WASTES — clouds OFF (shipped)', 0, 1],
    [imgs.wasteOn, 'AMBER WASTES — clouds ON', 1, 1],
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
writeFileSync('/tmp/sky-montage.png', Buffer.from(png.split(',')[1], 'base64'));
console.log('wrote /tmp/sky-montage.png — judge the cloud band, silver lining, and that the OFF frames are the shipped gradient');
