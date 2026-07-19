// SUNBREAK I2 machine judge: the anatomical ignition cascade read on VALUE (greyscale),
// the COLORBLIND hard gate. Pins the cascade clock (__ddSurgeCascadePin) to each beat and
// measures the dragon crop's greyscale luminance climb + saves a montage for the critic.
//   node tools/surgecascade.mjs [key] [tier]
import { boot } from '../tests/browser.mjs';

const key = process.argv[2] || 'solar';
const tier = Number(process.argv[3] ?? 3);

const { page, errors, done } = await boot({
  query: '?debug', viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
    v: 2, embers: 999999, skins: { owned: ['${key}'], equipped: '${key}' },
    ascension: { tiers: [['${key}', ${tier}]], radiance: [] },
    cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
    flags: { seenFirstSurge: true, hintsSeen: 9, seenIntro: true }, stats: { runs: 5 },
    settings: { reticle: false, slowMo: true, qualityOverride: 0 },
  }))`,
});
await page.click('#btn-start').catch(() => {});
await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 60000 });
await page.evaluate(() => window.__dd.setQuality?.(0));
// Arm the cascade, then FREEZE the pose at a fixed distance (speed-regen overrides a one-shot
// speed=0, so we re-pin player.dist every beat) so all 5 beats are the SAME framing — comparable.
await page.evaluate(() => { window.__dd.player.speed = 0; window.__dd.clearRings(); window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 999; });
await page.waitForTimeout(300);
const D0 = await page.evaluate(() => window.__dd.player.dist);

// Greyscale luminance of the dragon crop (centre, where the hero flies).
async function dragonL() {
  const buf = await page.screenshot();
  const b64 = buf.toString('base64');
  return page.evaluate(async (b64) => {
    const img = new Image(); await new Promise((r) => { img.onload = r; img.src = 'data:image/png;base64,' + b64; });
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const x = Math.floor(0.42 * img.width), y = Math.floor(0.42 * img.height), w = Math.floor(0.16 * img.width), h = Math.floor(0.20 * img.height);
    const d = g.getImageData(x, y, w, h).data; let s = 0, mx = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { const L = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; s += L; if (L > mx) mx = L; n++; }
    return { mean: +(s / n).toFixed(1), max: +mx.toFixed(1) };
  }, b64);
}

// Rear-chase stations (Fable replan): crown corona → spine RUSH → wing SPREAD → tail CRACK → full.
const beats = [['pre', 0.0], ['crown', 0.06], ['spine', 0.22], ['wing', 0.40], ['tail', 0.55], ['full', 0.90]];
const out = {};
for (const [name, t] of beats) {
  // Re-assert fever + halt each beat so the world stays suppressed and nothing cancels it.
  await page.evaluate(({ t, D0 }) => { window.__dd.player.speed = 0; window.__dd.player.dist = D0; window.__dd.player.position.z = -D0; window.__dd.clearRings(); window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 999; window.__dd.surgeCascadePin(t); }, { t, D0 });
  await page.waitForTimeout(120);
  // Re-pin the frozen distance right before the shot (the update loop advances it between calls).
  await page.evaluate((D0) => { window.__dd.player.dist = D0; window.__dd.player.position.z = -D0; }, D0);
  await page.waitForTimeout(40);
  out[name] = await dragonL();
  await page.screenshot({ path: `/tmp/cascade-${key}-${name}.png` });
}
await page.evaluate(() => window.__dd.surgeCascadePin(null));

console.log(`\n== I2 ignition cascade — dragon greyscale luminance (key=${key}) ==`);
for (const [name] of beats) console.log(`  ${name.padEnd(6)} mean L=${out[name].mean}  max L=${out[name].max}`);
const climb = out.full.mean / Math.max(out.pre.mean, 1);
console.log(`\n  VALUE CLIMB full/pre = ${climb.toFixed(2)}×  (aim ≥2.0 — the colorblind greyscale read)`);
console.log(`  monotone eyes→full: ${out.pre.mean <= out.eyes.mean && out.eyes.mean <= out.spine.mean && out.spine.mean <= out.wings.mean && out.wings.mean <= out.full.mean}`);
console.log(`  errors: ${errors.length}`);
await done();
