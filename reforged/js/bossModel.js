import * as THREE from 'three';
import { makeEnergyShell, createBossCommon } from './bossKit.js';
import { buildIdolMask } from './bossIdol.js';
import { buildStormMandala } from './bossMandala.js';
import { buildStoneColossus } from './bossColossus.js';
import { buildEmberHunter } from './bossAshtalon.js';
import { buildBoneCoil } from './bossMarrowcoil.js';
import { buildTwinWraith } from './bossEitherwing.js';
import { buildHollowgate, buildHollowgateSeed } from './bossHollowgate.js';
import { buildBrineholm } from './bossBrineholm.js';

// §5e HORIZON-PRESENCE dispatcher (the Calamities foreshadow artifact): a def
// with `horizonSeed: true` gets its fog-exempt far-silhouette here. Returns
// null for every un-opted def — the seed system is inert for them (coexist).
export function buildHorizonSeed(def) {
  if (!def?.horizonSeed) return null;
  if (def.archetype === 'hollowgate') return buildHollowgateSeed(def);
  return null;
}

// API-stable re-export: boss.js imports makeEnergyShell from here for the
// Surge aura FX. The implementation now lives in bossKit.js (shared plumbing
// for every boss archetype) — this file just forwards it so no consumer needs
// to change.
export { makeEnergyShell } from './bossKit.js';

// Procedural boss creature — asset-free, like everything else in the game.
// This is deliberately NOT a dragon: a floating eldritch crystal construct (a
// jagged core ringed with spikes, a glowing maw and two eyes, plus a few
// orbiting shards), so the boss reads as an "other" against the dragon roster.
//
// This is the LEGACY construct: the original single-recipe boss body. New
// archetypes (idol-mask, storm-mandala, ...) get their own builder files and
// delegate the shared plumbing — HP bar, shield bubble + shards, dissolve,
// flash decay — to bossKit.js exactly like this file does, so behavior stays
// identical across every boss and there's one place that owns it.
//
// Returns a handle the controller (boss.js) drives:
//   { group, muzzle, orbiters[], setDissolve(k), flash(amt), tick(dt, time) }
// All materials are collected so the disintegration death can fade them as one.

// Attach a roster-wide named-part WORLD-position accessor to every boss handle
// (the shared combat-feel seam): bullets can spawn from a body part and reflected
// shots can land on one. Named parts (skullGroup, ribPivotL/R*, tailBlade, …)
// already live in every boss's group; this resolves one by name — CACHED, since
// getObjectByName walks the whole tree — writing its live world position into
// `out`, or null if the name is absent (callers fall back to the boss centre).
// Works for archetype heroes AND the legacy construct, so no per-builder wiring,
// and a boss that names nothing stays byte-unchanged.
export function buildBoss(def, quality = 1) {
  const model = buildBossImpl(def, quality);
  if (model && model.group && !model.partWorldPos) {
    const cache = new Map(); const _v = new THREE.Vector3();
    model.partWorldPos = (name, out = _v) => {
      if (!name) return null;
      let n = cache.get(name);
      if (n === undefined) { n = model.group.getObjectByName(name) || null; cache.set(name, n); }
      return n ? n.getWorldPosition(out) : null;
    };
  }
  return model;
}

