// Drives clayshot.html headlessly: flat-lit clay top / side / three-quarter renders
// of a PROCEDURAL dragon so geometry (wing-strut camber, head shape, tail) is
// judgeable without game-scene lighting/finish. node tools/clayshot.mjs <key> [form]
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
let pw;
for (const c of [execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright', 'playwright']) {
  try { pw = require(c); break; } catch { /* next */ }
}
const key = process.argv[2] || 'nimbus';
const form = process.argv[3];
const srv = await serve();
const browser = await pw.chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 920, height: 2760 } });
page.on('pageerror', (e) => console.error('PAGEERROR', String(e)));
const q = `?key=${encodeURIComponent(key)}${form != null ? `&form=${form}` : ''}`;
await page.goto(`${srv.url}/tools/clayshot.html${q}`);
await page.waitForFunction(() => window.__ready, { timeout: 30000 });
for (const v of ['top', 'side', 'threeq']) {
  await (await page.$('#' + v)).screenshot({ path: `/tmp/clay-${key}-${v}.png` });
  console.log(`wrote /tmp/clay-${key}-${v}.png`);
}
await browser.close();
srv.close();
process.exit(0);
