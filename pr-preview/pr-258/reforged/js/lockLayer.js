import * as THREE from 'three';
import { CONFIG } from './config.js';
import { emit } from './events.js';

// THE LANCE (lock) layer — the player combat-verb state machine (combat-verbs SOP
// §II.5). This module OWNS NO RENDERING: it publishes state (via lockHudState /
// the aim accessors), and ui.js / boss.js / reticle.js render from it. It is fully
// dependency-injected — updateLockLayer takes a per-frame `ctx` built by boss.js —
// so it can be unit-tested headlessly with fabricated ctx (see tests/lock.mjs).
//
// PR1 scope: V1 AIM-LINE only (§I.c V1). Holding the flight line inside a cone on a
// boss organ for `dwellTime` wakes the reticle, retargets the rider's auto-fire onto
// that organ, and — during a post-string exposure window — pays visible crack ticks.
// No painting, no locks, no volley yet (those arrive in PR2+); the exports for that
// (lockCount / paintFromParry / consumeAllLocks / clearLocks) are present and inert
// so the boss.js seams can reference a stable API across PRs.

const L = CONFIG.LOCK;

const S = {
  aimPart: null,     // the part name the line is currently acquiring / holding
  aimDwell: 0,       // in-cone time accrued toward dwellTime (drains, never hard-resets — L177)
  aimHeld: false,    // dwell completed → the line is locked on the organ
  offT: 0,           // time since the line last sat in the cone (coyote / linger clock)
  muted: false,      // def.lockMuted — reticle ashen, no V1 rate bonus (slot 13)
  hudPart: null,     // the organ the reticle should point at (aim organ, else primary)
  hasOrgan: false,   // hudPart resolved to a live world position this frame
  // The SMOOTHED ANCHOR (L177): an EMA low-pass of the tracked organ's world position.
  // The reticle draws it, the rider aims at it, and retention tests against it — so the
  // marker the player chases IS the point that locks, and idle-animation jitter (§3 law 7:
  // every boss wobbles at ≥2 frequencies) can never break a held line.
  anchorPart: null,
  ax: 0, ay: 0, az: 0,
  fightRunning: false,
  expTickT: 0,       // exposure-window tick clock
  expTicks: 0,       // ticks paid in the current exposure window (cap 3)
  expActive: false,  // were we inside an exposure window last frame (edge detect)
  _wasHeld: false,   // edge-detect for the aimLock (green snap) event
  // V2 LANCE-PAINT (PR2)
  locks: [],         // painted pips, oldest first: [{ part, stacks, age }]
  capFuseT: 0,       // time at/above cap — auto-release after L.capFuse (a beat is catchable)
  refreshT: 0,       // held re-dwell clock toward L.refreshDwell (refresh / stack)
  lanceQ: [],        // staggered launches: [{ part, dmg, t }] — held while deflected
  cap: 0,            // last ctx.cap (published to the HUD)
  deflected: false,  // last ctx.deflected (pips freeze ashen)
  hopPart: null,     // the just-painted organ (re-acquire embargo → the reticle hops onward)
  hopT: 0,
  paintCd: 0,        // cross-organ paint cooldown (PR4a): min gap between ANY two paints —
                     // the reticle still hops/aims instantly; only the pip conversion waits
  _atCap: false,     // edge-detect: the fuse starting = the dragon DRAWS BREATH (lockCap event)
  looseReq: false,   // V3 MANUAL LOOSE (PR3): a not-ready tap requested a volley; the
                     // state machine consumes it next step (releaseVolley needs ctx.phaseHp)
};

const _w = new THREE.Vector3();       // scratch for partWorldPos
const _hud = new THREE.Vector3();      // the published HUD world position

