// Minimal clean-background recovery shot on the neutral studio stage (both wings measurable,
// zero scene-background noise). Renders tempest apex at state 'recovery' from rear + rear-¾ on pale.
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';
import { serve } from '../tests/serve.mjs';
const require = createRequire(import.meta.url);
const pw = (() => {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
})();
const key = process.argv[2] || 'tempest';
const state = process.argv[3] || 'recovery';
const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/dragonstudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const maxTier = await page.evaluate((k) => window.dsMaxTier(k), key);
function clipOf(cols, rows, cell) { return { x: 0, y: 0, width: cols * cell, height: rows * cell }; }
for (const [angle, tag] of [['rear', 'rear'], ['rear3q', 'rear3q'], ['top', 'top']]) {
  await page.evaluate((c) => window.dsSheetInit(c[0], c[1], c[2]), [1, 1, 700]);
  await page.evaluate((o) => window.dsRender(o), { key, tier: maxTier, state, bg: 'pale', angle });
  await page.evaluate((a) => window.dsTile(a[0], a[1]), [0, `${state} · ${tag}`]);
  const path = `/tmp/studio-${key}-${state}-${tag}.png`;
  writeFileSync(path, await page.screenshot({ clip: clipOf(1, 1, 700) }));
  console.log('wrote', path);
}
await browser.close(); srv.close?.();
