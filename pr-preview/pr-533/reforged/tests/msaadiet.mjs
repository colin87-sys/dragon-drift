// D1 (MOBILE-GRAPHICS-DIET) — deviceClass-scoped composer MSAA at boot + the mobile
// 2→0 dynRes A/B rung. The composer sample count is a BOOT choice (desktop 4 / mobile 2),
// set once and NEVER realloc'd on a tier 0↔1 flip (the 07-18 trap); the only live MSAA
// changes are the arena 0-drop (restores to the deviceClass base, not a hardcoded 4) and
// the ?msaadyn mobile dynRes rung. Headless chromium classifies DESKTOP, so the default
// boot is byte-identical (samples 4) — the mobile-2 path is exercised via ?device=mobile.
//   node tests/msaadiet.mjs
import { readFileSync } from 'fs';
import { boot, check } from './browser.mjs';

const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const dev = readFileSync(new URL('../js/deviceClass.js', import.meta.url), 'utf8');
const post = readFileSync(new URL('../js/postfx.js', import.meta.url), 'utf8');

// --- 1. source guards ---------------------------------------------------------
check('deviceClass.js exports deviceClass + isMobileClass + a ?device override',
  /export function deviceClass/.test(dev) && /export const isMobileClass/.test(dev) && /get\('device'\)/.test(dev));
check('BASE_MSAA is deviceClass-scoped (mobile 2 / desktop 4) with ?msaa0/2/4 overrides, computed BEFORE initPostFX',
  /isMobileClass\(\) \? 2 : 4/.test(main) &&
  main.indexOf('const BASE_MSAA') < main.indexOf('initPostFX(renderer, scene, camera, BASE_MSAA)'));
check('postfx remembers the boot base as postfx.baseMSAA', /postfx\.baseMSAA = /.test(post) && /baseMSAA: 4/.test(post));
check('the arena 0-drop RESTORES to the ladder target (base, or 0 if the ?msaadyn rung holds it)',
  /setPostMSAA\(active \? 0 : dynMSAATarget\(\)\)/.test(main));
// Gate-2 F1/F2: every path that RESETS the dynRes ladder must also restore MSAA, or a
// ?msaadyn-engaged 0 gets stranded — worst on dynRes-off, where the governor block that
// would otherwise restore it is then gated out entirely (a permanent stuck-0).
check('F1: dynRes-off restores MSAA to base (else it strands at 0 — the governor is now gated off)',
  /if \(!on\) \{ resGovReset\(resGov\); resScale = 1\.0; setPerfSaver\(false\); if \(MSAA_DYN\) setDynMSAA\(postfx\.baseMSAA\); \}/.test(main));
check('F1: a tier flip (applyQuality) restores MSAA to the reset ladder target',
  /resGovReset\(resGov\); resScale = 1\.0; setPerfSaver\(false\);[\s\S]{0,400}if \(MSAA_DYN\) setDynMSAA\(dynMSAATarget\(\)\)/.test(main));
check('the MSAA target is a single source of truth (dynMSAATarget: 0 at/past the rung, base below)',
  /function dynMSAATarget\(idx = resGov\.idx\)/.test(main) && /STAGES\.slice\(0, idx \+ 1\)\.some\(\(s\) => s\.msaa === 0\)/.test(main));
check('the MSAA dynRes rung is an A/B SEAM: ?msaadyn + mobile only (default off)',
  /const MSAA_DYN = urlParams\.has\('msaadyn'\) && isMobileClass\(\)/.test(main));
check('the MSAA rung sits BEFORE resolution trims (spliced at ladder index 2, full res)',
  /s\.splice\(2, 0, \{ saver: true, scale: RES_SCALES\[0\], msaa: 0 \}\)/.test(main));
check('setDynMSAA reallocs once + skipQualityFrames-guarded, and is the ONLY dynRes MSAA path',
  /function setDynMSAA/.test(main) && /function setDynMSAA[\s\S]{0,500}skipQualityFrames = 2/.test(main));
