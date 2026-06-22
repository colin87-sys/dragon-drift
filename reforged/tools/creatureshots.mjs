// COLOR SHOTS — render one creature in FULL COLOR + lighting at several angles, so
// the agent can OPEN the PNGs with vision and compare against a reference image. This
// is the color half of the sighted-iteration loop (the headless silhouette tools are
// shape-only). It reuses the live WebGL look via Playwright + tools/creatureshots.html.
//
//   node tools/creatureshots.mjs <key> [--tier=N] [--angles=rear,threeq,side,climb] [--detail=high|ultra] [--out=/tmp]
//     → /tmp/color-<key>-<angle>.png   one per angle
//     → /tmp/color-<key>-montage.png   the angles stitched side by side
//
// Needs a browser with WebGL (Playwright + Chromium). In a headless/CI sandbox without
// a GPU this exits with a clear message — use it on a dev machine or a GPU CI runner.

import { writeFileSync } from 'node:fs';
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found (npm i -g playwright) — color shots need a browser with WebGL');
}

const args = process.argv.slice(2);
const opt = (name, def) => { const a = args.find((x) => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3) : def; };
const key = args.find((a) => !a.startsWith('--'));
if (!key) { console.log('usage: node tools/creatureshots.mjs <key> [--tier=N] [--angles=rear,threeq,side,climb] [--detail=ultra]'); process.exit(1); }
const tier = opt('tier', null);
const detail = opt('detail', null);
const outDir = opt('out', '/tmp');
const angles = opt('angles', 'rear,threeq,side,climb').split(',').map((s) => s.trim()).filter(Boolean);

let chromium;
try { ({ chromium } = loadPlaywright()); }
catch (e) { console.error(String(e.message || e)); process.exit(2); }

const srv = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 760 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('PAGEERROR', String(e)));
await page.goto(srv.url + '/tools/creatureshots.html');
await page.waitForFunction(() => window.__ready, { timeout: 15000 });

const result = await page.evaluate(
  ({ key, tier, angles, detail }) => window.renderCreature(key, { tier: tier != null ? Number(tier) : null, angles, detail }),
  { key, tier, angles, detail });

if (result.error) { console.error(result.error); await browser.close(); srv.close(); process.exit(1); }

const paths = [];
for (const a of angles) {
  if (!result[a]) continue;
  const p = `${outDir}/color-${key}-${a}.png`;
  writeFileSync(p, Buffer.from(result[a].split(',')[1], 'base64'));
  paths.push({ a, p });
  console.log(`${key}${detail ? ' · ' + detail : ''} · ${a} → wrote ${p}`);
}

// Stitch a montage so all angles read at a glance (same canvas trick as gameshots.mjs).
if (paths.length) {
  const dataUrls = paths.map((x) => 'data:image/png;base64,' + result[x.a].split(',')[1]);
  await page.setContent('<canvas id="c"></canvas>');
  const png = await page.evaluate(async ({ dataUrls, labels }) => {
    const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const imgs = await Promise.all(dataUrls.map(load));
    const pad = 10, lab = 36, H = Math.max(...imgs.map((im) => im.height));
    const widths = imgs.map((im) => im.width);
    const c = document.getElementById('c');
    c.width = widths.reduce((s, w) => s + w + pad, pad); c.height = H + pad * 2 + lab;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, c.width, c.height);
    let x = pad;
    imgs.forEach((im, i) => {
      ctx.drawImage(im, x, pad, im.width, im.height);
      ctx.strokeStyle = 'rgba(140,200,255,0.18)'; ctx.strokeRect(x, pad, im.width, im.height);
      ctx.fillStyle = '#ffd86a'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + im.width / 2, H + pad + 26);
      x += im.width + pad;
    });
    return c.toDataURL('image/png').split(',')[1];
  }, { dataUrls, labels: paths.map((x) => x.a) });
  const mp = `${outDir}/color-${key}-montage.png`;
  writeFileSync(mp, Buffer.from(png, 'base64'));
  console.log(`montage → wrote ${mp}`);
}

await browser.close();
srv.close();
