// Composition engine — song STRUCTURE over the 8-bar loop. Pure + dependency-
// free (node-testable, like tracks.js/harmony.js). A station opts in with a
// `form` (an ordered list of section keys) and `sections` (diffs over the base
// 8 bars); the engine walks the form one section per loop-wrap, and compileTrack
// (in sfx.js) applies the resolved section — muting layers, scaling energy,
// varying bar count — so the arrangement breathes: intro → build → drop →
// breakdown instead of the same bars forever. Absent `form` → the legacy single
// infinite section, byte-identical.
//
// A section diff is a plain object; recognised fields (all optional):
//   bars:   int (default 8)   — section length in bars (variable-length form)
//   mute:   [layerKey, ...]   — layers silenced this section (drop the bassline
//                               in a breakdown, drop leads in a build, …)
//   energy: 0..1              — section intensity; scales note velocity + drum
//                               density, and (via sfx.js) can feed the mix
//   riser:  bool              — schedule a noise riser into the last bar (build)
//   crash:  bool              — accent the downbeat (drop / phrase top)
// The base section (key whose diff is {} — conventionally 'A') = today's data.

const KNOWN_FIELDS = new Set(['bars', 'mute', 'energy', 'riser', 'crash', 'melVariant']);

// Resolve a station's form into the ordered list of {key, diff} it cycles
// through. Returns null when the station has no form (legacy path).
export function resolveForm(tr) {
  if (!tr || !Array.isArray(tr.form) || !tr.form.length || !tr.sections) return null;
  return tr.form.map((key) => ({ key, diff: tr.sections[key] || {} }));
}

// Normalize a raw section diff into the descriptor compileTrack consumes.
function normalizeSection(key, diff) {
  return {
    key,
    bars: clampBars(diff.bars),
    mute: new Set(diff.mute || []),
    energy: diff.energy == null ? 1 : Math.max(0, Math.min(1, diff.energy)),
    riser: !!diff.riser,
    crash: !!diff.crash,
    melVariant: diff.melVariant | 0,
  };
}

const BASE_SECTION = { key: 'A', bars: 8, mute: new Set(), energy: 1, riser: false, crash: false, melVariant: 0 };

// The section playing on loop-wrap number `formPass` (0-based, wraps around the
// form). Returns a normalized section descriptor. `null` form → the implicit
// base section so callers have one code path. This is the DETERMINISTIC path
// (offline render / calibration): it follows the authored form exactly.
export function sectionAt(tr, formPass) {
  const form = resolveForm(tr);
  if (!form) return BASE_SECTION;
  const { key, diff } = form[((formPass % form.length) + form.length) % form.length];
  return normalizeSection(key, diff);
}

// Highest / lowest-energy section authored for a station (for the vote overrides
// below). null when the station has no form.
function extremeSection(tr, pick) {
  const form = resolveForm(tr);
  if (!form) return null;
  let best = null, bestE = null;
  for (const { key, diff } of form) {
    const e = diff.energy == null ? 1 : diff.energy;
    if (bestE == null || pick(e, bestE)) { bestE = e; best = normalizeSection(key, diff); }
  }
  return best;
}

// LIVE section choice: the form is the script, but a gameplay "intensity vote"
// (0..1 — Dragon Surge / hot combo push it high, idle coasting pulls it low)
// can override the scheduled section AT the wrap so the music responds to the
// player. `vote == null` (offline/deterministic) → the authored form, untouched.
// The decision is made at a section boundary and governs the whole next
// section, so it always lands one full bar-phrase ahead — never a mid-phrase lurch.
export function chooseSection(tr, formPass, vote = null) {
  const base = sectionAt(tr, formPass);
  if (vote == null || !resolveForm(tr)) return base;
  // Hot (Dragon Surge / high combo): never sink into a breakdown mid-hype —
  // hold the biggest section the song has.
  if (vote >= 0.8 && base.energy < 0.7) {
    // `>=` breaks energy ties toward the LATER section — the song's climax
    // (the drop) rather than an early full statement.
    const hot = extremeSection(tr, (e, b) => e >= b);
    if (hot && hot.energy > base.energy) return hot;
  }
  // Cold (idle / just recovered): if the script wants a full drop but the player
  // is coasting, ease to the calmest section so the music breathes with them.
  if (vote <= 0.25 && base.energy >= 0.9) {
    const cool = extremeSection(tr, (e, b) => e < b);
    if (cool && cool.energy < base.energy) return cool;
  }
  return base;
}

