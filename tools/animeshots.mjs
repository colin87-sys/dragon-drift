// A/B captures for the ANIME / cel-shaded prototype (?anime=1): boots the SAME
// seeded scenario twice — shipped look vs anime mode — and stitches each pair
// into a labelled side-by-side montage. The comparison artifact for judging the
// style swap (the human judges motion on the PR preview).
//   node tools/animeshots.mjs [outDir]
//     → <out>/anime-<scenario>-real.png / -anime.png   (raw frames)
//     → <out>/anime-<scenario>-pair.png                (labelled A/B)
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

const OUT = process.argv[2] || '/tmp';
const VIEW = { width: 1180, height: 700 };
const DSF = parseFloat(process.env.ANIME_DSF || '1');

// Each scenario boots fresh with a pinned save (runs:0 → the authored first-
// flight seed, so both modes fly the same course) and tier 0 pinned (SwiftShader
// frame times would otherwise degrade the adaptive tier mid-capture).
const SAVE = `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50,
  skins: { owned: ['azure'], equipped: 'azure' },
  ascension: { tiers: [['azure', 2]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9, seenIntro: true },
  settings: { reticle: false, qualityOverride: 0 },
}))`;

const SCENARIOS = [
  { name: 'run', query: '?debug', start: true, wait: 3800 },
  { name: 'run-far', query: '?debug', start: true, wait: 9000 },
  { name: 'hub', query: '?debug', start: false, wait: 1800 },
];
const extra = process.env.ANIME_SCEN;   // e.g. ANIME_SCEN=run:1:4000&biome=3
const only = process.env.ANIME_ONLY;    // run only one named scenario

const pairs = [];
for (const sc of SCENARIOS) {
  if (only && sc.name !== only) continue;
  const files = {};
  for (const mode of ['real', 'anime']) {
    const q = sc.query + (mode === 'anime' ? '&anime=1' : '');
    const { page, errors, done } = await boot({
      query: q, viewport: VIEW, deviceScaleFactor: DSF, initScript: SAVE,
    });
    if (sc.start) {
      await page.click('#btn-start').catch(() => {});
    }
    await page.waitForTimeout(sc.wait);
    const out = `${OUT}/anime-${sc.name}-${mode}.png`;
    await page.screenshot({ path: out });
    files[mode] = out;
    console.log(`wrote ${out}${errors.length ? '  ERRORS: ' + errors.join(' | ') : ''}`);
    await done();
  }
  pairs.push({ name: sc.name, ...files });
}

// --- Stitch each pair side by side with labels -------------------------------
const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
for (const pr of pairs) {
  const dataUrls = [pr.real, pr.anime].map(p => 'data:image/png;base64,' + readFileSync(p).toString('base64'));
  const png = await page.evaluate(async ({ dataUrls, labels }) => {
    const load = (src) => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const imgs = await Promise.all(dataUrls.map(load));
    const w = imgs[0].width, h = imgs[0].height, pad = 8, lab = 42;
    const c = document.getElementById('c');
    c.width = w * 2 + pad * 3; c.height = h + pad * 2 + lab;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, c.width, c.height);
    imgs.forEach((im, i) => {
      const x = pad + i * (w + pad);
      ctx.drawImage(im, x, pad, w, h);
      ctx.strokeStyle = 'rgba(140,200,255,0.18)'; ctx.strokeRect(x, pad, w, h);
      ctx.fillStyle = '#ffd86a'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + w / 2, h + pad + 30);
    });
    return c.toDataURL('image/png').split(',')[1];
  }, { dataUrls, labels: ['SHIPPED', 'ANIME  ?anime=1'] });
  const out = `${OUT}/anime-${pr.name}-pair.png`;
  writeFileSync(out, Buffer.from(png, 'base64'));
  console.log(`wrote ${out}`);
}
await browser.close();
