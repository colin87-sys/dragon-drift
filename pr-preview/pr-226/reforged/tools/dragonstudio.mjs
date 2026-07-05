// tools/dragonstudio.mjs — the §6.5 STUDIO CONTACT-SHEET driver for the starter dragons.
//
//   node tools/dragonstudio.mjs <key> [round]      (default azure r1)
//     → reforged-captures/dragon-<key>-f<form>-<state>-<bg>-<round>.png   (2×2 angle sheets)
//     → reforged-captures/dragon-<key>-f<form>-crops-<round>.png          (fill-frame + 4× detail)
//     → reforged-captures/dragon-<key>-f<form>-sil-<view>-<round>.png     (black fills, headless)
//     → reforged-captures/dragon-<key>-ladder-<round>.png                 (fixed-distance size ramp)
//
// Drives tools/dragonstudio.html (the seeded, clock-FREE dragon stage with the game's ACES
// pipeline) through window.dsRender / dsAngle / dsCrop / dsLadderTile. Every frame is a pure
// function of (key, tier, state, angle, bg) — the wing pose comes from the SHARED setFlapDebugPose
// pin (no clock), so round K and round K+1 are pixel-comparable. Determinism is a deliverable (§9):
// non-deterministic capture is the MARROWCOIL churn failure and is treated as a test failure.
//
// CLAMPED to maxTierFor(key): only REACHABLE forms are rendered (a starter caps at form 2 — a
// fourth tile would be a PHANTOM FORM the gate must never judge, §8).
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
const pw = (() => {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
})();

const key = process.argv[2] || 'azure';
const round = process.argv[3] || 'r1';

// Angle order per grid: rear chase (TL), side profile (TR), rear-¾ bank (BL), top-down planform (BR).
const BODY_ANGLES = [['rear', 'rear chase'], ['side', 'side profile'], ['rear3q', 'rear-¾'], ['top', 'top planform']];
const FACE_ANGLES = [['front', 'face front'], ['front3q', 'face ¾'], ['profile', 'face profile'], ['nape', 'nape']];
// States × the backdrops each renders on. glide (the hero read) gets all three §8 backdrops
// (L140: gold/pearl accents must be judged on a warm sky too); the shape states use the PRIMARY
// pale frame. Pale is the primary silhouette backdrop throughout.
const STATES = [
  { name: 'glide', bgs: ['dark', 'pale', 'gold'], angles: BODY_ANGLES },
  { name: 'fold',  bgs: ['pale'],                 angles: BODY_ANGLES },
  { name: 'bank',  bgs: ['pale'],                 angles: BODY_ANGLES },
  { name: 'face',  bgs: ['pale'],                 angles: FACE_ANGLES },
];

mkdirSync('reforged-captures', { recursive: true });

