// atmosshot.mjs — N8 atmosphere A/B (GRAPHICS-OVERHAUL.md). Warps to the two hero
// biomes and shoots the same frozen frame with atmosphere OFF and ON (?atmos), so
// the owner can judge the height-fog (Emberfall) and sunward inscatter (Frozen
// Reach). Emberfall = dist ~5250 (biome idx 3), Frozen Reach = dist ~3750 (idx 2).
//   node tools/atmosshot.mjs  →  /tmp/atmos-*.png, /tmp/atmos-montage.png
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

async function capture(dist, atmos, bank = false) {
  const query = `?debug&cleanshot&seed=73101${atmos ? '&atmos' : ''}`;
  const { page, done } = await boot({ query, viewport: VIEW, deviceScaleFactor: 2, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.distance >= 20, { timeout: 18000 }).catch(() => {});
  // Warp to the target biome and hold the boss off so the fog/sky settle cleanly.
  await page.evaluate((d) => { window.__dd.noBoss(true); window.__dd.player.dist = d; }, dist);
  // Wait until the sim has actually advanced PAST the warp target (the world has
  // recycled + the fog lerp has run) before freezing — a fixed sleep occasionally
  // froze on a not-yet-rendered black frame.
  await page.waitForFunction((d) => window.__dd.player.dist > d + 40, { timeout: 8000 }, dist).catch(() => {});
  await page.waitForTimeout(1800); // fog/sky lerp toward the biome
  await page.evaluate(() => { window.__dd.game.timeScale = 0; });
  // Bank/pitch the (now-frozen) camera to prove the world reconstruction is
  // correct under rotation — the per-fragment fog recomputes against the rotated
  // viewMatrix, so any reconstruction bug would show as fog leaning the wrong way.
  if (bank) await page.evaluate(() => { const c = window.__dd.camera; c.rotation.z += 0.38; c.rotation.x -= 0.28; c.updateMatrixWorld(); });
  await page.waitForTimeout(140);
  const buf = await page.screenshot();
  await done();
  return buf;
}

const EMBER = 5250, FROZEN = 3750;
const shots = {
  emberOff: await capture(EMBER, false), emberOn: await capture(EMBER, true),
  frozenOff: await capture(FROZEN, false), frozenOn: await capture(FROZEN, true),
  emberBank: await capture(EMBER, true, true),
};
for (const [k, v] of Object.entries(shots)) writeFileSync(`/tmp/atmos-${k}.png`, v);

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
const png = await page.evaluate(async (b64) => {
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const imgs = {};
  for (const [k, v] of Object.entries(b64)) imgs[k] = await load('data:image/png;base64,' + v);
  const w = imgs.emberOff.width, h = imgs.emberOff.height, pad = 12, lab = 34;
  const c = document.getElementById('c');
  c.width = w * 2 + pad * 3;
  c.height = (h + lab) * 3 + pad * 4;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, c.width, c.height);
  const cells = [
    [imgs.emberOff, 'EMBERFALL — atmosphere OFF (shipped)', 0, 0],
    [imgs.emberOn, 'EMBERFALL — atmosphere ON (height fog; rock gates sink into it)', 1, 0],
    [imgs.frozenOff, 'FROZEN REACH — atmosphere OFF (shipped)', 0, 1],
    [imgs.frozenOn, 'FROZEN REACH — atmosphere ON (sunward inscatter)', 1, 1],
    [imgs.emberBank, 'EMBERFALL — ON, camera BANKED (reconstruction correct under roll/pitch)', 0, 2],
  ];
  ctx.textBaseline = 'middle'; ctx.font = '600 15px system-ui, sans-serif';
  for (const [im, label, col, row] of cells) {
    const x = pad + col * (w + pad);
    const y = pad + row * (h + lab + pad);
    ctx.drawImage(im, x, y, w, h);
    ctx.fillStyle = '#cfe0ff'; ctx.fillText(label, x + 4, y + h + lab / 2);
  }
  return c.toDataURL('image/png');
}, Object.fromEntries(Object.entries(shots).map(([k, v]) => [k, v.toString('base64')])));
await browser.close();
writeFileSync('/tmp/atmos-montage.png', Buffer.from(png.split(',')[1], 'base64'));
console.log('wrote /tmp/atmos-montage.png — judge the height fog (Emberfall) + sunward inscatter (Frozen Reach)');
