# Tempest I0 — coexist the charcoal stub, LAND the shared strike clock, prove byte-identity

**What we did.** Ran increment I0 of the Thunderhead Tempest build (TEMPEST-THUNDERHEAD §B.7 /
§D): the additive `tempest` roster key, a fresh `js/dragonTempest.js` with four
contract-satisfying charcoal-cloud PLACEHOLDER builders (`cumulonimbusTorso` · `stormforkWings` ·
`stormbrowHead` · `virgaTail`), and — the reusable payload — the shared deterministic strike
scheduler `js/pulseTimer.js` + its headless determinism suite + the `?strikePin` capture flag. No
real weather geometry yet; I0 is scaffolding + tooling + calibration, and every increment after
this fleshes GEOMETRY without rewiring the contract. This mirrors the Revenant I0 precedent exactly
(the coexist-in-four-moves pattern is an engine fact, §C.1 C1) — same contract, fresh identity.

**The reusable pattern held verbatim — a premium coexists in four moves.** (1) Four builders, each
`register{Torso,Wings,Head,Tail}('name', fn)` at import time, in a module that imports ONLY `three`
+ `dragonRecipe` + `mechaKit` (the no-organism firewall). (2) The def names them in
`parts:{torso,wings,head,tail, surface:{shader:[]}}`. (3) `import './dragonTempest.js'` in
`dragonModel.js` next to the Revenant import so the builders self-register before any def resolves.
(4) The def is a COMPLETE premium — `maxRarity:'SSSR'` ⇒ exactly 4 forms, and it MUST carry a
distinct `lanceTint` + `lanceRune` (`stormcircuit`, storm-white) or the roster invariant throws.
Torso publishes `{group, attach, spinePoints, spineMats:[], mats:{bodyMat}, coreGlow:null}` —
**`coreGlow:null` is the crash-safe stub value** (a colour number null-derefs `coreGlow.userData.base`
every frame — the documented Solar crash); head returns `spineMats:[]` never `undefined`; the def
owes `horn`+`scales` cloud-tone hexes (unused mats) or every build spews two `color:undefined`
warnings. LEFT wing = an **outer `lmirror` wrapper** (`scale.x=-1` on a PARENT of the pivot, never
on the pivot) + the `hand.position=-K` −anchor fold → `wingsymprobe tempest` read **Δ0.000 across
all five poses first try** (the mirror-double-flip trap is dodged by the outer wrapper).

**The new payload — `js/pulseTimer.js`, a PURE seeded burst-cluster scheduler (Tocsin reuses it).**
Confirmed absent from the codebase this session; architecture copies `bossRhythm.js` (a pure,
deterministic-given-rng phrase machine the CI gates simulate headlessly) + the integrated-phase law
(advance by `dt`, never `time·freq`). The design that passed its own gauntlet:
- **No `Math.random` / `Date.now` / argless `new Date()`** (they break determinism AND the harness
  resume) — time enters only through `tick(dt)`, randomness only through a seeded mulberry32.
- **Burst clusters, not a metronome:** a burst is `burstN∈[1,4]` strike windows (each 0.10–0.28 s)
  separated by 0.30–0.70 s intra-gaps, then a REST solved so the long-run LIT fraction equals `duty`
  exactly: `rest = litSum/duty − litSum − gapSum`, clamped ≥1.2 s. The clamp only bites at short
  bursts / high duty; the long-run test tolerates ±10%. At the charging-ladder duties (0.06→0.18)
  with lit-sums 0.2–0.55 s the solved rest lands ~1.5–2.8 s, above the floor, so the measured duty
  is accurate — verified over 1000 s of fixed-dt ticks per rung.
- **Photosensitivity caps live IN the module, not at the call site:** window floor 0.10 s ≥ the
  80 ms cap; rest floor 1.2 s; the within-window flicker is a fixed ≤3 Hz cosine dip. No call site
  can strobe faster than the cap — the safety is by construction, not by discipline.
- **`pin(t01)` freezes the schedule for pixel-comparable captures:** 0 = the standing/rest frame,
  0.5 = a mid-window strike peak (`env01 = sin(π·t01)`), and a pinned timer is INERT under `tick()`.
  This is the MARROWCOIL determinism law extended to timed spectacle — every gate round comparable.

