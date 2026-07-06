// The LANCE (lock) layer test battery. Grows PR-by-PR alongside the combat-verb
// build (combat-verbs SOP §II.7). Playwright harness on the browser.mjs pattern.
//
// PR0 — input hygiene (T0.x): touchcancel must not read as a surge tap.
// PR1 — V1 AIM-LINE (T1.x): the aim-cone/dwell/coyote/linger state machine, quiet
//        dwell (danger-binding), exposure ticks, and the coexist guard. The state
//        machine is dependency-injected, so T1.1–T1.6 drive the REAL module with a
//        fabricated ctx (fake model/player) on the hub — deterministic, no rAF race.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({ query: '?debug&boss=180' });

// ---------------------------------------------------------------------------
// PR1 — V1 aim-line unit tests. Run FIRST, on the hub (no live fight → the boss
// loop never touches the module), driving updateLockLayer directly. `frames` is a
// list of {dt, px, py, n?, live?, exposure?, incone?} steps; the fake organ
// 'focalEye' sits at world (0,0,0), so px/py ARE the distance from the cone centre.
// ---------------------------------------------------------------------------
async function runAim(spec) {
  return page.evaluate(async (spec) => {
    const mod = await import(new URL('./js/lockLayer.js', document.baseURI).href);
    mod.initLockLayer();
    const ORGAN = { focalEye: { x: 0, y: 0, z: 0 } };
    const model = {
      partWorldPos: (name, out) => {
        const p = ORGAN[name]; if (!p) return null;
        if (out) { out.x = p.x; out.y = p.y; out.z = p.z; return out; }
        return { ...p };
      },
      flash() {},
    };
    const dmg = [];
    const damageBoss = (amount, kind, e) => dmg.push({ amount, kind, part: e && e.part });
    for (const f of (spec.frames || [])) {
      const player = { position: { x: f.px ?? 0, y: f.py ?? 0 } };
      const ctx = {
        fightRunning: f.fight !== false,
        model,
        candidates: spec.candidates ?? ['focalEye'],
        muted: !!spec.muted,
        emittersLive: f.live !== false,
        exposureWindow: !!f.exposure,
        damageBoss, flashPart() {},
      };
      const n = f.n ?? 1;
      for (let i = 0; i < n; i++) mod.updateLockLayer(f.dt, player, ctx);
    }
    return { d: mod.__lockDebug(), aim: mod.lockAimHeld(), target: mod.lockAimTarget(),
      hud: mod.lockHudState(), dmg };
  }, spec);
}

// T1.1 — dwell threshold (rate 1.0 while fire is live).
const t11a = await runAim({ frames: [{ dt: 0.06, n: 5, live: true }] });          // 0.30s
const t11b = await runAim({ frames: [{ dt: 0.06, n: 6, live: true }] });          // 0.36s
check('T1.1 dwell 0.30s → not held', t11a.d.aimHeld === false);
check('T1.1 dwell 0.36s continuous → aimHeld', t11b.d.aimHeld === true);

// T1.2 — coyote: a ≤0.12s cone flicker keeps the dwell; >0.12s resets it.
const t12keep = await runAim({ frames: [
  { dt: 0.06, n: 4, px: 0, live: true },   // 0.24s in cone
  { dt: 0.10, n: 1, px: 20, live: true },  // 0.10s out (≤ coyote) — dwell frozen
  { dt: 0.06, n: 3, px: 0, live: true },   // back in → crosses 0.35s → held
] });
const t12reset = await runAim({ frames: [
  { dt: 0.06, n: 4, px: 0, live: true },   // 0.24s in cone
  { dt: 0.15, n: 1, px: 20, live: true },  // 0.15s out (> coyote) — dwell reset
  { dt: 0.06, n: 3, px: 0, live: true },   // back in → only 0.18s → NOT held
] });
check('T1.2 ≤coyote cone flicker preserves dwell (held)', t12keep.d.aimHeld === true);
check('T1.2 >coyote gap resets dwell (not held)', t12reset.d.aimHeld === false);

// T1.3 — retarget target + linger revert.
const t13hold = await runAim({ frames: [{ dt: 0.06, n: 7, px: 0, live: true }] });
check('T1.3 held line exposes the aim target part', t13hold.target && t13hold.target.part === 'focalEye');
check('T1.3 aim target carries the organ world x/y', t13hold.target && t13hold.target.x === 0 && t13hold.target.y === 0);
const t13linger = await runAim({ frames: [
  { dt: 0.06, n: 7, px: 0, live: true },   // acquire (held)
  { dt: 0.30, n: 3, px: 20, live: true },  // 0.90s out (> linger 0.6) → revert
] });
check('T1.3 line broken > linger reverts (no target, pose-centre aim)', t13linger.target === null && t13linger.aim === false);

