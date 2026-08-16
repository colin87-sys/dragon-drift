// FTUE funnel instrumentation — a thin, backend-free analytics sink.
//
// Subscribes to the existing event bus (events.js) and records the first-session
// onboarding funnel as an ordered, timestamped log in localStorage. No network:
// the log is inspected via the dev overlay (?debug=ftue) or window.__ftue in the
// console. It exists to answer the single highest-signal pre-launch question —
// "did the first run lead to a second run?" — plus the moments that lead there
// (first input, first ring, first surge, first roll).
//
// Most funnel events are install-lifetime one-shots (recorded the first time they
// ever happen); run1_end / run2_start are keyed off saveData.stats.runs.

import { on } from './events.js';
import { saveData } from './save.js';

const KEY = 'dragonDriftFunnel';
const MAX_LOG = 500;
const t0 = performance.now();
const now = () => Math.round(performance.now() - t0); // ms since app open

let store = { fired: [], log: [] };
try {
  const s = JSON.parse(localStorage.getItem(KEY));
  if (s && Array.isArray(s.fired) && Array.isArray(s.log)) store = s;
} catch { /* private mode / corrupt — start fresh */ }
const firedSet = new Set(store.fired);

let overlayEl = null;

function flush() {
  if (store.log.length > MAX_LOG) store.log = store.log.slice(-MAX_LOG);
  store.fired = [...firedSet];
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* full/private */ }
}

function record(name, data) {
  store.log.push({ t: now(), name, runs: saveData.stats.runs, ...(data || {}) });
  flush();
  renderOverlay();
}

// Record only the first time this event ever fires for the install.
function once(name, data) {
  if (firedSet.has(name)) return;
  firedSet.add(name);
  record(name, data);
}

// run1 → run2 is the leading indicator the FTUE works: a run2_start that lands
// after a run1_end. Returns null until both are known.
export function funnelSummary() {
  const ran1 = store.log.some((e) => e.name === 'run1_end');
  const ran2 = store.log.some((e) => e.name === 'run2_start');
  const tFirstSurge = (store.log.find((e) => e.name === 'first_surge') || {}).t;
  const tFirstInput = (store.log.find((e) => e.name === 'first_input') || {}).t;
  return {
    run1Ended: ran1,
    run2Started: ran2,
    run1ToRun2: ran1 ? ran2 : null,
    timeToFirstInputMs: tFirstInput ?? null,
    timeToFirstSurgeMs: tFirstSurge ?? null,
  };
}

export function initAnalytics() {
  record('app_open');

  on('firstInput', () => once('first_input', { ms: now() }));
  on('ring', () => once('first_ring'));
  on('firstBoost', () => once('first_boost'));
  // The chain that lights the surge: surge implies a 5+ ring chain happened.
  on('surge', () => once('first_chain'));
  on('firstSurge', () => once('first_surge', { ms: now() }));
  on('roll', () => once('first_roll'));

  on('runStart', () => {
    // recordBests() bumps stats.runs inside settleRun(), so at the start of a
    // run, runs === number of runs already completed: 0 = run 1, 1 = run 2.
    const completed = saveData.stats.runs;
    if (completed === 0) once('run1_start');
    else if (completed === 1) record('run2_start');
  });

  // settleRun() emits this AFTER recordBests(), so runs is already incremented.
  on('runSettled', (p) => {
    if (p && p.runs === 1) record('run1_end', { score: p.score, dist: p.dist });
  });
  on('restartTapped', () => record('restart_tapped'));

  // System reveals + first opens (WS0 coachmarks emit these).
  on('systemRevealed', (p) => once(`reveal_${(p && p.system) || 'unknown'}`));
  on('systemOpened', (p) => once(`open_${(p && p.system) || 'unknown'}`));

  if (new URLSearchParams(location.search).get('debug') === 'ftue') buildOverlay();

  // Console hook for QA without the overlay.
  window.__ftue = { log: () => store.log, summary: funnelSummary, clear: clearFunnel };
}

export function clearFunnel() {
  store = { fired: [], log: [] };
  firedSet.clear();
  flush();
  renderOverlay();
}

// --- Dev overlay (?debug=ftue) ---------------------------------------------
function buildOverlay() {
  overlayEl = document.createElement('div');
  overlayEl.style.cssText =
    'position:fixed;right:8px;top:8px;z-index:99;font:11px/1.4 monospace;color:#9fe6ff;' +
    'background:rgba(6,12,26,0.82);padding:8px 10px;border-radius:8px;pointer-events:none;' +
    'white-space:pre;max-width:46vw;max-height:60vh;overflow:hidden;text-align:left';
  document.body.appendChild(overlayEl);
  renderOverlay();
}

function renderOverlay() {
  if (!overlayEl) return;
  const s = funnelSummary();
  const r12 = s.run1ToRun2 === null ? '…' : (s.run1ToRun2 ? 'YES' : 'no');
  const tail = store.log.slice(-18)
    .map((e) => `${String(e.t).padStart(6)}ms  ${e.name}${e.score != null ? ` (${e.score})` : ''}`)
    .join('\n');
  overlayEl.textContent =
    `FTUE FUNNEL  run1→run2: ${r12}\n` +
    `first_input: ${s.timeToFirstInputMs ?? '—'}ms   first_surge: ${s.timeToFirstSurgeMs ?? '—'}ms\n` +
    `────────────────────────\n${tail}`;
}
