// THE WYRM LANCE PROFILE — the ground-up A/B alternative to the classic lance
// impact sounds ("quiet hands, loud world; the boss is the instrument").
//
// Thesis: a drum is an independent event; DAMAGE is a persistent object being
// repeatedly excited. So the reward is not our drum kit — it is the BOSS'S OWN
// BODY: a per-boss inharmonic modal resonator (three high-Q bandpass "modes")
// that every missile EXCITES with a noise burst. Hit k's ring is still sounding
// when hit k+1 lands ON THE SAME RESONANCES → overlapping rings read as ONE
// creature accumulating damage (the percept that separates destruction from
// percussion). Across the roll the modes dig DOWN (the body loosening/cracking);
// at the finale they COLLAPSE (the voice caves in). Seeded per boss = each boss
// has its own body for free, and the strike train self-varies without RNG.
//
// This is a PARALLEL engine: it exports a `sfx`-shaped object; only brandStrike /
// brandFinale diverge this pass. It imports the audio primitives from sfx.js via
// the one-directional `_sfxKit` (sfx.js never imports this — the profile dispatch
// lives in main.js, so there is no import cycle). Nothing in the classic path is
// touched. Determinism: seeded modes + the seeded shared noise buffer; no Math.random.

import { _sfxKit } from './sfx.js';
import { chordLadder } from './harmony.js';
import { mulberry32 } from './util.js';
import { CONFIG } from './config.js';

const K = _sfxKit;

// --- Tuning (kept local + named so the harsh-critique pass can move any of these
// to CONFIG.LOCK once the direction is proven). The resonator is "the bet" — Q,
// the inharmonic ratios, and the drive are the levers between "wounded creature"
// and "metallic gong".
const RES = {
  baseLo: 190, baseHi: 290,       // seeded fundamental band (Hz) — the boss's register
  ratios: [1, 1.53, 2.37],        // INHARMONIC modes (flesh/chitin, not a bell's integer series)
  qs: [16, 14, 11],               // ring length ∝ Q/f (~140ms at 250Hz/Q16 → overlaps the 60ms stagger)
  gains: [0.7, 0.45, 0.3],        // per-mode mix
  drive: 0.25,                    // shared soft-sat: body grit without clipping the sum
  out: 0.32,                      // resonator → sfxBus (kept modest; the master limiter is a net, not a plan)
  digPerHit: 0.018,               // modes slide DOWN this fraction per hit (the body loosening)
  exciteBase: 0.3, excitePerHit: 0.05,  // excitation burst level, rising across the roll
  collapse: 0.5,                  // finale: modes cave to this fraction of base
};

let bossKey = 'wyrm';   // current boss id (the modal seed) — set on every bossStart
let R = null;           // the live resonator graph, or null (lazy per fight)

// Deterministic string → uint32 seed (FNV-1a). Same boss ⇒ same body every fight.
function hashSeed(s) {
  let h = 0x811c9dc5 >>> 0;
  s = String(s == null ? 'wyrm' : s);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

// Lazily build the resonator for the current boss. Returns the graph or null when
// audio isn't up (headless / muted-context) — every caller no-ops safely then.
function ensureVoice() {
  if (R) return R;
  const a = K.getCtx();
  if (!a) return null;
  const bus = K.sfxBus();
  if (!bus) return null;
  const rng = mulberry32(hashSeed(bossKey));
  const base = RES.baseLo + rng() * (RES.baseHi - RES.baseLo);
  const rin = a.createGain(); rin.gain.value = 1;
  const sh = a.createWaveShaper(); sh.curve = K.makeDriveCurve(RES.drive); sh.oversample = '2x';
  const rout = a.createGain(); rout.gain.value = RES.out;
  const bps = [];
  for (let i = 0; i < RES.ratios.length; i++) {
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = base * RES.ratios[i];
    bp.Q.value = RES.qs[i];
    const mg = a.createGain(); mg.gain.value = RES.gains[i];
    rin.connect(bp).connect(mg).connect(sh);
    bps.push(bp);
  }
  sh.connect(rout).connect(bus);
  R = { a, rin, bps, rout, base };
  return R;
}

// Strike the body: a short broadband burst into the resonator input excites every
// mode; the high-Q filters ring and OVERLAP with the previous hits' rings.
function excite(vol) {
  const r = R; if (!r) return;
  const a = r.a, t = a.currentTime;
  const src = a.createBufferSource();
  src.buffer = K.getNoiseBuffer(a);
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);   // 20ms excitation
  src.connect(g).connect(r.rin);
  src.start(t);
  src.stop(t + 0.07);
}

// Slide every mode to `factor × base` (the body loosening / caving), smoothed.
function slideModes(factor, tc) {
  const r = R; if (!r) return;
  const t = r.a.currentTime;
  for (let i = 0; i < r.bps.length; i++) {
    r.bps[i].frequency.setTargetAtTime(r.base * RES.ratios[i] * factor, t, tc);
  }
}

