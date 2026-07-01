// Score playback: turns a THEMES entry into a living, fight-reactive piece.
// Layer stack (gated in update()):
//   bass + theme + soft pad ............ always
//   counter + full pad + heavier drums . phase 2
//   brass doubling + celesta arps ...... phase 3
//   arps + brass ....................... Armiger (any phase)
//   everything ducked, arps alone ...... stagger window
// Look-ahead scheduler (the standard Web Audio pattern): a 100ms interval
// schedules every note in the next 450ms at exact AudioContext times.

import { THEMES } from './tracks.js';
import {
  getCtx, getMusicBus, setMusicDuck,
  vStrings, vBrass, vChoir, vBell, vTaiko, vSnare, vHat, vCymbal, vBraam,
} from './sfx.js';

const LOOK_AHEAD = 0.45;
const TICK_MS = 100;

let theme = null;       // active THEMES entry
let events = [];        // sorted loop events
let loopLen = 0;
let loopStart = 0;      // ctx time the current loop began
let nextIdx = 0;
let timer = null;
let layers = null;      // name -> GainNode
let menuMode = false;

// --- Percussion patterns (per 8-eighth bar) ---------------------------------

const DRUMS = {
  rite: (bar) => {
    const out = [{ at: 0, fn: 'taiko', vol: 0.55 }, { at: 6, fn: 'taiko', vol: 0.28 }];
    if (bar % 2 === 1) out.push({ at: 4, fn: 'taiko', vol: 0.4 });
    return out;
  },
  war: () => [
    { at: 0, fn: 'taiko', vol: 0.55 }, { at: 3, fn: 'taiko', vol: 0.32 },
    { at: 4, fn: 'taiko', vol: 0.45 }, { at: 4, fn: 'snare', vol: 0.16 },
    { at: 0, fn: 'hat', vol: 0.05 }, { at: 2, fn: 'hat', vol: 0.05 },
    { at: 4, fn: 'hat', vol: 0.05 }, { at: 6, fn: 'hat', vol: 0.05 },
  ],
  war2: (bar) => {
    const out = [
      { at: 0, fn: 'taiko', vol: 0.55 }, { at: 2, fn: 'taiko', vol: 0.3 },
      { at: 5, fn: 'taiko', vol: 0.34 }, { at: 6, fn: 'taiko', vol: 0.45 },
      { at: 4, fn: 'snare', vol: 0.18 },
    ];
    for (let i = 0; i < 8; i++) out.push({ at: i, fn: 'hat', vol: 0.045 });
    if (bar % 4 === 0) out.push({ at: 0, fn: 'cymbal', vol: 0.09 });
    return out;
  },
  storm: (bar) => {
    const out = [
      { at: 0, fn: 'taiko', vol: 0.55 }, { at: 2, fn: 'taiko', vol: 0.3 },
      { at: 4, fn: 'taiko', vol: 0.48 }, { at: 6, fn: 'taiko', vol: 0.3 },
      { at: 4, fn: 'snare', vol: 0.2 }, { at: 7, fn: 'snare', vol: 0.1 },
    ];
    for (let i = 0; i < 8; i++) out.push({ at: i, fn: 'hat', vol: 0.055 });
    if (bar % 4 === 0) out.push({ at: 0, fn: 'cymbal', vol: 0.12 });
    return out;
  },
  storm2: (bar) => {
    const out = [];
    for (let i = 0; i < 8; i += 2) out.push({ at: i, fn: 'taiko', vol: i === 0 ? 0.58 : 0.34 });
    out.push(
      { at: 3, fn: 'snare', vol: 0.14 }, { at: 4, fn: 'snare', vol: 0.22 },
      { at: 7, fn: 'snare', vol: 0.14 },
    );
    for (let i = 0; i < 8; i++) out.push({ at: i, fn: 'hat', vol: 0.06 });
    if (bar % 2 === 0) out.push({ at: 0, fn: 'cymbal', vol: 0.11 });
    return out;
  },
};

// --- Event building -----------------------------------------------------------

function pushSeq(out, seq, layer, voice, e8, { mult = 1, durMult = 0.92, vol }) {
  let t = 0;
  for (const [freq, d] of seq) {
    if (freq > 0) out.push({ t, layer, voice, freq: freq * mult, dur: d * e8 * durMult, vol });
    t += d * e8;
  }
}

