import * as THREE from 'three';
import { damp, makeGlowTexture } from './util.js';
import { buildDragonModel } from './dragonModel.js';
import { buildRiderFigure, riderMaterials } from './riderParts.js';
import { setFeverTint } from './postfx.js';
import { applyRim, updateRim, resetRim } from './rimLight.js';
import { flapWing, formStrength, formSpeed } from './dragonWingFlap.js';
import { solveWing, flapEnv, phaseCenter } from './wingFlapSolver.js';
import { setActiveDetail } from './modelDetail.js';
import { buildCelestialStorm } from './celestialModel.js';   // view-only in-game preview of the clean-sheet Celestial Storm (gated by ?celestial)

// ?celestial in the URL → overlay the clean-sheet Celestial Storm as the player dragon for an in-game look.
// Off by default: the shipped roster build path is byte-for-byte unchanged. View-only (physics/collision still
// use the real equipped dragon underneath, which is built normally and just hidden).
const CELESTIAL_PREVIEW = typeof location !== 'undefined' && /[?&]celestial\b/.test(location.search);
let celestialModel = null;

// Procedural dragon + rider. Built from a dragon def (dragons.js: palette,
// model proportions, fx) and a rider def (riders.js: outfit, hair, accessory,
// glow). disposeDragon/rebuildDragon let the shop swap either mid-session.

let sceneRef = null;
let activeDef = null;
let activeRider = null;

// `?wingDebug=<glide|recovery|apex|downstroke|settle>` FREEZE mode: holds the wings at one
// cycle point with steering/boost/bank neutralised, and logs the resolved flap config + the
// wing's WORLD-frame elevation — to prove gameplay reproduces the harness apex.
const WING_DEBUG = (typeof location !== 'undefined' && location.search)
  ? new URLSearchParams(location.search).get('wingDebug') : null;
let wingDebugLogged = false;
let bodyFlapLift = 0;   // flap-coupled body pitch (chest lift at apex / compress on downstroke); set by the yoke solver

let group = null;
let wingYokeL = null;  // root shoulder-carrier stage (Mk II yoke wings), null otherwise
let wingYokeR = null;
let wingPivotL = null;
let wingPivotR = null;
let wingMidL = null;  // middle joint of the 3-segment articulated wing (Mk II), null otherwise
let wingMidR = null;
let wingTipL = null;  // secondary fold joint for 2-segment wing
let wingTipR = null;
let wingPivot2L = null;
let wingPivot2R = null;
let wingRigL = null;  // skinned-wing flap rigs (shoulder/elbow/wrist), null otherwise
let wingRigR = null;
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
let tailOrbiters = null;  // orbiting tail shards / ring fragments

