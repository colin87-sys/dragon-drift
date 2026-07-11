// tonemapshots.mjs — N3 tone-map A/B (GRAPHICS-OVERHAUL.md).
// Boots the SAME seeded frame under ACES (shipped), AgX, and Khronos PBR Neutral
// and composites a labelled 3-wide montage for the human to judge on the PR
// preview — the one taste decision N3 exists to settle (which tonemapper keeps
// the game's gold/aurora/neon without washing them white).
//   node tools/tonemapshots.mjs [dragonKey] [seed]
//     → /tmp/tm-<mode>.png (×3) and /tmp/tonemap-montage.png
import { writeFileSync, readFileSync } from 'fs';
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

const args = process.argv.slice(2);
const key = args.find((a) => !a.startsWith('-') && !/^\d+$/.test(a)) || 'azure';
const seed = args.find((a) => /^\d+$/.test(a)) || '73101';
const VIEW = { width: 900, height: 600 };
const MODES = ['aces', 'agx', 'neutral'];
const LABELS = { aces: 'ACES (shipped)', agx: 'AgX', neutral: 'PBR Neutral' };
const saveFor = `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['${key}'], equipped: '${key}' },
  ascension: { tiers: [['${key}', 2]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: true, qualityOverride: 0 },
}))`;

const FREEZE_DIST = 30; // reachable under slow-mo (~5/s); same seeded course position across all three boots

const shots = {};
for (const mode of MODES) {
  // qualityOverride:0 pins tier0 → the composed OutputPass path (where the
  // CustomToneMapping/Neutral branch lives), and a fixed freeze distance makes
  // the three boots the same seeded frame — a fair tonal A/B.
  const query = `?debug&cleanshot&seed=${seed}&tm=${mode}`;
  const { page, done } = await boot({ query, viewport: VIEW, deviceScaleFactor: 2, initScript: saveFor });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction((d) => window.__dd && window.__dd.game && window.__dd.game.distance >= d, FREEZE_DIST, { timeout: 18000 }).catch(() => {});
  await page.evaluate(() => { window.__dd.game.timeScale = 0; }); // freeze the matched frame
  await page.waitForTimeout(120);
  const buf = await page.screenshot();
  writeFileSync(`/tmp/tm-${mode}.png`, buf);
  shots[mode] = 'data:image/png;base64,' + buf.toString('base64');
  console.log(`captured ${mode}`);
  await done();
}

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
const png = await page.evaluate(async ({ shots, MODES, LABELS }) => {
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const imgs = await Promise.all(MODES.map((m) => load(shots[m])));
  const w = imgs[0].width, h = imgs[0].height, pad = 12, lab = 40;
  const c = document.getElementById('c');
  c.width = w * imgs.length + pad * (imgs.length + 1); c.height = h + pad * 2 + lab;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, c.width, c.height);
  imgs.forEach((im, i) => {
    const x = pad + i * (w + pad);
    ctx.drawImage(im, x, pad, w, h);
    ctx.strokeStyle = 'rgba(140,200,255,0.18)'; ctx.strokeRect(x, pad, w, h);
    ctx.fillStyle = '#ffd86a'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(LABELS[MODES[i]], x + w / 2, h + pad + 30);
  });
  return c.toDataURL('image/png').split(',')[1];
}, { shots, MODES, LABELS });
writeFileSync('/tmp/tonemap-montage.png', Buffer.from(png, 'base64'));
await browser.close();
console.log(`wrote /tmp/tonemap-montage.png (${key}, seed ${seed}) — judge which keeps the gold/neon without washing to white`);
