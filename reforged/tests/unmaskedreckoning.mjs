// THE RECKONING end-to-end (§5b/§8D, THE UNMASKED rung 14): brand all FIVE relics → the finale burn
// UNLOCKS. This proves the collection→burn-unlock GATE:
//   (1) BEFORE the reckoning, an on-tell (perfect) release earns NO burn (the burn is LOCKED — a
//       stage-1/2 freebie would be silently wrong, and every existing test greens on it);
//   (2) branding the five relics completes the reckoning (dedup-safe; a non-relic paint never counts);
//   (3) AFTER the reckoning, the SAME on-tell release DOES burn (frac 0.20) and the DOT ticks + damages.
//
// The burn is RECKONING-gated (def.burnGate 'reckoning'), NOT phase-gated — the reckoning can only
// complete in stage 2 in real play (the relics are phase-[1] organs; their stage-2 paintability is
// proven by unmaskedorgans.mjs), so completion IS the finale gate. We run in a NATURAL forceFight (no
// stage pin) and drive the reckoning via direct lockPaint events + a perfect lockVolley event — this
// isolates the RECKONING GATE from music-beat timing (the beat-timed perfect release + the burn
// tick/damage plumbing are shared code, proven robustly by knellburn) and from debug-stage-pin
// artifacts, so the DOT ticks in the real fight loop.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true, lockUnlocked: true } }))`,
});
await page.waitForTimeout(800);
await page.click('#btn-start');
await page.waitForTimeout(600);
await page.evaluate(() => { window.__dd.bossSetDefIdx(13); window.__dd.spawnBoss(); });
await page.waitForTimeout(600);
await page.evaluate(() => window.__dd.bossForceFight());
await page.waitForTimeout(1000);

check('fighting the unmasked', (await page.evaluate(() => window.__dd.bossState()?.id)) === 'unmasked');
const r0 = await page.evaluate(() => window.__dd.bossReckoning());
check(`the reckoning starts empty (branded ${r0.branded.length}/${r0.need}, done ${r0.done})`,
  r0.branded.length === 0 && r0.done === false && r0.need === 5);

// A perfect on-tell release event (source 'tap', perfect true). We drive the burn LISTENER directly so
// the test isolates the RECKONING GATE from music-beat timing (the beat-timed perfect release itself is
// proven by knellburn — shared code). Only the reckoning gate is unmasked-specific.
const perfectVolley = `window.__dd.emit('lockVolley', { source: 'tap', perfect: true, count: 4, paintedCount: 4, dmgEach: 5, volleyTotal: 20 })`;

// (1) PRE-RECKONING: a perfect on-tell release of ≥ burnFloor pips earns NO burn (the gate holds).
const preBurn = await page.evaluate(async (ev) => { eval(ev); await new Promise((r) => setTimeout(r, 80)); return window.__dd.bossBurns(); }, perfectVolley);
check(`PRE-reckoning a perfect on-tell release earns NO burn — the finale burn is LOCKED (active ${preBurn.active})`,
  preBurn.active === 0);

// (2) THE COLLECTION: a non-relic paint must NOT count; the five relics complete it; dedup-safe.
const collect = await page.evaluate(async () => {
  const steps = [];
  window.__dd.emit('lockPaint', { part: 'wingEye0' });          // a non-relic paint — must NOT advance
  steps.push(window.__dd.bossReckoning());
  for (const relic of ['relicHorn', 'relicHorn', 'relicBlade', 'relicLink', 'relicSpool']) {
    window.__dd.emit('lockPaint', { part: relic });             // relicHorn twice — the set dedups
    steps.push(window.__dd.bossReckoning());
  }
  window.__dd.emit('lockPaint', { part: 'relicShard' });         // the fifth distinct relic → completes
  await new Promise((r) => setTimeout(r, 60));
  steps.push(window.__dd.bossReckoning());
  return steps;
});
// steps: [0]=wingEye0, [1]=horn, [2]=horn(dup), [3]=blade, [4]=link, [5]=spool, [6]=shard
check(`a NON-relic paint (wingEye0) never advances the reckoning (branded ${collect[0].branded.length})`, collect[0].branded.length === 0);
check(`branding relicHorn TWICE counts ONCE — the set dedups (branded ${collect[1].branded.length} then ${collect[2].branded.length} after the dup)`,
  collect[1].branded.length === 1 && collect[2].branded.length === 1);
check(`a distinct second relic (blade) advances to 2 (branded ${collect[3].branded.length})`, collect[3].branded.length === 2);
check(`branding all five distinct relics COMPLETES the reckoning (branded ${collect[6].branded.length}/5, done ${collect[6].done})`,
  collect[6].branded.length === 5 && collect[6].done === true);

// (3) POST-RECKONING: the SAME perfect on-tell release now BURNS — pending = 0.20 × volleyTotal 20 = 4.0.
// Same input, opposite outcome: that IS the gate.
const postBurn = await page.evaluate(async (ev) => { eval(ev); await new Promise((r) => setTimeout(r, 80)); return { burns: window.__dd.bossBurns(), hp: window.__dd.bossState().hp }; }, perfectVolley);
check(`POST-reckoning the SAME perfect on-tell release BURNS — the RECKONING unlocked it (active ${postBurn.burns.active}, pending ${postBurn.burns.pending.toFixed(2)} ≈ 0.20×20)`,
  postBurn.burns.active > 0 && postBurn.burns.pending > 3.5);

// (3b) the finale burn TICKS DOWN and reduces boss hp — the DOT is live (wired to damageBoss, not a
// dead counter). We POLL inside a single evaluate so the page stays active: the reckoning's eye-snap +
// attack-hold freezes the scene, and headless chromium throttles the rAF game loop during an idle
// node-level wait when nothing animates (knellgrave keeps tolling, so knellburn can node-wait). Polling
// keeps the loop alive. The tick/damage path is shared with knellgrave (knellburn proves it in full).
const pendA = postBurn.burns.pending, hpA = postBurn.hp;
const drain = await page.evaluate(async () => {
  let last = window.__dd.bossBurns().pending;
  for (let i = 0; i < 20; i++) { await new Promise((r) => setTimeout(r, 120)); last = window.__dd.bossBurns().pending; if (last < 3.9) break; }
  return { pending: last, hp: window.__dd.bossState().hp };
});
check(`the finale burn drains its counter (${pendA.toFixed(2)} → ${drain.pending.toFixed(2)}) and reduces boss hp (${hpA.toFixed(1)} → ${drain.hp.toFixed(1)})`,
  drain.pending < pendA && drain.hp < hpA);

// (4) THE RESET LEAK (§CP2 self-catch): a game-over mid-fight (resetBoss — the HARD teardown, distinct
// from the boss-defeat endEncounter) must NOT leak the unlocked burn into the next unmasked run. burns
// is cleared on BOTH teardown paths; the reckoning latch must be too, or a death-after-collection would
// hand the next finale a free burn from relic #0.
const afterReset = await page.evaluate(() => { window.__dd.bossReset(); return window.__dd.bossReckoning(); });
check(`a hard teardown (game-over path) RESETS the reckoning latch — no burn leaks to the next run (branded ${afterReset.branded.length}, done ${afterReset.done})`,
  afterReset.branded.length === 0 && afterReset.done === false);

check('no console errors through the reckoning run', errors.length === 0) || console.error(errors.slice(0, 5).join('\n'));
console.log(process.exitCode ? '\nunmasked RECKONING verification FAILED.' : '\nunmasked RECKONING verification passed.');
await done();