// Materials animated at runtime (boost glow / fever tint)
let bodyMat = null;
let wingMat = null;
let eyeMat = null;
// Wing-tip contrail markers + fever aura
let tipMarkerL = null;
let tipMarkerR = null;
let auraSprite = null;
let coreGlow = null;      // violet core energy sprite (pulses during Surge)
let spineMats = [];       // spine/crest/seam/plate mats → white-gold in Surge
let surgeMix = 0;         // 0..1 damped Surge transition
let prevFever = false;    // rising-edge detect for the Surge ignition flourish
let surgeAnimT = 0;       // one-shot transformation timer (s)
const _surgeBaseCol = new THREE.Color();
const _surgeHi = new THREE.Color(); // per-dragon Surge highlight (def.surgeHi)
let quality = 1;

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
  const pal = activeDef && activeDef.trailPalette;
  if (pal && pal.length) return pal[trailPaletteIdx++ % pal.length];
  return fallback;
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
  ({ head, tailSegs, wingPivotL, wingPivotR, wingTipL, wingTipR,
     wingPivot2L, wingPivot2R, tipMarkerL, tipMarkerR } = result.parts);
  wingMidL = result.parts.wingMidL || null;
  wingMidR = result.parts.wingMidR || null;
  wingYokeL = result.parts.wingYokeL || null;
  wingYokeR = result.parts.wingYokeR || null;
  wingRigL = result.parts.wingRigL || null;
  wingRigR = result.parts.wingRigR || null;
  tailFins = result.parts.tailFins || [];
  spineSegs = result.parts.spineSegs || [];
  bodySegs = result.parts.bodySegs || null;
  tailOrbiters = result.parts.tailOrbiters || null;
  ({ bodyMat, wingMat, eyeMat } = result.materials);
  auraSprite = result.auraSprite;
  coreGlow = result.parts.coreGlow;
  spineMats = result.materials.spineMats || [];

  // Fresnel rim light on the hero's solid surfaces — lifts the silhouette off a
  // bright sky/water. Additive to outgoing light (independent of the emissive
  // Surge animation below). Cleared first so a shop rebuild doesn't leak the
  // old materials' uniform sets into the registry.
  resetRim();
  applyRim(bodyMat, { strength: 0.0, power: 3.2, mul: def.rimBodyMul ?? 1 });
  applyRim(wingMat, { strength: 0.0, power: 2.4 });
  for (const m of spineMats) applyRim(m, { strength: 0.0, power: 3.0 });
  surgeMix = 0;
  surgeAnimT = 0;
  prevFever = false;

  // Per-dragon Surge wash hue (def.feverWash): the Phoenix Rebirth washes warm
  // gold, the Sovereign eclipse washes cool blue, the rest keep the magenta default.
  setFeverTint(def.feverWash || null);

  buildRider(riderDef, result.parts.riderSocket);
  scene.add(group);

  // ── CELESTIAL PREVIEW (?celestial) ─────────────────────────────────────────
  // Keep the real dragon fully built (so updateDragon's per-frame part writes never crash), but HIDE its visuals
  // and overlay the Celestial Storm — parented to `group` so it inherits flight position/pitch/bank, auto-fitted
  // to the real dragon's size, oriented head-forward (−z) dorsal-up (+y), and flapped by its own updateFlap.
  celestialModel = null;
  if (CELESTIAL_PREVIEW) {
    const nbox = new THREE.Box3().setFromObject(group), nsz = nbox.getSize(new THREE.Vector3());   // real dragon size BEFORE hiding
    for (const ch of group.children) ch.visible = false;                                            // hide the real dragon + rider
    const cel = buildCelestialStorm();
    const cbox = new THREE.Box3().setFromObject(cel.group), ccen = cbox.getCenter(new THREE.Vector3()), csz = cbox.getSize(new THREE.Vector3());
    cel.group.position.sub(ccen);                                                                   // recenter the (un-centered) model on its own origin
    const wrap = new THREE.Group();
    wrap.add(cel.group);
    wrap.rotation.x = -Math.PI / 2;                                                                 // model +y(head)→−z(forward), +z(dorsal)→+y(up)
    const s = 2.34 * (Math.max(nsz.x, nsz.y, nsz.z) || 1) / (Math.max(csz.x, csz.y, csz.z) || 1);     // fit to the real dragon's largest extent, ×2.34 (was ×1.8, +30% per request) so the Celestial reads at a hero scale in the chase cam
    wrap.scale.setScalar(s);
    group.add(wrap);
    celestialModel = cel;
    if (typeof window !== 'undefined') window.__celestial = cel;   // debug: lets headless tests confirm in-game body-life articulates
    console.log(`[celestial-preview] overlaid; fit scale ${s.toFixed(3)} (real ${nsz.y.toFixed(2)} / model ${csz.y.toFixed(2)})`);
  }

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

  // Speed-trail pools
  const cyanTex = makeGlowTexture('120,220,255');
  const blueTex = makeGlowTexture('80,130,255');

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
    for (let i = 0; i < 34; i++) {
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
  for (const s of [...trailSprites, ...boostTrailSprites, ...emberMotes, ...wingMotes]) {
    s.material.dispose();
    sceneRef.remove(s);
  }
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
  bodySegs = null;
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
  for (const s of [...trailSprites, ...boostTrailSprites, ...emberMotes, ...wingMotes]) s.visible = v;
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

export function updateDragon(dt, player, time) {
  // Follow flight position with hover bob
  group.position.set(
    player.position.x,
    player.position.y + Math.sin(time * 2.1) * 0.16,
    player.position.z
  );

  // Celestial preview: drive its own wing flap (the real dragon below is hidden but still animates harmlessly)
  if (celestialModel) celestialModel.updateFlap(time, 1);

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
  if (prevSpeedActive && !player.speedActive) decel01 = 1;      // RELEASE → air-brake spike
  prevSpeedActive = !!player.speedActive;
  decel01 = damp(decel01, 0, 2.2, dt);                          // …eased out smoothly
  const aero01 = Math.min(1, Math.max(boost01 * 0.7, surge01, diveAmount * 0.85));   // tuck/sweep
  const spread01 = Math.min(1, climbAmount * 0.9 + decel01);                          // open/brake
  // POSTURE pitch: nose-DOWN in dive, nose-UP in climb, relax on decel. Surge no longer
  // pitches the nose down — it was flashing the ventral (belly) of the body+wings from the
  // chase cam during Dragon Surge (user note). The big deliberate poses stay on DIVE/CLIMB.
  const posturePitch = climbAmount * 0.42 - diveAmount * 0.5 - boost01 * 0.02 + decel01 * 0.05;

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
  // Slight yaw toward lateral movement
  group.rotation.y = damp(group.rotation.y, player.velocity.x * 0.008, 6, dt);
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
  if (riderGlow) {
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
  const flapSpeed = (player.speedActive ? 11 : 6) * feverBoost * activeDef.model.flapBias
    * formSpeed(activeDef.model) * (activeDef.model.flapFreqScale ?? 1)
    * (1 - 0.55 * diveAmount) * (1 - 0.18 * decel01);
  // AMPLITUDE: dive tucks to a glide (small), climb + decel open broad to catch air.
  const flapAmp = (player.speedActive ? 0.7 : 0.52) * (activeDef.model.flapAmp ?? 1)
    * (1 - 0.7 * diveAmount) * (1 + 0.3 * climbAmount) * (1 + 0.25 * decel01);
  const turnBias = Math.max(-0.28, Math.min(0.28, player.velocity.x * 0.018));
  const climbBias = Math.max(-0.18, Math.min(0.18, player.velocity.y * 0.015));
  // INTEGRATE the beat clock — `flapSpeed` varies every frame (dive/decel/boost blends), so
  // `time * flapSpeed` would jump the phase by `time·Δfreq` (tens of radians) and the wings
  // would spasm. Accumulating dt·flapSpeed keeps the phase continuous: changing the frequency
  // only changes the RATE. Wrapped mod 2π for float precision over long sessions.
  flapPhase = (flapPhase + dt * flapSpeed) % (Math.PI * 2);
  const phase = flapPhase;
  const rootFlap = Math.sin(phase) * flapAmp + 0.1;
  const feather = Math.sin(phase + Math.PI * 0.55);
  const tipLag = Math.sin(phase + 0.95);
  if (wingRigL) {
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
    // FREEZE/NEUTRALISE for `?wingDebug`: hold one cycle point, zero steering/boost/bank/climb
    // so the wing pose is PURE solver output (the test the player asked for).
    const usePhase = WING_DEBUG ? phaseCenter(WING_DEBUG, m.flap) : phase;
    const tB = WING_DEBUG ? 0 : turnBias, rF = WING_DEBUG ? 0 : rollFold, cB = WING_DEBUG ? 0 : climbBias;
    const s = solveWing(usePhase, m.flap);
    bodyFlapLift = (m.flap.body && m.flap.body.liftAmt) ? m.flap.body.liftAmt * s.yoke.env : 0;
    const featR = Math.sin(usePhase + Math.PI * 0.55);
    const bank = WING_DEBUG ? 0 : Math.max(-1, Math.min(1, turnBias / 0.28));
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
    if (WING_DEBUG && !wingDebugLogged) {
      // Prove gameplay reaches the harness pose: log the resolved config + the wing chain's
      // elevation in the DRAGON'S OWN frame (independent of body bank/pitch). tipElevDeg should
      // read strongly positive at apex (a high V), ~flat at glide.
      try {
        wingDebugLogged = true;
        group.updateWorldMatrix(true, true);
        const inv = group.matrixWorld.clone().invert();
        const yL = wingYokeR.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
        const tL = wingTipR.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
        const tipElevDeg = Math.atan2(tL.y - yL.y, Math.hypot(tL.x - yL.x, tL.z - yL.z)) * 180 / Math.PI;
        console.log('[wingDebug] ' + JSON.stringify({
          dragon: activeDef.name, form: activeDef.model.formLevel, phaseName: WING_DEBUG,
          phase: +usePhase.toFixed(3), apexHold: m.flap.apexHold, yokeElevDeg: m.flap.yokeElevDeg, curlDeg: m.flap.curlDeg,
          yokeRzDeg: +(wingYokeR.rotation.z * 180 / Math.PI).toFixed(1),
          tipElevDeg: +tipElevDeg.toFixed(1),
        }));
      } catch (e) { console.log('[wingDebug] log failed', String(e)); }
    }
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
        tp.rotation.set(-0.05 + twTip + 0.12 * inside - apexPitch * aT, tipSweepBase + 0.22 * inside, -(tF * amp) + aT * amp + 0.16 * inside); }
    };
    poseWing(wingPivotR, wingMidR, wingTipR, bank);
    poseWing(wingPivotL, wingMidL, wingTipL, -bank);
  } else {
    wingPivotR.rotation.z = damp(wingPivotR.rotation.z, -rootFlap + turnBias + rollFold, 14, dt);
    wingPivotL.rotation.z = damp(wingPivotL.rotation.z,  rootFlap + turnBias - rollFold, 14, dt);
    wingPivotR.rotation.x = damp(wingPivotR.rotation.x, 0.14 + feather * 0.18 + climbBias, 10, dt);
    wingPivotL.rotation.x = damp(wingPivotL.rotation.x, 0.14 - feather * 0.18 + climbBias, 10, dt);
    wingPivotR.rotation.y = damp(wingPivotR.rotation.y, -0.18 + turnBias * 0.8, 9, dt);
    wingPivotL.rotation.y = damp(wingPivotL.rotation.y,  0.18 + turnBias * 0.8, 9, dt);
    // Tip fold (2-bone wings): folds on up-stroke, extends on down-stroke, with a
    // small delay between wings so the silhouette feels less mechanical.
    wingTipR.rotation.z = damp(wingTipR.rotation.z, tipLag * 0.28 + turnBias * 0.45, 12, dt);
    wingTipL.rotation.z = damp(wingTipL.rotation.z, -Math.sin(phase + 1.18) * 0.28 + turnBias * 0.45, 12, dt);
    wingTipR.rotation.x = damp(wingTipR.rotation.x, -0.12 + feather * 0.16, 10, dt);
    wingTipL.rotation.x = damp(wingTipL.rotation.x, -0.12 - feather * 0.16, 10, dt);
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
        b.rotation.x = damp(b.rotation.x, wave + climbAmount * 0.16 + vWhip, 9 + 4 * aero01, dt);
        b.rotation.y = damp(b.rotation.y, turnBias * 0.35 * bankHard, 6, dt);   // hips drift into a HARD turn (eased)
      } else if (role === 'neck') {
        // FIRM neck: faint bob/breathe, near-STILL under streamline/fever (calmHN). Leads the
        // turn only on a hard bank (eased); shares a little of the vertical body-whip.
        const bob = 0.022 * sp * calmHN * flapSurge(phase - 0.3) * (activeDef.model.bodyBobScale ?? 1);
        const breathe = Math.sin(time * 1.1) * 0.006 * calmHN;
        b.rotation.x = damp(b.rotation.x, bob + breathe - noseDown * 0.48 + noseUp * 0.42 + vWhip * 0.45, 9, dt);
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
  if (nTail && activeDef.model.tailWhip) {
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
    for (let i = 0; i < nTail; i++) {
      const lock = (i + 1) / nTail;                        // root subtle → tip full (per-segment)
      const coil = Math.sin(time * coilRate - i * 0.6) * coilAmp * lock;  // azure-style lateral coil
      const rudder = turnBias * (1.4 + 0.9 * aero01) * lock * bankHard;    // hard-bank rudder
      tailSegs[i].rotation.x = damp(tailSegs[i].rotation.x, climbAmount * 0.08 * lock + tWhip * lock, lam, dt);
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
  prevFever = player.feverActive;
  if (surgeAnimT > 0) surgeAnimT = Math.max(0, surgeAnimT - dt);
  const ignite = surgeAnimT > 0 ? Math.sin((1 - surgeAnimT / 0.7) * Math.PI) : 0;
  surgeMix = damp(surgeMix, player.feverActive ? 1 : 0, 4, dt);
  // Per-form Surge intensity (apex Obsidian flares a touch harder); default 1 =
  // unchanged. Scales ONLY the Surge-delta terms below, never the steady base.
  const sgm = activeDef.model.surgeGlowMultiplier ?? 1;

  // Wings: a soft emitting glow swells AROUND them during Surge (replaces the
  // old emitting ring), spiking on the ignition flourish.
  const wingGlowTarget = backlit + (player.boosting ? 0.7 : 0) + (surgeMix * 0.55 + ignite * 0.8) * sgm;
  wingMat.emissiveIntensity = damp(wingMat.emissiveIntensity, wingGlowTarget, 6, dt);
  // Surge wing tint is per-dragon: dragons blaze magenta, the Phoenix ignites
  // white-gold (def.feverWing) so its Rebirth reads celestial, not pink.
  wingMat.emissive.setHex(player.feverActive ? (activeDef.feverWing ?? 0xff44cc) : (activeDef.wingMembraneEmissive ?? activeDef.wingEmissive));
  // Membrane translucency by state (bones/struts keep their own opaque mats):
  // see upcoming rings through the wing — more so while boosting / surging. The
  // rest opacity is per-form (model.wingOpacity); boost/Surge drop below it so the
  // cyan-edged apex wing turns gauzy (its bright rim still reads).
  const baseWingOp = activeDef.model.wingOpacity ?? 0.82;
  const wingOpacity = player.feverActive ? baseWingOp - 0.12 : player.boosting ? baseWingOp - 0.05 : baseWingOp;
  wingMat.opacity = damp(wingMat.opacity, wingOpacity, 5, dt);
  // Violet core energy: pulses on boost, blazes + flashes on the Surge ignition.
  if (coreGlow) {
    const cb = coreGlow.userData.base || 0.3;
    const coreTarget = (player.feverActive ? cb * (1 + 1.4 * sgm) + Math.sin(time * 9) * 0.08 * sgm
      : player.boosting ? cb * 1.5 : cb) + ignite * 0.5 * sgm;
    coreGlow.material.opacity = damp(coreGlow.material.opacity, coreTarget, 5, dt);
  }
  // Spine/crest/seam/tail plates flare toward the per-dragon Surge highlight,
  // overshooting on the ignition.
  if (surgeMix > 0.002 || ignite > 0.002) {
    _surgeHi.setHex(activeDef.surgeHi || 0xfff8e8); // white-gold default; cool per dragon
    for (const m of spineMats) {
      _surgeBaseCol.setHex(m.userData.baseEmissive ?? 0xffffff);
      m.emissive.copy(_surgeBaseCol).lerp(_surgeHi, Math.min(1, surgeMix * 0.85 + ignite * 0.4));
      m.emissiveIntensity = (m.userData.baseIntensity ?? 1) * (1 + (surgeMix * 0.9 + ignite * 1.6) * sgm);
    }
  } else {
    for (const m of spineMats) {
      m.emissive.setHex(m.userData.baseEmissive ?? 0xffffff);
      m.emissiveIntensity = m.userData.baseIntensity ?? 1;
    }
  }
  // Fresnel rim: a warm edge light in cruise that brightens on boost and flares
  // toward the per-dragon Surge highlight during a surge. Strength scales with
  // the adaptive quality factor so the lowest tier softens it. (updateRim is a
  // no-op until the materials compile — registry fills on first render.)
  _rimCol.setHex(0xfff0d8);
  if (surgeMix > 0.002) {
    _rimHi.setHex(activeDef.surgeHi || 0xff66cc);
    _rimCol.lerp(_rimHi, Math.min(1, surgeMix * 0.7));
  }
  const rimStrength = (0.5 + (player.boosting ? 0.2 : 0) + surgeMix * 0.7) * quality;
  updateRim(_rimCol, rimStrength);
  // Body "power-up" pulse on the ignition flourish (settles back to scale).
  group.scale.setScalar(activeDef.model.scale * (1 + ignite * 0.05));
  bodyMat.emissiveIntensity = damp(bodyMat.emissiveIntensity, player.feverActive ? 0.35 : 0.12, 4, dt);
  eyeMat.emissive.setHex(player.feverActive ? (activeDef.feverEye ?? 0xff66ee) : activeDef.eye);
  // Aura: full blaze during fever; premium dragons idle with a faint halo.
  const idle = activeDef.fx.auraIdle;
  const auraTarget = player.feverActive
    ? 0.30 + Math.sin(time * 5) * 0.10   // trimmed ~40%: the big additive halo was the main "lens-flare" blob
    : idle > 0 ? idle * (0.85 + Math.sin(time * 3) * 0.15) : 0;
  auraSprite.material.opacity = damp(auraSprite.material.opacity, auraTarget, 5, dt);

  group.updateMatrixWorld(true);

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

  // Speed trail (orb/fast), tinted per dragon; shifts pink during fever
  trailTimer -= dt;
  if (player.speedActive && trailTimer <= 0) {
    trailTimer = (player.feverActive ? 0.009 : player.boosting ? 0.012 : 0.015) / quality;
    const s = trailSprites.find(s => !s.visible);
    if (s) {
      s.visible = true;
      s.userData.life = 1;
      s.material.color.setHex(player.feverActive && !activeDef.hasStyle ? 0xff9ad6 : pickTrailHex(activeDef.trail));
      s.position.set(
        group.position.x + (Math.random() - 0.5) * 1.6,
        group.position.y + (Math.random() - 0.5) * 1.2,
        group.position.z + 3 + Math.random() * 2.5
      );
    }
  }
  for (const s of trailSprites) {
    if (!s.visible) continue;
    s.userData.life -= dt * 2.5;
    if (s.userData.life <= 0) { s.visible = false; s.material.opacity = 0; }
    else {
      s.material.opacity = s.userData.life * 0.65;
      const sz = 0.8 + (1 - s.userData.life) * 2.2;
      s.scale.set(sz, sz, 1);
    }
  }

  // Boost exhaust — the TAIL is the primary boost source: emit from the tail
  // TIP, denser the more evolved the form (spineGlow proxies the tier), and a
  // white-gold core during Surge.
  boostTrailTimer -= dt;
  if (player.boosting && boostTrailTimer <= 0) {
    const fxLvl = activeDef.model.spineGlow || 0; // 0 hatchling → 1 apex
    const pr = activeDef.model.particleRate ?? 1; // per-form trail density (apex emits more)
    boostTrailTimer = (player.feverActive ? 0.012 : 0.018) / (quality * (1 + fxLvl * 0.7) * pr);
    const s = boostTrailSprites.find(s => !s.visible);
    if (s && tailSegs.length) {
      tailSegs[tailSegs.length - 1].getWorldPosition(tmpV);
      s.visible = true;
      s.userData.life = player.feverActive ? 1.2 : 1;
      s.material.color.setHex(player.feverActive && !activeDef.hasStyle ? 0xfff0c0 : pickTrailHex(activeDef.boostTrail));
      s.position.set(
        tmpV.x + (Math.random() - 0.5) * 0.8,
        tmpV.y + (Math.random() - 0.5) * 0.6,
        tmpV.z + Math.random() * (player.feverActive ? 3 : 2)
      );
    }
  }
  for (const s of boostTrailSprites) {
    if (!s.visible) continue;
    s.userData.life -= dt * 2.0;
    if (s.userData.life <= 0) { s.visible = false; s.material.opacity = 0; }
    else {
      s.material.opacity = s.userData.life * 0.8;
      const sz = 1.2 + (1 - s.userData.life) * 3.5;
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

  // ── Mk II universal wing FX (gated to Mk II for now; generalise later) ──────────────
  const isMk2 = !!activeDef.model.wingParts;
  // (1) Wing-edge tip trails — thin streaks off the wingtip markers, scaling with boost/
  // surge + the form's maturity. WHITE at cruise/boost; the player's custom trail colour
  // during Surge (magenta-pink fallback). Per-form intensity (baby minimal → Eternal best).
  if (isMk2) {
    const wtFx = [0.05, 0.18, 0.45, 1.0][activeDef.model.formLevel ?? 3] ?? 1;
    const surging = player.feverActive;
    if (wtFx > 0 && (player.boosting || surging) && (tipMarkerL || tipMarkerR)) {
      wingtipTrailTimer -= dt;
      if (wingtipTrailTimer <= 0) {
        wingtipTrailTimer = (surging ? 0.02 : 0.034) / (quality * wtFx);
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
  if (isMk2 && speedNorm > 0.58 && bankHard > 0.5 && (tipMarkerL || tipMarkerR)) {
    const asFx = [0.2, 0.45, 0.7, 1.0][activeDef.model.formLevel ?? 3] ?? 1;
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
      moteTimer = isPhx ? Math.max(0.05, (player.boosting ? 0.08 : 0.18) - fxLvl * 0.07) : 0.045;
      const s = emberMotes.find(s => !s.visible);
      if (s) {
        const src = isPhx ? tailSegs[Math.floor(tailSegs.length * 0.6)]
          : tailSegs[Math.floor(Math.random() * tailSegs.length)];
        src.getWorldPosition(tmpV);
        s.visible = true;
        s.userData.life = 1;
        if (isPhx) {
          s.userData.vy = 0.5 + Math.random() * 0.9;
          s.material.color.setHex(player.boosting ? 0xfff0c8 : 0xffd987);
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
    const peak = isPhx ? 0.26 + fxLvl * 0.14 : 0.5; // Phoenix embers eased down so they read as accents, not clutter
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

  // Celestial preview: the real (hidden) dragon still emits its trails/wisps from its animated tip-markers.
  // Hide those FX pools each frame so they don't clutter the clean preview (emitted above, hidden here).
  if (celestialModel) {
    for (const s of [...trailSprites, ...boostTrailSprites, ...emberMotes, ...wingMotes, ...wingtipTrailSprites, ...thrusterFireSprites]) s.visible = false;
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
  for (const p of burstParticles) { p.visible = false; }
  tailDeploy = 0.82;
  burstActive = false;
}
