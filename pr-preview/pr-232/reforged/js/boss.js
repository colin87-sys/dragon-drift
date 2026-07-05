import * as THREE from 'three';
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { ui } from './ui.js';
import { sfx, setSlowMo, getBeatClock } from './sfx.js';
import { input } from './input.js';
import { cameraCtl } from './cameraController.js';
import { burst } from './particles.js';
import { emit, on } from './events.js';
import { clearAhead } from './obstacles.js';
import { buildBoss } from './bossModel.js';
import { makeRhythm } from './bossRhythm.js';
import { ENTRANCE_SCRIPTS } from './entranceScripts.js';
import { BOSSES, BOSS_ORDER, bossDefForIndex } from './bossDefs.js';
import { saveData, persist, recordBossCard, recordBossLedger } from './save.js';
import { BIOMES, biomeIndexAt } from './biomes.js';
import {
  initBossBullets, updateBossBullets, spawnBossBullet, resetBossBullets,
  setBossBulletQuality, bossBulletCount, reflectBossBullets, debugActiveBullets,
  spawnBossRingHoop,
} from './bossBullets.js';

// Boss encounter controller. A boss is an OVERLAY on the normal flight (gated by
// game.inBoss, mirroring game.inCanyon): forward motion continues, the boss holds
// a fixed player-relative distance ahead ("flies backward"), and the whole thing
// tears down cleanly back into the endless run. State machine:
//   idle → warn → approach → fight → dying → (teardown) → idle
// The rider's auto-attack is the steady chip that wins the fight if you survive;
// bullets are dodged by steering (barrel-roll i-frames negate a hit for free).

let scene = null;
let quality = 1;

const B = CONFIG.BOSS;
const TIERS = B.renderTiers;   // render-order law: nothing draws over a bullet

// Encounter scheduling (independent of the level RNG → course stays deterministic).
let debugFirstAt = null;       // ?boss override: bring the first encounter in early
let debugDefIdx = null;        // ?bossIdx override: force a specific BOSS_ORDER entry
let debugChargePin = -1;       // capture hook: ≥0 holds the charge/mantle pose for a still
let debugSetpiecePin = null;   // capture hook: { id, k } holds a setpiece pose (the dive) for a still
let debugEntrancePin = null;   // capture hook: 0..1 holds an ENTRANCE_SCRIPTS pose (the Baton Cross) for a still
let nextBossDist = B.firstAt;
let encounterIndex = 0;

// Boss Rush (gauntlet): run the unlocked bosses back-to-back with a short ring
// breather between each, then emit 'rushClear'. Architected so an endless variant
// (loop the queue with per-lap scaling) can slot in later. Kept OFF for a normal run.
let rushMode = false;
let rushQueue = [];            // BOSS_ORDER keys to run, in order (only the beaten ones)
let rushIndex = 0;             // which queue entry is current
let rushSolo = false;          // this run is a SINGLE-boss pick from a multi-boss roster
let rushUnlockAll = false;     // dev seam: treat every boss as unlocked
const RUSH_LEAD = 240;         // metres of warm-up before the first boss flies in
const RUSH_BREATHER = 420;     // metres of ring-recharge between bosses (heal + re-arm surge)

// Dev unlock-all: the `?dev`/`?rush=all` URL seam OR the in-app Settings → Dev
// Mode toggle (live). ONE predicate so the roster, the unlock gate, and the panel's
// per-boss `unlocked` flag never disagree (a mismatch showed every chip as ??? in
// the settings-dev path).
function rushDevAll() { return rushUnlockAll || !!saveData.settings?.dev; }

// The rush roster: bosses the player has DEFEATED (so a new boss must be beaten in
// normal play before it joins the gauntlet), or every boss under a dev unlock.
export function rushRoster() {
  const beaten = saveData.bossRush?.beaten || [];
  return BOSS_ORDER.filter((k) => rushDevAll() || beaten.includes(k));
}
export function rushUnlocked() { return rushRoster().length > 0; }
export function setRushUnlockAll(v) { rushUnlockAll = !!v; }

// Richer roster for the pre-launch panel: every boss with its unlock state + name +
// body colours (for a themed chip), plus the best clear time. Locked bosses are
// shown as "to unlock" so the roster teases what's still ahead without clutter.
export function rushRosterInfo() {
  const beaten = saveData.bossRush?.beaten || [];
  const devAll = rushDevAll();
  return {
    bosses: BOSS_ORDER.map((k) => ({
      id: k, name: BOSSES[k].name, title: BOSSES[k].title,
      accent: BOSSES[k].accent, glow: BOSSES[k].glow,
      unlocked: devAll || beaten.includes(k),
    })),
    unlockedCount: rushRoster().length,
    bestClearMs: saveData.bossRush?.bestClearMs || 0,
    cleared: saveData.bossRush?.cleared || 0,
  };
}

// Record a defeated boss into the save so it unlocks in the rush roster (any mode).
function recordBossBeaten(id) {
  if (!id) return;
  if (!saveData.bossRush) saveData.bossRush = { beaten: [], cleared: 0, bestClearMs: 0 };
  if (!saveData.bossRush.beaten.includes(id)) { saveData.bossRush.beaten.push(id); persist(); }
}

