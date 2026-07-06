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
  aimDwell: 0,       // continuous in-cone time accrued toward dwellTime (rate-scaled)
  aimHeld: false,    // dwell completed → the line is locked on the organ
  offT: 0,           // time since the line last sat in the cone (coyote / linger clock)
  muted: false,      // def.lockMuted — reticle ashen, no V1 rate bonus (slot 13)
  hudPart: null,     // the organ the reticle should point at (aim organ, else primary)
  hasOrgan: false,   // hudPart resolved to a live world position this frame
  fightRunning: false,
  expTickT: 0,       // exposure-window tick clock
  expTicks: 0,       // ticks paid in the current exposure window (cap 3)
  expActive: false,  // were we inside an exposure window last frame (edge detect)
  _wasHeld: false,   // edge-detect for the aimLock (green snap) event
  // PR2+ (inert in PR1)
  locks: [],
};

const _w = new THREE.Vector3();       // scratch for partWorldPos
const _hud = new THREE.Vector3();      // the published HUD world position

export function initLockLayer() {
  S.aimPart = null; S.aimDwell = 0; S.aimHeld = false; S.offT = 0;
  S.muted = false; S.hudPart = null; S.hasOrgan = false; S.fightRunning = false;
  S.expTickT = 0; S.expTicks = 0; S.expActive = false; S._wasHeld = false;
  S.locks.length = 0;
}

// Reset transient aim state (locks are cleared here too once they exist — PR2).
// 'transition'/'death' are silent for the lock layer (no lockLost spam — audit).
export function clearLocks(_reason) {
  S.aimPart = null; S.aimDwell = 0; S.aimHeld = false; S.offT = 0;
  S.expTickT = 0; S.expTicks = 0; S.expActive = false; S._wasHeld = false;
  S.locks.length = 0;
}

// Dwell accrues at full rate only while boss fire is live; authored quiet halves it
// (danger-binding law — kills rest-beat cap-painting). §II.3 quietDwellMult.
function dwellRate(ctx) { return ctx.emittersLive ? 1 : L.quietDwellMult; }

// Nearest candidate organ whose world position sits inside the aim cone (player x/y
// vs the part's world x/y at the boss plane). Returns { part, wx, wy } or null.
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

export function updateLockLayer(dt, player, ctx) {
  S.fightRunning = !!ctx.fightRunning;
  S.muted = !!ctx.muted;
  if (!S.fightRunning) { clearLocks('idle'); refreshHud(ctx); return; }

  // ---- V1 aim acquisition ----------------------------------------------------
  const cand = coneCandidate(player, ctx);
  if (cand) {
    S.offT = 0;
    // Switching to a different organ restarts the dwell (coyote only forgives a
    // flicker on the SAME line, not a target change).
    if (cand.part !== S.aimPart) { S.aimPart = cand.part; S.aimDwell = 0; S.aimHeld = false; }
    // Time-in-cone accrues from the first in-cone frame (the acquisition frame counts).
    S.aimDwell = Math.min(S.aimDwell + dt * dwellRate(ctx), L.dwellTime);
  } else {
    // Line left the cone this frame.
    S.offT += dt;
    if (!S.aimHeld) {
      // Still acquiring: tolerate a flicker up to coyote, then reset the dwell.
      if (S.offT > L.coyote) { S.aimDwell = 0; S.aimPart = null; }
    } else {
      // Already held: persist the lock (reticle + retarget) through linger, then revert.
      if (S.offT > L.linger) { S.aimHeld = false; S.aimPart = null; S.aimDwell = 0; }
    }
  }
  if (S.aimPart && S.aimDwell >= L.dwellTime) S.aimHeld = true;

  refreshHud(ctx);

  // Lock-acquired edge (green snap): fire ONCE when a usable lock is achieved, so
  // ui/sfx can pop + chime. `held` = aimHeld and not muted (a muted organ can't lock).
  const held = S.aimHeld && !S.muted;
  if (held && !S._wasHeld) emit('aimLock', { part: S.aimPart });
  S._wasHeld = held;

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

// Resolve the organ the reticle should point at: the held/acquiring aim organ, else
// the primary candidate (candidates[0]) so the reticle shows WHERE to aim even before
// the line locks (mirrors how the ring reticle shows the next ring).
function refreshHud(ctx) {
  const part = S.aimPart || (ctx.candidates && ctx.candidates[0]) || null;
  S.hudPart = part;
  const w = part && ctx.model && ctx.model.partWorldPos ? ctx.model.partWorldPos(part, _hud) : null;
  S.hasOrgan = !!w;
}

// --- Published state ---------------------------------------------------------

// The reticle's second job (reticle.js): the organ world position + skin flags.
export function lockHudState() {
  return {
    active: S.fightRunning && S.hasOrgan,
    muted: S.muted,
    aimHeld: S.aimHeld && !S.muted,
    dwell: Math.max(0, Math.min(1, S.aimDwell / L.dwellTime)),  // 0..1 acquisition progress
    hasOrgan: S.hasOrgan,
    aimPart: S.hudPart,
    x: _hud.x, y: _hud.y, z: _hud.z,
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

// PR2+ API — present and inert in PR1 so boss.js seams reference a stable surface.
export function lockCount() { return S.locks.length; }
export function paintFromParry(_part) { /* PR4 */ }
export function consumeAllLocks() { const out = S.locks.slice(); S.locks.length = 0; return out; }
export function notifyHit() { /* PR2 */ }

// Test seam: the raw aim state (fabricated-ctx unit tests read this directly).
export function __lockDebug() {
  return { aimPart: S.aimPart, aimDwell: S.aimDwell, aimHeld: S.aimHeld, offT: S.offT,
    expTicks: S.expTicks, muted: S.muted, hasOrgan: S.hasOrgan };
}
