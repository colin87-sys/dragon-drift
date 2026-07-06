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
    const ev = await import(new URL('./js/events.js', document.baseURI).href);
    let aimLocks = 0;
    ev.on('aimLock', () => { aimLocks++; });
    mod.initLockLayer();
    // Frames may move the organ (f.ox/f.oy) — the motion-sim tests (T1.10) drive a
    // strafing/jittering focal exactly like a live boss pose does.
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
      if (f.ox !== undefined) ORGAN.focalEye.x = f.ox;
      if (f.oy !== undefined) ORGAN.focalEye.y = f.oy;
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
      hud: mod.lockHudState(), dmg, aimLocks };
  }, spec);
}

// T1.1 — dwell threshold (rate 1.0 while fire is live).
const t11a = await runAim({ frames: [{ dt: 0.06, n: 5, live: true }] });          // 0.30s
const t11b = await runAim({ frames: [{ dt: 0.06, n: 6, live: true }] });          // 0.36s
check('T1.1 dwell 0.30s → not held', t11a.d.aimHeld === false);
check('T1.1 dwell 0.36s continuous → aimHeld', t11b.d.aimHeld === true);

// T1.2 — coyote + drain (L177): a ≤0.20s cone flicker FREEZES the dwell; past coyote
// the dwell DRAINS at dwellDrainMult (2×) instead of hard-resetting.
const t12keep = await runAim({ frames: [
  { dt: 0.06, n: 4, px: 0, live: true },   // 0.24s in cone
  { dt: 0.18, n: 1, px: 20, live: true },  // 0.18s out (≤ coyote 0.20) — dwell frozen
  { dt: 0.06, n: 3, px: 0, live: true },   // back in → crosses 0.35s → held
] });
const t12drain = await runAim({ frames: [
  { dt: 0.06, n: 4, px: 0, live: true },   // 0.24s in cone
  { dt: 0.25, n: 1, px: 20, live: true },  // 0.25s out (> coyote) — drain eats the progress
  { dt: 0.06, n: 3, px: 0, live: true },   // back in 0.18s → still short of 0.35 → NOT held
] });
check('T1.2 ≤coyote cone flicker preserves dwell (held)', t12keep.d.aimHeld === true);
check('T1.2 >coyote gap drains dwell (not held after a short return)', t12drain.d.aimHeld === false);

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

// T1.6 — V1 acquires at FULL rate even in a quiet lull (the quiet-rate penalty is
// reserved for V2 painting, not V1 aiming — otherwise the slot-1 teach was unlockable).
const t16 = await runAim({ frames: [{ dt: 0.05, n: 8, px: 0, live: false }] });   // 0.40s in a QUIET window
check('T1.6 V1 acquires at full rate even in a quiet lull (0.40s → held)', t16.d.aimHeld === true);
const t16b = await runAim({ frames: [{ dt: 0.05, n: 6, px: 0, live: false }] });  // 0.30s quiet
check('T1.6 still needs the full dwell time (0.30s → not held)', t16b.d.aimHeld === false);

// T1.5 (coexist, unit half) — a def with NO lock candidates never activates the
// reticle boss-skin (hudState.active stays false), so the layer is fully inert.
const t15 = await runAim({ candidates: [], frames: [{ dt: 0.06, n: 8, px: 0, live: true }] });
check('T1.5 no candidates → reticle never activates (coexist)', t15.hud.active === false && t15.d.aimHeld === false);

// T1.7 — the juice hooks: dwell progress (0..1) drives the reticle "closing in",
// and the aimLock (green-snap) event fires EXACTLY ONCE per lock (drives pop+chime).
const t17 = await runAim({ frames: [{ dt: 0.06, n: 10, px: 0, live: true }] });   // acquire + hold
check('T1.7 dwell progress reaches full when locked', t17.hud.dwell >= 0.999);
check('T1.7 aimLock (green-snap) event fires exactly once on a lock', t17.aimLocks === 1);
const t17none = await runAim({ frames: [{ dt: 0.05, n: 3, px: 0, live: true }] });  // 0.15s — never locks
check('T1.7 no aimLock when the line never locks', t17none.aimLocks === 0 && t17none.d.aimHeld === false);
check('T1.7 dwell progresses fractionally before lock', t17none.hud.dwell > 0.1 && t17none.hud.dwell < 1);

