// Dragon Drift audio engine.
// Procedural chiptune-pop music reacts to gameplay.
// Layer unlock order: bass+melody always → arpeggio on boost →
// high-lead on combo≥2 → percussion on combo≥3 → fever sparkle on surge.

import { saveData, persist } from './save.js';
import { TRACKS } from './tracks.js';
import { mulberry32 } from './util.js';

export { TRACKS };

// A track is playable if it's free or has been bought in the shop.
export function trackUnlocked(i) {
  const t = TRACKS[i];
  return !!t && (t.cost === 0 || saveData.audio.ownedTracks.includes(t.id));
}

// Dev mode: grant every premium station so the radio is fully unlocked.
export function unlockAllTracks() {
  for (const t of TRACKS) {
    if (t.cost > 0 && !saveData.audio.ownedTracks.includes(t.id)) saveData.audio.ownedTracks.push(t.id);
  }
}

let ctx = null;
let masterGain = null;
let musicBus = null; // all music layers route here (independent mute + volume)
let sfxBus = null;   // all one-shot sound effects route here
let slowFilter = null; // lowpass swept down during slow-mo
let slowMoOn = false;

export let musicMuted = saveData.audio.musicMuted;
export let sfxMuted = saveData.audio.sfxMuted;

const musicTarget = () => (musicMuted ? 0 : saveData.audio.musicVol);
const sfxTarget = () => (sfxMuted ? 0 : saveData.audio.sfxVol);

// iOS routes Web Audio through the "ambient" session by default, which the
// hardware silent switch mutes. Ask for a "playback" session where supported.
try {
  if (navigator.audioSession) navigator.audioSession.type = 'playback';
} catch { /* not supported */ }

// Soft-clip curve (tanh): unity slope at 0 so it's transparent for normal
// levels, then rounds peaks and hard-caps at ±1 — a brickwall safety that
// catches the fast transients the master compressor's attack misses.
let _tanhCurve = null;
function makeTanhCurve() {
  if (_tanhCurve) return _tanhCurve;
  const n = 2048;
  _tanhCurve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    _tanhCurve[i] = Math.tanh(x);
  }
  return _tanhCurve;
}

// Generated reverb impulse: exponentially-decaying stereo noise. A real
// convolution tail gives the score the sense of air/space a soaring sea-flight
// wants — no audio files, just synthesized noise shaped by an exp decay. The
// two channels decorrelate (independent noise) for a wide, natural stereo tail.
function makeImpulse(a, seconds = 2.6, decay = 2.8) {
  const len = Math.max(1, Math.floor(a.sampleRate * seconds));
  const buf = a.createBuffer(2, len, a.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }
  return buf;
}

// Soft-saturation curve for bass drive: adds harmonics/grit without the harsh
// fold of a hard clip (a smooth knee that stays bounded to ±1). `amount` 0..~1
// scales the drive — heavy saw-bass stations want it, sine-bass stations don't.
let _driveCurves = {};
function makeDriveCurve(amount = 0.4) {
  const key = amount.toFixed(2);
  if (_driveCurves[key]) return _driveCurves[key];
  const n = 1024;
  const curve = new Float32Array(n);
  const k = amount * 8;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = (1 + k) * x / (1 + k * Math.abs(x));
  }
  _driveCurves[key] = curve;
  return curve;
}

function getCtx() {
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 1;
      // Soft master compressor: lets the stacked layers run hot without clipping
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.ratio.value = 4;
      comp.attack.value = 0.004;
      comp.release.value = 0.18;
      // Brickwall-ish soft limiter after the compressor: stacked layers + drum
      // transients can never clip into harsh digital crackle.
      const limiter = ctx.createWaveShaper();
      limiter.curve = makeTanhCurve();
      limiter.oversample = '4x';
      masterGain.connect(comp);
      comp.connect(limiter);
      limiter.connect(ctx.destination);
      musicBus = ctx.createGain();
      musicBus.gain.value = musicTarget();
      // Master "glue" EQ on MUSIC only: a gentle low-mid scoop clears the mud the
      // stacked saw/triangle layers build up. SFX bypass it and stay crisp.
      const glue = ctx.createBiquadFilter();
      glue.type = 'peaking';
      glue.frequency.value = 320;
      glue.Q.value = 0.9;
      glue.gain.value = -2.5;
      // Slow-mo filter: music ducks underwater during near-death time dilation
      slowFilter = ctx.createBiquadFilter();
      slowFilter.type = 'lowpass';
      slowFilter.frequency.value = 18000;
      musicBus.connect(glue);
      glue.connect(slowFilter);
      slowFilter.connect(masterGain);
      sfxBus = ctx.createGain();
      sfxBus.gain.value = sfxTarget();
      sfxBus.connect(masterGain);
      // Reverb send/return: a convolution tail (generated impulse) shared by the
      // musical layers. The return routes back into the music bus so it inherits
      // music mute/volume and gets muffled by the slow-mo lowpass like the rest
      // of the score. Per-layer send levels are set up in music.start().
      reverbConvolver = ctx.createConvolver();
      reverbConvolver.buffer = makeImpulse(ctx);
      reverbReturn = ctx.createGain();
      reverbReturn.gain.value = 0.9;
      reverbConvolver.connect(reverbReturn);
      reverbReturn.connect(musicBus);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

// Even with a running AudioContext, iOS routes Web Audio through the
// "ambient" session, which the hardware mute switch silences — and most iOS
// versions don't support navigator.audioSession above. A *playing* HTML
// media element flips the session to "playback" (ignores the mute switch),
// so loop a tiny silent clip alongside the game audio. (unmute.js trick)
const SILENT_WAV = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YSADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
let silentMedia = null;
function ensureSilentMedia() {
  if (!silentMedia) {
    try {
      silentMedia = new Audio(SILENT_WAV);
      silentMedia.loop = true;
      silentMedia.setAttribute('playsinline', '');
    } catch { return; }
  }
  if (silentMedia.paused) {
    const p = silentMedia.play();
    if (p && p.catch) p.catch(() => {});
  }
}

// iOS/WebKit only unlocks audio from a *completed* gesture (touchend/click);
// the game's pointerdown handlers alone are not enough. Resume the context on
// any finished gesture, and kick output with a silent buffer for older iOS.
function unlockAudio() {
  ensureSilentMedia();
  const a = getCtx();
  if (!a) return;
  if (a.state !== 'running') {
    const p = a.resume();
    if (p && p.then) p.then(tryResumeMusic, () => {});   // resume is async → restart music once it lands
    try {
      const src = a.createBufferSource();
      src.buffer = a.createBuffer(1, 1, 22050);
      src.connect(a.destination);
      src.start(0);
    } catch { /* ignore */ }
  }
  // If we just came back from the background, this real gesture is what lets the
  // music restart cleanly. No-op during normal play (the flag is only set on resume).
  tryResumeMusic();
}
for (const evt of ['touchend', 'pointerup', 'click', 'keydown']) {
  window.addEventListener(evt, unlockAudio, { passive: true });
}

// iOS suspends the context when the tab is backgrounded or interrupted.
// Main game flow owns resume so returning from the background needs a gesture.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (silentMedia) silentMedia.pause();
  }
});

function stopScheduler() {
  if (!schedulerTimer) return;
  clearInterval(schedulerTimer);
  schedulerTimer = null;
}

// Returning from background: restart the music ONLY once the AudioContext is
// genuinely RUNNING (which on iOS means after a user gesture). Rebuilding the
// scheduler against a suspended / just-resumed context — whose currentTime has
// jumped forward while hidden — is exactly what produced the slow/garbled playback.
function tryResumeMusic() {
  if (!resumeMusicPending) return;
  if (!ctx || ctx.state !== 'running') return;   // wait for a gesture to truly resume
  resumeMusicPending = false;
  if (!musicActive) music.start();
}

