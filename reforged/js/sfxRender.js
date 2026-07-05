// Offline station renderer — drives the REAL engine (compileTrack /
// buildBusGraph / buildMusicGraph / playNoteEventIn, shared via sfx.js's
// render seam) into an OfflineAudioContext. Used by tools/loudshots.html
// (loudness calibration CI) and the WAV bounce. Browser-only (needs Web
// Audio); the pure math lives in sfxLoudness.js so node can test it.

import { TRACKS, __render } from './sfx.js';
import { measure, encodeWavPcm16 } from './sfxLoudness.js';
import { upgradeMasterChain } from './sfxLimiter.js';
import { sectionAt, resolveForm } from './composer.js';
import { mulberry32 } from './util.js';

// Layer-gain scenes: which vertical layers are audible in the render.
// `full` ≈ gameplay at combo≥3 while boosting — the loudest steady state a
// player hears, which is what loudness must be calibrated against.
export const LAYER_SCENES = {
  full: { bass: 1, melody: 1, pad: 1, arp: 1, wind: 0.35, high: 1, perc: 1, perc2: 1, perc3: 1, fever: 0, feverlead: 0 },
  fever: { bass: 1, melody: 1, pad: 1, arp: 1, wind: 0.35, high: 1, perc: 1, perc2: 1, perc3: 1, fever: 1, feverlead: 1 },
  base: { bass: 1, melody: 1, pad: 1, arp: 0, wind: 0, high: 0, perc: 0, perc2: 0, perc3: 0, fever: 0, feverlead: 0 },
};

// Render `loops` consecutive 8-bar passes of station `idx` (fills/humanization
// vary per pass exactly as live, via compileTrack's loop counter) and resolve
// to the rendered AudioBuffer.
export async function renderStation(idx, {
  loops = 1, sampleRate = 44100, scene = 'full', tailS = 1.2, keyShift = 0, audioV2 = true,
  walkForm = false,
} = {}) {
  const tr = TRACKS[idx];
  if (!tr) throw new Error(`no station ${idx}`);
  // Song structure: a station with a form plays a different section each
  // loop-wrap. Two render modes:
  //  • walkForm=false (measurement, default): render `loops` of the BASE
  //    section only. A form station calibrates on its main body — the drop
  //    sits at −16 and the breakdowns are RELATIVELY quieter by design, so
  //    averaging them into the loudness target would be musically wrong (and
  //    a full 44-bar render is far too slow for the per-station gate). Legacy
  //    stations have no form → this is byte-identical to before.
  //  • walkForm=true (bounce): render whole forms so the exported single is
  //    the entire arrangement — breakdowns, builds, drops — as the live
  //    scheduler sequences them.
  const form = resolveForm(tr);
  const compiled = [];
  let totalLoopS = 0;
  if (walkForm && form) {
    const passCount = Math.ceil(Math.max(loops, form.length) / form.length) * form.length;
    for (let p = 0; p < passCount; p++) {
      const c = __render.compileTrack(tr, p, keyShift, sectionAt(tr, p));
      compiled.push(c);
      totalLoopS += c.LOOP_LEN;
    }
  } else {
    const baseSection = sectionAt(tr, 0);   // the full base section (legacy = the only one)
    for (let loop = 0; loop < loops; loop++) {
      const c = __render.compileTrack(tr, loop, keyShift, baseSection);
      compiled.push(c);
      totalLoopS += c.LOOP_LEN;
    }
  }
  const c0 = compiled[0];
  const totalS = totalLoopS + tailS;
  const a = new OfflineAudioContext(2, Math.ceil(totalS * sampleRate), sampleRate);
  const buses = __render.buildBusGraph(a, 1, 1, { v2: audioV2 });
  // Mirror the live v2 upgrade (worklet lookahead limiter) so calibration
  // measures through the chain the player actually hears.
  if (audioV2 && !(await upgradeMasterChain(a, buses))) {
    throw new Error('v2 requested but worklet limiter failed to load');
  }
  const g = __render.buildMusicGraph(a, tr, c0, buses, { v2: audioV2 });
  const levels = LAYER_SCENES[scene] || LAYER_SCENES.full;
  for (const k of Object.keys(g.layers)) g.layers[k].gain.value = levels[k] ?? 0;
  let base = 0.05;
  for (const c of compiled) {
    for (const ev of c.events) {
      __render.playNoteEventIn(a, g.layers, g.pumpGain, c.pumpAmt, c.drumEnergy, c.mixBright, ev, base + ev.t);
    }
    base += c.LOOP_LEN;   // sections vary in length — advance by the real amount
  }
  return a.startRendering();
}

// Measure one station: render → BS.1770 metrics (+ render speed, a coarse
// graph-cost regression signal: if renderMs balloons, the graph got heavier).
export async function measureStation(idx, opts = {}) {
  const start = performance.now();
  const buf = await renderStation(idx, { loops: 2, ...opts });
  const renderMs = Math.round(performance.now() - start);
  const chans = [buf.getChannelData(0), buf.getChannelData(1)];
  const m = measure(chans, buf.sampleRate);
  return { id: TRACKS[idx].id, name: TRACKS[idx].name, bpm: TRACKS[idx].bpm, ...m, renderMs, seconds: Math.round(buf.duration * 10) / 10 };
}

// Bounce a station to a dithered PCM16 WAV ArrayBuffer, normalized to
// `targetLufs` (gain applied in float, peak-capped to `ceilingDb` with 0.6 dB
// sample-peak margin standing in for true peak).
export async function bounceStation(idx, {
  loops = 8, targetLufs = -14, ceilingDb = -1, sampleRate = 44100, walkForm = true, ...opts
} = {}) {
  const buf = await renderStation(idx, { loops, sampleRate, walkForm, ...opts });
  const chans = [buf.getChannelData(0), buf.getChannelData(1)];
  const m = measure(chans, buf.sampleRate);
  let gainDb = targetLufs - m.lufs;
  const peakAfter = m.peakDb + gainDb;
  const maxPeak = ceilingDb - 0.6; // sample-peak margin for inter-sample peaks
  if (peakAfter > maxPeak) gainDb -= peakAfter - maxPeak;
  const gain = Math.pow(10, gainDb / 20);
  for (const ch of chans) for (let i = 0; i < ch.length; i++) ch[i] *= gain;
  // Seeded dither so bounces are byte-reproducible for a given engine version.
  const wav = encodeWavPcm16(chans, buf.sampleRate, mulberry32(0xD17E4));
  return { wav, metrics: { ...m, appliedGainDb: Math.round(gainDb * 100) / 100 } };
}
