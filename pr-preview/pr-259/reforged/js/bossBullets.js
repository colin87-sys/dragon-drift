import * as THREE from 'three';
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { hitPlayer, bulletGraze } from './collision.js';
import { burst, wispImpact } from './particles.js';
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
const trailV = new THREE.Vector3();   // wisp impact world-pos scratch
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
    // WYRMFIRE WISPS (lances only; inert 0 for every other owner):
    homeDelay: 0,   // seconds of pure fan-arc before the homing steer engages
    curl: 0,        // rad/s velocity rotation during the fan phase (sign = volley-slot parity)
    ribbonIdx: -1,  // index into the wisp light-ribbon pool (-1 = none; lances only)
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

// ---- WISP LIGHT-RIBBONS (PR4b) ---------------------------------------------
// The silhouette fix (owner: the volley was lost in the bullet sea): each wisp
// tows a continuous tapered light-ribbon tracing its curved flight path — the
// Panzer-Dragoon homing-laser read. The volley becomes the ONLY line-class
// shape among the enemy's dot-class bullets, and on arrival the ribbon hangs
// as an afterimage draining TAIL-first (never a frozen line — the classic bug).
// Geometry recipe forked from EITHERWING's comet-tails (makeTailStrip — the
// engine's proven deforming quad-strip, 1 draw + 1 small buffer upload each;
// BOSS-DESIGN §2 explicitly endorses separate meshes with buffer uploads over
// animated instancing). Cross-sections face the CAMERA (side = tangent × view)
// so the strip never collapses when a wisp flies down the view ray — on this
// rail the view dir is a constant (0,0,-1) to within camera sway.
// Hot head: the EYE_HOT idiom (toneMapped=false + colour scaled past the bloom
// threshold) — the bullet discs are toneMapped by design and can never compete.
const RIBBON_POOL = 6;   // = max concurrent wisps (cap 6 at tier 4+)
const ribbons = [];      // { active, drain, drainT, n, pts: Float32Array, geo, mesh, mat, head, headMat }
const _rTan = new THREE.Vector3(), _rSide = new THREE.Vector3();
const _rA = new THREE.Vector3(), _rB = new THREE.Vector3(), _rP = new THREE.Vector3();
const RIBBON_VIEW = new THREE.Vector3(0, 0, -1);   // rail-shooter view dir (chase cam)

function initWispRibbons(scene, headTex) {
  const L = CONFIG.LOCK;
  const rings = L.ribbonRings;
  for (let r = 0; r < RIBBON_POOL; r++) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rings * 2 * 3), 3));
    const idx = [];
    for (let i = 0; i < rings - 1; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); }
    geo.setIndex(idx);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, depthTest: false, side: THREE.DoubleSide,
    });
    mat.toneMapped = false;
    mat.color.setHex(0x50ffaa).multiplyScalar(L.ribbonHot);   // jade, just past the bloom threshold
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    m.renderOrder = TIERS.wispRibbon;
    m.visible = false;
    scene.add(m);
    // The white-hot head: one small additive sprite riding the newest sample —
    // the brightest pixel in its neighbourhood (jade-white × headHot blooms).
    const headMat = new THREE.SpriteMaterial({
      map: headTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    });
    headMat.toneMapped = false;
    headMat.color.setHex(0xeafff6).multiplyScalar(L.headHot);
    const head = new THREE.Sprite(headMat);
    head.renderOrder = TIERS.bulletOutline - 1;   // just below the bullets (the hoop precedent)
    head.scale.setScalar(1.15);
    head.visible = false;
    scene.add(head);
    ribbons.push({ active: false, drain: false, drainT: 0, n: 0,
      pts: new Float32Array(rings * 3), geo, mesh: m, mat, head, headMat });
  }
}

// Claim a free ribbon for a fresh wisp (−1 when all busy incl. draining
// afterimages — silently skip, it's presentation, never gameplay).
function acquireRibbon() {
  for (let r = 0; r < ribbons.length; r++) {
    const rb = ribbons[r];
    if (!rb.active && !rb.drain) {
      rb.active = true; rb.drain = false; rb.drainT = 0; rb.n = 0;
      rb.mesh.visible = true; rb.head.visible = true; rb.mat.opacity = 1;
      return r;
    }
  }
  return -1;
}