function stopWindSource() {
  if (!windSource) return;
  try { windSource.stop(); } catch {}
  try { windSource.disconnect(); } catch {}
  windSource = null;
}

function restoreBuses(a, immediate = false) {
  if (!a || !musicBus || !sfxBus) return;
  if (immediate) {
    musicBus.gain.setValueAtTime(musicTarget(), a.currentTime);
    sfxBus.gain.setValueAtTime(sfxTarget(), a.currentTime);
  } else {
    musicBus.gain.setTargetAtTime(musicTarget(), a.currentTime, 0.08);
    sfxBus.gain.setTargetAtTime(sfxTarget(), a.currentTime, 0.08);
  }
}

export function toggleMusicMute() {
  musicMuted = !musicMuted;
  saveData.audio.musicMuted = musicMuted;
  persist();
  const a = getCtx();
  if (a && musicBus) musicBus.gain.setTargetAtTime(musicTarget(), a.currentTime, 0.08);
  return musicMuted;
}

export function toggleSfxMute() {
  sfxMuted = !sfxMuted;
  saveData.audio.sfxMuted = sfxMuted;
  persist();
  const a = getCtx();
  if (a && sfxBus) sfxBus.gain.setTargetAtTime(sfxTarget(), a.currentTime, 0.08);
  return sfxMuted;
}

// Near-death slow-mo: sweep the music lowpass down (muffled, underwater) and
// back up on recovery.
export function setSlowMo(active) {
  if (active === slowMoOn) return;
  slowMoOn = active;
  const a = getCtx();
  if (!a || !slowFilter) return;
  slowFilter.frequency.setTargetAtTime(active ? 650 : 18000, a.currentTime, active ? 0.05 : 0.12);
}

// Volume sliders (pause menu). 0..1; persists.
export function setMusicVolume(v) {
  saveData.audio.musicVol = Math.max(0, Math.min(1, v));
  persist();
  const a = getCtx();
  if (a && musicBus) musicBus.gain.setTargetAtTime(musicTarget(), a.currentTime, 0.05);
}

export function setSfxVolume(v) {
  saveData.audio.sfxVol = Math.max(0, Math.min(1, v));
  persist();
  const a = getCtx();
  if (a && sfxBus) sfxBus.gain.setTargetAtTime(sfxTarget(), a.currentTime, 0.05);
}

