// Shared playwright bootstrap: resolves the globally-installed playwright
// package (ESM imports ignore NODE_PATH, so resolve it explicitly).
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { serve } from './serve.mjs';

const require = createRequire(import.meta.url);

function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_PATH];
  try {
    candidates.push(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright');
  } catch { /* no npm */ }
  candidates.push('playwright');
  for (const c of candidates) {
    if (!c) continue;
    try { return require(c); } catch { /* next */ }
  }
  throw new Error('playwright not found — set PLAYWRIGHT_PATH');
}

// Boots the game in headless chromium. Returns { page, errors, url, done() }.
// `errors` collects console errors + pageerrors for the caller to assert on.
// A brand-new pilot boots onto the cinematic attract splash; everything else is
// reached via the dashboard hub. By default boot() skips the splash (calls the
// __dd.toHub seam) so existing tests see the dashboard exactly as before. Pass
// `splash: true` to leave the splash up and test it directly.
export async function boot({ query = '?debug', initScript = null, splash = false,
  viewport = { width: 900, height: 640 }, deviceScaleFactor = 1 } = {}) {
  const { chromium } = loadPlaywright();
  const srv = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport, deviceScaleFactor });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  if (initScript) await page.addInitScript(initScript);
  await page.goto(srv.url + '/' + query);
  await page.waitForFunction(() => !!window.__dd, { timeout: 15000 });
  if (!splash) await page.evaluate(() => window.__dd.toHub && window.__dd.toHub());
  return {
    page, errors, url: srv.url,
    done: async () => { await browser.close(); srv.close(); },
  };
}

export function check(name, cond) {
  if (cond) { console.log(`  ✓ ${name}`); return true; }
  console.error(`  ✗ ${name}`);
  process.exitCode = 1;
  return false;
}
