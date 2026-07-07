import * as THREE from 'three';
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { ui } from './ui.js';
import { sfx, setSlowMo, getBeatClock, musicKill, musicRestore, bellToll } from './sfx.js';
import { input, focusHeldNow } from './input.js';
import { cameraCtl } from './cameraController.js';
import { burst } from './particles.js';
import { emit, on } from './events.js';
import { clearAhead } from './obstacles.js';
import { bulletGraze } from './collision.js';
import { buildBoss, buildHorizonSeed } from './bossModel.js';
import { makeRhythm } from './bossRhythm.js';
import { ENTRANCE_SCRIPTS } from './entranceScripts.js';
import { BOSSES, BOSS_ORDER, bossDefForIndex, ladderPickDef, ladderTighten } from './bossDefs.js';
import { pickBossKey } from './biomeBoss.js';
import { saveData, persist, recordBossCard, recordBossLedger, bossLedgerStats } from './save.js';
import { BIOMES, biomeIndexAt } from './biomes.js';
import {
  initBossBullets, updateBossBullets, spawnBossBullet, resetBossBullets,
  setBossBulletQuality, bossBulletCount, reflectBossBullets, debugActiveBullets,
  beamContact, setGrazeBonus, cutBossAmbers,
  spawnBossRingHoop,
} from './bossBullets.js';
import { initLockLayer, updateLockLayer, clearLocks, lockAimTarget, lockAimHeld,
  lockCount, notifyHit as lockNotifyHit, consumeAllLocks, requestLoose,
  lanceDmgEach, paintFromParry, dropLockPart, lockPaintedParts, lockHudState, __testBank } from './lockLayer.js';
import { makeGlowTexture } from './util.js';

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
let aimHeldT = 0;              // V1 teach: continuous seconds a line has been held (≥1s = performed)
let aimTeachCd = 0;           // V1 teach: cooldown between re-armed prompts
let lockTeachCd = 0;          // V2 teach: cooldown between re-armed paint prompts (slot 4 P2)
let fightNow = 0;             // fight clock mirror (the updateBoss `time` param) for venting windows
const amberVent = new Map();  // part → fight-time until which its amber volley is in flight (C3 dwell-exemption)
let riderTimer = 0;
// Cinematic overtake entrance (§5f, ASHTALON): a scripted flythrough — rise from
// behind, a bullet-time close pass with the visor/eyes tracking you, pull ahead
// (back to camera), then wheel around to face you. cineYaw overrides placeGroup's
// face-the-player rule for the turn; cineSide = which flank it sweeps.
let cineT = 0;
let entranceId = null;         // §5j: which ENTRANCE_SCRIPTS entry is playing (null = plain approach)
let cineYaw = null;            // null = normal facing; else a scripted world-yaw for the turn-around
let cineRoll = 0;              // scripted bank (rotation.z) — a setpiece path may return `roll`; 0 = level (L155)
let ribEmitT = 0;             // sub-cadence accumulator for the ribThread rib-bullet emit (L155)
let headShotT = 0;            // sub-cadence for the L155 flank head-turn mouth shots
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
let focusVis = 0;              // V5: eased 0..1 heat — the ring tints jade while the FOCUS hold is live
const _focusCol = new THREE.Color();
// ORGAN SHIMMER (PR6): a small pool of additive jade breaths pinned on the
// UNPAINTED paintable organs — the diegetic "this is brandable" cue (owner
// design), independent of the reticle setting. Dark while painted / venting /
// deflected. ≤8 tiny sprites, breathing opacity — inside the overdraw law.
const SHIMMER_POOL = 8;
const shimmers = [];
const _shimV = new THREE.Vector3();
const _brandPopV = new THREE.Vector3();   // brand-pop burst position (lockPaint confirm)
// BRAND TETHER (PR7): one additive LineSegments drawing a faint jade line from
// the dragon's off-shoulder (the wisp launch point) to each BRANDED organ —
// in-world attribution ("this brand is on THAT rib"), a sibling of the shimmer.
// STATE, so it renders with the reticle off. Line class → overdraw-exempt.
const TETHER_MAX = 6;   // cap 6 pips at tier 4+
let tether = null;
const _tethA = new THREE.Vector3();
// The equipped dragon's wisp accent (PR8 Eternal cosmetic) — the lance disc BODY
// + the attribution tether. Jade by default; pushed from main.js after
// createDragon / on equip. Display-only: the lance's white core stays 0xeafff6
// and damage is a separate arg, so the accent never touches behaviour.
let lanceTint = 0x50ffaa;
export function setLanceTint(hex) {
  lanceTint = (hex == null) ? 0x50ffaa : hex;
  _tethCol.setHex(lanceTint);
}
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
// §5b/§5d slot 7 (THRUMSWARM): the swarm's condense/scatter cycle is the PRESSURE-
// OSTINATO puzzle read — CONDENSED = vulnerable + firing, SCATTERED = invulnerable
// (chip only lands while condensed, the turn-taking tell). Def-gated on
// `condenseInvuln`; every value is inert (0/false) for every other archetype.
let staggerT = 0;             // >0 = the queen is STAGGERED (parry job): the swarm is LOCKED condensed (exposed)
let staggerHits = 0;         // amber-volley parries banked toward the next stagger (SCATTER-STAGGER, §5i.C)
let threadCutHits = 0;       // amber parries banked toward the next THREAD-CUT (WEFTWITCH §5i.C, CP2)
let swarmScattered = false;  // last-frame condense read (for the deflect feedback + the ostinato tell)
let swarmDeflectHinted = false;  // one-shot "scattered = untouchable" hint per encounter
let eyeDeflectHinted = false;    // one-shot "submerged = untouchable" hint per encounter (BRINEHOLM)
let condHold = 0;            // seconds the swarm stays CONDENSED past its last shot (bridges the ostinato)
// §5i.B ABSORB-A-COLOR (THRUMSWARM's Calamities graze, def-gated `grazeForm:'absorbColor'`):
// the swarm SHEDS surge-pink motes braided into the magenta stream; weaving in and SOAKing
// them feeds the Surge meter (ANATOMY — the pink is shed by the swarm body). Rendered as ONE
// additive THREE.Points (well inside the ≤2 large-additive-volume overdraw law, L124). A
// SOAK is non-lethal: touching a pink mote absorbs it (bulletGraze → surge). Inert for every
// other archetype (no grazeForm, no shed).
let soakMotes = null;        // the THREE.Points object (one additive draw)
let harvestOffered = false;  // §5i moteHarvest (slot 11): the once-per-phase bloom spent-flag
let soakPos = null;          // its position attribute buffer
const soakList = [];         // active pink motes {x,y,rel,vx,vy,vrel,ttl}
const SOAK_MAX = 16;         // hard cap on-screen (overdraw + fairness)
let soakShed = 0;            // countdown between sheds
// §5e INPUT/POSE RING BUFFER (the roster's ring buffer — ONEWING reuses it at slot 12).
// Records the player's recent flight path; THRUMSWARM's *Your Own Wings* replays it as the
// swarm-dragon's own path (§5f rule-break: boss-side mirroring that NEVER touches input).
// General + inert (recorded for any boss; only a setpiece that reads it does anything).
const poseRing = [];         // recent player {x,y} samples (newest last)
let poseRingT = 0;           // sample cadence
const POSE_RING_MAX = 90;    // ~9s at 0.1s cadence
let wingsPath = null;        // snapshot of poseRing taken when Your Own Wings arms
// §5i.B RIDE-THE-BEAM-EDGE (Calamities graze debut, def-gated `grazeForm:
// 'beamEdge'`): per-frame ticking graze with its OWN dedup story — the tick
// clock rate-limits payout (vs the crossing check's one-per-bullet), and the
// tick PERIOD RAMPS DOWN with unbroken contact (payout richest at the scariest
// instant). A short grace bridges the gaps between a radial's bullets; losing
// contact past it resets the ramp. Defs without the flag never tick (coexist).
let beamHeld = 0;              // seconds of unbroken beam contact (the ramp)
let beamTick = 0;              // countdown to the next tick payout
let beamGrace = 0;             // seconds of contact-loss tolerated before reset
let eyeHold = 0;              // §5f slot 8: seconds to KEEP the eye submerged after a strike (so the heavy lid actually closes)
let lastPlayer = null;       // the player from the last updateBoss (for event-driven mote spawns with no player arg)
// NO-HIT ADRENALINE LADDER (§5i.B meta spine, global — lands with slot 6).
// Five per-fight rungs on unbroken no-hit fight time, reset on hit:
//   R1 magnet (graze annulus ×1.18) → R2 +gain (surge charge ×1.5) →
//   R3 weak-point ping (rider chip ×1.25 + a soft ping) → R4 +burst (parry
//   reflect ×1.3) → R5 one-hit shield (the next hit is absorbed, ladder resets).
// Pure module state driven in the fight loop; every effect multiplier is 1 at
// rung 0, so a laddered fight at rung 0 is byte-identical to the shipped path.
const ADREN_RUNGS = [6, 13, 21, 30, 40];   // seconds of no-hit fight time per rung
let adrenT = 0, adrenRung = 0, adrenHits0 = 0, adrenPing = 0;
// ---- THE LIFETIME LADDER (§5h owner decision 1 — replaces the modulo for live
// encounters; rush + ?bossIdx debug paths pick explicitly and bypass it).
// felledRun: slots felled THIS RUN (never repeat within it); ladderSlot: the
// rung the ladder walks up from (null → recompute the entry rung from the
// save's lifetime ledger); cadenceMult: the recurring-slot tighten (1 for a
// first-time slot — the coexist floor for every dial).
const felledRun = new Set();
let ladderSlot = null;
let cadenceMult = 1;
// §6 anti-repeat memory (BIOME-DESIGN.md): the previous encounter's boss key —
// a biome-anchor pick must never spawn the same boss twice in a row. Set on
// every startBossEncounter path; reset alongside encounterIndex.
let lastBossKey = null;
// Fixed biome offset encounters snap to (§5h: foreshadowing is only authorable
// if the encounter distance is deterministic — the horizon seed reads it).
const BOSS_BIOME_OFFSET = 900;
function snapBossDist(minDist) {
  const L = CONFIG.biomeLength;
  let d = Math.floor((minDist - BOSS_BIOME_OFFSET) / L + 1) * L + BOSS_BIOME_OFFSET;
  if (d < minDist) d += L;
  return d;
}
// The def the NEXT (non-rush, non-debug) encounter will spawn — the horizon
// seed needs to know a biome early. Pure peek: no ladder state advances.
function peekNextDef() {
  if (rushMode) return BOSSES[rushQueue[rushIndex]] ?? null;
  if (debugDefIdx != null) return bossDefForIndex(debugDefIdx);
  // Mirror the live pick in startBossEncounter EXACTLY (ladder proposal → §6
  // biome-anchor preemption at the encounter's snapped distance) or the horizon
  // seed would foreshadow the wrong boss where an anchor preempts the ladder.
  const ladderDef = ladderPickDef(felledRun, (id) => bossLedgerStats(id).kills, ladderSlot);
  return BOSSES[pickBossKey(ladderDef.id, biomeIndexAt(nextBossDist), lastBossKey)];
}
// ---- §5e HORIZON-PRESENCE SEED (Vigil Lights' foreshadow: the dead black arch
// grows on the horizon a full biome early and NEVER moves). A fog-exempt
// far-silhouette parked at the encounter's fixed world spot (the §5h snap makes
// it deterministic); the real boss takes over at the SAME spot at warn (start.rel
// 150 — a seamless handoff). Inert unless the upcoming def opts in (coexist);
// rush breathers are too short for a vigil, so rush skips it.
let seed = null, seedDef = null, seedPeek = null, seedPeekT = 0;
function removeSeed() {
  seedPeekT = 0;               // the upcoming-def answer changes at encounter seams — re-peek
  if (!seed) return;
  scene.remove(seed.group);
  seed.dispose();
  seed = null; seedDef = null;
}
// §5j foreshadow state: thresholds (metres out → toll weight k, volume) + the encounter
// they were armed for (a new nextBossDist re-arms all three).
const FORESHADOW_TOLLS = [[2400, 0.5, 0.16], [1500, 0.6, 0.28], [750, 0.8, 0.42]];
let foreshadowFor = -1;
const foreshadowFired = [];

// §5e/§5j the audio-foreshadow seam (slot 10 is its first consumer): metres until the
// next scheduled encounter (Infinity when none). `nextBossDist` is module-private —
// callers pass the live player dist.
export function getBossEta(playerDist) { return nextBossDist - playerDist; }

