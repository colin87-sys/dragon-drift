import * as THREE from 'three';
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { hitPlayer, bulletGraze } from './collision.js';
import { burst } from './particles.js';
import { emit } from './events.js';

// Boss bullet pool — one InstancedMesh, recycled by the same windowed-cursor
// pattern as embers.js (one draw call regardless of count; cheap on mobile).
//
// Everything lives in the PLAYER-RELATIVE frame so it's correct no matter how
// fast forward flight is: a bullet's `rel` is how many metres AHEAD of the player
// it is. The boss holds at rel = settleGap and "flies backward" by staying there.
//   - owner 'boss'          → rel decreases toward 0 (the player's plane); a hit
//                             is the frame rel crosses 0 while x/y are close.
//   - owner 'rider'/'player'→ rel increases toward targetRel (the boss); arrival
//                             near the boss centre emits 'bossDamage'.
// Boss-bullet damage routes through collision.hitPlayer so it respects the same
// invuln + barrel-roll i-frames as every other hazard — dodging is free.

const POOL = CONFIG.BOSS.bulletPool;
const R = CONFIG.playerRadius;
const TIERS = CONFIG.BOSS.renderTiers;   // render-order law: nothing draws over a bullet

let mesh = null;       // colour body (soft round disc, per-bullet tint)
let coreMesh = null;   // white centre (colour-blind-safe read — everyone sees the dot)
let shadowMesh = null; // soft dark dot on the floor under each bullet (depth anchor)
let outlineMesh = null; // dark annulus UNDER the body — a two-way luminance edge
// (dark ring pops on bright skies, the white core pops on dark skies) so every
// bullet reads against every biome without leaning on hue alone (L102/L121).
let visibleCap = POOL;
let clock = 0;         // accumulates dt for the parry-window pulse

const GROUND_Y = 0.4;  // floor level the bullet shadows sit on
const WHITE = new THREE.Color(0xffffff);
const IDENTITY = new THREE.Quaternion();   // bullets are round → camera-facing quads, no spin
const SHADOW_QUAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
const shadowScl = new THREE.Vector3();
// Depth-ordering scratch (module-level — zero per-frame allocation, L on the
// "no allocations" render law): a neutral dim tone bullets fog toward as they
// spawn far out, and the fixed dark outline tint (baked per-instance since the
// outline MATERIAL colour is white — see makeOutlineTex/initBossBullets).
const FOG_DIM = new THREE.Color(0x555060);
const OUTLINE_TINT = new THREE.Color(0x140608);
const OUTLINE_FOG = new THREE.Color(0x808080);   // far bullets: the dark ring softens toward this
const coreColV = new THREE.Color();
const outlineColV = new THREE.Color();

// Procedural round-bullet texture: a soft radial disc (white core → soft edge →
// transparent). Grayscale so instanceColor tints the BODY while the white CORE
// layer stays white on top — the danmaku "white-centre coloured-rim" look.
function makeBulletTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.42, 'rgba(255,255,255,0.98)');
  gr.addColorStop(0.72, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// Annulus texture for the dark outline: transparent centre → soft ring peaking
// near r≈0.75 → fades back to transparent at the edge. Painted WHITE (alpha-only
// shape) so the actual near-black tint comes entirely from the per-instance
// colour (material.color stays white) — that's what lets 2.6a fade the ring
// toward a softer grey for distant bullets without fighting the texture.
function makeOutlineTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,0)');
  gr.addColorStop(0.55, 'rgba(255,255,255,0)');
  gr.addColorStop(0.75, 'rgba(255,255,255,0.95)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const slots = [];   // see makeSlot
let cursor = 0;

const m4 = new THREE.Matrix4();
const quat = new THREE.Quaternion();
const eul = new THREE.Euler();
const posV = new THREE.Vector3();
const sclV = new THREE.Vector3();
const colV = new THREE.Color();
const HIDDEN = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);

