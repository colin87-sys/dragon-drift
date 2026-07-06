// Runtime audio-overhaul integration check: boots the game in headless
// chromium (autoplay unlocked), starts music, and asserts the v2 master chain
// actually engaged — worklet limiter live, drum kit baked, beat clock +
// harmony oracle answering, zero console errors. Run: node tests/audioboot.mjs
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { serve } from './serve.mjs';
import { check } from './browser.mjs';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
}

const { chromium } = loadPlaywright();
const srv = await serve();
// Headless chromium blocks AudioContext until a gesture; this flag stands in
// for the tap the real game requires (the unlock path itself is L63/L87
// territory that only on-device QA can truly exercise).
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 900, height: 640 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(srv.url + '/?debug');
await page.waitForFunction(() => !!window.__dd, { timeout: 15000 });
await page.evaluate(() => window.__dd.toHub && window.__dd.toHub());
// A real click still fires the unlock handlers (gesture → resume → music).
await page.mouse.click(450, 320);
// Poll until the async pieces land (worklet module load + kit bake) — fixed
// sleeps are flaky in headless.
await page.waitForFunction(() => {
  const h = window.__dd.audioHealth();
  return h.musicActive && h.limiterActive && h.kitBaked && h.beatClock;
}, { timeout: 20000 }).catch(() => {});

const h = await page.evaluate(() => window.__dd.audioHealth());
check('audio v2 flag on by default', h.v2 === true);
check(`context running (${h.ctxState})`, h.ctxState === 'running');
check('music active', h.musicActive === true);
check('worklet limiter engaged', h.limiterActive === true);
check('drum kit baked for active station', h.kitBaked === true);
check('beat clock answering', h.beatClock === true);
check('harmony oracle answering', h.harmony === true);
// Underruns are informational only here: headless chromium renders audio to a
// null sink on a throttled fake clock, so stalls are environmental — the
// beacon is for the on-device debug HUD, not CI.
if (h.underruns > 0) console.log(`  (info) ${h.underruns} underrun beacon(s) — expected noise in headless`);
check(`zero console errors (${errors.length})`, errors.length === 0);
if (errors.length) console.error(errors.slice(0, 5));

// The v1 escape hatch: same boot with ?audio=v1 keeps the shipped chain.
await page.goto(srv.url + '/?debug&audio=v1');
await page.waitForFunction(() => !!window.__dd, { timeout: 15000 });
await page.evaluate(() => window.__dd.toHub && window.__dd.toHub());
await page.mouse.click(450, 320);
await page.waitForTimeout(1500);
const h1 = await page.evaluate(() => window.__dd.audioHealth());
check('?audio=v1 disables v2', h1.v2 === false);
check('v1 keeps shipped chain (no worklet limiter)', h1.limiterActive === false);
check('v1 never bakes kits', h1.kitBaked === false);
check('v1 music still plays', h1.musicActive === true);

await browser.close();
srv.close();
if (process.exitCode) process.exit(process.exitCode);
console.log('audioboot: all checks passed');
