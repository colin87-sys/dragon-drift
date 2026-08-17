// WING LAB MEMBRANE PROBE — the I2 gate, made into numbers.
//
//   cd reforged && node wing-lab/tools/wingtiers.mjs [key ...]
//
// Measures the three things the MEMBRANE gate is actually argued about, on masked pixels
// (see `wlSurfaceScan` in wingshot.html — the mask is why "membrane luma" means membrane
// and not membrane-plus-sky-plus-bone):
//
//   1. §5.5 VALUE TIERS — the mean luma of each AUTHORED tier (read off a vertex-colour
//      mask pass, not guessed from luminance quartiles) at the money cam on the sky
//      backdrop under the game light, and their spread (spec: >= 3x, 0.05 -> 0.15).
//   2. §6.2 THE POLARITY FLIP — the membrane's own TRANSMISSION GAIN (backlit mean ÷
//      front-lit mean; an opaque sheet can only get darker) plus its rank against the
//      bone in both regimes: below the bone front-lit, well above it backlit.
//   3. THE BLUE SHEEN — Round 1's "blue door panel". Detected as the worst 16x16 tile
//      mean of (B - R) over membrane pixels, because a door panel is a large contiguous
//      cool area, not a stray pixel.
//
// KILL-LIST #67 IS LAW: no probe verdict without a negative control. Every threshold below
// is run against KNOWN-BAD articles as well as the real one:
//   * polarity  -> `revenant` (shipped, opaque membrane) must FAIL, and forgewing with
//                  `uMemScale = 0` (the I1 state) must FAIL.
//   * blue      -> forgewing forced back to I1's albedo + roughness 0.38 + env 0.06 + the
//                  stock dielectric specular (F0 0.04 / F90 1.0), transmission off, FAILS.
//   * tiers     -> forgewing with the membrane forced pure black must FAIL.
// A probe that has only ever passed proves nothing.
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { serve } from '../../tests/serve.mjs';

const require = createRequire(import.meta.url);
const pw = (() => {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
})();

const ARGS = process.argv.slice(2);
const KEYS = ARGS.filter((a) => !a.startsWith('--'));
const KEY = KEYS[0] || 'forgewing';