// --- Noise helper: one cached 2s white-noise buffer, one-shot sources ---
let noiseBuffer = null;
function getNoiseBuffer(a) {
  if (!noiseBuffer) {
    noiseBuffer = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

// Filtered noise burst (whooshes, impacts).
function noiseWhoosh({ from = 800, to = 3000, dur = 0.25, vol = 0.12, q = 1.2, delay = 0 }) {
  const a = getCtx();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const src = a.createBufferSource();
  src.buffer = getNoiseBuffer(a);
  const bp = a.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = q;
  bp.frequency.setValueAtTime(from, t0);
  bp.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp).connect(g).connect(sfxBus);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

// --- SFX helpers ---
function tone({ freq = 440, end = 0, dur = 0.2, type = 'sine', vol = 0.12, delay = 0 }) {
  const a = getCtx();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (end) osc.frequency.exponentialRampToValueAtTime(Math.max(end, 1), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(sfxBus);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  // Glassy ice-bell pluck: pure fundamental + bright inharmonic partial
  ring(combo = 1) {
    const f = 700 + combo * 60;
    tone({ freq: f, end: f * 1.5, dur: 0.16, vol: 0.13 });
    tone({ freq: f * 2.76, dur: 0.22, type: 'sine', vol: 0.07 });
    tone({ freq: 1480, dur: 0.1, type: 'triangle', vol: 0.05, delay: 0.04 });
  },
  // Perfect-center ring: triumphant bell flourish that climbs a pentatonic
  // ladder with each consecutive perfect — chaining perfects plays a melody.
  perfect(streak = 1) {
    const PENTA = [0, 2, 4, 7, 9];
    const step = PENTA[(streak - 1) % 5] + Math.floor((streak - 1) / 5) * 12;
    const f = 880 * Math.pow(2, Math.min(step, 24) / 12);
    tone({ freq: f, dur: 0.22, type: 'triangle', vol: 0.13 });
    tone({ freq: f * 1.5, dur: 0.26, type: 'sine', vol: 0.09, delay: 0.05 });
    tone({ freq: f * 2, end: f * 2.4, dur: 0.3, type: 'sine', vol: 0.07, delay: 0.1 });
    noiseWhoosh({ from: 4000, to: 8000, dur: 0.18, vol: 0.05, q: 2.2 });
  },
  orb() {
    tone({ freq: 300, end: 950, dur: 0.3, type: 'sawtooth', vol: 0.08 });
    tone({ freq: 600, end: 1900, dur: 0.2, type: 'triangle', vol: 0.05, delay: 0.1 });
  },
  damage() {
    tone({ freq: 160, end: 55, dur: 0.3, type: 'square', vol: 0.1 });
  },
  crash() {
    tone({ freq: 180, end: 30, dur: 0.8, type: 'sawtooth', vol: 0.15 });
    tone({ freq: 90, end: 20, dur: 1.0, type: 'square', vol: 0.1, delay: 0.05 });
    for (let i = 0; i < 5; i++) {
      tone({ freq: 500 + i * 350, end: 120, dur: 0.28, type: 'triangle', vol: 0.07, delay: i * 0.055 });
    }
  },
  boostStart() {
    tone({ freq: 200, end: 600, dur: 0.3, type: 'sawtooth', vol: 0.07 });
    noiseWhoosh({ from: 300, to: 1600, dur: 0.35, vol: 0.08 });
  },
  // Take-off launch: a deep rising swell + big air whoosh + a bright phoenix
  // sparkle on top — the punchy "we're flying" moment under the splash flash.
  launch() {
    tone({ freq: 110, end: 460, dur: 0.5, type: 'sawtooth', vol: 0.12 });
    tone({ freq: 220, end: 880, dur: 0.45, type: 'triangle', vol: 0.07, delay: 0.02 });
    noiseWhoosh({ from: 280, to: 4200, dur: 0.55, vol: 0.16, q: 0.8 });
    tone({ freq: 1320, end: 1980, dur: 0.4, type: 'sine', vol: 0.06, delay: 0.12 });
  },
  // Whipping air whoosh as something deadly slides past
  nearMiss() {
    noiseWhoosh({ from: 700, to: 3200, dur: 0.22, vol: 0.16, q: 1.6 });
    tone({ freq: 880, end: 1320, dur: 0.12, type: 'triangle', vol: 0.07, delay: 0.04 });
  },
  // Graze a boss bullet: a soft, SHORT high shimmer, kept quiet so a rapid stream
  // of grazes blends into a pleasant sparkle instead of a machine-gun rattle. The
  // pitch climbs gently with the graze streak (a subtle dopamine ladder).
  graze(streak = 0) {
    const step = Math.min(streak, 14);
    const f = 1500 + step * 60;
    tone({ freq: f, end: f * 1.18, dur: 0.045, type: 'triangle', vol: 0.03 });
  },
  // Reflect/parry a bullet. Normal = a metallic ting; PERFECT climbs a pentatonic
  // ladder with the perfect-parry streak (like the perfect-phase chime — chaining
  // perfect parries plays a rising melody).
  parry(perfect = false, streak = 1) {
    if (perfect) {
      const penta = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
      const semi = penta[Math.min(streak - 1, penta.length - 1)] || 0;
      const base = 600 * Math.pow(2, semi / 12);
      tone({ freq: base, end: base * 2, dur: 0.16, type: 'triangle', vol: 0.12 });
      tone({ freq: base * 2.01, dur: 0.2, type: 'sine', vol: 0.06, delay: 0.02 });
      tone({ freq: base * 3, dur: 0.12, type: 'sine', vol: 0.04, delay: 0.03 });
    } else {
      tone({ freq: 440, end: 680, dur: 0.12, type: 'triangle', vol: 0.09 });
      tone({ freq: 900, dur: 0.14, type: 'sine', vol: 0.04, delay: 0.02 });
    }
  },
  // Chip/reflect pinging off boss armour: a short, quiet metallic clang so the
  // player reads "that's bouncing off — charge Surge instead" (fires ~2/s, kept low).
  shieldPing() {
    tone({ freq: 2600, end: 1800, dur: 0.05, type: 'square', vol: 0.03 });
    tone({ freq: 1300, dur: 0.06, type: 'triangle', vol: 0.03, delay: 0.005 });
  },
  // Boss defeated: a big triumphant fanfare — a low victory boom under a rising
  // major arpeggio that blooms into a shimmering chord. The "you earned it" payoff.
  bossDefeat() {
    const a = getCtx();
    if (!a) return;
    noiseWhoosh({ from: 220, to: 40, dur: 0.7, vol: 0.22, q: 0.8 });          // low impact swell
    tone({ freq: 90, end: 60, dur: 0.9, type: 'sine', vol: 0.16 });           // sub boom
    const root = 392; // G4
    const arp = [0, 4, 7, 12, 16, 19];                                        // major, two octaves
    arp.forEach((semi, i) => {
      const f = root * Math.pow(2, semi / 12);
      tone({ freq: f, end: f, dur: 0.5, type: 'triangle', vol: 0.12, delay: i * 0.075 });
      tone({ freq: f * 2, dur: 0.4, type: 'sine', vol: 0.05, delay: i * 0.075 + 0.01 });
    });
    // Final bloom chord (G major) + bright shimmer.
    [0, 7, 12, 16].forEach((semi) => {
      const f = root * Math.pow(2, semi / 12);
      tone({ freq: f, dur: 1.1, type: 'sine', vol: 0.07, delay: 0.5 });
    });
    tone({ freq: 3136, dur: 0.5, type: 'triangle', vol: 0.05, delay: 0.55 });  // sparkle
  },
  // Ember pickup: short blip that climbs a pentatonic ladder with the streak
  // (the Subway Surfers coin cadence — consecutive grabs feel like a melody).
  ember(streak = 1) {
    const PENTA = [0, 2, 4, 7, 9];
    const step = PENTA[(streak - 1) % 5] + Math.floor((streak - 1) / 5) * 12;
    const f = 660 * Math.pow(2, Math.min(step, 26) / 12);
    tone({ freq: f, dur: 0.07, type: 'triangle', vol: 0.1 });
    tone({ freq: f * 2, dur: 0.05, type: 'sine', vol: 0.05 });
  },
  // Barrel roll: wide corkscrew whoosh + pitch-bent saw flourish
  roll() {
    noiseWhoosh({ from: 400, to: 2400, dur: 0.4, vol: 0.14, q: 0.9 });
    tone({ freq: 320, end: 760, dur: 0.3, type: 'sawtooth', vol: 0.06 });
    tone({ freq: 640, end: 480, dur: 0.22, type: 'triangle', vol: 0.05, delay: 0.18 });
  },
  // Revive: low swell rising into a bright bell — back from the brink
  revive() {
    tone({ freq: 110, end: 220, dur: 0.5, type: 'sawtooth', vol: 0.09 });
    tone({ freq: 440, end: 880, dur: 0.4, type: 'triangle', vol: 0.08, delay: 0.25 });
    [880, 1108.7, 1318.5].forEach((f, i) =>
      tone({ freq: f, dur: 0.3, type: 'sine', vol: 0.07, delay: 0.45 + i * 0.08 }));
  },
  // Pilot level up: rising bell arpeggio
  levelUp() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      tone({ freq: f, dur: 0.28, type: 'sine', vol: 0.1, delay: i * 0.09 });
      tone({ freq: f * 2, dur: 0.2, type: 'sine', vol: 0.04, delay: i * 0.09 });
    });
  },
  // Mission complete: confident two-chord stamp
  missionComplete() {
    [659.25, 783.99].forEach((f, i) => {
      tone({ freq: f, dur: 0.18, type: 'triangle', vol: 0.11, delay: i * 0.14 });
      tone({ freq: f * 1.5, dur: 0.18, type: 'triangle', vol: 0.07, delay: i * 0.14 });
    });
  },
  // Radio retune: static blip + sweep
  radio() {
    noiseWhoosh({ from: 2000, to: 600, dur: 0.12, vol: 0.1, q: 0.6 });
    tone({ freq: 880, end: 1320, dur: 0.1, type: 'square', vol: 0.05, delay: 0.1 });
  },
  // Soft, premium UI selection tick — a tiny rising two-tone chime played on any
  // meaningful control click (delegated in ui.js). Clean attack, gentle decay,
  // deliberately quiet so it layers under action chimes without getting annoying.
  select() {
    tone({ freq: 920, dur: 0.045, type: 'triangle', vol: 0.05 });
    tone({ freq: 1380, dur: 0.05, type: 'sine', vol: 0.03, delay: 0.012 });
  },
  // Soft "not yet" for locked / disabled controls.
  deny() {
    tone({ freq: 300, end: 210, dur: 0.12, type: 'triangle', vol: 0.05 });
  },
  feverStart() {
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) =>
      tone({ freq: f, end: f * 1.5, dur: 0.3, type: 'square', vol: 0.1, delay: i * 0.09 }));
    tone({ freq: 1046.50, end: 2093, dur: 0.5, type: 'sawtooth', vol: 0.08, delay: 0.38 });
  },
  comboBreak() {
    tone({ freq: 440, end: 200, dur: 0.35, type: 'square', vol: 0.08 });
  },
  gate() {
    tone({ freq: 520, end: 1040, dur: 0.16, type: 'triangle', vol: 0.13 });
    tone({ freq: 780, end: 1560, dur: 0.18, type: 'square', vol: 0.06, delay: 0.06 });
  },
  // Surge phase-through. Minor = a quick crystalline CRACK (acknowledges the save
  // without euphoria). Perfect = a bright shatter into a rising triumphant chord
  // that climbs a pentatonic ladder with the phase streak (a dopamine "YES!").
  phase(perfect = false, streak = 1) {
    if (!perfect) {
      noiseWhoosh({ from: 2600, to: 900, dur: 0.16, vol: 0.13, q: 1.4 });
      tone({ freq: 660, end: 440, dur: 0.14, type: 'triangle', vol: 0.08 });
      tone({ freq: 990, end: 700, dur: 0.1, type: 'square', vol: 0.04, delay: 0.04 });
      return;
    }
    const PENTA = [0, 4, 7, 11, 14];
    const step = PENTA[(streak - 1) % 5] + Math.floor((streak - 1) / 5) * 12;
    const f = 740 * Math.pow(2, Math.min(step, 24) / 12);
    // Bright shatter, then a low whoomp under a rising chord stack.
    noiseWhoosh({ from: 5200, to: 1400, dur: 0.22, vol: 0.13, q: 2.4 });
    tone({ freq: 130, end: 90, dur: 0.4, type: 'sawtooth', vol: 0.09 });
    tone({ freq: f, end: f * 1.5, dur: 0.32, type: 'triangle', vol: 0.13, delay: 0.05 });
    tone({ freq: f * 1.5, end: f * 2, dur: 0.34, type: 'square', vol: 0.08, delay: 0.11 });
    tone({ freq: f * 2, end: f * 2.5, dur: 0.36, type: 'sine', vol: 0.06, delay: 0.17 });
  },
  // Rising jingle when the combo crosses an intensity tier — higher tier,
  // higher pitch.
  comboUp(tier) {
    const base = 600 + tier * 150;
    tone({ freq: base, dur: 0.09, type: 'square', vol: 0.09 });
    tone({ freq: base * 1.25, dur: 0.09, type: 'square', vol: 0.09, delay: 0.07 });
    tone({ freq: base * 1.5, end: base * 2, dur: 0.16, type: 'square', vol: 0.1, delay: 0.14 });
  },
  milestone() {
    [660, 880, 1320].forEach((f, i) =>
      tone({ freq: f, dur: 0.14, type: 'triangle', vol: 0.1, delay: i * 0.07 }));
  },
  record() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      tone({ freq: f, end: f * 1.2, dur: 0.22, type: 'square', vol: 0.09, delay: i * 0.08 }));
  },
  // Golden ember: a treasure-chest glissando — unmistakably richer than the
  // ordinary ember blip.
  goldEmber() {
    [880, 1108.7, 1318.5, 1760].forEach((f, i) =>
      tone({ freq: f, dur: 0.16, type: 'triangle', vol: 0.12, delay: i * 0.05 }));
    tone({ freq: 2637, dur: 0.3, type: 'sine', vol: 0.06, delay: 0.2 });
    noiseWhoosh({ from: 5000, to: 9000, dur: 0.2, vol: 0.05, q: 3 });
  },
  // Feat unlocked: a proud little fanfare stamp (distinct from missions)
  featUnlock() {
    [659.25, 880, 1318.5].forEach((f, i) =>
      tone({ freq: f, dur: 0.2, type: 'triangle', vol: 0.11, delay: i * 0.1 }));
    tone({ freq: 1760, end: 2093, dur: 0.32, type: 'sine', vol: 0.07, delay: 0.3 });
  },
  // Count-up tick: tiny metallic blip, pitch rising with progress (0..1) —
  // the slot-machine rollup that makes a tallied number feel bigger.
  tick(pitch01 = 0) {
    tone({ freq: 600 + pitch01 * 900, dur: 0.045, type: 'triangle', vol: 0.05 });
  },
  // Count-up settle: the final number lands.
  settle() {
    tone({ freq: 520, dur: 0.12, type: 'triangle', vol: 0.1 });
    tone({ freq: 1040, end: 1240, dur: 0.3, type: 'sine', vol: 0.08, delay: 0.06 });
  },
};

