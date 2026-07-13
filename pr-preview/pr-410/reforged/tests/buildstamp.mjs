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

check('build stamp is shown on screen', /^build [0-9a-f]{6,}$/.test(stamp));
check('on-screen build id matches the service-worker version', stamp === 'build ' + swVersion);
check('no console errors', errors.length === 0);

console.log(`  (stamp: "${stamp}", sw VERSION: ${swVersion})`);
await done();
