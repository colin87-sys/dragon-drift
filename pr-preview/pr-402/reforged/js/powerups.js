import * as THREE from 'three';
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { ui } from './ui.js';
import { sfx } from './sfx.js';
import { makeGlowTexture } from './util.js';          // kept: the ?skyforged=0 fallback orb still needs it
import { makeMarkerSurface, bakeGlowT, bakeFacetJitterPerTri } from './markerSurface.js';
import { burst } from './particles.js';
import { emit } from './events.js';

// Skyforged A/B kill-switch (same convention as obstacles.js): the premium Star Shard
// is ON by default; ?skyforged=0 falls back to the old sphere + additive glow sprite.
const _mkParams = (typeof window !== 'undefined' && window.location)
  ? new URLSearchParams(window.location.search) : new URLSearchParams();
const SKYFORGED = _mkParams.get('skyforged') !== '0';

let scene = null;
// Fallback (old orb) assets — only used when ?skyforged=0.
let geo = null;
let glowTex = null;
let coreMat = null;
// Skyforged Star Shard — shared geometry + material across all orbs (they pulse together,
// like the Windvault). Per-mesh: position, spin, and the collect scale-pop.
let shardGeo = null;
let shardMat = null;
const orbFlow = { value: 0 };   // per-role 0..1 heat driver (flow: the chain; global: a boost)
const orbTime = { value: 0 };   // shard idle shimmer clock (one write/frame)
const orbs = [];

