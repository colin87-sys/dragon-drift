import * as THREE from 'three';
import { makeGlowTexture } from './util.js';

// ── Showcase backdrop ─────────────────────────────────────────────────────────
// The pretty, atmospheric stage behind the inspect-showcase dragon — the
// character-select look from Genshin / Honkai: Star Rail / Wuthering Waves:
//
//   1. a soft SKY gradient themed to the dragon (a night cloudscape we "fly
//      through"), faint nebula lift + sparse stars,
//   2. a field of slowly DRIFTING light motes for depth + life,
//   3. a VIGNETTE so the eye lands on the dragon.
//
// The hard rule learned the painful way: keep it DARK and low-contrast. The dragon
// is lit from the front and must POP against the backdrop — never be silhouetted
// against a bright pool. So every element here stays dim and recedes.
//
// buildShowcaseBackdrop(scene, themeRgb) → { tick(t), dispose() }. One per showcase;
// rebuilt per dragon so the theme colour follows the dragon's aura.

function makeSkyTexture(rgb) {
  const [r, g, b] = rgb.split(',').map(Number);
  const W = 512, H = 512;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const cx = cv.getContext('2d');

  // Base vertical sky gradient — deep night, with only a faint aura lift at the
  // horizon band (behind where the dragon stands).
  const lift = (v, lo) => Math.round(v * 0.05 + lo);
  const lin = cx.createLinearGradient(0, 0, 0, H);
  lin.addColorStop(0, 'rgb(5,7,12)');
  lin.addColorStop(0.58, `rgb(${lift(r, 7)},${lift(g, 10)},${lift(b, 15)})`);
  lin.addColorStop(1, 'rgb(3,4,8)');
  cx.fillStyle = lin; cx.fillRect(0, 0, W, H);

  // Soft nebula bloom low-centre — a gentle pool of the theme colour deep behind
  // the dragon (kept very low alpha so it reads as distance haze, not a spotlight).
  const neb = cx.createRadialGradient(W / 2, H * 0.6, 24, W / 2, H * 0.6, W * 0.52);
  neb.addColorStop(0, `rgba(${r},${g},${b},0.13)`);
  neb.addColorStop(1, `rgba(${r},${g},${b},0)`);
  cx.fillStyle = neb; cx.fillRect(0, 0, W, H);

  // Sparse faint stars across the upper sky.
  cx.fillStyle = '#fff';
  for (let i = 0; i < 74; i++) {
    cx.globalAlpha = 0.16 + Math.random() * 0.4;
    cx.beginPath();
    cx.arc(Math.random() * W, Math.random() * H * 0.72, Math.random() * 1.1, 0, Math.PI * 2);
    cx.fill();
  }
  cx.globalAlpha = 1;

  // Vignette — darken the corners so the gaze settles on the dragon.
  const vig = cx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.58)');
  cx.fillStyle = vig; cx.fillRect(0, 0, W, H);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildShowcaseBackdrop(scene, themeRgb = '150,200,255') {
  const background = makeSkyTexture(themeRgb);
  scene.background = background;

  // Drifting motes — a shared glow texture, additive, dim. Spread through a volume
  // BEHIND and around the dragon (biased back so they never occlude the hero), each
  // rising slowly and twinkling on its own phase.
  const moteTex = makeGlowTexture(themeRgb);
  const motes = new THREE.Group();
  const data = [];
  const N = 56;
  const SPAN_Y = 5.5;
  for (let i = 0; i < N; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({
      map: moteTex, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, opacity: 0.1 + Math.random() * 0.28,
    }));
    m.scale.setScalar(0.06 + Math.random() * 0.2);
    m.position.set(
      (Math.random() * 2 - 1) * 7,
      (Math.random() * 2 - 1) * SPAN_Y,
      -2 - Math.random() * 7,          // behind the dragon
    );
    motes.add(m);
    data.push({
      m, baseOp: m.material.opacity,
      rise: 0.10 + Math.random() * 0.22, // units / second
      tw: Math.random() * Math.PI * 2,   // twinkle phase
      sway: 0.2 + Math.random() * 0.4,
      x0: m.position.x,
    });
  }
  scene.add(motes);

  let last = 0;
  const tick = (t) => {
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
    if (scene.background === background) scene.background = null;
    background.dispose();
    scene.remove(motes);
    for (const d of data) d.m.material.dispose();
    moteTex.dispose();
  };

  return { tick, dispose };
}
