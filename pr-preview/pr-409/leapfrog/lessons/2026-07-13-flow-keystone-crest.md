# 2026-07-13 — The FLOW "Keystone Crest": a HUD meter that is a form with a story, not a gauge

**Why.** The Sky Canyon flow run had momentum (the co-scaled slipstream) but no PERSISTENT
readout — only a transient milestone popup — so the owner felt it "just feels like a normal run".
The ask was specific: a `FLOW ×N.N` multiplier meter that is **mobile-visible, uncluttered, premium,
stylish, on-brand — NOT a tacky simple meter**. A high-effort Fable HUD-design pass produced "The
Keystone Crest".

**Did.** A **miniature Windvault** in the centre-bottom column: an SVG forged-glass arch whose cyan
light climbs BOTH legs as the carve chain builds, meets at a **keystone that ignites at the cap
(×3.0)**, with the ×N.N suspended in the aperture. It reuses the game's two proven premium
precedents verbatim — the stamina-arc SVG technique and the Skyforged marker language.

**Reusable patterns banked.**
- **Premium HUD = a FORM WITH A STORY, not a gauge.** The meter is the flow run's OWN icon (a mini
  Windvault), on the exact 3-stop cyan ramp (`#0c63c8 → #3fc8ff → #bfeeff`) and the same
  light-climbs-the-arch motion the player flies through in-world. Every state is a narrative beat:
  build → crown (keystone ignition) → shatter. **This is why it doesn't read tacky** — a flat progress
  bar has no third act, and (the owner's own rejected Sky Gate lesson) an assembly of generic parts
  reads cheap where ONE designed form with weight + an emissive gradient + a material story reads
  premium. The repo even had a utilitarian `.race-bar` to clone — refusing it was the point.
- **Reuse the proven SVG technique, don't invent.** `pathLength="100"` + `stroke-dashoffset` (CSS-
  transitionable, compositor-cheap), `vector-effect: non-scaling-stroke` (constant forged thickness at
  any responsive width), separate leg paths with a REAL gap at the apex (no dash-skip math to merge/
  drop — the stamina-arc "3 cells, real gaps" lesson). **One DOM write per chain EVENT, zero per-frame
  JS** — all animation is CSS transitions/keyframes on transform/opacity/dashoffset.
- **Mobile placement = the centre-bottom "minimal vitals" lane.** Above the surge gems, below the
  stamina arc: **near the gaze** (at flow-run speed the player can't afford a saccade to a corner),
  **thumb-safe** (touch-steering thumbs live in the bottom CORNERS, centre is open — which is why
  surge-min already lives there), and genuinely **unused during a flow run** (flow runs are
  canyon-segment-only; a boss can't start in a canyon). Derive the anchor from the existing surge-min
  clamp + `env(safe-area-inset-bottom)` so portrait AND landscape resolve with zero extra logic.
- **Two redundant read channels so it reads at SPEED.** Progress is encoded as *fullness* (how far the
  light climbed — a coarse peripheral SHAPE) AND *luminance* (a `data-heat` step brightens the glow as
  the chain climbs — the peripheral GLOW). So the ×N.N digits are a glance-read, not the only channel;
  at high chain you read the crest burning in peripheral vision without looking at it.
- **Distinct verbs for distinct mechanics.** climb (dashoffset ease + number micro-pop), halve (a soft
  knock + a ghost stroke that snapshots the lost light and fades), miss→0 (a shatter shake + fast
  root-ward drain, best-notch stays lit as the mark to reclaim). The mechanic's drama — a soft halve
  vs a hard reset — MUST be legible in the meter; sharing one animation would flatten it.
- **Don't double-announce.** With a persistent meter, the old every-5-chain popup is DEMOTED to a
  single cap announce — and it's **cyan, not gold** (gold = perfect rings, cyan = flow; the repo's
  colour grammar). Keeping both would be noise, the anti-premium tell.
- **Determinism-free + graceful.** Pure DOM reading events; `display:none` until a flow run toggles
  `.on` → every other run type's HUD is byte-identical; `prefers-reduced-motion` keeps all STATE
  (fill/heat/keystone/notch) and drops every animation.

**The dashoffset gotcha (Gate-2 caught it).** The `100 - frac*100` dashoffset fill math ONLY maps
to true fractions if the path declares **`pathLength="100"`** — without it the dash units are the
path's REAL length (the arch legs are ~68.7 user units), so the light saturates at ~69% of the
intended chain (the arch "closed" at chain ~14 of 20, firing the keystone-meets beat ~6 chain early
and desyncing it from the ignition). The stamina-arc precedent HAS the attribute; the crest dropped
it and 23 green tests missed it because they asserted the JS dashoffset values + the markup ids but
never the one attribute the math depends on. **Assert the attribute your math assumes, not just the
values you write.**

**Tooling gotchas.** Playwright's `screenshot({clip})` is in **CSS px**, not device px (don't multiply
by `devicePixelRatio` — the deviceScaleFactor is applied to the output). And a `display:none` element
has a 0×0 box — **show it before measuring** its clip rect. Drive the live meter for shots/tests via
the `window.__dd.ui.flowMeter` seam.

**Leapfrog.** The HUD now has a reusable "forged-glass crest" pattern (SVG arch + dashoffset climb +
the marker ramp) for any future momentum readout, and the flow run finally READS its momentum. Verify:
`tests/flowmeter.mjs` 23/23 (source + pure fill/heat math + a live-DOM drive-and-read), boots clean.
The owner judges the motion (climb / keystone ignite / shatter) on the preview. Next on the agenda: the
**Aurora Shallows biome** to give the flow run its own sky.
