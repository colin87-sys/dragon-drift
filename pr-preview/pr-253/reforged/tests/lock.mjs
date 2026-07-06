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
// PR2 — V2 LANCE-PAINT unit tests (T2.x): the paint/decay/cap/volley machine with
// a fabricated multi-organ ctx. Frames may set deflected/venting/hit/clear.
// ---------------------------------------------------------------------------
async function runLock(spec) {
  return page.evaluate(async (spec) => {
    const mod = await import(new URL('./js/lockLayer.js', document.baseURI).href);
    const ev = await import(new URL('./js/events.js', document.baseURI).href);
    const events = [];
    for (const name of ['lockPaint', 'lockVolley', 'lockLost', 'lockCap', 'aimLock']) ev.on(name, (p) => events.push({ name, ...(p || {}) }));
    mod.initLockLayer();
    const ORGANS = spec.organs;
    const model = {
      partWorldPos: (n, out) => { const p = ORGANS[n]; if (!p) return null; out.x = p.x; out.y = p.y; out.z = p.z ?? 0; return out; },
      flash() {},
    };
    const lances = [];
    for (const f of (spec.frames || [])) {
      if (f.ax !== undefined) ORGANS.A.x = f.ax;   // motion sims move organ A per frame
      const player = { position: { x: f.px ?? 0, y: f.py ?? 0 } };
      const ctx = {
        fightRunning: true, model,
        candidates: spec.candidates,
        muted: false, emittersLive: true, exposureWindow: false,
        damageBoss() {}, flashPart() {},
        tier: spec.tier ?? 2,
        cap: spec.cap ?? 3,
        deflected: !!f.deflected,
        phaseHp: spec.phaseHp ?? 100,
        paintUnlocked: spec.paintUnlocked !== false,
        paintables: spec.paintables ?? spec.candidates,
        amberVenting: (part) => (f.venting || []).includes(part),
        fireLance: (part, dmg) => lances.push({ part, dmg }),
      };
      if (f.hit) mod.notifyHit(spec.tier ?? 2);
      if (f.clear) mod.clearLocks('transition');
      for (let i = 0, n = f.n ?? 1; i < n; i++) mod.updateLockLayer(f.dt, player, ctx);
    }
    return { count: mod.lockCount(), hud: mod.lockHudState(), d: mod.__lockDebug(), lances, events };
  }, spec);
}
const ORGANS3 = { A: { x: 0, y: 0 }, B: { x: 10, y: 0 }, C: { x: 20, y: 0 } };
const paintSeq = (xs) => xs.flatMap((x) => [
  { dt: 0.06, n: 20, px: x },   // 1.2s at the organ: linger-release of the last line + acquire + paint
]);

// T2.1 — the completed dwell IS the first paint.
const t21 = await runLock({ organs: ORGANS3, candidates: ['A'], frames: [{ dt: 0.06, n: 8, px: 0 }] });
check('T2.1 dwell completion paints a lock pip', t21.count === 1 &&
  t21.events.some((e) => e.name === 'lockPaint' && e.part === 'A'));
check('T2.1 the painted lock publishes a live marker anchor + draining life',
  t21.hud.locks.length === 1 && t21.hud.locks[0].x === 0 &&
  t21.hud.locks[0].life > 0.9 && t21.hud.locks[0].life < 1);

// T2.2 — cap fuse auto-release: paint to cap 2, hold ~1.5s → one volley, 2 lances,
// locks cleared, per-lance dmg = min(lanceDmg 2.0, 10% of 100hp phase / 2 = 5.0) = 2.0.
const t22 = await runLock({ organs: ORGANS3, candidates: ['A', 'B'], cap: 2,
  frames: [...paintSeq([0, 10]), { dt: 0.06, n: 25, px: 10 }] });
// NB the held line legitimately begins REPAINTING right after the release (holding
// presence on an organ keeps converting — intended), so count may be 0 or 1 here.
check('T2.2 cap fuse fires ONE volley of 2 lances and clears the pips',
  t22.count <= 1 && t22.lances.length === 2 &&
  t22.events.filter((e) => e.name === 'lockVolley').length === 1 &&
  t22.events.find((e) => e.name === 'lockVolley').source === 'cap');
