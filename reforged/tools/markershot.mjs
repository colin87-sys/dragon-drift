// markershot.mjs — Skyforged PR-1 Windvault A/B (GRAPHICS-OVERHAUL.md N17). The
// flow gate, framed on approach at the SAME seeded gate, four ways so the owner +
// the Fable Gate-2 can judge the premium read:
//   • Windvault, chain COLD (slip 0)      — the resting forged-glass arch
//   • Windvault, chain HOT  (slip 1)      — the light climbed the arch
//   • Windvault, OFF-AXIS   (banked in)   — the edge-on read the old torus lost
//   • Sky Gate  (?skyforged=0, the rejected build) — the A/B baseline
//   node tools/markershot.mjs  →  /tmp/marker-*.png, /tmp/marker-montage.png
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
const SEED = 8; // the canyonflow guard seed — a bridged flow run
const noSW = `if (navigator.serviceWorker) { navigator.serviceWorker.register = () => Promise.resolve({}); };\n`;
const save = noSW + `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`;

// Fly into the forced flow run, frame the nearest gate ~34m ahead, hold the chain
// to `chain` for a beat (so the light climbs on the hot shots), nudge the player
// laterally by `offX` for the off-axis read, then freeze and shoot.
async function capture({ skyforged = true, chain = 0, offX = 0, frameDist = 0 }) {
  const query = `?debug&canyon=flow&seed=${SEED}${skyforged ? '' : '&skyforged=0'}`;
  const { page, done } = await boot({ query, viewport: VIEW, deviceScaleFactor: 2, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 8000 });
  await page.evaluate(() => { window.__dd.noBoss(true); window.__dd.player.dist = 200; });
  // Headless has no input, so nudge forward until we cross INTO a flow run (works
  // for any seed — a fixed jump can overshoot the first flow set-piece).
  await page.waitForFunction(() => {
    if (window.__dd.game.canyonRun === 'flow') return true;
    window.__dd.player.dist += 40; return false;
  }, { timeout: 25000, polling: 200 });
  await page.waitForTimeout(500);
  // Frame the nearest Windvault ahead by its glowT arch (the Sky-Gate build has none
  // → reuse the Windvault run's frameDist; same seed → same gate planes). No chain
  // ramp: holding the chain advances the player and drifts a neighbouring Phase Gate
  // into frame. Instead we light the arch WHILE FROZEN (below) with zero advance.
  const targetDist = frameDist || await page.evaluate(() => {
    let best = Infinity;
    window.__dd.scene.traverse((o) => {
      const g = o.geometry && o.geometry.attributes && o.geometry.attributes.glowT;
      if (g) { o.updateWorldMatrix(true, false); const z = -o.matrixWorld.elements[14]; if (z > window.__dd.player.dist && z < best) best = z; }
    });
    return isFinite(best) ? best : 0;
  }).catch(() => 0);
  await page.evaluate((td) => { if (td) window.__dd.player.dist = td - 34; }, targetDist);
  if (offX) await page.evaluate((x) => { window.__dd.player.x = (window.__dd.player.x || 0) + x; }, offX);
  // Freeze, then drive the slipstream DIRECTLY (canyonSlip>1 → slipMix→1 → the light
  // climbs the arch): updateObstacles runs each rAF even at dt=0, writing markerFlow
  // from player.canyonSlip. A couple of frames commit the uniform. Zero advance.
  await page.evaluate(async (ch) => {
    window.__dd.game.timeScale = 0;
    window.__dd.game.flowChain = ch;
    window.__dd.player.canyonSlip = ch ? 2.0 : 1.0; // 2.0 clamps slipMix to 1 regardless of the run ceiling
    // The forced ?canyon=flow harness interleaves normal-course PHASE GATES, one of
    // which can straddle the framed flow plane (never happens in real flow play).
    // Hide any Phase-Gate group (identified by its veil ShaderMaterial's uEdge uniform)
    // so the A/B judges the flow marker alone. The Windvault + reward ring are separate
    // groups without a veil, so they survive.
    window.__dd.scene.traverse((o) => {
      if (o.material && o.material.uniforms && o.material.uniforms.uEdge) {
        let g = o; while (g.parent && g.parent !== window.__dd.scene) g = g.parent;
        g.visible = false;
      }
    });
    for (let i = 0; i < 4; i++) await new Promise((r) => requestAnimationFrame(r));
  }, chain);
  await page.waitForTimeout(120);
  const buf = await page.screenshot();
  await done();
  return { buf, dist: targetDist };
}

// Resolve the framing gate once (cold), then frame ALL cells on that same gate
// plane so only the chain / off-axis / build differs — a fair A/B.
const cold = await capture({ skyforged: true, chain: 0 });
const D = cold.dist;
const shots = {
  cold: cold.buf,
  hot: (await capture({ skyforged: true, chain: 20, frameDist: D })).buf,
  offaxis: (await capture({ skyforged: true, chain: 12, offX: 7, frameDist: D })).buf,
  skygate: (await capture({ skyforged: false, chain: 0, frameDist: D })).buf,
};
for (const [k, v] of Object.entries(shots)) writeFileSync(`/tmp/marker-${k}.png`, v);

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
  c.width = w * 2 + pad * 3; c.height = (h + lab) * 2 + pad * 3;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, c.width, c.height);
  const cells = [
    [imgs.cold, 'WINDVAULT — chain cold (resting forged glass)', 0, 0],
    [imgs.hot, 'WINDVAULT — chain hot (light climbed the arch)', 1, 0],
    [imgs.offaxis, 'WINDVAULT — banked in (edge-on read)', 0, 1],
    [imgs.skygate, 'SKY GATE — the rejected build (?skyforged=0)', 1, 1],
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
writeFileSync('/tmp/marker-montage.png', Buffer.from(png, 'base64'));
console.log('wrote /tmp/marker-montage.png (+ /tmp/marker-{cold,hot,offaxis,skygate}.png)');