// Push the wisp's current world position into its ribbon's sliding window
// (newest sample = the HEAD; the fixed-size window slides via copyWithin).
function ribbonSample(idx, x, y, z) {
  const rb = ribbons[idx];
  const rings = CONFIG.LOCK.ribbonRings;
  if (rb.n === rings) rb.pts.copyWithin(0, 3);
  else rb.n++;
  const o = (rb.n - 1) * 3;
  rb.pts[o] = x; rb.pts[o + 1] = y; rb.pts[o + 2] = z;
  rb.head.position.set(x, y, z);
}

// The wisp died at its brand: freeze the head AT the impact point and drain the
// afterimage tail-first over ribbonFade.
function ribbonRelease(idx) {
  if (idx < 0 || !ribbons[idx] || !ribbons[idx].active) return;
  const rb = ribbons[idx];
  rb.active = false;
  rb.drain = true;
  rb.drainT = 0;
  rb.head.visible = false;   // the impact burst takes over from the hot head
}

// Rebuild every live ribbon's strip from its sample window. Vertex math is the
// EITHERWING updateTailStrip recipe in world space: tangent from neighbours,
// side = tangent × VIEW (camera-facing — never collapses down the view ray),
// tapered half-width head→tail. A draining ribbon consumes its own tail (the
// drawn window shrinks from the oldest sample) while the whole strip fades.
function updateWispRibbons(dt) {
  const L = CONFIG.LOCK;
  const rings = L.ribbonRings;
  for (const rb of ribbons) {
    if (!rb.active && !rb.drain) continue;
    let start = 0, count = rb.n;
    if (rb.drain) {
      rb.drainT += dt;
      const k = rb.drainT / L.ribbonFade;
      if (k >= 1 || rb.n < 2) {
        rb.drain = false; rb.mesh.visible = false; rb.head.visible = false; rb.n = 0;
        continue;
      }
      start = Math.floor(k * rb.n);            // the tail burns toward the head
      count = rb.n - start;
      rb.mat.opacity = 1 - k;
    }
    const pos = rb.geo.attributes.position.array;
    if (count < 2) { rb.mesh.visible = false; continue; }
    rb.mesh.visible = true;
    for (let i = 0; i < rings; i++) {
      // Clamp past-the-window rings onto the ends (degenerate — zero area).
      const si = Math.min(start + i, start + count - 1);
      _rP.fromArray(rb.pts, si * 3);
      const ai = Math.max(start, si - 1), bi = Math.min(start + count - 1, si + 1);
      _rA.fromArray(rb.pts, ai * 3); _rB.fromArray(rb.pts, bi * 3);
      _rTan.subVectors(_rB, _rA);
      _rSide.crossVectors(_rTan, RIBBON_VIEW);
      if (_rSide.lengthSq() < 1e-6) _rSide.set(1, 0, 0);
      // Taper: the NEWEST sample (head) is fattest, the tail fine — and past-the-
      // window rings collapse to zero width (i clamped ⇒ t clamps to the head).
      const t = count > 1 ? (si - start) / (count - 1) : 1;   // 0 = tail, 1 = head
      _rSide.normalize().multiplyScalar(L.ribbonHalfWMax * (0.12 + 0.88 * t));
      const o = i * 6;
      pos[o] = _rP.x + _rSide.x; pos[o + 1] = _rP.y + _rSide.y; pos[o + 2] = _rP.z + _rSide.z;
      pos[o + 3] = _rP.x - _rSide.x; pos[o + 4] = _rP.y - _rSide.y; pos[o + 5] = _rP.z - _rSide.z;
    }
    rb.geo.attributes.position.needsUpdate = true;
  }
}

function resetWispRibbons() {
  for (const rb of ribbons) {
    rb.active = false; rb.drain = false; rb.drainT = 0; rb.n = 0;
    if (rb.mesh) rb.mesh.visible = false;
    if (rb.head) rb.head.visible = false;
  }
}