function makeSlot() {
  return {
    active: false,
    owner: 'boss',     // 'boss' | 'rider' | 'player'
    x: 0, y: 0, rel: 0,
    vx: 0, vy: 0, vrel: 0,
    r: CONFIG.BOSS.bulletRadius,
    dmg: 0,
    reflectable: false,
    targetRel: 0, tx: 0, ty: 0,   // arrival target for boss-ward bullets
    color: 0xffffff,
    coreColor: 0xffffff,   // white by default; graze-bait darkens it (the "donut" read)
    life: 0,
    age: 0,   // seconds since spawn; drives the spawn-in scale ramp (no more pop-at-full-size)
  };
}

// Ring hoop guide (2.6c): a faint circle outline that arrives IN LOCKSTEP with a
// fired ring's bullets, tracing the shape a beat ahead of the discrete dots — the
// "successive rings read as depth-ordered hoops, not a flat mess" cue. A small
// pool of THREE.LineLoops (own draw call each, only while in flight — cheap,
// rings are rare) sharing one unit-circle geometry, scaled per-hoop to its radius.
const HOOP_POOL = 8;
const HOOP_SEGS = 48;
const HOOP_FADE_NEAR = 4;    // fully gone by this rel (entering the read band)
const HOOP_FADE_SPAN = 8;
let hoopGeo = null;
const hoops = [];   // { active, cx, cy, radius, rel, vrel, mesh, mat }

function makeHoopGeometry() {
  const pts = new Float32Array(HOOP_SEGS * 3);
  for (let i = 0; i < HOOP_SEGS; i++) {
    const a = (i / HOOP_SEGS) * Math.PI * 2;
    pts[i * 3] = Math.cos(a);
    pts[i * 3 + 1] = Math.sin(a);
    pts[i * 3 + 2] = 0;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  return g;
}

function initHoops(scene) {
  hoopGeo = makeHoopGeometry();
  for (let i = 0; i < HOOP_POOL; i++) {
    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, depthTest: false,
    });
    const line = new THREE.LineLoop(hoopGeo, mat);
    line.renderOrder = TIERS.bulletOutline - 1;   // just below the bullet outline tier
    line.frustumCulled = false;
    line.visible = false;
    scene.add(line);
    hoops.push({ active: false, cx: 0, cy: 0, radius: 1, rel: 0, vrel: 0, mesh: line, mat });
  }
}

// Spawn a hoop that traces a ring pattern's shape, timed to arrive alongside its
// bullets (caller matches `rel`/`vrel` to the bullets' own spawn kinematics).
export function spawnBossRingHoop(cx, cy, radius, rel, vrel, color) {
  for (const h of hoops) {
    if (h.active) continue;
    h.active = true; h.cx = cx; h.cy = cy; h.radius = radius; h.rel = rel; h.vrel = vrel;
    h.mat.color.setHex(color ?? 0xffffff);
    h.mesh.visible = true;
    return h;
  }
  return null;   // pool exhausted — silently skip, it's a guide overlay, not gameplay
}

function updateHoops(dt, player) {
  for (const h of hoops) {
    if (!h.active) continue;
    h.rel += h.vrel * dt;
    if (h.rel < HOOP_FADE_NEAR) { h.active = false; h.mesh.visible = false; continue; }
    h.mesh.position.set(h.cx, h.cy, -(player.dist + h.rel));
    h.mesh.scale.setScalar(h.radius);
    h.mat.opacity = 0.2 * Math.max(0, Math.min(1, (h.rel - HOOP_FADE_NEAR) / HOOP_FADE_SPAN));
  }
}

function resetHoops() {
  for (const h of hoops) { h.active = false; if (h.mesh) h.mesh.visible = false; }
}

