// THE UNMASKED × THE HOLLOW BEHIND THE SKY (arena PR-A) — the value-space void swap. Two parts:
// PURE-NODE proves the env override is a byte-clean value-space transform (schema-complete, no-op at
// mix 0, void-exact at mix 1, zero scene-graph writes — the reparent-safety by construction). BROWSER
// proves it engages/restores live, stays disjoint from the EMBERTIDE sky channel, and adds no draws.
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);

const THREE = await import('three');
const { computeEnv } = await import('../js/biomes.js');
const { applyArenaSkin, VOID_HEX, ARENA_ENV_KEYS } = await import('../js/arenaSkin.js');
import { readFileSync } from 'node:fs';

let n = 0, fails = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };
const bad = (m) => { n++; fails++; console.error(`  ✗ ${m}`); };
const check = (c, m) => (c ? ok(m) : bad(m));

const snap = (env) => {
  const o = {};
  for (const k of ARENA_ENV_KEYS) o[k] = env[k]?.isColor ? env[k].getHex() : env[k];
  return o;
};

// --- Schema completeness (audit F3.4): the arena must set EXACTLY the env's fields, so a graphics-
// stream env addition fails LOUDLY here instead of leaking a biome value into the void.
const envKeys = new Set(Object.keys(computeEnv(0)));
const arenaKeys = new Set(ARENA_ENV_KEYS);
const missing = [...envKeys].filter((k) => !arenaKeys.has(k));
const extra = [...arenaKeys].filter((k) => !envKeys.has(k));
check(missing.length === 0 && extra.length === 0,
  `ARENA_ENV_KEYS is schema-complete vs computeEnv (missing ${JSON.stringify(missing)}, extra ${JSON.stringify(extra)})`);

// --- Byte-identity at mix 0 (the coexistence proof): applyArenaSkin(env, 0) changes NOTHING.
for (const dist of [0, 1500, 4200, 9001]) {
  const env = computeEnv(dist);
  const before = snap(env);
  applyArenaSkin(env, 0);
  const after = snap(env);
  const diff = ARENA_ENV_KEYS.filter((k) => before[k] !== after[k]);
  check(diff.length === 0, `mix 0 is byte-identical at dist ${dist} (changed: ${JSON.stringify(diff)})`);
}

// --- Void-exact at mix 1: applyArenaSkin(env, 1) → every field equals the VOID table, from ANY biome.
for (const dist of [0, 4200]) {
  const env = computeEnv(dist);
  applyArenaSkin(env, 1);
  const got = snap(env);
  const wrong = ARENA_ENV_KEYS.filter((k) => {
    const want = VOID_HEX[k];
    return env[k]?.isColor ? got[k] !== new THREE.Color(want).getHex() : Math.abs(got[k] - want) > 1e-6;
  });
  check(wrong.length === 0, `mix 1 is the VOID table exactly from dist ${dist} (wrong: ${JSON.stringify(wrong)})`);
}

// --- String-assert (audit F8, narrowed): arenaSkin.js writes NO scene graph (Color math is legit).
const src = readFileSync(new URL('../js/arenaSkin.js', import.meta.url), 'utf8');
const banned = /scene\.add|\.parent\s*=|new THREE\.(Mesh|Group|Points|InstancedMesh|Sprite|Line)\b/;
check(!banned.test(src), 'arenaSkin.js has zero scene-graph writes (value-space only — reparent-safe by construction)');