function clampBars(b) {
  const n = b == null ? 8 : b | 0;
  // 8-bar sections play the authored bars verbatim; shorter sections take the
  // FIRST `bars` bars (a 4-bar breakdown = the first half). >8 would desync the
  // per-bar arp/pad/chord indexing, so cap at 8.
  return Math.max(1, Math.min(8, n));
}

// Total loop count of one full form pass, for tests / UI ("this station is a
// 48-bar song"). 0 when there's no form.
export function formBarLength(tr) {
  const form = resolveForm(tr);
  if (!form) return 0;
  return form.reduce((s, { diff }) => s + clampBars(diff.bars), 0);
}

// Melodic development: a section can restate the melody TRANSFORMED instead of
// verbatim (`melVariant`), so the writing itself evolves across the form:
//   0 — the authored melody (default)
//   1 — LIFT: the whole line an octave up (the drop/climax restatement)
//   2 — FRAGMENT: the first two bars (the motif) looped — the sparse,
//       hypnotic statement for intros/builds
// Pure data transform on [freq, eighths] rows; bar-aligned inputs (the track
// gate guarantees every bar sums to exactly 8 eighths) keep fragments exact.
export function melodyVariant(seq, variant) {
  if (variant === 1) return seq.map(([f, d]) => [f * 2, d]);
  if (variant === 2) {
    const motif = [];
    let sum = 0;
    for (const [f, d] of seq) {
      if (sum >= 16) break;      // first 2 bars = 16 eighths
      motif.push([f, d]);
      sum += d;
    }
    const out = [];
    for (let i = 0; i < 4; i++) out.push(...motif);
    return out;
  }
  return seq;
}

// Validate a station's form/sections (used by the headless track gate):
// returns [] when clean, else a list of human-readable problems.
export function validateForm(tr) {
  const problems = [];
  if (!tr.form && !tr.sections) return problems; // legacy, nothing to check
  if (tr.form && !tr.sections) problems.push(`${tr.id}: form without sections`);
  if (tr.sections && !tr.form) problems.push(`${tr.id}: sections without form`);
  if (Array.isArray(tr.form)) {
    for (const key of tr.form) {
      if (!tr.sections || !(key in tr.sections)) problems.push(`${tr.id}: form references missing section '${key}'`);
    }
    if (formBarLength(tr) < 8) problems.push(`${tr.id}: form is shorter than one bar-phrase`);
  }
  if (tr.sections) {
    for (const [key, diff] of Object.entries(tr.sections)) {
      if (diff == null || typeof diff !== 'object') { problems.push(`${tr.id}: section '${key}' is not an object`); continue; }
      for (const f of Object.keys(diff)) {
        if (!KNOWN_FIELDS.has(f)) problems.push(`${tr.id}: section '${key}' has unknown field '${f}'`);
      }
      if (diff.bars != null && (diff.bars < 1 || diff.bars > 8)) problems.push(`${tr.id}: section '${key}' bars ${diff.bars} out of 1..8`);
      if (diff.energy != null && (diff.energy < 0 || diff.energy > 1)) problems.push(`${tr.id}: section '${key}' energy ${diff.energy} out of 0..1`);
      if (diff.melVariant != null && ![0, 1, 2].includes(diff.melVariant)) problems.push(`${tr.id}: section '${key}' melVariant ${diff.melVariant} unknown (0..2)`);
    }
    // Energy should MOVE across the form — a form where every section is full
    // energy is just a long loop (the "no dynamics" smell).
    const form = resolveForm(tr);
    if (form && form.length >= 2) {
      const energies = form.map(({ diff }) => (diff.energy == null ? 1 : diff.energy));
      if (Math.max(...energies) - Math.min(...energies) < 0.15) {
        problems.push(`${tr.id}: form has no dynamic range (all sections ~same energy) — add a breakdown/build`);
      }
    }
  }
  return problems;
}
