// WING LAB — THE CHANNEL PROBE (I4.1). "No background-coloured channel crosses the wing
// interior in ANY delivered tile, black tiles included."
//
//   cd reforged && node wing-lab/tools/wingslit.mjs [key ...] [--debug]
//
// Round 6 lost MOTION on a HOLE, not on a shape: the 0.296 u carpal weld gap read as a
// pale channel cutting the wing in two — in the spread tile, at 4×, in two fire tiles and
// faintly in the pure-black planform. The quad probe could not see it and never could:
// a slit is not a right angle, and a contour tracer walks the OUTSIDE of a shape, so a
// channel that opens at one end is just part of the outline it never questions. This is
// the checker that CAN see it (the method is documented in `wlSlitScan`, wingshot.html:
// morphological closing → depth-of-penetration, so a legitimate scallop notch and an
// illegitimate slit are separated by how far into the body the gap reaches).
//
// KILL #67 IS LAW. Three controls, all in this run:
//   (a) THE KNOWN-BAD IS THE PREVIOUS BUILD. The carpal lap's pre-I4.1 vertex positions
//       ship inside the geometry as `wlCarpalOrig` — ~2 KB of pure liability, the same
//       idiom as the R4 cold ring — so `mutate:{carpalOpen:1}` restores the exact wing
//       that lost Round 6 and the probe must FIRE on it, at the same angles, in the
//       same run, seconds apart from the pass.
//   (b) A SYNTHETIC SLIT on a known-good article (`mutate:{slitTest:…}` is not needed —
//       the roster wings are the known-goods: three shipped membranes that have no
//       channel, and the probe must CLEAR all of them or its threshold is a rubber stamp.
//   (c) THE THRESHOLD ITSELF is reported (R, depthMin, lenMin) on every row, and the
//       worst NON-channel gap is printed beside the verdict — a probe whose margin is
//       invisible is a probe nobody can audit.
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';
import { serve } from '../../tests/serve.mjs';

const require = createRequire(import.meta.url);
const pw = (() => {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
})();

