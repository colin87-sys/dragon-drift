// Asset-backed dragon path (the `aether` experiment) — load a GLB mesh and
// return the SAME { group, parts, materials, auraSprite } contract the engine
// (dragon.js / preview.js) expects, so nothing downstream changes. The roster is
// otherwise 100% procedural; this coexists behind `def.meshUrl` and never runs
// for a procedural dragon.
//
// HOW THE FLAP STAYS GAMEPLAY-REACTIVE (Plan A): we build an empty shoulder→
// elbow→wrist scaffold and expose it as parts.wingRigL/R — the exact shape the
// existing `if (wingRigL)` branch in dragon.js drives via flapWing(). The GLB's
// wing geometry is re-parented under that scaffold, so the shipped, gameplay-
// reactive wingbeat (speed/boost/steer/climb) animates the AI mesh for free, no
// new animation code. A skinned GLB instead plays its baked AnimationClip via an
// AnimationMixer (parts.glbAnim.mixer, ticked by dragon.js) as a fallback.
//
// HEADLESS-SAFE: GLTFLoader is imported DYNAMICALLY and only in a real browser
// (http/https). In Node (tricount/blueprint/flapcheck) this returns the light
// placeholder silhouette synchronously and never touches the DOM.

import * as THREE from 'three';
import { makeGlowTexture } from './util.js';
import { applyFresnelRim } from './surface.js';

// --- module cache: url -> Promise<gltf> (one parse shared by game + preview) ---
const _cache = new Map();
let _loaderP = null;

function inBrowser() {
  return typeof document !== 'undefined' && typeof location !== 'undefined' &&
    typeof location.protocol === 'string' && /^https?:$/.test(location.protocol);
}
function getLoader() {
  if (!_loaderP) _loaderP = import('../lib/loaders/GLTFLoader.js').then((m) => new m.GLTFLoader());
  return _loaderP;
}
// Preload + parse a GLB once. Safe to call early (on dragon select) to avoid a
// pop when the run starts. Resolves to the parsed gltf, or null when not in a
// browser. Errors resolve to null (the placeholder silhouette stays).
export function preloadDragonAsset(url) {
  if (!url || !inBrowser()) return Promise.resolve(null);
  if (!_cache.has(url)) {
    _cache.set(url, getLoader()
      .then((loader) => loader.loadAsync(url))
      .catch((e) => { console.warn('[dragonGlb] load failed', url, e); return null; }));
  }
  return _cache.get(url);
}

// Empty shoulder→elbow→wrist scaffold at a wing root. flapWing() rotates these;
// the GLB wing geometry rides under .shoulder. Positions match the placeholder
// wing-node translations so a re-parented wing pivots at the shoulder. A real
// asset tunes these via def.glb.shoulder.
function makeWingRig(side, sh) {
  const shoulder = new THREE.Group();
  shoulder.position.set(side * sh[0], sh[1], sh[2]);
  const elbow = new THREE.Group(); elbow.position.set(side * 0.5, 0, 0);
  const wrist = new THREE.Group(); wrist.position.set(side * 0.5, 0, 0);
  elbow.add(wrist); shoulder.add(elbow);
  return { shoulder, elbow, wrist, side, profile: null };
}

const findFirst = (root, re) => {
  let hit = null;
  root.traverse((o) => { if (!hit && re.test(o.name || '')) hit = o; });
  return hit;
};
const anySkinned = (root) => {
  let s = false;
  root.traverse((o) => { if (o.isSkinnedMesh) s = true; });
  return s;
};

