# Welcome+Hub §4: the "cheap text" fix = withheld-gold, not more gold

The owner flagged the «Slipstream» title chip (italic gold guillemets) as cheap. The premium fix is
counter-intuitive: **less gold, not a fancier gold.** EMBERLINE withholds accent — so the chip becomes
the NAME in calm warm ink (`--rf-ink-2`, uppercase Rajdhani) with GOLD reduced to a single leading `◆`
dot marker (`::before`), in a quiet hairline pill (`--panel-line` + a warm `--scrim-ink` fill). Guillemets
and `font-style:italic` both evicted. Applied to both title-chip instances (hub `.hero-title-chip`
`ui.js:1958`; pilot topbar `.meta-chip.title-chip` `pilotScreen.js:130`). Left the inline `«name»` in
title-LISTS / recap / share text — that's a different context (a name citation, not a chrome chip); don't
over-reach a targeted fix into a global find-replace.

**Cyan eviction (§4.2):** the hub embers were `--c:${gold ? '#ffce6a' : '#7fe6ff'}` (`ui.js:1908`) — cyan
is the withheld VITALS accent and is illegal on the calm hub (it's legal in-run for stamina/graze). Swap
the non-gold half to a warm amber (`#ff9a4a`) so the motes keep variation without breaking the color law.

**Re-verify after a parallel merge.** A separate PR (#494 game-menu-hud-premium) merged into master between
sections — so before editing, I re-grepped every §4 target on the *current* master rather than trusting the
plan's line numbers. They were all still present (#494 didn't touch them), but the check is the point: a
plan's file:line is a snapshot, and another session may have moved or already fixed the target.