check('every tier/reset-path MSAA restore is gated behind MSAA_DYN (desktop tier flips never realloc samples)',
  // applyQuality DOES restore MSAA now (F1) — but only under MSAA_DYN, so the default/desktop
  // path never calls setDynMSAA on a tier flip (proven functionally below: samples stay 4).
  /if \(MSAA_DYN\) setDynMSAA\(dynMSAATarget\(\)\);   \/\/ F1/.test(main));

// --- 2. functional: default boot (headless = desktop-class) = byte-identical ---
{
  const { page, errors, done } = await boot();
  const g = await page.evaluate(() => ({ ...window.__dd.gfx, samples: window.__dd.gfx.composerSamples() }));
  check('default headless boot classifies DESKTOP', g.deviceClass === 'desktop');
  check('default boot: composer MSAA = 4 (byte-identical to shipped)', g.baseMSAA === 4 && g.samples === 4);
  check('default boot: no MSAA dynRes rung (msaaDyn off, no 0 in the ladder)',
    g.msaaDyn === false && !g.stageMSAA.includes(0));
  // A tier flip must NOT realloc MSAA (the 07-18 trap): setPostTier is the whole MSAA-relevant
  // half of applyQuality; samples stay put across it.
  await page.evaluate(() => window.__dd.postfx.setPostTier(1));
  const s1 = await page.evaluate(() => window.__dd.gfx.composerSamples());
  await page.evaluate(() => window.__dd.postfx.setPostTier(0));
  const s0 = await page.evaluate(() => window.__dd.gfx.composerSamples());
  check('tier 0↔1 flip does NOT realloc MSAA (samples stay 4)', s1 === 4 && s0 === 4);
  check('no console errors (default boot)', errors.length === 0);
  await done();
}

// --- 3. functional: ?device=mobile → the boot-2 path -------------------------
{
  const { page, errors, done } = await boot({ query: '?debug&device=mobile' });
  const g = await page.evaluate(() => ({ ...window.__dd.gfx, samples: window.__dd.gfx.composerSamples() }));
  check('?device=mobile classifies MOBILE + boots composer MSAA 2', g.deviceClass === 'mobile' && g.baseMSAA === 2 && g.samples === 2);
  check('mobile without ?msaadyn: still no 0-rung (the plan requires an on-device 2× A/B first)',
    g.msaaDyn === false && !g.stageMSAA.includes(0));
  // The arena base to restore to is 2 on mobile (setPostMSAA(active?0:baseMSAA) → 2), proven by the base.
  check('mobile arena would restore to 2 (baseMSAA), not 4', g.baseMSAA === 2);
  check('no console errors (mobile boot)', errors.length === 0);
  await done();
}

// --- 4. functional: ?msaadyn arms the mobile 2→0 rung; overrides force a value -
{
  const { page, errors, done } = await boot({ query: '?debug&device=mobile&msaadyn' });
  const g = await page.evaluate(() => window.__dd.gfx);
  check('?device=mobile&msaadyn arms the dynRes MSAA rung', g.msaaDyn === true && g.stageMSAA.includes(0));
  check('the 0-rung is BEFORE the resolution-trim rungs (index 2, ahead of any trimmed scale)',
    g.stageMSAA.indexOf(0) === 2);
  check('no console errors (msaadyn boot)', errors.length === 0);
  await done();
}
{
  const a = await boot({ query: '?debug&msaa2' });
  check('?msaa2 forces composer MSAA 2 regardless of class', (await a.page.evaluate(() => window.__dd.gfx.composerSamples())) === 2);
  await a.done();
  const b = await boot({ query: '?debug&device=mobile&msaa4' });
  check('?msaa4 forces composer MSAA 4 even on a mobile class', (await b.page.evaluate(() => window.__dd.gfx.composerSamples())) === 4);
  await b.done();
  const c = await boot({ query: '?debug&msaa0' });
  check('?msaa0 forces composer MSAA 0 (the shipped arena A/B seam, preserved)', (await c.page.evaluate(() => window.__dd.gfx.composerSamples())) === 0);
  await c.done();
}
