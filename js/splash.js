// Cinematic first-impression splash / attract screen for DRAGON DRIFT.
//
// Renders as a DOM overlay layered on top of the LIVE 3D scene: the camera is
// framed behind the dragon (cameraController splash mode) looking down the real
// mint ring course that was spawned at boot — so tapping TAKE OFF flies the very
// course shown. The purple/gold atmosphere (sky wash, gold horizon glow, vignette)
// is painted with transparent CSS layers so the dragon + rings show through.
//
// Kept self-contained and modular so it can later grow into a full attract-mode
// loop (slow auto-flight through biomes, ring streaks, a barrel roll) — the hook
// is the camera splash framing in cameraController.js plus the live scene update.

let root = null;
let flashEl = null;
let handlers = {};
let built = false;

const EMBER_COUNT = 16;

function buildEmbers(layer) {
  for (let i = 0; i < EMBER_COUNT; i++) {
    const e = document.createElement('span');
    e.className = 'splash-ember';
    const size = 2 + Math.random() * 4;
    e.style.left = `${Math.random() * 100}%`;
    e.style.width = `${size}px`;
    e.style.height = `${size}px`;
    e.style.animationDuration = `${7 + Math.random() * 9}s`;
    e.style.animationDelay = `${-Math.random() * 12}s`;
    e.style.setProperty('--drift', `${(Math.random() * 2 - 1) * 40}px`);
    e.style.opacity = `${0.3 + Math.random() * 0.5}`;
    layer.appendChild(e);
  }
}

export function initSplash(h = {}) {
  handlers = h;
  if (built) return;
  built = true;

  root = document.createElement('div');
  root.id = 'splash';
  root.innerHTML = `
    <div class="splash-sky"></div>
    <div class="splash-horizon"></div>
    <div class="splash-vignette"></div>
    <div class="splash-embers"></div>
    <div class="splash-top">
      <h1 class="splash-title">DRAGON<br>DRIFT</h1>
      <p class="splash-slogan">&#9670;&ensp;it's a skill issue&ensp;&#9670;</p>
    </div>
    <div class="splash-bottom">
      <p class="splash-tag">Evolve. Drift. Conquer the skies.</p>
      <button class="splash-cta" id="splash-takeoff">TAKE OFF</button>
    </div>`;
  document.body.appendChild(root);
  buildEmbers(root.querySelector('.splash-embers'));

  // Take-off flash: a separate top-layer element (survives the splash hide) that
  // blooms a gold burst from the dragon, masking the cut from the attract framing
  // into gameplay. Triggered by launchFlash() on every takeoff.
  flashEl = document.createElement('div');
  flashEl.id = 'launch-flash';
  document.body.appendChild(flashEl);

  root.querySelector('#splash-takeoff').addEventListener('click', (e) => {
    e.stopPropagation();
    handlers.onTakeOff && handlers.onTakeOff();
  });
  // Tap anywhere else on the attract screen also takes off (arcade "tap to play").
  root.addEventListener('click', () => { handlers.onTakeOff && handlers.onTakeOff(); });
}

export function showSplash() {
  if (!root) return;
  root.classList.add('show');
  document.body.classList.add('splash-open');
}

export function hideSplash() {
  if (!root) return;
  root.classList.remove('show');
  document.body.classList.remove('splash-open');
}

export function splashVisible() {
  return !!root && root.classList.contains('show');
}

// Fire the take-off flash burst (retriggerable — forces a reflow so the CSS
// animation restarts even on a rapid second takeoff).
export function launchFlash() {
  if (!flashEl) return;
  flashEl.classList.remove('fire');
  void flashEl.offsetWidth; // reflow to restart the animation
  flashEl.classList.add('fire');
}
