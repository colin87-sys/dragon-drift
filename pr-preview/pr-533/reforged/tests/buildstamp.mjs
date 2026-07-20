// The on-screen build stamp must be present and MATCH the service-worker version
// (both are produced by tools/stamp-sw.mjs). This is what lets a player confirm
// they're on the latest build and not a stale SW cache.
import { readFileSync } from 'fs';
import { boot, check } from './browser.mjs';

const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const swVersion = (sw.match(/const VERSION = '([^']+)'/) || [])[1];

const { page, errors, done } = await boot();
await page.waitForSelector('#build-stamp', { timeout: 8000 });
const stamp = (await page.textContent('#build-stamp')).trim();

// The stamp live-appends a perf readout ("· tier N · swell on/off") 1s after boot
// (the device-perf surface added with the tempest mobile work) — match the PREFIX,
// not the whole string, so the assert can't race the interval.
check('build stamp is shown on screen', /^build [0-9a-f]{6,}( · tier .*)?$/.test(stamp));
check('on-screen build id matches the service-worker version', stamp.startsWith('build ' + swVersion));
check('no console errors', errors.length === 0);

console.log(`  (stamp: "${stamp}", sw VERSION: ${swVersion})`);
await done();

// U1 (UI-PREMIUM-OVERHAUL): the stamp is dev chrome — it must NOT render for
// players (no ?debug). The console line still prints for support diagnostics.
const clean = await boot({ query: '', player: true });
await clean.page.waitForTimeout(500);
const stampless = await clean.page.$('#build-stamp');
check('build stamp is absent without ?debug', stampless === null);
check('no console errors (player boot)', clean.errors.length === 0);
await clean.done();
