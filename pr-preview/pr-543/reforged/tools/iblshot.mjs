// iblshot.mjs — N5 sky-IBL A/B (GRAPHICS-OVERHAUL.md).
// Same seeded frozen frame with sky-lighting OFF (shipped) and ON (?ibl), so the
// owner can judge whether the world picking up the sky's colour is an improvement.
//   node tools/iblshot.mjs  →  /tmp/ibl-off.png, /tmp/ibl-on.png, /tmp/ibl-montage.png
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
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['azure'], equipped: 'azure' },
  ascension: { tiers: [['azure', 2]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: true, qualityOverride: 0 },
}))`;

async function capture(ibl) {
  const query = `?debug&cleanshot&seed=73101${ibl ? '&ibl' : ''}`;
  const { page, done } = await boot({ query, viewport: VIEW, deviceScaleFactor: 2, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.distance >= 30, { timeout: 18000 }).catch(() => {});
  await page.evaluate(() => { window.__dd.game.timeScale = 0; });
  await page.waitForTimeout(120);
  const buf = await page.screenshot();
  await done();
  return buf;
}

const off = await capture(false);
const on = await capture(true);
writeFileSync('/tmp/ibl-off.png', off);
writeFileSync('/tmp/ibl-on.png', on);

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
const png = await page.evaluate(async ({ a, b }) => {
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const [ia, ib] = await Promise.all([load(a), load(b)]);
  const w = ia.width, h = ia.height, pad = 12, lab = 40;
  const c = document.getElementById('c');
  c.width = w * 2 + pad * 3; c.height = h + pad * 2 + lab;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, c.width, c.height);
  [[ia, 'sky lighting OFF (shipped)'], [ib, 'sky lighting ON (N5 probe)']].forEach(([im, label], i) => {
    const x = pad + i * (w + pad);
    ctx.drawImage(im, x, pad, w, h);
    ctx.strokeStyle = 'rgba(140,200,255,0.18)'; ctx.strokeRect(x, pad, w, h);
    ctx.fillStyle = '#ffd86a'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, h + pad + 30);
  });
  return c.toDataURL('image/png').split(',')[1];
}, { a: 'data:image/png;base64,' + off.toString('base64'), b: 'data:image/png;base64,' + on.toString('base64') });
writeFileSync('/tmp/ibl-montage.png', Buffer.from(png, 'base64'));
await browser.close();
console.log('wrote /tmp/ibl-montage.png — judge whether the world sitting in the sky colour looks better');
