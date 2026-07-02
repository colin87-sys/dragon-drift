import * as THREE from 'three';
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { ui } from './ui.js';
import { sfx, setSlowMo } from './sfx.js';
import { input } from './input.js';
import { cameraCtl } from './cameraController.js';
import { burst } from './particles.js';
import { emit, on } from './events.js';
import { clearAhead } from './obstacles.js';
import { buildBoss } from './bossModel.js';
import { BOSSES, BOSS_ORDER, bossDefForIndex } from './bossDefs.js';
import { saveData, persist } from './save.js';
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
let nextBossDist = B.firstAt;
let encounterIndex = 0;

// Boss Rush (gauntlet): run the unlocked bosses back-to-back with a short ring
// breather between each, then emit 'rushClear'. Architected so an endless variant
// (loop the queue with per-lap scaling) can slot in later. Kept OFF for a normal run.
let rushMode = false;
let rushQueue = [];            // BOSS_ORDER keys to run, in order (only the beaten ones)
let rushIndex = 0;             // which queue entry is current
let rushUnlockAll = false;     // dev seam: treat every boss as unlocked
const RUSH_LEAD = 240;         // metres of warm-up before the first boss flies in
const RUSH_BREATHER = 420;     // metres of ring-recharge between bosses (heal + re-arm surge)

// The rush roster: bosses the player has DEFEATED (so a new boss must be beaten in
// normal play before it joins the gauntlet), or every boss under a dev unlock — the
// `?dev`/`?rush=all` URL seam OR the in-app Settings → Dev Mode toggle (live).
export function rushRoster() {
  const beaten = saveData.bossRush?.beaten || [];
  const devAll = rushUnlockAll || !!saveData.settings?.dev;
  return BOSS_ORDER.filter((k) => devAll || beaten.includes(k));
}
export function rushUnlocked() { return rushRoster().length > 0; }
export function setRushUnlockAll(v) { rushUnlockAll = !!v; }

