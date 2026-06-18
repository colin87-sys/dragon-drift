// Attack volumes: every boss attack is one or more volumes with a lifecycle
// delay → warn → active → done. Three of the four kinds are authored in shell
// space, so the warning drawn on the shell IS the hitbox — fairness by
// construction. updateVolumes() advances states, animates the pooled
// visuals, and returns damage events for any volume overlapping the hero.
//
//   arc  — curved band {thetaCenter, thetaSpan, hBand, rBand} (sweep optional)
//   zone — same geometry, persistent, ticks damage while stood in
//   point— locked shell point, sphere burst (reticle ring shrinks onto it)
//   projectile — world-space flying sphere (aimed at a locked shell point)
//   beam — world-space capsule between two animated endpoints

import * as THREE from 'three';
import { shell } from './shell.js';
import { angleDelta, texHalo, texSigil, texFlare, TAU, clamp } from './util.js';
import { sfx } from './sfx.js';

let scene = null;
const volumes = [];

// --- Arc ribbon material (shared template, cloned per mesh) -----------------

const arcMatTemplate = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  uniforms: {
    color: { value: new THREE.Color(0xff8040) },
    progress: { value: 0 },  // 0..1 across the warn phase
    active: { value: 0 },    // 1 while striking
    time: { value: 0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 color;
    uniform float progress, active, time;
    varying vec2 vUv;
    void main() {
      float edge = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
      float frame = 1.0 - edge;                  // bright rim top/bottom
      float pulse = 0.55 + 0.45 * sin(time * (6.0 + progress * 10.0));
      float fill = 0.05 + progress * 0.16 * pulse;
      float a = frame * (0.25 + progress * 0.5) + fill;
      a = mix(a, 0.85, active);
      gl_FragColor = vec4(color * (1.0 + active * 1.6), a);
    }`,
});

const arcGeoCache = new Map();
function arcGeometry(span) {
  const key = Math.round(span * 100);
  let g = arcGeoCache.get(key);
  if (!g) {
    g = new THREE.CylinderGeometry(1, 1, 1, Math.max(12, Math.round(span * 14)), 1, true, -span / 2, span);
    arcGeoCache.set(key, g);
  }
  return g;
}

// --- Pools ------------------------------------------------------------------

let haloTex = null, sigilTex = null, flareTex = null;

function makeSprite(tex, color) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  sp.material.color.setHex(color);
  sp.visible = false;
  scene.add(sp);
  return sp;
}

export function initTelegraphs(s) {
  scene = s;
  haloTex = texHalo();
  sigilTex = texSigil();
  flareTex = texFlare('255,210,160');
}

export function clearVolumes() {
  for (const v of volumes) releaseVisuals(v);
  volumes.length = 0;
}

function releaseVisuals(v) {
  if (v.mesh) {
    scene.remove(v.mesh);
    v.mesh.material.dispose();
    v.mesh = null;
  }
  for (const key of ['ringSprite', 'sigilSprite', 'flareSprite']) {
    if (v[key]) {
      scene.remove(v[key]);
      v[key].material.dispose();
      v[key] = null;
    }
  }
}

// --- Spawning -----------------------------------------------------------------

// Common spec fields: { kind, delay=0, warn, active, dmg, knockback=8,
//   weight='light'|'heavy'|'spectacle', color, warnSfx, onActive, onDone, id }
export function spawnVolume(spec) {
  const v = {
    delay: 0, warn: 0.8, active: 0.25, dmg: 10, knockback: 8,
    weight: 'light', color: 0xff8040, tick: 0, _hitClock: -1, _warned: false,
    state: 'delay', t: 0, ...spec,
  };
  volumes.push(v);
  return v;
}

function buildVisuals(v) {
  if (v.kind === 'arc' || v.kind === 'zone') {
    const mat = arcMatTemplate.clone();
    mat.uniforms.color.value.setHex(v.color);
    const mesh = new THREE.Mesh(arcGeometry(v.thetaSpan), mat);
    mesh.frustumCulled = false;
    v.mesh = mesh;
    scene.add(mesh);
  } else if (v.kind === 'point') {
    v.ringSprite = makeSprite(haloTex, v.color);
    v.sigilSprite = makeSprite(sigilTex, v.color);
    if (v.column) {
      // Vertical strike column (lightning, divine judgement...)
      const mat = new THREE.MeshBasicMaterial({
        color: v.color, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      v.mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 7, 1, true), mat);
      v.mesh.frustumCulled = false;
      scene.add(v.mesh);
    }
  } else if (v.kind === 'projectile') {
    v.flareSprite = makeSprite(flareTex, v.color);
  } else if (v.kind === 'beam') {
    const mat = new THREE.MeshBasicMaterial({
      color: v.color, transparent: true, opacity: 0.25,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8, 1, true), mat);
    mesh.frustumCulled = false;
    v.mesh = mesh;
    scene.add(mesh);
  }
}

// --- Per-kind update & test ---------------------------------------------------

const _p = new THREE.Vector3();
const _q = new THREE.Vector3();
const _seg = new THREE.Vector3();

function placeArc(v) {
  const m = v.mesh;
  if (!m) return;
  const r = (v.rBand[0] + v.rBand[1]) / 2;
  const h0 = v.hBand[0], h1 = v.hBand[1];
  m.scale.set(r, Math.max(h1 - h0, 0.5), r);
  m.position.set(shell.center.x, (h0 + h1) / 2, shell.center.z);
  m.rotation.y = v.thetaCenter;
}

function testArc(v, heroShell) {
  if (Math.abs(angleDelta(v.thetaCenter, heroShell.theta)) > v.thetaSpan / 2) return false;
  if (heroShell.h < v.hBand[0] || heroShell.h > v.hBand[1]) return false;
  const r = heroShell.r;
  return r >= v.rBand[0] && r <= v.rBand[1];
}

function placePoint(v, k) {
  shell.worldPos(v.theta, v.h, v.r ?? shell.radius, _p);
  if (v.column && v.mesh) {
    const active = v.state === 'active';
    const topY = _p.y + 34;
    v.mesh.scale.set(active ? v.radius * 0.55 : 0.12, topY - _p.y, active ? v.radius * 0.55 : 0.12);
    v.mesh.position.set(_p.x, (_p.y + topY) / 2, _p.z);
    v.mesh.material.opacity = active ? 0.9 : 0.1 + k * 0.2;
  }
  if (v.ringSprite) {
    v.ringSprite.visible = true;
    v.ringSprite.position.copy(_p);
    const s = v.radius * (4 - 3 * k) * 2;
    v.ringSprite.scale.set(s, s, 1);
    v.ringSprite.material.opacity = 0.25 + k * 0.6;
  }
  if (v.sigilSprite) {
    v.sigilSprite.visible = true;
    v.sigilSprite.position.copy(_p);
    const s2 = v.radius * 1.7;
    v.sigilSprite.scale.set(s2, s2, 1);
    v.sigilSprite.material.opacity = 0.3 + k * 0.55;
    v.sigilSprite.material.rotation += 0.02;
  }
}

function testPoint(v, heroState) {
  shell.worldPos(v.theta, v.h, v.r ?? shell.radius, _p);
  return _p.distanceTo(heroState.pos) < v.radius + heroState.radius;
}

function updateProjectile(v, dt) {
  if (!v._launched) {
    v._launched = true;
    v.pos = v.from.clone();
    shell.worldPos(v.targetTheta, v.targetH, v.targetR ?? shell.radius, _p);
    v.vel = _p.clone().sub(v.pos).normalize().multiplyScalar(v.speed);
    v.lifeT = (v.pos.distanceTo(_p) / v.speed) * 1.45;
  }
  v.pos.addScaledVector(v.vel, dt);
  v.lifeT -= dt;
  if (v.flareSprite) {
    v.flareSprite.visible = true;
    v.flareSprite.position.copy(v.pos);
    const s = v.radius * 3.4;
    v.flareSprite.scale.set(s, s, 1);
    v.flareSprite.material.opacity = 0.95;
  }
  return v.lifeT <= 0;
}

function placeBeam(v, k, time) {
  v.getFrom(_p);
  v.getTo(_q, k);
  const m = v.mesh;
  if (!m) return;
  _seg.copy(_q).sub(_p);
  const len = _seg.length();
  m.scale.set(v.radiusVis ?? v.radius, len, v.radiusVis ?? v.radius);
  m.position.copy(_p).addScaledVector(_seg, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _seg.normalize());
  const activeNow = v.state === 'active';
  m.material.opacity = activeNow ? 0.85 : 0.16 + 0.12 * Math.sin(time * 9);
  m.scale.x = m.scale.z = (v.radius) * (activeNow ? 1 : 0.25);
}

function testBeam(v, heroState, k) {
  v.getFrom(_p);
  v.getTo(_q, k);
  // Point-to-segment distance
  _seg.copy(_q).sub(_p);
  const segLen2 = _seg.lengthSq();
  let t = 0;
  if (segLen2 > 1e-6) {
    t = clamp(heroState.pos.clone().sub(_p).dot(_seg) / segLen2, 0, 1);
  }
  _q.copy(_p).addScaledVector(_seg, t);
  return _q.distanceTo(heroState.pos) < v.radius + heroState.radius;
}

// --- Main update ----------------------------------------------------------------
// Returns an array of hit events { dmg, knockback, weight, source } for combat.

export function updateVolumes(dt, time, heroState) {
  const hits = [];
  for (let i = volumes.length - 1; i >= 0; i--) {
    const v = volumes[i];
    v.t += dt;

    if (v.state === 'delay') {
      if (v.t >= (v.delay || 0)) {
        v.state = 'warn';
        v.t = 0;
        // Hero-aimed shapes lock their target the moment the warning shows —
        // never earlier (stale = unfair) and never after (undodgeable).
        if (v.followHero) {
          const hs = heroState.shell;
          // `lead` aims ahead along the hero's current velocity — punishes
          // mindless constant strafing without ever being unfair (the mark
          // still shows for the full warn).
          const dTheta = (v.thetaOffset || 0) + (v.lead ? hs.omega * v.lead : 0);
          const dH = (v.hOffset || 0) + (v.lead ? hs.vh * v.lead * 0.7 : 0);
          if (v.kind === 'point') {
            v.theta = hs.theta + dTheta;
            v.h = clamp(hs.h + dH, shell.hMin, shell.hMax);
          } else if (v.kind === 'projectile') {
            v.targetTheta = hs.theta + dTheta;
            v.targetH = clamp(hs.h + dH, shell.hMin, shell.hMax);
          } else if (v.kind === 'arc' || v.kind === 'zone') {
            v.thetaCenter = hs.theta + dTheta;
          }
        }
        buildVisuals(v);
        if (v.warnSfx && sfx[v.warnSfx]) sfx[v.warnSfx]();
      } else continue;
    }

    if (v.state === 'warn') {
      const k = clamp(v.t / Math.max(v.warn, 1e-3), 0, 1);
      if (v.kind === 'arc' || v.kind === 'zone') {
        placeArc(v);
        if (v.mesh) {
          v.mesh.material.uniforms.progress.value = k;
          v.mesh.material.uniforms.time.value = time;
        }
      } else if (v.kind === 'point') {
        placePoint(v, k);
      } else if (v.kind === 'beam') {
        placeBeam(v, 0, time);
      } else if (v.kind === 'projectile') {
        // Projectiles launch immediately after their delay; the reticle that
        // warned the player is a separate 'point' volume.
        v.state = 'active';
        v.t = 0;
      }
      if (v.state === 'warn' && v.t >= v.warn) {
        v.state = 'active';
        v.t = 0;
        v._hitClock = -1;
        if (v.onActive) v.onActive(v);
      } else if (v.state === 'warn') continue;
    }

    if (v.state === 'active') {
      const k = clamp(v.t / Math.max(v.active, 1e-3), 0, 1);
      let inside = false;
      let done = false;

      if (v.kind === 'arc' || v.kind === 'zone') {
        if (v.sweep) v.thetaCenter += v.sweep * dt;
        placeArc(v);
        if (v.mesh) {
          v.mesh.material.uniforms.active.value = v.kind === 'arc' ? 1 - k * 0.6 : 1;
          v.mesh.material.uniforms.progress.value = 1;
          v.mesh.material.uniforms.time.value = time;
        }
        inside = testArc(v, heroState.shell);
      } else if (v.kind === 'point') {
        placePoint(v, 1);
        if (v.ringSprite) v.ringSprite.material.opacity = 0.9 * (1 - k);
        inside = testPoint(v, heroState);
      } else if (v.kind === 'projectile') {
        done = updateProjectile(v, dt);
        inside = v.pos && v.pos.distanceTo(heroState.pos) < v.radius + heroState.radius;
        if (inside) done = true;
      } else if (v.kind === 'beam') {
        placeBeam(v, k, time);
        inside = testBeam(v, heroState, k);
      }

      if (inside && !heroState.invulnerable && v.dmg > 0) {
        const tickGap = v.tick || 0;
        if (v._hitClock < 0 || (tickGap > 0 && v.t - v._hitClock >= tickGap)) {
          v._hitClock = v.t;
          hits.push({ dmg: v.dmg, knockback: v.knockback, weight: v.weight, source: v.id || v.kind, vol: v });
          if (tickGap === 0 && v.kind !== 'zone') {
            // single-hit volumes stop testing once they've connected
            v._hitClock = Infinity;
          }
        }
      }

      if (v.kind !== 'projectile' && v.t >= v.active) done = true;
      if (done) {
        v.state = 'done';
        releaseVisuals(v);
        if (v.onDone) v.onDone(v);
        volumes.splice(i, 1);
      }
    }
  }
  return hits;
}

// How soon the nearest threatening volume will strike the hero's current
// position — perfect-dodge detection (dodging within the window = perfect).
export function imminentThreat(heroState, horizon = 0.25) {
  let soonest = Infinity;
  for (const v of volumes) {
    if (v.state === 'warn') {
      const eta = v.warn - v.t;
      if (eta > horizon) continue;
      let threatens = false;
      if (v.kind === 'arc' || v.kind === 'zone') threatens = testArc(v, heroState.shell);
      else if (v.kind === 'point') threatens = testPoint(v, heroState);
      else if (v.kind === 'beam') threatens = testBeam(v, heroState, 0);
      if (threatens) soonest = Math.min(soonest, eta);
    } else if (v.state === 'active' && v.kind === 'projectile' && v.pos) {
      const d = v.pos.distanceTo(heroState.pos);
      const eta = d / Math.max(v.speed, 1);
      if (eta < horizon) soonest = Math.min(soonest, eta);
    }
  }
  return soonest;
}

export function activeVolumeCount() { return volumes.length; }
