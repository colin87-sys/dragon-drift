// FLAP-CYCLE STRIP — the chase-cam motion read we kept rebuilding as a throwaway, made permanent.
//
// Boots the real game, equips a yoke dragon at its apex form, starts a run, then FREEZES the wings at
// each named cycle point via the built-in `?wingDebug=<phase>` mode (dragon.js neutralises steering so
// the pose is pure solver output) and screenshots the live chase cam, cropped to the silhouette. The
// five frames montage into one strip so the whole beat reads from the EXACT gameplay camera — the angle
// that over-reads up-motion and under-reads down-motion, where motion bugs actually live.
//   node tools/flapstrip.mjs [dragonKey] [tier]
//     → /tmp/flap-<key>-<phase>.png   (per-phase crop)
//     → /tmp/flap-<key>-strip.png     (glide → recovery → apex → downstroke → settle)
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

const key = process.argv[2] || 'pearl';
const tier = Number(process.argv[3] ?? 3);
const VIEW = { width: 1100, height: 720 };
const CLIP = { x: 300, y: 250, width: 500, height: 360 };   // same window gameshots crops the chase cam to
// The five freeze points dragon.js / phaseCenter expose (up-low · dome · apex-V · mid-press · deep-bottom).
const PHASES = ['glide', 'recovery', 'apex', 'downstroke', 'settle'];
const paths = [];

for (const phase of PHASES) {
  const { page, done } = await boot({
    query: `?debug&wingDebug=${phase}`,
    viewport: VIEW,
    deviceScaleFactor: 2,
    initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
      v: 2, embers: 50,
      skins: { owned: ['${key}'], equipped: '${key}' },
      ascension: { tiers: [['${key}', ${tier}]], radiance: [] },
      cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
      flags: { seenFirstSurge: true, hintsSeen: 9 },
      settings: { reticle: false, slowMo: true, qualityOverride: null },
    }))`,
  });
  await page.click('#btn-start').catch(() => {});
  await page.waitForTimeout(2200);   // climb into steady flight (the wing is frozen at `phase`)
  const out = `/tmp/flap-${key}-${phase}.png`;
  await page.screenshot({ path: out, clip: { ...CLIP } });
  paths.push(out);
  console.log(`wrote ${out}`);
  await done();
}

// --- Montage the five frames with labels (same stitch as gameshots.mjs) ------
const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
const dataUrls = paths.map((p) => 'data:image/png;base64,' + readFileSync(p).toString('base64'));
const png = await page.evaluate(async ({ dataUrls, labels }) => {
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const imgs = await Promise.all(dataUrls.map(load));
  const w = imgs[0].width, h = imgs[0].height, pad = 10, lab = 40;
  const c = document.getElementById('c');
  c.width = w * imgs.length + pad * (imgs.length + 1); c.height = h + pad * 2 + lab;
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
}, { dataUrls, labels: PHASES });
const outStrip = `/tmp/flap-${key}-strip.png`;
writeFileSync(outStrip, Buffer.from(png, 'base64'));
console.log(`wrote ${outStrip}`);
await browser.close();