// --- Music engine ---
// Track data lives in tracks.js (Dragon Radio stations): 8 bars of
// [freq, duration-in-eighths] rows per layer. The scheduler below turns
// whichever station is active into gameplay-reactive layers.

let trackIndex = Math.min(Math.max(saveData.audio.track | 0, 0), TRACKS.length - 1);
if (!trackUnlocked(trackIndex)) trackIndex = 0; // stale save pointing at an unowned track
let E8 = 60 / TRACKS[trackIndex].bpm / 2; // eighth-note seconds (per track)
// Title-screen theme: plays the menu theme on the start screen WITHOUT saving
// over the player's chosen Dragon Radio station. `menuOverride` = the theme is
// transiently driving the index; `radioChosen` = the player explicitly picked a
// station this session, so stop forcing the theme on the menu.
const MENU_THEME_INDEX = TRACKS.findIndex(t => t.id === 'skybound');
let menuOverride = false;
let radioChosen = false;

// --- Layer gain nodes ---
let layers = {};       // keyed: bass, melody, high, arp, perc, fever, pad
let events = [];       // flattened note events sorted by time-offset
let musicActive = false;
let bgSuspended = false;   // app backgrounded → audio context suspended (any game state)
let wasActiveOnBg = false; // was music playing when we backgrounded? (restore on return)
let resumeMusicPending = false; // returned from background w/ music → restart on the next running-ctx gesture
let loopOffset = 0;    // absolute audioCtx time when current loop started
let nextEvtIdx = 0;
let schedulerTimer = null;
let windSource = null;
let echoDelay = null;  // dotted-eighth echo (delay time follows the track BPM)
let echoDelayR = null; // right tap of the stereo ping-pong echo
let pumpGain = null;   // sidechain bus: musical layers duck on every kick
let bassDrive = null;  // soft-saturation waveshaper on the bass layer
let reverbConvolver = null; // shared convolution reverb (input)
let reverbReturn = null;    // reverb return gain → music bus
let pendingRebuild = false; // biome key shift applies at the next loop wrap
const LOOK_AHEAD = 0.4; // schedule this many seconds ahead
const SCHED_INTERVAL = 100; // ms between scheduler runs

let LOOP_LEN = 64 * E8; // total loop duration in seconds (per track)
let biomeSemitones = 0; // biome key shift, applied at loop boundaries
let drumEnergy = 0;     // 0..1 BPM-driven kit punch / bass thickness
let pumpAmt = 0;        // sidechain depth: 0 (no pump) .. ~0.42 (hard four-on-floor)
let loopCount = 0;      // which 8-bar loop we're on — drives fills/crash/humanize variation
// Per-station "remaster" mix scalars (from each track's optional `mix` object).
// All default to 1.0 → byte-for-byte the current global sound when `mix` is absent.
let mixReverb = 1, mixWidth = 1, mixDrive = 1, mixBright = 1;

function seqToEvents(seq, layerKey, voice, freqMult, durMult = 0.85) {
  const out = [];
  let t = 0;
  for (const [freq, dur] of seq) {
    if (freq > 0) {
      out.push({
        t, freq: freq * freqMult, durS: dur * E8 * durMult,
        layer: layerKey, osc: voice.osc, vol: voice.vol, stack: voice.stack,
      });
    }
    t += dur * E8;
  }
  return out;
}

