import * as THREE from 'three';
import { CONFIG } from './config.js';
import { damp, makeGlowTexture, makeTrailTexture } from './util.js';
import { buildDragonModel } from './dragonModel.js';
import { buildRiderFigure, riderMaterials } from './riderParts.js';
import { setFeverTint } from './postfx.js';
import { setFeverWarm, getHeroRim } from './environment.js';
import { setWaterHeroPool } from './water.js';
import { applyRim, updateRim, resetRim } from './rimLight.js';
import { flapWing, formStrength, formSpeed } from './dragonWingFlap.js';
import { solveWing, flapEnv } from './wingFlapSolver.js';
import { on, emit } from './events.js';

// EMBERSIGHT H6 — the ember SWALLOW (§B.7): a 150ms coreGlow opacity tick on ember
// pickup — the dragon eats the ember. One module-level subscription (events are
// singletons); the tick is applied in the coreGlow update below and decays out.
const SWALLOW_DUR = 0.15;
let swallowT = 0;
on('ember', () => { swallowT = SWALLOW_DUR; });

// EMBERSIGHT H6 — the overtake trail flash (§B.12): on a rival overtake the trail
// flashes gold for 1s (the world echo of the Bell's RIVAL BEATEN). Rides the
// existing per-dragon trail-tint seam (pickTrailHex); decays in updateFx.
const OVERTAKE_GOLD = 0xffd86a;
let trailGoldT = 0;
on('overtake', () => { trailGoldT = 1.0; });
import { setFlapDebugPose, resolveWingDebug } from './wingDebugPose.js';
import { createPulseTimer, mulberry32 } from './pulseTimer.js';
import { createArcCrown } from './stormArcs.js';
import { setActiveDetail } from './modelDetail.js';
import { bondState } from './dragonBond.js';
import { initRibbonSim, updateRibbonSim, ribbonToLocal } from './ribbonSpine.js';

// ── EMBERSIGHT H7 — DRAGON VITALS (the living gauge, HUD-REDESIGN §B.1/§B.2) ──
// All state for the flag-gated bond channel. THE HARD CONTRACT: while the
// DRAGON VITALS toggle is OFF, this layer contributes exactly ×1 / +0 to every
// shipped material write and never creates an object — the dragon is
// byte-identical to the shipped game (the off-proof harness asserts it).
// Everything below is created LAZILY on the first enabled frame and torn down
// with the dragon, so tricount / the shipped roster never see it.
let bondNubsBuilt = false;
let bondNubMats = [];        // 3 rank-shared mats (root/carpal/tip) — SAME mat L/R (mirror law)
let bondNubMeshes = [];      // the 6 charge-stud meshes (for teardown bookkeeping)
let bondBleedMotes = [];     // ~12 pooled ember-bleed sprites (scene-level, like the trail pools)
let bondPrevHealth = null;   // wound edge detector (null = no baseline)
let bondBodyBaseHex = null;  // bodyMat identity colour, cached before the first ash write
let bondBodyWriting = false; // are we currently colouring the body? (restore-once on exit)
let bondCoreBaseHex = null;  // coreGlow base colour, cached before the first danger write
let bondCoreWriting = false;
let bondBodyMul = 1;         // damped health multiplier on the body emissive floor (≥0.75)
let bondCoreAdd = 0;         // additive coreGlow term (1-heart heartbeat) — 0 when flag OFF
let bondDangerMix = 0;       // damped 0..1 blend into the danger-magenta heartbeat
const _bondC1 = new THREE.Color();
const _bondC2 = new THREE.Color();
const BOND_ASH = 0x4a4f55;         // cold-ash target for the wounded body lerp (§B.1)
const BOND_DANGER = 0xff2f8e;      // danger-magenta heartbeat hue (magenta role)
const BOND_NUB_EMISSIVE = 0x6fd6ff; // wing-charge cyan (the stamina role colour)

// ── EMBERSIGHT H8 — SPINE-IGNITION surge (§B.3) ──────────────────────────────
// Five dorsal surge nodes ignite nose→tail, one per chained ring; all lit = the
// tail-tip node blazes gold. THE SHAPE-AGNOSTIC FALLBACK CONTRACT (risk #5 —
// roster-safe on day one, author heroes incrementally):
//   1. AUTHORED dorsal markers: any Object3D in the model with
//      `userData.vitalsSurgeNode = <order>` (0 = nose-most). A recipe publishes
//      up to 5; fewer is fine (the ladder compresses).
//   2. TAIL-CHAIN fallback: nodes distribute along tailSegs (every roster
//      dragon with a tail gets spine ignition for free).
//   3. CORE-GLOW fallback (tail-less/GLB shapes): the chained charge rides
//      coreGlow as stepped brightness — never an error, never a missing channel.
let bondSurgeMats = [];      // 5 per-node materials (nodes light independently)
let bondSurgeMode = '';      // 'markers' | 'tail' | 'core' (debug/tests)
let bondSurgeAdd = 0;        // coreGlow fallback term — exactly 0 when flag OFF
const BOND_SURGE_GOLD = 0xffc24a;   // surge role gold (matches the DOM gem ramp)
const BOND_TRAIL_GOLD = 0xffd86a;   // trail-as-combo tint target (§B.4, lerp cap 0.5)

// Procedural dragon + rider. Built from a dragon def (dragons.js: palette,
// model proportions, fx) and a rider def (riders.js: outfit, hair, accessory,
// glow). disposeDragon/rebuildDragon let the shop swap either mid-session.

let sceneRef = null;
let activeDef = null;
let activeRider = null;

// `?wingDebug=<glide|recovery|apex|downstroke|settle|fold|bank>` FREEZE mode: holds the wings
// at one named pose (5 cycle points + fold/bank posture pins) via the SHARED poser
// (wingDebugPose.js), so EVERY wing path — skinned, yoke, per-form, and the basic direct-pivot
// the starters ride — is freezable at the same reproducible pose the studio captures. Logs the
// resolved config + the wing's WORLD-frame elevation to prove gameplay reproduces the harness.
const WING_DEBUG = (typeof location !== 'undefined' && location.search)
  ? new URLSearchParams(location.search).get('wingDebug') : null;
let wingDebugLogged = false;

// `?strikePin=<t01>` STRIKE-PIN passthrough (TEMPEST §B.4b): freezes the shared
// js/pulseTimer.js strike clock at a named phase so timed-spectacle captures are
// pixel-comparable round-over-round (the MARROWCOIL determinism law extended to timed
// spectacle). 0 = the standing/rest frame (no strike), 0.5 = a mid-window strike peak.
// Parsed module-scope exactly like ?wingDebug; the guarded storm tick that reads it and
// drives the Storm Circuit lands with the lightning at I4 (at I0 the Tempest has no timer
// wired yet — this is the tooling landing before the geometry it captures, per §B.7 I0).
const STRIKE_PIN = (typeof location !== 'undefined' && location.search && new URLSearchParams(location.search).has('strikePin'))
  ? Number(new URLSearchParams(location.search).get('strikePin')) : null;
let bodyFlapLift = 0;   // flap-coupled body pitch (chest lift at apex / compress on downstroke); set by the yoke solver

let group = null;
// The dragon root group (for the N6 hero-shadow silhouette pass, which renders it
// alone on a dedicated layer). Null before createDragon / after dispose.
export function getDragonGroup() { return group; }
let wingYokeL = null;  // root shoulder-carrier stage (Mk II yoke wings), null otherwise
let wingYokeR = null;
let wingPivotL = null;
let wingPivotR = null;
let wingMidL = null;  // middle joint of the 3-segment articulated wing (Mk II), null otherwise
let wingMidR = null;
let carpalSpireL = null;  // Solar CP3.3: flap-decoupled carpal spire groups (counter-rotated against the beat), null otherwise
let carpalSpireR = null;
let wingTipL = null;  // secondary fold joint for 2-segment wing
let wingTipR = null;
let wingPivot2L = null;
let wingPivot2R = null;
let wingRigL = null;  // skinned-wing flap rigs (shoulder/elbow/wrist), null otherwise
let wingRigR = null;
let wingLobePivotsL = null;  // jade silk-fin per-lobe furl pivots ({pivot,idx,side}), null otherwise
let wingLobePivotsR = null;
let wingBladePivotsL = null;  // blade-feather comb per-blade lag pivots, null otherwise
let wingBladePivotsR = null;
let glbAnim = null;   // { mixer } for an asset-backed (GLB) dragon, null otherwise
let head = null;
let tailSegs = [];
let spineSegs = [];       // night-fury body-spine whip bones (empty for every other dragon)
let surge01 = 0;          // Dragon-Surge (fever) blend
let boost01 = 0;          // held speed-boost blend (distinct from surge)
let decel01 = 0;          // boost-RELEASE air-brake spike, eases out
let prevSpeedActive = false;
let flapPhase = 0;        // INTEGRATED wingbeat clock (advance by dt·flapSpeed, NOT time·freq)
let scarfPhase = 0;       // integrated rider-scarf sway clock (same reason)
let vySmooth = 0;         // lagged vertical velocity → vertJerk drives the spine pitch-whip
let tailFins = [];        // apex deployable tail-fin groups (empty for every other dragon)
let tailDeploy = 0.82;    // deploy factor: cruise 0.82 · boost 1.0 · Surge 1.08
let bodySegs = null;      // segmented-wyrm body plates (lead-first travelling wave)
let bodyWave = null;      // koiSerpent shader travelling-wave uniform ({uniforms,baseSpeed})
// RIBBON drive temporaries (reused each frame — no per-tick allocation).
const _ribHeadW = new THREE.Vector3(), _ribAnchor = new THREE.Vector3(), _ribFwd = new THREE.Vector3(), _ribInvQ = new THREE.Quaternion();
let ribbonCurl = 0;   // slowly-ramped steer signal → the sustained-turn body curl (the "twirl" beat)
let ribDriveX = 0, ribDriveY = 0;   // smoothed steer/pitch magnitude → the swim swells into your movement
let jadePearlMat = null;  // jade river-pearl material — the ONE bloom, breathes with the swim (CP3)
let jadeTipGemMat = null; // jade fin-tip dew gems — pearl-light travels here, phase-lagged (glow-up)
let jadeChainMats = null; // jade pearl-chain links 1/3/4 (sat/lyre/streamer) — pulsed via userData.baseIntensity (§4.3b)
let jadeWaveRiders = null;// jade lyre gems — separate meshes riding the bodyWave (§4.5) or they detach
let tailOrbiters = null;  // orbiting tail shards / ring fragments

// Materials animated at runtime (boost glow / fever tint)
let bodyMat = null;
let wingMat = null;
let eyeMat = null;
// Wing-tip contrail markers + fever aura
let tipMarkerL = null;
let tipMarkerR = null;
let auraSprite = null;
// HERO POINT LIGHT (Fable 75) — the player's REAL light: pools specular on the water + kisses
// the drake's underside (the premium answer to the flat additive halo). A PERSISTENT singleton
// (created once, re-PARENTED on shop rebuild, never re-created) so NUM_POINT_LIGHTS stays 1 and
// the lit shaders never recompile mid-flight. Hue is per-skin (pulled toward warm-neutral); only
// intensity is driven per frame. _heroPos/heroPoolK feed the water hero-pool term.
let heroLight = null;
const _heroPos = new THREE.Vector3();
let heroPoolK = 0;
let coreGlow = null;      // violet core energy sprite (pulses during Surge)
let spineMats = [];       // spine/crest/seam/plate mats → flared AND rim-lit in Surge
let spineFlareMats = [];  // spineMats + optional FLARE-ONLY mats (materials.flareMats): flared but NOT rim-lit — for dense fields (wing feathers) that the strong Surge rim would wash to cream
let graveMatPulse = [];   // cached grave-light buckets (userData.gravePulseBucket set) — the Revenant gap-pulse tick; empty for every other dragon
let stormArcMats = [];    // TEMPEST storm circuit — the guarded storm tick is their SINGLE writer (§5d); empty for every other dragon
let stormTimer = null;    // the tempest's pulseTimer strike clock (null unless a storm dragon is equipped)
let stormEnvHist = [];    // ring of recent { t, env } so a strike TRAVELS root→tip (bucket b reads env at t − 0.04·b)
let stormCoreKick = 1;    // the strike kicks the dynamo — coreGlow.userData.base is scaled by this pre-read
let arcCrown = null, arcBeat = -1, arcRestruck = false, motifAnchor = null;   // the Surge ARC CROWN (tempest only)
let stormCrack = 0;       // #5 the thunder-crack scalar (0..1) shared to the eyes/wash so they flash on the beat
const arcCamDir = new THREE.Vector3(0, 0.45, 1);   // toward the chase cam in dragon-local space (billboard axis)
const _av1 = new THREE.Vector3(), _av2 = new THREE.Vector3(), _av3 = new THREE.Vector3(), _av4 = new THREE.Vector3();
// The arc routes — leaps between her own anatomy. Over-the-back wingtip↔wingtip is the money arc (always
// included); the rest are seeded so no two beats are identical. Endpoints re-sampled live (track the flap).
function pickStormArcRoutes(seed) {
  if (!(tipMarkerL && tipMarkerR && motifAnchor)) return [];
  const rng = mulberry32(seed | 0);
  const wl = () => tipMarkerL.getWorldPosition(_av1), wr = () => tipMarkerR.getWorldPosition(_av2),
    dyn = () => motifAnchor.getWorldPosition(_av3),
    tail = () => (tailSegs.length ? tailSegs[tailSegs.length - 1].getWorldPosition(_av4) : motifAnchor.getWorldPosition(_av4));
  void tail;   // dynamo→tail dropped: from the chase cam it overlapped her silhouette and bloomed into an
               // on-body smear, not an air leap (#5). The cage is now wingtip↔wingtip + wingtip→sternum.
  const routes = [{ getA: wl, getB: wr, forks: 3 }];   // the over-the-back HERO arc — always
  // a GUARANTEED second bolt wingtip→sternum so the "cage of storm" always shows ≥2 legible arcs, never
  // one hero + two ghosts (#3); a seeded third from the OTHER wingtip keeps no two beats identical.
  const first = rng() < 0.5;
  routes.push(first ? { getA: wl, getB: dyn, forks: 2 } : { getA: wr, getB: dyn, forks: 2 });
  if (rng() < 0.55) routes.push(first ? { getA: wr, getB: dyn, forks: 2 } : { getA: wl, getB: dyn, forks: 2 });
  return routes;
}
const _stormBase = new THREE.Color();   // scratch: per-mat base emissive for the strike-peak hue lerp
const _stormHot = new THREE.Color(0xf2f4ff);   // the near-white strike core (hue-lerp target at env>0.85)
let surgeMix = 0;         // 0..1 damped Surge transition
let prevFever = false;    // rising-edge detect for the Surge ignition flourish
let surgeAnimT = 0;       // one-shot transformation timer (s)
const _surgeBaseCol = new THREE.Color();
const _surgeHi = new THREE.Color(); // per-dragon Surge highlight (def.surgeHi)
let quality = 1;

// Cinematic look-yaw override (ASHTALON overtake): the dragon+rider turn to face
// the boss during the flythrough. null = normal (velocity-based) yaw.
let lookYaw = null;
export function setDragonLook(yaw) { lookYaw = yaw; }

// PR-C THE VISIBLE INHALE: 0..1 charge amount fed per-frame from main.js
// (lockHudState().fuse01 while the lance cap fuse burns — the setDragonLook
// pattern). Drives the rear-cam telegraph: torso ARCH + wing MANTLE + jade glow.
// LAW: at 0 every injected term below is exactly 0 → pose/glow byte-identical
// (the L245 endpoint law; the wingflap/flapcheck suites never set it, so they
// prove the endpoint).
let inhaleTarget = 0;
let inhale01 = 0;
const _jadeGlow = new THREE.Color(0x50ffaa);
export function setDragonInhale(x) { inhaleTarget = Math.max(0, Math.min(1, x || 0)); }

export function setDragonQuality(q) {
  quality = q;
}

// Geometry level-of-detail for the next (re)build — 'low' | 'high' | 'ultra'.
// main.js resolves this from the MODEL DETAIL setting + the live render tier and
// sets it before a gated rebuildDragon (menus/death only, never mid-flight). It
// is applied to the process-wide active level in createDragon so the dragon AND
// rider both build at it. HIGH = today's geometry.
let modelDetail = 'high';
export function setDragonModelDetail(level) { modelDetail = level; }
export function getDragonModelDetail() { return modelDetail; }

// Rider
let riderHead = null;
let riderGroup = null;
let scarfMesh = null;
let riderGlow = null;     // glow sprite behind the rider (premium riders)
let riderOrbiters = [];   // orbiting shards (Void Oracle) animated each frame
let coronaSpin = null;    // Solar CP3 eclipse-corona ring — slow in-plane rotation (the eclipse crawls)
const PONY_LEN = 0.24;
let ponySegs = 10;
let ponyPoints = [];
let ponyMeshes = [];

// Speed trail: two separate pools — body trail and boost-only trail
const TRAIL_POOL = 140;
let trailSprites = [];
let boostTrailSprites = [];
let emberMotes = [];   // Phoenix ember-feathers / Sovereign arcane surge motes
let moteTimer = 0;
let emberEmitters = null;   // optional trailing-edge/tail FX emit anchors (phoenixReforged) → shed fire off the length, not one root point
let moteIdx = 0;
let wingMotes = [];    // cyan wingtip wisps (apex Obsidian — def.model.wingParticleRate)
let wingMoteTimer = 0;
let wingMoteSide = 0;
let trailTimer = 0;
let boostTrailTimer = 0;
let contrailTimer = 0;
let trailPaletteIdx = 0;
let thrusterFireSprites = [];   // jet fire trail from the rear thrusters (Eternal + Surge)
let thrusterFireTimer = 0;
let thrusterEmitters = [];      // emitter markers collected from the twinThrusters layer
let wingtipTrailSprites = [];   // thin wing-edge trails (boost/surge, custom colour on surge)
let wingtipTrailTimer = 0;
let aeroShearSprites = [];      // hard-bank wingtip vortex / aero-shear (white vapor)
let aeroShearTimer = 0;

