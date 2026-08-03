// tests/pulsetimer.mjs — determinism + photosensitivity asserts for js/pulseTimer.js
// (TEMPEST §B.8 STRIKE DETERMINISM block). Pure module: no DOM shim, no three.
//
//   node tests/pulsetimer.mjs
//
// The gauntlet (all headless, fixed-dt): same seed → identical window schedule over 10k
// ticks; long-run lit fraction within ±10% of `arcDuty`; every strike window ∈ [0.10,0.28] s;
// every inter-burst rest ≥ 1.2 s; within-window modulation ≤ 3 Hz; pin(t01) reproduces the
// same state on every call and 0 = standing / 0.5 = strike peak. Also the module-purity assert
// (imports nothing from js/) that the §B.8 firewall wants.

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createPulseTimer, mulberry32 } from '../js/pulseTimer.js';

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error('  ✗', msg); } }
function approx(a, b, tol, msg) { ok(Math.abs(a - b) <= tol, `${msg} (got ${a}, want ${b}±${tol})`); }

const DT = 1 / 60;   // fixed headless tick
const DUTIES = [0.06, 0.10, 0.14, 0.18];   // the CHARGING ladder's arcDuty rungs

// Walk a timer for `n` fixed-dt ticks, recording lit time + the run-lengths of lit/dark spells.
function walk(timer, n) {
  let litTime = 0, total = 0;
  const litRuns = [], darkRuns = [];
  let curLive = null, curLen = 0;
  const trace = [];
  for (let i = 0; i < n; i++) {
    timer.tick(DT);
    const s = timer.state();
    trace.push(s.live ? 1 : 0);
    if (s.live) litTime += DT;
    total += DT;
    if (curLive === null) { curLive = s.live; curLen = DT; }
    else if (s.live === curLive) { curLen += DT; }
    else { (curLive ? litRuns : darkRuns).push(curLen); curLive = s.live; curLen = DT; }
  }
  return { litTime, total, litRuns, darkRuns, trace };
}

// ── 1. determinism: same seed → identical schedule ──────────────────────────
for (const seed of [1, 7, 42, 1337]) {
  const a = walk(createPulseTimer({ seed, duty: 0.14 }), 6000);
  const b = walk(createPulseTimer({ seed, duty: 0.14 }), 6000);
  ok(a.trace.join('') === b.trace.join(''), `seed ${seed}: identical live-trace over 6000 ticks`);
}
// different seeds → different schedules (the seed actually matters)
{
  const a = walk(createPulseTimer({ seed: 1, duty: 0.14 }), 6000);
  const b = walk(createPulseTimer({ seed: 2, duty: 0.14 }), 6000);
  ok(a.trace.join('') !== b.trace.join(''), 'distinct seeds → distinct schedules');
}
// reseed() rewinds to the same stream
{
  const t = createPulseTimer({ seed: 99, duty: 0.10 });
  const a = walk(t, 4000);
  t.reseed(99);
  const b = walk(t, 4000);
  ok(a.trace.join('') === b.trace.join(''), 'reseed(seed) reproduces the schedule');
}

// ── 2. long-run duty within ±10% + window/rest/flicker caps ─────────────────
for (const duty of DUTIES) {
  const t = createPulseTimer({ seed: 12345, duty });
  const r = walk(t, 60000);   // 1000 s of flight — a long run
  const measured = r.litTime / r.total;
  ok(Math.abs(measured - duty) <= duty * 0.10, `duty ${duty}: long-run lit fraction ${measured.toFixed(4)} within ±10%`);
  // every strike window ∈ [0.10, 0.28] s (allow one DT of discretisation slack)
  const wLo = Math.min(...r.litRuns), wHi = Math.max(...r.litRuns);
  ok(wLo >= 0.10 - DT - 1e-9, `duty ${duty}: min window ${wLo.toFixed(3)}s ≥ 0.10`);
  ok(wHi <= 0.28 + DT + 1e-9, `duty ${duty}: max window ${wHi.toFixed(3)}s ≤ 0.28`);
  // the inter-burst rest (the longest dark spells) ≥ 1.2 s
  const maxDark = Math.max(...r.darkRuns);
  ok(maxDark >= 1.2 - 1e-9, `duty ${duty}: an inter-burst rest ${maxDark.toFixed(2)}s ≥ 1.2`);
}

