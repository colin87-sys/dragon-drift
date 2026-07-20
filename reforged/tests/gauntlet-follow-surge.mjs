// REGRESSION — THE GAUNTLET keeps FOLLOWING the dragon through DRAGON SURGE.
// (owner bug 2026-07-17: at the instant the surge meter filled, the vitals cluster
// snapped to centre, pulsed, and stopped following.)
//
// ROOT CAUSE this guards: the gauntlet container wears `.combo` + `data-tier`; the
// legacy combo-badge rule `.combo[data-tier="4"/"5"]` ran `combo-rage` (a transform
// animation) on it. A running CSS transform-animation outranks an inline transform in
// the RENDERED output — so ui.gauntletFollow's inline translate kept updating (any
// harness reading `el.style.transform` sees it "working") while the SCREEN froze the
// cluster at centre. THE ONLY FAITHFUL PROBE IS getComputedStyle().transform, and the
// condition only bites with animations enabled → we force reduced-motion: no-preference.
import { boot, check } from './browser.mjs';

async function run(viewport, label) {
  const { page, errors, done } = await boot({
    viewport,
    initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true, hintsSeen: 16383, seenFirstSurge: true } }))`,
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });   // real-device: animations ON
  await page.evaluate(() => document.getElementById('btn-start').click());
  await page.waitForFunction(() => window.__dd.game.state === 'playing', undefined, { timeout: 30000, polling: 120 });
  await page.waitForTimeout(400);
  await page.evaluate(async () => {
    window.__gf = { THREE: await import('three'),
      RINGS: await import(new URL('./js/rings.js', document.baseURI).href) };
    window.__gf.proj = new window.__gf.THREE.Vector3();
  });

  // Sweep the dragon left↔right while spawning rings dead-ahead so the game's OWN
  // updateRings collects them (real collect() path) and fires surge authentically.
  // The follow EASES toward the dragon's screen X (τ≈0.14s, 1-exp(-7·dt)). Headless
  // software-GL runs at a few fps, so a fast 16ms/step sweep gives the ease ~0 frames
  // per step → it lags a large fraction of the sweep period and the correlation
  // collapses (a false negative — the follow IS tracking, just phase-lagged). Sweep
  // SLOWLY (one cycle over the run) and give the follow real frames to settle between
  // samples, so the measured correlation reflects tracking, not sampling lag.
  const rows = [];
  const STEPS = 40;
  for (let i = 0; i < STEPS; i++) {
    const x = Math.sin((i / STEPS) * Math.PI * 2 - Math.PI / 2) * 7;
    await page.evaluate((x) => {
      const dd = window.__dd, G = window.__gf;
      dd.player.position.x = x; dd.player.velocity.x = 0;
      G.RINGS.addRing({ x, y: dd.player.position.y, dist: dd.player.dist + 0.8 });
    }, x);
    await page.waitForTimeout(140);   // let the ease track the (slow) target before sampling
    const r = await page.evaluate((i) => {
      const dd = window.__dd, el = document.getElementById('stamina-arc'), G = window.__gf;
      const x = dd.player.position.x;
      G.proj.set(x, dd.player.position.y, -dd.player.dist).project(dd.camera);
      const sx = G.proj.z > 1 ? null : (G.proj.x * 0.5 + 0.5) * window.innerWidth;
      const m = el.style.transform.match(/-50% \+ ([-\d.]+)px/);
      const inlineDx = m ? +m[1] : null;
      // RENDERED offset: computed matrix translateX + half width (undoes the -50%).
      const cs = getComputedStyle(el).transform;
      const nums = cs && cs.startsWith('matrix') ? cs.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number) : null;
      const computedDx = nums ? +(nums[4] + el.offsetWidth / 2).toFixed(1) : null;
      return { i, fever: dd.game.feverActive, surge: el.classList.contains('surge'),
        sx: sx == null ? null : Math.round(sx), inlineDx, computedDx,
        diverge: (inlineDx != null && computedDx != null) ? Math.abs(computedDx - inlineDx) : null };
    }, i);
    rows.push(r);
  }

  const surgeRows = rows.filter(r => r.surge && r.computedDx != null && r.inlineDx != null);
  const anySurge = surgeRows.length > 3;
  check(`[${label}] a real surge crossed during the sweep (${surgeRows.length} surge frames)`, anySurge);

  // 1) The RENDERED transform must equal what the follow wrote — no CSS override.
  //    Pre-fix this hit ~140px during surge; post-fix it stays sub-pixel.
  const maxDiv = Math.max(...surgeRows.map(r => r.diverge));
  check(`[${label}] computed transform == follow's inline write through surge (max ${maxDiv.toFixed(1)}px < 3)`, maxDiv < 3);

  // 2) The RENDERED offset genuinely TRACKS the moving dragon during surge (not frozen).
  const cdx = surgeRows.map(r => r.computedDx);
  const span = Math.max(...cdx) - Math.min(...cdx);
  check(`[${label}] the rendered cluster keeps following the dragon under surge (span ${span.toFixed(0)}px > 40)`, span > 40);

  // 3) Directional: the RENDERED offset correlates with the dragon's screen X across the
  //    whole surge window (Pearson r) — proves it follows the dragon, not a fixed pose.
  const S = surgeRows.filter(r => r.sx != null);
  const mean = (a, k) => a.reduce((s, r) => s + r[k], 0) / a.length;
  const mx = mean(S, 'sx'), my = mean(S, 'computedDx');
  let cov = 0, vx = 0, vy = 0;
  for (const r of S) { const dx = r.sx - mx, dy = r.computedDx - my; cov += dx * dy; vx += dx * dx; vy += dy * dy; }
  const r = cov / (Math.sqrt(vx * vy) || 1);
  check(`[${label}] rendered offset tracks the dragon's screen X under surge (r=${r.toFixed(2)} > 0.5)`, r > 0.5);

  check(`[${label}] no console errors`, errors.length === 0) || console.error(errors.join('\n'));
  await done();
}

await run({ width: 900, height: 640 }, 'desktop');
await run({ width: 414, height: 896 }, 'mobile-portrait');