**GOTCHA banked — a purity self-check that scans source will trip on the ban it documents.** The
`tests/pulsetimer.mjs` firewall assert (`no Math.random / Date.now`) matched the very tokens in the
module's own header comment that DOCUMENT the ban. Fix: strip block + line comments before the code
scan (`src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'')`). A source-text firewall must
scan CODE, not prose — the same trap as the §B.8 import firewall ("match import statements, not a
comment naming the banned module").

**`?strikePin` is the capture flag; the studio `strike` STATE is honestly an I4 thing.** The
engine passthrough `?strikePin=<t01>` lands now, module-scope in `dragon.js` exactly like
`?wingDebug` — the FLAG exists before the lightning it captures. But the dragonstudio `strike`
state that REPLAYS the storm tick needs `parts.stormArcMats` + the guarded tick to pin, and those
don't exist until I4. Landing a `strike` state now would render a standing-frame duplicate labelled
"strike" — a misleading tile. So we deferred the studio state to I4 (where there is lightning to
pin) and documented it, rather than fake it. The task's explicit I0 requirement was pulseTimer +
the `?strikePin` flag; both shipped. Honesty over checkbox-completion (the render-in-colour lesson's
sibling: don't ship a capture that claims something the geometry doesn't have).

**PROVE byte-identity; don't eyeball the diff.** The honest proof is a multiset `comm` compare of
the sorted tricount data rows (`FORM TRIS OK`, stripping the dragon-key column since tricount only
labels a dragon's FIRST form): **zero rows unique to BEFORE** (nothing shipped removed or changed)
+ **exactly 4 rows unique to AFTER** (tempest's 464/472/480/480). Roster total 148799 → 150695 tris,
49 → 53 models, all additions. The four prescribed suites stay green (blueprint 4/4 ·
`tricount --ci` 0-over · `starters` 286/0 · `creaturestress --ci` peak 88 UNCHANGED) — `starters`
holds because tempest isn't in its SPECS yet (its 4-form block lands with the ladder at I5). Smoke
(runtime flight) enters playing state with no errors — the two invisible-dragon crashes only ever
surfaced there, so it's the real render proof.

**Baseline hygiene — know which reds are yours.** `defs.mjs` was ALREADY red on clean master (SSSR
count 9≠7 — vesper+vesperLean shipped without `lanceTint`) and `economy.mjs` (`featPool` debt);
adding a correctly-formed SSSR `tempest` moves the count, it does not introduce the red. Gate on the
prescribed four; run the others only to ATTRIBUTE failures, never to gate on pre-existing debt.

**The I0 gate is CALIBRATION, not a beauty score (headless renders DO exist here).** Chromium +
Playwright are pre-installed, so `dragonstudio.mjs tempest` produces real COLOUR captures headlessly
(45 tiles) — we render in colour from turn one (the Revenant's costliest miss was trusting black-fill).
A fresh high-effort Fable harsh-critic calibrated the rubric against real Vesper + Solar tiles and
returned **PASS (scaffolding only)** — no veto trips, mount points / tail-line / proportions honest,
silhouette already non-Vesper. Locked bar for I1–I5: **avg ≥4.0 across {rear-chase silhouette
distinctiveness · surface/value richness · motion-readiness · identity-fidelity · SSSR appeal}, no
axis ≤2, the 3 binary vetoes** ("black Vesper clone" / "lit-seam Solar" / re-skinned-Revenant
bone-cage-lantern-bat-membrane). Sharpenings the critic added: anchor the scale to the benchmarks
(Vesper rear-chase = 4.5, Solar regalia = 5.0 — a "4" means "wouldn't embarrass the roster", no
grading on effort); judge the PALE tile for aesthetics but hold a SEPARATE dark-tile readability
floor (≥10% of body pixels L≥0.10 via diffuse rims, from I1); and **value claims must be MEASURED**
— a body-pixel HSL-percentile sampler (`decodePNG` from `tools/silhouetteCore.mjs`) is now part of
the gate.

**⚠ THE RED FLAG I0 CARRIES INTO I1 — the charcoal reads BLACK on screen.** The critic pixel-sampled
the stub: pale-tile body median **L 0.088** (f3) — barely 2.1× Vesper's 0.041 (so the albedo INTENT
is right) but less than HALF the ~0.17 on-screen floor. In game-light this body reads "black dragon"
= the Vesper-clone failure on colour alone. Not a veto trip for a stub, but **I1 fails Veto 1 if that
number doesn't roughly DOUBLE** (target pale-tile median L 0.17–0.28, p25 ≥0.12) — achieved by
albedo + hemisphere FILL, not emissive (§C.6/§C.7: verify the L band on the game-lit tile, not the
swatch). Two smaller I1 fixes flagged: a cool-navy cast on the placeholder membrane (desaturate to
S≤0.15) and a warm tan facet on the snout crop (attribute to LIGHT first per §C.6 — all four head
mats are cool charcoal, so it is the studio key on an up-facing facet, not a material bug). The
builder never judges its own output; the live judgment gate fires at I1 against the first REAL
cloud-mass, with the sampler enforcing the value band.

**What it unlocks.** I1 can now build `cumulonimbusTorso` for real — the billowed clover-loft
(the `knapLoft` PATTERN + a per-station profile rotation ±10–14°, the diagonal turbulence weave
that kills both rings AND straight strakes) + diffuse silver-lining rims + the scapular storm cowls
+ the CAGED DYNAMO storm-heart on the real transparent `coreGlow` hook — and gate its charcoal-L
band on the game-lit tile (not the swatch), with the silver rims held so they never out-read the
eyes. The strike clock and its pin already exist, waiting for the lightning at I4.