const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 640, height: 640 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/wing-lab/tools/wingshot.html`);
await page.waitForFunction(() => window.__ready === true || window.__wlErrText, { timeout: 40000 });
const boot = await page.evaluate(() => window.__wlErrText || null);
if (boot) { console.error('STAGE ERROR:', boot); await browser.close(); srv.close?.(); process.exit(1); }

const scan = (o) => page.evaluate((a) => window.wlSurfaceScan(a), o);
const maxTier = (k) => page.evaluate((k2) => window.wlMaxTier(k2), k);

// The MONEY CAM for this measurement: the single-wing crop at glide on the sky backdrop —
// §5.5 names the sky backdrop and the money cam explicitly, and the sky is the backdrop
// the membrane is hardest to keep dark against.
const CAM = { pose: 'glide', angle: 'wing', fill: 0.55, size: 560 };

const f = (v, w = 6) => (v == null ? '  —  '.padStart(w) : v.toFixed(4).padStart(w));
const row = (label, s) => `  ${label.padEnd(22)} n=${String(s ? s.n : 0).padStart(6)}  p05 ${f(s && s.p05)}  p25 ${f(s && s.p25)}  p50 ${f(s && s.p50)}  p75 ${f(s && s.p75)}  p95 ${f(s && s.p95)}`;

// Backlit, an opaque bone is BLACK — its median is exactly 0, so ratios are built on MEANS
// with a one-8-bit-code floor (1/255): below that the surface is black to the display.
//
// THE RATIO-OF-RATIOS IS NOT THE TEST. A "flip" of backlit-ratio ÷ front-lit-ratio passed
// every known-bad control in this file — including a membrane forced to PURE BLACK, which
// scored ×267 purely because its front-lit denominator was zero. The load-bearing quantity
// is the membrane's OWN TRANSMISSION GAIN: how much brighter the sheet gets when the sun
// moves behind it. An opaque sheet can only get darker (gain < 1); a transmitting one gets
// brighter (gain > 1). That, plus an absolute floor on the backlit glow, cannot be faked
// by being dark.
const FLOOR = 1 / 255;
async function article(key, tier, mutate, label) {
  const front = await scan({ key, tier, bg: 'sky', ...CAM, mutate });
  const back = await scan({ key, tier, bg: 'sky', ...CAM, light: 'back', mutate });
  const rat = (s) => (s && s.mem && s.bone ? s.mem.mean / Math.max(s.bone.mean, FLOOR) : null);
  const ratioF = rat(front), ratioB = rat(back);
  const memF = front.mem ? front.mem.mean : 0, memB = back.mem ? back.mem.mean : 0;
  return { key, label, front, back, ratioF, ratioB, memF, memB,
    gain: memB / Math.max(memF, FLOOR), flip: ratioF > 0 ? ratioB / ratioF : null,
    n: front.mem ? front.mem.n : 0 };
}

function report(a) {
  console.log(`\n─── ${a.label} ───`);
  console.log('  FRONT-LIT (game light, sky backdrop, wing crop @ glide)');
  console.log(row('membrane', a.front.mem));
  console.log(row('wing structure/bone', a.front.bone));
  console.log(row('flank skirt', a.front.skirt));
  console.log(`  §5.5 TIERS as AUTHORED (mean luma per tier, read off the vertex-colour mask)`);
  console.log(`      ${a.front.authored.map((t, i) => `T${i} ${t ? f(t.mean) + ` (n=${t.n})` : '—'}`).join('   ')}`);
  console.log(`      authored spread ${a.front.authoredSpread}×   ·   luminance-quartile bands ${a.front.tiers.map((t) => f(t)).join('  ')} → ${a.front.tierSpread}×`);
  console.log(`  BLUE       B−R  mean ${f(a.front.blueMean)}  max ${f(a.front.blueMax)}  frac(B>R) ${f(a.front.blueFrac)}  WORST 16px TILE ${f(a.front.blueWorstTile)}`);
  console.log('  BACKLIT (sun behind)');
  console.log(row('membrane', a.back.mem));
  console.log(row('wing structure/bone', a.back.bone));
  console.log(`  §6.2 POLARITY   membrane:bone (means)  front-lit ${a.ratioF == null ? '—' : a.ratioF.toFixed(3)}  →  backlit ${a.ratioB == null ? '—' : a.ratioB.toFixed(3)}`);
  console.log(`                  membrane mean luma  front-lit ${f(a.memF)}  →  backlit ${f(a.memB)}   TRANSMISSION GAIN ×${a.gain.toFixed(2)}`);
  if (a.n < 500) console.log(`  ⚠ only ${a.n} membrane pixels — this article's wingMat covers almost nothing; treat its ratios as noise`);
}

// ── thresholds (the verdict lines the gate is argued on) ──────────────────────
const PASS = {
  gain: 1.00,         // the sheet must get BRIGHTER when the sun goes behind it
  backAbs: 0.020,     // …and be genuinely lit backlit, not merely relatively lit
  ratioF: 1.00,       // front-lit the membrane must sit BELOW its own bones
  ratioB: 3.00,       // backlit it must clearly out-glow them
  tierSpread: 3.0,    // §5.5's four tiers span >= 3x luminance (measured AS AUTHORED)
  blueTile: 0.020,    // no 16x16 membrane tile may average more blue than red by this much
};
const verdict = (a) => ({
  gain: a.gain >= PASS.gain,
  backAbs: a.memB >= PASS.backAbs,
  ratioF: a.ratioF != null && a.ratioF <= PASS.ratioF,
  ratioB: a.ratioB != null && a.ratioB >= PASS.ratioB,
  tiers: a.front.authoredSpread != null && a.front.authoredSpread >= PASS.tierSpread,
  blue: a.front.blueWorstTile <= PASS.blueTile,
});
const polarityOK = (cv) => cv.gain && cv.backAbs && cv.ratioF && cv.ratioB;
const line = (name, ok, txt) => `    ${ok ? '✓' : '✗'} ${name.padEnd(12)} ${txt}`;

