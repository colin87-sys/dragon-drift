// pfxshot.mjs — N4 ParticleBatch visual A/B (GRAPHICS-OVERHAUL.md).
// Fires the same celebration burst under the sprite backend (shipped) and the
// instanced backend (?pfx=batch) at tier0, and composites a side-by-side montage
// so the look can be judged identical (the batch reuses the exact spawn/update math
// + the same glow texture + a SpriteMaterial-matching shader; only the draw path
// differs). Particle positions differ per boot (spawn uses Math.random), so this is
// a LOOK-parity check, not a pixel diff.
//   node tools/pfxshot.mjs  →  /tmp/pfx-sprite.png, /tmp/pfx-batch.png, /tmp/pfx-montage.png
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
const saveFor = (tier) => `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['azure'], equipped: 'azure' },
  ascension: { tiers: [['azure', 2]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: true, qualityOverride: ${tier} },
}))`;

// tier0 renders through the composer (ACES applied in OutputPass); tier2 renders
// DIRECT to screen (ACES applied in-material) — the batch shader must match on BOTH,
// so we shoot each tier. tier2 is the one the tonemapping/colorspace fix guards.
async function capture(mode, tier) {
  const query = `?debug&cleanshot&seed=73101${mode === 'batch' ? '&pfx=batch' : ''}`;
  const { page, done } = await boot({ query, viewport: VIEW, deviceScaleFactor: 2, initScript: saveFor(tier) });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.distance >= 30, { timeout: 18000 }).catch(() => {});
  await page.evaluate(() => { for (let i = 0; i < 3; i++) window.__dd.pfx.burst(90); });
  await page.waitForTimeout(180); // let the sparks spread into a readable spray
  await page.evaluate(() => { window.__dd.game.timeScale = 0; }); // freeze the spray to shoot it
  await page.waitForTimeout(80);
  const buf = await page.screenshot();
  await done();
  return buf;
}

const { chromium } = loadPlaywright();
async function montage(a, b, labelA, labelB, out) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');
  const png = await page.evaluate(async ({ a, b, labelA, labelB }) => {
    const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const w = ia.width, h = ia.height, pad = 12, lab = 40;
    const c = document.getElementById('c');
    c.width = w * 2 + pad * 3; c.height = h + pad * 2 + lab;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, c.width, c.height);
    [[ia, labelA], [ib, labelB]].forEach(([im, label], i) => {
      const x = pad + i * (w + pad);
      ctx.drawImage(im, x, pad, w, h);
      ctx.strokeStyle = 'rgba(140,200,255,0.18)'; ctx.strokeRect(x, pad, w, h);
      ctx.fillStyle = '#ffd86a'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(label, x + w / 2, h + pad + 30);
    });
    return c.toDataURL('image/png').split(',')[1];
  }, { a: 'data:image/png;base64,' + a.toString('base64'), b: 'data:image/png;base64,' + b.toString('base64'), labelA, labelB });
  writeFileSync(out, Buffer.from(png, 'base64'));
  await browser.close();
}

for (const tier of [0, 2]) {
  const s = await capture('sprite', tier);
  const b = await capture('batch', tier);
  writeFileSync(`/tmp/pfx-sprite-t${tier}.png`, s);
  writeFileSync(`/tmp/pfx-batch-t${tier}.png`, b);
  const path = tier === 0 ? 'composer' : 'direct-to-screen';
  await montage(s, b, `sprite  ·  tier${tier} (${path})`, `batch  ·  tier${tier} (${path})`, `/tmp/pfx-montage-t${tier}.png`);
  console.log(`wrote /tmp/pfx-montage-t${tier}.png`);
}
console.log('judge the glow/color/size look identical on BOTH tiers (tier2 is the tonemapping-fix check)');
