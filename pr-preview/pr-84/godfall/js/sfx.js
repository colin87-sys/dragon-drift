// GODFALL RUSH audio engine — 100% synthesized, zero audio files.
// Voice design goal: cinematic orchestral-hybrid. A generated hall impulse
// (convolver send) gives weight; ensemble voices are detuned saw stacks with
// slow attacks (strings/brass), formant-filtered pulses (choir), inharmonic
// partial stacks (bells, metal impacts), and pitch-dropped sines + noise
// (taiko). One-shot combat SFX live here; the score lives in music.js.

import { save, persist } from './save.js';

let ctx = null;
let master = null;
let musicBus = null;
let sfxBus = null;
let hall = null;        // convolver (shared reverb)
let hallMusicSend = null;
let hallSfxSend = null;
let duckGain = null;    // music duck during stagger/finisher
let slowFilter = null;  // lowpass swept down in witch-time / hit-stop
let slowMoOn = false;

const musicTarget = () => (save.audio.musicMuted ? 0 : save.audio.musicVol);
const sfxTarget = () => (save.audio.sfxMuted ? 0 : save.audio.sfxVol);

// Ask iOS for a "playback" session so the mute switch doesn't kill us.
try {
  if (typeof navigator !== 'undefined' && navigator.audioSession) {
    navigator.audioSession.type = 'playback';
  }
} catch { /* unsupported */ }

// Generated hall: stereo noise burst with exponential decay + a little
// pre-delay. ~2.2s tail reads as a stone arena.
function buildHallImpulse(a) {
  const dur = 2.2;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(2, len, a.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = Math.pow(1 - t, 2.4) * (i < 600 ? i / 600 : 1);
      d[i] = (Math.random() * 2 - 1) * env;
    }
  }
  return buf;
}

export function getCtx() {
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.knee.value = 8;
      limiter.ratio.value = 5;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.22;
      master.connect(limiter);
      limiter.connect(ctx.destination);

      hall = ctx.createConvolver();
      hall.buffer = buildHallImpulse(ctx);
      const hallOut = ctx.createGain();
      hallOut.gain.value = 0.55;
      hall.connect(hallOut);
      hallOut.connect(master);

      duckGain = ctx.createGain();
      duckGain.gain.value = 1;
      slowFilter = ctx.createBiquadFilter();
      slowFilter.type = 'lowpass';
      slowFilter.frequency.value = 19000;

      musicBus = ctx.createGain();
      musicBus.gain.value = musicTarget();
      musicBus.connect(duckGain);
      duckGain.connect(slowFilter);
      slowFilter.connect(master);
      hallMusicSend = ctx.createGain();
      hallMusicSend.gain.value = 0.3;
      musicBus.connect(hallMusicSend);
      hallMusicSend.connect(hall);

      sfxBus = ctx.createGain();
      sfxBus.gain.value = sfxTarget();
      sfxBus.connect(master);
      hallSfxSend = ctx.createGain();
      hallSfxSend.gain.value = 0.14;
      sfxBus.connect(hallSfxSend);
      hallSfxSend.connect(hall);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

export function getMusicBus() { getCtx(); return musicBus; }

// --- Mobile unlock ---------------------------------------------------------
// WebKit only unlocks from a completed gesture; also loop a silent media
// element so the iOS hardware mute switch treats us as "playback".
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
let silentEl = null;
function unlock() {
  try {
    if (!silentEl) {
      silentEl = new Audio(SILENT_WAV);
      silentEl.loop = true;
      silentEl.setAttribute('playsinline', '');
    }
    if (silentEl.paused) silentEl.play().catch(() => {});
  } catch { /* fine */ }
  const a = getCtx();
  if (!a) return;
  if (a.state !== 'running') {
    a.resume();
    try {
      const src = a.createBufferSource();
      src.buffer = a.createBuffer(1, 1, 22050);
      src.connect(a.destination);
      src.start(0);
    } catch { /* fine */ }
  }
}
if (typeof window !== 'undefined') {
  for (const evt of ['touchend', 'pointerup', 'click', 'keydown']) {
    window.addEventListener(evt, unlock, { passive: true });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && silentEl) silentEl.pause();
  });
}

// --- Mix controls ------------------------------------------------------------

