// hudState.js — EMBERSIGHT H1 (HUD-REDESIGN.md §A Law 4): the HUD state machine
// + relevance system. One tiny module owns the classification:
//
//   body classes   hud-cruise / hud-combat / hud-boss   (the state machine)
//   element class  .rest                                (the relevance table's
//                  ghost state — CSS declares what "rest" means per element)
//   element class  .hud-flash                           (the ≤150ms return pulse
//                  on a value change — damage/heal/earn)
//
// Contract (Law 4 + risk #14): the ghost-onset clocks tick at ≤4Hz (a time
// accumulator riding the existing ui.update call — never a new rAF), classes
// are written ONLY on change, and the immediate-return paths (damage, heal,
// earn) are edge-triggered so an element is back at full alpha in ≤150ms —
// they never wait for the ticker. CSS owns all appearance; this module only
// speaks in classes. JS never sets styles here (§F).
//
// Player overrides (§F): SCOREKEEPER pins score+distance (body.hud-scorekeeper
// defeats the ghost selectors); IMMERSIVE HUD (H3) hides all but the safety
// floor (body.hud-immersive; LIFE-at-critical rides body.hud-critical).
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { saveData } from './save.js';
import { on } from './events.js';

const TICK_MS = 250;              // ≤4Hz relevance ticker
const COMBAT_LINGER_MS = 4000;    // recent scoring event keeps hud-combat alive
const HEARTS_REST_MS = 3000;      // full health → hearts hide after 3s
const SCORE_REST_MS = 4000;       // no earn for 4s → score ghosts to 0.30
const STAM_REST_MS = 2000;        // full + idle 2s → arc ghosts

let els = null;                   // { hearts, score, staminaArc, surge, tally }
let lastTickAt = 0;

// Activity clocks (performance.now() ms). -Infinity = never.
let combatAt = -Infinity;
let earnAt = -Infinity;
let healthAt = -Infinity;
let stamActiveAt = -Infinity;
let prevHealth = null;
let prevStamLow = false;

// Applied-class cache: every DOM write is guarded by one of these.
const applied = {
  mode: '',            // '' | 'cruise' | 'combat' | 'boss'
  heartsRest: false,
  scoreRest: false,
  stamRest: false,
  surgeRest: false,
  scorekeeper: false,
  immersive: false,
  critical: false,
};

function setRest(el, key, rest) {
  if (!el || applied[key] === rest) return;
  applied[key] = rest;
  el.classList.toggle('rest', rest);
}

// The ≤150ms return pulse: un-rest immediately + a one-shot spring pop.
function flash(el, key) {
  if (!el) return;
  setRest(el, key, false);
  el.classList.remove('hud-flash');
  void el.offsetWidth;              // restart the one-shot
  el.classList.add('hud-flash');
}

function setMode(mode) {
  if (applied.mode === mode) return;
  const b = document.body;
  if (!b) return;
  b.classList.remove('hud-cruise', 'hud-combat', 'hud-boss');
  if (mode) b.classList.add(`hud-${mode}`);
  applied.mode = mode;
}

function setBodyFlag(cls, key, onFlag) {
  if (applied[key] === onFlag) return;
  applied[key] = onFlag;
  document.body && document.body.classList.toggle(cls, onFlag);
}

// Public poke: gameplay code (or ui.js's change detection) names an activity.
// 'combat' = any scoring/danger event; 'earn' = score gained meaningfully.
export function hudPoke(kind) {
  const now = performance.now();
  if (kind === 'earn') {
    earnAt = now;
    combatAt = now;
    if (els) setRest(els.score, 'scoreRest', false);
  } else {
    combatAt = now;
  }
}

export function initHudState(root) {
  els = {
    hearts: root.querySelector('#health-hearts'),
    score: root.querySelector('#score'),
    staminaArc: root.querySelector('#stamina-arc'),
    surge: root.querySelector('#surge-widget'),
  };
  prevHealth = game.health;

  // Every scoring/danger beat is combat activity; earns also pin the score.
  for (const ev of ['ring', 'gate', 'nearMiss', 'roll', 'phase', 'bossGraze', 'ember', 'goldEmber', 'orb', 'surge']) {
    on(ev, () => hudPoke('earn'));
  }
  on('damage', () => {
    const now = performance.now();
    combatAt = now;
    healthAt = now;
    flash(els.hearts, 'heartsRest');
  });
  on('runStart', () => {
    combatAt = earnAt = healthAt = stamActiveAt = -Infinity;
    prevHealth = game.health;
    setMode('cruise');
  });
}

// Called from ui.update (already per-frame while playing). Edge detection is
// cheap number compares per frame; DOM writes happen only on change, and the
// slow ghost-onset clocks only advance on the 4Hz tick.
export function updateHudState(player) {
  if (!els) return;
  const now = performance.now();

  // -- per-frame edges (immediate ≤150ms returns) --
  if (game.health !== prevHealth) {          // damage is event-driven above;
    if (game.health > prevHealth) {          // heals (revive) return here
      healthAt = now;
      flash(els.hearts, 'heartsRest');
    }
    prevHealth = game.health;
  }
  const stamLow = player.boosting || game.stamina < CONFIG.staminaMax - 0.25;
  if (stamLow) {
    stamActiveAt = now;
    if (prevStamLow !== stamLow) setRest(els.staminaArc, 'stamRest', false);
  }
  prevStamLow = stamLow;

  // -- the ≤4Hz ticker: mode classification + ghost-onset clocks --
  if (now - lastTickAt < TICK_MS) return;
  lastTickAt = now;

  const chainLive = game.consecutiveRings >= 2 || game.combo > 1.001 || game.feverActive;
  const mode = game.inBoss ? 'boss'
    : (chainLive || now - combatAt < COMBAT_LINGER_MS) ? 'combat'
    : 'cruise';
  setMode(mode);

  const fullHealth = game.health >= CONFIG.healthMax - 0.01;
  setRest(els.hearts, 'heartsRest', fullHealth && now - healthAt > HEARTS_REST_MS);

  setRest(els.score, 'scoreRest', now - earnAt > SCORE_REST_MS);

  setRest(els.staminaArc, 'stamRest', !stamLow && now - stamActiveAt > STAM_REST_MS);

  // Surge gems ghost at 0.30 unless near-full (≥ threshold−1 lit) or fever.
  const lit = Math.min(game.consecutiveRings, game.feverThreshold);
  const surgeLive = game.feverActive || lit >= game.feverThreshold - 1;
  setRest(els.surge, 'surgeRest', !surgeLive);

  // §F player overrides ride the same tick (cheap; class writes are cached).
  setBodyFlag('hud-scorekeeper', 'scorekeeper', !!saveData.settings.scorekeeper);
  setBodyFlag('hud-immersive', 'immersive', !!saveData.settings.immersiveHud);
  // Critical = last heart (safety floor for IMMERSIVE + the H3 VIGIL hook).
  setBodyFlag('hud-critical', 'critical',
    game.health > 0 && game.health <= CONFIG.obstacleDamage + 0.01);
}

// Test/debug introspection (read-only snapshot).
export function hudStateSnapshot() {
  return { ...applied };
}
