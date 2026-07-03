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
  return any ? { W, H, x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, yaw: boss.rotation.y } : null;
}

// Crop a FIXED-size window (half-widths hw/hh) centred on the boss box centre,
// upscale 2× (nearest). A fixed size across idle/charge/shielded keeps the boss
// at the SAME apparent distance/scale so the mantle span contraction is
// measurable (gate directive 4).
function cropZoom(rgba, W, H, box, hw, hh) {
  const cx0 = Math.max(0, Math.floor(box.cx - hw)), cy0 = Math.max(0, Math.floor(box.cy - hh));
  const cx1 = Math.min(W, Math.ceil(box.cx + hw)), cy1 = Math.min(H, Math.ceil(box.cy + hh));
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

// FIXED crop half-size, locked from the idle (widest) pose so every state is
// framed at the same scale. Set on the first shoot.
let fixedHW = 0, fixedHH = 0;

// Wait for a FRONT-ON, LOW-BULLET moment: the boss yaw wobble ≤~0.08 rad and few
// bullets over it (so the silhouette isn't tilted or occluded — gate directive 4).
async function waitClean(maxBullets = 6, tries = 40) {
  let best = null;
  for (let i = 0; i < tries; i++) {
    const s = await page.evaluate(() => ({ b: window.__dd.bossState().bullets, box: (() => { let o = null; window.__dd.scene.traverse((x) => { if (x.userData && x.userData.__isBoss) o = x; }); return o ? o.rotation.y : 9; })() }));
    const yaw = Math.abs(s.box);
    if (yaw < 0.08 && s.b <= maxBullets) return;
    if (!best || yaw < best.yaw) best = { yaw, b: s.b };
    await page.waitForTimeout(180);
  }
}

async function shoot(state) {
  const box = await page.evaluate(bossBox);
  const png = await page.screenshot();
  if (!box) { console.warn(`  ! ${state}: no boss box`); return; }
  if (!fixedHW) {   // lock the framing from the first (idle) capture, +28% pad
    fixedHW = (box.x1 - box.x0) / 2 * 1.28 + 24;
    fixedHH = (box.y1 - box.y0) / 2 * 1.28 + 24;
  }
  const { rgba } = decodePNG(png);
  const { buf, w, h } = cropZoom(rgba, box.W, box.H, box, fixedHW, fixedHH);
  const path = `${OUT}${bossId}-${cpTag}-${state}-${roundTag}.png`;
  fs.writeFileSync(path, buf);
  console.log(`wrote ${path}  (${w}x${h}) yaw ${box.yaw.toFixed(3)}`);
}

try {
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 });
  await page.evaluate((d) => { window.__dd.player.dist = Math.max(0, d); }, dist);
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__dd.spawnBoss());
  await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 90000 });

  // ALWAYS capture idle first (it locks the fixed framing for the other states).
  const ordered = ['idle', ...states.filter((s) => s !== 'idle')];
  for (const state of ordered) {
    if (!states.includes(state)) continue;   // idle only captured if requested; but it locks framing regardless
    if (state === 'idle') {
      await page.waitForTimeout(3200);        // let the reveal title card fade
      await page.waitForFunction(() => !window.__dd.bossState().charging, { timeout: 6000 }).catch(() => {});
      await waitClean(4);                     // front-on, bullet-free reveal-hold frame
      await shoot('idle');
    } else if (state === 'charge') {
      await page.waitForFunction(() => window.__dd.bossState().charging, { timeout: 60000 }).catch(() => {});
      await waitClean(10);                    // charge wind-up (low bullets), front-on
      await shoot('charge');
    } else if (state === 'shielded' || state === 'dread') {
      let sh = false;
      for (let i = 0; i < 25 && !sh; i++) {
        sh = await page.evaluate(() => { window.__dd.emit('bossDamage', { amount: 1e6, kind: 'debug' }); return window.__dd.bossState().shielded; });
        if (!sh) await page.waitForTimeout(120);
      }
      await page.waitForTimeout(6000);        // let the wing-fold pose settle symmetric
      await waitClean(6, 60);                 // wait for a graze-bait REST gap (few bullets), front-on
      await shoot(state);
    }
  }
  // If idle wasn't requested, we still shot it to lock framing — remove it.
  if (!states.includes('idle')) fs.rmSync(`${OUT}${bossId}-${cpTag}-idle-${roundTag}.png`, { force: true });
  await done();
  console.log('\nbosscrop done.');
} catch (e) {
  await done().catch(() => {});
  console.error('bosscrop error:', e && e.stack || e);
  process.exit(3);
}