export function initLockLayer() {
  S.aimPart = null; S.aimDwell = 0; S.aimHeld = false; S.offT = 0;
  S.muted = false; S.hudPart = null; S.hasOrgan = false; S.fightRunning = false;
  S.anchorPart = null; S.ax = 0; S.ay = 0; S.az = 0;
  S.expTickT = 0; S.expTicks = 0; S.expActive = false; S._wasHeld = false;
  S.locks.length = 0; S.capFuseT = 0; S.refreshT = 0; S.lanceQ.length = 0;
  S.cap = 0; S.deflected = false;
  S.hopPart = null; S.hopT = 0; S.paintCd = 0;
  S.looseReq = false;
}

// Reset transient aim + paint state. SILENT by design for every reason
// ('transition'/'death'/'idle') — no lockLost spam on fight seams (audit R11);
// the loud loss feedback belongs to notifyHit alone.
export function clearLocks(_reason) {
  S.aimPart = null; S.aimDwell = 0; S.aimHeld = false; S.offT = 0;
  S.anchorPart = null;
  S.expTickT = 0; S.expTicks = 0; S.expActive = false; S._wasHeld = false;
  S.locks.length = 0; S.capFuseT = 0; S.refreshT = 0; S.lanceQ.length = 0;
  S.hopPart = null; S.hopT = 0; S.paintCd = 0;
  S.looseReq = false;
}

// NB — the danger-binding quiet-rate penalty (`quietDwellMult`, kills rest-beat
// cap-painting) is reserved for V2 PAINT-dwell (PR2), NOT V1 aim acquisition:
// halving the aim rate during a boss's calm opening made the slot-1 teach (VOIDMAW)
// nearly unlockable — you needed ~0.7s on a strafing eye. V1 acquisition is full
// rate; the quiet penalty applies where camping actually matters (painting locks).

// Nearest candidate organ whose RAW world position sits inside the ACQUIRE cone
// (player x/y vs the part's world x/y at the boss plane). Selection only — once a
// part is being tracked, all cone tests run against the SMOOTHED anchor instead.
function coneCandidate(player, ctx) {
  let best = null, bestD = Infinity;
  const px = player.position.x, py = player.position.y;
  for (const part of ctx.candidates) {
    const w = ctx.model.partWorldPos ? ctx.model.partWorldPos(part, _w) : null;
    if (!w) continue;
    const dx = Math.abs(px - w.x), dy = Math.abs(py - w.y);
    if (dx < L.coneXY && dy < L.coneXY) {
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = { part, wx: w.x, wy: w.y }; }
    }
  }
  return best;
}

function releaseAim() {
  S.aimPart = null; S.aimDwell = 0; S.aimHeld = false; S.offT = 0;
}

// PAINT-HOP (owner playtest): a completed paint RELEASES the aim line and embargoes
// the painted organ from re-acquisition for paintHopGrace, so the display's
// unpainted-first preference takes over next frame — the reticle visibly hops to
// the next target instead of pinning under the player. Hovering past the grace
// still re-acquires (deliberate refresh stays reachable).
function paintHop(part) {
  S.hopPart = part;
  S.hopT = L.paintHopGrace;
  releaseAim();
}

