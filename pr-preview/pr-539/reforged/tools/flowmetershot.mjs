// flowmetershot.mjs — the FLOW "Keystone Crest" meter A/B across its states, over the live
// flow-run scene. Four cells: cold (×1.0), climbing (with the best-notch above), capped
// (keystone ignited ×3.0), post-shatter (miss → ×1.0). Clipped to the centre-bottom crest.
//   node tools/flowmetershot.mjs  →  /tmp/flowmeter-*.png, /tmp/flowmeter-montage.png
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

const { page, done } = await boot({ query: '?debug&canyon=flow&seed=8', viewport: VIEW, deviceScaleFactor: 2, initScript: save });
await page.click('#btn-start').catch(() => {});
await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 8000 });
await page.evaluate(() => { window.__dd.noBoss(true); window.__dd.player.dist = 200; });
await page.waitForFunction(() => { if (window.__dd.game.canyonRun === 'flow') return true; window.__dd.player.dist += 40; return false; }, { timeout: 25000, polling: 200 });
await page.evaluate(() => { window.__dd.game.timeScale = 0; });
await page.waitForTimeout(300);

// The crest's clip region (device pixels), padded for context. Show it FIRST — it's
// display:none until a flow run toggles it on, so it has no box until then.
const clip = await page.evaluate(() => {
  const m = window.__dd.ui.flowMeter; m.show(true); m.set(0, 1.0, 0, 20);
  const r = document.getElementById('flow-crest').getBoundingClientRect();
  const pad = 56;   // Playwright clip is in CSS px (deviceScaleFactor is applied to the output)
  return { x: Math.max(0, r.left - pad), y: Math.max(0, r.top - pad), width: r.width + pad * 2, height: r.height + pad * 2 };
});

async function shot(fn) {
  await page.evaluate(fn);
  await page.waitForTimeout(220); // let the state's animation land
  return page.screenshot({ clip });
}
const shots = {
  cold:   await shot(() => { const m = window.__dd.ui.flowMeter; m.show(true); m.set(0, 1.0, 0, 20); }),
  climb:  await shot(() => { window.__dd.ui.flowMeter.set(8, 1.8, 15, 20); }),   // fill at 8, best-notch at 15
  capped: await shot(() => { window.__dd.ui.flowMeter.set(20, 3.0, 20, 20); }),  // keystone ignited
  miss:   await shot(() => { window.__dd.ui.flowMeter.drop(0, 1.0, 20); }),      // shatter → cold
};
for (const [k, v] of Object.entries(shots)) writeFileSync(`/tmp/flowmeter-${k}.png`, v);
await done();

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const cvpage = await browser.newPage();
await cvpage.setContent('<canvas id="c"></canvas>');
const png = await cvpage.evaluate(async (b64) => {
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const imgs = {};
  for (const [k, v] of Object.entries(b64)) imgs[k] = await load('data:image/png;base64,' + v);
  const w = imgs.cold.width, h = imgs.cold.height, pad = 12, lab = 30;
  const c = document.getElementById('c');
  c.width = w * 4 + pad * 5; c.height = h + lab + pad * 2;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, c.width, c.height);
  const cells = [[imgs.cold, 'cold ×1.0'], [imgs.climb, 'climbing (best-notch)'], [imgs.capped, 'CAP — keystone ×3.0'], [imgs.miss, 'miss → shatter']];
  ctx.textBaseline = 'middle'; ctx.font = '600 14px system-ui, sans-serif';
  cells.forEach(([im, label], i) => {
    const x = pad + i * (w + pad), y = pad;
    ctx.drawImage(im, x, y, w, h);
    ctx.fillStyle = '#cfe0ff'; ctx.fillText(label, x + 4, y + h + lab / 2);
  });
  return c.toDataURL('image/png').split(',')[1];
}, Object.fromEntries(Object.entries(shots).map(([k, v]) => [k, v.toString('base64')])));
await browser.close();
writeFileSync('/tmp/flowmeter-montage.png', Buffer.from(png, 'base64'));
console.log('wrote /tmp/flowmeter-montage.png (+ /tmp/flowmeter-{cold,climb,capped,miss}.png)');
