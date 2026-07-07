// Dragon Drift audio engine.
// Procedural chiptune-pop music reacts to gameplay.
// Layer unlock order: bass+melody always → arpeggio on boost →
// high-lead on combo≥2 → percussion on combo≥3 → fever sparkle on surge.

import { saveData, persist } from './save.js';
import { TRACKS } from './tracks.js';
import { mulberry32 } from './util.js';
import { upgradeMasterChain } from './sfxLimiter.js';
import { snapToChord, chordLadder, nextGridDelay } from './harmony.js';
import { INSTS } from './insts.js';
import { sectionAt, chooseSection, melodyVariant } from './composer.js';
import { on } from './events.js';

export { TRACKS };

// Mastering v2 rollout flag: ON by default; `?audio=v1` restores the shipped
// master chain (tanh ceiling, no tape stage, no per-station loudness trims) —
// the A/B escape hatch for judging the overhaul on the PR preview.
const AUDIO_V2 = (() => {
  try { return !/[?&]audio=v1(&|$)/.test(window.location.search); } catch { return true; }
})();
let limiterActive = false;   // worklet limiter engaged (false = shipped chain)
let audioUnderruns = 0;      // audio-thread stall beacons from the limiter worklet
// Debug readout (audio-thread health is invisible to fps meters).
export function getAudioHealth() {
  return {
    v2: AUDIO_V2,
    limiterActive,
    underruns: audioUnderruns,
    ctxState: ctx ? ctx.state : 'none',
    musicActive,
    kitBaked: !!(bakedKit && bakedKit.trackId === TRACKS[trackIndex].id),
    beatClock: !!getBeatClock(),
    harmony: !!getHarmony(),
    bossActive, bossSemitones,
  };
}

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

// §5f MUSIC-DEATH (slot 10 KNELLGRAVE's granted rule-break): while `musicKilled`,
// the music BUS is hard-zeroed but the layers + beat scheduler KEEP RUNNING — the
// world goes silent yet getBeatClock stays live, so the boss's toll still quantizes
// to the (inaudible) grid. Folded into musicTarget() so every other gain path (mute
// toggles, volume sliders, the bg-suspend restore) PRESERVES the kill — the silence
// cannot be accidentally un-killed by a settings tweak or a tab switch.
let musicKilled = false;
const musicTarget = () => ((musicMuted || musicKilled) ? 0 : saveData.audio.musicVol);
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
// Per-genre reverb "spaces". Each is a set of impulse-response params: `seconds`
// (tail length), `decay` (exp falloff), `predelayMs` (gap before the tail — a
// bigger gap reads as a bigger room and keeps the dry signal clear), `damping`
// (0..1 — how hard the tail darkens over time, the frequency-dependent decay
// that separates a real room from white-noise-with-an-envelope). Stations pick
// one via `mix.irPreset`; the default matches the roster's baseline space.
const IR_PRESETS = {
  default: { seconds: 2.4, decay: 2.8, predelayMs: 18, damping: 0.5 },
  hall:    { seconds: 3.4, decay: 2.2, predelayMs: 40, damping: 0.42 }, // epic/orchestral — vast, slow
  plate:   { seconds: 2.2, decay: 2.6, predelayMs: 12, damping: 0.32 }, // bright dense sheen (synthwave/trance)
  room:    { seconds: 1.4, decay: 3.4, predelayMs: 9,  damping: 0.6 },  // tight + dry (dnb/hardstyle/house)
  dark:    { seconds: 1.8, decay: 3.0, predelayMs: 14, damping: 0.78 }, // warm, muffled (lofi/tropical)
};
function irParams(preset) {
  return IR_PRESETS[preset] || IR_PRESETS.default;
}