export function initBossBullets(scene) {
  if (mesh) return;
  const tex = makeBulletTex();
  const quad = new THREE.PlaneGeometry(1, 1);   // round via the soft radial texture
  // Body: the soft round COLOUR disc, per-bullet tint, NORMAL blend (no additive
  // washout), soft-edged. Camera-facing (a +z quad ≈ faces the chase cam).
  const bodyMat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false, depthTest: false,
  });
  mesh = new THREE.InstancedMesh(quad, bodyMat, POOL);
  mesh.frustumCulled = false;
  mesh.renderOrder = TIERS.bulletBody;
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 3), 3);
  // Core: a smaller centre drawn on top — colour-blind-safe (everyone sees the
  // dot), keeps bullets countable no matter the body hue. instanceColor defaults
  // to white (the danger "hot disc" read); graze-bait darkens it to a hollow
  // "donut" so bait reads as a DIFFERENT thing from a danger bullet (2.4).
  const coreMat = new THREE.MeshBasicMaterial({
    map: tex, color: 0xffffff, transparent: true, depthWrite: false, depthTest: false,
  });
  coreMesh = new THREE.InstancedMesh(quad, coreMat, POOL);
  coreMesh.frustumCulled = false;
  coreMesh.renderOrder = TIERS.bulletCore;
  coreMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 3), 3);
  // Outline: a dark annulus UNDER the body — the two-way luminance edge (L121).
  // material.color stays WHITE; the near-black tint is baked per-instance so
  // 2.6a can fade it toward grey for distant bullets without fighting the map.
  const outlineTex = makeOutlineTex();
  const outlineMat = new THREE.MeshBasicMaterial({
    map: outlineTex, color: 0xffffff, transparent: true, opacity: 0.55,
    depthWrite: false, depthTest: false,
  });
  outlineMesh = new THREE.InstancedMesh(quad, outlineMat, POOL);
  outlineMesh.frustumCulled = false;
  outlineMesh.renderOrder = TIERS.bulletOutline;   // under body (21) + core (22) by construction
  outlineMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 3), 3);
  // Ground shadow: a soft dark disc on the floor under each bullet. Two rings that
  // overlap in view sit at different floor distances, so their shadows separate —
  // the floor grid becomes an absolute depth reference (a shadow under the dragon
  // = that bullet is at your plane).
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false, depthTest: false,
  });
  shadowMesh = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 14), shadowMat, POOL);
  shadowMesh.frustumCulled = false;
  shadowMesh.renderOrder = TIERS.bulletShadow;   // under the bullets
  for (let i = 0; i < POOL; i++) {
    slots.push(makeSlot());
    mesh.setMatrixAt(i, HIDDEN);
    coreMesh.setMatrixAt(i, HIDDEN);
    outlineMesh.setMatrixAt(i, HIDDEN);
    outlineMesh.setColorAt(i, OUTLINE_TINT);
    shadowMesh.setMatrixAt(i, HIDDEN);
  }
  mesh.instanceMatrix.needsUpdate = true;
  coreMesh.instanceMatrix.needsUpdate = true;
  outlineMesh.instanceMatrix.needsUpdate = true;
  outlineMesh.instanceColor.needsUpdate = true;
  shadowMesh.instanceMatrix.needsUpdate = true;
  scene.add(shadowMesh);
  scene.add(outlineMesh);   // under the body
  scene.add(mesh);
  scene.add(coreMesh);   // added last → drawn on top
  initHoops(scene);
}

// Quality scales the concurrent-bullet ceiling (mobile draws fewer).
export function setBossBulletQuality(q) {
  visibleCap = Math.max(60, Math.round(POOL * q));
}

function activeCount() {
  let n = 0;
  for (let i = 0; i < POOL; i++) if (slots[i].active) n++;
  return n;
}

