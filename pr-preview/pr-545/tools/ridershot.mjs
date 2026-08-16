// Rider rear-view QA: builds every rider figure with the shared riderParts
// module and renders them in a row from the gameplay camera (behind + above,
// looking at the rider's back) so the silhouettes can be judged as they read
// in-game. →  /tmp/riders-rear.png
import { boot } from '../tests/browser.mjs';

const { page, done } = await boot({ viewport: { width: 1100, height: 360 }, deviceScaleFactor: 2 });

const dataUrl = await page.evaluate(async () => {
  const THREE = await import('three');
  const { RIDERS } = await import('/js/riders.js');
  const { buildRiderFigure, riderMaterials } = await import('/js/riderParts.js');

  const W = 1100, H = 360;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(2);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xbfdcff, 0x2e3448, 1.1));
  const key = new THREE.DirectionalLight(0xffe0b0, 1.7); key.position.set(2.5, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x7fb8ff, 0.8); rim.position.set(-3, 2, 4); scene.add(rim);

  // Rear gameplay framing: camera behind (+z) and above, looking at the back.
  const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 60);
  camera.position.set(0, 1.55, 6.4);
  camera.lookAt(0, 0.55, 0);

  const keys = Object.keys(RIDERS);
  const spread = 2.5;
  keys.forEach((k, i) => {
    const fig = buildRiderFigure(RIDERS[k], riderMaterials(RIDERS[k]));
    fig.group.scale.setScalar(1.55);
    fig.group.position.set((i - (keys.length - 1) / 2) * spread, 0, 0);
    scene.add(fig.group);
  });

  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
});

const b64 = dataUrl.split(',')[1];
const { writeFileSync } = await import('fs');
writeFileSync('/tmp/riders-rear.png', Buffer.from(b64, 'base64'));
console.log('wrote /tmp/riders-rear.png');
await done();
