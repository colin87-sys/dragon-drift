// WING LAB — I4 COST driver for the fill-rate probe (see wingfill.html for the method).
//   cd reforged && node wing-lab/tools/wingfill.mjs [key ...] [--frames=120]
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

const args = process.argv.slice(2);
const frames = Number((args.find((a) => a.startsWith('--frames=')) || '--frames=120').split('=')[1]);
const KEYS = args.filter((a) => !a.startsWith('--'));
const LIST = KEYS.length ? KEYS : ['forgewing'];

const srv = await serve();
const browser = await pw.chromium.launch();
console.log(`WING LAB fill-rate probe — ${frames} frames per pass, 900×900, patched ↔ plain A/B/A/B (best of two per arm)\n`);
for (const key of LIST) {
  const page = await browser.newPage({ viewport: { width: 960, height: 960 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('PAGEERR', e.message));
  await page.goto(`${srv.url}/wing-lab/tools/wingfill.html?key=${key}`);
  await page.waitForFunction(() => window.__ready === true || window.__wlErrText, { timeout: 60000 });
  const err = await page.evaluate(() => window.__wlErrText || null);
  if (err) { console.error('STAGE ERROR:', err); await page.close(); continue; }
  const r = await page.evaluate((n) => window.__wlfill(n), frames);
  const cov = (100 * r.membranePx / r.viewportPx).toFixed(1);
  console.log(`  ${key}`);
  console.log(`    membrane fills ${r.membranePx} px of ${r.viewportPx} (${cov}% of the frame)`);
  console.log(`    §6 patched material  ${r.patchedMs.toFixed(3)} ms/frame   (runs ${r.runs.a1} / ${r.runs.a2})`);
  console.log(`    plain MeshStandard   ${r.plainMs.toFixed(3)} ms/frame   (runs ${r.runs.b1} / ${r.runs.b2})`);
  console.log(`    → the whole §6 shader chain costs ${r.deltaMs.toFixed(3)} ms/frame here = ${r.perMemMPx.toFixed(2)} ms per membrane MEGApixel`);
  const budget = 16.67;
  console.log(`    at a 1280×720 chase frame the wing pair covers ~6% of the screen ≈ 0.055 MPx →` +
    ` ≈ ${(r.perMemMPx * 0.055).toFixed(3)} ms, ${((100 * r.perMemMPx * 0.055) / budget).toFixed(2)}% of a 60 fps frame`);
  if (r.uncutMs != null) console.log(`    R3 cut order UNDONE  ${r.uncutMs.toFixed(3)} ms/frame  →  the exp2 + multiply-chain swaps save ${r.cutSavedMs.toFixed(3)} ms/frame (${(100 * r.cutSavedMs / r.uncutMs).toFixed(1)}% of the material)`);
  console.log(`    CONTROL  ${Math.abs(r.deltaMs) > 0.05 ? '✓ the A/B resolves the material swap' : '✗ VOID — patched and plain measure the same; this probe is not seeing the shader'}`);
  await page.close();
}
await browser.close();
srv.close?.();
console.log('');