// Spawn one bullet. `opts` carries the player-relative kinematics already solved
// by the caller (boss.js patterns / rider auto-attack).
export function spawnBossBullet(opts) {
  if (activeCount() >= visibleCap) return null;
  // Find a free slot from the rotating cursor.
  let s = null;
  for (let i = 0; i < POOL; i++) {
    const idx = (cursor + i) % POOL;
    if (!slots[idx].active) { s = slots[idx]; cursor = (idx + 1) % POOL; break; }
  }
  if (!s) return null;
  s.active = true;
  s.owner = opts.owner || 'boss';
  s.x = opts.x || 0;
  s.y = opts.y || 0;
  s.rel = opts.rel || 0;
  s.vx = opts.vx || 0;
  s.vy = opts.vy || 0;
  s.vrel = opts.vrel || 0;
  s.r = opts.r || CONFIG.BOSS.bulletRadius;
  s.dmg = opts.dmg || 0;
  s.reflectable = !!opts.reflectable;
  s.targetRel = opts.targetRel || 0;
  s.tx = opts.tx || 0;
  s.ty = opts.ty || 0;
  s.color = opts.color || 0xff4488;
  s.coreColor = opts.coreColor || 0xffffff;
  s.life = opts.life || 6;
  s.age = 0;   // reset the spawn-in ramp for this fresh bullet
  return s;
}

// Test seam: positions of all ACTIVE bullets (slot order) so headless suites
// can budget-check pattern emissions and scan fills for designed safe gaps.
export function debugActiveBullets() {
  const out = [];
  for (let i = 0; i < POOL; i++) { const s = slots[i]; if (s.active) out.push({ x: s.x, y: s.y }); }
  return out;
}

function deactivate(i) {
  slots[i].active = false;
  mesh.setMatrixAt(i, HIDDEN);
  if (coreMesh) coreMesh.setMatrixAt(i, HIDDEN);
  if (outlineMesh) outlineMesh.setMatrixAt(i, HIDDEN);
  if (shadowMesh) shadowMesh.setMatrixAt(i, HIDDEN);
}

