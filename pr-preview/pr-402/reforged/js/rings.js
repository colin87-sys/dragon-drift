import * as THREE from 'three';
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { ui } from './ui.js';
import { sfx } from './sfx.js';
import { burst, ringBurst } from './particles.js';
import { comboTier } from './util.js';
import { emit } from './events.js';
import { juiceEvent } from './juice.js';

const tmpV = new THREE.Vector3();
let scene = null;
let geo = null;
const rings = [];

export function initRings(s) {
  scene = s;
  geo = new THREE.TorusGeometry(CONFIG.ringRadius, 0.38, 14, 48);
}

export function addRing(p) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x3dff8f,
    emissive: 0x12c95e,
    emissiveIntensity: 1.8,
    transparent: true,
    roughness: 0.3,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(p.x, p.y, -p.dist);
  scene.add(mesh);
  rings.push({ mesh, dist: p.dist, x: p.x, y: p.y, collected: false, missed: false, flash: 0 });
}

export function updateRings(dt, player, time) {
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    if (r.dist < player.dist - CONFIG.cullBehind) { removeAt(i); continue; }

    if (!r.collected && !r.missed) {
      r.mesh.rotation.z = time * 0.6;

      // Rings glow brighter as the combo climbs; brightest during fever
      const feverGlow = game.feverActive ? 4.5 : 1.8 + comboTier(game.combo) * 0.4;
      r.mesh.material.emissiveIntensity = feverGlow;
      r.mesh.material.emissive.setHex(game.feverActive ? 0x80ffcc : 0x12c95e);
      r.mesh.scale.setScalar(1 + Math.sin(time * 3 + r.dist) * 0.05 + (game.feverActive ? 0.08 : 0));

      // During a boss the rings are decorative motion only — collecting/missing is
      // disabled so the surge meter is driven purely by grazing bullets (and an
      // incidental fly-past can't reset the graze streak). See collision.bulletGraze.
      if (!game.inBoss && player.prevDist < r.dist && player.dist >= r.dist) {
        const d = Math.hypot(player.position.x - r.x, player.position.y - r.y);
        if (d <= CONFIG.ringCatchRadius) collect(r, d);
        else miss(r);
      }
    } else if (r.collected && r.flash > 0) {
      r.flash -= dt * 2;
      const k = Math.max(r.flash, 0);
      r.mesh.scale.setScalar(1 + (1 - k) * 1.5);
      r.mesh.material.opacity = k;
      r.mesh.material.emissiveIntensity = 3;
      if (k <= 0) r.mesh.visible = false;
    }
  }
}

