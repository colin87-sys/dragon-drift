// Dragon Drift audio engine.
// Procedural chiptune-pop music reacts to gameplay.
// Layer unlock order: bass+melody always → arpeggio on boost →
// high-lead on combo≥2 → percussion on combo≥3 → fever sparkle on surge.

import { saveData, persist } from './save.js';
import { TRACKS } from './tracks.js';

export { TRACKS };

// A track is playable if it's free or has been bought in the shop.
export function trackUnlocked(i) {
  const t = TRACKS[i];
  return !!t && (t.cost === 0 || saveData.audio.ownedTracks.includes(t.id));
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
      masterGain.connect(comp);
      comp.connect(ctx.destination);
      musicBus = ctx.createGain();
      musicBus.gain.value = musicTarget();
      // Slow-mo filter: music ducks underwater during near-death time dilation
      slowFilter = ctx.createBiquadFilter();
      slowFilter.type = 'lowpass';
      slowFilter.frequency.value = 18000;
      musicBus.connect(slowFilter);
      slowFilter.connect(masterGain);
      sfxBus = ctx.createGain();
      sfxBus.gain.value = sfxTarget();
      sfxBus.connect(masterGain);
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
  if (!a || a.state === 'running') return;
  a.resume();
  try {
    const src = a.createBufferSource();
    src.buffer = a.createBuffer(1, 1, 22050);
    src.connect(a.destination);
    src.start(0);
  } catch { /* ignore */ }
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
  // Whipping air whoosh as something deadly slides past
  nearMiss() {
    noiseWhoosh({ from: 700, to: 3200, dur: 0.22, vol: 0.16, q: 1.6 });
    tone({ freq: 880, end: 1320, dur: 0.12, type: 'triangle', vol: 0.07, delay: 0.04 });
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

// --- Layer gain nodes ---
let layers = {};       // keyed: bass, melody, high, arp, perc, fever, pad
let events = [];       // flattened note events sorted by time-offset
let musicActive = false;
let loopOffset = 0;    // absolute audioCtx time when current loop started
let nextEvtIdx = 0;
let schedulerTimer = null;
let windSource = null;
let echoDelay = null;  // dotted-eighth echo (delay time follows the track BPM)
let pendingRebuild = false; // biome key shift applies at the next loop wrap
const LOOK_AHEAD = 0.4; // schedule this many seconds ahead
const SCHED_INTERVAL = 100; // ms between scheduler runs

let LOOP_LEN = 64 * E8; // total loop duration in seconds (per track)
let biomeSemitones = 0; // biome key shift, applied at loop boundaries

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
  const km = Math.pow(2, biomeSemitones / 12); // biome key shift
  const v = tr.voices;

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
        all.push({ t: cycleStart + i * e16, freq: arp[i] * km, durS: e16 * 0.65, layer: 'arp', osc: v.arp.osc, vol: v.arp.vol });
        all.push({ t: cycleStart + i * e16, freq: arp[i] * 2 * km, durS: e16 * 0.55, layer: 'fever', osc: 'triangle', vol: 0.08 });
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
      all.push({ t: bt,      special: 'hat', layer: 'perc', dvol: d.hat });
      all.push({ t: bt + E8, special: 'hat', layer: 'perc', dvol: d.hat });
      // Heavy layer at combo >= 3: deeper kick doubled, clap on backbeat
      if (d.heavy) {
        all.push({ t: bt, special: 'kick2', layer: 'perc2', dvol: 1 });
        if (beat % 2 === 1) all.push({ t: bt, special: 'clap', layer: 'perc2', dvol: 1 });
      }
      // Flavour layer: shaker (off-beats), conga (backbeats), logDrum (downbeats)
      if (d.shaker) {
        all.push({ t: bt + E8,     special: 'shaker', layer: 'perc3', dvol: d.shaker });
        all.push({ t: bt + E8 * 3, special: 'shaker', layer: 'perc3', dvol: d.shaker * 0.7 });
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

  all.sort((a, b) => a.t - b.t);
  return all;
}

function makeLayer() {
  const a = getCtx();
  if (!a) return null;
  const g = a.createGain();
  g.gain.value = 0;
  g.connect(musicBus);
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
      // Body: sine sweep. Click: tiny noise transient on top.
      const deep = ev.special === 'kick2';
      const osc = a.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(deep ? 85 : 115, absTime);
      osc.frequency.exponentialRampToValueAtTime(deep ? 22 : 30, absTime + (deep ? 0.14 : 0.09));
      g.gain.setValueAtTime((deep ? 0.5 : 0.45) * dv, absTime);
      g.gain.exponentialRampToValueAtTime(0.001, absTime + (deep ? 0.16 : 0.1));
      osc.connect(g).connect(layerGain);
      osc.start(absTime);
      osc.stop(absTime + 0.2);
      if (!deep) {
        const click = a.createBufferSource();
        click.buffer = getNoiseBuffer(a);
        const hp = a.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 3000;
        const cg = a.createGain();
        cg.gain.setValueAtTime(0.12 * dv, absTime);
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
      g.gain.setValueAtTime(0.14 * dv, absTime);
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
      ng.gain.setValueAtTime(0.22 * dv, absTime);
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
      g.gain.setValueAtTime(0.3 * dv, absTime);
      g.gain.exponentialRampToValueAtTime(0.001, absTime + 0.08);
      src.connect(bp).connect(g).connect(layerGain);
      src.start(absTime);
      src.stop(absTime + 0.1);
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
  const spawn = (freq, vol, detuneCents = 0, type = ev.osc) => {
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (detuneCents) osc.detune.value = detuneCents;
    g.gain.setValueAtTime(0, absTime);
    g.gain.linearRampToValueAtTime(vol, absTime + att);
    g.gain.setValueAtTime(vol, absTime + ev.durS - rel);
    g.gain.exponentialRampToValueAtTime(0.0001, absTime + ev.durS);
    osc.connect(g).connect(layerGain);
    osc.start(absTime);
    osc.stop(absTime + ev.durS + 0.02);
  };
  if (ev.stack === 'detune') {
    spawn(ev.freq, ev.vol * 0.6, -6);
    spawn(ev.freq, ev.vol * 0.6, 6);
  } else if (ev.stack === 'octave') {
    spawn(ev.freq, ev.vol);
    spawn(ev.freq * 2, ev.vol * 0.3, 0, 'sine');
  } else {
    spawn(ev.freq, ev.vol);
  }
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
      // Key shifts (biome changes) land cleanly on the downbeat of a new loop
      if (pendingRebuild) {
        pendingRebuild = false;
        events = buildEvents();
        if (echoDelay) echoDelay.delayTime.value = E8 * 1.5;
      }
    }
  }
}

export const music = {
  start() {
    const a = getCtx();
    if (!a || musicActive) return;
    restoreBuses(a, true);
    musicActive = true;
    events = buildEvents();

    layers = {
      bass:      makeLayer(),
      melody:    makeLayer(),
      high:      makeLayer(),
      arp:       makeLayer(),
      perc:      makeLayer(),
      perc2:     makeLayer(),
      perc3:     makeLayer(),
      fever:     makeLayer(),
      feverlead: makeLayer(),
      wind:      makeLayer(),
      pad:       makeLayer(),
    };

    // Permanently-on layers
    layers.bass.gain.value   = 1;
    layers.melody.gain.value = 1;
    layers.pad.gain.value    = 1;

    // Echo: dotted-eighth delay with filtered feedback. Sends tap the layer
    // gains so fading a layer also fades its echoes.
    const delay = a.createDelay(1);
    echoDelay = delay;
    delay.delayTime.value = E8 * 1.5; // dotted eighth at the track BPM
    const feedback = a.createGain();
    feedback.gain.value = 0.3;
    const echoFilter = a.createBiquadFilter();
    echoFilter.type = 'lowpass';
    echoFilter.frequency.value = 2000;
    const echoOut = a.createGain();
    echoOut.gain.value = 0.4;
    delay.connect(echoFilter).connect(feedback).connect(delay);
    delay.connect(echoOut).connect(musicBus);
    layers.melody.connect(delay);
    layers.high.connect(delay);
    layers.feverlead.connect(delay);

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
    trackIndex = idx;
    saveData.audio.track = trackIndex;
    persist();
    const a = getCtx();
    if (!musicActive || !a) return TRACKS[trackIndex].name;
    musicBus.gain.setTargetAtTime(0, a.currentTime, 0.04);
    setTimeout(() => {
      if (!musicActive) return;
      events = buildEvents();
      if (echoDelay) echoDelay.delayTime.value = E8 * 1.5;
      loopOffset = ctx.currentTime + 0.06;
      nextEvtIdx = 0;
      restoreBuses(ctx);
    }, 140);
    return TRACKS[trackIndex].name;
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
    musicActive = false;
    stopScheduler();
    stopWindSource();
    if (ctx) {
      const now = ctx.currentTime;
      if (musicBus) {
        musicBus.gain.cancelScheduledValues(now);
        musicBus.gain.setTargetAtTime(0, now, 0.015);
      }
      if (sfxBus) {
        sfxBus.gain.cancelScheduledValues(now);
        sfxBus.gain.setTargetAtTime(0, now, 0.015);
      }
      window.setTimeout(() => {
        try { if (ctx && ctx.state === 'running') ctx.suspend(); } catch {}
      }, 80);
    }
    if (silentMedia) silentMedia.pause();
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