function buildEvents() {
  const tr = TRACKS[trackIndex];
  E8 = 60 / tr.bpm / 2;
  LOOP_LEN = 64 * E8;
  // Punchier kit + thicker bass on the high-energy stations; chill low-BPM
  // tracks stay soft. 100bpm→0 … 174bpm→1, with an optional per-track nudge.
  drumEnergy = Math.max(0, Math.min(1, (tr.bpm - 100) / 74)) * (tr.drums.punch ?? 1);
  // Per-station mix scalars (the remaster knobs). Neutral (1.0) when `mix` is absent.
  const mx = tr.mix || {};
  mixReverb = mx.reverb ?? 1;
  mixWidth  = mx.width  ?? 1;
  mixDrive  = mx.drive  ?? 1;
  mixBright = mx.bright ?? 1;
  // Sidechain pump depth follows the kit: heavy four-on-the-floor stations pump
  // hard (the genre's signature), chill/acoustic kits barely move. The per-station
  // `mix.pump` scales it (capped) so each genre pumps as hard as it should.
  pumpAmt = (tr.drums.heavy ? Math.min(0.42, 0.16 + drumEnergy * 0.32) : drumEnergy * 0.07) * (mx.pump ?? 1);
  pumpAmt = Math.min(0.5, pumpAmt);
  const km = Math.pow(2, biomeSemitones / 12); // biome key shift
  const v = tr.voices;
  // Swing: delay the off-beats by a fraction of an eighth on the groove
  // stations (lo-fi / house / liquid D&B …). Straight-time dance tracks omit
  // `swing` and stay rigid. Applied to hats / shaker / arp only — never to the
  // melody/bass (variable note lengths make melodic swing unmusical here).
  const swing = (tr.swing ?? 0) * E8;
  const swing16 = swing * 0.5;

  const all = [
    ...seqToEvents(tr.melody, 'melody', v.melody, km),
    ...seqToEvents(tr.bass,   'bass',   v.bass,   km, 0.88),
    ...seqToEvents(tr.high,   'high',   v.high,   km),
    // Dragon Surge lead: the hook an octave up, hot voice
    ...seqToEvents(tr.melody, 'feverlead', { ...v.lead, vol: v.lead.vol }, km * 2, 0.8),
  ];

  const e16 = E8 / 2;
  for (let bar = 0; bar < 8; bar++) {
    const barStart = bar * 8 * E8;
    const arp = tr.arps[bar % 4];                       // follow the chord
    for (let cycle = 0; cycle < 2; cycle++) {           // 2 × 8-note cycles per bar
      const cycleStart = barStart + cycle * 4 * E8;
      for (let i = 0; i < arp.length; i++) {
        const at = cycleStart + i * e16 + (i % 2 ? swing16 : 0);
        all.push({ t: at, freq: arp[i] * km, durS: e16 * 0.65, layer: 'arp', osc: v.arp.osc, vol: v.arp.vol });
        all.push({ t: at, freq: arp[i] * 2 * km, durS: e16 * 0.55, layer: 'fever', osc: 'triangle', vol: 0.08 });
      }
    }
    // Pad: slow-attack chord swell once per bar
    if (tr.pad && tr.chords) {
      for (const f of tr.chords[bar % tr.chords.length]) {
        all.push({ t: barStart, freq: f * km, durS: 8 * E8 * 0.96, layer: 'pad', osc: 'sawtooth', vol: 0.035, slow: true });
      }
    }
    // Percussion: four-on-the-floor kick, backbeat snare, hat on every 8th
    const BEAT = 2 * E8;
    const d = tr.drums;
    for (let beat = 0; beat < 4; beat++) {
      const bt = barStart + beat * BEAT;
      all.push({ t: bt, special: 'kick', layer: 'perc', dvol: d.kick });
      if (beat % 2 === 1) all.push({ t: bt, special: 'snare', layer: 'perc', dvol: d.snare });
      all.push({ t: bt,           special: 'hat', layer: 'perc', dvol: d.hat });
      all.push({ t: bt + E8 + swing, special: 'hat', layer: 'perc', dvol: d.hat });
      // Heavy layer at combo >= 3: deeper kick doubled, clap on backbeat
      if (d.heavy) {
        all.push({ t: bt, special: 'kick2', layer: 'perc2', dvol: 1 });
        if (beat % 2 === 1) all.push({ t: bt, special: 'clap', layer: 'perc2', dvol: 1 });
      }
      // Flavour layer: shaker (off-beats), conga (backbeats), logDrum (downbeats)
      if (d.shaker) {
        all.push({ t: bt + E8 + swing,     special: 'shaker', layer: 'perc3', dvol: d.shaker });
        all.push({ t: bt + E8 * 3 + swing, special: 'shaker', layer: 'perc3', dvol: d.shaker * 0.7 });
      }
      if (d.conga && beat % 2 === 1) {
        all.push({ t: bt,           special: 'conga', layer: 'perc3', dvol: d.conga });
        all.push({ t: bt + E8 * 1.5, special: 'conga', layer: 'perc3', dvol: d.conga * 0.6 });
      }
      if (d.logDrum) {
        if (beat === 0) all.push({ t: bt,            special: 'logDrum', layer: 'perc3', dvol: d.logDrum });
        if (beat === 2) all.push({ t: bt + E8 * 0.5, special: 'logDrum', layer: 'perc3', dvol: d.logDrum * 0.8 });
      }
    }
  }

  // --- Longevity: crash + fills + humanization (varied per loop) ---------
  // Keeps the 8-bar loop from machine-gunning over a long flight. Energetic
  // (heavy) kits get a crash at the loop top and snare fills into it; chill
  // kits get only a light, sparse fill so they stay calm.
  const d = tr.drums;
  const BEAT = 2 * E8;
  if (d.heavy) {
    // Crash cymbal on the downbeat of bar 0 — the phrase "1".
    all.push({ t: 0, special: 'crash', layer: 'perc2', dvol: 0.45 + drumEnergy * 0.35 });
  }
  // Snare fill on the last bar, building into the loop-top crash. Four shapes
  // rotate by loopCount so consecutive loops differ.
  const lastBar = 7 * 8 * E8;
  const variant = loopCount % 4;
  const fillBase = d.heavy ? d.snare : d.snare * 0.6;
  const fill = [];
  if (variant === 0) {
    // sparse: two pickups on the final "and"
    fill.push([lastBar + 3 * BEAT + E8, 0.7], [lastBar + 3 * BEAT + E8 + e16, 0.85]);
  } else if (variant === 1) {
    // 16th roll across the final beat
    for (let i = 0; i < 4; i++) fill.push([lastBar + 3 * BEAT + i * e16, 0.55 + i * 0.14]);
  } else if (variant === 2) {
    // 16th roll across the final two beats
    for (let i = 0; i < 8; i++) fill.push([lastBar + 2 * BEAT + i * e16, 0.45 + i * 0.07]);
  } else {
    // 32nd buildup on the final beat (heavy only — chill kits thin it out)
    const step = d.heavy ? e16 / 2 : e16;
    const n = d.heavy ? 8 : 4;
    for (let i = 0; i < n; i++) fill.push([lastBar + 3 * BEAT + i * step, 0.5 + i * (0.45 / n)]);
  }
  for (const [t, vel] of fill) all.push({ t, special: 'snare', layer: 'perc', dvol: fillBase * vel });

  // Humanization: tiny deterministic timing/velocity jitter on percussion only
  // (tonal layers stay clean). Seeded by loopCount so it's reproducible and
  // varies loop to loop. The loop-top "1" is left tight (no timing jitter).
  const rng = mulberry32((loopCount + 1) * 0x9e3779b1);
  const jT = 0.005; // ±5 ms
  for (const ev of all) {
    if (!ev.special) continue;
    if (ev.t > 0.02) ev.t = Math.max(0, ev.t + (rng() * 2 - 1) * jT);
    if (ev.dvol != null) ev.dvol *= 1 + (rng() * 2 - 1) * 0.1;
  }

  all.sort((a, b) => a.t - b.t);
  return all;
}

function makeLayer(dest, pan = 0) {
  const a = getCtx();
  if (!a) return null;
  const g = a.createGain();
  g.gain.value = 0;
  const target = dest || musicBus;
  // A fixed stereo position spreads the dry mix (only the echo was stereo
  // before). Echo/reverb sends tap the gain node `g` upstream of this pan, so
  // they keep their own width.
  if (pan && a.createStereoPanner) {
    const p = a.createStereoPanner();
    p.pan.value = pan;
    g.connect(p).connect(target);
  } else {
    g.connect(target);
  }
  return g;
}