const tier = await maxTier(KEY);
const real = await article(KEY, tier, null, `${KEY} f${tier} — AS BUILT`);
report(real);
const v = verdict(real);
console.log('\n  VERDICT');
console.log(line('gain', v.gain, `membrane ${f(real.memF)} front-lit → ${f(real.memB)} backlit = ×${real.gain.toFixed(2)} (need ≥ ${PASS.gain.toFixed(2)})`));
console.log(line('backlit abs', v.backAbs, `membrane mean ${f(real.memB)} (need ≥ ${PASS.backAbs.toFixed(3)} — actually glowing)`));
console.log(line('front-lit', v.ratioF, `membrane:bone ${real.ratioF == null ? '—' : real.ratioF.toFixed(3)} (need ≤ ${PASS.ratioF.toFixed(2)} — darkest element)`));
console.log(line('backlit', v.ratioB, `membrane:bone ${real.ratioB == null ? '—' : real.ratioB.toFixed(3)} (need ≥ ${PASS.ratioB.toFixed(2)} — out-glows the bone)`));
console.log(line('tiers', v.tiers, `authored spread ${real.front.authoredSpread}× (need ≥ ${PASS.tierSpread})`));
console.log(line('blue', v.blue, `worst tile B−R ${f(real.front.blueWorstTile)} (need ≤ ${PASS.blueTile.toFixed(3)})`));

// ── §11 PROBE LAW / kill #67: the negative controls ──────────────────────────
if (!ARGS.includes('--no-control')) {
  console.log('\n═══ NEGATIVE CONTROLS (kill #67 — a probe that cannot fail proves nothing) ═══');
  const controls = [];
  // (a) A SHIPPED HERO. The Revenant's membrane is one flat value with no transmission
  //     term at all, so its polarity must NOT flip. (The Tempest is the bar, but its
  //     `wingMat` covers ~3 pixels — its bolt frame owns the wing — so it cannot carry a
  //     membrane statistic; using it would be a control that passes for lack of data.)
  const tTier = await maxTier('revenant');
  controls.push(await article('revenant', tTier, null, 'revenant (shipped) — known-bad for POLARITY'));
  // (b) the same article with the transmission switched off — I1's state exactly.
  controls.push(await article(KEY, tier, { uMemScale: 0, uMemAmbient: 0 },
    `${KEY} with uMemScale = 0 — known-bad for POLARITY`));
  // (c) I1's ENTIRE material authoring restored — albedo 0x3c2b1f, roughness 0.38, env 0.06,
  //     transmission off AND the specular back at three.js's untouched dielectric defaults
  //     (F0 0.04 = IOR 1.5, F90 1.0). Restoring only the albedo is NOT a known-bad: the
  //     measured cause of the blue sheen was the F90 horizon term, so a control that leaves
  //     the new F90 in place clears — and would have certified the fix without testing it.
  controls.push(await article(KEY, tier, { color: 0x3c2b1f, roughness: 0.38, env: 0.06,
    uMemScale: 0, uMemAmbient: 0, uMemSpecMul: 2.0, uMemSpecF90: 1.0 },
  `${KEY} at I1 materials + stock specular — known-bad for BLUE`));
  // (d) the membrane forced to PURE BLACK with every light term off. A black surface
  //     cannot be blue, cannot be tiered and cannot glow, so ALL THREE metrics must fire.
  //     This is the control that caught the probe's own FrontSide-mask bug: it reported a
  //     blue sheen of 0.148 on a black membrane, which is impossible, and the leak was the
  //     mask deleting every back-facing surface.
  controls.push(await article(KEY, tier, { color: 0x000000, uMemScale: 0, uMemAmbient: 0, uMemFringe: 0 },
    `${KEY} membrane forced PURE BLACK, all light terms off — known-bad for EVERYTHING`));
  for (const c of controls) report(c);

  console.log('\n  CONTROL VERDICT (these MUST fail — a green line here is a broken probe)');
  for (const c of controls) {
    const cv = verdict(c);
    console.log(`    ${c.label}`);
    console.log(`       polarity: gain ×${c.gain.toFixed(2)} · backlit mean ${f(c.memB)} · front-lit m:b ${c.ratioF == null ? '—' : c.ratioF.toFixed(3)} · backlit m:b ${c.ratioB == null ? '—' : c.ratioB.toFixed(2)}  ${polarityOK(cv) ? '✗ PASSED — PROBE IS BROKEN' : '✓ fired'}`);
    console.log(`       blue worst tile ${f(c.front.blueWorstTile)}  ${cv.blue ? 'cleared' : '✓ fired'}`);
    console.log(`       authored tier spread ${c.front.authoredSpread}×  ${cv.tiers ? 'cleared' : '✓ fired'}`);
  }
}

await browser.close(); srv.close?.();
process.exit(0);
