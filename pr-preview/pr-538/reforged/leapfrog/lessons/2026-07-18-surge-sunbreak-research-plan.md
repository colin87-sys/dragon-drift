# SUNBREAK — a premium Dragon Surge overhaul, researched → synthesized → Fable-audited

**What we did.** Ran the EMBERLINE overhaul process on **Dragon Surge** (the player's signature power
moment — today a magenta screen-wash + a two-cylinder beam) to produce an execution-ready premium plan,
codename **SUNBREAK**: [`DRAGON-SURGE-OVERHAUL.md`](../../DRAGON-SURGE-OVERHAUL.md) + a research digest
[`DRAGON-SURGE-RESEARCH.md`](../../DRAGON-SURGE-RESEARCH.md). Pipeline: **(1)** code-map the real system →
**(2)** a **Fable art director** (model: fable) framed the vision + 6 pillars + dual beat timelines + 15
measurable targets + four research briefs → **(3)** four **Opus** research agents in parallel (AAA
blockbuster ultimates · gacha cut-ins · beam/breath-weapon VFX craft · screen-space juice) → **(4)**
synthesis → **(5)** a fresh **Fable feasibility audit** against the actual code. Plan only; no game code
changed.

**What we learned (the design core).** The reason the current Surge reads cheap is measurable and
universal across AAA + gacha: **an additive full-screen wash *raises* the world's luminance toward the
core, destroying the 5:1–10:1 CORE:DARK contrast that makes a subject read as "the brightest thing."**
The premium move is the inverse — **suppress the world** (desaturate + exposure-dip + vignette, tinted to
the dragon's own *shadow-hue*, not grey) and **raise only the dragon**, ignited in an anatomical cascade
(eyes→spine→wing-bones→rim). That is the 3D equivalent of a gacha cut-in. And the per-dragon identity
problem (40 characters, one grammar) is solved by a **3-band value stack** where the **CORE is achromatic
and constant** (near-white, carries brightness) and only the **HALO mid-band hue** rotates per dragon —
so `surgeCore/Halo/Dark` derive from **one `dragonHue`**. Also load-bearing: the fighting-game
**"superflash" is a *pause* (time-dilation), a separate device from impact hitstop** — our APEX
held-breath IS the superflash; the release hitstop (70–90ms) is separate punctuation.

**The gotcha (why the audit mattered).** A synthesis written from a code-*map* idealizes subsystems. The
Fable auditor — reading the real files, not the plan — caught three that would have sunk I1: **(a)** the
plan's flat claim "there is no cruise-only trigger" was **factually wrong** (`collision.js:258`
auto-fires fever on the 8th cruise ring — three rising edges, not one); **(b)** the batched particle pool
the ≤8-draw-call budget assumes is **opt-in and OFF by default** (`save.js:33`), so the budget was 40–80
DC on the shipped path; **(c)** `timeScale` is **owned by the slow-mo system**, so a sequencer on scaled
dt makes the ultimate ~2× too long and the hitstop never fires. None was a pillar failure — all three
were "written against an idealized version of a real subsystem." The auditor returned **FEASIBLE WITH
CORRECTIONS** + 10 must-fix items, folded into the plan's §M.1.

**The reusable pattern.** For any premium *system* overhaul (not just a dragon model): **art-director
frames → parallel Opus researchers by lane → synthesize → a DIFFERENT Fable audits feasibility against
the actual code before a line ships.** The builder never judges its own output (AAA-PIPELINE three-judge
split) — and here that law extends to *plans*: the synthesizer never audits its own plan. Give the
auditor the plan path AND the specific code files, and demand GREEN/YELLOW/RED verdicts with file:line —
that is what converts "sounds feasible" into "here are the 10 things that will break." Bake measurable
targets in up front (§I): every reference number the researchers gave is a mechanism-grounded estimate
(WebFetch was egress-blocked all four lanes; they worked from WebSearch + domain knowledge), so the plan
verifies on our own harness (`surgeshot` cross-sections, DC ceiling via `renderer.info.render.calls`)
rather than trusting the references — a target we can measure is a round we don't burn.

**What it unlocks.** An I0→I5 build path with a Fable gate per phase, ready to execute. First fix (I1) is
the highest-leverage and near-zero-draw-call: kill the magenta wash, add the world-suppression grade +
`surgeDark`. The `surgeCore/Halo/Dark`-from-one-hue schema means every future dragon inherits the whole
ritual with palette-only data.
