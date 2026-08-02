// Real behind-view gameplay screenshots: boots the game with a seeded dragon
// tier, starts a run, and screenshots the live canvas (the actual chase cam) at
// 2× scale, cropped tight to the dragon so the silhouette is actually legible.
// Then composites all four tiers into one labelled montage.
//   node tools/gameshots.mjs [dragonKey]
//     → /tmp/game-<key>-t<tier>.png   (per-tier crop)
//     → /tmp/game-<key>-montage.png   (T0..T3 side by side)
import { writeFileSync, readFileSync } from 'fs';
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { boot } from '../tests/browser.mjs';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
}

const key = process.argv[2] || 'solar';
const VIEW = { width: 1100, height: 720 };
// The chase cam keeps the dragon centred and a little below the midline; crop a
// window around it so the rear silhouette fills the frame.
const CLIP = { x: 300, y: 250, width: 500, height: 360 };
const TIER_NAMES = ['T0 · Whelp', 'T1 · Kindled', 'T2 · Radiant', 'T3 · Sovereign'];
const paths = [];

for (const t of [0, 1, 2, 3]) {
  const { page, done } = await boot({
    query: '?debug',
    viewport: VIEW,
    deviceScaleFactor: 2,
    initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
      v: 2, embers: 50,
      skins: { owned: ['${key}'], equipped: '${key}' },
      ascension: { tiers: [['${key}', ${t}]], radiance: [] },
      cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
      flags: { seenFirstSurge: true, hintsSeen: 9 },
      settings: { reticle: false, slowMo: true, qualityOverride: null },
    }))`,
  });
  await page.click('#btn-start').catch(() => {});
  await page.waitForTimeout(2200); // let it climb into steady flight
  const out = `/tmp/game-${key}-t${t}.png`;
  await page.screenshot({ path: out, clip: { ...CLIP, x: CLIP.x, y: CLIP.y } });
  paths.push(out);
  console.log(`wrote ${out}`);
  await done();
}

// --- Montage: load the four crops into a canvas and stitch with labels -------
const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
const dataUrls = paths.map(p => 'data:image/png;base64,' + readFileSync(p).toString('base64'));
const png = await page.evaluate(async ({ dataUrls, labels }) => {
  const load = (src) => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const imgs = await Promise.all(dataUrls.map(load));
  const w = imgs[0].width, h = imgs[0].height, pad = 10, lab = 40;
  const c = document.getElementById('c');
  c.width = w * 4 + pad * 5; c.height = h + pad * 2 + lab;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, c.width, c.height);
  imgs.forEach((im, i) => {
    const x = pad + i * (w + pad);
    ctx.drawImage(im, x, pad, w, h);
    ctx.strokeStyle = 'rgba(140,200,255,0.18)'; ctx.strokeRect(x, pad, w, h);
    ctx.fillStyle = '#ffd86a'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(labels[i], x + w / 2, h + pad + 28);
  });
  return c.toDataURL('image/png').split(',')[1];
}, { dataUrls, labels: TIER_NAMES });
const outMontage = `/tmp/game-${key}-montage.png`;
writeFileSync(outMontage, Buffer.from(png, 'base64'));
console.log(`wrote ${outMontage}`);
await browser.close();