export function updateLockLayer(dt, player, ctx) {
  S.fightRunning = !!ctx.fightRunning;
  S.muted = !!ctx.muted;
  if (!S.fightRunning) { clearLocks('idle'); refreshHud(ctx, dt, player); return; }

  // Resolve + smooth the tracked/display organ FIRST: the anchor the reticle draws
  // this frame is the same point the cone logic tests (display == logic — the marker
  // the player chases IS the thing that locks).
  refreshHud(ctx, dt, player);
  const px = player.position.x, py = player.position.y;
  if (S.hopT > 0) { S.hopT -= dt; if (S.hopT <= 0) S.hopPart = null; }
  if (S.paintCd > 0) S.paintCd -= dt;

  // ---- V1 aim: acquire (tight cone) / hold (retention cone + drain) — L177 ----
  if (!S.aimPart) {
    // ACQUISITION — the tight cone prices exposure. The DISPLAYED organ's SMOOTHED
    // anchor is the primary target on EVERY boss (the marker the player chases IS
    // the thing that locks — a raw-position scan on a coiling rib knife-edges in
    // and out of the cone while the player is correctly on the smoothed marker,
    // the exact L177 failure re-introduced; owner playtest caught it on slot 4).
    let hit = null;
    const embargoed = (p) => p === S.hopPart && S.hopT > 0;
    if (S.hasOrgan && S.hudPart && !embargoed(S.hudPart) &&
        Math.abs(px - S.ax) < L.coneXY && Math.abs(py - S.ay) < L.coneXY) hit = S.hudPart;
    // Fallback: another candidate dead-on in the raw cone. UNPAINTED-FIRST LAW
    // (owner playtest: swinging back after a dodge re-grabbed the painted rib and
    // pinned the player on 'refresh'): while ANY unpainted paintable remains, a
    // painted organ never re-acquires — the reticle only hunts fresh prey until
    // the set is complete. Refresh becomes reachable again once all are painted.
    if (!hit && ctx.candidates && ctx.candidates.length > 1) {
      // While the HUNT is on (an unpainted paintable remains and cap room exists),
      // neither painted organs NOR the V1-only virtual anchor may steal the aim —
      // the skull hijacking the line mid-sweep was exactly the stuck-reticle bug.
      const capRoom = totalPips() < (ctx.cap || 0);
      const hunting = capRoom && ctx.paintables &&
        ctx.paintables.some((p) => !S.locks.some((lk) => lk.part === p));
      const acquirable = (p) => !hunting ||
        (ctx.paintables.includes(p) && !S.locks.some((lk) => lk.part === p));
      const cand = coneCandidate(player, ctx);
      if (cand && !embargoed(cand.part) && acquirable(cand.part)) hit = cand.part;
    }
    if (hit) {
      S.aimPart = hit;
      S.offT = 0;
      // The acquisition frame counts, at FULL rate (no quiet penalty on aiming — NB above).
      S.aimDwell = Math.min(dt, L.dwellTime);
    }
  } else {
    // TRACKING — once a dwell is accruing/held, the wider RETENTION cone applies,
    // tested against the smoothed anchor: tight to catch, forgiving to keep. A
    // strafing organ (VOIDMAW ±5m) or an idle-anim wobble no longer knife-edges
    // the dwell (L175's real failure — target MOTION, not dwell rate).
    const inRet = S.hasOrgan && S.anchorPart === S.aimPart &&
      Math.abs(px - S.ax) < L.retentionConeXY && Math.abs(py - S.ay) < L.retentionConeXY;
    if (inRet) {
      S.offT = 0;
      S.aimDwell = Math.min(S.aimDwell + dt, L.dwellTime);
    } else {
      S.offT += dt;
      if (S.aimHeld) {
        // Held: persist the lock (reticle + retarget) through linger, then revert.
        if (S.offT > L.linger) releaseAim();
      } else if (S.offT > L.coyote) {
        // Acquiring: freeze through coyote, then DRAIN — progress melts instead of
        // vanishing, so a swing-through keeps partial credit and the progress fill
        // teaches "catch it at the turn" without a word of text.
        S.aimDwell -= dt * L.dwellDrainMult;
        if (S.aimDwell <= 0) releaseAim();
      }
    }
  }
  if (S.aimPart && S.aimDwell >= L.dwellTime) S.aimHeld = true;

  // Lock-acquired edge (green snap): fire ONCE when a usable lock is achieved, so
  // ui/sfx can pop + chime. `held` = aimHeld, not muted, and not DEFLECTED — a
  // shielded boss voids the promise (chip pings zero, the mark won't take), so the
  // celebration is suppressed and re-fires the instant the shield breaks (owner
  // playtest: a bright green 'locked' on a sealed boss reads as a broken lock).
  const held = S.aimHeld && !S.muted && !ctx.deflected;
  const justLocked = held && !S._wasHeld;
  if (justLocked) emit('aimLock', { part: S.aimPart });
  S._wasHeld = held;

  // ---- V2 LANCE-PAINT (PR2) ----------------------------------------------------
  // Painting: the aimLock edge on a PAINTABLE organ paints a lock pip; staying held
  // re-dwells (refreshDwell) to refresh its decay (and stack at tier ≥3). Pips decay
  // (L.decay each) and auto-release as a homing lance volley at the band cap (after
  // the capFuse) or when the oldest expires with ≥1 painted — partial paints are
  // never silently lost. THE ONE DEFLECT RULE (audit B2/F2/B3): while ctx.deflected
  // (shield up / swarm scattered / eye closed / survival card) painting, decay, the
  // cap fuse, AND queued lance launches ALL pause together — no lance ever pings a
  // deflect state; pips freeze ashen and resume on the break.
  S.cap = ctx.cap || 0;
  S.deflected = !!ctx.deflected;
  const canPaint = ctx.paintUnlocked && S.cap > 0 && !ctx.deflected;
  const isPaintable = (part) => !!(part && ctx.paintables && ctx.paintables.includes(part)
    && !(ctx.amberVenting && ctx.amberVenting(part)));   // amber-carriers are dwell-exempt while venting (C3)
  if (canPaint && held && isPaintable(S.aimPart)) {
    const existing = S.locks.find((lk) => lk.part === S.aimPart);
    // PAINT COOLDOWN (PR4a, owner playtest "a bit spammy"): a slight cross-organ
    // gap between ANY two paints. Only pip CREATION waits — aim, the reticle hop,
    // and existing-pip refresh stay instant; a dwell completed inside the window
    // converts via the refresh clock the moment the cooldown clears.
    if (justLocked && !existing && totalPips() < S.cap && S.paintCd <= 0) {
      // The dwell that completed IS the first paint (one clock to learn).
      const part = S.aimPart;
      S.locks.push({ part, stacks: 1, age: 0 });
      emit('lockPaint', { part, count: totalPips() });
      S.refreshT = 0;
      S.paintCd = L.paintCooldown;
      paintHop(part);
    } else {
      // Held re-dwell (refreshDwell): refresh an existing pip's decay (and STACK at
      // tier ≥3, ≤ stackMax, stacks count toward the cap) — or paint a held organ
      // that couldn't take a pip at the lock instant (amber window just closed, or
      // a cap slot just freed): the held line converts as soon as it's allowed to.
      S.refreshT += dt;
      if (S.refreshT >= L.refreshDwell) {
        S.refreshT = 0;
        if (existing) {
          existing.age = 0;
          if ((ctx.tier ?? 1) >= 3 && existing.stacks < L.stackMax && totalPips() < S.cap) {
            existing.stacks++;
            emit('lockPaint', { part: S.aimPart, count: totalPips(), stacked: true });
          }
        } else if (totalPips() < S.cap && S.paintCd <= 0) {
          const part = S.aimPart;
          S.locks.push({ part, stacks: 1, age: 0 });
          emit('lockPaint', { part, count: totalPips() });
          S.paintCd = L.paintCooldown;
          paintHop(part);
        }
      }
    }
  } else {
    S.refreshT = 0;
  }
  // Resolve each painted lock's live world position — the in-world MARKER anchor:
  // a painted organ carries its own pinned marker with a draining fill, so the
  // player sees WHAT is locked, WHERE it is, and HOW LONG it holds (owner feedback:
  // one reticle can't carry three locks' worth of state).
  if (S.locks.length && ctx.model && ctx.model.partWorldPos) {
    for (const lk of S.locks) {
      const w = ctx.model.partWorldPos(lk.part, _w);
      if (w) { lk.x = w.x; lk.y = w.y; lk.z = w.z; }
    }
  }
  // Decay + cap fuse (both frozen while deflected). Reaching the cap fires the
  // one-shot 'lockCap' — the DRAWN BREATH: the fuse is diegetic (the dragon
  // inhales), so the sound/visual tell IS the timer the player reads.
  const atCap = S.cap > 0 && totalPips() >= S.cap;
  if (atCap && !S._atCap && !ctx.deflected) emit('lockCap', { count: totalPips() });
  S._atCap = atCap;
  if (S.locks.length && !ctx.deflected) {
    for (const lk of S.locks) lk.age += dt;
    if (S.locks[0].age >= L.decay) releaseVolley(ctx, 'decay');   // oldest first (push order)
    else if (atCap) {
      S.capFuseT += dt;
      if (S.capFuseT >= L.capFuse) releaseVolley(ctx, 'cap');
    } else S.capFuseT = 0;
  }
  // V3 MANUAL LOOSE (PR3): the player's DELIBERATE volley. A not-ready tap with pips
  // banked requests a loose (the ≥tapVolleyMinLocks floor is enforced at the boss tap
  // seam — stray single-pip taps stay a no-op, that's what auto-release is for). THE
  // ONE DEFLECT RULE still governs: loosing while sealed keeps every pip (never
  // silently wasted) and says so — the volley waits for the break, on the player's next
  // call. Processed here (not at the seam) so releaseVolley has the live ctx.phaseHp.
  if (S.looseReq) {
    S.looseReq = false;
    if (S.locks.length) {
      if (ctx.deflected) emit('lockSealed', { count: totalPips() });
      else releaseVolley(ctx, 'tap');
    }
  }
  // Staggered lance launches — held while deflected (queued to the break, never wasted).
  if (S.lanceQ.length && !ctx.deflected) {
    for (const q of S.lanceQ) q.t -= dt;
    while (S.lanceQ.length && S.lanceQ[0].t <= 0) {
      const q = S.lanceQ.shift();
      ctx.fireLance?.(q.part, q.dmg, q.i, q.n);   // (i, n) = the wisp's authored fan bearing
    }
  }

  // ---- V1 exposure ticks (the turn-taking payoff — legible from fight 1) ------
  // A held line during a post-string exposure window pays visible crack ticks,
  // capped at 3 per window. The window edge resets the counter.
  const inExposure = !!ctx.exposureWindow && !S.muted;
  if (inExposure && !S.expActive) { S.expTicks = 0; S.expTickT = 0; }
  S.expActive = inExposure;
  if (inExposure && S.aimHeld && !S.muted) {
    S.expTickT += dt;
    if (S.expTickT >= L.exposureTickInterval && S.expTicks < 3) {
      S.expTickT = 0; S.expTicks++;
      ctx.damageBoss?.(L.exposureTickDmg, 'lock', { part: S.aimPart, x: _hud.x, y: _hud.y });
      ctx.flashPart?.(S.aimPart);
      emit('lockTick', { part: S.aimPart });
    }
  }
}

