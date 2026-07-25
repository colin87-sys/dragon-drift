// TAIL-MOTION SWEEP — the CP3 read: is the tail a living articulated chain or a rigid spar?
// Boots vesper at its apex form into an ordinary run, then screenshots the live chase cam at
// several time samples (~0.3s apart). The splitFanTail is a 4-joint isBone chain the rig walks
// with a travelling lateral COIL + a phase-lagged VERTICAL undulation — both time-driven and
// present in straight flight — so consecutive frames show the tail in DIFFERENT poses (the coil
// travelling aft, the fan swinging). A stiff spar would look identical frame-to-frame.
//   node tools/tailsweep.mjs [dragonKey] [tier]
//     → /tmp/tail-<key>-f0..3.png  · /tmp/tail-<key>-sweep.png (montage)
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

const key = process.argv[2] || 'vesper';
const tier = Number(process.argv[3] ?? 3);
const VIEW = { width: 1100, height: 720 };
const CLIP = { x: 300, y: 250, width: 500, height: 360 };
const NFRAMES = 4, GAP = 320;   // ms between samples

const saveFor = (t) => `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['${key}'], equipped: '${key}' },
  ascension: { tiers: [['${key}', ${t}]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: false, qualityOverride: null },
}))`;

const { page, done } = await boot({ query: '?debug&cleanshot', viewport: VIEW, deviceScaleFactor: 2, initScript: saveFor(tier) });
await page.click('#btn-start').catch(() => {});
await page.waitForTimeout(2400);   // climb into steady flight
const paths = [];
for (let i = 0; i < NFRAMES; i++) {
  const out = `/tmp/tail-${key}-f${i}.png`;
  await page.screenshot({ path: out, clip: { ...CLIP } });
  paths.push(out);
  console.log(`wrote ${out}`);
  if (i < NFRAMES - 1) await page.waitForTimeout(GAP);
}
await done();

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const mp = await browser.newPage();
await mp.setContent('<canvas id="c"></canvas>');
const dataUrls = paths.map((p) => 'data:image/png;base64,' + readFileSync(p).toString('base64'));
const png = await mp.evaluate(async ({ dataUrls }) => {
  const load = (src) => new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.src = src; });
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
    ctx.fillStyle = '#ffd86a'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`t+${(i * 320)}ms`, x + w / 2, h + pad + 28);
  });
  return c.toDataURL('image/png').split(',')[1];
}, { dataUrls });
const outM = `/tmp/tail-${key}-sweep.png`;
writeFileSync(outM, Buffer.from(png, 'base64'));
console.log(`wrote ${outM}`);
await browser.close();
