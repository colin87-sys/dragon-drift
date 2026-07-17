// ringshot.mjs — Skyforged PR-3 Jade Annulus A/B (GRAPHICS-OVERHAUL.md N17). A reward ring
// framed close in a normal run, three ways:
//   • Jade Annulus, idle          — the gem-cut green ring with the hot inner lip + glint
//   • Jade Annulus, FEVER         — mint palette shift + hot climb
//   • old torus (?skyforged=0)     — the smooth donut baseline
//   node tools/ringshot.mjs  →  /tmp/ring-*.png, /tmp/ring-montage.png
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
const SEED = 8;
const noSW = `if (navigator.serviceWorker) { navigator.serviceWorker.register = () => Promise.resolve({}); };\n`;
const save = noSW + `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`;

async function capture({ skyforged = true, fever = false, frameDist = 0 }) {
  const query = `?debug&seed=${SEED}${skyforged ? '' : '&skyforged=0'}`;
  const { page, done } = await boot({ query, viewport: VIEW, deviceScaleFactor: 2, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 8000 });
  await page.evaluate(() => { window.__dd.noBoss(true); window.__dd.player.dist = 260; });
  await page.waitForTimeout(400);
  // Frame ~7m behind a reward ring. Skyforged rings are green glowT+facetJ gems; the old torus
  // has no glowT → reuse the skyforged run's frameDist (same seed → same ring planes).
  const targetDist = frameDist || await page.evaluate(() => {
    let best = Infinity;
    window.__dd.scene.traverse((o) => {
      const at = o.geometry && o.geometry.attributes, u = o.material && o.material.userData && o.material.userData.markerUniforms;
      if (at && at.glowT && at.facetJ && u && u.uMid.value.g > 0.9 && u.uMid.value.b < 0.7) {
        o.updateWorldMatrix(true, false); const z = -o.matrixWorld.elements[14];
        if (z > window.__dd.player.dist && z < best) best = z;
      }
    });
    return isFinite(best) ? best : 0;
  }).catch(() => 0);
  await page.evaluate((td) => { if (td) window.__dd.player.dist = td - 7; }, targetDist);
  // Freeze, optionally force fever (the ring's live branch shifts palette to mint at dt=0),
  // hide interleaved Phase Gates, commit a couple of frames.
  await page.evaluate(async (fv) => {
    window.__dd.game.timeScale = 0;
    if (fv) { window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 5; window.__dd.game.combo = 30; }
    window.__dd.scene.traverse((o) => { if (o.userData && o.userData.phaseGate) o.visible = false; });
    for (let i = 0; i < 4; i++) await new Promise((r) => requestAnimationFrame(r));
  }, fever);
  await page.waitForTimeout(120);
  const buf = await page.screenshot();
  await done();
  return { buf, dist: targetDist };
}

const idle = await capture({ skyforged: true, fever: false });
const D = idle.dist;
const shots = {
  idle: idle.buf,
  fever: (await capture({ skyforged: true, fever: true, frameDist: D })).buf,
  old: (await capture({ skyforged: false, fever: false, frameDist: D })).buf,
};
for (const [k, v] of Object.entries(shots)) writeFileSync(`/tmp/ring-${k}.png`, v);

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
const png = await page.evaluate(async (b64) => {
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const imgs = {};
  for (const [k, v] of Object.entries(b64)) imgs[k] = await load('data:image/png;base64,' + v);
  const w = imgs.idle.width, h = imgs.idle.height, pad = 12, lab = 34;
  const c = document.getElementById('c');
  c.width = w * 3 + pad * 4; c.height = h + lab + pad * 2;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, c.width, c.height);
  const cells = [
    [imgs.idle, 'JADE ANNULUS — idle (gem, hot inner lip, glint)', 0],
    [imgs.fever, 'JADE ANNULUS — FEVER (mint shift + hot climb)', 1],
    [imgs.old, 'OLD RING — smooth torus (?skyforged=0)', 2],
  ];
  ctx.textBaseline = 'middle'; ctx.font = '600 15px system-ui, sans-serif';
  for (const [im, label, col] of cells) {
    const x = pad + col * (w + pad), y = pad;
    ctx.drawImage(im, x, y, w, h);
    ctx.fillStyle = '#cfe0ff'; ctx.fillText(label, x + 4, y + h + lab / 2);
  }
  return c.toDataURL('image/png').split(',')[1];
}, Object.fromEntries(Object.entries(shots).map(([k, v]) => [k, v.toString('base64')])));
await browser.close();
writeFileSync('/tmp/ring-montage.png', Buffer.from(png, 'base64'));
console.log('wrote /tmp/ring-montage.png (+ /tmp/ring-{idle,fever,old}.png)');
