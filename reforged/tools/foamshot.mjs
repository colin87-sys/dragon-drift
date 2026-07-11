// foamshot.mjs — N10c foam-collar A/B (GRAPHICS-OVERHAUL.md). Low camera near the
// props with the swell ON, foam OFF vs ON (?foam), so the owner can judge the
// collars welding the bases into the sea. Sanctuary (towers/columns) + Frozen Reach
// (crystals).
//   node tools/foamshot.mjs  →  /tmp/foam-*.png, /tmp/foam-montage.png
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

// swell is ON in both cells (foam rides it); foam toggled. Freeze-at-warp so far
// biomes don't drop to the menu.
async function capture(dist, foam) {
  const query = `?debug&cleanshot&seed=73101&swell${foam ? '&foam' : ''}`;
  const { page, done } = await boot({ query, viewport: VIEW, deviceScaleFactor: 2, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.distance >= 20, { timeout: 18000 }).catch(() => {});
  await page.evaluate((d) => { window.__dd.noBoss(true); window.__dd.player.dist = d; window.__dd.game.timeScale = 0; }, dist);
  await page.waitForTimeout(500);
  // Default frozen chase view — the near foreground prop bases (their collars) sit in
  // the lower frame. (The chase-cam controller re-applies the camera each render even
  // when frozen, so manual reposition doesn't hold; the chase framing reads fine.)
  await page.waitForTimeout(100);
  const buf = await page.screenshot();
  await done();
  return buf;
}

const SANC = 300, FROZEN = 3600;
const shots = {
  sancOff: await capture(SANC, false), sancOn: await capture(SANC, true),
  frozenOff: await capture(FROZEN, false), frozenOn: await capture(FROZEN, true),
};
for (const [k, v] of Object.entries(shots)) writeFileSync(`/tmp/foam-${k}.png`, v);

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
    [imgs.sancOff, 'SANCTUARY — foam OFF (bases float, shipped)', 0, 0],
    [imgs.sancOn, 'SANCTUARY — foam ON (collars weld them in)', 1, 0],
    [imgs.frozenOff, 'FROZEN REACH — foam OFF (shipped)', 0, 1],
    [imgs.frozenOn, 'FROZEN REACH — foam ON', 1, 1],
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
writeFileSync('/tmp/foam-montage.png', Buffer.from(png.split(',')[1], 'base64'));
console.log('wrote /tmp/foam-montage.png — judge the foam collars welding the prop bases into the sea');
