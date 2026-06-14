import * as THREE from 'three';
import { buildDragonModel, makePreviewTick } from './dragonModel.js';
import { buildRiderFigure, riderMaterials } from './riderParts.js';

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
const SC_SIZE = 480;
// Pinch / wheel zoom: dolly the camera along its view ray (1 = default framing,
// <1 pulls back to fit the full wingspan, >1 pushes in for detail). Eased toward
// a target each frame so the gesture feels smooth.
let scZoom = 1, scZoomTarget = 1;
export function setShowcaseZoom(z) { scZoomTarget = Math.max(0.55, Math.min(z, 2.4)); }
export function getShowcaseZoom() { return scZoomTarget; }

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
  scScene.add(new THREE.HemisphereLight(0xbfdcff, 0x2e3448, 1.05));
  const key = new THREE.DirectionalLight(0xffe8c0, 2.0); key.position.set(3, 4.5, 5); scScene.add(key);
  const rim = new THREE.DirectionalLight(0x88b8ff, 1.05); rim.position.set(-4, 2, -3); scScene.add(rim);
  const fill = new THREE.DirectionalLight(0xd0f0ff, 0.4); fill.position.set(0, -2, 3); scScene.add(fill);
}

// Build (or rebuild, for form cycling) the showcased dragon into `canvas`.
export function setShowcaseDef(canvas, def) {
  ensureShowcase();
  if (scItem) { scScene.remove(scItem.group); disposeGroup(scItem.group); }
  const result = buildDragonModel(def, { preview: true });
  scScene.add(result.group);
  scItem = { canvas, ctx: canvas.getContext('2d'), group: result.group, tick: makePreviewTick(def, result) };
  if (!scRaf) scRaf = requestAnimationFrame(scLoop);
}

function scLoop(now = performance.now()) {
  if (!scItem) { scRaf = 0; return; }
  scRaf = requestAnimationFrame(scLoop);
  const t = now / 1000;
  scItem.tick(t);
  scItem.group.rotation.y = Math.sin(t * 0.45) * 0.4; // gentle showcase orbit over the flap
  // Apply the eased zoom by dollying along the view ray toward the look target.
  scZoom += (scZoomTarget - scZoom) * 0.22;
  scCamera.position.set(0, 0.3 + 1.0 / scZoom, 8.6 / scZoom);
  scCamera.lookAt(0, 0.3, 0);
  scRenderer.render(scScene, scCamera);
  const c = scItem.canvas;
  scItem.ctx.clearRect(0, 0, c.width, c.height);
  scItem.ctx.drawImage(scRenderer.domElement, 0, 0, c.width, c.height);
}

export function closeShowcase() {
  if (scRaf) { cancelAnimationFrame(scRaf); scRaf = 0; }
  if (scItem) { scScene.remove(scItem.group); disposeGroup(scItem.group); scItem = null; }
  scZoom = scZoomTarget = 1; // reset framing for the next time the showcase opens
}