function buildEvents(th) {
  const e8 = 60 / th.bpm / 2;
  const barLen = 8 * e8;
  loopLen = 64 * e8;
  const out = [];

  pushSeq(out, th.bass, 'bass', 'bassStr', e8, { vol: 0.16, durMult: 0.7 });
  pushSeq(out, th.theme, 'theme', 'strings', e8, { vol: 0.13 });
  pushSeq(out, th.theme, 'brass', 'brass', e8, { vol: 0.085, durMult: 0.85 });
  pushSeq(out, th.counter, 'counter', 'strings', e8, { vol: 0.07 });

  for (let bar = 0; bar < 8; bar++) {
    const t0 = bar * barLen;
    // Choir pad: one chord held the full bar.
    for (const f of th.pad[bar]) {
      out.push({ t: t0, layer: 'pad', voice: 'choir', freq: f, dur: barLen * 0.98, vol: 0.05 });
    }
    // Celesta arps: 16th-note cycle, twice per bar.
    const cyc = th.arp[bar % 4];
    const e16 = e8 / 2;
    for (let rep = 0; rep < 2; rep++) {
      for (let i = 0; i < 8; i++) {
        out.push({ t: t0 + rep * 4 * e8 + i * e16, layer: 'arp', voice: 'bell', freq: cyc[i], dur: 0.32, vol: 0.045 });
      }
    }
    // Drum tiers (each phase pattern is its own gated layer).
    for (const [layer, name] of [['drums1', th.drums.p1], ['drums2', th.drums.p2], ['drums3', th.drums.p3]]) {
      for (const ev of DRUMS[name](bar)) {
        out.push({ t: t0 + ev.at * e8, layer, drum: ev.fn, vol: ev.vol });
      }
    }
  }

  out.sort((a, b) => a.t - b.t);
  return out;
}

// --- Playback ------------------------------------------------------------------

function makeLayers() {
  const a = getCtx();
  const bus = getMusicBus();
  if (!a || !bus) return null;
  const L = {};
  for (const name of ['bass', 'theme', 'brass', 'counter', 'pad', 'arp', 'drums1', 'drums2', 'drums3']) {
    const g = a.createGain();
    g.gain.value = 0;
    g.connect(bus);
    L[name] = g;
  }
  return L;
}

function playEvent(ev, at) {
  const dest = layers[ev.layer];
  if (!dest) return;
  if (ev.drum) {
    if (ev.drum === 'taiko') vTaiko(dest, { vol: ev.vol, t0: at });
    else if (ev.drum === 'snare') vSnare(dest, { vol: ev.vol, t0: at });
    else if (ev.drum === 'hat') vHat(dest, { vol: ev.vol, t0: at });
    else if (ev.drum === 'cymbal') vCymbal(dest, { vol: ev.vol, t0: at });
    return;
  }
  const p = { freq: ev.freq, dur: ev.dur, vol: ev.vol, t0: at };
  if (ev.voice === 'strings') vStrings(dest, p);
  else if (ev.voice === 'bassStr') vStrings(dest, { ...p, attack: 0.02 });
  else if (ev.voice === 'brass') vBrass(dest, p);
  else if (ev.voice === 'choir') vChoir(dest, p);
  else if (ev.voice === 'bell') vBell(dest, p);
}

function tickScheduler() {
  const a = getCtx();
  if (!a || !theme) return;
  const now = a.currentTime;
  // Tab throttling can leave us loops behind — jump to a fresh loop.
  if (now - loopStart > loopLen * 2) {
    loopStart = now + 0.05;
    nextIdx = 0;
  }
  const horizon = now + LOOK_AHEAD;
  let safety = 0;
  while (safety++ < 4000) {
    const ev = events[nextIdx];
    const at = loopStart + ev.t;
    if (at > horizon) break;
    if (at >= now - 0.02) playEvent(ev, Math.max(at, now + 0.001));
    nextIdx++;
    if (nextIdx >= events.length) {
      nextIdx = 0;
      loopStart += loopLen;
    }
  }
}

