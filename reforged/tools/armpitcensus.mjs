// ARMPIT CENSUS — enclosed sky measured on the LIT STUDIO RENDER, not on a silhouette proxy.
//
// WHY THIS EXISTS, and it is not a flattering reason. The armpit hole — enclosed sky between the
// leading-edge batten arc and the root sheet, visible looking straight down — was reported by the
// art director at 1108 px against Tempest's 537. A fix was written for it, committed with a
// confident message, and claimed. The verification panel came back BYTE-IDENTICAL: the geometry had
// been added inboard of the joint where the torso already occludes it, while the hole is outboard
// and forward. Nobody re-read the panel that would have said so.
//
// `holecensus` could not arbitrate because it measures a low-res SILHOUETTE proxy of the whole
// creature, where this wedge falls under the pinhole threshold or merges with outside sky — it
// reported fornax 25 px against tempest 495 px, the reverse ordering, on the same defect. A proxy
// that inverts the ranking is not a conservative measurement, it is a wrong one.
//
// So this measures the ACTUAL ARTIFACT the gate reads: the lit studio render, same camera, same
// framing, flood-filled in-page. The number this prints is directly comparable to the number in the
// critic's report, which is the only property that matters for arbitration.
//
//   node tools/armpitcensus.mjs [key] [pose...]        (default fornax, all cycle phases)
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
const pw = (() => {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
})();

const argv = process.argv.slice(2);
const key = argv[0] || 'fornax';
const POSES = argv.length > 1 ? argv.slice(1) : ['glide', 'settle', 'downstroke'];
// `top` is where the armpit lives; `rear` is the shipped camera, where it counts double.
const ANGLES = ['top', 'rear'];
const MIN_PX = 20;   // below this it is a rasteriser speck at this resolution

const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/dragonstudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const tier = await page.evaluate((k) => window.dsMaxTier(k), key);

console.log(`\nArmpit census — ${key} (tier ${tier})\n${'-'.repeat(72)}`);
console.log('  enclosed sky on the LIT studio render (the artifact the gate actually reads)\n');

const rows = [];
for (const pose of POSES) {
  for (const angle of ANGLES) {
    const r = await page.evaluate(async (o) => {
      // `state` IS the pose here: glide/settle/downstroke are all STATE entries using BODY_ANGLES,
      // so one dsRender gives the exact panel the contact sheet builds.
      window.dsRender({ key: o.key, tier: o.tier, state: o.pose, bg: 'pale', angle: o.angle });
      const gl = document.getElementById('gl');
      const c = document.createElement('canvas');
      c.width = gl.width; c.height = gl.height;
      c.getContext('2d').drawImage(gl, 0, 0);
      const { data, width: W, height: H } = c.getContext('2d').getImageData(0, 0, c.width, c.height);
      // Background = the pale backdrop colour, matched with tolerance (ACES + AA soften edges).
      const isBg = (i) => Math.abs(data[i * 4] - 207) < 14 && Math.abs(data[i * 4 + 1] - 214) < 14 && Math.abs(data[i * 4 + 2] - 228) < 14;
      const N = W * H, region = new Uint8Array(N), stack = new Int32Array(N);
      let sp = 0;
      const pushOut = (i) => { if (isBg(i) && !region[i]) { region[i] = 1; stack[sp++] = i; } };
      for (let x = 0; x < W; x++) { pushOut(x); pushOut((H - 1) * W + x); }
      for (let y = 0; y < H; y++) { pushOut(y * W); pushOut(y * W + W - 1); }
      while (sp > 0) {
        const i = stack[--sp], x = i % W, y = (i - x) / W;
        if (x > 0) pushOut(i - 1); if (x < W - 1) pushOut(i + 1);
        if (y > 0) pushOut(i - W); if (y < H - 1) pushOut(i + W);
      }
      const holes = [];
      for (let i = 0; i < N; i++) {
        if (!isBg(i) || region[i]) continue;
        let area = 0, x0 = W, x1 = 0, y0 = H, y1 = 0;
        region[i] = 2; stack[0] = i; let s = 1;
        while (s > 0) {
          const j = stack[--s], x = j % W, y = (j - x) / W;
          area++;
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
          const nb = (k2) => { if (isBg(k2) && !region[k2]) { region[k2] = 2; stack[s++] = k2; } };
          if (x > 0) nb(j - 1); if (x < W - 1) nb(j + 1);
          if (y > 0) nb(j - W); if (y < H - 1) nb(j + W);
        }
        holes.push({ area, w: x1 - x0 + 1, h: y1 - y0 + 1, x: x0, y: y0 });
      }
      return { holes: holes.sort((a, b) => b.area - a.area), W, H };
    }, { key, tier, pose, angle });

    const big = r.holes.filter((h) => h.area >= MIN_PX);
    const total = big.reduce((a, h) => a + h.area, 0);
    rows.push({ pose, angle, total, n: big.length, worst: big[0] });
    console.log(`  ${pose.padEnd(11)} ${angle.padEnd(5)}  enclosed ${String(total).padStart(6)} px in ${String(big.length).padStart(2)} region(s)`
      + (big[0] ? `   worst ${big[0].area}px ${big[0].w}×${big[0].h} at (${big[0].x},${big[0].y})` : ''));
  }
}

await browser.close();
srv.close?.();
console.log('-'.repeat(72));
console.log('  Compare against Tempest at the same pose/angle before calling any number good or bad.');