// Trail color for a freshly-spawned sprite: cycles the equipped flightmark's
// trailPalette (aurora/goldleaf) when present, else the flat per-dragon color.
function pickTrailHex(fallback) {
  if (trailGoldT > 0) return OVERTAKE_GOLD;   // H6 §B.12 the 1s overtake gold flash overrides the tint
  const pal = activeDef && activeDef.trailPalette;
  const hex = (pal && pal.length) ? pal[trailPaletteIdx++ % pal.length] : fallback;
  // H8 §B.4 trail-as-combo (flag-gated): the trail lerps toward ember-gold with
  // the combo tier — LERP CAP 0.5 so it never overrides the dragon's identity
  // hue (risk #7). Exactly the authored hex when the toggle is OFF or combo=1.
  const bs = bondState();
  if (bs.enabled && bs.vitals.active && bs.surge.comboT > 0.01) {
    _bondC1.setHex(hex);
    _bondC2.setHex(BOND_TRAIL_GOLD);
    return _bondC1.lerp(_bondC2, 0.5 * bs.surge.comboT).getHex();
  }
  return hex;
}

// Ice-burst death particles
const BURST_COUNT = 60;
let burstParticles = [];
let burstActive = false;
let burstTimer = 0;

const tmpV = new THREE.Vector3();
const tmpV2 = new THREE.Vector3();
const _rimCol = new THREE.Color();    // scratch for the per-frame rim hue
const _rimHi = new THREE.Color();     // scratch for the Surge rim highlight
let bankZ = 0; // banking component of rotation.z (roll spin stacks on top)

export function createDragon(scene, def, riderDef) {
  sceneRef = scene;
  activeDef = def;
  activeRider = riderDef;

  // Pin the geometry LOD for this whole build (dragon + rider read the process-
  // wide active level via seg()). buildDragonModel inherits it (no opts.detail).
  setActiveDetail(modelDetail);
  const result = buildDragonModel(def);
  group = result.group;
  coronaSpin = group.getObjectByName('eclipseCorona') || null;   // Solar CP3: cache the eclipse ring for the crawl
  ({ head, tailSegs, wingPivotL, wingPivotR, wingTipL, wingTipR,
     wingPivot2L, wingPivot2R, tipMarkerL, tipMarkerR } = result.parts);
  wingMidL = result.parts.wingMidL || null;
  wingMidR = result.parts.wingMidR || null;
  carpalSpireL = result.parts.carpalSpireL || null;
  carpalSpireR = result.parts.carpalSpireR || null;
  wingYokeL = result.parts.wingYokeL || null;
  wingYokeR = result.parts.wingYokeR || null;
  wingRigL = result.parts.wingRigL || null;
  wingRigR = result.parts.wingRigR || null;
  wingBladePivotsL = result.parts.wingBladePivotsL || null;
  wingBladePivotsR = result.parts.wingBladePivotsR || null;
  wingLobePivotsL = result.parts.wingLobePivotsL || null;
  wingLobePivotsR = result.parts.wingLobePivotsR || null;
  tailFins = result.parts.tailFins || [];
  spineSegs = result.parts.spineSegs || [];
  bodySegs = result.parts.bodySegs || null;
  bodyWave = result.parts.bodyWave || null;   // koiSerpent travelling-wave uniform (jade)
  // RIBBON (jade): stand up the follow-the-leader sim on the published ribbon record and switch the
  // re-loft branch on. The head lays a world breadcrumb trail; the body samples it at rest arc-length
  // offsets → straight input settles to a line, a hard steer whips head→tail, sustained turning coils.
  if (bodyWave && bodyWave.ribbon) {
    // Swim tuned for a SILKY 3D travelling S the ribbon always carries: a bold lateral wave + a
    // phase-shifted vertical wave (soft helix), swelling toward the tail. driveX/driveY (set each
    // tick from steer/pitch input) swell it into left/right + up/down; the path carries the big turns.
    initRibbonSim(bodyWave.ribbon, {
      // headFade 3 (wave ENTERS just behind the head, not a dead front half) + swimGrow 0.45 (neck
      // carries ~40-55% of the tail's amplitude so the whole torso participates) + swimFreq 0.9
      // (~1.9 wave periods → two visible humps = a real travelling S, not a single slight bend).
      swimAmp: 1.2, swimAmpY: 0.95, swimFreq: 0.9, swimSpeed: 2.7, swimPhaseY: 1.5,
      swimGrow: 0.4, headFade: 3, curlAmp: 3.6,
    });
    bodyWave.ribbon.active = true;
  }
  jadePearlMat = result.parts.pearlMat || null;   // jade river-pearl — breathes with the swim (CP3)
  jadeTipGemMat = result.parts.tipGemMat || null; // jade fin-tip dew gems — shimmer travels here (glow-up)
  jadeChainMats = result.parts.pearlChainMats || null;   // jade pearl-chain (§4.3b) — sat/lyre/streamer, each its own lag
  jadeWaveRiders = result.parts.waveRiders || null;      // jade lyre gems ride the bodyWave (§4.5)
  tailOrbiters = result.parts.tailOrbiters || null;
  glbAnim = result.parts.glbAnim || null;   // asset-backed baked-clip mixer (if any)
  ({ bodyMat, wingMat, eyeMat } = result.materials);
  auraSprite = result.auraSprite;
  coreGlow = result.parts.coreGlow;
  emberEmitters = result.parts.emberEmitters || null;
  spineMats = result.materials.spineMats || [];
  spineFlareMats = result.materials.flareMats ? spineMats.concat(result.materials.flareMats) : spineMats;   // flare-only mats join the flare loop but NOT the rim (applyRim below stays on spineMats)
  graveMatPulse = (result.materials.flareMats || []).filter((m) => m.userData && m.userData.gravePulseBucket != null);   // the Revenant gap-pulse buckets (empty for every other dragon)
  // TEMPEST STORM CIRCUIT — cache the arc mats + build the deterministic strike clock. Duty (lit
  // fraction) ramps with the CHARGING ladder via the form's arcDuty (0.06→0.18). Seeded so the
  // schedule is reproducible (determinism is a deliverable); null for every other dragon.
  stormArcMats = result.parts.stormArcMats || [];
  stormTimer = stormArcMats.length
    // ERRATIC idle crackle — real heat-lightning, not a metronome (owner: "more erratic instead of in
    // beat, just like lightning"). A "flash" is an IRREGULAR cluster of 1–3 quick soft swells (each
    // 0.10–0.30 s, tight 0.06–0.18 s stutter-gaps) then a LONG uneven quiet (the duty-solved rest ≥1.2 s
    // varies with the cluster size → no two flashes land the same). Kept SMOOTH + near-zero flicker so it
    // still WELLS not strobes (owner also disliked "flickers too fast"); the root→tip travel makes each
    // flash read as current racing out the circuit to the wingtips.
    ? createPulseTimer({ seed: (def.model.stormSeed ?? 0x7e57) | 0, duty: def.model.arcDuty ?? 0.10, windowMin: 0.10, windowMax: 0.30, burstMin: 1, burstMax: 3, gapMin: 0.06, gapMax: 0.18, smooth: true, flickerDepth: 0.05 })
    : null;
  stormEnvHist = [];
  stormCoreKick = 1;
  // ARC CROWN (Surge signature) — build it for a storm dragon, anchored to the wingtips/dynamo/tail.
  if (arcCrown && arcCrown.group.parent) arcCrown.group.parent.remove(arcCrown.group);
  arcCrown = null; arcBeat = -1;
  motifAnchor = result.parts.motifAnchor || null;
  if (stormArcMats.length && tipMarkerL && tipMarkerR && motifAnchor) {
    arcCrown = createArcCrown(THREE, {});
    group.add(arcCrown.group);
  }

  // Fresnel rim light on the hero's solid surfaces — lifts the silhouette off a
  // bright sky/water. Additive to outgoing light (independent of the emissive
  // Surge animation below). Cleared first so a shop rebuild doesn't leak the
  // old materials' uniform sets into the registry.
  resetRim();
  // rimPowerMul tightens the Fresnel exponent per-dragon (higher = a thinner, hotter silhouette line
  // rather than a broad wash the backlight averages away). The Tempest runs it hot so her cold storm
  // edge clears bright water instead of collapsing to a silhouette (glow-up P1b).
  const rpm = def.rimPowerMul ?? 1;
  applyRim(bodyMat, { strength: 0.0, power: 3.2 * rpm, mul: def.rimBodyMul ?? 1 });
  // rimWingMul tames the wing rim per-dragon: flat faceted wings catch far more grazing-angle rim than the
  // rounded body, so a body-tuned cruise rim washes the whole wing in a cheap chrome outline the body
  // lacks. The Tempest (hot P1b rim + flat storm panels) drops it hard so the wing matches the body.
  applyRim(wingMat, { strength: 0.0, power: 2.4 * rpm, mul: def.rimWingMul ?? 1, wing: true });   // wing: the per-biome backlit boost is DAMPED ×0.35 on flat facets (Fable 79 — no chrome plates)
  for (const m of spineMats) applyRim(m, { strength: 0.0, power: 3.0 * rpm });
  surgeMix = 0;
  surgeAnimT = 0;
  prevFever = false;

  // H7 DRAGON VITALS: the bond FX are per-dragon (nubs live in the old group,
  // its mats died with it) — reset so an enabled flag lazily rebuilds them for
  // THIS dragon. Colour caches must re-read the new materials.
  bondNubsBuilt = false;
  bondNubMats = [];
  bondNubMeshes = [];
  bondPrevHealth = null;
  bondBodyBaseHex = null;
  bondBodyWriting = false;
  bondCoreBaseHex = null;
  bondCoreWriting = false;
  bondBodyMul = 1;
  bondCoreAdd = 0;
  bondDangerMix = 0;
  bondSurgeMats = [];
  bondSurgeMode = '';
  bondSurgeAdd = 0;

  // Per-dragon Surge wash hue (def.feverWash): the Phoenix Rebirth washes warm
  // gold, the Sovereign eclipse washes cool blue, the rest keep the magenta default.
  setFeverTint(def.feverWash || null);
  setFeverWarm(!!def.fireTrails);   // fire dragons: the Surge sky/aurora go FIERY ember, not magenta (keeps the phoenix's warm colours from washing to cream)

  buildRider(riderDef, result.parts.riderSocket);
  scene.add(group);

  // HERO POINT LIGHT (Fable 75): create ONCE, then re-parent to each new group on rebuild
  // (THREE.add auto-detaches from the old, disposed group) so the scene always holds exactly
  // one point light → no shader recompile after the first build. Parented to `group` (the
  // auraSprite's pre-scale local space) so the offset rides the dragon's pitch/roll — the
  // underside kiss stays under the chest as it banks. r160 physical units (decay 2).
  if (!heroLight) heroLight = new THREE.PointLight(0xffffff, 12, 34, 2);
  heroLight.position.set(0, -0.7, -0.35);   // under the chest, nosed toward the head
  group.add(heroLight);
  // Per-skin hue pulled 45% toward warm-neutral so no skin dyes the water acid (Azure's
  // 142,213,255 → #C1DBDF, a soft ice-warm white — blue identity kept, never a blue lamp).
  heroLight.color.set(`rgb(${def.fx.auraColor})`).lerp(new THREE.Color(0xffe2b8), 0.45);

  // Ponytail chain (world-space follow), length varies per rider
  const hairMat = new THREE.MeshStandardMaterial({ color: riderDef.hair, roughness: 0.9 });
  ponySegs = riderDef.ponySegs;
  ponyPoints = [];
  ponyMeshes = [];
  for (let i = 0; i < ponySegs; i++) {
    ponyPoints.push(new THREE.Vector3(0, 9, i * PONY_LEN));
    const r = 0.12 * (1 - i / (ponySegs + 2));
    const m = new THREE.Mesh(new THREE.SphereGeometry(Math.max(r, 0.04), 8, 6), hairMat);
    scene.add(m);
    ponyMeshes.push(m);
  }

  // Speed-trail pools. FIRE dragons (def.fireTrails) build the trail textures WARM with a cream (not
  // hard-white) core, so the additive tail-exhaust / body-trail read as FIRE instead of a blue-skirt
  // gray + white-core cloud that stacks along the rear-chase axis into a cream plume (the "white mess").
  const fireTrails = def.fireTrails;
  const cyanTex = makeTrailTexture(fireTrails ? '255,150,60' : '120,220,255', fireTrails ? '255,226,184' : '255,255,255');   // Fable 79: tight shoulder-free falloff — the frozen puff-stack was reading as balloons under the hero
  const blueTex = makeTrailTexture(fireTrails ? '255,110,30' : '80,130,255', fireTrails ? '255,214,150' : '255,255,255');

  trailSprites = [];
  for (let i = 0; i < TRAIL_POOL; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: cyanTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    s.visible = false; s.userData.life = 0;
    s.layers.set(1);
    scene.add(s);
    trailSprites.push(s);
  }
  boostTrailSprites = [];
  for (let i = 0; i < TRAIL_POOL; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: blueTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    s.visible = false; s.userData.life = 0;
    s.layers.set(1);
    scene.add(s);
    boostTrailSprites.push(s);
  }
  // Thruster jet-fire pool: a stream behind each rear thruster, emitted only on the
  // Eternal form during Surge, tinted per-spawn to the Surge highlight. Emitter markers
  // (from the twinThrusters layer) are collected so the pods are the source.
  const fireTex = makeGlowTexture('255,255,255');
  thrusterFireSprites = [];
  for (let i = 0; i < 80; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: fireTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    s.visible = false; s.userData.life = 0;
    s.layers.set(1);
    scene.add(s);
    thrusterFireSprites.push(s);
  }
  thrusterEmitters = [];
  group.traverse((o) => { if (o.userData && o.userData.svjThrusterEmitter) thrusterEmitters.push(o); });
  // Wing-edge trails + hard-bank aero-shear vortex (both emit from the wingtip markers,
  // reuse the white glow texture; tinted per spawn).
  wingtipTrailSprites = [];
  for (let i = 0; i < 36; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fireTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.visible = false; s.userData.life = 0; s.layers.set(1); scene.add(s); wingtipTrailSprites.push(s);
  }
  aeroShearSprites = [];
  for (let i = 0; i < 28; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fireTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.visible = false; s.userData.life = 0; s.layers.set(1); scene.add(s); aeroShearSprites.push(s);
  }

  // Glowing motes: the Phoenix sheds warm ember-feathers continuously; dragons
  // with def.surgeMotes (the Sovereign) breathe cool arcane motes during Surge.
  // One white-texture pool, tinted per mote so it serves both.
  emberMotes = [];
  if (def.archetype === 'phoenix' || def.surgeMotes) {
    const moteTex = makeGlowTexture('255,255,255');
    const poolN = def.fireTrails ? 60 : 44;   // fireTrails needs headroom for the one-shot ignition ember-burst on top of the continuous shed
    for (let i = 0; i < poolN; i++) {   // a touch larger so trailing-edge emitters (phoenixReforged) can shed a continuous fire without starving the pool
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: moteTex, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      s.visible = false; s.userData.life = 0; s.userData.vy = 0;
      s.layers.set(1);
      scene.add(s);
      emberMotes.push(s);
    }
  }

  // Wingtip wisps: cool cyan motes shed continuously from the wing-tip markers —
  // the apex Obsidian's stealth-plasma accent (def.model.wingParticleRate > 0). A
  // small dedicated pool, allocated only when asked, so every other dragon pays
  // nothing (no pool, no emit, no per-frame cost).
  wingMotes = [];
  if ((def.model.wingParticleRate || 0) > 0) {
    const wispTex = makeGlowTexture('120,220,255');
    for (let i = 0; i < 24; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: wispTex, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      s.visible = false; s.userData.life = 0; s.userData.vy = 0;
      s.layers.set(1);
      scene.add(s);
      wingMotes.push(s);
    }
  }

  // Death-burst crystal shards
  const shardMat = new THREE.MeshStandardMaterial({
    color: 0xaaddff, emissive: 0x44aaff, emissiveIntensity: 2.5,
    transparent: true, opacity: 1,
  });
  burstParticles = [];
  for (let i = 0; i < BURST_COUNT; i++) {
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.22 + Math.random() * 0.28, 0), shardMat.clone());
    shard.visible = false;
    shard.userData.vel = new THREE.Vector3();
    scene.add(shard);
    burstParticles.push(shard);
  }

  return group;
}

function buildRider(riderDef, socket) {
  const rider = new THREE.Group();
  riderGroup = rider;

  // The character (torso-up, with its signature headgear/back-gear/trail) is
  // built by the shared riderParts module so it matches the shop turntable.
  const mats = riderMaterials(riderDef);
  const fig = buildRiderFigure(riderDef, mats);
  rider.add(fig.group);
  riderHead = fig.head;
  scarfMesh = fig.trail;        // a Group now; the trail swings as one
  riderOrbiters = fig.orbiters; // empty for most riders
  riderGlow = fig.glow;
  if (riderGlow) riderGlow.layers.set(1); // bloom layer in-game
  // `?norider` (capture-only): HIDE the rider + its bloom glow so a dragon review/hero shot reads
  // the CREATURE, not the premium-rider glow sprite at its back. All refs stay valid (the animator
  // writes riderGroup/scarfMesh/riderHead unguarded) — we only flip visibility. No gameplay effect.
  try {
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('norider')) {
      rider.visible = false; if (riderGlow) riderGlow.visible = false;
    }
  } catch { /* no location */ }

  // Saddle + cinch straps anchoring the rider to the dragon's back.
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x3a1b16, roughness: 0.75 });
  const amberMat = new THREE.MeshStandardMaterial({ color: 0xffb13d, emissive: 0x773100, emissiveIntensity: 0.35, roughness: 0.45 });
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.5), strapMat);
  saddle.position.set(0, -0.16, -0.02);
  rider.add(saddle);
  for (const sx of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.5, 0.08), amberMat);
    strap.position.set(sx * 0.26, 0.05, 0.03);
    rider.add(strap);
  }

  // Seat the rider at the torso's published socket (front-third, believable),
  // defaulting to the back-of-shoulders spot the dragons have always used.
  const rs = socket || { x: 0, y: 1.12, z: -0.6 };
  rider.position.set(rs.x, rs.y, rs.z);
  group.add(rider);
}

