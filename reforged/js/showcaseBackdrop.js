import * as THREE from 'three';
import { makeGlowTexture } from './util.js';
import { Reflector } from '../lib/objects/Reflector.js';

// ── Showcase backdrop ─────────────────────────────────────────────────────────
// The pretty, atmospheric WORLD behind the inspect-showcase dragon — we render the
// game's own ASTRAL SHALLOWS biome (the dark cosmos one: deep violet sky, aurora +
// stars, reflective water, dark monoliths) so the dragon stands in a real, on-brand
// scene rather than an abstract box.
//
// Self-contained on purpose: environment.js is a gameplay SINGLETON (module globals
// bound to the run scene), so reusing it for the showcase would hijack the in-game
// world. We replicate the biome's signature pieces here and own our own meshes:
//   • a sky DOME using the exact in-game sky shader (gradient + aurora + starfield),
//   • a REFLECTOR water plane that mirrors the dragon + sky (the biome's signature),
//   • dark monolith PILLARS + a few glowing crystal SHARDS rising from the water,
//   • a field of drifting light MOTES tinted to the dragon's aura.
//
// The hard rule (learned the washout way): keep it DARK. The dragon is front-lit and
// must POP against the world, never be silhouetted against a bright sky/sun.

// ASTRAL SHALLOWS palette (biomes.js) — the dark cosmos biome.
const ASTRAL = {
  top: 0x05081e, mid: 0x1a1450, horizon: 0x6a3ab0, sun: 0xcfe8ff,
  water: 0x060a24,
};