// ---- WISP IMPACT DRUM-ROLL (PR4b) ------------------------------------------
// Damage always lands on the arrival frame (the arrival-frame LAW) — but the
// impact PRESENTATION staggers: same-window arrivals queue at impactStaggerMs
// spacing, each firing the burst + a 'lockStrike' (the ascending impact-
// arpeggio note, k = position in the roll). Plural payoff reads as a drum-roll,
// not one boom (the Rez lesson). Only the FIRST strike of a window carries the
// small shockwave ring (the §2 additive-volume cap).
const impactQ = [];          // { x, y, z, t, k }
let impactWindowAt = -1;     // clock of the window's first arrival
let impactWindowK = 0;

function queueWispImpact(x, y, z) {
  if (clock - impactWindowAt > 0.15) { impactWindowAt = clock; impactWindowK = 0; }
  const k = impactWindowK++;
  impactQ.push({ x, y, z, t: k * (CONFIG.LOCK.impactStaggerMs / 1000), k });
}

function updateWispImpacts(dt) {
  if (!impactQ.length) return;
  for (const q of impactQ) q.t -= dt;
  for (let i = impactQ.length - 1; i >= 0; i--) {
    const q = impactQ[i];
    if (q.t > 0) continue;
    trailV.set(q.x, q.y, q.z);
    wispImpact(trailV, q.k === 0);
    emit('lockStrike', { k: q.k });
    impactQ.splice(i, 1);
  }
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
  initWispRibbons(scene, tex);   // the soft radial disc doubles as the hot-head glow
}

// Quality scales the concurrent-bullet ceiling (mobile draws fewer) AND the
// wisp-trail emit rate (fxQuality — the source-side particle throttle).
let fxQuality = 1;
export function setBossBulletQuality(q) {
  visibleCap = Math.max(60, Math.round(POOL * q));
  fxQuality = q;
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
  s.homeDelay = opts.homeDelay ?? 0;
  s.curl = opts.curl ?? 0;
  // A fresh wisp tows a light-ribbon (silently none when the pool is busy —
  // presentation only, never gameplay). fxQuality ≤ 0.3 skips ribbons entirely
  // (the hot instanced head + impact bursts still carry the read on potatoes).
  s.ribbonIdx = (s.owner === 'lance' && fxQuality > 0.3) ? acquireRibbon() : -1;
  // §5f destructible sub-parts: an optional source-part tag (e.g. HOLLOWGATE's
  // pane index) rides the bullet so a REFLECTED amber lands its damage on the
  // part it came from (parry a pane's radial → crack THAT pane). null for the
  // roster's single-centre bosses — byte-unchanged.
  s.part = opts.part ?? null;
  return s;
}

// Test seam: kinematics of all ACTIVE bullets (slot order) so headless suites
// can budget-check pattern emissions, scan fills for designed safe gaps, and
// assert the wisp fan (vx/vy divergence). Existing consumers read x/y only —
// the extra fields are additive-safe.
export function debugActiveBullets() {
  const out = [];
  for (let i = 0; i < POOL; i++) {
    const s = slots[i];
    if (s.active) out.push({ x: s.x, y: s.y, vx: s.vx, vy: s.vy, rel: s.rel, owner: s.owner, age: s.age });
  }
  return out;
}

