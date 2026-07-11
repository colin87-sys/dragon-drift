// depthshot.mjs — N10b water-depth A/B (GRAPHICS-OVERHAUL.md). The Beer–Lambert
// mix is view-angle dependent, so this shoots the standard chase view (glancing →
// the deeps read dark) in two hero biomes: Sunken Sanctuary (dusk, murky) and
// Frozen Reach (glassiest), depth OFF vs ON (?depth).
//   node tools/depthshot.mjs  →  /tmp/depth-*.png, /tmp/depth-montage.png
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

async function capture(dist, depth) {
  const query = `?debug&cleanshot&seed=73101${depth ? '&depth' : ''}`;
  const { page, done } = await boot({ query, viewport: VIEW, deviceScaleFactor: 2, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.distance >= 20, { timeout: 18000 }).catch(() => {});
  // Warp AND freeze in the same tick, so the input-less dragon never flies (and so
  // never dies into an obstacle at far distances — the old wait-then-freeze lost
  // far-biome cells to the menu). The biome/fog/water are distance-driven, so they
  // snap to the warp target on the next few frozen frames.
  await page.evaluate((d) => { window.__dd.noBoss(true); window.__dd.player.dist = d; window.__dd.game.timeScale = 0; }, dist);
  await page.waitForTimeout(500);
  const buf = await page.screenshot();
  await done();
  return buf;
}

const SANC = 400, FROZEN = 3750;
const shots = {
  sancOff: await capture(SANC, false), sancOn: await capture(SANC, true),
  frozenOff: await capture(FROZEN, false), frozenOn: await capture(FROZEN, true),
};
for (const [k, v] of Object.entries(shots)) writeFileSync(`/tmp/depth-${k}.png`, v);

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
    [imgs.sancOff, 'SANCTUARY — depth OFF (flat tint, shipped)', 0, 0],
    [imgs.sancOn, 'SANCTUARY — depth ON (dark deeps, bright look-down)', 1, 0],
    [imgs.frozenOff, 'FROZEN REACH — depth OFF (shipped)', 0, 1],
    [imgs.frozenOn, 'FROZEN REACH — depth ON', 1, 1],
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
writeFileSync('/tmp/depth-montage.png', Buffer.from(png.split(',')[1], 'base64'));
console.log('wrote /tmp/depth-montage.png — judge the depth: flat tint (off) vs dark-deeps/bright-shallows (on)');
