# Welcome+Hub §5/§6: declutter is mostly VERIFY, and a plan transition can be a no-op

## §5 — declutter = withhold accent + fix the token tells (small, not a rebuild)

The hub was already 2-spine (identity/economy top, ≤5 destinations bottom) with progressive disclosure —
so §5.1/5.2 were verify-only. The real cheap-tells were narrow:
- **`.challenge` line** (`style.css:1367`): `font-size:16px` (non-token) + `letter-spacing:2px` (px) — the
  classic entropy tell. → `--fs-body` + `--track-body` + `tabular-nums`, calm ink not gilded. This one CSS
  rule renders on BOTH the hero prompt and the in-run race strip, so a single fix declutters two surfaces.
- **Rail icons** rested at a light gold (`#ffd9ac`). The premium move is to WITHHOLD: rest them in calm
  `--rf-ink-2`, warm to gold only on hover/focus — so the standing hub keeps gold ≤10% (reserved for TAKE
  OFF + currency + the notification pips). Desaturating chrome READS more premium, not less inviting.
- **Badge:** the notification pip was already GOLD (not red/magenta) — no color-law violation, verified and
  left. Don't "fix" what already complies.

The deep in-run HUD recolor+reflow (§5.5 body) is a genuinely larger build (score/gems/distance/popups/
safe-area across a live 60fps run, owner-judged) — deferred as its own focused pass; the `.challenge`
token fix lands the shared cheap-tell now.

## §6 — a planned "net-new" transition that doesn't exist in the flow

The plan's one net-new §6 item was a "splash → hub dolly." But the actual flow has **no such transition**:
splash and hub are PARALLEL entry points — the first-time pilot sees the splash and TAKE OFF flies straight
to gameplay; the returning player boots directly to the hub. Splash never dollies into the hub. So §6 was
entirely verify-existing: the hub↔shop dolly (`shopW`), the `hero-intro` entrance stagger, and the
`screen-leaving` exit ritual already exist (protected credits from the earlier U12/U13 overhaul), no
backdrop-filter rides the live canvas, and every exit token is faster than its enter
(`--t-exit` 160 < `--t-screen` 320; card 200 < 340). **Lesson: before building a plan's "net-new"
transition, trace the real navigation graph — a plan can assume a flow the game doesn't have, and the
honest move is to mark it satisfied/inapplicable, not to manufacture the shot.**
