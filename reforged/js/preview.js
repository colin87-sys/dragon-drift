import * as THREE from 'three';
import { buildDragonModel, makePreviewTick } from './dragonModel.js';
import { buildRiderFigure, riderMaterials } from './riderParts.js';
import { buildShowcaseBackdrop } from './showcaseBackdrop.js';
import { EffectComposer } from '../lib/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../lib/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../lib/postprocessing/OutputPass.js';

// Live 3D shop previews: every dragon/rider card gets a little turntable —
// the real dragon model (same mesh as in-game, tier-aware) rendered into the
// card's <canvas>. One shared offscreen WebGL renderer is blitted into each
// card at ~30fps; the loop self-stops when the shop closes (canvases leave
// the DOM) and everything is disposed.

const SIZE = 150;

let renderer = null;
let scene = null;
let camera = null;
let items = []; // { canvas, ctx, group, tick }
let rafId = 0;
let lastBlit = 0;

function ensureRenderer() {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(SIZE, SIZE);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  scene = new THREE.Scene();
  // Chase-cam framing: behind and slightly above, so the card shows the same
  // rear flying view as gameplay (the dragon faces away and flaps).
  camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
  camera.position.set(0, 1.25, 7.9);
  camera.lookAt(0, 0.25, 0);
  // Render the SPRITE GLOW layer (1) — in gameplay it holds the dragon's plasma
  // (core glow, aura, halos) kept out of the water reflection. The shop has no
  // water, so without this enable the cards lose all their glow and read flat.
  camera.layers.enable(1);
  scene.add(new THREE.HemisphereLight(0xbfdcff, 0x2e3448, 1.0));
  const key = new THREE.DirectionalLight(0xffe0b0, 1.7);
  key.position.set(2.5, 3, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7fb8ff, 0.8);
  rim.position.set(-3, 1.5, -3);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xd0f0ff, 0.4);
  fill.position.set(0, -2, 2);
  scene.add(fill);
}

const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.45, ...opts });

// Rider bust on a floating saddle disc. Same shared figure as the in-game
// model (riderParts.js), scaled up for the card — so the shop shows each
// rider's true silhouette, gear and trail.
function buildRiderIcon(def) {
  const g = new THREE.Group();
  const mats = riderMaterials(def);
  const fig = buildRiderFigure(def, mats);
  fig.group.scale.setScalar(1.8);
  g.add(fig.group);

  // Saddle disc the rider floats on.
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.78, 0.92, 0.16, 12), mat(0x3a1b16, { roughness: 0.8 }));
  disc.position.y = -0.9;
  g.add(disc);

  // Preview-only loose hair (the in-game ponytail is a world-space chain).
  const hairMat = mat(def.hair, { roughness: 0.9 });
  const ponyN = Math.min(6, Math.round(def.ponySegs / 2));
  const pony = [];
  for (let i = 0; i < ponyN; i++) {
    const b = new THREE.Mesh(
      new THREE.SphereGeometry(0.16 * (1 - i / (ponyN + 2)), 6, 5), hairMat);
    b.position.set(0, 0.92 - i * 0.14, 0.32 + i * 0.24);
    g.add(b);
    pony.push(b);
  }

  const trail = fig.trail;
  const glow = fig.glow;
  if (glow) { glow.scale.setScalar(2.5); glow.material.opacity = 0.36; }

  g.position.y = -0.35;
  const tick = (t) => {
    g.rotation.y = t * 0.6;
    g.position.y = -0.35 + Math.sin(t * 1.8) * 0.06;
    if (trail) trail.rotation.z = Math.sin(t * 3.0) * 0.16;
    for (let i = 0; i < pony.length; i++) {
      pony[i].position.x = Math.sin(t * 2.6 - i * 0.7) * 0.05 * i;
    }
    for (const o of fig.orbiters) {
      o.ang += 0.03;
      o.mesh.position.x = Math.cos(o.ang) * o.radius;
      o.mesh.position.z = Math.sin(o.ang) * o.radius * o.flat;
      o.mesh.position.y = o.baseY + Math.sin(t * 1.6 + o.ang) * 0.04;
      o.mesh.rotation.y = t * 1.5;
    }
    if (glow) glow.material.opacity = 0.3 + Math.sin(t * 3) * 0.12;
  };
  return { group: g, tick };
}

