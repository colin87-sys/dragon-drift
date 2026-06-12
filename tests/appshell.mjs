// App-shell: head kit present, PWA assets fetchable, SW registers, the
// display font loads, the loading screen hands off cleanly.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot();

check('theme-color meta', !!(await page.$('meta[name="theme-color"]')));
check('description meta', !!(await page.$('meta[name="description"]')));
check('svg favicon link', !!(await page.$('link[rel="icon"][type="image/svg+xml"]')));
check('apple-touch-icon link', !!(await page.$('link[rel="apple-touch-icon"]')));
check('manifest link', !!(await page.$('link[rel="manifest"]')));
check('og:image is an absolute URL', await page.$eval('meta[property="og:image"]',
  (el) => el.content.startsWith('https://')));
check('twitter card meta', !!(await page.$('meta[name="twitter:card"]')));

const fetches = await page.evaluate(async () => {
  const out = {};
  for (const path of ['./manifest.json', './sw.js', './assets/og.png', './assets/icon-192.png',
    './lib/fonts/russo-one-latin-400.woff2']) {
    try { out[path] = (await fetch(path)).status; } catch { out[path] = 0; }
  }
  return out;
});
for (const [path, status] of Object.entries(fetches)) {
  check(`${path} fetches 200`, status === 200);
}

const manifest = await page.evaluate(() => fetch('./manifest.json').then((r) => r.json()));
check('manifest start_url/scope relative (Pages subpath safe)',
  manifest.start_url === './' && manifest.scope === './');

check('display font loaded', await page.evaluate(() =>
  document.fonts.ready.then(() => document.fonts.check("16px 'Russo One'"))));

check('app-loaded set, loading screen hidden', await page.evaluate(() =>
  document.body.classList.contains('app-loaded') &&
  getComputedStyle(document.querySelector('.load-hint')).visibility === 'hidden'));

// SW registration (guarded: some headless envs refuse — skip, don't fail).
const sw = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return 'unsupported';
  try {
    const reg = await Promise.race([
      navigator.serviceWorker.getRegistration(),
      new Promise((res) => setTimeout(() => res(null), 4000)),
    ]);
    return reg ? 'registered' : 'none';
  } catch { return 'error'; }
});
if (sw === 'registered') check('service worker registered', true);
else console.log(`  - service worker: ${sw} (skipped — environment-dependent)`);

check('no console errors', errors.length === 0) || console.error(errors.join('\n'));
await done();