export function updateBossBullets(dt, player) {
  if (!mesh) return;
  clock += dt;
  const px = player.position.x;
  const py = player.position.y;
  const bossR = CONFIG.BOSS.bossHitRadius;

  for (let i = 0; i < POOL; i++) {
    const s = slots[i];
    if (!s.active) continue;

    const prevRel = s.rel;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.rel += s.vrel * dt;
    s.life -= dt;
    s.age += dt;

    // Time-to-impact FLARE (the depth cue, replacing the confusing loom): a boss
    // bullet warms toward white-hot in its last ~0.3 s, so the one that reaches
    // you FIRST flares first — "which hits me" is a colour read. A reflectable
    // bullet flares bright the instant it enters the parry window (the parry cue).
    let flare = 0;
    if (s.owner === 'boss' && s.rel > 0) {
      const tti = s.rel / Math.max(Math.abs(s.vrel), 1);
      if (tti < 0.3) flare = 1 - tti / 0.3;
      // In Surge every bullet is parryable, so every bullet flares in the window.
      const parryable = s.reflectable || game.feverActive;
      if (parryable && s.rel <= CONFIG.BOSS.reflectWindow) {
        flare = Math.max(flare, 0.55 + Math.sin(clock * 22) * 0.35);
      }
    }

    // Successive-ring depth ordering: a far-out bullet fogs dim, a boss bullet
    // that's already CROSSED the plane (owner 'boss', rel<0 — a graze/miss still
    // whooshing past, see L92) shrinks and recedes into the same fog tone, and
    // the outline/shadow vanish the instant it crosses (they're a near-field
    // read only). The FLARE lerp (above) is applied AFTER fog so an imminent
    // bullet is always the hottest thing on screen regardless of distance fade.
    const far = Math.max(0, Math.min(1, (s.rel - 15) / 15));
    const past = s.owner === 'boss' && s.rel < 0;
    const gone = past ? Math.max(0, Math.min(1, -s.rel / 5)) : 0;
    const shrink = past ? 1 - gone * 0.7 : 1;

    // Spawn-in ramp (L148): a fresh bullet grows from a point to full size over the
    // first CONFIG.BOSS.spawnRampT seconds instead of popping in at full radius —
    // "materialises from nowhere" was the up-close read. eased so it's soft, not linear.
    const grow = s.age < CONFIG.BOSS.spawnRampT
      ? (t => t * (2 - t))(Math.max(0, Math.min(1, s.age / CONFIG.BOSS.spawnRampT)))
      : 1;
    const drawScale = shrink * grow;

    // Round camera-facing bullet: a soft colour BODY with a WHITE CENTRE on top,
    // plus a ground shadow (all off one slot). No spin — the disc is radial.
    posV.set(s.x, s.y, -(player.dist + s.rel));
    m4.compose(posV, IDENTITY, sclV.setScalar(s.r * 2.7 * drawScale));   // body disc
    mesh.setMatrixAt(i, m4);
    colV.setHex(s.color).lerp(FOG_DIM, Math.max(far, gone) * 0.5).lerp(WHITE, flare);
    mesh.setColorAt(i, colV);
    m4.compose(posV, IDENTITY, sclV.setScalar(s.r * 1.55 * drawScale));  // centre (smaller)
    coreMesh.setMatrixAt(i, m4);
    // Core defaults white (the danger "hot disc"); graze-bait darkens it (a
    // hollow "donut" — reads as a DIFFERENT thing). The tti flare still heats a
    // bait core toward white in its last instant (2.4) — fairness: it can hit
    // dead-centre, so it must flare like everything else.
    coreColV.setHex(s.coreColor).lerp(WHITE, flare);
    coreMesh.setColorAt(i, coreColV);
    if (past) {
      outlineMesh.setMatrixAt(i, HIDDEN);   // hidden the instant it crosses (near-field only)
      shadowMesh.setMatrixAt(i, HIDDEN);
    } else {
      m4.compose(posV, IDENTITY, sclV.setScalar(s.r * 3.1 * grow));   // outline ring (under the body)
      outlineMesh.setMatrixAt(i, m4);
      outlineColV.copy(OUTLINE_TINT).lerp(OUTLINE_FOG, far * 0.5);
      outlineMesh.setColorAt(i, outlineColV);
      // Shadow on the floor directly beneath the bullet.
      m4.compose(posV.set(s.x, GROUND_Y, -(player.dist + s.rel)), SHADOW_QUAT, shadowScl.setScalar(s.r * 1.5 * grow));
      shadowMesh.setMatrixAt(i, m4);
    }

    if (s.owner === 'boss') {
      // Resolve the dodge on the frame the bullet crosses the player's plane: a
      // dead-on pass HITS (and is consumed here); a near-clean pass GRAZES. Either
      // way a NON-hit keeps flying PAST the player and whooshes by the camera, so a
      // bullet never appears to vanish just short of you.
      if (prevRel > 0 && s.rel <= 0) {
        const dx = s.x - px, dy = s.y - py;
        const d2 = dx * dx + dy * dy;
        // Per-bullet radius so the hitbox matches the banded VISUAL size (fair).
        const hitRi = s.r + R * CONFIG.BOSS.bulletHitScale;
        const grazeRi = s.r + R * CONFIG.BOSS.grazeScale;
        if (d2 < hitRi * hitRi) { hitPlayer(player, s.dmg, 'bullet'); deactivate(i); continue; }
        if (d2 < grazeRi * grazeRi) bulletGraze(player);
      }
      // Cull off-frame bullets. The lower y-bound is WIDENED to -16 (§5e, the
      // MARROWCOIL/BRINEHOLM below-approach need): a boss that rises through the
      // fog line and fires from below-frame is born at negative y, so a tight
      // -4 floor deleted its bullets at birth. Anything that actually passes the
      // player is still culled by rel < -12; life <= 0 bounds the rest, so the
      // wider floor only lets legitimately-low-born bullets travel into frame.
      // The shipped bosses fire from y≈13 and never reach this floor (byte-safe).
      if (s.rel < -12 || s.life <= 0 ||
          Math.abs(s.x) > CONFIG.laneHalfWidth + 10 || s.y < -16 || s.y > 34) {
        deactivate(i);
      }
    } else {
      // Rider / reflected bullet flying toward the boss.
      if (s.rel >= s.targetRel) {
        const dx = s.x - s.tx, dy = s.y - s.ty;
        if (dx * dx + dy * dy < bossR * bossR) {
          emit('bossDamage', { amount: s.dmg, kind: s.owner, x: s.tx, y: s.ty });
        }
        deactivate(i);
      } else if (s.life <= 0) {
        deactivate(i);
      }
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  coreMesh.instanceMatrix.needsUpdate = true;
  outlineMesh.instanceMatrix.needsUpdate = true;
  shadowMesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  if (coreMesh.instanceColor) coreMesh.instanceColor.needsUpdate = true;
  if (outlineMesh.instanceColor) outlineMesh.instanceColor.needsUpdate = true;
  updateHoops(dt, player);
}

// Swat reflectable boss bullets near a rolling player back at the boss. `all`
// (Surge hyper, increment 3) makes EVERY boss bullet reflectable, not just the
// amber ones. A bullet swatted within `perfectParryRel` is a PERFECT parry (more
// damage). Returns { total, perfect } counts for the FX/announcement.
export function reflectBossBullets(player, windowRel, settleGap, bossX, bossY, all = false) {
  let total = 0, perfect = 0;
  for (let i = 0; i < POOL; i++) {
    const s = slots[i];
    if (!s.active || s.owner !== 'boss') continue;
    if (!all && !s.reflectable) continue;
    if (s.rel < 0 || s.rel > windowRel) continue;
    const dx = s.x - player.position.x, dy = s.y - player.position.y;
    if (dx * dx + dy * dy > 9) continue;            // must be near the player to swat
    const isPerfect = s.rel <= CONFIG.BOSS.perfectParryRel;
    // Flip it back at the boss.
    s.owner = 'player';
    s.targetRel = settleGap;
    s.tx = bossX; s.ty = bossY;
    s.vrel = CONFIG.BOSS.bossSpeed;
    const t = Math.max((settleGap - s.rel) / CONFIG.BOSS.bossSpeed, 0.05);
    s.vx = (bossX - s.x) / t;
    s.vy = (bossY - s.y) / t;
    s.color = isPerfect ? 0xaef0ff : 0x66ddff;      // perfect = brighter
    const mult = isPerfect ? CONFIG.BOSS.reflectPerfectMult : CONFIG.BOSS.reflectDamageMult;
    s.dmg = (s.dmg > 0 ? s.dmg : 5) * mult;
    s.life = 4;
    total++;
    if (isPerfect) perfect++;
  }
  return { total, perfect };
}

export function bossBulletCount() { return activeCount(); }

export function resetBossBullets() {
  for (let i = 0; i < POOL; i++) {
    if (slots[i]) slots[i].active = false;
    if (mesh) mesh.setMatrixAt(i, HIDDEN);
    if (coreMesh) coreMesh.setMatrixAt(i, HIDDEN);
    if (outlineMesh) outlineMesh.setMatrixAt(i, HIDDEN);
    if (shadowMesh) shadowMesh.setMatrixAt(i, HIDDEN);
  }
  cursor = 0;
  if (mesh) mesh.instanceMatrix.needsUpdate = true;
  if (coreMesh) coreMesh.instanceMatrix.needsUpdate = true;
  if (outlineMesh) outlineMesh.instanceMatrix.needsUpdate = true;
  if (shadowMesh) shadowMesh.instanceMatrix.needsUpdate = true;
  resetHoops();
}
