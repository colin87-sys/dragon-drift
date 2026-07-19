# Fable self-audit of the EMBERLINE plan: ground-truth the synthesis before building

**What we did.** After the EMBERLINE UI overhaul plan merged (PR #436), the owner asked
for a high-effort Fable **self-audit**: is the plan sound, what did the synthesis miss,
and is every initiative actually feasible in this codebase? The auditor read all three
docs, verified ~40 file:line claims against the real code, feasibility-checked U1–U14,
and applied surgical corrections to `reforged/UI-PREMIUM-OVERHAUL.md` (plus an "Audit
addendum" of residual on-device risks). Verdict: **sound-with-corrections** — the
architecture held; specific claims didn't.

**What we learned — what a synthesis pass gets wrong even when it "ground-truths":**
- **It undercounts what it samples.** The plan claimed the backdrop-filter law was
  "violated twice"; the audit found ~12 blur sites — and that the full-screen `.screen`
  blur is *already disabled* on portrait ≤700px (style.css:1348), i.e. the perf trap is
  landscape/desktop-only. A ruling written from two data points would have shipped wrong.
- **It misreads shipped-vs-experimental.** U10 said "adopt the lens2 brackets — the team
  ships the busy version": actually the bracket reticle is shipped and default-ON for
  boss fights (Bullet Clarity, `js/lensFlag.js`); `?lens=` is only an override. The
  initiative became "extend the shipped language", a much smaller job.
- **It specs harnesses that flake.** `uishots --diff` over a live animating scene with
  `Math.random` ember motes (splash.js:21-35, ui.js:1550-1556) can never pixel-diff
  stably. Respecced: a `--static` capture seam + per-state thresholds; in-run/boss
  frames review-only unless canvas-masked. **Determinism is a spec requirement of any
  screenshot gate, not an implementation detail.**
- **Lints need the JS escape hatch closed.** A CSS-only `uitokens` scan misses
  JS-injected styles (`cssText` in main.js:72-75, inline `style=` in ui.js template
  strings). Lint scope must include `js/*.js` template strings or entropy just moves.
- **Missing seams are the real feasibility blockers.** U9's DOM boss bar is fine as
  design — but boss hp is module-private state pushed via `model.setHealth`, with **no
  JS-side getter/event** for UI to consume. The audit added the required seam to the
  spec. Feasibility review = "does the data reach the consumer", not "is the CSS drawable".
- Also fixed: U14 phase/dep contradiction, wrong emoji call-site lines (U7), the
  wordmark type-scale exception too narrow (hub wordmark is 66px), 8 undisposed
  screens/elements (revive offer, hint pill, race-bar, boss-rush, gesture tutorial,
  cinebars…) now dispositioned, and repo-root legacy game declared out of scope.

**The gotcha.** The owner merged the plan PR *while the audit was running*. Per the
merged-PR rule: restart the same branch from `origin/master` (`git stash → checkout -B →
stash pop` carries uncommitted audit edits across cleanly since the merge didn't touch
the file) and open a NEW PR for the corrections — never stack on merged history.

**The reusable pattern.** Plan → **separate adversarial Fable audit that must (a) verify
every file:line claim, (b) rule feasible/with-changes/risky per initiative, (c) fix the
doc itself, (d) list what it could NOT verify** (on-device risks) — before any build
session consumes the plan. The audit found no structural flaws but ~11 material claim
errors; building on them blind would have burned a session on each.

**Decision recorded.** The splash slogan is settled (owner delegated): "it's a skill
issue" → **"◆ born of ember · forged in flight ◆"** (U1, replace-not-A/B; ties the ember
currency + EMBERLINE language to the wordmark; avoids doubling the tagline's "skies").

**What it unlocks.** Phase 0 can start with every claim in the plan pre-verified; the
Gate Log's kickoff spawn is the only remaining pre-build step.
