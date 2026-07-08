// BS.1770-4 loudness measurement — pure JS, dependency-free, runs in node AND
// the browser (on Float32Array channel data, NOT audio nodes) so the same code
// gates CI (tools/loudshots.mjs) and normalizes the WAV bounce.
//
// Implements: K-weighting (coefficients re-derived at the actual sample rate —
// never hardcode the spec's 48 kHz table on a 44.1 kHz render), 400 ms blocks
// with 75 % overlap, −70 LUFS absolute + −10 LU relative gating, sample peak.
// True peak is reported as sample peak; consumers add a safety margin (~0.6 dB)
// instead of a 4× oversampled scan — sufficient for game-audio headroom.

// K-weighting pre-filter pair, re-derived at the actual sample rate via the
// bilinear transform of the analog prototypes behind BS.1770's 48 kHz table
// (the libebur128 approach — the spec's shelf is NOT a standard RBJ shelf; it
// has an extra band coefficient Vb). At fs = 48 kHz these reproduce the spec
// coefficients to ~1e-10.
export function kWeightingCoeffs(fs) {
  // Stage 1: high-frequency shelf (~+4 dB above ~1.7 kHz).
  {
    var db = 3.999843853973347;
    var f0 = 1681.974450955533;
    var Q = 0.7071752369554196;
    var K = Math.tan(Math.PI * f0 / fs);
    var Vh = Math.pow(10, db / 20);
    var Vb = Math.pow(Vh, 0.4996667741545416);
    var a0 = 1 + K / Q + K * K;
    var shelf = {
      b0: (Vh + Vb * K / Q + K * K) / a0,
      b1: 2 * (K * K - Vh) / a0,
      b2: (Vh - Vb * K / Q + K * K) / a0,
      a1: 2 * (K * K - 1) / a0,
      a2: (1 - K / Q + K * K) / a0,
    };
  }
  // Stage 2: high-pass (rolls off below ~38 Hz). b = [1, -2, 1] per the spec
  // (deliberately not gain-normalized).
  {
    var f1 = 38.13547087602444;
    var Q1 = 0.5003270373238773;
    var K1 = Math.tan(Math.PI * f1 / fs);
    var d0 = 1 + K1 / Q1 + K1 * K1;
    var hp = {
      b0: 1, b1: -2, b2: 1,
      a1: 2 * (K1 * K1 - 1) / d0,
      a2: (1 - K1 / Q1 + K1 * K1) / d0,
    };
  }
  return [shelf, hp];
}

function biquadRun(coef, x) {
  // Direct form I; fresh state per call (channels are filtered independently).
  const { b0, b1, b2, a1, a2 } = coef;
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    const yi = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = xi;
    y2 = y1; y1 = yi;
    y[i] = yi;
  }
  return y;
}

// Integrated (gated) loudness in LUFS of N channels of Float32 samples.
// `channels` = array of Float32Array (1 = mono, 2 = stereo; all same length).
export function integratedLufs(channels, sampleRate) {
  const [shelf, hp] = kWeightingCoeffs(sampleRate);
  const weighted = channels.map((ch) => biquadRun(hp, biquadRun(shelf, ch)));
  const blockLen = Math.round(0.4 * sampleRate);
  const hop = Math.round(0.1 * sampleRate); // 75% overlap
  const n = weighted[0].length;
  if (n < blockLen) return -Infinity;

  // Per-block mean-square power summed across channels (stereo weights = 1).
  const blocks = [];
  for (let start = 0; start + blockLen <= n; start += hop) {
    let sum = 0;
    for (const ch of weighted) {
      let s = 0;
      for (let i = start; i < start + blockLen; i++) s += ch[i] * ch[i];
      sum += s / blockLen;
    }
    blocks.push(sum);
  }
  const toLufs = (power) => -0.691 + 10 * Math.log10(power);

  // Absolute gate at −70 LUFS.
  const absGated = blocks.filter((p) => toLufs(p) > -70);
  if (!absGated.length) return -Infinity;
  // Relative gate 10 LU below the abs-gated mean.
  const mean1 = absGated.reduce((s, p) => s + p, 0) / absGated.length;
  const relThresh = toLufs(mean1) - 10;
  const gated = absGated.filter((p) => toLufs(p) > relThresh);
  if (!gated.length) return -Infinity;
  const mean2 = gated.reduce((s, p) => s + p, 0) / gated.length;
  return toLufs(mean2);
}

export function samplePeakDb(channels) {
  let peak = 0;
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) {
      const v = Math.abs(ch[i]);
      if (v > peak) peak = v;
    }
  }
  return peak > 0 ? 20 * Math.log10(peak) : -Infinity;
}

// Full metric set for a stereo render. `monoDropLU` = how much quieter the
// mono fold-down is than the stereo mix — the phase-safety gate (phone
// speakers are mono; a big drop means something is cancelling).
export function measure(channels, sampleRate) {
  const lufs = integratedLufs(channels, sampleRate);
  const peakDb = samplePeakDb(channels);
  let monoDropLU = 0;
  if (channels.length === 2) {
    const [l, r] = channels;
    const mid = new Float32Array(l.length);
    for (let i = 0; i < l.length; i++) mid[i] = (l[i] + r[i]) / 2;
    // A mono fold of two IDENTICAL channels reads 3.01 LU under the stereo
    // measurement purely from the channel count — normalize that out, so 0 =
    // phase-safe and positive values = real mono cancellation.
    monoDropLU = lufs - (integratedLufs([mid], sampleRate) + 3.01);
  }
  // Crest factor: peak over RMS (dB) — a coarse "how squashed is it" signal.
  let sq = 0, count = 0;
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) sq += ch[i] * ch[i];
    count += ch.length;
  }
  const rmsDb = count ? 10 * Math.log10(sq / count) : -Infinity;
  return {
    lufs: round2(lufs),
    peakDb: round2(peakDb),
    monoDropLU: round2(monoDropLU),
    crestDb: round2(peakDb - rmsDb),
  };
}

const round2 = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : v);

// PCM16 WAV encoder with TPDF dither — truncating float renders to 16 bit
// without dither audibly distorts reverb tails; two uniform randoms per sample
// (triangular PDF, ±1 LSB) is the textbook fix. `channels`, `sampleRate` as
// above; returns an ArrayBuffer ready to save/download.
export function encodeWavPcm16(channels, sampleRate, rand = Math.random) {
  const numCh = channels.length;
  const n = channels[0].length;
  const dataLen = n * numCh * 2;
  const buf = new ArrayBuffer(44 + dataLen);
  const dv = new DataView(buf);
  const wr = (off, str) => { for (let i = 0; i < str.length; i++) dv.setUint8(off + i, str.charCodeAt(i)); };
  wr(0, 'RIFF'); dv.setUint32(4, 36 + dataLen, true); wr(8, 'WAVE');
  wr(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true);
  dv.setUint16(22, numCh, true); dv.setUint32(24, sampleRate, true);
  dv.setUint32(28, sampleRate * numCh * 2, true); dv.setUint16(32, numCh * 2, true);
  dv.setUint16(34, 16, true);
  wr(36, 'data'); dv.setUint32(40, dataLen, true);
  let off = 44;
  for (let i = 0; i < n; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const dither = (rand() - rand()) / 32768; // TPDF, ±1 LSB
      const v = Math.max(-1, Math.min(1, channels[ch][i] + dither));
      dv.setInt16(off, Math.round(v * 32767), true);
      off += 2;
    }
  }
  return buf;
}
