# Tempest eye-breach v1 — the storm opens on the sun axis (and three gate gotchas)

**What we did.** Built the eye of the gale — Tempest Reach's focal set-piece — as a MINIMUM v1 and
Fable-gated it to **SHIP-MIN 4.2/5** in two rounds. It's the payoff of an axis the whole biome had
been aiming at for three PRs (the rain veil thins toward it, the lightning avoids its azimuth, the
pale value-hole horizon sits on it).

## The build (ALU-only re-shading, zero new fill, the existing godray fan reused)

A `breachMix` env channel (Tempest = 1.0, 0 elsewhere = byte-identical) drives three effects:
- **Sky breach window** (sky-dome fragment, spliced AFTER `CLOUD_BODY` so it punches a real hole in
  the deck): a raked ~4:1 **almond** centered on the sun azimuth, low in the horizon slot. Interior =
  warm-white low (L≈0.80, the brightest thing the biome shows) → desaturated silver-blue high, thin
  `#ffd870` gold lower lip. The deck deepens to `#232a33` in a tight almond ring around it. The sun
  disc is NEVER drawn (a centerless brightness). Mirrored in `skyProbe.skyColorAt`.
- **Godray meter**: `godrayMul` 0.05→0.42, tint warmed — the bright interior auto-becomes the godray
  occlusion source, so the shafts read as leaked sun-gold, no new pass.
- **Water calm patch** (fragment-only): a far-band × tight-az pool at the eye's foot that eases the
  storm-sea violence, calms the hue, and adds a feathered gold sun-pool (a pool, not a glitter lane).

## Gotcha 1 — a sky ellipse's az half-width is a HALF-ANGLE, not a span

First build set az half-width `0.44 rad` — that's a **50° full span**, and the "eye" filled the sky
like a portal. Fable's arrival spec is ~18–24° *full* span → ~0.20 rad *half*-width. Halving it gave
the subtle horizon-eye. When a shader window is specified in "degrees of azimuth," halve it for the
half-width the ellipse math wants.

## Gotcha 2 — for core→bloom→DARK, the DARK must be mixed OVER the bloom, and the bloom kept anisotropic

Round 1 FAILED the value frame (annulus L 0.45 vs ≤0.25): the `#232a33` ring was applied *before* the
interior, so the bright bloom overwrote it and the breach read as a **moon behind clouds** — the one
read a DAY biome must never give. Fixes: (1) mix the dark ring AFTER the interior so it *wins*; (2)
sharpen its onset right at the rim and halve its reach (a tight almond ring, not a wash); (3) keep the
frame anisotropic (drive it off the same elliptical `_rr` as the hole) so the halo is an almond, not a
disc — a round halo around an almond core is itself the moon tell.

## Gotcha 3 — a criterion written for one composition can be physically wrong in another (amend it, don't bend it)

Fable's own fix moved the hole INTO the pale slot (so the lip kisses the horizon — a mid-deck hole
reads as a moon). But then the original "annulus L ≤ 0.25" was unsatisfiable: a true-black ring
floating in a 0.75 field is *itself* an eclipse tell. Fable **amended** the criterion to the read it
actually protects — "ring-dip ≥ 0.3 L below both core and surround" — and it passed. The lesson: when
a numeric gate becomes physically inconsistent after a position change, re-derive the number from the
*law* (the dark must visibly frame the bright), don't force the stale target.

## The de-donut arc-bias (reusable for any bright-hole-in-a-field)

A uniform dark annulus fully enclosing a bright core in a pale field reads as a donut/eclipse in
motion. Insurance: **bias the ring strength by arc elevation** — weak at the gold lip (bottom ~0.15×),
strong at the top (1.0×), via `mix(0.15, 1.0, smoothstep(-1,1, _ny/_rr))` (`_ny/_rr` = sine of the arc
angle). The frame then *connects upward into the deck* — a socket in the storm's wall, seen from every
angle — instead of floating around the core.

## Deferred (v1 out of scope → follow-on / device)

Progress-arc growth as you approach, teal in-eye glints (the STORMREND quote), the one additive sun
sprite, the arrival hold/recede beat, tier-2 degrade check. Device-gate: godray fan intensity/warmth,
sea sun-pool read, still-axle world-lock over motion, worst-case gold ration with a pickup burst, and
**bulletcontrast over the breach interior** (it's now the brightest surface a bullet ever crosses).