check('T2.2 lance damage is the un-clamped 2.0 at a 100hp phase', Math.abs(t22.lances[0].dmg - 2.0) < 1e-9);
check('T2.2 the cap fires ONE lockCap (the inhale) before the volley',
  t22.events.filter((e) => e.name === 'lockCap').length === 1);

// T2.2b — decay release: one painted pip, abandon the line → the volley fires itself
// when the oldest decay expires (partial paints are never silently lost).
const t22b = await runLock({ organs: ORGANS3, candidates: ['A'],
  frames: [{ dt: 0.06, n: 8, px: 0 }, { dt: 0.1, n: 42, px: 50 }] });
check('T2.2b decay expiry releases the partial paint as a volley',
  t22b.lances.length === 1 && t22b.events.find((e) => e.name === 'lockVolley')?.source === 'decay');

// T2.3 — THE ONE DEFLECT RULE: painting, decay, fuse all freeze; nothing fires.
const t23 = await runLock({ organs: ORGANS3, candidates: ['A', 'B'],
  frames: [
    { dt: 0.06, n: 8, px: 0 },                       // paint A
    { dt: 0.1, n: 50, px: 10, deflected: true },     // 5s deflected AT organ B, dwell held
  ] });
check('T2.3 deflect freezes decay (pip survives 5s) and blocks painting (B never paints)',
  t23.count === 1 && t23.lances.length === 0 && !t23.events.some((e) => e.name === 'lockVolley'));
check('T2.3 pips read ashen while deflected', t23.hud.ashen === true);

// T2.5 — queued launches hold while deflected and release on the break.
const t25 = await runLock({ organs: ORGANS3, candidates: ['A', 'B'], cap: 2,
  frames: [
    ...paintSeq([0, 10]),                            // cap 2 reached
    { dt: 0.06, n: 25, px: 10, deflected: true },    // fuse frozen: no volley into a shield
    { dt: 0.06, n: 25, px: 10 },                     // break → fuse completes → volley
  ] });
check('T2.5 no lance ever fires into a deflect state; the volley lands after the break',
  t25.lances.length === 2);

// T2.4 — hit strip is band-scaled: newest-only at tier ≤2, everything at tier ≥3.
const t24a = await runLock({ organs: ORGANS3, candidates: ['A', 'B'], tier: 2,
  frames: [...paintSeq([0, 10]), { dt: 0.02, n: 1, px: 10, hit: true }] });
check('T2.4 tier-2 hit strips the NEWEST pip only (+lockLost)', t24a.count === 1 &&
  t24a.events.some((e) => e.name === 'lockLost' && e.reason === 'hit'));
const t24b = await runLock({ organs: ORGANS3, candidates: ['A', 'B'], tier: 4, cap: 6,
  frames: [...paintSeq([0, 10]), { dt: 0.02, n: 1, px: 10, hit: true }] });
check('T2.4 tier-4 hit strips ALL pips', t24b.count === 0);

// T2.7 — amber-venting organs are dwell-exempt; the held line converts the moment
// the window closes (the refresh clock paints it — no re-acquire needed).
const t27 = await runLock({ organs: ORGANS3, candidates: ['A'],
  frames: [
    { dt: 0.06, n: 12, px: 0, venting: ['A'] },      // held, but A vents → no paint
    { dt: 0.06, n: 4, px: 0 },                       // window closed → refresh clock paints
  ] });
check('T2.7 venting organ never dwell-paints; paints right after the window closes',
  t27.count === 1 && t27.events.filter((e) => e.name === 'lockPaint').length === 1);

// T2.8 — the ROI clamp is enforced AT RELEASE: 2 lances vs a 30hp phase = 1.5 each.
const t28 = await runLock({ organs: ORGANS3, candidates: ['A', 'B'], cap: 2, phaseHp: 30,
  frames: [...paintSeq([0, 10]), { dt: 0.06, n: 25, px: 10 }] });
check('T2.8 per-volley damage hard-clamps to 10% of phase hp', t28.lances.length === 2 &&
  Math.abs(t28.lances[0].dmg - (0.10 * 30) / 2) < 1e-6);

// T2.10 — transitions clear silently: no lockLost spam on fight seams.
const t210 = await runLock({ organs: ORGANS3, candidates: ['A'],
  frames: [{ dt: 0.06, n: 8, px: 0 }, { dt: 0.02, n: 1, px: 0, clear: true }] });