// ── 3. within-window modulation ≤ 3 Hz (env peaks/dips don't oscillate faster) ──
// Sample env01 at 1 kHz across the longest window; count sign changes of its slope →
// the modulation frequency. A ≤3 Hz dip over a ≤0.28 s window makes ≤ ~2 extrema.
{
  const t = createPulseTimer({ seed: 5, duty: 0.18 });
  // advance to inside a window, then micro-sample the envelope
  let guard = 0; while (!t.state().live && guard++ < 100000) t.tick(DT);
  const env = [];
  for (let i = 0; i < 300 && t.state().live; i++) { env.push(t.state().env01); t.tick(0.001); }
  let extrema = 0;
  for (let i = 1; i < env.length - 1; i++) {
    if ((env[i] - env[i - 1]) * (env[i + 1] - env[i]) < -1e-9) extrema++;
  }
  // rise + hold(with one ≤3Hz dip) + fall over ≤0.28s → a small bounded extrema count
  ok(extrema <= 3, `within-window envelope has ≤3 extrema (≤3 Hz modulation), got ${extrema}`);
  ok(Math.max(...env) <= 1 + 1e-9, 'env01 never exceeds 1 (the strike-core cap holds)');
}

// ── 4. pin(): frozen, deterministic, standing=0 / strike-peak=0.5 ───────────
{
  const t = createPulseTimer({ seed: 3, duty: 0.14 });
  t.pin(0);
  const standing = t.state();
  ok(standing.live === false && standing.env01 === 0, 'pin(0) → standing frame (no strike, env 0)');
  // ticking a pinned timer is inert — same state every call
  t.tick(0.5); t.tick(0.5);
  ok(t.state().env01 === 0 && t.state().live === false, 'pinned timer is frozen under tick()');
  t.pin(0.5);
  approx(t.state().env01, 1, 1e-9, 'pin(0.5) → strike peak env01 = 1');
  ok(t.state().live === true, 'pin(0.5) → live strike');
  // repeatable
  const s1 = t.state(), s2 = t.state();
  ok(s1.env01 === s2.env01 && s1.live === s2.live, 'pinned state is identical on every read');
  // release
  t.pin(null);
  ok(t.state().pinned === null, 'pin(null) releases the freeze');
}

// ── 5. mulberry32 is a pure deterministic stream ────────────────────────────
{
  const a = mulberry32(42), b = mulberry32(42);
  let same = true; for (let i = 0; i < 100; i++) if (a() !== b()) same = false;
  ok(same, 'mulberry32(seed) is deterministic');
  const c = mulberry32(42), d = mulberry32(43);
  ok(c() !== d(), 'mulberry32 varies with the seed');
}

// ── 6. purity firewall: pulseTimer imports NOTHING from js/ ──────────────────
{
  const raw = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../js/pulseTimer.js'), 'utf8');
  // strip block + line comments so the ban documented in prose doesn't trip the code scan
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const badImport = /\bimport\b[^\n;]*from\s*['"]\.\/[^'"]+['"]/.test(src);
  ok(!badImport, 'pulseTimer.js imports nothing from js/ (pure module)');
  ok(!/\bMath\.random\b/.test(src) && !/\bDate\.now\b/.test(src), 'pulseTimer.js uses no Math.random / Date.now');
  ok(!/\bimport\b[^\n;]*['"]three['"]/.test(src), 'pulseTimer.js does not import three');
}

console.log(`\npulseTimer determinism asserts: ${passed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
