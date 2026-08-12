# Welcome+Hub AAA plan: the wow won't gate until the SUBJECT moves — and only verified rig facts unstick it

**What we did.** Owner brief (from the live shipped hub screenshot): the first screen must WOW,
the returning-player state + idle-reward must feel like a premium gacha pop-in, the menu dragon
gets CROPPED and rotates around an EMPTY background, and the "Tailwind while you were away" line
+ «Slipstream» chip read cheap. Ran the full ritual — Fable research brief → Opus web research
(6 threads, each adversarially fact-checked) → Fable plan → pre-assess → harsh critic gate (≥4.2)
→ independent audit — as one resumable `Workflow`. Output: `reforged/WELCOME-HUB-REDESIGN.md`
(+ `WELCOME-HUB-RESEARCH-DIGEST.md`). **Gate PASS 4.35/5; audit FIX-FIRST (4 surgical build-time
corrections).** No game code changed — this is the gated plan, build is the next step.

**The load-bearing lesson — a "wow" plan cannot gate on chrome motion; the SUBJECT must move.**
The critic held the plan at **4.1 for three rounds**, every time on the same dimension: first-load
WOW. The plan kept proposing retimed fades + a single CSS radial-gradient bloom over a *verbatim*
camera while the living dragon did nothing at ignite — which is exactly the flat-bloom / onion-ring
cheap-tell the AAA pipeline warns about. A "wow" is the creature reacting, not a gradient over it.
It only cleared 4.2 once the plan **committed** a layered 3D ignite beat: one-shot wingbeat
(×1.4–1.8) + rim-light lift (+8–12%) + a subtle camera push (4–6%), co-timed to the wordmark
resolve, with a numeric amplitude floor and a non-looping assertion.

**The technique that unstuck it (the real leapfrog):** three abstract revise rounds oscillated at
4.1 because feasibility was *asserted*, not known. Per the pipeline law ("a third failed attempt
means the APPROACH is wrong, not the parameters"), we stopped tuning prose and **went to verify the
rig**. That single read-only investigation is what let the plan *commit*:
- `updateRim(color,strength,boost)` (`rimLight.js:60`) is a per-frame uniform write → rim lift is
  **already supported, free**.
- The one-shot camera-push envelope (`punchKick`/`damp`) exists but **only in the chase branch
  after the splash `return`** — so a splash ignite push is a small net-new term in the splash
  branch's own `position.set`, NOT a `punchKick()` reuse (the audit caught the plan overselling this).
- `flapPhase` is a **private looping clock** (`dragon.js:133/645`, only a `WING_DEBUG` freeze
  override) → a one-shot "ignite wingbeat" is a small, well-scoped new driver on `solveWing`.
- Head-turn has **no lever** (head is velocity-auto-driven; `setDragonLook` is whole-body) → parked
  on the escalation ladder as scoped new work, not the committed default.
- The hub is framed by a **fixed radius 10.5 full-360 turntable** (`cameraController.js:191-196`),
  not bbox — so "cropped + spinning over void" is a camera-rig fix (bbox-fit + sway clamp), not CSS.

**Gotcha the audit caught that the critic didn't:** a headless "machine gate" that can't run is not
a gate. `run-all.mjs:9` skips `browser.mjs` and `uishots.mjs:87` sets `canvas{visibility:hidden}` —
so composition/crop/sky-fraction **cannot** be a machine check; they are owner-preview (class C).
The plan's honest A/B/C verification split (and de-scoping the `renderMode='mask'` fantasy to a
`Box3` + ray-grid spike) was the strongest part; the four residual blockers are all surgical.

**Reusable pattern.** For any premium-menu "wow" plan: (1) the gate will not clear until the plan
commits a SUBJECT motion, not chrome motion; (2) when a plan stalls twice on feasibility, spend one
read-only pass verifying the exact rig/camera/anim APIs and cite them — a target you can measure
(and an API you've confirmed) is a round you don't burn; (3) always run the independent audit against
source, because "machine gate" claims and API "reuse" claims are where a confident plan lies to itself.

**What it unlocks.** A build-ready, EMBERLINE-compliant welcome+hub spec with committed ignite APIs
and a closed gap/risk ledger — the four audit corrections are the build checklist, so the
implementation session should land each § in ~one round instead of rediscovering the rig facts.
