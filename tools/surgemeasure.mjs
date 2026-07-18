// SUNBREAK machine judge for the world-suppression grade (I1). Measures the pre-assess
// target table on real captures + a recorded grade-envelope trace (§M.1-10: traces over
// swiftshader frame-sequences). Prints a report; asserts nothing — it's the eyes the Fable
// critic + the gate read.
//   node tools/surgemeasure.mjs [key] [tier]
import { boot } from '../tests/browser.mjs';

const key = process.argv[2] || 'solar';
const tier = Number(process.argv[3] ?? 3);

function save(extra = '') {
  return `localStorage.setItem('dragonDriftSave', JSON.stringify({
    v: 2, embers: 999999,
    skins: { owned: ['${key}'], equipped: '${key}' },
    ascension: { tiers: [['${key}', ${tier}]], radiance: [] },
    cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
    flags: { seenFirstSurge: true, hintsSeen: 9, seenIntro: true },
    stats: { runs: 5 },
    settings: { reticle: false, slowMo: true, qualityOverride: 0 },
  }))`;
}

// Decode a screenshot (PNG buffer) inside the page via Image→canvas, and compute region
// stats. Returns channel means + luminance percentiles over named rectangles (fractional).
async function stats(page, buf, regions) {
  const b64 = buf.toString('base64');
  return page.evaluate(async ({ b64, regions }) => {
    const img = new Image();
    await new Promise((r) => { img.onload = r; img.src = 'data:image/png;base64,' + b64; });
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const L = (r, gg, b) => 0.299 * r + 0.587 * gg + 0.114 * b;
    const out = {};
    for (const [name, [x0, y0, x1, y1]] of Object.entries(regions)) {
      const px = Math.floor(x0 * img.width), py = Math.floor(y0 * img.height);
      const pw = Math.floor((x1 - x0) * img.width), ph = Math.floor((y1 - y0) * img.height);
      const d = g.getImageData(px, py, pw, ph).data;
      const lums = []; let sr = 0, sg = 0, sb = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; lums.push(L(d[i], d[i + 1], d[i + 2])); n++; }
      lums.sort((a, b) => a - b);
      const pct = (p) => lums[Math.min(lums.length - 1, Math.floor(p * lums.length))];
      // shadow band = darkest quartile channel means; highlight band = brightest decile
      let shr = 0, shg = 0, shb = 0, sn = 0, hir = 0, hig = 0, hib = 0, hn = 0;
      const loT = pct(0.25), hiT = pct(0.90);
      for (let i = 0; i < d.length; i += 4) {
        const l = L(d[i], d[i + 1], d[i + 2]);
        if (l <= loT) { shr += d[i]; shg += d[i + 1]; shb += d[i + 2]; sn++; }
        if (l >= hiT) { hir += d[i]; hig += d[i + 1]; hib += d[i + 2]; hn++; }
      }
      out[name] = {
        mean: [sr / n, sg / n, sb / n].map((v) => +v.toFixed(1)),
        medianL: +pct(0.5).toFixed(1), p90L: +pct(0.9).toFixed(1), p99L: +pct(0.99).toFixed(1),
        shadow: sn ? [shr / sn, shg / sn, shb / sn].map((v) => +v.toFixed(1)) : null,
        highlight: hn ? [hir / hn, hig / hn, hib / hn].map((v) => +v.toFixed(1)) : null,
      };
    }
    return out;
  }, { b64, regions });
}

// Fixed sample regions (fractional x0,y0,x1,y1). Dragon sits center; world = lower flanks +
// water; sky = upper band. HUD lives top/bottom edges — kept out of the world/sky samples.
const REGIONS = {
  dragon: [0.40, 0.36, 0.60, 0.62],   // the hero, center
  worldL: [0.04, 0.55, 0.30, 0.92],   // left biome/water flank
  worldR: [0.70, 0.55, 0.96, 0.92],   // right biome/water flank
  sky:    [0.15, 0.16, 0.85, 0.34],   // upper sky band (below the boss HUD)
};

