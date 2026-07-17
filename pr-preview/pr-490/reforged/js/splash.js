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
import { uiSound } from './uiSound.js';

let root = null;
let flashEl = null;
let handlers = {};
let built = false;
let armed = false; // first tap "wakes" audio (browser autoplay) before takeoff

const EMBER_COUNT = 16;

// WELCOME+HUB §1.4 — DETERMINISTIC embers. Every param is a seeded function of the
// index (golden-ratio hash → an even, non-clumping spread), so two renders are
// byte-identical for the screenshot gate. R5: the per-index duration is spread across
// 7–16s so the even distribution never phase-locks into a visible marching-band rhythm.
const GOLDEN = 0.6180339887;
// Fractional part of i·φ·k + offset → a well-distributed pseudo-random in [0,1), stable per index.
function seeded(i, k, off = 0) { const v = (i + 1) * GOLDEN * k + off; return v - Math.floor(v); }

function buildEmbers(layer) {
  for (let i = 0; i < EMBER_COUNT; i++) {
    const e = document.createElement('span');
    e.className = 'splash-ember';
    const size = 2 + seeded(i, 3.0) * 4;                 // 2–6px
    e.style.left = `${seeded(i, 1.0) * 100}%`;
    e.style.width = `${size}px`;
    e.style.height = `${size}px`;
    e.style.animationDuration = `${7 + seeded(i, 7.0) * 9}s`;    // 7–16s, spread per index (R5)
    e.style.animationDelay = `${-seeded(i, 5.0) * 12}s`;
    e.style.setProperty('--drift', `${(seeded(i, 11.0) * 2 - 1) * 40}px`);
    e.style.opacity = `${0.3 + seeded(i, 13.0) * 0.5}`;
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
    <div class="splash-godray"></div>
    <div class="splash-vignette"></div>
    <div class="splash-embers"></div>
    <div class="splash-top">
      <h1 class="splash-title">DRAGON <br>DRIFT</h1>
      <p class="splash-slogan">&#9670;&ensp;it's a skill issue&ensp;&#9670;</p>
    </div>
    <div class="splash-bottom">
      <p class="splash-tag">Evolve. Drift. Conquer the skies.</p>
      <button class="splash-cta" id="splash-takeoff">TAKE OFF</button>
      <p class="splash-begin" id="splash-begin">TAP TO BEGIN</p>
    </div>`;
  document.body.appendChild(root);
  buildEmbers(root.querySelector('.splash-embers'));

  // Take-off flash: a separate top-layer element (survives the splash hide) that
  // blooms a gold burst from the dragon, masking the cut from the attract framing
  // into gameplay. Triggered by launchFlash() on every takeoff.
  flashEl = document.createElement('div');
  flashEl.id = 'launch-flash';
  document.body.appendChild(flashEl);

  // The attract screen owns all of its taps (stopPropagation) so the global
  // tap-to-fly / audio-unlock handlers never fire underneath it. Browser autoplay
  // blocks sound until a gesture, so the FIRST tap "ignites" — it wakes the audio
  // (onIgnite swells the intro theme in) and reveals TAKE OFF, WITHOUT launching.
  // From then on the splash idles with music; any further tap (or TAKE OFF) flies.
  root.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (!armed) igniteSplash();
    else { uiSound.confirm(); handlers.onTakeOff && handlers.onTakeOff(); }
  });
}

// Wake the attract screen on the first interaction: start the intro theme and
// reveal the CTA. Idempotent. Also reachable from a keypress via main.js.
export function igniteSplash() {
  if (armed || !root) return;
  armed = true;
  root.classList.add('armed');
  handlers.onIgnite && handlers.onIgnite();
}

export function splashArmed() {
  return armed;
}

// WELCOME+HUB §1.2a — schedule the one-shot 3D IGNITE beat (dragon downstroke + rim lift +
// camera push) co-timed with the wordmark resolve (~1.2s after the splash appears). Fires at
// most once per show; cancelled on takeoff (hideSplash) so it can never fire into a run.
let igniteTimer = null;
let igniteBeatFired = false;
const IGNITE_BEAT_DELAY = 1200; // ms — lands on the wordmark-resolve beat

function cancelIgniteBeat() {
  if (igniteTimer) { clearTimeout(igniteTimer); igniteTimer = null; }
}

export function showSplash() {
  if (!root) return;
  root.classList.add('show');
  document.body.classList.add('splash-open');
  // (Re)arm the ignite beat for this viewing.
  cancelIgniteBeat();
  igniteBeatFired = false;
  igniteTimer = setTimeout(() => {
    igniteTimer = null;
    if (igniteBeatFired || !splashVisible()) return;
    igniteBeatFired = true;
    handlers.onIgniteBeat && handlers.onIgniteBeat();
  }, IGNITE_BEAT_DELAY);
}

export function hideSplash() {
  if (!root) return;
  cancelIgniteBeat();
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