// Live encounter state.
let active = false;
let phase = 'idle';            // idle | warn | approach | fight | dying
let def = null;
let model = null;
let group = null;
let hp = 0, hpMax = 0;
let phaseIdx = 0;
let warnT = 0;
let approachT = 0;
let attackTimer = 0;
let riderTimer = 0;
// Cinematic overtake entrance (§5f, ASHTALON): a scripted flythrough — rise from
// behind, a bullet-time close pass with the visor/eyes tracking you, pull ahead
// (back to camera), then wheel around to face you. cineYaw overrides placeGroup's
// face-the-player rule for the turn; cineSide = which flank it sweeps.
let cineT = 0;
let entranceId = null;         // §5j: which ENTRANCE_SCRIPTS entry is playing (null = plain approach)
let cineYaw = null;            // null = normal facing; else a scripted world-yaw for the turn-around
// Fight-phase group x/y smoothing (seeded at enterFight from the entrance-end pose). Absorbs the
// single-frame lateral JUMP when the fight's station-bob (pose.x = sin(t)*5) takes over from the
// entrance (which ends at x=0) and at every setpiece boundary (station ↔ scripted path). rel is
// left DIRECT so the flyby dive stays crisp; x/y are slow enough that the damp barely lags them.
let poseSX = 0, poseSY = 0, poseSmooth = false;
// The idle fight yaw/roll wobble (placeGroup) is a function of absolute time, so releasing a
// scripted entrance — which holds the group square (cineYaw≈0) — into it SNAPS the whole group up
// to ~7°/5° in one frame. This timer eases the wobble amplitude 0→1 over ~0.6s, but ONLY after a
// cinematic entrance (seeded to 0 in enterFight when cineYaw was live). Huge default = full wobble
// immediately for plain 'approach' bosses (their wobble already ran during the approach; no dip).
let fightWobbleT = 1e9;
let cineSide = 1;
let cineAnchorX = 0, cineAnchorY = 8;   // the dragon's x/y at flythrough start (pass beside it, both in frame)
let cineSkip = false;         // a tap during the flythrough fast-forwards to the turn-around
let cineSlow = false;         // bullet-time currently engaged by the flythrough (owns game.slowMoTimer)
let dyingT = 0;
let spiralPhase = 0;
let pendingDeath = false;      // set when hp hits 0; resolved in the update loop
let rollParried = false;       // this roll already landed a parry (announce once per roll)
let perfectHealsUsed = 0;      // §5i C perfect-parry heals spent this fight (cap 3)
let reticle = null;            // focus ring around the dragon (a dim track + bright fill)
let reticleTrack = null;       // dim full-circle base
let reticleFill = null;        // bright arc: draw-on progress × (in Surge) time-left
let reticleHead = null;        // glowing comet at the fill's leading edge (Surge meter)
let reticleOn = 0;             // 0 = no circle … 1 = full circle (drawn like the HP bar)
let reticleTarget = 0;         // draws ON at boss start (with the stamina fade), OFF at end
const RETICLE_R = 2.1;         // radius — just off the dragon body
const RETICLE_SEGS = 96;       // ring resolution (smooth drain edge)
let hpRevealT = 0;             // health-bar fill-up animation timer (0→full on settle)
const HP_REVEAL = 0.8;
let shielded = false;          // at a phase floor the boss shields — only Surge bursts it
// Spell-card state (BOSS-DESIGN.md §5f/§5h). A card = one named phase, aligned
// 1:1 with def.cards[phaseIdx]: it title-cards on entry, runs a display TIMER,
// and is CAPTURED if the whole card was survived hitless (snapshot the run's
// bullet-hit counter at card start, compare at card end). Defs without `cards`
// leave activeCard null and the whole system is inert (coexist rule).
let activeCard = null;
let cardTimer = 0;             // seconds remaining in the current card's window (display / survival seal)
let cardHits0 = 0;            // game.bossHitsTakenRun at card start (capture = no new hits by card end)
let cardExpired = false;      // the display timer ran out before the phase was cleared → capture downgrades to SURVIVED (never blocks progress)
let baitTimer = 0;             // cadence for the shielded graze-bait flood
let baitLeft = 0;              // rings remaining in the current graze-bait CLUSTER
let baitResting = false;       // true during the BREAK between clusters (reposition window)
let surgeAura = null;          // dramatic pink aura + lightning on the dragon during Surge
let surgeBeam = null;          // mouth→boss energy beam fired on a Surge unleash
let surgeSeq = null;           // unleash cinematic state: { phase:'charge'|'beam', t }
let wasReady = false;          // edge-detect Surge-ready → start/stop the enticing hum
let wasSurge = false;          // edge-detect Surge-active → start/stop the crackle loop
let bulletColor = 0xff2b6a;    // magenta = danger (set per-boss from the def)
let chargeT = 0;               // telegraph wind-up remaining before the held attack fires
let chargeDur = 0;
let curAttack = null;          // the attack being telegraphed
// §5i RHYTHM: the phrase machine for defs with a `rhythm` block (bossRhythm.js).
// null for a def without one → the legacy uniform cadence roll (coexist rule).
// `rhythmRest` stashes the rest the machine returned alongside the picked attack,
// applied once that attack fires.
let rhythm = null;
let rhythmRest = null;
const pending = [];            // streamed sub-volleys: { t, fire } (tunnel / spiralStream)
const SUSTAINED = new Set(['tunnel', 'spiralStream', 'movingGap', 'iris', 'stream', 'secondWave']);
// Def-gated SETPIECE (the ONE deliberate exception to "a new boss needs zero
// controller changes" — BOSS-DESIGN.md §5's Tier 2 "the fight moves" clause
// requires a station-leave beat, and station-keeping lives here). A def opts in
// with `setpiece: { id, atPhase, dur }`: entering phase index `atPhase` (via
// breakShield) plays SETPIECE_PATHS[id] once — a scripted pose path that
// overrides the station hold while attacks + rider fire are held (a guaranteed
// quiet capture window, like the reveal hold). Defs without `setpiece` are
// byte-unchanged (the lifecycle test asserts the shipped two never see one).
let setpieceT = -1;            // <0 idle · ≥0 seconds into the active setpiece
let setpieceDef = null;
const SETPIECE_PATHS = {
  // The crossing pass: sweep out wide, rise, close in, and drift straight
  // across the lane OVER the player (hands spread via model.setSetpiece) —
  // the fly-under scale-contrast frame — then ease back to station.
  crossingPass(k) {
    const B = CONFIG.BOSS;
    if (k < 0.25) {
      const t = easeInOut(k / 0.25);
      return { x: -16 * t, y: B.fightHeight + 5 * t, rel: B.settleGap - (B.settleGap - 14) * t };
    }
    if (k < 0.75) {
      const t = (k - 0.25) / 0.5;
      const lift = Math.sin(t * Math.PI);
      return { x: -16 + 32 * easeInOut(t), y: B.fightHeight + 5 + lift * 1.5, rel: 14 - lift * 3 };
    }
    const t = easeInOut((k - 0.75) / 0.25);
    return { x: 16 * (1 - t), y: B.fightHeight + 5 * (1 - t), rel: 14 + (B.settleGap - 14) * t };
  },
  // ASHTALON — CIRCLING PASS (§5e moving-station): a wide elliptical orbit around
  // a point ~19m ahead of the player, in the (x, rel) plane, rising a touch at the
  // near pass. Runs as a MOVING setpiece — the attack machine keeps firing, so its
  // pursuit-curve streams originate from a hunter that is actually circling you
  // (emitter=organ, §5f law 7). Stays in FRONT (rel 8..30) so it's always readable
  // and the HP bar never leaves frame.
  circlingPass(k) {
    const B = CONFIG.BOSS;
    const ang = k * Math.PI * 2;                   // one full circle over the setpiece
    return {
      x: Math.sin(ang) * 13,
      y: B.fightHeight + Math.sin(k * Math.PI) * 3,
      rel: 19 + Math.cos(ang) * 11,                // k0 far(30) → k0.5 near(8) → k1 far(30)
    };
  },
  // ASHTALON — STOOPING STRIKE (§5f dread, "from above"): CLIMB high and hold (the
  // long dread telegraph), then STOOP — accelerate straight down through the lane
  // and close in (the killing dive), then recover to station. Runs MOVING so the
  // dread pattern rains from the diving hunter. This is the roster's proof of the
  // §5e "from above" motion in the live pose frame (y climbs to ~21, dives to ~5).
  stoopingStrike(k) {
    const B = CONFIG.BOSS;
    const TOP_Y = B.fightHeight + 8, TOP_REL = B.settleGap + 4;   // (21, 34) — high and drawn back
    const DIVE_Y = 5, DIVE_REL = 10;                              // plunge low and near
    if (k < 0.42) {                    // climb + HOLD (the 2–3s ritual pose)
      const t = easeInOut(k / 0.42);
      return { x: 0, y: B.fightHeight + (TOP_Y - B.fightHeight) * t, rel: B.settleGap + (TOP_REL - B.settleGap) * t };
    }
    if (k < 0.72) {                    // STOOP — accelerate down and in
      const e = ((k - 0.42) / 0.30) ** 2;   // squared = the diving acceleration
      return { x: 0, y: TOP_Y + (DIVE_Y - TOP_Y) * e, rel: TOP_REL + (DIVE_REL - TOP_REL) * e };
    }
    const t = easeInOut((k - 0.72) / 0.28);   // recover to station
    return { x: 0, y: DIVE_Y + (B.fightHeight - DIVE_Y) * t, rel: DIVE_REL + (B.settleGap - DIVE_REL) * t };
  },
  // MARROWCOIL — RIB THREAD (§5c "the rail threads its negative space"): the bone
  // dragon LOOMS straight in until the rail passes THROUGH the ribcage (rel drops
  // to ~7, centred, raised so the mid-body cage sits on the frame centre — the
  // SotC scale-contrast frame), holds the fly-through, then eases back. Runs
  // MOVING so the coil's iris rings keep expanding as it closes (emitter=organ).
  ribThread(k) {
    const B = CONFIG.BOSS;
    // L141 fix — a TRUE fly-through, not a loom. The old path parked at rel 7 so
    // the cage only LOOMED (the spine trailed away, the rail never entered it).
    // Now the group SWEEPS from the loom straight through rel −6 (the cage passes
    // OVER the camera): the rail threads the barrel, ribs rush past on both flanks
    // + overhead, then the tail clears behind and it re-approaches to station.
    // Kept CENTERED (x≈0) — unlike EITHERWING's flank scissor, MARROWCOIL's whole
    // identity is the rail going THROUGH the aperture, so the big bottom-open cage
    // (clearance ~6u scaled) is held over the lane rather than dodged aside; the
    // coil's own sway supplies a small in-aperture wobble that never leaves it.
    // The barrel interior sits ~4u ABOVE the rail (its dorsal rib roots are high,
    // the arcs hang bottom-open below them). So the pass also DIVES: the boss drops
    // ~DIVE units at the thread instant, dropping the barrel INTERIOR down around the
    // camera (ribs then flank the dragon on both sides + overhead — a true tunnel,
    // not a canopy skimmed from beneath).
    const NEAR_REL = 7, PASS_REL = -6, DIVE = 4.2;
    // 0–0.30 — approach: close from station to the loom, held at frame height.
    if (k < 0.30) { const t = easeInOut(k / 0.30); return { x: 0, y: B.fightHeight, rel: B.settleGap + (NEAR_REL - B.settleGap) * t }; }
    // 0.30–0.70 — THE PASS: rel sweeps NEAR → PASS while the boss dives, deepest at the
    // thread instant (rel 0 ≈ k 0.52). Small sway stays well inside the aperture.
    if (k < 0.70) { const t = (k - 0.30) / 0.40; const s = Math.sin(t * Math.PI); return { x: s * 0.9, y: B.fightHeight - DIVE * s, rel: NEAR_REL + (PASS_REL - NEAR_REL) * easeInOut(t) }; }
    // 0.70–1.0 — recover: rise back to frame height and re-approach to station.
    const t = easeInOut((k - 0.70) / 0.30); return { x: 0, y: B.fightHeight, rel: PASS_REL + (B.settleGap - PASS_REL) * t };
  },
  // MARROWCOIL — THE CLOSING RIBS (§5f dread): holds at mid-close range (the cage
  // readable + threadable) while the model constricts the ribcage one pair at a
  // time (setSetpiece envelope). A slow lateral drift keeps the coil sweeping;
  // the pattern rains through the shrinking aperture (the graze goldmine).
  closingRibs(k) {
    const B = CONFIG.BOSS;
    const HOLD_REL = 13, RISE = 2.0, SWEEP = 11;   // the coil sweeps the lane wide (leaves station) as the ribs close
    if (k < 0.22) { const t = easeInOut(k / 0.22); return { x: 0, y: B.fightHeight + RISE * t, rel: B.settleGap + (HOLD_REL - B.settleGap) * t }; }
    if (k < 0.8) { const t = (k - 0.22) / 0.58; return { x: Math.sin(t * Math.PI * 2) * SWEEP, y: B.fightHeight + RISE, rel: HOLD_REL }; }
    const t = easeInOut((k - 0.8) / 0.2); return { x: Math.sin(Math.PI * 2) * SWEEP * (1 - t), y: B.fightHeight + RISE * (1 - t), rel: HOLD_REL + (B.settleGap - HOLD_REL) * t };
  },
  // EITHERWING — CLOSE-PASS FIGURE-EIGHT (§5b/§5e slot 5, moving-station; r9 PRESENCE, L141):
  // a TRUE flyby, not a loom. The near lobe of the 3D lemniscate DIVES PAST the camera —
  // twice over the beat, rel sweeping 26 → −6 → back (the pair genuinely overtake and
  // re-approach; the r8 loom parked at rel ~20 and never landed). The GROUP carries the rel
  // dive + the vertical crossover; the twins' own local orbit supplies the ±x SCISSOR so
  // they pass on OPPOSITE flanks (never lane-center — the no-clip guard). The camera never
  // moves (slot-3 differentiation: repeating side-by-side flanking passes, not a one-time
  // rear-view beat). Runs MOVING so crossfire keeps raining from wherever the pass carries
  // them. Eases in/out so it laces into station-keeping between beats.
  figureEight(k) {
    const B = CONFIG.BOSS;
    // PLATEAU envelope (not a sine lace): ramp the amplitude up over the first 15% and down
    // over the last 15%, but hold FULL amplitude through the middle — a sine lace peaks at
    // k=0.5 (a FAR point) and damps the near-lobe crossings (k=0.25/0.75) to 0.7, so the
    // dive never actually reached the camera. The plateau lets each pass hit full depth.
    const env = k < 0.15 ? k / 0.15 : k > 0.85 ? (1 - k) / 0.15 : 1;
    const LAPS = 2;                                    // two full passes over the beat
    const th = k * Math.PI * 2 * LAPS;
    const near = (1 - Math.cos(th)) / 2;              // 0 at the far point → 1 as the near lobe crosses
    const dive = 26 - near * 32;                       // 26 → −6: the near lobe crosses BEHIND the player
    return {
      x: Math.sin(th * 0.5) * 3 * env,                 // slow group drift; the ±x scissor is the twins' local orbit
      y: B.fightHeight + Math.sin(th) * 3.5 * env,     // slightly above / below player height on each pass
      rel: B.settleGap + (dive - B.settleGap) * env,   // station(26) → the dive (rel −6, past the camera) → station
    };
  },
};
function clearSetpiece() {
  if (setpieceT >= 0) model?.setSetpiece?.(0);
  setpieceT = -1;
  setpieceDef = null;
}
// Resolve the setpiece armed on entering `idx` (per-phase array first, then the
// legacy single) and arm it. A `moving` setpiece keeps the attack/rider clocks
// live (fires while it travels); a quiet one pushes them past its duration.
function setpieceForPhase(idx) {
  if (Array.isArray(def.setpieces)) return def.setpieces.find((s) => s.atPhase === idx) || null;
  if (def.setpiece && def.setpiece.atPhase === idx) return def.setpiece;
  return null;
}
function armSetpieceForPhase(idx) {
  const sp = setpieceForPhase(idx);
  if (!sp || !SETPIECE_PATHS[sp.id]) return;
  setpieceDef = sp;
  setpieceT = 0;
  if (!sp.moving) {   // quiet pass → suppress fire for a capture-safe window
    attackTimer = Math.max(attackTimer, sp.dur + 1.2);
    riderTimer = Math.max(riderTimer, sp.dur);
  }
}

// ---- Spell cards (BOSS-DESIGN.md §5f/§5h) -----------------------------------
// beginCard: title-card the phase's named set-piece, arm its timer, snapshot the
// hit counter (capture = hitless through the whole card). endCard: decide the
// capture/survived outcome, ledger it (local-only), and announce it. A phase
// with no matching card entry leaves the system inert.
function beginCard(idx) {
  activeCard = (def && def.cards && def.cards[idx]) || null;
  if (!activeCard) { cardTimer = 0; return; }
  cardTimer = activeCard.timer ?? 24;
  cardHits0 = game.bossHitsTakenRun;
  cardExpired = false;
  // Small lower-right title card (§5f) — the reveal card owns the lower-third;
  // the spell card names the pattern without covering it.
  ui.bossCard?.(activeCard.name, def.accent, !!activeCard.dread);
  emit('bossCardStart', { id: activeCard.id, boss: def.id, dread: !!activeCard.dread });
}
function endCard() {
  if (!activeCard) return;
  // CAPTURE = cleared the phase HITLESS *and* before the card timer ran out. The
  // timer is a real capture deadline now (not just display): letting it expire
  // downgrades the result to SURVIVED but NEVER blocks progress (§5f: no hard wall).
  const captured = game.bossHitsTakenRun === cardHits0 && !cardExpired;
  recordBossCard(activeCard.id, captured);
  if (captured) sfx.cardCapture?.(!!activeCard.dread);   // the acknowledgement chime (bigger for a dread card)
  ui.bossCardResult?.(captured, activeCard.name);
  emit('bossCard', { id: activeCard.id, boss: def.id, captured, dread: !!activeCard.dread });
  activeCard = null;
  cardTimer = 0;
}
// Arena constriction (a def's showpiece phase narrows the lane): the live half-
// width the fill patterns and the player clamp both read. Full lane when idle.
const CONSTRICT_HW = 6.5;      // showpiece arena half-width (lab-proven value)
let arenaHW = CONFIG.laneHalfWidth;
let arenaTargetHW = CONFIG.laneHalfWidth;
let wallL = null, wallR = null, wallMat = null;   // translucent storm walls
const REFLECT_COLOR = 0xffc23c;   // amber = "you can parry this" (aimed/fan precision shots)
// Per-ring banding: successive rings differ in BRIGHTNESS and SIZE (not just hue),
// so overlapping/concentric waves read apart even for colour-blind players — and
// every bullet has a white centre (the universal read). Hues stay in the magenta
// danger family, clear of the amber (parry) and cyan (reflected) role colours.
const BAND = [
  { c: 0xffc6dc, s: 1.2 },   // light, big
  { c: 0x8f0a3c, s: 0.82 },  // dark/deep, small
  { c: 0xff4f9a, s: 1.0 },   // mid, mid
];
let bandIdx = 0;
// Per-biome BAND override (contrast gate, tests/bulletcontrast.mjs): most biomes
// read fine on the default BAND above, but a couple of skies push a band colour
// too close in luminance to their fog/horizon — biomes.js may carry a
// `bullets: { light, mid, dark }` hex override for those. Resolved ONCE at
// encounter start (render-only; never touches kinematics) and reset on teardown.
let activeBand = BAND;
function resolveBand(biomeIdx) {
  const o = BIOMES[biomeIdx]?.bullets;
  if (!o) return BAND;
  return [
    { c: o.light ?? BAND[0].c, s: BAND[0].s },
    { c: o.dark ?? BAND[1].c, s: BAND[1].s },
    { c: o.mid ?? BAND[2].c, s: BAND[2].s },
  ];
}