// T1.8 — drain-not-reset (L177): progress carried across a swing-through completes
// FASTER than a fresh acquire; a long absence drains to a full release.
const t18carry = await runAim({ frames: [
  { dt: 0.06, n: 5, px: 0, live: true },   // 0.30s in cone (dwell 0.30)
  { dt: 0.05, n: 6, px: 20, live: true },  // 0.30s out: 0.20 frozen (coyote) + 0.10×2 drained → ~0.10 left
  { dt: 0.06, n: 5, px: 0, live: true },   // back 0.30s → 0.40 total → held (a fresh 0.30 would NOT be — T1.1)
] });
check('T1.8 drained partial dwell carries across a swing-through (held)', t18carry.d.aimHeld === true);
const t18gone = await runAim({ frames: [
  { dt: 0.05, n: 4, px: 0, live: true },   // 0.20s in cone
  { dt: 0.05, n: 10, px: 20, live: true }, // 0.50s out → coyote 0.20 + drain 2× eats it all
] });
check('T1.8 long absence drains to a full release (aim line dropped)', t18gone.d.aimPart === null && t18gone.d.aimDwell === 0);

// T1.9 — acquire/retention asymmetry (L177): acquisition needs the tight 2.6m cone,
// but a dwell in progress keeps accruing anywhere inside the 4.0m retention cone.
const t19 = await runAim({ frames: [
  { dt: 0.05, n: 4, px: 0, live: true },   // acquire + 0.20s dwell inside the tight cone
  { dt: 0.06, n: 3, px: 3.2, live: true }, // 3.2m: outside acquire (2.6), inside retention (4.0) → still accruing → held
] });
check('T1.9 dwell keeps accruing inside the retention cone (held at 3.2m)', t19.d.aimHeld === true);
const t19cold = await runAim({ frames: [
  { dt: 0.06, n: 8, px: 3.2, live: true }, // 3.2m with NO dwell in progress: outside the acquire cone
] });
check('T1.9 retention never substitutes for acquisition (3.2m cold → no aim)', t19cold.d.aimPart === null);

// T1.10 — MOTION SIMS (the L175/L176 regression wall): the aim model must hold a
// strafing/jittering focal WITHOUT the boss being calmed. Player parked at centre.
const sine = (amp, om, dur, extra = {}) => {
  const frames = [];
  for (let t = 0; t < dur; t += 1 / 60) frames.push({ dt: 1 / 60, px: 0, live: true, ox: amp * Math.sin(om * t), ...extra });
  return frames;
};
// (a) The ORIGINAL hold-station sway (±5m @ 0.7 rad/s — peak 3.5 m/s): the exact
// motion L176 called "unlockable by chasing". No chasing needed: the acquire window
// at each centre-crossing is ~1.57s ≥ dwell 0.35s.
const t110a = await runAim({ frames: sine(5.0, 0.7, 9.5) });
check('T1.10a ORIGINAL ±5m sway is lockable from a still centre line', t110a.aimLocks >= 1);
// (b) The L175-measured "unlockable" fast focal (±4.5m @ 2.4 rad/s, ~10 m/s peak):
// anchor smoothing (EMA 0.25s → effective ±3.9m) + retention 4.0m mean a centred
// player locks on the first crossing and NEVER drops it.
const t110b = await runAim({ frames: sine(4.5, 2.4, 3.0) });
check('T1.10b fast focal (±4.5m @ 2.4) locks and holds from centre', t110b.aimLocks === 1 && t110b.aim === true);
// (c) Idle-animation jitter (±0.35m @ 3Hz — §3.7 guarantees every boss wobbles):
// the smoothed anchor barely moves; the lock acquires once and never breaks.
const t110c = await runAim({ frames: sine(0.35, 2 * Math.PI * 3, 2.0) });
check('T1.10c idle-anim jitter never breaks a lock (one snap, still held)', t110c.aimLocks === 1 && t110c.aim === true);

// T1.11 — the TUTORIAL INEQUALITY (bossDefs VOIDMAW holdSway): sway amplitude (3.2m)
// < retentionConeXY (4.0m) ⇒ a centred player never drops a held lock across a full
// sway cycle, while the mask still visibly strafes. This is the shipped slot-1 feel.
const t111 = await runAim({ frames: sine(3.2, 0.6, 11.0) });
check('T1.11 tutorial sway (±3.2m) locks once and holds a full cycle', t111.aimLocks === 1 && t111.aim === true);

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
