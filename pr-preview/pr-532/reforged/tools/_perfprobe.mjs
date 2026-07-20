// _perfprobe.mjs — frame-time probe for the Empyrean uplift: measures mean FPS + p90 frame time over
// an 8s cruise window in biome 5 (all uplift systems live) vs biome 2 (Frozen, a mid-weight control),
// same seed/tier/viewport. Headless GPU absolute numbers are not device numbers — the CONTROL DELTA is
// the finding.   node tools/_perfprobe.mjs
import { boot } from '../tests/browser.mjs';

const mkSave = () => `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 3, stats: { runs: 5 }, flags: { seenIntro: true, seenFirstSurge: true },
  settings: { reticle: false, qualityOverride: 0 },
}))`;

async function probe(biome) {
  const { page, done } = await boot({ query: `?biome=${biome}&debug&cleanshot&seed=73101`, viewport: { width: 960, height: 600 }, deviceScaleFactor: 1, initScript: mkSave() });
  await page.waitForFunction(() => !!window.__dd && !!document.getElementById('btn-start'), { timeout: 30000 });
  await page.waitForFunction(() => {
    const b = document.getElementById('btn-start'); if (b) b.click();
    return window.__dd.game && window.__dd.game.state === 'playing';
  }, { timeout: 30000, polling: 500 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__dd.noBoss(true); window.__dd.player.dist = 2400; });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => new Promise((res) => {
    const dts = []; let last = performance.now(); const t0 = last;
    const loop = () => {
      const now = performance.now(); dts.push(now - last); last = now;
      if (now - t0 < 8000) requestAnimationFrame(loop);
      else { dts.sort((a, b) => a - b); res({ fps: +(1000 / (dts.reduce((s, x) => s + x, 0) / dts.length)).toFixed(1), p90: +dts[Math.floor(dts.length * 0.9)].toFixed(1) }); }
    };
    requestAnimationFrame(loop);
  }));
  console.log(`  [perf biome=${biome}] mean=${r.fps}fps p90=${r.p90}ms`);
  await done();
  return r;
}

console.log('EMPYREAN perf probe (8s cruise, tier 0, headless — judge the DELTA, not the absolutes)');
const b5 = await probe(5);
const b2 = await probe(2);
console.log(`  [delta] biome5 vs control: ${(b2.fps - b5.fps).toFixed(1)}fps mean, ${(b5.p90 - b2.p90).toFixed(1)}ms p90`);
