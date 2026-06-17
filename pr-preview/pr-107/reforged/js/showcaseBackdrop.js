import * as THREE from 'three';
import { makeGlowTexture } from './util.js';

// ── Showcase backdrop ─────────────────────────────────────────────────────────
// The pretty, atmospheric world behind the inspect-showcase dragon — instead of an
// abstract gradient, we render the game's OWN sky (the world is beautiful, so put
// the dragon in it). A self-contained sky DOME using the exact in-game sky shader
// (environment.js) — gradient horizon, a low sun glow, drifting aurora veil and a
// twinkling starfield — themed to the dragon, plus a field of drifting light motes.
//
// Self-contained on purpose: environment.js is a gameplay SINGLETON (module globals
// bound to the run scene), so reusing it for the showcase would hijack the in-game
// world. We replicate just the sky + motes here, owning our own meshes.
//
// The hard rule (learned the washout way): keep it DARK. The dragon is front-lit and
// must POP against the world, never be silhouetted against a bright sky/sun.

// The in-game sky shader, verbatim (environment.js) so the showcase sky matches the
// world the player flies through.
const SKY_VERT = `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
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

export function buildShowcaseBackdrop(scene, themeRgb = '150,200,255') {
  const [r, g, b] = themeRgb.split(',').map(Number);
  const aura = new THREE.Color(r / 255, g / 255, b / 255);

  // Night-sky palette: a deep blue dome with the dragon's aura tinting the horizon
  // glow + a faint moon glow — dark enough that the front-lit dragon pops.
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x060b16) },
      midColor: { value: new THREE.Color(0x0a1322) },
      horizonColor: { value: aura.clone().multiplyScalar(0.12) },
      sunGlow: { value: aura.clone().multiplyScalar(0.22) },
      sunDir: { value: new THREE.Vector3(0.45, 0.06, -1).normalize() }, // low, off to the side
      feverMix: { value: 0 },
      starMix: { value: 1 },     // night → starfield + aurora veil
      time: { value: 0 },
    },
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(60, 24, 16), skyMat);
  sky.frustumCulled = false;
  scene.add(sky);

  // Drifting motes — floating dust/embers in the night air, additive + dim, spread
  // through a volume BEHIND and around the dragon (biased back so they never occlude
  // the hero), each rising slowly and twinkling on its own phase.
  const moteTex = makeGlowTexture(themeRgb);
  const motes = new THREE.Group();
  const data = [];
  const N = 60;
  const SPAN_Y = 5.5;
  for (let i = 0; i < N; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({
      map: moteTex, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, opacity: 0.1 + Math.random() * 0.26,
    }));
    m.scale.setScalar(0.05 + Math.random() * 0.18);
    m.position.set(
      (Math.random() * 2 - 1) * 7,
      (Math.random() * 2 - 1) * SPAN_Y,
      -1.5 - Math.random() * 8,        // behind the dragon
    );
    motes.add(m);
    data.push({
      m, baseOp: m.material.opacity,
      rise: 0.08 + Math.random() * 0.2,  // units / second
      tw: Math.random() * Math.PI * 2,
      sway: 0.2 + Math.random() * 0.4,
      x0: m.position.x,
    });
  }
  scene.add(motes);

  let last = 0;
  const tick = (t) => {
    skyMat.uniforms.time.value = t;
    const dt = last ? Math.min(t - last, 0.05) : 0.016;
    last = t;
    for (const d of data) {
      d.m.position.y += d.rise * dt;
      if (d.m.position.y > SPAN_Y) d.m.position.y = -SPAN_Y;       // wrap, endless drift
      d.m.position.x = d.x0 + Math.sin(t * 0.3 + d.tw) * d.sway;   // lazy lateral sway
      d.m.material.opacity = d.baseOp * (0.55 + 0.45 * Math.sin(t * 0.8 + d.tw));
    }
  };

  const dispose = () => {
    scene.remove(sky);
    sky.geometry.dispose();
    skyMat.dispose();
    scene.remove(motes);
    for (const d of data) d.m.material.dispose();
    moteTex.dispose();
  };

  return { tick, dispose };
}