function disposeItem(item) {
  item.group.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
}

function disposeAll() {
  for (const item of items) disposeItem(item);
  items = [];
}

function loop(now = performance.now()) {
  // Drop previews whose canvases left the DOM (screen changed / re-rendered)
  items = items.filter((item) => {
    if (item.canvas.isConnected) return true;
    disposeItem(item);
    return false;
  });
  if (!items.length) { rafId = 0; return; }
  rafId = requestAnimationFrame(loop);
  if (now - lastBlit < 33) return; // ~30fps is plenty for a turntable
  lastBlit = now;
  const t = now / 1000;
  for (const item of items) {
    scene.add(item.group);
    item.tick(t + item.phase);
    renderer.render(scene, camera);
    scene.remove(item.group);
    item.ctx.clearRect(0, 0, item.canvas.width, item.canvas.height);
    item.ctx.drawImage(renderer.domElement, 0, 0, item.canvas.width, item.canvas.height);
  }
}

// Scan a freshly-rendered screen for preview canvases and start the
// turntables. Defs are passed by the caller (ui.js) keyed off data attrs.
export function attachPreviews(root, lookup) {
  disposeAll();
  const canvases = root.querySelectorAll('canvas.skin-preview');
  if (!canvases.length) return;
  ensureRenderer();
  for (const canvas of canvases) {
    const def = lookup(canvas.dataset.kind, canvas.dataset.key);
    if (!def) continue;
    let group, tick;
    if (canvas.dataset.kind === 'dragon') {
      const result = buildDragonModel(def, { preview: true });
      group = result.group;
      tick = makePreviewTick(def, result);
    } else {
      const built = buildRiderIcon(def);
      group = built.group;
      tick = built.tick;
    }
    items.push({
      canvas, ctx: canvas.getContext('2d'),
      group, tick,
      phase: Math.random() * 6,
    });
  }
  if (items.length && !rafId) rafId = requestAnimationFrame(loop);
}

// Additive single-canvas attach (celebration overlay): unlike attachPreviews
// this does NOT disposeAll, so shop-card turntables behind the overlay keep
// spinning. The canvas leaving the DOM auto-disposes it (loop's isConnected
// sweep) — dismissing the overlay is the cleanup.
// Replace a single card's turntable in place (form scrub) — dispose only that
// canvas's item and rebuild it, leaving every other turntable untouched.
export function refreshPreview(canvas, kind, def) {
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i].canvas === canvas) { disposeItem(items[i]); items.splice(i, 1); }
  }
  attachPreviewCanvas(canvas, kind, def);
}

export function attachPreviewCanvas(canvas, kind, def) {
  if (!def) return;
  ensureRenderer();
  let group, tick;
  if (kind === 'dragon') {
    const result = buildDragonModel(def, { preview: true });
    group = result.group;
    tick = makePreviewTick(def, result);
  } else {
    const built = buildRiderIcon(def);
    group = built.group;
    tick = built.tick;
  }
  items.push({
    canvas, ctx: canvas.getContext('2d'),
    group, tick,
    phase: Math.random() * 6,
  });
  if (!rafId) rafId = requestAnimationFrame(loop);
}