function playNoteEvent(ev, absTime) {
  const a = getCtx();
  if (!a) return;
  const layerGain = layers[ev.layer];
  if (!layerGain) return;

  if (ev.special) {
    const dv = ev.dvol ?? 1;
    const g = a.createGain();
    if (ev.special === 'kick' || ev.special === 'kick2') {
      // Body: sine sweep. Click: tiny noise transient on top. On the high-energy
      // stations the kick punches harder (more thwack, a sub thump, a sharper
      // click); chill low-BPM kits (drumEnergy≈0) keep the original soft body.
      const deep = ev.special === 'kick2';
      // Sidechain pump: duck the musical bus on the main kick, then let it
      // breathe back up — the pumping "sssh-WAH" the dance stations live on.
      if (ev.special === 'kick' && pumpGain && pumpAmt > 0.001) {
        pumpGain.gain.cancelScheduledValues(absTime);
        pumpGain.gain.setValueAtTime(1 - pumpAmt, absTime);
        pumpGain.gain.setTargetAtTime(1, absTime + 0.001, 0.07);
      }
      const punch = 1 + drumEnergy * 0.4;
      const osc = a.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(deep ? 90 : 115 + drumEnergy * 22, absTime);
      osc.frequency.exponentialRampToValueAtTime(deep ? 21 : 30 - drumEnergy * 4, absTime + (deep ? 0.15 : 0.09));
      g.gain.setValueAtTime((deep ? 0.5 : 0.45) * dv * punch, absTime);
      g.gain.exponentialRampToValueAtTime(0.001, absTime + (deep ? 0.16 : 0.1));
      osc.connect(g).connect(layerGain);
      osc.start(absTime);
      osc.stop(absTime + 0.2);
      // Extra sub thump for body on the energetic kits.
      if (drumEnergy > 0.05) {
        const sub = a.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(deep ? 55 : 70, absTime);
        sub.frequency.exponentialRampToValueAtTime(deep ? 25 : 33, absTime + 0.12);
        const sg = a.createGain();
        sg.gain.setValueAtTime(0.3 * dv * drumEnergy, absTime);
        sg.gain.exponentialRampToValueAtTime(0.001, absTime + 0.14);
        sub.connect(sg).connect(layerGain);
        sub.start(absTime);
        sub.stop(absTime + 0.16);
      }
      if (!deep) {
        const click = a.createBufferSource();
        click.buffer = getNoiseBuffer(a);
        const hp = a.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 3000;
        const cg = a.createGain();
        cg.gain.setValueAtTime(0.12 * dv * (1 + drumEnergy * 0.8), absTime);
        cg.gain.exponentialRampToValueAtTime(0.001, absTime + 0.018);
        click.connect(hp).connect(cg).connect(layerGain);
        click.start(absTime);
        click.stop(absTime + 0.03);
      }
      return;
    }
    if (ev.special === 'snare') {
      // Tonal body + bandpassed noise crack
      const osc = a.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(210, absTime);
      osc.frequency.exponentialRampToValueAtTime(120, absTime + 0.05);
      g.gain.setValueAtTime(0.14 * dv * (1 + drumEnergy * 0.3), absTime);
      g.gain.exponentialRampToValueAtTime(0.001, absTime + 0.07);
      osc.connect(g).connect(layerGain);
      osc.start(absTime);
      osc.stop(absTime + 0.1);
      const noise = a.createBufferSource();
      noise.buffer = getNoiseBuffer(a);
      const bp = a.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2600;
      bp.Q.value = 0.8;
      const ng = a.createGain();
      ng.gain.setValueAtTime(0.22 * dv * (1 + drumEnergy * 0.35), absTime);
      ng.gain.exponentialRampToValueAtTime(0.001, absTime + 0.1);
      noise.connect(bp).connect(ng).connect(layerGain);
      noise.start(absTime);
      noise.stop(absTime + 0.12);
      return;
    }
    if (ev.special === 'clap') {
      const src = a.createBufferSource();
      src.buffer = getNoiseBuffer(a);
      const bp = a.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1600;
      bp.Q.value = 1.4;
      g.gain.setValueAtTime(0.3 * dv * (1 + drumEnergy * 0.3), absTime);
      g.gain.exponentialRampToValueAtTime(0.001, absTime + 0.08);
      src.connect(bp).connect(g).connect(layerGain);
      src.start(absTime);
      src.stop(absTime + 0.1);
      return;
    }
    if (ev.special === 'crash') {
      // Crash cymbal: bright highpassed noise with a long shimmering tail —
      // the phrase-top accent the loop never had. Quick attack, ~1.4s decay.
      const src = a.createBufferSource();
      src.buffer = getNoiseBuffer(a);
      const hp = a.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 5200;
      g.gain.setValueAtTime(0.0001, absTime);
      g.gain.exponentialRampToValueAtTime(0.16 * dv, absTime + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, absTime + 1.4);
      src.connect(hp).connect(g).connect(layerGain);
      src.start(absTime);
      src.stop(absTime + 1.5);
      return;
    }
    if (ev.special === 'shaker') {
      // Lightweight hi-frequency rattle (shaker / maraca feel)
      const src = a.createBufferSource();
      src.buffer = getNoiseBuffer(a);
      const bp = a.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 9000;
      bp.Q.value = 2.5;
      g.gain.setValueAtTime(0.07 * dv, absTime);
      g.gain.exponentialRampToValueAtTime(0.001, absTime + 0.025);
      src.connect(bp).connect(g).connect(layerGain);
      src.start(absTime);
      src.stop(absTime + 0.04);
      return;
    }
    if (ev.special === 'conga') {
      // Tonal mid-range hand-drum thump
      const osc = a.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, absTime);
      osc.frequency.exponentialRampToValueAtTime(140, absTime + 0.07);
      g.gain.setValueAtTime(0.18 * dv, absTime);
      g.gain.exponentialRampToValueAtTime(0.001, absTime + 0.1);
      osc.connect(g).connect(layerGain);
      osc.start(absTime);
      osc.stop(absTime + 0.12);
      return;
    }
    if (ev.special === 'logDrum') {
      // Amapiano log-drum: low woody thump with short sustain
      const osc = a.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(105, absTime);
      osc.frequency.exponentialRampToValueAtTime(55, absTime + 0.12);
      g.gain.setValueAtTime(0.28 * dv, absTime);
      g.gain.exponentialRampToValueAtTime(0.001, absTime + 0.18);
      osc.connect(g).connect(layerGain);
      osc.start(absTime);
      osc.stop(absTime + 0.22);
      // Woody click attack on top
      const click = a.createBufferSource();
      click.buffer = getNoiseBuffer(a);
      const bp = a.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1800;
      bp.Q.value = 3;
      const cg = a.createGain();
      cg.gain.setValueAtTime(0.1 * dv, absTime);
      cg.gain.exponentialRampToValueAtTime(0.001, absTime + 0.02);
      click.connect(bp).connect(cg).connect(layerGain);
      click.start(absTime);
      click.stop(absTime + 0.03);
      return;
    }
    // hat: metallic highpassed noise tick
    const src = a.createBufferSource();
    src.buffer = getNoiseBuffer(a);
    const hp = a.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7200;
    g.gain.setValueAtTime(0.09 * dv, absTime);
    g.gain.exponentialRampToValueAtTime(0.001, absTime + 0.03);
    src.connect(hp).connect(g).connect(layerGain);
    src.start(absTime);
    src.stop(absTime + 0.05);
    return;
  }

  // Pitched note. `stack` fattens the voice: 'detune' = two saws ±6 cents,
  // 'octave' = soft sine an octave up (bell shimmer). `slow` = pad swell.
  const att = ev.slow ? ev.durS * 0.35 : 0.008;
  const rel = ev.slow ? ev.durS * 0.3 : Math.min(ev.durS * 0.2, 0.03);

  // Shared vibrato LFO for sustained lead/melody notes — a slow, delayed pitch
  // wobble that keeps long held notes from sounding dead-static. Skipped on the
  // fast eighth-note runs (durS gate) so it never adds overhead in busy passages.
  let lfoGain = null;
  if (!ev.slow && ev.durS > 0.24 &&
      (ev.layer === 'melody' || ev.layer === 'high' || ev.layer === 'feverlead')) {
    const lfo = a.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 5.2;
    lfoGain = a.createGain();
    lfoGain.gain.setValueAtTime(0, absTime);
    lfoGain.gain.linearRampToValueAtTime(7, absTime + Math.min(0.14, ev.durS * 0.5)); // cents
    lfo.connect(lfoGain);
    lfo.start(absTime);
    lfo.stop(absTime + ev.durS + 0.02);
  }

  const spawn = (freq, vol, detuneCents = 0, type = ev.osc, pan = 0) => {
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (detuneCents) osc.detune.value = detuneCents;
    if (lfoGain) lfoGain.connect(osc.detune);
    g.gain.setValueAtTime(0, absTime);
    g.gain.linearRampToValueAtTime(vol, absTime + att);
    g.gain.setValueAtTime(vol, absTime + ev.durS - rel);
    g.gain.exponentialRampToValueAtTime(0.0001, absTime + ev.durS);

    // Per-voice lowpass with a quick filter envelope: opens bright on the attack,
    // then settles to a warmer body — the subtractive-synth move that turns a
    // bare saw/square into a "produced" tone. Pure sines have no harmonics to
    // shape, so they skip the filter (and the extra node).
    let head = osc;
    if (type !== 'sine') {
      const lp = a.createBiquadFilter();
      lp.type = 'lowpass';
      const peak = Math.min((ev.slow ? freq * 4 : freq * 7) * mixBright, 11000);
      const floor = Math.min(ev.slow ? freq * 3 : freq * 3.2, 7000);
      lp.Q.value = ev.slow ? 0.5 : 1.1;
      lp.frequency.setValueAtTime(Math.max(peak, floor + 1), absTime);
      lp.frequency.exponentialRampToValueAtTime(
        Math.max(floor, 80), absTime + Math.min(ev.durS, ev.slow ? ev.durS : 0.22));
      osc.connect(lp);
      head = lp;
    }

    if (pan && a.createStereoPanner) {
      const p = a.createStereoPanner();
      p.pan.value = pan;
      head.connect(g).connect(p).connect(layerGain);
    } else {
      head.connect(g).connect(layerGain);
    }
    osc.start(absTime);
    osc.stop(absTime + ev.durS + 0.02);
  };
  if (ev.stack === 'detune') {
    // Proper supersaw: a detuned pair panned hard L/R for width + a quieter
    // centre voice for body (was just two ±6¢ voices dead-centre before).
    spawn(ev.freq, ev.vol * 0.38, -12, ev.osc, -0.45);
    spawn(ev.freq, ev.vol * 0.38, 12, ev.osc, 0.45);
    spawn(ev.freq, ev.vol * 0.46, 0);
  } else if (ev.stack === 'octave') {
    spawn(ev.freq, ev.vol);
    spawn(ev.freq * 2, ev.vol * 0.3, 0, 'sine');
  } else {
    spawn(ev.freq, ev.vol);
  }
  // Thicken the bass with a clean sub-octave sine — subtle on chill stations,
  // strong on the high-energy ones (per the "thicker bass, punchier when fast").
  if (ev.layer === 'bass') spawn(ev.freq * 0.5, ev.vol * (0.12 + drumEnergy * 0.55), 0, 'sine');
}