// Resolve the organ the reticle should point at — the held/acquiring aim organ, else
// the primary candidate (candidates[0]) so the reticle shows WHERE to aim even before
// the line locks — and low-pass it into the SMOOTHED ANCHOR (S.ax/ay/az → _hud). The
// anchor snaps on a part change, then EMAs toward the raw position, so reticle, rider
// aim, and retention all track the organ's centre of motion, never its per-frame
// animation jitter (idle motion at ≥2 frequencies is a design LAW — §3.7).
function refreshHud(ctx, dt, player) {
  // Display target: the aim organ; else the NEAREST candidate to the player (the
  // reticle shows WHERE to aim — on a multi-organ boss that's the closest organ,
  // mirroring how the ring reticle always shows the next ring).
  let part = S.aimPart;
  if (!part && ctx.candidates) {
    if (ctx.candidates.length === 1) part = ctx.candidates[0];
    else if (ctx.candidates.length > 1 && ctx.model && ctx.model.partWorldPos && player) {
      // THE RETICLE HUNTS BRANDABLE PREY (owner playtest #3: the V1-only virtual
      // anchor — MARROWCOIL's skull — counted as 'unpainted' FOREVER, so returning
      // to centre parked the reticle on a face that can never take a pip: a green
      // lock, no paint, no hop — reads as stuck). Three preference classes:
      //   A — unpainted PAINTABLE while cap room remains (the hunt),
      //   B — any paintable (refresh, once the set is full/painted),
      //   C — the V1-only anchor last (bonus chip while the inhale burns).
      // A boss without paintables (VOIDMAW/STORMREND/ASHTALON) has only class C —
      // byte-identical to before.
      const capRoom = totalPips() < (ctx.cap || 0);
      const classOf = (c) => {
        const paintable = ctx.paintables && ctx.paintables.includes(c);
        if (!paintable) return 2;
        const painted = S.locks.some((lk) => lk.part === c);
        return (!painted && capRoom) ? 0 : 1;
      };
      let bestD = Infinity, bestClass = 3, curD = Infinity, curClass = 3;
      for (const c of ctx.candidates) {
        const w = ctx.model.partWorldPos(c, _w);
        if (!w) continue;
        const dx = w.x - player.position.x, dy = w.y - player.position.y;
        const d = dx * dx + dy * dy;
        const cl = classOf(c);
        if (c === S.hudPart) { curD = d; curClass = cl; }
        if (cl < bestClass || (cl === bestClass && d < bestD)) { bestClass = cl; bestD = d; part = c; }
      }
      // Hysteresis: keep the current displayed organ when it ties the winning CLASS
      // and isn't clearly further (coiling anatomy makes near-equidistant ribs swap
      // every frame — a flickering lead marker is unchaseable).
      if (S.hudPart && part !== S.hudPart && curClass === bestClass &&
          curD < Infinity && bestD > curD * 0.6) part = S.hudPart;
    } else part = ctx.candidates[0] || null;
  }
  S.hudPart = part;
  const w = part && ctx.model && ctx.model.partWorldPos ? ctx.model.partWorldPos(part, _w) : null;
  if (!w) { S.hasOrgan = false; return; }
  if (S.anchorPart !== part) {
    S.anchorPart = part;
    S.ax = w.x; S.ay = w.y; S.az = w.z;
  } else {
    const k = 1 - Math.exp(-(dt || 0.016) / L.anchorSmoothT);
    S.ax += (w.x - S.ax) * k;
    S.ay += (w.y - S.ay) * k;
    S.az += (w.z - S.az) * k;
  }
  _hud.set(S.ax, S.ay, S.az);
  S.hasOrgan = true;
}