// Remove every scene object this module owns (dragon, rider, ponytail,
// trail pools, death shards) so a new dragon/rider combo can be built.
export function disposeDragon() {
  if (!sceneRef || !group) return;
  group.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
  sceneRef.remove(group);
  for (const m of ponyMeshes) {
    m.geometry.dispose();
    sceneRef.remove(m);
  }
  for (const s of [...trailSprites, ...boostTrailSprites, ...emberMotes, ...wingMotes, ...bondBleedMotes]) {
    s.material.dispose();
    sceneRef.remove(s);
  }
  bondBleedMotes = [];   // H7: nub meshes/mats die with the group traverse above
  for (const p of burstParticles) {
    p.geometry.dispose();
    p.material.dispose();
    sceneRef.remove(p);
  }
  group = null;
  wingPivot2L = null;
  wingPivot2R = null;
  wingYokeL = null;
  wingYokeR = null;
  wingMidL = null;
  wingMidR = null;
  carpalSpireL = null;
  carpalSpireR = null;
  bodySegs = null;
  bodyWave = null;
  jadePearlMat = null;
  jadeTipGemMat = null;
  jadeChainMats = null;
  jadeWaveRiders = null;
  tailOrbiters = null;
  ponyMeshes = [];
  trailSprites = [];
  boostTrailSprites = [];
  emberMotes = [];
  wingMotes = [];
  burstParticles = [];
  burstActive = false;
}

// Shop equip: tear down and rebuild at the player's current position.
export function rebuildDragon(def, riderDef, player) {
  disposeDragon();
  createDragon(sceneRef, def, riderDef);
  resetDragon(player);
}

// Hide/show the dragon's OWN flight FX (trail ribbons + wingtip/ember wisps) for the
// shop's static hero shot. Visual only — these belong to the dragon, not the run.
export function setDragonFxVisible(v) {
  for (const s of [...trailSprites, ...boostTrailSprites, ...emberMotes, ...wingMotes, ...bondBleedMotes]) s.visible = v;
}

// EMBERSIGHT H6 — the wingbeat clock (Law's garnish clause): the integrated flap
// phase (0..2π), exposed cheaply so idle HUD breathe/ghost fades can quantize to
// the dragon's heartbeat. Wiring it into the ghost-breath is intentionally deferred
// (that would mean editing the protected H1-H3 rest rules — the clause says skip
// rather than disturb them); the clock is now available for a future subtle pass.
export function wingbeatPhase() { return flapPhase; }

// Debug seam (exposed via window.__dd under ?debug): live count of visible FX
// sprites per emitter, so tests can prove a trail is actually emitting.
export function __trailDebug() {
  const vis = (arr) => arr.filter((s) => s.visible && s.material.opacity > 0.01).length;
  return {
    trail: vis(trailSprites), boost: vis(boostTrailSprites), ember: vis(emberMotes),
    wingtip: vis(wingtipTrailSprites), aero: vis(aeroShearSprites),
    tailSegs: tailSegs.length, dragon: activeDef && activeDef.name,
  };
}

// H7/H8 debug seam: bond-channel FX introspection for the roster-fallback proof
// (which fallback tier the surge nodes resolved to, and the live stud/node
// intensities). Read-only; flag-OFF reports the un-built state.
export function __bondDebug() {
  return {
    built: bondNubsBuilt,
    surgeMode: bondSurgeMode,
    surgeNodes: bondSurgeMats.length,
    surgeLevels: bondSurgeMats.map((m) => +m.emissiveIntensity.toFixed(3)),
    nubLevels: bondNubMats.map((m) => +m.emissiveIntensity.toFixed(3)),
    bodyMul: +bondBodyMul.toFixed(3),
    coreAdd: +(bondCoreAdd + bondSurgeAdd).toFixed(3),
    dragon: activeDef && activeDef.name,
  };
}

// Lethal crashes (wall/gate) explode hot coral-red; health deaths stay icy.
export function triggerDeathBurst(position, lethal = false) {
  burstActive = true;
  burstTimer = 1.0;
  const spread = lethal ? 30 : 22;
  for (const p of burstParticles) {
    p.visible = true;
    p.position.copy(position);
    if (lethal) {
      p.material.color.setHex(0xffb09a);
      p.material.emissive.setHex(0xff3322);
    } else {
      p.material.color.setHex(0xaaddff);
      p.material.emissive.setHex(0x44aaff);
    }
    p.userData.vel.set(
      (Math.random() - 0.5) * spread,
      (Math.random()) * 18 + 4,
      (Math.random() - 0.5) * 18
    );
    p.userData.spin = (Math.random() - 0.5) * 8;
    p.scale.setScalar(1);
    p.material.opacity = 1;
  }
}

// Downbeat SURGE envelope for the body/tail whip: a 2π-periodic wave SHARPENED toward a
// snap (so it reads as a thrust impulse, not a lazy sine), with the POWER (down) stroke
// dominant and a gentler recovery — replaces sin() in the spine/tail drive.
function flapSurge(x) {
  const s = Math.sin(x);
  return s >= 0 ? Math.pow(s, 0.5) : -0.55 * Math.pow(-s, 0.85);
}

// ── EMBERSIGHT H7 — DRAGON VITALS: lazy FX construction ─────────────────────
// Built on the FIRST enabled+active frame only, so a flag-OFF session never
// allocates a byte. Six small charge-stud octahedra (≈48 tris total) ride the
// wing joints — glow as discrete COMPONENTS igniting (DRAGON-DESIGN §6.3),
// never a strip or a bloom blob — plus a 12-sprite ember-bleed pool.
function bondEnsureFx() {
  if (bondNubsBuilt || !group) return;
  bondNubsBuilt = true;
  // 3 rank-shared materials: the SAME material serves the L and R stud of a
  // rank (DRAGON-DESIGN §5.5 mirror corollary — a per-side material is an
  // accidental asymmetry), and rank-sharing guarantees the two wings always
  // read the same charge. Dark stud + cyan core: rim/tip-over-dark-face law.
  bondNubMats = [0, 1, 2].map(() => new THREE.MeshStandardMaterial({
    color: 0x101820, emissive: BOND_NUB_EMISSIVE, emissiveIntensity: 0,
    roughness: 0.55, metalness: 0.15,
  }));
  const geo = new THREE.OctahedronGeometry(0.11, 0);
  for (const side of ['L', 'R']) {
    const pivot = side === 'L' ? wingPivotL : wingPivotR;
    const mid = side === 'L' ? wingMidL : wingMidR;
    const tip = side === 'L' ? wingTipL : wingTipR;
    const marker = side === 'L' ? tipMarkerL : tipMarkerR;
    // Shape-agnostic anchor ladder: shoulder joint → carpal joint → tip marker,
    // each falling back inboard (finally the dragon root) so EVERY roster rig —
    // yoke, wingParts, lobe fans, direct-pivot, even markerless serpents —
    // resolves three anchors without erroring.
    const anchors = [
      pivot || group,
      mid || tip || pivot || group,
      marker || tip || mid || pivot || group,
    ];
    for (let r = 0; r < 3; r++) {
      const m = new THREE.Mesh(geo, bondNubMats[r]);
      m.scale.set(1, 1.35, 1);
      // Shared-anchor fallback (a rig without mid/tip joints): step the studs
      // outboard along the wing's canonical +X so the rank still reads as a
      // root→tip ladder (the L wrapper's scale.x=−1 mirrors it for free). A
      // dragon with no wing joints at all gets a body-side ladder instead.
      const onBody = anchors[r] === group;
      const shared = !onBody && r > 0 && anchors[r] === anchors[r - 1];
      m.position.set(
        onBody ? (side === 'L' ? -1 : 1) * (0.6 + r * 0.55) : (shared ? r * 0.5 : 0),
        onBody ? 0.35 : 0.10, 0);
      m.visible = false;
      anchors[r].add(m);
      bondNubMeshes.push(m);
    }
  }
  // ── H8 SPINE-IGNITION nodes (§B.3) — the fallback contract in code. ──
  // Resolve anchors: authored dorsal markers → tail-chain segments → coreGlow
  // steps (bondSurgeMode 'core' skips geometry entirely; the stepped charge
  // rides bondSurgeAdd in the update pass).
  const markers = [];
  group.traverse((o) => { if (o.userData && o.userData.vitalsSurgeNode != null) markers.push(o); });
  markers.sort((a, b) => a.userData.vitalsSurgeNode - b.userData.vitalsSurgeNode);
  let nodeAnchors = null;
  if (markers.length >= 2) {
    bondSurgeMode = 'markers';
    nodeAnchors = markers.slice(0, 5).map((m) => ({ parent: m, off: 0 }));
  } else if (tailSegs.length >= 2) {
    bondSurgeMode = 'tail';
    nodeAnchors = [];
    const n = tailSegs.length;
    for (let j = 0; j < 5; j++) {
      const si = Math.round((j * (n - 1)) / 4);
      nodeAnchors.push({ parent: tailSegs[si], off: j * 0.001 });   // tiny z stagger de-dupes short chains
    }
  } else {
    bondSurgeMode = 'core';   // no geometry — stepped coreGlow charge
  }
  if (nodeAnchors) {
    const nodeGeo = new THREE.OctahedronGeometry(0.10, 0);
    for (let j = 0; j < nodeAnchors.length; j++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x181008, emissive: BOND_SURGE_GOLD, emissiveIntensity: 0,
        roughness: 0.5, metalness: 0.2,
      });
      bondSurgeMats.push(mat);
      const m = new THREE.Mesh(nodeGeo, mat);
      m.scale.set(0.9, 1.25, 0.9);
      // dorsal seat: a whisker above the anchor's spine line (markers sit exact)
      m.position.set(0, nodeAnchors[j].parent.userData.vitalsSurgeNode != null ? 0 : 0.22, nodeAnchors[j].off);
      m.visible = false;
      nodeAnchors[j].parent.add(m);
      bondNubMeshes.push(m);   // rides the same show/hide + teardown bookkeeping
    }
  }
  // Ember-bleed pool (§B.1): scene-level like the other FX pools; disposed
  // alongside them in disposeDragon.
  const bleedTex = makeGlowTexture('255,140,70', '255,220,180');
  for (let i = 0; i < 12; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: bleedTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    s.visible = false; s.userData.life = 0; s.userData.vy = 0;
    s.layers.set(1);
    sceneRef.add(s);
    bondBleedMotes.push(s);
  }
}

// The per-frame living-gauge pass — called from updateDragon INSIDE the
// existing material section (no second rAF). Sets bondBodyMul / bondCoreAdd
// (consumed by the shipped bodyMat / coreGlow writes below as ×mul / +add) and
// owns every other vitals write. THE CONTRACT: with the toggle OFF this
// function early-outs at ×1 / +0 having written nothing.
function updateBondVitals(dt, time) {
  const { enabled, vitals } = bondState();
  const live = enabled && vitals.active;
  if (!live) {
    // Neutralize (once) anything a previously-enabled frame wrote, then park.
    bondBodyMul = 1;
    bondCoreAdd = 0;
    bondDangerMix = 0;
    bondPrevHealth = null;
    if (bondBodyWriting && bodyMat && bondBodyBaseHex != null) {
      bodyMat.color.setHex(bondBodyBaseHex);
      bondBodyWriting = false;
    }
    if (bondCoreWriting && coreGlow && bondCoreBaseHex != null) {
      coreGlow.material.color.setHex(bondCoreBaseHex);
      bondCoreWriting = false;
    }
    bondSurgeAdd = 0;
    if (bondNubsBuilt) {
      for (const m of bondNubMats) m.emissiveIntensity = 0;
      for (const m of bondSurgeMats) m.emissiveIntensity = 0;
      for (const n of bondNubMeshes) n.visible = false;
      for (const s of bondBleedMotes) {
        if (s.visible) { s.visible = false; s.material.opacity = 0; s.userData.life = 0; }
      }
    }
    return;
  }

  bondEnsureFx();

  // WING-CHARGE stamina (§B.2): the 3 cells map to the stud ladder lighting
  // root→carpal→tip. Boost drains the TIP first, so the light visibly retreats
  // toward the shoulder (directional drain / trend encoding); regen crawls it
  // back out. The moving (fractional) stud breathes fast while boost is held —
  // the legible tell at chase distance. BOOST SEALED banks the ladder to dim
  // coals so the dragon and the chained chrome agree.
  const cellsF = Math.max(0, Math.min(1, vitals.stamina / Math.max(1e-6, vitals.staminaMax))) * 3;
  for (let r = 0; r < 3; r++) {
    const lit = Math.max(0, Math.min(1, cellsF - r));
    let target = Math.pow(lit, 1.5) * 2.2;
    if (vitals.boosting && lit > 0.02 && lit < 0.98) target *= 0.7 + 0.3 * Math.sin(time * 14);
    if (vitals.sealed) target = Math.min(target, 0.18);
    bondNubMats[r].emissiveIntensity = damp(bondNubMats[r].emissiveIntensity, target, 10, dt);
  }
  for (const n of bondNubMeshes) n.visible = true;

  // BODY-LIGHT health (§B.1): each heart lost steps the emissive floor down —
  // multiplier CLAMPED ≥0.75 (value tiers must survive dark biomes, risk #6) —
  // and lerps the body ~8%/heart toward cold ash (capped at 3 hearts' worth).
  const lostHearts = Math.max(0, (vitals.healthMax - vitals.health) / Math.max(1e-6, CONFIG.obstacleDamage));
  bondBodyMul = damp(bondBodyMul, Math.max(0.75, 1 - 0.08 * lostHearts), 4, dt);
  if (bodyMat) {
    if (bondBodyBaseHex == null) bondBodyBaseHex = bodyMat.color.getHex();
    const ashT = Math.min(0.24, 0.08 * lostHearts);
    if (ashT > 0.001) {
      _bondC1.setHex(bondBodyBaseHex);
      _bondC2.setHex(BOND_ASH);
      bodyMat.color.copy(_bondC1).lerp(_bondC2, ashT);
      bondBodyWriting = true;
    } else if (bondBodyWriting) {
      bodyMat.color.setHex(bondBodyBaseHex);
      bondBodyWriting = false;
    }
  }

  // EMBER-BLEED (§B.1): a wound sheds a one-shot burst of ember motes off the
  // flank — they gutter down and stream back past the chase camera.
  if (bondPrevHealth != null && vitals.health < bondPrevHealth - 0.01) {
    let bn = 0;
    for (const s of bondBleedMotes) {
      if (s.visible || bn >= 8) continue;
      const flank = Math.random() < 0.5 ? -1 : 1;
      s.visible = true;
      s.userData.life = 1;
      s.userData.vy = -(0.8 + Math.random() * 1.4);
      s.position.set(
        group.position.x + flank * (0.7 + Math.random() * 0.5),
        group.position.y - 0.1 + Math.random() * 0.4,
        group.position.z + (Math.random() - 0.5) * 1.2);
      bn++;
    }
  }
  bondPrevHealth = vitals.health;
  for (const s of bondBleedMotes) {
    if (!s.visible) continue;
    s.userData.life -= dt * 1.4;
    if (s.userData.life <= 0) { s.visible = false; s.material.opacity = 0; continue; }
    s.position.y += s.userData.vy * dt;
    s.position.z += dt * 2.2;
    s.material.opacity = s.userData.life * 0.7;
    const sz = 0.18 + (1 - s.userData.life) * 0.3;
    s.scale.set(sz, sz, 1);
  }

  // ── H8 SPINE-IGNITION (§B.3): nodes ignite nose→tail, one per chained ring,
  // frame 0 (the DOM gem echoes +120ms via CSS). All lit / fever = the
  // tail-tip node blazes gold with a slow pulse — the "crest gem" beat, played
  // shape-agnostically on whatever anchor the fallback contract resolved.
  const { surge } = bondState();
  const litNodes = surge.fever ? 5 : Math.floor((Math.min(surge.lit, surge.max) / surge.max) * 5 + 1e-6);
  if (bondSurgeMats.length) {
    const nN = bondSurgeMats.length;
    const allLit = litNodes >= 5 || surge.fever;
    for (let j = 0; j < nN; j++) {
      // compress the 5-slot ladder onto however many nodes this shape authored
      const slotLit = litNodes > Math.floor((j * 5) / nN);
      let target = slotLit ? 2.0 : 0;
      if (allLit && j === nN - 1) target = 3.0 + 0.6 * Math.sin(time * 3);   // the tip-gem blaze
      bondSurgeMats[j].emissiveIntensity = damp(bondSurgeMats[j].emissiveIntensity, target, 12, dt);
    }
    bondSurgeAdd = 0;
  } else {
    // core fallback: the chained charge rides coreGlow as stepped brightness
    bondSurgeAdd = 0.07 * litNodes + (litNodes >= 5 ? 0.12 + 0.1 * Math.sin(time * 3) : 0);
  }

  // 1-HEART HEARTBEAT (§B.1): at the last heart the coreGlow recolors
  // danger-magenta and beats ~1.1Hz (a lub-dub, not a sine) — a heartbeat in
  // the chest at chase distance. Colour restores exactly on exit.
  const danger = vitals.health > 0 && vitals.health <= CONFIG.obstacleDamage + 0.01;
  bondDangerMix = damp(bondDangerMix, danger ? 1 : 0, 6, dt);
  if (coreGlow) {
    if (bondDangerMix > 0.001) {
      if (bondCoreBaseHex == null) bondCoreBaseHex = coreGlow.material.color.getHex();
      _bondC1.setHex(bondCoreBaseHex);
      _bondC2.setHex(BOND_DANGER);
      coreGlow.material.color.copy(_bondC1).lerp(_bondC2, bondDangerMix);
      bondCoreWriting = true;
      const w = time * Math.PI * 2 * 1.1;
      const beat = Math.pow(Math.max(0, Math.sin(w)), 3) + 0.55 * Math.pow(Math.max(0, Math.sin(w - 2.4)), 3);
      bondCoreAdd = bondDangerMix * (0.12 + 0.34 * beat);
    } else {
      if (bondCoreWriting && bondCoreBaseHex != null) {
        coreGlow.material.color.setHex(bondCoreBaseHex);
        bondCoreWriting = false;
      }
      bondCoreAdd = 0;
    }
  } else {
    bondCoreAdd = 0;
  }
}