export function setMusicVolume(v) {
  save.audio.musicVol = Math.min(1, Math.max(0, v));
  persist();
  const a = getCtx();
  if (a && musicBus) musicBus.gain.setTargetAtTime(musicTarget(), a.currentTime, 0.05);
}
export function setSfxVolume(v) {
  save.audio.sfxVol = Math.min(1, Math.max(0, v));
  persist();
  const a = getCtx();
  if (a && sfxBus) sfxBus.gain.setTargetAtTime(sfxTarget(), a.currentTime, 0.05);
}
export function toggleMusicMute() {
  save.audio.musicMuted = !save.audio.musicMuted;
  persist();
  const a = getCtx();
  if (a && musicBus) musicBus.gain.setTargetAtTime(musicTarget(), a.currentTime, 0.06);
  return save.audio.musicMuted;
}
export function toggleSfxMute() {
  save.audio.sfxMuted = !save.audio.sfxMuted;
  persist();
  const a = getCtx();
  if (a && sfxBus) sfxBus.gain.setTargetAtTime(sfxTarget(), a.currentTime, 0.06);
  return save.audio.sfxMuted;
}
export function refreshMusicGain() {
  const a = getCtx();
  if (a && musicBus) musicBus.gain.setTargetAtTime(musicTarget(), a.currentTime, 0.05);
}

// Witch-time / heavy hit-stop: muffle the world.
export function setSlowMo(active) {
  if (active === slowMoOn) return;
  slowMoOn = active;
  const a = getCtx();
  if (!a || !slowFilter) return;
  slowFilter.frequency.setTargetAtTime(active ? 480 : 19000, a.currentTime, active ? 0.04 : 0.14);
}

// Stagger window / finisher: pull the score down so the moment breathes.
export function setMusicDuck(amount) { // 0 = none, 1 = full duck
  const a = getCtx();
  if (!a || !duckGain) return;
  duckGain.gain.setTargetAtTime(1 - amount * 0.62, a.currentTime, 0.12);
}

// --- Shared synth primitives -------------------------------------------------

let noiseBuf = null;
export function noiseBuffer(a) {
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

// One enveloped oscillator into an arbitrary node.
function osc(a, dest, { type = 'sine', freq = 440, end = 0, detune = 0, t0, attack = 0.005, dur = 0.3, release = 0, vol = 0.1 }) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(Math.max(freq, 1), t0);
  if (end) o.frequency.exponentialRampToValueAtTime(Math.max(end, 1), t0 + dur);
  if (detune) o.detune.value = detune;
  const rel = release || Math.min(dur * 0.4, 0.08);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.setValueAtTime(vol, t0 + Math.max(attack, dur - rel));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.01);
  o.connect(g).connect(dest);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