// --- Published state ---------------------------------------------------------

// The reticle's second job (reticle.js): the organ world position + skin flags +
// the painted-pip row (count/cap/ashen/blink — decay legibility is FREE at rung 0,
// audit F9: the final-second blink is never ascension-gated).
export function lockHudState() {
  return {
    active: S.fightRunning && S.hasOrgan,
    muted: S.muted,
    aimHeld: S.aimHeld && !S.muted && !S.deflected,   // sealed → never shown green
    dwell: Math.max(0, Math.min(1, S.aimDwell / L.dwellTime)),  // 0..1 acquisition progress
    hasOrgan: S.hasOrgan,
    aimPart: S.hudPart,
    x: _hud.x, y: _hud.y, z: _hud.z,
    cap: S.cap,
    pips: totalPips(),
    ashen: S.deflected,
    blink: S.locks.length > 0 && !S.deflected && S.locks[0].age > L.decay - 1.0,
    fuse01: (S.cap > 0 && totalPips() >= S.cap && !S.deflected)
      ? Math.min(1, S.capFuseT / L.capFuse) : 0,   // the inhale: pips swell as the breath draws
    // Per-lock marker anchors: live world pos + remaining life (1 → fresh, 0 → gone).
    locks: S.locks.map((lk) => ({
      x: lk.x ?? 0, y: lk.y ?? 0, z: lk.z ?? 0,
      life: Math.max(0, 1 - lk.age / L.decay),
      stacks: lk.stacks,
      blink: !S.deflected && lk.age > L.decay - 1.0,
    })),
  };
}

