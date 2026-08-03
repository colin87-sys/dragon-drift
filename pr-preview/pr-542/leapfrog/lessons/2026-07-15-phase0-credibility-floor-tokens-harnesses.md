# Phase 0 shipped: the credibility floor, the EMBERLINE tokens, and the harnesses that guard them

**What we did.** Built Phase 0 of `reforged/UI-PREMIUM-OVERHAUL.md` (PR #441):
- **U1 credibility floor:** the dev build stamp renders only under `?debug` (main.js —
  the console line stays for support); "+0 XP" rows suppressed; ★ HIGH SCORE / ★ LONGEST
  FLIGHT chips gated on a real prior best OR a substantial first run (new
  `prevHighScore`/`prevBestDistance` captured in `recordBests` BEFORE the overwrite —
  the recap-time trap is that `highScore` already equals the new score); "0 SKIMS"
  appears on first increment (chain-counter rule); wallet numbers `toLocaleString`
  everywhere; the hub control-dump line trimmed (touch: gone, keyboard: one short line);
  slogan → "◆ born of ember · forged in flight ◆".
- **U2 constitution:** the EMBERLINE `:root` token block landed verbatim, coexisting
  (zero visual change on unmigrated screens) + the game's FIRST `:focus-visible` rule.
- **Harnesses (agent-built):** `tools/uishots.mjs` (8 states × 2 orientations @ dsf2,
  `--static` determinism seam, `--bank`, `--diff` with per-state thresholds; in-run/boss
  frames review-only) with the 16-frame baseline banked in `tools/uishots-baseline/`;
  `tests/uitokens.mjs` (9 checks: tokens exist, navy-literal ratchet **46 → must never
  grow, Phase 2 exit = 0**, shrinking allowlist machinery, layout-prop-animation ban on
  HUD selectors, JS-injected-style scanning).

**What we learned.**
- **`window.__dd` only exists under `?debug`** — asserting *player-facing* state (like
  the stamp's absence) needs a different boot path. Added `boot({ player: true })` to
  `tests/browser.mjs`: waits for `body.app-loaded` instead of the `__dd` seam. Any
  future "does the player see X" test should use it.
- **Classify failures against master IN THE SAME ENVIRONMENT, at the same moment.**
  The suite surfaced 5 failures; the lazy conclusion ("I broke stamina") was wrong three
  ways. Final classification, each proven by a master-worktree run: `badges` +
  `knellburn` fail on clean master here (pre-existing); `unmaskedarena` + `weftorgans`
  pass solo but fail under CPU contention (a parallel uishots capture saturates the box
  — load average 23); `stamina` fails on master too *after a container restart* (cold
  swiftshader caches slow the simulated frames; its end-to-end drain check measures
  sim-time via wall-clock). **A timing-sensitive test's verdict is only meaningful
  against a same-moment master baseline** — the worktree A/B (`git worktree add … 
  origin/master`) is the cheap, correct instrument.
- **Don't run timing-sensitive suites while a capture harness is running.** uishots
  spawns per-state Chromiums; anything measuring drain/frames alongside it flakes.
  Sequence: captures first, suite after (or vice versa), never interleaved.
- **A container restart mid-agent is survivable if outputs go to disk incrementally.**
  The harness agent died in a restart between "capture done" and "bank done" — but all
  16 frames were on disk, so recovery was one `cp` plus re-running the lint. Agents
  should write artifacts as they go, not hold them for a final step.
- The stop-hook's "unverified commits" complaint about `noreply@github.com` hashes
  refers to GitHub's own merge commits in master history — set
  `git config user.email noreply@anthropic.com` for NEW commits and ignore the rest.

**The reusable pattern.** Phase-gate verification = (1) run the directly-affected tests
first (fast signal), (2) full sweep in background, (3) every failure gets a same-moment
master A/B before it's allowed to block, (4) known-flaky/pre-existing failures are
REPORTED on the PR, not silently skipped and not chased in-scope.

**What it unlocks.** The entropy ratchet is live (46 navy literals can only go down;
new px font sizes on migrated files will fail CI), the 16-state visual baseline is
banked for every future Gate, and Phase 1 (hero splash + start hub) can start
immediately — its gate ("uishots --diff: only splash/hub frames changed") is now
mechanically checkable.
