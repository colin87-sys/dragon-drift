import * as THREE from 'three';
import { buildDragonModel, makePreviewTick } from './dragonModel.js';
import { makeGlowTexture } from './util.js';
import { Reflector } from '../lib/objects/Reflector.js';
import { EffectComposer } from '../lib/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../lib/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../lib/postprocessing/OutputPass.js';

// ── Menu stage ────────────────────────────────────────────────────────────────
// A DEDICATED, self-contained hero scene for the shop/menu — its own renderer, scene
// and a STATIC camera, fully decoupled from the gameplay loop (which it must never
// touch). Renders a crafted astral "character-select" backdrop — a milky-galaxy night
// sky, a moon, a horizon, reflective water — with the chosen dragon idling, centred,
// lit + rim-separated so it POPS against the sky regardless of its colour.
//
// Lifecycle (mirrors preview.js's separate-renderer pattern): openMenuStage() builds +
// starts the RAF loop on a full-viewport canvas layered behind the HUD; setMenuDragon()
// swaps the centred dragon (never the gameplay dragon); closeMenuStage() disposes it.

let renderer = null, scene = null, camera = null, composer = null, raf = 0, canvas = null;
let backdrop = null;          // { tick, dispose }
let dragonItem = null;        // { group, tick }
let stageVisible = true;      // dragon shown? (off on riders/music/style tabs)
let themeRgb = '150,200,255';

