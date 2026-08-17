// WING LAB — I4 COST probe. Measured FRAME TIME on the mobile profile.
//
//   cd reforged && node wing-lab/tools/wingperf.mjs [keyA keyB ...]
//
// §11's ruling after R3 is explicit: "the binding number was always 60 fps on weak mobile —
// MEASURED at the I4 COST gate, not estimated". The ≈45-ALU membrane shader was accepted
// provisionally so it could be judged here, on frames.
//
// Headless-GPU absolutes are not device numbers. The finding is the DELTA against a control
// that differs in exactly one thing: `forgewing` is the Thunderhead Tempest's torso, head
// and tail with a different WING bolted on, so tempest − forgewing IS the wing's cost, and
// nothing else. Quality is pinned to LOW (`qualityOverride: 2`, the 0.35 scalar tier) —
// the mobile profile — and the same seed, viewport and window are used for both.
//
// This probe carries its own negative control: it also measures `vesperLean` (993 tris, the
// cheapest Eternal on the roster). If the harness reports the same frame time for a 993-tri
// wing and a 3,156-tri one with a per-pixel exponential on it, the harness is measuring the
// browser's vsync and not the renderer, and every number here is void (kill #67).
import { boot } from '../../tests/browser.mjs';

const KEYS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const LIST = KEYS.length ? KEYS : ['forgewing', 'tempest', 'vesperLean'];
const SECONDS = 8;

const save = (owned) => `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 3, embers: 999999,
  skins: { owned: ['${owned}'], equipped: '${owned}' },
  ascension: { tiers: [['${owned}', 4]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenIntro: true, seenFirstSurge: true, hintsSeen: 9 },
  stats: { runs: 5 },
  settings: { reticle: false, qualityOverride: 2 },
}))`;

async function probe(key) {
  const { page, errors, done } = await boot({
    query: '?debug&cleanshot&seed=73101', viewport: { width: 960, height: 600 },
    deviceScaleFactor: 1, initScript: save(key),
  });
  await page.waitForFunction(() => !!window.__dd && !!document.getElementById('btn-start'), { timeout: 60000 });
  await page.waitForFunction(() => {
    const b = document.getElementById('btn-start'); if (b) b.click();
    return window.__dd.game && window.__dd.game.state === 'playing';
  }, { timeout: 60000, polling: 500 });
  await page.waitForTimeout(2000);
  await page.evaluate(() => { if (window.__dd.noBoss) window.__dd.noBoss(true); if (window.__dd.player) window.__dd.player.dist = 2400; });
  await page.waitForTimeout(2500);
  const r = await page.evaluate((secs) => new Promise((res) => {
    const dts = []; let last = performance.now(); const t0 = last;
    const loop = () => {
      const now = performance.now(); dts.push(now - last); last = now;
      if (now - t0 < secs * 1000) requestAnimationFrame(loop);
      else {
        const mean = dts.reduce((s, x) => s + x, 0) / dts.length;
        dts.sort((a, b) => a - b);
        res({ n: dts.length, mean: +mean.toFixed(2), fps: +(1000 / mean).toFixed(1),
          p50: +dts[Math.floor(dts.length * 0.5)].toFixed(2),
          p90: +dts[Math.floor(dts.length * 0.9)].toFixed(2),
          p99: +dts[Math.floor(dts.length * 0.99)].toFixed(2) });
      }
    };
    requestAnimationFrame(loop);
  }), SECONDS);
  const tris = await page.evaluate(() => {
    try { return window.__dd.renderer ? window.__dd.renderer.info.render.triangles : null; } catch { return null; }
  });
  console.log(`  ${key.padEnd(11)} mean ${r.mean.toFixed(2)} ms (${r.fps} fps) · p50 ${r.p50} · p90 ${r.p90} · p99 ${r.p99}  [${r.n} frames${tris ? ', ' + tris + ' tris/frame' : ''}${errors.length ? ', ' + errors.length + ' page errors' : ''}]`);
  if (errors.length) console.log('     ' + errors.slice(0, 2).join('\n     '));
  await done();
  return r;
}

console.log(`WING LAB COST probe — ${SECONDS}s cruise, quality LOW (mobile profile), 960×600, seed 73101`);
console.log('judge the DELTA against the control, never the absolutes (headless GPU)\n');
const out = {};
for (const k of LIST) out[k] = await probe(k);
if (out.forgewing && out.tempest) {
  const d = out.forgewing.mean - out.tempest.mean;
  console.log(`\n  WING COST  forgewing − tempest = ${d >= 0 ? '+' : ''}${d.toFixed(2)} ms/frame mean · ` +
    `${(out.forgewing.p90 - out.tempest.p90).toFixed(2)} ms p90   (same torso/head/tail; the wing is the only variable)`);
  console.log(`  60 fps budget is 16.67 ms — headroom at LOW: ${(16.67 - out.forgewing.mean).toFixed(2)} ms mean · ${(16.67 - out.forgewing.p90).toFixed(2)} ms at p90`);
}
if (out.vesperLean && out.forgewing) {
  const spread = Math.abs(out.forgewing.mean - out.vesperLean.mean);
  console.log(`  CONTROL    vesperLean (993 tris, no transmission shader) vs forgewing: ${spread.toFixed(2)} ms apart   ` +
    `${spread > 0.05 ? '✓ the probe resolves a difference between wings' : '✗ VOID — the probe is measuring vsync, not the renderer'}`);
}
console.log('');
