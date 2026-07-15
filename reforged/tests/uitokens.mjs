// tests/uitokens.mjs — the EMBERLINE entropy lint (UI-PREMIUM-OVERHAUL.md §C).
// Pure static, CI-safe (no browser, no WebGL): reads css/style.css + every js/*.js
// (JS-injected styles — cssText blocks and inline style="…" attrs in template
// strings — are in scope per the 2026-07-14 audit addendum) and enforces:
//
//   (0) the §A.1 EMBERLINE token constitution EXISTS in css/style.css :root
//       (--fs-* type scale, --track-*, --r-s/m/l, --panel-*, --scrim-*,
//        --t-exit/--t-stagger/--ease-in, --hud-scale/--hud-alpha);
//   (a) every `font-size` in MIGRATED files uses the six --fs-* tokens —
//       a SHRINKING ALLOWLIST: files listed in FS_ALLOWLIST are exempt. At
//       Phase 0 the allowlist covers everything (rule dormant), but the
//       machinery is exercised by the built-in self-test below, so removing
//       an entry is all a later phase does to arm it;
//   (b) navy-legacy eviction RATCHET (§A.2): the known navy literals are
//       counted (whitespace-normalized) across css+js and must never GROW
//       past the hardcoded per-literal baseline; Phase 2's exit flips the
//       baseline to zero;
//   (c) `letter-spacing` em-only (or var(--track-*)) in migrated files —
//       same shrinking-allowlist machinery as (a);
//   (d) no transition/animation of layout props (width|height|top|left|right|
//       bottom|margin|padding|box-shadow) on HUD selectors — enforced NOW;
//       pre-existing violations live in HUD_MOTION_EXCEPTIONS with a TODO and
//       are burned down by U8 (§A.4: meters migrate to transform:scaleX()).
//
//   node tests/uitokens.mjs        (auto-discovered by tests/run-all.mjs)
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const check = (label, ok, detail = '') => {
  if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}${detail ? `\n  ${detail}` : ''}`); }
};

// ── sources ──────────────────────────────────────────────────────────────────
const cssFile = 'css/style.css';
const css = readFileSync(join(ROOT, cssFile), 'utf8');
const jsFiles = readdirSync(join(ROOT, 'js')).filter((f) => f.endsWith('.js')).map((f) => `js/${f}`);
const sources = [[cssFile, css], ...jsFiles.map((f) => [f, readFileSync(join(ROOT, f), 'utf8')])];

// ═══ (0) the §A.1 token constitution exists in :root ═════════════════════════
const REQUIRED_TOKENS = [
  '--fs-micro', '--fs-label', '--fs-body', '--fs-title', '--fs-head', '--fs-display',
  '--track-body', '--track-caps', '--track-disp',
  '--r-s', '--r-m', '--r-l',
  '--panel-fill', '--panel-line', '--panel-line-hi', '--panel-inner', '--panel-shadow',
  '--scrim-ink', '--scrim-side', '--scrim-foot',
  '--t-exit', '--t-stagger', '--ease-in',
  '--hud-scale', '--hud-alpha',
];
const missing = REQUIRED_TOKENS.filter((t) => !new RegExp(`${t}\\s*:`).test(css));
check(`EMBERLINE :root tokens declared in ${cssFile} (§A.1)`, missing.length === 0,
  missing.length ? `missing: ${missing.join(', ')}` : '');

// ═══ shared allowlist machinery for rules (a) + (c) ══════════════════════════
// A file is EXEMPT while it appears here (prefix match, so 'js/' covers all JS).
// Each migration phase DELETES entries; deleting one arms the rule for that file.
const FS_ALLOWLIST = [cssFile, 'js/'];      // Phase 0: everything exempt (dormant)
const TRACK_ALLOWLIST = [cssFile, 'js/'];   // Phase 0: everything exempt (dormant)
// Selector-level sanction (§A.1): the wordmark family keeps its bespoke sizes on
// migrated screens. Matched against the ~2 lines of context around a violation.
const WORDMARK_EXCEPTION = /splash-title|hero-wordmark|load-hint h1/;

const exempt = (file, list) => list.some((p) => file === p || file.startsWith(p));
const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
const contextOf = (text, idx) => {
  const from = text.lastIndexOf('\n', Math.max(0, text.lastIndexOf('\n', idx) - 1)) + 1;
  return text.slice(from, text.indexOf('\n', idx) + 1 || text.length);
};

// Rule (a): every font-size value must be one of the six --fs-* tokens.
function fontSizeViolations(file, text) {
  const out = [];
  const re = /font-size\s*:\s*([^;}\n"'`\\]+)/g;
  for (let m; (m = re.exec(text));) {
    const v = m[1].trim();
    if (/^var\(--fs-(micro|label|body|title|head|display)\)$/.test(v)) continue;
    if (/^(inherit|unset|100%|1em)$/.test(v)) continue;
    if (WORDMARK_EXCEPTION.test(contextOf(text, m.index))) continue;
    out.push(`${file}:${lineOf(text, m.index)} font-size: ${v}`);
  }
  return out;
}

