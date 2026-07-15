// uiSound.js — the EMBERLINE UI soundboard (UI-PREMIUM-OVERHAUL.md U11).
// Phase 1 ships the first four voices, proven on the hero screens:
//   tick    — nav/press feedback (rail buttons, gear, chips)
//   confirm — committing a primary action (TAKE OFF)
//   back    — leaving a screen (wired in Phase 2; the voice ships now)
//   whoosh  — a screen opening over the world
// All runtime-synthesized (zero asset files), 30–80ms, riding the existing SFX
// bus so the master mute/volume and the limiter own them. Attention hierarchy
// per the research: confirm > tick > ambient — kept quiet on purpose; UI sound
// should be felt in the fingers, not noticed by the ear.
//
// Every voice no-ops safely before the AudioContext exists (the first user
// gesture ignites audio via the splash flow — same rule as every other sound).
import { _sfxKit, sfxMuted } from './sfx.js';

function bus() {
  try {
    const ctx = _sfxKit.getCtx();
    const out = _sfxKit.sfxBus();
    if (!ctx || !out || ctx.state !== 'running' || sfxMuted) return null;
    return { ctx, out };
  } catch { return null; }
}

// One tiny envelope helper: osc → gain → sfxBus, exponential-ish decay.
function blip({ type = 'sine', from = 2600, to = null, dur = 0.045, vol = 0.10, delay = 0 }) {
  const b = bus(); if (!b) return;
  const { ctx, out } = b;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  osc.connect(g); g.connect(out);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}

// Filtered-noise puff for the whoosh (no osc buzz — reads as air, not beep).
function puff({ dur = 0.22, fromHz = 900, toHz = 3200, vol = 0.07 }) {
  const b = bus(); if (!b) return;
  const { ctx, out } = b;
  const t0 = ctx.currentTime;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.9;
  f.frequency.setValueAtTime(fromHz, t0);
  f.frequency.exponentialRampToValueAtTime(toHz, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  src.connect(f); f.connect(g); g.connect(out);
  src.start(t0); src.stop(t0 + dur + 0.02);
}

export const uiSound = {
  // Soft, high, near-instant — the "expensive click" (Switch-tick register).
  tick()    { blip({ type: 'triangle', from: 2300, to: 2050, dur: 0.038, vol: 0.085 }); },
  // A small upward interval (two partials) — affirmative without fanfare.
  confirm() { blip({ type: 'sine', from: 1320, to: 1560, dur: 0.07, vol: 0.11 });
              blip({ type: 'sine', from: 1980, to: 2340, dur: 0.07, vol: 0.07, delay: 0.045 }); },
  // Lower pitch, falling — the mirror of confirm. (Wired to closes in Phase 2.)
  back()    { blip({ type: 'sine', from: 1180, to: 880, dur: 0.06, vol: 0.09 }); },
  // A screen breathing open over the world.
  whoosh()  { puff({ dur: 0.22, fromHz: 900, toHz: 3200, vol: 0.065 }); },
  // EMBERSIGHT H1 — the Bell's per-role tone (HUD-REDESIGN §B.11): a soft
  // upward blip for rewards/unlocks (gold/jade), a quieter tick for everything
  // else. Deliberately UNDER the gameplay sfx (rings/gates already chime) —
  // felt, never noticed.
  bell(role) {
    if (role === 'gold' || role === 'jade') {
      blip({ type: 'sine', from: 1480, to: 1720, dur: 0.05, vol: 0.05 });
    } else if (role === 'magenta') {
      blip({ type: 'triangle', from: 1150, to: 950, dur: 0.05, vol: 0.055 });
    } else {
      blip({ type: 'triangle', from: 2150, to: 1950, dur: 0.032, vol: 0.045 });
    }
  },
};
