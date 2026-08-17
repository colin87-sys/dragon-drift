// WING LAB FIRE PROBE — the I3 gate, made into numbers.
//
//   cd reforged && node wing-lab/tools/wingfire.mjs [key ...] [--no-control]
//
// §7.1 is a BUDGET, and a budget is the one part of a fire design that cannot be argued
// from a render: "3–6% at cruise" is either true of the pixels or it is not. This probe
// measures, on masked pixels (see `wlSurfaceScan` in wingshot.html):
//
//   1. THE EMISSIVE FRACTION per authored state, as a share of ONE WING's projected
//      area, at the VENTRAL money crop — because the radiator is ventral (F1 B2) and
//      measuring it from the chase camera would report ~0% and pass for the wrong reason.
//      Bands: cold ~1% · cruise 3–6% · power ≤12% · ignition ≤15%.
//   2. CLIPPED WHITE ≤1% of wing area in EVERY state. A pixel counts as white only when
//      all three channels are at the ceiling; "any channel saturated" would score a
//      correctly-authored saturated orange as white and report ~30%.
//   3. THE HUE LAW on membrane pixels — B−R ≤ 0 (kill #48). Scoped to the MEMBRANE by
//      the director's I3 instruction: the §7.4 temper blues are non-emissive tints on the
//      SKELETON, and a whole-wing blue test would fail on the one legal blue in the design.
//   4. R3(a) THE L/R ASSERTION. The Round-3 backlit planform read one wing crimson and one
//      bright orange. The ruling: view-dependence is an authored feature off the mirror
//      plane, so the falsifiable version is a camera EXACTLY on the sagittal plane with the
//      sun EXACTLY anti-camera — there, L and R must agree within 10%. If this is absent or
//      fails, MEMBRANE re-opens.
//
// KILL #67 IS LAW: no probe verdict without a negative control. Every threshold here is
// run against known-bads as well as the real article:
//   * band (low)   -> uFireGain 0. Every pane is still masked as fire; none of them is
//                     lit, so the fraction must collapse and the cruise floor must FAIL.
//   * band (high)  -> the ignition stage forced while the cruise band is applied. The
//                     fraction must overrun the cruise ceiling and FAIL.
//   * clipped      -> uFireGain 6x. The core must blow past the 1% white ceiling and FAIL.
//   * L/R          -> the same backlit planform shot OFF the mirror plane. It must FIRE,
//                     which is what makes the on-plane pass mean something.
//   * whole system -> `revenant`, a shipped hero with no fire at all: zero fire pixels.
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
const KEY = ARGS.filter((a) => !a.startsWith('--'))[0] || 'forgewing';