// Test seam (PR4b): the wisp light-ribbon pool's live state — active/draining
// counts, per-ribbon sample counts and head positions, and the impact queue.
export function debugWispRibbons() {
  return {
    active: ribbons.filter((r) => r.active).length,
    draining: ribbons.filter((r) => r.drain).length,
    ribbons: ribbons.map((r) => ({
      active: r.active, drain: r.drain, n: r.n,
      hx: r.n ? r.pts[(r.n - 1) * 3] : 0, hy: r.n ? r.pts[(r.n - 1) * 3 + 1] : 0,
    })),
    impactQ: impactQ.length,
  };
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
    let breathe = 1;
    if (s.owner === 'boss' && s.rel > 0) {
      const tti = s.rel / Math.max(Math.abs(s.vrel), 1);
      if (tti < 0.3) flare = 1 - tti / 0.3;
      // In Surge every bullet is parryable, so every bullet flares in the window.
      const parryable = s.reflectable || game.feverActive;
      if (parryable && s.rel <= CONFIG.BOSS.reflectWindow) {
        flare = Math.max(flare, 0.55 + Math.sin(clock * 22) * 0.35);
      }
    } else if (s.owner === 'lance') {
      // A wisp is ALIVE: a fast luminance pulse + a ~10% breathing head, phase-offset
      // per pool slot so a volley shimmers, never strobes in unison. Render-side only
      // (s.r and every gameplay field untouched — the arrival law can't drift).
      const pulse = Math.sin(clock * 16 + i * 2.4);
      flare = 0.2 + 0.18 * pulse;
      breathe = 1 + 0.1 * pulse;
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
    m4.compose(posV, IDENTITY, sclV.setScalar(s.r * 2.7 * drawScale * breathe));   // body disc
    mesh.setMatrixAt(i, m4);
    colV.setHex(s.color).lerp(FOG_DIM, Math.max(far, gone) * 0.5).lerp(WHITE, flare);
    mesh.setColorAt(i, colV);
    m4.compose(posV, IDENTITY, sclV.setScalar(s.r * 1.55 * drawScale * breathe));  // centre (smaller)
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
        const grazeRi = (s.r + R * CONFIG.BOSS.grazeScale) * grazeBonus;   // adrenaline R1 "magnet" widens the annulus (default 1)
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
      // WYRMFIRE WISPS (Hunter's Brand skin): a lance FANS OUT on its authored
      // launch bearing — a pure circular arc (velocity rotated by `curl`) for
      // `homeDelay` seconds, Panzer-Dragoon style — then the homing arrive steer
      // ramps in over homeBlend and reels it unerringly onto its brand. vrel is
      // NEVER touched, so the arrival frame is identical to a straight lance
      // (the boss.mjs kill-time invariance rests on this). Rider/reflected fly
      // straight. Determinism: bearing + curl are authored table + slot parity,
      // zero RNG in any gameplay field.
      if (s.owner === 'lance') {
        const L = CONFIG.LOCK;
        if (s.age < s.homeDelay) {
          // FAN phase — rotate the launch vector; no homing yet.
          const w = s.curl * dt, c = Math.cos(w), sn = Math.sin(w);
          const nvx = s.vx * c - s.vy * sn;
          s.vy = s.vx * sn + s.vy * c;
          s.vx = nvx;
        } else {
          // HOMING — the arrive controller, gain ramped in so there's no elbow.
          // A small SNAKE-WOBBLE bends the steering target laterally (the PD
          // homing-laser weave); its amplitude DECAYS to zero over the last
          // stretch of flight so the landing law is untouched. Deterministic:
          // sine of age + pool-slot phase, zero RNG in gameplay fields.
          const ramp = Math.min(1, (s.age - s.homeDelay) / L.lanceHomeBlend);
          const tLeft = Math.max((s.targetRel - s.rel) / Math.max(s.vrel, 1), 0.06);
          const decay = Math.min(1, Math.max(0, (tLeft - 0.15) / 0.2));
          const wob = Math.sin(s.age * L.wobbleHz * Math.PI * 2 + i * 2.1) * L.wobbleAmp * decay;
          const k = Math.min(1, dt * L.lanceSteerGain * ramp);
          s.vx += ((s.tx + wob - s.x) / tLeft - s.vx) * k;
          s.vy += ((s.ty - wob * 0.6 - s.y) / tLeft - s.vy) * k;
        }
        // Tow the light-ribbon: push this frame's world position into the
        // ribbon's sliding window (the strip rebuild happens once per frame in
        // updateWispRibbons — the trail IS the wisp's flight history).
        if (s.ribbonIdx >= 0) ribbonSample(s.ribbonIdx, s.x, s.y, -(player.dist + s.rel));
      }
      if (s.rel >= s.targetRel) {
        const dx = s.x - s.tx, dy = s.y - s.ty;
        if (dx * dx + dy * dy < bossR * bossR) {
          // `part` (a reflected amber's source pane) routes the §5f per-part hit
          // test; `x`/`y` are the bullet's ACTUAL landing point (not the aim
          // target — the fallback routing must test where the shot really hit,
          // or gunfire can never sculpt a sub-part; CP2 gate finding 4).
          emit('bossDamage', { amount: s.dmg, kind: s.owner, x: s.x, y: s.y, part: s.part });
        }
        // A wisp POPS at its brand (hit or whiff — it visibly dies where it
        // aimed). The pop QUEUES into the impact drum-roll (presentation stagger
        // + lockStrike arpeggio; damage above stayed same-frame — the LAW), and
        // the ribbon freezes its head at the impact point and drains tail-first.
        if (s.owner === 'lance') {
          queueWispImpact(s.x, s.y, -(player.dist + s.rel));
          ribbonRelease(s.ribbonIdx);
          s.ribbonIdx = -1;
        }
        deactivate(i);
      } else if (s.life <= 0) {
        if (s.owner === 'lance') { ribbonRelease(s.ribbonIdx); s.ribbonIdx = -1; }
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
  updateWispRibbons(dt);
  updateWispImpacts(dt);
  updateHoops(dt, player);
}

// Swat reflectable boss bullets near a rolling player back at the boss. `all`
// (Surge hyper, increment 3) makes EVERY boss bullet reflectable, not just the
// amber ones. A bullet swatted within `perfectParryRel` is a PERFECT parry (more
// damage). Returns { total, perfect } counts for the FX/announcement.
export function reflectBossBullets(player, windowRel, settleGap, bossX, bossY, all = false, dmgBonus = 1) {
  let total = 0, perfect = 0;
  let snapParts = null;   // V4 (PR4): source-part tags of PERFECTLY parried ambers
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
    const mult = (isPerfect ? CONFIG.BOSS.reflectPerfectMult : CONFIG.BOSS.reflectDamageMult) * dmgBonus;   // dmgBonus: adrenaline R4 (default 1)
    s.dmg = (s.dmg > 0 ? s.dmg : 5) * mult;
    s.life = 4;
    total++;
    if (isPerfect) {
      perfect++;
      // V4 LOCK-SNAP (PR4): a PERFECT parry knows which organ fired the bullet
      // (the §5f source-part tag rides the slot) — surface it so the caller can
      // snap a brand onto that organ. Deduped; nulls (untagged emitters) skipped.
      if (s.part != null) {
        if (!snapParts) snapParts = [];
        if (!snapParts.includes(s.part)) snapParts.push(s.part);
      }
    }
  }
  return { total, perfect, snapParts: snapParts || [] };
}

// Adrenaline R1 "magnet" (§5i.B meta spine): a multiplier on the crossing-graze
// annulus. 1 = the shipped geometry (byte-identical for the un-laddered path);
// boss.js drives it from the no-hit ladder each frame.
let grazeBonus = 1;
export function setGrazeBonus(m) { grazeBonus = Math.max(1, m || 1); }

// §5i.B CONTINUOUS-GRAZE detector (the ticking sibling of the one-per-bullet
// crossing check — lands with slot 6, RIDE-THE-BEAM-EDGE). Reports whether the
// player is currently RIDING alongside live boss fire: ≥1 boss bullet ahead
// (0 < rel ≤ depthHi) whose lateral offset sits inside the graze annulus
// (outside its hit radius — a too-close edge always exists, annulus-not-radius
// law). PURE QUERY, no payout: the caller (boss.js) owns the tick clock, the
// ramp, and the dedup story (rate-limited ticks vs the crossing check's
// one-per-bullet), so parking exploits die at the policy layer, not here.
export function beamContact(player, depthHi = 7) {
  const px = player.position.x, py = player.position.y;
  for (let i = 0; i < POOL; i++) {
    const s = slots[i];
    if (!s.active || s.owner !== 'boss') continue;
    if (s.rel <= 0 || s.rel > depthHi) continue;
    const dx = s.x - px, dy = s.y - py;
    const d2 = dx * dx + dy * dy;
    const hitRi = s.r + R * CONFIG.BOSS.bulletHitScale;
    const grazeRi = (s.r + R * CONFIG.BOSS.grazeScale) * grazeBonus;
    if (d2 > hitRi * hitRi && d2 <= grazeRi * grazeRi) return true;
  }
  return false;
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
  resetWispRibbons();
  impactQ.length = 0;
  impactWindowAt = -1;
  impactWindowK = 0;
}
