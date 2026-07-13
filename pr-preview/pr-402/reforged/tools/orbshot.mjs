// orbshot.mjs — Skyforged PR-2 Star Shard A/B (GRAPHICS-OVERHAUL.md N17). A ribbon orb
// framed close on approach in the flow run, three ways:
//   • Star Shard, chain COLD (idle heat)          — the resting faceted crystal
//   • Star Shard, chain HOT  (ribbon breathing)   — hot with the carve chain
//   • old orb (?skyforged=0): sphere + additive glow sprite — the A/B baseline
//   node tools/orbshot.mjs  →  /tmp/orb-*.png, /tmp/orb-montage.png
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

async function capture({ skyforged = true, chain = 0, frameDist = 0 }) {
  const query = `?debug&canyon=flow&seed=${SEED}${skyforged ? '' : '&skyforged=0'}`;
  const { page, done } = await boot({ query, viewport: VIEW, deviceScaleFactor: 2, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 8000 });
  await page.evaluate(() => { window.__dd.noBoss(true); window.__dd.player.dist = 200; });
  await page.waitForFunction(() => {
    if (window.__dd.game.canyonRun === 'flow') return true;
    window.__dd.player.dist += 40; return false;
  }, { timeout: 25000, polling: 200 });
  await page.waitForTimeout(500);
  // Frame ~9m behind a Star Shard orb (a small glowT+facetJ mesh). The old orb has no
  // glowT → reuse the shard run's frameDist (same seed → same ribbon planes).
  const targetDist = frameDist || await page.evaluate(() => {
    let best = Infinity;
    window.__dd.scene.traverse((o) => {
      const a = o.geometry && o.geometry.attributes;
      if (a && a.glowT && a.facetJ && a.position.count < 60) { o.updateWorldMatrix(true, false); const z = -o.matrixWorld.elements[14]; if (z > window.__dd.player.dist && z < best) best = z; }
    });
    return isFinite(best) ? best : 0;
  }).catch(() => 0);
  await page.evaluate((td) => { if (td) window.__dd.player.dist = td - 9; }, targetDist);
  // Freeze, drive the ribbon heat (orbFlow tracks game.flowChain on flow runs; updatePowerups
  // still writes it at dt=0), hide the harness Phase Gate, commit a couple of frames.
  await page.evaluate(async (ch) => {
    window.__dd.game.timeScale = 0;
    window.__dd.game.flowChain = ch;
    window.__dd.scene.traverse((o) => { if (o.userData && o.userData.phaseGate) o.visible = false; });
    for (let i = 0; i < 4; i++) await new Promise((r) => requestAnimationFrame(r));
  }, chain);
  await page.waitForTimeout(120);
  const buf = await page.screenshot();
  await done();
  return { buf, dist: targetDist };
}

const cold = await capture({ skyforged: true, chain: 0 });
const D = cold.dist;
const shots = {
  cold: cold.buf,
  hot: (await capture({ skyforged: true, chain: 20, frameDist: D })).buf,
  old: (await capture({ skyforged: false, chain: 0, frameDist: D })).buf,
};
for (const [k, v] of Object.entries(shots)) writeFileSync(`/tmp/orb-${k}.png`, v);

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
const png = await page.evaluate(async (b64) => {
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const imgs = {};
  for (const [k, v] of Object.entries(b64)) imgs[k] = await load('data:image/png;base64,' + v);
  const w = imgs.cold.width, h = imgs.cold.height, pad = 12, lab = 34;
  const c = document.getElementById('c');
  c.width = w * 3 + pad * 4; c.height = h + lab + pad * 2;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, c.width, c.height);
  const cells = [
    [imgs.cold, 'STAR SHARD — chain cold (resting crystal)', 0],
    [imgs.hot, 'STAR SHARD — chain hot (ribbon breathing)', 1],
    [imgs.old, 'OLD ORB — sphere + additive sprite (?skyforged=0)', 2],
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
writeFileSync('/tmp/orb-montage.png', Buffer.from(png, 'base64'));
console.log('wrote /tmp/orb-montage.png (+ /tmp/orb-{cold,hot,old}.png)');