export function buildGlbDragon(def, opts = {}) {
  const model = def.model || {};
  const cfg = def.glb || {};
  const sh = cfg.shoulder || [0.26, 0.18, 0.0];     // [xAbs, y, z] of each shoulder pivot

  const group = new THREE.Group();

  // Animation rig — STABLE references captured once by dragon.js; the visual is
  // swapped in under them when the GLB resolves.
  const wingRigL = makeWingRig(-1, sh);
  const wingRigR = makeWingRig(1, sh);
  group.add(wingRigL.shoulder, wingRigR.shoulder);

  const head = new THREE.Group();
  head.position.set(0, cfg.headAt ? cfg.headAt[1] : 0.1, cfg.headAt ? cfg.headAt[2] : 1.15);
  group.add(head);

  const riderSocket = new THREE.Group();
  riderSocket.position.set(0, (cfg.riderAt && cfg.riderAt[1]) || 0.35, (cfg.riderAt && cfg.riderAt[2]) || -0.1);
  group.add(riderSocket);

  // Materials — dummies for the rim/Surge/eye hooks dragon.js drives. Tinting on
  // a PBR GLB is reduced (documented tradeoff); these keep the existing emissive
  // animation harmless and also shade the placeholder silhouette.
  const bodyMat = new THREE.MeshStandardMaterial({ color: def.body ?? 0x1c3a42, roughness: 0.6, metalness: 0.2, emissive: def.body ?? 0x103038, emissiveIntensity: 0.12 });
  if (def.bodyRoughness != null) bodyMat.roughness = def.bodyRoughness;
  applyFresnelRim(bodyMat, def.apexSeam || def.eye || 0x66ddee);
  const wingMat = new THREE.MeshStandardMaterial({ color: def.wingInner ?? 0x2a6e76, roughness: 0.7, metalness: 0.1, transparent: true, opacity: 0.96, side: THREE.DoubleSide });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x223344, emissive: def.eye ?? 0x8fe7ff, emissiveIntensity: 2.2 });

  // Light placeholder silhouette (also the headless representation) — hidden the
  // moment the real GLB is parented in.
  const placeholder = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 1.8), bodyMat);
  placeholder.add(body);
  const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.5), bodyMat);
  head.add(headBox);
  const mkWing = (s) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0.25, s * 1.5, 0.05, 0.5, s * 1.4, 0.05, -0.6, 0, 0, -0.35,
    ], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals();
    return new THREE.Mesh(g, wingMat);
  };
  wingRigL.shoulder.add(mkWing(-1));
  wingRigR.shoulder.add(mkWing(1));
  group.add(placeholder);

  // Aura sprite — dragon.js dereferences this UNCONDITIONALLY (fever/idle halo).
  const auraSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(def.fx?.auraColor || '142,213,255'), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  auraSprite.scale.set(9, 9, 1);
  auraSprite.layers.set(1);
  group.add(auraSprite);

  group.scale.setScalar(model.scale || 1);

  // Holder ticked by dragon.js every frame (set only for a baked-clip GLB).
  const glbAnim = { mixer: null };

  // --- async swap-in (browser only) ---------------------------------------
  if (inBrowser() && def.meshUrl) {
    preloadDragonAsset(def.meshUrl).then((gltf) => {
      if (!gltf || !gltf.scene) return;
      const skinned = anySkinned(gltf.scene);
      let content;
      if (skinned) {
        // Skinned: clone preserving the skeleton, add static, drive via a mixer.
        return import('../lib/utils/SkeletonUtils.js').then((SU) => {
          content = SU.clone(gltf.scene);
          applyGlbTransform(content, cfg);
          group.add(content);
          placeholder.visible = false;
          if (gltf.animations && gltf.animations.length) {
            const mixer = new THREE.AnimationMixer(content);
            mixer.clipAction(gltf.animations[0]).play();
            glbAnim.mixer = mixer;       // dragon.js ticks this (baked-flap fallback)
          }
        });
      }
      // Non-skinned: re-parent the wing nodes under the flap scaffold so the
      // shipped reactive wingbeat drives them; body/head ride the root.
      content = gltf.scene.clone(true);
      applyGlbTransform(content, cfg);
      const wl = findFirst(content, /wing.?l\b|wing_l|leftwing/i);
      const wr = findFirst(content, /wing.?r\b|wing_r|rightwing/i);
      const reparent = (node, rig) => {
        if (!node) return;
        node.position.set(0, 0, 0); node.rotation.set(0, 0, 0); node.scale.set(1, 1, 1);
        rig.shoulder.add(node);
      };
      reparent(wl, wingRigL);
      reparent(wr, wingRigR);
      const hn = findFirst(content, /^head$/i);
      if (hn) { hn.position.set(0, 0, 0); head.add(hn); }
      group.add(content);            // remaining nodes (body, etc.) ride the root
      placeholder.visible = false;
    });
  }

  const parts = {
    head, tailSegs: [], tailFins: [], spineSegs: [], bodySegs: null, tailOrbiters: null,
    riderSocket, wingRigL, wingRigR, coreGlow: null, glbAnim,
    // legacy hookpoints left undefined on purpose — every consumer guards them
    // (the wingRig path is taken, wingPivot2/tipMarker are `if`-guarded).
  };
  const materials = { bodyMat, wingMat, eyeMat, spineMats: [] };

  if (opts.preview) {
    const wrapper = new THREE.Group();
    wrapper.add(group);
    return { group: wrapper, parts, materials, auraSprite };
  }
  return { group, parts, materials, auraSprite };
}

// scale / rotation(yaw) / offset to fit the GLB into the game's space + facing.
function applyGlbTransform(content, cfg) {
  const s = cfg.scale ?? 1;
  content.scale.multiplyScalar(s);
  if (cfg.rotY) content.rotation.y += cfg.rotY;
  if (cfg.offset) content.position.set(cfg.offset[0] || 0, cfg.offset[1] || 0, cfg.offset[2] || 0);
}
