// tools/bosscrop.mjs — zoomed FRONT-ON boss crops for the design-review gate.
//
//   node tools/bosscrop.mjs <bossId> <cpTag> <roundTag> [state...]
//   e.g. node tools/bosscrop.mjs ashtalon cp1 r1 idle charge shielded
//
// Boots the real engine for one boss (in its gate biome), lets the reveal title
// card FADE for a clean frame, then captures the requested states, crops each to
// the boss's projected bounding box (+pad) and upscales 2×, writing
// reforged-captures/<bossId>-<cpTag>-<state>-<roundTag>.png. The human/gate agent
// judges motion/feel/silhouette on these — bossgate.mjs judges the numbers.

import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import fs from 'node:fs';
import { boot } from '../tests/browser.mjs';
import { decodePNG, pngRGBA } from './silhouetteCore.mjs';

const { BOSS_ORDER } = await import('../js/bossDefs.js');

const VIEW = { width: 720, height: 1280 };
const DIST = { voidmaw: 2500, stormrend: 5200, craghold: 3800, ashtalon: 5000 };
const OUT = new URL('../../reforged-captures/', import.meta.url).pathname;

const bossId = process.argv[2];
const cpTag = process.argv[3] || 'cp1';
const roundTag = process.argv[4] || 'r1';
const states = process.argv.slice(5).length ? process.argv.slice(5) : ['idle', 'charge', 'shielded'];
if (!bossId || !BOSS_ORDER.includes(bossId)) {
  console.error(`usage: node tools/bosscrop.mjs <bossId> <cpTag> <roundTag> [states...]\n  bossId ∈ ${BOSS_ORDER.join(', ')}`);
  process.exit(2);
}
const bossIdx = BOSS_ORDER.indexOf(bossId);
const dist = DIST[bossId] ?? 3000;
fs.mkdirSync(OUT, { recursive: true });

// In-page: the projected boss bbox (opaque + glow), for the crop rectangle.
function bossBox() {
  const dd = window.__dd;
  const cam = dd.camera;
  let boss = null;
  dd.scene.traverse((o) => { if (o.userData && o.userData.__isBoss) boss = o; });
  if (!boss) return null;
  boss.updateWorldMatrix(true, true);
  const W = dd.renderer.domElement.width, H = dd.renderer.domElement.height;
  const P = cam.projectionMatrix.elements, V = cam.matrixWorldInverse.elements;
  const VP = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0; for (let k = 0; k < 4; k++) s += P[k * 4 + r] * V[c * 4 + k];
    VP[c * 4 + r] = s;
  }
  let x0 = W, y0 = H, x1 = 0, y1 = 0, any = false;
  boss.traverse((o) => {
    if (!o.visible || !o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
    if (o.renderOrder >= 998) return;   // skip HP bar
    const pos = o.geometry.attributes.position, m = o.matrixWorld.elements;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const wx = m[0] * x + m[4] * y + m[8] * z + m[12];
      const wy = m[1] * x + m[5] * y + m[9] * z + m[13];
      const wz = m[2] * x + m[6] * y + m[10] * z + m[14];
      const cw = VP[3] * wx + VP[7] * wy + VP[11] * wz + VP[15];
      if (cw <= 1e-6) continue;
      const sx = (VP[0] * wx + VP[4] * wy + VP[8] * wz + VP[12]) / cw;
      const sy = (VP[1] * wx + VP[5] * wy + VP[9] * wz + VP[13]) / cw;
      const px = (sx * 0.5 + 0.5) * W, py = (1 - (sy * 0.5 + 0.5)) * H;
      any = true;
      if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
    }
  });
  return any ? { W, H, x0, y0, x1, y1 } : null;
}

// Crop a decoded RGBA frame to the boss box (+pad), upscale 2× (nearest).
function cropZoom(rgba, W, H, box) {
  const padX = (box.x1 - box.x0) * 0.28 + 20, padY = (box.y1 - box.y0) * 0.28 + 20;
  const cx0 = Math.max(0, Math.floor(box.x0 - padX)), cy0 = Math.max(0, Math.floor(box.y0 - padY));
  const cx1 = Math.min(W, Math.ceil(box.x1 + padX)), cy1 = Math.min(H, Math.ceil(box.y1 + padY));
  const cw = cx1 - cx0, ch = cy1 - cy0, Z = 2;
  const out = Buffer.alloc(cw * Z * ch * Z * 4);
  for (let y = 0; y < ch * Z; y++) for (let x = 0; x < cw * Z; x++) {
    const sx = cx0 + ((x / Z) | 0), sy = cy0 + ((y / Z) | 0);
    const s = (sy * W + sx) * 4, d = (y * cw * Z + x) * 4;
    out[d] = rgba[s]; out[d + 1] = rgba[s + 1]; out[d + 2] = rgba[s + 2]; out[d + 3] = 255;
  }
  return { buf: pngRGBA(cw * Z, ch * Z, out), w: cw * Z, h: ch * Z };
}

const { page, done } = await boot({
  query: `?debug&bossIdx=${bossIdx}&boss=${dist}`,
  viewport: VIEW, deviceScaleFactor: 1,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 4, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
});
page.setDefaultTimeout(150000);

async function shoot(state) {
  const box = await page.evaluate(bossBox);
  const png = await page.screenshot();
  if (!box) { console.warn(`  ! ${state}: no boss box`); return; }
  const { rgba } = decodePNG(png);
  const { buf, w, h } = cropZoom(rgba, box.W, box.H, box);
  const path = `${OUT}${bossId}-${cpTag}-${state}-${roundTag}.png`;
  fs.writeFileSync(path, buf);
  console.log(`wrote ${path}  (${w}x${h})`);
}

try {
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 });
  await page.evaluate((d) => { window.__dd.player.dist = Math.max(0, d); }, dist);
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__dd.spawnBoss());
  await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 90000 });

  for (const state of states) {
    if (state === 'idle') {
      // Let the reveal title card fully fade (DOM animation, wall-clock) for a
      // clean, un-charged frame.
      await page.waitForTimeout(3200);
      await page.waitForFunction(() => !window.__dd.bossState().charging, { timeout: 6000 }).catch(() => {});
      await shoot('idle');
    } else if (state === 'charge') {
      await page.waitForFunction(() => window.__dd.bossState().charging, { timeout: 60000 }).catch(() => {});
      await shoot('charge');
    } else if (state === 'shielded' || state === 'dread') {
      let sh = false;
      for (let i = 0; i < 25 && !sh; i++) {
        sh = await page.evaluate(() => { window.__dd.emit('bossDamage', { amount: 1e6, kind: 'debug' }); return window.__dd.bossState().shielded; });
        if (!sh) await page.waitForTimeout(120);
      }
      // Headless rAF is throttled, so the wing-fold pose eases in slowly in
      // wall-clock — wait several seconds for it to SETTLE symmetric + front-on
      // before capturing (round-1 caught a mid-ease tilt).
      await page.waitForTimeout(6000);
      await shoot(state);
    }
  }
  await done();
  console.log('\nbosscrop done.');
} catch (e) {
  await done().catch(() => {});
  console.error('bosscrop error:', e && e.stack || e);
  process.exit(3);
}