check('T2.10 clearLocks(transition) is silent (no lockLost) and empties the pips',
  t210.count === 0 && !t210.events.some((e) => e.name === 'lockLost'));

// T2.13 — MULTI-CANDIDATE MOTION (the owner-caught slot-4 bug): on a boss with
// several organs, acquisition must test the DISPLAYED smoothed anchor, not a raw
// scan — a coiling rib (±4.5m @ 2.4, the L175 motion) must paint from a still
// centre line even with a second candidate in the list.
const swing = [];
for (let t = 0; t < 3.0; t += 1 / 60) swing.push({ dt: 1 / 60, px: 0, ax: 4.5 * Math.sin(2.4 * t) });
const t213 = await runLock({ organs: { A: { x: 0, y: 0 }, B: { x: 30, y: 0 }, C: { x: 40, y: 0 } },
  candidates: ['A', 'B', 'C'], frames: swing });
check('T2.13 a fast-swinging organ paints on a multi-organ boss (smoothed acquisition)',
  t213.count >= 1 && t213.events.some((e) => e.name === 'lockPaint' && e.part === 'A'));

// T2.17 — THE VIRTUAL ANCHOR NEVER TRAPS THE HUNT (owner playtest #3): a V1-only
// anchor (MARROWCOIL's skull — a candidate but never paintable) counted as
// 'unpainted' forever, so returning to centre parked the reticle on a face that
// can never take a pip. Three-class law: unpainted paintables > paintables > the
// virtual anchor; during the hunt the anchor can't steal the aim at all.
const T217 = { organs: { skull: { x: 0, y: 0 }, ribA: { x: 8, y: 0 }, ribB: { x: 16, y: 0 } },
  candidates: ['skull', 'ribA', 'ribB'], paintables: ['ribA', 'ribB'] };
const t217a = await runLock({ ...T217, frames: [{ dt: 0.06, n: 10, px: 0 }] });
check('T2.17 sitting on the virtual anchor: reticle leads to a rib, anchor never acquires',
  t217a.hud.aimPart === 'ribA' && t217a.d.aimPart === null);
const t217b = await runLock({ ...T217, frames: [
  { dt: 0.06, n: 10, px: 0 }, { dt: 0.06, n: 20, px: 8 }, { dt: 0.06, n: 12, px: 0 },
] });
check('T2.17 after branding rib A, returning to centre leads to rib B — never the skull',
  t217b.count === 1 && t217b.d.aimPart === null && t217b.hud.aimPart === 'ribB');
const t217c = await runLock({ ...T217, frames: [
  { dt: 0.06, n: 10, px: 0 }, { dt: 0.06, n: 20, px: 8 }, { dt: 0.06, n: 20, px: 16 },
  { dt: 0.06, n: 12, px: 0 },
] });
check('T2.17 hunt complete (all ribs branded, cap room left) → the anchor unlocks for V1 chip',
  t217c.count === 2 && t217c.d.aimPart === 'skull');

// T2.16 — SEALED HONESTY (owner playtest: a bright green 'locked' on a shielded
// boss promises a mark that won't take): while deflected the held state is never
// shown/celebrated; the instant the shield breaks, the lock fires AND paints.
const t216 = await runLock({ organs: { A: { x: 0, y: 0 } }, candidates: ['A'],
  frames: [{ dt: 0.06, n: 10, px: 0, deflected: true }] });
check('T2.16 sealed: dwell complete but never shown held, no celebration, no paint',
  t216.hud.aimHeld === false && t216.count === 0 &&
  !t216.events.some((e) => e.name === 'aimLock'));
const t216b = await runLock({ organs: { A: { x: 0, y: 0 } }, candidates: ['A'],
  frames: [{ dt: 0.06, n: 10, px: 0, deflected: true }, { dt: 0.06, n: 2, px: 0 }] });
check('T2.16 the break fires the celebration AND the paint instantly',
  t216b.count === 1 && t216b.events.some((e) => e.name === 'aimLock'));

// T2.15 — UNPAINTED-FIRST LAW (owner playtest: swinging back after a dodge
// re-grabbed the painted rib and pinned the player on refresh): while an unpainted
// paintable remains, sitting on a painted organ acquires NOTHING — even past the
// hop embargo. Once ALL are painted, refresh becomes reachable again.
const t215 = await runLock({ organs: { A: { x: 0, y: 0 }, B: { x: 12, y: 0 } },
  candidates: ['A', 'B'],
  frames: [{ dt: 0.06, n: 8, px: 0 }, { dt: 0.06, n: 30, px: 0 }] });   // paint A, sit on it 1.8s