// Generated reverb impulse: exponentially-decaying decorrelated stereo noise,
// now with a PRE-DELAY (silent gap → room size + dry clarity) and a
// FREQUENCY-DEPENDENT decay (a one-pole lowpass whose smoothing tightens along
// the tail, so highs die before lows exactly like a real space absorbs them).
function makeImpulse(a, preset) {
  const { seconds, decay, predelayMs, damping } = irParams(preset);
  const sr = a.sampleRate;
  const len = Math.max(1, Math.floor(sr * seconds));
  const pre = Math.max(0, Math.floor(sr * predelayMs / 1000));
  const buf = a.createBuffer(2, len, sr);
  const tail = Math.max(1, len - pre);
  for (let ch = 0; ch < 2; ch++) {
    // Seeded noise (not Math.random) so offline renders are reproducible — the
    // loudness CI depends on it. Different seed per channel = a wide, decorrelated tail.
    const rng = mulberry32(0x51F0AD ^ (ch * 0x9e3779b1));
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      if (i < pre) { d[i] = 0; continue; }   // pre-delay: dry-to-wet gap
      const t = (i - pre) / tail;
      // One-pole lowpass, smoothing increases with t → the tail goes dark.
      const coef = 1 - damping * t;          // 1 (bright, early) → 1-damping (dark, late)
      lp += coef * ((rng() * 2 - 1) - lp);
      d[i] = lp * Math.pow(1 - t, decay);
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

// Build the shared master/bus chain onto context `a`. The offline renderer
// (sfxRender.js) builds this exact chain, so what the loudness calibration
// measures IS the master path the game plays through. Bus gains are
// parameterized: live uses the saved volumes, the renderer uses unity.
// Tape-style saturation for the music bus (mastering v2): a gently asymmetric
// soft curve — the asymmetry adds the even harmonics ("warmth") a symmetric
// tanh can't. The x² term generates DC, so a 10 Hz high-pass follows it.
let _tapeCurve = null;
function makeTapeCurve() {
  if (_tapeCurve) return _tapeCurve;
  const n = 2048;
  _tapeCurve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    _tapeCurve[i] = Math.tanh(1.1 * x + 0.09 * x * x);
  }
  return _tapeCurve;
}

function buildBusGraph(a, musicGain = 1, sfxGain = 1, { v2 = AUDIO_V2, irPreset = null } = {}) {
  const masterGain = a.createGain();
  masterGain.gain.value = 1;
  // Soft master compressor: lets the stacked layers run hot without clipping
  const comp = a.createDynamicsCompressor();
  comp.threshold.value = -12;
  comp.ratio.value = 4;
  comp.attack.value = 0.004;
  comp.release.value = 0.18;
  // Brickwall-ish soft limiter after the compressor: stacked layers + drum
  // transients can never clip into harsh digital crackle.
  const limiter = a.createWaveShaper();
  limiter.curve = makeTanhCurve();
  limiter.oversample = '4x';
  masterGain.connect(comp);
  comp.connect(limiter);
  limiter.connect(a.destination);
  const musicBus = a.createGain();
  musicBus.gain.value = musicGain;
  // Master "glue" EQ on MUSIC only: a gentle low-mid scoop clears the mud the
  // stacked saw/triangle layers build up. SFX bypass it and stay crisp.
  const glue = a.createBiquadFilter();
  glue.type = 'peaking';
  glue.frequency.value = 320;
  glue.Q.value = 0.9;
  glue.gain.value = -2.5;
  // Slow-mo filter: music ducks underwater during near-death time dilation
  const slowFilter = a.createBiquadFilter();
  slowFilter.type = 'lowpass';
  slowFilter.frequency.value = 18000;
  musicBus.connect(glue);
  if (v2) {
    // Mastering v2: glue → tape saturation → DC block → slow-mo filter. The
    // tape stage is the "expensive glue" between the EQ and the dynamics.
    const tape = a.createWaveShaper();
    tape.curve = makeTapeCurve();
    tape.oversample = '2x';
    const dcBlock = a.createBiquadFilter();
    dcBlock.type = 'highpass';
    dcBlock.frequency.value = 10;
    dcBlock.Q.value = 0.5;
    glue.connect(tape);
    tape.connect(dcBlock);
    dcBlock.connect(slowFilter);
  } else {
    glue.connect(slowFilter);
  }
  slowFilter.connect(masterGain);
  const sfxBus = a.createGain();
  sfxBus.gain.value = sfxGain;
  sfxBus.connect(masterGain);
  // Reverb send/return: a convolution tail (generated impulse) shared by the
  // musical layers. The return routes back into the music bus so it inherits
  // music mute/volume and gets muffled by the slow-mo lowpass like the rest
  // of the score. Per-layer send levels are set up in music.start().
  const reverbConvolver = a.createConvolver();
  reverbConvolver.buffer = makeImpulse(a, v2 ? irPreset : null);
  const reverbReturn = a.createGain();
  reverbReturn.gain.value = 0.9;
  if (v2) {
    // High-pass the reverb return (v2): keep the low end dry and defined —
    // reverb energy below ~200 Hz is just mud on a phone speaker.
    const rHp = a.createBiquadFilter();
    rHp.type = 'highpass';
    rHp.frequency.value = 200;
    rHp.Q.value = 0.5;
    reverbConvolver.connect(rHp);
    rHp.connect(reverbReturn);
  } else {
    reverbConvolver.connect(reverbReturn);
  }
  reverbReturn.connect(musicBus);
  // comp + clipper handles are exposed for the async worklet-limiter upgrade
  // (sfxLimiter.js) — which rewires the tail or, on any failure, leaves this
  // shipped chain untouched.
  return { masterGain, musicBus, sfxBus, slowFilter, reverbConvolver, reverbReturn, comp, clipper: limiter };
}

// Engage the worklet lookahead limiter on a freshly-built bus graph (async;
// the shipped chain keeps playing until — and unless — the upgrade lands).
function tryUpgradeMaster(a, g) {
  if (!AUDIO_V2) return;
  upgradeMasterChain(a, g, () => { audioUnderruns++; })
    .then((ok) => { limiterActive = ok; })
    .catch(() => {});
}

function getCtx() {
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const g = buildBusGraph(ctx, musicTarget(), sfxTarget(),
        { irPreset: TRACKS[trackIndex]?.mix?.irPreset });
      masterGain = g.masterGain;
      musicBus = g.musicBus;
      sfxBus = g.sfxBus;
      slowFilter = g.slowFilter;
      reverbConvolver = g.reverbConvolver;
      reverbReturn = g.reverbReturn;
      tryUpgradeMaster(ctx, g);
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

// musicKill(): the run's music DIES (KNELLGRAVE's fight-long silence — §5f). A fast
// ~0.15s fade to zero (a cut reads as a bug; a fast fade reads as the world losing
// its voice). musicRestore(): the slow breath back in under the defeat fanfare /
// resetBoss (~0.6s). Both idempotent; skip must NOT call restore (the silence holds
// for the whole fight).
export function musicKill() {
  if (musicKilled) return;
  musicKilled = true;
  const a = getCtx();
  if (a && musicBus) musicBus.gain.setTargetAtTime(0, a.currentTime, 0.15);
}

export function musicRestore() {
  if (!musicKilled) return;
  musicKilled = false;
  const a = getCtx();
  if (a && musicBus) musicBus.gain.setTargetAtTime(musicTarget(), a.currentTime, 0.6);
}

// test/debug seam: is the music currently killed (and what is the bus's target)?
export function musicKillState() { return { killed: musicKilled, target: musicTarget() }; }

// THE TOLL — KNELLGRAVE's voice (§5b VOICE: a struck-bell partial, low register).
// A procedural bell strike: inharmonic partials (hum/prime/tierce/quint/nominal at
// ~0.5/1/1.2/1.5/2 of the strike tone) with long exponential decays + a short noise
// strike transient. Routed to the SFX bus so it SURVIVES the music-death — the toll
// is the only clock precisely because the music is dead. `k` scales weight (the
// accelerating final tolls hit harder); decay shortens as k rises (urgent, not muddy).
export function bellToll(k = 1, vol = 1) {
  const a = getCtx();
  if (!a || !sfxBus || sfxMuted) return;
  const t0 = a.currentTime;
  const out = a.createGain();
  out.gain.value = (0.5 + k * 0.35) * vol;   // vol < 1 = the distant foreshadow tolls
  out.connect(sfxBus);
  const F0 = 72;                                   // the strike tone — low, funeral register
  const partials = [[0.5, 0.5, 5.2], [1.0, 1.0, 3.8], [1.2, 0.55, 2.6], [1.5, 0.34, 2.0], [2.0, 0.25, 1.4], [2.66, 0.14, 0.9]];
  for (const [ratio, amp, dec] of partials) {
    const o = a.createOscillator();
    o.type = 'sine';
    o.frequency.value = F0 * ratio * (1 + (Math.random() - 0.5) * 0.004);   // hair of detune = cast metal
    const g = a.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(amp, t0 + 0.008);
    const d = dec * (1.1 - k * 0.25);              // heavier tolls ring slightly shorter (urgency)
    g.gain.exponentialRampToValueAtTime(0.0004, t0 + d);
    o.connect(g); g.connect(out);
    o.start(t0); o.stop(t0 + d + 0.05);
  }
  // the strike transient: a short band-passed noise burst (the clapper hitting bronze).
  const nLen = 0.06;
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * nLen), a.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
  const src = a.createBufferSource(); src.buffer = buf;
  const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 480; bp.Q.value = 1.2;
  const ng = a.createGain(); ng.gain.value = 0.5 * k;
  src.connect(bp); bp.connect(ng); ng.connect(out);
  src.start(t0);
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

// getBeatClock (§5i): expose the music engine's private beat grid so boss RHYTHM
// signatures (bossRhythm.js) can quantize attack tickets to the track's beat —
// the "rhythm is a fairness subsidy" law (dense patterns land ON the grid). The
// grid was always private (per-track bpm + an eighth-note scheduler); this is the
// read-only window onto it the phrase machine asked for.
//
// Returns null when music isn't running (headless tests, muted, backgrounded) —
// callers MUST fall back to plain timing, so no boss ever depends on audio to
// fire fairly. `beat` is fractional quarter-notes since the loop started; `phase`
// is 0..1 within the current beat; `toNextBeat` is seconds to the next downbeat.
export function getBeatClock() {
  if (!musicActive || bgSuspended || !ctx) return null;
  const beatLen = E8 * 2;                       // seconds per quarter-note beat
  const sinceLoop = ctx.currentTime - loopOffset;
  if (!(beatLen > 0) || !Number.isFinite(sinceLoop)) return null;
  const beat = sinceLoop / beatLen;
  const phase = beat - Math.floor(beat);
  return { bpm: TRACKS[trackIndex].bpm, beatLen, beat, phase, toNextBeat: beatLen * (1 - phase) };
}

// Harmony oracle: what chord is sounding NOW. The station data already
// encodes its harmony — each bar's 8-note arp cycle IS the current chord's
// tones (transposed by the biome key shift). Pitched SFX snap to these so
// pickups/parries/fanfares land in the station's key and read as part of the
// arrangement (the Rez / Tetris Effect move).
//
// Returns null when music isn't running — the SAME contract as getBeatClock:
// every consumer MUST fall back to its fixed-pitch behavior, so no sound
// ever depends on audio state (headless CI stays deterministic).
export function getHarmony() {
  if (!musicActive || bgSuspended || !ctx) return null;
  const barLen = 8 * E8;
  const sinceLoop = ctx.currentTime - loopOffset;
  if (!(barLen > 0) || !Number.isFinite(sinceLoop) || sinceLoop < 0) return null;
  const bar = Math.floor(sinceLoop / barLen) % 8;
  const tr = TRACKS[trackIndex];
  const km = Math.pow(2, (biomeSemitones + bossSemitones) / 12);
  return { chord: tr.arps[bar % 4].map((f) => f * km), bar };
}

// Snap a designed pitch to the current chord (identity when music is off).
function inKey(freq) {
  const h = getHarmony();
  return h ? snapToChord(freq, h.chord) : freq;
}

// Delay (seconds) to the next 16th of the live beat grid — for the *musical*
// tail of reward sounds only, never input acknowledgment. 0 when music is off.
function toGrid16() {
  return nextGridDelay(getBeatClock(), 4);
}

// --- Noise helper: one cached 2s white-noise buffer, one-shot sources ---
let noiseBuffer = null;
function getNoiseBuffer(a) {
  if (!noiseBuffer) {
    noiseBuffer = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    // Seeded (see makeImpulse): white noise is white regardless of seed, and
    // deterministic renders make the audio CI gates possible.
    const rng = mulberry32(0x0153B0F);
    for (let i = 0; i < data.length; i++) data[i] = rng() * 2 - 1;
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

// --- Looping SFX handles (surge-ready hum, surge-active crackle) ---
// Persistent node graphs, started/stopped by the boss controller. Modeled on the
// music engine's windSource loop: one long-lived source + an LFO, torn down on stop.
let surgeReadyNodes = null;
let surgeCrackleNodes = null;
let dwellHumNodes = null;   // V5/PR7: the LANCE dwell "closing-in" hum (frequency tracks progress)

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
    const h = getHarmony();
    let f;
    if (h) {
      f = chordLadder(880, h.chord, Math.min(streak - 1, 9)); // live chord tones
    } else {
      const PENTA = [0, 2, 4, 7, 9];
      const step = PENTA[(streak - 1) % 5] + Math.floor((streak - 1) / 5) * 12;
      f = 880 * Math.pow(2, Math.min(step, 24) / 12);
    }
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
  // §5f WEFTWITCH (slot 11) signature voices — the loom is MUSICAL.
  // The stitch-pluck: a taut-string pluck per fired stitch (the 'aimed' release).
  // Bright short fundamental + one inharmonic partial (the sfx.ring recipe family),
  // snapped in-key so a volley of stitches lands in the station chord.
  stitchPluck() {
    const f = inKey(520);
    tone({ freq: f, end: f * 0.94, dur: 0.15, type: 'triangle', vol: 0.09 });
    tone({ freq: f * 2.51, dur: 0.2, type: 'sine', vol: 0.045 });
  },
  // The needle-pull: thread drawn taut (the 'aimed' wind-up twin of the visual
  // tell) — a rising bandpassed drag + a thin tension glide. Also fired when the
  // thread is CUT (a violent pull is the same gesture, torn).
  needlePull() {
    noiseWhoosh({ from: 900, to: 2600, dur: 0.18, vol: 0.1, q: 1.8 });
    tone({ freq: 340, end: 700, dur: 0.16, type: 'sawtooth', vol: 0.035, delay: 0.02 });
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
      const h = getHarmony();
      let base;
      if (h) {
        base = chordLadder(600, h.chord, Math.min(streak - 1, 9)); // live chord tones
      } else {
        const penta = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
        const semi = penta[Math.min(streak - 1, penta.length - 1)] || 0;
        base = 600 * Math.pow(2, semi / 12);
      }
      tone({ freq: base, end: base * 2, dur: 0.16, type: 'triangle', vol: 0.12 });
      tone({ freq: base * 2.01, dur: 0.2, type: 'sine', vol: 0.06, delay: 0.02 });
      tone({ freq: base * 3, dur: 0.12, type: 'sine', vol: 0.04, delay: 0.03 });
    } else {
      tone({ freq: 440, end: 680, dur: 0.12, type: 'triangle', vol: 0.09 });
      tone({ freq: 900, dur: 0.14, type: 'sine', vol: 0.04, delay: 0.02 });
    }
  },
  // Boss stinger: a low, dark brass-ish swell — the "menace arrives" accent
  // when a boss appears or advances a phase. Key-aware (roots on the station's
  // current chord, so it lands IN the music) and drops onto the next beat via
  // the beat grid. `depth` (phase) makes later phases lower + grittier.
  bossStinger(depth = 0) {
    const a = getCtx();
    if (!a) return;
    const d0 = toGrid16();
    const base = inKey(98) * Math.pow(2, -Math.min(depth, 3) / 12);   // sink a semitone per phase
    // Low fifth-stacked swell (power-chord menace) + a noise swell under it.
    [1, 1.5, 2].forEach((mult, i) => {
      const f = base * mult;
      tone({ freq: f, end: f * 0.98, dur: 0.9 - i * 0.1, type: i === 0 ? 'sawtooth' : 'triangle',
        vol: (i === 0 ? 0.14 : 0.07) + depth * 0.01, delay: d0 + i * 0.015 });
    });
    tone({ freq: base * 0.5, dur: 1.0, type: 'sine', vol: 0.12, delay: d0 });   // sub
    noiseWhoosh({ from: 300, to: 90, dur: 0.8, vol: 0.1, q: 0.7, delay: d0 });   // dark riser-down
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
    // Key-aware fanfare: built from the LIVE station chord so the payoff
    // resolves INTO the music (hardcoded G-major over a minor station read as
    // a wrong note at the game's biggest moment). Fixed G-major fallback.
    const h = getHarmony();
    const root = h ? snapToChord(392, h.chord) : 392;
    const rung = (i) => (h ? chordLadder(root, h.chord, i)
      : root * Math.pow(2, [0, 4, 7, 12, 16, 19][i] / 12));
    for (let i = 0; i < 6; i++) {
      const f = rung(i);
      tone({ freq: f, end: f, dur: 0.5, type: 'triangle', vol: 0.12, delay: i * 0.075 });
      tone({ freq: f * 2, dur: 0.4, type: 'sine', vol: 0.05, delay: i * 0.075 + 0.01 });
    }
    // Final bloom chord + bright shimmer.
    const bloom = h ? [0, 2, 3, 4].map((i) => chordLadder(root, h.chord, i))
      : [0, 7, 12, 16].map((s) => root * Math.pow(2, s / 12));
    for (const f of bloom) tone({ freq: f, dur: 1.1, type: 'sine', vol: 0.07, delay: 0.5 });
    tone({ freq: root * 8, dur: 0.5, type: 'triangle', vol: 0.05, delay: 0.55 }); // sparkle
  },
  // Surge READY: a soft, looping, enticing hum that says "unleash me". Two detuned
  // voices a fifth apart with a slow tremolo swell + a gentle high shimmer, kept
  // quiet so it sits under the music as a pull, not a nag. Start/stop as the meter
  // fills / is spent. Idempotent (a second start is a no-op).
  surgeReadyStart() {
    const a = getCtx();
    if (!a || !sfxBus || surgeReadyNodes) return;
    const out = a.createGain();
    out.gain.setValueAtTime(0.0001, a.currentTime);
    out.gain.exponentialRampToValueAtTime(0.05, a.currentTime + 0.4);   // fade in
    out.connect(sfxBus);
    // Tremolo LFO: a slow breathing swell on the whole hum (the "come on…" pulse).
    const trem = a.createGain();
    trem.gain.value = 1;
    const lfo = a.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 2.4;
    const lfoDepth = a.createGain();
    lfoDepth.gain.value = 0.5;
    lfo.connect(lfoDepth).connect(trem.gain);
    trem.connect(out);
    const oscs = [];
    for (const [freq, det, type, vol] of [[330, -4, 'triangle', 0.6], [495, 5, 'sine', 0.4], [990, 0, 'sine', 0.16]]) {
      const o = a.createOscillator();
      o.type = type; o.frequency.value = freq; o.detune.value = det;
      const g = a.createGain(); g.gain.value = vol;
      o.connect(g).connect(trem);
      o.start();
      oscs.push(o);
    }
    lfo.start();
    surgeReadyNodes = { oscs, lfo, out };
  },
  surgeReadyStop() {
    const n = surgeReadyNodes;
    surgeReadyNodes = null;
    if (!n) return;
    const a = getCtx();
    if (a && n.out) n.out.gain.setTargetAtTime(0.0001, a.currentTime, 0.06);
    const kill = () => { for (const o of n.oscs) { try { o.stop(); } catch {} } try { n.lfo.stop(); } catch {} };
    setTimeout(kill, 220);
  },
  // LANCE DWELL HUM (PR7): a soft "closing-in" whisper whose PITCH rises with the
  // acquisition progress (0..1) — the one channel that makes the 0→1 dwell ramp
  // HEARABLE with the reticle off (the DOM fill is reticle-gated; the shimmer is
  // ambient). Driven per-frame from the main loop: dwellHum(d>0) lazily starts +
  // tracks the pitch, dwellHum(0) ramps it to silence (on lock, seal, or fight
  // end). Deliberately quiet — a pull toward the mark, never a nag.
  dwellHum(d = 0) {
    const a = getCtx();
    if (!a || !sfxBus) return;
    if (d <= 0.001) {   // stop
      const n = dwellHumNodes; dwellHumNodes = null;
      if (!n) return;
      n.out.gain.setTargetAtTime(0.0001, a.currentTime, 0.05);
      setTimeout(() => { for (const o of n.oscs) { try { o.stop(); } catch {} } }, 160);
      return;
    }
    if (!dwellHumNodes) {   // lazy start
      const out = a.createGain();
      out.gain.setValueAtTime(0.0001, a.currentTime);
      out.connect(sfxBus);
      const oscs = [];
      for (const [type, mul, vol] of [['triangle', 1, 0.6], ['sine', 2, 0.22]]) {
        const o = a.createOscillator();
        o.type = type; o.frequency.value = 200 * mul;
        const g = a.createGain(); g.gain.value = vol;
        o.connect(g).connect(out);
        o.start();
        oscs.push({ o, mul });
      }
      dwellHumNodes = { oscs, out };
    }
    // Track: pitch rises 200→620Hz, gain swells with progress — both eased so a
    // draining dwell (L177) glides back down instead of stepping.
    const n = dwellHumNodes, t = a.currentTime, f = 200 + 420 * Math.min(1, d);
    for (const { o, mul } of n.oscs) o.frequency.setTargetAtTime(f * mul, t, 0.05);
    n.out.gain.setTargetAtTime(0.022 * (0.35 + 0.65 * d), t, 0.05);
  },
  // RELEASE DUCK (PR7): a deliberate volley loose briefly dips the MUSIC bus so
  // the exhale owns the moment (the Rez sidechain). Music only — the exhale
  // itself routes through sfxBus, and the kick sidechain lives on its own
  // pumpGain node, so musicBus.gain is free for this transient automation. The
  // restore target is musicTarget() so it respects mute/volume.
  volleyDuck() {
    const a = getCtx();
    if (!a || !musicBus) return;
    const t = a.currentTime, base = musicTarget();
    musicBus.gain.cancelScheduledValues(t);
    musicBus.gain.setValueAtTime(base * 0.55, t);
    musicBus.gain.setTargetAtTime(base, t + 0.18, 0.12);
  },
  // Surge UNLEASH: the beam fires. A hard downward laser sweep + a sub boom + a
  // bright noise lance — the big "FWOOM" that launches the mouth beam at the boss.
  surgeBeam() {
    const a = getCtx();
    if (!a) return;
    tone({ freq: 70, end: 42, dur: 0.6, type: 'sine', vol: 0.18 });               // sub boom
    tone({ freq: 1400, end: 240, dur: 0.5, type: 'sawtooth', vol: 0.12 });        // laser body sweep
    tone({ freq: 2100, end: 520, dur: 0.4, type: 'square', vol: 0.06, delay: 0.02 });
    noiseWhoosh({ from: 900, to: 6000, dur: 0.4, vol: 0.16, q: 0.7 });            // energy lance
    tone({ freq: 660, end: 1320, dur: 0.14, type: 'triangle', vol: 0.1, delay: 0.01 }); // zap transient
  },
  // Surge ACTIVE crackle: a looping electric arc — band-passed noise sizzling with
  // an LFO-jittered gain + a faint high buzz, so the lightning around the dragon
  // has a constant cool crackle. Start on unleash, stop when Surge ends.
  surgeCrackleStart() {
    const a = getCtx();
    if (!a || !sfxBus || surgeCrackleNodes) return;
    const out = a.createGain();
    out.gain.setValueAtTime(0.0001, a.currentTime);
    out.gain.exponentialRampToValueAtTime(0.07, a.currentTime + 0.15);
    out.connect(sfxBus);
    // Sizzling band-passed noise (the arc body).
    const src = a.createBufferSource();
    src.buffer = getNoiseBuffer(a);
    src.loop = true;
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 1.1;
    const sizzle = a.createGain(); sizzle.gain.value = 0.55;
    src.connect(bp).connect(sizzle).connect(out);
    // Gain-jitter LFO: rapid crackle (arc flicker) on the sizzle level.
    const lfo = a.createOscillator();
    lfo.type = 'square'; lfo.frequency.value = 17;
    const lfoDepth = a.createGain(); lfoDepth.gain.value = 0.4;
    lfo.connect(lfoDepth).connect(sizzle.gain);
    // Faint high electric buzz on top.
    const buzz = a.createOscillator();
    buzz.type = 'sawtooth'; buzz.frequency.value = 3200;
    const bg = a.createGain(); bg.gain.value = 0.02;
    buzz.connect(bg).connect(out);
    src.start(); lfo.start(); buzz.start();
    surgeCrackleNodes = { src, lfo, buzz, out };
  },
  surgeCrackleStop() {
    const n = surgeCrackleNodes;
    surgeCrackleNodes = null;
    if (!n) return;
    const a = getCtx();
    if (a && n.out) n.out.gain.setTargetAtTime(0.0001, a.currentTime, 0.08);
    const kill = () => { try { n.src.stop(); } catch {} try { n.lfo.stop(); } catch {} try { n.buzz.stop(); } catch {} };
    setTimeout(kill, 260);
  },
  // Boss shield SHATTERING under the beam: a bright glassy burst — a cluster of
  // highpassed noise cracks + a few detuned high shards falling. Distinct from the
  // musical phase() chime: this is the physical "the barrier breaks" sound.
  shieldShatter() {
    const a = getCtx();
    if (!a) return;
    noiseWhoosh({ from: 6000, to: 1400, dur: 0.25, vol: 0.16, q: 2.6 });         // main shatter
    for (let i = 0; i < 5; i++) {
      const f = 2600 + Math.floor(i * 137) * ((i % 2) ? 1 : 1.5);
      tone({ freq: f, end: f * 0.6, dur: 0.18, type: 'triangle', vol: 0.06, delay: i * 0.035 }); // falling shards
    }
    tone({ freq: 150, end: 60, dur: 0.35, type: 'sawtooth', vol: 0.1, delay: 0.02 });  // low whoomp under
  },
  // Ember pickup: short blip that climbs a pentatonic ladder with the streak
  // (the Subway Surfers coin cadence — consecutive grabs feel like a melody).
  ember(streak = 1) {
    const h = getHarmony();
    let f;
    if (h) {
      f = chordLadder(660, h.chord, Math.min(streak - 1, 9)); // live chord tones
    } else {
      const PENTA = [0, 2, 4, 7, 9];
      const step = PENTA[(streak - 1) % 5] + Math.floor((streak - 1) / 5) * 12;
      f = 660 * Math.pow(2, Math.min(step, 26) / 12);
    }
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
      tone({ freq: inKey(f), dur: 0.3, type: 'sine', vol: 0.07, delay: 0.45 + i * 0.08 }));
  },
  // Pilot level up: rising bell arpeggio
  levelUp() {
    const d0 = toGrid16();
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      const k = inKey(f);
      tone({ freq: k, dur: 0.28, type: 'sine', vol: 0.1, delay: d0 + i * 0.09 });
      tone({ freq: k * 2, dur: 0.2, type: 'sine', vol: 0.04, delay: d0 + i * 0.09 });
    });
  },
  // Mission complete: confident two-chord stamp
  missionComplete() {
    const d0 = toGrid16();
    [659.25, 783.99].forEach((f, i) => {
      const k = inKey(f);
      tone({ freq: k, dur: 0.18, type: 'triangle', vol: 0.11, delay: d0 + i * 0.14 });
      tone({ freq: k * 1.5, dur: 0.18, type: 'triangle', vol: 0.07, delay: d0 + i * 0.14 });
    });
  },
  // Time-dilation whoosh for a bullet-time beat (ASHTALON's overtake pass).
  // entering=true → a deep DOWNWARD sweep + sub rumble (the world slowing); false →
  // a quick upward zip back to real time.
  timeDilate(entering = true) {
    if (entering) {
      tone({ freq: 660, end: 90, dur: 0.7, type: 'sawtooth', vol: 0.10 });
      noiseWhoosh({ from: 1400, to: 160, dur: 0.7, vol: 0.09, q: 0.8 });
      tone({ freq: 55, dur: 0.95, type: 'sine', vol: 0.06 });        // sub rumble under the dilation
    } else {
      tone({ freq: 120, end: 760, dur: 0.24, type: 'sawtooth', vol: 0.07 });
      noiseWhoosh({ from: 300, to: 2200, dur: 0.22, vol: 0.06, q: 0.8 });
    }
  },
  // Spell-card CAPTURE (§5f): a bright rising sparkle that resolves — the "you
  // got it" acknowledgement when a card is cleared hitless in time. dread=true
  // makes it fuller and a touch grander for the boss's signature card. Sits above
  // the action chimes' register so it reads clearly over a live fight.
  cardCapture(dread = false) {
    const notes = (dread ? [587.33, 739.99, 987.77, 1174.66] : [659.25, 830.61, 1046.5]).map(inKey);
    notes.forEach((f, i) => {
      tone({ freq: f, dur: 0.22, type: 'triangle', vol: 0.10, delay: i * 0.07 });
      tone({ freq: f * 2, dur: 0.16, type: 'sine', vol: 0.045, delay: i * 0.07 });   // shimmer octave
    });
    if (dread) {   // a grander resolving stamp under the sparkle
      tone({ freq: inKey(293.66), end: inKey(440), dur: 0.5, type: 'sawtooth', vol: 0.07, delay: 0.16 });
      tone({ freq: inKey(1174.66), end: inKey(1760), dur: 0.4, type: 'sine', vol: 0.05, delay: 0.30 });
    }
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
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      const k = inKey(f);
      tone({ freq: k, end: k * 1.5, dur: 0.3, type: 'square', vol: 0.1, delay: i * 0.09 });
    });
    tone({ freq: inKey(1046.50), end: inKey(2093), dur: 0.5, type: 'sawtooth', vol: 0.08, delay: 0.38 });
  },
  // Combo break: a short snap transient into a falling minor figure — loud
  // enough to read over the music and distinct from deny() (single low slide)
  // and damage() (noise thud). Non-punitive: it states the loss, no dwelling.
  comboBreak() {
    noiseWhoosh({ from: 3200, to: 800, dur: 0.07, vol: 0.09, q: 1.8 });
    tone({ freq: 523.25, end: 392, dur: 0.16, type: 'triangle', vol: 0.13 });
    tone({ freq: 392, end: 261.63, dur: 0.22, type: 'square', vol: 0.09, delay: 0.09 });
  },
  // Dragon Surge dying to a hit: a soft downward fizzle, quieter than the
  // damage thud it plays under — signals "the Surge is gone" without doubling
  // the sting.
  surgeFizzle() {
    noiseWhoosh({ from: 2400, to: 300, dur: 0.35, vol: 0.08, q: 0.8 });
    tone({ freq: 880, end: 330, dur: 0.4, type: 'sine', vol: 0.07 });
    tone({ freq: 1320, end: 495, dur: 0.3, type: 'triangle', vol: 0.04, delay: 0.05 });
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
    const h = getHarmony();
    let f;
    if (h) {
      f = chordLadder(740, h.chord, Math.min(streak - 1, 9)); // live chord tones
    } else {
      const PENTA = [0, 4, 7, 11, 14];
      const step = PENTA[(streak - 1) % 5] + Math.floor((streak - 1) / 5) * 12;
      f = 740 * Math.pow(2, Math.min(step, 24) / 12);
    }
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
    const base = inKey(600 + tier * 150);
    tone({ freq: base, dur: 0.09, type: 'square', vol: 0.09 });
    tone({ freq: base * 1.25, dur: 0.09, type: 'square', vol: 0.09, delay: 0.07 });
    tone({ freq: base * 1.5, end: base * 2, dur: 0.16, type: 'square', vol: 0.1, delay: 0.14 });
  },
  // Ambient rewards (not input feedback) snap to the key AND start on the next
  // 16th of the live grid — they read as the track playing a fill for you.
  milestone() {
    const d0 = toGrid16();
    [660, 880, 1320].forEach((f, i) =>
      tone({ freq: inKey(f), dur: 0.14, type: 'triangle', vol: 0.1, delay: d0 + i * 0.07 }));
  },
  record() {
    const d0 = toGrid16();
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      tone({ freq: inKey(f), end: inKey(f) * 1.2, dur: 0.22, type: 'square', vol: 0.09, delay: d0 + i * 0.08 }));
  },
  // Golden ember: a treasure-chest glissando — unmistakably richer than the
  // ordinary ember blip.
  goldEmber() {
    [880, 1108.7, 1318.5, 1760].forEach((f, i) =>
      tone({ freq: inKey(f), dur: 0.16, type: 'triangle', vol: 0.12, delay: i * 0.05 }));
    tone({ freq: inKey(2637), dur: 0.3, type: 'sine', vol: 0.06, delay: 0.2 });
    noiseWhoosh({ from: 5000, to: 9000, dur: 0.2, vol: 0.05, q: 3 });
  },
  // Feat unlocked: a proud little fanfare stamp (distinct from missions)
  featUnlock() {
    const d0 = toGrid16();
    [659.25, 880, 1318.5].forEach((f, i) =>
      tone({ freq: inKey(f), dur: 0.2, type: 'triangle', vol: 0.11, delay: d0 + i * 0.1 }));
    tone({ freq: inKey(1760), end: inKey(2093), dur: 0.32, type: 'sine', vol: 0.07, delay: d0 + 0.3 });
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
  // Aim-line LOCK acquired (V1): a crisp two-note "got it" blip + a tiny sparkle,
  // so a green snap is AUDIBLE, not just visual. Short + light — it can fire often
  // (every time a held line locks), so it stays out of the way of the music.
  lockOn() {
    tone({ freq: 740, dur: 0.06, type: 'triangle', vol: 0.07 });
    tone({ freq: 1110, end: 1480, dur: 0.12, type: 'square', vol: 0.055, delay: 0.05 });
    tone({ freq: 2220, dur: 0.05, type: 'sine', vol: 0.03, delay: 0.1 });
  },
  // Crack-tick: a tiny bright metallic tick when a held line chips the organ in a
  // boss lull — the "you're doing the right thing" pulse (quieter than lockOn).
  lockTick() {
    tone({ freq: 1650, dur: 0.035, type: 'triangle', vol: 0.045 });
  },
  // --- HUNTER'S BRAND (the lock layer's sound phrase: set → inhale → exhale) ---
  // A brand kindles (PR4a body upgrade — owner: "more engaging and rewarding"):
  // a soft noise-kindle SIZZLE under two detuned rune-hums that rise a step per
  // brand already set (1st low, 3rd bright), a shimmer octave answering, and a
  // tiny sub tick so the paint lands with WEIGHT, not just brightness.
  brandSet(count = 1) {
    const f = 560 * (1 + 0.18 * (count - 1));
    noiseWhoosh({ from: 800, to: 2400, dur: 0.12, vol: 0.05, q: 1.8 });      // the kindle sizzle
    tone({ freq: f, end: f * 1.4, dur: 0.14, type: 'triangle', vol: 0.06 }); // rune-hum
    tone({ freq: f * 1.007, end: f * 1.41, dur: 0.14, type: 'triangle', vol: 0.045 }); // detune body
    tone({ freq: f * 2, end: f * 2.6, dur: 0.09, type: 'sine', vol: 0.04, delay: 0.06 }); // shimmer octave
    tone({ freq: f * 3, dur: 0.05, type: 'sine', vol: 0.025, delay: 0.09 }); // the old sparkle, kept
    tone({ freq: 140, end: 90, dur: 0.06, type: 'sine', vol: 0.05 });        // sub tick (weight)
  },
  // The set completes: a quick low→high arpeggio (each brand answers), then the
  // dragon DRAWS BREATH — the rising inhale IS the cap fuse made audible.
  brandCap() {
    tone({ freq: 660, dur: 0.08, type: 'triangle', vol: 0.06 });
    tone({ freq: 880, dur: 0.08, type: 'triangle', vol: 0.06, delay: 0.07 });
    tone({ freq: 1175, dur: 0.1, type: 'triangle', vol: 0.065, delay: 0.14 });
    tone({ freq: 280, end: 860, dur: 0.8, type: 'sine', vol: 0.05, delay: 0.2 });
  },
  // The exhale (PR4b — the release with WEIGHT; owner: "sound is underwhelming").
  // The research-backed gesture: a bass THUMP anchors the moment, the whoosh
  // sweeps UP (missiles LEAVING — the old down-sweep read as deflation), and n
  // faint detuned chirps smear the release so the volley audibly sounds PLURAL.
  // The per-hit reward moved to brandStrike (the impact arpeggio) — the release
  // is the exhale, the landings are the drum-roll.
  brandLoose(n = 3) {
    tone({ freq: 100, end: 40, dur: 0.09, type: 'sine', vol: 0.14 });          // the thump (weight)
    noiseWhoosh({ from: 400, to: 4000, dur: 0.36, vol: 0.11, q: 1.4 });        // breath sweeping UP + out
    tone({ freq: 900, end: 220, dur: 0.34, type: 'sawtooth', vol: 0.045 });    // the body sweep, under it
    for (let i = 0; i < Math.min(n, 6); i++) {
      tone({ freq: 620 + i * 47, end: 1500 + i * 180, dur: 0.12, type: 'sawtooth',
        vol: 0.028, delay: 0.02 + i * 0.018 });   // detuned launch chirps (plurality)
    }
  },
  // A wisp finds its brand — one note of the impact ARPEGGIO (k = position in the
  // drum-roll): a short pluck stepping UP a pentatonic, so N landings play an
  // ascending riff and a bigger volley is intrinsically more rewarding (the Rez
  // lesson). Deterministic micro-detune from k — organic, zero RNG.
  brandStrike(k = 0) {
    const PENTA = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];   // major pentatonic ratios
    const f = 660 * PENTA[k % PENTA.length] * (k >= PENTA.length ? 2 : 1) * (1 + ((k * 7) % 5 - 2) * 0.002);
    tone({ freq: f, end: f * 0.985, dur: 0.09, type: 'triangle', vol: 0.075 });
    tone({ freq: f * 2, dur: 0.05, type: 'sine', vol: 0.035, delay: 0.005 });  // sparkle octave
    noiseWhoosh({ from: 2600, to: 900, dur: 0.07, vol: 0.03, q: 2.2 });        // the ember burst
  },
  // A lone brand ashing off (decay release) — deliberately lesser than the exhale.
  brandFizzle() {
    tone({ freq: 760, end: 500, dur: 0.16, type: 'triangle', vol: 0.04 });
  },
  // Loosing onto a SEALED boss (the mark won't take): a soft, muffled DOWNWARD thunk —
  // no bright exhale, no metallic clang; a dull "not yet" that keeps the brands banked.
  brandSeal() {
    tone({ freq: 300, end: 150, dur: 0.14, type: 'sine', vol: 0.05 });
    tone({ freq: 190, end: 120, dur: 0.10, type: 'triangle', vol: 0.03, delay: 0.04 });
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
let stationTrim = null; // per-station calibrated loudness trim (mastering v2)
let pumpGain = null;   // sidechain bus: musical layers duck on every kick
let bassDrive = null;  // soft-saturation waveshaper on the bass layer
let reverbConvolver = null; // shared convolution reverb (input)
let reverbReturn = null;    // reverb return gain → music bus
let pendingRebuild = false; // biome key shift applies at the next loop wrap
const LOOK_AHEAD = 0.4; // schedule this many seconds ahead
const SCHED_INTERVAL = 100; // ms between scheduler runs

let LOOP_LEN = 64 * E8; // total loop duration in seconds (per track)
let biomeSemitones = 0; // biome key shift, applied at loop boundaries
// Boss music state (§ boss fights): the fight darkens the SAME station rather
// than swapping tracks — transpose DOWN per phase (heavier register) + darker
// filters + hold the arrangement at its climax. All applied at the next loop
// boundary (no mid-bar lurch) and cleared on defeat/run-end.
let bossActive = false;
let bossSemitones = 0;  // downward transpose (−2 per phase, floor −6)
let bossBright = 1;     // filter-brightness scale (<1 = darker/more menacing)
let drumEnergy = 0;     // 0..1 BPM-driven kit punch / bass thickness
let pumpAmt = 0;        // sidechain depth: 0 (no pump) .. ~0.42 (hard four-on-floor)
let loopCount = 0;      // which 8-bar loop we're on — drives fills/crash/humanize variation
let formPass = 0;       // which section of the song form is playing (advances per loop-wrap)
let gameVote = null;    // 0..1 gameplay intensity (music.update) — lets Dragon Surge
                        // HOLD the drop / idle coasting ease to the breakdown at
                        // the next section boundary. null = no vote (menu/headless).
// Per-station "remaster" mix scalars (from each track's optional `mix` object).
// All default to 1.0 → byte-for-byte the current global sound when `mix` is absent.
let mixReverb = 1, mixWidth = 1, mixDrive = 1, mixBright = 1, mixTrimDb = 0;

function seqToEvents(seq, layerKey, voice, freqMult, durMult = 0.85, E8 = 0.25) {
  const out = [];
  let t = 0;
  for (const [freq, dur] of seq) {
    if (freq > 0) {
      out.push({
        t, freq: freq * freqMult, durS: dur * E8 * durMult,
        layer: layerKey, osc: voice.osc, vol: voice.vol, stack: voice.stack, inst: voice.inst,
      });
    }
    t += dur * E8;
  }
  return out;
}

// Compile one full 8-bar pass of a station into a flat, time-sorted event list.
// PURE — reads only its arguments and returns everything it derives, so the
// offline renderer (sfxRender.js: loudness calibration + WAV bounce) runs the
// EXACT code the live engine plays. The live path is the thin buildEvents()
// wrapper below, which folds the results into the scheduler's module state.
function compileTrack(tr, loopN = 0, semis = 0, section = null) {
  const E8 = 60 / tr.bpm / 2;
  // Song structure: a station with a `form` plays a different SECTION each
  // loop-wrap (intro/build/drop/breakdown) instead of the same 8 bars forever.
  // `sec` is the section for this pass; legacy stations get the implicit
  // full 8-bar base section, so LOOP_LEN + everything below is unchanged.
  const sec = section || sectionAt(tr, loopN);
  const bars = sec.bars;                 // 1..8 (a 4-bar breakdown = first 4 bars)
  const LOOP_LEN = bars * 8 * E8;
  // Punchier kit + thicker bass on the high-energy stations; chill low-BPM
  // tracks stay soft. 100bpm→0 … 174bpm→1, with an optional per-track nudge.
  const drumEnergy = Math.max(0, Math.min(1, (tr.bpm - 100) / 74)) * (tr.drums.punch ?? 1);
  // Per-station mix scalars (the remaster knobs). Neutral (1.0) when `mix` is absent.
  const mx = tr.mix || {};
  const mixReverb = mx.reverb ?? 1;
  const mixWidth  = mx.width  ?? 1;
  const mixDrive  = mx.drive  ?? 1;
  const mixBright = mx.bright ?? 1;
  // Per-station loudness trim in dB — BAKED by tools/loudshots.mjs so all 36
  // stations sit at the same integrated LUFS. Never hand-edited.
  const mixTrimDb = mx.trimDb ?? 0;
  // Sidechain pump depth follows the kit: heavy four-on-the-floor stations pump
  // hard (the genre's signature), chill/acoustic kits barely move. The per-station
  // `mix.pump` scales it (capped) so each genre pumps as hard as it should.
  const pumpAmt = Math.min(0.5,
    (tr.drums.heavy ? Math.min(0.42, 0.16 + drumEnergy * 0.32) : drumEnergy * 0.07) * (mx.pump ?? 1));
  const km = Math.pow(2, semis / 12); // biome key shift
  const v = tr.voices;
  // Swing: delay the off-beats by a fraction of an eighth on the groove
  // stations (lo-fi / house / liquid D&B …). Straight-time dance tracks omit
  // `swing` and stay rigid. Applied to hats / shaker / arp only — never to the
  // melody/bass (variable note lengths make melodic swing unmusical here).
  const swing = (tr.swing ?? 0) * E8;
  const swing16 = swing * 0.5;

  // Melodic development: the section may restate the melody transformed
  // (octave lift for a climax, motif fragment for an intro/build) — the
  // WRITING evolves across the form, not just the arrangement. Variant 0 →
  // the authored line, untouched.
  const mel = sec.melVariant ? melodyVariant(tr.melody, sec.melVariant) : tr.melody;
  const all = [
    ...seqToEvents(mel,     'melody', v.melody, km, 0.85, E8),
    ...seqToEvents(tr.bass, 'bass',   v.bass,   km, 0.88, E8),
    ...seqToEvents(tr.high, 'high',   v.high,   km, 0.85, E8),
    // Dragon Surge lead: the hook an octave up, hot voice
    ...seqToEvents(mel, 'feverlead', { ...v.lead, vol: v.lead.vol }, km * 2, 0.8, E8),
  ];

  const e16 = E8 / 2;
  for (let bar = 0; bar < bars; bar++) {
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
    // Percussion. A station with `groove.grid` gets genre-authentic pattern
    // placement — 16 sixteenth-step chars per voice per bar ('x' = hit,
    // 'g' = ghost at 35% velocity, '.' = rest) — because a dnb station with a
    // four-on-the-floor kick is not dnb. Stations without one keep the
    // original hardcoded grid byte-identical. Flavour percussion always comes
    // from the kit descriptor.
    const BEAT = 2 * E8;
    const d = tr.drums;
    const grid = tr.groove && tr.groove.grid;
    if (grid) {
      const hatVel = (tr.groove.hatVel && tr.groove.hatVel.length) ? tr.groove.hatVel : [1];
      // Off-8ths take the full swing (like the legacy hats), odd 16ths half.
      const stepT = (s) => barStart + s * e16 + (s % 4 === 2 ? swing : (s % 2 ? swing16 : 0));
      const place = (spec, mk) => {
        if (!spec) return;
        for (let s = 0; s < spec.length && s < 16; s++) {
          if (spec[s] === '.') continue;
          mk(stepT(s), spec[s] === 'g' ? 0.35 : 1, s);
        }
      };
      place(grid.kick, (t, v) => {
        all.push({ t, special: 'kick', layer: 'perc', dvol: d.kick * v });
        if (d.heavy) all.push({ t, special: 'kick2', layer: 'perc2', dvol: v });
      });
      place(grid.snare, (t, v) => {
        all.push({ t, special: 'snare', layer: 'perc', dvol: d.snare * v });
        if (d.heavy && v === 1) all.push({ t, special: 'clap', layer: 'perc2', dvol: 1 });
      });
      place(grid.hat, (t, v, s) => {
        all.push({ t, special: 'hat', layer: 'perc', dvol: d.hat * v * hatVel[s % hatVel.length] });
      });
    }
    for (let beat = 0; beat < 4; beat++) {
      const bt = barStart + beat * BEAT;
      if (!grid) {
        all.push({ t: bt, special: 'kick', layer: 'perc', dvol: d.kick });
        if (beat % 2 === 1) all.push({ t: bt, special: 'snare', layer: 'perc', dvol: d.snare });
        all.push({ t: bt,           special: 'hat', layer: 'perc', dvol: d.hat });
        all.push({ t: bt + E8 + swing, special: 'hat', layer: 'perc', dvol: d.hat });
        // Heavy layer at combo >= 3: deeper kick doubled, clap on backbeat
        if (d.heavy) {
          all.push({ t: bt, special: 'kick2', layer: 'perc2', dvol: 1 });
          if (beat % 2 === 1) all.push({ t: bt, special: 'clap', layer: 'perc2', dvol: 1 });
        }
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
  if (d.heavy || sec.crash) {
    // Crash cymbal on the downbeat of bar 0 — the phrase "1" (and forced on a
    // section that requests it, e.g. a drop landing).
    all.push({ t: 0, special: 'crash', layer: 'perc2', dvol: 0.45 + drumEnergy * 0.35 });
  }
  // Snare fill on the last bar of the SECTION, building into the next section's
  // downbeat. Four shapes rotate by loopCount so consecutive loops differ.
  const lastBar = (bars - 1) * 8 * E8;
  const variant = loopN % 4;
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
  const rng = mulberry32((loopN + 1) * 0x9e3779b1);
  const jT = 0.005; // ±5 ms
  for (const ev of all) {
    if (!ev.special) continue;
    if (ev.t > 0.02) ev.t = Math.max(0, ev.t + (rng() * 2 - 1) * jT);
    if (ev.dvol != null) ev.dvol *= 1 + (rng() * 2 - 1) * 0.1;
  }

  // --- Section shaping (arrangement dynamics) ----------------------------
  // A form's sections mute layers + scale intensity so the track breathes. A
  // legacy station's base section mutes nothing at energy 1 → `out` === `all`.
  let out = all;
  // Trim melodic events (melody/bass/high/feverlead run the full 8 bars) to the
  // section length; the per-bar loop above already bounded the arp/pad/drums.
  if (bars < 8) out = out.filter((ev) => ev.t < LOOP_LEN - 1e-6);
  if (sec.mute.size) out = out.filter((ev) => !sec.mute.has(ev.layer));
  if (sec.energy < 1) {
    // Quieter, sparser sections: pull percussion velocity hard and tonal
    // velocity gently, so a breakdown recedes without going lifeless.
    for (const ev of out) {
      if (ev.special) { if (ev.dvol != null) ev.dvol *= 0.35 + 0.65 * sec.energy; }
      else if (ev.vol != null) ev.vol *= 0.55 + 0.45 * sec.energy;
    }
  }
  // Riser: a rising filtered-noise sweep across the section's last bar, tension
  // into the next section's downbeat (builds).
  if (sec.riser) out.push({ t: lastBar, durS: 8 * E8, special: 'riser', layer: 'perc2', dvol: 0.8 });

  out.sort((a, b) => a.t - b.t);
  return { events: out, E8, LOOP_LEN, drumEnergy, pumpAmt, mixReverb, mixWidth, mixDrive, mixBright, mixTrimDb, sectionKey: sec.key };
}

// Live wrapper: compile the ACTIVE station and fold the derived scalars into
// the scheduler's module state (E8/LOOP_LEN/drumEnergy/pump/mix knobs).
function buildEvents() {
  const tr = TRACKS[trackIndex];
  // Resolve the current song section: the authored form, with the live
  // gameplay vote able to override AT this boundary (Surge holds the drop;
  // idle coasting eases to the breakdown). Legacy stations → the implicit
  // base section, so this is the same 8-bar loop as before. The vote is read
  // once per wrap — the decision governs a whole section, never mid-phrase.
  const section = chooseSection(tr, formPass, gameVote);
  // Boss mode transposes the whole track down + darkens the filters. Applied
  // here in the LIVE wrapper (not compileTrack) so the offline calibration —
  // which never has a boss — stays pure and the trims are unaffected.
  const c = compileTrack(tr, loopCount, biomeSemitones + bossSemitones, section);
  E8 = c.E8; LOOP_LEN = c.LOOP_LEN; drumEnergy = c.drumEnergy; pumpAmt = c.pumpAmt;
  mixReverb = c.mixReverb; mixWidth = c.mixWidth; mixDrive = c.mixDrive;
  mixBright = c.mixBright * bossBright;
  mixTrimDb = c.mixTrimDb;
  return c.events;
}

// Build the per-run music graph (sidechain pump bus, bass drive, layer gains,
// reverb sends, ping-pong echo, wind bed) onto context `a`. Shared verbatim
// with the offline renderer so render == live. `tr` is the station, `env` a
// compileTrack() result, `buses` a buildBusGraph() result.
function buildMusicGraph(a, tr, env, buses, { v2 = AUDIO_V2 } = {}) {
  const { musicBus, reverbConvolver } = buses;

  // Station trim (v2): the whole station mix — layers, percussion, echo —
  // passes through one calibrated gain so every station lands at the same
  // integrated loudness. Neutral (0 dB) when the station has no baked trim.
  const stationOut = a.createGain();
  stationOut.gain.value = v2 ? Math.pow(10, (env.mixTrimDb ?? 0) / 20) : 1;

  // Lofi character pack (v2, `mix.lofiPack`): route the whole station through a
  // tape wow/flutter (a short delay whose time wobbles under a slow + a fast
  // LFO) and lay a vinyl-crackle bed under it — the hallmarks that make a lofi
  // station read as INTENTIONALLY warm/aged instead of "the same engine, quieter".
  if (v2 && tr.mix && tr.mix.lofiPack) {
    const warble = a.createDelay(0.05);
    warble.delayTime.value = 0.012;                 // ~12 ms base tape delay
    const wow = a.createOscillator();  wow.type = 'sine';    wow.frequency.value = 0.7;
    const flut = a.createOscillator(); flut.type = 'sine';   flut.frequency.value = 7.3;
    const wowD = a.createGain();  wowD.gain.value = 0.0016;  // ±1.6 ms wow
    const flutD = a.createGain(); flutD.gain.value = 0.0004; // ±0.4 ms flutter
    wow.connect(wowD).connect(warble.delayTime);
    flut.connect(flutD).connect(warble.delayTime);
    wow.start(); flut.start();
    // The whole station runs THROUGH the tape (the delay is ~unity gain, so
    // this wobbles pitch without adding level) — not a parallel dry+wet blend,
    // which would double the signal.
    stationOut.connect(warble);
    warble.connect(musicBus);

    // Vinyl crackle: a looping buffer of seeded Poisson clicks, dust + the odd pop.
    const secs = 4;
    const cbuf = a.createBuffer(1, Math.floor(a.sampleRate * secs), a.sampleRate);
    const cd = cbuf.getChannelData(0);
    const crng = mulberry32(0x0FF1CE);
    for (let i = 0; i < cd.length; i++) {
      if (crng() < 0.0006) cd[i] = (crng() * 2 - 1) * (crng() < 0.06 ? 0.9 : 0.3); // rare pop vs dust
    }
    const csrc = a.createBufferSource();
    csrc.buffer = cbuf; csrc.loop = true;
    const chp = a.createBiquadFilter(); chp.type = 'highpass'; chp.frequency.value = 1500;
    const cg = a.createGain(); cg.gain.value = 0.5;
    csrc.connect(chp).connect(cg).connect(stationOut);
    csrc.start();
  } else {
    stationOut.connect(musicBus);
  }

  function makeLayer(dest, pan = 0) {
    const g = a.createGain();
    g.gain.value = 0;
    const target = dest || stationOut;
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

  // Sidechain "pump" bus: the musical layers route through this gain, which
  // ducks on every kick — the four-on-the-floor pump that defines the EDM /
  // house / trance / hardstyle stations. Percussion bypasses it so the kick
  // itself stays punchy and isn't ducked by its own trigger.
  const pumpGain = a.createGain();
  pumpGain.gain.value = 1;
  pumpGain.connect(stationOut);

  // Bass drive: soft saturation for grit/harmonics on the aggressive saw-bass
  // stations (hardstyle, D&B, big-room); near-transparent for sine-bass kits.
  const bassDrive = a.createWaveShaper();
  bassDrive.oversample = '2x';
  bassDrive.curve = makeDriveCurve(
    (tr.voices.bass.osc === 'sawtooth' ? 0.25 + env.drumEnergy * 0.4 : 0.05) * env.mixDrive);
  bassDrive.connect(pumpGain);

  // Drum bus (v2): percussion converges on one bus with parallel ("New York")
  // compression — a crushed copy (−30 dB, 12:1) mixed at 0.35 under the dry
  // hits. Glue + sustain without killing the transients.
  let drumTarget = stationOut;
  if (v2) {
    const drumBus = a.createGain();
    drumBus.connect(stationOut); // dry path
    const squash = a.createDynamicsCompressor();
    squash.threshold.value = -30;
    squash.ratio.value = 12;
    squash.attack.value = 0.002;
    squash.release.value = 0.12;
    const wet = a.createGain();
    wet.gain.value = 0.35;
    drumBus.connect(squash);
    squash.connect(wet);
    wet.connect(stationOut);
    drumTarget = drumBus;
  }

  // Per-station stereo width scales the base pan positions (clamped to ±1).
  const pan = (p) => Math.max(-1, Math.min(1, p * env.mixWidth));
  const layers = {
    bass:      makeLayer(bassDrive, 0),
    melody:    makeLayer(pumpGain, 0),
    high:      makeLayer(pumpGain, pan(0.32)),
    arp:       makeLayer(pumpGain, pan(-0.28)),
    perc:      makeLayer(drumTarget, 0),
    perc2:     makeLayer(drumTarget, 0),
    perc3:     makeLayer(drumTarget, pan(-0.18)),
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
      sg.gain.value = amt * env.mixReverb; // per-station space
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
  delayL.delayTime.value = env.E8 * 1.5; // dotted eighth at the track BPM
  delayR.delayTime.value = env.E8 * 1.5;
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
  echoOut.connect(stationOut);
  layers.melody.connect(delayL);
  layers.high.connect(delayL);
  layers.feverlead.connect(delayL);

  // Boost wind: looped filtered noise under the arpeggio
  const windSrc = a.createBufferSource();
  windSrc.buffer = getNoiseBuffer(a);
  windSrc.loop = true;
  const windFilter = a.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.value = 420;
  windSrc.connect(windFilter).connect(layers.wind);
  windSrc.start();

  return { pumpGain, bassDrive, layers, echoDelay: delayL, echoDelayR: delayR, windSource: windSrc, stationOut };
}

// Sidechain pump: duck the musical bus on the main kick, then let it breathe
// back up — the pumping "sssh-WAH" the dance stations live on. Shared by the
// synthesized kick and the baked-buffer fast path.
function pumpDuck(pumpGain, pumpAmt, absTime) {
  if (!pumpGain || !(pumpAmt > 0.001)) return;
  pumpGain.gain.cancelScheduledValues(absTime);
  pumpGain.gain.setValueAtTime(1 - pumpAmt, absTime);
  pumpGain.gain.setTargetAtTime(1, absTime + 0.001, 0.07);
}

// --- Baked drum kits --------------------------------------------------------
// Drums are the highest event-rate voices (3–7 fresh nodes per hit, up to
// ~40 hits per bar across three perc layers) and the biggest steady-state GC
// churn on mobile Safari. Every drum branch uses velocity (dvol) LINEARLY in
// its gains, so ONE offline render per drum type per station, gain-scaled at
// trigger time, reproduces the live synthesis exactly — for 2 nodes per hit.
// The live synthesis stays as the fallback (and is what the offline
// calibration renderer uses, so render == live remains true on average; the
// baked path only adds a ±15-cent seeded round-robin for repeated-hit life).
const DRUM_LEN = { kick: 0.22, kick2: 0.22, snare: 0.14, clap: 0.12, crash: 1.55, shaker: 0.06, conga: 0.14, logDrum: 0.26, hat: 0.07 };
let bakedKit = null;    // { trackId, sampleRate, buffers } for the ACTIVE station
let bakePendingId = null;
const rrRng = mulberry32(0xD40B0B);

async function bakeKitFor(sampleRate, tr, dE) {
  const buffers = {};
  for (const type of Object.keys(DRUM_LEN)) {
    const o = new OfflineAudioContext(1, Math.ceil(DRUM_LEN[type] * sampleRate), sampleRate);
    const lay = { perc: o.createGain(), perc2: o.createGain(), perc3: o.createGain() };
    for (const k of Object.keys(lay)) { lay[k].gain.value = 1; lay[k].connect(o.destination); }
    // dv = 1, no pump: velocity + the sidechain duck are applied at trigger time.
    playNoteEventIn(o, lay, null, 0, dE, 1, { special: type, layer: 'perc', dvol: 1 }, 0.003);
    buffers[type] = await o.startRendering();
  }
  return buffers;
}

// Kick a (re)bake for the active station; music keeps playing on the live
// synthesis until the bake lands (hybrid: live covers, baked takes over).
function ensureKitBaked() {
  if (!AUDIO_V2 || !ctx) return;
  const tr = TRACKS[trackIndex];
  if (bakedKit && bakedKit.trackId === tr.id && bakedKit.sampleRate === ctx.sampleRate) return;
  if (bakePendingId === tr.id) return;
  bakePendingId = tr.id;
  const rate = ctx.sampleRate;
  bakeKitFor(rate, tr, drumEnergy).then((buffers) => {
    if (TRACKS[trackIndex].id === tr.id && ctx && ctx.sampleRate === rate) {
      bakedKit = { trackId: tr.id, sampleRate: rate, buffers };
    }
  }).catch(() => {}).finally(() => {
    if (bakePendingId === tr.id) bakePendingId = null;
  });
}

function playBakedDrum(a, ev, absTime) {
  const layerGain = layers[ev.layer];
  const buf = bakedKit.buffers[ev.special];
  if (!layerGain || !buf) return false;
  if (ev.special === 'kick') pumpDuck(pumpGain, pumpAmt, absTime);
  const src = a.createBufferSource();
  src.buffer = buf;
  // Seeded ±15-cent round-robin so machine-repeated hits breathe slightly.
  src.playbackRate.value = Math.pow(2, ((rrRng() * 2 - 1) * 15) / 1200);
  const g = a.createGain();
  g.gain.value = ev.dvol ?? 1;
  src.connect(g).connect(layerGain);
  src.start(absTime);
  return true;
}

// Live entry point: plays against the running context + module state. The
// offline renderer calls playNoteEventIn directly with its own env — the body
// is shared verbatim (parameter shadowing), so render == live by construction.
function playNoteEvent(ev, absTime) {
  const a = getCtx();
  if (!a) return;
  if (ev.special && bakedKit && bakedKit.trackId === TRACKS[trackIndex].id &&
      bakedKit.sampleRate === a.sampleRate && playBakedDrum(a, ev, absTime)) return;
  playNoteEventIn(a, layers, pumpGain, pumpAmt, drumEnergy, mixBright, ev, absTime);
}

function playNoteEventIn(a, layers, pumpGain, pumpAmt, drumEnergy, mixBright, ev, absTime) {
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
      if (ev.special === 'kick') pumpDuck(pumpGain, pumpAmt, absTime);
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
    if (ev.special === 'riser') {
      // Build riser: band-passed noise sweeping UP in pitch with a swelling
      // gain across the section's last bar — the tension lift into a drop.
      const dur = ev.durS || 1;
      const src = a.createBufferSource();
      src.buffer = getNoiseBuffer(a);
      const bp = a.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 1.4;
      bp.frequency.setValueAtTime(400, absTime);
      bp.frequency.exponentialRampToValueAtTime(7000, absTime + dur);
      g.gain.setValueAtTime(0.0001, absTime);
      g.gain.exponentialRampToValueAtTime(0.12 * dv, absTime + dur * 0.92);
      g.gain.exponentialRampToValueAtTime(0.0001, absTime + dur);
      src.connect(bp).connect(g).connect(layerGain);
      src.start(absTime);
      src.stop(absTime + dur + 0.05);
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
  // Instrument archetype (opt-in via voices.X.inst): richer FM / supersaw /
  // physical-model voices. Absent → the legacy osc paths below run unchanged.
  // The bass sub-octave reinforcement still applies so basslines keep their
  // weight regardless of the archetype.
  if (ev.inst && INSTS[ev.inst]) {
    INSTS[ev.inst](a, layerGain, ev.freq, ev.vol, ev.durS, absTime,
      { bright: mixBright, lfoGain, att, rel });
    if (ev.layer === 'bass') spawn(ev.freq * 0.5, ev.vol * (0.12 + drumEnergy * 0.55), 0, 'sine');
    return;
  }
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
      loopOffset += LOOP_LEN;   // advance by the section that just finished
      loopCount++;
      formPass++;               // advance the song-form cursor to the next section
      // Rebuild every loop so fills / crash / humanization vary AND the next
      // song section is resolved (cheap: a few hundred events, once every
      // several seconds). Key shifts (biome changes) also fold in here,
      // landing cleanly on the downbeat of the new loop/section.
      const keyShift = pendingRebuild;
      pendingRebuild = false;
      events = buildEvents();
      if (keyShift) {
        // Ramp (never jump) a live delayTime: an instantaneous set mid-flight
        // clicks/chirps the echo tail. 50 ms is inaudible as pitch slew.
        if (echoDelay) echoDelay.delayTime.setTargetAtTime(E8 * 1.5, a.currentTime, 0.05);
        if (echoDelayR) echoDelayR.delayTime.setTargetAtTime(E8 * 1.5, a.currentTime, 0.05);
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
    formPass = 0;                      // restart the song form from the top on retune
    gameVote = null;                   // fresh station starts on its authored form
    events = buildEvents();            // recomputes E8/LOOP_LEN for the new track
    // Ramped, not jumped — instantaneous delayTime changes click (see scheduler).
    if (echoDelay) echoDelay.delayTime.setTargetAtTime(E8 * 1.5, ctx.currentTime, 0.05);
    if (echoDelayR) echoDelayR.delayTime.setTargetAtTime(E8 * 1.5, ctx.currentTime, 0.05);
    // Retarget the calibrated loudness trim for the new station (the graph
    // persists across retunes; only the trim + events change).
    if (stationTrim && AUDIO_V2) {
      stationTrim.gain.setTargetAtTime(Math.pow(10, mixTrimDb / 20), ctx.currentTime, 0.05);
    }
    // Swap the shared reverb to the new station's genre space (the one
    // convolver is reused; only its IR buffer changes, hidden in the fade).
    if (reverbConvolver && AUDIO_V2) {
      try { reverbConvolver.buffer = makeImpulse(ctx, TRACKS[trackIndex].mix?.irPreset); } catch { /* keep prior IR */ }
    }
    loopOffset = ctx.currentTime + 0.06;
    nextEvtIdx = 0;
    restoreBuses(ctx);
    ensureKitBaked(); // live synthesis covers until the new station's kit lands
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
    formPass = 0;
    events = buildEvents();

    // Per-run music graph (pump bus, bass drive, layers, sends, echo, wind) —
    // built by the same function the offline renderer uses, so what the
    // calibration CI measures is what the player hears.
    stopWindSource();
    const g = buildMusicGraph(a, TRACKS[trackIndex],
      { E8, drumEnergy, mixReverb, mixWidth, mixDrive, mixBright, mixTrimDb },
      { musicBus, reverbConvolver });
    pumpGain = g.pumpGain;
    bassDrive = g.bassDrive;
    layers = g.layers;
    echoDelay = g.echoDelay;
    echoDelayR = g.echoDelayR;
    windSource = g.windSource;
    stationTrim = g.stationOut;
    ensureKitBaked();

    loopOffset = a.currentTime + 0.05;
    nextEvtIdx = 0;
    runScheduler();
    schedulerTimer = setInterval(runScheduler, SCHED_INTERVAL);
  },

  stop() {
    musicActive = false;
    gameVote = null;   // stale run intensity must not steer the next session's form
    bossActive = false; bossSemitones = 0; bossBright = 1;  // clear any boss darkening
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

    // Continuous energy scalar (replaces the old combo>=1.5/2/3 snaps): one
    // 0..1 value drives every reactive layer through smoothstep bands
    // CALIBRATED so the old threshold points still reach full gain — the
    // roster-safety criterion — while the approach to them now swells the mix
    // instead of stepping it. (The per-layer setTargetAtTime constants below
    // provide the temporal smoothing.)
    const combo = game.combo || 0;
    const energy = Math.min(1,
      Math.min(combo / 3, 1) * 0.85 +
      (player.boosting ? 0.05 : 0) +
      (game.feverActive ? 0.15 : 0));
    // Publish the intensity vote for the section chooser: Dragon Surge is an
    // outright "hold the drop" (1.0); otherwise the smoothed energy scalar.
    // A boss fight FLOORS the vote high so the arrangement stays at its climax
    // for the whole encounter. Read once per loop-wrap in buildEvents — a
    // boundary decision, not per-frame, so the form never lurches mid-phrase.
    gameVote = game.feverActive ? 1 : (bossActive ? Math.max(energy, 0.85) : energy);
    const band = (lo, hi) => {
      const x = Math.max(0, Math.min(1, (energy - lo) / (hi - lo)));
      return x * x * (3 - 2 * x); // smoothstep
    };

    layers.arp.gain.setTargetAtTime(player.boosting ? 1 : 0, now, FAST);
    layers.wind.gain.setTargetAtTime(player.boosting ? 0.35 : 0, now, FAST);
    layers.high.gain.setTargetAtTime(band(0.28, 0.42), now, SLOW);   // full at combo 1.5
    layers.perc.gain.setTargetAtTime(band(0.44, 0.56), now, FAST);   // full at combo 2
    layers.perc2.gain.setTargetAtTime(band(0.68, 0.85), now, FAST);  // full at combo 3
    if (layers.perc3) layers.perc3.gain.setTargetAtTime(band(0.44, 0.56), now, FAST);
    layers.fever.gain.setTargetAtTime(game.feverActive ? 1 : 0, now, FAST);
    layers.feverlead.gain.setTargetAtTime(game.feverActive ? 1 : 0, now, FAST);

    // Fever swell rides the station-trim node, NOT musicBus.gain — that bus
    // gain is owned by mute/volume and the iOS background hard-silence path
    // (sfx.js pauseForBackground), and a per-frame writer colliding with it
    // was a real hazard. stationTrim = calibrated loudness trim × fever swell.
    if (stationTrim) {
      const trim = AUDIO_V2 ? Math.pow(10, mixTrimDb / 20) : 1;
      stationTrim.gain.setTargetAtTime(trim * (game.feverActive ? 1.2 : 1.0), now, SLOW);
    }
  },
};

// --- Boss music state -------------------------------------------------------
// The music darkens the SAME station through a fight (never a track swap): a
// stinger on arrival + each phase, a downward transpose and darker filters that
// deepen per phase, and the arrangement held at its climax (the vote floor in
// music.update). Tonal changes land at the next loop boundary (buildEvents runs
// every wrap), so they arrive on a downbeat, not mid-bar. Cleared on
// defeat/flee/run-end. Reads only game events — no boss ever depends on audio.
function setBossPhase(depth) {
  bossActive = true;
  bossSemitones = -2 * Math.min(depth, 3);   // sink up to −6 semitones
  bossBright = 1 - 0.06 * Math.min(depth, 3); // filters close ~18% by the last phase
  sfx.bossStinger?.(depth);
}
function clearBossMusic() {
  if (!bossActive) return;
  bossActive = false;
  bossSemitones = 0;
  bossBright = 1;
}
on('bossStart', () => setBossPhase(0));
on('bossPhase', (e) => setBossPhase(((e && e.phase) || 1) - 1));  // event phase is 1-based
on('bossDefeated', clearBossMusic);
on('bossEnd', clearBossMusic);

// ---------------------------------------------------------------------------
// Render seam — dev tooling only (tools/loudshots.mjs, tools/bounce.mjs drive
// the engine into an OfflineAudioContext through these). Everything here is
// the SAME code the live engine plays; nothing below is game API.
export const __render = { compileTrack, buildBusGraph, buildMusicGraph, playNoteEventIn };
