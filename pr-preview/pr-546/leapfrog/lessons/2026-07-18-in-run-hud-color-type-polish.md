# In-run HUD color/type polish: the danger hue was on the WINNING moment, and a whole block styled a ghost

Ran the owner's ritual — Fable PRE-ASSESS → grunt work to numeric targets → Fable HARSH CRITIC (4.4/5 PASS).

## The two findings that mattered

**Magenta was painting the REWARD peak.** `.score.fever` and `.gauntlet.fever .gauntlet-x` used `#ffb8ff`
(magenta) for Dragon Surge / fever — but EMBERLINE role-locks magenta to DANGER. So the game rendered
"you're winning" in the "you're dying" hue, on the most-watched element (the score). Fix: white-hot ember
`#fff2d6` + a strong gold border. The critic endorsed white-hot over a saturated amber: the tier ramp
already climbs gold→orange→white, so warm-white-ember + gold border reads as "the hot one," while another
amber would just read as one more tier rung. **Color-law lesson: audit the REWARD states, not just the
danger ones — a misused danger hue on a positive moment is the loudest cheap-tell and the easiest to miss
because you look for it on failure, not success.**

**A whole styled block rendered nothing.** The `.combo` badge block (6 non-token px sizes, px tracking,
cyan base, magenta tier-5, two keyframes) styled `.combo`/`.combo-word`/`.combo-x` — but grep showed those
never render as text: `.combo` is only toggled onto the gauntlet *container* to drive `.gauntlet.combo
.gauntlet-x` visibility + `data-tier`; the visible multiplier is `.gauntlet-x` (`#surge-x`), which owns its
own token size, tabular numerals, and colour ramp. So the block was **dead code tripping the type-lint and
the color-law for a phantom element.** The clean fix was DELETION, not migration. Verify before you
migrate: a cheap-tell in the CSS may style an element the JS stopped rendering — grep the DOM/JS for the
class before you spend effort "fixing" its type.

## Gotchas

- The fever colour is CSS-class-driven (`ui.js:908` `classList.toggle('fever', …)`), NOT inline JS — so the
  CSS edit is the actual driver. Confirm this before assuming a CSS colour change will take (if JS set the
  colour inline, the edit would be a no-op).
- Forcing `game.feverActive=true` from a headless probe does NOT persist — the game loop resets it, so a
  computed-style sample reads the base colour. Trust the CSS rule + the class-toggle path over a forced-state
  screenshot for transient states.
- The critic caught what I missed even after claiming to strip it: an inert `.combo .combo-x` rule left
  behind (styling a node that doesn't exist). "I deleted the dead code" is a claim to grep-verify, not
  assert — a harsh critic pass is worth it precisely for the vestige you overlook.

## Reusable
`--track-num` (0.03em) is used un-named by `.score`/`.dist`/`.gauntlet-x`/`.fc-x` — a future EMBERLINE
amendment could mint it, but that's a repo-wide refactor, not a micro-polish. Bespoke-but-consistent beats
inventing a new value.
