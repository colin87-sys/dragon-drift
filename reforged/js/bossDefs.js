// Boss definitions — data, not code. A boss is hp + a procedural model recipe +
// an ordered list of phases, each with its own attack set and fire cadence. The
// controller (boss.js) resolves attack ids to bullet patterns, so adding a boss
// is (mostly) authoring a new entry here. Tuning numbers default from CONFIG.BOSS.
//
// Phase `atFrac` is the hp fraction at which that phase BEGINS (1.0 = full hp).
// `attacks` are pattern ids understood by boss.js:
//   aimed  — three bullets near your position (precision sidestep, REFLECTABLE)
//   fan    — a wide spread across the lane (find the gap, REFLECTABLE)
//   spiral — an instant radial burst that flies outward
//   tunnel — a succession of bullet-rings rushing at you; weave the moving centre
//   spiralStream — a rotating emitter, arms sweeping around (read the spin)
//   curtain — a full 2D wall minus one safe lane placed away from you (commit early)
//   movingGap — timed wall rows whose gap slides sideways (track it in time)
//   iris — contracting rings; the safe zone shrinks to the centre (the showpiece)
//   stream — a tracking hose re-aiming at your live position (peel away in an arc)
//   secondWave — a spread, then a half-gap-offset spread where you dodged to
//   crossfire — two flanking emitters converge aimed spreads (REFLECTABLE)
// Pattern JOBS (danmaku design): fills deny the plane (camp-proof), anti-flee
// punishes a single relocation, garnish layers aimed shots on a structure.
// Difficulty escalates by unlocking streamed patterns + tightening cadence —
// never by raw bullet count (mobile visibleCap; density reads as unfair).
// `accent`/`glow` colour the boss BODY; `bulletColor` is the magenta danger colour.
// `constrictPhase`: phase index at which the arena walls slam in (showpiece).
//
// `tier` (1–5, REQUIRED): the band this boss sits in (BOSS-DESIGN.md §5b/§5g) —
// tests/boss.mjs keys the tri/draw ceilings off it (TIER_BUDGETS). Sentinels=1,
// Colossi=2, Calamities=3, World-Enders=4, the Apex=5.
//
// SPELL CARDS (§5f/§5h): `cards[]` names each phase as a title-carded set-piece,
// aligned 1:1 with `phases` (card[i] ↔ phase[i]). A card =
//   { id (stable, never the display name), name, atFrac (= its phase's),
//     timer (~20–30s capture window), dread? (exactly ONE, always last),
//     survival? (invincible seal — timeout snaps hp past atFrac) }.
// Naming grammar (§5f): "<FRAGMENT OF THE EPITHET> — <plain pattern name>".
// Capture = survive the card hitless; ledgered per-card (local-only, save.js).
// A def WITHOUT `cards` keeps the un-carded phase behaviour (coexist rule).
//
// RHYTHM SIGNATURES (§5i): `rhythm = { signature, ticket?, phases:[…] }` gives a
// boss a DISTINCT temporal fingerprint (the ping-pong fix). The bossRhythm.js
// phrase machine reads it at the cadence seam — replacing the flat uniform roll.
// A def WITHOUT `rhythm` keeps the legacy uniform `cadence` roll (coexist).
// Schema (staged canonical, #211): each `phases[i]` (indexed to `phases` above)
// authors a `phrase` — an ordered list of MEASURES the machine walks and repeats:
//   { kind: 'sustain', attack, beats, gap }   a stream: `beats` shots, `gap` between
//   { kind: 'burst',   attack, count, gap }   a wall slam: `count` shots, tight `gap`
// `gap` is a scalar or a [lo,hi] range (uniform). Between phrase repeats the machine
// rests `restLo..restHi` by `restDist` ('uniform' | 'bimodal' lo-or-hi | 'decaying'
// hi→lo ramp = a crescendo/tightening). `ticket:{bpm,quantize}` snaps to the beat
// grid via getBeatClock() when music is live. `signature` (the §5i taxonomy name:
// 'metronome' | 'crescendo' | 'ambush-rest' | 'burst-sustain' | 'call-response')
// tags the fingerprint for review; `ratioBurst` documents the wall-burst share.
// The machine owns the AMBER FLOOR: if a phrase runs a rolling 12s window with no
// amber-carrier volley, the next shot is swapped to an amber-carrier drawn from the
// phase `attacks` (the parry-diet fairness subsidy). The `rhythmprint` CI gate
// (tests/boss.mjs) asserts any two bosses' gap distributions differ by a KS floor;
// `amberdiet` asserts the amber floor holds.

import { voidmaw } from './bossDefs/voidmaw.js';
import { stormrend } from './bossDefs/stormrend.js';
import { craghold } from './bossDefs/craghold.js';
import { ashtalon } from './bossDefs/ashtalon.js';
import { marrowcoil } from './bossDefs/marrowcoil.js';
import { eitherwing } from './bossDefs/eitherwing.js';
import { hollowgate } from './bossDefs/hollowgate.js';
import { brineholm } from './bossDefs/brineholm.js';
import { thrumswarm } from './bossDefs/thrumswarm.js';
import { weftwitch } from './bossDefs/weftwitch.js';
import { knellgrave } from './bossDefs/knellgrave.js';
import { karnvow } from './bossDefs/karnvow.js';
import { embertide } from './bossDefs/embertide.js';
import { onewing } from './bossDefs/onewing.js';
import { unmasked } from './bossDefs/unmasked.js';

