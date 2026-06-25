// Parametric wing-PLANFORM generator — the wing silhouette as dial-able DATA.
//
// The shipped membrane wings read by a per-form `spec` ({ tips, lead, scallop, flame,
// arc }) sourced from the discrete, hand-placed `WING_FORMS[0..3]` in dragonParts.js
// (or a dragon's own `wingForms[]`). Hand-placing finger-tip coordinates is exactly
// the "can't slide a knob" wall. This module emits the SAME spec object, but from
// high-level knobs (span / fingerCount / fingerSplay / chordTaper), so a new dragon
// gets a genuinely different planform without typing coordinates.
//
// THREE-free (it only emits plain data the wing builders already consume), so it can
// be imported by dragonParts.js#wingSpecFor without a cycle. It does NOT import
// WING_FORMS (that would create a cycle); WING_FORM_KNOBS carries its own copy of the
// canon, locked to the originals by tests/parametric.mjs.
//
// AUTHORING:
//   • explicit planform — pass `tips` (+ `lead`); span/chordTaper/fingerSplay then
//     SCALE it (all default 1 → passthrough, byte-identical).
//   • generated planform — omit `tips`, set `fingerCount` (+ optional span/chordTaper/
//     fingerSplay/sweep); a clean dragon-wing fan template is generated and scaled.

// A generic dragon-wing finger fan for N fingers (outer→inner), used when a dragon
// does NOT supply explicit tips. Span ~5 units, leading tip up, trailing fingers
// marching inboard + down — the classic membrane read, ready to be scaled by knobs.
function templateFan(n) {
  const N = Math.max(2, Math.round(n));
  const tips = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const x = Math.round((5.4 - t * 4.2) * 100) / 100; // 5.40 → 1.20
    const y = Math.round((0.42 - t * 1.6) * 100) / 100; // 0.42 → -1.18
    tips.push([x, y]);
  }
  return tips;
}

// Default knob sets that reproduce WING_FORMS[0..3] EXACTLY (passthrough: span/
// chordTaper/fingerSplay all 1). tests/parametric.mjs asserts
// makeWingForm(WING_FORM_KNOBS[f]) deep-equals WING_FORMS[f], so this stays the
// canon-as-data and can't drift from dragonParts.js.
export const WING_FORM_KNOBS = [
  { tips: [[3.95, 0.26], [3.05, -0.36], [1.95, -0.66]],
    lead: [2.55, 0.44], scallop: 0.16, flame: false,
    arc: { bow: 0.5, hump: 0.0, humpAt: 0.6, hook: 0.12 } },
  { tips: [[4.95, 0.32], [3.95, -0.44], [2.65, -0.90], [1.45, -0.96]],
    lead: [3.35, 0.56], scallop: 0.34, flame: false,
    arc: { bow: 0.5, hump: 0.7, humpAt: 0.55, hook: 0.22 } },
  { tips: [[5.35, 0.42], [4.50, -0.52], [3.10, -1.06], [1.70, -1.18]],
    lead: [3.75, 0.66], scallop: 0.56, flame: false,
    arc: { bow: 0.5, hump: 1.2, humpAt: 0.58, hook: 0.7 } },
  { tips: [[5.70, 0.52], [4.85, -0.46], [3.55, -1.02], [2.15, -1.22], [1.05, -1.04]],
    lead: [4.05, 0.74], scallop: 0.50, flame: true,
    arc: { bow: 0.6, hump: 1.7, humpAt: 0.60, hook: 1.2 } },
];

// Build a wing spec ({ tips, lead, scallop, flame, arc[, rootChord] }) from knobs.
// Knobs (all optional):
//   tips         explicit planform (outer→inner [xSpan, yChord]); else a fan template
//   fingerCount  finger count for the generated template (default 4)
//   span         × multiply every tip x (span multiplier, default 1)
//   chordTaper   × multiply trailing-edge depth (negative tip y, default 1)
//   fingerSplay  spread the inner tips' x away from the far tip (default 1)
//   sweep        leading-edge rake → derives `lead` when no explicit lead is given
//   scallop, flame, arc, rootChord — passed through (with sensible defaults)
export function makeWingForm(knobs = {}) {
  const k = knobs;
  let tips = k.tips ? k.tips.map((t) => t.slice()) : templateFan(k.fingerCount ?? 4);
  const span = k.span ?? 1, chord = k.chordTaper ?? 1, splay = k.fingerSplay ?? 1;
  if (span !== 1 || chord !== 1 || splay !== 1) {
    const x0 = tips[0][0];
    tips = tips.map((t, i) => {
      let x = t[0], y = t[1];
      if (splay !== 1 && i > 0) x = x0 + (x - x0) * splay; // fan spread about the far tip
      x *= span;
      if (y < 0) y *= chord;                                // deepen/shallow the trailing web
      return [x, y];
    });
  }
  const lead = k.lead ? k.lead.slice()
    : [Math.round(tips[0][0] * 0.7 * 100) / 100, k.sweep != null ? k.sweep : 0.6];
  const spec = {
    tips, lead,
    scallop: k.scallop ?? 0.4,
    flame: k.flame ?? false,
    arc: k.arc ? { ...k.arc } : { bow: 0.5, hump: 1.0, humpAt: 0.58, hook: 0.5 },
  };
  if (k.rootChord != null) spec.rootChord = k.rootChord;
  return spec;
}
