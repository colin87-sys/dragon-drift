// Live turntable previews for shop cards: one shared offscreen renderer
// blitted into each card's <canvas> at ~30fps. Self-stops when the cards
// leave the DOM. Weapons spin slowly; armor cards show a mini hero wearing
// the full set.

import * as THREE from 'three';
import { WEAPONS, ARMOR_SETS, ARMOR_BUILDERS, ARMOR_SLOTS } from './gear.js';

const SIZE = 160;
let renderer = null;
let scene = null;
let camera = null;
let items = [];
let rafId = 0;
let last = 0;

function ensure() {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(SIZE, SIZE);
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, 0.9, 6.8);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x1a2030, 1.1));
  const key = new THREE.DirectionalLight(0xfff0d8, 1.6);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7fa8ff, 0.9);
  rim.position.set(-4, 2, -3);
  scene.add(rim);
}

// Mini hero bust in a full armor set — proportions echo hero.js.
function buildHeroMini(setId) {
  const g = new THREE.Group();
  const pal = ARMOR_SETS[setId].palette;
  const suit = new THREE.MeshStandardMaterial({
    color: pal.suit, roughness: 0.7, emissive: pal.suitEmissive, emissiveIntensity: 0.4,
  });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd9b59a, roughness: 0.6 });

  const pivots = {};
  const hips = new THREE.Group(); g.add(hips);
  const torso = new THREE.Group(); torso.position.y = 0.34; hips.add(torso);
  const headPivot = new THREE.Group(); headPivot.position.y = 0.44; torso.add(headPivot);
  hips.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), suit));
  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.26, 4, 8), suit);
  chest.position.y = 0.12;
  torso.add(chest);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 9, 7), skin);
  head.position.y = 0.05;
  headPivot.add(head);
  const mkLimb = (x, y, r, len, parent) => {
    const grp = new THREE.Group();
    grp.position.set(x, y, 0);
    parent.add(grp);
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 7), suit);
    mesh.position.y = -len * 0.55;
    grp.add(mesh);
    return grp;
  };
  pivots.hips = hips;
  pivots.torso = torso;
  pivots.headPivot = headPivot;
  pivots.armR = mkLimb(0.26, 0.28, 0.062, 0.55, torso);
  pivots.armL = mkLimb(-0.26, 0.28, 0.062, 0.55, torso);
  pivots.armR.rotation.z = -0.25;
  pivots.armL.rotation.z = 0.25;
  pivots.legR = mkLimb(0.1, -0.12, 0.07, 0.6, hips);
  pivots.legL = mkLimb(-0.1, -0.12, 0.07, 0.6, hips);

  for (const slot of ARMOR_SLOTS) ARMOR_BUILDERS[slot](pivots, setId, pal);
  g.position.y = 0.1;
  g.scale.setScalar(1.5);
  return g;
}

// kind: { weapon: id, tier } | { armorSet: id }
export function attachPreview(canvas, kind) {
  ensure();
  let group;
  if (kind.weapon) {
    group = WEAPONS[kind.weapon].build(kind.tier || 1);
    group.position.y = -1.1;
    group.scale.setScalar(1.25);
  } else {
    group = buildHeroMini(kind.armorSet);
  }
  items.push({ canvas, ctx: canvas.getContext('2d'), group, weapon: !!kind.weapon });
  if (!rafId) loop();
}

export function clearPreviews() {
  for (const it of items) {
    it.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
  }
  items = [];
}

function loop(t = 0) {
  rafId = requestAnimationFrame(loop);
  // Stop when every canvas has left the DOM (shop closed).
  items = items.filter((it) => it.canvas.isConnected);
  if (!items.length) {
    cancelAnimationFrame(rafId);
    rafId = 0;
    return;
  }
  if (t - last < 33) return; // ~30fps
  last = t;
  for (const it of items) {
    scene.add(it.group);
    it.group.rotation.y += 0.016;
    if (it.weapon) it.group.rotation.z = 0.35;
    renderer.render(scene, camera);
    scene.remove(it.group);
    it.ctx.clearRect(0, 0, SIZE, SIZE);
    it.ctx.drawImage(renderer.domElement, 0, 0);
  }
}
