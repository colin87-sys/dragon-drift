// THE WYRM LANCE PROFILE — the ground-up A/B alternative to the classic lance
// impact ("quiet hands, loud world; the boss is the instrument").
//
// Thesis: a drum is an independent event; DAMAGE is a persistent object being
// repeatedly excited. So the reward is not our drum kit — it is the BOSS'S OWN
// BODY. Each boss has a seeded set of inharmonic body frequencies. Every missile
// STRIKES them as decaying modal partials that ring LONG (>> the 60ms stagger) so
// successive hits OVERLAP and accumulate — a creature taking damage, not a drum
// fill. As the roll lands, the body loosens: partials dig DOWN, ring LONGER, and a
// formant GROAN (the creature's voice) emerges from near-silence to present. The
// finale CAVES the body in — a deep collapse + a downward roar — and lands the
// loop's one real melody, an in-key resolution note in the phone-audible register.
//
// Why decaying OSCILLATORS, not the earlier noise-excited biquad resonator: a harsh
// critique proved that path was ~30dB too quiet (uncompensated bandpass insertion
// loss) and decayed 3–8× too fast to accumulate (Q sets T60, not audible ring).
// Modal partials give DIRECT level control and a FREE ring time — the two things
// that make the thesis actually audible. Level is explicit; nothing to guess.
//
// Parallel engine: exports a `sfx`-shaped object; only brandStrike/brandFinale
// diverge. Imports primitives from sfx.js via the one-directional `_sfxKit` (sfx.js
// never imports this; the dispatch lives in main.js — no cycle). No persistent audio
// graph, so nothing to leak or tear down. Determinism: seeded body + a per-volley
// counter; no Math.random.

import { _sfxKit } from './sfx.js';
import { chordLadder } from './harmony.js';
import { mulberry32 } from './util.js';
import { CONFIG } from './config.js';

const K = _sfxKit;
const PENTA = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];   // fallback melody when music is off