const SKY_VERT = `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
// The in-game sky shader, verbatim (environment.js).
const SKY_FRAG = `
  varying vec3 vDir;
  uniform vec3 topColor, midColor, horizonColor, sunGlow, sunDir;
  uniform float feverMix, starMix, time;
  void main() {
    vec3 d = normalize(vDir);
    float h = clamp(d.y, 0.0, 1.0);
    vec3 hor = mix(horizonColor, vec3(1.0, 0.35, 0.85), feverMix * 0.8);
    vec3 mid = mix(midColor, vec3(0.55, 0.25, 0.9), feverMix * 0.7);
    vec3 col = mix(hor, mid, smoothstep(0.0, 0.25, h));
    col = mix(col, topColor, smoothstep(0.2, 0.7, h));
    float s = max(dot(d, normalize(sunDir)), 0.0);
    col += sunGlow * (pow(s, 900.0) * 0.7 + pow(s, 10.0) * 0.16);
    float band1 = sin(d.x * 9.0 + time * 0.7 + d.y * 14.0);
    float band2 = sin(d.x * 5.0 - time * 0.45 + d.y * 9.0 + 2.1);
    float curtain = smoothstep(0.15, 0.65, h) * (0.5 + 0.5 * sin(time * 0.3));
    vec3 aurora = vec3(0.25, 0.95, 0.85) * max(band1, 0.0)
                + vec3(0.95, 0.3, 0.95) * max(band2, 0.0);
    col += aurora * curtain * feverMix * 0.35;
    vec3 cell = floor(d * 110.0);
    float sh = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    float star = smoothstep(0.9965, 1.0, sh)
               * (0.6 + 0.4 * sin(time * 2.0 + sh * 90.0))
               * smoothstep(0.04, 0.3, h);
    col += vec3(0.85, 0.9, 1.0) * star * starMix;
    col += aurora * smoothstep(0.2, 0.6, h) * starMix * 0.12;
    gl_FragColor = vec4(col, 1.0);
  }`;

export function buildShowcaseBackdrop(scene, themeRgb = '150,200,255', floorY = -2) {
  const [r, g, b] = themeRgb.split(',').map(Number);
  const group = new THREE.Group();           // everything except scene.fog lives here
  scene.add(group);

  // ── Sky dome (astral palette + stars + faint aurora veil) ──────────────────
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
    uniforms: {
      topColor: { value: new THREE.Color(ASTRAL.top) },
      midColor: { value: new THREE.Color(ASTRAL.mid) },
      horizonColor: { value: new THREE.Color(ASTRAL.horizon).multiplyScalar(0.5) },
      sunGlow: { value: new THREE.Color(ASTRAL.sun).multiplyScalar(0.25) },
      sunDir: { value: new THREE.Vector3(0.4, 0.05, -1).normalize() },
      feverMix: { value: 0 },
      starMix: { value: 1 },
      time: { value: 0 },
    },
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(60, 24, 16), skyMat);
  sky.frustumCulled = false;
  group.add(sky);

  // ── Reflective water (the biome's signature mirror) ────────────────────────
  // A Reflector mirrors the whole scene — the dragon + sky + pillars ripple in the
  // dark water below it. Tinted deep violet so the reflection stays moody, not bright.
  const water = new Reflector(new THREE.PlaneGeometry(120, 120), {
    textureWidth: 512, textureHeight: 512, color: 0x141a30, clipBias: 0.003,
  });
  water.rotation.x = -Math.PI / 2;
  water.position.y = floorY;
  group.add(water);

  // ── Monolith pillars rising from the water (dark silhouettes, biome 'monolith')
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x0a0c1a, roughness: 0.85, metalness: 0.2,
    emissive: new THREE.Color(ASTRAL.horizon).multiplyScalar(0.12),
  });
  const pillars = [];
  for (let i = 0; i < 15; i++) {
    // Scatter behind + to the sides; keep the central front clear of the dragon.
    let x, z;
    do { x = (Math.random() * 2 - 1) * 10; z = -3 - Math.random() * 15; }
    while (Math.abs(x) < 2.2 && z > -6);
    const hgt = 2.5 + Math.random() * 6.5;
    const wid = 0.25 + Math.random() * 0.5;
    const p = new THREE.Mesh(new THREE.BoxGeometry(wid, hgt, wid), pillarMat);
    p.position.set(x, floorY + hgt / 2, z);
    p.rotation.y = Math.random() * Math.PI;
    group.add(p);
    pillars.push(p);
  }

  // ── Floating crystal shards (biome 'arcshard') — faint cyan, slow bob/spin ──
  const shardMat = new THREE.MeshStandardMaterial({
    color: 0x12203a, emissive: new THREE.Color(r / 255, g / 255, b / 255),
    emissiveIntensity: 0.9, roughness: 0.35, metalness: 0.5,
  });
  const shards = [];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.16 + Math.random() * 0.16, 0), shardMat);
    s.position.set((Math.random() * 2 - 1) * 7, floorY + 0.6 + Math.random() * 3, -4 - Math.random() * 9);
    group.add(s);
    shards.push({ s, baseY: s.position.y, ph: Math.random() * 6.28 });
  }

  // ── Drifting motes (aura-tinted dust, foreground depth) ────────────────────
  const moteTex = makeGlowTexture(themeRgb);
  const motes = new THREE.Group();
  const data = [];
  const N = 52;
  const SPAN_Y = 5.5;
  for (let i = 0; i < N; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({
      map: moteTex, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, opacity: 0.1 + Math.random() * 0.24,
    }));
    m.scale.setScalar(0.05 + Math.random() * 0.16);
    m.position.set((Math.random() * 2 - 1) * 7, (Math.random() * 2 - 1) * SPAN_Y, -1 - Math.random() * 8);
    motes.add(m);
    data.push({ m, baseOp: m.material.opacity, rise: 0.08 + Math.random() * 0.18, tw: Math.random() * 6.28, sway: 0.2 + Math.random() * 0.4, x0: m.position.x });
  }
  group.add(motes);

  let last = 0;
  const tick = (t) => {
    skyMat.uniforms.time.value = t;
    const dt = last ? Math.min(t - last, 0.05) : 0.016;
    last = t;
    for (const d of data) {
      d.m.position.y += d.rise * dt;
      if (d.m.position.y > SPAN_Y) d.m.position.y = -SPAN_Y;
      d.m.position.x = d.x0 + Math.sin(t * 0.3 + d.tw) * d.sway;
      d.m.material.opacity = d.baseOp * (0.55 + 0.45 * Math.sin(t * 0.8 + d.tw));
    }
    for (const sh of shards) {
      sh.s.position.y = sh.baseY + Math.sin(t * 0.7 + sh.ph) * 0.18;
      sh.s.rotation.y = t * 0.5 + sh.ph;
      sh.s.rotation.x = Math.sin(t * 0.4 + sh.ph) * 0.3;
    }
  };

  const dispose = () => {
    scene.remove(group);
    sky.geometry.dispose(); skyMat.dispose();
    water.geometry.dispose(); water.dispose();   // Reflector.dispose() frees its RT + material
    pillarMat.dispose(); for (const p of pillars) p.geometry.dispose();
    shardMat.dispose(); for (const sh of shards) sh.s.geometry.dispose();
    for (const d of data) d.m.material.dispose();
    moteTex.dispose();
  };

  return { tick, dispose };
}
