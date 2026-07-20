// DRIFT — the always-on momentum currency (DRIFT-BUILD-PLAN.md; parent FLOW-OVERHAUL-PLAN.md).
// One meter, everywhere: fed listener-side off the event bus (zero emitter edits), expressed
// as a SECOND factor in the exact canyonSlip co-scale chain (speed × steer × assist ÷ — see
// player.js), so every reachability ratio stays valid by construction.
//
// The §2 ruling (2026-07-18, "the middle path"): structurally REPLACE — one currency — with
// the FLOW canyon as the OVERDRIVE ZONE: inside it the same meter drives the canyonSlip
// target up to the old ~1.30 ceiling, and a missed gate costs a LARGE chunk (severity
// replaces the wipe-to-zero). Outside, the base factor caps at ×1.15 under the governor
// (DRIFT contributes nothing above 130 m/s — consumption-side only, geometry untouched).
// A boss is the DIFFERENT-EXPRESSION zone: bleed pauses, the meter is fed by fight verbs
// (parry/card/mechanic/graze — §4a governors baked in: F2 pays NOTHING for Surge reflects,
// F1/F2 carry per-encounter caps), and it expresses as faster Surge charge (M2, with the
// in-boss D clamp) instead of world speed. M1 (faster rider chip) is deliberately ABSENT —
// A/B-gated on the lockdps sim per the plan.
//
// Flag-gated: CONFIG.DRIFT.enabled or ?drift=1. OFF = this module is inert (subscribers
// no-op, factor 1, perfect radius = shipped) and the roster is byte-identical.

import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { on } from './events.js';

const _params = (typeof window !== 'undefined' && window.location)
  ? new URLSearchParams(window.location.search) : new URLSearchParams();
const FORCED = _params.get('drift') === '1';

export function driftEnabled() {
  return FORCED || CONFIG.DRIFT.enabled;
}

// ---- state ------------------------------------------------------------------
let D = 0;                    // the meter, 0..1
let lastTotalFactor = 1;      // canyonSlip × driftFactor as last applied (perfect-radius ease)
// per-encounter caps (§4a): reset on bossStart
let encParry = 0, encGraze = 0;
// gauntlet clean-run window
let inGauntlet = false, gauntletClean = true;

export function driftValue() { return D; }
export function resetDrift() { D = 0; encParry = 0; encGraze = 0; inGauntlet = false; }

function add(x) { if (driftEnabled()) D = Math.min(1, D + x); }
function dent(x) { if (driftEnabled()) D = Math.max(0, D - x); }  // a drop, never a scripted zero

// ---- expression -------------------------------------------------------------

// The open-sky speed factor. 1 inside canyons (overdrive expresses through the
// canyonSlip target instead — never stacked) and inside bosses (speed is locked).
// Governor: DRIFT contributes nothing above governorSpeed — honest invariant; the
// shipped spine/orb stack may already exceed it (config.js:182 vs the stale comment).
export function driftSpeedFactor(player) {
  const C = CONFIG.DRIFT;
  if (!driftEnabled() || game.inBoss || game.inCanyon) return 1;
  const f = 1 + C.capBase * D;
  const governor = Math.max(1, C.governorSpeed / Math.max(player.speed, 1));
  return Math.min(f, governor);
}

// The overdrive slip target for the FLOW canyon (§2): the same meter, hotter ceiling.
// Returns null when drift is off → player.js falls back to the shipped flowChain slip.
export function driftOverdriveSlip() {
  if (!driftEnabled()) return null;
  return 1 + CONFIG.DRIFT.capCanyon * D;
}

// M2 — Surge charges faster at high DRIFT, with the in-boss D clamp (§4a: never on an
// ungoverned recharge; the clamp substitutes for the fever refractory in the hero build).
export function driftGrazeMult() {
  const C = CONFIG.DRIFT;
  if (!driftEnabled()) return 1;
  return 1 + C.boss.grazeChargeBoost * Math.min(D, C.boss.grazeChargeDClamp);
}

