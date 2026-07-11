// THE WYRM LANCE PROFILE — the ground-up A/B alternative to the classic lance
// impact ("quiet hands, loud world; the boss is the instrument").
//
// Thesis: a drum is an independent event; DAMAGE is a persistent object being
// repeatedly excited. The reward is the BOSS'S OWN BODY. Each boss has a seeded set
// of inharmonic body frequencies. Every missile STRIKES them as decaying modal
// partials that ring LONG (>> the stagger) so hits OVERLAP and accumulate. As the
// roll lands the body loosens (partials dig down, ring longer, swell); ACROSS the
// fight a damage accumulator sags + detunes + roughens the whole body (the creature
// degrading, and the anti-repetition engine). A makeup-compensated formant GROAN is
// the phone-audible VOICE; the finale CAVES the body in behind a real silence void
// and lands the loop's one melody. The release is a lean dry SNAP (quiet hands).
//
// Two harsh critiques shaped this: modal synthesis (direct osc level + free ring
// time) beat noise-excited biquads; and the groan's own formant-bandpass insertion
// loss is compensated by tested makeup math (sfxLanceMath.js) so the "creature"
// layer is never buried again. Parallel engine: exports a `sfx`-shaped object, wired
// via main.js dispatch; imports primitives from sfx.js's one-directional `_sfxKit`.
// Determinism: seeded body + counters, no Math.random.

import { _sfxKit } from './sfx.js';
import { chordLadder } from './harmony.js';
import { mulberry32 } from './util.js';
import { CONFIG } from './config.js';
import { groanMakeup, GROAN } from './sfxLanceMath.js';

const K = _sfxKit;
const PENTA = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];   // fallback melody when music is off