// Player-relative pose: rel = metres ahead of the player.
const pose = { x: 0, y: B.fightHeight, rel: B.settleGap };
let prevPassRel = 99;   // tracks pose.rel across frames so a close-pass whoosh fires once per crossing
const start = { x: 0, y: 7, rel: -12 };
const tmp = new THREE.Vector3();

// Surge-unleash cinematic timing + scratch vectors for the mouth→boss beam.
const CHARGE_TIME = 0.5;       // wind-up: energy gathers at the dragon's mouth
const BEAM_TIME = 0.55;        // beam live + fade after the strike
const BEAM_UP = new THREE.Vector3(0, 1, 0);
const beamO = new THREE.Vector3();     // origin (mouth)
const beamT = new THREE.Vector3();     // target (boss)
const beamDir = new THREE.Vector3();
const beamQuat = new THREE.Quaternion();

const easeInOut = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

export function initBoss(sc) {
  scene = sc;
  initBossBullets(scene);
  on('bossDamage', (e) => damageBoss(e.amount, e.kind));
  on('bossDefeated', (e) => recordBossBeaten(e && e.id));   // unlock it in the rush roster

  // Arena walls: two tall translucent planes that slide in during a constriction
  // showpiece phase. Hidden (opacity 0) whenever the arena is at full width.
  wallMat = new THREE.MeshBasicMaterial({
    color: 0x35e0ff, transparent: true, opacity: 0, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const wallGeo = new THREE.PlaneGeometry(90, CONFIG.laneMaxY + 8);
  wallL = new THREE.Mesh(wallGeo, wallMat);
  wallR = new THREE.Mesh(wallGeo, wallMat);
  wallL.rotation.y = Math.PI / 2;
  wallR.rotation.y = Math.PI / 2;
  wallL.renderOrder = wallR.renderOrder = TIERS.arenaWall;
  wallL.visible = wallR.visible = false;
  scene.add(wallL); scene.add(wallR);
  // Surge callout is fired from activateSurge (one note only — "REFLECT ANYTHING"),
  // so there's no duplicate banner here.

  // Focus reticle: ONE ring around the dragon, built as a dim TRACK + a bright
  // FILL arc. In a normal fight the fill is full (a clean cyan circle). During
  // Dragon Surge it becomes a TIME METER — the fill drains full→empty over the
  // surge duration (revealing the dim track), tinted surge-pink with a glowing
  // comet at the draining edge, so "how long is left" is a spatial read at the
  // dragon, not another HUD bar. Drawn via setDrawRange (an angular wipe) so
  // there are no per-frame geometry rebuilds.
  // Ring budget: fill and track share ONE thin annulus (no extra ±0.02 on the
  // fill) so they never compete for the same band; opacity trimmed so the ring
  // frames the dragon without competing with the bullets sitting on top of it.
  const ir = RETICLE_R - 0.05, or = RETICLE_R + 0.05;
  reticle = new THREE.Group();
  reticleTrack = new THREE.Mesh(
    new THREE.RingGeometry(ir, or, RETICLE_SEGS, 1, Math.PI / 2, Math.PI * 2),
    new THREE.MeshBasicMaterial({ color: 0x9dffea, transparent: true, opacity: 0.10, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  reticleTrack.renderOrder = TIERS.focusTrack;
  reticleFill = new THREE.Mesh(
    new THREE.RingGeometry(ir, or, RETICLE_SEGS, 1, Math.PI / 2, Math.PI * 2),
    new THREE.MeshBasicMaterial({ color: 0x9dffea, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  reticleFill.renderOrder = TIERS.focusFill;
  reticleHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  reticleHead.renderOrder = TIERS.focusHead;
  reticleHead.visible = false;
  reticle.add(reticleTrack, reticleFill, reticleHead);
  reticleTrack.geometry.setDrawRange(0, 0);   // starts un-drawn
  reticleFill.geometry.setDrawRange(0, 0);
  reticle.visible = false;
  scene.add(reticle);

  // Dragon Surge aura: JUST the lightning now. During Surge the focus ring itself
  // turns into the pink drain METER, so a second full hoop would sit behind it and
  // fill the drain gap — hiding the very "time left" read the meter exists for.
  // So the aura is only outward-arcing bolts (energy flavour); the meter is the ring.
  surgeAura = new THREE.Group();
  const boltMat = new THREE.MeshBasicMaterial({ color: 0xffbdf6, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
  const bolts = [];
  for (let i = 0; i < 6; i++) {
    // Thin, SHORT arcs that live OUTSIDE the meter ring (start ~2.6 out) so they
    // never cross the dragon or the meter at the centre.
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.6, 4), boltMat);
    b.renderOrder = TIERS.surgeFx;
    surgeAura.add(b);
    bolts.push(b);
  }
  surgeAura.userData = { bolts };
  surgeAura.visible = false;
  scene.add(surgeAura);

  // Dragon Surge BEAM: fired from the dragon's mouth into the boss when a charged
  // Surge is unleashed. Asset-free — a white-hot core cylinder inside a wide
  // coloured glow (the shaft, oriented mouth→boss each frame), a muzzle orb that
  // swells during the wind-up, and an impact flare that blooms at the boss.
  surgeBeam = new THREE.Group();
  const shaft = new THREE.Group();
  const beamCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 1, 10, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  const beamGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.75, 1, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xff4fd0, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  beamCore.renderOrder = beamGlow.renderOrder = TIERS.surgeFx;
  shaft.add(beamGlow, beamCore);
  const muzzleOrb = new THREE.Mesh(
    new THREE.SphereGeometry(1, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xbdeaff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  muzzleOrb.renderOrder = TIERS.surgeFx;
  const impactOrb = new THREE.Mesh(
    new THREE.SphereGeometry(1, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  impactOrb.renderOrder = TIERS.surgeFx;
  surgeBeam.add(shaft, muzzleOrb, impactOrb);
  surgeBeam.userData = { shaft, beamCore, beamGlow, muzzleOrb, impactOrb };
  surgeBeam.visible = false;
  scene.add(surgeBeam);
}

// Drive the Surge-unleash cinematic: a charge wind-up at the mouth, then a beam
// lancing into the boss (which bursts the shield at the strike). Returns nothing;
// clears `surgeSeq` when the beam finishes.
function updateSurgeBeam(dt, player, time) {
  if (!surgeBeam) return;
  if (!surgeSeq) { if (surgeBeam.visible) surgeBeam.visible = false; return; }
  surgeSeq.t += dt;
  surgeBeam.visible = true;
  const { shaft, beamCore, beamGlow, muzzleOrb, impactOrb } = surgeBeam.userData;

  // Mouth ≈ just ahead + slightly above the dragon; boss at its settled pose.
  beamO.set(player.position.x, player.position.y + 0.35, -(player.dist + 1.3));
  beamT.set(pose.x, pose.y, -(player.dist + pose.rel));

  if (surgeSeq.phase === 'charge') {
    // Wind-up: a bright orb of energy gathers + flickers at the mouth, no shaft yet.
    const k = Math.min(surgeSeq.t / CHARGE_TIME, 1);
    shaft.visible = false;
    impactOrb.visible = false;
    muzzleOrb.visible = true;
    muzzleOrb.position.copy(beamO);
    muzzleOrb.scale.setScalar(0.3 + k * 1.1 + Math.sin(time * 40) * 0.08 * k);
    muzzleOrb.material.opacity = 0.5 + k * 0.5;
    cameraCtl.shake?.(0.12 * k);
    if (k >= 1) { surgeSeq.phase = 'beam'; surgeSeq.t = 0; strikeSurge(player); }
    return;
  }

  // 'beam' phase: the shaft is live mouth→boss, pulsing, then fades over BEAM_TIME.
  const life = surgeSeq.t / BEAM_TIME;
  if (life >= 1) { surgeSeq = null; surgeBeam.visible = false; return; }
  const fade = 1 - life;
  shaft.visible = true;
  muzzleOrb.visible = true;
  impactOrb.visible = true;

  beamDir.copy(beamT).sub(beamO);
  const len = Math.max(beamDir.length(), 0.001);
  beamDir.multiplyScalar(1 / len);
  beamQuat.setFromUnitVectors(BEAM_UP, beamDir);
  shaft.position.copy(beamO).addScaledVector(beamDir, len / 2);
  shaft.quaternion.copy(beamQuat);
  const wob = 1 + Math.sin(time * 50) * 0.14;      // energy pulse across the shaft
  shaft.scale.set(wob, len, wob);
  beamCore.material.opacity = 0.95 * fade;
  beamGlow.material.opacity = (0.5 + Math.sin(time * 30) * 0.15) * fade;

  muzzleOrb.position.copy(beamO);
  muzzleOrb.scale.setScalar((1.3 + Math.sin(time * 45) * 0.2) * fade + 0.2);
  muzzleOrb.material.opacity = fade;
  impactOrb.position.copy(beamT);
  impactOrb.scale.setScalar((2.2 + Math.sin(time * 38) * 0.4) * (0.5 + fade * 0.5));
  impactOrb.material.opacity = fade;
}

// The beam lands: shatter the shield (or chip an unshielded boss), impact FX, sfx.
function strikeSurge(player) {
  sfx.surgeBeam?.();
  cameraCtl.shake?.(1.4);
  tmp.set(pose.x, pose.y, -(player.dist + pose.rel));
  burst(tmp, 0xffffff, { count: 24, speed: 22, size: 1.3, life: 0.6 });
  burst(tmp, 0xff4fd0, { count: 18, speed: 15, size: 1.0, life: 0.7 });
  if (shielded) breakShield(player);
  else damageBoss(B.surgeBeamDamage ?? 14, 'surge');   // no shield up → a solid chip
}

// Pink aura + crackling lightning on the dragon while Surge is active.
function updateSurgeAura(dt, player, time, surge) {
  if (!surgeAura) return;
  surgeAura.visible = surge;
  if (!surge) return;
  surgeAura.position.set(player.position.x, player.position.y, -player.dist);
  const { bolts } = surgeAura.userData;
  // Lightning arcs living OUTSIDE the meter ring (radius ~2.7), pointing radially
  // outward and flickering — electricity crackling around the dragon, never over
  // the dragon or the drain meter at the centre.
  bolts.forEach((b, i) => {
    const ang = (i / bolts.length) * Math.PI * 2 + Math.sin(time * 7 + i * 1.7) * 0.3;
    b.visible = Math.random() < 0.6;
    const r = 2.75 + Math.random() * 0.5;
    b.position.set(Math.cos(ang) * r, Math.sin(ang) * r, (Math.random() - 0.5) * 0.8);
    b.rotation.set(0, 0, ang - Math.PI / 2);   // length runs radially outward
    b.scale.set(0.7 + Math.random() * 0.5, 0.5 + Math.random() * 0.7, 1);
  });
}

export function setBossQuality(q) {
  quality = q;
  setBossBulletQuality(q);
}

export function bossActive() { return active; }

// Render-only signal for the world-dim grade (postfx._bossMix / ambient's mote
// budget): the dim rides the DANGER warning, not just the fight — so it starts
// at 'warn' (the overlay's banner phase), holds through approach/fight, and
// spikes while the boss is SHIELDED (bullets need the most headroom then).
// Dumb getter, no state of its own — callers own all easing.
export function bossGradeTarget() {
  if (!active || (phase !== 'warn' && phase !== 'approach' && phase !== 'fight')) return 0;
  return shielded ? 1.0 : 0.6;
}

// ---- Encounter lifecycle ----------------------------------------------------

export function startBossEncounter(player, defOverride) {
  if (active) return;
  active = true;
  def = defOverride
    || (rushMode ? BOSSES[rushQueue[rushIndex]]
      : (debugDefIdx != null ? bossDefForIndex(debugDefIdx) : bossDefForIndex(encounterIndex)));
  hpMax = def.hpMax;
  hp = hpMax;
  phaseIdx = 0;
  spiralPhase = 0;
  shielded = false;
  activeCard = null; cardTimer = 0;   // spell-card state resets per encounter
  baitTimer = 0; baitLeft = 0; baitResting = false;
  bandIdx = 0;
  activeBand = resolveBand(biomeIndexAt(player.dist));
  bulletColor = def.bulletColor ?? 0xff2b6a;
  pending.length = 0;
  chargeT = 0;
  curAttack = null;
  // §5i: build the phrase machine for a def with a rhythm signature (else null →
  // legacy uniform roll). Reset per encounter so its phrase state starts clean.
  rhythm = def.rhythm ? makeRhythm(def) : null;
  rhythmRest = null;
  perfectHealsUsed = 0;   // §5i C: the perfect-parry heal cap resets each fight
  // Fresh fight = full-width arena; the walls take the boss's accent colour.
  arenaHW = arenaTargetHW = CONFIG.laneHalfWidth;
  game.bossArenaHW = null;
  if (wallMat) wallMat.color.setHex(def.accent ?? 0x35e0ff);
  if (def.constrictPhase === 0) arenaTargetHW = CONSTRICT_HW;   // constrict from the opener

  model = buildBoss(def, quality);
  group = model.group;
  group.userData.__isBoss = true;   // debug seam: locate the boss in the scene graph
  scene.add(group);

  // Approach choreography (§5e): from behind (overtake up and over), the side,
  // ABOVE (a stoop out of the top of the frame), or BELOW (rise out of the deep),
  // then settle dead ahead and face the player. 'above'/'below' hold station-rel
  // and travel in y, so the arc is a pure descent/ascent (no over-the-top hop).
  if (def.approachFrom === 'side') {
    start.rel = B.settleGap;
    start.x = (Math.random() < 0.5 ? -1 : 1) * 22;
    start.y = B.fightHeight;
  } else if (def.approachFrom === 'above') {
    start.rel = B.settleGap;
    start.x = (Math.random() < 0.5 ? -1 : 1) * 4;
    start.y = B.fightHeight + 22;   // above the top of the portrait envelope (~y35)
  } else if (def.approachFrom === 'below') {
    start.rel = B.settleGap;
    start.x = (Math.random() < 0.5 ? -1 : 1) * 4;
    start.y = -8;                   // rises from below the frame (Brineholm/Marrowcoil)
  } else if (def.approachFrom === 'sides') {
    // BOTH SIDES at once (§5b/§5d slot 5, EITHERWING): the pair materialises dead
    // ahead and glides into station centred, while the two twins sweep OUT from the
    // centre to their figure-eight orbit (the model's own intro spread) — the "both
    // flanks at once" arrival that no single-body boss can make. The group travels
    // in rel only (a pure forward settle); the twins own the lateral arrival.
    start.rel = B.settleGap + 10;
    start.x = 0;
    start.y = B.fightHeight;
  } else {
    start.rel = -12;
    start.x = (Math.random() < 0.5 ? -1 : 1) * 4;
    start.y = 7;
  }
  pose.x = start.x; pose.y = start.y; pose.rel = start.rel;
  clearSetpiece();
  placeGroup(player, 0);

  // Suppress the normal course for the fight: wipe hazards already spawned ahead;
  // spawnAhead() stops laying new ones while game.inBoss is true (see main.js).
  clearAhead(player.dist + 800);
  game.inBoss = true;
  game.bossHitsTakenRun = 0;

  phase = 'warn';
  warnT = B.warnTime;
  approachT = 0;
  attackTimer = 0;
  riderTimer = B.riderShotInterval;
  // Focus circle draws ON from nothing (synced with the stamina bar fading out).
  reticleOn = 0; reticleTarget = 1;

  // Warning flashes ALONE first (the boss stays hidden behind during 'warn'), then
  // clears as the boss flies in — anchored WHERE it emerges. 'side' → left/right;
  // 'above' → top; 'below'/'behind' → bottom-centre.
  const dir = def.approachFrom === 'side' ? (start.x < 0 ? 'left' : 'right')
    : def.approachFrom === 'above' ? 'top' : 'bottom';
  ui.bossWarning?.(def.name, def.title, dir, B.warnTime);
  sfx.feverStart?.();
  cameraCtl.shake?.(1.2);
  emit('bossStart', { id: def.id });
}

// Begin a Boss Rush run: queue the unlocked bosses and schedule the first one a
// short warm-up ahead. main.js suppresses the obstacle course for the whole run
// (rings/orbs only), so the gauntlet is boss → breather → boss → … → 'rushClear'.
// `only` (a BOSS_ORDER key) restricts the queue to a SINGLE boss — the "fight one
// particular boss" pick from the roster panel; it must be an unlocked boss.
export function startBossRush(player, only = null) {
  rushMode = true;
  const roster = rushRoster();
  const pick = only && roster.includes(only);
  rushQueue = pick ? [only] : roster;
  // SOLO = a deliberate single pick from a roster of MORE than one. Picking your
  // only unlocked boss IS the full gauntlet, so that stays a real clear.
  rushSolo = !!(pick && roster.length > 1);
  rushIndex = 0;
  encounterIndex = 0;
  active = false;
  if (rushQueue.length === 0) { emit('rushClear', { count: 0 }); nextBossDist = Infinity; return; }
  nextBossDist = player.dist + RUSH_LEAD;
}

export function inBossRush() { return rushMode; }

function endEncounter(player) {
  clearSetpiece();
  if (group) { scene.remove(group); model.dispose?.(); }
  resetBossBullets();
  group = null; model = null; def = null;
  active = false;
  phase = 'idle';
  game.inBoss = false;
  activeBand = BAND;
  // The arena is NEVER left narrowed past a fight (unconditional restore).
  arenaHW = arenaTargetHW = CONFIG.laneHalfWidth;
  game.bossArenaHW = null;
  if (wallL) { wallL.visible = wallR.visible = false; wallMat.opacity = 0; }
  reticleTarget = 0;            // focus circle draws off (the !active branch animates it)
  ui.bossNoteClear?.();         // no stale callout/prompt lingers past the fight
  activeCard = null; cardTimer = 0;
  ui.bossCardClear?.();         // clear the spell-card readout past the fight
  // Carry Dragon Surge OUT of the fight so the player keeps the hyper into the
  // grace band (the kill earns it) — the normal fever visuals take over there.
  game.feverActive = true;
  game.feverTimer = CONFIG.feverDuration;
  encounterIndex++;
  if (rushMode) {
    // Gauntlet: advance the queue. Another boss → a short ring breather; queue
    // exhausted → the run is WON (main.js ends it as a win on 'rushClear').
    rushIndex++;
    if (rushIndex >= rushQueue.length) {
      nextBossDist = Infinity;
      // `solo` gates the gauntlet-clear rewards in main.js (a practice pick must not
      // overwrite the full-gauntlet best or award the clear feat); `name` labels the
      // solo win recap. Read the name BEFORE this frame's def is torn down above? No —
      // def is already null here, so resolve from the queue key.
      emit('rushClear', { count: rushQueue.length, solo: rushSolo, name: rushSolo ? (BOSSES[rushQueue[0]]?.name || '') : '' });
    } else {
      nextBossDist = player.dist + RUSH_BREATHER;
    }
  } else {
    nextBossDist = player.dist + B.interval + Math.random() * B.intervalJitter;
  }
  emit('bossEnd', { dist: player.dist });   // main.js resumes level generation ahead
}

function startDeath(player) {
  phase = 'dying';
  dyingT = 0;
  endCard();                              // resolve the final card if a path reached death without a shield-break
  recordBossLedger(def.id, { kill: true });   // per-boss kill accrual (§5h; slot 9's taunts read it)
  clearSetpiece();
  reticleTarget = 0;            // focus circle draws off as the boss disintegrates
  arenaTargetHW = CONFIG.laneHalfWidth;   // storm walls glide out with the dissolve
  resetBossBullets();
  game.bossesDefeatedRun++;
  const bonus = Math.round(B.defeatScore * game.scoreMult);
  const embers = B.defeatEmbers;
  game.score += bonus;
  game.embersRun += embers;       // banked at run end like any ember haul
  // §5h defeat banner: default is the generic SLAIN/FELLED; a boss whose death isn't a clean kill
  // (EITHERWING — one half escapes) overrides the title + kill-card name with an on-theme line.
  ui.bossNote?.(def.defeat?.slain ?? '✦  SLAIN  ✦', `+${bonus}   ◆${embers}`, 'gold', 3.2);
  ui.bossFelledCard?.(def.defeat?.felled ?? def.name);   // kill card: gold "FELLED" + the boss name (or the boss's own defeat line)
  sfx.bossDefeat?.();
  cameraCtl.shake?.(2.0);
  tmp.set(pose.x, pose.y, -(player.dist + pose.rel));
  burst(tmp, 0xffc050, { count: 30, speed: 18, size: 1.2, life: 0.9 });
  // SLOW-MO ON THE KILL: reuse the existing near-death dilation channel (main.js
  // reads game.slowMoTimer/timeScale every tick regardless of who set it) rather
  // than inventing a second time-scale system. NOTE: main.js hardcodes the slow-mo
  // scale to 0.35× (not tunable from here without touching main.js, which is out
  // of this pass's file scope) — so this lands at ~1.2s of 0.35×, close to but not
  // exactly the ~0.25x asked for.
  game.slowMoTimer = Math.max(game.slowMoTimer, 1.2);
  setSlowMo(true);
  emit('bossDefeated', { id: def.id, bonus, embers, noHit: game.bossHitsTakenRun === 0 });
}

// Apply the focus ring each frame via setDrawRange (an angular wipe — no geometry
// rebuilds). `timeLeft` 1 = full circle; in Surge it's feverTimer/feverDuration, so
// the fill DRAINS as the surge runs out. `reticleOn` is the boss-start/end sweep.
function applyReticle(timeLeft, time) {
  if (!reticleTrack) return;
  const segs = reticleTrack.geometry.index.count / 6;   // triangles per full ring / … → segments
  const trackSeg = Math.round(segs * reticleOn);
  const fillFrac = reticleOn * Math.max(0, Math.min(1, timeLeft));
  const fillSeg = Math.round(segs * fillFrac);
  reticleTrack.geometry.setDrawRange(0, trackSeg * 6);
  reticleFill.geometry.setDrawRange(0, fillSeg * 6);
  const surging = timeLeft < 0.999;
  reticleFill.material.color.setHex(surging ? 0xff6ae0 : 0x9dffea);
  reticleTrack.material.color.setHex(surging ? 0x8f6ad8 : 0x9dffea);
  reticleFill.material.opacity = surging ? 0.55 + Math.abs(Math.sin(time * 8)) * 0.18 : 0.32;
  // Comet at the draining edge — only while it's a live meter (fully drawn + surging).
  if (surging && reticleOn > 0.99 && fillFrac > 0.004) {
    const a = Math.PI / 2 + fillFrac * Math.PI * 2;
    reticleHead.position.set(Math.cos(a) * RETICLE_R, Math.sin(a) * RETICLE_R, 0);
    reticleHead.material.opacity = 0.85 + Math.sin(time * 14) * 0.15;
    reticleHead.scale.setScalar(1 + Math.sin(time * 12) * 0.18);
    reticleHead.visible = true;
  } else {
    reticleHead.visible = false;
  }
  reticle.visible = reticleOn > 0.005;
}

// Settle into the fight: reveal the health bar (fill 0→full), the notice beat +
// reveal card, and the first spell card — with the attack/rider clocks held past
// the card's hold so the reveal is bullet-free. Shared by the plain approach and
// the cinematic flythrough entrance.
function enterFight() {
  phase = 'fight';
  poseSX = pose.x; poseSY = pose.y; poseSmooth = true;   // seed the group x/y smoother from the entrance-end pose (no handoff jump)
  if (cineYaw != null) fightWobbleT = 0;   // released from a scripted entrance → ease the yaw/roll wobble in from its settled facing (no snap)
  entranceId = null;                  // the scripted entrance is done
  model?.setEntrance?.(null);         // release any per-boss entrance choreography (EITHERWING's Baton Cross)
  cineYaw = null;                     // hand facing back to placeGroup (face the player)
  cameraCtl.setOvertake?.(null);      // release the cinematic camera if it was active
  model.setEyeLock?.(false);          // hand the pupil back to the idle gaze
  ui.cinematicHold?.(false);          // restore the gameplay HUD
  attackTimer = rand(0.9, 1.3);
  model.setHealthBarVisible(true);
  model.setHealth(0);
  hpRevealT = HP_REVEAL;
  riderTimer = HP_REVEAL;
  model.notice?.();
  ui.bossTitleCard?.(def.name, def.epithet, def.accent);
  beginCard(0);
  attackTimer = Math.max(attackTimer, 1.9);
  riderTimer = Math.max(riderTimer, 1.9);
  if (def.tutorial) ui.bossNote?.('DODGE!', 'ROLL INTO AMBER SHOTS TO PARRY', 'gold', 3.0);
}

// The §5j ENTRANCE DRIVER (generalized from ASHTALON's shipped overtake). A scripted
// pre-fight cinematic on a normalized clock driven by SCALED dt, so the boss AND the
// world slow together through the bullet-time close pass while the rest stays snappy.
// The DATA (path/tuck/yaw/gaze/camera/slow-mo window, per boss) lives in
// ENTRANCE_SCRIPTS; this driver owns the SHARED machinery: skip, slow-mo engage/
// release, setOvertake feed, enterFight handoff. ASHTALON's 'overtake' reproduces the
// shipped math byte-for-byte (tests/entrance.mjs golden gate). No fire (the Mantis rule).
function releaseCineSlow() {
  if (!cineSlow) return;
  cineSlow = false; game.slowMoTimer = 0; game.slowMoScale = null; setSlowMo(false); sfx.timeDilate?.(false);
}
function updateEntrance(dt, player, time) {
  const script = ENTRANCE_SCRIPTS[entranceId];
  if (!script) { enterFight(); return; }
  const skipU = script.dur * (script.skipTo ?? 1);
  // Tap to skip → jump to the pull-ahead (you still see it wheel to face you).
  if (input.surgeTap) { input.surgeTap = false; cineSkip = true; }
  if (cineSkip && cineT < skipU) { cineT = skipU; releaseCineSlow(); }
  cineT += dt;
  const u = Math.min(cineT / script.dur, 1);
  const ctx = { AX: cineAnchorX, AY: cineAnchorY, S: cineSide, B, sc: def.scale ?? 1.5 };

  const p = script.path(u, ctx);
  pose.x = p.x; pose.y = p.y; pose.rel = p.rel;

  // DEEP bullet-time across the close pass: main.js scales dt while the window holds, so
  // boss + world + this clock all slow together = the dwell. Snap back on exit.
  const sw = script.slowWindow;
  if (sw) {
    if (u >= sw.uIn && u < sw.uOut && !cineSlow) { cineSlow = true; game.slowMoTimer = 5; game.slowMoScale = sw.depth; setSlowMo(true); sfx.timeDilate?.(true); }
    else if ((u >= sw.uOut || u >= 1) && cineSlow) releaseCineSlow();
  }

  model.setSetpiece?.(script.tuck ? script.tuck(u, ctx) : 0);
  model.setCharge?.(0);
  if (script.yaw) cineYaw = script.yaw(u, ctx, pose, player);
  if (script.gaze) { const g = script.gaze(u, ctx, pose, player); model.setGaze?.(g.gx, g.gy); }
  // Per-boss entrance FX hook (EITHERWING's eye-thread cross, twin brackets) — optional.
  script.onFrame?.(u, ctx, pose, player, model, time);
  // Feed the cinematic camera the boss's world position so it tracks the flythrough.
  if (script.camera) cameraCtl.setOvertake?.(script.camera(u, pose, player, ctx));

  if (u >= 1) enterFight();
}

// ---- Per-frame update -------------------------------------------------------

export function updateBoss(dt, player, time) {
  if (!active) {
    // Draw the focus circle OFF if it's still up (e.g. player died mid-fight) —
    // same steady linear rate as the draw-on (one HP_REVEAL to sweep the full circle).
    if (reticle) {
      if (reticleOn > 0.005) {
        reticleOn = Math.max(0, reticleOn - dt / HP_REVEAL);
        applyReticle(1, time);
        reticle.position.set(player.position.x, player.position.y, -player.dist);
      } else { reticle.visible = false; if (reticleHead) reticleHead.visible = false; }
    }
    if (surgeAura) surgeAura.visible = false;
    if (surgeBeam) surgeBeam.visible = false;
    surgeSeq = null;
    // Silence any lingering Surge loops when the fight isn't running (edge-only).
    if (wasSurge) { sfx.surgeCrackleStop?.(); wasSurge = false; }
    if (wasReady) { sfx.surgeReadyStop?.(); wasReady = false; }
    input.surgeTap = false;   // drop any stale tap between fights
    ui.surgeReady?.(false);
    // Trigger a fresh encounter once the player flies past the scheduled mark
    // (never inside a canyon, never on the menu).
    if (game.state === 'playing' && !game.inCanyon && player.dist >= nextBossDist) {
      startBossEncounter(player);
    }
    return;
  }

  const surge = game.feverActive;

  // Focus circle: sweeps ON (0→full) at a STEADY linear rate that takes exactly one
  // HP_REVEAL to complete — the same pace as the boss health bar filling. In a normal
  // fight the fill is a full cyan circle; during Surge it becomes a TIME METER that
  // drains full→empty over the surge (feverTimer/feverDuration).
  if (reticle) {
    if (Math.abs(reticleOn - reticleTarget) > 0.0005) {
      const step = dt / HP_REVEAL;
      reticleOn = reticleOn < reticleTarget
        ? Math.min(reticleTarget, reticleOn + step)
        : Math.max(reticleTarget, reticleOn - step);
    }
    const timeLeft = surge ? Math.max(0, Math.min(1, game.feverTimer / CONFIG.feverDuration)) : 1;
    applyReticle(timeLeft, time);
    reticle.position.set(player.position.x, player.position.y, -player.dist);
  }

  // Arena constriction: ease the live half-width toward its target, publish it
  // for the player clamp (null = full lane, nothing to clamp), and slide the
  // translucent storm walls with it. Restored unconditionally by endEncounter.
  arenaHW += (arenaTargetHW - arenaHW) * Math.min(dt * 2.2, 1);
  const narrowed = arenaHW < CONFIG.laneHalfWidth - 0.3;
  game.bossArenaHW = narrowed ? arenaHW : null;
  if (wallL) {
    wallL.visible = wallR.visible = narrowed;
    if (narrowed) {
      const wy = (CONFIG.laneMinY + CONFIG.laneMaxY) / 2;
      const wz = -(player.dist + 22);
      wallL.position.set(-arenaHW, wy, wz);
      wallR.position.set(arenaHW, wy, wz);
      // Fade with how far the walls have come in; a soft pulse keeps them alive.
      const closeK = (CONFIG.laneHalfWidth - arenaHW) / (CONFIG.laneHalfWidth - CONSTRICT_HW);
      wallMat.opacity = Math.min(0.16, closeK * 0.16) * (0.8 + Math.sin(time * 3.2) * 0.2);
    } else { wallMat.opacity = 0; }
  }

  updateBossBullets(dt, player);   // no bullet-time (the sudden slow read as jarring)
  model.tick(dt, time);
  updateSurgeAura(dt, player, time, surge);
  updateSurgeBeam(dt, player, time);
  // Surge-active crackle: the constant electric arc sound while the lightning is on.
  if (surge !== wasSurge) {
    if (surge) sfx.surgeCrackleStart?.(); else sfx.surgeCrackleStop?.();
    wasSurge = surge;
  }

  // Graze streak lapses if you stop skimming (drives the graze chime pitch).
  if (game.grazeStreakTimer > 0) {
    game.grazeStreakTimer -= dt;
    if (game.grazeStreakTimer <= 0) game.grazeStreak = 0;
  }

  // hp reached 0 last frame → begin the disintegration (needs the player ref).
  if (pendingDeath && phase === 'fight') {
    pendingDeath = false;
    startDeath(player);
  }

  if (phase === 'warn') {
    warnT -= dt;
    if (warnT <= 0) {
      // §5j: a def opts into a scripted pre-fight cinematic via `def.entrance` (an
      // ENTRANCE_SCRIPTS id); the legacy `cinematicEntrance` flag maps to ASHTALON's
      // 'overtake'. Defs with neither keep the plain approach (coexist).
      const eid = def.entrance ?? (def.cinematicEntrance ? 'overtake' : null);
      const script = eid && ENTRANCE_SCRIPTS[eid];
      if (script) {
        entranceId = eid;
        phase = 'flythrough';
        cineT = 0; cineSkip = false; cineSlow = false;
        cineSide = start.x < 0 ? -1 : 1;
        if (script.anchorToDragon) { cineAnchorX = player.position.x; cineAnchorY = player.position.y; }   // pass beside the dragon
        else { cineAnchorX = 0; cineAnchorY = B.fightHeight; }
        cineYaw = script.initYaw ?? Math.PI;
        if (script.eyeLock !== false) model.setEyeLock?.(true);   // the pupil hard-tracks the dragon (overtake); batonCross opts out
        ui.cinematicHold?.(true);         // hide the gameplay HUD — keep the moment clean
        ui.surgeReady?.(false);
        const a = script.announce;
        if (a) ui.bossNote?.(a.title, a.sub, a.tone ?? 'gold', a.dur ?? 2.0);
        script.onStart?.(model, player, { side: cineSide, B });
      } else {
        phase = 'approach';
      }
    }
  } else if (phase === 'flythrough') {
    updateEntrance(dt, player, time);
  } else if (phase === 'approach') {
    approachT += dt;
    const k = Math.min(approachT / B.approachTime, 1);
    const e = easeInOut(k);
    pose.x = start.x + (0 - start.x) * e;
    pose.rel = start.rel + (B.settleGap - start.rel) * e;
    // Arc up and over the player ONLY on a behind-approach (so it never clips the
    // dragon); side/above/below travel straight in (the y descent/ascent IS the arc).
    const arc = (def.approachFrom == null || def.approachFrom === 'behind') ? Math.sin(k * Math.PI) * 6 : 0;
    pose.y = start.y + (B.fightHeight - start.y) * e + arc;
    if (k >= 1) enterFight();
  } else if (phase === 'fight' && debugSetpiecePin) {
    // Capture-only: freeze a SETPIECE pose at a fixed path parameter so the crop tool
    // can shoot it as a still. By default the GROUP holds station (the crop just wants
    // the model's per-beat pose, e.g. ASHTALON's stoop wing-tuck). A pin with
    // `moveGroup` also applies the path's group TRANSLATION — EITHERWING's close pass IS
    // the group diving past the camera, so its money frame needs the real rel/x/y.
    const p = SETPIECE_PATHS[debugSetpiecePin.id]?.(debugSetpiecePin.k);
    if (p && debugSetpiecePin.moveGroup) { pose.x = p.x; pose.y = p.y; pose.rel = p.rel; }
    else if (p) { pose.x = 0; pose.y = B.fightHeight; pose.rel = B.settleGap; }
    model.setSetpiece?.(Math.sin(debugSetpiecePin.k * Math.PI), { id: debugSetpiecePin.id });
    model.setCharge(0);
  } else if (phase === 'fight' && debugChargePin >= 0) {
    // Capture-only: freeze the boss square-on and HOLD the contracted mantle pose
    // at the pinned charge level so the crop tool can shoot the wind-up silhouette
    // as a still (the live charge is too transient to catch headless). No firing.
    pose.rel = B.settleGap; pose.x = 0; pose.y = B.fightHeight;
    model.setAttackTell?.('aimed');
    model.setCharge(debugChargePin);
  } else if (phase === 'fight' && debugEntrancePin != null && (def.entrance || def.cinematicEntrance)) {
    // Capture-only: freeze a scripted ENTRANCE pose at a fixed clock u so the crop tool
    // can shoot the Baton Cross (twins bracketing, eye mid-cross, scissor) as a still.
    const script = ENTRANCE_SCRIPTS[def.entrance ?? 'overtake'];
    if (script) {
      const u = debugEntrancePin;
      const ctx = { AX: player.position.x, AY: player.position.y, S: 1, B, sc: def.scale ?? 1.5 };
      const p = script.path(u, ctx); pose.x = p.x; pose.y = p.y; pose.rel = p.rel;
      model.setSetpiece?.(script.tuck ? script.tuck(u, ctx) : 0);
      model.setCharge?.(0);
      cineYaw = script.yaw ? script.yaw(u, ctx, pose, player) : (script.initYaw ?? null);
      if (script.gaze) { const g = script.gaze(u, ctx, pose, player); model.setGaze?.(g.gx, g.gy); }
      script.onFrame?.(u, ctx, pose, player, model, time);
      if (script.camera) cameraCtl.setOvertake?.(script.camera(u, pose, player, ctx));
    }
  } else if (phase === 'fight') {
    if (setpieceT >= 0 && !shielded) {
      // Scripted station-leave beat (def-gated; see SETPIECE_PATHS). Attacks +
      // rider fire were held past its duration when it armed, and pending was
      // wiped by the shield break that armed it — a quiet, capture-safe pass.
      setpieceT += dt;
      const k = Math.min(setpieceT / setpieceDef.dur, 1);
      const p = SETPIECE_PATHS[setpieceDef.id](k);
      pose.x = p.x; pose.y = p.y; pose.rel = p.rel;
      // Whoosh as a close pass crosses toward the camera (EITHERWING's flyby dives past
      // the player). Fires once per inbound crossing of rel≈8, never every frame.
      if (pose.rel < 8 && prevPassRel >= 8) sfx.nearMiss?.();
      prevPassRel = pose.rel;
      // Pass the setpiece def so a model can respond per-beat (ASHTALON ignores
      // the 2nd arg; MARROWCOIL reads it to tell a fly-through pass — cage OPEN —
      // from its Closing-Ribs dread — cage CONSTRICTING).
      model.setSetpiece?.(Math.sin(k * Math.PI), setpieceDef);   // pose spread eases in and back out
      if (k >= 1) clearSetpiece();
    } else {
      if (setpieceT >= 0) clearSetpiece();   // shield rose mid-beat: abort cleanly
      // Hold station ahead and "fly backward"; gentle strafe/bob keeps it alive.
      pose.rel = B.settleGap;
      pose.x = Math.sin(time * 0.7) * 5.0;
      pose.y = B.fightHeight + Math.sin(time * 1.3) * 0.8;
    }

    // Spell-card timer (§5f): the on-screen card countdown, now a real CAPTURE
    // DEADLINE. When it hits 0: a SURVIVAL card bursts its own seal (the escape
    // hatch, so a weaker player is never hard-walled); a normal card flags
    // `cardExpired` so the eventual result is SURVIVED not CAPTURE — but the phase
    // continues and progress is never blocked.
    if (activeCard && cardTimer > 0) {
      cardTimer = Math.max(0, cardTimer - dt);
      ui.bossCardTimer?.(cardTimer, activeCard.timer ?? 24);
      if (cardTimer <= 0) {
        if (activeCard.survival && shielded) breakShield(player);
        else { cardExpired = true; ui.bossCardExpire?.(); }
      }
    }

    // Manual Surge unleash (Space / 2nd-finger tap) — the shield-breaker.
    const ready = !game.feverActive && game.consecutiveRings >= game.feverThreshold;
    if (input.surgeTap) {
      input.surgeTap = false;
      if (ready) activateSurge(player);
    }
    ui.surgeReady?.(ready);
    // Enticing looping hum while Surge is ready (and not yet unleashed): "tap me".
    if (ready !== wasReady) {
      if (ready) sfx.surgeReadyStart?.(); else sfx.surgeReadyStop?.();
      wasReady = ready;
    }

    // Health-bar fill-up flourish on settle (0 → current hp fraction).
    if (hpRevealT > 0) {
      hpRevealT -= dt;
      model.setHealth((1 - Math.max(hpRevealT, 0) / HP_REVEAL) * (hp / hpMax));
    }

    // Streamed sub-volleys (tunnel / spiral stream) fire on their own clock.
    resolveEmitOrigin(player);   // keep the body-origin current for deferred sub-volleys
    for (let i = pending.length - 1; i >= 0; i--) {
      pending[i].t -= dt;
      if (pending[i].t <= 0) { pending[i].fire(); pending.splice(i, 1); }
    }

    riderTimer -= dt;
    if (riderTimer <= 0) {
      riderTimer = B.riderShotInterval * (surge ? B.surgeRiderMult : 1);   // double-fire in Surge
      fireRiderShot(player);
    }

    // Reflect: a barrel roll's i-frames swat nearby reflectable (amber) bullets
    // back at the boss. A bullet swatted right on top of you is a PERFECT parry
    // (more damage). Announce + ring the parry chime once per roll (streak climbs).
    if (player.rollInvuln > 0) {
      // In Surge, EVERY bullet is reflectable (not just the amber ones).
      const r = reflectBossBullets(player, B.reflectWindow, B.settleGap, pose.x, pose.y, surge);
      if (r.total > 0) {
        tmp.set(player.position.x, player.position.y, -player.dist);
        burst(tmp, r.perfect > 0 ? 0xaef0ff : 0x66ddff, { count: 7, speed: 16, size: 0.85, life: 0.4 });
        cameraCtl.shake?.(r.perfect > 0 ? 0.5 : 0.3);
        if (!rollParried) {
          rollParried = true;
          const perfect = r.perfect > 0;
          if (perfect) game.parryPerfectStreak++; else game.parryPerfectStreak = 0;
          // PERFECT-PARRY HEAL (§5i C, adopted GLOBALLY — lands with the slot-5
          // parry-economy rollout): a perfect parry restores 1 HP pip (one heart),
          // capped 3/fight — the Furi law (make parry players feel loved; the cap
          // kills farming). Guarded on health < max so it never touches a player who
          // isn't hurt (and the immortal test-player is never capped down to max).
          if (perfect && perfectHealsUsed < 3 && game.health < CONFIG.healthMax) {
            game.health = Math.min(CONFIG.healthMax, game.health + CONFIG.healthMax / 4);
            perfectHealsUsed++;
            ui.bossNote?.('PERFECT — +1 ♥', '', 'gold', 1.4);
            emit('perfectHeal', { used: perfectHealsUsed });
          }
          game.parryStreak++;
          const streak = perfect ? game.parryPerfectStreak : game.parryStreak;
          const pts = Math.round(CONFIG.BOSS.parryScore * (perfect ? 1.7 : 1) * game.scoreMult);
          game.score += pts;
          ui.parryPopup?.(pts, perfect, streak);
          sfx.parry?.(perfect, streak);
          emit('bossReflect', { perfect, streak });
        }
      }
    } else {
      rollParried = false;
    }

    if (shielded) {
      // Armour is up: the boss FLOODS graze-bait — dense rings streaming close past
      // you with a threadable lane. Weaving them tight is how you charge the Surge
      // that bursts the armour (survival-by-grazing IS the break mechanic). Chip
      // does nothing here, so fleeing makes zero progress — you must come in tight.
      // Rhythm: a CLUSTER of a few rings to thread, then a BREAK (a clear window
      // to reposition if you got shut out of a lane), then the next cluster. A
      // non-stop stream punished a single missed entry — the break lets you back in.
      baitTimer -= dt;
      if (baitTimer <= 0) {
        if (baitResting) {
          baitResting = false;
          baitLeft = quality < 0.75 ? 3 : 4;   // rings per cluster
        }
        fireGrazeBait(player, time);
        baitLeft--;
        if (baitLeft <= 0) { baitResting = true; baitTimer = 1.8; }   // reposition break
        else baitTimer = 0.42;                                        // within a cluster
      }
    } else if (chargeT > 0) {
      // Telegraph wind-up: the boss charges (maw flares red), THEN releases.
      chargeT -= dt;
      model.setCharge(1 - Math.max(chargeT, 0) / chargeDur);
      if (chargeT <= 0) {
        model.setCharge(0);
        model.setAttackTell?.(null);   // wind-up pose releases with the shot
        model.flash(0.9);
        tmp.set(pose.x, pose.y, -(player.dist + pose.rel));
        burst(tmp, bulletColor, { count: 10, speed: 14, size: 0.9, life: 0.4 });   // "shots away" muzzle flash
        executeAttack(curAttack, player);
        const ph = def.phases[phaseIdx];
        // §5i: a rhythm def uses the machine's authored rest (its signature's
        // fingerprint, stashed when the attack was picked); else the legacy roll.
        attackTimer = (rhythm && rhythmRest != null) ? rhythmRest : rand(ph.cadence[0], ph.cadence[1]);
        rhythmRest = null;
      }
    } else if (pending.length === 0) {
      // Idle between attacks → count down, then begin telegraphing the next one.
      attackTimer -= dt;
      if (attackTimer <= 0) {
        const ph = def.phases[phaseIdx];
        // §5i: the phrase machine picks the attack AND the rest that follows it
        // (amber-floor enforced inside); a def without a rhythm keeps uniform pick.
        if (rhythm) {
          // Pass the live music beat grid (null when muted/headless) so a def with
          // a `ticket` can beat-lock its phrasing (§5i fairness subsidy).
          const step = rhythm.nextStep(phaseIdx, ph.attacks, Math.random, getBeatClock());
          curAttack = step.id;
          rhythmRest = step.rest;
        } else {
          curAttack = ph.attacks[(Math.random() * ph.attacks.length) | 0];
        }
        chargeDur = curAttack === 'curtain' ? B.telegraphWall
          : (SUSTAINED.has(curAttack) ? B.telegraphSustained : B.telegraphInstant);
        chargeT = chargeDur;
        // Optional model hook: which gesture family to wind up in (the
        // colossus's hands point/sweep/spin/clench/slam per attack id).
        model.setAttackTell?.(curAttack);
        sfx.boostStart?.();   // a short charge whoosh as the wind-up begins
      }
    }
  } else if (phase === 'dying') {
    dyingT += dt;
    model.setDissolve(dyingT / B.deathTime);
    if (Math.random() < 0.6) {
      tmp.set(pose.x + (Math.random() - 0.5) * 4, pose.y + (Math.random() - 0.5) * 4,
        -(player.dist + pose.rel));
      burst(tmp, def.glow, { count: 5, speed: 12, size: 1.0, life: 0.7 });
    }
    if (dyingT >= B.deathTime) { endEncounter(player); return; }
  }

  placeGroup(player, time, dt);
}

function placeGroup(player, time, dt) {
  if (!group) return;
  group.visible = phase !== 'warn';   // stay hidden behind while the warning flashes
  // Smooth the group's lateral/vertical placement through the fight so regime switches (entrance→
  // fight station-bob, station↔setpiece) don't jump in one frame; rel stays direct (crisp dive).
  if (poseSmooth) {
    const kx = Math.min(1, (dt || 0.016) * 12);
    poseSX += (pose.x - poseSX) * kx;
    poseSY += (pose.y - poseSY) * kx;
    group.position.set(poseSX, poseSY, -(player.dist + pose.rel));
  } else {
    group.position.set(pose.x, pose.y, -(player.dist + pose.rel));
  }
  // Face the player (local +z = front maw, world +z = toward the player) with a
  // little menacing yaw/roll wobble. During the cinematic entrance, cineYaw owns
  // the yaw instead (it faces its dive line, then wheels 180° to face you).
  if (cineYaw != null) group.rotation.set(0, cineYaw, 0);
  else {
    // Ease the wobble amplitude in after a cinematic entrance so the group doesn't snap from its
    // settled square facing (cineYaw≈0) to the full sin-wobble in one frame. Full within ~0.6s.
    fightWobbleT += dt || 0.016;
    const w = Math.min(1, fightWobbleT / 0.6);
    group.rotation.set(0, Math.sin(time * 0.5) * 0.12 * w, Math.sin(time * 0.9) * 0.08 * w);
  }
  // GAZE FEED (optional model hook): normalized offset of the player relative to
  // the boss's facing axis, in WORLD axes — placeGroup keeps rotation near-
  // identity so world≈local, and the model handles its own local conversion.
  // Skipped during 'warn' (the boss is still hidden then; nothing to sell yet) and
  // during the flythrough (updateFlythrough drives the tracking gaze itself).
  if (phase !== 'warn' && phase !== 'flythrough') {
    const nx = Math.max(-1, Math.min(1, (player.position.x - pose.x) / 12));
    const ny = Math.max(-1, Math.min(1, (player.position.y - pose.y) / 12));
    model.setGaze?.(nx, ny);
  }
}

// ---- Surge (manual) + the per-phase shield ---------------------------------

// Unleash Dragon Surge: the hyper (all-reflect + double rider, see updateBoss)
// AND the shield-breaker. Charged by grazing; fired by the player (Space / tap).
function activateSurge(player) {
  game.feverActive = true;
  game.feverTimer = CONFIG.feverDuration;
  game.markSurgeSeen();
  ui.surgeReady?.(false);
  // ONE surge callout — "REFLECT ANYTHING" (the useful instruction), at the bottom,
  // held a little longer. No duplicate "DRAGON SURGE" popup.
  ui.bossNote?.('⚡ REFLECT ANYTHING ⚡', '', 'fever', 3.0);
  sfx.feverStart?.();
  sfx.surgeReadyStop?.();      // they answered the "tap me" hum — silence it
  wasReady = false;
  cameraCtl.shake?.(0.5);
  emit('surge');
  // Kick off the mouth-beam cinematic: a charge wind-up, then the beam strikes and
  // bursts the shield (breakShield fires at the moment of impact, not now).
  surgeSeq = { phase: 'charge', t: 0 };
}

// A Surge unleash bursts the shield → advance to the next phase (or kill on the
// last). The shield is the ONLY thing that lets you progress — chip/reflect alone
// can't push past a phase floor.
function breakShield(player) {
  shielded = false;
  model.shatterShield?.();        // the bubble breaks into flying shards
  model.setShieldVisible?.(false);
  model.flash(1.0);
  sfx.shieldShatter?.();          // the physical "barrier breaks" glass shatter
  cameraCtl.shake?.(1.6);
  tmp.set(pose.x, pose.y, -(player.dist + pose.rel));
  burst(tmp, 0xffffff, { count: 26, speed: 24, size: 1.4, life: 0.7 });
  burst(tmp, def.glow, { count: 20, speed: 16, size: 1.1, life: 0.8 });
  sfx.phase?.(true, 1);
  // PHASE-TRANSITION HOLD: wipe any sustained sub-volleys still streaming in from
  // the pre-burst attack (a tunnel/iris mid-flight would otherwise land right on
  // top of the phase transition), then guarantee a capture-safe window before the
  // new phase's first attack can telegraph.
  pending.length = 0;
  attackTimer = Math.max(attackTimer, 1.6);
  // The surviving-the-phase card resolves the instant its shield bursts: capture
  // if the whole card was hitless. The next phase's card arms right after.
  endCard();
  const next = def.phases[phaseIdx + 1];
  if (next) {
    phaseIdx++;
    // §5i: restart the phrase state at the phase seam (crescendo re-ramps per
    // card; the ambush/wall cluster restarts clean) — the amber-floor clock is
    // kept continuous across the transition inside the machine.
    rhythm?.reset();
    rhythmRest = null;
    beginCard(phaseIdx);
    ui.bossNote?.(`PHASE ${phaseIdx + 1}`, def.name, 'phase', 2.6);
    emit('bossPhase', { phase: phaseIdx + 1 });
    // Def-gated setpiece: entering this phase plays a scripted station-leave beat.
    // A QUIET setpiece (default) holds the attack + rider clocks past its duration
    // for a capture-safe pass; a MOVING setpiece (§5e moving-station branch) leaves
    // the clocks alone, so the boss keeps firing from wherever the path carries it
    // (ASHTALON's circling pass + stooping strike). Supports the legacy single
    // `def.setpiece` and the per-phase `def.setpieces` array (voidmaw/stormrend
    // carry neither → byte-unchanged, the lifecycle test asserts they never arm).
    armSetpieceForPhase(phaseIdx);
    // Constriction showpiece: from this phase on, the storm walls slide in and
    // the arena narrows (the fill patterns + player clamp both track arenaHW).
    if (def.constrictPhase != null && phaseIdx >= def.constrictPhase) {
      arenaTargetHW = CONSTRICT_HW;
      ui.bossNote?.('⛈  THE ARENA NARROWS  ⛈', def.name, 'gold', 2.6);
      cameraCtl.shake?.(0.8);
    }
  } else {
    pendingDeath = true;   // final shield burst → death (resolved next frame)
  }
}

// ---- Attacks ----------------------------------------------------------------

// BODY-ORIGIN emitter (combat-feel): the head-origin patterns spawn from a named
// body part (def.muzzle, e.g. MARROWCOIL's 'skullGroup') instead of the boss
// centre, so bullets visibly come FROM the boss. Resolved fresh each frame (the
// boss bobs; deferred stream/secondWave sub-volleys must read the current spot)
// and converted to the bullet frame: world (wx,wy,wz) → (x, y, rel=-wz-dist).
// Falls back to the pose centre when a boss names no muzzle — so un-opted bosses
// are byte-unchanged. `def.muzzle` is data (bossDefs.js); `partWorldPos` is on
// every model handle (bossModel.js).
const emitOrigin = { x: 0, y: 0, rel: 0 };
const _muzV = new THREE.Vector3();
function resolveEmitOrigin(player) {
  const w = def && def.muzzle && model && model.partWorldPos && model.partWorldPos(def.muzzle, _muzV);
  if (w) { emitOrigin.x = w.x; emitOrigin.y = w.y; emitOrigin.rel = -w.z - player.dist; }
  else { emitOrigin.x = pose.x; emitOrigin.y = pose.y; emitOrigin.rel = pose.rel; }
}

// Solve the lateral velocity that puts a bullet on a target point as it closes,
// FROM the current emitter origin (head, or pose centre when un-opted).
function aimVel(targetX, targetY, closing) {
  const t = Math.max(emitOrigin.rel / closing, 0.05);
  return { vx: (targetX - emitOrigin.x) / t, vy: (targetY - emitOrigin.y) / t };
}

// Resolve an attack id to bullets. Instant patterns fire one volley now; sustained
// patterns push timed sub-volleys onto `pending` so they stream over ~1.5–2s.
function executeAttack(id, player) {
  resolveEmitOrigin(player);   // head-origin patterns spawn from the body part
  const closing = B.bulletSpeed;
  // Very light lead only — a strongly-predictive aim makes the shot feel like it
  // homes (you can't dodge by moving). Keep it near where the player IS.
  const lead = 0.08;
  const px = player.position.x + player.velocity.x * lead;
  const py = player.position.y + player.velocity.y * lead;
  // Area patterns (tunnel / spiral) follow the player's side of the lane so you
  // can't just park at the edge and skip them; aimed/fan already track you.
  const anchorX = Math.max(-8, Math.min(8, player.position.x * 0.7));

  if (id === 'aimed') {
    // Three distinct bullets to dodge around, not one dense overlapping wall.
    // Aimed/fan are REFLECTABLE (amber) — the precision shots reward a parry.
    for (let i = -1; i <= 1; i++) {
      const v = aimVel(px + i * 1.6, py, closing);
      emitBoss(emitOrigin.x, emitOrigin.y, v.vx, v.vy, -closing, true, null, 1, null, emitOrigin.rel);
    }
  } else if (id === 'fan') {
    const n = quality < 0.75 ? 5 : 7;
    for (let i = 0; i < n; i++) {
      const spread = (i / (n - 1) - 0.5) * 16;   // ±8m across the lane around the player
      const v = aimVel(px + spread, py, closing);
      emitBoss(emitOrigin.x, emitOrigin.y, v.vx, v.vy, -closing, true, null, 1, null, emitOrigin.rel);
    }
  } else if (id === 'spiral') {
    // Instant radial burst: bullets fly OUTWARD from the boss as they close.
    const n = quality < 0.75 ? 8 : 11;
    spiralPhase += 0.6;
    const slow = closing * 0.78;
    for (let i = 0; i < n; i++) {
      const a = spiralPhase + (i / n) * Math.PI * 2;
      emitBoss(anchorX, B.fightHeight, Math.cos(a) * 9, Math.sin(a) * 9, -slow);
    }
  } else if (id === 'tunnel') {
    // A succession of bullet-RINGS rushing at you — a glowing tube to fly down,
    // its centre weaving side to side so you follow the safe lane (rib-run feel).
    // TUTORIAL boss: keep the tunnel short + gently-weaving so the tail of the fight
    // doesn't become a wall of consecutive rings. Later bosses lengthen/tighten it.
    const rings = quality < 0.75 ? 3 : 4;
    const m = quality < 0.75 ? 14 : 22;   // denser ring → a clearer circle, easier to tell apart
    const slow = closing * 0.85;
    // Small rings (radius < grazeR) so flying the centre still SKIMS the whole
    // ring → constant grazing; a big ring let you sit in a dead-safe hole.
    for (let k = 0; k < rings; k++) {
      const cx = anchorX + Math.sin(k * 0.7) * 4;   // centred on you, then weaves → you follow
      const b = activeBand[k % activeBand.length];   // successive rings band by brightness+size
      pending.push({ t: k * 0.46, fire: () => fireRing(cx, B.fightHeight, 3.7, m, slow, b.c, b.s) });
    }
  } else if (id === 'spiralStream') {
    // A rotating emitter: arms of bullets sweep around over time — read the spin.
    const steps = quality < 0.75 ? 10 : 14;
    const slow = closing * 0.8;
    for (let k = 0; k < steps; k++) {
      const a = spiralPhase + k * 0.45;
      pending.push({ t: k * 0.12, fire: () => {
        for (let arm = 0; arm < 2; arm++) {
          const ang = a + arm * Math.PI;
          emitBoss(anchorX, B.fightHeight, Math.cos(ang) * 8, Math.sin(ang) * 8, -slow);
        }
      } });
    }
    spiralPhase += steps * 0.45;
  } else if (id === 'curtain') {
    // CURTAIN — a full wall across the lane minus ONE vertical safe lane, placed
    // away from you so you must commit early. Fleeing up/down/out stays inside
    // the wall: the lane is the only answer. One band colour per wall so stacked
    // volleys read apart.
    const hw = Math.min(12, arenaHW - 1);
    const slot = 3.0;                              // generous lane: gentle 2nd-boss wall
    const stepX = quality < 0.75 ? 3.2 : 2.4;
    const stepY = quality < 0.75 ? 4.6 : 3.4;
    // Gap sits toward your opposite side (commit early) but not all the way across —
    // 5.5m, not 7m, so the traversal is fair to read + fly in the reaction window.
    const gap = Math.max(-hw + slot, Math.min(hw - slot, -Math.sign(player.position.x || 1) * 5.5));
    // Slower close than the aimed/fan shots: a full wall must be READ (find the gap)
    // AND traversed, so it needs a longer reaction window than a bullet you sidestep.
    const slow = closing * 0.66;
    const b = activeBand[bandIdx++ % activeBand.length];
    for (let x = -hw; x <= hw; x += stepX) {
      if (Math.abs(x - gap) < slot) continue;
      for (let y = CONFIG.laneMinY + 2.5; y <= CONFIG.laneMaxY - 2; y += stepY) {
        emitBoss(x, y, 0, 0, -slow, false, b.c, b.s);
      }
    }
  } else if (id === 'movingGap') {
    // MOVING-GAP WALL — timed rows (two y-bands each) whose safe gap SLIDES
    // sideways between rows: you can't pre-camp the gap, you track it in time.
    const rows = quality < 0.75 ? 4 : 5;
    const n = quality < 0.75 ? 6 : 10;   // low tier stays under the visibleCap floor
    const dir = Math.random() < 0.5 ? 1 : -1;
    const g0 = Math.max(-6, Math.min(6, player.position.x));
    const slow = closing * 0.9;
    for (let k = 0; k < rows; k++) {
      const gap = Math.max(-9, Math.min(9, g0 + dir * 2.6 * k));
      const b = activeBand[k % activeBand.length];
      pending.push({ t: k * 0.3, fire: () => {
        const hw = Math.min(12, arenaHW - 1), sx = (hw * 2) / n;
        // Bands track the player's LIVE height so the wall can't be out-CLIMBED —
        // flying high/low just keeps you sandwiched; the moving X gap is the answer.
        const cy = Math.max(CONFIG.laneMinY + 3, Math.min(CONFIG.laneMaxY - 3, player.position.y));
        for (let x = -hw; x <= hw; x += sx) {
          if (Math.abs(x - gap) < 2.6) continue;
          for (const y of [cy - 2.4, cy + 2.4]) {
            emitBoss(x, y, 0, 0, -slow, false, b.c, b.s);
          }
        }
      } });
    }
  } else if (id === 'iris') {
    // IRIS — contracting rings: each ring shrinks toward the centre as it closes,
    // so camping an edge fails; the safe zone is the middle. The showpiece read.
    const rings = quality < 0.75 ? 3 : 4;
    const m = quality < 0.75 ? 12 : 16;
    const rad = 10, contract = 0.62;
    const slow = closing * 0.8;
    const inSpd = (rad * contract) / (pose.rel / slow);   // arrives at rad×(1−contract) ≈ 3.8
    const cx = anchorX, cy = B.fightHeight;
    for (let k = 0; k < rings; k++) {
      const b = activeBand[k % activeBand.length];
      pending.push({ t: k * 0.4, fire: () => {
        for (let i = 0; i < m; i++) {
          const a = (i / m) * Math.PI * 2;
          emitBoss(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad,
            -Math.cos(a) * inSpd, -Math.sin(a) * inSpd, -slow, false, b.c, b.s);
        }
      } });
    }
  } else if (id === 'stream') {
    // STREAM — a tracking hose: re-aims at your LIVE position every tick, so one
    // sidestep isn't enough — peel away in a smooth arc while it fires. Every 4th
    // tick is AMBER-tipped (reflectable): the §5i C.1 parry-diet hotfix that makes
    // the tracking hose a parry-carrier, so stream-heavy dread phases (ASHTALON P3,
    // MARROWCOIL P3) still meet the AMBER FLOOR (≥1 amber volley per rolling 12s).
    const ticks = quality < 0.75 ? 10 : 14;
    const slow = closing * 0.95;
    for (let k = 0; k < ticks; k++) {
      const amber = (k % 4) === 3;   // amber tip every 4th tick (the parry beat)
      pending.push({ t: k * 0.14, fire: () => {
        const v = aimVel(player.position.x, player.position.y, slow);
        emitBoss(emitOrigin.x, emitOrigin.y, v.vx, v.vy, -slow, amber, null, 1, null, emitOrigin.rel);
      } });
    }
  } else if (id === 'secondWave') {
    // SECOND WAVE — a spread, then a half-gap-offset second spread a beat later:
    // the spot you just dodged into becomes unsafe. Kills "dodge once, relax".
    const n = quality < 0.75 ? 7 : 9;
    const span = 15;
    const px0 = player.position.x;
    const slow = closing * 0.92;
    for (let w = 0; w < 2; w++) {
      const off = w * (span / n / 2);
      const b = activeBand[w % activeBand.length];
      pending.push({ t: w * 0.55, fire: () => {
        const ty = player.position.y;   // track the player's height so a vertical dodge can't skip the wave
        for (let i = 0; i < n; i++) {
          const sx = px0 + (i / (n - 1) - 0.5) * span + off;
          const v = aimVel(sx, ty, slow);
          emitBoss(emitOrigin.x, emitOrigin.y, v.vx, v.vy, -slow, false, b.c, b.s, null, emitOrigin.rel);
        }
      } });
    }
  } else if (id === 'crossfire') {
    // CROSSFIRE — two flanking emitters fire converging aimed spreads: no single
    // flee direction is clean. Precision shots → REFLECTABLE (amber): parry fuel.
    const each = quality < 0.75 ? 4 : 5;
    const slow = closing * 0.95;
    for (const ex of [-10, 10]) {
      for (let i = 0; i < each; i++) {
        const off = (i / (each - 1) - 0.5) * 5;
        const t = Math.max(pose.rel / slow, 0.05);
        emitBoss(ex, pose.y, (px + off - ex) / t, (py - pose.y) / t, -slow, true);
      }
    }
  }
}

// Graze-bait (armour phase): small rings centred on the player and weaving, so the
// bullets stream CLOSE past you (radius < grazeR → the whole ring grazes) with a
// threadable lane. Weaving them tight charges the Surge that bursts the armour.
// Each successive ring colour-BANDS so you can read them apart as they stack.
function fireGrazeBait(player, time) {
  const cx = Math.max(-8, Math.min(8, player.position.x)) + Math.sin(time * 1.3) * 3;
  const cy = B.fightHeight + Math.sin(time * 0.9) * 1.5;
  const b = activeBand[bandIdx++ % activeBand.length];
  // Bait gets a DARK core (hollow "donut") — the only emission that does. Every
  // other pattern keeps the default white "hot disc" core (2.4): bait must read
  // as a DIFFERENT thing from danger, on top of the brightness/size banding.
  // Ring radius per-boss (default 3.6): a boss whose body grew (EITHERWING r9) makes the
  // fixed ring read small + tight to thread, so it opts into a WIDER ring — still ≤ grazeR
  // (≈4.15, which already folds in the bullet radius) so flying the centre skims the WHOLE
  // ring and charges Surge, just with a roomier safe lane. Shipped bosses stay byte-identical.
  const baitR = def.grazeBaitR ?? 3.6;
  fireRing(cx, cy, baitR, quality < 0.75 ? 11 : 15, B.bulletSpeed * 0.8, b.c, b.s, 0x2a1020);   // denser = clearer circle
}

// A ring (circle outline) of bullets centred on (cx, cy) that closes straight in.
// A faint hoop guide traces the same shape in lockstep (spawned at the bullets'
// own rel/vrel so a straight-closing ring's hoop is exact, not approximate).
function fireRing(cx, cy, radius, m, vrel, color, sizeMult = 1, coreColor = null) {
  spawnBossRingHoop(cx, cy, radius, pose.rel, -vrel, color ?? bulletColor);
  for (let i = 0; i < m; i++) {
    const a = (i / m) * Math.PI * 2;
    emitBoss(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, 0, 0, -vrel, false, color, sizeMult, coreColor);
  }
}

// Low-level boss-bullet spawn: starts at (x, y) on the boss's plane (rel=settleGap)
// with the given velocity. `color`/`sizeMult` override for banded rings; else amber
// if reflectable, otherwise the boss's magenta danger colour. `coreColor` overrides
// the white "hot disc" centre — ONLY graze-bait passes one (the dark "donut" read).
function emitBoss(x, y, vx, vy, vrel, reflectable = false, color = null, sizeMult = 1, coreColor = null, originRel = null) {
  spawnBossBullet({
    owner: 'boss', x, y, rel: originRel ?? pose.rel,
    vx, vy, vrel, color: color ?? (reflectable ? REFLECT_COLOR : bulletColor), reflectable,
    dmg: B.bulletDamage, r: B.bulletRadius * sizeMult, life: 6,
    coreColor: coreColor ?? 0xffffff,
  });
}

// Rider auto-attack: a homing chip shot fired from beside the player up at the boss.
function fireRiderShot(player) {
  const ox = player.position.x + 0.6;
  const oy = player.position.y + 0.4;
  const t = Math.max((pose.rel - 1.5) / B.bossSpeed, 0.05);
  spawnBossBullet({
    owner: 'rider', x: ox, y: oy, rel: 1.5,
    vx: (pose.x - ox) / t, vy: (pose.y - oy) / t, vrel: B.bossSpeed,
    targetRel: pose.rel, tx: pose.x, ty: pose.y,
    color: 0x8fe9ff, dmg: B.riderShotDamage, r: 0.45, life: 4,
  });
}

function damageBoss(amount, kind) {
  if (phase !== 'fight') return;
  if (shielded) {
    // Chip/reflect PINGS off the armour — a clang + spark telegraph "a different
    // thing is needed now" (charge Surge), not "keep hitting it".
    sfx.shieldPing?.();
    if (group && Math.random() < 0.5) burst(group.position, def.glow, { count: 4, speed: 10, size: 0.7, life: 0.3 });
    return;
  }
  hp = Math.max(0, hp - amount);
  model.flash(0.6);
  model.hurt?.(0.6);   // PAIN reaction (EITHERWING's recoil/dart) — only on real damage, not on the boss's own attack flash
  if (hpRevealT <= 0) model.setHealth(hp / hpMax);   // don't fight the fill-up flourish
  emit('bossHit', { hp, hpMax, frac: hp / hpMax, kind });

  // Reached the phase floor → raise the shield. Chip/reflect can't push past it;
  // the player must charge Surge (by grazing) and unleash it to burst through.
  const floor = def.phases[phaseIdx + 1]?.atFrac ?? 0;
  if (hp / hpMax <= floor + 1e-4) {
    shielded = true;
    hp = Math.max(hp, floor * hpMax);
    model.setHealth(hp / hpMax);
    model.setShieldVisible?.(true);
    model.setCharge(0);
    model.setAttackTell?.(null);   // no wind-up pose while the armour holds
    // Drop any in-flight attack; graze-bait takes over. Prime the cluster state so
    // the FIRST cluster is full-length (resting=true + timer 0 → next tick opens it).
    chargeT = 0; pending.length = 0; baitTimer = 0; baitResting = true; baitLeft = 0;
    model.flash(1.0);
    cameraCtl.shake?.(0.8);
    ui.bossNote?.('⛨  SHIELDED  ⛨', 'FLY THROUGH THE RINGS → CHARGE SURGE', 'gold', 3.4);
    sfx.milestone?.();
    emit('bossShield', { phase: phaseIdx + 1 });
  }
}

export function resetBoss() {
  clearSetpiece();
  // Release the cinematic entrance if we tore down mid-flythrough (game over during
  // the overtake): drop the slow-mo, the camera hijack, and the facing override.
  cineYaw = null; cineSkip = false; entranceId = null; poseSmooth = false; fightWobbleT = 1e9;
  releaseCineSlow();
  cameraCtl.setOvertake?.(null);
  model?.setEyeLock?.(false);
  ui.cinematicHold?.(false);
  // Hard reset (game over / new run): if a fight was live and NOT already won,
  // the player died to this boss — accrue the death-to (§5h; slot 9 reads it).
  if (active && def && phase !== 'dying') recordBossLedger(def.id, { death: true });
  activeCard = null; cardTimer = 0;
  ui.bossCardClear?.();
  if (group && scene) { scene.remove(group); model && model.dispose && model.dispose(); }
  resetBossBullets();
  active = false;
  phase = 'idle';
  group = null; model = null; def = null;
  pendingDeath = false;
  rollParried = false;
  shielded = false;
  if (reticle) reticle.visible = false;
  reticleOn = 0; reticleTarget = 0;
  if (reticleTrack) { reticleTrack.geometry.setDrawRange(0, 0); reticleFill.geometry.setDrawRange(0, 0); }
  if (reticleHead) reticleHead.visible = false;
  if (surgeAura) surgeAura.visible = false;
  if (surgeBeam) surgeBeam.visible = false;
  surgeSeq = null;
  sfx.surgeCrackleStop?.();
  sfx.surgeReadyStop?.();
  wasSurge = false; wasReady = false;
  ui.surgeReady?.(false);
  ui.bossNoteClear?.();
  ui.staminaBoss?.(false);   // restore the stamina bar if a fight was torn down
  pending.length = 0;
  chargeT = 0;
  curAttack = null;
  game.inBoss = false;
  activeBand = BAND;
  arenaHW = arenaTargetHW = CONFIG.laneHalfWidth;
  game.bossArenaHW = null;
  if (wallL) { wallL.visible = wallR.visible = false; wallMat.opacity = 0; }
  nextBossDist = debugFirstAt ?? B.firstAt;
  encounterIndex = 0;
  // Clear the gauntlet driver (a fresh run re-arms it via startBossRush if in rush).
  rushMode = false; rushQueue = []; rushIndex = 0; rushSolo = false;
}

// Debug/playtest: pull the first encounter in to `dist` metres (e.g. ?boss → a
// boss shortly after takeoff). Persists across runs so each restart re-triggers.
export function setBossDebugFirstAt(dist) {
  debugFirstAt = dist;
  if (!active) nextBossDist = dist;
}

// Debug/playtest: every encounter uses BOSS_ORDER[k] (?bossIdx=k) so the preview
// can summon a specific boss without fighting through the cycle first.
export function setBossDebugDefIdx(k) {
  debugDefIdx = k;
}

// Capture hook (bosscrop): pin the charge/mantle pose at `level` (0..1) so a still
// can be shot of the contracted wind-up silhouette. Pass a negative value to release
// and hand the fight state machine back over.
export function setBossDebugCharge(level) {
  debugChargePin = level;
}

// Capture hook (bosscrop): pin a SETPIECE pose (id + path parameter k) so a still
// can be shot of e.g. the stooping-dive silhouette. Pass null to release.
export function setBossDebugSetpiece(pin) {
  debugSetpiecePin = pin;
}

// Capture hook: pin an ENTRANCE pose at clock u∈[0,1] (the Baton Cross) for a still.
export function setBossDebugEntrance(u) {
  debugEntrancePin = u;
}

// Debug hook: drop straight into a fight (wired under ?debug in main.js).
// `idx` forces a specific BOSS_ORDER entry (?bossIdx=K) for preview judging.
export function forceBoss(player, idx = null) {
  startBossEncounter(player, idx != null ? bossDefForIndex(idx) : undefined);
}

// Capture hook (?debug): fire one LIVE attack volley from the current pose so a
// screenshot tool can catch bullets streaming from the body part + growing in.
// Unlike debugEmitAttack (headless flush), this emits into the live scene/loop.
export function debugFireAttack(id, player) {
  if (!active) return;
  executeAttack(id || 'aimed', player);
}

export function bossDebugState() {
  // chargeLevel: 0 at the start of a wind-up → 1 at full contraction (mirrors the
  // value fed to model.setCharge). The crop tool waits for a HIGH level so it grabs
  // the fully-contracted mantle pose, not an early spread frame (charging is boolean).
  const chargeLevel = chargeDur > 0 && chargeT > 0 ? 1 - Math.max(chargeT, 0) / chargeDur : 0;
  return { active, phase, hp, hpMax, phaseIdx, shielded, bullets: bossBulletCount(), nextBossDist, warnT, approachT, poseRel: pose.rel, poseX: pose.x, poseY: pose.y, setpiece: setpieceT >= 0, charging: chargeT > 0, chargeLevel };
}

// Test seam (headless pattern-budget checks): fire ONE attack volley with its
// streamed sub-volleys flushed immediately. Returns [{ t, bullets: [{x,y}] }]
// per volley (t = the stream offset), so suites can count emissions, estimate
// concurrency, and scan fills for their designed safe lane. Only touches the
// bullet pool + pending (caller resets the pool between attacks).
export function debugEmitAttack(id, player, q = quality) {
  const prevQ = quality;
  quality = q;
  pending.length = 0;
  const volleys = [];
  let seen = 0;
  const take = (t) => {
    const all = debugActiveBullets();
    volleys.push({ t, bullets: all.slice(seen) });
    seen = all.length;
  };
  executeAttack(id, player);
  take(0);
  pending.sort((a, b) => a.t - b.t);
  while (pending.length) { const p = pending.shift(); p.fire(); take(p.t); }
  quality = prevQ;
  return volleys;
}