function collect(r, centerDist) {
  r.collected = true;
  r.flash = 1;
  const perfect = centerDist <= CONFIG.ringCenterRadius;

  // Fever extends its own duration when a ring is collected
  if (game.feverActive) {
    game.feverTimer = Math.min(game.feverTimer + 1.2, CONFIG.feverDuration);
  }

  const feverBonus = game.feverActive ? CONFIG.feverMultiplier : 1;
  // Daily mods: "Sharpshooter" boosts the perfect bonus; "Hot Streak" boosts all points.
  const points = Math.round(
    (CONFIG.ringScore * game.combo * feverBonus + (perfect ? CONFIG.ringCenterBonus * game.mods.perfect : 0))
    * game.scoreMult * game.mods.score
  );
  game.score += points;
  game.ringsCollected++;
  // Perfect streak: consecutive center hits climb a chime ladder and flash
  // gold — the audio/visual reward that makes hunting the bullseye addictive.
  if (perfect) {
    game.perfectRings++;
    game.perfectStreak++;
  } else {
    game.perfectStreak = 0;
  }
  game.consecutiveRings++;
  const tierBefore = comboTier(game.combo);
  game.combo = Math.min(CONFIG.comboMax, game.combo + CONFIG.comboStep);
  game.maxCombo = Math.max(game.maxCombo, game.combo);
  // Perfect rings refund extra stamina — the skill-reward that meaningfully
  // extends boost, where a normal ring only chips in.
  game.stamina = Math.min(CONFIG.staminaMax,
    game.stamina + CONFIG.ringStamina + (perfect ? CONFIG.perfectRingStaminaBonus : 0));
  ui.ringPopup(points, perfect, game.perfectStreak);
  if (perfect) {
    sfx.perfect(game.perfectStreak);
    ui.perfectFlash();
    // Impact frames: a micro-stop on every perfect, the full stop + gold
    // flash-frame on streak milestones (5, 10, 15…) — peak juice stays rare.
    juiceEvent(game.perfectStreak > 0 && game.perfectStreak % 5 === 0
      ? 'perfectMilestone' : 'perfect');
  } else {
    sfx.ring(game.combo);
  }

  // Perfect rings flash GOLD: tint the mesh itself for the flash-out
  // animation (updateRings stops re-setting emissive once collected).
  if (perfect) {
    r.mesh.material.color.setHex(0xffd86a);
    r.mesh.material.emissive.setHex(0xffaa22);
  }
  tmpV.set(r.x, r.y, -r.dist);
  ringBurst(tmpV, perfect);
  emit('ring', { perfect });
  // FLOW chain: catching a light-gate (the ring) builds the chain — +2, +1 more on a
  // perfect (the perfect-ring pop). The gates are the slalom's nodes.
  if (game.canyonRun === 'flow') {
    game.flowChain += perfect ? 3 : 2;
    game.flowChainBest = Math.max(game.flowChainBest, game.flowChain);
    emit('flowChain', { chain: game.flowChain, mult: 1 + CONFIG.FLOW.chainStep * Math.min(game.flowChain, CONFIG.FLOW.chainCap) });
  }
  const tierAfter = comboTier(game.combo);
  if (tierAfter > tierBefore) sfx.comboUp(tierAfter);

  // Check fever threshold
  if (!game.feverActive && game.consecutiveRings >= game.feverThreshold) {
    game.feverActive = true;
    game.feverTimer = CONFIG.feverDuration;
    game.markSurgeSeen();
    ui.feverStart();
    sfx.feverStart();
    burst(tmpV, 0xff88ff, { count: 30, speed: 16, size: 1.3 });
    juiceEvent('surgeStart');
    emit('surge');
  }
}

function miss(r) {
  r.missed = true;
  game.consecutiveRings = 0;
  game.perfectStreak = 0;
  if (game.feverActive) { game.feverActive = false; game.feverTimer = 0; }
  if (game.combo > 1) {
    ui.comboBreak();
    sfx.comboBreak();
    juiceEvent('comboBreak'); // desat dip — losing the streak should sting
  }
  game.combo = 1;
  // FLOW chain: missing a gate is the HARD reset — the chain (and its slipstream) drop to
  // zero. The gate is the line; lose it and you lose the flow. Score/momentum, never health.
  if (game.canyonRun === 'flow' && game.flowChain > 0) { game.flowChain = 0; emit('flowChainDrop', { chain: 0 }); }
  emit('ringMiss');
}

function removeAt(i) {
  const r = rings[i];
  scene.remove(r.mesh);
  r.mesh.material.dispose();
  rings.splice(i, 1);
}

export function ringCount() { return rings.length; }

// First live ring ahead of a distance (reticle target). Rings are stored in
// spawn order, which is ascending distance.
export function nextRingAhead(dist) {
  for (const r of rings) {
    if (!r.collected && !r.missed && r.dist > dist) return r;
  }
  return null;
}

export function resetRings() {
  while (rings.length) removeAt(rings.length - 1);
}

// Visual-only hide for the shop hero shot (NEVER removes — the run is untouched).
export function setRingsVisible(v) {
  for (const r of rings) if (r.mesh) r.mesh.visible = v;
}