// (comments carried over from the old inline BOSSES object)
  // ── BOSS 12 — ONEWING, "the Half That Would Not Die" (registry slot 12) ────────
  // EITHERWING's grief-stricken survivor, returned colossal and LOPSIDED, carrying
  // its dead twin's kite-frame fused to its chest (§5b/§5d slot 12, the WORLD-ENDERS
  // rival-return payoff). One vast 8-blade wing vs one atrophied 2-blade stub, a
  // permanent ~12° list. Its band-break is the ARRIVAL GRAMMAR (no warning until it
  // erupts, `noWarn`) plus the roster's ONE lying FELLED card (the health-bar lie —
  // wired in CP2, def-gated so no other boss may ever opt in).
  // ── slot 14 — THE UNMASKED — the APEX / FINALE (BOSS-DESIGN.md §5b row 14, §5c
  // APEX contract). The second sun that cracks into a biblically-accurate angel:
  // 3 STAGES that dissolve-swap between sub-rigs (STAGE 1 second-sun/eclipse-eye →
  // STAGE 2 Ophanim wheels-of-eyes → STAGE 3 the unveiling). Builder: bossUnmasked.js
  // (archetype 'unmasked'). STAGED BUILD: the builder renders STAGE 1 first; stages
  // 2/3, THE MEDLEY (real card-quoting by stable id), STAR PIPS, the destructible
  // relics, the verb-shift surge-chase, and the second-sun landmark + handoff() are
  // CP2 integration (after every stage is owner-signed-off). This def is valid + inert
  // now: phases/cards/rhythm below are a schema-valid PLACEHOLDER medley (existing
  // attack ids only, zero new) that CP2 replaces with the real roster quote.

export const BOSSES = {
  voidmaw,
  stormrend,
  craghold,
  ashtalon,
  marrowcoil,
  eitherwing,
  hollowgate,
  brineholm,
  thrumswarm,
  weftwitch,
  knellgrave,
  karnvow,
  embertide,
  onewing,
  unmasked,
};

// Registry slot 3 is ASHTALON (Colossi opener), slot 4 is MARROWCOIL, slot 5 is
// EITHERWING (the Colossi peak, the roster's only twin body), slot 6 is HOLLOWGATE
// (the Calamities opener), slot 7 is THRUMSWARM (the swarm); slot 8 is BRINEHOLM
// (a Calamity — the bound deep-sea leviathan head). CRAGHOLD is RETIRED (§5b L130)
// — its def + builder stay for the geometry-lesson lineage + its telegraph test,
// but it is OUT of the encounter rotation.
export const BOSS_ORDER = ['voidmaw', 'stormrend', 'ashtalon', 'marrowcoil', 'eitherwing', 'hollowgate', 'thrumswarm', 'brineholm', 'karnvow', 'knellgrave', 'weftwitch', 'onewing', 'embertide', 'unmasked'];

// Which boss to use for the Nth encounter of a run (cycles once the list is
// exhausted — more bosses just extend the list). LEGACY path: kept for the
// ?bossIdx debug override, forceBoss, and the test seams; live encounter
// selection now goes through the LIFETIME LADDER below (§5h, lands with slot 6).
export function bossDefForIndex(i) {
  const key = BOSS_ORDER[i % BOSS_ORDER.length];
  return BOSSES[key];
}

// ---- THE LIFETIME LADDER (§5h owner decision 1 — the band-aware progression
// controller that replaces the modulo; the hard blocker for Tier-3
// foreshadowing). Pure function of (what's been felled this run, lifetime
// kills per boss) so tests can drive it headlessly:
//   · a run's FIRST boss = the LOWEST lifetime-unbeaten slot,
//   · the ladder then walks UP the roster in slot order,
//   · wrapping past the top brings BEATEN slots back (they recur — the caller
//     tightens their dials via ladderTighten),
//   · a slot felled THIS RUN never repeats within the run; if every slot has
//     been felled this run (a full lap), the exclusion resets and the ladder
//     laps again from the bottom.
// `kills(id)` → lifetime kill count (save.js bossLedger). Returns the def.
export function ladderPickDef(felledThisRun, kills, fromSlot = null) {
  const n = BOSS_ORDER.length;
  const excluded = (id) => felledThisRun.has(id);
  // Full lap → reset the exclusion (the run out-lived the roster).
  const allFelled = BOSS_ORDER.every(excluded);
  const isOut = allFelled ? () => false : excluded;
  // The run's entry rung: the lowest lifetime-unbeaten slot (or 0 if all beaten).
  let start = fromSlot;
  if (start == null) {
    start = BOSS_ORDER.findIndex((id) => (kills(id) || 0) === 0);
    if (start < 0) start = 0;
  }
  for (let k = 0; k < n; k++) {
    const id = BOSS_ORDER[(start + k) % n];
    if (!isOut(id)) return BOSSES[id];
  }
  return BOSSES[BOSS_ORDER[0]];   // unreachable (isOut is never all-true)
}

// Tightened dials for a RECURRING (lifetime-beaten) slot: a cadence/rest
// multiplier that shrinks with kills and floors at 0.78 — recurrence bites a
// little harder each time without ever breaking the §5b band cadence floors.
export function ladderTighten(killCount) {
  if (!killCount) return 1;
  return Math.max(0.78, Math.pow(0.93, Math.min(killCount, 4)));
}
