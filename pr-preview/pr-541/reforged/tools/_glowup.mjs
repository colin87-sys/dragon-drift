// Full-dragon reference sheet for the glow-up art-director assessment: the Tempest apex on a clean
// studio stage, several states × angles so the director can judge form/silhouette/materials/glow
// (especially the "flat regular strip" wing bones in cruise/hum). node tools/_glowup.mjs [key]
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';
import { serve } from '../tests/serve.mjs';
const require = createRequire(import.meta.url);
const pw = (() => { const c = [process.env.PLAYWRIGHT_PATH]; try { c.push(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim() + '/playwright'); } catch {} c.push('playwright'); for (const x of c) { if (!x) continue; try { return require(x); } catch {} } throw new Error('playwright not found'); })();
const key = process.argv[2] || 'tempest';
const CELL = 760;
const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: CELL, height: CELL }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/dragonstudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const maxTier = await page.evaluate((k) => window.dsMaxTier(k), key);
const clip = { x: 0, y: 0, width: CELL, height: CELL };
// (state, angle, bg, tag) — cruise reads on pale to show the wing-bone strips, plus a face + surge read.
const shots = [
  ['hum', 'rear', 'pale', 'cruise-rear'],       // primary chase view, storm OFF (the "flat strip" complaint)
  ['hum', 'side', 'pale', 'cruise-side'],        // full silhouette: body/wing/head/tail proportions
  ['hum', 'rear3q', 'pale', 'cruise-rear3q'],    // the hero ¾
  ['glide', 'side', 'dusk', 'glide-side-dusk'],  // in-context lighting
  ['face', 'front', 'pale', 'face-front'],       // head read
  ['face', 'side', 'pale', 'face-profile'],      // head profile
  ['surge', 'rear3q', 'dusk', 'surge-rear3q'],   // the premium bar to match (storm lit)
];
for (const [state, angle, bg, tag] of shots) {
  await page.evaluate((c) => window.dsSheetInit(c[0], c[1], c[2]), [1, 1, CELL]);
  await page.evaluate((o) => window.dsRender(o), { key, tier: maxTier, state, bg, angle });
  await page.evaluate((a) => window.dsTile(a[0], a[1]), [0, tag]).catch(() => {});
  const path = `/tmp/glowup-${tag}.png`;
  writeFileSync(path, await page.screenshot({ clip }));
  console.log('wrote', path);
}
await browser.close(); srv.close?.();