check('T2.15 a painted organ never re-acquires while unpainted prey remains',
  t215.count === 1 && t215.hud.aimPart === 'B' &&
  t215.events.filter((e) => e.name === 'lockPaint').length === 1);

// T2.14 — PAINT-HOP (owner playtest): the instant a paint completes, the aim
// releases, the painted organ is briefly embargoed, and the reticle leads to the
// nearest UNPAINTED organ — hovering the painted rib must never pin the flow.
const t214 = await runLock({ organs: { A: { x: 0, y: 0 }, B: { x: 8, y: 0 }, C: { x: 30, y: 0 } },
  candidates: ['A', 'B', 'C'],
  frames: [{ dt: 0.06, n: 8, px: 0 }, { dt: 0.06, n: 2, px: 0 }] });
check('T2.14 after a paint the reticle hops to the nearest unpainted organ',
  t214.count === 1 && t214.hud.aimPart === 'B');

// ---------------------------------------------------------------------------
// T2.G — config/def gate lints (the honest arithmetic gates; printed value-vs-law).
// ---------------------------------------------------------------------------
const gates = await page.evaluate(async () => {
  const { CONFIG } = await import(new URL('./js/config.js', document.baseURI).href);
  const defs = await import(new URL('./js/bossDefs.js', document.baseURI).href);
  const L = CONFIG.LOCK, B = CONFIG.BOSS;
  const grazeR = CONFIG.playerRadius * B.grazeScale + B.bulletRadius;
  const voidmaw = defs.BOSSES.voidmaw, marrow = defs.BOSSES.marrowcoil;
  return {
    coneCorner: Math.SQRT2 * L.coneXY, grazeR,
    retention: L.retentionConeXY, cone: L.coneXY,
    caps: L.capByTier, decay: L.decay,
    tutorialAmp: voidmaw.holdSway?.amp ?? 5.0,
    marrowTier: marrow.tier, marrowParts: (marrow.lockParts || []).map((p) => p.part),
    roiWorst: (L.capByTier[4] * L.lanceDmg),
  };
});
check(`T2.G exposure-coupling law: cone corner ${gates.coneCorner.toFixed(2)} < grazeR ${gates.grazeR.toFixed(2)}`,
  gates.coneCorner < gates.grazeR);
check(`T2.G retention ${gates.retention} > acquire cone ${gates.cone}`, gates.retention > gates.cone);
check('T2.G cap ladder is 0/3/5/6/6 by tier', gates.caps[1] === 0 && gates.caps[2] === 3 &&
  gates.caps[3] === 5 && gates.caps[4] === 6 && gates.caps[5] === 6);
check(`T2.G decay ${gates.decay}s within the TUNE range [3,4]`, gates.decay >= 3 && gates.decay <= 4);
check(`T2.G TUTORIAL INEQUALITY: voidmaw sway amp ${gates.tutorialAmp} < retention ${gates.retention}`,
  gates.tutorialAmp < gates.retention);
check('T2.G marrowcoil is tier 2 with 4 rib lockParts', gates.marrowTier === 2 && gates.marrowParts.length === 4);

// T2.12 — def-lint: every marrowcoil lockPart resolves via the BUILT model's
// partWorldPos (a def naming a nonexistent part would silently never paint).
const partLint = await page.evaluate(async () => {
  const { buildBoss } = await import(new URL('./js/bossModel.js', document.baseURI).href);
  const defs = await import(new URL('./js/bossDefs.js', document.baseURI).href);
  const def = defs.BOSSES.marrowcoil;
  const model = buildBoss(def, 1);
  model.tick?.(0.016, 0.5);   // one tick so animated pivots take their posed positions
  const missing = [];
  for (const lp of def.lockParts) if (!model.partWorldPos(lp.part)) missing.push(lp.part);
  if (def.virtualLockOrgan && !model.partWorldPos(def.virtualLockOrgan)) missing.push(def.virtualLockOrgan);
  model.dispose?.();
  return missing;
});
check(`T2.12 marrowcoil lock anatomy resolves on the built model${partLint.length ? ' — MISSING: ' + partLint.join(',') : ''}`,
  partLint.length === 0);

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
