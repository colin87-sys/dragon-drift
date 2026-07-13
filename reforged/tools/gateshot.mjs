// gateshot.mjs — Skyforged PR-4 Phase Gate frame A/B (GRAPHICS-OVERHAUL.md N17). A Phase Gate
// framed at ~gameplay range in two biomes (the confusion test + the menace test), each new vs old:
//   Sanctuary (cyan, max-confusion vs the flow language) + Emberfall Caldera (ember, menace).
//   node tools/gateshot.mjs  →  /tmp/gate-*.png, /tmp/gate-montage.png
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

// Fly a normal run from `base` (a dist inside the target biome) until a Phase Gate spawns ahead,
// frame ~40m behind it (the gameplay affordance range), freeze, shoot.
async function capture({ skyforged = true, base = 600, frameDist = 0 }) {
  const query = `?debug&seed=${SEED}${skyforged ? '' : '&skyforged=0'}`;
  const { page, done } = await boot({ query, viewport: VIEW, deviceScaleFactor: 2, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 8000 });
  await page.evaluate((b) => { window.__dd.noBoss(true); window.__dd.player.dist = b; }, base);
  const targetDist = frameDist || await page.evaluate(async () => {
    const findAhead = () => {
      let best = Infinity;
      window.__dd.scene.traverse((o) => {
        if (o.userData && o.userData.phaseGate) { o.updateWorldMatrix(true, false); const z = -o.matrixWorld.elements[14]; if (z > window.__dd.player.dist + 20 && z < best) best = z; }
      });
      return best;
    };
    const t0 = performance.now();
    while (performance.now() - t0 < 20000) {
      const z = findAhead();
      if (isFinite(z)) return z;
      window.__dd.player.dist += 45;
      await new Promise((r) => requestAnimationFrame(r));
    }
    return 0;
  }).catch(() => 0);
  await page.evaluate((td) => { if (td) window.__dd.player.dist = td - 40; }, targetDist);
  await page.evaluate(async () => {
    window.__dd.game.timeScale = 0;
    for (let i = 0; i < 4; i++) await new Promise((r) => requestAnimationFrame(r));
  });
  await page.waitForTimeout(140);
  const buf = await page.screenshot();
  await done();
  return { buf, dist: targetDist };
}

const SANC = 600, CALD = 3 * 1500 + 600; // biome 0 / biome 3 (Emberfall Caldera)
const sN = await capture({ skyforged: true, base: SANC });
const cN = await capture({ skyforged: true, base: CALD });
const shots = {
  sancNew: sN.buf,
  sancOld: (await capture({ skyforged: false, base: SANC, frameDist: sN.dist })).buf,
  caldNew: cN.buf,
  caldOld: (await capture({ skyforged: false, base: CALD, frameDist: cN.dist })).buf,
};
for (const [k, v] of Object.entries(shots)) writeFileSync(`/tmp/gate-${k}.png`, v);

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
const png = await page.evaluate(async (b64) => {
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const imgs = {};
  for (const [k, v] of Object.entries(b64)) imgs[k] = await load('data:image/png;base64,' + v);
  const w = imgs.sancNew.width, h = imgs.sancNew.height, pad = 12, lab = 34;
  const c = document.getElementById('c');
  c.width = w * 2 + pad * 3; c.height = (h + lab) * 2 + pad * 3;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, c.width, c.height);
  const cells = [
    [imgs.sancNew, 'SANCTUARY — Skyforged frame (hot lip + facets)', 0, 0],
    [imgs.sancOld, 'SANCTUARY — old bars (?skyforged=0)', 1, 0],
    [imgs.caldNew, 'EMBERFALL CALDERA — Skyforged frame', 0, 1],
    [imgs.caldOld, 'EMBERFALL CALDERA — old bars (?skyforged=0)', 1, 1],
  ];
  ctx.textBaseline = 'middle'; ctx.font = '600 15px system-ui, sans-serif';
  for (const [im, label, col, row] of cells) {
    const x = pad + col * (w + pad), y = pad + row * (h + lab + pad);
    ctx.drawImage(im, x, y, w, h);
    ctx.fillStyle = '#cfe0ff'; ctx.fillText(label, x + 4, y + h + lab / 2);
  }
  return c.toDataURL('image/png').split(',')[1];
}, Object.fromEntries(Object.entries(shots).map(([k, v]) => [k, v.toString('base64')])));
await browser.close();
writeFileSync('/tmp/gate-montage.png', Buffer.from(png, 'base64'));
console.log('wrote /tmp/gate-montage.png (+ /tmp/gate-{sancNew,sancOld,caldNew,caldOld}.png)');