// ---------------------------------------------------------------------------
// BROWSER part
import { boot } from './browser.mjs';
const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true, lockUnlocked: true } }))`,
});
await page.waitForTimeout(800);
await page.click('#btn-start');
await page.waitForTimeout(600);

// (b) COEXIST — the two sky-owning systems are disjoint. EMBERTIDE (skyReplace) engages skyDim, never
// the arena mix; VOIDMAW never touches either. (boss.mjs covers the broad roster; this pins R9.)
const embert = await page.evaluate(async () => {
  window.__dd.bossSetDefIdx(12); window.__dd.spawnBoss();
  await new Promise((r) => setTimeout(r, 400)); window.__dd.bossForceFight();
  let s; for (let i = 0; i < 30; i++) { await new Promise((r) => setTimeout(r, 60)); s = window.__dd.bossArenaState(); if (s.skyDim > 0) break; }
  return s;
});
check(embert.mix === 0 && embert.skyDim > 0, `EMBERTIDE engages the sky-replace channel (skyDim ${embert.skyDim?.toFixed?.(2)}), NEVER the arena mix (${embert.mix})`);
await page.evaluate(() => window.__dd.bossReset());
await page.waitForTimeout(300);

// (c) SYNC/SNAP — pin S2, force the fight, SKIP the intro beat → the void snaps to mix 1 (the
// deterministic path; the beat's live ramp is rAF-throttled headless, so we assert the snap).
const engaged = await page.evaluate(async () => {
  window.__dd.bossSetDefIdx(13); window.__dd.bossSetStage(2); window.__dd.spawnBoss();
  await new Promise((r) => setTimeout(r, 400)); window.__dd.bossForceFight();
  await new Promise((r) => setTimeout(r, 500));
  window.__dd.input.surgeTap = true;
  // Poll until the per-frame-derived flags settle: bossArenaMix() snaps to 1 the same frame the skip
  // zeroes the beat (stateless getter), but game.bossVoidSky + the band latch are set by updateBoss's
  // per-frame drive a tick or two later (~16ms in-game; slower headless). Wait for voidSky, not the getter.
  let s; for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 50)); s = window.__dd.bossArenaState(); if (s.mix >= 0.99 && s.voidSky) break; }
  s.wingEye0 = window.__dd.bossPartWorldPos('wingEye0');   // the organ under the live void — the reparent-safety read
  return s;
});
check(engaged.mix >= 0.99, `the void engages to mix ${engaged.mix?.toFixed?.(3)} on the S2 skip-snap`);
// REPARENT-SAFETY (the embertide-lesson proof, empirical belt to the structural string-assert above):
// with the void LIVE at mix 1, a stage-2 organ still resolves SANELY in-lane — not null, not the y150+
// oblivion a rig reparent would cause. Comfort (≤22) is the rung-14 organ test's job; this proves the
// VALUE-SPACE arena never moved the organ at all.
const we = engaged.wingEye0;
check(we && Number.isFinite(we.x) && Number.isFinite(we.y) && Math.abs(we.x) <= 10.4 && we.y > 8 && we.y < 25,
  `wingEye0 resolves sanely in-lane WITH the void live — no reparent (${we ? `x${we.x.toFixed(1)} y${we.y.toFixed(1)}` : 'null'})`);
check(engaged.voidSky === true, 'the void suppresses god-rays (voidSky true)');
check(engaged.propBandsHidden === true, 'the biome prop bands are dark in the void (F1 gate)');
check(engaged.skyDim === 0, 'the EMBERTIDE sky channel stayed 0 under the void (disjointness)');

// (e) BAND — the void's certified dark-band lift is live at the reveal.
check(engaged.bandDark === 0xa84167, `the void's dark bullet band is the certified lift 0xa84167 (got 0x${engaged.bandDark?.toString(16)})`);

// (d) TEARDOWN — a hard reset restores everything within a frame (self-healing stateless source).
const restored = await page.evaluate(async () => {
  window.__dd.bossReset();
  let s; for (let i = 0; i < 30; i++) { await new Promise((r) => setTimeout(r, 50)); s = window.__dd.bossArenaState(); if (!s.propBandsHidden && s.mix === 0) break; }
  return s;
});
check(restored.mix === 0 && restored.voidSky === false && restored.propBandsHidden === false && restored.bandDark === 0x8f0a3c,
  `teardown restores the ordinary world (mix ${restored.mix}, voidSky ${restored.voidSky}, props ${restored.propBandsHidden}, band 0x${restored.bandDark?.toString(16)})`);

// (T5) PERF — the void adds ZERO draws (empty-first); whale/flyby/prop suppression can only reduce
// them (delta ≤ 0, never === 0 which would prove nothing). Compare a settled S1 vs a settled void.
const calls = await page.evaluate(async () => {
  const read = () => window.__dd.renderer.info.render.calls;
  window.__dd.bossSetDefIdx(13); window.__dd.bossSetStage(1); window.__dd.spawnBoss();
  await new Promise((r) => setTimeout(r, 400)); window.__dd.bossForceFight();
  await new Promise((r) => setTimeout(r, 500));
  const s1 = read();
  window.__dd.bossReset(); await new Promise((r) => setTimeout(r, 200));
  window.__dd.bossSetDefIdx(13); window.__dd.bossSetStage(2); window.__dd.spawnBoss();
  await new Promise((r) => setTimeout(r, 400)); window.__dd.bossForceFight();
  await new Promise((r) => setTimeout(r, 300)); window.__dd.input.surgeTap = true;
  await new Promise((r) => setTimeout(r, 300));
  const s2 = read();
  return { s1, s2 };
});
check(calls.s2 - calls.s1 <= 0, `the void adds no draws (S1 ${calls.s1} → void ${calls.s2}, delta ${calls.s2 - calls.s1} ≤ 0)`);

check(errors.length === 0, 'no console errors through the arena run') || console.error(errors.slice(0, 5).join('\n'));
await done();

if (fails) { process.exitCode = 1; console.log(`\nunmasked arena verification FAILED (${fails}/${n}).`); }
else console.log(`\n${n} unmasked arena checks passed.`);