const srv = await serve();
const browser = await pw.chromium.launch();
// Viewport must be WIDER than the widest sheet, or page.screenshot clamps the clip to the
// viewport and silently crops the right-hand tiles: the ladder is up to 4×480=1920 (premium),
// the crop sheet 3×460=1380. Height covers the 2×2 angle sheet (2×500=1000).
const page = await browser.newPage({ viewport: { width: 2000, height: 1080 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/dragonstudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const dsErr = await page.evaluate(() => document.getElementById('err').textContent);
if (dsErr) { console.error('STUDIO ERROR:', dsErr); await browser.close(); srv.close?.(); process.exit(1); }

const maxTier = await page.evaluate((k) => window.dsMaxTier(k), key);
const written = [];
const clipOf = (cols, rows, cell) => ({ x: 0, y: 0, width: cols * cell, height: rows * cell });

// ── per reachable form: state×backdrop angle sheets + a crop sheet ──────────
for (let form = 0; form <= maxTier; form++) {
  for (const st of STATES) {
    for (const bg of st.bgs) {
      await page.evaluate((c) => window.dsSheetInit(c[0], c[1], c[2]), [2, 2, 500]);
      for (let i = 0; i < st.angles.length; i++) {
        const [angle, label] = st.angles[i];
        if (i === 0) await page.evaluate((o) => window.dsRender(o), { key, tier: form, state: st.name, bg, angle });
        else await page.evaluate((o) => window.dsAngle(o), { state: st.name, angle });
        await page.evaluate((a) => window.dsTile(a[0], a[1]), [i, label]);
      }
      const path = `reforged-captures/dragon-${key}-f${form}-${st.name}-${bg}-${round}.png`;
      writeFileSync(path, await page.screenshot({ clip: clipOf(2, 2, 500) }));
      written.push(path); console.log('wrote', path);
    }
  }

  // Crop sheet (pale): whole-dragon fill · wing fill · head fill (subject ≥60%), then the 4×
  // detail crops (wing leading edge · head/eye) for emissive/edge judgment (the bossgate 4× law).
  const CROPS = [
    { part: 'whole', zoom: 1, label: 'whole' },
    { part: 'wing',  zoom: 1, label: 'wing' },
    { part: 'head',  zoom: 1, label: 'head' },
    { part: 'wing',  zoom: 4, label: 'wing 4×' },
    { part: 'head',  zoom: 4, label: 'head/eye 4×' },
    { part: 'whole', zoom: 1, label: 'whole (dark)', bg: 'dark' },
  ];
  await page.evaluate((c) => window.dsSheetInit(c[0], c[1], c[2]), [3, 2, 460]);
  for (let i = 0; i < CROPS.length; i++) {
    const cr = CROPS[i];
    await page.evaluate((o) => window.dsCrop(o), { key, tier: form, part: cr.part, zoom: cr.zoom, bg: cr.bg || 'pale' });
    await page.evaluate((a) => window.dsTile(a[0], a[1]), [i, cr.label]);
  }
  const cpath = `reforged-captures/dragon-${key}-f${form}-crops-${round}.png`;
  writeFileSync(cpath, await page.screenshot({ clip: clipOf(3, 2, 460) }));
  written.push(cpath); console.log('wrote', cpath);
}

// ── fixed-distance FORM LADDER (the size-ramp read — never reframe per form) ──
const radius = await page.evaluate((k) => window.dsApexRadius(k), key);
await page.evaluate((c) => window.dsSheetInit(c[0], c[1], c[2]), [maxTier + 1, 1, 480]);
const FORM_NAMES = ['Hatchling', 'Kindled', 'Radiant', 'Eternal'];
for (let form = 0; form <= maxTier; form++) {
  await page.evaluate((o) => window.dsLadderTile(o), { key, tier: form, bg: 'pale', radius });
  await page.evaluate((a) => window.dsTile(a[0], a[1]), [form, `f${form} · ${FORM_NAMES[form]}`]);
}
const lpath = `reforged-captures/dragon-${key}-ladder-${round}.png`;
writeFileSync(lpath, await page.screenshot({ clip: clipOf(maxTier + 1, 1, 480) }));
written.push(lpath); console.log('wrote', lpath);

await browser.close();
srv.close?.();

// ── headless black-fill silhouettes (reuse tools/silhouette.mjs — assembly, not invention) ──
// The pale sheet is the primary silhouette frame; these are the pure black fills the gate reads for
// the one-connected-component / gap / mass-hierarchy laws, at a resolution that resolves the gaps.
for (let form = 0; form <= maxTier; form++) {
  for (const view of ['rear', 'side', 'top']) {
    try {
      execFileSync('node', ['tools/silhouette.mjs', key, view, String(form), '--scale=2', '--crop'], { stdio: 'ignore' });
      const src = `/tmp/sil-${key}-${view}.png`;
      const dst = `reforged-captures/dragon-${key}-f${form}-sil-${view}-${round}.png`;
      execFileSync('cp', [src, dst]);
      written.push(dst); console.log('wrote', dst);
    } catch (e) { console.error(`silhouette ${key} ${view} f${form} failed:`, e.message); }
  }
}

console.log(`\n${written.length} captures written to reforged-captures/ (round ${round}).`);
process.exit(0);
