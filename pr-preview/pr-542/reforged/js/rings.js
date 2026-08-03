import * as THREE from 'three';
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { ui } from './ui.js';
import { sfx } from './sfx.js';
import { burst, ringBurst } from './particles.js';
import { driftPerfectRadius, driftValue, driftEnabled } from './drift.js';
import { comboTier } from './util.js';
import { emit } from './events.js';
import { juiceEvent } from './juice.js';
import { makeMarkerSurface, facetHash } from './markerSurface.js';

// Skyforged A/B kill-switch (same convention as obstacles.js / powerups.js): the premium
// Jade Annulus is ON by default; ?skyforged=0 falls back to the exact shipped torus ring.
const _mkParams = (typeof window !== 'undefined' && window.location)
  ? new URLSearchParams(window.location.search) : new URLSearchParams();
const SKYFORGED = _mkParams.get('skyforged') !== '0';

// Jade palette — the ring keeps its GREEN catch identity (green = catch, cyan = flow/speed);
// family coherence comes from the shared VALUE grammar (near-black body, deep→mid→icy-hot ramp,
// fresnel, facetJ, glint), not hue. Mid is the shipped catch green players know.
const JADE_ROOT = 0x0b7a4e;  // deep jade — the outer girdle (glowT 0)
const JADE_MID = 0x3dff8f;   // the shipped catch green
const JADE_APEX = 0xdcffe8;  // icy mint-white — the hot INNER lip outlining the aperture (glowT 1)

const tmpV = new THREE.Vector3();
let scene = null;
let geo = null;        // fallback torus
let jadeGeo = null;    // Skyforged gem-cut annulus (shared across all rings)
const ringFlow = { value: 0 }; // shared per-ROLE heat (fever / combo / flow chain) — one write/frame
const ringTime = { value: 0 }; // shared idle-shimmer clock
const rings = [];

