// Dragon Surge capture tool (SUNBREAK). Two modes:
//
//   node tools/surgeshot.mjs [key] [tier]            → ambient Surge still (?debug=fever)
//       the world-suppression grade + ignition cascade, judged from the rear-chase.
//       → /tmp/surge-<key>-t<tier>.png
//
//   node tools/surgeshot.mjs [key] [tier] seams      → the unleash cinematic montage
//       forces a boss fight, then pins the cinematic to each beat via the __ddSurgeForce
//       capture seam (undefined in play → byte-identical) and stills each:
//       APEX (signature frame) · mid-BEAM · IMPACT.
//       → /tmp/surge-<key>-{apex,beam,impact}.png
//
// The seams pin a ONE-SHOT cinematic that a screenshot would otherwise miss; the beam
// content is the pre-I3 placeholder until the ribbon anatomy lands — the montage HARNESS
// is what I0 delivers, so I1–I4 can judge the real captures against worst-case backgrounds.
import { boot } from '../tests/browser.mjs';

const key = process.argv[2] || 'solar';
const tier = Number(process.argv[3] ?? 3);
const mode = (process.argv[4] || 'ambient').toLowerCase();

function save(query) {
  return `localStorage.setItem('dragonDriftSave', JSON.stringify({
    v: 2, embers: 999999,
    skins: { owned: ['${key}'], equipped: '${key}' },
    ascension: { tiers: [['${key}', ${tier}]], radiance: [] },
    cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
    flags: { seenFirstSurge: true, hintsSeen: 9, seenIntro: true },
    stats: { runs: 5 },
    settings: { reticle: false, slowMo: true, qualityOverride: null },
  }))`;
}

async function ambient() {
  const { page, done } = await boot({
    query: '?debug=fever', viewport: { width: 1100, height: 720 },
    deviceScaleFactor: 2, initScript: save(),
  });
  await page.click('#btn-start').catch(() => {});
  await page.waitForTimeout(2400);
  const out = `/tmp/surge-${key}-t${tier}.png`;
  await page.screenshot({ path: out, clip: { x: 300, y: 250, width: 500, height: 360 } });
  console.log(`wrote ${out}`);
  await done();
}

async function seams() {
  const { page, errors, done } = await boot({
    query: '?debug', viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1, initScript: save(),   // full-frame montage: dsf 1 keeps the software-GL backbuffer fast enough
  });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 60000 });
  await page.evaluate(() => window.__dd.setQuality?.(0));   // hold every effect on under software-GL
  await page.evaluate(() => { window.__dd.spawnBoss(); window.__dd.bossForceFight(); });
  // Wait for the fight to settle so the beam has a boss to lance.
  let ok = false;
  for (let i = 0; i < 48 && !ok; i++) {
    ok = await page.evaluate(() => window.__dd.bossState?.()?.phase === 'fight');
    if (!ok) await page.waitForTimeout(250);
  }
  if (!ok) console.log('WARN: fight not reached — montage may be empty');
  for (const beat of ['apex', 'beam', 'impact']) {
    // Real ultimates always run WITH fever (activateSurge sets it first) → the world-suppression
    // grade is live and the additive beam ensemble reads against a DARK world. Boss bullets can
    // hit-CANCEL fever mid-capture (ultimate i-frames land in I4), so re-assert it while polling
    // the grade to full — the capture must match the played frame, not a half-ramped one.
    await page.evaluate((b) => { window.__dd.player.speed = 0; window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 999; window.__dd.surgeSeam(b); }, beat);
    for (let i = 0; i < 30; i++) {
      const g = await page.evaluate(() => { window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 999; return window.__dd.surgeState().gradeMix; });
      if (g >= 0.9) break;
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(200);   // let the pinned beat render at full grade
    const st = await page.evaluate(() => window.__dd.surgeState());
    const out = `/tmp/surge-${key}-${beat}.png`;
    await page.screenshot({ path: out });
    console.log(`wrote ${out}  (phase=${st.phase} t=${st.t.toFixed(3)} beam=${st.beamVisible} dc=${st.drawCalls})`);
  }
  await page.evaluate(() => window.__dd.surgeSeam(null));
  if (errors.length) console.log(`errors: ${errors.slice(0, 4).join('\n')}`);
  await done();
}

await (mode === 'seams' || mode === 'montage' ? seams() : ambient());