// ── DragonShowcase ──────────────────────────────────────────────────────────
// A dedicated HIGH-RES single-dragon renderer for the full-screen inspect modal
// (the card previews render at 150px and would look soft blown up). Its own
// renderer / scene / premium lighting, with a gentle showcase orbit layered on
// top of the live flap. One showcase at a time; opened/closed by ui.js.
let scRenderer = null, scScene = null, scCamera = null, scItem = null, scRaf = 0;
let scComposer = null, scBackdrop = null;
const SC_SIZE = 640;
// User-controlled 360° turntable yaw. Drag accumulates `scYaw`; on release the
// `scYawVel` carries it with inertia; after it settles + a short idle, a slow
// auto-turntable resumes so the stage always feels alive (but never fights a drag).
let scYaw = 0, scYawVel = 0, scDragging = false, scIdle = 0;
export function showcaseDragStart() { scDragging = true; scYawVel = 0; scIdle = 0; }
export function showcaseDragMove(stepPx) { const d = stepPx * 0.011; scYaw += d; scYawVel = d; }
export function showcaseDragEnd() { scDragging = false; }
export function resetShowcaseYaw() { scYaw = 0; scYawVel = 0; scIdle = 0; }
// Default framing is AUTO-FIT to the dragon's real mesh bounds, so the full
// wingspan + tail show the instant the modal opens — no manual zoom-out needed.
// scBaseDist / scLookY are recomputed per dragon in setShowcaseDef.
let scBaseDist = 9, scLookY = 0.3;
// Pinch / wheel zoom: dolly the camera along its view ray (1 = the auto-fit
// framing that shows the whole dragon, >1 pushes in for detail, <1 pulls back
// further). Eased toward a target each frame so the gesture feels smooth.
let scZoom = 1, scZoomTarget = 1;
export function setShowcaseZoom(z) { scZoomTarget = Math.max(0.55, Math.min(z, 2.4)); }
export function getShowcaseZoom() { return scZoomTarget; }

// Tight bounds over the MESHES only (skips the huge soft corona/aura sprites that
// would otherwise dominate the fit) so the camera frames the actual creature.
const _tmpBox = new THREE.Box3();
function meshBounds(root) {
  const box = new THREE.Box3();
  box.makeEmpty();
  root.updateWorldMatrix(true, true);
  root.traverse((o) => {
    if (o.isMesh && o.geometry) {
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      _tmpBox.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      box.union(_tmpBox);
    }
  });
  return box;
}

function disposeGroup(group) {
  group.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
}