// A gem-cut faceted annulus: a hand-rolled sweep (the Windvault builder pattern — NOT a low-seg
// torus "faceted donut", NOT LatheGeometry) of a 6-point asymmetric bevel cross-section around the
// ring circle. Broad FRONT crown bevels (the +z head-on face), a thin HOT inner lip at min radius
// (glowT=1, outlines the aperture), a deep outer girdle (glowT=0). Circular silhouette held (~20
// segments → sub-pixel sagitta at 34m) with facets wide enough (~1.1m) to survive bloom + catch the
// glint. Aperture affordance preserved: inner lip ≈ Rc−tube ≈ 3.2, outer ≈ Rc+tube ≈ 4.0 (the
// shipped torus span), so "inside the glass = caught" (ringCatchRadius) still reads true.
function buildJadeAnnulus() {
  const Rc = CONFIG.ringRadius, N = 20, tube = 0.38;
  const prof = [                          // (dr, dz) cross-section, CCW in the radial–z plane
    [-tube, 0.0],                          // 0 inner lip (hot, min R)
    [-0.4 * tube, 0.72 * tube],            // 1 front-inner bevel (+z crown)
    [0.4 * tube, 0.72 * tube],             // 2 front-outer bevel (+z crown)
    [tube, 0.0],                           // 3 outer girdle (cold, max R)
    [0.4 * tube, -0.72 * tube],            // 4 back-outer bevel
    [-0.4 * tube, -0.72 * tube],           // 5 back-inner bevel
  ];
  const minR = Rc - tube, maxR = Rc + tube, P = prof.length;
  const gAt = (dr) => Math.max(0, Math.min(1, (maxR - (Rc + dr)) / (maxR - minR))); // outer 0 → inner 1
  const vert = (th, dr, dz) => { const r = Rc + dr; return [r * Math.cos(th), r * Math.sin(th), dz]; };
  const pos = [], gt = [], fj = [];
  const tri = (a, b, c, ga, gb, gc, f) => { pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); gt.push(ga, gb, gc); fj.push(f, f, f); };
  for (let s = 0; s < N; s++) {
    const t0 = (s / N) * Math.PI * 2, t1 = ((s + 1) / N) * Math.PI * 2;
    for (let p = 0; p < P; p++) {
      const pn = (p + 1) % P;
      const a = vert(t0, prof[p][0], prof[p][1]), b = vert(t1, prof[p][0], prof[p][1]);
      const c = vert(t1, prof[pn][0], prof[pn][1]), d = vert(t0, prof[pn][0], prof[pn][1]);
      const ga = gAt(prof[p][0]), gc = gAt(prof[pn][0]);
      const f = facetHash(p * N + s);      // per-QUAD facet id (both tris share it)
      tri(a, b, c, ga, ga, gc, f);
      tri(a, c, d, ga, gc, gc, f);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('glowT', new THREE.Float32BufferAttribute(gt, 1));
  g.setAttribute('facetJ', new THREE.Float32BufferAttribute(fj, 1));
  g.computeVertexNormals();               // non-indexed → flat facets
  return g;
}

export function initRings(s) {
  scene = s;
  geo = new THREE.TorusGeometry(CONFIG.ringRadius, 0.38, 14, 48); // fallback torus (also the ?skyforged=0 look)
  if (SKYFORGED) jadeGeo = buildJadeAnnulus();
}

export function addRing(p) {
  let mesh, uni = null;
  if (SKYFORGED) {
    // Factory-call PER INSTANCE — never a cloned material: r160 Material.copy JSON-kills the
    // uniform refs, so a cloned material would silently share one uniform set → the first gold tint
    // paints every ring). customProgramCacheKey still collapses them to ONE program. The
    // shared ringFlow/ringTime drivers are passed by reference; per-instance uniforms carry
    // only what differs (palette / gold / flash).
    const mat = makeMarkerSurface({
      rootColor: JADE_ROOT, midColor: JADE_MID, apexColor: JADE_APEX,
      flowRef: ringFlow, timeRef: ringTime, emissive: 1.8, side: THREE.DoubleSide,
      glint: 1.2, glintSharp: 40, lipGlow: 1.1, // always-hot inner aperture rim → reads at flight distance
    });
    mesh = new THREE.Mesh(jadeGeo, mat);
    uni = mat.userData.markerUniforms;
  } else {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3dff8f, emissive: 0x12c95e, emissiveIntensity: 1.8, transparent: true, roughness: 0.3,
    });
    mesh = new THREE.Mesh(geo, mat);
  }
  mesh.position.set(p.x, p.y, -p.dist);
  scene.add(mesh);
  rings.push({ mesh, uni, sky: SKYFORGED, dist: p.dist, x: p.x, y: p.y, collected: false, missed: false, flash: 0 });
}

