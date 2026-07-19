// Graphics-effects settings (GRAPHICS-OVERHAUL.md): the Settings > Colour Grade /
// Smooth Gradients / Fast Particles controls must render, apply live, and persist.
// U5 (UI-PREMIUM-OVERHAUL Phase 2) redesigned on/off rows as single-accent
// SWITCHES (`.sw[data-gfx]`, .on = enabled, click toggles in place) — the seg
// rows remain only for multi-choice picks (grade / quality / detail / colorblind).
//   node tests/graphicssettings.mjs
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 2, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
});

await page.evaluate(() => window.__dd.ui.showScreen('settings'));
// Interval-polled wait + direct DOM clicks: playwright's rAF-based waits and
// actionability checks STARVE under swiftshader load (the known gotcha noted
// in tools/uishots.mjs) — this test checks wiring, not hit-testing.
await page.waitForFunction(() => !!document.querySelector('.seg-btn[data-tm]'), { timeout: 15000, polling: 120 });
const click = (sel) => page.$eval(sel, (el) => el.click());

// Controls present + default selection matches the shipped look.
check('COLOUR GRADE control renders', await page.$$eval('.seg-btn[data-tm]', (b) => b.length === 3));
check('SMOOTH GRADIENTS switch renders', !!(await page.$('.sw[data-gfx="dither"]')));
check('FAST PARTICLES switch renders', !!(await page.$('.sw[data-gfx="particleBatch"]')));
check('default grade = CLASSIC (aces) selected', await page.$eval('.seg-btn[data-tm="aces"]', (b) => b.classList.contains('sel')));
check('default dither switch ON', await page.$eval('.sw[data-gfx="dither"]', (b) => b.classList.contains('on') && b.getAttribute('aria-checked') === 'true'));
check('default fast-particles switch OFF', await page.$eval('.sw[data-gfx="particleBatch"]', (b) => !b.classList.contains('on') && b.getAttribute('aria-checked') === 'false'));

// U5 structure: sticky topbar exit + caps section labels + a fenced danger zone.
check('settings topbar with BACK renders', !!(await page.$('.screen-topbar #btn-back')));
// Each core section is present (a new 'HUD readouts' section now sits between
// Assists and Audio, so assert membership, not one contiguous ordered run).
check('section micro-labels render (Game/Graphics/Assists/Audio/Data)',
  await page.$$eval('.settings-section', (els) => {
    const labels = els.map((e) => e.textContent.trim().toUpperCase());
    return ['GAME', 'GRAPHICS', 'ASSISTS', 'AUDIO', 'DATA'].every((l) => labels.includes(l));
  }));
check('RESET lives in a danger zone', !!(await page.$('.danger-zone #btn-reset-save')));
check('DEV MODE row hidden without ?debug/?dev... or visible when the boot query carries ?debug',
  await page.evaluate(() => /[?&](debug|dev)\b/.test(location.search) === !!document.querySelector('.sw[data-dev]')));

// U14: HUD scale/opacity sliders drive :root vars + persist; colorblind row present.
check('HUD SCALE + HUD OPACITY sliders render', !!(await page.$('#set-hud-scale')) && !!(await page.$('#set-hud-alpha')));
await page.evaluate(() => {
  const el = document.querySelector('#set-hud-scale');
  el.value = 120;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
});
check('HUD SCALE slider sets --hud-scale on :root',
  await page.evaluate(() => document.documentElement.style.getPropertyValue('--hud-scale').trim()) === '1.2');
check('HUD SCALE persisted', Math.abs(await page.evaluate(() => window.__dd.save.settings.hudScale) - 1.2) < 1e-9);
check('COLORBLIND presets render (OFF/DEUTER/PROT/TRIT)', await page.$$eval('.seg-btn[data-cb]', (b) => b.length === 4));
await click('.seg-btn[data-cb="deuter"]');
await page.waitForTimeout(60);
check('colorblind preset applies root class + persists', await page.evaluate(() =>
  document.documentElement.classList.contains('cb-deuter') && window.__dd.save.settings.colorblind === 'deuter'));
await click('.seg-btn[data-cb="off"]');
await page.waitForTimeout(60);
check('colorblind OFF removes the class', await page.evaluate(() => !document.documentElement.classList.contains('cb-deuter')));

