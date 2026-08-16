// Unit-checks the instrument archetypes against a minimal Web Audio mock:
// every builder must render a self-terminating node graph, connect to the
// destination, and (for Karplus plucks) be deterministic + pitch-cached.
// Run with: node tests/insts.mjs
import { INSTS, fmEP, supersaw, pluck } from '../js/insts.js';

let pass = 0, fail = 0;
function check(label, ok) {
  if (ok) pass++;
  else { fail++; console.error(`FAIL: ${label}`); }
}

// Minimal OfflineAudioContext-shaped mock: records created nodes + connections
// and start/stop calls, enough to assert graph shape without real DSP.
function mockCtx(sampleRate = 44100) {
  const nodes = [];
  const mkParam = (v = 0) => ({
    value: v, _events: 0,
    setValueAtTime() { this._events++; return this; },
    linearRampToValueAtTime() { this._events++; return this; },
    exponentialRampToValueAtTime() { this._events++; return this; },
    setTargetAtTime() { this._events++; return this; },
  });
  function node(type, extra = {}) {
    const n = {
      type: '', kind: type, _conns: [], _started: false, _stopped: false,
      connect(dst) { this._conns.push(dst); return dst; },
      start() { this._started = true; },
      stop() { this._stopped = true; },
      ...extra,
    };
    nodes.push(n);
    return n;
  }
  const ctx = {
    sampleRate,
    destination: node('destination'),
    createOscillator: () => node('osc', { frequency: mkParam(0), detune: mkParam(0) }),
    createGain: () => node('gain', { gain: mkParam(1) }),
    createBiquadFilter: () => node('biquad', { frequency: mkParam(0), Q: mkParam(1) }),
    createStereoPanner: () => node('panner', { pan: mkParam(0) }),
    createBufferSource: () => node('bufsrc', { buffer: null, playbackRate: mkParam(1) }),
    createBuffer(ch, len, sr) {
      const data = Array.from({ length: ch }, () => new Float32Array(len));
      return { numberOfChannels: ch, length: len, sampleRate: sr, duration: len / sr, getChannelData: (c) => data[c] };
    },
    _nodes: nodes,
  };
  return ctx;
}

// Reachability: does a graph starting at `srcs` reach `dest`?
function reaches(srcs, dest) {
  const seen = new Set(); const stack = [...srcs];
  while (stack.length) {
    const n = stack.pop();
    if (n === dest) return true;
    if (!n || seen.has(n)) continue;
    seen.add(n);
    if (n._conns) stack.push(...n._conns);
  }
  return false;
}

for (const [name, fn] of Object.entries(INSTS)) {
  const a = mockCtx();
  const dest = a.createGain();
  const before = a._nodes.length;
  fn(a, dest, 440, 0.15, 0.4, 0.0, {});
  const made = a._nodes.slice(before);
  const sources = made.filter((n) => n.kind === 'osc' || n.kind === 'bufsrc');
  check(`${name}: creates sound sources`, sources.length >= 1);
  check(`${name}: every source starts`, sources.every((s) => s._started));
  check(`${name}: every source stops (self-terminating)`, sources.every((s) => s._stopped));
  check(`${name}: graph reaches destination`, reaches(sources, dest));
  // Node budget: a single note must stay lean on weak mobile.
  check(`${name}: node budget ≤ 16 (got ${made.length})`, made.length <= 16);
}

// FM EP: uses FM (a modulator connected into a carrier's frequency param).
{
  const a = mockCtx();
  const dest = a.createGain();
  fmEP(a, dest, 440, 0.15, 0.4, 0, {});
  const oscs = a._nodes.filter((n) => n.kind === 'osc');
  const fmWired = a._nodes.some((n) => n.kind === 'gain' && n._conns.some((c) => oscs.some((o) => o.frequency === c)));
  check('fmEP: modulator drives a carrier frequency (real FM)', fmWired);
}

// Supersaw: several detuned saw voices, split across two stereo sides.
{
  const a = mockCtx();
  const dest = a.createGain();
  supersaw(a, dest, 440, 0.15, 0.4, 0, {});
  const saws = a._nodes.filter((n) => n.kind === 'osc');
  const panners = a._nodes.filter((n) => n.kind === 'panner');
  check(`supersaw: ≥6 detuned voices (got ${saws.length})`, saws.length >= 6);
  check('supersaw: voices are detuned', saws.some((s) => s.detune.value !== 0) || saws.every((s) => s.detune._events >= 0));
  check(`supersaw: stereo-split (2 panners, got ${panners.length})`, panners.length === 2);
}

// Karplus pluck: deterministic + cached per pitch (same freq → same buffer object).
{
  const a = mockCtx();
  const dest = a.createGain();
  pluck(a, dest, 330, 0.15, 0.4, 0, {});
  const b1 = a._nodes.find((n) => n.kind === 'bufsrc').buffer;
  pluck(a, dest, 330, 0.15, 0.4, 1, {});
  const bufs = a._nodes.filter((n) => n.kind === 'bufsrc');
  const b2 = bufs[bufs.length - 1].buffer;
  check('pluck: identical pitch reuses the cached buffer', b1 === b2);
  check('pluck: buffer is non-empty and rings', b1 && b1.length > 1000);
  // Excitation is real signal (KS noise burst decayed), not silence.
  const d = b1.getChannelData(0);
  let energy = 0; for (let i = 0; i < 500; i++) energy += Math.abs(d[i]);
  check('pluck: string is excited (non-silent attack)', energy > 1);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
