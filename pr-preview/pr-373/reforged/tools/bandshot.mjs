// bandshot.mjs — N1 banding regression gate (GRAPHICS-OVERHAUL.md).
// Boots a real run, captures a tall thin strip of the SKY (the smoothest, most
// banding-prone gradient in the frame) with dither ON (shipped) and OFF
// (?dither=0), and counts distinct 8-bit luma steps down the strip. Dither fills
// the gaps between quantized bands, so ON must show MORE distinct values than OFF.
//   node tools/bandshot.mjs
//     → /tmp/bandshot-on.png, /tmp/bandshot-off.png, /tmp/bandshot-montage.png
//     → prints the distinct-step counts and PASS/FAIL (ON strictly smoother).
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

const VIEW = { width: 900, height: 640 };
// A tall, thin column high in the frame — sky only, clear of the dragon/HUD.
const CLIP = { x: 120, y: 24, width: 24, height: 300 };
const saveT0 = `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['azure'], equipped: 'azure' },
  ascension: { tiers: [['azure', 0]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: true, qualityOverride: null },
}))`;

// Capture BOTH frames from ONE frozen frame so the only difference is the dither
// uniform (comparing two separate boots measures scene/camera drift, not dither).
async function captureBoth() {
  const { page, done } = await boot({ query: '?debug&cleanshot', viewport: VIEW, deviceScaleFactor: 1, initScript: saveT0 });
  await page.click('#btn-start').catch(() => {});
  await page.waitForTimeout(2200);
  // Freeze the sim (dt=0 → sky/camera stop advancing) so the two shots are the same frame.
  await page.evaluate(() => { window.__dd.game.timeScale = 0; });
  await page.waitForTimeout(200);
  const on = await page.screenshot({ clip: { ...CLIP } });   // dither ON (shipped)
  await page.evaluate(() => { window.__dd.postfx.handle.gradingPass.uniforms.uDither.value = 0; });
  await page.waitForTimeout(150);
  const off = await page.screenshot({ clip: { ...CLIP } });  // same frame, dither OFF
  await done();
  return { on, off };
}

const { on: onBuf, off: offBuf } = await captureBoth();
writeFileSync('/tmp/bandshot-on.png', onBuf);
writeFileSync('/tmp/bandshot-off.png', offBuf);

// Decode + analyse in a throwaway browser page (WebGL canvases don't read back
// reliably after compositing, so we go through the PNG like gameshots' montage).
const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
const result = await page.evaluate(async ({ onUrl, offUrl }) => {
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  // Banding shows as long FLAT runs down a gradient (few luma transitions).
  // Dither breaks them into ±1-LSB noise → many transitions. Average the
  // transition count over several columns for stability.
  const analyse = (img) => {
    const c = document.getElementById('c');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const strip = ctx.getImageData(0, 0, img.width, img.height).data;
    const luma = (x, y) => {
      const i = (y * img.width + x) * 4;
      return Math.round(0.299 * strip[i] + 0.587 * strip[i + 1] + 0.114 * strip[i + 2]);
    };
    let transitions = 0, cols = 0;
    for (let x = 4; x < img.width - 4; x += 4) {
      cols++;
      for (let y = 1; y < img.height; y++) if (luma(x, y) !== luma(x, y - 1)) transitions++;
    }
    return Math.round(transitions / cols);
  };
  const [onImg, offImg] = await Promise.all([load(onUrl), load(offUrl)]);
  return { on: analyse(onImg), off: analyse(offImg), h: onImg.height };
}, {
  onUrl: 'data:image/png;base64,' + onBuf.toString('base64'),
  offUrl: 'data:image/png;base64,' + offBuf.toString('base64'),
});

// Side-by-side montage for the human/Fable gate.
const png = await page.evaluate(async ({ onUrl, offUrl, result }) => {
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const [a, b] = await Promise.all([load(onUrl), load(offUrl)]);
  const scale = 3, pad = 12, lab = 34;
  const w = a.width * scale, h = a.height * scale;
  const c = document.getElementById('c');
  c.width = w * 2 + pad * 3; c.height = h + pad * 2 + lab;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, c.width, c.height);
  [[a, `dither ON  (${result.on} transitions/col)`], [b, `dither OFF (${result.off} transitions/col)`]].forEach(([im, label], i) => {
    const x = pad + i * (w + pad);
    ctx.drawImage(im, x, pad, w, h);
    ctx.fillStyle = '#ffd86a'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, h + pad + 24);
  });
  return c.toDataURL('image/png').split(',')[1];
}, { onUrl: 'data:image/png;base64,' + onBuf.toString('base64'), offUrl: 'data:image/png;base64,' + offBuf.toString('base64'), result });
writeFileSync('/tmp/bandshot-montage.png', Buffer.from(png, 'base64'));
await browser.close();

const ok = result.on > result.off;
console.log(`sky-strip luma transitions per column (frozen frame, dither on vs off):`);
console.log(`  dither ON : ${result.on}`);
console.log(`  dither OFF: ${result.off}`);
console.log(`  → ${ok ? 'PASS' : 'FAIL'} (dither ON must break banding into more transitions)`);
console.log('wrote /tmp/bandshot-on.png, /tmp/bandshot-off.png, /tmp/bandshot-montage.png');
process.exit(ok ? 0 : 1);
