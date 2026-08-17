// WING LAB capture driver — renders the shipped wings into reforged/wing-lab/refs/.
//
//   cd reforged && node wing-lab/tools/wingshot.mjs [key ...]
//
// Writes, per dragon key (apex form unless --tier=N):
//   refs/wing-<key>-poses.png     SPREAD (glide) · MID-FLAP (downstroke) · FOLDED (fold), one wing broadside
//   refs/wing-<key>-planform.png  wing PLANFORM · wing HEAD-ON · wing EDGE-ON  (shape / dihedral / thickness)
//   refs/wing-<key>-cycle.png     the 5-phase flap strip from the REAR CHASE cam (the money angle)
//   refs/wing-<key>-detail.png    2×/4× zooms on the wing, pale + dark backdrops (surface craft)
// and prints a world-space measurement table per pose (geometry ground truth beside the pixels).
//
// Unlike tools/dragonstudio.mjs this exposes ALL SEVEN wingDebug states — the shipped studio's
// STATE map only has glide/fold/bank and silently falls back to glide for the cycle states.
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { serve } from '../../tests/serve.mjs';

const require = createRequire(import.meta.url);
const pw = (() => {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
})();

const args = process.argv.slice(2);
const tierArg = args.find((a) => a.startsWith('--tier='));
const keys = args.filter((a) => !a.startsWith('--'));
const KEYS = keys.length ? keys : ['vesper', 'revenant', 'tempest'];
const OUT = new URL('../refs/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const CELL = 620;
const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 5 * CELL + 40, height: 3 * CELL + 60 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/wing-lab/tools/wingshot.html`);
await page.waitForFunction(() => window.__ready === true || window.__wlErrText, { timeout: 40000 });
const boot = await page.evaluate(() => window.__wlErrText || null);
if (boot) { console.error('STAGE ERROR:', boot); await browser.close(); srv.close?.(); process.exit(1); }

const clip = (cols, rows) => ({ x: 0, y: 0, width: cols * CELL, height: rows * CELL });
const written = [];
async function sheet(cols, rows, tiles, path) {
  await page.evaluate((c) => window.wlSheetInit(c[0], c[1], c[2]), [cols, rows, CELL]);
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    await page.evaluate((o) => window.wlRender(o), t.r);
    await page.evaluate((a) => window.wlTile(a[0], a[1]), [i, t.label]);
  }
  writeFileSync(path, await page.screenshot({ clip: clip(cols, rows) }));
  written.push(path); console.log('wrote', path);
}

// --compare: ONE sheet, every named key side by side at the same three reads. This is the
// image the director should open first — the roster's wings judged against each other.
if (args.includes('--compare')) {
  const tiles = [];
  for (const key of KEYS) {
    const mt = await page.evaluate((k) => window.wlMaxTier(k), key);
    tiles.push({ r: { key, tier: mt, bg: 'pale', pose: 'glide', angle: 'top', fill: 0.85 }, label: `${key} · PLANFORM` });
  }
  for (const key of KEYS) {
    const mt = await page.evaluate((k) => window.wlMaxTier(k), key);
    tiles.push({ r: { key, tier: mt, bg: 'pale', pose: 'glide', angle: 'rear', fill: 0.82 }, label: `${key} · REAR CHASE` });
  }
  for (const key of KEYS) {
    const mt = await page.evaluate((k) => window.wlMaxTier(k), key);
    tiles.push({ r: { key, tier: mt, bg: 'pale', pose: 'glide', angle: 'wing', fill: 0.62 }, label: `${key} · WING crop` });
  }
  await sheet(KEYS.length, 3, tiles, `${OUT}wing-COMPARE-${KEYS.join('-')}.png`);
  await browser.close(); srv.close?.();
  process.exit(0);
}

for (const key of KEYS) {
  const maxTier = await page.evaluate((k) => window.wlMaxTier(k), key);
  const tier = tierArg ? Number(tierArg.split('=')[1]) : maxTier;
  const tag = tier === maxTier ? 'apex' : `f${tier}`;
  const base = { key, tier, bg: 'pale' };

  await sheet(3, 1, [
    { r: { ...base, pose: 'glide',      angle: 'wing', framePose: 'glide', fill: 0.55 }, label: 'SPREAD (glide)' },
    { r: { ...base, pose: 'downstroke', angle: 'wing', framePose: 'glide', fill: 0.55 }, label: 'MID-FLAP (downstroke)' },
    { r: { ...base, pose: 'fold',       angle: 'wing', framePose: 'glide', fill: 0.55 }, label: 'FOLDED (fold)' },
  ], `${OUT}wing-${key}-${tag}-poses.png`);

  // + the two PURE-BLACK tiles: increment I1 is gated on SILHOUETTE in pure black, so the
  // sheet has to be able to show the shape with nothing else on it.
  await sheet(5, 1, [
    { r: { ...base, pose: 'glide', angle: 'wingtop', fill: 0.80 }, label: 'PLANFORM (top)' },
    { r: { ...base, pose: 'glide', angle: 'wingfront' }, label: 'HEAD-ON (dihedral/camber)' },
    { r: { ...base, pose: 'glide', angle: 'wingside'  }, label: 'EDGE-ON (thickness)' },
    { r: { ...base, pose: 'glide', angle: 'wingtop', fill: 0.80, silhouette: true }, label: 'SILHOUETTE planform (whole)' },
    { r: { ...base, pose: 'glide', angle: 'wing', fill: 0.80, silhouette: true, wingOnly: true }, label: 'SILHOUETTE wing ONLY' },
  ], `${OUT}wing-${key}-${tag}-planform.png`);

  await sheet(5, 1, [
    { r: { ...base, pose: 'glide',      angle: 'rear', framePose: 'settle', fill: 0.78 }, label: '1 glide' },
    { r: { ...base, pose: 'recovery',   angle: 'rear', framePose: 'settle', fill: 0.78 }, label: '2 recovery' },
    { r: { ...base, pose: 'apex',       angle: 'rear', framePose: 'settle', fill: 0.78 }, label: '3 apex' },
    { r: { ...base, pose: 'downstroke', angle: 'rear', framePose: 'settle', fill: 0.78 }, label: '4 downstroke' },
    { r: { ...base, pose: 'settle',     angle: 'rear', framePose: 'settle', fill: 0.78 }, label: '5 settle' },
  ], `${OUT}wing-${key}-${tag}-cycle.png`);

  // 3×2 — the last two tiles are THE BACKLIT PAIR the spec makes mandatory (§11): the sun
  // behind the wing. I2's membrane gate is un-judgeable without it, and even at I1 it is the
  // cleanest read of the planform's true outline and of any hole in the skin.
  await sheet(3, 2, [
    { r: { ...base, pose: 'glide', angle: 'wing', fill: 0.55, zoom: 2.2 }, label: 'wing 2.2× pale' },
    { r: { ...base, pose: 'glide', angle: 'wing', fill: 0.55, zoom: 4.0 }, label: 'wing 4× pale' },
    { r: { key, tier, bg: 'dark', pose: 'glide', angle: 'wing', fill: 0.55, zoom: 2.2 }, label: 'wing 2.2× dark' },
    { r: { key, tier, bg: 'sky',  pose: 'glide', angle: 'wingrear' },         label: 'chase read, sky' },
    { r: { key, tier, bg: 'dark', pose: 'glide', angle: 'wing', fill: 0.50, light: 'back' }, label: 'BACKLIT (sun behind)' },
    // R3(a): the backlit planform is re-shot ON THE MIRROR PLANE (camera exactly on the
    // sagittal plane, sun exactly anti-camera). Round 3 read one wing crimson and one
    // bright orange on the old `wingtop` capture, which frames on the RIGHT wing's box and
    // is therefore off-axis by half a span; the transmission term is view-dependent by
    // construction, so off the mirror plane the two wings MUST differ — that is the
    // authored anti-phase flare of a bank, not a bug. On the mirror plane they must match,
    // and `wingfire.mjs` asserts it at ≤10% with the off-axis shot as its own control.
    { r: { key, tier, bg: 'dark', pose: 'glide', angle: 'mirrortop', fill: 0.84, light: 'backmirror' }, label: 'BACKLIT planform · mirror plane (L/R Δ asserted ≤10%)' },
  ], `${OUT}wing-${key}-${tag}-detail.png`);

  // ── §7 THE FIRE STATE LADDER ────────────────────────────────────────────────
  // Row 1 is the CHASE read — the camera the player actually has — at cruise, power and
  // ignition. It is meant to look almost identical three times: the radiator is ventral,
  // so from behind and above the wing stays black and the state ladder is WITHHELD. The
  // fourth tile is the bank, where it stops being withheld.
  // Row 2 is the same ladder from the wing's own ventral normal, where the recruitment is
  // legible: cold shows the door seam only, cruise opens the window and the proximal
  // arteries, power adds the outboard vessels and the mid-panel windows, ignition adds the
  // outer recruit and the capillary flash. The clock is pinned to a different value in
  // every tile so the three rhythms are not all sampled at the same phase.
  await sheet(4, 2, [
    { r: { key, tier, bg: 'sky', pose: 'glide', angle: 'wingrear', fire: 'cruise', fireTime: 1.13 }, label: 'CHASE · cruise' },
    { r: { key, tier, bg: 'sky', pose: 'downstroke', angle: 'wingrear', fire: 'power', fireTime: 2.71 }, label: 'CHASE · power stroke' },
    { r: { key, tier, bg: 'sky', pose: 'apex', angle: 'wingrear', fire: 'ignition', fireTime: 4.29 }, label: 'CHASE · ignition' },
    { r: { key, tier, bg: 'dark', pose: 'bank', angle: 'wingbank', fill: 0.80, fire: 'cruise', fireTime: 3.41 }, label: 'BANK · the window rolls into view' },
    { r: { key, tier, bg: 'dark', pose: 'glide', angle: 'wingunder', fill: 0.80, fire: 'cold', fireTime: 0.37 }, label: 'VENTRAL · cold (rim only, ~1%)' },
    { r: { key, tier, bg: 'dark', pose: 'glide', angle: 'wingunder', fill: 0.80, fire: 'cruise', fireTime: 1.13 }, label: 'VENTRAL · cruise (3–6%)' },
    { r: { key, tier, bg: 'dark', pose: 'glide', angle: 'wingunder', fill: 0.80, fire: 'power', fireTime: 2.71 }, label: 'VENTRAL · power (≤12%)' },
    { r: { key, tier, bg: 'dark', pose: 'glide', angle: 'wingunder', fill: 0.80, fire: 'ignition', fireTime: 4.29 }, label: 'VENTRAL · ignition (≤15%, ≤0.8 s)' },
  ], `${OUT}wing-${key}-${tag}-fire.png`);

  const rows = [];
  for (const pose of ['glide', 'recovery', 'apex', 'downstroke', 'settle', 'fold']) {
    rows.push(await page.evaluate((o) => window.wlMeasure(o), { key, tier, pose }));
  }
  console.log(`\n=== ${key} f${tier} — world-space wing measurements ===`);
  console.log('pose        spanX   riseY  chordZ | bodyZ  wingTris/tris | tipR(x,y,z)');
  for (const r of rows) {
    console.log(`${r.pose.padEnd(11)} ${String(r.wingSpanX).padStart(6)} ${String(r.wingRiseY).padStart(6)} ${String(r.wingChordZ).padStart(6)} | ${String(r.bodyLenZ).padStart(5)}  ${String(r.wingTris).padStart(4)}/${String(r.tris).padStart(4)}     | ${r.tipR ? r.tipR.join(', ') : '—'}`);
  }
  const g = rows[0], f = rows[5];
  console.log(`fold ratio (fold.spanX / glide.spanX) = ${(f.wingSpanX / g.wingSpanX).toFixed(3)}\n`);
}
await browser.close(); srv.close?.();
console.log(`${written.length} sheets → ${OUT}`);
process.exit(0);
