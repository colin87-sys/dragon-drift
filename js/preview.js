import * as THREE from 'three';
import { makeGlowTexture } from './util.js';

// Live 3D shop previews: every dragon/rider card gets a little turntable —
// a compact procedural icon of the actual model (colors, horns, wings, aura)
// rendered into the card's <canvas>. One shared offscreen WebGL renderer is
// blitted into each card at ~30fps; the loop self-stops when the shop closes
// (canvases leave the DOM) and everything is disposed.

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
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0.7, 6.4);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xbfdcff, 0x2e3448, 1.0));
  const key = new THREE.DirectionalLight(0xffe0b0, 1.7);
  key.position.set(2.5, 3, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7fb8ff, 0.8);
  rim.position.set(-3, 1.5, -3);
  scene.add(rim);
}

const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.45, ...opts });

// Compact dragon bust: body + head + horns + two-tone wings + tail, all from
// the dragon def, so the icon really is the dragon you're buying.
function buildDragonIcon(def) {
  const g = new THREE.Group();
  const m = def.model;
  const bodyMat = mat(def.body, { emissive: def.body, emissiveIntensity: 0.18 });
  const bellyMat = mat(def.belly);
  const hornMat = mat(def.horn, { emissive: 0x6b3400, emissiveIntensity: 0.25, roughness: 0.25 });
  const scalesMat = mat(def.scales, { emissive: def.scales, emissiveIntensity: 0.3, metalness: 0.2 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.44, 1.6, 6, 10), bodyMat);
  body.rotation.x = Math.PI / 2;
  body.scale.set(0.85, 0.75, 1);
  g.add(body);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 8), bellyMat);
  chest.scale.set(0.9, 0.78, 1.0);
  chest.position.set(0, -0.12, -0.55);
  g.add(chest);

  // Head
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.46, 10, 8), bodyMat);
  skull.scale.set(1.2, 0.85, 1);
  head.add(skull);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.85, 7), bodyMat);
  snout.rotation.x = -Math.PI / 2;
  snout.position.set(0, -0.06, -0.62);
  head.add(snout);
  const eyeMat = mat(0x223344, { emissive: def.eye, emissiveIntensity: 2.4 });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), eyeMat);
    eye.position.set(0.2 * s, 0.12, -0.3);
    head.add(eye);
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, m.hornLen * 0.55, 5), hornMat);
    horn.position.set(0.26 * s, 0.32, 0.18);
    horn.rotation.x = 0.7;
    horn.rotation.z = s * -0.2;
    head.add(horn);
    if (m.hornPairs > 1) {
      const horn2 = new THREE.Mesh(new THREE.ConeGeometry(0.07, m.hornLen * 0.34, 5), hornMat);
      horn2.position.set(0.16 * s, 0.3, 0.36);
      horn2.rotation.x = 1.0;
      head.add(horn2);
    }
  }
  head.position.set(0, 0.35, -1.55);
  g.add(head);

  // Back ridge density hints at the real ridgeCount
  for (let i = 0; i < Math.min(5, Math.round(m.ridgeCount / 3)); i++) {
    const ridge = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 4), scalesMat);
    ridge.rotation.x = -Math.PI / 2;
    ridge.position.set(0, 0.45 - i * 0.02, -0.9 + i * 0.42);
    g.add(ridge);
  }

  // Two-tone membrane wings (inner gradient root, outer tip), flapped in tick
  const innerMat = mat(def.wingInner, { emissive: def.wingEmissive, emissiveIntensity: 0.35, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
  const outerMat = mat(def.wingOuter, { emissive: def.wingEmissive, emissiveIntensity: 0.25, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
  const ws = m.wingScale;
  const wingPivots = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.3, 0.28, -0.5);
    const root = new THREE.Mesh(new THREE.ShapeGeometry(wingShape()), innerMat);
    root.scale.set(s * 0.85 * ws, 0.85 * ws, 1);
    root.rotation.x = -Math.PI / 2;
    pivot.add(root);
    const tip = new THREE.Mesh(new THREE.ShapeGeometry(wingShape()), outerMat);
    tip.scale.set(s * 0.5 * ws, 0.55 * ws, 1);
    tip.rotation.x = -Math.PI / 2;
    tip.position.set(s * 1.35 * ws, 0.05, -0.1);
    pivot.add(tip);
    g.add(pivot);
    wingPivots.push({ pivot, s });
  }

  // Tail length scales with the real segment count
  let r = 0.3;
  let z = 1.1;
  const tailSegs = [];
  for (let i = 0; i < Math.min(6, Math.round(m.tailSegments / 2)); i++) {
    const seg = new THREE.Mesh(new THREE.ConeGeometry(r, 0.75, 6), bodyMat);
    seg.rotation.x = Math.PI / 2;
    seg.position.set(0, 0, z);
    g.add(seg);
    tailSegs.push(seg);
    z += 0.52;
    r *= 0.72;
  }

  // Aura halo + sparkles for the premium dragons — the flex is visible.
  let aura = null;
  if (def.fx.auraIdle > 0) {
    aura = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(def.fx.auraColor), transparent: true,
      opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    aura.scale.set(6.5, 6.5, 1);
    g.add(aura);
  }
  const sparkles = [];
  if (def.fx.sparkle) {
    const tex = makeGlowTexture(def.fx.auraColor);
    for (let i = 0; i < 5; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: 0.9,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      sp.scale.set(0.3, 0.3, 1);
      g.add(sp);
      sparkles.push(sp);
    }
  }

  g.scale.setScalar(0.92 * m.scale);
  g.position.y = 0.1;

  const tick = (t) => {
    g.rotation.y = t * 0.7;
    const flap = Math.sin(t * 4.2 * m.flapBias) * 0.5;
    for (const { pivot, s } of wingPivots) pivot.rotation.z = s * (flap - 0.15);
    for (let i = 0; i < tailSegs.length; i++) {
      tailSegs[i].position.x = Math.sin(t * 2.4 - i * 0.6) * 0.07 * (i + 1);
    }
    head.rotation.y = Math.sin(t * 0.9) * 0.18;
    if (aura) aura.material.opacity = 0.3 + def.fx.auraIdle + Math.sin(t * 2.6) * 0.12;
    for (let i = 0; i < sparkles.length; i++) {
      const a = t * 1.4 + (i / sparkles.length) * Math.PI * 2;
      sparkles[i].position.set(Math.cos(a) * 1.9, Math.sin(a * 1.7) * 1.1 + 0.2, Math.sin(a) * 1.9);
      sparkles[i].material.opacity = 0.5 + Math.sin(t * 6 + i * 2) * 0.4;
    }
  };
  return { group: g, tick };
}

function wingShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.5, 0.35, 1.3, 0.55, 1.8, 0.4);
  s.lineTo(2.2, -0.1);
  s.bezierCurveTo(1.5, -0.55, 0.7, -0.7, 0.2, -0.5);
  s.lineTo(0, -0.2);
  return s;
}

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
    item.ctx.clearRect(0, 0, SIZE, SIZE);
    item.ctx.drawImage(renderer.domElement, 0, 0, SIZE, SIZE);
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
    const built = canvas.dataset.kind === 'dragon' ? buildDragonIcon(def) : buildRiderIcon(def);
    items.push({
      canvas, ctx: canvas.getContext('2d'),
      group: built.group, tick: built.tick,
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
  const built = kind === 'dragon' ? buildDragonIcon(def) : buildRiderIcon(def);
  items.push({
    canvas, ctx: canvas.getContext('2d'),
    group: built.group, tick: built.tick,
    phase: Math.random() * 6,
  });
  if (!rafId) rafId = requestAnimationFrame(loop);
}