// Deterministic string → uint32 (FNV-1a). Same boss ⇒ same body every fight.
function hashSeed(s) {
  let h = 0x811c9dc5 >>> 0;
  s = String(s == null ? 'wyrm' : s);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

// A boss's body: a seeded fundamental + inharmonic ratios + a voice formant. The
// ratios/formant jitter per boss (not just the base transposing) so a "chitin boss"
// and a "flesh boss" are genuinely different instruments, not one pitched around.
function computeBody(id) {
  const rng = mulberry32(hashSeed(id));
  const base = 160 + rng() * 80;                          // 160–240 Hz fundamental
  const ratios = [1, 1.5 + rng() * 0.14, 2.28 + rng() * 0.3];  // INHARMONIC modes (per-boss jitter)
  const formant = 640 + rng() * 260;                      // 640–900 Hz voice formant (phone-audible)
  return { base, ratios, formant };
}

let body = computeBody('wyrm');
let lastStrikeAt = -1e9;   // for gap-based roll-start (a missed first wisp can't skip the duck)
let volleySeq = 0;         // per-volley variety seed (deterministic, no RNG)

// Test seam: count engine executions so a headless smoke can prove the wyrm path
// actually RAN (not silently no-op'd / mis-dispatched) — a level/RMS gate is the
// stronger check and a follow-up, but this catches "feature not wired".
function tick() { try { if (typeof window !== 'undefined') window.__wyrmHits = (window.__wyrmHits | 0) + 1; } catch { /* no window */ } }

// A struck modal partial: K.tone IS an exponential decay (vol→~0 over dur), so `dur`
// is the audible RING time — set >> the 60ms stagger so hits overlap = accumulation.
function partial(freq, dur, type, vol, delay) {
  K.tone({ freq, dur, type, vol, delay: delay || 0 });
}

// The creature VOICE: a saw through a low-Q formant bandpass with a downward pitch
// glide (vocal-tract read, phone-audible). Level rises with accumulated damage;
// growl>0 adds a slow tremolo roughness (the roar) via an LFO on a series gain.
function groan({ base, glide, dur, formant, q, vol, growl = 0, delay = 0 }) {
  const a = K.getCtx(); if (!a) return;
  const bus = K.sfxBus(); if (!bus) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(base, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(24, base * glide), t + dur);
  const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = formant; bp.Q.value = q;
  const env = a.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(vol, t + 0.03);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(bp).connect(env);
  let tail = env;
  if (growl > 0) {
    const am = a.createGain(); am.gain.value = 1;
    const lfo = a.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = growl;
    const ld = a.createGain(); ld.gain.value = 0.5;
    lfo.connect(ld).connect(am.gain); lfo.start(t); lfo.stop(t + dur + 0.05);
    env.connect(am); tail = am;
  }
  tail.connect(bus);
  o.start(t); o.stop(t + dur + 0.05);
}

export const lanceWyrm = {
  // Seed the body for this fight. No persistent graph, so this is just params.
  setBoss(id) { body = computeBody(id); },
  // Nothing persistent to tear down — modal partials + groans self-stop. Kept for
  // API symmetry with the classic profile (main.js calls it on bossEnd / toggle).
  bossVoiceEnd() { /* no-op */ },

  // THE IMPACT: a dry crack + the boss BODY struck (3 overlapping decaying modal
  // partials that dig down, ring longer, and swell as damage accrues) + the creature
  // VOICE emerging + a sparse in-key tint. One sustained roll-duck (opened at
  // roll-start), never a per-hit flutter.
  brandStrike(k = 0, n = 1, full = false) {
    tick();
    const kk = Math.min(k, 5);
    const a = K.getCtx();
    const now = a ? a.currentTime : 0;
    // Roll-start = k===0 OR a gap since the last strike (so a dropped first wisp
    // can't skip the duck/variety bump). Opens the single hole for the whole roll.
    if (k === 0 || (now - lastStrikeAt) > 0.25) {
      volleySeq = (volleySeq + 1) % 997;
      const rollDur = Math.min(0.9, Math.max(0.16, n * (CONFIG.LOCK.lanceStaggerMs / 1000) + 0.18));
      K.duckHold(CONFIG.LOCK.impactDuckAmt, rollDur);
    }
    lastStrikeAt = now;
    const vw = 1 + ((volleySeq * 7) % 5 - 2) * 0.006;   // ±0.6% per-volley wobble
    const dig = 1 - 0.05 * kk;                           // body loosens ~85 cents/hit (beats the old 31)
    const dmg = 0.55 + 0.14 * kk;                        // accumulated-damage level ramp
    const rlen = 1 + 0.12 * kk;                          // rings lengthen as the body loosens
    // (a) dry contact crack — the hard leading edge (hardness before body).
    K.noiseWhoosh({ from: 2600, to: 1000, dur: 0.014, vol: 0.05, q: 1 });
    // (b) the BODY — 3 struck modal partials ringing LONG so they overlap the roll.
    partial(body.base * body.ratios[0] * dig * vw, 0.40 * rlen, 'sine',     0.070 * dmg);
    partial(body.base * body.ratios[1] * dig * vw, 0.26 * rlen, 'sine',     0.045 * dmg);
    partial(body.base * body.ratios[2] * dig * vw, 0.16 * rlen, 'triangle', 0.028 * dmg);
    // (c) the VOICE — a formant groan that EMERGES as damage accrues (near-silent
    //     on hit 1, present by the last); the phone-audible "creature" layer.
    groan({ base: body.base * 0.7 * dig * vw, glide: 0.82, dur: 0.26,
      formant: body.formant, q: 4.5, vol: 0.03 + 0.03 * kk });
    // (d) sparse chord tint — the melodic ascent, every other hit, in key.
    if (k % 2 === 0) {
      const h = K.getHarmony();
      const f = h ? chordLadder(660, h.chord, k)
        : 660 * PENTA[k % PENTA.length] * (k >= PENTA.length ? 2 : 1);
      K.tone({ freq: f, end: f * 0.99, dur: 0.06, type: 'triangle', vol: 0.028 });
    }
  },

  // THE FINALE — a CATEGORY change: the body CAVES IN. A saturated kill crack, a
  // deep long collapse boom an octave below the base, the voice giving a big
  // downward ROAR with growl roughness, surface debris, and the loop's one real
  // melody — an in-key resolution note in the phone-audible mid register. Everything
  // after a 40ms void so the drop lands into silence.
  brandFinale(n = 3, full = false) {
    tick();
    const D = 0.04;
    const big = Math.pow(Math.max(1, n) / 3, CONFIG.LOCK.riserTickPowN);
    const vw = 1 + ((volleySeq * 7) % 5 - 2) * 0.006;
    // Kill crack (hard drive) — the contact.
    K.gritBurst({ from: 5000, to: 600, dur: 0.08, vol: 0.14, q: 0.7, drive: 0.8, delay: D });
    // THE CAVE-IN — deep long collapse boom + the voice roaring down with growl.
    partial(body.base * 0.5 * vw, 0.9, 'sine', Math.min(0.16, 0.11 + 0.03 * big), D);
    partial(body.base * 0.75 * vw, 0.6, 'sine', 0.07, D);
    groan({ base: body.base * 0.7 * vw, glide: 0.55, dur: 0.6,
      formant: body.formant * 0.8, q: 3.5, vol: 0.16, growl: 42, delay: D });
    if (full) K.duckHold(Math.min(0.34, CONFIG.LOCK.impactDuckAmt * 1.7), 0.55);
    // Headphone sub floor (a bonus below the phone-speaker floor).
    K.tone({ freq: 75, end: 34, dur: 0.5, type: 'sine', vol: Math.min(0.14, 0.08 + 0.03 * big), delay: D });
    // Surface debris — 3 falling shards.
    for (let i = 0; i < 3; i++) {
      const fs = 1900 + i * 170;
      K.tone({ freq: fs, end: fs * 0.6, dur: 0.12, type: 'triangle', vol: 0.05, delay: D + 0.03 + i * 0.03 });
    }
    // THE RESOLUTION NOTE — the loop's one real melody, phone-band + in key.
    const h = K.getHarmony();
    const root = h ? K.foldToBand(h.chord[0], 262, 523) : 392;
    K.tone({ freq: root, end: root, dur: 0.6, type: 'sine', vol: 0.075, delay: D + 0.02 });
    K.tone({ freq: root * 1.5, dur: 0.42, type: 'triangle', vol: 0.035, delay: D + 0.04 });
  },
};