const SKY_VERT = `
  varying vec3 vDir;
  void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
// Milky-galaxy night sky: deep violet gradient, a soft diagonal MILKY-WAY band of dust
// + stars, a dense twinkling starfield, a faint aurora veil, and an edge vignette so
// the lit dragon reads against it. (Extends the in-game sky shader's ideas.)
const SKY_FRAG = `
  varying vec3 vDir;
  uniform vec3 topColor, midColor, horizonColor;
  uniform float time;
  float hash(vec3 p){ p = fract(p*0.3183 + 0.1); p += dot(p, p.yzx+19.19); return fract((p.x+p.y)*p.z); }
  void main(){
    vec3 d = normalize(vDir);
    float h = clamp(d.y, 0.0, 1.0);
    // base vertical gradient
    vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.35, h));
    col = mix(col, topColor, smoothstep(0.25, 0.85, h));
    // Milky-Way band: a soft diagonal dusty arc of brighter haze + concentrated stars
    float band = 1.0 - abs(dot(d, normalize(vec3(0.55, 0.45, -0.7))));
    float milk = smoothstep(0.82, 1.0, band);
    col += vec3(0.30, 0.34, 0.55) * milk * 0.5;
    // Starfield — hashed cells, denser inside the band, gentle twinkle.
    vec3 cell = floor(d * 140.0);
    float s = hash(cell);
    float star = smoothstep(0.992, 1.0, s) * (0.55 + 0.45*sin(time*1.6 + s*120.0));
    star *= smoothstep(0.02, 0.25, h) * (0.6 + milk*1.6);
    col += vec3(0.9, 0.94, 1.0) * star;
    // Faint aurora veil up high.
    float a1 = sin(d.x*7.0 + time*0.4 + d.y*11.0);
    float a2 = sin(d.x*4.0 - time*0.3 + d.y*7.0 + 2.1);
    vec3 aurora = vec3(0.25,0.85,0.8)*max(a1,0.0) + vec3(0.6,0.3,0.9)*max(a2,0.0);
    col += aurora * smoothstep(0.25, 0.7, h) * 0.06;
    // Edge vignette (darken the far corners so the centred dragon reads).
    col *= 1.0 - smoothstep(0.55, 1.2, length(d.xy)) * 0.35;
    gl_FragColor = vec4(col, 1.0);
  }`;

// ── Backdrop: sky dome + moon + reflective water + horizon + pillars + motes ────
function buildBackdrop(scn, rgb) {
  const [r, g, b] = rgb.split(',').map(Number);
  const aura = new THREE.Color(r / 255, g / 255, b / 255);
  const grp = new THREE.Group();
  scn.add(grp);

  // Sky dome (milky galaxy). Astral palette, dragon-tinted horizon glow.
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
    uniforms: {
      topColor: { value: new THREE.Color(0x05060f) },
      midColor: { value: new THREE.Color(0x140f2e) },
      horizonColor: { value: aura.clone().multiplyScalar(0.18).lerp(new THREE.Color(0x241a4a), 0.5) },
      time: { value: 0 },
    },
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(70, 32, 20), skyMat);
  sky.frustumCulled = false;
  grp.add(sky);

  // Moon — a soft bright disc + halo, upper-back, so it backlights the dragon and
  // streaks across the water.
  const moonDir = new THREE.Vector3(-0.5, 0.42, -1).normalize();
  const moonPos = moonDir.clone().multiplyScalar(52);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('230,240,255'), transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  moon.scale.setScalar(11);
  moon.position.copy(moonPos);
  grp.add(moon);
  const moonCore = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,255,255'), transparent: true, opacity: 1,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  moonCore.scale.setScalar(4.2);
  moonCore.position.copy(moonPos);
  grp.add(moonCore);

  // Reflective water — a Reflector at the horizon mirroring the sky/moon/dragon.
  const water = new Reflector(new THREE.PlaneGeometry(400, 400), {
    textureWidth: 1024, textureHeight: 1024, color: 0x0c1124, clipBias: 0.003,
  });
  water.rotation.x = -Math.PI / 2;
  water.position.y = -1.9;
  grp.add(water);

  // Monolith pillars rising from the water (distant, subtle — biome identity).
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x0a0c1a, roughness: 0.85, metalness: 0.2,
    emissive: aura.clone().multiplyScalar(0.1),
  });
  const pillars = [];
  for (let i = 0; i < 14; i++) {
    let x, z;
    do { x = (Math.random() * 2 - 1) * 24; z = -8 - Math.random() * 26; }
    while (Math.abs(x) < 3.5 && z > -12);
    const hgt = 4 + Math.random() * 9;
    const wid = 0.4 + Math.random() * 0.7;
    const p = new THREE.Mesh(new THREE.BoxGeometry(wid, hgt, wid), pillarMat);
    p.position.set(x, -1.9 + hgt / 2, z);
    p.rotation.y = Math.random() * Math.PI;
    grp.add(p);
    pillars.push(p);
  }

  // Drifting light motes (the tiny dots).
  const moteTex = makeGlowTexture(rgb);
  const motes = new THREE.Group();
  const motesData = [];
  for (let i = 0; i < 60; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({
      map: moteTex, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, opacity: 0.1 + Math.random() * 0.28,
    }));
    m.scale.setScalar(0.05 + Math.random() * 0.16);
    m.position.set((Math.random() * 2 - 1) * 10, -1 + Math.random() * 6, -1 - Math.random() * 12);
    motes.add(m);
    motesData.push({ m, baseOp: m.material.opacity, rise: 0.08 + Math.random() * 0.2, tw: Math.random() * 6.28, sway: 0.2 + Math.random() * 0.4, x0: m.position.x });
  }
  grp.add(motes);

  // Soft contrast pocket behind where the dragon stands — a backlight halo so the
  // dragon's silhouette reads against the sky (Pillar C2 pop).
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('120,150,210'), transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  halo.scale.set(10, 10, 1);
  halo.position.set(0, 0.6, -3.5);
  grp.add(halo);

  let last = 0;
  const tick = (t) => {
    skyMat.uniforms.time.value = t;
    const dt = last ? Math.min(t - last, 0.05) : 0.016; last = t;
    for (const d of motesData) {
      d.m.position.y += d.rise * dt;
      if (d.m.position.y > 5.5) d.m.position.y = -1.5;
      d.m.position.x = d.x0 + Math.sin(t * 0.3 + d.tw) * d.sway;
      d.m.material.opacity = d.baseOp * (0.55 + 0.45 * Math.sin(t * 0.8 + d.tw));
    }
  };
  const dispose = () => {
    scn.remove(grp);
    sky.geometry.dispose(); skyMat.dispose();
    water.geometry.dispose(); water.dispose();
    pillarMat.dispose(); for (const p of pillars) p.geometry.dispose();
    for (const d of motesData) d.m.material.dispose();
    moteTex.dispose();
    moon.material.dispose(); moonCore.material.dispose(); halo.material.dispose();
  };
  return { tick, dispose, moonDir };
}

function ensureStage() {
  if (renderer) return;
  canvas = document.createElement('canvas');
  canvas.id = 'menu-stage-canvas';
  // Layer behind the HUD (#screen is z-index 10) but above the gameplay canvas;
  // pointer-events off so the HUD + dragon rail receive all touches.
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:4;pointer-events:none;';
  document.body.appendChild(canvas);

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  scene = new THREE.Scene();

  // STATIC hero camera: straight-on, slightly above the water, looking level toward
  // the horizon so the moon sits upper-frame, horizon mid, water lower, dragon centred.
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  camera.position.set(0, 1.4, 9.2);
  camera.lookAt(0, 0.5, 0);

  // Lighting rig tuned for POP: warm KEY (front), cool FILL, bright back RIM.
  scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x14102a, 0.55));
  const key = new THREE.DirectionalLight(0xfff0d8, 2.1); key.position.set(3, 4, 6); scene.add(key);
  const fill = new THREE.DirectionalLight(0x88a8ff, 0.5); fill.position.set(-4, 1.5, 3); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xbfe6ff, 2.4); rim.position.set(-2, 3.5, -6); scene.add(rim);

  // Bloom (HDR) — soft, threshold high so only the dragon's bright plasma/eyes + the
  // moon bloom, not the whole sky. Guarded behind float-buffer support.
  const gl = renderer.getContext();
  const canBloom = renderer.capabilities.isWebGL2 &&
    (gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
  if (canBloom) {
    const rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(2, 2), 0.34, 0.5, 0.9));
    composer.addPass(new OutputPass());
  }
  resizeMenuStage();
  window.addEventListener('resize', resizeMenuStage);
}

export function resizeMenuStage() {
  if (!renderer) return;
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  if (composer) composer.setSize(w, h);
}

// Build / swap the centred dragon (a fresh idle build — never the gameplay dragon).
export function setMenuDragon(def) {
  ensureStage();
  if (dragonItem) { scene.remove(dragonItem.group); disposeGroup(dragonItem.group); dragonItem = null; }
  if (!def) return;
  const result = buildDragonModel(def, { preview: true });
  const grp = result.group;
  // Frame: scale + lift so the dragon fills the hero frame, centred just above the water.
  // Bound over MESHES only (skip the big soft aura/halo sprites that would inflate it).
  const box = new THREE.Box3(); box.makeEmpty();
  grp.updateWorldMatrix(true, true);
  const _b = new THREE.Box3();
  grp.traverse((o) => {
    if (o.isMesh && o.geometry) {
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      _b.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      box.union(_b);
    }
  });
  const size = new THREE.Vector3(); box.getSize(size);
  const span = Math.max(size.x, size.y, 1);
  const k = 4.6 / span;               // target on-screen size
  grp.scale.multiplyScalar(k);
  const c = box.getCenter(new THREE.Vector3()).multiplyScalar(k);
  grp.position.set(-c.x, 0.7 - c.y, -c.z);
  grp.rotation.y = -0.42;             // gentle 3/4 so the face + wing read
  scene.add(grp);

  const flap = makePreviewTick(def, result);
  const tick = (t) => {
    flap(t);
    // makePreviewTick floats/banks the group — overwrite to a calm, LEVEL hover so the
    // static hero shot stays composed (keep the gentle bob, drop the lazy bank/pitch).
    grp.position.y = (0.7 - c.y) + Math.sin(t * 1.3) * 0.06;
    grp.rotation.z = Math.sin(t * 0.5) * 0.015;
    grp.rotation.x = 0;
    grp.rotation.y = -0.42 + Math.sin(t * 0.35) * 0.05;
  };
  dragonItem = { group: grp, tick };
  grp.visible = stageVisible;
}

export function setMenuDragonVisible(v) {
  stageVisible = v;
  if (dragonItem) dragonItem.group.visible = v;
}

function loop(now = performance.now()) {
  if (!renderer) { raf = 0; return; }
  raf = requestAnimationFrame(loop);
  const t = now / 1000;
  if (backdrop) backdrop.tick(t);
  if (dragonItem) dragonItem.tick(t);
  if (composer) composer.render(); else renderer.render(scene, camera);
}

export function openMenuStage(def) {
  ensureStage();
  if (!backdrop) backdrop = buildBackdrop(scene, themeRgb);  // build once; tabs reuse it
  if (def) setMenuDragon(def);
  if (canvas) canvas.style.display = '';
  if (!raf) raf = requestAnimationFrame(loop);
}

export function isMenuStageActive() {
  return !!raf && !!canvas && canvas.style.display !== 'none';
}

export function closeMenuStage() {
  if (raf) { cancelAnimationFrame(raf); raf = 0; }
  if (dragonItem) { scene.remove(dragonItem.group); disposeGroup(dragonItem.group); dragonItem = null; }
  if (backdrop) { backdrop.dispose(); backdrop = null; }
  if (canvas) canvas.style.display = 'none';   // keep the renderer warm for reopen
}

function disposeGroup(group) {
  group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
}
