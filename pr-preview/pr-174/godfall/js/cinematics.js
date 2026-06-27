// Cinematic moments: boss intro, phase walls, the execution finisher, hero
// death. Each is a small parametric sequence that takes the camera (cine
// mode), drives the global cine time-scale, and ALWAYS cleans up through the
// same path — skip and natural completion are the same code, so control
// handback can never soft-lock.

import * as THREE from 'three';
import { cam } from './camera.js';
import { hero } from './hero.js';
import { boss, nodeWorld } from './boss.js';
import { shell } from './shell.js';
import { game } from './state.js';
import { save, persist } from './save.js';
import { emit } from './events.js';
import { sfx, buzz } from './sfx.js';
import { music } from './music.js';
import { flashWhite } from './postfx.js';
import { warpBurst, dissolveStream, blastRing } from './particles.js';
import { clamp, easeInOut, TAU } from './util.js';

export let cineTimeScale = 1;

let seq = null;          // { t, dur, update, end, skippable }
let resolveFn = null;
let prevState = '';

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _from = new THREE.Vector3();
const _to = new THREE.Vector3();

export function cinematicActive() { return !!seq; }

export function updateCinematics(rawDt) {
  if (!seq) return;
  seq.t += rawDt;
  seq.update(clamp(seq.t / seq.dur, 0, 1), rawDt);
  if (seq.t >= seq.dur) finish();
}

export function skipCinematic() {
  if (seq && seq.skippable) finish();
}

function finish() {
  const s = seq;
  seq = null;
  cineTimeScale = 1;
  emit('letterbox', { on: false });
  if (s && s.end) s.end();
  cam.setMode('shell');
  if (resolveFn) {
    const r = resolveFn;
    resolveFn = null;
    r();
  }
}

function start(s, { skippable = false } = {}) {
  prevState = game.state;
  game.set('cinematic');
  seq = { t: 0, skippable, ...s };
  cam.setMode('cine');
  emit('letterbox', { on: true });
  return new Promise((res) => { resolveFn = res; });
}

// Camera helper: orbit the boss at given height/radius fractions.
function orbitCam(angle, radius, height, lookY) {
  _pos.set(
    shell.center.x + Math.sin(angle) * radius,
    height,
    shell.center.z + Math.cos(angle) * radius
  );
  _look.copy(shell.center);
  _look.y = lookY;
  cam.setCine(_pos, _look);
}

// --- Boss intro -----------------------------------------------------------------

export function playIntro(def) {
  const seen = !!save.flags.seenCine[def.id + ':intro'];
  save.flags.seenCine[def.id + ':intro'] = true;
  persist();
  let roared = false;
  emit('bossTitle', { name: def.name, title: def.title, show: true });
  const baseAngle = hero.theta + Math.PI * 0.7;
  return start({
    dur: 4.4,
    update(k) {
      cineTimeScale = 0.55;
      // Sweep: wide and high, falling toward the hero's shoulder.
      const a = baseAngle - k * 1.1;
      const r = shell.radius + 26 - k * 18;
      const h = shell.hMax + 14 - k * (shell.hMax + 6 - hero.h);
      orbitCam(a, r, h, boss.aimPoint.y * (0.6 + k * 0.4));
      if (k > 0.35 && !roared) {
        roared = true;
        sfx.roar(def.id);
        cam.shake(0.5);
        buzz([20, 50, 40]);
      }
    },
    end() {
      emit('bossTitle', { show: false });
    },
  }, { skippable: seen });
}

// --- Phase wall -------------------------------------------------------------------

export function playPhaseWall(def, phase) {
  const key = `${def.id}:p${phase}`;
  const seen = !!save.flags.seenCine[key];
  save.flags.seenCine[key] = true;
  persist();
  const banner = def.cine.phaseBanners[phase - 2] || 'IT RAGES';
  let stung = false;
  let roared = false;
  const a0 = hero.theta;
  return start({
    dur: 3.4,
    update(k) {
      cineTimeScale = 0.3;
      const a = a0 + k * 0.5;
      const r = shell.radius - 6 - k * 6;
      orbitCam(a, r, boss.aimPoint.y + 2 - k * 1.5, boss.aimPoint.y);
      if (!stung) {
        stung = true;
        music.phaseSting(phase - 1);
      }
      if (k > 0.3 && !roared) {
        roared = true;
        sfx.roar(def.id);
        cam.shake(0.65);
        buzz([30, 60, 60]);
        emit('banner', { text: banner, heavy: true });
        nodeWorld(def.shell.aimNode, _pos);
        blastRing(_pos, def.accentColor, { grow: 34, life: 0.9 });
      }
    },
    end() {},
  }, { skippable: seen });
}