const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 640, height: 640 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/wing-lab/tools/wingshot.html`);
await page.waitForFunction(() => window.__ready === true || window.__wlErrText, { timeout: 40000 });
const boot = await page.evaluate(() => window.__wlErrText || null);
if (boot) { console.error('STAGE ERROR:', boot); await browser.close(); srv.close?.(); process.exit(1); }

const scan = (o) => page.evaluate((a) => window.wlSurfaceScan(a), o);
const tier = await page.evaluate((k) => window.wlMaxTier(k), KEY);

// THE FIRE MONEY CAM: one wing, from BELOW and behind — the pose and the angle at which
// the forge window is actually presented. `oneWing` matters: the budget's denominator is
// "one wing's projected area", and the far wing drifting into frame would silently double it.
const CAM = { pose: 'glide', angle: 'wingunder', fill: 0.60, size: 600, bg: 'dark', wingOnly: true, oneWing: true };
// Three different pinned clock values, so the states are not all sampled at the same phase
// of the 2.35 Hz flicker and the 0.43 Hz throb (a budget measured at one instant of one
// rhythm is a budget measured at one instant of one rhythm).
const CLOCK = { cold: 0.37, cruise: 1.13, power: 2.71, ignition: 4.29 };
const STATES = ['cold', 'cruise', 'power', 'ignition'];
const BAND = { cold: [0.002, 0.020], cruise: [0.030, 0.060], power: [0.030, 0.120], ignition: [0.060, 0.150] };
const CLIP_MAX = 0.010;
const LR_MAX = 0.10;

const pct = (v) => (v == null ? '   —  ' : (100 * v).toFixed(2).padStart(6) + '%');
const mark = (ok) => (ok ? '✓' : '✗');

async function fireRow(state, mutate) {
  const s = await scan({ key: KEY, tier, ...CAM, fire: state, fireTime: CLOCK[state], mutate });
  return { state, ...s };
}

console.log(`\n═══ ${KEY} f${tier} — §7 FIRE PROBE ═══`);
console.log('  money cam: ONE wing, glide, ventral 3/4 from below, dark backdrop, 600 px\n');
console.log('  state       wing px   fire px   lit px   EMISSIVE FRAC   band        CLIPPED WHITE   verdict');
const rows = [];
for (const st of STATES) rows.push(await fireRow(st, null));
let bandOK = true, clipOK = true;
for (const r of rows) {
  const [lo, hi] = BAND[r.state];
  const inBand = r.emissiveFrac >= lo && r.emissiveFrac <= hi;
  const clipFine = r.clippedFrac <= CLIP_MAX;
  bandOK = bandOK && inBand; clipOK = clipOK && clipFine;
  console.log(`  ${r.state.padEnd(10)} ${String(r.wingPx).padStart(7)} ${String(r.firePx).padStart(9)} ${String(r.fireOnPx).padStart(8)}   ${pct(r.emissiveFrac)}      ${(100 * lo).toFixed(0)}–${(100 * hi).toFixed(0)}%${' '.repeat(Math.max(1, 7 - String(Math.round(100 * hi)).length))}${pct(r.clippedFrac)} (≤1%)  ${mark(inBand)}${mark(clipFine)}`);
}

// §7.1's hue law, measured twice: on the THERMAL RAMP (where kill #48 points) and on the
// MEMBRANE (the I2 guard, which the director scoped to membrane pixels for I3 precisely
// because the §7.4 temper blues are legal, non-emissive, and live on the skeleton).
const hot = rows[3];
console.log(`\n  HUE LAW — the thermal ramp (lit fire pixels, every state)`);
let rampOK = true;
for (const r of rows) {
  const ok = r.fireBGFrac === 0 && r.fireGRFrac === 0;
  rampOK = rampOK && ok;
  console.log(`    ${r.state.padEnd(10)} lit ${String(r.fireOnPx).padStart(6)}  frac(B>G) ${r.fireBGFrac.toFixed(5)}  frac(G>R) ${r.fireGRFrac.toFixed(5)}  ${mark(ok)} R ≥ G ≥ B strictly`);
}
// …and the membrane guard on ITS OWN camera. The I2 guard was measured at the money cam
// (glide, wing crop, sky) under the full front-lit stage, which is where a cool key can
// actually paint blue onto the sheet; re-measuring it from below in the dark would report
// 0.0000 for want of light and certify nothing. Fire is at IGNITION here: if a fire pass
// is going to push blue into the membrane it will do it at the hottest state.
const MEMCAM = { pose: 'glide', angle: 'wing', fill: 0.55, size: 560, bg: 'sky' };
const memHue = await scan({ key: KEY, tier, ...MEMCAM, fire: 'ignition', fireTime: CLOCK.ignition });
console.log(`  HUE LAW — the membrane, at the I2 money cam (glide · wing crop · sky · ignition)`);
console.log(`    B−R mean ${memHue.blueMean.toFixed(4)}  max ${memHue.blueMax.toFixed(4)}  worst 16px tile ${memHue.blueWorstTile.toFixed(4)}  frac(B>R) ${memHue.blueFrac.toFixed(4)}   (I2 measured 0.0000)`);
const hueOK = memHue.blueWorstTile <= 0.020;
console.log(`  ${mark(hueOK)} no membrane tile averages more blue than red (≤0.020) — the temper blues are on the SKELETON only`);

// ── R3(a): the L/R assertion, on the mirror plane ────────────────────────────
const MIRROR = { pose: 'glide', angle: 'mirrortop', light: 'backmirror', bg: 'dark', fill: 0.84, size: 600 };
const OFFAXIS = { pose: 'glide', angle: 'offaxistop', light: 'back', bg: 'dark', fill: 0.84, size: 600 };
const lrOn = await scan({ key: KEY, tier, ...MIRROR, fire: 'cruise', fireTime: CLOCK.cruise });
const lrOff = await scan({ key: KEY, tier, ...OFFAXIS, fire: 'cruise', fireTime: CLOCK.cruise });
const lrOK = lrOn.lrDelta <= LR_MAX;
console.log(`\n  R3(a) BACKLIT PLANFORM, L/R MEMBRANE MEAN LUMA`);
console.log(`    on the mirror plane   L ${lrOn.memL.toFixed(4)} (n=${lrOn.memLn})   R ${lrOn.memR.toFixed(4)} (n=${lrOn.memRn})   Δ ${(100 * lrOn.lrDelta).toFixed(1)}%   ${mark(lrOK)} (need ≤ ${100 * LR_MAX}%)`);
console.log(`    OFF the mirror plane  L ${lrOff.memL.toFixed(4)} (n=${lrOff.memLn})   R ${lrOff.memR.toFixed(4)} (n=${lrOff.memRn})   Δ ${(100 * lrOff.lrDelta).toFixed(1)}%   ← the view-dependence, as designed`);

console.log('\n  VERDICT');
console.log(`    ${mark(bandOK)} every state inside its §7.1 emissive band`);
console.log(`    ${mark(clipOK)} clipped white ≤ 1% of wing area in every state`);
console.log(`    ${mark(rampOK)} R ≥ G ≥ B strictly on every lit emissive pixel (kill #48)`);
console.log(`    ${mark(hueOK)} hue law holds on the membrane`);
console.log(`    ${mark(lrOK)} L/R within 10% on the mirror plane`);

// ── §11 PROBE LAW / kill #67 ─────────────────────────────────────────────────
if (!ARGS.includes('--no-control')) {
  console.log('\n═══ NEGATIVE CONTROLS (these MUST fail — a green line here is a broken probe) ═══');
  // Each control names the ONE metric it is built to trip. Reporting every metric for
  // every control is how a control sheet fills with red herrings — and a "✗ PROBE IS
  // BROKEN" on a metric the control was never aimed at is exactly the kind of noise that
  // gets a real failure skipped.
  const CHECK = {
    band: (r, b) => { const [lo, hi] = BAND[b]; return r.emissiveFrac >= lo && r.emissiveFrac <= hi; },
    clip: (r) => r.clippedFrac <= CLIP_MAX,
    ramp: (r) => r.fireBGFrac === 0 && r.fireGRFrac === 0,
    memhue: (r) => r.blueWorstTile <= 0.020,
  };
  const SHOW = {
    band: (r, b) => `frac ${pct(r.emissiveFrac)} vs the ${(100 * BAND[b][0]).toFixed(0)}–${(100 * BAND[b][1]).toFixed(0)}% band  (fire px ${r.firePx}, lit ${r.fireOnPx})`,
    clip: (r) => `clipped white ${pct(r.clippedFrac)} vs the 1% ceiling`,
    ramp: (r) => `frac(B>G) ${r.fireBGFrac.toFixed(5)} · frac(G>R) ${r.fireGRFrac.toFixed(5)} vs 0`,
    memhue: (r) => `membrane worst 16px B−R tile ${r.blueWorstTile.toFixed(4)} vs the 0.020 ceiling`,
  };
  const ctl = [];
  ctl.push(['band FLOOR — uFireGain 0: every pane still masked as fire, none of them lit',
    'band', 'cruise', await fireRow('cruise', { uFireGain: 0 })]);
  ctl.push(['band CEILING — the ignition geometry judged against the cruise band',
    'band', 'cruise', await fireRow('cruise', { uFireStage: 3, uFireGain: 1.34 })]);
  ctl.push(['clipped white — uFireGain ×6 blows the core out',
    'clip', 'cruise', await fireRow('cruise', { uFireGain: 6.0 })]);
  ctl.push(['thermal ramp — a BLUE-authored emitter (kill #48 by construction)',
    'ramp', 'ignition', await fireRow('ignition', { fireEmissive: 0x2040ff, uFireGain: 3.0 })]);
  ctl.push(['membrane hue — I1 materials + the stock dielectric specular (the R1 blue sheen), at the I2 cam',
    'memhue', 'cruise', await scan({ key: KEY, tier, ...MEMCAM, fire: 'ignition', fireTime: CLOCK.ignition,
      mutate: { color: 0x3c2b1f, roughness: 0.38, env: 0.06, uMemScale: 0, uMemAmbient: 0,
        uMemSpecMul: 2.0, uMemSpecF90: 1.0 } })]);
  for (const [label, metric, band, r] of ctl) {
    const cleared = CHECK[metric](r, band);
    console.log(`    ${label}`);
    console.log(`       targets ${metric.toUpperCase()}: ${SHOW[metric](r, band)}  ${cleared ? '✗ CLEARED — PROBE IS BROKEN' : '✓ fired'}`);
  }
  // the L/R metric must be able to report a difference
  console.log(`    L/R metric — the same shot OFF the mirror plane`);
  console.log(`       Δ ${(100 * lrOff.lrDelta).toFixed(1)}% vs the ${100 * LR_MAX}% gate  ${lrOff.lrDelta <= LR_MAX ? '✗ PASSED — the metric cannot see an L/R split' : '✓ fired'}`);
  // a shipped hero has no fire at all: the fire mask must be empty, which proves the mask
  // is keyed on this wing's fire system and not on "anything bright".
  const rTier = await page.evaluate(() => window.wlMaxTier('revenant'));
  const rev = await scan({ key: 'revenant', tier: rTier, ...CAM, fire: 'ignition' });
  console.log(`    revenant (shipped, no fire system) — fire px ${rev.firePx} · lit ${rev.fireOnPx} · frac ${pct(rev.emissiveFrac)}  ${rev.fireOnPx === 0 ? '✓ fired (nothing to find)' : '✗ the mask is finding something that is not our fire'}`);
}

await browser.close(); srv.close?.();
process.exit(0);
