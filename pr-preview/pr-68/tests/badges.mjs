// Appointment UI honesty: badges only when genuinely due, cleared the moment
// the surface opens, the clear persists; daily glow tracks the actual state.
import { boot, check } from './browser.mjs';

// --- PILOT badge: unseen feat → badge; open pilot → cleared + persisted ---
{
  const { page, errors, done } = await boot({
    initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
      v: 2, feats: { unlocked: ['first_perfect'] }, ui: { seenFeats: 0, seenTitles: 0, shopSeenEmbers: 0 },
    }))`,
  });
  check('PILOT badge shows for unseen feat', !!(await page.$('#btn-pilot .badge')));
  await page.click('#btn-pilot');
  await page.waitForSelector('.feat-grid');
  check('watermark written on open', await page.evaluate(() => window.__dd.save.ui.seenFeats === 1));
  await page.mouse.click(20, 320); // blank-tap back to start
  await page.waitForTimeout(250);
  check('badge gone after viewing', !(await page.$('#btn-pilot .badge')));
  const persisted = await page.evaluate(() => {
    window.__dd.save; // force ref
    return JSON.parse(localStorage.getItem('dragonDriftSave')).ui.seenFeats === 1;
  });
  check('clear persisted to localStorage', persisted);
  check('no errors', errors.length === 0) || console.error(errors.join('\n'));
  await done();
}

// --- SHOP badge: newly-affordable rule ---
{
  const { page, errors, done } = await boot({
    initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
      v: 2, embers: 700, ui: { seenFeats: 0, seenTitles: 0, shopSeenEmbers: 0 },
    }))`,
  });
  check('SHOP badge: 700◆ makes the 600◆ dragon newly affordable', !!(await page.$('#btn-shop .badge')));
  await page.click('#btn-shop');
  await page.waitForSelector('.shop-grid');
  check('shop open writes the wallet watermark', await page.evaluate(() => window.__dd.save.ui.shopSeenEmbers === 700));
  await page.mouse.click(20, 320);
  await page.waitForTimeout(250);
  check('badge silent after browsing (no new affordability)', !(await page.$('#btn-shop .badge')));
  check('no errors', errors.length === 0) || console.error(errors.join('\n'));
  await done();
}

// --- SHOP badge absent when nothing is newly affordable ---
{
  const { page, errors, done } = await boot({
    initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
      v: 2, embers: 700, ui: { seenFeats: 0, seenTitles: 0, shopSeenEmbers: 700 },
    }))`,
  });
  check('no SHOP badge when the wallet has not grown past a price line', !(await page.$('#btn-shop .badge')));
  check('no errors', errors.length === 0) || console.error(errors.join('\n'));
  await done();
}

// --- Daily glow: on when not flown today, off when done ---
{
  const today = new Date().toISOString().slice(0, 10);
  const { page, errors, done } = await boot({
    initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
      v: 2, daily: { date: '${today}', played: true, bestScore: 100, streak: 1, bonusDay: '${today}' },
    }))`,
  });
  check('no daily glow once flown today', !(await page.$('#btn-daily.glow')));
  check('no errors', errors.length === 0) || console.error(errors.join('\n'));
  await done();
}
{
  const { page, errors, done } = await boot();
  check('daily glow invites on a fresh day', !!(await page.$('#btn-daily.glow')));
  check('no errors', errors.length === 0) || console.error(errors.join('\n'));
  await done();
}