// §3.3 — perfect radius half-compensates with the co-scaled factor only (F_total =
// canyonSlip × driftFactor; ramp/winds/orb are priced into lineDesignSpeed already).
// Never below the shipped 1.4; catch radius itself is FROZEN (the glass is a contract).
export function driftPerfectRadius() {
  const base = CONFIG.ringCenterRadius;
  if (!driftEnabled()) return base;
  return base * (1 + CONFIG.DRIFT.perfectEase * Math.max(0, lastTotalFactor - 1));
}

// ---- update -----------------------------------------------------------------

export function updateDrift(dt, player) {
  if (!driftEnabled()) return;
  // Bleed: a slow savings-account drain — PAUSED in a boss (the fight amplifies or
  // dents, never siphons). Runs in canyons: the chain feeds outpace it by design.
  if (game.state === 'playing' && !game.inBoss) {
    D = Math.max(0, D - CONFIG.DRIFT.bleedPerSec * dt);
  }
  lastTotalFactor = (player.canyonSlip || 1) * (player.driftFactor || 1);
}

// ---- feeds (subscribe once from main) ---------------------------------------

let inited = false;
export function initDrift() {
  if (inited) return;
  inited = true;
  const C = () => CONFIG.DRIFT;

  // Run lifecycle
  on('runStart', () => resetDrift());

  // Open-sky ride feeds
  on('ring', (p) => add(p && p.perfect ? C().feed.ringPerfect : C().feed.ring));
  on('gate', () => add(C().feed.gate));
  on('orb', () => add(C().feed.orb));
  on('goldEmber', () => add(C().feed.goldEmber));
  on('roll', () => add(C().feed.roll));
  on('nearMiss', () => add(C().feed.nearMiss));

  // The overdrive zone (flow canyon): chain events build; drops and misses are
  // SEVERITY dents (§2 — a big chunk, never the old wipe).
  on('flowChain', () => add(C().feed.flowChain));
  on('flowChainDrop', () => dent(C().dent.flowDrop));
  on('ringMiss', () => {
    const overdrive = game.inCanyon && game.canyonRun === 'flow';
    dent(overdrive ? C().dent.ringMissOverdrive : C().dent.ringMiss);
  });

  // Damage: a dent, never a zero (death resets via runStart).
  on('damage', () => dent(game.inBoss ? C().dent.bossHit : C().dent.damage));

  // Boss feeds (§4/§4a). Encounter caps reset on bossStart.
  on('bossStart', () => { encParry = 0; encGraze = 0; });
  on('bossReflect', () => {
    // §4a governor: F2 pays NOTHING for Surge reflects — a Surge parry is the
    // all-reflectable volume swat (fever IS Surge), and paying it would subsidise
    // the reflect melt. Amber parries outside fever are the skill payout.
    if (game.feverActive) return;
    if (encParry >= C().boss.parryCap) return;
    encParry += C().boss.parry; add(C().boss.parry);
  });
  on('bossRiposte', () => {
    if (game.feverActive) return;
    if (encParry >= C().boss.parryCap) return;
    encParry += C().boss.riposte; add(C().boss.riposte);
  });
  on('bossCard', (p) => { if (p && p.captured) add(C().boss.card); });
  for (const ev of ['slipGraze', 'orbitLap', 'gapThread', 'discPocket', 'beamGraze']) {
    on(ev, () => add(C().boss.mechanic));
  }
  on('bossGraze', () => {
    // F1 — tiny per-graze feed under a hard per-encounter cap (bait-rings graze
    // wholesale by design, so the cap is a before-first-ship requirement).
    if (encGraze >= C().boss.grazeCap) return;
    encGraze += C().boss.graze; add(C().boss.graze);
  });
  on('bossDefeated', () => add(C().boss.defeat));

  // Gauntlet clean-run capstone: gauntletCleared fires regardless of damage, so
  // the listener windows a damage-free span itself.
  on('gauntletStart', () => { inGauntlet = true; gauntletClean = true; });
  on('damage', () => { if (inGauntlet) gauntletClean = false; });
  on('gauntletCleared', () => {
    if (inGauntlet && gauntletClean) add(C().gauntletClean);
    inGauntlet = false;
  });
}
