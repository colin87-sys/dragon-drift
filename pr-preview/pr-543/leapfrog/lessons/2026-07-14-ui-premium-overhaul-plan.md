# UI premium overhaul: research × critique × high-effort synthesis → the EMBERLINE plan

**What we did.** Kicked off the premium menu/UI/HUD rework the owner asked for — not with
code, but with the plan that governs it. Three-agent structure: (1) a web-research agent
distilled 15 named "AAA premium" patterns (Tsushima title theater, Elden Ring hairlines,
Hoyoverse mobile package, Dead Space partial diegesis…) plus motion-design numbers and
mobile-perf caveats, all filtered through our constraints (DOM over WebGL, zero asset
files, 60fps weak mobile); (2) a critique agent read the entire UI surface (`ui.js`,
`style.css`, `index.html`, satellites) AND screenshotted 16 live states headlessly
(landscape + portrait), returning a 5.5/10 verdict with file:line findings; (3) a
high-effort Fable agent synthesized both into `reforged/UI-PREMIUM-OVERHAUL.md` — the
EMBERLINE design language (token constitution), 14 ranked initiatives U1–U14, a 5-phase
rollout with human+headless gates, a don't-break list, and a 5.5→7→8.5→10 score ladder.
Source reports committed as `UI-PREMIUM-RESEARCH.md` + `UI-PREMIUM-CRITIQUE.md`.

**What we learned.**
- **The critique's core finding is ENTROPY, not wrong design**: 37 font sizes, ~17 radii,
  five panel languages, two coexisting color generations (navy legacy vs warm ember), and
  landscape layouts that visibly break (pause EXIT unreachable, shop stats below the fold,
  hub rail over the CTA copy). The credited surfaces (pause card, boss title/spell cards,
  motion tokens, safe-area rigor) already ARE premium — the plan makes them law instead of
  islands. Diagnosis before prescription: had we jumped to "redesign", we'd have replaced
  the best parts too.
- **Headless WebGL screenshots WORK in this environment** (swiftshader default, the
  `/opt/pw-browsers/chromium` install) — the critique agent captured real rendered frames
  under the DOM chrome in both orientations. The old "no WebGL in CI" note still holds for
  CI, but local/pre-PR UI regression shots are now proven; the plan codifies them as
  `tools/uishots.mjs` (8 states × 2 orientations, `--diff` mode).
- **Research and critique conflict — the synthesis pass earns its cost by adjudicating.**
  Eight explicit reconciliations, e.g.: research said "system font stack" (assumed no
  fonts) but the repo vendors Russo One/Rajdhani — build the scale on what's shipped;
  research said "one accent" but the loved boss cards need the 4-role accent table — keep
  roles, evict off-role squatters; research's "menu = camera move" is subordinated to the
  LEAPFROG menu law (decouple STATE not RENDERING, colour-only theming).

**The gotcha.** `tests/buildstamp.mjs` *requires* the dev build stamp — but it boots with
`?debug`, so U1's "hide the stamp behind `?debug`" keeps it green. Verify the test's boot
params before assuming a credibility fix will break CI. Also: the full-screen
`.screen { backdrop-filter: blur(3px) }` is a double loss (per-frame GPU re-blur AND it
turns the paid-for live hero scene into "illegible mush") — killing it is both a perf win
and a look win.

**The reusable pattern.** For any "make X premium" directive: **parallel
(external research agent + internal critique-with-screenshots agent) → one high-effort
synthesis agent that must list its overrides.** The synthesis prompt should demand
(a) ground-truthing claims against the code, (b) an explicit killed/deferred table,
(c) dispositions for every top-N critique weakness, (d) a phased rollout honoring
"coexist → prove on a hero → migrate". The "list your reconciliations" requirement is
what surfaces the places where generic best practice would have damaged shipped strengths.

**What it unlocks.** Phase 0 (U1 credibility floor + U2 token constitution +
`uishots`/`uitokens` harnesses) is fully specified and can start next session; the
hero surface (splash → start hub) is chosen and justified; every later phase has its
gates pre-written. The Gate Log stub in `UI-PREMIUM-OVERHAUL.md` awaits the Fable
kickoff verdict before U1 code lands.
