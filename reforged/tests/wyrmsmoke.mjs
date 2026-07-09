// WYRM lance-profile smoke: boots the game with ?lancesfx=wyrm, unlocks audio,
// and drives a full lance volley (strikes + finale) THROUGH THE REAL EVENT BUS
// and audio graph — asserting the boss-body resonator engine builds, excites, and
// tears down with zero console errors / pageerrors. The default-profile paths are
// covered by lock.mjs/boss.mjs; this is the one path those don't exercise.
// Run: node tests/wyrmsmoke.mjs
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
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 900, height: 640 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(srv.url + '/?debug&lancesfx=wyrm');
await page.waitForFunction(() => !!window.__dd, { timeout: 15000 });
await page.evaluate(() => window.__dd.toHub && window.__dd.toHub());
await page.mouse.click(450, 320);   // gesture → audio unlock
await page.waitForFunction(() => window.__dd.audioHealth().ctxState === 'running', { timeout: 20000 }).catch(() => {});

const h = await page.evaluate(() => window.__dd.audioHealth());
check(`context running (${h.ctxState})`, h.ctxState === 'running');

// Seed a boss, then drive TWO full volleys (so the resonator is re-excited and
// the modes reset/dig/collapse across rolls), then end the fight (teardown).
await page.evaluate(async () => {
  const { emit } = window.__dd;
  emit('bossStart', { id: 'voidmaw' });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let volley = 0; volley < 2; volley++) {
    for (let k = 0; k < 5; k++) { emit('lockStrike', { k, n: 6, full: false }); await sleep(40); }
    emit('lockStrike', { finale: true, n: 6, full: true });   // the collapse
    await sleep(200);
  }
});
await page.waitForTimeout(600);
await page.evaluate(() => window.__dd.emit('bossEnd', { dist: 0 }));
await page.waitForTimeout(200);

const h2 = await page.evaluate(() => window.__dd.audioHealth());
check(`context still running after volleys (${h2.ctxState})`, h2.ctxState === 'running');
check(`zero console errors (${errors.length})`, errors.length === 0);
if (errors.length) console.error(errors.slice(0, 6));

await browser.close();
srv.close();
if (process.exitCode) process.exit(process.exitCode);
console.log('wyrmsmoke: all checks passed');
