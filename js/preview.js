import * as THREE from 'three';
import { makeGlowTexture } from './util.js';
import { buildDragonModel, makePreviewTick } from './dragonModel.js';

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
  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0.7, 7.5);
  camera.lookAt(0, 0.2, 0);
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

// Rider bust on a floating saddle disc: outfit, hair, signature accessory
// and glow, true to the def.
function buildRiderIcon(def) {
  const g = new THREE.Group();
  const suitMat = mat(def.suit, {
    metalness: def.suitMetal, roughness: 0.75 - def.suitMetal * 0.4,
    emissive: def.suitEmissive, emissiveIntensity: 0.5,
  });
  const cloakMat = mat(def.cloak, { emissive: def.cloakEmissive, emissiveIntensity: 0.35, roughness: 0.7 });
  const scarfMat = mat(def.scarf, { emissive: def.scarf, emissiveIntensity: 0.22 });
  const hairMat = mat(def.hair, { roughness: 0.9 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.85, 4, 8), suitMat);
  torso.rotation.x = -0.18;
  g.add(torso);
  const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.52, 1.35, 6), cloakMat);
  cloak.position.set(0, -0.1, 0.38);
  cloak.rotation.x = -0.55;
  g.add(cloak);
  const headM = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), suitMat);
  headM.position.set(0, 0.92, -0.1);
  g.add(headM);
  const scarf = new THREE.Mesh(new THREE.ConeGeometry(0.11, 1.1, 4), scarfMat);
  scarf.position.set(0.1, 0.45, 0.45);
  scarf.rotation.x = -0.7;
  g.add(scarf);
  // Ponytail arc — length follows the def
  const ponyN = Math.min(6, Math.round(def.ponySegs / 2));
  const pony = [];
  for (let i = 0; i < ponyN; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.13 * (1 - i / (ponyN + 2)), 6, 5), hairMat);
    b.position.set(0, 0.95 - i * 0.1, 0.25 + i * 0.16);
    g.add(b);
    pony.push(b);
  }
  // Saddle disc underneath
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.16, 10), mat(0x3a1b16, { roughness: 0.8 }));
  disc.position.y = -0.85;
  g.add(disc);

  let gem = null;
  if (def.accessory === 'banner') {
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.9, 0.05), mat(0x3a1b16));
    pole.position.set(-0.3, 0.55, 0.3);
    g.add(pole);
    const flag = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.8, 4), scarfMat);
    flag.position.set(-0.3, 1.5, 0.42);
    flag.rotation.z = Math.PI / 2;
    flag.scale.set(0.4, 1, 1);
    g.add(flag);
  } else if (def.accessory === 'visor') {
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.13, 0.16),
      mat(0x102030, { emissive: def.scarf, emissiveIntensity: 2.0, roughness: 0.2 })
    );
    visor.position.set(0, 0.96, -0.38);
    g.add(visor);
  } else if (def.accessory === 'hood') {
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.8, 6), cloakMat);
    hood.position.set(0, 1.12, 0);
    hood.rotation.x = 0.15;
    g.add(hood);
    gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.14, 0),
      mat(0x301840, { emissive: def.scarf, emissiveIntensity: 2.6, roughness: 0.2 })
    );
    gem.position.set(0, 1.75, -0.1);
    g.add(gem);
  }

  let glow = null;
  if (def.glowColor) {
    glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(def.glowColor), transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    glow.scale.set(4.5, 4.5, 1);
    glow.position.set(0, 0.4, -0.2);
    g.add(glow);
  }

  g.position.y = -0.15;
  const tick = (t) => {
    g.rotation.y = t * 0.7;
    g.position.y = -0.15 + Math.sin(t * 1.8) * 0.06;
    scarf.rotation.z = Math.sin(t * 3.2) * 0.2;
    for (let i = 0; i < pony.length; i++) {
      pony[i].position.x = Math.sin(t * 2.6 - i * 0.7) * 0.05 * i;
    }
    if (gem) {
      gem.position.y = 1.75 + Math.sin(t * 2.4) * 0.08;
      gem.rotation.y = t * 2.4;
    }
    if (glow) glow.material.opacity = 0.32 + Math.sin(t * 3) * 0.12;
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
      const result = buildDragonModel(def);
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
export function attachPreviewCanvas(canvas, kind, def) {
  if (!def) return;
  ensureRenderer();
  let group, tick;
  if (kind === 'dragon') {
    const result = buildDragonModel(def);
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
