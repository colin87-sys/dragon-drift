// Instrument archetypes — richer voices than the raw oscillator + lowpass the
// engine has used so far. Each is a self-contained, fire-and-forget builder
// that connects into a destination gain (the layer) and stops itself, exactly
// like sfx.js's inline `spawn()`. Opt-in per voice via `voices.X.inst` (or a
// station-level `insts` map); absent → the legacy osc path is byte-identical.
//
// Shared with the offline renderer (sfxRender drives the same playNoteEventIn),
// so what loudshots measures is what plays. Anything random (Karplus noise
// seed) is seeded from pitch so renders stay deterministic.

// Deterministic PRNG (inlined from util.js, which pulls in three — kept out so
// this module stays dependency-free and node-testable, like tracks.js/harmony.js).
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A stereo-pan node (pass-through gain where StereoPanner is unavailable).
function panNode(a, pan) {
  if (pan && a.createStereoPanner) {
    const p = a.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    return p;
  }
  return a.createGain();
}

// FM electric piano (2-operator, DX-Rhodes flavour): a ratio-1 modulator whose
// index envelope decays fast (the percussive "bonk" of the attack settling to a
// mellow body) plus a quiet high tine partial. ~6 nodes/note — cheaper than a
// detuned-saw stack, and unmistakably "played" rather than "chiptune". The
// signature lofi / amapiano keys sound.
export function fmEP(a, dest, freq, vol, durS, t0, { pan = 0, lfoGain = null } = {}) {
  const carrier = a.createOscillator();
  carrier.type = 'sine';
  carrier.frequency.value = freq;
  if (lfoGain) lfoGain.connect(carrier.detune);

  // FM modulator at ratio 1. Index (in Hz) = ratio-scaled × envelope; bright on
  // attack, decaying to a soft body — the Rhodes timbre in one envelope.
  const mod = a.createOscillator();
  mod.type = 'sine';
  mod.frequency.value = freq;
  const modGain = a.createGain();
  modGain.gain.setValueAtTime(3.0 * freq, t0);
  modGain.gain.exponentialRampToValueAtTime(Math.max(0.4 * freq, 1), t0 + 0.16);
  mod.connect(modGain).connect(carrier.frequency);

  // Tine: a high partial with a very fast decay — the metallic "ping" on strike.
  const tine = a.createOscillator();
  tine.type = 'sine';
  tine.frequency.value = freq * 4;
  const tineGain = a.createGain();
  tineGain.gain.setValueAtTime(vol * 0.45, t0);
  tineGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);

  // EP amp: fast attack, then a natural decay whose time constant scales with
  // the note length (a real EP rings and fades even while "held").
  const amp = a.createGain();
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(vol, t0 + 0.006);
  amp.gain.setTargetAtTime(0.0001, t0 + 0.03, Math.max(durS * 0.4, 0.12));

  const out = panNode(a, pan);
  carrier.connect(amp);
  tine.connect(tineGain).connect(amp);
  amp.connect(out).connect(dest);

  const stop = t0 + durS + 0.3;
  carrier.start(t0); mod.start(t0); tine.start(t0);
  carrier.stop(stop); mod.stop(stop); tine.stop(t0 + 0.12);
}

// Supersaw: two groups of 3 detuned saws hard-panned L/R (genuinely wide — the
// stereo comes from DIFFERENT detuned voices per side, not a copy), one lowpass
// per side with a filter-envelope, shared amp shape. The modern EDM/trance lead.
// ~12 nodes for a mono-melodic lead voice.
export function supersaw(a, dest, freq, vol, durS, t0, {
  pan = 0, bright = 1, lfoGain = null, att = 0.008, rel = 0.03,
} = {}) {
  const CENTS = 15;
  const groups = [
    { det: [-1, -0.45, -0.08], pan: -0.55 },
    { det: [1, 0.45, 0.08], pan: 0.55 },
  ];
  const peak = Math.min(freq * 6 * bright, 11000);
  const floor = Math.min(freq * 3.2, 7000);
  const relEnd = t0 + durS;
  for (const grp of groups) {
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.8;
    lp.frequency.setValueAtTime(Math.max(peak, floor + 1), t0);
    lp.frequency.exponentialRampToValueAtTime(Math.max(floor, 120), t0 + Math.min(durS, 0.25));
    const amp = a.createGain();
    amp.gain.setValueAtTime(0, t0);
    amp.gain.linearRampToValueAtTime(vol * 0.62, t0 + att);
    amp.gain.setValueAtTime(vol * 0.62, Math.max(t0 + att, relEnd - rel));
    amp.gain.exponentialRampToValueAtTime(0.0001, relEnd);
    const p = panNode(a, Math.max(-1, Math.min(1, grp.pan + pan)));
    lp.connect(amp).connect(p).connect(dest);
    for (const d of grp.det) {
      const o = a.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = d * CENTS;
      if (lfoGain) lfoGain.connect(o.detune);
      o.connect(lp);
      o.start(t0);
      o.stop(relEnd + 0.02);
    }
  }
}

// Karplus-Strong pluck: a physically-modelled string (noise burst in a damped
// delay line). Rendered in pure JS into an AudioBuffer once per pitch (cached,
// deterministic — seeded from freq) and played as a cheap buffer source. The
// authentic acoustic guitar / harp / koto tone for celtic + lofi. 2 nodes/note.
const _ksCache = new Map();
const KS_LEN = 1.3;    // fixed ring length; the note's amp gate cuts staccato hits
function ksBuffer(a, freq) {
  const key = a.sampleRate + ':' + Math.round(freq);
  const cached = _ksCache.get(key);
  if (cached) return cached;
  const sr = a.sampleRate;
  const N = Math.max(2, Math.round(sr / freq));   // delay line = one period
  const n = Math.ceil(KS_LEN * sr);
  const buf = a.createBuffer(1, n, sr);
  const d = buf.getChannelData(0);
  const rng = mulberry32(0x9e3779b1 ^ Math.round(freq * 4));
  const line = new Float32Array(N);
  for (let i = 0; i < N; i++) line[i] = rng() * 2 - 1;
  const damp = 0.996;                              // string decay
  let idx = 0;
  for (let i = 0; i < n; i++) {
    const cur = line[idx];
    const nxt = line[(idx + 1) % N];
    d[i] = cur;
    line[idx] = damp * 0.5 * (cur + nxt);          // lowpass-averaged feedback
    idx = (idx + 1) % N;
  }
  _ksCache.set(key, buf);
  return buf;
}
export function pluck(a, dest, freq, vol, durS, t0, { pan = 0 } = {}) {
  const buf = ksBuffer(a, freq);
  const src = a.createBufferSource();
  src.buffer = buf;
  const g = a.createGain();
  g.gain.setValueAtTime(vol * 1.5, t0);            // KS output sits a touch quiet
  // Let it ring, but gate staccato notes so overlapping plucks don't muddy: a
  // gentle release ending shortly after the note's nominal length.
  const ring = Math.min(KS_LEN, durS + 0.25);
  g.gain.setTargetAtTime(0.0001, t0 + Math.max(durS - 0.05, 0.05), Math.max(ring * 0.3, 0.08));
  const out = panNode(a, pan);
  src.connect(g).connect(out).connect(dest);
  src.start(t0);
  src.stop(t0 + ring + 0.05);
}

// Registry: `voices.X.inst` / station `insts` values map to these builders.
export const INSTS = { fmEP, supersaw, pluck };