// T1.4 — exposure ticks: ≤3 per window, each kind 'lock'; none outside a window.
const t14 = await runAim({ frames: [
  { dt: 0.06, n: 7, px: 0, live: true },                 // hold the line
  { dt: 0.9, n: 5, px: 0, live: true, exposure: true },  // ≥0.8 each → tick, capped at 3
] });
check('T1.4 exposure window pays ≤3 crack ticks', t14.dmg.length === 3);
check('T1.4 every exposure tick is kind:lock', t14.dmg.every((h) => h.kind === 'lock'));
const t14none = await runAim({ frames: [
  { dt: 0.06, n: 7, px: 0, live: true },                  // hold
  { dt: 0.9, n: 5, px: 0, live: true, exposure: false },  // NOT an exposure window
] });
check('T1.4 no ticks outside an exposure window', t14none.dmg.length === 0);

// T1.6 — quiet dwell: no live fire → rate halves, so 0.40s real ≈ 0.20 dwell (not held).
const t16 = await runAim({ frames: [{ dt: 0.05, n: 8, px: 0, live: false }] });   // 0.40s, quiet
check('T1.6 quiet period accrues dwell at 0.5× (0.40s → not held)', t16.d.aimHeld === false);

// T1.5 (coexist, unit half) — a def with NO lock candidates never activates the
// reticle boss-skin (hudState.active stays false), so the layer is fully inert.
const t15 = await runAim({ candidates: [], frames: [{ dt: 0.06, n: 8, px: 0, live: true }] });
check('T1.5 no candidates → reticle never activates (coexist)', t15.hud.active === false && t15.d.aimHeld === false);

// ---------------------------------------------------------------------------
// Integration — reach a live VOIDMAW fight (slot 1: virtualLockOrgan present).
// ---------------------------------------------------------------------------
await page.click('#btn-start');
await page.waitForFunction(() => window.__dd && window.__dd.game.state === 'playing', { timeout: 8000 });
await page.evaluate(() => window.__dd.spawnBoss());
await page.waitForFunction(() => window.__dd.bossState().active, { timeout: 8000 });
await page.evaluate(() => window.__dd.bossForceFight());
await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 8000 });
await page.waitForTimeout(200);   // let the fight loop step the lock layer a few frames

// T1.5 (coexist, integration half) — VOIDMAW HAS a virtualLockOrgan, so its reticle
// wakes the boss-skin (the organ is up); a def without lock data would not (unit above).
const retBoss = await page.evaluate(() => document.querySelector('#reticle').classList.contains('boss'));
check('T1.5 in a slot-1 fight the reticle wakes its boss-skin (organ present)', retBoss === true);

// --- T0.x (PR0 regression) — touchcancel must not read as a surge tap ---------
async function tapExtra(endType, base) {
  return page.evaluate(({ endType, base }) => {
    const canvas = window.__dd.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const mk = (id, x, y) => new Touch({ identifier: id, target: canvas, clientX: x, clientY: y });
    const steer = mk(base, cx - 40, cy), extra = mk(base + 1, cx + 40, cy);
    const ev = (type, changed, touches) => new TouchEvent(type, {
      bubbles: true, cancelable: true, changedTouches: changed, touches, targetTouches: touches });
    window.__dd.input.surgeTap = false;
    canvas.dispatchEvent(ev('touchstart', [steer], [steer]));
    canvas.dispatchEvent(ev('touchstart', [extra], [steer, extra]));
    canvas.dispatchEvent(ev(endType, [extra], [steer]));
    const tap = window.__dd.input.surgeTap;
    canvas.dispatchEvent(ev('touchend', [steer], []));
    return tap;
  }, { endType, base });
}
const makeReady = () => page.evaluate(() => {
  const g = window.__dd.game; g.feverActive = false; g.consecutiveRings = g.feverThreshold;
});

await makeReady();
const cancelTap = await tapExtra('touchcancel', 100);
check('T0.1 touchcancel does not arm the surge tap (surgeTap stays false)', cancelTap === false);
await page.waitForTimeout(300);
const feverAfterCancel = await page.evaluate(() => window.__dd.game.feverActive);
check('T0.1 touchcancel did not spend the ready Surge (feverActive stays false)', feverAfterCancel === false);

await makeReady();
const endTap = await tapExtra('touchend', 200);
check('T0.2 touchend arms the surge tap (control)', endTap === true);
let fired = false;
try {
  await page.waitForFunction(() => {
    const g = window.__dd.game;
    if (!g.feverActive) g.consecutiveRings = g.feverThreshold;
    return g.feverActive === true;
  }, { timeout: 3000 });
  fired = true;
} catch { fired = false; }
check('T0.2 the armed tap spent the ready Surge (feverActive true)', fired === true);

check('no console errors', errors.length === 0) || console.error(errors.join('\n'));
await done();