function ensureShowcase() {
  if (scRenderer) return;
  scRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  scRenderer.setSize(SC_SIZE, SC_SIZE);
  scRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  scRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  scScene = new THREE.Scene();
  // Same rear chase framing as the cards (so the dragon fits at any flap), just
  // rendered far larger, with a touch more headroom.
  scCamera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  scCamera.position.set(0, 1.3, 8.6);
  scCamera.lookAt(0, 0.3, 0);
  scCamera.layers.enable(1);   // show the plasma glow layer (see ensureRenderer)
  scScene.add(new THREE.HemisphereLight(0xbfdcff, 0x2e3448, 1.05));
  const key = new THREE.DirectionalLight(0xffe8c0, 2.1); key.position.set(3, 4.5, 5); scScene.add(key);
  const rim = new THREE.DirectionalLight(0x88b8ff, 1.1); rim.position.set(-4, 2, -3); scScene.add(rim);
  const fill = new THREE.DirectionalLight(0xd0f0ff, 0.42); fill.position.set(0, -2, 3); scScene.add(fill);
  // Cool back-rim raking the silhouette from behind, so the matte-black dragon
  // separates cleanly from the dark backdrop (a crisp edge, then a touch of bloom).
  const backRim = new THREE.DirectionalLight(0x59d8ff, 0.7); backRim.position.set(0, 1.2, -6); scScene.add(backRim);

  // Gentle HDR bloom — a soft halo on the bright plasma/eyes only (high threshold),
  // restrained so it lifts the dragon against the dark stage without washing it out.
  // Guarded behind the float-buffer support the HDR target needs; raw-render fallback.
  const gl = scRenderer.getContext();
  const canBloom = scRenderer.capabilities.isWebGL2 &&
    (gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
  if (canBloom) {
    const rt = new THREE.WebGLRenderTarget(SC_SIZE, SC_SIZE, { type: THREE.HalfFloatType, samples: 4 });
    scComposer = new EffectComposer(scRenderer, rt);
    scComposer.addPass(new RenderPass(scScene, scCamera));
    scComposer.addPass(new UnrealBloomPass(new THREE.Vector2(SC_SIZE, SC_SIZE), 0.2, 0.45, 1.0));
    scComposer.addPass(new OutputPass());
    scComposer.setPixelRatio(scRenderer.getPixelRatio());
    scComposer.setSize(SC_SIZE, SC_SIZE);
  }
}

// Build (or rebuild, for form cycling) the showcased dragon into `canvas`.
export function setShowcaseDef(canvas, def) {
  ensureShowcase();
  if (scItem) { scScene.remove(scItem.group); disposeGroup(scItem.group); }
  const result = buildDragonModel(def, { preview: true });
  scScene.add(result.group);
  scItem = { canvas, ctx: canvas.getContext('2d'), group: result.group, tick: makePreviewTick(def, result) };

  // Auto-fit: pull the camera back just far enough that the widest wings + tail
  // sit inside the frame at the broad rest pose — the full silhouette shows the
  // instant the modal opens, no manual zoom-out. previewScale (Radiant = 1)
  // biases how much the form FILLS the frame (apex fills it, hatchling sits
  // smaller with air around it) without ever cropping.
  resetShowcaseYaw();   // every dragon opens facing the camera
  const box = meshBounds(result.group);
  if (box.isEmpty()) { scBaseDist = 9; scLookY = 0.3; }
  else {
    const halfW = Math.max(Math.abs(box.min.x), Math.abs(box.max.x));
    const halfD = Math.max(Math.abs(box.min.z), Math.abs(box.max.z));
    // Worst-case horizontal extent at ANY turntable yaw (the bounding cylinder
    // radius) so the dragon never clips while it spins a full 360°.
    const halfWide = Math.hypot(halfW, halfD);
    scLookY = (box.min.y + box.max.y) / 2;
    const halfH = Math.max(box.max.y - scLookY, scLookY - box.min.y);
    const fovR = scCamera.fov * Math.PI / 180;
    const fit = Math.max(halfWide, halfH * 0.92) / Math.tan(fovR / 2);
    const ps = Math.min(1.22, Math.max(0.6, def.model.previewScale ?? 1));
    scBaseDist = fit * (1.22 / ps) + 0.6;
  }

  // Character-select backdrop: a pretty atmospheric sky themed to the dragon's aura
  // (a night cloudscape we fly through), drifting motes + vignette. Rebuilt per
  // dragon so the theme colour follows it (Obsidian = cool cyan night).
  if (scBackdrop) scBackdrop.dispose();
  scBackdrop = buildShowcaseBackdrop(scScene, def.fx?.auraColor || '150,200,255');

  if (!scRaf) scRaf = requestAnimationFrame(scLoop);
}

function scLoop(now = performance.now()) {
  if (!scItem) { scRaf = 0; return; }
  scRaf = requestAnimationFrame(scLoop);
  const t = now / 1000;
  scItem.tick(t);
  if (scBackdrop) scBackdrop.tick(t);
  // 360° turntable: the user drags to spin; on release inertia carries it, then a
  // slow idle auto-rotate resumes so the stage stays alive.
  if (!scDragging) {
    scYaw += scYawVel;
    if (Math.abs(scYawVel) < 0.001) { scYawVel = 0; scIdle++; } else { scYawVel *= 0.93; scIdle = 0; }
    if (scIdle > 80) scYaw += 0.0024; // gentle idle turntable after a pause
  }
  scItem.group.rotation.y = scYaw;
  // Apply the eased zoom by dollying along the view ray toward the auto-fit frame.
  scZoom += (scZoomTarget - scZoom) * 0.22;
  const dist = scBaseDist / scZoom;
  scCamera.position.set(0, scLookY + dist * 0.16, dist); // rear, gently raised (top-rear)
  scCamera.lookAt(0, scLookY, 0);
  if (scComposer) scComposer.render();
  else scRenderer.render(scScene, scCamera);
  const c = scItem.canvas;
  scItem.ctx.clearRect(0, 0, c.width, c.height);
  scItem.ctx.drawImage(scRenderer.domElement, 0, 0, c.width, c.height);
}

export function closeShowcase() {
  if (scRaf) { cancelAnimationFrame(scRaf); scRaf = 0; }
  if (scItem) { scScene.remove(scItem.group); disposeGroup(scItem.group); scItem = null; }
  if (scBackdrop) { scBackdrop.dispose(); scBackdrop = null; }
  scZoom = scZoomTarget = 1; // reset framing for the next time the showcase opens
}
