// Graphics-effects settings (GRAPHICS-OVERHAUL.md): the Settings > Colour Grade /
// Smooth Gradients / Fast Particles controls must render, apply live, and persist.
//   node tests/graphicssettings.mjs
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 2, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
});

await page.evaluate(() => window.__dd.ui.showScreen('settings'));
await page.waitForSelector('.seg-btn[data-tm]', { timeout: 5000 });

// Controls present + default selection matches the shipped look.
check('COLOUR GRADE control renders', await page.$$eval('.seg-btn[data-tm]', (b) => b.length === 3));
check('SMOOTH GRADIENTS toggle renders', !!(await page.$('.seg-btn[data-gfx="dither"]')));
check('FAST PARTICLES toggle renders', !!(await page.$('.seg-btn[data-gfx="particleBatch"]')));
check('default grade = CLASSIC (aces) selected', await page.$eval('.seg-btn[data-tm="aces"]', (b) => b.classList.contains('sel')));
check('default dither ON selected', await page.$eval('.seg-btn[data-gfx="dither"][data-val="1"]', (b) => b.classList.contains('sel')));
check('default fast-particles OFF selected', await page.$eval('.seg-btn[data-gfx="particleBatch"][data-val="0"]', (b) => b.classList.contains('sel')));

// Pick VIVID (neutral) → applies live (exposure 1.0 vs ACES 0.92) + persists.
await page.click('.seg-btn[data-tm="neutral"]');
await page.waitForTimeout(120);
check('VIVID applied live (renderer exposure = 1.0)', Math.abs(await page.evaluate(() => window.__dd.renderer.toneMappingExposure) - 1.0) < 1e-6);
check('grade persisted (saveData.settings.toneMap = neutral)', await page.evaluate(() => window.__dd.save.settings.toneMap) === 'neutral');

// Turn dither OFF → applies live (grading uDither = 0) + persists.
await page.click('.seg-btn[data-gfx="dither"][data-val="0"]');
await page.waitForTimeout(120);
check('dither OFF applied live (uDither = 0)', await page.evaluate(() => window.__dd.postfx.handle.gradingPass.uniforms.uDither.value) === 0);
check('dither persisted (saveData.settings.dither = false)', await page.evaluate(() => window.__dd.save.settings.dither) === false);

// SKY LIGHTING (N5 sky-IBL): toggling ON adds the light probe + drops the hemi to fill.
check('SKY LIGHTING toggle renders, default OFF', await page.$eval('.seg-btn[data-gfx="skyIbl"][data-val="0"]', (b) => b.classList.contains('sel')));
await page.click('.seg-btn[data-gfx="skyIbl"][data-val="1"]');
await page.waitForTimeout(120);
const ibl = await page.evaluate(() => {
  let probe = null, hemi = null;
  window.__dd.scene.traverse((o) => { if (o.isLightProbe) probe = o; if (o.isHemisphereLight) hemi = o; });
  return { probeI: probe && probe.intensity, hemiI: hemi && hemi.intensity, saved: window.__dd.save.settings.skyIbl };
});
check('SKY LIGHTING on: probe active + hemi dropped to fill', ibl.probeI > 0 && ibl.hemiI < 0.5);
check('SKY LIGHTING persisted', ibl.saved === true);
// Toggling back OFF must restore the shipped ambient EXACTLY (probe 0, hemi 0.8).
await page.click('.seg-btn[data-gfx="skyIbl"][data-val="0"]');
await page.waitForTimeout(120);
const iblOff = await page.evaluate(() => {
  let probe = null, hemi = null;
  window.__dd.scene.traverse((o) => { if (o.isLightProbe) probe = o; if (o.isHemisphereLight) hemi = o; });
  return { probeI: probe && probe.intensity, hemiI: hemi && hemi.intensity };
});
check('SKY LIGHTING off restores shipped ambient exactly (probe 0, hemi 0.8)', iblOff.probeI === 0 && Math.abs(iblOff.hemiI - 0.8) < 1e-6);

// Back to CLASSIC restores ACES exposure live.
await page.click('.seg-btn[data-tm="aces"]');
await page.waitForTimeout(120);
check('back to CLASSIC restores ACES exposure 0.92', Math.abs(await page.evaluate(() => window.__dd.renderer.toneMappingExposure) - 0.92) < 1e-6);

// PERFORMANCE HUD: a pure overlay — toggling ON builds the readout div + flips
// renderer.info.autoReset off (to accumulate draw counts); OFF removes it + restores
// autoReset so no other reader is affected.
check('PERFORMANCE HUD toggle renders, default OFF', await page.$eval('.seg-btn[data-gfx="perfHud"][data-val="0"]', (b) => b.classList.contains('sel')));
check('HUD off by default (no .perf-hud, autoReset default true)',
  await page.evaluate(() => !document.querySelector('.perf-hud') && window.__dd.renderer.info.autoReset === true));
await page.click('.seg-btn[data-gfx="perfHud"][data-val="1"]');
await page.waitForTimeout(120);
const hudOn = await page.evaluate(() => ({
  el: !!document.querySelector('.perf-hud'),
  autoReset: window.__dd.renderer.info.autoReset,
  saved: window.__dd.save.settings.perfHud,
}));
check('HUD on: overlay built + autoReset off + persisted', hudOn.el && hudOn.autoReset === false && hudOn.saved === true);
await page.click('.seg-btn[data-gfx="perfHud"][data-val="0"]');
await page.waitForTimeout(120);
const hudOff = await page.evaluate(() => ({ el: !!document.querySelector('.perf-hud'), autoReset: window.__dd.renderer.info.autoReset }));
check('HUD off: overlay removed + autoReset restored to true', !hudOff.el && hudOff.autoReset === true);

check('no console errors', errors.length === 0);
await done();
