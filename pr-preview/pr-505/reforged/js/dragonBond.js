// dragonBond.js — EMBERSIGHT H7/H8 (HUD-REDESIGN.md §B.1/§B.2/§B.3 DRAGON rows):
// the bondChannel seam between the run's vitals and the dragon's living-gauge FX.
//
// This module is deliberately dumb: a plain per-frame state bag. main.js writes
// it (setVitals / setSurge, next to the gauntletFollow projection), ui.js flips
// the enable (the DRAGON VITALS settings toggle → setDragonVitalsEnabled), and
// dragon.js reads it inside the EXISTING updateDragon material pass — no second
// rAF, no THREE import, no DOM.
//
// THE HARD CONTRACT (H7 gate): when the toggle is OFF this channel is a no-op —
// dragon.js's bond section contributes exactly ×1 / +0 to every shipped write
// and creates no objects, so the dragon renders byte-identical to the shipped
// game (proven by tools tricount + the off-proof harness; see the H7 lesson).
//
// `?vitals=1` remains as a dev alias for capture harnesses; the settings toggle
// (saveData.settings.dragonVitals, default OFF) is the real control.

// URL alias — parsed once, guarded exactly like dragon.js's ?wingDebug (tests
// import this module in node where `location` is undefined).
const VITALS_URL = (typeof location !== 'undefined' && location.search)
  ? new URLSearchParams(location.search).get('vitals') === '1' : false;

let enabled = VITALS_URL;

// Per-frame vitals (H7). `active` gates the whole layer to live flight so the
// hub/shop/recap dragon never wears run-state glow.
const vitals = {
  active: false,
  health: 100, healthMax: 100,
  stamina: 110, staminaMax: 110,
  boosting: false,
  sealed: false,       // boss boost-seal → wings bank to dim coals (§B.2)
};

// Per-frame surge/combo state (H8). lit/max mirror the DOM gem row
// (consecutiveRings vs feverThreshold); comboT is the 0..1 combo tier that
// drives the trail-as-combo tint (lerp cap 0.5 lives in dragon.js).
const surge = { lit: 0, max: 5, fever: false, comboT: 0 };

// The settings toggle (ui.js applyAccessibility). The URL alias always wins ON.
export function setDragonVitalsEnabled(on) { enabled = !!on || VITALS_URL; }
export function dragonVitalsEnabled() { return enabled; }
export function vitalsUrlForced() { return VITALS_URL; }

// Called per-frame from main.js's HUD section. Partial writes are fine.
export function setVitals(v) {
  if (!v) return;
  if (v.active !== undefined) vitals.active = !!v.active;
  if (v.health !== undefined) vitals.health = v.health;
  if (v.healthMax !== undefined) vitals.healthMax = v.healthMax;
  if (v.stamina !== undefined) vitals.stamina = v.stamina;
  if (v.staminaMax !== undefined) vitals.staminaMax = v.staminaMax;
  if (v.boosting !== undefined) vitals.boosting = !!v.boosting;
  if (v.sealed !== undefined) vitals.sealed = !!v.sealed;
}

// H8: chained-ring surge + combo tier, same cadence and caller as setVitals.
export function setSurge(s) {
  if (!s) return;
  if (s.lit !== undefined) surge.lit = s.lit;
  if (s.max !== undefined) surge.max = Math.max(1, s.max);
  if (s.fever !== undefined) surge.fever = !!s.fever;
  if (s.comboT !== undefined) surge.comboT = Math.max(0, Math.min(1, s.comboT));
}

// dragon.js's single read per frame.
export function bondState() {
  return { enabled, vitals, surge };
}