function hashSeed(s) {
  let h = 0x811c9dc5 >>> 0;
  s = String(s == null ? 'wyrm' : s);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

// A boss's body: seeded fundamental + inharmonic ratios + a voice formant, jittered
// per boss so bodies are different instruments, not one transposed.
function computeBody(id) {
  const rng = mulberry32(hashSeed(id));
  const base = 160 + rng() * 80;                          // 160–240 Hz fundamental
  const ratios = [1, 1.5 + rng() * 0.14, 2.28 + rng() * 0.3];  // inharmonic (per-boss)
  const formant = 640 + rng() * 260;                      // 640–900 Hz voice formant
  return { base, ratios, formant };
}

let body = computeBody('wyrm');
let lastStrikeAt = -1e9;   // gap-based roll-start
let volleySeq = 0;         // per-volley variety seed
let hits = 0;              // strikes this fight (drives the ASYMPTOTIC damage curve)
let damage = 0;            // 0..~0.95 accumulated across the FIGHT (cross-roll fiction + anti-repetition)
let WOUT = null;           // private submix gain → sfxBus (the finale-void handle + a makeup/safety point)

function wout() {
  if (WOUT) return WOUT;
  const a = K.getCtx(); if (!a) return null;
  const bus = K.sfxBus(); if (!bus) return null;
  WOUT = a.createGain(); WOUT.gain.value = 1; WOUT.connect(bus);
  return WOUT;
}

// Test seam: count engine executions (dispatch proof). The audibility of the groan
// is guarded deterministically by tests/wyrmlevels.mjs (the level math).
function tick() { try { if (typeof window !== 'undefined') window.__wyrmHits = (window.__wyrmHits | 0) + 1; } catch { /* no window */ } }

// The creature VOICE: a low saw through TWO makeup-compensated formant bandpasses,
// both gliding DOWN (the moving-formant "throat" cue) — vocal-tract read, phone-
// audible. `vol` is the MUSICAL nominal; each formant path multiplies in its own
// makeup (groanMakeup) so the bandpass insertion loss can never bury it. growl>0
// adds a slow tremolo roughness (the roar) on a series gain.
function groan({ f0, glide, dur, formant, q, vol, growl = 0, delay = 0, roar = false }) {
  const a = K.getCtx(); if (!a) return;
  const bus = wout() || K.sfxBus(); if (!bus) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(24, f0 * glide), t + dur);
  const env = a.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(1, t + 0.03);   // shape only — level is in the formant gains
  if (roar) {
    // Two-stage: SUSTAIN the roar (a single 80dB exp decay collapsed the finale to a
    // 120ms bark, burying the glide + tail); hold, then fall.
    env.gain.linearRampToValueAtTime(0.5, t + dur * 0.55);
    env.gain.linearRampToValueAtTime(0.0001, t + dur);
  } else {
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  // Two makeup-compensated formant paths — F1 falls, F2 RISES (independent motion =
  // a real diphthong /aʊ/, not a parallel filter sweep). Coefficients are shared with
  // the test (GROAN) so the gate can't diverge from the code.
  const addFormant = (F, scale, glideMul) => {
    const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
    bp.frequency.setValueAtTime(F, t);
    bp.frequency.linearRampToValueAtTime(F * glideMul, t + dur);
    const g = a.createGain();
    const lvl = vol * groanMakeup(f0, F) * scale;   // makeup cancels the ~1/n insertion loss
    g.gain.setValueAtTime(lvl, t);
    if (roar) g.gain.linearRampToValueAtTime(lvl * 1.6, t + dur);   // track the doubling n as f0 dives
    o.connect(bp).connect(g).connect(env);
  };
  addFormant(formant, GROAN.f1Scale, GROAN.f1GlideFrac);            // F1 falls (mouth closing)
  addFormant(formant * GROAN.f2Ratio, GROAN.f2Scale, GROAN.f2GlideMul);   // F2 rises (the diphthong)
  let tail = env;
  if (growl > 0) {
    const am = a.createGain(); am.gain.value = 1;
    const lfo = a.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = growl;
    const ld = a.createGain(); ld.gain.value = 0.3;   // ±0.3 (vocal roughness, not a 1.5× wub overshoot)
    lfo.connect(ld).connect(am.gain); lfo.start(t); lfo.stop(t + dur + 0.05);
    env.connect(am); tail = am;
  }
  tail.connect(bus);
  o.start(t); o.stop(t + dur + 0.05);
}

export const lanceWyrm = {
  // Seed the body + RESET per-fight state (so two identical fights are identical —
  // the level/RMS gate needs history-independence, and the damage arc must restart).
  setBoss(id) { body = computeBody(id); damage = 0; hits = 0; volleySeq = 0; lastStrikeAt = -1e9; },
  bossVoiceEnd() { /* no per-fight graph; WOUT is a static unity submix */ },

  // THE IMPACT: a dry crack + the boss BODY struck (3 overlapping decaying modal
  // partials that dig down + ring longer + swell with k and with fight-long damage)
  // + the creature VOICE (louder as damage accrues) + a sparse in-key tint. One
  // sustained roll-duck, deeper than the per-hit flutter, sized to the real span.
  brandStrike(k = 0, n = 1, full = false) {
    tick();
    const a = K.getCtx();
    if (!a) return;   // no audio → don't mutate the damage arc (else the next real fight starts mid-arc)
    const kk = Math.min(k, 5);
    const now = a.currentTime;
    // Roll-start (k===0 OR a gap) → bump variety + open the ONE hole. Sized to the
    // real presentation span (rollMaxS), not the damage-stagger constant.
    if (k === 0 || (now - lastStrikeAt) > 0.25) {
      volleySeq = (volleySeq + 1) % 997;
      K.duckHold(CONFIG.LOCK.lanceHoldAmt, Math.min(1.0, CONFIG.LOCK.rollMaxS + 0.3));
    }
    lastStrikeAt = now;
    hits++;
    damage = 1 - Math.pow(0.5, hits / 55);   // ASYMPTOTIC — approaches ~0.95 but never flatlines (late-fight repetition stays killed)
    const dst = wout() || undefined;
    const vw = 1 + ((volleySeq * 7) % 5 - 2) * 0.006;
    const wob = 1 + 0.08 * Math.sin(volleySeq * 1.7);   // non-saturating per-volley variety (survives max damage)
    const droop = 1 - 0.05 * damage;         // body pitch sags as it's wounded (cross-fight)
    const digK = 1 - 0.05 * kk;              // loosens within the volley (~85 cents/hit)
    const dmgLvl = 0.55 + 0.14 * kk;         // impact swell across the roll
    const rlen = (1 + 0.12 * kk + 0.4 * damage) * wob;   // rings lengthen with damage + wobble
    // (a) dry contact crack.
    K.noiseWhoosh({ from: 2600, to: 1000, dur: 0.014, vol: 0.05, q: 1, dest: dst });
    // (b) the BODY — 3 struck modal partials; higher modes droop MORE with damage
    //     (the modes detuning apart = loosening, not a parallel gliss).
    const pf = (ratio, dur, type, vol, i) =>
      K.tone({ freq: body.base * ratio * digK * vw * droop * (1 - 0.03 * damage * i), dur, type, vol: vol * dmgLvl, dest: dst });
    pf(body.ratios[0], 0.40 * rlen, 'sine', 0.070, 0);
    pf(body.ratios[1], 0.26 * rlen, 'sine', 0.045, 1);
    pf(body.ratios[2], 0.16 * rlen, 'triangle', 0.028, 2);
    // (c) the VOICE — emerges with k AND with fight-long damage; growl from k≥3.
    groan({ f0: body.base * 0.7 * digK * vw * droop, glide: 0.82, dur: 0.26,
      formant: body.formant * wob, q: 4.5,
      vol: Math.min(0.11, (0.03 + 0.02 * kk) * (0.6 + 0.5 * damage)),   // CAP: strike voice stays under the finale roar (no climax inversion)
      growl: kk >= 3 ? 28 : 0 });
    // (d) sparse chord tint — the melodic ascent, every other hit, in key.
    if (k % 2 === 0) {
      const h = K.getHarmony();
      const f = h ? chordLadder(660, h.chord, k)
        : 660 * PENTA[k % PENTA.length] * (k >= PENTA.length ? 2 : 1);
      K.tone({ freq: f, end: f * 0.99, dur: 0.06, type: 'triangle', vol: 0.03, dest: dst });
    }
  },

  // THE RELEASE (quiet hands): a short DRY launch snap — no big sub, no thwack train.
  // Let the boss's body be the loud element, so "quiet hands, loud world" is actually
  // the thing being A/B'd (the classic brandLoose would swamp it).
  brandLoose(n = 3, delay = 0, full = false) {
    const d = delay > 0 ? delay : 0;
    const dst = wout() || undefined;
    K.noiseWhoosh({ from: 3200, to: 1500, dur: 0.012, vol: 0.06, q: 1.6, delay: d, dest: dst });
    K.tone({ freq: 200, end: 110, dur: 0.05, type: 'triangle', vol: 0.045, delay: d, dest: dst });
  },

  // THE FINALE — a CATEGORY change: a REAL silence void (the submix chokes the
  // ringing strike tails for 40ms), then the body CAVES IN — a deep collapse boom, a
  // mid body SLAM where the phone speaker + master comp both cooperate (200–800 Hz),
  // the voice ROARING down with growl, a STAGGERED sub (not stacked at t0), debris +
  // a crackle tail scaled to exceed classic's climax, and the loop's one melody.
  brandFinale(n = 3, full = false) {
    tick();
    const a = K.getCtx();
    const D = 0.085;   // the void — long enough to read as a dropout (40ms was a hiccup, not drama)
    const big = Math.pow(Math.max(1, n) / 3, CONFIG.LOCK.riserTickPowN);
    const vw = 1 + ((volleySeq * 7) % 5 - 2) * 0.006;
    const w = wout();
    const dst = w || undefined;
    // THE VOID — dip the submix to near-silence for D, then open as the drop lands.
    // The dip RAMPS over 4ms (a hard step on hot ringing tails pops — the void must
    // not announce itself with a click).
    if (a && w) {
      const t = a.currentTime;
      w.gain.cancelScheduledValues(t);
      w.gain.setValueAtTime(w.gain.value, t);
      w.gain.linearRampToValueAtTime(0.06, t + 0.004);
      w.gain.setValueAtTime(0.06, t + Math.max(0.004, D - 0.006));
      w.gain.linearRampToValueAtTime(1, t + D);
    }
    // Kill crack (hard drive) — the contact.
    K.gritBurst({ from: 5000, to: 600, dur: 0.08, vol: 0.15, q: 0.7, drive: 0.8, delay: D, dest: dst });
    // The cave-in: deep collapse boom + a mid BODY SLAM (weight where comp+phone cooperate).
    K.tone({ freq: body.base * 0.5 * vw, end: body.base * 0.42 * vw, dur: 0.7, type: 'sine', vol: Math.min(0.16, 0.11 + 0.03 * big), delay: D, dest: dst });
    K.noiseWhoosh({ from: 800, to: 220, dur: 0.16, vol: 0.12, q: 1.1, delay: D, dest: dst });
    // The voice ROARS down (two-stage sustain so it isn't a bark, a big diphthong
    // glide, growl at ~28Hz where AM reads as vocal roughness not tempo-synced wub).
    groan({ f0: body.base * 0.7 * vw, glide: 0.5, dur: 0.6, formant: body.formant * 0.8, q: 3.5, vol: 0.16, growl: 28, delay: D, roar: true });
    // Sub floor STAGGERED (starts as the crack decays — don't stack subs at t0, or
    // the master comp squashes the whole mix; documented trap at sfx.js bellToll).
    K.tone({ freq: 82, end: 34, dur: 0.5, type: 'sine', vol: Math.min(0.13, 0.07 + 0.03 * big), delay: D + 0.09, dest: dst });
    // Debris + crackle tail scaled by n — the climax must EXCEED classic's, not undercut it.
    const shards = Math.min(6, 3 + Math.round(n / 2));
    for (let i = 0; i < shards; i++) {
      const fs = 1900 + i * 150;
      K.tone({ freq: fs, end: fs * 0.55, dur: 0.13, type: 'triangle', vol: 0.05, delay: D + 0.03 + i * 0.028, dest: dst });
    }
    if (n >= 5) {
      for (let i = 0; i < 4; i++) {
        K.noiseWhoosh({ from: 2600 - i * 300, to: 900, dur: 0.03 + (i % 2) * 0.02, vol: 0.045, q: 1.6, delay: D + 0.08 + i * 0.05, dest: dst });
      }
    }
    // Always duck (deeper than a strike roll), not just full — a non-full finale
    // must not play under kicks, and the deeper dip makes the WORLD hold its breath
    // for the void, not just the submix.
    K.duckHold(full ? 0.5 : 0.42, 0.6);
    // THE RESOLUTION NOTE — the loop's one real melody, phone-band + in key.
    const h = K.getHarmony();
    const root = h ? K.foldToBand(h.chord[0], 262, 523) : 392;
    K.tone({ freq: root, end: root, dur: 0.6, type: 'sine', vol: 0.08, delay: D + 0.02, dest: dst });
    K.tone({ freq: root * 1.5, dur: 0.42, type: 'triangle', vol: 0.04, delay: D + 0.04, dest: dst });
  },
};