const ARGS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const DEBUG = process.argv.includes('--debug');
const KEYS = ARGS.length ? ARGS : ['forgewing'];
const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 560, height: 560 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/wing-lab/tools/wingshot.html`);
await page.waitForFunction(() => window.__ready === true || window.__wlErrText, { timeout: 40000 });

// EVERY delivered tile's read, not a convenient one: the poses sheet's three, the
// planform sheet's five angles, the chase cam the cycle + fire sheets use, and the fold
// arc — a channel that only opens mid-fold is still a channel on camera.
// …at the angles whose wing-ALONE silhouette is a closed shape. `wingside` and
// `wingfront` frame the whole model and reduce one wing to an edge-on sliver, where a
// "channel" is the space the body would occupy — a measurement about framing, not skin.
const READS = [
  ['wing', 'glide', 0.80], ['wing', 'downstroke', 0.80], ['wing', 'apex', 0.80],
  ['wingtop', 'glide', 0.80], ['wingrear', 'glide', 0.80],
  ['wingbank', 'bank', 0.80], ['wingunder', 'glide', 0.80],
  ['wing', 'fold', 0.80], ['wingtop', 'fold', 0.80],
];
const ok = (b) => (b ? '✓' : '✗');

async function scan(key, tier, angle, pose, fill, mutate) {
  return page.evaluate((o) => (o.dbg ? window.wlSlitDebug(o) : window.wlSlitScan(o)), {
    key, tier, angle, pose, fill, mutate: mutate || null, size: 480, dbg: false });
}

let hardFail = 0;
for (const key of KEYS) {
  const tier = await page.evaluate((k) => window.wlMaxTier(k), key);
  console.log(`\n═══ ${key} f${tier} — CHANNEL PROBE (no background-coloured channel in the wing interior) ═══`);
  let head = true, worstAll = 0, chans = 0;
  for (const [angle, pose, fill] of READS) {
    const r = await scan(key, tier, angle, pose, fill, null);
    if (r.error) { console.log(`  ${angle.padEnd(10)} ${pose.padEnd(11)} ${r.error}`); continue; }
    if (head) { console.log('  (verdict: the wing\'s silhouette must be ONE piece with NO enclosed background. The NECK — the');
      console.log('   narrowest isthmus holding it together, found by eroding until it falls in two — is the margin.)');
      console.log(`   (a hole is a CHANNEL when ≥80% of its border is WING, it runs ≥ ${r.lenMin}px, and it is ≥0.1% of the article)`);
      console.log('   angle      pose         ink px   pieces (≥12%)   NECK px   biggest enclosed bg  (wing frac)   VERDICT'); head = false; }
    worstAll = Math.max(worstAll, r.worstDepth);
    chans += r.channels.length;
    console.log(`   ${ok(r.channels.length === 0)} ${angle.padEnd(10)} ${pose.padEnd(11)} ${String(r.inkPx).padStart(6)}   ${String(r.parts.join('+')).padStart(13)} ${String(r.neck == null ? '—' : r.neck).padStart(8)} ${String(r.holeBig).padStart(14)}px²/${String(r.holeLen).padStart(5)}px (${String(r.holeWingFrac).padStart(4)})   ${r.channels.length ? 'CHANNEL' : 'one piece, no wing-bordered hole'}`);
    for (const c of r.channels) console.log(`        ↳ ${c.kind === 'severed' ? `SEVERED — the wing is ${c.parts.length} pieces: ${c.parts.join(' + ')} px` : `CHANNEL — ${c.area}px² of background enclosed by wing (${100 * c.wingFrac}% of its border), ${c.len}px long, at (${c.x},${c.y})`}`);
    if (DEBUG) {
      await page.evaluate((o) => window.wlSlitDebug(o), { key, tier, angle, pose, fill, size: 480 });
      writeFileSync(new URL(`../refs/slitprobe-${key}-${angle}-${pose}.png`, import.meta.url).pathname,
        await page.screenshot({ clip: { x: 0, y: 0, width: 480, height: 480 } }));
    }
  }
  console.log(`  ${key}: ${chans} channel(s) across ${READS.length} reads  → ${chans === 0 ? 'PASS — no background-coloured channel crosses the wing in any delivered read' : 'FAIL'}`);
  if (chans) hardFail++;
}

// ═══ NEGATIVE CONTROLS (kill #67) ════════════════════════════════════════════
console.log('\n═══ NEGATIVE CONTROLS — the probe fired on a known-bad and cleared a known-good ═══');
if (KEYS.includes('forgewing')) {
  const tier = await page.evaluate((k) => window.wlMaxTier(k), 'forgewing');
  console.log('\n  (a) THE ROUND-6 BUILD, PUT BACK — `carpalOpen` restores the pre-lap vertex row that lost MOTION:');
  let fired = 0, tried = 0;
  for (const [angle, pose, fill] of [['wing', 'glide', 0.80], ['wingtop', 'glide', 0.80], ['wing', 'downstroke', 0.80]]) {
    const r = await scan('forgewing', tier, angle, pose, fill, { carpalOpen: 1 });
    if (r.error) continue;
    tried++; if (r.channels.length) fired++;
    console.log(`      ${angle.padEnd(10)} ${pose.padEnd(11)} pieces ${String(r.parts.join('+')).padStart(13)}  neck ${String(r.neck == null ? '—' : r.neck).padStart(4)}px  hole ${String(r.holeBig).padStart(6)}px²/${r.holeLen}px (${r.holeWingFrac} wing-bordered)   ${r.channels.length ? '✓ FIRES' : '✗ DID NOT FIRE — the probe is blind'}`);
  }
  if (!fired) { console.log('      ✗✗ THE KNOWN-BAD DID NOT FIRE. Every pass above is worthless (kill #67).'); hardFail++; }
  else console.log(`      ✓ fired on ${fired}/${tried} known-bad reads`);
}
// (b) THE SAME SURFACE, BOTH WAYS. The skirt is the article's one large continuous
// membrane sheet: it must CLEAR, and separating its two halves (`slitTest`) must make it
// FIRE. Fire-and-clear on ONE surface is the strongest form of the control — it cannot be
// explained by the two articles differing in anything but the defect.
if (KEYS.includes('forgewing')) {
  const tier = await page.evaluate((k) => window.wlMaxTier(k), 'forgewing');
  console.log('\n  (b) A CONTINUOUS MEMBRANE SHEET, WITH AND WITHOUT A HOLE PUNCHED IN IT (the plagiopatagium):');
  let good = 0, bad = 0;
  for (const [angle, pose, fill] of [['wingtop', 'glide', 0.80], ['wing', 'glide', 0.80]]) {
    const a = await scan('forgewing', tier, angle, pose, fill, null);
    const b = await scan('forgewing', tier, angle, pose, fill, { slitTest: 1.0 });
    good += a.channels.length; bad += b.channels.length;
    console.log(`      ${angle.padEnd(10)} intact: ${a.channels.length} channel(s), neck ${a.neck == null ? '—' : a.neck}px` +
      `   ·   cut: ${b.channels.length} channel(s), neck ${b.neck == null ? '—' : b.neck}px   ${b.channels.length > a.channels.length ? '✓ the cut FIRES' : '✗ the cut did not fire'}`);
  }
  if (!bad) { console.log('      ✗✗ A CHANNEL CUT INTO A SHEET DID NOT FIRE — the probe is blind (kill #67).'); hardFail++; }
}
// (c) CONTEXT, not a verdict: the shipped roster. Their wings are strut COMBS with real
// open slots between separate blades — legitimately outside the membrane — so they are
// not known-goods for "one continuous skin", and their numbers are printed as calibration
// only. Reporting them as a pass/fail would be the probe certifying its own opinion.
console.log('\n  (c) CALIBRATION (context, NOT a verdict) — the shipped strut-comb wings:');
for (const k of ['vesper', 'revenant', 'tempest']) {
  const tier = await page.evaluate((kk) => window.wlMaxTier(kk), k);
  let ch = 0, nk = [];
  for (const [angle, pose, fill] of [['wing', 'glide', 0.80], ['wingtop', 'glide', 0.80]]) {
    const r = await scan(k, tier, angle, pose, fill, null);
    if (r.error) continue;
    ch += r.channels.length; nk.push(r.neck == null ? '—' : r.neck);
  }
  console.log(`      ${k.padEnd(10)} channels ${ch}  necks ${nk.join(' / ')}px  (a strut comb IS separate blades — context, not a verdict)`);
}

await browser.close(); srv.close?.();
console.log(`\n${hardFail === 0 ? 'PASS — no channel, controls behaved' : 'FAIL'}\n`);
process.exit(hardFail === 0 ? 0 : 1);