export const music = {
  get activeTheme() { return theme ? theme.id : null; },

  start(id, { menu = false } = {}) {
    const th = THEMES[id];
    const a = getCtx();
    if (!th || !a) return;
    if (theme && theme.id === id && menuMode === menu && timer) return; // already playing
    this.stop();
    theme = th;
    menuMode = menu;
    events = buildEvents(th);
    layers = makeLayers();
    if (!layers) { theme = null; return; }
    if (menu) {
      // Menu ambience: just the pad, arps and soft bass — the theme waits.
      layers.pad.gain.value = 0.8;
      layers.arp.gain.value = 0.5;
      layers.bass.gain.value = 0.25;
    } else {
      layers.bass.gain.value = 1;
      layers.theme.gain.value = 1;
      layers.pad.gain.value = 0.45;
      layers.drums1.gain.value = 1;
    }
    loopStart = a.currentTime + 0.08;
    nextIdx = 0;
    tickScheduler();
    timer = setInterval(tickScheduler, TICK_MS);
  },

  stop() {
    if (timer) { clearInterval(timer); timer = null; }
    if (layers) {
      const a = getCtx();
      const now = a ? a.currentTime : 0;
      for (const g of Object.values(layers)) {
        try {
          g.gain.cancelScheduledValues(now);
          g.gain.setTargetAtTime(0, now, 0.05);
          setTimeout(() => { try { g.disconnect(); } catch { /* fine */ } }, 600);
        } catch { /* fine */ }
      }
    }
    layers = null;
    theme = null;
    setMusicDuck(0);
  },

  pauseForBackground() {
    this.stop();
  },

  // Per-frame layer gating from fight state.
  update({ phase = 1, armiger = false, stagger = false, dead = false }) {
    if (!layers || menuMode) return;
    const a = getCtx();
    if (!a) return;
    const now = a.currentTime;
    const set = (name, v, tc = 0.4) => layers[name].gain.setTargetAtTime(v, now, tc);

    const p2 = phase >= 2, p3 = phase >= 3;
    set('counter', p2 ? 1 : 0);
    set('pad', p2 ? 0.9 : 0.45);
    set('brass', (p3 || armiger) ? 1 : 0, 0.25);
    set('arp', (p3 || armiger || stagger) ? 1 : 0, 0.2);
    set('drums1', p2 ? 0 : 1, 0.3);
    set('drums2', p2 && !p3 ? 1 : 0, 0.3);
    set('drums3', p3 ? 1 : 0, 0.3);
    if (dead) for (const n of ['theme', 'brass', 'counter', 'drums1', 'drums2', 'drums3']) set(n, 0, 0.2);
    setMusicDuck(stagger ? 1 : 0);
  },

  // Brass stab + cymbal at phase walls — lands immediately (cinematic owns timing).
  phaseSting(power = 1) {
    const a = getCtx();
    if (!a || !theme) return;
    const bus = getMusicBus();
    const r = theme.root;
    const t0 = a.currentTime;
    for (const m of [1, 1.1892, 1.5]) { // minor triad
      vBrass(bus, { freq: r * m, dur: 1.0 + power * 0.4, vol: 0.085, t0 });
    }
    vTaiko(bus, { vol: 0.55, t0, pitch: 110, drop: 30, dur: 0.45 });
    vCymbal(bus, { vol: 0.13, t0, dur: 1.6 });
    if (power >= 2) vBraam(bus, { freq: r / 4, dur: 1.8, vol: 0.2, t0 });
  },

  // Victory fanfare: rising brass cadence + bell ladder over taiko hits.
  victoryFanfare() {
    const a = getCtx();
    if (!a) return;
    const bus = getMusicBus();
    const r = theme ? theme.root : 130.81;
    const t0 = a.currentTime;
    const steps = [
      { m: 1, at: 0 }, { m: 4 / 3, at: 0.32 }, { m: 1.5, at: 0.64 }, { m: 2, at: 1.05 },
    ];
    for (const s of steps) {
      vBrass(bus, { freq: r * s.m, dur: s.m === 2 ? 1.6 : 0.42, vol: 0.1, t0: t0 + s.at });
      vTaiko(bus, { vol: 0.45, t0: t0 + s.at, pitch: 120, drop: 36 });
    }
    // Major third on the final chord — the sun comes out.
    vBrass(bus, { freq: r * 2 * 1.26, dur: 1.6, vol: 0.07, t0: t0 + 1.05 });
    vBrass(bus, { freq: r * 3, dur: 1.6, vol: 0.06, t0: t0 + 1.05 });
    vCymbal(bus, { vol: 0.14, t0: t0 + 1.05, dur: 2 });
    [2, 2.52, 3, 4].forEach((m, i) =>
      vBell(bus, { freq: r * 2 * m, dur: 1.0, vol: 0.06, t0: t0 + 1.2 + i * 0.12 }));
  },
};