// Rider retarget (boss.js fireRiderShot): the held aim organ's world x/y + tag, or
// null when no line is held or the organ is muted (no rate bonus, no retarget).
export function lockAimTarget() {
  if (!S.aimHeld || S.muted || !S.hasOrgan) return null;
  return { part: S.hudPart, x: _hud.x, y: _hud.y };
}
// Rider fire-rate bonus is active while an organ is held (and not muted).
export function lockAimHeld() { return S.aimHeld && !S.muted; }

function totalPips() {
  let n = 0;
  for (const lk of S.locks) n += lk.stacks;
  return n;
}

// Per-lance damage, HARD-CLAMPED so a volley can never exceed volleyRoiFrac of the
// current phase's hp (audit R1 — the clamp is enforced at release, not asserted in
// prose). Shared by the auto/manual volleys (releaseVolley) AND the PR3 Surge fork
// (boss.js), so every lance path clamps against the same law with one arithmetic.
export function lanceDmgEach(pips, phaseHp) {
  if (!pips) return 0;
  return Math.min(L.lanceDmg, (L.volleyRoiFrac * (phaseHp || Infinity)) / pips);
}

// Release every painted pip as a staggered homing-lance volley.
function releaseVolley(ctx, source) {
  const pips = totalPips();
  if (!pips) return;
  const dmgEach = lanceDmgEach(pips, ctx.phaseHp);
  let i = 0;
  for (const lk of S.locks) {
    for (let s = 0; s < lk.stacks; s++) {
      S.lanceQ.push({ part: lk.part, dmg: dmgEach, t: i * (L.lanceStaggerMs / 1000), i: i++, n: pips });
    }
  }
  emit('lockVolley', { count: pips, source, dmgEach });
  S.locks.length = 0;
  S.capFuseT = 0;
  S.refreshT = 0;
}

