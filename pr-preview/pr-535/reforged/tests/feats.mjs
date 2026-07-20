// Feats: event-driven live unlocks are idempotent (toast fires); the ember
// reward is paid once on CLAIM (Pilot), never on unlock; streak thresholds read
// the game state.
import { boot, check } from './browser.mjs';

// runs: 1 keeps the first-flight gesture tutorial out of the way — it PAUSES the
// run mid-flight (runs === 0 only), which froze the settle leg once the H1 Bell
// wait added wall time before the crash. The settle setup below still rewrites
// stats.runs to 9 for the runs_10 feat.
const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 1 }, flags: { seenIntro: true } }))`,
});
await page.click('#btn-start');
await page.waitForFunction(() => window.__dd.game.state === 'playing');

const w0 = await page.evaluate(() => window.__dd.save.embers);

// First perfect ring → Bullseye unlocks (idempotently). Unlocking no longer
// auto-pays embers — the reward is claimed in Pilot (claimFeat) — so the wallet
// stays put through repeated unlock emits.
await page.evaluate(() => { window.__dd.emit('ring', { perfect: true }); });
check('Bullseye unlocks on first perfect', await page.evaluate(() =>
  window.__dd.save.feats.unlocked.includes('first_perfect')));
// H1: feat unlocks ring THE BELL (the one toast lane) as a jade line.
await page.waitForFunction(() =>
  document.querySelector('#bell-slug').classList.contains('show') &&
  document.querySelector('#bell-text').textContent.includes('Bullseye'),
  { timeout: 5000, polling: 120 });
check('feat unlock rings the Bell (jade role)',
  await page.$eval('#bell-slug', (el) => el.dataset.role === 'jade'));
await page.evaluate(() => { window.__dd.emit('ring', { perfect: true }); });
check('unlock does not auto-pay (claimed in Pilot)',
  (await page.evaluate(() => window.__dd.save.embers)) - w0 === 0);

// Claiming pays the reward exactly once; the claimed set guards double-pay.
const paid1 = await page.evaluate(() => window.__dd.claimFeat('first_perfect'));
const paid2 = await page.evaluate(() => window.__dd.claimFeat('first_perfect'));
const w1 = await page.evaluate(() => window.__dd.save.embers);
check('claim pays Bullseye once (+20), never twice', paid1 === 20 && paid2 === 0 && w1 - w0 === 20);

// Streak feat reads live game state.
await page.evaluate(() => {
  window.__dd.game.perfectStreak = 5;
  window.__dd.emit('ring', { perfect: true });
});
check('Threading the Needle at streak 5', await page.evaluate(() =>
  window.__dd.save.feats.unlocked.includes('pstreak_5')));

// Chain feat via consecutiveRings.
await page.evaluate(() => {
  window.__dd.game.consecutiveRings = 15;
  window.__dd.emit('gate');
});
check('Unbroken at chain 15', await page.evaluate(() =>
  window.__dd.save.feats.unlocked.includes('chain_15')));

// --- LANCE feats: the wyrmfire brand verb, live off the lock events. All emits
// batch into ONE evaluate (synchronous on the bus) so the slow headless run
// doesn't drift toward its own death before the settle setup below. The guard
// state is read mid-batch: a boss FORK-path volley carries no `perfect` and
// (here) count<5, so it must unlock NEITHER the beat feat nor the storm feat.
const lance = await page.evaluate(() => {
  const dd = window.__dd, U = () => dd.save.feats.unlocked;
  dd.emit('lockVolley', { count: 3, source: 'fork' });            // guard
  const guardBeat = U().includes('lance_beat'), guardStorm = U().includes('lance_storm');
  dd.emit('lockPaint',  { part: 'eye', count: 1 });               // first brand
  dd.emit('lockPaint',  { part: 'eye', count: 2, snap: true });   // perfect-parry snap
  dd.emit('lockCap',    { count: 6 });                            // meter at cap
  dd.emit('lockVolley', { count: 2, source: 'tap', perfect: true }); // beat release
  dd.emit('lockVolley', { count: 5, source: 'cap' });             // 5-brand volley
  return { guardBeat, guardStorm,
    brand: U().includes('lance_brand'), snap: U().includes('lance_snap'),
    cap: U().includes('lance_cap'), beat: U().includes('lance_beat'),
    storm: U().includes('lance_storm') };
});
check('fork volley (no perfect, count<5) unlocks no LANCE volley feat', !lance.guardBeat && !lance.guardStorm);
check('Brandbearer unlocks on first lance paint', lance.brand);
check('Lock-Snap unlocks on a snap paint', lance.snap);
check('Full Draw unlocks on lockCap', lance.cap);
check('On the Beat unlocks on a perfect release', lance.beat);
check('Wyrmstorm unlocks on a 5-brand volley', lance.storm);
// LANCE feats pay their reward once on claim, like every other feat.
const lancePaid1 = await page.evaluate(() => window.__dd.claimFeat('lance_snap'));
const lancePaid2 = await page.evaluate(() => window.__dd.claimFeat('lance_snap'));
check('claim pays Lock-Snap once (+80), never twice', lancePaid1 === 80 && lancePaid2 === 0);

// Settle feat: runs_10 via stats.
await page.evaluate(() => {
  const dd = window.__dd;
  dd.save.revives = 0;
  dd.save.stats.runs = 9; // recordBests() makes it 10 at settle
  dd.player.position.x = 99;
});
// Headless software-GL runs at a few fps — wait for the settle, not a sleep.
await page.waitForFunction(() => !!window.__dd.game.runSummary, { timeout: 30000 });
check('settle feat Regular at 10 runs', await page.evaluate(() =>
  window.__dd.save.feats.unlocked.includes('runs_10')));
check('feats appear in the run summary ledger', await page.evaluate(() =>
  window.__dd.game.runSummary.featResults.some((f) => f.def.id === 'runs_10')));

check('no console errors', errors.length === 0) || console.error(errors.join('\n'));
await done();