function updateHorizonSeed(player, dt = 0.016) {
  // The upcoming-def peek walks the save ledger — throttle it to ~2Hz (the
  // answer only changes at encounter seams; CP2 gate finding 9 nit).
  seedPeekT -= dt;
  if (seedPeekT <= 0 || seedPeek === undefined) {
    seedPeekT = 0.5;
    seedPeek = (scene && game.state === 'playing' && !game.inCanyon && !rushMode && nextBossDist < Infinity)
      ? peekNextDef() : null;
  }
  const nd = seedPeek;
  // §5j AUDIO FORESHADOW (def-gated — slot 10's biome-early toll, `getBossEta`'s first
  // consumer): the NEXT encounter's boss is HEARD before it is seen — three distant
  // tolls on the approach (quiet → closer → heavier), re-armed per encounter. Rush
  // re-entry degrades gracefully (short breathers simply cross fewer thresholds; the
  // peek is null in rush so the gauntlet stays clean). The §5h fairness-twin law: the
  // banner + sky grade at warn remain the visual channel; these are the whisper before.
  if (nd && nd.musicDies && nextBossDist < Infinity) {
    if (foreshadowFor !== nextBossDist) { foreshadowFor = nextBossDist; foreshadowFired.length = 0; }
    const eta = nextBossDist - player.dist;
    for (const [th, k, vol] of FORESHADOW_TOLLS) {
      if (eta <= th && eta > 60 && !foreshadowFired.includes(th)) { foreshadowFired.push(th); bellToll(k, vol); break; }
    }
  }
  const want = nd && nd.horizonSeed ? nd : null;
  const seedZ = nextBossDist + 150;                    // where the boss will hold (start.rel 150)
  const dAhead = seedZ - player.dist;
  const SHOW = Math.min(CONFIG.biomeLength + 200, 1500);   // a biome early, inside camera far (1600)
  if (!want || dAhead > SHOW || dAhead < 60) { removeSeed(); return; }
  if (!seed || seedDef !== want) {
    removeSeed();
    const s = buildHorizonSeed(want);
    if (!s) return;
    seed = s; seedDef = want;
    scene.add(seed.group);
  }
  seed.group.position.set(0, B.fightHeight, -seedZ);   // a FIXED world spot — it has not moved. not once.
  seed.setHaze((SHOW - dAhead) / 400);                 // emerges from the horizon murk over ~400m
}
const SETPIECE_PATHS = {
  // §5d slot 10 — THE LAST TOLL (P4 dread/survival; the §5j law-10 free re-entrance):
  // the bell COMES FOR YOU. It swings down + forward out of the overhead loom until
  // it hangs DIRECTLY OVERHEAD (rel ≈3 — the mouth above your head, the bound
  // prisoner straining in the gaping crack, seen from BENEATH), rides there swinging
  // through the nine accelerating tolls, then hauls back up to station as the seal
  // spends itself. model.setSetpiece(sin(kπ), {dread}) drives the reveal rig.
  lastToll(k) {
    const B = CONFIG.BOSS;
    const HIGH_Y = 20, LOW_Y = 15.5, NEAR = 3;
    if (k < 0.22) {
      const t = easeInOut(k / 0.22);
      return { x: 0, y: HIGH_Y - (HIGH_Y - LOW_Y) * t, rel: B.settleGap + (NEAR - B.settleGap) * t };
    }
    if (k < 0.82) {   // the held overhead reveal: a slow pendulum ride, never static
      const t = (k - 0.22) / 0.6;
      return { x: Math.sin(t * Math.PI * 3) * 2.2, y: LOW_Y + Math.sin(t * Math.PI * 5) * 0.5, rel: NEAR + Math.sin(t * Math.PI * 2) * 1.5 };
    }
    const t = easeInOut((k - 0.82) / 0.18);
    return { x: 0, y: LOW_Y + (HIGH_Y - LOW_Y) * t, rel: NEAR + (B.settleGap - NEAR) * t };
  },
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
  // BRINEHOLM — SOUNDING (§5e "below" dread, "it dives"): the head SOUNDS — it
  // SINKS below the frame line and draws back (the drowned god submerges), HOLDS
  // under while the arena floor erupts in geyser curtains (MOVING → the P4 patterns
  // keep firing from below-frame), then SURFACES back to station. The below-frame
  // counterpart to ASHTALON's stoop-from-above; the model dread-submerges on top.
  sounding(k) {
    const B = CONFIG.BOSS;
    const SINK_Y = -7, BACK_REL = B.settleGap + 4;
    if (k < 0.32) {                        // SOUND — sink under the frame + draw back
      const t = easeInOut(k / 0.32);
      return { x: 0, y: B.fightHeight + (SINK_Y - B.fightHeight) * t, rel: B.settleGap + (BACK_REL - B.settleGap) * t };
    }
    if (k < 0.74) {                        // HOLD submerged — a slow tidal sweep as the floor erupts
      const u = (k - 0.32) / 0.42;
      return { x: Math.sin(u * Math.PI * 2) * 6, y: SINK_Y - Math.sin(u * Math.PI) * 1.5, rel: BACK_REL };
    }
    const t = easeInOut((k - 0.74) / 0.26);   // SURFACE back to station
    return { x: 0, y: SINK_Y + (B.fightHeight - SINK_Y) * t, rel: BACK_REL + (B.settleGap - BACK_REL) * t };
  },
  // MARROWCOIL — RIB THREAD (§5c "the rail threads its negative space"): the bone
  // dragon LOOMS straight in until the rail passes THROUGH the ribcage (rel drops
  // to ~7, centred, raised so the mid-body cage sits on the frame centre — the
  // SotC scale-contrast frame), holds the fly-through, then eases back. Runs
  // MOVING so the coil's iris rings keep expanding as it closes (emitter=organ).
  ribThread(k) {
    const B = CONFIG.BOSS;
    // L155 — a clean readable FLYBY (the rear-look cinematic was reverted (the over-reach, L156): a
    // camera-takeover + player-lock read as a cutscene interruption, not a boss move). Returns
    // {x,y,rel,yaw,roll}; the runner routes yaw→cineYaw, roll→cineRoll, and fires two beats:
    //   1 loom       — close from station to the aperture, facing you.
    //   2 fly past   — DIVE thread (L147) + recede to DEEP (off-screen behind), x≈0 straight back.
    //   3 emerge     — re-enter from ONE flank and fly FORWARD (overtake rel DEEP→AHEAD), yaw 0→π
    //                  (body flies its heading); the runner turns the HEAD at you + fires mouth shots.
    //   4 bank in    — curve x→0 with a cineRoll bank, wheel yaw π→0 to face you, ease rel→station.
    //   5 restore    — settle to centre, level, facing you.
    const NEAR = 7, DEEP = -22, DIVE = 4.2, AHEAD = 13, FLANK = 11, side = 1;
    // 1 — loom (facing you: no yaw key → cineYaw null → placeGroup face-player default).
    if (k < 0.15) { const t = easeInOut(k / 0.15); return { x: 0, y: B.fightHeight, rel: B.settleGap + (NEAR - B.settleGap) * t }; }
    // 2 — thread + fly fully past: dive at the thread, recede to DEEP (off-screen behind), x≈0.
    if (k < 0.34) { const t = (k - 0.15) / 0.19, e = easeInOut(t), s = Math.sin(t * Math.PI);
      return { x: 0, y: B.fightHeight - DIVE * s, rel: NEAR + (DEEP - NEAR) * e, roll: 0 }; }
    // 3 — emerge from a flank + fly forward: swing x to the side, overtake rel DEEP→AHEAD, yaw 0→π
    // (body faces its flight direction = back-turned to you as it draws alongside). Head-turn + mouth
    // shots fire from the runner once it's ahead (pose.rel>3).
    if (k < 0.66) { const t = easeInOut((k - 0.34) / 0.32);
      return { x: side * FLANK * t, y: B.fightHeight, rel: DEEP + (AHEAD - DEEP) * t, yaw: Math.PI * t, roll: 0 }; }
    // 4 — bank into the lane: curve x→0, wheel yaw π→0 to face you, gentle bank, ease rel→station.
    if (k < 0.88) { const t = (k - 0.66) / 0.22, e = easeInOut(t), s = Math.sin(t * Math.PI);
      return { x: side * FLANK * (1 - e), y: B.fightHeight, rel: AHEAD + (B.settleGap - AHEAD) * e, yaw: Math.PI * (1 - e), roll: -side * s * 0.4 }; }
    // 5 — restore: hold station, level, facing you.
    return { x: 0, y: B.fightHeight, rel: B.settleGap, yaw: 0, roll: 0 };
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
  // HOLLOWGATE — ARCH PASS (§5b/§5d slot 6, moving-station; the SIGNATURE
  // fly-through, L141): the ruined arch sweeps STRAIGHT IN and PAST the camera,
  // rel 30 → −8 → back, held at lane centre so the ≈9.9-unit gap SURROUNDS the
  // rail (the pillars flank the dragon at ±4.9, the lintel + window pass
  // overhead, the portcullis is forced OPEN in the model) — the door the player
  // flies THROUGH, not a loom. Runs MOVING so the verse murmur keeps raining
  // from the window as it closes. Unlike MARROWCOIL's ribThread the barrel
  // interior already sits ON the rail (the gap spans world y 0.5..19.3 at
  // fightHeight, rail ≈11.6), so NO dive is needed — a pure rel sweep encloses it.
  archPass(k) {
    const B = CONFIG.BOSS;
    const NEAR = 8, PASS = -8;
    if (k < 0.30) { const t = easeInOut(k / 0.30); return { x: 0, y: B.fightHeight, rel: B.settleGap + (NEAR - B.settleGap) * t }; }
    if (k < 0.68) { const t = (k - 0.30) / 0.38; return { x: 0, y: B.fightHeight, rel: NEAR + (PASS - NEAR) * easeInOut(t) }; }
    const t = easeInOut((k - 0.68) / 0.32); return { x: 0, y: B.fightHeight, rel: PASS + (B.settleGap - PASS) * t };
  },
  // HOLLOWGATE — ROSE JUDGMENT (§5f dread, "THE DOOR PRAYS"): holds at mid-close
  // range (the window readable, the panes' radials rakeable) while the model
  // CLOSES the portcullis and blazes all 8 panes (setSetpiece dread envelope);
  // the P4 pattern + firePaneRadial rain the radial pane-fire through the closing
  // gate. A slow rise keeps the arch looming as the door prays.
  roseJudgment(k) {
    const B = CONFIG.BOSS;
    const HOLD_REL = 15, RISE = 1.6;
    if (k < 0.2) { const t = easeInOut(k / 0.2); return { x: 0, y: B.fightHeight + RISE * t, rel: B.settleGap + (HOLD_REL - B.settleGap) * t }; }
    if (k < 0.82) { const t = (k - 0.2) / 0.62; return { x: Math.sin(t * Math.PI * 2) * 3, y: B.fightHeight + RISE, rel: HOLD_REL }; }
    const t = easeInOut((k - 0.82) / 0.18); return { x: 0, y: B.fightHeight + RISE * (1 - t), rel: HOLD_REL + (B.settleGap - HOLD_REL) * t };
  },
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
  // THRUMSWARM — CONDENSE PASS (§5e moving-station, P2): the swarm sweeps ACROSS the lane
  // (leaving station, |x| → ~12) as it condenses to fire, dipping close on the near pass,
  // then re-centres. Moving → the ring/wall volleys keep coming from wherever it travels.
  condensePass(k) {
    const B = CONFIG.BOSS;
    const env = k < 0.15 ? k / 0.15 : k > 0.85 ? (1 - k) / 0.15 : 1;
    return {
      x: Math.sin(k * Math.PI * 2) * 12 * env,               // out to ±12 and back (leaves station)
      y: B.fightHeight + Math.sin(k * Math.PI) * 2.5,
      rel: B.settleGap - Math.sin(k * Math.PI) * (B.settleGap - 12) * env,   // dips close on the near pass
    };
  },
  // THRUMSWARM — YOUR OWN WINGS (§5f dread, P4): the swarm becomes the player's dragon and
  // flies the RECORDED flight path (wingsPath) back at them — the roster's ring-buffer break
  // (boss-side mirroring, never touches input). The lateral x/y REPLAYS what the player just
  // flew (clamped to the arena for fairness — §5f "capped to fairness"); rel sweeps in for a
  // genuine CLOSE PASS (L141: cross the player) and back. wingsPath is snapshotted at arm.
  yourWings(k) {
    const B = CONFIG.BOSS;
    let x = 0, y = B.fightHeight;
    const path = wingsPath;
    if (path && path.length > 1) {
      const f = k * (path.length - 1);
      const i = Math.min(path.length - 1, Math.floor(f));
      const j = Math.min(path.length - 1, i + 1);
      const t = f - i;
      x = path[i].x + (path[j].x - path[i].x) * t;
      y = path[i].y + (path[j].y - path[i].y) * t;
    } else {
      x = Math.sin(k * Math.PI * 2) * 8;   // fallback weave if no path was recorded
    }
    x = Math.max(-14, Math.min(14, x));    // fairness clamp to the portrait envelope
    y = Math.max(2, Math.min(22, y));
    return { x, y, rel: B.settleGap - Math.sin(k * Math.PI) * (B.settleGap - 3) };   // a close flyby (min rel ~3)
  },
};
function clearSetpiece() {
  if (setpieceT >= 0) model?.setSetpiece?.(0);
  setpieceT = -1;
  setpieceDef = null;
  cineYaw = null;   // hand facing/banking back to placeGroup's face-player default (L155) —
  cineRoll = 0;     // covers both normal completion (k≥1) and the mid-beat shield abort
  ribEmitT = 0; headShotT = 0;   // reset the sub-cadences for the next pass
  model?.setHeadLook?.(0);   // release the L155 head-turn so an aborted beat never leaves the head cranked
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
  // §5e/§5f Your Own Wings: snapshot the player's recorded flight path NOW so the copy
  // replays exactly what they just flew (capped to fairness in the path fn).
  if (sp.id === 'yourWings') wingsPath = poseRing.slice(-70);
  if (!sp.moving) {   // quiet pass → suppress fire for a capture-safe window
    attackTimer = Math.max(attackTimer, sp.dur + 1.2);
    riderTimer = Math.max(riderTimer, sp.dur);
  }
}

// §5b/§5d slot 7 (THRUMSWARM): map each attack to the swarm FORMATION it fires from
// (ring = radial, wall = lane-denial, line = swept). Emitter = organ (§5f): the swarm
// condenses into the shape, then the shape fires.
const SWARM_ATTACK_FORM = {
  spiral: 'ring', iris: 'ring', aimed: 'ring', fan: 'ring',
  curtain: 'wall', movingGap: 'wall', secondWave: 'wall',
  stream: 'line', crossfire: 'line', spiralStream: 'line',
};
// driveSwarm: drive the swarm's condense/scatter cycle + formation from the live fight
// state (the PRESSURE-OSTINATO puzzle read). CONDENSED while a volley winds up or is in
// flight (vulnerable + firing); SCATTERED during the rest (invulnerable — chip only lands
// while condensed). A parry-STAGGER locks it condensed (the exposed bonus window). Def-
// gated on `condenseInvuln`; a model without setCondense (every other archetype) no-ops.
function driveSwarm(dt, player) {
  if (!def || (!def.condenseInvuln && def.grazeForm !== 'absorbColor') || !model || !model.setCondense) return;
  if (staggerT > 0) staggerT = Math.max(0, staggerT - dt);
  if (phase !== 'fight') { swarmScattered = false; return; }   // entrance/approach/death own the form
  if (debugSetpiecePin) { swarmScattered = false; return; }    // a capture pin owns the model (don't fight it)
  if (shielded) { swarmScattered = false; return; }            // onShieldChange owns the ring-shield
  if (setpieceT >= 0 && setpieceDef && setpieceDef.dread) { swarmScattered = false; return; }  // Your Own Wings owns the dragon form
  // CONDENSED while a volley winds up / is in flight (vulnerable + firing), held through the
  // dense ostinato by `condHold` so the swarm only SCATTERS at the phrase RESTS — brief
  // invulnerable micro-pauses (the turn-taking tell), not a half-fight gate. A parry-stagger
  // locks it condensed. SCATTERED = chip does nothing (the puzzle read).
  const firing = chargeT > 0 || pending.length > 0 || staggerT > 0;
  if (firing) condHold = 1.1;                     // stay exposed ~1.1s past the last shot
  else condHold = Math.max(0, condHold - dt);
  if (firing || condHold > 0) {
    if (firing) model.setFormation(SWARM_ATTACK_FORM[curAttack] || 'ring');
    model.setCondense(1);
  } else {
    model.setCondense(0);   // the lerp blends the motes back to the scatter cloud (invulnerable)
  }
  swarmScattered = (model.condenseLive ? model.condenseLive() : 1) < 0.45;

  // §5i.B ABSORB-A-COLOR: while CONDENSED and firing, the swarm SHEDS surge-pink motes
  // (braided into the magenta stream) that drift toward the player's lane to be soaked.
  if (def.grazeForm === 'absorbColor' && soakList.length < SOAK_MAX) {
    soakShed -= dt;
    if (soakShed <= 0 && (chargeT > 0 || pending.length > 0 || staggerT > 0)) {
      soakShed = 0.5 + Math.random() * 0.5;
      shedSoakMote(player);
    }
  }
}

// Shed one surge-pink soak mote from the swarm (the muzzle = the queen) drifting toward the
// player's lane. Non-lethal — the player weaves in to SOAK it (feeds Surge).
function shedSoakMote(player) {
  const mp = model.partWorldPos ? model.partWorldPos(def.muzzle) : null;
  const sx = mp ? mp.x : pose.x, sy = mp ? mp.y : pose.y;
  const relFromPlayer = mp ? (-mp.z - player.dist) : pose.rel;
  const spread = 3.2;
  soakList.push({
    x: sx + (Math.random() - 0.5) * spread, y: sy + (Math.random() - 0.5) * spread,
    rel: relFromPlayer,
    vx: (player.position.x - sx) * 0.05 + (Math.random() - 0.5) * 1.2,
    vy: (player.position.y - sy) * 0.05 + (Math.random() - 0.5) * 1.2,
    vrel: -(relFromPlayer + 2) / 2.4,     // close to the player over ~2.4s
    ttl: 3.2,
  });
}

// §5i CANCEL-CONVERT MOTE HARVEST (WEFTWITCH, grazeForm 'moteHarvest'): the CUT
// thread blooms into FALLING surge-motes from the thread's midpoint (between the
// hands) — steer through the bloom to harvest (each soak = bulletGraze → Surge).
// Offered once per phase: the first cut of a phase blooms; later cuts still
// stagger, they just don't re-bloom. Rides the shared soak cloud + detector
// (surge-pink stays the reward colour — the graze grammar outranks her gold).
const _bloomL = new THREE.Vector3(), _bloomR = new THREE.Vector3();
function bloomHarvestMotes(player) {
  const l = model.partWorldPos?.('handPivotL', _bloomL);
  const r = model.partWorldPos?.('handPivotR', _bloomR);
  let bx = pose.x, by = pose.y, brel = pose.rel;
  if (l && r) { bx = (l.x + r.x) / 2; by = (l.y + r.y) / 2; brel = -(l.z + r.z) / 2 - player.dist; }
  const N = Math.min(12, SOAK_MAX - soakList.length);
  for (let i = 0; i < N; i++) {
    const fan = (i / Math.max(1, N - 1) - 0.5) * 2;   // -1..1 across the bloom
    soakList.push({
      x: bx + fan * 4.2 + (Math.random() - 0.5) * 0.8,
      y: by + Math.random() * 1.2,
      rel: brel,
      vx: fan * 1.6 + (Math.random() - 0.5) * 0.6,
      vy: -(2.6 + Math.random() * 1.6),               // FALLING — the bloom sinks through the flight band
      vrel: -(brel + 2) / 3.2,                        // close to the player plane over ~3.2s
      ttl: 4.6,
    });
  }
  return N;
}

// §5i.C THREAD-CUT payoff (weftwitch): the woven volley unravels, the loom is
// stilled for the strike window, and the phase's once-only harvest blooms. One
// body for the production parry path AND the ?debug capture seam.
function triggerThreadCut(player) {
  staggerT = 2.5;
  const cut = cutBossAmbers();      // the volley unravels in place
  pending.length = 0;               // queued sub-volleys drop with it
  model.cutThread?.();              // hands thrown apart; the thread dies
  sfx.needlePull?.();               // the thread tears free
  let bloomed = 0;
  if (def.grazeForm === 'moteHarvest' && !harvestOffered) {
    harvestOffered = true;          // once per phase (reset at the phase seam)
    bloomed = bloomHarvestMotes(player);
    ui.bossNote?.('✦ THREAD CUT — HARVEST THE BLOOM ✦', 'STEER THROUGH THE FALLING MOTES', 'gold', 2.4);
  } else {
    ui.bossNote?.('✦ THREAD CUT — STRIKE NOW ✦', 'HER VOLLEY UNRAVELS', 'gold', 2.4);
  }
  emit('threadCut', { cleared: cut, bloomed });
}

// Move the soak motes; a mote within soak radius of the player is ABSORBED (bulletGraze →
// Surge). Expire on ttl or once well past the player. Writes the Points buffer + visibility.
function updateSoakMotes(dt, player) {
  if (!soakMotes) return;
  const SOAK_R = 2.2;
  for (let i = soakList.length - 1; i >= 0; i--) {
    const m = soakList[i];
    m.ttl -= dt;
    m.x += m.vx * dt; m.y += m.vy * dt; m.rel += m.vrel * dt;
    const near = Math.abs(m.rel) < 2.4;
    if (near && Math.hypot(m.x - player.position.x, m.y - player.position.y) < SOAK_R) {
      bulletGraze(player);                       // ABSORBED → feeds Surge (the graze economy)
      emit('absorbColor', {});
      tmp.set(player.position.x, player.position.y, -player.dist);
      burst(tmp, 0xff5ab0, { count: 4, speed: 8, size: 0.5, life: 0.3 });
      soakList.splice(i, 1); continue;
    }
    if (m.ttl <= 0 || m.rel < -6) { soakList.splice(i, 1); continue; }
  }
  for (let i = 0; i < SOAK_MAX; i++) {
    const m = soakList[i];
    if (m) soakPos.set([m.x, m.y, -(player.dist + m.rel)], i * 3);
    else soakPos.set([9999, 9999, 9999], i * 3);
  }
  soakMotes.geometry.attributes.position.needsUpdate = true;
  soakMotes.visible = soakList.length > 0;
}

// Drop every live soak mote and hide the cloud — called on fight teardown so a mote
// shed just before death/reset (life 3.2s > the 2.6s death dissolve) can't survive
// frozen into the normal course (review P2).
function clearSoakMotes() {
  soakList.length = 0; soakShed = 0;
  if (soakMotes) {
    if (soakPos) { soakPos.fill(9999); soakMotes.geometry.attributes.position.needsUpdate = true; }
    soakMotes.visible = false;
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
  // Organ-shimmer pool (PR6): jade breaths on brandable organs. toneMapped off
  // + a mild HDR push so the breath reads through bloom without a hot core.
  const shimTex = makeGlowTexture('180,255,215');
  for (let i = 0; i < SHIMMER_POOL; i++) {
    const mat = new THREE.SpriteMaterial({
      map: shimTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    });
    mat.toneMapped = false;
    mat.color.setHex(0x50ffaa).multiplyScalar(1.3);
    const sp = new THREE.Sprite(mat);
    sp.renderOrder = CONFIG.BOSS.renderTiers.wispRibbon - 1;   // under ribbons + bullets
    sp.visible = false;
    scene.add(sp);
    shimmers.push(sp);
  }
  // Brand-tether line pool (PR7): a single LineSegments, 2 verts per possible
  // brand, rewritten each frame; per-segment color fades with the brand's life
  // (LineBasicMaterial has no per-vertex alpha → fade the additive COLOR).
  const tgeo = new THREE.BufferGeometry();
  tgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TETHER_MAX * 2 * 3), 3));
  tgeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(TETHER_MAX * 2 * 3), 3));
  tgeo.setDrawRange(0, 0);
  const tmat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, depthTest: false,
  });
  tether = new THREE.LineSegments(tgeo, tmat);
  tether.frustumCulled = false;
  tether.renderOrder = CONFIG.BOSS.renderTiers.wispRibbon;
  tether.visible = false;
  scene.add(tether);
  on('bossDamage', (e) => damageBoss(e.amount, e.kind, e));
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

  // §5i.B ABSORB-A-COLOR soak motes: ONE additive Points cloud (surge-pink), parked
  // off-screen until a swarm boss sheds into it. One draw, one additive volume.
  {
    const g = new THREE.BufferGeometry();
    soakPos = new Float32Array(SOAK_MAX * 3).fill(9999);
    g.setAttribute('position', new THREE.BufferAttribute(soakPos, 3));
    g.setDrawRange(0, SOAK_MAX);
    const m = new THREE.PointsMaterial({
      color: 0xff5ab0, size: 1.5, sizeAttenuation: true, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    soakMotes = new THREE.Points(g, m);
    soakMotes.frustumCulled = false;
    soakMotes.renderOrder = TIERS.surgeFx;
    soakMotes.visible = false;
    scene.add(soakMotes);
  }
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
// PR3 V3 SURGE FORK: after the shield/chip resolves, the unleash also LOOSES every
// banked brand — one lance per pip onto the freshly EXPOSED organs (a shielded burst
// forks AFTER breakShield, so no lance ever pings the shield). The aimed variant lands
// the unshielded chip on the organ nearest the player's flight line.
function strikeSurge(player) {
  sfx.surgeBeam?.();
  cameraCtl.shake?.(1.4);
  tmp.set(pose.x, pose.y, -(player.dist + pose.rel));
  burst(tmp, 0xffffff, { count: 24, speed: 22, size: 1.3, life: 0.6 });
  burst(tmp, 0xff4fd0, { count: 18, speed: 15, size: 1.0, life: 0.7 });
  if (shielded) breakShield(player);
  else {
    // AIMED UNLEASH: resolve the beam at the lock candidate nearest the player's
    // flight line (within beamAimDisc). With a part, the chip carries it + the beam
    // weight so it counts toward part cracks; NO candidate in the disc → the exact
    // legacy pose-centre chip (byte-identical: damageBoss(14, 'surge') with no e).
    const aim = beamAimPart(player);
    if (aim) damageBoss(B.surgeBeamDamage ?? 14, 'surge',
      { part: aim.part, x: aim.x, y: aim.y, w: CONFIG.LOCK.beamPartWeight });
    else damageBoss(B.surgeBeamDamage ?? 14, 'surge');   // no shield up → a solid chip
  }
  surgeForkLances(player);
}

// The organ nearest the player's flight line, among this boss's lock candidates,
// within beamAimDisc (m). Null → no candidate lined up (fall back to the pose-centre
// chip). Shares lockCandidates() with the aim layer, so a boss with no lock data
// always returns null and the beam stays byte-identical (coexist).
const _beamV = new THREE.Vector3();
function beamAimPart(player) {
  if (!model || !model.partWorldPos) return null;
  const px = player.position.x, py = player.position.y;
  const disc = CONFIG.LOCK.beamAimDisc, disc2 = disc * disc;
  let best = null, bestD = Infinity;
  for (const part of lockCandidates()) {
    const w = model.partWorldPos(part, _beamV);
    if (!w) continue;
    const dx = px - w.x, dy = py - w.y;
    const d = dx * dx + dy * dy;
    if (d <= disc2 && d < bestD) { bestD = d; best = { part, x: w.x, y: w.y }; }
  }
  return best;
}

// THE FORK: loose every banked brand as direct homing lances onto the exposed organs.
// consumeAllLocks() hands over the pips and clears them (no auto-volley). Per-lance
// damage clamps against the CURRENT phase hp — post-breakShield the phase has already
// advanced, so a shielded burst's fork clamps against the NEW phase (the exposed
// organs' pool), never the sealed one. brandLoose rides the exhale via the lockVolley
// listener (source 'fork'). No banked pips → a silent no-op (the common ready tap).
function surgeForkLances(player) {
  const locks = consumeAllLocks();
  if (!locks.length) return;
  let pips = 0;
  for (const lk of locks) pips += lk.stacks;
  const dmgEach = lanceDmgEach(pips, currentPhaseHp());
  let i = 0;
  for (const lk of locks) for (let s = 0; s < lk.stacks; s++) fireLanceAt(player, lk.part, dmgEach, i++, pips);
  emit('lockVolley', { count: pips, source: 'fork', dmgEach });
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
  removeSeed();   // §5e: the real boss takes over the seed's spot (seamless handoff)
  active = true;
  // §5h LIFETIME LADDER (replaces the modulo): the run's first boss is the
  // lowest lifetime-unbeaten slot; the ladder walks up; felled-this-run
  // slots never repeat; recurring (beaten) slots come back TIGHTENED.
  // §6 BIOME ANCHOR (BIOME-DESIGN.md): the ladder PROPOSES; the biome's anchor
  // boss preempts it iff this encounter lands in its home biome. Null-safe:
  // an unanchored biome falls straight through to the ladder pick, byte-
  // identical — and the pick reads state only, no RNG (level.js stream untouched).
  const ladderDef = (!defOverride && !rushMode && debugDefIdx == null)
    ? ladderPickDef(felledRun, (id) => bossLedgerStats(id).kills, ladderSlot) : null;
  def = defOverride
    || (rushMode ? BOSSES[rushQueue[rushIndex]]
      : (debugDefIdx != null ? bossDefForIndex(debugDefIdx)
        : BOSSES[pickBossKey(ladderDef.id, biomeIndexAt(player.dist), lastBossKey)]));
  // A biome pick does NOT advance the ladder (§6 rule 3): the rung snapshots the
  // LADDER's own proposal, so an anchor insertion never skips roster slots.
  ladderSlot = BOSS_ORDER.indexOf((ladderDef ?? def).id);  // the ladder resumes from this rung
  lastBossKey = def.id;   // §6 rule 4: the anti-repeat memory, set on EVERY path
  // Recurring-slot tighten (§5h "beaten slots recur with tightened dials"):
  // 1 for a first-time slot / rush / debug — every dial byte-identical there.
  cadenceMult = (!rushMode && debugDefIdx == null && !defOverride)
    ? ladderTighten(bossLedgerStats(def.id).kills) : 1;
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
  partHits.clear();       // §5f: per-part crack counters reset per encounter (panes + shackles)
  // §5i.B: beam-edge ramp + adrenaline ladder reset per encounter (rung-0 = neutral).
  beamHeld = 0; beamTick = 0; beamGrace = 0;
  adrenT = 0; adrenRung = 0; adrenHits0 = game.bossHitsTakenRun; adrenPing = 0;
  setGrazeBonus(1); game.adrenGainMult = 1;
  // Fresh fight = full-width arena; the walls take the boss's accent colour.
  arenaHW = arenaTargetHW = CONFIG.laneHalfWidth;
  game.bossArenaHW = null;
  if (wallMat) wallMat.color.setHex(def.accent ?? 0x35e0ff);
  if (def.constrictPhase === 0) arenaTargetHW = CONSTRICT_HW;   // constrict from the opener

  model = buildBoss(def, quality);
  group = model.group;
  group.userData.__isBoss = true;   // debug seam: locate the boss in the scene graph
  scene.add(group);
  // Arena environment feed (optional model hook, the setGaze?.() pattern): the water
  // surface is the world-constant plane y=0 in every biome (water.js:204). A model
  // that reacts to it (WEFTWITCH clips its arena web at the surface) opts in by
  // exposing setWaterPlane; every other boss is inert. Fed only here — never in the
  // studio/tests — so the isolated captures stay byte-identical.
  model.setWaterPlane?.(0);

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
    start.y = def.startDepth ?? -8;   // rises from below the frame (Marrowcoil −8; BRINEHOLM deepened to −14, §5d)
  } else if (def.approachFrom === 'ahead') {
    // DEAD AHEAD (§5b/§5d slot 6, HOLLOWGATE): the only boss that never comes
    // to you — it holds the horizon and the RAIL closes the distance. Large
    // start.rel is the §5j degrade path until the fog-exempt horizon-presence
    // seed ships (the arch is visible far up the lane through the haze).
    start.rel = 150;
    start.x = 0;
    start.y = B.fightHeight;
  } else if (def.approachFrom === 'condense') {
    // CONDENSE FROM AHEAD (§5b/§5d slot 7, THRUMSWARM): the swarm's unlit motes
    // converge from up the lane and CLICK into the YOUR-DRAGON copy (§5j The Shape
    // It Remembers). The group settles forward in rel only; the model owns the
    // per-mote convergence (setEntrance). Reads as a scatter assembling ahead.
    start.rel = 45;
    start.x = 0;
    start.y = B.fightHeight;
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
  staggerT = 0; staggerHits = 0; swarmScattered = false; swarmDeflectHinted = false;   // §5d slot 7 swarm state
  threadCutHits = 0; harvestOffered = false;   // §5i.C slot 11 thread-cut + harvest state
  eyeDeflectHinted = false; eyeHold = 0;   // §5f slot 8: reset the "submerged = untouchable" hint + the eye-down hold
  condHold = 0; clearSoakMotes();
  poseRing.length = 0; poseRingT = 0; wingsPath = null;   // §5e ring buffer: fresh per encounter

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
    : (def.approachFrom === 'above' || def.approachFrom === 'ahead' || def.approachFrom === 'condense') ? 'top' : 'bottom';
  // §5b WEFTWITCH rule-break (def.hudSew): the warn banner is cross-stitched and
  // PINNED half-deployed (no auto-hide — it tears free at enterFight), and the
  // golden HUD-SEW threads lace the chrome. RENDER-ORDER LAW: bullets are WebGL
  // (below all DOM) and cannot exist before phase 'fight' — firing both HERE, in
  // the warn window, and clearing at enterFight IS the never-over-bullets proof.
  ui.bossWarning?.(def.name, def.title, dir, B.warnTime, def.hudSew ? { pin: true } : null);
  if (def.hudSew) ui.hudSew?.(def.accent);
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
  lastBossKey = null;   // §6: the anti-repeat memory resets alongside encounterIndex
  active = false;
  if (rushQueue.length === 0) { emit('rushClear', { count: 0 }); nextBossDist = Infinity; return; }
  nextBossDist = player.dist + RUSH_LEAD;
}

export function inBossRush() { return rushMode; }

function endEncounter(player) {
  clearSetpiece();
  clearLocks('transition');   // THE LANCE layer never outlives the fight (silent — audit)
  setGrazeBonus(1); game.adrenGainMult = 1;   // §5i.B: the ladder's effects never outlive the fight
  beamHeld = 0; beamTick = 0; beamGrace = 0; adrenRung = 0; adrenT = 0;
  if (group) { scene.remove(group); model.dispose?.(); }
  resetBossBullets();
  clearSoakMotes();            // §5i.B: a late-shed pink mote must not outlive the fight (review P2)
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
    // §5h: encounters SNAP to a fixed biome offset (deterministic distance —
    // the horizon seed foreshadows exactly a biome out; jitter retired here).
    nextBossDist = snapBossDist(player.dist + B.interval);
  }
  emit('bossEnd', { dist: player.dist });   // main.js resumes level generation ahead
}

function startDeath(player) {
  phase = 'dying';
  dyingT = 0;
  endCard();                              // resolve the final card if a path reached death without a shield-break
  recordBossLedger(def.id, { kill: true });   // per-boss kill accrual (§5h; slot 9's taunts read it)
  felledRun.add(def.id);                  // §5h ladder: a felled slot never repeats within this run
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
  // §5f MUSIC-DEATH: the world's voice returns UNDER the defeat beat — the bell is
  // silenced, the run's music breathes back in (~0.6s). Idempotent for every other def.
  musicRestore();
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
  // Third job (V5): while the FOCUS hold is live (and not surging) the idle
  // circle warms toward the lock layer's jade and breathes brighter — the hold
  // is visibly ON. Surge's pink meter always wins (it's the bigger state).
  reticleFill.material.color.setHex(surging ? 0xff6ae0 : 0x9dffea);
  reticleTrack.material.color.setHex(surging ? 0x8f6ad8 : 0x9dffea);
  if (!surging && focusVis > 0.01) {
    _focusCol.setHex(0x50ffaa);
    reticleFill.material.color.lerp(_focusCol, focusVis * 0.85);
    reticleTrack.material.color.lerp(_focusCol, focusVis * 0.5);
  }
  reticleFill.material.opacity = surging
    ? 0.55 + Math.abs(Math.sin(time * 8)) * 0.18
    : 0.32 + focusVis * (0.2 + Math.abs(Math.sin(time * 6)) * 0.1);
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
  initLockLayer();   // THE LANCE layer: fresh aim/lock state per fight
  aimHeldT = 0; aimTeachCd = 1.5;   // V1 teach: first prompt after a short settle
  lockTeachCd = 1.5; snapTeachCd = 4; amberVent.clear();   // V4 teach waits a few beats past the paint teach
  focusTeachCd = 3; focusHeldT = 0; focusVis = 0;          // V5 teach: after the fight settles
  lockSealHinted = false; sealHoldT = 0;
  // V2 access unlocks permanently on first ENTERING a lock-anatomy fight (slot 4 is
  // the first def with lockParts) — a player stuck on the boss keeps the tool (§I.e).
  if (def.lockParts && !saveData.flags.lockUnlocked) {
    saveData.flags.lockUnlocked = true;
    persist();
  }
  poseSX = pose.x; poseSY = pose.y; poseSmooth = true;   // seed the group x/y smoother from the entrance-end pose (no handoff jump)
  if (cineYaw != null) fightWobbleT = 0;   // released from a scripted entrance → ease the yaw/roll wobble in from its settled facing (no snap)
  entranceId = null;                  // the scripted entrance is done
  model?.setEntrance?.(null);         // release any per-boss entrance choreography (EITHERWING's Baton Cross)
  cineYaw = null;                     // hand facing back to placeGroup (face the player)
  cameraCtl.setOvertake?.(null);      // release the cinematic camera if it was active
  model.setEyeLock?.(false);          // hand the pupil back to the idle gaze
  ui.cinematicHold?.(false);          // restore the gameplay HUD
  if (def.hudSew) {
    // the pinned banner TEARS FREE as the fight starts (the sew must be gone
    // before the first bullet exists — the render-order LAW's other half).
    ui.bossWarnClear?.();
    ui.hudSewClear?.();
  }
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
  lastPlayer = player;   // stashed for event-driven spawns (the shackle SPRAY-SOAK vent) that have no player arg
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
    hideShimmers();
    hideTether();
    surgeSeq = null;
    // Silence any lingering Surge loops when the fight isn't running (edge-only).
    if (wasSurge) { sfx.surgeCrackleStop?.(); wasSurge = false; }
    sfx.dwellHum?.(0);   // PR7: no dwell whisper outside a live fight
    if (wasReady) { sfx.surgeReadyStop?.(); wasReady = false; }
    input.surgeTap = false;   // drop any stale tap between fights
    ui.surgeReady?.(false);
    // §5e: the horizon seed rides the idle stretch between encounters.
    updateHorizonSeed(player, dt);
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
  driveSwarm(dt, player);          // §5d slot 7: the condense/scatter cycle + formation (inert for other bosses)
  updateSoakMotes(dt, player);     // §5i.B ABSORB-A-COLOR (inert unless grazeForm='absorbColor')
  // §5e ring buffer: sample the player's flight path while fighting (for Your Own Wings).
  if (phase === 'fight' || phase === 'flythrough') {
    poseRingT -= dt;
    if (poseRingT <= 0) {
      poseRingT = 0.1;
      poseRing.push({ x: player.position.x, y: player.position.y });
      if (poseRing.length > POSE_RING_MAX) poseRing.shift();
    }
  }
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
  // Organ shimmers + brand tethers exist only while the FIGHT branch drives
  // them — any other live phase (entrance/dying/warn) must not leave them pinned.
  if (phase !== 'fight') { hideShimmers(); hideTether(); }

  if (phase === 'warn') {
    warnT -= dt;
    if (warnT <= 0) {
      // §5f MUSIC-DEATH (def.musicDies — slot 10's granted rule-break): the run's
      // music DIES ON the warn-end toll and stays dead for the whole fight (skip
      // must NOT restore it; the defeat fanfare / resetBoss bring it back). From
      // here the accelerating toll is the only clock — silence as dread.
      if (def.musicDies) { musicKill(); bellToll(1); model?.tollNow?.(time); }
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
    // `def.stationY` (§5c WORLD-ENDERS "the lane breaks"): an overhead boss holds a
    // RAISED station — KNELLGRAVE hangs above the lane (body above the frame top,
    // only the mouth/lip/clapper dip in; you fight looking UP). Every def without
    // it keeps B.fightHeight byte-identical (coexist).
    const arc = (def.approachFrom == null || def.approachFrom === 'behind') ? Math.sin(k * Math.PI) * 6 : 0;
    pose.y = start.y + ((def.stationY ?? B.fightHeight) - start.y) * e + arc;
    if (k >= 1) enterFight();
  } else if (phase === 'fight' && debugSetpiecePin) {
    // Capture-only: freeze a SETPIECE pose at a fixed path parameter so the crop tool
    // can shoot it as a still. By default the GROUP holds station (the crop just wants
    // the model's per-beat pose, e.g. ASHTALON's stoop wing-tuck). A pin with
    // `moveGroup` also applies the path's group TRANSLATION — EITHERWING's close pass IS
    // the group diving past the camera, so its money frame needs the real rel/x/y.
    const p = SETPIECE_PATHS[debugSetpiecePin.id]?.(debugSetpiecePin.k);
    if (p && debugSetpiecePin.moveGroup) {
      pose.x = p.x; pose.y = p.y; pose.rel = p.rel;
      // L155: a maneuver pin also holds the path's FACING + BANK so a still shows the
      // back-turn / bank, not just the translation. clearSetpiece/enterFight reset these.
      cineYaw = (p.yaw !== undefined) ? p.yaw : null;
      cineRoll = p.roll ?? 0;
    }
    else if (p) { pose.x = 0; pose.y = def.stationY ?? B.fightHeight; pose.rel = B.settleGap; }
    model.setSetpiece?.(Math.sin(debugSetpiecePin.k * Math.PI), { id: debugSetpiecePin.id });
    model.setCharge(0);
  } else if (phase === 'fight' && debugChargePin >= 0) {
    // Capture-only: freeze the boss square-on and HOLD the contracted mantle pose
    // at the pinned charge level so the crop tool can shoot the wind-up silhouette
    // as a still (the live charge is too transient to catch headless). No firing.
    pose.rel = B.settleGap; pose.x = 0; pose.y = def.stationY ?? B.fightHeight;
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
      // A setpiece path MAY drive facing + banking (L155): `yaw` present → cineYaw owns
      // the world-yaw (else null → placeGroup's face-player default); `roll` → the bank.
      // Paths that return neither leave facing untouched — un-opted setpieces byte-unchanged.
      cineYaw = (p.yaw !== undefined) ? p.yaw : null;
      cineRoll = p.roll ?? 0;
      // Whoosh as a close pass crosses toward the camera (EITHERWING's flyby dives past
      // the player). Fires once per inbound crossing of rel≈8, never every frame.
      if (pose.rel < 8 && prevPassRel >= 8) sfx.nearMiss?.();
      prevPassRel = pose.rel;
      // Pass the setpiece def so a model can respond per-beat (ASHTALON ignores
      // the 2nd arg; MARROWCOIL reads it to tell a fly-through pass — cage OPEN —
      // from its Closing-Ribs dread — cage CONSTRICTING).
      model.setSetpiece?.(Math.sin(k * Math.PI), setpieceDef);   // pose spread eases in and back out
      // THE RIB THREAD FLYBY (L155): the beat owns its fire — SUPPRESS the normal skull cadence
      // for the ENTIRE ribThread (hold the timer + cancel any in-flight charge) so nothing fires
      // on its own while the head dives/turns; the runner drives two scripted beats by k.
      if (setpieceDef.id === 'ribThread') {
        attackTimer = Math.max(attackTimer, 0.6);   // never let the cadence reach a fire this frame
        if (chargeT > 0) { chargeT = 0; model.setAttackTell?.(null); }

        // seg 2 — rib bullets converging from inside the ribs while the cage straddles the
        // player plane (the L155 close-range thread beat), only during the thread (k<0.34).
        if (k < 0.34 && pose.rel > -5 && pose.rel < 8) {
          ribEmitT += dt;
          if (ribEmitT >= 0.32) { ribEmitT = 0; emitRibBullets(player); }
        }

        // seg 3–4 — FLANK FLYBY: once the boss is AHEAD on the flank (rel>3, body flying forward
        // = back-turned, yaw π), TURN THE HEAD at you (setHeadLook counters the body yaw so the
        // skull's world-yaw points at you) and fire a few skull/mouth shots — normal front-closing,
        // dodgeable/parryable. Eased back to 0 as it wheels around to face you (seg 4→5).
        if (pose.rel > 3 && k < 0.90) {
          const desired = Math.atan2(player.position.x - pose.x, Math.max(pose.rel, 4));
          let hl = desired - (cineYaw || 0);   // local yaw so the skull's WORLD yaw points at you
          while (hl > Math.PI) hl -= Math.PI * 2;
          while (hl < -Math.PI) hl += Math.PI * 2;
          model.setHeadLook?.(hl);
          headShotT += dt;
          if (headShotT >= 0.5) { headShotT = 0; emitHeadShots(player); }
        } else {
          model.setHeadLook?.(0);
        }
      }
      if (k >= 1) clearSetpiece();
    } else {
      if (setpieceT >= 0) clearSetpiece();   // shield rose mid-beat: abort cleanly
      // Hold station ahead and "fly backward"; gentle strafe/bob keeps it alive.
      // Sway amplitude/speed are def-tunable so a TUTORIAL boss (slot 1) can drift
      // slowly enough that its face stays inside the V1 aim cone long enough to
      // lock — LANCE §II.9. Defaults reproduce the shipped ±5m sway byte-for-byte
      // (every existing boss omits `holdSway`, so this is a coexist no-op).
      const sway = def.holdSway;
      pose.rel = B.settleGap;
      pose.x = Math.sin(time * (sway?.freq ?? 0.7)) * (sway?.amp ?? 5.0);
      pose.y = (def.stationY ?? B.fightHeight) + Math.sin(time * 1.3) * 0.8;
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
        if (activeCard.survival) {
          // §5f: OUTLASTING a survival card is the success — the seal spends itself,
          // the card resolves (capture if hitless), and the fight resumes chippable.
          // (The phase's own floor shield still gates the end as normal.)
          endCard();
        } else { cardExpired = true; ui.bossCardExpire?.(); }
      }
    }

    // The tap is ONE word — UNLEASH what's charged (combat-verbs SOP §II.x, PR3
    // Option A). The ready-tap ALWAYS fires Surge (the fork onto banked brands
    // resolves at the beam climax inside strikeSurge — cases 1 & 2); a not-ready tap
    // with a full-enough set (≥ tapVolleyMinLocks) is the player's DELIBERATE LOOSE
    // (case 3); anything else is the legacy silent no-op (case 4). LATENCY LAW: the
    // ready path gains ZERO frames — activateSurge is called inline, exactly as before;
    // the loose is a flag the lock layer consumes later THIS frame (updateLockLayer
    // runs below), never a deferral or a double-tap window.
    const ready = !game.feverActive && game.consecutiveRings >= game.feverThreshold;
    if (input.surgeTap) {
      input.surgeTap = false;
      if (ready) activateSurge(player);                                    // cases 1 & 2
      else if (lockCount() >= CONFIG.LOCK.tapVolleyMinLocks) requestLoose(); // case 3
      // case 4: no-op (tap consumed silently)
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

    // THE LANCE layer (V1 aim-line). Build the per-frame ctx and step the state
    // machine BEFORE the rider fires, so a held line retargets THIS frame's shot.
    // Danger-binding: `emittersLive` gates the dwell rate (full while fire is live,
    // half during authored quiet); `exposureWindow` = the §5f post-string turn-taking
    // gap where a held line pays crack ticks.
    fightNow = time;
    const lockCtx = {
      fightRunning: true,
      model,
      candidates: lockCandidates(),
      muted: !!def.lockMuted,
      emittersLive: bossBulletCount() > 0 || chargeT > 0 || pending.length > 0,
      exposureWindow: !shielded && chargeT <= 0 && pending.length === 0 && attackTimer > 0,
      damageBoss,
      flashPart: () => model.flash?.(0.15),
      // V2 LANCE-PAINT (SOP §II.5): the paint machine's per-frame world view.
      tier: def.tier ?? 1,
      cap: CONFIG.LOCK.capByTier[def.tier ?? 1] ?? 0,
      deflected: lockDeflected(),
      phaseHp: currentPhaseHp(),
      paintUnlocked: !!saveData.flags.lockUnlocked,
      paintables: paintableParts(),
      amberVenting: (part) => (amberVent.get(part) ?? -1) > fightNow,
      fireLance: (part, dmg, i, n) => fireLanceAt(player, part, dmg, i, n),
      // V5 FOCUS (PR5): the deliberate hold (2nd finger past focusArmMs / F) —
      // halves the effective dwell in the lock layer. Level-read every frame.
      focusHeld: focusHeldNow(),
      // V3.E1 (PR5): true when NOW is within ±beatWindow of a music-beat edge —
      // a manual loose on the beat is a PERFECT RELEASE (volleys only, the LAW).
      // getBeatClock() is null when music is off/headless → simply never perfect.
      beatOn: (() => {
        const bc = getBeatClock();
        if (!bc) return false;
        const toEdge = Math.min(bc.phase * bc.beatLen, bc.toNextBeat);
        return toEdge <= CONFIG.LOCK.beatWindow;
      })(),
    };
    updateLockLayer(dt, player, lockCtx);
    driveAimTeach(dt, lockCtx);
    driveLockTeach(dt, lockCtx);
    driveSnapTeach(dt, lockCtx);
    driveFocusTeach(dt, lockCtx);
    driveSealHint(dt, lockCtx);
    // The focus ring's THIRD job (idle circle → surge meter → FOCUS): ease a
    // 0..1 heat the reticle tints jade while the hold is live (render-only).
    focusVis = Math.max(0, Math.min(1, focusVis + (lockCtx.focusHeld ? dt * 6 : -dt * 4)));
    updateShimmer(time, lockCtx);
    updateTether(player);

    riderTimer -= dt;
    if (riderTimer <= 0) {
      // A held aim-line quickens the rider's cadence (÷ chipRateMult) — never a fire
      // button, never touching the unconditional chip; it CONDITIONS on flight state.
      const held = lockAimHeld() ? CONFIG.LOCK.chipRateMult : 1;
      riderTimer = (B.riderShotInterval / held) * (surge ? B.surgeRiderMult : 1);   // double-fire in Surge
      fireRiderShot(player);
    }

    // Reflect: a barrel roll's i-frames swat nearby reflectable (amber) bullets
    // back at the boss. A bullet swatted right on top of you is a PERFECT parry
    // (more damage). Announce + ring the parry chime once per roll (streak climbs).
    if (player.rollInvuln > 0) {
      // In Surge, EVERY bullet is reflectable (not just the amber ones).
      const r = reflectBossBullets(player, B.reflectWindow, B.settleGap, pose.x, pose.y, surge, adrenRung >= 4 ? 1.3 : 1);   // R4 parry burst
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
          // V4 LOCK-SNAP (PR4, owner-ruled PERFECT-ONLY): a perfect parry of a
          // part-tagged amber snaps a brand onto the organ that FIRED it — the
          // C3 answer (a venting organ can't be dwell-painted; the parry is its
          // sanctioned paint path). LAWS: ≤ snapPerVolley (1) per parry burst;
          // 0 during fever (Surge reflects are free-for-all, not the amber
          // read); never onto a deflected boss (a survival-card parry can't
          // promise a mark that won't take — sealed honesty).
          if (r.snapParts.length && !surge && !lockDeflected() &&
              saveData.flags.lockUnlocked && def.lockParts) {
            for (let sp = 0; sp < Math.min(r.snapParts.length, CONFIG.LOCK.snapPerVolley); sp++) {
              // PR6 BRIDGE: pane ambers tag their source NUMERICALLY (the crack
              // router weights `typeof part === 'number'` as reflected-full, so
              // the bullet's tag must stay a number) — translate to the LANCE's
              // string organ name here; paintFromParry type-guards the rest.
              let tag = r.snapParts[sp];
              if (typeof tag === 'number' && def.destructiblePanes) tag = 'rosePane' + tag;
              if (typeof tag === 'string' && !lockPartDead(tag)) paintFromParry(tag);
            }
          }
          // §5i.C SCATTER-STAGGER (THRUMSWARM's parry job): parry the queen's amber-eye
          // volley 3× → the queen recoils and the swarm can't re-scatter for 2.5s (LOCKED
          // condensed = a guaranteed chip window — parry ACCELERATES, never gates, §5i.C
          // law 4). Surge reflects don't count (they're free-for-all, not the amber read).
          if (def.condenseInvuln && !surge) {
            staggerHits++;
            if (staggerHits >= 3) {
              staggerHits = 0; staggerT = 2.5;
              ui.bossNote?.('✦ STAGGERED — STRIKE NOW ✦', 'THE SWARM CAN\'T SCATTER', 'gold', 2.4);
              sfx.milestone?.();
              emit('bossStagger', {});
            }
          }
          // §5i.C THREAD-CUT (WEFTWITCH's parry job, registry row 11): parry her
          // taut-thread ambers 3× → the thread is CUT — the woven volley UNRAVELS
          // (every in-flight amber deletes + the queued sub-volleys drop) and the
          // loom is STILLED for a 2.5s strike window (parry ACCELERATES, §5i.C
          // law 4). Surge reflects don't count (not the amber read).
          if (def.threadCut && !surge) {
            threadCutHits++;
            if (threadCutHits >= 3) { threadCutHits = 0; triggerThreadCut(player); }
          }
        }
      }
    } else {
      rollParried = false;
    }

    // ---- §5i.B RIDE-THE-BEAM-EDGE (def-gated continuous graze) ----
    if (def.grazeForm === 'beamEdge') {
      if (beamContact(player, 7)) {
        beamGrace = 0.3;                                   // bridge the gaps between a radial's bullets
        beamHeld += dt;
        beamTick -= dt;
        if (beamTick <= 0) {
          bulletGraze(player);                             // the payout rides the normal graze economy
          emit('beamGraze', { held: beamHeld });
          beamTick = Math.max(0.18, 0.5 - beamHeld * 0.07);   // the ramp: longer contact → faster ticks
        }
      } else if (beamGrace > 0) {
        beamGrace -= dt;                                   // grace: contact briefly lost, ramp holds
      } else {
        beamHeld = 0; beamTick = 0;                        // contact broken → the ramp resets
      }
    }

    // ---- §5i.B SHADOW-RIDE (BRINEHOLM's Calamities graze, def-gated) — ride the
    // leviathan's LEE (the shadow under its bulk) to bank Surge; the risk is the
    // geysers that erupt there. Same tick economy as beamEdge (one grazeForm/boss). ----
    if (def.grazeForm === 'shadowRide') {
      const halfW = 9 * (def.scale ?? 1);
      const inLee = Math.abs(player.position.x - pose.x) < halfW * 0.55   // centred under the head
        && player.position.y < pose.y - 2                                 // beneath the maw
        && Math.abs(pose.rel - B.settleGap) < 22;                         // at fight distance
      if (inLee) {
        beamGrace = 0.3; beamHeld += dt; beamTick -= dt;
        if (beamTick <= 0) { bulletGraze(player); emit('shadowGraze', { held: beamHeld }); beamTick = Math.max(0.2, 0.5 - beamHeld * 0.06); }
      } else if (beamGrace > 0) { beamGrace -= dt; }
      else { beamHeld = 0; beamTick = 0; }
    }

    // ---- NO-HIT ADRENALINE LADDER (global §5i.B meta spine) ----
    {
      if (game.bossHitsTakenRun > adrenHits0) {            // took a hit since last frame
        // V2: a hit strips locks, band-scaled (newest pip ≤ tier 2, all above — audit F8).
        lockNotifyHit(def.tier ?? 1);
        adrenHits0 = game.bossHitsTakenRun;
        if (adrenRung >= 5) {
          // R5 ONE-HIT SHIELD: absorb the hit FULLY — refund the damage AND
          // un-count the hit (the spell-card capture + no-hit feat survive;
          // "absorbed" must mean absorbed — CP2 gate finding 7 ruling). Only
          // the graze streak stays broken (the flow flinch is earned). The
          // ladder is spent either way.
          game.health = Math.min(CONFIG.healthMax, game.health + B.bulletDamage);
          game.bossHitsTakenRun = Math.max(0, game.bossHitsTakenRun - 1);
          ui.bossNote?.('⛨ ADRENALINE SHIELD ⛨', 'THE HIT IS ABSORBED — LADDER SPENT', 'gold', 2.2);
          sfx.milestone?.();
          emit('adrenalineShield', {});
        }
        adrenHits0 = game.bossHitsTakenRun;   // re-baseline after any un-count
        adrenT = 0;
        if (adrenRung > 0) emit('adrenalineReset', { from: adrenRung });
        adrenRung = 0;
      } else {
        adrenT += dt;
        while (adrenRung < 5 && adrenT >= ADREN_RUNGS[adrenRung]) {
          adrenRung++;
          const names = ['', 'MAGNET', 'SURGE GAIN UP', 'WEAK-POINT PING', 'PARRY BURST', 'ONE-HIT SHIELD'];
          ui.bossNote?.(`⚡ ADRENALINE ${adrenRung} — ${names[adrenRung]}`, 'NO-HIT STREAK', 'gold', 1.8);
          sfx.graze?.(10 + adrenRung * 4);
          emit('adrenalineRung', { rung: adrenRung });
        }
      }
      // Publish the rung's effects (all 1/neutral at rung 0 — the coexist floor).
      setGrazeBonus(adrenRung >= 1 ? 1.18 : 1);
      game.adrenGainMult = adrenRung >= 2 ? 1.5 : 1;
      if (adrenRung >= 3) {                                // weak-point ping: a soft periodic sonar on the focal
        adrenPing -= dt;
        if (adrenPing <= 0) { adrenPing = 4; sfx.graze?.(24); model.flash(0.25); }
      }
    }

    // §5f slot 8 (BRINEHOLM): the eye SURFACES in the recovery gap (the vulnerable
    // weak-point window) and SUBMERGES while the beast winds up or fires (invulnerable)
    // — the turn-taking tell the damage gate reads. Shield/entrance own their own
    // down-state (the model clamps the eye there), so only drive it when unshielded.
    if (def.eyeWeakPoint && model.setEyeUp && !shielded) {
      // Submerge through the wind-up AND a short hold past the strike, so the heavy
      // lid has time to fully close (the eased lid can't shut inside a brief
      // telegraph) — a real, readable invulnerable window; surfaced in the gap.
      if (chargeT > 0) eyeHold = 0.45;
      else eyeHold = Math.max(0, eyeHold - dt);
      model.setEyeUp((chargeT > 0 || eyeHold > 0) ? 0 : 1);
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
    } else if (def.threadCut && staggerT > 0) {
      // §5i.C THREAD-CUT window (WEFTWITCH): the loom is STILLED — any wind-up
      // cancels, nothing new is drawn, the strike window runs. (THRUMSWARM's
      // staggerT is consumed in driveSwarm instead — LOCKED condensed.)
      staggerT = Math.max(0, staggerT - dt);
      if (chargeT > 0) { chargeT = 0; model.setCharge(0); model.setAttackTell?.(null); }
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
        // §5f KNELLGRAVE (def.musicDies): every volley release IS a toll. The audio
        // strike (bellToll), the model's reverberation + expanding ring-wall (tollNow —
        // the FAIRNESS TWIN: a muted/deaf player loses zero information), and the
        // world-event layer (a camera tick + the 'bossToll' postfx flinch) all land on
        // the same beat; the weight GROWS as the fight ruins (the final tolls are FELT).
        if (def.musicDies) {
          const w = 0.55 + (hpMax > 0 ? (1 - hp / hpMax) : 0) * 0.45;
          bellToll(w);
          model.tollNow?.(time);
          cameraCtl.shake?.(0.16 + w * 0.2);
          emit('bossToll', { k: w });
        }
        executeAttack(curAttack, player);
        const ph = def.phases[phaseIdx];
        // §5i: a rhythm def uses the machine's authored rest (its signature's
        // fingerprint, stashed when the attack was picked); else the legacy roll.
        // cadenceMult: the §5h recurring-slot tighten (1 on a first encounter).
        // §5f BRINEHOLM mercy: each shackle freed EARLY relaxes the cadence in the
        // bound phases (P3+) — freeing the beast softens the strain (a mechanic, not
        // a stat). Def-gated; every other boss keeps mercy = 1.
        const mercy = (def.destructibleShackles && phaseIdx >= 2 && model.brokenCount) ? 1 + 0.16 * model.brokenCount() : 1;
        attackTimer = ((rhythm && rhythmRest != null) ? rhythmRest : rand(ph.cadence[0], ph.cadence[1])) * cadenceMult * mercy;
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
        // §5f WEFTWITCH: drawing the thread taut has a SOUND (the needle-pull) —
        // the audio twin of the taut-thread flash tell (fairness: eyes-off players
        // hear the aimed wind-up coming).
        if (def.threadCut && curAttack === 'aimed') sfx.needlePull?.();
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
  // little menacing yaw/roll wobble. During the cinematic entrance OR a facing-owning
  // setpiece, cineYaw owns the yaw and cineRoll the bank (it faces its line, wheels
  // 180° to face you, and banks as it curves into the lane — L155).
  if (cineYaw != null) group.rotation.set(0, cineYaw, cineRoll);
  else {
    // Ease the wobble amplitude in after a cinematic entrance so the group doesn't snap from its
    // settled square facing (cineYaw≈0) to the full sin-wobble in one frame (L150). Full within ~0.6s.
    fightWobbleT += dt || 0.016;
    const w = Math.min(1, fightWobbleT / 0.6);
    group.rotation.set(0, Math.sin(time * 0.5) * 0.12 * w, Math.sin(time * 0.9) * 0.08 * w);
  }
  // GAZE FEED (optional model hook): normalized offset of the player relative to
  // the boss's facing axis, in WORLD axes — placeGroup keeps rotation near-
  // identity so world≈local, and the model handles its own local conversion.
  // Skipped during 'warn' (the boss is still hidden then; nothing to sell yet),
  // during the flythrough (updateFlythrough drives the tracking gaze itself), and
  // whenever cineYaw owns facing (L155): at a scripted yaw — the back-turned pass
  // especially — world≈local inverts, so a naive feed would track backwards.
  if (phase !== 'warn' && phase !== 'flythrough' && cineYaw == null) {
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
    harvestOffered = false;   // §5i moteHarvest: a fresh phase re-offers the bloom
    // §5b the arena-mender: each phase seam TEARS a sector of her web and she
    // visibly re-weaves it (optional model hook — only the weftwitch has one).
    model.restitchWeb?.();
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

// THREAD-THE-GAP rib emit (L155): during the fly-through pass, a few SLOW, reflectable
// AMBER bullets spawn from INSIDE the ribcage (rib-pivot parts) and CONVERGE toward the
// dragon's spine centre — the player is threading the barrel, so they read as closing in
// from all sides. Slow + parryable (the amber floor) because the boss is right on top of
// you; reflecting swats them boss-ward via the normal reflect path. Emits only from ribs
// still AHEAD of the player plane (rrel>0) so the convergence closes toward you, not away.
const _ribV = new THREE.Vector3();
const RIB_EMITTERS = ['ribPivotL1', 'ribPivotR1', 'ribPivotL3', 'ribPivotR3'];
function emitRibBullets(player) {
  if (!(model && model.partWorldPos)) return;
  const T = 0.9;   // convergence time — slow (a rib ~4u out closes at ~4u/0.9s ≈ fair)
  const cx = pose.x, cy = pose.y, crel = pose.rel;   // spine centre in the bullet frame
  for (const name of RIB_EMITTERS) {
    const w = model.partWorldPos(name, _ribV);
    if (!w) continue;
    const rx = w.x, ry = w.y, rrel = -w.z - player.dist;
    if (rrel <= 0.5) continue;   // rib already at/behind the player → skip (would fly away)
    // Constant-velocity aim so all bullets reach the spine centre together (converge),
    // then keep flying through it and cross the player plane (the dodge/parry check).
    // V4 (PR4): the amber carries its SOURCE RIB's name — a perfect parry snaps a
    // brand onto the organ that fired it (the C3 answer, wired at the roll-parry seam).
    emitBoss(rx, ry, (cx - rx) / T, (cy - ry) / T, (crel - rrel) / T, true, null, 1, null, rrel, name);
    // C3: an amber-CARRYING organ is dwell-exempt while its volley is in flight —
    // parry (V4) is the only sanctioned way to paint a venting organ.
    amberVent.set(name, fightNow + 2.2);
  }
}

// FLANK head-turn shots (L155): the body is flying forward on the flank but the head is
// craned at you (setHeadLook), so a few skull-origin amber shots close the normal FORWARD
// way (it's ahead of you now). Reuses the head-origin solver from PR1.
function emitHeadShots(player) {
  resolveEmitOrigin(player);
  const closing = B.bulletSpeed;
  const px = player.position.x, py = player.position.y;
  for (let i = -1; i <= 1; i++) {
    const v = aimVel(px + i * 1.8, py, closing);
    emitBoss(emitOrigin.x, emitOrigin.y, v.vx, v.vy, -closing, true, null, 1, null, emitOrigin.rel);
  }
}

// Resolve an attack id to bullets. Instant patterns fire one volley now; sustained
// patterns push timed sub-volleys onto `pending` so they stream over ~1.5–2s.
// HOLLOWGATE PANE-RADIAL fire (§5f/§5i.B): each LIVE rose pane emits a short
// radial fan OUTWARD along its own screen-radial (the beam IS the pane's radial),
// tagged with its pane index and amber-tipped so a parry lands on THAT pane
// (PANE BREAK). Cracked panes emit nothing — their radial is deleted from the
// composite. Origin is the window hub (def.muzzle 'roseHub', resolved into
// emitOrigin). Used for HOLLOWGATE's `spiral`/`spiralStream` when it has panes.
function firePaneRadial(player, spin = 0) {
  const live = model.livePanes ? model.livePanes() : [];
  if (!live.length) { return false; }
  const slow = B.bulletSpeed * 0.8;
  for (const idx of live) {
    const [dx, dy] = model.paneRadialDir(idx);
    // A 3-bullet fan hugging the pane's radial; the CENTRE bullet is amber +
    // part-tagged (the parry beat that cracks the pane). Rotated a touch by spin
    // (spiralStream sweeps the whole ring over its ticks).
    for (let j = -1; j <= 1; j++) {
      const ang = Math.atan2(dy, dx) + spin + j * 0.16;
      const amber = j === 0;
      emitBoss(emitOrigin.x, emitOrigin.y, Math.cos(ang) * 9, Math.sin(ang) * 9, -slow,
        amber, null, 1, null, emitOrigin.rel, amber ? idx : null);
    }
  }
  return true;
}

function executeAttack(id, player) {
  resolveEmitOrigin(player);   // head-origin patterns spawn from the body part
  const closing = B.bulletSpeed;
  // §5f: HOLLOWGATE re-expresses its radial patterns as PANE-RADIAL fire — the
  // window's live panes ARE the emitters (emitter = organ, §5f law 7), and
  // parrying a pane's amber cracks it (PANE BREAK). Cracked panes drop their arm.
  if (def?.destructiblePanes && model?.livePanes) {
    if (id === 'spiral') { spiralPhase += 0.5; if (firePaneRadial(player, spiralPhase)) return; }
    else if (id === 'spiralStream') {
      const steps = quality < 0.75 ? 6 : 9;
      for (let k = 0; k < steps; k++) pending.push({ t: k * 0.16, fire: () => firePaneRadial(player, spiralPhase + k * 0.4) });
      spiralPhase += steps * 0.4;
      return;
    }
  }
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
    // §5f WEFTWITCH (def.threadCut): the 'aimed' release IS the laserLance — the
    // taut thread lets go as an HDR beam flash (a VISUAL riding this shipped
    // pattern, owner-confirmed — never a new attack id) + the in-key stitch-pluck
    // (the loom is musical). Lives HERE, at the true emit site, so the ?debug
    // capture seam (bossFireNow) shows the same beam the production release does.
    // The beam AIMS AT THE PLAYER in model-local coords (placeGroup keeps the
    // facing near-identity; the flash is ~0.3s, so the small wobble never reads).
    if (def?.threadCut && model?.fireBeam) {
      const sc = def.scale ?? 1;
      model.fireBeam(
        (player.position.x - pose.x) / sc,
        (player.position.y - pose.y) / sc,
        (pose.rel + 8) / sc,               // a shoulder past the player plane
      );
      sfx.stitchPluck?.();
    } else if (def?.threadCut) { sfx.stitchPluck?.(); }   // def/model null on the headless debugEmitAttack flush
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
function emitBoss(x, y, vx, vy, vrel, reflectable = false, color = null, sizeMult = 1, coreColor = null, originRel = null, part = null) {
  spawnBossBullet({
    owner: 'boss', x, y, rel: originRel ?? pose.rel,
    vx, vy, vrel, color: color ?? (reflectable ? REFLECT_COLOR : bulletColor), reflectable,
    dmg: B.bulletDamage, r: B.bulletRadius * sizeMult, life: 6,
    coreColor: coreColor ?? 0xffffff, part,
  });
}

// Rider auto-attack: a homing chip shot fired from beside the player up at the boss.
function fireRiderShot(player) {
  // V1 aim-line retarget: a held line steers the auto-fire onto that organ (tagged
  // with the part), else the shot arcs to the pose centre exactly as before.
  const aim = lockAimTarget();
  const tgx = aim ? aim.x : pose.x;
  const tgy = aim ? aim.y : pose.y;
  const ox = player.position.x + 0.6;
  const oy = player.position.y + 0.4;
  const t = Math.max((pose.rel - 1.5) / B.bossSpeed, 0.05);
  spawnBossBullet({
    owner: 'rider', x: ox, y: oy, rel: 1.5,
    vx: (tgx - ox) / t, vy: (tgy - oy) / t, vrel: B.bossSpeed,
    targetRel: pose.rel, tx: tgx, ty: tgy,
    color: 0x8fe9ff, dmg: B.riderShotDamage * (adrenRung >= 3 ? 1.25 : 1), r: 0.45, life: 4,   // R3 weak-point chip bonus
    part: aim ? aim.part : null,
  });
}

// The organ names the V1 aim-line may target this fight: painted lockParts (PR2)
// plus the virtualLockOrgan V1 falls back to. Empty for a def with no lock data
// (coexist — the whole layer is inert and the rider fires exactly as before).
function lockCandidates() {
  if (!def) return [];
  const out = [];
  if (def.lockParts) for (const lp of def.lockParts) out.push(lp.part);
  if (def.virtualLockOrgan) out.push(def.virtualLockOrgan);
  return out;
}

// V1 teach (slot 1 VOIDMAW, §II.11): prompt in an opening exposure lull via the
// queued bossNote channel; RE-ARM until performed — mark seen only when the player
// holds a line ≥1s. Its own save bit (independent of V2's lockTaught).
// ---- THE LANCE V2 (lock-paint) wiring — SOP §II.5/§II.6 ----------------------

// THE ONE DEFLECT PREDICATE (single source of truth): every state in which a lance
// would ping for zero. lockLayer pauses painting, decay, the cap fuse, and queued
// launches on this — no lance is ever silently wasted (audit B2/B3/F2). Every future
// def that adds an invulnerable state must be reachable from here.
function lockDeflected() {
  if (shielded) return true;
  if (def.condenseInvuln && model.condenseLive && model.condenseLive() < 0.45) return true;   // swarm scattered
  // NB the eye-weak-point lid-down is NO LONGER a whole-layer seal (owner playtest:
  // "while the eye's down I can't tag ANYTHING, not even the shackles, for ages").
  // The submerged eye now seals only ITSELF (paintableParts drops def.eyeOrgan while
  // down) so the shackles stay brandable through the down windows; chip DAMAGE is
  // still gated by eyeIsUp (see damageBoss). Shield + survival card remain full seals.
  if (activeCard && activeCard.survival) return true;                                        // survival card
  return false;
}

// The current phase's hp span (hpMax × its atFrac slice) — the base of the per-volley
// ROI clamp (volley total ≤ volleyRoiFrac × this, enforced in lockLayer at release).
function currentPhaseHp() {
  const cur = def.phases[phaseIdx]?.atFrac ?? 1;
  const next = def.phases[phaseIdx + 1]?.atFrac ?? 0;
  return Math.max(1, (cur - next) * hpMax);
}

// V2 paintable organs this phase: def.lockParts filtered by their optional phase
// gate, PLUS the virtualLockOrgan on a V2 boss. On a lock-capable boss the aim
// anchor greens under the reticle (V1 rider-retarget) whenever the real lockParts
// coil out of the acquire cone — if it isn't ALSO brandable, the player locks it,
// gets no pip, and the aim can't hop (hop only fires on a paint), stranding the
// reticle on it until they fly out of retention (owner playtest: 'stuck on the
// head, have to disengage and wait for reset'). Making the anchor a real brand
// target closes that: every organ the reticle greens on now takes a mark. It's
// fair — the anchor is the muzzle (always emitting → always under fire, never a
// free rest-beat paint) — and UNPAINTED-FIRST still drives the sweep to the ribs
// for the rest of the cap. Slots 1–3 (virtualLockOrgan, NO lockParts) stay V1-only
// (this returns null there → no painting at all).
// ORGAN SHIMMER drive (PR6): pin a breathing jade glow on each UNPAINTED
// paintable organ. Dark while: the boss deflects (sealed honesty), the organ
// vents amber (C3 — "can't paint this right now", wordless), or it's painted
// (the brand mark owns it). Pure render — never consulted by any cone test.
function updateShimmer(time, ctx) {
  let used = 0;
  if (ctx.paintUnlocked && !ctx.deflected && ctx.paintables && model?.partWorldPos) {
    const painted = lockPaintedParts();
    const L = CONFIG.LOCK;
    // The organ the reticle is currently on + how far the dwell has progressed —
    // so the TARGETED organ can visibly respond (owner playtest: "I struggle to
    // paint the right target, I don't know which I've engaged, it's not engaging").
    const hud = lockHudState();
    const aimPart = hud.active ? hud.aimPart : null;
    const dwell = hud.dwell || 0;
    for (const part of ctx.paintables) {
      if (used >= SHIMMER_POOL) break;
      if (painted.includes(part)) continue;
      if (ctx.amberVenting && ctx.amberVenting(part)) continue;
      const w = model.partWorldPos(part, _shimV);
      if (!w) continue;
      const sp = shimmers[used++];
      sp.position.copy(w);
      // Bigger, brighter breath so the pick-menu reads at a glance: a wider glow
      // and a high FLOOR (never dims below ~0.7 of peak) so every paintable organ
      // is always clearly lit — the player picks which to fly to.
      // TARGETING FLARE: the organ the reticle is on GROWS + BRIGHTENS with the
      // dwell — the target visibly answers you, and the fill reads AS paint
      // progress ON the organ, not just a tiny reticle up top. So you can see
      // exactly which one you're painting (and steer off if it's the wrong one).
      const flare = (part === aimPart) ? (0.35 + 0.9 * Math.min(1, dwell)) : 0;
      sp.scale.setScalar((1.5 + flare * 1.5) * (def.scale ?? 1));
      const breath = 0.72 + 0.28 * Math.sin(time * L.shimmerHz * Math.PI * 2 + used * 1.7);
      sp.material.opacity = L.shimmerOpacity * (breath + flare * 2.4);
      sp.visible = true;
    }
  }
  for (let i = used; i < SHIMMER_POOL; i++) shimmers[i].visible = false;
}

function hideShimmers() {
  for (const sp of shimmers) sp.visible = false;
}

// BRAND TETHER drive (PR7): a line from the dragon's off-shoulder to each
// branded organ's live world pos (lockHudState().locks — the same anchors the
// marks/wisps use). Colour fades to black (additive → invisible) as the brand's
// life drains, so a dying tether visibly thins out. Pure render.
const _tethCol = new THREE.Color(0x50ffaa);
function updateTether(player) {
  if (!tether) return;
  const locks = lockHudState().locks || [];
  const pos = tether.geometry.attributes.position.array;
  const col = tether.geometry.attributes.color.array;
  const sx = player.position.x - 0.6, sy = player.position.y + 0.4, sz = -player.dist;
  const base = CONFIG.LOCK.tetherOpacity;
  let n = 0;
  for (const lk of locks) {
    if (n >= TETHER_MAX) break;
    const o = n * 6;
    pos[o] = sx; pos[o + 1] = sy; pos[o + 2] = sz;
    pos[o + 3] = lk.x; pos[o + 4] = lk.y; pos[o + 5] = lk.z;
    const k = base * Math.max(0, Math.min(1, lk.life ?? 1));
    // Shoulder end dimmer, organ end brighter (the line "arrives" at the mark).
    for (const [vi, m] of [[o, 0.4], [o + 3, 1]]) {
      col[vi] = _tethCol.r * k * m; col[vi + 1] = _tethCol.g * k * m; col[vi + 2] = _tethCol.b * k * m;
    }
    n++;
  }
  tether.geometry.setDrawRange(0, n * 2);
  if (n) { tether.geometry.attributes.position.needsUpdate = true; tether.geometry.attributes.color.needsUpdate = true; }
  tether.visible = n > 0;
}

function hideTether() {
  if (tether) { tether.visible = false; tether.geometry.setDrawRange(0, 0); }
}

// PR6 LIVENESS: a lockPart backed by a DESTRUCTIBLE sub-part must leave the
// paintable set when that sub-part dies — crackPane/crackShackle HIDE their
// nodes (partWorldPos still resolves), so without this filter the reticle
// would lead to, and lances would fly at, an invisible corpse. Convention map
// mirrors PART_SYS's name↔index seam (rosePaneN / shacklePostN).
function lockPartDead(part) {
  if (!def || !model) return false;
  if (def.destructiblePanes && part.startsWith('rosePane')) {
    return !(model.paneAlive?.(+part.slice(8)) ?? true);
  }
  if (def.destructibleShackles && part.startsWith('shacklePost')) {
    return !!model.shackleBroken?.(+part.slice(11));
  }
  return false;
}

function paintableParts() {
  if (!def || !def.lockParts) return null;
  // EYE-WEAK-POINT decouple (A): the eye organ leaves the paintable set ONLY while
  // it's submerged — so the shackles stay brandable through the down windows and the
  // eye itself waits for its surface. It rejoins the instant it surfaces.
  const eyeSealed = def.eyeWeakPoint && def.eyeOrgan && model.eyeIsUp && !model.eyeIsUp();
  const out = [];
  for (const lp of def.lockParts) {
    if (eyeSealed && lp.part === def.eyeOrgan) continue;
    if ((!lp.phases || lp.phases.includes(phaseIdx)) && !lockPartDead(lp.part)) out.push(lp.part);
  }
  if (def.virtualLockOrgan && !out.includes(def.virtualLockOrgan)) out.push(def.virtualLockOrgan);
  return out;
}

// Launch one WYRMFIRE WISP at a painted organ: a pooled boss-ward bullet that FANS
// OUT on its authored launch bearing (lanceFanDeg[i], Panzer-Dragoon lock-on style —
// mirrored pairs widening around straight-up), arcs for homeDelay, then homes onto
// the PART's live world position. Arrival emits the standard bossDamage event with
// kind:'lance' — every deflect gate in damageBoss applies, and PART_SYS counts it
// half (landing-point route), the rider-chip weight. Spawned from the dragon's
// off-shoulder (the rider fires from +0.6; wisps leave from −0.6). `vrel` is the
// plain bossSpeed — the arrival FRAME is identical to the pre-wisp straight lance.
const _lanceV = new THREE.Vector3();
function fireLanceAt(player, part, dmg, i = 0, n = 1) {
  const w = model && model.partWorldPos ? model.partWorldPos(part, _lanceV) : null;
  const tx = w ? w.x : pose.x, ty = w ? w.y : pose.y;
  const trel = w ? Math.max(-w.z - player.dist, 4) : pose.rel;
  const ox = player.position.x - 0.6, oy = player.position.y + 0.4;
  const L = CONFIG.LOCK;
  const a = L.lanceFanDeg[i % L.lanceFanDeg.length] * (Math.PI / 180);
  spawnBossBullet({
    owner: 'lance', x: ox, y: oy, rel: 1.5,
    vx: Math.cos(a) * L.lanceFanSpeed, vy: Math.sin(a) * L.lanceFanSpeed, vrel: B.bossSpeed,
    targetRel: trel, tx, ty,
    color: lanceTint, coreColor: 0xeafff6, dmg, r: 0.5, life: 4, part,
    homeDelay: L.lanceHomeDelay,
    curl: (i % 2 ? -1 : 1) * L.lanceCurlRate,   // deterministic: slot parity, no RNG
  });
}

// V2 teach (slot 4 MARROWCOIL, P2's authored lull — audit F3: intra-fight phase
// stagger keeps the band-2 concept load down; P1 belongs to the fight's own reads).
// Re-armed until performed; the flag is set by the lockPaint listener below.
// Once-per-fight SEALED hint: the player holds a line on a DEFLECTED boss for a
// beat → name what the game wants instead (the shield phase is the graze showcase;
// Surge is the only breaker). The reticle's sealed skin shows the state; this line
// explains it — the same pattern as the scattered-swarm / submerged-eye hints.
let lockSealHinted = false;
let sealHoldT = 0;
function driveSealHint(dt, ctx) {
  if (lockSealHinted || !ctx.paintUnlocked || !ctx.deflected) { sealHoldT = 0; return; }
  sealHoldT = (lockAimTarget() !== null ? sealHoldT + dt : 0);
  if (sealHoldT >= 0.9) {
    lockSealHinted = true;
    ui.bossNote?.('✦ SEALED — THE MARK WON\'T TAKE ✦', 'GRAZE ITS RINGS — UNLEASH TO BREAK', 'gold', 2.8);
  }
}
function driveLockTeach(dt, ctx) {
  if (!def || !def.lockParts || saveData.flags.lockTaught || !ctx.paintUnlocked) return;
  if (def.id !== 'marrowcoil' || phaseIdx < 1) return;
  lockTeachCd -= dt;
  if (ctx.exposureWindow && lockCount() === 0 && lockTeachCd <= 0) {
    ui.bossNote?.('HOLD YOUR LINE ON A RIB', 'PAINT A LOCK', 'gold', 2.6);
    lockTeachCd = 8;   // re-arm later if still unperformed
    // The SPECCED no-fail window (SOP §I.c V2 'first paint window is fire-free'):
    // each un-performed prompt holds the attack clock — a genuine breather to line
    // up the first paint while learning. Gone forever once lockTaught sets.
    attackTimer = Math.max(attackTimer, 3.5);
  }
}

// V4 SNAP teach (PR4): the first time a rib VENTS while the player could still
// use a brand, name the parry-paint rule once per prompt — re-armed until
// performed (the driveLockTeach shape). Gated to the teach boss so the concept
// lands where the C3 exemption is FELT (a venting rib refuses the dwell).
let snapTeachCd = 0;
function driveSnapTeach(dt, ctx) {
  if (!def || !def.lockParts || saveData.flags.snapTaught || !ctx.paintUnlocked) return;
  if (!saveData.flags.lockTaught) return;   // one concept at a time: paint first, then the snap
  if (def.id !== 'marrowcoil' || phaseIdx < 1) return;
  snapTeachCd -= dt;
  if (snapTeachCd > 0 || lockCount() >= (ctx.cap || 0)) return;
  const venting = (def.lockParts || []).some((lp) => ctx.amberVenting && ctx.amberVenting(lp.part));
  if (venting) {
    ui.bossNote?.('ITS AMBER GUARDS IT', 'PERFECT-PARRY TO BRAND THE SOURCE', 'gold', 2.6);
    snapTeachCd = 10;   // re-arm later if still unperformed
  }
}

// V5 FOCUS teach (PR5): on the slot-5 fight (EITHERWING — the fast-orbit seeker
// organs are exactly what focus is FOR), prompt the hold once per lull until
// performed; performing it (holding focus ≥0.8s with the layer live) retires it.
let focusTeachCd = 0;
let focusHeldT = 0;
function driveFocusTeach(dt, ctx) {
  if (!def || saveData.flags.focusTaught || !ctx.paintUnlocked) return;
  if (ctx.focusHeld) {
    focusHeldT += dt;
    if (focusHeldT >= 0.8) { saveData.flags.focusTaught = true; persist();
      ui.bossNote?.('FOCUSED — THE MARK TAKES FASTER', '', 'gold', 1.8); return; }
  } else {
    focusHeldT = 0;
  }
  if (def.id !== 'eitherwing') return;   // teach where the fast targets make it matter
  focusTeachCd -= dt;
  if (ctx.exposureWindow && focusTeachCd <= 0) {
    ui.bossNote?.('STEADY YOUR TALONS', 'HOLD A SECOND FINGER (OR F) TO FOCUS', 'gold', 2.6);
    focusTeachCd = 9;   // re-arm later if still unperformed
  }
}

// Dismiss-on-perform (the hints.js BIT.roll pattern): the first paint retires the
// teach forever; the first CAP volley names the release rule once; the first
// SNAP-paint (p.snap — the perfect-parry brand) retires the V4 teach.
on('lockPaint', (p) => {
  if (!saveData.flags.lockTaught) { saveData.flags.lockTaught = true; persist(); }
  // BRAND POP (owner playtest: "it's not engaging, I don't know what I've
  // engaged"): a bright jade+white burst ON the organ the instant it takes the
  // brand — the unmistakable "engaged!" confirmation (its shimmer also dies). A
  // stack pops smaller (a refresh, not a fresh organ).
  if (p && model && model.partWorldPos) {
    const w = model.partWorldPos(p.part, _brandPopV);
    if (w) {
      burst(w, 0x50ffaa, { count: p.stacked ? 5 : 11, speed: p.stacked ? 6 : 9, size: 0.75, life: 0.36 });
      burst(w, 0xeafff6, { count: p.stacked ? 2 : 4, speed: 14, size: 0.5, life: 0.22 });
    }
  }
  if (p && p.snap && !saveData.flags.snapTaught) {
    saveData.flags.snapTaught = true; persist();
    ui.bossNote?.('THE MARK ANSWERS THE PARRY', '', 'gold', 1.8);
  }
});
on('lockVolley', (p) => {
  if (p && p.source === 'cap' && !saveData.flags.lockCapSeen) {
    saveData.flags.lockCapSeen = true; persist();
    ui.bossNote?.('LOCKS FULL', 'LANCES FLY THEMSELVES', 'gold', 2.6);
  }
  // V3.E1 PERFECT RELEASE (PR5): a manual loose on the music beat — the score
  // reward (parry stays score-premier: 150 < parryScore×1.7 tier) + the callout.
  if (p && p.perfect) {
    const pts = Math.round(CONFIG.LOCK.perfectReleaseScore * game.scoreMult);
    game.score += pts;
    ui.bossNote?.('♪ ON THE BEAT ♪', `+${pts}`, 'gold', 1.6);
  }
});

function driveAimTeach(dt, ctx) {
  if (!def || !def.virtualLockOrgan || saveData.flags.aimTaught) return;
  if (lockAimHeld()) {
    aimHeldT += dt;
    if (aimHeldT >= 1.0) { saveData.flags.aimTaught = true; persist(); return; }
  } else {
    aimHeldT = 0;
  }
  if (def.id !== 'voidmaw') return;   // only the slot-1 teach fight prompts
  aimTeachCd -= dt;
  if (ctx.exposureWindow && !lockAimHeld() && aimTeachCd <= 0) {
    ui.bossNote?.('HOLD YOUR LINE ON THE EYE', 'YOUR RIDER STRIKES IT', 'gold', 2.6);
    aimTeachCd = 8;   // re-arm the prompt later if still unperformed
  }
}

// §5f DESTRUCTIBLE SUB-PARTS (HOLLOWGATE panes — the prove-then-extend hero).
// Route a landed hit to a part: a REFLECTED amber carries its source-pane tag
// (parry a pane's radial → THAT pane takes the count); a plain rider chip is
// routed by the x/y landing point through the model's own hit test. N counted
// hits crack the pane: its radial deletes from the composite (visual + pattern)
// and a bonus chunk of hp rewards the sculpting. Bosses without the def flag /
// model hooks never enter this path (coexist).
// §5f DESTRUCTIBLE SUB-PARTS — a def-gated SYSTEM (prove on HOLLOWGATE's panes,
// slot 6; extend to BRINEHOLM's shackle posts, slot 8, with zero new plumbing).
// Each entry names the def flag + the model's own hit-test/crack/alive/live hooks
// so the routing is part-agnostic; a boss without the flag/hooks never enters it.
const PART_CRACK_HITS = 3;
const PART_SYS = [
  { flag: 'destructiblePanes', crack: 'crackPane', hit: 'paneHitTest', alive: 'paneAlive', live: 'livePanes',
    key: 'pane', note: ['✦ PANE SHATTERED ✦', 'ITS RADIAL IS SILENCED'], event: 'bossPaneBreak',
    lockName: (i) => 'rosePane' + i },   // PR6: the sub-part's LANCE organ name (index↔name seam)
  // BRINEHOLM: `shackleBroken(i)` is the alive-inverse; freeing a post vents a pink
  // SPRAY-SOAK graze beat and softens phase 3 (the mercy payoff — handled below).
  { flag: 'destructibleShackles', crack: 'crackShackle', hit: 'shackleHitTest', broken: 'shackleBroken', live: 'liveShackles',
    key: 'shackle', note: ['✦ SHACKLE SNAPPED ✦', 'FREED EARLY — IT EASES'], event: 'bossShackleBreak', spray: true,
    lockName: (i) => 'shacklePost' + i },
];
const partHits = new Map();          // "key:idx" → accumulated counted hits (reset per encounter)
function routePartDamage(e) {
  for (const sys of PART_SYS) {
    if (!def?.[sys.flag] || !model?.[sys.crack]) continue;
    let idx = (typeof e.part === 'number') ? e.part : -1;
    // Fallback routing by landing point (boss-local frame: world x/y minus the
    // group origin at pose) — rider chips aimed at the centre miss the part by
    // design; only a shot that actually lands on it routes here.
    if (idx < 0 && model[sys.hit] && e.x != null && e.y != null) idx = model[sys.hit](e.x - pose.x, e.y - pose.y);
    const isAlive = sys.alive ? model[sys.alive]?.(idx) : (idx >= 0 && !model[sys.broken]?.(idx));
    if (idx < 0 || !isAlive) continue;
    // Reflected ambers count FULL; a rider chip that happens to land counts half
    // (the parry is the sculptor, gunfire helps — §5i.C job). PR3: an explicit e.w
    // wins (the aimed Surge beam carries beamPartWeight 1.5) — legacy callers omit it,
    // so the number is byte-identical wherever e.w is undefined.
    const w = e.w ?? ((typeof e.part === 'number') ? 1 : 0.5);
    const mk = `${sys.key}:${idx}`;
    const n = (partHits.get(mk) ?? 0) + w;
    partHits.set(mk, n);
    if (n >= PART_CRACK_HITS && model[sys.crack](idx)) {
      sfx.shieldShatter?.();
      if (group) burst(group.position, def.accent, { count: 14, speed: 16, size: 1.0, life: 0.6 });
      cameraCtl.shake?.(0.6);
      ui.bossNote?.(sys.note[0], sys.note[1], 'gold', 2.2);
      emit(sys.event, { [sys.key]: idx, left: model[sys.live]?.().length ?? 0 });
      // PR6: a destroyed sub-part can't keep a brand — drop any pip on it
      // (silent; the shatter IS the feedback) so no mark sits on a corpse and
      // no lance flies at one. The liveness filter keeps it out of re-acquire.
      if (sys.lockName) dropLockPart(sys.lockName(idx));
      if (sys.spray) ventSprayBeat();   // §5i.B the freed post vents a 2× pink SPRAY-SOAK graze beat
      return 6;                        // bonus chip: sculpting visibly accelerates the kill (§5i.C law 4)
    }
    return 0;
  }
  return 0;
}
// §5i.B SPRAY-SOAK: a freed shackle VENTS a burst of pink graze motes from the maw
// that drift down the lane TOWARD the player (aimed like the absorbColor shed) to be
// soaked for Surge — the mercy vents a reward. Rides the existing soak-mote economy.
function ventSprayBeat() {
  const p = lastPlayer; if (!p) return;
  const my = pose.y - 3 * (def.scale ?? 1), rel0 = pose.rel;
  for (let i = 0; i < 8 && soakList.length < SOAK_MAX; i++) {
    const a = (i / 8) * Math.PI * 2;
    const sx = pose.x + Math.cos(a) * 2, sy = my + Math.sin(a) * 1.2;
    soakList.push({ x: sx, y: sy, rel: rel0,
      vx: (p.position.x - sx) * 0.06 + Math.cos(a) * 1.4,
      vy: (p.position.y - sy) * 0.06 + Math.sin(a) * 1.4,
      vrel: -(rel0 + 2) / 2.2,   // reach the player's plane over ~2.2s (the absorbColor convention)
      ttl: 2.8, spray: true });
  }
}

function damageBoss(amount, kind, e = null) {
  if (phase !== 'fight') return;
  // §5f SURVIVAL-CARD SEAL (slot 10 debut — The Last Toll): while a `survival` card
  // runs, the boss is SEALED — all damage deflects and the UNFILLABLE BAR is the tell
  // (§5f's exact grammar). No bubble: the tolls keep firing (a pure-dodge exam) and
  // the dread setpiece runs. Outlasting the timer resolves the card (see the card
  // timeout); lances already deflect via lockDeflected.
  if (activeCard && activeCard.survival) { model?.flash?.(0.12); sfx.shieldPing?.(); return; }
  if (shielded) {
    // Chip/reflect PINGS off the armour — a clang + spark telegraph "a different
    // thing is needed now" (charge Surge), not "keep hitting it".
    sfx.shieldPing?.();
    if (group && Math.random() < 0.5) burst(group.position, def.glow, { count: 4, speed: 10, size: 0.7, life: 0.3 });
    return;
  }
  // §5d slot 7 (THRUMSWARM): CHIP only lands while the swarm is CONDENSED. Scattered =
  // invulnerable (the turn-taking tell) — the hit sparks off the dispersed cloud with no
  // damage, so the player learns to strike the condensed windows. The SURGE beam is
  // EXEMPT (`kind === 'surge'`): banked surge is the player's big investment and always
  // lands, whether it breaks a shield or chips an unshielded boss (review P2 — otherwise
  // firing Surge on a scattered swarm wasted it). Def-gated on `condenseInvuln`.
  if (def.condenseInvuln && kind !== 'surge' && model.condenseLive && model.condenseLive() < 0.45) {
    sfx.shieldPing?.();
    if (!swarmDeflectHinted) { swarmDeflectHinted = true; ui.bossNote?.('✦ SCATTERED — UNTOUCHABLE ✦', 'STRIKE WHEN IT CONDENSES', 'gold', 2.6); }
    emit('bossDeflect', { reason: 'scattered' });
    return;
  }
  // §5f part routing runs FIRST — the shackle mercy is ALWAYS live: a shot on a post
  // still counts toward freeing it even while the eye is submerged (you free the
  // beast during the invulnerable windows). Returns the +bonus chip on a break.
  const partBonus = e ? routePartDamage(e) : 0;   // §5f: a landed part-hit cracks a pane/shackle (+bonus chip)
  // §5f slot 8 (BRINEHOLM): body CHIP only lands while the EYE is SURFACED (the
  // turn-taking tell) — while the heavy lid is DOWN the drowned god is invulnerable
  // and the shot pings off (the shackle count above still applied). SURGE is exempt
  // (the player's banked graze always lands). Def-gated on `eyeWeakPoint`.
  if (def.eyeWeakPoint && kind !== 'surge' && model.eyeIsUp && !model.eyeIsUp()) {
    sfx.shieldPing?.();
    if (!eyeDeflectHinted) { eyeDeflectHinted = true; ui.bossNote?.('✦ SUBMERGED — UNTOUCHABLE ✦', 'STRIKE WHEN THE EYE SURFACES', 'gold', 2.6); }
    emit('bossDeflect', { reason: 'eyeDown' });
    return;
  }
  amount += partBonus;
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
  clearLocks('death');   // THE LANCE layer: drop aim/lock state on a hard teardown
  musicRestore();        // §5f: a hard teardown never strands the run in silence (idempotent)
  removeSeed();   // §5e: no stale horizon silhouette across a run teardown
  // Release the cinematic entrance if we tore down mid-flythrough (game over during
  // the overtake): drop the slow-mo, the camera hijack, and the facing override.
  cineYaw = null; cineSkip = false; entranceId = null; poseSmooth = false; fightWobbleT = 1e9;
  releaseCineSlow();
  cameraCtl.setOvertake?.(null);
  model?.setEyeLock?.(false);
  ui.cinematicHold?.(false);
  ui.bossWarnClear?.(); ui.hudSewClear?.();   // §5b hudSew: no pinned banner/threads survive a teardown
  // Hard reset (game over / new run): if a fight was live and NOT already won,
  // the player died to this boss — accrue the death-to (§5h; slot 9 reads it).
  if (active && def && phase !== 'dying') recordBossLedger(def.id, { death: true });
  activeCard = null; cardTimer = 0;
  ui.bossCardClear?.();
  if (group && scene) { scene.remove(group); model && model.dispose && model.dispose(); }
  resetBossBullets();
  clearSoakMotes();            // §5i.B: no stray pink mote frozen across a run teardown (review P2)
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
  hideShimmers();
  hideTether();
  sfx.dwellHum?.(0);
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
  // §5i.B: neutralise the ladder's published effects on teardown (coexist floor).
  setGrazeBonus(1); game.adrenGainMult = 1;
  beamHeld = 0; beamTick = 0; beamGrace = 0; adrenRung = 0; adrenT = 0;
  activeBand = BAND;
  arenaHW = arenaTargetHW = CONFIG.laneHalfWidth;
  game.bossArenaHW = null;
  if (wallL) { wallL.visible = wallR.visible = false; wallMat.opacity = 0; }
  // Debug pull-in stays EXACT (tests/playtest rely on it); the live first
  // encounter snaps to the fixed biome offset (§5h — nearest rung to firstAt).
  nextBossDist = debugFirstAt ?? snapBossDist(B.firstAt - CONFIG.biomeLength * 0.35);
  encounterIndex = 0;
  // §5h ladder: a NEW RUN re-enters at the lowest lifetime-unbeaten slot and
  // clears the felled-this-run exclusion.
  felledRun.clear();
  ladderSlot = null;
  cadenceMult = 1;
  lastBossKey = null;   // §6 anti-repeat memory resets with the run
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

// Capture hook (?debug): crack a destructible sub-part live (HOLLOWGATE pane N)
// so the integration shots can show a broken window + its silenced radial.
// Capture hooks (?debug): fire the WEFTWITCH thread-cut / gap-restitch beats live
// (the debugCrackPane precedent) so the integration shots show the real payoffs.
export function debugThreadCut(player) {
  if (!active || !def?.threadCut) return false;
  triggerThreadCut(player);
  return true;
}
export function debugRestitch() {
  if (!active || !model?.restitchWeb) return false;
  model.restitchWeb();
  return true;
}

export function debugCrackPane(i) {
  if (!active || !model?.crackPane) return false;
  const ok = model.crackPane(i);
  // Mirror the production crack branch (routePartDamage): a destroyed pane
  // drops its brand too, so the debug seam observes the same behaviour.
  if (ok) dropLockPart('rosePane' + i);
  return ok;
}

// Capture hook (?debug): arm a named setpiece LIVE from the current fight so a tool can
// watch the whole moving beat play out (the ribThread maneuver + its rib bullets) without
// having to drive the boss down to the phase that arms it. No-op outside an active fight.
export function debugRunSetpiece(id) {
  if (!active || phase !== 'fight') return;
  const sp = (Array.isArray(def.setpieces) && def.setpieces.find((s) => s.id === id))
    || (def.setpiece && def.setpiece.id === id ? def.setpiece : null)
    || { id, dur: 8.0, moving: true };
  if (!SETPIECE_PATHS[sp.id]) return;
  setpieceDef = sp;
  setpieceT = 0;
  if (!sp.moving) { attackTimer = Math.max(attackTimer, sp.dur + 1.2); riderTimer = Math.max(riderTimer, sp.dur); }
}

// Capture hook: snap straight to the FIGHT phase at station, skipping warn + the
// entrance. THRUMSWARM's deep-dilate entrance (2.8s @0.24×) crawls under headless rAF
// throttle, stalling capture tools for minutes; this lands the fight instantly for a
// still. Capture-only (never wired into gameplay); no-op once already fighting.
export function debugForceFight(player) {
  if (!active || !player) return;
  if (phase === 'fight' || phase === 'dying') return;
  const B = CONFIG.BOSS;
  pose.x = 0; pose.y = B.fightHeight; pose.rel = B.settleGap;
  cineSkip = false; cineYaw = null; entranceId = null; poseSmooth = false; fightWobbleT = 1e9;
  releaseCineSlow();
  cameraCtl.setOvertake?.(null);
  placeGroup(player, 0, 0.016);
  enterFight();
}

// PR3 test seams (headless, deterministic — no flaky rAF-throttled dwell/charge):
// bank pips directly, read the aimed-beam part pick, and fire the Surge climax
// synchronously. Only touch live state when a fight is running.
export function debugBankLocks(n = 2) {
  const cands = lockCandidates();
  if (!cands.length) return 0;
  const parts = [];
  for (let i = 0; i < n; i++) parts.push(cands[i % cands.length]);
  return __testBank(parts);
}
export function debugBeamAimPart(px = 0, py = 0) {
  return beamAimPart({ position: { x: px, y: py } })?.part ?? null;
}
export function debugLockCandidates() { return lockCandidates(); }
export function debugPartWorldPos(part) {
  const w = model && model.partWorldPos ? model.partWorldPos(part, _beamV) : null;
  return w ? { x: w.x, y: w.y, z: w.z } : null;
}
export function debugStrikeSurge() {
  if (phase !== 'fight' || !lastPlayer) return false;
  strikeSurge(lastPlayer);
  return true;
}
export function debugRaiseShield() {
  if (phase !== 'fight') return false;
  shielded = true;
  model?.setShieldVisible?.(true);
  return true;
}
// PR6 test seams: the live paintable set (liveness-filtered) + shimmer state.
export function debugPaintables() { return paintableParts(); }
export function debugShimmerCount() { return shimmers.filter((s) => s.visible).length; }
export function debugTetherCount() { return tether && tether.visible ? tether.geometry.drawRange.count / 2 : 0; }

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
