// Ember Gambit: decline keeps the wallet; accept debits the stake into
// escrow; winning credits 2×; losing clears the escrow; a reload mid-gambit
// refunds; the revive offer never appears inside a gambit.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot();

async function crashWithHaul(haul) {
  await page.waitForFunction(() => window.__dd.game.state === 'playing');
  await page.evaluate((h) => {
    const { game, save, player } = window.__dd;
    save.revives = 0;
    game.embersRun = h;
    player.position.x = 99;
  }, haul);
  // Headless software-GL runs at a few fps — generous waits, no fixed sleeps.
  await page.waitForFunction(() => !!window.__dd.game.runSummary, { timeout: 30000 });
  await page.waitForSelector('#gambit-panel', { timeout: 30000 });
}

// --- Run 1: DECLINE ---
await page.click('#btn-start');
await crashWithHaul(100);
const w1 = await page.evaluate(() => window.__dd.save.embers);
await page.click('#btn-gambit-no');
check('decline hides the panel', await page.$eval('#gambit-panel', (el) => el.classList.contains('declined')));
check('decline leaves the wallet alone', (await page.evaluate(() => window.__dd.save.embers)) === w1);
check('decline kills re-offer eligibility', !(await page.evaluate(() => window.__dd.game.runSummary.gambit.eligible)));

// --- Run 2: ACCEPT and WIN ---
await page.click('#btn-again');
await crashWithHaul(100);
const stake = await page.evaluate(() => window.__dd.game.runSummary.gambit.stake);
const w2 = await page.evaluate(() => window.__dd.save.embers);
await page.click('#btn-gambit-go');
await page.waitForFunction(() => window.__dd.game.state === 'playing');
check('accept enters gambit mode', await page.evaluate(() => window.__dd.game.mode === 'gambit'));
check('accept debits the stake into escrow', await page.evaluate((args) =>
  window.__dd.save.embers === args.w2 - args.stake &&
  window.__dd.save.gambitPending && window.__dd.save.gambitPending.stake === args.stake,
  { w2, stake }));
// Revive must not trigger in gambit even with tokens banked — but first, win:
await page.evaluate(() => { window.__dd.player.dist = 700; });
await page.waitForFunction(() => window.__dd.game.state === 'gameover', { timeout: 30000 });
check('win screen shows', !!(await page.$('.gambit-won-title')));
// Net = wallet before accept + stake profit + the one-time All In feat (◆50)
check('win credits 2× stake (+ All In feat ◆50)',
  (await page.evaluate(() => window.__dd.save.embers)) === w2 + stake + 50);
check('win clears escrow + counts the stat', await page.evaluate(() =>
  window.__dd.save.gambitPending === null && window.__dd.save.stats.gambitsWon === 1));
check('win unlocks the All In feat', await page.evaluate(() =>
  window.__dd.save.feats.unlocked.includes('gambit_win')));

// --- Run 3: ACCEPT and LOSE (with revive tokens banked) ---
await page.click('#btn-again');
await crashWithHaul(100);
const w3 = await page.evaluate(() => window.__dd.save.embers);
const stake3 = await page.evaluate(() => window.__dd.game.runSummary.gambit.stake);
await page.evaluate(() => { window.__dd.save.revives = 3; });
await page.click('#btn-gambit-go');
await page.waitForFunction(() => window.__dd.game.state === 'playing' && window.__dd.game.mode === 'gambit');
await page.evaluate(() => { window.__dd.player.position.x = 99; });
await page.waitForFunction(() =>
  window.__dd.game.state === 'gameover' && window.__dd.save.gambitPending === null, { timeout: 30000 });
check('revive offer never appeared in gambit',
  !(await page.$eval('#revive-offer', (el) => el.classList.contains('visible'))));
check('loss screen shows', (await page.textContent('#screen h1')).includes('GAUNTLET KEEPS'));
check('loss forfeits exactly the stake', (await page.evaluate(() => window.__dd.save.embers)) === w3 - stake3);
check('loss clears escrow + counts the stat', await page.evaluate(() =>
  window.__dd.save.gambitPending === null && window.__dd.save.stats.gambitsLost === 1));

// --- Run 4: ACCEPT then RELOAD → stake refunded ---
await page.click('#btn-again');
await crashWithHaul(100);
const w4 = await page.evaluate(() => window.__dd.save.embers);
const stake4 = await page.evaluate(() => window.__dd.game.runSummary.gambit.stake);
await page.click('#btn-gambit-go');
await page.waitForFunction(() => window.__dd.game.mode === 'gambit');
await page.reload();
await page.waitForFunction(() => !!window.__dd, { timeout: 15000 });
check('reload refunds the escrowed stake', (await page.evaluate(() => window.__dd.save.embers)) === w4);
check('reload clears the escrow', await page.evaluate(() => window.__dd.save.gambitPending === null));
check('refund notice on the start screen', !!(await page.$('.start-notice')));

check('no console errors across all gambit flows', errors.length === 0) || console.error(errors.join('\n'));
await done();
