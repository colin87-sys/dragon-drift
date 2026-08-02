# Jade premium CP5 — ladder the premium features DOWN the ascension forms (monotonic), + the guard

**Did.** Final checkpoint of the Jade Serpent premium pass. The four hero features (CP1 ribbed
fan-crown · CP2 body mass+ladder+scutes · CP3 withheld river-gleam · CP4 koi-mask head + tail
regalia) were all built **apex-only** and gated on the apex. CP5 ladders a graduated subset DOWN to
the two lower forms so ascension **progressively confers** the premium look — a whelp → adolescent →
radiant arc, not a binary "legacy → full apex" jump — while keeping the deepest features as the
coronation reward. Added a permanent monotonic-ladder test. Roster stays byte-identical for every
other dragon (all jade-gated).

**The shipped ladder (resolved per tier, via `ascendedDef` accretion):**
| dial | T0 Hatchling | T1 Kindled | T2 Radiant | note |
|---|---|---|---|---|
| `fanRays` (crown pleats) | 0 (smooth buds) | 5 | 7 | the crown BUDS at T1 ("lobes unfurl"), blooms at apex |
| `girthFull` (mass floor) | 1.25 | 1.5 | 1.7 | chubby pup → held mid-mass → apex |
| `strakeLadder` | on | on | on | cheap paint, ties the whole family to the jade value ladder |
| `scuteBand` | — | on (count 10, dimmer) | on (count 12, brighter) | ventral plates coarsen/brighten to apex |
| `riverGleam` (`gleamBase`) | — | 0.45 (dim dew) | 0.85 (full flood) | the withheld gleam buds, floods at apex |
| `koiMask` (head chisel) | 0 (cute pup eye) | 0.6 (light) | 1.0 (full mask) | the angular mask sharpens with age |
| `tailRegalia` | — | — | on | **coronation reward** — the full ribbed koi-fin tail is apex-exclusive |

Tri ladder came out clean-monotonic and all under the 6000 ceiling: **3156 → 4988 → 5472**. (T1
jumped 4316→4988 from the ribbed fans + scutes + gleam; the ribbed fan's single-winding partly offsets
its own cost, so it stays affordable even mid-ladder.)

**The design law (why not just ship apex-only):** apex-only is *safe* but reads as a binary jump —
the pup and adolescent look like unrelated smaller dragons. The roster's whole ascension promise is
"the SAME dragon growing, coronation-rewarded at apex" (the existing `moonTail`/`caudalBloom`/
`rayRelief` scalars already ladder this way). So each premium dial gets a **budding rung** at T1 and
its **bloom** at T2, and one or two of the richest features (here `tailRegalia`, and the fully
saturated flood + gem eye) stay **withheld to the apex** so ascending still delivers a payoff. The
tier montage (`tiershots jade`) is the proof frame: pup with fan-buds → adolescent with budding
crowns + whiskers → radiant apex with full crowns + leaf-fork.

**The guard (new permanent test `tests/jadeladder.mjs`, 21 asserts):** locks the ladder so a future
form edit can't silently invert it. Asserts, per adjacent tier pair: `fanRays`, `girthFull`,
`gleamBase`, `koiMask`, `strakeLadder` are **non-decreasing** with tier; the apex still carries the
FULL hero set (`fanRays≥7`, `riverGleam`, `tailRegalia`, `scuteBand`, `koiMask≥1`); and the welded
triangle count is **non-decreasing AND ≤6000** at every tier. Reads the resolved `def.model` per tier
(nullable dials floor to 0/false for the compare — a missing dial is "the least premium," which is
exactly the ladder floor). This is the CP5 analogue of the CP1 NaN-color guard: a cheap invariant
that catches a whole class of silent regression.

**Reusable takeaways.** (1) Ladder a premium feature by giving it a *budding rung* mid-ascension and
its *bloom* at apex, not a binary on/off — the ascension arc should read as one creature maturing.
(2) Keep one or two of the richest features apex-exclusive so ascending still pays off (the coronation
reward). (3) Floor nullable dials to 0/false for a monotonic compare — "absent" = "least premium" =
the ladder floor, so the assert is clean. (4) Lock the ladder with a monotonic-invariant test the
moment you build it; it's the cheapest possible guard against a future form edit inverting the arc.
(5) `tiershots <key>` is the one-glance proof that the ladder reads as growth, not three unrelated
sizes. (6) Everything still jade-gated → the rest of the roster is byte-identical; the ladder is
additive, not a refactor.