export const lanceWyrm = {
  // Called on every bossStart (both profiles) so a mid-fight flip TO wyrm can
  // lazy-start the right body. A new boss id rebuilds the resonator with its seed.
  setBoss(id) {
    if (id !== bossKey) { this.bossVoiceEnd(); bossKey = id == null ? 'wyrm' : id; }
  },
  // Tear the resonator down (bossEnd, or on toggling AWAY from wyrm). Idempotent;
  // no sources to stop (filters/gains only — the transient bursts stop themselves).
  bossVoiceEnd() {
    if (!R) return;
    try { R.rout.disconnect(); } catch { /* already gone */ }
    R = null;
  },

  // THE IMPACT (k = position in the roll, n = volley size). Three voices: a dry
  // contact crack, the BODY EXCITATION (the destructiveness — an accumulating
  // ring, not a self-contained drum hit), and a sparse in-key tint. No per-hit
  // duck: the whole roll sits in ONE sustained hole opened here at k=0.
  brandStrike(k = 0, n = 1, full = false) {
    const kk = Math.min(k, 5);
    // (a) dry contact crack — the sharp leading edge (hardness), kept small.
    K.noiseWhoosh({ from: 2600, to: 1000, dur: 0.014, vol: 0.05, q: 1 });
    // (b) excite the boss body. First hit of the roll resets the modes up (fresh
    //     body) and opens the sustained roll-duck; each hit digs the modes DOWN.
    const r = ensureVoice();
    if (r) {
      if (k === 0) {
        slideModes(1, 0.02);   // fresh body at the top of the roll
        const rollDur = Math.min(0.9, Math.max(0.12, (n * (CONFIG.LOCK.lanceStaggerMs / 1000)) + 0.14));
        K.duckHold(CONFIG.LOCK.impactDuckAmt, rollDur);   // one hole for the whole roll
      }
      excite(RES.exciteBase + RES.excitePerHit * kk);
      slideModes(1 - RES.digPerHit * kk, 0.03);
    }
    // (c) chord tint — the melodic ascent, but SPARSE (every other hit) so it
    //     stays legible and never becomes a drum-fill of its own.
    if (k % 2 === 0) {
      const h = K.getHarmony();
      const f = h ? chordLadder(660, h.chord, k) : 660 * (1 + 0.06 * k);
      K.tone({ freq: f, end: f * 0.99, dur: 0.06, type: 'triangle', vol: 0.03 });
    }
  },

  // THE FINALE — a CATEGORY change, not just "louder": a void, a saturated kill
  // crack, the body COLLAPSING (modes caving an octave then settling back), and
  // the loop's ONE real melody — an in-key resolution note in the phone-audible
  // mid register. Everything after the 40ms void so the drop lands into silence.
  brandFinale(n = 3, full = false) {
    const D = 0.04;   // the void before the drop
    const big = Math.pow(Math.max(1, n) / 3, CONFIG.LOCK.riserTickPowN);   // 3→1, 6→~3
    // Kill crack — the one place a hard drive (0.8) belongs.
    K.gritBurst({ from: 5000, to: 600, dur: 0.08, vol: 0.14, q: 0.7, drive: 0.8, delay: D });
    // The body caves: a big excitation, modes collapse toward `collapse×base`
    // fast, then recover over ~0.8s (the groan settling, not dying — the boss
    // lives on after a non-lethal full volley).
    const r = ensureVoice();
    if (r) {
      excite(0.55 + 0.08 * Math.min(big, 3));
      slideModes(RES.collapse, 0.08);
      setTimeout(() => { if (R === r) slideModes(1, 0.35); }, 260);
      if (full) K.duckHold(Math.min(0.34, CONFIG.LOCK.impactDuckAmt * 1.7), 0.5);
    }
    // Headphone sub floor (a bonus below the phone-speaker floor).
    K.tone({ freq: 75, end: 34, dur: 0.5, type: 'sine', vol: Math.min(0.14, 0.08 + 0.03 * big), delay: D });
    // Falling debris — 3 shards (halved from the classic count; the resonator now
    // carries the body, so the shards are just the surface breaking).
    for (let i = 0; i < 3; i++) {
      const fs = 1900 + i * 170;
      K.tone({ freq: fs, end: fs * 0.6, dur: 0.12, type: 'triangle', vol: 0.05, delay: D + 0.03 + i * 0.03 });
    }
    // THE RESOLUTION NOTE — the loop's only real melody, in the mid register a
    // phone can actually play, so the climax resolves INTO the song (sine body +
    // a triangle octave-fifth for shimmer). Fixed fallback keeps it deterministic.
    const h = K.getHarmony();
    const root = h ? K.foldToBand(h.chord[0], 262, 523) : 392;
    K.tone({ freq: root, end: root, dur: 0.6, type: 'sine', vol: 0.07, delay: D + 0.02 });
    K.tone({ freq: root * 1.5, dur: 0.42, type: 'triangle', vol: 0.035, delay: D + 0.04 });
  },
};