// A faceted directional crystal (asymmetric bipyramid) pointing along the flight axis:
// the bright ice-white TIP at +z (toward the approaching player — the head-on beacon),
// the cold cyan tail trailing along travel. Radial girth ~1.0 so the head-on lit area +
// bloom footprint beat the old core sphere; ~1.8× axial. Non-indexed → flat facets.
function buildStarShard() {
  const K = 5, R = 1.0, ZTIP = 1.5, ZTAIL = 0.75;
  const eq = [];
  for (let k = 0; k < K; k++) { const a = (k / K) * Math.PI * 2; eq.push([Math.cos(a) * R, Math.sin(a) * R, 0]); }
  const tip = [0, 0, ZTIP], tail = [0, 0, -ZTAIL];
  const pos = [];
  const push = (v) => pos.push(v[0], v[1], v[2]);
  for (let k = 0; k < K; k++) {
    const kn = (k + 1) % K;
    push(eq[k]); push(eq[kn]); push(tip);    // toward the player (+z) — outward wound; DoubleSide anyway
    push(eq[kn]); push(eq[k]); push(tail);   // trailing tail (−z)
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  // glowT along z: tip(+z)=1 (hot ice-white), equator≈0.33, tail(−z)=0 (deep cyan).
  bakeGlowT(g, (x, y, z) => (z + ZTAIL) / (ZTIP + ZTAIL));
  bakeFacetJitterPerTri(g);                  // per-tri = per-facet on this bipyramid
  g.computeVertexNormals();                  // non-indexed → flat facets
  return g;
}

export function initPowerups(s) {
  scene = s;
  if (SKYFORGED) {
    shardGeo = buildStarShard();
    // Orb palette rides the shared Skyforged defaults (deep cyan → icy tip); a touch more
    // emissive since a shard is small and must pop head-on.
    shardMat = makeMarkerSurface({ flowRef: orbFlow, timeRef: orbTime, emissive: 2.0, side: THREE.DoubleSide });
  } else {
    geo = new THREE.SphereGeometry(0.75, 16, 12);
    glowTex = makeGlowTexture('80,170,255');
    coreMat = new THREE.MeshStandardMaterial({
      color: 0x66ccff, emissive: 0x2299ff, emissiveIntensity: 2.2, roughness: 0.18,
    });
  }
}

export function addOrb(p) {
  let mesh, glow = null;
  if (SKYFORGED) {
    mesh = new THREE.Mesh(shardGeo, shardMat);   // no additive sprite → one opaque draw, zero overdraw
    mesh.position.set(p.x, p.y, -p.dist);
  } else {
    mesh = new THREE.Mesh(geo, coreMat);
    mesh.position.set(p.x, p.y, -p.dist);
    glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    glow.scale.set(4.8, 4.8, 1);
    mesh.add(glow);
  }
  scene.add(mesh);
  orbs.push({ mesh, glow, dist: p.dist, x: p.x, y: p.y, collected: false, flash: 0, flow: !!p.flow, gate: !!p.gate });
}

export function updatePowerups(dt, player, time) {
  // Shard drivers (one write/frame): the idle shimmer clock, and the heat that makes the
  // shards breathe — ribbon orbs with the flow chain, all orbs hot while a boost is active.
  orbTime.value = time;
  orbFlow.value = game.canyonRun === 'flow'
    ? Math.min(1, game.flowChain / CONFIG.FLOW.chainCap)
    : (player.orbTimer > 0 ? 0.85 : 0.28);
  for (let i = orbs.length - 1; i >= 0; i--) {
    const o = orbs[i];
    if (o.dist < player.dist - CONFIG.cullBehind) { removeAt(i); continue; }
    if (!o.collected) {
      o.mesh.position.y = o.y + Math.sin(time * 2 + o.dist) * 0.5;
      if (o.glow) {
        const pulse = 4.5 + Math.sin(time * 4 + o.dist) * 0.9;   // fallback: additive sprite pulse
        o.glow.scale.set(pulse, pulse, 1);
      } else {
        o.mesh.rotation.z += dt * 1.6;                           // Star Shard: axial spin → facet shimmer (head-on motion)
      }

      // Swept capture on the frame we CROSS the orb's plane (lateral-only test), like
      // rings.js. A per-frame sphere test steps clean over a dead-centre orb at speed:
      // spine slipstream peaks ~135 m/s, and with the engine's 20fps rawDt floor that
      // is ~6.75m/frame — the nearest sample to the orb plane can sit 3.4m away, past
      // the 2.8m sphere, exactly on the weak-mobile devices we target.
      const dx = player.position.x - o.x;
      const dy = player.position.y - o.mesh.position.y;
      if (player.prevDist < o.dist && player.dist >= o.dist && dx * dx + dy * dy < 2.8 * 2.8) {
        o.collected = true;
        o.flash = 1;
        player.orbTimer = CONFIG.orbDuration;
        game.stamina = Math.min(CONFIG.staminaMax, game.stamina + CONFIG.orbStamina);
        game.speedOrbsCollected++;
        ui.orbFlash();
        sfx.orb();
        burst(o.mesh.position, 0x55ccff, { count: 22, speed: 14, size: 1.3 }); // carries the collect spark (was the sprite)
        emit('orb');
        // FLOW chain: a ribbon orb builds the chain (drives the slipstream) and pays a
        // climbing flow-local bonus (× chainMult × scoreMult; NOT × fever — no double-dip).
        if (o.flow && game.canyonRun === 'flow') {
          game.flowChain++;
          game.flowChainBest = Math.max(game.flowChainBest, game.flowChain);
          const chainMult = 1 + CONFIG.FLOW.chainStep * Math.min(game.flowChain, CONFIG.FLOW.chainCap);
          game.score += Math.round(CONFIG.FLOW.orbScore * chainMult * game.scoreMult * game.mods.score);
          emit('flowChain', { chain: game.flowChain, mult: chainMult });
        }
      } else if (o.flow && !o.gate && game.canyonRun === 'flow' && player.prevDist < o.dist && player.dist >= o.dist) {
        // Dropped a RIBBON orb (crossed its plane out of catch range): the chain HALVES —
        // the world eases back, the multiplier falls. Score/momentum cost only, never health.
        // The dead-centre GATE orb is exempt (o.gate): its ring's own miss is the hard reset,
        // so an edge-caught ring (2.8<d≤3.9: misses the orb, catches the ring) must not both
        // reward the catch AND halve the chain — contradictory feedback on marginal catches.
        o.collected = true; o.flash = 0.6;   // consume it + fizzle out (don't hang frozen)
        if (game.flowChain > 0) { game.flowChain = Math.floor(game.flowChain / 2); emit('flowChainDrop', { chain: game.flowChain }); }
      }
    } else if (o.flash > 0) {
      // Collect/miss flash. Fallback: the additive sprite blows out + fades. Shard (opaque,
      // can't fade opacity): a small, short scale-POP (≤~1.6×, ~0.15s) then vanish — the
      // burst() spark carries the rest. Never a big hot slab across the near plane.
      if (o.glow) {
        o.flash -= dt * 3;
        const k = Math.max(o.flash, 0);
        const s = 4.5 + (1 - k) * 14;
        o.glow.scale.set(s, s, 1);
        o.glow.material.opacity = k;
        o.mesh.scale.setScalar(Math.max(k, 0.001));
        if (k <= 0) o.mesh.visible = false;
      } else {
        o.flash -= dt * 6.5;                 // ~0.15s
        const k = Math.max(o.flash, 0);
        o.mesh.scale.setScalar(0.2 + k * 1.4);
        if (k <= 0) o.mesh.visible = false;
      }
    }
  }
}

function removeAt(i) {
  const o = orbs[i];
  scene.remove(o.mesh);
  if (o.glow) o.glow.material.dispose();   // shard shares one material — never disposed per-orb
  orbs.splice(i, 1);
}

export function orbCount() { return orbs.length; }

export function resetPowerups() {
  while (orbs.length) removeAt(orbs.length - 1);
}
