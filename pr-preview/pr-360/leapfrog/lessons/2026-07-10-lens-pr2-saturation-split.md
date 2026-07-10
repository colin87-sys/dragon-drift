# LENS PR2 — the saturation split (break the green channel)

## What we did
The shipped boss reticle, pip row, and organ marks were all the SAME jade `rgba(80,255,170)`
as the player's own wisp-lance projectiles — so on-screen green meant BOTH "your aim UI" and
"your bullets," clustered at screen-centre with the enemy magenta. That double-booking is the
root of the readability complaint (see the 2026-07-10 lens lessons). PR2 splits the channel by
**saturation**, gated under the **Bullet Clarity** setting:

- **Chrome** (the aiming UI: reticle bracket border, pip border, mark border + stacked outline)
  → pale mint-white `rgba(200,248,232)` (`--lock-chrome`).
- **Energy** (banked lance charge that literally becomes jade wisps: pip fill, mark `.fill`,
  the brand `.rune` stroke) → stays full jade `rgba(80,255,170)` (`--lock-energy`).
- The one-shot `.rsnap` lock-flash and the locked `::before` halo stay jade, so the MOMENT of
  locking still pops green — only the *persistent* chrome desaturates.

Now enemy magenta vs pale mint-white aim-UI vs saturated jade player-energy separate on hue
AND saturation AND luminance — a 3-way split, not hue alone (the colourblind law).

## Why gate it under Bullet Clarity instead of shipping it globally
The plan floated a global recolour, but gating it under the existing `.lens2` toggle is
stronger: it makes the whole visibility overhaul ONE coherent, opt-outable package (turn
Bullet Clarity off → classic all-jade reticle), and it only touches boss fights — which is the
only place the jade collision exists (the ring/gate reticle is gold/cyan; pips/marks are
boss-only LANCE UI). No new flag, no shipped-roster change for players who opt out.

## The gotcha: marks don't live under #reticle
Pips (`.lockpip`) are children of `#reticle`, so `#reticle.lens2 .lockpip` cascades for free
once the boss branch toggles `.lens2` on `#reticle`. But the organ marks (`.lockmark`) are
appended to `#hud`, NOT `#reticle` — the `.lens2` skin can't reach them by descent. So
`renderMarks()` toggles `lens2` per-mark from `lensClarity()` (the same cheap per-frame read
already used for the reticle). Lesson: before scoping a recolour under a container class, check
the DOM parent of EVERY element you mean to recolour — a sibling-appended pool needs its own
class hook.

## The reusable pattern
- **Split a doubly-loaded hue by saturation/value, not by re-hueing.** Jade is the player's
  whole identity (wisps, ribbons, tether, gather sparks); a global re-hue is a roster-wide
  change. Desaturating only the CHROME (aim UI) while the ENERGY (what becomes wisps) stays
  saturated keeps the identity and breaks the collision — and is colourblind-safe by
  construction (differs in S and L, not just H).
- **CSS comma-list custom properties for `rgb`:** `--lock-chrome: 200, 248, 232;` then
  `rgba(var(--lock-chrome), 0.4)` lets one var drive many alphas; a future per-dragon UI
  retint (matching `setWispTint`) becomes a one-line var change.
- Keep the *transition moment* (lock snap) in the loud colour even when the *steady state*
  desaturates — the celebration reads, the persistent chrome recedes.

## What it unlocks
- Optional: consolidate the remaining base-rule jade onto the same vars for a per-dragon UI
  retint hook.
- PR3 (owner sign-off): `relockWarmFrac 0→0.4` — the attention-economics half (dodging stops
  taxing the lock). Independent of the colour work.

## Verify
`boss.mjs` (118) · `wisps.mjs` (15) · `bulletcontrast.mjs` green (no gameplay/WebGL-hue
surface — this is CSS reticle chrome). Boot-confirmed (0 console errors): with Bullet Clarity
ON the mark border computes `rgba(200,248,232)` (mint chrome) and reverts to `rgba(80,255,170)`
(jade) with `?lens=0`; the reticle brackets read pale/cool, the brand stays jade. Human judges
on the PR preview whether "locked" still reads unmistakably with a desaturated persistent
border (it keeps the bracket close-in + white-hot border + jade snap + jade halo).