// Pick VIVID (neutral) → applies live + persists. Assert the tonemap MODE (Custom
// = Khronos Neutral), NOT the exact exposure: settings is a dim screen, so the menu
// mood-dim (main.js) multiplies renderer.toneMappingExposure below its 1.0 base every
// frame — the mode constant is the dim-invariant proof the grade applied live.
await click('.seg-btn[data-tm="neutral"]');
await page.waitForTimeout(120);
check('VIVID applied live (renderer tonemap = Neutral/Custom)', await page.evaluate(async () => {
  const THREE = await import('three');
  return window.__dd.renderer.toneMapping === THREE.CustomToneMapping;
}));
check('grade persisted (saveData.settings.toneMap = neutral)', await page.evaluate(() => window.__dd.save.settings.toneMap) === 'neutral');

// Turn dither OFF → applies live (grading uDither = 0) + persists.
await click('.sw[data-gfx="dither"]');
await page.waitForTimeout(120);
check('dither OFF applied live (uDither = 0)', await page.evaluate(() => window.__dd.postfx.handle.gradingPass.uniforms.uDither.value) === 0);
check('dither persisted (saveData.settings.dither = false)', await page.evaluate(() => window.__dd.save.settings.dither) === false);
check('dither switch flipped in place (no re-render, .on gone)',
  await page.$eval('.sw[data-gfx="dither"]', (b) => !b.classList.contains('on')));

// SKY LIGHTING (N5 sky-IBL): toggling ON adds the light probe + drops the hemi to fill.
check('SKY LIGHTING switch renders, default OFF', await page.$eval('.sw[data-gfx="skyIbl"]', (b) => !b.classList.contains('on')));
await click('.sw[data-gfx="skyIbl"]');
await page.waitForTimeout(120);
const ibl = await page.evaluate(() => {
  let probe = null, hemi = null;
  window.__dd.scene.traverse((o) => { if (o.isLightProbe) probe = o; if (o.isHemisphereLight) hemi = o; });
  return { probeI: probe && probe.intensity, hemiI: hemi && hemi.intensity, saved: window.__dd.save.settings.skyIbl };
});
check('SKY LIGHTING on: probe active + hemi dropped to fill', ibl.probeI > 0 && ibl.hemiI < 0.5);
check('SKY LIGHTING persisted', ibl.saved === true);
// Toggling back OFF must restore the shipped ambient EXACTLY (probe 0, hemi 0.8).
await click('.sw[data-gfx="skyIbl"]');
await page.waitForTimeout(120);
const iblOff = await page.evaluate(() => {
  let probe = null, hemi = null;
  window.__dd.scene.traverse((o) => { if (o.isLightProbe) probe = o; if (o.isHemisphereLight) hemi = o; });
  return { probeI: probe && probe.intensity, hemiI: hemi && hemi.intensity };
});
check('SKY LIGHTING off restores shipped ambient exactly (probe 0, hemi 0.8)', iblOff.probeI === 0 && Math.abs(iblOff.hemiI - 0.8) < 1e-6);

// Back to CLASSIC restores the ACES tonemap live (mode is dim-invariant; see above).
await click('.seg-btn[data-tm="aces"]');
await page.waitForTimeout(120);
check('back to CLASSIC restores ACES tonemap', await page.evaluate(async () => {
  const THREE = await import('three');
  return window.__dd.renderer.toneMapping === THREE.ACESFilmicToneMapping;
}));

// PERFORMANCE HUD: a pure overlay — toggling ON builds the readout div + flips
// renderer.info.autoReset off (to accumulate draw counts); OFF removes it + restores
// autoReset so no other reader is affected.
check('PERFORMANCE HUD switch renders, default OFF', await page.$eval('.sw[data-gfx="perfHud"]', (b) => !b.classList.contains('on')));
check('HUD off by default (no .perf-hud, autoReset default true)',
  await page.evaluate(() => !document.querySelector('.perf-hud') && window.__dd.renderer.info.autoReset === true));
await click('.sw[data-gfx="perfHud"]');
await page.waitForTimeout(120);
const hudOn = await page.evaluate(() => ({
  el: !!document.querySelector('.perf-hud'),
  autoReset: window.__dd.renderer.info.autoReset,
  saved: window.__dd.save.settings.perfHud,
}));
check('HUD on: overlay built + autoReset off + persisted', hudOn.el && hudOn.autoReset === false && hudOn.saved === true);
await click('.sw[data-gfx="perfHud"]');
await page.waitForTimeout(120);
const hudOff = await page.evaluate(() => ({ el: !!document.querySelector('.perf-hud'), autoReset: window.__dd.renderer.info.autoReset }));
check('HUD off: overlay removed + autoReset restored to true', !hudOff.el && hudOff.autoReset === true);

check('no console errors', errors.length === 0);
await done();
