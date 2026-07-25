// Stitch given PNGs into a labelled strip (canvas only, no game boot).
// node tools/_montage.mjs out.png "Label1:a.png" "Label2:b.png" ...
import { writeFileSync, readFileSync } from 'fs';
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
const out = process.argv[2];
const items = process.argv.slice(3).map((s) => { const i = s.indexOf(':'); return { label: s.slice(0, i), path: s.slice(i + 1) }; });
const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
const dataUrls = items.map((it) => 'data:image/png;base64,' + readFileSync(it.path).toString('base64'));
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
}, { dataUrls, labels: items.map((it) => it.label) });
writeFileSync(out, Buffer.from(png, 'base64'));
console.log(`wrote ${out}`);
await browser.close();
