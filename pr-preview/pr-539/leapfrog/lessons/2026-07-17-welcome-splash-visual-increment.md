# Welcome+Hub build, increment A: the splash VISUAL hero is a zero-engine-risk beachhead

**What we did.** First build increment off the gated `WELCOME-HUB-REDESIGN.md` plan (§0 + §1).
Kept it to the two files that carry the splash and NO engine code: `css/style.css` (`#splash`
block) + `js/splash.js`. Delivered: warm-ink EMBERLINE re-skin (evicted the pre-EMBERLINE purple
`54,22,92`/`58,26,98`/… washes → `--scrim-ink`), an asymmetric scrim that stays **clear through the
dragon third** (≤0.10 at 36–62%) and heavy only behind wordmark/CTA, wordmark tracking → `--track-disp`
(0.16em) desktop+landscape, the glow-breath capped ≤28px/≤0.5 (was a 42px onion tell), **deterministic
seeded embers** (golden-ratio hash on the index seeds all five params → byte-identical renders; box-shadow
evicted), and a **one-shot CSS `.splash-godray`** dawn-break light-shaft that blooms once on `.show`
(peak 0.44 ∈ [0.32,0.50], settles to ≤0.18) as the ignite spectacle's accompaniment.

**The scoping lesson (reusable).** The splash is a **standalone hero surface** — its whole render is
`#splash` DOM over the live scene. That makes the *visual* half of a "wow" redesign a beachhead you can
ship with **zero roster/engine risk**: re-skin + type + determinism + a pure-CSS spectacle beat, all
gated by `uitokens` + static greps. The **3D subject layers** the plan commits (one-shot wingbeat / rim
lift / camera push) are correctly a *separate* increment — they touch `dragon.js`/`cameraController.js`
and must be byte-identical-off + menu-law-gated, so entangling them with the safe CSS work would put the
roster at risk for no reason. Split the visual surface from the engine beat.

**Gotchas.**
- `tests/run-all.mjs` **halts on the first failure, and `_diag-rock-caps.mjs` fails on a clean tree in
  this sandbox** (0 geometry samples → NaN%). So run-all going red does NOT mean your change broke
  something — confirm by stashing your files and re-running the same test, and verify your own area with
  targeted checks (`uitokens.mjs` + greps) instead of trusting run-all's exit code.
- The asymmetric-scrim law on a **centered** splash ≠ the left-column form: heavy TOP (wordmark) + FOOT
  (CTA), transparent MIDDLE (dragon) — a vertical scrim, not `--scrim-side`. Apply the LAW (subject third
  stays alive), not the literal token.
- A one-shot CSS beat needs no JS timeline: `#splash.show .splash-godray { animation: … backwards }`
  fires exactly once when the splash is shown, and reduced-motion collapses it to its static rest.

**What it unlocks.** The first premium impression is already warm, on-language, and strobe-free with a
real spectacle beat — and the next increment (the committed 3D ignite: `igniteWingbeat`/`igniteRim`/
splash-branch camera push, wired to a ~1.35s reveal timeline + the early tap affordance) drops onto a
clean, verified splash instead of the old purple one.