async function capture(query, label) {
  const { page, errors, done } = await boot({ query, viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, initScript: save() });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 60000 });
  await page.evaluate(() => window.__dd.setQuality?.(0));
  await page.waitForTimeout(2600);   // let the flight settle
  // Headless clamps rawDt, so the grade (driven by game-time) ramps slower than wall-clock;
  // poll to full grade (or timeout) rather than trust a fixed wait, so we measure the real
  // full-suppression target state. No-op for the baseline (grade never rises).
  if (query.includes('fever')) {
    for (let i = 0; i < 60; i++) {
      const g = await page.evaluate(() => window.__dd.surgeState().gradeMix);
      if (g >= 0.9) break;
      await page.waitForTimeout(500);
    }
  }
  const path = `/tmp/measure-${label.split(' ')[0].toLowerCase()}.png`;
  const buf = await page.screenshot({ path });
  const st = await page.evaluate(() => window.__dd.surgeState());
  const s = await stats(page, buf, REGIONS);
  console.log(`\n== ${label} ==  gradeMix=${st.gradeMix?.toFixed(3)} exposure=${st.exposure?.toFixed(3)}/${st.exposureBase?.toFixed(3)} (dip ${((1 - st.exposure / st.exposureBase) * 100).toFixed(1)}%)  err=${errors.length}`);
  for (const [k, v] of Object.entries(s)) console.log(`  ${k.padEnd(7)} mean=${JSON.stringify(v.mean)} medL=${v.medianL} p90=${v.p90L} p99=${v.p99L} shadow=${JSON.stringify(v.shadow)} hi=${JSON.stringify(v.highlight)}`);
  await done();
  return { st, s };
}

async function envelope() {
  const { page, done } = await boot({ query: '?debug', viewport: { width: 640, height: 400 }, deviceScaleFactor: 1, initScript: save() });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 60000 });
  await page.evaluate(() => window.__dd.setQuality?.(0));
  // Drive a clean rising edge, sample the ramp, then a falling edge, sample the release.
  await page.evaluate(() => { window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 999; window.__ddSurgeT0 = performance.now(); });
  const samp = async () => page.evaluate(() => ({ t: performance.now() - window.__ddSurgeT0, g: window.__dd.surgeState().gradeMix }));
  const ramp = [];
  for (const ms of [120, 250, 500, 900, 1500, 2400]) { await page.waitForTimeout(ms - (ramp.at(-1)?.req ?? 0)); const r = await samp(); r.req = ms; ramp.push(r); }
  await page.evaluate(() => { window.__dd.game.feverActive = false; window.__dd.game.feverTimer = 0; window.__ddSurgeT1 = performance.now(); });
  const rel = [];
  for (const ms of [250, 750, 1500, 2200]) { await page.waitForTimeout(ms - (rel.at(-1)?.req ?? 0)); const r = await page.evaluate(() => ({ t: performance.now() - window.__ddSurgeT1, g: window.__dd.surgeState().gradeMix })); r.req = ms; rel.push(r); }
  console.log('\n== ENVELOPE (dragon-leads / ramp / release) ==');
  console.log('  ramp:   ' + ramp.map((r) => `${Math.round(r.t)}ms=${r.g.toFixed(3)}`).join('  '));
  console.log('  release:' + rel.map((r) => `${Math.round(r.t)}ms=${r.g.toFixed(3)}`).join('  '));
  await done();
}

const surge = await capture('?debug=fever', 'SURGE (full grade)');
const base = await capture('?debug', 'BASELINE (no surge)');
await envelope();

// Derived pre-assess metrics.
const dCore = surge.s.dragon.p99L, wDark = Math.min(surge.s.worldL.medianL, surge.s.worldR.medianL) || 1;
const ratio = dCore / Math.max(wDark, 1);
const wMedSurge = (surge.s.worldL.medianL + surge.s.worldR.medianL) / 2;
const wMedBase = (base.s.worldL.medianL + base.s.worldR.medianL) / 2;
const sh = surge.s.worldL.shadow, hi = surge.s.worldL.highlight;
console.log('\n== DERIVED (targets) ==');
console.log(`  T3 CORE:DARK ratio = ${ratio.toFixed(2)} : 1   (floor 5, aim ≥6)`);
console.log(`  T4 world median drop = ${(wMedSurge / wMedBase).toFixed(3)}× baseline   (aim 0.72–0.82)`);
console.log(`  T9 shadow band = ${JSON.stringify(sh)}  → B>R>G violet? B-R=${sh ? (sh[2] - sh[0]).toFixed(1) : '?'} R-G=${sh ? (sh[0] - sh[1]).toFixed(1) : '?'}`);
console.log(`  T10 highlight band = ${JSON.stringify(hi)}  → near-neutral? maxΔ=${hi ? (Math.max(...hi) - Math.min(...hi)).toFixed(1) : '?'}`);
console.log(`  T2 sky R−B: surge=${(surge.s.sky.mean[0] - surge.s.sky.mean[2]).toFixed(1)} base=${(base.s.sky.mean[0] - base.s.sky.mean[2]).toFixed(1)}  (magenta = surge more negative than base = FAIL)`);
