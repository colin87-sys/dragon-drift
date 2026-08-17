// WING LAB silhouette QUAD probe — "zero quadrilaterals detectable in the pure-black tiles",
// made into a measurement rather than an opinion.
//
//   cd reforged && node wing-lab/tools/wingquadprobe.mjs <key> [tier]
//
// Renders the WING ALONE in pure black at several angles, traces the outline, simplifies it,
// and reports every vertex where two long STRAIGHT runs meet at ~90°.
//
// The discriminator matters. A membrane silhouette is full of ~90° turns that are correct:
// every scallop cusp at a fingertip is one, because a trailing arc cut to 0.22–0.30 of bay
// width leaves each flank at ~46° and the tip closes at ~88°. Those flanks are ARCS. A
// quadrilateral's edges are not: they stay straight for a long way. So a corner only counts
// when BOTH runs are straight to within `eps` = 1px over at least `minLen` = 30px at 480².
// Douglas–Peucker at 1px does the work — an arc gets chopped into short runs and drops out,
// a card edge survives as one long run. Exits 1 if any angle still scores.
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

const ARGS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const DEBUG = process.argv.includes('--debug');
const KEY = ARGS[0] || 'forgewing';
const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 560, height: 560 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/wing-lab/tools/wingshot.html`);
await page.waitForFunction(() => window.__ready === true || window.__wlErrText, { timeout: 40000 });
const tier = ARGS[1] != null ? Number(ARGS[1]) : await page.evaluate((k) => window.wlMaxTier(k), KEY);

// fills chosen so the wing sits INSIDE the frame at every angle — a clipped shape makes
// right angles with the canvas border and drowns the real signal.
const ANGLES = [['wingtop', 0.80], ['wing', 0.80], ['wingrear', 0.80], ['wingfront', 0.80], ['wingside', 0.80]];
let total = 0;
console.log(`\n═══ ${KEY} f${tier} — SILHOUETTE QUAD PROBE (wing alone, pure black) ═══`);
for (const [angle, fill] of ANGLES) {
  const r = await page.evaluate((o) => (o.debug ? window.wlSilhouetteDebug(o) : window.wlSilhouetteScan(o)),
    { key: KEY, tier, angle, fill, pose: 'glide', debug: DEBUG, eps: 1.0, minLen: 30 });
  if (DEBUG) { const { writeFileSync } = await import('fs');
    writeFileSync(new URL(`../refs/quadprobe-${KEY}-${angle}.png`, import.meta.url).pathname,
      await page.screenshot({ clip: { x: 0, y: 0, width: r.size || 480, height: r.size || 480 } })); }
  if (r.error) { console.log(`  ${angle.padEnd(10)} ${r.error}`); continue; }
  total += r.corners.length;
  const tag = r.corners.length ? '✗' : '✓';
  console.log(`  ${tag} ${angle.padEnd(10)} ink ${String(r.inkPx).padStart(6)}px · outline ${String(r.contourPx).padStart(5)}px → ${String(r.simplified).padStart(3)} segs · min run ${r.minLen}px · RIGHT-ANGLE CORNERS: ${r.corners.length}`);
  for (const c of r.corners) console.log(`      at (${c.x},${c.y})  turn ${c.turn}°  runs ${c.run1}px / ${c.run2}px`);
}
console.log(`\n${KEY}: ${total} right-angle corner(s) across ${ANGLES.length} angles — ${total === 0 ? 'PASS (no quadrilateral in the silhouette)' : 'FAIL'}\n`);
await browser.close(); srv.close?.();
process.exit(total === 0 ? 0 : 1);