function runScheduler() {
  const a = getCtx();
  if (!a || !musicActive) return;
  const now = a.currentTime;
  const horizon = now + LOOK_AHEAD;

  // Tab throttling can leave us several loops behind — skip ahead instead
  // of replaying every missed event into the safety cap.
  if (now - loopOffset > LOOP_LEN * 2) {
    loopOffset = now;
    nextEvtIdx = 0;
  }

  // Walk through events; when we reach end of loop, wrap to next loop
  let safety = 0;
  while (safety++ < 3000) {
    const ev = events[nextEvtIdx];
    const absTime = loopOffset + ev.t;

    if (absTime > horizon) break;

    if (absTime >= now - 0.01) { // allow tiny past tolerance
      playNoteEvent(ev, absTime);
    }

    nextEvtIdx++;
    if (nextEvtIdx >= events.length) {
      nextEvtIdx = 0;
      loopOffset += LOOP_LEN;
      loopCount++;
      // Rebuild every loop so fills / crash / humanization vary (cheap: a few
      // hundred events, once every several seconds). Key shifts (biome changes)
      // also fold in here, landing cleanly on the downbeat of the new loop.
      const keyShift = pendingRebuild;
      pendingRebuild = false;
      events = buildEvents();
      if (keyShift) {
        if (echoDelay) echoDelay.delayTime.value = E8 * 1.5;
        if (echoDelayR) echoDelayR.delayTime.value = E8 * 1.5;
      }
    }
  }
}

// Switch the LIVE track to idx and (re)play it: start if idle, else a quick
// fade-out → rebuild → fade-in retune. Does NOT persist — callers decide if this
// is a saved radio pick or a transient menu-theme override.
function retuneTo(idx) {
  trackIndex = ((idx % TRACKS.length) + TRACKS.length) % TRACKS.length;
  const a = getCtx();
  if (!a) return;
  if (!musicActive) { music.start(); return; }
  musicBus.gain.setTargetAtTime(0, a.currentTime, 0.04);
  setTimeout(() => {
    if (!musicActive) return;
    loopCount = 0;
    events = buildEvents();            // recomputes E8/LOOP_LEN for the new track
    if (echoDelay) echoDelay.delayTime.value = E8 * 1.5;
    if (echoDelayR) echoDelayR.delayTime.value = E8 * 1.5;
    loopOffset = ctx.currentTime + 0.06;
    nextEvtIdx = 0;
    restoreBuses(ctx);
  }, 140);
}

