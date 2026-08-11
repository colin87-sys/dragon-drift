# A CSS transform-animation silently overrode the gauntlet-follow inline transform (Surge froze the cluster)

## What we did
Fixed the owner-reported bug: "when you collect rings, the gauntlet follows the dragon,
but the moment it gets full it moves to the centre and pulses and stays still rather than
continuing to follow." The bottom-center vitals cluster (`#stamina-arc`, the GAUNTLET) rides
under the dragon in screen space via `ui.gauntletFollow` (main.js projects the dragon each
frame → gauntletFollow writes an inline `translate(calc(-50% + Xpx), -50%) scale(...)`). At
DRAGON SURGE (fever) the cluster snapped to centre, pulsed, and stopped following.

## Root cause (the exact mechanism)
The gauntlet container wears `.combo` + `data-tier` (ui.js ~939/943 — for `.gauntlet-x`
multiplier visibility and the gem tint). A **legacy standalone combo-badge** rule survived
in `css/style.css`:

```css
.combo[data-tier="4"] { …; animation: combo-rage 0.45s ease-in-out infinite; }
.combo[data-tier="5"] { …; animation: combo-rage 0.35s ease-in-out infinite; }
@keyframes combo-rage { 0%,100%{transform:translateX(0) scale(1)} 25%{transform:translateX(-1.5px) scale(1.04)} … }
```

`.combo` is now applied **only** to the gauntlet container (the standalone badge was removed;
nothing else in the DOM uses `.combo`/`.combo-x`/`.combo-word`). At fever, `tier` is forced to
5 (ui.js: `const tier = game.feverActive ? 5 : comboTier(...)`), so `.combo[data-tier="5"]`
matched the container and ran `combo-rage` — a **transform** animation — on it.

**A running CSS animation that sets `transform` outranks an inline-style `transform`** (CSS
animations are a higher cascade origin than inline styles for the animated property). So the
animation's transform won the RENDERED output, pinning the cluster to its origin (identity
matrix, `translateX≈0`) and pulsing it (`scale 1→1.04`) — exactly "moves to centre, pulses,
stays still."

## The gotcha that cost two engineers a reproduction (the real lesson)
`ui.gauntletFollow` **kept running and kept writing the correct inline transform the whole
time** — the JS follow was never broken. The CSS animation only overrode the *rendered*
(computed) transform. So:

> Any harness that samples `el.style.transform` (or the JS `gfDx` state) sees the follow
> "working" and tracking perfectly, while the screen shows it frozen. **The inline style
> property and the rendered transform diverge.** The ONLY faithful probe is
> `getComputedStyle(el).transform`.

Three independent reproductions (owner's forced-fever poll, a faithful-event trigger, a real
`collect()`-path trigger) ALL sampled the inline transform and ALL reported "tracks fine."
The bug surfaced instantly the moment the harness compared `getComputedStyle().transform`
(computed matrix `e`) against the inline write: divergence jumped from 0 to ~140px the frame
the `surge` class appeared, and returned to 0 the frame fever ended. It is **not**
reduced-motion–gated (`combo-rage` isn't in the reduce block) — headless just misled us
because we read the wrong property, not because animations were off.

## The fix
One high-specificity guard, at the leak site in `css/style.css` (right after the legacy
combo block):

```css
.stamina-arc.combo[data-tier] { animation: none; }   /* (0,3,0) > legacy (0,2,0) */
```

The followed container is kept **animation-free**; `animation` is not inherited, so the
inner-child surge emphasis (`g-ignite`, `gem-blaze`, `surge-flash`, the `.gauntlet-x` colour
ramp) is untouched. No JS change — gauntletFollow was always correct.

## Reusable pattern (the law)
**If a DOM element's transform is owned by per-frame JS (a projected/followed HUD element),
that element must carry NO CSS `transform` animation — ever.** A transform keyframe silently
outranks the inline write in the rendered output while leaving the inline property readable,
so it evades any inline-sampling test. Two corollaries:

1. Put emphasis animations (pulse/shake/ignite) on **inner children**, never the followed
   container. EMBERSIGHT already did this for the deliberate surge FX; `combo-rage` was a
   legacy leak that broke the rule.
2. **Verify followed/projected HUD elements with `getComputedStyle().transform`, not
   `el.style.transform`.** Added `reforged/tests/gauntlet-follow-surge.mjs`: sweeps the dragon
   across a real surge crossing at desktop + mobile-portrait under `reducedMotion:
   no-preference`, and asserts the *computed* transform equals the follow's inline write
   (divergence <3px; was ~140px) and still tracks (span >40px, Pearson r>0.5 vs the dragon's
   screen X).

## What it unlocks
The gauntlet now follows the dragon smoothly through surge activation and the whole fever
duration on real devices. And a harness pattern + assertion that catches CSS-vs-inline
transform overrides on any future projected HUD element (reticle, tether, boss chevrons).