// Richer roster for the pre-launch panel: every boss with its unlock state + name +
// body colours (for a themed chip), plus the best clear time. Locked bosses are
// shown as "to unlock" so the roster teases what's still ahead without clutter.
export function rushRosterInfo() {
  const beaten = saveData.bossRush?.beaten || [];
  return {
    bosses: BOSS_ORDER.map((k) => ({
      id: k, name: BOSSES[k].name, title: BOSSES[k].title,
      accent: BOSSES[k].accent, glow: BOSSES[k].glow,
      unlocked: rushUnlockAll || beaten.includes(k),
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
let dyingT = 0;
let spiralPhase = 0;
let pendingDeath = false;      // set when hp hits 0; resolved in the update loop
let rollParried = false;       // this roll already landed a parry (announce once per roll)
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
const pending = [];            // streamed sub-volleys: { t, fire } (tunnel / spiralStream)
const SUSTAINED = new Set(['tunnel', 'spiralStream', 'movingGap', 'iris', 'stream', 'secondWave']);
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
  baitTimer = 0; baitLeft = 0; baitResting = false;
  bandIdx = 0;
  activeBand = resolveBand(biomeIndexAt(player.dist));
  bulletColor = def.bulletColor ?? 0xff2b6a;
  pending.length = 0;
  chargeT = 0;
  curAttack = null;
  // Fresh fight = full-width arena; the walls take the boss's accent colour.
  arenaHW = arenaTargetHW = CONFIG.laneHalfWidth;
  game.bossArenaHW = null;
  if (wallMat) wallMat.color.setHex(def.accent ?? 0x35e0ff);
  if (def.constrictPhase === 0) arenaTargetHW = CONSTRICT_HW;   // constrict from the opener

  model = buildBoss(def, quality);
  group = model.group;
  group.userData.__isBoss = true;   // debug seam: locate the boss in the scene graph
  scene.add(group);

  // Approach choreography: come in from behind (overtake up and over) or sweep
  // in from the side, then settle dead ahead and face the player.
  if (def.approachFrom === 'side') {
    start.rel = B.settleGap;
    start.x = (Math.random() < 0.5 ? -1 : 1) * 22;
    start.y = B.fightHeight;
  } else {
    start.rel = -12;
    start.x = (Math.random() < 0.5 ? -1 : 1) * 4;
    start.y = 7;
  }
  pose.x = start.x; pose.y = start.y; pose.rel = start.rel;
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
  // clears as the boss flies in. 'side' → left/right edge; 'behind' → bottom-centre
  // (where it rises from behind), matching where it actually emerges.
  const dir = def.approachFrom === 'side' ? (start.x < 0 ? 'left' : 'right') : 'bottom';
  ui.bossWarning?.(def.name, def.title, dir, B.warnTime);
  sfx.feverStart?.();
  cameraCtl.shake?.(1.2);
  emit('bossStart', { id: def.id });
}

// Begin a Boss Rush run: queue the unlocked bosses and schedule the first one a
// short warm-up ahead. main.js suppresses the obstacle course for the whole run
// (rings/orbs only), so the gauntlet is boss → breather → boss → … → 'rushClear'.
export function startBossRush(player) {
  rushMode = true;
  rushQueue = rushRoster();
  rushIndex = 0;
  encounterIndex = 0;
  active = false;
  if (rushQueue.length === 0) { emit('rushClear', { count: 0 }); nextBossDist = Infinity; return; }
  nextBossDist = player.dist + RUSH_LEAD;
}

export function inBossRush() { return rushMode; }

function endEncounter(player) {
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
      emit('rushClear', { count: rushQueue.length });
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
  reticleTarget = 0;            // focus circle draws off as the boss disintegrates
  arenaTargetHW = CONFIG.laneHalfWidth;   // storm walls glide out with the dissolve
  resetBossBullets();
  game.bossesDefeatedRun++;
  const bonus = Math.round(B.defeatScore * game.scoreMult);
  const embers = B.defeatEmbers;
  game.score += bonus;
  game.embersRun += embers;       // banked at run end like any ember haul
  ui.bossNote?.('✦  SLAIN  ✦', `+${bonus}   ◆${embers}`, 'gold', 3.2);
  ui.bossFelledCard?.(def.name);   // kill card: gold "FELLED" + the boss name
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
    if (warnT <= 0) phase = 'approach';
  } else if (phase === 'approach') {
    approachT += dt;
    const k = Math.min(approachT / B.approachTime, 1);
    const e = easeInOut(k);
    pose.x = start.x + (0 - start.x) * e;
    pose.rel = start.rel + (B.settleGap - start.rel) * e;
    // Arc up and over the player on a behind-approach so it never clips the dragon.
    const arc = def.approachFrom === 'side' ? 0 : Math.sin(k * Math.PI) * 6;
    pose.y = start.y + (B.fightHeight - start.y) * e + arc;
    if (k >= 1) {
      phase = 'fight';
      attackTimer = rand(0.9, 1.3);
      // Materialise the health bar now that it's settled in front, and animate it
      // filling 0→full before the rider opens fire (no janky bar during the fly-in).
      model.setHealthBarVisible(true);
      model.setHealth(0);
      hpRevealT = HP_REVEAL;
      riderTimer = HP_REVEAL;
      // Spectacle beat: the boss notices you (builder-owned, optional) + the
      // FromSoft-style reveal card (name + epithet). REVEAL HOLD — guarantee the
      // card's readable without a bullet in your face: push both the boss's own
      // attack clock AND the rider's auto-fire out past the card's hold time.
      model.notice?.();
      ui.bossTitleCard?.(def.name, def.epithet, def.accent);
      attackTimer = Math.max(attackTimer, 1.9);
      riderTimer = Math.max(riderTimer, 1.9);
      // Tutorial boss: teach the parry as the fight opens (amber shots = swat-able).
      if (def.tutorial) ui.bossNote?.('DODGE!', 'ROLL INTO AMBER SHOTS TO PARRY', 'gold', 3.0);
    }
  } else if (phase === 'fight') {
    // Hold station ahead and "fly backward"; gentle strafe/bob keeps it alive.
    pose.rel = B.settleGap;
    pose.x = Math.sin(time * 0.7) * 5.0;
    pose.y = B.fightHeight + Math.sin(time * 1.3) * 0.8;

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
        model.flash(0.9);
        tmp.set(pose.x, pose.y, -(player.dist + pose.rel));
        burst(tmp, bulletColor, { count: 10, speed: 14, size: 0.9, life: 0.4 });   // "shots away" muzzle flash
        executeAttack(curAttack, player);
        const ph = def.phases[phaseIdx];
        attackTimer = rand(ph.cadence[0], ph.cadence[1]);
      }
    } else if (pending.length === 0) {
      // Idle between attacks → count down, then begin telegraphing the next one.
      attackTimer -= dt;
      if (attackTimer <= 0) {
        const ph = def.phases[phaseIdx];
        curAttack = ph.attacks[(Math.random() * ph.attacks.length) | 0];
        chargeDur = curAttack === 'curtain' ? B.telegraphWall
          : (SUSTAINED.has(curAttack) ? B.telegraphSustained : B.telegraphInstant);
        chargeT = chargeDur;
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

  placeGroup(player, time);
}

function placeGroup(player, time) {
  if (!group) return;
  group.visible = phase !== 'warn';   // stay hidden behind while the warning flashes
  group.position.set(pose.x, pose.y, -(player.dist + pose.rel));
  // Face the player (local +z = front maw, world +z = toward the player) with a
  // little menacing yaw/roll wobble.
  group.rotation.set(0, Math.sin(time * 0.5) * 0.12, Math.sin(time * 0.9) * 0.08);
  // GAZE FEED (optional model hook): normalized offset of the player relative to
  // the boss's facing axis, in WORLD axes — placeGroup keeps rotation near-
  // identity so world≈local, and the model handles its own local conversion.
  // Skipped during 'warn' (the boss is still hidden then; nothing to sell yet).
  if (phase !== 'warn') {
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
  const next = def.phases[phaseIdx + 1];
  if (next) {
    phaseIdx++;
    ui.bossNote?.(`PHASE ${phaseIdx + 1}`, def.name, 'phase', 2.6);
    emit('bossPhase', { phase: phaseIdx + 1 });
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

// Solve the lateral velocity that puts a bullet on a target point as it closes.
function aimVel(targetX, targetY, closing) {
  const t = Math.max(pose.rel / closing, 0.05);
  return { vx: (targetX - pose.x) / t, vy: (targetY - pose.y) / t };
}

// Resolve an attack id to bullets. Instant patterns fire one volley now; sustained
// patterns push timed sub-volleys onto `pending` so they stream over ~1.5–2s.
function executeAttack(id, player) {
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
      emitBoss(pose.x, pose.y, v.vx, v.vy, -closing, true);
    }
  } else if (id === 'fan') {
    const n = quality < 0.75 ? 5 : 7;
    for (let i = 0; i < n; i++) {
      const spread = (i / (n - 1) - 0.5) * 16;   // ±8m across the lane around the player
      const v = aimVel(px + spread, py, closing);
      emitBoss(pose.x, pose.y, v.vx, v.vy, -closing, true);
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
    // sidestep isn't enough — peel away in a smooth arc while it fires.
    const ticks = quality < 0.75 ? 10 : 14;
    const slow = closing * 0.95;
    for (let k = 0; k < ticks; k++) {
      pending.push({ t: k * 0.14, fire: () => {
        const v = aimVel(player.position.x, player.position.y, slow);
        emitBoss(pose.x, pose.y, v.vx, v.vy, -slow);
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
          emitBoss(pose.x, pose.y, v.vx, v.vy, -slow, false, b.c, b.s);
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
  fireRing(cx, cy, 3.6, quality < 0.75 ? 11 : 15, B.bulletSpeed * 0.8, b.c, b.s, 0x2a1020);   // denser = clearer circle
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
function emitBoss(x, y, vx, vy, vrel, reflectable = false, color = null, sizeMult = 1, coreColor = null) {
  spawnBossBullet({
    owner: 'boss', x, y, rel: pose.rel,
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
  rushMode = false; rushQueue = []; rushIndex = 0;
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

// Debug hook: drop straight into a fight (wired under ?debug in main.js).
// `idx` forces a specific BOSS_ORDER entry (?bossIdx=K) for preview judging.
export function forceBoss(player, idx = null) {
  startBossEncounter(player, idx != null ? bossDefForIndex(idx) : undefined);
}

export function bossDebugState() {
  return { active, phase, hp, hpMax, phaseIdx, shielded, bullets: bossBulletCount(), nextBossDist, warnT, approachT, poseRel: pose.rel, charging: chargeT > 0 };
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
