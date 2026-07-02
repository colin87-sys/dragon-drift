// One-off asset generator: renders the icon SVG + an OG share card to PNGs
// in assets/. Run manually after changing the art; outputs are committed.
//   node tools/make-icons.mjs
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
function loadPlaywright() {
  for (const c of [process.env.PLAYWRIGHT_PATH,
    execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright', 'playwright']) {
    if (!c) continue;
    try { return require(c); } catch { /* next */ }
  }
  throw new Error('playwright not found');
}

const svg = readFileSync(join(ROOT, 'assets/icon.svg'), 'utf8');
const svgUri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');

const ICON_SIZES = [180, 192, 512];

const ogHtml = `<!DOCTYPE html><html><head><style>
  * { margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; font-family: sans-serif;
    background: radial-gradient(ellipse at 50% 30%, #2c5494 0%, #16234a 55%, #0c1426 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; }
  img { width: 200px; height: 200px; filter: drop-shadow(0 10px 40px rgba(255,170,60,0.35)); }
  h1 { font-size: 96px; letter-spacing: 18px; font-weight: 800;
    background: linear-gradient(180deg, #fff6dd, #ffd86a 55%, #ff9a3c);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 36px rgba(255,190,80,0.5)); }
  p { font-size: 30px; color: #cfeaff; letter-spacing: 3px; opacity: 0.92; }
  .stars { position: fixed; inset: 0; background-image:
    radial-gradient(2px 2px at 8% 18%, rgba(255,255,255,0.8), transparent),
    radial-gradient(1.5px 1.5px at 28% 8%, rgba(190,225,255,0.7), transparent),
    radial-gradient(2px 2px at 55% 14%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1.5px 1.5px at 72% 6%, rgba(190,225,255,0.8), transparent),
    radial-gradient(2px 2px at 88% 22%, rgba(255,255,255,0.6), transparent),
    radial-gradient(1.5px 1.5px at 18% 80%, rgba(127,224,255,0.5), transparent),
    radial-gradient(2px 2px at 85% 78%, rgba(255,216,106,0.6), transparent); }
</style></head><body>
  <div class="stars"></div>
  <img src="${svgUri}"><h1>DRAGON DRIFT</h1>
  <p>THREAD THE RINGS · RIDE THE SURGE · CHASE THE SKY</p>
</body></html>`;

const { chromium } = loadPlaywright();
const browser = await chromium.launch();

for (const size of ICON_SIZES) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<body style="margin:0"><img src="${svgUri}" style="width:${size}px;height:${size}px;display:block"></body>`);
  await page.waitForTimeout(200);
  writeFileSync(join(ROOT, `assets/icon-${size}.png`), await page.screenshot({ omitBackground: true }));
  await page.close();
  console.log(`icon-${size}.png`);
}

const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await og.setContent(ogHtml);
await og.waitForTimeout(300);
writeFileSync(join(ROOT, 'assets/og.png'), await og.screenshot());
console.log('og.png');
await browser.close();
