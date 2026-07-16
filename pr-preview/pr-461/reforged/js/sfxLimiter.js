// Mastering v2 tail: a true lookahead brickwall limiter (AudioWorklet) that
// replaces the tanh soft-clipper as the loudness ceiling. The tanh curve
// saturates EVERYTHING nonlinearly (0.89 in → 0.71 out); a real limiter is
// transparent until the ceiling and rides gain smoothly into it — the single
// biggest "produced, not clipped" upgrade on the master path.
//
// Contract (same law as getBeatClock's null fallback): upgradeMasterChain()
// resolves false and leaves the SHIPPED chain untouched on any failure —
// worklet unsupported, module load rejected, constructor throw. The game can
// never lose audio to this upgrade. The worklet also doubles as the
// audio-thread health beacon: it posts {underrun} when the render thread
// stalls (invisible to fps meters — Web Audio runs on its own thread).

const CEILING_DB = -1;      // dBFS ceiling (0.6 dB sample-peak margin is the
                            // caller's business — see tools/bounce.mjs)
const LOOKAHEAD_S = 0.004;  // 4 ms latency; SFX share it (acceptable — under
                            // the ~8 ms input-feel budget; split the SFX bus
                            // around the limiter if this ever reads on feel)

const WORKLET_SRC = `
class DDLimiter extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ahead = Math.max(8, Math.round(sampleRate * ${LOOKAHEAD_S}));
    this.bufL = new Float32Array(this.ahead);
    this.bufR = new Float32Array(this.ahead);
    this.win = new Float32Array(this.ahead); // |peak| aligned with the ring
    this.w = 0;
    this.gr = 1;                              // current gain (1 = unity)
    this.max = 0; this.maxAge = 0;            // running window max + its age
    this.ceil = Math.pow(10, ${CEILING_DB} / 20);
    this.att = Math.exp(-1 / (sampleRate * 0.0008)); // fast attack (<< lookahead)
    this.rel = Math.exp(-1 / (sampleRate * 0.08));   // 80 ms release
    this.lastFrame = -1;
    this.lastBeacon = 0;
  }
  process(inputs, outputs) {
    const inp = inputs[0];
    const out = outputs[0];
    if (!inp || !inp.length || !inp[0]) {
      return true; // keep alive through silence/disconnects
    }
    const L = inp[0];
    const R = inp[1] || inp[0];
    const oL = out[0];
    const oR = out[1] || out[0];
    const n = L.length;
    // Underrun beacon: the render thread stalling shows up as currentFrame
    // jumping more than a few quanta between process() calls. The first two
    // seconds are grace — context resume + the chain rewire jump the clock
    // without being real stalls.
    if (this.lastFrame >= 0 && currentFrame - this.lastFrame > 512 &&
        currentTime > 2 && currentTime - this.lastBeacon > 1) {
      this.port.postMessage({ underrun: currentFrame - this.lastFrame });
      this.lastBeacon = currentTime;
    }
    this.lastFrame = currentFrame + n;
    const ahead = this.ahead;
    for (let i = 0; i < n; i++) {
      const w = this.w;
      const inL = L[i];
      const inR = R[i];
      // Read the delayed sample BEFORE overwriting the ring slot.
      const dL = this.bufL[w];
      const dR = this.bufR[w];
      this.bufL[w] = inL;
      this.bufR[w] = inR;
      const peak = Math.max(Math.abs(inL), Math.abs(inR));
      // Running max over the lookahead window: track the max and rescan only
      // when the current max falls out of the window (amortized ~O(1)).
      this.win[w] = peak;
      if (peak >= this.max) { this.max = peak; this.maxAge = 0; }
      else if (++this.maxAge >= ahead) {
        let m = 0;
        for (let j = 0; j < ahead; j++) { const v = this.win[j]; if (v > m) m = v; }
        this.max = m;
        this.maxAge = 0;
      }
      const target = this.max > this.ceil ? this.ceil / this.max : 1;
      // Attack races ahead of the delayed peak; release breathes back slowly.
      const coef = target < this.gr ? this.att : this.rel;
      this.gr = target + (this.gr - target) * coef;
      oL[i] = dL * this.gr;
      oR[i] = dR * this.gr;
      this.w = (w + 1) % ahead;
    }
    return true;
  }
}
registerProcessor('dd-limiter', DDLimiter);
`;

// Hard clip at ±1: identity inside the rails (unlike tanh), pure insurance
// against the residual overs a smoothed limiter can let through.
function makeHardClipCurve() {
  const n = 1024;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) c[i] = Math.max(-1, Math.min(1, (i / (n - 1)) * 2 - 1));
  return c;
}

// Rewire masterGain → comp → LIMITER → hardclip → destination, relaxing the
// compressor now that a real ceiling exists downstream. `chain` is
// buildBusGraph()'s {masterGain, comp, clipper} handles. Resolves true on
// success; false (chain untouched) on ANY failure. `onUnderrun` gets the
// worklet's audio-thread stall beacons.
export async function upgradeMasterChain(a, chain, onUnderrun = null) {
  try {
    if (!a.audioWorklet || typeof AudioWorkletNode === 'undefined') return false;
    const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: 'application/javascript' }));
    try {
      await a.audioWorklet.addModule(url);
    } finally {
      URL.revokeObjectURL(url);
    }
    const lim = new AudioWorkletNode(a, 'dd-limiter', {
      numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2],
    });
    if (onUnderrun) lim.port.onmessage = (e) => { if (e.data && e.data.underrun) onUnderrun(e.data.underrun); };
    const clip = a.createWaveShaper();
    clip.curve = makeHardClipCurve();
    // Swap the tail atomically: comp now feeds the limiter, the tanh clipper
    // is detached (the hard clip replaces it as >±1 insurance only).
    chain.comp.disconnect();
    chain.clipper.disconnect();
    chain.comp.connect(lim);
    lim.connect(clip);
    clip.connect(a.destination);
    // With a real ceiling downstream the compressor stops being the loudness
    // wall and becomes glue: relax it.
    chain.comp.threshold.value = -10;
    chain.comp.ratio.value = 3;
    return true;
  } catch {
    return false;
  }
}