export function updateDragon(dt, player, time) {
  // Follow flight position with hover bob
  group.position.set(
    player.position.x,
    player.position.y + Math.sin(time * 2.1) * 0.16,
    player.position.z
  );

  // Solar CP3 — the ECLIPSE CRAWLS: the corona rose-window rotates slowly in its own plane (boost
  // quickens it, Surge flares it). In-plane local-Z spin, so the forward tilt is preserved. Cheap.
  if (coronaSpin) coronaSpin.rotateZ(dt * (player.feverActive ? 0.5 : player.boosting ? 0.28 : 0.15));

  // Asset-backed (GLB) baked-clip flap, if present. The reactive wing flap still
  // runs through the wingRig path below; this only ticks a skinned GLB's own clip.
  if (glbAnim && glbAnim.mixer) glbAnim.mixer.update(dt);
  // Asset-backed body SLITHER + fused-wing FLAP. CRITICAL: both ACCUMULATE phase
  // (phase += dt·rate) so a rate change (boost/Surge) can never jolt the phase. The
  // old slither did `phase = waveSpeed · uTime` with uTime growing unbounded, so a
  // boost-time change in waveSpeed lurched the phase by Δrate·uTime — a spasm that got
  // worse the longer the run. The speed factor is also DAMPED so the beat eases up to
  // boost speed instead of snapping. `player.speed` is high during both boost and Surge,
  // so this one speed-driven ramp covers both.
  if (glbAnim && (glbAnim.slither || glbAnim.wingFlap)) {
    const spTarget = Math.min(Math.max((player.speed - 35) / 45, 0), 1);
    glbAnim.sp = damp(glbAnim.sp ?? spTarget, spTarget, 3, dt);   // eased speed factor
    const sp = glbAnim.sp;
    if (glbAnim.slither) {
      const su = glbAnim.slither.uniforms;
      const ws = glbAnim.slither.baseSpeed * (0.5 + sp * 0.5);    // cruise→boost, gentle
      su.uTime.value += dt * ws;                                  // accumulate spine-wave phase
      su.uAmp.value = glbAnim.slither.baseAmp * (0.85 + sp * 0.3);
    }
    if (glbAnim.wingFlap) {
      const wu = glbAnim.wingFlap.uniforms;
      const rateTarget = 5.0 + sp * 3.5;                          // no hard boost jump
      glbAnim.flapRate = damp(glbAnim.flapRate ?? rateTarget, rateTarget, 4, dt);
      wu.uFlapPhase.value += dt * glbAnim.flapRate;               // accumulate wingbeat phase
      wu.uFlapAmp.value = glbAnim.wingFlap.baseAmp * (0.9 + sp * 0.2);
    }
  }

  // Banking and pitch — banking deepens with speed for drama.
  // Bank is tracked separately so the barrel-roll spin can stack on top
  // without fighting the damper.
  const speedNorm = Math.min(Math.max((player.speed - 35) / 45, 0), 1);

  // ── LAYERED FLIGHT BLEND STATE (overlapping, smoothed — no hard switches) ──
  //   surge01 fever · boost01 held boost · decel01 boost-release air-brake spike
  //   diveAmount/climbAmount from vertical velocity · aero01 tuck/sweep · spread01 open/brake
  const vy = player.velocity.y;
  // Dive/climb are CINEMATIC postures — only a RAPID sustained drop/rise should trigger them,
  // not the constant subtle up/down dodges of normal play (those were reading as a permanent
  // head-down dive). Deadzone + smoothstep on the descent/ascent speed (verticalSpeed≈18 m/s,
  // so a committed dive ≈ −18): ~0 below DIVE_ON, ramps to 1 by DIVE_FULL. The collision box
  // is a fixed point+radius — this only changes the VISUAL posture, never clearance.
  const ss = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
  const diveAmount = ss(9, 16, -vy);    // DIVE_ON 9 · DIVE_FULL 16 (raise DIVE_ON for a bigger deadzone)
  const climbAmount = ss(8, 16, vy);    // CLIMB_ON 8 · CLIMB_FULL 16
  // Banking DEADZONE: gentle steering = a subtle lean only; the dramatic wing-tuck / tail
  // counter-sweep / head-lead engage only on a HARD bank. (turnBias saturates at 0.28.)
  const bankHard = ss(0.12, 0.26, Math.min(Math.abs(player.velocity.x * 0.018), 0.28));
  // Vertical spine pitch-WHIP: vertJerk spikes when the dragon CHANGES vertical direction
  // (up→down / down→up) and decays when steady — drives a subtle chest-leads / tail-follows
  // ripple so the body flexes through the turn instead of feeling stiff.
  vySmooth = damp(vySmooth, vy, 5, dt);
  const vertJerk = Math.max(-16, Math.min(16, vy - vySmooth));
  surge01 = damp(surge01, player.feverActive ? 1 : 0, 3.5, dt);
  boost01 = damp(boost01, player.speedActive ? 1 : 0, 5, dt);
  // PR-C: the inhale eases in with the fuse and SNAPS down at release (damp 8 ≈
  // 0.12s) — the wings drop out of the mantle into the launch frame.
  inhale01 = damp(inhale01, inhaleTarget, 8, dt);
  if (inhaleTarget <= 0 && inhale01 < 0.001) inhale01 = 0;
  if (prevSpeedActive && !player.speedActive) decel01 = 1;      // RELEASE → air-brake spike
  prevSpeedActive = !!player.speedActive;
  decel01 = damp(decel01, 0, 2.2, dt);                          // …eased out smoothly
  const aero01 = Math.min(1, Math.max(boost01 * 0.7, surge01, diveAmount * 0.85));   // tuck/sweep
  const spread01 = Math.min(1, climbAmount * 0.9 + decel01);                          // open/brake
  // POSTURE pitch: nose-DOWN in dive, nose-UP in climb, relax on decel. Surge no longer
  // pitches the nose down — it was flashing the ventral (belly) of the body+wings from the
  // chase cam during Dragon Surge (user note). The big deliberate poses stay on DIVE/CLIMB.
  const posturePitch = climbAmount * 0.42 - diveAmount * 0.5 - boost01 * 0.02 + decel01 * 0.05
    // PR-C INHALE ARCH: the torso visibly rears up as the breath draws (the
    // owner's rear-cam telegraph — nose-up reads down the dragon's back).
    + inhale01 * (CONFIG.LOCK.inhaleArch ?? 0.38);

  // Surge/boost bank DEEPER + SNAPPIER (carves like a fighter jet).
  const bankFactor = 0.035 + speedNorm * 0.015;   // RESET to the original body-roll (was over-banking)
  bankZ = damp(bankZ, -player.velocity.x * bankFactor, 9, dt);
  let rollSpin = 0;
  let rollFold = 0;
  if (player.roll) {
    const k = Math.min(player.roll.t / player.roll.dur, 1);
    const ease = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    rollSpin = -player.roll.dir * Math.PI * 2 * ease; // matches bank direction
    rollFold = Math.sin(Math.PI * k) * 0.55;
  }
  // A segmented serpent BENDS its spine to turn (handled per-plate below) rather
  // than banking like a plane — so soften the whole-body roll for the wyrm, or the
  // barrel-bank would hide the snake-bend.
  group.rotation.z = bankZ * (bodySegs ? 0.4 : 1) + rollSpin;
  // Body coupling: the flap lifts the chest at apex / compresses (nose-down) on the downstroke.
  // bodyFlapLift is set by the yoke solver below (1-frame lag = natural inertia, "suspended under
  // the wings"); only applies to yoke dragons (else 0). The damp(…,9) adds the trailing response.
  group.rotation.x = damp(group.rotation.x, player.velocity.y * 0.022 + posturePitch + (activeDef.model.flap ? bodyFlapLift : 0), 9, dt);
  // Slight yaw toward lateral movement — unless a cinematic is turning the dragon
  // to face something (ASHTALON's overtake): then blend toward that look yaw.
  const yawTarget = lookYaw != null ? lookYaw : player.velocity.x * 0.008;
  group.rotation.y = damp(group.rotation.y, yawTarget, lookYaw != null ? 7 : 6, dt);
  head.rotation.y = damp(head.rotation.y, -player.velocity.x * 0.014, 8, dt);
  head.rotation.x = damp(head.rotation.x, -player.velocity.y * 0.008, 8, dt);
  riderGroup.rotation.z = damp(riderGroup.rotation.z, -player.velocity.x * 0.035, 8, dt);
  riderGroup.rotation.x = damp(riderGroup.rotation.x, -0.08 - speedNorm * 0.16 + player.velocity.y * 0.008, 8, dt);
  // Trail group rests pre-oriented; speed sweeps it back and a gentle waggle
  // keeps it alive. Works for every trail style (tatters/cape/ribbon/robe).
  // The sway is SLOW + damped (was a raw ~1.9 Hz sine that whipped the Void
  // Oracle's big robe into a glitchy oscillation) so it reads as a flowing drift.
  scarfMesh.rotation.x = damp(scarfMesh.rotation.x, -0.08 - speedNorm * 0.5, 10, dt);
  scarfPhase = (scarfPhase + dt * (1.6 + speedNorm * 1.9)) % (Math.PI * 2);   // integrated (varying freq)
  const swayTarget = Math.sin(scarfPhase) * (0.08 + speedNorm * 0.12);
  scarfMesh.rotation.z = damp(scarfMesh.rotation.z, swayTarget, 6, dt);

  // Rider effects: glow breathes with speed; oracle's shards orbit the head.
  // def.hideRiderGlow suppresses the round bloom sprite behind the rider (a night drake reads by its
  // OWN cold accents on Surge, not a warm rider halo) — the rider figure itself still rides.
  if (riderGlow) {
    riderGlow.visible = !activeDef.hideRiderGlow;
    riderGlow.material.opacity = 0.2 + speedNorm * 0.22 + Math.sin(time * 4) * 0.05;
  }
  for (const o of riderOrbiters) {
    o.ang += dt * o.speed;
    o.mesh.position.x = Math.cos(o.ang) * o.radius;
    o.mesh.position.z = Math.sin(o.ang) * o.radius * o.flat;
    o.mesh.position.y = o.baseY + Math.sin(time * 1.6 + o.ang) * 0.04;
    o.mesh.rotation.y = time * 1.5;
  }

  // Wing flap: articulated cascade with speed/turn asymmetry + the blend layers (above).
  const feverBoost = player.feverActive ? 1.3 : 1;
  // FREQUENCY: boost/surge faster, a DIVE glides (slower/paused), decel eases back to normal.
  // PR-C WING MANTLE: as the inhale draws, the beat slows and the stroke
  // shrinks while the baseline rides HIGH (rootFlap below) — the wings sweep up,
  // hold open, and near-freeze: "drawing breath," the strongest rear silhouette.
  // inhale01=0 → all identity (byte-identical, the coexist endpoint).
  const inhaleCalm = 1 - (CONFIG.LOCK.inhaleFlapCalm ?? 0.6) * inhale01;
  const flapSpeed = (player.speedActive ? 11 : 6) * feverBoost * activeDef.model.flapBias
    * formSpeed(activeDef.model) * (activeDef.model.flapFreqScale ?? 1)
    * (1 - 0.55 * diveAmount) * (1 - 0.18 * decel01) * inhaleCalm;
  // AMPLITUDE: dive tucks to a glide (small), climb + decel open broad to catch air.
  const flapAmp = (player.speedActive ? 0.7 : 0.52) * (activeDef.model.flapAmp ?? 1)
    * (1 - 0.7 * diveAmount) * (1 + 0.3 * climbAmount) * (1 + 0.25 * decel01)
    * (1 - 0.45 * inhale01);
  const turnBias = Math.max(-0.28, Math.min(0.28, player.velocity.x * 0.018));
  const climbBias = Math.max(-0.18, Math.min(0.18, player.velocity.y * 0.015));
  // INTEGRATE the beat clock — `flapSpeed` varies every frame (dive/decel/boost blends), so
  // `time * flapSpeed` would jump the phase by `time·Δfreq` (tens of radians) and the wings
  // would spasm. Accumulating dt·flapSpeed keeps the phase continuous: changing the frequency
  // only changes the RATE. Wrapped mod 2π for float precision over long sessions.
  flapPhase = (flapPhase + dt * flapSpeed) % (Math.PI * 2);
  // `?wingDebug`: freeze the whole beat clock at the named cycle point so the wings — AND the
  // phase-coupled head wobble / secondary wings below — hold ONE reproducible pose.
  if (WING_DEBUG) flapPhase = resolveWingDebug(WING_DEBUG, activeDef.model.flap).phase;
  const phase = flapPhase;
  // Mantle bias: NEGATIVE rootFlap = wings up (the apex convention), so the
  // inhale rides the whole stroke high — a held high-V.
  const rootFlap = Math.sin(phase) * flapAmp + 0.1 - inhale01 * 0.55;
  const feather = Math.sin(phase + Math.PI * 0.55);
  const tipLag = Math.sin(phase + 0.95);
  if (WING_DEBUG) {
    // FREEZE for `?wingDebug`: the SHARED poser holds this dragon's wings at the named pose,
    // whichever motion path it rides — so the starters (basic direct-pivot) freeze exactly
    // like the yoke dragons always could, and the studio captures the identical pose.
    setFlapDebugPose({ wingRigL, wingRigR, wingYokeL, wingYokeR, wingPivotL, wingPivotR,
      wingMidL, wingMidR, wingTipL, wingTipR, wingBladePivotsL, wingBladePivotsR,
      carpalSpireL, carpalSpireR }, activeDef.model, WING_DEBUG);
    if (!wingDebugLogged) {
      // Prove gameplay reaches the harness pose: log the resolved state + (for yoke rigs) the
      // wing chain's elevation in the DRAGON'S OWN frame (independent of body bank/pitch).
      try {
        wingDebugLogged = true;
        let tipElevDeg = null;
        if (wingYokeR && wingTipR) {
          group.updateWorldMatrix(true, true);
          const inv = group.matrixWorld.clone().invert();
          const yL = wingYokeR.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
          const tL = wingTipR.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
          tipElevDeg = +(Math.atan2(tL.y - yL.y, Math.hypot(tL.x - yL.x, tL.z - yL.z)) * 180 / Math.PI).toFixed(1);
        }
        const path = wingRigL ? 'skinned' : (activeDef.model.flap && wingYokeL) ? 'yoke'
          : activeDef.model.wingParts ? 'wingParts' : 'direct-pivot';
        console.log('[wingDebug] ' + JSON.stringify({
          dragon: activeDef.name, form: activeDef.model.formLevel, phaseName: WING_DEBUG,
          path, phase: +phase.toFixed(3), tipElevDeg,
        }));
      } catch (e) { console.log('[wingDebug] log failed', String(e)); }
    }
  } else if (wingRigL) {
    // Skinned wings: the shared animator drives the shoulder→elbow→wrist cascade
    // (lagged whip + anatomical limits). Same flight state, organic motion.
    const flapState = { phase, flapAmp, turnBias, climbBias, rollFold, feather, aero01, spread01, surge01, bankHard, strength: formStrength(activeDef.model) };
    flapWing(wingRigL, flapState, dt);
    flapWing(wingRigR, flapState, dt);
  } else if (activeDef.model.flap && wingYokeL) {
    // ── Mk II YOKE wing: the shared 5-PHASE solver (wingFlapSolver.js). Chain
    // yoke→inner(pivot)→mid→tip lifts into a HELD high-V apex; the YOKE (shoulder carrier)
    // LEADS and creates the base of the V — the root visibly drives, not just the tip. ONE
    // shared L/R phase (sign-mirror, never a whole-wing L/R lag); banking = pose bias only.
    const m = activeDef.model;
    // (The `?wingDebug` freeze for this path now runs through the shared poser in the
    // WING_DEBUG branch above — this branch is live-flight only.)
    const usePhase = phase;
    const tB = turnBias, rF = rollFold, cB = climbBias;
    const s = solveWing(usePhase, m.flap);
    bodyFlapLift = (m.flap.body && m.flap.body.liftAmt) ? m.flap.body.liftAmt * s.yoke.env : 0;
    const featR = Math.sin(usePhase + Math.PI * 0.55);
    const bank = Math.max(-1, Math.min(1, turnBias / 0.28));
    const poseY = (yk, pv, md, tp, ins) => {
      const inside = Math.max(0, ins), outside = Math.max(0, -ins);
      const ampE = 1 - 0.30 * ins;                 // INSIDE brakes the arc, OUTSIDE powers it
      // YOKE (shoulder carrier): whole-wing ELEVATION (+rz=up, −rz=press down) + fore-aft ROWING
      // sweep (.y) + twist + bank baseline
      yk.rotation.set(s.yoke.twist, -0.12 - s.yoke.sweep - 0.10 * inside + tB * 0.5, s.yoke.elev * ampE + rF + 0.05 * outside);
      // INNER (pivot): CURL (bend up at apex, straight on downstroke) + feather pitch + inside fold
      pv.rotation.set(0.10 + featR * 0.12 + cB, -0.12, s.inner.curl * ampE + 0.06 * inside);
      // MID: lagged curl + aft trail + inside fold / outside spread
      if (md) md.rotation.set(0.02, 0.05 * outside - s.mid.sweep, s.mid.curl * ampE + 0.10 * inside);
      // TIP: trailing curl (finishes the rounded V) + aft trail + inside fold
      if (tp) tp.rotation.set(-0.04, 0.07 + 0.18 * inside - s.tip.sweep, s.tip.curl * ampE + 0.14 * inside);
    };
    poseY(wingYokeR, wingPivotR, wingMidR, wingTipR, bank);
    poseY(wingYokeL, wingPivotL, wingMidL, wingTipL, -bank);
  } else if (activeDef.model.wingParts) {
    // ── Mk II per-FORM articulated wing (1 / 2 / 3 segments) ─────────────────────────
    // ONE shared flap phase; L/R a pure sign-mirror (identical timing, never offset);
    // the only delay is WITHIN each wing root→mid→tip. A GLIDE-HOLD waveform
    // (|sin|^glidePow) holds the broad glide pose and pulses through — high glidePow =
    // rare heavy pulses (Eternal "commands the air"); low = frantic flapping (baby).
    // Banking = amplitude + static bias only (no phase offset). Direct-set (no per-wing
    // easing). Handles missing mid/tip segments (Hatchling=1, Kindled=2).
    const m = activeDef.model;
    const glidePow = m.glidePow ?? 1;
    const aoStiff = 1 - 0.25 * aero01;               // tighten follow-through on boost
    const rootA = (m.rootAmp ?? flapAmp), midA = (m.midAmp ?? 0) * aoStiff, tipA = (m.tipAmp ?? 0) * aoStiff;
    const midLag = m.midLag ?? 0, tipLag = m.tipLag ?? 0;
    const shape = (ph) => { const s = Math.sin(ph); return Math.sign(s) * Math.pow(Math.abs(s), glidePow); };
    const rootF = shape(phase) * rootA;
    const midF  = shape(phase - midLag) * midA;
    const tipF  = shape(phase - tipLag) * tipA;
    const featR = Math.sin(phase + Math.PI * 0.55);
    const twMid = Math.cos(phase - midLag) * 0.10;
    const twTip = Math.cos(phase - tipLag) * 0.18;
    const upMid = Math.max(0, Math.sin(phase - midLag));
    const upTip = Math.max(0, Math.sin(phase - tipLag));
    // APEX HIGH-V LIFT (opt-in via model.apex*): raise each segment into a strong V at the TOP
    // of the stroke. The wing's UP extreme is where sin(phase)<0, so `apexUp` peaks at −sin (the
    // apex) and the lift is ADDED to the flap (+rz = up); tips highest, lagged root→mid→tip, with
    // ^0.7 widening the dwell for a brief held apex. `restLift` raises the glide pose off flat so
    // it reads as a gentle V. Zero for any dragon without apex config (roster unchanged).
    const apexUp = (ph) => Math.pow(Math.max(0, -Math.sin(ph)), 0.7);
    const apexRootF = (m.apexRoot ?? 0) * apexUp(phase);
    const apexMidF  = (m.apexMid  ?? 0) * apexUp(phase - midLag);
    const apexTipF  = (m.apexTip  ?? 0) * apexUp(phase - tipLag);
    // APEX WRIST-SWEEP (opt-in via model.tipApexSweep): at the TOP of the upstroke the wing is near
    // vertical, so the flap-axis (z) wrist fold points almost AT the chase camera and projects into
    // DEPTH — invisible in silhouette. This sweeps the hand AFT in the wing's PLANE (+.y), driven by
    // the ROOT's apex (unlagged) so it concentrates at recovery, turning the fold into a wrist DOGLEG
    // the rear camera can actually see. Zero for any dragon without the dial (roster unchanged).
    const apexTipSweepF = (m.tipApexSweep ?? 0) * apexUp(phase);
    const apexPitch = m.apexPitch ?? 0;
    const restLift  = m.restLift ?? 0;
    // ── BANKING via POSE BIAS ONLY — never a L/R phase delay. Both wings share the ONE
    // flap phase + identical internal root→mid→tip lag; the asymmetry is pose only, and
    // |bank| drives the SOFT→HARD continuum. `ins` = a wing's inside-ness (+1 fully inside
    // the turn → brake/tuck, −1 fully outside → power/open). Right wing is inside on a right
    // turn (bank>0); the left is its scale.x=-1 mirror, so the SAME logical pose flips correctly.
    const bank = Math.max(-1, Math.min(1, turnBias / 0.28));
    const tipSweepBase = 0.07 + 0.16 * upTip;        // stroke-driven tip trail (both wings)
    const poseWing = (pv, md, tp, ins) => {
      const inside = Math.max(0, ins), outside = Math.max(0, -ins);
      const amp = 1 - 0.34 * ins;                    // INSIDE brakes (↓ arc), OUTSIDE powers (↑ arc)
      const baseZ = -0.10 - 0.20 * inside + 0.12 * outside;   // inside drops LOWER, outside opens HIGHER
      // shoulder/root: main flap (×amp) + APEX V-LIFT (+rz = up) + rest dihedral lift + bank baseline + climb pitch
      pv.rotation.set(0.14 + featR * 0.16 + climbBias - apexPitch * apexRootF, -0.18, -(rootF * amp) + apexRootF * amp + restLift + baseZ + rollFold);
      // forearm/mid: lagged flap + apex lift (more) + folds INWARD on the inside wing, SPREADS on the outside
      if (md) md.rotation.set(twMid + 0.05 * inside - apexPitch * apexMidF, upMid * 0.08 + 0.05 * outside, -(midF * amp) + apexMidF * amp + 0.10 * inside);
      // tip: smaller arc + apex lift (highest → forms the V) + feathers BACK (.y) + UP (.x) + folds up inside
      if (tp) { const tF = md ? tipF : (midF + tipF), aT = md ? apexTipF : (apexMidF + apexTipF);
        tp.rotation.set(-0.05 + twTip + 0.12 * inside - apexPitch * aT, tipSweepBase + 0.22 * inside + apexTipSweepF, -(tF * amp) + aT * amp + 0.16 * inside); }
    };
    poseWing(wingPivotR, wingMidR, wingTipR, bank);
    poseWing(wingPivotL, wingMidL, wingTipL, -bank);
  } else if (wingLobePivotsL || wingLobePivotsR) {
    // ── JADE silk-fin fans — a fully SYMMETRIC koi beat ──────────────────────────────
    // The user's ask: the N lobes per side beat so L1↔R1, L2↔R2, L3↔R3 fire TOGETHER.
    // The whole fan tilts with the wingbeat as a clean MIRROR (both fans up/down together),
    // and each lobe beats on the SAME phase for its L and R twin (side only flips the spread
    // direction so both fans open outward together), with a small inboard→outboard lag for a
    // living fin. NO asymmetric wingTip phase (that was the "beating asymmetrical" read).
    wingPivotR.rotation.set(0.12 + climbBias, -0.12 + turnBias * 0.8, -rootFlap + turnBias + rollFold);
    wingPivotL.rotation.set(0.12 + climbBias,  0.12 + turnBias * 0.8,  rootFlap + turnBias - rollFold);
    if (wingTipR) wingTipR.rotation.set(0, 0, 0);   // rear-lobe carrier rides the fan (no independent asymmetric wobble)
    if (wingTipL) wingTipL.rotation.set(0, 0, 0);
    const lAmp = activeDef.model.lobeBeatAmp ?? 0.26;
    const lLag = activeDef.model.lobeBeatLag ?? 0.85;      // BIG inboard→outboard lag so each lobe sits at its OWN angle → the 3 read as SEPARATE parts (not a merged 2)
    const lSpread = activeDef.model.lobeBeatSpread ?? 0.22; // static extra fan so the lobes never close INTO each other
    const lFlow = activeDef.model.lobeBeatFlow ?? 0.2;    // slow trailing sway, strongest on the REAR lobe → the back of the fan FLOWS (less stiff)
    // CP3 motion: the silk fan BLOOMS OPEN under power (boost/surge) — the outer lobes fan
    // wider + lift, so a boost reads as the koi flaring its fins. Cheap, high-visibility
    // motion off the EXISTING poser; jade-only (this whole block is gated on the lobe pivots).
    const flareOpen = (boost01 * 0.55 + surge01 * 0.85) * (activeDef.model.lobeFlareBoost ?? 1)
      + (activeDef.model.lobeBreath ?? 0) * (0.5 + 0.5 * Math.sin((bodyWave ? bodyWave.phase : time * 2) * 0.5));   // §4.6: the fan blooms OPEN on the swim crest in cruise (wave-locked to the pearl-chain), default 0 → every non-jade dragon byte-identical
    for (const arr of [wingLobePivotsR, wingLobePivotsL]) {
      if (!arr) continue;
      const n = Math.max(1, arr.length - 1);
      for (const b of arr) {
        const t = b.pivot; if (!t) continue;
        const fr = b.idx / n;                                   // 0 inner → 1 outer/rear
        const lp = phase - fr * lLag;                           // SAME lp for L_i and R_i → they beat together
        // OPEN direction = -side (matches the rest rake); bias the fan OPEN (static spread) so
        // the lobes stay separated, then the beat + a slow rear-weighted flow ride on top.
        const beat = Math.sin(lp) * lAmp * (0.5 + 0.7 * fr);    // outer lobes swing widest
        const flow = Math.sin(lp * 0.5 + 1.2) * lFlow * fr;     // lazy trailing sway → flowy rear
        t.rotation.y = damp(t.rotation.y, -b.side * (lSpread * fr * (1 + flareOpen) + beat + flow), 9, dt);
        t.rotation.z = damp(t.rotation.z, Math.cos(lp) * lAmp * 0.3 + Math.sin(lp * 0.5) * lFlow * fr + flareOpen * 0.16 * fr, 9, dt);
      }
    }
  } else {
    wingPivotR.rotation.z = damp(wingPivotR.rotation.z, -rootFlap + turnBias + rollFold, 14, dt);
    wingPivotL.rotation.z = damp(wingPivotL.rotation.z,  rootFlap + turnBias - rollFold, 14, dt);
    // CP3.3 — counter-rotate the decoupled carpal spires against the flap beat (Solar) so their bright
    // tips don't scissor across the forward view each upstroke. Cancel ONLY the sinusoid (sin·flapAmp),
    // not the mantle bias / turnBias / rollFold — the spires still lean into turns and ride the inhale
    // raise. Opposite L/R signs mirror the pivots' −rootFlap/+rootFlap, so the pair stays symmetric.
    const spireStab = activeDef.model.spireStabilize ?? 0;
    if (carpalSpireR) carpalSpireR.rotation.z = damp(carpalSpireR.rotation.z,  spireStab * Math.sin(phase) * flapAmp, 14, dt);
    if (carpalSpireL) carpalSpireL.rotation.z = damp(carpalSpireL.rotation.z, -spireStab * Math.sin(phase) * flapAmp, 14, dt);
    // FEATHER = a fore-aft PITCH (rotation.x). Under the L wing's scale.x=-1 mirror, rotation.x
    // does NOT flip sense (it moves the chord in Y identically on both wings), so a SYMMETRIC
    // feather needs the SAME sign L/R — the old ±feather was an antisymmetric roll-twist that made
    // the pair beat off-square every stroke (the "wings aren't symmetric" bug). climb bias stays
    // shared (a pitch input, symmetric).
    wingPivotR.rotation.x = damp(wingPivotR.rotation.x, 0.14 + feather * 0.18 + climbBias, 10, dt);
    wingPivotL.rotation.x = damp(wingPivotL.rotation.x, 0.14 + feather * 0.18 + climbBias, 10, dt);
    wingPivotR.rotation.y = damp(wingPivotR.rotation.y, -0.18 + turnBias * 0.8, 9, dt);
    wingPivotL.rotation.y = damp(wingPivotL.rotation.y,  0.18 + turnBias * 0.8, 9, dt);
    // Tip fold (2-bone wings): folds on up-stroke, extends on down-stroke. BOTH tips ride the ONE
    // tipLag clock (mirror sign) — the old L branch ran a DIFFERENT phase (sin(phase+1.18) vs the
    // R tipLag sin(phase+0.95)), so the tips folded a beat apart: the visible off-beat asymmetry.
    wingTipR.rotation.z = damp(wingTipR.rotation.z,  tipLag * 0.28 + turnBias * 0.45, 12, dt);
    wingTipL.rotation.z = damp(wingTipL.rotation.z, -tipLag * 0.28 + turnBias * 0.45, 12, dt);
    wingTipR.rotation.x = damp(wingTipR.rotation.x, -0.12 + feather * 0.16, 10, dt);
    wingTipL.rotation.x = damp(wingTipL.rotation.x, -0.12 + feather * 0.16, 10, dt);
  }
  // Per-blade LAG (blade-feather comb): each feather trails the beat a beat behind
  // (ASHTALON covert pattern), the lag deepening outward. Additive + nullable.
  for (const arr of [wingBladePivotsR, wingBladePivotsL]) {
    if (!arr) continue;
    for (const b of arr) {
      const fr = arr.length > 1 ? b.idx / (arr.length - 1) : 0;
      const sw = Math.sin(phase - 0.5 - fr * 0.9) * (0.05 + 0.09 * fr);
      b.pivot.rotation.z = damp(b.pivot.rotation.z, b.side * (0.02 + 0.10 * fr) + sw, 12, dt);
    }
  }
  // Per-form head wobble (Mk II): the baby's head bobbles with the frantic flap; the
  // Eternal's is dead-still (headWobbleScale 0). Mk II-only (undefined elsewhere).
  if (activeDef.model.headWobbleScale != null) {
    head.rotation.z = activeDef.model.headWobbleScale * Math.sin(phase * 0.6 + 0.8);
  }
  // Secondary wing pair. Obsidian T4 = a shadow flap at reduced amplitude. The
  // Night-Fury mini-wings are STABILIZERS (model.miniWingStabilizer): they DON'T
  // flap — they hold their swept-back splay (userData.rz) and only lean with the turn
  // + a gentle sail luff/billow, so they widen the body and steady the glide.
  if (wingPivot2L) {
    if (activeDef.model.miniWingStabilizer) {
      const luff = Math.sin(time * 2.0) * 0.05;
      wingPivot2L.rotation.z = damp(wingPivot2L.rotation.z, (wingPivot2L.userData.rz ?? 0) + turnBias * 0.5 + luff, 6, dt);
      wingPivot2R.rotation.z = damp(wingPivot2R.rotation.z, (wingPivot2R.userData.rz ?? 0) + turnBias * 0.5 - luff, 6, dt);
    } else {
      wingPivot2L.rotation.z = damp(wingPivot2L.rotation.z,  rootFlap * 0.6 + turnBias, 14, dt);
      wingPivot2R.rotation.z = damp(wingPivot2R.rotation.z, -rootFlap * 0.6 + turnBias, 14, dt);
    }
  }

  // Snake-like tail coil: the ROOT segment is locked to the body (lock=0) and
  // the sway ramps toward the tip (lock→1), so the whole tail coils with a
  // travelling wave while staying anchored — it never detaches into a spear.
  // Heavy segment overlap (built in dragonParts) hides the joints as it bends.
  // Body-spine whip (model.bodyWhip): the WHOLE body undulates VERTICALLY with the
  // wingbeat — a travelling pitch wave (rotation.x) locked to the flap `phase`, the chest
  // anchored, the head bobbing and the rear heaving. Each bone carries its own gain+phase.
  // ── LAYERED SPINE: hip lifts (after the downstroke), neck absorbs the bob, head stays
  // composed (counters the neck) — with timing offsets so the body never moves as one stiff
  // object. SURGE streamlines it: less bob, straighter spine, head lowers into a spear.
  if (spineSegs.length) {
    const sp = 0.7 + 0.3 * speedNorm;
    const calm = 1 - 0.5 * aero01;                       // streamline (boost/surge/dive) damps the bob
    // head/neck are FIRMER under streamline too — fever was re-introducing the floppy bob.
    const calmHN = 1 - 0.85 * aero01;                    // near-still head/neck in surge/boost/dive
    const noseDown = diveAmount * 0.5 + boost01 * 0.03 + surge01 * 0.04;   // DIVE spear; boost/fever subtle
    const noseUp = climbAmount * 0.34;                                     // soar pitch
    const vWhip = -vertJerk * 0.026;          // vertical pitch-whip (chest leads → rear trails) — bolder
    for (const b of spineSegs) {
      const role = b.userData.role;
      if (role === 'hip') {
        // body LIFT wave (a beat AFTER the downstroke) + the vertical WHIP (the rear trails the
        // chest when the body changes vertical direction). CLIMB drops the hips (counterweight).
        const wave = 0.15 * sp * calm * flapSurge(phase - 0.6);
        // PR-C: hips drop slightly under the inhale — the counterweight that makes the chest RISE.
        b.rotation.x = damp(b.rotation.x, wave + climbAmount * 0.16 + vWhip - inhale01 * 0.1, 9 + 4 * aero01, dt);
        b.rotation.y = damp(b.rotation.y, turnBias * 0.35 * bankHard, 6, dt);   // hips drift into a HARD turn (eased)
      } else if (role === 'neck') {
        // FIRM neck: faint bob/breathe, near-STILL under streamline/fever (calmHN). Leads the
        // turn only on a hard bank (eased); shares a little of the vertical body-whip.
        // PR-C: the inhale CRANES the neck back (chest rises) — the spine-rig arch.
        const bob = 0.022 * sp * calmHN * flapSurge(phase - 0.3) * (activeDef.model.bodyBobScale ?? 1);
        const breathe = Math.sin(time * 1.1) * 0.006 * calmHN;
        b.rotation.x = damp(b.rotation.x, bob + breathe - noseDown * 0.48 + noseUp * 0.42 + vWhip * 0.45 + inhale01 * 0.22, 9, dt);
        b.rotation.y = damp(b.rotation.y, -turnBias * 0.18 * bankHard * (1 + 0.4 * aero01), 7, dt);
      } else if (role === 'head') {
        // FIRM, composed gaze: a tiny counter to the neck, near-STILL under fever (calmHN).
        // Leads a hard turn (eased); dives/soars (deliberate poses). Stays OUT of the whip.
        const counter = -0.018 * sp * calmHN * flapSurge(phase - 0.3) * (activeDef.model.bodyBobScale ?? 1);
        b.rotation.x = damp(b.rotation.x, counter - noseDown * 0.85 + noseUp, 9, dt);
        b.rotation.y = damp(b.rotation.y, -turnBias * 0.28 * bankHard * (1 + 0.5 * aero01), 9, dt);
      } else {
        const w = b.userData.whip || { gain: 0, phase: 0 };
        b.rotation.x = damp(b.rotation.x, w.gain * sp * flapSurge(phase + w.phase), 9, dt);
      }
    }
  }

  const nTail = tailSegs.length;
  if (nTail && (activeDef.model.tailWhip || tailSegs[0].isBone)) {
    // isBone: a skinned tail chain (night-fury / GLB auto-rig) must be driven by
    // ROTATION even when the def forgot tailWhip — position writes tear a chain
    // (the same detection the shop preview tick uses, L36).
    // Night-Fury tail = a SKINNED bone chain (driven by ROTATION only — position tears it). It
    // moves like the ORIGINAL dragons (azure): a LATERAL travelling COIL — a side-to-side wave
    // running aft down the tail (azure's non-skinned tail is `sin(time*4.0 − i*0.6)·0.3·lock²`
    // on position; reproduced here on rotation.y), with only a SUBTLE vertical follow-through.
    // BANKING adds the horizontal rudder curving the tail INTO the turn.
    const cruise = 1 - bankHard * 0.7;
    const tWhip = -vertJerk * 0.014;          // subtle vertical follow-through (not a pump)
    const lam = Math.max(4, 8 + 5 * aero01 - 3 * decel01);
    const coilRate = 4.0;                                  // azure's tail rate
    // Per-form tail looseness (Mk II): Hatchling coils loosely/uncontrolled, Eternal is
    // tight/authoritative. tailLagScale 0.12 ≈ current → multiplier; undefined ⇒ ×1.
    const tailLag = activeDef.model.tailLagScale != null ? activeDef.model.tailLagScale / 0.12 : 1;
    const coilAmp = (0.17 + 0.06 * speedNorm) * cruise * tailLag;   // grows with speed; faded out on a hard bank
    const undA = activeDef.model.tailUndulateX ?? 0;   // per-joint VERTICAL undulation amplitude (undefined ⇒ 0 ⇒ every other dragon identical)
    // On a NESTED tail chain the per-joint rudder COMPOUNDS (world tip ≈ Σ locals ≈ 2.5× the base on a
    // 4-joint tail), which over-curls into a J-hook. tailRudderScale trims it back to a graceful arc
    // (undefined ⇒ ×1 ⇒ single-joint dragons unchanged).
    const rudderScale = activeDef.model.tailRudderScale ?? 1;
    for (let i = 0; i < nTail; i++) {
      const lock = (i + 1) / nTail;                        // root subtle → tip full (per-segment)
      const coil = Math.sin(time * coilRate - i * 0.6) * coilAmp * lock;  // azure-style lateral coil
      const rudder = turnBias * (1.4 + 0.9 * aero01) * lock * bankHard * rudderScale;    // hard-bank rudder (trimmed for compounding chains)
      // A genuine phase-lagged VERTICAL travelling wave (the axis the rear-chase camera actually reads),
      // slower than the lateral coil so they beat organically; faded by `cruise` so a hard-bank tail that
      // is yaw-swung into |x| can't simultaneously dip DOWN into the low-aft corridor.
      const undX = undA * lock * cruise * (Math.sin(time * 2.4 - i * 0.7 + 0.5) - 0.20);
      tailSegs[i].rotation.x = damp(tailSegs[i].rotation.x, climbAmount * 0.08 * lock + tWhip * lock + undX, lam, dt);
      tailSegs[i].rotation.y = damp(tailSegs[i].rotation.y, rudder + coil, lam, dt);
      tailSegs[i].rotation.z = damp(tailSegs[i].rotation.z, -coil * 0.4, 10, dt);   // slight bank into the coil (like azure)
    }
  } else {
    // FLAP-COUPLED tail (yoke dragons): the tail DROPS a few degrees at the wing apex as a
    // counterbalance (and lifts back on the downstroke), driven by the same 5-phase envelope
    // + a small lag. Gated by model.flap.body → no effect on dragons without yoke flap config.
    const fb = activeDef.model.flap && activeDef.model.flap.body;
    const apexTail = fb ? Math.max(0, flapEnv(phase - 2 * Math.PI * (fb.tailLag ?? 0.08), activeDef.model.flap)) * (fb.tailDropDeg ?? 0) * (Math.PI / 180) : 0;
    for (let i = 0; i < nTail; i++) {
      const lock = nTail > 1 ? i / (nTail - 1) : 0;
      const lock2 = lock * lock;
      const tphase = time * 4.0 - i * 0.6;
      const amp = 0.3 * lock2;
      const motionTrailX = -player.velocity.x * 0.05 * lock2;
      const motionTrailY = -player.velocity.y * 0.04 * lock2;
      const speedWhip = speedNorm * Math.sin(time * 8 - i * 0.7) * 0.12 * lock2;
      const waveX = Math.sin(tphase) * amp + motionTrailX + speedWhip;
      const waveY = Math.cos(tphase * 0.8) * amp * 0.55 + motionTrailY;
      tailSegs[i].position.x = damp(tailSegs[i].position.x, waveX, 10, dt);
      tailSegs[i].position.y = damp(tailSegs[i].position.y, waveY, 10, dt);
      // Rotation follows the wave direction so segments bank into the coil.
      tailSegs[i].rotation.z = damp(tailSegs[i].rotation.z, -waveX * 0.5, 12, dt);
      tailSegs[i].rotation.y = damp(tailSegs[i].rotation.y, waveX * 0.5, 12, dt);
      tailSegs[i].rotation.x = damp(tailSegs[i].rotation.x, -apexTail * (0.4 + 0.6 * lock), 10, dt);
    }
  }

  // koiSerpent (jade): flex the ONE tube mesh into a swimming S on the CPU — each vertex
  // x = baseX + amp·ramp·sin(freq·z + phase), ramp 0 at the head → 1 at the tail (head leads,
  // tail whips). Phase ACCUMULATES (never phase = speed·clock, or a boost jolts the wave) and
  // the speed factor eases so cruise→boost quickens smoothly. ~N·K verts (one hero) = trivial.
  if (bodyWave) {
    const sp = Math.min(Math.max((player.speed - 35) / 45, 0), 1);
    bodyWave.spd = damp(bodyWave.spd ?? sp, sp, 3, dt);
    bodyWave.phase += dt * bodyWave.baseSpeed * (0.6 + bodyWave.spd * 0.7);
    const arr = bodyWave.geo.attributes.position.array;
    const { baseX, baseY, spineZ, ramp, amp, ampY, freq, phase, count } = bodyWave;
    const breathMul = 1 + (bodyWave.breath || 0) * Math.sin(phase * 0.21);   // GLOW-UP: slow breathing meander — the S periodically deepens like a koi coasting
    if (bodyWave.ribbon && bodyWave.ribbon.active) {
      // ── RIBBON re-loft (RIBBON-ANIMATION-PLAN.md) — the follow-the-leader sim fills liveFrames,
      // then the WHOLE welded mesh is re-lofted from them: vertex = frame.p + offT·T + offB·B + offN·Nn.
      // (Inc 0 scaffold: `active` is off, so jade stays on the sine below — this branch is proven
      // headless by tests/ribbonspine.mjs and switched on with the swim/parity gate at Inc 2.)
      const rib = bodyWave.ribbon;
      // Drive the follow-the-leader sim: the head world position = group.localToWorld(anchor). Feed
      // it (with the group's world −z as the seed forward), then fold the world stations/frames back
      // into group-local (inverse group quaternion) so the re-loft lands in the mesh's own space.
      if (rib.sim) {
        const a = rib.sim.anchor;
        _ribAnchor.set(a.x, a.y, a.z).applyQuaternion(group.quaternion);
        _ribHeadW.copy(group.position).add(_ribAnchor);
        _ribFwd.set(0, 0, -1).applyQuaternion(group.quaternion);
        // ramp the steer-curl SLOWLY (≈1s) toward the normalised steer so a momentary flick barely
        // curls but a SUSTAINED hard turn hooks the tail — making the coil read distinct from a turn.
        const steerN = Math.max(-1, Math.min(1, player.velocity.x / CONFIG.lateralSpeed));
        ribbonCurl = damp(ribbonCurl, steerN, 1.1, dt);
        rib.sim.curl = ribbonCurl;
        // swim swells into the axis you're steering: |lateral| feeds the lateral S, |vertical| the
        // vertical S (smoothed so it flows in, doesn't pop), and it energises with cruise speed.
        const driveXt = Math.min(1, Math.abs(player.velocity.x) / CONFIG.lateralSpeed) * 0.9;
        const driveYt = Math.min(1, Math.abs(player.velocity.y) / (CONFIG.verticalSpeed || 18)) * 0.7;
        ribDriveX = damp(ribDriveX, driveXt, 3, dt);
        ribDriveY = damp(ribDriveY, driveYt, 3, dt);
        rib.sim.driveX = ribDriveX; rib.sim.driveY = ribDriveY;
        rib.sim.gain = 1 + speedNorm * 0.45;
        updateRibbonSim(rib, _ribHeadW.x, _ribHeadW.y, _ribHeadW.z, _ribFwd, dt);
        _ribInvQ.copy(group.quaternion).invert();
        ribbonToLocal(rib, _ribInvQ, _ribHeadW.x, _ribHeadW.y, _ribHeadW.z);
      }
      const F = rib.liveFrames, ST = rib.station, oT = rib.offT, oB = rib.offB, oN = rib.offN;
      for (let v = 0; v < rib.count; v++) {
        const f = F[ST[v]], t = oT[v], b = oB[v], n = oN[v];
        arr[v * 3] = f.p.x + t * f.T.x + b * f.B.x + n * f.Nn.x;
        arr[v * 3 + 1] = f.p.y + t * f.T.y + b * f.B.y + n * f.Nn.y;
        arr[v * 3 + 2] = f.p.z + t * f.T.z + b * f.B.z + n * f.Nn.z;
      }
    } else {
      for (let v = 0; v < count; v++) {
        const ph = freq * spineZ[v] + phase;
        arr[v * 3] = baseX[v] + amp * breathMul * ramp[v] * Math.sin(ph);
        arr[v * 3 + 1] = baseY[v] + ampY * breathMul * ramp[v] * Math.sin(ph * 0.9 + 0.4);
      }
    }
    bodyWave.geo.attributes.position.needsUpdate = true;
    // §4.3a: the river-pearl (the ONE bloom) + fin-tip dew gems BREATHE with the swim, written
    // via userData.baseIntensity — NOT emissiveIntensity, which the flare/reset loop below
    // clobbers every frame (the gravePulse contract). The shared loop then APPLIES it: cruise
    // shows the breath, Surge multiplies the breathing base. No fever guard — the pulse rides
    // through Surge (the gravePulse precedent), and the base is read from userData.pulseBase so
    // baseIntensity (the pulsing output) never feeds back into itself.
    if (jadePearlMat) {
      const pb = jadePearlMat.userData.pulseBase ?? 0.55;
      jadePearlMat.userData.baseIntensity = pb * (1 + 0.14 * Math.sin(bodyWave.phase * 0.5));
    }
    if (jadeTipGemMat) {
      const gb = jadeTipGemMat.userData.pulseBase ?? 0.85;
      jadeTipGemMat.userData.baseIntensity = gb * (1 + 0.28 * Math.sin(bodyWave.phase * 0.5 - 0.9));
    }
    // §4.3b: the pearl-chain walk — links 1/3/4 (satellite beads → lyre gems → streamer ribbons)
    // ignite in REARWARD phase sequence off the ONE clock, each with its own lag, so pearl-light
    // visibly travels the body like river-current. Same clobber-proof write pattern.
    if (jadeChainMats) for (const m of jadeChainMats) {
      const b = m.userData.chainBase ?? 0.5;
      m.userData.baseIntensity = b * (1 + (m.userData.chainPulse ?? 0.3)
        * Math.sin(bodyWave.phase * 0.5 - (m.userData.chainLag ?? 0)));
    }
    // §4.5: the lyre gems are separate meshes over the WHIPPING tail — ride the SAME wave
    // formula as the tube (the hoisted rampAt) or they detach (the severed-appendage read).
    if (jadeWaveRiders) for (const r of jadeWaveRiders) {
      const rp = bodyWave.rampAt(r.spineZ), ph = freq * r.spineZ + phase;
      r.obj.position.x = r.baseX + amp * breathMul * rp * Math.sin(ph);
      r.obj.position.y = r.baseY + ampY * breathMul * rp * Math.sin(ph * 0.9 + 0.4);
    }
  }
  // Segmented-wyrm body: a lead-first travelling wave. The lead plate leads; each
  // plate behind trails with a phase lag, so the chain slithers in zero-g; turning
  // bends it (lead first, rear dragging), speed adds a faint whip.
  if (bodySegs) {
    const lag = (activeDef.model.segmentLag ?? 0.14) * 7;
    const sway = activeDef.model.segmentSway ?? 0.16;
    const bob = activeDef.model.segmentBob ?? 0.08;
    const last = Math.max(1, bodySegs.length - 1);
    const steer = player.velocity.x;                    // + = steering right
    for (let i = 0; i < bodySegs.length; i++) {
      const tt = i / last;                              // 0 = lead/head → 1 = tail
      const ramp = 0.18 + 0.95 * tt;                    // front (saddle) calm, tail whips widest
      const ph = time * 2.2 - i * lag;
      // SNAKE TURN: the head leads and the body TRAILS into a following C-curve —
      // rear plates lag toward the outside of the turn (they haven't caught up),
      // the bend accumulating down the chain (∝ tt²). This is the lateral spine
      // bend a serpent makes to change direction; combined with the horizontal
      // SLITHER (§0.5) below, the chain S-curves side to side instead of bobbing up.
      // (steer ranges to ~±24 = CONFIG.lateralSpeed at full input, so coefficients
      // are small — full steer should curve the chain, not fling segments apart.)
      const turnBend = -steer * 0.04 * tt * tt;
      const wx = Math.sin(ph) * sway * ramp + turnBend;
      const wy = (bodySegs[i].userData.baseY ?? 0.5) + Math.sin(ph * 0.9) * bob * tt * 0.3;
      bodySegs[i].position.x = damp(bodySegs[i].position.x, wx, 9, dt);
      bodySegs[i].position.y = damp(bodySegs[i].position.y, wy, 9, dt);
      // Yaw each plate to face along the path: the slither's travel direction (cos)
      // PLUS a turn yaw so the plates swing to follow the curve (rear angles most).
      bodySegs[i].rotation.y = damp(bodySegs[i].rotation.y, Math.cos(ph) * 0.34 * ramp + steer * 0.013 * (0.4 + tt), 10, dt);
      // Lean into the turn (a snake rolls slightly into its bend) over the wave roll.
      bodySegs[i].rotation.z = damp(bodySegs[i].rotation.z, -Math.sin(ph) * 0.12 * ramp - steer * 0.008 * tt, 10, dt);
    }
  }
  // Orbiting tail relics: boost tightens the orbit + aligns with speed; Surge
  // flares it wide. Rings (baseRadius 0) just spin; their Surge flare is emissive.
  if (tailOrbiters) {
    const tighten = player.feverActive ? 1.4 : player.boosting ? 0.74 : 1;
    for (const o of tailOrbiters) {
      o.ang += dt * o.speed;
      o.radius = damp(o.radius, o.baseRadius * tighten, 4, dt);
      o.mesh.position.x = Math.cos(o.ang) * o.radius;
      o.mesh.position.z = Math.sin(o.ang) * o.radius * o.flat;
      o.mesh.position.y = o.baseY + Math.sin(time * 1.6 + o.ang) * 0.05;
      if (o.spin) o.mesh.rotation.y = time * 1.2;
    }
  }

  // Eternal tail DEPLOYMENT: the apex stabilizers ride a deploy factor by flight
  // state — tucked-sleek in cruise (~0.82), full at boost (1.0), over-opened on
  // Surge (~1.08). Deploy scales the anhedral roll about each fin's REST pose, so
  // it only ever opens further DOWN & OUTWARD — never up into the centre lane. The
  // cyan edge flare rides the shared spineMats Surge loop below (not duplicated
  // here). No-op for every other dragon + non-apex form (tailFins is empty).
  if (tailFins.length) {
    const deployTarget = player.feverActive ? 1.08 : player.boosting ? 1.0 : 0.82;
    tailDeploy = damp(tailDeploy, deployTarget, 5, dt);
    for (const f of tailFins) {
      // BANK STEER: the bat-tail fins curve INTO the turn like a rudder (bankGain is
      // signed per side). Additive on rotation.y; no-op where bankGain is unset.
      const bank = turnBias * (f.userData.bankGain ?? 0);
      f.rotation.z = (f.userData.restRotZ ?? 0) * tailDeploy;
      f.rotation.y = (f.userData.restRotY ?? 0) * tailDeploy + bank;
      if (f.userData.restRotX != null) {
        // STABILIZER-FLAP pitch (gated by flapFlutter; no-op for every other tailFins
        // dragon): a gentle up/down cruise flutter that swells as the dragon climbs —
        // the spoiler flaps "supporting flight" like aircraft elevators.
        const fl = f.userData.flapFlutter || 0;
        const flutter = fl ? Math.sin(time * 3.2 + (f.userData.phase || 0)) * fl * (1 + climbAmount * 1.6) : 0;
        f.rotation.x = f.userData.restRotX + flutter;
      }
      f.scale.setScalar((f.userData.restScale ?? 1) * (0.96 + 0.06 * tailDeploy));
    }
  }

  // Boost/Surge glow + fever tint + eyes + aura (cheap material writes).
  const backlit = 0.22 + Math.max(0, Math.sin(phase)) * 0.18;

  // Surge TRANSFORMATION: a Surge START fires a ~0.7s ignition flourish (a
  // 0→1→0 burst) instead of a hard color swap — it flashes the core, overshoots
  // the spine, swells a glow around the wings and pulses the body, then settles
  // into the steady transformed state (surgeMix).
  if (player.feverActive && !prevFever) surgeAnimT = 0.7;
  // IGNITION EMBER-BURST — on the Surge rising edge, fling a one-shot shower of ~18 saturated embers off
  // every trailing-edge/tail emitter at once: the silhouette outlined in flying sparks for half a second,
  // the "matter becomes fire" beat that reads as a real transformation (replaces the old white flash).
  if (player.feverActive && !prevFever && emberEmitters) {
    const burstRamp = [0xffd070, 0xff9a3c, 0xff6a1a, 0xff8a20, 0xfff2d0, 0xffb84a];
    let bn = 0;
    for (let pass = 0; pass < 2 && bn < 18; pass++) {
      for (const em of emberEmitters) {
        if (bn >= 18) break;
        const s = emberMotes.find(m => !m.visible);
        if (!s) break;
        em.getWorldPosition(tmpV);
        s.visible = true; s.userData.life = 1;
        s.userData.vy = 1.4 + Math.random() * 1.2;
        s.material.color.setHex(burstRamp[bn % burstRamp.length]);
        s.position.set(tmpV.x + (Math.random() - 0.5) * 0.8, tmpV.y + (Math.random() - 0.5) * 0.8, tmpV.z + (Math.random() - 0.5) * 0.8);
        bn++;
      }
    }
  }
  prevFever = player.feverActive;
  if (surgeAnimT > 0) surgeAnimT = Math.max(0, surgeAnimT - dt);
  const ignite = surgeAnimT > 0 ? Math.sin((1 - surgeAnimT / 0.7) * Math.PI) : 0;
  surgeMix = damp(surgeMix, player.feverActive ? 1 : 0, 4, dt);
  // Per-form Surge intensity (apex Obsidian flares a touch harder); default 1 =
  // unchanged. Scales ONLY the Surge-delta terms below, never the steady base.
  const sgm = activeDef.model.surgeGlowMultiplier ?? 1;

  // Wings: a soft emitting glow swells AROUND them during Surge (replaces the
  // old emitting ring), spiking on the ignition flourish.
  const wingGlowTarget = backlit + (player.boosting ? 0.7 : 0) + (surgeMix * 0.55 + ignite * 0.8) * sgm
    + inhale01 * 0.9;   // PR-C: the mantled wings GLOW as the charge draws
  wingMat.emissiveIntensity = damp(wingMat.emissiveIntensity, wingGlowTarget, 6, dt);
  // Surge wing tint is per-dragon: dragons blaze magenta, the Phoenix ignites
  // white-gold (def.feverWing) so its Rebirth reads celestial, not pink.
  wingMat.emissive.setHex(player.feverActive ? (activeDef.feverWing ?? 0xff44cc) : (activeDef.wingMembraneEmissive ?? activeDef.wingEmissive));
  // PR-C: lean the glow toward lance-jade with the inhale (fever pink wins —
  // Surge is the reserved role colour; the lerp only runs while charging).
  if (inhale01 > 0.01 && !player.feverActive) wingMat.emissive.lerp(_jadeGlow, inhale01 * 0.6);
  // Membrane translucency by state (bones/struts keep their own opaque mats):
  // see upcoming rings through the wing — more so while boosting / surging. The
  // rest opacity is per-form (model.wingOpacity); boost/Surge drop below it so the
  // cyan-edged apex wing turns gauzy (its bright rim still reads).
  const baseWingOp = activeDef.model.wingOpacity ?? 0.82;
  const wingOpacity = player.feverActive ? baseWingOp - 0.12 : player.boosting ? baseWingOp - 0.05 : baseWingOp;
  wingMat.opacity = damp(wingMat.opacity, wingOpacity, 5, dt);
  // ── TEMPEST STORM TICK (§5d) — the SINGLE writer for the storm circuit (parts.stormArcMats).
  // Advances the deterministic strike clock, idles the garment at a breathing hum, lifts it to
  // `peak` on the pulseTimer strikes TRAVELLING root→tip (each bucket reads the strike env delayed
  // +0.04·bucket s, so the bolt arrives at the tips ~0.08 s after the sternum), and BREAKS it open
  // on Surge. The arc mats sit in NEITHER the rim nor the flare loop, so nothing else writes them;
  // stormTimer is null for every other dragon → roster untouched.
  if (stormTimer && stormArcMats.length) {
    stormTimer.pin(STRIKE_PIN);   // ?strikePin freezes the schedule for pixel-comparable captures (null = live)
    stormTimer.setDuty(player.boosting || player.feverActive ? 2.2 : 1);   // boost/Surge: strikes fire ~2.2× as often (§5c)
    const phase01 = ((phase / (Math.PI * 2)) % 1 + 1) % 1;   // flap phase → the downstroke-apex bias hint
    stormTimer.tick(dt, phase01);
    const ss = stormTimer.state();
    const tNow = ss.t;
    stormEnvHist.push({ t: tNow, e: ss.env01 });
    while (stormEnvHist.length > 48) stormEnvHist.shift();
    // env for a bucket = the pulse envelope delayed by its travel offset — a DEEP lag (0.16 s/bucket
    // ≈0.32 s sternum→wingtip) so the current visibly RUNS from the central body out to the wing tips
    // (owner). Live only; a pinned capture is a single static frame, so every bucket shows one env.
    const envAt = (b) => {
      if (STRIKE_PIN !== null || b === 0) return ss.env01;
      const want = tNow - 0.16 * b;
      let e = stormEnvHist.length ? stormEnvHist[0].e : 0;
      for (let i = stormEnvHist.length - 1; i >= 0; i--) { if (stormEnvHist[i].t <= want) { e = stormEnvHist[i].e; break; } }
      return e;
    };
    const breathe = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.5 * tNow);   // 0.5 Hz charge breathe (deterministic, pinnable)
    const qGate = quality >= 1 ? 1 : 0.6;   // low adaptive quality softens the strike (photosensitivity headroom)
    const fever = player.feverActive;
    // ── THE THUNDERROLL — the Tempest's SURGE SIGNATURE (its "Haunting" equivalent). On Surge the
    // circuit doesn't hold a flat blaze: it THUNDERS on a beat. Each ~1.15 s beat opens with a sharp
    // CRACK that detonates and ROLLS root→tip (the wing bones light in sequence, 0.09 s/bucket), decays
    // into a rolling rumble bed, and a shorter AFTER-CLAP follows — so it reads like real thunder, not a
    // metronome. Deterministic + pinnable; beat ≈0.87 Hz + one afterclap → well under the 3 Hz cap.
    const thunderAt = (b) => {
      const T = tNow - 0.09 * b, beat = 1.15, ph = (((T % beat) + beat) % beat) / beat;
      const crack = Math.pow(Math.max(0, 1 - ph / 0.85), 2.4);                                   // sharp attack at the beat, long decay tail
      const afterclap = (ph > 0.34 && ph < 0.50) ? 0.5 * Math.pow(1 - (ph - 0.34) / 0.16, 2) : 0;  // the shorter second crack
      return 0.42 + 1.25 * Math.max(crack, afterclap);                                            // rumble bed + the traveling cracks
    };
    // BREATHING-SURGE wave: the "alive" pulse under Surge — a slow breath + a faster shimmer, summed
    // to an organic 0..1 (never a flat blaze). Per-bucket phase → the charge shimmers root→tip. This is
    // the "charged, breathing lightning" read: the wing-colour waxing and waning, alive (owner).
    const breatheSurge = (b) => {
      const T = tNow - 0.05 * b;
      const slow = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.55 * T);
      const fast = 0.5 + 0.5 * Math.sin(2 * Math.PI * 1.6 * T + 2.1);
      return 0.65 * slow + 0.35 * fast;
    };
    for (const m of stormArcMats) {
      const u = m.userData;
      const b = u.stormBucket || 0;
      const hum = u.stormHum ?? 0.6, peak = u.stormPeak ?? 1.6, cap = u.stormCap ?? 2.0;
      const env = envAt(b) * qGate;
      // NORMAL: near-OFF idle hint + the periodic CRACKLE (the strike env flashes it toward peak, then
      // it falls back to the dark hint — "capable of cracking", never a steady garment).
      let ei = hum * breathe + env * (peak - hum);
      let hot = Math.max(0, (env - 0.8) / 0.2);   // white-hot only at the crackle peak
      if (fever) {
        // SURGE — CHARGED, BREATHING lightning: the circuit comes ALIVE and pulses the wing-colour,
        // waxing and waning between ~half and full (never flat, never off), with thunder CRACKS rolling
        // root→tip on the beat riding on top. Ramped in by surgeMix so the awakening is smooth.
        const breath = breatheSurge(b);
        const crack = Math.max(0, thunderAt(b) - 0.42) / 1.25;      // 0..1 crack accent
        const alive = peak * (0.5 + 0.5 * breath) + (cap - peak) * 0.7 * crack;   // breathe ~half→peak, cracks push past peak toward cap
        ei = Math.max(ei, alive * (0.35 + 0.65 * surgeMix));
        hot = Math.max(hot, surgeMix * Math.min(1, 0.3 + 0.5 * breath + crack));   // pale storm-white, whitest on the breath crest + cracks
      }
      m.emissiveIntensity = Math.min(cap * 1.02, ei);
      _stormBase.setHex(u.baseEmissive ?? 0xd9deff);
      m.emissive.copy(_stormBase).lerp(_stormHot, Math.min(1, hot));
    }
    // the sternum dynamo "turns over" on each strike AND BOOMS with every thunder-crack during Surge
    stormCoreKick = 1 + 0.5 * ss.env01 + (fever ? 0.9 * Math.max(0, thunderAt(0) - 0.42) : 0);
    // ── THE ARC CROWN — forked arcs leap between her body parts on each thunder crack (fire a fresh set
    // on every beat + a re-strike at mid-beat; intensity rides the crack so they flash and vanish).
    if (arcCrown) {
      if (fever) {
        const beat = Math.floor(tNow / 1.15), beatPh = (tNow / 1.15) - beat;
        if (beat !== arcBeat) { arcBeat = beat; arcRestruck = false; arcCrown.fire((0x5721 ^ (beat * 2654435761)) | 0, pickStormArcRoutes((0x5721 ^ (beat * 2654435761)) | 0));
          if (surgeMix > 0.3) emit('stormThunder', { intensity: 0.55 + 0.45 * surgeMix }); }   // the Surge beat SOUNDS the thunder (rhythmic, once per ~1.15s)
        else if (!arcRestruck && beatPh > 0.5) { arcRestruck = true; const s = (0x91a3 ^ (beat * 40503)) | 0; arcCrown.fire(s, pickStormArcRoutes(s)); }   // the return-stroke
        let crack = Math.min(1, Math.max(0, (thunderAt(0) - 0.6)));   // 0 in the rumble, ~1 at the crack peak
        // debug capture seam only: pin the crack to full so every headless screenshot catches a live bolt
        // (arcs otherwise flash ~0.2 s per 1.15 s beat). Undefined in normal play → zero gameplay effect.
        if (typeof globalThis !== 'undefined' && globalThis.__ddArcForce) crack = 1;
        arcCrown.render(arcCamDir, crack * surgeMix);
        stormCrack = crack * surgeMix;   // #5 ONE CONDUCTOR — the eyes/wash flash on the SAME beat (set below)
      } else if (arcBeat !== -1) { arcCrown.clear(); arcBeat = -1; stormCrack = 0; }
    }
  } else {
    stormCoreKick = 1;
  }
  if (trailGoldT > 0) trailGoldT = Math.max(0, trailGoldT - dt);   // H6 §B.12 overtake gold flash decay
  // H7 DRAGON VITALS — the flag-gated living-gauge pass. Runs inside THIS
  // material section (no second loop); sets bondBodyMul / bondCoreAdd for the
  // shipped writes below. Toggle OFF ⇒ exactly ×1 / +0 and zero writes.
  updateBondVitals(dt, time);
  // Violet core energy: pulses on boost, blazes + flashes on the Surge ignition.
  if (coreGlow) {
    if (swallowT > 0) swallowT = Math.max(0, swallowT - dt);   // H6 §B.7 the swallow tick
    const swallow01 = swallowT / SWALLOW_DUR;
    const cb = (coreGlow.userData.base || 0.3) * stormCoreKick;
    const coreTarget = (player.feverActive ? cb * (1 + 1.4 * sgm) + Math.sin(time * 9) * 0.08 * sgm
      : player.boosting ? cb * 1.5 : cb) + ignite * 0.5 * sgm + inhale01 * 0.4   // PR-C: interior ember charges
      + swallow01 * 0.5   // the ember swallow: a brief core flare as it's eaten
      + bondCoreAdd       // H7: the 1-heart heartbeat (exactly 0 with DRAGON VITALS off)
      + bondSurgeAdd;     // H8: the core-fallback surge steps (exactly 0 with the flag off)
    coreGlow.material.opacity = damp(coreGlow.material.opacity, coreTarget, 5, dt);
  }
  // THE HAUNTING gap-pulse (Revenant): walk a brightness wave tail→head across the 3 dorsal
  // gap-leak buckets — "the glow that dances across the bones". Writes userData.baseIntensity (NOT
  // emissiveIntensity — that would be clobbered by the flare/reset loop below); the shared loop then
  // APPLIES it: cruise shows the dance, Surge multiplies the dancing base. Runs BEFORE that loop.
  // Guarded on the cached bucket list → an empty array (zero writes) for every other dragon.
  for (const m of graveMatPulse) {
    const amp = m.userData.gravePulseAmp || 0;
    m.userData.baseIntensity = amp * (0.7 + 0.3 * Math.sin(time * 2.2 - m.userData.gravePulseBucket * 1.7));
  }
  // Spine/crest/seam/tail plates flare toward the per-dragon Surge highlight,
  // overshooting on the ignition.
  if (surgeMix > 0.002 || ignite > 0.002) {
    _surgeHi.setHex(activeDef.surgeHi || 0xfff8e8); // white-gold default; cool per dragon
    for (const m of spineFlareMats) {
      // Per-mat flare WEIGHTS (Surge composition), split into two independent channels so a broad face
      // can shift HUE toward surgeHi (read as "glowing") WITHOUT gaining intensity (which would bloom it
      // to a white slab), while a thin already-bright fire ribbon can hold its intensity flat and just
      // hot-shift its tip. `flareColorWeight` scales the colour lerp; `flareIntensityWeight` scales the
      // intensity gain; both fall back to the scalar `flareWeight`, then to 1 (⇒ every other dragon
      // arithmetically identical). This is how the phoenix reads wings-as-hero / body-as-accent on Surge.
      const wc = m.userData.flareColorWeight ?? m.userData.flareWeight ?? 1;
      const wi = m.userData.flareIntensityWeight ?? m.userData.flareWeight ?? 1;
      _surgeBaseCol.setHex(m.userData.baseEmissive ?? 0xffffff);
      m.emissive.copy(_surgeBaseCol).lerp(_surgeHi, Math.min(1, (surgeMix * 0.85 + ignite * 0.4) * wc));
      // A NEGATIVE flareIntensityWeight lets an already-bloom-bright mat DIM on Surge (so a DENSE field of
      // emissive faces stays saturated fire instead of the bloom summing them to white). Clamp the factor
      // ≥0.28 so a strongly-dimmed mat holds a steady deep glow and never black-blinks on the ignite spike.
      m.emissiveIntensity = (m.userData.baseIntensity ?? 1) * Math.max(0.12, 1 + (surgeMix * 0.9 + ignite * 1.6) * sgm * wi);
    }
  } else {
    for (const m of spineFlareMats) {
      m.emissive.setHex(m.userData.baseEmissive ?? 0xffffff);
      m.emissiveIntensity = m.userData.baseIntensity ?? 1;
    }
  }
  // Fresnel rim: a warm edge light in cruise that brightens on boost and flares
  // toward the per-dragon Surge highlight during a surge. Strength scales with
  // the adaptive quality factor so the lowest tier softens it. (updateRim is a
  // no-op until the materials compile — registry fills on first render.)
  // Cruise rim hue is per-dragon: a warm cream by default, but a COLD storm-steel for the Tempest so her
  // charcoal reads OUTLINED with a cool identity in cruise instead of a warm-lit generic silhouette
  // (glow-up: kill the flat-black read; a storm dragon's edge must be cold, not cream).
  const lever = getHeroRim();   // per-biome backlit-rim lever — k is 0 everywhere but the Mire (Fable 79)
  _rimCol.setHex(activeDef.rimCruise ?? 0xfff0d8);
  // The boost is SCENE light (the ember horizon behind the hero), so it drags the edge hue toward the
  // biome backlight — capped at 0.65 so a cold-identity skin (Tempest) keeps a third of its own edge.
  if (lever.k > 0.001) _rimCol.lerp(lever.color, Math.min(0.65, lever.k * 1.1));
  if (surgeMix > 0.002) {
    _rimHi.setHex(activeDef.surgeHi || 0xff66cc);
    _rimCol.lerp(_rimHi, Math.min(1, surgeMix * 0.7));   // Surge still takes the hue over the biome backlight
  }
  const rimStrength = ((activeDef.rimCruiseBase ?? 0.5) + (player.boosting ? 0.2 : 0) + surgeMix * 0.7) * quality;
  updateRim(_rimCol, rimStrength, lever.k * quality);   // lever.k>0 only in the Mire → boost=0 elsewhere = byte-identical rim
  // Body "power-up" pulse on the ignition flourish (settles back to scale).
  group.scale.setScalar(activeDef.model.scale * (1 + ignite * 0.05));
  // H7 DRAGON VITALS: bondBodyMul steps the emissive floor down per heart lost,
  // clamped ≥0.75 (§B.1); exactly ×1 with the toggle off.
  bodyMat.emissiveIntensity = damp(bodyMat.emissiveIntensity, (player.feverActive ? 0.35 : 0.12) * bondBodyMul, 4, dt);
  eyeMat.emissive.setHex(player.feverActive ? (activeDef.feverEye ?? 0xff66ee) : activeDef.eye);
  // #5 ONE CONDUCTOR — the eyes flash white-hot on each thunder crack (same beat as the arcs), so the
  // Surge reads as one giant synchronized event. stormCrack is 0 for every non-storm dragon.
  if (stormCrack > 0.001 && eyeMat.userData.stormEyeBase == null) eyeMat.userData.stormEyeBase = eyeMat.emissiveIntensity || 1;
  if (eyeMat.userData.stormEyeBase != null) eyeMat.emissiveIntensity = eyeMat.userData.stormEyeBase * (1 + 2.0 * stormCrack);
  // Aura: full blaze during fever; premium dragons idle with a faint halo.
  const idle = activeDef.fx.auraIdle;
  const auraTarget = (player.feverActive
    ? 0.20 * (activeDef.feverAuraScale ?? 1) + Math.sin(time * 5) * 0.06   // Fable 75: base 0.30→0.20, amp 0.10→0.06 (the tamed body-glow); feverAuraScale still shrinks it further for fire dragons
    : idle > 0 ? idle * (0.85 + Math.sin(time * 3) * 0.15) : 0)
    + inhale01 * 0.14;   // PR-C: the halo swells with the drawn breath (Fable 75: 0.22→0.14)
  auraSprite.material.opacity = damp(auraSprite.material.opacity, auraTarget, 5, dt);
  // Tint the aura to an ember corona on Surge (default white ⇒ every other dragon unchanged).
  if (activeDef.feverAura != null) auraSprite.material.color.setHex(player.feverActive ? activeDef.feverAura : 0xffffff);

  group.updateMatrixWorld(true);

  // HERO LIGHT + WATER POOL (Fable 75): the player's real light breathes on the idle pulse
  // and blazes on fever; the custom water shader ignores scene lights, so the mirror is fed
  // the light positionally (a reflection STREAK that moves with the player, never a disc).
  if (heroLight) {
    const heroI = 12 * (0.85 + 0.15 * Math.sin(time * 2.1)) * (player.feverActive ? 1.7 : 1.0);
    heroLight.intensity = damp(heroLight.intensity, heroI, 4, dt);
    group.getWorldPosition(_heroPos);
    heroPoolK = damp(heroPoolK, player.feverActive ? 1.0 : 0.55, 4, dt);
    setWaterHeroPool(_heroPos, heroLight.color, heroPoolK);
  }

  // Wing-tip contrails — the SECONDARY boost accent, only on the elite forms
  // (spineGlow ≥ 0.5) and only while boosting, so it stays restrained. Violet
  // wisps during Surge (the apex's amethyst energy at the wing edge).
  const wingFx = (activeDef.model.spineGlow || 0) >= 0.5;
  if (player.boosting && wingFx) {
    contrailTimer -= dt;
    if (contrailTimer <= 0) {
      contrailTimer = (player.feverActive ? 0.02 : 0.03) / quality;
      for (const marker of [tipMarkerL, tipMarkerR]) {
        const s = trailSprites.find(s => !s.visible);
        if (!s) break;
        marker.getWorldPosition(tmpV);
        s.visible = true;
        s.userData.life = player.feverActive ? 0.75 : 0.6; // shorter than body trail = crisp ribbon
        s.material.color.setHex(player.feverActive && !activeDef.hasStyle ? 0xc998ff : pickTrailHex(activeDef.trail));
        s.position.copy(tmpV);
      }
    }
  }

  // Ponytail: hair chain (only the loose-haired riders have one)
  if (ponySegs > 0) {
    riderHead.getWorldPosition(tmpV);
    tmpV.y += 0.1;
    tmpV.z += 0.14;
    ponyPoints[0].copy(tmpV);
    for (let i = 1; i < ponySegs; i++) {
      const dir = tmpV2.copy(ponyPoints[i]).sub(ponyPoints[i - 1]);
      dir.y -= 2.4 * dt;
      dir.z += (player.speed / 35) * 2.8 * dt;
      if (dir.lengthSq() < 1e-8) dir.set(0, 0, 1);
      dir.setLength(PONY_LEN);
      ponyPoints[i].copy(ponyPoints[i - 1]).add(dir);
      ponyMeshes[i].position.copy(ponyPoints[i]);
    }
    ponyMeshes[0].position.copy(ponyPoints[0]);
  }

  // Speed trail (orb/fast), tinted per dragon; shifts pink during fever. Also emits
  // during Surge even WITHOUT boost, so a surging dragon always streams energy.
  trailTimer -= dt;
  if ((player.speedActive || player.feverActive) && trailTimer <= 0) {
    trailTimer = (player.feverActive ? 0.009 : player.boosting ? 0.03 : 0.015) / quality;
    const s = trailSprites.find(s => !s.visible);
    if (s) {
      s.visible = true;
      s.userData.life = 1;
      s.material.color.setHex(player.feverActive && !activeDef.hasStyle ? 0xff9ad6 : pickTrailHex(activeDef.trail));
      // Fire dragons: spawn the body speed-trail well BEHIND the dragon (not ON it) so its additive haze
      // stops fogging the silhouette; tighter spread too.
      s.position.set(
        group.position.x + (Math.random() - 0.5) * (activeDef.fireTrails ? 1.0 : 1.6),
        group.position.y + (Math.random() - 0.5) * (activeDef.fireTrails ? 0.8 : 1.2),
        group.position.z + (activeDef.fireTrails ? 6 : 3) + Math.random() * (activeDef.fireTrails ? 3 : 2.5)
      );
    }
  }
  for (const s of trailSprites) {
    if (!s.visible) continue;
    s.userData.life -= dt * 2.5;
    if (s.userData.life <= 0) { s.visible = false; s.material.opacity = 0; }
    else {
      s.material.opacity = s.userData.life * (activeDef.fireTrails ? 0.40 : 0.85);   // Fable 79: comp for the ~¼-energy tight trail curve — restores in-motion centreline luminance
      const sz = 0.8 + (1 - s.userData.life) * 2.2;
      s.scale.set(sz, sz, 1);
    }
  }

  // Boost exhaust — the TAIL is the primary boost source: emit from the tail
  // TIP, denser the more evolved the form (spineGlow proxies the tier), and a
  // white-gold core during Surge.
  boostTrailTimer -= dt;
  if ((player.boosting || player.feverActive) && boostTrailTimer <= 0) {
    const fxLvl = activeDef.model.spineGlow || 0; // 0 hatchling → 1 apex
    const pr = activeDef.model.particleRate ?? 1; // per-form trail density (apex emits more)
    // Light tail trail while boosting; the current heavier rate stays for Surge.
    boostTrailTimer = (player.feverActive ? (activeDef.fireTrails ? 0.03 : 0.012) : 0.035) / (quality * (1 + fxLvl * 0.7) * pr);
    const s = boostTrailSprites.find(s => !s.visible);
    if (s && tailSegs.length) {
      tailSegs[tailSegs.length - 1].getWorldPosition(tmpV);
      s.visible = true;
      s.userData.life = player.feverActive ? 1.2 : 1;
      // Fire dragons: cycle an EMBER ramp across the exhaust sprites so the additive stack reads as
      // FIRE, not a single-hue fog that sums to cream. (Per-sprite index → stable, deterministic-ish.)
      const emberExh = [0xffc46a, 0xff8a20, 0xf25410];
      s.material.color.setHex(activeDef.fireTrails ? emberExh[boostTrailSprites.indexOf(s) % emberExh.length]
        : player.feverActive && !activeDef.hasStyle ? 0xfff0c0 : pickTrailHex(activeDef.boostTrail));
      s.position.set(
        tmpV.x + (Math.random() - 0.5) * 0.8,
        tmpV.y + (Math.random() - 0.5) * 0.6,
        tmpV.z + Math.random() * (player.feverActive ? 3 : 2)
      );
    }
  }
  const boostOp = activeDef.fireTrails ? 0.50 : 0.95;   // fire exhaust runs dimmer + sparser so it doesn't wash the scene gold (owner: "too much"); Fable 79: +comp for the tight trail curve
  const boostSzK = activeDef.fireTrails ? 2.4 : 3.5, boostSz0 = activeDef.fireTrails ? 1.0 : 1.2;
  for (const s of boostTrailSprites) {
    if (!s.visible) continue;
    s.userData.life -= dt * 2.0;
    if (s.userData.life <= 0) { s.visible = false; s.material.opacity = 0; }
    else {
      s.material.opacity = s.userData.life * boostOp;
      const sz = boostSz0 + (1 - s.userData.life) * boostSzK;
      s.scale.set(sz, sz, 1);
    }
  }

  // Thruster jet-fire — ETERNAL form only, during Surge: a tight flame stream from each
  // rear thruster mouth in the Surge-highlight colour (the colour Surge flares the
  // wings), like a jet afterburner. Emits only when the collected pod emitters exist
  // (Mk II), the form is Eternal (formLevel ≥ 3) and Surge is active.
  if (thrusterEmitters.length && (activeDef.model.formLevel ?? 0) >= 3 && player.feverActive) {
    thrusterFireTimer -= dt;
    if (thrusterFireTimer <= 0) {
      thrusterFireTimer = 0.011 / quality;
      // Surge emission inherits the player's equipped TRAIL colour (magenta-pink fallback
      // when no custom trail is set) — personalises the afterburner without repainting the body.
      const fireHex = activeDef.hasStyle ? pickTrailHex(activeDef.trail) : 0xff4fd8;
      for (const em of thrusterEmitters) {
        const s = thrusterFireSprites.find(s => !s.visible);
        if (!s) break;
        em.getWorldPosition(tmpV);
        s.visible = true;
        s.userData.life = 1;
        s.material.color.setHex(fireHex);
        s.position.set(
          tmpV.x + (Math.random() - 0.5) * 0.18,
          tmpV.y + (Math.random() - 0.5) * 0.14,
          tmpV.z + Math.random() * 1.4
        );
      }
    }
  }
  for (const s of thrusterFireSprites) {
    if (!s.visible) continue;
    s.userData.life -= dt * 3.0;   // short + fast → a tight afterburner jet, not smoke
    if (s.userData.life <= 0) { s.visible = false; s.material.opacity = 0; }
    else {
      s.material.opacity = s.userData.life * 0.9;
      const sz = 0.5 + (1 - s.userData.life) * 1.6;
      s.scale.set(sz, sz, 1);
    }
  }

  // ── Universal wing FX — wingtip edge-trails + hard-bank aero-shear. They emit from
  //    the wingtip markers, which (nearly) every dragon model provides, so the WHOLE
  //    roster gets them (previously gated to Mk II only). Per-form intensity still
  //    scales it; dragons without a form level default to a moderate, visible level.
  const hasWingFx = !!(tipMarkerL || tipMarkerR);
  // (1) Wing-edge tip trails — thin streaks off the wingtip markers, scaling with boost/
  // surge + the form's maturity. WHITE at cruise/boost; the player's custom trail colour
  // during Surge (magenta-pink fallback). Per-form intensity (baby minimal → Eternal best).
  if (hasWingFx) {
    const wtFx = [0.05, 0.18, 0.45, 1.0][activeDef.model.formLevel ?? 2] ?? 1;
    const surging = player.feverActive;
    const isPhx = activeDef.archetype === 'phoenix';
    const turning = bankHard > 0.25;   // actively banking left / right
    // Wingtip edge-trails fire when TURNING (air shed off the tips) — NOT constantly
    // while boosting. The Phoenix is the exception: it streams them constantly in Surge.
    if (wtFx > 0 && (tipMarkerL || tipMarkerR) && ((isPhx && surging) || turning)) {
      wingtipTrailTimer -= dt;
      if (wingtipTrailTimer <= 0) {
        wingtipTrailTimer = (surging ? 0.02 : 0.03) / (quality * wtFx);
        const hex = surging ? (activeDef.hasStyle ? pickTrailHex(activeDef.trail) : 0xff4fd8) : 0xffffff;
        for (const marker of [tipMarkerL, tipMarkerR]) {
          if (!marker) continue;
          const s = wingtipTrailSprites.find(s => !s.visible);
          if (!s) break;
          marker.getWorldPosition(tmpV);
          s.visible = true;
          s.userData.life = surging ? 0.9 : player.boosting ? 0.6 : 0.4;
          s.userData.fx = wtFx;
          s.material.color.setHex(hex);
          s.position.copy(tmpV);
        }
      }
    }
    for (const s of wingtipTrailSprites) {
      if (!s.visible) continue;
      s.userData.life -= dt * 2.6;
      if (s.userData.life <= 0) { s.visible = false; s.material.opacity = 0; }
      else { s.material.opacity = s.userData.life * 0.5 * (s.userData.fx ?? 1); const sz = 0.22 + (1 - s.userData.life) * 0.85; s.scale.set(sz, sz, 1); }
    }
  }
  // (2) Hard-bank aero-shear / wingtip vortex — thin WHITE vapor off the wingtips at high
  // speed + hard bank; the OUTSIDE wing (opposite the turn) shows the stronger/longer streak.
  if (hasWingFx && speedNorm > 0.58 && bankHard > 0.5) {
    const asFx = [0.2, 0.45, 0.7, 1.0][activeDef.model.formLevel ?? 2] ?? 1;
    aeroShearTimer -= dt;
    if (aeroShearTimer <= 0) {
      aeroShearTimer = 0.016 / quality;
      const load = Math.min(1, (speedNorm - 0.58) * 2 + (bankHard - 0.5));
      const turnSign = Math.sign(turnBias) || 1;     // >0 turning right
      for (const [marker, side] of [[tipMarkerL, -1], [tipMarkerR, 1]]) {
        if (!marker) continue;
        const outside = side === -turnSign;          // outside of the turn = stronger
        const strength = (outside ? 1.0 : 0.45) * asFx * load;
        if (strength < 0.06) continue;
        const s = aeroShearSprites.find(s => !s.visible);
        if (!s) break;
        marker.getWorldPosition(tmpV);
        s.visible = true;
        s.userData.life = 0.4 + strength * 0.5;
        s.userData.str = strength;
        s.material.color.setHex(0xffffff);
        s.position.set(tmpV.x, tmpV.y, tmpV.z + Math.random() * 0.3);
      }
    }
  }
  for (const s of aeroShearSprites) {
    if (!s.visible) continue;
    s.userData.life -= dt * 2.2;
    if (s.userData.life <= 0) { s.visible = false; s.material.opacity = 0; }
    else { s.material.opacity = s.userData.life * 0.45 * (s.userData.str ?? 1); const sz = 0.3 + (1 - s.userData.life) * 1.3; s.scale.set(sz, sz, 1); }
  }

  // Glowing motes drift UP + BACK (toward the camera, away from the centre lane).
  //  • Phoenix: warm ember-feathers, always, denser on later forms / boost.
  //  • Sovereign (def.surgeMotes): cool arcane motes — ONLY during Surge — that
  //    breathe blue-violet / cyan / indigo eclipse energy off the tail and body.
  if (emberMotes.length) {
    const isPhx = activeDef.archetype === 'phoenix';
    const fxLvl = activeDef.model.spineGlow || 0;
    const emitting = isPhx || player.feverActive;
    moteTimer -= dt;
    if (emitting && moteTimer <= 0 && tailSegs.length) {
      moteTimer = isPhx ? Math.max(0.05, (player.feverActive ? 0.07 : player.boosting ? 0.08 : 0.18) - fxLvl * 0.07) : 0.045;
      const s = emberMotes.find(s => !s.visible);
      if (s) {
        const src = emberEmitters ? emberEmitters[moteIdx++ % emberEmitters.length]
          : isPhx ? tailSegs[Math.floor(tailSegs.length * 0.6)]
            : tailSegs[Math.floor(Math.random() * tailSegs.length)];
        src.getWorldPosition(tmpV);
        s.visible = true;
        s.userData.life = 1;
        if (isPhx) {
          s.userData.vy = 0.5 + Math.random() * 0.9;
          // Fire dragons: the rising fever motes cycle an EMBER ramp (3-in-4 saturated ember, 1-in-4 cream
          // spark) instead of the hard cream 0xfff2d0 → an ascending EMBER coil, not a white one. Scoped to
          // fireTrails so the shipped phoenix stays byte-identical.
          const emberRamp = [0xffd070, 0xff9a3c, 0xff6a1a, 0xff8a20, 0xffb84a, 0xf25410, 0xfff2d0, 0xff7a1a];
          const feverHex = activeDef.fireTrails ? emberRamp[moteIdx % emberRamp.length] : 0xfff2d0;
          s.material.color.setHex(player.feverActive ? feverHex : player.boosting ? 0xfff0c8 : 0xffd987);
          s.position.set(tmpV.x + (Math.random() - 0.5) * 1.0,
            tmpV.y + (Math.random() - 0.5) * 0.5, tmpV.z + Math.random() * 1.2);
        } else {
          const arcane = [0x7a5cff, 0x5ce6ff, 0x4b5dff, 0xb8a8ff];
          s.userData.vy = 0.3 + Math.random() * 0.7;
          s.material.color.setHex(arcane[moteIdx++ % arcane.length]);
          s.position.set(tmpV.x + (Math.random() - 0.5) * 1.4,
            tmpV.y + (Math.random() - 0.5) * 0.8 + 0.25, tmpV.z + Math.random() * 1.4);
        }
      }
    }
    // Phoenix embers eased down so they read as accents — but in Surge they blaze.
    const peak = isPhx ? (player.feverActive ? 0.5 : 0.26 + fxLvl * 0.14) : 0.5;
    for (const s of emberMotes) {
      if (!s.visible) continue;
      s.userData.life -= dt * 0.85;
      if (s.userData.life <= 0) { s.visible = false; s.material.opacity = 0; continue; }
      s.position.y += s.userData.vy * dt;   // buoyant rise
      s.position.z += dt * 1.4;             // drift back toward the camera
      s.material.opacity = s.userData.life * peak;
      const sz = 0.22 + (1 - s.userData.life) * 0.5;
      s.scale.set(sz, sz, 1);
    }
  }

  // Wingtip wisps — the apex Obsidian sheds cool cyan plasma off its winglets,
  // continuously (not boost-gated like the contrail), from the wing-tip markers
  // (kept current by the updateMatrixWorld above). Low + small so it reads as a
  // stealth accent, not clutter; absent entirely when wingParticleRate is 0.
  if (wingMotes.length && tipMarkerL && tipMarkerR) {
    const wpr = activeDef.model.wingParticleRate || 0;
    wingMoteTimer -= dt;
    if (wpr > 0 && wingMoteTimer <= 0) {
      wingMoteTimer = 0.10 / (quality * wpr);
      const s = wingMotes.find(s => !s.visible);
      if (s) {
        const marker = (wingMoteSide++ & 1) ? tipMarkerL : tipMarkerR;
        marker.getWorldPosition(tmpV);
        s.visible = true;
        s.userData.life = 1;
        s.userData.vy = 0.15 + Math.random() * 0.25;
        s.material.color.setHex(0x8be9ff);
        s.position.set(tmpV.x + (Math.random() - 0.5) * 0.3,
          tmpV.y + (Math.random() - 0.5) * 0.2, tmpV.z + (Math.random() - 0.5) * 0.3);
      }
    }
    for (const s of wingMotes) {
      if (!s.visible) continue;
      s.userData.life -= dt * 1.6;
      if (s.userData.life <= 0) { s.visible = false; s.material.opacity = 0; continue; }
      s.position.y += s.userData.vy * dt;   // gentle rise
      s.position.z += dt * 0.9;             // drift back toward the camera
      s.material.opacity = s.userData.life * 0.32;
      const sz = 0.10 + (1 - s.userData.life) * 0.18;
      s.scale.set(sz, sz, 1);
    }
  }

  // Death burst update
  if (burstActive) {
    burstTimer -= dt;
    const alive = burstTimer > 0;
    for (const p of burstParticles) {
      if (!p.visible) continue;
      p.position.x += p.userData.vel.x * dt;
      p.position.y += p.userData.vel.y * dt;
      p.position.z += p.userData.vel.z * dt;
      p.userData.vel.y -= 18 * dt; // gravity
      p.rotation.x += p.userData.spin * dt;
      p.rotation.z += p.userData.spin * 0.7 * dt;
      const life = Math.max(burstTimer, 0);
      p.material.opacity = life;
      p.scale.setScalar(life * 1.5 + 0.1);
      if (!alive) p.visible = false;
    }
    if (!alive) burstActive = false;
  }
}

export function resetDragon(player) {
  group.position.set(player.position.x, player.position.y, player.position.z);
  group.rotation.set(0, 0, 0);
  head.rotation.set(0, 0, 0);
  bankZ = 0;
  wingMat.emissiveIntensity = 0;
  bodyMat.emissiveIntensity = 0;
  auraSprite.material.opacity = 0;
  for (const p of ponyPoints) p.set(player.position.x, player.position.y + 1.5, player.position.z);
  for (const s of trailSprites) { s.visible = false; s.userData.life = 0; }
  for (const s of boostTrailSprites) { s.visible = false; s.userData.life = 0; }
  for (const s of emberMotes) { s.visible = false; s.material.opacity = 0; s.userData.life = 0; }
  for (const s of wingMotes) { s.visible = false; s.material.opacity = 0; s.userData.life = 0; }
  for (const s of bondBleedMotes) { s.visible = false; s.material.opacity = 0; s.userData.life = 0; }
  bondPrevHealth = null;   // H7: a run reset is never a "wound"
  for (const p of burstParticles) { p.visible = false; }
  tailDeploy = 0.82;
  burstActive = false;
}