// Filtered noise burst.
function noise(a, dest, { from = 800, to = 2400, type = 'bandpass', q = 1, t0, dur = 0.25, vol = 0.1, attack = 0.002 }) {
  const src = a.createBufferSource();
  src.buffer = noiseBuffer(a);
  src.playbackRate.value = 0.7 + Math.random() * 0.6;
  const f = a.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(Math.max(from, 20), t0);
  f.frequency.exponentialRampToValueAtTime(Math.max(to, 20), t0 + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(dest);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

// --- Ensemble voices (used by music.js too) ----------------------------------

// String section: 3 saws detuned ±9 cents through a gentle lowpass.
export function vStrings(dest, { freq, dur, vol = 0.05, t0, attack }) {
  const a = getCtx(); if (!a) return;
  t0 = t0 ?? a.currentTime;
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = Math.min(freq * 6, 5200);
  lp.connect(dest);
  const at = attack ?? Math.min(dur * 0.3, 0.5);
  for (const det of [-9, 0, 9]) {
    osc(a, lp, { type: 'sawtooth', freq, detune: det, t0, attack: at, dur, release: dur * 0.3, vol: vol / 3 });
  }
}

// Brass: two saws with a short upward scoop, brighter filter, faster attack.
export function vBrass(dest, { freq, dur, vol = 0.07, t0 }) {
  const a = getCtx(); if (!a) return;
  t0 = t0 ?? a.currentTime;
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(freq * 2.5, t0);
  lp.frequency.exponentialRampToValueAtTime(Math.min(freq * 7, 6500), t0 + Math.min(0.18, dur * 0.5));
  lp.connect(dest);
  for (const det of [-6, 7]) {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'sawtooth';
    o.detune.value = det;
    o.frequency.setValueAtTime(freq * 0.97, t0);
    o.frequency.exponentialRampToValueAtTime(freq, t0 + 0.06);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol / 2, t0 + 0.045);
    g.gain.setValueAtTime(vol / 2, t0 + dur * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(lp);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }
}

// Choir "ah": pulse-ish source through two formant bandpasses (≈700/1100 Hz).
export function vChoir(dest, { freq, dur, vol = 0.05, t0 }) {
  const a = getCtx(); if (!a) return;
  t0 = t0 ?? a.currentTime;
  const mix = a.createGain();
  mix.gain.value = 1;
  for (const [f, q, g] of [[700, 7, 1], [1080, 9, 0.6]]) {
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f;
    bp.Q.value = q;
    const fg = a.createGain();
    fg.gain.value = g;
    mix.connect(bp).connect(fg).connect(dest);
  }
  const at = Math.min(dur * 0.4, 0.7);
  for (const det of [-7, 5]) {
    osc(a, mix, { type: 'square', freq, detune: det, t0, attack: at, dur, release: dur * 0.35, vol: vol / 2 });
  }
}

// Celesta/bell: sine fundamental + inharmonic partials, fast decay.
export function vBell(dest, { freq, dur = 0.9, vol = 0.08, t0 }) {
  const a = getCtx(); if (!a) return;
  t0 = t0 ?? a.currentTime;
  for (const [ratio, v, d] of [[1, 1, 1], [2.76, 0.4, 0.6], [5.4, 0.18, 0.35]]) {
    osc(a, dest, { type: 'sine', freq: freq * ratio, t0, attack: 0.003, dur: dur * d, release: dur * d * 0.8, vol: vol * v });
  }
}

// Taiko: deep pitch-dropped sine + skin slap noise. The heartbeat of the score.
export function vTaiko(dest, { vol = 0.5, t0, pitch = 120, drop = 36, dur = 0.34 }) {
  const a = getCtx(); if (!a) return;
  t0 = t0 ?? a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(pitch, t0);
  o.frequency.exponentialRampToValueAtTime(drop, t0 + dur * 0.8);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(dest);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
  noise(a, dest, { from: 900, to: 200, q: 0.7, t0, dur: 0.06, vol: vol * 0.32 });
}

export function vSnare(dest, { vol = 0.2, t0 }) {
  const a = getCtx(); if (!a) return;
  t0 = t0 ?? a.currentTime;
  osc(a, dest, { type: 'triangle', freq: 190, end: 120, t0, attack: 0.002, dur: 0.07, vol: vol * 0.5 });
  noise(a, dest, { from: 1800, to: 2600, q: 0.8, t0, dur: 0.13, vol });
}

export function vHat(dest, { vol = 0.07, t0 }) {
  const a = getCtx(); if (!a) return;
  t0 = t0 ?? a.currentTime;
  noise(a, dest, { from: 8200, to: 9000, type: 'highpass', q: 1, t0, dur: 0.035, vol });
}

export function vCymbal(dest, { vol = 0.16, t0, dur = 1.4 }) {
  const a = getCtx(); if (!a) return;
  t0 = t0 ?? a.currentTime;
  noise(a, dest, { from: 5200, to: 7600, type: 'highpass', q: 0.6, t0, dur, vol, attack: 0.004 });
}

// Trailer braam: low detuned saw cluster swelling — spectacle telegraphs.
export function vBraam(dest, { freq = 55, dur = 1.6, vol = 0.22, t0 }) {
  const a = getCtx(); if (!a) return;
  t0 = t0 ?? a.currentTime;
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(220, t0);
  lp.frequency.exponentialRampToValueAtTime(1500, t0 + dur * 0.7);
  lp.connect(dest);
  for (const det of [-18, -5, 6, 17]) {
    osc(a, lp, { type: 'sawtooth', freq, detune: det, t0, attack: dur * 0.42, dur, release: dur * 0.3, vol: vol / 4 });
  }
}

// --- Combat one-shots ---------------------------------------------------------

// Metal-on-hide impact: inharmonic clang stack + thump + noise tick.
function metalHit(weight, freqBase) {
  const a = getCtx(); if (!a) return;
  const t0 = a.currentTime;
  const ratios = [1, 1.42, 2.09, 2.93];
  ratios.forEach((r, i) => {
    osc(a, sfxBus, {
      type: 'triangle', freq: freqBase * r * (0.97 + Math.random() * 0.06),
      t0, attack: 0.001, dur: 0.1 + weight * 0.1 - i * 0.015, vol: (0.1 - i * 0.018) * (0.7 + weight * 0.6),
    });
  });
  osc(a, sfxBus, { type: 'sine', freq: 150 - weight * 40, end: 50, t0, attack: 0.001, dur: 0.12 + weight * 0.1, vol: 0.12 + weight * 0.12 });
  noise(a, sfxBus, { from: 3200, to: 900, q: 0.8, t0, dur: 0.05, vol: 0.1 });
}

export const sfx = {
  // Weapon connects — pitch identity per class, weight scales the punch.
  hitSword()      { metalHit(0.4, 620); },
  hitSpear()      { metalHit(0.3, 780); },
  hitGreatsword() { metalHit(1.0, 380); },
  hitDaggers()    { metalHit(0.15, 950); },
  whiff() {
    const a = getCtx(); if (!a) return;
    noise(a, sfxBus, { from: 500, to: 2600, q: 1.4, t0: a.currentTime, dur: 0.16, vol: 0.07 });
  },

  // Warp-strike: crystalline riser → impact crack → shimmer return.
  warpRiser() {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    osc(a, sfxBus, { type: 'sawtooth', freq: 220, end: 1400, t0, attack: 0.01, dur: 0.2, vol: 0.07 });
    noise(a, sfxBus, { from: 1200, to: 6800, q: 2, t0, dur: 0.2, vol: 0.1 });
  },
  warpImpact() {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    metalHit(0.8, 540);
    osc(a, sfxBus, { type: 'sine', freq: 90, end: 34, t0, attack: 0.001, dur: 0.3, vol: 0.22 });
    vBell(sfxBus, { freq: 1244, dur: 0.5, vol: 0.06, t0 });
  },
  warpReturn() {
    const a = getCtx(); if (!a) return;
    noise(a, sfxBus, { from: 4800, to: 900, q: 1.6, t0: a.currentTime, dur: 0.18, vol: 0.06 });
  },
  warpDeny() {
    const a = getCtx(); if (!a) return;
    osc(a, sfxBus, { type: 'square', freq: 220, end: 160, t0: a.currentTime, attack: 0.002, dur: 0.12, vol: 0.05 });
  },

  dodge() {
    const a = getCtx(); if (!a) return;
    noise(a, sfxBus, { from: 700, to: 3000, q: 1.1, t0: a.currentTime, dur: 0.17, vol: 0.09 });
  },
  // Perfect dodge: glass chime + the world bending down a third.
  perfectDodge() {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    vBell(sfxBus, { freq: 1567, dur: 0.7, vol: 0.1, t0 });
    osc(a, sfxBus, { type: 'sine', freq: 880, end: 700, t0, attack: 0.01, dur: 0.5, vol: 0.05 });
  },

  // Telegraph severities: light blink, heavy horn, spectacle braam.
  warnLight() {
    const a = getCtx(); if (!a) return;
    osc(a, sfxBus, { type: 'triangle', freq: 980, t0: a.currentTime, attack: 0.004, dur: 0.1, vol: 0.07 });
  },
  warnHeavy() {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    vBrass(sfxBus, { freq: 174, dur: 0.5, vol: 0.1, t0 });
    osc(a, sfxBus, { type: 'triangle', freq: 980, t0, attack: 0.004, dur: 0.09, vol: 0.06 });
  },
  warnSpectacle() {
    vBraam(sfxBus, { freq: 49, dur: 1.7, vol: 0.3 });
    const a = getCtx(); if (!a) return;
    vCymbal(sfxBus, { vol: 0.07, t0: a.currentTime, dur: 1.6 });
  },

  bossHurt(weight = 0) {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    osc(a, sfxBus, { type: 'sawtooth', freq: 120 - weight * 30, end: 60, t0, attack: 0.002, dur: 0.18 + weight * 0.15, vol: 0.06 + weight * 0.06 });
  },

  // Stagger break: glass shatter cascade over a braam — the payoff moment.
  staggerBreak() {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    vBraam(sfxBus, { freq: 65, dur: 1.1, vol: 0.24, t0 });
    for (let i = 0; i < 7; i++) {
      vBell(sfxBus, { freq: 900 + Math.random() * 1600, dur: 0.4, vol: 0.05, t0: t0 + i * 0.045 });
    }
    osc(a, sfxBus, { type: 'sine', freq: 80, end: 30, t0, attack: 0.002, dur: 0.5, vol: 0.26 });
  },
  staggerRecover() {
    const a = getCtx(); if (!a) return;
    noise(a, sfxBus, { from: 300, to: 1800, q: 1, t0: a.currentTime, dur: 0.4, vol: 0.09 });
  },

  heroHurt() {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    osc(a, sfxBus, { type: 'square', freq: 170, end: 70, t0, attack: 0.001, dur: 0.2, vol: 0.1 });
    noise(a, sfxBus, { from: 2000, to: 500, q: 1, t0, dur: 0.1, vol: 0.07 });
  },
  heroDown() {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    osc(a, sfxBus, { type: 'sawtooth', freq: 200, end: 38, t0, attack: 0.002, dur: 1.0, vol: 0.13 });
    vBraam(sfxBus, { freq: 41, dur: 1.8, vol: 0.2, t0: t0 + 0.1 });
  },

  armigerOn() {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    [392, 494, 587, 784].forEach((f, i) =>
      vBell(sfxBus, { freq: f, dur: 0.6, vol: 0.08, t0: t0 + i * 0.07 }));
    noise(a, sfxBus, { from: 600, to: 7000, q: 1.4, t0, dur: 0.5, vol: 0.08 });
  },

  // Per-boss roars: layered detuned saws through swept filters + noise body.
  roar(kind = 'leviathan') {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    const P = {
      leviathan: { f: 90, sweep: [300, 1400], dur: 1.3, type: 'sawtooth' },
      titan:     { f: 48, sweep: [120, 500],  dur: 1.6, type: 'sawtooth' },
      ramuh:     { f: 130, sweep: [500, 2600], dur: 1.1, type: 'square' },
      bahamut:   { f: 70, sweep: [200, 2000], dur: 1.5, type: 'sawtooth' },
    }[kind] || { f: 80, sweep: [200, 1200], dur: 1.2, type: 'sawtooth' };
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(P.sweep[0], t0);
    bp.frequency.exponentialRampToValueAtTime(P.sweep[1], t0 + P.dur * 0.45);
    bp.frequency.exponentialRampToValueAtTime(P.sweep[0] * 0.8, t0 + P.dur);
    bp.connect(sfxBus);
    for (const det of [-26, 0, 19]) {
      osc(a, bp, { type: P.type, freq: P.f, detune: det, t0, attack: 0.06, dur: P.dur, release: P.dur * 0.4, vol: 0.09 });
    }
    noise(a, sfxBus, { from: 150, to: 700, q: 0.6, t0, dur: P.dur * 0.8, vol: 0.1, attack: 0.05 });
    if (kind === 'ramuh') {
      // Thunder crack on top
      noise(a, sfxBus, { from: 5000, to: 300, q: 0.5, t0: t0 + 0.05, dur: 0.7, vol: 0.16 });
    }
  },

  // --- UI ---
  uiTick() {
    const a = getCtx(); if (!a) return;
    osc(a, sfxBus, { type: 'sine', freq: 1320, t0: a.currentTime, attack: 0.001, dur: 0.05, vol: 0.05 });
  },
  uiMove() {
    const a = getCtx(); if (!a) return;
    osc(a, sfxBus, { type: 'sine', freq: 880, t0: a.currentTime, attack: 0.001, dur: 0.04, vol: 0.04 });
  },
  uiBack() {
    const a = getCtx(); if (!a) return;
    osc(a, sfxBus, { type: 'sine', freq: 620, end: 480, t0: a.currentTime, attack: 0.001, dur: 0.08, vol: 0.05 });
  },
  uiBuy() {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    [659, 880, 1318].forEach((f, i) => vBell(sfxBus, { freq: f, dur: 0.4, vol: 0.07, t0: t0 + i * 0.07 }));
  },
  uiEquip() {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    metalHit(0.3, 700);
    vBell(sfxBus, { freq: 988, dur: 0.4, vol: 0.05, t0 });
  },
  uiDeny() {
    const a = getCtx(); if (!a) return;
    osc(a, sfxBus, { type: 'square', freq: 200, end: 150, t0: a.currentTime, attack: 0.002, dur: 0.14, vol: 0.06 });
  },
  weaponCycle() {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    noise(a, sfxBus, { from: 2400, to: 5200, q: 2.2, t0, dur: 0.12, vol: 0.06 });
    vBell(sfxBus, { freq: 1175, dur: 0.3, vol: 0.05, t0: t0 + 0.03 });
  },
  rankSlam(rank) {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    vTaiko(sfxBus, { vol: 0.5, t0, pitch: 140, drop: 40 });
    const f = rank === 'S' ? 1046 : rank === 'A' ? 880 : rank === 'B' ? 740 : 622;
    vBell(sfxBus, { freq: f, dur: 1.1, vol: 0.12, t0: t0 + 0.04 });
    if (rank === 'S') {
      [1318, 1568, 2093].forEach((ff, i) => vBell(sfxBus, { freq: ff, dur: 0.8, vol: 0.07, t0: t0 + 0.15 + i * 0.09 }));
    }
  },
  countTick(i = 0) {
    const a = getCtx(); if (!a) return;
    osc(a, sfxBus, { type: 'sine', freq: 990 + (i % 5) * 60, t0: a.currentTime, attack: 0.001, dur: 0.04, vol: 0.04 });
  },
  medal() {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    [784, 988, 1175, 1568].forEach((f, i) => vBell(sfxBus, { freq: f, dur: 0.5, vol: 0.08, t0: t0 + i * 0.08 }));
  },
  levelUp() {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    [523, 659, 784, 1046].forEach((f, i) => {
      vBrass(sfxBus, { freq: f / 2, dur: 0.35, vol: 0.06, t0: t0 + i * 0.1 });
      vBell(sfxBus, { freq: f, dur: 0.5, vol: 0.07, t0: t0 + i * 0.1 });
    });
  },

  // Traversal chase: each beacon hop rises a step.
  beaconHop(i = 0) {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    const f = 740 * Math.pow(2, Math.min(i, 7) / 12);
    vBell(sfxBus, { freq: f, dur: 0.4, vol: 0.09, t0 });
    noise(a, sfxBus, { from: 1500, to: 5600, q: 2, t0, dur: 0.14, vol: 0.07 });
  },

  thunder() {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    noise(a, sfxBus, { from: 3000, to: 120, q: 0.4, t0, dur: 1.3, vol: 0.1, attack: 0.01 });
    osc(a, sfxBus, { type: 'sine', freq: 70, end: 30, t0: t0 + 0.04, attack: 0.01, dur: 0.8, vol: 0.1 });
  },

  finisherBlow(i = 0) {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    metalHit(1, 460 + i * 80);
    vTaiko(sfxBus, { vol: 0.4, t0, pitch: 130 + i * 12, drop: 38 });
  },
  bossDissolve() {
    const a = getCtx(); if (!a) return;
    const t0 = a.currentTime;
    noise(a, sfxBus, { from: 400, to: 5200, q: 0.8, t0, dur: 2.2, vol: 0.12, attack: 0.3 });
    vBraam(sfxBus, { freq: 36, dur: 2.4, vol: 0.2, t0 });
    for (let i = 0; i < 6; i++) {
      vBell(sfxBus, { freq: 1046 + i * 220, dur: 1.0, vol: 0.04, t0: t0 + 0.5 + i * 0.16 });
    }
  },
};

// Haptics — tiny wrapper so callers never feature-test.
export function buzz(pattern) {
  if (!save.settings.haptics) return;
  try { navigator.vibrate && navigator.vibrate(pattern); } catch { /* fine */ }
}