// Rule (c): letter-spacing must be em-based (or a --track-* token / normal).
function trackingViolations(file, text) {
  const out = [];
  const re = /letter-spacing\s*:\s*([^;}\n"'`\\]+)/g;
  for (let m; (m = re.exec(text));) {
    const v = m[1].trim();
    if (/^var\(--track-(body|caps|disp)\)$/.test(v)) continue;
    if (/^(normal|inherit|unset|-?[\d.]+em)$/.test(v)) continue;
    out.push(`${file}:${lineOf(text, m.index)} letter-spacing: ${v}`);
  }
  return out;
}

for (const [file, text] of sources) {
  if (!exempt(file, FS_ALLOWLIST)) {
    const v = fontSizeViolations(file, text);
    check(`(a) ${file}: font-size uses --fs-* tokens only`, v.length === 0, v.slice(0, 12).join('\n  '));
  }
  if (!exempt(file, TRACK_ALLOWLIST)) {
    const v = trackingViolations(file, text);
    check(`(c) ${file}: letter-spacing em/token only`, v.length === 0, v.slice(0, 12).join('\n  '));
  }
}

// Self-test: the allowlist machinery is REAL at Phase 0 even though every file
// is exempt — prove the checkers catch/pass what they must, so arming a file
// later can't silently no-op.
{
  const bad = `.migrated { font-size: 13px; letter-spacing: 1.5px; }`;
  const good = `.migrated { font-size: var(--fs-label); letter-spacing: var(--track-caps); }
    .other { letter-spacing: 0.12em; } .splash-title { font-size: clamp(34px, 9vw, 60px); }`;
  check('(a) self-test: px font-size on a migrated file is caught', fontSizeViolations('x.css', bad).length === 1);
  check('(a) self-test: token font-size + wordmark clamp pass', fontSizeViolations('x.css', good).length === 0);
  check('(c) self-test: px letter-spacing on a migrated file is caught', trackingViolations('x.css', bad).length === 1);
  check('(c) self-test: em/token letter-spacing passes', trackingViolations('x.css', good).length === 0);
}

// ═══ (b) navy-legacy eviction ratchet (§A.2 squatter table + audit finds) ═════
// Whitespace-normalized exact literals → the count on 2026-07-14 (Phase 0).
// The counts may only SHRINK. Phase 2's exit criterion sets every value to 0.
const NAVY_BASELINE = {
  '#1c2e5e': 1,          // page background (style.css:48)
  '#274a86': 1,          // load screen radial
  '#101a36': 2,          // load screen radial + music disc
  '#3a5a9a': 1,          // music disc
  '#8a5aff': 1,          // .btn-daily purple (evicted → gold)
  '#6a3ae0': 1,          // .btn-daily purple
  '#c08aff': 1,          // .btn-daily purple
  'rgba(10,20,42': 3,    // .load-bar, .hint pill, .race-bar
  'rgba(8,18,38': 4,     // .bar chrome, .radio-name, …
  'rgba(20,40,80': 1,    // .mute-btn
  'rgba(60,120,200': 1,  // .mute-btn:hover
  'rgba(12,20,44': 1,    // .revive-offer
  'rgba(18,30,58': 1,    // .form-arrow
  'rgba(40,62,104': 1,   // .form-arrow:hover
  'rgba(20,48,86': 1,    // .nextup-card
  'rgba(30,50,95': 1,    // celebrate overlay scrim
  'rgba(28,44,86': 1,    // celebrate card
  'rgba(40,70,120': 1,   // .hero-gear:hover
  'rgba(10,20,40': 2,    // .inspect-btn, …
  'rgba(40,70,130': 1,   // .inspect-btn:hover
  'rgba(26,36,66': 1,    // inspect modal
  'rgba(11,16,32': 1,    // inspect modal
  'rgba(8,14,30': 6,     // inspect chrome / rothints / hero chips
  'rgba(10,18,38': 1,    // .inspect-nav
  'rgba(18,28,56': 2,    // .inspect-nav:hover
  'rgba(10,16,34': 1,    // .screen base radial (cool ink → scrim recipe in U4)
  'rgba(5,9,22': 2,      // .screen base radial
  'rgba(6,10,24': 2,     // celebrate scrim ink
  'rgba(6,10,22': 1,     // inspect overlay ink
  'rgba(2,4,10': 1,      // inspect overlay ink
  'rgba(12,19,40': 1,    // celebrate card
};
{
  const all = sources.map(([, t]) => t.replace(/\s+/g, '')).join('\n');
  const over = [], counts = {};
  let total = 0;
  for (const [lit, max] of Object.entries(NAVY_BASELINE)) {
    let c = 0, i = 0;
    while ((i = all.indexOf(lit, i)) >= 0) { c++; i += lit.length; }
    counts[lit] = c; total += c;
    if (c > max) over.push(`${lit}: ${c} > baseline ${max}`);
  }
  check('(b) navy-literal ratchet: no squatter count grew (§A.2)', over.length === 0, over.join('\n  '));
  console.log(`  (b) navy-literal census: ${total} occurrences across ${Object.keys(NAVY_BASELINE).length} literals (baseline total 46; Phase 2 exit = 0)`);
}

// ═══ (d) no layout-prop transition/animation on HUD selectors — LIVE NOW ═════
// HUD selector families (grepped from style.css): hud-*, boss-*, surge-*,
// lock*, race-*, lens2*, flow-crest, reticle, the vitals .bar/.bar-fill,
// hearts. Layout/paint props next to the 60fps canvas are the §A.4 kill list.
const HUD_RE = /(^|[\s,>+~(:])\.(hud-[\w-]*|boss[\w-]*|surge[\w-]*|lock[\w-]*|race-[\w-]*|lens2[\w-]*|flow-crest[\w-]*|reticle[\w-]*|bar(-fill)?|hearts?)\b/;
const LAYOUT_PROP = /(^|[\s;,])(max-|min-)?(width|height|top|left|right|bottom|margin[\w-]*|padding[\w-]*|box-shadow)\s*[\s:,]/;

// Pre-existing violations, documented — NOT a license for new ones.
// TODO(U8/H1): migrate these meter fills to transform:scaleX() (§A.4) and the
// race-bar to the relevance system, then delete each entry.
const HUD_MOTION_EXCEPTIONS = [
  '.bar-fill | transition: width 0.12s linear',   // vitals meter fill (style.css:189)
  '.race-fill | transition: width 0.3s',          // challenge race fill (style.css:1478)
  '.surge-gems i | transition: background 0.15s, box-shadow 0.15s', // gem pip glow (style.css:570)
];

// Minimal CSS walker: comments stripped, brace-depth stack; collects flat rules
// (selector → body, @media-nested included) and @keyframes bodies by name.
function extractRules(text) {
  const src = text.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const rules = [], keyframes = {}, stack = [];
  let buf = '';
  for (const ch of src) {
    if (ch === '{') { stack.push(buf.trim()); buf = ''; }
    else if (ch === '}') {
      const sel = stack.pop();
      const body = buf.trim(); buf = '';
      if (sel === undefined || !body) continue;
      const kf = stack.concat(sel).find((s) => s && s.startsWith('@keyframes'));
      if (kf) { const name = kf.split(/\s+/)[1]; keyframes[name] = `${keyframes[name] || ''} ${sel.startsWith('@') ? '' : body}`; }
      else if (!sel.startsWith('@')) rules.push({ selector: sel, body });
    } else buf += ch;
  }
  return { rules, keyframes };
}

function hudMotionViolations(text) {
  const { rules, keyframes } = extractRules(text);
  const out = [];
  for (const { selector, body } of rules) {
    if (!HUD_RE.test(selector)) continue;
    for (const m of body.matchAll(/(?:^|;)\s*transition\s*:\s*([^;]+)/g)) {
      if (LAYOUT_PROP.test(` ${m[1]} `)) out.push(`${selector} | transition: ${m[1].trim()}`);
    }
    for (const m of body.matchAll(/(?:^|;)\s*animation(?:-name)?\s*:\s*([^;]+)/g)) {
      for (const name of m[1].split(',').map((s) => s.trim().split(/\s+/).find((w) => keyframes[w])).filter(Boolean)) {
        if (LAYOUT_PROP.test(` ${keyframes[name]} `)) out.push(`${selector} | animation ${name} keyframes layout props`);
      }
    }
  }
  return out;
}

{
  const found = hudMotionViolations(css);
  const fresh = found.filter((v) => !HUD_MOTION_EXCEPTIONS.includes(v));
  const stale = HUD_MOTION_EXCEPTIONS.filter((e) => !found.includes(e));
  check('(d) no NEW layout-prop transition/animation on HUD selectors', fresh.length === 0, fresh.join('\n  '));
  check('(d) exception list is not stale (fixed entries must be deleted)', stale.length === 0, stale.join('\n  '));
  // Self-test: the walker + matcher catch a planted violation.
  const planted = hudMotionViolations('.boss-bar-x { transition: width 0.2s; } @keyframes grow { to { height: 9px; } } .hud-thing { animation: grow 1s; }');
  check('(d) self-test: planted HUD width transition + height keyframes caught', planted.length === 2);
}

console.log(`\nuitokens: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