export const music = {
  start() {
    const a = getCtx();
    if (!a || musicActive) return;
    resumeMusicPending = false;
    restoreBuses(a, true);
    musicActive = true;
    loopCount = 0;
    events = buildEvents();

    // Sidechain "pump" bus: the musical layers route through this gain, which
    // ducks on every kick — the four-on-the-floor pump that defines the EDM /
    // house / trance / hardstyle stations. Percussion bypasses it so the kick
    // itself stays punchy and isn't ducked by its own trigger.
    pumpGain = a.createGain();
    pumpGain.gain.value = 1;
    pumpGain.connect(musicBus);

    // Bass drive: soft saturation for grit/harmonics on the aggressive saw-bass
    // stations (hardstyle, D&B, big-room); near-transparent for sine-bass kits.
    const tr0 = TRACKS[trackIndex];
    bassDrive = a.createWaveShaper();
    bassDrive.oversample = '2x';
    bassDrive.curve = makeDriveCurve(
      (tr0.voices.bass.osc === 'sawtooth' ? 0.25 + drumEnergy * 0.4 : 0.05) * mixDrive);
    bassDrive.connect(pumpGain);

    // Per-station stereo width scales the base pan positions (clamped to ±1).
    const pan = (p) => Math.max(-1, Math.min(1, p * mixWidth));
    layers = {
      bass:      makeLayer(bassDrive, 0),
      melody:    makeLayer(pumpGain, 0),
      high:      makeLayer(pumpGain, pan(0.32)),
      arp:       makeLayer(pumpGain, pan(-0.28)),
      perc:      makeLayer(musicBus, 0),
      perc2:     makeLayer(musicBus, 0),
      perc3:     makeLayer(musicBus, pan(-0.18)),
      fever:     makeLayer(pumpGain, pan(0.22)),
      feverlead: makeLayer(pumpGain, pan(-0.2)),
      wind:      makeLayer(pumpGain, 0),
      pad:       makeLayer(pumpGain, 0),
    };

    // Permanently-on layers
    layers.bass.gain.value   = 1;
    layers.melody.gain.value = 1;
    layers.pad.gain.value    = 1;

    // Reverb sends: tap each musical layer's gain (so the wet level fades with
    // the layer and respects mute). Pads/leads sit in more space than bass/arp.
    if (reverbConvolver) {
      const send = (layer, amt) => {
        if (!layer) return;
        const sg = a.createGain();
        sg.gain.value = amt * mixReverb; // per-station space
        layer.connect(sg).connect(reverbConvolver);
      };
      send(layers.melody, 0.16);
      send(layers.high, 0.26);
      send(layers.arp, 0.10);
      send(layers.pad, 0.34);
      send(layers.fever, 0.20);
      send(layers.feverlead, 0.22);
    }

    // Stereo ping-pong echo: a dotted-eighth delay that bounces L↔R with
    // filtered cross-feedback — instant width vs the old mono single-tap. Sends
    // tap the layer gains so fading a layer also fades its echoes. Falls back to
    // a centred tap where StereoPanner is unavailable (very old WebKit).
    const delayL = a.createDelay(1);
    const delayR = a.createDelay(1);
    echoDelay = delayL;
    echoDelayR = delayR;
    delayL.delayTime.value = E8 * 1.5; // dotted eighth at the track BPM
    delayR.delayTime.value = E8 * 1.5;
    const fbL = a.createGain(); fbL.gain.value = 0.34;
    const fbR = a.createGain(); fbR.gain.value = 0.34;
    const filtL = a.createBiquadFilter(); filtL.type = 'lowpass'; filtL.frequency.value = 2200;
    const filtR = a.createBiquadFilter(); filtR.type = 'lowpass'; filtR.frequency.value = 2200;
    const echoOut = a.createGain();
    echoOut.gain.value = 0.4;
    // Cross-feedback: each side feeds the OTHER, so the echo pans across.
    delayL.connect(filtL).connect(fbL).connect(delayR);
    delayR.connect(filtR).connect(fbR).connect(delayL);
    if (a.createStereoPanner) {
      const panL = a.createStereoPanner(); panL.pan.value = -0.6;
      const panR = a.createStereoPanner(); panR.pan.value = 0.6;
      delayL.connect(panL).connect(echoOut);
      delayR.connect(panR).connect(echoOut);
    } else {
      delayL.connect(echoOut);
      delayR.connect(echoOut);
    }
    echoOut.connect(musicBus);
    layers.melody.connect(delayL);
    layers.high.connect(delayL);
    layers.feverlead.connect(delayL);

    // Boost wind: looped filtered noise under the arpeggio
    stopWindSource();
    const windSrc = a.createBufferSource();
    windSource = windSrc;
    windSrc.buffer = getNoiseBuffer(a);
    windSrc.loop = true;
    const windFilter = a.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 420;
    windSrc.connect(windFilter).connect(layers.wind);
    windSrc.start();

    loopOffset = a.currentTime + 0.05;
    nextEvtIdx = 0;
    runScheduler();
    schedulerTimer = setInterval(runScheduler, SCHED_INTERVAL);
  },

  stop() {
    musicActive = false;
    stopScheduler();
    stopWindSource();
  },

  // --- Dragon Radio ---
  get trackIndex() { return trackIndex; },
  get trackName() { return TRACKS[trackIndex].name; },

  // Switch station: quick fade out, rebuild, fade back in (radio retune).
  setTrack(i) {
    const idx = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length;
    if (!trackUnlocked(idx)) return TRACKS[trackIndex].name;
    radioChosen = true;   // an explicit pick: respect it everywhere from now on
    menuOverride = false; // …and stop the title theme from taking the menu back
    saveData.audio.track = idx;
    persist();
    retuneTo(idx);        // start (menu preview) or cross-fade retune (in-game)
    return TRACKS[trackIndex].name;
  },

  // Title screen: play the menu theme without disturbing the chosen gameplay
  // station. No-ops until audio is unlocked (then it plays on the next call),
  // and stays out of the way once the player has picked a station via the radio.
  startMenuTheme() {
    if (MENU_THEME_INDEX < 0 || radioChosen) return;
    if (menuOverride && trackIndex === MENU_THEME_INDEX) return;
    menuOverride = true;
    retuneTo(MENU_THEME_INDEX);
  },
  // Back to the chosen gameplay station — called as a run starts.
  endMenuTheme() {
    if (!menuOverride) return;
    menuOverride = false;
    retuneTo(saveData.audio.track | 0);
  },

  // Cycle stations, skipping tracks not yet bought in the shop.
  nextTrack(dir = 1) {
    for (let step = 1; step <= TRACKS.length; step++) {
      const idx = ((trackIndex + dir * step) % TRACKS.length + TRACKS.length) % TRACKS.length;
      if (trackUnlocked(idx)) return this.setTrack(idx);
    }
    return TRACKS[trackIndex].name;
  },

  // Biome key shift, applied at the next loop boundary (no mid-bar lurch).
  setKeyShift(semitones) {
    if (semitones === biomeSemitones) return;
    biomeSemitones = semitones;
    pendingRebuild = true;
  },

  pauseForBackground() {
    // Idempotent: fired from BOTH the gameplay pause and the raw visibility
    // handler, and possibly twice for one background event. Remember whether music
    // was actually playing so resumeFromBackground only restarts it if it should.
    if (bgSuspended) return;
    bgSuspended = true;
    wasActiveOnBg = musicActive;
    musicActive = false;
    stopScheduler();
    stopWindSource();
    if (ctx) {
      const now = ctx.currentTime;
      // Hard-silence both buses INSTANTLY, then suspend the context IMMEDIATELY (no
      // setTimeout): the old 80ms delay left a window where the throttled background
      // audio thread rendered a slow/garbled burst on the way out.
      if (musicBus) { musicBus.gain.cancelScheduledValues(now); musicBus.gain.setValueAtTime(0, now); }
      if (sfxBus) { sfxBus.gain.cancelScheduledValues(now); sfxBus.gain.setValueAtTime(0, now); }
      try { if (ctx.state === 'running') ctx.suspend(); } catch {}
    }
    if (silentMedia) silentMedia.pause();
  },

  // Counterpart to pauseForBackground: app returned to the foreground. Do NOT
  // restart music here — this runs from visibilitychange/focus (a NON-gesture
  // context), where iOS can't truly resume the AudioContext and its currentTime has
  // jumped; rebuilding the scheduler then plays slow/garbled. Just flag the intent
  // and let tryResumeMusic() restart it once the context is genuinely running
  // (immediately on desktop/Android via the resume promise; on the next tap on iOS).
  resumeFromBackground() {
    if (!bgSuspended) return;
    bgSuspended = false;
    resumeMusicPending = wasActiveOnBg;
    // Re-kick the looping silent clip that pauseForBackground() paused — iOS needs a playing
    // HTMLAudioElement to keep the audio session in "playback", or the context won't resume.
    ensureSilentMedia();
    if (!ctx) { tryResumeMusic(); return; }
    if (ctx.state === 'suspended') {
      const p = ctx.resume();
      if (p && p.then) p.then(tryResumeMusic, () => {}); else tryResumeMusic();
    } else {
      tryResumeMusic();
    }
  },

  // Called every frame from main.js to fade layers in/out.
  update(game, player) {
    if (!musicActive || !layers.bass) return;
    const a = getCtx();
    if (!a) return;
    const now = a.currentTime;
    const FAST = 0.15;
    const SLOW = 0.5;

    // Layers come in earlier so the track builds with the very first combos
    layers.arp.gain.setTargetAtTime(player.boosting ? 1 : 0, now, FAST);
    layers.wind.gain.setTargetAtTime(player.boosting ? 0.35 : 0, now, FAST);
    layers.high.gain.setTargetAtTime(game.combo >= 1.5 ? 1 : 0, now, SLOW);
    layers.perc.gain.setTargetAtTime(game.combo >= 2 ? 1 : 0, now, FAST);
    layers.perc2.gain.setTargetAtTime(game.combo >= 3 ? 1 : 0, now, FAST);
    if (layers.perc3) layers.perc3.gain.setTargetAtTime(game.combo >= 2 ? 1 : 0, now, FAST);
    layers.fever.gain.setTargetAtTime(game.feverActive ? 1 : 0, now, FAST);
    layers.feverlead.gain.setTargetAtTime(game.feverActive ? 1 : 0, now, FAST);

    // Slightly louder music during fever (respects the volume slider)
    if (!musicMuted) {
      musicBus.gain.setTargetAtTime(musicTarget() * (game.feverActive ? 1.2 : 1.0), now, SLOW);
    }
  },
};
