// Unit-checks the BS.1770 loudness math in js/sfxLoudness.js against known
// reference signals. Run with: node tests/loudness.mjs
import { integratedLufs, samplePeakDb, measure, encodeWavPcm16 } from '../js/sfxLoudness.js';

let pass = 0, fail = 0;
function check(label, ok) {
  if (ok) pass++;
  else { fail++; console.error(`FAIL: ${label}`); }
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;

const FS = 48000;
function sine(freq, seconds, amp = 1) {
  const n = Math.round(seconds * FS);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = amp * Math.sin(2 * Math.PI * freq * i / FS);
  return out;
}

// BS.1770 reference: a 0 dBFS 997 Hz sine in ONE channel measures −3.01 LUFS,
// so the same tone in BOTH stereo channels measures ≈ 0.0 LUFS.
const s997 = sine(997, 3);
const lufsFull = integratedLufs([s997, s997], FS);
check(`997Hz stereo 0dBFS ≈ 0.0 LUFS (got ${lufsFull.toFixed(2)})`, near(lufsFull, 0.0, 0.1));
check(`997Hz mono 0dBFS ≈ -3.01 LUFS (got ${integratedLufs([s997], FS).toFixed(2)})`, near(integratedLufs([s997], FS), -3.01, 0.1));

// Linearity: −20 dB gain shifts loudness by exactly −20 LU.
const quiet = sine(997, 3, 0.1);
const lufsQuiet = integratedLufs([quiet, quiet], FS);
check(`gain linearity (-20dB → ${(-lufsFull + lufsQuiet).toFixed(2)} LU)`, near(lufsQuiet - lufsFull, -20, 0.05));

// K-weighting shape: lows attenuated (−3 dB @ 60 Hz, more below), highs
// shelved up ~+4 dB.
const lufs60 = integratedLufs([sine(60, 3), sine(60, 3)], FS);
const lufs10k = integratedLufs([sine(10000, 3), sine(10000, 3)], FS);
check(`60Hz attenuated vs 1kHz (${(lufs60 - lufsFull).toFixed(1)} LU)`, near(lufs60 - lufsFull, -3, 1.0));
check(`10kHz boosted vs 1kHz (${(lufs10k - lufsFull).toFixed(1)} LU)`, near(lufs10k - lufsFull, 4, 1.2));

// Sample-rate independence: same signal rendered at 44.1k measures the same.
const FS2 = 44100;
const n2 = Math.round(3 * FS2);
const s2 = new Float32Array(n2);
for (let i = 0; i < n2; i++) s2[i] = Math.sin(2 * Math.PI * 997 * i / FS2);
const lufs441 = integratedLufs([s2, s2], FS2);
check(`44.1k vs 48k agreement (Δ=${Math.abs(lufs441 - lufsFull).toFixed(3)})`, near(lufs441, lufsFull, 0.1));

// Gating: loud burst + long near-silence ≈ loudness of the burst alone
// (silence is gated out, not averaged in).
const burst = sine(997, 1, 0.5);
const silence = new Float32Array(9 * FS).fill(0.00001);
const gated = new Float32Array(burst.length + silence.length);
gated.set(burst); gated.set(silence, burst.length);
const lufsGated = integratedLufs([gated, gated], FS);
const lufsBurst = integratedLufs([burst, burst], FS);
check(`gating ignores silence (${lufsGated.toFixed(1)} vs ${lufsBurst.toFixed(1)})`, near(lufsGated, lufsBurst, 1.0));

// Peak + measure() shape.
check('samplePeakDb of 0dBFS sine ≈ 0', near(samplePeakDb([s997]), 0, 0.01));
const m = measure([s997, s997], FS);
check('measure() returns finite metrics', Number.isFinite(m.lufs) && Number.isFinite(m.peakDb) && Number.isFinite(m.crestDb));
check(`sine crest ≈ 3dB (got ${m.crestDb})`, near(m.crestDb, 3.01, 0.2));
check('mono drop of identical channels ≈ 0', near(m.monoDropLU, 0, 0.05));
// Hard-panned uncorrelated-ish content folds down quieter than the stereo mix.
const l = sine(997, 3), r = sine(1003, 3, -1);
const m2 = measure([l, r], FS);
check(`mono drop detects cancellation (${m2.monoDropLU} LU)`, m2.monoDropLU > 1);

// WAV encoder: header fields + deterministic with a seeded rand.
const seedRand = () => 0.5; // TPDF dither = (0.5-0.5)=0 → pure truncation, deterministic
const wav = encodeWavPcm16([sine(440, 0.01), sine(440, 0.01)], FS, seedRand);
const dv = new DataView(wav);
check('WAV RIFF magic', dv.getUint32(0, false) === 0x52494646);
check('WAV is PCM16 stereo', dv.getUint16(20, true) === 1 && dv.getUint16(22, true) === 2 && dv.getUint16(34, true) === 16);
check('WAV data length matches', dv.getUint32(40, true) === Math.round(0.01 * FS) * 4);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
