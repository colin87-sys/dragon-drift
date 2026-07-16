// tools/propclearance.mjs — LANE-CLEARANCE AUDIT for environment props (PR-1).
// The owner reported Frozen props visually invading the flight lane / obstructing
// gates (→ misjudged swerves into the fatal ±13 wall, incl. during bosses). Props
// are render-only (no collider), but a prop whose visual footprint crosses into the
// ±13 lane or over the ±16 gate veil reads as "solid" and gets you killed by the
// wall you swerve into. This tool measures each prop's true reach and asserts it
// stays outside the lane, so the fairness fix is provable and can't regress.
//
//   node tools/propclearance.mjs [--ci]
// inner edge = |x|min − ρ·r·sMax − lean(h·yMax·|tilt|). Props whose world top ≤
// laneMinY can't obstruct the flight band and are exempt. Floor = laneHalfWidth+1.5.
import { register } from 'node:module';
register('./three-resolver.mjs', import.meta.url);   // resolve the bare 'three' import (envcount pattern)
// Minimal DOM shim so config.js/util.js import cleanly headless (no renderer).
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ({ createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, set fillStyle(v) {} }) }) };
if (!globalThis.localStorage) { const s = new Map(); globalThis.localStorage = { getItem: (k) => (s.has(k) ? s.get(k) : null), setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k), clear: () => s.clear() }; }
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const DIR = dirname(fileURLToPath(import.meta.url));
const ci = process.argv.includes('--ci');
const { propClearanceData } = await import('../js/environment.js');

// lane bounds from config.js (string-read to avoid importing the runtime).
const cfg = readFileSync(join(DIR, '..', 'js', 'config.js'), 'utf8');
const LANE = Number((cfg.match(/laneHalfWidth:\s*([\d.]+)/) || [])[1] || 13);
const LANE_MIN_Y = Number((cfg.match(/laneMinY:\s*([\d.]+)/) || [])[1] || 2.5);
const LANE_MAX_Y = Number((cfg.match(/laneMaxY:\s*([\d.]+)/) || [])[1] || 22);
const FLOOR = LANE + 1.5;          // fairness floor: clear of the fatal wall
const GATE_VEIL = 16;              // the Phase Gate veil half-span

// PR-1 SCOPE: the Frozen biome (2) is the owner's acute complaint and is enforced
// (CI-fail). Other biomes have pre-existing stragglers (shipped) — Fable's plan says
// REPORT them as a follow-up, don't fix them in this PR. So they warn, not fail.
const SCOPE_BIOME = [2, 3, 4];   // Frozen (2) + Caldera (3) + Lumen Mire (4, the overhaul biome) CI-enforced
const data = propClearanceData();
let fails = 0, strays = 0;
const rows = [];
for (const a of data) {
  if (!a.biomes.length) continue;   // parked/legacy archetype (not spawned)
  let innerMin = Infinity, worstTop = 0, overheadBad = false;
  // Authored-orientation props (paired hero = sungate) always turn their small
  // gap-facing side (xMax) toward the lane, NOT the full random-rotY ρ. OVERHEAD roofs
  // (drape) measure lane reach from the sub-unitY trunk band (rhoLane) only.
  const facing = a.gate ? a.apertureHalf : a.paired ? a.xMax : (a.overhead ? a.rhoLane : a.rho);
  for (const s of a.samples) {
    const top = s.h * a.yMax;
    // For an overhead roof, the geometry that can invade the flight band is the trunk,
    // whose lateral lean matters only up to where it exits the flyable ceiling (laneMaxY).
    const leanTop = a.overhead ? Math.min(a.overhead.unitY * s.h, LANE_MAX_Y) : top;
    const lean = leanTop * Math.abs(s.tilt || 0);
    // A centered fly-through GATE straddles x0: its inner edge IS the aperture half-width
    // (apertureHalf·r), not |placeX|−reach. Every other prop uses the offset model.
    const inner = a.gate ? (a.apertureHalf * s.r * a.sMax - lean)
                         : Math.abs(s.x) - facing * s.r * a.sMax - lean;
    if (inner < innerMin) innerMin = inner;
    worstTop = Math.max(worstTop, top);
    // Overhead crown must sit at world y ≥ minWorldY (above laneMaxY + camera) at every draw.
    if (a.overhead && a.overhead.unitY * s.h < a.overhead.minWorldY) overheadBad = true;
  }
  // Overhead roofs are exempt from the "top ≤ laneMinY" rule (their crown is far above the
  // band by design); their lane safety is the rhoLane inner-edge + the crown-height assert.
  const exempt = !a.overhead && worstTop <= LANE_MIN_Y;   // too low to reach the flight band
  const inScope = a.biomes.some((b) => SCOPE_BIOME.includes(b));
  const bad = (!exempt && innerMin < FLOOR) || overheadBad;
  if (bad && inScope) fails++;
  if (bad && !inScope) strays++;
  rows.push({ name: a.name, biomes: a.biomes.join(','), rho: facing.toFixed(3), inner: innerMin.toFixed(1), top: worstTop.toFixed(1), exempt, bad, inScope, overGate: !exempt && !a.overhead && innerMin < GATE_VEIL, overheadBad });
}

rows.sort((x, y) => Number(x.inner) - Number(y.inner));
console.log(`Lane-clearance audit (laneHalfWidth ${LANE}, fairness floor ${FLOOR}, gate veil ±${GATE_VEIL}). Enforced biomes: ${SCOPE_BIOME.join(',')} (Frozen + Caldera + Mire).\n`);
console.log('  prop            biomes   facingR  innerEdge  top    note');
for (const r of rows) {
  const note = r.overheadBad && r.inScope ? '\x1b[31mFAIL — overhead crown below minWorldY\x1b[0m'
    : r.exempt ? 'exempt (below lane)'
    : r.bad && r.inScope ? '\x1b[31mFAIL — invades lane\x1b[0m'
    : r.bad ? '\x1b[33mstray (other biome — follow-up)\x1b[0m'
    : r.overGate ? '\x1b[33mwarn — within gate veil\x1b[0m'
    : (r.overheadBad ? '\x1b[33mstray overhead (other biome)\x1b[0m' : 'ok');
  console.log(`  ${r.name.padEnd(15)} [${r.biomes}]`.padEnd(28) + `${r.rho.padStart(6)}  ${r.inner.padStart(8)}   ${r.top.padStart(5)}  ${note}`);
}
console.log('');
if (strays) console.log(`\x1b[33mnote: ${strays} pre-existing straggler(s) in other biomes invade the lane — scheduled follow-up (not this PR).\x1b[0m`);
if (fails) { console.log(`\x1b[31mpropclearance: ${fails} enforced prop(s) invade the ±${LANE} flight lane\x1b[0m`); if (ci) process.exit(1); }
else console.log(`\x1b[32mpropclearance: all enforced props (Frozen + Caldera + Mire) clear the flight lane (inner edge ≥ ${FLOOR})\x1b[0m`);
