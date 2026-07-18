# Welcome+Hub build §2: the returning-player reward pop-in (kills the flat "Tailwind" line)

**What we did.** Replaced the #1 cheap tell — the flat `setStartNotice("Tailwind while you were
away: +◆100. The sky kept your seat.")` at `main.js:879` — with a choreographed premium reward
card: asymmetric scrim → warm-glass panel-recipe card in the lower band (dragon holds center) →
the amount **counts up** while the topbar wallet ticks on the SAME clock → one GOLD sigil blooms on
the land → tap-to-dismiss (never auto-times-out). Consolidated 2-row card for gift+refund on one
boot. Both owner-flagged phrases retired (§2.5). Files: `ui.js` (new `showRewardCard`), `util.js`
(`tweenNum` gained `onDone`), `css/style.css` (`#reward-card`/`#reward-scrim`), `main.js` (payload
+ trigger).

**The wallet-baseline trap (the load-bearing correctness bug).** The plan (R2) warned the wallet is
already mutated at boot, so a naive count-up animates new→new (invisible). It's subtler than that:
the two rewards are credited at DIFFERENT times. The welcome-back GIFT is added in `main.js` at boot
(`saveData.embers += welcomeBackGift`), but the gambit REFUND is already credited during save LOAD
(`save.js:186 data.embers += stake`) before `main.js` runs. So the correct pre-reward baseline is
`saveData.embers − gambitSunsetRefund` (subtract the already-applied refund back), THEN add the
gift; `finalTotal = saveData.embers`. Count-up covers `finalTotal − preTotal = gift + refund`. Verify
where each reward is APPLIED, not just where it's announced — the announce site lies about timing.

**One clock, two consumers, via `fmt` side-effect.** `tweenNum(el, from, to, {fmt})` drives one
element's textContent. To satisfy R2's "topbar and card land together off one clock" without a second
tween, the card amount's tween is the clock and its `onDone` snaps the topbar to final; the topbar
runs its own `tweenNum(preTotal→finalTotal)` over the same window. Because both are rAF tweens started
together, device jank delays both by the same frame — they can't tear. `onDone` (a tiny
backward-compatible add to `tweenNum`) fires the sigil bloom on the landing frame.

**The gotcha the render caught — a reward MODAL body must be OPAQUE.** First render: the card used
the raw panel recipe (`--panel-fill` = translucent `--rf-glass`), so the hub's bright gold TAKE OFF
button and sub-text **bled straight through the card**, reading as clutter. A screenshot-vs-live truth:
the panel recipe is tuned for panels over a DARK scene; over the bright hub CTA it needs a near-solid
warm base stacked under the glass tint (`linear-gradient(rgba(23,16,10,.985)…), var(--panel-fill)`) +
a heavier scrim foot (0.80). Always render a new overlay OVER its real busy background, not a blank
one — the transparency bug is invisible against black.

**Gotchas.**
- The card mounts on `document.body`, not inside the hub HTML (the hub re-renders via innerHTML and
  would wipe it).
- The global `main.js` tap-to-fly handler (`window` pointerdown, `game.state==='ready'`) does NOT
  skip the reward card (it's not in the button/`.card` allowlist), so the dismiss handler MUST
  `stopPropagation()` — otherwise dismissing the card also launches a run.
- Verified live via the `__dd.ui.showRewardCard(...)` seam (a one-off `_rewardshot.mjs`, removed after)
  — single mid-count, single settled, and the two-row consolidated case; topbar summed correctly
  (12,480 → 12,580 / 12,830), no console errors.

**Deferred (noted, not silently dropped).** §2.3's precise `Box3`-projection card-vs-dragon clearance
belongs to §3 (the hub-camera measure spike); the card currently uses the pragmatic "lower ~40%"
seat. The no-gift `Welcome back, pilot.` hub greeting (§2.5) is shown here as the card's *sub* line;
the standalone no-gift path is a small follow-up.

**What it unlocks.** The loudest cheap-text complaint is gone; the returning-player moment now reads
as a premium gacha pop-in. Next: §3 hub camera (crop/void) — which also supplies the Box3 measure the
card's composition invariant wants.