function buildBossImpl(def, quality = 1) {
  // Archetype dispatch (coexist rule): a def with `archetype` gets its own
  // hero builder; a def WITHOUT one falls straight through to the legacy
  // construct below, byte-identical to before archetypes existed — so the
  // shipped roster never breaks while new bosses migrate one at a time.
  if (def.archetype === 'idolMask') return buildIdolMask(def, quality);
  if (def.archetype === 'stormMandala') return buildStormMandala(def, quality);
  if (def.archetype === 'stoneColossus') return buildStoneColossus(def, quality);
  if (def.archetype === 'emberHunter') return buildEmberHunter(def, quality);
  if (def.archetype === 'boneCoil') return buildBoneCoil(def, quality);
  if (def.archetype === 'eitherwing') return buildTwinWraith(def, quality);
  if (def.archetype === 'hollowgate') return buildHollowgate(def, quality);
  if (def.archetype === 'brineholm') return buildBrineholm(def, quality);

  const accent = def.accent ?? 0xff4488;
  const glow = def.glow ?? 0xff88cc;
  // Nullable BODY RECIPE: silhouette knobs so each boss reads distinct at 30m.
  // Defaults reproduce the original construct (Voidmaw) exactly — a def with no
  // `body` is byte-identical to before this recipe existed (coexist rule).
  // This is knobs on ONE construct, deliberately NOT a creature system.
  const body = {
    silhouette: 'orb',        // 'orb' | 'shard' (elongated prow — bakes a stretch)
    spikeCount: null,         // null = legacy quality-based 6/8
    spikeLen: 2.4,
    spikeSweep: 0,            // 0 = radial crown; >0 sweeps the vanes backward
    orbiterStyle: 'shard',    // 'shard' octa chips | 'ringBlade' spinning blades
    orbiterCount: null,       // null = legacy quality-based 2/3
    eyeCount: 2,
    coreDetail: 1,
    ...(def.body || {}),
  };
  // The boss holds ~30m ahead; at that range the base primitives read small and
  // get lost against the horizon. Scale the whole construct up so it's an
  // imposing centrepiece (the dissolve multiplies from this base, not 1).
  const BASE_SCALE = def.scale ?? 1.5;

  // Shared plumbing (HP bar, shield bubble + shards, dissolve, flash decay) —
  // see bossKit.js. `kit.group` is the root every body part below attaches to;
  // `kit.track` collects every material this builder creates so the dissolve
  // and finalize() dev-assert can see it.
  const kit = createBossCommon(def, quality, { baseScale: BASE_SCALE });
  const { group, track } = kit;

  // 'shard' silhouette: bake an elongation into the body geometries (geometry-
  // level so the tick's animated scale.setScalar never fights a static scale).
  const stretch = (geo) => {
    if (body.silhouette === 'shard') geo.scale(0.82, 0.82, 1.5);
    return geo;
  };

  // --- Core: a dark faceted body with a strong emissive accent. Brighter than a
  // normal prop so the bloom pass catches it and it reads as a threat, not scenery.
  const coreMat = track(new THREE.MeshStandardMaterial({
    color: 0x1a0e22, emissive: accent, emissiveIntensity: 1.5,
    roughness: 0.35, metalness: 0.45, flatShading: true,
  }));
  const core = new THREE.Mesh(stretch(new THREE.IcosahedronGeometry(2.2, body.coreDetail)), coreMat);
  group.add(core);

  // Molten INNER CORE: a small bright sphere pulsing inside the faceted shell,
  // seen through the gaps — the "contained energy" read (drives the bloom).
  const innerMat = track(new THREE.MeshBasicMaterial({
    color: glow, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const innerCore = new THREE.Mesh(stretch(new THREE.IcosahedronGeometry(1.5, body.coreDetail)), innerMat);
  group.add(innerCore);

  // Fresnel ENERGY SHELL: glows at the silhouette edge so the boss pops against a
  // bright sky or the horizon city (the flat additive shell it replaces vanished).
  const shellMat = track(makeEnergyShell(glow, { power: 2.2, strength: 1.15, opacity: 1.0 }));
  const shell = new THREE.Mesh(stretch(new THREE.IcosahedronGeometry(2.9, 2)), shellMat);
  group.add(shell);
  // A wider, softer outer halo shell for atmosphere/scale.
  const haloMat = track(makeEnergyShell(accent, { power: 3.2, strength: 0.6, opacity: 1.0 }));
  const halo = new THREE.Mesh(stretch(new THREE.IcosahedronGeometry(3.9, 2)), haloMat);
  group.add(halo);

  // --- Spike crown: cones jutting out around the equator (spikeSweep > 0 tilts
  // them backward into swept storm-vanes — a clearly different silhouette) ---
  const spikeMat = track(new THREE.MeshStandardMaterial({
    color: 0x1a0f20, emissive: accent, emissiveIntensity: 0.5,
    roughness: 0.4, metalness: 0.35, flatShading: true,
  }));
  const spikeGeo = new THREE.ConeGeometry(0.55, body.spikeLen, 5);
  const spikeCount = body.spikeCount != null
    ? (quality < 0.75 ? Math.max(4, body.spikeCount - 2) : body.spikeCount)
    : (quality < 0.75 ? 6 : 8);
  const UP = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < spikeCount; i++) {
    const a = (i / spikeCount) * Math.PI * 2;
    const s = new THREE.Mesh(spikeGeo, spikeMat);
    s.position.set(Math.cos(a) * 2.4, Math.sin(a) * 2.4, 0);
    if (body.spikeSweep > 0) {
      // Orient the cone outward + backward (away from the player-facing +z).
      const dir = new THREE.Vector3(Math.cos(a), Math.sin(a), -body.spikeSweep).normalize();
      s.quaternion.setFromUnitVectors(UP, dir);
    } else {
      s.rotation.z = a - Math.PI / 2;       // legacy radial crown (Voidmaw)
    }
    group.add(s);
  }

  // --- Maw: a glowing ring + inner cone on the FRONT face (local +z = toward player) ---
  const mawMat = track(new THREE.MeshBasicMaterial({
    color: glow, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const maw = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.28, 8, 16), mawMat);
  maw.position.z = 1.9;
  group.add(maw);
  const throatMat = track(new THREE.MeshBasicMaterial({
    color: accent, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const throat = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.6, 12), throatMat);
  throat.position.z = 1.3;
  throat.rotation.x = -Math.PI / 2;       // open end toward the player
  group.add(throat);

  // --- Eyes: emissive sparks over the maw (2 = flanking pair; 1 = a single
  // larger cyclops storm-eye — a distinct face read per boss) ---
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: 0xfff2ff }));
  if (body.eyeCount === 1) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 6), eyeMat);
    eye.position.set(0, 1.05, 1.9);
    group.add(eye);
  } else {
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), eyeMat);
      eye.position.set(sx * 1.0, 1.0, 1.9);
      group.add(eye);
    }
  }

  // --- Orbiters (animated by the controller): octa chips, or thin spinning
  // ring-blades for a bladed-storm read ---
  const shardMat = track(new THREE.MeshStandardMaterial({
    color: 0x281030, emissive: glow, emissiveIntensity: 0.7,
    roughness: 0.3, metalness: 0.4, flatShading: true,
  }));
  const shardGeo = body.orbiterStyle === 'ringBlade'
    ? new THREE.TorusGeometry(0.62, 0.11, 6, 14)
    : new THREE.OctahedronGeometry(0.6, 0);
  const orbiters = [];
  const shardCount = body.orbiterCount != null
    ? (quality < 0.75 ? Math.max(2, body.orbiterCount - 1) : body.orbiterCount)
    : (quality < 0.75 ? 2 : 3);
  for (let i = 0; i < shardCount; i++) {
    const m = new THREE.Mesh(shardGeo, shardMat);
    m.userData = {
      ang: (i / shardCount) * Math.PI * 2,
      radius: 3.6 + i * 0.4,
      speed: 1.1 + i * 0.25,
      baseY: 0,
      tilt: i * 0.5,
    };
    group.add(m);
    orbiters.push(m);
  }

  // Hit flash targets the core material (the brightest/most "alive" read).
  kit.flashBind(coreMat, 1.5);

  // Shared plumbing is fully assembled now — cache base opacities + apply the
  // resting scale (finalize() also dev-asserts every material above went
  // through track()).
  kit.finalize();

  // Telegraph charge level 0→1: the maw flares (toward danger-red) and the throat
  // swells just before an attack releases, so the player gets a fair wind-up read.
  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }

  function tick(dt, time) {
    core.rotation.y += dt * 0.5;
    core.rotation.x += dt * 0.18;
    innerCore.rotation.y -= dt * 0.7;
    shell.rotation.y -= dt * 0.3;
    halo.rotation.y += dt * 0.15;
    const pulse = 0.85 + Math.sin(time * 3) * 0.15;
    // Molten inner core breathes (brighter + swelling as it charges an attack).
    innerCore.scale.setScalar(1 + Math.sin(time * 4) * 0.08 + charge * 0.35);
    innerMat.opacity = (0.7 + Math.sin(time * 5) * 0.2) * pulse + charge * 0.3;
    // Fresnel shells pulse their rim strength (and flare hot on a charge).
    shellMat.uniforms.uStrength.value = 1.0 + Math.sin(time * 2.4) * 0.25 + charge * 0.8;
    haloMat.uniforms.uStrength.value = 0.5 + Math.abs(Math.sin(time * 1.7)) * 0.2 + charge * 0.4;
    mawMat.opacity = 0.6 + Math.sin(time * 5) * 0.25 + charge * 0.9;
    throat.scale.setScalar(1 + charge * 0.6);
    throatMat.opacity = 0.85 + charge * 0.15;
    throatMat.color.setHex(0xff2b6a).lerp(new THREE.Color(accent), 1 - charge); // magenta-hot as it charges
    coreMat.emissiveIntensity = 1.5 + charge * 1.8;
    for (const o of orbiters) {
      const u = o.userData;
      u.ang += dt * u.speed;
      o.position.set(
        Math.cos(u.ang) * u.radius,
        u.baseY + Math.sin(time * 1.6 + u.tilt) * 0.5,
        Math.sin(u.ang) * u.radius
      );
      o.rotation.x += dt * 2;
      o.rotation.y += dt * 1.4;
    }
  }

  // A front-facing node so FX (and future muzzle flashes) can originate at the maw.
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0, 2.4);
  group.add(muzzle);

  return {
    group, muzzle, orbiters,
    setDissolve: kit.setDissolve,
    setCharge,
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible,
    shatterShield: kit.shatterShield,
    flash: kit.flash,
    // Write order matters: body tick() writes coreMat.emissiveIntensity from
    // `charge` first, then kit.tickCommon runs its flash decay LAST (inside
    // tickCommon) so a hit flash always wins over the charge flare on the same
    // frame — identical to the original single-function tick's line order.
    tick(dt, time) { tick(dt, time); kit.tickCommon(dt, time); },
    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    },
  };
}
