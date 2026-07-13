// Capture EMBERTIDE in-game to verify the sky-replacement fills the frame with no
// edges + one sky (owner's ask). TWO checks:
//   1) settled (stationary) portrait + landscape — the original one-sky proof.
//   2) FORWARD-FLIGHT (the owner's phone repro): fly the player far down-lane while
//      the boss owns the sky, then confirm the dome stays camera-locked (no diagonal
//      seam, no real-sky bleed at the top). Probes rig↔camera offset + crossfade state.
import { boot } from '../tests/browser.mjs';

const SAVE = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`;
const EMBERTIDE_IDX = 12;   // BOSS_ORDER: ...weftwitch(10), onewing(11), embertide(12)
const DIST = 100;

const ASPECTS = [
  { name: 'portrait', w: 1080, h: 1920 },
  { name: 'landscape', w: 1920, h: 1080 },
];

// Probe the live sky state at the captured instant: is the EMBERTIDE dome centred
// on the camera (offset≈0 → fills the frame, no seam) and is the real dome hidden?
function probeSky() {
  const dd = window.__dd;
  const cam = dd.camera;
  cam.updateMatrixWorld(true);
  const wp = (o) => { o.updateWorldMatrix(true, false); const e = o.matrixWorld.elements; return [e[12], e[13], e[14]]; };
  // the reparented visual root is the rig (parent of the dome mesh 'lightField').
  let domeRoot = null, realSky = null;
  dd.scene.traverse((o) => { if (o.name === 'lightField' && !domeRoot) domeRoot = o.parent; });
  // the real sky dome = the Mesh whose ShaderMaterial carries the dimMix crossfade uniform.
  dd.scene.traverse((o) => { if (!realSky && o.isMesh && o.material && o.material.uniforms && o.material.uniforms.dimMix) realSky = o; });
  const c = wp(cam);
  const r = domeRoot ? wp(domeRoot) : null;
  const offset = r ? Math.hypot(c[0] - r[0], c[1] - r[1], c[2] - r[2]) : -1;
  return {
    dist: Math.round(dd.player.dist),
    phase: dd.bossState().phase,
    embertideSky: dd.game.embertideSky,
    camPos: c.map((n) => Math.round(n)),
    rigPos: r ? r.map((n) => Math.round(n)) : null,
    rigCamOffset: Math.round(offset * 100) / 100,   // ≈0 = dome centred on camera (no seam)
    realSkyVisible: realSky ? realSky.visible : null,
    dimMix: realSky ? Math.round(realSky.material.uniforms.dimMix.value * 1000) / 1000 : null,
  };
}

async function reachBoss(page) {
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => window.__dd.spawnBoss());
  await page.waitForFunction(() => window.__dd.game.inBoss === true, { timeout: 15000 }).catch(() => {});
  // Force the FIGHT phase (approachFrom:'horizon' is a CP2 item, so the natural path
  // can hold in 'warn' headless; this is a rendering test of the dome-follow).
  await page.evaluate(() => window.__dd.bossForceFight());
  await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 30000 })
    .catch(() => console.warn('  ! fight phase not confirmed — continuing anyway'));
  // Wait for the crossfade to SATURATE (dimMix→1, the real dome hidden). The ramp is
  // ~1.3s at 60fps but headless rAF is throttled ~15× (L105), so poll rather than sleep.
  await page.waitForFunction(() => {
    let sky = null; window.__dd.scene.traverse((o) => { if (!sky && o.isMesh && o.material && o.material.uniforms && o.material.uniforms.dimMix) sky = o; });
    return sky && sky.material.uniforms.dimMix.value >= 0.95;
  }, { timeout: 60000 }).catch(() => console.warn('  ! crossfade did not saturate (headless throttle) — capturing anyway'));
}

// ---- 1) SETTLED one-sky proof (both aspects) ----
for (const a of ASPECTS) {
  console.log(`\n=== embertide SETTLED ${a.name} ${a.w}x${a.h} ===`);
  const { page, done } = await boot({
    query: `?debug&bossIdx=${EMBERTIDE_IDX}&boss=${DIST}`,
    viewport: { width: a.w, height: a.h }, deviceScaleFactor: 1, initScript: SAVE,
  });
  await reachBoss(page);
  console.log('  probe:', JSON.stringify(await page.evaluate(probeSky)));
  const out = `/tmp/embertide-${a.name}.png`;
  await page.screenshot({ path: out });
  console.log(`  wrote ${out}`);
  await done();
}

// ---- 2) FORWARD-FLIGHT repro (the owner's phone condition) ----
for (const a of ASPECTS) {
  console.log(`\n=== embertide FLIGHT ${a.name} ${a.w}x${a.h} ===`);
  const { page, done } = await boot({
    query: `?debug&bossIdx=${EMBERTIDE_IDX}&boss=${DIST}`,
    viewport: { width: a.w, height: a.h }, deviceScaleFactor: 1, initScript: SAVE,
  });
  await reachBoss(page);
  // Fly ~1300 m down-lane in steps (mirrors the 1216 m screenshot), letting the
  // camera follow + the rig re-lock each step, so we catch any dome detachment.
  for (let d = 300; d <= 1300; d += 250) {
    await page.evaluate((dd) => { window.__dd.player.dist = dd; }, d);
    await page.waitForTimeout(250);
  }
  const probe = await page.evaluate(probeSky);
  console.log('  probe:', JSON.stringify(probe));
  const out = `/tmp/embertide-flight-${a.name}.png`;
  await page.screenshot({ path: out });
  console.log(`  wrote ${out}`);
  await done();
}