// --- Finisher (the reward) -----------------------------------------------------------

export function playFinisher(def) {
  const nodes = def.cine.finisher.nodes;
  const color = def.cine.finisher.color;
  const strikes = nodes.map((n, i) => ({
    node: n,
    at: 0.8 + i * 0.85,            // sequence timing (real seconds)
    done: false,
  }));
  const dissolveAt = strikes[strikes.length - 1].at + 0.7;
  const DUR = dissolveAt + 3.4;
  let fanfared = false;
  const a0 = hero.theta + 0.4;
  let dissolving = false;
  const dissolveMats = [];

  hero.setArmiger(true, 1);
  hero.trailOn = false;

  return start({
    dur: DUR,
    update(k, rawDt) {
      const t = k * DUR;
      cineTimeScale = t < dissolveAt ? 0.25 : 0.6;
      // Slow 270° sweep around the kill.
      const a = a0 + (t / DUR) * TAU * 0.75;
      const r = shell.radius - 4 + Math.sin(t * 0.8) * 3;
      orbitCam(a, r, boss.aimPoint.y * 0.55 + 6 + Math.sin(t) * 1.5, boss.aimPoint.y * 0.7);

      for (let i = 0; i < strikes.length; i++) {
        const s = strikes[i];
        if (!s.done && t >= s.at) {
          s.done = true;
          nodeWorld(s.node, _to);
          // Hero blinks to the node and strikes — staccato executions.
          hero.root.position.copy(_to).addScaledVector(
            _from.copy(_to).sub(shell.center).normalize(), 2.2);
          hero.pos.copy(hero.root.position);
          hero.root.lookAt(_to);
          hero.play(i % 2 ? 'sword_2' : 'sword_1', 0.7);
          warpBurst(_to, color);
          blastRing(_to, color, { grow: 18, life: 0.5 });
          sfx.finisherBlow(i);
          flashWhite(i === strikes.length - 1 ? 0.9 : 0.25);
          cam.shake(0.5 + i * 0.1);
          buzz(30 + i * 8);
          emit('hitStop', { dur: 0.05 });
        }
      }

      if (t >= dissolveAt && !dissolving) {
        dissolving = true;
        sfx.bossDissolve();
        music.stop();
        // Collect materials for the burn-away.
        boss.built.root.traverse((o) => {
          if (o.material && !Array.isArray(o.material)) {
            o.material.transparent = true;
            dissolveMats.push(o.material);
          }
        });
        emit('banner', { text: 'GODFALL', gold: true });
      }
      if (dissolving) {
        const dk = clamp((t - dissolveAt) / 2.6, 0, 1);
        for (const m of dissolveMats) {
          m.opacity = 1 - dk;
          if (m.emissive) {
            m.emissive.setRGB(0.9, 0.95, 1);
            m.emissiveIntensity = dk * 3;
          }
        }
        dissolveStream(boss.aimPoint, color, 1.5 * (1 - dk * 0.5));
        if (!fanfared && dk > 0.25) {
          fanfared = true;
          music.victoryFanfare();
        }
      }
    },
    end() {
      if (boss.built) boss.built.root.visible = false;
      hero.setArmiger(false);
      hero.play('victory');
    },
  }, { skippable: false });
}

// --- Hero death --------------------------------------------------------------------

export function playDeath() {
  const a0 = hero.theta;
  return start({
    dur: 2.0,
    update(k) {
      cineTimeScale = 0.3;
      const a = a0 + k * 0.3;
      _pos.copy(hero.pos);
      _from.set(Math.sin(a + Math.PI), 0.3, Math.cos(a + Math.PI)).normalize();
      _pos.addScaledVector(_from, 8 - k * 2);
      _pos.y += 2 - k * 2.4;
      _look.copy(hero.pos);
      cam.setCine(_pos, _look);
    },
    end() {},
  }, { skippable: true });
}

export function restorePrevState() {
  return prevState;
}
