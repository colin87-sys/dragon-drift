// Self-contained live preview of The Dawnfire Empress (phoenixEmpress) — bundled to ONE file
// (esbuild) so it can be hosted as a single page. Uses the SAME buildDragonModel + makePreviewTick
// the game/shop use, with the studio's ACES lit stage. Shows MOTION (wingbeat, train sway, core
// pulse), form switching f0–f3, drag-orbit, and an approximate Rebirth-Surge pulse.
import * as THREE from 'three';
import { DRAGONS } from './js/dragons.js';
import { ascendedDef } from './js/ascension.js';
import { buildDragonModel, makePreviewTick } from './js/dragonModel.js';

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e0b16);
const camera = new THREE.PerspectiveCamera(48, 1, 0.01, 400);
scene.add(new THREE.HemisphereLight(0xbfdcff, 0x241a24, 1.0));
const keyL = new THREE.DirectionalLight(0xffe0b0, 1.7); keyL.position.set(2.5, 3, 4); scene.add(keyL);
const rimL = new THREE.DirectionalLight(0x9a7bff, 1.0); rimL.position.set(-3, 1.5, -3); scene.add(rimL);
const fillL = new THREE.DirectionalLight(0xffd0b0, 0.4); fillL.position.set(0, -2, 2); scene.add(fillL);

let built = null, tick = null, tier = 3, def = null;
function load(t) {
  if (built) { scene.remove(built.group); built.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
  tier = t;
  def = ascendedDef(DRAGONS.phoenixEmpress, t, 0);
  built = buildDragonModel(def, { preview: true });
  scene.add(built.group);
  tick = makePreviewTick(def, built);
  document.querySelectorAll('.formbtn').forEach((b, i) => b.classList.toggle('on', i === t));
  document.getElementById('formname').textContent = ['Ash Hatchling', 'Kindled Fledgling', 'Pyre Dancer', 'Dawnfire Empress'][t];
}

// ── camera: rear-chase (behind + slightly above); drag to orbit, wheel to zoom ──
let az = 0, el = 0.2, dist = 9.8, drag = false, px = 0, py = 0, auto = true;
canvas.addEventListener('pointerdown', (e) => { drag = true; auto = false; px = e.clientX; py = e.clientY; });
addEventListener('pointerup', () => { drag = false; });
addEventListener('pointermove', (e) => { if (!drag) return; az -= (e.clientX - px) * 0.01; el = Math.max(-0.9, Math.min(1.2, el + (e.clientY - py) * 0.008)); px = e.clientX; py = e.clientY; });
canvas.addEventListener('wheel', (e) => { e.preventDefault(); dist = Math.max(4, Math.min(16, dist + e.deltaY * 0.01)); }, { passive: false });

// ── approximate Rebirth Surge: lerp the flare mats toward feverWing + boost the core ──
let surge = 0, surgeTarget = 0;
const fever = new THREE.Color(def0FeverWing());
function def0FeverWing() { return 0xffe6a8; }

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== w * renderer.getPixelRatio() || canvas.height !== h * renderer.getPixelRatio()) {
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
}
const tmpCol = new THREE.Color();
let t0 = null;
function frame(ts) {
  if (t0 == null) t0 = ts;
  const t = (ts - t0) / 1000;
  resize();
  if (auto) az += 0.0016;
  if (tick) tick(t);
  // surge pulse on the shared flare materials (spineMats = torso/wing/head + tail accents)
  surge += (surgeTarget - surge) * 0.06;
  const mats = built.materials.spineMats || [];
  for (const m of mats) {
    const baseE = m.userData.baseEmissive, baseI = m.userData.baseIntensity;
    if (baseE == null) continue;
    tmpCol.setHex(baseE).lerp(fever, surge * 0.8);
    m.emissive.copy(tmpCol);
    m.emissiveIntensity = (baseI ?? 1) * (1 + surge * 1.4);
  }
  if (built.parts.coreGlow) built.parts.coreGlow.material.opacity = (built.parts.coreGlow.userData.base ?? 0.3) * (0.8 + 0.2 * Math.sin(t * 2) + surge);
  // frame the dragon (its preview tick bobs it around origin ~y0.15)
  const cx = 0, cy = 0.15, cz = 0;
  camera.position.set(cx + Math.sin(az) * Math.cos(el) * dist, cy + Math.sin(el) * dist, cz + Math.cos(az) * Math.cos(el) * dist);
  camera.lookAt(cx, cy, cz);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

document.querySelectorAll('.formbtn').forEach((b, i) => b.addEventListener('click', () => load(i)));
document.getElementById('rear').addEventListener('click', () => { az = 0; el = 0.18; auto = false; });
document.getElementById('side').addEventListener('click', () => { az = Math.PI / 2; el = 0.1; auto = false; });
document.getElementById('orbit').addEventListener('click', () => { auto = !auto; });
const surgeBtn = document.getElementById('surge');
surgeBtn.addEventListener('pointerdown', () => { surgeTarget = 1; });
addEventListener('pointerup', () => { surgeTarget = 0; });

load(3);
requestAnimationFrame(frame);