// A bullet hit strips locks — band-scaled (audit F8: full-strip from fight one
// quadruple-stacked punishment on the weakest players): newest pip only at tiers
// ≤ stripNewestMaxTier, everything at tiers above. The one LOUD loss path.
export function notifyHit(tier = 1) {
  if (!S.locks.length) return;
  if (tier <= L.stripNewestMaxTier) {
    const last = S.locks[S.locks.length - 1];
    if (last.stacks > 1) last.stacks--;
    else S.locks.pop();
  } else {
    S.locks.length = 0;
  }
  S.capFuseT = 0;
  emit('lockLost', { reason: 'hit' });
}

export function lockCount() { return totalPips(); }
export function paintFromParry(_part) { /* PR4 */ }
// PR3 (Surge fork): hand every painted pip to the unleash and clear — no volley here.
export function consumeAllLocks() {
  const out = S.locks.map((lk) => ({ part: lk.part, stacks: lk.stacks }));
  S.locks.length = 0; S.capFuseT = 0; S.refreshT = 0;
  return out;
}
// PR3 MANUAL LOOSE: a not-ready tap (boss.js tap seam) requests the deliberate volley.
// A flag, not an immediate release, so updateLockLayer processes it with the live ctx
// (phaseHp for the ROI clamp, deflected for the sealed-keep rule). Zero-latency by
// construction: the seam runs, then updateLockLayer runs, in the SAME fight frame.
export function requestLoose() { S.looseReq = true; }

// Test seam: the raw aim state (fabricated-ctx unit tests read this directly).
export function __lockDebug() {
  return { aimPart: S.aimPart, aimDwell: S.aimDwell, aimHeld: S.aimHeld, offT: S.offT,
    expTicks: S.expTicks, muted: S.muted, hasOrgan: S.hasOrgan };
}
// Test seam (PR3): bank pips directly so integration tests can exercise the Surge
// fork without flying a headless dwell. Not used by the game — like __lockDebug.
export function __testBank(parts) {
  for (const part of parts) S.locks.push({ part, stacks: 1, age: 0 });
  return totalPips();
}
