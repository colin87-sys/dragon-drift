// 4-form CHARGING-ladder capture (glide, pale, rear) — one browser session, all forms.
// node tools/_ladder.mjs <key> [state]
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';
import { serve } from '../tests/serve.mjs';
const require = createRequire(import.meta.url);
const pw = (() => { const c = [process.env.PLAYWRIGHT_PATH]; try { c.push(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim() + '/playwright'); } catch {} c.push('playwright'); for (const x of c) { if (!x) continue; try { return require(x); } catch {} } throw new Error('playwright not found'); })();
const key = process.argv[2] || 'tempest';
const state = process.argv[3] || 'glide';
const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 760 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/dragonstudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const maxT = await page.evaluate((k) => window.dsMaxTier(k), key);
for (let t = 0; t <= maxT; t++) {
  await page.evaluate((c) => window.dsSheetInit(c[0], c[1], c[2]), [1, 1, 700]);
  await page.evaluate((o) => window.dsRender(o), { key, tier: t, state, bg: 'pale', angle: 'rear' });
  await page.evaluate((a) => window.dsTile(a[0], a[1]), [0, `f${t}`]);
  const path = `/tmp/ladder-${key}-${state}-f${t}.png`;
  writeFileSync(path, await page.screenshot({ clip: { x: 0, y: 0, width: 700, height: 700 } }));
  console.log('wrote', path);
}
await browser.close(); srv.close?.();