export function updateRings(dt, player, time) {
  // Shared Jade drivers (one write/frame): the shimmer clock + the heat that lifts the ring's
  // designed hot path — fever pins it hot, else the higher of combo tier and the flow chain.
  // (Do NOT also write per-ring emissiveIntensity — that double-drives and whites out; D2.)
  if (SKYFORGED) {
    ringTime.value = time;
    const comboHeat = comboTier(game.combo) * 0.16;
    const flowHeat = game.canyonRun === 'flow' ? Math.min(1, game.flowChain / CONFIG.FLOW.chainCap) : 0;
    ringFlow.value = game.feverActive ? 1.0 : Math.min(1, Math.max(comboHeat, flowHeat));
  }
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    if (r.dist < player.dist - CONFIG.cullBehind) { removeAt(i); continue; }

    if (!r.collected && !r.missed) {
      if (r.sky) {
        // z-ROLL is the motion (a smooth torus's spin was a visual no-op; facets make it read,
        // and roll sweeps facet normals through the fixed glint → sparkle) + a small precession
        // GARNISH capped ≤0.08 rad so the aperture the player aims at never lies about itself.
        r.mesh.rotation.z += dt * 0.9;
        r.mesh.rotation.x = Math.sin(time * 0.7 + r.dist) * 0.08;
        r.mesh.rotation.y = Math.cos(time * 0.6 + r.dist) * 0.08;
        r.mesh.scale.setScalar(1 + Math.sin(time * 3 + r.dist) * 0.05 + (game.feverActive ? 0.08 : 0));
        // Fever shifts this ring's palette toward mint (bridges green→cyan); else jade. Per-instance.
        if (game.feverActive) { r.uni.uMid.value.setHex(0x80ffcc); r.uni.uApex.value.setHex(0xdcffe8); }
        else { r.uni.uMid.value.setHex(JADE_MID); r.uni.uApex.value.setHex(JADE_APEX); }
      } else {
        r.mesh.rotation.z = time * 0.6;
        // Rings glow brighter as the combo climbs; brightest during fever
        const feverGlow = game.feverActive ? 4.5 : 1.8 + comboTier(game.combo) * 0.4;
        r.mesh.material.emissiveIntensity = feverGlow;
        r.mesh.material.emissive.setHex(game.feverActive ? 0x80ffcc : 0x12c95e);
        r.mesh.scale.setScalar(1 + Math.sin(time * 3 + r.dist) * 0.05 + (game.feverActive ? 0.08 : 0));
      }

      // During a boss the rings are decorative motion only — collecting/missing is
      // disabled so the surge meter is driven purely by grazing bullets (and an
      // incidental fly-past can't reset the graze streak). See collision.bulletGraze.
      if (!game.inBoss && player.prevDist < r.dist && player.dist >= r.dist) {
        const d = Math.hypot(player.position.x - r.x, player.position.y - r.y);
        if (d <= CONFIG.ringCatchRadius) collect(r, d);
        else miss(r);
      }
    } else if (r.collected && r.flash > 0) {
      if (r.sky) {
        // Opaque gem: a small, hard-capped scale-POP (the ring surrounds the near plane at
        // collect, so keep it tighter than the shard) then vanish; ringBurst carries the
        // dissolve. Toggling `transparent` mid-run would compile a 2nd program variant (hitch).
        r.flash -= dt * 5.5;               // ~0.18s
        const k = Math.max(r.flash, 0);
        r.mesh.scale.setScalar(1 + (1 - k) * 0.35); // ≤1.35×
        if (k <= 0) r.mesh.visible = false;
      } else {
        r.flash -= dt * 2;
        const k = Math.max(r.flash, 0);
        r.mesh.scale.setScalar(1 + (1 - k) * 1.5);
        r.mesh.material.opacity = k;
        r.mesh.material.emissiveIntensity = 3;
        if (k <= 0) r.mesh.visible = false;
      }
    }
  }
}

function collect(r, centerDist) {
  r.collected = true;
  r.flash = 1;
  // §3.3: at DRIFT/slip speed the perfect bullseye half-compensates (spatial precision
  // at a deterministic crossing frame — geyser-law-clean). Shipped 1.4 when drift is off.
  const perfect = centerDist <= driftPerfectRadius();

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

  // Perfect rings flash GOLD. The update loop skips collected rings, so writing the palette
  // once here persists through the flash. Skyforged: the per-instance palette uniforms;
  // fallback: the mesh material color/emissive (the shipped path).
  if (perfect) {
    if (r.sky) { r.uni.uMid.value.setHex(0xffd86a); r.uni.uApex.value.setHex(0xfff0c0); }
    else { r.mesh.material.color.setHex(0xffd86a); r.mesh.material.emissive.setHex(0xffaa22); }
  }
  tmpV.set(r.x, r.y, -r.dist);
  ringBurst(tmpV, perfect);
  // Skyforged: an extra spark carries the dissolve the shortened opaque pop can't (flag-gated,
  // so the ?skyforged=0 collect stays byte-identical).
  if (r.sky) burst(tmpV, perfect ? 0xffd86a : 0x3dff8f, { count: 14, speed: 12, size: 1.0 });
  emit('ring', { perfect });
  // FLOW chain: catching a light-gate (the ring) builds the chain — +2, +1 more on a
  // perfect (the perfect-ring pop). The gates are the slalom's nodes.
  if (game.canyonRun === 'flow') {
    game.flowChain += perfect ? 3 : 2;
    game.flowChainBest = Math.max(game.flowChainBest, game.flowChain);
    emit('flowChain', { chain: game.flowChain, mult: driftEnabled()
      ? 1 + CONFIG.DRIFT.overdriveScoreStep * driftValue()
      : 1 + CONFIG.FLOW.chainStep * Math.min(game.flowChain, CONFIG.FLOW.chainCap) });
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
  r.mesh.material.dispose();   // per-instance material (factory or fallback) — correct either way
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
